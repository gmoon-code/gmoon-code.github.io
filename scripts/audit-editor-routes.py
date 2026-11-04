#!/usr/bin/env python3
"""Focused regression for the public editor directory and Fluid Layout Lab import."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8765"
OUT=Path("editor-route-audit-output")
OUT.mkdir(exist_ok=True)

async def verify_staged_content_handoff(browser, results, failures):
    """Test additions through the local editor draft, without authenticated publishing."""
    page=await browser.new_page(viewport={"width":1120,"height":860},
                                accept_downloads=True)
    labels=iter([
        "C-RV29ei test paragraph",
        "C-RV29ei test heading",
        "C-RV29ei test link",
        "research.html",
    ])
    seen_dialogs=[]
    def accept_dialog(dialog):
        seen_dialogs.append(dialog.type)
        if dialog.type=="prompt":
            asyncio.create_task(dialog.accept(next(labels,"")))
        else:
            asyncio.create_task(dialog.accept())
    page.on("dialog",accept_dialog)
    try:
        await page.goto(BASE+"/fluid-layout-lab.html",wait_until="domcontentloaded")
        await page.locator("#sourcePage").select_option("contact.html")
        await page.locator("#importPage").click()
        await page.wait_for_function(
            "document.querySelector('#status').textContent.startsWith('Imported ')",
            timeout=10000)
        anchor=page.locator("#grid .block.text").first
        for button in ["appendSourceParagraph","appendSourceHeading",
                       "appendSourceLink"]:
            await anchor.click()
            if await page.locator("#"+button).is_disabled():
                raise AssertionError("Imported text cannot anchor "+button)
            await page.locator("#"+button).click()
            await page.wait_for_function(
                "(kind) => document.querySelector('#status').textContent.includes('New '+kind+' staged')",
                arg={"appendSourceParagraph":"paragraph","appendSourceHeading":"heading",
                     "appendSourceLink":"link"}[button],timeout=10000)
        await page.locator("#reviewPatch").click()
        text_status=await page.locator("#status").inner_text()
        entries=await page.locator("#reviewEntries").inner_text()
        if "3 staged content additions" not in text_status:
            failures.append({"test":"staged-review-status","status":text_status})
        if any("New "+kind not in entries for kind in ("paragraph","heading","link")):
            failures.append({"test":"staged-review-entries","entries":entries[:900]})
        results.append({"test":"three-staged-additions",
                        "status":text_status,"dialogTypes":seen_dialogs[:]})
        async with page.expect_download(timeout=12000) as event:
            await page.locator("#exportAppliedPreview").click()
        download=await event.value
        review_html=Path(await download.path()).read_text(encoding="utf-8")
        must_contain=[
            "0 publishable text or style edits, 3 new content blocks",
            "C-RV29ei test paragraph",
            "C-RV29ei test heading",
            "C-RV29ei test link",
            'href="research.html"',
        ]
        missing=[value for value in must_contain if value not in review_html]
        if missing:
            failures.append({"test":"applied-review-contains-additions",
                             "missing":missing,"size":len(review_html)})
        results.append({"test":"applied-review-with-additions",
                        "file":download.suggested_filename,
                        "bytes":len(review_html),"missing":missing})
        await page.locator("#openPublisher").click()
        await page.wait_for_url("**/editor.html?*",timeout=20000)
        await page.wait_for_function("""() => {
            try {
                const raw=localStorage.getItem("moon-portfolio-visual-editor-v1:contact.html");
                const data=JSON.parse(raw||"null");
                return Array.isArray(data?.additions)&&data.additions.length===3;
            } catch {return false}
        }""",timeout=20000)
        received=await page.evaluate("""() => {
            const data=JSON.parse(localStorage.getItem(
                "moon-portfolio-visual-editor-v1:contact.html"));
            return {kinds:data.additions.map(x=>x.kind),
                labels:data.additions.map(x=>x.text),
                href:data.additions.find(x=>x.kind==="link")?.href,
                handoffRemaining:sessionStorage.getItem(
                    "moon-fluid-text-handoff-v1")!==null,
                path:location.pathname,
                pagePicker:document.querySelector("#pagePicker")?.value};
        }""")
        expected_kinds=["paragraph","heading","link"]
        if received["kinds"]!=expected_kinds or received["href"]!="research.html":
            failures.append({"test":"editor-draft-content-additions","received":received})
        if received["handoffRemaining"] or received["pagePicker"]!="contact.html":
            failures.append({"test":"editor-handoff-consumed","received":received})
        results.append({"test":"local-unpublished-editor-handoff","received":received,
                        "dialogTypes":seen_dialogs[:]})
    except Exception as error:
        failures.append({"test":"staged-content-handoff-runtime","error":str(error),
                         "url":page.url,"dialogs":seen_dialogs})
    finally:
        await page.close()


async def main():
    results=[]
    failures=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True)
        page=await browser.new_page(viewport={"width":390,"height":844},accept_downloads=True)
        try:
            await page.goto(BASE+"/editors.html",wait_until="domcontentloaded",timeout=20000)
            links=await page.locator(".editor-card a").evaluate_all(
                "(nodes) => nodes.map(a => new URL(a.href).pathname)")
            expected=["/editor-v2.html","/research-methods/editor.html",
                      "/memory-palace-u1-8/editor.html"]
            if links!=expected:
                failures.append({"test":"directory-links","actual":links,"expected":expected})
            results.append({"test":"directory-links","paths":links})
            await page.goto(BASE+"/fluid-layout-lab.html",wait_until="domcontentloaded")
            await page.keyboard.press("Tab")
            first=await page.evaluate("""() => ({
                href:document.activeElement.getAttribute('href'),
                text:document.activeElement.textContent.trim()
            })""")
            if first["href"]!="#workspace":
                failures.append({"test":"skip-link-first-tab","focused":first})
            await page.keyboard.press("Enter")
            target=await page.evaluate("""() => ({
                hash:location.hash,
                id:document.activeElement.id
            })""")
            if target["hash"]!="#workspace" or target["id"]!="workspace":
                failures.append({"test":"skip-link-activation","target":target})
            results.append({"test":"keyboard-skip","first":first,"target":target})
            button=await page.locator("#openPublisher").inner_text()
            labLink=await page.locator("a.editor-link").inner_text()
            if button!="Review transferable edits in legacy editor" or "Legacy editor" not in labLink:
                failures.append({"test":"legacy-editor-handoff-label","button":button,"link":labLink})
            results.append({"test":"handoff-labels","button":button,"link":labLink})
            actual=await page.locator("#sourcePage option").evaluate_all(
                "(nodes) => nodes.map(o=>({value:o.value,label:o.textContent}))")
            if not any(x["value"]=="contact.html" for x in actual):
                failures.append({"test":"contact-choice-missing"})
            if not any(x["value"]=="about.html" and "legacy" in x["label"].lower()
                       for x in actual):
                failures.append({"test":"about-legacy-warning-missing"})
            results.append({"test":"page-options","options":actual})
            await page.locator("#sourcePage").select_option("contact.html")
            page.once("dialog",lambda dialog: asyncio.create_task(dialog.accept()))
            await page.locator("#importPage").click()
            await page.wait_for_function(
                "document.querySelector('#status').textContent.includes('Imported')",
                timeout=10000)
            contact=await page.evaluate("""() => ({
                status:document.querySelector('#status').textContent,
                count:document.querySelectorAll('#grid .block').length,
                headings:[...document.querySelectorAll('#grid .block.heading')]
                    .map(el=>el.textContent.trim()).slice(0,4)
            })""")
            if contact["count"]<2 or not contact["status"].startswith("Imported "):
                failures.append({"test":"contact-import","result":contact})
            results.append({"test":"contact-import","result":contact})
            await page.screenshot(path=str(OUT/"fluid-contact-import-390.jpg"),
                                  full_page=False,type="jpeg",quality=76)
            await page.locator("#sourcePage").select_option("about.html")
            page.once("dialog",lambda dialog: asyncio.create_task(dialog.accept()))
            await page.locator("#importPage").click()
            await page.wait_for_function(
                "document.querySelector('#status').textContent.startsWith('Import failed')",
                timeout=10000)
            redirect=await page.locator("#status").text_content()
            count=await page.locator("#grid .block").count()
            if "redirect" not in redirect.lower() or "Choose Contact" not in redirect:
                failures.append({"test":"legacy-message","status":redirect})
            if count!=contact["count"]:
                failures.append({"test":"preserve-canvas-on-rejection",
                                "before":contact["count"],"after":count})
            results.append({"test":"legacy-import","status":redirect,"canvasBlocks":count})
            await verify_staged_content_handoff(browser,results,failures)
            print("Editor directory and Fluid Layout Lab import checks",
                  "PASS" if not failures else failures,flush=True)
        except Exception as error:
            failures.append({"test":"runtime","error":str(error)})
            print("ERROR",repr(error),flush=True)
        finally:
            await browser.close()
    (OUT/"report.json").write_text(json.dumps(
        {"results":results,"failures":failures},indent=2),encoding="utf-8")
    return 1 if failures else 0

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
