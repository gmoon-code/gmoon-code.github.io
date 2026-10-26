/* Academic Editor 2. Independent scene-model editor.
   No legacy editor classes, free layers, layout placeholders or source mutations.
   Imported website pages remain untouched until an explicitly reviewed migration. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const VERSION=2, REPO="gmoon-code/gmoon-code.github.io";
const PAGES=new Set([...$("page").options].map(opt=>opt.value));
const STANDARD_WIDTH=1160, MAX_OBJECTS=350, MIN_W=40, MIN_H=24;
const HANDLES=["nw","n","ne","e","se","s","sw","w"];
const NEW_DRAFT="moon-academic-editor-v2:";
let currentPage="index.html";
let scene={version:VERSION,page:currentPage,width:STANDARD_WIDTH,height:1080,objects:[],nextId:1};
let selected=new Set(),activeId=null,history=[],redo=[],zoom=.8,gesture=null,editingId=null,saveTimer=null,loadSerial=0,lastTap=null,pageImages=[];
let canvasClipboard=[],canvasPasteCount=0;
let workspaceMode="live",liveWidth=1160,liveScale=1,liveManualScale=null,liveSelected=null,liveObserver=null,liveSerial=0;
let liveSuppressClickUntil=0;
const LIVE_DRAFT_KEY="moon-academic-editor-v2:source:";
let livePatches=new Map(),liveEditing=null,liveHistory=[],liveRedo=[],liveGesture=null,liveOverlay=null;
let githubTabToken=""; // In-memory only. Never written to storage or page files.
let reconnectImages=[],reconnectForPage="";
const liveGithubSources=new Map();
let liveSourceProvenance="loading"; // verified GitHub main or fallback deployed HTML
let liveDisplayedSourceHtml=null; // Exact original HTML used to build the open editor
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
  $("duplicate").disabled=!editable;
  $("remove").disabled=workspaceMode==="live"?!liveSelected?.node:!editable;
  $("front").disabled=workspaceMode==="live"?!liveSelected?.node:!editable;
  $("back").disabled=workspaceMode==="live"?!liveSelected?.node:!editable;
  $("copyObjects").disabled=workspaceMode!=="design"||!selected.size;
  $("pasteObjects").disabled=workspaceMode!=="design"||!canvasClipboard.length||
    scene.objects.length>=MAX_OBJECTS;
  $("selectAllObjects").disabled=workspaceMode!=="design"||
    !scene.objects.some(obj=>!obj.hidden&&!obj.locked);
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
function insertImageFile(file,position={}){
  if(!file)return;
  const requestedPage=currentPage;
  if(file.size>3000000||!["image/png","image/jpeg","image/webp"].includes(file.type)){
    status("Choose PNG, JPEG or WebP under 3 MB");return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    if(currentPage!==requestedPage){
      status("Image insertion cancelled because the selected website page changed");return;
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
  }else if(gesture)cancelCanvasGesture();
  workspaceMode=mode;
  const isLive=mode==="live";
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
  $("workspaceTitle").textContent=isLive?"Live website":"Free design canvas";
  $("workspacePill").textContent=isLive?"Original layout · safe content edits":"Independent objects · staging only";
  $("workspaceExplanation").textContent=isLive?
    "This displays the existing page with its real styles and responsive layout. Select text or an image to edit it in the original-page inspector. Copy creates an independent free-design object. Production files remain unchanged.":
    "This canvas is a simplified, independent reconstruction. It does not yet reproduce every original section or responsive rule. Use Live website to verify the real page; only the staging preview can be published.";
  $("workspaceFooter").textContent=isLive?
    "Original page · Drag text or images directly · Double-click text to edit · Alt-click linked text or a section · Resize with handles":
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
}
function liveSelector(node){
  const steps=[];
  for(let current=node;current&&current.tagName!=="MAIN";current=current.parentElement){
    if(!current.parentElement||steps.length>12)return null;
    const siblings=[...current.parentElement.children].filter(el=>el.tagName===current.tagName);
    steps.unshift(current.tagName.toLowerCase()+":nth-of-type("+(siblings.indexOf(current)+1)+")");
  }
  return steps.length?"main > "+steps.join(" > "):null;
}
const LIVE_CONTAINER_TAGS="section,article,aside,figure,div,nav,ul,ol";
const LIVE_EDITABLE_TAGS="h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,img";
const LIVE_SELECTABLE_TAGS=LIVE_EDITABLE_TAGS+","+LIVE_CONTAINER_TAGS;
function liveEventTarget(event){
  // Alt-click selects a container; on an actual hyperlink it selects the
  // enclosing paragraph so the link's text remains editable.
  const nearestText=event.target.closest?.(LIVE_EDITABLE_TAGS);
  const nearestContainer=event.target.closest?.(LIVE_CONTAINER_TAGS);
  return event.altKey&&!event.target.closest?.("a[href]")?
    nearestContainer||nearestText:nearestText||nearestContainer;
}
const LIVE_CONTAINER_SET=new Set(["SECTION","ARTICLE","ASIDE","FIGURE","DIV","NAV","UL","OL"]);
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
  return !patch.layout&&!patch.appearance&&
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
    refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();
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
    refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();
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
    refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();
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
  const sheet=node.ownerDocument.getElementById("moon-v2-live-layout");
  const wasDisabled=sheet?.disabled;
  if(sheet)sheet.disabled=true;
  try{
    const style=node.ownerDocument.defaultView.getComputedStyle(node);
    const translate=style.translate;
    const match=translate.match(/^(-?(?:\d+\.?\d*|\.\d+))px(?:\s+(-?(?:\d+\.?\d*|\.\d+))px)?$/);
    const scale=style.scale==="none"?[]:style.scale.split(/\s+/).map(Number);
    return {
      ox:match?Number(match[1]):0,oy:match?Number(match[2]||0):0,
      osx:Number.isFinite(scale[0])?scale[0]:1,
      osy:Number.isFinite(scale[1])?scale[1]:Number.isFinite(scale[0])?scale[0]:1
    };
  }finally{if(sheet)sheet.disabled=wasDisabled;}
}
function liveLayoutFor(selector,device=liveDevice()){
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
    if(patch.kind==="delete")continue;
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
      if(patch.kind==="delete")continue;
      const entry=patch.layout?.[device];
      if(!entry||!validLiveLayout({[device]:entry}))continue;
      // Both values are bounded, strictly numeric data. Selectors are
      // validated source-rooted nth-of-type paths; no arbitrary CSS allowed.
      const reflow=entry.wrapWidth!==undefined?
        "width:"+entry.wrapWidth+"px!important;height:"+entry.reserveHeight+
        "px!important;box-sizing:border-box!important;min-width:0!important;"+
        "max-width:none!important;max-height:none!important;overflow:visible!important;":"";
      selectors.push(patch.selector+"{translate:"+
        (Math.round(((entry.ox||0)+entry.dx)*1000)/1000)+"px "+
        (Math.round(((entry.oy||0)+entry.dy)*1000)/1000)+"px!important;scale:"+
        (Math.round(((entry.osx||1)*entry.sx)*1000)/1000)+" "+
        (Math.round(((entry.osy||1)*entry.sy)*1000)/1000)+
        "!important;transform-origin:top left!important;"+reflow+"}");
    }
    if(selectors.length)result.push("@media "+media+"{"+selectors.join("")+"}");
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
function livePatchForSelected(){
  const node=liveSelected?.node,selector=node&&liveSelector(node);
  if(!selector)return null;
  const existing=livePatches.get(selector);
  if(existing)return copy(existing);
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
  const from=again?liveRedo:liveHistory,to=again?liveHistory:liveRedo;
  if(!from.length)return;
  if(liveEditing)saveLiveText();
  to.push(liveSnapshot());
  livePatches=new Map(from.pop().map(p=>[p.selector,p]));
  storeLiveDraft();refreshUndo();loadLivePage();
}
function applyLiveLayoutInput(key,value){
  const patch=livePatchForSelected();if(!patch)return;
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
const LIVE_REFLOW_TEXT="h1,h2,h3,h4,h5,h6,p,blockquote,figcaption";
function normaliseTextBoxLayout(node,layout){
  // Preserve the rendered text-box dimensions when migrating an old
  // scale-based edit to a real width/height edit. Clear CSS scale on both
  // axes so glyphs are never stretched by future text resizing.
  const rect=node.getBoundingClientRect();
  const next={...layout};
  next.wrapWidth=Math.round(clamp(next.wrapWidth??rect.width,64,4000));
  next.reserveHeight=Math.round(clamp(next.reserveHeight??rect.height,24,5000));
  next.sx=clamp(1/(next.osx||1),.2,5);
  next.sy=clamp(1/(next.osy||1),.2,5);
  return next;
}
function setLiveReflow(enabled){
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
  const node=liveSelected?.node;
  if(!node?.matches("h1,h2,h3,h4,h5,h6,p,blockquote,figcaption"))return;
  const patch=livePatchForSelected();if(!patch)return;
  const layout=normaliseTextBoxLayout(node,liveLayoutFor(patch.selector));
  const number=Number(value);
  if(!Number.isFinite(number))return;
  const before=liveSnapshot();
  layout[key]=Math.round(clamp(number,key==="wrapWidth"?64:24,
    key==="wrapWidth"?4000:5000));
  patch.layout={...patch.layout,[liveDevice()]:layout};
  livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){
    refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();
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
  const patch=livePatchForSelected();if(!patch?.layout?.[liveDevice()])return;
  const before=liveSnapshot();
  delete patch.layout[liveDevice()];
  if(!Object.keys(patch.layout).length)delete patch.layout;
  if(pruneLivePatch(patch,liveSelected.node))
    livePatches.delete(patch.selector);
  else livePatches.set(patch.selector,patch);
  if(recordLiveHistory(before)){refreshLiveLayoutRules();renderLiveInspector();syncLiveOverlay();}
}
function validLivePatch(p){
  return p&&typeof p.selector==="string"&&p.selector.length<800&&
    /^main(?: > [a-z][a-z0-9-]*:nth-of-type\(\d{1,4}\)){1,12}$/.test(p.selector)&&
    typeof p.expected==="string"&&p.expected.length<=350&&
    (p.kind==="text"&&typeof p.html==="string"&&p.html.length<=70000||
     p.kind==="image"&&safeImageSource(p.src)&&typeof p.alt==="string"&&p.alt.length<=300||
     p.kind==="layout"||p.kind==="delete")&&
    (p.tag===undefined||/^(?:h[1-6]|p|li|figcaption|blockquote|img|section|article|aside|figure|div|nav|ul|ol)$/.test(p.tag))&&
    (p.layout===undefined||validLiveLayout(p.layout))&&
    (p.appearance===undefined||validLiveAppearance(p.appearance));
}
function loadLiveDraft(page){
  livePatches=new Map();liveHistory=[];liveRedo=[];
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
    $("liveScaleX").disabled=canReflow;
    $("liveScaleY").disabled=canReflow;
    $("liveScaleX").closest("label").hidden=canReflow;
    $("liveScaleY").closest("label").hidden=canReflow;
    $("liveTextReflowControls").hidden=!canReflow;
    const on=canReflow;
    $("liveTextReflow").checked=on;
    $("liveTextBoxWidth").disabled=!on;
    $("liveTextBoxHeight").disabled=!on;
    $("liveTextBoxWidth").value=String(Math.round(entry.wrapWidth||node.getBoundingClientRect().width));
    $("liveTextBoxHeight").value=String(Math.round(entry.reserveHeight||node.getBoundingClientRect().height));
    const extra=canReflow&&entry.wrapWidth!==undefined?
      Math.max(0,Math.ceil(node.scrollHeight-node.clientHeight)):0;
    $("liveReflowWarning").hidden=extra<=3;
    $("liveReflowWarning").textContent=extra>3?
      "Wrapped text extends about "+extra+"px beyond the reserved height and may overlap the next element.":"";
    $("liveFitReflowHeight").disabled=!canReflow||extra<=3;
    $("resetLiveLayout").disabled=!livePatches.get(selector)?.layout?.[liveDevice()];
  }
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
  for(const patch of livePatches.values()){
    if(!validLivePatch(patch)){
      if(strict)throw Error("An invalid live-page edit needs review.");continue;
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
    }else if(patch.kind==="text")node.innerHTML=cleanRich(patch.html);
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
  const old=livePatches.get(edit.selector);
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
  const before=liveSnapshot(),old=livePatches.get(selector);
  const expected=old?.expected||node.getAttribute("src")||"";
  node.setAttribute("src",src);node.setAttribute("alt",alt);
  livePatches.set(selector,{selector,kind:"image",expected,src,alt,
    ...(old?.layout?{layout:old.layout}:{})});
  recordLiveHistory(before);renderLiveInspector();renderLiveLayers();
}
function deleteSelectedLiveElement(){
  if(workspaceMode!=="live"||liveEditing)return;
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
  liveOverlay=null;
}
function syncLiveOverlay(){
  if(workspaceMode!=="live"||!liveSelected?.node?.isConnected||liveEditing){
    removeLiveOverlay();return;
  }
  const node=liveSelected.node,doc=node.ownerDocument;
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
      "#moon-v2-live-overlay button{position:absolute!important;pointer-events:auto!important;"+
      "touch-action:none!important;box-sizing:border-box!important;cursor:move!important;"+
      "z-index:2147483001!important;border:1px solid #287dbb!important;"+
      "background:#fff!important;color:#14547e!important;font:12px Arial,sans-serif!important;}"+
      "#moon-v2-live-overlay .moon-v2-grip{width:13px!important;height:13px!important;"+
      "border-radius:2px!important;padding:0!important;}"+
      "#moon-v2-live-overlay .moon-v2-move{left:0!important;top:-29px!important;"+
      "height:26px!important;padding:2px 8px!important;border-radius:4px!important;"+
      "white-space:nowrap!important;}"+
      "#moon-v2-live-overlay .moon-v2-delete{left:60px!important;top:-29px!important;"+
      "height:26px!important;padding:2px 8px!important;border-radius:4px!important;"+
      "white-space:nowrap!important;border-color:#a33!important;color:#a33!important;}";
    doc.head.append(css);
    const move=doc.createElement("button");
    move.className="moon-v2-move";move.type="button";move.textContent="Move";
    move.setAttribute("aria-label","Move selected live-page object");
    move.dataset.direction="move";
    liveOverlay.append(move);
    const remove=doc.createElement("button");
    remove.className="moon-v2-delete";remove.type="button";remove.textContent="Delete";
    remove.setAttribute("aria-label","Delete selected webpage element (undo is available)");
    remove.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      deleteSelectedLiveElement();
    });
    liveOverlay.append(remove);
    if(node.matches(LIVE_SELECTABLE_TAGS)){
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
  const rect=node.getBoundingClientRect();
  liveOverlay.style.left=rect.left+"px";
  liveOverlay.style.top=rect.top+"px";
  liveOverlay.style.width=rect.width+"px";
  liveOverlay.style.height=rect.height+"px";
}
function removeLiveSnapGuides(){
  const doc=$("livePageFrame")?.contentDocument;
  doc?.getElementById("moon-v2-snap-x")?.remove();
  doc?.getElementById("moon-v2-snap-y")?.remove();
}
function candidateLiveSnapLines(node){
  const doc=node.ownerDocument,root=doc.querySelector("main");
  const x=[],y=[];
  if(!root)return {x,y};
  for(const other of [...root.querySelectorAll(LIVE_SELECTABLE_TAGS)].slice(0,180)){
    if(other===node||other.contains(node)||node.contains(other))continue;
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
  if(direction!=="move"&&!liveSelected.node.matches(LIVE_SELECTABLE_TAGS))return;
  const node=liveSelected.node,selector=liveSelector(node);
  const patch=livePatchForSelected();
  if(!patch||!validLivePatch(patch))return;
  const rect=node.getBoundingClientRect();
  if(rect.width<2||rect.height<2)return;
  event.preventDefault();event.stopPropagation();
  liveGesture={pointer:event.pointerId,anchor,dir:direction,
    startX:event.clientX,startY:event.clientY,rect,
    patch,layout:liveLayoutFor(selector),snapshot:liveSnapshot(),
    moved:false,selector,node,snapLines:candidateLiveSnapLines(node)};
  anchor.setPointerCapture?.(event.pointerId);
}
function moveLiveGesture(event){
  const g=liveGesture;
  if(!g||g.pointer!==event.pointerId)return;
  event.preventDefault();
  const deltaX=event.clientX-g.startX,deltaY=event.clientY-g.startY;
  if(!g.moved&&Math.hypot(deltaX,deltaY)<3)return;
  g.moved=true;
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
    const dir=g.dir;
    let width=clamp(g.rect.width+(dir.includes("e")?deltaX:0)-
      (dir.includes("w")?deltaX:0),32,8000);
    let height=clamp(g.rect.height+(dir.includes("s")?deltaY:0)-
      (dir.includes("n")?deltaY:0),24,8000);
    if(dir.length===2&&!event.altKey&&g.node.tagName==="IMG"){
      const ratio=g.rect.width/g.rect.height;
      if(Math.abs(width-g.rect.width)>=Math.abs(height-g.rect.height)*ratio)
        height=clamp(width/ratio,24,8000);
      else width=clamp(height*ratio,32,8000);
    }
    next.sx=clamp(Math.round(g.layout.sx*(width/g.rect.width)*1000)/1000,.2,5);
    next.sy=clamp(Math.round(g.layout.sy*(height/g.rect.height)*1000)/1000,.2,5);
    if(dir.includes("w"))next.dx=clamp(Math.round(g.layout.dx+g.rect.width-width),-4000,4000);
    if(dir.includes("n"))next.dy=clamp(Math.round(g.layout.dy+g.rect.height-height),-4000,4000);
  }
  const patch=copy(g.patch);
  patch.layout={...patch.layout,[liveDevice()]:next};
  livePatches.set(g.selector,patch);
  refreshLiveLayoutRules(g.node.ownerDocument);
  // If narrowing a text box creates more lines, grow its reserved height
  // for width-only drags so the text does not cover following content.
  if(g.dir!=="move"&&g.node.matches(LIVE_REFLOW_TEXT)&&
     (g.dir==="e"||g.dir==="w")){
    const needed=Math.ceil(g.node.scrollHeight+2);
    if(Number.isFinite(needed)&&needed>next.reserveHeight&&needed<=5000){
      next.reserveHeight=needed;
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
    refreshLiveLayoutRules(g.node.ownerDocument);
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
    refreshLiveLayoutRules(g.node.ownerDocument);
  }else if(g.moved){
    // Mouseup still generates a click; keep it from navigating to a nearby
    // link or selecting a different element after a drag.
    liveSuppressClickUntil=performance.now()+250;
    recordLiveHistory(g.snapshot);
    status("Moved/resized live-page draft saved · Review changes before publishing");
  }
  renderLiveInspector();syncLiveOverlay();
}
const LIVE_PANE_TAGS="h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,img,section,article,figure,aside";
function renderLiveLayers(){
  const host=$("liveElementList"),doc=$("livePageFrame").contentDocument;
  host.replaceChildren();
  const root=doc?.querySelector("main");
  if(!root)return;
  const filter=$("liveElementSearch").value.toLowerCase().trim();
  const nodes=[...root.querySelectorAll(LIVE_PANE_TAGS)].filter(node=>{
    const css=node.ownerDocument.defaultView.getComputedStyle(node);
    if(css.display==="none"||css.visibility==="hidden")return false;
    const label=node.tagName==="IMG"?
      node.alt||node.getAttribute("src")||"Image":node.textContent||"";
    return !!label.trim()||["SECTION","ARTICLE","FIGURE","ASIDE"].includes(node.tagName);
  });
  const matching=nodes.filter(node=>{
    if(!filter)return true;
    return (node.tagName+" "+node.textContent+" "+(node.alt||"")+" "+
      (node.getAttribute("src")||"")).toLowerCase().includes(filter);
  });
  $("liveLayerCount").textContent=matching.length+"/"+nodes.length;
  for(const node of matching.slice(0,160)){
    const selector=liveSelector(node);if(!selector)continue;
    const button=document.createElement("button");
    button.type="button";button.className="layer";
    button.dataset.liveSelector=selector;
    button.setAttribute("aria-current",String(liveSelected?.node===node));
    const type=document.createElement("span"),label=document.createElement("span");
    type.className="layer-type";type.textContent=node.tagName.toLowerCase();
    label.className="layer-name";
    label.textContent=(node.tagName==="IMG"?
      node.alt||node.getAttribute("src")||"Image":
      node.textContent?.trim()||"Container").replace(/\s+/g," ").slice(0,105);
    button.title=label.textContent;
    button.append(type,label);host.append(button);
  }
  if(!host.childElementCount){
    const none=document.createElement("p");none.className="empty";
    none.textContent=filter?"No matching elements":"No eligible website elements";
    host.append(none);
  }
}
function updateLiveLayerSelection(){
  const selector=liveSelected?.node&&liveSelector(liveSelected.node);
  for(const button of $("liveElementList").querySelectorAll("[data-live-selector]"))
    button.setAttribute("aria-current",String(!!selector&&button.dataset.liveSelector===selector));
}
function clearLiveSelection(){
  removeLiveSnapGuides();
  if(liveSelected?.node?.isConnected)
    liveSelected.node.removeAttribute("data-moon-v2-live-selected");
  liveSelected=null;
  removeLiveOverlay();
  $("copyLiveObject").disabled=true;
  renderLiveInspector();
  updateLiveLayerSelection();
}
function selectLiveElement(node){
  clearLiveSelection();
  const doc=$("livePageFrame").contentDocument;
  if(!node||!doc?.querySelector("main")?.contains(node))return;
  liveSelected={node,page:currentPage};
  node.setAttribute("data-moon-v2-live-selected","");
  $("copyLiveObject").disabled=LIVE_CONTAINER_SET.has(node.tagName);
  renderLiveInspector();syncLiveOverlay();updateLiveLayerSelection();
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
  sheet.textContent='[data-moon-v2-live-selected]{outline:2px solid #287dbb!important;outline-offset:2px!important;cursor:crosshair!important}';
  (doc.head||doc.documentElement).append(sheet);
  doc.addEventListener("keydown",event=>{
    if(workspaceMode!=="live"||liveEditing)return;
    if(event.target.closest?.("input,textarea,select,[contenteditable=true]"))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){
      event.preventDefault();
      liveUndoAction(event.shiftKey);return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="y"){
      event.preventDefault();liveUndoAction(true);return;
    }
    if(event.key==="Escape"){clearLiveSelection();return;}
    if((event.key==="Delete"||event.key==="Backspace")&&liveSelected?.node){
      event.preventDefault();deleteSelectedLiveElement();return;
    }
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    const change=moves[event.key];
    if(change&&liveSelected?.node){
      event.preventDefault();
      const selector=liveSelector(liveSelected.node),layout=liveLayoutFor(selector);
      const step=event.shiftKey?10:1;
      applyLiveLayoutInput("dx",layout.dx+change[0]*step);
      if(change[1])applyLiveLayoutInput("dy",layout.dy+change[1]*step);
      syncLiveOverlay();
    }
  },true);
  doc.addEventListener("pointerdown",event=>{
    if(workspaceMode!=="live"||liveEditing||event.button!==0)return;
    if(event.target.closest?.("#moon-v2-live-overlay"))return;
    // Select and start a move in one pointer gesture. Previously a user had
    // to click, release and then start a *second* drag on the same element.
    const link=event.target.closest?.("a[href]");
    if(link&&!event.altKey)return; // Normal link navigation remains possible.
    const target=liveEventTarget(event);
    if(!target||!doc.querySelector("main")?.contains(target))return;
    if(target!==liveSelected?.node)selectLiveElement(target);
    // A touch tap selects without capturing the pointer, so users can still
    // scroll the responsive webpage. Mouse/pen can drag immediately.
    if(event.pointerType!=="touch")startLiveGesture(event,"move",target);
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
    if(node)selectLiveElement(node);
    else clearLiveSelection();
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
}
async function loadLivePage(page=currentPage,{force=false}={}){
  if(!PAGES.has(page))return;
  if(liveEditing)saveLiveText();
  const serial=++liveSerial;
  $("liveAssetStatus").textContent="Loading GitHub main source…";
  $("liveAssetStatus").classList.remove("has-warning");
  if(liveObserver){liveObserver.disconnect();liveObserver=null;}
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
function startGesture(event,id,dir){
  const obj=lookup(id);
  if(!obj||obj.locked||editingId!==null)return;
  event.preventDefault();event.stopPropagation();
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
    ids,baselines,snapshot:copy(scene),moved:false,aspect:obj.w/obj.h,kind:obj.type};
  $("stage").setPointerCapture(event.pointerId);
}
function gestureMove(event){
  if(!gesture||event.pointerId!==gesture.pointer)return;
  event.preventDefault();
  const g=gesture,dx=Math.round((event.clientX-g.x)/zoom),dy=Math.round((event.clientY-g.y)/zoom);
  if(Math.abs(dx)<2&&Math.abs(dy)<2&&!g.moved)return;
  g.moved=true;
  if(g.dir==="move"){
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
  }
  refreshLiveBoxes();
}
// Return the free-design canvas to its saved state when pointer capture
// or browser focus is unexpectedly lost during a drag/resize.
function cancelCanvasGesture(){
  const pending=gesture;
  if(!pending)return;
  gesture=null;lastTap=null;
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
  return {html:"<!doctype html>\n"+doc.documentElement.outerHTML,resolved,normalized};
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
      patch.kind==="delete"?"Delete element":"Position/style")+
      " · "+livePatchExcerpt(patch);
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
  $("liveElementList").addEventListener("click",event=>{
    const button=event.target.closest?.("button[data-live-selector]");
    if(!button||workspaceMode!=="live")return;
    const node=$("livePageFrame").contentDocument?.querySelector(button.dataset.liveSelector);
    if(!node)return;
    selectLiveElement(node);
    node.scrollIntoView({block:"center",inline:"nearest"});
    syncLiveOverlay();
  });
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
  for(const [field,key,multiplier] of [
    ["liveMoveX","dx",1],["liveMoveY","dy",1],
    ["liveScaleX","sx",.01],["liveScaleY","sy",.01]
  ])$(field).addEventListener("change",event=>
    applyLiveLayoutInput(key,Number(event.target.value)*multiplier));
  $("resetLiveLayout").addEventListener("click",resetSelectedLiveLayout);
  $("liveBringFront").addEventListener("click",()=>setLiveLayer(true));
  $("liveSendBack").addEventListener("click",()=>setLiveLayer(false));
  $("liveResetStack").addEventListener("click",()=>setLiveLayer(false,true));
  $("liveTextReflow").addEventListener("change",event=>
    setLiveReflow(event.target.checked));
  $("liveTextBoxWidth").addEventListener("change",event=>
    setLiveReflowDimension("wrapWidth",event.target.value));
  $("liveTextBoxHeight").addEventListener("change",event=>
    setLiveReflowDimension("reserveHeight",event.target.value));
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
  $("previewLiveEdits").addEventListener("click",async()=>{
    try{
      $("previewFrame").srcdoc=await sourcePreservingHtml(new URL(".",location.href).href);
      $("previewDialog").showModal();
    }catch(error){status(error.message||"Could not prepare original-layout preview");}
  });
  $("exportLiveEdits").addEventListener("click",async()=>{
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
        status("Select a website image first to replace it. Adding new objects belongs to Free design canvas.");
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
    if(!node){select(null);return;}
    startGesture(event,Number(node.dataset.id),event.target.closest(".handle")?.dataset.dir||null);
  });
  $("stage").addEventListener("click",event=>{
    if(event.target.closest("a"))event.preventDefault();
  });
  $("stage").addEventListener("pointermove",gestureMove);
  $("stage").addEventListener("pointerup",endGesture);
  $("stage").addEventListener("pointercancel",endGesture);
  $("stage").addEventListener("lostpointercapture",event=>{
    if(gesture?.pointer===event.pointerId)cancelCanvasGesture();
  });
  window.addEventListener("blur",cancelCanvasGesture);
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
  $("addText").addEventListener("click",()=>add("text",{text:"Double-click to edit text",name:"New text"}));
  $("addShape").addEventListener("click",()=>add("shape",{name:"New shape"}));
  $("addImage").addEventListener("click",()=>$("imageFile").click());
  $("imageFile").addEventListener("change",event=>{
    const file=event.target.files?.[0];event.target.value="";
    insertImageFile(file);
  });
  $("duplicate").addEventListener("click",()=>{
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
          if(item.kind==="delete")continue;
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
    if(editingId!==null){
      if(event.key==="Escape"||(event.key==="Enter"&&(event.metaKey||event.ctrlKey))){
        event.preventDefault();finishTextEdit();
      }
      return;
    }
    if(isTextField(event.target))return;
    if(event.key==="Escape"&&gesture){
      event.preventDefault();cancelCanvasGesture();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){
      event.preventDefault();if(event.shiftKey)redoAction();else undo();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="y"){
      event.preventDefault();redoAction();return;
    }
    if(workspaceMode==="live"){
      // Canvas selection is retained across workspace switches. Shortcuts
      // must never delete/duplicate/move those hidden canvas objects.
      if(event.key==="Escape"){clearLiveSelection();return;}
      if((event.key==="Delete"||event.key==="Backspace")&&liveSelected?.node){
        event.preventDefault();deleteSelectedLiveElement();
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