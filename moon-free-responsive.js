/* Restore the source reading order on phone and tablet screens without changing
   free-positioned desktop coordinates. No credentials or external calls. */
(function(){
  "use strict";
  const media=window.matchMedia("(max-width:1140px)");
  const PREFIX="moon-free-slot:";
  const detachedPlaceholders=new Map();
  // The homepage stores two photographs in a desktop free-positioned layer.
  // Relocate the original nodes on narrow screens rather than cloning them,
  // preserving their alt text, bytes, and editability in a single source.
  let homePhotos=null;
  function arrangeHomePhotos(main){
    if(!main?.classList.contains("home-page"))return;
    const targetLayer=[...main.children].find(node=>node.hasAttribute?.("data-moon-v2-added-layer"));
    if(!targetLayer)return;
    if(!homePhotos){
      const images=[...targetLayer.children].filter(node=>node.tagName==="IMG"&&node.hasAttribute("data-moon-v2-added-id"));
      if(images.length!==2)return;
      homePhotos={layer:targetLayer,portrait:images[0],performance:images[1]};
    }
    const hero=main.querySelector(".home-intro");
    const outside=main.querySelector(".home-outside-grid");
    if(!hero||!outside)return;
    const mobile=media.matches&&!document.documentElement.classList.contains("moon-free-mode");
    if(mobile){
      if(homePhotos.portrait.parentNode!==hero)hero.append(homePhotos.portrait);
      if(homePhotos.performance.parentNode!==outside)outside.append(homePhotos.performance);
    }else{
      if(homePhotos.portrait.parentNode!==homePhotos.layer)homePhotos.layer.append(homePhotos.portrait);
      if(homePhotos.performance.parentNode!==homePhotos.layer)homePhotos.layer.append(homePhotos.performance);
    }
  }
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
    arrangeHomePhotos(main);
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
