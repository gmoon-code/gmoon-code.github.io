#!/usr/bin/env python3
"""Bounded public byte-parity check for Connection Studio's deployed static assets.

A local browser test validates behaviour; this checks whether the exact
repository asset bytes reached GitHub Pages at the time of the live request.
"""
import hashlib
import json
import pathlib
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "connection-studio-live-parity-output"
FILES = [
    "connection-studio/index.html",
    "connection-studio/style.css",
    "connection-studio/data.js",
    "connection-studio/app.js",
    "connection-studio/sw.js",
    "connection-studio/manifest.webmanifest",
    "connection-studio/icon.svg",
]
BASE = "https://gmoon-code.github.io/"
HEAD = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()


def one(path, attempt):
    expected = (ROOT / path).read_bytes()
    url = BASE + urllib.parse.quote(path, safe="/") + f"?connection-parity={HEAD[:12]}-{attempt}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "ConnectionStudio-SourceParity/1.0",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        },
    )
    result = {"path": path, "expectedBytes": len(expected),
              "expectedSha256": hashlib.sha256(expected).hexdigest()}
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            actual = response.read(2_000_000)
            result.update(
                status=response.status,
                actualBytes=len(actual),
                liveSha256=hashlib.sha256(actual).hexdigest(),
                identical=(response.status == 200 and expected == actual),
            )
    except Exception as exc:
        result.update(identical=False, error=str(exc)[:180])
    return result


def main():
    OUT.mkdir(exist_ok=True)
    history = []
    for attempt in range(8):
        rows = [one(path, attempt) for path in FILES]
        matches = sum(x["identical"] for x in rows)
        history.append({"attempt": attempt + 1, "matched": matches,
                        "files": rows})
        print(f"CONNECTION_STUDIO_PARITY_ATTEMPT {attempt + 1} {matches}/{len(FILES)}", flush=True)
        if matches == len(FILES):
            break
        if attempt < 7:
            time.sleep(5)
    last = history[-1]
    result = {
        "checkedSourceHead": HEAD,
        "checkedFiles": len(FILES),
        "exactMatches": last["matched"],
        "pass": last["matched"] == len(FILES),
        "attempts": len(history),
        "history": history,
        "limitations": "Bounded public HTTPS byte comparison, not live browser execution, offline operation, or future deployment availability.",
    }
    (OUT / "summary.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print("CONNECTION_STUDIO_PARITY_SUMMARY", json.dumps({
        "head": HEAD, "checked": len(FILES),
        "matched": last["matched"], "pass": result["pass"]
    }), flush=True)
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
