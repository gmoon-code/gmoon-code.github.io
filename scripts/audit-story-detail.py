"""Visitor-facing Story Method detail-page audit with Chromium.

This tests public website layout and preview *controls*, not the separately
deployed student application or claims about learning effectiveness.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT="http://127.0.0.1:8766"
OUT=Path("story-detail-audit-output")
WIDTHS=(320,375,768,1024,1440)

async def main():
    OUT.mkdir(exist_ok=True)
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        for width in WIDTHS:
            page=await browser.new_page(viewport={"width":width,"height":900},
                                        reduced_motion="reduce")
            try:
                response=await page.goto(ROOT+"/story-method.html",
                                         wait_until="load",timeout=25000)
                await page.evaluate("document.fonts.ready")
                await page.locator(".project-detail-figure img").evaluate(
                    """async img=>{img.loading='eager';await img.decode();}""")
                data=await page.evaluate("""() => {
                  const main=document.querySelector('main');
                  const q=s=>document.querySelector(s);
                  const r=e=>e.getBoundingClientRect();
                  const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
                  const internal=[...main.querySelectorAll('a[href^="#"]')];
                  const fig=q('.project-detail-figure');
                  const img=fig?.querySelector('img');
                  const mainNodes=[...main.querySelectorAll('h1,h2,h3,p,blockquote,li,figure,a.control,summary')];
                  const overflowing=mainNodes.filter(e=>r(e).width>0 &&
                    (r(e).left<-2 || r(e).right>innerWidth+2))
                    .map(e=>({element:e.tagName,text:e.textContent.trim().slice(0,50)}));
                  const font=q('.project-student-prompt');
                  const preview=q('[data-live-preview="story"]');
                  const footer=q('.site-footer');
                  const last=q('.project-return');
                  const screenshot=q('.project-detail-figure>a');
                  const technical=q('.project-technical-details');
                  return {
                    viewport:innerWidth, documentWidth:document.documentElement.scrollWidth,
                    mainCount:document.querySelectorAll('main').length,
                    h1:[...main.querySelectorAll('h1')].map(x=>x.textContent.trim()),
                    h2:[...main.querySelectorAll('h2')].map(x=>x.textContent.trim()),
                    unresolved:internal.map(a=>a.hash.slice(1)).filter(h=>!ids.includes(h)),
                    duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),
                    overflow:overflowing,
                    screenshot:{decoded:!!img&&img.complete&&img.naturalWidth>0,
                      width:img?.naturalWidth, height:img?.naturalHeight,
                      alt:img?.alt,caption:fig?.querySelector('figcaption')?.textContent.trim(),
                      linkLabel:screenshot?.getAttribute('aria-label')},
                    studentPromptFont:font?getComputedStyle(font).fontSize:null,
                    previewHasOpen:!!preview?.querySelector('[data-preview-open]'),
                    technicalSummary:technical?.querySelector('summary')?.textContent.trim(),
                    footerEmailHeight:r(q('.site-footer-inner p a')).height,
                    lastToFooter:Math.round(r(footer).top-r(last).bottom),
                    appearance:!!q('.moon-appearance-select')
                  };
                }""")
                failures=[]
                if response is None or response.status!=200:failures.append("Document did not return HTTP 200")
                if data["documentWidth"]>width:failures.append("Horizontal page overflow")
                if data["mainCount"]!=1 or data["h1"]!=["The Story Method"]:
                    failures.append("Main/H1 incorrect")
                if len(data["h2"])!=6:failures.append("Expected six section titles")
                if data["unresolved"] or data["duplicateIds"] or data["overflow"]:
                    failures.append("Anchor, ID or content overflow failure")
                if not (data["screenshot"]["decoded"] and
                        data["screenshot"]["alt"] and
                        data["screenshot"]["caption"] and
                        data["screenshot"]["linkLabel"]):
                    failures.append("Source figure missing/unnamed")
                if not data["previewHasOpen"] or not data["technicalSummary"]:
                    failures.append("Preview/technical details missing")
                if data["footerEmailHeight"]<24:
                    failures.append("Footer email target too small")
                if not 95<=data["lastToFooter"]<=105:
                    failures.append("Story detail footer gap differs from 100px")
                data.update({"page":"story-detail","violations":failures})
                results.append(data)
                await page.screenshot(path=str(OUT/f"story-{width}.png"),
                                      full_page=True,animations="disabled")
                print("STORY",width,"PASS" if not failures else failures,flush=True)
            except Exception as exc:
                results.append({"page":"story-detail","width":width,"error":str(exc)})
                print("STORY ERROR",width,str(exc),flush=True)
            finally:
                await page.close()

        page=await browser.new_page(viewport={"width":375,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(ROOT+"/story-method.html",wait_until="load",timeout=25000)
            await page.locator(".moon-appearance-select").select_option("dark")
            await page.wait_for_function(
                "document.documentElement.dataset.moonTheme==='dark'")
            await page.locator(".topbar .brand").focus()
            dark=await page.evaluate("""() => {
              const e=document.activeElement;
              const s=getComputedStyle(e);
              const scene=document.querySelector('.story-scene-note');
              const caption=document.querySelector('.project-interface-figure figcaption');
              return {theme:document.documentElement.dataset.moonTheme,
                brandFocus:e.matches(':focus-visible'),
                brandOutline:s.outlineColor,
                headerBackground:getComputedStyle(document.querySelector('.topbar')).backgroundColor,
                sceneBackground:getComputedStyle(scene).backgroundColor,
                sceneText:getComputedStyle(scene.querySelector('p:not(.meta)')).color,
                captionText:getComputedStyle(caption).color,
                pageWidth:document.documentElement.scrollWidth};
            }""")
            failures=[]
            if not dark["brandFocus"] or dark["brandOutline"]!="rgb(145, 219, 170)":
                failures.append("Dark keyboard focus outline invisible")
            if dark["pageWidth"]>375:failures.append("Dark layout overflow")
            results.append({"mode":"story-dark","width":375,**dark,
                            "violations":failures})
            await page.locator(".project-detail-figure img").evaluate(
                """async img=>{img.loading='eager';await img.decode();}""")
            await page.screenshot(path=str(OUT/"story-dark-375.png"),
                                  full_page=True,animations="disabled")
            print("STORY DARK","PASS" if not failures else failures,flush=True)
        except Exception as exc:
            results.append({"mode":"story-dark","error":str(exc)})
        finally:
            await page.close()

        # Verify keyboard navigation, frame controls and accordion.
        page=await browser.new_page(viewport={"width":375,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(ROOT+"/story-method.html",wait_until="load",
                            timeout=25000)
            await page.keyboard.press("Tab")
            first=await page.evaluate(
                "()=>document.activeElement.getAttribute('href')")
            await page.keyboard.press("Enter")
            skip=await page.evaluate("()=>document.activeElement.id")
            await page.locator('.article-jumps a[href="#story-practice"]').click()
            anchor=await page.evaluate("()=>location.hash")
            detail=page.locator(".project-technical-details")
            await detail.locator("summary").focus()
            await page.keyboard.press("Enter")
            expanded=await detail.evaluate("el=>el.open")
            panel=page.locator('[data-live-preview="story"]')
            opener=panel.locator('[data-preview-open]')
            await opener.click()
            iframe=panel.locator("iframe")
            frame=await iframe.evaluate("""el=>({
              title:el.title,
              path:new URL(el.src).pathname,
              query:new URL(el.src).search,
              sandbox:[...el.sandbox]
            })""")
            closeFocus=await panel.locator('[data-preview-close]').evaluate(
                "el=>el===document.activeElement")
            await panel.locator('[data-preview-device="phone"]').click()
            phone=await panel.locator("[data-preview-stage]").get_attribute(
                "data-device")
            await page.keyboard.press("Escape")
            restored=await opener.evaluate("el=>el===document.activeElement")
            removed=await iframe.count()==0
            problems=[]
            if first!="#main" or skip!="main" or anchor!="#story-practice":
                problems.append("Skip link or in-page navigation failure")
            if not expanded:problems.append("Technical disclosure did not expand")
            if frame["path"]!="/memory-palace-u1-8/" or frame["query"]!="?unit=unit-1":
                problems.append("Embedded app route incorrect")
            if not frame["title"] or not all(x in frame["sandbox"] for x in (
                "allow-scripts","allow-same-origin","allow-forms")):
                problems.append("Iframe title/sandbox incorrect")
            if not closeFocus or phone!="phone" or not restored or not removed:
                problems.append("Preview focus/device/Escape interaction failure")
            results.append({"mode":"story-keyboard","first":first,"skip":skip,
                            "anchor":anchor,"detailsExpanded":expanded,
                            "iframe":frame,"closeFocused":closeFocus,
                            "phone":phone,"focusRestored":restored,
                            "removed":removed,"violations":problems})
            print("STORY KEYBOARD","PASS" if not problems else problems,flush=True)
        except Exception as exc:
            results.append({"mode":"story-keyboard","error":str(exc)})
        finally:
            await page.close()

        # Readable focus and landmark names in Windows-style forced colours.
        for width in (375,1440):
            page=await browser.new_page(
                viewport={"width":width,"height":900},
                forced_colors="active",reduced_motion="reduce")
            try:
                await page.goto(ROOT+"/story-method.html",
                                wait_until="load",timeout=25000)
                await page.locator(".project-detail-figure>a").focus()
                data=await page.evaluate("""() => {
                    const e=document.activeElement,s=getComputedStyle(e);
                    return {forced:matchMedia('(forced-colors: active)').matches,
                        viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
                        focused:e.matches(':focus-visible'),
                        outline:s.outlineStyle,
                        linkLabel:e.getAttribute('aria-label')||'',
                        alt:document.querySelector('.project-detail-figure img')?.alt||'',
                        footerEmailHeight:document.querySelector('.site-footer-inner p a')
                          .getBoundingClientRect().height};
                }""")
                client=await page.context.new_cdp_session(page)
                nodes=(await client.send("Accessibility.getFullAXTree"))["nodes"]
                visible=[node for node in nodes if not node.get("ignored")]
                def names(role):
                    return [node.get("name",{}).get("value","")
                            for node in visible
                            if node.get("role",{}).get("value")==role]
                landmarks=names("navigation")
                unnamed=[name for name in names("link") if not name.strip()]
                failures=[]
                if not data["forced"] or data["documentWidth"]>width:
                    failures.append("Forced-colour mode missing or page overflows")
                if not data["focused"] or data["outline"]=="none":
                    failures.append("Forced-colour figure-link focus not visible")
                if not data["linkLabel"] or not data["alt"] or data["footerEmailHeight"]<24:
                    failures.append("Image/contact accessible description or target missing")
                for name in ("Primary navigation","Breadcrumb","On this project page",
                             "Additional links"):
                    if name not in landmarks:
                        failures.append("Missing accessible nav: "+name)
                if len(names("main"))!=1 or unnamed:
                    failures.append("Accessibility tree main/links invalid")
                if not any("How the release is checked" in str(
                        node.get("name",{}).get("value","")) for node in visible):
                    failures.append("Technical summary lacks accessible name")
                item={"mode":"story-forced-colors","viewport":width,**data,
                      "navNames":landmarks,"mainCount":len(names("main")),
                      "unnamedLinks":len(unnamed),"violations":failures}
                results.append(item)
                print("STORY FORCED",width,
                      "PASS" if not failures else failures,flush=True)
                if width==375:
                    await page.screenshot(path=str(OUT/"story-forced-375.png"),
                                          full_page=False,animations="disabled")
            except Exception as exc:
                results.append({"mode":"story-forced-colors","viewport":width,
                                "error":str(exc)})
                print("STORY FORCED ERROR",width,str(exc),flush=True)
            finally:
                await page.close()
        # A true paginated A4 document, not a full-height print screenshot.
        import fitz
        page=await browser.new_page(viewport={"width":1440,"height":900},
                                    reduced_motion="reduce")
        try:
            await page.goto(ROOT+"/story-method.html",wait_until="load",
                            timeout=25000)
            await page.locator(".project-detail-figure img").evaluate(
                """async img=>{img.loading='eager';await img.decode();}""")
            pdfbytes=await page.pdf(format="A4",print_background=True,
                display_header_footer=False,
                margin={"top":"12mm","bottom":"12mm",
                        "left":"12mm","right":"12mm"})
            (OUT/"story-A4.pdf").write_bytes(pdfbytes)
            disclosureRestored=not await page.locator(
                ".project-technical-details").evaluate("el=>el.open")
            pdf=fitz.open(stream=pdfbytes,filetype="pdf")
            texts=[x.get_text("text") for x in pdf]
            anchors=[
                ("The Story Method","I developed The Story Method"),
                ("Unit 1 journey example","The Evidence Lockdown"),
                ("Design decisions inside the journey",
                 "The journey follows a fixed route"),
                ("Returning to the science through practice",
                 "The journey introduces scientific ideas"),
                ("Released AP Biology content","AP Biology Units 1–8"),
                ("Application release and verification","The application repository")
            ]
            # Heading and opening content should share a printed sheet.
            separated=[head for head,opening in anchors if not any(
                head in text and opening in text for text in texts)]
            missing=[title for title in ("The Story Method",
                                        "Observation Window",
                                        "12.0 to 15.0",
                                        "Released AP Biology content",
                                        "The GitHub Pages release is assembled",
                                        "These checks concern the integrity")
                     if not any(title in t for t in texts)]
            problems=[]
            if separated:problems.append("Orphaned print headings: "+repr(separated))
            if missing:problems.append("Missing print content: "+repr(missing))
            if not disclosureRestored:
                problems.append("Print-disclosed technical notes did not restore screen state")
            if not 1<=len(pdf)<=8:problems.append("Unreasonable A4 page count")
            for i,leaf in enumerate(pdf):
                leaf.get_pixmap(matrix=fitz.Matrix(1.15,1.15)).save(
                    str(OUT/f"story-A4-{i+1}.png"))
            results.append({"mode":"story-A4","pages":len(pdf),
                            "separatedHeadings":separated,"missing":missing,
                            "textLengths":[len(x) for x in texts],
                            "technicalDetailsRestored":disclosureRestored,
                            "violations":problems})
            print("STORY A4","PASS" if not problems else problems,flush=True)
            pdf.close()
        except Exception as exc:
            results.append({"mode":"story-A4","error":str(exc)})
            print("STORY A4 ERROR",str(exc),flush=True)
        finally:
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,indent=2,ensure_ascii=False),
                                   encoding="utf-8")
    failed=[x for x in results if x.get("violations") or x.get("error")]
    if failed:
        print("STORY FAILURE",json.dumps(failed,ensure_ascii=False),flush=True)
        return 1
    print("Story detail audit passed.",flush=True)
    return 0

if __name__=="__main__":
    raise SystemExit(asyncio.run(main()))
