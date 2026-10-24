const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const EDITOR_URL = 'http://127.0.0.1:8765/editor.html?page=about.html';
const DRAFT = 'moon-portfolio-visual-editor-v1:about.html';
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
main { margin:30px; border:2px solid #555; padding:24px; min-height:320px; }
section { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.inner { position:relative; transform:translate(12px,8px); }
h2 { font:700 24px/1.2 Georgia,serif; margin:0 0 12px; }
</style></head><body><main id="main"><section id="nested">
<div class="inner"><h2>Test heading</h2><p>Text originally inside a transformed column.</p></div>
<div><p>Another column stays in place.</p></div></section></main></body></html>`;

test.beforeEach(async ({ page }) => {
  await page.route('**/about.html', route => route.fulfill({
    status: 200, contentType: 'text/html', body: fixture
  }));
  await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(key => localStorage.removeItem(key), DRAFT);
  await page.reload();
  await expect(page.locator('#freeCanvasToggle')).toHaveAttribute('aria-pressed', 'true');
});

test('free drag escapes its transformed column, persists and exports the page layer', async ({ page }) => {
  const view = page.frameLocator('#pageFrame');
  const heading = view.locator('main #nested h2');
  await expect(heading).toBeVisible();
  const initial = await heading.boundingBox();
  const x = initial.x + Math.min(initial.width / 2, 55);
  const y = initial.y + initial.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 95, y + 55, { steps: 6 });
  await page.mouse.up();

  const floating = view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  const coordinates = await floating.evaluate(node => {
    const main = node.closest('main');
    const mr = main.getBoundingClientRect(), nr = node.getBoundingClientRect();
    const style = getComputedStyle(main);
    const expectedX = mr.left + parseFloat(style.borderLeftWidth) + parseFloat(node.style.left);
    const expectedY = mr.top + parseFloat(style.borderTopWidth) + parseFloat(node.style.top);
    return {
      dx: Math.abs(expectedX - nr.left),
      dy: Math.abs(expectedY - nr.top),
      font: getComputedStyle(node).fontFamily
    };
  });
  expect(coordinates.dx).toBeLessThan(4);
  expect(coordinates.dy).toBeLessThan(4);
  expect(coordinates.font).toMatch(/Georgia/i);
  await expect.poll(() => page.evaluate(key =>
    JSON.parse(localStorage.getItem(key) || '{}').items?.some(item =>
      item.markup.includes('moon-free-absolute')), DRAFT)).toBe(true);

  const savedLeft = await floating.evaluate(node => node.style.left);
  const savedTop = await floating.evaluate(node => node.style.top);
  await page.reload();
  const restored = view.locator('main > .moon-free-layer > h2');
  await expect(restored).toHaveCount(1);
  await expect(restored).toHaveCSS('left', savedLeft);
  await expect(restored).toHaveCSS('top', savedTop);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const exported = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  expect(exported).toContain('class="moon-free-layer"');
  expect(exported).toContain('class="moon-free-object moon-free-absolute"');
  expect(exported).toContain('--moon-free-canvas-height');
  expect(exported).toContain('id="moon-free-position-css"');
  expect(exported).toContain('id="moon-free-responsive-runtime"');
  expect(exported).toContain('<!--moon-free-slot:');
  expect(exported).not.toContain('data-editor-key=');

  // The published file must contain the same page-level structure.
  const published = await page.context().newPage();
  await published.setViewportSize({ width: 1100, height: 850 });
  await published.setContent(exported);
  const placement = await published.locator('main > .moon-free-layer > h2').evaluate(node => {
    const main = node.closest('main'), mr = main.getBoundingClientRect();
    return node.getBoundingClientRect().left - mr.left - parseFloat(node.style.left);
  });
  expect(Math.abs(placement)).toBeLessThan(4);
  await published.setViewportSize({ width: 390, height: 850 });
  await expect(published.locator('main > .moon-free-layer > h2')).toHaveCSS('position', 'static');
  await published.close();
});

test('eight resize grips and undo remain available after moving to page layer', async ({ page }) => {
  const view = page.frameLocator('#pageFrame');
  await view.locator('main #nested h2').click();
  const grips = view.locator('#moon-free-selection button[data-free-direction]:not([data-free-direction="move"])');
  await expect(grips).toHaveCount(8);
  const move = view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();
  await move.press('Shift+ArrowRight');
  const floating = view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  const originalX = await floating.evaluate(node => parseInt(node.style.left, 10));
  await move.press('ArrowDown');
  await expect(floating).toHaveCSS('left', originalX + 'px');
  await page.locator('#undoBtn').click();
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await page.locator('#undoBtn').click();
  await expect(view.locator('main #nested h2')).toHaveCount(1);
});

test('free canvas has exact vertical size and undoable front/back order', async ({ page }) => {
  const view = page.frameLocator('#pageFrame');
  await view.locator('main #nested h2').click();
  const move = view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();
  await move.press('ArrowRight');
  const floating = view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  const current = await floating.evaluate(node => parseInt(node.style.getPropertyValue('--moon-object-layer'), 10) || 20);
  await view.getByRole('button', { name: 'Place selected object one layer ahead of overlapping objects' }).click();
  await expect(floating).toHaveCSS('z-index', String(current + 1));
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}')
    .items?.some(item => item.markup.includes('--moon-object-layer: 21')), DRAFT)).toBe(true);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html = fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  expect(html).toContain('--moon-object-layer: 21');
  await page.locator('#undoBtn').click();
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCSS('z-index', '20');
  const restored = view.locator('main > .moon-free-layer > h2');
  await expect(restored).toHaveCSS('height', /px$/);
  const size = await restored.evaluate(node => ({
    assigned: parseFloat(node.style.height),
    actual: node.getBoundingClientRect().height
  }));
  expect(Math.abs(size.assigned - size.actual)).toBeLessThan(2);
});

test('published mobile page restores the original position of a floating heading', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  const heading=view.locator('#nested h2');
  await heading.click();
  const handle=view.locator('#moon-free-selection [data-free-direction="move"]');
  await handle.focus();
  await handle.press('Shift+ArrowRight');
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);

  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const exported=fs.readFileSync(await (await downloadPromise).path(), 'utf8');
  // Request the published HTML from the same origin so its local runtime
  // runs exactly as it does on GitHub Pages.
  await page.context().route('**/canvas-published-test.html', route => route.fulfill({
    status:200,contentType:'text/html',body:exported
  }));
  const published=await page.context().newPage();
  await published.setViewportSize({width:1100,height:850});
  await published.goto('http://127.0.0.1:8765/canvas-published-test.html');
  await expect(published.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await published.setViewportSize({width:390,height:850});
  await expect(published.locator('#nested .inner > h2')).toHaveCount(1);
  const order=await published.locator('#nested .inner').evaluate(node =>
    [...node.children].map(child=>child.tagName));
  expect(order).toEqual(['H2','P']);
  await published.setViewportSize({width:1100,height:850});
  await expect(published.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await published.close();
});

test('magnetic alignment snaps to main edge and Alt temporarily bypasses snap', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  await view.locator('#nested h2').click();
  const grip=view.locator('#moon-free-selection [data-free-direction="move"]');
  await grip.focus();
  await grip.press('Shift+ArrowRight');
  const selected=view.locator('main > .moon-free-layer > h2');
  await expect(selected).toHaveCount(1);
  const x=await selected.evaluate(node=>Number.parseInt(node.style.left,10));
  const box=await grip.boundingBox();
  const cx=box.x+box.width/2,cy=box.y+box.height/2;
  await page.mouse.move(cx,cy);
  await page.mouse.down();
  await page.mouse.move(cx-x+3,cy+15,{steps:5});
  await expect(view.locator('#moon-free-snap-guides')).toHaveCount(1);
  await page.mouse.up();
  await expect(selected).toHaveCSS('left','0px');
  await expect(view.locator('#moon-free-snap-guides')).toHaveCount(0);

  // Alt disables magnetic snapping, useful when positioning precisely.
  const moveAgain=view.locator('#moon-free-selection [data-free-direction="move"]');
  const r=await moveAgain.boundingBox();
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);
  await page.keyboard.down('Alt');
  await page.mouse.down();
  await page.mouse.move(r.x+r.width/2+4,r.y+r.height/2+12,{steps:3});
  await page.mouse.up();
  await page.keyboard.up('Alt');
  await expect(selected).toHaveCSS('left','4px');
});

test('Ctrl-click cycles between overlapping floating objects without dragging', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  const heading=view.locator('#nested h2');
  await heading.click();
  let grip=view.locator('#moon-free-selection [data-free-direction="move"]');
  await grip.focus();
  await grip.press('ArrowRight');
  const floatingHeading=view.locator('main > .moon-free-layer > h2');
  await expect(floatingHeading).toHaveCount(1);

  const paragraph=view.locator('#nested .inner p');
  await paragraph.click();
  grip=view.locator('#moon-free-selection [data-free-direction="move"]');
  await grip.focus();
  await grip.press('ArrowRight');
  const floatingParagraph=view.locator('main > .moon-free-layer > p');
  await expect(floatingParagraph).toHaveCount(1);
  const place=await floatingHeading.evaluate(node=>({
    left:node.style.left,top:node.style.top,width:node.style.width,height:node.style.height
  }));
  await floatingParagraph.evaluate((node,place)=>{
    node.style.left=place.left;
    node.style.top=place.top;
    node.style.width=place.width;
    node.style.height=place.height;
    node.style.setProperty('--moon-object-layer','30');
  },place);
  const rect=await floatingHeading.boundingBox();
  const atX=rect.x+Math.min(rect.width/2,65),atY=rect.y+Math.min(rect.height/2,10);
  await page.mouse.move(atX,atY);
  await page.keyboard.down('Control');
  await page.mouse.down();await page.mouse.up();
  await page.keyboard.up('Control');
  await expect(floatingHeading).toHaveAttribute('data-editor-selected','');
  await expect(floatingHeading).toHaveCSS('left',place.left);
  // Accessible alternative for selecting an overlapping object.
  await view.getByRole('button', {name:'Cycle between objects occupying the same area'}).click();
  await expect(floatingParagraph).toHaveAttribute('data-editor-selected','');
});

test('page alignment commands place floating objects precisely and persist after reload', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  await view.locator('main #nested h2').click();
  await view.getByRole('button',{name:'Centre selected object horizontally on the page'}).click();
  let floating=view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  const placement=async()=>floating.evaluate(node=>{
    const main=node.closest('main');
    return {x:parseInt(node.style.left,10),right:main.clientWidth-node.offsetWidth,
      midpoint:(main.clientWidth-node.offsetWidth)/2};
  });
  let x=await placement();
  expect(Math.abs(x.x-x.midpoint)).toBeLessThan(2);
  await view.getByRole('button',{name:'Align selected object to the right page edge'}).click();
  x=await placement();
  expect(Math.abs(x.x-x.right)).toBeLessThan(2);
  await expect.poll(()=>page.evaluate(key=>
    JSON.parse(localStorage.getItem(key)||'{}').items?.some(item=>
      item.markup.includes('--moon-page-x')),DRAFT)).toBe(true);
  const beforeReload=x.x;
  await page.reload();
  floating=view.locator('main > .moon-free-layer > h2');
  await expect(floating).toHaveCount(1);
  await expect(floating).toHaveCSS('left',beforeReload+'px');
  await view.locator('main > .moon-free-layer > h2').click();
  await view.getByRole('button',{name:'Align selected object to the left page edge'}).click();
  await expect(floating).toHaveCSS('left','0px');
  await page.locator('#undoBtn').click();
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCSS('left',beforeReload+'px');
});

test('return to layout restores original container and supports undo', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  await view.locator('#nested h2').click();
  let move=view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();await move.press('Shift+ArrowRight');
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await view.getByRole('button',{
    name:"Restore this object's original place in the content flow"
  }).click();
  await expect(view.locator('#nested .inner > h2')).toHaveCount(1);
  await expect(view.locator('#nested .inner > h2')).not.toHaveClass(/moon-free-absolute/);
  // Restoring the sole draft movement must not leave a phantom edit.
  await expect(page.locator('#exportBtn')).toBeDisabled();
  await page.locator('#undoBtn').click();
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await page.reload();
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await view.locator('main > .moon-free-layer > h2').click();
  await view.getByRole('button',{
    name:"Restore this object's original place in the content flow"
  }).click();
  await expect(view.locator('#nested .inner > h2')).toHaveCount(1);
});

test('published canvas reserves actual wrapped-text height below a floating object', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  await view.locator('#nested h2').click();
  const grip=view.locator('#moon-free-selection [data-free-direction="move"]');
  await grip.focus();await grip.press('Shift+ArrowDown');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const exported=fs.readFileSync(await (await downloadPromise).path(),'utf8');
  await page.context().route('**/canvas-height-test.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:exported
  }));
  const published=await page.context().newPage();
  await published.setViewportSize({width:1100,height:850});
  await published.goto('http://127.0.0.1:8765/canvas-height-test.html');
  const object=published.locator('main > .moon-free-layer > h2');
  await expect(object).toHaveCount(1);
  await object.evaluate(node=>{
    node.style.width='55px';
    node.style.height='18px';
    node.style.minHeight='18px';
    node.textContent='A long heading that wraps over several lines and must not overlap the page footer';
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(()=>object.evaluate(node=>{
    const main=node.closest('main');
    const actual=parseFloat(getComputedStyle(main).getPropertyValue('--moon-free-canvas-height'));
    return actual-(parseFloat(node.style.top)+node.scrollHeight);
  })).toBeGreaterThanOrEqual(31);
  await published.close();
});

test('return to layout also reverses freely positioned new image blocks', async ({ page }) => {
  const view=page.frameLocator('#pageFrame');
  await view.locator('#nested h2').click();
  await page.locator('#insertContentKind').selectOption('image');
  await page.locator('#insertContentText').fill('Example image description');
  await page.locator('#insertImageSrc').fill('assets/example-photograph.webp');
  await page.locator('#insertContentBtn').click();
  const added=view.locator('[data-editor-added-index="0"]');
  await expect(added).toHaveCount(1);
  await added.click();
  let move=view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();await move.press('Shift+ArrowRight');
  await expect(view.locator('main > .moon-free-layer > [data-editor-added-index="0"]')).toHaveCount(1);
  await view.getByRole('button',{
    name:"Restore this object's original place in the content flow"
  }).click();
  await expect(view.locator('#nested [data-editor-added-index="0"]')).toHaveCount(1);
  await expect(view.locator('[data-editor-added-index="0"]')).not.toHaveClass(/moon-free-absolute/);
  await page.locator('#undoBtn').click();
  await expect(view.locator('main > .moon-free-layer > [data-editor-added-index="0"]')).toHaveCount(1);
});

test('legacy duplicated slot identifiers do not merge distinct floating blocks', async ({ page }) => {
  const floatingSource='<!doctype html><html><head></head><body><main>'+
    '<section id="original"><h2 class="moon-free-object moon-free-absolute" '+
    'data-moon-free-slot="same" style="left:20px;top:20px;width:220px;height:50px;'+
    'min-height:50px;--moon-page-x:20px;--moon-page-y:20px">One</h2>'+
    '<p class="moon-free-object moon-free-absolute" data-moon-free-slot="same" '+
    'style="left:40px;top:100px;width:220px;height:50px;min-height:50px;'+
    '--moon-page-x:40px;--moon-page-y:100px">Two</p></section></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:floatingSource
  }));
  await page.reload();
  const view=page.frameLocator('#pageFrame');
  const nodes=view.locator('main > .moon-free-layer > .moon-free-absolute');
  await expect(nodes).toHaveCount(2);
  const slots=await nodes.evaluateAll(list=>list.map(node=>node.getAttribute('data-moon-free-slot')));
  expect(new Set(slots).size).toBe(2);
  // Already-published floating blocks must not offer a misleading reset
  // if their original semantic container is no longer available.
  await nodes.first().click();
  await expect(view.getByRole('button',{
    name:"Restore this object's original place in the content flow"
  })).toHaveCount(0);
});

test('GitHub-only publish sends the reviewed floating page and retains source safety', async ({ page }) => {
  const token='github_pat_test_canvas_publish';
  const writes=[];
  await page.route('https://api.github.com/**', async route => {
    const req=route.request(),url=new URL(req.url());
    expect(req.headers().authorization).toBe('Bearer '+token);
    if(url.pathname==='/user'){
      return route.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({login:'gmoon-code'})});
    }
    if(url.pathname.endsWith('/contents/index.html')){
      return route.fulfill({status:200,contentType:'application/json',body:'{}'});
    }
    if(url.pathname.endsWith('/contents/about.html')&&req.method()==='GET'){
      return route.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({type:'file',encoding:'base64',sha:'original-sha',
          content:Buffer.from(fixture,'utf8').toString('base64')})});
    }
    if(url.pathname.endsWith('/contents/about.html')&&req.method()==='PUT'){
      writes.push(JSON.parse(req.postData()));
      return route.fulfill({status:200,contentType:'application/json',
        body:JSON.stringify({commit:{sha:'f'.repeat(40)}})});
    }
    throw Error('Unexpected request '+req.url());
  });

  const view=page.frameLocator('#pageFrame');
  await view.locator('#nested h2').click();
  const grip=view.locator('#moon-free-selection [data-free-direction="move"]');
  await grip.focus();await grip.press('Shift+ArrowRight');
  await expect(view.locator('main > .moon-free-layer > h2')).toHaveCount(1);
  await page.locator('#directPublishOpen').click();
  await page.locator('#directGithubToken').fill(token);
  await page.locator('#directGithubConnect').click();
  await expect(page.locator('#directGithubStatus')).toContainText('Connected');
  await page.locator('#directPublishConfirm').click();
  await expect(page.locator('#directGithubStatus')).toContainText('Committed to GitHub');
  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({branch:'main',sha:'original-sha'});
  const published=Buffer.from(writes[0].content,'base64').toString('utf8');
  expect(published).toContain('class="moon-free-layer"');
  expect(published).toContain('<!--moon-free-slot:');
  expect(published).toContain('moon-free-responsive.js');
  expect(published).toContain('--moon-page-x');
  expect(published).not.toContain('data-editor-key=');
  expect(published).not.toContain(token);
  const stored=await page.evaluate(()=>JSON.stringify([...Object.entries(localStorage),
    ...Object.entries(sessionStorage)]));
  expect(stored).not.toContain(token);
});

test('nested floating captions stay inside their parent object layer group', async ({ page }) => {
  const source='<!doctype html><html><head></head><body><main>'+
    '<section><figure class="moon-free-object moon-free-absolute" '+
    'style="left:25px;top:40px;width:280px;height:160px;min-height:160px;'+
    '--moon-page-x:25px;--moon-page-y:40px">'+
    '<img alt="Research work" src="assets/example-photograph.webp">'+
    '<figcaption class="moon-free-object moon-free-absolute" '+
    'style="left:5px;top:100px;width:240px;height:40px;min-height:40px;'+
    '--moon-page-x:5px;--moon-page-y:100px">Figure caption</figcaption>'+
    '</figure></section></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await page.reload();
  const view=page.frameLocator('#pageFrame');
  await expect(view.locator('main > .moon-free-layer > figure')).toHaveCount(1);
  await expect(view.locator('main > .moon-free-layer > figure > figcaption')).toHaveCount(1);
  await expect(view.locator('main > .moon-free-layer > figcaption')).toHaveCount(0);
});

test('moving a nested floating caption detaches only the selected child',async({page})=>{
  const source='<!doctype html><html><head></head><body><main>'+
    '<section><figure class="moon-free-object moon-free-absolute" '+
    'style="left:25px;top:40px;width:280px;height:160px;min-height:160px;'+
    '--moon-page-x:25px;--moon-page-y:40px">'+
    '<img alt="Research work" src="assets/example-photograph.webp">'+
    '<figcaption class="moon-free-object moon-free-absolute" '+
    'style="left:5px;top:100px;width:240px;height:40px;min-height:40px;'+
    '--moon-page-x:5px;--moon-page-y:100px">Figure caption</figcaption>'+
    '</figure></section></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source
  }));
  await page.reload();
  const view=page.frameLocator('#pageFrame');
  const caption=view.locator('main .moon-free-layer > figure > figcaption');
  await caption.click();
  const move=view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();await move.press('ArrowRight');
  await expect(view.locator('main > .moon-free-layer > figcaption')).toHaveCount(1);
  await expect(view.locator('main > .moon-free-layer > figure')).toHaveCount(1);
  await expect(view.locator('main > .moon-free-layer > figure > figcaption')).toHaveCount(0);
  await expect(view.locator('main > .moon-free-layer > figcaption'))
    .toHaveAttribute('data-moon-free-detach','true');
});

test('a source figure moves with its image and caption as one editable object', async ({ page }) => {
  const source='<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<style>main{margin:24px;padding:20px}figure{margin:10px;width:260px}figcaption{font:16px Arial}</style></head><body>'+
    '<main><section id="figure-work"><figure><img alt="Lab instruments" src="assets/example-photograph.webp" width="220" height="120">'+
    '<figcaption>Scientific tools in our classroom</figcaption></figure><p>Text after figure</p></section></main></body></html>';
  await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',body:source}));
  await page.reload();
  const view=page.frameLocator('#pageFrame');
  await view.locator('#figure-work figcaption').click();
  await view.getByRole('button',{name:'Select the entire figure including its image and caption'}).click();
  await expect(view.locator('#moon-free-selection button[data-free-direction]')).toHaveCount(9);
  const move=view.locator('#moon-free-selection [data-free-direction="move"]');
  await move.focus();await move.press('Shift+ArrowRight');
  const group=view.locator('main > .moon-free-layer > figure');
  await expect(group).toHaveCount(1);
  await expect(group.locator('img')).toHaveCount(1);
  await expect(group.locator('figcaption')).toHaveText('Scientific tools in our classroom');
  const x=await group.evaluate(el=>el.style.left);
  await expect.poll(()=>page.evaluate(key=>
    JSON.parse(localStorage.getItem(key)||'{}').items?.some(item=>
      item.markup.startsWith('<figure')&&item.markup.includes('moon-free-absolute')),DRAFT)).toBe(true);
  await page.reload();
  const restored=view.locator('main > .moon-free-layer > figure');
  await expect(restored).toHaveCount(1);
  await expect(restored).toHaveCSS('left',x);
  await restored.locator('figcaption').click();
  await view.getByRole('button',{name:'Select the entire figure including its image and caption'}).click();
  await view.getByRole('button',{name:'Select the caption within this figure'}).click();
  await expect(view.locator('figcaption[data-editor-selected]')).toHaveCount(1);
  await view.getByRole('button',{name:'Select the entire figure including its image and caption'}).click();
  await view.getByRole('button',{name:'Select the image within this figure'}).click();
  await expect(view.locator('img[data-editor-selected]')).toHaveCount(1);
  const download=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=fs.readFileSync(await(await download).path(),'utf8');
  expect(html).toContain('<figure');
  expect(html).toContain('moon-free-layer');
  expect(html).toContain('<figcaption>Scientific tools in our classroom</figcaption>');
  expect(html).not.toContain('data-editor-key=');
});

test('floating figure preserves its own image dimensions while its caption stays inside', async ({ page }) => {
  const source='<!doctype html><html><head><style>main{padding:25px}figure{margin:0}</style></head><body>'+
    '<main><section><figure><img src="assets/example-photograph.webp" alt="Lab photograph" '+
    'style="width:120px;height:80px"><figcaption>Caption remains part of the figure</figcaption>'+
    '</figure><p>Following paragraph</p></section></main></body></html>';
  // The missing asset in a prior fixture produced Chromium's 18px broken
  // image placeholder, which made the test falsely report a resize bug.
  const pixel=Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64');
  await page.context().route('**/assets/example-photograph.webp',route=>
    route.fulfill({status:200,contentType:'image/gif',body:pixel}));
  await page.route('**/about.html',route=>route.fulfill({status:200,contentType:'text/html',body:source}));
  await page.reload();
  const view=page.frameLocator('#pageFrame');
  await expect.poll(()=>view.locator('figure img').evaluate(node=>node.naturalHeight)).toBe(1);
  await expect(view.locator('figure img')).toHaveCSS('height','80px');
  await view.locator('figure figcaption').click();
  await view.getByRole('button',{name:'Select the entire figure including its image and caption'}).click();
  const handle=view.locator('#moon-free-selection [data-free-direction="move"]');
  await handle.focus();await handle.press('ArrowRight');
  const figure=view.locator('main > .moon-free-layer > figure');
  await expect(figure).toHaveCount(1);
  await expect(figure.locator('img')).toHaveCSS('height','80px');
  await expect(figure.locator('figcaption')).toHaveText('Caption remains part of the figure');
  const download=page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const html=fs.readFileSync(await(await download).path(),'utf8');
  expect(html).toContain('p.moon-free-absolute > img');
  expect(html).toContain('<figcaption>Caption remains part of the figure</figcaption>');
  await page.context().route('**/canvas-figure-published.html',route=>
    route.fulfill({status:200,contentType:'text/html',body:html}));
  const published=await page.context().newPage();
  await published.setViewportSize({width:390,height:780});
  await published.goto('http://127.0.0.1:8765/canvas-figure-published.html');
  await expect.poll(()=>published.locator('main figure > img').evaluate(node=>node.naturalHeight)).toBe(1);
  await expect(published.locator('main figure > img')).toHaveCSS('height','80px');
  await published.close();
});

test('Shift-dragging an image moves its whole captioned figure',async({page})=>{
  const source='<!doctype html><html><head><style>main{margin:30px;padding:20px}figure{width:250px;margin:0}'+
    'figure img{display:block;width:150px;height:100px}</style></head><body>'+
    '<main><section><figure><img alt="Laboratory" src="assets/example-photograph.webp">'+
    '<figcaption>Figure stays together</figcaption></figure></section></main></body></html>';
  const pixel=Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64');
  await page.context().route('**/assets/example-photograph.webp',route=>
    route.fulfill({status:200,contentType:'image/gif',body:pixel}));
  await page.route('**/about.html',route=>route.fulfill({
    status:200,contentType:'text/html',body:source}));
  await page.reload();
  const view=page.frameLocator('#pageFrame');
  const image=view.locator('main figure img');
  await expect(image).toBeVisible();
  const rect=await image.boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.keyboard.down('Shift');
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2+80,rect.y+rect.height/2+45,{steps:6});
  await page.mouse.up();
  await page.keyboard.up('Shift');
  const figure=view.locator('main > .moon-free-layer > figure');
  await expect(figure).toHaveCount(1);
  await expect(figure.locator('img')).toHaveCount(1);
  await expect(figure.locator('figcaption')).toHaveText('Figure stays together');
  await expect(figure).toHaveClass(/moon-free-absolute/);
  const move=await figure.evaluate(node=>({left:parseInt(node.style.left,10),top:parseInt(node.style.top,10)}));
  expect(move.left).toBeGreaterThan(30);
  expect(move.top).toBeGreaterThan(30);
  await page.reload();
  await expect(view.locator('main > .moon-free-layer > figure > figcaption')).toHaveText('Figure stays together');
});
