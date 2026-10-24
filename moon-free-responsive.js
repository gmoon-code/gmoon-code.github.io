/* Restore the source reading order on narrow screens without changing
   free-positioned desktop coordinates. No credentials or external calls. */
(function(){
  "use strict";
  const media=window.matchMedia("(max-width:700px)");
  const PREFIX="moon-free-slot:";
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
    const objects=[...main.querySelectorAll(".moon-free-absolute[data-moon-free-slot]")];
    for(const node of objects){
      const marker=markers.get(node.getAttribute("data-moon-free-slot"));
      if(media.matches&&marker&&marker.parentNode){
        if(node.nextSibling!==marker)marker.parentNode.insertBefore(node,marker);
      }else if(node.parentElement!==layer){
        layer.append(node);
      }
    }
  }
  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",rearrange,{once:true});
  else rearrange();
  if(media.addEventListener)media.addEventListener("change",rearrange);
  else if(media.addListener)media.addListener(rearrange);
})();
