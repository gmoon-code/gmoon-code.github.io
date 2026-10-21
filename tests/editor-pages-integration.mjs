import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";

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
}finally{
  await browser.close();
}
