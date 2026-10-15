/* Page Layers panel: semantic, non-destructive visual navigation.
   The panel is outside the public website iframe; only deliberate edits are saved. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  if(!api)return;
  const {state,docOf,selectElement,mutate,toast}=api;
  const $=id=>document.getElementById(id);
  const tree=$("layersTree"),search=$("layersSearch"),status=$("layersStatus"),expand=$("layersExpandBtn");
  if(!tree||!search||!status||!expand)return;
  const tags=new Set(["SECTION","ARTICLE","ASIDE","DIV","P","H1","H2","H3","H4","H5","H6",
    "BLOCKQUOTE","FIGURE","FIGCAPTION","IMG","TABLE","THEAD","TBODY","TFOOT","TR","TD","TH",
    "UL","OL","LI","A","DETAILS","SUMMARY","HR","PRE","SVG","CANVAS","VIDEO","IFRAME"]);
  const containers=new Set(["SECTION","ARTICLE","ASIDE","DIV","FIGURE","TABLE","THEAD","TBODY","TFOOT","TR","UL","OL","LI","DETAILS"]);
  let expanded=new WeakSet(),expandAll=false,lastDocument=null,scheduled=0;

  function main(){return docOf()?.querySelector("main")}
  function editingNode(el){
    return el instanceof (docOf()?.defaultView.Element||Element)&&
      main()?.contains(el)&&tags.has(el.tagName)&&!el.closest("#studio-preview-overlays");
  }
  function descendants(el){
    if(!el)return[];
    return [...el.children].filter(editingNode);
  }
  function summary(el){
    const tag=el.tagName,classes=el.classList;
    if(tag==="SECTION")return "Section";
    if(tag==="ARTICLE")return "Card";
    if(tag==="ASIDE")return "Aside";
    if(tag==="TABLE")return "Table";
    if(tag==="TR")return "Row";
    if(tag==="THEAD")return "Table headers";
    if(tag==="TBODY")return "Table body";
    if(tag==="TFOOT")return "Table foot";
    if(tag==="TD")return "Cell";
    if(tag==="TH")return "Header";
    if(tag==="IMG")return "Image";
    if(tag==="FIGURE")return "Figure";
    if(tag==="FIGCAPTION")return "Caption";
    if(tag==="SVG")return "SVG figure";
    if(tag==="CANVAS")return "Canvas";
    if(tag==="IFRAME")return "Embedded content";
    if(tag==="VIDEO")return "Video";
    if(tag==="UL"||tag==="OL")return "List";
    if(tag==="LI")return "List item";
    if(tag==="DETAILS")return "Accordion";
    if(tag==="SUMMARY")return "Accordion heading";
    if(tag==="A")return "Link";
    if(tag==="BLOCKQUOTE")return "Quote";
    if(tag==="HR")return "Divider";
    if(tag==="PRE")return "Code block";
    if(tag==="DIV"){
      if(classes.contains("reading"))return "Text area";
      if(classes.contains("section-head"))return "Section heading area";
      if(classes.contains("studio-group"))return "Group";
      if(classes.contains("studio-columns")||classes.contains("grid-2")||classes.contains("grid-3"))return "Columns";
      if(classes.contains("studio-gallery")||classes.contains("pungmul-gallery"))return "Gallery";
      return "Container";
    }
    return /^H[1-6]$/.test(tag)?"Heading":tag==="P"?"Paragraph":tag==="H1"?"Page title":tag.toLowerCase();
  }
  function label(el){
    const tag=summary(el);
    let preview="";
    if(el.tagName==="IMG")preview=el.getAttribute("alt")||el.getAttribute("src")?.split("/").pop()||"";
    else if(el.tagName==="SECTION"||el.tagName==="ARTICLE"||el.tagName==="ASIDE"||el.tagName==="DIV"){
      preview=el.querySelector("h1,h2,h3,h4")?.textContent||"";
    }else if(["TABLE","THEAD","TBODY","TFOOT","TR","UL","OL","FIGURE","DETAILS"].includes(el.tagName)){
      preview="";
    }else preview=el.textContent||"";
    preview=preview.replace(/\s+/g," ").trim().slice(0,72);
    return preview?tag+" · "+preview:tag;
  }
  function safeToHide(node){return !!node&&node!==main()&&node.tagName!=="H1"&&
    !(node.tagName==="SECTION"&&node.querySelector("h1"))&&
    !node.classList.contains("page-hero")&&node.tagName!=="TR"&&node.tagName!=="TD"&&node.tagName!=="TH";}
  function toggleVisibility(node){
    if(!safeToHide(node))return;
    mutate(()=>node.classList.toggle("studio-layer-hidden"));
    selectElement(node);
    toast(node.classList.contains("studio-layer-hidden")?
      "Hidden from the public page when published. Select Show to restore it.":
      "Visible again. Undo also restores the previous setting.");
  }
  function openPath(node){
    for(let n=node?.parentElement;n&&main()?.contains(n);n=n.parentElement)expanded.add(n);
  }
  function matches(node,q){
    if(!q)return true;
    if(label(node).toLowerCase().includes(q))return true;
    for(const child of descendants(node)){
      if(matches(child,q))return true;
    }
    return false;
  }
  function hasContentChildren(node){return containers.has(node.tagName)&&descendants(node).length>0}
  function treeRow(node,depth,query){
    const children=descendants(node);
    const hasChildren=hasContentChildren(node);
    const selected=node===state.selected;
    const isOpen=!!query||expandAll||expanded.has(node);
    const row=document.createElement("div");
    row.className="layers-row"+(selected?" is-selected":"")+
      (node.classList.contains("studio-layer-hidden")?" is-hidden":"");
    row.setAttribute("role","treeitem");
    row.setAttribute("aria-level",String(depth+1));
    row.setAttribute("aria-selected",String(selected));
    if(hasChildren)row.setAttribute("aria-expanded",String(isOpen));
    row.style.setProperty("--layers-depth",String(Math.min(depth,7)));
    const toggle=document.createElement("button");
    toggle.className="layers-toggle";toggle.type="button";
    toggle.textContent=hasChildren?(isOpen?"▾":"▸"):"·";
    toggle.title=hasChildren?(isOpen?"Collapse":"Expand"):"No nested elements";
    toggle.setAttribute("aria-label",toggle.title);
    toggle.disabled=!hasChildren;
    toggle.addEventListener("click",()=>{
      if(expanded.has(node))expanded.delete(node);
      else expanded.add(node);
      expandAll=false;render();
    });
    const name=document.createElement("button");
    name.type="button";name.className="layers-name";
    name.textContent=label(node);
    name.title=name.textContent;
    name.addEventListener("click",()=>{
      openPath(node);
      selectElement(node,!node.classList.contains("studio-layer-hidden"));
      render();
    });
    row.append(toggle,name);
    if(safeToHide(node)){
      const visibility=document.createElement("button");
      visibility.type="button";visibility.className="layers-visibility";
      const hidden=node.classList.contains("studio-layer-hidden");
      visibility.textContent=hidden?"Show":"Hide";
      visibility.title=hidden?"Show item on page":"Hide item without deleting it";
      visibility.setAttribute("aria-label",visibility.title);
      visibility.addEventListener("click",()=>toggleVisibility(node));
      row.appendChild(visibility);
    }
    const fragment=document.createDocumentFragment();
    fragment.appendChild(row);
    if(hasChildren&&isOpen){
      const nested=document.createElement("div");nested.className="layers-children";nested.setAttribute("role","group");
      for(const child of children){
        if(query&&!matches(child,query))continue;
        nested.appendChild(treeRow(child,depth+1,query));
      }
      fragment.appendChild(nested);
    }
    return fragment;
  }
  function render(){
    const doc=docOf(),root=main();
    tree.replaceChildren();
    if(!doc||!root){status.textContent="Choose a page to view its elements.";return}
    if(lastDocument!==doc){
      expanded=new WeakSet();expandAll=false;lastDocument=doc;
      for(const section of [...root.children].filter(x=>x.tagName==="SECTION"))expanded.add(section);
    }
    const query=search.value.trim().toLowerCase();
    if(state.selected)openPath(state.selected);
    let count=0;
    for(const el of [...root.children].filter(editingNode)){
      if(query&&!matches(el,query))continue;
      tree.appendChild(treeRow(el,0,query));count++;
    }
    status.textContent=query?
      (count?"Select a result to edit it in the preview.":"No matching elements on this page."):
      "Expand a section to select a heading, text box, table, image, or nested item.";
    expand.textContent=expandAll?"Collapse":"Expand";
  }
  function queueRender(){
    if(scheduled)return;
    scheduled=window.setTimeout(()=>{scheduled=0;render()},75);
  }
  search.addEventListener("input",queueRender);
  expand.addEventListener("click",()=>{
    expandAll=!expandAll;
    expanded=new WeakSet();
    if(!expandAll){
      for(const s of [...(main()?.children||[])].filter(x=>x.tagName==="SECTION"))expanded.add(s);
    }
    render();
  });
  window.WebsiteStudioLayers={onPreviewReady:()=>{
    lastDocument=null;search.value="";render();
  },onSelection:queueRender,onChanged:queueRender};
})();