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



def checkpoint_integrity_issues():
    """Check the living next-stage block, which links alone cannot validate."""
    path = ROOT / "docs" / "CONTENT_AUDIT_CURRENT_CHECKPOINT.md"
    issues = []
    if not path.is_file():
        return [{"document": "docs/CONTENT_AUDIT_CURRENT_CHECKPOINT.md",
                 "error": "living audit checkpoint missing"}]
    text = path.read_text(encoding="utf-8")
    next_marker = "## Exact next unfinished stage"
    boundary_marker = "## Other prior audit boundaries remain open"
    if text.count(next_marker) != 1 or text.count(boundary_marker) != 1:
        return [{"document": path.relative_to(ROOT).as_posix(),
                 "error": "checkpoint stage/boundary heading must occur exactly once"}]
    next_start = text.index(next_marker) + len(next_marker)
    next_end = text.index(boundary_marker)
    if next_end <= next_start:
        return [{"document": path.relative_to(ROOT).as_posix(),
                 "error": "next-stage heading does not precede boundary heading"}]
    stage = text[next_start:next_end].strip()
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", stage) if p.strip()]
    if len(paragraphs) != 1 or not re.match(r"^\*\*C-RV\d+[a-z]+ \| ", stage):
        issues.append({"document": path.relative_to(ROOT).as_posix(),
                       "error": "next-stage block must contain one identifiable checkpoint paragraph",
                       "paragraphCount": len(paragraphs)})
    return issues

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
    checkpoint_issues = checkpoint_integrity_issues()
    report = {
        "scope": "All docs/*.md and root README.md local Markdown file links, explicit HTML ids and living next-stage integrity",
        "documentationFilesScanned": len(scanned),
        "localTargetsChecked": len(checked),
        "htmlFragmentsChecked": sum(bool(x.get("htmlFragment")) or "fragment" in x for x in checked),
        "unresolved": len(invalid) + len(checkpoint_issues),
        "unresolvedDetails": invalid + checkpoint_issues,
        "checkpointIntegrityIssues": checkpoint_issues,
        "limitations": "Does not check external URLs, Markdown heading fragments, dynamic JavaScript-generated anchors, textual citation validity, PDF internal links, GitHub API URLs, or code samples.",
    }
    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / "report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("DOC_LINKS_SUMMARY",json.dumps({
        "documents":len(scanned),"links":len(checked),
        "unresolved":len(invalid) + len(checkpoint_issues),"details":invalid + checkpoint_issues
    },ensure_ascii=False),flush=True)
    return int(bool(invalid or checkpoint_issues))


if __name__ == "__main__":
    raise SystemExit(main())
