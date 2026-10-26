// Browser regression tests for PowerPoint-style arrangement on the real webpage.
// Run with Playwright against the local static site at 127.0.0.1:8765.
const {test,expect}=require('@playwright/test');
const source='<!doctype html><html lang="en"><head><style>'+
 'main{margin:20px auto;width:750px;min-height:950px}h1{font:32px Georgia}'+
 '</style></head><body><main><h1>Arrangement test</h1></main></body></html>';
const geom=async page=>page.frameLocator('#livePageFrame')
 .locator('[data-moon-v2-added-id]').evaluateAll(nodes=>nodes.map(node=>{
   const o=JSON.parse(node.getAttribute('data-moon-v2-added-geometry'));
   return {id:node.getAttribute('data-moon-v2-added-id'),...o.desktop};
 }));
async function positionLast(page,x,y){
  await page.locator('#addShape').click();
  await page.locator('#liveMoveX').fill(String(x));
  await page.locator('#liveMoveX').press('Tab');
  await page.locator('#liveMoveY').fill(String(y));
  await page.locator('#liveMoveY').press('Tab');
}
test.beforeEach(async({page})=>{
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/contact.html?ref=main',
    route=>route.fulfill({status:200,contentType:'application/json',
      headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({type:'file',sha:'test-source-sha',
        encoding:'base64',content:Buffer.from(source).toString('base64')})}));
  await page.route('**/contact.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=contact.html',
    {waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    localStorage.removeItem('moon-academic-editor-v2:source:contact.html');
    localStorage.removeItem('moon-academic-editor-v2:contact.html');
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.frameLocator('#livePageFrame').locator('main h1'))
    .toHaveText('Arrangement test');
});
test('Select all, align left and undo act on three actual webpage shapes',async({page})=>{
  await positionLast(page,30,120);
  await positionLast(page,270,230);
  await positionLast(page,520,380);
  const before=await geom(page);
  expect(new Set(before.map(o=>o.x)).size).toBe(3);
  await page.locator('#liveSelectAdded').click();
  await expect(page.locator('#liveMultiCount')).toContainText('3 selected');
  await page.locator('#liveAlignLeft').click();
  const aligned=await geom(page);
  expect(new Set(aligned.map(o=>o.x)).size).toBe(1);
  await page.locator('#undo').click();
  const undone=await geom(page);
  expect(undone.map(o=>o.x)).toEqual(before.map(o=>o.x));
  await page.locator('#redo').click();
  const redone=await geom(page);
  expect(new Set(redone.map(o=>o.x)).size).toBe(1);
});
test('Distribute horizontally uses stable object identities and appears in verified preview',async({page})=>{
  await positionLast(page,20,110);
  await positionLast(page,160,260);
  await positionLast(page,620,360);
  const before=await geom(page);
  await page.locator('#liveSelectAdded').click();
  await page.locator('#liveDistributeH').click();
  const next=await geom(page);
  const centres=next.map(o=>o.x+o.w/2).sort((a,b)=>a-b);
  expect(Math.abs((centres[1]-centres[0])-(centres[2]-centres[1]))).toBeLessThanOrEqual(1);
  expect(next.map(o=>o.id)).toEqual(before.map(o=>o.id));
  await page.locator('#preview').click();
  const preview=page.frameLocator('#previewFrame');
  await expect(preview.locator('[data-moon-v2-added-id]')).toHaveCount(3);
  const published=await preview.locator('[data-moon-v2-added-id]').evaluateAll(nodes=>
    nodes.map(node=>JSON.parse(node.getAttribute('data-moon-v2-added-geometry')).desktop.x));
  expect(published).toEqual(next.map(o=>o.x));
});
test('Group arrow nudge moves all selected objects once and undo restores all',async({page})=>{
  await positionLast(page,80,140);
  await positionLast(page,200,290);
  await page.locator('#liveSelectAdded').click();
  const before=await geom(page);
  await page.evaluate(()=>{
    document.querySelector('#livePageFrame').contentDocument.dispatchEvent(
      new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
  });
  const after=await geom(page);
  expect(after.map((o,i)=>o.x-before[i].x)).toEqual([1,1]);
  await page.locator('#undo').click();
  const undone=await geom(page);
  expect(undone.map(o=>o.x)).toEqual(before.map(o=>o.x));
});
test('Shift-click selects added objects without selecting original headings',async({page})=>{
  await positionLast(page,20,140);
  await positionLast(page,230,300);
  const rows=page.locator('#liveElementList button[data-live-selector^="added:"]');
  await expect(rows).toHaveCount(2);
  await rows.first().click();
  await rows.nth(1).click({modifiers:['Shift']});
  await expect(page.locator('#liveMultiCount')).toContainText('2 selected');
  await expect(rows.first()).toHaveAttribute('aria-selected','true');
  await expect(rows.nth(1)).toHaveAttribute('aria-selected','true');
  await page.locator('#liveClearAdded').click();
  await expect(page.locator('#liveMultiCount')).toContainText('0 selected');
});

test('Grouped duplication and deletion are each one undoable operation',async({page})=>{
  await positionLast(page,70,160);
  await positionLast(page,340,300);
  const added=page.frameLocator('#livePageFrame').locator('div[data-moon-v2-added-id]');
  await page.locator('#liveSelectAdded').click();
  await page.locator('#duplicate').click();
  await expect(added).toHaveCount(4);
  await expect(page.locator('#liveMultiCount')).toContainText('2 selected');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#deleteLiveElement').click();
  await expect(added).toHaveCount(2);
  await page.locator('#undo').click();
  await expect(added).toHaveCount(4);
  await page.locator('#undo').click();
  await expect(added).toHaveCount(2);
});
test('Alignment can edit existing published added objects without a local draft',async({page})=>{
  const sourceWithObjects=source.replace('</main>',
    '<div data-moon-v2-added-layer>'+
    '<div data-moon-v2-added-id="published-a" data-moon-v2-object-type="shape" '+
    'data-moon-v2-shape-fill="#eeeeee" data-moon-v2-added-appearance="{}" '+
    'data-moon-v2-added-geometry=\'{"desktop":{"x":40,"y":120,"w":100,"h":60},"phone":{"x":10,"y":120,"w":80,"h":60}}\'></div>'+
    '<div data-moon-v2-added-id="published-b" data-moon-v2-object-type="shape" '+
    'data-moon-v2-shape-fill="#eeeeee" data-moon-v2-added-appearance="{}" '+
    'data-moon-v2-added-geometry=\'{"desktop":{"x":260,"y":300,"w":100,"h":60},"phone":{"x":20,"y":300,"w":80,"h":60}}\'></div>'+
    '</div></main>');
  // Mock the revised, already published HTML on GitHub main.
  await page.unroute('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/contact.html?ref=main');
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/contact.html?ref=main',
    route=>route.fulfill({status:200,contentType:'application/json',
      headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({type:'file',sha:'published-source',
        encoding:'base64',content:Buffer.from(sourceWithObjects).toString('base64')})}));
  await page.locator('#reloadLive').click();
  const added=page.frameLocator('#livePageFrame').locator('[data-moon-v2-added-id]');
  await expect(added).toHaveCount(2);
  await page.locator('#liveSelectAdded').click();
  await expect(page.locator('#liveMultiCount')).toContainText('2 selected');
  await page.locator('#liveAlignLeft').click();
  const result=await geom(page);
  expect(result[0].x).toBe(result[1].x);
  await page.locator('#undo').click();
  const original=await geom(page);
  expect(original.map(o=>o.x)).toEqual([40,260]);
});
