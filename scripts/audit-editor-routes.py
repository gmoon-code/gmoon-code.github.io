#!/usr/bin/env python3
"""Focused regression for the public editor directory and Fluid Layout Lab import."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8765"
OUT=Path("editor-route-audit-output")
OUT.mkdir(exist_ok=True)

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
