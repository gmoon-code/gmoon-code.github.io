// Real-current-website compatibility regression for Academic Editor V2.
// Every listed page is read directly from the checkout. GitHub Contents GET
// replies are intercepted with those exact bytes, never synthetic page HTML.
// No real GitHub token or write operation is used.
const {test,expect}=require('@playwright/test');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const {createHash}=require('node:crypto');

const ROOT=join(__dirname,'..');
const BASE='http://127.0.0.1:8765';
const PAGES=[
  'index.html','research.html','projects.html','teaching.html','interests.html',
  'contact.html','cv.html','pungmul.html','research-methods-studio.html',
  'story-method.html','research-action.html','research-scoping.html',
  'writing-biological-classification.html','teaching-ap-biology.html',
  'teaching-ap-chemistry.html','teaching-ap-evolution.html',
  'teaching-osmosis-practice.html'
];
const SOURCE=new Map(PAGES.map(name=>[name,readFileSync(join(ROOT,name))]));
const blobSha=bytes=>createHash('sha1')
  .update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');

test.setTimeout(90000);

async function installVerifiedCurrentSource(page,writes){
  await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
    async route=>{
      const req=route.request();
      if(req.method()!=='GET'){
        writes.push({method:req.method(),url:req.url()});
        await route.abort();
        return;
      }
      const url=new URL(req.url());
      const name=url.pathname.split('/contents/')[1];
      const bytes=name&&SOURCE.get(decodeURIComponent(name));
      if(!bytes||url.searchParams.get('ref')!=='main'){
        await route.fulfill({status:404,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},body:'{}'});
        return;
      }
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({type:'file',name,sha:blobSha(bytes),
          encoding:'base64',content:bytes.toString('base64')})});
    });
}

test('Editor V2 page selector matches exactly the 17 current editable source files',async({page})=>{
  const writes=[];
  await installVerifiedCurrentSource(page,writes);
  await page.goto(BASE+'/editor-v2.html',{waitUntil:'domcontentloaded'});
  const actual=await page.locator('#page option').evaluateAll(nodes=>nodes.map(node=>node.value));
  expect(actual).toEqual(PAGES);
  for(const name of actual)expect(existsSync(join(ROOT,name)),name).toBe(true);
  expect(writes).toEqual([]);
});

for(const name of PAGES){
  test('GitHub-source live view and verified unedited preview on '+name,async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    const bytes=SOURCE.get(name);
    const source=bytes.toString('utf8');
    const sha=blobSha(bytes);

    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#page')).toHaveValue(name);
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const live=page.frameLocator('#livePageFrame');
    await expect(live.locator('main')).toHaveCount(1);
    const expected=await page.evaluate(html=>{
      const doc=new DOMParser().parseFromString(html,'text/html');
      const main=doc.querySelector('main');
      const normalized=s=>String(s||'').replace(/\s+/g,' ').trim();
      return {text:normalized(main?.textContent),
        heading:normalized(main?.querySelector('h1,h2,h3,h4,h5,h6')?.textContent)};
    },source);
    expect(expected.text.length,name+' original main should have text').toBeGreaterThan(40);
    if(expected.heading){
      await expect(live.locator('main h1,main h2,main h3,main h4,main h5,main h6').first())
        .toHaveText(expected.heading,{timeout:12000});
    }

    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
    await expect(page.locator('#previewSourceStatus')).toContainText('GitHub main');
    await expect(page.locator('#previewSourceStatus')).toContainText(sha.slice(0,10));
    const preview=page.frameLocator('#previewFrame');
    await expect(preview.locator('main')).toHaveCount(1);
    if(expected.heading){
      await expect(preview.locator('main h1,main h2,main h3,main h4,main h5,main h6').first())
        .toHaveText(expected.heading,{timeout:12000});
    }
    const previewText=await preview.locator('main').evaluate(node=>
      node.textContent.replace(/\s+/g,' ').trim());
    expect(previewText,name+' source excerpt preserved')
      .toContain(expected.text.slice(0,Math.min(90,expected.text.length)));
    expect(writes,name+' must not publish while loading/previewing').toEqual([]);
    await page.locator('#closePreview').click();
  });
}

for(const name of [
  'index.html','research.html','research-scoping.html','contact.html','pungmul.html'
]){
  test('Real-page heading appearance, undo/redo, local save and reload on '+name,
    async({page})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const live=page.frameLocator('#livePageFrame');
      const heading=live.locator('main h1:visible,main h2:visible').first();
      await expect(heading).toBeVisible();
      const before=await heading.evaluate(node=>
        node.ownerDocument.defaultView.getComputedStyle(node).textAlign);
      const wanted=before==='center'?'right':'center';
      await heading.click();
      await expect(page.locator('#liveTextControls')).toBeVisible();
      await page.locator('#liveTextAlign').selectOption(wanted);
      await expect(heading).toHaveCSS('text-align',wanted);
      await page.locator('#undo').click();
      await expect(heading).toHaveCSS('text-align',before);
      await page.locator('#redo').click();
      await expect(heading).toHaveCSS('text-align',wanted);
      await page.locator('#save').click();
      const saved=await page.evaluate(file=>
        localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
      expect(JSON.parse(saved).length).toBeGreaterThan(0);

      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      await expect(page.frameLocator('#previewFrame')
        .locator('main h1:visible,main h2:visible').first())
        .toHaveCSS('text-align',wanted);
      await page.locator('#closePreview').click();

      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await expect(live.locator('main h1:visible,main h2:visible').first())
        .toHaveCSS('text-align',wanted);
      expect(writes,name+' must not perform a GitHub write').toEqual([]);
    });
}

for(const name of [
  'index.html','research.html','research-scoping.html','contact.html','pungmul.html'
]){
  test('Real-page phone and tablet viewports remain responsive on '+name,
    async({page})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      for(const [screen,width] of [['phone',390],['tablet',768]]){
        await page.locator('#devicePreview').selectOption(screen);
        await expect(page.locator('#livePageFrame')).toHaveCSS('width',width+'px');
        const live=page.frameLocator('#livePageFrame');
        await expect(live.locator('main')).toHaveCount(1);
        const liveViewport=await live.locator('html').evaluate(node=>
          node.ownerDocument.defaultView.innerWidth);
        expect(liveViewport).toBe(width);

        await page.locator('#preview').click();
        await expect(page.locator('#previewDialog')).toBeVisible();
        await expect(page.locator('#previewFrame')).toHaveCSS('width',width+'px');
        await expect(page.locator('#previewSourceStatus')).toContainText('GitHub main');
        const preview=page.frameLocator('#previewFrame');
        await expect(preview.locator('main')).toHaveCount(1);
        const verifiedViewport=await preview.locator('html').evaluate(node=>
          node.ownerDocument.defaultView.innerWidth);
        expect(verifiedViewport).toBe(width);
        await page.locator('#closePreview').click();
      }
      expect(writes).toEqual([]);
    });
}

test('Real Pungmul photo crop retains original asset, verified preview and local draft',async({page})=>{
  const writes=[];
  await installVerifiedCurrentSource(page,writes);
  await page.goto(BASE+'/editor-v2.html?page=pungmul.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const live=page.frameLocator('#livePageFrame');
  const image=live.locator('main img').first();
  await expect(image).toBeVisible();
  await image.scrollIntoViewIfNeeded();
  await expect.poll(()=>image.evaluate(node=>node.naturalWidth),{timeout:15000})
    .toBeGreaterThan(0);
  const src=await image.getAttribute('src');
  expect(src).toMatch(/^assets\/[^?#]+\.(?:jpg|jpeg|png|webp)$/i);
  await image.click();
  await expect(page.locator('#cropImageTool')).toBeEnabled();
  await page.locator('#cropImageTool').click();
  await page.locator('#liveCropRight').evaluate(el=>{
    el.value='20';el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(page.locator('#liveCropRightValue')).toHaveText('20%');
  await expect(image).toHaveAttribute('src',src);
  await page.locator('#preview').click();
  await expect(page.locator('#previewDialog')).toBeVisible();
  const preview=page.frameLocator('#previewFrame');
  await expect(preview.locator('main img').first()).toHaveAttribute('src',src);
  const cropDiagnostics=await Promise.all([image,preview.locator('main img').first()]
    .map(node=>node.evaluate(img=>({
      computedFit:img.ownerDocument.defaultView.getComputedStyle(img).objectFit,
      crop:img.getAttribute('data-moon-v2-image-crop'),
      sheet:img.ownerDocument.getElementById('moon-v2-live-layout')?.textContent.slice(-1400),
      width:Math.round(img.getBoundingClientRect().width)
    }))));
  console.log('PUNGMUL_CURRENT_CROP_DIAGNOSTICS',JSON.stringify(cropDiagnostics));
  await expect(preview.locator('main img').first()).toHaveCSS('object-fit','none');
  await page.locator('#closePreview').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await expect(live.locator('main img').first()).toHaveAttribute('src',src);
  await expect(live.locator('main img').first()).toHaveCSS('object-fit','none');
  expect(writes).toEqual([]);
});

for(const name of PAGES){
  test('Source-faithful simulated GitHub publication of an actual '+name+' appearance edit',
    async({page})=>{
      const unexpectedWrites=[],mockPublications=[];
      await installVerifiedCurrentSource(page,unexpectedWrites);
      // The only permitted write is answered in-browser. Nothing is sent
      // to GitHub. Any unrecognised write request remains blocked.
      await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
        async route=>{
          if(route.request().method()!=='PUT')return route.fallback();
          mockPublications.push(JSON.parse(route.request().postData()));
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({commit:{sha:'isolated-browser-test-commit'}})});
        });
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const heading=page.frameLocator('#livePageFrame')
        .locator('main h1:visible,main h2:visible').first();
      await expect(heading).toBeVisible();
      const before=await heading.evaluate(node=>
        node.ownerDocument.defaultView.getComputedStyle(node).textAlign);
      const wanted=before==='right'?'center':'right';
      await heading.click();
      await page.locator('#liveTextAlign').selectOption(wanted);
      await expect(heading).toHaveCSS('text-align',wanted);
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      await expect(page.locator('#previewSourceStatus'))
        .toContainText('GitHub main');
      const previewHtml=await page.locator('#previewFrame').getAttribute('srcdoc');
      expect(previewHtml,name+' preview HTML should be populated').toBeTruthy();
      await page.locator('#closePreview').click();
      await page.locator('#publish').click();
      await expect(page.locator('#publishDialog')).toBeVisible();
      await page.locator('#githubToken').fill('isolated-browser-test-only');
      await page.locator('#acknowledgeLive').check();
      await page.locator('#confirmPublish').click();
      await expect.poll(()=>mockPublications.length,{timeout:20000}).toBe(1);
      const payload=mockPublications[0];
      expect(payload.branch).toBe('main');
      expect(payload.sha).toBe(blobSha(SOURCE.get(name)));
      const published=Buffer.from(payload.content,'base64').toString('utf8');
      expect(published,name+' live PUT must exactly match verified preview')
        .toBe(previewHtml);
      expect(published).toContain('moon-v2-live-layout');
      const inspected=await page.evaluate(({original,published})=>{
        const parser=new DOMParser();
        const a=parser.parseFromString(original,'text/html');
        const b=parser.parseFromString(published,'text/html');
        const clean=s=>s.replace(/\s+/g,' ').trim();
        return {
          textOriginal:clean(a.querySelector('main')?.textContent||''),
          textPublished:clean(b.querySelector('main')?.textContent||''),
          linkCountOriginal:a.querySelectorAll('main a[href]').length,
          linkCountPublished:b.querySelectorAll('main a[href]').length,
          imageSourcesOriginal:[...a.querySelectorAll('main img')].map(x=>x.getAttribute('src')),
          imageSourcesPublished:[...b.querySelectorAll('main img')].map(x=>x.getAttribute('src'))
        };
      },{original:SOURCE.get(name).toString('utf8'),published});
      expect(inspected.textPublished).toBe(inspected.textOriginal);
      expect(inspected.linkCountPublished).toBe(inspected.linkCountOriginal);
      expect(inspected.imageSourcesPublished).toEqual(inspected.imageSourcesOriginal);
      expect(unexpectedWrites).toEqual([]);
      const localText=await page.evaluate(()=>JSON.stringify(localStorage));
      expect(localText).not.toContain('isolated-browser-test-only');
    });
}


// Publishing failure checks use the real current page HTML, but intercept every
// GitHub API request. They never submit any request to the actual repository.
test('A changed GitHub source blocks real-page publication without losing the draft',
  async({page})=>{
    const name='contact.html',unexpectedWrites=[];
    await installVerifiedCurrentSource(page,unexpectedWrites);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    await page.locator('#liveTextAlign').selectOption('right');
    await page.locator('#save').click();
    const savedBefore=await page.evaluate(file=>
      localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
    expect(savedBefore).toBeTruthy();

    const currentBytes=SOURCE.get(name);
    const changedBytes=Buffer.from(currentBytes.toString('utf8')
      .replace('</main>','<p data-test-new-revision="true">New external revision</p></main>'));
    expect(changedBytes.equals(currentBytes)).toBe(false);
    const endpoint='https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name;
    let revisionChecks=0;
    await page.route(endpoint+'?ref=main',async route=>{
      revisionChecks++;
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({type:'file',name,sha:blobSha(changedBytes),
          encoding:'base64',content:changedBytes.toString('base64')})});
    });
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('isolated-test-token-never-sent');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect(page.locator('#publishError'))
      .toContainText('changed since your editing view was loaded',{timeout:20000});
    expect(revisionChecks).toBeGreaterThan(0);
    expect(unexpectedWrites).toEqual([]);
    expect(await page.evaluate(file=>
      localStorage.getItem('moon-academic-editor-v2:source:'+file),name))
      .toBe(savedBefore);
    await expect(page.locator('#publishResult')).toBeHidden();
    expect(await page.evaluate(()=>JSON.stringify(localStorage)))
      .not.toContain('isolated-test-token-never-sent');
  });

test('A simulated GitHub 409 conflict retains a real-page draft and reports no publication',
  async({page})=>{
    const name='research.html',unexpectedWrites=[],submitted=[];
    await installVerifiedCurrentSource(page,unexpectedWrites);
    const endpoint='https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name;
    await page.route(endpoint,async route=>{
      if(route.request().method()!=='PUT')return route.fallback();
      submitted.push(JSON.parse(route.request().postData()));
      await route.fulfill({status:409,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({message:'Conflict, source was updated'})});
    });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    await page.locator('#liveTextAlign').selectOption('right');
    await page.locator('#save').click();
    const savedBefore=await page.evaluate(file=>
      localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
    expect(savedBefore).toBeTruthy();

    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('isolated-test-conflict-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect(page.locator('#publishError'))
      .toContainText('changed on GitHub during publication',{timeout:20000});
    expect(submitted).toHaveLength(1);
    expect(submitted[0].branch).toBe('main');
    expect(submitted[0].sha).toBe(blobSha(SOURCE.get(name)));
    expect(unexpectedWrites).toEqual([]);
    expect(await page.evaluate(file=>
      localStorage.getItem('moon-academic-editor-v2:source:'+file),name))
      .toBe(savedBefore);
    await expect(page.locator('#publishResult')).toBeHidden();
    expect(await page.evaluate(()=>JSON.stringify(localStorage)))
      .not.toContain('isolated-test-conflict-token');
  });


test('The publishing dialog discloses same-origin script access and clears a cancelled synthetic token',
  async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page=contact.html',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    await page.locator('#liveTextAlign').selectOption('right');
    await page.locator('#publish').click();
    await expect(page.locator('#publishDialog')).toBeVisible();
    await expect(page.locator('#publishDialog'))
      .toContainText('A compromised page script could read a token while it is entered.');
    await page.locator('#githubToken').fill('synthetic-cancelled-token');
    await page.locator('#cancelPublish').click();
    await expect(page.locator('#publishDialog')).not.toBeVisible();
    await expect(page.locator('#githubToken')).toHaveValue('');
    expect(await page.evaluate(()=>JSON.stringify(localStorage)))
      .not.toContain('synthetic-cancelled-token');
    expect(writes).toEqual([]);
  });


// Client-side image placement is part of the published page, not merely a
// property of its HTML. Compare independent visitor rendering against both
// the editable frame and source-matched publication preview, using the same
// real page bytes, browser engine, viewport width and viewport height.
const photoLayout=async frame=>frame.locator('main').evaluate(main=>{
  const round=x=>Math.round(x*10)/10;
  const base=main.getBoundingClientRect();
  return [...main.querySelectorAll('img[data-moon-v2-added-id]')].map(img=>{
    const r=img.getBoundingClientRect(),style=img.ownerDocument.defaultView.getComputedStyle(img);
    const parent=img.parentElement;
    const destination=parent.hasAttribute('data-moon-v2-added-layer')?'added-layer':
      parent.classList.contains('home-intro')?'home-intro':
      parent.classList.contains('home-outside-grid')?'home-outside-grid':
      parent.classList.contains('contact-background')?'contact-background':
      parent.tagName.toLowerCase()+'.'+parent.className;
    return {id:img.getAttribute('data-moon-v2-added-id'),destination,
      srcLength:(img.getAttribute('src')||'').length,alt:img.getAttribute('alt')||'',
      naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
      objectFit:style.objectFit,borderRadius:style.borderRadius,
      rect:{x:round(r.left-base.left),y:round(r.top-base.top),
        width:round(r.width),height:round(r.height)}};
  }).sort((a,b)=>a.id.localeCompare(b.id));
});

function comparePhotoSnapshots(actual,expected,label){
  expect(actual.length,label+' original photo count').toBe(expected.length);
  for(let i=0;i<expected.length;i++){
    const a=actual[i],b=expected[i];
    expect(a.id,label+' photo identity').toBe(b.id);
    expect(a.destination,label+' parent placement').toBe(b.destination);
    expect(a.srcLength,label+' original image source size').toBe(b.srcLength);
    expect(a.alt,label+' original alternative text').toBe(b.alt);
    expect(a.naturalWidth,label+' decoded width').toBe(b.naturalWidth);
    expect(a.naturalHeight,label+' decoded height').toBe(b.naturalHeight);
    expect(a.objectFit,label+' image fit').toBe(b.objectFit);
    expect(a.borderRadius,label+' corner styling').toBe(b.borderRadius);
    for(const key of ['x','y','width','height'])
      expect(Math.abs(a.rect[key]-b.rect[key]),
        label+' '+key+' '+JSON.stringify({actual:a.rect,expected:b.rect}))
        .toBeLessThanOrEqual(4);
  }
}

for(const [name,expectedCount] of [['index.html',2],['contact.html',1]]){
  test('Source-matched visitor and Editor V2 photo placement on actual '+name,
    async({page,browser})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const visitor=await browser.newPage({viewport:{width:1160,height:900}});
      try{
        await visitor.goto(BASE+'/'+name,{waitUntil:'load'});
        const frames=[
          {label:'editor',target:page.frameLocator('#livePageFrame')},
          {label:'preview',target:page.frameLocator('#previewFrame')}
        ];
        for(const [device,width,height] of [
          ['desktop',1160,900],['tablet',768,1024],['phone',390,844]
        ]){
          await visitor.setViewportSize({width,height});
          await page.locator('#devicePreview').selectOption(device);
          await expect(page.locator('#livePageFrame')).toHaveCSS('width',width+'px');
          await expect(page.frameLocator('#livePageFrame').locator('main'))
            .toHaveCount(1);
          const visitorPhotos=await photoLayout(visitor);
          expect(visitorPhotos.length,name+' '+device).toBe(expectedCount);
          const intendedDestinations=name==='index.html'?
            (device==='desktop'?['added-layer','added-layer']:
              ['home-intro','home-outside-grid']):['contact-background'];
          expect(visitorPhotos.map(img=>img.destination).sort(),
            name+' '+device+' visitor script reparenting')
            .toEqual(intendedDestinations.sort());
          expect(visitorPhotos.every(img=>img.naturalWidth>0&&img.naturalHeight>0))
            .toBe(true);
          const live=frames[0].target;
          // Reparenting can finish after the editor frame initially exposes
          // its main element. Poll for the full rendered photo relationship.
          await expect.poll(async()=>{
            try{
              const actual=await photoLayout(live);
              comparePhotoSnapshots(actual,visitorPhotos,name+' '+device+' editor');
              return 'matched';
            }catch{return 'not-yet';}
          },{timeout:20000}).toBe('matched');
          await page.locator('#preview').click();
          await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
          await expect(page.locator('#previewFrame')).toHaveCSS('width',width+'px');
          const preview=frames[1].target;
          await expect.poll(async()=>{
            try{
              const actual=await photoLayout(preview);
              comparePhotoSnapshots(actual,visitorPhotos,name+' '+device+' preview');
              return 'matched';
            }catch{return 'not-yet';}
          },{timeout:20000}).toBe('matched');
          await page.locator('#closePreview').click();
        }
        expect(writes,name+' must not publish during photo layout checks').toEqual([]);
      }finally{await visitor.close();}
    });
}
