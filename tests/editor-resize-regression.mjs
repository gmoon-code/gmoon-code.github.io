// Browser regression tests for the academic portfolio free-canvas editor.
// Runs against a local static server, never against the public site.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",
  ".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const full=resolve(root,"."+pathname);
    if(full!==root&&!full.startsWith(root+sep)){res.writeHead(403).end();return;}
    const file=await readFile(full===root?resolve(root,"index.html"):full);
    res.writeHead(200,{"Content-Type":types[extname(full)]||"application/octet-stream"});
    res.end(file);
  }catch{res.writeHead(404).end("Not found");}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const address=server.address();
const base="http://127.0.0.1:"+address.port;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:1680,height:1000}});
function closeTo(a,b){return Math.abs(a-b)<=5}
async function resize(label,subject,neighbor){
  await subject.scrollIntoViewIfNeeded();
  await subject.click();
  const handle=page.frameLocator("#pageFrame")
    .locator('#moon-free-selection [data-free-direction="se"]');
  await handle.waitFor({state:"visible"});
  const oldBox=await subject.boundingBox(),fixedBefore=await neighbor.boundingBox();
  assert(oldBox&&fixedBefore,label+" must be visible");
  const control=await handle.boundingBox();
  assert(control,label+" resize handle missing");
  await page.mouse.move(control.x+control.width/2,control.y+control.height/2);
  await page.mouse.down();
  await page.mouse.move(control.x+control.width/2+42,
    control.y+control.height/2+30,{steps:9});
  await page.mouse.up();
  const now=await subject.boundingBox(),fixedAfter=await neighbor.boundingBox();
  assert(now&&fixedAfter,label+" vanished during resize");
  assert(now.width>=oldBox.width+20,label+" did not grow as requested");
  assert(closeTo(fixedAfter.x,fixedBefore.x)&&closeTo(fixedAfter.y,fixedBefore.y),
    label+" moved neighbouring page content");
  assert.equal(await page.locator("#noticeDialog[open]").count(),0,
    label+" triggered a page-protection error");
  console.log("PASS",label,"width",oldBox.width,"=>",now.width);
}
try{
  await page.goto(base+"/editor.html",{waitUntil:"domcontentloaded"});
  const frame=page.frameLocator("#pageFrame");
  await frame.locator("main .home-lead").waitFor({state:"visible",timeout:25000});
  await resize("paragraph",frame.locator("main .home-lead").first(),
    frame.locator("main h1").first());
  await page.reload({waitUntil:"domcontentloaded"});
  await frame.locator('main img[src*="profile-portrait"]')
    .waitFor({state:"visible",timeout:25000});
  await resize("image",frame.locator('main img[src*="profile-portrait"]').first(),
    frame.locator("main h1").first());
}finally{
  await browser.close();
  await new Promise(ok=>server.close(ok));
}
