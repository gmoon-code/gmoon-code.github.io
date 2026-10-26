// Focused browser regressions for Editor V2's true text-box resizing,
// source-backed deletion, source selector rebasing, and text formatting.
// Requires Playwright and a local static server at 127.0.0.1:8765.
const {test,expect}=require('@playwright/test');
const fixture='<!doctype html><html lang="en"><head><style>'+
  'main{margin:35px;width:850px}section{max-width:640px}'+
  'h2{font:700 30px Georgia}p{font:18px/1.4 Georgia;margin:12px 0;width:480px}'+
  '</style></head><body><main><section>'+
  '<h2>Welcome to my research page</h2>'+
  '<p>Science learners make sense of complex biological ideas together with their classmates and teachers through discussion and careful reflection.</p>'+
  '<p>Another distinct paragraph should remain editable after the first is removed.</p>'+
  '</section></main></body></html>';
test.beforeEach(async({page})=>{
  await page.route('**/contact.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:fixture
  }));
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=contact.html',{
    waitUntil:'domcontentloaded'
  });
  await page.evaluate(()=>{
    localStorage.removeItem('moon-academic-editor-v2:source:contact.html');
    localStorage.removeItem('moon-academic-editor-v2:contact.html');
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.frameLocator('#livePageFrame').locator('main p')).toHaveCount(2);
});
test('text edge resize reflows words without scaling the font',async({page})=>{
  const frame=page.frameLocator('#livePageFrame'),paragraph=frame.locator('main p').first();
  await paragraph.click();
  const original=await paragraph.evaluate(n=>({
    width:n.getBoundingClientRect().width,font:getComputedStyle(n).fontSize
  }));
  const handle=frame.locator('#moon-v2-live-overlay [data-direction="e"]');
  await expect(handle).toBeVisible();
  const rect=await handle.boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2-90,rect.y+rect.height/2,{steps:8});
  await page.mouse.up();
  const next=await paragraph.evaluate(n=>({
    width:n.getBoundingClientRect().width,font:getComputedStyle(n).fontSize,
    scale:getComputedStyle(n).scale,offsetWidth:n.offsetWidth
  }));
  expect(next.width).toBeLessThan(original.width-50);
  expect(next.font).toBe(original.font);
  expect(next.scale).toMatch(/^(?:none|1(?: 1)?)$/);
  expect(next.offsetWidth).toBeLessThan(original.width-50);
  await expect(page.locator('#liveTextBoxWidth')).toBeEnabled();
  await expect(page.locator('#undo')).toBeEnabled();
  await page.locator('#undo').click();
  await expect(frame.locator('main p').first()).not.toHaveCSS('width',next.offsetWidth+'px');
});
test('Delete removes source element from the draft and Undo restores it',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await frame.locator('main p').first().click();
  await expect(page.locator('#deleteLiveElement')).toBeEnabled();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#deleteLiveElement').click();
  await expect(frame.locator('main p')).toHaveCount(1);
  expect(await page.evaluate(()=>JSON.parse(
    localStorage.getItem('moon-academic-editor-v2:source:contact.html')||'[]'
  ).some(p=>p.kind==='delete'))).toBe(true);
  await page.locator('#undo').click();
  await expect(frame.locator('main p')).toHaveCount(2);
  await page.locator('#redo').click();
  await expect(frame.locator('main p')).toHaveCount(1);
});
test('deleting one paragraph retains style of the following sibling in preview',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await frame.locator('main p').nth(1).click();
  await page.locator('#liveTextAlign').selectOption('center');
  await frame.locator('main p').first().click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#deleteLiveElement').click();
  await page.locator('#preview').click();
  const preview=page.frameLocator('#previewFrame');
  await expect(preview.locator('main p')).toHaveCount(1);
  await expect(preview.locator('main p')).toHaveCSS('text-align','center');
  await page.locator('#closePreview').click();
});
test('bold and italic live typography carry through source preview',async({page})=>{
  const frame=page.frameLocator('#livePageFrame');
  await frame.locator('main p').first().click();
  await page.locator('#liveFontWeight').selectOption('bold');
  await page.locator('#liveFontStyle').selectOption('italic');
  await page.locator('#liveTextDecoration').selectOption('underline');
  await expect(frame.locator('main p').first()).toHaveCSS('font-weight','700');
  await expect(frame.locator('main p').first()).toHaveCSS('font-style','italic');
  await page.locator('#preview').click();
  const p=page.frameLocator('#previewFrame').locator('main p').first();
  await expect(p).toHaveCSS('font-weight','700');
  await expect(p).toHaveCSS('font-style','italic');
  await expect(p).toHaveCSS('text-decoration-line','underline');
});
