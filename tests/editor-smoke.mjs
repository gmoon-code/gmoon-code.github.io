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
  assert.equal(await page.locator("#exportBtn").isDisabled(),true);
  const kicker=page.frameLocator("#pageFrame").locator("main .home-kicker").first();
  await kicker.click();
  assert.equal(await page.locator("#selectionTag").textContent(),"p");
  await page.locator("#selectionText").fill("Editable site heading for a smoke test");
  assert.equal((await kicker.textContent()).trim(),"Editable site heading for a smoke test");
  assert.equal(await page.locator("#exportBtn").isEnabled(),true);
  const html=await downloadedHtml();
  assert(html.includes("Editable site heading for a smoke test"),"Changed text must be exported");
  assert(!html.includes("javascript:void"),"No scripts should be introduced");

  await page.reload({waitUntil:"domcontentloaded"});
  await page.frameLocator("#pageFrame").locator("main").waitFor();
  assert.equal(await page.frameLocator("#pageFrame").locator(".home-kicker").first().textContent(),
    "Editable site heading for a smoke test","Local edits should persist across reloads");

  await page.locator("#resetBtn").click();
  await page.once("dialog",dialog=>dialog.accept());
  // Reset click is followed by a confirmation dialog; submit a second time if needed.
  if (await page.locator("#resetBtn").isEnabled()) {
    page.once("dialog",dialog=>dialog.accept());
    await page.locator("#resetBtn").click();
  }
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
  console.log("PASS: preview, editable text, draft persistence, reset, page switching, responsive preview, link export");
} finally {
  await page.screenshot({path:"/tmp/editor-test-artifacts/editor-last.png",fullPage:true}).catch(()=>{});
  await browser.close();
}