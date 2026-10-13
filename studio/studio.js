/* Website Studio — owner-only GitHub editing, no server or embedded credentials. */
(() => {
  "use strict";
  const OWNER = "gmoon-code";
  const REPO = "gmoon-code.github.io";
  const API = "https://api.github.com";
  const SESSION_KEY = "ye-eun-moon-studio-token";
  const ROOT = new URL("../", window.location.href).href;
  const BASE_PAGES = ["index.html","research.html","projects.html","teaching.html","interests.html","about.html","cv.html"];
  const COLOR_NAMES = ["yellow","green","blue","magenta"];
  const $ = id => document.getElementById(id);
  const state = {
    token:null,connected:false,busy:false,currentPath:null,selected:null,
    manifest:null,manifestSha:null,manifestDirty:false,
    drafts:new Map(),uploads:new Map(),deleted:new Map(),
    tab:"content",remember:false,editingInline:false,toastTimer:null
  };
  const colorMap = {yellow:"#F5E6A8",green:"#CEE5C1",blue:"#C8DDF1",magenta:"#EACBE3"};

  const esc = value => String(value).replace(/[&<>"']/g, character => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[character]);
  const slugify = value => String(value).toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"").slice(0,70);
  const docOf = () => $("previewFrame").contentDocument;
  const activeDraft = () => state.drafts.get(state.currentPath);
  function toast(message, error=false) {
    const el=$("toast"); el.textContent=message; el.hidden=false;
    el.style.background=error?"#813e3a":"#26383b";
    clearTimeout(state.toastTimer);
    state.toastTimer=setTimeout(()=>{el.hidden=true},6500);
  }
  function setBusy(busy,label) {
    state.busy=busy;
    $("publishBtn").disabled=busy;
    $("connectBtn").disabled=busy;
    if(label) $("saveStatus").textContent=label;
    updateStatus();
  }
  function hasChanges(){
    return state.manifestDirty||state.deleted.size>0||
      [...state.drafts.values()].some(d=>d.dirty);
  }
  function updateStatus(){
    const el=$("saveStatus");
    if(state.busy){el.textContent="Working…";el.className="save-status is-working";return}
    const dirty=hasChanges();
    el.textContent=dirty?"Unpublished changes":"Everything published";
    el.className="save-status"+(dirty?" is-dirty":"");
    $("publishBtn").disabled=!dirty;
    const d=activeDraft();
    $("undoBtn").disabled=!(d&&d.undo.length);
    $("redoBtn").disabled=!(d&&d.redo.length);
  }
  function errorDescription(error) {
    const msg=(error&&error.message)||String(error);
    return msg.length>290?msg.slice(0,287)+"…":msg;
  }
  async function github(path, options={}){
    if(!state.token) throw Error("Please connect to GitHub first.");
    const headers={
      "Accept":"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28",
      "Authorization":"Bearer "+state.token
    };
    if(options.body!==undefined)headers["Content-Type"]="application/json";
    let response;
    try {
      response=await fetch(API+path,{
        method:options.method||"GET",
        headers,
        body:options.body===undefined?undefined:JSON.stringify(options.body),
        cache:"no-store",
        referrerPolicy:"no-referrer"
      });
    }catch(e){throw Error("Could not reach GitHub. Check your connection and try again.")}
    let payload=null;
    try{payload=await response.json()}catch(e){}
    if(!response.ok){
      const message=(payload&&payload.message)||("HTTP "+response.status);
      if(response.status===401)throw Error("GitHub did not accept the token. Check that it has not expired.");
      if(response.status===403)throw Error("GitHub denied permission. Check the token's repository access and Contents permission.");
      throw Error(message+" ("+response.status+")");
    }
    return payload;
  }
  function encodeText(str){
    const bytes=new TextEncoder().encode(str); let raw="";
    for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(raw);
  }
  function decodeText(base64){
    const raw=atob(String(base64||"").replace(/\s/g,""));
    const bytes=Uint8Array.from(raw,character=>character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function ghFilePath(path){return "/repos/"+OWNER+"/"+REPO+"/contents/"+path.split("/").map(encodeURIComponent).join("/")}
  async function fetchFile(path){
    return github(ghFilePath(path));
  }
  async function writeFile(path,content,sha,message){
    let found=null;
    try{found=await fetchFile(path)}
    catch(error){
      if(!String(error.message).includes("(404)"))throw error;
    }
    if(sha&&(!found||found.sha!==sha)){
      throw Error(path+" was changed elsewhere after you opened it. Your draft is still here. Copy any important new writing before reloading this page.");
    }
    if(!sha&&found)throw Error(path+" already exists. Please choose a different page name.");
    const body={message,content:encodeText(content)};
    if(sha)body.sha=sha;
    return github(ghFilePath(path),{method:"PUT",body});
  }
  async function removeFile(path,sha){
    const found=await fetchFile(path);
    if(found.sha!==sha)throw Error(path+" has changed elsewhere and cannot safely be deleted.");
    return github(ghFilePath(path),{method:"DELETE",body:{message:"Remove page "+path+" using Website Studio",sha}});
  }
  async function loginWithToken(value,remember){
    if(!value.trim())throw Error("Please paste your GitHub token.");
    state.token=value.trim();
    const user=await github("/user");
    if(!user||String(user.login).toLowerCase()!==OWNER){
      state.token=null;
      throw Error("This studio accepts only the GitHub account "+OWNER+".");
    }
    const details=await github("/repos/"+OWNER+"/"+REPO);
    if(!details.permissions||!details.permissions.push){
      state.token=null;
      throw Error("This token does not have write access to the website repository.");
    }
    state.remember=remember;
    if(remember)sessionStorage.setItem(SESSION_KEY,state.token);
    else sessionStorage.removeItem(SESSION_KEY);
    const file=await fetchFile("studio/pages.json");
    const manifest=JSON.parse(decodeText(file.content));
    if(!manifest||!Array.isArray(manifest.pages))throw Error("The studio page list is invalid.");
    state.manifest=manifest;
    state.manifestSha=file.sha;
    state.connected=true;
    $("tokenInput").value="";
    $("loginView").hidden=true;
    $("workspace").hidden=false;
    renderPages();
    setupParentChoices();
    await switchPage("index.html");
    toast("Connected as "+OWNER+". Your edits stay private until you publish.");
  }
  function showLoginError(message){
    const el=$("loginError"); el.hidden=false; el.textContent=message;
  }
  function clearLoginError(){$("loginError").hidden=true;$("loginError").textContent=""}
  async function signIn(event){
    event.preventDefault();
    clearLoginError();
    $("connectBtn").disabled=true;
    try{await loginWithToken($("tokenInput").value,$("rememberTab").checked)}
    catch(error){showLoginError(errorDescription(error));state.token=null;state.connected=false;sessionStorage.removeItem(SESSION_KEY)}
    finally{$("connectBtn").disabled=false}
  }
  function logout(){
    if(hasChanges()&&!confirm("Your unpublished edits will be lost if you sign out. Continue?"))return;
    sessionStorage.removeItem(SESSION_KEY);
    state.token=null;state.connected=false;state.currentPath=null;
    state.drafts.clear();state.uploads.clear();state.deleted.clear();
    state.manifest=null;state.manifestDirty=false;state.selected=null;
    $("workspace").hidden=true;$("loginView").hidden=false;
    $("previewFrame").removeAttribute("srcdoc");
    clearLoginError();
    toast("Signed out. Your GitHub token has been cleared from this tab.");
  }
  function nameFor(path){
    const page=state.manifest.pages.find(p=>p.path===path);
    return page?page.title:path;
  }
  function toneForPage(path){
    const p=state.manifest.pages.find(q=>q.path===path);
    if(p&&p.accent)return p.accent;
    if(path==="index.html"||path==="interests.html")return "yellow";
    if(path==="research.html"||path.startsWith("research-")||path==="about.html")return "green";
    if(path==="projects.html"||path==="cv.html"||path.includes("studio.html")||path==="story-method.html")return "blue";
    return "magenta";
  }
  function renderPages(){
    if(!state.manifest)return;
    const container=$("pageList");container.replaceChildren();
    let group="";
    for(const item of state.manifest.pages){
      if(item.group!==group){
        group=item.group||"Other";
        const label=document.createElement("h3");label.textContent=group;container.appendChild(label);
      }
      const button=document.createElement("button");button.type="button";button.className="page-item";
      if(item.path===state.currentPath)button.classList.add("is-active");
      button.setAttribute("role","listitem");
      const dot=document.createElement("span");dot.className="tone-dot";dot.style.background=colorMap[toneForPage(item.path)]||colorMap.yellow;
      const name=document.createElement("span");name.textContent=item.title+(state.drafts.get(item.path)?.dirty?" •":"");
      button.append(dot,name);
      button.addEventListener("click",()=>{switchPage(item.path).catch(e=>toast(errorDescription(e),true))});
      container.appendChild(button);
    }
  }
  function setupParentChoices(){
    const select=$("pageParent");select.replaceChildren();
    select.add(new Option("Nowhere yet (I will add a link myself)",""));
    for(const page of state.manifest.pages){
      if(page.path.startsWith("studio/"))continue;
      select.add(new Option(page.title,page.path));
    }
  }
  async function ensureDraft(path){
    if(state.drafts.has(path))return state.drafts.get(path);
    const file=await fetchFile(path);
    const html=decodeText(file.content);
    const draft={html,savedHtml:html,sha:file.sha,isNew:false,dirty:false,undo:[],redo:[]};
    state.drafts.set(path,draft);
    return draft;
  }
  function withPreviewBase(html){
    return html.replace(/<head([^>]*)>/i,(match)=>{
      return match+'<base data-studio-base href="'+esc(ROOT)+'">';
    });
  }
  function cleanMarkup(doc){
    const clone=doc.documentElement.cloneNode(true);
    const base=clone.querySelector("base[data-studio-base]");if(base)base.remove();
    const overlay=clone.querySelector("#studio-preview-overlays");if(overlay)overlay.remove();
    clone.querySelectorAll("[data-studio-selected]").forEach(node=>node.removeAttribute("data-studio-selected"));
    clone.querySelectorAll("[contenteditable]").forEach(node=>node.removeAttribute("contenteditable"));
    clone.querySelectorAll("[draggable]").forEach(node=>node.removeAttribute("draggable"));
    return "<!doctype html>\n"+clone.outerHTML+"\n";
  }
  function documentMarkup(){
    const doc=docOf();
    return doc&&doc.documentElement?cleanMarkup(doc):null;
  }
  function syncCurrent(){
    const draft=activeDraft();
    const html=documentMarkup();
    if(!draft||!html)return;
    draft.html=html;
    draft.dirty= draft.isNew||draft.html!==draft.savedHtml;
    updateStatus();renderPages();
  }
  function remember(){
    const draft=activeDraft();if(!draft)return;
    const html=documentMarkup();
    if(!html)return;
    if(draft.undo[draft.undo.length-1]!==html)draft.undo.push(html);
    if(draft.undo.length>45)draft.undo.shift();
    draft.redo.length=0;
    updateStatus();
  }
  function mutate(callback){
    if(!state.selected&&!docOf())return;
    remember();callback();syncCurrent();renderSections();updateInspectorFields();
  }
  async function switchPage(path){
    if(!state.connected||state.busy||!state.manifest.pages.some(p=>p.path===path))return;
    if(state.currentPath===path)return;
    if(state.currentPath)syncCurrent();
    $("loadingPreview").hidden=false;
    $("currentPageLabel").textContent=nameFor(path);
    const draft=await ensureDraft(path);
    state.currentPath=path;
    state.selected=null;
    renderPages();updateStatus();
    $("previewFrame").srcdoc=withPreviewBase(draft.html);
  }
  function addOverlayStyle(doc){
    const style=doc.createElement("style");
    style.id="studio-preview-overlays";
    style.textContent=[
      "[data-studio-selected]{outline:2px solid #356f85!important;outline-offset:3px!important;}",
      "[data-studio-selected]:hover{cursor:text;}",
      "main section,main article,main img,main p,main h1,main h2,main h3,main a{scroll-margin-top:16px;}",
      "main a{cursor:pointer;}",
      "main *:focus-visible{outline:2px dashed #356f85;}",
      ".studio-columns{display:grid;gap:18px;grid-template-columns:repeat(var(--studio-cols,2),minmax(0,1fr))}",
      "@media(max-width:700px){.studio-columns{grid-template-columns:1fr!important}}",
      ".studio-gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}",
      ".studio-gallery img{max-width:100%}",
      "@media(max-width:700px){.studio-gallery{grid-template-columns:1fr}}"
    ].join("\n");
    doc.head.appendChild(style);
  }
  function candidateFor(target){
    if(!(target instanceof docOf().defaultView.Element))return null;
    const main=docOf().querySelector("main");if(!main||!main.contains(target))return null;
    const choices="img,figcaption,a,h1,h2,h3,h4,h5,h6,p,li,blockquote,figure,article,section,.question,.list-row,.reading,.grid-2,.grid-3,.studio-columns,.studio-gallery";
    return target.closest(choices)||target.closest("main > section");
  }
  function onPreviewLoad(){
    const doc=docOf();
    $("loadingPreview").hidden=true;
    if(!doc||!doc.querySelector("main")){toast("This page does not have an editable main area.",true);return}
    addOverlayStyle(doc);
    doc.addEventListener("click",event=>{
      if(event.target.closest("main a"))event.preventDefault();
      const node=candidateFor(event.target);
      if(!node)return;
      event.preventDefault();event.stopPropagation();
      selectElement(node);
    },true);
    doc.addEventListener("dblclick",event=>{
      const target=candidateFor(event.target);
      if(!target)return;
      if(!/^(H[1-6]|P|SPAN|FIGCAPTION|LI|A|BLOCKQUOTE)$/.test(target.tagName))return;
      selectElement(target);remember();
      state.editingInline=true;
      target.setAttribute("contenteditable","true");
      target.focus();
      target.addEventListener("blur",()=>{
        target.removeAttribute("contenteditable");
        state.editingInline=false;
        syncCurrent();updateInspectorFields();
      },{once:true});
    },true);
    doc.addEventListener("paste",event=>{
      const node=event.target;
      if(!node.closest("[contenteditable=true]"))return;
      event.preventDefault();
      const text=event.clipboardData.getData("text/plain");
      doc.execCommand("insertText",false,text);
    });
    doc.addEventListener("keydown",event=>{
      if(event.ctrlKey||event.metaKey){
        if(event.key.toLowerCase()==="s"){event.preventDefault();publish().catch(e=>toast(errorDescription(e),true))}
      }
    });
    const draft=activeDraft();
    if(draft&&!draft.canonicalSet){
      draft.savedHtml=cleanMarkup(doc);
      draft.html=draft.savedHtml;
      draft.canonicalSet=true;
    }
    state.selected=null;
    $("inspectorContent").hidden=true;
    $("inspectorEmpty").hidden=false;
    $("selectedKind").textContent="Nothing selected";
    renderSections();updateStatus();
  }
  function selectElement(node,scroll=false){
    if(!node||!docOf()||!docOf().contains(node))return;
    if(state.selected)state.selected.removeAttribute("data-studio-selected");
    state.selected=node;node.setAttribute("data-studio-selected","");
    $("inspectorEmpty").hidden=true;$("inspectorContent").hidden=false;
    $("selectedKind").textContent=labelForNode(node);
    updateInspectorFields();renderSections();
    if(scroll)node.scrollIntoView({behavior:"smooth",block:"center"});
  }
  function labelForNode(node){
    if(!node)return "Nothing selected";
    if(node.tagName==="SECTION")return "Section";
    if(node.tagName==="ARTICLE")return "Card / article";
    if(node.tagName==="IMG")return "Image";
    if(node.tagName==="A")return "Link";
    if(node.tagName==="FIGURE")return "Photo and caption";
    if(/^H[1-6]$/.test(node.tagName))return "Heading";
    if(node.tagName==="P")return "Paragraph";
    return "Page element";
  }
  function renderSections(){
    const list=$("sectionList");list.replaceChildren();
    const doc=docOf();if(!doc)return;
    const sections=[...doc.querySelectorAll("main > section")];
    sections.forEach((section,i)=>{
      const title=section.querySelector("h1,h2,h3")?.textContent?.trim()||"Section "+(i+1);
      const button=document.createElement("button");button.type="button";button.className="section-item";
      if(state.selected&&(section===state.selected||section.contains(state.selected)))button.classList.add("is-active");
      const n=document.createElement("span");n.textContent=String(i+1).padStart(2,"0");n.className="kind-label";
      const name=document.createElement("span");name.textContent=title;
      button.append(n,name);
      button.addEventListener("click",()=>selectElement(section,true));
      list.appendChild(button);
    });
  }
  function setTab(name){
    state.tab=name;
    for(const button of document.querySelectorAll("[data-tab]")){
      const active=button.dataset.tab===name;
      button.classList.toggle("is-active",active);
      button.setAttribute("aria-selected",active?"true":"false");
    }
    for(const panel of ["content","design","position"])$(panel+"Tab").hidden=panel!==name;
    updateInspectorFields();
  }
  function computedTone(node){
    const tone=COLOR_NAMES.find(x=>node.classList.contains("home-"+x));
    return tone||"default";
  }
  function parseMeasure(value){
    const match=String(value||"").trim().match(/^(-?\d+(?:\.\d+)?)(px|%)$/);
    return match?{value:match[1],unit:match[2]}:{value:"",unit:"px"};
  }
  function updateInspectorFields(){
    const el=state.selected;
    if(!el)return;
    const textAllowed=/^(H[1-6]|P|SPAN|FIGCAPTION|LI|A|BLOCKQUOTE)$/.test(el.tagName);
    const nestedLink=textAllowed&&el.tagName!=="A"&&!!el.querySelector("a,button,img");
    $("textEditBox").hidden=!textAllowed;
    $("elementText").disabled=nestedLink;
    $("elementText").value=textAllowed?el.textContent.trim():"";
    $("textEditHelp").textContent=nestedLink?
      "This text contains a link or image. Double-click it in the preview to edit while keeping the link.":
      "Changes appear in the preview as you type.";
    $("linkEditBox").hidden=el.tagName!=="A";
    if(el.tagName==="A")$("linkDestination").value=el.getAttribute("href")||"";
    $("imageEditBox").hidden=el.tagName!=="IMG";
    if(el.tagName==="IMG"){
      $("imageAlt").value=el.getAttribute("alt")||"";
      $("imageFit").value=el.style.objectFit||"cover";
      $("imageFocus").value=["center","top","bottom","left","right"].includes(el.style.objectPosition)?el.style.objectPosition:"center";
    }
    $("sectionAccent").value=computedTone(el);
    $("sectionAccent").disabled=el.tagName!=="SECTION";
    $("backgroundColor").value=el.style.backgroundColor?colorToHex(el.style.backgroundColor):"";
    $("textColor").value=el.style.color?colorToHex(el.style.color):"";
    $("textAlign").value=el.style.textAlign||"";
    $("columnsCount").disabled=!["SECTION","DIV","ARTICLE"].includes(el.tagName);
    $("columnsCount").value=el.classList.contains("studio-columns")?
      (el.style.getPropertyValue("--studio-cols")||"2"):"";
    const width=parseMeasure(el.style.width);
    $("widthValue").value=width.value;$("widthUnit").value=width.unit;
    $("heightValue").value=parseMeasure(el.style.height).value;
    $("maxWidthValue").value=parseMeasure(el.style.maxWidth).value;
    $("marginTopValue").value=parseMeasure(el.style.marginTop).value;
    $("marginBottomValue").value=parseMeasure(el.style.marginBottom).value;
    $("offsetX").value=parseFloat(el.style.getPropertyValue("--studio-offset-x"))||0;
    $("offsetY").value=parseFloat(el.style.getPropertyValue("--studio-offset-y"))||0;
    const parent=el.parentElement;
    $("moveUpBtn").disabled=!parent||!el.previousElementSibling||el.tagName==="H1";
    $("moveDownBtn").disabled=!parent||!el.nextElementSibling||el.tagName==="H1";
    $("deleteBtn").disabled=el.tagName==="H1";
  }
  function colorToHex(value){
    if(/^#[0-9a-f]{6}$/i.test(value))return value.toUpperCase();
    const match=value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if(!match)return "";
    return "#"+[match[1],match[2],match[3]].map(x=>Number(x).toString(16).padStart(2,"0")).join("").toUpperCase();
  }
  function bindValue(id,property,unit=""){
    $(id).addEventListener("change",()=>{
      const el=state.selected;if(!el)return;
      const raw=$(id).value;
      mutate(()=>{el.style[property]=raw===""?"":raw+unit});
    });
  }
  function bindSelect(id,callback){
    $(id).addEventListener("change",()=>{
      if(!state.selected)return;
      const value=$(id).value;
      mutate(()=>callback(state.selected,value));
    });
  }
  function safeUrl(value){
    const url=value.trim();
    if(!url)return "#";
    if(/^(?:https?:\/\/|mailto:|#|\/(?!\/)|[a-z0-9][a-z0-9-]*\.html(?:#[\w-]+)?)$/i.test(url))return url;
    throw Error("Use a website link, an email link, or a page such as research.html.");
  }
  function bindInspector(){
    $("elementText").addEventListener("focus",()=>{if(state.selected)remember()});
    $("elementText").addEventListener("input",()=>{
      const node=state.selected;
      if(!node||$("elementText").disabled)return;
      node.textContent=$("elementText").value;syncCurrent();renderSections();
    });
    $("linkDestination").addEventListener("change",()=>{
      if(!state.selected||state.selected.tagName!=="A")return;
      try{
        const val=safeUrl($("linkDestination").value);
        mutate(()=>state.selected.setAttribute("href",val));
      }catch(error){toast(errorDescription(error),true);updateInspectorFields()}
    });
    $("imageAlt").addEventListener("change",()=>{
      if(state.selected?.tagName!=="IMG")return;
      mutate(()=>state.selected.alt=$("imageAlt").value.trim());
    });
    bindSelect("imageFit",(el,val)=>{if(el.tagName==="IMG")el.style.objectFit=val});
    bindSelect("imageFocus",(el,val)=>{if(el.tagName==="IMG")el.style.objectPosition=val});
    bindSelect("sectionAccent",(el,val)=>{
      if(el.tagName!=="SECTION")return;
      el.classList.remove("home-yellow","home-green","home-blue","home-magenta");
      if(val!=="default"){el.classList.add("home-color-block","home-"+val)}
      else el.classList.remove("home-color-block");
    });
    bindSelect("backgroundColor",(el,val)=>el.style.backgroundColor=val);
    bindSelect("textColor",(el,val)=>el.style.color=val);
    bindSelect("textAlign",(el,val)=>el.style.textAlign=val);
    bindSelect("columnsCount",(el,val)=>{
      if(!["SECTION","DIV","ARTICLE"].includes(el.tagName))return;
      if(!val){el.classList.remove("studio-columns");el.style.removeProperty("--studio-cols");el.style.display="";el.style.gridTemplateColumns=""}
      else{el.classList.add("studio-columns");el.style.setProperty("--studio-cols",val);el.style.display="grid";el.style.gridTemplateColumns="repeat("+val+", minmax(0, 1fr))";el.style.gap="18px"}
    });
    $("widthValue").addEventListener("change",()=>{
      if(!state.selected)return;
      mutate(()=>state.selected.style.width=$("widthValue").value?$("widthValue").value+$("widthUnit").value:"");
    });
    $("widthUnit").addEventListener("change",()=>{
      if(!state.selected||!$("widthValue").value)return;
      mutate(()=>state.selected.style.width=$("widthValue").value+$("widthUnit").value);
    });
    bindValue("heightValue","height","px");
    bindValue("maxWidthValue","maxWidth","px");
    bindValue("marginTopValue","marginTop","px");
    bindValue("marginBottomValue","marginBottom","px");
    function setOffset(){
      if(!state.selected)return;
      const x=Number($("offsetX").value)||0,y=Number($("offsetY").value)||0;
      mutate(()=>{
        state.selected.style.setProperty("--studio-offset-x",x+"px");
        state.selected.style.setProperty("--studio-offset-y",y+"px");
        state.selected.style.transform="translate(var(--studio-offset-x),var(--studio-offset-y))";
      });
    }
    $("offsetX").addEventListener("change",setOffset);
    $("offsetY").addEventListener("change",setOffset);
    $("resetLayoutBtn").addEventListener("click",()=>{
      if(!state.selected)return;
      mutate(()=>{
        const s=state.selected.style;
        for(const property of ["width","height","maxWidth","marginTop","marginBottom","transform"])s[property]="";
        s.removeProperty("--studio-offset-x");s.removeProperty("--studio-offset-y");
      });
    });
    $("moveUpBtn").addEventListener("click",()=>moveElement(-1));
    $("moveDownBtn").addEventListener("click",()=>moveElement(1));
    $("duplicateBtn").addEventListener("click",duplicateElement);
    $("deleteBtn").addEventListener("click",deleteElement);
    $("replaceImageBtn").addEventListener("click",()=>openImagePicker(true));
    for(const button of document.querySelectorAll("[data-tab]")){
      button.addEventListener("click",()=>setTab(button.dataset.tab));
    }
  }
  function moveElement(direction){
    const el=state.selected;if(!el||el.tagName==="H1")return;
    const sibling=direction<0?el.previousElementSibling:el.nextElementSibling;
    if(!sibling){toast("There is nowhere further to move this item.");return}
    mutate(()=>{if(direction<0)sibling.before(el);else sibling.after(el)});
    selectElement(el,true);
  }
  function duplicateElement(){
    const el=state.selected;if(!el)return;
    if(el.tagName==="H1"){toast("The page title is unique. Add another heading using the Add menu.");return}
    let clone;
    mutate(()=>{
      clone=el.cloneNode(true);
      clone.removeAttribute("data-studio-selected");
      el.after(clone);
    });
    selectElement(clone,true);
  }
  function deleteElement(){
    const el=state.selected;if(!el||el.tagName==="H1")return;
    const description=labelForNode(el).toLowerCase();
    if(!confirm("Remove this "+description+" from the page? You can still undo before publishing."))return;
    remember();el.remove();state.selected=null;
    syncCurrent();renderSections();
    $("inspectorContent").hidden=true;$("inspectorEmpty").hidden=false;
    $("selectedKind").textContent="Nothing selected";
  }
  function makeBlock(doc,type){
    const wrapper=doc.createElement("div");
    const snippets={
      section:'<section class="section"><div class="section-head"><h2>New section</h2></div><div class="reading"><p>Start writing here.</p></div></section>',
      paragraph:'<p>Write your text here.</p>',
      heading:'<h2>New heading</h2>',
      card:'<article class="paper-card"><h3>Card title</h3><p>Add a useful description here.</p></article>',
      columns:'<div class="studio-columns" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;--studio-cols:2"><div class="paper-card"><p>Left column</p></div><div class="paper-card"><p>Right column</p></div></div>',
      gallery:'<div class="studio-gallery"><figure><figcaption>Add an image here</figcaption></figure><figure><figcaption>Add another image</figcaption></figure></div>',
      button:'<a class="control" href="index.html">Link text</a>',
      divider:'<hr style="border:0;border-top:1px solid #d8d8d8;margin:22px 0">',
      spacer:'<div aria-hidden="true" style="height:28px"></div>'
    };
    wrapper.innerHTML=snippets[type]||snippets.paragraph;
    return wrapper.firstElementChild;
  }
  function insertBlock(type){
    if(type==="image"){openImagePicker(false);return}
    const doc=docOf(),main=doc?.querySelector("main");
    if(!doc||!main)return;
    const node=makeBlock(doc,type);
    remember();
    if(type==="section"){
      const chosen=state.selected?.closest("section");
      const top=chosen&&chosen.parentElement===main?chosen:null;
      if(top)top.after(node);else main.appendChild(node);
    }else{
      const target=state.selected;
      if(target&&main.contains(target)){
        if(target.tagName==="SECTION"){
          const container=target.querySelector(".reading,.grid-2,.studio-columns,.media-shelf")||target;
          container.appendChild(node);
        }else if(target.parentElement)target.after(node);
        else main.appendChild(node);
      }else{
        const section=main.querySelector("section:last-of-type")||main;
        section.appendChild(node);
      }
    }
    syncCurrent();selectElement(node,true);
    toast("Added. Click it to edit its text and appearance.");
  }
  function openImagePicker(replace){
    const selected=state.selected;
    if(replace&&selected?.tagName!=="IMG"){toast("Select an image first.",true);return}
    $("imagePicker").dataset.replace=replace?"yes":"no";
    $("imagePicker").value="";
    $("imagePicker").click();
  }
  async function asDataURL(file){
    if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw Error("Please use a JPG, PNG, WebP, or GIF image.");
    if(file.size>18*1024*1024)throw Error("This image is too large. Please choose one under 18 MB.");
    let blob=file,ext=(file.type.split("/")[1]==="jpeg"?"jpg":file.type.split("/")[1]);
    if(file.type!=="image/gif"){
      const bitmap=await createImageBitmap(file);
      if(Math.max(bitmap.width,bitmap.height)>2000||file.size>3*1024*1024){
        const scale=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(bitmap.width*scale));
        canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
        const mime=file.type==="image/png"?"image/png":"image/jpeg";
        const output=await new Promise(resolve=>canvas.toBlob(resolve,mime,.88));
        if(output){blob=output;ext=mime==="image/png"?"png":"jpg"}
      }
      bitmap.close?.();
    }
    const dataUrl=await new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(Error("Could not read this image."));
      reader.readAsDataURL(blob);
    });
    return {dataUrl,base64:dataUrl.split(",")[1],extension:ext};
  }
  async function onImagePicked(event){
    const file=event.target.files&&event.target.files[0];if(!file)return;
    try{
      const prepared=await asDataURL(file);
      const name=slugify(file.name.replace(/\.[^.]+$/,""))||"image";
      const path="assets/photo-"+Date.now()+"-"+name+"."+prepared.extension;
      state.uploads.set(path,{...prepared,path,uploaded:false});
      const doc=docOf();if(!doc)return;
      const replace=event.target.dataset.replace==="yes";
      remember();
      let img;
      if(replace&&state.selected?.tagName==="IMG"){
        img=state.selected;
      }else{
        const figure=doc.createElement("figure");
        figure.style.margin="12px 0";
        img=doc.createElement("img");
        img.style.maxWidth="100%";img.style.height="auto";
        figure.appendChild(img);
        const caption=doc.createElement("figcaption");
        caption.textContent="Photo caption (optional)";
        caption.style.color="#575757";caption.style.fontSize="13px";
        figure.appendChild(caption);
        const target=state.selected;
        if(target?.tagName==="SECTION")target.appendChild(figure);
        else if(target?.parentElement)target.after(figure);
        else doc.querySelector("main").appendChild(figure);
      }
      img.src=prepared.dataUrl;
      img.dataset.studioAsset=path;
      img.alt=img.alt||"Describe this image";
      syncCurrent();selectElement(img,true);
      toast("Photo added to your draft. It will upload when you publish.");
    }catch(error){toast(errorDescription(error),true)}
  }
  function changedReferences(){
    const all=[...state.drafts.values()].map(x=>x.html).join("\n");
    return [...state.uploads.values()].filter(x=>all.includes(x.dataUrl)||all.includes(x.path));
  }
  async function publish(){
    if(!state.connected||state.busy)return;
    syncCurrent();
    if(!hasChanges()){toast("No unpublished changes.");return}
    state.busy=true;updateStatus();
    try{
      for(const photo of changedReferences()){
        if(photo.uploaded)continue;
        $("saveStatus").textContent="Uploading image…";
        const response=await github(ghFilePath(photo.path),{
          method:"PUT",body:{message:"Add photo using Website Studio",content:photo.base64}
        });
        photo.uploaded=!!response.content?.sha;
        if(!photo.uploaded)throw Error("GitHub did not confirm the image upload.");
      }
      for(const [path,draft] of state.drafts){
        if(!draft.dirty)continue;
        $("saveStatus").textContent="Publishing "+nameFor(path)+"…";
        let html=draft.html;
        for(const photo of state.uploads.values()){
          if(photo.uploaded){
            html=html.split(photo.dataUrl).join(photo.path);
          }
        }
        html=html.replace(/\sdata-studio-asset="[^"]*"/g,"");
        const result=await writeFile(path,html,draft.sha,"Update "+nameFor(path)+" using Website Studio");
        draft.sha=result.content?.sha||null;
        draft.savedHtml=html;draft.html=html;draft.dirty=false;draft.isNew=false;
      }
      for(const [path,sha] of state.deleted){
        $("saveStatus").textContent="Removing "+path+"…";
        await removeFile(path,sha);
        state.deleted.delete(path);
      }
      if(state.manifestDirty){
        $("saveStatus").textContent="Updating page list…";
        const content=JSON.stringify(state.manifest,null,2)+"\n";
        const response=await writeFile("studio/pages.json",content,state.manifestSha,"Update Website Studio page list");
        state.manifestSha=response.content?.sha||null;
        state.manifestDirty=false;
      }
      const current=state.currentPath;
      if(current&&state.drafts.has(current)){
        const d=activeDraft();
        if(d&&changedReferences().length){
          d.canonicalSet=false;
          $("previewFrame").srcdoc=withPreviewBase(d.html);
        }
      }
      state.uploads.clear();
      toast("Published to GitHub. The public website may take a few minutes to refresh.");
    }catch(error){
      toast("Publishing stopped: "+errorDescription(error),true);
    }finally{
      state.busy=false;updateStatus();renderPages();
    }
  }
  function undo(){
    const d=activeDraft();if(!d?.undo.length)return;
    const current=documentMarkup();
    if(current)d.redo.push(current);
    d.html=d.undo.pop();
    d.dirty=d.isNew||d.html!==d.savedHtml;
    state.selected=null;$("previewFrame").srcdoc=withPreviewBase(d.html);
    updateStatus();renderPages();
  }
  function redo(){
    const d=activeDraft();if(!d?.redo.length)return;
    const current=documentMarkup();
    if(current)d.undo.push(current);
    d.html=d.redo.pop();
    d.dirty=d.isNew||d.html!==d.savedHtml;
    state.selected=null;$("previewFrame").srcdoc=withPreviewBase(d.html);
    updateStatus();renderPages();
  }
  function openPageDialog(){
    $("pageForm").reset();
    $("pageSlug").value="";
    setupParentChoices();
    $("pageParent").value=state.currentPath||"";
    $("pageColor").value=toneForPage(state.currentPath||"index.html");
    $("pageDialog").showModal();$("pageName").focus();
  }
  async function createPage(event){
    event.preventDefault();
    if(!state.connected)return;
    const title=$("pageName").value.trim();
    const slug=$("pageSlug").value.trim();
    const accent=$("pageColor").value;
    const parent=$("pageParent").value;
    if(!title||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){toast("Please enter a page name and a simple page address.",true);return}
    const path=slug+".html";
    if(state.manifest.pages.some(p=>p.path===path)||BASE_PAGES.includes(path)){
      toast("A page with this address already exists.",true);return;
    }
    try{
      const base=await ensureDraft("about.html");
      const doc=new DOMParser().parseFromString(base.html,"text/html");
      doc.title=title+" | Ye Eun Moon";
      doc.querySelector('meta[name="description"]')?.setAttribute("content",title+" | Ye Eun Moon");
      doc.querySelectorAll('nav a[aria-current="page"]').forEach(a=>a.removeAttribute("aria-current"));
      doc.body.className="theme-"+accent;
      doc.querySelector("main").innerHTML=
        '<section class="page-hero single"><div class="hero-copy"><h1>'+esc(title)+'</h1>'+
        '<p>Write a short introduction to this page.</p></div></section>'+
        '<section class="section"><div class="section-head"><h2>First section</h2></div>'+
        '<div class="reading"><p>Start writing here.</p></div></section>';
      const html="<!doctype html>\n"+doc.documentElement.outerHTML+"\n";
      state.drafts.set(path,{html,savedHtml:"",sha:null,isNew:true,dirty:true,undo:[],redo:[],canonicalSet:false});
      state.manifest.pages.push({path,title,group:parent?nameFor(parent):"Other",accent,locked:false});
      state.manifestDirty=true;
      if(parent){
        const original=await ensureDraft(parent);
        const pdoc=new DOMParser().parseFromString(original.html,"text/html");
        const section=pdoc.createElement("section");
        section.className="section";
        const header=pdoc.createElement("div");header.className="section-head";
        header.innerHTML="<h2>More to explore</h2>";
        section.appendChild(header);
        const box=pdoc.createElement("div");box.className="reading";
        const link=pdoc.createElement("a");link.className="inline-link";
        link.href=path;link.textContent=title+" →";
        box.appendChild(link);section.appendChild(box);
        pdoc.querySelector("main").appendChild(section);
        original.html="<!doctype html>\n"+pdoc.documentElement.outerHTML+"\n";
        original.dirty=true;
      }
      $("pageDialog").close();
      state.currentPath=null;
      renderPages();setupParentChoices();
      await switchPage(path);
      toast("Page created as a draft. Add content, then publish when ready.");
    }catch(error){toast(errorDescription(error),true)}
  }
  function openPageSettings(){
    const path=state.currentPath;if(!path)return;
    const page=state.manifest.pages.find(p=>p.path===path);
    $("settingsTitle").value=page.title;
    $("settingsAccent").value=toneForPage(path);
    $("settingsPath").textContent="Website address: /"+path;
    $("deletePageBtn").hidden=page.locked!==false;
    $("pageSettingsDialog").showModal();
  }
  function savePageSettings(event){
    event.preventDefault();
    const draft=activeDraft(),path=state.currentPath;
    const page=state.manifest.pages.find(p=>p.path===path);
    if(!draft||!page)return;
    const name=$("settingsTitle").value.trim(),accent=$("settingsAccent").value;
    if(!name)return;
    remember();
    const doc=docOf();
    doc.title=name+" | Ye Eun Moon";
    doc.querySelector("main h1").textContent=name;
    doc.body.className="theme-"+accent;
    page.title=name;page.accent=accent;state.manifestDirty=true;
    syncCurrent();renderPages();setupParentChoices();renderSections();
    $("currentPageLabel").textContent=name;
    $("pageSettingsDialog").close();
    toast("Page settings updated in the draft.");
  }
  async function deletePage(){
    const path=state.currentPath,page=state.manifest.pages.find(x=>x.path===path);
    if(!page||page.locked!==false)return;
    if(!confirm("Delete "+page.title+"? This also removes the page from the studio list. Other pages may still link to it."))return;
    const draft=activeDraft();
    if(!draft.isNew&&draft.sha)state.deleted.set(path,draft.sha);
    state.manifest.pages=state.manifest.pages.filter(p=>p.path!==path);
    state.manifestDirty=true;state.drafts.delete(path);
    $("pageSettingsDialog").close();state.currentPath=null;
    renderPages();setupParentChoices();
    await switchPage("index.html");
    toast("Page marked for removal. Publish when ready.");
  }
  function wireEvents(){
    $("loginForm").addEventListener("submit",signIn);
    $("logoutBtn").addEventListener("click",logout);
    $("publishBtn").addEventListener("click",publish);
    $("previewFrame").addEventListener("load",onPreviewLoad);
    $("undoBtn").addEventListener("click",undo);
    $("redoBtn").addEventListener("click",redo);
    $("newPageBtn").addEventListener("click",openPageDialog);
    $("newSectionBtn").addEventListener("click",()=>insertBlock("section"));
    $("insertBtn").addEventListener("click",()=>insertBlock($("insertType").value));
    $("imagePicker").addEventListener("change",onImagePicked);
    $("pageName").addEventListener("input",()=>{
      if(!$("pageSlug").dataset.manuallyEdited)$("pageSlug").value=slugify($("pageName").value);
    });
    $("pageSlug").addEventListener("input",()=>{$("pageSlug").dataset.manuallyEdited="yes"});
    $("newPageBtn").addEventListener("click",()=>{delete $("pageSlug").dataset.manuallyEdited});
    $("pageForm").addEventListener("submit",createPage);
    $("cancelPageBtn").addEventListener("click",()=>$("pageDialog").close());
    $("pageSettingsBtn").addEventListener("click",openPageSettings);
    $("pageSettingsForm").addEventListener("submit",savePageSettings);
    $("cancelSettingsBtn").addEventListener("click",()=>$("pageSettingsDialog").close());
    $("deletePageBtn").addEventListener("click",()=>deletePage().catch(e=>toast(errorDescription(e),true)));
    $("helpBtn").addEventListener("click",()=>$("helpDialog").showModal());
    $("closeHelpBtn").addEventListener("click",()=>$("helpDialog").close());
    for(const button of document.querySelectorAll("[data-device]")){
      button.addEventListener("click",()=>{
        const val=button.dataset.device;
        $("previewFrame").className=val==="desktop"?"":"device-"+val;
        document.querySelectorAll("[data-device]").forEach(b=>{
          const active=b===button;b.classList.toggle("is-active",active);
          b.setAttribute("aria-pressed",active?"true":"false");
        });
      });
    }
    bindInspector();
    document.addEventListener("keydown",event=>{
      if(!state.connected||state.busy)return;
      const cmd=event.ctrlKey||event.metaKey;
      if(!cmd)return;
      const target=event.target;
      const typing=target.matches("input,textarea,[contenteditable]");
      if(event.key.toLowerCase()==="s"){event.preventDefault();publish()}
      else if(!typing&&event.key.toLowerCase()==="z"){
        event.preventDefault();if(event.shiftKey)redo();else undo();
      }
    });
    window.addEventListener("beforeunload",event=>{
      if(hasChanges()){
        event.preventDefault();event.returnValue="";
      }
    });
  }
  async function init(){
    wireEvents();updateStatus();
    const saved=sessionStorage.getItem(SESSION_KEY);
    if(saved){
      try{await loginWithToken(saved,true)}
      catch(error){sessionStorage.removeItem(SESSION_KEY);state.token=null;showLoginError("Your saved tab session expired. Please connect again.")}
    }
  }
  init().catch(error=>toast(errorDescription(error),true));
})();
