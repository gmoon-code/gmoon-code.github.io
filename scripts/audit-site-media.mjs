import {chromium} from 'playwright';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';

const out='docs/visual-audit';
const root='https://gmoon-code.github.io/';
const paths=[
 'index.html','about.html','research.html','teaching.html','projects.html','interests.html',
 'cv.html','research-action.html','research-scoping.html','story-method.html',
 'research-methods-studio.html','teaching-ap-biology.html','teaching-ap-evolution.html',
 'teaching-ap-chemistry.html','writing-biological-classification.html','teaching-osmosis-practice.html'
];
const viewports=[{name:'desktop',width:1440,height:900},{name:'phone',width:390,height:844}];
const captures=new Set(['about.html','research.html','projects.html','interests.html','teaching-ap-biology.html','teaching-ap-evolution.html','writing-biological-classification.html']);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try{
 for(const viewport of viewports){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
  for(const path of paths){
    const page=await context.newPage(),issues=[];
    page.on('pageerror',e=>issues.push(String(e.message).slice(0,300)));
    try{
      const response=await page.goto(root+path,{waitUntil:'domcontentloaded',timeout:45000});
      if(!response||response.status()>=400)throw Error('HTTP '+response?.status());
      await page.locator('body').waitFor({state:'visible',timeout:12000});
      const images=page.locator('main img'),count=await images.count(),readings=[];
      for(let i=0;i<count;i++){
        const img=images.nth(i);
        await img.scrollIntoViewIfNeeded({timeout:10000});
        await img.evaluate(async image=>{
          await Promise.race([
            image.decode().catch(()=>{}),
            new Promise(done=>setTimeout(done,10000))
          ]);
        });
        readings.push(await img.evaluate(image=>{
          const box=image.getBoundingClientRect();
          return {
            src:image.getAttribute('src'),naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,
            complete:image.complete,renderedWidth:Math.round(box.width),renderedHeight:Math.round(box.height),
            left:Math.round(box.left),right:Math.round(box.right),
            alt:image.getAttribute('alt'),loading:image.getAttribute('loading'),
            source:image.currentSrc
          };
        }));
      }
      const geometry=await page.evaluate(()=>{
        const figures=[...document.querySelectorAll('main figure')];
        return {
          docWidth:document.documentElement.scrollWidth,
          bodyWidth:document.body.scrollWidth,
          viewportWidth:innerWidth,
          figures:figures.map(f=>{
            const rect=f.getBoundingClientRect();
            return {className:f.className,hasCaption:!!f.querySelector('figcaption'),
              hasAccessibleName:!!f.querySelector('figcaption')||!!f.getAttribute('aria-label')||!!f.getAttribute('aria-labelledby'),
              width:Math.round(rect.width),left:Math.round(rect.left),right:Math.round(rect.right),
              contentChars:(f.querySelector('figcaption')?.innerText||'').length};
          })
        };
      });
      let screenshot;
      if(captures.has(path)&&viewport.name==='phone'){
        const first=page.locator('main figure').first();
        if(await first.count()){
          await first.scrollIntoViewIfNeeded();
          const png=await first.screenshot({animations:'disabled',timeout:20000});
          const name=path.replace('.html','');
          screenshot=out+'/site-media-'+name+'-phone.webp';
          await sharp(png).resize({width:650,withoutEnlargement:true}).webp({quality:80,effort:5}).toFile(screenshot);
        }
      }
      let showLogoMetrics=[];
      if(path==='interests.html'){
        showLogoMetrics=await page.locator('.media-shelf-shows img.media-logo').evaluateAll(images=>images.map(im=>{
          const c=getComputedStyle(im),r=im.getBoundingClientRect();
          return {src:im.getAttribute('src'),objectFit:c.objectFit,
            width:Math.round(r.width),height:Math.round(r.height),naturalWidth:im.naturalWidth,
            naturalHeight:im.naturalHeight};
        }));
        const shows=page.locator('.media-shelf').nth(1).locator('article.media-entry');
        for(let i=0;i<await shows.count();i++){
          const card=shows.nth(i);
          await card.scrollIntoViewIfNeeded();
          const img=card.locator('img');
          await img.evaluate(image=>image.decode().catch(()=>{}));
          const png=await card.screenshot({animations:'disabled'});
          const file=out+'/site-shows-'+(i+1)+'-'+viewport.name+'.webp';
          await sharp(png).resize({width:900,withoutEnlargement:true}).webp({quality:83,effort:5}).toFile(file);
        }
      }
      const failures=[];
      if(geometry.docWidth>viewport.width+3||geometry.bodyWidth>viewport.width+3)
        failures.push('horizontal overflow');
      readings.forEach((img,i)=>{
        if(!img.naturalWidth)failures.push('image '+(i+1)+' failed to load: '+img.src);
        if(img.renderedWidth<80)failures.push('image '+(i+1)+' unexpectedly narrow');
        if(img.left< -4||img.right>viewport.width+4)failures.push('image '+(i+1)+' outside viewport');
        if(img.alt===null)failures.push('image '+(i+1)+' has no alt attribute');
      });
      if(path==='interests.html'){
        if(showLogoMetrics.length!==2)failures.push('expected two show wordmarks');
        const targetHeight=viewport.width<=480?74:88;
        for(const logo of showLogoMetrics){
          if(logo.objectFit!=='contain')failures.push('wordmark is cropped rather than contained');
          if(Math.abs(logo.height-targetHeight)>1)failures.push('wrong wordmark frame height');
        }
      }
      if(issues.length)failures.push('JS errors: '+issues.join(' | '));
      results.push({path,viewport:viewport.name,geometry,images:readings,showLogoMetrics,screenshot,failures});
      console.log(JSON.stringify({path,viewport:viewport.name,imageCount:count,failures}));
    }catch(e){
      const msg=String(e.message||e).slice(0,480);
      results.push({path,viewport:viewport.name,failures:['Page audit failed: '+msg]});
      console.error(path,viewport.name,msg);
    }finally{await page.close();}
  }
  await context.close();
 }
}finally{
 await browser.close();
 await writeFile(out+'/site-media-report.json',JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
}
