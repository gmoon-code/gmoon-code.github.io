"""Focused Research page visual regression captures.

Runs separately from the larger whole-site smoke test so desktop/tablet screenshots
are available even when a broad test is cancelled. Records geometry, not visual approval.
"""
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright

PAGE_URL = "http://127.0.0.1:8765/research.html"
WIDTHS = (320, 375, 768, 1024, 1440)
OUT = Path("research-visual-output")


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    observations = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for width in WIDTHS:
            context = await browser.new_context(
                viewport={"width": width, "height": 900},
                device_scale_factor=1,
                color_scheme="light",
                reduced_motion="reduce",
            )
            page = await context.new_page()
            try:
                response = await page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=30000)
                if not response or response.status >= 400:
                    raise RuntimeError(f"Research page HTTP status {response.status if response else 'none'}")
                await page.evaluate("document.fonts.ready")
                await page.evaluate("""async () => {
                    await Promise.all([...document.querySelectorAll('main img')].map(async img => {
                        img.loading = 'eager';
                        try { await Promise.race([img.decode(), new Promise(r => setTimeout(r, 4000))]); } catch (_) {}
                    }));
                }""")
                data = await page.evaluate("""() => {
                    const box = selector => {
                        const e = document.querySelector(selector);
                        if (!e) return null;
                        const r = e.getBoundingClientRect();
                        const style = getComputedStyle(e);
                        return {
                            x: Math.round(r.x), y: Math.round(r.y),
                            width: Math.round(r.width), height: Math.round(r.height),
                            fontSize: style.fontSize, lineHeight: style.lineHeight
                        };
                    };
                    const named = [
                        '.research-essay-hero', '.research-section-guide',
                        '#current-inquiries', '#research-interests',
                        '#scientific-representations', '#scholarly-writing',
                        '#research-reading', '.research-published-figure',
                        '.research-reading-list', '.site-footer'
                    ];
                    const main = document.querySelector('main');
                    const problem = [...document.querySelectorAll('main h1, main h2, main h3, main h4, main p, main figure, main li')]
                        .map(e => {
                            const r = e.getBoundingClientRect();
                            return {tag: e.tagName, text: (e.innerText || '').slice(0, 80), left: Math.round(r.left), right: Math.round(r.right)};
                        }).filter(r => r.left < -4 || r.right > window.innerWidth + 4);
                    return {
                        viewport: window.innerWidth,
                        documentWidth: document.documentElement.scrollWidth,
                        documentHeight: document.documentElement.scrollHeight,
                        mainWidth: Math.round(main.getBoundingClientRect().width),
                        elements: Object.fromEntries(named.map(name => [name, box(name)])),
                        referenceFont: getComputedStyle(document.querySelector('.research-reading-list li')).fontSize,
                        missingImages: [...document.querySelectorAll('main img')].filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute('src')),
                        escapedTextBlocks: problem.slice(0, 16),
                        escapedTextBlockCount: problem.length
                    };
                }""")
                await page.screenshot(path=str(OUT / f"research-{width}.png"), full_page=True, animations="disabled")
                if width in (320, 375):
                    figure = page.locator(".research-figure-pan")
                    before = await figure.evaluate("""el => ({
                        clientWidth: el.clientWidth,
                        scrollWidth: el.scrollWidth,
                        scrollLeft: el.scrollLeft,
                        focusable: el.tabIndex === 0,
                        hintShown: getComputedStyle(document.querySelector('.research-figure-pan-hint')).display !== 'none'
                    })""")
                    await figure.focus()
                    await page.keyboard.press("ArrowRight")
                    await page.wait_for_timeout(220)
                    after_scroll = await figure.evaluate("el => el.scrollLeft")
                    data["figurePan"] = {**before, "afterRightArrow": after_scroll,
                                         "works": before["focusable"] and
                                           before["hintShown"] and
                                           before["scrollWidth"] > before["clientWidth"] + 100 and
                                           after_scroll > before["scrollLeft"]}
                    if not data["figurePan"]["works"]:
                        raise RuntimeError("Research image must scroll sideways by keyboard at phone widths")
                if width in (320, 1440):
                    refs = await page.evaluate("""() => {
                      const list=[...document.querySelectorAll('#research-reading li[id^="reading-"]')];
                      const sourceLinks=[...document.querySelectorAll('main a[href^="#reading-"]')];
                      const ids=list.map(li=>li.id);
                      const incoming=new Set(sourceLinks.map(a=>a.getAttribute('href').slice(1)));
                      const links=list.map(li=>[...li.querySelectorAll('a[href]')]);
                      const misplaced=sourceLinks.filter(a=>!ids.includes(a.getAttribute('href').slice(1)));
                      const unnamed=links.flat().filter(a=>!(a.textContent||a.getAttribute('aria-label')||'').trim());
                      const invalid=links.flat().filter(a=>!/^https:\\/\\//.test(a.getAttribute('href')));
                      const badDoiText=links.flat().filter(a=>{
                        const href=a.getAttribute('href');
                        return href.startsWith('https://doi.org/') &&
                          a.textContent.trim().startsWith('https://') &&
                          a.textContent.trim()!==href;
                      });
                      const compact=links.flat().filter(a=>{
                        const r=a.getBoundingClientRect();
                        return r.width<24||r.height<24;
                      }).map(a=>({text:a.textContent.slice(0,60),height:a.getBoundingClientRect().height}));
                      return {
                        entries:ids.length,
                        duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),
                        uncited:ids.filter(id=>!incoming.has(id)),
                        unresolvedIncoming:misplaced.length,
                        linkCounts:links.map(a=>a.length),
                        duplicateUrls:links.flat().map(a=>a.getAttribute('href'))
                          .filter((url,i,all)=>all.indexOf(url)!==i),
                        unnamed:unnamed.length,
                        invalid:invalid.length,
                        badDoiText:badDoiText.length,
                        compactTargets:compact.slice(0,10),
                        compactTargetCount:compact.length
                      };
                    }""")
                    data["bibliography"] = refs
                    if (refs["entries"] != 53 or refs["duplicateIds"] or
                        refs["uncited"] or refs["unresolvedIncoming"] or
                        refs["duplicateUrls"] or refs["unnamed"] or
                        refs["invalid"] or refs["badDoiText"] or
                        refs["compactTargetCount"] or
                        any(n != 1 for n in refs["linkCounts"])):
                        raise RuntimeError("Research bibliography failed 53-entry source/citation/link audit: "+
                                           json.dumps(refs, ensure_ascii=False))
                observations.append(data)
                print(json.dumps(data, ensure_ascii=False), flush=True)
            except Exception as error:
                observations.append({"viewport": width, "error": str(error)})
                print(f"RESEARCH VISUAL CAPTURE ERROR at {width}: {error}", flush=True)
            finally:
                await context.close()
        # Sample dark appearance and print CSS without altering the published page.
        for mode, width in (("dark", 375), ("print", 768)):
            context = await browser.new_context(viewport={"width": width, "height": 900},
                                               device_scale_factor=1, reduced_motion="reduce")
            page = await context.new_page()
            try:
                await page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=30000)
                await page.evaluate("document.fonts.ready")
                if mode == "dark":
                    # Use the real appearance control, not an artificial HTML attribute.
                    await page.locator(".moon-appearance-select").select_option("dark")
                    await page.wait_for_function("document.documentElement.dataset.moonTheme === 'dark'")
                else:
                    await page.emulate_media(media="print")
                # A full-page screenshot alone does not load lazy images.
                # Decode the source graph before capturing Dark/Print evidence.
                await page.locator(".research-published-figure img").evaluate("""async img => {
                    img.loading = 'eager';
                    await img.decode();
                }""")
                await page.screenshot(path=str(OUT / f"research-{mode}-{width}.png"),
                                      full_page=True, animations="disabled")
                data = await page.evaluate("""() => ({
                    viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
                    appearance: document.documentElement.getAttribute('data-moon-theme'),
                    printNavigationHidden: getComputedStyle(document.querySelector('.research-section-guide')).display === 'none',
                    projectCardBackground: getComputedStyle(document.querySelector('.research-study-preview')).backgroundColor,
                    projectCardText: getComputedStyle(document.querySelector('.research-study-preview p')).color,
                    publishedFigureLoaded: (() => {
                        const img=document.querySelector('.research-published-figure img');
                        return !!img&&img.complete&&img.naturalWidth>0;
                    })()
                })""")
                if not data["publishedFigureLoaded"]:
                    raise RuntimeError("Research figure not decoded before Dark or Print screenshot")
                observations.append({"mode": mode, **data})
                print(json.dumps({"mode": mode, **data}), flush=True)
            except Exception as error:
                observations.append({"mode": mode, "viewport": width, "error": str(error)})
                print(f"RESEARCH {mode} capture error: {error}", flush=True)
            finally:
                await context.close()
        # Keyboard navigation and sticky section guide are functional, not just visible.
        context = await browser.new_context(viewport={"width": 375, "height": 900})
        page = await context.new_page()
        try:
            await page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=30000)
            await page.keyboard.press("Tab")
            first_focus = await page.evaluate("document.activeElement.textContent.trim()")
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(80)
            skip_target = await page.evaluate("document.activeElement.id")
            await page.locator('.research-section-guide a[href="#research-interests"]').click()
            fragment = await page.evaluate("location.hash")
            await page.set_viewport_size({"width": 1440, "height": 900})
            await page.goto(PAGE_URL, wait_until="domcontentloaded", timeout=30000)
            # The site normally uses smooth scrolling; force an immediate scroll
            # so the sticky-position measurement is not taken mid-animation.
            await page.evaluate("document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 2200)")
            await page.wait_for_function("window.scrollY > 2100", timeout=5000)
            await page.wait_for_timeout(80)
            sticky_top = await page.locator(".research-section-guide").evaluate(
                "(el) => Math.round(el.getBoundingClientRect().top)")
            passed = (first_focus == "Skip to content" and skip_target == "main"
                      and fragment == "#research-interests" and 23 <= sticky_top <= 34)
            record = {"mode": "interaction", "viewport": 1440, "firstFocus": first_focus,
                      "skipTarget": skip_target, "navFragment": fragment,
                      "stickyGuideTop": sticky_top, "pass": passed}
            observations.append(record)
            print(json.dumps(record), flush=True)
        except Exception as error:
            observations.append({"mode": "interaction", "error": str(error)})
            print(f"RESEARCH interaction error: {error}", flush=True)
        finally:
            await context.close()
        # A4 is a paginated medium, unlike a full-height print screenshot.
        # Check that major headings do not strand on a previous sheet and
        # each reference's beginning and final link remain on the same sheet.
        import fitz
        import unicodedata
        print_context = await browser.new_context(viewport={"width":1440,"height":900},
                                                   reduced_motion="reduce")
        print_page = await print_context.new_page()
        try:
            response = await print_page.goto(PAGE_URL, wait_until="load", timeout=30000)
            await print_page.evaluate("document.fonts.ready")
            await print_page.locator(".research-published-figure img").evaluate(
                """async img => {img.loading='eager'; await img.decode();}""")
            raw_refs = await print_page.locator("#research-reading li[id]").evaluate_all(
                """items => items.map(li => ({
                    id:li.id,
                    start:li.innerText.slice(0,45),
                    link:li.querySelector('a')?.textContent.trim()||''
                }))""")
            pdf_bytes = await print_page.pdf(
                format="A4", print_background=True, display_header_footer=False,
                margin={"top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
            (OUT/"research-A4.pdf").write_bytes(pdf_bytes)
            pdf = fitz.open(stream=pdf_bytes,filetype="pdf")
            def normalize(text):
                return "".join(ch for ch in unicodedata.normalize("NFKD",text).casefold()
                               if ch.isalnum())
            pages = [normalize(p.get_text("text")) for p in pdf]
            pairs = [
                ("Research projects","Multilingual science education scoping review"),
                ("Research interests","I read studies of teacher decision-making"),
                ("Classroom authority and epistemic agency","During a lesson on cell signalling"),
                ("Recognizing scientific reasoning","People can know similar things"),
                ("Multilingual participation and scientific reasoning",
                 "In an English-medium science classroom"),
                ("Scientific representations and their limits",
                 "A simple population-growth model"),
                ("Sex determination and biological variation","Human sex development"),
                ("Related writing","These questions also inform my independent essay"),
                ("References","Airton, L. (2023)")
            ]
            stranded = []
            for heading,opening in pairs:
                h,o = normalize(heading),normalize(opening)
                if not any(h in page and o in page for page in pages):
                    stranded.append(heading)
            split_refs = []
            for ref in raw_refs:
                start,link = normalize(ref["start"]),normalize(ref["link"])
                if not any(start in page and link in page for page in pages):
                    split_refs.append(ref["id"])
            if len(pdf):
                for i in sorted(set([0,len(pdf)-1,len(pdf)-2,10])):
                    if i < len(pdf):
                        pdf[i].get_pixmap(matrix=fitz.Matrix(1.15,1.15)).save(
                            str(OUT/f"research-A4-page-{i+1}.png"))
            report = {"mode":"print-A4","pages":len(pdf),
                      "references":len(raw_refs),"strandedHeadings":stranded,
                      "splitReferences":split_refs,
                      "figureDecoded":await print_page.locator(
                         ".research-published-figure img").evaluate(
                         "img=>img.complete&&img.naturalWidth>0"),
                      "pass":(len(raw_refs)==53 and not stranded and not split_refs
                              and 1<=len(pdf)<=25)}
            observations.append(report)
            print(json.dumps(report,ensure_ascii=False),flush=True)
            pdf.close()
        except Exception as error:
            observations.append({"mode":"print-A4","error":str(error)})
            print(f"RESEARCH A4 PRINT ERROR: {error}",flush=True)
        finally:
            await print_context.close()
        await browser.close()
    (OUT / "geometry.json").write_text(json.dumps(observations, indent=2), encoding="utf-8")
    errors = [x for x in observations if "error" in x or ("documentWidth" in x and x["documentWidth"] > x.get("viewport", 0) + 4) or x.get("escapedTextBlockCount", 0) > 0 or (x.get("mode") in ("interaction","print-A4") and not x.get("pass"))]
    if errors:
        print("Some visual geometry diagnostics require review. See geometry.json.", flush=True)
        return 1
    print("All five Research widths captured without detected horizontal overflow.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
