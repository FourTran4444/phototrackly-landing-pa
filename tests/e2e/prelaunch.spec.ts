import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Reads the isolated test double, not a live Google Sheet or a production database.
function readLead(reference: string) {
  const rows: string[][] = JSON.parse(readFileSync(process.env.PHOTOTRACKLY_TEST_SHEET_FILE!, 'utf8'));
  const row = rows.slice(1).find(line => line[15] === reference);
  if (!row) return undefined;
  return { consent_version: row[19], data: JSON.stringify({ name: row[2], email: row[3], company: row[4], role: row[6], volume: row[7], challenge: row[9], source: row[10].split(':')[1], country: row[17], consent: row[18] === 'yes' }) };
}
async function visit(page: Page, ip: string) {
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ip });
  await page.goto('/');
  await expect(page.locator('.pl-hero h1')).toContainText('One tool for the');
  const decline = page.getByRole('button', { name: 'No thanks', exact: true });
  if (await decline.isVisible()) await decline.click();
}
const valid = () => ({ requestId: randomUUID(), source: 'hero', email: 'ci@example.com', company: 'CI Studio', consent: true });

test('sample stages, production filters and FAQs work with the keyboard', async ({ page }) => {
  await visit(page, '192.0.2.10');
  const tabs = page.getByRole('tablist', { name: 'Sample job stages' });
  await tabs.getByRole('tab', { name: /Brief/ }).click();
  await tabs.getByRole('tab', { name: /Brief/ }).press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: /Shoot/ })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Sam');
  await tabs.getByRole('tab', { name: /Shoot/ }).press('End');
  await expect(tabs.getByRole('tab', { name: /Delivery/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('approved');
  await page.getByRole('group', { name: 'Filter illustrative production board' }).getByRole('button', { name: /Ready for review/ }).click();
  await expect(page.locator('.pl-board-card')).toHaveCount(2);
  await expect(page.locator('.pl-board-columns')).toContainText('9 Olive Lane');
  await page.getByRole('group', { name: 'Filter illustrative production board' }).getByRole('button', { name: /All jobs/ }).click();
  await expect(page.locator('.pl-board-card')).toHaveCount(6);
  await page.locator('#questions summary').first().click();
  await expect(page.locator('#questions details').first()).toContainText('Not yet.');
  await page.locator('#questions summary').nth(3).click();
  await expect(page.locator('#questions details').nth(3)).toContainText('Manual assignment is an initial priority');
});

test('hero form confirms the Google receiver contract and offers a private removal link', async ({ page }, info) => {
  await visit(page, info.project.name === 'mobile' ? '192.0.2.21' : '192.0.2.20');
  const form = page.getByRole('form', { name: 'Quick early-access registration' });
  await form.getByLabel('Work email').fill('hero-ci@example.com');
  await form.getByLabel('Company', { exact: false }).fill('Hero CI Studio');
  await form.getByRole('checkbox').check();
  const saved = page.waitForResponse(r => r.url().endsWith('/api/early-access') && r.request().method() === 'POST');
  await form.getByRole('button', { name: 'Join early access', exact: true }).click();
  const response = await saved; expect(response.status()).toBe(200);
  const receipt = await response.json();
  await expect(page.locator('.pl-hero .pl-form-success')).toContainText('You’re on the list.');
  const row = readLead(receipt.reference);
  expect(JSON.parse(String(row?.data)).company).toBe('Hero CI Studio');
  expect(row?.consent_version).toBe('2026-09-23');
  const confirmation = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save your confirmation' }).click();
  expect((await confirmation).suggestedFilename()).toBe('phototrackly-confirmation.txt');
  await page.getByRole('link', { name: 'registration-removal link' }).click();
  await expect(page.getByRole('button', { name: 'Remove my registration' })).toBeVisible();
  expect(readLead(receipt.reference)).toBeTruthy();
  await page.getByRole('button', { name: 'Remove my registration' }).click();
  await expect(page.getByRole('heading', { name: 'Your registration is removed.' })).toBeVisible();
  expect(readLead(receipt.reference)).toBeUndefined();
});

test('full form stores qualification fields and explicit consent', async ({ page }, info) => {
  await visit(page, info.project.name === 'mobile' ? '192.0.2.31' : '192.0.2.30');
  const form = page.getByRole('form', { name: 'Early-access registration', exact: true });
  await form.getByLabel('Your name').fill('CI Person');
  await form.getByLabel('Work email').fill('qualified-ci@example.com');
  await form.getByLabel('Company').fill('Qualified CI Studio');
  await form.getByLabel('Your role').selectOption('Operations / coordinator');
  await form.getByLabel('Country').selectOption('Australia');
  await form.getByLabel('Approx. property jobs').selectOption('100–249');
  await form.getByLabel('Your biggest workflow challenge').fill('Clarifying editing handoffs.');
  await form.getByRole('checkbox').check();
  const saved = page.waitForResponse(r => r.url().endsWith('/api/early-access') && r.request().method() === 'POST');
  await form.getByRole('button', { name: 'Join early access', exact: true }).click();
  const response = await saved; expect(response.status()).toBe(200);
  const receipt = await response.json();
  await expect(page.locator('#early-access .pl-form-success')).toBeVisible();
  const lead = JSON.parse(String(readLead(receipt.reference)?.data));
  expect(lead).toMatchObject({ name: 'CI Person', country: 'Australia', volume: '100–249', source: 'footer', consent: true });
});

test('server failure retains fields and never shows a successful registration', async ({ page }) => {
  await visit(page, '192.0.2.40');
  await page.route('**/api/early-access', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Registration could not be saved. Please try again later.' }) }));
  const form = page.getByRole('form', { name: 'Quick early-access registration' });
  await form.getByLabel('Work email').fill('failure@example.com');
  await form.getByLabel('Company').fill('Still Here Studio');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Join early access', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('could not be saved');
  await expect(form.getByLabel('Company')).toHaveValue('Still Here Studio');
  await expect(page.locator('.pl-form-success')).toHaveCount(0);
});

test('API validates consent, limits input, rejects foreign origins, and saves idempotently', async ({ request }, info) => {
  const headers = { 'x-forwarded-for': info.project.name === 'mobile' ? '192.0.2.51' : '192.0.2.50' };
  const lead = valid();
  const first = await request.post('/api/early-access', { headers, data: lead }); expect(first.status()).toBe(200);
  const second = await request.post('/api/early-access', { headers, data: lead }); expect(await second.json()).toEqual(await first.json());
  expect(readLead(lead.requestId)).toBeTruthy();
  expect((await request.post('/api/early-access', { headers, data: { ...lead, company: 'Changed' } })).status()).toBe(409);
  expect((await request.post('/api/early-access', { data: { ...valid(), consent: false } })).status()).toBe(400);
  expect((await request.post('/api/early-access', { data: { ...valid(), email: 'bad' } })).status()).toBe(400);
  expect((await request.post('/api/early-access', { headers: { 'content-type': 'text/plain' }, data: 'hello' })).status()).toBe(415);
  expect((await request.post('/api/early-access', { headers: { origin: 'https://untrusted.example' }, data: valid() })).status()).toBe(403);
  expect((await request.post('/api/early-access', { data: { ...valid(), company: 'x'.repeat(17000) } })).status()).toBe(413);
  expect((await request.post('/api/early-access', { data: { ...valid(), website: 'honeypot' } })).status()).toBe(400);
});

test('optional analytics is off until consent and events omit form values', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', request => { if (request.url().includes('googletagmanager.com/gtag')) scripts.push(request.url()); });
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '/* isolated test: never contact Google Analytics */' }));
  await page.goto('/?email=never-track@example.com');
  await page.getByLabel('Work email').first().fill('private@example.com');
  expect(scripts).toHaveLength(0);
  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await expect.poll(() => scripts.length).toBe(1);
  await expect.poll(() => page.evaluate(() => typeof window.gtag)).toBe('function');
  await page.getByRole('tab', { name: /Production/ }).click();
  const queue = await page.evaluate(() => (window.dataLayer || []).map(x => Array.from(x as ArrayLike<unknown>)));
  expect(JSON.stringify(queue)).toContain('sample_stage_view');
  expect(JSON.stringify(queue)).not.toContain('private@example.com');
  expect(JSON.stringify(queue)).not.toContain('never-track@example.com');
  await page.getByRole('button', { name: 'Cookie settings' }).click();
  await page.getByRole('button', { name: 'No thanks' }).click();
  await expect(page.locator('.pl-hero')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('phototrackly.analytics-consent.v1'))).toBe('declined');
});

test('navigation, headings, image text and layouts work at small and wide widths', async ({ page, isMobile }) => {
  await visit(page, '192.0.2.60');
  if (isMobile) {
    const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
    await menu.click();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await menu.click();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Sample job' }).click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  }
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow at ${width}px`).toBe(true);
  }
  await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.locator('.pl img:not([alt]), .pl img[alt=""]').count()).toBe(0);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /property media/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^http:\/\/localhost:3000\/?$/);
  expect(await page.getByRole('form').count()).toBe(2);
});
