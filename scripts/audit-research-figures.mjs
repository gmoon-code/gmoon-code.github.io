import { chromium } from 'playwright';
import sharp from 'sharp';
import {mkdir, writeFile} from 'node:fs/promises';

const base='https://gmoon-code.github.io/';
const out='docs/visual-audit';
const widths=[
  {label:'desktop',width:1440,height:900},
  {label:'tablet',width:768,height:1024},
  {label:'mobile',width:390,height:844}
];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const checks=[];
try{
  for(const view of widths){
    const ctx=await browser.newContext({viewport:{width:view.width,height:view.height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await ctx.newPage();
    const jsErrors=[];
    page.on('pageerror',e=>jsErrors.push(String(e)));
    try{
      const response=await page.goto(base+'research.html',{waitUntil:'load',timeout:60000});
      if(!response||response.status()>=400)throw Error('Research page returned '+response?.status());
      const fig=page.locator('figure.research-published-figure');
      await fig.waitFor({state:'attached'});
      await fig.scrollIntoViewIfNeeded();
      const img=fig.locator('img');
      await img.evaluate(image=>image.decode().catch(()=>{}));
      const png=await fig.screenshot({animations:'disabled'});
      await sharp(png).resize({width:1200,withoutEnlargement:true}).webp({quality:83,effort:5}).toFile(out+'/research-published-'+view.label+'.webp');
      const metric=await page.evaluate(()=>{
        const elems=[...document.querySelectorAll('figure.research-published-figure')];
        return {
          documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,
          viewportWidth:innerWidth,
          figures:elems.map(f=>{
            const r=f.getBoundingClientRect(),c=f.querySelector('figcaption')?.getBoundingClientRect();
            const im=f.querySelector('img');return {name:f.className,boxWidth:Math.round(r.width),left:Math.round(r.left),right:Math.round(r.right),captionBelow:!!c&&c.top>r.top,cited:!!f.querySelector('.figure-source'),caption:!!f.querySelector('figcaption'),imageLoaded:!!im?.naturalWidth,imageWidth:im?.naturalWidth,imageHeight:im?.naturalHeight,childText:f.innerText.slice(0,130)};
          }),

        };
      });
      const problems=[];
      if(metric.bodyWidth>view.width+2||metric.documentWidth>view.width+2)problems.push('Horizontal page overflow');
      if(metric.figures.length!==1)problems.push('Expected one original published figure');
      for(const f of metric.figures){if(f.right>view.width+2||f.left< -2)problems.push('Figure outside viewport '+f.name);if(!f.caption||!f.cited||!f.captionBelow)problems.push('Missing caption/source '+f.name);if(!f.imageLoaded||f.imageWidth<500)problems.push('Publisher image failed to load '+f.name)}
      if(jsErrors.length)problems.push(...jsErrors);
      checks.push({size:view.label,metrics:metric,problems});
    }catch(e){checks.push({size:view.label,problems:[String(e.message).slice(0,700)]})}
    finally{await ctx.close()}
  }
}finally{await browser.close()}
await writeFile(out+'/research-figures-report.json',JSON.stringify({testedAt:new Date().toISOString(),checks},null,2)+'\n');
