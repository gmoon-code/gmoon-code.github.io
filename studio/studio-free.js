/* Free movement in Website Studio.
   The amber handle translates the chosen block without reparenting it.
   Independent desktop/tablet/phone positions prevent desktop adjustments
   from unexpectedly shifting mobile content. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  if(!api)return;
  const {state,docOf,remember,syncCurrent,selectElement,toast}=api;
  const $=id=>document.getElementById(id);
  const device=()=>{
    const n=document.querySelector("[data-device].is-active")?.dataset.device;
    return n==="phone"?"phone":n==="tablet"?"tablet":"desktop";
  };
  const legal=new Set(["SECTION","ARTICLE","ASIDE","DIV","P","H1","H2","H3","H4","H5","H6",
    "BLOCKQUOTE","FIGURE","IMG","VIDEO","SVG","CANVAS","HR","TABLE","UL","OL","LI","PRE","IFRAME"]);
  let overlay=null,frame=0,drag=null,docLoaded=null;
  function main(){return docOf()?.querySelector("main")}
  function eligible(node){
    return !!node&&main()?.contains(node)&&legal.has(node.tagName)&&!state.busy &&
      !node.closest("td,th,thead,tbody,tfoot")&&
      !node.closest("#studio-free-overlay")&&node!==main();
  }
  function block(){
    const el=state.selected;
    if(!el||!main()?.contains(el))return null;
    if(eligible(el))return el;
    // Inline words and captions move with their containing semantic block.
    if(el.closest("td,th"))return null;
    const parent=el.closest("p,h1,h2,h3,h4,h5,h6,li,blockquote,figure,article,section,div");
    return eligible(parent)?parent:null;
  }
  function prop(d,axis){return "--studio-free-"+d+"-"+axis;}
  function number(el,d,axis){
    return Number.parseFloat(el.style.getPropertyValue(prop(d,axis)))||0;
  }
  function snap(value){return $("freeSnap")?.checked?Math.round(value/8)*8:Math.round(value);}
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const reset=document.createElement("section");reset.className="studio-free-settings";
  reset.id="studioFreeSettings";
  reset.hidden=true;
  reset.innerHTML=[
    '<div class="studio-free-heading"><strong>Move without borders</strong><span>Amber handle on the page</span></div>',
    '<p>Drag <strong>Free move</strong> to position the selected block anywhere, including past its original column. Green Move still rearranges the reading order.</p>',
    '<label class="studio-free-snap"><input type="checkbox" id="freeSnap"> Snap to an 8 px grid</label>',
    '<div class="studio-free-coordinates">',
    '<label>Horizontal <input id="freeOffsetX" type="number" step="1" min="-5000" max="5000" aria-label="Free horizontal offset in pixels"></label>',
    '<label>Vertical <input id="freeOffsetY" type="number" step="1" min="-5000" max="5000" aria-label="Free vertical offset in pixels"></label></div>',
    '<div class="studio-free-buttons">',
    '<button type="button" id="freeReset">Reset free position</button>',
    '<button type="button" id="freeToFront">Bring to front</button></div>',
    '<p class="studio-free-note" id="freeScreenNote"></p>'
  ].join("");
  $("inspectorContent")?.insertBefore(reset,$("inspectorContent").querySelector(".resize-controls"));

  function releaseClips(el){
    const root=main(),doc=docOf();
    if(!root||!doc||!root.contains(el))return;
    for(let ancestor=el.parentElement;ancestor&&ancestor!==root;ancestor=ancestor.parentElement){
      const computed=doc.defaultView?.getComputedStyle(ancestor);
      if(!computed)continue;
      if(["hidden","clip"].includes(computed.overflowX)||
        ["hidden","clip"].includes(computed.overflowY)){
        ancestor.classList.add("studio-free-open");
      }
    }
  }
  function cleanClips(el){
    const root=main();if(!root)return;
    for(let ancestor=el.parentElement;ancestor&&ancestor!==root;ancestor=ancestor.parentElement){
      if(ancestor.classList.contains("studio-free-open")&&
        !ancestor.querySelector(".studio-free-element,.studio-unrestricted-size")){
        ancestor.classList.remove("studio-free-open");
      }
    }
  }
  function ensure(el){
    releaseClips(el);
    el.classList.add("studio-free-element");
    el.setAttribute("data-studio-free","true");
    // Convert the old Position-tab offset the first time an element moves freely.
    const t=el.style.getPropertyValue("transform");
    if(t.includes("--studio-offset-x")&&!el.hasAttribute("data-studio-free-converted")){
      const oldX=Number.parseFloat(el.style.getPropertyValue("--studio-offset-x"))||0;
      const oldY=Number.parseFloat(el.style.getPropertyValue("--studio-offset-y"))||0;
      el.style.setProperty(prop("desktop","x"),String(oldX)+"px");
      el.style.setProperty(prop("desktop","y"),String(oldY)+"px");
      el.style.removeProperty("transform");
      el.removeAttribute("data-studio-free-converted");
    }
  }
  function set(el,d,x,y){
    ensure(el);
    el.style.setProperty(prop(d,"x"),clamp(Math.round(x),-5000,5000)+"px");
    el.style.setProperty(prop(d,"y"),clamp(Math.round(y),-5000,5000)+"px");
    el.style.setProperty("overflow","visible");
  }
  function snapshot(el){
    return {css:el.getAttribute("style"),className:el.getAttribute("class"),
      free:el.getAttribute("data-studio-free")};
  }
  function restore(el,copy){
    if(copy.css===null)el.removeAttribute("style");else el.setAttribute("style",copy.css);
    if(copy.className===null)el.removeAttribute("class");else el.setAttribute("class",copy.className);
    if(copy.free===null)el.removeAttribute("data-studio-free");else el.setAttribute("data-studio-free",copy.free);
  }
  function updateControls(){
    const el=block(),d=device();
    reset.hidden=!el;
    if(!el){if(overlay)overlay.root.hidden=true;return;}
    $("freeOffsetX").value=String(Math.round(number(el,d,"x")));
    $("freeOffsetY").value=String(Math.round(number(el,d,"y")));
    $("freeScreenNote").textContent=
      "Editing "+(d==="desktop"?"desktop":d)+
      " position. Other screen sizes retain their own placement.";
    $("freeReset").disabled=!el.classList.contains("studio-free-element");
    update();
  }
  function resetPosition(){
    const el=block();if(!el||state.busy)return;
    const d=device();
    remember();
    el.style.removeProperty(prop(d,"x"));
    el.style.removeProperty(prop(d,"y"));
    if(["desktop","tablet","phone"].every(x=>
      !el.style.getPropertyValue(prop(x,"x"))&&!el.style.getPropertyValue(prop(x,"y")))){
      el.classList.remove("studio-free-element");
      el.removeAttribute("data-studio-free");
      el.style.removeProperty("overflow");
      cleanClips(el);
    }
    syncCurrent();selectElement(el);
    toast("Free position reset on "+d+".");
  }
  $("freeReset").addEventListener("click",resetPosition);
  $("freeToFront").addEventListener("click",()=>{
    const el=block();if(!el)return;
    api.mutate(()=>{
      const z=Number.parseInt(el.style.zIndex,10)||2;
      el.style.setProperty("z-index",String(Math.min(99,z+1)),"important");
      ensure(el);
    });
    selectElement(el);
    toast("Moved forward in the visual stacking order.");
  });
  function inputOffset(){
    const el=block();if(!el)return;
    const d=device();
    const x=Number($("freeOffsetX").value),y=Number($("freeOffsetY").value);
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    api.mutate(()=>set(el,d,x,y));
    selectElement(el);
  }
  $("freeOffsetX").addEventListener("change",inputOffset);
  $("freeOffsetY").addEventListener("change",inputOffset);

  function addOverlay(doc){
    const css=doc.createElement("style");css.id="studio-free-style";
    css.textContent=[
      "#studio-free-overlay{position:fixed;inset:0;z-index:2147483105;pointer-events:none;font:12px system-ui,sans-serif}",
      "#studio-free-overlay[hidden]{display:none!important}",
      "#studio-free-overlay .studio-free-handle{position:absolute;pointer-events:auto;touch-action:none;user-select:none;",
      "background:#8a5521;color:white;border:1px solid #714019;border-radius:6px;padding:7px 11px;cursor:grab;",
      "font:700 12px system-ui,sans-serif;box-shadow:0 2px 10px #0004;white-space:nowrap}",
      "#studio-free-overlay .studio-free-handle:hover,#studio-free-overlay .studio-free-handle:focus-visible{background:#684014;",
      "outline:2px solid #e8cba4;outline-offset:2px}",
      "#studio-free-overlay .studio-free-handle:active{cursor:grabbing}",
      "#studio-free-overlay .studio-free-guides{position:absolute;inset:0;pointer-events:none}",
      "#studio-free-overlay .studio-free-guide{position:absolute;border-top:1px dashed #b17b40;border-left:1px dashed #b17b40;display:none}",
      "#studio-free-overlay .studio-free-guide[data-axis=x]{height:0;left:0;right:0}",
      "#studio-free-overlay .studio-free-guide[data-axis=y]{width:0;top:0;bottom:0}",
      "#studio-free-overlay .studio-free-measure{position:absolute;background:#fff8eb;border:1px solid #bb925f;",
      "padding:4px 7px;border-radius:4px;color:#573519;white-space:nowrap;pointer-events:none;display:none}",
      "@media(pointer:coarse){#studio-free-overlay .studio-free-handle{padding:11px 13px}}"
    ].join("\n");doc.head.appendChild(css);
    const root=doc.createElement("div");root.id="studio-free-overlay";root.hidden=true;
    const handle=doc.createElement("button");
    handle.type="button";handle.className="studio-free-handle";
    handle.textContent="⠿ Free move";
    handle.title="Drag anywhere without the layout drop-target restrictions; arrow keys nudge. Hold Shift for bigger steps.";
    handle.setAttribute("aria-label","Freely move selected block");
    handle.addEventListener("pointerdown",start);
    handle.addEventListener("pointermove",move);
    handle.addEventListener("pointerup",finish);
    handle.addEventListener("pointercancel",cancel);
    handle.addEventListener("lostpointercapture",event=>{if(drag)finish(event)});
    handle.addEventListener("keydown",keys);
    handle.addEventListener("click",event=>{event.preventDefault();event.stopPropagation()});
    const guideX=doc.createElement("div");guideX.className="studio-free-guide";guideX.dataset.axis="x";
    const guideY=doc.createElement("div");guideY.className="studio-free-guide";guideY.dataset.axis="y";
    const measure=doc.createElement("div");measure.className="studio-free-measure";
    root.append(handle,guideX,guideY,measure);
    doc.body.appendChild(root);
    overlay={root,handle,guideX,guideY,measure};
  }
  function update(){
    if(!overlay||!docOf()||docLoaded!==docOf())return;
    const el=block(),doc=docOf();
    if(!el||el.isContentEditable||drag&&drag.doc!==doc){
      overlay.root.hidden=true;return;
    }
    const rect=el.getBoundingClientRect(),vw=doc.defaultView.innerWidth,vh=doc.defaultView.innerHeight;
    if(rect.width<1||rect.height<1||rect.right<0||rect.left>vw||rect.bottom<0||rect.top>vh){
      overlay.root.hidden=true;return;
    }
    overlay.root.hidden=false;
    overlay.handle.style.left=clamp(rect.right-117,4,Math.max(4,vw-125))+"px";
    overlay.handle.style.top=clamp(rect.top-37,4,Math.max(4,vh-43))+"px";
    if(drag?.active){
      const r=el.getBoundingClientRect();
      overlay.guideX.style.display="block";overlay.guideX.style.top=Math.round(r.top)+"px";
      overlay.guideY.style.display="block";overlay.guideY.style.left=Math.round(r.left)+"px";
      overlay.measure.style.display="block";
      overlay.measure.textContent=Math.round(number(el,drag.screen,"x"))+" × "+
        Math.round(number(el,drag.screen,"y"))+" px";
      overlay.measure.style.left=clamp(r.left+8,4,Math.max(4,vw-130))+"px";
      overlay.measure.style.top=clamp(r.bottom+5,3,Math.max(3,vh-32))+"px";
    }else{
      overlay.guideX.style.display="none";overlay.guideY.style.display="none";
      overlay.measure.style.display="none";
    }
  }
  function requestUpdate(){
    const win=docOf()?.defaultView;
    if(!win||frame)return;
    frame=win.requestAnimationFrame(()=>{frame=0;update()});
  }
  function start(event){
    if(event.button!==0&&event.pointerType!=="touch")return;
    const el=block();if(!el||drag||state.busy)return;
    event.preventDefault();event.stopPropagation();
    const d=device(),doc=docOf();
    drag={el,doc,screen:d,pointerId:event.pointerId,x:event.clientX,y:event.clientY,
      scrollX:doc.defaultView.scrollX,scrollY:doc.defaultView.scrollY,
      startX:number(el,d,"x"),startY:number(el,d,"y"),
      original:snapshot(el),active:false};
    try{overlay.handle.setPointerCapture(event.pointerId)}catch(e){}
  }
  function move(event){
    if(!drag||drag.doc!==docOf()||drag.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    const t=drag,win=docOf().defaultView;
    const dx=event.clientX-t.x+win.scrollX-t.scrollX;
    const dy=event.clientY-t.y+win.scrollY-t.scrollY;
    if(!t.active&&Math.hypot(dx,dy)<3)return;
    if(!t.active){remember();t.active=true;}
    set(t.el,t.screen,snap(t.startX+dx),snap(t.startY+dy));
    requestUpdate();
  }
  function finish(event){
    if(!drag)return;
    const t=drag;drag=null;
    if(t.doc!==docOf())return;
    if(t.active){
      syncCurrent();selectElement(t.el);
      toast("Placed freely on "+t.screen+". Use Undo or Reset free position to reverse it.");
    }
    updateControls();
  }
  function cancel(){
    if(!drag)return;
    const t=drag;drag=null;
    if(t.doc===docOf()&&t.active){restore(t.el,t.original);syncCurrent();selectElement(t.el);}
    updateControls();
  }
  function keys(event){
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(event.key==="Escape"&&drag){event.preventDefault();cancel();return;}
    if(!delta)return;
    const el=block();if(!el)return;
    event.preventDefault();event.stopPropagation();
    const step=event.shiftKey?24:event.altKey?1:8,d=device();
    api.mutate(()=>set(el,d,snap(number(el,d,"x")+step*delta[0]),
      snap(number(el,d,"y")+step*delta[1])));
    selectElement(el);
  }
  function applyPreviewScreen(){
    const doc=docOf();if(!doc?.body||doc!==docLoaded)return;
    doc.body.setAttribute("data-studio-screen",device());
    updateControls();requestUpdate();
  }
  function onPreviewReady(){
    const doc=docOf();
    if(!doc?.querySelector("main"))return;
    overlay=null;drag=null;docLoaded=doc;frame=0;
    addOverlay(doc);
    const viewStyle=doc.createElement("style");
    viewStyle.id="studio-free-preview-style";
    const rules=[];
    for(const screen of ["desktop","tablet","phone"]){
      const base='body[data-studio-screen="'+screen+'"] #main ';
      rules.push(base+'.studio-free-element{transform:translate(var(--studio-free-'+screen+'-x,0px),var(--studio-free-'+screen+'-y,0px))!important}');
      rules.push(base+'.studio-unrestricted-size{width:var(--studio-size-'+screen+'-width,auto)!important;max-width:none!important}');
      rules.push(base+'.studio-unrestricted-size:is(img,svg,video,canvas,iframe){height:var(--studio-size-'+screen+'-height,auto)!important}');
      rules.push(base+'.studio-unrestricted-size:not(img):not(svg):not(video):not(canvas):not(iframe){min-height:var(--studio-size-'+screen+'-height,0px)!important}');
    }
    viewStyle.textContent=rules.join("\n");
    doc.head.appendChild(viewStyle);
    doc.body.setAttribute("data-studio-screen",device());
    doc.addEventListener("scroll",requestUpdate,true);
    doc.defaultView?.addEventListener("resize",requestUpdate,{passive:true});
    updateControls();
  }
  function onSelection(){updateControls()}
  document.querySelectorAll("[data-device]").forEach(b=>
    b.addEventListener("click",()=>window.setTimeout(applyPreviewScreen,0)));
  window.WebsiteStudioFree={onPreviewReady,onSelection,requestUpdate,releaseClips,cleanClips,applyPreviewScreen};
})();