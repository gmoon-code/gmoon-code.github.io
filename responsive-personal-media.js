/* Present personal photos in document flow on narrow screens.
   The desktop editor coordinates and original image nodes are preserved. */
(function(){
  "use strict";
  const compact=window.matchMedia("(max-width: 1024px)");
  let record=null;
  function update(){
    const main=document.querySelector("main[data-moon-v2-added-host]");
    if(!main || !main.matches(".pungmul-deep-page, .contact-page"))return;
    const layer=[...main.children].find(node=>node.hasAttribute("data-moon-v2-added-layer"));
    if(!layer)return;
    if(!record){
      const images=[...layer.children].filter(node=>node.matches("img[data-moon-v2-added-id]"));
      if(main.matches(".pungmul-deep-page")){
        if(images.length!==5)return;
        record={main,layer,images,placements:[
          main.querySelector(".pungmul-page-hero"),
          ...Array(4).fill(main.querySelector(".pungmul-performance-grid"))
        ]};
      }else{
        if(images.length!==1)return;
        record={main,layer,images,placements:[main.querySelector(".contact-background")]};
      }
      if(record.placements.some(x=>!x)){record=null;return;}
    }
    const useFlow=(main.matches(".pungmul-deep-page") || compact.matches) && !document.documentElement.classList.contains("moon-free-mode");
    record.images.forEach((img,i)=>{
      const target=useFlow?record.placements[i]:record.layer;
      if(img.parentNode!==target)target.append(img);
      img.classList.toggle("personal-photo-in-flow",useFlow);
    });
    main.classList.toggle("personal-media-flow",useFlow);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",update,{once:true});
  else update();
  if(compact.addEventListener)compact.addEventListener("change",update);
  else compact.addListener(update);
})();