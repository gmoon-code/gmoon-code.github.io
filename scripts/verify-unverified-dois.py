#!/usr/bin/env python3
"""Supplement Stage S2 with authoritative DOI registration evidence.

A publisher 403 is not a missing DOI. Query Crossref and, where necessary,
DataCite only for DOI links whose publisher landing was not accessible.
This does not claim to have read the article or checked citation-title identity.
"""
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen
import json, socket

OUT=Path("external-link-audit-output")
USER_AGENT="MoonAcademicWebsiteAudit/1.0 (https://gmoon-code.github.io/)"
TIMEOUT=9
MAX_WORKERS=4

def retrieve_json(url):
    req=Request(url,headers={"User-Agent":USER_AGENT,
                             "Accept":"application/json"},method="GET")
    try:
        with urlopen(req,timeout=TIMEOUT) as res:
            return int(res.status),json.loads(res.read(300000).decode("utf-8"))
    except HTTPError as e:
        return int(e.code),None
    except (URLError,TimeoutError,OSError,ValueError,UnicodeError,json.JSONDecodeError,socket.timeout) as e:
        return None,{"error":str(e)[:160]}

def registry_check(row):
    original=row["url"]
    doi=unquote(urlsplit(original).path.lstrip("/"))
    item={"url":original,"doi":doi,"pages":row["pages"],
          "publisherLanding":(row.get("get") or row["head"]).get("finalUrl"),
          "publisherResult":(row.get("get") or row["head"]).get("code"),
          "registry":"not-confirmed"}
    if not doi.startswith("10.") or "/" not in doi:
        item["registry"]="malformed-doi"
        return item
    encoded=quote(doi,safe="/")
    code,data=retrieve_json("https://api.crossref.org/works/"+encoded)
    item["crossrefStatus"]=code
    if code==200 and isinstance(data,dict):
        meta=data.get("message",{})
        if str(meta.get("DOI","")).casefold()==doi.casefold():
            item.update(registry="registered",registrySource="Crossref",
              registeredTitle=(meta.get("title") or [""])[0],
              publisher=meta.get("publisher"),
              year=((meta.get("published") or meta.get("issued") or {}).get("date-parts") or [[None]])[0][0])
            return item
    code,data=retrieve_json("https://api.datacite.org/dois/"+encoded)
    item["dataciteStatus"]=code
    if code==200 and isinstance(data,dict):
        meta=((data.get("data") or {}).get("attributes") or {})
        if str(meta.get("doi","")).casefold()==doi.casefold():
            titles=meta.get("titles") or []
            item.update(registry="registered",registrySource="DataCite",
               registeredTitle=titles[0].get("title") if titles else None,
               publisher=meta.get("publisher"),
               year=meta.get("publicationYear"))
    if item["registry"]!="registered":
        # OpenAlex is an independent scholarly index, not an authoritative DOI registry.
        # A match can corroborate the link when Crossref rate-limits this runner.
        code,data=retrieve_json("https://api.openalex.org/works/https://doi.org/"+encoded)
        item["openalexStatus"]=code
        if code==200 and isinstance(data,dict):
            indexed=unquote(urlsplit(str(data.get("doi") or "")).path.lstrip("/"))
            if indexed.casefold()==doi.casefold():
                item.update(secondaryIndex="OpenAlex",
                    indexedTitle=data.get("display_name"),
                    indexedYear=data.get("publication_year"))
    return item

def main():
    f=OUT/"report.json"
    report=json.loads(f.read_text(encoding="utf-8"))
    pending=[x for x in report if x["status"]=="unverified"
             and urlsplit(x["url"]).hostname in ("doi.org","dx.doi.org")]
    results=[]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures={pool.submit(registry_check,x):x["url"] for x in pending}
        for future in as_completed(futures):
            x=future.result()
            results.append(x)
            print(x["registry"],x["doi"],x.get("registrySource",""),flush=True)
    results.sort(key=lambda x:x["doi"])
    counts=dict(Counter(x["registry"] for x in results))
    data={"checked":len(results),"counts":counts,
          "records":results,
          "scope":"Registration of DOI identifiers blocked at publisher landing, not paper-content verification."}
    (OUT/"doi-registration.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
    summarypath=OUT/"summary.json"
    summary=json.loads(summarypath.read_text(encoding="utf-8"))
    summary["doi_registry"]={"checked":len(results),"counts":counts,
        "secondary_index_matches":sum(bool(x.get("secondaryIndex")) for x in results),
        "not_confirmed":[x for x in results if x["registry"]!="registered"],
        "unresolved":[x for x in results if x["registry"]!="registered" and not x.get("secondaryIndex")],
        "limitation":"Crossref/DataCite registration is distinct from publisher access, correct article metadata or article availability. OpenAlex is independent secondary corroboration, not registration proof."}
    summarypath.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps({"checked":len(results),"counts":counts,
      "not_confirmed":summary["doi_registry"]["not_confirmed"]},ensure_ascii=False,indent=2))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
