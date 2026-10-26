// Editor V2 visual parity regressions. Uses a local static server at
// 127.0.0.1:8765, with GitHub Contents API replies mocked by Playwright.
// No repository writes and no real token required.
const {test,expect}=require('@playwright/test');
const source=(message="An original paragraph")=>
  '<!doctype html><html lang="en"><head><style>'+
  'html{background:#fff}main{margin:24px;width:700px}p{font:20px/1.4 Georgia;margin:8px 0;}'+
  '</style></head><body><main><h1>Source parity</h1>'+
  '<p>'+message+'</p><p>Second paragraph</p>'+
  '</main><script>document.body.setAttribute("data-website-script","executed")<\/script></body></html>';
let textForAPI=source(),requests=0;
test.beforeEach(async({page})=>{
  requests=0;textForAPI=source();
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/contact.html?ref=main',
    async route=>{
      requests++;
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({type:'file',name:'contact.html',sha:'abc123file',
          encoding:'base64',content:Buffer.from(textForAPI).toString('base64')})});
    });
  // This is deliberately different from GitHub's source. The editor must
  // display GitHub main and not take the deployed webpage as its baseline.
  await page.route('**/contact.html',route=>route.fulfill({
    status:200,contentType:'text/html',
    body:source("Stale deployed text that must never become the edit baseline")
  }));
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=contact.html',
    {waitUntil:'domcontentloaded'});
  await expect(page.frameLocator('#livePageFrame').locator('main p').first())
    .toHaveText('An original paragraph');
});
test('editable page, verified output, and same-revision comparison match',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await expect(live.locator('body')).toHaveAttribute('data-website-script','executed');
  await expect(page.locator('#liveAssetStatus')).toContainText('GitHub main source verified');
  await live.locator('main p').first().click();
  await page.locator('#liveTextAlign').selectOption('center');
  await expect(live.locator('main p').first()).toHaveCSS('text-align','center');
  await page.locator('#preview').click();
  await expect(page.locator('#previewSourceStatus')).toContainText('GitHub main');
  const output=page.frameLocator('#previewFrame');
  await expect(output.locator('main p').first()).toHaveCSS('text-align','center');
  await expect(output.locator('body')).toHaveAttribute('data-website-script','executed');
  await expect(page.locator('#previewFrame')).toHaveCSS('width','1160px');
  await page.locator('#closePreview').click();
  await page.locator('#compare').click();
  const before=page.frameLocator('#originalFrame'),after=page.frameLocator('#sceneFrame');
  await expect(before.locator('main p').first()).not.toHaveCSS('text-align','center');
  await expect(after.locator('main p').first()).toHaveCSS('text-align','center');
  await expect(page.locator('#originalFrame')).toHaveCSS('width','1160px');
  await expect(page.locator('#sceneFrame')).toHaveCSS('width','1160px');
  await page.locator('#closeCompare').click();
});
test('phone preview keeps its 390 px CSS viewport when scaled',async({page})=>{
  await page.locator('#devicePreview').selectOption('phone');
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p').first().click();
  await page.locator('#liveTextAlign').selectOption('right');
  await page.locator('#preview').click();
  await expect(page.locator('#previewFrame')).toHaveCSS('width','390px');
  await expect(page.frameLocator('#previewFrame').locator('main p').first())
    .toHaveCSS('text-align','right');
  await expect(page.locator('#previewSourceStatus')).toContainText('GitHub main');
});
test('stale GitHub revision blocks misleading previews without deleting drafts',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p').first().click();
  await page.locator('#liveTextAlign').selectOption('center');
  const originalDraft=await page.evaluate(()=>
    localStorage.getItem('moon-academic-editor-v2:source:contact.html'));
  textForAPI=source("Content updated on GitHub by somebody else");
  await page.locator('#preview').click();
  await expect(page.locator('#status')).toContainText('GitHub source has changed');
  expect(await page.evaluate(()=>
    localStorage.getItem('moon-academic-editor-v2:source:contact.html'))).toBe(originalDraft);
  await expect(page.locator('#previewDialog')).not.toBeVisible();
});
