/* Direct-on-page resizing for every selectable page element. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI, plus=window.WebsiteStudioPlus, details=window.WebsiteStudioDetails;
  if(!api||!plus||!details)return;
  const {state,$,docOf,remember,syncCurrent,selectElement,toast}=api;
  const directions=["nw","n","ne","e","se","s","sw","w","border"];
  const properties=["width","height","min-height","max-width","margin-left","margin-top","border-top-width","border-top-style","object-fit","display"];
  let overlay=null,watcher=null,watching=null,drag=null,frameRequested=0,ratioTarget=null;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const line=el=>el&&el.tagName==="HR";
  const image=el=>el&&["IMG","SVG","VIDEO","CANVAS"].includes(el.tagName);
  const screen=()=>{
    const active=document.querySelector("[data-device].is-active")?.dataset.device;
    return active==="phone"?"phone":active==="tablet"?"tablet":"all";
  };
  const element=()=>{
    const d=docOf(),el=state.selected;
    return el&&d?.contains(el)&&d.querySelector("main")?.contains(el)?el:null;
  };
  const rect=el=>el.getBoundingClientRect();
  function css(el){return docOf()?.defaultView?.getComputedStyle(el)}
  function saveOriginal(el,device){
    let map={};
    try{map=JSON.parse(el.getAttribute("data-site-resize-original")||"{}")}catch(e){}
    if(!Object.prototype.hasOwnProperty.call(map,device)){
      const base={};
      for(const p of properties)base[p]=details.getDirectProperty(el,device,p)||"";
      map[device]=base;
      el.setAttribute("data-site-resize-original",JSON.stringify(map));
    }
  }
  function resizeStyles(doc){
    const style=doc.createElement("style");
    style.id="studio-direct-resize-style";
    style.textContent=[
      "#studio-direct-resize-ui{position:fixed;inset:0;pointer-events:none;z-index:2147483000;font:12px system-ui,sans-serif;color:#195066}",
      "#studio-direct-resize-ui[hidden]{display:none!important}",
      "#studio-direct-resize-ui .studio-size-outline{position:absolute;border:2px solid #2784a0;box-sizing:border-box;pointer-events:none}",
      "#studio-direct-resize-ui button{position:absolute;width:18px;height:18px;padding:0;box-sizing:border-box;border:2px solid #27738c;border-radius:5px;background:#fff;box-shadow:0 1px 4px #0003;cursor:nwse-resize;pointer-events:auto;touch-action:none}",
      "#studio-direct-resize-ui button:hover,#studio-direct-resize-ui button:focus-visible{background:#e0f3f6;outline:2px solid #86b8c8;outline-offset:1px}",
      '#studio-direct-resize-ui button[data-handle="n"],#studio-direct-resize-ui button[data-handle="s"]{cursor:ns-resize}',
      '#studio-direct-resize-ui button[data-handle="w"],#studio-direct-resize-ui button[data-handle="e"]{cursor:ew-resize}',
      '#studio-direct-resize-ui button[data-handle="ne"],#studio-direct-resize-ui button[data-handle="sw"]{cursor:nesw-resize}',
      '#studio-direct-resize-ui button[data-handle="border"]{background:#e4f1da;border-color:#528060;cursor:ns-resize}',
      "#studio-direct-resize-ui .studio-size-label{position:absolute;background:#fff;border:1px solid #9fc5cb;color:#154b5b;padding:5px 8px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 8px #0002;pointer-events:none}",
      "#studio-direct-resize-ui .studio-size-tip{position:absolute;background:#183c47;color:white;padding:5px 8px;border-radius:5px;white-space:nowrap;pointer-events:none}",
      "[data-studio-selected]{outline:none!important}",
      "@media(pointer:coarse){#studio-direct-resize-ui button{width:24px;height:24px}}"
    ].join("\n");
    doc.head.appendChild(style);
  }
  function makeOverlay(doc){
    const root=doc.createElement("div");root.id="studio-direct-resize-ui";root.hidden=true;
    const outline=doc.createElement("div");outline.className="studio-size-outline";root.appendChild(outline);
    const handles={};
    for(const dir of directions){
      const h=doc.createElement("button");
      h.type="button";h.dataset.handle=dir;
      const name=dir==="border"?"border or divider thickness":({
        nw:"top-left corner",n:"top edge",ne:"top-right corner",e:"right edge",
        se:"bottom-right corner",s:"bottom edge",sw:"bottom-left corner",w:"left edge"
      })[dir];
      h.setAttribute("aria-label","Resize "+name);
      h.title="Drag to resize "+name+"; use arrow keys for small adjustments";
      h.addEventListener("pointerdown",start);
      h.addEventListener("pointermove",move);
      h.addEventListener("pointerup",end);
      h.addEventListener("pointercancel",cancel);
      h.addEventListener("lostpointercapture",event=>{if(drag)end(event)});
      h.addEventListener("keydown",keys);
      h.addEventListener("dblclick",event=>{event.preventDefault();reset()});
      h.addEventListener("click",event=>{event.stopPropagation();event.preventDefault()});
      root.appendChild(h);handles[dir]=h;
    }
    const label=doc.createElement("div");label.className="studio-size-label";root.appendChild(label);
    const tip=doc.createElement("div");tip.className="studio-size-tip";tip.textContent="Drag blue handles · Shift keeps proportions";root.appendChild(tip);
    doc.body.appendChild(root);
    overlay={root,outline,handles,label,tip};
  }
  function hasBorder(el){
    const style=css(el);if(!style)return false;
    return ["top","right","bottom","left"].some(side=>parseFloat(style.getPropertyValue("border-"+side+"-width"))>0&&style.getPropertyValue("border-"+side+"-style")!=="none");
  }
  function update(){
    if(!overlay)return;
    const el=element();
    if(!el||el.getAttribute("contenteditable")==="true"){overlay.root.hidden=true;return}
    const r=rect(el),w=r.width,h=line(el)?Math.max(3,r.height):r.height;
    const view=docOf()?.defaultView;
    if(!view||!w||(!h&&!line(el))||r.right<0||r.bottom<-16||r.left>view.innerWidth||r.top>view.innerHeight){
      overlay.root.hidden=true;return;
    }
    overlay.root.hidden=false;
    Object.assign(overlay.outline.style,{left:r.left+"px",top:r.top+"px",width:w+"px",height:h+"px"});
    const locations={
      nw:[r.left,r.top],n:[r.left+w/2,r.top],ne:[r.right,r.top],
      e:[r.right,r.top+h/2],se:[r.right,r.top+h],s:[r.left+w/2,r.top+h],
      sw:[r.left,r.top+h],w:[r.left,r.top+h/2],
      border:[r.left+Math.min(34,w*.3),r.top]
    };
    for(const dir of directions){
      const hnd=overlay.handles[dir];
      const visible=dir==="border"?hasBorder(el):(line(el)?["e","w"].includes(dir):true);
      hnd.hidden=!visible;if(!visible)continue;
      hnd.style.left=locations[dir][0]+"px";
      hnd.style.top=locations[dir][1]+"px";
      hnd.style.transform="translate(-50%,-50%)";
    }
    const label=Math.round(w)+" × "+Math.round(r.height)+" px";
    overlay.label.textContent=label;
    overlay.label.style.left=clamp(r.left+w/2,50,Math.max(50,view.innerWidth-50))+"px";
    overlay.label.style.top=clamp(r.top+h+15,3,Math.max(3,view.innerHeight-28))+"px";
    overlay.label.style.transform="translateX(-50%)";
    overlay.tip.hidden=!!drag;
    overlay.tip.style.left=clamp(r.left+4,2,Math.max(2,view.innerWidth-255))+"px";
    overlay.tip.style.top=Math.max(2,r.top-42)+"px";
    $("resizeMeasurements").textContent=label;
    $("resizeModeNote").textContent=line(el)?"Drag line ends or thickness":"Drag on the page";
  }
  function queueUpdate(){
    const view=docOf()?.defaultView;if(!view||frameRequested)return;
    frameRequested=view.requestAnimationFrame(()=>{frameRequested=0;update()});
  }
  function watch(el){
    watcher?.disconnect();watcher=null;watching=el;
    const W=docOf()?.defaultView?.ResizeObserver;
    if(W&&el){watcher=new W(()=>queueUpdate());watcher.observe(el)}
  }
  function session(dir,x,y){
    const el=element();if(!el||state.busy)return null;
    const r=rect(el),style=css(el),d=screen(),parent=el.parentElement;
    const max=Math.max(r.width,Math.min(2800,parent?.getBoundingClientRect().width||r.width||2800));
    remember();saveOriginal(el,d);
    return {el,doc:docOf(),d,dir,x,y,w:r.width,h:r.height,ratio:r.height?r.width/r.height:1,
      lock:!line(el)&&$("keepResizeRatio").checked,
      mx:parseFloat(style?.marginLeft)||0,my:parseFloat(style?.marginTop)||0,
      border:parseFloat(style?.borderTopWidth)||1,max,moved:false,
      initial:Object.fromEntries(properties.map(p=>[p,details.getDirectProperty(el,d,p)||""]))};
  }
  function apply(t,x,y,shift){
    if(!t||t.doc!==docOf()||!t.doc.contains(t.el))return;
    const dx=x-t.x,dy=y-t.y,west=t.dir.includes("w"),east=t.dir.includes("e"),
      north=t.dir.includes("n"),south=t.dir.includes("s"),widthSide=west||east,
      heightSide=north||south;
    const changes={};
    if(t.dir==="border"){
      const v=clamp(Math.round(t.border+dy),0,36);
      changes["border-top-width"]=v+"px";
      changes["border-top-style"]=v?"solid":"none";
    }else if(line(t.el)){
      changes.width=clamp(Math.round(t.w+(west?-dx:dx)),24,Math.min(2800,t.max+600))+"px";
      changes["max-width"]="100%";
      if(west)changes["margin-left"]=Math.round(t.mx+dx)+"px";
    }else{
      let w=t.w+(west?-dx:east?dx:0),h=t.h+(north?-dy:south?dy:0);
      const keep=(t.lock||shift)&&t.ratio>0&&(widthSide||heightSide);
      if(keep){
        if(widthSide&&!heightSide)h=w/t.ratio;
        else if(heightSide&&!widthSide)w=h*t.ratio;
        else{
          const scaleW=w/Math.max(t.w,1),scaleH=h/Math.max(t.h,1);
          const scale=Math.abs(scaleW-1)>Math.abs(scaleH-1)?scaleW:scaleH;
          w=t.w*scale;h=t.h*scale;
        }
      }
      w=clamp(Math.round(w),24,Math.min(2800,t.max+600));
      h=clamp(Math.round(h),10,2200);
      if(widthSide||keep){changes.width=w+"px";changes["max-width"]="100%"}
      if(heightSide||keep){
        if(image(t.el)){changes.height=h+"px";changes["object-fit"]="cover"}
        else changes["min-height"]=h+"px";
      }
      if(west)changes["margin-left"]=Math.round(t.mx+dx)+"px";
      if(north)changes["margin-top"]=Math.round(t.my+dy)+"px";
      if(["A","SPAN","EM","STRONG","MARK"].includes(t.el.tagName))changes.display="inline-block";
    }
    details.setDirectProperties(t.el,t.d,changes);
    t.moved=true;
    update();
  }
  function start(event){
    if(event.button!==0&&event.pointerType!=="touch")return;
    event.preventDefault();event.stopPropagation();
    if(drag)return;
    drag=session(event.currentTarget.dataset.handle,event.clientX,event.clientY);
    if(!drag)return;
    try{event.currentTarget.setPointerCapture(event.pointerId)}catch(e){}
    overlay.tip.hidden=true;
  }
  function move(event){
    if(!drag||drag.dir!==event.currentTarget.dataset.handle)return;
    event.preventDefault();event.stopPropagation();
    apply(drag,event.clientX,event.clientY,event.shiftKey);
  }
  function end(event){
    if(!drag)return;
    const t=drag;drag=null;
    if(t.doc!==docOf())return;
    if(t.moved){syncCurrent();selectElement(t.el);toast("Size changed. Drag again, Undo, or Reset size.")}
    update();
  }
  function cancel(event){
    if(!drag)return;
    const t=drag;drag=null;
    if(t.doc===docOf()){
      details.setDirectProperties(t.el,t.d,t.initial);
      syncCurrent();selectElement(t.el);update();
    }
  }
  function keys(event){
    if(event.key==="Escape"&&drag){event.preventDefault();cancel(event);return}
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    const step=event.shiftKey?10:2;
    const dx=event.key==="ArrowRight"?step:event.key==="ArrowLeft"?-step:0;
    const dy=event.key==="ArrowDown"?step:event.key==="ArrowUp"?-step:0;
    const t=session(event.currentTarget.dataset.handle,0,0);
    if(!t)return;
    apply(t,dx,dy,event.altKey);
    if(t.moved){syncCurrent();selectElement(t.el)}
    update();
  }
  function reset(){
    const el=element();if(!el||state.busy)return;
    const d=screen();let map={};
    try{map=JSON.parse(el.getAttribute("data-site-resize-original")||"{}")}catch(e){}
    if(!map[d]){toast("No resized dimensions to reset on this screen.");return}
    remember();
    details.setDirectProperties(el,d,map[d]);
    delete map[d];
    if(Object.keys(map).length)el.setAttribute("data-site-resize-original",JSON.stringify(map));
    else el.removeAttribute("data-site-resize-original");
    syncCurrent();selectElement(el);update();
    toast("Original dimensions restored.");
  }
  function selectionChanged(el){
    if(!overlay||!el)return;
    watch(el);
    if(ratioTarget!==el){
      $("keepResizeRatio").checked=!!image(el);
      ratioTarget=el;
    }
    $("keepResizeRatio").disabled=!!line(el);
    queueUpdate();
  }
  function pageLoaded(){
    watcher?.disconnect();watcher=null;watching=null;overlay=null;drag=null;frameRequested=0;ratioTarget=null;
    $("resizeMeasurements").textContent="Select an item";
    const d=docOf();if(!d?.querySelector("main"))return;
    resizeStyles(d);makeOverlay(d);
    d.addEventListener("scroll",queueUpdate,true);
    d.defaultView?.addEventListener("resize",queueUpdate,{passive:true});
    if(element())selectionChanged(state.selected);
  }
  function install(){
    const selected=plus.onSelection,ready=plus.onPreviewReady;
    plus.onSelection=node=>{selected?.(node);selectionChanged(node)};
    plus.onPreviewReady=()=>{ready?.();pageLoaded()};
    $("resetDirectSize").addEventListener("click",reset);
    $("keepResizeRatio").addEventListener("change",()=>{
      $("resizeModeNote").textContent=$("keepResizeRatio").checked?"Proportions locked":"Resize freely";
    });
    document.querySelectorAll("[data-device]").forEach(button=>button.addEventListener("click",queueUpdate));
    document.querySelectorAll("[data-tab]").forEach(button=>button.addEventListener("click",queueUpdate));
    $("previewFrame").addEventListener("load",queueUpdate);
  }
  window.WebsiteStudioResize={refresh:queueUpdate,reset,apply};
  install();
})();