#!/usr/bin/env python3
"""S6 public reading resilience under user-injected typography preferences.

The WCAG 1.4.12 values are 1.5 line-height, 2em paragraph spacing,
0.12em letter spacing and 0.16em word spacing. A 200% text-only simulation
doubles computed text font sizes, leaving container sizes unchanged.
Neither injection reproduces browser native text-only zoom perfectly.
"""
import asyncio, json
from collections import Counter
from pathlib import Path
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8765"
OUT=Path("s6-typography-output")
PAGES=("index.html","research.html","research-action.html","research-scoping.html",
"writing-biological-classification.html","projects.html","story-method.html",
"research-methods-studio.html","teaching.html","teaching-ap-biology.html",
"teaching-ap-chemistry.html","teaching-ap-evolution.html","teaching-osmosis-practice.html",
"interests.html","pungmul.html","contact.html","cv.html","404.html")
FIREFOX_SAMPLE=("index.html","research.html","teaching-ap-biology.html","interests.html","cv.html")
MODES=("spacing","text200")
SPACING_STYLE="""
html body :is(h1,h2,h3,h4,h5,h6,p,li,a,span,small,label,button,figcaption,
summary,blockquote,td,th,dt,dd,strong,em,div,section,article,nav,main,footer,header) {
  line-height:1.5 !important;
  letter-spacing:0.12em !important;
  word-spacing:0.16em !important;
}
html body p {margin-bottom:2em !important}
"""
TEXT_RESIZE=r"""() => {
 const tags=new Set(['H1','H2','H3','H4','H5','H6','P','LI','A','SPAN','SMALL','LABEL',
 'BUTTON','FIGCAPTION','SUMMARY','BLOCKQUOTE','TD','TH','DT','DD','STRONG','EM',
 'TIME','CODE','PRE','INPUT','TEXTAREA','SELECT']);
 const nodes=[...document.querySelectorAll('body *')].filter(e=>tags.has(e.tagName));
 const sizes=nodes.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
 let changed=0;
 for(const [el,size] of sizes){
  if(Number.isFinite(size)&&size>0){
   el.style.setProperty('font-size',(size*2).toFixed(3)+'px','important');
   changed++;
  }
 }
 return {changed,total:nodes.length};
}"""
METRICS=r"""() => {
 const m=document.querySelector('main'),root=document.documentElement,w=innerWidth;
 const texts=[...(m?.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,span,small,label,button,figcaption,summary,blockquote,td,th,dt,dd,strong,em,code,pre')||[])];
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);
   return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const scrollContainer=e=>{for(let p=e.parentElement;p&&p!==m;p=p.parentElement){
  const s=getComputedStyle(p);
  if(/(auto|scroll)/.test(s.overflowX)&&p.scrollWidth>p.clientWidth+2)return true;
  if(p.hasAttribute('data-moon-free-placeholder'))return true;
 }return false};
 const desc=e=>{const r=e.getBoundingClientRect();return {
   tag:e.tagName,css:(typeof e.className==='string'?e.className:'').slice(0,90),
   sample:e.textContent.trim().slice(0,115),
   x:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),
   scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,
   scrollHeight:e.scrollHeight,clientHeight:e.clientHeight
 }};
 const rendered=texts.filter(visible).filter(e=>!e.closest('.new-tab-note'));
 const outside=rendered.filter(e=>!scrollContainer(e)).filter(e=>{
   const r=e.getBoundingClientRect();
   return r.left< -3||r.right>w+3;
 }).slice(0,14).map(desc);
 const clipped=rendered.filter(e=>{
   const s=getComputedStyle(e);
   return (/(hidden|clip)/.test(s.overflowX)&&e.scrollWidth>e.clientWidth+3)||
      (/(hidden|clip)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+3);
 }).slice(0,14).map(desc);
 // Text may overflow a parent with overflow:hidden even if the child has
 // no clipping of its own. Check actual text-element ancestors as well.
 const parentClips=rendered.filter(e=>{
   const r=e.getBoundingClientRect();
   for(let p=e.parentElement;p&&p!==m;p=p.parentElement){
     const s=getComputedStyle(p),q=p.getBoundingClientRect();
     if((/(hidden|clip)/.test(s.overflowX)&&r.right>q.right+4)||
        (/(hidden|clip)/.test(s.overflowY)&&r.bottom>q.bottom+4))return true;
   }
   return false;
 }).slice(0,12).map(desc);
 const culprits=[...document.querySelectorAll('body *')].filter(visible).filter(e=>{
  const r=e.getBoundingClientRect();return r.right>w+2||r.left< -3
 }).sort((a,b)=>a.getBoundingClientRect().width-b.getBoundingClientRect().width)
 .slice(0,18).map(desc);
 const sampleP=[...document.querySelectorAll('main p')].find(visible);
 const pStyle=sampleP?getComputedStyle(sampleP):null;
 return {viewport:w,documentWidth:root.scrollWidth,mainCount:document.querySelectorAll('main').length,
  h1Count:document.querySelectorAll('main h1').length,
  textElements:rendered.length,outside,clipped,parentClips,culprits,
  paragraphStyle:pStyle?{fontSize:pStyle.fontSize,lineHeight:pStyle.lineHeight,letterSpacing:pStyle.letterSpacing,
   wordSpacing:pStyle.wordSpacing,marginBottom:pStyle.marginBottom}:null};
}"""
async def test(browser,engine,page_name,width,mode):
    page=await browser.new_page(viewport={"width":width,"height":900},reduced_motion="reduce")
    row={"engine":engine,"page":page_name,"width":width,"mode":mode,"errors":[]}
    try:
        result=await page.goto(f"{BASE}/{page_name}",wait_until="domcontentloaded",timeout=18000)
        await page.evaluate("document.fonts.ready")
        row["http"]=result.status if result else None
        baseline=await page.evaluate(METRICS)
        if mode in ("spacing","combined"):
            await page.add_style_tag(content=SPACING_STYLE)
        if mode in ("text200","combined"):
            row["scaledTextElements"]=await page.evaluate(TEXT_RESIZE)
        metrics=await page.evaluate(METRICS)
        row["baseline"]={"viewport":baseline["viewport"],"documentWidth":baseline["documentWidth"],
                          "paragraphStyle":baseline["paragraphStyle"]}
        row["metrics"]=metrics
        if row["http"]!=200:row["errors"].append("HTTP unexpected")
        if metrics["mainCount"]!=1 or metrics["h1Count"]!=1:row["errors"].append("landmark structure")
        if metrics["documentWidth"]>width+2:row["errors"].append("page-wide horizontal overflow")
        if metrics["outside"]:row["errors"].append("text extends outside CSS viewport")
        if metrics["clipped"]:row["errors"].append("text element clipped")
        # Parent clip issues are diagnostic pending visual review because
        # some intentionally truncated icon links/hidden photo masks may arise.
        if metrics["parentClips"]:row["review"].append("possible clipping by ancestor") if "review" in row else row.update(review=["possible clipping by ancestor"])
        if mode in ("spacing","combined"):
            style=metrics["paragraphStyle"]
            if not style:
                row["errors"].append("paragraph not found")
            else:
                size=float(style["fontSize"].replace("px",""))
                for prop,factor in (("lineHeight",1.5),("marginBottom",2.0),
                                    ("letterSpacing",0.12),("wordSpacing",0.16)):
                    raw=style.get(prop,"")
                    actual=float(raw.replace("px","")) if raw.endswith("px") else None
                    if actual is None or actual+0.7<size*factor:
                        row["errors"].append(f"required text spacing not applied: {prop}")
        if mode in ("text200","combined"):
            before=baseline["paragraphStyle"]
            after=metrics["paragraphStyle"]
            if before and after:
                b=float(before["fontSize"].replace("px",""))
                a=float(after["fontSize"].replace("px",""))
                if a < b*1.97:row["errors"].append("200 percent text-only font enlargement not applied")
        if width==320:
            await page.keyboard.press("Tab")
            row["firstTab"]=await page.evaluate("""() => ({
                href:document.activeElement?.getAttribute('href'),
                visible:(()=>{const r=document.activeElement.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight})()
            })""")
            if row["firstTab"]["href"]!="#main" or not row["firstTab"]["visible"]:
                row["errors"].append("skip link not visibly keyboard reachable")
        if engine=="chromium" and width==320 and page_name in ("index.html","research.html","cv.html","teaching-ap-biology.html"):
            try:
                file=OUT/f"{page_name[:-5]}-{mode}-{width}.png"
                await page.screenshot(path=str(file),full_page=False,timeout=9000,animations="disabled")
                row["screenshot"]=str(file)
            except Exception as err:row["captureWarning"]=str(err)[:180]
        return row
    except Exception as err:
        row["errors"].append("test exception: "+str(err)[:270])
        return row
    finally:await page.close()
async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as pw:
        for engine,names in (("chromium",PAGES),("firefox",FIREFOX_SAMPLE)):
            browser=await getattr(pw,engine).launch()
            for name in names:
                for width in (320,1280):
                    for mode in MODES:
                        row=await test(browser,engine,name,width,mode);results.append(row)
                        print(engine,name,width,mode,row["errors"],flush=True)
            for name in names[:3]:
                row=await test(browser,engine,name,320,"combined");results.append(row)
                print(engine,name,320,"combined",row["errors"],flush=True)
            await browser.close()
    all_findings=[{"engine":r["engine"],"page":r["page"],"width":r["width"],
     "mode":r["mode"],"errors":r["errors"],"metrics":r.get("metrics")}
      for r in results if r["errors"]]
    # WCAG 1.4.12 text spacing and 1.4.4 text enlargement are independent
    # user-style tests. Combined maximal spacing + 200% text at 320px is
    # an extra stress experiment; record any failure prominently, but do not
    # mislabel it as a failure of either separately tested requirement.
    failures=[r for r in all_findings if r["mode"]!="combined"]
    stress_failures=[r for r in all_findings if r["mode"]=="combined"]
    advisories=[{"engine":r["engine"],"page":r["page"],"width":r["width"],
     "mode":r["mode"],"parentClips":r.get("metrics",{}).get("parentClips")}
      for r in results if r.get("metrics",{}).get("parentClips")]
    summary={"modes":["injected WCAG 1.4.12 paragraph/line/letter/word spacing",
     "user-style computed-font-size ×2 simulation","combined 320px stress samples"],
     "publicPages":len(PAGES),"cases":len(results),
     "individualRequirementCases":sum(x["mode"]!="combined" for x in results),
     "combinedStressCases":sum(x["mode"]=="combined" for x in results),
     "failedCount":len(failures),"failures":failures,
     "combinedStressFailedCount":len(stress_failures),
     "combinedStressFailures":stress_failures,"advisories":advisories,
     "byEngine":{e:{"cases":sum(x["engine"]==e for x in results),
       "individualFailures":sum(x["engine"]==e and x["mode"]!="combined" and bool(x["errors"]) for x in results),
       "combinedStressFailures":sum(x["engine"]==e and x["mode"]=="combined" and bool(x["errors"]) for x in results)} for e in ("chromium","firefox")},
     "caveats":"The two reading preference tests apply independently. Combined maximum-spacing plus 200% text at 320 CSS pixels is explicitly a supplementary stress case, and any such overflow remains open even when the independent-test exit code is zero. User-style injections are not native browser text-only zoom. Automated results do not certify WCAG."}
    (OUT/"report.json").write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n")
    (OUT/"summary.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(summary,ensure_ascii=False,indent=2),flush=True)
    return 1 if failures else 0
if __name__=="__main__":raise SystemExit(asyncio.run(main()))
