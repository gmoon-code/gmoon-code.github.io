const { test, expect } = require('@playwright/test');

test('Connection Studio retains private progress and works offline after first visit', async ({ page, context }) => {
  const unexpected = [];
  page.on('request', request => {
    const url = request.url();
    if (request.method() !== 'GET' || !url.startsWith('http://127.0.0.1:8765/')) {
      unexpected.push({ method: request.method(), url });
    }
  });
  await page.goto('http://127.0.0.1:8765/connection-studio/', { waitUntil: 'load' });
  await expect(page.locator('#navigation [data-tab="diagnose"]')).toBeVisible();

  // A controlled page is essential before offline navigation can be claimed.
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 20000 });
  const cached = await page.evaluate(async () => {
    const paths = ['./', './index.html', './style.css', './data.js', './app.js', './manifest.webmanifest', './icon.svg'];
    const scoped = new URL('./', document.baseURI);
    const found = [];
    for (const asset of paths) {
      const hit = await caches.match(new URL(asset, scoped).href);
      found.push({ asset, hit: Boolean(hit) });
    }
    return found;
  });
  expect(cached.filter(x => !x.hit), JSON.stringify(cached)).toHaveLength(0);

  await page.locator('#navigation [data-tab="diagnose"]').click();
  await page.locator('button[data-action="answer"][data-kind="diagnose"]').first().click();
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('connection-studio-v1')));
  expect(state.attempts).toHaveLength(1);

  // Simulate a lost network connection, including a full document reload.
  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');
  await page.locator('#navigation [data-tab="library"]').click();
  await expect(page.locator('#view')).toContainText('Lexical chain');
  await page.locator('#navigation [data-tab="rewrite"]').click();
  const draft = page.locator('textarea[data-draft-id]').first();
  await expect(draft).toBeVisible();
  await draft.fill('A causal explanation follows the changing relationships between scientific variables.');
  await expect(page.locator('#autosave')).toContainText('Saved locally');
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('connection-studio-v1')));
  expect(Object.keys(state.drafts).length).toBeGreaterThan(0);
  await page.reload({ waitUntil: 'load' });
  await page.locator('#navigation [data-tab="rewrite"]').click();
  await expect(page.locator('textarea[data-draft-id]').first()).toHaveValue(
    'A causal explanation follows the changing relationships between scientific variables.'
  );
  expect(unexpected, 'Exercise actions should not issue cross-origin or non-GET requests').toEqual([]);
});
