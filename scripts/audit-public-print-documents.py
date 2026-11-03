#!/usr/bin/env python3
"""C-RV29cn read-only live Chromium print/PDF verification.

Generates PDFs only from public GitHub Pages. Does not publish to the site.
Requires Playwright Chromium and pypdf in the GitHub Actions environment.
"""
import asyncio
import json
import re
from pathlib import Path
from pypdf import PdfReader
from playwright.async_api import async_playwright

BASE="https://gmoon-code.github.io"
OUT=Path("public-print-reader-output")
DOCUMENTS={
    "osmosis":{"path":"teaching-osmosis-practice.html","checks":[
        "Osmosis and changes in mass","Student activity",
        "Illustrative mass measurements","Describe the measurements",
        "Propose a mechanism","Check what the table tells you",
        "Improve the investigation","10.8 g","9.6 g","8.7 g"
    ],"hidden":[".worksheet-actions",".worksheet-teacher-section",".topbar",".site-footer",".breadcrumb"]},
    "cv":{"path":"cv.html","checks":[
        "Ye Eun Moon","Education","Research Interests",
        "Professional Experience","Student Research Supervision",
        "Languages and Technical Skills","Licensure and Selected Professional Development",
        "Scoping Review of Multilingual Learners", "Classroom Action Research"
    ],"hidden":[".resume-print",".topbar",".site-footer",".skip-link"]}
}

def normalize(x):
    return re.sub(r"\s+"," ",x).casefold()

async def inspect(browser,key,conf):
    result={"document":key,"page":conf["path"],"errors":[]}
    page=await browser.new_page(viewport={"width":1280,"height":850},reduced_motion="reduce")
    try:
        response=await page.goto(f"{BASE}/{conf['path']}",wait_until="domcontentloaded",timeout=35000)
        await page.locator("main").wait_for(timeout=10000)
        await page.emulate_media(media="print")
        await page.evaluate("document.fonts.ready")
        hidden={}
        for selector in conf["hidden"]:
            selectorNode=page.locator(selector).first
            if await selectorNode.count():
                hidden[selector]=await selectorNode.evaluate(
                    "e=>({display:getComputedStyle(e).display,visible:!!e.getBoundingClientRect().height})"
                )
            else:
                hidden[selector]={"missing":True}
        result["printCssHidden"]=hidden
        result["http"]=response.status if response else None
        result["printedView"] = await page.evaluate("""()=>({
            title:document.title,
            mainCount:document.querySelectorAll('main').length,
            h1:document.querySelector('main h1')?.textContent.trim(),
            paper:matchMedia('print').matches,
            tasks:document.querySelectorAll('main .worksheet-task-list > li').length,
            printButtonCount:document.querySelectorAll('button[onclick="window.print()"]').length
        })""")
        if result["http"]!=200 or result["printedView"]["mainCount"]!=1 or not result["printedView"]["paper"]:
            result["errors"].append("real public print document not loaded or emulated correctly")
        if any(x.get("display")!="none" for x in hidden.values()):
            result["errors"].append("a print-only hidden control appears in printed media")
        if key=="osmosis" and result["printedView"]["tasks"]!=4:
            result["errors"].append("expected four printed student inquiry questions")
        pdf=OUT/f"{key}-public-A4-print.pdf"
        await page.pdf(path=str(pdf),format="A4",print_background=True,
                       prefer_css_page_size=True,margin={"top":"0mm","bottom":"0mm","left":"0mm","right":"0mm"})
        result["pdf"]=str(pdf)
        reader=PdfReader(str(pdf))
        pages=[p.extract_text(extraction_mode="plain") or "" for p in reader.pages]
        whole=normalize(" ".join(pages))
        result["pageCount"]=len(pages)
        result["pageTextLengths"]=[len(normalize(p)) for p in pages]
        result["missingExpectedText"]=[s for s in conf["checks"] if normalize(s) not in whole]
        if result["missingExpectedText"]:
            result["errors"].append("expected authored academic/worksheet content missing from actual PDF")
        if len(pages)<1 or len(pages)>10 or any(len(normalize(p))<12 for p in pages):
            result["errors"].append("unexpected print pagination or mostly blank PDF page")
        if key=="osmosis":
            result["teacherNotesPrinted"]=(
                normalize("Osmosis offers a plausible explanation for these results") in whole
                or normalize("Teacher notes") in whole
            )
            if result["teacherNotesPrinted"]:
                result["errors"].append("teacher-only explanation leaked into student activity PDF")
            result["taskPages"]={}
            for label in conf["checks"][3:7]:
                occur=[i+1 for i,text in enumerate(pages) if normalize(label) in normalize(text)]
                result["taskPages"][label]=occur
            result["dataTablePages"]=[i+1 for i,text in enumerate(pages)
                if normalize("10.8 g") in normalize(text)]
        else:
            result["printContinuedMarker"]=normalize("Professional Experience, continued") in whole
            result["printButtonInPdf"]=normalize("Print / Save as PDF") in whole
            if result["printButtonInPdf"]:
                result["errors"].append("interactive PDF print-button copied into CV")
            result["sectionPages"]={}
            for label in ("Education","Research Interests","Professional Experience",
                          "Licensure and Selected Professional Development"):
                result["sectionPages"][label]=[i+1 for i,t in enumerate(pages)
                    if normalize(label) in normalize(t)]
    except Exception as exc:
        result["errors"].append("browser/PDF exception: "+str(exc)[:450])
    finally:
        await page.close()
    return result

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    rows=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True)
        try:
            for name,conf in DOCUMENTS.items():
                r=await inspect(browser,name,conf)
                rows.append(r)
                print("PUBLIC_PRINT",name,"PASS" if not r["errors"] else r["errors"],
                      "PAGES",r.get("pageCount"),flush=True)
        finally:
            await browser.close()
    failures=[r for r in rows if r["errors"]]
    report={
        "scope":"Real public Osmosis student worksheet and CV rendered to A4 PDF in Chromium print media",
        "results":rows,"failedCount":len(failures),
        "limitations":"PDF generation and pypdf text extraction verify text and page counts, not all glyph positioning, paper printer hardware, every CSS print engine or PDF/UA accessibility tagging. Actual page-image rendering and visual inspection are separate steps.",
        "failures":[{"document":r["document"],"errors":r["errors"]} for r in failures]}
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PUBLIC_PRINT_SUMMARY",json.dumps({
        "tested":len(rows),"passed":len(rows)-len(failures),
        "pages":[{"document":r["document"],"count":r.get("pageCount"),
                  "errors":r["errors"]} for r in rows],"failedCount":len(failures)
    }),flush=True)
    return int(bool(failures))

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
