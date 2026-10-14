/* Fine Details — scoped controls for individual items, sections, pages, and screen sizes. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  const plus=window.WebsiteStudioPlus;
  if(!api||!plus)return;
  const {state,$,docOf,mutate,toast,selectElement,activeDraft}=api;
  const FONT={
    times:'"Times New Roman",Times,serif',georgia:'Georgia,serif',
    cambria:'Cambria,Georgia,serif',garamond:'Garamond,Georgia,serif',
    palatino:'"Palatino Linotype",Palatino,serif',
    arial:'Arial,Helvetica,sans-serif',verdana:'Verdana,Geneva,sans-serif',
    trebuchet:'"Trebuchet MS",Arial,sans-serif',
    system:'system-ui,-apple-system,"Segoe UI",sans-serif',
    mono:'Consolas,"Courier New",monospace'
  };
  const SCREENS={tablet:"(max-width:900px)",phone:"(max-width:600px)"};
  const SHADOW={
    none:"none",subtle:"0 2px 8px rgba(0,0,0,.10)",
    medium:"0 5px 16px rgba(0,0,0,.16)",large:"0 12px 30px rgba(0,0,0,.22)"
  };
  const TEXT_TAGS="h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,a,span,summary";
  const DETAIL_PROPS=[
    "font-family","font-size","font-weight","line-height","letter-spacing","text-transform",
    "color","background","background-color","border-width","border-style","border-color",
    "border-radius","box-shadow","display","grid-template-columns","gap","justify-content",
    "align-items","padding-inline","padding-block","margin-inline","margin-block","max-width",
    "opacity","order","z-index","position","--page-highlight","--page-line","--page-soft",
    "--studio-scope-font","--studio-scope-text-color","--studio-scope-font-size",
    "--studio-scope-line-height"
  ];
  const UI_IDS=[
    "detailFont","detailFontSize","detailFontWeight","detailLineHeight","detailLetterSpacing",
    "detailCase","detailBackgroundMode","detailGradientEnd","detailGradientAngle",
    "detailBorderSize","detailBorderStyle","detailRadius","detailShadow","detailLayout",
    "detailGridCols","detailGap","detailJustify","detailAlign","detailPaddingX","detailPaddingY",
    "detailMarginX","detailMarginY","detailMaxWidth","detailOpacity","detailOrder",
    "detailZIndex","detailVisibility","detailScope","detailDevice"
  ];
  const COLOR={
    color:{picker:"detailTextColor",hex:"detailTextHex",default:"#111111"},
    highlight:{picker:"detailHighlightColor",hex:"detailHighlightHex",default:"#F5E6A8"},
    accent:{picker:"detailAccentLineColor",hex:"detailAccentLineHex",default:"#C6AD58"},
    soft:{picker:"detailSoftColor",hex:"detailSoftHex",default:"#FCF9ED"},
    background:{picker:"detailBackgroundColor",hex:"detailBackgroundHex",default:"#ffffff"},
    borderColor:{picker:"detailBorderColor",hex:"detailBorderHex",default:"#d8d8d8"}
  };
  let lastRange=null;
  const query=id=>$(id);
  const validHex=value=>/^#[0-9a-f]{6}$/i.test(String(value||"").trim());
  const normalizeHex=value=>String(value).trim().toUpperCase();
  const nullableNumber=(id,min,max,scale=1)=>{
    const value=query(id).value.trim();
    if(value==="")return null;
    const n=Number(value);
    if(!Number.isFinite(n)||n<min||n>max){toast("Please enter a value between "+min+" and "+max+".",true);return undefined}
    return String(n*scale);
  };
  function ensureId(el){
    let id=el.getAttribute("data-site-id");
    if(id&&/^[a-zA-Z0-9-]+$/.test(id))return id;
    const doc=docOf();let candidate;
    do{
      const raw=window.crypto?.randomUUID?.()||("x"+Date.now().toString(36)+Math.random().toString(36).slice(2));
      candidate="detail-"+raw.replace(/[^a-zA-Z0-9]/g,"");
    }while(doc.querySelector('[data-site-id="'+candidate+'"]'));
    el.setAttribute("data-site-id",candidate);
    return candidate;
  }
  function responsiveStore(doc){
    const node=doc.querySelector('style[data-site-breakpoints]');
    if(!node)return {tablet:{},phone:{}};
    const attr=node.getAttribute("data-site-rules");
    if(!attr)return {tablet:{},phone:{}};
    try{
      const parsed=JSON.parse(decodeURIComponent(attr));
      if(parsed&&typeof parsed==="object")
        return {tablet:parsed.tablet||{},phone:parsed.phone||{}};
    }catch(e){}
    return {tablet:{},phone:{}};
  }
  function validCssKey(key){
    return /^--[a-z][a-z0-9-]*$/.test(key)||/^[a-z][a-z0-9-]*$/.test(key);
  }
  function renderResponsiveStyle(doc,store){
    let style=doc.querySelector('style[data-site-breakpoints]');
    const chunks=[];
    for(const device of ["tablet","phone"]){
      const entries=Object.entries(store[device]||{});
      const rules=[];
      for(const [id,properties] of entries){
        if(!/^[a-zA-Z0-9-]+$/.test(id))continue;
        const declarations=Object.entries(properties).filter(([prop,val])=>validCssKey(prop)&&typeof val==="string"&&val.length<180&&
          !/[\n\r{};]/.test(val)).map(([prop,val])=>prop+":"+val+" !important");
        if(declarations.length)rules.push('[data-site-id="'+id+'"]{'+declarations.join(";")+"}");
      }
      if(rules.length)chunks.push("@media "+SCREENS[device]+"{\n"+rules.join("\n")+"\n}");
    }
    if(!chunks.length){
      style?.remove();return;
    }
    if(!style){
      style=doc.createElement("style");
      style.setAttribute("data-site-breakpoints","true");
      doc.head.appendChild(style);
    }
    style.setAttribute("data-site-rules",encodeURIComponent(JSON.stringify(store)));
    style.textContent=chunks.join("\n");
  }
  function area(){
    const doc=docOf();
    if(!doc)return null;
    const scope=query("detailScope").value;
    const selected=state.selected;
    if(scope==="page")return doc.body;
    if(scope==="section"){
      const section=selected?.closest("section");
      return section||doc.querySelector("main > section");
    }
    return selected;
  }
  function currentScreen(){return query("detailDevice").value||"all"}
  function getProp(el,property){
    if(!el)return "";
    const screen=currentScreen();
    if(screen==="all")return el.style.getPropertyValue(property).trim();
    const id=el.getAttribute("data-site-id");
    const store=responsiveStore(docOf());
    return id&&store[screen]?.[id]?.[property]||"";
  }
  function withProperties(values,scopedClass=null){
    const target=area(),doc=docOf();
    if(!target||!doc){toast("Select something in the preview before changing its details.",true);return}
    const screen=currentScreen();
    api.mutate(()=>{
      if(scopedClass){
        const [className,variable]=scopedClass;
        const desired=values[variable];
        if(desired)target.classList.add(className);
        else{
          const id=target.getAttribute("data-site-id");
          const breakpoints=responsiveStore(doc);
          const otherResponsive=!!id&&["tablet","phone"].some(d=>d!==screen&&breakpoints[d]?.[id]?.[variable]);
          const existingAll=screen!=="all"&&!!target.style.getPropertyValue(variable);
          if(!otherResponsive&&!existingAll)target.classList.remove(className);
        }
      }
      if(screen==="all"){
        for(const [property,value] of Object.entries(values)){
          if(value===null||value==="")target.style.removeProperty(property);
          else target.style.setProperty(property,value,"important");
        }
      }else{
        const id=ensureId(target);
        const store=responsiveStore(doc);
        const properties=store[screen][id]||{};
        for(const [property,value] of Object.entries(values)){
          if(value===null||value==="")delete properties[property];
          else properties[property]=value;
        }
        if(Object.keys(properties).length)store[screen][id]=properties;
        else delete store[screen][id];
        renderResponsiveStyle(doc,store);
      }
    });
    refresh();
  }
  function scopeClass(property){
    const target=area();if(!target)return null;
    const scope=query("detailScope").value;
    return scope==="page"||scope==="section"||target.tagName==="SECTION";
  }
  function scopedText(property,value){
    const target=area();if(!target)return;
    const global=scopeClass();
    const map={
      "font-family":["--studio-scope-font","studio-font-scope"],
      "color":["--studio-scope-text-color","studio-color-scope"],
      "font-size":["--studio-scope-font-size","studio-size-scope"],
      "line-height":["--studio-scope-line-height","studio-line-scope"]
    };
    if(global&&map[property]){
      const [cssVariable,className]=map[property];
      withProperties({[cssVariable]:value},[className,cssVariable]);
    }else withProperties({[property]:value});
  }
  function highlightProperty(){
    const target=area();
    const scope=query("detailScope").value;
    return scope==="section"||scope==="page"||target?.tagName==="SECTION"?
      "--page-highlight":"background-color";
  }
  function activeColor(kind){
    const target=area();
    if(!target)return "";
    const prop=colorProperty(kind);
    return getProp(target,prop);
  }
  function colorProperty(kind){
    if(kind==="color"&&scopeClass())return "--studio-scope-text-color";
    return {
      color:"color",highlight:highlightProperty(),accent:"--page-line",
      soft:"--page-soft",background:"background-color",borderColor:"border-color"
    }[kind];
  }
  function applyColor(kind,raw){
    if(!validHex(raw)){toast("Use a six-digit color, such as #CEE5C1.",true);return}
    const value=normalizeHex(raw);
    if(kind==="color"){scopedText("color",value)}
    else if(kind==="background"){setBackground("solid",value)}
    else withProperties({[colorProperty(kind)]:value});
    const meta=COLOR[kind];
    query(meta.picker).value=value;query(meta.hex).value=value;
    contrastMessage();
  }
  function resetColor(kind){
    const target=area();if(!target)return;
    if(kind==="color")scopedText("color",null);
    else if(kind==="background")setBackground("none");
    else withProperties({[colorProperty(kind)]:null});
    refresh();
  }
  function setBackground(mode,color){
    if(mode==="none"){
      withProperties({background:null,"background-color":null});
    }else if(mode==="solid"){
      withProperties({background:null,"background-color":color});
    }else{
      const start=color||query("detailBackgroundColor").value;
      const end=query("detailGradientEnd").value;
      const angle=Number(query("detailGradientAngle").value);
      if(!validHex(start)||!validHex(end)||!Number.isFinite(angle)||angle<0||angle>360){
        toast("Check the gradient colors and angle.",true);return;
      }
      withProperties({"background-color":null,background:"linear-gradient("+angle+"deg, "+start+", "+end+")"});
    }
    refresh();
  }
  function applyBackground(){
    const mode=query("detailBackgroundMode").value;
    setBackground(mode,mode==="solid"?query("detailBackgroundColor").value:null);
  }
  function bindColors(){
    for(const [kind,meta] of Object.entries(COLOR)){
      const picker=query(meta.picker),hex=query(meta.hex);
      picker.addEventListener("change",()=>applyColor(kind,picker.value));
      hex.addEventListener("change",()=>applyColor(kind,hex.value));
    }
    for(const btn of document.querySelectorAll("[data-detail-reset]")){
      btn.addEventListener("click",()=>resetColor(btn.dataset.detailReset));
    }
  }
  function assignNumber(id,property,min,max,suffix=""){
    query(id).addEventListener("change",()=>{
      const n=nullableNumber(id,min,max);
      if(n===undefined)return;
      const val=n===null?null:n+suffix;
      if(["font-size","line-height"].includes(property))scopedText(property,val);
      else withProperties({[property]:val});
    });
  }
  function selectControl(id,property,values){
    query(id).addEventListener("change",()=>{
      const val=query(id).value||null;
      if(val&&values&&!values.includes(val))return;
      withProperties({[property]:val});
    });
  }
  function installFields(){
    query("detailFont").addEventListener("change",()=>{
      const family=FONT[query("detailFont").value]||null;
      scopedText("font-family",family);
    });
    assignNumber("detailFontSize","font-size",8,160,"px");
    assignNumber("detailLineHeight","line-height",.8,3);
    assignNumber("detailLetterSpacing","letter-spacing",-3,15,"px");
    selectControl("detailFontWeight","font-weight",["300","400","500","600","700","800"]);
    selectControl("detailCase","text-transform",["none","uppercase","lowercase","capitalize"]);
    query("detailBackgroundMode").addEventListener("change",()=>{
      query("detailGradientControls").hidden=query("detailBackgroundMode").value!=="gradient";
      applyBackground();
    });
    query("detailGradientEnd").addEventListener("change",applyBackground);
    query("detailGradientAngle").addEventListener("change",applyBackground);
    assignNumber("detailBorderSize","border-width",0,24,"px");
    selectControl("detailBorderStyle","border-style",["solid","dashed","dotted","none"]);
    assignNumber("detailRadius","border-radius",0,120,"px");
    query("detailShadow").addEventListener("change",()=>{
      const value=SHADOW[query("detailShadow").value]||null;
      withProperties({"box-shadow":value});
    });
    query("detailLayout").addEventListener("change",()=>{
      const display=query("detailLayout").value||null;
      if(display==="grid")withProperties({display:"grid"});
      else if(display==="flex")withProperties({display:"flex","flex-wrap":"wrap"});
      else withProperties({display,"flex-wrap":null,"grid-template-columns":null});
    });
    query("detailGridCols").addEventListener("change",()=>{
      const n=nullableNumber("detailGridCols",1,6);
      if(n===undefined)return;
      withProperties({"grid-template-columns":n?"repeat("+n+",minmax(0,1fr))":null});
    });
    assignNumber("detailGap","gap",0,120,"px");
    selectControl("detailJustify","justify-content",["start","center","end","space-between"]);
    selectControl("detailAlign","align-items",["start","center","end","stretch"]);
    assignNumber("detailPaddingX","padding-inline",0,240,"px");
    assignNumber("detailPaddingY","padding-block",0,240,"px");
    assignNumber("detailMarginX","margin-inline",0,240,"px");
    assignNumber("detailMarginY","margin-block",0,240,"px");
    assignNumber("detailMaxWidth","max-width",40,2400,"px");
    query("detailOpacity").addEventListener("input",()=>{
      query("detailOpacityOutput").textContent=query("detailOpacity").value+"%";
    });
    query("detailOpacity").addEventListener("change",()=>{
      const number=nullableNumber("detailOpacity",10,100,.01);
      if(number!==undefined)withProperties({opacity:number});
    });
    assignNumber("detailOrder","order",-20,20);
    query("detailZIndex").addEventListener("change",()=>{
      const n=nullableNumber("detailZIndex",-10,100);
      if(n===undefined)return;
      withProperties({"z-index":n,position:n===null?null:"relative"});
    });
    query("detailVisibility").addEventListener("change",()=>{
      withProperties({display:query("detailVisibility").value==="hidden"?"none":null});
    });
    query("detailScope").addEventListener("change",refresh);
    query("detailDevice").addEventListener("change",()=>{
      const device=currentScreen();
      const previewDevice=device==="phone"?"phone":device==="tablet"?"tablet":"desktop";
      const button=document.querySelector('[data-device="'+previewDevice+'"]');
      button?.click();
      refresh();
    });
    query("detailResetButton").addEventListener("click",resetAll);
    query("detailSelectPage").addEventListener("click",()=>{
      const doc=docOf();
      if(!state.selected&&doc?.querySelector("main > section")){
        selectElement(doc.querySelector("main > section"));
      }
      query("detailScope").value="page";
      document.querySelector('[data-tab="details"]')?.click();
      refresh();
    });
  }
  function parseRgb(value){
    const v=String(value||"").trim();
    if(validHex(v))return normalizeHex(v);
    const m=v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if(m)return "#"+[m[1],m[2],m[3]].map(x=>Math.max(0,Math.min(255,Number(x))).toString(16).padStart(2,"0")).join("").toUpperCase();
    return "";
  }
  function readNum(prop){const raw=getProp(area(),prop);return Number.parseFloat(raw)||""}
  function refresh(){
    const target=area();
    if(!target||!docOf()){
      query("detailScopeHint").textContent="Select a heading, section, card, or photo first.";
      return;
    }
    const label=target.tagName==="BODY"?"whole page":target.tagName==="SECTION"?"section":target.tagName.toLowerCase();
    const screen=currentScreen();
    query("detailScopeHint").textContent="Editing "+label+" · "+(screen==="all"?"all screens":screen+" layout")+".";
    const scopes=scopeClass();
    const typography=[
      ["detailFont","font-family"],["detailFontSize","font-size"],
      ["detailFontWeight","font-weight"],["detailLineHeight","line-height"],
      ["detailLetterSpacing","letter-spacing"],["detailCase","text-transform"]
    ];
    for(const [id,prop] of typography){
      const readProperty=scopes&&["font-family","font-size","line-height"].includes(prop)?
        {"font-family":"--studio-scope-font","font-size":"--studio-scope-font-size","line-height":"--studio-scope-line-height"}[prop]:prop;
      const value=getProp(target,readProperty);
      if(id==="detailFont")query(id).value=Object.entries(FONT).find(([,v])=>v===value)?.[0]||"";
      else query(id).value=value.replace(/px$/,"");
    }
    for(const [kind,meta] of Object.entries(COLOR)){
      const value=parseRgb(getProp(target,colorProperty(kind)));
      query(meta.picker).value=value||meta.default;
      query(meta.hex).value=value||"";
    }
    const gradient=getProp(target,"background");
    const solid=getProp(target,"background-color");
    const isGradient=gradient.startsWith("linear-gradient(");
    query("detailBackgroundMode").value=isGradient?"gradient":solid?"solid":"none";
    query("detailGradientControls").hidden=!isGradient;
    query("detailBorderSize").value=readNum("border-width");
    query("detailBorderStyle").value=getProp(target,"border-style")||"";
    query("detailRadius").value=readNum("border-radius");
    query("detailShadow").value=Object.entries(SHADOW).find(([,v])=>v===getProp(target,"box-shadow"))?.[0]||"";
    query("detailLayout").value=getProp(target,"display")||"";
    const cols=getProp(target,"grid-template-columns").match(/repeat\((\d+),/);
    query("detailGridCols").value=cols?cols[1]:"";
    for(const [id,prop] of [
      ["detailGap","gap"],["detailPaddingX","padding-inline"],["detailPaddingY","padding-block"],
      ["detailMarginX","margin-inline"],["detailMarginY","margin-block"],
      ["detailMaxWidth","max-width"],["detailOrder","order"],["detailZIndex","z-index"]
    ])query(id).value=readNum(prop);
    query("detailJustify").value=getProp(target,"justify-content")||"";
    query("detailAlign").value=getProp(target,"align-items")||"";
    const opacity=getProp(target,"opacity");
    query("detailOpacity").value=opacity?Math.round(Number(opacity)*100):100;
    query("detailOpacityOutput").textContent=query("detailOpacity").value+"%";
    query("detailVisibility").value=getProp(target,"display")==="none"?"hidden":"";
    contrastMessage();
  }
  function contrastMessage(){
    const target=area();
    if(!target||!docOf())return;
    const win=docOf().defaultView;
    if(!win?.getComputedStyle)return;
    try{
      const sty=win.getComputedStyle(target);
      const fg=parseRgb(getProp(target,"color"))||parseRgb(sty.color);
      const bg=parseRgb(getProp(target,"background-color"))||parseRgb(sty.backgroundColor);
      if(!fg||!bg){query("detailStatus").textContent="Changes appear immediately in the draft.";return}
      const luminance=color=>{
        const nums=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
        return nums[0]*.2126+nums[1]*.7152+nums[2]*.0722;
      };
      const a=luminance(fg),b=luminance(bg);
      const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      query("detailStatus").textContent="Text contrast "+ratio.toFixed(1)+":1"+(ratio<4.5?" · Check readability":" · Good for normal-sized text")+".";
    }catch(e){query("detailStatus").textContent="Changes appear immediately in the draft."}
  }
  function resetAll(){
    const target=area(),doc=docOf();
    if(!target||!doc)return;
    if(!window.confirm("Reset the fine-detail styling for this "+query("detailScope").value+" on the selected screen size? Content will stay unchanged."))return;
    const screen=currentScreen();
    api.mutate(()=>{
      if(screen==="all"){
        for(const p of DETAIL_PROPS)target.style.removeProperty(p);
        for(const extra of ["flex-wrap"])target.style.removeProperty(extra);
        for(const cls of ["studio-font-scope","studio-color-scope","studio-size-scope","studio-line-scope"])target.classList.remove(cls);
      }else{
        const id=target.getAttribute("data-site-id");
        const rules=responsiveStore(doc);
        if(id)delete rules[screen][id];
        renderResponsiveStyle(doc,rules);
      }
    });
    refresh();
    toast("Fine-detail styling reset. Your text and photos are unchanged.");
  }
  function rememberSelection(){
    const doc=docOf(),selection=doc?.getSelection?.();
    if(!selection||selection.isCollapsed||!selection.rangeCount)return;
    const range=selection.getRangeAt(0);
    const start=range.startContainer.nodeType===3?range.startContainer.parentElement:range.startContainer;
    const main=doc.querySelector("main");
    if(!start||!main?.contains(start))return;
    const parent=start.closest("p,h1,h2,h3,h4,h5,h6,li,blockquote,figcaption,a,summary");
    const end=range.endContainer.nodeType===3?range.endContainer.parentElement:range.endContainer;
    if(!parent||!parent.contains(end))return;
    lastRange=range.cloneRange();
  }
  function markSelected(clear=false){
    const doc=docOf(),range=lastRange;
    if(!range||!doc||range.collapsed||!doc.contains(range.commonAncestorContainer)){
      toast("Double-click a paragraph, then select the words to highlight.",true);return;
    }
    const node=range.startContainer.nodeType===3?range.startContainer.parentElement:range.startContainer;
    const existing=node.closest('[data-site-inline-highlight]');
    api.remember();
    if(clear){
      if(!existing){toast("Select words inside a highlight first.",true);return}
      const holder=doc.createDocumentFragment();
      while(existing.firstChild)holder.appendChild(existing.firstChild);
      existing.replaceWith(holder);
    }else{
      const color=query("detailWordsHighlight").value;
      if(!validHex(color))return;
      if(existing){
        existing.style.backgroundColor=color;
      }else{
        const mark=doc.createElement("mark");
        mark.setAttribute("data-site-inline-highlight","true");
        mark.style.backgroundColor=color;
        mark.style.color="inherit";
        mark.style.padding="0 .04em";
        try{range.surroundContents(mark)}
        catch(e){
          try{mark.appendChild(range.extractContents());range.insertNode(mark)}
          catch(err){toast("Try highlighting fewer words in one paragraph.",true);return}
        }
      }
    }
    lastRange=null;
    api.syncCurrent();
    refresh();
    toast(clear?"Highlight removed.":"Selected words highlighted.");
  }
  function onPreviewReady(){
    lastRange=null;
    docOf()?.addEventListener("selectionchange",rememberSelection);
    refresh();
  }
  function install(){
    bindColors();installFields();
    query("detailHighlightWords").addEventListener("pointerdown",rememberSelection);
    query("detailClearWords").addEventListener("pointerdown",rememberSelection);
    query("detailHighlightWords").addEventListener("click",()=>markSelected(false));
    query("detailClearWords").addEventListener("click",()=>markSelected(true));
    query("detailWordsHighlight").addEventListener("pointerdown",rememberSelection);
    const previousSelection=plus.onSelection;
    const previousReady=plus.onPreviewReady;
    plus.onSelection=node=>{previousSelection?.(node);refresh()};
    plus.onPreviewReady=()=>{previousReady?.();onPreviewReady()};
    // Avoid a large, empty inspector when no element is selected.
    query("detailScope").value="element";
  }
  window.WebsiteStudioDetails={
    onSelection:refresh,onPreviewReady,resetAll,applyColor,scope:area,selectedScreen:currentScreen
  };
  install();
})();
