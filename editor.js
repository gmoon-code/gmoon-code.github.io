/* Local-first visual editor for the public academic portfolio.
   Preview scripts never run. No credentials are collected or stored. */
(function () {
  "use strict";

  const EDITABLE = "h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,dt,dd,a,img,th,td";
  const TEXT_TAGS = new Set(["H1","H2","H3","H4","H5","H6","P","LI","FIGCAPTION","BLOCKQUOTE","DT","DD","A","TH","TD"]);
  const DRAFT_PREFIX = "moon-portfolio-visual-editor-v1:";
  const PUBLISH_CONFIG=window.MoonEditorPublisherConfig||{};
  const publisher={session:null,login:"",busy:false};
  function publisherEndpoint() {
    try {
      const base=new URL(String(PUBLISH_CONFIG.apiBase||""));
      if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash)return "";
      return base.href.replace(/\/$/,"");
    } catch{return "";}
  }
  function publisherConfigured() {
    return !!(publisherEndpoint()&&/^[A-Za-z0-9_-]+$/.test(PUBLISH_CONFIG.clientId||""));
  }
  function updatePublishControls() {
    $("publisherConnect").disabled=!publisherConfigured()||publisher.busy;
    $("publisherSummary").disabled=!publisher.session||publisher.busy;
    const moved=state.sectionOrder.some((id,i)=>id!==state.originalSections[i]);
    $("publisherPropose").disabled=!publisher.session||publisher.busy||
      (!state.dirty.size&&!moved&&!layoutGroups().length&&!state.additions.length&&!state.removals.length)||!$("publisherSummary").value.trim();
  }
  function publishMessage(text) {
    $("publisherStatus").textContent=text;
  }

  const $ = id => document.getElementById(id);
  const state = {
    page:null,source:"",doc:null,frameDoc:null,original:new Map(),dirty:new Set(),
    selected:null,history:[],redo:[],fingerprint:"",loadToken:0,saveTimer:null,staleDraft:false,
    originalSections:[],sectionGroups:[],sectionOrder:[],mediaAssets:null,mediaPromise:null,
    stagedMedia:null,responsiveGroup:null,responsiveGroups:[],additions:[],resizeStart:null,imageSliderActive:false,
    pageFindKeys:[],pageFindIndex:-1,mediaChooseInsert:false,removals:[],selectedAddition:null
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

  function layoutGroups(){
    return state.responsiveGroups.length?state.responsiveGroups:(state.responsiveGroup?[state.responsiveGroup]:[]);
  }
  function layoutCss(doc){
    return MoonResponsiveLayout.cssForGroups(doc,layoutGroups());
  }
  function updateStatus(message) {
    $("editorSaveStatus").textContent=message;
    const moved=state.sectionOrder.filter((id,i)=>id!==state.originalSections[i]).length;
    const total=state.dirty.size+moved+layoutGroups().length+state.additions.length+state.removals.length;
    $("changeCount").textContent=state.dirty.size+" edited element"+(state.dirty.size===1?"":"s")+
      (moved?" · "+moved+" moved section"+(moved===1?"":"s"):"")+
      (layoutGroups().length?" · "+layoutGroups().length+" responsive layout group"+(layoutGroups().length===1?"":"s"):"")+
      (state.additions.length?" · "+state.additions.length+" added content block"+(state.additions.length===1?"":"s"):"")+
      (state.removals.length?" · "+state.removals.length+" removed block"+(state.removals.length===1?"":"s"):"");
    $("exportBtn").disabled=!total;
    $("reviewBtn").disabled=!total;
    $("resetBtn").disabled=!total;
    $("undoBtn").disabled=!state.history.length;
    $("redoBtn").disabled=!state.redo.length;
    updatePublishControls();
  }

  function annotationId(i) {return "e"+i;}

  function initialIndex() {
    state.original.clear();
    const nodes=[...state.doc.querySelectorAll("body "+EDITABLE.replaceAll(",",",body "))];
    nodes.forEach((node,i)=>state.original.set(annotationId(i),node.outerHTML));
    nodes.forEach((node,i)=>node.setAttribute("data-editor-key",annotationId(i)));
    const main=state.doc.querySelector("main");
    const sections=[...main.children].filter(element=>element.tagName==="SECTION");
    state.originalSections=sections.map((_,i)=>"s"+i);
    sections.forEach((element,i)=>element.setAttribute("data-editor-section","s"+i));
    state.sectionOrder=state.originalSections.slice();
    state.sectionGroups=[];
    let group=[];
    for(const child of main.children){
      if(child.tagName==="SECTION"){
        group.push(child.getAttribute("data-editor-section"));
      }else if(group.length){
        state.sectionGroups.push(group);
        group=[];
      }
    }
    if(group.length)state.sectionGroups.push(group);
    /* Section moves on pages with a table of contents would leave its
       navigational order stale. Lock those pages until the two can be
       updated as one reviewed operation. */
    if(main.querySelector('nav a[href^="#"]')){
      state.sectionGroups=state.originalSections.map(id=>[id]);
    }
  }

  function reindex() {
    const nodes=[...state.doc.querySelectorAll("body "+EDITABLE.replaceAll(",",",body "))];
    if (nodes.length!==state.original.size) {
      throw new Error("The edited block changed the number of editable elements. Undo that edit before exporting.");
    }
    const seen=new Set(nodes.map(element=>element.getAttribute("data-editor-key")));
    if(seen.size!==nodes.length||!nodes.every(element=>seen.has(element.getAttribute("data-editor-key"))&&state.original.has(element.getAttribute("data-editor-key")))){
      throw new Error("The element identifiers changed unexpectedly. Export has been stopped.");
    }
  }

  function getWorking(key) {
    return state.doc?.querySelector('[data-editor-key="'+key+'"]')||null;
  }

  function clearMarkers(clone) {
    clone.removeAttribute("data-editor-key");
    clone.removeAttribute("contenteditable");
    clone.removeAttribute("data-editor-selected");
    clone.removeAttribute("data-editor-section");
    for (const child of clone.querySelectorAll("[data-editor-key],[contenteditable],[data-editor-selected],[data-editor-section]")) {
      child.removeAttribute("data-editor-key");
      child.removeAttribute("contenteditable");
      child.removeAttribute("data-editor-selected");
      child.removeAttribute("data-editor-section");
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
    return {html:state.doc.documentElement.outerHTML,dirty:[...state.dirty],
      order:state.sectionOrder.slice(),responsiveGroup:state.responsiveGroup,responsiveGroups:state.responsiveGroups.slice(),additions:state.additions.map(x=>({...x})),removals:state.removals.map(x=>({...x}))};
  }

  function checkpoint() {
    if (!state.doc) return;
    const current=snapshot();
    const previous=state.history[state.history.length-1];
    if (previous&&JSON.stringify(previous)===JSON.stringify(current)) return;
    state.redo.length=0;
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
      const orderChanged=state.sectionOrder.some((id,i)=>id!==state.originalSections[i]);
      if (!items.length&&!orderChanged&&!layoutGroups().length&&!state.additions.length&&!state.removals.length) {
        if (state.staleDraft) return;
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key,JSON.stringify({
          version:1,sourceHash:state.fingerprint,updated:Date.now(),items,
          sectionOrder:state.sectionOrder.slice(),responsiveGroup:state.responsiveGroup,responsiveGroups:state.responsiveGroups,additions:state.additions,removals:state.removals
        }));
      }
      updateStatus(items.length||orderChanged||layoutGroups().length||state.additions.length||state.removals.length?"Draft saved in this browser · Not published":"No changes · Not published");
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
      state.staleDraft=true;
      updateStatus("Older local draft exists · Not applied");
      return;
    }
    const stagedMarkup=draft.items.some(item=>typeof item.markup==="string"&&
      /assets\/editor-[a-z0-9-]+\.(?:png|jpg|webp)/i.test(item.markup));
    if(stagedMarkup){
      $("stagedImageStatus").textContent=
        "This draft references an uploaded image whose binary file was not retained after reload. Select the image on the page and stage its file again.";
    }
    try {
      const incoming=Array.isArray(draft.responsiveGroups)&&draft.responsiveGroups.length?
        draft.responsiveGroups:(draft.responsiveGroup?[draft.responsiveGroup]:[]);
      if(incoming.length){
        if(!window.MoonResponsiveLayout)throw Error('Responsive layout validator missing');
        MoonResponsiveLayout.verifyGroups(new DOMParser().parseFromString(state.source,'text/html'),incoming);
        state.responsiveGroups=incoming.slice();
        state.responsiveGroup=incoming.length===1?incoming[0]:null;
      }
      if(Array.isArray(draft.additions)&&draft.additions.length){
        state.additions=validateParagraphAdditions(draft.additions);
      }
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
      if(Array.isArray(draft.sectionOrder)&&draft.sectionOrder.length)
        applySectionOrder(draft.sectionOrder);
      for (const key of [...state.dirty]) {
        const node=getWorking(key);
        if (!node||cleanOuter(node)===state.original.get(key)) state.dirty.delete(key);
      }
      if(Array.isArray(draft.removals)&&draft.removals.length)
        state.removals=validateSourceRemovals(draft.removals);
      updateStatus(state.dirty.size||state.removals.length?"Draft restored from this browser · Not published":"No changes · Not published");
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
    if(layoutGroups().length){
      const original=new DOMParser().parseFromString(state.source,'text/html');
      const css=layoutCss(original);
      const style=copy.createElement('style');style.id='moon-responsive-group-layout';
      style.textContent=css;copy.head.append(style);
    }
    const additionsByAnchor=new Map();
    state.additions.forEach((addition,index)=>{
      if(!additionsByAnchor.has(addition.selector))additionsByAnchor.set(addition.selector,[]);
      const inserted=createAdditionElement(copy,addition);
      inserted.setAttribute("data-editor-added-index",String(index));
      additionsByAnchor.get(addition.selector).push(inserted);
    });
    for(const [selector,elements] of additionsByAnchor){
      const matches=[...copy.querySelectorAll('main '+selector)];
      if(matches.length!==1)throw Error('Content insertion source is missing');
      matches[0].after(...elements);
    }
    for(const removal of state.removals){
      const target=copy.querySelector('[data-editor-key="'+removal.key+'"]');
      if(!target)throw Error("Removed source element is missing");
      target.remove();
    }
    const overlay=copy.createElement("style");
    overlay.textContent=[
      "[data-editor-key]{cursor:text;outline-offset:3px;}",
      '[data-editor-added-index]{cursor:pointer;outline-offset:3px;}',
      '[data-editor-added-index]:hover{outline:1px dashed #8d8d8d;}',
      '[data-editor-added-index][data-editor-added-selected]{outline:2px solid #35745c!important;outline-offset:4px!important;}',
      "[data-editor-key]:hover{outline:1px dashed #8d8d8d;}",
      '[data-editor-key][data-editor-selected]{outline:2px solid #2b8769!important;outline-offset:4px!important;}',
      '[data-editor-key][data-editor-find-match]{box-shadow:inset 0 -3px #f7c85e!important;}',
      '[data-editor-key][data-editor-find-active]{outline:3px solid #b15b16!important;outline-offset:5px!important;}',
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
    state.selectedAddition=null;
    $("addedBlockDetails").hidden=true;
    $("selectionDetails").hidden=true;
    $("selectionEmpty").hidden=false;
    $("selectionTag").textContent="Nothing selected";
    const frame=$("pageFrame");
    frame.onload=function () {
      try {
        state.frameDoc=frame.contentDocument;
        const d=state.frameDoc;
        d.documentElement.setAttribute("data-moon-theme",$("previewTheme").value);
        d.documentElement.style.colorScheme=$("previewTheme").value;
        updateStagedPreview();
        d.addEventListener("click",onPreviewClick,true);
        d.addEventListener("input",onPreviewInput,true);
        d.addEventListener("focusin",onPreviewFocus,true);
        d.addEventListener("paste",onPreviewPaste,true);
        d.addEventListener("scroll",positionImageResizeHandle,true);
        d.defaultView.addEventListener("resize",positionImageResizeHandle);
        refreshPageFind();
      } catch(e) {notice("The preview did not become editable. Please reload the editor.");}
    };
    frame.srcdoc=previewMarkup();
    updateOutline();
    updateSectionList();
  }


  // Search never touches state.doc. Result highlights and selection markers
  // exist only in the sandboxed, script-disabled iframe preview.
  function refreshPageFind(reset=false){
    const query=$("pageFindQuery").value.trim().toLocaleLowerCase();
    const list=$("pageFindResults");
    list.replaceChildren();
    const doc=state.frameDoc;
    const former=state.pageFindKeys[state.pageFindIndex];
    state.pageFindKeys=[];
    if(reset)state.pageFindIndex=-1;
    if(!doc||!doc.querySelector("main")){
      $("pageFindStatus").textContent="Load a page to search its editable elements.";
      for(const id of ["pageFindNext","pageFindPrev","pageFindClear"])$(id).disabled=true;
      return;
    }
    for(const node of doc.querySelectorAll("[data-editor-find-match],[data-editor-find-active]")){
      node.removeAttribute("data-editor-find-match");
      node.removeAttribute("data-editor-find-active");
    }
    const all=[...doc.querySelectorAll("main [data-editor-key]")];
    const hits=!query?[]:all.filter(node=>{
      const value=node.tagName==="IMG"?(node.getAttribute("alt")||""):node.textContent||"";
      if(!value.toLocaleLowerCase().includes(query))return false;
      return ![...node.querySelectorAll("[data-editor-key]")].some(child=>
        (child.tagName==="IMG"?(child.getAttribute("alt")||""):child.textContent||"")
          .toLocaleLowerCase().includes(query));
    });
    const limited=hits.slice(0,80);
    state.pageFindKeys=limited.map(node=>node.getAttribute("data-editor-key"));
    state.pageFindIndex=!limited.length?-1:!reset&&state.pageFindKeys.includes(former)?
      state.pageFindKeys.indexOf(former):0;
    limited.forEach((node,index)=>{
      node.setAttribute("data-editor-find-match","");
      const button=document.createElement("button");
      button.type="button";
      const content=(node.tagName==="IMG"?node.getAttribute("alt")||"Image":node.textContent||"")
        .trim().replace(/\\s+/g," ");
      button.textContent=node.tagName.toLowerCase()+" · "+(content.slice(0,98)||"Untitled")+
        (content.length>98?"…":"");
      button.setAttribute("aria-current",String(index===state.pageFindIndex));
      button.addEventListener("click",()=>choosePageFind(index));
      if(index<30)list.append(button);
    });
    const count=hits.length;
    $("pageFindStatus").textContent=!query?"Find headings, paragraphs, links and image descriptions within the page.":
      count?count+" matching element"+(count===1?"":"s")+
        (count>80?" · first 80 available":"")+" · "+(state.pageFindIndex+1)+" of "+limited.length:
        "No matching editable elements on this page.";
    $("pageFindNext").disabled=limited.length<2;
    $("pageFindPrev").disabled=limited.length<2;
    $("pageFindClear").disabled=!query;
    const active=doc.querySelector('[data-editor-key="'+state.pageFindKeys[state.pageFindIndex]+'"]');
    if(active)active.setAttribute("data-editor-find-active","");
  }
  function choosePageFind(index){
    const keys=state.pageFindKeys;
    if(!keys.length||index<0||index>=keys.length||!state.frameDoc)return;
    state.pageFindIndex=index;
    const node=state.frameDoc.querySelector('[data-editor-key="'+keys[index]+'"]');
    if(!node)return;
    for(const marked of state.frameDoc.querySelectorAll("[data-editor-find-active]"))
      marked.removeAttribute("data-editor-find-active");
    node.setAttribute("data-editor-find-active","");
    selectElement(node);
    node.scrollIntoView({block:"center",inline:"nearest"});
    for(const [i,button] of [...$("pageFindResults").children].entries())
      button.setAttribute("aria-current",String(i===index));
    const q=$("pageFindQuery").value.trim();
    $("pageFindStatus").textContent=keys.length+" results · selected "+(index+1)+" of "+keys.length+
      " for “"+q.slice(0,80)+"”";
  }
  function navigatePageFind(direction){
    if(!state.pageFindKeys.length)return;
    const next=(state.pageFindIndex+direction+state.pageFindKeys.length)%state.pageFindKeys.length;
    choosePageFind(next);
  }

  function onPreviewClick(event) {
    /* Stop navigation, but keep normal selection behaviour for editable text. */
    if (event.target.closest("a")) event.preventDefault();
    const added=event.target.closest("[data-editor-added-index]");
    if(added){
      selectAddedBlock(Number(added.getAttribute("data-editor-added-index")));
      return;
    }
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
    if($("pageFindQuery").value.trim())refreshPageFind();
  }

  function selectElement(node) {
    if (!node) return;
    const previously=state.frameDoc.querySelector("[data-editor-selected]");
    if (previously) {
      previously.removeAttribute("data-editor-selected");
      previously.removeAttribute("contenteditable");
    }
    state.selected=node.getAttribute("data-editor-key");
    state.selectedAddition=null;
    $("addedBlockDetails").hidden=true;
    state.imageSliderActive=false;
    if(state.frameDoc.getElementById("moon-image-resize-handle"))
      state.frameDoc.getElementById("moon-image-resize-handle").remove();
    node.setAttribute("data-editor-selected","");
    if (TEXT_TAGS.has(node.tagName)) node.setAttribute("contenteditable","true");
    updateInspector(node);
  }


  function selectAddedBlock(index){
    const addition=state.additions[index];
    if(!addition||!state.frameDoc)return;
    const previous=state.frameDoc.querySelector("[data-editor-selected]");
    if(previous){previous.removeAttribute("data-editor-selected");previous.removeAttribute("contenteditable");}
    for(const marked of state.frameDoc.querySelectorAll("[data-editor-added-selected]"))
      marked.removeAttribute("data-editor-added-selected");
    const node=state.frameDoc.querySelector('[data-editor-added-index="'+index+'"]');
    if(!node)return;
    node.setAttribute("data-editor-added-selected","");
    state.selected=null;
    state.selectedAddition=index;
    state.frameDoc.getElementById("moon-image-resize-handle")?.remove();
    $("selectionDetails").hidden=true;
    $("selectionEmpty").hidden=true;
    $("selectionTag").textContent="New "+insertionKind(addition);
    $("addedBlockDetails").hidden=false;
    const kind=insertionKind(addition);
    $("addedBlockKind").textContent=kind==="image"?"Existing website image":kind;
    $("addedBlockTextLabel").textContent=kind==="image"?"Image description (alt text)":"Block text";
    $("addedBlockText").maxLength=kind==="paragraph"?2000:kind==="image"?200:140;
    $("addedBlockText").value=addition.text;
    $("addedBlockHeadingField").hidden=kind!=="heading";
    $("addedBlockLinkField").hidden=kind!=="link";
    $("addedBlockImageField").hidden=kind!=="image";
    if(kind==="heading")$("addedBlockHeadingLevel").value=addition.headingTag;
    if(kind==="link")$("addedBlockHref").value=addition.href;
    if(kind==="image")$("addedBlockSrc").value=addition.src;
    const siblings=state.additions.map((entry,i)=>entry.selector===addition.selector?i:-1).filter(i=>i>=0);
    const position=siblings.indexOf(index);
    $("moveAddedEarlierBtn").disabled=position<=0;
    $("moveAddedLaterBtn").disabled=position>=siblings.length-1;
    $("duplicateAddedBlockBtn").disabled=state.additions.length>=10;
    $("addedBlockStatus").textContent="New "+kind+" · block "+(index+1)+
      " of "+state.additions.length+" · Local draft";
  }
  function applyAddedBlock(){
    const index=state.selectedAddition,original=state.additions[index];
    if(!original)return;
    const revised={...original,text:$("addedBlockText").value.trim()};
    const kind=insertionKind(original);
    if(kind==="heading")revised.headingTag=$("addedBlockHeadingLevel").value;
    if(kind==="link")revised.href=$("addedBlockHref").value.trim();
    if(kind==="image")revised.src=$("addedBlockSrc").value.trim();
    const proposed=state.additions.map((item,i)=>i===index?revised:item);
    try{validateParagraphAdditions(proposed)}
    catch(error){
      $("addedBlockStatus").textContent="Change not applied. "+error.message;
      return;
    }
    if(JSON.stringify(revised)===JSON.stringify(original)){
      $("addedBlockStatus").textContent="No changes to this new block.";
      return;
    }
    checkpoint();
    state.additions=proposed;
    renderPreview();
    saveDraft();
    updateStatus("New block edited · Not published");
  }
  function removeAddedBlock(){
    const index=state.selectedAddition;
    if(index===null||!state.additions[index])return;
    checkpoint();
    state.additions.splice(index,1);
    renderPreview();
    saveDraft();
    updateStatus("New block removed from draft · Not published");
  }
  function duplicateAddedBlock(){
    const index=state.selectedAddition,item=state.additions[index];
    if(!item||state.additions.length>=10)return;
    const next=state.additions.slice();
    next.splice(index+1,0,{...item});
    try{validateParagraphAdditions(next)}catch(error){
      $("addedBlockStatus").textContent="Duplicate not applied. "+error.message;
      return;
    }
    checkpoint();
    state.additions=next;
    renderPreview();
    saveDraft();
    updateStatus("New block duplicated · Not published");
  }

  function updateInspector(node) {
    $("selectionDetails").hidden=false;
    $("selectionEmpty").hidden=true;
    $("selectionTag").textContent=node.tagName.toLowerCase();
    const isImage=node.tagName==="IMG";
    const isLink=node.tagName==="A";
    $("imageFields").hidden=!isImage;
    $("linkFields").hidden=!isLink;
    $("textAppearanceFields").hidden=isImage;
    $("selectionText").closest(".inspector-group").hidden=isImage;
    $("revertElementBtn").disabled=!state.dirty.has(state.selected);
    const removable=sourceRemovalCandidate(state.selected);
    $("removeSourceBtn").disabled=!removable;
    $("removeSourceHelp").textContent=removable?
      "Remove this original block from the reviewed draft. Undo and Review changes can restore it.":
      "Removal is available for uniquely verified standalone paragraphs, supported headings and images without conflicting edits or layouts.";
    const compatible=directLayoutSelection();
    $("directLayoutFields").hidden=!compatible;
    if(compatible){
      const active=layoutGroups().some(group=>group.parentSelector===compatible.spec.parentSelector);
      $("directLayoutRemove").disabled=!active;
      $("directLayoutStatus").textContent=(compatible.spec.version===2?"Card or row group":"Text group")+
        " · "+compatible.spec.children.length+" blocks"+(active?" · Layout active":" · Original layout")+
        ". Mobile stays in reading order.";
    }
    const canInsert=["H2","H3","H4","P"].includes(node.tagName)&&
      !!state.original.get(state.selected);
    $("insertContentFields").hidden=!canInsert;
    const sourceText=node.textContent.trim();
    $("duplicateSourceBtn").disabled=!canInsert||!["P","H2","H3"].includes(node.tagName)||
      !!node.children.length||!sourceText||
      sourceText.length>(node.tagName==="P"?2000:140)||state.additions.length>=10;
    if(canInsert){
      const kind=$("insertContentKind").value;
      $("insertHeadingField").hidden=kind!=="heading";
      $("insertLinkField").hidden=kind!=="link";
    }
    if (isImage) {
      $("imageSrc").value=getWorking(state.selected)?.getAttribute("src")||node.getAttribute("src")||"";
      $("imageAlt").value=node.getAttribute("alt")||"";
      const width=Number.parseInt(node.style.width||node.style.maxWidth,10);
      const pct=Number.isFinite(width)&&width>=20&&width<=100?Math.round(width/5)*5:100;
      $("imageWidthPercent").value=String(pct);
      $("imageWidthValue").textContent=pct+"%";
      createImageResizeHandle();
    } else {
      $("selectionText").value=node.textContent;
      $("textAlignment").value=["left","center","right","justify"].includes(node.style.textAlign)?
        node.style.textAlign:"";
      const numberValue=(style,units,min,max)=>{
        const match=new RegExp("^(\\d+)"+units+"$").exec(style);
        return match&&Number(match[1])>=min&&Number(match[1])<=max?match[1]:"";
      };
      $("textFontSize").value=numberValue(node.style.fontSize,"px",12,80);
      $("textMaxWidth").value=numberValue(node.style.maxWidth,"%",30,100);
      $("textSpaceAbove").value=numberValue(node.style.marginTop,"px",0,80);
      $("textSpaceBelow").value=numberValue(node.style.marginBottom,"px",0,80);
      $("textColour").value=colorAsHex(node.style.color);
      $("textBackgroundColour").value=colorAsHex(node.style.backgroundColor);
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

  function colorAsHex(value){
    if(!value)return "";
    if(/^#[0-9a-f]{6}$/i.test(value))return value.toLowerCase();
    const rgb=/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(value);
    if(!rgb||rgb.slice(1).some(n=>Number(n)>255))return "";
    return "#"+rgb.slice(1).map(n=>Number(n).toString(16).padStart(2,"0")).join("");
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

  function updateSelectedStyle(property,value,allowed) {
    if(!state.selected||!(value===""||allowed.includes(value)))return;
    const actual=getWorking(state.selected);
    const rendered=state.frameDoc?.querySelector('[data-editor-key="'+state.selected+'"]');
    if(!actual||!rendered)return;
    checkpoint();
    for(const node of [actual,rendered]) {
      node.style[property]=value;
      if(!node.getAttribute("style")?.trim())node.removeAttribute("style");
    }
    updateDirty(state.selected);
    updateInspector(rendered);
  }

  function updateNumericInspectorStyle(property,field,unit,min,max){
    const value=$(field).value.trim();
    if(value!==""&&(!/^\d+$/.test(value)||Number(value)<min||Number(value)>max)){
      notice("Enter a whole number between "+min+" and "+max+", or leave the field blank to use the page style.","Invalid style");
      const selected=state.frameDoc?.querySelector('[data-editor-key="'+state.selected+'"]');
      if(selected)updateInspector(selected);
      return;
    }
    updateSelectedStyle(property,value?value+unit:"",[value?value+unit:""]);
  }
  function updateColorInspectorStyle(property,field){
    const value=$(field).value.trim();
    if(value&&!/^#[0-9a-fA-F]{6}$/.test(value)){
      notice("Enter a six-digit hex colour such as #296c56, or leave the field blank.","Invalid colour");
      const selected=state.frameDoc?.querySelector('[data-editor-key="'+state.selected+'"]');
      if(selected)updateInspector(selected);
      return;
    }
    updateSelectedStyle(property,value,[value]);
  }
  function resizeImage(percent,makeCheckpoint=false){
    if(!state.selected||!Number.isInteger(percent)||percent<20||percent>100||percent%5)return;
    const work=getWorking(state.selected);
    const preview=state.frameDoc?.querySelector('[data-editor-key="'+state.selected+'"]');
    if(work?.tagName!=="IMG"||preview?.tagName!=="IMG")return;
    if(makeCheckpoint)checkpoint();
    for(const img of [work,preview]){
      img.style.width=percent+"%";
      img.style.maxWidth="100%";
      img.style.height="auto";
    }
    $("imageWidthPercent").value=String(percent);
    $("imageWidthValue").textContent=percent+"%";
    updateDirty(state.selected);
    positionImageResizeHandle();
  }
  function positionImageResizeHandle(){
    const doc=state.frameDoc,handle=doc?.getElementById("moon-image-resize-handle");
    if(!handle)return;
    const img=doc.querySelector('[data-editor-key="'+state.selected+'"]');
    if(img?.tagName!=="IMG"){handle.remove();return;}
    const rect=img.getBoundingClientRect(),view=doc.defaultView;
    if(rect.bottom<0||rect.right<0||rect.top>view.innerHeight||rect.left>view.innerWidth){
      handle.hidden=true;return;
    }
    handle.hidden=false;
    handle.style.left=Math.max(0,Math.min(view.innerWidth-28,rect.right-12))+"px";
    handle.style.top=Math.max(0,Math.min(view.innerHeight-28,rect.bottom-12))+"px";
  }
  function createImageResizeHandle(){
    const doc=state.frameDoc;
    if(!doc||doc.getElementById("moon-image-resize-handle"))return;
    const handle=doc.createElement("button");
    handle.id="moon-image-resize-handle";handle.type="button";
    handle.textContent="↘";handle.title="Drag to resize image";
    handle.setAttribute("aria-label","Drag to resize selected image. The width slider is keyboard accessible.");
    handle.style.cssText="position:fixed;z-index:2147483647;width:28px;height:28px;border:2px solid #27654f;border-radius:5px;background:#fff;color:#174932;cursor:nwse-resize;font:700 20px/20px system-ui;touch-action:none;box-shadow:0 1px 6px #0004";
    handle.addEventListener("click",event=>event.stopPropagation());
    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0||state.resizeStart)return;
      const img=doc.querySelector('[data-editor-key="'+state.selected+'"]');
      const parent=img?.parentElement;
      if(!img||!parent)return;
      const parentWidth=parent.getBoundingClientRect().width;
      if(parentWidth<=0)return;
      event.preventDefault();event.stopPropagation();
      checkpoint();
      state.resizeStart={pointerId:event.pointerId,startX:event.clientX,
        startPercent:/^\d+%$/.test(img.style.width)?Number.parseInt(img.style.width,10):
          img.getBoundingClientRect().width/parentWidth*100,parentWidth};
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove",event=>{
      const drag=state.resizeStart;
      if(!drag||drag.pointerId!==event.pointerId)return;
      const desired=Math.round((drag.startPercent+100*(event.clientX-drag.startX)/drag.parentWidth)/5)*5;
      resizeImage(Math.max(20,Math.min(100,desired)));
    });
    const finish=event=>{
      if(state.resizeStart?.pointerId!==event.pointerId)return;
      state.resizeStart=null;
      scheduleDraft();
    };
    handle.addEventListener("pointerup",finish);
    handle.addEventListener("pointercancel",finish);
    doc.body.appendChild(handle);
    positionImageResizeHandle();
  }


  function directLayoutSelection(){
    if(!state.selected||!state.source||!window.MoonResponsiveLayout)return null;
    const selected=getWorking(state.selected),workMain=state.doc.querySelector("main");
    if(!selected||!workMain?.contains(selected))return null;
    const original=new DOMParser().parseFromString(state.source,"text/html");
    const originalMain=original.querySelector("main");
    if(!originalMain)return null;
    let selector;
    try{selector=MoonResponsiveLayout.sourceSelector(selected,workMain);}
    catch{return null;}
    const matches=[...originalMain.querySelectorAll(selector)];
    if(matches.length!==1)return null;
    const textTags=new Set(["h1","h2","h3","h4","p","blockquote","figcaption"]);
    const containerTags=new Set(["div","article","figure","section","aside"]);
    let textFallback=null;
    for(let parent=matches[0].parentElement;parent&&parent!==originalMain;parent=parent.parentElement){
      const children=[...parent.children];
      if(children.length<2||children.length>12)continue;
      const kinds=children.map(node=>node.tagName.toLowerCase());
      const version=kinds.every(tag=>textTags.has(tag))?1:
        kinds.every(tag=>containerTags.has(tag))?2:0;
      if(!version)continue;
      let spec;
      try{
        const parentSelector=MoonResponsiveLayout.sourceSelector(parent,originalMain);
        spec={version,parentSelector,children:children.map((child,index)=>{
          const tag=child.tagName.toLowerCase();
          const before=child.textContent.trim().replace(/\s+/g," ");
          const position={x:1,y:index+1,w:12,h:1};
          return {selector:MoonResponsiveLayout.sourceSelector(child,originalMain),
            tag,before,...(version===2?{markup:child.outerHTML}:{}),
            desktop:{...position},mobile:{...position}};
        })};
        MoonResponsiveLayout.verify(original,spec);
        if(version===2)return {original,spec};
        if(!textFallback)textFallback={original,spec};
      }catch{continue;}
    }
    return textFallback;
  }
  function arrangedDirectSpec(spec,preset){
    const lead=spec.version===1&&/^h[1-4]$/.test(spec.children[0].tag)?1:0;
    let columns=1,widths=[12];
    if(preset==="two"){columns=2;widths=[6,6];}
    else if(preset==="first-wide"){columns=2;widths=[8,4];}
    else if(preset==="second-wide"){columns=2;widths=[4,8];}
    else if(preset==="three"){columns=3;widths=[4,4,4];}
    else if(preset==="custom"){
      const first=Number($("directLayoutCustomColumns").value);
      if(!Number.isInteger(first)||first<2||first>10)throw Error("Custom column widths must be between 2 and 10");
      columns=2;widths=[first,12-first];
    }
    else if(preset!=="stack")throw Error("Unknown layout preset");
    return {...spec,children:spec.children.map((child,index)=>{
      const j=index-lead;
      const position=index<lead?{x:1,y:1,w:12,h:1}:{
        x:1+widths.slice(0,j%columns).reduce((total,w)=>total+w,0),
        y:1+lead+Math.floor(j/columns),w:widths[j%columns],h:1};
      return {...child,desktop:position,mobile:{x:1,y:index+1,w:12,h:1}};
    })};
  }
  function updateDirectLayout(remove=false){
    const choice=directLayoutSelection();
    if(!choice){notice("Select a heading, paragraph, or card inside a compatible complete section.","Layout unavailable");return;}
    const original=choice.original,parent=choice.spec.parentSelector;
    const existing=layoutGroups();
    const without=existing.filter(group=>group.parentSelector!==parent);
    if(remove&&!existing.some(group=>group.parentSelector===parent))return;
    try{
      const target=remove?null:arrangedDirectSpec(choice.spec,$("directLayoutPreset").value);
      const proposal=target?[...without,target]:without;
      if(target&&state.additions.some(item=>
        original.querySelector("main "+parent)?.contains(original.querySelector("main "+item.selector))))
        throw Error("New content inside this group must be reviewed separately before arranging it");
      if(target&&state.removals.some(item=>{
        const root=state.doc.querySelector("main");
        const group=root?.querySelector(parent);
        const removed=getWorking(item.key);
        return group&&removed&&group.contains(removed);
      }))throw Error("Restore removed blocks in this section before arranging it");
      if(proposal.length)MoonResponsiveLayout.cssForGroups(original,proposal);
      checkpoint();
      state.responsiveGroups=proposal;
      state.responsiveGroup=proposal.length===1?proposal[0]:null;
      renderPreview();scheduleDraft();
      updateStatus(remove?"Responsive arrangement removed · Not published":
        "Responsive arrangement applied · Preview desktop and mobile before export");
    }catch(error){notice("Cannot arrange this group. "+error.message,"Layout not applied");}
  }

  function onInspectorText() {
    if (!state.selected) return;
    const el=state.frameDoc.querySelector('[data-editor-key="'+state.selected+'"]');
    const work=getWorking(state.selected);
    if (!el||!work||$("selectionText").readOnly||el.tagName==="IMG") return;
    el.textContent=$("selectionText").value;
    work.textContent=$("selectionText").value;
    updateDirty(state.selected);
    $("removeSourceBtn").disabled=!sourceRemovalCandidate(state.selected);
  }


  /* Movements are restricted to sibling sections within an uninterrupted
     run. Any navigation or other element forms a hard boundary. */
  function validSectionOrder(ids) {
    if(!Array.isArray(ids)||ids.length!==state.originalSections.length||
       new Set(ids).size!==ids.length||
       ids.some(id=>!state.originalSections.includes(id)))return false;
    let offset=0;
    for(const group of state.sectionGroups){
      const segment=ids.slice(offset,offset+group.length);
      if(segment.length!==group.length||
         segment.some(id=>!group.includes(id)))return false;
      offset+=group.length;
    }
    return true;
  }
  function applySectionOrder(ids) {
    if(!validSectionOrder(ids))throw new Error("Section order does not match this page.");
    const main=state.doc.querySelector("main");
    for(const group of state.sectionGroups){
      if(group.length<2)continue;
      // Find the current group's actual final sibling. Its original final ID
      // may have moved in an earlier edit, so that ID is not a safe boundary.
      const currentNodes=[...main.children].filter(node=>
        group.includes(node.getAttribute("data-editor-section")));
      if(currentNodes.length!==group.length)
        throw new Error("A section group changed unexpectedly.");
      const boundary=currentNodes.at(-1).nextElementSibling;
      const wanted=ids.filter(id=>group.includes(id));
      for(const id of wanted) {
        const node=main.querySelector('[data-editor-section="'+id+'"]');
        main.insertBefore(node,boundary);
      }
    }
    state.sectionOrder=ids.slice();
  }
  function moveSection(id,direction) {
    const current=state.doc.querySelector('[data-editor-section="'+id+'"]');
    if(!current||![-1,1].includes(direction))return;
    const neighbour=direction<0?current.previousElementSibling:current.nextElementSibling;
    if(!neighbour||neighbour.tagName!=="SECTION"||
       !neighbour.hasAttribute("data-editor-section"))return;
    const group=state.sectionGroups.find(g=>g.includes(id));
    if(!group||!group.includes(neighbour.getAttribute("data-editor-section")))return;
    checkpoint();
    if(direction<0)neighbour.before(current);
    else neighbour.after(current);
    state.sectionOrder=[...state.doc.querySelectorAll("main > section[data-editor-section]")]
      .map(n=>n.getAttribute("data-editor-section"));
    if(!validSectionOrder(state.sectionOrder)){
      undo();notice("That section move would cross a protected page boundary.");return;
    }
    renderPreview();
    scheduleDraft();
    updateStatus("Section order changed · Not published");
  }

  // Dragging uses the same validated, reversible section-order model as
  // the arrow controls. The arrows remain the keyboard/touch alternative.
  let sectionDragId=null;
  function clearSectionDropMarks(){
    for(const row of document.querySelectorAll(
      "#sectionList .section-dragging,#sectionList .drop-before,#sectionList .drop-after"))
      row.classList.remove("section-dragging","drop-before","drop-after");
  }
  function reorderSection(fromId,targetId,after){
    if(fromId===targetId)return;
    const group=state.sectionGroups.find(g=>g.includes(fromId));
    if(!group||!group.includes(targetId)||group.length<2)return;
    const desired=state.sectionOrder.filter(id=>id!==fromId);
    const targetIndex=desired.indexOf(targetId);
    if(targetIndex<0)return;
    desired.splice(targetIndex+(after?1:0),0,fromId);
    if(!validSectionOrder(desired)||
       desired.every((id,i)=>id===state.sectionOrder[i]))return;
    checkpoint();
    try{applySectionOrder(desired);}
    catch(error){undo();notice(error.message,"Section move stopped");return;}
    renderPreview();
    scheduleDraft();
    updateStatus("Section order changed · Not published");
  }

  function updateStagedPreview(){
    if(!state.stagedMedia||!state.frameDoc)return;
    const node=state.frameDoc.querySelector(
      '[data-editor-key="'+state.stagedMedia.key+'"]');
    if(node?.tagName==="IMG"&&
       getWorking(state.stagedMedia.key)?.getAttribute("src")===state.stagedMedia.path)
      node.src=state.stagedMedia.objectUrl;
  }
  function clearStagedMedia(){
    if(state.stagedMedia){
      URL.revokeObjectURL(state.stagedMedia.objectUrl);
      state.stagedMedia=null;
    }
    $("newImageFile").value="";
    $("stageImageBtn").disabled=true;
    $("downloadStagedImage").disabled=true;
    $("stagedImageStatus").textContent="No new image staged.";
  }
  function mediaSignature(bytes,mime){
    if(bytes.length<24||bytes.length>1572864)return false;
    if(mime==="image/png"){
      return [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)&&
        String.fromCharCode(...bytes.slice(12,16))==="IHDR";
    }
    if(mime==="image/jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if(mime==="image/webp")return String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&
      String.fromCharCode(...bytes.slice(8,12))==="WEBP";
    return false;
  }
  async function stageNewImage(){
    const file=$("newImageFile").files?.[0];
    const key=state.selected;
    const target=key&&getWorking(key);
    if(!file||target?.tagName!=="IMG")return;
    if(state.stagedMedia&&state.stagedMedia.key!==key){
      notice("Only one new image can be staged per review request. Reset or publish the current page before adding another.");
      return;
    }
    if(file.size>1572864||file.size<24){
      notice("Choose an image smaller than 1.5 MB and larger than 24 bytes.");return;
    }
    const ext={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"}[file.type];
    if(!ext){notice("Choose a PNG, JPEG, or WebP image.");return;}
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!mediaSignature(bytes,file.type)){
      notice("The file signature does not match its image type.");return;
    }
    try {
      const bitmap=await createImageBitmap(file);
      if(!bitmap.width||!bitmap.height||bitmap.width>8000||bitmap.height>8000){
        bitmap.close();throw new Error("The image exceeds the 8000-pixel dimension limit.");
      }
      bitmap.close();
    } catch(e){notice(e.message||"This image could not be decoded.");return;}
    const random=Array.from(crypto.getRandomValues(new Uint8Array(5)),v=>
      v.toString(16).padStart(2,"0")).join("");
    const newPath="assets/editor-"+Date.now().toString(36)+"-"+random+"."+ext;
    const old=state.stagedMedia;
    checkpoint();
    updateSelectedAttribute("src",newPath);
    if(getWorking(key)?.getAttribute("src")!==newPath)return;
    const objectUrl=URL.createObjectURL(file);
    const checksum=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
    const sha256=Array.from(checksum,v=>v.toString(16).padStart(2,"0")).join("");
    state.stagedMedia={path:newPath,key,file,objectUrl,sha256,mime:file.type};
    if(old)URL.revokeObjectURL(old.objectUrl);
    updateStagedPreview();
    $("downloadStagedImage").disabled=false;
    $("stagedImageStatus").textContent=file.name+" · "+Math.round(file.size/1024)+
      " KB staged at "+newPath+". Not published. Keep the image file with exported HTML.";
    scheduleDraft();
  }
  function downloadStagedImage(){
    const m=state.stagedMedia;
    if(!m)return;
    const link=document.createElement("a");
    link.href=m.objectUrl;
    link.download=m.path.split("/").at(-1);
    document.body.appendChild(link);link.click();link.remove();
  }
  async function mediaPayload(){
    const m=state.stagedMedia;
    if(!m)return undefined;
    const content=buildExport();
    if(!content.includes('src="'+m.path+'"')&&!content.includes("src='"+m.path+"'"))
      return undefined;
    const bytes=new Uint8Array(await m.file.arrayBuffer());
    let binary="";
    for(let i=0;i<bytes.length;i+=16384)
      binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
    return {path:m.path,mime:m.mime,sha256:m.sha256,base64:btoa(binary)};
  }

  function updateSectionList() {
    const list=$("sectionList");
    list.replaceChildren();
    const sections=[...state.doc.querySelectorAll("main > section[data-editor-section]")];
    for(let i=0;i<sections.length;i++){
      const node=sections[i];
      const id=node.getAttribute("data-editor-section");
      const heading=node.querySelector("h1,h2,h3");
      const title=heading?.textContent.trim()||"Section "+(i+1);
      const row=document.createElement("div");
      row.className="section-order-row";
      row.dataset.sectionId=id;
      const group=state.sectionGroups.find(g=>g.includes(id))||[];
      if(group.length>1){
        row.draggable=true;
        row.title="Drag to reorder within this group, or use the arrow buttons.";
        row.addEventListener("dragstart",event=>{
          sectionDragId=id;
          if(event.dataTransfer){
            event.dataTransfer.effectAllowed="move";
            event.dataTransfer.setData("text/plain",id);
          }
          row.classList.add("section-dragging");
        });
        row.addEventListener("dragover",event=>{
          if(!sectionDragId||sectionDragId===id||
             !group.includes(sectionDragId))return;
          event.preventDefault();
          if(event.dataTransfer)event.dataTransfer.dropEffect="move";
          clearSectionDropMarks();
          const halfway=row.getBoundingClientRect().top+row.offsetHeight/2;
          row.classList.add(event.clientY<halfway?"drop-before":"drop-after");
        });
        row.addEventListener("drop",event=>{
          if(!sectionDragId||sectionDragId===id||
             !group.includes(sectionDragId))return;
          event.preventDefault();
          const source=sectionDragId;
          const halfway=row.getBoundingClientRect().top+row.offsetHeight/2;
          const after=event.clientY>=halfway;
          sectionDragId=null;
          clearSectionDropMarks();
          reorderSection(source,id,after);
        });
        row.addEventListener("dragend",()=>{
          sectionDragId=null;
          clearSectionDropMarks();
        });
      }
      const label=document.createElement("span");
      label.textContent=title.slice(0,75);
      label.title=title;
      const buttons=document.createElement("div");buttons.className="section-order-actions";
      for(const direction of [-1,1]){
        const neighbour=direction<0?node.previousElementSibling:node.nextElementSibling;
        const enabled=neighbour?.tagName==="SECTION"&&
          group.includes(neighbour.getAttribute("data-editor-section"));
        const button=document.createElement("button");
        button.type="button";
        button.textContent=direction<0?"↑":"↓";
        button.setAttribute("aria-label",(direction<0?"Move up: ":"Move down: ")+title);
        button.title=(direction<0?"Move section up":"Move section down");
        button.disabled=!enabled;
        button.addEventListener("click",()=>moveSection(id,direction));
        buttons.appendChild(button);
      }
      row.append(label,buttons);
      list.appendChild(row);
    }
    const toc=!!state.doc.querySelector('main nav a[href^="#"]');
    $("sectionNotice").textContent=!sections.length?
      "No movable sections on this page.":toc?
      "Section moves are locked while this page has a contents menu, to prevent mismatched navigation.":
      "Drag to reorder, or use the arrow buttons. Sections separated by fixed page elements cannot cross them.";
  }
  function rawMainSections(source) {
    const opener=/<main\b[^>]*>/i.exec(source);
    if(!opener)throw new Error("Main page region cannot be located.");
    const begin=opener.index+opener[0].length;
    const close=/<\/main\s*>/gi;
    close.lastIndex=begin;
    const last=close.exec(source);
    if(!last)throw new Error("Main page closing tag was not found.");
    const content=source.slice(begin,last.index);
    const tags=/<\/?section\b[^>]*>/gi;
    let token,depth=0,start=0;
    const spans=[];
    while((token=tags.exec(content))){
      const closing=/^<\//.test(token[0]);
      if(!closing){
        if(depth===0)start=begin+token.index;
        depth++;
      }else{
        depth--;
        if(depth<0)throw new Error("Unbalanced sections in page source.");
        if(depth===0)spans.push({start,end:begin+tags.lastIndex});
      }
    }
    if(depth||spans.length!==state.originalSections.length)
      throw new Error("Section boundaries differ from the original page. Reordering is blocked.");
    return spans;
  }
  function exportSectionOrder(html) {
    if(state.sectionOrder.every((id,i)=>id===state.originalSections[i]))return html;
    if(!validSectionOrder(state.sectionOrder))
      throw new Error("The section order crosses a page boundary.");
    const spans=rawMainSections(html);
    const changes=[];
    for(const group of state.sectionGroups){
      const desired=state.sectionOrder.filter(id=>group.includes(id));
      if(group.length<2||desired.every((id,i)=>id===group[i]))continue;
      const first=Number(group[0].slice(1));
      const last=Number(group.at(-1).slice(1));
      const fragments=new Map(),gaps=[];
      for(let i=0;i<group.length;i++){
        const pos=Number(group[i].slice(1));
        fragments.set(group[i],html.slice(spans[pos].start,spans[pos].end));
        if(i+1<group.length){
          const after=Number(group[i+1].slice(1));
          const gap=html.slice(spans[pos].end,spans[after].start);
          if(gap.trim())throw new Error("A non-section element separates these blocks. Move cancelled.");
          gaps.push(gap);
        }
      }
      let reordered="";
      for(let i=0;i<desired.length;i++){
        reordered+=fragments.get(desired[i])+(gaps[i]||"");
      }
      changes.push({start:spans[first].start,end:spans[last].end,replacement:reordered});
    }
    for(const item of changes.sort((a,b)=>b.start-a.start)){
      html=html.slice(0,item.start)+item.replacement+html.slice(item.end);
    }
    return html;
  }

  /* The media browser uses image files already referenced on the public site.
     It never uploads assets or introduces arbitrary third-party sources. */
  const IMAGE_PATH=/^assets\/[a-z0-9._/-]+\.(?:webp|png|jpg|jpeg|gif|avif)$/i;
  async function availableImages() {
    if(state.mediaAssets)return state.mediaAssets;
    if(state.mediaPromise)return state.mediaPromise;
    const pages=[...$("pagePicker").options].map(option=>option.value);
    state.mediaPromise=(async()=>{
      const found=new Map();
      const results=await Promise.all(pages.map(async page=>{
        try{
          const r=await fetch(page,{cache:"force-cache",credentials:"same-origin"});
          return r.ok?await r.text():"";
        }catch{return ""}
      }));
      for(const text of results){
        if(!text)continue;
        const doc=new DOMParser().parseFromString(text,"text/html");
        for(const img of doc.querySelectorAll("img[src]")){
          const src=img.getAttribute("src")||"";
          if(!IMAGE_PATH.test(src)||src.includes(".."))continue;
          if(!found.has(src))found.set(src,{
            path:src,description:img.getAttribute("alt")||src.split("/").at(-1)
          });
        }
      }
      state.mediaAssets=[...found.values()].sort((a,b)=>a.path.localeCompare(b.path));
      return state.mediaAssets;
    })();
    try{return await state.mediaPromise}
    finally{state.mediaPromise=null}
  }
  function renderMediaResults(items) {
    const root=$("mediaResults");root.replaceChildren();
    for(const item of items){
      const button=document.createElement("button");
      button.className="media-option";
      button.type="button";
      button.setAttribute("role","listitem");
      button.title="Use "+item.path;
      const img=document.createElement("img");
      img.src=item.path;img.alt="";img.loading="lazy";
      const label=document.createElement("strong");
      label.textContent=item.description.slice(0,125);
      const code=document.createElement("small");code.textContent=item.path;
      button.append(img,label,code);
      button.addEventListener("click",()=>{
        if(state.mediaChooseInsert==="added"){
          $("addedBlockSrc").value=item.path;
          if(!$("addedBlockText").value.trim())$("addedBlockText").value=item.description;
          $("mediaDialog").close();
          return;
        }
        if(state.mediaChooseInsert){
          $("insertImageSrc").value=item.path;
          if(!$("insertContentText").value.trim())$("insertContentText").value=item.description;
          $("mediaDialog").close();
          return;
        }
        const selected=state.frameDoc?.querySelector(
          '[data-editor-key="'+state.selected+'"]');
        if(!selected||selected.tagName!=="IMG"){
          $("mediaStatus").textContent="Select an image in the page preview first.";
          return;
        }
        updateSelectedAttribute("src",item.path);
        $("mediaDialog").close();
      });
      root.appendChild(button);
    }
    $("mediaStatus").textContent=items.length+
      " existing image"+(items.length===1?"":"s")+".";
  }
  async function openMediaLibrary(forInsertion=false){
    const selected=state.frameDoc?.querySelector(
      '[data-editor-key="'+state.selected+'"]');
    if(forInsertion==="added"){
      if(insertionKind(state.additions[state.selectedAddition])!=="image")return;
    }else if(forInsertion){
      if(!selected||!["P","H2","H3","H4"].includes(selected.tagName))return;
    }else if(!selected||selected.tagName!=="IMG")return;
    state.mediaChooseInsert=forInsertion;
    $("mediaSearch").value="";
    $("mediaResults").replaceChildren();
    $("mediaStatus").textContent="Finding images already used on the site…";
    $("mediaDialog").showModal();
    const images=await availableImages();
    if(!$("mediaDialog").open)return;
    renderMediaResults(images);
  }

  function updateOutline() {
    const nav=$("outline");
    nav.replaceChildren();
    const headings=state.doc.querySelectorAll("main h1,main h2,main h3");
    for (const h of headings) {
      if(state.removals.some(item=>item.key===h.getAttribute("data-editor-key")))continue;
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

  function safeNewLink(href){
    if(typeof href!=="string"||href.length>500||href.trim()!==href||/[\s\x00-\x1f<>"'\\]/.test(href))return false;
    if(/^[a-z0-9-]+\.html(?:#[A-Za-z0-9_-]+)?$/.test(href))return true;
    if(!/^https:\/\/[^/]+/i.test(href))return false;
    try{
      const url=new URL(href);
      return url.protocol==="https:"&&!url.username&&!url.password&&!!url.hostname&&
        !url.hostname.endsWith(".")&&!url.hostname.includes("..")&&(url.port===""||url.port==="443");
    }catch{return false}
  }
  function insertionKind(s){return s?.kind||"paragraph"}
  function safeExistingImagePath(path){
    return typeof path==="string"&&path.length<=220&&IMAGE_PATH.test(path)&&
      !path.includes("..")&&!path.includes("//");
  }
  function validateParagraphAdditions(incoming){
    if(!Array.isArray(incoming)||incoming.length>10)throw Error("Invalid content additions");
    const original=new DOMParser().parseFromString(state.source,"text/html");
    const root=original.querySelector("main"),out=[];
    for(const item of incoming){
      const kind=insertionKind(item);
      if(!item||typeof item!=="object"||!["p","h2","h3","h4"].includes(item.tag)||
        typeof item.selector!=="string"||item.selector.length>500||
        typeof item.before!=="string"||item.before.length>4000||
        typeof item.text!=="string"||!item.text.trim()||
        !["paragraph","heading","link","image"].includes(kind)||
        item.text.length>(kind==="paragraph"?2000:kind==="image"?200:140)||
        (kind==="heading"?!["h2","h3"].includes(item.headingTag):item.headingTag!==undefined)||
        (kind==="link"?!safeNewLink(item.href):item.href!==undefined)||
        (kind==="image"?!safeExistingImagePath(item.src):item.src!==undefined)||
        item.page!==state.page)
        throw Error("Invalid "+kind+" insertion");
      let matches;
      try{matches=[...root.querySelectorAll(item.selector)]}catch{throw Error("Invalid content anchor")}
      if(matches.length!==1||matches[0].tagName.toLowerCase()!==item.tag||
        matches[0].textContent.trim().replace(/\s+/g," ")!==item.before)
        throw Error("Content insertion source changed");
      for(const group of layoutGroups()){
        const parent=root.querySelector(group.parentSelector);
        if(parent?.contains(matches[0]))throw Error("New content cannot be inserted inside a responsive group");
      }
      out.push({page:item.page,selector:item.selector,tag:item.tag,before:item.before,text:item.text,
        kind,...(kind==="heading"?{headingTag:item.headingTag}:{}),...(kind==="link"?{href:item.href}:{}),
        ...(kind==="image"?{src:item.src}:{})});
    }
    return out;
  }
  function escapePlainText(text){
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function createAdditionElement(doc,item){
    const kind=insertionKind(item);
    if(kind==="heading"){
      const node=doc.createElement(item.headingTag);node.textContent=item.text;return node;
    }
    const node=doc.createElement("p");
    if(kind==="image"){
      const img=doc.createElement("img");
      img.setAttribute("src",item.src);
      img.setAttribute("alt",item.text);
      img.setAttribute("loading","lazy");
      img.style.cssText="max-width:100%;height:auto";
      node.append(img);
      return node;
    }
    if(kind==="link"){
      const link=doc.createElement("a");
      link.setAttribute("href",item.href);link.textContent=item.text;
      if(/^https:\/\//i.test(item.href))link.setAttribute("rel","noopener noreferrer");
      node.append(link);
    }else node.textContent=item.text;
    return node;
  }
  function additionHtml(item){
    const text=escapePlainText(item.text);
    if(insertionKind(item)==="image")return '<p><img src="'+item.src+
      '" alt="'+text.replace(/"/g,"&quot;").replace(/'/g,"&#39;")+
      '" loading="lazy" style="max-width:100%;height:auto"></p>';
    if(insertionKind(item)==="heading")return "<"+item.headingTag+">"+text+"</"+item.headingTag+">";
    if(insertionKind(item)==="link")return "<p><a href=\""+escapePlainText(item.href)+"\""+
      (/^https:\/\//i.test(item.href)?" rel=\"noopener noreferrer\"":"")+">"+text+"</a></p>";
    return "<p>"+text+"</p>";
  }

  // Removal proposals retain the original source in the working document.
  // Only the isolated preview and the verified exported HTML omit a block.
  function rawRemovalSpan(html,key){
    const before=state.original.get(key);
    if(!before)throw Error("The source block cannot be verified");
    const old=new DOMParser().parseFromString(before,"text/html").body.firstElementChild;
    if(!old||!["P","H2","H3","IMG"].includes(old.tagName))
      throw Error("This source block cannot be removed safely");
    const direct=html.indexOf(before);
    if(direct>=0&&html.indexOf(before,direct+before.length)<0)
      return {start:direct,end:direct+before.length};
    if(old.tagName!=="IMG")throw Error("The source markup is ambiguous or has changed");
    // Source images can differ in harmless whitespace, quote style and
    // self-closing syntax. Check every original attribute before removal.
    const possible=[...html.matchAll(/<img\b[^>]*>/gi)].filter(match=>{
      const parsed=new DOMParser().parseFromString(match[0],"text/html").body.firstElementChild;
      return parsed?.tagName==="IMG"&&
        [...parsed.attributes].length===[...old.attributes].length&&
        [...old.attributes].every(attr=>parsed.getAttribute(attr.name)===attr.value);
    });
    if(possible.length!==1)throw Error("The original image cannot be identified uniquely");
    return {start:possible[0].index,end:possible[0].index+possible[0][0].length};
  }
  function sourceRemovalCandidate(key,allowExisting=false){
    if(!key||!state.page||!state.doc||!state.original.has(key)||
       (!allowExisting&&state.removals.some(item=>item.key===key)))return null;
    const root=state.doc.querySelector("main"),node=getWorking(key);
    if(!root||!node||!root.contains(node)||
       !["P","H2","H3","IMG"].includes(node.tagName))return null;
    if(node.closest("nav,header,footer,aside,form,dialog,a,[hidden],[aria-hidden='true']"))
      return null;
    if(node.hasAttribute("id")||node.hasAttribute("name")||
       node.querySelector("[id],[name],script,button,form,iframe"))return null;
    if(state.stagedMedia?.key===key)return null;
    // Check the working markup independently of the dirty bookkeeping so a
    // just-typed inspector change cannot be silently discarded by removal.
    if(cleanOuter(node)!==state.original.get(key))return null;
    if(["H2","H3"].includes(node.tagName)&&node.parentElement?.querySelectorAll("h2,h3").length===1)
      return null;
    if([...state.dirty].some(dirtyKey=>{
      const dirty=getWorking(dirtyKey);
      return dirty&&(dirty===node||node.contains(dirty)||dirty.contains(node));
    }))return null;
    if(layoutGroups().some(group=>{
      const parent=root.querySelector(group.parentSelector);
      return !parent||parent.contains(node)||node.contains(parent);
    }))return null;
    if(state.additions.some(item=>{
      const anchor=root.querySelector(item.selector);
      return !anchor||anchor===node||node.contains(anchor);
    }))return null;
    try{rawRemovalSpan(state.source,key)}catch{return null}
    return {key,tag:node.tagName.toLowerCase(),before:state.original.get(key)};
  }
  function validateSourceRemovals(items){
    if(!Array.isArray(items)||items.length>12)throw Error("Too many removed blocks");
    const seen=new Set(),validated=[];
    for(const item of items){
      if(!item||typeof item!=="object"||typeof item.key!=="string"||
         !/^e\d+$/.test(item.key)||seen.has(item.key))
        throw Error("Duplicate or invalid removed block");
      const verified=sourceRemovalCandidate(item.key,true);
      if(!verified||item.tag!==verified.tag||item.before!==verified.before)
        throw Error("The removed source block has changed or conflicts with another edit");
      seen.add(item.key);
      validated.push(verified);
    }
    return validated;
  }
  function exportSourceRemovals(html){
    const removals=validateSourceRemovals(state.removals);
    for(const item of removals){
      const span=rawRemovalSpan(html,item.key);
      html=html.slice(0,span.start)+html.slice(span.end);
    }
    return html;
  }
  function removeSelectedSource(){
    const candidate=sourceRemovalCandidate(state.selected);
    if(!candidate)return;
    if(!confirm("Remove this "+candidate.tag+" block from the page draft? The original content can be restored with Undo or from Review changes. Nothing is published."))return;
    checkpoint();
    state.removals.push(candidate);
    renderPreview();
    saveDraft();
    updateStatus("Original block removed from draft · Not published");
  }
  function restoreReviewedSource(index){
    if(index<0||index>=state.removals.length)return;
    checkpoint();
    state.removals.splice(index,1);
    renderPreview();
    saveDraft();
    updateStatus("Removed source block restored · Not published");
    const modal=$("reviewDialog");
    if(modal.open)modal.close();
    if(state.dirty.size||state.additions.length||layoutGroups().length||state.removals.length||
       state.sectionOrder.some((id,i)=>id!==state.originalSections[i]))reviewChanges();
  }

  function exportParagraphs(html){
    const original=new DOMParser().parseFromString(state.source,"text/html");
    const root=original.querySelector("main"),anchors=validateParagraphAdditions(state.additions);
    const grouped=new Map();
    for(const item of anchors){
      if(!grouped.has(item.selector))grouped.set(item.selector,[]);
      grouped.get(item.selector).push(item);
    }
    for(const [selector,items] of grouped){
      const item=items[0];
      const matches=[...root.querySelectorAll(selector)];
      const anchor=matches[0],originalMarkup=anchor.outerHTML;
      const candidates=[originalMarkup];
      const edited=state.doc.querySelector("main "+item.selector);
      if(edited&&edited.tagName.toLowerCase()===item.tag){
        const revised=cleanOuter(edited);
        if(!candidates.includes(revised))candidates.push(revised);
      }
      let at=-1,markup="";
      for(const candidate of candidates){
        const pos=html.indexOf(candidate);
        if(pos>=0&&html.indexOf(candidate,pos+candidate.length)===-1){
          if(at>=0)throw Error("Ambiguous content insertion anchor");
          at=pos;markup=candidate;
        }
      }
      if(at<0)throw Error("Cannot uniquely locate the content insertion in source HTML");
      const offset=at+markup.length;
      html=html.slice(0,offset)+"\n"+items.map(additionHtml).join("\n")+html.slice(offset);
    }
    return html;
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
          /* Inner-content replacement cannot carry attribute edits. */
          const attributesBefore=[...originalNode.attributes].map(a=>[a.name,a.value]);
          const attributesAfter=[...editedNode.attributes].map(a=>[a.name,a.value]);
          if (JSON.stringify(attributesBefore)===JSON.stringify(attributesAfter)) {
            before=originalNode.innerHTML;
            after=editedNode.innerHTML;
            pos=next.indexOf(before);
          }
        }
      }
      if (pos<0) {
        /* For uniquely identified source blocks, replace the opening tag
           alongside the inner content. This supports alignment and other
           inspector-controlled attributes without rewriting entire pages. */
        const oldEl=new DOMParser().parseFromString(op.before,"text/html").body.firstElementChild;
        const newEl=new DOMParser().parseFromString(op.after,"text/html").body.firstElementChild;
        if(oldEl&&newEl&&oldEl.tagName===newEl.tagName&&oldEl.innerHTML) {
          const inner=oldEl.innerHTML;
          const at=next.indexOf(inner);
          if(at>=0&&next.indexOf(inner,at+inner.length)<0){
            const tag=oldEl.tagName.toLowerCase();
            const prefix=next.slice(Math.max(0,at-1500),at);
            const match=prefix.match(new RegExp("<"+tag+"\\b[^>]*>$","i"));
            if(match){
              const oldOpening=match[0];
              const parsed=new DOMParser().parseFromString(
                oldOpening+"</"+tag+">","text/html").body.firstElementChild;
              const equal=parsed&&
                [...parsed.attributes].length===[...oldEl.attributes].length&&
                [...oldEl.attributes].every(attribute=>
                  parsed.getAttribute(attribute.name)===attribute.value);
              const newOpening=op.after.match(/^<[^>]*>/)?.[0];
              if(equal&&newOpening){
                const start=at-oldOpening.length;
                next=next.slice(0,start)+newOpening+newEl.innerHTML+
                  next.slice(at+inner.length);
                continue;
              }
            }
          }
        }
      }
      if (pos<0) {
        /* Images are void elements. Their attributes can be written safely
           when the original image can be identified uniquely by source and alt. */
        const beforeNode=new DOMParser().parseFromString(op.before,"text/html").body.firstElementChild;
        const afterNode=new DOMParser().parseFromString(op.after,"text/html").body.firstElementChild;
        if (beforeNode&&afterNode&&beforeNode.tagName===afterNode.tagName&&
            ["IMG","A"].includes(beforeNode.tagName)) {
          const tag=beforeNode.tagName.toLowerCase();
          const re=new RegExp("<"+tag+"\\b[^>]*>","gi");
          const candidates=[...next.matchAll(re)].filter(match=>{
            const candidate=new DOMParser().parseFromString(match[0],"text/html").body.firstElementChild;
            if (!candidate||candidate.tagName!==beforeNode.tagName) return false;
            return [...beforeNode.attributes].every(attribute=>
              candidate.getAttribute(attribute.name)===attribute.value
            )&&[...candidate.attributes].length===[...beforeNode.attributes].length;
          });
          if (candidates.length===1) {
            const originalTag=candidates[0];
            const replacementTag=afterNode.outerHTML.match(/^<[^>]*>/)?.[0];
            if (!replacementTag) throw new Error("Could not export element "+op.key+".");
            next=next.slice(0,originalTag.index)+replacementTag+
              next.slice(originalTag.index+originalTag[0].length);
            /* Text and inline markup may also have changed. Apply them only
               if a unique original inner content span follows the raw tag. */
            if (beforeNode.innerHTML!==afterNode.innerHTML) {
              const innerAt=originalTag.index+replacementTag.length;
              if (!next.startsWith(beforeNode.innerHTML,innerAt)) {
                throw new Error("Cannot safely reconcile nested content in "+op.key+".");
              }
              next=next.slice(0,innerAt)+afterNode.innerHTML+
                next.slice(innerAt+beforeNode.innerHTML.length);
            }
            continue;
          }
        }
      }
      if (pos<0) throw new Error("The page source cannot uniquely locate element "+op.key+". No HTML has been exported.");
      if (next.indexOf(before,pos+before.length)>=0) throw new Error("Element "+op.key+" has identical source duplicates. Review this change manually.");
      next=next.slice(0,pos)+after+next.slice(pos+before.length);
    }
    next=exportSectionOrder(next);
    if(state.additions.length)next=exportParagraphs(next);
    if(state.removals.length)next=exportSourceRemovals(next);
    if(layoutGroups().length){
      const original=new DOMParser().parseFromString(state.source,'text/html');
      const css=layoutCss(original);
      if(!/<\/head>/i.test(next)||next.includes('id="moon-responsive-group-layout"'))
        throw Error('Cannot insert the responsive group into this page safely');
      next=next.replace(/<\/head>/i,'<style id="moon-responsive-group-layout">\\n'+css+'\\n</style>\\n</head>');
    }
    if(state.stagedMedia&&next.includes(state.stagedMedia.path)){
      const image=getWorking(state.stagedMedia.key);
      const original=new DOMParser().parseFromString(
        state.original.get(state.stagedMedia.key)||"","text/html").body.firstElementChild;
      const alt=image?.getAttribute("alt")?.trim()||"";
      if(!alt||alt===original?.getAttribute("alt")?.trim())
        throw new Error("Describe the newly uploaded image in the Alt text field before exporting or proposing changes.");
    }
    const references=[...next.matchAll(/\bsrc\s*=\s*["\'](assets\/editor-[a-z0-9-]+\.(?:png|jpg|webp))["\']/gi)]
      .map(match=>match[1]).filter(path=>!state.source.includes(path));
    for(const path of references){
      if(!state.stagedMedia||state.stagedMedia.path!==path)
        throw new Error("This draft uses a new image whose file is unavailable. Re-select and stage that image before exporting.");
    }
    if (next===state.source) throw new Error("There are no exportable changes.");
    return next;
  }

  async function connectPublisher() {
    if(!publisherConfigured()) return;
    const nonce=new Uint8Array(24);
    crypto.getRandomValues(nonce);
    const stateValue=Array.from(nonce,n=>n.toString(16).padStart(2,"0")).join("");
    try{sessionStorage.setItem("moon-publisher-oauth-state",stateValue);}
    catch{publishMessage("This browser must allow session storage for GitHub sign-in.");return;}
    const url=new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id",PUBLISH_CONFIG.clientId);
    url.searchParams.set("redirect_uri",
      PUBLISH_CONFIG.redirectUri||"https://gmoon-code.github.io/editor.html");
    url.searchParams.set("state",stateValue);
    window.location.assign(url.toString());
  }

  async function processPublisherCallback() {
    const url=new URL(location.href);
    const code=url.searchParams.get("code");
    const givenState=url.searchParams.get("state");
    const oauthError=url.searchParams.get("error");
    if(!code&&!oauthError)return;
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    window.history.replaceState(null,"",url.pathname+url.search+url.hash);
    let expected="";
    try{
      expected=sessionStorage.getItem("moon-publisher-oauth-state")||"";
      sessionStorage.removeItem("moon-publisher-oauth-state");
    }catch{}
    if(oauthError){publishMessage("GitHub connection was cancelled.");return;}
    if(!publisherConfigured()||!expected||!givenState||
       expected!==givenState||!code) {
      publishMessage("GitHub sign-in could not be verified. Try again.");
      return;
    }
    publisher.busy=true;updatePublishControls();
    publishMessage("Verifying GitHub authorization…");
    try{
      const result=await fetch(publisherEndpoint()+"/oauth/exchange",{
        method:"POST",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({code})
      });
      const payload=await result.json();
      if(!result.ok||payload.ok!==true||typeof payload.session!=="string")
        throw new Error(payload.error||"GitHub sign-in failed");
      publisher.session=payload.session;
      publisher.login=payload.login;
      publishMessage("Connected as "+publisher.login+". Changes create draft pull requests only.");
    }catch(error){publishMessage("Unable to connect. "+(error.message||"Try again."));}
    finally{publisher.busy=false;updatePublishControls();}
  }

  async function createPublisherProposal() {
    const reordered=state.sectionOrder.some((id,i)=>id!==state.originalSections[i]);
    if(!publisher.session||(!state.dirty.size&&!reordered&&!layoutGroups().length&&!state.additions.length&&!state.removals.length)||publisher.busy)return;
    const summary=$("publisherSummary").value.trim();
    if(!summary||summary.length>140){publishMessage("Enter a short change summary.");return;}
    let content;
    try{content=buildExport();}
    catch(error){notice(error.message,"Review required before publishing");return;}
    if(!window.confirm("Create a draft GitHub pull request for "+state.page+
      "?\n\n"+summary+"\n\nThis will not publish to the website."))return;
    publisher.busy=true;updatePublishControls();
    publishMessage("Creating a review-only pull request…");
    try{
      const buffer=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(state.source));
      const sourceHash=Array.from(new Uint8Array(buffer),byte=>
        byte.toString(16).padStart(2,"0")).join("");
      const result=await fetch(publisherEndpoint()+"/proposals",{
        method:"POST",cache:"no-store",
        headers:{"Content-Type":"application/json",
          "Authorization":"Bearer "+publisher.session},
        body:JSON.stringify({path:state.page,sourceHash,content,summary,
          media:await mediaPayload()})
      });
      const payload=await result.json();
      if(!result.ok||payload.ok!==true)
        throw new Error(payload.error||"The publishing service rejected the proposal");
      if(!/^https:\/\/github\.com\/gmoon-code\/gmoon-code\.github\.io\/pull\/\d+$/.test(payload.url))
        throw new Error("Publisher did not return an expected GitHub review link");
      const region=$("publisherResult");
      region.replaceChildren();
      const link=document.createElement("a");
      link.href=payload.url;
      link.target="_blank";
      link.rel="noopener noreferrer";
      link.textContent="Review draft pull request #"+payload.number+" on GitHub ↗";
      region.appendChild(link);
      publishMessage("Review request created. The live website is unchanged.");
    }catch(error){
      publishMessage("Proposal not created. "+(error.message||"Try again."));
      if(/Session expired|401/.test(error.message||"")) {
        publisher.session=null;publisher.login="";
      }
    }finally{publisher.busy=false;updatePublishControls();}
  }

  function updateInsertKind(){
    const kind=$("insertContentKind").value;
    $("insertHeadingField").hidden=kind!=="heading";
    $("insertLinkField").hidden=kind!=="link";
    $("insertImageField").hidden=kind!=="image";
    $("insertContentLabel").textContent=kind==="image"?"Image description (alt text)":"New text";
    $("insertContentText").maxLength=kind==="paragraph"?2000:kind==="image"?200:140;
  }
  function addContentFromInspector(){
    if(!state.selected||!state.doc||!window.MoonResponsiveLayout)return;
    const node=getWorking(state.selected);
    if(!node||!["H2","H3","H4","P"].includes(node.tagName))return;
    const kind=$("insertContentKind").value,text=$("insertContentText").value.trim();
    const original=new DOMParser().parseFromString(state.source,"text/html");
    const sourceRoot=original.querySelector("main");
    if(!sourceRoot)return;
    let selector;
    try{selector=MoonResponsiveLayout.sourceSelector(node,state.doc.querySelector("main"))}
    catch(error){notice(error.message,"Cannot add content");return}
    const matches=[...sourceRoot.querySelectorAll(selector)];
    if(matches.length!==1||matches[0].tagName!==node.tagName){
      notice("The selected element no longer has a unique source position. Review the page structure first.","Cannot add content");return;
    }
    const sourceNode=matches[0];
    const proposed={page:state.page,selector,tag:node.tagName.toLowerCase(),
      before:sourceNode.textContent.trim().replace(/\s+/g," "),kind,text};
    if(kind==="heading")proposed.headingTag=$("insertHeadingLevel").value;
    if(kind==="link")proposed.href=$("insertLinkHref").value.trim();
    if(kind==="image")proposed.src=$("insertImageSrc").value.trim();
    try{
      const additions=validateParagraphAdditions([...state.additions,proposed]);
      if(layoutGroups().some(group=>sourceRoot.querySelector(group.parentSelector)?.contains(sourceNode)))
        throw Error("Additions inside active responsive groups are not supported");
      checkpoint();
      state.additions=additions;
      $("insertContentText").value="";
      if(kind==="link")$("insertLinkHref").value="";
      if(kind==="image")$("insertImageSrc").value="";
      renderPreview();
      scheduleDraft();
      updateStatus("New "+kind+" added to local draft · Not published");
    }catch(error){notice("The content could not be added. "+error.message,"Insertion not applied")}
  }
  function duplicateSelectedSource(){
    if($("duplicateSourceBtn").disabled||!state.selected)return;
    const node=getWorking(state.selected);
    if(!node||node.children.length||!["P","H2","H3"].includes(node.tagName))return;
    const text=node.textContent.trim();
    const kind=node.tagName==="P"?"paragraph":"heading";
    if(!text)return;
    const saved={
      kind:$("insertContentKind").value,text:$("insertContentText").value,
      heading:$("insertHeadingLevel").value,href:$("insertLinkHref").value
    };
    try{
      $("insertContentKind").value=kind;
      $("insertContentText").value=text;
      if(kind==="heading")$("insertHeadingLevel").value=node.tagName.toLowerCase();
      addContentFromInspector();
    }finally{
      $("insertContentKind").value=saved.kind;
      $("insertContentText").value=saved.text;
      $("insertHeadingLevel").value=saved.heading;
      $("insertLinkHref").value=saved.href;
      updateInsertKind();
    }
  }
  function moveReviewedAddition(index,direction){
    const item=state.additions[index];
    if(!item||![-1,1].includes(direction))return;
    const siblings=state.additions.map((entry,i)=>entry.selector===item.selector?i:-1).filter(i=>i>=0);
    const adjacent=siblings[siblings.indexOf(index)+direction];
    if(adjacent===undefined)return;
    checkpoint();
    [state.additions[index],state.additions[adjacent]]=[state.additions[adjacent],state.additions[index]];
    renderPreview();
    saveDraft();
    updateStatus("New content order updated · Not published");
    const modal=$("reviewDialog");
    if(modal.open){modal.close();reviewChanges();}
  }
  function modifyReviewedAddition(index,remove=false){
    const previous=state.additions[index];
    if(!previous)return;
    let nextItem={...previous};
    if(!remove){
      const label=prompt("Edit "+insertionKind(previous)+" text",previous.text);
      if(label===null)return;
      nextItem.text=label.trim();
      if(insertionKind(previous)==="heading"){
        const level=prompt("Heading level (h2 or h3)",previous.headingTag);
        if(level===null)return;
        nextItem.headingTag=level.trim().toLowerCase();
      }
      if(insertionKind(previous)==="link"){
        const href=prompt("Link destination (.html or HTTPS)",previous.href);
        if(href===null)return;
        nextItem.href=href.trim();
      }
      if(insertionKind(previous)==="image"){
        const src=prompt("Existing website image path (assets/...)",previous.src);
        if(src===null)return;
        nextItem.src=src.trim();
      }
    }
    const proposed=remove?state.additions.filter((_,i)=>i!==index):
      state.additions.map((item,i)=>i===index?nextItem:item);
    try{validateParagraphAdditions(proposed)}
    catch(error){notice("The addition could not be changed. "+error.message,"Content review");return}
    checkpoint();
    state.additions=proposed;
    renderPreview();
    saveDraft();
    updateStatus(remove?"Staged addition removed · Not published":"Staged addition updated · Not published");
    const modal=$("reviewDialog");
    if(modal.open)modal.close();
    if(state.dirty.size||state.additions.length||layoutGroups().length||
       state.sectionOrder.some((id,i)=>id!==state.originalSections[i]))reviewChanges();
  }
  function reviewChanges() {
    const list=$("reviewChangeList");
    list.replaceChildren();
    const ids=[...state.dirty].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));
    const reordered=state.sectionOrder.some((id,i)=>id!==state.originalSections[i]);
    $("reviewSummary").textContent=ids.length+" edited element"+(ids.length===1?"":"s")+
      (reordered?" · section order changed":"")+
      (layoutGroups().length?" · "+layoutGroups().length+" responsive layout group"+(layoutGroups().length===1?"":"s"):"")+
      (state.additions.length?" · "+state.additions.length+" added content block"+(state.additions.length===1?"":"s"):"")+
      (state.removals.length?" · "+state.removals.length+" removed source block"+(state.removals.length===1?"":"s"):"")+
      " on "+$("pagePicker").selectedOptions[0]?.textContent+".";
    const previewText=(node)=>{
      if (!node) return "";
      if (node.tagName==="IMG") return "Image: "+(node.getAttribute("src")||"")+
        "\nDescription: "+(node.getAttribute("alt")||"");
      if (node.tagName==="A") return "Link: "+(node.getAttribute("href")||"")+
        "\nText: "+node.textContent.trim();
      return node.textContent.trim();
    };
    for (const key of ids) {
      const beforeMarkup=state.original.get(key)||"";
      const previous=new DOMParser().parseFromString(beforeMarkup,"text/html").body.firstElementChild;
      const current=getWorking(key);
      if (!current) continue;
      const item=document.createElement("section");
      item.className="review-change";
      const heading=document.createElement("h3");
      heading.textContent=current.tagName.toLowerCase()+" · "+key;
      item.appendChild(heading);
      for (const [label,value] of [
        ["Before",previewText(previous)],
        ["After",previewText(current)]
      ]) {
        const block=document.createElement("div");
        block.className="review-change-part";
        const title=document.createElement("strong");
        title.textContent=label;
        const text=document.createElement("p");
        text.textContent=value.length>750?value.slice(0,750)+"…":value;
        block.append(title,text);
        item.appendChild(block);
      }
      // Surface style-only edits even when the visible text has not changed.
      const styling=[
        ["font-size","Font size"],
        ["color","Text colour"],
        ["background-color","Background colour"],
        ["text-align","Text alignment"],
        ["max-width","Maximum width"],
        ["margin-top","Space above"],
        ["margin-bottom","Space below"]
      ];
      const styleChanges=styling.flatMap(([prop,name])=>{
        const before=previous?.style.getPropertyValue(prop)||"";
        const after=current.style.getPropertyValue(prop)||"";
        return before===after?[]:[name+": "+(before||"Page stylesheet")+
          " → "+(after||"Page stylesheet")];
      });
      if(styleChanges.length){
        const change=document.createElement("div");
        change.className="review-change-part";
        const title=document.createElement("strong");title.textContent="Visual styling";
        const values=document.createElement("p");
        values.textContent=styleChanges.join("\n");
        values.style.whiteSpace="pre-wrap";
        change.append(title,values);
        item.appendChild(change);
      }
      list.appendChild(item);
    }
    state.removals.forEach((removal,index)=>{
      const section=document.createElement("section");section.className="review-change";
      const heading=document.createElement("h3");
      heading.textContent="Removed existing "+removal.tag+" · "+removal.key;
      const content=document.createElement("p");
      const before=new DOMParser().parseFromString(removal.before,"text/html").body.firstElementChild;
      content.textContent=removal.tag==="img"?
        "Image · "+(before?.getAttribute("alt")||before?.getAttribute("src")||""):
        (before?.textContent.trim().slice(0,280)||"");
      const restore=document.createElement("button");restore.type="button";
      restore.textContent="Restore original block";
      restore.setAttribute("aria-label","Restore removed source block "+(index+1));
      restore.addEventListener("click",()=>restoreReviewedSource(index));
      section.append(heading,content,restore);list.append(section);
    });
    state.additions.forEach((item,index)=>{
      const el=document.createElement('section');el.className='review-change';
      const title=document.createElement('h3');title.textContent='New '+insertionKind(item)+' after '+item.selector;
      const text=document.createElement('p');text.textContent=item.text;
      if(insertionKind(item)==='link')text.textContent+=' · '+item.href;
      const edit=document.createElement('button');
      edit.type='button';edit.textContent='Edit added content';
      edit.setAttribute('aria-label','Edit added '+insertionKind(item)+' '+(index+1));
      edit.addEventListener('click',()=>modifyReviewedAddition(index));
      const remove=document.createElement('button');
      remove.type='button';remove.textContent='Remove addition';
      remove.setAttribute('aria-label','Remove added '+insertionKind(item)+' '+(index+1));
      remove.addEventListener('click',()=>modifyReviewedAddition(index,true));
      const siblings=state.additions.map((entry,i)=>entry.selector===item.selector?i:-1).filter(i=>i>=0);
      const position=siblings.indexOf(index);
      const up=document.createElement('button');
      up.type='button';up.textContent='Move earlier';up.disabled=position===0;
      up.setAttribute('aria-label','Move added '+insertionKind(item)+' '+(index+1)+' earlier');
      up.addEventListener('click',()=>moveReviewedAddition(index,-1));
      const down=document.createElement('button');
      down.type='button';down.textContent='Move later';down.disabled=position===siblings.length-1;
      down.setAttribute('aria-label','Move added '+insertionKind(item)+' '+(index+1)+' later');
      down.addEventListener('click',()=>moveReviewedAddition(index,1));
      el.append(title,text,up,down,edit,remove);list.append(el);
    });
    if(layoutGroups().length){
      const layout=document.createElement("section");
      layout.className="review-change";
      const heading=document.createElement("h3");
      heading.textContent="Responsive groups · "+layoutGroups().length+" sections · "+layoutGroups().reduce((n,g)=>n+g.children.length,0)+" blocks";
      const info=document.createElement("p");
      info.textContent="A source-preserving 12-column grid with independent desktop and mobile positions. DOM reading order, links, and surrounding page markup remain unchanged.";
      const pre=document.createElement("pre");
      pre.textContent=layoutCss(new DOMParser().parseFromString(state.source,'text/html'));
      pre.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;max-height:200px;overflow:auto";
      layout.append(heading,info,pre);
      list.append(layout);
    }
    if(state.stagedMedia){
      const node=document.createElement("p");
      node.textContent="Staged image · "+state.stagedMedia.path+
        ". The binary file must accompany this HTML in the review PR.";
      list.appendChild(node);
    }
    if(reordered){
      const row=document.createElement("section");row.className="review-change";
      const heading=document.createElement("h3");heading.textContent="Section order";
      const p=document.createElement("p");
      p.textContent="Original "+state.originalSections.join(" → ")+"\nRevised "+state.sectionOrder.join(" → ");
      p.style.whiteSpace="pre-wrap";row.append(heading,p);list.prepend(row);
    }
    const status=$("reviewExportStatus");
    try {
      buildExport();
      status.textContent="Source check passed. Changes can be exported for review.";
      status.dataset.tone="ok";
    } catch(error) {
      status.textContent="Export requires attention. "+error.message;
      status.dataset.tone="warning";
    }
    const modal=$("reviewDialog");
    if (typeof modal.showModal==="function") modal.showModal();
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
      updateStatus(state.stagedMedia?
        "HTML exported. Download the staged image separately · Not published":
        "Edited HTML exported · Not published");
    } catch(e) {
      notice(e.message||"Could not export this page safely.","Export stopped");
    }
  }

  function restoreHistorySnapshot(last){
    state.doc=new DOMParser().parseFromString(last.html,"text/html");
    state.dirty=new Set(last.dirty);
    state.sectionOrder=Array.isArray(last.order)?last.order.slice():state.originalSections.slice();
    state.responsiveGroup=last.responsiveGroup||null;
    state.responsiveGroups=last.responsiveGroups||[];
    state.additions=last.additions||[];
    state.removals=last.removals||[];
    renderPreview();
    scheduleDraft();
  }
  function undo() {
    const before=snapshot();
    let last=null;
    // Focusing an editable element can record a checkpoint without changing
    // the document. Never consume an Undo step on an identical snapshot.
    while(state.history.length){
      const candidate=state.history.pop();
      if(JSON.stringify(candidate)!==JSON.stringify(before)){last=candidate;break;}
    }
    if(!last){updateStatus("No earlier content change · Not published");return;}
    state.redo.push(before);
    if(state.redo.length>24)state.redo.shift();
    restoreHistorySnapshot(last);
    updateStatus("Previous edit restored · Not published");
  }
  function redo() {
    const before=snapshot();
    let next=null;
    while(state.redo.length){
      const candidate=state.redo.pop();
      if(JSON.stringify(candidate)!==JSON.stringify(before)){next=candidate;break;}
    }
    if(!next){updateStatus("No further content change · Not published");return;}
    state.history.push(before);
    if(state.history.length>24)state.history.shift();
    restoreHistorySnapshot(next);
    updateStatus("Undone edit reapplied · Not published");
  }

  function resetPage() {
    if (!state.doc||!confirm("Discard all local changes to this page?")) return;
    clearStagedMedia();
    state.doc=new DOMParser().parseFromString(state.source,"text/html");
    initialIndex();
    state.dirty.clear();
    state.history.length=0;
    state.redo.length=0;
    state.staleDraft=false;
    state.responsiveGroup=null;state.responsiveGroups=[];state.additions=[];state.removals=[];
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
    replacement.setAttribute("data-editor-key",key);
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

  function consumeFluidTextHandoff(page) {
    const params=new URLSearchParams(window.location.search);
    if(params.get("importFluidText")!=="1")return false;
    function rejectHandoff(){
      notice("The layout-builder transfer could not be verified against this page. The source may have changed, or the transfer data was invalid. No edits were applied.","Transfer not applied");
      return false;
    }
    params.delete("importFluidText");
    history.replaceState(null,"",window.location.pathname+(params.size?"?"+params:"")+window.location.hash);
    let raw;
    try{raw=sessionStorage.getItem("moon-fluid-text-handoff-v1");sessionStorage.removeItem("moon-fluid-text-handoff-v1");}
    catch{return rejectHandoff();}
    if(!raw||raw.length>200000)return rejectHandoff();
    let payload;
    try{payload=JSON.parse(raw)}catch{return rejectHandoff();}
    if(!payload||typeof payload!=="object"||![1,2,3,4,5].includes(payload.version)||payload.page!==page||
       !Array.isArray(payload.changes)||payload.changes.length>100||
       (payload.version>=2&&(!Array.isArray(payload.styleChanges)||payload.styleChanges.length>100)))
      return rejectHandoff();
    const root=state.doc.querySelector("main");
    if(!root)return rejectHandoff();
    const preparedText=[],preparedStyles=[],usedText=new Set(),usedStyles=new Set();
    function lookup(change,allowNested){
      if(!change||typeof change.selector!=="string"||change.selector.length>500||
         !/^(h[1-4]|p|blockquote|figcaption)$/.test(change.tag)||
         typeof change.before!=="string"||change.before.length>4000)return null;
      let matches;
      try{matches=[...root.querySelectorAll(change.selector)]}catch{return null;}
      if(matches.length!==1||matches[0].tagName.toLowerCase()!==change.tag||
         (!allowNested&&matches[0].children.length)||
         matches[0].textContent.trim().replace(/\s+/g," ")!==change.before)return null;
      const key=matches[0].getAttribute("data-editor-key");
      if(!key||!state.original.has(key))return null;
      return {key,node:matches[0]};
    }
    for(const change of payload.changes){
      if(typeof change?.after!=="string"||change.after.length>4000||
         usedText.has(change.selector))return rejectHandoff();
      usedText.add(change.selector);
      const target=lookup(change,false);
      if(!target||preparedText.some(p=>p.key===target.key))return rejectHandoff();
      preparedText.push({key:target.key,text:change.after});
    }
    if(payload.version>=2){
      for(const change of payload.styleChanges){
        if(usedStyles.has(change?.selector))return rejectHandoff();
        usedStyles.add(change.selector);
        const target=lookup(change,true);
        if(!target||preparedStyles.some(p=>p.key===target.key))return rejectHandoff();
        const styles=change.styles;
        if(!styles||typeof styles!=="object"||Array.isArray(styles))return rejectHandoff();
        const keys=Object.keys(styles);
        if(!keys.length||keys.length>7||keys.some(k=>!["align","fontSize","color","background","maxWidthPct","spaceAbove","spaceBelow"].includes(k)))return rejectHandoff();
        for(const k of keys){
          const value=styles[k];
          if(k==="align"&&!["left","center","right"].includes(value))return rejectHandoff();
          if(k==="fontSize"&&(!Number.isInteger(value)||value<12||value>80))return rejectHandoff();
          if((k==="color"||k==="background")&&(typeof value!=="string"||!/^#[0-9a-fA-F]{6}$/.test(value)))return rejectHandoff();
          if(k==="maxWidthPct"&&(!Number.isInteger(value)||value<30||value>100))return rejectHandoff();
          if((k==="spaceAbove"||k==="spaceBelow")&&(!Number.isInteger(value)||value<0||value>80))return rejectHandoff();
        }
        preparedStyles.push({key:target.key,styles});
      }
    }
    let preparedGroups=[];
    if(payload.version===3||payload.version===4||(payload.version===5&&Array.isArray(payload.layoutGroups)&&payload.layoutGroups.length)){
      if(!window.MoonResponsiveLayout)return rejectHandoff();
      const received=payload.version===3?[payload.layoutGroup]:payload.layoutGroups||[];
      try{
        MoonResponsiveLayout.cssForGroups(new DOMParser().parseFromString(state.source,'text/html'),received);
        preparedGroups=received;
      }catch{return rejectHandoff()}
    }
    let preparedAdditions=[];
    if(payload.version===5){
      try{
        preparedAdditions=validateParagraphAdditions(payload.additions);
        const sourceRoot=state.doc.querySelector('main');
        for(const addition of preparedAdditions){
          const anchor=sourceRoot.querySelector(addition.selector);
          if(preparedGroups.some(group=>sourceRoot.querySelector(group.parentSelector)?.contains(anchor)))
            throw Error('Paragraph insertion conflicts with a responsive layout group');
        }
      }catch{return rejectHandoff()}
    }
    if(!preparedText.length&&!preparedStyles.length&&!preparedGroups.length&&!preparedAdditions.length)return rejectHandoff();
    let existingDraft=false;
    try{existingDraft=localStorage.getItem(DRAFT_PREFIX+page)!==null}catch{existingDraft=true}
    if(existingDraft||state.dirty.size||state.staleDraft||layoutGroups().length||state.additions.length||state.removals.length){
      notice("The page already has a local draft. Review or export that draft before transferring changes.","Transfer not applied");
      return false;
    }
    if(!confirm("Apply "+preparedText.length+" verified text edits and "+preparedStyles.length+
       " visual style edits and "+preparedGroups.reduce((n,g)=>n+g.children.length,0)+" responsive block placements across "+preparedGroups.length+" groups and "+preparedAdditions.length+" new content blocks to the local editor draft? Unapproved freeform positions are not included. Nothing will be published."))return false;
    checkpoint();
    const touched=new Set();
    for(const change of preparedText){
      const node=getWorking(change.key);
      node.textContent=change.text;
      touched.add(change.key);
    }
    for(const change of preparedStyles){
      const node=getWorking(change.key);
      for(const [key,value] of Object.entries(change.styles)){
        if(key==="align")node.style.textAlign=value;
        else if(key==="fontSize")node.style.fontSize=value+"px";
        else if(key==="color")node.style.color=value;
        else if(key==="background")node.style.backgroundColor=value;
        else if(key==="maxWidthPct")node.style.maxWidth=value+"%";
        else if(key==="spaceAbove")node.style.marginTop=value+"px";
        else if(key==="spaceBelow")node.style.marginBottom=value+"px";
      }
      touched.add(change.key);
    }
    for(const key of touched)updateDirty(key);
    state.responsiveGroup=preparedGroups.length===1?preparedGroups[0]:null;
    state.responsiveGroups=preparedGroups;
    state.additions=preparedAdditions;
    saveDraft();
    return true;
  }

  async function loadPage(page) {
    if (!/^[a-z0-9-]+\.html$/.test(page)) return;
    if(state.page&&page!==state.page&&state.stagedMedia&&
       !confirm("The new image is only staged in this browser. Switching pages will discard its file. Continue?")){
      $("pagePicker").value=state.page;return;
    }
    if (state.doc) saveDraft();
    if(page!==state.page)clearStagedMedia();
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
      state.responsiveGroup=null;state.responsiveGroups=[];state.additions=[];state.removals=[];
      state.dirty.clear();
      state.history.length=0;
      state.redo.length=0;
      state.staleDraft=false;
      initialIndex();
      restoreDraft();
      const transferred=consumeFluidTextHandoff(page);
      renderPreview();
      const moved=state.sectionOrder.some((id,i)=>id!==state.originalSections[i]);
      updateStatus(transferred?"Verified content, style and/or responsive layout transferred · Not published":state.dirty.size||moved||layoutGroups().length||state.additions.length||state.removals.length?"Draft restored · Not published":state.staleDraft?"Older local draft exists · Not applied":"Ready to edit · Not published");
    } catch(e) {
      notice("Could not load "+page+". "+e.message,"Page load failed");
      if (state.page) $("pagePicker").value=state.page;
      updateStatus("Unable to load page");
    }
  }

  function init() {
    $("pagePicker").addEventListener("change",event=>loadPage(event.target.value));
    $("previewViewport").addEventListener("change",event=>{
      $("previewContainer").className="preview-frame-container "+event.target.value;
    });
    $("previewTheme").addEventListener("change",event=>{
      const documentInFrame=$("pageFrame").contentDocument;
      if (documentInFrame) {
        state.frameDoc=documentInFrame;
        documentInFrame.documentElement.setAttribute("data-moon-theme",event.target.value);
        documentInFrame.documentElement.style.colorScheme=event.target.value;
      }
    });
    $("pageFindQuery").addEventListener("input",()=>refreshPageFind(true));
    $("pageFindQuery").addEventListener("keydown",event=>{
      if(event.key==="Enter"){
        event.preventDefault();
        navigatePageFind(event.shiftKey?-1:1);
      } else if(event.key==="Escape"&&event.target.value){
        event.preventDefault();
        event.target.value="";
        refreshPageFind(true);
      }
    });
    $("pageFindNext").addEventListener("click",()=>navigatePageFind(1));
    $("pageFindPrev").addEventListener("click",()=>navigatePageFind(-1));
    $("pageFindClear").addEventListener("click",()=>{
      $("pageFindQuery").value="";
      refreshPageFind(true);
      $("pageFindQuery").focus();
    });
    $("selectionText").addEventListener("focus",checkpoint);
    $("selectionText").addEventListener("input",onInspectorText);
    $("imageSrc").addEventListener("change",event=>updateSelectedAttribute("src",event.target.value));
    $("imageAlt").addEventListener("change",event=>updateSelectedAttribute("alt",event.target.value));
    $("imageWidthPercent").addEventListener("input",event=>{
      if(!state.imageSliderActive){checkpoint();state.imageSliderActive=true;}
      resizeImage(Number(event.target.value));
    });
    $("imageWidthPercent").addEventListener("change",event=>{
      if(!state.imageSliderActive)checkpoint();
      resizeImage(Number(event.target.value));
      state.imageSliderActive=false;
    });
    $("textAlignment").addEventListener("change",event=>
      updateSelectedStyle("textAlign",event.target.value,["left","center","right","justify"]));
    for(const [id,property,unit,min,max] of [
      ["textFontSize","fontSize","px",12,80],
      ["textMaxWidth","maxWidth","%",30,100],
      ["textSpaceAbove","marginTop","px",0,80],
      ["textSpaceBelow","marginBottom","px",0,80]
    ])$(id).addEventListener("change",()=>updateNumericInspectorStyle(property,id,unit,min,max));
    $("textColour").addEventListener("change",()=>updateColorInspectorStyle("color","textColour"));
    $("textBackgroundColour").addEventListener("change",()=>updateColorInspectorStyle("backgroundColor","textBackgroundColour"));
    $("linkHref").addEventListener("change",event=>updateSelectedAttribute("href",event.target.value));
    $("linkTarget").addEventListener("change",event=>updateSelectedAttribute("target",event.target.value==="new"?"_blank":""));
    $("undoBtn").addEventListener("click",undo);
    $("redoBtn").addEventListener("click",redo);
    $("resetBtn").addEventListener("click",resetPage);
    $("revertElementBtn").addEventListener("click",revertSelected);
    $("removeSourceBtn").addEventListener("click",removeSelectedSource);
    $("directLayoutPreset").addEventListener("change",()=>{
      $("directLayoutCustomField").hidden=$("directLayoutPreset").value!=="custom";
    });
    $("directLayoutCustomColumns").addEventListener("input",event=>{
      const first=Number(event.target.value);
      $("directLayoutCustomValue").textContent=first+" / "+(12-first)+" columns";
    });
    $("directLayoutCustomColumns").addEventListener("change",()=>{
      if($("directLayoutPreset").value!=="custom")return;
      const chosen=directLayoutSelection();
      if(chosen&&layoutGroups().some(group=>group.parentSelector===chosen.spec.parentSelector))
        updateDirectLayout();
    });
    $("directLayoutApply").addEventListener("click",()=>updateDirectLayout());
    $("directLayoutRemove").addEventListener("click",()=>updateDirectLayout(true));
    $("insertContentKind").addEventListener("change",updateInsertKind);
    $("addedBlockText").addEventListener("keydown",event=>{
      if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){
        event.preventDefault();applyAddedBlock();
      }
    });
    $("applyAddedBlockBtn").addEventListener("click",applyAddedBlock);
    $("removeAddedBlockBtn").addEventListener("click",removeAddedBlock);
    $("duplicateAddedBlockBtn").addEventListener("click",duplicateAddedBlock);
    $("moveAddedEarlierBtn").addEventListener("click",()=>moveReviewedAddition(state.selectedAddition,-1));
    $("moveAddedLaterBtn").addEventListener("click",()=>moveReviewedAddition(state.selectedAddition,1));
    $("insertContentBtn").addEventListener("click",addContentFromInspector);
    $("duplicateSourceBtn").addEventListener("click",duplicateSelectedSource);
    updateInsertKind();
    $("exportBtn").addEventListener("click",exportHtml);
    $("newImageFile").addEventListener("change",()=>{
      $("stageImageBtn").disabled=!$("newImageFile").files?.length;
    });
    $("stageImageBtn").addEventListener("click",stageNewImage);
    $("downloadStagedImage").addEventListener("click",downloadStagedImage);
    $("reviewBtn").addEventListener("click",reviewChanges);
    $("chooseExistingImage").addEventListener("click",()=>openMediaLibrary(false));
    $("chooseInsertImageBtn").addEventListener("click",()=>openMediaLibrary(true));
    $("chooseAddedImageBtn").addEventListener("click",()=>openMediaLibrary("added"));
    $("mediaSearch").addEventListener("input",event=>{
      const query=event.target.value.trim().toLowerCase();
      renderMediaResults((state.mediaAssets||[]).filter(item=>
        (item.path+" "+item.description).toLowerCase().includes(query)));
    });
    $("publisherConnect").addEventListener("click",connectPublisher);
    $("publisherPropose").addEventListener("click",createPublisherProposal);
    $("publisherSummary").addEventListener("input",updatePublishControls);
    publishMessage(publisherConfigured()?
      "Not connected. Sign in with your authorized GitHub account.":
      "GitHub publishing is not configured. Export HTML remains available.");
    updatePublishControls();
    processPublisherCallback();
    window.addEventListener("beforeunload",()=>{if (state.page) saveDraft();});
    const requestedPage=new URLSearchParams(window.location.search).get("page");
    const pageOptions=[...$("pagePicker").options].map(option=>option.value);
    if(requestedPage&&pageOptions.includes(requestedPage))$("pagePicker").value=requestedPage;
    loadPage($("pagePicker").value);
  }

  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();