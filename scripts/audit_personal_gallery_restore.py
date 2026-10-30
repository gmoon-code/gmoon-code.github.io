"""Browser and A4 QA for restored, naturally sized Interests and Pungmul photos."""
import asyncio,json,sys
from pathlib import Path
import fitz
from playwright.async_api import async_playwright

CONFIG={
 "interests":{"url":"http://127.0.0.1:8772/interests.html","out":"interests-audit-output",
   "imageSelector":"#main .pungmul-gallery img","figureSelector":"#main .pungmul-gallery figure","count":4,
   "photos":["pungmul-stage.webp","pungmul-group.webp","pungmul-solo.webp","pungmul-rehearsal.webp"]},
 "pungmul":{"url":"http://127.0.0.1:8773/pungmul.html","out":"pungmul-audit-output",
   "imageSelector":"#main :is(.pungmul-hero-photo,.pungmul-performance-grid) img",
   "figureSelector":"#main :is(.pungmul-hero-photo,.pungmul-performance-grid) figure, #main figure.pungmul-hero-photo",
   "count":4,
   "photos":["pungmul-stage.webp","pungmul-group.webp","pungmul-solo.webp","pungmul-rehearsal.webp"]},
}
WIDTHS=(320,375,480,560,620,700,768,900,1024,1140,1440)
MEASURE=r"""(args) => {
const main=document.querySelector('#main');
const imgs=[...document.querySelectorAll(args.imageSelector)];
const rect=e=>{const r=e.getBoundingClientRect();return {x:+r.x.toFixed(1),y:+(r.y+scrollY).toFixed(1),
 width:+r.width.toFixed(1),height:+r.height.toFixed(1),right:+r.right.toFixed(1)}};
const info=imgs.map(img=>{
 const s=getComputedStyle(img),f=img.closest('figure'),fs=f&&getComputedStyle(f);
 return {src:img.getAttribute('src'),alt:img.alt,complete:img.complete,naturalWidth:img.naturalWidth,
 naturalHeight:img.naturalHeight,image:rect(img),frame:f?rect(f):null,
 borderRadius:fs?.borderRadius,border:fs?.borderStyle,objectFit:s.objectFit,
 linksToFull:!!img.closest('a[href^="assets/pungmul-"]')};
});
const others=[...main.querySelectorAll('h1,h2,h3,p')].filter(e=>{
 const r=e.getBoundingClientRect(),s=getComputedStyle(e);
 return s.display!=='none' && s.visibility!=='hidden' && r.width>0&&r.height>0
}).map(rect);
const intersects=(a,b)=>a.x<b.right-.5&&a.right>b.x+.5&&a.y<b.y+b.height-.5&&a.y+a.height>b.y+.5;
const collisions=info.map((p,i)=>({i,collides:others.some(r=>intersects(p.image,r))})).filter(x=>x.collides);
return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,mainCount:document.querySelectorAll('main').length,
 h1:main.querySelectorAll('h1').length,imageCount:imgs.length,
 photos:info,collisions,editorStyles:document.querySelectorAll('[data-moon-v2-added-layer],[data-moon-v2-added-id],style[id^="moon-v2-"],style[data-moon-v2-added-style]').length,
 sectionCount:main.querySelectorAll('section').length};
}"""
async def test(browser,kind,w):
 conf=CONFIG[kind]
 page=await browser.new_page(viewport={"width":w,"height":900},reduced_motion="reduce",color_scheme="light")
 row={"width":w,"errors":[]}
 try:
  reply=await page.goto(conf["url"],wait_until="load",timeout=22000)
  await page.evaluate("document.fonts.ready")
  await page.locator(conf["imageSelector"]).evaluate_all("""els=>els.forEach(x=>x.loading='eager')""")
  await page.locator(conf["imageSelector"]).first.scroll_into_view_if_needed()
  await page.wait_for_function("""sel=>[...document.querySelectorAll(sel)].every(x=>x.complete)""",
     arg=conf["imageSelector"],timeout=18000)
  row["http"]=reply.status if reply else None
  state=await page.evaluate(MEASURE,conf)
  row["layout"]=state
  if row["http"]!=200:row["errors"].append("unexpected http")
  if state["mainCount"]!=1 or state["h1"]!=1:row["errors"].append("main/H1 structure")
  if state["documentWidth"]>w+2:row["errors"].append("document horizontal overflow")
  if state["imageCount"]!=conf["count"]:row["errors"].append("historical photo count")
  if state["editorStyles"]:row["errors"].append("old absolute-image editor layer remains")
  actual=[x["src"] for x in state["photos"]]
  if actual!=["assets/"+x for x in conf["photos"]]:row["errors"].append("original image URLs/order changed")
  if state["collisions"]:row["errors"].append("photo overlaps text")
  for p in state["photos"]:
   if not p["complete"] or p["naturalWidth"]<2:row["errors"].append("photo did not load")
   if not p["alt"]:row["errors"].append("image lacks alt")
   if not p["image"]["width"] or p["image"]["width"]>w+2:row["errors"].append("image not resized within viewport")
   if not p["frame"] or "solid" not in (p["border"] or ""):row["errors"].append("figure border missing")
   if not p["frame"] or float((p["borderRadius"] or "0").split("px")[0])<8:
    row["errors"].append("rounded photo frame missing")
  if kind=="interests" and not all(p["linksToFull"] for p in state["photos"]):
   row["errors"].append("restored full-size photo links missing")
  if kind=="pungmul" and sum(p["linksToFull"] for p in state["photos"])!=3:
   row["errors"].append("Pungmul full-size performance photo links missing")
  if w in (320,375,768,1140,1440):
   await page.screenshot(path=str(Path(conf["out"])/f"{kind}-{w}-full.png"),full_page=True,animations="disabled",timeout=15000)
  if w==375:
   await page.locator("a.skip-link").focus()
   await page.keyboard.press("Enter")
   row["skip"]=(await page.evaluate("() => document.activeElement?.id"))=="main"
   if not row["skip"]:row["errors"].append("skip link keyboard focus")
   await page.locator("#moon-appearance-choice").select_option("dark")
   row["darkTheme"]=await page.evaluate("document.documentElement.dataset.moonTheme")
   if row["darkTheme"]!="dark":row["errors"].append("dark appearance state")
  return row
 except Exception as exc:
  row["errors"].append("exception: "+str(exc)[:350])
  return row
 finally:await page.close()

async def main(kind):
 conf=CONFIG[kind]
 out=Path(conf["out"]);out.mkdir(exist_ok=True)
 results=[]
 async with async_playwright() as pw:
  browser=await pw.chromium.launch()
  for w in WIDTHS:
   r=await test(browser,kind,w)
   results.append(r)
   print(kind,w,r["errors"],flush=True)
  page=await browser.new_page(viewport={"width":900,"height":1100},color_scheme="light")
  try:
   await page.goto(conf["url"],wait_until="load",timeout=22000)
   await page.evaluate("document.fonts.ready")
   pdf=await page.pdf(format="A4",print_background=True)
   (out/f"{kind}-restored-print.pdf").write_bytes(pdf)
   doc=fitz.open(stream=pdf,filetype="pdf")
   printable={"pages":len(doc),"imageCounts":[len(pg.get_images(full=True)) for pg in doc],
     "missingHeads":[],
     "textLength":[len(pg.get_text().strip()) for pg in doc]}
   # Embedded raster photos must appear somewhere in print.
   if sum(printable["imageCounts"])<4:
    printable["missingHeads"].append("Restored photo gallery missing in printed A4")
   doc.close()
  except Exception as exc:
   printable={"errors":["print failed: "+str(exc)[:250]]}
  finally:await page.close()
  await browser.close()
 failures=[{"width":r["width"],"errors":r["errors"]} for r in results if r["errors"]]
 if printable.get("errors") or printable.get("missingHeads"):failures.append({"print":printable})
 summary={"page":kind,"widths":list(WIDTHS),"cases":len(results),"imageCount":conf["count"],
   "failures":failures,"print":printable}
 (out/"report.json").write_text(json.dumps({"summary":summary,"cases":results},ensure_ascii=False,indent=2)+"\n")
 print(json.dumps(summary,indent=2,ensure_ascii=False),flush=True)
 return 1 if failures else 0

if __name__=="__main__":
 if len(sys.argv)!=2 or sys.argv[1] not in CONFIG:raise SystemExit("use interests or pungmul")
 raise SystemExit(asyncio.run(main(sys.argv[1])))
