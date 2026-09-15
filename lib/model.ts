export const DEMO_DATE = '2026-09-15';
export const STORAGE_KEY = 'phototrackly.next.preview.v1';
export const TEAM = ['Marcus Vance', 'Harper Lee', 'Sofia Chen', 'Adam Rivera'] as const;
export const SERVICES = ['Photography', 'Video', 'Drone', 'Floor plan', 'Twilight', 'Virtual tour'] as const;
export const REVIEW_CHECKS = ['Coverage & composition', 'Verticals & alignment', 'Color & exposure', 'File names & service package'] as const;
export const VIEWS = { pipeline: 'Job pipeline', schedule: 'Shoot schedule', review: 'Media review', delivery: 'Client delivery' } as const;
export type View = keyof typeof VIEWS;
export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export type Asset = { id: string; name: string; size: number; type: string };
export type Activity = { text: string; time: string };
export type Job = {
  id: string; address: string; city: string; client: string; stage: Stage;
  photographer: string; services: string[]; date: string; time: string;
  notes: string; fileCount: number; files: Asset[]; checks: boolean[];
  approved: boolean; activity: Activity[];
};
export type JobInput = Pick<Job, 'address' | 'city' | 'client' | 'photographer' | 'services' | 'date' | 'time' | 'notes'>;

export const STAGES = [
  { name: 'Booked', short: 'Create the job', icon: 'folder', owner: 'Coordinator', title: 'A good shoot starts with the details.', description: 'Bring the property, client, services, and instructions together. One job becomes the shared starting point for everyone.', fields: [['Property', '740 Ocean View Drive'], ['Client', 'Westside Property Group'], ['Services', 'Photography · Drone · Floor plan']] },
  { name: 'Scheduled', short: 'Schedule & assign', icon: 'calendar', owner: 'Coordinator → Photographer', title: 'The right context. The right person.', description: 'Choose a shoot time and assign a photographer manually. Keep the schedule and access notes attached to the property job.', fields: [['Photographer', 'Marcus Vance'], ['Shoot time', 'Tuesday, 9:00 AM'], ['Access', 'Meet the agent at the front gate']] },
  { name: 'Source files', short: 'Capture & upload', icon: 'upload', owner: 'Photographer → Editor', title: 'Every file has a place to land.', description: 'Keep source files and shoot notes with the original property job, ready for the editing handoff.', fields: [['Property job', 'PT-0842'], ['Source package', 'Photography + drone imagery'], ['Next owner', 'Editing team']] },
  { name: 'Editing', short: 'Edit & produce', icon: 'brush', owner: 'Editor', title: 'Clear instructions. A visible next step.', description: 'See who owns the edit, what the package needs, and what is still in progress. Keep production notes out of disconnected threads.', fields: [['Editor', 'Linh Nguyen'], ['Package', 'Property photos & drone imagery'], ['Next step', 'Send deliverables for review']] },
  { name: 'In review', short: 'Review & refine', icon: 'eye', owner: 'Reviewer → Editor', title: 'Room for feedback, not guesswork.', description: 'Review the deliverables, record feedback, and distinguish approved work from revisions. Your team makes the creative decisions.', fields: [['Reviewer', 'Alex Morgan'], ['Checklist', 'Coverage · alignment · exposure'], ['Decision', 'Approve or request changes']] },
  { name: 'Delivered', short: 'Deliver to the client', icon: 'send', owner: 'Coordinator → Client', title: 'A clear finish to a connected job.', description: 'Keep approved media and the final client handoff connected to the job that started it all. Everyone can see where the work stands.', fields: [['Client', 'Westside Property Group'], ['Approved package', 'Photography · Drone · Floor plan'], ['Handoff', 'Client delivery recorded']] },
] as const;

const rows: [string, string, string, string, Stage, string, string[], string, number][] = [
  ['PT-0842', '740 Ocean View Drive', 'Malibu, CA', 'Westside Property Group', 4, 'Marcus Vance', ['Photography', 'Drone', 'Floor plan'], '09:00', 32],
  ['PT-0843', '18 Harbour Street', 'Sydney, NSW', 'Harbour & Home', 1, 'Harper Lee', ['Photography', 'Video'], '10:30', 0],
  ['PT-0844', '128 Cedar Lane', 'Austin, TX', 'Cedar Residential', 2, 'Adam Rivera', ['Photography', 'Floor plan'], '11:00', 24],
  ['PT-0845', '56 The Esplanade', 'Melbourne, VIC', 'Coastline Property', 3, 'Sofia Chen', ['Photography', 'Twilight'], '14:00', 28],
  ['PT-0846', '92 Westlake Drive', 'Austin, TX', 'Westside Property Group', 3, 'Marcus Vance', ['Photography', 'Drone'], '13:00', 36],
  ['PT-0847', '405 Pacific Avenue', 'Los Angeles, CA', 'Pacific Partners', 0, '', ['Photography', 'Video', 'Drone'], '15:00', 0],
  ['PT-0848', '22 Palm Crescent', 'Brisbane, QLD', 'Palm Residential', 5, 'Harper Lee', ['Photography', 'Floor plan'], '08:00', 22],
  ['PT-0849', '16 Maple Court', 'San Diego, CA', 'Maple & Co.', 4, 'Adam Rivera', ['Photography'], '12:00', 18],
  ['PT-0850', '68 Parkside Avenue', 'Austin, TX', 'Parkside Homes', 1, 'Sofia Chen', ['Photography', 'Drone'], '16:00', 0],
];

export function seedJobs(): Job[] {
  return rows.map(([id, address, city, client, stage, photographer, services, time, fileCount]) => ({
    id, address, city, client, stage, photographer, services: [...services], time, fileCount,
    date: DEMO_DATE, files: [], notes: id === 'PT-0842' ? 'Meet the agent at the front gate. Prioritize the pool, open-plan living space, and north-facing exterior.' : 'Confirm access with the agent before arriving. Include all requested services.',
    checks: stage === 5 ? [true, true, true, true] : [true, true, true, false],
    approved: stage === 5,
    activity: [{ text: 'Illustrative job added to the sample workspace.', time: '2026-09-15T08:00:00.000Z' }],
  }));
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validTime(value: string): boolean { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export function validateJobInput(input: JobInput): JobInput {
  const result = { ...input, address: input.address.trim(), city: input.city.trim(), client: input.client.trim(), notes: input.notes.trim() };
  if (!result.address || !result.city || !result.client) throw new Error('Add the property address, city, and client.');
  if ([result.address, result.city, result.client].some(x => x.length > 160) || result.notes.length > 4000) throw new Error('Please shorten the property details or notes.');
  if (!validDate(result.date) || !validTime(result.time)) throw new Error('Choose a valid shoot date and time.');
  if (result.photographer && !(TEAM as readonly string[]).includes(result.photographer)) throw new Error('Choose a photographer from the sample team.');
  if (!result.services.length || result.services.some(x => !(SERVICES as readonly string[]).includes(x))) throw new Error('Select at least one supported service.');
  result.services = [...new Set(result.services)];
  return result;
}
export function createJob(input: JobInput, id: string): Job {
  return { ...validateJobInput(input), id, stage: 0, fileCount: 0, files: [], checks: [false, false, false, false], approved: false, activity: [{ text: 'Property job created in this browser.', time: new Date().toISOString() }] };
}
export function addActivity(job: Job, text: string): Job {
  return { ...job, activity: [{ text, time: new Date().toISOString() }, ...job.activity].slice(0, 100) };
}
export function moveJob(job: Job, target: Stage): Job {
  if (!Number.isInteger(target) || target < 0 || target > 5) throw new Error('Choose a valid workflow stage.');
  if (target === job.stage) return job;
  if (target > job.stage + 1) throw new Error('Move the job one stage at a time so no handoff is skipped.');
  if (target === 1 && (!job.photographer || !validDate(job.date) || !validTime(job.time))) throw new Error('Assign a photographer and a valid shoot time before scheduling.');
  if (target === 3 && job.stage < 3 && job.fileCount === 0) throw new Error('Attach source-file records before starting the edit.');
  if (target === 5 && (!job.approved || !job.checks.every(Boolean))) throw new Error('Complete the review checklist and approve this job before delivery.');
  return addActivity({ ...job, stage: target, approved: target === 5 ? job.approved : false, checks: target < 4 ? [false, false, false, false] : job.checks }, `Moved to ${STAGES[target].name}.`);
}
export function approveJob(job: Job): Job {
  if (job.stage !== 4 || job.checks.length !== 4 || !job.checks.every(Boolean)) throw new Error('Complete all four review checks before approval.');
  return addActivity({ ...job, approved: true }, 'Human review approved. Ready for the client handoff.');
}
export function requestRevision(job: Job, note: string): Job {
  if (job.stage !== 4) throw new Error('Only jobs in review can be sent back for revision.');
  if (!note.trim() || note.length > 2000) throw new Error('Add a revision note of 1–2,000 characters.');
  return addActivity({ ...job, stage: 3, approved: false, checks: [false, false, false, false] }, `Revision requested: ${note.trim()}`);
}
export function jobStatus(job: Job): string { return job.stage === 4 && job.approved ? 'Ready for delivery' : STAGES[job.stage].name; }
export function initials(name: string): string { return name ? name.split(' ').map(x => x[0]).slice(0, 2).join('') : '—'; }
export function formatDate(value: string): string { return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
export function formatTime(value: string): string { const [h, m] = value.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; }
export function csvCell(value: unknown): string { const raw = String(value ?? ''); const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw; return `"${safe.replaceAll('"', '""')}"`; }
export function jobsCsv(jobs: Job[]): string {
  const header = ['Job ID', 'Property', 'City', 'Client', 'Stage', 'Photographer', 'Services', 'Date', 'Time'];
  const body = jobs.map(j => [j.id, j.address, j.city, j.client, jobStatus(j), j.photographer, j.services.join('; '), j.date, j.time]);
  return [header, ...body].map(row => row.map(csvCell).join(',')).join('\r\n');
}

function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function shortString(value: unknown, max = 4000): value is string { return typeof value === 'string' && value.length <= max; }
export function isJob(value: unknown): value is Job {
  if (!record(value)) return false;
  const j = value;
  if (!['id', 'address', 'city', 'client', 'photographer', 'date', 'time', 'notes'].every(k => shortString(j[k]))) return false;
  if (!Number.isInteger(j.stage) || Number(j.stage) < 0 || Number(j.stage) > 5 || !validDate(String(j.date)) || !validTime(String(j.time))) return false;
  if (j.photographer && !(TEAM as readonly unknown[]).includes(j.photographer)) return false;
  if (!Array.isArray(j.services) || !j.services.length || j.services.length > SERVICES.length || !j.services.every(x => (SERVICES as readonly unknown[]).includes(x))) return false;
  if (!Array.isArray(j.checks) || j.checks.length !== 4 || !j.checks.every(x => typeof x === 'boolean') || typeof j.approved !== 'boolean') return false;
  if (j.approved && (Number(j.stage) < 4 || !j.checks.every(Boolean))) return false;
  if (!Number.isSafeInteger(j.fileCount) || Number(j.fileCount) < 0 || Number(j.fileCount) > 100000) return false;
  if (!Array.isArray(j.files) || j.files.length > 500 || !j.files.every(f => record(f) && shortString(f.id, 100) && shortString(f.name, 500) && shortString(f.type, 200) && typeof f.size === 'number' && Number.isFinite(f.size) && f.size >= 0)) return false;
  return Array.isArray(j.activity) && j.activity.length <= 100 && j.activity.every(a => record(a) && shortString(a.text, 4500) && shortString(a.time, 100));
}
export function parseStoredJobs(raw: string | null): Job[] | null {
  if (!raw || raw.length > 2000000) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!record(data) || data.version !== 1 || !Array.isArray(data.jobs) || data.jobs.length > 500 || !data.jobs.every(isJob)) return null;
    if (new Set(data.jobs.map(j => j.id)).size !== data.jobs.length) return null;
    return data.jobs;
  } catch { return null; }
}

export type Registration = { email: string; company: string; role: string; market: string; website: string };
export function validateRegistration(value: unknown): Registration {
  if (!record(value)) throw new Error('Enter your work email and company.');
  for (const key of ['email', 'company']) if (typeof value[key] !== 'string') throw new Error('Enter your work email and company.');
  for (const key of ['role', 'market', 'website']) if (value[key] !== undefined && typeof value[key] !== 'string') throw new Error('Invalid optional field.');
  const email = String(value.email).trim(); const company = String(value.company).trim();
  const role = String(value.role ?? '').trim(); const market = String(value.market ?? '').trim(); const website = String(value.website ?? '').trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid work email.');
  if (!company || company.length > 120) throw new Error('Enter a company name of 1–120 characters.');
  if (role.length > 100 || market.length > 100 || website.length > 200) throw new Error('Please shorten the optional fields.');
  return { email, company, role, market, website };
}
