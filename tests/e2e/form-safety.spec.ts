import { test, expect } from '@playwright/test';

test('native fallback does not expose contact details in a URL', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/');
  const form = page.getByRole('form', { name: 'Quick early-access registration' });
  await expect(form).toHaveAttribute('method', 'post');
  await expect(form).toHaveAttribute('action', '/api/early-access');
  await expect(form).toContainText('Please enable JavaScript');
  await form.getByLabel('Work email').fill('native-fallback@example.com');
  await form.getByLabel('Company').fill('Native Fallback Test');
  await form.getByRole('checkbox').check();
  const response = page.waitForResponse(r => r.url().endsWith('/api/early-access') && r.request().method() === 'POST');
  await form.getByRole('button', { name: 'Join early access', exact: true }).click();
  expect((await response).status()).toBe(415);
  expect(page.url()).not.toContain('native-fallback');
  expect(new URL(page.url()).search).toBe('');
  await context.close();
});
