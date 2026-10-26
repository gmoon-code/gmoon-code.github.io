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
let selected=new Set(),activeId=null,history=[],redo=[],zoom=.8,gesture=null,editingId=null,saveTimer=null,loadSerial=0;
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
    if(obj.type==="image"&&!safeImageSource(obj.src))throw Error("Invalid image reference");
    if(obj.type==="text"&&(typeof obj.text!=="string"||obj.text.length>30000))
      throw Error("Invalid text content");
  }
  if(!Number.isInteger(value.nextId)||value.nextId<1||value.nextId>999999)throw Error("Invalid object counter");
  return copy(value);
}
function safeImageSource(value){
  return typeof value==="string"&&(
    /^assets\/[a-zA-Z0-9_./-]+\.(?:png|jpg|jpeg|webp|svg)$/i.test(value)&&!value.includes("..")&&!value.includes("//")||
    /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/i.test(value)&&value.length<4300000);
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
  $("duplicate").disabled=!selected.size;$("remove").disabled=!selected.size;
  $("front").disabled=!selected.size;$("back").disabled=!selected.size;
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
    text:"",src:"",alt:"",font:20,family:"Georgia, serif",color:"#1c2622",
    bg:type==="shape"?"#e5f5e7":"#ffffff",transparent:type!=="shape",
    align:"left",locked:false,hidden:false};
  return Object.assign(common,attrs);
}
function add(type,attrs={}){
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
  node.style.background=obj.transparent?"transparent":obj.bg;
  node.style.color=obj.color;node.style.textAlign=obj.align;
  node.style.fontFamily=obj.family;node.style.fontSize=obj.font+"px";
  node.hidden=!!obj.hidden;
}
function makeSceneElement(obj){
  const node=document.createElement("div");
  node.className="scene-object"+(obj.locked?" locked":"");
  node.dataset.id=String(obj.id);node.dataset.kind=obj.type;
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
    content.textContent=obj.text;
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
    if($(id).type==="color")$(id).value=/^#[0-9a-f]{6}$/i.test(obj[key])?obj[key]:"#ffffff";
    else $(id).value=obj[key]??"";
  }
  const isText=obj.type==="text",isImage=obj.type==="image";
  $("propTransparent").checked=obj.transparent;
  $("replaceImage").hidden=!isImage;
  for(const id of ["textLabel","propText"])$(id).hidden=!isText;
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
  gesture={pointer:event.pointerId,dir:dir||"move",x:event.clientX,y:event.clientY,
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
  if(event.type==="pointercancel"){scene=g.snapshot;render();return;}
  if(g.moved&&JSON.stringify(g.snapshot)!==JSON.stringify(scene)){
    const bottom=Math.max(...scene.objects.map(o=>o.y+o.h+70),900);
    if(bottom>scene.height)scene.height=Math.ceil(bottom);
    // A committed gesture is a single undoable operation; persist it before
    // a possible immediate reload, navigation or accidental tab closure.
    remember(g.snapshot);
  }
  render();
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
function finishTextEdit(){
  if(editingId===null)return;
  const id=editingId;editingId=null;
  const node=$("stage").querySelector('[data-id="'+id+'"]');
  if(!node)return;
  const content=node.querySelector(".scene-content");
  const text=(content?.textContent||"").slice(0,30000);
  mutate(()=>{const obj=lookup(id);if(obj)obj.text=text;});
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
    const next={version:VERSION,page,width:STANDARD_WIDTH,height:Math.max(980,Math.ceil(main.scrollHeight+90)),
      objects:[],nextId:1};
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
        text:text.slice(0,30000),src,alt:image?node.alt||"":"",
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
    render();fitCanvas();save();
    status("Imported "+scene.objects.length+" independent objects · Original website unchanged");
  }catch(error){status("Import stopped · "+(error.message||error));}
}
function changePage(page){
  if(!PAGES.has(page))return;
  ++loadSerial;clearTimeout(saveTimer);
  currentPage=page;
  history=[];redo=[];selected.clear();activeId=null;
  const empty={version:VERSION,page,width:STANDARD_WIDTH,height:1080,objects:[],nextId:1};
  try{
    const raw=localStorage.getItem(NEW_DRAFT+page);
    scene=raw?validateScene(JSON.parse(raw),page):empty;
    status(raw?"Saved canvas restored · Original website unchanged":"New canvas · Use Import page layout");
  }catch{scene=empty;status("Saved canvas invalid · Original website unchanged");}
  render();
  fitCanvas();
}
function esc(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function standaloneHtml(assetPrefix=""){
  const name=$("page").selectedOptions[0]?.textContent||"Website";
  const sorted=[...scene.objects].filter(o=>!o.hidden).sort((a,b)=>a.z-b.z);
  const items=sorted.map(o=>{
    const base='class="item" style="left:'+o.x+'px;top:'+o.y+'px;width:'+o.w+
      'px;height:'+o.h+'px;z-index:'+o.z+';'+
      (o.transparent?'background:transparent;':'background:'+o.bg+';');
    if(o.type==="image"){
      const source=safeImageSource(o.src)?o.src:"";
      const path=source.startsWith("assets/")?assetPrefix+source:source;
      return '<figure '+base+'"><img src="'+esc(path)+
        '" alt="'+esc(o.alt)+'" loading="lazy"></figure>';
    }
    if(o.type==="shape")return '<div aria-hidden="true" '+base+'"></div>';
    return '<section '+base+'font-family:'+esc(o.family)+';font-size:'+o.font+
      'px;color:'+esc(o.color)+';text-align:'+esc(o.align)+'">'+esc(o.text)+'</section>';
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
    '@media(max-width:700px){.canvas{height:auto;width:100%;display:flex;flex-direction:column;gap:16px;padding:24px 18px}'+
    '.item{position:static!important;width:100%!important;height:auto!important;max-width:100%!important;min-height:24px}'+
    '.item img{width:100%;height:auto;max-height:500px;object-fit:contain}}'+
    '</style></head><body><header class="site-bar"><strong>Ye Eun Moon</strong>'+
    '<nav><a href="../index.html">Home</a><a href="../research.html">Research</a>'+
    '<a href="../teaching.html">Teaching</a><a href="../about.html">About</a></nav></header>'+
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
  if(!token||!scene.objects.length)throw Error("Add content and provide a GitHub token");
  const path="editor-v2-previews/"+currentPage;
  const endpoint="https://api.github.com/repos/"+REPO+"/contents/"+path;
  const headers={Accept:"application/vnd.github+json",Authorization:"Bearer "+token,
    "X-GitHub-Api-Version":"2022-11-28"};
  const current=await fetch(endpoint,{headers,cache:"no-store"});
  if(!current.ok&&current.status!==404)throw Error("GitHub access failed ("+current.status+")");
  const info=current.ok?await current.json():null;
  const body={message:"Update visual editor 2 staging preview of "+currentPage,
    // Staging is nested one level below the GitHub Pages repository root.
    // Rebase root-relative project assets without changing the local canvas.
    content:utf8Base64(standaloneHtml("../")),branch:"main"};
  if(info?.sha)body.sha=info.sha;
  const result=await fetch(endpoint,{method:"PUT",headers:{...headers,"Content-Type":"application/json"},
    body:JSON.stringify(body)});
  if(!result.ok)throw Error("GitHub refused staging publication ("+result.status+")");
  status("Staging preview published · Original website unchanged");
  return "https://gmoon-code.github.io/"+path;
}
function attachEvents(){
  $("page").addEventListener("change",event=>changePage(event.target.value));
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
  $("sourcePage").addEventListener("click",()=>window.open(new URL(currentPage,location.href).href,"_blank","noopener"));
  $("zoom").addEventListener("input",event=>{zoom=Number(event.target.value)/100;$("zoomValue").textContent=Math.round(zoom*100)+"%";render();});
  $("fitCanvas").addEventListener("click",fitCanvas);
  $("stage").addEventListener("pointerdown",event=>{
    if(editingId!==null)return;
    const node=event.target.closest(".scene-object");
    if(!node){select(null);return;}
    startGesture(event,Number(node.dataset.id),event.target.closest(".handle")?.dataset.dir||null);
  });
  $("stage").addEventListener("pointermove",gestureMove);
  $("stage").addEventListener("pointerup",endGesture);
  $("stage").addEventListener("pointercancel",endGesture);
  $("stage").addEventListener("dblclick",event=>{
    const node=event.target.closest(".scene-object");
    if(node)beginTextEdit(Number(node.dataset.id));
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
      const obj=lookup(activeId);if(!obj)return;
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
        if(prop==="bg")obj.transparent=false;
        scene.height=Math.max(scene.height,obj.y+obj.h+70);
      });
    });
  }
  $("propTransparent").addEventListener("change",event=>{
    const obj=lookup(activeId);if(!obj)return;
    const transparent=event.target.checked;
    mutate(()=>{obj.transparent=transparent;});
  });
  $("replaceImage").addEventListener("click",()=>{
    if(lookup(activeId)?.type!=="image")return;
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
      const obj=lookup(target);if(!obj||obj.type!=="image")return;
      mutate(()=>{obj.src=String(reader.result);obj.alt=file.name.replace(/\.[^.]+$/,"");});
    };
    reader.readAsDataURL(file);
  });
  $("undo").addEventListener("click",undo);$("redo").addEventListener("click",redoAction);
  $("save").addEventListener("click",save);
  $("addText").addEventListener("click",()=>add("text",{text:"Double-click to edit text",name:"New text"}));
  $("addShape").addEventListener("click",()=>add("shape",{name:"New shape"}));
  $("addImage").addEventListener("click",()=>$("imageFile").click());
  $("imageFile").addEventListener("change",async event=>{
    const file=event.target.files?.[0];event.target.value="";
    if(!file)return;
    if(file.size>3000000||!["image/png","image/jpeg","image/webp"].includes(file.type)){
      status("Choose PNG, JPEG or WebP under 3 MB");return;
    }
    const reader=new FileReader();
    reader.onload=()=>add("image",{src:String(reader.result),alt:file.name.replace(/\.[^.]+$/,""),name:file.name,w:340,h:260});
    reader.readAsDataURL(file);
  });
  $("duplicate").addEventListener("click",()=>{
    const source=scene.objects.filter(o=>selected.has(o.id));if(!source.length)return;
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
    for(const obj of scene.objects.filter(o=>selected.has(o.id)))obj.z=++z;
  }));
  $("back").addEventListener("click",()=>mutate(()=>{
    let z=scene.objects.reduce((m,o)=>Math.min(m,o.z),0);
    for(const obj of scene.objects.filter(o=>selected.has(o.id)))obj.z=--z;
  }));
  $("remove").addEventListener("click",()=>mutate(()=>{
    scene.objects=scene.objects.filter(o=>!selected.has(o.id));selected.clear();activeId=null;
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
  $("closePreview").addEventListener("click",()=>$("previewDialog").close());
  $("publish").addEventListener("click",()=>{
    if(!scene.objects.length){status("Import or add objects first");return;}
    $("stagePath").textContent="editor-v2-previews/"+currentPage;
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