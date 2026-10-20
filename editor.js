/* Local-first visual editor for the public academic portfolio.
   Preview scripts never run. No credentials are collected or stored. */
(function () {
  "use strict";

  const EDITABLE = "h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,dt,dd,a,img,th,td";
  const TEXT_TAGS = new Set(["H1","H2","H3","H4","H5","H6","P","LI","FIGCAPTION","BLOCKQUOTE","DT","DD","A","TH","TD"]);
  const DRAFT_PREFIX = "moon-portfolio-visual-editor-v1:";
  const $ = id => document.getElementById(id);
  const state = {
    page:null,source:"",doc:null,frameDoc:null,original:new Map(),dirty:new Set(),
    selected:null,history:[],fingerprint:"",loadToken:0,saveTimer:null,silent:false
  };

  function hashText(text) {
    let n=2166136261;
    for (let i=0;i<text.length;i++) {
      n^=text.charCodeAt(i);
      n=Math.imul(n,16777619);
    }
    return (n>>>0).toString(16);
  }

  function notice(message,title) {
    $("noticeTitle").textContent=title||"Editor notice";
    $("noticeMessage").textContent=message;
    const dlg=$("noticeDialog");
    if (typeof dlg.showModal==="function") dlg.showModal();
    else alert(message);
  }

  function updateStatus(message) {
    $("editorSaveStatus").textContent=message;
    $("changeCount").textContent=state.dirty.size+" locally edited element"+(state.dirty.size===1?"":"s");
    $("exportBtn").disabled=!state.dirty.size;
    $("resetBtn").disabled=!state.dirty.size;
    $("undoBtn").disabled=!state.history.length;
  }

  function annotationId(i) {return "e"+i;}

  function initialIndex() {
    state.original.clear();
    const nodes=[...state.doc.querySelectorAll("body "+EDITABLE.replaceAll(",",",body "))];
    nodes.forEach((node,i)=>state.original.set(annotationId(i),node.outerHTML));
    nodes.forEach((node,i)=>node.setAttribute("data-editor-key",annotationId(i)));
  }

  function reindex() {
    const nodes=[...state.doc.querySelectorAll("body "+EDITABLE.replaceAll(",",",body "))];
    if (nodes.length!==state.original.size) {
      throw new Error("The edited block changed the number of editable elements. Undo that edit before exporting.");
    }
    nodes.forEach((node,i)=>node.setAttribute("data-editor-key",annotationId(i)));
  }

  function getWorking(key) {
    return state.doc?.querySelector('[data-editor-key="'+key+'"]')||null;
  }

  function clearMarkers(clone) {
    clone.removeAttribute("data-editor-key");
    clone.removeAttribute("contenteditable");
    for (const child of clone.querySelectorAll("[data-editor-key],[contenteditable]")) {
      child.removeAttribute("data-editor-key");
      child.removeAttribute("contenteditable");
    }
    return clone;
  }

  function cleanOuter(element) {
    return clearMarkers(element.cloneNode(true)).outerHTML;
  }

  function checkDangerousHtml(html) {
    return /<\s*(?:script|iframe|object|embed|form)\b|\bon(?:click|error|load|mouseover|focus)\s*=|(?:href|src)\s*=\s*["']?\s*(?:javascript|data):/i.test(html);
  }

  function updateDirty(key) {
    const el=getWorking(key);
    if (!el||!state.original.has(key)) return;
    const edited=cleanOuter(el);
    if (edited===state.original.get(key)) state.dirty.delete(key);
    else state.dirty.add(key);
    if (checkDangerousHtml(edited)) {
      updateStatus("Review required · Unsafe markup");
      return;
    }
    updateStatus("Local draft · Not published");
    scheduleDraft();
  }

  function snapshot() {
    return {html:state.doc.documentElement.outerHTML,dirty:[...state.dirty]};
  }

  function checkpoint() {
    if (!state.doc) return;
    const current=snapshot();
    const previous=state.history[state.history.length-1];
    if (previous&&previous.html===current.html) return;
    state.history.push(current);
    if (state.history.length>24) state.history.shift();
    updateStatus("Local draft · Not published");
  }

  function saveDraft() {
    if (!state.page||!state.doc) return;
    const items=[...state.dirty].map(id=>{
      const node=getWorking(id);
      return node?{id,markup:node.outerHTML}:null;
    }).filter(Boolean);
    const key=DRAFT_PREFIX+state.page;
    try {
      if (!items.length) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key,JSON.stringify({
          version:1,sourceHash:state.fingerprint,updated:Date.now(),items
        }));
      }
      updateStatus(items.length?"Draft saved in this browser · Not published":"No changes · Not published");
    } catch (e) {
      updateStatus("Draft storage unavailable · Export your HTML");
    }
  }

  function scheduleDraft() {
    clearTimeout(state.saveTimer);
    state.saveTimer=setTimeout(saveDraft,650);
  }

  function restoreDraft() {
    let raw;
    try { raw=localStorage.getItem(DRAFT_PREFIX+state.page); } catch(e) {return;}
    if (!raw) return;
    let draft;
    try { draft=JSON.parse(raw); } catch(e) {return;}
    if (draft.version!==1||!Array.isArray(draft.items)) return;
    if (draft.sourceHash!==state.fingerprint) {
      updateStatus("A previous draft exists for an older page version");
      return;
    }
    try {
      for (const item of draft.items) {
        if (!state.original.has(item.id)||checkDangerousHtml(item.markup)) continue;
        const destination=getWorking(item.id);
        if (!destination) continue;
        const holder=new DOMParser().parseFromString(item.markup,"text/html");
        const edited=holder.body.firstElementChild;
        if (!edited||edited.tagName!==destination.tagName) continue;
        edited.setAttribute("data-editor-key",item.id);
        destination.replaceWith(state.doc.importNode(edited,true));
        state.dirty.add(item.id);
      }
      reindex();
      for (const key of [...state.dirty]) {
        const node=getWorking(key);
        if (!node||cleanOuter(node)===state.original.get(key)) state.dirty.delete(key);
      }
      updateStatus(state.dirty.size?"Draft restored from this browser · Not published":"No changes · Not published");
    } catch(e) {
      notice("The saved draft could not be restored safely. The original page has been left available.","Draft mismatch");
    }
  }

  function previewMarkup() {
    const copy=state.doc.cloneNode(true);
    for (const element of copy.querySelectorAll("script,iframe,object,embed,form,base")) element.remove();
    const base=copy.createElement("base");
    base.setAttribute("href",new URL("./",location.href).href);
    copy.head.prepend(base);
    const overlay=copy.createElement("style");
    overlay.textContent=[
      "[data-editor-key]{cursor:text;outline-offset:3px;}",
      "[data-editor-key]:hover{outline:1px dashed #8d8d8d;}",
      '[data-editor-key][data-editor-selected]{outline:2px solid #2b8769!important;outline-offset:4px!important;}',
      "[data-editor-key][contenteditable=true]{min-height:1em;}",
      "[data-editor-key][contenteditable=true]:focus{outline:2px solid #2b8769!important;}",
      "@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}"
    ].join("\n");
    copy.head.appendChild(overlay);
    copy.documentElement.setAttribute("data-moon-theme",$("previewTheme").value);
    copy.documentElement.style.colorScheme=$("previewTheme").value;
    return "<!doctype html>\n"+copy.documentElement.outerHTML;
  }

  function renderPreview() {
    state.selected=null;
    $("selectionDetails").hidden=true;
    $("selectionEmpty").hidden=false;
    $("selectionTag").textContent="Nothing selected";
    const frame=$("pageFrame");
    frame.onload=function () {
      try {
        state.frameDoc=frame.contentDocument;
        const d=state.frameDoc;
        d.addEventListener("click",onPreviewClick,true);
        d.addEventListener("input",onPreviewInput,true);
        d.addEventListener("focusin",onPreviewFocus,true);
        d.addEventListener("paste",onPreviewPaste,true);
      } catch(e) {notice("The preview did not become editable. Please reload the editor.");}
    };
    frame.srcdoc=previewMarkup();
    updateOutline();
  }

  function onPreviewClick(event) {
    /* Stop navigation, but keep normal selection behaviour for editable text. */
    if (event.target.closest("a")) event.preventDefault();
    const node=event.target.closest("[data-editor-key]");
    if (!node) return;
    selectElement(node);
    if (TEXT_TAGS.has(node.tagName)) node.focus({preventScroll:true});
  }

  function onPreviewFocus(event) {
    if (!event.target.closest('[data-editor-key][contenteditable="true"]')) return;
    checkpoint();
  }

  function onPreviewPaste(event) {
    const editable=event.target.closest('[data-editor-key][contenteditable="true"]');
    if (!editable) return;
    event.preventDefault();
    const text=event.clipboardData?.getData("text/plain")||"";
    const selection=state.frameDoc.defaultView.getSelection();
    if (!selection||!selection.rangeCount) return;
    const range=selection.getRangeAt(0);
    range.deleteContents();
    const newNode=state.frameDoc.createTextNode(text);
    range.insertNode(newNode);
    range.setStartAfter(newNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    onPreviewInput({target:editable});
  }

  function onPreviewInput(event) {
    const edit=event.target.closest('[data-editor-key]');
    if (!edit) return;
    const key=edit.getAttribute("data-editor-key");
    const dst=getWorking(key);
    if (!dst) return;
    const html=edit.innerHTML;
    if (checkDangerousHtml(html)) {
      notice("This edit contains markup that cannot be exported. Paste ordinary text only.");
      return;
    }
    dst.innerHTML=html;
    updateDirty(key);
    if (state.selected===key) updateInspector(edit);
  }

  function selectElement(node) {
    if (!node) return;
    const previously=state.frameDoc.querySelector("[data-editor-selected]");
    if (previously) {
      previously.removeAttribute("data-editor-selected");
      previously.removeAttribute("contenteditable");
    }
    state.selected=node.getAttribute("data-editor-key");
    node.setAttribute("data-editor-selected","");
    if (TEXT_TAGS.has(node.tagName)) node.setAttribute("contenteditable","true");
    updateInspector(node);
  }

  function updateInspector(node) {
    $("selectionDetails").hidden=false;
    $("selectionEmpty").hidden=true;
    $("selectionTag").textContent=node.tagName.toLowerCase();
    const isImage=node.tagName==="IMG";
    const isLink=node.tagName==="A";
    $("imageFields").hidden=!isImage;
    $("linkFields").hidden=!isLink;
    $("selectionText").closest(".inspector-group").hidden=isImage;
    $("revertElementBtn").disabled=!state.dirty.has(state.selected);
    if (isImage) {
      $("imageSrc").value=node.getAttribute("src")||"";
      $("imageAlt").value=node.getAttribute("alt")||"";
    } else {
      $("selectionText").value=node.textContent;
      const rich=[...node.children].length>0;
      $("selectionText").readOnly=rich;
      $("richTextNote").textContent=rich?
        "This block contains links or formatting. Edit it directly in the preview to preserve them.":
        "Edit here or type directly in the selected text on the page.";
    }
    if (isLink) {
      $("linkHref").value=node.getAttribute("href")||"";
      $("linkTarget").value=node.getAttribute("target")==="_blank"?"new":"same";
    }
  }

  function safeUrl(value,kind) {
    const s=value.trim();
    if (!s||/[\u0000-\u001f]/.test(s)) return false;
    if (/^(?:javascript|data|vbscript|file):/i.test(s)) return false;
    if (s.startsWith("//")) return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) {
      return kind==="image"?/^https:\/\//i.test(s):/^(?:https?:|mailto:)/i.test(s);
    }
    return !/[<>"]/.test(s);
  }

  function updateSelectedAttribute(attribute,value) {
    if (!state.selected) return;
    const target=getWorking(state.selected);
    const preview=state.frameDoc.querySelector('[data-editor-key="'+state.selected+'"]');
    if (!target||!preview) return;
    if (attribute==="src"||attribute==="href") {
      if (!safeUrl(value,attribute==="src"?"image":"link")) {
        notice("Enter a safe relative address or an HTTPS URL. JavaScript and data URLs are not allowed.","Invalid URL");
        return;
      }
    }
    checkpoint();
    if (value) {target.setAttribute(attribute,value);preview.setAttribute(attribute,value);}
    else {target.removeAttribute(attribute);preview.removeAttribute(attribute);}
    if (attribute==="target") {
      if (value==="_blank") {
        target.setAttribute("rel","noopener noreferrer");
        preview.setAttribute("rel","noopener noreferrer");
      } else {
        target.removeAttribute("rel");
        preview.removeAttribute("rel");
      }
    }
    updateDirty(state.selected);
    updateInspector(preview);
  }

  function onInspectorText() {
    if (!state.selected) return;
    const el=state.frameDoc.querySelector('[data-editor-key="'+state.selected+'"]');
    const work=getWorking(state.selected);
    if (!el||!work||$("selectionText").readOnly||el.tagName==="IMG") return;
    el.textContent=$("selectionText").value;
    work.textContent=$("selectionText").value;
    updateDirty(state.selected);
  }

  function updateOutline() {
    const nav=$("outline");
    nav.replaceChildren();
    const headings=state.doc.querySelectorAll("main h1,main h2,main h3");
    for (const h of headings) {
      const b=document.createElement("button");
      b.type="button";
      b.dataset.level=h.tagName.slice(1);
      b.textContent=(h.textContent||h.tagName).trim().slice(0,100);
      b.addEventListener("click",()=>{
        const key=h.getAttribute("data-editor-key");
        const match=state.frameDoc?.querySelector('[data-editor-key="'+key+'"]');
        if (match) {match.scrollIntoView({block:"center",behavior:"smooth"});selectElement(match);}
      });
      nav.appendChild(b);
    }
    if (!nav.children.length) nav.textContent="No section headings found.";
  }

  function cleanEditedElement(markup) {
    const parsed=new DOMParser().parseFromString(markup,"text/html");
    const node=parsed.body.firstElementChild;
    if (!node||checkDangerousHtml(markup)) throw new Error("Potentially unsafe markup in edited element.");
    return cleanOuter(node);
  }

  function buildExport() {
    let next=state.source;
    const toExport=[...state.dirty].filter(key=>{
      const node=getWorking(key);
      if (!node) return false;
      const parent=node.parentElement?.closest("[data-editor-key]");
      return !parent||!state.dirty.has(parent.getAttribute("data-editor-key"));
    });
    const ops=toExport.map(key=>({
      key,before:state.original.get(key),after:cleanEditedElement(getWorking(key).outerHTML)
    }));
    for (const op of ops) {
      if (!op.before) throw new Error("A changed block has lost its original markup.");
      let before=op.before,after=op.after;
      let pos=next.indexOf(before);
      if (pos<0) {
        /* Browsers normalize whitespace within multiline opening tags.
           A unique inner-HTML match preserves the original tag verbatim. */
        const originalNode=new DOMParser().parseFromString(op.before,"text/html").body.firstElementChild;
        const editedNode=new DOMParser().parseFromString(op.after,"text/html").body.firstElementChild;
        if (originalNode&&editedNode&&originalNode.innerHTML) {
          before=originalNode.innerHTML;
          after=editedNode.innerHTML;
          pos=next.indexOf(before);
        }
      }
      if (pos<0) {
        /* Images are void elements. Their attributes can be written safely
           when the original image can be identified uniquely by source and alt. */
        const beforeNode=new DOMParser().parseFromString(op.before,"text/html").body.firstElementChild;
        const afterNode=new DOMParser().parseFromString(op.after,"text/html").body.firstElementChild;
        if (beforeNode?.tagName==="IMG"&&afterNode?.tagName==="IMG") {
          const candidates=[...next.matchAll(/<img\b[^>]*>/gi)].filter(match=>{
            const candidate=new DOMParser().parseFromString(match[0],"text/html").body.firstElementChild;
            return candidate?.getAttribute("src")===beforeNode.getAttribute("src")&&
              candidate?.getAttribute("alt")===beforeNode.getAttribute("alt");
          });
          if (candidates.length===1) {
            const image=candidates[0];
            next=next.slice(0,image.index)+afterNode.outerHTML+next.slice(image.index+image[0].length);
            continue;
          }
        }
      }
      if (pos<0) throw new Error("The page source cannot uniquely locate element "+op.key+". No HTML has been exported.");
      if (next.indexOf(before,pos+before.length)>=0) throw new Error("Element "+op.key+" has identical source duplicates. Review this change manually.");
      next=next.slice(0,pos)+after+next.slice(pos+before.length);
    }
    if (next===state.source) throw new Error("There are no exportable changes.");
    return next;
  }

  function exportHtml() {
    try {
      const result=buildExport();
      const blob=new Blob([result],{type:"text/html;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");
      link.href=url;
      link.download=state.page;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
      updateStatus("Edited HTML exported · Not published");
    } catch(e) {
      notice(e.message||"Could not export this page safely.","Export stopped");
    }
  }

  function undo() {
    const last=state.history.pop();
    if (!last) return;
    state.doc=new DOMParser().parseFromString(last.html,"text/html");
    state.dirty=new Set(last.dirty);
    renderPreview();
    scheduleDraft();
    updateStatus("Previous edit restored · Not published");
  }

  function resetPage() {
    if (!state.doc||!confirm("Discard all local changes to this page?")) return;
    state.doc=new DOMParser().parseFromString(state.source,"text/html");
    initialIndex();
    state.dirty.clear();
    state.history.length=0;
    renderPreview();
    saveDraft();
  }

  function revertSelected() {
    const key=state.selected;
    if (!key||!state.dirty.has(key)) return;
    const node=getWorking(key);
    const sourceMarkup=state.original.get(key);
    if (!node||!sourceMarkup) return;
    checkpoint();
    const parsed=new DOMParser().parseFromString(sourceMarkup,"text/html");
    const replacement=parsed.body.firstElementChild;
    if (!replacement||node.tagName!==replacement.tagName) return;
    node.replaceWith(state.doc.importNode(replacement,true));
    try {reindex();} catch(e) {undo();notice(e.message,"Revert stopped");return;}
    state.dirty.delete(key);
    for (const id of [...state.dirty]) {
      const edited=getWorking(id);
      if (!edited||cleanOuter(edited)===state.original.get(id)) state.dirty.delete(id);
    }
    renderPreview();
    scheduleDraft();
    updateStatus("Element reverted · Not published");
  }

  async function loadPage(page) {
    if (!/^[a-z0-9-]+\.html$/.test(page)) return;
    if (state.doc) saveDraft();
    const token=++state.loadToken;
    updateStatus("Loading page…");
    $("previewHeading").textContent=$("pagePicker").selectedOptions[0]?.textContent||page;
    try {
      const response=await fetch(page,{cache:"no-store",credentials:"same-origin"});
      if (!response.ok) throw new Error("HTTP "+response.status);
      const source=await response.text();
      if (token!==state.loadToken) return;
      if (!/<main\b/i.test(source)) throw new Error("The requested page has no main region.");
      state.page=page;
      state.source=source;
      state.fingerprint=hashText(source);
      state.doc=new DOMParser().parseFromString(source,"text/html");
      state.dirty.clear();
      state.history.length=0;
      initialIndex();
      restoreDraft();
      renderPreview();
      updateStatus(state.dirty.size?"Draft restored · Not published":"Ready to edit · Not published");
    } catch(e) {
      notice("Could not load "+page+". "+e.message,"Page load failed");
      updateStatus("Unable to load page");
    }
  }

  function init() {
    $("pagePicker").addEventListener("change",event=>loadPage(event.target.value));
    $("previewViewport").addEventListener("change",event=>{
      $("previewContainer").className="preview-frame-container "+event.target.value;
    });
    $("previewTheme").addEventListener("change",event=>{
      if (state.frameDoc) {
        state.frameDoc.documentElement.setAttribute("data-moon-theme",event.target.value);
        state.frameDoc.documentElement.style.colorScheme=event.target.value;
      }
    });
    $("selectionText").addEventListener("focus",checkpoint);
    $("selectionText").addEventListener("input",onInspectorText);
    $("imageSrc").addEventListener("change",event=>updateSelectedAttribute("src",event.target.value));
    $("imageAlt").addEventListener("change",event=>updateSelectedAttribute("alt",event.target.value));
    $("linkHref").addEventListener("change",event=>updateSelectedAttribute("href",event.target.value));
    $("linkTarget").addEventListener("change",event=>updateSelectedAttribute("target",event.target.value==="new"?"_blank":""));
    $("undoBtn").addEventListener("click",undo);
    $("resetBtn").addEventListener("click",resetPage);
    $("revertElementBtn").addEventListener("click",revertSelected);
    $("exportBtn").addEventListener("click",exportHtml);
    window.addEventListener("beforeunload",()=>{if (state.page) saveDraft();});
    loadPage($("pagePicker").value);
  }

  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();