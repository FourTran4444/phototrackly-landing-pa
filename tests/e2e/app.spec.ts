import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const storageKey = 'phototrackly.next.preview.v1';
async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();
}

test('landing tabs, workflow, and FAQs are interactive and keyboard accessible', async ({ page }) => {
  await goto(page, '/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Less chasing.');
  await page.getByRole('tab', { name: 'Studio owners', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your team’s progress. Not just your inbox.' })).toBeVisible();
  await page.getByRole('tab', { name: 'Studio owners', exact: true }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Photographers', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Arrive ready. Get back to creating.' })).toBeVisible();
  await page.getByRole('tab', { name: /02.*Schedule & assign/ }).click();
  await expect(page.locator('#workflow-panel')).toContainText('The right context. The right person.');
  await page.locator('.faq-item').first().locator('summary').click();
  await expect(page.locator('.faq-item').first().locator('p')).toContainText('Not yet.');
});

test('unconnected early access is clearly a local draft, never a fake registration', async ({ page }) => {
  await goto(page, '/');
  await page.getByLabel('Work email', { exact: false }).fill('preview@example.com');
  await page.getByLabel('Studio / company name').fill('Preview Studio');
  await page.getByRole('button', { name: 'Save early-access draft' }).click();
  await expect(page.getByRole('heading', { name: 'Your interest draft is saved.' })).toBeVisible();
  await expect(page.locator('.form-success')).toContainText('not sent to PhotoTrackly');
  await expect(page.locator('.form-success')).not.toContainText('Application received');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Load a saved draft' }).click();
  await expect(page.getByLabel('Studio / company name')).toHaveValue('Preview Studio');
});

test('creates a property job and preserves it after reload', async ({ page }) => {
  await goto(page, '/workspace/pipeline');
  await page.getByRole('button', { name: 'New property job', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Property address', { exact: false }).fill('123 Integration Avenue');
  await page.getByLabel('City / region').fill('Austin, TX');
  await page.getByLabel('Client / agency').fill('Integration Studio');
  await page.getByLabel('Photographer', { exact: true }).selectOption('Marcus Vance');
  await page.getByRole('button', { name: 'Create property job' }).click();
  await expect(page.getByRole('dialog')).toContainText('123 Integration Avenue');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByLabel('Search jobs').fill('123 Integration');
  await expect(page.getByRole('button', { name: 'Open job 123 Integration Avenue' })).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByLabel('Search jobs').fill('123 Integration');
  await expect(page.getByRole('button', { name: 'Open job 123 Integration Avenue' })).toBeVisible();
  await page.getByRole('button', { name: 'Table view' }).click();
  await expect(page.locator('tbody')).toContainText('123 Integration Avenue');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});

test('native dialogs close with Escape and return keyboard focus', async ({ page }) => {
  await goto(page, '/workspace/pipeline');
  const opener = page.getByRole('button', { name: 'New property job', exact: true });
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('search and filters include a usable empty state', async ({ page }) => {
  await goto(page, '/workspace/pipeline');
  await page.getByLabel('Search jobs').fill('This property does not exist');
  await expect(page.getByRole('heading', { name: 'No jobs match those filters.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByLabel('Filter by photographer').selectOption('unassigned');
  await expect(page.locator('.job-card')).toHaveCount(1);
  await expect(page.locator('.job-card')).toContainText('405 Pacific Avenue');
});

test('job-stage controls prevent skipping handoffs', async ({ page }) => {
  await goto(page, '/workspace/pipeline');
  await page.getByRole('button', { name: 'Open job 405 Pacific Avenue' }).click();
  await page.getByLabel('WORKFLOW STAGE').selectOption('5');
  await expect(page.locator('.drawer-message')).toContainText('one stage at a time');
  await page.getByRole('button', { name: 'Next: Scheduled' }).click();
  await expect(page.locator('.drawer-message')).toContainText('Assign a photographer');
});

test('manual assignment updates the shoot schedule and date navigation works', async ({ page }) => {
  await goto(page, '/workspace/schedule');
  await page.getByRole('button', { name: '405 Pacific Avenue' }).click();
  await page.getByLabel('Photographer', { exact: true }).selectOption('Sofia Chen');
  await page.getByRole('button', { name: 'Save job details' }).click();
  await page.getByRole('button', { name: 'Next: Scheduled' }).click();
  await expect(page.locator('.drawer-message')).toContainText('next stage');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.schedule-lane').filter({ has: page.getByRole('heading', { name: 'Sofia Chen' }) })).toContainText('405 Pacific Avenue');
  await page.getByRole('button', { name: 'Next day', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little breathing room.' })).toBeVisible();
  await page.getByRole('button', { name: 'Sample day' }).click();
  await expect(page.locator('.schedule-lanes')).toBeVisible();
});

test('file controls retain metadata only and support the source-to-edit handoff', async ({ page }) => {
  await goto(page, '/workspace/pipeline');
  await page.getByRole('button', { name: 'Open job 128 Cedar Lane' }).click();
  await page.getByRole('tab', { name: 'File records', exact: true }).click();
  await page.getByLabel('Add source-file records', { exact: true }).setInputFiles({ name: 'example-source.txt', mimeType: 'text/plain', buffer: Buffer.from('not uploaded or retained') });
  await expect(page.locator('.file-list')).toContainText('example-source.txt');
  await expect(page.locator('.drawer-message')).toContainText('No file contents were uploaded');
  const value = await page.evaluate(key => localStorage.getItem(key), storageKey);
  expect(value).toContain('example-source.txt');
  expect(value).not.toContain('not uploaded or retained');
  await page.getByRole('button', { name: 'Next: Editing' }).click();
  await expect(page.getByLabel('WORKFLOW STAGE')).toHaveValue('3');
});

test('human review gates approval, delivery, and metadata export', async ({ page }) => {
  await goto(page, '/workspace/review');
  await expect(page.getByRole('button', { name: 'Approve for delivery', exact: true })).toBeDisabled();
  await page.getByLabel('File names & service package').check();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reset image zoom' })).toHaveText('125%');
  await page.getByRole('button', { name: 'Approve for delivery', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Approved for delivery', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Go to client delivery' }).click();
  const card = page.locator('.delivery-card').filter({ has: page.getByRole('heading', { name: '740 Ocean View Drive', exact: true }) });
  await card.getByRole('button', { name: 'Mark as delivered', exact: true }).click();
  await card.getByRole('link', { name: 'Open local delivery preview' }).click();
  await expect(page).toHaveURL(/\/delivery\/PT-0842$/);
  await expect(page.locator('.delivery-notice')).toContainText('No media is hosted');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download metadata manifest' }).click();
  expect((await downloaded).suggestedFilename()).toBe('PT-0842-preview-manifest.json');
});

test('revision requests return the job to editing and retain the note', async ({ page }) => {
  await goto(page, '/workspace/review');
  await page.getByLabel('Revision notes').fill('Please check the exterior window exposure.');
  await page.getByRole('button', { name: 'Request revisions' }).click();
  await expect(page.locator('.review-property-detail h2')).toHaveText('16 Maple Court');
  const record = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), storageKey);
  const job = record.jobs.find((item: { id: string }) => item.id === 'PT-0842');
  expect(job.stage).toBe(3); expect(job.approved).toBe(false);
  expect(job.activity[0].text).toContain('exterior window exposure');
});

test('corrupt local storage falls back safely to the sample workspace', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '{invalid-json'), storageKey);
  await goto(page, '/workspace/pipeline');
  await expect(page.getByTestId('job-PT-0842')).toBeVisible();
  await expect(page.locator('.job-card')).toHaveCount(9);
});

test('blocked storage uses an honest in-memory fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked for test'); } });
  });
  await goto(page, '/workspace/pipeline');
  await expect(page.locator('.demo-notice')).toContainText('Browser storage is unavailable');
  await expect(page.locator('.job-card')).toHaveCount(9);
});

test('real routes load directly without browser runtime errors or page overflow', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/workspace/pipeline', '/workspace/schedule', '/workspace/review', '/workspace/delivery', '/delivery/PT-0848']) {
    await goto(page, path);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow on ${path}`).toBe(true);
  }
  expect(errors).toEqual([]);
  if (isMobile) {
    await goto(page, '/workspace/pipeline');
    await page.getByRole('button', { name: 'Toggle workspace navigation' }).click();
    await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('link', { name: 'Shoot schedule' }).click();
    await expect(page).toHaveURL(/\/workspace\/schedule$/);
    await expect(page.getByRole('button', { name: 'Toggle workspace navigation' })).toHaveAttribute('aria-expanded', 'false');
  }
});

test('unknown routes show a useful 404', async ({ page }) => {
  const response = await page.goto('/workspace/not-a-real-view', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'This page isn’t in the picture.' })).toBeVisible();
});

test('early-access API validates requests and fails honestly without a collector', async ({ request }) => {
  const valid = { email: 'preview@example.com', company: 'Preview Studio' };
  expect((await request.post('/api/early-access', { data: valid })).status()).toBe(503);
  expect((await request.post('/api/early-access', { data: { email: 'bad', company: 'Preview' } })).status()).toBe(400);
  expect((await request.post('/api/early-access', { headers: { 'content-type': 'text/plain' }, data: 'hello' })).status()).toBe(415);
  expect((await request.post('/api/early-access', { headers: { origin: 'https://untrusted.example' }, data: valid })).status()).toBe(403);
  expect((await request.post('/api/early-access', { data: { ...valid, company: 'x'.repeat(9000) } })).status()).toBe(413);
  expect((await request.post('/api/early-access', { data: { ...valid, website: 'honeypot' } })).status()).toBe(200);
});

test('capture the rendered landing and workspace screens', async ({ page }, testInfo) => {
  await mkdir('artifacts/screenshots', { recursive: true });
  for (const [name, path] of [['landing', '/'], ['pipeline', '/workspace/pipeline'], ['review', '/workspace/review']]) {
    await goto(page, path);
    await page.evaluate(async () => {
      await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 3000))]);
    });
    await page.screenshot({ path: `artifacts/screenshots/${testInfo.project.name}-${name}.png`, fullPage: true, animations: 'disabled' });
  }
});
