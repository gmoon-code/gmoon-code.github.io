/* Visual canvas helpers for Website Studio.
   All editing controls live outside <main> and are stripped from published HTML. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  const plus=window.WebsiteStudioPlus;
  if(!api||!plus)return;
  const {state,docOf,selectElement,mutate,toast}=api;
  const id=name=>document.getElementById(name);
  const properties=[
    "color","background-color","font-family","font-size","font-weight","font-style",
    "letter-spacing","line-height","text-align","text-decoration",
    "border","border-color","border-width","border-style","border-radius",
    "box-shadow","padding","padding-inline","padding-block",
    "margin-top","margin-bottom","margin-left","margin-right","opacity"
  ];
  let copiedStyle=null,overlay=null,hoveredSection=null,previewDoc=null,frame=0;

  function main(){return docOf()?.querySelector("main")}
  function within(node){return !!node&&!!main()?.contains(node)}
  function titleFor(node){
    const tag=node.tagName;
    if(tag==="MAIN")return "Page";
    if(tag==="SECTION")return "Section";
    if(tag==="ARTICLE")return "Card";
    if(tag==="ASIDE")return "Sidebar";
    if(tag==="DIV"){
      if(node.classList.contains("reading"))return "Text area";
      if(node.classList.contains("grid-2")||node.classList.contains("grid-3")||
        node.classList.contains("studio-columns"))return "Columns";
      return "Container";
    }
    if(tag==="P")return "Paragraph";
    if(/^H[1-6]$/.test(tag))return "Heading";
    if(tag==="TD")return "Cell";
    if(tag==="TH")return "Header cell";
    if(tag==="IMG")return "Image";
    if(tag==="FIGURE")return "Figure";
    if(tag==="FIGCAPTION")return "Caption";
    if(tag==="TABLE")return "Table";
    if(tag==="UL"||tag==="OL")return "List";
    if(tag==="LI")return "List item";
    if(tag==="A")return "Link";
    if(tag==="SVG")return "Illustration";
    return tag.toLowerCase();
  }
  const visible=(element,on)=>{if(element)element.hidden=!on};

  // Parent selection is more reliable than repeatedly clicking through nested layouts.
  const path=document.createElement("div");
  path.id="canvasElementPath";
  path.className="canvas-element-path";
  path.setAttribute("aria-label","Selected item and parent elements");
  const target=id("inspectorContent");
  target?.insertBefore(path,target.firstChild);

  const palette=document.createElement("section");
  palette.id="canvasQuickLayout";
  palette.className="canvas-quick-layout";
  palette.innerHTML=[
    '<div class="canvas-quick-head"><strong>Quick layout</strong><span>All screen sizes</span></div>',
    '<p class="micro-help">Choose the width and alignment here, or use the blue resize handles on the page.</p>',
    '<div class="canvas-layout-caption">Width</div>',
    '<div class="canvas-layout-buttons" role="group" aria-label="Selected element width">',
    '<button type="button" data-layout-width="auto">Automatic</button>',
    '<button type="button" data-layout-width="50%">Half</button>',
    '<button type="button" data-layout-width="75%">Three quarters</button>',
    '<button type="button" data-layout-width="100%">Full width</button></div>',
    '<div class="canvas-layout-caption">Placement</div>',
    '<div class="canvas-layout-buttons three" role="group" aria-label="Selected element alignment">',
    '<button type="button" data-layout-align="left">Left</button>',
    '<button type="button" data-layout-align="center">Centre</button>',
    '<button type="button" data-layout-align="right">Right</button></div>',
    '<div id="canvasGridTools" hidden><div class="canvas-layout-caption">Inside a column layout</div>',
    '<div class="canvas-layout-buttons two"><button type="button" data-layout-grid="normal">Normal position</button>',
    '<button type="button" data-layout-grid="full">Across all columns</button></div></div>',
    '<div class="canvas-layout-caption">Space above and below</div>',
    '<div class="canvas-layout-buttons" role="group" aria-label="Selected element spacing">',
    '<button type="button" data-layout-space="0">None</button>',
    '<button type="button" data-layout-space="12">Small</button>',
    '<button type="button" data-layout-space="24">Medium</button>',
    '<button type="button" data-layout-space="40">Large</button></div>',
    '<div class="canvas-layout-caption">Group items</div>',
    '<div class="canvas-layout-buttons two">',
    '<button type="button" id="canvasGroupNext">Group with next</button>',
    '<button type="button" id="canvasUngroup" disabled>Ungroup</button></div>',
    '<div class="canvas-layout-caption">Fine positioning</div>',
    '<p class="micro-help">Shift this item 8 pixels at a time. Check the phone preview when using offsets.</p>',
    '<div class="canvas-layout-buttons">',
    '<button type="button" data-layout-nudge="left">← Left</button>',
    '<button type="button" data-layout-nudge="right">Right →</button>',
    '<button type="button" data-layout-nudge="up">↑ Up</button>',
    '<button type="button" data-layout-nudge="down">Down ↓</button></div>',
    '<div class="canvas-layout-caption">Reuse appearance</div>',
    '<div class="canvas-layout-buttons two">',
    '<button type="button" id="canvasCopyStyle">Copy style</button>',
    '<button type="button" id="canvasPasteStyle" disabled>Paste style</button></div>',
    '<p id="canvasLayoutMessage" class="micro-help" role="status"></p>'
  ].join("");
  target?.insertBefore(palette,target.querySelector(".resize-controls"));
  function selected(){return within(state.selected)?state.selected:null}
  function isText(node){return /^(H[1-6]|P|LI|BLOCKQUOTE|FIGCAPTION|SUMMARY|TD|TH|SPAN|A|STRONG|EM)$/.test(node.tagName)}
  function canWidth(node){return !!node&&!/^(TD|TH|TR|TBODY|THEAD|TFOOT|SPAN|STRONG|EM|A|SUB|SUP)$/.test(node.tagName)}
  function parentIsGrid(node){
    if(!node?.parentElement)return false;
    const style=docOf()?.defaultView?.getComputedStyle(node.parentElement);
    return !!style&&["grid","inline-grid"].includes(style.display);
  }
  function saveProperties(node,values){
    if(!node)return;
    mutate(()=>{
      for(const [name,value] of Object.entries(values)){
        if(value===null)node.style.removeProperty(name);
        else node.style.setProperty(name,value,"important");
      }
    });
    selectElement(node);
  }
  function renderPath(){
    path.replaceChildren();
    const node=selected();
    if(!node)return;
    const nodes=[],root=main();
    for(let n=node;n&&root?.contains(n);n=n.parentElement){
      if(n===root){nodes.unshift(n);break}
      nodes.unshift(n);
    }
    const show=nodes.length>7?[nodes[0],...nodes.slice(-6)]:nodes;
    for(const [index,n] of show.entries()){
      if(index){
        const separator=document.createElement("span");separator.className="canvas-path-separator";
        separator.textContent="›";separator.setAttribute("aria-hidden","true");path.appendChild(separator);
      }
      const button=document.createElement("button");
      button.type="button";button.textContent=titleFor(n);
      button.title="Select "+titleFor(n).toLowerCase();
      button.setAttribute("aria-current",n===node?"true":"false");
      button.disabled=n===root;
      button.addEventListener("click",()=>selectElement(n,true));
      path.appendChild(button);
    }
  }
  function canGroup(node){
    if(!node||!node.nextElementSibling||node.parentElement===main())return false;
    if(!/^(P|H[2-6]|DIV|ARTICLE|ASIDE|FIGURE|BLOCKQUOTE|UL|OL|TABLE|HR|PRE)$/.test(node.tagName))return false;
    if(!/^(MAIN|SECTION|DIV|ARTICLE|ASIDE)$/.test(node.parentElement.tagName))return false;
    return !node.closest("table,ul,ol")&&node.nextElementSibling.tagName!=="SCRIPT";
  }
  function groupWithNext(){
    const node=selected();if(!canGroup(node))return;
    const sibling=node.nextElementSibling;
    const doc=docOf();
    const wrapper=doc.createElement("div");wrapper.className="studio-group";
    mutate(()=>{
      node.before(wrapper);
      wrapper.append(node,sibling);
    });
    selectElement(wrapper,true);
    toast("Items grouped. Select the group to move, resize or style them together.");
  }
  function ungroup(){
    const node=selected();
    const group=node?.closest(".studio-group");
    if(!group||!within(group)||!group.parentElement)return;
    const first=group.firstElementChild;
    mutate(()=>{
      while(group.firstChild)group.parentElement.insertBefore(group.firstChild,group);
      group.remove();
    });
    if(first)selectElement(first,true);
    toast("Group separated. Original items remain in the same order.");
  }
  function refresh(){
    const node=selected();
    renderPath();
    palette.hidden=!node;
    if(!node)return;
    palette.querySelectorAll("[data-layout-width]").forEach(button=>{
      button.disabled=!canWidth(node);
      const device=document.querySelector("[data-device].is-active")?.dataset.device||"desktop";
      const value=node.style.getPropertyValue("--studio-size-"+device+"-width").trim()||
        node.style.getPropertyValue("width").trim();
      button.setAttribute("aria-pressed",button.dataset.layoutWidth===(value||"auto")?"true":"false");
    });
    id("canvasGridTools").hidden=!parentIsGrid(node);
    palette.querySelectorAll("[data-layout-align]").forEach(button=>{
      button.disabled=/^(TD|TH)$/.test(node.tagName);
      const aligned=node.style.getPropertyValue("text-align")||"left";
      button.setAttribute("aria-pressed",button.dataset.layoutAlign===aligned?"true":"false");
    });
    id("canvasPasteStyle").disabled=!copiedStyle;
    id("canvasGroupNext").disabled=!canGroup(node);
    id("canvasUngroup").disabled=!node.closest(".studio-group");
    palette.querySelectorAll("[data-layout-nudge]").forEach(button=>{
      button.disabled=/^(TD|TH|SPAN|STRONG|EM|A|SUB|SUP)$/.test(node.tagName);
    });
    id("canvasLayoutMessage").textContent="Select a parent above to edit its entire layout.";
    updateOverlay();
    updateQuickActions();
  }
  palette.addEventListener("click",event=>{
    const button=event.target.closest("button");
    const node=selected();
    if(!node||!button||button.disabled)return;
    if(button.hasAttribute("data-layout-width")){
      if(!canWidth(node))return;
      const value=button.dataset.layoutWidth;
      const resize=window.WebsiteStudioResize;
      if(!resize?.setDimension)return;
      mutate(()=>resize.setDimension(node,"width",value==="auto"?null:value));
      selectElement(node);
      toast(value==="auto"?"Automatic width restored for this screen.":"Width set to "+value+" on this screen.");
    }
    if(button.hasAttribute("data-layout-align")){
      const alignment=button.dataset.layoutAlign;
      const props={"text-align":alignment};
      if(!isText(node)&&!node.matches("td,th")){
        props["margin-left"]=alignment==="right"||alignment==="center"?"auto":"0px";
        props["margin-right"]=alignment==="left"||alignment==="center"?"auto":"0px";
      }
      saveProperties(node,props);
    }
    if(button.hasAttribute("data-layout-grid")){
      if(!parentIsGrid(node))return;
      saveProperties(node,{"grid-column":button.dataset.layoutGrid==="full"?"1 / -1":null});
    }
    if(button.hasAttribute("data-layout-space")){
      const px=button.dataset.layoutSpace+"px";
      saveProperties(node,{"margin-top":px,"margin-bottom":px});
    }
    if(button.hasAttribute("data-layout-nudge")){
      const currentX=parseFloat(node.style.getPropertyValue("--studio-offset-x"))||0;
      const currentY=parseFloat(node.style.getPropertyValue("--studio-offset-y"))||0;
      const direction=button.dataset.layoutNudge;
      const x=Math.max(-240,Math.min(240,currentX+(direction==="left"?-8:direction==="right"?8:0)));
      const y=Math.max(-240,Math.min(240,currentY+(direction==="up"?-8:direction==="down"?8:0)));
      saveProperties(node,{"--studio-offset-x":x+"px","--studio-offset-y":y+"px",
        "transform":"translate(var(--studio-offset-x),var(--studio-offset-y))"});
    }
  });
  id("canvasGroupNext").addEventListener("click",groupWithNext);
  id("canvasUngroup").addEventListener("click",ungroup);
  id("canvasCopyStyle").addEventListener("click",()=>{
    const node=selected();if(!node)return;
    copiedStyle={};
    for(const property of properties){
      const value=node.style.getPropertyValue(property);
      if(value)copiedStyle[property]=value;
    }
    copiedStyle.classes=["studio-look-plain","studio-look-outlined","studio-look-soft",
      "studio-look-feature","studio-space-compact","studio-space-comfortable",
      "studio-space-airy"].filter(name=>node.classList.contains(name));
    id("canvasPasteStyle").disabled=false;
    toast("Appearance copied. Select another element to paste it.");
  });
  id("canvasPasteStyle").addEventListener("click",()=>{
    const node=selected();if(!node||!copiedStyle)return;
    mutate(()=>{
      for(const [property,value] of Object.entries(copiedStyle)){
        if(property==="classes")continue;
        node.style.setProperty(property,value,"important");
      }
      const presets=["studio-look-plain","studio-look-outlined","studio-look-soft",
        "studio-look-feature","studio-space-compact","studio-space-comfortable","studio-space-airy"];
      node.classList.remove(...presets);
      node.classList.add(...copiedStyle.classes);
    });
    selectElement(node);
    toast("Appearance pasted. Undo restores the previous styling.");
  });

  // Fast action buttons stay within the main Studio toolbar and do not enter a page.
  const quick=id("quickActions");
  const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";
  remove.id="canvasQuickRemove";remove.title="Remove selected element (undo available)";
  remove.className="canvas-quick-danger";
  remove.addEventListener("click",()=>id("deleteBtn")?.click());
  quick?.appendChild(remove);
  const replace=document.createElement("button");replace.type="button";replace.textContent="Replace image";
  replace.id="canvasQuickReplace";
  replace.addEventListener("click",()=>id("replaceImageBtn")?.click());
  quick?.appendChild(replace);
  const add=document.createElement("button");add.type="button";add.textContent="+ Add nearby";
  add.id="canvasQuickAdd";
  add.title="Insert a text block, image, table or layout beside the selected item";
  add.addEventListener("click",()=>{
    if(selected())plus.openLibrary("blocks");
  });
  quick?.appendChild(add);
  const addSection=document.createElement("button");
  addSection.type="button";addSection.textContent="+ Section";
  addSection.id="canvasQuickSection";
  addSection.title="Insert a full section after the current one";
  addSection.addEventListener("click",()=>{
    const section=sectionFor(selected());
    if(!section)return;
    selectElement(section);
    plus.openLibrary("sections");
  });
  quick?.appendChild(addSection);
  function updateQuickActions(){
    const node=selected();
    visible(replace,!!node&&node.tagName==="IMG");
    visible(remove,!!node&&!id("deleteBtn")?.disabled);
    visible(add,!!node);
    visible(addSection,!!sectionFor(node));
  }

  // Two contextual add points in the preview. They never become website content.
  function sectionFor(node){
    const root=main();
    if(!node||!root?.contains(node))return null;
    let section=node.closest("section");
    while(section&&section.parentElement!==root)section=section.parentElement?.closest("section");
    return section&&section.parentElement===root?section:null;
  }
  function installOverlay(){
    const doc=docOf();if(!doc?.body)return;
    const css=doc.createElement("style");css.id="studio-canvas-style";
    css.textContent=[
      '#studio-canvas-overlay{position:fixed;inset:0;pointer-events:none;z-index:2147482700;font:13px system-ui,sans-serif}',
      '#studio-canvas-overlay[hidden]{display:none!important}',
      '#studio-canvas-overlay button{pointer-events:auto;position:absolute;border:1px solid #3f795d;border-radius:20px;',
      'background:#fff;color:#20523b;padding:7px 13px;box-shadow:0 2px 9px #101b1640;',
      'cursor:pointer;font:600 12px system-ui,sans-serif;white-space:nowrap}',
      '#studio-canvas-overlay button:focus-visible{outline:3px solid #186c47;outline-offset:2px}',
      '#studio-canvas-overlay button:hover{background:#e6f4e9}',
      '#studio-canvas-overlay .studio-section-insert{border-style:dashed}'
    ].join("");
    doc.head.appendChild(css);
    const root=doc.createElement("div");root.id="studio-canvas-overlay";
    const sectionButton=doc.createElement("button");
    sectionButton.type="button";sectionButton.textContent="+ Section here";
    sectionButton.className="studio-section-insert";
    sectionButton.title="Add a section immediately after this one";
    sectionButton.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      const section=hoveredSection||sectionFor(selected());
      if(!section||!section.isConnected)return;
      selectElement(section);
      plus.openLibrary("sections");
    });
    const blockButton=doc.createElement("button");
    blockButton.type="button";blockButton.textContent="+ Add content";
    blockButton.className="studio-block-insert";
    blockButton.title="Add text, photo, table or other content after this item";
    blockButton.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      if(selected())plus.openLibrary("blocks");
    });
    root.append(sectionButton,blockButton);doc.body.appendChild(root);
    overlay={root,sectionButton,blockButton};
    const pageMain=main();
    pageMain?.addEventListener("mouseover",event=>{
      const section=sectionFor(event.target);
      if(section&&section!==hoveredSection){hoveredSection=section;queueOverlay()}
    });
    doc.addEventListener("scroll",queueOverlay,true);
    doc.defaultView?.addEventListener("resize",queueOverlay,{passive:true});
    id("previewOuter")?.addEventListener("scroll",queueOverlay,{passive:true});
  }
  function updateOverlay(){
    const doc=docOf(),o=overlay;
    if(!o||previewDoc!==doc||!main())return;
    const section=hoveredSection?.isConnected?hoveredSection:sectionFor(selected());
    const node=selected();
    const win=doc.defaultView;
    const height=win?.innerHeight||0,width=win?.innerWidth||0;
    const showSection=!!section&&section.getAttribute("contenteditable")!=="true";
    const showBlock=!!node&&node!==main()&&node.getAttribute("contenteditable")!=="true";
    visible(o.sectionButton,showSection);
    visible(o.blockButton,showBlock);
    if(showSection){
      const r=section.getBoundingClientRect();
      const inView=r.bottom>=0&&r.bottom<height&&r.width>0;
      o.sectionButton.hidden=!inView;
      if(inView){
        o.sectionButton.style.left=Math.max(8,Math.min(width-142,r.left+16))+"px";
        o.sectionButton.style.top=Math.max(4,Math.min(height-38,r.bottom-17))+"px";
      }
    }
    if(showBlock){
      const r=node.getBoundingClientRect();
      const inView=r.bottom>0&&r.top<height&&r.width>0;
      o.blockButton.hidden=!inView;
      if(inView){
        o.blockButton.style.left=Math.max(8,Math.min(width-138,r.right-136))+"px";
        o.blockButton.style.top=Math.max(4,Math.min(height-37,r.bottom+2))+"px";
      }
    }
  }
  function queueOverlay(){
    const win=docOf()?.defaultView;
    if(!win||frame)return;
    frame=win.requestAnimationFrame(()=>{frame=0;updateOverlay()});
  }
  function onPreviewReady(){
    const doc=docOf();if(!doc)return;
    previewDoc=doc;hoveredSection=null;overlay=null;
    installOverlay();renderPath();queueOverlay();
    updateQuickActions();
  }
  function onSelection(){refresh()}
  window.WebsiteStudioCanvas={onSelection,onPreviewReady};
})();
