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

test('Object appearance round-trip: ellipse, border, rotation, opacity and undo',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#addShape').click();
  const shape=frame.locator('div[data-moon-v2-added-id]').first();
  await expect(page.locator('#liveObjectDesign')).toBeVisible();
  await page.locator('#liveShapeType').selectOption('ellipse');
  await page.locator('#liveShapeFill').fill('#aabbcc');
  await page.locator('#liveObjectRotation').fill('45');
  await page.locator('#liveObjectRotation').press('Tab');
  await page.locator('#liveObjectOpacity').fill('70');
  await page.locator('#liveObjectOpacity').press('Tab');
  await page.locator('#liveObjectBorderWidth').fill('3');
  await page.locator('#liveObjectBorderWidth').press('Tab');
  await page.locator('#liveObjectBorderColour').fill('#112233');
  await expect(shape).toHaveCSS('opacity','0.7');
  await expect(shape).toHaveCSS('border-top-width','3px');
  await expect(shape).toHaveCSS('border-top-color','rgb(17, 34, 51)');
  await expect(shape).toHaveCSS('border-radius','50%');
  const beforeUndo=await shape.getAttribute('data-moon-v2-added-design');
  expect(JSON.parse(beforeUndo).rotation).toBe(45);
  await page.locator('#undo').click();
  const afterUndo=JSON.parse(await shape.getAttribute('data-moon-v2-added-design'));
  expect(afterUndo.borderColour).not.toBe('#112233');
  await page.locator('#redo').click();
  await expect(shape).toHaveCSS('border-top-color','rgb(17, 34, 51)');
  await page.locator('#preview').click();
  const preview=page.frameLocator('#previewFrame').locator('div[data-moon-v2-added-id]');
  await expect(preview).toHaveCSS('opacity','0.7');
  await expect(preview).toHaveCSS('border-radius','50%');
  await expect(preview).toHaveCSS('border-top-width','3px');
  expect(JSON.parse(await preview.getAttribute('data-moon-v2-added-design')).rotation).toBe(45);
  await page.locator('#closePreview').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(frame.locator('div[data-moon-v2-added-id]')).toHaveCSS('opacity','0.7');
});
test('Live shape type can become a line, with clean reset and no changes to source content',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#addShape').click();
  const shape=frame.locator('div[data-moon-v2-added-id]').first();
  await page.locator('#liveShapeType').selectOption('line');
  await expect(shape).toHaveCSS('clip-path',/polygon\(/);
  await page.locator('#resetLiveObjectDesign').click();
  await expect(shape).toHaveCSS('clip-path','none');
  expect(await frame.locator('main > p').first().textContent()).toContain('This original paragraph');
});

test('Original website image resizing uses box geometry, never uneven CSS scale',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  const image=frame.locator('main > img').first();
  await image.click();
  await expect(page.locator('#liveOriginalDimensions')).toBeVisible();
  await expect(page.locator('#liveLockImageRatio')).toBeChecked();
  await page.locator('#liveOriginalWidth').fill('240');
  await page.locator('#liveOriginalWidth').press('Tab');
  await expect(image).toHaveCSS('width','240px');
  await expect(image).toHaveCSS('object-fit','contain');
  const ratio=await image.evaluate(node=>{
    const box=node.getBoundingClientRect();
    return box.width/box.height;
  });
  expect(Number.isFinite(ratio)).toBe(true);
  await page.locator('#preview').click();
  const publishedImage=page.frameLocator('#previewFrame').locator('main > img').first();
  await expect(publishedImage).toHaveCSS('width','240px');
  await expect(publishedImage).toHaveCSS('object-fit','contain');
  await page.locator('#closePreview').click();
  await page.locator('#undo').click();
  await expect(image).not.toHaveCSS('width','240px');
});
test('Added photos fit or crop their frame without stretching',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await page.locator('#imageLibrary button').first().click();
  const image=frame.locator('img[data-moon-v2-added-id]').first();
  await expect(image).toHaveCount(1);
  await expect(image).toHaveCSS('object-fit','contain');
  await page.locator('#liveImageFit').selectOption('cover');
  await expect(image).toHaveCSS('object-fit','cover');
  await page.locator('#liveLockImageRatio').uncheck();
  await page.locator('#liveAddedWidth').fill('410');
  await page.locator('#liveAddedWidth').press('Tab');
  await expect(image).toHaveCSS('width','410px');
  await expect(image).toHaveCSS('object-fit','cover');
  await page.locator('#preview').click();
  const preview=page.frameLocator('#previewFrame').locator('img[data-moon-v2-added-id]');
  await expect(preview).toHaveCSS('object-fit','cover');
  await expect(preview).toHaveCSS('width','410px');
});
