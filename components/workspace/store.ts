'use client';

import { useSyncExternalStore } from 'react';
import { type Job, STORAGE_KEY, parseStoredJobs, seedJobs } from '@/lib/model';

type Snapshot = { jobs: Job[]; persistent: boolean };
const serverSnapshot: Snapshot = { jobs: seedJobs(), persistent: true };
let snapshot: Snapshot | undefined;
const listeners = new Set<() => void>();

function read(): Snapshot {
  try { return { jobs: parseStoredJobs(window.localStorage.getItem(STORAGE_KEY)) ?? seedJobs(), persistent: true }; }
  catch { return { jobs: seedJobs(), persistent: false }; }
}
function getSnapshot(): Snapshot { return snapshot ??= read(); }
function getServerSnapshot(): Snapshot { return serverSnapshot; }
function emit() { listeners.forEach(listener => listener()); }
function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) { snapshot = read(); emit(); }
}
function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener('storage', onStorage);
  };
}
function commit(jobs: Job[]) {
  if (jobs.length > 500) throw new Error('The preview supports up to 500 local jobs. Reset the sample workspace to start again.');
  let persistent = true;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, jobs })); }
  catch { persistent = false; }
  snapshot = { jobs, persistent }; emit();
}
export function updateJob(id: string, transform: (job: Job) => Job) {
  const current = getSnapshot().jobs;
  if (!current.some(job => job.id === id)) throw new Error('This job is no longer in the workspace.');
  commit(current.map(job => job.id === id ? transform(job) : job));
}
export function insertJob(job: Job) {
  const current = getSnapshot().jobs;
  if (current.some(existing => existing.id === job.id)) throw new Error('This job ID already exists. Please try again.');
  commit([job, ...current]);
}
export function resetJobs() { commit(seedJobs()); }
export function useJobs(): Snapshot { return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot); }
