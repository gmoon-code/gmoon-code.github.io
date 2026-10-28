"""Reusable five-width browser audit for a public long-form website page.

Checks layout geometry and saves full-page screenshots. Screenshot review is
still required; automated geometry cannot certify visual quality.
"""
import asyncio
import json
import os
from pathlib import Path

from playwright.async_api import async_playwright

PAGE = os.environ.get("VISUAL_PAGE", "research-action.html")
if "/" in PAGE or not PAGE.endswith(".html"):
    raise SystemExit("VISUAL_PAGE must be a root-level HTML filename")
URL = f"http://127.0.0.1:8765/{PAGE}"
OUT = Path("longform-visual-output")
WIDTHS = (320, 375, 768, 1024, 1440)


async def inspect(page, width, mode):
    return await page.evaluate("""({width, mode}) => {
      const $ = sel => document.querySelector(sel);
      const rect = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {left:Math.round(r.left), right:Math.round(r.right),
          top:Math.round(r.top), bottom:Math.round(r.bottom), width:Math.round(r.width)};
      };
      const main = $('main');
      const invalid = [...document.querySelectorAll('main h1, main h2, main h3, main p, main figure, main li, main .research-case')]
        .filter(el => !el.closest('.research-table-wrap'))
        .map(el => ({tag:el.tagName,text:(el.textContent||'').trim().slice(0,64),...rect(el)}))
        .filter(r => r.left < -4 || r.right > innerWidth+4);
      const tables = [...document.querySelectorAll('.research-table-wrap')].map(el => ({
        clientWidth:el.clientWidth, scrollWidth:el.scrollWidth,
        keyboardAccessible:el.tabIndex === 0, label:el.getAttribute('aria-label'),
        bounds:rect(el)
      }));
      const card = $('.research-case');
      const stage = $('.figure-sequence');
      return {width, mode,documentWidth:document.documentElement.scrollWidth,
        documentHeight:document.documentElement.scrollHeight,
        escapedCount:invalid.length,escaped:invalid.slice(0,10),
        main:rect(main),sequence:rect(stage),
        caseBackground:card?getComputedStyle(card).backgroundColor:null,
        caseText:card?getComputedStyle(card).color:null,
        tables, printNavHidden:mode==='print'?
          getComputedStyle($('.article-jumps')).display==='none':null,
        brokenImages:[...document.querySelectorAll('main img')].filter(el => !el.naturalWidth).length};
    }""", {"width":width,"mode":mode})


async def main():
    OUT.mkdir(exist_ok=True)
    records=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for width in WIDTHS:
            context=await browser.new_context(viewport={"width":width,"height":900},
                                              reduced_motion="reduce",device_scale_factor=1)
            page=await context.new_page()
            try:
                response=await page.goto(URL,wait_until="domcontentloaded",timeout=30000)
                if not response or response.status>=400:
                    raise RuntimeError(f"HTTP {response.status if response else 'none'}")
                await page.evaluate("document.fonts.ready")
                record=await inspect(page,width,"light")
                records.append(record)
                await page.screenshot(path=str(OUT/f"{PAGE[:-5]}-{width}.png"),
                                      full_page=True,animations="disabled")
                print(json.dumps(record,ensure_ascii=False),flush=True)
            except Exception as e:
                records.append({"width":width,"mode":"light","error":str(e)})
                print("ERROR",width,str(e),flush=True)
            finally:
                await context.close()
        for mode,width in (("dark",375),("print",768)):
            context=await browser.new_context(viewport={"width":width,"height":900},
                                              reduced_motion="reduce")
            page=await context.new_page()
            try:
                await page.goto(URL,wait_until="domcontentloaded",timeout=30000)
                await page.evaluate("document.fonts.ready")
                if mode=="dark":
                    await page.locator('.moon-appearance-select').select_option('dark')
                    await page.wait_for_function(
                        "document.documentElement.dataset.moonTheme === 'dark'")
                else:
                    await page.emulate_media(media="print")
                record=await inspect(page,width,mode)
                records.append(record)
                await page.screenshot(path=str(OUT/f"{PAGE[:-5]}-{mode}-{width}.png"),
                                      full_page=True,animations="disabled")
                print(json.dumps(record,ensure_ascii=False),flush=True)
            except Exception as e:
                records.append({"width":width,"mode":mode,"error":str(e)})
                print("ERROR",mode,str(e),flush=True)
            finally:
                await context.close()
        await browser.close()
    (OUT/"geometry.json").write_text(json.dumps(records,indent=2),encoding="utf-8")
    errors=[x for x in records if "error" in x or x.get("documentWidth",10**6)>x.get("width",0)+4
            or x.get("escapedCount",0)>0 or x.get("brokenImages",0)>0
            or (x.get("mode")=="print" and not x.get("printNavHidden"))
            or any(not t["keyboardAccessible"] or not t["label"] for t in x.get("tables",[]))]
    if errors:
        print(f"{len(errors)} geometry/accessibility warning(s); inspect geometry.json",flush=True)
        return 1
    print(f"All {len(records)} long-form capture checks completed successfully.",flush=True)
    return 0


if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
