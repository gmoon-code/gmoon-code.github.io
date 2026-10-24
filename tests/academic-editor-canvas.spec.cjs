const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const URL = 'http://127.0.0.1:8765/editor.html?page=about.html';
const DRAFT = 'moon-portfolio-visual-editor-v1:about.html';
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
main { margin:30px; border:2px solid #555; padding:24px; min-height:320px; }
section { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.inner { position:relative; transform:translate(12px,8px); }
h2 { font:700 24px/1.2 Georgia,serif; margin:0 0 12px; }
</style></head><body><main id="main"><section id="nested">
<div class="inner"><h2>Test heading</h2><p>Text originally inside a transformed column.</p></div>
<div><p>Another column stays in place.</p></div></section></main></body></html>`;

test.beforeEach(async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html', body: fixture
  }));
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(key => localStorage.removeItem(key), DRAFT);
  await page.reload();
  await expect(page.locator('#freeCanvasToggle')).toHaveAttribute('aria-pressed', 'true');
});

test('free drag escapes its transformed column, persists and exports the page layer', async ({ page }) => {
  const view = page.frameLocator('#pageFrame');
  const heading = view.locator('main #nested h2');
  await expect(heading).toBeVisible();
  const initial = await heading.boundingBox();
  const x = initial.x + Math.min(initial.width / 2, 55);
  const y = initial.y + initial.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 95, y + 55, { steps: 6 });
  await page.mouse.up();

  const floating = view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  const coordinates = await floating.evaluate(node => {
    const main = node.closest('main');
    const mr = main.getBoundingClientRect(), nr = node.getBoundingClientRect();
    const style = getComputedStyle(main);
    const expectedX = mr.left + parseFloat(style.borderLeftWidth) + parseFloat(node.style.left);
    const expectedY = mr.top + parseFloat(style.borderTopWidth) + parseFloat(node.style.top);
    return {
      dx: Math.abs(expectedX - nr.left),
      dy: Math.abs(expectedY - nr.top),
      font: getComputedStyle(node).fontFamily
    };
  });
  expect(coordinates.dx).toBeLessThan(4);
  expect(coordinates.dy).toBeLessThan(4);
  expect(coordinates.font).toMatch(/Georgia/i);
  await expect.poll(() => page.evaluate(key =>
    JSON.parse(localStorage.getItem(key) || '{}').items?.some(item =>
      item.markup.includes('moon-free-absolute')), DRAFT)).toBe(true);

  const savedLeft = await floating.evaluate(node => node.style.left);
  const savedTop = await floating.evaluate(node => node.style.top);
  await page.reload();
  const restored = view.locator('main > .moon-free-layer > h2');
  await expect(restored).toHaveCount(1);
  await expect(restored).toHaveCSS('left', savedLeft);
  await expect(restored).toHaveCSS('top', savedTop);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const exported = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  expect(exported).toContain('class="moon-free-layer"');
  expect(exported).toContain('class="moon-free-object moon-free-absolute"');
  expect(exported).toContain('--moon-free-canvas-height');
  expect(exported).toContain('id="moon-free-position-css"');
  expect(exported).toContain('id="moon-free-responsive-runtime"');
  expect(exported).toContain('<!--moon-free-slot:');
  expect(exported).not.toContain('data-editor-key=');

  // The published file must contain the same page-level structure.
  const published = await page.context().newPage();
  await published.setViewportSize({ width: 1100, height: 850 });
  await published.setContent(exported);
  const placement = await published.locator('main > .moon-free-layer > h2').evaluate(node => {
    const main = node.closest('main'), mr = main.getBoundingClientRect();
    return node.getBoundingClientRect().left - mr.left - parseFloat(node.style.left);
  });
  expect(Math.abs(placement)).toBeLessThan(4);
  await published.setViewportSize({ width: 390, height: 850 });
  await expect(published.locator('main > .moon-free-layer > h2')).toHaveCSS('position', 'static');
  await published.close();
});

test('eight resize grips and undo remain available after moving to page layer', async ({ page }) => {
  const view = page.frameLocator('#pageFrame');
  await view.locator('main #nested h2').click();
  const grips = view.locator('#moon-free-selection button[data-free-direction]:not([data-free-direction="move"])');
  await expect(grips).toHaveCount(8);
  const move = view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();
  await move.press('Shift+ArrowRight');
  const floating = view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  const originalX = await floating.evaluate(node => parseInt(node.style.left, 10));
  await move.press('ArrowDown');
  await expect(floating).toHaveCSS('left', originalX + 'px');
  await page.locator('#undoBtn').click();
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await page.locator('#undoBtn').click();
  await expect(view.locator('main #nested h2')).toHaveCount(1);
});

test('free canvas has exact vertical size and undoable front/back order', async ({ page }) => {
  const view = page.frameLocator('#pageFrame');
  await view.locator('main #nested h2').click();
  const move = view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();
  await move.press('ArrowRight');
  const floating = view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  const current = await floating.evaluate(node => parseInt(node.style.getPropertyValue('--moon-object-layer'), 10) || 20);
  await view.getByRole('button', { name: 'Place selected object one layer ahead of overlapping objects' }).click();
  await expect(floating).toHaveCSS('z-index', String(current + 1));
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}')
    .items?.some(item => item.markup.includes('--moon-object-layer: 21')), DRAFT)).toBe(true);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  expect(html).toContain('--moon-object-layer: 21');
  await page.locator('#undoBtn').click();
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCSS('z-index', '20');
  const restored = view.locator('main > .moon-free-layer > h2');
  await expect(restored).toHaveCSS('height', /px$/);
  const size = await restored.evaluate(node => ({
    assigned: parseFloat(node.style.height),
    actual: node.getBoundingClientRect().height
  }));
  expect(Math.abs(size.assigned - size.actual)).toBeLessThan(2);
});

test('published mobile page restores the original position of a floating heading', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  const heading=view.locator('#nested h2');
  await heading.click();
  const handle=view.locator('#moon-free-selection [data-free-direction="move"]');
  await handle.focus();
  await handle.press('Shift+ArrowRight');
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);

  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const exported=fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  // Request the published HTML from the same origin so its local runtime
  // runs exactly as it does on GitHub Pages.
  await page.route('**/canvas-published-test.html', route => route.fulfill({
    status:200,contentType:'text/html',body:exported
  }));
  const published=await page.context().newPage();
  await published.setViewportSize({width:1100,height:850});
  await published.goto('http://127.0.0.1:8765/canvas-published-test.html');
  await expect(published.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await published.setViewportSize({width:390,height:850});
  await expect(published.locator('#nested .inner > h2')).toHaveCount(1);
  const order=await published.locator('#nested .inner').evaluate(node =>
    [...node.children].map(child=>child.tagName));
  expect(order).toEqual(['H2','P']);
  await published.setViewportSize({width:1100,height:850});
  await expect(published.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await published.close();
});
