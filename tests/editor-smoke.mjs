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
  // Desktop editing surfaces can be expanded independently, without
  // modifying the source page or activating the publisher.
  const originalCanvasWidth=await page.locator("#editorPreview")
    .evaluate(el=>el.getBoundingClientRect().width);
  await page.locator("#togglePagesPanel").click();
  assert.equal(await page.locator("#editorNavigation").isVisible(),false);
  assert.equal(await page.locator("#togglePagesPanel").getAttribute("aria-expanded"),"false");
  assert((await page.locator("#editorPreview").evaluate(
    el=>el.getBoundingClientRect().width))>originalCanvasWidth+150);
  await page.locator("#toggleInspectorPanel").click();
  assert.equal(await page.locator("#editorSettings").isVisible(),false);
  assert.equal(await page.locator("#exportBtn").isDisabled(),true);
  await page.reload({waitUntil:"domcontentloaded"});
  await page.frameLocator("#pageFrame").locator("main").waitFor();
  assert.equal(await page.locator("#editorNavigation").isVisible(),false);
  assert.equal(await page.locator("#editorSettings").isVisible(),false);
  await page.screenshot({
    path:"/tmp/editor-test-artifacts/academic-canvas-focus-desktop.png",fullPage:true
  });
  // Keyboard shortcuts restore workspace controls without introducing edits.
  await page.keyboard.press("Alt+Shift+c");
  assert.equal(await page.locator("#editorNavigation").isVisible(),true);
  assert.equal(await page.locator("#editorSettings").isVisible(),true);
  assert.equal(await page.locator("#toggleCanvasFocus").getAttribute("aria-pressed"),"false");
  await page.keyboard.press("Alt+Shift+c");
  assert.equal(await page.locator("#editorNavigation").isVisible(),false);
  assert.equal(await page.locator("#editorSettings").isVisible(),false);
  assert.equal(await page.locator("#toggleCanvasFocus").getAttribute("aria-pressed"),"true");
  await page.keyboard.press("/");
  assert.equal(await page.locator("#editorNavigation").isVisible(),true);
  assert.equal(await page.locator("#pageFindQuery").evaluate(el=>document.activeElement===el),true);
  await page.locator("#pageFindQuery").fill("research");
  await page.locator("#pageFindQuery").press("/");
  assert.equal(await page.locator("#pageFindQuery").inputValue(),"research/");
  await page.locator("#pageFindQuery").fill("");
  await page.locator("#pageFindQuery").blur();
  assert.equal(await page.locator("#exportBtn").isDisabled(),true);
  console.log("PASS: keyboard canvas focus, page search and text-field safety");
  await page.frameLocator("#pageFrame").locator("main .home-kicker").first().click();
  await page.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Focus selected block details in inspector"}).click();
  assert.equal(await page.locator("#editorSettings").isVisible(),true);
  assert.equal(await page.locator("#selectionText")
    .evaluate(el=>document.activeElement===el),true);
  // The "/" shortcut already reopened Pages. Keep it visible for the next step.
  if(!(await page.locator("#editorNavigation").isVisible()))
    await page.locator("#togglePagesPanel").click();
  assert.equal(await page.locator("#editorNavigation").isVisible(),true);
  assert.equal(await page.locator("#exportBtn").isDisabled(),true);
  // Resize an existing heading through its on-canvas handle using the keyboard.
  await page.frameLocator("#pageFrame").locator("main .home-kicker").first().click();
  const resizeHandle=page.frameLocator("#pageFrame").locator("#moon-source-width-handle");
  await resizeHandle.focus();
  await resizeHandle.press("Home");
  assert.equal(await page.frameLocator("#pageFrame").locator("main .home-kicker").first()
    .evaluate(el=>el.style.maxWidth),"30%");
  await resizeHandle.press("ArrowRight");
  assert.equal(await page.frameLocator("#pageFrame").locator("main .home-kicker").first()
    .evaluate(el=>el.style.maxWidth),"35%");
  await resizeHandle.press("End");
  assert.equal(await page.frameLocator("#pageFrame").locator("main .home-kicker").first()
    .evaluate(el=>el.style.maxWidth),"");
  console.log("PASS: source text resize handle supports keyboard and reset");
  // The next browse scenario requires no selected element at page load.
  // UI panel preferences persist, but this navigation resets selection.
  await ready();
  // Navigate original blocks without changing the source or creating tab traps.
  assert.equal(await page.locator("#browseNextElement").isEnabled(),true);
  await page.locator("#browseNextElement").click();
  const firstBrowse=await page.locator("#pageFrame").evaluate(frame=>
    frame.contentDocument.querySelector("[data-editor-selected]")?.getAttribute("data-editor-key"));
  assert.match(firstBrowse,/^e\d+$/);
  assert.match(await page.locator("#browseElementStatus").textContent(),/Element 1 of/);
  await page.locator("#browseNextElement").click();
  const secondBrowse=await page.locator("#pageFrame").evaluate(frame=>
    frame.contentDocument.querySelector("[data-editor-selected]")?.getAttribute("data-editor-key"));
  assert.notEqual(secondBrowse,firstBrowse);
  await page.locator("#browsePrevElement").click();
  assert.equal(await page.locator("#pageFrame").evaluate(frame=>
    frame.contentDocument.querySelector("[data-editor-selected]")?.getAttribute("data-editor-key")),firstBrowse);
  assert.equal(await page.locator("#exportBtn").isDisabled(),true,
    "Browsing content must not create an exportable change");
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
  const headingOffsets=await directory.locator(".editor-card h2").evaluateAll(
    nodes=>nodes.map(node=>node.getBoundingClientRect().top)
  );
  assert(Math.max(...headingOffsets)-Math.min(...headingOffsets)<=2,
    "Desktop editor directory headings should share one visual baseline");
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

  // Test the actual editor application at phone width, not merely the
  // internal "Mobile" preview inside a desktop-sized editor window.
  const phoneEditor=await context.newPage();
  const phoneErrors=[];
  phoneEditor.on("pageerror",error=>phoneErrors.push(error.message));
  await phoneEditor.setViewportSize({width:390,height:844});
  await phoneEditor.goto(base+"/editor.html",{waitUntil:"domcontentloaded"});
  assert.equal(await phoneEditor.locator("#togglePagesPanel").isVisible(),false,
    "Phone editors must retain visible navigation and inspector");
  await phoneEditor.frameLocator("#pageFrame").locator("main .home-kicker")
    .first().waitFor();
  const phoneMetrics=await phoneEditor.evaluate(()=>{
    const rect=id=>document.querySelector(id).getBoundingClientRect();
    return {
      viewport:innerWidth,
      documentWidth:document.documentElement.scrollWidth,
      topbarWidth:rect(".editor-topbar").width,
      previewTop:rect(".editor-workspace").top,
      sidebarTop:rect(".editor-sidebar").top,
      inspectorTop:rect(".editor-inspector").top,
      frameWidth:rect("#pageFrame").width
    };
  });
  assert(phoneMetrics.documentWidth<=phoneMetrics.viewport+1,
    "The complete academic editor must fit a 390px phone without horizontal overflow");
  assert(phoneMetrics.previewTop<phoneMetrics.inspectorTop&&
    phoneMetrics.inspectorTop<phoneMetrics.sidebarTop,
    "Phone editing should show the page preview and inspector before long navigation");
  assert.equal(await phoneEditor.locator("#mobilePagePicker").isVisible(),true);
  assert.equal(await phoneEditor.locator("#mobilePagePicker").inputValue(),"index.html");
  await phoneEditor.locator("#mobilePagePicker").selectOption("research.html");
  await phoneEditor.frameLocator("#pageFrame").locator("main").waitFor();
  await phoneEditor.waitForFunction(()=>document.getElementById("pagePicker")?.value==="research.html");
  assert.equal(await phoneEditor.locator("#pagePicker").inputValue(),"research.html");
  await phoneEditor.locator("#mobilePagePicker").selectOption("index.html");
  await phoneEditor.frameLocator("#pageFrame").locator("main .home-kicker").waitFor();
  assert.equal(await phoneEditor.locator("#pagePicker").inputValue(),"index.html");
  assert(phoneMetrics.frameWidth<=phoneMetrics.viewport,
    "The editable website preview must remain within the physical phone viewport");
  assert.equal(await phoneEditor.locator("#publisherConnect").isDisabled(),true,
    "The unconfigured publisher must stay disabled on mobile");
  await phoneEditor.frameLocator("#pageFrame").locator("main .home-kicker")
    .first().click();
  assert.equal(await phoneEditor.locator("#selectionTag").textContent(),"p",
    "Tapping a real page paragraph must select the correct inspector field");
  await phoneEditor.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Resize selected text block on the page"}).click();
  const phoneSize=phoneEditor.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Resize selected block"});
  const sizeGeometry=await phoneSize.evaluate(el=>{
    const rect=el.getBoundingClientRect(),w=el.ownerDocument.defaultView.innerWidth;
    return {left:rect.left,right:rect.right,width:w};
  });
  assert(sizeGeometry.left>=0&&sizeGeometry.right<=sizeGeometry.width+1,
    "Mobile width controls must remain within the actual preview frame");
  await phoneEditor.screenshot({
    path:"/tmp/editor-test-artifacts/academic-quick-size-mobile.png",fullPage:true
  });
  await phoneSize.getByRole("button",{name:"Cancel"}).click();
  assert.equal(await phoneEditor.locator("#exportBtn").isDisabled(),true,
    "Selecting content on a phone must never produce a draft change");
  await phoneEditor.screenshot({
    path:"/tmp/editor-test-artifacts/academic-editor-mobile.png",fullPage:true
  });
  assert.deepEqual(phoneErrors,[],"Phone-sized editor must not raise page errors");
  await phoneEditor.close();

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
  await page.locator("#previewHeading").click();
  await page.keyboard.press("Control+z");
  assert.notEqual(await kicker.evaluate(el=>el.style.textAlign),"center",
    "Ctrl+Z should undo an inspector style edit outside text fields");
  await page.keyboard.press("Control+Shift+z");
  assert.equal(await kicker.evaluate(el=>el.style.textAlign),"center",
    "Ctrl+Shift+Z should restore the inspector style");
  await page.keyboard.press("Control+s");
  assert.match(await page.locator("#editorSaveStatus").textContent(),/Draft saved/,
    "Ctrl+S should save a local draft without a browser download");

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
  await page.locator("#imageWidthPercent").evaluate(element=>{
    element.value="50";
    element.dispatchEvent(new Event("change",{bubbles:true}));
  });
  assert.equal(await image.evaluate(el=>el.style.width),"50%");
  const imageHtml=await downloadedHtml();
  assert(imageHtml.includes('alt="Editor visual test image description"'),
    "Image description must survive source export");
  assert(/style="[^"]*width:\s*50%/.test(imageHtml),
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
  // After restoring the draft, the accessible Move up action must use the
  // current sibling order. A separate drag test above covers pointer sorting.
  await page.locator("#sectionList .section-order-row").nth(1)
    .locator("button[aria-label^='Move up']").click();
  await page.waitForFunction(()=>document.querySelector("#pageFrame")?.contentDocument
    ?.querySelector("main > section")?.classList.contains("home-yellow"));
  assert.match(await page.frameLocator("#pageFrame")
    .locator("main > section").first().getAttribute("class"),/home-yellow/,
    "Moving up after reload should restore the original first section");
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
  // A fast smoke check exercises the preview-only composer using the same
  // sandbox restrictions as the full browser regression suite.
  // Contextual move/copy actions should work on actual source-backed
  // neighbours and must participate in local Undo, not a remote publication.
  const blockControls=await context.newPage();
  blockControls.on("pageerror",error=>errors.push("block-controls: "+error.message));
  await blockControls.route("**/about.html",route=>route.fulfill({
    status:200,contentType:"text/html",
    body:'<!doctype html><html><head></head><body><main><section>'+
      '<p>First movable paragraph.</p><p>Second movable paragraph.</p>'+
      '</section></main></body></html>'
  }));
  await blockControls.goto(base+"/editor.html?page=about.html",{waitUntil:"domcontentloaded"});
  const originalBlocks=blockControls.frameLocator("#pageFrame").locator("main p");
  await originalBlocks.first().click();
  const sourceToolbar=blockControls.frameLocator("#pageFrame").locator("#moon-quick-toolbar");
  assert.equal(await sourceToolbar.getByRole("button",{name:"Move selected block up"}).isDisabled(),true);
  assert.equal(await sourceToolbar.getByRole("button",{name:"Move selected block down"}).isEnabled(),true);
  await blockControls.screenshot({
    path:"/tmp/editor-test-artifacts/academic-canvas-block-actions.png",fullPage:true
  });
  // Width preview is reversible without creating a draft or checkpoint.
  await sourceToolbar.getByRole("button",{name:"Resize selected text block on the page"}).click();
  const sizePanel=blockControls.frameLocator("#pageFrame").getByRole("dialog",{name:"Resize selected block"});
  await blockControls.screenshot({
    path:"/tmp/editor-test-artifacts/academic-quick-size-desktop.png",fullPage:true
  });
  const sizeSlider=sizePanel.getByRole("slider",{name:"Block width within section"});
  await sizeSlider.evaluate(el=>{
    el.value="65";el.dispatchEvent(new Event("input",{bubbles:true}));
  });
  assert.equal(await originalBlocks.first().evaluate(el=>el.style.maxWidth),"65%");
  assert.equal(await blockControls.locator("#exportBtn").isDisabled(),true,
    "Preview-only sizing must never modify an export");
  await sizePanel.getByRole("button",{name:"Cancel"}).click();
  assert.equal(await originalBlocks.first().evaluate(el=>el.style.maxWidth),"");
  assert.equal(await blockControls.locator("#exportBtn").isDisabled(),true);
  // Commit a preset, check export, and undo the real working-document change.
  await sourceToolbar.getByRole("button",{name:"Resize selected text block on the page"}).click();
  await blockControls.frameLocator("#pageFrame").getByRole("dialog",{name:"Resize selected block"})
    .getByRole("button",{name:"75%"}).click();
  assert.equal(await originalBlocks.first().evaluate(el=>el.style.maxWidth),"75%");
  await blockControls.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Resize selected text block on the page"}).click();
  assert.equal(await blockControls.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Resize selected block"})
    .getByRole("slider",{name:"Block width within section"}).inputValue(),"75",
    "Reopening Resize must reflect the committed source width");
  await blockControls.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Resize selected block"})
    .getByRole("button",{name:"Cancel"}).click();
  const widthDownload=blockControls.waitForEvent("download");
  await blockControls.locator("#exportBtn").click();
  const widthFile=await widthDownload;
  assert.match(await readFile(await widthFile.path(),"utf8"),/max-width:\s*75%/);
  await blockControls.locator("#undoBtn").click();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.maxWidth),"");
  // The original text also has a direct corner handle, with a single Undo
  // checkpoint across the entire physical pointer gesture.
  await blockControls.frameLocator("#pageFrame").locator("main p").first().click();
  const corner=blockControls.frameLocator("#pageFrame").locator("#moon-source-width-handle");
  const position=await corner.boundingBox();
  assert(position&&position.width>0,"Existing text must expose its resize grip");
  await blockControls.mouse.move(position.x+position.width/2,position.y+position.height/2);
  await blockControls.mouse.down();
  await blockControls.mouse.move(position.x+position.width/2-185,
    position.y+position.height/2,{steps:6});
  await blockControls.mouse.up();
  const draggedWidth=await blockControls.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.maxWidth);
  assert.match(draggedWidth,/^([3-9]\d)%$/,"A drag should resize the existing text block");
  await blockControls.locator("#undoBtn").click();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.maxWidth),"",
    "One Undo must restore the entire source text resize drag");
  await blockControls.frameLocator("#pageFrame").locator("main p").first().click();
  await blockControls.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Move selected block down"}).click();
  await blockControls.frameLocator("#pageFrame").locator("main p").first().waitFor();
  assert.deepEqual(await blockControls.frameLocator("#pageFrame").locator("main p").allTextContents(),
    ["Second movable paragraph.","First movable paragraph."]);
  await blockControls.locator("#undoBtn").click();
  // Undo renders a fresh sandboxed iframe. Wait for its actual source
  // paragraphs before comparing their reading order.
  await blockControls.frameLocator("#pageFrame").locator("main p").first().waitFor();
  assert.deepEqual(await blockControls.frameLocator("#pageFrame").locator("main p").allTextContents(),
    ["First movable paragraph.","Second movable paragraph."]);
  await blockControls.frameLocator("#pageFrame").locator("main p").first().click();
  // Quick spacing edits must affect only the chosen block, remain Undo-able,
  // and keep the original source page unmodified until reviewed.
  await blockControls.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Increase space below selected block"}).click();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginBottom),"10px");
  await blockControls.locator("#undoBtn").click();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginBottom),"");
  await blockControls.frameLocator("#pageFrame").locator("main p").first().click();
  await blockControls.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Duplicate selected original paragraph or heading"}).click();
  // A source-backed duplication rebuilds the iframe. Do not count the
  // previous document before the new preview has finished loading.
  await blockControls.frameLocator("#pageFrame").locator("[data-editor-added-index]").first().waitFor();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("[data-editor-added-index]").count(),1);
  assert.match(await blockControls.locator("#changeCount").textContent(),/1 added content block/);
  await blockControls.frameLocator("#pageFrame").locator("[data-editor-added-index]").click();
  await blockControls.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Resize selected text block on the page"}).click();
  await blockControls.frameLocator("#pageFrame").getByRole("dialog",{name:"Resize selected block"})
    .getByRole("button",{name:"50%"}).click();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("[data-editor-added-index]")
    .evaluate(el=>el.style.width),"50%");
  await blockControls.locator("#undoBtn").click();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("[data-editor-added-index]")
    .evaluate(el=>el.style.width),"");
  await blockControls.locator("#undoBtn").click();
  assert.equal(await blockControls.frameLocator("#pageFrame").locator("[data-editor-added-index]").count(),0);
  assert.equal(await blockControls.locator("#exportBtn").isDisabled(),true);
  await blockControls.close();

  const inline=await context.newPage();
  await inline.route("**/about.html",route=>route.fulfill({
    status:200,contentType:"text/html",
    body:'<!doctype html><html><head></head><body><main><section>'+
      '<h2>Source heading</h2><p>Unchanged original.</p>'+
      '<img src="assets/editor-existing-example.webp" alt="Existing classroom materials">'+
      '</section></main></body></html>'
  }));
  await inline.goto(base+"/editor.html?page=about.html",{waitUntil:"domcontentloaded"});
  await inline.frameLocator("#pageFrame").locator("main h2").click();
  console.log("INLINE: selected source heading");
  const toolbar=inline.frameLocator("#pageFrame").locator("#moon-quick-toolbar");
  await toolbar.getByRole("button",{name:"Add new content after this block"}).click();
  console.log("INLINE: opened composer");
  const composer=inline.frameLocator("#pageFrame").getByRole("dialog",{name:"Add content to the page"});
  await composer.getByLabel("Text",{exact:true}).fill("Inline test paragraph");
  console.log("INLINE: filled text");
  await composer.getByRole("button",{name:"Add to page"}).click();
  console.log("INLINE: clicked Add");
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").waitFor({timeout:6000});
  assert.equal(await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").textContent(),
    "Inline test paragraph");
  assert.equal(await composer.count(),0);
  console.log("INLINE: composer closed; verify changed count");
  assert.match(await inline.locator("#changeCount").textContent(),/1 added content block/);
  await inline.waitForFunction(()=>{
    try{
      const draft=JSON.parse(localStorage.getItem("moon-portfolio-visual-editor-v1:about.html"));
      return draft?.additions?.[0]?.text==="Inline test paragraph";
    }catch{return false;}
  },null,{timeout:6000});
  console.log("INLINE: local draft persisted");
  const exportPromise=inline.waitForEvent("download");
  await inline.locator("#exportBtn").click();
  const exported=await exportPromise;
  const markup=await readFile(await exported.path(),"utf8");
  assert(markup.includes("<p>Inline test paragraph</p>"));
  assert(markup.includes("<p>Unchanged original.</p>"));
  assert(!markup.includes("moon-quick-composer"));
  console.log("INLINE: clean source-preserving export");
  await inline.locator("#undoBtn").click();
  assert.equal(await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").count(),0);
  await inline.locator("#redoBtn").click();
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").waitFor();
  console.log("INLINE: undo/redo works");
  await inline.reload();
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").waitFor({timeout:6000});
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").first().click();
  const addedResize=inline.frameLocator("#pageFrame").locator("#moon-added-block-width-handle");
  await addedResize.focus();
  await addedResize.press("Home");
  assert.equal(await inline.locator("#addedBlockWidth").inputValue(),"30");
  await addedResize.press("ArrowRight");
  assert.equal(await inline.locator("#addedBlockWidth").inputValue(),"35");
  await addedResize.press("End");
  assert.equal(await inline.locator("#addedBlockWidth").inputValue(),"100");
  console.log("PASS: keyboard resize of newly inserted text");
  // A single addition has no sibling at its anchor, so arrow moves are no-ops.
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").first().click();
  const addedMoveGrip=inline.frameLocator("#pageFrame").locator("#moon-added-block-move-handle");
  await addedMoveGrip.focus();
  await addedMoveGrip.press("ArrowDown");
  assert.equal(await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").count(),1);
  console.log("PASS: added-block keyboard move respects eligible sibling positions");
  console.log("INLINE: select restored addition to add another");
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").click();
  await inline.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Add new content after this block"}).click();
  const nextComposer=inline.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Add content to the page"});
  await nextComposer.getByLabel("Content type").selectOption("link");
  await nextComposer.getByLabel("Text",{exact:true}).fill("Follow-up resource");
  await nextComposer.getByLabel("Link destination").fill("javascript:alert(1)");
  await nextComposer.getByRole("button",{name:"Add to page"}).click();
  assert.match(await nextComposer.getByRole("status").textContent(),/Cannot add this content/);
  console.log("INLINE: unsafe link rejected");
  await nextComposer.getByLabel("Link destination").fill("https://example.org/resource");
  await nextComposer.getByRole("button",{name:"Add to page"}).click();
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").nth(1).waitFor({timeout:6000});
  console.log("INLINE: select existing image from quick Add gallery");
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").nth(1).click();
  await inline.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Add new content after this block"}).click();
  const imageComposer=inline.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Add content to the page"});
  await imageComposer.getByLabel("Content type").selectOption("image");
  await imageComposer.getByRole("button",{
    name:"Choose an existing website image from the image gallery"
  }).click();
  await inline.locator("#mediaDialog").waitFor();
  await inline.locator("#mediaResults .media-option")
    .filter({hasText:"assets/editor-existing-example.webp"}).click();
  assert.equal(await imageComposer.getByLabel("Existing image path").inputValue(),
    "assets/editor-existing-example.webp");
  assert.equal(await imageComposer.getByLabel("Image description (alt text)").inputValue(),
    "Existing classroom materials");
  assert.equal(await imageComposer.locator("img").getAttribute("src"),
    "assets/editor-existing-example.webp");
  await imageComposer.getByLabel("Existing image path").fill("../unsafe.svg");
  await imageComposer.getByRole("button",{name:"Add to page"}).click();
  assert.match(await imageComposer.getByRole("status").textContent(),/Cannot add this content/);
  assert.equal(await inline.frameLocator("#pageFrame")
    .locator("[data-editor-added-index]").count(),2);
  console.log("INLINE: rejected unsafe image path");
  await imageComposer.getByLabel("Existing image path")
    .fill("assets/editor-existing-example.webp");
  await imageComposer.getByRole("button",{name:"Add to page"}).click();
  console.log("INLINE: retried safe image after rejection");
  assert.equal(await imageComposer.count(),0,
    "Valid image retry must close inline composer after rejected unsafe source");
  await inline.frameLocator("#pageFrame").locator("[data-editor-added-index]").nth(2)
    .locator("img").waitFor({timeout:6000});
  console.log("PASS: inline page composer supports valid image selection, safe links, reload and edits");
  await inline.close();
  // Exercise the contextual Layout menu through the original responsive
  // group validator, then verify that Undo removes the draft-only layout.
  const sections=await context.newPage();
  await sections.route("**/about.html",route=>route.fulfill({
    status:200,contentType:"text/html",
    body:'<!doctype html><html><head></head><body><main>'+
      '<section><h2>Section arrangement</h2>'+
      '<p>First research summary.</p><p>Second research summary.</p>'+
      '<p>Third research summary.</p></section></main></body></html>'
  }));
  await sections.goto(base+"/editor.html?page=about.html");
  await sections.frameLocator("#pageFrame").locator("main h2").click();
  await sections.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Arrange selected section into responsive columns"}).click();
  const arrangement=sections.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Arrange selected section"});
  await arrangement.getByRole("button",{
    name:"Set selected section layout to two equal"
  }).click();
  assert.equal(await sections.locator("#directLayoutPreset").inputValue(),"two");
  assert.match(await sections.frameLocator("#pageFrame")
    .locator("#moon-responsive-group-layout").textContent(),/grid-column:7 \/ span 6/);
  assert.match(await sections.locator("#changeCount").textContent(),/1 responsive layout group/);
  await sections.frameLocator("#pageFrame").locator("main h2").click();
  await sections.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Arrange selected section into responsive columns"}).click();
  const customArrangement=sections.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Arrange selected section"});
  await customArrangement.getByRole("slider",{name:"First column width in a twelve-column grid"}).fill("8");
  assert.equal(await customArrangement.locator('div[aria-hidden="true"][style*="grid-template-columns"]')
    .count(),1);
  assert.match(await customArrangement.locator('div[aria-hidden="true"][style*="grid-template-columns"]')
    .getAttribute("style"),/8fr 4fr/);
  await customArrangement.getByRole("button",{name:"Apply custom columns"}).click();
  assert.equal(await sections.locator("#directLayoutPreset").inputValue(),"first-wide",
    "An 8/4 custom split is represented by the equivalent first-wide preset");
  assert.ok((await sections.frameLocator("#pageFrame").locator("#moon-responsive-group-layout")
    .textContent()).includes("grid-column:9 / span 4"));
  console.log("PASS: on-canvas custom responsive column proportions");
  // The existing draggable divider is also operable by keyboard.
  const divider=sections.frameLocator("#pageFrame").locator("#moon-column-resize-handle");
  await divider.focus();
  await divider.press("ArrowLeft");
  assert.equal(await sections.locator("#directLayoutCustomColumns").inputValue(),"7");
  await sections.frameLocator("#pageFrame").locator("#moon-column-resize-handle").press("ArrowRight");
  assert.equal(await sections.locator("#directLayoutCustomColumns").inputValue(),"8");
  console.log("PASS: on-canvas keyboard column divider and responsive proportions");
  // Four edits were made: initial two-column layout, custom split, and two divider steps.
  // Undo each checkpoint before checking that the original layout is restored.
  for(let step=0;step<4;step++)await sections.locator("#undoBtn").click();
  assert(!/responsive layout group/.test(await sections.locator("#changeCount").textContent()));
  console.log("PASS: inline source-verified section layout, original HTML and undo");
  await sections.frameLocator("#pageFrame").locator("main h2").click();
  await sections.frameLocator("#pageFrame").locator("main p").first().click();
  assert.equal(await sections.locator("#selectionTag").textContent(),"p");
  console.log("PASS: contextual toolbar does not obstruct selection of adjacent text");
  await sections.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Increase space above selected block"}).click();
  assert.equal(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginTop),"10px");
  await sections.locator("#undoBtn").click();
  assert.equal(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginTop),"");
  console.log("PASS: on-canvas space-above control and undo");
  await sections.frameLocator("#pageFrame").locator("main p").first().click();
  await sections.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Increase space above selected block"}).click();
  await sections.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Increase space below selected block"}).click();
  await sections.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Restore original spacing above and below selected block"}).click();
  assert.deepEqual(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>[el.style.marginTop,el.style.marginBottom]),["",""]);
  await sections.locator("#undoBtn").click();
  assert.deepEqual(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>[el.style.marginTop,el.style.marginBottom]),["10px","10px"]);
  console.log("PASS: one-click reset for both spacing margins and undo");
  // Undo recreates the preview and can clear the selection, so reselect first.
  // Restore a clean baseline before testing incremental grip movement.
  await sections.frameLocator("#pageFrame").locator("main p").first().click();
  await sections.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Restore original spacing above and below selected block"}).click();
  await sections.frameLocator("#pageFrame").locator("main p").first().click();
  const spacingGrip=sections.frameLocator("#pageFrame").locator("#moon-spacing-grip");
  await spacingGrip.focus();
  await spacingGrip.press("ArrowDown");
  assert.equal(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginBottom),"5px");
  await sections.locator("#undoBtn").click();
  assert.equal(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginBottom),"");
  // Undo rebuilds the preview; selecting again recreates its contextual grip.
  await sections.frameLocator("#pageFrame").locator("main p").first().click();
  assert.equal(await sections.frameLocator("#pageFrame").locator("#moon-spacing-grip").getAttribute("role"),"slider");
  assert.equal(await sections.frameLocator("#pageFrame").locator("#moon-spacing-grip").getAttribute("aria-valuemax"),"80");
  console.log("PASS: on-canvas spacing grip, keyboard adjustment and undo");
  await sections.frameLocator("#pageFrame").locator("main p").first().click();
  await sections.frameLocator("#pageFrame").locator("#moon-spacing-grip").focus();
  await sections.frameLocator("#pageFrame").locator("#moon-spacing-grip").press("ArrowDown");
  await sections.frameLocator("#pageFrame").locator("#moon-spacing-grip").press("Delete");
  assert.equal(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginBottom),"");
  console.log("PASS: spacing grip Delete restores inherited margin");
  // An interrupted drag must restore its original value, while an ordinary
  // drag commits a local draft. Dispatch pointer events to exercise both.
  await sections.frameLocator("#pageFrame").locator("main p").first().click();
  await sections.frameLocator("#pageFrame").locator("#moon-spacing-grip").evaluate(grip=>{
    const rect=grip.getBoundingClientRect();
    const x=rect.left+10,y=rect.top+10;
    grip.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerId:77,pointerType:"touch",button:0,clientX:x,clientY:y}));
    grip.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,pointerId:77,pointerType:"touch",button:0,clientX:x,clientY:y+25}));
    grip.dispatchEvent(new PointerEvent("pointercancel",{bubbles:true,pointerId:77,pointerType:"touch",button:0,clientX:x,clientY:y+25}));
  });
  assert.equal(await sections.frameLocator("#pageFrame").locator("main p").first()
    .evaluate(el=>el.style.marginBottom),"");
  console.log("PASS: cancelled spacing gesture restores original block spacing");
  // Keyboard reordering uses the same verified neighbouring-block move as dragging.
  const grip=sections.frameLocator("#pageFrame").locator("#moon-block-move-handle");
  await grip.focus();
  await grip.press("ArrowDown");
  const reordered=await sections.frameLocator("#pageFrame").locator("main section p")
    .allTextContents();
  assert.deepEqual(reordered.slice(0,3),[
    "Second research summary.","First research summary.","Third research summary."
  ]);
  await sections.locator("#undoBtn").click();
  await sections.frameLocator("#pageFrame").locator("main section p").first().waitFor({timeout:6000});
  assert.deepEqual((await sections.frameLocator("#pageFrame").locator("main section p")
    .allTextContents()).slice(0,3),[
    "First research summary.","Second research summary.","Third research summary."
  ]);
  console.log("PASS: on-canvas keyboard block reorder and undo");

  await sections.close();
  const retry=await context.newPage();
  await retry.route("**/about.html",route=>route.fulfill({
    status:200,contentType:"text/html",
    body:'<!doctype html><html><head></head><body><main><section>'+
      '<h2>Gallery</h2><p>Original gallery introduction.</p>'+
      '<img src="assets/example-photograph.webp" alt="Existing image">'+
      '</section></main></body></html>'
  }));
  await retry.goto(base+"/editor.html?page=about.html");
  await retry.frameLocator("#pageFrame").locator("main h2").click();
  await retry.frameLocator("#pageFrame").locator("#moon-quick-toolbar")
    .getByRole("button",{name:"Add new content after this block"}).click();
  const retryComposer=retry.frameLocator("#pageFrame")
    .getByRole("dialog",{name:"Add content to the page"});
  await retryComposer.getByLabel("Content type").selectOption("link");
  await retryComposer.getByLabel("Text",{exact:true}).fill("Untrusted destination");
  await retryComposer.getByLabel("Link destination").fill("javascript:alert(1)");
  await retryComposer.getByRole("button",{name:"Add to page"}).click();
  assert.match(await retryComposer.getByRole("status").textContent(),/Cannot add/);
  await retryComposer.getByLabel("Content type").selectOption("image");
  await retryComposer.getByLabel("Image description (alt text)")
    .fill("Existing fieldwork photograph");
  await retryComposer.getByLabel("Existing image path").fill("../unsafe.svg");
  await retryComposer.getByRole("button",{name:"Add to page"}).click();
  assert.match(await retryComposer.getByRole("status").textContent(),/Cannot add/);
  await retryComposer.getByLabel("Existing image path")
    .fill("assets/example-photograph.webp");
  await retryComposer.getByRole("button",{name:"Add to page"}).click();
  await retry.frameLocator("#pageFrame").locator("[data-editor-added-index] img")
    .waitFor({timeout:6000});
  console.log("PASS: unsafe-link and unsafe-image rejection followed by valid inline image");
  await retry.close();
  console.log("PASS: text, drafts, reset, link/image export, 17 pages, dark/mobile previews");
} finally {
  await page.screenshot({path:"/tmp/editor-test-artifacts/editor-last.png",fullPage:true}).catch(()=>{});
  await browser.close();
}