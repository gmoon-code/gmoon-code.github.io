/* Restore the source reading order on narrow screens without changing
   free-positioned desktop coordinates. No credentials or external calls. */
(function(){
  "use strict";
  const media=window.matchMedia("(max-width:700px)");
  const PREFIX="moon-free-slot:";
  const detachedPlaceholders=new Map();
  function reserveHeight(){
    if(media.matches)return;
    const main=document.querySelector("main");
    const layer=main&&[...main.children].find(node=>node.classList.contains("moon-free-layer"));
    if(!layer)return;
    let lowest=0;
    for(const node of layer.children){
      if(!node.classList.contains("moon-free-absolute"))continue;
      const top=parseFloat(node.style.getPropertyValue("--moon-page-y")||node.style.top);
      if(!Number.isFinite(top))continue;
      const height=Math.max(parseFloat(node.style.height)||0,
        parseFloat(node.style.minHeight)||0,node.scrollHeight||0,
        node.getBoundingClientRect().height||0);
      lowest=Math.max(lowest,top+height+32);
    }
    main.style.setProperty("--moon-free-canvas-height",
      Math.min(20064,Math.ceil(Math.max(0,lowest)))+"px");
  }
  function rearrange(){
    const main=document.querySelector("main");
    const layer=main&&[...main.children].find(element=>element.classList.contains("moon-free-layer"));
    if(!layer)return;
    const markers=new Map();
    const walker=document.createTreeWalker(main,NodeFilter.SHOW_COMMENT);
    while(walker.nextNode()){
      const marker=walker.currentNode;
      if(marker.data.startsWith(PREFIX))markers.set(marker.data.slice(PREFIX.length),marker);
    }
    // Keep layout slots for desktop without adding duplicate child nodes
    // to the published mobile reading order.
    for(const placeholder of main.querySelectorAll("[data-moon-free-placeholder]")){
      detachedPlaceholders.set(placeholder.getAttribute("data-moon-free-placeholder"),placeholder);
    }
    for(const [slot,placeholder] of detachedPlaceholders){
      const marker=markers.get(slot);
      if(media.matches)placeholder.remove();
      else if(marker?.parentNode&&placeholder.nextSibling!==marker)
        marker.parentNode.insertBefore(placeholder,marker);
    }
    const objects=[...main.querySelectorAll(".moon-free-absolute[data-moon-free-slot]")];
    for(const node of objects){
      const marker=markers.get(node.getAttribute("data-moon-free-slot"));
      if(media.matches&&marker&&marker.parentNode){
        if(node.nextSibling!==marker)marker.parentNode.insertBefore(node,marker);
      }else if(node.parentElement!==layer){
        layer.append(node);
      }
    }
    reserveHeight();
  }
  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",rearrange,{once:true});
  else rearrange();
  if(media.addEventListener)media.addEventListener("change",rearrange);
  else if(media.addListener)media.addListener(rearrange);
  window.addEventListener("resize",reserveHeight);
  document.addEventListener("load",event=>{
    if(event.target?.tagName==="IMG")reserveHeight();
  },true);
  document.fonts?.ready?.then(reserveHeight);
})();
