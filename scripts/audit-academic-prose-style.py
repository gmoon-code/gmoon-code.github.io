#!/usr/bin/env python3
"""Check exact non-negotiable prose punctuation without changing cited titles.

This is a bounded, static-source sentinel for main/body p, li, headings, and
figcaptions. It is not a comprehensive sentence-quality or browser audit.
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "audit-academic-style-output"
FILES = sorted({*ROOT.glob("*.html"), *ROOT.glob("*/*.html")})
MAIN = re.compile(r"<main\b[^>]*>[\s\S]*?</main>", re.IGNORECASE)
BODY = re.compile(r"<body\b[^>]*>[\s\S]*?</body>", re.IGNORECASE)
REMOVE = re.compile(r"<(?:script|style)\b[^>]*>[\s\S]*?</(?:script|style)>", re.IGNORECASE)
TEXT_TAG = re.compile(r"<(p|li|figcaption|h[1-6])\b([^>]*)>([\s\S]*?)</\1>", re.IGNORECASE)
STRIP = re.compile(r"<[^>]*>")
ID = re.compile(r"\bid\s*=\s*(['\"])(.*?)\1", re.IGNORECASE)

# Preserve original publication-title and official journal-title punctuation.
# These are bibliographic transcriptions, not wording authored for the site.
EXCEPTIONS = {
    ("research.html", "reading-gonsalves"): "girly girl—there",
    ("teaching-ap-biology.html", "bio-ref-shiroda"): "CBE—Life Sciences Education",
}


def main():
    total = 0
    excluded = []
    problems = []
    first_research_paragraph = None
    for path in FILES:
        relative = path.relative_to(ROOT).as_posix()
        source = path.read_text(encoding="utf-8")
        region = MAIN.search(source) or BODY.search(source)
        if not region:
            problems.append({"file": relative, "error": "no main or body region"})
            continue
        cleaned = REMOVE.sub("", region.group())
        for match in TEXT_TAG.finditer(cleaned):
            total += 1
            tag, attrs, raw = match.groups()
            text = " ".join(html.unescape(STRIP.sub(" ", raw)).split())
            element = ID.search(attrs)
            identifier = element.group(2) if element else ""
            if relative == "research.html" and tag.lower() == "p" and first_research_paragraph is None:
                first_research_paragraph = text
            if "—" not in text:
                continue
            permitted = EXCEPTIONS.get((relative, identifier))
            if tag.lower() == "li" and permitted and text.count("—") == 1 and permitted in text:
                excluded.append({"file": relative, "id": identifier, "sourceText": permitted})
            else:
                problems.append({"file": relative, "id": identifier, "error": "authored em dash", "excerpt": text[:240]})
    if first_research_paragraph is None:
        problems.append({"file": "research.html", "error": "opening paragraph not found"})
    elif re.match(r"^imagine\b", first_research_paragraph, re.IGNORECASE):
        problems.append({"file": "research.html", "error": "opening paragraph uses Imagine prompt"})
    report = {
        "htmlRoutesScanned": len(FILES),
        "proseSegmentsInspected": total,
        "protectedBibliographicPunctuation": excluded,
        "openingResearchParagraph": (first_research_paragraph or "")[:150],
        "problems": problems,
        "scope": "Static main/body HTML p, li, figure captions and headings; excludes JavaScript-generated content and nuanced editorial decisions.",
    }
    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / "summary.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("ACADEMIC_PROSE_STYLE_SUMMARY", json.dumps({
        "routes": len(FILES), "segments": total,
        "preservedSourceTitles": len(excluded), "issues": problems
    }, ensure_ascii=False), flush=True)
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
