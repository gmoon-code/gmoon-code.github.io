#!/usr/bin/env python3
"""S2: bounded external HTTP(S) link and remote media verification for 19 public pages.

HEAD is diagnostic. GET confirms uncertain HEAD results; HTTP 404/410 is classified
as missing only when GET also returns 404/410. HTTP 403/429, timeouts, TLS,
DNS and access restrictions are unverified, never presumed broken.
"""
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
import json, socket, ssl, os, re

PAGES = [
    "404.html","about.html","contact.html","cv.html","index.html","interests.html",
    "projects.html","pungmul.html","research-action.html","research-methods-studio.html",
    "research-scoping.html","research.html","story-method.html","teaching-ap-biology.html",
    "teaching-ap-chemistry.html","teaching-ap-evolution.html","teaching-osmosis-practice.html",
    "teaching.html","writing-biological-classification.html",
]
MAX_WORKERS = 8
TIMEOUT = 7
OUTPUT = Path("external-link-audit-output")
OUTPUT.mkdir(exist_ok=True)
SITE = "https://gmoon-code.github.io/"
USER_AGENT = "Mozilla/5.0 (compatible; MoonPortfolioLinkAudit/2.0; +https://gmoon-code.github.io/)"

class OutboundParser(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=True)
        self.page = page
        self.links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        entries = []
        if tag == "a": entries.append(("link", a.get("href")))
        if tag in ("img","iframe","video","source"):
            entries.append(("image" if tag == "img" else "embedded", a.get("src")))
            if tag == "video": entries.append(("image", a.get("poster")))
            if tag in ("img","source") and a.get("srcset"):
                for candidate in a["srcset"].split(","):
                    entries.append(("image", candidate.strip().split(" ")[0]))
        if tag == "link" and any(x in a.get("rel","").lower() for x in ("stylesheet","icon","preload")):
            entries.append(("embedded", a.get("href")))
        for kind, target in entries:
            if not target: continue
            target = target.strip()
            if target.startswith("//"):target = "https:"+target
            if not target.startswith(("https://","http://")):continue
            self.links.append((kind,target))

def source_category(url):
    p=urlsplit(url)
    host=p.netloc.lower()
    if host=="gmoon-code.github.io" and p.path.startswith(("/research-methods/","/memory-palace-u1-8/")):
        return "separate-site-application"
    if host in ("doi.org","dx.doi.org","osf.io","orcid.org"):
        return "scholarly-identifier"
    if host=="gmoon-code.github.io":
        return "own-site-absolute"
    return "external"

def status(url, method):
    request = Request(url, headers={
        "User-Agent":USER_AGENT,
        "Accept":"text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*;q=0.8",
        "Range":"bytes=0-8191",
    }, method=method)
    try:
        with urlopen(request,timeout=TIMEOUT) as response:
            return {"code":int(response.status), "finalUrl":response.url,
                    "contentType":response.headers.get("Content-Type","")}
    except HTTPError as e:
        return {"code":int(e.code), "finalUrl":e.url,
                "error":str(e.reason)[:140]}
    except (URLError,TimeoutError,OSError,ssl.SSLError,socket.timeout,ValueError) as e:
        return {"code":None,"error":str(e)[:190]}

def check(entry):
    url=entry["url"]
    head=status(url,"HEAD")
    h=head.get("code")
    if isinstance(h,int) and 200<=h<400:
        verdict="reachable"
        get=None
    else:
        get=status(url,"GET")
        g=get.get("code")
        if isinstance(g,int) and 200<=g<400:
            verdict="reachable"
        elif g in (404,410) and h in (404,410):
            verdict="confirmed-missing"
        else:
            verdict="unverified"
    observed = get or head
    warn=[]
    if url.startswith("http://"):warn.append("insecure-origin")
    if observed.get("finalUrl","").startswith("http://"):
        warn.append("redirects-to-http")
    if "image" in entry["kinds"] and verdict=="reachable":
        ct=observed.get("contentType","").lower()
        if ct and not (ct.startswith("image/") or ct.startswith("application/octet-stream")):
            warn.append("image-content-type-"+ct.split(";")[0])
    return {**entry,"category":source_category(url),"status":verdict,
            "warnings":warn,"head":head,**({"get":get} if get else {})}

def main():
    inventory=defaultdict(lambda:{"pages":set(),"kinds":set()})
    for filename in PAGES:
        file=Path(filename)
        if not file.exists():raise FileNotFoundError(filename)
        parser=OutboundParser(filename)
        parser.feed(file.read_text(encoding="utf-8"))
        for kind,url in parser.links:
            row=inventory[url]
            row["pages"].add(filename)
            row["kinds"].add(kind)
    jobs=[{"url":url,"pages":sorted(v["pages"]),"kinds":sorted(v["kinds"])}
          for url,v in inventory.items()]
    results=[]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        tasks={pool.submit(check,item):item["url"] for item in jobs}
        for future in as_completed(tasks):
            row=future.result()
            results.append(row)
            print(f"{row['status']:17s} {row['category']:24s} {row['url']}",flush=True)
    results.sort(key=lambda x:x["url"])
    summary={
      "pages_scanned":len(PAGES),"distinct_destinations":len(results),
      "counts":dict(Counter(x["status"] for x in results)),
      "by_category":{c:dict(Counter(x["status"] for x in results if x["category"]==c))
                     for c in sorted({x["category"] for x in results})},
      "issues":[{"url":x["url"],"status":x["status"],"category":x["category"],
                 "pages":x["pages"],"head":x["head"],"get":x.get("get"),"warnings":x["warnings"]}
                for x in results if x["status"]!="reachable" or x["warnings"]],
      "important_apps":[{"url":x["url"],"status":x["status"],
                        "finalUrl":(x.get("get") or x["head"]).get("finalUrl")}
                        for x in results if x["category"]=="separate-site-application"],
      "limits":"HTTP availability is not content authenticity or DOI landing-page accuracy. 403, 429, DNS, SSL, and timeout results remain unverified."
    }
    (OUTPUT/"report.json").write_text(json.dumps(results,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    (OUTPUT/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(summary,ensure_ascii=False,indent=2),flush=True)
    # A completed diagnostic run is successful even when it discovers missing URLs;
    # the findings require a separate research/editorial decision.
    return 0

if __name__=="__main__":
    raise SystemExit(main())
