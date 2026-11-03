#!/usr/bin/env python3
"""Read-only local Markdown-file link audit for the academic website evidence archive.

Checks resolved local filenames against the repository checkout. This does not
claim to verify remote URLs, Markdown-heading fragments, bibliography content,
or correctness of academic assertions. It checks explicit HTML id fragments.
"""
import html
import json
import pathlib
import posixpath
import re
from functools import lru_cache
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "audit-documentation-links-output"
DOCS = sorted((ROOT / "docs").rglob("*.md"))
OTHER = [ROOT / "README.md"] if (ROOT / "README.md").exists() else []
# One nested pair of parentheses suffices for the project's authored links.
MARKDOWN_LINK = re.compile(r"!?(?:\[[^\]\n]*\])\(((?:[^()\n]|\([^()\n]*\))*)\)")
REFERENCE_LINK = re.compile(r"^\s{0,3}\[[^\]\n]+\]:\s*(\S+)", re.MULTILINE)
EXTERNAL = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//|#)", re.I)
HTML_IDS = re.compile(r'''\bid\s*=\s*([\"'])(.*?)\1''', re.I | re.S)


@lru_cache(maxsize=100)
def explicit_html_ids(path):
    contents = (ROOT / path).read_text(encoding="utf-8")
    return {html.unescape(m.group(2)) for m in HTML_IDS.finditer(contents)}


def strip_code_fences(text):
    lines = []
    fenced = False
    fence_symbol = ""
    fence_width = 0
    for line in text.splitlines():
        marker = re.match(r"^\s{0,3}(`{3,}|~{3,})", line)
        if marker:
            fence = marker.group(1)
            if not fenced:
                fenced = True
                fence_symbol = fence[0]
                fence_width = len(fence)
                continue
            if fence[0] == fence_symbol and len(fence) >= fence_width:
                fenced = False
                continue
        if not fenced:
            lines.append(line)
    return "\n".join(lines)


def local_target(source, raw):
    raw = raw.strip()
    if raw.startswith("<") and ">" in raw:
        raw = raw[1:raw.find(">")]
    else:
        # Optional Markdown title after destination is not part of the path.
        raw = raw.split(' "', 1)[0].split(" '", 1)[0]
    if EXTERNAL.match(raw) or not raw:
        return None
    try:
        target = urlsplit(raw)
    except ValueError:
        return {"error": "unparseable destination", "raw": raw}
    path = unquote(target.path)
    if not path:
        return None
    source_relative = source.relative_to(ROOT).as_posix()
    if path.startswith("/"):
        resolved = posixpath.normpath(path.lstrip("/"))
    else:
        resolved = posixpath.normpath(posixpath.join(posixpath.dirname(source_relative), path))
    if resolved.startswith("../") or resolved == "..":
        return {"error": "link escapes repository root", "raw": raw, "resolved": resolved}
    if not (ROOT / resolved).is_file():
        return {"error": "referenced local file missing", "raw": raw, "resolved": resolved}
    fragment = unquote(target.fragment)
    if resolved.lower().endswith(".html") and fragment:
        if fragment not in explicit_html_ids(resolved):
            return {"error": "referenced HTML id does not exist", "raw": raw,
                    "resolved": resolved, "fragment": fragment}
        return {"resolved": resolved, "raw": raw, "htmlFragment": fragment}
    return {"resolved": resolved, "raw": raw}


def main():
    scanned = []
    checked = []
    invalid = []
    for source in DOCS + OTHER:
        text = strip_code_fences(source.read_text(encoding="utf-8"))
        links = [m.group(1) for m in MARKDOWN_LINK.finditer(text)]
        links += [m.group(1) for m in REFERENCE_LINK.finditer(text)]
        scanned.append(source.relative_to(ROOT).as_posix())
        for raw in links:
            result = local_target(source, raw)
            if result is None:
                continue
            result["document"] = source.relative_to(ROOT).as_posix()
            checked.append(result)
            if result.get("error"):
                invalid.append(result)
        print("DOC_LINKS",source.relative_to(ROOT).as_posix(),
              sum(x["document"] == source.relative_to(ROOT).as_posix() for x in checked),
              flush=True)
    report = {
        "scope": "All docs/*.md and root README.md local Markdown file links and explicit HTML id fragments",
        "documentationFilesScanned": len(scanned),
        "localTargetsChecked": len(checked),
        "htmlFragmentsChecked": sum(bool(x.get("htmlFragment")) or "fragment" in x for x in checked),
        "unresolved": len(invalid),
        "unresolvedDetails": invalid,
        "limitations": "Does not check external URLs, Markdown heading fragments, dynamic JavaScript-generated anchors, textual citation validity, PDF internal links, GitHub API URLs, or code samples.",
    }
    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / "report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("DOC_LINKS_SUMMARY",json.dumps({
        "documents":len(scanned),"links":len(checked),
        "unresolved":len(invalid),"details":invalid
    },ensure_ascii=False),flush=True)
    return int(bool(invalid))


if __name__ == "__main__":
    raise SystemExit(main())
