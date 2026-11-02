"""Read-only parity check of scholarly text actually served by GitHub Pages.

Compare the complete visible-text stream in each <main> with the current
repository source. Deployment success and localhost tests alone cannot
establish remotely delivered content parity.
"""
import hashlib
import json
import re
import sys
import time
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

SITE = "https://gmoon-code.github.io"
PAGES = ("research-scoping.html", "research-action.html", "teaching.html")
OUT = Path("site-parity-output")


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ignored = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "template"):
            self.ignored += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "template"):
            self.ignored = max(0, self.ignored - 1)

    def handle_data(self, value):
        if self.ignored == 0:
            self.parts.append(value)


def main_text(html):
    match = re.search(r"<main\b[^>]*>(.*?)</main\s*>", html, re.I | re.S)
    if not match:
        raise ValueError("Page has no identifiable <main> block")
    parser = VisibleText()
    parser.feed(match.group(1))
    return unicodedata.normalize("NFC", " ".join(" ".join(parser.parts).split()))


def digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def check_page(page):
    local = Path(page).read_text(encoding="utf-8")
    source_text = main_text(local)
    url = f"{SITE}/{page}"
    request = Request(url, headers={"User-Agent": "academic-site-parity/1.0",
                                    "Accept": "text/html"})
    with urlopen(request, timeout=25) as response:
        status = response.status
        content_type = response.headers.get("Content-Type", "")
        served = response.read().decode("utf-8")
    remote_text = main_text(served)
    equal = (status == 200 and "html" in content_type.lower()
             and source_text == remote_text)
    result = {"path": page, "url": url, "http_status": status,
              "content_type": content_type, "equal": equal,
              "source_text_characters": len(source_text),
              "served_text_characters": len(remote_text),
              "source_text_sha256": digest(source_text),
              "served_text_sha256": digest(remote_text)}
    if not equal:
        first = next((i for i, (a, b) in enumerate(zip(source_text, remote_text))
                      if a != b), min(len(source_text), len(remote_text)))
        result["first_difference_character"] = first
        result["source_excerpt"] = source_text[max(0, first - 65):first + 110]
        result["served_excerpt"] = remote_text[max(0, first - 65):first + 110]
    return result


def main():
    OUT.mkdir(exist_ok=True)
    report = []
    for attempt in range(1, 6):
        report = []
        for page in PAGES:
            try:
                result = check_page(page)
            except Exception as exc:
                result = {"path": page, "equal": False,
                          "error": f"{type(exc).__name__}: {exc}"}
            report.append(result)
            print("SERVED CONTENT", page,
                  "PASS" if result["equal"] else "UNVERIFIED",
                  flush=True)
        if all(row["equal"] for row in report):
            break
        if attempt < 5:
            time.sleep(12)
    payload = {"attempts": attempt, "scope": "complete normalized main text",
               "method": "independent HTTPS GET from GitHub Actions runner",
               "results": report}
    (OUT / "report.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False),
                                     encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2), flush=True)
    if not all(row["equal"] for row in report):
        sys.exit(1)


if __name__ == "__main__":
    main()
