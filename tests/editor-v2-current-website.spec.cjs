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


test('Two consecutive source-faithful simulated live publications preserve both edits',
  async({page})=>{
    const name='teaching.html',url='https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name;
    const gitReads=[],pubs=[],otherWrites=[];
    let committed=SOURCE.get(name);
    await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
      async route=>{
        const req=route.request(),requestUrl=new URL(req.url());
        if(requestUrl.pathname!=='/repos/gmoon-code/gmoon-code.github.io/contents/'+name){
          otherWrites.push({method:req.method(),path:requestUrl.pathname});
          await route.abort();return;
        }
        if(req.method()==='GET'&&requestUrl.searchParams.get('ref')==='main'){
          gitReads.push(blobSha(committed));
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({type:'file',name,sha:blobSha(committed),
              encoding:'base64',content:committed.toString('base64')})});
          return;
        }
        if(req.method()==='PUT'){
          const put=JSON.parse(req.postData());
          expect(put.branch).toBe('main');
          expect(put.sha).toBe(blobSha(committed));
          const next=Buffer.from(put.content,'base64');
          pubs.push({put,html:next.toString('utf8')});
          committed=next;
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({commit:{sha:'mock-consecutive-'+pubs.length}})});
          return;
        }
        otherWrites.push({method:req.method(),path:requestUrl.pathname});
        await route.abort();
      });

    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const live=page.frameLocator('#livePageFrame');
    const heading=live.locator('main h1:visible,main h2:visible').first();
    const previousAlignment=await heading.evaluate(node=>
      node.ownerDocument.defaultView.getComputedStyle(node).textAlign);
    const selectedAlignment=previousAlignment==='center'?'right':'center';
    await heading.click();
    await page.locator('#liveTextAlign').selectOption(selectedAlignment);
    await expect(heading).toHaveCSS('text-align',selectedAlignment);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const firstPreview=await page.locator('#previewFrame').getAttribute('srcdoc');
    await page.locator('#closePreview').click();
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-two-publish-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect.poll(()=>pubs.length,{timeout:25000}).toBe(1);
    await expect(page.locator('#publishDialog')).not.toBeVisible({timeout:25000});
    expect(pubs[0].html).toBe(firstPreview);
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await expect(live.locator('main h1:visible,main h2:visible').first())
      .toHaveCSS('text-align',selectedAlignment);

    // Committed changes must become the editable GitHub baseline, rather
    // than remain "unpublished" and reapply transforms a second time.
    await expect(page.locator('#liveEditCount')).toContainText('No live-page draft edits');
    const archive=JSON.parse(await page.evaluate(name=>localStorage.getItem(
      'moon-academic-editor-v2:last-published-source:'+name),name));
    expect(archive).toMatchObject({
      format:'moon-editor-v2-live-draft',version:1,page:name,commit:'mock-consecutive-1'
    });
    expect(archive.patches).toHaveLength(1);
    await expect(page.locator('#downloadLastPublishedLiveDraft')).toBeVisible();
    // No pending source edits remain; even opening Publish cannot send an
    // additional request without a newly saved change.
    expect(pubs).toHaveLength(1);

    // A second user edit must be rebased onto the successful first commit.
    const paragraph=live.locator('main p:visible').first();
    await paragraph.click();
    await page.locator('#editLiveText').click();
    const replacement='Synthetic follow-up content change for publication regression.';
    await paragraph.fill(replacement);
    await page.locator('#saveLiveText').click();
    await expect(paragraph).toHaveText(replacement);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const secondPreview=await page.locator('#previewFrame').getAttribute('srcdoc');
    await page.locator('#closePreview').click();
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-two-publish-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect.poll(()=>pubs.length,{timeout:25000}).toBe(2);
    await expect(page.locator('#publishDialog')).not.toBeVisible({timeout:25000});
    expect(pubs[1].put.sha).toBe(blobSha(Buffer.from(pubs[0].html)));
    expect(pubs[1].html).toBe(secondPreview);
    expect(pubs[1].html).toContain(replacement);
    await expect(page.frameLocator('#livePageFrame').locator('main p:visible').first())
      .toHaveText(replacement,{timeout:20000});
    await expect(live.locator('main h1:visible,main h2:visible').first())
      .toHaveCSS('text-align',selectedAlignment);
    const extractSourceCss=html=>{
      const match=html.match(/<style id="moon-v2-live-layout">([\s\S]*?)<\/style>/i);
      return match?.[1]||'';
    };
    const countStyles=html=>(html.match(/id="moon-v2-live-layout"/g)||[]).length;
    expect(countStyles(pubs[1].html)).toBeLessThanOrEqual(1);
    expect(extractSourceCss(pubs[1].html),'text-only follow-up must not duplicate existing style rules')
      .toBe(extractSourceCss(pubs[0].html));
    expect(otherWrites).toEqual([]);
    expect(gitReads.length).toBeGreaterThanOrEqual(4);
    expect(await page.evaluate(()=>JSON.stringify(localStorage)))
      .not.toContain('synthetic-two-publish-token');
  });


for(const name of PAGES){
  test('Original paragraph text editing, reload and mock publishing on actual '+name,async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const live=page.frameLocator('#livePageFrame');
    const paragraph=live.locator('main p:visible').first();
    await expect(paragraph).toBeVisible();
    const original=await paragraph.textContent();
    expect(original?.trim().length).toBeGreaterThan(0);
    await paragraph.click();
    await expect(page.locator('#editLiveText')).toBeEnabled();
    await page.locator('#editLiveText').click();
    const synthetic='Synthetic source-text edit for '+name+'.';
    await expect(paragraph).toHaveAttribute('contenteditable','true');
    await paragraph.fill(synthetic);
    await page.locator('#saveLiveText').click();
    await expect(paragraph).toHaveText(synthetic);
    await page.locator('#save').click();
    const draft=await page.evaluate(file=>
      localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
    expect(draft,name+' draft must be saved').toBeTruthy();
    expect(JSON.parse(draft).some(p=>p.kind==='text')).toBe(true);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
    await expect(page.frameLocator('#previewFrame').locator('main p:visible').first())
      .toHaveText(synthetic,{timeout:20000});
    const html=await page.locator('#previewFrame').getAttribute('srcdoc');
    expect(html).toContain(synthetic);
    await page.locator('#closePreview').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await expect(page.frameLocator('#livePageFrame').locator('main p:visible').first())
      .toHaveText(synthetic,{timeout:20000});
    expect(writes,name+' text editing must remain unpublished').toEqual([]);
    const published=[];
    await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
      async route=>{
        if(route.request().method()!=='PUT')return route.fallback();
        published.push(JSON.parse(route.request().postData()));
        await route.fulfill({status:200,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({commit:{sha:'mock-text-publication-'+name}})});
      });
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-text-publication-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect.poll(()=>published.length,{timeout:20000}).toBe(1);
    expect(published[0].sha,name+' latest source SHA').toBe(blobSha(SOURCE.get(name)));
    expect(published[0].branch).toBe('main');
    expect(Buffer.from(published[0].content,'base64').toString('utf8'),
      name+' text publication must exactly match verified preview').toBe(html);
    await expect(page.locator('#publishDialog')).not.toBeVisible({timeout:20000});
    expect(writes,name+' no unexpected external writes').toEqual([]);
    expect(await page.evaluate(()=>JSON.stringify(localStorage)))
      .not.toContain('synthetic-text-publication-token');
  });
}


for(const [code,message] of [[401,'GitHub denied access'],[403,'GitHub denied access']]){
  test('A denied GitHub token prevents publication on real '+code+' response',
    async({page})=>{
      const name='research.html',writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const heading=page.frameLocator('#livePageFrame')
        .locator('main h1:visible,main h2:visible').first();
      await heading.click();
      await page.locator('#liveTextAlign').selectOption('right');
      await page.locator('#save').click();
      const saved=await page.evaluate(file=>
        localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
      const endpoint='https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name+'?ref=main';
      await page.route(endpoint,route=>route.fulfill({
        status:code,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({message:'Synthetic token rejection'})}));
      await page.locator('#publish').click();
      await page.locator('#githubToken').fill('synthetic-invalid-token');
      await page.locator('#acknowledgeLive').check();
      await page.locator('#confirmPublish').click();
      await expect(page.locator('#publishError'))
        .toContainText(message,{timeout:20000});
      await expect(page.locator('#publishDialog')).toBeVisible();
      await expect(page.locator('#confirmPublish')).toBeEnabled();
      await expect(page.locator('#githubToken')).toHaveValue('');
      expect(await page.evaluate(file=>
        localStorage.getItem('moon-academic-editor-v2:source:'+file),name))
        .toBe(saved);
      expect(writes).toEqual([]);
      await expect(page.locator('#publishResult')).toBeHidden();
    });
}

test('GitHub HTTP 422 validation failure retains the real-page draft without false success',
  async({page})=>{
    const name='contact.html',writes=[],attempted=[];
    await installVerifiedCurrentSource(page,writes);
    await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
      async route=>{
        if(route.request().method()!=='PUT')return route.fallback();
        attempted.push(JSON.parse(route.request().postData()));
        await route.fulfill({status:422,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({message:'Synthetic validation failure'})});
      });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    await page.locator('#liveTextAlign').selectOption('right');
    await page.locator('#save').click();
    const saved=await page.evaluate(file=>
      localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-422-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect(page.locator('#publishError'))
      .toContainText('GitHub rejected the update (HTTP 422)',{timeout:20000});
    expect(attempted).toHaveLength(1);
    expect(attempted[0].sha).toBe(blobSha(SOURCE.get(name)));
    expect(writes).toEqual([]);
    expect(await page.evaluate(file=>
      localStorage.getItem('moon-academic-editor-v2:source:'+file),name))
      .toBe(saved);
    await expect(page.locator('#publishResult')).toBeHidden();
    await expect(page.locator('#confirmPublish')).toBeEnabled();
  });


test('A delayed deployed image list cannot replace verified GitHub assets',
  async({page})=>{
    const name='projects.html',writes=[],actualSource=SOURCE.get(name).toString('utf8');
    await installVerifiedCurrentSource(page,writes);
    let deployedRequests=0;
    // This is deliberately older than GitHub main. Delay it long enough to
    // arrive after verified source extraction, reproducing the real race.
    await page.route('**/projects.html',async route=>{
      deployedRequests++;
      await new Promise(resolve=>setTimeout(resolve,600));
      await route.fulfill({status:200,contentType:'text/html',
        body:'<!doctype html><html><body><main>'+
          '<img src="assets/stale-gallery-should-not-be-shown.webp" alt="Outdated image">'+
          '</main></body></html>'});
    });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const expected=await page.evaluate(html=>{
      const doc=new DOMParser().parseFromString(html,'text/html');
      return [...new Set([...doc.querySelectorAll('main img[src]')]
        .map(img=>img.getAttribute('src')))];
    },actualSource);
    expect(expected.length).toBeGreaterThan(0);
    await expect(page.locator('#imageLibrary button img')).toHaveCount(expected.length);
    await expect.poll(()=>deployedRequests,{timeout:5000}).toBeGreaterThan(0);
    await page.waitForTimeout(800);
    const actual=await page.locator('#imageLibrary button img').evaluateAll(nodes=>
      nodes.map(img=>img.getAttribute('src')));
    expect(actual).toEqual(expected);
    expect(actual).not.toContain('assets/stale-gallery-should-not-be-shown.webp');
    expect(writes).toEqual([]);
  });


test('Editor mode switches make live-versus-staging publishing destination explicit',
  async({page})=>{
    const writes=[];await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page=contact.html',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await expect(page.locator('#publish')).toHaveText('Publish live website');
    await expect(page.locator('#preview')).toHaveText('Verified live preview');
    await page.locator('#designMode').click();
    await expect(page.locator('#publish')).toHaveText('Publish staging preview');
    await expect(page.locator('#preview')).toHaveText('Canvas preview');
    await expect(page.locator('#workspacePill')).toContainText('staging only');
    await page.locator('#liveMode').click();
    await expect(page.locator('#publish')).toHaveText('Publish live website');
    await expect(page.locator('#preview')).toHaveText('Verified live preview');
    expect(writes).toEqual([]);
  });


test('Publishing a second change to the same source heading preserves the new intent',
  async({page})=>{
    const name='teaching.html',writes=[];
    const endpoint='https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name;
    let committed=SOURCE.get(name);
    const puts=[];
    await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
      async route=>{
        const req=route.request(),url=new URL(req.url());
        if(url.pathname!=='/repos/gmoon-code/gmoon-code.github.io/contents/'+name){
          writes.push({method:req.method(),url:req.url()});
          await route.abort();return;
        }
        if(req.method()==='GET'){
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({type:'file',name,sha:blobSha(committed),
              encoding:'base64',content:committed.toString('base64')})});
          return;
        }
        if(req.method()==='PUT'){
          const put=JSON.parse(req.postData());
          expect(put.sha).toBe(blobSha(committed));
          const updated=Buffer.from(put.content,'base64');
          puts.push({put,html:updated.toString('utf8')});
          committed=updated;
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({commit:{sha:'mock-same-heading-'+puts.length}})});
          return;
        }
        writes.push({method:req.method(),url:req.url()});
        await route.abort();
      });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    const first='right',second='center';
    for(const [index,wanted] of [first,second].entries()){
      await heading.click();
      await page.locator('#liveTextAlign').selectOption(wanted);
      await expect(heading).toHaveCSS('text-align',wanted);
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      const preview=await page.locator('#previewFrame').getAttribute('srcdoc');
      await page.locator('#closePreview').click();
      await page.locator('#publish').click();
      await page.locator('#githubToken').fill('synthetic-reedit-token');
      await page.locator('#acknowledgeLive').check();
      await page.locator('#confirmPublish').click();
      await expect.poll(()=>puts.length,{timeout:25000}).toBe(index+1);
      await expect(page.locator('#publishDialog')).not.toBeVisible({timeout:25000});
      expect(puts[index].html,'published HTML must match verified preview').toBe(preview);
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await expect(heading).toHaveCSS('text-align',wanted);
    }
    expect(puts[1].put.sha).toBe(blobSha(Buffer.from(puts[0].html)));
    expect(puts[1].html).not.toBe(puts[0].html);
    expect(writes).toEqual([]);
    expect(await page.evaluate(()=>JSON.stringify(localStorage)))
      .not.toContain('synthetic-reedit-token');
  });


for(const name of ['projects.html','research.html','interests.html','pungmul.html']){
  test('Real-page photo description change publishes exact verified preview on '+name,
    async({page})=>{
      const otherWrites=[],puts=[];
      await installVerifiedCurrentSource(page,otherWrites);
      await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
        async route=>{
          if(route.request().method()!=='PUT')return route.fallback();
          puts.push(JSON.parse(route.request().postData()));
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({commit:{sha:'mock-photo-accessibility-'+name}})});
        });
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const image=page.frameLocator('#livePageFrame').locator('main img:visible').first();
      await expect(image).toBeVisible();
      const source=await image.getAttribute('src');
      const alt='Synthetic edited photo description for '+name;
      await image.click();
      await expect(page.locator('#liveImageControls')).toBeVisible();
      await expect(page.locator('#liveImageSrc')).toHaveValue(source);
      await page.evaluate(()=>{
        window.__imageEditTrace=[];
        const field=document.getElementById('liveImageAlt');
        const native=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
        Object.defineProperty(field,'value',{
          configurable:true,
          get(){return native.get.call(this);},
          set(v){
            window.__imageEditTrace.push({kind:'script-value-set',value:String(v).slice(0,110),
              stack:new Error().stack?.slice(0,500)});
            return native.set.call(this,v);
          }
        });
        for(const type of ['focus','input','change','blur']){
          field.addEventListener(type,()=>{
            window.__imageEditTrace.push({kind:'event-'+type,value:field.value.slice(0,110)});
          });
        }
      });
      // A real user clicks the image-description field after selecting a
      // photo inside the iframe. In Firefox, direct Playwright fill can leave
      // focus in the iframe and dispatch no input event unless this transfer
      // is explicit, producing an artificial editor no-op.
      await page.evaluate(()=>{
        window.__pointerInspectorTrace=[];
        for(const eventName of ['pointerdown','click','focusin','focusout'])
          document.addEventListener(eventName,event=>{
            window.__pointerInspectorTrace.push({name:eventName,
              target:event.target?.id||event.target?.tagName,
              active:document.activeElement?.id,
              elementUnderPointer:event.clientX===undefined?null:
                document.elementFromPoint(event.clientX,event.clientY)?.id});
          },true);
      });
      await page.locator('#liveImageAlt').click();
      const focusEvidence=await page.evaluate(()=>{
        const field=document.getElementById('liveImageAlt');
        const rect=field.getBoundingClientRect();
        return {active:document.activeElement?.id,
          fieldRect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
          hit:document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.id,
          pointer:window.__pointerInspectorTrace,events:window.__imageEditTrace};
      });
      if(focusEvidence.active!=='liveImageAlt')
        console.log('FIREFOX-IMAGE-FOCUS-TRACE',JSON.stringify({page:name,focusEvidence}));
      await expect.poll(()=>page.evaluate(()=>document.activeElement?.id))
        .toBe('liveImageAlt');
      await page.locator('#liveImageAlt').fill(alt);
      const immediately=await page.locator('#liveImageAlt').inputValue();
      if(immediately!==alt){
        const trace=await page.evaluate(()=>({
          events:window.__imageEditTrace,
          field:document.getElementById('liveImageAlt').value.slice(0,110),
          selection:document.getElementById('liveSelectionLabel').textContent.slice(0,110),
          focus:document.activeElement?.id,
          status:document.getElementById('status').textContent
        }));
        console.log('IMAGE-FIELD-TRACE',JSON.stringify({page:name,trace}));
      }
      await expect(page.locator('#liveImageAlt')).toHaveValue(alt);
      await page.locator('#applyLiveImage').click();
      const appliedAlt=await image.getAttribute('alt');
      if(appliedAlt!==alt){
        const inspector=await page.locator('#liveImageAlt').inputValue();
        const editorStatus=await page.locator('#status').innerText();
        const draft=await page.evaluate(file=>
          localStorage.getItem('moon-academic-editor-v2:source:'+file),name);
        console.log('IMAGE-EDIT-DIAGNOSTIC',JSON.stringify({page:name,requested:alt,
          applied:appliedAlt,inspector,editorStatus,draft:JSON.parse(draft||'[]')
            .map(p=>({kind:p.kind,selector:p.selector,alt:p.alt,src:p.src?.slice(0,65)}))}));
      }
      await expect(image).toHaveAttribute('src',source);
      await expect(image).toHaveAttribute('alt',alt);
      await page.locator('#save').click();
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      await expect(page.frameLocator('#previewFrame').locator('main img').first())
        .toHaveAttribute('alt',alt,{timeout:20000});
      const expectedHtml=await page.locator('#previewFrame').getAttribute('srcdoc');
      await page.locator('#closePreview').click();
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await expect(page.frameLocator('#livePageFrame').locator('main img:visible').first())
        .toHaveAttribute('alt',alt,{timeout:20000});
      await page.locator('#publish').click();
      await page.locator('#githubToken').fill('synthetic-photo-edit-token');
      await page.locator('#acknowledgeLive').check();
      await page.locator('#confirmPublish').click();
      await expect.poll(()=>puts.length,{timeout:20000}).toBe(1);
      expect(puts[0].sha).toBe(blobSha(SOURCE.get(name)));
      const submitted=Buffer.from(puts[0].content,'base64').toString('utf8');
      expect(submitted,name+' preview and submitted HTML equality').toBe(expectedHtml);
      const sourceRefs=await page.evaluate(({before,after})=>{
        const parser=new DOMParser();
        const a=parser.parseFromString(before,'text/html');
        const b=parser.parseFromString(after,'text/html');
        return {before:[...a.querySelectorAll('main img')].map(x=>x.getAttribute('src')),
          after:[...b.querySelectorAll('main img')].map(x=>x.getAttribute('src'))};
      },{before:SOURCE.get(name).toString('utf8'),after:submitted});
      expect(sourceRefs.after).toEqual(sourceRefs.before);
      expect(otherWrites).toEqual([]);
      expect(await page.evaluate(()=>JSON.stringify(localStorage)))
        .not.toContain('synthetic-photo-edit-token');
    });
}


test('Quick start shows how to edit and publish live rather than staging',
  async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page=index.html',{waitUntil:'domcontentloaded'});
    const guide=page.locator('#editorQuickStart');
    await expect(guide).toBeVisible();
    await expect(guide).not.toHaveAttribute('open','');
    await guide.locator('summary').click();
    await expect(guide).toHaveAttribute('open','');
    await expect(guide).toContainText('Verified live preview');
    await expect(guide).toContainText('Publish live website');
    await expect(guide).toContainText('staging previews only');
    expect(writes).toEqual([]);
  });


test('Pungmul photo description keeps crop and rotation through draft, preview and mock publication',
  async({page})=>{
    const name='pungmul.html',otherWrites=[],puts=[];
    await installVerifiedCurrentSource(page,otherWrites);
    await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
      async route=>{
        if(route.request().method()!=='PUT')return route.fallback();
        puts.push(JSON.parse(route.request().postData()));
        await route.fulfill({status:200,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({commit:{sha:'mock-photo-combined-edit'}})});
      });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const image=page.frameLocator('#livePageFrame').locator('main img:visible').first();
    await image.click();
    const src=await image.getAttribute('src');
    await page.locator('#liveCropShape').selectOption('rounded');
    await page.locator('#livePictureRotation').fill('30');
    await page.locator('#livePictureRotation').dispatchEvent('change');
    const saved=()=>page.evaluate(file=>JSON.parse(
      localStorage.getItem('moon-academic-editor-v2:source:'+file)||'[]'),name);
    const initial=(await saved()).find(p=>p.kind==='image'&&p.imageCrop&&p.pictureEffects);
    expect(initial,'crop and rotation must both exist before editing alt text').toBeTruthy();
    expect(initial.imageCrop.desktop.mask).toBe('rounded');
    expect(initial.pictureEffects.desktop.rotation).toBe(30);

    const alt='Synthetic Pungmul description after framing and rotation';
    await page.locator('#liveImageAlt').click();
    await page.locator('#liveImageAlt').fill(alt);
    await page.locator('#applyLiveImage').click();
    await expect(image).toHaveAttribute('src',src);
    await expect(image).toHaveAttribute('alt',alt);
    const edited=(await saved()).find(p=>p.selector===initial.selector);
    expect(edited.alt).toBe(alt);
    expect(edited.imageCrop).toEqual(initial.imageCrop);
    expect(edited.pictureEffects).toEqual(initial.pictureEffects);
    expect(edited.layout).toEqual(initial.layout);

    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const preview=page.frameLocator('#previewFrame').locator('main img').first();
    await expect(preview).toHaveAttribute('alt',alt);
    const html=await page.locator('#previewFrame').getAttribute('srcdoc');
    expect(html).toContain('data-moon-v2-image-crop');
    expect(html).toContain('data-moon-v2-picture-effects');
    await page.locator('#closePreview').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await expect(page.frameLocator('#livePageFrame').locator('main img:visible').first())
      .toHaveAttribute('alt',alt);
    expect((await saved()).find(p=>p.selector===initial.selector).pictureEffects)
      .toEqual(initial.pictureEffects);

    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-combined-photo-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect.poll(()=>puts.length,{timeout:25000}).toBe(1);
    expect(Buffer.from(puts[0].content,'base64').toString('utf8')).toBe(html);
    expect(puts[0].sha).toBe(blobSha(SOURCE.get(name)));
    expect(otherWrites).toEqual([]);
  });

test('Editing grouped Contact text retains source group membership after reload and preview',
  async({page})=>{
    const name='contact.html',writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const live=page.frameLocator('#livePageFrame');
    const first=live.locator('p.contact-introduction');
    const second=live.locator('p.contact-card-heading');
    await first.click();
    await second.click({modifiers:['Shift']});
    await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
    await expect(page.locator('#liveGroup')).toBeEnabled();
    await page.locator('#liveGroup').click();
    const draft=()=>page.evaluate(file=>JSON.parse(
      localStorage.getItem('moon-academic-editor-v2:source:'+file)||'[]'),name);
    const grouped=(await draft()).filter(p=>typeof p.groupId==='string');
    expect(grouped).toHaveLength(2);
    expect(grouped[0].groupId).toBe(grouped[1].groupId);

    await page.locator('#editLiveText').click();
    const changed='Synthetic revised contact heading within a grouped pair';
    await second.fill(changed);
    await page.locator('#saveLiveText').click();
    const after=await draft();
    const textPatch=after.find(p=>p.kind==='text'&&p.html.includes(changed));
    expect(textPatch,'saved content edit must keep its original group').toBeTruthy();
    expect(textPatch.groupId).toBe(grouped[0].groupId);
    expect(after.filter(p=>p.groupId===grouped[0].groupId)).toHaveLength(2);

    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await expect(second).toHaveText(changed);
    await first.click();
    await expect(page.locator('#liveMultiCount')).toHaveText('2 selected');
    await expect(page.locator('#liveUngroup')).toBeEnabled();
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    await expect(page.frameLocator('#previewFrame').locator('p.contact-card-heading'))
      .toHaveText(changed);
    await page.locator('#closePreview').click();
    expect(writes).toEqual([]);
  });


test('Unreadable live draft is preserved byte-for-byte, cannot publish, and recovers explicitly',
  async({page})=>{
    const name='contact.html',writes=[],key='moon-academic-editor-v2:source:'+name;
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const invalid='[{"kind":"text","selector": "incomplete"';
    await page.evaluate(({key,invalid})=>localStorage.setItem(key,invalid),{key,invalid});
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveDraftRecovery')).toBeVisible();
    await expect(page.locator('#liveEditCount')).toContainText('needs recovery');
    await page.locator('#exportLiveDraftJson').click();
    await expect(page.locator('#status')).toContainText('Unreadable stored draft has no recoverable edits');
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(invalid);
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    await page.locator('#liveTextAlign').selectOption('right');
    await page.locator('#save').click();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(invalid);

    await page.locator('#preview').click();
    await expect(page.locator('#status')).toContainText('Stored draft is unreadable');
    await expect(page.locator('#previewDialog')).not.toBeVisible();
    await page.locator('#publish').click();
    await expect(page.locator('#publishDialog')).toBeVisible();
    await page.locator('#githubToken').fill('synthetic-unreadable-draft-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect(page.locator('#publishError')).toContainText('Stored draft is unreadable');
    expect(writes).toEqual([]);
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(invalid);
    await page.locator('#cancelPublish').click();

    const downloaded=page.waitForEvent('download');
    await page.locator('#downloadUnreadableLiveDraft').click();
    const file=await downloaded;
    expect(file.suggestedFilename()).toBe(name+'.unreadable-saved-draft.txt');
    expect(readFileSync(await file.path(),'utf8')).toBe(invalid);
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(invalid);

    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('#discardUnreadableLiveDraft').click();
    await expect(page.locator('#liveDraftRecovery')).toBeVisible();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(invalid);

    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#discardUnreadableLiveDraft').click();
    await expect(page.locator('#liveDraftRecovery')).toBeHidden();
    const restored=await page.evaluate(key=>localStorage.getItem(key),key);
    expect(JSON.parse(restored)).toHaveLength(1);
    expect(JSON.parse(restored)[0].appearance.align).toBe('right');
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveDraftRecovery')).toBeHidden();
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    expect(writes).toEqual([]);
  });

test('Partly invalid, duplicate and oversized stored drafts never load a partial subset',
  async({page})=>{
    const name='research.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const current=await page.locator('#liveTextAlign').inputValue();
    const desired=current==='center'?'right':'center';
    await page.locator('#liveTextAlign').selectOption(desired);
    const valid=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    expect(valid).toHaveLength(1);
    const corruptions=[
      JSON.stringify([...valid,{selector:'bad',kind:'text'}]),
      JSON.stringify([valid[0],valid[0]]),
      JSON.stringify(Array.from({length:181},()=>valid[0])),
      JSON.stringify({not:'a patch list'})
    ];
    for(const raw of corruptions){
      await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await expect(page.locator('#liveDraftRecovery')).toBeVisible();
      await expect(page.locator('#liveEditCount')).toContainText('needs recovery');
      await expect(heading).not.toHaveCSS('text-align',desired);
      await page.locator('#save').click();
      expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
      await page.locator('#page').selectOption('contact.html');
      await expect(page.locator('#liveDraftRecovery')).toBeHidden();
      await page.locator('#page').selectOption(name);
      await expect(page.locator('#liveDraftRecovery')).toBeVisible();
      expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
    }
    expect(writes).toEqual([]);
  });


test('Two real editor tabs preserve the newer valid draft and require explicit overwrite',
  async({page,context})=>{
    const name='contact.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    const other=await context.newPage();
    await installVerifiedCurrentSource(other,writes);
    for(const tab of [page,other]){
      await tab.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(tab.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
    }
    const heading=tab=>tab.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading(page).click();
    const initial=await page.locator('#liveTextAlign').inputValue();
    const chosenA=initial==='right'?'center':'right';
    const chosenB=initial==='left'?'center':'left';
    await page.locator('#liveTextAlign').selectOption(chosenA);
    const savedA=await page.evaluate(key=>localStorage.getItem(key),key);
    expect(JSON.parse(savedA)).toHaveLength(1);
    await expect(other.locator('#liveDraftConflict')).toBeVisible({timeout:10000});
    await expect(other.locator('#restoreConflictingLiveDraft')).toBeVisible();
    await heading(other).click();
    await other.locator('#liveTextAlign').selectOption(chosenB);
    await other.locator('#save').click();
    expect(await other.evaluate(key=>localStorage.getItem(key),key)).toBe(savedA);
    await expect(other.locator('#liveEditCount')).toContainText('Another tab changed');

    const downloaded=other.waitForEvent('download');
    await other.locator('#downloadConflictingLiveDraft').click();
    const backup=await downloaded;
    expect(backup.suggestedFilename()).toBe(name+'.unsaved-live-edits.json');
    const backupRecords=JSON.parse(readFileSync(await backup.path(),'utf8'));
    expect(backupRecords).toHaveLength(1);
    expect(backupRecords[0].appearance.align).toBe(chosenB);
    expect(await other.evaluate(key=>localStorage.getItem(key),key)).toBe(savedA);

    await other.locator('#publish').click();
    await expect(other.locator('#publishDialog')).toBeVisible();
    await other.locator('#githubToken').fill('synthetic-cross-tab-token');
    await other.locator('#acknowledgeLive').check();
    await other.locator('#confirmPublish').click();
    await expect(other.locator('#publishError')).toContainText('Another editor tab');
    expect(writes).toEqual([]);
    await other.locator('#cancelPublish').click();

    other.once('dialog',dialog=>dialog.dismiss());
    await other.locator('#overwriteNewerLiveDraft').click();
    await expect(other.locator('#liveDraftConflict')).toBeVisible();
    expect(await other.evaluate(key=>localStorage.getItem(key),key)).toBe(savedA);

    other.once('dialog',dialog=>dialog.accept());
    await other.locator('#overwriteNewerLiveDraft').click();
    await expect(other.locator('#liveDraftConflict')).toBeHidden();
    const savedB=await other.evaluate(key=>localStorage.getItem(key),key);
    expect(JSON.parse(savedB)[0].appearance.align).toBe(chosenB);
    await expect(page.locator('#liveDraftConflict')).toBeVisible({timeout:10000});

    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('#loadNewerLiveDraft').click();
    await expect(page.locator('#liveDraftConflict')).toBeVisible();
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#loadNewerLiveDraft').click();
    await expect(page.locator('#liveDraftConflict')).toBeHidden();
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(savedB);
    await heading(page).click();
    await expect(page.locator('#liveTextAlign')).toHaveValue(chosenB);
    expect(writes).toEqual([]);
    await other.close();
  });

test('Switching pages with a cross-tab draft conflict requires explicit confirmation',
  async({page,context})=>{
    const name='research.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    const other=await context.newPage();
    await installVerifiedCurrentSource(other,writes);
    for(const tab of [page,other]){
      await tab.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(tab.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
    }
    const heading=tab=>tab.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading(page).click();
    const current=await page.locator('#liveTextAlign').inputValue();
    await page.locator('#liveTextAlign').selectOption(current==='right'?'center':'right');
    const original=await page.evaluate(key=>localStorage.getItem(key),key);
    await expect(other.locator('#liveDraftConflict')).toBeVisible();
    await heading(other).click();
    const otherCurrent=await other.locator('#liveTextAlign').inputValue();
    await other.locator('#liveTextAlign').selectOption(otherCurrent==='left'?'right':'left');
    await other.locator('#save').click();
    expect(await other.evaluate(key=>localStorage.getItem(key),key)).toBe(original);

    other.once('dialog',dialog=>dialog.dismiss());
    await other.locator('#page').selectOption('contact.html');
    await expect(other.locator('#page')).toHaveValue(name);
    await expect(other.locator('#liveDraftConflict')).toBeVisible();

    other.once('dialog',dialog=>dialog.accept());
    await other.locator('#page').selectOption('contact.html');
    await expect(other.locator('#page')).toHaveValue('contact.html');
    await expect(other.locator('#liveDraftConflict')).toBeHidden();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(original);
    expect(writes).toEqual([]);
    await other.close();
  });


test('A second tab saving during GitHub source verification stops publication before PUT',
  async({page,context})=>{
    const name='contact.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first().click();
    const current=await page.locator('#liveTextAlign').inputValue();
    await page.locator('#liveTextAlign').selectOption(current==='right'?'center':'right');
    const initial=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    expect(initial).toHaveLength(1);
    const newer=structuredClone(initial);
    newer[0].appearance.align=initial[0].appearance.align==='left'?'right':'left';
    const newerRaw=JSON.stringify(newer);
    const other=await context.newPage();
    await installVerifiedCurrentSource(other,writes);
    await other.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(other.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});

    let intercepted=0;
    await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\/contents\/contact\.html\?ref=main$/,
      async route=>{
        if(route.request().method()==='GET'){
          intercepted++;
          await other.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:newerRaw});
        }
        await route.fallback();
      });
    await page.locator('#publish').click();
    await expect(page.locator('#publishDialog')).toBeVisible();
    await page.locator('#githubToken').fill('synthetic-race-guard-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect(page.locator('#publishError')).toContainText('Another editor tab');
    expect(intercepted).toBeGreaterThan(0);
    expect(writes).toEqual([]);
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(newerRaw);
    await expect(page.locator('#liveDraftConflict')).toBeVisible();
    await other.close();
  });


test('Editable live draft JSON downloads and restores the full Contact page edit',
  async({page})=>{
    const name='contact.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const starting=await page.locator('#liveTextAlign').inputValue();
    const desired=starting==='right'?'center':'right';
    await page.locator('#liveTextAlign').selectOption(desired);
    const original=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    expect(original).toHaveLength(1);
    const downloadPromise=page.waitForEvent('download');
    await page.locator('#exportLiveDraftJson').click();
    const download=await downloadPromise;
    expect(download.suggestedFilename()).toBe(name+'.live-draft.json');
    const backup=JSON.parse(readFileSync(await download.path(),'utf8'));
    expect(backup).toMatchObject({
      format:'moon-editor-v2-live-draft',version:1,page:name,patches:original
    });
    await page.evaluate(key=>localStorage.removeItem(key),key);
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await expect(page.locator('#liveEditCount')).toContainText('No live-page draft edits');
    await expect(heading).not.toHaveCSS('text-align',desired);
    await page.locator('#liveDraftFile').setInputFiles({
      name:download.suggestedFilename(),mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(backup))
    });
    await expect(page.locator('#liveDraftRestoreDialog')).toBeVisible();
    await page.locator('#confirmLiveDraftRestore').click();
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    await expect(page.locator('#status')).toContainText('restored locally');
    expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)))
      .toEqual(original);
    await expect(heading).toHaveCSS('text-align',desired);
    await page.locator('#preview').click();
    await expect(page.locator('#previewSourceStatus')).toContainText('GitHub main');
    await expect(page.locator('#previewDialog')).toBeVisible();
    await page.locator('#closePreview').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    await expect(heading).toHaveCSS('text-align',desired);
    expect(writes).toEqual([]);
  });

test('Live draft JSON import refuses mismatched pages, malformed data, and stale selectors',
  async({page})=>{
    const name='research.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const oldAlign=await page.locator('#liveTextAlign').inputValue();
    await page.locator('#liveTextAlign').selectOption(oldAlign==='right'?'center':'right');
    const originalRaw=await page.evaluate(key=>localStorage.getItem(key),key);
    const valid=JSON.parse(originalRaw);
    const cases=[
      {name:name+'.live-draft.json',body:'not valid JSON'},
      {name:name+'.live-draft.json',
        body:JSON.stringify({format:'moon-editor-v2-live-draft',version:1,page:'contact.html',patches:valid})},
      {name:name+'.live-draft.json',
        body:JSON.stringify({format:'moon-editor-v2-live-draft',version:1,page:name,patches:[...valid,...valid]})},
      {name:name+'.live-draft.json',
        body:JSON.stringify({format:'moon-editor-v2-live-draft',version:1,page:name,patches:[{selector:'bad',kind:'text'}]})},
      {name:name+'.live-draft.json',
        body:JSON.stringify({format:'moon-editor-v2-live-draft',version:1,page:name,
          patches:[{...valid[0],expected:'No academic heading with this expected text.'}]})},
      {name:'canvas.json',
        body:JSON.stringify({version:2,page:name,objects:[]})},
      {name:'unlabelled.json',body:JSON.stringify(valid)}
    ];
    for(const failure of cases){
      await page.locator('#liveDraftFile').setInputFiles({
        name:failure.name,mimeType:'application/json',buffer:Buffer.from(failure.body)
      });
      await expect(page.locator('#status')).toContainText('Draft restore rejected');
      expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(originalRaw);
      await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    }
    expect(writes).toEqual([]);
  });

test('Legacy two-tab edit records and unreadable stored drafts restore without data loss',
  async({page})=>{
    const name='contact.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const starting=await page.locator('#liveTextAlign').inputValue();
    const desired=starting==='right'?'center':'right';
    await page.locator('#liveTextAlign').selectOption(desired);
    const previous=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    const unreadable='[{"bad":"saved text"';
    await page.evaluate(({key,unreadable})=>localStorage.setItem(key,unreadable),
      {key,unreadable});
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveDraftRecovery')).toBeVisible();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(unreadable);
    await expect(page.locator('#restoreUnreadableLiveDraft')).toBeVisible();
    let chooser=page.waitForEvent('filechooser');
    await page.locator('#restoreUnreadableLiveDraft').click();
    await (await chooser).setFiles({
      name:name+'.unsaved-live-edits.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(previous))
    });
    await expect(page.locator('#liveDraftRestoreDialog')).toBeVisible();
    await page.locator('#cancelLiveDraftRestore').click();
    await expect(page.locator('#status')).toContainText('Restore cancelled');
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(unreadable);
    await expect(page.locator('#liveDraftRecovery')).toBeVisible();
    chooser=page.waitForEvent('filechooser');
    await page.locator('#restoreUnreadableLiveDraft').click();
    await (await chooser).setFiles({
      name:name+'.unsaved-live-edits.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(previous))
    });
    await expect(page.locator('#liveDraftRestoreDialog')).toBeVisible();
    await page.locator('#confirmLiveDraftRestore').click();
    await expect(page.locator('#liveDraftRecovery')).toBeHidden();
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)))
      .toEqual(previous);
    await expect(heading).toHaveCSS('text-align',desired);
    expect(writes).toEqual([]);
  });

test('A second tab writing during JSON restore confirmation cannot be overwritten',
  async({page,context})=>{
    const name='contact.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    const other=await context.newPage();
    await installVerifiedCurrentSource(other,writes);
    for(const tab of [page,other]){
      await tab.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(tab.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
    }
    await page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first().click();
    const starting=await page.locator('#liveTextAlign').inputValue();
    const desired=starting==='right'?'center':'right';
    await page.locator('#liveTextAlign').selectOption(desired);
    const baseRaw=await page.evaluate(key=>localStorage.getItem(key),key);
    const backup={format:'moon-editor-v2-live-draft',version:1,page:name,
      patches:JSON.parse(baseRaw)};
    const newer=JSON.parse(baseRaw);
    newer[0].appearance.align=desired==='left'?'right':'left';
    const newerRaw=JSON.stringify(newer);
    await page.locator('#liveDraftFile').setInputFiles({
      name:name+'.live-draft.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(backup))
    });
    await expect(page.locator('#liveDraftRestoreDialog')).toBeVisible();
    await other.evaluate(({key,raw})=>localStorage.setItem(key,raw),
      {key,raw:newerRaw});
    await page.locator('#confirmLiveDraftRestore').click();
    await expect(page.locator('#liveDraftConflict')).toBeVisible();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(newerRaw);
    expect(writes).toEqual([]);
    await other.close();
  });


test('Pungmul image mask, crop, rotation and description survive editable JSON backup restore',
  async({page})=>{
    const name='pungmul.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const photo=page.frameLocator('#livePageFrame').locator('main img:visible').first();
    await photo.click();
    await page.locator('#liveCropShape').selectOption('rounded');
    await page.locator('#livePictureRotation').fill('25');
    await page.locator('#livePictureRotation').dispatchEvent('change');
    const alt='Pungmul photo with restorable mask and rotation';
    await page.locator('#liveImageAlt').fill(alt);
    await page.locator('#applyLiveImage').click();
    const original=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    const patch=original.find(p=>p.kind==='image'&&p.imageCrop&&p.pictureEffects);
    expect(patch).toBeTruthy();
    expect(patch.imageCrop.desktop.mask).toBe('rounded');
    expect(patch.pictureEffects.desktop.rotation).toBe(25);
    expect(patch.alt).toBe(alt);
    const file={format:'moon-editor-v2-live-draft',version:1,page:name,patches:original};
    await page.evaluate(key=>localStorage.removeItem(key),key);
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await page.locator('#liveDraftFile').setInputFiles({
      name:name+'.live-draft.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(file))
    });
    await expect(page.locator('#liveDraftRestoreDialog')).toBeVisible();
    await page.locator('#confirmLiveDraftRestore').click();
    await expect(page.locator('#status')).toContainText('restored locally');
    await expect(photo).toHaveAttribute('alt',alt);
    const reloaded=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    const restored=reloaded.find(p=>p.selector===patch.selector);
    expect(restored.imageCrop).toEqual(patch.imageCrop);
    expect(restored.pictureEffects).toEqual(patch.pictureEffects);
    expect(restored.alt).toBe(patch.alt);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const html=await page.locator('#previewFrame').getAttribute('srcdoc');
    expect(html).toContain('data-moon-v2-image-crop');
    expect(html).toContain('data-moon-v2-picture-effects');
    expect(html).toContain(alt);
    expect(writes).toEqual([]);
  });


test('Storage quota rejection retains live edits, downloadable backup and blocks publishing',
  async({page})=>{
    const name='contact.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await page.evaluate(()=>{
      window.__realStorageSetItem=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        if(String(key).startsWith('moon-academic-editor-v2:source:'))
          throw new DOMException('Storage quota exceeded','QuotaExceededError');
        return window.__realStorageSetItem.call(this,key,value);
      };
    });
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const original=await page.locator('#liveTextAlign').inputValue();
    const desired=original==='right'?'center':'right';
    await page.locator('#liveTextAlign').selectOption(desired);
    await expect(page.locator('#liveDraftStorageFailure')).toBeVisible();
    await expect(page.locator('#liveEditCount')).toContainText('in memory only');
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
    await expect(heading).toHaveCSS('text-align',desired);

    const backupPromise=page.waitForEvent('download');
    await page.locator('#downloadUnsavedStorageDraft').click();
    const backup=await backupPromise;
    expect(backup.suggestedFilename()).toBe(name+'.live-draft.json');
    const json=JSON.parse(readFileSync(await backup.path(),'utf8'));
    expect(json).toMatchObject({
      format:'moon-editor-v2-live-draft',version:1,page:name
    });
    expect(json.patches).toHaveLength(1);
    expect(json.patches[0].appearance.align).toBe(desired);

    await page.locator('#publish').click();
    await expect(page.locator('#publishDialog')).toBeVisible();
    await page.locator('#githubToken').fill('synthetic-quota-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect(page.locator('#publishError')).toContainText('could not be saved');
    expect(writes).toEqual([]);
    await page.locator('#cancelPublish').click();

    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('#page').selectOption('research.html');
    await expect(page.locator('#page')).toHaveValue(name);
    await expect(page.locator('#liveDraftStorageFailure')).toBeVisible();
    await page.locator('#retryLiveDraftSave').click();
    await expect(page.locator('#liveDraftStorageFailure')).toBeVisible();
    await page.evaluate(()=>{
      Storage.prototype.setItem=window.__realStorageSetItem;
      delete window.__realStorageSetItem;
    });
    await page.locator('#retryLiveDraftSave').click();
    await expect(page.locator('#liveDraftStorageFailure')).toBeHidden();
    const stored=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    expect(stored).toHaveLength(1);
    expect(stored[0].appearance.align).toBe(desired);
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveDraftStorageFailure')).toBeHidden();
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    expect(writes).toEqual([]);
  });

test('Read-denied browser draft storage displays a persistent recoverable warning',
  async({page})=>{
    const name='research.html',writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await page.evaluate(()=>{
      window.__realStorageGetItem=Storage.prototype.getItem;
      Storage.prototype.getItem=function(key){
        if(String(key).startsWith('moon-academic-editor-v2:source:'))
          throw new DOMException('Blocked by browser policy','SecurityError');
        return window.__realStorageGetItem.call(this,key);
      };
    });
    await page.locator('#page').selectOption('contact.html');
    await expect(page.locator('#liveDraftStorageFailure')).toBeVisible();
    await page.locator('#retryLiveDraftSave').click();
    await expect(page.locator('#liveDraftStorageFailure')).toBeVisible();
    const backupPromise=page.waitForEvent('download');
    await page.locator('#downloadUnsavedStorageDraft').click();
    const backup=JSON.parse(readFileSync(await (await backupPromise).path(),'utf8'));
    expect(backup).toMatchObject({
      format:'moon-editor-v2-live-draft',version:1,page:'contact.html',patches:[]
    });
    await page.evaluate(()=>{
      Storage.prototype.getItem=window.__realStorageGetItem;
      delete window.__realStorageGetItem;
    });
    await page.locator('#retryLiveDraftSave').click();
    await expect(page.locator('#liveDraftStorageFailure')).toBeHidden();
    expect(writes).toEqual([]);
  });


test('Canvas recovery: quota failure retains a backup and blocks staging publication',
  async({page})=>{
    const name='contact.html',key='moon-academic-editor-v2:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await page.locator('#designMode').click();
    await page.evaluate(()=>{
      window.__canvasRealSetItem=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        if(key==='moon-academic-editor-v2:contact.html')
          throw new DOMException('Quota full','QuotaExceededError');
        return window.__canvasRealSetItem.call(this,key,value);
      };
    });
    await page.locator('#addText').click();
    await expect(page.locator('#canvasDraftWarning')).toBeVisible();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBeNull();
    await expect(page.locator('#stage .scene-object')).toHaveCount(1);
    const exported=page.waitForEvent('download');
    await page.locator('#downloadCanvasBackup').click();
    const backup=await exported;
    expect(backup.suggestedFilename()).toBe(name+'.canvas.json');
    const data=JSON.parse(readFileSync(await backup.path(),'utf8'));
    expect(data.page).toBe(name);
    expect(data.objects).toHaveLength(1);

    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-canvas-quota-token');
    await page.locator('#confirmPublish').click();
    await expect(page.locator('#publishError')).toContainText('not been saved');
    expect(writes).toEqual([]);
    await page.locator('#cancelPublish').click();

    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('#page').selectOption('research.html');
    await expect(page.locator('#page')).toHaveValue(name);
    await expect(page.locator('#canvasDraftWarning')).toBeVisible();
    await page.locator('#retryCanvasSave').click();
    await expect(page.locator('#canvasDraftWarning')).toBeVisible();
    await page.evaluate(()=>{
      Storage.prototype.setItem=window.__canvasRealSetItem;
      delete window.__canvasRealSetItem;
    });
    await page.locator('#retryCanvasSave').click();
    await expect(page.locator('#canvasDraftWarning')).toBeHidden();
    expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).objects)
      .toHaveLength(1);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#designMode').click();
    await expect(page.locator('#stage .scene-object')).toHaveCount(1);
    expect(writes).toEqual([]);
  });

test('Canvas recovery: unreadable stored JSON survives editing until confirmed discard',
  async({page})=>{
    const name='contact.html',key='moon-academic-editor-v2:'+name;
    await installVerifiedCurrentSource(page,[]);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    const unreadable='{"version":2,"page":"contact.html","objects":';
    await page.evaluate(({key,unreadable})=>localStorage.setItem(key,unreadable),
      {key,unreadable});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#designMode').click();
    await expect(page.locator('#canvasDraftWarning')).toBeVisible();
    await expect(page.locator('#downloadCanvasOriginal')).toBeVisible();
    await page.locator('#addText').click();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(unreadable);
    const backup=page.waitForEvent('download');
    await page.locator('#downloadCanvasOriginal').click();
    const original=await backup;
    expect(readFileSync(await original.path(),'utf8')).toBe(unreadable);
    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('#discardCanvasOriginal').click();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(unreadable);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#discardCanvasOriginal').click();
    await expect(page.locator('#canvasDraftWarning')).toBeHidden();
    const repaired=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    expect(repaired.objects).toHaveLength(1);
  });

test('Canvas recovery: two tabs cannot silently overwrite each other',
  async({page,context})=>{
    const name='contact.html',key='moon-academic-editor-v2:'+name;
    await installVerifiedCurrentSource(page,[]);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await page.locator('#designMode').click();
    await page.locator('#addText').click();
    const other=await context.newPage();
    await installVerifiedCurrentSource(other,[]);
    await other.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await other.locator('#designMode').click();
    await expect(other.locator('#stage .scene-object')).toHaveCount(1);
    await page.locator('#addShape').click();
    const savedA=await page.evaluate(key=>localStorage.getItem(key),key);
    await expect(other.locator('#canvasDraftWarning')).toBeVisible();
    await other.locator('#addText').click();
    expect(await other.evaluate(key=>localStorage.getItem(key),key)).toBe(savedA);
    const download=other.waitForEvent('download');
    await other.locator('#downloadCanvasBackup').click();
    const backup=JSON.parse(readFileSync(await (await download).path(),'utf8'));
    expect(backup.objects.map(obj=>obj.type)).toEqual(['text','text']);
    other.once('dialog',dialog=>dialog.accept());
    await other.locator('#overwriteNewerCanvas').click();
    await expect(other.locator('#canvasDraftWarning')).toBeHidden();
    const savedB=JSON.parse(await other.evaluate(key=>localStorage.getItem(key),key));
    expect(savedB.objects.map(obj=>obj.type)).toEqual(['text','text']);
    expect(JSON.parse(savedA).objects.map(obj=>obj.type)).toEqual(['text','shape']);
    await other.close();
  });


test('Canvas recovery: denied storage reads retain an exportable in-memory draft',
  async({page})=>{
    const name='research.html',key='moon-academic-editor-v2:'+name;
    await installVerifiedCurrentSource(page,[]);
    await page.goto(BASE+'/editor-v2.html?page=contact.html',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{
      window.__canvasRealGetItem=Storage.prototype.getItem;
      Storage.prototype.getItem=function(key){
        if(key==='moon-academic-editor-v2:research.html')
          throw new DOMException('Storage denied','SecurityError');
        return window.__canvasRealGetItem.call(this,key);
      };
    });
    await page.locator('#page').selectOption(name);
    await page.locator('#designMode').click();
    await expect(page.locator('#canvasDraftWarning')).toBeVisible();
    await page.locator('#addShape').click();
    const backupEvent=page.waitForEvent('download');
    await page.locator('#downloadCanvasBackup').click();
    const backup=JSON.parse(readFileSync(await (await backupEvent).path(),'utf8'));
    expect(backup.page).toBe(name);
    expect(backup.objects).toHaveLength(1);
    await page.locator('#retryCanvasSave').click();
    await expect(page.locator('#canvasDraftWarning')).toBeVisible();
    await page.evaluate(()=>{
      Storage.prototype.getItem=window.__canvasRealGetItem;
      delete window.__canvasRealGetItem;
    });
    await page.locator('#retryCanvasSave').click();
    await expect(page.locator('#canvasDraftWarning')).toBeHidden();
    expect(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key)).objects)
      .toHaveLength(1);
  });

test('Canvas recovery: a JSON backup over the former 3 MB import cap is accepted',
  async({page})=>{
    const name='contact.html',key='moon-academic-editor-v2:'+name;
    await installVerifiedCurrentSource(page,[]);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await page.locator('#designMode').click();
    await page.locator('#addText').click();
    const source=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),key));
    source.backupNotes='x'.repeat(3200000);
    const backup=Buffer.from(JSON.stringify(source),'utf8');
    expect(backup.byteLength).toBeGreaterThan(3000000);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#sceneFile').setInputFiles({
      name:name+'.canvas.json',mimeType:'application/json',buffer:backup
    });
    await expect(page.locator('#stage .scene-object')).toHaveCount(1);
    await expect(page.locator('#status')).not.toContainText('JSON backup exceeds 3 MB');
    await expect(page.locator('#status')).not.toContainText('JSON import rejected');
  });


test('Token-free GitHub handoff exports exact verified preview HTML without publishing',
  async({page})=>{
    const name='contact.html',writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const previous=await page.locator('#liveTextAlign').inputValue();
    const next=previous==='right'?'center':'right';
    await page.locator('#liveTextAlign').selectOption(next);
    await expect(heading).toHaveCSS('text-align',next);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const verifiedHtml=await page.locator('#previewFrame').getAttribute('srcdoc');
    expect(verifiedHtml).toContain('<main');
    await page.locator('#closePreview').click();

    await page.evaluate(()=>{
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
        writeText:async value=>{window.__githubWebCopied=value;}
      }});
    });
    await page.locator('#publish').click();
    await expect(page.locator('#githubWebPublish')).toBeVisible();
    await expect(page.locator('#githubToken')).toHaveValue('');
    await page.locator('#prepareGithubWebEdit').click();
    await expect(page.locator('#githubWebPublishReady')).toBeVisible();
    await expect(page.locator('#githubWebPublishDetails')).toContainText(name);
    await expect(page.locator('#openGithubWebPage')).toHaveAttribute(
      'href','https://github.com/gmoon-code/gmoon-code.github.io/blob/main/'+name);
    const download=page.waitForEvent('download');
    await page.locator('#downloadGithubWebHtml').click();
    const exported=await download;
    expect(exported.suggestedFilename()).toBe(name);
    expect(readFileSync(await exported.path(),'utf8')).toBe(verifiedHtml);
    await page.locator('#copyGithubWebHtml').click();
    expect(await page.evaluate(()=>window.__githubWebCopied)).toBe(verifiedHtml);
    await expect(page.locator('#githubToken')).toHaveValue('');
    expect(writes).toEqual([]);
  });

test('Token-free GitHub handoff blocks a newer browser-tab draft without token or PUT',
  async({page})=>{
    const name='research.html',writes=[],key='moon-academic-editor-v2:source:'+name;
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const previous=await page.locator('#liveTextAlign').inputValue();
    await page.locator('#liveTextAlign').selectOption(previous==='right'?'center':'right');
    await page.locator('#publish').click();
    await page.evaluate(key=>localStorage.setItem(key,'[]'),key);
    await page.locator('#prepareGithubWebEdit').click();
    await expect(page.locator('#githubWebPublishError')).toContainText('Another editor tab');
    await expect(page.locator('#githubWebPublishReady')).toBeHidden();
    expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('[]');
    await expect(page.locator('#githubToken')).toHaveValue('');
    expect(writes).toEqual([]);
  });

test('Token-free GitHub handoff rejects a GitHub page changed after editor load',
  async({page})=>{
    const name='contact.html',writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const previous=await page.locator('#liveTextAlign').inputValue();
    await page.locator('#liveTextAlign').selectOption(previous==='right'?'center':'right');
    await page.locator('#publish').click();
    const changed=Buffer.from(SOURCE.get(name).toString('utf8')
      .replace('</main>','<!-- another GitHub editor updated this file --></main>'),'utf8');
    await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
      async route=>{
        if(route.request().method()!=='GET'){
          writes.push({method:route.request().method(),url:route.request().url()});
          await route.abort();return;
        }
        await route.fulfill({status:200,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({type:'file',name,sha:blobSha(changed),encoding:'base64',
            content:changed.toString('base64')})});
      });
    await page.locator('#prepareGithubWebEdit').click();
    await expect(page.locator('#githubWebPublishError')).toContainText('source has changed');
    await expect(page.locator('#githubWebPublishReady')).toBeHidden();
    expect(writes).toEqual([]);
  });


test('Token-free GitHub handoff keeps verified download available when clipboard is denied',
  async({page})=>{
    const name='contact.html',writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const previous=await page.locator('#liveTextAlign').inputValue();
    await page.locator('#liveTextAlign').selectOption(previous==='right'?'center':'right');
    await page.evaluate(()=>{
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
        writeText:async()=>{throw new DOMException('Clipboard denied','NotAllowedError');}
      }});
    });
    await page.locator('#publish').click();
    await page.locator('#prepareGithubWebEdit').click();
    await expect(page.locator('#githubWebPublishReady')).toBeVisible();
    await page.locator('#copyGithubWebHtml').click();
    await expect(page.locator('#githubWebPublishError')).toContainText('Download the verified HTML');
    await expect(page.locator('#githubWebPublishReady')).toBeVisible();
    const download=page.waitForEvent('download');
    await page.locator('#downloadGithubWebHtml').click();
    const saved=await download;
    expect(saved.suggestedFilename()).toBe(name);
    expect(readFileSync(await saved.path(),'utf8')).toContain('<main');
    expect(writes).toEqual([]);
  });


test('Actual published site preview loads a real page URL instead of GitHub srcdoc, with matching viewport',
  async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page=contact.html',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await expect(page.locator('#workspacePill')).toContainText('not the deployed page');
    await page.locator('#devicePreview').selectOption('phone');
    await page.locator('#viewPublished').click();
    await expect(page.locator('#publishedDialog')).toBeVisible();
    await expect(page.locator('#publishedFrame')).toHaveAttribute('src',BASE+'/contact.html');
    expect(await page.locator('#publishedFrame').getAttribute('srcdoc')).toBeNull();
    await expect(page.frameLocator('#publishedFrame').locator('main')).toHaveCount(1);
    expect(await page.frameLocator('#publishedFrame').locator('html').evaluate(node=>
      node.ownerDocument.defaultView.innerWidth)).toBe(390);
    await expect(page.locator('#publishedSourceStatus'))
      .toContainText('Deployed HTML matches the currently loaded GitHub source');
    await expect(page.locator('#publishedPageLink')).toHaveAttribute('href',BASE+'/contact.html');
    await page.locator('#closePublished').click();
    await expect(page.locator('#publishedDialog')).toBeHidden();
    await expect(page.frameLocator('#livePageFrame').locator('main')).toHaveCount(1);
    expect(writes).toEqual([]);
  });

test('Actual published view reports deployment drift while preserving unsaved GitHub-source edits',
  async({page})=>{
    const writes=[],name='contact.html';
    await installVerifiedCurrentSource(page,writes);
    const source=SOURCE.get(name).toString('utf8');
    const newPublic=source.replace('</main>',
      '<p id="public-deployment-marker">Different deployed public version</p></main>');
    expect(newPublic).not.toBe(source);
    await page.route(BASE+'/'+name,async route=>{
      await route.fulfill({status:200,contentType:'text/html',body:newPublic});
    });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const heading=page.frameLocator('#livePageFrame')
      .locator('main h1:visible,main h2:visible').first();
    await heading.click();
    const before=await page.locator('#liveTextAlign').inputValue();
    const next=before==='right'?'center':'right';
    await page.locator('#liveTextAlign').selectOption(next);
    await expect(heading).toHaveCSS('text-align',next);
    await page.locator('#viewPublished').click();
    await expect(page.locator('#publishedSourceStatus'))
      .toContainText('Deployed HTML differs from the GitHub source editor');
    await expect(page.frameLocator('#publishedFrame')
      .locator('#public-deployment-marker')).toHaveText('Different deployed public version');
    await expect(page.frameLocator('#livePageFrame')
      .locator('#public-deployment-marker')).toHaveCount(0);
    await page.locator('#closePublished').click();
    await expect(heading).toHaveCSS('text-align',next);
    expect(writes).toEqual([]);
  });


for(const name of ['index.html','contact.html']){
  test('Same-width visitor versus source-edit geometry on '+name,
    async({page})=>{
      const writes=[],width=1160;
      await installVerifiedCurrentSource(page,writes);
      await page.setViewportSize({width,height:900});
      const capture=async locator=>locator.evaluate(async main=>{
        const doc=main.ownerDocument,view=doc.defaultView;
        await doc.fonts?.ready;
        const root=main.getBoundingClientRect();
        const nodes=[main,...main.querySelectorAll('h1,h2,h3,p,img,figure')].slice(0,18);
        return nodes.map(node=>{
          const rect=node.getBoundingClientRect();
          const style=view.getComputedStyle(node);
          return {tag:node.tagName,relativeX:rect.left-root.left,
            relativeY:rect.top-root.top,width:rect.width,height:rect.height,
            fontSize:style.fontSize,display:style.display,objectFit:style.objectFit};
        });
      });
      await page.goto(BASE+'/'+name,{waitUntil:'load'});
      const publicGeometry=await capture(page.locator('main'));
      await page.goto(BASE+'/editor-v2.html?page='+name,
        {waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const editGeometry=await capture(page.frameLocator('#livePageFrame').locator('main'));
      expect(editGeometry.length).toBe(publicGeometry.length);
      for(let i=0;i<publicGeometry.length;i++){
        const actual=editGeometry[i],expected=publicGeometry[i];
        expect(actual.tag,name+' tag '+i).toBe(expected.tag);
        for(const key of ['relativeX','relativeY','width','height'])
          expect(Math.abs(actual[key]-expected[key]),
            name+' '+i+' '+key+' must match published visitor at 1160px')
            .toBeLessThan(6);
        expect(actual.fontSize,name+' '+i+' font').toBe(expected.fontSize);
        expect(actual.display,name+' '+i+' display').toBe(expected.display);
      }
      expect(writes).toEqual([]);
    });
}


test('Real Pungmul photo crop preserves zoom and focal position through edge trim and crop activation',
  async({page})=>{
    const name='pungmul.html',writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const image=page.frameLocator('#livePageFrame').locator('main img:visible').first();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate(img=>img.naturalWidth),{timeout:15000})
      .toBeGreaterThan(0);
    await image.click();
    const adjust=async(id,value)=>{
      await page.locator(id).evaluate((el,v)=>{
        el.value=String(v);
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
      },value);
    };
    await adjust('#liveCropZoom',260);
    await expect(page.locator('#liveCropZoomValue')).toHaveText('260%');
    await page.locator('#cropImageTool').click();
    await expect(page.locator('#liveCropZoomValue')).toHaveText('260%');
    await adjust('#liveCropRight',20);
    await expect(page.locator('#liveCropZoomValue')).toHaveText('260%');
    const state=()=>image.evaluate(img=>{
      const style=img.ownerDocument.defaultView.getComputedStyle(img);
      return {backgroundPosition:style.backgroundPosition,
        backgroundSize:style.backgroundSize,fit:style.objectFit};
    });
    const initial=await state();
    expect(initial.fit).toBe('none');
    await adjust('#liveCropX',5);
    const shifted=await state();
    expect(shifted.backgroundPosition).not.toBe(initial.backgroundPosition);
    await adjust('#liveCropY',10);
    const shiftedY=await state();
    expect(shiftedY.backgroundPosition).not.toBe(shifted.backgroundPosition);
    await page.locator('#cropImageTool').click();
    await page.locator('#cropImageTool').click();
    await expect(page.locator('#liveCropZoomValue')).toHaveText('260%');
    const saved=await page.evaluate(name=>
      JSON.parse(localStorage.getItem('moon-academic-editor-v2:source:'+name)||'[]'),name);
    const patch=saved.find(p=>p.kind==='image'&&p.imageCrop?.desktop);
    expect(patch).toBeTruthy();
    expect(patch.imageCrop.desktop.zoom).toBe(260);
    expect(patch.imageCrop.desktop.right).toBe(20);
    expect(patch.imageCrop.desktop.x).toBe(5);
    expect(patch.imageCrop.desktop.y).toBe(10);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const preview=page.frameLocator('#previewFrame').locator('main img:visible').first();
    await expect(preview).toHaveCSS('object-fit','none');
    const previewStyle=await preview.evaluate(img=>{
      const style=img.ownerDocument.defaultView.getComputedStyle(img);
      return {backgroundPosition:style.backgroundPosition,backgroundSize:style.backgroundSize};
    });
    expect(previewStyle).toEqual({backgroundPosition:(await state()).backgroundPosition,
      backgroundSize:(await state()).backgroundSize});
    await page.locator('#closePreview').click();
    expect(writes).toEqual([]);
  });

test('Real photo resize, move and crop round-trip through exact verified preview and mocked GitHub commit',
  async({page})=>{
    const name='pungmul.html',writes=[],puts=[];
    await installVerifiedCurrentSource(page,writes);
    await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
      async route=>{
        if(route.request().method()!=='PUT')return route.fallback();
        puts.push(JSON.parse(route.request().postData()));
        await route.fulfill({status:200,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({commit:{sha:'synthetic-photo-geometry-commit'}})});
      });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const image=page.frameLocator('#livePageFrame').locator('main img:visible').first();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate(img=>img.naturalWidth),{timeout:15000})
      .toBeGreaterThan(0);
    await image.click();
    const originalSource=await image.getAttribute('src');
    const width=Number(await page.locator('#liveOriginalWidth').inputValue());
    expect(width).toBeGreaterThan(100);
    await page.locator('#liveOriginalWidth').fill(String(Math.round(width+45)));
    await page.locator('#liveOriginalWidth').dispatchEvent('change');
    await page.locator('#liveMoveX').fill('38');
    await page.locator('#liveMoveX').dispatchEvent('change');
    await page.locator('#cropImageTool').click();
    await page.locator('#liveCropRight').evaluate(el=>{
      el.value='15';el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.locator('#liveCropZoom').evaluate(el=>{
      el.value='180';el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.locator('#liveCropX').evaluate(el=>{
      el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    const snapshot=async(locator)=>locator.evaluate(async img=>{
      await img.ownerDocument.fonts?.ready;
      const rect=img.getBoundingClientRect();
      const main=img.ownerDocument.querySelector('main').getBoundingClientRect();
      const s=img.ownerDocument.defaultView.getComputedStyle(img);
      return {x:rect.x-main.x,y:rect.y-main.y,w:rect.width,h:rect.height,
        objectFit:s.objectFit,backgroundSize:s.backgroundSize,
        backgroundPosition:s.backgroundPosition,src:img.getAttribute('src')};
    });
    const edited=await snapshot(image);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const previewImage=page.frameLocator('#previewFrame').locator('main img:visible').first();
    const prepared=await snapshot(previewImage);
    for(const key of ['x','y','w','h'])
      expect(Math.abs(prepared[key]-edited[key]),key+' editor vs preview')
        .toBeLessThan(6);
    expect(prepared.backgroundPosition).toBe(edited.backgroundPosition);
    expect(prepared.backgroundSize).toBe(edited.backgroundSize);
    const html=await page.locator('#previewFrame').getAttribute('srcdoc');
    await page.locator('#closePreview').click();
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-photo-geometry-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect.poll(()=>puts.length,{timeout:25000}).toBe(1);
    const committed=Buffer.from(puts[0].content,'base64').toString('utf8');
    expect(committed).toBe(html);
    expect(puts[0].sha).toBe(blobSha(SOURCE.get(name)));
    const visitor=await page.context().newPage();
    await visitor.setViewportSize({width:1160,height:900});
    await visitor.route(BASE+'/'+name,route=>route.fulfill({
      status:200,contentType:'text/html',body:committed}));
    await visitor.goto(BASE+'/'+name,{waitUntil:'load'});
    const publicPhoto=visitor.locator('main img:visible').first();
    await expect(publicPhoto).toHaveAttribute('src',originalSource);
    const publicState=await snapshot(publicPhoto);
    for(const key of ['x','y','w','h'])
      expect(Math.abs(publicState[key]-prepared[key]),key+' preview vs published visitor')
        .toBeLessThan(6);
    expect(publicState.objectFit).toBe(prepared.objectFit);
    expect(publicState.backgroundSize).toBe(prepared.backgroundSize);
    expect(publicState.backgroundPosition).toBe(prepared.backgroundPosition);
    await visitor.close();
    expect(writes).toEqual([]);
  });


for(const name of ['pungmul.html','contact.html']){
  test('Photo frame mouse move, resize grips, and crop pan work on '+name,
    async({page})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.setViewportSize({width:1740,height:1050});
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const image=page.frameLocator('#livePageFrame').locator('main img:visible').first();
      await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate(img=>img.naturalWidth),{timeout:15000})
        .toBeGreaterThan(0);
      await image.click();
      const box=()=>image.boundingBox();
      const drag=async(locator,x,y)=>{
        const b=await locator.boundingBox();
        expect(b,'drag target should be visible').toBeTruthy();
        await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
        await page.mouse.down();
        await page.mouse.move(b.x+b.width/2+x,b.y+b.height/2+y,{steps:10});
        await page.mouse.up();
      };
      const before=await box();
      const grip=page.frameLocator('#livePageFrame')
        .locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="se"]');
      await expect(grip).toBeVisible();
      await drag(grip,42,24);
      const resized=await box();
      expect(resized.width,name+' resize handle should change width')
        .toBeGreaterThan(before.width+5);
      const moveGrip=page.frameLocator('#livePageFrame')
        .locator('#moon-v2-live-overlay .moon-v2-move');
      await expect(moveGrip).toBeVisible();
      await drag(moveGrip,35,20);
      const moved=await box();
      expect(moved.x,name+' moving should change x')
        .toBeGreaterThan(resized.x+5);
      expect(moved.y,name+' moving should change y')
        .toBeGreaterThan(resized.y+3);
      await page.locator('#cropImageTool').click();
      await page.locator('#liveCropZoom').evaluate(el=>{
        el.value='250';el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
      });
      const cropBefore=await page.locator('#liveCropX').inputValue();
      const rect=await box();
      const inside={x:rect.x+Math.min(70,rect.width/2),
        y:rect.y+Math.min(70,rect.height/2)};
      await page.mouse.move(inside.x,inside.y);
      await page.mouse.down();
      await page.mouse.move(inside.x+30,inside.y+12,{steps:9});
      await page.mouse.up();
      await expect.poll(()=>page.locator('#liveCropX').inputValue())
        .not.toBe(cropBefore);
      const stored=await page.evaluate(name=>
        JSON.parse(localStorage.getItem('moon-academic-editor-v2:source:'+name)||'[]'),name);
      expect(stored.some(p=>
        (p.kind==='image'&&p.layout?.desktop&&p.imageCrop?.desktop)||
        (p.kind==='insert'&&p.objectType==='image'&&
          p.geometry?.desktop&&p.imageCrop?.desktop))).toBe(true);
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      await expect(page.frameLocator('#previewFrame').locator('main img:visible').first())
        .toHaveCSS('object-fit','none');
      await page.locator('#closePreview').click();
      expect(writes).toEqual([]);
    });
}


for(const [name,device,expectedPhotos] of [
  ['index.html','tablet',2],['contact.html','desktop',1]
]){
  test('Editing script-reparented '+name+' photo preserves its identity, size and publication preview',
    async({page})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.setViewportSize({width:1740,height:1050});
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await page.locator('#devicePreview').selectOption(device);
      const live=page.frameLocator('#livePageFrame');
      const photos=live.locator('main img[data-moon-v2-added-id]');
      await expect(photos).toHaveCount(expectedPhotos);
      const photo=photos.first();
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(()=>photo.evaluate(img=>img.naturalWidth),{timeout:20000})
        .toBeGreaterThan(0);
      await photo.click();
      const identity=await photo.getAttribute('data-moon-v2-added-id');
      const initialParent=await photo.evaluate(node=>node.parentElement.className);
      await photo.evaluate(node=>{node.ownerDocument.defaultView.__selectedOriginalPhoto=node;});
      const width=Number(await page.locator('#liveAddedWidth').inputValue());
      await page.locator('#liveAddedWidth').fill(String(width+30));
      await page.locator('#liveAddedWidth').dispatchEvent('change');
      await page.locator('#liveCropShape').selectOption('rounded');
      const matches=live.locator('main img[data-moon-v2-added-id="'+identity+'"]');
      await expect(matches).toHaveCount(1);
      await expect(photos).toHaveCount(expectedPhotos);
      expect(await photo.evaluate(node=>
        node.ownerDocument.defaultView.__selectedOriginalPhoto===node)).toBe(true);
      expect(await photo.evaluate(node=>node.parentElement.className)).toBe(initialParent);
      const data=await photo.evaluate(img=>({
        geometry:JSON.parse(img.getAttribute('data-moon-v2-added-geometry')||'{}'),
        crop:JSON.parse(img.getAttribute('data-moon-v2-added-crop')||'{}')}));
      expect(data.geometry[device].w).toBe(width+30);
      expect(data.crop[device].mask).toBe('rounded');
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      const preview=page.frameLocator('#previewFrame');
      await expect(preview.locator('main img[data-moon-v2-added-id]'))
        .toHaveCount(expectedPhotos);
      await expect(preview.locator('main img[data-moon-v2-added-id="'+identity+'"]'))
        .toHaveCount(1);
      await page.locator('#closePreview').click();
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await page.locator('#devicePreview').selectOption(device);
      await expect(page.frameLocator('#livePageFrame')
        .locator('main img[data-moon-v2-added-id="'+identity+'"]'))
        .toHaveCount(1);
      expect(writes).toEqual([]);
    });
}


for(const [name,device,width,expectedCount] of [
  ['index.html','tablet',768,2],['contact.html','desktop',1160,1],
  ['index.html','phone',390,2],['contact.html','phone',390,1]
]){
  test('Reparented '+name+' image resize, move and crop match mock-published visitor at '+device,
    async({page})=>{
      const writes=[],puts=[];
      await installVerifiedCurrentSource(page,writes);
      await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
        async route=>{
          if(route.request().method()!=='PUT')return route.fallback();
          puts.push(JSON.parse(route.request().postData()));
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({commit:{sha:'synthetic-reparented-photo-commit'}})});
        });
      await page.setViewportSize({width:1740,height:1050});
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await page.locator('#devicePreview').selectOption(device);
      const live=page.frameLocator('#livePageFrame');
      const images=live.locator('main img[data-moon-v2-added-id]');
      await expect(images).toHaveCount(expectedCount);
      const image=images.first();
      await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate(n=>n.naturalWidth),{timeout:15000})
        .toBeGreaterThan(0);
      await image.click();
      const id=await image.getAttribute('data-moon-v2-added-id');
      const initialWidth=Number(await page.locator('#liveAddedWidth').inputValue());
      const initialX=Number(await page.locator('#liveMoveX').inputValue());
      await page.locator('#liveAddedWidth').fill(String(initialWidth+36));
      await page.locator('#liveAddedWidth').dispatchEvent('change');
      await page.locator('#liveMoveX').fill(String(initialX+27));
      await page.locator('#liveMoveX').dispatchEvent('change');
      await page.locator('#liveCropShape').selectOption('rounded');
      await page.locator('#liveCropZoom').evaluate(el=>{
        el.value='180';el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
      });
      const sample=async locator=>locator.evaluate(async(img)=>{
        await img.ownerDocument.fonts?.ready;
        const rect=img.getBoundingClientRect();
        const main=img.closest('main').getBoundingClientRect();
        const css=img.ownerDocument.defaultView.getComputedStyle(img);
        return {id:img.dataset.moonV2AddedId,x:rect.x-main.x,y:rect.y-main.y,
          w:rect.width,h:rect.height,fit:css.objectFit,
          bg:css.backgroundPosition,size:css.backgroundSize,
          parent:img.parentElement.className};
      });
      const edited=await sample(image);
      await expect(live.locator('main img[data-moon-v2-added-id="'+id+'"]'))
        .toHaveCount(1);
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      const previewImage=page.frameLocator('#previewFrame')
        .locator('main img[data-moon-v2-added-id="'+id+'"]');
      await expect(previewImage).toHaveCount(1);
      const prepared=await sample(previewImage);
      expect(prepared.parent).toBe(edited.parent);
      for(const prop of ['x','y','w','h'])
        expect(Math.abs(prepared[prop]-edited[prop]),name+' '+prop+' preview')
          .toBeLessThan(7);
      expect(prepared.fit).toBe(edited.fit);
      expect(prepared.size).toBe(edited.size);
      const previewHtml=await page.locator('#previewFrame').getAttribute('srcdoc');
      await page.locator('#closePreview').click();
      await page.locator('#publish').click();
      await page.locator('#githubToken').fill('synthetic-reparented-photo-test');
      await page.locator('#acknowledgeLive').check();
      await page.locator('#confirmPublish').click();
      await expect.poll(()=>puts.length,{timeout:25000}).toBe(1);
      const committed=Buffer.from(puts[0].content,'base64').toString('utf8');
      expect(committed).toBe(previewHtml);
      const visitor=await page.context().newPage();
      await visitor.setViewportSize({width,height:900});
      await visitor.route(BASE+'/'+name,route=>route.fulfill({
        status:200,contentType:'text/html',body:committed}));
      await visitor.goto(BASE+'/'+name,{waitUntil:'load'});
      const published=visitor.locator('main img[data-moon-v2-added-id="'+id+'"]');
      await expect(published).toHaveCount(1);
      await expect(visitor.locator('main img[data-moon-v2-added-id]'))
        .toHaveCount(expectedCount);
      const delivered=await sample(published);
      expect(delivered.parent).toBe(prepared.parent);
      for(const prop of ['x','y','w','h'])
        expect(Math.abs(delivered[prop]-prepared[prop]),
          name+' '+prop+' deployed simulated page').toBeLessThan(7);
      expect(delivered.fit).toBe(prepared.fit);
      expect(delivered.size).toBe(prepared.size);
      expect(delivered.bg).toBe(prepared.bg);
      await visitor.close();
      expect(writes).toEqual([]);
    });
}


for(const name of ['pungmul.html','contact.html']){
  test('Dragging a pink crop edge trims the actual '+name+' photo and matches verified preview',
    async({page})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.setViewportSize({width:1740,height:1050});
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const image=page.frameLocator('#livePageFrame').locator('main img:visible').first();
      await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate(img=>img.naturalWidth),{timeout:15000})
        .toBeGreaterThan(0);
      const src=await image.getAttribute('src');
      await image.click();
      await page.locator('#cropImageTool').click();
      const before=await image.boundingBox();
      const grip=page.frameLocator('#livePageFrame')
        .locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="e"]');
      await expect(grip).toBeVisible();
      const b=await grip.boundingBox();
      await page.mouse.move(b.x+b.width/2,b.y+b.height/2);
      await page.mouse.down();
      await page.mouse.move(b.x+b.width/2-32,b.y+b.height/2,{steps:10});
      await page.mouse.up();
      const after=await image.boundingBox();
      expect(after.width,name+' crop drag must trim picture frame')
        .toBeLessThan(before.width-5);
      const right=Number((await page.locator('#liveCropRightValue').textContent()).replace('%',''));
      expect(right,name+' right crop percentage').toBeGreaterThan(0);
      await expect(image).toHaveAttribute('src',src);
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      const previewImage=page.frameLocator('#previewFrame').locator('main img:visible').first();
      await expect(previewImage).toHaveCSS('object-fit','none');
      const px=await previewImage.boundingBox();
      // Both frames are scaled by the editor workspace; measure CSS geometry.
      const editorW=await image.evaluate(img=>img.getBoundingClientRect().width);
      const previewW=await previewImage.evaluate(img=>img.getBoundingClientRect().width);
      expect(Math.abs(previewW-editorW),name+' preview crop width parity')
        .toBeLessThan(7);
      await page.locator('#closePreview').click();
      expect(writes).toEqual([]);
    });
}


test('Repeated Pungmul photo resize/crop publications preserve latest preview and verify deployed delivery',
  async({page})=>{
    const name='pungmul.html',original=SOURCE.get(name);
    let github=original,publicHtml=original.toString('utf8');
    let commits=0;
    await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
      async route=>{
        const req=route.request(),url=new URL(req.url());
        const candidate=url.pathname.split('/contents/')[1];
        if(candidate!==name){await route.abort();return;}
        if(req.method()==='GET'){
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({name,type:'file',sha:blobSha(github),
              content:github.toString('base64'),encoding:'base64'})});return;
        }
        if(req.method()==='PUT'){
          const body=JSON.parse(req.postData());
          expect(body.sha).toBe(blobSha(github));
          github=Buffer.from(body.content,'base64');
          commits++;
          await route.fulfill({status:200,contentType:'application/json',
            headers:{'access-control-allow-origin':'*'},
            body:JSON.stringify({commit:{sha:String(commits).padStart(40,'a')}})});
          return;
        }
        throw Error('Unexpected GitHub method '+req.method());
      });
    await page.route(/^https:\/\/gmoon-code\.github\.io\/pungmul\.html(?:\?.*)?$/,async route=>{
      await route.fulfill({status:200,contentType:'text/html',
        headers:{'access-control-allow-origin':'*'},body:publicHtml});
    });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const photo=page.frameLocator('#livePageFrame').locator('main img:visible').first();
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(()=>photo.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
    await photo.click();
    const originalWidth=Number(await page.locator('#liveOriginalWidth').inputValue());
    await page.locator('#liveOriginalWidth').fill(String(originalWidth+35));
    await page.locator('#liveOriginalWidth').dispatchEvent('change');
    await page.locator('#liveMoveX').fill('28');
    await page.locator('#liveMoveX').dispatchEvent('change');
    await page.locator('#cropImageTool').click();
    await page.locator('#liveCropRight').evaluate(el=>{
      el.value='15';el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.locator('#liveCropZoom').evaluate(el=>{
      el.value='190';el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.locator('#cropImageTool').click();
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const firstPreview=await page.locator('#previewFrame').getAttribute('srcdoc');
    await page.locator('#closePreview').click();
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-successive-photo-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect.poll(()=>commits,{timeout:20000}).toBe(1);
    expect(github.toString('utf8')).toBe(firstPreview);
    await expect(page.locator('#publishResult button')).toHaveText('Check public deployment');
    await page.locator('#publishResult button').click();
    await expect(page.locator('.publication-delivery-status'))
      .toContainText('still serving different HTML');
    publicHtml=github.toString('utf8');
    await page.locator('#publishResult button').click();
    await expect(page.locator('.publication-delivery-status'))
      .toContainText('now serves the exact reviewed HTML');
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified');

    // A later photo edit on the already-published source must retain the first
    // crop and layout instead of silently restoring the earlier image CSS.
    await photo.click();
    const updatedWidth=Number(await page.locator('#liveOriginalWidth').inputValue());
    await page.locator('#liveOriginalWidth').fill(String(updatedWidth+25));
    await page.locator('#liveOriginalWidth').dispatchEvent('change');
    await page.locator('#liveCropShape').selectOption('rounded');
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const secondPreview=await page.locator('#previewFrame').getAttribute('srcdoc');
    await page.locator('#closePreview').click();
    expect(secondPreview).not.toBe(firstPreview);
    await page.locator('#publish').click();
    await page.locator('#githubToken').fill('synthetic-successive-photo-token');
    await page.locator('#acknowledgeLive').check();
    await page.locator('#confirmPublish').click();
    await expect.poll(()=>commits,{timeout:20000}).toBe(2);
    expect(github.toString('utf8')).toBe(secondPreview);
    expect(secondPreview).toContain('data-moon-v2-image-crop');
    const visitor=await page.context().newPage();
    await visitor.setViewportSize({width:1160,height:900});
    await visitor.route(BASE+'/'+name,route=>route.fulfill({
      status:200,contentType:'text/html',body:secondPreview}));
    await visitor.goto(BASE+'/'+name,{waitUntil:'load'});
    const actual=visitor.locator('main img:visible').first();
    await expect(actual).toHaveCSS('border-radius','12px');
    await visitor.close();
  });


test('Photo resize and move grips work when the editor iframe is scaled to a laptop window',
  async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.setViewportSize({width:1280,height:900});
    await page.goto(BASE+'/editor-v2.html?page=pungmul.html',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const iframe=page.locator('#livePageFrame');
    await expect.poll(()=>iframe.evaluate(node=>{
      const m=node.ownerDocument.defaultView.getComputedStyle(node).transform;
      return m!=='none'&&!/^matrix\(1, 0, 0, 1,/.test(m);
    })).toBe(true);
    const image=page.frameLocator('#livePageFrame').locator('main img:visible').first();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
    await image.click();
    const box=()=>image.boundingBox();
    const drag=async(locator,dx,dy)=>{
      const target=await locator.boundingBox();
      expect(target).toBeTruthy();
      const cx=target.x+target.width/2,cy=target.y+target.height/2;
      await page.mouse.move(cx,cy);
      await page.mouse.down();
      await page.mouse.move(cx+dx,cy+dy,{steps:12});
      await page.mouse.up();
    };
    const before=await box();
    const grip=page.frameLocator('#livePageFrame')
      .locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="se"]');
    await expect(grip).toBeVisible();
    await drag(grip,35,22);
    const resized=await box();
    expect(resized.width).toBeGreaterThan(before.width+4);
    const move=page.frameLocator('#livePageFrame')
      .locator('#moon-v2-live-overlay .moon-v2-move');
    await expect(move).toBeVisible();
    await drag(move,32,20);
    const moved=await box();
    expect(moved.x).toBeGreaterThan(resized.x+4);
    expect(moved.y).toBeGreaterThan(resized.y+2);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const editorGeometry=await image.evaluate(img=>{
      const m=img.closest('main').getBoundingClientRect(),r=img.getBoundingClientRect();
      return {x:r.x-m.x,y:r.y-m.y,w:r.width,h:r.height};
    });
    const publicGeometry=await page.frameLocator('#previewFrame')
      .locator('main img:visible').first().evaluate(img=>{
        const m=img.closest('main').getBoundingClientRect(),r=img.getBoundingClientRect();
        return {x:r.x-m.x,y:r.y-m.y,w:r.width,h:r.height};
      });
    for(const key of ['x','y','w','h'])
      expect(Math.abs(editorGeometry[key]-publicGeometry[key]),
        'scaled editor vs exact publication preview '+key).toBeLessThan(7);
    await page.locator('#closePreview').click();
    expect(writes).toEqual([]);
  });


// Regression for the gallery bug seen on Interests and Pungmul. Testing the
// <img> bounding box alone is insufficient: an enclosing rounded <figure> and
// linked <a> can clip the changed pixels even when the element resized.
for(const [name,gallery] of [
  ['interests.html','.pungmul-gallery'],
  ['pungmul.html','.pungmul-performance-grid']
]){
  test('Edited linked gallery photo is visibly resized, movable, rounded and preview-faithful on '+name,
    async({page})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const frame=page.frameLocator('#livePageFrame');
      const figures=frame.locator(gallery+' figure');
      const first=figures.first(),second=figures.nth(1);
      const photo=first.locator('img');
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(()=>photo.evaluate(img=>img.naturalWidth),{timeout:15000})
        .toBeGreaterThan(0);
      await expect(figures).toHaveCount(name==='interests.html'?2:4);
      if(name==='interests.html'){
        expect(await frame.locator(gallery).evaluate(el=>
          getComputedStyle(el).gridTemplateColumns.split(/\s+/).length)).toBe(2);
      }
      const original=await photo.evaluate(img=>img.getBoundingClientRect().width);
      // Existing browser drafts made before photo-card mode remain in their
      // original independent-image model. Verify the legacy unclipping
      // contract explicitly, rather than applying it to new linked cards.
      const legacy=await photo.evaluate(img=>{
        const steps=[];
        for(let n=img;n&&n.tagName!=="MAIN";n=n.parentElement){
          const siblings=[...n.parentElement.children].filter(el=>el.tagName===n.tagName);
          steps.unshift(n.tagName.toLowerCase()+':nth-of-type('+
            (siblings.indexOf(n)+1)+')');
        }
        const src=img.getAttribute('src');
        return {selector:'main > '+steps.join(' > '),kind:'image',
          expected:src,src,alt:img.alt,
          layout:{desktop:{dx:0,dy:0,sx:1,sy:1}}};
      });
      await page.evaluate(([key,value])=>localStorage.setItem(key,value),
        ['moon-academic-editor-v2:source:'+name,JSON.stringify([legacy])]);
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      await photo.click();
      await expect(page.locator('#livePhotoCardMode')).not.toBeChecked();
      await page.locator('#liveOriginalWidth').fill(String(Math.round(original+65)));
      await page.locator('#liveOriginalWidth').dispatchEvent('change');
      await page.locator('#liveMoveX').fill('36');
      await page.locator('#liveMoveX').dispatchEvent('change');
      await expect.poll(()=>photo.evaluate(img=>img.getBoundingClientRect().width))
        .toBeGreaterThan(original+30);
      const current=await photo.evaluate(img=>{
        const a=img.parentElement,figure=img.closest('figure'),doc=img.ownerDocument;
        const im=img.getBoundingClientRect(),card=figure.getBoundingClientRect();
        const x=card.right+8,y=im.top+im.height/2;
        return {
          imageWidth:im.width,figureRight:card.right,imageRight:im.right,
          imageRadius:getComputedStyle(img).borderTopLeftRadius,
          anchorOverflow:getComputedStyle(a).overflow,
          figureOverflow:getComputedStyle(figure).overflow,
          visibleOutsideFrame:doc.elementFromPoint(x,y)===img
        };
      });
      expect(current.imageRight).toBeGreaterThan(current.figureRight+15);
      expect(current.anchorOverflow).toBe('visible');
      expect(current.figureOverflow).toBe('visible');
      expect(parseFloat(current.imageRadius)).toBeGreaterThan(0);
      expect(current.visibleOutsideFrame).toBe(true);
      await expect(second).toHaveCSS('overflow','hidden');
      // Crop/rounded choices must remain visually coherent after the
      // enclosing card has been unclipped.
      await page.locator('#liveCropShape').selectOption('rounded');
      await expect(photo).toHaveCSS('border-radius','12px');
      await page.locator('#preview').click();
      await expect(page.locator('#previewDialog')).toBeVisible();
      const preview=page.frameLocator('#previewFrame').locator(gallery+' figure').first();
      await expect(preview).toHaveCSS('overflow','visible');
      await expect(preview.locator('a')).toHaveCSS('overflow','visible');
      await expect(preview.locator('img')).toHaveCSS('border-radius','12px');
      expect(await preview.locator('img').evaluate(el=>
        el.getBoundingClientRect().width)).toBeGreaterThan(original+30);
      expect(writes).toEqual([]);
      if(name==='interests.html'){
        // The separate restore stylesheet uses a 600px breakpoint.
        // The later inline rules must not override it with narrow columns.
        await page.setViewportSize({width:550,height:900});
        await page.goto(BASE+'/'+name,{waitUntil:'domcontentloaded'});
        const smallColumns=await page.locator(gallery).evaluate(el=>
          getComputedStyle(el).gridTemplateColumns.split(/\s+/).length);
        expect(smallColumns).toBe(1);
      }
    });
}


// Reproduce the actual old Interests paragraph that was revised on 28 Oct.
// A retained position/style draft must not be blocked by changed prose or
// ever rewrite the newer words. An old TEXT replacement has stricter rules.
for(const variant of ['layout','already-published-text','conflicting-text']){
  test('Old Interests ensemble paragraph draft safely handles '+variant,
    async({page})=>{
      const writes=[];
      await installVerifiedCurrentSource(page,writes);
      const name='interests.html';
      await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const paragraph=page.frameLocator('#livePageFrame').locator('main p')
        .filter({hasText:'Our ensemble gave a formal concert in 2024'}).first();
      const selector=await paragraph.evaluate(node=>{
        const parts=[];
        for(let el=node;el&&el.tagName!=='MAIN';el=el.parentElement){
          const siblings=[...el.parentElement.children]
            .filter(child=>child.tagName===el.tagName);
          parts.unshift(el.tagName.toLowerCase()+':nth-of-type('+
            (siblings.indexOf(el)+1)+')');
        }
        return 'main > '+parts.join(' > ');
      });
      const original=await paragraph.textContent();
      const originalMarkup=await paragraph.innerHTML();
      const old='Our ensemble gave a formal concert in 2024, and we participate in the Seoul Pride parade every year. We also give seasonal busking and smaller performances in support of queer rights. Playing together in public has given me a way to take part in Korean cultural traditions alongside people with whom ';
      expect(old.slice(0,96)).toBe(original.trim().slice(0,96));
      expect(old).not.toBe(original.trim().slice(0,300));
      const patch=variant==='layout'?{
        selector,kind:'layout',expected:old,tag:'p',
        layout:{desktop:{dx:31,dy:0,sx:1,sy:1}}
      }:{
        selector,kind:'text',expected:old,
        html:variant==='already-published-text'?
          originalMarkup:'<strong>Unsafe replacement of the newer text</strong>'
      };
      const snapshot=JSON.stringify([patch]);
      const key='moon-academic-editor-v2:source:'+name;
      await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,snapshot]);
      await page.reload({waitUntil:'domcontentloaded'});
      await expect(page.locator('#liveAssetStatus'))
        .toContainText('GitHub main source verified',{timeout:35000});
      const same=page.frameLocator('#livePageFrame').locator('main p')
        .filter({hasText:'Our ensemble gave a formal concert in 2024'}).first();
      await expect(same).toHaveText(original.trim());
      if(variant==='layout'){
        await expect.poll(()=>same.evaluate(el=>getComputedStyle(el).translate))
          .toContain('31px');
      }
      await page.locator('#preview').click();
      if(variant==='conflicting-text'){
        await expect(page.locator('#previewDialog')).toBeHidden();
        await expect(page.locator('#status')).toContainText(
          'This is a text-source conflict, not an image-mapping problem.');
      }else{
        await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
        const verified=page.frameLocator('#previewFrame').locator('main p')
          .filter({hasText:'Our ensemble gave a formal concert in 2024'}).first();
        await expect(verified).toHaveText(original.trim());
        if(variant==='layout'){
          await expect.poll(()=>verified.evaluate(el=>getComputedStyle(el).translate))
            .toContain('31px');
        }
        await page.locator('#closePreview').click();
      }
      expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(snapshot);
      expect(writes).toEqual([]);
    });
}
// Duplicate historical opening is not enough to choose a paragraph.
test('Ambiguous outdated Interests paragraph anchor blocks publication without changing draft',
  async({page})=>{
    const name='interests.html',writes=[];
    const current=SOURCE.get(name).toString('utf8');
    const match=current.match(/<p>Our ensemble gave a formal concert in 2024[^<]*<\/p>/);
    expect(match).toBeTruthy();
    const repeated=current.replace(match[0],match[0]+match[0]);
    await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
      async route=>{
        if(route.request().method()!=='GET'){
          writes.push(route.request().method());await route.abort();return;
        }
        await route.fulfill({status:200,contentType:'application/json',
          headers:{'access-control-allow-origin':'*'},
          body:JSON.stringify({type:'file',name,sha:blobSha(Buffer.from(repeated)),
            encoding:'base64',content:Buffer.from(repeated).toString('base64')})});
      });
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const old='Our ensemble gave a formal concert in 2024, and we participate in the Seoul Pride parade every year. We also give seasonal busking and smaller performances in support of queer rights. Playing together in public has given me a way to take part in Korean cultural traditions alongside people with whom ';
    const target=page.frameLocator('#livePageFrame').locator('main p')
      .filter({hasText:'Our ensemble gave a formal concert in 2024'}).first();
    const selector=await target.evaluate(node=>{
      const bits=[];
      for(let el=node;el&&el.tagName!=='MAIN';el=el.parentElement){
        const peers=[...el.parentElement.children].filter(n=>n.tagName===el.tagName);
        bits.unshift(el.tagName.toLowerCase()+':nth-of-type('+(peers.indexOf(el)+1)+')');
      }
      return 'main > '+bits.join(' > ');
    });
    const key='moon-academic-editor-v2:source:'+name;
    const saved=JSON.stringify([{selector,kind:'layout',expected:old,tag:'p',
      layout:{desktop:{dx:37,dy:0,sx:1,sy:1}}}]);
    await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,saved]);
    await page.reload({waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeHidden();
    await expect(page.locator('#status')).toContainText('No matching original element');
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(saved);
    expect(writes).toEqual([]);
  });


test('Interests stale text can be explicitly kept current while image edits and text layout survive',async({page})=>{
  const name='interests.html',writes=[],key='moon-academic-editor-v2:source:'+name;
  await installVerifiedCurrentSource(page,writes);
  await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const frame=page.frameLocator('#livePageFrame');
  const image=frame.locator('.pungmul-gallery img').first();
  await image.click();
  const initialSrc=await image.getAttribute('src');
  await page.locator('#liveCropShape').selectOption('rounded');
  const currentImagePatch=(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key))
    .find(p=>p.kind==='image'&&p.expected===initialSrc);
  expect(currentImagePatch?.imageCrop?.desktop?.mask).toBe('rounded');
  const para=frame.locator('main p').filter({
    hasText:'Our ensemble gave a formal concert in 2024'
  }).first();
  const selector=await para.evaluate(node=>{
    const parts=[];
    for(let el=node;el&&el.tagName!=='MAIN';el=el.parentElement){
      const peers=[...el.parentElement.children].filter(n=>n.tagName===el.tagName);
      parts.unshift(el.tagName.toLowerCase()+':nth-of-type('+
        (peers.indexOf(el)+1)+')');
    }
    return 'main > '+parts.join(' > ');
  });
  const original=await para.textContent();
  const old='Our ensemble gave a formal concert in 2024, and we participate in the Seoul Pride parade every year. We also give seasonal busking and smaller performances in support of queer rights. Playing together in public has given me a way to take part in Korean cultural traditions alongside people with whom ';
  expect(old.slice(0,96)).toBe(original.trim().slice(0,96));
  const textPatch={selector,kind:'text',expected:old,
    html:'<strong>Old paragraph replacement that must never overwrite current words</strong>',
    layout:{desktop:{dx:29,dy:0,sx:1,sy:1}},
    appearance:{align:'center'}};
  const both=JSON.stringify([currentImagePatch,textPatch]);
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,both]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await page.locator('#preview').click();
  await expect(page.locator('#previewDialog')).toBeHidden();
  await expect(page.locator('#status')).toContainText('text-source conflict');
  await page.locator('#publish').click();
  await page.locator('#checkPublishEdits').click();
  await expect(page.locator('#publishError')).toContainText('text-source conflict');
  expect(await page.locator('#imageReconnectPanel').evaluate(el=>el.open)).toBe(false);
  const resolve=page.locator('[data-resolve-text-selector]').first();
  await expect(resolve).toBeVisible();
  await resolve.click();
  await expect(page.locator('#staleTextResolveDialog')).toBeVisible();
  await expect(page.locator('#staleTextCurrent')).toContainText(
    'Our ensemble gave a formal concert in 2024');
  await expect(page.locator('#staleTextSaved')).toContainText(
    'Old paragraph replacement');
  await page.locator('#staleTextCancel').click();
  await expect(page.locator('#staleTextResolveDialog')).toBeHidden();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(both);
  await resolve.click();
  await expect(page.locator('#staleTextResolveDialog')).toBeVisible();
  const downloading=page.waitForEvent('download');
  await page.locator('#staleTextKeepCurrent').click();
  const backup=await downloading;
  expect(backup.suggestedFilename()).toBe(
    'interests.html.before-stale-text-resolution.live-draft.json');
  await expect(page.locator('#staleTextResolveDialog')).toBeHidden();
  const revised=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  expect(revised).toHaveLength(2);
  expect(revised.find(p=>p.kind==='image')).toEqual(currentImagePatch);
  const layout=revised.find(p=>p.kind==='layout'&&p.selector===selector);
  expect(layout).toBeTruthy();
  expect(layout.layout.desktop.dx).toBe(29);
  expect(layout.appearance.align).toBe('center');
  expect(layout.expected).toBe(original.trim().slice(0,300));
  expect(layout).not.toHaveProperty('html');
  await page.locator('#checkPublishEdits').click();
  await expect(page.locator('#publishError'))
    .toContainText('draft edits match the current GitHub source',{timeout:20000});
  await page.locator('#cancelPublish').click();
  await page.locator('#preview').click();
  await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
  const published=page.frameLocator('#previewFrame');
  await expect(published.locator('main p').filter({
    hasText:'Our ensemble gave a formal concert in 2024'
  }).first()).toHaveText(original.trim());
  await expect(published.locator('.pungmul-gallery img').first())
    .toHaveCSS('border-radius','12px');
  expect(writes).toEqual([]);
});

test('Stale text resolution rejects a changed GitHub source rather than rebasing into it',async({page})=>{
  const name='interests.html',writes=[],key='moon-academic-editor-v2:source:'+name;
  await installVerifiedCurrentSource(page,writes);
  await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const p=page.frameLocator('#livePageFrame').locator('main p')
    .filter({hasText:'Our ensemble gave a formal concert in 2024'}).first();
  const selector=await p.evaluate(node=>{
    const bits=[];
    for(let el=node;el&&el.tagName!=='MAIN';el=el.parentElement){
      const peers=[...el.parentElement.children].filter(n=>n.tagName===el.tagName);
      bits.unshift(el.tagName.toLowerCase()+':nth-of-type('+(peers.indexOf(el)+1)+')');
    }
    return 'main > '+bits.join(' > ');
  });
  const old='Our ensemble gave a formal concert in 2024, and we participate in the Seoul Pride parade every year. We also give seasonal busking and smaller performances in support of queer rights. Playing together in public has given me a way to take part in Korean cultural traditions alongside people with whom ';
  const value=JSON.stringify([{selector,kind:'text',expected:old,
    html:'Old wording that should not replace current text'}]);
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,value]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await page.locator('#publish').click();
  await page.locator('[data-resolve-text-selector]').first().click();
  await expect(page.locator('#staleTextResolveDialog')).toBeVisible();
  // Simulate a second tab changing this draft after review.
  await page.evaluate(k=>localStorage.setItem(k,JSON.stringify([])),key);
  await page.locator('#staleTextKeepCurrent').click();
  await expect(page.locator('#publishError'))
    .toContainText('Another editor tab changed this page');
  await expect(page.locator('#staleTextResolveDialog')).toBeHidden();
  expect(writes).toEqual([]);
});


test('Interests stale Pungmul section + 12 other edits preview and publish exact safe HTML',async({page})=>{
  const name='interests.html',unexpectedWrites=[],puts=[];
  await installVerifiedCurrentSource(page,unexpectedWrites);
  await page.route('https://api.github.com/repos/gmoon-code/gmoon-code.github.io/contents/'+name,
    async route=>{
      if(route.request().method()!=='PUT')return route.fallback();
      puts.push(JSON.parse(route.request().postData()));
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({commit:{sha:'mock-section-and-image-edits'}})});
    });
  await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const patches=await page.frameLocator('#livePageFrame').locator('main').evaluate(main=>{
    const selector=node=>{
      const steps=[];
      for(let n=node;n&&n.tagName!=='MAIN';n=n.parentElement){
        const peers=[...n.parentElement.children].filter(e=>e.tagName===n.tagName);
        steps.unshift(n.tagName.toLowerCase()+':nth-of-type('+
          (peers.indexOf(n)+1)+')');
      }
      return 'main > '+steps.join(' > ');
    };
    const section=main.querySelector('section.section');
    const layoutNodes=[section,...main.querySelectorAll('h1,h2,h3,h4,p,figcaption')].slice(0,11);
    if(layoutNodes.length!==11)throw Error('Insufficient original-layout elements');
    const edits=layoutNodes.map((node,i)=>{
      const expected=(node.textContent||'').trim().slice(0,300);
      const old=i===0?expected.replace(
        'as everyone listens and responds to one another',
        'through everyone listening and responding to one another'):expected;
      return {selector:selector(node),kind:'layout',tag:node.tagName.toLowerCase(),
        expected:old,
        layout:{desktop:{dx:i===0?12:0,dy:0,sx:1,sy:1}}};
    });
    if(edits[0].expected===((section.textContent||'').trim().slice(0,300)))
      throw Error('Historical container text was not changed for regression');
    for(const img of [...main.querySelectorAll('.pungmul-gallery img')]){
      const src=img.getAttribute('src');
      edits.push({selector:selector(img),kind:'image',tag:'img',
        expected:src,src,alt:img.alt,
        imageCrop:{desktop:{fit:'cover',x:50,y:50,zoom:100,mask:'rounded'}},
        layout:{desktop:{dx:0,dy:0,sx:1,sy:1,wrapWidth:230,reserveHeight:168}}});
    }
    return edits;
  });
  expect(patches).toHaveLength(13);
  const key='moon-academic-editor-v2:source:'+name;
  const snapshot=JSON.stringify(patches);
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,snapshot]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await expect(page.locator('#liveEditCount')).toContainText('13 draft edits');
  const originalText=await page.frameLocator('#livePageFrame').locator('main').evaluate(el=>
    el.textContent.replace(/\s+/g,' ').trim());
  await page.locator('#preview').click();
  await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
  const html=await page.locator('#previewFrame').getAttribute('srcdoc');
  const inspected=await page.evaluate(value=>{
    const d=new DOMParser().parseFromString(value,'text/html');
    const figures=[...d.querySelectorAll('.pungmul-gallery img')];
    return {text:d.querySelector('main').textContent.replace(/\s+/g,' ').trim(),
      src:figures.map(x=>x.getAttribute('src')),
      sheet:d.querySelector('#moon-v2-live-layout')?.textContent||''};
  },html);
  expect(inspected.text).toBe(originalText);
  expect(inspected.src).toEqual([
    'assets/interests-pungmul-street.webp',
    'assets/interests-pungmul-dancers.webp']);
  expect(inspected.sheet).toContain('border-radius:12px!important');
  await page.locator('#closePreview').click();
  await page.locator('#publish').click();
  await page.locator('#checkPublishEdits').click();
  await expect(page.locator('#publishError'))
    .toContainText('13 draft edits match the current GitHub source');
  await page.locator('#githubToken').fill('isolated-browser-test-only');
  await page.locator('#acknowledgeLive').check();
  await page.locator('#confirmPublish').click();
  await expect.poll(()=>puts.length,{timeout:20000}).toBe(1);
  const published=Buffer.from(puts[0].content,'base64').toString('utf8');
  expect(published).toBe(html);
  expect(puts[0].sha).toBe(blobSha(SOURCE.get(name)));
  // A confirmed publication archives the full 13-edit original draft, while
  // the active editor returns to the committed page with no pending patches.
  await expect(page.locator('#liveEditCount')).toContainText('No live-page draft edits');
  const active=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
  expect(active).toEqual([]);
  const archived=JSON.parse(await page.evaluate(n=>localStorage.getItem(
    'moon-academic-editor-v2:last-published-source:'+n),name));
  expect(archived.commit).toBe('mock-section-and-image-edits');
  expect(archived.patches).toEqual(patches);
  expect(archived.patches.filter(p=>p.kind==='image')).toHaveLength(2);
  expect(unexpectedWrites).toEqual([]);
});

test('A duplicated historical Interests section anchor never remaps an old container edit',async({page})=>{
  const name='interests.html',writes=[];
  const original=SOURCE.get(name).toString('utf8');
  const section=original.match(/<section class="section">[\s\S]*?<\/section>/);
  expect(section).toBeTruthy();
  const duplicated=original.replace(section[0],section[0]+section[0]);
  await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\//,
    async route=>{
      if(route.request().method()!=='GET'){
        writes.push(route.request().method());await route.abort();return;
      }
      const body=Buffer.from(duplicated);
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({type:'file',name,sha:blobSha(body),
          encoding:'base64',content:body.toString('base64')})});
    });
  await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const sectionNode=page.frameLocator('#livePageFrame').locator('main section.section').first();
  const expected=await sectionNode.evaluate(x=>x.textContent.trim().slice(0,300));
  const old=expected.replace(
    'as everyone listens and responds to one another',
    'through everyone listening and responding to one another');
  expect(old).not.toBe(expected);
  const patch={selector:'main > section:nth-of-type(2)',kind:'layout',
    tag:'section',expected:old,layout:{desktop:{dx:25,dy:0,sx:1,sy:1}}};
  const photo=await page.frameLocator('#livePageFrame')
    .locator('main section.section').first().locator('img').first().evaluate(img=>{
      const parts=[];
      for(let node=img;node&&node.tagName!=='MAIN';node=node.parentElement){
        const siblings=[...node.parentElement.children].filter(el=>el.tagName===node.tagName);
        parts.unshift(node.tagName.toLowerCase()+':nth-of-type('+
          (siblings.indexOf(node)+1)+')');
      }
      return {selector:'main > '+parts.join(' > '),
        src:img.getAttribute('src'),alt:img.alt};
    });
  const imagePatch={selector:photo.selector,kind:'image',tag:'img',
    expected:photo.src,src:photo.src,alt:photo.alt};
  const key='moon-academic-editor-v2:source:'+name,raw=JSON.stringify([patch,imagePatch]);
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,raw]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await page.locator('#preview').click();
  await expect(page.locator('#previewDialog')).toBeHidden();
  await expect(page.locator('#status')).toContainText(
    'No matching original element for saved section/container positioning edit');
  await page.locator('#publish').click();
  await page.locator('#checkPublishEdits').click();
  await expect(page.locator('#publishError')).toContainText(
    'saved section/container positioning edit');
  expect(await page.locator('#imageReconnectPanel').evaluate(el=>el.open)).toBe(false);
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(raw);
  expect(writes).toEqual([]);
});

test('A stale text-replacement section is not automatically rebased as layout',async({page})=>{
  const name='interests.html',writes=[];
  await installVerifiedCurrentSource(page,writes);
  await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const current=await page.frameLocator('#livePageFrame').locator('main section.section').first()
    .evaluate(x=>x.textContent.trim().slice(0,300));
  const expected=current.replace('as everyone listens and responds to one another',
    'through everyone listening and responding to one another');
  const patch={selector:'main > section:nth-of-type(2)',kind:'delete',
    expected,tag:'section'};
  const key='moon-academic-editor-v2:source:'+name,raw=JSON.stringify([patch]);
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,raw]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await page.locator('#preview').click();
  await expect(page.locator('#previewDialog')).toBeHidden();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(raw);
  expect(writes).toEqual([]);
});


test('Actual published Interests website is an unmodified read-only URL in the editor workspace',async({page})=>{
  const writes=[];
  await installVerifiedCurrentSource(page,writes);
  await page.setViewportSize({width:1512,height:980});
  await page.goto(BASE+'/editor-v2.html?page=interests.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await page.locator('#devicePreview').selectOption('browser');
  const draft=page.frameLocator('#livePageFrame');
  const draftWidth=await draft.locator('html').evaluate(el=>el.ownerDocument.defaultView.innerWidth);
  expect(draftWidth).toBe(1512);
  await page.locator('#inlinePublishedView').click();
  await expect(page.locator('#inlinePublishedFrame')).toBeVisible();
  await expect(page.locator('#livePageFrame')).toBeHidden();
  await expect(page.locator('#inlineViewNotice')).toContainText('ACTUAL PUBLISHED WEBSITE');
  await expect(page.locator('#inlinePublishedFrame')).toHaveAttribute('src',
    BASE+'/interests.html');
  expect(await page.locator('#inlinePublishedFrame').getAttribute('srcdoc')).toBeNull();
  await expect(page.locator('#addText')).toBeDisabled();
  await expect(page.locator('#liveInspector')).toBeHidden();
  const publicFrame=page.frameLocator('#inlinePublishedFrame');
  await expect(publicFrame.locator('.pungmul-gallery img')).toHaveCount(2);
  await expect(publicFrame.locator('.pungmul-gallery figcaption')).toHaveCount(0);
  expect(await publicFrame.locator('html').evaluate(el=>
    el.ownerDocument.defaultView.innerWidth)).toBe(1512);
  const actual=await publicFrame.locator('main').evaluate(main=>{
    const gallery=main.querySelector('.pungmul-gallery');
    const img=[...gallery.querySelectorAll('img')];
    return {
      text:main.textContent.replace(/\s+/g,' ').trim(),
      grid: getComputedStyle(gallery).gridTemplateColumns,
      boxes:img.map(node=>({
        width:Math.round(node.getBoundingClientRect().width),
        height:Math.round(node.getBoundingClientRect().height),
        radius:getComputedStyle(node).borderTopLeftRadius,
        src:node.getAttribute('src')
      }))
    };
  });
  await page.locator('#inlineDraftView').click();
  await expect(page.locator('#inlinePublishedFrame')).toBeHidden();
  await expect(page.locator('#livePageFrame')).toBeVisible();
  await expect(page.locator('#addText')).toBeEnabled();
  const srcDraft=await draft.locator('main').evaluate(main=>{
    const gallery=main.querySelector('.pungmul-gallery');
    return {text:main.textContent.replace(/\s+/g,' ').trim(),
      grid:getComputedStyle(gallery).gridTemplateColumns,
      boxes:[...gallery.querySelectorAll('img')].map(node=>({
        width:Math.round(node.getBoundingClientRect().width),
        height:Math.round(node.getBoundingClientRect().height),
        radius:getComputedStyle(node).borderTopLeftRadius,
        src:node.getAttribute('src')
      }))};
  });
  expect(srcDraft).toEqual(actual);
  expect(writes).toEqual([]);
});

test('Published Interests photo keeps visitor framing while draft oval crop stays editable',async({page})=>{
  const writes=[],name='interests.html',key='moon-academic-editor-v2:source:'+name;
  await installVerifiedCurrentSource(page,writes);
  await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const img=page.frameLocator('#livePageFrame').locator('.pungmul-gallery img').first();
  const patch=await img.evaluate(node=>{
    const parts=[];
    for(let n=node;n&&n.tagName!=='MAIN';n=n.parentElement){
      const peers=[...n.parentElement.children].filter(e=>e.tagName===n.tagName);
      parts.unshift(n.tagName.toLowerCase()+':nth-of-type('+
        (peers.indexOf(n)+1)+')');
    }
    const src=node.getAttribute('src');
    return {kind:'image',selector:'main > '+parts.join(' > '),tag:'img',
      expected:src,src,alt:node.alt,
      layout:{desktop:{dx:0,dy:0,sx:1,sy:1}},
      imageCrop:{desktop:{fit:'cover',x:50,y:50,zoom:100,mask:'oval'}}};
  });
  const originalSaved=JSON.stringify([patch]);
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,originalSaved]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const local=page.frameLocator('#livePageFrame').locator('.pungmul-gallery img').first();
  await expect(local).toHaveCSS('border-radius','50%');
  await page.locator('#inlinePublishedView').click();
  const publicImage=page.frameLocator('#inlinePublishedFrame')
    .locator('.pungmul-gallery img').first();
  await expect(publicImage).toBeVisible();
  expect(await publicImage.evaluate(node=>
    getComputedStyle(node).borderTopLeftRadius)).not.toBe('50%');
  expect(await publicImage.getAttribute('src')).toBe(patch.src);
  await expect(page.locator('#inlineViewNotice')).toContainText('1 unpublished draft edit');
  await expect(page.locator('#inlineViewNotice')).toContainText('NOT shown');
  await page.locator('#inlineDraftView').click();
  await expect(local).toHaveCSS('border-radius','50%');
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(originalSaved);
  await page.locator('#preview').click();
  await expect(page.locator('#previewDialog')).toBeVisible();
  await expect(page.frameLocator('#previewFrame').locator('.pungmul-gallery img').first())
    .toHaveCSS('border-radius','50%');
  expect(writes).toEqual([]);
});

test('Switching to design canvas from published view restores editing controls',async({page})=>{
  await installVerifiedCurrentSource(page,[]);
  await page.goto(BASE+'/editor-v2.html?page=interests.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await page.locator('#inlinePublishedView').click();
  await expect(page.locator('#addText')).toBeDisabled();
  await page.locator('#designMode').click();
  await expect(page.locator('#addText')).toBeEnabled();
  await expect(page.locator('#inlinePublishedView')).toBeHidden();
  await page.locator('#liveMode').click();
  await expect(page.locator('#livePageFrame')).toBeVisible();
  await expect(page.locator('#addText')).toBeEnabled();
});


// Real HTML regression. The old editor resized <img> while the linked
// <figure> and caption stayed behind, producing detached oval images.
// One composite image patch now owns the photo-frame geometry.
for(const [pageName,gallery] of [
  ['interests.html','.pungmul-gallery'],
  ['pungmul.html','.pungmul-performance-grid']
]){
  test('Linked gallery card moves/resizes photo AND caption without separate parent patch on '+pageName,async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+pageName,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const frame=page.frameLocator('#livePageFrame');
    const figure=frame.locator(gallery+' figure').first(),photo=figure.locator('img');
    await figure.scrollIntoViewIfNeeded();
    await photo.click();
    const control=page.locator('#livePhotoCardMode');
    await expect(control).toBeVisible();
    await expect(control).toBeChecked();
    const source=await photo.getAttribute('src');
    const original=await figure.evaluate(x=>{
      const b=x.getBoundingClientRect(),i=x.querySelector('img').getBoundingClientRect();
      const caption=x.querySelector('figcaption');
      return {w:b.width,h:b.height,image:i.height,
        captionTop:caption?.getBoundingClientRect().top??null,
        captionText:caption?.textContent.trim()??null};
    });
    // Widen only the first card's gallery track, and preserve its caption.
    const wanted=Math.round(original.w+55);
    await page.locator('#liveOriginalWidth').fill(String(wanted));
    await page.locator('#liveOriginalWidth').dispatchEvent('change');
    await expect.poll(()=>figure.evaluate(x=>x.getBoundingClientRect().width))
      .toBeGreaterThan(original.w+30);
    const resized=await figure.evaluate(x=>{
      const box=x.getBoundingClientRect(),img=x.querySelector('img').getBoundingClientRect();
      const caption=x.querySelector('figcaption');
      return {w:box.width,h:box.height,imgW:img.width,imgH:img.height,
        captionTop:caption?.getBoundingClientRect().top??null,
        captionText:caption?.textContent.trim()??null,
        overflow:getComputedStyle(x).overflow};
    });
    expect(Math.abs(resized.imgW-resized.w)).toBeLessThan(5);
    expect(resized.captionText).toBe(original.captionText);
    expect(resized.overflow).toBe('hidden');
    const sibling=frame.locator(gallery+' figure').nth(1);
    const siblingBeforeMove=await sibling.getAttribute('class');
    await page.locator('#liveMoveY').fill('24');
    await page.locator('#liveMoveY').dispatchEvent('change');
    await expect.poll(()=>figure.evaluate(x=>getComputedStyle(x).translate))
      .toContain('24px');
    expect(await sibling.getAttribute('class')).toBe(siblingBeforeMove);
    expect(await photo.getAttribute('src')).toBe(source);
    const afterMove=await figure.evaluate(x=>{
      const b=x.getBoundingClientRect(),i=x.querySelector('img').getBoundingClientRect();
      const caption=x.querySelector('figcaption');
      return {cardTop:b.top,imageTop:i.top,
        captionTop:caption?.getBoundingClientRect().top??null,
        imageBottom:i.bottom,cardBottom:b.bottom};
    });
    expect(afterMove.imageTop).toBeGreaterThanOrEqual(afterMove.cardTop);
    if(original.captionTop!==null){
      expect(afterMove.captionTop).toBeGreaterThanOrEqual(afterMove.imageBottom-2);
      expect(afterMove.cardBottom).toBeGreaterThan(afterMove.captionTop);
    }
    // Crop changes the photo inside the frame, not the parent/caption.
    await page.locator('#liveCropShape').selectOption('rounded');
    const beforeCrop=await figure.boundingBox();
    await page.locator('#liveCropLeft').evaluate(input=>{
      input.value="12";
      input.dispatchEvent(new Event("input",{bubbles:true}));
      input.dispatchEvent(new Event("change",{bubbles:true}));
    });
    const afterCrop=await figure.boundingBox();
    expect(Math.abs(afterCrop.width-beforeCrop.width)).toBeLessThan(2);
    await expect(photo).toHaveCSS('border-radius','12px');
    const key='moon-academic-editor-v2:source:'+pageName;
    const stored=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    expect(stored).toHaveLength(1);
    expect(stored[0].kind).toBe('image');
    expect(stored[0].frameMode).toBe('card');
    expect(stored[0].layout.desktop.wrapWidth).toBeGreaterThan(original.w+30);
    expect(stored[0].imageCrop.desktop.left).toBe(12);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible({timeout:20000});
    const preview=page.frameLocator('#previewFrame').locator(gallery+' figure').first();
    if(original.captionText!==null)
      await expect(preview.locator('figcaption')).toHaveText(original.captionText);
    else await expect(preview.locator('figcaption')).toHaveCount(0);
    await expect.poll(()=>preview.evaluate(x=>x.getBoundingClientRect().width))
      .toBeGreaterThan(original.w+30);
    await expect(preview.locator('img')).toHaveCSS('border-radius','12px');
    const markup=await page.locator('#previewFrame').getAttribute('srcdoc');
    expect(markup).toContain('grid-template-columns:');
    expect(markup).toContain('overflow:hidden!important');
    expect(writes).toEqual([]);
  });
}
test('Existing saved independent image edit remains unchanged until the author opts into card mode',async({page})=>{
  const name='interests.html',writes=[];
  await installVerifiedCurrentSource(page,writes);
  await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  const img=page.frameLocator('#livePageFrame').locator('.pungmul-gallery img').first();
  await img.click();
  const selector=await img.evaluate(node=>{
    const bits=[];
    for(let el=node;el&&el.tagName!=='MAIN';el=el.parentElement){
      const peers=[...el.parentElement.children].filter(n=>n.tagName===el.tagName);
      bits.unshift(el.tagName.toLowerCase()+':nth-of-type('+(peers.indexOf(el)+1)+')');
    }
    return 'main > '+bits.join(' > ');
  });
  const src=await img.getAttribute('src');
  const legacy={selector,kind:'image',expected:src,src,
    alt:await img.getAttribute('alt'),
    layout:{desktop:{dx:37,dy:0,sx:1,sy:1,wrapWidth:310,reserveHeight:170}}};
  const key='moon-academic-editor-v2:source:'+name,original=JSON.stringify([legacy]);
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,original]);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#liveAssetStatus'))
    .toContainText('GitHub main source verified',{timeout:35000});
  await page.frameLocator('#livePageFrame').locator('.pungmul-gallery img').first().click();
  await expect(page.locator('#livePhotoCardMode')).not.toBeChecked();
  expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(original);
  page.once('dialog',d=>d.accept());
  await page.locator('#livePhotoCardMode').check();
  await expect(page.locator('#livePhotoCardMode')).toBeChecked();
  const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  expect(after).toHaveLength(1);
  expect(after[0].frameMode).toBe('card');
  expect(after[0].src).toBe(src);
  expect(after[0].layout.desktop.dx).toBe(0);
  await page.locator('#undo').click();
  const undone=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  expect(undone).toEqual([legacy]);
  expect(writes).toEqual([]);
});



test('Fresh-source reset downloads page-edit backup, supports cancel, and restores the exact GitHub page',
  async({page})=>{
    const name='interests.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const paragraph=page.frameLocator('#livePageFrame').locator('main p')
      .filter({hasText:'Our ensemble gave a formal concert in 2024'}).first();
    await paragraph.click();
    const former=await page.locator('#liveTextAlign').inputValue();
    const changed=former==='right'?'center':'right';
    await page.locator('#liveTextAlign').selectOption(changed);
    const draft=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
    expect(draft).toHaveLength(1);
    await expect(paragraph).toHaveCSS('text-align',changed);
    const button=page.locator('#startFreshLiveDraft');
    const firstDownload=page.waitForEvent('download');
    await button.click();
    const firstBackup=await firstDownload;
    expect(firstBackup.suggestedFilename()).toBe(
      name+'.before-fresh-source.live-draft.json');
    expect(JSON.parse(readFileSync(await firstBackup.path(),'utf8')).patches)
      .toEqual(draft);
    await expect(page.locator('#freshLiveDraftDialog')).toBeVisible();
    await page.locator('#cancelFreshLiveDraft').click();
    expect(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)))
      .toEqual(draft);
    await expect(paragraph).toHaveCSS('text-align',changed);

    const secondDownload=page.waitForEvent('download');
    await button.click();
    const restorable=JSON.parse(readFileSync(await (await secondDownload).path(),'utf8'));
    await page.locator('#confirmFreshLiveDraft').click();
    await expect(page.locator('#liveEditCount')).toContainText(
      'No live-page draft edits',{timeout:12000});
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
    await expect(paragraph).not.toHaveCSS('text-align',changed);
    await expect(page.locator('#status')).toContainText('Fresh GitHub main source opened');

    await page.locator('#liveDraftFile').setInputFiles({
      name:name+'.live-draft.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(restorable))
    });
    await expect(page.locator('#liveDraftRestoreDialog')).toBeVisible();
    await page.locator('#confirmLiveDraftRestore').click();
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    await expect(paragraph).toHaveCSS('text-align',changed);
    expect(writes).toEqual([]);
  });

test('Fresh-source reset refuses unverifiable GitHub main and retains the draft',
  async({page})=>{
    const name='contact.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    await page.frameLocator('#livePageFrame').locator('main h1, main h2').first().click();
    const prev=await page.locator('#liveTextAlign').inputValue();
    await page.locator('#liveTextAlign').selectOption(prev==='right'?'center':'right');
    const raw=await page.evaluate(k=>localStorage.getItem(k),key);
    await page.route(/^https:\/\/api\.github\.com\/repos\/gmoon-code\/gmoon-code\.github\.io\/contents\//,
      async route=>route.fulfill({status:503,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},body:'{}'}));
    const download=page.waitForEvent('download');
    await page.locator('#startFreshLiveDraft').click();
    await download;
    await page.locator('#confirmFreshLiveDraft').click();
    await expect(page.locator('#status')).toContainText('Fresh start stopped');
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(raw);
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    expect(writes).toEqual([]);
  });


test('Pungmul independent draft photos never replace the original gallery when starting fresh',
  async({page})=>{
    const name='pungmul.html',key='moon-academic-editor-v2:source:'+name,writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.goto(BASE+'/editor-v2.html?page='+name,{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const photo=page.frameLocator('#livePageFrame').locator(
      '.pungmul-performance-grid img').first();
    await photo.click();
    // A newly added independent photo reproduces the duplicated layout
    // visible in the user's old Pungmul browser draft.
    await page.locator('#duplicate').click();
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');
    await expect(page.locator('#startFreshLiveDraftTop')).toBeEnabled();
    const added=page.frameLocator('#livePageFrame')
      .locator('[data-moon-v2-added-id]');
    await expect(added).toHaveCount(1);
    expect(await added.first().getAttribute('src')).toContain('assets/');
    await expect(page.locator('#liveImageOriginNotice')).toBeVisible();
    await expect(page.locator('#liveImageOriginNotice'))
      .toContainText('does not replace a photograph in the website gallery');

    const d=page.waitForEvent('download');
    await page.locator('#startFreshLiveDraftTop').click();
    const backup=JSON.parse(readFileSync(await (await d).path(),'utf8'));
    expect(backup.patches).toHaveLength(1);
    expect(backup.patches[0].kind).toBe('insert');
    await expect(page.locator('#freshLiveDraftDialog')).toBeVisible();
    await page.locator('#cancelFreshLiveDraft').click();
    await expect(added).toHaveCount(1);
    await expect(page.locator('#liveEditCount')).toContainText('1 draft edit');

    const anotherDownload=page.waitForEvent('download');
    await page.locator('#startFreshLiveDraftTop').click();
    await anotherDownload;
    await page.locator('#confirmFreshLiveDraft').click();
    await expect(page.locator('#liveEditCount')).toContainText('No live-page draft edits');
    await expect(added).toHaveCount(0);
    await expect(page.frameLocator('#livePageFrame')
      .locator('main .pungmul-performance-grid figure')).toHaveCount(4);
    await expect(page.frameLocator('#livePageFrame').locator('main img')).toHaveCount(5);
    expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBeNull();
    expect(writes).toEqual([]);
  });


test('Visitor Pungmul photos have no rectangular frame borders or clipped photo badges',
  async({page})=>{
    await page.goto(BASE+'/interests.html',{waitUntil:'domcontentloaded'});
    const figures=page.locator('#main.interests-page .pungmul-gallery figure');
    await expect(figures).toHaveCount(2);
    for(const figure of await figures.all()){
      await expect(figure).toHaveCSS('border-top-width','0px');
      await expect(figure).toHaveCSS('border-right-width','0px');
    }
    const links=page.locator('#main.interests-page .pungmul-gallery a[target="_blank"]');
    await expect(links).toHaveCount(2);
    for(const link of await links.all()){
      expect(await link.evaluate(el=>getComputedStyle(el,'::after').content)).toBe('none');
      await expect(link.locator('img')).toBeVisible();
    }
    // The soft image crop also belongs to the photograph on a narrow screen.
    await page.setViewportSize({width:375,height:850});
    for(const link of await links.all()){
      expect(await link.locator('img').evaluate(el=>
        parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThan(8);
    }

    await page.goto(BASE+'/pungmul.html',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#main.pungmul-deep-page .pungmul-hero-photo img'))
      .toHaveCSS('border-top-width','0px');
    const deepFigures=page.locator('#main.pungmul-deep-page .pungmul-performance-grid figure');
    await expect(deepFigures).toHaveCount(4);
    const photoLinks=page.locator('#main.pungmul-deep-page .pungmul-performance-grid a[target="_blank"]');
    await expect(photoLinks).toHaveCount(4);
    for(const link of await photoLinks.all()){
      expect(await link.evaluate(el=>getComputedStyle(el,'::after').content)).toBe('none');
    }
    for(const figure of await deepFigures.all()){
      await expect(figure).toHaveCSS('border-top-width','0px');
      await expect(figure.locator('img')).toHaveCSS('border-top-left-radius','12px');
    }
  });


test('Pungmul gallery trims four independent edges then resizes without changing columns or crop proportions',
  async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.setViewportSize({width:1740,height:1050});
    await page.goto(BASE+'/editor-v2.html?page=pungmul.html',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const frame=page.frameLocator('#livePageFrame');
    const gallery=frame.locator('.pungmul-performance-grid');
    const image=gallery.locator('figure img').first();
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
    const columns=()=>gallery.evaluate(g=>getComputedStyle(g).gridTemplateColumns.trim().split(/\s+/).length);
    expect(await columns(),'published Pungmul grid starts with two tracks').toBe(2);
    // Resizing one card must not mutate the size, crop, content or responsive
    // layout of the next card. A shared grid-track override caused this bug.
    const untouched=gallery.locator('figure img').nth(1);
    const untouchedSnapshot=()=>untouched.evaluate(img=>{
      const r=img.getBoundingClientRect(),css=getComputedStyle(img);
      const card=img.closest('figure').getBoundingClientRect();
      return {w:r.width,h:r.height,cardWidth:card.width,
        src:img.getAttribute('src'),alt:img.alt,
        bg:css.backgroundImage,backgroundSize:css.backgroundSize,
        objectFit:css.objectFit,objectPosition:css.objectPosition};
    });
    const originalSibling=await untouchedSnapshot();
    const originalGrid=await gallery.evaluate(el=>getComputedStyle(el).gridTemplateColumns);
    await image.click();
    await expect(page.locator('#livePhotoCardMode')).toBeChecked();
    await page.locator('#cropImageTool').click();
    // Entering crop mode does not modify an untouched photograph.
    const initialFit=await page.locator('#liveCropFit').inputValue();
    expect(['contain','cover']).toContain(initialFit);
    // Drag each individual pink side handle, then refine each edge using
    // the numeric controls. This covers the two distinct crop workflows.
    for(const [side,dx,dy,field] of [
      ['w',36,0,'Left'],['e',-36,0,'Right'],
      ['n',0,36,'Top'],['s',0,-36,'Bottom']
    ]){
      // The last grip can initially sit beyond the iframe's visible fold
      // even though Playwright considers it CSS-visible. Centre the picture
      // before each pointer interaction, and allow scroll-driven overlay sync.
      await image.evaluate(img=>img.scrollIntoView({block:'center',inline:'nearest'}));
      const grip=frame.locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="'+side+'"]');
      await expect(grip).toBeVisible();
      await expect.poll(()=>grip.boundingBox().then(box=>box!==null&&box.y>=0&&
        box.y+box.height<=1050)).toBe(true);
      // Playwright's hover validates the actual topmost pointer target,
      // important for small overlay handles inside a transformed iframe.
      await grip.hover();
      const box=await grip.boundingBox();
      const x=box.x+box.width/2,y=box.y+box.height/2;
      await page.mouse.down();
      await page.mouse.move(x+dx,y+dy,{steps:6});
      await page.mouse.up();
      expect(parseInt(await page.locator('#liveCrop'+field+'Value').textContent(),10),
        'pointer trimming '+field).toBeGreaterThan(0);
    }
    await expect(page.locator('#liveCropFit')).toHaveValue('cover');
    // Exercise all independently trimmed sides, not only a shape preset.
    const edges={Left:12,Right:9,Top:7,Bottom:11};
    for(const [side,amount] of Object.entries(edges)){
      await page.locator('#liveCrop'+side).evaluate((input,value)=>{
        input.value=String(value);
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
      },amount);
      await expect(page.locator('#liveCrop'+side+'Value')).toHaveText(amount+'%');
    }
    await expect(image).toHaveCSS('object-fit','none');
    await page.locator('#cropImageTool').click();
    const before=await image.evaluate(img=>{
      const r=img.getBoundingClientRect();return {w:r.width,h:r.height};
    });
    const requested=Math.round(before.w+48);
    await page.locator('#liveOriginalWidth').fill(String(requested));
    await page.locator('#liveOriginalWidth').dispatchEvent('change');
    expect(await columns(),'resizing must not switch the gallery from two to three columns').toBe(2);
    const after=await image.evaluate(img=>{
      const r=img.getBoundingClientRect(),s=getComputedStyle(img);
      const [paintW,paintH]=s.backgroundSize.split(' ').map(parseFloat);
      return {w:r.width,h:r.height,paintW,paintH,objectFit:s.objectFit,
        bg:s.backgroundImage,src:img.getAttribute('src'),ratio:img.naturalWidth/img.naturalHeight};
    });
    expect(after.w).toBeGreaterThan(before.w+20);
    expect(await untouchedSnapshot(),'cropping and numeric resize must not modify another photo')
      .toEqual(originalSibling);
    expect(await gallery.evaluate(el=>getComputedStyle(el).gridTemplateColumns),
      'the editor must not rewrite shared gallery track widths').toBe(originalGrid);
    expect(Math.abs(after.h-before.h*after.w/before.w),
      'locked numeric resize must preserve the visible cropped-frame ratio').toBeLessThan(5);
    expect(after.objectFit).toBe('none');
    expect(after.bg).toContain('pungmul-ensemble-stage-photo.webp');
    const fx=1-(edges.Left+edges.Right)/100,fy=1-(edges.Top+edges.Bottom)/100;
    const expectedPaintW=Math.max(after.w/fx,after.h*after.ratio/fy);
    expect(Math.abs(after.paintW-expectedPaintW),
      'background paint uses the real resized frame width').toBeLessThan(5);
    expect(Math.abs(after.paintH-after.paintW/after.ratio)).toBeLessThan(2);
    // Now use the actual corner handle. The caption's natural height must
    // not be included in the photograph's locked aspect-ratio calculation.
    await image.evaluate(img=>img.scrollIntoView({block:'center'}));
    const corner=frame.locator('#moon-v2-live-overlay .moon-v2-grip[data-direction="se"]');
    await expect(corner).toBeVisible();
    // Verify the actual resize grip receives the pointer even in WebKit,
    // where the source iframe is scaled inside the editor workspace.
    await corner.hover();
    const handle=await corner.boundingBox();
    const hx=handle.x+handle.width/2,hy=handle.y+handle.height/2;
    await page.mouse.down();
    await page.mouse.move(hx+28,hy+28,{steps:8});await page.mouse.up();
    const final=await image.evaluate(img=>{
      const r=img.getBoundingClientRect(),s=getComputedStyle(img);
      const [paintW,paintH]=s.backgroundSize.split(' ').map(parseFloat);
      return {w:r.width,h:r.height,paintW,paintH};
    });
    expect(final.w,'pointer resize changes cropped image width').toBeGreaterThan(after.w+10);
    expect(await untouchedSnapshot(),'pointer resize must not modify another photo')
      .toEqual(originalSibling);
    expect(Math.abs(final.h-after.h*final.w/after.w),
      'pointer resize keeps the cropped photo ratio, excluding its caption').toBeLessThan(5);
    const finalPaintW=Math.max(final.w/fx,final.h*after.ratio/fy);
    expect(Math.abs(final.paintW-finalPaintW)).toBeLessThan(5);
    expect(Math.abs(final.paintH-final.paintW/after.ratio)).toBeLessThan(2);
    const key='moon-academic-editor-v2:source:pungmul.html';
    const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    const crop=saved.find(x=>x.kind==='image'&&x.imageCrop?.desktop)?.imageCrop.desktop;
    expect(crop).toMatchObject({left:12,right:9,top:7,bottom:11});
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const preview=page.frameLocator('#previewFrame')
      .locator('.pungmul-performance-grid figure img').first();
    const previewMetrics=await preview.evaluate(img=>{
      const r=img.getBoundingClientRect(),s=getComputedStyle(img);
      return {w:r.width,h:r.height,backgroundSize:s.backgroundSize};
    });
    expect(Math.abs(previewMetrics.w-final.w)).toBeLessThan(5);
    expect(Math.abs(previewMetrics.h-final.h)).toBeLessThan(5);
    expect(previewMetrics.backgroundSize).toBe(
      final.paintW+'px '+final.paintH+'px');
    const previewSibling=page.frameLocator('#previewFrame')
      .locator('.pungmul-performance-grid figure img').nth(1);
    const unchangedPreview=await previewSibling.evaluate(img=>{
      const r=img.getBoundingClientRect(),css=getComputedStyle(img);
      const card=img.closest('figure').getBoundingClientRect();
      return {w:r.width,h:r.height,cardWidth:card.width,
        src:img.getAttribute('src'),alt:img.alt,
        bg:css.backgroundImage,backgroundSize:css.backgroundSize,
        objectFit:css.objectFit,objectPosition:css.objectPosition};
    });
    expect(unchangedPreview,'Verified preview must preserve the untouched photograph')
      .toEqual(originalSibling);
    expect(writes).toEqual([]);
  });

test('Interests gallery numeric resizing changes only the selected photo and its caption card',
  async({page})=>{
    const writes=[];
    await installVerifiedCurrentSource(page,writes);
    await page.setViewportSize({width:1740,height:1050});
    await page.goto(BASE+'/editor-v2.html?page=interests.html',
      {waitUntil:'domcontentloaded'});
    await expect(page.locator('#liveAssetStatus'))
      .toContainText('GitHub main source verified',{timeout:35000});
    const frame=page.frameLocator('#livePageFrame');
    const gallery=frame.locator('.pungmul-gallery');
    const selected=gallery.locator('figure img').first();
    const sibling=gallery.locator('figure img').nth(1);
    await selected.scrollIntoViewIfNeeded();
    await expect.poll(()=>selected.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
    const metrics=img=>img.evaluate(el=>{
      const r=el.getBoundingClientRect(),css=getComputedStyle(el);
      const figure=el.closest('figure').getBoundingClientRect();
      return {width:r.width,height:r.height,cardWidth:figure.width,
        src:el.getAttribute('src'),alt:el.alt,
        objectFit:css.objectFit,objectPosition:css.objectPosition,
        backgroundSize:css.backgroundSize,backgroundImage:css.backgroundImage};
    });
    const untouched=await metrics(sibling);
    const initialColumns=await gallery.evaluate(g=>getComputedStyle(g).gridTemplateColumns);
    await selected.click();
    await expect(page.locator('#livePhotoCardMode')).toBeChecked();
    await page.locator('#liveOriginalWidth').fill(
      String(Math.round((await metrics(selected)).width+42)));
    await page.locator('#liveOriginalWidth').dispatchEvent('change');
    expect(await metrics(sibling)).toEqual(untouched);
    expect(await gallery.evaluate(g=>getComputedStyle(g).gridTemplateColumns))
      .toBe(initialColumns);
    await page.locator('#liveCropLeft').evaluate(el=>{
      el.value='10';
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });
    expect(await metrics(sibling)).toEqual(untouched);
    await page.locator('#preview').click();
    await expect(page.locator('#previewDialog')).toBeVisible();
    const other=page.frameLocator('#previewFrame')
      .locator('.pungmul-gallery figure img').nth(1);
    expect(await metrics(other)).toEqual(untouched);
    expect(writes).toEqual([]);
  });
