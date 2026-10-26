const {test,expect}=require('@playwright/test');
const source='<!doctype html><html><head><style>'+
  'body{margin:0} main{margin:90px 45px;width:830px;}'+
  '.boxes{display:flex;gap:80px;align-items:start;}'+
  'p{font:20px Arial; width:200px; padding:10px; margin:0;height:80px;}'+
  '</style></head><body><main><div class="boxes">'+
  '<p class="first">First <a href="teaching.html">research link</a></p>'+
  '<p class="second">Second original paragraph</p>'+
  '<p class="third">Third neighbour</p></div></main></body></html>';
test.beforeEach(async({page})=>{
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'test-research-source-v1',encoding:'base64',
        content:Buffer.from(source).toString('base64')})}));
  await page.route('**/research.html',route=>route.fulfill({status:200,contentType:'text/html',body:source}));
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=research.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('moon-academic-editor-v2:source:research.html'));
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.frameLocator('#livePageFrame').locator('main p.third')).toHaveText('Third neighbour');
});
test('Shift-click selects two existing paragraphs and nudges them without rewriting source markup',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  const third=live.locator('main p.third');
  await first.locator('a').click({modifiers:['Alt']});
  await second.click({modifiers:['Shift']});
  await expect(first).toHaveAttribute('data-moon-v2-source-selected','');
  await expect(second).toHaveAttribute('data-moon-v2-source-selected','');
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  await expect(page.locator('#liveClearAdded')).toBeEnabled();
  const before=await first.evaluate(node=>node.getBoundingClientRect().x);
  const thirdBefore=await third.evaluate(node=>node.getBoundingClientRect().x);
  await second.press('ArrowRight');
  await expect(first).toHaveCSS('translate',/^1px(?: 0px)?$/);
  await expect(second).toHaveCSS('translate',/^1px(?: 0px)?$/);
  const after=await first.evaluate(node=>node.getBoundingClientRect().x);
  expect(after).toBeGreaterThan(before);
  const thirdAfter=await third.evaluate(node=>node.getBoundingClientRect().x);
  expect(Math.abs(thirdBefore-thirdAfter)).toBeLessThan(1);
  await expect(first.locator('a')).toHaveAttribute('href','teaching.html');
  await page.locator('#undo').click();
  await expect(live.locator('main p.first')).toHaveCSS('translate','none');
  await expect(live.locator('main p.second')).toHaveCSS('translate','none');
});
test('overlay grip drags selected original paragraphs as one undoable gesture',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  const third=live.locator('main p.third');
  await first.locator('a').click({modifiers:['Alt']});await second.click({modifiers:['Shift']});
  const x=element=>element.evaluate(node=>node.getBoundingClientRect().x);
  const firstBefore=await x(first),secondBefore=await x(second);
  const neighbourBefore=await x(third);
  const handle=live.locator('#moon-v2-live-overlay [data-direction="move"]');
  const rect=await handle.boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2+47,rect.y+rect.height/2+23,{steps:8});
  await page.mouse.up();
  const firstAfter=await x(first),secondAfter=await x(second);
  const neighbourAfter=await x(third);
  expect(firstAfter).toBeGreaterThan(firstBefore+25);
  expect(secondAfter).toBeGreaterThan(secondBefore+25);
  expect(Math.abs(firstAfter-firstBefore-(secondAfter-secondBefore))).toBeLessThan(1);
  expect(Math.abs(neighbourAfter-neighbourBefore)).toBeLessThan(1);
  await expect(first.locator('a')).toHaveAttribute('href','teaching.html');
});
test('Shift-clicking a link adds its paragraph to selection without navigating',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.second').click();
  await live.locator('main p.first a').click({modifiers:['Shift']});
  await expect(page.locator('#page')).toHaveValue('research.html');
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  await expect(live.locator('main p.first')).toHaveAttribute('data-moon-v2-source-selected','');
});

test('dragging a different selected source member retains the original group',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  await first.locator('a').click({modifiers:['Alt']});
  await second.click({modifiers:['Shift']});
  const x=element=>element.evaluate(node=>node.getBoundingClientRect().x);
  const firstBefore=await x(first),secondBefore=await x(second);
  const rect=await first.boundingBox();
  const start={x:rect.x+12,y:rect.y+Math.min(65,rect.height*.7)};
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  await page.mouse.move(start.x+38,start.y+22,{steps:9});
  await page.mouse.up();
  const firstAfter=await x(first),secondAfter=await x(second);
  expect(firstAfter).toBeGreaterThan(firstBefore+20);
  expect(secondAfter).toBeGreaterThan(secondBefore+20);
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
});

test('Clear selection removes source multi-outlines without discarding layout edits',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.second').click();
  await live.locator('main p.first a').click({modifiers:['Shift']});
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  await page.locator('#liveClearAdded').click();
  await expect(page.locator('#liveMultiCount')).toHaveText('0 selected');
  await expect(live.locator('[data-moon-v2-source-selected]')).toHaveCount(0);
  await expect(page.locator('#liveClearAdded')).toBeDisabled();
  await expect(live.locator('main p.first a')).toHaveAttribute('href','teaching.html');
});
