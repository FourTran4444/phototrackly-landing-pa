/** Explicit Node preload used ONLY by the browser-test command. Not imported by the app. */
import { createReceiver, TEST_URL } from './google-receiver.mjs';
if (process.env.VERCEL) throw new Error('The Google test double must never run on Vercel');
if (!process.env.PHOTOTRACKLY_TEST_SHEET_FILE) throw new Error('Missing isolated test sheet file');
const receiver = createReceiver({ file: process.env.PHOTOTRACKLY_TEST_SHEET_FILE });
const original = globalThis.fetch;
globalThis.fetch = async function (url, options) {
  const target = url instanceof Request ? url.url : String(url);
  if (target === TEST_URL) {
    const body = options?.body || (url instanceof Request ? await url.clone().text() : '{}');
    return new Response(JSON.stringify(receiver.post(body)), { headers: { 'Content-Type': 'application/json' } });
  }
  return original.call(this, url, options);
};
