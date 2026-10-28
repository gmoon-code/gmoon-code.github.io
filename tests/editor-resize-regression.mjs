// Browser regression tests for the academic portfolio free-canvas editor.
// Runs against a local static server, never against the public site.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {chromium} from "playwright";

const root=process.cwd();
let publishedIndexOverride=null;
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",
  ".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(pathname==="/index.html"&&publishedIndexOverride!==null){
      res.writeHead(200,{"Content-Type":"text/html"});
      res.end(publishedIndexOverride);
      return;
    }
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
page.on("console",message=>{
  if(message.type()==="warning"||message.type()==="error")
    console.log("BROWSER",message.type(),message.text().slice(0,2500));
});
function closeTo(a,b){return Math.abs(a-b)<=5}
async function pagePoint(element){
  return element.evaluate(node=>{
    const r=node.getBoundingClientRect(),win=node.ownerDocument.defaultView;
    return {x:r.left+win.scrollX,y:r.top+win.scrollY};
  });
}
async function resize(label,subject,neighbor){
  await subject.scrollIntoViewIfNeeded();
  await subject.click();
  const handle=page.frameLocator("#pageFrame")
    .locator('#moon-free-selection [data-free-direction="se"]');
  await handle.waitFor({state:"visible"});
  const oldBox=await subject.boundingBox(),fixedBefore=await pagePoint(neighbor);
  assert(oldBox&&fixedBefore,label+" must be visible");
  const control=await handle.boundingBox();
  assert(control,label+" resize handle missing");
  await page.mouse.move(control.x+control.width/2,control.y+control.height/2);
  await page.mouse.down();
  await page.mouse.move(control.x+control.width/2+42,
    control.y+control.height/2+30,{steps:9});
  await page.mouse.up();
  const now=await subject.boundingBox(),fixedAfter=await pagePoint(neighbor);
  const diagnostic=await subject.evaluate(node=>({
    element:node.outerHTML.slice(0,700),
    width:getComputedStyle(node).width,
    position:getComputedStyle(node).position,
    parent:node.parentElement?.className,
    footprint:node.getAttribute("data-moon-free-footprint")?.slice(0,130)
  })).catch(()=>null);
  const warning=await page.locator("#noticeDialog[open] #noticeMessage").allTextContents();
  console.log("Resize diagnostic",JSON.stringify({label,oldBox,now,fixedBefore,
    fixedAfter,warning,diagnostic}));
  assert(now&&fixedAfter,label+" vanished during resize");
  assert(now.width>=oldBox.width+20,label+" did not grow as requested");
  assert(closeTo(fixedAfter.x,fixedBefore.x)&&closeTo(fixedAfter.y,fixedBefore.y),
    label+" moved neighbouring page content");
  assert.equal(await page.locator("#noticeDialog[open]").count(),0,
    label+" triggered a page-protection error");
  console.log("PASS",label,"width",oldBox.width,"=>",now.width);
  return {before:oldBox,after:now};
}
try{
  await page.goto(base+"/editor.html",{waitUntil:"domcontentloaded"});
  const frame=page.frameLocator("#pageFrame");
  await frame.locator("main .home-lead").waitFor({state:"visible",timeout:25000});
  const paragraph=frame.locator("main .home-lead").first();
  const paragraphResult=await resize("paragraph",paragraph,frame.locator("main h1").first());
  // Undo and Redo must each restore the exact expected geometry.
  await page.locator("#undoBtn").click();
  const revertedParagraph=await paragraph.boundingBox();
  assert(revertedParagraph&&closeTo(revertedParagraph.width,paragraphResult.before.width),
    "Undo did not restore the paragraph dimensions");
  await page.locator("#redoBtn").click();
  const redoneParagraph=await paragraph.boundingBox();
  assert(redoneParagraph&&closeTo(redoneParagraph.width,paragraphResult.after.width),
    "Redo did not restore the paragraph resize");
  console.log("PASS paragraph Undo/Redo");
  // The resized geometry must persist to the browser-local draft.
  await page.keyboard.press("Control+s");
  await page.reload({waitUntil:"domcontentloaded"});
  await paragraph.waitFor({state:"visible",timeout:25000});
  const restoredParagraph=await paragraph.boundingBox();
  assert(restoredParagraph&&closeTo(restoredParagraph.width,paragraphResult.after.width),
    "paragraph resize was lost after saving and reloading");
  console.log("PASS saved resize restored");
  // Start the image test from the original content, not the text test draft.
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:"domcontentloaded"});
  await frame.locator('main img[data-moon-v2-added-id]')
    .waitFor({state:"visible",timeout:25000});
  const image=frame.locator('main img[data-moon-v2-added-id]').first();
  const imageResult=await resize("image",image,frame.locator("main h1").first());
  await page.locator("#undoBtn").click();
  const undoneImage=await image.boundingBox();
  assert(undoneImage&&closeTo(undoneImage.width,imageResult.before.width),
    "undo did not restore the original image dimensions");
  console.log("PASS image resize undo");
  await page.locator("#redoBtn").click();
  const redoneImage=await image.boundingBox();
  assert(redoneImage&&closeTo(redoneImage.width,imageResult.after.width),
    "Redo did not restore the image resize");
  // Verify that exported HTML contains a retained layout slot and the
  // corresponding floating image. This exercises the publishing assembler.
  const pendingDownload=page.waitForEvent("download",{timeout:15000});
  await page.locator("#exportBtn").click();
  const download=await pendingDownload;
  const exported=await readFile(await download.path(),"utf8");
  assert(exported.includes("data-moon-free-placeholder="),
    "Published HTML omitted the layout-preserving placeholder");
  assert(exported.includes("data-moon-free-footprint="),
    "Published HTML omitted the original geometry measurements");
  assert(exported.includes("moon-free-responsive.js"),
    "Published HTML omitted the mobile reading-order runtime");
  console.log("PASS exported layout footprint and responsive runtime");
  // Simulate publishing the HTML and reopening it in the same editor.
  // Layout placeholders must not become editable source objects.
  publishedIndexOverride=exported;
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:"domcontentloaded"});
  await frame.locator('main img[data-moon-v2-added-id]')
    .waitFor({state:"visible",timeout:25000});
  const placeholderCount=await frame.locator("main [data-moon-free-placeholder]").count();
  assert(placeholderCount>=1,"Published site did not retain its layout slot");
  assert.equal(await frame.locator(
    'main [data-moon-free-placeholder][data-editor-key]').count(),0,
    "Published placeholders were incorrectly registered as editable content");
  console.log("PASS published page reopens without ghost editable objects");
  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  try{
    await mobile.goto(base+"/index.html",{waitUntil:"load"});
    const mobileImage=mobile.locator('main img[data-moon-v2-added-id]').first();
    await mobileImage.waitFor({state:"visible",timeout:15000});
    await mobile.waitForFunction(()=>{
      const node=document.querySelector('main img[data-moon-v2-added-id]');
      return node&&!node.parentElement?.classList.contains("moon-free-layer");
    },null,{timeout:10000});
    const mobileImageBox=await mobileImage.boundingBox();
    assert(mobileImageBox&&mobileImageBox.width<=390,
      "Published image overflows the mobile screen");
    const placeholder=mobile.locator('main [data-moon-free-placeholder]');
    assert.equal(await placeholder.count(),0,
      "Invisible layout holder should be detached from mobile reading order");
    console.log("PASS published mobile sizing and reading order");
  }finally{await mobile.close();}
  // Newly inserted images use a separate <p><img></p> sizing path. Check
  // that the image itself never spills out of its resized outer box.
  publishedIndexOverride=null;
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:"domcontentloaded"});
  const anchor=frame.locator("main .home-lead").first();
  await anchor.waitFor({state:"visible",timeout:25000});
  await anchor.click();
  await page.locator("#insertContentKind").selectOption("image");
  await page.locator("#insertContentText").fill("Temporary image for resize regression");
  await page.locator("#insertImageSrc").fill("assets/profile-portrait.webp");
  await page.locator("#insertContentBtn").click();
  const inserted=frame.locator("main [data-editor-added-index]").first();
  await inserted.waitFor({state:"visible"});
  await resize("new image block",inserted,frame.locator("main h1").first());
  const inner=inserted.locator("img").first();
  const outerBox=await inserted.boundingBox(),innerBox=await inner.boundingBox();
  assert(outerBox&&innerBox,"New image disappeared");
  assert(innerBox.width<=outerBox.width+3&&innerBox.height<=outerBox.height+3,
    "Inserted image overflowed its resized frame");
  console.log("PASS inserted image contained in resized frame");
  // Resizing from the west and north must leave the opposite edges fixed.
  for(const [direction,dx,dy] of [["w",25,0],["n",0,20]]){
    await inserted.click();
    const resizeGrip=frame.locator(
      '#moon-free-selection [data-free-direction="'+direction+'"]');
    await resizeGrip.waitFor({state:"visible"});
    const before=await inserted.boundingBox();
    const grip=await resizeGrip.boundingBox();
    assert(before&&grip,"Missing "+direction+" handle");
    await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
    await page.mouse.down();
    await page.mouse.move(grip.x+grip.width/2+dx,
      grip.y+grip.height/2+dy,{steps:8});
    await page.mouse.up();
    const after=await inserted.boundingBox();
    assert(after,"Object disappeared when resizing from "+direction);
    if(direction==="w"){
      assert(after.width<=before.width-12,"West handle did not shrink width");
      assert(closeTo(after.x+after.width,before.x+before.width),
        "West resizing moved the right edge");
    }else{
      assert(after.height<=before.height-12,"North handle did not shrink height");
      assert(closeTo(after.y+after.height,before.y+before.height),
        "North resizing moved the bottom edge");
    }
    console.log("PASS anchored "+direction+" resize");
  }
}catch(error){
  const {mkdir}=await import("node:fs/promises");
  await mkdir("test-artifacts",{recursive:true});
  await page.screenshot({path:"test-artifacts/resizing-failure.png",fullPage:true})
    .catch(()=>{});
  console.error("Resize regression failed:",error.stack||String(error));
  throw error;
}finally{
  await browser.close();
  await new Promise(ok=>server.close(ok));
}
