import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir,readFile} from "node:fs/promises";

const origin=process.env.EDITOR_SUITE_TEST_URL||"http://127.0.0.1:8768";
const expectedPaths=[
  "/editor.html",
  "/research-methods/editor.html",
  "/memory-palace-u1-8/editor.html"
];
const browser=await chromium.launch({headless:true});
const failures=[];
const output="/tmp/cross-site-editor-artifacts";
await mkdir(output,{recursive:true});

async function isolatedContext(viewport={width:1440,height:900}){
  // Match a normal browser. Every outgoing request is still intercepted
  // below, and the isolated context has no pre-existing registrations.
  // Explicit Playwright serviceWorker blocking can itself cause a sandbox
  // SecurityError in the protected Research Methods preview iframe.
  const context=await browser.newContext({viewport,acceptDownloads:true});
  // An assembled static test must never contact real login or publication services.
  await context.route("**/*",route=>{
    try{
      if(new URL(route.request().url()).origin!==origin)
        return route.abort("blockedbyclient");
      return route.continue();
    }catch{
      return route.abort("blockedbyclient");
    }
  });
  return context;
}
async function checkHub(page){
  await page.goto(origin+"/editors.html",{waitUntil:"domcontentloaded"});
  assert.equal(await page.title(),"Website Editors | Ye Eun Moon");
  const links=await page.locator(".editor-card a").evaluateAll(nodes=>
    nodes.map(el=>new URL(el.href).pathname));
  assert.deepEqual(links,expectedPaths);
  assert.equal(await page.locator("main h1").textContent(),"Website editors");
}

try{
  const context=await isolatedContext();
  const page=await context.newPage();
  page.on("pageerror",e=>failures.push(page.url()+" :: "+e.stack));

  await checkHub(page);
  await page.screenshot({path:output+"/hub-desktop.png",fullPage:true});

  // Follow each link as a person would. All are hosted beneath the same
  // GitHub Pages origin in this composite draft-only test.
  await page.locator(".editor-card a").nth(0).click();
  assert.equal(new URL(page.url()).pathname,"/editor.html");
  await page.frameLocator("#pageFrame").locator("main").waitFor();
  assert.equal(await page.locator("#publisherConnect").isDisabled(),true,
    "Academic editor must not expose unconfigured direct publishing");
  assert.equal(await page.locator("#editorSaveStatus").isVisible(),true);
  await page.locator("#pagePicker").selectOption("research.html");
  await page.frameLocator("#pageFrame").locator("main").waitFor();
  assert.equal(await page.locator("#pagePicker").inputValue(),"research.html");

  // Edit and download a real academic HTML draft through the assembled
  // GitHub Pages origin. Neither the page source nor remote publisher changes.
  await page.locator("#pagePicker").selectOption("index.html");
  await page.frameLocator("#pageFrame").locator("main .home-kicker").first().waitFor();
  const academicText="Pages integration draft · Academic website";
  const academicSource=await (await page.request.get(origin+"/index.html")).text();
  const kicker=page.frameLocator("#pageFrame").locator("main .home-kicker").first();
  await kicker.click();
  await page.locator("#selectionText").fill(academicText);
  assert.equal((await kicker.textContent()).trim(),academicText);
  assert.equal(await page.locator("#publisherPropose").isDisabled(),true);
  const pendingAcademic=page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const academicFile=await pendingAcademic;
  assert.equal(academicFile.suggestedFilename(),"index.html");
  const academicExport=await readFile(await academicFile.path(),"utf8");
  assert(academicExport.includes(academicText));
  assert(!academicSource.includes(academicText));
  assert.equal(await (await page.request.get(origin+"/index.html")).text(),academicSource,
    "Academic export must never rewrite the served website");
  // Cross-site links really open separate tabs and leave the edited page,
  // inspector selection and local draft untouched.
  const academicPopupPending=page.waitForEvent("popup");
  await page.locator('.other-editor-links a[href="./research-methods/editor.html"]').click();
  const academicPopup=await academicPopupPending;
  await academicPopup.waitForURL("**/research-methods/teacher.html#visualGuidanceEditor");
  assert.equal(await academicPopup.locator("#teacherAccessCode").isVisible(),true);
  await academicPopup.close();
  assert.equal((await kicker.textContent()).trim(),academicText);
  assert.equal(new URL(page.url()).pathname,"/editor.html");

  await checkHub(page);
  await page.locator(".editor-card a").nth(1).click();
  await page.waitForURL("**/research-methods/teacher.html#visualGuidanceEditor");
  assert.equal(await page.locator("#teacherAccessCode").isVisible(),true);
  assert.equal(await page.locator("#teacherAccessCode").getAttribute("type"),"password");
  // A signed-out visit must stop at real teacher sign-in, not open Admin.
  assert.equal(await page.locator("#adminWorkspace").count(),0);

  const signedContext=await isolatedContext();
  await signedContext.route("**/assets/teacher-session.js",route=>
    route.fulfill({status:200,contentType:"application/javascript",body:
      "window.RMSTeacherSession={verify:async()=>true,isActive:()=>true,"+
      "hasStoredSession:()=>true,login:async()=>({ok:true}),leave:()=>{}};"
    })
  );
  const signed=await signedContext.newPage();
  signed.on("pageerror",e=>failures.push(signed.url()+" :: "+e.stack));
  await signed.goto(origin+"/research-methods/editor.html",
    {waitUntil:"domcontentloaded"});
  await signed.locator("#adminWorkspace:not([hidden])").waitFor();
  await signed.locator("#contentStudioPanel:not([hidden])").waitFor();
  assert.equal(new URL(signed.url()).hash,"#visualGuidanceEditor");
  assert.equal(await signed.locator(".content-authoring-nav a").count(),5);
  assert.equal(await signed.locator(".cross-site-editor-switcher").isVisible(),true);
  await signed.locator(".cross-site-editor-switcher summary").click();
  const rmsLinks=await signed.locator(".cross-site-editor-switcher nav a").evaluateAll(
    links=>links.map(link=>new URL(link.href).pathname));
  assert.deepEqual(rmsLinks,["/editor.html","/memory-palace-u1-8/editor.html"]);
  assert.equal(await signed.locator('.cross-site-editor-switcher a[href="../editors.html"]')
    .count(),1);
  await signed.screenshot({path:output+"/research-methods-editor.png",fullPage:true});

  // Edit a real research-activity wording field, download a review-only
  // proposal, and confirm immutable student curriculum field identities.
  await signed.locator('[data-content-view="activities"]').click();
  await signed.locator("#activityPreview [data-activity-path='s.0.title']").waitFor();
  const curriculumBefore=await signed.evaluate(()=>JSON.stringify(window.RMSCurriculum.stages));
  await signed.locator("#activityPreview [data-activity-path='s.0.title']").click();
  const rmsText="Pages integration draft · Research activities";
  await signed.locator("#activityPreview .inline-review-input").fill(rmsText);
  await signed.locator("#activityPreview .inline-review-save").click();
  assert.equal(await signed.locator("#activityPreview [data-activity-path='s.0.title']")
    .textContent(),rmsText);
  assert.equal(await signed.locator("#activityReviewCount").textContent(),"1 proposed change");
  const pendingRms=signed.waitForEvent("download");
  await signed.locator("#activityExport").click();
  const rmsFile=await pendingRms;
  assert.equal(rmsFile.suggestedFilename(),"rms-activity-wording-review.json");
  const rmsProposal=JSON.parse(await readFile(await rmsFile.path(),"utf8"));
  assert.equal(rmsProposal.schema_version,"rms-activity-wording-proposal-v1");
  assert.equal(rmsProposal.live_publication,false);
  assert.equal(rmsProposal.review_required,true);
  assert(rmsProposal.edits.some(e=>e.path==="s.0.title"&&e.value===rmsText));
  assert.match(rmsProposal.source_sha256,/^[a-f0-9]{64}$/);
  assert.equal(await signed.evaluate(()=>JSON.stringify(window.RMSCurriculum.stages)),
    curriculumBefore,"Review-only edits must not modify the student curriculum");
  const rmsPopupPending=signed.waitForEvent("popup");
  await signed.locator('.cross-site-editor-switcher nav a[href="../editor.html"]').click();
  const rmsPopup=await rmsPopupPending;
  await rmsPopup.waitForURL("**/editor.html");
  await rmsPopup.frameLocator("#pageFrame").locator("main").waitFor();
  await rmsPopup.close();
  assert.equal(await signed.locator("#activityReviewCount").textContent(),"1 proposed change",
    "Cross-site navigation must leave the Research Methods proposal open");
  assert.equal(await signed.locator("#activityExport").isEnabled(),true);
  await signed.setViewportSize({width:390,height:844});
  const rmsMobile=await signed.evaluate(()=>({
    viewport:innerWidth,
    documentWidth:document.documentElement.scrollWidth,
    columns:getComputedStyle(document.querySelector("#contentAuthoringNav"))
      .gridTemplateColumns.trim().split(/\s+/).length
  }));
  assert.equal(rmsMobile.columns,2);
  assert(rmsMobile.documentWidth<=rmsMobile.viewport+1,
    "Research Methods mobile Admin must fit without horizontal page overflow");
  assert.equal(await signed.locator("#activityReviewCount").textContent(),"1 proposed change");
  await signed.screenshot({path:output+"/research-methods-mobile.png",fullPage:true});
  await signed.setViewportSize({width:1440,height:900});

  await checkHub(page);
  await page.locator(".editor-card a").nth(2).click();
  await page.waitForURL("**/memory-palace-u1-8/authoring/visual-editor.html");
  await page.locator('#scenePreview [data-edit-key="0:title"]').waitFor();
  assert.equal(await page.locator("#unit").inputValue(),"unit-1");
  assert.equal(await page.locator("#journey").inputValue(),"Z1");
  assert.equal(await page.locator("#saveStatus").isVisible(),true);
  assert.deepEqual(await page.locator(".other-editors nav a").evaluateAll(
    links=>links.map(link=>new URL(link.href).pathname)),
    ["/editor.html","/research-methods/editor.html"]
  );
  assert.equal(await page.locator('.other-editors a[href="../../editors.html"]')
    .count(),1);
  await page.screenshot({path:output+"/story-method-editor.png",fullPage:true});

  // Edit a genuine frozen-journey title. JSON export must preserve
  // checkpoint answers, scene identity and other protected structures.
  const storySourceUrl=origin+"/memory-palace-u1-8/content/ap-biology/unit-1/journeys/Z1.json";
  const originalStory=await (await page.request.get(storySourceUrl)).json();
  const storyText="Pages integration draft · First memory journey";
  await page.locator('#scenePreview [data-edit-key="0:title"]').click();
  await page.locator("#editText").fill(storyText);
  assert.equal((await page.locator('#scenePreview [data-edit-key="0:title"]')
    .textContent()).trim(),storyText);
  const pendingStory=page.waitForEvent("download");
  await page.locator("#export").click();
  const storyFile=await pendingStory;
  assert.equal(storyFile.suggestedFilename(),"Z1.json");
  const storyExport=JSON.parse(await readFile(await storyFile.path(),"utf8"));
  assert.equal(storyExport.scenes[0].title,storyText);
  assert.equal(storyExport.scenes.length,originalStory.scenes.length);
  assert.deepEqual(storyExport.scenes[0].checkpoint,originalStory.scenes[0].checkpoint);
  assert.deepEqual(storyExport.scenes[0].object_ids,originalStory.scenes[0].object_ids);
  assert.equal(storyExport.scenes[0].scene_id,originalStory.scenes[0].scene_id);
  assert.deepEqual(await (await page.request.get(storySourceUrl)).json(),originalStory,
    "Narrative export must not rewrite released curriculum JSON");
  const storyPopupPending=page.waitForEvent("popup");
  await page.locator('.other-editors nav a[href="../../research-methods/editor.html"]').click();
  const storyPopup=await storyPopupPending;
  await storyPopup.waitForURL("**/research-methods/teacher.html#visualGuidanceEditor");
  assert.equal(await storyPopup.locator("#teacherAccessCode").isVisible(),true);
  await storyPopup.close();
  assert.equal((await page.locator('#scenePreview [data-edit-key="0:title"]')
    .textContent()).trim(),storyText,
    "Cross-site links must not disturb local Story Method drafts");

  // Verify the new mobile-first narrative layout in the composite
  // GitHub Pages environment with an actual 390px browser viewport.
  await page.setViewportSize({width:390,height:844});
  const storyMobile=await page.evaluate(()=>{
    const position=id=>document.getElementById(id).getBoundingClientRect().top;
    return {
      viewport:window.innerWidth,
      documentWidth:document.documentElement.scrollWidth,
      navVisible:getComputedStyle(document.querySelector(".editor-jump-nav")).display!=="none",
      story:position("storyWorkspace"),
      inspector:position("storyInspector"),
      curriculum:position("storyCurriculum")
    };
  });
  assert.equal(storyMobile.navVisible,true);
  assert(storyMobile.story<storyMobile.inspector&&storyMobile.inspector<storyMobile.curriculum,
    "Mobile Story Method must put reading and text editing before long curriculum navigation");
  assert(storyMobile.documentWidth<=storyMobile.viewport+1,
    "Story Method mobile editor must fit within the screen");
  // The assembled Pages build must preserve the two-way mobile editing
  // shortcut without silently changing a reviewed narrative draft.
  await page.locator('#scenePreview [data-edit-key="0:title"]').click();
  const exportWasEnabled=await page.locator("#export").isEnabled();
  assert.equal(await page.locator("#mobileSelectionBar").isVisible(),true,
    "Mobile authors need an on-screen shortcut to the selected inspector field");
  await page.locator("#mobileEditInInspector").click();
  assert.equal(await page.locator("#editText").evaluate(
    el=>document.activeElement===el),true);
  assert.equal(await page.locator("#mobileSelectionBar").isVisible(),false,
    "Floating controls must yield to the inspector");
  await page.locator("#mobileBackToPassage").click();
  assert.equal(await page.locator('#scenePreview [data-edit-key="0:title"]').evaluate(
    el=>document.activeElement===el),true);
  await page.locator("#mobileDismissSelection").click();
  assert.equal(await page.locator("#mobileSelectionBar").isVisible(),false);
  assert.equal(await page.locator("#export").isEnabled(),exportWasEnabled,
    "Mobile inspector navigation must preserve the existing draft state");
  await page.screenshot({path:output+"/story-method-mobile.png",fullPage:true});
  await page.setViewportSize({width:1440,height:900});

  // Follow the hub and return, observing whether browser-local drafts
  // remain specific to their editor and site.
  await checkHub(page);
  await page.locator(".editor-card a").nth(0).click();
  await page.frameLocator("#pageFrame").locator("main .home-kicker").first().waitFor();
  assert.equal((await page.frameLocator("#pageFrame").locator("main .home-kicker")
    .first().textContent()).trim(),academicText,
    "Academic browser-local draft should survive visiting a different editor");
  await checkHub(page);
  await page.locator(".editor-card a").nth(2).click();
  await page.waitForURL("**/memory-palace-u1-8/authoring/visual-editor.html");
  await page.locator('#scenePreview [data-edit-key="0:title"]').waitFor();
  assert.equal((await page.locator('#scenePreview [data-edit-key="0:title"]')
    .textContent()).trim(),storyText,
    "Story Method drafts should remain local after visiting the hub");

  await checkHub(page);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator(".editor-card").count(),3);
  const screen=await page.evaluate(()=>({
    view:window.innerWidth,
    content:document.documentElement.scrollWidth,
    columns:getComputedStyle(document.querySelector(".editor-grid"))
      .gridTemplateColumns.trim().split(/\s+/).length
  }));
  assert.equal(screen.columns,1);
  assert(screen.content<=screen.view+1,"Hub must fit mobile without overflow");
  await page.screenshot({path:output+"/hub-mobile.png",fullPage:true});

  assert.deepEqual(failures,[],"Composite draft previews must not throw browser errors");
  console.log("PASS: all three GitHub Pages editor routes load on one origin");
  console.log("PASS: signed-out Research Methods route remains at teacher sign-in");
  console.log("PASS: signed simulated teacher can reach guarded Content Studio");
  console.log("PASS: Story Method loads original journey JSON on the built Pages path");
  console.log("PASS: editor directory is usable on desktop and mobile");
  console.log("PASS: all three editors open external cross-site links in separate tabs");
  console.log("PASS: academic HTML export is local, safe, and survives cross-site navigation");
  console.log("PASS: Research Methods review-only JSON export preserves student curriculum");
  console.log("PASS: Story Method journey JSON export preserves frozen scientific structures");
}finally{
  await browser.close();
}
