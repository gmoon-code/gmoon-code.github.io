const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:8765/fluid-layout-lab.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('builder loads and inspector edits text', async ({ page }) => {
  await expect(page.locator('#grid .block')).toHaveCount(3);
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('A revised heading');
  await page.locator('#text').dispatchEvent('change');
  await expect(page.locator('#grid .block').first()).toContainText('A revised heading');
});

test('add, undo and redo', async ({ page }) => {
  await page.locator('[data-add="text"]').click();
  await expect(page.locator('#grid .block')).toHaveCount(4);
  await page.locator('#undo').click();
  await expect(page.locator('#grid .block')).toHaveCount(3);
  await page.locator('#redo').click();
  await expect(page.locator('#grid .block')).toHaveCount(4);
});

test('mobile layout can be edited independently', async ({ page }) => {
  await page.locator('#grid .block').first().click();
  const desktopX = await page.locator('#x').inputValue();
  await page.locator('#device').selectOption('mobile');
  await page.locator('#x').fill('2');
  await page.locator('#x').dispatchEvent('change');
  await page.locator('#device').selectOption('desktop');
  await expect(page.locator('#x')).toHaveValue(desktopX);
});

test('JSON export and import round trip', async ({ page }) => {
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Round trip content');
  await page.locator('#text').dispatchEvent('change');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  const fs = require('node:fs');
  const saved = fs.readFileSync(await download.path(), 'utf8');
  const data = JSON.parse(saved);
  expect(data.blocks[0].text).toBe('Round trip content');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#jsonImport').setInputFiles({
    name: 'layout.json', mimeType: 'application/json', buffer: Buffer.from(saved)
  });
  await expect(page.locator('#status')).toContainText('Imported');
  await expect(page.locator('#grid .block').first()).toContainText('Round trip content');
});

test('HTML export escapes user text', async ({ page }) => {
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('<script>alert("unsafe")</script>');
  await page.locator('#text').dispatchEvent('change');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportHtml').click();
  const fs = require('node:fs');
  const html = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>alert("unsafe")</script>');
});

test('portfolio editor exposes experimental builder', async ({ page }) => {
  await page.goto('http://127.0.0.1:8765/editor.html');
  await expect(page.locator('a[href="fluid-layout-lab.html"]')).toHaveCount(1);
});

test('page import records original source selectors', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<main><section id="profile"><h1>About the educator</h1><p>Sample paragraph.</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#status')).toContainText('Imported');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const fs = require('node:fs');
  const data = JSON.parse(fs.readFileSync(await (await downloadPromise).path(), 'utf8'));
  expect(data.blocks[0].source).toEqual({
    page: 'about.html', selector: '#profile > h1:nth-of-type(1)',
    tag: 'h1', originalText: 'About the educator'
  });
});
