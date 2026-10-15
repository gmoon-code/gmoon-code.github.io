/* Website Studio Plus: visual templates, reusable photographs, styles and safe draft recovery. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  if(!api) return;
  const {state,$,docOf,activeDraft,remember,syncCurrent,renderSections,selectElement,mutate,toast,github,ensureDraft,renderPages,updateStatus}=api;
  const IMAGE_RE=/\.(?:jpe?g|png|webp|gif|svg)$/i;
  const STORAGE_DB="ye-eun-moon-website-studio";
  const STORAGE_VERSION=2;
  const COLORS={
    soft:{yellow:["#F5E6A8","#FCF9ED","#C6AD58"],green:["#CEE5C1","#F4F9F0","#8FAE80"],blue:["#C8DDF1","#F3F8FC","#82A6C7"],magenta:["#EACBE3","#FBF4F9","#B58BAE"]},
    subtle:{yellow:["#F8F0D2","#FDFBF4","#D5C596"],green:["#E5F0DF","#FAFCF8","#ACBEA6"],blue:["#E4EEF8","#F9FBFD","#AEC6DA"],magenta:["#F3E5EF","#FDF8FB","#D0B5C7"]},
    earthy:{yellow:["#E8D9B4","#F9F5EA","#BEA977"],green:["#D1DEC5","#F5F8F0","#91AC87"],blue:["#C6D9DF","#F2F8F9","#92B3C0"],magenta:["#E5CCD7","#FAF4F7","#BC99AA"]},
    crisp:{yellow:["#F2E09A","#FCFAEE","#C3AC56"],green:["#C3DFAE","#F4F9F0","#89B17A"],blue:["#BDD8F0","#F3F7FC","#7EA6CE"],magenta:["#E6C2E0","#FCF4FA","#B687B1"]}
  };
  const SETTINGS_DEFAULT={palette:"soft",font:"times",headingFont:"same",width:1120,readingWidth:1040,corners:4,bodySize:16,headingScale:100,lineHeight:1.55,pageBackground:"#ffffff"};
  const FACE={
    times:'"Times New Roman",Times,serif',
    georgia:'Georgia,"Times New Roman",serif',
    cambria:'Cambria,Georgia,serif',
    garamond:'Garamond,Georgia,serif',
    palatino:'"Palatino Linotype",Palatino,serif',
    arial:'Arial,Helvetica,sans-serif',
    verdana:'Verdana,Geneva,sans-serif',
    trebuchet:'"Trebuchet MS",Arial,sans-serif',
    mono:'Consolas,"Courier New",monospace',
    system:'system-ui,-apple-system,"Segoe UI",sans-serif'
  };
  let prefs={...SETTINGS_DEFAULT},filter="all",photoCache=null,saveTimer=null,dbPromise=null;
  let navigation={version:1,items:[]},navDirty=false;
  let recoveryAvailable=true,wasLoaded=false,inlineTarget=null,resizeSession=null;

  const layouts=[
    {id:"intro-section",category:"sections",title:"Introduction",desc:"A clear heading and a thoughtful short introduction.",bars:1},
    {id:"split-section",category:"sections",title:"Words beside a photo",desc:"Story or explanation next to a photograph.",bars:2},
    {id:"cards-section",category:"sections",title:"Three feature cards",desc:"Introduce related projects or areas of work.",bars:3},
    {id:"gallery-section",category:"sections",title:"Photo gallery",desc:"Arrange photographs with captions.",bars:3},
    {id:"faq-section",category:"sections",title:"Questions and answers",desc:"Expandable answers for common questions.",bars:2},
    {id:"timeline-section",category:"sections",title:"Timeline",desc:"Share a few steps in a journey or project.",bars:3},
    {id:"quote-section",category:"sections",title:"Reflection or quotation",desc:"A quiet, prominent passage of text.",bars:1},
    {id:"contact-section",category:"sections",title:"Contact",desc:"A warm closing and a link for getting in touch.",bars:2},
    {id:"heading",category:"blocks",title:"Heading",desc:"A title within a section.",bars:1},
    {id:"paragraph",category:"blocks",title:"Paragraph",desc:"A little more explanation.",bars:1},
    {id:"image",category:"blocks",title:"Photograph",desc:"Use an existing image or add a new one.",bars:1},
    {id:"card",category:"blocks",title:"Content card",desc:"A title and a short description.",bars:2},
    {id:"columns",category:"blocks",title:"Two columns",desc:"Place related information side by side.",bars:2},
    {id:"gallery",category:"blocks",title:"Small gallery",desc:"A row of photographs with captions.",bars:3},
    {id:"list",category:"blocks",title:"List",desc:"Several related points.",bars:3},
    {id:"table",category:"blocks",title:"Editable table",desc:"A table whose individual cells and rows can be edited.",bars:3},
    {id:"callout",category:"blocks",title:"Highlighted note",desc:"A gentle note that is easy to find.",bars:1},
    {id:"button",category:"blocks",title:"Link / button",desc:"Lead visitors to a page or resource.",bars:1},
    {id:"divider",category:"blocks",title:"Divider",desc:"Separate neighboring ideas.",bars:1},
    {id:"spacer",category:"blocks",title:"Extra space",desc:"Give part of the page more breathing room.",bars:1}
  ];
  const templates={
    "intro-section":'<section class="section studio-intro-section"><div class="section-head"><h2>A little introduction</h2><p>Write two or three sentences to introduce this part of your work.</p></div><div class="reading"><p>You can share a specific example, a useful detail, or a reflection here.</p></div></section>',
    "split-section":'<section class="section"><div class="section-head"><h2>A story and a photograph</h2></div><div class="studio-split"><div><h3>What I wanted to share</h3><p>Write about a moment, project, or idea. Click any text to edit it.</p></div><figure class="studio-empty-photo"><div class="studio-photo-target">Choose a photo using My photos</div><figcaption>Write a caption if you wish.</figcaption></figure></div></section>',
    "cards-section":'<section class="section"><div class="section-head"><h2>Things I have been working on</h2><p>Introduce a few related areas without repeating the full details from other pages.</p></div><div class="grid-3"><article class="paper-card"><h3>First item</h3><p>Share what it involves.</p></article><article class="paper-card"><h3>Second item</h3><p>Explain what visitors can learn here.</p></article><article class="paper-card"><h3>Third item</h3><p>Add a useful description.</p></article></div></section>',
    "gallery-section":'<section class="section"><div class="section-head"><h2>Photographs</h2><p>A few moments I would like to share.</p></div><div class="studio-gallery"><figure class="studio-empty-photo"><div class="studio-photo-target">Add a photo</div><figcaption>Caption</figcaption></figure><figure class="studio-empty-photo"><div class="studio-photo-target">Add another photo</div><figcaption>Caption</figcaption></figure><figure class="studio-empty-photo"><div class="studio-photo-target">Add another photo</div><figcaption>Caption</figcaption></figure></div></section>',
    "faq-section":'<section class="section studio-faq"><div class="section-head"><h2>Questions and answers</h2><p>Some things visitors may want to know.</p></div><details open><summary>A question people often ask</summary><p>A helpful, straightforward answer.</p></details><details><summary>Another question</summary><p>You can explain this in a few sentences.</p></details></section>',
    "timeline-section":'<section class="section"><div class="section-head"><h2>How this developed</h2></div><ol class="studio-timeline"><li><strong>The beginning</strong><p>How the idea began.</p></li><li><strong>What came next</strong><p>What you learned or tried.</p></li><li><strong>Where it is now</strong><p>What you are working on today.</p></li></ol></section>',
    "quote-section":'<section class="section studio-reflection"><div class="section-head"><h2>Something that stayed with me</h2></div><blockquote>Write a reflection or a short quotation you would like to share.</blockquote><p>Optional context or attribution.</p></section>',
    "contact-section":'<section class="section"><div class="section-head"><h2>Get in touch</h2><p>Thank you for taking the time to look around. You are welcome to get in touch.</p></div><div class="controls"><a class="control" href="mailto:gracem.0691@gmail.com">Send me an email</a></div></section>',
    heading:'<h3>A new heading</h3>',
    paragraph:'<p>Write a little more here.</p>',
    card:'<article class="paper-card"><h3>New item</h3><p>Add a clear and helpful description.</p></article>',
    columns:'<div class="studio-columns" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;--studio-cols:2"><div class="paper-card"><h3>First column</h3><p>Write here.</p></div><div class="paper-card"><h3>Second column</h3><p>Write here too.</p></div></div>',
    gallery:'<div class="studio-gallery"><figure class="studio-empty-photo"><div class="studio-photo-target">Choose a photo</div><figcaption>Caption</figcaption></figure><figure class="studio-empty-photo"><div class="studio-photo-target">Choose a photo</div><figcaption>Caption</figcaption></figure></div>',
    list:'<ul class="studio-reading-list"><li>First point</li><li>Another point</li><li>A final point</li></ul>',
    table:'<div class="studio-table-wrap" role="region" aria-label="Editable data table" tabindex="0"><table class="studio-editable-table"><thead><tr><th scope="col">First heading</th><th scope="col">Second heading</th><th scope="col">Third heading</th></tr></thead><tbody><tr><td>First value</td><td>Second value</td><td>Third value</td></tr><tr><td>Another value</td><td>Another value</td><td>Another value</td></tr></tbody></table></div>',
    callout:'<aside class="callout"><p>A brief note that deserves a little extra attention.</p></aside>',
    button:'<a class="control" href="index.html">Open another page</a>',
    divider:'<hr class="studio-rule">',
    spacer:'<div class="studio-space" aria-hidden="true"></div>'
  };

  function createSnippet(doc,html){
    const div=doc.createElement("div");
    div.innerHTML=html;
    return div.firstElementChild;
  }
  function addTemplate(id){
    if(id==="image"){api.openImagePicker(false);return}
    const doc=docOf(),main=doc?.querySelector("main");
    const definition=layouts.find(x=>x.id===id);
    if(!main||!definition)return;
    const node=createSnippet(doc,templates[id]);
    if(!node)return;
    remember();
    const selected=state.selected;
    if(definition.category==="sections"){
      const parentSection=selected?.closest("section");
      const top=parentSection?.parentElement===main?parentSection:null;
      if(top)top.after(node);else main.appendChild(node);
    } else {
      let container=null;
      if(selected?.tagName==="SECTION")container=selected.querySelector(".reading,.grid-2,.grid-3,.studio-columns,.studio-gallery")||selected;
      if(container)container.appendChild(node);
      else if(selected&&selected.parentElement&&main.contains(selected))selected.after(node);
      else (main.querySelector("section:last-of-type")||main).appendChild(node);
    }
    syncCurrent();selectElement(node,true);
    $("blockLibraryDialog").close();
    toast("Added "+definition.title.toLowerCase()+". Click the words or choose a photo to make it yours.");
  }
  function renderLibrary(){
    const container=$("blockLibraryItems");container.replaceChildren();
    const query=$("blockSearch").value.trim().toLowerCase();
    const matches=layouts.filter(x=>(filter==="all"||filter===x.category)&&
      (x.title+" "+x.desc).toLowerCase().includes(query));
    if(!matches.length){
      const message=document.createElement("p");message.className="micro-help";
      message.textContent="No matches. Try a shorter search.";container.appendChild(message);
    }
    for(const item of matches){
      const card=document.createElement("button");
      card.type="button";card.className="library-card";card.title="Add "+item.title;
      const sketch=document.createElement("div");sketch.className="library-preview";
      for(let n=0;n<item.bars;n++)sketch.appendChild(document.createElement("span"));
      const title=document.createElement("strong");title.textContent=item.title;
      const description=document.createElement("div");description.className="library-desc";
      description.textContent=item.desc;
      card.append(sketch,title,description);
      card.addEventListener("click",()=>addTemplate(item.id));
      container.appendChild(card);
    }
  }
  function openLibrary(category="all"){
    filter=category;$("blockSearch").value="";
    document.querySelectorAll("[data-block-filter]").forEach(button=>button.classList.toggle("is-active",button.dataset.blockFilter===filter));
    renderLibrary();$("blockLibraryDialog").showModal();$("blockSearch").focus();
  }
  function safeImageDescription(src){
    const name=String(src).split("/").pop().split("?")[0].replace(/\.[a-z0-9]+$/i,"").replace(/[-_0-9]+/g," ").trim();
    return name.length>3?name.charAt(0).toUpperCase()+name.slice(1):"Describe this image";
  }
  function usePhoto(src,path){
    const doc=docOf(),main=doc?.querySelector("main");if(!main)return;
    const original=state.selected;let image;
    remember();
    if(original?.tagName==="IMG"){image=original}
    else if(original?.closest("figure")&&!original.closest("figure").querySelector("img")){
      const figure=original.closest("figure");
      figure.querySelector(".studio-photo-target")?.remove();
      figure.classList.remove("studio-empty-photo");
      image=doc.createElement("img");
      image.style.width="100%";image.style.height="auto";
      figure.insertBefore(image,figure.firstChild);
    }else{
      const figure=doc.createElement("figure");
      figure.className="studio-inserted-photo";
      image=doc.createElement("img");
      image.style.maxWidth="100%";image.style.height="auto";
      figure.appendChild(image);
      const caption=doc.createElement("figcaption");
      caption.textContent="Add a caption";
      figure.appendChild(caption);
      if(original?.tagName==="SECTION")original.appendChild(figure);
      else if(original?.parentElement&&main.contains(original))original.after(figure);
      else (main.querySelector("section:last-of-type")||main).appendChild(figure);
    }
    image.src=src;
    if(path&&state.uploads.has(path))image.dataset.studioAsset=path;
    else delete image.dataset.studioAsset;
    if(!image.alt||image.alt==="Describe this image")image.alt=safeImageDescription(path||src);
    syncCurrent();selectElement(image,true);
    $("mediaDialog").close();
    const contentTab=document.querySelector('[data-tab="content"]');
    contentTab?.click();
    $("imageAlt").focus();
    toast("Photo placed. Check its description and adjust the frame under Content.");
  }
  function mediaCard(item){
    const button=document.createElement("button");button.type="button";button.className="media-choice";
    const picture=document.createElement("img");
    picture.src=item.src;picture.alt="";picture.loading="lazy";
    const name=document.createElement("span");name.textContent=item.name;
    button.append(picture,name);
    button.addEventListener("click",()=>usePhoto(item.src,item.pendingPath));
    return button;
  }
  function allPhotos(){
    const existing=(photoCache||[]).map(x=>({name:x.name,src:x.path}));
    const uploads=[...state.uploads.values()].map(x=>({name:x.path.split("/").pop()+" (new)",src:x.dataUrl,pendingPath:x.path}));
    return [...uploads,...existing];
  }
  function renderPhotos(){
    const grid=$("mediaGrid");grid.replaceChildren();
    const q=$("mediaSearch").value.trim().toLowerCase();
    const results=allPhotos().filter(x=>x.name.toLowerCase().includes(q));
    if(!results.length){
      const para=document.createElement("p");para.textContent="No photos match this search. You can upload one above.";
      para.className="micro-help";grid.appendChild(para);
    }
    for(const item of results)grid.appendChild(mediaCard(item));
    $("mediaLibraryStatus").textContent=results.length+" photo"+(results.length===1?"":"s")+" available. Photos are reused without being uploaded twice.";
  }
  async function openMedia(){
    $("mediaSearch").value="";
    $("mediaDialog").showModal();
    $("mediaLibraryStatus").textContent="Loading photographs…";
    try{
      if(!photoCache){
        const files=await github("/repos/gmoon-code/gmoon-code.github.io/contents/assets?ref=main");
        if(!Array.isArray(files))throw Error("GitHub did not return the photo directory.");
        photoCache=files.filter(x=>x.type==="file"&&IMAGE_RE.test(x.name)&&/^assets\//.test(x.path))
          .map(x=>({name:x.name,path:x.path})).sort((a,b)=>a.name.localeCompare(b.name));
      }
      renderPhotos();
    }catch(error){
      photoCache=photoCache||[];
      renderPhotos();
      $("mediaLibraryStatus").textContent="Couldn't load the existing photo list. You can still upload a photo. "+error.message;
    }
  }
  function iconKindSelected(){
    const node=state.selected;return !!node&&/^(H[1-6]|P|SPAN|A|FIGCAPTION|LI|BLOCKQUOTE)$/.test(node.tagName);
  }
  function positionQuick(){
    const item=state.selected,bar=$("quickActions");
    const dock=document.querySelector(".canvas-insert-toolbar");
    if(dock&&bar.parentElement!==dock)dock.appendChild(bar);
    bar.style.left="";bar.style.top="";
    bar.hidden=!item||!item.isConnected||item.getBoundingClientRect().width===0;
    // The old image-only resize control is replaced by the shared on-page grips.
    $("resizeHandle").hidden=true;
  }
  function enterInlineEdit(){
    const node=state.selected;if(!iconKindSelected()){document.querySelector('[data-tab="content"]')?.click();$("elementText").focus();return}
    if(node.isContentEditable){node.focus();return}
    remember();
    inlineTarget=node;
    node.contentEditable="true";
    node.focus();
    node.addEventListener("input",()=>{syncCurrent()});
    node.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();node.blur()}
    });
    node.addEventListener("blur",()=>{
      node.removeAttribute("contenteditable");
      inlineTarget=null;
      syncCurrent();
      api.selectElement(node);
    },{once:true});
    toast("Edit directly here. Select words and use Ctrl+B or Ctrl+I to format them. Click away to finish.");
  }
  function formatText(action){
    const node=state.selected;
    if(!iconKindSelected())return;
    if(!node.isContentEditable)enterInlineEdit();
    const doc=docOf();
    const cmd=action==="bold"?"bold":action==="italic"?"italic":"createLink";
    let value=null;
    if(cmd==="createLink"){
      const typed=window.prompt("Where should this link go? Enter a website URL or a page such as research.html.","https://");
      if(typed===null)return;
      try{value=api.safeUrl(typed)}catch(e){toast(e.message,true);return}
    }
    remember();
    node.focus();
    try{doc.execCommand(cmd,false,value);syncCurrent()}
    catch(e){toast("The browser could not format this selection. Try the keyboard shortcut.",true)}
  }
  function quickAction(action){
    if(!state.selected)return;
    if(["bold","italic","link"].includes(action)){formatText(action);return}
    if(action==="edit")enterInlineEdit();
    if(action==="move"){$("moveDownBtn").click()}
    if(action==="duplicate")$("duplicateBtn").click();
    if(action==="style"){document.querySelector('[data-tab="design"]')?.click();$("stylePreset").focus()}
  }
  function startResize(event){
    const node=state.selected;
    if(!node||node.tagName!=="IMG")return;
    event.preventDefault();
    remember();
    const box=node.getBoundingClientRect();
    resizeSession={node,startX:event.clientX,startWidth:box.width};
    $("resizeHandle").setPointerCapture?.(event.pointerId);
  }
  function moveResize(event){
    if(!resizeSession)return;
    const {node,startX,startWidth}=resizeSession;
    const proposed=Math.round(Math.max(48,Math.min(1600,startWidth+event.clientX-startX)));
    node.style.width=proposed+"px";
    node.style.maxWidth="100%";
    node.style.height="auto";
    positionQuick();
  }
  function finishResize(){
    if(!resizeSession)return;
    resizeSession=null;
    syncCurrent();
    api.selectElement(state.selected);
    positionQuick();
  }
  function resizeByKeyboard(event){
    const node=state.selected;
    if(node?.tagName!=="IMG")return;
    const direction=event.key==="ArrowRight"||event.key==="ArrowUp"?1:
      event.key==="ArrowLeft"||event.key==="ArrowDown"?-1:0;
    if(!direction)return;
    event.preventDefault();
    const amount=event.shiftKey?20:5;
    mutate(()=>{
      const current=node.getBoundingClientRect().width;
      node.style.width=Math.round(Math.max(48,Math.min(1600,current+direction*amount)))+"px";
      node.style.maxWidth="100%";
      node.style.height="auto";
    });
    positionQuick();
  }
  function styleControls(node){
    const styleNames=["plain","outlined","soft","feature"];
    const spaceNames=["compact","comfortable","airy"];
    const current=styleNames.find(x=>node.classList.contains("studio-look-"+x));
    $("stylePreset").value=current||"";
    $("spacePreset").value=spaceNames.find(x=>node.classList.contains("studio-space-"+x))||"";
    if(node.tagName==="IMG"){
      const shape=["square","landscape","portrait","wide"].find(x=>node.classList.contains("studio-frame-"+x));
      $("imageShape").value=shape||"natural";
    }
  }
  function setLook(kind,value){
    const el=state.selected;if(!el)return;
    const names=kind==="studio-look-"?["plain","outlined","soft","feature"]:["compact","comfortable","airy"];
    mutate(()=>{
      names.forEach(n=>el.classList.remove(kind+n));
      if(value)el.classList.add(kind+value);
    });
    styleControls(el);
  }
  function updateImageFrame(value){
    const node=state.selected;if(node?.tagName!=="IMG")return;
    mutate(()=>{
      ["square","landscape","portrait","wide"].forEach(x=>node.classList.remove("studio-frame-"+x));
      if(value!=="natural")node.classList.add("studio-frame-"+value);
      if(value!=="natural")node.style.objectFit="cover";
    });
  }

  function usablePages(){
    return state.manifest?.pages.filter(p=>/^[a-z0-9][a-z0-9-]*\.html$/.test(p.path))||[];
  }
  function syncNavigation(){
    const pages=usablePages(),available=new Set(pages.map(p=>p.path));
    const original=JSON.stringify(navigation.items||[]);
    navigation.items=(navigation.items||[]).filter(item=>available.has(item.path));
    for(const page of pages){
      if(!navigation.items.some(item=>item.path===page.path)){
        navigation.items.push({path:page.path,label:page.title,visible:false});
      }
    }
    const home=navigation.items.find(item=>item.path==="index.html");
    if(home){
      navigation.items=navigation.items.filter(item=>item!==home);
      navigation.items.unshift(home);
      home.visible=true;
    }
    if(original!==JSON.stringify(navigation.items))navDirty=true;
  }
  function persistNavDraft(){
    const draft=state.drafts.get("studio/navigation.json");
    if(!draft)return;
    draft.html=JSON.stringify(navigation,null,2)+"\n";
    draft.dirty=draft.html!==draft.savedHtml;
    navDirty=draft.dirty;
    updateStatus();onChanged();
  }
  function navIsCurrent(page,link){
    if(page===link)return true;
    if(link==="research.html"&&page.startsWith("research-"))return true;
    if(link==="projects.html"&&["story-method.html","research-methods-studio.html"].includes(page))return true;
    const current=state.manifest.pages.find(p=>p.path===page);
    return current?.parent===link&&!navigation.items.some(i=>i.path===page&&i.visible);
  }
  function navigationMarkup(doc,currentPath){
    const fragment=doc.createDocumentFragment();
    const colors=["yellow","green","blue","magenta"];
    const shown=navigation.items.filter(item=>item.visible);
    shown.forEach((item,i)=>{
      const a=doc.createElement("a");
      a.setAttribute("href",item.path);
      if(item.path==="cv.html")a.className="cv-link";
      a.style.setProperty("--nav-highlight","var(--section-"+colors[i%colors.length]+")");
      a.textContent=item.label||item.path;
      if(navIsCurrent(currentPath,item.path))a.setAttribute("aria-current","page");
      fragment.appendChild(a);
    });
    return fragment;
  }
  function updateNavPreview(){
    // Navigation edits are applied to every public page together on Publish.
    $("saveStatus").title="Menu changes will update all pages when published.";
  }
  function navEdited(){
    persistNavDraft();
    renderNavigation();
    updateNavPreview();
  }
  function renderNavigation(){
    const list=$("navigationItems");list.replaceChildren();
    const items=navigation.items;
    items.forEach((item,index)=>{
      const row=document.createElement("div");row.className="nav-editor-row";
      const name=document.createElement("div");
      const path=document.createElement("span");
      path.className="nav-path";path.textContent=item.path;
      const label=document.createElement("input");label.className="nav-label-input";
      label.type="text";label.maxLength=36;label.setAttribute("aria-label","Menu label for "+item.path);
      label.value=item.label||"";
      label.addEventListener("change",()=>{
        const next=label.value.trim();
        if(!next){label.value=item.label;return}
        item.label=next;navEdited();
      });
      name.append(path,label);
      const visible=document.createElement("label");visible.className="nav-visible";
      const check=document.createElement("input");check.type="checkbox";check.checked=!!item.visible;
      check.setAttribute("aria-label","Show "+item.label+" in top menu");
      if(item.path==="index.html"){check.checked=true;check.disabled=true}
      check.addEventListener("change",()=>{item.visible=check.checked;navEdited()});
      visible.appendChild(check);
      const ordering=document.createElement("div");ordering.className="nav-arrows";
      if(item.path==="index.html"){
        const fixed=document.createElement("span");fixed.className="nav-fixed";fixed.textContent="Always first";
        ordering.appendChild(fixed);
      }else{
        for(const [labelSymbol,step,explanation] of [["↑",-1,"Move "+item.label+" up"],["↓",1,"Move "+item.label+" down"]]){
          const button=document.createElement("button");
          button.type="button";button.className="small-button";
          button.textContent=labelSymbol;button.title=explanation;
          button.setAttribute("aria-label",explanation);
          const target=index+step;
          button.disabled=target<1||target>=items.length;
          button.addEventListener("click",()=>{
            const swap=items[target];
            items[target]=item;items[index]=swap;
            navEdited();
          });
          ordering.appendChild(button);
        }
      }
      row.append(name,visible,ordering);
      list.appendChild(row);
    });
  }
  async function openNavigation(){
    syncNavigation();
    const draft=await ensureDraft("studio/navigation.json");
    if(draft.dirty)navDirty=true;
    renderNavigation();
    $("navigationDialog").showModal();
  }
  async function beforePublish(){
    syncNavigation();
    if(!navDirty&&!state.drafts.get("studio/navigation.json")?.dirty)return;
    persistNavDraft();
    const paths=[...new Set([...usablePages().map(p=>p.path),"404.html"])];
    for(const path of paths){
      if(state.deleted.has(path))continue;
      let draft;
      try{draft=await ensureDraft(path)}
      catch(e){if(state.deleted.has(path))continue;throw e}
      const doc=new DOMParser().parseFromString(draft.html,"text/html");
      const nav=doc.querySelector("nav.site-nav");
      if(!nav)continue;
      const replacement=navigationMarkup(doc,path);
      const before=nav.outerHTML;
      nav.replaceChildren(replacement);
      if(nav.outerHTML!==before){
        draft.html="<!doctype html>\n"+doc.documentElement.outerHTML+"\n";
        draft.dirty=draft.isNew||draft.html!==draft.savedHtml;
      }
    }
    updateStatus();onChanged();
  }

  function swatchColors(type,custom){
    const base=COLORS[type]||COLORS.soft;
    const valid=value=>typeof value==="string"&&/^#[0-9a-f]{6}$/i.test(value);
    const result={};
    for(const name of ["yellow","green","blue","magenta"]){
      result[name]=[0,1,2].map(i=>custom?.[name]&&valid(custom[name][i])?custom[name][i]:base[name][i]);
    }
    return result;
  }
  function fillSiteColors(type,custom=null){
    const container=$("siteCustomColors");
    container.replaceChildren();
    const palette=swatchColors(type,custom);
    for(const name of ["yellow","green","blue","magenta"]){
      const card=document.createElement("div");card.className="site-color-swatch";
      const heading=document.createElement("strong");heading.textContent=name[0].toUpperCase()+name.slice(1);
      card.appendChild(heading);
      for(const [i,label] of ["Highlight","Soft background","Accent line"].entries()){
        const row=document.createElement("label");
        const text=document.createElement("span");text.textContent=label;
        const input=document.createElement("input");
        input.type="color";input.value=palette[name][i];
        input.dataset.siteTone=name;input.dataset.siteRole=String(i);
        input.setAttribute("aria-label",name+" "+label);
        input.addEventListener("input",()=>renderPalettePreview());
        row.append(text,input);card.appendChild(row);
      }
      container.appendChild(card);
    }
    renderPalettePreview();
  }
  function siteFormColors(){
    const palette=swatchColors($("sitePalette").value);
    const inputs=[...$("siteCustomColors").querySelectorAll("[data-site-tone]")];
    for(const input of inputs)palette[input.dataset.siteTone][Number(input.dataset.siteRole)]=input.value;
    return palette;
  }
  function renderPalettePreview(){
    const preview=$("sitePalettePreview");preview.replaceChildren();
    const palette=siteFormColors();
    for(const name of ["yellow","green","blue","magenta"]){
      const swatch=document.createElement("span");
      swatch.style.backgroundColor=palette[name][0];
      swatch.title=name;
      preview.appendChild(swatch);
    }
  }
  function themeCSS(p){
    const set=swatchColors(p.palette,p.customColors);
    const family=FACE[p.font]||FACE.times;
    const headingFamily=p.headingFont==="same"?family:(FACE[p.headingFont]||family);
    const width=[980,1120,1280].includes(Number(p.width))?Number(p.width):1120;
    const readingWidth=[840,920,1040,1200].includes(Number(p.readingWidth))?Number(p.readingWidth):1040;
    const radius=[2,4,10].includes(Number(p.corners))?Number(p.corners):4;
    const baseSize=Math.max(12,Math.min(26,Number(p.bodySize)||16));
    const headingScale=Math.max(.75,Math.min(1.5,(Number(p.headingScale)||100)/100));
    const lineHeight=Math.max(1,Math.min(2.5,Number(p.lineHeight)||1.55));
    const background=/^#[0-9a-f]{6}$/i.test(p.pageBackground||"")?p.pageBackground:"#ffffff";
    let vars="";
    for(const color of ["yellow","green","blue","magenta"]){
      const vals=set[color];
      vars+="\n  --section-"+color+":"+vals[0]+";";
      vars+="\n  --section-"+color+"-soft:"+vals[1]+";";
      vars+="\n  --section-"+color+"-line:"+vals[2]+";";
    }
    const px=x=>(x*headingScale).toFixed(2).replace(/\.00$/,"");
    return "/* Site-wide choices managed by Website Studio. */\n:root{"+vars+
      "\n  --page-max:"+width+"px;\n  --editorial-measure:"+readingWidth+"px;\n  --radius:"+radius+"px;\n}\n"+
      "html,body{background-color:"+background+"}\n"+
      "body,button,input,textarea,select{font-family:"+family+"}\n"+
      "body{font-size:"+baseSize+"px;line-height:"+lineHeight+"}\n"+
      "h1,h2,h3,h4,h5,h6{font-family:"+headingFamily+"}\n"+
      "h1{font-size:clamp("+px(40)+"px,4.7vw,"+px(60)+"px)}\n"+
      "h2{font-size:"+px(30)+"px}\n"+
      "h3{font-size:"+px(21)+"px}\n"+
      "h4{font-size:"+px(17)+"px}\n";
  }
  function applyThemeInPreview(){
    const doc=docOf();if(!doc?.head)return;
    let style=doc.getElementById("studio-preview-theme");
    if(!style){style=doc.createElement("style");style.id="studio-preview-theme";doc.head.appendChild(style)}
    style.textContent=themeCSS(prefs);
  }
  function openSiteLook(){
    $("sitePalette").value=prefs.palette;
    $("siteFont").value=prefs.font;
    $("siteWidth").value=String(prefs.width);
    $("siteReadingWidth").value=String(prefs.readingWidth||1040);
    $("siteCorners").value=String(prefs.corners);
    $("siteHeadingFont").value=prefs.headingFont||"same";
    $("siteBodySize").value=String(prefs.bodySize||16);
    $("siteHeadingScale").value=String(prefs.headingScale||100);
    $("siteBodyLineHeight").value=String(prefs.lineHeight||1.55);
    $("sitePageBackground").value=prefs.pageBackground||"#ffffff";
    fillSiteColors(prefs.palette,prefs.customColors);
    $("siteLookDialog").showModal();
  }
  async function applySiteLook(){
    const next={
      palette:$("sitePalette").value,
      font:$("siteFont").value,
      width:Number($("siteWidth").value),
      readingWidth:Number($("siteReadingWidth").value),
      corners:Number($("siteCorners").value),
      headingFont:$("siteHeadingFont").value,
      bodySize:Number($("siteBodySize").value),
      headingScale:Number($("siteHeadingScale").value),
      lineHeight:Number($("siteBodyLineHeight").value),
      pageBackground:$("sitePageBackground").value,
      customColors:siteFormColors()
    };
    if(!COLORS[next.palette]||!FACE[next.font]||
      (next.headingFont!=="same"&&!FACE[next.headingFont])||
      ![980,1120,1280].includes(next.width)||![840,920,1040,1200].includes(next.readingWidth)||![2,4,10].includes(next.corners)||
      next.bodySize<12||next.bodySize>26||next.headingScale<75||next.headingScale>150||
      next.lineHeight<1||next.lineHeight>2.5)return;
    prefs=next;
    const prefDraft=await ensureDraft("studio/site-settings.json");
    const themeDraft=await ensureDraft("site-theme.css");
    prefDraft.html=JSON.stringify(prefs,null,2)+"\n";
    prefDraft.dirty=prefDraft.html!==prefDraft.savedHtml;
    themeDraft.html=themeCSS(prefs);
    themeDraft.dirty=themeDraft.html!==themeDraft.savedHtml;
    updateStatus();applyThemeInPreview();onChanged();
    $("siteLookDialog").close();
    toast("Site-wide style updated in your draft. Publish to apply it to every page.");
  }

  // IndexedDB stores drafts on this browser only; never access tokens or credentials.
  function db(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(Error("Local draft storage unavailable"));return}
      const request=indexedDB.open(STORAGE_DB,1);
      request.onupgradeneeded=()=>{
        const database=request.result;
        if(!database.objectStoreNames.contains("records"))database.createObjectStore("records",{keyPath:"key"});
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||Error("Cannot open draft storage"));
    });
    return dbPromise;
  }
  async function readRecord(){
    const database=await db();
    return new Promise((resolve,reject)=>{
      const transaction=database.transaction("records","readonly");
      const request=transaction.objectStore("records").get("working");
      request.onsuccess=()=>resolve(request.result||null);
      request.onerror=()=>reject(request.error);
    });
  }
  async function writeRecord(record){
    const database=await db();
    return new Promise((resolve,reject)=>{
      const transaction=database.transaction("records","readwrite");
      transaction.objectStore("records").put(record);
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error);
    });
  }
  async function deleteRecord(){
    const database=await db();
    return new Promise((resolve,reject)=>{
      const transaction=database.transaction("records","readwrite");
      transaction.objectStore("records").delete("working");
      transaction.oncomplete=()=>resolve();
      transaction.onerror=()=>reject(transaction.error);
    });
  }
  function snapshot(){
    const drafts=[...state.drafts].filter(([,d])=>d.dirty).map(([path,d])=>[path,{
      html:d.html,savedHtml:d.savedHtml,sha:d.sha,isNew:d.isNew,dirty:true
    }]);
    if(!state.manifestDirty&&!state.deleted.size&&!drafts.length)return null;
    return {
      key:"working",version:STORAGE_VERSION,owner:"gmoon-code",
      savedAt:Date.now(),currentPath:state.currentPath,
      manifestSha:state.manifestSha,manifestDirty:state.manifestDirty,
      manifest:state.manifestDirty?state.manifest:null,
      drafts,uploads:[...state.uploads],deleted:[...state.deleted]
    };
  }
  async function saveRecovery(){
    if(!state.connected||!recoveryAvailable)return;
    try{
      const snap=snapshot();
      if(snap){await writeRecord(snap);$("draftRecoveryStatus").textContent=" • Saved privately in this browser"}
      else{await deleteRecord();$("draftRecoveryStatus").textContent=""}
    }catch(error){
      recoveryAvailable=false;
      $("draftRecoveryStatus").textContent=" • Browser recovery unavailable";
      toast("This browser could not save a recovery copy. Keep the tab open until you publish.",true);
    }
  }
  function onChanged(){
    if(!state.connected||!recoveryAvailable)return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveRecovery,1000);
  }
  async function restore(){
    // First load the saved site style, so preview always matches the live site.
    try{
      const draft=await ensureDraft("studio/site-settings.json");
      const settings=JSON.parse(draft.html);
      if(COLORS[settings.palette]&&FACE[settings.font])prefs={...SETTINGS_DEFAULT,...settings};
      await ensureDraft("site-theme.css");
    }catch(e){prefs={...SETTINGS_DEFAULT}}
    try{
      const navDraft=await ensureDraft("studio/navigation.json");
      const contents=JSON.parse(navDraft.html);
      if(Array.isArray(contents.items))navigation=contents;
      syncNavigation();
    }catch(e){navigation={version:1,items:[]};syncNavigation()}
    try{
      const stored=await readRecord();
      if(!stored||stored.version!==STORAGE_VERSION||stored.owner!=="gmoon-code")return null;
      const when=new Date(stored.savedAt).toLocaleString();
      if(!window.confirm("You have unfinished website edits saved on this browser ("+when+"). Would you like to restore them?")){
        await deleteRecord();return null;
      }
      if(stored.manifestDirty&&stored.manifest?.pages?.length){
        state.manifest=stored.manifest;
        state.manifestSha=stored.manifestSha;
        state.manifestDirty=true;
      }
      for(const [path,d] of stored.drafts||[]){
        if(!/^[a-z0-9][\w./-]*\.(?:html|css|json)$/.test(path))continue;
        state.drafts.set(path,{...d,dirty:true,canonicalSet:false,undo:[],redo:[]});
      }
      for(const [path,data] of stored.uploads||[])if(/^assets\/photo-[\w.-]+\.(?:jpg|png|webp|gif)$/i.test(path))state.uploads.set(path,data);
      for(const [path,sha] of stored.deleted||[])if(/^[a-z0-9-]+\.html$/.test(path))state.deleted.set(path,sha);
      if(state.drafts.has("studio/site-settings.json")){
        try{prefs=JSON.parse(state.drafts.get("studio/site-settings.json").html)}catch(e){}
      }
      if(state.drafts.has("studio/navigation.json")){
        try{navigation=JSON.parse(state.drafts.get("studio/navigation.json").html);navDirty=state.drafts.get("studio/navigation.json").dirty}catch(e){}
      }
      $("draftRecoveryStatus").textContent=" • Unfinished edits restored";
      const target=stored.currentPath;
      return state.manifest.pages.some(page=>page.path===target)?target:"index.html";
    }catch(error){
      recoveryAvailable=false;
      $("draftRecoveryStatus").textContent=" • Browser recovery unavailable";
      return null;
    }
  }
  function onPublished(){
    if(navDirty&&activeDraft()){
      const draft=activeDraft();
      draft.canonicalSet=false;
      $("previewFrame").srcdoc=api.withPreviewBase(draft.html);
    }
    navDirty=false;
    clearTimeout(saveTimer);saveTimer=setTimeout(saveRecovery,100);
  }
  function onSignOut(){
    clearTimeout(saveTimer);
    deleteRecord().catch(()=>{});
    $("draftRecoveryStatus").textContent="";
  }
  function onPreviewReady(){
    $("quickActions").hidden=true;
    $("resizeHandle").hidden=true;
    applyThemeInPreview();
    if(!wasLoaded){
      $("previewOuter").addEventListener("scroll",positionQuick,{passive:true});
      window.addEventListener("resize",positionQuick);
      wasLoaded=true;
    }
    docOf()?.addEventListener("scroll",positionQuick,true);
    if(state.connected&&api.activeDraft()?.dirty)onChanged();
  }
  function onSelection(node){
    styleControls(node);
    positionQuick();
  }
  function install(){
    $("libraryBtn").addEventListener("click",()=>openLibrary());
    $("newSectionBtn").addEventListener("click",event=>{
      event.stopImmediatePropagation();openLibrary("sections");
    },true);
    $("closeLibraryBtn").addEventListener("click",()=>$("blockLibraryDialog").close());
    $("blockSearch").addEventListener("input",renderLibrary);
    for(const button of document.querySelectorAll("[data-block-filter]")){
      button.addEventListener("click",()=>{
        filter=button.dataset.blockFilter;
        document.querySelectorAll("[data-block-filter]").forEach(b=>b.classList.toggle("is-active",b.dataset.blockFilter===filter));
        renderLibrary();
      });
    }
    $("photosBtn").addEventListener("click",openMedia);
    $("closeMediaBtn").addEventListener("click",()=>$("mediaDialog").close());
    $("mediaSearch").addEventListener("input",renderPhotos);
    $("mediaUploadBtn").addEventListener("click",()=>{
      $("mediaDialog").close();
      api.openImagePicker(state.selected?.tagName==="IMG");
    });
    for(const button of document.querySelectorAll("[data-quick]")){
      if(["bold","italic","link"].includes(button.dataset.quick)){
        button.addEventListener("pointerdown",event=>event.preventDefault());
      }
      button.addEventListener("click",()=>quickAction(button.dataset.quick));
    }
    const handle=$("resizeHandle");
    handle.addEventListener("pointerdown",startResize);
    handle.addEventListener("pointermove",moveResize);
    handle.addEventListener("pointerup",finishResize);
    handle.addEventListener("pointercancel",finishResize);
    handle.addEventListener("keydown",resizeByKeyboard);
    $("stylePreset").addEventListener("change",()=>setLook("studio-look-",$("stylePreset").value));
    $("spacePreset").addEventListener("change",()=>setLook("studio-space-",$("spacePreset").value));
    $("imageShape").addEventListener("change",()=>updateImageFrame($("imageShape").value));
    $("navigationBtn").addEventListener("click",()=>openNavigation().catch(e=>toast(e.message,true)));
    $("closeNavigationBtn").addEventListener("click",()=>$("navigationDialog").close());
    $("siteLookBtn").addEventListener("click",openSiteLook);
    $("closeSiteLookBtn").addEventListener("click",()=>$("siteLookDialog").close());
    $("sitePalette").addEventListener("change",()=>fillSiteColors($("sitePalette").value));
    $("resetSiteLookBtn").addEventListener("click",()=>{
      $("sitePalette").value=SETTINGS_DEFAULT.palette;$("siteFont").value=SETTINGS_DEFAULT.font;
      $("siteWidth").value=String(SETTINGS_DEFAULT.width);$("siteReadingWidth").value=String(SETTINGS_DEFAULT.readingWidth);$("siteCorners").value=String(SETTINGS_DEFAULT.corners);
      $("siteHeadingFont").value=SETTINGS_DEFAULT.headingFont;
      $("siteBodySize").value=String(SETTINGS_DEFAULT.bodySize);
      $("siteHeadingScale").value=String(SETTINGS_DEFAULT.headingScale);
      $("siteBodyLineHeight").value=String(SETTINGS_DEFAULT.lineHeight);
      $("sitePageBackground").value=SETTINGS_DEFAULT.pageBackground;
      fillSiteColors(SETTINGS_DEFAULT.palette);
    });
    $("applySiteLookBtn").addEventListener("click",()=>applySiteLook().catch(e=>toast(e.message,true)));
    // Templates can also be inserted from the compact Add menu.
    for(const item of layouts){
      if(item.category==="sections"&&!["intro-section","split-section","cards-section","gallery-section"].includes(item.id))continue;
      const select=$("insertType");
      if(![...select.options].some(x=>x.value===item.id))select.add(new Option(item.title,item.id));
    }
    $("insertBtn").addEventListener("click",event=>{
      const id=$("insertType").value;
      if(layouts.some(x=>x.id===id)){
        event.stopImmediatePropagation();
        if(id==="image")openMedia();
        else addTemplate(id);
      }
    },true);
    $("helpDialog").querySelector(".help-list")?.insertAdjacentHTML("beforeend",
      "<li><strong>Browse layouts</strong> for ready-made sections. <strong>My photos</strong> reuses existing images, and <strong>Site style</strong> changes the look across pages. Draft recovery stays on this device.</li>");
  }
  window.WebsiteStudioPlus={onChanged,onSelection,onPreviewReady,onPublished,onSignOut,restore,beforePublish,addTemplate,openLibrary,openMedia};
  install();
})();
