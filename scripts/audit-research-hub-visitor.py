"""Research hub independent visitor audit: responsive geometry, links, graph, dark and A4."""
import asyncio,json,re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright
BASE="http://127.0.0.1:8777"
URL=BASE+"/research.html"
OUT=Path("research-hub-audit-output")
WIDTHS=[320,375,480,700,701,768,900,980,981,1024,1025,1140,1440]
SECTION_IDS=["current-inquiries","research-interests","curriculum-decisions",
  "recognition-contexts","cultural-knowledge","multilingual-participation",
  "scientific-representations","model-adequacy","sex-classification",
  "scholarly-writing","research-reading"]
NEEDLES=["Imagine a biology class examining","Research projects","Classroom authority",
  "Cultural knowledge and participation","Multilingual participation",
  "Scientific representations and their limits","Sex determination and biological variation",
  "Related writing","References","Zemenick, A. T."]
async def main():
 OUT.mkdir(exist_ok=True)
 checks=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  for w in WIDTHS:
   page=await browser.new_page(viewport={"width":w,"height":900},reduced_motion="reduce")
   try:
    response=await page.goto(URL,wait_until="load",timeout=30000)
    await page.evaluate("document.fonts.ready")
    await page.evaluate("""async () => {
      const img=document.querySelector('.research-published-figure img');
      img.loading='eager';
      await Promise.race([img.decode().catch(()=>{}),
                          new Promise(resolve=>setTimeout(resolve,5000))]);
    }""")
    data=await page.evaluate("""() => {
      const main=document.querySelector('#main'),r=e=>e.getBoundingClientRect();
      const box=e=>{let b=r(e);return {left:+b.left.toFixed(1),right:+b.right.toFixed(1),
        top:Math.round(b.top+scrollY),bottom:Math.round(b.bottom+scrollY),
        height:+b.height.toFixed(1),width:+b.width.toFixed(1)};};
      const headings=[...main.querySelectorAll('h1,h2,h3,h4')].map(e=>({
        tag:e.tagName,text:e.innerText.trim().slice(0,85)}));
      const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      const anchors=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1));
      const graph=main.querySelector('.research-published-figure img');
      const pan=main.querySelector('.research-figure-pan');
      const rail=main.querySelector('.research-section-guide');
      const refs=[...main.querySelectorAll('.research-reading-list li[id^="reading-"]')];
      const content=[...main.querySelectorAll('h1,h2,h3,h4,p,li,a,figcaption')];
      const escaped=content.filter(e=>{if(e.closest('.research-figure-pan'))return false;
        let b=r(e);return b.width>0&&(b.left < -3||b.right>innerWidth+3);})
         .map(e=>({tag:e.tagName,txt:e.innerText.slice(0,85),bounds:box(e)}));
      const clipped=content.filter(e=>{let c=getComputedStyle(e);
        return c.overflow!=='visible'&&(e.scrollHeight>e.clientHeight+3||e.scrollWidth>e.clientWidth+3)
      }).map(e=>e.innerText.slice(0,90));
      return {
        width:innerWidth,docWidth:document.documentElement.scrollWidth,
        headings,sections:[...main.querySelectorAll('section[id]')].map(e=>e.id),
        navCurrent:[...document.querySelectorAll('.site-nav [aria-current=page]')].map(e=>e.innerText),
        uniqueIds:new Set(ids).size===ids.length,brokenAnchors:anchors.filter(id=>!ids.includes(id)),
        unnamedLinks:[...document.querySelectorAll('a[href]')].filter(e=>!(e.innerText||e.getAttribute('aria-label')||'').trim()).length,
        refs:refs.length,refsWithLinks:refs.filter(e=>e.querySelector('a[href^="http"]')).length,
        main:box(main),hero:box(main.querySelector('.research-essay-hero')),
        content:box(main.querySelector('.research-editorial-content')),rail:box(rail),
        railDisplay:getComputedStyle(rail).display,railPosition:getComputedStyle(rail).position,
        graph:{loaded:graph.complete&&graph.naturalWidth>0,natural:[graph.naturalWidth,graph.naturalHeight],
          rendered:box(graph),alt:graph.alt,href:graph.parentElement.getAttribute('href')},
        pan:{box:box(pan),clientWidth:pan.clientWidth,scrollWidth:pan.scrollWidth,
          overflowX:getComputedStyle(pan).overflowX,focusable:pan.tabIndex},
        footerGap:Math.round(r(document.querySelector('.site-footer')).top-
          r(main.querySelector('.research-editorial-content > .research-essay-section:last-child')).bottom),
        escaped,clipped
      };
    }""")
    err=[]
    if response.status!=200:err.append("bad page HTTP")
    if data["docWidth"]>w:err.append("document horizontal overflow")
    if data["navCurrent"]!=["Research"]:err.append("current nav incorrect")
    if data["sections"]!=SECTION_IDS:err.append("research sections changed")
    if data["refs"]!=53 or data["refsWithLinks"]!=53:err.append("bibliography count/links missing")
    if not data["uniqueIds"] or data["brokenAnchors"] or data["unnamedLinks"]:err.append("ID/anchor/accessibility")
    if data["escaped"] or data["clipped"]:err.append("visible text escaped or clipped")
    if not data["graph"]["loaded"] or not data["graph"]["alt"]:err.append("published source figure not decoded/named")
    if data["graph"]["natural"]!=[1087,778]:err.append("wrong publication image source")
    if w<620 and (data["pan"]["scrollWidth"]<=data["pan"]["clientWidth"] or data["pan"]["focusable"]!=0):
      err.append("narrow figure not scrollable/focusable")
    if not 95<=data["footerGap"]<=105:err.append("footer gap differs from standard 100px")
    data.update({"test":"responsive","errors":err})
    checks.append(data)
    if w in (320,375,768,1024,1440):
      try:
       await page.screenshot(path=str(OUT/f"research-{w}.png"),full_page=True,
                             animations="disabled",timeout=12000)
      except Exception as capture:
       print("NONFATAL CAPTURE LIMIT",w,repr(capture)[:250],flush=True)
    print("RESEARCH",w,"PASS" if not err else err,"footerGap",data["footerGap"],flush=True)
   except Exception as e:
    checks.append({"test":"responsive","width":w,"errors":[repr(e)]})
    print("RESEARCH ERROR",w,repr(e),flush=True)
   finally:await page.close()
  page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
  try:
   await page.goto(URL,wait_until="load")
   await page.keyboard.press("Tab")
   first=await page.evaluate("""() => ({
     href:document.activeElement.getAttribute('href'),
     focusVisible:document.activeElement.matches(':focus-visible')
   })""")
   await page.keyboard.press("Enter")
   target=await page.evaluate("document.activeElement.id")
   await page.locator('.moon-appearance-select').select_option('dark')
   await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
   dark=await page.evaluate("""() => ({
     theme:document.documentElement.dataset.moonTheme,
     cardBg:getComputedStyle(document.querySelector('.research-study-preview')).backgroundColor,
     cardFg:getComputedStyle(document.querySelector('.research-study-preview')).color,
     ink:getComputedStyle(document.querySelector('.research-study-preview p')).color,
     overflow:document.documentElement.scrollWidth>innerWidth
   })""")
   await page.locator('.research-figure-pan').scroll_into_view_if_needed()
   await page.locator('.research-figure-pan').focus()
   await page.keyboard.press('ArrowRight')
   await page.wait_for_function("document.querySelector('.research-figure-pan').scrollLeft>0",timeout=4000)
   pan=await page.evaluate("({x:document.querySelector('.research-figure-pan').scrollLeft,focus:document.activeElement.classList.contains('research-figure-pan')})")
   await page.locator('a[href="#research-interests"]').first.click()
   nav=await page.evaluate("({hash:location.hash,heading:document.querySelector('#research-interests h2').innerText})")
   await page.screenshot(path=str(OUT/"research-dark-375.png"),full_page=True)
   errors=[]
   if first["href"]!="#main" or not first["focusVisible"] or target!="main":errors.append("skip link keyboard")
   if dark["theme"]!="dark" or dark["cardBg"]==dark["ink"] or dark["overflow"]:errors.append("dark preview contrast/overflow")
   if not pan["focus"] or pan["x"]<=0:errors.append("figure keyboard scrolling")
   if nav["hash"]!="#research-interests":errors.append("section navigation")
   checks.append({"test":"keyboard/dark/figure","first":first,"target":target,
      "dark":dark,"pan":pan,"section":nav,"errors":errors})
   print("KEYBOARD DARK GRAPH","PASS" if not errors else errors,flush=True)
  except Exception as e:
   checks.append({"test":"keyboard/dark/figure","errors":[repr(e)]})
  finally:await page.close()
  page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
  try:
   await page.goto(URL,wait_until="load")
   await page.evaluate("document.fonts.ready")
   await page.evaluate("""async () => {
     const img=document.querySelector('.research-published-figure img');
     img.loading='eager';
     await Promise.race([img.decode().catch(()=>{}),new Promise(r=>setTimeout(r,5000))]);
   }""")
   raw=await page.pdf(format="A4",print_background=True,margin={
     "top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
   (OUT/"research-A4.pdf").write_bytes(raw)
   pdf=fitz.open(stream=raw,filetype="pdf")
   pageTexts=[re.sub(r"\s+"," ",pg.get_text()) for pg in pdf]
   missing=[x for x in NEEDLES if not any(x in t for t in pageTexts)]
   out=[]
   for i,pg in enumerate(pdf):
    for v in pg.get_text("words"):
     if v[0]<-1 or v[1]<-1 or v[2]>pg.rect.width+1 or v[3]>pg.rect.height+1:
      out.append((i+1,v[4]))
    pg.get_pixmap(matrix=fitz.Matrix(1,1)).save(str(OUT/f"research-A4-{i+1}.png"))
   # A last bibliography section ending with a stranded 1-2 lines is problematic.
   errs=[]
   if missing or out:errs.append("printed article/ref missing or off page")
   if len(pdf)>18:errs.append("unreasonably long A4 export")
   if len(pageTexts)>1 and len(pageTexts[-1])<280:errs.append("mostly blank final A4")
   checks.append({"test":"A4 print","pages":len(pdf),"pageChars":[len(t) for t in pageTexts],
      "images":[len(pg.get_images(full=True)) for pg in pdf],
      "missing":missing,"outOfBounds":out[:30],"firstPageStart":pageTexts[0][:160],
      "lastPageEnd":pageTexts[-1][-440:],"errors":errs})
   print("PRINT A4",len(pdf),"PASS" if not errs else errs,flush=True)
  except Exception as e:
   checks.append({"test":"A4 print","errors":[repr(e)]})
   print("PRINT ERROR",repr(e),flush=True)
  finally:await page.close()
  await browser.close()
 (OUT/"report.json").write_text(json.dumps(checks,indent=2),encoding="utf-8")
 failed=[x for x in checks if x["errors"]]
 print("SUMMARY",len(checks),"checks",len(failed),"failed",flush=True)
 if failed:raise AssertionError(json.dumps(failed,ensure_ascii=False)[:4700])

if __name__=="__main__":asyncio.run(main())
