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
  await expect(page.locator('#sitePreviewFrame')).toHaveAttribute('srcdoc', /Original paragraph/);
  await expect(page.locator('#sitePreviewFrame')).not.toHaveAttribute('srcdoc', /Experimental layout review only/);
  await page.locator('#previewSiteProposal').click();
  await expect(page.locator('#sitePreviewFrame')).toHaveAttribute('srcdoc', /Revised paragraph/);
  await page.locator('#previewSiteMobile').click();
  await expect(page.locator('#sitePreviewFrame')).toHaveClass(/mobile/);
  await page.locator('#previewSiteDesktop').click();
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
