#!/usr/bin/env python3
"""S8 final public-source/deployed-site reconciliation.

Checks exact byte identity for 19 public HTML routes and 5 shared public
assets. Result must not be called a passing deployment audit if public HTTP
requests fail or content differs. Browser and scholarly check outcomes are
cross-checked against their recorded GitHub Actions source SHA, without
mistaking documentation-only commits for production changes.
"""
import difflib, hashlib, json, os, pathlib, subprocess, time, urllib.error, urllib.parse, urllib.request
ROOT=pathlib.Path(".")
OUT=pathlib.Path("s8-release-output")
OUT.mkdir(exist_ok=True)
HTML=["index.html","research.html","research-action.html","research-scoping.html",
"writing-biological-classification.html","projects.html","story-method.html",
"research-methods-studio.html","teaching.html","teaching-ap-biology.html",
"teaching-ap-chemistry.html","teaching-ap-evolution.html","teaching-osmosis-practice.html",
"interests.html","pungmul.html","contact.html","cv.html","404.html","about.html"]
ASSETS=["styles-20261013.css","site-theme.css","appearance.css","appearance.js","site-previews.js"]
URL="https://gmoon-code.github.io/"
SOURCE=HTML+ASSETS
HEAD=subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
REPORTS={
  "links":("docs/PUBLIC_LINKGRAPH_LATEST_RESULTS.json",["problems"]),
  "external":("docs/EXTERNAL_RESOURCES_LATEST_RESULTS.json",["issues"]),
  "metadata":("docs/RESEARCH_METADATA_LATEST_RESULTS.json",["unverified"]),
  "reflow":("docs/ACCESSIBILITY_REFLOW_LATEST_RESULTS.json",["failures"]),
  "engines":("docs/PUBLIC_BROWSER_ENGINES_LATEST_RESULTS.json",["failures"]),
  "typography":("docs/PUBLIC_TYPOGRAPHY_LATEST_RESULTS.json",["failures","combinedStressFailures"]),
  "interactions":("docs/PUBLIC_INTERACTIONS_LATEST_RESULTS.json",["failures","axeViolations"]),
}
def sha(x):return hashlib.sha256(x).hexdigest()
def git(*parts):
 return subprocess.check_output(["git",*parts],text=True).strip()
def fetch(path,expected):
    # GitHub Pages can temporarily serve an outdated cached object after CI.
    # Two independent no-cache query keys minimize accidental CDN cache hits.
    attempts=[];comparison=None
    for trial in range(2):
        url=urllib.parse.urljoin(URL,path)+f"?s8audit={HEAD[:12]}-{trial}"
        req=urllib.request.Request(url,headers={"User-Agent":"MoonAcademic-S8-ReleaseAudit/1.0",
              "Cache-Control":"no-cache","Pragma":"no-cache","Accept":"text/html,*/*;q=0.8"})
        try:
            with urllib.request.urlopen(req,timeout=20) as resp:
                response=resp.read(6_000_000)
                status=resp.status
                final=resp.url
                ct=resp.headers.get("Content-Type","")
        except urllib.error.HTTPError as exc:
            response=exc.read(100000)
            status=exc.code;final=exc.url;ct=exc.headers.get("Content-Type","")
        except Exception as exc:
            attempts.append({"error":str(exc)[:240]})
            continue
        comparison={"path":path,"expectedStatus":200,"actualStatus":status,"url":final,
              "contentType":ct,"sourceLength":len(expected),"liveLength":len(response),
              "sourceSha256":sha(expected),"liveSha256":sha(response),
              "identical":expected==response}
        attempts.append({"status":status,"length":len(response),"identical":expected==response,
                         "contentType":ct,"sha256":sha(response)})
        if comparison["identical"] and status==200:
            break
    if comparison is None:return {"path":path,"errors":["both remote requests failed"],"attempts":attempts}
    comparison["attempts"]=attempts
    comparison["errors"]=[]
    if comparison["actualStatus"]!=200:comparison["errors"].append("unexpected remote HTTP status")
    if not comparison["identical"]:
        comparison["errors"].append("deployed bytes differ from checked-out production source")
        if path.endswith(".html") or path.endswith(".css") or path.endswith(".js"):
            a=expected.decode("utf-8","replace").splitlines()
            b=response.decode("utf-8","replace").splitlines()
            comparison["firstDiff"]=list(difflib.unified_diff(a,b,fromfile="source",tofile="deployed",n=1))[:16]
    return comparison

def recorded():
    result={}
    for category,(path,problem_fields) in REPORTS.items():
        doc=json.loads((ROOT/path).read_text())
        src=doc.get("head_sha")
        changes=git("diff","--name-only",src,HEAD,"--",*SOURCE).splitlines() if src else []
        r={"report":path,"run":doc.get("workflow_run_id"),"head_sha":src,"exit":doc.get("exit_code",doc.get("audit_exit_code")),
          "sourceModifiedSinceAudit":changes,
          "failureCounts":{k:len(doc.get(k,[])) if isinstance(doc.get(k),list) else None for k in problem_fields}}
        if category=="external":
            r["counts"]=doc.get("counts")
            # A blocked DOI publisher or HTTP 403 is not proof a link is broken.
        if category=="metadata":
            r["counts"]=doc.get("counts")
            r["uniqueDoi"]=doc.get("unique_dois")
        result[category]=r
    # Legacy utility file contains a superseded failed initial CI run.
    legacy=json.loads((ROOT/"docs/UTILITY_ROUTES_LATEST_RESULTS.json").read_text())
    result["utility"]={"legacyMachineRun":legacy.get("workflow_run_id"),
                        "legacyExit":legacy.get("exit_code"),
                        "supersededSuccessfulRun":40825886279,
                        "note":"U1 route audit documents successful run 40825886279; legacy utility machine report refers to an early missing-script failure. Do not treat it as latest successful evidence."}
    return result

def main():
    pages=[fetch(p,(ROOT/p).read_bytes()) for p in SOURCE]
    # A missing nested route must deliver a 404, with the published custom
    # 404 page's substantive copy, not a generic server 200.
    deep=URL+"missing/s8-release-reconciliation-"+HEAD[:12]
    try:
        req=urllib.request.Request(deep,headers={"User-Agent":"MoonAcademic-S8-ReleaseAudit/1.0"})
        try:
            with urllib.request.urlopen(req,timeout=20) as r:
                status=r.status;content=r.read(2000000)
        except urllib.error.HTTPError as e:
            status=e.code;content=e.read(2000000)
        custom=(b"Page not found" in content and b"Return home" in content)
        missing={"url":deep,"status":status,"custom404":custom,"errors":[]}
        if status!=404:missing["errors"].append("deep missing path did not respond with HTTP 404")
        if not custom:missing["errors"].append("deep missing path lacked custom 404 wording")
    except Exception as e:
        missing={"url":deep,"errors":["live nested 404 probe failed: "+str(e)[:200]]}
    rec=recorded()
    errors=[{"path":p["path"],"errors":p["errors"],"firstDiff":p.get("firstDiff")} for p in pages if p["errors"]]
    if missing["errors"]:errors.append(missing)
    stale=[{"category":name,"sourceModifiedSinceAudit":r["sourceModifiedSinceAudit"]} for name,r in rec.items() if
           isinstance(r,dict) and r.get("sourceModifiedSinceAudit")]
    critical=["links","metadata","reflow","engines","typography","interactions"]
    badAudit=[x for x in critical if str(rec[x].get("exit"))!="0" or
              (x in ("reflow","engines","typography","interactions") and any(v for v in rec[x]["failureCounts"].values()))]
    if stale:errors.append({"sourceDrift":stale})
    if badAudit:errors.append({"unresolvedAudits":badAudit})
    # The external resource checker is deliberately a triage, not a
    # certainty that all 113 public external destinations can be opened.
    summary={"sourceHead":HEAD,"htmlRoutes":len(HTML),"sharedAssets":len(ASSETS),
        "deployedChecks":len(pages),"verifiedExactMatches":sum(p.get("identical",False) and p.get("actualStatus")==200 for p in pages),
        "httpErrors":len([p for p in pages if p["errors"]]),
        "customNested404":missing,"auditEvidence":rec,
        "sourceDriftSinceAudits":stale,
        "pass":not errors,"errors":errors,
        "limitations":"Checks public HTTP bytes at one point in time; future CDN updates are not guaranteed. External blocked sites are inconclusive. This does not replace physical mobile, native zoom, screen-reader speech or independent hosted-app audits."}
    (OUT/"source-deployment-detail.json").write_text(json.dumps(pages,indent=2,ensure_ascii=False)+"\n")
    (OUT/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps(summary,indent=2,ensure_ascii=False),flush=True)
    return 0 if not errors else 1
if __name__=="__main__":raise SystemExit(main())
