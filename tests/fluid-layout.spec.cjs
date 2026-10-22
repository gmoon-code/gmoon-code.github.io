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
  await expect(page.locator('#sitePreviewAudit')).toContainText('Canvas proposal overlaps (excluded from publishable edits):');
  const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(html).toContain('Text-only imports do not preserve their formatting or interactions');
});

test('editor toolbar exposes distinct draft, review, export, and handoff groups', async ({ page }) => {
  await expect(page.getByRole('group',{name:'Edit history'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Review layout'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Export drafts'})).toBeVisible();
  await expect(page.getByRole('group',{name:'Editor handoff'})).toBeVisible();
  await expect(page.locator('#viewSitePreview')).toHaveText('Preview inside website');
  await expect(page.locator('#openPublisher')).toHaveText('Review transferable edits in main editor');
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
  await page.locator('#closeSitePreview').click();
  await page.locator('#device').selectOption('desktop');
  await page.locator('#grid .block.heading').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('blocks');
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  await expect(page.frameLocator('#sitePreviewFrame').locator('#moon-responsive-group-layout')).toHaveCount(1);
  await page.locator('#sitePreviewDialog').screenshot({path:'test-results/layout-previews/responsive-group-desktop.png'});
  await page.locator('#previewSiteMobile').click();
  await page.locator('#sitePreviewDialog').screenshot({path:'test-results/layout-previews/responsive-group-mobile.png'});
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

test('forged overlapping responsive placement is rejected without a local editor draft', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout"><h2>Heading</h2><p>Paragraph</p></section></main></body></html>'
  }));
  const same={x:1,y:1,w:12,h:3};
  const payload={version:3,page:'about.html',changes:[],styleChanges:[],layoutGroup:{
    version:1,parentSelector:'#layout',children:[
      {selector:'#layout > h2:nth-of-type(1)',tag:'h2',before:'Heading',desktop:same,mobile:same},
      {selector:'#layout > p:nth-of-type(1)',tag:'p',before:'Paragraph',desktop:same,mobile:same}
    ]
  }};
  await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
  await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
  await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
  expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('responsive group handoff rejects an original text change between verification and receipt', async ({ page }) => {
  let reads=0;
  await page.route('**/about.html', route => {
    reads++;
    return route.fulfill({status:200,contentType:'text/html',
      body:'<!doctype html><html><head></head><body><main><section id="layout"><h2>Heading</h2><p>'+
        (reads>=4?'Changed elsewhere':'Paragraph')+'</p></section></main></body></html>'});
  });
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
  expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('accepted responsive grid group survives editor reload and can be undone', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout"><h2>Heading</h2><p>Paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))?.responsiveGroup?.children?.length)).toBe(2);
  await page.reload();
  await expect(page.locator('#reviewBtn')).toBeEnabled();
  await page.locator('#reviewBtn').click();
  await expect(page.locator('#reviewChangeList')).toContainText('Responsive group');
  await page.locator('#reviewDialog form button').click();
  await page.locator('#resetBtn').click();
  await expect(page.locator('#exportBtn')).toBeDisabled();
  await expect.poll(async()=>page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('responsive grid rejects visual reordering that diverges from keyboard and screen-reader order', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout"><h2>First</h2><p>Second</p></section></main></body></html>'
  }));
  const payload={version:3,page:'about.html',changes:[],styleChanges:[],layoutGroup:{
    version:1,parentSelector:'#layout',children:[
      {selector:'#layout > h2:nth-of-type(1)',tag:'h2',before:'First',
        desktop:{x:1,y:4,w:6,h:1},mobile:{x:1,y:1,w:12,h:1}},
      {selector:'#layout > p:nth-of-type(1)',tag:'p',before:'Second',
        desktop:{x:7,y:1,w:5,h:1},mobile:{x:1,y:3,w:12,h:1}}
    ]
  }};
  await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
  await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
  await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
  expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('builder blocks responsive section whose canvas order no longer matches source reading order', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout"><h2>First</h2><p>Second</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#grid .block').first().click();
  await page.locator('#y').fill('12');
  await page.locator('#y').dispatchEvent('change');
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#status')).toContainText('reading order');
  await expect(page.locator('#responsiveGroupStatus')).toContainText('No responsive group selected');
});

test('responsive grid and ordinary text edits transfer and export together safely', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout"><h2>First heading</h2><p>Second paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await page.locator('#text').fill('Changed first heading');
  await page.locator('#text').dispatchEvent('change');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('Changed first heading');
  expect(html).toContain('<style id="moon-responsive-group-layout">');
  expect(html).toContain('Second paragraph');
  expect(html).not.toContain('data-editor-key');
});

test('undo discards incoming responsive grid CSS without affecting original markup', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout"><h2>First</h2><p>Second</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await expect(page.locator('#exportBtn')).toBeEnabled();
  await page.locator('#undoBtn').click();
  await expect(page.locator('#exportBtn')).toBeDisabled();
  await expect.poll(async()=>page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('find compatible sections and arrange selected group in two desktop columns', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main>'+
      '<section id="alpha"><h2>Alpha</h2><p>First paragraph</p></section>'+
      '<section id="beta"><h2>Beta</h2><p>Second paragraph</p><p>Third paragraph</p></section>'+
      '</main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(5);
  await page.locator('#findResponsiveGroups').click();
  await expect(page.locator('#responsiveGroupPicker option')).toHaveCount(3);
  await page.locator('#responsiveGroupPicker').selectOption('1');
  await page.locator('#applyResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('3 blocks');
  await expect(page.locator('#grid .responsive-member')).toHaveCount(3);
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1')));
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.responsiveGroup?.selectors?.length)).toBe(3);
  const layout=await page.evaluate(()=>{
    const b=JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1')).blocks.filter(b=>b.source?.selector.includes('#beta'));
    return b.map(({x,y,w,mobile})=>({x,y,w,mobile}));
  });
  expect(layout).toHaveLength(3);
  expect(layout[0].x).toBe(1);
  expect(layout[1].x).toBe(7);
  expect(layout[0].y).toBe(layout[1].y);
  expect(layout.every(b=>b.mobile.x===1&&b.mobile.w===12)).toBe(true);
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const review=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(review).toContain('id="moon-responsive-group-layout"');
  expect(review).toContain('grid-column:7 / span 6');
  await page.locator('#closeSitePreview').click();
});

test('preset buttons switch between stacked and two-column layouts and undo restores layout', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout">'+
      '<h2>Heading</h2><p>Paragraph with <a href="research.html">research link</a>.</p>'+
      '</section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#findResponsiveGroups').click();
  await page.locator('#applyResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await page.locator('#stackResponsiveGroup').click();
  await expect.poll(async()=>page.evaluate(()=>{
    const b=JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks;
    return b?.[0]?.w===12&&b?.[1]?.w===12;
  })).toBe(true);
  await page.locator('#columnsResponsiveGroup').click();
  await expect.poll(async()=>page.evaluate(()=>{
    const b=JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks;
    return b?.[0]?.w===6&&b?.[1]?.x===7;
  })).toBe(true);
  await page.locator('#undo').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await expect.poll(async()=>page.evaluate(()=>{
    const b=JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.blocks;
    return b?.[0]?.w===12&&b?.[1]?.w===12;
  })).toBe(true);
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('href="research.html"');
  expect(html).toContain('grid-column:1 / span 12');
});

test('section discovery ignores incomplete groups and reports no compatible sections', async ({ page }) => {
  await page.route('**/research.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout">'+
      '<h2>Heading</h2><a href="about.html">Direct link</a><p>Paragraph</p>'+
      '</section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('research.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#findResponsiveGroups').click();
  await expect(page.locator('#responsiveGroupPicker option')).toHaveCount(1);
  await expect(page.locator('#status')).toContainText('No compatible sections');
  await page.locator('#applyResponsiveGroup').click();
  await expect(page.locator('#status')).toContainText('Find and select a compatible section');
});

test('responsive group arrangement rejects source changes after discovery', async ({ page }) => {
  let altered=false;
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout">'+
      '<h2>Heading</h2><p>'+(altered?'Updated elsewhere':'Original paragraph')+'</p>'+
      '</section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findResponsiveGroups').click();
  await expect(page.locator('#responsiveGroupPicker option')).toHaveCount(2);
  altered=true;
  await page.locator('#applyResponsiveGroup').click();
  await expect(page.locator('#status')).toContainText('Arrangement blocked');
  await expect(page.locator('#responsiveGroupStatus')).toContainText('No responsive group selected');
});

test('duplicating an imported styled block exports a reusable JSON draft', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section><h2>Heading</h2><p>Paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#grid .block').first().click();
  await page.locator('#fontSize').fill('36');
  await page.locator('#fontSize').dispatchEvent('change');
  await page.locator('#duplicate').click();
  await expect(page.locator('#grid .block')).toHaveCount(3);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#export').click();
  const exported=JSON.parse(require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8'));
  expect(exported.blocks[2].source).toBeUndefined();
  expect(exported.blocks[2].styleEdits).toBeUndefined();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#jsonImport').setInputFiles({
    name:'layout.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(exported))
  });
  await expect(page.locator('#status')).toContainText('Imported 3 saved blocks');
});

test('deleting a mapped responsive group member clears the group but preserves undo', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section><h2>Heading</h2><p>Paragraph</p></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#grid .block').first().click();
  await page.locator('#useResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await page.locator('#remove').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('No responsive group selected');
  await expect(page.locator('#grid .block')).toHaveCount(1);
  await page.locator('#undo').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await expect(page.locator('#grid .block')).toHaveCount(2);
});

test('JSON import refuses a responsive group with missing or repeated selectors', async ({ page }) => {
  const block={id:1,type:'heading',text:'Heading',x:1,y:1,w:12,h:2,
    source:{page:'about.html',selector:'#content > h2:nth-of-type(1)',tag:'h2',originalText:'Heading'}};
  const bad={version:2,sourcePage:'about.html',blocks:[block],responsiveGroup:{
    parentSelector:'#content',selectors:[block.source.selector,block.source.selector]
  }};
  await page.locator('#jsonImport').setInputFiles({
    name:'bad-group.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))
  });
  await expect(page.locator('#status')).toContainText('Invalid responsive group metadata');
  await expect(page.locator('#grid .block')).toHaveCount(3);
});

test('compatible section discovery works on the actual About page source', async ({ page }) => {
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block.heading').first()).toBeVisible();
  await page.locator('#findResponsiveGroups').click();
  await expect(page.locator('#status')).toContainText(/Found \d+ complete text sections|No compatible sections found/);
  const count=await page.locator('#responsiveGroupPicker option').count();
  expect(count).toBeGreaterThanOrEqual(1);
  if(count>1){
    await page.locator('#applyResponsiveGroup').click();
    await expect(page.locator('#responsiveGroupStatus')).toContainText('blocks');
  }
});

test('report compatible responsive sections across all eight portfolio pages', async ({ page }) => {
  test.setTimeout(120000);
  const fs=require('node:fs');
  const pages=['index.html','research.html','projects.html','teaching.html',
    'interests.html','about.html','cv.html','pungmul.html'];
  const report=[];
  for(const filename of pages){
    await page.locator('#sourcePage').selectOption(filename);
    page.once('dialog', dialog=>dialog.accept());
    await page.locator('#importPage').click();
    await expect(page.locator('#status')).toContainText('Imported');
    const imported=await page.locator('#grid .block').count();
    await page.locator('#findResponsiveGroups').click();
    await expect(page.locator('#status')).toContainText(/Found \d+ complete text sections|No compatible sections found/);
    const options=await page.locator('#responsiveGroupPicker option').allTextContents();
    await page.locator('#findContainerGroups').click();
    await expect(page.locator('#status')).toContainText(/Found \d+ complete card|No complete card or row groups/);
    const cards=await page.locator('#containerGroupPicker option').allTextContents();
    report.push({page:filename,importedBlocks:imported,compatibleTextSections:options.length-1,
      compatibleCardGroups:cards.length-1,
      textExamples:options.slice(1,4),cardExamples:cards.slice(1,4)});
  }
  fs.mkdirSync('test-results/layout-previews',{recursive:true});
  fs.writeFileSync('test-results/layout-previews/compatible-sections.json',
    JSON.stringify({description:'Draft-only responsive group compatibility. No live pages modified.',
      generatedFrom:'Portfolio source pages in the test branch',pages:report},null,2));
  expect(report).toHaveLength(8);
  expect(report.every(row=>row.importedBlocks>0)).toBe(true);
});

test('responsive grid does not introduce excessive vertical gaps on either device', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="layout">'+
      '<h2>Heading</h2><p>Two lines of paragraph text for an ordinary responsive section.</p>'+
      '</section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog', dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(2);
  await page.locator('#findResponsiveGroups').click();
  await page.locator('#stackResponsiveGroup').click();
  await expect(page.locator('#status')).toContainText('Select a responsive group');
  await page.locator('#applyResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  await page.locator('#stackResponsiveGroup').click();
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const frame=page.frameLocator('#sitePreviewFrame');
  for(const device of ['previewSiteDesktop','previewSiteMobile']){
    await page.locator('#'+device).click();
    const heading=await frame.locator('#layout h2').boundingBox();
    const paragraph=await frame.locator('#layout p').boundingBox();
    expect(heading).not.toBeNull();
    expect(paragraph).not.toBeNull();
    const gap=paragraph.y-(heading.y+heading.height);
    expect(gap).toBeGreaterThanOrEqual(-2);
    expect(gap).toBeLessThan(90);
  }
});

test('imported portrait images fit their resizable canvas blocks without clipping', async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section>'+
      '<img src="assets/profile-portrait.webp" alt="Portrait"></section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('about.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block.image img')).toBeVisible();
  const dimensions=await page.locator('#grid .block.image').evaluate(block=>{
    const image=block.querySelector('img'),container=block.querySelector('.content');
    const ir=image.getBoundingClientRect(),cr=container.getBoundingClientRect();
    return {fit:getComputedStyle(image).objectFit,within:ir.width<=cr.width+1&&ir.height<=cr.height+1,
      naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight};
  });
  expect(dimensions.fit).toBe('contain');
  expect(dimensions.within).toBe(true);
  expect(dimensions.naturalWidth).toBeGreaterThan(0);
  expect(dimensions.naturalHeight).toBeGreaterThan(0);
});

test('card layout group preserves nested links and images in reviewed responsive HTML', async ({ page }) => {
  await page.route('**/index.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head><title>Home</title></head><body><header>Site navigation</header>'+
      '<main><section id="teaching-research"><div id="cards">'+
      '<article><h2>Research</h2><p>Explore <a href="research.html">research</a></p></article>'+
      '<article><h2>Teaching</h2><figure><img src="assets/profile-portrait.webp" alt="Portrait"></figure>'+
      '<p>Read <a href="teaching.html">teaching</a></p></article>'+
      '</div></section></main><footer>Site footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('index.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(5);
  await page.locator('#findContainerGroups').click();
  await expect(page.locator('#containerGroupPicker option')).toHaveCount(2);
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected · 2 blocks');
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  const details=await page.evaluate(raw=>{
    const doc=new DOMParser().parseFromString(raw,'text/html');
    return {
      cards:doc.querySelectorAll('#cards > article').length,
      links:[...doc.querySelectorAll('#cards a')].map(a=>a.getAttribute('href')),
      alt:doc.querySelector('#cards img')?.getAttribute('alt'),
      css:doc.querySelector('#moon-responsive-group-layout')?.textContent,
      footer:doc.querySelector('footer')?.textContent
    };
  },html);
  expect(details.cards).toBe(2);
  expect(details.links).toEqual(['research.html','teaching.html']);
  expect(details.alt).toBe('Portrait');
  expect(details.footer).toBe('Site footer');
  expect(details.css).toContain('grid-column:7 / span 6');
  await page.locator('#closeSitePreview').click();
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=index\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await page.locator('#reviewBtn').click();
  await expect(page.locator('#reviewChangeList')).toContainText('Responsive group');
  await page.locator('#reviewDialog form button').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const exported=require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8');
  expect(exported).toContain('<style id="moon-responsive-group-layout">');
  expect(exported).toContain('href="research.html"');
  expect(exported).toContain('href="teaching.html"');
  expect(exported).toContain('alt="Portrait"');
});

test('card group revalidation rejects changed image markup even when text stays identical', async ({ page }) => {
  let changed=false;
  await page.route('**/index.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section id="cards">'+
      '<article><h2>Research</h2><img src="assets/'+(changed?'second':'profile-portrait')+'.webp" alt="Portrait"></article>'+
      '<article><h2>Teaching</h2><p>Classroom inquiry</p></article>'+
      '</section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('index.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('2 blocks');
  changed=true;
  await page.locator('#viewSitePreview').click();
  await expect(page.locator('#status')).toContainText('responsive section source has changed');
  await expect(page.locator('#sitePreviewDialog')).not.toBeVisible();
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
  await expect(page.locator('#status')).toContainText('blocked');
});

test('CV row container group retains nested emphasis and hyperlinks', async ({ page }) => {
  await page.route('**/cv.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><section>'+
      '<div id="records"><div class="list-row"><div>2026</div><p><strong>MEd</strong> · <a href="about.html">About</a></p></div>'+
      '<div class="list-row"><div>2020</div><p><strong>BSc</strong> · University of British Columbia</p></div></div>'+
      '</section></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('cv.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected');
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(html).toContain('<strong>MEd</strong>');
  expect(html).toContain('href="about.html"');
  expect(html).toContain('id="moon-responsive-group-layout"');
});

test('container groups are discoverable in actual Home and CV pages', async ({ page }) => {
  for(const filename of ['index.html','cv.html']){
    await page.locator('#sourcePage').selectOption(filename);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#importPage').click();
    await expect(page.locator('#status')).toContainText('Imported');
    await page.locator('#findContainerGroups').click();
    await expect(page.locator('#status')).toContainText('Found');
    expect(await page.locator('#containerGroupPicker option').count()).toBeGreaterThan(1);
    await page.locator('#applyContainerGroup').click();
    await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected');
    await page.locator('#viewSitePreview').click();
    await page.locator('#previewSiteApplied').click();
    const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
    expect(html).toContain('id="moon-responsive-group-layout"');
    await page.locator('#closeSitePreview').click();
  }
});

test('card layout width presets produce safe 8/4, 4/8 and three-column desktop grids', async ({ page }) => {
  await page.route('**/index.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><div id="tiles">'+
      '<article><h2>First card</h2><p>Details</p></article>'+
      '<article><h2>Second card</h2><p>Details</p></article>'+
      '<article><h2>Third card</h2><p>Details</p></article>'+
      '</div></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('index.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await expect(page.locator('#containerGroupPicker option')).toHaveCount(2);
  for(const [mode,expected] of [
    ['first-wide','grid-column:9 / span 4'],
    ['last-wide','grid-column:5 / span 8'],
    ['thirds','grid-column:9 / span 4']
  ]){
    await page.locator('#containerColumns').selectOption(mode);
    await page.locator('#applyContainerGroup').click();
    await page.locator('#viewSitePreview').click();
    await page.locator('#previewSiteApplied').click();
    const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
    expect(html).toContain(expected);
    expect(html).toContain('id="moon-responsive-group-layout"');
    expect(html).toContain('<h2>Third card</h2>');
    await page.locator('#closeSitePreview').click();
  }
});

test('source-exact card drafts survive JSON export import and block unexpected source changes', async ({ page }) => {
  let changed=false;
  await page.route('**/cv.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><div id="rows">'+
      '<div class="row"><p>2026 · <strong>Degree</strong></p></div>'+
      '<div class="row"><p>2020 · '+(changed?'Revised':'Original')+' degree</p></div>'+
      '</div></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('cv.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#export').click();
  const json=require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8');
  const layout=JSON.parse(json);
  expect(layout.responsiveGroup.containerChildren).toHaveLength(2);
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#jsonImport').setInputFiles({
    name:'card-layout.json',mimeType:'application/json',buffer:Buffer.from(json)
  });
  await expect(page.locator('#status')).toContainText('Imported');
  await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected');
  changed=true;
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/fluid-layout-lab\.html$/);
  await expect(page.locator('#status')).toContainText('source has changed');
});

test('forged card group markup cannot be accepted by the destination editor', async ({ page }) => {
  await page.route('**/index.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><div id="cards">'+
      '<article><h2>Research</h2></article><article><h2>Teaching</h2></article>'+
      '</div></main></body></html>'
  }));
  const children=[
    {selector:'#cards > article:nth-of-type(1)',tag:'article',before:'Research',
      markup:'<article><h2>Forged</h2></article>',
      desktop:{x:1,y:1,w:6,h:1},mobile:{x:1,y:1,w:12,h:1}},
    {selector:'#cards > article:nth-of-type(2)',tag:'article',before:'Teaching',
      markup:'<article><h2>Teaching</h2></article>',
      desktop:{x:7,y:1,w:6,h:1},mobile:{x:1,y:3,w:12,h:1}}
  ];
  const payload={version:3,page:'index.html',changes:[],styleChanges:[],
    layoutGroup:{version:2,parentSelector:'#cards',children}};
  await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
  await page.goto('http://127.0.0.1:8765/editor.html?page=index.html&importFluidText=1');
  await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
  expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:index.html'))).toBeNull();
});

test('capture original-site desktop and mobile card and CV row previews', async ({ page }) => {
  test.setTimeout(90000);
  const fs=require('node:fs');
  fs.mkdirSync('test-results/layout-previews',{recursive:true});
  await page.setViewportSize({width:1440,height:1000});
  for(const [filename,stem,preset] of [
    ['index.html','home-card-layout','first-wide'],
    ['cv.html','cv-row-layout','columns']
  ]){
    await page.locator('#sourcePage').selectOption(filename);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#importPage').click();
    await expect(page.locator('#status')).toContainText('Imported');
    await page.locator('#findContainerGroups').click();
    await expect.poll(async()=>page.locator('#containerGroupPicker option').count()).toBeGreaterThan(1);
    await page.locator('#containerColumns').selectOption(preset);
    await page.locator('#applyContainerGroup').click();
    await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected');
    await page.locator('#viewSitePreview').click();
    await page.locator('#previewSiteApplied').click();
    await expect(page.frameLocator('#sitePreviewFrame').locator('#moon-responsive-group-layout')).toHaveCount(1);
    await page.locator('#sitePreviewDialog').screenshot({
      path:'test-results/layout-previews/'+stem+'-desktop.png'
    });
    await page.locator('#previewSiteMobile').click();
    await page.locator('#sitePreviewDialog').screenshot({
      path:'test-results/layout-previews/'+stem+'-mobile.png'
    });
    await page.locator('#closeSitePreview').click();
  }
});

test('Home nested card layout and headline text edits transfer together without losing links', async ({ page }) => {
  await page.route('**/index.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><div id="cards">'+
      '<article><h2>Research</h2><p>Original description</p><a href="research.html">Research details</a></article>'+
      '<article><h2>Teaching</h2><p>Another description</p><a href="teaching.html">Teaching details</a></article>'+
      '</div></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('index.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(4);
  await page.locator('#grid .block.heading').first().click();
  await page.locator('#text').fill('Scientific inquiry');
  await page.locator('#text').dispatchEvent('change');
  await page.locator('#findContainerGroups').click();
  await page.locator('#containerColumns').selectOption('first-wide');
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected');
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=index\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=require('node:fs').readFileSync(await (await downloadPromise).path(),'utf8');
  expect(html).toContain('Scientific inquiry');
  expect(html).toContain('grid-column:9 / span 4');
  expect(html).toContain('href="research.html"');
  expect(html).toContain('href="teaching.html"');
  expect(html).toContain('Another description');
});

test('card group layout persists through editor reload and can be reset', async ({ page }) => {
  await page.route('**/cv.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><div id="records">'+
      '<div><strong>2026</strong><p>Graduate degree</p></div>'+
      '<div><strong>2020</strong><p>Undergraduate degree</p></div>'+
      '</div></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('cv.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await page.locator('#applyContainerGroup').click();
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-portfolio-visual-editor-v1:cv.html'))?.responsiveGroup?.version)).toBe(2);
  await page.reload();
  await expect(page.locator('#reviewBtn')).toBeEnabled();
  await page.locator('#reviewBtn').click();
  await expect(page.locator('#reviewChangeList')).toContainText('Responsive group');
  await page.locator('#reviewDialog form button').click();
  await page.locator('#resetBtn').click();
  await expect(page.locator('#exportBtn')).toBeDisabled();
  await expect.poll(async()=>page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:cv.html'))).toBeNull();
});

test('custom card split slider adjusts widths while preserving the mobile stack', async ({ page }) => {
  await page.route('**/index.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><div id="cards">'+
      '<article><h2>Content</h2><a href="research.html">Research</a></article>'+
      '<figure><img src="assets/profile-portrait.webp" alt="Profile photo"></figure>'+
      '</div></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('index.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await page.locator('#containerColumns').selectOption('custom');
  await page.locator('#containerFirstWidth').fill('7');
  await expect(page.locator('#containerRatioValue')).toHaveText('7 / 5 columns');
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupStatus')).toContainText('Card or CV row group selected');
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const markup=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(markup).toContain('grid-column:1 / span 7');
  expect(markup).toContain('grid-column:8 / span 5');
  expect(markup).toContain('href="research.html"');
  expect(markup).toContain('alt="Profile photo"');
  expect(markup).toContain('@media(max-width:700px)');
  await page.locator('#closeSitePreview').click();
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
});

test('two independent card groups transfer together without rewriting either section', async ({ page }) => {
  await page.route('**/index.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head><title>Home</title></head><body><header>Navigation</header><main>'+
      '<section id="a"><div id="alpha"><article><h2>Alpha research</h2><a href="research.html">Read research</a></article>'+
      '<article><h2>Alpha teaching</h2><a href="teaching.html">Read teaching</a></article></div></section>'+
      '<section id="b"><div id="beta"><article><h2>Beta journal</h2><p>Learning project</p></article>'+
      '<article><h2>Beta picture</h2><img src="assets/profile-portrait.webp" alt="Portrait"></article></div></section>'+
      '</main><footer>Footer</footer></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('index.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await expect(page.locator('#grid .block')).toHaveCount(6);
  await page.locator('#findContainerGroups').click();
  await expect(page.locator('#containerGroupPicker option')).toHaveCount(3);
  await page.locator('#containerGroupPicker').selectOption('0');
  await page.locator('#containerColumns').selectOption('first-wide');
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupCount')).toContainText('1 responsive group');
  await page.locator('#containerGroupPicker').selectOption('1');
  await page.locator('#containerColumns').selectOption('last-wide');
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupCount')).toContainText('2 responsive groups');
  await expect(page.locator('#activeGroupPicker option')).toHaveCount(3);
  await page.locator('#viewSitePreview').click();
  await page.locator('#previewSiteApplied').click();
  const preview=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
  expect(preview.match(/Reviewed responsive group/g)).toHaveLength(2);
  expect(preview).toContain('grid-column:9 / span 4');
  expect(preview).toContain('grid-column:5 / span 8');
  expect(preview).toContain('href="research.html"');
  expect(preview).toContain('alt="Portrait"');
  await page.locator('#closeSitePreview').click();
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#openPublisher').click();
  await expect(page).toHaveURL(/editor\.html\?page=index\.html$/);
  await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
  await page.locator('#reviewBtn').click();
  await expect(page.locator('#reviewChangeList')).toContainText('2 sections');
  await page.locator('#reviewDialog form button').click();
  const download=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=require('node:fs').readFileSync(await (await download).path(),'utf8');
  expect(html.match(/Reviewed responsive group/g)).toHaveLength(2);
  expect(html).toContain('Read research');
  expect(html).toContain('alt="Portrait"');
  expect(html).toContain('Footer');
});

test('independent groups survive autosave, reload, picker changes and removal', async ({ page }) => {
  await page.route('**/cv.html', route => route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main>'+
      '<section><div id="degrees"><div><p>2026 MEd</p></div><div><p>2020 BSc</p></div></div></section>'+
      '<section><div id="teaching"><div><p>2024 School</p></div><div><p>2022 School</p></div></div></section>'+
      '</main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('cv.html');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await expect(page.locator('#containerGroupPicker option')).toHaveCount(3);
  await page.locator('#applyContainerGroup').click();
  await page.locator('#containerGroupPicker').selectOption('1');
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupCount')).toContainText('2 responsive groups');
  await expect.poll(async()=>page.evaluate(()=>{
    const saved=JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'));
    return !!saved && saved.responsiveGroups?.length===1 && !!saved.responsiveGroup;
  })).toBe(true);
  await page.reload();
  await expect(page.locator('#responsiveGroupCount')).toContainText('2 responsive groups');
  await page.locator('#activeGroupPicker').selectOption('0');
  await page.locator('#clearResponsiveGroup').click();
  await expect(page.locator('#responsiveGroupCount')).toContainText('1 responsive group');
  await page.locator('#undo').click();
  await expect(page.locator('#responsiveGroupCount')).toContainText('2 responsive groups');
  const download=page.waitForEvent('download');
  await page.locator('#export').click();
  const data=JSON.parse(require('node:fs').readFileSync(await (await download).path(),'utf8'));
  expect(data.responsiveGroups).toHaveLength(1);
  page.on('dialog',dialog=>dialog.accept().catch(()=>{}));
  await page.locator('#jsonImport').setInputFiles({
    name:'multi-groups.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(data))
  });
  await expect(page.locator('#status')).toContainText('Imported');
  await expect(page.locator('#responsiveGroupCount')).toContainText('2 responsive groups');
});

test('nested and duplicate responsive groups are refused as one publishing set', async ({ page }) => {
  await page.route('**/index.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main><div id="outer">'+
      '<article><h2>First</h2><p>Paragraph</p></article>'+
      '<article><h2>Second</h2><p>Paragraph</p></article>'+
      '</div></main></body></html>'
  }));
  await page.locator('#sourcePage').selectOption('index.html');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#importPage').click();
  await page.locator('#findContainerGroups').click();
  await page.locator('#applyContainerGroup').click();
  await expect(page.locator('#responsiveGroupCount')).toContainText('1 responsive group');
  await page.locator('#findResponsiveGroups').click();
  const options=await page.locator('#responsiveGroupPicker option').count();
  if(options>1){
    await page.locator('#responsiveGroupPicker').selectOption('0');
    await page.locator('#applyResponsiveGroup').click();
    await expect(page.locator('#status')).toContainText('Nested responsive groups');
    await expect(page.locator('#responsiveGroupCount')).toContainText('1 responsive group');
  }
});

test('forged overlapping multi-group payload is refused atomically by the main editor', async ({ page }) => {
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:'<!doctype html><html><head></head><body><main>'+
      '<div id="g"><h2>Heading</h2><p>Paragraph</p></div></main></body></html>'
  }));
  const make=(width)=>({
    version:1,parentSelector:'#g',children:[
      {selector:'#g > h2:nth-of-type(1)',tag:'h2',before:'Heading',
        desktop:{x:1,y:1,w:width,h:1},mobile:{x:1,y:1,w:12,h:1}},
      {selector:'#g > p:nth-of-type(1)',tag:'p',before:'Paragraph',
        desktop:{x:1,y:3,w:12,h:1},mobile:{x:1,y:3,w:12,h:1}}
    ]
  });
  const payload={version:4,page:'about.html',changes:[],styleChanges:[],
    layoutGroups:[make(6),make(7)]};
  await page.evaluate(v=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(v)),payload);
  await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
  await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
  expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('actual Home and CV pages support two independent published card groups each', async ({ page }) => {
  test.setTimeout(120000);
  const fs=require('node:fs');
  fs.mkdirSync('test-results/layout-previews',{recursive:true});
  page.on('dialog',dialog=>dialog.accept().catch(()=>{}));
  for(const filename of ['index.html','cv.html']){
    await page.locator('#sourcePage').selectOption(filename);
    await page.locator('#importPage').click();
    await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('moon-fluid-layout-lab-v1'))?.sourcePage)).toBe(filename);
    await expect(page.locator('#status')).toContainText('Imported');
    await page.locator('#findContainerGroups').click();
    await expect.poll(async()=>page.locator('#containerGroupPicker option').count()).toBeGreaterThan(2);
    const options=await page.locator('#containerGroupPicker option').count();
    await page.locator('#applyContainerGroup').click();
    await expect(page.locator('#applyContainerGroup')).toBeEnabled();
    await expect(page.locator('#responsiveGroupCount')).toContainText('1 responsive group');
    let selected=false;
    for(let i=1;i<options-1;i++){
      await page.locator('#containerGroupPicker').selectOption(String(i));
      await page.locator('#applyContainerGroup').click();
      await expect(page.locator('#applyContainerGroup')).toBeEnabled();
      if((await page.locator('#responsiveGroupCount').textContent()).includes('2 responsive groups')){selected=true;break}
    }
    expect(selected).toBe(true);
    await page.locator('#viewSitePreview').click();
    await page.locator('#previewSiteApplied').click();
    const html=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
    const inspected=await page.evaluate(markup=>{
      const doc=new DOMParser().parseFromString(markup,'text/html');
      return {
        sheet:doc.getElementById('moon-responsive-group-layout')?.textContent||'',
        note:doc.querySelector('main > p')?.textContent||''
      };
    },html);
    const markerCount=(inspected.sheet.match(/\/\* Reviewed responsive group/g)||[]).length;
    if(markerCount!==2)throw Error('Unexpected group stylesheet '+JSON.stringify({
      filename,markerCount,note:inspected.note,selected:await page.locator('#responsiveGroupCount').textContent(),
      headings:inspected.sheet.split('/* Reviewed responsive group').slice(1).map(piece=>piece.match(/main ([^\n{]+)/)?.[1]||'unknown')
    }));
    await page.locator('#sitePreviewDialog').screenshot({
      path:'test-results/layout-previews/'+filename.replace('.html','')+'-two-groups-desktop.png'
    });
    await page.locator('#previewSiteMobile').click();
    await page.locator('#sitePreviewDialog').screenshot({
      path:'test-results/layout-previews/'+filename.replace('.html','')+'-two-groups-mobile.png'
    });
    await page.locator('#closeSitePreview').click();
    await page.locator('#openPublisher').click();
    await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
    await page.locator('#reviewBtn').click();
    await expect(page.locator('#reviewChangeList')).toContainText('2 sections');
    await page.locator('#reviewDialog form button').click();
    await page.goto('http://127.0.0.1:8765/fluid-layout-lab.html');
    await page.evaluate(()=>localStorage.clear());
    await page.reload();
  }
});

test('new paragraph transfers into reviewed HTML, preserving site links and escaping markup',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section id="content"><h2>Original heading</h2><p>Existing paragraph</p><a href="research.html">Research</a></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 page.once('dialog',dialog=>dialog.accept('New paragraph with <script>alert(1)</script>'));
 await page.locator('#appendSourceParagraph').click();
 await expect(page.locator('#grid .block')).toHaveCount(3);
 await page.locator('#viewSitePreview').click();
 await page.locator('#previewSiteApplied').click();
 const preview=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
 expect(preview).toContain('New paragraph with &lt;script&gt;alert(1)&lt;/script&gt;');
 expect(preview).toContain('href="research.html"');
 await page.locator('#closeSitePreview').click();
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#openPublisher').click();
 await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 await page.locator('#reviewBtn').click();
 await expect(page.locator('#reviewChangeList')).toContainText('New paragraph');
 await page.locator('#reviewDialog form button').click();
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('<p>New paragraph with &lt;script&gt;alert(1)&lt;/script&gt;</p>');
 expect(html).toContain('href="research.html"');
 expect(html).not.toContain('<script>alert(1)</script>');
});

test('new paragraph survives local draft reload and can be reset',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Original heading</h2><p>Existing text</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 page.once('dialog',dialog=>dialog.accept('Extra note'));
 await page.locator('#appendSourceParagraph').click();
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#openPublisher').click();
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 await page.reload();
 await expect(page.locator('#exportBtn')).toBeEnabled();
 await page.locator('#resetBtn').click();
 await expect(page.locator('#exportBtn')).toBeDisabled();
});

test('added paragraph cannot be inserted inside approved responsive group',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section id="part"><h2>Heading</h2><p>Paragraph</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 await page.locator('#useResponsiveGroup').click();
 await page.locator('#appendSourceParagraph').click();
 await expect(page.locator('#status')).toContainText('Clear the selected responsive group');
 await expect(page.locator('#grid .block')).toHaveCount(2);
});

test('forged paragraph insertion source mismatch is rejected without a draft',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Original heading</h2><p>Existing text</p></section></main></body></html>'}));
 const payload={version:5,page:'about.html',changes:[],styleChanges:[],additions:[
  {page:'about.html',selector:'section:nth-of-type(1) > h2:nth-of-type(1)',
   tag:'h2',before:'Forged original',text:'Inserted'}
 ]};
 await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
 await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
 await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
 expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('added paragraphs cannot smuggle invalid script or HTML markup into output',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Heading</h2><p>Existing</p></section></main></body></html>'}));
 const payload={version:5,page:'about.html',changes:[],styleChanges:[],additions:[
  {page:'about.html',selector:'section:nth-of-type(1) > h2:nth-of-type(1)',
   tag:'h2',before:'Heading',text:'<img src=x onerror=alert(1)>'}
 ]};
 await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
 expect(html).not.toContain('<img src=x onerror=alert(1)>');
});

test('new heading transfers through site preview, reviewed editor and HTML export',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section id="content"><h2>Introduction</h2><p>Earlier content</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await expect(page.locator('#grid .block.heading')).toHaveCount(1);
 await page.locator('#grid .block.heading').first().click();
 page.once('dialog',dialog=>dialog.accept('Additional findings'));
 await page.locator('#appendSourceHeading').click();
 await expect(page.locator('#grid .block.heading')).toHaveCount(2);
 await page.locator('#reviewPatch').click();
 await expect(page.locator('#reviewEntries')).toContainText('New heading');
 await page.locator('#viewSitePreview').click();
 await page.locator('#previewSiteApplied').click();
 const markup=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
 expect(markup).toContain('<h3>Additional findings</h3>');
 expect(markup).toContain('Earlier content');
 await page.locator('#closeSitePreview').click();
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#openPublisher').click();
 await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 await page.locator('#reviewBtn').click();
 await expect(page.locator('#reviewChangeList')).toContainText('New heading');
 await page.locator('#reviewDialog form button').click();
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('<h3>Additional findings</h3>');
 expect(html).toContain('<p>Earlier content</p>');
});

test('new internal link can update its label and destination before review',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Resources</h2><p>Background</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 const prompts=['Read research','research.html'];
 page.on('dialog',dialog=>dialog.accept(prompts.shift()||''));
 await page.locator('#appendSourceLink').click();
 await expect(page.locator('#insertionLinkUrl')).toHaveValue('research.html');
 await page.locator('#insertionLinkUrl').fill('teaching.html#biology');
 await page.locator('#insertionLinkUrl').dispatchEvent('change');
 await page.locator('#text').fill('Biology resources');
 await page.locator('#text').dispatchEvent('change');
 await page.locator('#viewSitePreview').click();
 await page.locator('#previewSiteApplied').click();
 const markup=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
 expect(markup).toContain('href="teaching.html#biology"');
 expect(markup).toContain('Biology resources');
 await page.locator('#closeSitePreview').click();
 await page.locator('#openPublisher').click();
 await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('<p><a href="teaching.html#biology">Biology resources</a></p>');
 expect(html).toContain('<p>Background</p>');
});

test('external link uses HTTPS and is escaped safely in reviewed HTML',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>References</h2><p>Sources</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 const prompts=['Example & reference','https://example.org/learn?a=1&b=2'];
 page.on('dialog',dialog=>dialog.accept(prompts.shift()||''));
 await page.locator('#appendSourceLink').click();
 await page.locator('#openPublisher').click();
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('href="https://example.org/learn?a=1&amp;b=2"');
 expect(html).toContain('rel="noopener noreferrer"');
 expect(html).toContain('Example &amp; reference</a>');
});

test('unsafe URL schemes and credentialed HTTPS are blocked before a new link is staged',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><h2>Heading</h2><p>Body</p></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 for(const url of ['javascript:alert(1)','data:text/html,hello','https://user:password@example.org/','http://example.org/']){
   const prompts=['Unsafe link',url];
   const handler=dialog=>dialog.accept(prompts.shift()||'');
   page.on('dialog',handler);
   await page.locator('#appendSourceLink').click();
   page.off('dialog',handler);
   await expect(page.locator('#status')).toContainText('secure HTTPS link');
   await expect(page.locator('#grid .block')).toHaveCount(2);
 }
});

test('forged addition with javascript URL cannot create a main editor draft',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Heading</h2><p>Body</p></section></main></body></html>'}));
 const payload={version:5,page:'about.html',changes:[],styleChanges:[],additions:[
   {page:'about.html',selector:'section:nth-of-type(1) > h2:nth-of-type(1)',
    tag:'h2',before:'Heading',kind:'link',text:'Bad',href:'javascript:alert(1)'}
 ]};
 await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
 await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
 await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
 expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('forged heading tag cannot create a main editor draft',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Heading</h2><p>Body</p></section></main></body></html>'}));
 const payload={version:5,page:'about.html',changes:[],styleChanges:[],additions:[
  {page:'about.html',selector:'section:nth-of-type(1) > h2:nth-of-type(1)',
   tag:'h2',before:'Heading',kind:'heading',headingTag:'script',text:'Unsafe heading'}
 ]};
 await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
 await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
 await expect(page.locator('#noticeMessage')).toContainText('No edits were applied');
 expect(await page.evaluate(()=>localStorage.getItem('moon-portfolio-visual-editor-v1:about.html'))).toBeNull();
});

test('new heading and link can be removed from the builder before transfer',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Heading</h2><p>Body</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 page.once('dialog',dialog=>dialog.accept('Temporary heading'));
 await page.locator('#appendSourceHeading').click();
 await expect(page.locator('#grid .block')).toHaveCount(3);
 await page.locator('#remove').click();
 await expect(page.locator('#grid .block')).toHaveCount(2);
 await page.locator('#undo').click();
 await expect(page.locator('#grid .block')).toHaveCount(3);
 await page.locator('#undo').click();
 await expect(page.locator('#grid .block')).toHaveCount(2);
});

test('new heading level can switch to H2 and persist through publisher export',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><p>Introduction</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block').first().click();
 page.once('dialog',dialog=>dialog.accept('New major section'));
 await page.locator('#appendSourceHeading').click();
 await page.locator('#insertionHeadingTag').selectOption('h2');
 await page.locator('#viewSitePreview').click();
 await page.locator('#previewSiteApplied').click();
 expect(await page.locator('#sitePreviewFrame').getAttribute('srcdoc')).toContain('<h2>New major section</h2>');
 await page.locator('#closeSitePreview').click();
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#openPublisher').click();
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('<h2>New major section</h2>');
});

test('revised source heading and a new link can export together without losing siblings',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section id="intro"><h2>Original heading</h2><p>Other content</p><a href="research.html">Original link</a></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 await page.locator('#text').fill('Revised heading');
 await page.locator('#text').dispatchEvent('change');
 const prompts=['Project resources','projects.html'];
 page.on('dialog',dialog=>dialog.accept(prompts.shift()||''));
 await page.locator('#appendSourceLink').click();
 await page.locator('#openPublisher').click();
 await expect(page).toHaveURL(/editor\.html\?page=about\.html$/);
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('<h2>Revised heading</h2>');
 expect(html).toContain('<p><a href="projects.html">Project resources</a></p>');
 expect(html).toContain('<p>Other content</p>');
 expect(html).toContain('href="research.html"');
});

test('invalid edits to a staged link destination do not overwrite the saved URL',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Resources</h2></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block').first().click();
 const prompts=['Resource link','research.html'];
 page.on('dialog',dialog=>dialog.accept(prompts.shift()||''));
 await page.locator('#appendSourceLink').click();
 await page.locator('#insertionLinkUrl').fill('javascript:alert(1)');
 await page.locator('#insertionLinkUrl').dispatchEvent('change');
 await expect(page.locator('#status')).toContainText('Invalid destination');
 await page.locator('#viewSitePreview').click();
 await page.locator('#previewSiteApplied').click();
 const raw=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
 expect(raw).toContain('href="research.html"');
 expect(raw).not.toContain('href="javascript:alert(1)"');
});

test('forged file draft containing unsafe link is refused on JSON import',async({page})=>{
 const data={version:2,sourcePage:'about.html',blocks:[{
  id:1,type:'text',text:'Unsafe',x:1,y:1,w:6,h:2,
  insertion:{page:'about.html',selector:'section:nth-of-type(1) > p:nth-of-type(1)',
   tag:'p',before:'Old text',kind:'link',href:'data:text/html,bad'}
 }]};
 await page.locator('#jsonImport').setInputFiles({name:'unsafe-layout.json',
  mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 await expect(page.locator('#status')).toContainText('Invalid new link source or content');
 await expect(page.locator('#grid .block')).toHaveCount(3);
});

test('capture desktop and mobile previews with new headings and reviewed links',async({page})=>{
 test.setTimeout(90000);
 const fs=require('node:fs');
 fs.mkdirSync('test-results/layout-previews',{recursive:true});
 await page.setViewportSize({width:1366,height:900});
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head><title>About</title></head><body><header>Site navigation</header><main><section class="section"><h2>My work</h2><p>I investigate scientific inquiry.</p><p>My teaching practice continues to shape these questions.</p></section></main><footer>Site footer</footer></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await expect(page.locator('#grid .block')).toHaveCount(3);
 await page.locator('#grid .block.heading').first().click();
 page.once('dialog',dialog=>dialog.accept('Current research'));
 await page.locator('#appendSourceHeading').click();
 await page.locator('#insertionHeadingTag').selectOption('h2');
 await page.locator('#grid .block').nth(1).click();
 const replies=['See current research','research.html'];
 page.on('dialog',dialog=>dialog.accept(replies.shift()||''));
 await page.locator('#appendSourceLink').click();
 await page.locator('#canvas').screenshot({path:'test-results/layout-previews/add-content-builder-desktop.png'});
 await page.locator('#viewSitePreview').click();
 await expect(page.locator('#sitePreviewDialog')).toBeVisible();
 await page.locator('#previewSiteApplied').click();
 await expect(page.frameLocator('#sitePreviewFrame').locator('main')).toBeVisible();
 await page.locator('#sitePreviewDialog').screenshot({path:'test-results/layout-previews/add-content-site-desktop.png'});
 await page.locator('#previewSiteMobile').click();
 await page.locator('#sitePreviewDialog').screenshot({path:'test-results/layout-previews/add-content-site-mobile.png'});
 const raw=await page.locator('#sitePreviewFrame').getAttribute('srcdoc');
 expect(raw).toContain('<h2>Current research</h2>');
 expect(raw).toContain('href="research.html"');
 expect(raw).toContain('Site footer');
});

test('new content controls require a source anchor and source deletions stay canvas-only',async({page})=>{
 await expect(page.locator('#appendSourceParagraph')).toBeDisabled();
 await expect(page.locator('#appendSourceHeading')).toBeDisabled();
 await expect(page.locator('#appendSourceLink')).toBeDisabled();
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Source heading</h2><p>Existing text</p></section></main></body></html>'}));
 await page.locator('#sourcePage').selectOption('about.html');
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#importPage').click();
 await page.locator('#grid .block.heading').first().click();
 await expect(page.locator('#appendSourceHeading')).toBeEnabled();
 await page.locator('#remove').click();
 await expect(page.locator('#status')).toContainText('original website element has not been deleted');
 await page.locator('#undo').click();
 await expect(page.locator('#grid .block')).toHaveCount(2);
});

test('main editor can edit a staged link and undo its reviewed changes',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Links</h2><p>Background</p></section></main></body></html>'}));
 const payload={version:5,page:'about.html',changes:[],styleChanges:[],additions:[
  {page:'about.html',selector:'section:nth-of-type(1) > h2:nth-of-type(1)',
   tag:'h2',before:'Links',kind:'link',text:'Research page',href:'research.html'}
 ]};
 await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
 const responses=['','Updated resources','teaching.html'];
 page.on('dialog',dialog=>dialog.accept(responses.shift()||''));
 await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
 await expect(page.locator('#editorSaveStatus')).toContainText('transferred');
 await page.locator('#reviewBtn').click();
 await page.getByRole('button',{name:'Edit added link 1'}).click();
 await expect(page.locator('#reviewChangeList')).toContainText('Updated resources');
 await expect(page.locator('#reviewChangeList')).toContainText('teaching.html');
 const download=page.waitForEvent('download');
 await page.locator('#reviewDialog form button').click();
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('<p><a href="teaching.html">Updated resources</a></p>');
 await page.locator('#undoBtn').click();
 const again=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const earlier=require('node:fs').readFileSync(await(await again).path(),'utf8');
 expect(earlier).toContain('<p><a href="research.html">Research page</a></p>');
});

test('main editor can remove an added heading and restore it with undo',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Old title</h2></section></main></body></html>'}));
 const payload={version:5,page:'about.html',changes:[],styleChanges:[],additions:[
  {page:'about.html',selector:'section:nth-of-type(1) > h2:nth-of-type(1)',
   tag:'h2',before:'Old title',kind:'heading',headingTag:'h3',text:'New subheading'}
 ]};
 await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
 await expect(page.locator('#exportBtn')).toBeEnabled();
 await page.locator('#reviewBtn').click();
 await page.getByRole('button',{name:'Remove added heading 1'}).click();
 await expect(page.locator('#exportBtn')).toBeDisabled();
 await page.locator('#undoBtn').click();
 await expect(page.locator('#exportBtn')).toBeEnabled();
 const download=page.waitForEvent('download');
 await page.locator('#exportBtn').click();
 const html=require('node:fs').readFileSync(await(await download).path(),'utf8');
 expect(html).toContain('<h3>New subheading</h3>');
});

test('invalid new link edits in main editor leave the last safe URL unchanged',async({page})=>{
 await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',
 body:'<!doctype html><html><head></head><body><main><section><h2>Old title</h2></section></main></body></html>'}));
 const payload={version:5,page:'about.html',changes:[],styleChanges:[],additions:[
  {page:'about.html',selector:'section:nth-of-type(1) > h2:nth-of-type(1)',
   tag:'h2',before:'Old title',kind:'link',text:'Valid label',href:'research.html'}
 ]};
 await page.evaluate(data=>sessionStorage.setItem('moon-fluid-text-handoff-v1',JSON.stringify(data)),payload);
 const responses=['','Different label','javascript:alert(1)'];
 page.on('dialog',dialog=>dialog.accept(responses.shift()||''));
 await page.goto('http://127.0.0.1:8765/editor.html?page=about.html&importFluidText=1');
 await page.locator('#reviewBtn').click();
 await page.getByRole('button',{name:'Edit added link 1'}).click();
 await expect(page.locator('#noticeMessage')).toContainText('Invalid link insertion');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('moon-portfolio-visual-editor-v1:about.html')));
 expect(saved.additions[0].href).toBe('research.html');
 expect(saved.additions[0].text).toBe('Valid label');
});
