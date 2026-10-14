/* Direct, accessible visual arranging in Website Studio.
   Structural reordering keeps the website responsive, and editor overlays
   are excluded from published HTML. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  const plus=window.WebsiteStudioPlus;
  if(!api||!plus)return;

  const {state,$,docOf,remember,syncCurrent,selectElement,toast}=api;
  const TEXT_BLOCKS=new Set(["P","H2","H3","H4","H5","H6","BLOCKQUOTE","HR","PRE"]);
  const UNIT_TAGS=new Set(["SECTION","ARTICLE","FIGURE","LI","DIV","ASIDE","P","H2","H3","H4","H5","H6","BLOCKQUOTE","HR","PRE","IMG","TABLE","UL","OL","A"]);
  const ZONES=".reading,.section-head,.hero-copy,.hero-card,.paper-card,.grid-2,.grid-3,.grid-4,.studio-columns,.studio-gallery,.studio-split,.media-shelf,.controls,article,aside,section";
  let overlay=null,drag=null,shownElement=null,anim=0,loadDoc=null;

  function preview(){return docOf()}
  function main(){return preview()?.querySelector("main")}
  function containsMain(node){return !!node&&!!main()?.contains(node)}
  function isHero(section){return section?.tagName==="SECTION"&&section.parentElement===main()&&!!section.querySelector("h1")}
  function fixed(node){return !node||node.tagName==="H1"||isHero(node)||!containsMain(node)}
  function isInline(node){return /^(SPAN|STRONG|EM|B|I|MARK|CODE|SMALL|SUP|SUB)$/.test(node.tagName)}
  function moveUnit(node){
    if(!containsMain(node))return null;
    // Move the text block, leaving its inline formatting intact.
    if(isInline(node)||node.tagName==="A"&&node.closest("p,h1,h2,h3,h4,h5,h6,li")){
      node=node.closest("p,h1,h2,h3,h4,h5,h6,li,figcaption,blockquote")||node;
    }
    if(node.tagName==="FIGCAPTION"&&node.closest("figure"))node=node.closest("figure");
    if(node.tagName==="IMG"&&node.parentElement?.tagName==="FIGURE")node=node.parentElement;
    if(node.tagName==="BUTTON"&&node.closest("article"))node=node.closest("article");
    // Keep the title inside the opening hero in its original location.
    if(node.tagName==="H1"||!UNIT_TAGS.has(node.tagName)||fixed(node))return null;
    return node;
  }
  function eligible(source,target){
    if(!source||!target||source===target||source.contains(target)||target.contains(source))return false;
    if(!containsMain(target)||!target.parentElement||!containsMain(target.parentElement))return false;
    if(source.tagName==="SECTION"&&source.parentElement===main()){
      return target.tagName==="SECTION"&&target.parentElement===main()&&!isHero(target);
    }
    if(source.tagName==="ARTICLE")return target.tagName==="ARTICLE";
    if(source.tagName==="FIGURE")return target.tagName==="FIGURE";
    if(source.tagName==="LI")return target.tagName==="LI"&&
      target.parentElement?.tagName===source.parentElement?.tagName;
    if(source.tagName==="DIV"||source.tagName==="ASIDE"){
      return target.tagName===source.tagName&&
        (target.parentElement===source.parentElement||
          !!target.parentElement?.matches(".studio-columns,.grid-2,.grid-3,.grid-4,.studio-split"));
    }
    if(source.tagName==="IMG")return target.tagName==="IMG";
    if(source.tagName==="TABLE")return target.tagName==="TABLE";
    if(source.tagName==="UL"||source.tagName==="OL")return target.tagName===source.tagName;
    if(source.tagName==="A")return target.tagName==="A"&&!!target.parentElement?.matches(".controls,.site-nav");
    if(TEXT_BLOCKS.has(source.tagName)){
      return TEXT_BLOCKS.has(target.tagName)&&!target.closest("nav")&&
        !!target.parentElement?.closest("main")&&!target.parentElement?.matches("table,ul,ol");
    }
    return source.tagName===target.tagName;
  }
  function validTargets(source){
    const doc=preview();
    if(!doc||!source)return[];
    const candidates=[...doc.querySelectorAll("main section, main article, main figure, main li, main div, main aside, main p, main h2, main h3, main h4, main h5, main h6, main blockquote, main hr, main pre, main img, main table, main ul, main ol, main a")];
    return candidates.filter(node=>eligible(source,node)).filter(node=>{
      const r=node.getBoundingClientRect();
      return r.width>2&&(r.height>1||node.tagName==="HR");
    });
  }
  function dropPosition(source,target,x,y){
    const parent=target.parentElement,style=preview()?.defaultView?.getComputedStyle(parent);
    const display=style?.display||"";
    const flex=display.includes("flex")&&style.flexDirection!=="column";
    const isRow=(display.includes("grid")||flex)&&target.tagName!=="SECTION";
    const box=target.getBoundingClientRect();
    const side=isRow?(x<box.left+box.width/2?"before":"after"):
      (y<box.top+box.height/2?"before":"after");
    if(source.parentElement===parent){
      if(side==="before"&&source.nextElementSibling===target)return null;
      if(side==="after"&&target.nextElementSibling===source)return null;
    }
    return {kind:"relative",target,parent,side,orientation:isRow?"vertical":"horizontal",box};
  }
  function nearestDrop(source,x,y){
    let best=null,distance=Number.POSITIVE_INFINITY;
    const targets=validTargets(source);
    for(const target of targets){
      const box=target.getBoundingClientRect();
      const dx=Math.max(box.left-x,0,x-box.right);
      const dy=Math.max(box.top-y,0,y-box.bottom);
      const d=Math.hypot(dx,dy);
      // Do not jump across the page when the pointer is nowhere near a destination.
      if(d>145)continue;
      const option=dropPosition(source,target,x,y);
      if(!option)continue;
      const priority=d+(target.parentElement===source.parentElement?-6:0);
      if(priority<distance){best=option;distance=priority}
    }
    if(best)return best;

    // Empty columns, sections and cards still accept dropped content.
    if(source.tagName==="SECTION"&&source.parentElement===main())return null;
    const doc=preview();
    const underneath=doc?.elementsFromPoint?.(x,y)||[];
    for(const hit of underneath){
      let zone=hit.closest?.(ZONES);
      while(zone&&containsMain(zone)){
        if(zone!==source&&!source.contains(zone)&&!zone.closest("#studio-move-overlay")){
          const suitable=source.tagName==="ARTICLE"?
            zone.matches(".grid-2,.grid-3,.grid-4,.studio-columns"):
            source.tagName==="FIGURE"?
              zone.matches(".studio-gallery,.pungmul-gallery"):
            TEXT_BLOCKS.has(source.tagName)?
              zone.matches(".reading,.section-head,.hero-copy,.hero-card,article,aside,section"):
            source.tagName==="DIV"?
              zone.matches(".grid-2,.grid-3,.grid-4,.studio-columns,.studio-split"):
              false;
          if(suitable)return {kind:"inside",parent:zone,orientation:"horizontal",box:zone.getBoundingClientRect()};
        }
        zone=zone.parentElement?.closest?.(ZONES);
      }
    }
    return null;
  }
  function selectedUnit(){
    return moveUnit(state.selected);
  }
  function selectionMessage(){
    const node=state.selected,unit=moveUnit(node);
    if(!node)return "Select an item to move it.";
    if(!unit)return "This page title or element stays in its place.";
    if(unit!==node)return "Moving the whole "+unit.tagName.toLowerCase()+" keeps its formatting together.";
    if(unit.tagName==="SECTION")return "Rearrange sections while keeping the page title first.";
    if(unit.tagName==="LI")return "Drag to reorder list items.";
    return "Drag to place this item between other items or in another section.";
  }
  function changeUI(){
    const item=selectedUnit();
    $("moveHelp").textContent=selectionMessage();
    $("moveEarlierDirect").disabled=!item||!previousSibling(item);
    $("moveLaterDirect").disabled=!item||!nextSibling(item);
  }
  function previousSibling(el){
    let n=el?.previousElementSibling;
    while(n&&(n.tagName==="H1"||isHero(n)))n=n.previousElementSibling;
    return n&&eligible(el,n)?n:null;
  }
  function nextSibling(el){
    let n=el?.nextElementSibling;
    while(n&&(n.tagName==="H1"||isHero(n)))n=n.nextElementSibling;
    return n&&eligible(el,n)?n:null;
  }
  function moveSibling(dir){
    const unit=selectedUnit();
    if(!unit)return;
    const other=dir<0?previousSibling(unit):nextSibling(unit);
    if(!other){toast("There is no further item in this group.");return}
    remember();
    if(dir<0)other.before(unit);else other.after(unit);
    syncCurrent();selectElement(unit,true);
    updateOverlay();
    toast("Moved. You can use Undo to put it back.");
  }
  function overlayCSS(doc){
    const style=doc.createElement("style");style.id="studio-move-style";
    style.textContent=[
      "#studio-move-overlay{position:fixed;inset:0;pointer-events:none;z-index:2147483001;font:12px system-ui,sans-serif}",
      "#studio-move-overlay[hidden]{display:none!important}",
      "#studio-move-overlay .studio-move-handle{position:absolute;display:flex;align-items:center;gap:5px;pointer-events:auto;touch-action:none;user-select:none;cursor:grab;background:#2c6347;color:#fff;border:1px solid #17492c;border-radius:6px;padding:6px 9px;font:600 12px system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 8px #0003}",
      "#studio-move-overlay .studio-move-handle:active{cursor:grabbing}",
      "#studio-move-overlay .studio-move-handle:hover,#studio-move-overlay .studio-move-handle:focus-visible{background:#1b5236;outline:2px solid #c6dfca;outline-offset:2px}",
      "#studio-move-overlay .studio-move-marker{position:absolute;border-radius:4px;background:#248559;box-shadow:0 0 0 2px #fff;pointer-events:none;display:none}",
      "#studio-move-overlay .studio-move-marker[data-orientation=horizontal]{height:5px}",
      "#studio-move-overlay .studio-move-marker[data-orientation=vertical]{width:5px}",
      "#studio-move-overlay .studio-move-target{position:absolute;border:3px dashed #218b62;background:rgba(165,218,176,.13);border-radius:6px;display:none;pointer-events:none}",
      "#studio-move-overlay .studio-move-note{position:absolute;background:#fff;color:#285a42;border:1px solid #b1d5be;padding:5px 9px;border-radius:5px;box-shadow:0 2px 6px #0002;display:none;pointer-events:none;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      "#studio-move-overlay .studio-move-ghost{position:absolute;padding:5px 8px;background:#2c6347;color:white;border-radius:6px;white-space:nowrap;pointer-events:none;display:none;box-shadow:0 3px 10px #0002}",
      "@media(pointer:coarse){#studio-move-overlay .studio-move-handle{padding:10px 12px;font-size:13px}}"
    ].join("\n");
    doc.head.appendChild(style);
  }
  function overlayElement(doc,tag,className){
    const el=doc.createElement(tag);el.className=className;return el;
  }
  function createOverlay(doc){
    const root=doc.createElement("div");root.id="studio-move-overlay";root.hidden=true;
    const handle=overlayElement(doc,"button","studio-move-handle");
    handle.type="button";handle.innerHTML='<span aria-hidden="true">⠿</span><span>Move</span>';
    handle.title="Drag to move this item. Use Up/Down arrows to rearrange.";
    handle.setAttribute("aria-label","Move selected item");
    handle.addEventListener("pointerdown",startDrag);
    handle.addEventListener("pointermove",continueDrag);
    handle.addEventListener("pointerup",finishDrag);
    handle.addEventListener("pointercancel",cancelDrag);
    handle.addEventListener("lostpointercapture",()=>{
      if(drag)cancelDrag();
    });
    handle.addEventListener("keydown",event=>{
      if(event.key==="ArrowUp"||event.key==="ArrowLeft"){
        event.preventDefault();moveSibling(-1);
      }else if(event.key==="ArrowDown"||event.key==="ArrowRight"){
        event.preventDefault();moveSibling(1);
      }else if(event.key==="Escape"&&drag){event.preventDefault();cancelDrag()}
    });
    handle.addEventListener("click",event=>{event.stopPropagation();event.preventDefault()});
    root.appendChild(handle);
    const marker=overlayElement(doc,"div","studio-move-marker");root.appendChild(marker);
    const target=overlayElement(doc,"div","studio-move-target");root.appendChild(target);
    const note=overlayElement(doc,"div","studio-move-note");root.appendChild(note);
    const ghost=overlayElement(doc,"div","studio-move-ghost");ghost.textContent="⠿ Moving item";
    root.appendChild(ghost);
    doc.body.appendChild(root);
    overlay={root,handle,marker,target,note,ghost};
  }
  function position(el,coords){
    if(!el||!coords)return;
    el.style.left=coords[0]+"px";el.style.top=coords[1]+"px";
  }
  function updateOverlay(){
    if(!overlay)return;
    const unit=selectedUnit();
    if(!unit||unit.getAttribute("contenteditable")==="true"){
      overlay.root.hidden=true;changeUI();return;
    }
    const doc=preview(),r=unit.getBoundingClientRect();
    const width=doc.defaultView.innerWidth,height=doc.defaultView.innerHeight;
    if(r.width<3||r.height<2||r.bottom<-5||r.right<0||r.top>height||r.left>width){
      overlay.root.hidden=true;return;
    }
    overlay.root.hidden=false;
    const top=clamp(r.top-34,3,Math.max(3,height-40));
    const left=clamp(r.left+10,3,Math.max(3,width-95));
    position(overlay.handle,[left,top]);
    changeUI();
  }
  function queueUpdate(){
    const win=preview()?.defaultView;if(!win||anim)return;
    anim=win.requestAnimationFrame(()=>{anim=0;updateOverlay()});
  }
  function clearTarget(){
    if(!overlay)return;
    overlay.marker.style.display="none";
    overlay.target.style.display="none";
    overlay.note.style.display="none";
  }
  function drawTarget(option,x,y){
    clearTarget();
    if(!option)return;
    if(option.kind==="inside"){
      const b=option.box;
      Object.assign(overlay.target.style,{display:"block",left:b.left+"px",top:b.top+"px",
        width:b.width+"px",height:b.height+"px"});
      overlay.note.textContent="Place inside this area";
    }else{
      const b=option.box;
      const horizontal=option.orientation==="horizontal";
      const side=option.side;
      const top=horizontal?(side==="before"?b.top:b.bottom):b.top;
      const left=horizontal?b.left:(side==="before"?b.left:b.right);
      Object.assign(overlay.marker.style,{
        display:"block",left:left+"px",top:top+"px",
        width:horizontal?Math.max(40,b.width)+"px":"5px",
        height:horizontal?"5px":Math.max(18,b.height)+"px"
      });
      const text=option.target.querySelector?.("h2,h3")?.textContent?.trim()||
        option.target.textContent?.trim()||option.target.tagName.toLowerCase();
      overlay.note.textContent="Place "+side+" "+text.slice(0,34);
    }
    const w=preview().defaultView.innerWidth,h=preview().defaultView.innerHeight;
    overlay.note.style.display="block";
    position(overlay.note,[clamp(x+12,4,Math.max(4,w-242)),clamp(y+13,4,Math.max(4,h-33))]);
  }
  function startDrag(event){
    if(event.button!==0&&event.pointerType!=="touch")return;
    const unit=selectedUnit();
    if(!unit||state.busy)return;
    event.preventDefault();event.stopPropagation();
    drag={unit,doc:preview(),startX:event.clientX,startY:event.clientY,
      active:false,drop:null,pointerId:event.pointerId};
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch(e){}
  }
  function maybeAutoscroll(y){
    const doc=preview(),win=doc?.defaultView;
    if(!win)return;
    const edge=44;
    if(y<edge)win.scrollBy(0,-Math.max(4,Math.round((edge-y)/4)));
    else if(y>win.innerHeight-edge)win.scrollBy(0,Math.max(4,Math.round((y-(win.innerHeight-edge))/4)));
  }
  function continueDrag(event){
    if(!drag||drag.doc!==preview())return;
    event.preventDefault();event.stopPropagation();
    if(!drag.active&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
    drag.active=true;
    overlay.handle.style.cursor="grabbing";
    const x=event.clientX,y=event.clientY;
    drag.drop=nearestDrop(drag.unit,x,y);
    drawTarget(drag.drop,x,y);
    overlay.ghost.style.display="block";
    position(overlay.ghost,[x+16,y-34]);
    maybeAutoscroll(y);
  }
  function finishDrag(event){
    if(!drag)return;
    const t=drag;drag=null;
    if(overlay)overlay.handle.style.cursor="grab";
    if(!t.active||!t.drop||t.doc!==preview()){
      clearTarget();
      if(overlay)overlay.ghost.style.display="none";
      return;
    }
    const option=t.drop,source=t.unit;
    if(option.kind==="relative"){
      if(source===option.target||source.contains(option.target)||source.contains(option.parent))return;
      remember();
      if(option.side==="before")option.target.before(source);
      else option.target.after(source);
    }else if(option.kind==="inside"){
      if(source===option.parent||source.contains(option.parent))return;
      remember();
      option.parent.appendChild(source);
    }
    clearTarget();
    if(overlay)overlay.ghost.style.display="none";
    syncCurrent();
    selectElement(source,true);
    toast("Moved to the new position. Undo is available.");
    queueUpdate();
  }
  function cancelDrag(){
    drag=null;clearTarget();
    if(overlay){overlay.ghost.style.display="none";overlay.handle.style.cursor="grab"}
    queueUpdate();
  }
  function onSelection(){
    if(drag)return;
    queueUpdate();
  }
  function onPreviewReady(){
    overlay=null;drag=null;anim=0;
    const doc=preview();
    if(!doc?.querySelector("main"))return;
    loadDoc=doc;
    overlayCSS(doc);createOverlay(doc);
    doc.addEventListener("scroll",queueUpdate,true);
    doc.defaultView?.addEventListener("resize",queueUpdate,{passive:true});
    changeUI();
    queueUpdate();
  }
  function install(){
    const oldSelected=plus.onSelection,oldReady=plus.onPreviewReady;
    plus.onSelection=node=>{oldSelected?.(node);onSelection()};
    plus.onPreviewReady=()=>{oldReady?.();onPreviewReady()};
    $("moveEarlierDirect").addEventListener("click",()=>moveSibling(-1));
    $("moveLaterDirect").addEventListener("click",()=>moveSibling(1));
    document.querySelectorAll("[data-device]").forEach(btn=>btn.addEventListener("click",queueUpdate));
    document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",queueUpdate));
  }
  window.WebsiteStudioMove={moveEarlier:()=>moveSibling(-1),moveLater:()=>moveSibling(1),refresh:queueUpdate,
    nearestDrop,moveUnit,cancel:cancelDrag};
  install();
})();
