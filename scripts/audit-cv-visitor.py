"""Exact CV page source and Chromium visitor audit: 11+ viewports, keyboard, print, links."""
import asyncio,json,re
from pathlib import Path
from urllib.parse import urlparse
import fitz
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8776"
URL=BASE+"/cv.html"
OUT=Path("cv-audit-output")
WIDTHS=(320,375,480,560,700,701,768,900,1024,1025,1140,1440)
REQUIRED_SECTION_HEADINGS=[
 "Education","Research Interests","Research","Professional Experience",
 "Student Research Supervision and Mentorship","Academic and Professional Service",
 "Languages and Technical Skills","Licensure and Selected Professional Development"]
REQUIRED_PDF=[
 "Ye Eun Moon","American College of Education","University of British Columbia",
 "Research Interests","Scoping Review","Classroom Action Research",
 "Ivy Collegiate School","Saint Paul Academy Daechi","Student Research",
 "Academic and Professional Service","Languages and Technical Skills",
 "Licensure and Selected Professional Development"]
async def main():
 OUT.mkdir(exist_ok=True)
 results=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  for width in WIDTHS:
   page=await browser.new_page(viewport={"width":width,"height":900},reduced_motion="reduce")
   try:
    response=await page.goto(URL,wait_until="load",timeout=30000)
    await page.evaluate("document.fonts.ready")
    dat=await page.evaluate("""() => {
      const main=document.querySelector('main'), footer=document.querySelector('.site-footer');
      const rect=e=>e.getBoundingClientRect(),box=e=>{const x=rect(e);
        return {left:Math.round(x.left),right:Math.round(x.right),top:Math.round(x.top+scrollY),
        bottom:Math.round(x.bottom+scrollY),width:Math.round(x.width),height:Math.round(x.height)};};
      const headings=[...main.querySelectorAll('section.resume-section>h2')].map(x=>x.innerText.trim());
      const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
      const anchors=[...document.querySelectorAll('a[href^="#"]')].map(x=>x.getAttribute('href').slice(1));
      const inside=[...main.querySelectorAll('h1,h2,h3,p,li,a,span,button')];
      const escaped=inside.filter(x=>{const r=rect(x);return r.width>0&&(r.left< -3||r.right>innerWidth+3);})
        .map(x=>({tag:x.tagName,text:x.innerText.slice(0,75),b:box(x)}));
      const clipped=inside.filter(x=>{const c=getComputedStyle(x);if(c.overflow==='visible')return false;
        return x.scrollHeight>x.clientHeight+3||x.scrollWidth>x.clientWidth+3;})
        .map(x=>({tag:x.tagName,text:x.innerText.slice(0,70),scroll:[x.scrollWidth,x.scrollHeight],client:[x.clientWidth,x.clientHeight]}));
      const entries=[...main.querySelectorAll('.resume-entry')];
      const texts=[...main.querySelectorAll('section.resume-section>p,.resume-bullets li,.resume-citation')];
      const overlaps=[];
      for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
        const a=rect(entries[i]),b=rect(entries[j]);
        if(Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
           Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))>10)
          overlaps.push([i,j]);
      }
      return {
       title:document.title,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
       navCurrent:[...document.querySelectorAll('nav.site-nav [aria-current=page]')].map(x=>x.innerText),
       headings,mainCount:document.querySelectorAll('main').length,h1:[...main.querySelectorAll('h1')].map(x=>x.innerText),
       entryCount:entries.length,bullets:main.querySelectorAll('li').length,
       duplicateIds:ids.length!==new Set(ids).size,missingAnchors:anchors.filter(x=>!ids.includes(x)),
       unnamedLinks:[...document.querySelectorAll('a[href]')].filter(x=>!(x.innerText||x.getAttribute('aria-label')||'').trim()).length,
       escaped,clipped,entryOverlaps:overlaps,
       fullWidth:box(main),header:box(main.querySelector('.resume-header')),
       printButton:box(main.querySelector('.resume-print')),
       printText:main.querySelector('.resume-print').innerText,
       footerGap:Math.round(rect(footer).top-rect(main.querySelector('section.resume-section:last-of-type')).bottom),
       printContinuedOnScreen:getComputedStyle(main.querySelector('.resume-print-continued')).display,
       heroFonts:{
        h1:getComputedStyle(main.querySelector('h1')).fontSize,
        section:getComputedStyle(main.querySelector('h2')).fontSize,
        bullets:getComputedStyle(main.querySelector('.resume-bullets li')).fontSize
       },
       hrefs:[...main.querySelectorAll('a[href]')].map(x=>({href:x.getAttribute('href'),label:x.innerText.trim()}))
      };
    }""")
    err=[]
    if not response or response.status!=200:err.append("HTTP page failure")
    if dat["documentWidth"]>width:err.append("horizontal overflow")
    if dat["mainCount"]!=1 or dat["h1"]!=["Ye Eun Moon"] or dat["headings"]!=REQUIRED_SECTION_HEADINGS:
     err.append("wrong landmark/heading structure")
    if dat["navCurrent"]!=["CV"]:err.append("CV not current navigation")
    if dat["duplicateIds"] or dat["missingAnchors"] or dat["unnamedLinks"] or dat["escaped"] or dat["clipped"]:
     err.append("accessibility/text escaped")
    if dat["entryOverlaps"]:err.append("overlapping CV entries")
    if dat["printContinuedOnScreen"]!="none":err.append("print-only continuation visible on screen")
    if dat["printText"]!="Print / Save as PDF":err.append("print control wrong label")
    if not 95<=dat["footerGap"]<=105:err.append("CV footer gap inconsistent with other pages")
    dat.update({"test":"responsive", "errors":err})
    results.append(dat)
    print("CV",width,"PASS" if not err else err,"gap",dat["footerGap"],"doc",dat["documentWidth"],flush=True)
    await page.screenshot(path=str(OUT/f"cv-{width}.png"),full_page=True,animations="disabled",timeout=30000)
   except Exception as exc:
    results.append({"test":"responsive","width":width,"errors":[repr(exc)]})
    print("CV",width,"ERROR",repr(exc),flush=True)
   finally:await page.close()

  page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
  try:
   await page.goto(URL,wait_until="load")
   await page.keyboard.press("Tab")
   first=await page.evaluate("""() => ({href:document.activeElement.getAttribute('href'),
      visible:document.activeElement.matches(':focus-visible')})""")
   await page.keyboard.press("Enter")
   focused=await page.evaluate("document.activeElement.id")
   await page.locator(".moon-appearance-select").select_option("dark")
   await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
   await page.keyboard.press("Tab")
   await page.locator(".topbar .brand").focus()
   dark=await page.evaluate("""() => ({
     theme:document.documentElement.dataset.moonTheme,
     focus:document.activeElement.matches(':focus-visible'),
     outline:getComputedStyle(document.activeElement).outlineColor,
     body:getComputedStyle(document.body).backgroundColor,
     heading:getComputedStyle(document.querySelector('.resume-section h2')).color,
     headingBg:getComputedStyle(document.querySelector('.resume-section h2')).backgroundColor,
     overflow:document.documentElement.scrollWidth>innerWidth
   })""")
   await page.screenshot(path=str(OUT/"cv-dark-375.png"),full_page=True)
   await page.evaluate("""() => {window.__printInvocations=0;window.print=()=>{
     window.__printInvocations++};}""")
   await page.locator(".resume-print").click()
   clicks=await page.evaluate("window.__printInvocations")
   await page.locator('a[href="#page-top"]').click()
   back=await page.evaluate("({hash:location.hash,y:scrollY})")
   err=[]
   if first["href"]!="#main" or not first["visible"] or focused!="main":
    err.append("keyboard skip to content")
   if dark["theme"]!="dark" or not dark["focus"] or dark["overflow"]:
    err.append("dark/focus/accessibility")
   if clicks!=1:err.append("print button invocation")
   if back["hash"]!="#page-top" or back["y"]>4:err.append("back-to-top")
   results.append({"test":"keyboard dark print-button","first":first,"target":focused,
      "dark":dark,"printCalls":clicks,"back":back,"errors":err})
   print("KEYBOARD PRINT DARK","PASS" if not err else err,flush=True)
  except Exception as exc:
   results.append({"test":"keyboard dark print-button","errors":[repr(exc)]})
   print("KEYBOARD ERROR",repr(exc),flush=True)
  finally:await page.close()

  page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
  try:
   await page.goto(URL,wait_until="load")
   await page.evaluate("document.fonts.ready")
   raw=await page.pdf(format="A4",print_background=True,margin={"top":"0","bottom":"0","left":"0","right":"0"})
   (OUT/"cv-A4.pdf").write_bytes(raw)
   pdf=fitz.open(stream=raw,filetype="pdf")
   pages=[re.sub(r"\s+"," ",pg.get_text()) for pg in pdf]
   missing=[name for name in REQUIRED_PDF if not any(name in x for x in pages)]
   clipped=[]
   for i,pg in enumerate(pdf):
    for word in pg.get_text("words"):
     if word[0]<-1 or word[1]<-1 or word[2]>pg.rect.width+1 or word[3]>pg.rect.height+1:
      clipped.append((i+1,word[4]))
    pg.get_pixmap(matrix=fitz.Matrix(1.3,1.3)).save(str(OUT/f"cv-A4-{i+1}.png"))
   continuation=[i+1 for i,txt in enumerate(pages) if "Professional Experience, continued" in txt]
   page2Date=[i+1 for i,txt in enumerate(pages) if "Saint Paul Academy Daechi" in txt]
   errs=[]
   if len(pdf)!=2:errs.append("CV print not two pages")
   if missing or clipped:errs.append("missing/clipped printed content")
   if continuation!=[2] or page2Date!=[2]:errs.append("continuation heading/body split")
   if len(pages)>1 and len(pages[1])<700:errs.append("short mostly empty second page")
   results.append({"test":"A4 print","pages":len(pdf),"pageChars":[len(x) for x in pages],
      "missing":missing,"clipped":clipped[:20],"continuation":continuation,
      "secondJobPage":page2Date,"errors":errs})
   print("PRINT",len(pdf),"PASS" if not errs else errs,flush=True)
  except Exception as exc:
   results.append({"test":"A4 print","errors":[repr(exc)]})
   print("PRINT ERROR",repr(exc),flush=True)
  finally:await page.close()
  # Verify actual visitor links and sample text contrast, not only href syntax.
  for appearance in ("light","dark"):
   page=await browser.new_page(viewport={"width":375 if appearance=="dark" else 1440,"height":850},
                               reduced_motion="reduce")
   try:
    await page.goto(URL,wait_until="load")
    await page.locator(".moon-appearance-select").select_option(appearance)
    await page.wait_for_function("pref => document.documentElement.dataset.moonTheme===pref",appearance)
    vals=await page.evaluate("""() => {
      const get=e=>document.querySelector(e);
      const parse=s=>{
        const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;
        const c=m[1].split(',').map(Number);return [c[0],c[1],c[2],c.length>3?c[3]:1];
      };
      const bg=e=>{
        for(let x=e;x;x=x.parentElement){
          let c=parse(getComputedStyle(x).backgroundColor);
          if(c && c[3]===1)return c;
        }
        return [255,255,255,1];
      };
      const lum=c=>{
        let cs=c.slice(0,3).map(v=>{
          v=v/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
        });return cs[0]*.2126+cs[1]*.7152+cs[2]*.0722;
      };
      const inspect=(sel,threshold)=>{
        const el=get(sel);const c=parse(getComputedStyle(el).color),b=bg(el);
        const x=lum(c),y=lum(b),ratio=(Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
        return {selector:sel,foreground:c,background:b,ratio:+ratio.toFixed(2),
          threshold,pass:ratio>=threshold};
      };
      return {theme:document.documentElement.dataset.moonTheme,
        checks:[
          inspect('.resume-header h1',3),
          inspect('.resume-meta',4.5),
          inspect('.resume-section h2',3),
          inspect('.resume-entry-heading h3',3),
          inspect('.resume-date',4.5),
          inspect('.resume-bullets li',4.5),
          inspect('.resume-print',4.5),
          inspect('.resume-citation a',4.5)
        ]};
    }""")
    err=[]
    if vals["theme"]!=appearance:err.append("theme not set")
    if any(not x["pass"] for x in vals["checks"]):err.append("sample text contrast below WCAG AA")
    results.append({"test":"contrast "+appearance,**vals,"errors":err})
    print("CONTRAST",appearance,"PASS" if not err else err,flush=True)
   except Exception as exc:
    results.append({"test":"contrast "+appearance,"errors":[repr(exc)]})
    print("CONTRAST ERROR",appearance,repr(exc),flush=True)
   finally:await page.close()
  page=await browser.new_page(viewport={"width":375,"height":800})
  try:
   await page.goto(URL,wait_until="load")
   expected="research-action.html"
   link=page.locator('main a[href="research-action.html"]')
   await link.click()
   await page.wait_for_url(BASE+"/"+expected,timeout=15000)
   title=await page.title()
   maintext=await page.locator('main h1').first.inner_text()
   local=page.url==BASE+"/"+expected
   errs=[]
   if not local or not maintext:errs.append("research overview link not navigable")
   results.append({"test":"internal research link","destination":page.url,
     "title":title,"heading":maintext,"errors":errs})
   print("INTERNAL LINK","PASS" if not errs else errs,flush=True)
  except Exception as exc:
   results.append({"test":"internal research link","errors":[repr(exc)]})
  finally:await page.close()
  await browser.close()
 (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
 failures=[r for r in results if r["errors"]]
 print("SUMMARY",len(results),"checks",len(failures),"failed",flush=True)
 if failures:raise AssertionError(json.dumps(failures,ensure_ascii=False)[:4400])

if __name__=="__main__":asyncio.run(main())
