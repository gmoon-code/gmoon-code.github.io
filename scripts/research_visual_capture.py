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
                await page.screenshot(path=str(OUT / f"research-{mode}-{width}.png"),
                                      full_page=True, animations="disabled")
                data = await page.evaluate("""() => ({
                    viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
                    appearance: document.documentElement.getAttribute('data-moon-theme'),
                    printNavigationHidden: getComputedStyle(document.querySelector('.research-section-guide')).display === 'none',
                    projectCardBackground: getComputedStyle(document.querySelector('.research-study-preview')).backgroundColor,
                    projectCardText: getComputedStyle(document.querySelector('.research-study-preview p')).color
                })""")
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
            await page.evaluate("window.scrollTo(0, 2200)")
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
        await browser.close()
    (OUT / "geometry.json").write_text(json.dumps(observations, indent=2), encoding="utf-8")
    errors = [x for x in observations if "error" in x or ("documentWidth" in x and x["documentWidth"] > x.get("viewport", 0) + 4) or x.get("escapedTextBlockCount", 0) > 0 or (x.get("mode") == "interaction" and not x.get("pass"))]
    if errors:
        print("Some visual geometry diagnostics require review. See geometry.json.", flush=True)
        return 1
    print("All five Research widths captured without detected horizontal overflow.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
