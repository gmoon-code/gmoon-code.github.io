#!/usr/bin/env python3
"""Non-destructive external-link inventory and availability audit.

Inspect unique HTTP(S) links and remote images in portfolio HTML.
HEAD responses are confirmed with GET when needed.
403/429, timeouts, anti-bot pages and DNS errors are marked 'unverified',
never automatically treated as broken. A real 404/410 is reported only after
a confirming GET. This script is diagnostic and does not modify the site.
"""
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen
import json
import socket
import ssl

MAX_WORKERS = 10
TIMEOUT = 8
OUTPUT = Path("external-link-audit-output")
OUTPUT.mkdir(exist_ok=True)

class OutboundParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        target = values.get("href") if tag == "a" else (
            values.get("src") if tag == "img" else None
        )
        if target and target.startswith(("https://", "http://")):
            self.links.append((tag, target))


def request_status(url, method):
    req = Request(url, headers={
        "User-Agent": ("Mozilla/5.0 (compatible; MoonPortfolioLinkAudit/1.0; "
                       "+https://gmoon-code.github.io/)"),
        "Accept": "text/html,application/xhtml+xml,image/*,*/*;q=0.8",
        "Range": "bytes=0-8192",
    }, method=method)
    try:
        with urlopen(req, timeout=TIMEOUT) as response:
            return {"code":response.status, "finalUrl":response.url,
                    "contentType":response.headers.get("Content-Type", "")}
    except HTTPError as e:
        return {"code":e.code, "finalUrl":e.url, "error":str(e.reason)}
    except (URLError, TimeoutError, OSError, ssl.SSLError,
            socket.timeout) as e:
        return {"code":None, "error":str(e)[:170]}


def check(entry):
    url = entry["url"]
    head = request_status(url, "HEAD")
    code = head.get("code")
    if code is not None and 200 <= code < 400:
        return {**entry, "status":"reachable", "head":head}
    get = request_status(url, "GET")
    code = get.get("code")
    if code is not None and 200 <= code < 400:
        verdict = "reachable"
    elif code in (404, 410):
        verdict = "confirmed-missing"
    else:
        verdict = "unverified"
    return {**entry, "status":verdict, "head":head, "get":get}


def main():
    inventory = defaultdict(lambda: {"pages":set(), "kinds":set()})
    for path in sorted(Path(".").glob("*.html")):
        parser = OutboundParser()
        parser.feed(path.read_text(encoding="utf-8"))
        for kind, url in parser.links:
            # Keep query strings intact, they may be needed to find a resource.
            entry = inventory[url]
            entry["pages"].add(path.name)
            entry["kinds"].add("image" if kind == "img" else "link")
    jobs = [
        {"url":url, "pages":sorted(info["pages"]),
         "kinds":sorted(info["kinds"])}
        for url, info in inventory.items()
    ]
    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(check, item):item for item in jobs}
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            print(f"{result['status']:18s} {result['url']}")
    results.sort(key=lambda x:x["url"])
    (OUTPUT / "report.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    counts = dict(Counter(x["status"] for x in results))
    print(f"Checked {len(results)} distinct external destinations: {counts}")
    for row in results:
        if row["status"] != "reachable":
            print("REVIEW", json.dumps(row, ensure_ascii=False))
    print("Unverified does not mean broken; manual checks are required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
