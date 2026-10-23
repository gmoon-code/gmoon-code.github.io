/* Local-first visual editor for the public academic portfolio.
   Preview scripts never run. No credentials are collected or stored. */
(function () {
  "use strict";

  const EDITABLE = "h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,dt,dd,a,img,th,td";
  const TEXT_TAGS = new Set(["H1","H2","H3","H4","H5","H6","P","LI","FIGCAPTION","BLOCKQUOTE","DT","DD","A","TH","TD"]);
  const DRAFT_PREFIX = "moon-portfolio-visual-editor-v1:";
  const PANEL_PREFERENCE_KEY="moon-portfolio-editor-workspace-v1";
  const panelPreference={pages:true,inspector:true};
  function setWorkspacePanel(panel,open){
    if(!["pages","inspector"].includes(panel))return;
    panelPreference[panel]=Boolean(open);
    const area=$("editorNavigation").parentElement;
    area.classList.toggle("is-pages-collapsed",!panelPreference.pages);
    area.classList.toggle("is-inspector-collapsed",!panelPreference.inspector);
    for(const [key,id,label] of [["pages","togglePagesPanel","pages"],["inspector","toggleInspectorPanel","inspector"]]){
      const button=$(id);
      button.textContent=(panelPreference[key]?"Hide ":"Show ")+label;
      button.setAttribute("aria-expanded",String(panelPreference[key]));
    }
    const focusButton=$("toggleCanvasFocus");
    if(focusButton){
      const focused=!panelPreference.pages&&!panelPreference.inspector;
      focusButton.textContent=focused?"Show both panels":"Focus canvas";
      focusButton.setAttribute("aria-pressed",String(focused));
    }
    try{localStorage.setItem(PANEL_PREFERENCE_KEY,JSON.stringify(panelPreference));}
    catch{/* Storage may be unavailable. The controls still work. */}
  }
  function initialiseWorkspacePanels(){
    try{
      const saved=JSON.parse(localStorage.getItem(PANEL_PREFERENCE_KEY)||"null");
      if(saved&&typeof saved==="object"){
        if(typeof saved.pages==="boolean")panelPreference.pages=saved.pages;
        if(typeof saved.inspector==="boolean")panelPreference.inspector=saved.inspector;
      }
    }catch{/* Invalid preferences use both panels open. */}
    setWorkspacePanel("pages",panelPreference.pages);
    setWorkspacePanel("inspector",panelPreference.inspector);
    $("togglePagesPanel").addEventListener("click",()=>setWorkspacePanel("pages",!panelPreference.pages));
    $("toggleInspectorPanel").addEventListener("click",()=>setWorkspacePanel("inspector",!panelPreference.inspector));
    $("toggleCanvasFocus").addEventListener("click",()=>{
      const focused=!panelPreference.pages&&!panelPreference.inspector;
      setWorkspacePanel("pages",focused);
      setWorkspacePanel("inspector",focused);
    });
  }
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
      (!state.dirty.size&&!moved&&!layoutGroups().length&&!state.additions.length&&!state.removals.length&&!state.blockOrders.length)||!$("publisherSummary").value.trim();
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
    pageFindKeys:[],pageFindIndex:-1,mediaChooseInsert:false,removals:[],selectedAddition:null,blockOrders:[],columnPointer:null,blockPointer:null,addedPointer:null,addedWidthPointer:null,sourceWidthPointer:null,addedBlockSliderActive:false
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
    const total=state.dirty.size+moved+layoutGroups().length+state.additions.length+state.removals.length+state.blockOrders.length;
    $("changeCount").textContent=state.dirty.size+" edited element"+(state.dirty.size===1?"":"s")+
      (moved?" · "+moved+" moved section"+(moved===1?"":"s"):"")+
      (layoutGroups().length?" · "+layoutGroups().length+" responsive layout group"+(layoutGroups().length===1?"":"s"):"")+
      (state.additions.length?" · "+state.additions.length+" added content block"+(state.additions.length===1?"":"s"):"")+
      (state.removals.length?" · "+state.removals.length+" removed block"+(state.removals.length===1?"":"s"):"")+
      (state.blockOrders.length?" · "+state.blockOrders.length+" rearranged content group"+(state.blockOrders.length===1?"":"s"):"");
    $("exportBtn").disabled=!total;
    $("reviewBtn").disabled=!total;
    $("resetBtn").disabled=!total;
    $("undoBtn").disabled=!state.history.length;
    $("redoBtn").disabled=!state.redo.length;
    updatePublishControls();
    updateDirectPublishControls();
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
      order:state.sectionOrder.slice(),responsiveGroup:state.responsiveGroup,responsiveGroups:state.responsiveGroups.slice(),additions:state.additions.map(x=>({...x})),removals:state.removals.map(x=>({...x})),blockOrders:state.blockOrders.map(x=>({originalKeys:x.originalKeys.slice(),keys:x.keys.slice()}))};
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
      if (!items.length&&!orderChanged&&!layoutGroups().length&&!state.additions.length&&!state.removals.length&&!state.blockOrders.length) {
        if (state.staleDraft) return;
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key,JSON.stringify({
          version:1,sourceHash:state.fingerprint,updated:Date.now(),items,
          sectionOrder:state.sectionOrder.slice(),responsiveGroup:state.responsiveGroup,responsiveGroups:state.responsiveGroups,additions:state.additions,removals:state.removals,blockOrders:state.blockOrders
        }));
      }
      updateStatus(items.length||orderChanged||layoutGroups().length||state.additions.length||state.removals.length||state.blockOrders.length?"Draft saved in this browser · Not published":"No changes · Not published");
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
      if(Array.isArray(draft.blockOrders)&&draft.blockOrders.length){
        state.blockOrders=validateBlockOrders(draft.blockOrders);
        applyBlockOrdersToWorking(state.blockOrders);
      }
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
      inserted.setAttribute("tabindex","0");
      inserted.setAttribute("title","Press Enter to edit this newly added block");
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
      '[data-editor-key][data-editor-drag-target]{outline:3px dashed #27654f!important;outline-offset:4px!important;}',
      '[data-editor-added-index][data-editor-added-drop-target]{outline:3px dashed #27654f!important;outline-offset:4px!important;}',
      '[data-editor-key][data-editor-added-anchor-target]{outline:3px dashed #27654f!important;outline-offset:4px!important;}',
      "[data-editor-key][contenteditable=true]{min-height:1em;}",
      "[data-editor-key][contenteditable=true]:focus{outline:2px solid #2b8769!important;}",
      "@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}"
    ].join("\n");
    copy.head.appendChild(overlay);
    copy.documentElement.setAttribute("data-moon-theme",$("previewTheme").value);
    copy.documentElement.style.colorScheme=$("previewTheme").value;
    return "<!doctype html>\n"+copy.documentElement.outerHTML;
  }

  function renderPreview(reselectKey=null,reselectAddition=null) {
    closeQuickSize(true);
    state.selected=null;
    state.selectedAddition=null;
    state.addedBlockSliderActive=false;
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
        d.addEventListener("keydown",onPreviewKeydown,true);
        d.addEventListener("input",onPreviewInput,true);
        d.addEventListener("focusin",onPreviewFocus,true);
        d.addEventListener("paste",onPreviewPaste,true);
        d.addEventListener("scroll",positionImageResizeHandle,true);
        d.addEventListener("scroll",positionBlockMoveHandle,true);
        d.addEventListener("scroll",positionAddedMoveHandle,true);
        d.addEventListener("scroll",positionAddedWidthHandle,true);
        d.addEventListener("scroll",positionSourceWidthHandle,true);
        d.addEventListener("scroll",positionQuickToolbar,true);
        d.defaultView.addEventListener("scroll",positionQuickSize);
        // Only viewport scrolls move the composer. Internal form scrolling
        // must not reposition the form under the user's pointer.
        d.defaultView.addEventListener("scroll",positionQuickComposer);
        d.defaultView.addEventListener("scroll",positionQuickLayout);
        d.addEventListener("scroll",positionColumnResizeHandle,true);
        d.defaultView.addEventListener("resize",positionImageResizeHandle);
        d.defaultView.addEventListener("resize",positionBlockMoveHandle);
        d.defaultView.addEventListener("resize",positionAddedMoveHandle);
        d.defaultView.addEventListener("resize",positionAddedWidthHandle);
        d.defaultView.addEventListener("resize",positionSourceWidthHandle);
        d.defaultView.addEventListener("resize",positionQuickToolbar);
        d.defaultView.addEventListener("resize",positionQuickSize);
        d.defaultView.addEventListener("resize",positionQuickComposer);
        d.defaultView.addEventListener("resize",positionQuickLayout);
        d.defaultView.addEventListener("resize",positionColumnResizeHandle);

        refreshPageFind();
        updateBrowseControls();
        if(reselectKey){
          const target=d.querySelector('[data-editor-key="'+reselectKey+'"]');
          if(target){selectElement(target);target.scrollIntoView({block:"center"});}
        }
        if(Number.isInteger(reselectAddition)&&state.additions[reselectAddition]){
          selectAddedBlock(reselectAddition);
          d.querySelector('[data-editor-added-index="'+reselectAddition+'"]')
            ?.scrollIntoView({block:"center"});
        }
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

  function onPreviewKeydown(event){
    if(handleEditorShortcuts(event))return;
    if(!["Enter"," "].includes(event.key))return;
    const added=event.target.closest?.("[data-editor-added-index]");
    if(!added||!state.frameDoc)return;
    if(event.key===" "&&event.target.tagName==="A")return;
    event.preventDefault();
    selectAddedBlock(Number(added.getAttribute("data-editor-added-index")));
  }

  function onPreviewClick(event) {
    // In-preview controls must never be interpreted as selected page content.
    if(event.target.closest("#moon-quick-toolbar,#moon-quick-composer,#moon-quick-layout,#moon-quick-size,#moon-source-width-handle,#moon-quick-properties"))return;
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

  // Navigation remains preview-only and creates no editable source markers.
  // Sequential controls avoid hundreds of extra stops in the Tab order.
  function browsableElements(){
    if(!state.frameDoc)return [];
    return [...state.frameDoc.querySelectorAll("main [data-editor-key]")]
      .filter(node=>!node.closest("nav")&&node.getClientRects().length);
  }
  function updateBrowseControls(){
    const nodes=browsableElements(),selected=nodes.findIndex(node=>
      node.getAttribute("data-editor-key")===state.selected);
    $("browsePrevElement").disabled=!nodes.length;
    $("browseNextElement").disabled=!nodes.length;
    $("browseElementStatus").textContent=!nodes.length?
      "No editable content available on this page.":
      selected<0?"Use Previous or Next to select one of "+nodes.length+" original elements.":
      "Element "+(selected+1)+" of "+nodes.length+
        " · "+nodes[selected].tagName.toLowerCase()+
        " · Selection is in the page preview.";
  }
  function browseElement(direction){
    const nodes=browsableElements();
    if(!nodes.length||![-1,1].includes(direction))return;
    const current=nodes.findIndex(node=>
      node.getAttribute("data-editor-key")===state.selected);
    const next=current<0?(direction===1?0:nodes.length-1):
      (current+direction+nodes.length)%nodes.length;
    const target=nodes[next];
    selectElement(target);
    target.setAttribute("tabindex","-1");
    target.focus({preventScroll:true});
    target.scrollIntoView({block:"center"});
    updateBrowseControls();
  }
  function handleEditorShortcuts(event){
    if(!state.doc||event.defaultPrevented)return false;
    const typing=Boolean(event.target?.closest?.("input,textarea,select,[contenteditable='true'],[role='textbox']"));
    // Alt+Shift+C toggles the editing panels without taking over browser
    // Find or interfering with typing inside forms.
    if(event.altKey&&event.shiftKey&&!event.ctrlKey&&!event.metaKey&&event.key.toLowerCase()==="c"&&!typing){
      event.preventDefault();
      $("toggleCanvasFocus").click();
      return true;
    }
    // The slash key opens the existing page content finder from anywhere
    // in the editor outside input fields. No source content is altered.
    if(event.key==="/"&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!typing){
      event.preventDefault();
      if(!panelPreference.pages)setWorkspacePanel("pages",true);
      $("pageFindQuery").focus();
      return true;
    }
    if(!(event.ctrlKey||event.metaKey)||event.altKey)return false;
    const key=event.key.toLowerCase();
    if(key==="s"&&!event.shiftKey){
      event.preventDefault();
      saveDraft();
      return true;
    }
    // Browser-native undo should remain available while writing in a field.
    if(event.target?.closest?.("input,textarea,select,[contenteditable='true'],[role='textbox']"))
      return false;
    if(key==="z"||(key==="y"&&!event.shiftKey)){
      event.preventDefault();
      if((key==="z"&&event.shiftKey)||key==="y")redo();
      else undo();
      return true;
    }
    return false;
  }

  // All contextual controls live only in the script-disabled preview iframe.
  // Source documents, draft HTML and exported pages never receive this toolbar.
  const QUICK_SOURCE_TAGS=new Set(["P","H1","H2","H3","H4","BLOCKQUOTE","LI","IMG"]);
  function quickSelection(){
    const doc=state.frameDoc;
    if(!doc)return null;
    if(state.selectedAddition!==null&&state.additions[state.selectedAddition]){
      const node=doc.querySelector('[data-editor-added-index="'+state.selectedAddition+'"]');
      return node?{node,added:true}:null;
    }
    if(state.selected){
      const node=doc.querySelector('[data-editor-key="'+state.selected+'"]');
      if(node&&QUICK_SOURCE_TAGS.has(node.tagName))return {node,added:false};
    }
    return null;
  }
  function quickAlignment(){
    if(state.selectedAddition!==null)return addedBlockLayout(state.additions[state.selectedAddition]).align;
    const source=getWorking(state.selected);
    return ["center","right"].includes(source?.style.textAlign)?source.style.textAlign:"left";
  }
  function setAddedAppearance(patch){
    const index=state.selectedAddition,item=state.additions[index];
    if(!item||insertionKind(item)==="image")return false;
    const next={...(item.appearance||{}),...patch};
    for(const key of Object.keys(next))if(next[key]===""||next[key]===null)delete next[key];
    if(!allowedAppearance(next))return false;
    const updated={...item};
    if(Object.keys(next).length)updated.appearance=next;
    else delete updated.appearance;
    const proposed=state.additions.map((entry,i)=>i===index?updated:entry);
    try{validateParagraphAdditions(proposed)}catch{return false;}
    checkpoint();
    state.additions=proposed;
    const node=state.frameDoc?.querySelector('[data-editor-added-index="'+index+'"]');
    if(node){
      const css=addedBlockStyle(updated);
      if(css)node.style.cssText=css;
      else node.removeAttribute("style");
    }
    scheduleDraft();
    updateStatus("Text appearance changed · Local draft");
    return true;
  }
  function closeQuickProperties(){
    state.frameDoc?.getElementById("moon-quick-properties")?.remove();
  }
  function positionQuickProperties(){
    const doc=state.frameDoc,panel=doc?.getElementById("moon-quick-properties");
    const bar=doc?.getElementById("moon-quick-toolbar");
    if(!panel||!bar||bar.hidden)return;
    const view=doc.defaultView,b=bar.getBoundingClientRect();
    const width=Math.min(300,Math.max(80,view.innerWidth-12));
    panel.style.width=width+"px";
    panel.style.maxHeight=Math.max(80,view.innerHeight-12)+"px";
    const height=panel.getBoundingClientRect().height;
    const left=Math.max(6,Math.min(view.innerWidth-width-6,b.left));
    const top=b.bottom+6+height<=view.innerHeight-6?b.bottom+6:
      Math.max(6,b.top-height-6);
    panel.style.left=left+"px";panel.style.top=Math.max(6,top)+"px";
  }
  function openQuickProperties(){
    const selected=quickSelection(),doc=state.frameDoc;
    if(!selected||!doc)return;
    closeQuickProperties();
    const isImage=selected.added?
      insertionKind(state.additions[state.selectedAddition])==="image":
      selected.node.tagName==="IMG";
    if(!isImage&&!(selected.added||TEXT_TAGS.has(selected.node.tagName)))return;
    const dark=$("previewTheme").value==="dark";
    const panel=doc.createElement("section");
    panel.id="moon-quick-properties";
    panel.setAttribute("role","dialog");
    panel.setAttribute("aria-label",isImage?"Edit selected image":"Style selected text");
    panel.setAttribute("aria-modal","false");
    panel.style.cssText="position:fixed;z-index:2147483646;display:grid;gap:9px;"+
      "box-sizing:border-box;padding:13px;overflow:auto;border-radius:11px;"+
      "border:1px solid "+(dark?"#9bad9e":"#a9c1b2")+";"+
      "background:"+(dark?"#1a1c1a":"#fff")+";color:"+(dark?"#f5f7f5":"#183e30")+";"+
      "box-shadow:0 8px 24px #0004;font:13px/1.45 system-ui,sans-serif";
    panel.addEventListener("click",event=>event.stopPropagation());
    panel.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closeQuickProperties();}
    });
    const heading=doc.createElement("strong");
    heading.textContent=isImage?"Image size and content":"Fonts and colours";
    const field=(label,control)=>{
      const row=doc.createElement("label");
      row.style.cssText="display:grid;gap:4px;font:600 12px system-ui";
      const caption=doc.createElement("span");caption.textContent=label;
      control.style.cssText="box-sizing:border-box;min-width:0;width:100%;"+
        "min-height:32px;padding:5px;border-radius:5px;border:1px solid #9cb0a6;"+
        "background:"+(dark?"#292f29":"#fff")+";color:inherit";
      row.append(caption,control);return row;
    };
    const button=(name,action)=>{
      const node=doc.createElement("button");node.type="button";node.textContent=name;
      node.style.cssText="cursor:pointer;min-height:34px;border:1px solid #94ac9b;"+
        "border-radius:6px;padding:6px 9px;background:transparent;color:inherit";
      node.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();action();});
      return node;
    };
    panel.append(heading);
    if(isImage){
      const image=selectedPreviewImage();
      if(!image)return;
      const size=doc.createElement("input");
      size.type="range";size.min="20";size.max="100";size.step="5";
      let previous=Number.parseInt(image.style.width||image.style.maxWidth,10);
      if(!Number.isFinite(previous)||previous<20||previous>100)previous=100;
      size.value=String(Math.round(previous/5)*5);
      const percent=doc.createElement("span");
      percent.textContent=size.value+"%";
      size.setAttribute("aria-label","Image width percentage");
      size.addEventListener("input",()=>{percent.textContent=size.value+"%";});
      size.addEventListener("change",()=>{
        const value=Number(size.value);
        if(selected.added){
          checkpoint();
          resizeAddedImage(value);
        }else resizeImage(value,true);
        percent.textContent=value+"%";
      });
      const row=doc.createElement("div");row.style.cssText="display:flex;align-items:center;gap:8px";
      row.append(size,percent);
      panel.append(field("Width",row));
      const presets=doc.createElement("div");
      presets.style.cssText="display:flex;flex-wrap:wrap;gap:5px";
      for(const value of [25,50,75,100]){
        presets.append(button(value+"%",()=>{
          size.value=String(value);
          size.dispatchEvent(new doc.defaultView.Event("change",{bubbles:true}));
        }));
      }
      panel.append(presets);
      const alt=doc.createElement("input");alt.type="text";alt.maxLength=200;
      alt.value=selected.added?state.additions[state.selectedAddition].text:
        getWorking(state.selected)?.getAttribute("alt")||"";
      const saveAlt=button("Save description",()=>{
        const value=alt.value.trim();
        if(!value){alt.setCustomValidity("Describe the image before saving.");alt.reportValidity();return;}
        alt.setCustomValidity("");
        if(selected.added){
          $("addedBlockText").value=value;
          applyAddedBlock();
        }else updateSelectedAttribute("alt",value);
        closeQuickProperties();
      });
      panel.append(field("Image description for accessibility",alt),saveAlt);
      panel.append(button("Replace from website images",()=>{
        closeQuickProperties();
        openMediaLibrary(selected.added?"added":false);
      }));
      const tip=doc.createElement("small");
      tip.textContent="Drag the corner handle on the image to resize it directly. Move with the on-page arrows or drag handle where source order permits.";
      panel.append(tip);
    }else{
      const appearance=selected.added?state.additions[state.selectedAddition]?.appearance||{}:{};
      const working=selected.added?null:getWorking(state.selected);
      const family=doc.createElement("select");family.setAttribute("aria-label","Font family");
      const current=selected.added?appearance.family||"":working?.style.fontFamily||"";
      for(const [id,value] of Object.entries(QUICK_FONTS)){
        const option=doc.createElement("option");option.value=value;
        option.textContent={default:"Site default",serif:"Georgia",classic:"Times New Roman",
          sans:"Arial",modern:"System sans",mono:"Monospace"}[id];
        family.append(option);
      }
      family.value=current;
      family.addEventListener("change",()=>{
        if(selected.added)setAddedAppearance({family:family.value});
        else updateSelectedStyle("fontFamily",family.value,Object.values(QUICK_FONTS));
      });
      panel.append(field("Font",family));
      const size=doc.createElement("input");size.type="number";
      size.min="12";size.max="80";size.step="1";size.placeholder="Site default";
      size.setAttribute("aria-label","Font size in pixels");
      size.value=String(selected.added?appearance.size||"":
        Number.parseInt(working?.style.fontSize,10)||"");
      size.addEventListener("change",()=>{
        if(size.value!==""&&(!Number.isInteger(Number(size.value))||
          Number(size.value)<12||Number(size.value)>80)){size.reportValidity();return;}
        if(selected.added)setAddedAppearance({size:size.value?Number(size.value):null});
        else updateSelectedStyle("fontSize",size.value?size.value+"px":"",[size.value?size.value+"px":""]);
      });
      panel.append(field("Size in pixels (12–80)",size));
      for(const [label,prop,key] of [["Text colour","color","color"],["Background colour","backgroundColor","background"]]){
        const palette=doc.createElement("div");palette.style.cssText="display:flex;gap:5px;align-items:center;flex-wrap:wrap";
        const picker=doc.createElement("input");picker.type="color";
        picker.style.cssText="width:48px;height:33px;cursor:pointer;padding:2px";
        picker.setAttribute("aria-label",label);
        picker.value=selected.added?appearance[key]||"#ffffff":
          colorAsHex(working?.style[prop])||"#ffffff";
        picker.addEventListener("change",()=>{
          if(selected.added)setAddedAppearance({[key]:picker.value});
          else updateSelectedStyle(prop,picker.value,[picker.value]);
        });
        const clear=button("Reset",()=>{
          if(selected.added)setAddedAppearance({[key]:null});
          else updateSelectedStyle(prop,"",[""]);
        });
        palette.append(picker,clear);
        panel.append(field(label,palette));
      }
    }
    const done=button("Done",closeQuickProperties);
    panel.append(done);
    doc.body.append(panel);
    positionQuickProperties();
  }

  function positionQuickToolbar(){
    const doc=state.frameDoc,bar=doc?.getElementById("moon-quick-toolbar");
    if(!bar)return;
    const selected=quickSelection();
    if(!selected){bar.remove();return;}
    const view=doc.defaultView,rect=selected.node.getBoundingClientRect();
    if(rect.bottom<0||rect.right<0||rect.top>view.innerHeight||rect.left>view.innerWidth){
      bar.hidden=true;return;
    }
    bar.hidden=false;
    const width=bar.getBoundingClientRect().width||290;
    const height=bar.getBoundingClientRect().height||38;
    const maxLeft=Math.max(4,view.innerWidth-width-4);
    const maxTop=Math.max(4,view.innerHeight-height-4);
    // Keep the controls outside the selected text where there is enough
    // room. A toolbar below a page-top heading can cover the next paragraph
    // and prevent its selection, so use a bottom-corner fallback.
    let left,top;
    if(rect.right+width+9<=view.innerWidth-4){
      left=rect.right+8;top=rect.top;
    }else if(rect.left-width-9>=4){
      left=rect.left-width-8;top=rect.top;
    }else if(rect.top>=height+10){
      left=rect.left;top=rect.top-height-7;
    }else{
      // The bottom of the preview iframe may extend beyond the editor's
      // visible browser viewport. Keep the compact fallback at the top edge
      // and away from the centre of the next original paragraph.
      left=maxLeft;top=4;
    }
    // A numeric left coordinate can outlive a responsive iframe width
    // transition. Keep the actual CSS position clamped to the changing
    // viewport even before the next resize notification arrives.
    const desiredLeft=Math.max(4,Math.min(maxLeft,left));
    bar.style.left="max(4px,min("+desiredLeft+"px,calc(100vw - min(310px, calc(100vw - 8px)) - 4px)))";
    bar.style.top=Math.max(4,Math.min(maxTop,top))+"px";
  }
  function createQuickToolbar(){
    const doc=state.frameDoc;
    if(!doc)return;
    doc.getElementById("moon-quick-composer")?.remove();
    doc.getElementById("moon-quick-layout")?.remove();
    closeQuickSize(true);
    doc.getElementById("moon-quick-toolbar")?.remove();
    const selected=quickSelection();
    if(!selected)return;
    const dark=$("previewTheme").value==="dark";
    const bar=doc.createElement("div");
    bar.id="moon-quick-toolbar";
    bar.setAttribute("role","toolbar");
    bar.setAttribute("aria-label","Selected block quick actions");
    bar.setAttribute("aria-orientation","horizontal");
    bar.style.cssText="position:fixed;z-index:2147483644;display:flex;align-items:center;flex-wrap:wrap;gap:4px;padding:5px;"+
      "width:min(310px,calc(100vw - 8px));box-sizing:border-box;border:1px solid "+
      (dark?"#a7baa9":"#9cb7a9")+";border-radius:9px;background:"+
      (dark?"#1a1c1a":"#fff")+";color:"+(dark?"#f5f7f5":"#183e30")+
      ";box-shadow:0 4px 16px #0003;font:600 12px/1.25 system-ui,sans-serif;max-width:calc(100vw - 8px)";
    const make=(label,action,selectedState,description)=>{
      const button=doc.createElement("button");
      button.type="button";button.textContent=label;
      button.setAttribute("aria-label",description);
      if(selectedState!==null)button.setAttribute("aria-pressed",String(selectedState));
      button.style.cssText="padding:6px 7px;min-height:30px;border:1px solid "+
        (dark?"#78887d":"#b8cac0")+";border-radius:5px;background:"+
        (selectedState===true?(dark?"#365c46":"#dceee1"):"transparent")+
        ";color:inherit;font:inherit;cursor:pointer;white-space:nowrap";
      button.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();action();
      });
      return button;
    };
    const chosenImage=selected.added?insertionKind(state.additions[state.selectedAddition])==="image":selected.node.tagName==="IMG";
    if(chosenImage){
      bar.append(make("Image",openQuickProperties,null,"Edit selected image on the page"));
    }else{
      bar.append(make("Style",openQuickProperties,null,"Change font, size and colours of selected text"));
    }
    const current=quickAlignment();
    if(!chosenImage)for(const [label,value] of [["Left","left"],["Centre","center"],["Right","right"]]){
      bar.append(make(label,()=>{
        if(state.selectedAddition!==null)setAddedBlockLayout({align:value},true);
        else updateSelectedStyle("textAlign",value,["left","center","right"]);
        createQuickToolbar();
      },current===value,"Align selected block "+label.toLowerCase()));
    }
    if(selected.added?insertionKind(state.additions[state.selectedAddition])!=="image":
      ["P","H1","H2","H3","H4","BLOCKQUOTE","LI"].includes(selected.node.tagName)){
      bar.append(make("Size",()=>openQuickSize(),null,"Resize selected text block on the page"));
      // Small spatial adjustments are common while composing a page. Reuse
      // the inspector's validated style and Undo history, one click per step.
      for(const side of ["Above","Below"]){
        const field=side==="Above"?"spaceAbove":"spaceBelow";
        const cssProp=side==="Above"?"marginTop":"marginBottom";
        const spacing=selected.added?addedBlockLayout(state.additions[state.selectedAddition])[field]:
          (/^(\\d+)px$/.exec(getWorking(state.selected)?.style[cssProp]||"")?.[1]||0);
        const currentGap=Math.max(0,Math.min(80,Number(spacing)||0));
        for(const [label,step,description] of [
          ["−",-10,"Decrease space "+side.toLowerCase()+" selected block"],
          ["+",10,"Increase space "+side.toLowerCase()+" selected block"]
        ]){
          const control=make(side+" "+label,()=>{
            const next=Math.max(0,Math.min(80,currentGap+step));
            if(next===currentGap)return;
            if(selected.added)setAddedBlockLayout({[field]:next},true);
            else updateSelectedStyle(cssProp,next+"px",[next+"px"]);
          },null,description);
          control.disabled=step<0?currentGap===0:currentGap===80;
          control.title="Space "+side.toLowerCase()+": "+currentGap+" px";
          bar.append(control);
        }
      }
      const existingSpace=selected.added?addedBlockLayout(state.additions[state.selectedAddition]):null;
      const workSpace=selected.added?null:getWorking(state.selected);
      const hasCustomSpace=selected.added?
        existingSpace.spaceAbove!==0||existingSpace.spaceBelow!==0:
        Boolean(workSpace?.style.marginTop||workSpace?.style.marginBottom);
      const clear=make("Reset gaps",()=>{
        if(selected.added){
          setAddedBlockLayout({spaceAbove:0,spaceBelow:0},true);
        }else{
          // A single history checkpoint covers both values.
          checkpoint();
          updateSelectedStyle("marginTop","",[""],false);
          updateSelectedStyle("marginBottom","",[""],false);
        }
      },null,"Restore original spacing above and below selected block");
      clear.disabled=!hasCustomSpace;
      bar.append(clear);
    }
    if(!selected.added){
      const movable=blockMoveCandidate(state.selected);
      if(movable){
        const up=make("↑ Up",()=>moveOriginalBlock(-1),null,"Move selected block up");
        up.disabled=movable.index===0;
        const down=make("↓ Down",()=>moveOriginalBlock(1),null,"Move selected block down");
        down.disabled=movable.index===movable.keys.length-1;
        bar.append(up,down);
      }
      if(!$("duplicateSourceBtn").disabled&&state.additions.length<10){
        bar.append(make("Copy",()=>duplicateSelectedSource(),null,
          "Duplicate selected original paragraph or heading"));
      }
      const section=directLayoutSelection();
      if(section){
        bar.append(make("Layout",()=>openQuickLayout(section.spec.parentSelector),null,
          "Arrange selected section into responsive columns"));
      }
    }
    const addAnchor=quickInsertAnchor();
    if(addAnchor&&state.additions.length<10){
      bar.append(make("+ Add",()=>openQuickComposer(addAnchor),null,
        "Add new content after this block"));
      bar.append(make("+ Image",()=>openQuickComposer(addAnchor,"image"),null,
        "Add an existing website image after selected content"));
    }
    if(selected.added){
      const divider=doc.createElement("span");
      divider.setAttribute("aria-hidden","true");
      divider.style.cssText="height:22px;border-left:1px solid "+(dark?"#78887d":"#b8cac0");
      bar.append(divider);
      const duplicate=make("Copy",()=>duplicateAddedBlock(),null,"Duplicate selected new block");
      duplicate.disabled=state.additions.length>=10;
      if(duplicate.disabled)duplicate.style.opacity=".45";
      bar.append(duplicate);
    }
    if(selected.added){
      bar.append(make("Remove",removeAddedBlock,null,"Remove selected new block from page"));
    }else if(sourceRemovalCandidate(state.selected)||
      (chosenImage&&state.dirty.has(state.selected)&&
        state.stagedMedia?.key!==state.selected)){
      bar.append(make("Remove",quickRemoveSelectedSource,null,"Remove selected existing block from page"));
    }
    bar.append(make("Details",()=>{
      setWorkspacePanel("inspector",true);
      if(selected.added)$("addedBlockText").focus();
      else if(chosenImage)$("imageAlt").focus();
      else $("selectionText").focus();
    },null,"Focus selected block details in inspector"));
    doc.body.append(bar);
    positionQuickToolbar();
    positionQuickProperties();
  }

  // A compact visual launcher for the existing source-verified layout
  // engine. Column definitions remain 12-column responsive groups, with
  // source order preserved and mobile always stacked.

  // An isolated, reversible width preview. The working source is only
  // modified when a preset is chosen or the slider is released.
  let quickSizeDraft=null;
  function closeQuickSize(restore=false){
    const old=quickSizeDraft;
    quickSizeDraft=null;
    if(restore&&old?.node?.isConnected){
      if(old.style===null)old.node.removeAttribute("style");
      else old.node.setAttribute("style",old.style);
    }
    old?.panel?.remove();
  }
  function positionQuickSize(){
    const doc=state.frameDoc,form=doc?.getElementById("moon-quick-size");
    if(!form)return;
    const bar=doc.getElementById("moon-quick-toolbar");
    if(!bar||bar.hidden){form.hidden=true;return;}
    form.hidden=false;
    const w=doc.defaultView.innerWidth,b=bar.getBoundingClientRect();
    const width=Math.min(300,Math.max(0,w-10));
    form.style.width=width+"px";
    const height=form.getBoundingClientRect().height||175;
    form.style.left=Math.max(5,Math.min(w-width-5,b.left))+"px";
    const below=b.bottom+7,above=b.top-height-7;
    form.style.top=Math.max(5,Math.min(Math.max(5,doc.defaultView.innerHeight-height-5),
      below+height<=doc.defaultView.innerHeight-5?below:above>=5?above:below))+"px";
  }
  function openQuickSize(){
    const selected=quickSelection(),doc=state.frameDoc;
    if(!selected||!doc)return;
    closeQuickSize(true);
    doc.getElementById("moon-quick-layout")?.remove();
    doc.getElementById("moon-quick-composer")?.remove();
    const added=selected.added,index=state.selectedAddition,key=state.selected;
    const item=added?state.additions[index]:null;
    if(added&&(!item||insertionKind(item)==="image"))return;
    const original=added?null:getWorking(key);
    if(!added&&!original)return;
    const node=selected.node,dark=$("previewTheme").value==="dark";
    const previous=added?addedBlockLayout(item).widthPercent:
      /^([3-9]\d|100)%$/.exec(original.style.maxWidth)?.[1];
    const value=previous?Number(previous):100;
    const form=doc.createElement("section");
    form.id="moon-quick-size";form.setAttribute("role","dialog");
    form.setAttribute("aria-label","Resize selected block");
    form.setAttribute("aria-modal","false");
    form.style.cssText="position:fixed;z-index:2147483646;display:grid;gap:10px;"+
      "box-sizing:border-box;max-height:calc(100vh - 10px);overflow:auto;padding:13px;"+
      "border:1px solid "+(dark?"#a7baa9":"#9cb7a9")+";border-radius:10px;"+
      "background:"+(dark?"#1a1c1a":"#fff")+";color:"+
      (dark?"#f5f7f5":"#183e30")+";box-shadow:0 7px 24px #0004;"+
      "font:13px/1.4 system-ui,sans-serif";
    const title=doc.createElement("strong");title.textContent="Resize this block";
    const label=doc.createElement("label");
    label.style.cssText="display:grid;gap:5px;font-weight:600";
    label.textContent="Width within this section";
    const output=doc.createElement("output");
    output.id="moon-quick-size-value";output.textContent=value+"%";
    const slider=doc.createElement("input");
    slider.type="range";slider.min="30";slider.max="100";slider.step="5";
    slider.value=String(value);slider.setAttribute("aria-label","Block width within section");
    slider.setAttribute("aria-describedby",output.id);
    slider.style.cssText="width:100%;accent-color:"+(dark?"#81cca0":"#276b4d");
    label.append(output,slider);
    const button=(label,handler)=>{
      const b=doc.createElement("button");b.type="button";b.textContent=label;
      b.style.cssText="border:1px solid "+(dark?"#78887d":"#b8cac0")+
        ";padding:6px 9px;min-height:31px;border-radius:5px;"+
        "background:transparent;color:inherit;font:600 12px system-ui;cursor:pointer";
      b.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();handler();});
      return b;
    };
    const active=()=>quickSizeDraft?.panel===form&&node.isConnected&&
      (added?state.selectedAddition===index:state.selected===key);
    const preview=width=>{
      if(!active())return;
      if(added)node.style.width=width+"%";
      else node.style.maxWidth=width+"%";
      output.textContent=width+"%";
      positionQuickSize();
    };
    const commit=width=>{
      if(!active())return;
      closeQuickSize(true);
      if(added)setAddedBlockLayout({widthPercent:width},true);
      else updateSelectedStyle("maxWidth",width===100?"":width+"%",[width===100?"":width+"%"]);
    };
    slider.addEventListener("input",()=>preview(Number(slider.value)));
    slider.addEventListener("change",()=>commit(Number(slider.value)));
    const presets=doc.createElement("div");presets.style.cssText="display:flex;flex-wrap:wrap;gap:6px";
    for(const width of [100,75,50])presets.append(
      button(width===100?"Full width":width+"%",()=>commit(width)));
    const footer=doc.createElement("div");
    footer.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:9px";
    const hint=doc.createElement("small");
    hint.textContent="Drag to preview. Release to apply. Undo restores the previous width.";
    hint.style.cssText="opacity:.85;line-height:1.3";
    footer.append(hint,button("Cancel",()=>closeQuickSize(true)));
    form.append(title,label,presets,footer);
    form.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closeQuickSize(true);}
    });
    doc.body.append(form);
    quickSizeDraft={node,style:node.getAttribute("style"),panel:form};
    positionQuickSize();
    slider.focus({preventScroll:true});
  }

  function positionQuickLayout(){
    const doc=state.frameDoc,panel=doc?.getElementById("moon-quick-layout");
    if(!panel)return;
    const bar=doc.getElementById("moon-quick-toolbar"),view=doc.defaultView;
    if(!bar||bar.hidden){panel.hidden=true;return;}
    panel.hidden=false;
    const b=bar.getBoundingClientRect();
    // Measure against the actual iframe viewport. When the preview is narrow
    // or short, the panel scrolls internally and its actions remain visible.
    panel.style.maxHeight=Math.max(90,view.innerHeight-12)+"px";
    const width=panel.getBoundingClientRect().width||310;
    const height=panel.getBoundingClientRect().height||280;
    panel.style.left=Math.max(4,Math.min(view.innerWidth-width-4,b.left))+"px";
    const below=b.bottom+7,above=b.top-height-7;
    const top=below+height<=view.innerHeight-4?below:
      above>=4?above:Math.max(4,view.innerHeight-height-4);
    panel.style.top=Math.max(4,top)+"px";
  }
  function openQuickLayout(parentSelector){
    const doc=state.frameDoc;
    if(!doc)return;
    const selected=directLayoutSelection();
    if(!selected||selected.spec.parentSelector!==parentSelector)return;
    doc.getElementById("moon-quick-layout")?.remove();
    const dark=$("previewTheme").value==="dark";
    const panel=doc.createElement("section");
    panel.id="moon-quick-layout";
    panel.setAttribute("role","dialog");
    panel.setAttribute("aria-label","Arrange selected section");
    panel.setAttribute("aria-modal","false");
    panel.style.cssText="position:fixed;z-index:2147483646;"+
      "display:grid;gap:8px;width:min(316px,calc(100vw - 8px));"+
      "max-height:calc(100vh - 8px);overflow:auto;box-sizing:border-box;"+
      "padding:12px;border:1px solid "+(dark?"#9bad9e":"#a9c1b2")+
      ";border-radius:10px;background:"+(dark?"#1a1c1a":"#fff")+
      ";color:"+(dark?"#f4f6f4":"#173b2c")+
      ";box-shadow:0 8px 25px #0004;font:14px/1.4 system-ui,sans-serif";
    const title=doc.createElement("strong");
    title.textContent="Arrange this section";
    const hint=doc.createElement("p");
    hint.textContent="Choose a desktop arrangement. Mobile keeps the original reading order in one column.";
    hint.style.cssText="margin:0;font-size:12px;line-height:1.45";
    const choices=doc.createElement("div");
    choices.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px";
    const original=layoutGroups().find(group=>group.parentSelector===parentSelector);
    const current=$("directLayoutPreset").value;
    const presetLabels=[
      ["stack","One column"],
      ["two","Two equal"],
      ["first-wide","Wide left"],
      ["second-wide","Wide right"],
      ["three","Three columns"]
    ];
    const action=(value,remove=false)=>{
      const again=directLayoutSelection();
      if(!again||again.spec.parentSelector!==parentSelector){
        notice("This section has changed. Select it again before arranging.","Layout unavailable");
        panel.remove();return;
      }
      if(remove&&!layoutGroups().some(g=>g.parentSelector===parentSelector)){
        panel.remove();return;
      }
      if(!remove)$("directLayoutPreset").value=value;
      updateDirectLayout(remove);
      panel.remove();
    };
    for(const [preset,label] of presetLabels){
      const button=doc.createElement("button");
      button.type="button";button.textContent=label;
      button.setAttribute("aria-label","Set selected section layout to "+label.toLowerCase());
      button.setAttribute("aria-pressed",String(!!original&&current===preset));
      button.style.cssText="padding:11px 5px;min-height:44px;"+
        "border:1px solid "+(dark?"#82968b":"#a4bbaf")+
        ";border-radius:7px;background:"+
        (original&&current===preset?(dark?"#365c46":"#dceee1"):"transparent")+
        ";color:inherit;cursor:pointer;font:600 12px system-ui";
      button.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();
        action(preset);
      });
      choices.append(button);
    }
    // Adjust the same validated 12-column split without leaving the page.
    const custom=doc.createElement("div");
    custom.style.cssText="display:grid;gap:5px;padding:8px 0";
    const customLabel=doc.createElement("label");
    const customId="moon-layout-custom-width";
    customLabel.htmlFor=customId;
    customLabel.textContent="Custom two-column split";
    customLabel.style.cssText="font-weight:600;font-size:12px";
    const slider=doc.createElement("input");
    slider.type="range";slider.id=customId;slider.min="2";slider.max="10";slider.step="1";
    slider.value=$("directLayoutCustomColumns").value;
    slider.setAttribute("aria-label","First column width in a twelve-column grid");
    slider.style.width="100%";
    const ratio=doc.createElement("output");
    ratio.htmlFor=customId;
    ratio.textContent=slider.value+" / "+(12-Number(slider.value));
    // A proportional preview responds immediately to keyboard and pointer
    // slider input; changes reach the source-verified layout only on Apply.
    const preview=doc.createElement("div");
    preview.setAttribute("aria-hidden","true");
    preview.style.cssText="display:grid;gap:4px;height:46px";
    const leftPreview=doc.createElement("div");
    const rightPreview=doc.createElement("div");
    for(const block of [leftPreview,rightPreview]){
      block.style.cssText="border:1px solid currentColor;border-radius:4px;opacity:.8;"+
        "background:repeating-linear-gradient(0deg,transparent,transparent 8px,currentColor 9px,transparent 10px)";
    }
    const updateColumnPreview=()=>{
      const first=Number(slider.value);
      ratio.textContent=first+" / "+(12-first);
      preview.style.gridTemplateColumns=first+"fr "+(12-first)+"fr";
    };
    preview.append(leftPreview,rightPreview);
    updateColumnPreview();
    const applyCustom=doc.createElement("button");
    applyCustom.type="button";applyCustom.textContent="Apply custom columns";
    applyCustom.style.cssText="padding:9px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;font:600 12px system-ui;cursor:pointer";
    slider.addEventListener("input",updateColumnPreview);
    applyCustom.addEventListener("click",()=>{
      $("directLayoutCustomColumns").value=slider.value;
      $("directLayoutCustomValue").textContent=ratio.textContent+" columns";
      $("directLayoutCustomField").hidden=false;
      action("custom");
    });
    custom.append(customLabel,preview,slider,ratio,applyCustom);
    const controls=doc.createElement("div");
    controls.style.cssText="display:flex;justify-content:space-between;gap:8px;"+
      "position:sticky;top:0;z-index:1;padding:5px 0;background:inherit";
    const reset=doc.createElement("button");
    reset.type="button";reset.textContent="Remove layout";
    reset.disabled=!original;
    reset.style.cssText="padding:7px 8px;border:1px solid currentColor;border-radius:6px;"+
      "background:transparent;color:inherit;font:600 12px system-ui";
    reset.addEventListener("click",()=>action("",true));
    const close=doc.createElement("button");
    close.type="button";close.textContent="Cancel";
    close.style.cssText=reset.style.cssText;
    const dismiss=()=>{
      panel.remove();
      doc.getElementById("moon-quick-toolbar")
        ?.querySelector('button[aria-label="Arrange selected section into responsive columns"]')
        ?.focus({preventScroll:true});
    };
    close.addEventListener("click",dismiss);
    panel.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();dismiss();}
    });
    controls.append(reset,close);
    // The destructive and dismiss actions must remain reachable even when
    // the mobile preview clips the lower half of the arrangement dialog.
    panel.append(title,controls,hint,choices,custom);
    doc.body.append(panel);
    positionQuickLayout();
    choices.querySelector("button")?.focus({preventScroll:true});
  }

  function quickInsertAnchor(){
    const selected=quickSelection();
    if(!selected)return null;
    const anchors=sourceMoveAnchors();
    if(selected.added){
      const item=state.additions[state.selectedAddition];
      return anchors.find(a=>a.selector===item?.selector)||null;
    }
    return anchors.find(a=>a.key===state.selected)||null;
  }
  function positionQuickComposer(){
    const doc=state.frameDoc,composer=doc?.getElementById("moon-quick-composer");
    if(!composer)return;
    const toolbar=doc.getElementById("moon-quick-toolbar"),view=doc.defaultView;
    if(!toolbar||toolbar.hidden){composer.hidden=true;return;}
    composer.hidden=false;
    const bounds=toolbar.getBoundingClientRect();
    // Preview frames may be narrower than the main editor viewport. Give
    // the grid a definite frame-relative width before measuring and placing
    // it, so its intrinsic form controls cannot stretch past the right edge.
    const available=Math.max(0,view.innerWidth-10);
    composer.style.width=Math.min(330,available)+"px";
    composer.style.maxWidth=available+"px";
    composer.style.maxHeight=Math.max(90,view.innerHeight-12)+"px";
    const width=composer.getBoundingClientRect().width||Math.min(320,available);
    const height=composer.getBoundingClientRect().height||280;
    const left=Math.max(5,Math.min(view.innerWidth-width-5,bounds.left));
    const below=bounds.bottom+7;
    const above=bounds.top-height-7;
    composer.style.left=left+"px";
    composer.style.top=Math.max(5,Math.min(Math.max(5,view.innerHeight-height-5),
      below+height<=view.innerHeight-5?below:above>=5?above:below))+"px";
  }
  function openQuickComposer(anchor,initialKind="paragraph"){
    const doc=state.frameDoc;
    if(!doc||!sourceMoveAnchors().some(a=>a.key===anchor.key)||state.additions.length>=10)return;
    doc.getElementById("moon-quick-composer")?.remove();
    const dark=$("previewTheme").value==="dark";
    const form=doc.createElement("form");
    form.id="moon-quick-composer";
    form.setAttribute("role","dialog");
    form.setAttribute("aria-modal","false");
    form.setAttribute("aria-label","Add content to the page");
    form.noValidate=true;
    form.style.cssText="position:fixed;z-index:2147483646;display:grid;gap:8px;"+
      "grid-template-columns:minmax(0,1fr);min-width:0;"+
      "width:min(330px,calc(100vw - 10px));max-width:calc(100vw - 10px);"+
      "max-height:calc(100vh - 10px);overflow:auto;padding:13px;box-sizing:border-box;"+
      "border:1px solid "+(dark?"#9bad9e":"#a9c1b2")+";border-radius:11px;"+
      "background:"+(dark?"#1a1c1a":"#fff")+";color:"+
      (dark?"#f4f6f4":"#173b2c")+";box-shadow:0 8px 25px #0004;"+
      "font:14px/1.4 system-ui,sans-serif";
    const idPrefix="moon-quick-new-";
    const heading=doc.createElement("strong");
    heading.textContent="Add below selected content";
    const field=(name,label,node)=>{
      const labelNode=doc.createElement("label");
      node.id=idPrefix+name;
      labelNode.htmlFor=node.id;
      labelNode.textContent=label;
      labelNode.style.cssText="font-weight:600;display:block";
      node.style.cssText="display:block;box-sizing:border-box;width:100%;"+
        "margin-top:3px;padding:7px 8px;border:1px solid "+
        (dark?"#9bad9e":"#9cb0a6")+";border-radius:5px;"+
        "background:"+(dark?"#222722":"#fff")+";color:inherit;font:inherit";
      labelNode.append(node);
      return labelNode;
    };
    const kind=doc.createElement("select");
    for(const [value,label] of [["paragraph","Paragraph"],["heading","Heading"],
      ["link","Link"],["image","Existing website image"]]){
      const option=doc.createElement("option");
      option.value=value;option.textContent=label;kind.append(option);
    }
    if(["paragraph","heading","link","image"].includes(initialKind))kind.value=initialKind;
    const headingLevel=doc.createElement("select");
    for(const value of ["h2","h3"]){
      const option=doc.createElement("option");
      option.value=value;option.textContent=value.toUpperCase();
      headingLevel.append(option);
    }
    const description=doc.createElement("textarea");
    description.rows=3;description.maxLength=2000;
    const href=doc.createElement("input");
    href.type="url";href.maxLength=500;href.placeholder="https://example.org or local-page.html";
    const imagePath=doc.createElement("input");
    imagePath.type="text";imagePath.maxLength=220;imagePath.placeholder="assets/existing-photo.webp";
    const kindField=field("kind","Content type",kind);
    const levelField=field("level","Heading level",headingLevel);
    const textField=field("text","Text",description);
    const hrefField=field("href","Link destination",href);
    const imageField=field("image","Existing image path",imagePath);
    const browseImages=doc.createElement("button");
    browseImages.type="button";
    browseImages.textContent="Browse website images";
    browseImages.setAttribute("aria-label","Choose an existing website image from the image gallery");
    browseImages.style.cssText="display:block;width:100%;margin-top:6px;"+
      "padding:8px;border:1px solid "+(dark?"#9bad9e":"#9cb0a6")+
      ";border-radius:6px;background:"+(dark?"#303d33":"#e8f2eb")+
      ";color:inherit;font:600 13px system-ui;cursor:pointer";
    // Keep interactive gallery controls outside the text-input label, so
    // clicking Browse does not trigger a label's input activation behaviour.
    const imageGroup=doc.createElement("div");
    imageGroup.append(imageField,browseImages);
    browseImages.addEventListener("click",()=>{
      if(kind.value==="image")openMediaLibrary("quick");
    });
    const imagePreview=doc.createElement("div");
    imagePreview.setAttribute("aria-live","polite");
    imagePreview.style.cssText="display:none;gap:8px;align-items:center;margin-top:6px";
    const thumbnail=doc.createElement("img");
    thumbnail.alt="";
    thumbnail.style.cssText="display:block;width:68px;height:54px;object-fit:contain;"+
      "border:1px solid "+(dark?"#9bad9e":"#a9c1b2")+";border-radius:4px";
    const imageNote=doc.createElement("small");
    imageNote.style.cssText="overflow-wrap:anywhere;font-size:11px";
    imagePreview.append(thumbnail,imageNote);
    imageGroup.append(imagePreview);
    const updateImagePreview=()=>{
      const path=imagePath.value.trim();
      const valid=path&&safeExistingImagePath(path);
      imagePreview.style.display=valid?"flex":"none";
      if(valid){
        if(thumbnail.getAttribute("src")!==path)thumbnail.setAttribute("src",path);
        imageNote.textContent="Selected image · "+path;
      }else{
        thumbnail.removeAttribute("src");
        imageNote.textContent="";
      }
      // A newly visible thumbnail changes the panel height. Reposition the
      // fixed composer before the browser tries to scroll its action row.
      if(form.isConnected)positionQuickComposer();
    };
    imagePath.addEventListener("input",updateImagePreview);
    const help=doc.createElement("p");
    help.textContent="Images must already exist on this website. Your additions remain a local draft until reviewed.";
    help.style.cssText="margin:0;font-size:12px;line-height:1.35;opacity:.85";
    const status=doc.createElement("p");
    status.setAttribute("role","status");
    status.setAttribute("aria-live","polite");
    status.style.cssText="margin:0;font-size:12px";
    const row=doc.createElement("div");
    row.style.cssText="display:flex;gap:7px;justify-content:flex-end;"+
      "position:sticky;top:0;z-index:1;padding:6px 0;background:inherit";
    const cancel=doc.createElement("button");
    cancel.type="button";cancel.textContent="Cancel";
    const submit=doc.createElement("button");
    // The isolated preview deliberately disallows sandbox form submissions.
    // Commit explicitly from this local button without navigating the iframe.
    submit.type="button";submit.textContent="Add to page";
    for(const button of [cancel,submit]){
      button.style.cssText="padding:7px 10px;border:1px solid "+
        (dark?"#9bad9e":"#9cb0a6")+";border-radius:6px;"+
        "background:"+(button===submit?(dark?"#406d50":"#dceee1"):"transparent")+
        ";color:inherit;font:600 13px system-ui;cursor:pointer";
    }
    const refresh=()=>{
      const selection=kind.value;
      // Inline display:block overrides the browser's [hidden] styling.
      // Explicitly hide inactive fields so the Add action fits small previews.
      levelField.hidden=selection!=="heading";
      hrefField.hidden=selection!=="link";
      imageField.hidden=selection!=="image";
      levelField.style.display=levelField.hidden?"none":"block";
      hrefField.style.display=hrefField.hidden?"none":"block";
      imageGroup.style.display=imageField.hidden?"none":"block";
      updateImagePreview();
      textField.firstChild.textContent=selection==="image"?"Image description (alt text)":"Text";
      description.maxLength=selection==="paragraph"?2000:selection==="image"?200:140;
      status.textContent="";
      if(form.isConnected)positionQuickComposer();
    };
    kind.addEventListener("change",refresh);
    const close=()=>{
      form.remove();
      doc.getElementById("moon-quick-toolbar")
        ?.querySelector('button[aria-label="Add new content after this block"]')
        ?.focus({preventScroll:true});
    };
    cancel.addEventListener("click",close);
    form.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close();}
      if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){
        event.preventDefault();event.stopPropagation();submit.click();
      }
    });
    submit.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      const resolved=sourceMoveAnchors().find(a=>a.key===anchor.key);
      if(!resolved||resolved.selector!==anchor.selector){
        status.textContent="The original insertion location has changed. Select it again.";
        return;
      }
      const item={page:state.page,selector:resolved.selector,tag:resolved.tag,
        before:resolved.before,kind:kind.value,text:description.value.trim()};
      if(item.kind==="heading")item.headingTag=headingLevel.value;
      if(item.kind==="link")item.href=href.value.trim();
      if(item.kind==="image")item.src=imagePath.value.trim();
      const previous=state.additions;
      try{
        const proposed=validateParagraphAdditions([...previous,item]);
        state.additions=proposed;
        try{buildExport()}finally{state.additions=previous;}
        checkpoint();
        state.additions=proposed;
        renderPreview(null,proposed.length-1);
        scheduleDraft();
        updateStatus("New "+item.kind+" added beside selected content · Not published");
      }catch(error){
        state.additions=previous;
        status.textContent="Cannot add this content. "+error.message;
      }
    });
    row.append(cancel,submit);
    // Keep Add / Cancel at the top of the scrolling dialog so they remain
    // operable in short iframe previews, including after an image appears.
    form.append(heading,row,kindField,levelField,textField,hrefField,imageGroup,help,status);
    doc.body.append(form);
    refresh();
    positionQuickComposer();
    kind.focus({preventScroll:true});
  }

  function selectElement(node) {
    if (!node) return;
    const previously=state.frameDoc.querySelector("[data-editor-selected]");
    if (previously) {
      previously.removeAttribute("data-editor-selected");
      previously.removeAttribute("contenteditable");
    }
    for(const marked of state.frameDoc.querySelectorAll("[data-editor-added-selected]"))
      marked.removeAttribute("data-editor-added-selected");
    closeQuickProperties();
    state.selected=node.getAttribute("data-editor-key");
    state.selectedAddition=null;
    $("addedBlockDetails").hidden=true;
    state.imageSliderActive=false;
    if(state.frameDoc.getElementById("moon-image-resize-handle"))
      state.frameDoc.getElementById("moon-image-resize-handle").remove();
    state.frameDoc.getElementById("moon-column-resize-handle")?.remove();
    state.frameDoc.getElementById("moon-added-block-move-handle")?.remove();
    state.frameDoc.getElementById("moon-added-block-width-handle")?.remove();
    state.frameDoc.getElementById("moon-source-width-handle")?.remove();
    state.frameDoc.getElementById("moon-spacing-grip")?.remove();
    node.setAttribute("data-editor-selected","");
    if (TEXT_TAGS.has(node.tagName)) node.setAttribute("contenteditable","true");
    updateInspector(node);
    updateBrowseControls();
    createQuickToolbar();
    createSourceWidthHandle();
    createSpacingGrip();
  }


  function selectAddedBlock(index){
    closeQuickProperties();
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
    state.frameDoc.getElementById("moon-block-move-handle")?.remove();
    state.frameDoc.getElementById("moon-column-resize-handle")?.remove();
    state.frameDoc.getElementById("moon-added-block-move-handle")?.remove();
    state.frameDoc.getElementById("moon-added-block-width-handle")?.remove();
    state.frameDoc.getElementById("moon-source-width-handle")?.remove();
    state.frameDoc.getElementById("moon-spacing-grip")?.remove();
    $("selectionDetails").hidden=true;
    $("selectionEmpty").hidden=true;
    $("selectionTag").textContent="New "+insertionKind(addition);
    $("addedBlockDetails").hidden=false;
    state.imageSliderActive=false;
    state.addedBlockSliderActive=false;
    const layout=addedBlockLayout(addition);
    $("addedBlockAlign").value=layout.align;
    $("addedBlockWidth").value=String(layout.widthPercent);
    $("addedBlockWidthValue").textContent=layout.widthPercent+"%";
    $("addedBlockSpaceAbove").value=String(layout.spaceAbove);
    $("addedBlockSpaceBelow").value=String(layout.spaceBelow);
    $("resetAddedBlockLayout").disabled=!addition.layout;
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
    if(kind==="image"){
      $("addedBlockSrc").value=addition.src;
      const percent=addition.widthPercent===undefined?100:addition.widthPercent;
      $("addedImageWidthPercent").value=String(percent);
      $("addedImageWidthValue").textContent=percent+"%";
    }
    const siblings=state.additions.map((entry,i)=>entry.selector===addition.selector?i:-1).filter(i=>i>=0);
    const position=siblings.indexOf(index);
    $("moveAddedEarlierBtn").disabled=position<=0;
    $("moveAddedLaterBtn").disabled=position>=siblings.length-1;
    $("duplicateAddedBlockBtn").disabled=state.additions.length>=10;
    $("addedBlockStatus").textContent="New "+kind+" · block "+(index+1)+
      " of "+state.additions.length+" · Local draft";
    updateBrowseControls();
    if(kind==="image")createImageResizeHandle();
    const anchors=sourceMoveAnchors();
    const picker=$("moveAddedAnchorPicker");
    picker.replaceChildren();
    for(const anchor of anchors){
      const option=document.createElement("option");
      option.value=anchor.key;option.textContent=anchor.title;
      option.selected=anchor.selector===addition.selector;
      picker.appendChild(option);
    }
    const currentAnchor=anchors.find(a=>a.selector===addition.selector);
    $("moveAddedAnchorFields").hidden=anchors.filter(a=>a.selector!==addition.selector).length===0;
    if(!currentAnchor&&picker.options.length)picker.selectedIndex=-1;
    updateAddedAnchorButton();
    if(siblings.length>1||anchors.some(a=>a.selector!==addition.selector))
      createAddedMoveHandle();
    if(kind!=="image")createAddedWidthHandle();
    createQuickToolbar();
    if(kind!=="image")createSpacingGrip();
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
    renderPreview(null,index+1);
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
    const move=blockMoveCandidate(state.selected);
    const movedSource=state.blockOrders.some(group=>group.originalKeys.includes(state.selected));
    $("moveOriginalBlockFields").hidden=!move;
    $("moveOriginalUp").disabled=!move||move.index===0;
    $("moveOriginalDown").disabled=!move||move.index===move.keys.length-1;
    if(move){
      $("moveOriginalStatus").textContent="Block "+(move.index+1)+" of "+move.keys.length+
        " · Drag the handle in the preview or use the arrow buttons. Mobile reading order follows the new sequence."+
      (movedSource?" Restore this group to its original order before adding or removing its blocks.":"");
      createBlockMoveHandle();
    }else state.frameDoc?.getElementById("moon-block-move-handle")?.remove();
    const removable=sourceRemovalCandidate(state.selected);
    $("removeSourceBtn").disabled=!removable;
    $("removeSourceHelp").textContent=removable?
      "Remove this original block from the reviewed draft. Undo and Review changes can restore it.":
      "Removal is available for uniquely verified standalone paragraphs, supported headings and images without conflicting edits or layouts.";
    const compatible=movedSource?null:directLayoutSelection();
    $("directLayoutFields").hidden=!compatible;
    if(compatible){
      const active=layoutGroups().some(group=>group.parentSelector===compatible.spec.parentSelector);
      $("directLayoutRemove").disabled=!active;
      $("directLayoutStatus").textContent=(compatible.spec.version===2?"Card or row group":"Text group")+
        " · "+compatible.spec.children.length+" blocks"+(active?" · Layout active":" · Original layout")+
        ". Mobile stays in reading order.";
      if(active){
        const two=activeTwoColumnLayout();
        const activeGroup=layoutGroups().find(g=>g.parentSelector===compatible.spec.parentSelector);
        if(two){
          const split=two.split;
          $("directLayoutPreset").value=split===6?"two":split===8?"first-wide":
            split===4?"second-wide":"custom";
          $("directLayoutCustomColumns").value=String(split);
          $("directLayoutCustomValue").textContent=split+" / "+(12-split)+" columns";
        }else if(activeGroup?.children.every(c=>c.desktop.w===12)){
          $("directLayoutPreset").value="stack";
        }else if(activeGroup?.children.some(c=>c.desktop.x===9&&c.desktop.w===4)){
          $("directLayoutPreset").value="three";
        }
        $("directLayoutCustomField").hidden=$("directLayoutPreset").value!=="custom";
        createColumnResizeHandle();
      }else state.frameDoc?.getElementById("moon-column-resize-handle")?.remove();
    }
    const canInsert=["H2","H3","H4","P"].includes(node.tagName)&&
      !!state.original.get(state.selected)&&!movedSource;
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

  function updateSelectedStyle(property,value,allowed,makeCheckpoint=true) {
    if(!state.selected||!(value===""||allowed.includes(value)))return;
    const actual=getWorking(state.selected);
    const rendered=state.frameDoc?.querySelector('[data-editor-key="'+state.selected+'"]');
    if(!actual||!rendered)return;
    if(makeCheckpoint)checkpoint();
    for(const node of [actual,rendered]) {
      node.style[property]=value;
      if(!node.getAttribute("style")?.trim())node.removeAttribute("style");
    }
    updateDirty(state.selected);
    updateInspector(rendered);
    createQuickToolbar();
    positionSourceWidthHandle();
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
  function validImagePercent(percent){
    return Number.isInteger(percent)&&percent>=20&&percent<=100&&percent%5===0;
  }
  function selectedPreviewImage(){
    const doc=state.frameDoc;
    if(!doc)return null;
    if(state.selectedAddition!==null){
      const block=doc.querySelector('[data-editor-added-index="'+state.selectedAddition+'"]');
      return block?.querySelector("img")||null;
    }
    const node=doc.querySelector('[data-editor-key="'+state.selected+'"]');
    return node?.tagName==="IMG"?node:null;
  }
  function syncAddedBlockLayoutControls(item){
    const layout=addedBlockLayout(item);
    $("addedBlockAlign").value=layout.align;
    $("addedBlockWidth").value=String(layout.widthPercent);
    $("addedBlockWidthValue").textContent=layout.widthPercent+"%";
    $("addedBlockSpaceAbove").value=String(layout.spaceAbove);
    $("addedBlockSpaceBelow").value=String(layout.spaceBelow);
    $("resetAddedBlockLayout").disabled=!item.layout;
  }
  function setAddedBlockLayout(patch,makeCheckpoint=false){
    const index=state.selectedAddition,item=state.additions[index];
    if(!item)return false;
    const layout={...addedBlockLayout(item),...patch};
    try{validateAddedLayout(layout)}
    catch(error){
      $("addedBlockStatus").textContent="Block layout unchanged. "+error.message;
      syncAddedBlockLayoutControls(item);
      return false;
    }
    const revised={...item};
    if(isDefaultAddedLayout(layout))delete revised.layout;
    else revised.layout=layout;
    if(JSON.stringify(revised)===JSON.stringify(item))return false;
    const proposed=state.additions.map((entry,i)=>i===index?revised:entry);
    try{validateParagraphAdditions(proposed)}
    catch(error){
      $("addedBlockStatus").textContent="Block layout unchanged. "+error.message;
      syncAddedBlockLayoutControls(item);
      return false;
    }
    if(makeCheckpoint)checkpoint();
    state.additions=proposed;
    const target=state.frameDoc?.querySelector('[data-editor-added-index="'+index+'"]');
    if(target){
      const css=addedBlockStyle(revised);
      if(css)target.style.cssText=css;
      else target.removeAttribute("style");
    }
    syncAddedBlockLayoutControls(revised);
    $("addedBlockStatus").textContent="Block position updated · Local draft";
    positionAddedWidthHandle();
    positionImageResizeHandle();
    positionAddedMoveHandle();
    createQuickToolbar();
    scheduleDraft();
    return true;
  }

  // Drag the bottom-right corner of an original text block. One pointer
  // gesture makes one history checkpoint, including continuous preview.
  // A compact bottom-edge grip adjusts spacing below the selected text.
  // Draft edits and undo checkpoints reuse the inspector's validated paths.
  function createSpacingGrip(){
    const doc=state.frameDoc;
    doc?.getElementById("moon-spacing-grip")?.remove();
    const selection=quickSelection();
    if(!selection||!QUICK_SOURCE_TAGS.has(selection.node.tagName))return;
    const grip=doc.createElement("button");
    grip.type="button";grip.id="moon-spacing-grip";grip.textContent="↕";
    grip.title="Drag to adjust lower spacing; arrows change 5 px, Delete restores default";
    grip.setAttribute("aria-label","Adjust space below selected text with vertical dragging, or Up and Down arrows in five pixel steps; Delete restores the original value");
    grip.setAttribute("role","slider");
    grip.setAttribute("aria-valuemin","0");
    grip.setAttribute("aria-valuemax","80");
    grip.setAttribute("aria-orientation","vertical");
    grip.style.cssText="position:fixed;z-index:2147483645;width:28px;height:28px;border:2px solid #27654f;border-radius:5px;background:#fff;color:#174932;cursor:ns-resize;touch-action:none;font:700 18px system-ui";
    const value=()=>{
      if(selection.added)return addedBlockLayout(state.additions[state.selectedAddition]).spaceBelow;
      return parseInt(getWorking(state.selected)?.style.marginBottom,10)||0;
    };
    const set=(amount,history)=>{
      const px=Math.max(0,Math.min(80,Math.round(amount/5)*5));
      if(selection.added)setAddedBlockLayout({spaceBelow:px},history);
      else updateSelectedStyle("marginBottom",px+"px",[px+"px"],history);
      position();
    };
    const position=()=>{
      if(!grip.isConnected)return;
      const box=selection.node.getBoundingClientRect(),view=doc.defaultView;
      grip.hidden=box.bottom<0||box.top>view.innerHeight;
      grip.style.left=Math.max(0,Math.min(view.innerWidth-28,box.left+Math.min(box.width/2,80)))+"px";
      grip.style.top=Math.max(0,Math.min(view.innerHeight-28,box.bottom+2))+"px";
      grip.setAttribute("aria-valuenow",String(value()));
    };
    grip.addEventListener("click",event=>event.stopPropagation());
    grip.addEventListener("keydown",event=>{
      if(!["ArrowUp","ArrowDown","Home","End","Delete","Backspace"].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      if(event.key==="Delete"||event.key==="Backspace"){
        if(selection.added){
          if(value()!==0)setAddedBlockLayout({spaceBelow:0},true);
        }else if(getWorking(state.selected)?.style.marginBottom){
          updateSelectedStyle("marginBottom","",[""]);
        }
        position();return;
      }
      const next=event.key==="Home"?0:event.key==="End"?80:value()+(event.key==="ArrowDown"?5:-5);
      if(next!==value())set(next,true);
    });
    let drag=null;
    grip.addEventListener("pointerdown",event=>{
      if(event.button!==0||drag)return;
      event.preventDefault();event.stopPropagation();
      checkpoint();drag={id:event.pointerId,y:event.clientY,initial:value(),
        originalStyle:selection.added?null:getWorking(state.selected)?.style.marginBottom||""};
      grip.setPointerCapture(event.pointerId);
    });
    grip.addEventListener("pointermove",event=>{
      if(!drag||drag.id!==event.pointerId)return;
      event.preventDefault();
      set(drag.initial+event.clientY-drag.y,false);
    });
    const finish=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const {initial,originalStyle}=drag;
      drag=null;
      if(grip.hasPointerCapture(event.pointerId))grip.releasePointerCapture(event.pointerId);
      // Losing pointer capture (including an interrupted touch gesture) must
      // not accidentally leave a partially applied layout change behind.
      if(event.type==="pointercancel"&&value()!==initial){
        if(selection.added)set(initial,false);
        else updateSelectedStyle("marginBottom",originalStyle,[originalStyle],false);
      }
      scheduleDraft();position();
    };
    grip.addEventListener("pointerup",finish);
    grip.addEventListener("pointercancel",finish);
    doc.body.append(grip);
    doc.defaultView.addEventListener("scroll",position,{passive:true});
    position();
  }

  function positionSourceWidthHandle(){
    const doc=state.frameDoc,h=doc?.getElementById("moon-source-width-handle");
    if(!h||state.sourceWidthPointer)return;
    const node=doc.querySelector('[data-editor-key="'+state.selected+'"]');
    if(!node||state.selectedAddition!==null||!QUICK_SOURCE_TAGS.has(node.tagName)){
      h.remove();return;
    }
    const rect=node.getBoundingClientRect(),view=doc.defaultView;
    if(rect.bottom<0||rect.right<0||rect.top>view.innerHeight||rect.left>view.innerWidth){
      h.hidden=true;return;
    }
    h.hidden=false;
    h.style.left=Math.max(0,Math.min(view.innerWidth-28,rect.right-14))+"px";
    h.style.top=Math.max(0,Math.min(view.innerHeight-28,rect.bottom-14))+"px";
  }
  function createSourceWidthHandle(){
    const doc=state.frameDoc;
    if(!doc||state.selectedAddition!==null||doc.getElementById("moon-source-width-handle"))return;
    const node=doc.querySelector('[data-editor-key="'+state.selected+'"]');
    if(!node||!QUICK_SOURCE_TAGS.has(node.tagName))return;
    const h=doc.createElement("button");
    h.id="moon-source-width-handle";h.type="button";
    h.textContent="↘";h.title="Drag or use arrow keys to resize; double-click to reset";
    h.setAttribute("aria-label",
      "Resize text width: drag, press Left or Right arrow (Shift for larger steps), Home for 30%, End for full width, or double-click to reset.");
    h.style.cssText="position:fixed;z-index:2147483645;width:28px;height:28px;"+
      "border:2px solid #27654f;border-radius:5px;background:#fff;color:#174932;"+
      "cursor:nwse-resize;touch-action:none;font:700 20px/20px system-ui;box-shadow:0 1px 6px #0004";
    h.addEventListener("click",event=>event.stopPropagation());
    // Keyboard access to the same constrained sizing used by pointer drag.
    // Shift increases the step for efficient large adjustments.
    h.addEventListener("keydown",event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      if(!state.selected||!getWorking(state.selected))return;
      event.preventDefault();event.stopPropagation();
      const current=getWorking(state.selected).style.maxWidth;
      const percent=/^(?:[3-9]\d|100)%$/.test(current)?parseInt(current,10):100;
      const delta=(event.shiftKey?20:5)*(event.key==="ArrowRight"?1:-1);
      const next=event.key==="Home"?30:event.key==="End"?100:
        Math.max(30,Math.min(100,Math.round((percent+delta)/5)*5));
      if(next===percent)return;
      updateSelectedStyle("maxWidth",next===100?"":next+"%",[next===100?"":next+"%"]);
    });
    h.addEventListener("dblclick",event=>{
      event.preventDefault();event.stopPropagation();
      if(getWorking(state.selected)?.style.maxWidth)
        updateSelectedStyle("maxWidth","",[""]);
    });
    h.addEventListener("pointerdown",event=>{
      if(event.button!==0||state.sourceWidthPointer||!state.selected)return;
      const preview=doc.querySelector('[data-editor-key="'+state.selected+'"]');
      const work=getWorking(state.selected);
      const parentWidth=preview?.parentElement?.getBoundingClientRect().width;
      if(!work||!preview||!parentWidth)return;
      event.preventDefault();event.stopPropagation();
      checkpoint();
      const specified=work.style.maxWidth.endsWith("%")?
        Number.parseInt(work.style.maxWidth,10):100;
      state.sourceWidthPointer={id:event.pointerId,key:state.selected,
        startX:event.clientX,startPercent:Number.isFinite(specified)?specified:100,parentWidth};
      h.setPointerCapture(event.pointerId);
    });
    h.addEventListener("pointermove",event=>{
      const drag=state.sourceWidthPointer;
      if(!drag||drag.id!==event.pointerId||state.selected!==drag.key)return;
      event.preventDefault();
      const desired=Math.round((drag.startPercent+
        100*(event.clientX-drag.startX)/drag.parentWidth)/5)*5;
      const width=Math.max(30,Math.min(100,desired));
      updateSelectedStyle("maxWidth",width===100?"":width+"%",
        [width===100?"":width+"%"],false);
    });
    const finish=event=>{
      const drag=state.sourceWidthPointer;
      if(!drag||drag.id!==event.pointerId)return;
      state.sourceWidthPointer=null;
      if(h.hasPointerCapture(event.pointerId))h.releasePointerCapture(event.pointerId);
      positionSourceWidthHandle();
      scheduleDraft();
    };
    h.addEventListener("pointerup",finish);
    h.addEventListener("pointercancel",finish);
    doc.body.append(h);
    positionSourceWidthHandle();
  }

  function positionAddedWidthHandle(){
    const doc=state.frameDoc,handle=doc?.getElementById("moon-added-block-width-handle");
    if(!handle||state.addedWidthPointer)return;
    const item=state.additions[state.selectedAddition];
    const target=doc.querySelector('[data-editor-added-index="'+state.selectedAddition+'"]');
    if(!item||insertionKind(item)==="image"||!target){handle.remove();return;}
    const rect=target.getBoundingClientRect(),view=doc.defaultView;
    if(rect.bottom<0||rect.right<0||rect.top>view.innerHeight||rect.left>view.innerWidth){
      handle.hidden=true;return;
    }
    handle.hidden=false;
    handle.style.left=Math.max(0,Math.min(view.innerWidth-28,rect.right-13))+"px";
    handle.style.top=Math.max(0,Math.min(view.innerHeight-28,rect.bottom-13))+"px";
  }
  function createAddedWidthHandle(){
    const doc=state.frameDoc;
    if(!doc||doc.getElementById("moon-added-block-width-handle"))return;
    const handle=doc.createElement("button");
    handle.id="moon-added-block-width-handle";handle.type="button";
    handle.textContent="↘";
    handle.title="Drag or use arrow keys to resize; double-click to reset";
    handle.setAttribute("aria-label","Resize new block: drag or press Left/Right arrows, Shift for larger steps, Home for 30%, End for 100%, double-click to reset.");
    handle.style.cssText="position:fixed;z-index:2147483645;width:28px;height:28px;border:2px solid #27654f;border-radius:5px;background:#fff;color:#174932;cursor:nwse-resize;font:700 20px/20px system-ui;touch-action:none;box-shadow:0 1px 6px #0004";
    handle.addEventListener("click",event=>event.stopPropagation());
    handle.addEventListener("keydown",event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      const item=state.additions[state.selectedAddition];
      if(!item||insertionKind(item)==="image")return;
      event.preventDefault();event.stopPropagation();
      const current=addedBlockLayout(item).widthPercent;
      const delta=(event.shiftKey?20:5)*(event.key==="ArrowRight"?1:-1);
      const next=event.key==="Home"?30:event.key==="End"?100:
        Math.max(30,Math.min(100,Math.round((current+delta)/5)*5));
      if(next!==current)setAddedBlockLayout({widthPercent:next},true);
    });
    handle.addEventListener("dblclick",event=>{
      event.preventDefault();event.stopPropagation();
      const item=state.additions[state.selectedAddition];
      if(item&&addedBlockLayout(item).widthPercent!==100)
        setAddedBlockLayout({widthPercent:100},true);
    });
    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0||state.addedWidthPointer)return;
      const item=state.additions[state.selectedAddition],target=doc.querySelector(
        '[data-editor-added-index="'+state.selectedAddition+'"]');
      const parentWidth=target?.parentElement?.getBoundingClientRect().width;
      if(!item||insertionKind(item)==="image"||!parentWidth)return;
      event.preventDefault();event.stopPropagation();
      checkpoint();
      state.addedWidthPointer={id:event.pointerId,index:state.selectedAddition,
        startX:event.clientX,startPercent:addedBlockLayout(item).widthPercent,parentWidth};
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener("pointermove",event=>{
      const drag=state.addedWidthPointer;
      if(!drag||drag.id!==event.pointerId||drag.index!==state.selectedAddition)return;
      const desired=Math.round((drag.startPercent+
        100*(event.clientX-drag.startX)/drag.parentWidth)/5)*5;
      setAddedBlockLayout({widthPercent:Math.max(30,Math.min(100,desired))});
    });
    const finish=event=>{
      if(state.addedWidthPointer?.id!==event.pointerId)return;
      state.addedWidthPointer=null;
      positionAddedWidthHandle();
      scheduleDraft();
    };
    handle.addEventListener("pointerup",finish);
    handle.addEventListener("pointercancel",finish);
    doc.body.append(handle);
    positionAddedWidthHandle();
  }
  function resizeAddedImage(percent){
    const index=state.selectedAddition,item=state.additions[index];
    const image=selectedPreviewImage();
    if(!validImagePercent(percent)||insertionKind(item)!=="image"||!image)return;
    if(item.widthPercent===percent)return;
    const proposed=state.additions.map((part,i)=>i===index?{...part,widthPercent:percent}:part);
    try{validateParagraphAdditions(proposed)}
    catch(error){
      $("addedBlockStatus").textContent="Image width was not changed. "+error.message;
      return;
    }
    state.additions=proposed;
    image.style.width=percent+"%";
    image.style.maxWidth="100%";
    image.style.height="auto";
    $("addedImageWidthPercent").value=String(percent);
    $("addedImageWidthValue").textContent=percent+"%";
    $("addedBlockStatus").textContent="Image resized to "+percent+"% · Local draft";
    scheduleDraft();
    positionImageResizeHandle();
  }
  function resizeSelectedImage(percent){
    if(state.selectedAddition!==null)resizeAddedImage(percent);
    else resizeImage(percent);
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
    const img=selectedPreviewImage();
    if(!img){handle.remove();return;}
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
      const img=selectedPreviewImage();
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
      resizeSelectedImage(Math.max(20,Math.min(100,desired)));
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



  /* Moving original content is restricted to a continuous run of verified
     sibling blocks. Exact source fragments and whitespace gaps are kept. */
  const MOVE_TAGS=new Set(["P","IMG","LI","BLOCKQUOTE","FIGURE"]);
  function movableSourceNode(node){
    if(!node||!MOVE_TAGS.has(node.tagName)||!node.parentElement||
       !state.doc?.querySelector("main")?.contains(node))return false;
    const key=node.getAttribute("data-editor-key");
    if(!key||!state.original.has(key)||cleanOuter(node)!==state.original.get(key)||
       node.hasAttribute("id")||node.hasAttribute("name")||
       node.matches("nav *,header *,footer *,aside *,form *,dialog *")||
       node.querySelector("[id],[name],script,form,button,iframe,[contenteditable]")||
       state.stagedMedia?.key===key)return false;
    const dirty=[...state.dirty].some(id=>{
      const edit=getWorking(id);
      return edit&&(node===edit||node.contains(edit)||edit.contains(node));
    });
    if(dirty)return false;
    if(layoutGroups().some(group=>{
      const parent=state.doc.querySelector("main "+group.parentSelector);
      return !parent||parent.contains(node)||node.contains(parent);
    }))return false;
    if(state.removals.some(item=>item.key===key||
      node.contains(getWorking(item.key))))return false;
    if(state.additions.some(item=>{
      const root=state.doc.querySelector("main");
      const target=root?.querySelector(item.selector);
      return !target||target===node||node.contains(target);
    }))return false;
    return true;
  }
  function blockSourceSpans(html,keys){
    const entries=keys.map(key=>{
      const markup=state.original.get(key);
      if(!markup)throw Error("A moved block no longer has original markup");
      const index=html.indexOf(markup);
      if(index<0||html.indexOf(markup,index+markup.length)>=0)
        throw Error("A content block is not uniquely identifiable in the page source");
      return {key,markup,start:index,end:index+markup.length};
    });
    for(let i=1;i<entries.length;i++){
      if(entries[i-1].end>entries[i].start||
         html.slice(entries[i-1].end,entries[i].start).trim())
        throw Error("Only immediately adjacent source blocks can be reordered");
    }
    return entries;
  }
  function validateBlockOrders(groups){
    if(!Array.isArray(groups)||groups.length>8)throw Error("Too many rearranged content groups");
    const used=new Set(),validated=[];
    for(const group of groups){
      const a=group?.originalKeys,b=group?.keys;
      if(!Array.isArray(a)||!Array.isArray(b)||a.length<2||a.length>12||
         a.length!==b.length||new Set(a).size!==a.length||new Set(b).size!==b.length||
         a.some(key=>typeof key!=="string"||!/^e\d+$/.test(key)||used.has(key))||
         b.some(key=>!a.includes(key)))throw Error("Content group order is invalid");
      const nodes=a.map(key=>getWorking(key));
      if(nodes.some(node=>!movableSourceNode(node)))throw Error("Content group has protected or edited blocks");
      const parent=nodes[0]?.parentElement;
      if(!parent||nodes.some(node=>node.parentElement!==parent))
        throw Error("Content blocks must remain in the same container");
      // Key order is checked against the original source, even when the
      // working document has already been rearranged.
      blockSourceSpans(state.source,a);
      // An interrupted run must never be collapsed into a new order.
      const current=[...parent.children].filter(node=>a.includes(node.getAttribute("data-editor-key")));
      if(current.length!==a.length||current.some((node,i)=>i>0&&
         [...parent.children].indexOf(node)!==[...parent.children].indexOf(current[i-1])+1))
        throw Error("Content group is no longer a contiguous run");
      a.forEach(key=>used.add(key));
      if(b.some((key,i)=>key!==a[i]))
        validated.push({originalKeys:a.slice(),keys:b.slice()});
    }
    return validated;
  }
  function applyBlockOrdersToWorking(groups){
    for(const group of groups){
      const nodes=group.keys.map(key=>getWorking(key));
      const parent=nodes[0]?.parentElement;
      const original=[...parent.children].filter(node=>
        group.originalKeys.includes(node.getAttribute("data-editor-key")));
      if(!parent||nodes.some(node=>node.parentElement!==parent)||
         original.length!==group.keys.length)throw Error("Content move cannot be restored");
      original[0].before(...nodes);
    }
  }
  function blockMoveCandidate(key){
    const node=getWorking(key);
    if(!node||!movableSourceNode(node))return null;
    const siblings=[...node.parentElement.children];
    const index=siblings.indexOf(node);
    let lo=index,hi=index;
    while(lo>0&&movableSourceNode(siblings[lo-1]))lo--;
    while(hi+1<siblings.length&&movableSourceNode(siblings[hi+1]))hi++;
    if(hi-lo<1)return null;
    const keys=siblings.slice(lo,hi+1).map(item=>item.getAttribute("data-editor-key"));
    const existing=state.blockOrders.find(group=>group.originalKeys.includes(key));
    const originalKeys=existing?existing.originalKeys:keys;
    if(existing&&(existing.originalKeys.length!==keys.length||
       originalKeys.some(id=>!keys.includes(id))))return null;
    if(state.blockOrders.some(group=>group!==existing&&
       group.originalKeys.some(id=>keys.includes(id))))return null;
    try{blockSourceSpans(state.source,originalKeys)}
    catch{return null}
    return {keys,originalKeys,index:keys.indexOf(key)};
  }

  function reorderOriginalRelative(fromKey,targetKey,after){
    const candidate=blockMoveCandidate(fromKey);
    if(!candidate||fromKey===targetKey||!candidate.keys.includes(targetKey))return false;
    const desired=candidate.keys.filter(key=>key!==fromKey);
    const at=desired.indexOf(targetKey)+(after?1:0);
    desired.splice(at,0,fromKey);
    if(desired.every((key,i)=>key===candidate.keys[i]))return false;
    const groups=state.blockOrders.map(group=>({
      originalKeys:group.originalKeys.slice(),keys:group.keys.slice()
    }));
    const existing=groups.find(group=>group.originalKeys.includes(fromKey));
    if(existing)existing.keys=desired;
    else groups.push({originalKeys:candidate.originalKeys.slice(),keys:desired});
    try{
      checkpoint();
      const node=getWorking(fromKey),target=getWorking(targetKey);
      if(after)target.after(node);else target.before(node);
      state.blockOrders=validateBlockOrders(groups);
      renderPreview(fromKey);
      scheduleDraft();
      updateStatus("Original content order updated · Not published");
      return true;
    }catch(error){
      undo();
      notice("This content cannot be rearranged safely. "+error.message,"Move stopped");
      return false;
    }
  }
  function moveOriginalBlock(direction){
    if(![-1,1].includes(direction)||!state.selected)return;
    const candidate=blockMoveCandidate(state.selected);
    const target=candidate?.keys[candidate.index+direction];
    if(!target)return;
    reorderOriginalRelative(state.selected,target,direction>0);
  }
  function positionBlockMoveHandle(){
    const doc=state.frameDoc,handle=doc?.getElementById("moon-block-move-handle");
    if(!handle||state.blockPointer)return;
    const node=doc.querySelector('[data-editor-key="'+state.selected+'"]');
    if(!node||!blockMoveCandidate(state.selected)){handle.remove();return;}
    const r=node.getBoundingClientRect(),w=doc.defaultView;
    if(r.bottom<0||r.right<0||r.top>w.innerHeight||r.left>w.innerWidth){
      handle.hidden=true;return;
    }
    handle.hidden=false;
    handle.style.left=Math.max(0,Math.min(w.innerWidth-32,r.left-27))+"px";
    handle.style.top=Math.max(0,Math.min(w.innerHeight-32,r.top))+"px";
  }

  function pointerBlockTarget(doc,x,y,keys,from,handle){
    // The grip follows the pointer, so temporarily remove it from hit tests.
    const former=handle.style.pointerEvents;
    handle.style.pointerEvents="none";
    const hit=doc.elementFromPoint(x,y);
    handle.style.pointerEvents=former;
    for(let node=hit;node&&node!==doc.body;node=node.parentElement){
      const key=node.getAttribute?.("data-editor-key");
      if(key&&key!==from&&keys.includes(key))return node;
    }
    return null;
  }
  function clearPointerBlockMarks(){
    const doc=state.frameDoc;
    if(!doc)return;
    for(const marked of doc.querySelectorAll("[data-editor-drag-target]"))
      marked.removeAttribute("data-editor-drag-target");
  }
  function createBlockMoveHandle(){
    const doc=state.frameDoc;
    if(!doc||doc.getElementById("moon-block-move-handle"))return;
    const handle=doc.createElement("button");
    handle.id="moon-block-move-handle";handle.type="button";
    handle.textContent="⠿";
    handle.title="Drag or use Up/Down arrow keys to reorder this block";
    handle.setAttribute("aria-label","Drag selected content block, or use Up and Down arrow keys to move it among eligible neighbouring blocks.");
    handle.style.cssText="position:fixed;z-index:2147483646;display:grid;place-items:center;width:30px;height:30px;border:2px solid #27654f;border-radius:5px;background:#fff;color:#174932;cursor:grab;touch-action:none;font:700 21px/1 system-ui;box-shadow:0 1px 6px #0004";
    handle.addEventListener("keydown",event=>{
      if(!["ArrowUp","ArrowDown"].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      const direction=event.key==="ArrowUp"?-1:1;
      const candidate=blockMoveCandidate(state.selected);
      if(!candidate?.keys[candidate.index+direction])return;
      moveOriginalBlock(direction);
      // Moving rerenders the iframe. Restore keyboard focus to the new grip.
      state.frameDoc?.getElementById("moon-block-move-handle")?.focus({preventScroll:true});
    });
    handle.addEventListener("click",event=>event.stopPropagation());
    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0||state.blockPointer)return;
      const group=blockMoveCandidate(state.selected);
      if(!group)return;
      event.preventDefault();event.stopPropagation();
      const box=handle.getBoundingClientRect();
      state.blockPointer={id:event.pointerId,from:state.selected,
        keys:group.keys.slice(),x:event.clientX,y:event.clientY,
        left:box.left,top:box.top};
      handle.setPointerCapture(event.pointerId);
      handle.style.cursor="grabbing";
    });
    handle.addEventListener("pointermove",event=>{
      const drag=state.blockPointer;
      if(!drag||drag.id!==event.pointerId)return;
      event.preventDefault();
      handle.style.left=(drag.left+event.clientX-drag.x)+"px";
      handle.style.top=(drag.top+event.clientY-drag.y)+"px";
      clearPointerBlockMarks();
      const target=pointerBlockTarget(doc,event.clientX,event.clientY,drag.keys,drag.from,handle);
      if(target){
        const rect=target.getBoundingClientRect();
        target.setAttribute("data-editor-drag-target",
          event.clientY>=rect.top+rect.height/2?"after":"before");
      }
    });
    const endDrag=event=>{
      const drag=state.blockPointer;
      if(!drag||drag.id!==event.pointerId)return;
      event.preventDefault();
      const target=event.type==="pointerup"?
        pointerBlockTarget(doc,event.clientX,event.clientY,drag.keys,drag.from,handle):null;
      const rect=target?.getBoundingClientRect();
      const key=target?.getAttribute("data-editor-key");
      const after=!!rect&&event.clientY>=rect.top+rect.height/2;
      state.blockPointer=null;
      if(handle.hasPointerCapture(event.pointerId))
        handle.releasePointerCapture(event.pointerId);
      handle.style.cursor="grab";
      clearPointerBlockMarks();
      positionBlockMoveHandle();
      if(key)setTimeout(()=>reorderOriginalRelative(drag.from,key,after),0);
    };
    handle.addEventListener("pointerup",endDrag);
    handle.addEventListener("pointercancel",endDrag);
    doc.body.appendChild(handle);
    positionBlockMoveHandle();
  }

  function restoreReviewedBlockOrder(index){
    const group=state.blockOrders[index];
    if(!group)return;
    checkpoint();
    const nodes=group.originalKeys.map(key=>getWorking(key));
    const parent=nodes[0]?.parentElement;
    const first=[...parent.children].find(node=>group.originalKeys.includes(node.getAttribute("data-editor-key")));
    first.before(...nodes);
    state.blockOrders.splice(index,1);
    renderPreview();
    saveDraft();
    updateStatus("Original content order restored · Not published");
    const modal=$("reviewDialog");
    if(modal.open)modal.close();
    if(state.dirty.size||state.additions.length||layoutGroups().length||
       state.removals.length||state.blockOrders.length||
       state.sectionOrder.some((id,i)=>id!==state.originalSections[i]))reviewChanges();
  }
  function exportBlockOrders(html){
    const groups=validateBlockOrders(state.blockOrders);
    const edits=[];
    for(const group of groups){
      const source=blockSourceSpans(html,group.originalKeys);
      const parts=new Map(source.map(item=>[item.key,item.markup]));
      const gaps=source.slice(0,-1).map((item,i)=>
        html.slice(item.end,source[i+1].start));
      let replacement="";
      group.keys.forEach((key,i)=>replacement+=parts.get(key)+(gaps[i]||""));
      edits.push({start:source[0].start,end:source.at(-1).end,replacement});
    }
    edits.sort((a,b)=>b.start-a.start);
    for(let i=1;i<edits.length;i++)
      if(edits[i-1].start<edits[i].end)throw Error("Moved content groups overlap");
    for(const edit of edits)
      html=html.slice(0,edit.start)+edit.replacement+html.slice(edit.end);
    return html;
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

  // The visible divider applies only to source-verified 12-column groups
  // created with two stable columns. It never changes mobile positions.
  function activeTwoColumnLayout(){
    const choice=directLayoutSelection();
    if(!choice)return null;
    const index=layoutGroups().findIndex(group=>
      group.parentSelector===choice.spec.parentSelector);
    if(index<0)return null;
    const group=layoutGroups()[index];
    const placed=group.children.filter(child=>child.desktop.w!==12);
    if(placed.length<2)return null;
    const right=placed.filter(child=>child.desktop.x>1);
    const left=placed.filter(child=>child.desktop.x===1);
    if(!left.length||!right.length)return null;
    const split=right[0].desktop.x-1;
    if(split<2||split>10||left.some(c=>c.desktop.w!==split)||
       right.some(c=>c.desktop.x!==split+1||c.desktop.w!==12-split))
      return null;
    // A full-width heading is allowed, but partial-width spanning cards
    // would be distorted by a blanket left/right width adjustment.
    if(placed.length!==left.length+right.length)return null;
    return {group,index,split,parentSelector:group.parentSelector,
      rightSelector:right[0].selector};
  }
  function resizeTwoColumnLayout(width){
    const current=activeTwoColumnLayout();
    if(!current||!Number.isInteger(width)||width<2||width>10)return null;
    const amended={...current.group,children:current.group.children.map(child=>{
      const position={...child.desktop};
      if(position.w!==12){
        if(position.x===1)position.w=width;
        else {position.x=width+1;position.w=12-width;}
      }
      return {...child,desktop:position};
    })};
    const proposed=layoutGroups().map((g,i)=>i===current.index?amended:g);
    const original=new DOMParser().parseFromString(state.source,"text/html");
    const css=MoonResponsiveLayout.cssForGroups(original,proposed);
    return {css,proposed,current};
  }
  function positionColumnResizeHandle(){
    const doc=state.frameDoc,handle=doc?.getElementById("moon-column-resize-handle");
    if(!handle||state.columnPointer)return;
    const current=activeTwoColumnLayout();
    if(!current){handle.remove();return;}
    const parent=doc.querySelector("main "+current.parentSelector);
    const right=doc.querySelector("main "+current.rightSelector);
    if(!parent||!right){handle.remove();return;}
    const pr=parent.getBoundingClientRect(),rr=right.getBoundingClientRect(),view=doc.defaultView;
    if(pr.bottom<0||pr.top>view.innerHeight||rr.left<0||rr.left>view.innerWidth){
      handle.hidden=true;return;
    }
    handle.hidden=false;
    handle.style.left=Math.max(0,Math.min(view.innerWidth-30,rr.left-21))+"px";
    handle.style.top=Math.max(0,Math.min(view.innerHeight-42,Math.max(0,rr.top+8)))+"px";
    handle.title="Drag to resize two columns · "+current.split+" / "+(12-current.split);
    handle.setAttribute("aria-label","Resize column divider: "+current.split+" of 12 columns on the left. Use Left or Right arrows, Shift for two-column steps, Home for minimum, End for maximum.");
  }
  function createColumnResizeHandle(){
    const doc=state.frameDoc;
    if(!doc||doc.getElementById("moon-column-resize-handle")||!activeTwoColumnLayout())return;
    const handle=doc.createElement("button");
    handle.id="moon-column-resize-handle";handle.type="button";
    handle.textContent="↔";
    handle.style.cssText="position:fixed;z-index:2147483645;display:grid;place-items:center;width:30px;height:42px;border:2px solid #27654f;border-radius:5px;background:#fff;color:#174932;cursor:ew-resize;touch-action:none;font:700 21px/1 system-ui;box-shadow:0 1px 6px #0004";
    handle.addEventListener("keydown",event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      const current=activeTwoColumnLayout();
      if(!current)return;
      event.preventDefault();event.stopPropagation();
      const step=event.shiftKey?2:1;
      const desired=event.key==="Home"?2:event.key==="End"?10:
        Math.max(2,Math.min(10,current.split+(event.key==="ArrowRight"?step:-step)));
      if(desired===current.split)return;
      const candidate=resizeTwoColumnLayout(desired);
      if(!candidate)return;
      checkpoint();
      state.responsiveGroups=candidate.proposed;
      state.responsiveGroup=candidate.proposed.length===1?candidate.proposed[0]:null;
      $("directLayoutPreset").value="custom";
      $("directLayoutCustomField").hidden=false;
      $("directLayoutCustomColumns").value=String(desired);
      $("directLayoutCustomValue").textContent=desired+" / "+(12-desired)+" columns";
      renderPreview(state.selected);
      scheduleDraft();
      updateStatus("Responsive columns resized · Not published");
      state.frameDoc?.getElementById("moon-column-resize-handle")?.focus({preventScroll:true});
    });
    handle.addEventListener("click",event=>event.stopPropagation());
    handle.addEventListener("pointerdown",event=>{
      if(event.button!==0||state.columnPointer)return;
      const current=activeTwoColumnLayout();
      const parent=current&&doc.querySelector("main "+current.parentSelector);
      const rect=parent?.getBoundingClientRect();
      if(!current||!rect||rect.width<=0)return;
      event.preventDefault();event.stopPropagation();
      state.columnPointer={id:event.pointerId,rect,width:current.split,
        selected:state.selected,initial:current.split};
      handle.setPointerCapture(event.pointerId);
      handle.style.cursor="grabbing";
    });
    handle.addEventListener("pointermove",event=>{
      const drag=state.columnPointer;
      if(!drag||drag.id!==event.pointerId)return;
      event.preventDefault();
      const desired=Math.max(2,Math.min(10,
        Math.round(12*(event.clientX-drag.rect.left)/drag.rect.width)));
      if(desired===drag.width)return;
      const candidate=resizeTwoColumnLayout(desired);
      if(!candidate)return;
      drag.width=desired;
      const style=doc.getElementById("moon-responsive-group-layout");
      if(style)style.textContent=candidate.css;
      handle.title="Column widths "+desired+" / "+(12-desired);
      $("directLayoutCustomValue").textContent=desired+" / "+(12-desired)+" columns";
    });
    const finish=event=>{
      const drag=state.columnPointer;
      if(!drag||drag.id!==event.pointerId)return;
      event.preventDefault();event.stopPropagation();
      state.columnPointer=null;
      if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
      handle.style.cursor="ew-resize";
      if(event.type==="pointercancel"||drag.width===drag.initial){
        const style=doc.getElementById("moon-responsive-group-layout");
        const original=new DOMParser().parseFromString(state.source,"text/html");
        if(style)style.textContent=layoutCss(original);
        positionColumnResizeHandle();return;
      }
      const candidate=resizeTwoColumnLayout(drag.width);
      if(!candidate){positionColumnResizeHandle();return;}
      checkpoint();
      state.responsiveGroups=candidate.proposed;
      state.responsiveGroup=candidate.proposed.length===1?candidate.proposed[0]:null;
      $("directLayoutPreset").value="custom";
      $("directLayoutCustomField").hidden=false;
      $("directLayoutCustomColumns").value=String(drag.width);
      $("directLayoutCustomValue").textContent=drag.width+" / "+(12-drag.width)+" columns";
      renderPreview(drag.selected);
      scheduleDraft();
      updateStatus("Responsive columns resized · Not published");
    };
    handle.addEventListener("pointerup",finish);
    handle.addEventListener("pointercancel",finish);
    doc.body.appendChild(handle);
    positionColumnResizeHandle();
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
      if(target&&state.blockOrders.some(group=>{
        const root=state.doc.querySelector("main");
        const container=root?.querySelector(parent);
        return group.originalKeys.some(key=>container?.contains(getWorking(key)));
      }))throw Error("Undo block rearrangements in this section before applying a responsive grid");
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
      renderPreview(state.selected);scheduleDraft();
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
        if(state.mediaChooseInsert==="quick"){
          const form=state.frameDoc?.getElementById("moon-quick-composer");
          const path=form?.querySelector("#moon-quick-new-image");
          const text=form?.querySelector("#moon-quick-new-text");
          if(!form||!path||!text||!safeExistingImagePath(item.path)){
            $("mediaStatus").textContent="The inline image editor is no longer available.";
            return;
          }
          path.value=item.path;
          path.dispatchEvent(new Event("input",{bubbles:true}));
          if(!text.value.trim())text.value=item.description.slice(0,200);
          $("mediaDialog").close();
          path.focus({preventScroll:true});
          return;
        }
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
    if(forInsertion==="quick"){
      const form=state.frameDoc?.getElementById("moon-quick-composer");
      if(!form||form.querySelector("#moon-quick-new-kind")?.value!=="image")return;
    }else if(forInsertion==="added"){
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
  // Restrict visual styling to portable typefaces and valid CSS colours.
  const QUICK_FONTS={
    default:"",serif:"Georgia, serif",classic:'"Times New Roman", Times, serif',
    sans:"Arial, sans-serif",modern:"system-ui, sans-serif",mono:"monospace"
  };
  function allowedAppearance(value){
    return value&&typeof value==="object"&&!Array.isArray(value)&&
      Object.keys(value).every(key=>["family","size","color","background"].includes(key))&&
      (value.family===undefined||Object.values(QUICK_FONTS).includes(value.family))&&
      (value.size===undefined||(Number.isInteger(value.size)&&value.size>=12&&value.size<=80))&&
      ["color","background"].every(key=>value[key]===undefined||
        (typeof value[key]==="string"&&/^#[0-9a-fA-F]{6}$/.test(value[key])));
  }
  const FREE_CLASS="moon-free-object";
  const FREE_CSS=[
    "main:has(.moon-free-object) *:has(.moon-free-object){overflow:visible!important}",
    ".moon-free-object{position:relative;z-index:3;box-sizing:border-box;max-width:none}",
    "@media(max-width:700px){.moon-free-object{translate:none!important;width:auto!important;max-width:100%!important;min-height:0!important;height:auto!important;position:static!important}img.moon-free-object{width:auto!important;max-width:100%!important;height:auto!important}}"
  ].join("\n");
  function freePositionValid(p){return !!p&&typeof p==="object"&&!Array.isArray(p)&&
    Object.keys(p).length===4&&["x","y","width","height"].every(k=>Number.isInteger(p[k]))&&
    Math.abs(p.x)<=16000&&Math.abs(p.y)<=16000&&p.width>=35&&p.width<=4000&&p.height>=18&&p.height<=4000;}
  function freeStyle(p){return "translate:"+p.x+"px "+p.y+"px;width:"+p.width+
    "px;min-height:"+p.height+"px;max-width:none;box-sizing:border-box"}
  const ADDED_LAYOUT_DEFAULT={align:"left",widthPercent:100,spaceAbove:0,spaceBelow:0};
  function addedBlockLayout(item){return {...ADDED_LAYOUT_DEFAULT,...(item?.layout||{})};}
  function isDefaultAddedLayout(layout){
    return Object.keys(ADDED_LAYOUT_DEFAULT).every(k=>layout[k]===ADDED_LAYOUT_DEFAULT[k]);
  }
  function validateAddedLayout(value){
    if(value===undefined)return;
    if(!value||typeof value!=="object"||Array.isArray(value)||
      Object.keys(value).length!==4||
      Object.keys(ADDED_LAYOUT_DEFAULT).some(k=>!Object.hasOwn(value,k))||
      !["left","center","right"].includes(value.align)||
      !Number.isInteger(value.widthPercent)||value.widthPercent<30||
      value.widthPercent>100||value.widthPercent%5!==0||
      !Number.isInteger(value.spaceAbove)||value.spaceAbove<0||
      value.spaceAbove>80||value.spaceAbove%5!==0||
      !Number.isInteger(value.spaceBelow)||value.spaceBelow<0||
      value.spaceBelow>80||value.spaceBelow%5!==0)
      throw Error("Invalid added block layout");
  }
  function addedBlockStyle(item){
    if(!item?.layout&&!item?.appearance&&!item?.freePosition)return "";
    const layout=addedBlockLayout(item),rules=[];
    if(layout.widthPercent!==100)rules.push("width:"+layout.widthPercent+"%","max-width:100%","box-sizing:border-box");
    if(layout.align==="center")rules.push("text-align:center","margin-left:auto","margin-right:auto");
    else if(layout.align==="right")rules.push("text-align:right","margin-left:auto","margin-right:0");
    else if(layout.widthPercent!==100)rules.push("margin-left:0","margin-right:auto");
    if(layout.spaceAbove)rules.push("margin-top:"+layout.spaceAbove+"px");
    if(layout.spaceBelow)rules.push("margin-bottom:"+layout.spaceBelow+"px");
    const a=item.appearance||{};
    if(a.family)rules.push("font-family:"+a.family);
    if(a.size)rules.push("font-size:"+a.size+"px");
    if(a.color)rules.push("color:"+a.color);
    if(a.background)rules.push("background-color:"+a.background);
    if(item.freePosition)rules.push(freeStyle(item.freePosition));
    return rules.join(";");
  }
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
        (kind==="image"?
          (item.widthPercent!==undefined&&!validImagePercent(item.widthPercent)):
          item.widthPercent!==undefined)||
        item.page!==state.page)
        {
          if(kind==="image"&&item){
            const issues=[];
            if(!["p","h2","h3","h4"].includes(item.tag))issues.push("unsupported anchor");
            if(typeof item.selector!=="string"||item.selector.length>500)issues.push("anchor selector");
            if(typeof item.before!=="string"||item.before.length>4000)issues.push("source text");
            if(typeof item.text!=="string"||!item.text.trim()||item.text.length>200)
              issues.push("image description");
            if(!safeExistingImagePath(item.src))issues.push("image path");
            if(item.headingTag!==undefined||item.href!==undefined)issues.push("unexpected fields");
            if(item.widthPercent!==undefined&&!validImagePercent(item.widthPercent))
              issues.push("image width");
            if(item.page!==state.page)issues.push("page mismatch");
            throw Error("Invalid image insertion"+(issues.length?" ("+issues.join(", ")+")":""));
          }
          throw Error("Invalid "+kind+" insertion");
        }
      validateAddedLayout(item.layout);
      if(item.freePosition!==undefined&&!freePositionValid(item.freePosition))throw Error("Invalid free canvas position");
      if(item.appearance!==undefined&&
         (kind==="image"||!allowedAppearance(item.appearance)))
        throw Error("Invalid text appearance");
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
        ...(kind==="image"?{src:item.src,...(item.widthPercent!==undefined?
          {widthPercent:item.widthPercent}:{})}:{}),
        ...(item.layout!==undefined?{layout:{...item.layout}}:{}),
        ...(item.appearance!==undefined?{appearance:{...item.appearance}}:{}),
        ...(item.freePosition!==undefined?{freePosition:{...item.freePosition}}:{})});
    }
    return out;
  }
  function escapePlainText(text){
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function createAdditionElement(doc,item){
    const kind=insertionKind(item);
    if(kind==="heading"){
      const node=doc.createElement(item.headingTag);node.textContent=item.text;
      if(item.freePosition)node.classList.add(FREE_CLASS);
      if(addedBlockStyle(item))node.setAttribute("style",addedBlockStyle(item));
      return node;
    }
    const node=doc.createElement("p");
    if(item.freePosition)node.classList.add(FREE_CLASS);
    if(addedBlockStyle(item))node.setAttribute("style",addedBlockStyle(item));
    if(kind==="image"){
      const img=doc.createElement("img");
      img.setAttribute("src",item.src);
      img.setAttribute("alt",item.text);
      img.setAttribute("loading","lazy");
      img.style.cssText="max-width:100%;height:auto";
      if(item.widthPercent!==undefined)img.style.width=item.widthPercent+"%";
      if(item.freePosition)img.style.width="100%";
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
    const text=escapePlainText(item.text),css=addedBlockStyle(item);
    const style=css?' style="'+css+'"':"";
    if(insertionKind(item)==="image")return '<p'+(item.freePosition?' class="moon-free-object"':"")+style+'><img src="'+item.src+
      '" alt="'+text.replace(/"/g,"&quot;").replace(/'/g,"&#39;")+
      '" loading="lazy" style="max-width:100%;height:auto'+
        (item.widthPercent===undefined?"":";width:"+item.widthPercent+"%")+'"></p>';
    if(insertionKind(item)==="heading")return "<"+item.headingTag+(item.freePosition?' class="moon-free-object"':"")+style+">"+text+"</"+item.headingTag+">";
    if(insertionKind(item)==="link")return "<p"+(item.freePosition?' class="moon-free-object"':"")+style+"><a href=\""+escapePlainText(item.href)+"\""+
      (/^https:\/\//i.test(item.href)?" rel=\"noopener noreferrer\"":"")+">"+text+"</a></p>";
    return "<p"+(item.freePosition?' class="moon-free-object"':"")+style+">"+text+"</p>";
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
    if(state.stagedMedia?.key===key||state.blockOrders.some(group=>group.originalKeys.includes(key)))return null;
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
  function quickRemoveSelectedSource(){
    if(sourceRemovalCandidate(state.selected))return removeSelectedSource();
    // A common visual-editing workflow is to resize an original image and
    // then remove it. Revert that image inside the working draft before
    // requesting a verified source removal, preserving a single Undo step.
    const key=state.selected,current=key&&getWorking(key);
    if(current?.tagName!=="IMG"||!state.dirty.has(key)||
       state.stagedMedia?.key===key)return;
    const originalMarkup=state.original.get(key);
    if(!originalMarkup)return;
    if(!confirm("Remove this image from the page? Its prior edits will also be discarded. Undo can restore the image."))return;
    const original=new DOMParser().parseFromString(originalMarkup,"text/html").body.firstElementChild;
    if(original?.tagName!=="IMG")return;
    checkpoint();
    const replacement=original.cloneNode(true);
    replacement.setAttribute("data-editor-key",key);
    current.replaceWith(replacement);
    state.dirty.delete(key);
    const verified=sourceRemovalCandidate(key);
    if(!verified){
      replacement.replaceWith(current);
      state.dirty.add(key);
      notice("This image is involved in another change and cannot be removed safely.");
      return;
    }
    state.removals.push(verified);
    renderPreview();
    saveDraft();
    updateStatus("Image removed from draft · Undo to restore");
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
    if(state.blockOrders.length)next=exportBlockOrders(next);
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

  // GitHub-only direct publishing. No server, OAuth client secret, or stored token.
  // Fine-grained tokens are held only in this tab's JavaScript memory.
  const directGithub={token:"",login:"",busy:false,lastPublished:""};
  const DIRECT_REPO="gmoon-code/gmoon-code.github.io";
  const DIRECT_API="https://api.github.com/repos/"+DIRECT_REPO+"/contents/";
  function directGithubMessage(message){
    $("directGithubStatus").textContent=message;
  }
  function updateDirectPublishControls(){
    const moved=state.sectionOrder.some((id,i)=>id!==state.originalSections[i]);
    const changed=state.dirty.size||moved||layoutGroups().length||
      state.additions.length||state.removals.length||state.blockOrders.length;
    const published=directGithub.lastPublished===state.page+":"+state.fingerprint;
    $("directPublishOpen").disabled=!state.page||!changed||!!state.staleDraft||
      directGithub.busy||published;
    $("directGithubConnect").disabled=directGithub.busy;
    $("directGithubDisconnect").disabled=directGithub.busy||!directGithub.token;
    $("directGithubToken").disabled=directGithub.busy;
    $("directPublishSummary").disabled=directGithub.busy;
    $("directPublishClose").disabled=directGithub.busy;
    $("directPublishConfirm").disabled=directGithub.busy||!directGithub.token||
      !$("directPublishSummary").value.trim()||
      published||!!state.stagedMedia;
  }
  function openDirectPublish(){
    if(!state.page||directGithub.busy)return;
    try{buildExport();}
    catch(error){notice(error.message,"Review your changes before publishing");return;}
    const dialog=$("directPublishDialog");
    $("directPublishPage").textContent="Page to publish: "+state.page;
    $("directPublishSummary").value="Update "+state.page;
    $("directPublishResult").replaceChildren();
    $("directGithubSetup").hidden=!!directGithub.token;
    directGithubMessage(state.stagedMedia?
      "An image upload is staged. Export and review the new image separately before using direct publish.":
      directGithub.token?"Connected to GitHub as "+directGithub.login+" for this tab.":
      "Connect using a fine-grained token for this repository.");
    updateDirectPublishControls();
    dialog.showModal();
  }
  async function directGithubRequest(path,token,options={}){
    const response=await fetch(path,{
      ...options,cache:"no-store",
      headers:{
        "Accept":"application/vnd.github+json",
        "X-GitHub-Api-Version":"2022-11-28",
        "Authorization":"Bearer "+token,
        ...(options.body?{"Content-Type":"application/json"}:{})
      }
    });
    let data={};
    try{data=await response.json()}catch{}
    if(!response.ok){
      const message=response.status===401?"Token invalid or expired.":
        response.status===403?"GitHub denied this operation. Check Contents: Read and write and branch protection.":
        response.status===404?"Repository or file not available to this token.":
        response.status===409?"GitHub detected a conflicting update. Reload before publishing.":
        response.status===422?"GitHub rejected this update. Check branch rules and the file content.":
        "GitHub API returned HTTP "+response.status+".";
      throw Error(message);
    }
    return data;
  }
  async function connectDirectGithub(){
    if(directGithub.busy)return;
    const token=$("directGithubToken").value.trim();
    $("directGithubToken").value="";
    if(!/^github_pat_[A-Za-z0-9_]+$/.test(token)){
      directGithubMessage("Use a fine-grained personal access token beginning with github_pat_.");
      return;
    }
    directGithub.busy=true;updateDirectPublishControls();
    directGithubMessage("Checking your GitHub account…");
    try{
      const user=await directGithubRequest("https://api.github.com/user",token);
      if(typeof user.login!=="string"||user.login.toLowerCase()!=="gmoon-code")
        throw Error("Please use a token owned by the gmoon-code GitHub account.");
      // A GET also checks access to the exact repository before any commit.
      await directGithubRequest(DIRECT_API+"index.html?ref=main",token);
      directGithub.token=token;
      directGithub.login=user.login;
      $("directGithubSetup").hidden=true;
      directGithubMessage("Connected as "+user.login+". Token is kept only until this tab closes or you disconnect.");
    }catch(error){
      directGithub.token="";directGithub.login="";
      directGithubMessage(error.message||"Could not connect to GitHub.");
    }finally{
      directGithub.busy=false;updateDirectPublishControls();
    }
  }
  function disconnectDirectGithub(){
    if(directGithub.busy)return;
    directGithub.token="";directGithub.login="";
    $("directGithubToken").value="";
    $("directGithubSetup").hidden=false;
    directGithubMessage("Disconnected. The token is no longer retained by this editor.");
    updateDirectPublishControls();
  }
  function decodeGitHubContent(content){
    if(typeof content!=="string")throw Error("GitHub did not provide file contents.");
    const bytes=Uint8Array.from(atob(content.replace(/\s/g,"")),character=>character.charCodeAt(0));
    return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  }
  function encodeGitHubContent(content){
    const bytes=new TextEncoder().encode(content);
    // Chunk conversion avoids argument-list limits for larger HTML pages.
    let binary="";
    for(let start=0;start<bytes.length;start+=8192)
      binary+=String.fromCharCode(...bytes.subarray(start,start+8192));
    return btoa(binary);
  }
  async function publishDirectGithub(){
    if(directGithub.busy||!directGithub.token)return;
    const summary=$("directPublishSummary").value.trim();
    if(!summary||summary.length>100){directGithubMessage("Enter a short update description.");return;}
    if(state.stagedMedia){directGithubMessage("Direct publishing of new image files is not supported.");return;}
    const page=state.page,source=state.source,fingerprint=state.fingerprint;
    if(!page||!/^[a-z0-9-]+\.html$/.test(page))return;
    let content;
    try{content=buildExport();}
    catch(error){directGithubMessage(error.message);return;}
    directGithub.busy=true;updateDirectPublishControls();
    directGithubMessage("Checking the current GitHub version of "+page+"…");
    const result=$("directPublishResult");result.replaceChildren();
    try{
      const file=await directGithubRequest(DIRECT_API+page+"?ref=main",directGithub.token);
      if(file.type!=="file"||typeof file.sha!=="string"||file.encoding!=="base64")
        throw Error("GitHub returned an unexpected file. No changes were published.");
      if(decodeGitHubContent(file.content)!==source)
        throw Error("The page has changed on GitHub since this draft began. Export your changes, refresh the website, and reconcile them before publishing. Nothing was overwritten.");
      if(state.page!==page||state.source!==source||state.fingerprint!==fingerprint||
        buildExport()!==content)
        throw Error("The editor changed during the publication check. Review and try again.");
      directGithubMessage("Verified source. Committing the reviewed page to GitHub…");
      const response=await directGithubRequest(DIRECT_API+page,directGithub.token,{
        method:"PUT",
        body:JSON.stringify({message:"Website editor: "+summary,
          content:encodeGitHubContent(content),sha:file.sha,branch:"main"})
      });
      const commit=response.commit?.sha;
      if(typeof commit!=="string"||!/^[a-f0-9]{40}$/.test(commit))
        throw Error("GitHub responded without a verifiable commit. Check the repository before retrying.");
      directGithub.lastPublished=page+":"+fingerprint;
      directGithubMessage("Committed to GitHub. GitHub Pages may still be deploying the new version.");
      const link=document.createElement("a");
      link.href="https://github.com/"+DIRECT_REPO+"/commit/"+commit;
      link.target="_blank";link.rel="noopener noreferrer";
      link.textContent="View published GitHub commit ↗";
      const live=document.createElement("a");
      live.href="https://gmoon-code.github.io/"+page;
      live.target="_blank";live.rel="noopener noreferrer";
      live.textContent="Check the live page ↗";
      const spacer=document.createTextNode("  ·  ");
      result.append(link,spacer,live);
      $("editorSaveStatus").textContent="GitHub commit created · Pages deployment pending";
    }catch(error){
      directGithubMessage(error.message||"Publication failed. No success was confirmed.");
    }finally{
      directGithub.busy=false;updateDirectPublishControls();
    }
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
    if(!publisher.session||(!state.dirty.size&&!reordered&&!layoutGroups().length&&!state.additions.length&&!state.removals.length&&!state.blockOrders.length)||publisher.busy)return;
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
    if(state.blockOrders.some(group=>group.originalKeys.includes(state.selected))){
      notice("Restore the original order of these blocks before attaching new content to one of them.","Insertion unavailable");
      return;
    }
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
  // New content may be relocated after an existing unique heading or
  // paragraph. Only source anchors may receive an addition, and all newly
  // proposed destinations are checked again against the untouched page.
  function sourceMoveAnchors(){
    if(!state.doc||!state.source||!window.MoonResponsiveLayout)return [];
    const main=state.doc.querySelector("main");
    const source=new DOMParser().parseFromString(state.source,"text/html");
    const original=source.querySelector("main");
    if(!main||!original)return [];
    const anchors=[];
    for(const node of main.querySelectorAll("h2,h3,h4,p")){
      const key=node.getAttribute("data-editor-key");
      if(!key||!state.original.has(key)||
         node.closest("nav,header,footer,aside,form,dialog")||
         state.removals.some(item=>item.key===key)||
         state.blockOrders.some(group=>group.originalKeys.includes(key)))continue;
      let selector;
      try{selector=MoonResponsiveLayout.sourceSelector(node,main)}
      catch{continue;}
      let matches;
      try{matches=[...original.querySelectorAll(selector)]}
      catch{continue;}
      if(matches.length!==1||matches[0].tagName!==node.tagName)continue;
      const matched=matches[0];
      if(layoutGroups().some(group=>
        original.querySelector(group.parentSelector)?.contains(matched)))continue;
      const before=matched.textContent.trim().replace(/\s+/g," ");
      if(!before||before.length>4000)continue;
      const excerpt=before.slice(0,75)+(before.length>75?"…":"");
      anchors.push({key,selector,tag:node.tagName.toLowerCase(),before,
        title:(node.tagName==="P"?"Paragraph":node.tagName.toLowerCase().toUpperCase())+
          " · "+excerpt});
    }
    return anchors;
  }
  function updateAddedAnchorButton(){
    const item=state.additions[state.selectedAddition];
    const anchors=sourceMoveAnchors();
    const destination=anchors.find(a=>a.key===$("moveAddedAnchorPicker").value);
    $("moveAddedAnchorBtn").disabled=!item||!destination||
      destination.selector===item.selector;
  }
  function relocateAddedToAnchor(from,key){
    const item=state.additions[from];
    if(!item)return false;
    const anchor=sourceMoveAnchors().find(a=>a.key===key);
    if(!anchor||anchor.selector===item.selector)return false;
    const proposed=state.additions.filter((_,i)=>i!==from);
    proposed.push({...item,selector:anchor.selector,tag:anchor.tag,before:anchor.before});
    // Validate both the structured addition and the exact source-preserving
    // export before recording a move. Some pages contain duplicate raw HTML
    // fragments even when a CSS selector is unique.
    const previous=state.additions;
    try{
      validateParagraphAdditions(proposed);
      state.additions=proposed;
      try{buildExport()}finally{state.additions=previous;}
    }catch(error){
      state.additions=previous;
      notice("This destination cannot accept the new block. "+error.message,"Move stopped");
      return false;
    }
    checkpoint();
    state.additions=proposed;
    renderPreview(null,proposed.length-1);
    scheduleDraft();
    updateStatus("New block moved to another verified location · Not published");
    return true;
  }
  // New blocks can reorder within the same source anchor or move after
  // another verified source block; cross-anchor drops onto new blocks
  // remain disabled to avoid ambiguous placement.
  function reorderAddedRelative(from,to,after){
    const source=state.additions[from],destination=state.additions[to];
    if(!source||!destination||from===to||source.selector!==destination.selector)return false;
    const positions=state.additions.map((item,i)=>
      item.selector===source.selector?i:-1).filter(i=>i>=0);
    const fromAt=positions.indexOf(from),toAt=positions.indexOf(to);
    if(fromAt<0||toAt<0)return false;
    const ordered=positions.map(i=>state.additions[i]);
    const revised=ordered.slice();
    const [moved]=revised.splice(fromAt,1);
    const at=(fromAt<toAt?toAt-1:toAt)+(after?1:0);
    revised.splice(at,0,moved);
    if(revised.every((item,i)=>item===ordered[i]))return false;
    const proposal=state.additions.slice();
    positions.forEach((index,i)=>{proposal[index]=revised[i]});
    try{validateParagraphAdditions(proposal)}
    catch(error){notice("The new content cannot be moved. "+error.message,"Move stopped");return false;}
    checkpoint();
    state.additions=proposal;
    renderPreview(null,positions[at]);
    scheduleDraft();
    updateStatus("New content order updated · Not published");
    return true;
  }
  function positionAddedMoveHandle(){
    const doc=state.frameDoc,handle=doc?.getElementById("moon-added-block-move-handle");
    if(!handle||state.addedPointer)return;
    const index=state.selectedAddition,item=state.additions[index];
    const target=doc.querySelector('[data-editor-added-index="'+index+'"]');
    const count=state.additions.filter(entry=>entry.selector===item?.selector).length;
    if(!target||(count<2&&!sourceMoveAnchors().some(a=>a.selector!==item?.selector))){
      handle.remove();return;
    }
    const rect=target.getBoundingClientRect(),view=doc.defaultView;
    if(rect.bottom<0||rect.right<0||rect.top>view.innerHeight||rect.left>view.innerWidth){
      handle.hidden=true;return;
    }
    handle.hidden=false;
    handle.style.left=Math.max(0,Math.min(view.innerWidth-32,rect.left-29))+"px";
    handle.style.top=Math.max(0,Math.min(view.innerHeight-32,rect.top))+"px";
  }
  function addedDropTarget(doc,x,y,from,selector,handle){
    const previous=handle.style.pointerEvents;
    handle.style.pointerEvents="none";
    const hit=doc.elementFromPoint(x,y);
    handle.style.pointerEvents=previous;
    const target=hit?.closest?.("[data-editor-added-index]");
    const index=target?Number(target.getAttribute("data-editor-added-index")):-1;
    return index>=0&&index!==from&&state.additions[index]?.selector===selector?target:null;
  }
  function sourceAddedDropTarget(doc,x,y,handle,targets){
    const previous=handle.style.pointerEvents;
    handle.style.pointerEvents="none";
    const hit=doc.elementFromPoint(x,y);
    handle.style.pointerEvents=previous;
    const node=hit?.closest?.("[data-editor-key]");
    const key=node?.getAttribute("data-editor-key");
    return key&&targets.has(key)?node:null;
  }
  function clearAddedDropTargets(doc){
    for(const marked of doc.querySelectorAll(
      "[data-editor-added-drop-target],[data-editor-added-anchor-target]")){
      marked.removeAttribute("data-editor-added-drop-target");
      marked.removeAttribute("data-editor-added-anchor-target");
    }
  }
  function createAddedMoveHandle(){
    const doc=state.frameDoc;
    if(!doc||doc.getElementById("moon-added-block-move-handle"))return;
    const handle=doc.createElement("button");
    handle.id="moon-added-block-move-handle";handle.type="button";
    handle.textContent="⠿";
    handle.title="Drag to relocate, or use Up/Down arrows to reorder at this location";
    handle.setAttribute("aria-label","Drag this new block to another original text anchor; press Up or Down to reorder additions at the current anchor.");
    handle.style.cssText="position:fixed;z-index:2147483646;display:grid;place-items:center;width:30px;height:30px;border:2px solid #27654f;border-radius:5px;background:#fff;color:#174932;cursor:grab;touch-action:none;font:700 21px/1 system-ui;box-shadow:0 1px 6px #0004";
    handle.addEventListener("keydown",event=>{
      if(!["ArrowUp","ArrowDown"].includes(event.key))return;
      const index=state.selectedAddition,item=state.additions[index];
      if(!item)return;
      event.preventDefault();event.stopPropagation();
      const direction=event.key==="ArrowUp"?-1:1;
      const peers=state.additions.map((part,i)=>part.selector===item.selector?i:-1).filter(i=>i>=0);
      if(peers[peers.indexOf(index)+direction]===undefined)return;
      moveReviewedAddition(index,direction);
      // Preview is rebuilt after a move; recover the on-canvas keyboard target.
      state.frameDoc?.getElementById("moon-added-block-move-handle")?.focus({preventScroll:true});
    });
    handle.addEventListener("click",event=>event.stopPropagation());
    handle.addEventListener("pointerdown",event=>{
      const from=state.selectedAddition,item=state.additions[from];
      if(event.button!==0||state.addedPointer||!item)return;
      event.preventDefault();event.stopPropagation();
      const rect=handle.getBoundingClientRect();
      state.addedPointer={id:event.pointerId,from,selector:item.selector,
        targets:new Map(sourceMoveAnchors().filter(a=>a.selector!==item.selector)
          .map(a=>[a.key,a])),
        x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
      handle.setPointerCapture(event.pointerId);
      handle.style.cursor="grabbing";
    });
    handle.addEventListener("pointermove",event=>{
      const drag=state.addedPointer;
      if(!drag||drag.id!==event.pointerId)return;
      event.preventDefault();
      handle.style.left=(drag.left+event.clientX-drag.x)+"px";
      handle.style.top=(drag.top+event.clientY-drag.y)+"px";
      clearAddedDropTargets(doc);
      const target=addedDropTarget(doc,event.clientX,event.clientY,drag.from,drag.selector,handle);
      if(target){
        const rect=target.getBoundingClientRect();
        target.setAttribute("data-editor-added-drop-target",
          event.clientY>=rect.top+rect.height/2?"after":"before");
      }else{
        const sourceTarget=sourceAddedDropTarget(doc,event.clientX,event.clientY,
          handle,drag.targets);
        if(sourceTarget)sourceTarget.setAttribute("data-editor-added-anchor-target","");
      }
    });
    const finish=event=>{
      const drag=state.addedPointer;
      if(!drag||drag.id!==event.pointerId)return;
      event.preventDefault();
      const target=event.type==="pointerup"?
        addedDropTarget(doc,event.clientX,event.clientY,drag.from,drag.selector,handle):null;
      const sourceTarget=!target&&event.type==="pointerup"?
        sourceAddedDropTarget(doc,event.clientX,event.clientY,handle,drag.targets):null;
      const sourceKey=sourceTarget?.getAttribute("data-editor-key");
      const rect=target?.getBoundingClientRect();
      const index=target?Number(target.getAttribute("data-editor-added-index")):-1;
      const after=!!rect&&event.clientY>=rect.top+rect.height/2;
      state.addedPointer=null;
      if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);
      handle.style.cursor="grab";
      clearAddedDropTargets(doc);
      positionAddedMoveHandle();
      if(index>=0)setTimeout(()=>reorderAddedRelative(drag.from,index,after),0);
      else if(sourceKey)setTimeout(()=>relocateAddedToAnchor(drag.from,sourceKey),0);
    };
    handle.addEventListener("pointerup",finish);
    handle.addEventListener("pointercancel",finish);
    doc.body.append(handle);
    positionAddedMoveHandle();
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
      (state.blockOrders.length?" · "+state.blockOrders.length+" rearranged content group"+(state.blockOrders.length===1?"":"s"):"")+
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
    state.blockOrders.forEach((group,index)=>{
      const section=document.createElement("section");
      section.className="review-change";
      const h=document.createElement("h3");
      h.textContent="Rearranged existing content group "+(index+1);
      const detail=document.createElement("p");
      const describe=key=>{
        const node=getWorking(key);
        const value=node?.tagName==="IMG"?(node.getAttribute("alt")||"Image"):
          (node?.textContent||"").trim().replace(/\s+/g," ");
        return value.length>72?value.slice(0,72)+"…":value;
      };
      detail.textContent="Original order\n"+group.originalKeys.map(describe).join(" → ")+
        "\nCurrent order\n"+group.keys.map(describe).join(" → ");
      detail.style.whiteSpace="pre-wrap";
      const restore=document.createElement("button");
      restore.type="button";restore.textContent="Restore original block order";
      restore.setAttribute("aria-label","Restore reordered content group "+(index+1));
      restore.addEventListener("click",()=>restoreReviewedBlockOrder(index));
      section.append(h,detail,restore);list.append(section);
    });
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
      if(insertionKind(item)==='image')text.textContent+=' · '+item.src;
      const placementInfo=document.createElement('p');
      const blockLayout=addedBlockLayout(item);
      placementInfo.textContent="Block position · "+
        ({left:"Left",center:"Centre",right:"Right"}[blockLayout.align])+
        " · width "+blockLayout.widthPercent+"%"+
        " · above "+blockLayout.spaceAbove+"px"+
        " · below "+blockLayout.spaceBelow+"px"+
        (insertionKind(item)==="image"?
          " · image width "+(item.widthPercent===undefined?100:item.widthPercent)+"%":"");
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
      el.append(title,text,placementInfo,up,down,edit,remove);list.append(el);
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
    state.blockOrders=last.blockOrders||[];
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
    state.responsiveGroup=null;state.responsiveGroups=[];state.additions=[];state.removals=[];state.blockOrders=[];
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
    if(existingDraft||state.dirty.size||state.staleDraft||layoutGroups().length||state.additions.length||state.removals.length||state.blockOrders.length){
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
      $("pagePicker").value=state.page;
      $("mobilePagePicker").value=state.page;return;
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
      $("mobilePagePicker").value=page;
      state.source=source;
      state.fingerprint=hashText(source);
      state.doc=new DOMParser().parseFromString(source,"text/html");
      state.responsiveGroup=null;state.responsiveGroups=[];state.additions=[];state.removals=[];state.blockOrders=[];
      state.dirty.clear();
      state.history.length=0;
      state.redo.length=0;
      state.staleDraft=false;
      initialIndex();
      restoreDraft();
      const transferred=consumeFluidTextHandoff(page);
      renderPreview();
      const moved=state.sectionOrder.some((id,i)=>id!==state.originalSections[i]);
      updateStatus(transferred?"Verified content, style and/or responsive layout transferred · Not published":state.dirty.size||moved||layoutGroups().length||state.additions.length||state.removals.length||state.blockOrders.length?"Draft restored · Not published":state.staleDraft?"Older local draft exists · Not applied":"Ready to edit · Not published");
    } catch(e) {
      notice("Could not load "+page+". "+e.message,"Page load failed");
      if (state.page) {
        $("pagePicker").value=state.page;
        $("mobilePagePicker").value=state.page;
      }
      updateStatus("Unable to load page");
    }
  }

  function init() {
    initialiseWorkspacePanels();
    // The full page navigator remains available lower down on mobile, while
    // a compact equivalent beside the preview makes the editor usable first.
    // Both selectors feed the same source-verified loadPage workflow.
    const mobilePicker=$("mobilePagePicker");
    mobilePicker.replaceChildren(...[...$("pagePicker").options].map(option=>
      option.cloneNode(true)));
    mobilePicker.value=$("pagePicker").value;
    $("pagePicker").addEventListener("change",event=>{
      mobilePicker.value=event.target.value;
      loadPage(event.target.value);
    });
    mobilePicker.addEventListener("change",event=>{
      $("pagePicker").value=event.target.value;
      loadPage(event.target.value);
    });
    $("previewViewport").addEventListener("change",event=>{
      $("previewContainer").className="preview-frame-container "+event.target.value;
      positionQuickToolbar();
      positionQuickSize();
      positionQuickComposer();
      positionQuickLayout();
    });
    $("previewContainer").addEventListener("transitionend",event=>{
      if(event.target!==$("previewContainer")||event.propertyName!=="max-width")return;
      positionQuickToolbar();
      positionQuickSize();
      positionQuickComposer();
      positionQuickLayout();
    });
    $("previewTheme").addEventListener("change",event=>{
      const documentInFrame=$("pageFrame").contentDocument;
      if (documentInFrame) {
        state.frameDoc=documentInFrame;
        documentInFrame.documentElement.setAttribute("data-moon-theme",event.target.value);
        documentInFrame.documentElement.style.colorScheme=event.target.value;
        createQuickToolbar();
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
    $("browsePrevElement").addEventListener("click",()=>browseElement(-1));
    $("browseNextElement").addEventListener("click",()=>browseElement(1));
    window.addEventListener("keydown",handleEditorShortcuts);
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
    $("addedImageWidthPercent").addEventListener("input",event=>{
      if(!state.imageSliderActive){checkpoint();state.imageSliderActive=true;}
      resizeAddedImage(Number(event.target.value));
    });
    $("addedImageWidthPercent").addEventListener("change",event=>{
      if(!state.imageSliderActive)checkpoint();
      resizeAddedImage(Number(event.target.value));
      state.imageSliderActive=false;
    });
    $("addedBlockAlign").addEventListener("change",event=>
      setAddedBlockLayout({align:event.target.value},true));
    $("addedBlockWidth").addEventListener("input",event=>{
      if(!state.addedBlockSliderActive){
        checkpoint();state.addedBlockSliderActive=true;
      }
      setAddedBlockLayout({widthPercent:Number(event.target.value)});
    });
    $("addedBlockWidth").addEventListener("change",event=>{
      if(!state.addedBlockSliderActive)
        setAddedBlockLayout({widthPercent:Number(event.target.value)},true);
      else setAddedBlockLayout({widthPercent:Number(event.target.value)});
      state.addedBlockSliderActive=false;
    });
    for(const [id,key] of [
      ["addedBlockSpaceAbove","spaceAbove"],
      ["addedBlockSpaceBelow","spaceBelow"]
    ])$(id).addEventListener("change",event=>
      setAddedBlockLayout({[key]:Number(event.target.value)},true));
    $("resetAddedBlockLayout").addEventListener("click",()=>
      setAddedBlockLayout({...ADDED_LAYOUT_DEFAULT},true));
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
    $("moveOriginalUp").addEventListener("click",()=>moveOriginalBlock(-1));
    $("moveOriginalDown").addEventListener("click",()=>moveOriginalBlock(1));
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
    $("moveAddedAnchorPicker").addEventListener("change",updateAddedAnchorButton);
    $("moveAddedAnchorBtn").addEventListener("click",()=>
      relocateAddedToAnchor(state.selectedAddition,$("moveAddedAnchorPicker").value));
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
    $("directPublishOpen").addEventListener("click",openDirectPublish);
    $("directGithubConnect").addEventListener("click",connectDirectGithub);
    $("directGithubDisconnect").addEventListener("click",disconnectDirectGithub);
    $("directPublishConfirm").addEventListener("click",publishDirectGithub);
    $("directPublishClose").addEventListener("click",()=>$("directPublishDialog").close());
    $("directPublishSummary").addEventListener("input",updateDirectPublishControls);
    $("directPublishDialog").addEventListener("cancel",event=>{
      if(directGithub.busy)event.preventDefault();
    });
    window.addEventListener("pagehide",()=>{directGithub.token="";directGithub.login="";});
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