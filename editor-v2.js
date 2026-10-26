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
let workspaceMode="live",liveWidth=1160,liveScale=1,liveManualScale=null,liveSelected=null,liveObserver=null,liveSerial=0;
const LIVE_DRAFT_KEY="moon-academic-editor-v2:source:";
let livePatches=new Map(),liveEditing=null;
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
    status("Saved locally · Website unchanged");
  }catch{status("Local storage unavailable · Export JSON to keep your draft");}
}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,400);status("Unsaved canvas changes · Website unchanged");}
function refreshUndo(){
  $("undo").disabled=!history.length;$("redo").disabled=!redo.length;
  const editable=[...selected].some(id=>!lookup(id)?.locked);
  $("duplicate").disabled=!editable;$("remove").disabled=!editable;
  $("front").disabled=!editable;$("back").disabled=!editable;
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
  if(!history.length)return;
  redo.push(copy(scene));restore(history.pop());refreshUndo();save();
}
function redoAction(){
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
  if(file.size>3000000||!["image/png","image/jpeg","image/webp"].includes(file.type)){
    status("Choose PNG, JPEG or WebP under 3 MB");return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
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
  if(mode!=="live")cancelLiveText();
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
  $("workspaceTitle").textContent=isLive?"Live website":"Free design canvas";
  $("workspacePill").textContent=isLive?"Original HTML and CSS · read-only":"Independent objects · staging only";
  $("workspaceExplanation").textContent=isLive?
    "This displays the existing page with its real styles, images and responsive layout. Click a text block or image to select it. Copy creates a separate canvas object and does not change the original.":
    "This canvas is a simplified, independent reconstruction. It does not yet reproduce every original section or responsive rule. Use Live website to verify the real page; only the staging preview can be published.";
  $("workspaceFooter").textContent=isLive?
    "Original page · read-only · Choose Desktop, Tablet or Phone · Click a text block or image to copy into the free canvas":
    "Drag to move · Eight resize handles · Double-click text to edit · Double-click empty canvas to add text · Drop images · Shift-click for multiple selection";
  renderLiveInspector();
  if(isLive)fitLivePage();
  else{
    $("zoom").value=String(Math.round(zoom*100));
    $("zoomValue").textContent=Math.round(zoom*100)+"%";
    fitCanvas();
  }
}
const LIVE_HEIGHTS={desktop:900,tablet:1024,phone:844};
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
function clearLiveSelection(){
  if(liveSelected?.node?.isConnected)
    liveSelected.node.removeAttribute("data-moon-v2-live-selected");
  liveSelected=null;
  $("copyLiveObject").disabled=true;
  renderLiveInspector();
}
function selectLiveElement(node){
  clearLiveSelection();
  const doc=$("livePageFrame").contentDocument;
  if(!node||!doc?.querySelector("main")?.contains(node))return;
  liveSelected={node,page:currentPage};
  node.setAttribute("data-moon-v2-live-selected","");
  $("copyLiveObject").disabled=false;
  renderLiveInspector();
  const label=(node.tagName==="IMG"?node.alt||"image":node.textContent||"text")
    .trim().replace(/\s+/g," ").slice(0,80);
  status("Live element selected: "+label+" · Original website unchanged");
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
  doc.addEventListener("click",event=>{
    if(workspaceMode!=="live")return;
    if(liveEditing)return;
    const link=event.target.closest?.("a[href]");
    if(link){event.preventDefault();}
    const node=event.target.closest?.("h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,img");
    if(node)selectLiveElement(node);
    else clearLiveSelection();
  },true);
  liveObserver=new ResizeObserver(()=>fitLivePage());
  liveObserver.observe(doc.documentElement);
  liveObserver.observe(doc.body);
  doc.fonts?.ready?.then(()=>fitLivePage());
  for(const image of doc.querySelectorAll("img")){
    if(!image.complete)image.addEventListener("load",()=>fitLivePage(),{once:true});
  }
  fitLivePage();
}
function loadLivePage(page=currentPage){
  if(!PAGES.has(page))return;
  ++liveSerial;
  if(liveObserver){liveObserver.disconnect();liveObserver=null;}
  clearLiveSelection();
  const frame=$("livePageFrame");
  frame.onload=()=>bindLiveDocument();
  frame.src=new URL(page,location.href).href;
}
function copySelectedLiveElement(){
  const selection=liveSelected;
  if(!selection||selection.page!==currentPage||!selection.node?.isConnected)return;
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
  ++loadSerial;clearTimeout(saveTimer);lastTap=null;pageImages=[];
  cancelLiveText();
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
    '<a href="'+assetPrefix+'teaching.html">Teaching</a><a href="'+assetPrefix+'about.html">About</a></nav></header>'+
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
async function publishStaging(token){
  const sourceMode=workspaceMode==="live";
  if(!token)throw Error("A GitHub token is required for staging");
  if(sourceMode&&!livePatches.size)throw Error("Make at least one original-layout edit before publishing");
  if(!sourceMode&&!scene.objects.length)throw Error("Import or add objects first");
  const path="editor-v2-previews/"+(sourceMode?"source-":"")+currentPage;
  const content=sourceMode?
    await sourcePreservingHtml("https://gmoon-code.github.io/"):
    standaloneHtml("../");
  const endpoint="https://api.github.com/repos/"+REPO+"/contents/"+path;
  const headers={Accept:"application/vnd.github+json",Authorization:"Bearer "+token,
    "X-GitHub-Api-Version":"2022-11-28"};
  const current=await fetch(endpoint,{headers,cache:"no-store"});
  if(!current.ok&&current.status!==404)throw Error("GitHub access failed ("+current.status+")");
  const info=current.ok?await current.json():null;
  const body={message:"Update visual editor 2 staging preview of "+currentPage,
    content:utf8Base64(content),branch:"main"};
  if(info?.sha)body.sha=info.sha;
  const result=await fetch(endpoint,{method:"PUT",headers:{...headers,"Content-Type":"application/json"},
    body:JSON.stringify(body)});
  if(!result.ok)throw Error("GitHub refused staging publication ("+result.status+")");
  status("Staging preview published · Original website unchanged");
  return "https://gmoon-code.github.io/"+path;
}
function attachEvents(){
  $("page").addEventListener("change",event=>changePage(event.target.value));
  $("liveMode").addEventListener("click",()=>setWorkspaceMode("live"));
  $("designMode").addEventListener("click",()=>setWorkspaceMode("design"));
  $("devicePreview").addEventListener("change",()=>{
    liveManualScale=null;fitLivePage();
  });
  $("reloadLive").addEventListener("click",()=>loadLivePage());
  $("copyLiveObject").addEventListener("click",copySelectedLiveElement);
  $("editLiveText").addEventListener("click",editLiveText);
  $("saveLiveText").addEventListener("click",saveLiveText);
  $("cancelLiveText").addEventListener("click",cancelLiveText);
  $("applyLiveImage").addEventListener("click",applyLiveImage);
  $("revertLiveElement").addEventListener("click",revertLiveElement);
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
  window.addEventListener("resize",()=>{if(workspaceMode==="live")fitLivePage();});
  $("importScene").addEventListener("click",()=>$("sceneFile").click());
  $("sceneFile").addEventListener("change",async event=>{
    const file=event.target.files?.[0];event.target.value="";
    if(!file)return;
    if(file.size>3000000){status("JSON backup exceeds 3 MB");return;}
    try{
      const restored=validateScene(JSON.parse(await file.text()),currentPage);
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
    if(workspaceMode==="live"&&liveSelected?.node?.tagName==="IMG"){
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
    const target=Number(event.target.dataset.target);
    event.target.value="";
    if(!file)return;
    if(file.size>3000000||!["image/png","image/jpeg","image/webp"].includes(file.type)){
      status("Choose PNG, JPEG or WebP under 3 MB");return;
    }
    const reader=new FileReader();
    reader.onload=()=>{
      const obj=lookup(target);if(!obj||obj.type!=="image"||obj.locked)return;
      mutate(()=>{obj.src=String(reader.result);obj.alt=file.name.replace(/\.[^.]+$/,"");});
    };
    reader.readAsDataURL(file);
  });
  $("undo").addEventListener("click",undo);$("redo").addEventListener("click",redoAction);
  $("save").addEventListener("click",save);
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
  $("front").addEventListener("click",()=>mutate(()=>{
    let z=scene.objects.reduce((m,o)=>Math.max(m,o.z),0);
    for(const obj of scene.objects.filter(o=>selected.has(o.id)&&!o.locked))obj.z=++z;
  }));
  $("back").addEventListener("click",()=>mutate(()=>{
    let z=scene.objects.reduce((m,o)=>Math.min(m,o.z),0);
    for(const obj of scene.objects.filter(o=>selected.has(o.id)&&!o.locked))obj.z=--z;
  }));
  $("remove").addEventListener("click",()=>mutate(()=>{
    scene.objects=scene.objects.filter(o=>!selected.has(o.id)||o.locked);
    selected.clear();activeId=null;
  }));
  $("lock").addEventListener("click",()=>mutate(()=>{for(const obj of scene.objects.filter(o=>selected.has(o.id)))obj.locked=!obj.locked;}));
  $("hide").addEventListener("click",()=>mutate(()=>{for(const obj of scene.objects.filter(o=>selected.has(o.id)))obj.hidden=!obj.hidden;}));
  $("resetScene").addEventListener("click",()=>{
    if(!confirm("Discard this page's new-editor draft? The original website will not be affected."))return;
    mutate(()=>{scene.objects=[];scene.nextId=1;selected.clear();activeId=null;});
    save();
  });
  $("exportScene").addEventListener("click",()=>download(currentPage+".canvas.json",JSON.stringify(scene,null,2),"application/json"));
  $("exportHtml").addEventListener("click",()=>download(currentPage.replace(".html","-canvas-preview.html"),standaloneHtml(),"text/html"));
  $("preview").addEventListener("click",()=>{
    $("previewFrame").srcdoc=standaloneHtml();$("previewDialog").showModal();
  });
  $("compare").addEventListener("click",()=>{
    $("originalFrame").src=new URL(currentPage,location.href).href;
    $("sceneFrame").srcdoc=standaloneHtml();
    $("compareDialog").showModal();
  });
  $("closeCompare").addEventListener("click",()=>{
    $("compareDialog").close();
    $("originalFrame").removeAttribute("src");
    $("sceneFrame").removeAttribute("srcdoc");
  });
  $("closePreview").addEventListener("click",()=>$("previewDialog").close());
  $("publish").addEventListener("click",()=>{
    if(workspaceMode==="live"&&!livePatches.size){
      status("Select text or an image and save a live-page edit before publishing");return;
    }
    if(workspaceMode==="design"&&!scene.objects.length){
      status("Import or add objects first");return;
    }
    $("stagePath").textContent="editor-v2-previews/"+
      (workspaceMode==="live"?"source-":"")+currentPage;
    $("githubToken").value="";$("publishDialog").showModal();
  });
  $("publishForm").addEventListener("submit",async event=>{
    if(event.submitter?.value!=="publish")return;
    event.preventDefault();const token=$("githubToken").value.trim();
    $("confirmPublish").disabled=true;
    try{
      const url=await publishStaging(token);
      $("publishDialog").close();$("githubToken").value="";
      status("Staging published · "+url);
    }catch(error){status(error.message||"Staging publication failed");}
    finally{$("confirmPublish").disabled=false;}
  });
  document.addEventListener("keydown",event=>{
    if(editingId!==null){
      if(event.key==="Escape"||(event.key==="Enter"&&(event.metaKey||event.ctrlKey))){
        event.preventDefault();finishTextEdit();
      }
      return;
    }
    if(isTextField(event.target))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="z"){
      event.preventDefault();if(event.shiftKey)redoAction();else undo();return;
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="y"){
      event.preventDefault();redoAction();return;
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