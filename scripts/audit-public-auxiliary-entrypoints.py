#!/usr/bin/env python3
"""C-RV29bw. Read-only public delivery check for supplementary app and redirect routes.

This script never supplies credentials, publishes, saves an editor draft, or
modifies any external learning-app progress. It does not judge historical
preview snapshots as current academic source.
"""
import asyncio
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen
from playwright.async_api import async_playwright

BASE = "https://gmoon-code.github.io"
OUT = Path("public-auxiliary-output")
PAGES = {
    "about.html": "redirect",
    "editors.html": "editor-directory",
    "editor.html": "legacy-editor",
    "editor-v2.html": "editor-v2",
    "studio/index.html": "owner-studio",
    "connection-studio/index.html": "writing-trainer",
    "editor-v2-previews/source-index.html": "historical-preview",
    "fluid-layout-lab.html": "layout-lab",
}
WIDTHS = (390, 1280)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def get_public(path):
    request=Request(BASE+"/"+path,headers={"User-Agent":"academic-supplementary-delivery-audit/1.0"})
    with urlopen(request,timeout=30) as response:
        return {"status":response.status,"contentType":response.headers.get("Content-Type",""),
                "body":response.read()}

async def check_browser(browser,path,kind,width):
    item={"path":path,"kind":kind,"width":width,"errors":[]}
    context=await browser.new_context(viewport={"width":width,"height":850},reduced_motion="reduce")
    page=await context.new_page()
    exceptions=[]
    page.on("pageerror",lambda exc:exceptions.append(str(exc)[:320]))
    try:
        response=await page.goto(BASE+"/"+path,wait_until="domcontentloaded",timeout=35000)
        item["entryStatus"]=response.status if response else None
        await page.wait_for_timeout(600)
        if kind=="writing-trainer":
            await page.locator("#view").wait_for(state="visible",timeout=10000)
        item["url"]=page.url
        item["metrics"]=await page.evaluate("""() => {
            const main=document.querySelector('main');
            return {
                title:document.title,mainCount:document.querySelectorAll('main').length,
                h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim()).slice(0,5),
                renderedMainTextLength:main?.innerText?.length||0,
                rootScrollWidth:document.documentElement.scrollWidth,
                innerWidth:innerWidth,
                css:[...document.querySelectorAll('link[rel~="stylesheet"]')].map(x=>({
                    href:x.getAttribute('href'),loaded:!!x.sheet})),
                editorCards:document.querySelectorAll('.editor-card').length,
                loginInput:!!document.querySelector('#tokenInput[type="password"]'),
                connectionNavigation:document.querySelectorAll('#navigation button[data-tab]').length,
                connectionRenderedView:document.querySelector('#view')?.textContent?.trim()?.length||0,
                isNoIndex:(document.querySelector('meta[name="robots"]')?.content||'').includes('noindex'),
                canonical:document.querySelector('link[rel="canonical"]')?.href||null
            };
        }""")
        m=item["metrics"]
        if item["entryStatus"]!=200:
            item["errors"].append("supplementary source document is not HTTP 200")
        if m["mainCount"]!=1:
            item["errors"].append("supplementary document does not have one main region")
        if kind=="redirect":
            await page.wait_for_url(BASE+"/contact.html",timeout=10000)
            if await page.locator("main h1").inner_text()!="I'd be glad to hear from you.":
                item["errors"].append("About redirect does not reach current Contact heading")
        elif kind=="editor-directory":
            if m["editorCards"]!=3 or not m["isNoIndex"]:
                item["errors"].append("editor-directory cards or search exclusion changed")
        elif kind=="owner-studio":
            if not m["loginInput"] or not m["isNoIndex"]:
                item["errors"].append("owner-only studio login state not presented as expected")
        elif kind=="writing-trainer":
            if m["connectionNavigation"]!=8 or m["connectionRenderedView"]<60:
                item["errors"].append("dynamic writing trainer navigation or overview not rendered")
        elif kind=="historical-preview":
            if not m["isNoIndex"] or m["canonical"]!=BASE+"/":
                item["errors"].append("historical preview SEO/canonical boundary absent")
        if any(not x["loaded"] for x in m["css"]):
            item["errors"].append("a linked stylesheet failed to attach")
        item["pageErrors"]=exceptions
        # Record page runtime exceptions without declaring that every optional
        # external request or browser-specific feature necessarily failed.
        await page.screenshot(path=str(OUT/(path.replace("/","_")+"-"+str(width)+".png")),
                              full_page=False,timeout=18000,animations="disabled")
    except Exception as exc:
        item["errors"].append("browser exception: "+str(exc)[:400])
        item["pageErrors"]=exceptions
    finally:
        await context.close()
    return item

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    source=[]
    for path,kind in PAGES.items():
        result={"path":path,"kind":kind,"errors":[]}
        try:
            sourceBytes=Path(path).read_bytes()
            public=get_public(path)
            result.update(http=public["status"],contentType=public["contentType"],
                          sourceSHA256=digest(sourceBytes),publicSHA256=digest(public["body"]),
                          identical=sourceBytes==public["body"])
            if not result["identical"] or public["status"]!=200:
                result["errors"].append("deployed HTML bytes do not match checked source")
        except Exception as exc:
            result["errors"].append(type(exc).__name__+": "+str(exc)[:350])
        source.append(result)
        print("AUX_SOURCE",path,"PASS" if not result["errors"] else result["errors"],flush=True)
    cases=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True)
        try:
            for width in WIDTHS:
                for path,kind in PAGES.items():
                    case=await check_browser(browser,path,kind,width)
                    cases.append(case)
                    print("AUX_BROWSER",path,width,"PASS" if not case["errors"] else case["errors"],flush=True)
        finally:
            await browser.close()
    failures=[{"path":x["path"],"type":"html","errors":x["errors"]} for x in source if x["errors"]]
    failures += [{"path":x["path"],"width":x["width"],"type":"browser","errors":x["errors"]}
                 for x in cases if x["errors"]]
    report={"scope":"Eight supplementary routes; read-only live HTTPS source and landing-page checks",
            "source":source,"browserCases":cases,"failures":failures,"failedCount":len(failures),
            "limits":"Do not infer editor authentication, publishing, saved draft persistence, external app state, full page visual design or physical-device accessibility from passing public landing checks. Historical Editor V2 source preview is not the current Home page."}
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("AUX_SUMMARY",json.dumps({
        "sourcePassed":sum(not x["errors"] for x in source),
        "browserPassed":sum(not x["errors"] for x in cases),
        "sourceTotal":len(source),"browserTotal":len(cases),
        "failedCount":len(failures),"failures":failures
    },ensure_ascii=False),flush=True)
    return 1 if failures else 0

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
