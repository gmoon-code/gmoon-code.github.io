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
  console.log('LIVE TRACE test line 25: '+"await first.locator('a').click({modifiers:['Alt']});");
  await first.locator('a').click({modifiers:['Alt']});
  console.log('LIVE TRACE test line 26: '+"await second.click({modifiers:['Shift']});");
  await second.click({modifiers:['Shift']});
  await expect(first).toHaveAttribute('data-moon-v2-source-selected','');
  await expect(second).toHaveAttribute('data-moon-v2-source-selected','');
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  const before=await first.boundingBox();
  const thirdBefore=await third.boundingBox();
  console.log('LIVE TRACE test line 32: '+"await second.press('ArrowRight');");
  await second.press('ArrowRight');
  await expect(first).toHaveCSS('translate','1px 0px');
  await expect(second).toHaveCSS('translate','1px 0px');
  const after=await first.boundingBox();
  expect(after.x).toBeGreaterThan(before.x);
  const thirdAfter=await third.boundingBox();
  expect(Math.abs(thirdBefore.x-thirdAfter.x)).toBeLessThan(1);
  await expect(first.locator('a')).toHaveAttribute('href','teaching.html');
  console.log('LIVE TRACE test line 40: '+"await page.locator('#undo').click();");
  await page.locator('#undo').click();
  await expect(live.locator('main p.first')).toHaveCSS('translate','none');
  await expect(live.locator('main p.second')).toHaveCSS('translate','none');
});
test('overlay grip drags selected original paragraphs as one undoable gesture',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  const third=live.locator('main p.third');
  console.log('LIVE TRACE test line 48: '+"await first.locator('a').click({modifiers:['Alt']});await second.click({mod");
  await first.locator('a').click({modifiers:['Alt']});await second.click({modifiers:['Shift']});
  const firstBefore=await first.boundingBox(),secondBefore=await second.boundingBox();
  const neighbourBefore=await third.boundingBox();
  console.log('LIVE TRACE test line 51: '+"const handle=live.locator('#moon-v2-live-overlay [data-direction=\"move\"]');");
  const handle=live.locator('#moon-v2-live-overlay [data-direction="move"]');
  console.log('LIVE TRACE test line 52: '+"const rect=await handle.boundingBox();");
  const rect=await handle.boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  console.log('LIVE TRACE test line 54: '+"await page.mouse.down();");
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2+47,rect.y+rect.height/2+23,{steps:8});
  console.log('LIVE TRACE test line 56: '+"await page.mouse.up();");
  await page.mouse.up();
  const firstAfter=await first.boundingBox(),secondAfter=await second.boundingBox();
  const neighbourAfter=await third.boundingBox();
  expect(firstAfter.x).toBeGreaterThan(firstBefore.x+25);
  expect(secondAfter.x).toBeGreaterThan(secondBefore.x+25);
  expect(Math.abs(firstAfter.x-firstBefore.x-(secondAfter.x-secondBefore.x))).toBeLessThan(1);
  expect(Math.abs(neighbourAfter.x-neighbourBefore.x)).toBeLessThan(1);
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
  console.log('LIVE TRACE test line 77: '+"await first.locator('a').click({modifiers:['Alt']});");
  await first.locator('a').click({modifiers:['Alt']});
  console.log('LIVE TRACE test line 78: '+"await second.click({modifiers:['Shift']});");
  await second.click({modifiers:['Shift']});
  const firstBefore=await first.boundingBox(),secondBefore=await second.boundingBox();
  const start={x:firstBefore.x+12,y:firstBefore.y+65};
  await page.mouse.move(start.x,start.y);
  console.log('LIVE TRACE test line 82: '+"await page.mouse.down();");
  await page.mouse.down();
  await page.mouse.move(start.x+38,start.y+22,{steps:9});
  console.log('LIVE TRACE test line 84: '+"await page.mouse.up();");
  await page.mouse.up();
  const firstAfter=await first.boundingBox(),secondAfter=await second.boundingBox();
  expect(firstAfter.x).toBeGreaterThan(firstBefore.x+20);
  expect(secondAfter.x).toBeGreaterThan(secondBefore.x+20);
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
});
