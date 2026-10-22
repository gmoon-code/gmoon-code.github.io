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

test('content changes export verifies source text and blocks conflicts', async ({ page }) => {
  let original = 'Original text';
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section id="profile"><h1>'+original+'</h1></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised text');
  await page.locator('#text').dispatchEvent('change');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportPatch').click();
  const fs = require('node:fs');
  const patch = JSON.parse(fs.readFileSync(await (await downloadPromise).path(), 'utf8'));
  expect(patch.changes).toEqual([{selector:'#profile > h1:nth-of-type(1)',tag:'h1',before:'Original text',after:'Revised text'}]);
  original = 'Updated elsewhere';
  await page.locator('#exportPatch').click();
  await expect(page.locator('#status')).toContainText('Content export blocked');
});

test('review panel displays original and edited content', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section id="profile"><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#reviewPatch').click();
  await expect(page.locator('#reviewPanel')).toBeVisible();
  await expect(page.locator('#reviewEntries')).toContainText('Before: Original paragraph');
  await expect(page.locator('#reviewEntries')).toContainText('After: Revised paragraph');
});

test('full-page HTML export preserves page shell and rejects nested markup', async ({ page }) => {
  let rich = false;
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<!doctype html><html><head><title>About</title></head><body><nav>Keep navigation</nav><main><p id="bio">'+(rich?'<a href="/more">Original text</a>':'Original text')+'</p></main><footer>Keep footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised text');
  await page.locator('#text').dispatchEvent('change');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportUpdatedPage').click();
  const fs = require('node:fs');
  const html = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  expect(html).toContain('Keep navigation');
  expect(html).toContain('Keep footer');
  expect(html).toContain('Revised text');
  rich = true;
  await page.locator('#exportUpdatedPage').click();
  await expect(page.locator('#status')).toContainText('nested HTML');
});

test('source selectors retain positions after excluded hidden siblings', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section id="profile"><p hidden>Hidden paragraph</p><p>Visible paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Edited visible paragraph');
  await page.locator('#text').dispatchEvent('change');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportPatch').click();
  const fs = require('node:fs');
  const patch = JSON.parse(fs.readFileSync(await (await downloadPromise).path(), 'utf8'));
  expect(patch.changes).toEqual([{selector:'#profile > p:nth-of-type(2)',tag:'p',before:'Visible paragraph',after:'Edited visible paragraph'}]);
});

test('source comparison tolerates equivalent whitespace in original markup', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section id="profile"><p>One   two\n three</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Updated');
  await page.locator('#text').dispatchEvent('change');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportPatch').click();
  const fs = require('node:fs');
  const patch = JSON.parse(fs.readFileSync(await (await downloadPromise).path(), 'utf8'));
  expect(patch.changes[0].before).toBe('One two three');
});

test('publisher handoff opens the same selected page', async ({ page }) => {
  await page.locator('#sourcePage').selectOption('about.html');
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#pagePicker')).toHaveValue('about.html');
});

test('verified imported text transfers to the existing editor draft', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<!doctype html><html><body><main><section id="profile"><p>Original paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised paragraph');
  await page.locator('#text').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toContain('Revised paragraph');
});

test('transfer refuses source changes after the builder verified them', async ({ page }) => {
  let reads=0;
  await page.route('**/about.html', route => {
    reads++;
    return route.fulfill({
      status: 200, contentType: 'text/html',
      body: '<!doctype html><html><body><main><section id="profile"><p>'+ (reads >= 3 ? 'Changed externally' : 'Original paragraph') +'</p></section></main></body></html>'
    });
  });
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised paragraph');
  await page.locator('#text').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).not.toContainText('transferred');
  const draft = await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'));
  expect(draft === null || !draft.includes('Revised paragraph')).toBe(true);
});

test('existing local draft prevents incoming text transfer', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<!doctype html><html><body><main><section id="profile"><p>Original paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Incoming edit');
  await page.locator('#text').dispatchEvent('change');
  await page.evaluate(() => localStorage.setItem('moon-portfolio-visual-editor-v1:about.html',
    JSON.stringify({version:1,sourceHash:'outdated',items:[{id:'e0',markup:'<p>Saved edit</p>'}]})));
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).not.toContainText('transferred');
  const draft=await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'));
  expect(draft).toContain('Saved edit');
  expect(draft).not.toContain('Incoming edit');
});

test('inline links are preserved by refusing destructive text transfer', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<!doctype html><html><body><main><section id="profile"><p>Read <a href="research.html">research</a> here.</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised linked paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
  await expect(page.locator('#status')).toContainText('Handoff blocked');
  const pending=await page.evaluate(() => sessionStorage.getItem('moon-fluid-text-handoff-v1'));
  expect(pending).toBeNull();
});

test('oversized source paragraphs are skipped without creating truncated mappings', async ({ page }) => {
  const longText='A'.repeat(4100);
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section id="profile"><p>'+longText+'</p><p>Short paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(1);
  await expect(page.locator('#grid .block').first()).toContainText('Short paragraph');
});

test('content patch export rejects nested inline markup', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section id="profile"><p>Read <strong>carefully</strong>.</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Updated paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#exportPatch').click();
  await expect(page.locator('#status')).toContainText('nested HTML');
});

test('publisher handoff refuses selected page mismatch', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Changed paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#sourcePage').selectOption('research.html');
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
  await expect(page.locator('#status')).toContainText('selected page differs');
  expect(await page.evaluate(() => sessionStorage.getItem('moon-fluid-text-handoff-v1'))).toBeNull();
});

test('handoff confirmation discloses that new layout blocks are excluded', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Changed paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('[data-add="text"]').click();
  const dialogPromise=page.waitForEvent('dialog');
  await page.locator('#openPublisher').click();
  const dialog=await dialogPromise;
  expect(dialog.message()).toContain('will NOT transfer');
  expect(dialog.message()).toContain('Export layout JSON separately');
  await dialog.dismiss();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
});

test('blocked page mismatch clears an abandoned transfer', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Changed paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.evaluate(() => sessionStorage.setItem('moon-fluid-text-handoff-v1', '{"version":1,"page":"about.html","changes":[]}'));
  await page.locator('#sourcePage').selectOption('research.html');
  await page.locator('#openPublisher').click();
  await expect(page.locator('#status')).toContainText('selected page differs');
  expect(await page.evaluate(() => sessionStorage.getItem('moon-fluid-text-handoff-v1'))).toBeNull();
});

test('JSON import rejects unsupported source page without replacing canvas', async ({ page }) => {
  const draft={version:2,sourcePage:'../other.html',blocks:[]};
  await page.locator('#jsonImport').setInputFiles({
    name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))
  });
  await expect(page.locator('#status')).toContainText('Unsupported source page');
  await expect(page.locator('#grid .block')).toHaveCount(3);
});

test('JSON import rejects mismatched source metadata without replacing canvas', async ({ page }) => {
  const draft={version:2,sourcePage:'about.html',blocks:[{
    id:1,type:'text',text:'Edited',x:1,y:1,w:8,h:2,
    source:{page:'research.html',selector:'p:nth-of-type(1)',tag:'p',originalText:'Original'}
  }]};
  await page.locator('#jsonImport').setInputFiles({
    name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))
  });
  await expect(page.locator('#status')).toContainText('Invalid source reference');
  await expect(page.locator('#grid .block')).toHaveCount(3);
});

test('content export refuses a changed page selection', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Changed paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#sourcePage').selectOption('research.html');
  await page.locator('#exportPatch').click();
  await expect(page.locator('#status')).toContainText('Selected page differs');
});

test('standalone preview exports semantic headings and paragraphs', async ({ page }) => {
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportHtml').click();
  const download=await downloadPromise;
  const fs=require('node:fs');
  const html=fs.readFileSync(await download.path(),'utf8');
  expect(html).toMatch(/<h2 class="block heading"/);
  expect(html).toMatch(/<p class="block text"/);
  expect(html).toContain('<main class="page">');
});

test('full-site layout review preserves header footer and encloses the proposed layout', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head><title>About original</title><script>window.wrong=true</script></head><body><header>Original site header</header><main><section id="profile"><p>Original paragraph</p></section></main><footer>Original site footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised paragraph');
  await page.locator('#text').dispatchEvent('change');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportSitePreview').click();
  const downloaded=await downloadPromise;
  expect(downloaded.suggestedFilename()).toBe('about.layout-review.html');
  const fs=require('node:fs');
  const html=fs.readFileSync(await downloaded.path(),'utf8');
  expect(html).toContain('Original site header');
  expect(html).toContain('Original site footer');
  expect(html).toContain('Experimental layout review only');
  expect(html).toContain('Revised paragraph');
  expect(html).toContain('iframe');
  expect(html).not.toContain('window.wrong=true');
  const inspected=await page.evaluate(html=>{
    const doc=new DOMParser().parseFromString(html,'text/html');
    return {original:doc.querySelector('main section'),embedded:doc.querySelector('main iframe')?.getAttribute('srcdoc'),footer:doc.querySelector('footer')?.textContent};
  },html);
  expect(inspected.original).toBeNull();
  expect(inspected.embedded).toContain('Revised paragraph');
  expect(inspected.footer).toBe('Original site footer');
});

test('full-site review refuses changed original text', async ({ page }) => {
  let modified=false;
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<html><head></head><body><main><section><p>'+(modified?'Updated elsewhere':'Original paragraph')+'</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  modified=true;
  await page.locator('#exportSitePreview').click();
  await expect(page.locator('#status')).toContainText('Original source text changed');
});

test('in-context site preview opens with desktop and mobile modes and closes safely', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head><title>About</title></head><body><header>Site header</header><main><section><p>Original paragraph</p></section></main><footer>Site footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Revised paragraph');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#viewSitePreview').click();
  await expect(page.locator('#sitePreviewDialog')).toBeVisible();
  const srcdoc=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(srcdoc).toContain('Site header');
  expect(srcdoc).toContain('Site footer');
  expect(srcdoc).toContain('Revised paragraph');
  await page.locator('#previewSiteOriginal').click();
  await expect(page.locator('#previewSiteOriginal')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#sitePreviewFrame')).toHaveAttribute('srcdoc', /Original paragraph/);
  await expect(page.locator('#sitePreviewFrame')).not.toHaveAttribute('srcdoc', /Experimental layout review only/);
  await page.locator('#previewSiteProposal').click();
  await expect(page.locator('#sitePreviewFrame')).toHaveAttribute('srcdoc', /Revised paragraph/);
  await page.locator('#previewSiteMobile').click();
  await expect(page.locator('#previewSiteMobile')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#sitePreviewFrame')).toHaveClass(/mobile/);
  await page.locator('#previewSiteDesktop').click();
  await expect(page.locator('#previewSiteDesktop')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#sitePreviewFrame')).not.toHaveClass(/mobile/);
  await page.locator('#closeSitePreview').click();
  await expect(page.locator('#sitePreviewDialog')).not.toBeVisible();
  await expect(page.locator('#sitePreviewFrame')).toHaveAttribute('srcdoc','');
});

test('in-context preview refuses changed source without opening dialog', async ({ page }) => {
  let modified=false;
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<html><head></head><body><main><section><p>'+(modified?'Updated elsewhere':'Original paragraph')+'</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  modified=true;
  await page.locator('#viewSitePreview').click();
  await expect(page.locator('#status')).toContainText('Original source text changed');
  await expect(page.locator('#sitePreviewDialog')).not.toBeVisible();
});

test('standalone layout retains source heading levels', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<main><section><h1>Primary title</h1><h3>Subsection title</h3><p>Description.</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportHtml').click();
  const fs=require('node:fs');
  const html=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toMatch(/<h1 class="block heading"/);
  expect(html).toMatch(/<h3 class="block heading"/);
  expect(html).toMatch(/<p class="block text"/);
});

test('website preview audits links, lists, tables and block overlap counts', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<html><head></head><body><main><section><p>Paragraph</p><a href="research.html">Research link</a><ul><li>One item</li></ul><table><tr><td>Value</td></tr></table></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#viewSitePreview').click();
  await expect(page.locator('#sitePreviewAudit')).toContainText('1 links, 1 list items, 1 tables');
  await expect(page.locator('#sitePreviewAudit')).toContainText('Possible block overlaps:');
  const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(html).toContain('Text-only imports do not preserve their formatting or interactions');
});

test('editor toolbar exposes distinct draft, review, export, and handoff groups', async ({ page }) => {
  await expect(page.getByRole('group',{name:'Edit history'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Review layout'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Export drafts'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Editor handoff'})).toBeVisible();
  await expect(page.locator('#viewSitePreview')).toHaveText('Preview inside website');
  await expect(page.locator('#openPublisher')).toHaveText('Transfer verified text to editor');
});

test('JSON import synchronizes page picker through undo and redo', async ({ page }) => {
  const draft={version:2,sourcePage:'about.html',blocks:[{
    id:1,type:'heading',text:'Imported heading',x:1,y:1,w:8,h:2
  }]};
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#jsonImport').setInputFiles({
    name:'layout.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))
  });
  await expect(page.locator('#sourcePage')).toHaveValue('about.html');
  await page.locator('#undo').click();
  await expect(page.locator('#sourcePage')).toHaveValue('index.html');
  await page.locator('#redo').click();
  await expect(page.locator('#sourcePage')).toHaveValue('about.html');
});

test('restoring saved browser draft restores the source page selection', async ({ page }) => {
  const draft={version:2,sourcePage:'research.html',blocks:[{
    id:1,type:'heading',text:'Saved heading',x:1,y:1,w:8,h:2
  }]};
  await page.evaluate(data=>localStorage.setItem('moon-fluid-layout-lab-v1',JSON.stringify(data)),draft);
  await page.reload();
  await expect(page.locator('#sourcePage')).toHaveValue('research.html');
  await expect(page.locator('#grid .block').first()).toContainText('Saved heading');
});

test('visual-only style transfer preserves inline links in the authenticated editor', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section id="profile"><h2>Heading</h2><p>Read <a href="research.html">research</a> here.</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').nth(1).click();
  await page.locator('#fontSize').fill('24');
  await page.locator('#fontSize').dispatchEvent('change');
  await page.locator('#color').fill('#7b2f2f');
  await page.locator('#color').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  const draft=await page.evaluate(() => JSON.parse(localStorage.getItem('moon-portfolio-visual-editor-v1:about.html')));
  expect(draft.items.some(item=>/font-size:\s*24px/.test(item.markup)&&/(?:#7b2f2f|rgb\(123,\s*47,\s*47\))/i.test(item.markup))).toBe(true);
  expect(draft.items.some(item=>item.markup.includes('href="research.html"'))).toBe(true);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const fs=require('node:fs');
  const exported=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  expect(exported).toContain('href="research.html"');
  expect(exported).toContain('font-size: 24px');
  expect(exported).toMatch(/(?:#7b2f2f|rgb\(123,\s*47,\s*47\))/i);
});

test('combined text and style edits transfer together into one draft', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section><p>Original paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#text').fill('Combined content');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#align').selectOption('center');
  await page.locator('#align').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  const raw=await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'));
  expect(raw).toContain('Combined content');
  expect(raw).toContain('text-align: center');
});

test('invalid layout metadata cannot stage unsupported style keys', async ({ page }) => {
  const draft={version:2,sourcePage:'about.html',blocks:[{
    id:1,type:'text',text:'Original',x:1,y:1,w:8,h:2,
    source:{page:'about.html',selector:'p:nth-of-type(1)',tag:'p',originalText:'Original'},
    styleEdits:['position']
  }]};
  await page.locator('#jsonImport').setInputFiles({
    name:'invalid-style.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))
  });
  await expect(page.locator('#status')).toContainText('Invalid style edit metadata');
  await expect(page.locator('#grid .block')).toHaveCount(3);
});

test('style-only changes appear in the review panel', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#fontSize').fill('27');
  await page.locator('#fontSize').dispatchEvent('change');
  await page.locator('#reviewPatch').click();
  await expect(page.locator('#reviewPanel')).toBeVisible();
  await expect(page.locator('#reviewEntries')).toContainText('Style');
  await expect(page.locator('#reviewEntries')).toContainText('fontSize: 27px');
  await expect(page.locator('#status')).toContainText('0 text edits, 1 visual style edits, and 0 responsive group');
});

test('publisher confirmation warns when only desktop block positions change', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#x').fill('2');
  await page.locator('#x').dispatchEvent('change');
  await page.locator('#fontSize').fill('24');
  await page.locator('#fontSize').dispatchEvent('change');
  const dialogPromise=page.waitForEvent('dialog');
  await page.locator('#openPublisher').click();
  const dialog=await dialogPromise;
  expect(dialog.message()).toContain('Freeform positions');
  await dialog.dismiss();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
});

test('style transfer rejects a source change made after validation', async ({ page }) => {
  let reads=0;
  await page.route('**/about.html', route => {
    reads++;
    return route.fulfill({
      status:200,contentType:'text/html',
      body:'<!doctype html><html><body><main><section id="profile"><p>'+
        (reads>=3?'Edited elsewhere':'Original paragraph')+'</p></section></main></body></html>'
    });
  });
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#fontSize').fill('26');
  await page.locator('#fontSize').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).not.toContainText('transferred');
  await expect(page.locator('#noticeDialog')).toBeVisible();
  await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
  expect(await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('style transfer rejects forged unsafe CSS values', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section><p>Original paragraph</p></section></main></body></html>'
  }));
  const payload={version:2,page:'about.html',changes:[],styleChanges:[{
    selector:'section:nth-of-type(1) > p:nth-of-type(1)',
    tag:'p',before:'Original paragraph',
    styles:{background:'url(javascript:alert(1))'}
  }]};
  await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
  await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
  await expect(page.locator('#editorSaveStatus')).not.toContainText('transferred');
  expect(await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('moon-fluid-text-handoff-v1'))).toBeNull();
});

test('real About page supports a style-only GitHub-review draft without altering site shell', async ({ page }) => {
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block.heading').first()).toBeVisible();
  await page.locator('#grid .block.heading').first().click();
  await page.locator('#fontSize').fill('31');
  await page.locator('#fontSize').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const fs=require('node:fs');
  const html=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('about-page');
  expect(html).toContain('font-size: 31px');
  expect(html).toContain('A little about me');
  expect(html).toContain('assets/profile-portrait.webp');
});

test('removing imported blocks cannot silently navigate to a text-only publisher', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<main><section><h2>Heading</h2><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#remove').click();
  await page.locator('#save').click();
  await page.reload();
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
  await expect(page.locator('#status')).toContainText('Only structural or freeform layout changes');
  expect(await page.evaluate(() => sessionStorage.getItem('moon-fluid-text-handoff-v1'))).toBeNull();
});

test('layout-only modifications are reversible through undo', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<main><section><h2>Heading</h2><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#remove').click();
  await page.locator('#undo').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  const exported=await page.evaluate(()=>{
    const el=document.querySelector('#save');el.click();
    return JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'));
  });
  expect(exported.structureEdited).toBe(false);
});

test('verified visual styling can be undone before publication', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section><p>Original paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#fontSize').fill('28');
  await page.locator('#fontSize').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await expect(page.locator('#undoBtn')).toBeEnabled();
  await page.locator('#undoBtn').click();
  await expect(page.locator('#exportBtn')).toBeDisabled();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('existing local editor drafts are protected from style-only handoffs', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section><p>Original paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#fontSize').fill('28');
  await page.locator('#fontSize').dispatchEvent('change');
  const existing=JSON.stringify({version:1,sourceHash:'outdated',items:[]});
  await page.evaluate(value=>localStorage.setItem('moon-portfolio-visual-editor-v1:about.html',value),existing);
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page.locator('#editorSaveStatus')).not.toContainText('transferred');
  const persisted=await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'));
  expect(persisted).toBe(existing);
  await expect(page.locator('#noticeMessage')).toContainText('already has a local draft');
});

test('changing an imported image cannot be mistaken for a transferable text edit', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<main><section><img src="assets/first.webp" alt="Example"></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block.image').first().click();
  await page.locator('#text').fill('assets/second.webp');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
  await expect(page.locator('#status')).toContainText('Only structural or freeform layout changes');
});

test('main editor review explicitly describes style-only changes', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section><p>Original paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#fontSize').fill('26');
  await page.locator('#fontSize').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await page.locator('#reviewBtn').click();
  await expect(page.locator('#reviewDialog')).toBeVisible();
  await expect(page.locator('#reviewChangeList')).toContainText('Visual styling');
  await expect(page.locator('#reviewChangeList')).toContainText('Font size: Page stylesheet → 26px');
  await expect(page.locator('#reviewExportStatus')).toContainText('Source check passed');
});

for (const pageName of ['index.html','research.html','projects.html','teaching.html',
  'interests.html','about.html','cv.html','pungmul.html']) {
  test('real portfolio page supports reviewable heading styling: '+pageName, async ({ page }) => {
    await page.locator('#sourcePage').selectOption(pageName);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#importPage').click();
    await expect(page.locator('#grid .block.heading').first()).toBeVisible();
    await page.locator('#grid .block.heading').first().click();
    await page.locator('#fontSize').fill('33');
    await page.locator('#fontSize').dispatchEvent('change');
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#openPublisher').click();
    await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
    await page.locator('#reviewBtn').click();
    await expect(page.locator('#reviewExportStatus')).toContainText('Source check passed');
    await expect(page.locator('#reviewChangeList')).toContainText('Font size');
  });
}

test('max width and flow spacing transfer to an existing page without restructuring it', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><header>Keep header</header><main><section id="profile"><p>Read <a href="research.html">research</a> here.</p></section></main><footer>Keep footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#maxWidthPct').fill('75');
  await page.locator('#maxWidthPct').dispatchEvent('change');
  await page.locator('#spaceAbove').fill('24');
  await page.locator('#spaceAbove').dispatchEvent('change');
  await page.locator('#spaceBelow').fill('16');
  await page.locator('#spaceBelow').dispatchEvent('change');
  await page.locator('#reviewPatch').click();
  await expect(page.locator('#reviewEntries')).toContainText('maxWidthPct: 75%');
  await expect(page.locator('#reviewEntries')).toContainText('spaceAbove: 24px');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await page.locator('#reviewBtn').click();
  await expect(page.locator('#reviewChangeList')).toContainText('Maximum width');
  await expect(page.locator('#reviewChangeList')).toContainText('Space above');
  await expect(page.locator('#reviewExportStatus')).toContainText('Source check passed');
  await page.locator('#reviewDialog form button').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const fs=require('node:fs');
  const html=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('max-width: 75%');
  expect(html).toContain('margin-top: 24px');
  expect(html).toContain('margin-bottom: 16px');
  expect(html).toContain('href="research.html"');
  expect(html).toContain('Keep header');
  expect(html).toContain('Keep footer');
});

test('out-of-range flow spacing in a forged handoff cannot create an editor draft', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section><p>Original paragraph</p></section></main></body></html>'
  }));
  const payload={version:2,page:'about.html',changes:[],styleChanges:[{
    selector:'section:nth-of-type(1) > p:nth-of-type(1)',tag:'p',before:'Original paragraph',
    styles:{spaceAbove:999}
  }]};
  await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
  await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
  await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
  expect(await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('saved flow-layout values restore in the inspector', async ({ page }) => {
  const draft={version:2,sourcePage:'about.html',blocks:[{
    id:1,type:'text',text:'Original',x:1,y:1,w:8,h:2,
    maxWidthPct:72,spaceAbove:18,spaceBelow:12,
    source:{page:'about.html',selector:'p:nth-of-type(1)',tag:'p',originalText:'Original'},
    styleEdits:['maxWidthPct','spaceAbove','spaceBelow']
  }]};
  await page.evaluate(data=>localStorage.setItem('moon-fluid-layout-lab-v1',JSON.stringify(data)),draft);
  await page.reload();
  await page.locator('#grid .block').first().click();
  await expect(page.locator('#maxWidthPct')).toHaveValue('72');
  await expect(page.locator('#spaceAbove')).toHaveValue('18');
  await expect(page.locator('#spaceBelow')).toHaveValue('12');
});

test('publishable-edits preview changes the real page in place while preserving links and shell', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head><title>About</title><script>window.bad=true</script></head><body><header>Site navigation</header><main><section id="profile"><p>Read <a href="research.html">research</a> here.</p></section></main><footer>Site footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#maxWidthPct').fill('60');
  await page.locator('#maxWidthPct').dispatchEvent('change');
  await page.locator('#fontSize').fill('22');
  await page.locator('#fontSize').dispatchEvent('change');
  await page.locator('#viewSitePreview').click();
  await expect(page.locator('#sitePreviewDialog')).toBeVisible();
  await page.locator('#previewSiteApplied').click();
  await expect(page.locator('#previewSiteApplied')).toHaveAttribute('aria-pressed','true');
  const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  const state=await page.evaluate(html=>{
    const doc=new DOMParser().parseFromString(html,'text/html');
    return {header:doc.querySelector('header')?.textContent,footer:doc.querySelector('footer')?.textContent,
      link:doc.querySelector('main a')?.getAttribute('href'),
      maxWidth:doc.querySelector('main section p')?.style.maxWidth,
      fontSize:doc.querySelector('main section p')?.style.fontSize,
      iframeCount:doc.querySelectorAll('main iframe').length,
      scripts:doc.querySelectorAll('script').length};
  },html);
  expect(state).toEqual({header:'Site navigation',footer:'Site footer',link:'research.html',
    maxWidth:'60%',fontSize:'22px',iframeCount:0,scripts:0});
  await page.locator('#previewSiteOriginal').click();
  const original=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(original).not.toContain('max-width: 60%');
  await page.locator('#closeSitePreview').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportAppliedPreview').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('about.applied-review.html');
  const fs=require('node:fs');
  const saved=fs.readFileSync(await download.path(),'utf8');
  expect(saved).toContain('Site footer');
  expect(saved).toContain('max-width: 60%');
  expect(saved).toContain('href="research.html"');
});

test('publishable-edits preview preserves original site markup when content is unchanged', async ({ page }) => {
  await page.route('**/research.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<html><head></head><body><header>Header</header><main><section><h2>Title</h2><blockquote><p>Research note</p></blockquote><ul><li>Item one</li></ul></section></main><footer>Footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('research.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(html).toContain('<blockquote>');
  expect(html).toContain('<li>Item one</li>');
  expect(html).toContain('Review of 0 publishable text or style edits');
});

test('in-canvas F2 editing updates text and can be undone', async ({ page }) => {
  await page.locator('#grid .block').first().click();
  const block=page.locator('#grid .block').first();
  await block.focus();
  await block.press('F2');
  await expect(page.locator('.inline-editor')).toBeVisible();
  await page.locator('.inline-editor').fill('Edited in place');
  await page.locator('.inline-editor').press('ControlOrMeta+Enter');
  await expect(page.locator('.inline-editor')).toHaveCount(0);
  await expect(page.locator('#grid .block').first()).toContainText('Edited in place');
  await page.locator('#undo').click();
  await expect(page.locator('#grid .block').first()).toContainText('Your page heading');
});

test('in-canvas Escape cancels changes without changing the block', async ({ page }) => {
  await page.locator('#grid .block').nth(1).click();
  await page.locator('#editCanvasText').click();
  await expect(page.locator('.inline-editor')).toBeVisible();
  await page.locator('.inline-editor').fill('Discard this change');
  await page.locator('.inline-editor').press('Escape');
  await expect(page.locator('#grid .block').nth(1)).toContainText('Click this paragraph');
  await expect(page.locator('.inline-editor')).toHaveCount(0);
});

test('in-canvas edits of imported text use the verified handoff', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><body><main><section><p>Original paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#editCanvasText').click();
  await page.locator('.inline-editor').fill('Edited directly in the canvas');
  await page.locator('.inline-editor').press('ControlOrMeta+Enter');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  expect(await page.evaluate(() => localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toContain('Edited directly in the canvas');
});

test('in-canvas editing keeps HTML pasted as plain text', async ({ page }) => {
  await page.locator('#grid .block').nth(1).click();
  await page.locator('#editCanvasText').click();
  await page.locator('.inline-editor').fill('<img src=x onerror=alert(1)>');
  await page.locator('.inline-editor').press('ControlOrMeta+Enter');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportHtml').click();
  const fs=require('node:fs');
  const html=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  expect(html).not.toContain('<img src=x onerror=alert(1)>');
});

test('capture desktop and mobile screenshots of builder and full-site preview', async ({ page }) => {
  const fs=require('node:fs');
  fs.mkdirSync('test-results/layout-previews',{recursive:true});
  await page.setViewportSize({width:1366,height:900});
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block').first()).toBeVisible();
  await page.locator('#grid .block').first().click();
  await page.locator('#fontSize').fill('32');
  await page.locator('#fontSize').dispatchEvent('change');
  await page.locator('#canvas').screenshot({path:'test-results/layout-previews/builder-desktop.png'});
  await page.locator('#device').selectOption('mobile');
  await page.locator('#canvas').screenshot({path:'test-results/layout-previews/builder-mobile.png'});
  await page.locator('#viewSitePreview').click();
  await expect(page.locator('#sitePreviewDialog')).toBeVisible();
  await page.locator('#previewSiteApplied').click();
  await expect(page.frameLocator('#sitePreviewFrame').locator('main').first()).toBeVisible();
  await page.locator('#sitePreviewDialog').screenshot({path:'test-results/layout-previews/website-applied-desktop.png'});
  await page.locator('#previewSiteMobile').click();
  await expect(page.frameLocator('#sitePreviewFrame').locator('main').first()).toBeVisible();
  await page.locator('#sitePreviewDialog').screenshot({path:'test-results/layout-previews/website-applied-mobile.png'});
  await page.locator('#previewSiteProposal').click();
  await expect(page.frameLocator('#sitePreviewFrame').locator('main').first()).toBeVisible();
  await page.locator('#sitePreviewDialog').screenshot({path:'test-results/layout-previews/website-freeform-mobile.png'});
});

test('in-canvas edits autosave locally and survive reload without pressing Save now', async ({ page }) => {
  await page.locator('#grid .block').first().click();
  await page.locator('#editCanvasText').click();
  await page.locator('.inline-editor').fill('Automatically saved heading');
  await page.locator('.inline-editor').press('ControlOrMeta+Enter');
  await expect.poll(async()=>page.evaluate(()=>localStorage.getItem('moon-fluid-layout-lab-v1'))).toContain('Automatically saved heading');
  await page.reload();
  await expect(page.locator('#grid .block').first()).toContainText('Automatically saved heading');
  await page.locator('#undo').click();
  await expect(page.locator('#grid .block').first()).toContainText('Automatically saved heading');
});

test('flow changes autosave locally across page reloads', async ({ page }) => {
  await page.locator('#grid .block').nth(1).click();
  await page.locator('#maxWidthPct').fill('68');
  await page.locator('#maxWidthPct').dispatchEvent('change');
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks?.[1]?.maxWidthPct)).toBe(68);
  await page.reload();
  await page.locator('#grid .block').nth(1).click();
  await expect(page.locator('#maxWidthPct')).toHaveValue('68');
});

test('keyboard movement of imported block is treated as unpublishable layout change', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',body:'<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(1);
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks?.[0]?.source?.page)).toBe('about.html');
  await page.locator('#grid .block').first().focus();
  await page.locator('#grid .block').first().press('ArrowRight');
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks?.[0]?.layoutEdited??false)).toBe(true);
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
  await expect(page.locator('#status')).toContainText('Only structural or freeform layout changes');
  await page.locator('#undo').click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks?.[0]?.layoutEdited??false)).toBe(false);
});

test('dragging imported text is tracked as unpublishable canvas layout', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',body:'<main><section><p>Original paragraph</p></section></main>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(1);
  const area=await page.locator('#grid .block').first().boundingBox();
  await page.mouse.move(area.x+25,area.y+25);
  await page.mouse.down();
  await page.mouse.move(area.x+175,area.y+25,{steps:6});
  await page.mouse.up();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks?.[0]?.layoutEdited)).toBe(true);
  await page.locator('#openPublisher').click();
  await expect(page.locator('#status')).toContainText('Only structural or freeform layout changes');
});

test('responsive sibling group transfers as source-preserving CSS with separate mobile rules', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head><title>About</title></head><body><header>Site navigation</header><main><section id="layout"><h2>Section heading</h2><p>Read <a href="research.html">research</a> here.</p></section></main><footer>Site footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await page.locator('#reviewPatch').click();
  await expect(page.locator('#reviewEntries')).toContainText('Responsive group');
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const proposed=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(proposed).toContain('id="moon-responsive-group-layout"');
  expect(proposed).toContain('@media(max-width:700px)');
  expect(proposed).toContain('href="research.html"');
  await page.locator('#closeSitePreview').click();
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await page.locator('#reviewBtn').click();
  await expect(page.locator('#reviewChangeList')).toContainText('Responsive group');
  await expect(page.locator('#reviewExportStatus')).toContainText('Source check passed');
  await page.locator('#reviewDialog form button').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('<style id="moon-responsive-group-layout">');
  expect(html).toContain('grid-template-columns:repeat(12,minmax(0,1fr))');
  expect(html).toContain('@media(max-width:700px)');
  expect(html).toContain('Site footer');
  expect(html).toContain('href="research.html"');
});

test('responsive sibling group rejects incomplete source groups with unrelated child content', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<html><head></head><body><main><section id="layout"><h2>Heading</h2><a href="research.html">Unmapped link</a><p>Paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#status')).toContainText('Responsive group blocked');
  await expect(page.locator('#responsiveGroupStatus')).toContainText('No responsive group selected');
});

test('responsive group retains draft and can be cleared with undo support', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<html><head></head><body><main><section id="layout"><h2>Title</h2><p>Paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.responsiveGroup?.selectors?.length)).toBe(2);
  await page.reload();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await page.locator('#clearResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('No responsive group selected');
  await page.locator('#undo').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
});

test('real About page responsive group preserves complete page markup in editor export', async ({ page }) => {
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block.heading').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('blocks');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('id="moon-responsive-group-layout"');
  expect(html).toContain('about-page');
  expect(html).toContain('assets/profile-portrait.webp');
  expect(html).toContain('A little about me');
});
