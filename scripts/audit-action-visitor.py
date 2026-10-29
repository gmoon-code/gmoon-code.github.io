"""Stage R4: browser and PDF checks for classroom action research."""
import asyncio, json, re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright

BASE="http://127.0.0.1:8779/research-action.html"
OUT=Path("action-visitor-output")
WIDTHS=[320,375,480,560,620,700,701,768,900,1024,1140,1440]
EXPECTED=["assessment-patterns","paired-evidence","assessment-decisions","action-methods"]

async def main():
    OUT.mkdir(exist_ok=True)
    findings=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for w in WIDTHS:
            page=await browser.new_page(viewport={"width":w,"height":900},reduced_motion="reduce")
            errors=[]
            try:
                response=await page.goto(BASE,wait_until="load",timeout=20000)
                await page.evaluate("document.fonts.ready")
                d=await page.evaluate("""() => {
                  const main=document.querySelector('#main'), footer=document.querySelector('.site-footer');
                  const rect=e=>e.getBoundingClientRect();
                  const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
                  const wraps=[...document.querySelectorAll('.research-table-wrap')];
                  const hints=[...main.querySelectorAll('.table-scroll-hint')];
                  return {
                    width:innerWidth,documentWidth:document.documentElement.scrollWidth,
                    headings:[...main.querySelectorAll('h1')].map(x=>x.textContent.trim()),
                    h2:[...main.querySelectorAll('h2')].map(x=>x.textContent.trim()),
                    brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].map(x=>x.hash.slice(1)).filter(x=>!ids.includes(x)),
                    uniqueIds:ids.length===new Set(ids).size,
                    unnamedLinks:[...document.querySelectorAll('a[href]')].filter(x=>!(x.textContent||x.getAttribute('aria-label')||'').trim()).length,
                    tables:wraps.map((x,i)=>({tabIndex:x.tabIndex,client:x.clientWidth,scroll:x.scrollWidth,
                      headers:[...x.querySelectorAll('thead th')].map(y=>y.getAttribute('scope')),
                      rows:x.querySelectorAll('tbody tr').length,
                      caption:x.querySelector('caption')?.textContent.trim(),
                      hintBefore:!!hints[i] && !!(hints[i].compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING)})),
                    clipped:[...main.querySelectorAll('h1,h2,h3,p,li,th,td,caption')].filter(x=>{
                      const s=getComputedStyle(x);return s.overflow!=='visible' && (x.scrollWidth>x.clientWidth+3||x.scrollHeight>x.clientHeight+3)
                    }).map(x=>x.textContent.trim().slice(0,70)),
                    escaped:[...main.querySelectorAll('h1,h2,h3,p,li,figcaption')].filter(x=>!x.closest('.research-table-wrap')&&rect(x).width>0&&(rect(x).left< -3||rect(x).right>innerWidth+3)).map(x=>x.textContent.trim().slice(0,70)),
                    footerGap:Math.round(rect(footer).top-rect(main.querySelector(':scope > .section:last-of-type')).bottom),
                    navCurrent:[...document.querySelectorAll('.site-nav [aria-current="page"]')].map(x=>x.textContent.trim())
                  };
                }""")
                if not response or response.status!=200:errors.append("HTTP status")
                if d["documentWidth"]>w:errors.append("horizontal document overflow")
                if len(d["headings"])!=1:errors.append("H1 count")
                if d["brokenAnchors"] or not d["uniqueIds"] or d["unnamedLinks"]:errors.append("links/IDs")
                if d["navCurrent"]!=["Research"]:errors.append("navigation state")
                if len(d["tables"])!=2:errors.append("evidence table count")
                for t in d["tables"]:
                    if t["tabIndex"]!=0 or not t["hintBefore"] or not t["caption"] or any(v!="col" for v in t["headers"]):errors.append("table semantics")
                if d["clipped"] or d["escaped"]:errors.append("clipped/outside-page text")
                if abs(d["footerGap"]-100)>1:errors.append("footer gap differs from 100px")
                if w in (320,375,768,1024,1440):await page.screenshot(path=str(OUT/f"light-{w}.png"),full_page=True,animations="disabled")
                if w==375:
                    await page.keyboard.press("Tab")
                    first=await page.evaluate("""() => ({
                      href:document.activeElement.getAttribute('href'),
                      focusVisible:document.activeElement.matches(':focus-visible')
                    })""")
                    await page.keyboard.press("Enter")
                    focusTarget=await page.evaluate("document.activeElement.id")
                    await page.locator('a[href="#paired-evidence"]').first.click()
                    sectionHash=await page.evaluate("location.hash")
                    await page.locator('a[href="#page-top"]').first.click()
                    back=await page.evaluate("({hash:location.hash,y:scrollY})")
                    d["keyboard"]={"first":first,"target":focusTarget,"section":sectionHash,"back":back}
                    if first["href"]!="#main" or not first["focusVisible"] or focusTarget!="main":
                        errors.append("skip-link keyboard navigation")
                    if sectionHash!="#paired-evidence" or back["hash"]!="#page-top" or back["y"]>4:
                        errors.append("section navigation or back to top")
                    await page.evaluate("""() => {document.documentElement.setAttribute('data-moon-theme','dark')}""")
                    d["darkContrast"]=await page.evaluate("""() => {
                      const selectors=[
                        '.research-detail-hero h1',
                        '.research-detail-hero .hero-copy>p:not(.meta):not(.research-study-title)',
                        '.research-prose p',
                        '.research-cycle-stage',
                        '.research-case h3',
                        '.research-case>p:not(.meta)',
                        '.research-evidence-table thead th',
                        '.research-evidence-table tbody th',
                        '.research-evidence-table tbody td',
                        '.research-followups article h3',
                        '.research-table-note',
                        '.research-count-row strong'
                      ];
                      const rgba=s=>{
                        const m=s.match(/rgba?\(([^)]+)\)/);
                        if(!m)return null;
                        const v=m[1].split(',').map(Number);
                        return [v[0],v[1],v[2],v.length>3?v[3]:1];
                      };
                      const lum=v=>{
                        const c=v.slice(0,3).map(x=>{
                          x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);
                        });
                        return .2126*c[0]+.7152*c[1]+.0722*c[2];
                      };
                      return selectors.map(sel=>{
                        const el=document.querySelector(sel);
                        if(!el)return {selector:sel,error:'not found'};
                        const cs=getComputedStyle(el), ink=rgba(cs.color);
                        let paper=null;
                        for(let a=el;a;a=a.parentElement){
                          const bg=rgba(getComputedStyle(a).backgroundColor);
                          if(bg&&bg[3]>=.99){paper=bg;break;}
                        }
                        if(!paper)paper=[255,255,255,1];
                        const a=lum(ink),b=lum(paper);
                        return {selector:sel,ratio:+((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2),
                                ink:cs.color,paper:paper.slice(0,3)};
                      });
                    }""")
                    if any(x.get("ratio",0)<4.5 for x in d["darkContrast"]):
                        errors.append("sampled dark-mode text contrast below 4.5:1")
                    await page.screenshot(path=str(OUT/"dark-375.png"),full_page=True,animations="disabled")
                if w==320:
                    for i in range(2):
                        wrap=page.locator(".research-table-wrap").nth(i)
                        await wrap.focus()
                        before=await wrap.evaluate("(e)=>e.scrollLeft")
                        await page.keyboard.press("ArrowRight")
                        await page.wait_for_timeout(300)
                        after=await wrap.evaluate("(e)=>e.scrollLeft")
                        if await wrap.evaluate("(e)=>e.scrollWidth>e.clientWidth+5") and after<=before:
                            errors.append(f"table {i+1} keyboard scroll")
                findings.append({"width":w,**d,"errors":errors})
            except Exception as e:
                findings.append({"width":w,"errors":[str(e)]})
            finally:
                await page.close()
        page=await browser.new_page(viewport={"width":1024,"height":900})
        await page.goto(BASE,wait_until="load")
        await page.emulate_media(media="print")
        pdf=await page.pdf(format="A4",print_background=True,prefer_css_page_size=True)
        (OUT/"action-a4.pdf").write_bytes(pdf)
        doc=fitz.open(stream=pdf,filetype="pdf")
        pages=[pg.get_text() for pg in doc]
        full=re.sub(r"\s+", " ", " ".join(pages))
        must=["Research design and assessment sequence","Reflection specificity","Reconstructing the same mechanism",
              "Examples from paired student records","Methods, ethics, and limitations","What the inquiry contributes",
              "Specified a reasoning difficulty","Earlier pathway extended","Earlier contradiction not repeated",
              "Earlier relationship omitted","Intermediate pathway still undeveloped"]
        missing=[x for x in must if x not in full]
        pdf_report={"pages":len(pages),"words":[len(x.split()) for x in pages],"missing":missing,
          "page_previews":[{"number":i+1,"first":re.sub(r"\s+"," ",x[:400]),"last":re.sub(r"\s+"," ",x[-550:])} for i,x in enumerate(pages)],
          "offPageWords":[sum(1 for word in pg.get_text("words") if word[0]<-1 or word[1]<-1 or word[2]>pg.rect.width+1 or word[3]>pg.rect.height+1) for pg in doc]}
        for i,pg in enumerate(doc):
            pix=pg.get_pixmap(matrix=fitz.Matrix(1.1,1.1),alpha=False)
            pix.save(str(OUT/f"a4-{i+1}.png"))
        (OUT/"report.json").write_text(json.dumps({"screens":findings,"print":pdf_report},indent=2))
        await browser.close()
    failed=[x for x in findings if x["errors"]]
    print(json.dumps({"screen_failures":failed,"footer_gaps":[(x["width"],x.get("footerGap")) for x in findings],
      "print":pdf_report},indent=2))
    if failed or missing or any(pdf_report["offPageWords"]) or len(pages)>6 or len(pages[-1].split())<100:
        raise SystemExit(1)

if __name__=="__main__":asyncio.run(main())
