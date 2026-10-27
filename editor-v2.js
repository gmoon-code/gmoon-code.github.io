/* Academic Editor 2. Independent scene-model editor.
   No legacy editor classes, free layers, layout placeholders or source mutations.
   Imported website pages remain untouched until an explicitly reviewed migration. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const VERSION=2, REPO="gmoon-code/gmoon-code.github.io";
const PAGES=new Set([...$("page").options].map(opt=>opt.value));
const STANDARD_WIDTH=1160, MAX_OBJECTS=350, MIN_W=40, MIN_H=24;
const MAX_GITHUB_PAGE_BYTES=900000; // Keep REST Contents API base64 readable.
const HANDLES=["nw","n","ne","e","se","s","sw","w"];
const NEW_DRAFT="moon-academic-editor-v2:";
let currentPage="index.html";
let scene={version:VERSION,page:currentPage,width:STANDARD_WIDTH,height:1080,objects:[],nextId:1};
let selected=new Set(),activeId=null,history=[],redo=[],zoom=.8,gesture=null,editingId=null,saveTimer=null,loadSerial=0,lastTap=null,pageImages=[];
let canvasClipboard=[],canvasPasteCount=0;
let canvasMarquee=null; // Non-persistent rubber-band selection; no scene changes.
let liveObjectClipboard=null,livePasteCount=0;
let liveAddedMulti=new Set(); // Selected stable IDs for added objects
let liveSourceMulti=new Set(); // Existing source objects selected on the actual webpage
let liveLockImageRatio=true;
let liveSectionPickMode=false; // Editor-only selection behaviour, never published.
let liveCropMode=false; // Selected photo can be panned inside its crop frame.
let liveCropSliderBefore=null,liveCropSliderKey=""; // One undo step per slider drag.
let pictureFxBefore=null; // Coalesce each range-slider gesture into one undo step.
let liveFormatClipboard=null; // Appearance only, never text, sources, geometry or private data.
let liveSectionHover=null;
let workspaceMode="live",liveWidth=1160,liveScale=1,liveManualScale=null,liveSelected=null,liveObserver=null,liveSerial=0;
let liveSuppressClickUntil=0;
const LIVE_DRAFT_KEY="moon-academic-editor-v2:source:";
const LIVE_POSITION_LOCK_KEY="moon-academic-editor-v2:position-lock:";
let livePositionLocks=new Set(); // Local editor preference, never published.
let livePatches=new Map(),liveEditing=null,liveHistory=[],liveRedo=[],liveGesture=null,liveOverlay=null;
let githubTabToken=""; // In-memory only. Never written to storage or page files.
let reconnectImages=[],reconnectForPage="";
const liveGithubSources=new Map();
let liveSourceProvenance="loading"; // verified GitHub main or fallback deployed HTML
let liveDisplayedSourceHtml=null; // Exact original HTML used to build the open editor
let pendingLiveViewRestore=null; // Preserve long-page scroll and selection across undo/redo
const copy=data=>JSON.parse(JSON.stringify(data));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const number=v=>Number.isFinite(Number(v))?Number(v):0;
const lookup=id=>scene.objects.find(o=>o.id===id);
const isTextField=node=>!!node?.closest?.("input,textarea,select,[contenteditable=true]");
function status(message){$("status").textContent=message;}
function validateScene(value,page){
  if(!value||value.version!==VERSION||value.page!==page||!Array.isArray(value.objects)
     ||value.objects.length>MAX_OBJECTS||!Number.isFinite(value.width)||value.width<300||value.width>3000
     ||!Number.isFinite(value.height)||value.height<300||value.height>30000)throw Error("Invalid saved canvas");
  const ids=new Set();
  for(const obj of value.objects){
    if(!obj||!["text","image","shape"].includes(obj.type)||!Number.isInteger(obj.id)||ids.has(obj.id))
      throw Error("Invalid object in saved canvas");
    ids.add(obj.id);
    for(const prop of ["x","y","w","h","z"])
      if(!Number.isFinite(obj[prop])||Math.abs(obj[prop])>40000)throw Error("Invalid object dimension");
    if(obj.w<MIN_W||obj.h<MIN_H||obj.w>8000||obj.h>20000||
       typeof obj.name!=="string"||obj.name.length>120)throw Error("Invalid object size");
    if(typeof obj.locked!=="boolean"||typeof obj.hidden!=="boolean"||
      typeof obj.transparent!=="boolean"||
      !Number.isFinite(obj.font)||obj.font<10||obj.font>120||
      typeof obj.family!=="string"||!/^[a-zA-Z0-9_ ,"'.()\-]{1,180}$/.test(obj.family)||
      !/^#[0-9a-f]{6}$/i.test(obj.color)||!/^#[0-9a-f]{6}$/i.test(obj.bg)||
      !["left","center","right"].includes(obj.align)||
      obj.order!==undefined&&(!Number.isInteger(obj.order)||obj.order<0||obj.order>999999)||
      obj.backdrop!==undefined&&typeof obj.backdrop!=="boolean"||
      obj.shapeKind!==undefined&&!["rectangle","ellipse","line"].includes(obj.shapeKind))
      throw Error("Invalid object styling");
    if(obj.type==="image"&&!safeImageSource(obj.src))throw Error("Invalid image reference");
    if(obj.type==="text"&&(typeof obj.text!=="string"||obj.text.length>30000||
      obj.rich!==undefined&&(typeof obj.rich!=="string"||obj.rich.length>70000)||
      obj.tag!==undefined&&!/^(?:h[1-6]|p|li|blockquote|figcaption)$/.test(obj.tag)))
      throw Error("Invalid text content");
  }
  if(!Number.isInteger(value.nextId)||value.nextId<1||value.nextId>999999||
     (ids.size&&value.nextId<=Math.max(...ids)))throw Error("Invalid object counter");
  return copy(value);
}
function safeImageSource(value){
  return typeof value==="string"&&(
    /^assets\/[a-zA-Z0-9_./-]+\.(?:png|jpg|jpeg|webp|svg)$/i.test(value)&&!value.includes("..")&&!value.includes("//")||
    /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/i.test(value)&&value.length<4300000);
}
function safeLink(value){
  if(typeof value!=="string"||value.length>1600)return null;
  const url=value.trim();
  if(!url||/[\u0000-\u001f<>"]/.test(url))return null;
  if(/^https:\/\/[^\s/]+/i.test(url)||/^mailto:[^\s@]+@[^\s@]+$/i.test(url))return url;
  if(url.startsWith("#")&&/^#[a-zA-Z0-9_-]+$/.test(url))return url;
  if(!url.startsWith("/")&&!url.includes("..")&&!url.includes("//")&&
     /^(?:\.\/)?[a-zA-Z0-9_.\/-]+(?:[?#][a-zA-Z0-9_.%&=+#-]*)?$/.test(url))return url;
  return null;
}
function cleanRich(value,prefix=""){
  if(typeof value!=="string"||value.length>70000)return "";
  const template=document.createElement("template");
  template.innerHTML=value;
  const out=document.createElement("div");
  const allowed=new Set(["A","EM","STRONG","B","I","U","S","SMALL","MARK","SUB","SUP","CODE","SPAN","BR"]);
  const blocked=new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","SVG","MATH","TEMPLATE","FORM"]);
  const visit=(node,parent)=>{
    if(node.nodeType===3){parent.append(document.createTextNode(node.nodeValue));return;}
    if(node.nodeType!==1||blocked.has(node.tagName))return;
    // contenteditable commonly represents Enter with DIV or P siblings.
    // Preserve their line boundaries while removing their arbitrary styles.
    const block=node.tagName==="DIV"||node.tagName==="P";
    if(block&&parent.lastChild&&parent.lastChild.nodeName!=="BR")
      parent.append(document.createElement("br"));
    const keep=allowed.has(node.tagName);
    const child=keep?document.createElement(node.tagName.toLowerCase()):parent;
    if(keep){
      if(node.tagName==="A"){
        const link=safeLink(node.getAttribute("href"));
        if(link){
          const relative=!/^(?:https?:|mailto:|#|\/)/i.test(link);
          child.setAttribute("href",relative?prefix+link:link);
          if(/^https?:\/\//i.test(link))child.setAttribute("rel","noopener noreferrer");
        }
      }
      parent.append(child);
    }
    if(node.tagName==="BR")return;
    for(const nested of [...node.childNodes])visit(nested,child);
    if(block&&node.nextSibling&&parent.lastChild?.nodeName!=="BR")
      parent.append(document.createElement("br"));
  };
  for(const node of [...template.content.childNodes])visit(node,out);
  return out.innerHTML;
}
function exportedTag(value){
  return /^h[1-6]$/.test(value||"")?value:
    value==="blockquote"?"blockquote":"p";
}
function save(){
  clearTimeout(saveTimer);
  try{
    localStorage.setItem(NEW_DRAFT+currentPage,JSON.stringify(scene));
    status("Canvas draft saved locally · Public website unchanged");
  }catch{status("Local storage unavailable · Export JSON to keep your draft");}
}
function saveActiveDraft(){
  if(workspaceMode==="live"){
    if(liveEditing)saveLiveText();
    // This button previously saved the *other* workspace's canvas draft.
    // Source edits are normally autosaved; the explicit action confirms the
    // correct page's source draft is persisted.
    storeLiveDraft();
    status("Live-page edits saved in this browser · Use Publish to update the website");
  }else{
    if(editingId!==null)finishTextEdit();
    save();
  }
}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,400);status("Unsaved canvas changes · Website unchanged");}
function refreshUndo(){
  $("undo").disabled=workspaceMode==="live"?!liveHistory.length:!history.length;
  $("redo").disabled=workspaceMode==="live"?!liveRedo.length:!redo.length;
  const editable=workspaceMode==="design"&&
    [...selected].some(id=>{const obj=lookup(id);return obj&&!obj.locked;});
  $("duplicate").disabled=workspaceMode==="live"?
    !liveSelected?.node||LIVE_CONTAINER_SET.has(liveSelected.node.tagName)&&
      !liveSelected.node.hasAttribute("data-moon-v2-added-id"):!editable;
  $("remove").disabled=workspaceMode==="live"?!liveSelected?.node:!editable;
  $("front").disabled=workspaceMode==="live"?!liveSelected?.node:!editable;
  $("back").disabled=workspaceMode==="live"?!liveSelected?.node:!editable;
  $("copyObjects").disabled=workspaceMode!=="design"||!selected.size;
  $("pasteObjects").disabled=workspaceMode!=="design"||!canvasClipboard.length||
    scene.objects.length>=MAX_OBJECTS;
  $("selectAllObjects").disabled=workspaceMode!=="design"||
    !scene.objects.some(obj=>!obj.hidden&&!obj.locked);
  $("liveCopyObject").disabled=workspaceMode!=="live"||!liveSelected?.node;
  $("livePasteObject").disabled=workspaceMode!=="live"||!liveObjectClipboard;
}
function remember(snapshot){
  const before=snapshot||copy(scene);
  history.push(before);
  if(history.length>60)history.shift();
  redo.length=0;refreshUndo();save();
}
function mutate(fn){
  const before=copy(scene);
  fn();
  if(JSON.stringify(before)!==JSON.stringify(scene)){
    remember(before);render();return true;
  }
  return false;
}
function restore(data){
  scene=validateScene(data,currentPage);
  selected.clear();activeId=null;editingId=null;render();
}
function undo(){
  if(workspaceMode==="live"){liveUndoAction();return;}
  if(!history.length)return;
  redo.push(copy(scene));restore(history.pop());refreshUndo();save();
}
function redoAction(){
  if(workspaceMode==="live"){liveUndoAction(true);return;}
  if(!redo.length)return;
  history.push(copy(scene));restore(redo.pop());refreshUndo();save();
}
function makeObject(type,attrs={}){
  const z=scene.objects.reduce((m,o)=>Math.max(o.z,m),0)+1;
  const common={id:scene.nextId++,type,name:type==="text"?"Text":type==="shape"?"Shape":"Image",
    x:60,y:60,w:type==="shape"?230:380,h:type==="text"?90:260,z,
    text:"",rich:"",tag:"p",order:scene.objects.length,shapeKind:"rectangle",
    src:"",alt:"",font:20,family:"Georgia, serif",color:"#1c2622",
    bg:type==="shape"?"#e5f5e7":"#ffffff",transparent:type!=="shape",
    align:"left",locked:false,hidden:false};
  return Object.assign(common,attrs);
}
function pagePoint(event){
  const rect=$("stage").getBoundingClientRect();
  return {x:clamp(Math.round((event.clientX-rect.left)/zoom),0,scene.width-60),
    y:clamp(Math.round((event.clientY-rect.top)/zoom),0,scene.height-40)};
}
async function compactLiveImage(file){
  // Store uploaded photos efficiently within the browser draft and a static
  // GitHub HTML file. WebP keeps transparency, and original files remain
  // untouched on the user's computer.
  if(!("createImageBitmap" in window))
    throw Error("This browser cannot prepare a compact webpage image. Use an existing site image.");
  const bitmap=await createImageBitmap(file);
  try{
    for(const [limit,quality] of [[1400,.8],[1100,.67],[900,.57],[720,.45]]){
      const scale=Math.min(1,limit/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));
      canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const context=canvas.getContext("2d");
      if(!context)throw Error("Image compression is unavailable in this browser.");
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const encoded=canvas.toDataURL("image/webp",quality);
      if(/^data:image\/webp;base64,/.test(encoded)&&encoded.length<=180000)
        return encoded;
    }
    throw Error("Image is too large for safe GitHub page editing. Try a smaller file or use an image from website assets.");
  }finally{bitmap.close?.();}
}
async function insertImageFile(file,position={}){
  if(!file)return;
  const requestedPage=currentPage,requestedMode=workspaceMode;
  if(file.size>3000000||!["image/png","image/jpeg","image/webp"].includes(file.type)){
    status("Choose PNG, JPEG or WebP under 3 MB");return;
  }
  if(requestedMode==="live"){
    try{
      status("Preparing a compact image for the real webpage…");
      const src=await compactLiveImage(file);
      if(currentPage!==requestedPage||workspaceMode!==requestedMode){
        status("Image insertion cancelled because the selected page or mode changed");return;
      }
      addLiveObject("image",{src,alt:file.name.replace(/\.[^.]+$/,"")});
    }catch(error){status("Image was not added · "+error.message);}
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    if(currentPage!==requestedPage||workspaceMode!==requestedMode){
      status("Image insertion cancelled because the page or mode changed");return;
    }
    add("image",{src:String(reader.result),alt:file.name.replace(/\.[^.]+$/,""),
      name:file.name,w:340,h:260,...position});
  };
  reader.onerror=()=>status("Could not read the selected image file");
  reader.readAsDataURL(file);
}
function add(type,attrs={}){
  if(workspaceMode!=="design")setWorkspaceMode("design");
  if(scene.objects.length>=MAX_OBJECTS){status("Maximum canvas object count reached");return;}
  mutate(()=>{
    const offset=scene.objects.length%12*18;
    const obj=makeObject(type,{x:80+offset,y:100+offset,...attrs});
    scene.objects.push(obj);
    selected=new Set([obj.id]);activeId=obj.id;
    scene.height=Math.max(scene.height,obj.y+obj.h+80);
  });
}
function setSelection(ids,active){
  selected=new Set(ids.filter(id=>lookup(id)));
  activeId=selected.has(active)?active:[...selected].at(-1)||null;
  render();
}
function select(id,additive=false){
  if(additive){
    if(selected.has(id))selected.delete(id);else selected.add(id);
    activeId=selected.has(id)?id:[...selected].at(-1)||null;
  }else{
    selected=new Set(id===null?[]:[id]);activeId=id;
  }
  render();
}
function selectAllCanvasObjects(){
  if(workspaceMode!=="design")return;
  const ids=scene.objects.filter(obj=>!obj.hidden&&!obj.locked).map(obj=>obj.id);
  setSelection(ids,ids.at(-1)||null);
  status(ids.length?ids.length+" canvas objects selected":"No visible, unlocked objects to select");
}
function copyCanvasObjects(cut=false){
  if(workspaceMode!=="design")return;
  const objects=scene.objects.filter(obj=>selected.has(obj.id)&&
    (!cut||!obj.locked)).sort((a,b)=>a.z-b.z||a.id-b.id);
  if(!objects.length){status("Select canvas objects first");return;}
  canvasClipboard=copy(objects);canvasPasteCount=0;
  if(cut){
    mutate(()=>{
      const ids=new Set(objects.map(obj=>obj.id));
      scene.objects=scene.objects.filter(obj=>!ids.has(obj.id));
      selected.clear();activeId=null;
    });
    status(objects.length+" objects cut · Paste to insert them here or on another page");
  }else{
    refreshUndo();
    status(objects.length+" canvas objects copied · Paste on any canvas page");
  }
}
function pasteCanvasObjects(){
  if(workspaceMode!=="design"||!canvasClipboard.length)return;
  if(scene.objects.length>=MAX_OBJECTS){status("Canvas object limit reached");return;}
  const incoming=canvasClipboard.slice(0,MAX_OBJECTS-scene.objects.length);
  if(!incoming.length)return;
  canvasPasteCount++;
  const shift=Math.min(canvasPasteCount*24,360);
  mutate(()=>{
    let z=Math.max(0,...scene.objects.map(obj=>obj.z));
    const ids=[];
    for(const source of incoming){
      const clone=copy(source);
      clone.id=scene.nextId++;
      clone.name=(source.name+" copy").slice(0,120);
      clone.x=clamp(source.x+shift,-2000,20000);
      clone.y=clamp(source.y+shift,-2000,40000);
      clone.z=++z;
      clone.locked=false;clone.hidden=false;
      clone.order=scene.objects.length;
      scene.objects.push(clone);ids.push(clone.id);
      scene.height=Math.max(scene.height,clone.y+clone.h+70);
    }
    selected=new Set(ids);activeId=ids.at(-1)||null;
  });
  status(incoming.length+" objects pasted · Undo available");
}
function applyBox(node,obj){
  node.style.left=obj.x+"px";node.style.top=obj.y+"px";
  node.style.width=obj.w+"px";node.style.height=obj.h+"px";
  node.style.zIndex=String(obj.z);
  node.style.background=obj.transparent||obj.shapeKind==="line"?"transparent":obj.bg;
  node.style.borderRadius=obj.type==="shape"&&obj.shapeKind==="ellipse"?"50%":"0";
  node.style.setProperty("--shape-line-colour",obj.bg);
  node.style.color=obj.color;node.style.textAlign=obj.align;
  node.style.fontFamily=obj.family;node.style.fontSize=obj.font+"px";
  node.hidden=!!obj.hidden;
}
function makeSceneElement(obj){
  const node=document.createElement("div");
  node.className="scene-object"+(obj.locked?" locked":"");
  node.dataset.id=String(obj.id);node.dataset.kind=obj.type;
  if(obj.backdrop)node.classList.add("imported-backdrop");
  if(obj.type==="shape"&&obj.shapeKind==="line")node.classList.add("line-shape");
  node.tabIndex=0;node.setAttribute("role","group");
  node.setAttribute("aria-label",obj.name);node.setAttribute("aria-selected",String(selected.has(obj.id)));
  applyBox(node,obj);
  if(obj.type==="image"){
    const image=document.createElement("img");
    image.className="photo";image.alt=obj.alt||"";image.draggable=false;
    if(safeImageSource(obj.src))image.src=obj.src;
    node.append(image);
  }else if(obj.type==="text"){
    const content=document.createElement("div");
    content.className="scene-content";
    if(obj.rich)content.innerHTML=cleanRich(obj.rich);
    else content.textContent=obj.text;
    if(/^h[1-6]$/.test(obj.tag||"")){
      node.setAttribute("role","heading");
      node.setAttribute("aria-level",obj.tag.slice(1));
    }
    node.append(content);
  }
  if(selected.has(obj.id)&&!obj.locked){
    for(const dir of HANDLES){
      const grip=document.createElement("span");
      grip.className="handle";grip.dataset.dir=dir;
      grip.setAttribute("role","button");grip.setAttribute("aria-label","Resize "+obj.name+" from "+dir);
      node.append(grip);
    }
  }
  return node;
}
const LIVE_WIDTHS={desktop:1160,tablet:768,phone:390};
function setWorkspaceMode(mode){
  if(mode!=="live"&&mode!=="design")return;
  if(mode!=="live"&&liveEditing)saveLiveText();
  if(mode!=="live"){
    if(liveGesture)cancelLiveGesture();
    removeLiveOverlay();removeLiveSnapGuides();
  }else{
    if(gesture)cancelCanvasGesture();
    cancelCanvasMarquee();
  }
  finishCropSliderPreview();finishPictureEffectPreview();
  workspaceMode=mode;
  const isLive=mode==="live";
  if(!isLive)clearLiveSectionHover();
  $("liveViewport").hidden=!isLive;
  $("scrollspace").hidden=isLive;
  $("liveMode").classList.toggle("active",isLive);
  $("designMode").classList.toggle("active",!isLive);
  $("liveMode").setAttribute("aria-pressed",String(isLive));
  $("designMode").setAttribute("aria-pressed",String(!isLive));
  $("devicePreview").disabled=!isLive;
  $("reloadLive").disabled=!isLive;
  $("copyLiveObject").disabled=!isLive||!liveSelected;
  $("remove").textContent=isLive?"Delete element":"Delete";
  $("front").title=isLive?"Raise selected webpage element's stacking order":"Bring canvas objects to front";
  $("back").title=isLive?"Lower selected webpage element's stacking order":"Send canvas objects behind";
  $("front").textContent=isLive?"Bring forward":"Bring to front";
  $("back").textContent=isLive?"Send backward":"Send to back";
  $("liveLayersPanel").hidden=!isLive;
  $("remove").title=isLive?"Delete selected live webpage element":"Delete selected canvas objects";
  $("canvasLayersPanel").hidden=isLive;
  $("canvasPropertiesPanel").hidden=isLive;
  $("canvasPublishingPanel").hidden=isLive;
  $("exportScene").disabled=isLive;
  $("exportScene").title=isLive?"Switch to Free design canvas to export canvas JSON":"Export the current free design canvas";
  $("save").textContent=isLive?"Save live-page edits":"Save canvas draft";
  $("selectTool").textContent=isLive?"↖ Select webpage":"↖ Select canvas";
  $("liveSectionPickMode").hidden=!isLive;
  $("cropImageTool").hidden=!isLive;
  $("addText").textContent=isLive?"T Add webpage text":"T Canvas text";
  $("addShape").textContent=isLive?"▢ Add webpage shape":"▢ Canvas shape";
  $("addImage").textContent=isLive?"▧ Add webpage image":"▧ Canvas image";
  $("workspaceTitle").textContent=isLive?"Live website":"Free design canvas";
  $("workspacePill").textContent=isLive?"GitHub main · source-matched editing":"Independent objects · staging only";
  $("workspaceExplanation").textContent=isLive?
    "The editing view uses the website's GitHub main HTML, styles, scripts and responsive layout. Verified preview and before/after use the same HTML assembler as live publishing, at the selected screen width. GitHub Pages may display a previous deployment until publication completes.":
    "This canvas is a simplified, independent reconstruction. It does not yet reproduce every original section or responsive rule. Use Live website to verify the real page; only the staging preview can be published.";
  $("workspaceFooter").textContent=isLive?
    "GitHub source · Drag elements · Resize handles · Double-click text · Search website elements · Stack forward/back · Undo and verified preview":
    "Drag to move · Eight resize handles · Double-click text to edit · Double-click empty canvas to add text · Drop images · Shift-click for multiple selection";
  renderLiveInspector();refreshUndo();
  if(isLive){fitLivePage();syncLiveOverlay();}
  else{
    $("zoom").value=String(Math.round(zoom*100));
    $("zoomValue").textContent=Math.round(zoom*100)+"%";
    fitCanvas();
  }
}
const LIVE_HEIGHTS={desktop:900,tablet:1024,phone:844};
function fitVerifiedPreviewFrames(){
  const pageWidth=workspaceMode==="live"?LIVE_WIDTHS[$("devicePreview").value]||1160:scene.width;
  const pageHeight=workspaceMode==="live"?LIVE_HEIGHTS[$("devicePreview").value]||900:Math.max(900,Math.min(scene.height,1400));
  for(const [dialogId,viewportId,shellId,frameId] of [
    ["previewDialog","previewViewport","previewShell","previewFrame"],
    ["compareDialog","originalViewport","originalShell","originalFrame"],
    ["compareDialog","sceneViewport","sceneShell","sceneFrame"]
  ]){
    if(!$(dialogId).open)continue;
    const viewport=$(viewportId),shell=$(shellId),frame=$(frameId);
    const available=Math.max(180,viewport.clientWidth-24);
    const scale=Math.min(1,available/pageWidth);
    frame.style.width=pageWidth+"px";
    frame.style.height=pageHeight+"px";
    frame.style.transform="scale("+scale+")";
    shell.style.width=Math.ceil(pageWidth*scale)+"px";
    shell.style.height=Math.ceil(pageHeight*scale)+"px";
  }
}
function togglePageFocus(){
  const app=document.querySelector(".application");
  const focused=app.classList.toggle("focus-view");
  $("focusPage").setAttribute("aria-pressed",String(focused));
  $("focusPage").textContent=focused?"Restore panels":"Focus page";
  // Force a layout read after changing the grid before scaling the iframe.
  // Otherwise the preview retains the old zoom until the next paint.
  fitLivePage();
  requestAnimationFrame(()=>fitLivePage());
}
function fitLivePage(){
  if(workspaceMode!=="live")return;
  const area=$("liveViewport"),frame=$("livePageFrame"),shell=$("livePageShell");
  if(!area?.clientWidth)return;
  const device=$("devicePreview").value;
  const width=LIVE_WIDTHS[device]||1160;
  const height=LIVE_HEIGHTS[device]||900;
  liveWidth=width;
  // A real browser has a fixed viewport and scrollable document. Expanding
  // iframe height to document.scrollHeight breaks 100vh and fixed/sticky CSS.
  // Scale only its visual presentation, never the browser viewport itself.
  liveScale=liveManualScale??Math.min(1,Math.max(.25,(area.clientWidth-48)/width));
  frame.style.width=width+"px";
  frame.style.height=height+"px";
  frame.style.transform="scale("+liveScale+")";
  shell.style.width=Math.ceil(width*liveScale)+"px";
  shell.style.height=Math.ceil(height*liveScale)+"px";
  $("zoom").value=String(Math.round(liveScale*100));
  $("zoomValue").textContent=Math.round(liveScale*100)+"%";
  if(liveSelected?.node?.isConnected)syncLiveOverlay();
}
// Independent objects live in the actual page, above the original content.
// They are identified by stable IDs, not by fragile nth-of-type selectors.
const LIVE_ADDED_ID=/^added:([a-z0-9-]{6,50})$/;
const LIVE_ADDED_LAYER="moon-v2-added-layer";
function isAddedPatch(p){
  return p?.kind==="insert"&&LIVE_ADDED_ID.test(p.selector);
}
function validAddedGeometry(geometry){
  if(!geometry||typeof geometry!=="object"||Array.isArray(geometry))return false;
  const keys=Object.keys(geometry);
  if(!keys.length||keys.some(device=>!LIVE_DEVICE_RULES[device]))return false;
  return keys.every(device=>{
    const v=geometry[device];
    return v&&["x","y","w","h"].every(key=>
      Number.isInteger(v[key])&&Math.abs(v[key])<=40000)&&
      v.x>=-4000&&v.x<=10000&&v.y>=-4000&&v.y<=40000&&
      v.w>=40&&v.w<=4000&&v.h>=24&&v.h<=5000;
  });
}
const LIVE_SHAPE_TYPES=Object.freeze([
  "rectangle","rounded","ellipse","line","triangle","diamond","pentagon",
  "hexagon","octagon","star","heart","chevron","arrow-right",
  "arrow-left","cross","parallelogram","trapezoid","speech-bubble"
]);
const LIVE_SHAPE_POLYGONS=Object.freeze({
  triangle:"50% 0%,100% 100%,0% 100%",
  diamond:"50% 0%,100% 50%,50% 100%,0% 50%",
  pentagon:"50% 0%,100% 38%,82% 100%,18% 100%,0% 38%",
  hexagon:"25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%",
  octagon:"30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%",
  star:"50% 0%,61% 35%,98% 35%,68% 57%,79% 94%,50% 72%,21% 94%,32% 57%,2% 35%,39% 35%",
  heart:"50% 20%,65% 0%,85% 0%,100% 20%,100% 50%,50% 100%,0% 50%,0% 20%,15% 0%,35% 0%",
  chevron:"0% 0%,60% 0%,100% 50%,60% 100%,0% 100%,40% 50%",
  "arrow-right":"0% 23%,62% 23%,62% 0%,100% 50%,62% 100%,62% 77%,0% 77%",
  "arrow-left":"100% 23%,38% 23%,38% 0%,0% 50%,38% 100%,38% 77%,100% 77%",
  cross:"35% 0%,65% 0%,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0% 65%,0% 35%,35% 35%",
  parallelogram:"25% 0%,100% 0%,75% 100%,0% 100%",
  trapezoid:"25% 0%,75% 0%,100% 100%,0% 100%",
  "speech-bubble":"0% 0%,100% 0%,100% 77%,38% 77%,16% 100%,20% 77%,0% 77%"
});
const DEFAULT_LIVE_OBJECT_DESIGN=Object.freeze({
  shape:"rectangle",rotation:0,opacity:100,radius:0,
  borderWidth:0,borderColour:"#394e46",imageFit:"contain"
});
function validAddedDesign(design){
  if(!design||typeof design!=="object"||Array.isArray(design))return false;
  const allowed=new Set(["shape","rotation","opacity","radius","borderWidth","borderColour","imageFit"]);
  for(const [key,value] of Object.entries(design)){
    if(!allowed.has(key))return false;
    if(key==="shape"&&!LIVE_SHAPE_TYPES.includes(value))return false;
    if(key==="imageFit"&&!["contain","cover"].includes(value))return false;
    if(key==="borderColour"&&(typeof value!=="string"||
       !/^#[0-9a-f]{6}$/i.test(value)))return false;
    if(key==="rotation"&&(!Number.isInteger(value)||value< -180||value>180))return false;
    if(key==="opacity"&&(!Number.isInteger(value)||value<0||value>100))return false;
    if(key==="radius"&&(!Number.isInteger(value)||value<0||value>200))return false;
    if(key==="borderWidth"&&(!Number.isInteger(value)||value<0||value>30))return false;
  }
  return true;
}
const DEFAULT_IMAGE_CROP=Object.freeze({fit:"contain",x:50,y:50,mask:"rectangle",zoom:100});
const DEFAULT_PICTURE_EFFECTS=Object.freeze({
  rotation:0,flipH:false,flipV:false,opacity:100,
  brightness:100,contrast:100,saturation:100,blur:0,shadow:false
});
function validPictureEffects(map){
  if(!map||typeof map!=="object"||Array.isArray(map))return false;
  const limits={rotation:[-180,180],opacity:[0,100],
    brightness:[20,200],contrast:[20,200],saturation:[0,250],blur:[0,20]};
  return Object.entries(map).every(([device,fx])=>
    !!LIVE_DEVICE_RULES[device]&&fx&&typeof fx==="object"&&!Array.isArray(fx)&&
    Object.entries(fx).every(([key,value])=>
      ["flipH","flipV","shadow"].includes(key)?typeof value==="boolean":
      !!limits[key]&&Number.isInteger(value)&&
        value>=limits[key][0]&&value<=limits[key][1]));
}
function pictureEffectsCss(fx,scaleX=1,scaleY=1){
  const f={...DEFAULT_PICTURE_EFFECTS,...fx};
  return "rotate:"+f.rotation+"deg!important;transform-origin:center center!important;"+
    "scale:"+(Math.round(scaleX*(f.flipH?-1:1)*1000)/1000)+" "+
      (Math.round(scaleY*(f.flipV?-1:1)*1000)/1000)+"!important;"+
    "opacity:"+(f.opacity/100)+"!important;"+
    "filter:brightness("+f.brightness+"%) contrast("+f.contrast+
      "%) saturate("+f.saturation+"%) blur("+f.blur+"px)"+
      (f.shadow?" drop-shadow(2px 4px 6px rgba(0,0,0,.32))":"")+
      "!important;";
}
function validImageCropMap(map){
  if(!map||typeof map!=="object"||Array.isArray(map))return false;
  return Object.entries(map).every(([device,crop])=>
    !!LIVE_DEVICE_RULES[device]&&crop&&typeof crop==="object"&&!Array.isArray(crop)&&
    Object.keys(crop).every(key=>["fit","x","y","mask","zoom","ratio","baseW","reset","left","right","top","bottom"].includes(key))&&
    (crop.mask===undefined||["rectangle","rounded","round-large","pill","circle","oval","squircle","diamond","hexagon","octagon","triangle","pentagon","star","heart","arch"].includes(crop.mask))&&
    (crop.zoom===undefined||Number.isInteger(crop.zoom)&&crop.zoom>=100&&crop.zoom<=500)&&
    (crop.ratio===undefined||Number.isFinite(crop.ratio)&&crop.ratio>=0.01&&crop.ratio<=100)&&
    (crop.baseW===undefined||Number.isFinite(crop.baseW)&&crop.baseW>=24&&crop.baseW<=15000)&&
    (crop.reset===undefined||typeof crop.reset==="boolean")&&
    ["left","right","top","bottom"].every(k=>crop[k]===undefined||
      Number.isFinite(crop[k])&&crop[k]>=0&&crop[k]<=90)&&
    Number(crop.left||0)+Number(crop.right||0)<95&&
    Number(crop.top||0)+Number(crop.bottom||0)<95&&
    ["contain","cover"].includes(crop.fit)&&
    ["x","y"].every(key=>Number.isInteger(crop[key])&&crop[key]>=0&&crop[key]<=100));
}
// The img element retains its source and accessible alt. Its pixels are
// shifted outside the paint area; a zoomable/pannable background paints
// inside the original image box, independently from frame resizing.
function cropShapeCss(shape){
  const polygons={
    diamond:"50% 0%,100% 50%,50% 100%,0% 50%",
    hexagon:"25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%",
    octagon:"30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%",
    triangle:"50% 0%,100% 100%,0% 100%",
    pentagon:"50% 0%,100% 38%,82% 100%,18% 100%,0% 38%",
    star:"50% 0%,61% 35%,98% 35%,68% 57%,79% 94%,50% 72%,21% 94%,32% 57%,2% 35%,39% 35%",
    heart:"50% 18%,62% 4%,82% 4%,100% 24%,100% 48%,50% 100%,0% 48%,0% 24%,18% 4%,38% 4%",
    arch:"50% 0%,85% 4%,100% 25%,100% 100%,0% 100%,0% 25%,15% 4%"
  };
  const radius={rounded:"12px","round-large":"28px",pill:"999px",oval:"50%",squircle:"35%"};
  const clip=shape==="circle"?"circle(closest-side at 50% 50%)":
    polygons[shape]?"polygon("+polygons[shape]+")":"none";
  return "border-radius:"+(radius[shape]||"0")+"!important;"+
    "clip-path:"+clip+"!important;";
}
function croppedEdges(crop){
  return {left:crop.left||0,right:crop.right||0,top:crop.top||0,bottom:crop.bottom||0};
}
function imageCropCss(crop,src="",geometry=null){
  const shape=cropShapeCss(crop.mask);
  if(crop.reset===true)
    return "object-fit:contain!important;object-position:50% 50%!important;"+
      "background-image:none!important;background-size:auto!important;"+
      "background-position:50% 50%!important;"+cropShapeCss("rectangle");
  if(!src||!safeImageSource(src)||!geometry?.w||!geometry?.h)
    return "object-fit:"+crop.fit+"!important;object-position:"+crop.x+"% "+crop.y+"%!important;"+shape;
  if(["left","right","top","bottom"].some(k=>crop[k]!==undefined)){
    const {left,right,top,bottom}=croppedEdges(crop);
    const fx=1-(left+right)/100,fy=1-(top+bottom)/100;
    const ratio=crop.ratio||geometry.w/geometry.h;
    const naturalW=crop.fit==="cover"?
      Math.max(geometry.w/fx,geometry.h*ratio/fy):
      Math.min(geometry.w/fx,geometry.h*ratio/fy);
    const fullW=naturalW*clamp(crop.zoom||100,100,500)/100,fullH=fullW/ratio;
    const px=v=>Math.round(v*1000)/1000+"px";
    const shiftX=(geometry.w-fullW*fx)/2-fullW*left/100;
    const shiftY=(geometry.h-fullH*fy)/2-fullH*top/100;
    return "object-fit:none!important;object-position:-100000px -100000px!important;"+
      "background-image:url("+src+")!important;"+
      "background-size:"+px(fullW)+" "+px(fullH)+"!important;"+
      "background-position:"+px(shiftX)+" "+px(shiftY)+"!important;"+
      "background-repeat:no-repeat!important;background-origin:border-box!important;"+shape;
  }
  // Retain compatibility with earlier focal-position crops.
  if(!crop.ratio)return "object-fit:"+crop.fit+"!important;object-position:"+
    crop.x+"% "+crop.y+"%!important;"+shape;
  const zoom=clamp(crop.zoom||100,100,500)/100;
  const cover=Math.max(100,geometry.h*crop.ratio/geometry.w*100);
  const contain=Math.min(100,geometry.h*crop.ratio/geometry.w*100);
  const baseline=crop.baseW||geometry.w*cover/100;
  const w=crop.fit==="contain"?geometry.w*contain/100:Math.max(baseline,geometry.w*cover/100);
  return "object-fit:none!important;object-position:-100000px -100000px!important;"+
    "background-image:url("+src+")!important;"+
    "background-size:"+Math.round(w*zoom*1000)/1000+"px auto!important;"+
    "background-position:"+crop.x+"% "+crop.y+"%!important;"+
    "background-repeat:no-repeat!important;background-origin:content-box!important;"+shape;
}
function selectedImageCrop(patch,device=liveDevice()){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  let published={};
  if(node?.tagName==="IMG"&&!LIVE_ADDED_ID.test(selector||"")){
    try{
      const record=JSON.parse(node.getAttribute("data-moon-v2-image-crop")||"{}");
      if(validImageCropMap(record)&&record[device])published={...record[device]};
    }catch{/* Old webpage with no crop metadata. */}
  }
  // Crops published in earlier sessions exist as source CSS, rather
  // than draft metadata. Use the actual image's framing as a baseline.
  if(node?.tagName==="IMG"&&selector===patch?.selector&&node.isConnected){
    const css=node.ownerDocument.defaultView.getComputedStyle(node);
    const positions=css.objectPosition.match(/^([\d.]+)%\s+([\d.]+)%$/);
    const fit=["cover","contain"].includes(css.objectFit)?css.objectFit:"contain";
    const radius=css.borderTopLeftRadius;
    if(!Object.keys(published).length)published={fit,
      x:positions?Math.round(clamp(Number(positions[1]),0,100)):50,
      y:positions?Math.round(clamp(Number(positions[2]),0,100)):50,
      mask:radius==="50%"?"circle":
        parseFloat(radius)>1?"rounded":"rectangle"};
  }
  return {...DEFAULT_IMAGE_CROP,...published,
    fit:patch?.design?.imageFit||published.fit||"contain",
    ...(patch?.imageCrop?.[device]||{})};
}
function validAddedPatch(p){
  return !!p&&isAddedPatch(p)&&typeof p.expected==="string"&&p.expected===""&&
    ["text","image","shape"].includes(p.objectType)&&
    validAddedGeometry(p.geometry)&&
    (p.objectType!=="text"||
      typeof p.html==="string"&&p.html.length<=30000)&&
    (p.objectType!=="image"||
      safeImageSource(p.src)&&typeof p.alt==="string"&&p.alt.length<=300)&&
    (p.objectType!=="shape"||
      typeof p.fill==="string"&&/^#[0-9a-f]{6}$/i.test(p.fill))&&
    (p.appearance===undefined||validLiveAppearance(p.appearance))&&
    (p.design===undefined||validAddedDesign(p.design))&&
    (p.imageCrop===undefined||
      p.objectType==="image"&&validImageCropMap(p.imageCrop))&&
    (p.pictureEffects===undefined||
      p.objectType==="image"&&validPictureEffects(p.pictureEffects));
}
function addedObjectId(p){return p.selector.slice("added:".length);}
function addedDeviceGeometry(p,device){
  return p.geometry[device]||p.geometry.desktop||
    p.geometry.tablet||p.geometry.phone;
}
function ensureAddedLayer(doc){
  const main=doc.querySelector("main");
  if(!main)throw Error("The webpage has no main element for independent objects.");
  main.setAttribute("data-moon-v2-added-host","");
  let foundation=doc.getElementById("moon-v2-added-foundation");
  if(!foundation){
    foundation=doc.createElement("style");
    foundation.id="moon-v2-added-foundation";
    foundation.textContent=
      'main[data-moon-v2-added-host]{position:relative!important;}'+
      'main > [data-moon-v2-added-layer]{position:absolute!important;'+
      'left:0!important;top:0!important;width:100%!important;height:0!important;'+
      'overflow:visible!important;pointer-events:none!important;z-index:100!important;}';
    doc.head.append(foundation);
  }
  let layer=main.querySelector(":scope > [data-moon-v2-added-layer]");
  if(!layer){
    layer=doc.createElement("div");
    layer.setAttribute("data-moon-v2-added-layer","");
    main.append(layer);
  }
  return layer;
}
function addedStyleCss(p){
  const id=addedObjectId(p),tag='[data-moon-v2-added-id="'+id+'"]';
  const styles=[
    "box-sizing:border-box","position:absolute","margin:0","display:block",
    "pointer-events:auto","overflow:visible","max-width:none",
    "transform-origin:center center"
  ];
  const appearance=p.appearance||{},design={
    ...DEFAULT_LIVE_OBJECT_DESIGN,...(p.design||{})
  };
  styles.push("transform:rotate("+design.rotation+"deg)");
  styles.push("opacity:"+(design.opacity/100));
  styles.push("border-radius:"+design.radius+"px");
  if(design.borderWidth)
    styles.push("border:"+design.borderWidth+"px solid "+design.borderColour);
  else styles.push("border:0");
  if(p.objectType==="text"){
    styles.push("overflow-wrap:anywhere","white-space:normal",
      "line-height:1.4","padding:3px","min-width:0");
    styles.push("font-size:"+(appearance.fontSize||20)+"px");
    styles.push("font-family:"+(appearance.family||"Georgia, serif"));
    styles.push("color:"+(appearance.color||"#1c2622"));
  }
  if(p.objectType==="shape"){
    styles.push("background:"+p.fill);
    if(design.shape==="ellipse")styles.push("border-radius:50%");
    if(design.shape==="rounded")styles.push("border-radius:24px");
    if(LIVE_SHAPE_POLYGONS[design.shape])
      styles.push("clip-path:polygon("+LIVE_SHAPE_POLYGONS[design.shape]+")");
    if(design.shape==="line"){
      styles.push("clip-path:polygon(0 47%,100% 47%,100% 53%,0 53%)");
      styles.push("border:0");
    }
  }
  if(p.objectType==="image")styles.push("object-fit:"+design.imageFit);
  for(const [key,name] of [["backgroundColor","background-color"],
    ["weight","font-weight"],["style","font-style"],
    ["decoration","text-decoration-line"],["align","text-align"]]){
    if(appearance[key]!==undefined)styles.push(name+":"+
      (key==="decoration"?appearance[key]:appearance[key]));
  }
  if(p.objectType!=="text"&&appearance.color)
    styles.push("color:"+appearance.color);
  styles.push("z-index:"+(appearance.layer??100));
  let result=tag+"{"+styles.map(s=>s+"!important").join(";")+";}";
  for(const [device,media] of Object.entries(LIVE_DEVICE_RULES)){
    const g=addedDeviceGeometry(p,device);
    if(!g)continue;
    const crop=p.objectType==="image"?p.imageCrop?.[device]:null;
    const fx=p.objectType==="image"?p.pictureEffects?.[device]:null;
    result+="@media "+media+"{"+tag+"{left:"+g.x+
      "px!important;top:"+g.y+"px!important;width:"+g.w+
      "px!important;height:"+g.h+"px!important;"+
      (crop?imageCropCss(crop,p.src,g):"")+
      (fx?pictureEffectsCss(fx):"")+"}}";
  }
  return result;
}
function updateAddedPageHeight(doc){
  const main=doc.querySelector("main"),layer=main?.querySelector(":scope > [data-moon-v2-added-layer]");
  const id="moon-v2-added-extent";
  if(!main||!layer)return;
  const extent={desktop:0,tablet:0,phone:0};
  for(const node of layer.querySelectorAll("[data-moon-v2-added-id]")){
    let geom;
    try{geom=JSON.parse(node.getAttribute("data-moon-v2-added-geometry")||"{}");}
    catch{continue;}
    if(!validAddedGeometry(geom))continue;
    for(const device of Object.keys(extent)){
      const g=addedDeviceGeometry({geometry:geom},device);
      extent[device]=Math.max(extent[device],g.y+g.h+32);
    }
  }
  let rule=doc.getElementById(id);
  if(!Object.values(extent).some(x=>x>0)){
    rule?.remove();return;
  }
  if(!rule){rule=doc.createElement("style");rule.id=id;doc.head.append(rule);}
  rule.textContent=Object.entries(LIVE_DEVICE_RULES).map(([device,media])=>
    "@media "+media+"{main[data-moon-v2-added-host]{min-height:"+
      Math.ceil(extent[device])+"px!important;}}").join("\n");
}
function applyAddedPatch(doc,p){
  if(!validAddedPatch(p))throw Error("Invalid independent webpage object.");
  const layer=ensureAddedLayer(doc),id=addedObjectId(p);
  const wanted=p.objectType==="image"?"img":p.objectType==="text"?"p":"div";
  let node=[...layer.children].find(el=>
    el.getAttribute("data-moon-v2-added-id")===id);
  if(node&&node.tagName.toLowerCase()!==wanted){
    throw Error("A webpage object ID is already assigned to a different kind of element.");
  }
  if(!node){
    node=doc.createElement(wanted);
    node.setAttribute("data-moon-v2-added-id",id);
    layer.append(node);
  }
  node.setAttribute("data-moon-v2-object-type",p.objectType);
  if(p.objectType==="shape")node.setAttribute("data-moon-v2-shape-fill",p.fill);
  node.setAttribute("data-moon-v2-added-geometry",JSON.stringify(p.geometry));
  node.setAttribute("data-moon-v2-added-appearance",JSON.stringify(p.appearance||{}));
  node.setAttribute("data-moon-v2-added-design",JSON.stringify(p.design||{}));
  if(p.objectType==="image"){
    node.setAttribute("data-moon-v2-added-crop",JSON.stringify(p.imageCrop||{}));
    node.setAttribute("data-moon-v2-picture-effects",JSON.stringify(p.pictureEffects||{}));
  }
  if(p.objectType==="image"){
    node.setAttribute("src",p.src);node.setAttribute("alt",p.alt);
  }else if(p.objectType==="text")node.innerHTML=cleanRich(p.html);
  let css=doc.querySelector('style[data-moon-v2-added-style="'+id+'"]');
  if(!css){
    css=doc.createElement("style");
    css.setAttribute("data-moon-v2-added-style",id);
    doc.head.append(css);
  }
  css.textContent=addedStyleCss(p);
  updateAddedPageHeight(doc);
  return node;
}
function removeAddedPatchFromDoc(doc,selector){
  const id=selector.slice(6);
  for(const node of doc.querySelectorAll("[data-moon-v2-added-id]")){
    if(node.getAttribute("data-moon-v2-added-id")===id)node.remove();
  }
  for(const node of doc.querySelectorAll("[data-moon-v2-added-style]")){
    if(node.getAttribute("data-moon-v2-added-style")===id)node.remove();
  }
  const main=doc.querySelector("main");
  const layer=main?.querySelector(":scope > [data-moon-v2-added-layer]");
  if(layer&&!layer.querySelector("[data-moon-v2-added-id]")){
    layer.remove();
    main.removeAttribute("data-moon-v2-added-host");
    doc.getElementById("moon-v2-added-foundation")?.remove();
    doc.getElementById("moon-v2-added-extent")?.remove();
  }else updateAddedPageHeight(doc);
}
function findAddedNode(doc,selector){
  const found=selector?.match(LIVE_ADDED_ID);
  if(!found)return null;
  return [...doc.querySelectorAll("[data-moon-v2-added-id]")].find(node=>
    node.getAttribute("data-moon-v2-added-id")===found[1])||null;
}
function newAddedPatch(type,{src="",alt="",html="",fill="#e1eee4"}={}){
  const doc=$("livePageFrame").contentDocument,main=doc?.querySelector("main");
  if(!main)throw Error("The current webpage has not finished loading.");
  const id=(crypto.randomUUID?.()||Math.random().toString(36).slice(2))
    .toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,36);
  const w=type==="text"?320:type==="image"?300:180;
  const h=type==="text"?105:type==="image"?220:120;
  const rect=main.getBoundingClientRect();
  const y=Math.round(clamp(75-rect.top,20,38000));
  const x=Math.round(clamp((rect.width-w)/2,12,9000));
  const geometry={};
  for(const [device,viewportWidth] of Object.entries(LIVE_WIDTHS)){
    const width=Math.min(w,Math.max(80,viewportWidth-32));
    geometry[device]={x:Math.round(clamp(x,12,Math.max(12,viewportWidth-width-16))),
      y,w:width,h};
  }
  geometry[liveDevice()]={x,y,w:Math.min(w,Math.max(80,rect.width-24)),h};
  return {selector:"added:"+id,kind:"insert",expected:"",objectType:type,
    geometry,...(type==="text"?{html:cleanRich(html||"Double-click to edit text")}:
      type==="image"?{src,alt}:{fill}),
    ...(type==="text"?{appearance:{fontSize:20,color:"#1c2622"}}:{})};
}
function copyLiveSelection(){
  const node=liveSelected?.node;
  if(workspaceMode!=="live"||!node||liveEditing)return;
  const saved=livePatchForSelected();
  if(saved?.kind==="insert")liveObjectClipboard=copy(saved);
  else if(node.tagName==="IMG"){
    const src=node.getAttribute("src")||"";
    if(!safeImageSource(src)){
      status("This image needs to be imported into website assets before copying");return;
    }
    liveObjectClipboard=newAddedPatch("image",{src,alt:node.alt||""});
    if(saved?.imageCrop&&Object.keys(saved.imageCrop).length)
      liveObjectClipboard.imageCrop=copy(saved.imageCrop);
  }else if(!LIVE_CONTAINER_SET.has(node.tagName)){
    liveObjectClipboard=newAddedPatch("text",{html:cleanRich(node.innerHTML)});
    const style=node.ownerDocument.defaultView.getComputedStyle(node);
    const family=style.fontFamily;
    liveObjectClipboard.appearance={
      fontSize:Math.round(clamp(parseFloat(style.fontSize)||20,10,120)),
      color:hexColour(style.color,"#1c2622"),
      ...(LIVE_FONT_OPTIONS.has(family)?{family}:{})
    };
  }else{
    status("Select a text box, image or independent shape to copy");return;
  }
  livePasteCount=0;refreshUndo();
  status("Webpage object copied · Ctrl+V to paste onto this page or another page");
}
function pasteLiveSelection(){
  if(workspaceMode!=="live"||!liveObjectClipboard||liveEditing)return;
  try{
    if(livePatches.size>=180)throw Error("This page has reached the saved edit limit.");
    const source=liveObjectClipboard,patch=copy(source);
    patch.selector=newAddedPatch(source.objectType,{html:source.html,
      src:source.src,alt:source.alt,fill:source.fill}).selector;
    livePasteCount++;
    for(const geo of Object.values(patch.geometry)){
      geo.x=Math.round(clamp(geo.x+24*livePasteCount,-4000,10000));
      geo.y=Math.round(clamp(geo.y+24*livePasteCount,-4000,40000));
    }
    if(!validAddedPatch(patch))throw Error("Copied object has invalid content.");
    const before=liveSnapshot();
    livePatches.set(patch.selector,patch);
    const node=applyAddedPatch($("livePageFrame").contentDocument,patch);
    recordLiveHistory(before);renderLiveLayers();selectLiveElement(node);
    status("Object pasted directly onto webpage · Undo available");
  }catch(error){status("Paste cancelled · "+error.message);}
}
function addLiveObject(type,values={}){
  if(workspaceMode!=="live"||liveEditing)return;
  if(type==="image"&&!safeImageSource(values.src)){
    status("Choose a website image or an image file to add.");return;
  }
  try{
    const patch=newAddedPatch(type,values);
    if(!validAddedPatch(patch))throw Error("Invalid object details.");
    const before=liveSnapshot();
    if(livePatches.size>=180)throw Error("The per-page edit limit has been reached.");
    livePatches.set(patch.selector,patch);
    const doc=$("livePageFrame").contentDocument;
    const node=applyAddedPatch(doc,patch);
    recordLiveHistory(before);
    renderLiveLayers();
    selectLiveElement(node);
    node.scrollIntoView({block:"center",inline:"nearest"});
    syncLiveOverlay();
    status("New "+type+" added directly to the webpage · Drag or resize · Publish through GitHub");
  }catch(error){status("Could not add "+type+" · "+error.message);}
}
function refreshAddedObject(doc,patch){
  if(patch?.kind==="insert")applyAddedPatch(doc,patch);
  else if(patch?.kind==="remove-added")removeAddedPatchFromDoc(doc,patch.selector);
}
function liveSelector(node){
  const added=node?.closest?.("[data-moon-v2-added-id]");
  if(added){
    const id=added.getAttribute("data-moon-v2-added-id");
    if(LIVE_ADDED_ID.test("added:"+id))return "added:"+id;
  }
  const steps=[];
  for(let current=node;current&&current.tagName!=="MAIN";current=current.parentElement){
    if(!current.parentElement||steps.length>=24)return null;
    const siblings=[...current.parentElement.children].filter(el=>el.tagName===current.tagName);
    steps.unshift(current.tagName.toLowerCase()+":nth-of-type("+(siblings.indexOf(current)+1)+")");
  }
  return steps.length?"main > "+steps.join(" > "):null;
}
const LIVE_CONTAINER_TAGS="section,article,aside,figure,div,nav,ul,ol";
const LIVE_EDITABLE_TAGS="h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,img";
const LIVE_SELECTABLE_TAGS=LIVE_EDITABLE_TAGS+","+LIVE_CONTAINER_TAGS;
function liveEventTarget(event){
  // Section mode chooses a whole section from any descendant, including
  // links, text, photos, cards and their nested divs.
  if(liveSectionPickMode){
    const main=event.target.closest?.("main");
    if(main){
      // Prefer the enclosing semantic section over a nested figure or card
      // so the selection covers the whole region the user sees.
      const section=event.target.closest?.("section")||
        event.target.closest?.("article,aside,figure");
      if(section&&main.contains(section))return section;
      const direct=[...main.children].find(node=>node.contains(event.target)&&
        node.matches(LIVE_CONTAINER_TAGS));
      if(direct)return direct;
    }
  }
  // Alt-click selects a container; on an actual hyperlink it selects the
  // enclosing paragraph so the link's text remains editable.
  const nearestText=event.target.closest?.(LIVE_EDITABLE_TAGS);
  const nearestContainer=event.target.closest?.(LIVE_CONTAINER_TAGS);
  return event.altKey&&!event.target.closest?.("a[href]")?
    nearestContainer||nearestText:nearestText||nearestContainer;
}
function clearLiveSectionHover(){
  if(liveSectionHover?.isConnected)
    liveSectionHover.removeAttribute("data-moon-v2-section-hover");
  liveSectionHover=null;
}
function toggleLiveSectionPickMode(){
  liveSectionPickMode=!liveSectionPickMode;
  clearLiveSectionHover();
  $("liveSectionPickMode").setAttribute("aria-pressed",String(liveSectionPickMode));
  $("liveSectionPickMode").classList.toggle("active",liveSectionPickMode);
  $("liveSectionPickMode").textContent=liveSectionPickMode?
    "▣ Editing sections":"▣ Edit sections";
  status(liveSectionPickMode?
    "Section editing on · Click anywhere in a section, then drag its edge or corner to resize":
    "Section editing off · Individual text and images can be selected again");
  syncLiveOverlay();
}
const LIVE_CONTAINER_SET=new Set(["SECTION","ARTICLE","ASIDE","FIGURE","DIV","NAV","UL","OL"]);
// All source containers have their own resizable box. Their children keep
// native font sizes, object-fit and document layout.
function liveSectionAncestor(node){
  if(!node||!node.closest)return null;
  const ancestor=node.matches("section")?
    node.parentElement?.closest("section"):node.closest("section");
  return ancestor?.closest("main")?ancestor:null;
}
const LIVE_DEVICE_RULES={
  desktop:"(min-width:1025px)",
  tablet:"(min-width:701px) and (max-width:1024px)",
  phone:"(max-width:700px)"
};
const defaultLiveLayout=()=>({dx:0,dy:0,sx:1,sy:1});
const LIVE_FONT_OPTIONS=new Set([
  "Georgia, serif","Arial, sans-serif","system-ui, sans-serif",
  "Times New Roman, Times, serif", // Backward compatible with saved drafts.
  '"Times New Roman", Times, serif'
]);
function validLiveAppearance(value){
  if(!value||typeof value!=="object"||Array.isArray(value))return false;
  const allowed=new Set(["family","fontSize","color","backgroundColor",
    "weight","style","decoration","align","layer"]);
  for(const [key,v] of Object.entries(value)){
    if(!allowed.has(key))return false;
    if(key==="family"&&!LIVE_FONT_OPTIONS.has(v))return false;
    if(key==="fontSize"&&(!Number.isFinite(v)||v<10||v>120))return false;
    if(["color","backgroundColor"].includes(key)&&
      (typeof v!=="string"||!/^#[0-9a-f]{6}$/i.test(v)))return false;
    if(key==="weight"&&!["bold","normal"].includes(v))return false;
    if(key==="style"&&!["italic","normal"].includes(v))return false;
    if(key==="decoration"&&!["none","underline"].includes(v))return false;
    if(key==="align"&&!["left","center","right","justify"].includes(v))return false;
    if(key==="layer"&&(!Number.isInteger(v)||v< -9999||v>9999))return false;
  }
  return true;
}
function pruneLivePatch(patch,node){
  const unchangedText=patch.kind==="text"&&
    patch.html===cleanRich(node.innerHTML)&&
    patch.expected===(node.textContent||"").trim().slice(0,300);
  const unchangedImage=patch.kind==="image"&&
    patch.src===(node.getAttribute("src")||"")&&patch.alt===(node.alt||"");
  return !patch.layout&&!patch.appearance&&!patch.imageCrop&&!patch.pictureEffects&&
    (patch.kind==="layout"||unchangedText||unchangedImage);
}
function setLiveAppearance(key,value){
  const selected=liveSelected?.node;
  if(!selected||selected.tagName==="IMG"||liveEditing)return;
  const patch=livePatchForSelected();if(!patch)return;
  const current={...(patch.appearance||{})};
  if(key==="family"){
    if(value&&!LIVE_FONT_OPTIONS.has(value))return;
    if(!value)delete current.family;
    else current.family=value;
  }else if(key==="fontSize"){
    const size=Number(value);
    if(!Number.isFinite(size)||size<10||size>120)return;
    current.fontSize=Math.round(size);
  }else if(["color","backgroundColor"].includes(key)){
    if(!/^#[0-9a-f]{6}$/i.test(value))return;
    current[key]=value;
  }else if(["weight","style","decoration","align"].includes(key)){
    if(value==="")delete current[key];
    else{
      const acceptable={
        weight:["bold","normal"],style:["italic","normal"],
        decoration:["none","underline"],align:["left","center","right","justify"]
      };
      if(!acceptable[key].includes(value))return;
      current[key]=value;
    }
  }else return;
  const before=liveSnapshot();
  if(Object.keys(current).length)patch.appearance=current;
  else delete patch.appearance;
  if(pruneLivePatch(patch,selected))livePatches.delete(patch.selector);
  else livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){
    if(patch.kind==="insert")refreshAddedObject(selected.ownerDocument,patch);
    else refreshLiveLayoutRules();
    renderLiveInspector();syncLiveOverlay();
  }
}
function setLiveLayer(front,reset=false){
  const node=liveSelected?.node,patch=livePatchForSelected();
  if(!node||!patch||workspaceMode!=="live"||liveEditing)return;
  const old=liveSnapshot(),appearance={...(patch.appearance||{})};
  if(reset)delete appearance.layer;
  else{
    const levels=[...livePatches.values()].map(p=>p.appearance?.layer)
      .filter(Number.isInteger);
    appearance.layer=front?
      clamp(Math.max(1000,...levels)+1,-9999,9999):
      clamp(Math.min(-1,...levels)-1,-9999,9999);
  }
  if(Object.keys(appearance).length)patch.appearance=appearance;
  else delete patch.appearance;
  if(pruneLivePatch(patch,node))livePatches.delete(patch.selector);
  else livePatches.set(patch.selector,patch);
  if(recordLiveHistory(old)){
    if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
    else refreshLiveLayoutRules();
    renderLiveInspector();syncLiveOverlay();
    status(reset?"Element returned to website stacking order":
      (front?"Element brought forward":"Element sent backward")+
      " · Saved locally · Undo available");
  }
}
function resetLiveAppearance(){
  const selected=liveSelected?.node,patch=livePatchForSelected();
  if(!selected||!patch?.appearance)return;
  const before=liveSnapshot();
  delete patch.appearance;
  if(pruneLivePatch(patch,selected))livePatches.delete(patch.selector);
  else livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){
    if(patch.kind==="insert")refreshAddedObject(selected.ownerDocument,patch);
    else refreshLiveLayoutRules();
    renderLiveInspector();syncLiveOverlay();
  }
}
function validLiveLayout(layout){
  if(!layout||typeof layout!=="object"||Array.isArray(layout))return false;
  for(const [device,values] of Object.entries(layout)){
    if(!LIVE_DEVICE_RULES[device]||!values||typeof values!=="object")return false;
    for(const [key,min,max] of [["dx",-4000,4000],["dy",-4000,4000],
      ["sx",.2,5],["sy",.2,5]]){
      if(!Number.isFinite(values[key])||values[key]<min||values[key]>max)return false;
    }
    for(const [key,min,max] of [["ox",-10000,10000],["oy",-10000,10000],
      ["osx",.01,10],["osy",.01,10]]){
      if(values[key]!==undefined&&
        (!Number.isFinite(values[key])||values[key]<min||values[key]>max))return false;
    }
    if(values.releaseClip!==undefined&&typeof values.releaseClip!=="boolean")return false;
    // "min" is the legacy behaviour for saved section edits. Newly resized
    // sections choose "fixed" or "auto" explicitly, per device.
    if(values.sectionHeightMode!==undefined&&
       !["min","fixed","auto"].includes(values.sectionHeightMode))return false;
    const width=values.wrapWidth,height=values.reserveHeight;
    if((width===undefined)!==(height===undefined))return false;
    if(width!==undefined&&(!Number.isFinite(width)||width<64||width>4000||
      !Number.isFinite(height)||height<24||height>5000))return false;
  }
  return true;
}
function liveDevice(){return $("devicePreview").value;}
function originalLiveTransform(node){
  if(!node?.isConnected)return {ox:0,oy:0,osx:1,osy:1};
  const doc=node.ownerDocument;
  const sheet=doc.getElementById("moon-v2-live-layout");
  const previous=sheet?.textContent;
  const committed=liveSourceCss.get(doc);
  // The page may already contain published, original positioning in this
  // stylesheet. Replacing it with empty CSS would erase that baseline and
  // make a 20px move jump by the amount of the published translation.
  // Temporarily show only the exact original source rules, not draft rules.
  if(sheet&&committed!==undefined)sheet.textContent=committed;
  try{
    const style=doc.defaultView.getComputedStyle(node);
    const translate=style.translate;
    const match=translate.match(/^(-?(?:\d+\.?\d*|\.\d+))px(?:\s+(-?(?:\d+\.?\d*|\.\d+))px)?$/);
    const scale=style.scale==="none"?[]:style.scale.split(/\s+/).map(Number);
    return {
      ox:match?Number(match[1]):0,oy:match?Number(match[2]||0):0,
      osx:Number.isFinite(scale[0])?scale[0]:1,
      osy:Number.isFinite(scale[1])?scale[1]:Number.isFinite(scale[0])?scale[0]:1
    };
  }finally{if(sheet&&committed!==undefined)sheet.textContent=previous;}
}
function liveLayoutFor(selector,device=liveDevice()){
  const added=livePatches.get(selector)||
    (LIVE_ADDED_ID.test(selector)&&liveSelected?.node?
      livePatchForSelected():null);
  if(added?.kind==="insert"){
    const v=addedDeviceGeometry(added,device);
    return {...defaultLiveLayout(),dx:v.x,dy:v.y,
      wrapWidth:v.w,reserveHeight:v.h};
  }
  const current=livePatches.get(selector)?.layout?.[device]||{};
  const selectedNode=liveSelected?.node;
  const origin=current.ox!==undefined&&current.oy!==undefined?
    {}:selectedNode&&liveSelector(selectedNode)===selector?
      originalLiveTransform(selectedNode):{ox:0,oy:0,osx:1,osy:1};
  return {...defaultLiveLayout(),...origin,...current};
}
function liveLayoutRules(patches=[...livePatches.values()]){
  const result=[];
  for(const patch of patches){
    if(patch.kind==="delete"||patch.kind==="insert")continue;
    const value=patch.appearance;
    if(!value||!validLiveAppearance(value))continue;
    const style=[];
    if(value.family){
      const family=value.family==="Times New Roman, Times, serif"?
        '"Times New Roman", Times, serif':value.family;
      style.push("font-family:"+family+"!important");
    }
    if(value.fontSize)style.push("font-size:"+value.fontSize+"px!important");
    if(value.color)style.push("color:"+value.color+"!important");
    if(value.backgroundColor)style.push("background-color:"+value.backgroundColor+"!important");
    if(value.weight)style.push("font-weight:"+value.weight+"!important");
    if(value.style)style.push("font-style:"+value.style+"!important");
    if(value.decoration)style.push("text-decoration-line:"+value.decoration+"!important");
    if(value.align)style.push("text-align:"+value.align+"!important");
    if(value.layer!==undefined)
      style.push("position:relative!important","z-index:"+value.layer+"!important");
    if(style.length)result.push(patch.selector+"{"+style.join(";")+";}");
  }
  for(const [device,media] of Object.entries(LIVE_DEVICE_RULES)){
    const selectors=[];
    for(const patch of patches){
      if(patch.kind==="delete"||patch.kind==="insert")continue;
      const entry=patch.layout?.[device];
      if(!entry||!validLiveLayout({[device]:entry}))continue;
      // Both values are bounded, strictly numeric data. Selectors are
      // validated source-rooted nth-of-type paths; no arbitrary CSS allowed.
      const tag=patch.tag||
        patch.selector.match(/ > ([a-z][a-z0-9-]*):nth-of-type\(\d+\)$/)?.[1]||"";
      const sectionLike=["section","article","aside","figure","div","nav","ul","ol"].includes(tag);
      const containerHeight=entry.sectionHeightMode==="fixed"?
        "height:"+entry.reserveHeight+"px!important;min-height:0!important;":
        entry.sectionHeightMode==="auto"?
          "height:auto!important;min-height:0!important;":
          // Preserve older saved edits which used a minimum-height box.
          "height:auto!important;min-height:"+entry.reserveHeight+"px!important;";
      const reflow=entry.wrapWidth!==undefined?
        "width:"+entry.wrapWidth+"px!important;"+
        (sectionLike?containerHeight:
          "height:"+entry.reserveHeight+"px!important;")+
        "box-sizing:border-box!important;min-width:0!important;"+
        "max-width:none!important;max-height:none!important;overflow:visible!important;"+
        (patch.kind==="image"||tag==="img"?
          "object-fit:contain!important;":""):"";
      selectors.push(patch.selector+"{translate:"+
        (Math.round(((entry.ox||0)+entry.dx)*1000)/1000)+"px "+
        (Math.round(((entry.oy||0)+entry.dy)*1000)/1000)+"px!important;scale:"+
        (Math.round(((entry.osx||1)*entry.sx)*1000)/1000)+" "+
        (Math.round(((entry.osy||1)*entry.sy)*1000)/1000)+
        "!important;transform-origin:top left!important;"+reflow+"}");
    }
    // The user explicitly opts in to removing clipping for the chosen
    // source element's ancestors, scoped to the current device.
    const released=new Set();
    for(const patch of patches){
      if(patch.kind==="delete"||patch.kind==="insert"||
         patch.layout?.[device]?.releaseClip!==true)continue;
      const parts=patch.selector.split(" > ");
      for(let depth=2;depth<parts.length;depth++)
        released.add(parts.slice(0,depth).join(" > "));
    }
    const unclipped=[...released].map(s=>s+
      "{overflow:visible!important;clip-path:none!important;}");
    for(const patch of patches){
      if(patch.kind==="insert"||patch.kind==="delete"||!patch.pictureEffects?.[device])continue;
      const e=patch.layout?.[device];
      const sx=e?(e.osx||1)*e.sx:1,sy=e?(e.osy||1)*e.sy:1;
      selectors.push(patch.selector+"{"+pictureEffectsCss(patch.pictureEffects[device],sx,sy)+"}");
    }
    for(const patch of patches){
      if(patch.kind==="insert"||patch.kind==="delete"||!patch.imageCrop?.[device])continue;
      const tail=patch.selector.match(/ > ([a-z][a-z0-9-]*):nth-of-type\(\d+\)$/)?.[1];
      if(tail!=="img")continue;
      const crop=patch.imageCrop[device],layout=patch.layout?.[device];
      const dims=layout?.wrapWidth?{w:layout.wrapWidth,h:layout.reserveHeight}:null;
      selectors.push(patch.selector+"{"+imageCropCss(crop,patch.src,dims)+"}");
    }
    if(selectors.length||unclipped.length)
      result.push("@media "+media+"{"+unclipped.join("")+selectors.join("")+"}");
  }
  return result.join("\n");
}
// Remember the CSS already committed to this source document. Draft
// updates may override it, but never erase unrelated previously published
// layout rules when editing a new page element.
const liveSourceCss=new WeakMap();
function refreshLiveLayoutRules(doc=$("livePageFrame").contentDocument,patches=[...livePatches.values()]){
  if(!doc?.head)return;
  let sheet=doc.getElementById("moon-v2-live-layout");
  if(!liveSourceCss.has(doc))
    liveSourceCss.set(doc,sheet?.textContent||"");
  if(!sheet){
    sheet=doc.createElement("style");sheet.id="moon-v2-live-layout";
    doc.head.append(sheet);
  }
  const existing=liveSourceCss.get(doc),next=liveLayoutRules(patches);
  sheet.textContent=[existing,next].filter(Boolean).join("\n");
}
function addedPatchFromNode(node,selector=liveSelector(node)){
  if(!node||!LIVE_ADDED_ID.test(selector))return null;
  let geometry,appearance,design,imageCrop,pictureEffects;
  try{pictureEffects=JSON.parse(node.getAttribute("data-moon-v2-picture-effects")||"{}");}
  catch{pictureEffects={};}
  try{imageCrop=JSON.parse(node.getAttribute("data-moon-v2-added-crop")||"{}");}
  catch{imageCrop={};}
  try{geometry=JSON.parse(node.getAttribute("data-moon-v2-added-geometry")||"{}");}
  catch{geometry={};}
  try{appearance=JSON.parse(node.getAttribute("data-moon-v2-added-appearance")||"{}");}
  catch{appearance={};}
  try{design=JSON.parse(node.getAttribute("data-moon-v2-added-design")||"{}");}
  catch{design={};}
  const patch={selector,kind:"insert",expected:"",
    objectType:node.getAttribute("data-moon-v2-object-type")||
      (node.tagName==="IMG"?"image":node.tagName==="P"?"text":"shape"),
    geometry,appearance,design,
    ...(node.tagName==="IMG"?{src:node.getAttribute("src")||"",alt:node.alt||"",
      ...(Object.keys(imageCrop).length?{imageCrop}:{}),
      ...(Object.keys(pictureEffects).length?{pictureEffects}:{})}:
      node.tagName==="P"?{html:cleanRich(node.innerHTML)}:
      {fill:node.getAttribute("data-moon-v2-shape-fill")||"#e1eee4"})};
  return validAddedPatch(patch)?patch:null;
}
function livePatchForSelected(){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(!selector)return null;
  const existing=livePatches.get(selector);
  if(existing)return copy(existing);
  if(LIVE_ADDED_ID.test(selector))return addedPatchFromNode(node,selector);
  if(node.tagName==="IMG")
    return {selector,kind:"image",expected:node.getAttribute("src")||"",
      src:node.getAttribute("src")||"",alt:node.alt||""};
  // A geometry or appearance adjustment must never rewrite the source
  // paragraph's links, span attributes or other original child markup.
  // A text patch is created only when the user explicitly edits the text.
  return {selector,kind:"layout",expected:(node.textContent||"").trim().slice(0,300)};
}
function liveSnapshot(){return copy([...livePatches.values()]);}
function recordLiveHistory(before){
  if(JSON.stringify(before)===JSON.stringify(liveSnapshot()))return false;
  liveHistory.push(before);
  if(liveHistory.length>60)liveHistory.shift();
  liveRedo.length=0;
  storeLiveDraft();refreshUndo();
  return true;
}
function liveUndoAction(again=false){
  finishCropSliderPreview();finishPictureEffectPreview();
  const from=again?liveRedo:liveHistory,to=again?liveHistory:liveRedo;
  if(!from.length)return;
  if(liveEditing)saveLiveText();
  const view=$("livePageFrame").contentWindow;
  const selectedNode=liveSelected?.node;
  pendingLiveViewRestore={
    page:currentPage,x:view?.scrollX||0,y:view?.scrollY||0,
    addedSelection:[...liveAddedMulti],
    sourceSelection:[...liveSourceMulti],
    selector:selectedNode&&liveSelector(selectedNode),
    tag:selectedNode?.tagName,
    text:selectedNode?.tagName==="IMG"?
      selectedNode.getAttribute("src"):(selectedNode?.textContent||"").trim().slice(0,300)
  };
  to.push(liveSnapshot());
  livePatches=new Map(from.pop().map(p=>[p.selector,p]));
  storeLiveDraft();refreshUndo();loadLivePage();
}
function applyLiveLayoutInput(key,value){
  if(preventLockedLiveGeometry())return;
  const patch=livePatchForSelected();if(!patch)return;
  if(patch.kind==="insert"){
    const geometry=addedDeviceGeometry(patch,liveDevice()),v=Number(value);
    if(!Number.isFinite(v))return;
    const before=liveSnapshot();
    const field=key==="dx"?"x":key==="dy"?"y":key==="sx"?"w":key==="sy"?"h":null;
    if(!field)return;
    const next={...geometry};
    next[field]=field==="w"||field==="h"?
      Math.round(clamp(geometry[field]*v,field==="w"?40:24,field==="w"?4000:5000)):
      Math.round(clamp(v,-4000,field==="y"?40000:10000));
    patch.geometry={...patch.geometry,[liveDevice()]:next};
    livePatches.set(patch.selector,patch);
    if(recordLiveHistory(before)){
      refreshAddedObject(liveSelected.node.ownerDocument,patch);
      renderLiveInspector();syncLiveOverlay();
    }
    return;
  }
  // Both text and image objects may scale visually, leaving their original
  // layout footprints unchanged so neighbouring website content stays put.
  const min=["sx","sy"].includes(key)?.2:-4000;
  const max=["sx","sy"].includes(key)?5:4000;
  const next=clamp(Number(value),min,max);
  if(!Number.isFinite(Number(value)))return;
  const before=liveSnapshot();
  const device=liveDevice();
  patch.layout={...patch.layout,[device]:{...liveLayoutFor(patch.selector),[key]:next}};
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();}
}
function resizableBoxFromDrag(base,direction,dx,dy,lockRatio=false,
  minW=40,minH=24,maxW=4000,maxH=5000){
  // Geometry-based resizing. No scaleX/scaleY and no glyph distortion.
  const west=direction.includes("w"),east=direction.includes("e");
  const north=direction.includes("n"),south=direction.includes("s");
  const width=clamp(base.w+(east?dx:0)-(west?dx:0),minW,maxW);
  const height=clamp(base.h+(south?dy:0)-(north?dy:0),minH,maxH);
  let w=width,h=height;
  if(lockRatio&&base.w>0&&base.h>0){
    const ratio=base.w/base.h;
    if((west||east)&&(north||south)){
      if(Math.abs(width-base.w)>=Math.abs(height-base.h)*ratio)
        h=clamp(Math.round(width/ratio),minH,maxH);
      else w=clamp(Math.round(height*ratio),minW,maxW);
    }else if(west||east)h=clamp(Math.round(w/ratio),minH,maxH);
    else if(north||south)w=clamp(Math.round(h*ratio),minW,maxW);
    // Clamp again together to preserve the aspect ratio at size limits.
    if(w/h>ratio+0.01)w=clamp(Math.round(h*ratio),minW,maxW);
    if(w/h<ratio-0.01)h=clamp(Math.round(w/ratio),minH,maxH);
  }
  let x=base.x+(west?base.w-w:0),y=base.y+(north?base.h-h:0);
  if(lockRatio){
    if(!(west||east))x+=Math.round((base.w-w)/2);
    if(!(north||south))y+=Math.round((base.h-h)/2);
  }
  return {x:Math.round(x),y:Math.round(y),
    w:Math.round(w),h:Math.round(h)};
}
function normaliseElementBoxLayout(node,layout){
  const rect=node.getBoundingClientRect();
  return {...layout,
    wrapWidth:Math.round(clamp(layout.wrapWidth??rect.width,64,4000)),
    reserveHeight:Math.round(clamp(layout.reserveHeight??rect.height,24,5000)),
    sx:clamp(1/(layout.osx||1),.2,5),
    sy:clamp(1/(layout.osy||1),.2,5)};
}
const LIVE_REFLOW_TEXT="h1,h2,h3,h4,h5,h6,p,blockquote,figcaption";
function normaliseTextBoxLayout(node,layout){
  // Preserve the rendered text-box dimensions when migrating an old
  // scale-based edit to a real width/height edit. Clear CSS scale on both
  // axes so glyphs are never stretched by future text resizing.
  return normaliseElementBoxLayout(node,layout);
}
function setLiveObjectDesign(key,value){
  if(workspaceMode!=="live"||liveEditing)return;
  const node=liveSelected?.node,patch=livePatchForSelected();
  if(!node||patch?.kind!=="insert")return;
  const design={...DEFAULT_LIVE_OBJECT_DESIGN,...(patch.design||{})};
  if(key==="fill"){
    if(patch.objectType!=="shape"||!/^#[0-9a-f]{6}$/i.test(value))return;
    patch.fill=value.toLowerCase();
  }else if(key==="shape"){
    if(patch.objectType!=="shape"||!LIVE_SHAPE_TYPES.includes(value))return;
    design.shape=value;
  }else if(key==="imageFit"){
    if(patch.objectType!=="image"||!["contain","cover"].includes(value))return;
    design.imageFit=value;
  }else if(key==="borderColour"){
    if(!/^#[0-9a-f]{6}$/i.test(value))return;
    design.borderColour=value.toLowerCase();
  }else{
    const limits={rotation:[-180,180],opacity:[0,100],radius:[0,200],borderWidth:[0,30]};
    const range=limits[key],number=Number(value);
    if(!range||!Number.isInteger(number)||number<range[0]||number>range[1])return;
    design[key]=number;
  }
  if(!validAddedDesign(design))return;
  const before=liveSnapshot();
  patch.design=design;
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){
    refreshAddedObject(node.ownerDocument,patch);
    renderLiveInspector();syncLiveOverlay();
    status("Object appearance updated · Undo available · Preview matches publication CSS");
  }
}
function resetLiveObjectDesign(){
  if(workspaceMode!=="live"||liveEditing)return;
  const node=liveSelected?.node,patch=livePatchForSelected();
  if(!node||patch?.kind!=="insert")return;
  const before=liveSnapshot();
  delete patch.design;
  if(patch.objectType==="shape")patch.fill="#e1eee4";
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){
    refreshAddedObject(node.ownerDocument,patch);
    renderLiveInspector();syncLiveOverlay();
  }
}
// Always provide the real displayed frame size and intrinsic image ratio.
// Without these there is no independent picture layer or zoomable crop.
function prepareImageCrop(node,patch,device=liveDevice()){
  const rect=node.getBoundingClientRect();
  const nw=node.naturalWidth||Number(node.getAttribute("width"));
  const nh=node.naturalHeight||Number(node.getAttribute("height"));
  const ratio=nw>0&&nh>0?nw/nh:
    Math.max(.01,rect.width/Math.max(1,rect.height));
  if(!Number.isFinite(ratio)||!rect.width||!rect.height)return null;
  const crop={...selectedImageCrop(patch,device)};
  crop.ratio=Math.round(clamp(ratio,.01,100)*100000)/100000;
  crop.zoom=Math.round(clamp(crop.zoom||100,100,500));
  if(!crop.baseW){
    const fitWidth=Math.max(rect.width,rect.height*ratio);
    crop.baseW=Math.round(clamp(fitWidth,24,15000)*1000)/1000;
  }
  if(patch.kind!=="insert"){
    const layout=normaliseElementBoxLayout(node,liveLayoutFor(patch.selector));
    if(!layout.wrapWidth||!layout.reserveHeight)return null;
    patch.layout={...patch.layout,[device]:layout};
  }
  return crop;
}
// Non-destructive image cropping. The original photo remains accessible.
function applySelectedImageCrop(changes){
  finishCropSliderPreview();
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(workspaceMode!=="live"||node?.tagName!=="IMG"||!selector||liveEditing)return false;
  const patch=livePatchForSelected();if(!patch)return false;
  const device=liveDevice(),before=liveSnapshot();
  const prepared=prepareImageCrop(node,patch,device);
  if(!prepared){status("Image dimensions are not yet ready for cropping");return false;}
  const next={...prepared,...changes,reset:false};
  if(changes.mask!==undefined)Object.assign(next,{
    left:next.left||0,right:next.right||0,
    top:next.top||0,bottom:next.bottom||0,fit:"contain"
  });
  if(!["contain","cover"].includes(next.fit)||
     !["rectangle","rounded","round-large","pill","circle","oval","squircle","diamond","hexagon","octagon","triangle","pentagon","star","heart","arch"].includes(next.mask)||
     !["x","y"].every(k=>Number.isFinite(Number(next[k]))))return false;
  next.x=Math.round(clamp(Number(next.x),0,100));
  next.y=Math.round(clamp(Number(next.y),0,100));
  next.zoom=Math.round(clamp(Number(next.zoom)||100,100,500));
  patch.imageCrop={...(patch.imageCrop||{}),[device]:next};
  livePatches.set(selector,patch);
  if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
  else refreshLiveLayoutRules(node.ownerDocument);
  if(recordLiveHistory(before)){
    renderLiveInspector();syncLiveOverlay();
    status("Photo framing updated for "+device+" · Original photo preserved · Undo available");
    return true;
  }
  return false;
}
function previewSelectedImageCrop(changes){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(workspaceMode!=="live"||node?.tagName!=="IMG"||!selector||liveEditing)return;
  const device=liveDevice(),key=selector+"@"+device;
  if(liveCropSliderBefore&&liveCropSliderKey!==key)finishCropSliderPreview();
  const patch=livePatchForSelected();if(!patch)return;
  const prepared=prepareImageCrop(node,patch,device);
  if(!prepared)return;
  const crop={...prepared,...changes,reset:false};
  if(!["contain","cover"].includes(crop.fit)||
     !["rectangle","rounded","round-large","pill","circle","oval","squircle","diamond","hexagon","octagon","triangle","pentagon","star","heart","arch"].includes(crop.mask))return;
  crop.x=Math.round(clamp(Number(crop.x),0,100));
  crop.y=Math.round(clamp(Number(crop.y),0,100));
  crop.zoom=Math.round(clamp(Number(crop.zoom)||100,100,500));
  if(!Number.isFinite(crop.x)||!Number.isFinite(crop.y))return;
  if(!liveCropSliderBefore){
    liveCropSliderBefore=liveSnapshot();
    liveCropSliderKey=key;
  }
  patch.imageCrop={...(patch.imageCrop||{}),[device]:crop};
  livePatches.set(selector,patch);
  if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
  else refreshLiveLayoutRules(node.ownerDocument);
  if(liveCropMode)syncLiveOverlay();
}
function finishCropSliderPreview(){
  if(!liveCropSliderBefore)return;
  const before=liveCropSliderBefore;
  liveCropSliderBefore=null;liveCropSliderKey="";
  if(recordLiveHistory(before)){
    renderLiveInspector();syncLiveOverlay();
    status("Crop position saved · Undo restores its previous framing");
  }
}
function liveFormatKind(node){
  if(!node||!liveSelector(node))return null;
  if(node.tagName==="IMG")return "image";
  const key=liveSelector(node),added=LIVE_ADDED_ID.test(key);
  if(added){
    const patch=livePatches.get(key)||addedPatchFromNode(node,key);
    return patch?.objectType==="shape"?"shape":
      patch?.objectType==="text"?"text":null;
  }
  return node.matches("h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption")?
    "text":null;
}
function copyLiveFormat(){
  const node=liveSelected?.node,kind=liveFormatKind(node);
  if(!kind)return;
  const patch=livePatchForSelected();if(!patch)return;
  let copied={kind};
  if(kind==="image"){
    copied={kind,pictureEffects:copy(selectedPictureEffects(patch)),
      mask:selectedImageCrop(patch).mask};
  }else if(kind==="shape"){
    copied={kind,design:copy(patch.design||{}),fill:patch.fill};
  }else{
    const css=node.ownerDocument.defaultView.getComputedStyle(node);
    const appearance={...(patch.appearance||{})};
    if(!appearance.fontSize)
      appearance.fontSize=Math.round(clamp(parseFloat(css.fontSize)||18,10,120));
    if(!appearance.family&&LIVE_FONT_OPTIONS.has(css.fontFamily))
      appearance.family=css.fontFamily;
    if(!appearance.color)appearance.color=hexColour(css.color,"#1c2622");
    if(!appearance.weight)
      appearance.weight=parseInt(css.fontWeight,10)>=600?"bold":"normal";
    if(!appearance.style)appearance.style=css.fontStyle==="italic"?"italic":"normal";
    if(!appearance.align&&["left","center","right","justify"].includes(css.textAlign))
      appearance.align=css.textAlign;
    if(!appearance.decoration)
      appearance.decoration=(css.textDecorationLine||"").includes("underline")?"underline":"none";
    if(!appearance.backgroundColor&&
       css.backgroundColor!=="transparent"&&!/rgba?\(0, 0, 0, 0\)/.test(css.backgroundColor))
      appearance.backgroundColor=hexColour(css.backgroundColor,"#ffffff");
    delete appearance.layer;
    copied={kind,appearance};
  }
  liveFormatClipboard=copied;
  renderLiveInspector();
  status("Formatting copied · Select another "+kind+" and choose Paste formatting");
}
function pasteLiveFormat(){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(!selector||!liveFormatClipboard||
     liveFormatKind(node)!==liveFormatClipboard.kind)return;
  const patch=livePatchForSelected(),device=liveDevice();
  if(!patch)return;
  const before=liveSnapshot(),clipboard=liveFormatClipboard;
  if(clipboard.kind==="image"){
    migrateLegacyAddedPictureDesign(patch);
    if(patch.kind!=="insert"&&!patch.layout?.[device])
      patch.layout={...(patch.layout||{}),[device]:liveLayoutFor(selector)};
    if(patch.kind==="insert"&&patch.design?.rotation)
      patch.design={...patch.design,rotation:0};
    patch.pictureEffects={...(patch.pictureEffects||{}),
      [device]:copy(clipboard.pictureEffects)};
    // Mask shape travels with appearance, but independently cropped sides
    // and source-image content are left unchanged.
    const prepared=prepareImageCrop(node,patch,device);
    if(prepared){
      patch.imageCrop={...(patch.imageCrop||{}),
        [device]:{...prepared,mask:clipboard.mask,reset:false}};
    }
  }else if(clipboard.kind==="shape"){
    if(patch.kind!=="insert")return;
    patch.design=copy(clipboard.design);
    patch.fill=clipboard.fill;
  }else{
    patch.appearance={...(patch.appearance||{}),...clipboard.appearance};
  }
  if(!validLivePatch(patch)){status("Copied format is not valid for this object");return;}
  livePatches.set(selector,patch);
  if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
  else refreshLiveLayoutRules(node.ownerDocument);
  if(recordLiveHistory(before)){
    renderLiveInspector();syncLiveOverlay();
    status("Formatting applied to "+clipboard.kind+" · Content and dimensions preserved · Undo available");
  }
}
function migrateLegacyAddedPictureDesign(patch){
  if(patch.kind!=="insert"||patch.objectType!=="image")return;
  const rotation=patch.design?.rotation||0,opacity=patch.design?.opacity??100;
  if(rotation===0&&opacity===100)return;
  const effects={...(patch.pictureEffects||{})};
  for(const device of Object.keys(LIVE_DEVICE_RULES)){
    const previous=effects[device]||{};
    effects[device]={
      ...DEFAULT_PICTURE_EFFECTS,rotation,opacity,...previous
    };
  }
  patch.pictureEffects=effects;
  patch.design={...patch.design,rotation:0,opacity:100};
}
function selectedPictureEffects(patch,device=liveDevice()){
  const node=liveSelected?.node;
  let base={};
  if(node?.tagName==="IMG"&&!LIVE_ADDED_ID.test(patch?.selector||"")){
    try{
      const stored=JSON.parse(node.getAttribute("data-moon-v2-picture-effects")||"{}");
      if(validPictureEffects(stored))base=stored[device]||{};
    }catch{/* Website image has no published editor effects. */}
  }
  const legacy=patch?.kind==="insert"&&patch.objectType==="image"?
    {rotation:patch.design?.rotation||0,opacity:patch.design?.opacity??100}:{};
  return {...DEFAULT_PICTURE_EFFECTS,...base,...legacy,...(patch?.pictureEffects?.[device]||{})};
}
function finishPictureEffectPreview(){
  if(!pictureFxBefore)return;
  const previous=pictureFxBefore;pictureFxBefore=null;
  if(recordLiveHistory(previous)){renderLiveInspector();syncLiveOverlay();}
}
function setPictureEffect(key,value,preview=false){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(workspaceMode!=="live"||node?.tagName!=="IMG"||!selector||liveEditing)return;
  const patch=livePatchForSelected();if(!patch)return;
  const device=liveDevice(),before=preview?
    (pictureFxBefore||liveSnapshot()):liveSnapshot();
  const current={...selectedPictureEffects(patch,device),[key]:value};
  if(!validPictureEffects({[device]:current}))return;
  if(preview&&!pictureFxBefore)pictureFxBefore=before;
  migrateLegacyAddedPictureDesign(patch);
  if(patch.kind!=="insert"&&!patch.layout?.[device]){
    patch.layout={...(patch.layout||{}),[device]:liveLayoutFor(selector)};
  }
  // The earlier inserted-object rotation is folded into this single
  // responsive rotation setting, so applying formatting never double-rotates.
  if(patch.kind==="insert"&&key==="rotation"&&patch.design?.rotation){
    patch.design={...patch.design,rotation:0};
  }
  patch.pictureEffects={...(patch.pictureEffects||{}),[device]:current};
  livePatches.set(selector,patch);
  if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
  else refreshLiveLayoutRules(node.ownerDocument);
  if(!preview&&recordLiveHistory(before)){
    renderLiveInspector();syncLiveOverlay();
    status("Picture format updated on "+device+" · Undo available");
  }
}
function resetPictureEffects(){
  finishPictureEffectPreview();
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(node?.tagName!=="IMG"||!selector)return;
  const patch=livePatchForSelected(),device=liveDevice();
  if(!patch)return;
  const before=liveSnapshot(),published=node.hasAttribute("data-moon-v2-picture-effects");
  migrateLegacyAddedPictureDesign(patch);
  if(published&&patch.kind!=="insert"){
    patch.pictureEffects={...(patch.pictureEffects||{}),
      [device]:{...DEFAULT_PICTURE_EFFECTS}};
  }else if(patch.pictureEffects){
    delete patch.pictureEffects[device];
    if(!Object.keys(patch.pictureEffects).length)delete patch.pictureEffects;
  }
  if(patch.kind!=="insert"&&pruneLivePatch(patch,node))livePatches.delete(selector);
  else livePatches.set(selector,patch);
  if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
  else refreshLiveLayoutRules(node.ownerDocument);
  if(recordLiveHistory(before)){
    renderLiveInspector();syncLiveOverlay();
    status("Picture effects reset for "+device+" · Crop remains unchanged");
  }
}
function setLiveCropMode(enabled){
  finishCropSliderPreview();
  const node=liveSelected?.node;
  if(node?.tagName!=="IMG"||workspaceMode!=="live")return;
  if(enabled&&liveSectionPickMode)toggleLiveSectionPickMode();
  liveCropMode=!!enabled;
  if(enabled){
    const existing=selectedImageCrop(livePatchForSelected());
    applySelectedImageCrop({
      ...croppedEdges(existing),fit:"contain",zoom:100
    });
  }
  removeLiveOverlay();renderLiveInspector();syncLiveOverlay();
  status(enabled?
    "Crop active · Drag pink handles to cut left, right, top and bottom independently":
    "Crop finished · Dragging the picture now moves its frame");
}
function nudgeLiveImageCrop(dx,dy){
  const patch=livePatchForSelected(),crop=selectedImageCrop(patch);
  if(liveSelected?.node?.tagName!=="IMG")return;
  applySelectedImageCrop({fit:"cover",x:clamp(crop.x+dx,0,100),
    y:clamp(crop.y+dy,0,100)});
}
function resetSelectedImageCrop(){
  finishCropSliderPreview();
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(node?.tagName!=="IMG"||!selector||workspaceMode!=="live")return;
  const patch=livePatchForSelected(),device=liveDevice();
  if(!patch?.imageCrop?.[device])return;
  const before=liveSnapshot(),frame=node.getBoundingClientRect();
  const edges=croppedEdges(selectedImageCrop(patch,device));
  const fullW=frame.width/Math.max(.05,1-(edges.left+edges.right)/100);
  const fullH=frame.height/Math.max(.05,1-(edges.top+edges.bottom)/100);
  const shiftX=Math.round(fullW*edges.left/100),shiftY=Math.round(fullH*edges.top/100);
  if(["left","right","top","bottom"].some(k=>edges[k]>0)){
    if(patch.kind==="insert"){
      const geom=addedDeviceGeometry(patch,device);
      patch.geometry={...patch.geometry,[device]:{...geom,
        x:Math.round(geom.x-shiftX),y:Math.round(geom.y-shiftY),
        w:Math.round(clamp(fullW,40,4000)),h:Math.round(clamp(fullH,24,5000))}};
    }else{
      const dims=normaliseElementBoxLayout(node,liveLayoutFor(selector));
      dims.wrapWidth=Math.round(clamp(fullW,64,4000));
      dims.reserveHeight=Math.round(clamp(fullH,24,5000));
      dims.dx=clamp(dims.dx-shiftX,-4000,4000);
      dims.dy=clamp(dims.dy-shiftY,-4000,4000);
      patch.layout={...patch.layout,[device]:dims};
    }
  }
  const published=!!node.getAttribute("data-moon-v2-image-crop");
  if(published&&patch.kind!=="insert"){
    // Previously published CSS cannot simply be deleted from the source.
    // Publish an explicit override to restore the uncropped original pixels.
    patch.imageCrop={...(patch.imageCrop||{}),
      [device]:{fit:"contain",x:50,y:50,zoom:100,mask:"rectangle",reset:true}};
  }else{
    delete patch.imageCrop[device];
    if(!Object.keys(patch.imageCrop).length)delete patch.imageCrop;
  }
  if(patch.kind!=="insert"&&pruneLivePatch(patch,node))livePatches.delete(selector);
  else livePatches.set(selector,patch);
  if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
  else refreshLiveLayoutRules(node.ownerDocument);
  liveCropMode=false;
  if(recordLiveHistory(before)){
    removeLiveOverlay();renderLiveInspector();syncLiveOverlay();
    status("Original picture framing restored on "+device+" · Undo available");
  }
}
// Frame handles remove independent strips of the ORIGINAL picture.
// Updating the frame geometry keeps the remaining crop rectangle aligned.
// No drag ever changes focal-position offsets when trimming a crop edge.
function cropFrameGeometry(rect,origin,dir,dx,dy){
  const crop={...origin,...croppedEdges(origin),fit:"contain",zoom:100,reset:false};
  const initial=croppedEdges(crop);
  const fullW=rect.width/Math.max(.05,1-(initial.left+initial.right)/100);
  const fullH=rect.height/Math.max(.05,1-(initial.top+initial.bottom)/100);
  const next={...crop};
  for(const [edge,delta,opposite,source,min] of [
    ["left",dx,"right",fullW,64],
    ["right",-dx,"left",fullW,64],
    ["top",dy,"bottom",fullH,24],
    ["bottom",-dy,"top",fullH,24]]){
    if(!dir.includes(({left:"w",right:"e",top:"n",bottom:"s"})[edge]))continue;
    const maximum=Math.min(90,95-next[opposite],100*(1-min/source)-next[opposite]);
    next[edge]=Math.round(clamp(initial[edge]+delta/source*100,0,Math.max(0,maximum))*100)/100;
  }
  const w=Math.round(clamp(fullW*(1-(next.left+next.right)/100),64,4000));
  const h=Math.round(clamp(fullH*(1-(next.top+next.bottom)/100),24,5000));
  const x=fullW*(next.left-initial.left)/100;
  const y=fullH*(next.top-initial.top)/100;
  return {crop:next,x:Math.round(x),y:Math.round(y),w,h};
}
function updateCropFrame(node,selector,originalPatch,initialRect,dir,dx,dy){
  const device=liveDevice(),patch=copy(originalPatch);
  const baseline=patch.imageCrop?.[device]||
    {...selectedImageCrop(patch,device),left:0,right:0,top:0,bottom:0};
  const result=cropFrameGeometry(initialRect,baseline,dir,dx,dy);
  patch.imageCrop={...(patch.imageCrop||{}),[device]:result.crop};
  if(patch.kind==="insert"){
    const initial=addedDeviceGeometry(originalPatch,device);
    patch.geometry={...patch.geometry,[device]:{
      ...initial,x:Math.round(initial.x+result.x),
      y:Math.round(initial.y+result.y),w:result.w,h:result.h
    }};
    livePatches.set(selector,patch);
    refreshAddedObject(node.ownerDocument,patch);
  }else{
    const old=liveLayoutFor(selector);
    const base=originalPatch.layout?.[device]||old;
    const layout=normaliseElementBoxLayout(node,base);
    layout.wrapWidth=result.w;layout.reserveHeight=result.h;
    layout.dx=clamp(Math.round(base.dx+result.x),-4000,4000);
    layout.dy=clamp(Math.round(base.dy+result.y),-4000,4000);
    patch.layout={...patch.layout,[device]:layout};
    livePatches.set(selector,patch);
    refreshLiveLayoutRules(node.ownerDocument);
    // Normal CSS flow may shift the original origin when the image shrinks.
    const actual=node.getBoundingClientRect();
    const wantX=initialRect.left+result.x,wantY=initialRect.top+result.y;
    const shiftX=Math.round(wantX-actual.left),shiftY=Math.round(wantY-actual.top);
    if(shiftX||shiftY){
      layout.dx=clamp(layout.dx+shiftX,-4000,4000);
      layout.dy=clamp(layout.dy+shiftY,-4000,4000);
      livePatches.set(selector,patch);
      refreshLiveLayoutRules(node.ownerDocument);
    }
  }
  return result;
}
function setCropEdge(side,value){
  if(!["left","right","top","bottom"].includes(side)||preventLockedLiveGeometry())return;
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(node?.tagName!=="IMG"||!selector||!Number.isFinite(Number(value)))return;
  finishCropSliderPreview();
  const base=livePatchForSelected(),before=liveSnapshot(),device=liveDevice();
  if(!base)return;
  const prepared=prepareImageCrop(node,base,device);
  if(!prepared)return;
  const current={...prepared,...croppedEdges(prepared)};
  base.imageCrop={...(base.imageCrop||{}),[device]:current};
  const frame=node.getBoundingClientRect(),fraction=
    side==="left"||side==="right"?
    frame.width/(1-(current.left+current.right)/100):
    frame.height/(1-(current.top+current.bottom)/100);
  const delta=(Number(value)-current[side])/100*fraction;
  const dir={left:"w",right:"e",top:"n",bottom:"s"}[side];
  updateCropFrame(node,selector,base,frame,dir,
    side==="left"?delta:side==="right"?-delta:0,
    side==="top"?delta:side==="bottom"?-delta:0);
  if(recordLiveHistory(before)){
    renderLiveInspector();syncLiveOverlay();
    status("Trimmed "+side+" edge · Other image sides unchanged · Undo available");
  }
}
function cropImageToRatio(ratio){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(node?.tagName!=="IMG"||!selector||workspaceMode!=="live"||
     !Number.isFinite(ratio)||ratio<=0||liveEditing)return;
  if(preventLockedLiveGeometry())return;
  const patch=livePatchForSelected();if(!patch)return;
  const before=liveSnapshot(),device=liveDevice();
  const prepared=prepareImageCrop(node,patch,device);
  if(!prepared)return;
  if(patch.kind==="insert"){
    const old=addedDeviceGeometry(patch,device);
    patch.geometry={...patch.geometry,[device]:
      {...old,h:Math.round(clamp(old.w/ratio,24,5000))}};
  }else{
    const layout=normaliseElementBoxLayout(node,liveLayoutFor(selector));
    layout.reserveHeight=Math.round(clamp(layout.wrapWidth/ratio,24,5000));
    patch.layout={...patch.layout,[device]:layout};
  }
  patch.imageCrop={...(patch.imageCrop||{}),
    [device]:{...prepared,fit:"cover",reset:false}};
  livePatches.set(selector,patch);
  if(patch.kind==="insert")refreshAddedObject(node.ownerDocument,patch);
  else refreshLiveLayoutRules(node.ownerDocument);
  if(recordLiveHistory(before)){
    renderLiveInspector();syncLiveOverlay();
    status("Picture frame aspect ratio updated · Pixels kept undistorted · Undo available");
  }
}
function setOriginalBoxDimension(key,value){
  if(preventLockedLiveGeometry())return;
  const node=liveSelected?.node,patch=livePatchForSelected();
  if(!node||!patch||patch.kind==="insert"||!["wrapWidth","reserveHeight"].includes(key))return;
  const number=Number(value);
  if(!Number.isFinite(number))return;
  const previous=liveSnapshot(),layout=normaliseElementBoxLayout(node,
    liveLayoutFor(patch.selector));
  layout[key]=Math.round(clamp(number,key==="wrapWidth"?64:24,
    key==="wrapWidth"?4000:5000));
  if(LIVE_CONTAINER_SET.has(node.tagName)){
    // Explicit height really changes the section box in both directions.
    // Changing only width still lets its content determine natural height.
    if(key==="reserveHeight")layout.sectionHeightMode="fixed";
    else if(layout.sectionHeightMode!=="fixed")layout.sectionHeightMode="auto";
  }
  if(node.tagName==="IMG"&&liveLockImageRatio){
    const rect=node.getBoundingClientRect(),ratio=
      (node.naturalWidth&&node.naturalHeight?
        node.naturalWidth/node.naturalHeight:rect.width/Math.max(1,rect.height))*
      (1-((selectedImageCrop(patch).left||0)+(selectedImageCrop(patch).right||0))/100)/
      (1-((selectedImageCrop(patch).top||0)+(selectedImageCrop(patch).bottom||0))/100);
    if(key==="wrapWidth")layout.reserveHeight=Math.round(clamp(layout.wrapWidth/ratio,24,5000));
    else layout.wrapWidth=Math.round(clamp(layout.reserveHeight*ratio,64,4000));
  }
  patch.layout={...patch.layout,[liveDevice()]:layout};
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(previous)){
    refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();
  }
}
function setLiveSectionHeightMode(mode){
  if(preventLockedLiveGeometry())return;
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(!node||!LIVE_CONTAINER_SET.has(node.tagName)||!selector||
     LIVE_ADDED_ID.test(selector)||workspaceMode!=="live"||liveEditing||
     !["auto","fixed"].includes(mode))return;
  const patch=livePatchForSelected(),before=liveSnapshot();
  const layout=normaliseElementBoxLayout(node,liveLayoutFor(selector));
  layout.sectionHeightMode=mode;
  // An explicit height starts at the current on-screen size, never a
  // surprising value inherited from an older minimum-height draft.
  if(mode==="fixed")layout.reserveHeight=Math.round(clamp(
    node.getBoundingClientRect().height,24,5000));
  patch.layout={...patch.layout,[liveDevice()]:layout};
  livePatches.set(selector,patch);
  if(recordLiveHistory(before)){
    refreshLiveLayoutRules(node.ownerDocument);
    renderLiveInspector();syncLiveOverlay();
    status(mode==="auto"?
      "Section height fitted to its content · Width preserved · Undo available":
      "Section height set to exact size · Drag top or bottom handles · Undo available");
  }
}
function setAddedDimension(key,value){
  if(preventLockedLiveGeometry())return;
  const node=liveSelected?.node,patch=livePatchForSelected();
  if(!node||patch?.kind!=="insert"||!["w","h"].includes(key))return;
  const parsed=Number(value);
  if(!Number.isFinite(parsed))return;
  const previous=liveSnapshot(),geo={...addedDeviceGeometry(patch,liveDevice())};
  const ratio=geo.w/Math.max(1,geo.h);
  geo[key]=Math.round(clamp(parsed,key==="w"?40:24,key==="w"?4000:5000));
  if(patch.objectType==="image"&&liveLockImageRatio){
    if(key==="w")geo.h=Math.round(clamp(geo.w/ratio,24,5000));
    else geo.w=Math.round(clamp(geo.h*ratio,40,4000));
  }
  patch.geometry={...patch.geometry,[liveDevice()]:geo};
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(previous)){
    refreshAddedObject(node.ownerDocument,patch);
    renderLiveInspector();syncLiveOverlay();
  }
}
function setLiveReflow(enabled){
  if(preventLockedLiveGeometry())return;
  const node=liveSelected?.node;
  if(!node?.matches("h1,h2,h3,h4,h5,h6,p,blockquote,figcaption"))return;
  const patch=livePatchForSelected();if(!patch)return;
  const before=liveSnapshot(),device=liveDevice();
  const layout=normaliseTextBoxLayout(node,liveLayoutFor(patch.selector));
  if(enabled){
    layout.wrapWidth=clamp(Math.round(node.getBoundingClientRect().width),64,4000);
    layout.reserveHeight=clamp(Math.round(node.getBoundingClientRect().height),24,5000);
  }else{
    // The legacy switch is kept for imported drafts. Text reflow remains
    // enabled by default whenever a user resizes a text element.
    delete layout.wrapWidth;delete layout.reserveHeight;
  }
  patch.layout={...patch.layout,[device]:layout};
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){
    refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();
  }
}
function setLiveReflowDimension(key,value){
  if(preventLockedLiveGeometry())return;
  const node=liveSelected?.node;
  if(!node?.matches("h1,h2,h3,h4,h5,h6,p,blockquote,figcaption"))return;
  const patch=livePatchForSelected();if(!patch)return;
  if(patch.kind==="insert"){
    const n=Number(value);if(!Number.isFinite(n))return;
    const before=liveSnapshot(),geometry={...addedDeviceGeometry(patch,liveDevice())};
    geometry[key==="wrapWidth"?"w":"h"]=Math.round(clamp(n,key==="wrapWidth"?40:24,
      key==="wrapWidth"?4000:5000));
    patch.geometry={...patch.geometry,[liveDevice()]:geometry};
    livePatches.set(patch.selector,patch);
    if(recordLiveHistory(before)){
      refreshAddedObject(node.ownerDocument,patch);renderLiveInspector();syncLiveOverlay();
    }
    return;
  }
  const layout=normaliseTextBoxLayout(node,liveLayoutFor(patch.selector));
  const number=Number(value);
  if(!Number.isFinite(number))return;
  const before=liveSnapshot();
  layout[key]=Math.round(clamp(number,key==="wrapWidth"?64:24,
    key==="wrapWidth"?4000:5000));
  patch.layout={...patch.layout,[liveDevice()]:layout};
  livePatches.set(patch.selector,patch);
  if(key==="wrapWidth"){
    // Numeric inspector resizing should behave like the canvas grips:
    // preserve glyph size, rewrap text, and reserve its actual height.
    refreshLiveLayoutRules(node.ownerDocument);
    const needed=Math.ceil(node.scrollHeight+2);
    if(Number.isFinite(needed)&&needed>layout.reserveHeight&&needed<=5000){
      layout.reserveHeight=needed;
      patch.layout[liveDevice()]=layout;
      livePatches.set(patch.selector,patch);
    }
  }
  if(recordLiveHistory(before)){
    refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();
  }
}
function resetLiveTextDimensions(){
  if(preventLockedLiveGeometry())return;
  const node=liveSelected?.node;
  if(!node?.matches(LIVE_REFLOW_TEXT)||workspaceMode!=="live")return;
  const patch=livePatchForSelected(),device=liveDevice();
  if(!patch||patch.kind==="insert"||!patch.layout?.[device])return;
  const before=liveSnapshot(),next={...patch.layout[device]};
  delete next.wrapWidth;delete next.reserveHeight;
  // The original source transform is restored while the user's dx/dy
  // remain. Natural size can be restored without jumping back in position.
  next.sx=1;next.sy=1;
  patch.layout[device]=next;
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){
    refreshLiveLayoutRules(node.ownerDocument);renderLiveInspector();syncLiveOverlay();
    status("Natural text dimensions restored · Position preserved · Undo available");
  }
}
function fitLiveTextHeight(){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(!selector||!node||!node.matches("h1,h2,h3,h4,h5,h6,p,blockquote,figcaption"))return;
  const entry=liveLayoutFor(selector);
  const wanted=Math.round(clamp(Math.ceil(node.scrollHeight+2),24,5000));
  if(wanted<=entry.reserveHeight)return;
  setLiveReflowDimension("reserveHeight",wanted);
  status("Text box height fitted to wrapped content · Following page elements may move");
}
function resetSelectedLiveLayout(){
  if(preventLockedLiveGeometry())return;
  const patch=livePatchForSelected();
  if(patch?.kind==="insert"){
    const current=addedDeviceGeometry(patch,liveDevice());
    const all=addedDeviceGeometry(patch,"desktop");
    if(!current||!all)return;
    const before=liveSnapshot();
    patch.geometry[liveDevice()]={...all,x:clamp(all.x,12,2500)};
    livePatches.set(patch.selector,patch);
    if(recordLiveHistory(before)){
      refreshAddedObject(liveSelected.node.ownerDocument,patch);
      renderLiveInspector();syncLiveOverlay();
    }
    return;
  }
  if(!patch?.layout?.[liveDevice()])return;
  const before=liveSnapshot();
  delete patch.layout[liveDevice()];
  if(!Object.keys(patch.layout).length)delete patch.layout;
  if(pruneLivePatch(patch,liveSelected.node))
    livePatches.delete(patch.selector);
  else livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();}
}
function validLivePatch(p){
  if(p?.kind==="insert")return validAddedPatch(p);
  if(p?.kind==="remove-added")
    return LIVE_ADDED_ID.test(p.selector)&&p.expected==="";
  return p&&typeof p.selector==="string"&&p.selector.length<1600&&
    /^main(?: > [a-z][a-z0-9-]*:nth-of-type\(\d{1,4}\)){1,24}$/.test(p.selector)&&
    typeof p.expected==="string"&&p.expected.length<=350&&
    (p.kind==="text"&&typeof p.html==="string"&&p.html.length<=70000||
     p.kind==="image"&&safeImageSource(p.src)&&typeof p.alt==="string"&&p.alt.length<=300||
     p.kind==="layout"||p.kind==="delete")&&
    (p.tag===undefined||/^(?:h[1-6]|p|li|figcaption|blockquote|img|section|article|aside|figure|div|nav|ul|ol)$/.test(p.tag))&&
    (p.layout===undefined||validLiveLayout(p.layout))&&
    (p.appearance===undefined||validLiveAppearance(p.appearance))&&
    (p.imageCrop===undefined||
      (p.kind==="image"||p.kind==="layout")&&p.tag!=="section"&&
      validImageCropMap(p.imageCrop))&&
    (p.pictureEffects===undefined||
      (p.kind==="image"||p.kind==="layout")&&
      validPictureEffects(p.pictureEffects));
}
function liveGeometryIsLocked(selector){
  return !!selector&&livePositionLocks.has(selector);
}
function liveSelectionHasGeometryLock(){
  const keys=[...liveAddedMulti,...liveSourceMulti];
  if(!keys.length&&liveSelected?.node)keys.push(liveSelector(liveSelected.node));
  return keys.some(liveGeometryIsLocked);
}
function preventLockedLiveGeometry(){
  if(!liveSelectionHasGeometryLock())return false;
  status("Object position and size locked · Unlock it to move or resize");
  renderLiveInspector();
  return true;
}
function toggleLiveGeometryLock(){
  const selector=liveSelected?.node&&liveSelector(liveSelected.node);
  if(!selector||workspaceMode!=="live"||liveEditing||liveGesture)return;
  const wasLocked=liveGeometryIsLocked(selector);
  if(wasLocked)livePositionLocks.delete(selector);
  else livePositionLocks.add(selector);
  try{localStorage.setItem(LIVE_POSITION_LOCK_KEY+currentPage,
    JSON.stringify([...livePositionLocks]));}
  catch{status("Could not save position lock in this browser");}
  renderLiveInspector();syncLiveOverlay();renderLiveLayers();syncLiveMultiSelection();
  status(wasLocked?"Position and size unlocked":"Position and size locked · Local to this browser");
}
function loadLiveDraft(page){
  livePatches=new Map();liveHistory=[];liveRedo=[];
  livePositionLocks=new Set();
  try{
    const ids=JSON.parse(localStorage.getItem(LIVE_POSITION_LOCK_KEY+page)||"[]");
    if(Array.isArray(ids)&&ids.length<=350)
      for(const selector of ids)
        if(typeof selector==="string"&&selector.length<=1600&&
          (LIVE_ADDED_ID.test(selector)||
            validLivePatch({selector,kind:"layout",expected:""})))
          livePositionLocks.add(selector);
  }catch{}
  try{
    const patches=JSON.parse(localStorage.getItem(LIVE_DRAFT_KEY+page)||"[]");
    if(!Array.isArray(patches)||patches.length>180)return;
    for(const patch of patches){
      if(validLivePatch(patch))livePatches.set(patch.selector,patch);
    }
  }catch{}
}
function renderLiveEditCount(){
  $("liveEditCount").textContent=livePatches.size?
    livePatches.size+" saved edit"+(livePatches.size===1?"":"s")+
      " · Original website unchanged":
    "No saved live-page edits. Original website unchanged.";
}
function storeLiveDraft(){
  try{
    localStorage.setItem(LIVE_DRAFT_KEY+currentPage,
      JSON.stringify([...livePatches.values()]));
    status("Original-layout edits saved locally · Website unchanged");
  }catch{status("Local draft could not be saved · Export the edited HTML");}
  renderLiveEditCount();
}
function renderLiveInspector(){
  const live=workspaceMode==="live",sel=liveSelected;
  $("liveInspector").hidden=!live;
  const node=sel?.node,tag=node?.tagName;
  $("liveSelectionLabel").textContent=node?
    tag.toLowerCase()+" · "+(node.alt||node.textContent||"").trim()
      .replace(/\s+/g," ").slice(0,95):
    "Choose a heading, paragraph or image in the live website.";
  $("liveTextControls").hidden=!node||tag==="IMG"||LIVE_CONTAINER_SET.has(tag);
  $("liveImageControls").hidden=!node||tag!=="IMG";
  $("liveCopyFormat").disabled=!liveFormatKind(node);
  $("livePasteFormat").disabled=!liveFormatClipboard||
    liveFormatKind(node)!==liveFormatClipboard.kind;
  $("editLiveText").disabled=!node||tag==="IMG"||LIVE_CONTAINER_SET.has(tag)||!!liveEditing;
  $("saveLiveText").disabled=!liveEditing;
  $("cancelLiveText").disabled=!liveEditing;
  if(node&&tag==="IMG"&&!liveEditing){
    $("liveImageSrc").value=node.getAttribute("src")||"";
    $("liveImageAlt").value=node.alt||"";
  }
  const selector=node&&liveSelector(node);
  $("revertLiveElement").disabled=!selector||!livePatches.has(selector);
  $("deleteLiveElement").disabled=!node||!selector||!!liveEditing;
  refreshUndo();
  $("liveLayoutControls").hidden=!node;
  $("liveImageSizing").hidden=tag!=="IMG";
  $("liveCropControls").hidden=tag!=="IMG";
  $("livePictureFormat").hidden=tag!=="IMG";
  if(tag==="IMG"){
    const fx=selectedPictureEffects(livePatchForSelected());
    $("livePictureRotation").value=String(fx.rotation);
    $("livePictureOpacity").value=String(fx.opacity);
    $("livePictureFlipH").setAttribute("aria-pressed",String(fx.flipH));
    $("livePictureFlipV").setAttribute("aria-pressed",String(fx.flipV));
    for(const key of ["brightness","contrast","saturation","blur"]){
      const capital=key[0].toUpperCase()+key.slice(1);
      $("livePicture"+capital).value=String(fx[key]);
      $("livePicture"+capital+"Value").textContent=fx[key]+(key==="blur"?"px":"%");
    }
    $("livePictureShadow").checked=fx.shadow;
  }
  $("cropImageTool").disabled=!live||tag!=="IMG"||!!liveEditing;
  $("cropImageTool").setAttribute("aria-pressed",String(liveCropMode&&tag==="IMG"));
  $("cropImageTool").classList.toggle("active",liveCropMode&&tag==="IMG");
  $("liveLockImageRatio").checked=liveLockImageRatio;
  $("liveLockImageRatio").disabled=tag==="IMG"&&liveCropMode;
  if(tag==="IMG"){
    const crop=selectedImageCrop(livePatchForSelected());
    $("liveCropFit").value=crop.fit;
    $("liveCropShape").value=crop.mask;
    $("liveCropX").value=String(crop.x);
    $("liveCropY").value=String(crop.y);
    for(const [side,name] of [["left","Left"],["right","Right"],["top","Top"],["bottom","Bottom"]]){
      const amount=Math.round(crop[side]||0);
      $("liveCrop"+name).value=String(amount);
      $("liveCrop"+name+"Value").textContent=amount+"%";
    }
    $("liveCropZoom").value=String(crop.zoom||100);
    $("liveCropZoomValue").textContent=(crop.zoom||100)+"%";
    $("liveCropXValue").textContent=crop.x+"%";
    $("liveCropYValue").textContent=crop.y+"%";
    $("liveCropToggle").setAttribute("aria-pressed",String(liveCropMode));
    $("liveCropToggle").textContent=liveCropMode?"Finish crop":"Crop picture · drag to reframe";
    $("liveCropReset").disabled=!livePatchForSelected()?.imageCrop?.[liveDevice()];
  }
  // The unified crop inspector handles image fitting for both original
  // and inserted photographs. Keep the legacy control for old drafts only.
  $("liveAddedImageFit").hidden=true;
  if(tag==="IMG"&&LIVE_ADDED_ID.test(selector)){
    const imagePatch=livePatchForSelected();
    $("liveImageFit").value=imagePatch?.design?.imageFit||"contain";
  }
  const added=!!selector&&LIVE_ADDED_ID.test(selector);
  const sectionBox=!!node&&!added&&LIVE_CONTAINER_SET.has(tag);
  $("liveSectionSizing").hidden=!sectionBox;
  if(sectionBox){
    const layout=liveLayoutFor(selector);
    $("liveSectionHeightMode").value=layout.sectionHeightMode==="fixed"?"fixed":"auto";
    const overflow=Math.max(0,Math.ceil(node.scrollHeight-node.clientHeight));
    $("liveSectionOverflow").hidden=overflow<=4;
    $("liveSectionOverflow").textContent=overflow>4?
      "Some section content extends beyond this height by about "+overflow+
        "px. Increase the height or choose Fit content before publishing.":"";
  }
  const originalBox=!!node&&!added&&!node.matches(LIVE_REFLOW_TEXT);
  $("liveOriginalDimensions").hidden=!originalBox;
  if(originalBox){
    const dims=liveLayoutFor(selector),rect=node.getBoundingClientRect();
    $("liveOriginalWidth").value=String(Math.round(dims.wrapWidth??rect.width));
    $("liveOriginalHeight").value=String(Math.round(dims.reserveHeight??rect.height));
  }
  $("liveAddedDimensions").hidden=!added;
  $("liveObjectDesign").hidden=!added;
  if(added){
    const data=livePatchForSelected(),g=data&&addedDeviceGeometry(data,liveDevice());
    const design={...DEFAULT_LIVE_OBJECT_DESIGN,...(data?.design||{})};
    $("liveShapeOptions").hidden=data?.objectType!=="shape";
    $("liveShapeType").value=design.shape;
    $("liveShapeFill").value=data?.fill||"#e1eee4";
    $("liveObjectRotation").value=String(design.rotation);
    $("liveObjectOpacity").value=String(design.opacity);
    $("liveObjectRadius").value=String(design.radius);
    $("liveObjectBorderWidth").value=String(design.borderWidth);
    $("liveObjectBorderColour").value=design.borderColour;
    $("liveAddedWidth").value=String(g?.w||Math.round(node.getBoundingClientRect().width));
    $("liveAddedHeight").value=String(g?.h||Math.round(node.getBoundingClientRect().height));
  }
  const isSource=!!node&&!!selector&&!LIVE_ADDED_ID.test(selector);
  $("liveSelectParent").disabled=!isSource||!eligibleLiveParent(node)||!!liveEditing;
  $("liveSelectSection").disabled=!isSource||!liveSectionAncestor(node)||!!liveEditing;
  $("liveSelectChild").disabled=!isSource||!node.querySelector(LIVE_SELECTABLE_TAGS)||!!liveEditing;
  const siblingChoices=isSource?liveSiblingChoices(node):[];
  const siblingIndex=siblingChoices.indexOf(node);
  $("livePrevSibling").disabled=!isSource||siblingIndex<=0||!!liveEditing;
  $("liveNextSibling").disabled=!isSource||siblingIndex<0||
    siblingIndex===siblingChoices.length-1||!!liveEditing;
  $("liveLocateSelected").disabled=!node||!!liveEditing;
  $("liveElementPath").textContent=isSource?
    "main › "+selector.split(" > ").slice(1)
      .map(part=>part.split(":nth-of-type(")[0]).join(" › "):
    node?"Added independent object":"Select an element to see its hierarchy";
  $("liveReleaseClipSection").hidden=!isSource;
  $("liveReleaseClip").checked=isSource&&
    livePatches.get(selector)?.layout?.[liveDevice()]?.releaseClip===true;
  $("liveReleaseClip").disabled=!isSource||!!liveEditing;
  const locked=liveGeometryIsLocked(selector);
  $("liveTogglePositionLock").disabled=!node||!!liveEditing;
  $("liveTogglePositionLock").textContent=locked?"Unlock position & size":"Lock position & size";
  $("liveTogglePositionLock").setAttribute("aria-pressed",String(locked));
  for(const id of ["liveMoveX","liveMoveY","liveOriginalWidth","liveOriginalHeight",
    "liveAddedWidth","liveAddedHeight","liveTextBoxWidth","liveTextBoxHeight",
    "liveFitReflowHeight","liveResetTextDimensions","resetLiveLayout"])
    $(id).disabled=locked;
  $("liveBringFront").disabled=!node||!!liveEditing;
  $("liveSendBack").disabled=!node||!!liveEditing;
  $("liveResetStack").disabled=!node||!!liveEditing||
    livePatches.get(selector)?.appearance?.layer===undefined;
  $("liveAppearanceControls").hidden=!node||tag==="IMG";
  if(node&&tag!=="IMG"){
    const values=livePatches.get(selector)?.appearance||{};
    const originalStyle=node.ownerDocument.defaultView.getComputedStyle(node);
    $("liveFontFamily").value=values.family||"";
    $("liveFontSize").value=String(values.fontSize||
      Math.round(parseFloat(originalStyle.fontSize)||18));
    $("liveTextColour").value=values.color||
      hexColour(originalStyle.color,"#1c2622");
    $("liveBackgroundColour").value=values.backgroundColor||
      hexColour(originalStyle.backgroundColor,"#ffffff");
    $("liveFontWeight").value=values.weight||"";
    $("liveFontStyle").value=values.style||"";
    $("liveTextDecoration").value=values.decoration||"";
    $("liveTextAlign").value=values.align||"";
    $("resetLiveAppearance").disabled=!livePatches.get(selector)?.appearance;
  }
  if(node){
    const entry=liveLayoutFor(selector);
    $("liveMoveX").value=String(entry.dx);
    $("liveMoveY").value=String(entry.dy);
    const canReflow=!!node.matches("h1,h2,h3,h4,h5,h6,p,blockquote,figcaption");
    // Box-resize controls replace geometry scaling for text. Separate scale
    // fields remain available for images and section containers.
    $("liveScaleX").value=String(Math.round(entry.sx*100));
    $("liveScaleY").value=String(Math.round(entry.sy*100));
    // Original elements use box geometry, not independent X/Y visual scale.
    $("liveScaleX").disabled=true;
    $("liveScaleY").disabled=true;
    $("liveScaleX").closest("label").hidden=true;
    $("liveScaleY").closest("label").hidden=true;
    $("liveTextReflowControls").hidden=!canReflow;
    const on=canReflow;
    $("liveTextReflow").checked=on;
    $("liveTextBoxWidth").disabled=!on;
    $("liveTextBoxHeight").disabled=!on;
    $("liveTextBoxWidth").value=String(Math.round(entry.wrapWidth||node.getBoundingClientRect().width));
    $("liveTextBoxHeight").value=String(Math.round(entry.reserveHeight||node.getBoundingClientRect().height));
    $("liveResetTextDimensions").disabled=!canReflow||
      livePatches.get(selector)?.layout?.[liveDevice()]?.wrapWidth===undefined;
    const extra=canReflow&&entry.wrapWidth!==undefined?
      Math.max(0,Math.ceil(node.scrollHeight-node.clientHeight)):0;
    $("liveReflowWarning").hidden=extra<=3;
    $("liveReflowWarning").textContent=extra>3?
      "Wrapped text extends about "+extra+"px beyond the reserved height and may overlap the next element.":"";
    $("liveFitReflowHeight").disabled=!canReflow||extra<=3;
    $("resetLiveLayout").disabled=!livePatches.get(selector)?.layout?.[liveDevice()]&&
      livePatches.get(selector)?.kind!=="insert";
  }
  // Inspector's reflow and reset calculations can enable fields later in
  // this render. Apply the position lock last so no control reopens it.
  if(locked)for(const id of [
    "liveMoveX","liveMoveY","liveOriginalWidth","liveOriginalHeight",
    "liveAddedWidth","liveAddedHeight","liveTextBoxWidth","liveTextBoxHeight",
    "liveFitReflowHeight","liveResetTextDimensions","resetLiveLayout",
    "liveTextReflow","liveSectionHeightMode","liveFitSectionHeight"
  ])$(id).disabled=true;
  renderLiveEditCount();
}
// A selector recorded in the rendered (script-enabled) website can differ
// from the source HTML committed to GitHub. Match the original content and tag
// when the positional selector fails, and never guess between duplicates.
function livePatchExcerpt(patch){
  const excerpt=(patch.expected||"").replace(/\s+/g," ").slice(0,90);
  return excerpt||patch.selector.split(" > ").at(-1)||"Unnamed element";
}
function equivalentSiteImageSource(actual,expected){
  const left=String(actual||"").trim(),right=String(expected||"").trim();
  if(left===right&&left!=="")return true;
  // Compare complete same-origin paths, not basenames. Ignore image cache
  // query parameters but never accept images from a different origin.
  try{
    const base=new URL(currentPage,location.href);
    const x=new URL(left,base),y=new URL(right,base);
    return !!left&&!!right&&x.origin===base.origin&&y.origin===base.origin&&
      x.pathname===y.pathname;
  }catch{return false;}
}
function livePatchNodeMatches(node,patch){
  if(!node||!node.closest("main"))return false;
  if(patch.kind==="image"&&node.tagName!=="IMG")return false;
  if(patch.kind==="text"&&(node.tagName==="IMG"||LIVE_CONTAINER_SET.has(node.tagName)))return false;
  if(patch.kind==="layout"&&!node.matches(LIVE_SELECTABLE_TAGS))return false;
  if(patch.kind==="delete"&&patch.tag&&node.tagName.toLowerCase()!==patch.tag)return false;
  const image=node.tagName==="IMG";
  const original=image?node.getAttribute("src")||"":
    (node.textContent||"").trim().slice(0,300);
  return image&&(patch.kind==="image"||patch.kind==="delete")?
    equivalentSiteImageSource(original,patch.expected):original===patch.expected;
}
function resolveLivePatchTarget(doc,patch){
  const direct=doc.querySelector(patch.selector);
  if(direct&&livePatchNodeMatches(direct,patch))return direct;
  const tag=patch.kind==="image"?"img":
    patch.selector.match(/ > ([a-z][a-z0-9-]*):nth-of-type\(\d{1,4}\)$/)?.[1];
  if(!tag||!patch.expected||patch.expected.trim().length<5)
    throw Error("Could not match saved edit \""+livePatchExcerpt(patch)+"\" to the original webpage. The draft is preserved.");
  // Do not exclude elements already associated with another saved edit.
  // Reparented images can carry an image replacement and positioning edit
  // with different historical selectors. Those edits refer to ONE image.
  const matches=[...doc.querySelectorAll("main "+tag)].filter(node=>
    livePatchNodeMatches(node,patch));
  if(matches.length!==1){
    const reason=matches.length?"Multiple matching elements":"No matching original element";
    const images=patch.kind==="image"?
      [...doc.querySelectorAll("main img[src]")].slice(0,8)
        .map(img=>img.getAttribute("src")).join(", "):"";
    throw Error(reason+" for saved edit \""+livePatchExcerpt(patch)+
      "\" on "+currentPage+". "+(patch.kind==="image"?
        "Images in this page: "+(images||"none")+". ":"")+
      "The draft is preserved. Review the original-image mapping before publishing.");
  }
  return matches[0];
}
function mergeLiveTargetPatches(first,second,node){
  if(first.kind==="delete"||second.kind==="delete")
    return {...(first.kind==="delete"?first:second),selector:first.selector,
      expected:first.expected,kind:"delete",
      tag:(first.kind==="delete"?first:second).tag||node.tagName.toLowerCase()};
  const merged={...first,...second,selector:first.selector,expected:first.expected};
  if(node.tagName!=="IMG"){
    const textEdits=[first,second].filter(p=>p.kind==="text");
    if(textEdits.length>1&&textEdits[0].html!==textEdits[1].html)
      throw Error("Two different text replacements target the same paragraph. Review the conflicting saved edits.");
    if(textEdits.length){
      merged.kind="text";
      merged.html=textEdits.at(-1).html;
    }else merged.kind="layout";
  }
  if(node.tagName==="IMG"){
    const source=node.getAttribute("src")||"";
    const candidates=[first,second].filter(p=>p.kind==="image");
    const replacements=candidates.filter(p=>!equivalentSiteImageSource(p.src,source));
    if(replacements.length>1&&!equivalentSiteImageSource(replacements[0].src,replacements[1].src))
      throw Error("Two different image replacements target "+source+". Remove one conflicting saved edit.");
    const newAlts=candidates.filter(p=>p.alt!==(node.alt||""));
    if(newAlts.length>1&&newAlts[0].alt!==newAlts[1].alt)
      throw Error("Two different image descriptions target "+source+". Review the duplicate saved edits.");
    merged.kind="image";
    merged.src=(replacements.at(-1)||candidates.at(-1))?.src||source;
    merged.alt=(newAlts.at(-1)||candidates.at(-1))?.alt||"";
  }
  // A newer interaction with the same object supersedes previous geometry
  // on that device, while changes on other devices are retained.
  const layouts={...(first.layout||{}),...(second.layout||{})};
  if(Object.keys(layouts).length)merged.layout=layouts;
  else delete merged.layout;
  const appearance={...(first.appearance||{}),...(second.appearance||{})};
  if(Object.keys(appearance).length)merged.appearance=appearance;
  else delete merged.appearance;
  // Two edits can refer to the same source image after a published
  // reparenting. Merge their independent responsive crop settings too.
  const crop={...(first.imageCrop||{}),...(second.imageCrop||{})};
  if(Object.keys(crop).length)merged.imageCrop=crop;
  else delete merged.imageCrop;
  const effects={...(first.pictureEffects||{}),...(second.pictureEffects||{})};
  if(Object.keys(effects).length)merged.pictureEffects=effects;
  else delete merged.pictureEffects;
  return merged;
}
function captureExistingLiveStyles(doc){
  // Older published V2 rules use positional selectors. Remember their
  // *actual element nodes* before deleting siblings, so rules can be rebased
  // on the survivors. Otherwise an old selector could style the wrong text.
  const sheet=doc.getElementById("moon-v2-live-layout");
  const css=sheet?.textContent||"";
  if(!css)return null;
  const pattern=/main(?: > [a-z][a-z0-9-]*:nth-of-type\(\d{1,4}\)){1,12}(?=\s*\{)/g;
  const references=new Map();
  for(const match of css.matchAll(pattern)){
    if(!references.has(match[0]))references.set(match[0],doc.querySelector(match[0]));
  }
  return {css,pattern,references};
}
function rebaseExistingLiveStyles(doc,state){
  if(!state)return;
  // A deleted object's legacy rule becomes a harmless selector matching
  // nothing. Retained objects receive their *new* selector after removal.
  const next=state.css.replace(state.pattern,selector=>{
    const node=state.references.get(selector);
    return node?.isConnected?liveSelector(node)||":not(*)":":not(*)";
  });
  liveSourceCss.set(doc,next);
}
function applyPatchesToDocument(doc,strict=false,resolved=[],normalized=[]){
  const changes=[],byNode=new Map();
  const addedChanges=[];
  for(const patch of livePatches.values()){
    if(!validLivePatch(patch)){
      if(strict)throw Error("An invalid live-page edit needs review.");continue;
    }
    if(patch.kind==="insert"||patch.kind==="remove-added"){
      addedChanges.push(patch);continue;
    }
    let node;
    try{node=resolveLivePatchTarget(doc,patch);}
    catch(error){if(strict)throw error;continue;}
    const selector=liveSelector(node);
    if(!selector){
      if(strict)throw Error("Saved edit \""+livePatchExcerpt(patch)+
        "\" is inside a structure too deeply nested for safe publishing.");
      continue;
    }
    const existing=byNode.get(node);
    if(existing){
      try{
        existing.patch=mergeLiveTargetPatches(existing.patch,patch,node);
        existing.originals.push(patch.selector);
      }catch(error){if(strict)throw error;continue;}
    }else{
      const item={patch:{...patch},node,selector,originals:[patch.selector]};
      changes.push(item);byNode.set(node,item);
    }
  }
  if(strict){
    // Editing a parent's innerHTML would erase a separate nested edit.
    for(const a of changes){
      if(a.patch.kind!=="text"&&a.patch.kind!=="delete")continue;
      if(changes.some(b=>b!==a&&a.node.contains(b.node)))
        throw Error("An edited element contains other separately edited elements near \""+
          livePatchExcerpt(a.patch)+"\". Revert the nested edits first to avoid discarding them.");
    }
  }
  // Apply content first against resolved DOM nodes. When deletion changes
  // sibling nth-of-type positions, calculate fresh selectors AFTER removal.
  // That prevents a moved or styled sibling from targeting the wrong node.
  const priorStyles=changes.some(({patch})=>patch.kind==="delete")?
    captureExistingLiveStyles(doc):null;
  for(const {patch,node} of changes){
    if(patch.kind==="image"){
      node.setAttribute("src",patch.src);
      node.setAttribute("alt",patch.alt);
    }
    if(node.tagName==="IMG"&&patch.imageCrop&&validImageCropMap(patch.imageCrop))
      node.setAttribute("data-moon-v2-image-crop",JSON.stringify({
        ...(()=>{try{
          const old=JSON.parse(node.getAttribute("data-moon-v2-image-crop")||"{}");
          return validImageCropMap(old)?old:{};
        }catch{return {};}})(),
        ...patch.imageCrop
      }));
    if(node.tagName==="IMG"&&patch.pictureEffects&&validPictureEffects(patch.pictureEffects)){
      let older={};
      try{
        const from=JSON.parse(node.getAttribute("data-moon-v2-picture-effects")||"{}");
        if(validPictureEffects(from))older=from;
      }catch{/* First picture format edit. */}
      node.setAttribute("data-moon-v2-picture-effects",JSON.stringify({...older,...patch.pictureEffects}));
    }
    if(patch.kind==="text")node.innerHTML=cleanRich(patch.html);
  }
  for(const {patch,node} of changes){
    if(patch.kind==="delete")node.remove();
  }
  rebaseExistingLiveStyles(doc,priorStyles);
  for(const {patch,node,selector,originals} of changes){
    const finalSelector=patch.kind==="delete"?selector:liveSelector(node);
    if(!finalSelector){
      if(strict)throw Error("A source element changed position while applying the edits. Publication stopped.");
      continue;
    }
    for(const from of originals)resolved.push({from,to:finalSelector});
    normalized.push({...patch,selector:finalSelector});
  }
  refreshLiveLayoutRules(doc,normalized.filter(p=>p.kind!=="delete"));
  for(const patch of addedChanges){
    try{
      if(patch.kind==="insert")applyAddedPatch(doc,patch);
      else removeAddedPatchFromDoc(doc,patch.selector);
      resolved.push({from:patch.selector,to:patch.selector});
      normalized.push(copy(patch));
    }catch(error){if(strict)throw error;}
  }
  return resolved.length;
}

function editLiveText(){
  const node=liveSelected?.node;
  if(!node||node.tagName==="IMG"||LIVE_CONTAINER_SET.has(node.tagName)||liveEditing)return;
  const selector=liveSelector(node);if(!selector)return;
  liveEditing={node,selector,originalHtml:node.innerHTML,
    expected:livePatches.get(selector)?.expected||
      (node.textContent||"").trim().slice(0,300)};
  node.contentEditable="true";node.focus();
  renderLiveInspector();
  status("Editing original-layout draft · Save or cancel when finished");
}
function saveLiveText(){
  if(!liveEditing)return;
  const edit=liveEditing;liveEditing=null;
  const before=liveSnapshot();
  const html=cleanRich(edit.node.innerHTML);
  edit.node.removeAttribute("contenteditable");
  edit.node.innerHTML=html;
  const old=livePatchForSelected();
  if(old?.kind==="insert"){
    old.html=html;livePatches.set(edit.selector,old);
    recordLiveHistory(before);refreshAddedObject(edit.node.ownerDocument,old);
    renderLiveInspector();renderLiveLayers();fitLivePage();return;
  }
  livePatches.set(edit.selector,{
    selector:edit.selector,kind:"text",expected:edit.expected,html,
    ...(old?.layout?{layout:old.layout}:{}),
    ...(old?.appearance?{appearance:old.appearance}:{})
  });
  recordLiveHistory(before);renderLiveInspector();renderLiveLayers();fitLivePage();
}
function cancelLiveText(){
  if(!liveEditing)return;
  const edit=liveEditing;liveEditing=null;
  if(edit.node?.isConnected){
    edit.node.removeAttribute("contenteditable");
    edit.node.innerHTML=edit.originalHtml;
  }
  renderLiveInspector();
}
function applyLiveImage(){
  const node=liveSelected?.node;
  if(!node||node.tagName!=="IMG")return;
  const src=$("liveImageSrc").value.trim();
  const alt=$("liveImageAlt").value.slice(0,300);
  if(!safeImageSource(src)){
    status("Please choose a site image under assets/");return;
  }
  const selector=liveSelector(node);if(!selector)return;
  const before=liveSnapshot(),old=livePatchForSelected();
  if(old?.kind==="insert"){
    old.src=src;old.alt=alt;livePatches.set(selector,old);
    recordLiveHistory(before);refreshAddedObject(node.ownerDocument,old);
    renderLiveInspector();renderLiveLayers();return;
  }
  const expected=old?.expected||node.getAttribute("src")||"";
  node.setAttribute("src",src);node.setAttribute("alt",alt);
  livePatches.set(selector,{selector,kind:"image",expected,src,alt,
    ...(old?.layout?{layout:old.layout}:{})});
  recordLiveHistory(before);renderLiveInspector();renderLiveLayers();
}
function deleteSelectedLiveGroup(){
  const selected=selectedAddedPatches();
  if(selected.length<2)return false;
  if(!confirm("Delete "+selected.length+
    " selected webpage objects from this draft? You can undo before publishing."))return true;
  const before=liveSnapshot();
  const source=new DOMParser().parseFromString(liveDisplayedSourceHtml||"","text/html");
  for(const item of selected){
    const id=addedObjectId(item.patch);
    const existing=[...source.querySelectorAll("[data-moon-v2-added-id]")].some(
      node=>node.getAttribute("data-moon-v2-added-id")===id);
    if(existing)livePatches.set(item.selector,{
      selector:item.selector,kind:"remove-added",expected:""
    });
    else livePatches.delete(item.selector);
  }
  if(!recordLiveHistory(before))return true;
  clearLiveSelection();
  for(const item of selected)removeAddedPatchFromDoc(item.node.ownerDocument,item.selector);
  renderLiveLayers();
  status(selected.length+" webpage objects removed together · Undo available");
  return true;
}
function duplicateSelectedLiveGroup(){
  const selected=selectedAddedPatches();
  if(selected.length<2)return false;
  if(livePatches.size+selected.length>180){
    status("Cannot duplicate group: the page edit limit would be exceeded");return true;
  }
  const previous=liveSnapshot(),doc=$("livePageFrame").contentDocument;
  const newItems=[];
  for(const item of selected){
    const twin=copy(item.patch);
    twin.selector=newAddedPatch(item.patch.objectType,{
      src:item.patch.src,alt:item.patch.alt,html:item.patch.html,fill:item.patch.fill
    }).selector;
    for(const device of Object.keys(twin.geometry)){
      const g=twin.geometry[device];
      g.x=Math.round(clamp(g.x+24,-4000,10000));
      g.y=Math.round(clamp(g.y+24,-4000,40000));
    }
    livePatches.set(twin.selector,twin);
    applyAddedPatch(doc,twin);newItems.push(twin.selector);
  }
  if(recordLiveHistory(previous)){
    liveAddedMulti=new Set(newItems);
    const node=findAddedNode(doc,newItems.at(-1));
    selectLiveElement(node,false,true);renderLiveLayers();
    status(newItems.length+" webpage objects duplicated together · Undo available");
  }
  return true;
}
function deleteSelectedLiveElement(){
  if(workspaceMode!=="live"||liveEditing)return;
  if(deleteSelectedLiveGroup())return;
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(!node||!selector||!node.closest("main"))return;
  // Deleting a parent must not silently discard saved edits to children.
  const nested=[...livePatches.keys()].filter(key=>key!==selector&&
    key.startsWith(selector+" > "));
  if(nested.length){
    status("This element contains "+nested.length+
      " separately edited child elements. Revert those edits before deleting the parent.");
    return;
  }
  const label=(node.tagName==="IMG"?node.alt||node.getAttribute("src"):
    node.textContent||"").trim().replace(/\s+/g," ").slice(0,100);
  if(!confirm("Delete this "+node.tagName.toLowerCase()+
    " from the website draft?\n\n"+label+
    "\n\nYou can undo before publishing. The public page changes only after publication."))return;
  const before=liveSnapshot(),prior=livePatches.get(selector);
  if(LIVE_ADDED_ID.test(selector)){
    const wasPublished=!!new DOMParser().parseFromString(
      liveDisplayedSourceHtml||"","text/html").querySelector(
        '[data-moon-v2-added-id="'+selector.slice(6)+'"]');
    if(wasPublished)livePatches.set(selector,{selector,kind:"remove-added",expected:""});
    else livePatches.delete(selector);
    if(!recordLiveHistory(before))return;
    clearLiveSelection();removeAddedPatchFromDoc(node.ownerDocument,selector);
    renderLiveLayers();
    status("Independent object removed from website draft · Undo available");
    return;
  }
  const expected=prior?.expected||(node.tagName==="IMG"?
    node.getAttribute("src")||"":(node.textContent||"").trim().slice(0,300));
  // Preserve the historical identity even if the user already changed the
  // text or image in this draft before choosing Delete.
  const patch={selector,kind:"delete",tag:node.tagName.toLowerCase(),expected};
  livePatches.set(selector,patch);
  if(!recordLiveHistory(before))return;
  clearLiveSelection();
  node.remove();
  renderLiveLayers();
  status("Element deleted from local draft · Undo restores it · Publish to update the website");
}
function revertLiveElement(){
  const selector=liveSelected&&liveSelector(liveSelected.node);
  if(!selector||!livePatches.has(selector))return;
  cancelLiveText();
  const before=liveSnapshot();livePatches.delete(selector);
  recordLiveHistory(before);loadLivePage();
}
function resolveSourceReference(value,rootHref){
  const raw=String(value||"").trim();
  if(!raw||raw.startsWith("#")||/^(?:data:|blob:|mailto:|tel:|javascript:)/i.test(raw))
    return value;
  try{return new URL(raw,rootHref).href;}catch{return value;}
}
function rewriteSourceReferences(doc,rootHref){
  // A <base> element redirects href="#references" away from the draft and
  // breaks citation and navigation anchors. Preserve those anchors and make
  // document-external resources absolute before moving HTML into staging.
  for(const node of doc.querySelectorAll("[src],[href],[poster],[action]")){
    for(const attr of ["src","href","poster","action"]){
      if(node.hasAttribute(attr)){
        node.setAttribute(attr,resolveSourceReference(node.getAttribute(attr),rootHref));
      }
    }
  }
  for(const node of doc.querySelectorAll("[srcset]")){
    const value=node.getAttribute("srcset")||"";
    if(/^\s*data:/i.test(value))continue;
    node.setAttribute("srcset",value.split(",").map(item=>{
      const part=item.trim();
      const match=part.match(/^(\S+)(\s+.*)?$/);
      return match?resolveSourceReference(match[1],rootHref)+(match[2]||""):part;
    }).join(", "));
  }
  const rewriteCss=css=>css.replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/gi,
    (all,quote,url)=>"url("+quote+resolveSourceReference(url,rootHref)+quote+")");
  for(const node of doc.querySelectorAll("[style]"))
    node.setAttribute("style",rewriteCss(node.getAttribute("style")||""));
  for(const node of doc.querySelectorAll("style"))
    node.textContent=rewriteCss(node.textContent||"");
}
async function fetchGithubPageSource(page,{force=false}={}){
  if(!PAGES.has(page))throw Error("This page is not in the editor's site list.");
  if(!force&&liveGithubSources.has(page))return liveGithubSources.get(page);
  const endpoint="https://api.github.com/repos/"+REPO+"/contents/"+encodeURIComponent(page)+"?ref=main";
  const response=await fetch(endpoint,{
    headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},
    cache:"no-store"
  });
  if(!response.ok)throw Error("GitHub source verification unavailable (HTTP "+response.status+").");
  const info=await response.json();
  if(info.type!=="file"||typeof info.sha!=="string")throw Error("GitHub supplied no source file.");
  const data={html:decodeGithubHtml(info),sha:info.sha,verified:true};
  if(!/<main\b/i.test(data.html))throw Error("The GitHub source page has no main element.");
  liveGithubSources.set(page,data);
  return data;
}
async function verifiedSourcePreviewPair(){
  const page=currentPage,revision=JSON.stringify(liveSnapshot());
  // Both before and after come from one immutable GitHub blob. Its edited
  // version uses the exact patch assembler used by Publish Live.
  const source=await fetchGithubPageSource(page,{force:true});
  if(page!==currentPage||JSON.stringify(liveSnapshot())!==revision)
    throw Error("The page or edits changed while preparing preview. Try again.");
  if(liveDisplayedSourceHtml!==null&&liveDisplayedSourceHtml!==source.html&&livePatches.size)
    throw Error("The GitHub source has changed since the editor loaded this page. Your draft is preserved. Select Reload live page to review the updated source before previewing or publishing.");
  const published=applyLiveEditsToGithubHtml(source.html);
  return {original:source.html,edited:published.html,sha:source.sha,page};
}
async function sourcePreservingHtml(rootHref){
  // Export/staging require root-relative asset references to work outside
  // the page's folder. Verification and publishing use the same assembler.
  const pair=await verifiedSourcePreviewPair();
  const doc=new DOMParser().parseFromString(pair.edited,"text/html");
  for(const base of doc.querySelectorAll("base"))base.remove();
  rewriteSourceReferences(doc,rootHref);
  return "<!doctype html>\n"+doc.documentElement.outerHTML;
}
function removeLiveOverlay(){
  if(liveOverlay?.isConnected)liveOverlay.remove();
  liveOverlay?.ownerDocument?.getElementById("moon-v2-crop-image-guide")?.remove();
  liveOverlay=null;
}
function liveSourceSelectionBounds(node,items=selectedSourcePatches()){
  if(items.length<2||!items.some(item=>item.node===node))
    return node.getBoundingClientRect();
  const boxes=items.map(item=>item.node.getBoundingClientRect());
  const left=Math.min(...boxes.map(box=>box.left));
  const top=Math.min(...boxes.map(box=>box.top));
  const right=Math.max(...boxes.map(box=>box.right));
  const bottom=Math.max(...boxes.map(box=>box.bottom));
  return {left,top,right,bottom,x:left,y:top,width:right-left,height:bottom-top};
}
function syncLiveCropImageGuide(node,rect){
  const doc=node.ownerDocument;
  let guide=doc.getElementById("moon-v2-crop-image-guide");
  if(!liveCropMode||node.tagName!=="IMG"||
     ["left","right","top","bottom"].some(side=>
       selectedImageCrop(livePatchForSelected())[side]!==undefined)){
    guide?.remove();return;
  }
  const patch=livePatchForSelected(),crop=selectedImageCrop(patch);
  const ratio=crop.ratio||node.naturalWidth/Math.max(1,node.naturalHeight);
  if(!ratio||!Number.isFinite(ratio)){guide?.remove();return;}
  const cover=Math.max(rect.width,rect.height*ratio);
  const contain=Math.min(rect.width,rect.height*ratio);
  const base=crop.fit==="contain"?contain:Math.max(crop.baseW||0,cover);
  const w=base*(crop.zoom||100)/100,h=w/ratio;
  if(!Number.isFinite(w)||!Number.isFinite(h)){guide?.remove();return;}
  if(!guide){
    guide=doc.createElement("div");
    guide.id="moon-v2-crop-image-guide";
    guide.setAttribute("aria-hidden","true");
    guide.style.cssText="position:fixed!important;pointer-events:none!important;"+
      "box-sizing:border-box!important;background:rgba(227,168,52,.045)!important;"+
      "border:2px dashed #bb820c!important;z-index:2147482999!important;";
    const zoomGrip=doc.createElement("button");
    zoomGrip.type="button";
    zoomGrip.className="moon-v2-picture-zoom-grip";
    zoomGrip.setAttribute("aria-label","Drag to enlarge or shrink the picture behind its crop frame");
    zoomGrip.title="Resize underlying picture without changing crop frame";
    zoomGrip.style.cssText="position:absolute!important;right:-14px!important;"+
      "bottom:-14px!important;width:28px!important;height:28px!important;"+
      "border:2px solid #885600!important;border-radius:50%!important;"+
      "background:#ffe099!important;cursor:nwse-resize!important;"+
      "pointer-events:auto!important;touch-action:none!important;"+
      "z-index:2147483004!important;";
    zoomGrip.addEventListener("pointerdown",event=>
      startLiveGesture(event,"crop-zoom",zoomGrip));
    guide.append(zoomGrip);
    doc.body.append(guide);
  }
  guide.style.left=(rect.left+(rect.width-w)*crop.x/100)+"px";
  guide.style.top=(rect.top+(rect.height-h)*crop.y/100)+"px";
  guide.style.width=w+"px";
  guide.style.height=h+"px";
}
function syncLiveOverlay(){
  if(workspaceMode!=="live"||!liveSelected?.node?.isConnected||liveEditing){
    removeLiveOverlay();return;
  }
  const node=liveSelected.node,doc=node.ownerDocument;
  if(node.tagName==="IMG")
    node.toggleAttribute("data-moon-v2-crop-active",liveCropMode);
  const sourceGroup=selectedSourcePatches();
  const grouped=sourceGroup.length>1&&sourceGroup.some(item=>item.node===node);
  const locked=liveSelectionHasGeometryLock();
  if(liveOverlay?.isConnected&&
    liveOverlay.dataset.positionLocked!==String(locked))removeLiveOverlay();
  if(liveOverlay?.isConnected&&
     liveOverlay.dataset.cropMode!==String(liveCropMode&&node.tagName==="IMG"))
    removeLiveOverlay();
  if(liveOverlay?.isConnected&&
      liveOverlay.dataset.groupCount!==(grouped?String(sourceGroup.length):"1"))
    removeLiveOverlay();
  if(!liveOverlay||!liveOverlay.isConnected||liveOverlay.ownerDocument!==doc){
    removeLiveOverlay();
    liveOverlay=doc.createElement("div");
    liveOverlay.id="moon-v2-live-overlay";
    doc.body.append(liveOverlay);
    const css=doc.getElementById("moon-v2-live-controls")||doc.createElement("style");
    css.id="moon-v2-live-controls";
    css.textContent="#moon-v2-live-overlay{position:fixed!important;pointer-events:none!important;"+
      "box-sizing:border-box!important;border:2px solid #287dbb!important;"+
      "z-index:2147483000!important;background:transparent!important;"+
      "outline:0!important;contain:layout!important;}"+
      "#moon-v2-live-overlay[data-position-locked='true']{border-style:dashed!important;border-color:#875e9d!important;}"+
      "#moon-v2-live-overlay[data-crop-mode='true']{border-style:dashed!important;border-color:#b42887!important;"+
      "box-shadow:0 0 0 1px #fff8!important;}"+
      "#moon-v2-live-overlay[data-crop-mode='true'] .moon-v2-grip{"+
      "border-color:#b42887!important;cursor:crosshair;}"+
      "#moon-v2-live-overlay button{position:absolute!important;pointer-events:auto!important;"+
      "touch-action:none!important;box-sizing:border-box!important;cursor:move!important;"+
      "appearance:none!important;min-width:0!important;min-height:0!important;"+
      "max-width:none!important;max-height:none!important;transition:none!important;"+
      "z-index:2147483001!important;border:1px solid #287dbb!important;"+
      "background:#fff!important;color:#14547e!important;font:12px Arial,sans-serif!important;}"+
      "#moon-v2-live-overlay .moon-v2-grip{"+
      "width:var(--moon-grip,28px)!important;height:var(--moon-grip,28px)!important;"+
      "border:2px solid #287dbb!important;border-radius:5px!important;padding:0!important;"+
      "z-index:2147483003!important;box-shadow:0 1px 6px #132e3866!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge{"+
      "border:0!important;border-radius:8px!important;"+
      "background:transparent!important;z-index:2147483002!important;"+
      "padding:0!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge:is(:hover,:focus-visible){"+
      "background:#287dbb66!important;outline:2px solid #287dbb!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='n'],"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='s']{"+
      "left:50%!important;width:calc(100% - var(--moon-grip,28px))!important;"+
      "height:var(--moon-edge,24px)!important;transform:translate(-50%,-50%)!important;"+
      "cursor:ns-resize!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='n']{top:0!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='s']{top:100%!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='e'],"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='w']{"+
      "top:50%!important;height:calc(100% - var(--moon-grip,28px))!important;"+
      "width:var(--moon-edge,24px)!important;transform:translate(-50%,-50%)!important;"+
      "cursor:ew-resize!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='w']{left:0!important;}"+
      "#moon-v2-live-overlay .moon-v2-edge[data-direction='e']{left:100%!important;}"+

      "#moon-v2-live-overlay .moon-v2-rotate{left:50%!important;top:-76px!important;"+
      "transform:translateX(-50%)!important;width:30px!important;height:30px!important;"+
      "border-radius:50%!important;background:#e9ddff!important;"+
      "border:2px solid #7a4baf!important;color:#42275e!important;"+
      "font:18px Arial,sans-serif!important;cursor:crosshair!important;}"+
      "#moon-v2-live-overlay .moon-v2-move{left:0!important;top:-29px!important;"+
      "height:26px!important;padding:2px 8px!important;border-radius:4px!important;"+
      "white-space:nowrap!important;}"+
      "#moon-v2-live-overlay .moon-v2-delete{left:60px!important;top:-29px!important;"+
      "height:26px!important;padding:2px 8px!important;border-radius:4px!important;"+
      "white-space:nowrap!important;border-color:#a33!important;color:#a33!important;}";
    doc.head.append(css);
    const move=doc.createElement("button");
    move.className="moon-v2-move";move.type="button";
    move.textContent=grouped?"Move group":
      liveCropMode&&node.tagName==="IMG"?"Crop active · drag image":"Move";
    move.setAttribute("aria-label",grouped?
      "Move selected original webpage elements together":
      "Move selected live-page object");
    move.dataset.direction=liveCropMode&&node.tagName==="IMG"?"crop":"move";
    if(!locked&&!(liveCropMode&&node.tagName==="IMG"))liveOverlay.append(move);
    if(!locked&&!grouped&&node.tagName==="IMG"&&!liveCropMode){
      const rotor=doc.createElement("button");
      rotor.type="button";rotor.className="moon-v2-rotate";
      rotor.textContent="⟳";rotor.dataset.direction="rotate";
      rotor.title="Drag to rotate picture. Hold Shift to snap by 15 degrees.";
      rotor.setAttribute("aria-label",rotor.title);
      liveOverlay.append(rotor);
    }
    const remove=doc.createElement("button");
    remove.className="moon-v2-delete";remove.type="button";remove.textContent="Delete";
    remove.setAttribute("aria-label","Delete selected webpage element (undo is available)");
    remove.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      deleteSelectedLiveElement();
    });
    // Deleting an original multi-selection currently removes only its
    // primary object. Hide that misleading control until group deletion
    // is explicitly supported for original source elements.
    if(!grouped)liveOverlay.append(remove);
    // Give sections draggable *edges*, not just tiny midpoint handles.
    // Full-length rails remain usable on sections taller than the viewport.
    if(!locked&&LIVE_CONTAINER_SET.has(node.tagName)&&!grouped){
      for(const dir of ["n","e","s","w"]){
        const edge=doc.createElement("button");
        edge.type="button";edge.className="moon-v2-edge";
        edge.dataset.direction=dir;
        edge.setAttribute("aria-label","Drag to resize "+node.tagName.toLowerCase()+
          " "+({n:"top",e:"right",s:"bottom",w:"left"}[dir])+" edge");
        liveOverlay.append(edge);
      }
    }
    // Group grips resize independent original boxes together. Text always
    // reflows naturally, and images retain object-fit:contain.
    if(!locked&&node.matches(LIVE_SELECTABLE_TAGS)){
      for(const dir of ["nw","n","ne","e","se","s","sw","w"]){
        const grip=doc.createElement("button");
        grip.type="button";grip.className="moon-v2-grip";
        grip.dataset.direction=dir;grip.setAttribute("aria-label","Resize "+dir);
        const x=dir.includes("w")?"0%":dir.includes("e")?"100%":"50%";
        const y=dir.includes("n")?"0%":dir.includes("s")?"100%":"50%";
        grip.style.setProperty("left",x,"important");
        grip.style.setProperty("top",y,"important");
        grip.style.setProperty("transform","translate(-50%,-50%)","important");
        grip.style.setProperty("cursor",dir==="n"||dir==="s"?"ns-resize":
          dir==="e"||dir==="w"?"ew-resize":
          dir==="nw"||dir==="se"?"nwse-resize":"nesw-resize","important");
        liveOverlay.append(grip);
      }
    }
    liveOverlay.addEventListener("pointerdown",event=>{
      const button=event.target.closest("button[data-direction]");
      if(button)startLiveGesture(event,button.dataset.direction,button);
    });
  }
  const rect=liveSourceSelectionBounds(node,sourceGroup);
  liveOverlay.style.left=rect.left+"px";
  liveOverlay.style.top=rect.top+"px";
  liveOverlay.style.width=rect.width+"px";
  liveOverlay.style.height=rect.height+"px";
  liveOverlay.dataset.groupCount=grouped?String(sourceGroup.length):"1";
  liveOverlay.dataset.positionLocked=String(locked);
  liveOverlay.dataset.cropMode=String(liveCropMode&&node.tagName==="IMG");
  // iframe scaling shrinks ordinary 13px handles to just 3–7 screen pixels.
  // Compensate for zoom so handles remain usable even at fit-to-page zoom.
  const scale=Math.max(.25,liveScale);
  liveOverlay.style.setProperty("--moon-grip",
    Math.round(clamp(22/scale,22,76))+"px");
  liveOverlay.style.setProperty("--moon-edge",
    Math.round(clamp(22/scale,22,72))+"px");
  syncLiveCropImageGuide(node,rect);
}
function removeLiveSnapGuides(){
  const doc=$("livePageFrame")?.contentDocument;
  doc?.getElementById("moon-v2-snap-x")?.remove();
  doc?.getElementById("moon-v2-snap-y")?.remove();
}
function candidateLiveSnapLines(node,excluded=[node]){
  const doc=node.ownerDocument,root=doc.querySelector("main");
  const x=[],y=[];
  if(!root)return {x,y};
  for(const other of [...root.querySelectorAll(LIVE_SELECTABLE_TAGS)].slice(0,180)){
    if(excluded.some(member=>other===member||
      other.contains(member)||member.contains(other)))continue;
    const style=doc.defaultView.getComputedStyle(other);
    if(style.display==="none"||style.visibility==="hidden")continue;
    const box=other.getBoundingClientRect();
    if(box.width<12||box.height<8)continue;
    x.push(box.left,box.left+box.width/2,box.right);
    y.push(box.top,box.top+box.height/2,box.bottom);
  }
  return {x,y};
}
function snapLiveMove(dx,dy,gesture,disabled){
  if(disabled)return {dx,dy,x:null,y:null};
  const bounds=gesture.rect;
  const x=bounds.left+dx,y=bounds.top+dy;
  const edgesX=[x,x+bounds.width/2,x+bounds.width];
  const edgesY=[y,y+bounds.height/2,y+bounds.height];
  const tolerance=7;
  let bestX=null,bestY=null;
  for(const guide of gesture.snapLines.x){
    for(const edge of edgesX){
      const diff=guide-edge;
      if(Math.abs(diff)<=tolerance&&
        (!bestX||Math.abs(diff)<Math.abs(bestX.diff))){
        bestX={diff,guide};
      }
    }
  }
  for(const guide of gesture.snapLines.y){
    for(const edge of edgesY){
      const diff=guide-edge;
      if(Math.abs(diff)<=tolerance&&
        (!bestY||Math.abs(diff)<Math.abs(bestY.diff))){
        bestY={diff,guide};
      }
    }
  }
  return {dx:dx+(bestX?.diff||0),dy:dy+(bestY?.diff||0),
    x:bestX?.guide??null,y:bestY?.guide??null};
}
function drawLiveSnapGuides(x,y,doc){
  for(const [id,value,axis] of [
    ["moon-v2-snap-x",x,"x"],["moon-v2-snap-y",y,"y"]
  ]){
    let line=doc.getElementById(id);
    if(value===null){line?.remove();continue;}
    if(!line){
      line=doc.createElement("div");line.id=id;
      line.setAttribute("aria-hidden","true");
      line.style.cssText="position:fixed!important;pointer-events:none!important;"+
        "z-index:2147482990!important;background:#e03c8a!important;";
      doc.body.append(line);
    }
    if(axis==="x"){
      line.style.left=value+"px";line.style.top="0px";
      line.style.height="100vh";line.style.width="1px";
    }else{
      line.style.left="0px";line.style.top=value+"px";
      line.style.height="1px";line.style.width="100vw";
    }
  }
}
function startLiveGesture(event,direction,anchor){
  if(event.button!==0||workspaceMode!=="live"||liveEditing||liveGesture)return;
  if(!liveSelected?.node?.isConnected)return;
  if(preventLockedLiveGeometry())return;
  if(direction!=="move"&&!liveSelected.node.matches(LIVE_SELECTABLE_TAGS))return;
  const node=liveSelected.node,selector=liveSelector(node);
  const patch=livePatchForSelected();
  if(!patch||!validLivePatch(patch))return;
  // A normal click/double-click must retain its native behaviour. Prevent
  // pointer defaults immediately only for overlay grips; a body drag calls
  // preventDefault after it crosses the movement threshold.
  if(direction!=="move"||anchor.closest?.("#moon-v2-live-overlay"))
    event.preventDefault();
  event.stopPropagation();
  const group=direction==="move"&&LIVE_ADDED_ID.test(selector)&&
    liveAddedMulti.has(selector)&&selectedAddedPatches().length>1?
    selectedAddedPatches().map(item=>({selector:item.selector,node:item.node,
      patch:copy(item.patch)})):null;
  const sourceGroup=!LIVE_ADDED_ID.test(selector)&&
    liveSourceMulti.has(selector)&&selectedSourcePatches().length>1?
    selectedSourcePatches().map(item=>({...item,rect:item.node.getBoundingClientRect()})):null;
  const rect=sourceGroup?liveSourceSelectionBounds(node,sourceGroup):
    node.getBoundingClientRect();
  if(rect.width<2||rect.height<2)return;
  liveGesture={pointer:event.pointerId,anchor,dir:direction,
    startX:event.clientX,startY:event.clientY,rect,group,sourceGroup,
    patch,layout:liveLayoutFor(selector),snapshot:liveSnapshot(),
    moved:false,selector,node,snapLines:candidateLiveSnapLines(node,
      sourceGroup?.map(item=>item.node)||[node])};
  anchor.setPointerCapture?.(event.pointerId);
}
// Each source box is resized around a shared group frame. We first establish
// the new natural dimensions, then measure the resulting browser layout and
// translate each box to the intended location. This second phase compensates
// for normal document reflow without transforming any glyphs or photo pixels.
function resizeLiveSourceGroup(g,dx,dy,lockRatio=false){
  const before=g.rect,device=liveDevice();
  const box=resizableBoxFromDrag(
    {x:before.left,y:before.top,w:before.width,h:before.height},
    g.dir,dx,dy,lockRatio,90,60,4000,5000);
  const sx=box.w/before.width,sy=box.h/before.height;
  const desired=[];
  for(const item of g.sourceGroup){
    const old=item.rect;
    const target={
      x:box.x+(old.left-before.left)*sx,
      y:box.y+(old.top-before.top)*sy,
      w:Math.round(clamp(old.width*sx,64,4000)),
      h:Math.round(clamp(old.height*sy,24,5000))
    };
    const layout=normaliseElementBoxLayout(item.node,item.layout);
    layout.wrapWidth=target.w;
    layout.reserveHeight=target.h;
    if(LIVE_CONTAINER_SET.has(item.node.tagName))
      layout.sectionHeightMode=g.dir.includes("n")||g.dir.includes("s")?
        "fixed":layout.sectionHeightMode==="fixed"?"fixed":"auto";
    const patch=copy(item.patch);
    patch.layout={...patch.layout,[device]:layout};
    livePatches.set(item.selector,patch);
    desired.push({item,target,patch,layout});
  }
  const doc=g.node.ownerDocument;
  refreshLiveLayoutRules(doc);
  for(const info of desired){
    if(info.item.node.matches(LIVE_REFLOW_TEXT)&&
        (g.dir==="e"||g.dir==="w"||g.dir.length===2)){
      const needed=Math.ceil(info.item.node.scrollHeight+2);
      if(Number.isFinite(needed)&&needed>info.layout.reserveHeight&&needed<=5000){
        const extra=needed-info.layout.reserveHeight;
        info.layout.reserveHeight=needed;
        // Keep each text box's opposite bottom edge anchored when the
        // group's north corner is dragged inward.
        info.target.h=needed;
        if(g.dir.includes("n"))info.target.y-=extra;
        info.patch.layout[device]=info.layout;
        livePatches.set(info.item.selector,info.patch);
      }
    }
  }
  refreshLiveLayoutRules(doc);
  // Resolve layout after every box has its new dimensions. Translations
  // never change document flow, so subsequent corrections stay independent.
  for(const info of desired){
    const actual=info.item.node.getBoundingClientRect();
    const old=info.item.layout;
    info.layout.dx=clamp(Math.round(old.dx+
      info.target.x-actual.left),-4000,4000);
    info.layout.dy=clamp(Math.round(old.dy+
      info.target.y-actual.top),-4000,4000);
    info.patch.layout[device]=info.layout;
    livePatches.set(info.item.selector,info.patch);
  }
  refreshLiveLayoutRules(doc);
}
function moveLiveGesture(event){
  const g=liveGesture;
  if(!g||g.pointer!==event.pointerId)return;
  event.preventDefault();
  const deltaX=event.clientX-g.startX,deltaY=event.clientY-g.startY;
  if(!g.moved&&Math.hypot(deltaX,deltaY)<3)return;
  g.moved=true;
  if(g.dir==="rotate"&&g.node.tagName==="IMG"){
    const midX=g.rect.left+g.rect.width/2,midY=g.rect.top+g.rect.height/2;
    const before=Math.atan2(g.startY-midY,g.startX-midX);
    const now=Math.atan2(event.clientY-midY,event.clientX-midX);
    const current=selectedPictureEffects(g.patch);
    let degree=current.rotation+(now-before)*180/Math.PI;
    degree=((degree+180)%360+360)%360-180;
    degree=event.shiftKey?Math.round(degree/15)*15:Math.round(degree);
    const patch=copy(g.patch),device=liveDevice();
    if(patch.kind!=="insert"&&!patch.layout?.[device]){
      patch.layout={...(patch.layout||{}),[device]:g.layout};
    }
    if(patch.kind==="insert"&&patch.design?.rotation)
      patch.design={...patch.design,rotation:0};
    patch.pictureEffects={...(patch.pictureEffects||{}),
      [device]:{...current,rotation:degree}};
    livePatches.set(g.selector,patch);
    if(patch.kind==="insert")refreshAddedObject(g.node.ownerDocument,patch);
    else refreshLiveLayoutRules(g.node.ownerDocument);
    syncLiveOverlay();return;
  }
  if(g.dir==="crop-zoom"&&g.node.tagName==="IMG"){
    const origin=selectedImageCrop(g.patch,liveDevice());
    const change=(deltaX+deltaY)/Math.max(80,g.rect.width)*100;
    const zoom=Math.round(clamp((origin.zoom||100)+change,100,500));
    const patch=copy(g.patch),crop={...origin,fit:"cover",reset:false,zoom};
    patch.imageCrop={...(patch.imageCrop||{}),[liveDevice()]:crop};
    livePatches.set(g.selector,patch);
    if(patch.kind==="insert")refreshAddedObject(g.node.ownerDocument,patch);
    else refreshLiveLayoutRules(g.node.ownerDocument);
    syncLiveOverlay();
    return;
  }
  if(g.dir==="crop"&&g.node.tagName==="IMG"){
    const frame=g.rect,nw=g.node.naturalWidth,nh=g.node.naturalHeight;
    if(!nw||!nh||frame.width<1||frame.height<1)return;
    const origin=selectedImageCrop(g.patch,liveDevice());
    const imageWidth=Math.max(origin.baseW||0,frame.width,frame.height*nw/nh)*
      (origin.zoom||100)/100;
    const imageHeight=imageWidth*nh/nw;
    const overflowX=Math.max(0,imageWidth-frame.width);
    const overflowY=Math.max(0,imageHeight-frame.height);
    const crop={...origin,fit:"cover",
      x:overflowX?Math.round(clamp(origin.x-deltaX/overflowX*100,0,100)):50,
      y:overflowY?Math.round(clamp(origin.y-deltaY/overflowY*100,0,100)):50};
    const patch=copy(g.patch);
    patch.imageCrop={...(patch.imageCrop||{}),[liveDevice()]:crop};
    livePatches.set(g.selector,patch);
    if(patch.kind==="insert")refreshAddedObject(g.node.ownerDocument,patch);
    else refreshLiveLayoutRules(g.node.ownerDocument);
    syncLiveOverlay();
    return;
  }
  if(liveCropMode&&g.node.tagName==="IMG"&&
     ["nw","n","ne","e","se","s","sw","w"].includes(g.dir)){
    updateCropFrame(g.node,g.selector,g.patch,g.rect,g.dir,deltaX,deltaY);
    syncLiveOverlay();return;
  }
  if(g.sourceGroup&&g.dir!=="move"){
    resizeLiveSourceGroup(g,deltaX,deltaY,event.shiftKey);
    syncLiveOverlay();return;
  }
  if(g.sourceGroup&&g.dir==="move"){
    const snap=snapLiveMove(deltaX,deltaY,g,event.altKey);
    const device=liveDevice();
    for(const item of g.sourceGroup){
      const patch=copy(item.patch);
      patch.layout={...patch.layout,[device]:{
        ...item.layout,
        dx:clamp(Math.round(item.layout.dx+snap.dx),-4000,4000),
        dy:clamp(Math.round(item.layout.dy+snap.dy),-4000,4000)
      }};
      livePatches.set(item.selector,patch);
    }
    refreshLiveLayoutRules(g.node.ownerDocument);
    drawLiveSnapGuides(snap.x,snap.y,g.node.ownerDocument);
    syncLiveOverlay();return;
  }
  if(g.group&&g.dir==="move"){
    const device=liveDevice();
    for(const item of g.group){
      const patch=copy(item.patch),original=addedDeviceGeometry(patch,device);
      patch.geometry={...patch.geometry,[device]:{...original,
        x:Math.round(clamp(original.x+deltaX,-4000,10000)),
        y:Math.round(clamp(original.y+deltaY,-4000,40000))}};
      livePatches.set(item.selector,patch);
      refreshAddedObject(item.node.ownerDocument,patch);
    }
    syncLiveOverlay();return;
  }
  if(g.patch.kind==="insert"){
    const patch=copy(g.patch),device=liveDevice();
    const base=addedDeviceGeometry(g.patch,device);
    const geom={...base};
    if(g.dir==="move"){
      const snap=snapLiveMove(deltaX,deltaY,g,event.altKey);
      geom.x=Math.round(clamp(base.x+snap.dx,-4000,10000));
      geom.y=Math.round(clamp(base.y+snap.dy,-4000,40000));
      drawLiveSnapGuides(snap.x,snap.y,g.node.ownerDocument);
    }else{
      Object.assign(geom,resizableBoxFromDrag(base,g.dir,deltaX,deltaY,
        g.patch.objectType==="image"&&liveLockImageRatio&&!liveCropMode&&!event.altKey));
      geom.x=Math.round(clamp(geom.x,-4000,10000));
      geom.y=Math.round(clamp(geom.y,-4000,40000));
    }
    patch.geometry={...patch.geometry,[device]:geom};
    livePatches.set(g.selector,patch);
    refreshAddedObject(g.node.ownerDocument,patch);
    // Side and corner drags can narrow a text frame and create new lines.
    // Keep the text readable without scaling its font or clipping its content.
    // When dragging a north corner, preserve the opposing bottom edge.
    if(g.patch.objectType==="text"&&
       (g.dir==="e"||g.dir==="w"||g.dir.length===2)){
      const needed=Math.ceil(g.node.scrollHeight+2);
      if(Number.isFinite(needed)&&needed>geom.h&&needed<=5000){
        const addedHeight=needed-geom.h;
        geom.h=needed;
        if(g.dir.includes("n"))
          geom.y=Math.round(clamp(geom.y-addedHeight,-4000,40000));
        patch.geometry[device]=geom;
        livePatches.set(g.selector,patch);
        refreshAddedObject(g.node.ownerDocument,patch);
      }
    }
    syncLiveOverlay();return;
  }
  const next={...g.layout};
  if(g.dir==="move"){
    const snap=snapLiveMove(deltaX,deltaY,g,event.altKey);
    next.dx=clamp(Math.round(g.layout.dx+snap.dx),-4000,4000);
    next.dy=clamp(Math.round(g.layout.dy+snap.dy),-4000,4000);
    drawLiveSnapGuides(snap.x,snap.y,g.node.ownerDocument);
  }else if(g.node.matches(LIVE_REFLOW_TEXT)){
    // Text-box handles change CSS width/height, never transform scale.
    // This behaves like a document or presentation text box: words wrap
    // naturally and glyph width/height remain unchanged.
    const dir=g.dir;
    const originalWidth=g.rect.width,originalHeight=g.rect.height;
    const nextWidth=Math.round(clamp(originalWidth+
      (dir.includes("e")?deltaX:0)-(dir.includes("w")?deltaX:0),64,4000));
    const nextHeight=Math.round(clamp(originalHeight+
      (dir.includes("s")?deltaY:0)-(dir.includes("n")?deltaY:0),24,5000));
    const normal=normaliseTextBoxLayout(g.node,g.layout);
    Object.assign(next,normal);
    next.wrapWidth=nextWidth;
    next.reserveHeight=nextHeight;
    if(dir.includes("w"))next.dx=clamp(Math.round(g.layout.dx+
      (originalWidth-nextWidth)),-4000,4000);
    if(dir.includes("n"))next.dy=clamp(Math.round(g.layout.dy+
      (originalHeight-nextHeight)),-4000,4000);
  }else{
    // Existing images and section containers now change their actual
    // dimensions. Transform scales are cancelled, so descendant text and
    // photos are never stretched horizontally or vertically.
    const box=resizableBoxFromDrag(
      {x:0,y:0,w:g.rect.width,h:g.rect.height},g.dir,deltaX,deltaY,
      g.node.tagName==="IMG"&&liveLockImageRatio&&!liveCropMode&&!event.altKey,64,24);
    Object.assign(next,normaliseElementBoxLayout(g.node,g.layout));
    next.wrapWidth=box.w;
    next.reserveHeight=box.h;
    if(LIVE_CONTAINER_SET.has(g.node.tagName))
      next.sectionHeightMode=g.dir.includes("n")||g.dir.includes("s")?
        "fixed":g.layout.sectionHeightMode==="fixed"?"fixed":"auto";
    next.dx=clamp(Math.round(g.layout.dx+box.x),-4000,4000);
    next.dy=clamp(Math.round(g.layout.dy+box.y),-4000,4000);
  }
  const patch=copy(g.patch);
  patch.layout={...patch.layout,[liveDevice()]:next};
  livePatches.set(g.selector,patch);
  refreshLiveLayoutRules(g.node.ownerDocument);
  // Reflow can move an existing section's native origin. Compensate for
  // that shift so the dragged handle stays under the pointer.
  if(g.dir!=="move"&&LIVE_CONTAINER_SET.has(g.node.tagName)){
    const actual=g.node.getBoundingClientRect();
    const box=resizableBoxFromDrag(
      {x:0,y:0,w:g.rect.width,h:g.rect.height},g.dir,deltaX,deltaY,
      false,64,24);
    const shiftX=Math.round(g.rect.left+box.x-actual.left);
    const shiftY=Math.round(g.rect.top+box.y-actual.top);
    if(shiftX||shiftY){
      next.dx=clamp(Math.round(next.dx+shiftX),-4000,4000);
      next.dy=clamp(Math.round(next.dy+shiftY),-4000,4000);
      patch.layout[liveDevice()]=next;
      livePatches.set(g.selector,patch);
      refreshLiveLayoutRules(g.node.ownerDocument);
    }
  }
  // Corner drags also narrow text frames, so allow natural wrapping
  // and reserve enough height to prevent overflow into nearby elements.
  // A north corner keeps its original bottom edge while the text grows.
  if(g.dir!=="move"&&g.node.matches(LIVE_REFLOW_TEXT)&&
     (g.dir==="e"||g.dir==="w"||g.dir.length===2)){
    const needed=Math.ceil(g.node.scrollHeight+2);
    if(Number.isFinite(needed)&&needed>next.reserveHeight&&needed<=5000){
      const addedHeight=needed-next.reserveHeight;
      next.reserveHeight=needed;
      if(g.dir.includes("n"))
        next.dy=clamp(Math.round(next.dy-addedHeight),-4000,4000);
      patch.layout[liveDevice()]=next;
      livePatches.set(g.selector,patch);
      refreshLiveLayoutRules(g.node.ownerDocument);
    }
  }
  syncLiveOverlay();
}
function cancelLiveGesture(){
  const g=liveGesture;
  if(!g)return;
  liveGesture=null;
  removeLiveSnapGuides();
  // Interrupted drags must not leave an unrecorded edit in the draft.
  livePatches=new Map(g.snapshot.map(p=>[p.selector,p]));
  if(g.node?.ownerDocument?.defaultView){
    if(g.group){
      for(const item of g.group){
        const patch=livePatches.get(item.selector);
        if(patch)refreshAddedObject(g.node.ownerDocument,patch);
      }
    }else if(g.patch.kind==="insert"){
      const original=livePatches.get(g.selector);
      if(original)refreshAddedObject(g.node.ownerDocument,original);
    }else refreshLiveLayoutRules(g.node.ownerDocument);
    if(g.sourceGroup)refreshLiveLayoutRules(g.node.ownerDocument);
  }
  try{
    if(g.anchor?.hasPointerCapture?.(g.pointer))
      g.anchor.releasePointerCapture(g.pointer);
  }catch{/* Capture is already gone when the browser loses focus. */}
  renderLiveInspector();
  syncLiveOverlay();
}
function finishLiveGesture(event){
  const g=liveGesture;
  if(!g||event.pointerId!==g.pointer)return;
  liveGesture=null;
  removeLiveSnapGuides();
  if(event.type==="pointercancel"){
    livePatches=new Map(g.snapshot.map(p=>[p.selector,p]));
    if(g.group){
      for(const item of g.group){
        const restored=livePatches.get(item.selector);
        if(restored)refreshAddedObject(g.node.ownerDocument,restored);
      }
    }else if(g.patch.kind==="insert"){
      const restored=livePatches.get(g.selector);
      if(restored)refreshAddedObject(g.node.ownerDocument,restored);
    }else refreshLiveLayoutRules(g.node.ownerDocument);
    if(g.sourceGroup)refreshLiveLayoutRules(g.node.ownerDocument);
  }else if(g.moved){
    // Mouseup still generates a click; keep it from navigating to a nearby
    // link or selecting a different element after a drag.
    liveSuppressClickUntil=performance.now()+250;
    recordLiveHistory(g.snapshot);
    status(g.dir==="rotate"?"Picture rotated · Undo available":
      g.dir==="crop"?"Picture crop repositioned · Undo available":
      g.dir==="crop-zoom"?"Picture zoom changed inside crop frame · Undo available":
      g.sourceGroup?
      g.sourceGroup.length+" original webpage objects "+
        (g.dir==="move"?"moved":"resized")+" together · Review before publishing":
      "Moved/resized live-page draft saved · Review changes before publishing");
  }else{
    // Pointer capture re-targets the trailing click to the captured node.
    // Re-selecting on that click, particularly during Alt+click, can choose
    // a parent section even though pointerdown correctly chose a paragraph.
    // Uncaptured links still use the normal click handler to navigate.
    liveSuppressClickUntil=performance.now()+200;
  }
  renderLiveInspector();syncLiveOverlay();
}
const LIVE_PANE_TAGS="h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,img,section,article,figure,aside,[data-moon-v2-added-id]";
const LIVE_LAYOUT_PANE_TAGS="div,nav,ul,ol";
function liveElementName(node){
  if(node.tagName==="IMG")return node.alt||node.getAttribute("src")||"Image";
  const id=node.id?"#"+node.id:"";
  const className=[...node.classList||[]].filter(c=>!c.startsWith("moon-")).slice(0,2)
    .map(c=>"."+c).join("");
  const direct=[...node.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE)
    .map(n=>n.textContent.trim()).filter(Boolean).join(" ");
  const text=direct||node.textContent?.trim()||"";
  if(node.matches(LIVE_LAYOUT_PANE_TAGS))
    return (node.tagName.toLowerCase()+id+className+" · "+text).trim();
  return text||node.tagName.toLowerCase()+id+className;
}
function liveSiblingChoices(node){
  const main=node?.ownerDocument.querySelector("main");
  if(!main||!node?.parentElement||node===main)return [];
  return [...node.parentElement.children].filter(candidate=>
    candidate.matches(LIVE_SELECTABLE_TAGS)&&
    candidate.ownerDocument.defaultView.getComputedStyle(candidate).display!=="none"&&
    liveSelector(candidate));
}
function clearLiveLayerPreview(){
  const doc=$("livePageFrame")?.contentDocument;
  for(const node of doc?.querySelectorAll("[data-moon-v2-layer-preview]")||[])
    node.removeAttribute("data-moon-v2-layer-preview");
}
function previewLiveLayer(button){
  const doc=$("livePageFrame")?.contentDocument;
  clearLiveLayerPreview();
  if(!button||workspaceMode!=="live"||!doc)return;
  const key=button.dataset.liveSelector;
  let node=null;
  if(LIVE_ADDED_ID.test(key))node=findAddedNode(doc,key);
  else try{node=doc.querySelector(key);}catch{return;}
  if(node?.isConnected)
    node.setAttribute("data-moon-v2-layer-preview","");
}
function focusLiveLayer(direction){
  const items=[...$("liveElementList").querySelectorAll("button[data-live-selector]")];
  if(!items.length)return;
  const current=items.indexOf(document.activeElement);
  const next=direction==="first"?0:direction==="last"?items.length-1:
    Math.max(0,Math.min(items.length-1,current+(direction==="next"?1:-1)));
  items[next].focus({preventScroll:true});
  items[next].scrollIntoView({block:"nearest",inline:"nearest"});
  previewLiveLayer(items[next]);
}
function renderLiveLayers(){
  const host=$("liveElementList"),doc=$("livePageFrame").contentDocument;
  host.replaceChildren();
  const root=doc?.querySelector("main");
  if(!root)return;
  const filter=$("liveElementSearch").value.toLowerCase().trim();
  const includeLayout=$("liveShowContainers").checked;
  const selector=includeLayout||filter?
    LIVE_PANE_TAGS+","+LIVE_LAYOUT_PANE_TAGS:LIVE_PANE_TAGS;
  const nodes=[...root.querySelectorAll(selector)].filter(node=>{
    const css=node.ownerDocument.defaultView.getComputedStyle(node);
    if(css.display==="none"||css.visibility==="hidden")return false;
    return !!liveElementName(node)||node.hasAttribute("data-moon-v2-added-id");
  });
  const matching=nodes.filter(node=>{
    if(!filter)return true;
    const terms=(node.tagName+" "+liveElementName(node)+" "+node.textContent+" "+
      (node.alt||"")+" "+(node.getAttribute("src")||"")).toLowerCase();
    return terms.includes(filter);
  });
  // Keep the current selection discoverable even when the list contains
  // hundreds of webpage objects or an unrelated search term.
  const visible=matching.slice(0,160);
  const chosen=liveSelected?.node;
  if(chosen?.isConnected&&root.contains(chosen)&&
      !visible.includes(chosen)&&liveSelector(chosen))visible.unshift(chosen);
  $("liveLayerCount").textContent=visible.length+"/"+matching.length+
    (filter?" matches":" objects");
  for(const node of visible){
    const key=liveSelector(node);if(!key)continue;
    const button=document.createElement("button");
    button.type="button";button.className="layer";
    button.dataset.liveSelector=key;
    button.dataset.positionLocked=String(liveGeometryIsLocked(key));
    button.setAttribute("aria-current",String(liveSelected?.node===node));
    button.setAttribute("aria-selected",String(liveAddedMulti.has(key)||
      liveSourceMulti.has(key)));
    const type=document.createElement("span"),label=document.createElement("span");
    type.className="layer-type";type.textContent=node.tagName.toLowerCase();
    label.className="layer-name";
    const name=liveElementName(node);
    label.textContent=(node.hasAttribute("data-moon-v2-added-id")?
      "Added "+(node.getAttribute("data-moon-v2-object-type")||"object")+" · ":"")+
      (liveGeometryIsLocked(key)?"🔒 ":"")+name.replace(/\s+/g," ").slice(0,105);
    if(node===chosen&&!matching.includes(node))
      label.textContent="Selected · "+label.textContent;
    const depth=Math.max(0,key.split(" > ").length-2);
    button.dataset.depth=String(depth);
    button.style.paddingInlineStart=Math.min(70,8+depth*5)+"px";
    button.title=(depth?"Level "+depth+" · ":"")+name.replace(/\s+/g," ").slice(0,240);
    button.append(type,label);host.append(button);
  }
  if(!host.childElementCount){
    const none=document.createElement("p");none.className="empty";
    none.textContent=filter?"No matching elements":"No eligible website elements";
    host.append(none);
  }
}
const LIVE_ARRANGE_TOOLS=["liveAlignLeft","liveAlignCenter","liveAlignRight",
  "liveAlignTop","liveAlignMiddle","liveAlignBottom","liveDistributeH","liveDistributeV",
  "liveMatchWidth","liveMatchHeight","liveMatchSize",
  "livePageLeft","livePageCenter","livePageRight"];
function selectedAddedPatches(){
  const doc=$("livePageFrame").contentDocument;
  return [...liveAddedMulti].map(selector=>{
    const node=findAddedNode(doc,selector);
    const patch=node&&(livePatches.get(selector)||addedPatchFromNode(node,selector));
    return node?.isConnected&&patch?.kind==="insert"?{selector,node,patch}:null;
  }).filter(Boolean);
}
// Source objects keep their own DOM markup. Only a geometry patch is written
// when a selection moves; native links and text are never reconstructed.
function selectedSourcePatches(){
  const doc=$("livePageFrame").contentDocument,main=doc?.querySelector("main");
  if(!main)return [];
  return [...liveSourceMulti].map(selector=>{
    if(LIVE_ADDED_ID.test(selector))return null;
    let node;
    try{node=doc.querySelector(selector);}catch{return null;}
    if(!node||!main.contains(node))return null;
    const stored=livePatches.get(selector);
    if(stored?.kind==="delete"||stored?.kind==="remove-added")return null;
    const patch=stored?copy(stored):node.tagName==="IMG"?
      {selector,kind:"image",expected:node.getAttribute("src")||"",
        src:node.getAttribute("src")||"",alt:node.alt||""}:
      {selector,kind:"layout",expected:(node.textContent||"").trim().slice(0,300)};
    if(!validLivePatch(patch))return null;
    const device=liveDevice();
    const current=patch.layout?.[device]||{};
    const base=current.ox!==undefined&&current.oy!==undefined?
      {}:originalLiveTransform(node);
    return {selector,node,patch,layout:{...defaultLiveLayout(),...base,...current}};
  }).filter(Boolean);
}
function syncLiveMultiSelection(){
  const doc=$("livePageFrame").contentDocument;
  if(doc){
    for(const node of doc.querySelectorAll("[data-moon-v2-added-id]")){
      const selected=liveAddedMulti.has(liveSelector(node));
      if(selected)node.setAttribute("data-moon-v2-multi-selected","");
      else node.removeAttribute("data-moon-v2-multi-selected");
    }
    for(const node of doc.querySelectorAll("[data-moon-v2-source-selected]"))
      node.removeAttribute("data-moon-v2-source-selected");
    for(const item of selectedSourcePatches())
      item.node.setAttribute("data-moon-v2-source-selected","");
  }
  const count=selectedAddedPatches().length;
  const sourceCount=selectedSourcePatches().length;
  const selectionLocked=liveSelectionHasGeometryLock();
  $("liveMultiCount").textContent=(count+sourceCount)+" selected";
  $("liveClearAdded").disabled=!count&&!sourceCount;
  $("liveSelectAdded").disabled=workspaceMode!=="live";
  for(const id of LIVE_ARRANGE_TOOLS)
    $(id).disabled=workspaceMode!=="live"||selectionLocked||
      Math.max(count,sourceCount)<(id.startsWith("liveDistribute")?3:
        id.startsWith("livePage")?1:2);
  for(const button of $("liveElementList").querySelectorAll("[data-live-selector]")){
    const key=button.dataset.liveSelector;
    button.setAttribute("aria-selected",String(liveAddedMulti.has(key)||
      liveSourceMulti.has(key)));
    button.setAttribute("aria-current",String(liveSelected?.node&&liveSelector(liveSelected.node)===key));
  }
}
function selectAllLiveAdded(){
  if(workspaceMode!=="live")return;
  liveSourceMulti.clear();
  const doc=$("livePageFrame").contentDocument;
  liveAddedMulti=new Set([...doc.querySelectorAll("[data-moon-v2-added-id]")]
    .filter(node=>{
      const key=liveSelector(node);
      return livePatches.get(key)?.kind==="insert"||!!addedPatchFromNode(node,key);
    }).map(node=>liveSelector(node)));
  const last=[...liveAddedMulti].at(-1);
  const node=last&&findAddedNode(doc,last);
  if(node)selectLiveElement(node,false,true);
  else clearLiveSelection();
  status(liveAddedMulti.size+" independent webpage objects selected");
}
function nudgeLiveSelection(dx,dy){
  if(preventLockedLiveGeometry())return;
  const sources=selectedSourcePatches();
  if(sources.length>1){
    const before=liveSnapshot(),device=liveDevice();
    for(const item of sources){
      const patch=copy(item.patch),old=item.layout;
      patch.layout={...patch.layout,[device]:{...old,
        dx:clamp(Math.round(old.dx+dx),-4000,4000),
        dy:clamp(Math.round(old.dy+dy),-4000,4000)}};
      livePatches.set(item.selector,patch);
    }
    if(recordLiveHistory(before)){
      refreshLiveLayoutRules(sources[0].node.ownerDocument);
      renderLiveInspector();syncLiveOverlay();syncLiveMultiSelection();
      status(sources.length+" existing webpage objects moved together · Undo available");
    }
    return;
  }
  const selected=selectedAddedPatches();
  if(selected.length<2){
    const node=liveSelected?.node;
    if(!node)return;
    const selector=liveSelector(node),layout=liveLayoutFor(selector);
    if(dx)applyLiveLayoutInput("dx",layout.dx+dx);
    if(dy)applyLiveLayoutInput("dy",layout.dy+dy);
    return;
  }
  const before=liveSnapshot(),device=liveDevice();
  for(const item of selected){
    const g={...addedDeviceGeometry(item.patch,device)};
    g.x=Math.round(clamp(g.x+dx,-4000,10000));
    g.y=Math.round(clamp(g.y+dy,-4000,40000));
    item.patch.geometry={...item.patch.geometry,[device]:g};
    livePatches.set(item.selector,item.patch);
    refreshAddedObject(item.node.ownerDocument,item.patch);
  }
  if(recordLiveHistory(before)){
    syncLiveOverlay();renderLiveInspector();syncLiveMultiSelection();
    status(selected.length+" webpage objects nudged together · Undo available");
  }
}
// Single geometry calculation for added objects and original website
// elements. Source objects are moved only via device-scoped layout patches.
function arrangeLiveBounds(items,mode){
  const minX=Math.min(...items.map(o=>o.g.x));
  const maxX=Math.max(...items.map(o=>o.g.x+o.g.w));
  const minY=Math.min(...items.map(o=>o.g.y));
  const maxY=Math.max(...items.map(o=>o.g.y+o.g.h));
  if(mode==="distributeH"||mode==="distributeV"){
    // PowerPoint's Distribute creates equal *gaps* between the visible
    // object edges, even if every box has a different width or height.
    const horizontal=mode==="distributeH";
    const key=horizontal?"x":"y",size=horizontal?"w":"h";
    const sorted=[...items].sort((a,b)=>a.g[key]-b.g[key]);
    const start=sorted[0].g[key];
    const end=Math.max(...sorted.map(item=>item.g[key]+item.g[size]));
    const occupied=sorted.reduce((sum,item)=>sum+item.g[size],0);
    const spacing=(end-start-occupied)/(sorted.length-1);
    let next=start;
    for(const item of sorted){
      item.g[key]=next;
      next+=item.g[size]+spacing;
    }
  }else if(["matchWidth","matchHeight","matchSize"].includes(mode)){
    // First selected object is the key object. Keep every object's own
    // position and its other dimension, including the original key box.
    const key=items[0].g;
    for(const item of items.slice(1)){
      if(mode!=="matchHeight")item.g.w=key.w;
      if(mode!=="matchWidth")item.g.h=key.h;
    }
  }else{
    for(const item of items){
      const g=item.g;
      if(mode==="alignLeft")g.x=minX;
      if(mode==="alignCenter")g.x=(minX+maxX-g.w)/2;
      if(mode==="alignRight")g.x=maxX-g.w;
      if(mode==="alignTop")g.y=minY;
      if(mode==="alignMiddle")g.y=(minY+maxY-g.h)/2;
      if(mode==="alignBottom")g.y=maxY-g.h;
    }
  }
}
function arrangeSelectedLive(mode){
  if(preventLockedLiveGeometry())return;
  if(workspaceMode!=="live"||liveEditing||liveGesture)return;
  const device=liveDevice(),source=selectedSourcePatches();
  const needed=mode.startsWith("distribute")?3:2;
  if(source.length>=needed){
    const items=source.map(item=>{
      const rect=item.node.getBoundingClientRect();
      return {...item,rect,g:{x:rect.x,y:rect.y,w:rect.width,h:rect.height}};
    });
    arrangeLiveBounds(items,mode);
    const previous=liveSnapshot();
    let changed=false;
    const sizing=mode.startsWith("match");
    for(const item of items){
      const dx=Math.round(item.g.x-item.rect.x);
      const dy=Math.round(item.g.y-item.rect.y);
      const widthChanged=sizing&&Math.abs(item.g.w-item.rect.width)>0.5;
      const heightChanged=sizing&&Math.abs(item.g.h-item.rect.height)>0.5;
      if(!dx&&!dy&&!widthChanged&&!heightChanged)continue;
      const layout=sizing?
        normaliseElementBoxLayout(item.node,item.layout):{...item.layout};
      layout.dx=clamp(Math.round(item.layout.dx+dx),-4000,4000);
      layout.dy=clamp(Math.round(item.layout.dy+dy),-4000,4000);
      if(sizing){
        layout.wrapWidth=Math.round(clamp(item.g.w,64,4000));
        layout.reserveHeight=Math.round(clamp(item.g.h,24,5000));
        if(LIVE_CONTAINER_SET.has(item.node.tagName))
          layout.sectionHeightMode="fixed";
      }
      const patch=copy(item.patch);
      patch.layout={...patch.layout,[device]:layout};
      livePatches.set(item.selector,patch);
      changed=true;
    }
    if(changed&&sizing){
      const doc=items[0].node.ownerDocument;
      refreshLiveLayoutRules(doc);
      // Changing source widths can reflow neighbouring paragraphs. Realign
      // all selected items to their original page positions after reflow.
      for(const item of items){
        const patch=livePatches.get(item.selector);
        if(!patch?.layout?.[device])continue;
        const layout=patch.layout[device];
        if(mode==="matchWidth"&&item.node.matches(LIVE_REFLOW_TEXT)){
          const needed=Math.ceil(item.node.scrollHeight+2);
          if(Number.isFinite(needed)&&needed>layout.reserveHeight&&needed<=5000)
            layout.reserveHeight=needed;
        }
        const actual=item.node.getBoundingClientRect();
        layout.dx=clamp(Math.round(layout.dx+item.g.x-actual.x),-4000,4000);
        layout.dy=clamp(Math.round(layout.dy+item.g.y-actual.y),-4000,4000);
      }
      refreshLiveLayoutRules(doc);
    }
    if(changed&&recordLiveHistory(previous)){
      if(!sizing)refreshLiveLayoutRules(items[0].node.ownerDocument);
      renderLiveInspector();syncLiveOverlay();syncLiveMultiSelection();
      status(items.length+" original webpage elements arranged on "+device+
        " · Source markup preserved · Undo available");
    }
    return;
  }
  const entries=selectedAddedPatches();
  if(entries.length<needed)return;
  const items=entries.map(({selector,patch,node})=>({selector,patch,node,
    g:{...addedDeviceGeometry(patch,device)}}));
  arrangeLiveBounds(items,mode);
  const previous=liveSnapshot();let changed=false;
  for(const item of items){
    item.g.x=Math.round(clamp(item.g.x,-4000,10000));
    item.g.y=Math.round(clamp(item.g.y,-4000,40000));
    const original=addedDeviceGeometry(item.patch,device);
    if(item.g.x===original.x&&item.g.y===original.y&&
       item.g.w===original.w&&item.g.h===original.h)continue;
    item.patch.geometry={...item.patch.geometry,[device]:item.g};
    livePatches.set(item.selector,item.patch);
    refreshAddedObject(item.node.ownerDocument,item.patch);changed=true;
  }
  if(changed&&recordLiveHistory(previous)){
    syncLiveOverlay();renderLiveInspector();syncLiveMultiSelection();
    status("Objects arranged on "+device+" · Undo restores the previous arrangement");
  }
}
// Align the selected group to the actual webpage's content column, not
// the editor sidebar or the current browser viewport. Source and inserted
// objects both retain their own sizes and original DOM parent containers.
function alignLiveSelectionToPage(edge){
  if(!["left","center","right"].includes(edge)||workspaceMode!=="live"||
     liveEditing||liveGesture||preventLockedLiveGeometry())return;
  const main=$("livePageFrame").contentDocument?.querySelector("main");
  if(!main)return;
  const source=selectedSourcePatches(),added=selectedAddedPatches();
  const group=source.length?source:added.length?added:[];
  if(!group.length)return;
  const boxes=group.map(item=>item.node.getBoundingClientRect());
  const left=Math.min(...boxes.map(b=>b.left));
  const right=Math.max(...boxes.map(b=>b.right));
  const root=main.getBoundingClientRect();
  const css=main.ownerDocument.defaultView.getComputedStyle(main);
  const contentLeft=root.left+(parseFloat(css.paddingLeft)||0);
  const contentRight=root.right-(parseFloat(css.paddingRight)||0);
  if(!(contentRight>contentLeft))return;
  const target=edge==="left"?contentLeft:
    edge==="right"?contentRight-(right-left):
      (contentLeft+contentRight-(right-left))/2;
  const dx=Math.round(target-left);
  if(dx) nudgeLiveSelection(dx,0);
  else status("Selection is already aligned to the "+edge+" of the webpage content");
}
function updateLiveLayerSelection(){
  syncLiveMultiSelection();
}
function clearLiveSelection(preserveMulti=false){
  finishCropSliderPreview();finishPictureEffectPreview();
  if(!preserveMulti){liveAddedMulti.clear();liveSourceMulti.clear();}
  removeLiveSnapGuides();
  if(liveSelected?.node?.isConnected){
    liveSelected.node.removeAttribute("data-moon-v2-live-selected");
    liveSelected.node.removeAttribute("data-moon-v2-crop-active");
  }
  liveSelected=null;
  removeLiveOverlay();
  $("copyLiveObject").disabled=true;
  renderLiveInspector();
  updateLiveLayerSelection();
  syncLiveMultiSelection();
}
function eligibleLiveParent(node){
  const main=node?.ownerDocument?.querySelector("main");
  for(let ancestor=node?.parentElement;ancestor&&ancestor!==main;
      ancestor=ancestor.parentElement)
    if(ancestor.matches(LIVE_SELECTABLE_TAGS))return ancestor;
  return null;
}
function selectLiveHierarchy(direction){
  const node=liveSelected?.node;
  if(!node||workspaceMode!=="live"||liveEditing)return;
  const target=direction==="parent"?eligibleLiveParent(node):
    node.querySelector(LIVE_SELECTABLE_TAGS);
  if(!target)return;
  selectLiveElement(target);
  target.scrollIntoView({block:"nearest",inline:"nearest"});
  syncLiveOverlay();
}
function selectLiveContainingSection(){
  const node=liveSelected?.node;
  if(workspaceMode!=="live"||liveEditing||!node)return;
  const ancestor=liveSectionAncestor(node);
  if(!ancestor)return;
  // Make the selected section visible in the layer list as well as on-page.
  if(!$("liveShowContainers").checked){
    $("liveShowContainers").checked=true;
    renderLiveLayers();
  }
  selectLiveElement(ancestor);
  ancestor.scrollIntoView({block:"nearest",inline:"nearest"});
  syncLiveOverlay();
}
function navigateLiveSibling(step){
  const node=liveSelected?.node;
  if(!node||workspaceMode!=="live"||liveEditing)return;
  const list=liveSiblingChoices(node),index=list.indexOf(node);
  if(index<0||!list[index+step])return;
  selectLiveElement(list[index+step]);
  list[index+step].scrollIntoView({block:"nearest",inline:"nearest"});
  renderLiveLayers();
  syncLiveOverlay();
}
function locateLiveSelected(){
  if(!liveSelected?.node||workspaceMode!=="live")return;
  $("liveElementSearch").value="";
  if(liveSelected.node.matches(LIVE_LAYOUT_PANE_TAGS))
    $("liveShowContainers").checked=true;
  renderLiveLayers();
  syncLiveMultiSelection();
  const key=liveSelector(liveSelected.node);
  const item=[...$("liveElementList").querySelectorAll("[data-live-selector]")]
    .find(node=>node.dataset.liveSelector===key);
  item?.scrollIntoView({block:"nearest",inline:"nearest"});
  liveSelected.node.scrollIntoView({block:"nearest",inline:"nearest"});
  syncLiveOverlay();
}
function setLiveClippingRelease(enabled){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(!node||!selector||LIVE_ADDED_ID.test(selector)||
     workspaceMode!=="live"||liveEditing)return;
  const patch=livePatchForSelected(),before=liveSnapshot();
  const device=liveDevice();
  const layout=patch.layout?.[device]?
    {...patch.layout[device]}:{...liveLayoutFor(selector)};
  if(enabled)layout.releaseClip=true;
  else delete layout.releaseClip;
  patch.layout={...patch.layout,[device]:layout};
  livePatches.set(selector,patch);
  if(recordLiveHistory(before)){
    refreshLiveLayoutRules(node.ownerDocument);
    renderLiveInspector();syncLiveOverlay();
    status(enabled?"Clipping released on this screen · Review neighbouring elements · Undo available":
      "Clipping restored on this screen · Undo available");
  }
}
function selectLiveElement(node,additive=false,preserveMulti=false){
  const doc=$("livePageFrame").contentDocument;
  if(!node||!doc?.querySelector("main")?.contains(node))return;
  const key=liveSelector(node);
  if(!key){status("This element exceeds the editor's safe hierarchy depth");return;}
  const isAdded=LIVE_ADDED_ID.test(key);
  if(additive&&!isAdded){
    const group=selectedSourcePatches();
    // Selecting nested containers and children together would double-move
    // descendants, so keep grouped moves to independent page elements.
    if(group.some(item=>item.node!==node&&
      (item.node.contains(node)||node.contains(item.node)))){
      status("Choose independent webpage objects to move as a group");
      return;
    }
    liveAddedMulti.clear();
    if(liveSourceMulti.has(key))liveSourceMulti.delete(key);
    else liveSourceMulti.add(key);
    const last=[...liveSourceMulti].at(-1);
    if(!last){clearLiveSelection();return;}
    selectLiveElement(doc.querySelector(last),false,true);
    return;
  }
  if(additive&&isAdded){
    liveSourceMulti.clear();
    if(liveAddedMulti.has(key))liveAddedMulti.delete(key);
    else liveAddedMulti.add(key);
    const last=[...liveAddedMulti].at(-1);
    if(!last){clearLiveSelection();return;}
    const primary=liveAddedMulti.has(key)?node:findAddedNode(doc,last);
    selectLiveElement(primary,false,true);
    return;
  }
  if(!preserveMulti){liveAddedMulti.clear();liveSourceMulti.clear();}
  if(isAdded)liveAddedMulti.add(key);
  else liveSourceMulti.add(key);
  clearLiveSelection(true);
  clearLiveSectionHover();
  if(liveSelected?.node!==node){finishCropSliderPreview();finishPictureEffectPreview();}
  if(liveSelected?.node!==node)liveCropMode=false;
  liveSelected={node,page:currentPage};
  node.setAttribute("data-moon-v2-live-selected","");
  $("copyLiveObject").disabled=LIVE_CONTAINER_SET.has(node.tagName)&&
    !node.hasAttribute("data-moon-v2-added-id");
  renderLiveInspector();syncLiveOverlay();updateLiveLayerSelection();syncLiveMultiSelection();
  const label=(node.tagName==="IMG"?node.alt||"image":node.textContent||"text")
    .trim().replace(/\s+/g," ").slice(0,80);
  let clipped=false;
  for(let p=node.parentElement;p&&p.tagName!=="MAIN";p=p.parentElement){
    const css=node.ownerDocument.defaultView.getComputedStyle(p);
    if(["hidden","clip"].includes(css.overflowX)||["hidden","clip"].includes(css.overflowY)){
      clipped=true;break;
    }
  }
  status("Live element selected: "+label+
    (clipped?" · Parent container may clip movements outside its bounds":" · Original website unchanged"));
}
function reportLiveAssets(){
  const label=$("liveAssetStatus"),doc=$("livePageFrame").contentDocument;
  if(!doc?.body){label.textContent="The selected page could not be loaded";return;}
  const missingImages=[...doc.images].filter(image=>
    image.hasAttribute("src")&&image.complete&&image.naturalWidth===0&&image.loading!=="lazy");
  const missingStyles=[...doc.querySelectorAll('link[rel~="stylesheet"]')].filter(
    link=>!link.disabled&&!link.sheet);
  const warnings=[];
  if(missingImages.length)warnings.push(missingImages.length+" missing image"+(missingImages.length===1?"":"s"));
  if(missingStyles.length)warnings.push(missingStyles.length+" missing stylesheet"+(missingStyles.length===1?"":"s"));
  const sourceLabel=liveSourceProvenance==="github"?"GitHub main source verified":
    "Deployed-page fallback · GitHub source unverified";
  label.textContent=sourceLabel+" · "+liveWidth+"px viewport"+
    (warnings.length?" · "+warnings.join(" · "):"");
  label.classList.toggle("has-warning",!!warnings.length||liveSourceProvenance!=="github");
}
// Ctrl/Command-click repeatedly at one point to reach objects occluded by
// other objects, including overlapping photos and their parent containers.
// The candidates come from the real iframe's element hit-test stack.
function selectLiveUnderneath(event){
  const doc=event.target.ownerDocument,main=doc.querySelector("main");
  if(!main)return false;
  const stack=[],seen=new Set();
  for(const hit of doc.elementsFromPoint(event.clientX,event.clientY)){
    if(hit.closest?.("#moon-v2-live-overlay"))continue;
    for(let node=hit;node&&node!==main;node=node.parentElement){
      if(!main.contains(node))break;
      if(!node.matches(LIVE_SELECTABLE_TAGS))continue;
      const key=liveSelector(node);
      if(!key||seen.has(key))continue;
      seen.add(key);stack.push(node);
    }
  }
  if(!stack.length)return false;
  const current=stack.indexOf(liveSelected?.node);
  const next=stack[(current+1)%stack.length];
  selectLiveElement(next);
  status("Overlapping object "+(stack.indexOf(next)+1)+"/"+stack.length+
    " selected · Ctrl/Command-click again to choose beneath it");
  return true;
}
function bindLiveDocument(){
  const frame=$("livePageFrame"),doc=frame.contentDocument;
  if(liveObserver){liveObserver.disconnect();liveObserver=null;}
  clearLiveSelection();
  if(!doc?.body||!doc.querySelector("main")){
    $("workspaceExplanation").textContent=
      "This page could not be displayed. Check that the selected HTML page exists in the site repository.";
    fitLivePage();return;
  }
  const count=applyPatchesToDocument(doc);
  if(livePatches.size&&count<livePatches.size)
    status("Some live-page edits could not be reapplied; the source may have changed");
  const sheet=doc.createElement("style");
  sheet.textContent='[data-moon-v2-live-selected]{outline:2px solid #287dbb!important;outline-offset:2px!important;cursor:crosshair!important}'+
    '[data-moon-v2-multi-selected]{outline:2px dashed #bf3d8a!important;outline-offset:3px!important;}'+
    '[data-moon-v2-source-selected]{outline:2px dashed #bf3d8a!important;outline-offset:3px!important;}'+
    '[data-moon-v2-layer-preview]:not([data-moon-v2-live-selected]){outline:3px dotted #8250b5!important;outline-offset:5px!important;}'+
    '[data-moon-v2-section-hover]:not([data-moon-v2-live-selected]){outline:3px dashed #287dbb!important;outline-offset:-3px!important;}'+
    '[data-moon-v2-crop-active]{touch-action:none!important;cursor:crosshair!important;}'+
    '[data-moon-v2-live-selected][data-moon-v2-multi-selected],'+
    '[data-moon-v2-live-selected][data-moon-v2-source-selected]{outline:3px solid #287dbb!important;}';
  (doc.head||doc.documentElement).append(sheet);
  doc.addEventListener("keydown",event=>{
    if(workspaceMode!=="live")return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="s"){
      event.preventDefault();saveActiveDraft();return;
    }
    if(liveEditing){
      if(event.key==="Escape"){event.preventDefault();cancelLiveText();}
      return;
    }
    if(event.target.closest?.("input,textarea,select,[contenteditable=true]"))return;
    if((event.ctrlKey||event.metaKey)&&event.shiftKey&&liveSelected?.node){
      if(event.key.toLowerCase()==="c"){
        event.preventDefault();copyLiveFormat();return;
      }
      if(event.key.toLowerCase()==="v"){
        event.preventDefault();pasteLiveFormat();return;
      }
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="a"){
      event.preventDefault();selectAllLiveAdded();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c"&&liveSelected?.node){
      if(doc.defaultView.getSelection()?.toString().trim())return;
      event.preventDefault();copyLiveSelection();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="v"&&liveObjectClipboard){
      event.preventDefault();pasteLiveSelection();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="d"&&liveSelected?.node){
      event.preventDefault();$("duplicate").click();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key==="]"&&liveSelected?.node){
      event.preventDefault();setLiveLayer(true);return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key==="["&&liveSelected?.node){
      event.preventDefault();setLiveLayer(false);return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){
      event.preventDefault();
      liveUndoAction(event.shiftKey);return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="y"){
      event.preventDefault();liveUndoAction(true);return;
    }
    if(event.key==="Escape"){
      if(liveCropMode){event.preventDefault();setLiveCropMode(false);}
      else clearLiveSelection();
      return;
    }
    if((event.key==="Delete"||event.key==="Backspace")&&liveSelected?.node){
      event.preventDefault();deleteSelectedLiveElement();return;
    }
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    const change=moves[event.key];
    if(change&&liveSelected?.node&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      event.preventDefault();
      const step=event.shiftKey?10:1;
      if(liveCropMode&&liveSelected.node.tagName==="IMG")
        nudgeLiveImageCrop(change[0]*step,change[1]*step);
      else nudgeLiveSelection(change[0]*step,change[1]*step);
      syncLiveOverlay();
    }
  },true);
  doc.addEventListener("pointerdown",event=>{
    if(workspaceMode!=="live"||liveEditing||event.button!==0)return;
    if(event.target.closest?.("#moon-v2-live-overlay"))return;
    if((event.ctrlKey||event.metaKey)&&!event.shiftKey){
      event.preventDefault();event.stopPropagation();
      liveSuppressClickUntil=performance.now()+300;
      selectLiveUnderneath(event);return;
    }
    // Select and start a move in one pointer gesture. Previously a user had
    // to click, release and then start a *second* drag on the same element.
    const link=event.target.closest?.("a[href]");
    // A linked picture is still a selectable photo in an editor.
    // Ordinary text links retain their navigation behaviour.
    const onPicture=!!event.target.closest?.("img");
    if(link&&!onPicture&&!liveSectionPickMode&&!liveCropMode&&
       !event.altKey&&!event.shiftKey)return;
    const target=liveEventTarget(event);
    if(!target||!doc.querySelector("main")?.contains(target))return;
    if(event.shiftKey){
      event.preventDefault();
      liveSuppressClickUntil=performance.now()+250;
      selectLiveElement(target,true);
      return;
    }
    if(target!==liveSelected?.node){
      const key=liveSelector(target);
      const keep=LIVE_ADDED_ID.test(key)?
        liveAddedMulti.has(key):liveSourceMulti.has(key);
      selectLiveElement(target,false,keep);
    }
    // A touch tap selects without capturing the pointer, so users can still
    // scroll the responsive webpage. Mouse/pen can drag immediately.
    if(liveCropMode&&target.tagName==="IMG")return; // Cut with pink edge handles.
    if(event.pointerType!=="touch")startLiveGesture(event,"move",target);
  },true);
  doc.addEventListener("pointermove",event=>{
    if(!liveSectionPickMode||liveGesture||liveEditing||workspaceMode!=="live"){
      clearLiveSectionHover();return;
    }
    if(event.target.closest?.("#moon-v2-live-overlay"))return;
    const target=liveEventTarget(event);
    if(target===liveSectionHover)return;
    clearLiveSectionHover();
    if(target&&target!==liveSelected?.node){
      liveSectionHover=target;
      target.setAttribute("data-moon-v2-section-hover","");
    }
  },true);
  doc.addEventListener("pointermove",moveLiveGesture,true);
  doc.addEventListener("pointerup",finishLiveGesture,true);
  doc.addEventListener("pointercancel",finishLiveGesture,true);
  doc.addEventListener("lostpointercapture",event=>{
    if(liveGesture?.pointer===event.pointerId)cancelLiveGesture();
  },true);
  doc.defaultView.addEventListener("blur",cancelLiveGesture);
  doc.addEventListener("scroll",syncLiveOverlay,true);
  doc.defaultView.addEventListener("resize",syncLiveOverlay);
  doc.addEventListener("click",event=>{
    if(workspaceMode!=="live")return;
    if(performance.now()<liveSuppressClickUntil){
      event.preventDefault();event.stopPropagation();return;
    }
    if(event.target.closest?.("#moon-v2-live-overlay"))return;
    if(liveEditing)return;
    const link=event.target.closest?.("a[href]");
    if(link&&event.target.closest?.("img")){
      event.preventDefault();event.stopPropagation();return;
    }
    if(liveCropMode&&link&&
       (link.contains(liveSelected?.node)||liveSelected?.node?.contains(link))){
      event.preventDefault();event.stopPropagation();return;
    }
    if(liveSectionPickMode){
      // Section-selection clicks must never navigate away or activate
      // embedded links/buttons in the page being edited.
      if(link||event.target.closest?.("button,input,[role=button]")){
        event.preventDefault();event.stopPropagation();
      }
      return;
    }
    if(link&&!event.altKey){
      event.preventDefault();
      const raw=link.getAttribute("href")||"";
      try{
        const destination=new URL(raw,doc.baseURI);
        if(!["http:","https:","mailto:"].includes(destination.protocol))return;
        if(destination.origin===location.origin){
          const name=decodeURIComponent(destination.pathname.split("/").at(-1));
          if(PAGES.has(name)){
            if(name===currentPage&&destination.hash){
              doc.getElementById(decodeURIComponent(destination.hash.slice(1)))?.scrollIntoView();
            }else{
              $("page").value=name;
              changePage(name);
            }
            return;
          }
        }
        window.open(destination.href,"_blank","noopener,noreferrer");
        return;
      }catch{status("Cannot open an invalid webpage link");return;}
    }
    const node=liveEventTarget(event);
    if(node&&liveSelected?.node!==node)selectLiveElement(node,event.shiftKey);
    else if(!node)clearLiveSelection();
  },true);
  doc.addEventListener("dblclick",event=>{
    if(workspaceMode!=="live"||liveEditing||event.target.closest?.("a[href]")&&!event.altKey)return;
    const node=event.target.closest?.(LIVE_EDITABLE_TAGS);
    if(!node||node.tagName==="IMG"||!doc.querySelector("main")?.contains(node))return;
    event.preventDefault();
    if(node!==liveSelected?.node)selectLiveElement(node);
    editLiveText();
  },true);
  liveObserver=new ResizeObserver(()=>{fitLivePage();syncLiveOverlay();});
  liveObserver.observe(doc.documentElement);
  liveObserver.observe(doc.body);
  doc.fonts?.ready?.then(()=>{fitLivePage();reportLiveAssets();});
  for(const image of doc.querySelectorAll("img")){
    if(!image.complete){
      image.addEventListener("load",()=>{fitLivePage();reportLiveAssets();},{once:true});
      image.addEventListener("error",reportLiveAssets,{once:true});
    }
  }
  fitLivePage();reportLiveAssets();renderLiveLayers();
  const restore=pendingLiveViewRestore;
  pendingLiveViewRestore=null;
  if(restore?.page===currentPage){
    const candidate=restore.selector&&
      (LIVE_ADDED_ID.test(restore.selector)?
        findAddedNode(doc,restore.selector):doc.querySelector(restore.selector));
    const same=candidate&&candidate.tagName===restore.tag&&
      (candidate.tagName==="IMG"?
        candidate.getAttribute("src")===restore.text:
        (candidate.textContent||"").trim().slice(0,300)===restore.text);
    if(same)selectLiveElement(candidate);
    if(restore.addedSelection?.length){
      const retained=restore.addedSelection.filter(key=>
        LIVE_ADDED_ID.test(key)&&!!findAddedNode(doc,key));
      if(retained.length){
        liveAddedMulti=new Set(retained);
        const primary=same&&LIVE_ADDED_ID.test(restore.selector)?
          candidate:findAddedNode(doc,retained.at(-1));
        if(primary)selectLiveElement(primary,false,true);
      }
    }
    if(restore.sourceSelection?.length){
      const retained=restore.sourceSelection.filter(key=>{
        try{return !LIVE_ADDED_ID.test(key)&&
          !!doc.querySelector("main")?.contains(doc.querySelector(key));}
        catch{return false;}
      });
      if(retained.length){
        liveAddedMulti.clear();
        liveSourceMulti=new Set(retained);
        const primary=same&&!LIVE_ADDED_ID.test(restore.selector)?
          candidate:doc.querySelector(retained.at(-1));
        if(primary)selectLiveElement(primary,false,true);
      }
    }
    doc.defaultView.scrollTo(restore.x,restore.y);
    requestAnimationFrame(()=>doc.defaultView?.scrollTo(restore.x,restore.y));
  }
}
async function loadLivePage(page=currentPage,{force=false}={}){
  if(!PAGES.has(page))return;
  if(liveEditing)saveLiveText();
  const serial=++liveSerial;
  $("liveAssetStatus").textContent="Loading GitHub main source…";
  $("liveAssetStatus").classList.remove("has-warning");
  if(liveObserver){liveObserver.disconnect();liveObserver=null;}
  clearLiveSectionHover();
  clearLiveSelection();
  const frame=$("livePageFrame");
  let source;
  try{
    source=await fetchGithubPageSource(page,{force});
  }catch(error){
    // Keep an explicit fallback for offline editors or API rate limits.
    // It can be edited, but it is NEVER described as publication-verified.
    try{
      const response=await fetch(new URL(page,location.href),{cache:"no-store"});
      if(!response.ok)throw Error("Website returned HTTP "+response.status);
      source={html:await response.text(),sha:null,verified:false};
      status("Showing deployed-page fallback · GitHub verification is needed before publishing");
    }catch{
      if(serial!==liveSerial||page!==currentPage)return;
      $("liveAssetStatus").textContent="Cannot load either GitHub main or the website. "+error.message;
      $("liveAssetStatus").classList.add("has-warning");return;
    }
  }
  if(serial!==liveSerial||page!==currentPage)return;
  liveSourceProvenance=source.verified?"github":"fallback";
  liveDisplayedSourceHtml=source.html;
  // Image choices are collected from the exact HTML being edited, not from
  // a potentially delayed copy on GitHub Pages.
  const imageDoc=new DOMParser().parseFromString(source.html,"text/html");
  const assets=new Map();
  for(const img of imageDoc.querySelectorAll("main img[src]")){
    const path=img.getAttribute("src")||"";
    if(safeImageSource(path)&&!assets.has(path))
      assets.set(path,{src:path,alt:img.alt||"",
        w:Number(img.getAttribute("width"))||260,h:Number(img.getAttribute("height"))||190});
    if(assets.size>=75)break;
  }
  pageImages=[...assets.values()];renderImageLibrary();
  frame.onload=()=>{
    if(serial===liveSerial&&page===currentPage)bindLiveDocument();
  };
  // srcdoc resolves relative CSS, fonts, scripts, and assets against the
  // editor's same-origin base, using the real website's own HTML unchanged.
  // It is never serialized back to GitHub from this iframe.
  frame.srcdoc=source.html;
}
function copySelectedLiveElement(){
  const selection=liveSelected;
  if(!selection||selection.page!==currentPage||!selection.node?.isConnected||
    LIVE_CONTAINER_SET.has(selection.node.tagName))return;
  const node=selection.node,doc=node.ownerDocument,main=doc.querySelector("main");
  if(!main||!main.contains(node))return;
  const rect=node.getBoundingClientRect(),base=main.getBoundingClientRect();
  const css=doc.defaultView.getComputedStyle(node);
  const image=node.tagName==="IMG";
  const src=image?(node.getAttribute("src")||""):"";
  if(image&&!safeImageSource(src)){
    status("This image uses an unsupported source URL. Choose a local site asset.");return;
  }
  const text=image?"":node.innerText?.trim()||node.textContent?.trim()||"";
  const attrs={
    name:(image?node.alt||"Image":node.tagName.toLowerCase()+" · "+text).slice(0,120),
    x:Math.round(rect.left-base.left),y:Math.round(rect.top-base.top),
    w:clamp(Math.round(rect.width),MIN_W,8000),h:clamp(Math.round(rect.height),MIN_H,20000),
    font:clamp(Math.round(parseFloat(css.fontSize)||18),10,120),
    color:hexColour(css.color,"#1c2622"),family:css.fontFamily||"Georgia, serif",
    align:["left","center","right"].includes(css.textAlign)?css.textAlign:"left"
  };
  if(image){attrs.src=src;attrs.alt=node.alt||"";}
  else{attrs.text=text.slice(0,30000);attrs.rich=cleanRich(node.innerHTML);
    attrs.tag=node.tagName.toLowerCase();}
  add(image?"image":"text",attrs);
  status("Copied selected live element into an independent editable object · Original unchanged");
}
function fitCanvas(){
  const viewport=$("scrollspace");
  if(!viewport||!viewport.clientWidth)return;
  // Keep all edge handles accessible within the available centre column.
  const available=Math.max(250,viewport.clientWidth-80);
  zoom=Math.round(clamp(available/scene.width,.4,1)*20)/20;
  $("zoom").value=String(Math.round(zoom*100));
  $("zoomValue").textContent=Math.round(zoom*100)+"%";
  render();
  viewport.scrollLeft=0;
}
function render(){
  const stage=$("stage");
  stage.replaceChildren();
  $("stageWrapper").style.width=(scene.width*zoom)+"px";
  $("stageWrapper").style.height=(scene.height*zoom)+"px";
  stage.style.width=scene.width+"px";stage.style.height=scene.height+"px";
  stage.style.transform="scale("+zoom+")";
  for(const obj of [...scene.objects].sort((a,b)=>a.z-b.z||a.id-b.id))stage.append(makeSceneElement(obj));
  renderLayers();renderProperties();refreshUndo();
}
async function loadPageImageLibrary(page,serial){
  try{
    const response=await fetch(new URL(page,location.href),{cache:"no-cache"});
    if(!response.ok)throw Error("Page unavailable");
    const source=new DOMParser().parseFromString(await response.text(),"text/html");
    const unique=new Map();
    for(const img of source.querySelectorAll("main img[src]")){
      const src=img.getAttribute("src")||"";
      if(!safeImageSource(src)||unique.has(src))continue;
      unique.set(src,{src,alt:img.alt||"",w:Number(img.getAttribute("width"))||260,
        h:Number(img.getAttribute("height"))||190});
      if(unique.size>=75)break;
    }
    if(currentPage!==page||serial!==loadSerial)return;
    pageImages=[...unique.values()];renderImageLibrary();
  }catch{
    // Image browsing is optional. Keep any current canvas draft untouched.
  }
}
function renderImageLibrary(){
  const container=$("imageLibrary");
  container.replaceChildren();
  if(!pageImages.length){
    const empty=document.createElement("p");
    empty.className="help";
    empty.textContent="Import a page to see its available images.";
    container.append(empty);return;
  }
  for(let i=0;i<pageImages.length;i++){
    const item=pageImages[i],button=document.createElement("button");
    button.type="button";button.dataset.imageIndex=String(i);
    button.title=item.alt||item.src;
    button.setAttribute("aria-label","Insert or replace image: "+(item.alt||item.src));
    const thumb=document.createElement("img");
    thumb.loading="lazy";thumb.src=item.src;
    thumb.alt="";
    const label=document.createElement("span");
    label.textContent=(item.alt||item.src.split("/").at(-1)).slice(0,54);
    button.append(thumb,label);
    container.append(button);
  }
}
function renderLayers(){
  const host=$("layers");host.replaceChildren();
  for(const obj of [...scene.objects].sort((a,b)=>b.z-a.z||b.id-a.id)){
    const button=document.createElement("button");button.className="layer"+(selected.has(obj.id)?" selected":"");
    button.dataset.layerId=String(obj.id);button.title=obj.name;
    const type=document.createElement("span");type.className="layer-type";
    type.textContent=obj.hidden?"◌":obj.locked?"🔒":obj.type==="image"?"▧":obj.type==="text"?"T":"▢";
    const name=document.createElement("span");name.className="layer-name";name.textContent=obj.name;
    button.append(type,name);host.append(button);
  }
  $("layerCount").textContent=scene.objects.length+" objects";
}
const propertyIds={x:"propX",y:"propY",w:"propW",h:"propH",name:"objectName",
  text:"propText",src:"propSrc",alt:"propAlt",font:"propFont",family:"propFamily",
  align:"propAlign",color:"propColor",bg:"propBg"};
function renderProperties(){
  const obj=lookup(activeId);
  $("properties").hidden=!obj;$("emptySelection").hidden=!!obj;
  if(!obj)return;
  for(const [key,id] of Object.entries(propertyIds)){
    $(id).disabled=obj.locked;
    if($(id).type==="color")$(id).value=/^#[0-9a-f]{6}$/i.test(obj[key])?obj[key]:"#ffffff";
    else $(id).value=obj[key]??"";
  }
  const isText=obj.type==="text",isImage=obj.type==="image";
  $("propTransparent").checked=obj.transparent;
  $("propTransparent").disabled=obj.locked;
  const shape=obj.type==="shape";
  $("shapeKindLabel").hidden=!shape;
  $("propShapeKind").hidden=!shape;
  $("propShapeKind").disabled=obj.locked;
  if(shape)$("propShapeKind").value=obj.shapeKind||"rectangle";
  $("replaceImage").hidden=!isImage;
  $("replaceImage").disabled=obj.locked;
  for(const id of ["textLabel","propText","fitText"])$(id).hidden=!isText;
  $("fitText").disabled=obj.locked;
  for(const id of ["srcLabel","propSrc","altLabel","propAlt"])$(id).hidden=!isImage;
  $("lock").textContent=obj.locked?"Unlock":"Lock";
  $("hide").textContent=obj.hidden?"Show":"Hide";
  const moveable=scene.objects.filter(item=>selected.has(item.id)&&!item.locked).length;
  for(const id of ["alignLeft","alignCenter","alignTop"])$(id).disabled=moveable<2;
  for(const id of ["distributeH","distributeV"])$(id).disabled=moveable<3;
}
function arrangeSelection(mode){
  const objects=scene.objects.filter(obj=>selected.has(obj.id)&&!obj.locked);
  if(objects.length<2)return;
  if(mode.startsWith("distribute")&&objects.length<3)return;
  mutate(()=>{
    if(mode==="alignLeft"){
      const x=Math.min(...objects.map(obj=>obj.x));
      for(const obj of objects)obj.x=x;
    }else if(mode==="alignCenter"){
      const left=Math.min(...objects.map(obj=>obj.x));
      const right=Math.max(...objects.map(obj=>obj.x+obj.w));
      const centre=(left+right)/2;
      for(const obj of objects)obj.x=Math.round(centre-obj.w/2);
    }else if(mode==="alignTop"){
      const y=Math.min(...objects.map(obj=>obj.y));
      for(const obj of objects)obj.y=y;
    }else{
      const horizontal=mode==="distributeH";
      const ordered=[...objects].sort((a,b)=>
        horizontal?a.x-b.x:a.y-b.y);
      const first=ordered[0],last=ordered.at(-1);
      const end=horizontal?last.x+last.w:last.y+last.h;
      const start=horizontal?first.x:first.y;
      const total=ordered.reduce((sum,obj)=>sum+(horizontal?obj.w:obj.h),0);
      const gap=(end-start-total)/(ordered.length-1);
      let cursor=start;
      for(const obj of ordered){
        if(horizontal){obj.x=Math.round(cursor);cursor+=obj.w+gap;}
        else{obj.y=Math.round(cursor);cursor+=obj.h+gap;}
      }
    }
  });
}
function refreshLiveBoxes(){
  for(const obj of scene.objects){
    const node=$("stage").querySelector('[data-id="'+obj.id+'"]');
    if(node)applyBox(node,obj);
  }
  const obj=lookup(activeId);
  if(obj)for(const key of ["x","y","w","h"])$(propertyIds[key]).value=Math.round(obj[key]);
}
// Free-canvas smart guides. Use scene coordinates, independent of browser zoom.
// Guides are editor-only DOM elements and never enter saved scenes or exports.
function canvasGuideCandidates(ids){
  const exclude=new Set(ids);
  const x=[0,scene.width/2,scene.width],y=[0];
  for(const obj of scene.objects){
    if(exclude.has(obj.id)||obj.hidden||obj.backdrop)continue;
    x.push(obj.x,obj.x+obj.w/2,obj.x+obj.w);
    y.push(obj.y,obj.y+obj.h/2,obj.y+obj.h);
  }
  return {x,y};
}
function canvasGroupBounds(baselines){
  const x=Math.min(...baselines.map(obj=>obj.x));
  const y=Math.min(...baselines.map(obj=>obj.y));
  return {x,y,w:Math.max(...baselines.map(obj=>obj.x+obj.w))-x,
    h:Math.max(...baselines.map(obj=>obj.y+obj.h))-y};
}
function snapCanvasMove(dx,dy,g,disabled,lockAxis=null){
  if(disabled)return {dx,dy,x:null,y:null};
  const tolerance=Math.min(16,7/Math.max(.25,zoom));
  const {x,y,w,h}=g.groupBounds;
  function closest(lines,edges){
    let best=null;
    for(const line of lines)for(const edge of edges){
      const diff=line-edge;
      if(Math.abs(diff)<=tolerance&&
         (!best||Math.abs(diff)<Math.abs(best.diff)))
        best={diff,line};
    }
    return best;
  }
  const matchX=lockAxis==="y"?null:
    closest(g.snapLines.x,[x+dx,x+dx+w/2,x+dx+w]);
  const matchY=lockAxis==="x"?null:
    closest(g.snapLines.y,[y+dy,y+dy+h/2,y+dy+h]);
  return {dx:dx+Math.round(matchX?.diff||0),
    dy:dy+Math.round(matchY?.diff||0),
    x:matchX?.line??null,y:matchY?.line??null};
}
function clearCanvasGuides(){
  $("stage")?.querySelectorAll("[data-v2-guide]").forEach(node=>node.remove());
}
function drawCanvasGuides(x,y){
  const stage=$("stage");
  clearCanvasGuides();
  for(const [axis,position] of [["x",x],["y",y]]){
    if(position===null)continue;
    const line=document.createElement("div");
    line.className="canvas-snap-guide";
    line.dataset.v2Guide=axis;
    line.setAttribute("aria-hidden","true");
    const thickness=1/Math.max(.25,zoom);
    if(axis==="x"){
      line.style.left=position+"px";line.style.top="0";
      line.style.width=thickness+"px";line.style.height="100%";
    }else{
      line.style.left="0";line.style.top=position+"px";
      line.style.width="100%";line.style.height=thickness+"px";
    }
    stage.append(line);
  }
}
// Rubber-band selection, built in scene coordinates so zoom never affects hits.
// Left-to-right encloses objects, right-to-left also selects intersections.
function marqueePoint(event){
  const rect=$("stage").getBoundingClientRect();
  return {x:clamp((event.clientX-rect.left)/zoom,0,scene.width),
    y:clamp((event.clientY-rect.top)/zoom,0,scene.height)};
}
function marqueeBounds(a,b){
  return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),
    w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};
}
function clearCanvasMarquee(){
  $("stage")?.querySelector("[data-v2-marquee]")?.remove();
}
function cancelCanvasMarquee(){
  const pending=canvasMarquee;
  if(!pending)return;
  canvasMarquee=null;
  try{
    const stage=$("stage");
    if(stage.hasPointerCapture?.(pending.pointer))
      stage.releasePointerCapture(pending.pointer);
  }catch{/* The capture may have been lost when leaving the application. */}
  clearCanvasMarquee();
  $("stage")?.querySelectorAll(".marquee-preview").forEach(node=>
    node.classList.remove("marquee-preview"));
}
function startCanvasMarquee(event){
  if(workspaceMode!=="design"||editingId!==null||gesture||
     canvasMarquee||event.button!==0)return;
  const start=marqueePoint(event);
  canvasMarquee={pointer:event.pointerId,start,current:start,
    additive:event.shiftKey,previous:new Set(selected),moved:false};
  lastTap=null;
  event.preventDefault();
  // A previous inspector input may still own keyboard focus. Pointing at
  // the canvas must restore its arrow-key and Escape shortcuts.
  $("stage").focus({preventScroll:true});
  $("stage").setPointerCapture(event.pointerId);
}
function moveCanvasMarquee(event){
  const g=canvasMarquee;
  if(!g||event.pointerId!==g.pointer)return;
  const current=marqueePoint(event);
  g.current=current;
  if(!g.moved&&Math.hypot((current.x-g.start.x)*zoom,
     (current.y-g.start.y)*zoom)<4)return;
  g.moved=true;
  const rect=marqueeBounds(g.start,current);
  let node=$("stage").querySelector("[data-v2-marquee]");
  if(!node){
    node=document.createElement("div");
    node.className="canvas-marquee";
    node.dataset.v2Marquee="";
    node.setAttribute("aria-hidden","true");
    $("stage").append(node);
  }
  node.style.left=rect.x+"px";node.style.top=rect.y+"px";
  node.style.width=rect.w+"px";node.style.height=rect.h+"px";
  node.classList.toggle("intersect",current.x<g.start.x);
  const hits=canvasMarqueeHits(g.start,current);
  for(const item of $("stage").querySelectorAll(".scene-object")){
    const id=Number(item.dataset.id);
    item.classList.toggle("marquee-preview",hits.has(id)||g.additive&&g.previous.has(id));
  }
}
function canvasMarqueeHits(start,end){
  const box=marqueeBounds(start,end),crossing=end.x<start.x;
  const result=new Set();
  for(const obj of scene.objects){
    if(obj.hidden||obj.locked)continue;
    const hit=crossing?
      obj.x<box.x+box.w&&obj.x+obj.w>box.x&&
      obj.y<box.y+box.h&&obj.y+obj.h>box.y:
      obj.x>=box.x&&obj.y>=box.y&&
      obj.x+obj.w<=box.x+box.w&&obj.y+obj.h<=box.y+box.h;
    if(hit)result.add(obj.id);
  }
  return result;
}
function finishCanvasMarquee(event){
  const g=canvasMarquee;
  if(!g||event.pointerId!==g.pointer)return;
  if(event.type==="pointercancel"){cancelCanvasMarquee();return;}
  const ids=g.moved?canvasMarqueeHits(g.start,marqueePoint(event)):new Set();
  if(g.additive)for(const id of g.previous)ids.add(id);
  canvasMarquee=null;
  clearCanvasMarquee();
  setSelection([...ids],[...ids].at(-1)||null);
  if(g.moved)status(ids.size+" canvas objects selected · Drag a selected object to move together");
}
function startGesture(event,id,dir){
  const obj=lookup(id);
  if(!obj||obj.locked||editingId!==null)return;
  event.preventDefault();event.stopPropagation();
  // Return keyboard shortcuts to the canvas even after editing inspector fields.
  $("stage").focus({preventScroll:true});
  const wasSelected=selected.has(id);
  if(event.shiftKey&&!dir){
    select(id,true);
    return;
  }
  if(!wasSelected)select(id);
  if(dir&&selected.size>1){setSelection([id],id);}
  const ids=dir?[id]:[...selected];
  const baselines=ids.map(key=>({id:key,...copy(lookup(key))}));
  gesture={pointer:event.pointerId,clickedId:id,dir:dir||"move",x:event.clientX,y:event.clientY,
    ids,baselines,snapshot:copy(scene),moved:false,aspect:obj.w/obj.h,kind:obj.type,
    groupBounds:canvasGroupBounds(baselines),snapLines:canvasGuideCandidates(ids)};
  $("stage").setPointerCapture(event.pointerId);
}
function gestureMove(event){
  if(!gesture||event.pointerId!==gesture.pointer)return;
  event.preventDefault();
  const g=gesture;
  let dx=Math.round((event.clientX-g.x)/zoom);
  let dy=Math.round((event.clientY-g.y)/zoom);
  if(Math.abs(dx)<2&&Math.abs(dy)<2&&!g.moved)return;
  g.moved=true;
  if(g.dir==="move"){
    let axis=null;
    if(event.shiftKey){
      if(Math.abs(dx)>=Math.abs(dy)){dy=0;axis="x";}
      else{dx=0;axis="y";}
    }
    const snap=snapCanvasMove(dx,dy,g,event.altKey,axis);
    dx=snap.dx;dy=snap.dy;
    drawCanvasGuides(snap.x,snap.y);
    for(const base of g.baselines){
      const obj=lookup(base.id);
      if(!obj)continue;
      obj.x=clamp(base.x+dx,-2000,20000);
      obj.y=clamp(base.y+dy,-2000,40000);
    }
  }else{
    const base=g.baselines[0],obj=lookup(base.id),d=g.dir;
    if(!obj)return;
    let w=base.w+(d.includes("e")?dx:0)-(d.includes("w")?dx:0);
    let h=base.h+(d.includes("s")?dy:0)-(d.includes("n")?dy:0);
    w=clamp(w,MIN_W,8000);h=clamp(h,MIN_H,20000);
    if(d.length===2&&(g.kind==="image"&&!event.altKey||event.shiftKey)){
      // Diagonal image resize keeps the original proportions. Alt allows
      // independent width and height. Text is proportional while Shift held.
      if(Math.abs(w-base.w)>=Math.abs(h-base.h)*g.aspect)
        h=clamp(Math.round(w/g.aspect),MIN_H,20000);
      else w=clamp(Math.round(h*g.aspect),MIN_W,8000);
    }
    obj.w=w;obj.h=h;
    obj.x=d.includes("w")?base.x+base.w-w:base.x;
    obj.y=d.includes("n")?base.y+base.h-h:base.y;
    // Width changes from both side and corner grips reflow text naturally.
    // Pure north/south grips still allow intentional height adjustments.
    if(g.kind==="text"&&(d==="e"||d==="w"||d.length===2)){
      const needed=measuredTextHeight(obj);
      if(needed>obj.h){
        obj.h=needed;
        if(d.includes("n"))obj.y=base.y+base.h-obj.h;
      }
    }
  }
  refreshLiveBoxes();
}
// Return the free-design canvas to its saved state when pointer capture
// or browser focus is unexpectedly lost during a drag/resize.
function cancelCanvasGesture(){
  const pending=gesture;
  if(!pending)return;
  gesture=null;lastTap=null;
  clearCanvasGuides();
  scene=pending.snapshot;
  try{
    const stage=$("stage");
    if(stage.hasPointerCapture?.(pending.pointer))
      stage.releasePointerCapture(pending.pointer);
  }catch{/* Pointer capture may already be gone. */}
  render();
  status("Interrupted canvas gesture cancelled · Previous layout restored");
}
function endGesture(event){
  if(!gesture||event.pointerId!==gesture.pointer)return;
  const g=gesture;gesture=null;
  clearCanvasGuides();
  if(event.type==="pointercancel"){lastTap=null;scene=g.snapshot;render();return;}
  if(g.moved&&JSON.stringify(g.snapshot)!==JSON.stringify(scene)){
    const bottom=Math.max(...scene.objects.map(o=>o.y+o.h+70),900);
    if(bottom>scene.height)scene.height=Math.ceil(bottom);
    // A committed gesture is a single undoable operation; persist it before
    // a possible immediate reload, navigation or accidental tab closure.
    remember(g.snapshot);
  }
  render();
  if(g.moved||g.dir!=="move"){lastTap=null;return;}
  const current={id:g.clickedId,x:event.clientX,y:event.clientY,time:performance.now()};
  if(lastTap&&lastTap.id===current.id&&current.time-lastTap.time<440&&
     Math.hypot(current.x-lastTap.x,current.y-lastTap.y)<10){
    lastTap=null;
    beginTextEdit(current.id);
  }else lastTap=current;
}
function beginTextEdit(id){
  const obj=lookup(id);
  if(!obj||obj.type!=="text"||obj.locked||obj.hidden)return;
  select(id);editingId=id;
  const node=$("stage").querySelector('[data-id="'+id+'"]');
  node.querySelectorAll(".handle").forEach(h=>h.remove());
  const content=node.querySelector(".scene-content");
  if(!content)return;
  content.contentEditable="true";
  content.focus();const range=document.createRange();range.selectNodeContents(content);
  const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);selection.collapseToEnd();
}
function measuredTextHeight(obj){
  const measure=document.createElement("div");
  measure.style.cssText="position:fixed;visibility:hidden;pointer-events:none;"+
    "width:"+Math.max(MIN_W,obj.w)+"px;box-sizing:border-box;"+
    "white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45;"+
    "font-family:"+obj.family+";font-size:"+obj.font+"px";
  if(obj.rich)measure.innerHTML=cleanRich(obj.rich);
  else measure.textContent=obj.text;
  document.body.append(measure);
  const height=Math.ceil(measure.getBoundingClientRect().height+6);
  measure.remove();
  return clamp(height,MIN_H,20000);
}
function finishTextEdit(){
  if(editingId===null)return;
  const id=editingId;editingId=null;
  const node=$("stage").querySelector('[data-id="'+id+'"]');
  if(!node)return;
  const content=node.querySelector(".scene-content");
  const text=(content?.innerText||content?.textContent||"").slice(0,30000);
  const rich=cleanRich(content?.innerHTML||"");
  mutate(()=>{
    const obj=lookup(id);
    if(!obj)return;
    obj.text=text;obj.rich=rich;
    obj.h=Math.max(obj.h,measuredTextHeight(obj));
    scene.height=Math.max(scene.height,obj.y+obj.h+70);
  });
  if(content)content.contentEditable="false";
  render();
}
function hexColour(value,fallback){
  const result=String(value||"").match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if(!result)return fallback;
  return "#"+result.slice(1,4).map(v=>clamp(Number(v),0,255).toString(16).padStart(2,"0")).join("");
}
async function importPage(force=false){
  const page=currentPage;
  if(!PAGES.has(page))return;
  if(scene.objects.length&&!force&&!confirm("Importing again replaces this page's local canvas draft. Export JSON first if you wish to keep it. Continue?"))return;
  const serial=++loadSerial;
  status("Measuring a separate copy of "+page+"…");
  const frame=$("importFrame");
  try{
    const ready=new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error("Page took too long to load")),16000);
      frame.onload=()=>{clearTimeout(timeout);resolve();};
      frame.onerror=()=>{clearTimeout(timeout);reject(Error("Page could not be loaded"));};
    });
    frame.src=new URL(page,location.href).href;
    await ready;
    if(serial!==loadSerial||page!==currentPage)return;
    const doc=frame.contentDocument;
    if(!doc?.querySelector("main"))throw Error("Page has no main element");
    await Promise.race([doc.fonts?.ready||Promise.resolve(),
      new Promise(resolve=>setTimeout(resolve,1800))]);
    await Promise.all([...doc.querySelectorAll("main img")].slice(0,100).map(img=>{
      if(img.complete)return Promise.resolve();
      return Promise.race([new Promise(resolve=>{
        img.addEventListener("load",resolve,{once:true});
        img.addEventListener("error",resolve,{once:true});
      }),new Promise(resolve=>setTimeout(resolve,1500))]);
    }));
    if(serial!==loadSerial)return;
    const main=doc.querySelector("main"),base=main.getBoundingClientRect();
    const images=new Map();
    for(const image of main.querySelectorAll("img[src]")){
      const src=image.getAttribute("src")||"";
      if(!safeImageSource(src)||images.has(src))continue;
      images.set(src,{src,alt:image.alt||"",w:image.naturalWidth||260,
        h:image.naturalHeight||190});
      if(images.size>=75)break;
    }
    const next={version:VERSION,page,width:STANDARD_WIDTH,height:Math.max(980,Math.ceil(main.scrollHeight+90)),
      objects:[],nextId:1};
    // Import coloured cards and section panels as editable background
    // shapes first. Their lower z-index keeps their text and images accessible.
    const backgrounds=[...main.querySelectorAll("section,article,aside,figure,div")];
    for(const node of backgrounds){
      if(next.objects.length>=Math.min(110,Math.floor(MAX_OBJECTS/3)))break;
      if(node.closest(".moon-free-placeholder,[data-moon-free-placeholder]"))continue;
      const css=doc.defaultView.getComputedStyle(node);
      const colour=css.backgroundColor;
      const match=/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/.exec(colour);
      if(!match||match[5]!==undefined&&Number(match[5])<.7)continue;
      const [red,green,blue]=match.slice(1,4).map(Number);
      if(red>245&&green>245&&blue>245)continue;
      const rect=node.getBoundingClientRect();
      if(rect.width<80||rect.height<35||!Number.isFinite(rect.width)||!Number.isFinite(rect.height)||
        css.display==="none"||css.visibility==="hidden")continue;
      const label=(node.className&&typeof node.className==="string"?
        node.className.split(/\s+/).slice(0,2).join(" "):node.tagName.toLowerCase());
      next.objects.push({
        id:next.nextId++,type:"shape",name:("Background · "+label).slice(0,120),
        x:Math.round(rect.left-base.left),y:Math.round(rect.top-base.top),
        w:Math.max(MIN_W,Math.round(rect.width)),h:Math.max(MIN_H,Math.round(rect.height)),
        z:next.nextId,order:next.objects.length,
        backdrop:true,text:"",src:"",alt:"",font:20,family:"Georgia, serif",
        color:"#1c2622",bg:hexColour(colour,"#ffffff"),transparent:false,
        align:"left",locked:false,hidden:false
      });
    }
    const candidates=[...main.querySelectorAll("h1,h2,h3,h4,h5,h6,p,blockquote,figcaption,li,img")];
    for(const node of candidates){
      if(next.objects.length>=MAX_OBJECTS)break;
      if(node.closest(".moon-free-placeholder,[data-moon-free-placeholder]"))continue;
      if(node.matches("p")&&node.querySelector("img")&&!node.textContent.trim())continue;
      if(node.matches("li")&&node.querySelector("p,h2,h3,h4"))continue;
      if(node.matches("blockquote")&&node.querySelector("p"))continue;
      const image=node.tagName==="IMG";
      const text=image?"":node.textContent.trim();
      if(!image&&!text)continue;
      const rect=node.getBoundingClientRect(),css=doc.defaultView.getComputedStyle(node);
      if(!rect.width||rect.width<8||!rect.height||rect.height<8||css.display==="none"||css.visibility==="hidden")continue;
      const src=image?node.getAttribute("src")||"":"";
      if(image&&!safeImageSource(src))continue;
      const obj={id:next.nextId++,type:image?"image":"text",name:image?
        (node.alt||"Image").slice(0,95):(node.tagName.toLowerCase()+" · "+text.replace(/\s+/g," ").slice(0,65)),
        x:Math.round(rect.left-base.left),y:Math.round(rect.top-base.top),
        w:Math.round(rect.width),h:Math.round(rect.height),z:next.nextId,
        text:text.slice(0,30000),rich:image?"":cleanRich(node.innerHTML),
        tag:image?"p":node.tagName.toLowerCase(),order:next.objects.length,
        src,alt:image?node.alt||"":"",
        font:clamp(Math.round(parseFloat(css.fontSize)||18),10,120),
        family:css.fontFamily||"Georgia,serif",color:hexColour(css.color,"#1c2622"),
        bg:"#ffffff",transparent:true,align:["left","center","right"].includes(css.textAlign)?css.textAlign:"left",
        locked:false,hidden:false};
      if(obj.w<MIN_W)obj.w=MIN_W;if(obj.h<MIN_H)obj.h=MIN_H;
      next.objects.push(obj);
      next.height=Math.max(next.height,obj.y+obj.h+90);
    }
    if(!next.objects.length)throw Error("No editable text or images were found");
    const before=copy(scene);
    scene=validateScene(next,page);selected.clear();activeId=null;
    history.push(before);if(history.length>60)history.shift();redo.length=0;
    pageImages=[...images.values()];
    renderImageLibrary();
    setWorkspaceMode("design");render();fitCanvas();save();
    status("Imported "+scene.objects.length+" independent objects · Original website unchanged");
  }catch(error){status("Import stopped · "+(error.message||error));}
}
function changePage(page){
  if(!PAGES.has(page))return;
  if(liveEditing)saveLiveText();
  ++loadSerial;clearTimeout(saveTimer);lastTap=null;pageImages=[];
  renderImageLibrary();
  currentPage=page;
  loadLiveDraft(page);
  history=[];redo=[];selected.clear();activeId=null;
  const empty={version:VERSION,page,width:STANDARD_WIDTH,height:1080,objects:[],nextId:1};
  try{
    const raw=localStorage.getItem(NEW_DRAFT+page);
    scene=raw?validateScene(JSON.parse(raw),page):empty;
    status(raw?"Saved canvas restored · Original website unchanged":"New canvas · Use Import page layout");
  }catch{scene=empty;status("Saved canvas invalid · Original website unchanged");}
  render();
  loadPageImageLibrary(page,loadSerial);
  loadLivePage(page);
  setWorkspaceMode("live");
}
function esc(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function standaloneHtml(assetPrefix=""){
  const name=$("page").selectedOptions[0]?.textContent||"Website";
  // The visual stack can change without scrambling headings and hyperlinks
  // for keyboard and screen-reader users.
  const sorted=[...scene.objects].filter(o=>!o.hidden)
    .sort((a,b)=>(a.order??a.id)-(b.order??b.id)||a.id-b.id);
  const items=sorted.map(o=>{
    const base='class="item'+(o.backdrop?' backdrop':'')+
      (o.shapeKind==="line"?' line-shape':'')+'" style="left:'+o.x+'px;top:'+o.y+'px;width:'+o.w+
      'px;height:'+o.h+'px;z-index:'+o.z+';'+
      (o.transparent?'background:transparent;':'background:'+o.bg+';');
    if(o.type==="image"){
      const source=safeImageSource(o.src)?o.src:"";
      const path=source.startsWith("assets/")?assetPrefix+source:source;
      return '<figure '+base+'"><img src="'+esc(path)+
        '" alt="'+esc(o.alt)+'" loading="lazy"></figure>';
    }
    if(o.type==="shape")return '<div aria-hidden="true" '+base+
      (o.shapeKind==="line"?'background:transparent;border:0;--shape-line-colour:'+o.bg+';':
        o.shapeKind==="ellipse"?'border-radius:50%;border:1px solid #81968c;':
        o.backdrop?'border:0;':'border:1px solid #81968c;')+'"></div>';
    const tag=exportedTag(o.tag);
    const rich=o.rich?cleanRich(o.rich,assetPrefix):esc(o.text);
    return '<'+tag+' '+base+'font-family:'+esc(o.family)+';font-size:'+o.font+
      'px;color:'+esc(o.color)+';text-align:'+esc(o.align)+'">'+rich+'</'+tag+'>';
  }).join("\n");
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="noindex,nofollow">'+
    '<title>'+esc(name)+' | Canvas preview</title><style>'+
    '*{box-sizing:border-box}body{margin:0;font-family:Georgia,serif;color:#17231e;background:#fff}'+
    '.site-bar{max-width:1160px;margin:auto;padding:18px 20px;border-bottom:1px solid #ddd;display:flex;gap:25px;align-items:center}'+
    '.site-bar nav{display:flex;gap:12px;flex-wrap:wrap}.site-bar a{color:#246b54}'+
    '.canvas{position:relative;width:'+scene.width+'px;height:'+scene.height+'px;margin:0 auto;max-width:100%;overflow:visible}'+
    '.item{position:absolute;box-sizing:border-box;white-space:pre-wrap;overflow-wrap:anywhere;margin:0;overflow:hidden;line-height:1.45}'+
    '.item img{height:100%;width:100%;object-fit:contain;display:block}'+
    '.item.line-shape::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;background:var(--shape-line-colour,#81968c)}'+
    '@media(max-width:700px){.canvas{height:auto;width:100%;display:flex;flex-direction:column;gap:16px;padding:24px 18px}'+
    '.item{position:static!important;width:100%!important;height:auto!important;max-width:100%!important;min-height:24px}'+
    '.item img{width:100%;height:auto;max-height:500px;object-fit:contain}.item.backdrop{display:none!important}}'+
    '</style></head><body><header class="site-bar"><strong>Ye Eun Moon</strong>'+
    '<nav><a href="'+assetPrefix+'index.html">Home</a><a href="'+assetPrefix+'research.html">Research</a>'+
    '<a href="'+assetPrefix+'teaching.html">Teaching</a><a href="'+assetPrefix+'contact.html">Contact</a></nav></header>'+
    '<main class="canvas" aria-label="'+esc(name)+'">'+items+'</main></body></html>';
}
function download(name,contents,type){
  const blob=new Blob([contents],{type}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function utf8Base64(value){
  const data=new TextEncoder().encode(value);let result="";
  for(let i=0;i<data.length;i+=32768)
    result+=String.fromCharCode(...data.subarray(i,i+32768));
  return btoa(result);
}
// GitHub's Contents API is used directly from this static GitHub Pages editor.
// Authentication is supplied by the user and never stored in localStorage.
function githubHeaders(token){
  return {Accept:"application/vnd.github+json",Authorization:"Bearer "+token,
    "X-GitHub-Api-Version":"2022-11-28"};
}
async function githubFile(path,token,allowMissing=false){
  const endpoint="https://api.github.com/repos/"+REPO+"/contents/"+path;
  const response=await fetch(endpoint+"?ref=main",{headers:githubHeaders(token),cache:"no-store"});
  if(allowMissing&&response.status===404)return {endpoint,info:null};
  if(!response.ok){
    if(response.status===401||response.status===403)
      throw Error("GitHub denied access. Check that the token has Contents read/write permission for this repository.");
    throw Error("Could not read the latest GitHub file (HTTP "+response.status+").");
  }
  const info=await response.json();
  if(!info||info.type!=="file"||typeof info.sha!=="string")
    throw Error("GitHub did not return an editable file.");
  return {endpoint,info};
}
function decodeGithubHtml(info){
  if(info.encoding!=="base64"||typeof info.content!=="string"||!info.content.trim())
    throw Error("GitHub did not supply the current file contents. Publication stopped.");
  const bytes=Uint8Array.from(atob(info.content.replace(/\s/g,"")),char=>char.charCodeAt(0));
  return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
}
function applyLiveEditsToGithubHtml(html){
  if(!/<main\b/i.test(html))throw Error("The GitHub page has no main section. No changes were published.");
  const doc=new DOMParser().parseFromString(html,"text/html");
  const resolved=[],normalized=[];
  if(applyPatchesToDocument(doc,true,resolved,normalized)!==livePatches.size)
    throw Error("Some edits did not match the latest GitHub page. Nothing was published.");
  // Keep source HTML and CSS intact and return one merged patch per element.
  const output="<!doctype html>\n"+doc.documentElement.outerHTML;
  const size=new TextEncoder().encode(output).length;
  if(size>MAX_GITHUB_PAGE_BYTES)
    throw Error("The edited page would exceed the safe GitHub HTML size ("+
      Math.round(size/1024)+" KB). Nothing was published. Use image paths in assets/ or remove large embedded images.");
  return {html:output,resolved,normalized};
}
async function publishGithub(token,target){
  if(!token)throw Error("Enter your GitHub token to publish.");
  if(!["live","staging"].includes(target))throw Error("Choose a valid publishing destination.");
  const sourceMode=workspaceMode==="live";
  if(target==="live"&&!sourceMode)
    throw Error("Only original-layout edits can be published to the live website.");
  if(sourceMode&&!livePatches.size)
    throw Error("Make and save at least one original-layout edit before publishing.");
  if(!sourceMode&&!scene.objects.length)
    throw Error("Import or add objects before publishing a staging preview.");
  if(!PAGES.has(currentPage))throw Error("Unknown page; publication cancelled.");
  const publicationPage=currentPage,publicationMode=workspaceMode;
  const draftSignature=JSON.stringify(sourceMode?liveSnapshot():scene);
  const requireUnchangedDraft=()=>{
    const state=JSON.stringify(sourceMode?liveSnapshot():scene);
    if(currentPage!==publicationPage||workspaceMode!==publicationMode||
       state!==draftSignature)
      throw Error("The selected page or saved edits changed during publishing. Nothing was submitted. Return to the intended page and try again.");
  };
  const path=target==="live"?publicationPage:
    "editor-v2-previews/"+(sourceMode?"source-":"")+publicationPage;
  const {endpoint,info}=await githubFile(path,token,target==="staging");
  requireUnchangedDraft();
  if(target==="live"&&!info)
    throw Error("The public page is missing from GitHub. Publication cancelled.");

  // Exactly the source HTML shown in the editable iframe must still be on
  // GitHub when publishing. Matching text on a changed page is insufficient
  // evidence that the overall visual result will be identical.
  const currentSource=target==="live"?decodeGithubHtml(info):null;
  if(target==="live"&&(liveSourceProvenance!=="github"||
      liveDisplayedSourceHtml!==currentSource))
    throw Error("The GitHub page changed since your editing view was loaded, or the editor is showing an unverified fallback. No publication was submitted. Your draft is preserved. Reload the live page and review the edits before publishing.");

  // The exact same source assembler builds verified previews and the live
  // update; the GitHub Contents API SHA guards the write from later changes.
  const production=target==="live"?
    applyLiveEditsToGithubHtml(currentSource):null;
  const html=production?.html||
    (sourceMode?await sourcePreservingHtml("https://gmoon-code.github.io/"):
      standaloneHtml("../"));
  requireUnchangedDraft(); // Keep the output and target page paired up.
  const body={
    message:(target==="live"?"Publish verified Editor V2 edits to ":"Update Editor V2 staging preview of ")+publicationPage,
    content:utf8Base64(html),branch:"main"
  };
  if(info?.sha)body.sha=info.sha;
  const response=await fetch(endpoint,{
    method:"PUT",headers:{...githubHeaders(token),"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  if(!response.ok){
    if(response.status===409||response.status===422)
      throw Error("The file changed on GitHub during publication. No changes were published. Review the page and retry.");
    if(response.status===401||response.status===403)
      throw Error("GitHub refused the update. Check your token's repository permissions.");
    throw Error("GitHub did not accept this publication (HTTP "+response.status+").");
  }
  const result=await response.json();
  if(!result?.commit?.sha)throw Error("GitHub did not confirm a commit.");
  return {url:"https://gmoon-code.github.io/"+path,
    commit:result.commit.sha,target,path,page:publicationPage,draftSignature,
    publishedHtml:production?.html||null,
    publishedMatches:production?.resolved||[],
    publishedNormalized:production?.normalized||[]};
}
function renderPublishPatchList(){
  const list=$("publishPatchList");
  list.replaceChildren();
  if(workspaceMode!=="live"){
    list.hidden=true;return;
  }
  list.hidden=false;
  const heading=document.createElement("strong");
  heading.textContent="Saved edits to this webpage ("+livePatches.size+")";
  list.append(heading);
  if(!livePatches.size){
    const empty=document.createElement("p");
    empty.textContent="No live-page edits remain. Return to the webpage to make another edit.";
    list.append(empty);return;
  }
  for(const patch of livePatches.values()){
    const row=document.createElement("div");
    row.className="publish-patch";
    const label=document.createElement("span");
    label.textContent=(patch.kind==="text"?"Text":patch.kind==="image"?"Image":
      patch.kind==="insert"?"New "+patch.objectType:
      patch.kind==="remove-added"?"Remove added object":
      patch.kind==="delete"?"Delete element":"Position/style")+
      " · "+(patch.kind==="insert"?(patch.html||patch.alt||"Shape").slice(0,65):
        livePatchExcerpt(patch));
    label.title=patch.selector;
    const remove=document.createElement("button");
    remove.type="button";remove.className="subtle";
    remove.textContent="Remove edit";
    remove.setAttribute("aria-label","Remove saved edit "+livePatchExcerpt(patch));
    remove.dataset.patchSelector=patch.selector;
    row.append(label,remove);list.append(row);
  }
}
function listReconnectEdits(){
  const panel=$("imageReconnectPanel"),selector=$("reconnectSavedImage");
  const before=selector.value;
  const saved=[...livePatches.values()].filter(p=>p.kind==="image");
  panel.hidden=workspaceMode!=="live"||!saved.length;
  selector.replaceChildren();
  for(const patch of saved){
    const option=document.createElement("option");
    option.value=patch.selector;
    option.textContent=(patch.expected||"Image")+" → "+(patch.src||"")+" · "+patch.selector;
    selector.append(option);
  }
  if(saved.some(p=>p.selector===before))selector.value=before;
  updateReconnectPreview();
}
function updateReconnectPreview(){
  const selection=$("reconnectSourceImage").value;
  const entry=reconnectImages.find(item=>item.selector===selection);
  const image=$("reconnectImagePreview"),message=$("reconnectSourceInfo");
  image.hidden=!entry;
  image.removeAttribute("src");
  if(entry){
    image.src=entry.url;
    message.textContent="Original source "+entry.src+" · "+(entry.alt||"No description")+
      ". Only reconnect if this is the intended image.";
  }else message.textContent=reconnectImages.length?
    "Select the corresponding source image before reconnecting.":
    "No eligible original images loaded for this page.";
  $("reconnectImageButton").disabled=!entry;
}
async function loadReconnectImages(){
  const page=currentPage;
  const select=$("reconnectSourceImage");
  reconnectImages=[];reconnectForPage="";
  select.replaceChildren();
  $("reconnectSourceInfo").textContent="Checking images in the original "+page+"…";
  try{
    const url=new URL(page,location.href);
    const response=await fetch(url,{cache:"no-store",credentials:"same-origin"});
    if(!response.ok)throw Error("Could not fetch original page (HTTP "+response.status+")");
    const doc=new DOMParser().parseFromString(await response.text(),"text/html");
    if(page!==currentPage)return;
    for(const node of doc.querySelectorAll("main img[src]")){
      const src=node.getAttribute("src")||"",selector=liveSelector(node);
      let absolute;
      try{absolute=new URL(src,url);}catch{continue;}
      // Never offer a remote image or javascript URL as a reconnection target.
      if(absolute.origin!==url.origin||!["http:","https:"].includes(absolute.protocol)||!selector)continue;
      reconnectImages.push({src,selector,alt:node.alt||"",url:absolute.href});
    }
    reconnectForPage=page;
    for(const item of reconnectImages){
      const option=document.createElement("option");
      option.value=item.selector;
      option.textContent=item.src+" · "+(item.alt||item.selector);
      select.append(option);
    }
    const patch=livePatches.get($("reconnectSavedImage").value);
    const exact=reconnectImages.find(x=>patch&&equivalentSiteImageSource(x.src,patch.expected));
    if(exact)select.value=exact.selector;
    updateReconnectPreview();
    if(!reconnectImages.length)
      $("reconnectSourceInfo").textContent="No local images found in "+page+
        ". The saved edit may belong to another page.";
  }catch(error){
    $("reconnectSourceInfo").textContent="Could not inspect this source page. "+
      (error.message||error);
    updateReconnectPreview();
  }
}
function reconnectSavedImage(){
  const former=$("reconnectSavedImage").value;
  const patch=livePatches.get(former),destination=$("reconnectSourceImage").value;
  const image=reconnectImages.find(item=>item.selector===destination);
  if(!patch||patch.kind!=="image"||!image||reconnectForPage!==currentPage){
    status("Reconnect cancelled · Source images need to be loaded again.");return;
  }
  if([...livePatches.keys()].some(key=>key!==former&&key===destination)){
    status("That source image already has another saved edit. Nothing changed.");return;
  }
  const allowed=confirm("Reconnect saved image edit to "+image.src+" on "+currentPage+
    "?\n\nThe editor will keep your intended replacement, position and appearance."+
    "\nIt will treat the selected image as the new original for this edit. The website will not be published yet.");
  if(!allowed)return;
  const before=liveSnapshot(),next={...patch,selector:destination,expected:image.src};
  livePatches.delete(former);
  livePatches.set(destination,next);
  if(!recordLiveHistory(before))return;
  renderPublishPatchList();
  $("reconnectSavedImage").value=destination;
  $("publishError").hidden=true;
  loadLivePage();
  status("Image edit reconnected to "+image.src+" · Review and check saved edits again.");
}

function updatePublishTarget(){
  const target=$("publishTarget").value,live=target==="live";
  $("publishTitle").textContent=live?"Publish changes to the live website":"Publish staging preview";
  $("publishDescription").textContent=live?
    "This updates the actual public webpage after checking the latest GitHub source. The independent design canvas is not published.":
    "This creates a preview at a separate public URL without replacing the existing webpage.";
  $("stagePath").textContent=live?currentPage:
    "editor-v2-previews/"+(workspaceMode==="live"?"source-":"")+currentPage;
  $("acknowledgeLive").closest("label").hidden=!live;
  $("acknowledgeLive").required=live;
  $("confirmPublish").textContent=live?"Publish live page":"Publish staging preview";
  $("confirmPublish").disabled=live&&!livePatches.size;
  $("checkPublishEdits").hidden=workspaceMode!=="live";
  renderPublishPatchList();
  listReconnectEdits();
  $("publishError").hidden=true;
}
function showPublishResult(result){
  const panel=$("publishResult");
  panel.replaceChildren();
  const intro=document.createElement("span");
  intro.textContent=result.target==="live"?
    "GitHub confirmed the live-page update. GitHub Pages may take a little time to deploy. ":
    "GitHub confirmed the staging preview. GitHub Pages may take a little time to deploy. ";
  const link=document.createElement("a");
  link.href=result.url;link.target="_blank";link.rel="noopener noreferrer";
  link.textContent="Open published page";
  const commit=document.createElement("a");
  commit.href="https://github.com/"+REPO+"/commit/"+result.commit;
  commit.target="_blank";commit.rel="noopener noreferrer";
  commit.textContent="View GitHub commit";
  panel.append(intro,link,document.createTextNode(" · "),commit);
  panel.hidden=false;
}

function attachEvents(){
  $("page").addEventListener("change",event=>changePage(event.target.value));
  $("liveElementSearch").addEventListener("input",renderLiveLayers);
  $("liveSelectParent").addEventListener("click",()=>selectLiveHierarchy("parent"));
  $("liveSelectChild").addEventListener("click",()=>selectLiveHierarchy("child"));
  $("livePrevSibling").addEventListener("click",()=>navigateLiveSibling(-1));
  $("liveNextSibling").addEventListener("click",()=>navigateLiveSibling(1));
  $("liveLocateSelected").addEventListener("click",locateLiveSelected);
  $("liveShowContainers").addEventListener("change",renderLiveLayers);
  $("liveElementList").addEventListener("pointerover",event=>{
    previewLiveLayer(event.target.closest?.("button[data-live-selector]"));
  });
  $("liveElementList").addEventListener("pointerleave",clearLiveLayerPreview);
  $("liveElementList").addEventListener("focusin",event=>{
    previewLiveLayer(event.target.closest?.("button[data-live-selector]"));
  });
  $("liveElementList").addEventListener("focusout",event=>{
    if(!$("liveElementList").contains(event.relatedTarget))clearLiveLayerPreview();
  });
  $("liveElementList").addEventListener("keydown",event=>{
    if(!["ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
    event.preventDefault();
    focusLiveLayer(event.key==="Home"?"first":event.key==="End"?"last":
      event.key==="ArrowDown"?"next":"previous");
  });
  $("liveReleaseClip").addEventListener("change",event=>
    setLiveClippingRelease(event.target.checked));
  $("liveSelectAdded").addEventListener("click",selectAllLiveAdded);
  $("liveClearAdded").addEventListener("click",()=>clearLiveSelection());
  const arrangement={
    liveAlignLeft:"alignLeft",liveAlignCenter:"alignCenter",
    liveAlignRight:"alignRight",liveAlignTop:"alignTop",
    liveAlignMiddle:"alignMiddle",liveAlignBottom:"alignBottom",
    liveDistributeH:"distributeH",liveDistributeV:"distributeV",
    liveMatchWidth:"matchWidth",liveMatchHeight:"matchHeight",
    liveMatchSize:"matchSize"
  };
  for(const [id,mode] of Object.entries(arrangement))
    $(id).addEventListener("click",()=>arrangeSelectedLive(mode));
  for(const [id,edge] of [["livePageLeft","left"],["livePageCenter","center"],
    ["livePageRight","right"]])
    $(id).addEventListener("click",()=>alignLiveSelectionToPage(edge));
  $("liveElementList").addEventListener("click",event=>{
    const button=event.target.closest?.("button[data-live-selector]");
    if(!button||workspaceMode!=="live")return;
    const doc=$("livePageFrame").contentDocument;
    const key=button.dataset.liveSelector;
    const node=LIVE_ADDED_ID.test(key)?findAddedNode(doc,key):
      doc?.querySelector(key);
    if(!node)return;
    selectLiveElement(node,event.shiftKey);
    node.scrollIntoView({block:"center",inline:"nearest"});
    syncLiveOverlay();
  });
  $("liveSectionPickMode").addEventListener("click",toggleLiveSectionPickMode);
  $("liveMode").addEventListener("click",()=>setWorkspaceMode("live"));
  $("designMode").addEventListener("click",()=>setWorkspaceMode("design"));
  $("devicePreview").addEventListener("change",()=>{
    liveManualScale=null;fitLivePage();
    renderLiveInspector();syncLiveOverlay();
  });
  $("focusPage").addEventListener("click",togglePageFocus);
  $("reloadLive").addEventListener("click",()=>loadLivePage(currentPage,{force:true}));
  $("copyLiveObject").addEventListener("click",copySelectedLiveElement);
  $("editLiveText").addEventListener("click",editLiveText);
  $("saveLiveText").addEventListener("click",saveLiveText);
  $("cancelLiveText").addEventListener("click",cancelLiveText);
  $("applyLiveImage").addEventListener("click",applyLiveImage);
  $("liveCopyFormat").addEventListener("click",copyLiveFormat);
  $("livePasteFormat").addEventListener("click",pasteLiveFormat);
  $("liveCropToggle").addEventListener("click",()=>setLiveCropMode(!liveCropMode));
  $("cropImageTool").addEventListener("click",()=>setLiveCropMode(!liveCropMode));
  for(const [side,name] of [["left","Left"],["right","Right"],["top","Top"],["bottom","Bottom"]]){
    $("liveCrop"+name).addEventListener("input",event=>{
      $("liveCrop"+name+"Value").textContent=event.target.value+"%";
    });
    $("liveCrop"+name).addEventListener("change",event=>
      setCropEdge(side,event.target.value));
  }
  $("liveCropFit").addEventListener("change",event=>
    applySelectedImageCrop({fit:event.target.value}));
  $("liveCropShape").addEventListener("change",event=>
    applySelectedImageCrop({mask:event.target.value}));
  for(const [id,field,out] of [
    ["liveCropX","x","liveCropXValue"],["liveCropY","y","liveCropYValue"],
    ["liveCropZoom","zoom","liveCropZoomValue"]]){
    $(id).addEventListener("input",event=>{
      $(out).textContent=event.target.value+"%";
      previewSelectedImageCrop({[field]:Number(event.target.value)});
    });
    $(id).addEventListener("change",event=>{
      if(liveCropSliderBefore)finishCropSliderPreview();
      else applySelectedImageCrop({[field]:Number(event.target.value)});
    });
  }
  $("liveCropReset").addEventListener("click",resetSelectedImageCrop);
  $("livePictureRotation").addEventListener("change",event=>
    setPictureEffect("rotation",Number(event.target.value)));
  $("livePictureOpacity").addEventListener("change",event=>
    setPictureEffect("opacity",Number(event.target.value)));
  for(const [id,step] of [["livePictureTurnLeft",-90],["livePictureTurnRight",90]]){
    $(id).addEventListener("click",()=>{
      const degree=selectedPictureEffects(livePatchForSelected()).rotation;
      let next=degree+step;
      if(next>180)next-=360;
      if(next< -180)next+=360;
      setPictureEffect("rotation",next);
    });
  }
  for(const key of ["flipH","flipV"]){
    $("livePicture"+(key==="flipH"?"FlipH":"FlipV")).addEventListener("click",()=>{
      setPictureEffect(key,!selectedPictureEffects(livePatchForSelected())[key]);
    });
  }
  for(const key of ["brightness","contrast","saturation","blur"]){
    const control=$("livePicture"+key[0].toUpperCase()+key.slice(1));
    control.addEventListener("input",event=>{
      const output=$("livePicture"+key[0].toUpperCase()+key.slice(1)+"Value");
      output.textContent=event.target.value+(key==="blur"?"px":"%");
      setPictureEffect(key,Number(event.target.value),true);
    });
    control.addEventListener("change",event=>{
      if(pictureFxBefore)finishPictureEffectPreview();
      else setPictureEffect(key,Number(event.target.value));
    });
  }
  $("livePictureShadow").addEventListener("change",event=>
    setPictureEffect("shadow",event.target.checked));
  $("livePictureReset").addEventListener("click",resetPictureEffects);
  for(const [id,ratio] of [["liveCropSquare",1],["liveCrop43",4/3],
    ["liveCrop169",16/9],["liveCropPortrait",3/4]])
    $(id).addEventListener("click",()=>cropImageToRatio(ratio));
  for(const [field,key,multiplier] of [
    ["liveMoveX","dx",1],["liveMoveY","dy",1],
    ["liveScaleX","sx",.01],["liveScaleY","sy",.01]
  ])$(field).addEventListener("change",event=>
    applyLiveLayoutInput(key,Number(event.target.value)*multiplier));
  $("resetLiveLayout").addEventListener("click",resetSelectedLiveLayout);
  $("liveBringFront").addEventListener("click",()=>setLiveLayer(true));
  $("liveSendBack").addEventListener("click",()=>setLiveLayer(false));
  $("liveResetStack").addEventListener("click",()=>setLiveLayer(false,true));
  $("liveTogglePositionLock").addEventListener("click",toggleLiveGeometryLock);
  $("liveSelectSection").addEventListener("click",selectLiveContainingSection);
  $("liveSectionHeightMode").addEventListener("change",event=>
    setLiveSectionHeightMode(event.target.value));
  $("liveFitSectionHeight").addEventListener("click",()=>setLiveSectionHeightMode("auto"));
  $("liveTextReflow").addEventListener("change",event=>
    setLiveReflow(event.target.checked));
  const liveDesignFields={
    liveShapeType:"shape",liveShapeFill:"fill",liveImageFit:"imageFit",liveObjectRotation:"rotation",
    liveObjectOpacity:"opacity",liveObjectRadius:"radius",
    liveObjectBorderWidth:"borderWidth",liveObjectBorderColour:"borderColour"
  };
  for(const [id,key] of Object.entries(liveDesignFields))
    $(id).addEventListener("change",event=>setLiveObjectDesign(key,event.target.value));
  $("resetLiveObjectDesign").addEventListener("click",resetLiveObjectDesign);
  $("liveLockImageRatio").addEventListener("change",event=>{
    liveLockImageRatio=event.target.checked;
    status(liveLockImageRatio?"Image frame proportions locked":"Image frame proportions unlocked · Image content still keeps its natural aspect ratio");
  });
  $("liveOriginalWidth").addEventListener("change",event=>
    setOriginalBoxDimension("wrapWidth",event.target.value));
  $("liveOriginalHeight").addEventListener("change",event=>
    setOriginalBoxDimension("reserveHeight",event.target.value));
  $("liveAddedWidth").addEventListener("change",event=>
    setAddedDimension("w",event.target.value));
  $("liveAddedHeight").addEventListener("change",event=>
    setAddedDimension("h",event.target.value));
  $("liveTextBoxWidth").addEventListener("change",event=>
    setLiveReflowDimension("wrapWidth",event.target.value));
  $("liveTextBoxHeight").addEventListener("change",event=>
    setLiveReflowDimension("reserveHeight",event.target.value));
  $("liveResetTextDimensions").addEventListener("click",resetLiveTextDimensions);
  $("liveFitReflowHeight").addEventListener("click",fitLiveTextHeight);
  for(const [field,key] of [
    ["liveFontFamily","family"],["liveFontSize","fontSize"],
    ["liveTextColour","color"],["liveBackgroundColour","backgroundColor"],
    ["liveFontWeight","weight"],["liveFontStyle","style"],
    ["liveTextDecoration","decoration"],["liveTextAlign","align"]
  ])$(field).addEventListener("change",event=>
    setLiveAppearance(key,event.target.value));
  $("resetLiveAppearance").addEventListener("click",resetLiveAppearance);
  $("revertLiveElement").addEventListener("click",revertLiveElement);
  $("deleteLiveElement").addEventListener("click",deleteSelectedLiveElement);
  $("previewLiveEdits").addEventListener("click",()=>$("preview").click());
  $("exportLiveEdits").addEventListener("click",async()=>{
    if(liveEditing)saveLiveText();
    try{
      const html=await sourcePreservingHtml("https://gmoon-code.github.io/");
      download(currentPage.replace(".html","-original-layout-draft.html"),html,"text/html");
    }catch(error){status(error.message||"Could not export original-layout draft");}
  });
  window.addEventListener("resize",()=>{
    if(workspaceMode==="live")fitLivePage();
    fitVerifiedPreviewFrames();
  });
  const workspaceObserver=new ResizeObserver(()=>{if(workspaceMode==="live")fitLivePage();});
  workspaceObserver.observe($("liveViewport"));
  $("importScene").addEventListener("click",()=>$("sceneFile").click());
  $("sceneFile").addEventListener("change",async event=>{
    const file=event.target.files?.[0];event.target.value="";
    const requestedPage=currentPage;
    if(!file)return;
    if(file.size>3000000){status("JSON backup exceeds 3 MB");return;}
    try{
      const restored=validateScene(JSON.parse(await file.text()),requestedPage);
      if(currentPage!==requestedPage){
        status("JSON import cancelled because the website page changed");return;
      }
      if(scene.objects.length&&!confirm("Replace this page's local canvas with the selected JSON backup?"))return;
      const before=copy(scene);
      scene=restored;selected.clear();activeId=null;
      remember(before);render();save();
      status("Canvas restored from JSON · Original website unchanged");
    }catch(error){status("JSON import rejected · "+(error.message||error));}
  });
  $("importPage").addEventListener("click",()=>importPage());
  $("imageLibrary").addEventListener("click",event=>{
    const button=event.target.closest("[data-image-index]");
    if(!button)return;
    const item=pageImages[Number(button.dataset.imageIndex)];
    if(!item)return;
    if(workspaceMode==="live"){
      if(liveSelected?.node?.tagName!=="IMG"){
        addLiveObject("image",{src:item.src,alt:item.alt||""});
        return;
      }
      $("liveImageSrc").value=item.src;
      $("liveImageAlt").value=item.alt||"";
      applyLiveImage();
      return;
    }
    const chosen=lookup(activeId);
    if(chosen?.type==="image"&&!chosen.locked&&selected.size===1){
      mutate(()=>{chosen.src=item.src;chosen.alt=item.alt;chosen.name=(item.alt||"Image").slice(0,120);});
      status("Selected image replaced using website asset · Saved locally");
      return;
    }
    const ratio=item.h>0?item.w/item.h:1.4;
    const width=Math.min(340,Math.max(120,item.w));
    add("image",{src:item.src,alt:item.alt,name:(item.alt||"Website image").slice(0,120),
      w:width,h:Math.round(clamp(width/ratio,80,450))});
  });
  $("sourcePage").addEventListener("click",()=>window.open(new URL(currentPage,location.href).href,"_blank","noopener"));
  $("zoom").addEventListener("input",event=>{
    const value=Number(event.target.value)/100;
    $("zoomValue").textContent=Math.round(value*100)+"%";
    if(workspaceMode==="live"){liveManualScale=value;fitLivePage();}
    else{zoom=value;render();}
  });
  $("fitCanvas").addEventListener("click",()=>{
    if(workspaceMode==="live"){liveManualScale=null;fitLivePage();}
    else fitCanvas();
  });
  $("stage").addEventListener("pointerdown",event=>{
    if(editingId!==null)return;
    const node=event.target.closest(".scene-object");
    if(!node){startCanvasMarquee(event);return;}
    startGesture(event,Number(node.dataset.id),event.target.closest(".handle")?.dataset.dir||null);
  });
  $("stage").addEventListener("click",event=>{
    if(event.target.closest("a"))event.preventDefault();
  });
  $("stage").addEventListener("pointermove",event=>{
    if(canvasMarquee)moveCanvasMarquee(event);
    else gestureMove(event);
  });
  $("stage").addEventListener("pointerup",event=>{
    if(canvasMarquee)finishCanvasMarquee(event);
    else endGesture(event);
  });
  $("stage").addEventListener("pointercancel",event=>{
    if(canvasMarquee)finishCanvasMarquee(event);
    else endGesture(event);
  });
  $("stage").addEventListener("lostpointercapture",event=>{
    if(gesture?.pointer===event.pointerId)cancelCanvasGesture();
    if(canvasMarquee?.pointer===event.pointerId)cancelCanvasMarquee();
  });
  window.addEventListener("blur",()=>{
    cancelCanvasGesture();cancelCanvasMarquee();
  });
  $("selectTool").addEventListener("click",()=>{
    if(workspaceMode==="live"){
      if(liveEditing)saveLiveText();
      clearLiveSelection();
      $("livePageFrame").focus({preventScroll:true});
      status("Select tool active · Click webpage content or Alt-click a section");
      return;
    }
    if(editingId!==null)finishTextEdit();
    select(null);
    $("stage").focus({preventScroll:true});
    status("Select tool active · Click or Shift-click objects on the canvas");
  });
  $("stage").addEventListener("dblclick",event=>{
    if(editingId!==null)return;
    const node=event.target.closest(".scene-object");
    if(node){beginTextEdit(Number(node.dataset.id));return;}
    if(event.target!==$("stage"))return;
    const point=pagePoint(event);
    add("text",{x:point.x,y:point.y,w:320,h:90,
      name:"New text",text:"Type here"});
    beginTextEdit(activeId);
  });
  $("stage").addEventListener("dragover",event=>{
    if(event.dataTransfer?.types.includes("Files")){
      event.preventDefault();
      event.dataTransfer.dropEffect="copy";
      $("stage").classList.add("drag-target");
    }
  });
  $("stage").addEventListener("dragleave",event=>{
    if(!$("stage").contains(event.relatedTarget))$("stage").classList.remove("drag-target");
  });
  $("stage").addEventListener("drop",event=>{
    event.preventDefault();$("stage").classList.remove("drag-target");
    const file=[...event.dataTransfer.files].find(file=>
      ["image/png","image/jpeg","image/webp"].includes(file.type));
    if(file)insertImageFile(file,pagePoint(event));
    else status("Drop a PNG, JPEG or WebP image onto the canvas");
  });
  $("stage").addEventListener("focusout",event=>{
    if(editingId!==null&&
      event.target.closest(".scene-object")?.dataset.id===String(editingId))finishTextEdit();
  });
  $("liveCopyObject").addEventListener("click",copyLiveSelection);
  $("livePasteObject").addEventListener("click",pasteLiveSelection);
  $("copyObjects").addEventListener("click",()=>copyCanvasObjects());
  $("pasteObjects").addEventListener("click",pasteCanvasObjects);
  $("selectAllObjects").addEventListener("click",selectAllCanvasObjects);
  $("layers").addEventListener("click",event=>{
    const node=event.target.closest("[data-layer-id]");
    if(!node)return;
    const id=Number(node.dataset.layerId);
    select(id,event.shiftKey);
    requestAnimationFrame(()=>{
      $("stage").querySelector('[data-id="'+id+'"]')?.scrollIntoView({
        block:"nearest",inline:"nearest",behavior:"instant"
      });
    });
  });
  for(const mode of ["alignLeft","alignCenter","alignTop","distributeH","distributeV"]){
    $(mode).addEventListener("click",()=>arrangeSelection(mode));
  }
  for(const [prop,id] of Object.entries(propertyIds)){
    $(id).addEventListener("change",event=>{
      const obj=lookup(activeId);if(!obj||obj.locked)return;
      let value=event.target.value;
      if(["x","y","w","h","font"].includes(prop)){
        value=Math.round(number(value));
        if(prop==="w")value=clamp(value,MIN_W,8000);
        if(prop==="h")value=clamp(value,MIN_H,20000);
        if(prop==="font")value=clamp(value,10,120);
      }
      if(prop==="src"&&!safeImageSource(value)){status("Use an existing assets/ image or upload a local image");renderProperties();return;}
      if(prop==="name")value=value.slice(0,120);
      if(prop==="text")value=value.slice(0,30000);
      if(prop==="alt")value=value.slice(0,300);
      mutate(()=>{
        obj[prop]=value;
        if(prop==="text")obj.rich="";
        if(prop==="bg")obj.transparent=false;
        scene.height=Math.max(scene.height,obj.y+obj.h+70);
      });
    });
  }
  $("fitText").addEventListener("click",()=>{
    const obj=lookup(activeId);
    if(obj?.type!=="text"||obj.locked)return;
    mutate(()=>{
      obj.h=measuredTextHeight(obj);
      scene.height=Math.max(scene.height,obj.y+obj.h+70);
    });
  });
  $("propShapeKind").addEventListener("change",event=>{
    const obj=lookup(activeId);
    if(obj?.type!=="shape"||obj.locked)return;
    const value=event.target.value;
    if(!["rectangle","ellipse","line"].includes(value))return;
    mutate(()=>{obj.shapeKind=value;});
  });
  $("propTransparent").addEventListener("change",event=>{
    const obj=lookup(activeId);if(!obj||obj.locked)return;
    const transparent=event.target.checked;
    mutate(()=>{obj.transparent=transparent;});
  });
  $("replaceImage").addEventListener("click",()=>{
    if(lookup(activeId)?.type!=="image"||lookup(activeId).locked)return;
    $("replaceFile").dataset.target=String(activeId);
    $("replaceFile").click();
  });
  $("replaceFile").addEventListener("change",event=>{
    const file=event.target.files?.[0];
    const requestedPage=currentPage;
    const target=Number(event.target.dataset.target);
    event.target.value="";
    if(!file)return;
    if(file.size>3000000||!["image/png","image/jpeg","image/webp"].includes(file.type)){
      status("Choose PNG, JPEG or WebP under 3 MB");return;
    }
    const reader=new FileReader();
    reader.onload=()=>{
      if(requestedPage!==currentPage){
        status("Image replacement cancelled because you switched pages");return;
      }
      const obj=lookup(target);if(!obj||obj.type!=="image"||obj.locked)return;
      mutate(()=>{obj.src=String(reader.result);obj.alt=file.name.replace(/\.[^.]+$/,"");});
    };
    reader.readAsDataURL(file);
  });
  $("undo").addEventListener("click",undo);$("redo").addEventListener("click",redoAction);
  $("save").addEventListener("click",saveActiveDraft);
  $("addText").addEventListener("click",()=>{
    if(workspaceMode==="live")addLiveObject("text");
    else add("text",{text:"Double-click to edit text",name:"New text"});
  });
  $("addShape").addEventListener("click",()=>{
    if(workspaceMode==="live")addLiveObject("shape");
    else add("shape",{name:"New shape"});
  });
  $("addImage").addEventListener("click",()=>$("imageFile").click());
  $("imageFile").addEventListener("change",event=>{
    const file=event.target.files?.[0];event.target.value="";
    insertImageFile(file);
  });
  $("duplicate").addEventListener("click",()=>{
    if(workspaceMode==="live"){
      if(duplicateSelectedLiveGroup())return;
      const node=liveSelected?.node;if(!node)return;
      if(LIVE_ADDED_ID.test(liveSelector(node))){
        const patch=livePatchForSelected();
        if(!patch||patch.kind!=="insert")return;
        const before=liveSnapshot(),newPatch=copy(patch);
        newPatch.selector=newAddedPatch(patch.objectType,
          {src:patch.src,alt:patch.alt,html:patch.html,fill:patch.fill}).selector;
        for(const dev of Object.keys(newPatch.geometry)){
          newPatch.geometry[dev].x=clamp(newPatch.geometry[dev].x+24,-4000,10000);
          newPatch.geometry[dev].y=clamp(newPatch.geometry[dev].y+24,-4000,40000);
        }
        livePatches.set(newPatch.selector,newPatch);
        const twin=applyAddedPatch(node.ownerDocument,newPatch);
        recordLiveHistory(before);renderLiveLayers();selectLiveElement(twin);return;
      }
      if(node.tagName==="IMG"){
        const src=node.getAttribute("src")||"";
        if(safeImageSource(src))addLiveObject("image",{src,alt:node.alt||""});
      }else if(!LIVE_CONTAINER_SET.has(node.tagName))
        addLiveObject("text",{html:cleanRich(node.innerHTML)});
      else status("Select text or an image to duplicate it as a free webpage object");
      return;
    }
    const source=scene.objects.filter(o=>selected.has(o.id)&&!o.locked);if(!source.length)return;
    mutate(()=>{
      const ids=[];
      for(const obj of source){
        if(scene.objects.length>=MAX_OBJECTS)break;
        const clone=copy(obj);clone.id=scene.nextId++;clone.name=obj.name+" copy";
        clone.x+=24;clone.y+=24;clone.z=scene.objects.reduce((m,o)=>Math.max(m,o.z),0)+1;
        scene.objects.push(clone);ids.push(clone.id);
      }
      selected=new Set(ids);activeId=ids.at(-1)||null;
    });
  });
  $("front").addEventListener("click",()=>{
    if(workspaceMode==="live"){setLiveLayer(true);return;}
    mutate(()=>{
      let z=scene.objects.reduce((m,o)=>Math.max(m,o.z),0);
      for(const obj of scene.objects.filter(o=>selected.has(o.id)&&!o.locked))obj.z=++z;
    });
  });
  $("back").addEventListener("click",()=>{
    if(workspaceMode==="live"){setLiveLayer(false);return;}
    mutate(()=>{
      let z=scene.objects.reduce((m,o)=>Math.min(m,o.z),0);
      for(const obj of scene.objects.filter(o=>selected.has(o.id)&&!o.locked))obj.z=--z;
    });
  });
  $("remove").addEventListener("click",()=>{
    if(workspaceMode==="live"){deleteSelectedLiveElement();return;}
    mutate(()=>{
      scene.objects=scene.objects.filter(o=>!selected.has(o.id)||o.locked);
      selected.clear();activeId=null;
    });
  });
  $("lock").addEventListener("click",()=>mutate(()=>{for(const obj of scene.objects.filter(o=>selected.has(o.id)))obj.locked=!obj.locked;}));
  $("hide").addEventListener("click",()=>mutate(()=>{for(const obj of scene.objects.filter(o=>selected.has(o.id)))obj.hidden=!obj.hidden;}));
  $("resetScene").addEventListener("click",()=>{
    if(!confirm("Discard this page's new-editor draft? The original website will not be affected."))return;
    mutate(()=>{scene.objects=[];scene.nextId=1;selected.clear();activeId=null;});
    save();
  });
  $("exportScene").addEventListener("click",()=>download(currentPage+".canvas.json",JSON.stringify(scene,null,2),"application/json"));
  $("exportHtml").addEventListener("click",()=>download(currentPage.replace(".html","-canvas-preview.html"),standaloneHtml(),"text/html"));
  $("preview").addEventListener("click",async()=>{
    if(workspaceMode==="live"&&liveEditing)saveLiveText();
    const button=$("preview"),page=currentPage,mode=workspaceMode;
    button.disabled=true;
    try{
      if(mode==="live"){
        status("Building publication-identical preview from the latest GitHub HTML…");
        const pair=await verifiedSourcePreviewPair();
        if(currentPage!==page||workspaceMode!==mode)return;
        $("previewFrame").srcdoc=pair.edited;
        $("previewSourceStatus").textContent="Verified against GitHub main · "+
          pair.page+" · source "+pair.sha.slice(0,10)+
          " · This is the HTML produced by the live-publishing assembler.";
      }else{
        $("previewFrame").srcdoc=standaloneHtml();
        $("previewSourceStatus").textContent="Free design canvas · staging-only preview";
      }
      $("previewDialog").showModal();
      fitVerifiedPreviewFrames();
      requestAnimationFrame(fitVerifiedPreviewFrames);
    }catch(error){status(error.message||"Could not create verified page preview");}
    finally{button.disabled=false;}
  });
  $("compare").addEventListener("click",async()=>{
    if(workspaceMode==="live"&&liveEditing)saveLiveText();
    const button=$("compare"),page=currentPage,mode=workspaceMode;
    button.disabled=true;
    try{
      if(mode==="live"){
        const pair=await verifiedSourcePreviewPair();
        if(page!==currentPage||mode!==workspaceMode)return;
        $("originalFrame").srcdoc=pair.original;
        $("sceneFrame").srcdoc=pair.edited;
        $("compareSourceStatus").textContent="Both views use GitHub source "+
          pair.sha.slice(0,10)+". Resize the comparison to inspect layout changes.";
      }else{
        const source=await fetchGithubPageSource(page,{force:true});
        if(page!==currentPage)return;
        $("originalFrame").srcdoc=source.html;
        $("sceneFrame").srcdoc=standaloneHtml();
        $("compareSourceStatus").textContent=
          "Original GitHub page versus independent staging-only canvas";
      }
      $("compareDialog").showModal();
      fitVerifiedPreviewFrames();
      requestAnimationFrame(fitVerifiedPreviewFrames);
    }catch(error){status(error.message||"Could not compare the selected page");}
    finally{button.disabled=false;}
  });
  $("closeCompare").addEventListener("click",()=>{
    $("compareDialog").close();
    $("originalFrame").removeAttribute("srcdoc");
    $("sceneFrame").removeAttribute("srcdoc");
  });
  $("closePreview").addEventListener("click",()=>$("previewDialog").close());
  $("publish").addEventListener("click",()=>{
    if(liveEditing)saveLiveText();
    if(workspaceMode==="live"&&!livePatches.size){
      status("Save a live-page text, image, appearance, or layout edit before publishing.");return;
    }
    if(workspaceMode==="design"&&!scene.objects.length){
      status("Import or add objects first.");return;
    }
    $("publishTarget").value=workspaceMode==="live"?"live":"staging";
    $("publishTarget").querySelector('[value="live"]').disabled=workspaceMode!=="live";
    $("acknowledgeLive").checked=false;
    $("githubToken").value=githubTabToken;
    $("keepGithubToken").checked=!!githubTabToken;
    $("forgetGithubToken").hidden=!githubTabToken;
    updatePublishTarget();
    $("publishDialog").showModal();
  });
  $("publishTarget").addEventListener("change",updatePublishTarget);
  $("imageReconnectPanel").addEventListener("toggle",event=>{
    if(event.target.open&&workspaceMode==="live")loadReconnectImages();
  });
  $("reconnectSavedImage").addEventListener("change",()=>{
    const patch=livePatches.get($("reconnectSavedImage").value);
    const match=reconnectImages.find(item=>patch&&equivalentSiteImageSource(item.src,patch.expected));
    if(match)$("reconnectSourceImage").value=match.selector;
    updateReconnectPreview();
  });
  $("reconnectSourceImage").addEventListener("change",updateReconnectPreview);
  $("reconnectImageButton").addEventListener("click",reconnectSavedImage);
  $("publishPatchList").addEventListener("click",event=>{
    const button=event.target.closest("button[data-patch-selector]");
    if(!button)return;
    const selector=button.dataset.patchSelector;
    if(!livePatches.has(selector))return;
    const before=liveSnapshot();
    livePatches.delete(selector);
    recordLiveHistory(before);
    renderPublishPatchList();
    listReconnectEdits();
    $("confirmPublish").disabled=$("publishTarget").value==="live"&&!livePatches.size;
    $("publishError").hidden=true;
    loadLivePage();
    status("Saved edit removed from draft · Undo available · Website unchanged");
  });
  $("checkPublishEdits").addEventListener("click",async()=>{
    if(liveEditing)saveLiveText();
    const button=$("checkPublishEdits"),message=$("publishError");
    if(workspaceMode!=="live")return;
    button.disabled=true;message.hidden=true;
    try{
      await sourcePreservingHtml(new URL(".",location.href).href);
      message.hidden=false;
      message.classList.add("publish-success");
      message.textContent="All "+livePatches.size+
        " saved edits match the current webpage source. GitHub will also verify its latest version when you publish.";
    }catch(error){
      message.classList.remove("publish-success");
      message.textContent=error.message||"Saved edit verification failed";
      message.hidden=false;
      if([...livePatches.values()].some(p=>p.kind==="image")&&
         /matching original element|match saved edit|source was updated|image/i.test(error.message||"")){
        // Offer a repair immediately, without deleting the draft or
        // automatically selecting a different original image.
        $("imageReconnectPanel").open=true;
      }
    }finally{button.disabled=false;}
  });
  $("publishDialog").addEventListener("close",()=>{$("githubToken").value="";});
  $("forgetGithubToken").addEventListener("click",()=>{
    githubTabToken="";
    $("githubToken").value="";
    $("keepGithubToken").checked=false;
    $("forgetGithubToken").hidden=true;
    status("GitHub token cleared from this editor tab");
  });
  $("cancelPublish").addEventListener("click",()=>{
    if($("cancelPublish").disabled)return;
    $("githubToken").value="";$("publishDialog").close();
  });
  $("publishForm").addEventListener("submit",async event=>{
    if(event.submitter?.value!=="publish")return;
    event.preventDefault();
    const token=$("githubToken").value.trim(),target=$("publishTarget").value;
    const message=$("publishError");
    if(target==="live"&&!$("acknowledgeLive").checked){
      message.textContent="Confirm you reviewed this page before publishing live.";
      message.hidden=false;return;
    }
    $("confirmPublish").disabled=true;$("cancelPublish").disabled=true;
    message.classList.remove("publish-success");
    message.hidden=true;
    status("Checking the latest GitHub file before publishing…");
    try{
      const result=await publishGithub(token,target);
      githubTabToken=$("keepGithubToken").checked?token:"";
      $("forgetGithubToken").hidden=!githubTabToken;
      $("publishDialog").close();
      showPublishResult(result);
      if(result.target==="live"&&result.publishedHtml&&currentPage===result.page&&
        JSON.stringify(liveSnapshot())===result.draftSignature){
        // Rebase draft expectations on the *confirmed* GitHub commit. Future
        // changes in the same tab then compare with what was just published,
        // even if GitHub Pages is still serving the previous deployed build.
        const committed=new DOMParser().parseFromString(result.publishedHtml,"text/html");
        const rebased=new Map();
        for(const item of result.publishedNormalized){
          // A successfully published deletion has no remaining source element
          // to edit. Retain other patches for later changes, drop deletions.
          if(item.kind==="delete"||item.kind==="remove-added")continue;
          if(item.kind==="insert"){
            if(findAddedNode(committed,item.selector))
              rebased.set(item.selector,{...item});
            continue;
          }
          const patch={...item},node=committed.querySelector(patch.selector);
          if(!node)continue;
          patch.expected=patch.kind==="image"?
            node.getAttribute("src")||"":
            (node.textContent||"").trim().slice(0,300);
          rebased.set(patch.selector,patch);
        }
        livePatches=rebased;
        liveHistory=[];liveRedo=[];
        // Use the exact HTML just confirmed by GitHub. Its Pages deployment
        // may still be serving an older version while the CDN catches up.
        liveGithubSources.set(result.page,{
          html:result.publishedHtml,sha:result.commit,verified:true
        });
        storeLiveDraft();refreshUndo();
        loadLivePage(result.page);
      }
      status(result.target==="live"?
        "GitHub confirmed publication of "+result.page+" · Deployment may be pending":
        "GitHub confirmed staging preview of "+result.page+" · Deployment may be pending");
      // Keep the browser draft available until the user verifies the
      // deployed page. Never erase their changes merely on a successful PUT.
    }catch(error){
      message.textContent=error.message||"GitHub publication failed.";
      message.hidden=false;
      status("Publication stopped · No changes were confirmed");
    }finally{
      $("githubToken").value="";
      $("confirmPublish").disabled=$("publishTarget").value==="live"&&!livePatches.size;
      $("cancelPublish").disabled=false;
    }
  });
  document.addEventListener("keydown",event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="s"){
      event.preventDefault();saveActiveDraft();return;
    }
    if(editingId!==null){
      if(event.key==="Escape"||(event.key==="Enter"&&(event.metaKey||event.ctrlKey))){
        event.preventDefault();finishTextEdit();
      }
      return;
    }
    if(isTextField(event.target))return;
    if(workspaceMode==="live"&&(event.ctrlKey||event.metaKey)&&
       event.shiftKey&&liveSelected?.node){
      if(event.key.toLowerCase()==="c"){
        event.preventDefault();copyLiveFormat();return;
      }
      if(event.key.toLowerCase()==="v"){
        event.preventDefault();pasteLiveFormat();return;
      }
    }
    if(event.key==="Escape"&&gesture){
      event.preventDefault();cancelCanvasGesture();return;
    }
    if(event.key==="Escape"&&canvasMarquee){
      event.preventDefault();cancelCanvasMarquee();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){
      event.preventDefault();if(event.shiftKey)redoAction();else undo();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="y"){
      event.preventDefault();redoAction();return;
    }
    if(workspaceMode==="live"){
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="a"){
        event.preventDefault();selectAllLiveAdded();return;
      }
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c"&&liveSelected?.node){
        event.preventDefault();copyLiveSelection();return;
      }
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="v"&&liveObjectClipboard){
        event.preventDefault();pasteLiveSelection();return;
      }
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="d"&&liveSelected?.node){
        event.preventDefault();$("duplicate").click();return;
      }
      // Canvas selection is retained across workspace switches. Shortcuts
      // must never delete/duplicate/move those hidden canvas objects.
      if((event.ctrlKey||event.metaKey)&&event.key==="]"&&liveSelected?.node){
        event.preventDefault();setLiveLayer(true);return;
      }
      if((event.ctrlKey||event.metaKey)&&event.key==="["&&liveSelected?.node){
        event.preventDefault();setLiveLayer(false);return;
      }
      if(event.key==="Escape"){
      if(liveCropMode){event.preventDefault();setLiveCropMode(false);}
      else clearLiveSelection();
      return;
    }
      if((event.key==="Delete"||event.key==="Backspace")&&liveSelected?.node){
        event.preventDefault();deleteSelectedLiveElement();return;
      }
      // Match the arrow-key behaviour available inside the live-page iframe.
      // The selection must remain movable when keyboard focus shifts back to
      // the editor toolbar or canvas. Never hijack modified browser shortcuts.
      const liveMoves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(liveSelected?.node&&liveMoves[event.key]&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
        event.preventDefault();
        const [dx,dy]=liveMoves[event.key],step=event.shiftKey?10:1;
        if(liveCropMode&&liveSelected.node.tagName==="IMG")
          nudgeLiveImageCrop(dx*step,dy*step);
        else nudgeLiveSelection(dx*step,dy*step);
        syncLiveOverlay();
      }
      return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="a"){
      event.preventDefault();selectAllCanvasObjects();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="c"&&selected.size){
      event.preventDefault();copyCanvasObjects();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="x"&&selected.size){
      event.preventDefault();copyCanvasObjects(true);return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="v"&&canvasClipboard.length){
      event.preventDefault();pasteCanvasObjects();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="d"){
      event.preventDefault();$("duplicate").click();return;
    }
    if(event.key==="Escape"){select(null);return;}
    if(event.key==="Delete"||event.key==="Backspace"){
      if(selected.size){event.preventDefault();$("remove").click();}return;
    }
    if(event.key==="F2"&&activeId!==null){event.preventDefault();beginTextEdit(activeId);return;}
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(moves[event.key]&&selected.size){
      event.preventDefault();
      const step=event.shiftKey?10:1,[dx,dy]=moves[event.key];
      mutate(()=>{for(const obj of scene.objects.filter(o=>selected.has(o.id)&&!o.locked)){
        obj.x+=dx*step;obj.y+=dy*step;
      }});
    }
  });
}
const fileInput=document.createElement("input");
fileInput.type="file";fileInput.accept="image/png,image/jpeg,image/webp";
fileInput.id="imageFile";fileInput.hidden=true;document.body.append(fileInput);
const replaceInput=document.createElement("input");
replaceInput.type="file";replaceInput.accept="image/png,image/jpeg,image/webp";
replaceInput.id="replaceFile";replaceInput.hidden=true;document.body.append(replaceInput);
const sceneInput=document.createElement("input");
sceneInput.type="file";sceneInput.accept=".json,application/json";
sceneInput.id="sceneFile";sceneInput.hidden=true;document.body.append(sceneInput);
const params=new URLSearchParams(location.search);
const start=params.get("page");
if(start&&PAGES.has(start))$("page").value=start;
attachEvents();changePage($("page").value);
})();