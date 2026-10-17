import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const origin='https://gmoon-code.github.io';
const out='docs/visual-audit';
const cases=[
  {path:'projects.html',key:'projects',figures:2},
  {path:'story-method.html',key:'story',figures:1,preview:'story'},
  {path:'research-methods-studio.html',key:'methods',figures:1,preview:'methods'}
];
const sizes=[
  {name:'desktop',width:1440,height:900},
  {name:'tablet',width:768,height:1024},
  {name:'phone',width:390,height:844}
];
const errors=[],results=[];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const target of cases){
  for(const viewport of sizes){
   const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce',colorScheme:'light'});
   const page=await context.newPage();
   const pageIssues=[];
   page.on('pageerror',e=>pageIssues.push(String(e.message).slice(0,300)));
   try {
    const response=await page.goto(origin+'/'+target.path,{waitUntil:'load',timeout:60000});
    if(!response||response.status()>=400)throw Error('HTTP '+response?.status());
    await page.locator('figure.project-interface-figure img').first().waitFor({state:'attached'});
    const audit=await page.evaluate(async()=>{
      const figures=[...document.querySelectorAll('figure.project-interface-figure')];
      await Promise.all(figures.map(f=>f.querySelector('img')?.decode().catch(()=>{})));
      const metrics=figures.map((f,i)=>{
        const im=f.querySelector('img'),cap=f.querySelector('figcaption'),link=f.querySelector('a[href$=".webp"]');
        const box=im?.getBoundingClientRect(),cb=cap?.getBoundingClientRect();
        return {index:i+1,src:im?.getAttribute('src'),alt:im?.getAttribute('alt'),naturalWidth:im?.naturalWidth,naturalHeight:im?.naturalHeight,imageWidth:Math.round(box?.width||0),imageHeight:Math.round(box?.height||0),captionGap:Math.round((cb?.top||0)-(box?.bottom||0)),captionText:cap?.innerText?.slice(0,180),fullSize:link?.getAttribute('href'),opensNewTab:link?.getAttribute('target')==='_blank',overflowLeft:(box?.left||0)<-2,overflowRight:(box?.right||0)>innerWidth+2};
      });
      const img=figures[0]?.querySelector('img');const ancestors=[];for(let e=img;e&&ancestors.length<10;e=e.parentElement){const cs=getComputedStyle(e),r=e.getBoundingClientRect();ancestors.push({tag:e.tagName,cls:String(e.className).slice(0,120),display:cs.display,visibility:cs.visibility,rectWidth:Math.round(r.width),rectHeight:Math.round(r.height),hidden:e.hidden})}return {viewport:innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,pageHeight:document.documentElement.scrollHeight,figures:metrics,ancestors};
    });
    const failures=[];
    if(audit.docWidth>viewport.width+2||audit.bodyWidth>viewport.width+2)failures.push('horizontal overflow');
    if(audit.figures.length!==target.figures)failures.push('wrong figure count');
    for(const fig of audit.figures){
      if(!fig.naturalWidth||!fig.naturalHeight)failures.push('missing image '+fig.index);
      if(fig.imageWidth<200)failures.push('image too narrow '+fig.index);
      if(fig.imageWidth===0)failures.push('image zero width '+fig.index);
      if(fig.captionGap< -2)failures.push('caption overlaps image '+fig.index);
      if(fig.overflowLeft||fig.overflowRight)failures.push('image outside viewport '+fig.index);
      if(!fig.alt||!fig.captionText||!fig.opensNewTab)failures.push('missing alt, caption or link '+fig.index);
    }
    const shots=[];
    if(viewport.name!=='tablet' && audit.figures.every(f=>f.imageWidth>0 && f.imageHeight>0)){
      for(let i=0;i<audit.figures.length;i++){
        const parent=target.key==='projects'?page.locator('article.project-showcase-item').nth(i):page.locator('figure.project-interface-figure').nth(i);
        const png=await parent.screenshot({animations:'disabled'});
        const file=out+'/'+target.key+'-'+(i+1)+'-'+viewport.name+'.webp';
        await sharp(png).resize({width:1100,withoutEnlargement:true}).webp({quality:82,effort:5}).toFile(file);
        shots.push(file);
      }
    }
    let previewResult=null;
    if(target.preview){
      const panel=page.locator('[data-live-preview="'+target.preview+'"]');
      const open=panel.locator('[data-preview-open]');
      await open.waitFor({state:'visible',timeout:15000});
      await open.click();
      const frame=panel.locator('iframe');
      await frame.waitFor({state:'attached',timeout:15000});
      const iframeSrc=await frame.getAttribute('src');
      previewResult={src:iframeSrc,title:await frame.getAttribute('title'),closeWorked:false};
      if(!iframeSrc?.startsWith(origin+'/'))failures.push('invalid preview iframe URL');
      await panel.locator('[data-preview-close]').click();
      previewResult.closeWorked=(await panel.locator('iframe').count())===0;
      if(!previewResult.closeWorked)failures.push('preview did not close');
    }
    if(pageIssues.length)failures.push('page errors '+pageIssues.join('; '));
    if(failures.length)errors.push({page:target.path,size:viewport.name,failures});
    results.push({page:target.path,size:viewport.name,audit,preview:previewResult,shots,failures});
    console.log(JSON.stringify({page:target.path,size:viewport.name,failures}));
   }catch(e){
     const issue=String(e.message||e).slice(0,600);
     errors.push({page:target.path,size:viewport.name,failures:[issue]});
     results.push({page:target.path,size:viewport.name,error:issue});
     console.error(target.path,viewport.name,issue);
   }finally{await context.close();}
  }
 }
}finally{
 await browser.close();
 await writeFile(out+'/report.json',JSON.stringify({createdAt:new Date().toISOString(),errors,results},null,2)+'\n');
}
