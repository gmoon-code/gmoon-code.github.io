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
  // The desktop performance image is absolute for editing, but visitors need
  // it centred in its actual section even when preceding paragraphs reflow.
  function alignPerformancePhoto(main){
    if(!main?.classList.contains("home-page")||!homePhotos)return;
    const photo=homePhotos.performance;
    if(media.matches||document.documentElement.classList.contains("moon-free-mode")){
      photo.style.removeProperty("top");
      return;
    }
    const section=main.querySelector("#outside-school");
    if(!section)return;
    const sectionBox=section.getBoundingClientRect();
    const mainBox=main.getBoundingClientRect();
    const photoBox=photo.getBoundingClientRect();
    if(!sectionBox.height||!photoBox.height)return;
    const centeredTop=sectionBox.top-mainBox.top+(sectionBox.height-photoBox.height)/2;
    photo.style.setProperty("top",Math.round(centeredTop*100)/100+"px","important");
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
      }else{
        // Keep the published Home introduction before its action links in
        // the DOM at desktop widths while retaining editor-mode geometry.
        const visitorIntro=main.classList.contains("home-page") &&
          node.classList.contains("home-lead") &&
          !document.documentElement.classList.contains("moon-free-mode");
        const copy=visitorIntro?main.querySelector(".home-intro .hero-copy"):null;
        const actions=copy?.querySelector(".controls");
        if(actions){
          if(node.nextSibling!==actions)copy.insertBefore(node,actions);
        }else if(node.parentElement!==layer){
          layer.append(node);
        }
      }
    }
    arrangeHomePhotos(main);
    alignPerformancePhoto(main);
    reserveHeight();
  }
  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",rearrange,{once:true});
  else rearrange();
  if(media.addEventListener)media.addEventListener("change",rearrange);
  else if(media.addListener)media.addListener(rearrange);
  window.addEventListener("resize",()=>{
    reserveHeight();alignPerformancePhoto(document.querySelector("main"));
  });
  // Print styling changes the positions of sections without resizing the
  // browser viewport. Keep the desktop performance image aligned in print.
  const printMedia=window.matchMedia("print");
  const alignAfterMediaChange=()=>alignPerformancePhoto(document.querySelector("main"));
  if(printMedia.addEventListener)printMedia.addEventListener("change",alignAfterMediaChange);
  window.addEventListener("beforeprint",alignAfterMediaChange);
  window.addEventListener("afterprint",alignAfterMediaChange);
  document.addEventListener("load",event=>{
    if(event.target?.tagName==="IMG"){
      reserveHeight();alignPerformancePhoto(document.querySelector("main"));
    }
  },true);
  document.fonts?.ready?.then(()=>{
    reserveHeight();alignPerformancePhoto(document.querySelector("main"));
  });
  // Appearance changes can alter text wrapping and the section's height.
  // Re-centre the visitor image when Light/Dark/System or editor mode changes.
  const appearanceObserver=new MutationObserver(()=>{
    alignPerformancePhoto(document.querySelector("main"));
  });
  appearanceObserver.observe(document.documentElement,{
    attributes:true,attributeFilter:["data-moon-theme","class"]
  });
})();
