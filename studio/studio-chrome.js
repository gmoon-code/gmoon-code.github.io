/* Shared header and footer editing. Changes are staged and published atomically
   with the website's existing GitHub-based draft/publish workflow. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI,plus=window.WebsiteStudioPlus;
  if(!api||!plus)return;
  const {state,docOf,ensureDraft,toast}=api;
  const defaults={
    brand:"Ye Eun Moon",
    footerIntro:"If something here brings up a question, you're welcome to",
    footerLinkText:"write to me",
    footerEnding:".",
    email:"gracem.0691@gmail.com",
    externalLabel:"ORCID",
    externalUrl:"https://orcid.org/0009-0005-0584-5146"
  };
  let settings={...defaults};
  const btn=document.createElement("button");
  btn.type="button";btn.id="siteChromeBtn";btn.className="plain-button";
  btn.textContent="Header & footer";
  btn.title="Edit the shared site title, contact text and footer link across every page";
  document.getElementById("siteLookBtn")?.after(btn);
  const dialog=document.createElement("dialog");
  dialog.id="siteChromeDialog";dialog.className="studio-dialog site-chrome-dialog";
  dialog.setAttribute("aria-labelledby","siteChromeTitle");
  dialog.innerHTML=[
    '<div class="dialog-heading"><h2 id="siteChromeTitle">Header & footer</h2>',
    '<button type="button" id="closeSiteChrome" class="plain-button">Close</button></div>',
    '<p class="micro-help">Changes appear across your public pages when you publish. Menu links are edited in Navigation.</p>',
    '<label for="chromeBrand">Website title in the header</label>',
    '<input type="text" id="chromeBrand" maxlength="100">',
    '<fieldset class="chrome-footer-fields"><legend>Footer contact</legend>',
    '<label for="chromeIntro">Text before the email link</label>',
    '<textarea id="chromeIntro" rows="2" maxlength="280"></textarea>',
    '<label for="chromeLinkText">Email link label</label>',
    '<input type="text" id="chromeLinkText" maxlength="100">',
    '<label for="chromeEnding">Text after the email link</label>',
    '<input type="text" id="chromeEnding" maxlength="100">',
    '<label for="chromeEmail">Public contact email address</label>',
    '<input type="email" id="chromeEmail" maxlength="254"></fieldset>',
    '<fieldset class="chrome-footer-fields"><legend>Additional footer link</legend>',
    '<label for="chromeExternalLabel">Link text</label>',
    '<input type="text" id="chromeExternalLabel" maxlength="90">',
    '<label for="chromeExternalUrl">Website URL</label>',
    '<input type="url" id="chromeExternalUrl" maxlength="500"></fieldset>',
    '<p id="siteChromeError" class="error-message" role="alert" hidden></p>',
    '<div class="dialog-actions">',
    '<button type="button" id="cancelSiteChrome" class="plain-button">Cancel</button>',
    '<button type="button" id="applySiteChrome" class="primary-button">Apply to draft</button>',
    '</div>'
  ].join("");
  document.body.appendChild(dialog);
  const el=id=>document.getElementById(id);
  const fields={
    brand:"chromeBrand",footerIntro:"chromeIntro",
    footerLinkText:"chromeLinkText",footerEnding:"chromeEnding",
    email:"chromeEmail",externalLabel:"chromeExternalLabel",
    externalUrl:"chromeExternalUrl"
  };
  function cleanText(value){return String(value||"").replace(/[\r\n\t]+/g," ").replace(/\s+/g," ").trim()}
  function configFromInputs(){
    const obj={};
    for(const key of Object.keys(defaults)){
      obj[key]=cleanText(el(fields[key])?.value);
    }
    if(!obj.brand||!obj.footerIntro||!obj.footerLinkText||!obj.email||!obj.externalLabel||
      !obj.externalUrl)throw Error("Please fill in the website title, contact and link fields.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email))throw Error("Enter a valid contact email address.");
    try{
      const url=new URL(obj.externalUrl);
      if(url.protocol!=="https:"&&url.protocol!=="http:")throw Error();
    }catch(e){throw Error("Enter a complete http or https link for the footer.");}
    return obj;
  }
  function applyToDocument(doc,values){
    if(!doc||!values)return false;
    let changed=false;
    const brand=doc.querySelector("header.topbar a.brand");
    if(brand&&brand.textContent!==values.brand){brand.textContent=values.brand;changed=true;}
    const footer=doc.querySelector("footer.site-footer");
    const paragraph=footer?.querySelector(".site-footer-inner > p");
    if(paragraph){
      const email=doc.createElement("a");
      email.href="mailto:"+values.email;
      email.textContent=values.footerLinkText;
      const before=paragraph.innerHTML;
      paragraph.replaceChildren(doc.createTextNode(values.footerIntro+" "),email,
        doc.createTextNode(values.footerEnding));
      if(paragraph.innerHTML!==before)changed=true;
    }
    const ext=footer?.querySelector("nav.site-footer-links a[href^='http']");
    if(ext){
      if(ext.textContent!==values.externalLabel){ext.textContent=values.externalLabel;changed=true;}
      if(ext.getAttribute("href")!==values.externalUrl){ext.setAttribute("href",values.externalUrl);changed=true;}
    }
    return changed;
  }
  async function open(){
    if(!state.connected)return;
    try{
      const draft=await ensureDraft("studio/site-chrome.json");
      settings={...defaults,...JSON.parse(draft.html)};
    }catch(e){settings={...defaults};}
    for(const [key,value] of Object.entries(settings)){
      if(el(fields[key]))el(fields[key]).value=value;
    }
    el("siteChromeError").hidden=true;
    dialog.showModal();
  }
  async function apply(){
    let next;
    try{next=configFromInputs();}
    catch(e){el("siteChromeError").textContent=e.message;el("siteChromeError").hidden=false;return;}
    const draft=await ensureDraft("studio/site-chrome.json");
    draft.html=JSON.stringify(next,null,2)+"\n";
    draft.dirty=draft.html!==draft.savedHtml;
    settings=next;
    if(applyToDocument(docOf(),settings))api.syncCurrent();
    else{api.updateStatus();plus.onChanged?.();}
    dialog.close();
    toast("Header and footer updated in your draft. Publish to apply across the website.");
  }
  btn.addEventListener("click",()=>open().catch(e=>toast(e.message,true)));
  el("closeSiteChrome").addEventListener("click",()=>dialog.close());
  el("cancelSiteChrome").addEventListener("click",()=>dialog.close());
  el("applySiteChrome").addEventListener("click",()=>apply().catch(e=>toast(e.message,true)));
  const earlierBeforePublish=plus.beforePublish;
  plus.beforePublish=async()=>{
    await earlierBeforePublish?.();
    const source=state.drafts.get("studio/site-chrome.json");
    if(!source?.dirty)return;
    const values={...defaults,...JSON.parse(source.html)};
    const pages=(state.manifest?.pages||[]).map(p=>p.path)
      .filter(p=>/^[a-z0-9][a-z0-9-]*\.html$/.test(p));
    for(const path of new Set([...pages,"404.html"])){
      if(state.deleted.has(path))continue;
      let draft;
      try{draft=await ensureDraft(path)}
      catch(e){if(path==="404.html")continue;throw e;}
      const doc=new DOMParser().parseFromString(draft.html,"text/html");
      if(!applyToDocument(doc,values))continue;
      draft.html="<!doctype html>\n"+doc.documentElement.outerHTML+"\n";
      draft.dirty=draft.isNew||draft.html!==draft.savedHtml;
    }
    api.updateStatus();
    plus.onChanged?.();
  };
  // Apply an unsaved shared layout change in the preview when switching pages.
  function onPreviewReady(){
    const draft=state.drafts.get("studio/site-chrome.json");
    if(!draft?.dirty)return;
    try{settings={...defaults,...JSON.parse(draft.html)}}
    catch(e){return}
    applyToDocument(docOf(),settings);
  }
  window.WebsiteStudioChrome={onPreviewReady};
})();