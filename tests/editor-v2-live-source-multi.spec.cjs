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

test('deeply nested source objects can be selected, moved and navigated by parent and child',async({page})=>{
  const nesting=16;
  const source='<!doctype html><html><head><style>main{padding:70px}'+
    '.wrapper{padding:2px}</style></head><body><main>'+
    '<div class="wrapper">'.repeat(nesting)+
    '<p id="deep">Deep original object</p>'+
    '</div>'.repeat(nesting)+'</main></body></html>';
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'deep-test',encoding:'base64',
        content:Buffer.from(source).toString('base64')})}));
  await page.route('**/research.html',route=>route.fulfill({status:200,contentType:'text/html',body:source}));
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame'),deep=live.locator('#deep');
  await deep.click();
  await expect(page.locator('#liveElementPath')).toContainText('p');
  await expect(page.locator('#liveSelectParent')).toBeEnabled();
  await page.locator('#liveMoveX').fill('31');
  await page.locator('#liveMoveX').press('Tab');
  await expect(deep).toHaveCSS('translate',/^31px(?: 0px)?$/);
  await page.locator('#liveSelectParent').click();
  await expect(page.locator('#liveElementPath')).toContainText('div');
  await expect(page.locator('#liveSelectChild')).toBeEnabled();
  await page.locator('#liveSelectChild').click();
  await expect(deep).toHaveAttribute('data-moon-v2-live-selected','');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(live.locator('#deep')).toHaveCSS('translate',/^31px(?: 0px)?$/);
  await expect(live.locator('#deep')).toHaveText('Deep original object');
});
test('releasing container clipping is device-scoped, reversible and survives page reload',async({page})=>{
  const source='<!doctype html><html><head><style>'+
    'main{padding:100px;overflow:visible}'+
    'section.frame{position:relative;width:180px;height:120px;overflow:hidden;border:1px solid}'+
    'section.frame p{position:absolute;top:20px;left:10px;margin:0;'+
    'width:120px;height:50px;background:#f4c6a4;font:18px Arial}'+
    '</style></head><body><main><section class="frame">'+
    '<p id="moving">Move beyond frame</p></section></main></body></html>';
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'clip-test',encoding:'base64',
        content:Buffer.from(source).toString('base64')})}));
  await page.route('**/research.html',route=>route.fulfill({status:200,contentType:'text/html',body:source}));
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  const child=live.locator('#moving'),parent=live.locator('section.frame');
  await child.click();
  await expect(page.locator('#liveReleaseClip')).toBeEnabled();
  await page.locator('#liveMoveX').fill('210');
  await page.locator('#liveMoveX').press('Tab');
  await expect(parent).toHaveCSS('overflow-x','hidden');
  await page.locator('#liveReleaseClip').check();
  await expect(parent).toHaveCSS('overflow-x','visible');
  await expect(child).toHaveCSS('translate',/^210px(?: 0px)?$/);
  await page.locator('#devicePreview').selectOption('phone');
  await expect(parent).toHaveCSS('overflow-x','hidden');
  await page.locator('#devicePreview').selectOption('desktop');
  await expect(parent).toHaveCSS('overflow-x','visible');
  await page.locator('#undo').click();
  await expect(parent).toHaveCSS('overflow-x','hidden');
  await expect(child).toHaveCSS('translate',/^210px(?: 0px)?$/);
  await page.locator('#liveReleaseClip').check();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(live.locator('section.frame')).toHaveCSS('overflow-x','visible');
  await expect(live.locator('#moving')).toHaveText('Move beyond frame');
});

test('nested layout containers are visible on demand and siblings can be selected precisely',async({page})=>{
  const source='<!doctype html><html><head><style>'+
    'main{padding:55px}div.frame{padding:30px;border:1px solid}p{padding:8px}'+
    '</style></head><body><main><div class="frame">'+
    '<p class="first">First sibling</p><p class="second">Second sibling</p>'+
    '<p class="third">Third sibling</p></div></main></body></html>';
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'layer-explorer-source',encoding:'base64',
        content:Buffer.from(source).toString('base64')})}));
  await page.route('**/research.html',
    route=>route.fulfill({status:200,contentType:'text/html',body:source}));
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  await live.locator('p.second').click();
  await expect(page.locator('#livePrevSibling')).toBeEnabled();
  await expect(page.locator('#liveNextSibling')).toBeEnabled();
  await page.locator('#liveNextSibling').click();
  await expect(live.locator('p.third')).toHaveAttribute('data-moon-v2-live-selected','');
  await page.locator('#livePrevSibling').click();
  await expect(live.locator('p.second')).toHaveAttribute('data-moon-v2-live-selected','');
  await page.locator('#liveSelectParent').click();
  await expect(live.locator('div.frame')).toHaveAttribute('data-moon-v2-live-selected','');
  await page.locator('#liveShowContainers').check();
  await expect(page.locator('#liveElementList [data-depth]')).toHaveCount(4);
  await expect(page.locator('#liveElementList [aria-current="true"]')).toHaveCount(1);
  await page.locator('#liveElementSearch').fill('no-such-layer');
  // Selected is always pinned even when the search filters it out.
  await expect(page.locator('#liveElementList [aria-current="true"]')).toHaveCount(1);
  await page.locator('#liveLocateSelected').click();
  await expect(page.locator('#liveElementSearch')).toHaveValue('');
  await expect(page.locator('#liveElementList [aria-current="true"]')).toHaveCount(1);
  await expect(page.locator('#liveShowContainers')).toBeChecked();
});

test('hover preview and keyboard layer navigation identify real source elements without editing them',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const rows=page.locator('#liveElementList button[data-live-selector]');
  await expect(rows).toHaveCount(3);
  await rows.nth(0).hover();
  await expect(live.locator('main p').nth(0)).toHaveAttribute('data-moon-v2-layer-preview','');
  await expect(live.locator('main p').nth(0)).not.toHaveAttribute('data-moon-v2-live-selected','');
  await rows.nth(0).focus();
  await page.keyboard.press('ArrowDown');
  await expect(rows.nth(1)).toBeFocused();
  await expect(live.locator('main p').nth(1)).toHaveAttribute('data-moon-v2-layer-preview','');
  await page.keyboard.press('Enter');
  await expect(live.locator('main p').nth(1)).toHaveAttribute('data-moon-v2-live-selected','');
  await page.keyboard.press('End');
  await expect(rows.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(rows.first()).toBeFocused();
  await page.locator('#liveElementSearch').focus();
  await expect(live.locator('[data-moon-v2-layer-preview]')).toHaveCount(0);
  await expect(page.locator('#liveEditCount')).toContainText('No saved live-page edits');
});

test('original webpage position lock persists after reload and prevents nudging',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.second').click();
  await page.locator('#liveMoveX').fill('25');
  await page.locator('#liveMoveX').press('Tab');
  await page.locator('#liveTogglePositionLock').click();
  await expect(page.locator('#liveTogglePositionLock')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#liveMoveX')).toBeDisabled();
  await expect(page.locator('#liveTextBoxWidth')).toBeDisabled();
  await expect(page.locator('#liveTextBoxHeight')).toBeDisabled();
  await expect(live.locator('#moon-v2-live-overlay .moon-v2-grip')).toHaveCount(0);
  await expect(page.locator('#liveElementList [data-position-locked="true"]')).toHaveCount(1);
  await page.keyboard.press('ArrowRight');
  await expect(live.locator('main p.second')).toHaveCSS('translate',/^25px(?: 0px)?$/);
  await page.reload({waitUntil:'domcontentloaded'});
  await live.locator('main p.second').click();
  await expect(page.locator('#liveTogglePositionLock')).toHaveAttribute('aria-pressed','true');
  await page.locator('#liveTogglePositionLock').click();
  await expect(page.locator('#liveMoveX')).toBeEnabled();
  await page.locator('#liveMoveX').fill('48');
  await page.locator('#liveMoveX').press('Tab');
  await expect(live.locator('main p.second')).toHaveCSS('translate',/^48px(?: 0px)?$/);
});
test('locked member blocks whole group alignment but not selection',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.second').click();
  await page.locator('#liveTogglePositionLock').click();
  await live.locator('main p.first a').click({modifiers:['Shift']});
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  await expect(page.locator('#liveAlignLeft')).toBeDisabled();
  await expect(live.locator('#moon-v2-live-overlay .moon-v2-grip')).toHaveCount(0);
  const before=await live.locator('main p.first').evaluate(node=>node.getBoundingClientRect().x);
  await page.keyboard.press('ArrowRight');
  const after=await live.locator('main p.first').evaluate(node=>node.getBoundingClientRect().x);
  expect(Math.abs(after-before)).toBeLessThan(1);
});

test('north-west corner resize reflows original text without clipping or distorting glyphs',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const paragraph=live.locator('main p.second');
  await paragraph.click();
  const before=await paragraph.evaluate(node=>{
    const rect=node.getBoundingClientRect();
    return {right:rect.right,bottom:rect.bottom,font:getComputedStyle(node).fontSize,
      width:rect.width};
  });
  const grip=live.locator('#moon-v2-live-overlay [data-direction="nw"]');
  const rect=await grip.boundingBox();
  expect(rect).toBeTruthy();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2+95,rect.y+rect.height/2+36,{steps:8});
  await page.mouse.up();
  const after=await paragraph.evaluate(node=>{
    const rect=node.getBoundingClientRect();
    return {right:rect.right,bottom:rect.bottom,font:getComputedStyle(node).fontSize,
      width:rect.width,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight};
  });
  expect(after.width).toBeLessThan(before.width-40);
  expect(after.font).toBe(before.font);
  expect(after.scrollHeight).toBeLessThanOrEqual(after.clientHeight+3);
  expect(Math.abs(after.right-before.right)).toBeLessThan(4);
  expect(Math.abs(after.bottom-before.bottom)).toBeLessThan(4);
});

test('multi-selection corner resize keeps wrapped source text readable',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  await first.locator('a').click({modifiers:['Alt']});
  await second.click({modifiers:['Shift']});
  await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
  const font=await second.evaluate(node=>getComputedStyle(node).fontSize);
  const grip=live.locator('#moon-v2-live-overlay [data-direction="nw"]');
  const box=await grip.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+90,box.y+box.height/2+30,{steps:9});
  await page.mouse.up();
  for(const paragraph of [first,second]){
    const dimensions=await paragraph.evaluate(node=>({
      scroll:node.scrollHeight,client:node.clientHeight,
      font:getComputedStyle(node).fontSize
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client+3);
    expect(dimensions.font).toBe(font);
  }
});

const sectionSource='<!doctype html><html><head><style>'+
  'body{margin:0}main{margin:85px 60px;width:840px}'+
  'section.feature{box-sizing:border-box;width:520px;height:340px;'+
    'padding:20px;background:#e2ece2;border:1px solid #658b74}'+
  'section.feature p{font:20px/1.5 Arial;margin:0;min-height:240px}'+
  'section.following{margin-top:30px;width:520px;height:90px;background:#f3e4b3}'+
  '</style></head><body><main>'+
  '<section class="feature"><p>Section content stays legible and is never scaled.</p></section>'+
  '<section class="following"><p>Following section remains present</p></section>'+
  '</main></body></html>';
async function loadSectionFixture(page){
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'section-sizing-fixture-v1',
        encoding:'base64',content:Buffer.from(sectionSource).toString('base64')})}));
  await page.route('**/research.html',
    route=>route.fulfill({status:200,contentType:'text/html',body:sectionSource}));
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.frameLocator('#livePageFrame').locator('section.feature p'))
    .toHaveText('Section content stays legible and is never scaled.');
}
test('semantic website section can shrink vertically and fit content without scaling children',async({page})=>{
  await loadSectionFixture(page);
  const live=page.frameLocator('#livePageFrame');
  const section=live.locator('section.feature'),paragraph=section.locator('p');
  await paragraph.click();
  await expect(page.locator('#liveSelectSection')).toBeEnabled();
  await page.locator('#liveSelectSection').click();
  await expect(page.locator('#liveSectionSizing')).toBeVisible();
  await expect(live.locator('#moon-v2-live-overlay .moon-v2-grip')).toHaveCount(8);
  const before=await section.evaluate(node=>node.getBoundingClientRect().height);
  const originalFont=await paragraph.evaluate(node=>getComputedStyle(node).fontSize);
  const handle=live.locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="s"]');
  const grip=await handle.boundingBox();expect(grip).toBeTruthy();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
  await page.mouse.down();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2-85,{steps:10});
  await page.mouse.up();
  const after=await section.evaluate(node=>node.getBoundingClientRect().height);
  expect(after).toBeLessThan(before-30);
  await expect(page.locator('#liveSectionHeightMode')).toHaveValue('fixed');
  await expect(page.locator('#liveSectionOverflow')).toBeVisible();
  expect(await paragraph.evaluate(node=>getComputedStyle(node).fontSize)).toBe(originalFont);
  await expect(paragraph).toHaveText('Section content stays legible and is never scaled.');
  await page.locator('#liveFitSectionHeight').click();
  await expect(page.locator('#liveSectionHeightMode')).toHaveValue('auto');
  await expect(page.locator('#liveSectionOverflow')).toBeHidden();
  const fitted=await section.evaluate(node=>node.getBoundingClientRect().height);
  expect(fitted).toBeGreaterThan(after+20);
});
test('section dimensions can be set precisely in inspector and survive draft reload',async({page})=>{
  await loadSectionFixture(page);
  const live=page.frameLocator('#livePageFrame');
  await live.locator('section.feature p').click();
  await page.locator('#liveSelectSection').click();
  await page.locator('#liveOriginalHeight').fill('210');
  await page.locator('#liveOriginalHeight').dispatchEvent('change');
  await expect(page.locator('#liveSectionHeightMode')).toHaveValue('fixed');
  const current=await live.locator('section.feature').evaluate(node=>node.getBoundingClientRect().height);
  expect(Math.abs(current-210)).toBeLessThan(3);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(live.locator('section.feature')).toHaveCount(1);
  const restored=await live.locator('section.feature').evaluate(node=>node.getBoundingClientRect().height);
  expect(Math.abs(restored-210)).toBeLessThan(3);
  await expect(live.locator('section.feature p')).toHaveText(
    'Section content stays legible and is never scaled.');
});

test('section resizing stays scoped to selected device and width-only edits retain natural height',async({page})=>{
  await loadSectionFixture(page);
  const live=page.frameLocator('#livePageFrame');
  const section=live.locator('section.feature');
  await live.locator('section.feature p').click();
  await page.locator('#liveSelectSection').click();
  // A width-only adjustment should let the content determine section height.
  await page.locator('#liveOriginalWidth').fill('360');
  await page.locator('#liveOriginalWidth').dispatchEvent('change');
  await expect(page.locator('#liveSectionHeightMode')).toHaveValue('auto');
  const desktopWidth=await section.evaluate(node=>node.getBoundingClientRect().width);
  expect(Math.abs(desktopWidth-360)).toBeLessThan(3);
  await page.locator('#liveOriginalHeight').fill('195');
  await page.locator('#liveOriginalHeight').dispatchEvent('change');
  await expect(page.locator('#liveSectionHeightMode')).toHaveValue('fixed');
  const desktopHeight=await section.evaluate(node=>node.getBoundingClientRect().height);
  expect(Math.abs(desktopHeight-195)).toBeLessThan(3);
  await page.locator('#devicePreview').selectOption('phone');
  const phoneHeight=await section.evaluate(node=>node.getBoundingClientRect().height);
  // The selected device's original 340px height is unchanged.
  expect(Math.abs(phoneHeight-340)).toBeLessThan(3);
  await page.locator('#devicePreview').selectOption('desktop');
  const restored=await section.evaluate(node=>node.getBoundingClientRect().height);
  expect(Math.abs(restored-195)).toBeLessThan(3);
});

test('section edit mode exposes draggable edges and selects a section from its text',async({page})=>{
  await loadSectionFixture(page);
  const live=page.frameLocator('#livePageFrame');
  const section=live.locator('section.feature');
  const button=page.locator('#liveSectionPickMode');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','true');
  await section.locator('p').click();
  await expect(page.locator('#liveSectionSizing')).toBeVisible();
  await expect(live.locator('#moon-v2-live-overlay .moon-v2-edge')).toHaveCount(4);
  const edges=live.locator('#moon-v2-live-overlay .moon-v2-edge[data-direction="e"]');
  const before=await section.evaluate(node=>node.getBoundingClientRect().width);
  const box=await edges.boundingBox();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThanOrEqual(12);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2-85,box.y+box.height/2,{steps:9});
  await page.mouse.up();
  const after=await section.evaluate(node=>node.getBoundingClientRect().width);
  expect(after).toBeLessThan(before-35);
  await expect(page.locator('#liveSectionHeightMode')).toHaveValue('auto');
  await expect(section.locator('p')).toHaveCSS('font-size','20px');
});
test('zoom-aware section grips retain reachable on-screen size',async({page})=>{
  await loadSectionFixture(page);
  const live=page.frameLocator('#livePageFrame');
  await page.locator('#liveSectionPickMode').click();
  await live.locator('section.feature p').click();
  await page.locator('#zoom').evaluate(input=>{
    input.value='25';
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const overlay=live.locator('#moon-v2-live-overlay');
  const grip=overlay.locator('.moon-v2-grip[data-direction="se"]');
  const bounds=await grip.boundingBox();
  expect(bounds).toBeTruthy();
  expect(bounds.width).toBeGreaterThanOrEqual(16);
  expect(bounds.height).toBeGreaterThanOrEqual(16);
  await expect(overlay.locator('.moon-v2-edge')).toHaveCount(4);
});
test('section selection mode never navigates embedded page links',async({page})=>{
  await loadSectionFixture(page);
  const live=page.frameLocator('#livePageFrame');
  await live.locator('section.feature p').evaluate(node=>{
    const text=node.textContent;
    node.replaceChildren();
    const anchor=node.ownerDocument.createElement('a');
    anchor.href='teaching.html';
    anchor.textContent=text;
    node.append(anchor);
  });
  await page.locator('#liveSectionPickMode').click();
  await live.locator('section.feature a').click();
  await expect(page.locator('#liveSectionSizing')).toBeVisible();
  await expect(live.locator('section.feature')).toHaveCount(1);
  await expect(page.locator('#liveSectionPickMode')).toHaveAttribute('aria-pressed','true');
});

// Real 12x6 two-colour image, to verify actual visible crop pixels.
// Use a two-colour image so cropping can be verified visually and numerically.
const cropPng='iVBORw0KGgoAAAANSUhEUgAAAAwAAAAGCAIAAAB4jOjWAAAAGklEQVR4nGN8pizCgAr0lM+iiTAxEAEGoyIA3OwCR28dY84AAAAASUVORK5CYII=';
const cropSource='<!doctype html><html><head><style>'+
  'body{margin:0}main{padding:90px 45px}'+
  'img.picture{display:block;width:240px;height:120px;object-fit:contain}'+
  '</style></head><body><main>'+
  '<img class="picture" alt="Two-colour crop test" src="data:image/png;base64,'+cropPng+'">'+
  '<p>Following webpage content</p></main></body></html>';
async function loadCropFixture(page){
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'crop-v49-fixture',
        encoding:'base64',content:Buffer.from(cropSource).toString('base64')})}));
  await page.route('**/research.html',
    route=>route.fulfill({status:200,contentType:'text/html',body:cropSource}));
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.frameLocator('#livePageFrame').locator('img.picture')).toHaveCount(1);
}
async function cropSide(page,side,percent){
  const name=side[0].toUpperCase()+side.slice(1);
  await page.locator('#liveCrop'+name).evaluate((el,v)=>{
    el.value=String(v);el.dispatchEvent(new Event('change',{bubbles:true}));
  },percent);
}
async function cropBox(node){
  return node.evaluate(el=>{
    const b=el.getBoundingClientRect();
    return {x:b.x,y:b.y,w:b.width,h:b.height};
  });
}
test('crop cuts the right edge without moving the left edge or modifying the image source',async({page})=>{
  await loadCropFixture(page);
  const image=page.frameLocator('#livePageFrame').locator('img.picture');
  const src=await image.getAttribute('src');
  await image.click();
  await page.locator('#cropImageTool').click();
  const before=await cropBox(image);
  await cropSide(page,'right',20);
  const after=await cropBox(image);
  expect(Math.abs(after.x-before.x)).toBeLessThan(2);
  expect(after.w).toBeLessThan(before.w-30);
  expect(Math.abs(after.h-before.h)).toBeLessThan(2);
  await expect(page.locator('#liveCropRightValue')).toHaveText('20%');
  await expect(page.locator('#liveCropLeftValue')).toHaveText('0%');
  expect(await image.getAttribute('src')).toBe(src);
});
test('left, top and bottom can be cut independently without stretching the remainder',async({page})=>{
  await loadCropFixture(page);
  const image=page.frameLocator('#livePageFrame').locator('img.picture');
  await image.click();
  await page.locator('#cropImageTool').click();
  const before=await cropBox(image);
  await cropSide(page,'left',20);
  const left=await cropBox(image);
  expect(left.x).toBeGreaterThan(before.x+30);
  expect(left.w).toBeLessThan(before.w-30);
  await cropSide(page,'top',15);
  const top=await cropBox(image);
  expect(top.y).toBeGreaterThan(left.y+10);
  expect(top.h).toBeLessThan(left.h-10);
  await cropSide(page,'bottom',10);
  await expect(page.locator('#liveCropLeftValue')).toHaveText('20%');
  await expect(page.locator('#liveCropRightValue')).toHaveText('0%');
  await expect(page.locator('#liveCropTopValue')).toHaveText('15%');
  await expect(page.locator('#liveCropBottomValue')).toHaveText('10%');
  await expect(image).toHaveCSS('object-fit','none');
  const css=await image.evaluate(el=>{
    const st=getComputedStyle(el);
    return {size:st.backgroundSize,position:st.backgroundPosition};
  });
  expect(css.size).toMatch(/px/);
  expect(css.position).toMatch(/px/);
});
test('pink crop grip cuts the selected side without moving the opposite edge',async({page})=>{
  await loadCropFixture(page);
  const live=page.frameLocator('#livePageFrame'),image=live.locator('img.picture');
  await image.click();
  await page.locator('#cropImageTool').click();
  const before=await cropBox(image);
  const grip=live.locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="e"]');
  const b=await grip.boundingBox();expect(b).toBeTruthy();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
  await page.mouse.down();
  await page.mouse.move(b.x+b.width/2-55,b.y+b.height/2,{steps:8});
  await page.mouse.up();
  const after=await cropBox(image);
  expect(after.w).toBeLessThan(before.w-25);
  expect(Math.abs(after.x-before.x)).toBeLessThan(2);
  const croppedRight=await page.locator('#liveCropRight').inputValue();
  expect(Number(croppedRight)).toBeGreaterThan(10);
});
test('resizing a finished crop scales visible source pixels and preserves each cut',async({page})=>{
  await loadCropFixture(page);
  const live=page.frameLocator('#livePageFrame'),image=live.locator('img.picture');
  await image.click();
  await page.locator('#cropImageTool').click();
  await cropSide(page,'right',20);
  await page.locator('#cropImageTool').click();
  const before=await cropBox(image);
  const background=await image.evaluate(el=>parseFloat(getComputedStyle(el).backgroundSize));
  const grip=live.locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="se"]');
  const b=await grip.boundingBox();expect(b).toBeTruthy();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
  await page.mouse.down();
  await page.mouse.move(b.x+b.width/2+55,b.y+b.height/2+35,{steps:8});
  await page.mouse.up();
  const after=await cropBox(image);
  expect(after.w).toBeGreaterThan(before.w+20);
  expect(after.h).toBeGreaterThan(before.h+10);
  const grown=await image.evaluate(el=>parseFloat(getComputedStyle(el).backgroundSize));
  expect(grown).toBeGreaterThan(background+20);
  await image.click();
  await expect(page.locator('#liveCropRightValue')).toHaveText('20%');
  await expect(page.locator('#liveCropLeftValue')).toHaveText('0%');
});
test('photo shape choices include circle, oval, pill, rounded rectangle and polygons',async({page})=>{
  await loadCropFixture(page);
  const image=page.frameLocator('#livePageFrame').locator('img.picture');
  await image.click();
  for(const [shape,fragment] of [
    ['circle','circle('],['oval','none'],['pill','none'],
    ['rounded','none'],['diamond','polygon('],['hexagon','polygon('],
    ['star','polygon('],['heart','polygon(']]){
    await page.locator('#liveCropShape').selectOption(shape);
    const clip=await image.evaluate(el=>getComputedStyle(el).clipPath);
    expect(clip).toContain(fragment);
  }
  await page.locator('#liveCropShape').selectOption('oval');
  await expect(image).toHaveCSS('border-radius','50%');
  await page.locator('#liveCropShape').selectOption('pill');
  await expect(image).toHaveCSS('border-radius','999px');
});
test('resetting cut restores original dimensions and frame position',async({page})=>{
  await loadCropFixture(page);
  const image=page.frameLocator('#livePageFrame').locator('img.picture');
  await image.click();
  const before=await cropBox(image);
  await page.locator('#cropImageTool').click();
  await cropSide(page,'left',20);
  await cropSide(page,'bottom',15);
  await page.locator('#liveCropReset').click();
  const restored=await cropBox(image);
  expect(Math.abs(before.x-restored.x)).toBeLessThan(3);
  expect(Math.abs(before.y-restored.y)).toBeLessThan(3);
  expect(Math.abs(before.w-restored.w)).toBeLessThan(3);
  expect(Math.abs(before.h-restored.h)).toBeLessThan(3);
  await expect(image).toHaveCSS('object-fit','contain');
});
test('crop settings persist after reload without changing phone layout',async({page})=>{
  await loadCropFixture(page);
  const image=page.frameLocator('#livePageFrame').locator('img.picture');
  await image.click();
  await page.locator('#cropImageTool').click();
  await cropSide(page,'right',25);
  const desktop=await cropBox(image);
  await page.locator('#devicePreview').selectOption('phone');
  const phone=await cropBox(image);
  expect(phone.w).toBeGreaterThan(desktop.w+35);
  await page.locator('#devicePreview').selectOption('desktop');
  await page.reload({waitUntil:'domcontentloaded'});
  const restored=await cropBox(image);
  expect(Math.abs(restored.w-desktop.w)).toBeLessThan(2);
});
