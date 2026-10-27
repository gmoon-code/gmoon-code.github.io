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

async function selectSourceGroup(page,names){
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.'+names[0]).click();
  for(const name of names.slice(1))
    await live.locator('main p.'+name).click({modifiers:['Shift']});
  await expect(page.locator('#liveMultiCount')).toHaveText(names.length+' selected');
  return live;
}
async function localRect(locator){
  return locator.evaluate(node=>{
    const b=node.getBoundingClientRect();
    return {x:b.x,y:b.y,w:b.width,h:b.height};
  });
}
test('alignment tools arrange original paragraphs without moving unselected neighbours',async({page})=>{
  const live=await selectSourceGroup(page,['first','second']);
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  const third=live.locator('main p.third'),thirdBefore=await localRect(third);
  await expect(page.locator('#liveAlignLeft')).toBeEnabled();
  await page.locator('#liveAlignLeft').click();
  const a=await localRect(first),b=await localRect(second);
  expect(Math.abs(a.x-b.x)).toBeLessThan(1.5);
  expect(Math.abs((await localRect(third)).x-thirdBefore.x)).toBeLessThan(1.5);
  await expect(first.locator('a')).toHaveAttribute('href','teaching.html');
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  await page.locator('#undo').click();
  const original=await localRect(live.locator('main p.second'));
  expect(original.x).toBeGreaterThan(a.x+70);
});
test('distribution equalises original-element centre spacing in one undoable edit',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.second').click();
  await page.locator('#liveMoveX').fill('95');
  await page.locator('#liveMoveX').press('Tab');
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  const third=live.locator('main p.third');
  const middleBefore=await localRect(second);
  await selectSourceGroup(page,['first','second','third']);
  await expect(page.locator('#liveDistributeH')).toBeEnabled();
  await page.locator('#liveDistributeH').click();
  const a=await localRect(first),b=await localRect(second),c=await localRect(third);
  const mid=r=>r.x+r.w/2;
  expect(Math.abs((mid(b)-mid(a))-(mid(c)-mid(b)))).toBeLessThan(1.5);
  expect(Math.abs(b.x-middleBefore.x)).toBeGreaterThan(40);
  await expect(first.locator('a')).toHaveAttribute('href','teaching.html');
  await page.locator('#undo').click();
  const reverted=await localRect(live.locator('main p.second'));
  expect(Math.abs(reverted.x-middleBefore.x)).toBeLessThan(1.5);
});
test('original-element alignment applies only to selected device and survives a reload',async({page})=>{
  const live=await selectSourceGroup(page,['first','second']);
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  await page.locator('#liveAlignLeft').click();
  const desktopA=await localRect(first),desktopB=await localRect(second);
  expect(Math.abs(desktopA.x-desktopB.x)).toBeLessThan(1.5);
  await page.locator('#devicePreview').selectOption('phone');
  const phoneA=await localRect(first),phoneB=await localRect(second);
  expect(Math.abs(phoneA.x-phoneB.x)).toBeGreaterThan(50);
  await page.locator('#devicePreview').selectOption('desktop');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(live.locator('main p.third')).toHaveText('Third neighbour');
  const afterA=await localRect(live.locator('main p.first'));
  const afterB=await localRect(live.locator('main p.second'));
  expect(Math.abs(afterA.x-afterB.x)).toBeLessThan(1.5);
  await expect(live.locator('main p.first a')).toHaveAttribute('href','teaching.html');
});

test('original multi-selection draws one group outline and exposes only a group move handle',async({page})=>{
  const live=await selectSourceGroup(page,['first','second']);
  const first=await localRect(live.locator('main p.first'));
  const second=await localRect(live.locator('main p.second'));
  const overlay=live.locator('#moon-v2-live-overlay');
  await expect(overlay).toHaveAttribute('data-group-count','2');
  const frameBounds=await overlay.evaluate(node=>{
    const b=node.getBoundingClientRect();
    return {x:b.left,y:b.top,w:b.width,h:b.height};
  });
  expect(Math.abs(frameBounds.x-Math.min(first.x,second.x))).toBeLessThan(1.5);
  expect(frameBounds.w).toBeGreaterThan(second.x-first.x+second.w-2);
  await expect(overlay.locator('.moon-v2-move')).toHaveText('Move group');
  await expect(overlay.locator('.moon-v2-grip')).toHaveCount(8);
  await expect(overlay.locator('.moon-v2-delete')).toHaveCount(0);
  await page.locator('#liveClearAdded').click();
  await expect(overlay).toHaveCount(0);
});
test('one selected original element retains its resize handles',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.second').click();
  const overlay=live.locator('#moon-v2-live-overlay');
  await expect(overlay).toHaveAttribute('data-group-count','1');
  await expect(overlay.locator('.moon-v2-grip')).toHaveCount(8);
});

test('published source translations remain the baseline when moving an original image',async({page})=>{
  const published='<!doctype html><html><head><style id="moon-v2-live-layout">'+
    '@media (min-width:1025px){main > img:nth-of-type(1){'+
    'translate:-112px 17px!important;scale:0.92 0.92!important;'+
    'transform-origin:top left!important;}}</style></head>'+
    '<body><main style="padding:120px 200px">'+
    '<img src="assets/profile-portrait.webp" width="170" height="130" alt="Published photo">'+
    '<p>Original paragraph stays in place</p></main></body></html>';
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'published-transform-fixture',
        encoding:'base64',content:Buffer.from(published).toString('base64')})}));
  await page.route('**/research.html',route=>
    route.fulfill({status:200,contentType:'text/html',body:published}));
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  const image=live.locator('main img');
  await expect(image).toBeVisible();
  await image.click();
  const baseline=await image.evaluate(node=>getComputedStyle(node).translate);
  expect(parseFloat(baseline)).toBe(-112);
  await page.locator('#liveMoveX').fill('20');
  await page.locator('#liveMoveX').press('Tab');
  const moved=await image.evaluate(node=>getComputedStyle(node).translate);
  expect(Math.abs(parseFloat(moved)-(-92))).toBeLessThan(1.2);
  await expect(image).toHaveCSS('scale','0.92');
  await page.reload({waitUntil:'domcontentloaded'});
  const retained=await live.locator('main img').evaluate(node=>getComputedStyle(node).translate);
  expect(Math.abs(parseFloat(retained)-(-92))).toBeLessThan(1.2);
});

test('group resize expands original text boxes together without scaling glyphs and can be undone',async({page})=>{
  const live=await selectSourceGroup(page,['first','second']);
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  const beforeA=await localRect(first),beforeB=await localRect(second);
  const beforeFont=await first.evaluate(node=>getComputedStyle(node).fontSize);
  const grip=live.locator('#moon-v2-live-overlay [data-direction="e"]');
  await expect(grip).toBeVisible();
  const box=await grip.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+90,box.y+box.height/2,{steps:7});
  await page.mouse.up();
  const afterA=await localRect(first),afterB=await localRect(second);
  expect(afterA.w).toBeGreaterThan(beforeA.w+10);
  expect(afterB.w).toBeGreaterThan(beforeB.w+10);
  expect(afterB.x).toBeGreaterThan(beforeB.x+15);
  await expect(first).toHaveCSS('font-size',beforeFont);
  await expect(second).toHaveCSS('font-size',beforeFont);
  await expect(first.locator('a')).toHaveAttribute('href','teaching.html');
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  await page.locator('#undo').click();
  const oldA=await localRect(live.locator('main p.first'));
  const oldB=await localRect(live.locator('main p.second'));
  expect(Math.abs(oldA.w-beforeA.w)).toBeLessThan(2);
  expect(Math.abs(oldB.w-beforeB.w)).toBeLessThan(2);
});
test('resizing selected original pictures keeps image fitting and normalizes only the active device',async({page})=>{
  const source='<!doctype html><html><head><style>main{padding:90px 40px}'+
    '.gallery{display:flex;gap:70px}img{width:160px;height:120px;object-fit:contain}'+
    '</style></head><body><main><div class="gallery">'+
    '<img alt="Picture one" src="assets/profile-portrait.webp">'+
    '<img alt="Picture two" src="assets/pungmul-stage.webp">'+
    '</div></main></body></html>';
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'two-photos',encoding:'base64',
        content:Buffer.from(source).toString('base64')})}));
  await page.route('**/research.html',route=>route.fulfill({status:200,body:source,contentType:'text/html'}));
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame'),imgs=live.locator('main img');
  await imgs.first().click();await imgs.last().click({modifiers:['Shift']});
  // A flex gallery can naturally be narrower on phones. Compare the
  // unchanged phone layout against its own pre-resize dimensions.
  await page.locator('#devicePreview').selectOption('phone');
  const phoneBaseline=await localRect(imgs.first());
  await page.locator('#devicePreview').selectOption('desktop');
  const before1=await localRect(imgs.first()),before2=await localRect(imgs.last());
  const grip=live.locator('#moon-v2-live-overlay [data-direction="se"]');
  const box=await grip.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+35,{steps:9});
  await page.mouse.up();
  const after1=await localRect(imgs.first()),after2=await localRect(imgs.last());
  expect(after1.w).toBeGreaterThan(before1.w+5);
  expect(after2.w).toBeGreaterThan(before2.w+5);
  await expect(imgs.first()).toHaveCSS('object-fit','contain');
  await expect(imgs.last()).toHaveCSS('object-fit','contain');
  await expect(imgs.first()).toHaveAttribute('src','assets/profile-portrait.webp');
  await page.locator('#devicePreview').selectOption('phone');
  const phone1=await localRect(imgs.first());
  expect(Math.abs(phone1.w-phoneBaseline.w)).toBeLessThan(3);
});
test('Ctrl-click cycles through overlapping independent source objects without changing source',async({page})=>{
  const source='<!doctype html><html><head><style>'+
    'main{position:relative;margin:60px;width:700px;height:540px}'+
    'main>p{position:absolute;left:90px;top:60px;width:290px;height:170px;'+
    'margin:0;padding:15px;box-sizing:border-box;background:#d3eee4;font:20px Arial}'+
    'main>p.top{left:130px;top:90px;z-index:2;background:#f1dfc9}'+
    '</style></head><body><main>'+
    '<p class="bottom">Bottom original object</p>'+
    '<p class="top">Top original object</p></main></body></html>';
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'overlap-test-v1',encoding:'base64',
        content:Buffer.from(source).toString('base64')})}));
  await page.route('**/research.html',route=>route.fulfill({status:200,body:source,contentType:'text/html'}));
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame'),top=live.locator('main p.top');
  const under=live.locator('main p.bottom');
  await top.click({position:{x:75,y:75}});
  await expect(top).toHaveAttribute('data-moon-v2-live-selected','');
  const rect=await top.boundingBox(),point={x:rect.x+40,y:rect.y+40};
  await page.keyboard.down('Control');
  await page.mouse.click(point.x,point.y);
  await page.keyboard.up('Control');
  await expect(under).toHaveAttribute('data-moon-v2-live-selected','');
  await expect(top).not.toHaveAttribute('data-moon-v2-live-selected','');
  await expect(page.locator('#liveMultiCount')).toHaveText('1 selected');
  await expect(under).toHaveText('Bottom original object');
});
