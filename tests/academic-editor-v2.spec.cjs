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

test('double-click edits the text object directly and Undo restores prior wording',async({page})=>{
  await importScene(page);
  const target=page.locator('#stage [data-id="1"] .scene-content');
  await target.dblclick();
  await expect(target).toHaveAttribute('contenteditable','true');
  await target.fill('Updated science education title');
  await target.press('Escape');
  await expect(page.locator('#stage [data-id="1"] .scene-content')).toHaveText('Updated science education title');
  await page.locator('#undo').click();
  await expect(page.locator('#stage [data-id="1"] .scene-content')).toHaveText('Research overview');
});

test('imported links, emphasis and heading structure survive staging export safely',async({page})=>{
  const linked='<!doctype html><html><body><main><h2>Public research</h2>'+
    '<p>Read <a href="research.html">research notes</a> and '+
    '<em>science learning</em> together.</p>'+
    '<p>External <a href="https://doi.org/10.5555/example">DOI link</a>.</p>'+
    '</main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:linked
  }));
  await page.locator('#importPage').click();
  await expect(page.locator('#status')).toContainText('Imported');
  const rich=page.locator('#stage [data-id="2"] .scene-content');
  await expect(rich.locator('a[href="research.html"]')).toHaveText('research notes');
  await expect(rich.locator('em')).toHaveText('science learning');
  const pending=page.waitForEvent('download');
  await page.locator('#exportHtml').click();
  const exported=fs.readFileSync(await (await pending).path(),'utf8');
  expect(exported).toContain('<h2 class="item"');
  expect(exported).toContain('<a href="research.html">research notes</a>');
  expect(exported).toContain('<em>science learning</em>');
  expect(exported).toContain('rel="noopener noreferrer"');
  let posted;
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/editor-v2-previews/about.html',route=>{
    if(route.request().method()==='GET')return route.fulfill({status:404,body:'{}'});
    posted=JSON.parse(route.request().postData());
    return route.fulfill({status:201,body:'{}'});
  });
  await page.locator('#publish').click();
  await page.locator('#githubToken').fill('test-placeholder');
  await page.locator('#confirmPublish').click();
  await expect(page.locator('#status')).toContainText('Staging published');
  const staging=Buffer.from(posted.content,'base64').toString('utf8');
  expect(staging).toContain('<a href="../research.html">research notes</a>');
});
test('unsafe HTML inside a saved rich-text scene is not rendered or exported',async({page})=>{
  await importScene(page);
  await page.evaluate(()=>{
    const key='moon-academic-editor-v2:about.html';
    const json=JSON.parse(localStorage.getItem(key));
    json.objects[0].rich='<em>Allowed</em><script>window.polluted=1</script>'+
      '<img src=x onerror="window.polluted=1">'+
      '<a href="javascript:alert(1)" onclick="window.polluted=1">Blocked link</a>';
    localStorage.setItem(key,JSON.stringify(json));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  const element=page.locator('#stage [data-id="1"] .scene-content');
  await expect(element.locator('em')).toHaveText('Allowed');
  await expect(element.locator('script,img')).toHaveCount(0);
  await expect(element.locator('a[href]')).toHaveCount(0);
  expect(await page.evaluate(()=>window.polluted)).toBeUndefined();
  const pending=page.waitForEvent('download');await page.locator('#exportHtml').click();
  const exported=fs.readFileSync(await (await pending).path(),'utf8');
  expect(exported).not.toContain('onerror=');
  expect(exported).not.toContain('javascript:');
  expect(exported).not.toContain('<script>window.polluted');
});

test('coloured source sections import as independent editable background shapes',async({page})=>{
  const source='<!doctype html><html><body><main style="width:800px">'+
    '<section style="padding:24px;background-color:rgb(226,245,229)">'+
    '<h2>Inclusive biology</h2><p>Students examine classroom models.</p>'+
    '</section></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',body:source}));
  await page.locator('#importPage').click();
  await expect(page.locator('#status')).toContainText('Imported');
  const bg=page.locator('#stage [data-kind="shape"]');
  await expect(bg).toHaveCount(1);
  await expect(bg).toHaveCSS('background-color','rgb(226, 245, 229)');
  await expect(bg).toHaveCSS('border-top-style','none');
  await expect(page.locator('#stage [data-kind="text"]')).toHaveCount(2);
  const backgroundZ=Number(await bg.evaluate(node=>node.style.zIndex));
  const headingZ=Number(await page.locator('#stage [data-kind="text"]').first().evaluate(node=>node.style.zIndex));
  expect(backgroundZ).toBeLessThan(headingZ);
  await bg.click({position:{x:12,y:12}});
  await page.locator('#propBg').evaluate(node=>{
    node.value='#ddffdd';node.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(bg).toHaveCSS('background-color','rgb(221, 255, 221)');
});

test('a locked canvas object cannot be moved, deleted, or restyled',async({page})=>{
  await importScene(page);
  await page.locator('#layers [data-layer-id="1"]').click();
  const original=await page.locator('#stage [data-id="1"]').evaluate(node=>node.style.left);
  await page.locator('#lock').click();
  await expect(page.locator('#remove')).toBeDisabled();
  await expect(page.locator('#propX')).toBeDisabled();
  const before=await page.locator('#stage [data-id="1"]').boundingBox();
  await page.mouse.move(before.x+30,before.y+8);
  await page.mouse.down();
  await page.mouse.move(before.x+95,before.y+30,{steps:6});
  await page.mouse.up();
  await expect(page.locator('#stage [data-id="1"]')).toHaveCSS('left',original);
  await page.locator('#lock').click();
  await expect(page.locator('#remove')).toBeEnabled();
  await page.locator('#remove').click();
  await expect(page.locator('#stage [data-id="1"]')).toHaveCount(0);
  await page.locator('#undo').click();
  await expect(page.locator('#stage [data-id="1"]')).toHaveCount(1);
});

test('real Home, Research and Teaching pages import without source modification',async({page})=>{
  test.setTimeout(90000);
  await page.unroute('**/about.html');
  for(const source of ['index.html','research.html','teaching.html']){
    await page.locator('#page').selectOption(source);
    await page.locator('#importPage').click();
    await expect(page.locator('#status')).toContainText('Imported',{timeout:25000});
    const count=await page.locator('#stage .scene-object').count();
    expect(count).toBeGreaterThan(5);
    const saved=await page.evaluate(name=>JSON.parse(localStorage.getItem(
      'moon-academic-editor-v2:'+name)),source);
    expect(saved.page).toBe(source);
    expect(saved.objects.length).toBe(count);
    expect(saved.objects.every(object=>Number.isFinite(object.x)&&Number.isFinite(object.w))).toBe(true);
  }
});

test('comparison view keeps original and new draft separate',async({page})=>{
  await importScene(page);
  await page.locator('#compare').click();
  await expect(page.locator('#compareDialog')).toBeVisible();
  await expect(page.frameLocator('#originalFrame').locator('h2')).toHaveText('Research overview');
  await expect(page.frameLocator('#sceneFrame').locator('main h2')).toHaveText('Research overview');
  await page.locator('#closeCompare').click();
  await expect(page.locator('#compareDialog')).not.toBeVisible();
  await expect(page.locator('#stage [data-id="1"] .scene-content')).toHaveText('Research overview');
});

test('blank-canvas double click creates a text object at the clicked position',async({page})=>{
  await importScene(page);
  const stage=page.locator('#stage');
  await stage.dblclick({position:{x:55,y:450}});
  await expect(page.locator('#stage .scene-object')).toHaveCount(4);
  const newText=page.locator('#stage [data-kind="text"][aria-selected=true]');
  await expect(newText).toHaveCount(1);
  const editor=newText.locator('.scene-content');
  await expect(editor).toHaveAttribute('contenteditable','true');
  await editor.fill('New text on the page');
  await editor.press('Escape');
  await expect(page.locator('#stage [data-kind="text"]').last()).toContainText('New text on the page');
});
test('dropping an image file places an independent image onto the canvas',async({page})=>{
  await importScene(page);
  await page.locator('#stage').evaluate(stage=>{
    const data=new DataTransfer();
    const b64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9a1Z6sUAAAAASUVORK5CYII=';
    const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    data.items.add(new File([bytes],'drop-test.png',{type:'image/png'}));
    const rect=stage.getBoundingClientRect();
    stage.dispatchEvent(new DragEvent('drop',{
      bubbles:true,cancelable:true,dataTransfer:data,
      clientX:rect.left+90,clientY:rect.top+160
    }));
  });
  await expect(page.locator('#stage [data-kind="image"]')).toHaveCount(2);
  const dropped=page.locator('#stage [data-kind="image"]').last();
  await expect(dropped.locator('img')).toHaveAttribute('src',/^data:image\/png;base64,/);
  const position=await dropped.evaluate(node=>parseInt(node.style.left));
  expect(position).toBeGreaterThan(0);
});

test('visual image library inserts site assets and replaces selected pictures',async({page})=>{
  await importScene(page);
  await expect(page.locator('#imageLibrary button')).toHaveCount(1);
  await page.locator('#layers [data-layer-id="3"]').click();
  await page.locator('#propSrc').fill('assets/temporary-image.webp');
  await page.locator('#propSrc').press('Tab');
  await expect(page.locator('#stage [data-id="3"] img')).toHaveAttribute('src','assets/temporary-image.webp');
  await page.locator('#imageLibrary button').click();
  await expect(page.locator('#stage [data-id="3"] img')).toHaveAttribute('src','assets/profile-portrait.webp');
  await page.locator('#addText').click();
  await page.locator('#imageLibrary button').click();
  await expect(page.locator('#stage [data-kind="image"]')).toHaveCount(2);
  await expect(page.locator('#stage [data-kind="image"]').last().locator('img'))
    .toHaveAttribute('src','assets/profile-portrait.webp');
});
