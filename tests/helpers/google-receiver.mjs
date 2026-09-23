/** TEST ONLY: runs the real Apps Script source against a simulated Sheets API. */
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
export const TEST_URL = 'https://script.google.com/macros/s/phototrackly-test-only/exec';
export const TEST_SECRET = 'test-only-google-webhook-secret-never-deploy';
export function createReceiver({ file, secret = TEST_SECRET } = {}) {
  let rows = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const rates = new Map();
  const messages = [];
  let flushes = 0;
  const controls = { busy: false, fail: false, locked: false, mailFail: false, quota: 100, statusFail: false, flushFail: false };
  function range(row, col, count = 1, columns = 1) {
    return {
      getValues: () => Array.from({ length: count }, (_, r) => Array.from({ length: columns }, (_, c) => rows[row + r - 1]?.[col + c - 1] ?? '')),
      getValue: () => rows[row - 1]?.[col - 1] ?? '',
      setValue: value => { if (controls.statusFail) throw new Error('Status unavailable'); rows[row - 1] ||= []; rows[row - 1][col - 1] = value; },
      setValues: values => { values.forEach((line, r) => { rows[row + r - 1] ||= []; line.forEach((value, c) => { rows[row + r - 1][col + c - 1] = value; }); }); },
      createTextFinder: text => ({ matchEntireCell: () => ({ findNext: () => {
        const i = rows.findIndex((line, index) => index >= row - 1 && index < row - 1 + count && line[col - 1] === text);
        return i < 0 ? null : { getRow: () => i + 1 };
      } }) }),
    };
  }
  const sheet = { getLastRow: () => rows.length, getRange: range, appendRow: row => rows.push(row), deleteRow: n => rows.splice(n - 1, 1) };
  const context = createContext({
    console: { error() {}, log() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => secret }) },
    LockService: { getScriptLock: () => ({ tryLock: () => (controls.locked = !controls.busy), releaseLock: () => { controls.locked = false; } }) },
    CacheService: { getScriptCache: () => ({ get: key => rates.get(key), put: (key, value) => rates.set(key, value) }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: text => ({ setMimeType: () => text }) },
    MailApp: {
      getRemainingDailyQuota: () => controls.quota,
      sendEmail: message => {
        if (controls.mailFail) throw new Error('Mail unavailable');
        messages.push({ ...message, savedAtSend: rows.length > 1 && flushes > 0 });
        controls.quota--;
      },
    },
    SpreadsheetApp: {
      openById: id => { if (id !== '1Vqoauc6MORXZ8cwlTX7eKHXLfju3zKE-uS7wbwitJkE' || controls.fail) throw new Error('Unavailable'); return { getSheetByName: name => name === 'Leads' ? sheet : null }; },
      flush: () => { if (controls.flushFail) throw new Error('Write unavailable'); flushes++; if (file) { writeFileSync(file + '.tmp', JSON.stringify(rows)); renameSync(file + '.tmp', file); } },
    },
  });
  runInContext(readFileSync(new URL('../../integrations/google-apps-script/Code.gs', import.meta.url), 'utf8'), context);
  return { rows: () => rows, controls, messages: () => messages, sendTestEmail: () => context.sendTestEmail(), post: body => JSON.parse(context.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } })) };
}
