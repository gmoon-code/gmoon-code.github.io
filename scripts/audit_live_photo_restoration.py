#!/usr/bin/env python3
"""Verify the published restored galleries match exact repository source."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import quote
import hashlib,json,time
from urllib.error import HTTPError,URLError
OUT=Path("photo-restore-live-check")
OUT.mkdir(exist_ok=True)
PAGES=["interests.html","pungmul.html"]
FILES=PAGES+["pungmul.css"]+["assets/"+p for p in (
"pungmul-stage.webp","pungmul-group.webp","pungmul-solo.webp","pungmul-rehearsal.webp")]
def digest(b):return hashlib.sha256(b).hexdigest()
def one(path):
 original=Path(path).read_bytes()
 checks=[]
 for attempt in range(6):
  suffix="?gallery-restoration-check=20261030-"+str(attempt)
  url="https://gmoon-code.github.io/"+quote(path,safe="/")+suffix
  try:
   req=Request(url,headers={"Cache-Control":"no-cache","Pragma":"no-cache","User-Agent":"gmoon-photo-restore-verification/1.0"})
   with urlopen(req,timeout=15) as r:
    content=r.read()
    result={"status":r.status,"bytes":len(content),
            "match":r.status==200 and content==original}
  except Exception as e:
   result={"error":str(e)[:180],"match":False}
  checks.append(result)
  if result["match"]:break
  time.sleep(3)
 return {"path":path,"expectedBytes":len(original),"expectedSha":digest(original),
         "attempts":checks,"verified":bool(checks[-1]["match"]),
         "publicSha":digest(content) if "content" in locals() else None}
def main():
 result=[one(p) for p in FILES]
 # Confirm source contains the restored real gallery and no editor layers.
 for p in PAGES:
  s=Path(p).read_text()
  row=next(x for x in result if x["path"]==p)
  refs=[f'assets/{name}' for name in (
  "pungmul-stage.webp","pungmul-group.webp","pungmul-solo.webp","pungmul-rehearsal.webp")]
  row["sourceGallery"]={name:s.count(f'src="{name}"') for name in refs}
  row["noEditorImages"]=not any(q in s for q in ("data-moon-v2-added-id","data-moon-v2-added-layer"))
  if any(n!=1 for n in row["sourceGallery"].values()) or not row["noEditorImages"]:
   row["verified"]=False
 summary={"files":len(FILES),"matched":sum(x["verified"] for x in result),
 "failed":[x for x in result if not x["verified"]],
 "note":"Bounded HTTP byte comparison of actual published source; separate Chromium image/rounded-corner tests live in page-specific visitor workflows."}
 (OUT/"report.json").write_text(json.dumps({"summary":summary,"files":result},indent=2,ensure_ascii=False)+"\n")
 print(json.dumps(summary,indent=2,ensure_ascii=False),flush=True)
 return 0 if not summary["failed"] else 1
if __name__=="__main__":raise SystemExit(main())
