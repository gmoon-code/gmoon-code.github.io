"""Stage S1: exhaustive static internal-link graph and public metadata.
Does not modify page content or claim external URL uptime.
"""
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re
PAGES = [
"404.html","about.html","contact.html","cv.html","index.html","interests.html",
"projects.html","pungmul.html","research-action.html","research-methods-studio.html",
"research-scoping.html","research.html","story-method.html","teaching-ap-biology.html",
"teaching-ap-chemistry.html","teaching-ap-evolution.html","teaching-osmosis-practice.html",
"teaching.html","writing-biological-classification.html"]
SITE="https://gmoon-code.github.io"
OUT=Path("public-linkgraph-output")
OUT.mkdir(exist_ok=True)
NAV=["index.html","research.html","projects.html","teaching.html","interests.html","contact.html","cv.html"]
SECTION={
 "index.html":"index.html","research.html":"research.html","research-action.html":"research.html",
 "research-scoping.html":"research.html","writing-biological-classification.html":"research.html",
 "projects.html":"projects.html","story-method.html":"projects.html",
 "research-methods-studio.html":"projects.html","teaching.html":"teaching.html",
 "teaching-ap-biology.html":"teaching.html","teaching-ap-chemistry.html":"teaching.html",
 "teaching-ap-evolution.html":"teaching.html","teaching-osmosis-practice.html":"teaching.html",
 "interests.html":"interests.html","pungmul.html":"interests.html",
 "contact.html":"contact.html","cv.html":"cv.html",
}
DATA={name:BeautifulSoup(Path(name).read_text(encoding="utf-8"),"html.parser") for name in PAGES}
problems=[]; advisory=[]; links=[]; resources=[]; pages=[]
def issue(page,kind,detail,advisory_only=False):
    (advisory if advisory_only else problems).append({"page":page,"kind":kind,"detail":str(detail)[:380]})
def local_target(href, origin):
    if not href or href.startswith(("mailto:","tel:","data:","javascript:","blob:")):return None
    p=urlsplit(href)
    if p.netloc and p.netloc not in ("gmoon-code.github.io","www.gmoon-code.github.io"):return None
    if p.scheme and p.scheme not in ("http","https"):return None
    if p.netloc in ("gmoon-code.github.io","www.gmoon-code.github.io") and p.path.startswith(("/research-methods/","/memory-palace-u1-8/")):
        return None  # Independently deployed GitHub Pages projects, not files in this repository.
    if not p.path:path=origin
    elif p.path.startswith("/"):path=unquote(p.path.lstrip("/"))
    else:path=str((Path(origin).parent / unquote(p.path)).as_posix())
    if not path or path.endswith("/"):path=path+"index.html"
    path=Path(path)
    if ".." in path.parts: return ("unsafe traversal",p.fragment)
    return (path.as_posix(),unquote(p.fragment))
for page,soup in DATA.items():
    title=soup.title.get_text(" ",strip=True) if soup.title else ""
    canonical=soup.select('link[rel="canonical"]')
    descriptions=soup.select('meta[name="description"]')
    mains=soup.find_all("main")
    h1=soup.find_all("h1")
    ids=[t["id"] for t in soup.select("[id]")]
    idset=set(ids)
    if len(mains)!=1: issue(page,"main count",len(mains))
    if len(h1)!=1: issue(page,"h1 count",len(h1))
    if len(ids)!=len(idset):issue(page,"duplicate IDs",[x for x in set(ids) if ids.count(x)>1])
    if not title:issue(page,"missing title",title)
    if page not in ("about.html","404.html"):
        if page=="teaching-osmosis-practice.html":
            if not soup.select_one('meta[name="robots"][content*="noindex"]'):
                issue(page,"private worksheet index protection","expected noindex")
        else:
            expected=SITE+("/" if page=="index.html" else "/"+page)
            if len(canonical)!=1 or canonical[0].get("href")!=expected:
                issue(page,"canonical",[(x.get("href")) for x in canonical])
        if len(descriptions)!=1 or not descriptions[0].get("content","").strip():
            issue(page,"description",len(descriptions))
    if page=="about.html":
        if len(canonical)!=1 or canonical[0].get("href")!=SITE+"/contact.html":
            issue(page,"legacy canonical",str(canonical))
        if not soup.select_one('meta[http-equiv="refresh"]'):issue(page,"legacy refresh","missing")
        if not soup.select_one('meta[name="robots"][content*="noindex"]'):issue(page,"legacy noindex","missing")
    if page=="404.html" and not soup.select_one('meta[name="robots"][content*="noindex"]'):
        issue(page,"404 robots","missing")
    nav=soup.select_one("nav.site-nav")
    navtargets=[]
    if page!="about.html":
        if not nav:issue(page,"missing primary nav","")
        else:
            for a in nav.find_all("a",href=True):
                ref=local_target(a["href"],page)
                navtargets.append(ref[0] if ref else a["href"])
            if navtargets!=NAV:issue(page,"navigation order",navtargets)
            currents=[a.get("href") for a in nav.select('[aria-current="page"]')]
            expect=SECTION.get(page)
            if expect:
                actual=[local_target(h,page)[0] for h in currents if local_target(h,page)]
                if actual!=[expect]:issue(page,"active nav",actual)
            elif currents:issue(page,"404 current navigation",currents)
    for a in soup.find_all("a"):
        href=a.get("href")
        if not href:issue(page,"empty/unlinked anchor",str(a)[:180]);continue
        name=(a.get("aria-label") or a.get_text(" ",strip=True) or
              " ".join(x.get("alt","") for x in a.find_all("img"))).strip()
        if not name:issue(page,"unnamed link",href)
        if a.get("target")=="_blank":
            rel=" ".join(a.get("rel",[]))
            if "noopener" not in rel:issue(page,"new-tab rel",href,True)
        ref=local_target(href,page)
        if ref is None:
            links.append({"source":page,"href":href,"kind":"external-or-special"})
            continue
        target,frag=ref
        valid=Path(target).is_file()
        if not valid:issue(page,"missing local target",f"{href} resolved to {target}")
        elif frag:
            destination=DATA.get(target)
            if destination is None:
                destination=BeautifulSoup(Path(target).read_text(encoding="utf-8"),"html.parser")
            if frag not in {t.get("id") for t in destination.select("[id]")}:
                issue(page,"broken fragment",f"{href} missing #{frag} on {target}")
        links.append({"source":page,"href":href,"resolved":target,"fragment":frag,"exists":valid})
    for tag,attr in (("link","href"),("script","src"),("img","src"),("video","poster"),("source","src")):
        for elem in soup.find_all(tag):
            val=elem.get(attr)
            if not val:continue
            if tag=="link" and not (elem.get("rel") and any(x in elem.get("rel",[]) for x in ("stylesheet","icon","manifest","preload"))):continue
            ref=local_target(val,page)
            if ref is None:continue
            target,_=ref
            if not Path(target).is_file():issue(page,"missing local asset",f"{tag} {val} → {target}")
            resources.append({"page":page,"kind":tag,"src":val,"resolved":target,"exists":Path(target).is_file()})
    for im in soup.find_all("img"):
        if not im.has_attr("alt"):issue(page,"image without alt",im.get("src","")[:130])
        elif not im["alt"].strip() and im.get("role")!="presentation" and im.get("aria-hidden")!="true":
            issue(page,"decorative image requires visual review",im.get("src","")[:130],True)
    pages.append({"name":page,"title":title,"h1":h1[0].get_text(" ",strip=True) if h1 else None,
                  "description":descriptions[0].get("content") if descriptions else None,
                  "canonical":canonical[0].get("href") if canonical else None,
                  "nav":navtargets,"ids":len(ids),"images":len(soup.find_all("img")),
                  "links":len(soup.find_all("a"))})
report={"pages":pages,"linkCount":len(links),"assetReferences":len(resources),
 "externalOrSpecialCount":sum(x.get("kind")=="external-or-special" for x in links),
 "internalLinks":sum(x.get("exists",False) for x in links),
 "problems":problems,"advisory":advisory}
(OUT/"report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n")
print(json.dumps({"pageCount":len(pages),"linkCount":len(links),"assetReferences":len(resources),
 "problems":problems,"advisory":advisory},indent=2,ensure_ascii=False))
raise SystemExit(bool(problems))
