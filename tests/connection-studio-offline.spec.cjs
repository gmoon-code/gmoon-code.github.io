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


test('exported backups restore local attempts only after user confirmation', async ({ page }) => {
  const fs = require('node:fs/promises');
  await page.goto('http://127.0.0.1:8765/connection-studio/', { waitUntil: 'load' });
  await page.locator('#navigation [data-tab="diagnose"]').click();
  await page.locator('button[data-action="answer"][data-kind="diagnose"]').first().click();
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');

  await page.locator('#navigation [data-tab="rewrite"]').click();
  await page.locator('textarea[data-draft-id]').first().fill(
    'Students compared these relationships with the evidence in their developing models.'
  );
  await page.locator('#navigation [data-tab="progress"]').click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('button[data-action="export"]').click()
  ]);
  expect(download.suggestedFilename()).toMatch(/^connection-studio-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
  expect(backup.app).toBe('Connection Studio');
  expect(backup.version).toBe(1);
  expect(backup.progress.attempts).toHaveLength(1);
  expect(Object.keys(backup.progress.drafts).length).toBeGreaterThan(0);

  page.once('dialog', dialog => dialog.accept());
  await page.locator('button[data-action="reset"]').click();
  await expect(page.locator('#session-stat')).toContainText('0 activities logged');

  // A cancelled import must not silently overwrite the current record.
  const upload = { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) };
  const rejected = page.waitForEvent('dialog').then(dialog => dialog.dismiss());
  await page.locator('#import-file').setInputFiles(upload);
  await rejected;
  let current = await page.evaluate(() => JSON.parse(localStorage.getItem('connection-studio-v1')));
  expect(current.attempts).toHaveLength(0);

  const accepted = page.waitForEvent('dialog').then(dialog => dialog.accept());
  await page.locator('#import-file').setInputFiles(upload);
  await accepted;
  await expect(page.locator('#toast')).toContainText('Backup imported successfully');
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');
  current = await page.evaluate(() => JSON.parse(localStorage.getItem('connection-studio-v1')));
  expect(current.attempts).toEqual(backup.progress.attempts);
  expect(current.drafts).toEqual(backup.progress.drafts);

  await page.reload();
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');

  // A refused reset must likewise leave the imported work untouched.
  await page.locator('#navigation [data-tab="progress"]').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('button[data-action="reset"]').click();
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');
});


test('malformed backup must not replace an intact local practice record', async ({ page }) => {
  await page.goto('http://127.0.0.1:8765/connection-studio/', { waitUntil: 'load' });
  await page.locator('#navigation [data-tab="diagnose"]').click();
  await page.locator('button[data-action="answer"][data-kind="diagnose"]').first().click();
  await page.locator('#navigation [data-tab="progress"]').click();
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');
  const original = await page.evaluate(() => localStorage.getItem('connection-studio-v1'));
  const malformed = {
    app: 'Connection Studio',
    version: 1,
    progress: { attempts: [null], drafts: {}, completedWrites: {}, bookmarks: [], notes: {} }
  };
  let destructivePrompts = 0;
  page.on('dialog', async dialog => { destructivePrompts++; await dialog.dismiss(); });
  await page.locator('#import-file').setInputFiles({
    name: 'malformed-but-parseable.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(malformed))
  });
  await expect(page.locator('#toast')).toContainText('not a valid Connection Studio backup');
  expect(destructivePrompts, 'Invalid backups should be rejected before replacement confirmation').toBe(0);
  expect(await page.evaluate(() => localStorage.getItem('connection-studio-v1'))).toBe(original);
  await page.reload();
  await page.locator('#navigation [data-tab="progress"]').click();
  await expect(page.locator('#session-stat')).toContainText('1 activities logged');
});
