#!/usr/bin/env python3
"""Focused Home and nested-404 browser regression; diagnostic, not full WCAG certification."""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8765"
# 320/360/375 CSS px cover narrow reflow; 640/720 CSS px approximate
# the effective layout widths of 1280/1440 windows at 200% browser zoom.
# These viewport simulations do not replace a native browser zoom check.
WIDTHS = (320, 360, 375, 640, 700, 701, 720, 768, 1024, 1025, 1100, 1140, 1141, 1200, 1440)
OUT = Path("home-route-audit-output")
OUT.mkdir(exist_ok=True)

MEASURE = """() => {
  const main = document.querySelector('main');
  const hero = main.querySelector('.home-intro');
  const intro = main.querySelector('.home-lead');
  const photo = main.querySelector('img[data-moon-v2-added-id="c2e948d6-fbe2-4cef-96df-725095eb0139"]');
  const outside = main.querySelector('.home-outside-grid');
  const outsideSection = main.querySelector('#outside-school');
  const footer = document.querySelector('.site-footer');
  const performance = main.querySelector('img[data-moon-v2-added-id="10954918-6ea3-4b9e-b6b1-b86e4ac50f97"]');
  const firstSection = main.querySelector('#teaching-research');
  function rect(el) {
    if (!el) return null;
    const r=el.getBoundingClientRect();
    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
  }
  function overlaps(a,b) {
    if (!a||!b) return false;
    return Math.min(a.right,b.right)-Math.max(a.left,b.left)>5 &&
      Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>5;
  }
  const introRect=rect(intro), photoRect=rect(photo);
  const titleRect=rect(hero.querySelector('h1'));
  const actionsRect=rect(hero.querySelector('.controls'));
  const firstRect=rect(firstSection);
  const pageRight=innerWidth;
  const overflowNodes=[...document.querySelectorAll('body *')]
    .filter(el => {
      const bounds=el.getBoundingClientRect();
      const style=getComputedStyle(el);
      return bounds.right>pageRight+0.1 && bounds.width>0 &&
        style.display!=="none" && style.visibility!=="hidden";
    })
    .sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right)
    .slice(0,12)
    .map(el=>({
      tag:el.tagName.toLowerCase(),id:el.id||"",
      className:typeof el.className==="string"?el.className.slice(0,140):"",
      rect:rect(el),position:getComputedStyle(el).position,
      overflowX:getComputedStyle(el).overflowX,transform:getComputedStyle(el).transform,
      scrollWidth:el.scrollWidth,clientWidth:el.clientWidth
    }));
  const kicker=hero.querySelector(".home-kicker");
  return {
    width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    overflowNodes, kickerRect:rect(kicker),
    kickerText:kicker?.textContent?.trim()||"",
    kickerMarginTop:kicker?getComputedStyle(kicker).marginTop:null,
    kickerMarginBottom:kicker?getComputedStyle(kicker).marginBottom:null,
    introParent:intro?.parentElement?.className||null,
    portraitParent:photo?.parentElement?.className||null,
    performanceParent:performance?.parentElement?.className||null,
    introInHero:hero.contains(intro),portraitInHero:hero.contains(photo),
    introBeforeActions:!!intro && !!hero.querySelector('.controls') &&
      Boolean(intro.compareDocumentPosition(hero.querySelector('.controls')) &
        Node.DOCUMENT_POSITION_FOLLOWING),
    performanceInOutside:outside.contains(performance),
    introBeforeFirstSection:!!intro && !!firstSection &&
      Boolean(intro.compareDocumentPosition(firstSection) & Node.DOCUMENT_POSITION_FOLLOWING),
    imageCount:main.querySelectorAll('img[data-moon-v2-added-id]').length,
    introRect,photoRect,titleRect,actionsRect,firstRect,
    outsideRect:rect(outsideSection),performanceRect:rect(performance),
    footerGap:footer && outsideSection ?
      footer.getBoundingClientRect().top-outsideSection.getBoundingClientRect().bottom : null,
    performanceWithinOutside:!!outsideSection && !!performance &&
      rect(performance).top >= rect(outsideSection).top - 0.5 &&
      rect(performance).bottom <= rect(outsideSection).bottom + 0.5,
    portraitOverflow:photo ? getComputedStyle(photo).overflow : null,
    performanceOverflow:performance ? getComputedStyle(performance).overflow : null,
    collisions:{
      introPhoto:overlaps(introRect,photoRect),
      titlePhoto:overlaps(titleRect,photoRect),
      actionsPhoto:overlaps(actionsRect,photoRect),
      introFirstSection:overlaps(introRect,firstRect)
    },
    smallTargets:[...document.querySelectorAll('a[href],button,select,input')]
      .filter(el=>{
        const s=getComputedStyle(el), r=el.getBoundingClientRect();
        return s.display!=='none'&&s.visibility!=='hidden'&&
          r.width>0&&r.height>0&&r.right>=0&&r.left<=innerWidth;
      })
      .filter(el=>{
        const r=el.getBoundingClientRect();
        return r.width<24-0.1||r.height<24-0.1;
      })
      .map(el=>({tag:el.tagName,text:(el.textContent||'').trim().slice(0,60),
                 width:el.getBoundingClientRect().width,
                 height:el.getBoundingClientRect().height})),
    appearance:document.documentElement.getAttribute('data-moon-theme')
  };
}"""

async def main():
    results, failures = [], []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for width in WIDTHS:
            page = await browser.new_page(viewport={"width":width,"height":900},
                                          reduced_motion="reduce",color_scheme="light")
            try:
                response = await page.goto(BASE+"/index.html",wait_until="domcontentloaded",
                                           timeout=20000)
                await page.locator(".home-lead").wait_for(timeout=7000)
                await page.wait_for_timeout(200)
                data = await page.evaluate(MEASURE)
                data["page"] = "index.html"
                data["httpStatus"] = response.status if response else None
                narrow = width <= 1140
                violations = []
                if data["httpStatus"] != 200: violations.append("Home HTTP not 200")
                if data["scrollWidth"] > width: violations.append("Document overflow")
                if data["imageCount"] != 2: violations.append("Unexpected Home image count")
                if data["smallTargets"]: violations.append("Visible interactive targets smaller than 24 CSS pixels")
                if data["footerGap"] is None or not (95 <= data["footerGap"] <= 110):
                    violations.append("Inconsistent Outside school to footer spacing")
                if not data["performanceWithinOutside"]: violations.append("Performance photo exceeds Outside school section")
                if data["kickerRect"] is not None: violations.append("Unused Home kicker still takes layout space")
                if not data["introBeforeFirstSection"]: violations.append("Intro after later sections")
                if not data["introBeforeActions"]: violations.append("Introduction appears after the action links in DOM reading order")
                if narrow:
                    if not (data["introInHero"] and data["portraitInHero"] and data["performanceInOutside"]):
                        violations.append("Phone/tablet reading flow not restored")
                    if any(data["collisions"].values()): violations.append("Hero or section overlap")
                    if data["portraitOverflow"] != "hidden" or data["performanceOverflow"] != "hidden":
                        violations.append("Image pixels may spill beyond their boxes")
                    if data["photoRect"]["width"] > 481 or data["photoRect"]["height"] > 321:
                        violations.append("Visitor portrait frame is oversized")
                if width in WIDTHS:
                    # Compare the genuine 900px viewport against full-page
                    # capture; screenshots can alter layout transiently.
                    await page.screenshot(path=str(OUT/f"home-{width}-viewport.jpg"),
                                          full_page=False,type="jpeg",quality=75)
                    data["afterViewportCapture"] = await page.evaluate(MEASURE)
                    await page.screenshot(path=str(OUT/f"home-{width}.jpg"),
                                          full_page=True,type="jpeg",quality=70)
                    data["afterFullCapture"] = await page.evaluate(MEASURE)
                if width in (375,1141,1440):
                    # Verify that changing appearance does not leave the
                    # desktop free-positioned photo outside its section.
                    await page.locator(".moon-appearance-select").select_option("dark")
                    await page.wait_for_timeout(100)
                    dark = await page.evaluate(MEASURE)
                    data["darkAppearance"] = {
                        "theme": dark["appearance"],
                        "scrollWidth": dark["scrollWidth"],
                        "performanceWithinOutside": dark["performanceWithinOutside"]
                    }
                    if dark["appearance"] != "dark":
                        violations.append("Dark appearance selection did not apply")
                    if dark["smallTargets"]:
                        violations.append("Dark appearance has interactive targets smaller than 24 CSS pixels")
                    if dark["scrollWidth"] > width:
                        violations.append("Dark appearance document overflow")
                    if not dark["performanceWithinOutside"]:
                        violations.append("Dark appearance performance photo exceeds section")
                    await page.screenshot(path=str(OUT/f"home-{width}-dark.jpg"),
                                          full_page=True,type="jpeg",quality=70)
                data["violations"] = violations
                results.append(data)
                if violations: failures.append({"width":width,"violations":violations,"detail":data})
                print("HOME",width,"PASS" if not violations else violations,
                      "scrollWidth",data["scrollWidth"],flush=True)
            except Exception as exc:
                item={"page":"index.html","width":width,"error":str(exc)}
                results.append(item);failures.append(item)
                print("ERROR",item,flush=True)
            finally:
                await page.close()

        # Keyboard smoke: skip link, site title, and title focus on dark background.
        keyboard_page = await browser.new_page(viewport={"width":375,"height":900},
                                              reduced_motion="reduce")
        try:
            await keyboard_page.goto(BASE+"/index.html",wait_until="load",timeout=20000)
            await keyboard_page.keyboard.press("Tab")
            first = await keyboard_page.evaluate(
                "() => document.activeElement?.getAttribute('href')")
            await keyboard_page.keyboard.press("Tab")
            second = await keyboard_page.evaluate(
                "() => document.activeElement?.classList.contains('brand')")
            await keyboard_page.locator(".moon-appearance-select").select_option("dark")
            await keyboard_page.locator(".moon-appearance-select").focus()
            # Move backwards from the appearance control to the site title;
            # don't assume the browser focuses the selector after select_option.
            for _ in range(12):
                await keyboard_page.keyboard.press("Shift+Tab")
                if await keyboard_page.evaluate(
                    "() => document.activeElement?.matches('.topbar .brand')"):
                    break
            brand = await keyboard_page.evaluate("""() => {
                const el=document.activeElement;
                const s=getComputedStyle(el);
                return {isBrand:el.matches('.topbar .brand'),
                  visibleFocus:el.matches(':focus-visible'),
                  outlineStyle:s.outlineStyle,
                  outlineColor:s.outlineColor,
                  expected:getComputedStyle(document.documentElement)
                    .getPropertyValue('--moon-link-accent').trim(),
                  background:getComputedStyle(document.querySelector('.topbar'))
                    .backgroundColor}
            }""")
            violations = []
            if first != "#main": violations.append("Skip link not first keyboard target")
            if not second: violations.append("Site title not second keyboard target")
            if not brand["isBrand"] or not brand["visibleFocus"]:
                violations.append("Dark site title cannot be found by keyboard focus")
            if (brand["outlineStyle"] == "none" or
                brand["outlineColor"] != "rgb(145, 219, 170)"):
                violations.append("Dark site title focus outline lacks visible contrast")
            await keyboard_page.screenshot(path=str(OUT/"home-keyboard-dark-brand-375.jpg"),
                                           full_page=False,type="jpeg",quality=75)
            await keyboard_page.locator('a[href="#teaching-research"]').click()
            section = await keyboard_page.evaluate("""() => ({
                hash:location.hash,
                sectionTop:document.querySelector('#teaching-research')
                  .getBoundingClientRect().top,
                scrollY:scrollY
            })""")
            if section["hash"] != "#teaching-research" or section["scrollY"] < 1:
                violations.append("Explore the work anchor did not navigate to section")
            await keyboard_page.locator('a[href="#page-top"]').click()
            returned = await keyboard_page.evaluate(
                "() => ({hash:location.hash,scrollY:scrollY})")
            if returned["hash"] != "#page-top" or returned["scrollY"] > 2:
                violations.append("Back to top link did not return to page header")
            ax_session=await keyboard_page.context.new_cdp_session(keyboard_page)
            ax_nodes=(await ax_session.send("Accessibility.getFullAXTree"))["nodes"]
            ax_visible=[n for n in ax_nodes if not n.get("ignored")]
            def names_for_role(role):
                return [n.get("name",{}).get("value","") for n in ax_visible
                        if n.get("role",{}).get("value")==role]
            ax_summary={
                "mains":len(names_for_role("main")),
                "navigationNames":names_for_role("navigation"),
                "imageNames":names_for_role("image"),
                "appearanceNames":names_for_role("combobox"),
                "headingNames":names_for_role("heading"),
                "unnamedLinks":sum(not name.strip() for name in names_for_role("link"))
            }
            if ax_summary["mains"] != 1:
                violations.append("Accessibility tree missing unique main landmark")
            if sorted(ax_summary["navigationNames"]) != ["Additional links","Primary navigation"]:
                violations.append("Navigation landmarks lack expected names")
            if len(ax_summary["imageNames"]) != 2 or any(
                    not name.strip() for name in ax_summary["imageNames"]):
                violations.append("Home photos lack meaningful accessible names")
            if "Appearance theme" not in ax_summary["appearanceNames"]:
                violations.append("Appearance selector lacks accessible name")
            if ax_summary["unnamedLinks"]:
                violations.append("Accessibility tree includes unnamed links")
            item={"page":"home-keyboard","width":375,
                  "first":first,"secondIsBrand":second,"darkBrand":brand,
                  "sectionAnchor":section,"backToTop":returned,
                  "accessibilityTree":ax_summary,
                  "violations":violations}
            results.append(item)
            if violations: failures.append(item)
            print("HOME KEYBOARD","PASS" if not violations else violations,flush=True)
        except Exception as exc:
            item={"page":"home-keyboard","width":375,"error":str(exc)}
            results.append(item);failures.append(item)
            print("HOME KEYBOARD ERROR",item,flush=True)
        finally:
            await keyboard_page.close()

        # Simulate GitHub Pages serving its custom 404 at a nonexistent nested URL.
        page = await browser.new_page(viewport={"width":375,"height":820},
                                      reduced_motion="reduce")
        body = Path("404.html").read_text(encoding="utf-8")
        async def missing_route(route):
            await route.fulfill(status=404,content_type="text/html",body=body)
        await page.route("**/missing/deep/nothing",missing_route)
        try:
            response = await page.goto(BASE+"/missing/deep/nothing",
                                       wait_until="load",timeout=20000)
            await page.locator(".moon-appearance-select").wait_for(timeout=7000)
            data = await page.evaluate("""() => ({
              path:location.pathname,
              styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>({
                href:l.getAttribute('href'),loaded:!!l.sheet
              })),
              nav:[...document.querySelectorAll('.site-nav a')].map(a=>a.getAttribute('href')),
              home:document.querySelector('.control.primary')?.getAttribute('href'),
              appearance:!!document.querySelector('.moon-appearance-select'),
              overflow:document.documentElement.scrollWidth-innerWidth
            })""")
            data.update({"page":"404-nested","httpStatus":response.status if response else None})
            violations=[]
            if data["httpStatus"] != 404: violations.append("404 status not preserved")
            if any(not v["loaded"] for v in data["styles"]): violations.append("404 stylesheet missing")
            if any(not x.startswith("/") for x in data["nav"]): violations.append("404 nav nonroot")
            if data["home"] != "/": violations.append("404 home link incorrect")
            if not data["appearance"]: violations.append("404 appearance control absent")
            if data["overflow"]>3: violations.append("404 mobile overflow")
            data["violations"]=violations
            results.append(data)
            if violations: failures.append(data)
            await page.screenshot(path=str(OUT/"nested-404-375.jpg"),
                                  full_page=True,type="jpeg",quality=75)
            print("NESTED404","PASS" if not violations else violations,flush=True)
        except Exception as exc:
            item={"page":"404-nested","error":str(exc)}
            results.append(item);failures.append(item)
            print("ERROR",item,flush=True)
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps({"results":results,"failures":failures},
        indent=2),encoding="utf-8")
    return 1 if failures else 0

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
