#!/usr/bin/env python3
"""Verify public Studio page/Chrome source bytes independently over HTTPS.

This checks exact public delivery, not editor login, user authorization,
dialog interactions, or actual production publishing.
"""
import hashlib
import json
import pathlib
import subprocess
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "studio-guidance-parity-output"
BASE = "https://gmoon-code.github.io/"
FILES = ("studio/index.html", "studio/studio-chrome.js")
HEAD = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()


def check_one(path, attempt):
    original = (ROOT / path).read_bytes()
    url = BASE + urllib.parse.quote(path, safe="/") + f"?studio-parity={HEAD[:12]}-{attempt}"
    request = urllib.request.Request(url, headers={
        "User-Agent": "WebsiteStudio-Guidance-Parity/1.0",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    })
    item = {
        "path": path,
        "expectedSize": len(original),
        "expectedSha256": hashlib.sha256(original).hexdigest(),
        "identical": False,
    }
    try:
        with urllib.request.urlopen(request, timeout=14) as response:
            delivered = response.read(1_000_000)
            item.update({
                "status": response.status,
                "deliveredSize": len(delivered),
                "deliveredSha256": hashlib.sha256(delivered).hexdigest(),
                "identical": response.status == 200 and delivered == original,
            })
    except Exception as error:
        item["error"] = str(error)[:200]
    return item


def main():
    OUT.mkdir(exist_ok=True)
    history = []
    for attempt in range(1, 9):
        files = [check_one(p, attempt) for p in FILES]
        matched = sum(row["identical"] for row in files)
        history.append({"attempt": attempt, "matched": matched, "files": files})
        print("STUDIO_PUBLIC_PARITY_ATTEMPT", attempt, f"{matched}/{len(FILES)}", flush=True)
        if matched == len(FILES):
            break
        if attempt < 8:
            time.sleep(6)
    success = history[-1]["matched"] == len(FILES)
    record = {
        "sourceHead": HEAD,
        "publicBase": BASE,
        "files": len(FILES),
        "identical": history[-1]["matched"],
        "pass": success,
        "history": history,
        "limits": "Static HTTPS source bytes at the check time, not a browser, authentication or GitHub publication action.",
    }
    (OUT / "summary.json").write_text(
        json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("STUDIO_PUBLIC_PARITY_SUMMARY", json.dumps({
        "head": HEAD, "pass": success, "exactMatches": record["identical"],
        "checked": len(FILES), "attempts": len(history),
    }), flush=True)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
