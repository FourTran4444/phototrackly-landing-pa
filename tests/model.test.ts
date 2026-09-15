import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approveJob, createJob, csvCell, DEMO_DATE, isJob, jobsCsv, moveJob,
  parseStoredJobs, requestRevision, seedJobs, validateJobInput,
  validateRegistration, validDate, validTime, type JobInput,
} from '../lib/model.ts';

const input: JobInput = {
  address: ' 14 Test Avenue ', city: ' Austin, TX ', client: ' Example Studio ',
  photographer: 'Marcus Vance', services: ['Photography'], date: DEMO_DATE,
  time: '09:00', notes: ' Sample instructions. ',
};

test('sample jobs are fresh, valid, fictional records', () => {
  const a = seedJobs(); const b = seedJobs();
  assert.equal(a.length, 9);
  assert.ok(a.every(isJob));
  a[0].services.push('Video'); a[0].checks[0] = false;
  assert.notDeepEqual(a[0].services, b[0].services);
  assert.equal(b[0].checks[0], true);
});
test('dates reject impossible calendar days and accept leap days', () => {
  assert.ok(validDate('2024-02-29'));
  assert.ok(validDate(DEMO_DATE));
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', 'bad', '2026-9-15']) assert.equal(validDate(value), false);
});
test('time validation requires a real 24-hour time', () => {
  for (const value of ['00:00', '09:30', '23:59']) assert.ok(validTime(value));
  for (const value of ['24:00', '13:60', '9:00', '', 'noon']) assert.equal(validTime(value), false);
});
test('job input trims fields and deduplicates supported services', () => {
  const result = validateJobInput({ ...input, services: ['Photography', 'Photography'] });
  assert.equal(result.address, '14 Test Avenue');
  assert.equal(result.notes, 'Sample instructions.');
  assert.deepEqual(result.services, ['Photography']);
});
test('job input requires property, client, services, and valid schedule details', () => {
  for (const override of [{ address: '' }, { city: '' }, { client: '' }, { services: [] }, { services: ['Unsupported'] }, { time: '25:00' }, { date: '2026-02-30' }, { photographer: 'Unknown' }]) {
    assert.throws(() => validateJobInput({ ...input, ...override }));
  }
});
test('a new job begins booked without files or approval', () => {
  const job = createJob(input, 'PT-TEST');
  assert.ok(isJob(job)); assert.equal(job.stage, 0); assert.equal(job.fileCount, 0);
  assert.equal(job.approved, false); assert.deepEqual(job.checks, [false, false, false, false]);
});
test('scheduling requires a manually assigned photographer', () => {
  assert.throws(() => moveJob(createJob({ ...input, photographer: '' }, 'PT-TEST'), 1), /Assign a photographer/);
  const job = createJob(input, 'PT-TEST');
  assert.equal(moveJob(job, 1).stage, 1); assert.equal(job.stage, 0);
});
test('forward transitions cannot skip a handoff', () => {
  assert.throws(() => moveJob(createJob(input, 'PT-TEST'), 3), /one stage at a time/);
});
test('editing requires source-file records', () => {
  const source = { ...createJob(input, 'PT-TEST'), stage: 2 as const };
  assert.throws(() => moveJob(source, 3), /source-file records/);
  assert.equal(moveJob({ ...source, fileCount: 1 }, 3).stage, 3);
});
test('human approval requires all four review checks', () => {
  const job = seedJobs()[0];
  assert.throws(() => approveJob(job), /four review checks/);
  const approved = approveJob({ ...job, checks: [true, true, true, true] });
  assert.equal(approved.approved, true); assert.equal(job.approved, false);
});
test('a checked checklist alone does not bypass human approval for delivery', () => {
  const job = { ...seedJobs()[0], checks: [true, true, true, true] };
  assert.throws(() => moveJob(job, 5), /approve this job/);
  assert.equal(moveJob(approveJob(job), 5).stage, 5);
});
test('reopening a delivered job invalidates its previous approval', () => {
  const reopened = moveJob(seedJobs()[6], 4);
  assert.equal(reopened.stage, 4); assert.equal(reopened.approved, false);
});
test('revision notes return work to editing and clear the previous review', () => {
  const job = seedJobs()[0];
  assert.throws(() => requestRevision(job, '   '), /revision note/);
  const revised = requestRevision(job, ' Please review the window exposure. ');
  assert.equal(revised.stage, 3); assert.equal(revised.approved, false);
  assert.ok(revised.checks.every(check => !check));
  assert.match(revised.activity[0].text, /Please review the window exposure/);
});
test('CSV escapes commas, quotes, and spreadsheet formulas', () => {
  assert.equal(csvCell('A, B'), '"A, B"');
  assert.equal(csvCell('A "quoted" value'), '"A ""quoted"" value"');
  assert.equal(csvCell('=SUM(1,1)'), '"\'=SUM(1,1)"');
  assert.equal(csvCell('  +1'), '"\'  +1"');
  assert.match(jobsCsv(seedJobs()), /^"Job ID","Property"/);
  assert.ok(jobsCsv(seedJobs()).includes('\r\n'));
});
test('storage accepts the current schema, including an intentionally empty workspace', () => {
  const jobs = seedJobs();
  assert.deepEqual(parseStoredJobs(JSON.stringify({ version: 1, jobs })), jobs);
  assert.deepEqual(parseStoredJobs('{"version":1,"jobs":[]}'), []);
});
test('storage rejects broken JSON, obsolete schemas, duplicate IDs, and invalid records', () => {
  assert.equal(parseStoredJobs('{broken'), null);
  assert.equal(parseStoredJobs(JSON.stringify({ version: 2, jobs: seedJobs() })), null);
  const duplicate = seedJobs(); duplicate[1].id = duplicate[0].id;
  assert.equal(parseStoredJobs(JSON.stringify({ version: 1, jobs: duplicate })), null);
  const invalid = seedJobs(); invalid[0].checks = [true];
  assert.equal(parseStoredJobs(JSON.stringify({ version: 1, jobs: invalid })), null);
});
test('invalid approval cannot be restored from browser storage', () => {
  assert.equal(isJob({ ...seedJobs()[0], approved: true, checks: [true, false, true, true] }), false);
});
test('registration only requires email and company and whitelists output', () => {
  assert.deepEqual(validateRegistration({ email: ' studio@example.com ', company: ' My Studio ', arbitrary: 'do not forward' }), {
    email: 'studio@example.com', company: 'My Studio', role: '', market: '', website: '',
  });
});
test('registration rejects malformed or oversized fields', () => {
  for (const value of [null, {}, { email: 'bad', company: 'Studio' }, { email: 'a@example.com', company: '' }, { email: 'a@example.com', company: 'x'.repeat(121) }, { email: 'a@example.com', company: 'Studio', role: [] }]) {
    assert.throws(() => validateRegistration(value));
  }
});
