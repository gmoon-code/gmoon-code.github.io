const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const fixture='<!doctype html><html><head><style>main{margin:30px;width:950px;} h2{font:700 30px Georgia;}p{font:18px Georgia;} img{width:240px;height:160px;object-fit:contain}</style></head><body><main><h2>Research overview</h2><p>Students investigate scientific explanations together.</p><img src="assets/profile-portrait.webp" alt="Test portrait"></main></body></html>';
test.beforeEach(async({page})=>{
  await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=about.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('moon-academic-editor-v2:about.html'));
  await page.reload({waitUntil:'domcontentloaded'});
});
async function importScene(page){
  await page.locator('#importPage').click();
  await expect(page.locator('#status')).toContainText('Imported');
  await expect(page.locator('#stage .scene-object')).toHaveCount(3);
}
test('imports editable objects without changing original page',async({page})=>{
  await importScene(page);
  await expect(page.locator('#stage [data-kind=text]')).toHaveCount(2);
  await expect(page.locator('#stage [data-kind=image]')).toHaveCount(1);
  const original=await page.evaluate(()=>fetch('/about.html').then(result=>result.text()));
  expect(original).toBe(fixture);
});
test('independent drag and resize preserve neighbours, undo redo and reload',async({page})=>{
  await importScene(page);
  const objects=page.locator('#stage .scene-object');
  const heading=objects.first(),paragraph=objects.nth(1);
  const original=await heading.evaluate(n=>({x:parseInt(n.style.left),y:parseInt(n.style.top),w:parseInt(n.style.width)}));
  const sibling=await paragraph.evaluate(n=>n.getAttribute('style'));
  const box=await heading.boundingBox();
  const x=box.x+Math.min(90,box.width/2),y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y+48,{steps:9});await page.mouse.up();
  const moved=await heading.evaluate(n=>({x:parseInt(n.style.left),y:parseInt(n.style.top)}));
  expect(moved.x).toBeGreaterThanOrEqual(original.x+90);
  expect(moved.y).toBeGreaterThanOrEqual(original.y+50);
  expect(await paragraph.evaluate(n=>n.getAttribute('style'))).toBe(sibling);
  // Layers reliably select objects even when two canvas objects overlap.
  await page.locator('#layers [data-layer-id="1"]').click();
  const handle=heading.locator('[data-dir=se]');await expect(handle).toBeVisible();
  const grip=await handle.boundingBox();
  await page.evaluate(()=>{
    window.v2EventTrace=[];
    for(const type of ['pointerdown','pointermove','pointerup']){
      document.querySelector('#stage').addEventListener(type,e=>{
        if(window.v2EventTrace.length<15)
          window.v2EventTrace.push([type,e.target.className,e.target.dataset?.dir,e.clientX,e.clientY]);
      },true);
    }
  });
  const beforeHit=await page.evaluate(point=>{
    const node=document.elementFromPoint(point.x,point.y);
    return [node?.className,node?.dataset?.dir,node?.closest?.('.scene-object')?.dataset?.id];
  },{x:grip.x+grip.width/2,y:grip.y+grip.height/2});
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();
  await page.mouse.move(grip.x+grip.width/2+40,grip.y+grip.height/2+18,{steps:7});await page.mouse.up();
  const enlarged=await heading.evaluate(n=>parseInt(n.style.width));
  console.log('SOUTHEAST DIAGNOSTIC',JSON.stringify({beforeHit,grip,enlarged,
    eventTrace:await page.evaluate(()=>window.v2EventTrace)}));
  expect(enlarged).toBeGreaterThan(original.w+30);
  await page.locator('#undo').click();
  expect(await heading.evaluate(n=>parseInt(n.style.width))).toBe(original.w);
  await page.locator('#redo').click();
  expect(await heading.evaluate(n=>parseInt(n.style.width))).toBe(enlarged);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage .scene-object')).toHaveCount(3);
  expect(await page.locator('#stage .scene-object').first().evaluate(n=>parseInt(n.style.width))).toBe(enlarged);
});
test('west resize anchors right edge and image upload creates independent object',async({page})=>{
  await importScene(page);
  await page.locator('#addShape').click();
  const selected=page.locator('#stage .scene-object[aria-selected=true]');
  const before=await selected.evaluate(n=>({x:parseInt(n.style.left),w:parseInt(n.style.width)}));
  const grip=await selected.locator('[data-dir=w]').boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();
  await page.mouse.move(grip.x+grip.width/2+32,grip.y+grip.height/2,{steps:5});await page.mouse.up();
  const after=await selected.evaluate(n=>({x:parseInt(n.style.left),w:parseInt(n.style.width)}));
  expect(after.w).toBeLessThan(before.w-20);expect(after.x+after.w).toBe(before.x+before.w);
  await page.locator('#imageFile').setInputFiles({name:'tiny.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9a1Z6sUAAAAASUVORK5CYII=','base64')});
  await expect(page.locator('#stage [data-kind=image][aria-selected=true] img')).toHaveAttribute('src',/^data:image\/png;base64,/);
});
test('responsive HTML export and staging publication only, with no saved token',async({page})=>{
  await importScene(page);
  await page.locator('#preview').click();
  await expect(page.frameLocator('#previewFrame').locator('main .item')).toHaveCount(3);
  await page.locator('#closePreview').click();
  const pending=page.waitForEvent('download');await page.locator('#exportHtml').click();
  const exported=fs.readFileSync(await (await pending).path(),'utf8');
  expect(exported).toContain('Students investigate scientific explanations');
  expect(exported).toContain('@media(max-width:700px)');
  let observed;
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/editor-v2-previews/about.html',route=>{
    if(route.request().method()==='GET')return route.fulfill({status:404,contentType:'application/json',body:'{}'});
    observed=JSON.parse(route.request().postData());return route.fulfill({status:201,contentType:'application/json',body:'{}'});
  });
  await page.locator('#publish').click();await expect(page.locator('#stagePath')).toHaveText('editor-v2-previews/about.html');
  await page.locator('#githubToken').fill('testing-token-only');await page.locator('#confirmPublish').click();
  await expect(page.locator('#status')).toContainText('Staging published');
  expect(observed.message).toContain('staging preview');
  const stagedHtml=Buffer.from(observed.content,'base64').toString('utf8');
  expect(stagedHtml).toContain('Research overview');
  expect(stagedHtml).toContain('../assets/profile-portrait.webp');
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('testing-token-only');
});

test('inspector geometry, typography and locking change only the selected object',async({page})=>{
  await importScene(page);
  await page.locator('#stage [data-id="1"]').click();
  await page.locator('#propX').fill('175');
  await page.locator('#propX').press('Tab');
  await expect(page.locator('#stage [data-id="1"]')).toHaveCSS('left','175px');
  const neighbour=await page.locator('#stage [data-id="2"]').evaluate(node=>node.style.left);
  await page.locator('#propFont').fill('34');
  await page.locator('#propFont').press('Tab');
  await expect(page.locator('#stage [data-id="1"]')).toHaveCSS('font-size','34px');
  await page.locator('#lock').click();
  await expect(page.locator('#stage [data-id="1"]')).toHaveClass(/locked/);
  expect(await page.locator('#stage [data-id="2"]').evaluate(node=>node.style.left)).toBe(neighbour);
  await page.locator('#lock').click();
  await expect(page.locator('#stage [data-id="1"]')).not.toHaveClass(/locked/);
});
test('multiple selected objects move as one, retaining spacing',async({page})=>{
  await importScene(page);
  await page.locator('#layers [data-layer-id="1"]').click();
  await page.locator('#layers [data-layer-id="2"]').click({modifiers:['Shift']});
  await expect(page.locator('#stage [aria-selected=true]')).toHaveCount(2);
  const left=page.locator('#stage [data-id="1"]');
  const right=page.locator('#stage [data-id="2"]');
  const before=await Promise.all([left,right].map(node=>node.evaluate(n=>({x:parseInt(n.style.left),y:parseInt(n.style.top)}))));
  const rect=await left.boundingBox();
  await page.mouse.move(rect.x+28,rect.y+12);
  await page.mouse.down();await page.mouse.move(rect.x+66,rect.y+40,{steps:6});await page.mouse.up();
  const after=await Promise.all([left,right].map(node=>node.evaluate(n=>({x:parseInt(n.style.left),y:parseInt(n.style.top)}))));
  expect(after[0].x-before[0].x).toBeGreaterThan(20);
  expect(after[1].x-before[1].x).toBe(after[0].x-before[0].x);
  expect(after[1].y-before[1].y).toBe(after[0].y-before[0].y);
});
test('portable JSON export restores the validated scene',async({page})=>{
  await importScene(page);
  const pending=page.waitForEvent('download');
  await page.locator('#exportScene').click();
  const download=await pending;
  const original=fs.readFileSync(await download.path());
  const parsed=JSON.parse(original.toString('utf8'));
  expect(parsed.version).toBe(2);
  expect(parsed.objects).toHaveLength(3);
  await page.locator('#layers [data-layer-id="1"]').click();
  await page.locator('#remove').click();
  await expect(page.locator('#stage .scene-object')).toHaveCount(2);
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#sceneFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:original});
  await expect(page.locator('#stage .scene-object')).toHaveCount(3);
  await expect(page.locator('#status')).toContainText('Canvas restored from JSON');
});

test('alignment tools keep independent objects aligned and undoable',async({page})=>{
  await importScene(page);
  await page.locator('#layers [data-layer-id="1"]').click();
  await page.locator('#layers [data-layer-id="2"]').click({modifiers:['Shift']});
  const a=page.locator('#stage [data-id="1"]'),b=page.locator('#stage [data-id="2"]');
  const originalY=await b.evaluate(node=>parseInt(node.style.top));
  await page.locator('#alignLeft').click();
  const left=await a.evaluate(node=>node.style.left);
  await expect(b).toHaveCSS('left',left);
  await page.locator('#alignTop').click();
  const top=await a.evaluate(node=>node.style.top);
  await expect(b).toHaveCSS('top',top);
  await page.locator('#undo').click();
  expect(await b.evaluate(node=>parseInt(node.style.top))).toBe(originalY);
});
