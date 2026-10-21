import {chromium} from "playwright";
import assert from "node:assert/strict";
import {readFile, mkdir} from "node:fs/promises";
import path from "node:path";

const base=process.env.EDITOR_TEST_URL||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:950}});
const page=await context.newPage();
const errors=[];
page.on("pageerror",error=>errors.push(error.message));
await mkdir("/tmp/editor-test-artifacts",{recursive:true});

async function ready(file="index.html") {
  await page.goto(base+"/editor.html",{waitUntil:"domcontentloaded"});
  await page.frameLocator("#pageFrame").locator("main").waitFor();
  await page.waitForFunction(()=>document.getElementById("pageFrame")?.contentDocument?.querySelector("main"));
  assert.equal(await page.locator("#pagePicker").inputValue(),file);
}
async function downloadedHtml() {
  const pending=page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const file=await pending;
  const text=await readFile(await file.path(),"utf8");
  assert.equal(file.suggestedFilename(),"index.html");
  assert(text.startsWith("<!doctype html>"),"Export should preserve original document shape");
  assert(!text.includes("data-editor-selected"),"Editor markers must never be exported");
  assert(!text.includes('data-editor-key="'),"Editor keys must never be exported");
  return text;
}
function checkNoPageErrors(where) {
  assert.deepEqual(errors,[], "Browser errors during "+where);
}

try {
  await ready();
  // An optional single bookmark opens the complete directory without
  // requiring credentials or enabling editor publication rights.
  const directory=await context.newPage();
  await directory.goto(base+"/editors.html",{waitUntil:"domcontentloaded"});
  assert.equal(await directory.title(),"Website Editors | Ye Eun Moon");
  const hubLinks=await directory.locator(".editor-card a").evaluateAll(links=>
    links.map(link=>new URL(link.href).pathname));
  assert.deepEqual(hubLinks,[
    "/editor.html",
    "/research-methods/editor.html",
    "/memory-palace-u1-8/editor.html"
  ]);
  assert.equal(await directory.locator(".editor-card").count(),3);
  assert.match(await directory.locator("footer").textContent(),
    /publicly viewable/);
  await directory.screenshot({
    path:"/tmp/editor-test-artifacts/all-editors-directory-desktop.png",
    fullPage:true
  });
  await directory.setViewportSize({width:390,height:844});
  const directoryMobile=await directory.evaluate(()=>({
    viewport:window.innerWidth,
    documentWidth:document.documentElement.scrollWidth,
    columns:getComputedStyle(document.querySelector(".editor-grid"))
      .gridTemplateColumns.trim().split(/\s+/).length
  }));
  assert.equal(directoryMobile.columns,1);
  assert(directoryMobile.documentWidth<=directoryMobile.viewport+1,
    "The editor directory must fit mobile screens without horizontal overflow");
  await directory.screenshot({
    path:"/tmp/editor-test-artifacts/all-editors-directory-mobile.png",
    fullPage:true
  });
  await directory.close();
  // All three editors can be bookmarked under GitHub Pages. Cross-site links
  // open separately so unfinished portfolio wording remains in this tab.
  const otherEditors=await page.locator(".other-editor-links a").evaluateAll(links=>
    links.map(link=>({
      pathname:new URL(link.href).pathname,
      target:link.target,
      noopener:link.rel.split(/\s+/).includes("noopener")
    })));
  assert.deepEqual(otherEditors,[
    {pathname:"/research-methods/editor.html",target:"_blank",noopener:true},
    {pathname:"/memory-palace-u1-8/editor.html",target:"_blank",noopener:true}
  ]);
  assert.equal(await page.locator('.editor-site-link[href="./editors.html"]')
    .getAttribute("target"),"_blank");
  await page.screenshot({path:"/tmp/editor-test-artifacts/desktop-editor.png",fullPage:true});
  assert.equal(await page.locator("#publisherConnect").isDisabled(),true,
    "Owner sign-in must remain disabled when no private publisher is configured");
  assert.equal(await page.locator("#publisherPropose").isDisabled(),true,
    "Publishing must fail closed without a private service");
  assert.equal(await page.locator("#exportBtn").isDisabled(),true);
  const kicker=page.frameLocator("#pageFrame").locator("main .home-kicker").first();
  await kicker.click();
  assert.equal(await page.locator("#selectionTag").textContent(),"p");
  await page.locator("#selectionText").fill("Editable site heading for a smoke test");
  await page.locator("#textAlignment").selectOption("center");
  assert.equal(await kicker.evaluate(el=>el.style.textAlign),"center");
  assert.equal((await kicker.textContent()).trim(),"Editable site heading for a smoke test");
  assert.equal(await page.locator("#exportBtn").isEnabled(),true);
  await page.locator("#reviewBtn").click();
  assert.equal(await page.locator("#reviewDialog").isVisible(),true);
  assert.match(await page.locator("#reviewChangeList").textContent(),/Before[\s\S]*After/);
  assert.match(await page.locator("#reviewExportStatus").textContent(),/Source check passed/);
  await page.locator("#reviewDialog form button").click();
  const html=await downloadedHtml();
  assert(html.includes("Editable site heading for a smoke test"),"Changed text must be exported");
  assert(/style="[^"]*text-align:\s*center/.test(html),
    "Selected text alignment must survive source export");
  assert(!html.includes("javascript:void"),"No scripts should be introduced");

  await page.reload({waitUntil:"domcontentloaded"});
  await page.frameLocator("#pageFrame").locator("main").waitFor();
  assert.equal(await page.frameLocator("#pageFrame").locator(".home-kicker").first().textContent(),
    "Editable site heading for a smoke test","Local edits should persist across reloads");

  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#resetBtn").click();
  await page.frameLocator("#pageFrame").locator(".home-kicker").first().waitFor();
  assert.notEqual((await page.frameLocator("#pageFrame").locator(".home-kicker").first().textContent()).trim(),
    "Editable site heading for a smoke test","Reset must restore original content");
  checkNoPageErrors("text and draft");

  await page.locator("#pagePicker").selectOption("interests.html");
  await page.frameLocator("#pageFrame").getByText("The Hobbit",{exact:true}).first().waitFor();
  await page.locator("#previewViewport").selectOption("mobile");
  assert.match(await page.locator("#previewContainer").getAttribute("class"),/mobile/);
  await page.locator("#previewTheme").selectOption("dark");
  assert.equal(await page.locator("#pageFrame").evaluate(frame=>frame.contentDocument.documentElement.getAttribute("data-moon-theme")),"dark");
  await page.screenshot({path:"/tmp/editor-test-artifacts/dark-mobile-preview.png",fullPage:true});
  checkNoPageErrors("page switching and responsive preview");

  // Separate context to test link destination on an untouched home page.
  await page.goto(base+"/editor.html");
  const link=page.frameLocator("#pageFrame").locator("main a.inline-link").first();
  await link.waitFor();
  await link.click();
  assert.equal(await page.locator("#linkFields").isVisible(),true);
  await page.locator("#linkHref").fill("research.html#editor-test");
  await page.locator("#linkHref").press("Tab");
  const linked=await downloadedHtml();
  assert(linked.includes('href="research.html#editor-test"'),"Link change must survive export");
  checkNoPageErrors("link editing");

  // Test image descriptions and attribute export on a real image.
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#resetBtn").click();
  const image=page.frameLocator("#pageFrame").locator("main img").first();
  await image.click();
  assert.equal(await page.locator("#imageFields").isVisible(),true);
  await page.locator("#imageAlt").fill("Editor visual test image description");
  await page.locator("#imageAlt").press("Tab");
  await page.locator("#imageMaxWidth").selectOption("50%");
  assert.equal(await image.evaluate(el=>el.style.maxWidth),"50%");
  const imageHtml=await downloadedHtml();
  assert(imageHtml.includes('alt="Editor visual test image description"'),
    "Image description must survive source export");
  assert(/style="[^"]*max-width:\s*50%/.test(imageHtml),
    "Selected image width must survive source export");

  // The image library lists real assets already referenced by site pages.
  await page.locator("#chooseExistingImage").click();
  await page.locator("#mediaDialog").waitFor({state:"visible"});
  await page.locator("#mediaSearch").fill("pungmul-stage");
  const replacement=page.locator("#mediaResults .media-option")
    .filter({hasText:"assets/pungmul-stage.webp"}).first();
  await replacement.click();
  assert.equal(await image.getAttribute("src"),"assets/pungmul-stage.webp");
  assert.equal(await page.locator("#imageSrc").inputValue(),"assets/pungmul-stage.webp");

  // Stage an actual, browser-decodable PNG without uploading it to GitHub.
  const tinyPng="iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR4nGNsS3BkIAUwkaR6VMOohiGlAQC5pAFHpALGkwAAAABJRU5ErkJggg==";
  await page.locator("#newImageFile").setInputFiles({
    name:"editor-test.png",mimeType:"image/png",buffer:Buffer.from(tinyPng,"base64")
  });
  await page.locator("#stageImageBtn").click();
  await page.waitForFunction(()=>document.querySelector("#stagedImageStatus")?.textContent.includes("staged at "));
  const stagedPath=await page.locator("#imageSrc").inputValue();
  assert.match(stagedPath,/^assets\/editor-[a-z0-9-]+\.png$/);
  assert.match(await image.getAttribute("src"),/^blob:/,
    "Selected image should display the local staged binary in the isolated preview");
  const stagedHtml=await downloadedHtml();
  assert(stagedHtml.includes('src="'+stagedPath+'"'),
    "Exported HTML must reference the staged image filename");
  const downloadPending=page.waitForEvent("download");
  await page.locator("#downloadStagedImage").click();
  const mediaDownload=await downloadPending;
  assert.equal(mediaDownload.suggestedFilename(),stagedPath.split("/").at(-1));
  assert.deepEqual(Buffer.from(await readFile(await mediaDownload.path())),
    Buffer.from(tinyPng,"base64"));

  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#resetBtn").click();
  // Drag-only changes must export and survive reload, even with zero text edits.
  const dragRows=page.locator("#sectionList .section-order-row");
  assert.equal(await dragRows.nth(1).getAttribute("draggable"),"true");
  await dragRows.nth(1).dragTo(dragRows.nth(0),{targetPosition:{x:30,y:2}});
  assert.match(await page.frameLocator("#pageFrame")
    .locator("main > section").first().getAttribute("class"),/home-green/,
    "Dragging should move the intended section visually");
  assert.equal(await page.locator("#exportBtn").isEnabled(),true,
    "A reorder-only draft must remain exportable");
  await page.locator("#reviewBtn").click();
  assert.match(await page.locator("#reviewSummary").textContent(),/section order changed/);
  assert.match(await page.locator("#reviewExportStatus").textContent(),/Source check passed/);
  await page.locator("#reviewDialog form button").click();
  const reorderedOnly=await downloadedHtml();
  assert(reorderedOnly.indexOf('home-green home-pathways')<
    reorderedOnly.indexOf('home-yellow home-intro'),
    "Reordering without edited text must survive HTML export");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.frameLocator("#pageFrame").locator("main > section").first().waitFor();
  assert.match(await page.frameLocator("#pageFrame")
    .locator("main > section").first().getAttribute("class"),/home-green/,
    "Reorder-only local drafts must survive reload");
  // A second drag after the first move verifies that the group boundary
  // tracks its current siblings, not the original final section ID.
  const dragRowsAgain=page.locator("#sectionList .section-order-row");
  await dragRowsAgain.nth(1).dragTo(dragRowsAgain.nth(0),{targetPosition:{x:30,y:2}});
  assert.match(await page.frameLocator("#pageFrame")
    .locator("main > section").first().getAttribute("class"),/home-yellow/,
    "The second drag should restore the original first section");
  assert.equal(await page.locator("#resetBtn").isDisabled(),true,
    "Reversing every section move should clear all local changes");

  const first=page.frameLocator("#pageFrame").locator("main > section").first();
  assert.match(await first.getAttribute("class"),/home-yellow/);
  await page.locator("#sectionList .section-order-row").nth(1)
    .locator("button[aria-label^='Move up']").click();
  assert.match(await first.getAttribute("class"),/home-green/);
  // A structural move must safely compose with an ordinary text edit.
  const movedParagraph=page.frameLocator("#pageFrame")
    .locator("main > section.home-green p").first();
  await movedParagraph.click();
  await page.locator("#selectionText").fill("Combined structural and text edit test");
  const movedHtml=await downloadedHtml();
  assert(movedHtml.includes("Combined structural and text edit test"),
    "Reordering must retain edited text inside the moved section");
  assert(movedHtml.indexOf('home-green home-pathways')<
    movedHtml.indexOf('home-yellow home-intro'),
    "Exported sections must follow the new visual order");
  assert(!movedHtml.includes('data-editor-section'),
    "Section editor markers must not enter the published HTML");
  await page.reload();
  await page.frameLocator("#pageFrame").locator("main > section").first().waitFor();
  assert.match(await page.frameLocator("#pageFrame")
    .locator("main > section").first().getAttribute("class"),/home-green/,
    "The section order should survive a local draft reload");
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#resetBtn").click();
  assert.match(await page.frameLocator("#pageFrame")
    .locator("main > section").first().getAttribute("class"),/home-yellow/);
  const pages=[
    "index.html","research.html","projects.html","teaching.html","interests.html",
    "about.html","cv.html","pungmul.html","research-action.html",
    "research-scoping.html","writing-biological-classification.html",
    "research-methods-studio.html","story-method.html","teaching-ap-biology.html",
    "teaching-ap-chemistry.html","teaching-ap-evolution.html",
    "teaching-osmosis-practice.html"
  ];
  for (const file of pages) {
    await page.locator("#pagePicker").selectOption(file);
    await page.waitForFunction(name=>{
      const menu=document.querySelector("#pagePicker");
      const status=document.querySelector("#editorSaveStatus")?.textContent||"";
      const frame=document.querySelector("#pageFrame");
      return menu?.value===name&&
        (status.startsWith("Ready to edit")||status.startsWith("Draft restored"))&&
        !!frame?.contentDocument?.querySelector("main");
    },file,{timeout:12000});
    assert(await page.locator("#outline button").count()>0,
      "Expected editable outline in "+file);
    if(file==="teaching.html"||file==="research.html"){
      assert.equal(await page.locator("#sectionList .section-order-actions button:enabled").count(),0,
        "In-page section moves must be disabled when contents navigation would become stale");
    }
  }
  checkNoPageErrors("all 17 portfolio pages");
  console.log("PASS: text, drafts, reset, link/image export, 17 pages, dark/mobile previews");
} finally {
  await page.screenshot({path:"/tmp/editor-test-artifacts/editor-last.png",fullPage:true}).catch(()=>{});
  await browser.close();
}