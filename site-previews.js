/* Optional project preview. Nothing is downloaded until the visitor selects Show preview.
   Only project applications hosted at this website's origin are embedded. */
(() => {
  "use strict";
  const sources={
    story:{path:"/memory-palace-u1-8/?unit=unit-1",title:"The Story Method, live AP Biology Unit 1"},
    methods:{path:"/research-methods/",title:"Research Methods Studio, live research workspace"}
  };
  const panels=document.querySelectorAll("[data-live-preview]");
  for(const panel of panels){
    const config=sources[panel.dataset.livePreview];
    if(!config)continue;
    const open=panel.querySelector("[data-preview-open]");
    const close=panel.querySelector("[data-preview-close]");
    const before=panel.querySelector(".project-preview-before");
    const active=panel.querySelector("[data-preview-active]");
    const stage=panel.querySelector("[data-preview-stage]");
    const sizes=[...panel.querySelectorAll("[data-preview-device]")];
    if(!open||!close||!before||!active||!stage)continue;
    open.hidden=false;
    const chooseSize=device=>{
      stage.dataset.device=device;
      for(const button of sizes)button.setAttribute("aria-pressed",String(button.dataset.previewDevice===device));
    };
    const removePreview=()=>{
      stage.replaceChildren();
      stage.dataset.device="desktop";
      before.hidden=false;
      active.hidden=true;
      chooseSize("desktop");
      open.focus({preventScroll:true});
    };
    open.addEventListener("click",()=>{
      const url=new URL(config.path,location.origin);
      if(url.origin!==location.origin)return;
      const iframe=document.createElement("iframe");
      iframe.title=config.title;
      iframe.loading="lazy";
      iframe.referrerPolicy="same-origin";
      // These two applications are maintained within this website's GitHub Pages origin.
      // Script and same-origin permissions support their published learning interfaces.
      for(const permission of ["allow-scripts","allow-same-origin","allow-forms","allow-popups"]){
        iframe.sandbox.add(permission);
      }
      iframe.src=url.href;
      stage.replaceChildren(iframe);
      before.hidden=true;
      active.hidden=false;
      chooseSize("desktop");
      close.focus({preventScroll:true});
    });
    close.addEventListener("click",removePreview);
    for(const button of sizes){
      button.addEventListener("click",()=>chooseSize(button.dataset.previewDevice==="phone"?"phone":"desktop"));
    }
    panel.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&!active.hidden){event.preventDefault();removePreview()}
    });
  }
  // Disclosures are useful on screen, but their hidden content cannot be
  // expanded on paper. Open them only while printing, then restore the
  // visitor's original open/closed state.
  let printOpened=[];
  window.addEventListener("beforeprint",()=>{
    printOpened=[...document.querySelectorAll(".project-technical-details:not([open])")];
    for(const item of printOpened)item.open=true;
  });
  window.addEventListener("afterprint",()=>{
    for(const item of printOpened)item.open=false;
    printOpened=[];
  });
})();