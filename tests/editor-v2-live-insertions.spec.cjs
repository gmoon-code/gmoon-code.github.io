// Regression tests for new objects that can be added to, edited on,
// and published from the REAL page. Requires a local static server at
// http://127.0.0.1:8765 and @playwright/test. GitHub requests are mocked.
const {test,expect}=require('@playwright/test');
const original='<!doctype html><html lang="en"><head><style>'+
  'main{margin:24px auto;padding:24px;width:760px}p{font:18px Georgia}'+
  '</style></head><body><main><h1>Contact</h1>'+
  '<p>This original paragraph must remain unchanged.</p>'+
  '<img src="assets/profile-portrait.webp" alt="Original portrait">'+
  '</main></body></html>';
let submitted;
test.beforeEach(async({page})=>{
  submitted=null;
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/contact.html?ref=main',
    route=>route.fulfill({
      status:200,contentType:'application/json',
      headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({type:'file',sha:'sha-source-123',encoding:'base64',
        content:Buffer.from(original).toString('base64')})
    }));
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/contact.html',
    async route=>{
      if(route.request().method()==='PUT'){
        submitted=JSON.parse(route.request().postData());
        return route.fulfill({status:200,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({content:{},commit:{sha:'mock-commit-id'}})});
      }
      return route.continue();
    });
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=contact.html',
    {waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    localStorage.removeItem('moon-academic-editor-v2:source:contact.html');
    localStorage.removeItem('moon-academic-editor-v2:contact.html');
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.frameLocator('#livePageFrame').locator('main h1')).toHaveText('Contact');
});
test('Add Text is visible on the actual website and survives reload',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#addText').click();
  const added=frame.locator('[data-moon-v2-added-id]');
  await expect(added).toHaveCount(1);
  await expect(added).toContainText('Double-click to edit text');
  await expect(page.locator('#liveAddedDimensions')).toBeVisible();
  await page.locator('#liveAddedWidth').fill('410');
  await page.locator('#liveAddedWidth').press('Tab');
  await expect(added).toHaveCSS('width','410px');
  const originalBox=await frame.locator('main > p').first().boundingBox();
  await page.locator('#preview').click();
  const preview=page.frameLocator('#previewFrame');
  await expect(preview.locator('[data-moon-v2-added-id]')).toHaveCSS('width','410px');
  await expect(preview.locator('main > p').first())
    .toHaveText('This original paragraph must remain unchanged.');
  await page.locator('#closePreview').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCount(1);
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCSS('width','410px');
  expect(originalBox).toBeTruthy();
});
test('Double click edits the added text and source preview includes it',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#addText').click();
  const added=frame.locator('[data-moon-v2-added-id]');
  await added.dblclick();
  await added.fill('A new welcoming contact sentence');
  await page.locator('#saveLiveText').click();
  await expect(added).toHaveText('A new welcoming contact sentence');
  await page.locator('#preview').click();
  await expect(page.frameLocator('#previewFrame').locator('[data-moon-v2-added-id]'))
    .toHaveText('A new welcoming contact sentence');
});
test('Add Shape, Duplicate and Delete remain reversible in live mode',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#addShape').click();
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCount(1);
  await page.locator('#duplicate').click();
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCount(2);
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#deleteLiveElement').click();
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCount(1);
  await page.locator('#undo').click();
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCount(2);
  await page.locator('#redo').click();
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCount(1);
});
test('Add an image from the real-page asset library without switching modes',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await expect(page.locator('#imageLibrary button')).not.toHaveCount(0);
  await page.locator('#imageLibrary button').first().click();
  await expect(frame.locator('img[data-moon-v2-added-id]')).toHaveCount(1);
  await expect(frame.locator('img[data-moon-v2-added-id]'))
    .toHaveAttribute('src','assets/profile-portrait.webp');
  await expect(page.locator('#liveMode')).toHaveAttribute('aria-pressed','true');
  await page.locator('#liveAddedWidth').fill('240');
  await page.locator('#liveAddedWidth').press('Tab');
  await expect(frame.locator('img[data-moon-v2-added-id]')).toHaveCSS('width','240px');
});
test('Copy and paste an independent shape without duplicating its stable ID',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#addShape').click();
  await expect(page.locator('#liveCopyObject')).toBeEnabled();
  await page.locator('#liveCopyObject').click();
  await expect(page.locator('#livePasteObject')).toBeEnabled();
  await page.locator('#livePasteObject').click();
  await expect(frame.locator('div[data-moon-v2-added-id]')).toHaveCount(2);
  const ids=await frame.locator('div[data-moon-v2-added-id]').evaluateAll(nodes=>
    nodes.map(node=>node.getAttribute('data-moon-v2-added-id')));
  expect(new Set(ids).size).toBe(2);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(frame.locator('div[data-moon-v2-added-id]')).toHaveCount(2);
});
test('Github live publishing retains original HTML and inserts new objects once',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#addText').click();
  await page.locator('#liveAddedWidth').fill('280');
  await page.locator('#liveAddedWidth').press('Tab');
  await page.locator('#publish').click();
  await page.locator('#githubToken').fill('mock-token-only');
  await page.locator('#acknowledgeLive').check();
  await page.locator('#confirmPublish').click();
  await expect.poll(()=>!!submitted).toBe(true);
  const published=Buffer.from(submitted.content,'base64').toString('utf8');
  expect(published).toContain('This original paragraph must remain unchanged.');
  expect(published).toContain('data-moon-v2-added-layer');
  expect(published).toContain('Double-click to edit text');
  expect((published.match(/data-moon-v2-added-id=/g)||[]).length).toBe(1);
  expect(submitted.sha).toBe('sha-source-123');
  expect(JSON.stringify(localStorage)).not.toContain('mock-token-only');
  // The confirmed GitHub source is loaded without duplicating the object.
  await expect(frame.locator('[data-moon-v2-added-id]')).toHaveCount(1);
});
