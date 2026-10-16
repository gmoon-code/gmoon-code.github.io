#!/usr/bin/env python3
"""Browser-based accessibility audit for the public portfolio.

Runs axe-core from a pinned npm installation against local pages.
Reports automated WCAG 2.0/2.1/2.2 A/AA and best-practice findings.
Automated scans do not establish overall WCAG conformance.
"""
import asyncio
import json
import pathlib
import sys

from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:8765"
PAGES = sorted(p.name for p in pathlib.Path(".").glob("*.html"))
MOBILE_PAGES = (
    "index.html", "research.html", "interests.html",
    "research-methods-studio.html", "story-method.html",
    "writing-biological-classification.html",
)
OUTPUT = pathlib.Path("accessibility-audit-output")
OUTPUT.mkdir(exist_ok=True)
AXE = pathlib.Path("node_modules/axe-core/axe.min.js")
TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa",
        "wcag22a", "wcag22aa", "best-practice"]


async def scan(browser, filename, width):
    page = await browser.new_page(viewport={"width": width, "height": 900},
                                  reduced_motion="reduce")
    try:
        response = await page.goto(f"{BASE}/{filename}", wait_until="domcontentloaded",
                                   timeout=25000)
        await page.locator("main").wait_for(timeout=5000)
        await page.add_script_tag(path=str(AXE))
        result = await page.evaluate("""async tags => {
          const report = await axe.run(document, {
            runOnly: {type: 'tag', values: tags},
            resultTypes: ['violations', 'incomplete'],
          });
          return {
            violations: report.violations.map(v => ({
              id:v.id, impact:v.impact, description:v.description,
              help:v.help, helpUrl:v.helpUrl,
              nodes:v.nodes.slice(0,15).map(n => ({
                target:n.target, html:n.html.slice(0,350),
                summary:n.failureSummary
              }))
            })),
            incomplete: report.incomplete.map(v => ({
              id:v.id, count:v.nodes.length
            }))
          };
        }""", TAGS)
        result["page"] = filename
        result["width"] = width
        result["httpStatus"] = response.status if response else None
        return result
    finally:
        await page.close()


async def main():
    if not AXE.is_file():
        print(f"Missing axe-core bundle at {AXE}", file=sys.stderr)
        return 2
    cases = [(page, 1440) for page in PAGES] + [
        (page, 320) for page in MOBILE_PAGES
    ]
    reports = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for name, width in cases:
            try:
                report = await scan(browser, name, width)
                reports.append(report)
                print(f"{name} @{width}: {len(report['violations'])} rule violations")
                for v in report["violations"]:
                    print(f"  {v['impact']} {v['id']}: {v['help']}")
                    for node in v["nodes"][:5]:
                        print(f"    {node['target']}: {node['summary']}")
            except Exception as e:
                print(f"ERROR {name} @{width}: {e}")
                reports.append({"page":name, "width":width, "error":str(e)})
        await browser.close()
    (OUTPUT / "report.json").write_text(
        json.dumps(reports, ensure_ascii=False, indent=2), encoding="utf-8")
    counts = {}
    for r in reports:
        for v in r.get("violations", []):
            counts[v["id"]] = counts.get(v["id"], 0) + len(v["nodes"])
    print(f"Scanned {len(reports)} page/viewport combinations. "
          f"Automated violation nodes by rule: {json.dumps(counts)}")
    print("Review incomplete rules and perform manual keyboard/screen-reader checks.")
    return 1 if any("error" in r for r in reports) else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
