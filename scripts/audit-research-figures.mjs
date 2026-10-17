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
      for(const [selector,name] of [
        ['figure.research-inquiry-figure','inquiry'],
        ['figure.research-evidence-figure','evidence']
      ]){
        const fig=page.locator(selector);
        await fig.waitFor({state:'visible'});
        await fig.scrollIntoViewIfNeeded();
        const png=await fig.screenshot({animations:'disabled'});
        await sharp(png).resize({width:1200,withoutEnlargement:true}).webp({quality:83,effort:5}).toFile(out+'/research-'+name+'-'+view.label+'.webp');
      }
      const metric=await page.evaluate(()=>{
        const elems=[...document.querySelectorAll('figure.research-inquiry-figure,figure.research-evidence-figure')];
        return {
          documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,
          viewportWidth:innerWidth,
          figures:elems.map(f=>{
            const r=f.getBoundingClientRect(),c=f.querySelector('figcaption')?.getBoundingClientRect();
            return {name:f.className,boxWidth:Math.round(r.width),left:Math.round(r.left),right:Math.round(r.right),captionBelow:!!c&&c.top>r.top,cited:!!f.querySelector('.figure-source'),caption:!!f.querySelector('figcaption'),childText:f.innerText.slice(0,130)};
          }),
          strands:[...document.querySelectorAll('.research-inquiry-strand')].map(e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width)}}),
          evidenceStages:[...document.querySelectorAll('.research-evidence-path>div')].map(e=>{const r=e.getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width)}})
        };
      });
      const problems=[];
      if(metric.bodyWidth>view.width+2||metric.documentWidth>view.width+2)problems.push('Horizontal page overflow');
      if(metric.figures.length!==2)problems.push('Expected two figures');
      for(const f of metric.figures){if(f.right>view.width+2||f.left< -2)problems.push('Figure outside viewport '+f.name);if(!f.caption||!f.cited||!f.captionBelow)problems.push('Missing caption/source '+f.name)}
      if(jsErrors.length)problems.push(...jsErrors);
      checks.push({size:view.label,metrics:metric,problems});
    }catch(e){checks.push({size:view.label,problems:[String(e.message).slice(0,700)]})}
    finally{await ctx.close()}
  }
}finally{await browser.close()}
await writeFile(out+'/research-figures-report.json',JSON.stringify({testedAt:new Date().toISOString(),checks},null,2)+'\n');
