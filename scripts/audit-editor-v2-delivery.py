#!/usr/bin/env python3
"""Non-destructive audit of actual GitHub Pages bytes used by Editor V2.

Separate from source-matched local browser tests. Only HTTP GET requests
against public pages/assets; never opens the publishing dialog or submits
a GitHub token or publication.
"""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request

ROOT = Path(".")
OUT = Path("editor-v2-delivery-output")
OUT.mkdir(exist_ok=True)
BASE = "https://gmoon-code.github.io/"
HEAD = os.environ.get("GITHUB_SHA", "unknown")
PAGES = [
    "index.html", "research.html", "projects.html", "teaching.html",
    "interests.html", "contact.html", "cv.html", "pungmul.html",
    "research-methods-studio.html", "story-method.html", "research-action.html",
    "research-scoping.html", "writing-biological-classification.html",
    "teaching-ap-biology.html", "teaching-ap-chemistry.html",
    "teaching-ap-evolution.html", "teaching-osmosis-practice.html",
]
RESOURCES = PAGES + [
    "editor-v2.html", "editor-v2.js", "editor-v2.css",
    "moon-free-responsive.js", "responsive-personal-media.js",
]
RETRIES = 12
DELAY = 12


def digest(contents):
    return hashlib.sha256(contents).hexdigest()


def probe(path, round_number):
    expected = (ROOT / path).read_bytes()
    # A changing query string avoids accidentally measuring an old CDN object.
    url = BASE + path + "?v2_delivery_check=" + HEAD[:12] + "-" + str(round_number)
    req = urllib.request.Request(
        url, headers={
            "User-Agent": "MoonAcademic-EditorV2DeliveryAudit/1.0",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as reply:
            data = reply.read(3_000_000)
            code = reply.status
            final = reply.url
    except urllib.error.HTTPError as exc:
        code = exc.code
        final = exc.url
        data = exc.read(1024)
    except Exception as exc:
        return {"path": path, "round": round_number, "ok": False,
                "error": str(exc)[:250], "sourceHash": digest(expected)}
    return {"path": path, "round": round_number,
            "status": code, "ok": code == 200 and data == expected,
            "sourceBytes": len(expected), "deliveredBytes": len(data),
            "sourceHash": digest(expected), "deliveredHash": digest(data),
            "url": final}


def main():
    pending = set(RESOURCES)
    checks = {}
    for attempt in range(1, RETRIES + 1):
        if not pending:
            break
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(lambda p: probe(p, attempt), sorted(pending)))
        for result in results:
            path = result["path"]
            checks[path] = result
            if result["ok"]:
                pending.discard(path)
        print(f"Round {attempt}/{RETRIES}: {len(RESOURCES) - len(pending)}/"
              f"{len(RESOURCES)} exact public byte matches", flush=True)
        for result in results:
            if not result["ok"]:
                print("  Pending", result["path"],
                      "HTTP", result.get("status", "unavailable"),
                      result.get("error", "byte mismatch"), flush=True)
        if pending and attempt < RETRIES:
            time.sleep(DELAY)
    summary = {
        "head_sha": HEAD,
        "pageCount": len(PAGES),
        "editorAndRuntimeAssets": len(RESOURCES) - len(PAGES),
        "resourceCount": len(RESOURCES),
        "exactPublicMatches": len(RESOURCES) - len(pending),
        "allExact": not pending,
        "failedResources": sorted(pending),
        "records": [checks[p] for p in RESOURCES],
        "limitations": (
            "Public HTTPS bytes at test time, not a physical-device browser "
            "session, an owner-authenticated GitHub publication, or a guarantee "
            "against later CDN updates."
        ),
    }
    (OUT / "summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if k != "records"},
                     indent=2), flush=True)
    return 0 if not pending else 1


if __name__ == "__main__":
    raise SystemExit(main())
