const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const fixture='<!doctype html><html><head><style>main{margin:30px;width:950px;} h2{font:700 30px Georgia;}p{font:18px Georgia;} img{width:240px;height:160px;object-fit:contain}</style></head><body><main><h2>Research overview</h2><p>Students investigate scientific explanations together.</p><img src="assets/profile-portrait.webp" alt="Test portrait"></main></body></html>';
test.beforeEach(async({page})=>{
  // The public About URL now redirects to Contact. Add a synthetic page
  // option only to the isolated test HTML so historical fixture tests still
  // exercise three objects without changing the actual editor's page list.
  await page.route('**/editor-v2.html*',async route=>{
    const response=await route.fetch();
    const source=await response.text();
    const body=source.replace('<select id="page">',
      '<select id="page"><option value="about.html">About test fixture</option>');
    await route.fulfill({response,body});
  });
  await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
  // The real About URL now redirects to Contact. Mirror the local fixture
  // through the verified GitHub source endpoint used by Live Website mode.
  // This keeps the historic scene tests meaningful without pretending the
  // public repository still contains the retired About page.
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/about.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'isolated-about-test-fixture',
        encoding:'base64',content:Buffer.from(fixture).toString('base64')})}));
  await page.goto('http://127.0.0.1:8765/editor-v2.html?page=about.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('moon-academic-editor-v2:about.html'));
  await page.reload({waitUntil:'domcontentloaded'});
});
async function mockVerifiedSource(page,name,source){
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name+'*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'isolated-'+name+'-test-source',
        encoding:'base64',content:Buffer.from(source).toString('base64')})}));
}
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
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/editor-v2-previews/about.html*',route=>{
    if(route.request().method()==='GET')return route.fulfill({status:404,contentType:'application/json',body:'{}'});
    observed=JSON.parse(route.request().postData());return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({commit:{sha:'staging-test-commit'}})});
  });
  await page.locator('#publish').click();await expect(page.locator('#stagePath')).toHaveText('editor-v2-previews/about.html');
  await page.locator('#githubToken').fill('testing-token-only');await page.locator('#confirmPublish').click();
  await expect(page.locator('#status')).toContainText('GitHub confirmed staging preview');
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
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/editor-v2-previews/about.html*',route=>{
    if(route.request().method()==='GET')return route.fulfill({status:404,body:'{}'});
    posted=JSON.parse(route.request().postData());
    return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({commit:{sha:'staging-test-commit'}})});
  });
  await page.locator('#publish').click();
  await page.locator('#githubToken').fill('test-placeholder');
  await page.locator('#confirmPublish').click();
  await expect(page.locator('#status')).toContainText('GitHub confirmed staging preview');
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
  // A fresh page load defaults to Live Website mode; the scene is still
  // saved, but HTML scene export is intentionally a free-canvas action.
  await page.locator('#designMode').click();
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
  // The source comparison asks GitHub for the exact page revision.
  // This independent fixture must be served by both the local import
  // and the mocked GitHub Contents endpoint.
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/about.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'fixture-commit-123',
        encoding:'base64',content:Buffer.from(fixture).toString('base64')})}));
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

test('shape inspector switches rectangle to ellipse and line, including export',async({page})=>{
  await importScene(page);
  await page.locator('#addShape').click();
  const shape=page.locator('#stage [data-kind="shape"]').last();
  await expect(shape).toHaveCount(1);
  await page.locator('#propShapeKind').selectOption('ellipse');
  await expect(shape).toHaveCSS('border-radius','50%');
  await page.locator('#propShapeKind').selectOption('line');
  await expect(shape).toHaveClass(/line-shape/);
  await expect(shape).toHaveCSS('border-top-style','none');
  const pending=page.waitForEvent('download');
  await page.locator('#exportHtml').click();
  const output=fs.readFileSync(await (await pending).path(),'utf8');
  expect(output).toContain('item line-shape');
  expect(output).toContain('--shape-line-colour');
  await page.locator('#undo').click();
  await expect(shape).not.toHaveClass(/line-shape/);
  await expect(shape).toHaveCSS('border-radius','50%');
});

test('fit-to-text expands long paragraphs without moving neighbouring objects',async({page})=>{
  await importScene(page);
  await page.locator('#layers [data-layer-id="1"]').click();
  const heading=page.locator('#stage [data-id="1"]');
  const neighbour=page.locator('#stage [data-id="2"]');
  const untouched=await neighbour.evaluate(node=>node.getAttribute('style'));
  await page.locator('#propH').fill('24');
  await page.locator('#propH').press('Tab');
  const longText=Array.from({length:15},()=> 'Students revise scientific explanations from evidence.').join(' ');
  await page.locator('#propText').fill(longText);
  await page.locator('#propText').press('Tab');
  await page.locator('#fitText').click();
  const height=await heading.evaluate(node=>parseInt(node.style.height));
  expect(height).toBeGreaterThan(24);
  expect(await neighbour.evaluate(node=>node.getAttribute('style'))).toBe(untouched);
  await page.locator('#undo').click();
  expect(await heading.evaluate(node=>parseInt(node.style.height))).toBe(24);
});

test('line breaks inserted during inline editing survive save, reload and export',async({page})=>{
  await importScene(page);
  const content=page.locator('#stage [data-id="1"] .scene-content');
  await content.dblclick();
  await expect(content).toHaveAttribute('contenteditable','true');
  await content.evaluate(node=>{
    node.innerHTML='First line<div>Second line</div>';
    node.dispatchEvent(new Event('input',{bubbles:true}));
  });
  await content.press('Escape');
  await expect(page.locator('#stage [data-id="1"] .scene-content')).toContainText('First line');
  const pending=page.waitForEvent('download');
  await page.locator('#exportHtml').click();
  const html=fs.readFileSync(await (await pending).path(),'utf8');
  expect(html).toContain('First line<br>Second line');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#stage [data-id="1"] .scene-content')).toContainText('Second line');
});

test('image library is available without replacing or importing a saved page',async({page})=>{
  await expect(page.locator('#stage .scene-object')).toHaveCount(0);
  await expect(page.locator('#imageLibrary button')).toHaveCount(1,{timeout:12000});
  await page.locator('#designMode').click();
  await page.locator('#imageLibrary button').click();
  await expect(page.locator('#stage [data-kind="image"]')).toHaveCount(1);
  await expect(page.locator('#stage [data-kind="image"] img')).toHaveAttribute('src','assets/profile-portrait.webp');
  expect(await page.locator('#stage .scene-object').count()).toBe(1);
});

test('live website mode shows actual source CSS and complete content, separate from scene',async({page})=>{
  await expect(page.locator('#liveViewport')).toBeVisible();
  await expect(page.locator('#scrollspace')).toBeHidden();
  await expect(page.locator('#liveMode')).toHaveAttribute('aria-pressed','true');
  const original=page.frameLocator('#livePageFrame');
  await expect(original.locator('main h2')).toHaveText('Research overview');
  await expect(original.locator('main h2')).toHaveCSS('font-size','30px');
  await expect(original.locator('main p')).toContainText('Students investigate');
  await page.locator('#devicePreview').selectOption('phone');
  await expect(page.locator('#livePageFrame')).toHaveCSS('width','390px');
  await page.locator('#devicePreview').selectOption('tablet');
  await expect(page.locator('#livePageFrame')).toHaveCSS('width','768px');
  await page.locator('#devicePreview').selectOption('desktop');
  await expect(page.locator('#livePageFrame')).toHaveCSS('width','1160px');
  await expect(original.locator('main h2')).toHaveCSS('font-size','30px');
  await expect(page.locator('#stage .scene-object')).toHaveCount(0);
});
test('live text selection copies a separate object without altering the source',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main h2').click();
  await expect(page.locator('#copyLiveObject')).toBeEnabled();
  await page.locator('#copyLiveObject').click();
  await expect(page.locator('#scrollspace')).toBeVisible();
  await expect(page.locator('#liveViewport')).toBeHidden();
  await expect(page.locator('#stage [data-kind="text"]')).toHaveCount(1);
  await expect(page.locator('#stage [data-kind="text"] .scene-content')).toHaveText('Research overview');
  await page.locator('#liveMode').click();
  await expect(live.locator('main h2')).toHaveText('Research overview');
  await expect(live.locator('main h2')).toHaveCSS('font-size','30px');
  await expect(page.locator('#stage [data-kind="text"]')).toHaveCount(1);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveViewport')).toBeVisible();
  await page.locator('#designMode').click();
  await expect(page.locator('#stage [data-kind="text"]')).toHaveCount(1);
});
test('new page selection loads the correct live original, not a stale canvas',async({page})=>{
  const researchFixture='<!doctype html><html><body><main><h1>Research page original</h1></main></body></html>';
  await page.route('**/research.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:researchFixture
  }));
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/research.html*',
    route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({type:'file',sha:'isolated-research-test-fixture',
        encoding:'base64',content:Buffer.from(researchFixture).toString('base64')})}));
  await page.locator('#page').selectOption('research.html');
  await expect(page.frameLocator('#livePageFrame').locator('main h1')).toHaveText('Research page original');
  await expect(page.locator('#liveViewport')).toBeVisible();
  await expect(page.locator('#stage .scene-object')).toHaveCount(0);
});

test('live text edit preserves source styling, reloads from draft, and can be reverted',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main h2').click();
  await expect(page.locator('#liveTextControls')).toBeVisible();
  await page.locator('#editLiveText').click();
  await expect(live.locator('main h2')).toHaveAttribute('contenteditable','true');
  await live.locator('main h2').fill('Edited heading from original webpage');
  await page.locator('#saveLiveText').click();
  await expect(live.locator('main h2')).toHaveText('Edited heading from original webpage');
  await expect(live.locator('main h2')).toHaveCSS('font-size','30px');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(live.locator('main h2')).toHaveText('Edited heading from original webpage');
  const source=await page.evaluate(()=>fetch('/about.html').then(res=>res.text()));
  expect(source).toContain('Research overview');
  expect(source).not.toContain('Edited heading from original webpage');
  await live.locator('main h2').click();
  await page.locator('#revertLiveElement').click();
  await expect(live.locator('main h2')).toHaveText('Research overview');
});
test('source-preserving HTML export keeps original CSS and rich structure',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main h2').click();
  await page.locator('#editLiveText').click();
  await live.locator('main h2').fill('Original-layout title edited');
  await page.locator('#saveLiveText').click();
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const html=fs.readFileSync(await (await pending).path(),'utf8');
  expect(html).toContain('Original-layout title edited');
  expect(html).toContain('main{margin:30px;width:950px;}');
  expect(html).not.toContain('<base ');
  expect(html).toContain('Students investigate scientific explanations together.');
  await page.locator('#previewLiveEdits').click();
  const preview=page.frameLocator('#previewFrame');
  await expect(preview.locator('main h2')).toHaveText('Original-layout title edited');
  await expect(preview.locator('main h2')).toHaveCSS('font-size','30px');
});
test('original-layout image edit publishes to source-only staging path',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main img').click();
  await expect(page.locator('#liveImageControls')).toBeVisible();
  await page.locator('#liveImageSrc').fill('assets/replaced-photo.webp');
  await page.locator('#liveImageAlt').fill('Replacement description');
  await page.locator('#applyLiveImage').click();
  await expect(live.locator('main img')).toHaveAttribute('src','assets/replaced-photo.webp');
  let sent;
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/editor-v2-previews/source-about.html*',route=>{
    if(route.request().method()==='GET')return route.fulfill({status:404,body:'{}'});
    sent=JSON.parse(route.request().postData());
    return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({commit:{sha:'staging-test-commit'}})});
  });
  await page.locator('#publish').click();
  await page.locator('#publishTarget').selectOption('staging');
  await expect(page.locator('#stagePath')).toHaveText('editor-v2-previews/source-about.html');
  await page.locator('#githubToken').fill('staging-test-token');
  await page.locator('#confirmPublish').click();
  await expect(page.locator('#status')).toContainText('GitHub confirmed staging preview');
  const published=Buffer.from(sent.content,'base64').toString('utf8');
  expect(published).toContain('src="https://gmoon-code.github.io/assets/replaced-photo.webp"');
  expect(published).toContain('alt="Replacement description"');
  expect(published).toContain('main{margin:30px;width:950px;}');
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('staging-test-token');
});

test('live preview retains true 100vh viewport height and scrolls long pages',async({page})=>{
  const source='<!doctype html><html><body><main>'+
    '<h2>Viewport height test</h2><section id="fullHero" style="height:100vh;background:lavender">Hero</section>'+
    '<p id="afterHero">Content after first viewport</p></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await mockVerifiedSource(page,'about.html',source);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  await expect(live.locator('#fullHero')).toBeVisible();
  await expect(page.locator('#livePageFrame')).toHaveCSS('height','900px');
  const size=await live.locator('#fullHero').evaluate(node=>node.getBoundingClientRect().height);
  expect(size).toBeGreaterThanOrEqual(895);
  expect(size).toBeLessThanOrEqual(905);
  const scrolled=await live.locator('#afterHero').evaluate(node=>{
    window.scrollTo(0,document.body.scrollHeight);
    return window.scrollY;
  });
  expect(scrolled).toBeGreaterThan(0);
  await page.locator('#devicePreview').selectOption('phone');
  await expect(page.locator('#livePageFrame')).toHaveCSS('width','390px');
  await expect(page.locator('#livePageFrame')).toHaveCSS('height','844px');
  const phoneHeroHeight=await live.locator('#fullHero').evaluate(node=>node.getBoundingClientRect().height);
  expect(phoneHeroHeight).toBeGreaterThanOrEqual(839);
  expect(phoneHeroHeight).toBeLessThanOrEqual(849);
});

test('live image library replaces source image without creating a canvas object',async({page})=>{
  const site='<!doctype html><html><body><main>'+
    '<img src="assets/first.webp" alt="First" width="180" height="120">'+
    '<img src="assets/second.webp" alt="Second" width="180" height="120">'+
    '</main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:site
  }));
  await mockVerifiedSource(page,'about.html',site);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main img').first().click();
  await expect(page.locator('#liveImageControls')).toBeVisible();
  await expect(page.locator('#imageLibrary button')).toHaveCount(2);
  await page.locator('#imageLibrary button').nth(1).click();
  await expect(live.locator('main img').first()).toHaveAttribute('src','assets/second.webp');
  await expect(page.locator('#liveViewport')).toBeVisible();
  await expect(page.locator('#stage .scene-object')).toHaveCount(0);
  await expect(page.locator('#liveEditCount')).toContainText('1 saved edit');
});

test('top-bar preview and compare show faithful original-layout edits in live mode',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main h2').click();
  await page.locator('#editLiveText').click();
  await live.locator('main h2').fill('Live mode preview heading');
  await page.locator('#saveLiveText').click();
  await page.locator('#preview').click();
  const preview=page.frameLocator('#previewFrame');
  await expect(preview.locator('main h2')).toHaveText('Live mode preview heading');
  await expect(preview.locator('main h2')).toHaveCSS('font-size','30px');
  await page.locator('#closePreview').click();
  await page.locator('#compare').click();
  await expect(page.frameLocator('#originalFrame').locator('main h2')).toHaveText('Research overview');
  await expect(page.frameLocator('#sceneFrame').locator('main h2')).toHaveText('Live mode preview heading');
  await page.locator('#closeCompare').click();
});

test('real academic pages load with source styles inside the faithful live workspace',async({page})=>{
  test.setTimeout(90000);
  for(const file of ['index.html','research.html','teaching.html','pungmul.html']){
    await page.locator('#page').selectOption(file);
    const frame=page.frameLocator('#livePageFrame');
    await expect(frame.locator('main')).toBeVisible({timeout:20000});
    const state=await frame.locator('main').evaluate(node=>({
      text:node.textContent.trim().slice(0,300),
      width:node.getBoundingClientRect().width,
      styles:[...document.styleSheets].length
    }));
    expect(state.text.length).toBeGreaterThan(30);
    expect(state.width).toBeGreaterThan(250);
    expect(state.styles).toBeGreaterThan(0);
    await expect(page.locator('#liveViewport')).toBeVisible();
    await expect(page.locator('#scrollspace')).toBeHidden();
  }
});

test('Focus page expands actual live website without changing its viewport or draft',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await expect(live.locator('main h2')).toHaveText('Research overview');
  const before=await page.locator('#livePageShell').boundingBox();
  await page.locator('#focusPage').click();
  await expect(page.locator('#focusPage')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.left-panel')).toBeHidden();
  await expect(page.locator('.right-panel')).toBeHidden();
  const enlarged=await page.locator('#livePageShell').boundingBox();
  expect(enlarged.width).toBeGreaterThan(before.width+120);
  await expect(page.locator('#livePageFrame')).toHaveCSS('width','1160px');
  await expect(live.locator('main h2')).toHaveCSS('font-size','30px');
  await page.locator('#devicePreview').selectOption('phone');
  await expect(page.locator('#livePageFrame')).toHaveCSS('width','390px');
  await page.locator('#focusPage').click();
  await expect(page.locator('.left-panel')).toBeVisible();
  await expect(page.locator('.right-panel')).toBeVisible();
  await expect(live.locator('main h2')).toHaveText('Research overview');
});

test('real website rendering matches standalone pages at desktop and phone widths',async({page,browser})=>{
  test.setTimeout(90000);
  const root='http://127.0.0.1:8765/';
  await page.unroute('**/about.html');
  const summary=async handle=>handle.evaluate(node=>{
    const doc=node.ownerDocument;
    const main=doc.querySelector('main');
    const heading=main?.querySelector('h1,h2');
    const css=heading?doc.defaultView.getComputedStyle(heading):null;
    return {
      title:doc.title,
      heading:heading?.textContent?.replace(/\s+/g,' ').trim().slice(0,130),
      fontSize:css?.fontSize,
      fontFamily:css?.fontFamily,
      colour:css?.color,
      imageCount:main?.querySelectorAll('img').length||0,
      viewportWidth:doc.defaultView.innerWidth,
      viewportHeight:doc.defaultView.innerHeight
    };
  });
  for(const filename of ['index.html','research.html','teaching.html']){
    for(const device of [{label:'desktop',width:1160,height:900},{label:'phone',width:390,height:844}]){
      const direct=await browser.newPage({viewport:{width:device.width,height:device.height}});
      try{
        await direct.goto(root+filename,{waitUntil:'load'});
        await direct.evaluate(()=>document.fonts?.ready);
        await page.locator('#page').selectOption(filename);
        await page.locator('#devicePreview').selectOption(device.label);
        const iframe=page.frameLocator('#livePageFrame');
        await iframe.locator('main').waitFor({state:'attached',timeout:15000});
        await iframe.locator('body').evaluate(node=>node.ownerDocument.fonts?.ready);
        const actual=await direct.locator('html').evaluate(node=>{
          const doc=node.ownerDocument,main=doc.querySelector('main'),h=main?.querySelector('h1,h2');
          const css=h?doc.defaultView.getComputedStyle(h):null;
          return {title:doc.title,heading:h?.textContent?.replace(/\s+/g,' ').trim().slice(0,130),
            fontSize:css?.fontSize,fontFamily:css?.fontFamily,colour:css?.color,
            imageCount:main?.querySelectorAll('img').length||0,
            viewportWidth:doc.defaultView.innerWidth,viewportHeight:doc.defaultView.innerHeight};
        });
        // The frame can briefly still contain the previous page while
        // the selected GitHub source is loading. Compare once its actual
        // contents, fonts and viewport match the standalone page.
        await expect.poll(()=>summary(iframe.locator('html')),{timeout:15000})
          .toEqual(actual);
      }finally{await direct.close();}
    }
  }
});

test('internal links in live site navigate pages through editor without stale iframe state',async({page})=>{
  const aboutSource='<!doctype html><html><body><header><a href="research.html">Research nav</a></header>'+
    '<main><h1>Original about page</h1><a href="#section">Jump down</a>'+
    '<p id="section">About section</p></main></body></html>';
  const researchSource='<!doctype html><html><body><main><h1>Destination research page</h1></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:aboutSource
  }));
  await page.route('**/research.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:researchSource
  }));
  await mockVerifiedSource(page,'about.html',aboutSource);
  await mockVerifiedSource(page,'research.html',researchSource);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  await expect(live.locator('main h1')).toHaveText('Original about page');
  await live.locator('header a').click();
  await expect(page.locator('#page')).toHaveValue('research.html');
  await expect(live.locator('main h1')).toHaveText('Destination research page');
  await expect(page.locator('#liveViewport')).toBeVisible();
});

test('source-preserving export keeps reference anchors local and resolves site assets',async({page})=>{
  const original='<!doctype html><html><head>'+
    '<link rel="stylesheet" href="styles-20261013.css">'+
    '<style>.photo{background-image:url(assets/portrait.webp)}</style>'+
    '</head><body><main><p><a href="#citation-1">See citation</a></p>'+
    '<p id="citation-1">Published reference</p>'+
    '<img src="assets/portrait.webp" alt="Portrait"></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:original
  }));
  await mockVerifiedSource(page,'about.html',original);
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const html=fs.readFileSync(await (await pending).path(),'utf8');
  expect(html).toContain('href="#citation-1"');
  expect(html).not.toContain('<base ');
  expect(html).toContain('href="https://gmoon-code.github.io/styles-20261013.css"');
  expect(html).toContain('src="https://gmoon-code.github.io/assets/portrait.webp"');
  expect(html).toContain('url(https://gmoon-code.github.io/assets/portrait.webp)');
});

test('live-page asset status identifies missing original resources',async({page})=>{
  const source='<!doctype html><html><head><link rel="stylesheet" href="missing-editor-test.css"></head>'+
    '<body><main><h1>Resource test</h1>'+
    '<img src="assets/missing-editor-test-picture.webp" alt="Missing"></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await mockVerifiedSource(page,'about.html',source);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  await expect(live.locator('main h1')).toHaveText('Resource test');
  await expect(page.locator('#liveAssetStatus')).toContainText('GitHub main source verified');
  await expect(page.locator('#liveAssetStatus')).toContainText('missing image');
  await expect(page.locator('#liveAssetStatus')).toHaveClass(/has-warning/);
});

test('live text in progress is saved when switching modes, reloading or changing pages',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main h2').click();
  await page.locator('#editLiveText').click();
  await live.locator('main h2').fill('Draft saved on mode change');
  await page.locator('#designMode').click();
  await expect(page.locator('#scrollspace')).toBeVisible();
  await page.locator('#liveMode').click();
  await expect(live.locator('main h2')).toHaveText('Draft saved on mode change');
  await live.locator('main h2').click();
  await page.locator('#editLiveText').click();
  await live.locator('main h2').fill('Draft saved on reload');
  await page.locator('#reloadLive').click();
  await expect(live.locator('main h2')).toHaveText('Draft saved on reload');
  const researchSource='<!doctype html><html><body><main><h1>Research</h1></main></body></html>';
  await page.route('**/research.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:researchSource
  }));
  await mockVerifiedSource(page,'research.html',researchSource);
  await live.locator('main h2').click();
  await page.locator('#editLiveText').click();
  await live.locator('main h2').fill('Draft saved on navigation');
  await page.locator('#page').selectOption('research.html');
  await expect(live.locator('main h1')).toHaveText('Research');
  await page.locator('#page').selectOption('about.html');
  await expect(live.locator('main h2')).toHaveText('Draft saved on navigation');
});

test('direct movement on actual webpage changes only selected text and supports undo',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const paragraph=live.locator('main p').first(),heading=live.locator('main h2');
  await paragraph.click();
  const before=await paragraph.boundingBox();
  const headingBefore=await heading.boundingBox();
  const grip=live.locator('#moon-v2-live-overlay .moon-v2-move');
  await expect(grip).toBeVisible();
  const box=await grip.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+38,box.y+box.height/2+27,{steps:8});
  await page.mouse.up();
  const moved=await paragraph.boundingBox();
  expect(moved.x).toBeGreaterThan(before.x+20);
  expect(moved.y).toBeGreaterThan(before.y+15);
  const headingAfter=await heading.boundingBox();
  expect(Math.abs(headingAfter.x-headingBefore.x)).toBeLessThan(1);
  expect(Math.abs(headingAfter.y-headingBefore.y)).toBeLessThan(1);
  await expect(page.locator('#liveEditCount')).toContainText('1 saved edit');
  await page.locator('#undo').click();
  const undone=await paragraph.boundingBox();
  expect(Math.abs(undone.x-before.x)).toBeLessThan(1);
  await page.locator('#redo').click();
  const redone=await paragraph.boundingBox();
  expect(redone.x).toBeGreaterThan(before.x+20);
  await page.reload();
  const retained=await live.locator('main p').first().boundingBox();
  expect(retained.x).toBeGreaterThan(before.x+20);
});
test('direct live image resizing preserves neighbour positions and exports geometry',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const img=live.locator('main img').first();
  const heading=live.locator('main h2');
  await img.click();
  const start=await img.boundingBox();
  const headingStart=await heading.boundingBox();
  const handle=live.locator('#moon-v2-live-overlay [data-direction="se"]');
  await expect(handle).toBeVisible();
  const grip=await handle.boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
  await page.mouse.down();
  await page.mouse.move(grip.x+grip.width/2+55,grip.y+grip.height/2+36,{steps:8});
  await page.mouse.up();
  const after=await img.boundingBox();
  expect(after.width).toBeGreaterThan(start.width+25);
  expect(after.height).toBeGreaterThan(start.height+15);
  const headingEnd=await heading.boundingBox();
  expect(Math.abs(headingEnd.y-headingStart.y)).toBeLessThan(1);
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const html=fs.readFileSync(await (await pending).path(),'utf8');
  expect(html).toContain('id="moon-v2-live-layout"');
  expect(html).toContain('scale:');
  expect(html).toContain('@media (min-width:1025px)');
  await page.reload();
  const retained=await live.locator('main img').first().boundingBox();
  expect(retained.width).toBeGreaterThan(start.width+25);
});
test('device-specific live positions do not spill into phone or tablet layouts',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main h2').click();
  await page.locator('#liveMoveX').fill('80');
  await page.locator('#liveMoveX').press('Tab');
  await expect(page.locator('#liveMoveX')).toHaveValue('80');
  const desktopValue=await live.locator('main h2').evaluate(node=>
    getComputedStyle(node).translate);
  expect(desktopValue).toContain('80px');
  await page.locator('#devicePreview').selectOption('phone');
  await expect(page.locator('#liveMoveX')).toHaveValue('0');
  await page.locator('#liveMoveX').fill('22');
  await page.locator('#liveMoveX').press('Tab');
  await expect(page.locator('#liveMoveX')).toHaveValue('22');
  await page.locator('#devicePreview').selectOption('tablet');
  await expect(page.locator('#liveMoveX')).toHaveValue('0');
  await page.locator('#devicePreview').selectOption('desktop');
  await expect(page.locator('#liveMoveX')).toHaveValue('80');
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const html=fs.readFileSync(await (await pending).path(),'utf8');
  expect(html).toContain('@media (max-width:700px)');
  expect(html).toContain('@media (min-width:1025px)');
  expect(html).toContain('translate:80px 0px!important');
  expect(html).toContain('translate:22px 0px!important');
});

test('arrow keys nudge live text and reset position only for active device',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const paragraph=live.locator('main p').first();
  await paragraph.click();
  const original=await paragraph.boundingBox();
  await paragraph.press('ArrowRight');
  await paragraph.press('Shift+ArrowDown');
  await expect(page.locator('#liveMoveX')).toHaveValue('1');
  await expect(page.locator('#liveMoveY')).toHaveValue('10');
  const nudged=await paragraph.boundingBox();
  expect(nudged.x).toBeGreaterThan(original.x);
  expect(nudged.y).toBeGreaterThan(original.y+5);
  await page.locator('#devicePreview').selectOption('phone');
  await expect(page.locator('#liveMoveX')).toHaveValue('0');
  await page.locator('#devicePreview').selectOption('desktop');
  await page.locator('#resetLiveLayout').click();
  await expect(page.locator('#liveMoveX')).toHaveValue('0');
  await expect(page.locator('#liveMoveY')).toHaveValue('0');
  const reset=await paragraph.boundingBox();
  expect(Math.abs(reset.x-original.x)).toBeLessThan(1);
  expect(Math.abs(reset.y-original.y)).toBeLessThan(1);
});

test('moving a real homepage image preserves its pre-existing translation',async({page})=>{
  test.setTimeout(25000);
  await page.locator('#page').selectOption('index.html');
  const live=page.frameLocator('#livePageFrame');
  const image=live.locator('main img[src="assets/pungmul-stage.webp"]').first();
  await image.scrollIntoViewIfNeeded();
  await image.click();
  const beforeTranslate=await image.evaluate(node=>getComputedStyle(node).translate);
  await page.locator('#liveMoveX').fill('20');
  await page.locator('#liveMoveX').press('Tab');
  const afterTranslate=await image.evaluate(node=>getComputedStyle(node).translate);
  // The CSS translation is measured in website coordinates, independent
  // of editor zoom, automatic iframe fitting and page scroll changes.
  const x=value=>value==="none"?0:parseFloat(value.split(" ")[0]);
  expect(Math.abs((x(afterTranslate)-x(beforeTranslate))-20)).toBeLessThan(1.2);
});

test('live text resize handles change natural box dimensions without stretching glyphs',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const title=live.locator('main h2').first(),neighbour=live.locator('main p').first();
  const before=await title.boundingBox(),neighbourBefore=await neighbour.boundingBox();
  await title.click();
  const handle=live.locator('#moon-v2-live-overlay [data-direction="se"]');
  await expect(handle).toBeVisible();
  const box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+45,box.y+box.height/2+18,{steps:7});
  await page.mouse.up();
  const after=await title.boundingBox(),neighbourAfter=await neighbour.boundingBox();
  expect(after.width).toBeGreaterThan(before.width+15);
  expect(after.height).toBeGreaterThan(before.height+8);
  expect(Math.abs(neighbourBefore.x-neighbourAfter.x)).toBeLessThan(1.5);
  expect(neighbourAfter.y).toBeGreaterThan(neighbourBefore.y+5);
  // Width and height are natural CSS dimensions, not glyph distortion.
  await expect(page.locator('#liveScaleX')).toHaveValue('100');
  await expect(page.locator('#liveScaleY')).toHaveValue('100');
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const html=fs.readFileSync(await (await pending).path(),'utf8');
  expect(html).toContain('@media (min-width:1025px)');
  expect(html).toContain('width:');
  expect(html).toContain('height:');
  await expect(page.locator('#undo')).toBeEnabled();
  await page.locator('#undo').click();
  const undone=await live.locator('main h2').first().boundingBox();
  expect(Math.abs(undone.width-before.width)).toBeLessThan(1);
  await page.locator('#redo').click();
  const redone=await live.locator('main h2').first().boundingBox();
  expect(redone.width).toBeGreaterThan(before.width+15);
  await page.reload({waitUntil:'domcontentloaded'});
  const retained=await live.locator('main h2').first().boundingBox();
  expect(retained.width).toBeGreaterThan(before.width+15);
});
test('numeric text width changes its natural box size and is isolated by device',async({page})=>{
  const live=page.frameLocator('#livePageFrame'),heading=live.locator('main h2').first();
  await heading.click();
  const original=await heading.evaluate(node=>node.getBoundingClientRect().width);
  const width=Math.round(original+80);
  await page.locator('#liveTextBoxWidth').fill(String(width));
  await page.locator('#liveTextBoxWidth').press('Tab');
  await expect(heading).toHaveCSS('width',width+'px');
  await page.locator('#devicePreview').selectOption('phone');
  const phone=await heading.evaluate(node=>node.getBoundingClientRect().width);
  expect(Math.abs(phone-width)).toBeGreaterThan(15);
  await page.locator('#devicePreview').selectOption('desktop');
  await expect(page.locator('#liveTextBoxWidth')).toHaveValue(String(width));
  await page.locator('#liveResetTextDimensions').click();
  const restored=await heading.evaluate(node=>node.getBoundingClientRect().width);
  expect(Math.abs(restored-original)).toBeLessThan(2);
});

test('selecting and moving a real website section preserves nested links and HTML on staging',async({page})=>{
  const fixture='<!doctype html><html><body><main>'+
    '<section class="research-card" style="padding:25px;background:#edf6e8">'+
    '<h2>Whole card</h2><p>Text and <em>emphasis</em> remain intact.</p>'+
    '<a href="#citation">Read reference</a><img src="assets/photo.webp" alt="Illustration">'+
    '</section><p id="citation">A linked reference.</p></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:fixture
  }));
  await mockVerifiedSource(page,'about.html',fixture);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  const card=live.locator('main section.research-card');
  await live.locator('main section h2').click({modifiers:['Alt']});
  await expect(live.locator('#moon-v2-live-overlay [data-direction="se"]')).toBeVisible();
  await expect(page.locator('#liveTextControls')).toBeHidden();
  await expect(page.locator('#liveImageControls')).toBeHidden();
  await page.locator('#liveMoveX').fill('75');
  await page.locator('#liveMoveX').press('Tab');
  const style=await card.evaluate(node=>getComputedStyle(node).translate);
  expect(style).toContain('75px');
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const output=fs.readFileSync(await (await pending).path(),'utf8');
  expect(output).toContain('<section class="research-card"');
  expect(output).toContain('<em>emphasis</em>');
  expect(output).toContain('href="#citation"');
  expect(output).toContain('id="moon-v2-live-layout"');
  await page.locator('#resetLiveLayout').click();
  await expect(page.locator('#liveEditCount')).toContainText('No saved live-page edits');
  await page.reload();
  await expect(live.locator('main section h2')).toHaveText('Whole card');
});

test('faithful live text colour and font editing preserves document content and supports Undo',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const heading=live.locator('main h2');
  await heading.click();
  const original=await heading.evaluate(node=>({
    font:getComputedStyle(node).fontFamily,color:getComputedStyle(node).color
  }));
  await page.locator('#liveFontFamily').selectOption('Arial, sans-serif');
  await expect(heading).toHaveCSS('font-family','Arial, sans-serif');
  await page.locator('#liveTextColour').evaluate(node=>{
    node.value='#bb3377';node.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(heading).toHaveCSS('color','rgb(187, 51, 119)');
  await expect(heading).toHaveText('Research overview');
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const exported=fs.readFileSync(await (await pending).path(),'utf8');
  expect(exported).toContain('font-family:Arial, sans-serif!important');
  expect(exported).toContain('color:#bb3377!important');
  await page.locator('#undo').click();
  await expect(heading).toHaveCSS('color',original.color);
  await page.locator('#redo').click();
  await expect(heading).toHaveCSS('color','rgb(187, 51, 119)');
  await page.reload();
  await expect(live.locator('main h2')).toHaveCSS('color','rgb(187, 51, 119)');
});
test('whole-section background changes keep nested markup and reset cleanly',async({page})=>{
  const fixture='<!doctype html><html><body><main>'+
    '<section class="study" style="padding:15px"><h2>Study</h2>'+
    '<p>Evidence and <a href="#ref">references</a></p></section>'+
    '<p id="ref">Citation remains.</p></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
  await mockVerifiedSource(page,'about.html',fixture);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  const section=live.locator('main section.study');
  await live.locator('main section h2').click({modifiers:['Alt']});
  await expect(page.locator('#liveAppearanceControls')).toBeVisible();
  await page.locator('#liveBackgroundColour').evaluate(node=>{
    node.value='#ddeeff';node.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(section).toHaveCSS('background-color','rgb(221, 238, 255)');
  await page.locator('#resetLiveAppearance').click();
  await expect(section).not.toHaveCSS('background-color','rgb(221, 238, 255)');
  await expect(page.locator('#liveEditCount')).toContainText('No saved live-page edits');
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const exported=fs.readFileSync(await (await pending).path(),'utf8');
  expect(exported).toContain('href="#ref"');
  expect(exported).toContain('Evidence and');
});

test('style-only changes preserve original paragraph spans, classes and hyperlinks',async({page})=>{
  const source='<!doctype html><html><body><main>'+
    '<p class="science" data-source="published">' +
    'Evidence from <span class="technical-label" data-term="biotic">biotic</span> interactions '+
    '<a class="citation" href="#source-1" data-reference="key1">[1]</a>.</p>'+
    '<p id="source-1">Reference</p></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await mockVerifiedSource(page,'about.html',source);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  const para=live.locator('main p.science');
  await para.click({position:{x:7,y:8}});
  await page.locator('#liveMoveX').fill('33');
  await page.locator('#liveMoveX').press('Tab');
  await page.locator('#liveTextColour').evaluate(node=>{
    node.value='#336699';node.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(para.locator('span[data-term="biotic"]')).toHaveText('biotic');
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const exported=fs.readFileSync(await (await pending).path(),'utf8');
  expect(exported).toContain('class="technical-label" data-term="biotic"');
  expect(exported).toContain('class="citation" href="#source-1" data-reference="key1"');
  expect(exported).toContain('data-source="published"');
  expect(exported).toContain('color:#336699!important');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(live.locator('main p.science span.technical-label')).toHaveText('biotic');
});

test('reflow text box changes line wrapping while preserving reserved flow footprint',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const heading=live.locator('main h2').first();
  const paragraph=live.locator('main p').first();
  const neighbourBefore=await paragraph.boundingBox();
  await heading.click();
  await expect(page.locator('#liveTextReflowControls')).toBeVisible();
  await expect(page.locator('#liveTextBoxWidth')).toBeEnabled();
  const beforeWidth=Number(await page.locator('#liveTextBoxWidth').inputValue());
  await page.locator('#liveTextBoxWidth').fill('150');
  await page.locator('#liveTextBoxWidth').press('Tab');
  const currentWidth=await heading.evaluate(node=>node.offsetWidth);
  expect(currentWidth).toBe(150);
  expect(currentWidth).toBeLessThan(beforeWidth);
  const neighbourAfter=await paragraph.boundingBox();
  expect(neighbourAfter.y).toBeGreaterThanOrEqual(neighbourBefore.y);
  const font=await heading.evaluate(node=>getComputedStyle(node).fontSize);
  expect(font).toBe('30px');
  await expect(page.locator('#liveResetTextDimensions')).toBeEnabled();
  await expect(page.locator('#undo')).toBeEnabled();
  await page.locator('#undo').click();
  await expect(live.locator('main h2')).not.toHaveCSS('width','150px');
  await page.locator('#redo').click();
  await expect(live.locator('main h2')).toHaveCSS('width','150px');
  const pending=page.waitForEvent('download');
  await page.locator('#exportLiveEdits').click();
  const html=fs.readFileSync(await (await pending).path(),'utf8');
  expect(html).toContain('width:150px!important');
  expect(html).toContain('box-sizing:border-box!important');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(live.locator('main h2')).toHaveCSS('width','150px');
});
test('reflow width and height handles are independent for desktop and mobile',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const title=live.locator('main h2').first();
  await title.click();
  const grip=live.locator('#moon-v2-live-overlay [data-direction="e"]');
  await expect(grip).toBeVisible();
  const before=Number(await page.locator('#liveTextBoxWidth').inputValue());
  const box=await grip.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2-70,box.y+box.height/2,{steps:7});
  await page.mouse.up();
  const narrowed=Number(await page.locator('#liveTextBoxWidth').inputValue());
  expect(narrowed).toBeLessThan(before-30);
  await page.locator('#devicePreview').selectOption('phone');
  await expect(page.locator('#liveTextBoxWidth')).toBeEnabled();
  await page.locator('#liveTextBoxWidth').fill('245');
  await page.locator('#liveTextBoxWidth').press('Tab');
  await page.locator('#devicePreview').selectOption('desktop');
  await expect(page.locator('#liveTextBoxWidth')).toHaveValue(String(narrowed));
  await page.locator('#devicePreview').selectOption('phone');
  await expect(page.locator('#liveTextBoxWidth')).toHaveValue('245');
});
test('restore natural text size preserves the previous visual position',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main h2').click();
  const original=await live.locator('main h2').evaluate(node=>node.getBoundingClientRect().width);
  await page.locator('#liveMoveX').fill('31');
  await page.locator('#liveMoveX').press('Tab');
  await page.locator('#liveTextBoxWidth').fill('120');
  await page.locator('#liveTextBoxWidth').press('Tab');
  await expect(live.locator('main h2')).toHaveCSS('width','120px');
  await page.locator('#liveResetTextDimensions').click();
  const restored=await live.locator('main h2').evaluate(node=>node.getBoundingClientRect().width);
  expect(Math.abs(restored-original)).toBeLessThan(2);
  await expect(page.locator('#liveMoveX')).toHaveValue('31');
  await page.locator('#undo').click();
  await expect(live.locator('main h2')).toHaveCSS('width','120px');
});

test('live drag snaps to a nearby edge with temporary alignment guides',async({page})=>{
  const source='<!doctype html><html><head><style>'+
    'main{padding:95px 20px}p{font:18px Arial;width:100px;height:35px}'+
    '.first{margin:0}.second{margin:10px 0 0 200px}'+
    '</style></head><body><main>'+
    '<p class="first">First box</p><p class="second">Second box</p>'+
    '</main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await mockVerifiedSource(page,'about.html',source);
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  const first=live.locator('main p.first'),second=live.locator('main p.second');
  await first.click();
  await page.locator('#liveMoveX').fill('194');
  await page.locator('#liveMoveX').press('Tab');
  const move=live.locator('#moon-v2-live-overlay .moon-v2-move');
  const box=await move.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+4,box.y+box.height/2,{steps:7});
  await expect(live.locator('#moon-v2-snap-x')).toBeVisible();
  await page.mouse.up();
  const finalPosition=await first.boundingBox(),reference=await second.boundingBox();
  expect(Math.abs(finalPosition.x-reference.x)).toBeLessThan(1.5);
  await expect(live.locator('#moon-v2-snap-x')).toHaveCount(0);
  await expect(live.locator('main p.second')).toHaveText('Second box');
});
test('holding Alt disables live drag snapping and leaves guides hidden',async({page})=>{
  const source='<!doctype html><html><head><style>'+
    'main{padding:95px 20px}p{font:18px Arial;width:100px;height:35px}'+
    '.first{margin:0}.second{margin:10px 0 0 200px}'+
    '</style></head><body><main>'+
    '<p class="first">First box</p><p class="second">Second box</p>'+
    '</main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await page.locator('#reloadLive').click();
  const live=page.frameLocator('#livePageFrame');
  await live.locator('main p.first').click();
  await page.locator('#liveMoveX').fill('194');
  await page.locator('#liveMoveX').press('Tab');
  const grip=await live.locator('#moon-v2-live-overlay .moon-v2-move').boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
  await page.keyboard.down('Alt');
  await page.mouse.down();
  await page.mouse.move(grip.x+grip.width/2+4,grip.y+grip.height/2,{steps:6});
  await expect(live.locator('#moon-v2-snap-x')).toHaveCount(0);
  await page.mouse.up();
  await page.keyboard.up('Alt');
  await expect(live.locator('#moon-v2-snap-x')).toHaveCount(0);
});

test('overflow warning and explicit fit height prevent hidden wrapped text without silent reflow',async({page})=>{
  const live=page.frameLocator('#livePageFrame');
  const heading=live.locator('main h2'),neighbour=live.locator('main p').first();
  const initialNeighbour=await neighbour.boundingBox();
  await heading.click();
  await page.locator('#liveTextReflow').check();
  await page.locator('#liveTextBoxWidth').fill('100');
  await page.locator('#liveTextBoxWidth').press('Tab');
  await expect(page.locator('#liveReflowWarning')).toBeVisible();
  await expect(page.locator('#liveFitReflowHeight')).toBeEnabled();
  const oldHeight=Number(await page.locator('#liveTextBoxHeight').inputValue());
  const beforeFit=await neighbour.boundingBox();
  expect(Math.abs(beforeFit.y-initialNeighbour.y)).toBeLessThan(1.2);
  await page.locator('#liveFitReflowHeight').click();
  const newHeight=Number(await page.locator('#liveTextBoxHeight').inputValue());
  expect(newHeight).toBeGreaterThan(oldHeight+5);
  const afterFit=await neighbour.boundingBox();
  expect(afterFit.y).toBeGreaterThan(beforeFit.y+5);
  await expect(page.locator('#liveReflowWarning')).toBeHidden();
  await page.locator('#undo').click();
  const restored=await neighbour.boundingBox();
  expect(Math.abs(restored.y-beforeFit.y)).toBeLessThan(1.2);
});

test('free canvas snaps movement to peer objects and Alt allows precise bypass',async({page})=>{
  await importScene(page);
  await page.locator('#addShape').click();
  await page.locator('#addShape').click();
  async function setPosition(id,x,y){
    await page.locator('#layers [data-layer-id="'+id+'"]').click();
    await page.locator('#propX').fill(String(x));
    await page.locator('#propX').press('Tab');
    await page.locator('#propY').fill(String(y));
    await page.locator('#propY').press('Tab');
  }
  await setPosition(4,180,320);
  await setPosition(5,450,320);
  const first=page.locator('#stage [data-id="4"]');
  await page.locator('#layers [data-layer-id="4"]').click();
  const canvas=page.locator('#stage');
  const scale=await canvas.evaluate(node=>node.getBoundingClientRect().width/parseFloat(node.style.width));
  async function dragTo(desiredX,alt=false){
    const box=await first.boundingBox();
    const fromX=box.x+box.width*.4,fromY=box.y+box.height*.5;
    await page.mouse.move(fromX,fromY);
    if(alt)await page.keyboard.down('Alt');
    await page.mouse.down();
    await page.mouse.move(fromX+(desiredX-180)*scale,fromY,{steps:10});
    if(!alt)await expect(canvas.locator('[data-v2-guide="x"]')).toHaveCount(1);
    await page.mouse.up();
    if(alt)await page.keyboard.up('Alt');
  }
  await dragTo(447);
  await expect(first).toHaveCSS('left','450px');
  await expect(canvas.locator('[data-v2-guide]')).toHaveCount(0);
  await page.locator('#undo').click();
  await expect(first).toHaveCSS('left','180px');
  await dragTo(447,true);
  const actual=await first.evaluate(node=>parseInt(node.style.left));
  expect(Math.abs(actual-447)).toBeLessThanOrEqual(2);
  await expect(canvas.locator('[data-v2-guide]')).toHaveCount(0);
});

test('canvas text frames reflow and grow vertically when made narrower',async({page})=>{
  await importScene(page);
  await page.locator('#layers [data-layer-id="1"]').click();
  await page.locator('#propText').fill(
    'Scientific explanations are developed by tracing mechanisms, discussing evidence, '+
    'and revisiting how representations describe biological variation. '.repeat(3));
  await page.locator('#propText').press('Tab');
  for(const [id,value] of [['propW','320'],['propH','44'],['propFont','28']]){
    await page.locator('#'+id).fill(value);
    await page.locator('#'+id).press('Tab');
  }
  const text=page.locator('#stage [data-id="1"]');
  const before=await text.evaluate(node=>({w:parseInt(node.style.width),
    h:parseInt(node.style.height),font:node.style.fontSize}));
  const grip=await text.locator('[data-dir=e]').boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
  await page.mouse.down();
  await page.mouse.move(grip.x+grip.width/2-50,grip.y+grip.height/2,{steps:8});
  await page.mouse.up();
  const after=await text.evaluate(node=>({w:parseInt(node.style.width),
    h:parseInt(node.style.height),font:node.style.fontSize}));
  expect(after.w).toBeLessThan(before.w-50);
  expect(after.h).toBeGreaterThan(before.h);
  expect(after.font).toBe(before.font);
});
