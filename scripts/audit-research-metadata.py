#!/usr/bin/env python3
"""S3 scholarly reference identity and OSF preprint metadata audit.

No automatic editing. Registry/index metadata and publication-year differences
can be ambiguous; only independently confirmed discrepancies merit page edits.
"""
import json,re,time,unicodedata,difflib,random
from collections import defaultdict, Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote,unquote,urlsplit
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from bs4 import BeautifulSoup

OUTPUT=Path("research-metadata-audit-output")
OUTPUT.mkdir(exist_ok=True)
DOI_RE=re.compile(r"10\.\d{4,9}/[^\s<>\"]+",re.I)
PAGES=["research.html","research-scoping.html","writing-biological-classification.html",
       "teaching-ap-biology.html","teaching-ap-chemistry.html","teaching-ap-evolution.html",
       "teaching.html","research-action.html","cv.html"]
PREPRINT="10.35542/osf.io/kznvj_v1"
UA="AcademicWebsiteScholarlyMetadataReview/1.0 (https://gmoon-code.github.io/)"
def request(url,timeout=8):
    req=Request(url,headers={"User-Agent":UA,"Accept":"application/json"})
    try:
        with urlopen(req,timeout=timeout) as x:
            return {"code":x.status,"data":json.loads(x.read(1000000).decode())}
    except HTTPError as e:return {"code":e.code,"error":str(e)[:180]}
    except (URLError,OSError,TimeoutError,ValueError,json.JSONDecodeError) as e:
        return {"code":None,"error":str(e)[:180]}
def normalize(s):
    s=unicodedata.normalize("NFKD",s or "").lower()
    s="".join(c for c in s if not unicodedata.combining(c))
    s=re.sub(r"[^a-z0-9]+"," ",s)
    return re.sub(r"\s+"," ",s).strip()
def word_match(title,reference):
    words=[x for x in normalize(title).split() if len(x)>2 and x not in {"the","and","for","with","from","through","toward","into","over","are","why","how"}]
    refset=set(normalize(reference).split())
    return round(sum(x in refset for x in words)/max(len(words),1),3)
def inventory():
    found=defaultdict(list)
    statuses={}
    for page in PAGES:
        soup=BeautifulSoup(Path(page).read_text(encoding="utf-8"),"html.parser")
        statuses[page]={"preprint_link":PREPRINT in str(soup),
            "unpublished_manuscript":bool(re.search(r"unpublished manuscript",soup.get_text(" ",strip=True),re.I)),
            "expected_degree":bool(re.search(r"expected nov 2026",soup.get_text(" ",strip=True),re.I)),
            "research_section_count":len(soup.find_all("section"))}
        for a in soup.find_all("a",href=True):
            href=a["href"]
            if not ("doi.org/" in href or "osf.io/" in href):continue
            doi=unquote(urlsplit(href).path.lstrip("/"))
            if not doi.startswith("10."):continue
            citation=a.find_parent("li")
            if citation is None:
                citation=a.find_parent("p")
            text=citation.get_text(" ",strip=True) if citation else a.get_text(" ",strip=True)
            text=text.replace(href," ").strip()
            text=re.sub(r"https?://(?:dx\.)?doi\.org/\S+"," ",text)
            year=re.search(r"\((19\d{2}|20\d{2})[a-z]?\)",text)
            found[doi].append({"page":page,"element_id":citation.get("id") if citation else None,
                "year":int(year.group(1)) if year else None,"reference":text[:1100],
                "href":href})
    return found,statuses
def openalex_metadata(doi):
    encoded=quote(doi,safe="/")
    result=request("https://api.openalex.org/works/https://doi.org/"+encoded)
    if result.get("code")==200:
        d=result["data"]
        indexed=unquote(urlsplit(d.get("doi") or "").path.lstrip("/"))
        if indexed.lower()==doi.lower():
            return {"source":"OpenAlex","title":d.get("display_name"),
                    "year":d.get("publication_year"),"type":d.get("type"),
                    "authors":[a.get("author",{}).get("display_name") for a in d.get("authorships",[])],
                    "venue":((d.get("primary_location") or {}).get("source") or {}).get("display_name"),
                    "id":d.get("id"),"http":200}
    return {"source":"OpenAlex","http":result.get("code"),"error":result.get("error")}
def datacite_preprint():
    encoded=quote(PREPRINT,safe="/")
    r=request("https://api.datacite.org/dois/"+encoded,timeout=13)
    record={"doi":PREPRINT,"http":r.get("code"),"error":r.get("error")}
    if r.get("code")==200:
        a=(r["data"].get("data") or {}).get("attributes") or {}
        record.update({"registry":"DataCite","doi_reg":a.get("doi"),
            "state":a.get("state"),"created":a.get("created"),"registered":a.get("registered"),
            "publicationYear":a.get("publicationYear"),"publisher":a.get("publisher"),
            "titles":[t.get("title") for t in a.get("titles",[])],
            "creators":[{"name":c.get("name"),"givenName":c.get("givenName"),"familyName":c.get("familyName")} for c in a.get("creators",[])],
            "url":a.get("url"),"types":a.get("types"),"dates":a.get("dates"),
            "relatedIdentifiers":a.get("relatedIdentifiers"),"version":a.get("version"),
            "descriptions":[d.get("description")[:300] for d in a.get("descriptions",[]) if d.get("description")]})
    return record
def main():
    refs,statuses=inventory()
    preprint=datacite_preprint()
    doilist=[d for d in refs if d!=PREPRINT]
    results={}
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures={ex.submit(openalex_metadata,doi):doi for doi in doilist}
        for f in as_completed(futures):
            doi=futures[f];results[doi]=f.result()
            print("METADATA",doi,results[doi].get("http"),flush=True)
    checks=[];manual=[];passed=[]
    for doi,uses in refs.items():
        if doi==PREPRINT:continue
        metadata=results[doi]
        for use in uses:
            title=metadata.get("title")
            match=word_match(title,use["reference"]) if title and use.get("element_id") else None
            stated=use["year"]; actual=metadata.get("year")
            year_difference=abs(stated-actual) if stated and actual else None
            outcome="unverified"
            if title and match is not None:
                if match<.68 or (year_difference is not None and year_difference>1):
                    outcome="review"
                else:outcome="consistent"
            item={**use,"doi":doi,"indexTitle":title,"indexYear":actual,
                  "indexAuthors":metadata.get("authors"),"indexVenue":metadata.get("venue"),
                  "titleWordMatch":match,"yearDifference":year_difference,
                  "metadataHttp":metadata.get("http"),"outcome":outcome}
            checks.append(item)
            if outcome=="review":manual.append(item)
            if outcome=="consistent":passed.append(item)
    # Compare the preprint's publicly stated title against registry metadata.
    pretitle=(preprint.get("titles") or [""])[0] if preprint.get("titles") else ""
    own_mentions=[{"page":u["page"],"titleMatch":word_match(pretitle,u["reference"]) if pretitle else None,
                   "excerpt":u["reference"][:320]} for u in refs.get(PREPRINT,[])]
    ppflag=preprint.get("http")!=200 or not pretitle or any(x["titleMatch"] is not None and x["titleMatch"]<.7 for x in own_mentions)
    summary={
      "preprint":preprint,"preprintReferences":own_mentions,"preprintReview":ppflag,
      "doiUnique":len(doilist),"citationOccurrences":len(checks),
      "counts":dict(Counter(x["outcome"] for x in checks)),
      "manualReview":manual,
      "unverified":[x for x in checks if x["outcome"]=="unverified"],
      "statusInventory":statuses,
      "qualifications":"OpenAlex bibliographic metadata may be incomplete or differ from final print publication dates. Year differences <=1 are not automatically errors. Title-word overlap is a triage heuristic, not proof of citation correctness. The author, volume and page fields need human inspection when inconsistencies arise."
    }
    (OUTPUT/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (OUTPUT/"records.json").write_text(json.dumps({"uses":refs,"metadata":results,"checks":checks},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"preprint":preprint,"preprintReview":ppflag,"mentions":own_mentions,"counts":summary["counts"],"manualReview":manual},ensure_ascii=False,indent=2),flush=True)
    # Diagnoses do not alter the published text; do not error on publisher/index disagreements.
    return 0
if __name__=="__main__":raise SystemExit(main())
