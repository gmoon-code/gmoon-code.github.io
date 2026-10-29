#!/usr/bin/env python3
"""S7 visitor semantics and interactive-state regression.

This tests browser DOM/accessibility rules and actual interactions in Chromium.
It does not simulate spoken screen-reader output or claim full WCAG conformance.
"""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8765"
OUT=Path("s7-accessible-interaction-output")
AXE=Path("node_modules/axe-core/axe.min.js")
PAGES=("index.html","research.html","research-action.html","research-scoping.html",
"writing-biological-classification.html","projects.html","story-method.html",
"research-methods-studio.html","teaching.html","teaching-ap-biology.html",
"teaching-ap-chemistry.html","teaching-ap-evolution.html","teaching-osmosis-practice.html",
"interests.html","pungmul.html","contact.html","cv.html","404.html")
DISCLOSURES=("research-scoping.html","story-method.html","research-methods-studio.html","teaching-osmosis-practice.html")
PREVIEWS=("story-method.html","research-methods-studio.html")
PRINT_BUTTONS=("cv.html","teaching-osmosis-practice.html")
AXE_TAGS=["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22a","wcag22aa","best-practice"]
SEMAN=r"""() => {
 const main=document.querySelector('main');
 const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
 const duplicates=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
 const navs=[...document.querySelectorAll('nav')].map(e=>({name:e.getAttribute('aria-label'),links:e.querySelectorAll('a[href]').length}));
 const allTables=[...(main?.querySelectorAll('table')||[])].map((t,i)=>({
  i,caption:t.querySelector('caption')?.textContent.trim()||'',
  name:t.getAttribute('aria-label')||'',
  head:t.querySelectorAll('th').length,
  looseHeads:[...t.querySelectorAll('th')].filter(h=>!h.hasAttribute('scope')&&!h.hasAttribute('id')).length,
  region:!!t.closest('[role="region"][tabindex="0"]')
 }));
 const forms=[...document.querySelectorAll('input,textarea,select')].map(e=>({
  tag:e.tagName,id:e.id,label:e.labels?.length||0,aria:e.getAttribute('aria-label')
 }));
 const images=[...document.querySelectorAll('main img')].map(e=>({
  altMissing:!e.hasAttribute('alt'),alt:e.alt?.slice(0,120)||'',presentational:e.getAttribute('role')==='presentation'
 }));
 const links=[...document.querySelectorAll('main a[href]')].map(e=>({
  href:e.getAttribute('href'),name:(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,60),
  blank:e.target==='_blank',rel:e.rel,annotated:!!e.querySelector('.new-tab-note')
 }));
 const hiddenFocusable=[...document.querySelectorAll('[aria-hidden="true"] a,[aria-hidden="true"] button,[aria-hidden="true"] select,[aria-hidden="true"] [tabindex]')]
 .filter(e=>e.tabIndex>=0).map(e=>e.outerHTML.slice(0,180));
 const linkedDescs=[...document.querySelectorAll('[aria-describedby]')].map(e=>({
  tag:e.tagName,targets:(e.getAttribute('aria-describedby')||'').split(/\s+/),
  missing:(e.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>!document.getElementById(id))
 }));
 return {
   title:document.title,language:document.documentElement.lang,mainCount:document.querySelectorAll('main').length,
   h1:[...document.querySelectorAll('main h1')].map(e=>e.textContent.trim()),
   navs,duplicateIds:duplicates,tables:allTables,forms,images,links,
   hiddenFocusable,descriptionTargetsMissing:linkedDescs.filter(x=>x.missing.length),
   appearance:!!document.querySelector('label[for="moon-appearance-choice"]'),
   reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
   skip:!!document.querySelector('a.skip-link[href="#main"]'),
   detailsCount:document.querySelectorAll('main details').length
 };
}"""
AXE_SCRIPT=r"""async tags => {
 const r=await axe.run(document,{runOnly:{type:'tag',values:tags},resultTypes:['violations','incomplete']});
 return {violations:r.violations.map(v=>({
   id:v.id,impact:v.impact,nodes:v.nodes.slice(0,12).map(n=>({
     target:n.target,html:n.html.slice(0,220),summary:n.failureSummary?.slice(0,280)}))})),
   incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};
}"""
async def visit(browser,name,width=375):
    page=await browser.new_page(viewport={"width":width,"height":900},
                                color_scheme="light",reduced_motion="reduce")
    row={"page":name,"width":width,"errors":[]}
    try:
        resp=await page.goto(f"{BASE}/{name}",wait_until="domcontentloaded",timeout=18000)
        await page.evaluate("document.fonts.ready")
        row["http"]=resp.status if resp else None
        m=await page.evaluate(SEMAN)
        row["semantics"]={k:v for k,v in m.items() if k!="links" and k!="images"}
        row["imageCount"]=len(m["images"])
        row["linkCount"]=len(m["links"])
        if row["http"]!=200:row["errors"].append("HTTP not 200")
        if m["language"]!="en" or m["mainCount"]!=1 or len(m["h1"])!=1:row["errors"].append("language/main/H1 semantics")
        if m["duplicateIds"]:row["errors"].append("duplicate HTML ids")
        if m["hiddenFocusable"]:row["errors"].append("ARIA-hidden focusable descendants")
        if m["descriptionTargetsMissing"]:row["errors"].append("ARIA describedby references missing")
        if not m["appearance"] or not m["skip"]:row["errors"].append("appearance label or skip semantics missing")
        if not m["reducedMotion"]:row["errors"].append("reduced-motion test preference inactive")
        if any(t["looseHeads"] or t["head"]==0 for t in m["tables"]):
            row["errors"].append("scientific table has missing header semantics")
        if any(x["altMissing"] for x in m["images"]):
            row["errors"].append("missing image alt attribute")
        if any(not x["name"] for x in m["links"]):
            row["errors"].append("main content link has no accessible textual label")
        if any(x["blank"] and ("noopener" not in x["rel"] or "noreferrer" not in x["rel"])
               for x in m["links"]):
            row["errors"].append("new tab target without safe rel attributes")
        if any(x["tag"]=="SELECT" and not (x["label"] or x["aria"]) for x in m["forms"]):
            row["errors"].append("select with no accessible label")
        await page.add_script_tag(path=str(AXE))
        row["axe"]=await page.evaluate(AXE_SCRIPT,AXE_TAGS)
        if row["axe"]["violations"]:row["errors"].append("axe standard state violations")
        # Change preference by actual select, check DOM and selection state;
        # reload to confirm persisted preference, then use System mode.
        chooser=page.locator("#moon-appearance-choice")
        if await chooser.count()!=1:row["errors"].append("appearance chooser missing after JS")
        else:
            await chooser.select_option("dark")
            dark=await page.evaluate("() => ({pref:document.documentElement.dataset.moonPreference,theme:document.documentElement.dataset.moonTheme,value:document.querySelector('#moon-appearance-choice').value})")
            row["dark"]=dark
            if dark!={"pref":"dark","theme":"dark","value":"dark"}:
                row["errors"].append("dark appearance interactive state mismatch")
            await page.reload(wait_until="domcontentloaded",timeout=17000)
            kept=await chooser.input_value()
            row["persistedDark"]=kept
            if kept!="dark":row["errors"].append("dark appearance not persisted through reload")
            await chooser.select_option("system")
            sys=await page.evaluate("() => ({pref:document.documentElement.dataset.moonPreference,theme:document.documentElement.dataset.moonTheme})")
            row["system"]=sys
            if sys["pref"]!="system" or sys["theme"] not in ("dark","light"):
                row["errors"].append("System appearance state mismatch")
            await chooser.select_option("light")
        if name in DISCLOSURES:
            dl=page.locator("main details")
            row["disclosures"]=[]
            for i in range(await dl.count()):
                item=dl.nth(i)
                summary=item.locator("summary")
                initial=await item.evaluate("(e)=>e.open")
                await summary.focus()
                await page.keyboard.press("Enter")
                opened=await item.evaluate("(e)=>e.open")
                # print should open closed references, then restore their
                # original interactive state after simulated print.
                await page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
                during=await item.evaluate("(e)=>e.open")
                await page.evaluate("window.dispatchEvent(new Event('afterprint'))")
                restored=await item.evaluate("(e)=>e.open")
                await summary.focus()
                await page.keyboard.press("Enter")
                closed=await item.evaluate("(e)=>e.open")
                row["disclosures"].append(dict(initial=initial,opened=opened,duringPrint=during,afterPrint=restored,closed=closed))
                if initial or not opened or restored!=opened or closed:
                    row["errors"].append("details Enter toggle or print restoration failed")
                await page.add_script_tag(path=str(AXE))
                dynamic=await page.evaluate(AXE_SCRIPT,AXE_TAGS)
                if dynamic["violations"]:
                    row.setdefault("disclosureAxe",[]).extend(dynamic["violations"])
                    row["errors"].append("axe disclosure state violations")
        if name in PREVIEWS:
            panel=page.locator("[data-live-preview]")
            opener=panel.locator("[data-preview-open]")
            row["preview"]={}
            if await opener.count()!=1 or not await opener.is_visible():
                row["errors"].append("preview opener not present or visible")
            else:
                await opener.focus()
                await page.keyboard.press("Enter")
                active=panel.locator("[data-preview-active]")
                close=panel.locator("[data-preview-close]")
                iframe=panel.locator("iframe")
                row["preview"]["open"]=await active.is_visible()
                row["preview"]["closeFocus"]=await close.evaluate("(e)=>document.activeElement===e")
                row["preview"]["iframeCount"]=await iframe.count()
                if await iframe.count()==1:
                    row["preview"]["iframe"]=await iframe.evaluate("""e=>({
                      title:e.title,src:e.src,sandbox:e.getAttribute('sandbox'),
                      sameOrigin:new URL(e.src).origin===location.origin})""")
                if not row["preview"]["open"] or not row["preview"]["closeFocus"] or await iframe.count()!=1:
                    row["errors"].append("preview open, accessible iframe, or close focus failure")
                elif not row["preview"]["iframe"]["title"] or not row["preview"]["iframe"]["sameOrigin"]:
                    row["errors"].append("preview iframe title/source semantics failure")
                phone=panel.locator('[data-preview-device="phone"]')
                desktop=panel.locator('[data-preview-device="desktop"]')
                await phone.click()
                row["preview"]["phone"]={
                    "device":await panel.locator("[data-preview-stage]").get_attribute("data-device"),
                    "pressed":await phone.get_attribute("aria-pressed"),
                    "desktop":await desktop.get_attribute("aria-pressed")}
                if row["preview"]["phone"]!={"device":"phone","pressed":"true","desktop":"false"}:
                    row["errors"].append("preview phone pressed-state semantics failure")
                # Escape must work even if focus has moved to the device controls.
                await page.keyboard.press("Escape")
                row["preview"]["escapeClosed"]=not await active.is_visible()
                row["preview"]["returnFocus"]=await opener.evaluate("(e)=>document.activeElement===e")
                row["preview"]["iframeRemoved"]=await iframe.count()==0
                if not all(row["preview"][k] for k in ("escapeClosed","returnFocus","iframeRemoved")):
                    row["errors"].append("preview Escape or focus restoration failure")
                await opener.click()
                await panel.locator("[data-preview-close]").click()
                row["preview"]["buttonCloseRestores"]=await opener.evaluate("(e)=>document.activeElement===e")
                if not row["preview"]["buttonCloseRestores"]:row["errors"].append("preview close button did not restore focus")
        if name in PRINT_BUTTONS:
            # Spy only; no print UI invoked. This confirms a real click
            # dispatches the page's advertised window.print() handler.
            btn=page.locator(".resume-print" if name=="cv.html" else "button.control.primary")
            if await btn.count()!=1:
                row["errors"].append("print button not found")
            else:
                await btn.evaluate("""e=>{
                  window.__s7PrintCalls=[];
                  window.__s7PrintClicks=0;
                  window.print=()=>window.__s7PrintCalls.push(new Error().stack);
                  e.addEventListener('click',()=>window.__s7PrintClicks++);
                }""")
                await btn.click()
                row["printPointer"]=await page.evaluate("""() => ({
                   clicks:window.__s7PrintClicks,
                   calls:window.__s7PrintCalls.map(x=>x?.slice(0,400))
                })""")
                await page.evaluate("window.__s7PrintClicks=0;window.__s7PrintCalls=[]")
                await btn.focus()
                await page.keyboard.press("Enter")
                row["printKeyboard"]=await page.evaluate("""() => ({
                   clicks:window.__s7PrintClicks,
                   calls:window.__s7PrintCalls.map(x=>x?.slice(0,400))
                })""")
                if (row["printPointer"]["clicks"]!=1 or row["printKeyboard"]["clicks"]!=1 or
                        len(row["printPointer"]["calls"])!=1 or len(row["printKeyboard"]["calls"])!=1):
                    row["errors"].append("print control activation or duplicate print action")
        return row
    except Exception as exc:
        row["errors"].append("exception: "+str(exc)[:330])
        return row
    finally:await page.close()

async def main():
    if not AXE.is_file():raise SystemExit("axe-core bundle missing")
    OUT.mkdir(exist_ok=True)
    cases=[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch()
        for name in PAGES:
            row=await visit(browser,name,375)
            cases.append(row)
            print(name,row["errors"][:5],flush=True)
        await browser.close()
    failed=[{k:v for k,v in r.items() if k not in ("axe","semantics")} for r in cases if r["errors"]]
    summary={"scope":"18 directly readable public HTML pages. Legacy About redirect already verified U1.",
       "pages":len(PAGES),"semanticScans":len(cases),
       "appearancePreferenceTests":sum("dark" in r for r in cases),
       "disclosureGroups":sum(len(r.get("disclosures",[])) for r in cases),
       "previewOpenCloseSequences":sum("preview" in r for r in cases),
       "printButtonActions":sum("printPointer" in r and "printKeyboard" in r for r in cases),
       "failedCases":len(failed),"failures":failed,
       "axeViolations":[{"page":r["page"],"violations":r.get("axe",{}).get("violations",[])} for r in cases if r.get("axe",{}).get("violations")],
       "notes":"Live previews test the parent portfolio interaction and iframe semantics, not the separately deployed applications' internal UI. Headless Chromium/axe does not measure spoken screen-reader output or certify full WCAG conformance."}
    (OUT/"report.json").write_text(json.dumps(cases,indent=2,ensure_ascii=False)+"\n")
    (OUT/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(summary,indent=2,ensure_ascii=False),flush=True)
    return int(bool(failed))
if __name__=="__main__":raise SystemExit(asyncio.run(main()))
