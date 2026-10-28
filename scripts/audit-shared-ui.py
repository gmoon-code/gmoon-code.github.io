#!/usr/bin/env python3
"""Focused cross-page navigation and appearance audit. Does not replace manual AT testing."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8765"
OUT = Path("shared-ui-audit-output")
OUT.mkdir(exist_ok=True)
PAGES = {
  "index.html":"index.html", "research.html":"research.html",
  "projects.html":"projects.html", "teaching.html":"teaching.html",
  "interests.html":"interests.html", "contact.html":"contact.html",
  "cv.html":"cv.html", "pungmul.html":"interests.html",
  "research-action.html":"research.html", "research-scoping.html":"research.html",
  "writing-biological-classification.html":"research.html",
  "story-method.html":"projects.html", "research-methods-studio.html":"projects.html",
  "teaching-ap-biology.html":"teaching.html",
  "teaching-ap-evolution.html":"teaching.html",
  "teaching-ap-chemistry.html":"teaching.html",
  "teaching-osmosis-practice.html":"teaching.html",
}
EXPECTED = ("index.html","research.html","projects.html","teaching.html",
            "interests.html","contact.html","cv.html")
MEASURE = """() => {
  const nav=document.querySelector("nav.site-nav");
  const toggle=document.querySelector(".moon-appearance-select");
  const rect=el=>{const r=el.getBoundingClientRect();return {
    left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  return {
    path:location.pathname,viewportWidth:innerWidth,
    docWidth:document.documentElement.scrollWidth,
    headerHeight:document.querySelector(".topbar")?.getBoundingClientRect().height,
    navLinks:nav?[...nav.querySelectorAll("a")].map(a=>({
      href:a.getAttribute("href"),active:a.getAttribute("aria-current")||"",
      rect:rect(a),visible:getComputedStyle(a).visibility==="visible"})):[],
    theme:document.documentElement.getAttribute("data-moon-theme"),
    preference:document.documentElement.getAttribute("data-moon-preference"),
    selectValue:toggle?.value,
    selectRect:toggle?rect(toggle):null,
    bodyBg:getComputedStyle(document.body).backgroundColor,
    currentLabel:nav?.querySelector('[aria-current="page"]')?.textContent?.trim(),
  };
}"""

async def main():
    results, failures=[],[]
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True)
        context=await browser.new_context(viewport={"width":375,"height":850},
                                          reduced_motion="reduce",color_scheme="light")
        page=await context.new_page()
        try:
            await page.goto(BASE+"/index.html",wait_until="domcontentloaded",timeout=20000)
            await page.keyboard.press("Tab")
            focused=await page.evaluate("() => ({
              cls:document.activeElement.className,
              href:document.activeElement.getAttribute('href')
            })")
            if focused.get("href")!="#main":
                failures.append({"test":"skip-first-tab","detail":focused})
            else:
                await page.keyboard.press("Enter")
                target=await page.evaluate("() => ({
                  hash:location.hash,
                  focus:document.activeElement.id
                })")
                if target["hash"]!="#main" or target["focus"]!="main":
                    failures.append({"test":"skip-activation","detail":target})
            results.append({"test":"skip-link","focused":focused})
            appearance=page.locator(".moon-appearance-select")
            await appearance.select_option("dark")
            dark=await page.evaluate(MEASURE)
            await page.goto(BASE+"/research.html",wait_until="domcontentloaded")
            await page.locator(".moon-appearance-select").wait_for(timeout=6000)
            persisted=await page.evaluate(MEASURE)
            if dark["theme"]!="dark" or persisted["theme"]!="dark" or persisted["selectValue"]!="dark":
                failures.append({"test":"dark-persistence","home":dark["theme"],
                    "research":persisted["theme"],"select":persisted["selectValue"]})
            await page.screenshot(path=str(OUT/"research-dark-375.jpg"),
                                  full_page=False,type="jpeg",quality=76)
            await page.locator(".moon-appearance-select").select_option("light")
            light=await page.evaluate(MEASURE)
            if light["theme"]!="light" or dark["bodyBg"]==light["bodyBg"]:
                failures.append({"test":"light-colour","dark":dark["bodyBg"],
                    "light":light["bodyBg"],"theme":light["theme"]})
            results.append({"test":"appearance-dark-light","darkBg":dark["bodyBg"],
                "lightBg":light["bodyBg"],"persistence":persisted["selectValue"]})
            await page.locator(".moon-appearance-select").select_option("system")
            await page.emulate_media(color_scheme="dark")
            systemDark=await page.evaluate(MEASURE)
            await page.emulate_media(color_scheme="light")
            systemLight=await page.evaluate(MEASURE)
            if systemDark["theme"]!="dark" or systemLight["theme"]!="light" or systemLight["preference"]!="system":
                failures.append({"test":"system-theme","dark":systemDark["theme"],
                    "light":systemLight["theme"],"stored":systemLight["preference"]})
            results.append({"test":"appearance-system","dark":systemDark["theme"],
                "light":systemLight["theme"]})
            # Restore light before checking navigation across all public reading routes.
            await page.locator(".moon-appearance-select").select_option("light")
            for width in (375,768,1440):
                await page.set_viewport_size({"width":width,"height":850})
                routes=PAGES if width==375 else {
                    x:PAGES[x] for x in ("index.html","research.html","projects.html",
                      "teaching.html","interests.html","contact.html","cv.html")
                }
                for path,active in routes.items():
                    await page.goto(BASE+"/"+path,wait_until="domcontentloaded",timeout=18000)
                    await page.locator(".moon-appearance-select").wait_for(timeout=7000)
                    data=await page.evaluate(MEASURE)
                    issues=[]
                    destinations=tuple(l["href"] for l in data["navLinks"])
                    marked=tuple(l["href"] for l in data["navLinks"] if l["active"]=="page")
                    if destinations!=EXPECTED: issues.append("unexpected nav targets")
                    if marked!=(active,): issues.append("incorrect current page")
                    if data["docWidth"]>width+1: issues.append("document overflow")
                    for l in data["navLinks"]:
                        if not l["visible"] or l["rect"]["left"]<0 or l["rect"]["right"]>width+1:
                            issues.append("nav link clipped: "+l["href"])
                    t=data["selectRect"]
                    if t is None or t["left"]<0 or t["right"]>width+1:
                        issues.append("appearance control clipped")
                    if data["theme"]!="light" or data["selectValue"]!="light":
                        issues.append("appearance preference lost")
                    if path in ("index.html","research.html","contact.html") and width in (375,1440):
                        await page.screenshot(path=str(OUT/f"{path}-{width}.jpg"),
                                  full_page=False,type="jpeg",quality=76)
                    if issues: failures.append({"page":path,"width":width,"issues":issues})
                    results.append({"page":path,"width":width,"issues":issues,
                        "nav":destinations,"current":marked,
                        "documentWidth":data["docWidth"],"headerHeight":data["headerHeight"]})
                    print("NAV",path,width,"PASS" if not issues else issues,flush=True)
        except Exception as exc:
            failures.append({"test":"setup","error":str(exc)})
            print("ERROR",repr(exc),flush=True)
        finally:
            await context.close()
            await browser.close()
    (OUT/"report.json").write_text(json.dumps({"results":results,"failures":failures},
                                              indent=2),encoding="utf-8")
    return 1 if failures else 0

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
