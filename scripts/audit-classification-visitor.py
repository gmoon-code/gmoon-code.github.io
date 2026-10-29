"""Stage R2. Audit the current public biological-classification essay in Chromium."""
import asyncio, json, re
from pathlib import Path
import fitz
from playwright.async_api import async_playwright

URL="http://127.0.0.1:8778/writing-biological-classification.html"
BASE="http://127.0.0.1:8778"
OUT=Path("classification-audit-output")
WIDTHS=[320,375,480,560,700,701,744,745,746,768,900,1024,1025,1140,1440]
SECTIONS=["haemoglobin-evidence","chromosomes-and-claims","curriculum-decisions","students-and-authority","essay-references"]
REFERENCES=["essay-barton","essay-donovan","essay-xyy","essay-richardson","essay-williams"]
TEXT_REQUIRED=["What can a biological classification explain?",
    "What the haemoglobin evidence establishes",
    "When a chromosome acquires a wider meaning",
    "From an evidential question to a curricular decision",
    "Following whose questions change the work",
    "Williams, T. N.","Donovan, B. M.","Richardson, S. S.",
    "Calabrese Barton, A.","Re, L.","This essay is a critical reading"]
def rgb(s):
    m=re.search(r"rgba?\(([^)]+)\)",s or "")
    if not m: return None
    return [float(x) for x in m.group(1).split(",")[:3]]
def luminance(a):
    z=[]
    for v in a:
        v/=255
        z.append(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)
    return .2126*z[0]+.7152*z[1]+.0722*z[2]
def contrast(a,b):
    x,y=luminance(a),luminance(b)
    return round((max(x,y)+.05)/(min(x,y)+.05),2)

async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for width in WIDTHS:
            page=await browser.new_page(viewport={"width":width,"height":850},reduced_motion="reduce")
            try:
                resp=await page.goto(URL,wait_until="load",timeout=25000)
                await page.evaluate("document.fonts.ready")
                row=await page.evaluate("""() => {
                  const main=document.querySelector('main'),bb=e=>e.getBoundingClientRect();
                  const box=e=>{const r=bb(e);return {left:Math.round(r.left),right:Math.round(r.right),
                     top:Math.round(r.top+scrollY),bottom:Math.round(r.bottom+scrollY),
                     width:Math.round(r.width),height:Math.round(r.height)}};
                  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                  const frag=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1));
                  const text=[...main.querySelectorAll('h1,h2,h3,p,li,a')];
                  const escaped=text.filter(e=>{const r=bb(e);return r.width>0&&(r.left < -3||r.right >innerWidth+3);})
                     .map(e=>({tag:e.tagName,label:e.innerText.slice(0,85),box:box(e)}));
                  const clipped=text.filter(e=>{
                     const s=getComputedStyle(e);
                     return s.overflow!=='visible'&&(e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3)
                   }).map(e=>({tag:e.tagName,label:e.innerText.slice(0,85)}));
                  const secs=[...main.querySelectorAll(':scope > section[id]')];
                  const refs=[...main.querySelectorAll('#essay-references li')];
                  const nav=main.querySelector('.research-essay-navigation');
                  return {
                    viewport:innerWidth,docWidth:document.documentElement.scrollWidth,title:document.title,
                    headings:[...main.querySelectorAll('h1,h2')].map(e=>({tag:e.tagName,text:e.innerText.trim()})),
                    mainCount:document.querySelectorAll('main').length,
                    sections:secs.map(e=>e.id),sectionBoxes:secs.map(e=>({id:e.id,b:box(e)})),
                    refs:refs.map(e=>({id:e.id,links:e.querySelectorAll('a[href^="https://"]').length})),
                    bodyReferenceLinks:[...main.querySelectorAll('a[href^="#essay-"]')].map(a=>a.getAttribute('href').slice(1)),
                    jumpLinks:[...nav.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)),
                    uniqueIds:ids.length===new Set(ids).size,brokenAnchors:frag.filter(id=>!ids.includes(id)),
                    emptyLinks:[...document.querySelectorAll('a[href]')].filter(e=>!(e.innerText||e.getAttribute('aria-label')||'').trim()).length,
                    currentNav:[...document.querySelectorAll('.site-nav [aria-current=page]')].map(e=>e.innerText),
                    navBox:box(nav),mainBox:box(main),
                    footerGap:Math.round(bb(document.querySelector('.site-footer')).top-bb(secs.at(-1)).bottom),
                    escaped,clipped,images:main.querySelectorAll('img').length,
                    readingParagraphCount:main.querySelectorAll('.research-essay-prose p').length,
                    localLinks:[...main.querySelectorAll('a[href$=".html"]')].map(a=>({label:a.innerText.trim(),href:a.getAttribute('href')}))
                  };
                }""")
                err=[]
                if not resp or resp.status!=200:err.append("HTTP not 200")
                if row["docWidth"]>width:err.append("horizontal page overflow")
                if row["mainCount"]!=1 or [x["tag"] for x in row["headings"]].count("H1")!=1:err.append("landmark/headings")
                if row["sections"]!=SECTIONS:err.append("missing article sections")
                if [r["id"] for r in row["refs"]]!=REFERENCES or any(r["links"]!=1 for r in row["refs"]):
                    err.append("five bibliography links")
                if set(row["bodyReferenceLinks"])!=set(REFERENCES):err.append("not all five references cited")
                if row["jumpLinks"]!=SECTIONS:err.append("essay section navigation")
                if not row["uniqueIds"] or row["brokenAnchors"] or row["emptyLinks"]:err.append("link/ID accessibility")
                if row["escaped"] or row["clipped"]:err.append("text escapes viewport or clipped")
                if row["currentNav"]!=["Research"]:err.append("research nav active")
                if row["images"]!=0:err.append("unexpected article image")
                if not 95<=row["footerGap"]<=105:err.append("footer spacing not 100px")
                row.update({"test":"responsive","errors":err})
                results.append(row)
                print("CLASSIFICATION",width,"PASS" if not err else err,
                      "gap",row["footerGap"],flush=True)
                if width in (320,375,768,1024,1440):
                    await page.screenshot(path=str(OUT/f"classification-{width}.png"),
                                          full_page=True,animations="disabled",timeout=18000)
            except Exception as e:
                results.append({"test":"responsive","width":width,"errors":[repr(e)]})
                print("CLASSIFICATION ERROR",width,repr(e),flush=True)
            finally:await page.close()

        page=await browser.new_page(viewport={"width":375,"height":850},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.keyboard.press("Tab")
            first=await page.evaluate("""() => ({
                href:document.activeElement.getAttribute('href'),
                visible:document.activeElement.matches(':focus-visible')
            })""")
            await page.keyboard.press("Enter")
            target=await page.evaluate("document.activeElement.id")
            await page.locator("a[href='#haemoglobin-evidence']").click()
            section=await page.evaluate("({hash:location.hash,top:Math.round(document.querySelector('#haemoglobin-evidence').getBoundingClientRect().top)})")
            await page.locator("a[href='#essay-williams']").first.click()
            ref=await page.evaluate("({hash:location.hash,top:Math.round(document.querySelector('#essay-williams').getBoundingClientRect().top)})")
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function("document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            dark=await page.evaluate("""() => ({
                theme:document.documentElement.dataset.moonTheme,
                outline:getComputedStyle(document.activeElement).outlineStyle,
                focus:document.activeElement.matches(':focus-visible'),
                body:getComputedStyle(document.body).backgroundColor,
                para:getComputedStyle(document.querySelector('.research-essay-prose p')).color,
                link:getComputedStyle(document.querySelector('#haemoglobin-evidence a')).color,
                overflow:document.documentElement.scrollWidth>innerWidth
            })""")
            await page.screenshot(path=str(OUT/"classification-dark-375.png"),full_page=True)
            await page.locator('a[href="#page-top"]').click()
            back=await page.evaluate("({hash:location.hash,y:scrollY})")
            errs=[]
            if first["href"]!="#main" or not first["visible"] or target!="main":errs.append("skip keyboard")
            if section["hash"]!="#haemoglobin-evidence" or ref["hash"]!="#essay-williams":
                errs.append("section/reference fragment")
            if dark["theme"]!="dark" or not dark["focus"] or dark["outline"]=="none" or dark["overflow"]:
                errs.append("dark or focus")
            if back["hash"]!="#page-top" or back["y"]>4:errs.append("back-to-top")
            results.append({"test":"keyboard/dark/fragment","first":first,"target":target,
                            "section":section,"reference":ref,"dark":dark,"back":back,"errors":errs})
            print("KEYBOARD DARK","PASS" if not errs else errs,flush=True)
        except Exception as e:
            results.append({"test":"keyboard/dark/fragment","errors":[repr(e)]})
            print("KEYBOARD ERROR",repr(e),flush=True)
        finally:await page.close()

        for theme in ["light","dark"]:
            page=await browser.new_page(viewport={"width":375,"height":850})
            try:
                await page.goto(URL,wait_until="load")
                await page.locator(".moon-appearance-select").select_option(theme)
                await page.wait_for_function("value=>document.documentElement.dataset.moonTheme===value",arg=theme)
                samples=await page.evaluate("""() => {
                  const sel=[
                   ['.research-essay-hero h1',3],
                   ['.research-essay-lead',4.5],
                   ['.research-essay-prose p',4.5],
                   ['.research-essay-prose a',4.5],
                   ['.research-reading-list li',4.5],
                   ['.research-reading-list a',4.5]
                  ];
                  return sel.map(([s,threshold])=>{
                    const e=document.querySelector(s),st=getComputedStyle(e),own=st.backgroundColor;
                    let back=e;
                    let color=own;
                    while(back&&(color==='rgba(0, 0, 0, 0)'||color==='transparent')){
                      back=back.parentElement;
                      if(back)color=getComputedStyle(back).backgroundColor;
                    }
                    return {selector:s,threshold,ink:st.color,paper:color};
                  });
                }""")
                scored=[]
                for sample in samples:
                    ink=rgb(sample["ink"]);paper=rgb(sample["paper"])
                    if ink and paper:
                        sample["contrast"]=contrast(ink,paper)
                        sample["pass"]=sample["contrast"]>=sample["threshold"]
                    else:sample["pass"]=False
                    scored.append(sample)
                errs=[]
                if any(not s["pass"] for s in scored):errs.append("low contrast sample")
                results.append({"test":"contrast "+theme,"samples":scored,"errors":errs})
                print("CONTRAST",theme,"PASS" if not errs else errs,flush=True)
            except Exception as e:
                results.append({"test":"contrast "+theme,"errors":[repr(e)]})
                print("CONTRAST ERROR",repr(e),flush=True)
            finally:await page.close()

        page=await browser.new_page(viewport={"width":1440,"height":900},reduced_motion="reduce")
        try:
            await page.goto(URL,wait_until="load")
            await page.evaluate("document.fonts.ready")
            raw=await page.pdf(format="A4",print_background=True,
                    margin={"top":"12mm","bottom":"12mm","left":"12mm","right":"12mm"})
            (OUT/"classification-A4.pdf").write_bytes(raw)
            pdf=fitz.open(stream=raw,filetype="pdf")
            texts=[re.sub(r"\s+"," ",p.get_text()) for p in pdf]
            missing=[t for t in TEXT_REQUIRED if not any(t in x for x in texts)]
            out=[]
            for i,pg in enumerate(pdf):
                for v in pg.get_text("words"):
                    if v[0]<-1 or v[1]<-1 or v[2]>pg.rect.width+1 or v[3]>pg.rect.height+1:
                        out.append([i+1,v[4]])
                pg.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(str(OUT/f"classification-A4-{i+1}.png"))
            orphan=[]
            for i,pg in enumerate(pdf):
                blocks=sorted((b for b in pg.get_text("blocks") if len(b)>4 and str(b[4]).strip()),key=lambda b:b[1])
                if blocks:
                    tail=blocks[-1]
                    if re.search(r"^(What the haemoglobin evidence|When a chromosome acquires|From an evidential|Following whose questions|References)",str(tail[4]).strip()):
                        orphan.append([i+1,str(tail[4]).strip()[:100]])
            errs=[]
            if not 1<=len(pdf)<=12:errs.append("unexpected print pagination")
            if missing or out or orphan:errs.append("missing/clipped/orphaned PDF material")
            if len(texts)>1 and len(texts[-1])<250:errs.append("stranded last A4 page")
            results.append({"test":"A4 print","pages":len(pdf),
                 "chars":[len(x) for x in texts],"missing":missing,"out":out[:16],
                 "orphan":orphan,"lastPageEnd":texts[-1][-380:],"errors":errs})
            print("PRINT A4",len(pdf),"PASS" if not errs else errs,flush=True)
        except Exception as e:
            results.append({"test":"A4 print","errors":[repr(e)]})
            print("PRINT ERROR",repr(e),flush=True)
        finally:await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    failures=[x for x in results if x["errors"]]
    print("SUMMARY",len(results),"checks",len(failures),"failed",flush=True)
    if failures:raise AssertionError(json.dumps(failures,ensure_ascii=False)[:4400])

if __name__=="__main__":asyncio.run(main())
