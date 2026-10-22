/* Constrained, source-preserving responsive group layouts. No HTML rewriting.
   All inputs must be revalidated against the current page before preview or export. */
(function(root){
  "use strict";
  const tags=new Set(["h1","h2","h3","h4","p","blockquote","figcaption"]);
  const containerTags=new Set(["div","article","figure","section","aside"]);
  const selectorPattern=/^(?:#[A-Za-z][A-Za-z0-9_-]*|[a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]*\))(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]*\))*$/;
  const textOf=element=>element.textContent.trim().replace(/\s+/g," ");
  function sourceSelector(element,main){
    if(!element||!main||element===main||!main.contains(element))
      throw Error("The selected element is outside the page content");
    const parts=[];
    for(let node=element;node&&node!==main;node=node.parentElement){
      if(node.id&&/^[A-Za-z][A-Za-z0-9_-]*$/.test(node.id)){
        parts.unshift("#"+node.id);break;
      }
      const tag=node.tagName.toLowerCase();
      const siblings=[...node.parentElement.children].filter(child=>child.tagName===node.tagName);
      parts.unshift(tag+":nth-of-type("+(siblings.indexOf(node)+1)+")");
    }
    const selector=parts.join(" > ");
    if(!selectorPattern.test(selector)||selector.length>500)
      throw Error("The source element cannot be identified safely");
    return selector;
  }
  function positionValid(p){
    return !!p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&
      Number.isInteger(p.w)&&Number.isInteger(p.h)&&
      p.x>=1&&p.x<=12&&p.w>=1&&p.w<=12&&p.x+p.w<=13&&
      p.y>=1&&p.y<=100&&p.h>=1&&p.h<=30;
  }
  function overlap(a,b){
    return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  }
  function verify(doc,spec){
    if(!spec||![1,2].includes(spec.version)||typeof spec.parentSelector!=="string"||
       !selectorPattern.test(spec.parentSelector)||spec.parentSelector.length>500||
       !Array.isArray(spec.children)||spec.children.length<2||spec.children.length>12)
      throw Error("Invalid responsive group");
    const main=doc.querySelector("main");
    if(!main||!doc.head)throw Error("The page has no main content or head");
    const parents=[...main.querySelectorAll(spec.parentSelector)];
    if(parents.length!==1||parents[0]===main)
      throw Error("The responsive group parent is missing or ambiguous");
    const parent=parents[0];
    if(spec.version===2&&parent.tagName==="SECTION"&&
       ![...parent.children].some(node=>node.tagName==="FIGURE")&&
       ![...parent.children].every(node=>node.tagName==="ARTICLE"))
      throw Error("A section heading and its content must remain in their original reading flow");
    if(parent.closest("nav,form,footer,header,aside,script,style")||
       parent.querySelector("script,iframe,form,button,svg,canvas,[contenteditable]"))
      throw Error("This section has controls or embedded content that cannot be rearranged");
    if(parent.children.length!==spec.children.length||
       [...parent.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))
      throw Error("This section has other content or children that cannot be preserved by the grid");
    const seen=new Set(),resolved=[];
    for(let i=0;i<spec.children.length;i++){
      const s=spec.children[i];
      if(!s||typeof s.selector!=="string"||!selectorPattern.test(s.selector)||
         s.selector.length>500||!(spec.version===2?containerTags:tags).has(s.tag)||
         typeof s.before!=="string"||s.before.length>(spec.version===2?12000:4000)||
         (spec.version===2&&(typeof s.markup!=="string"||s.markup.length>20000))||
         !positionValid(s.desktop)||!positionValid(s.mobile)||seen.has(s.selector))
        throw Error("Invalid responsive child source or position");
      seen.add(s.selector);
      const matches=[...main.querySelectorAll(s.selector)];
      if(matches.length!==1||matches[0]!==parent.children[i]||
         matches[0].tagName.toLowerCase()!==s.tag||
         textOf(matches[0])!==s.before||
         (spec.version===2&&matches[0].outerHTML!==s.markup))
        throw Error("The responsive section source has changed");
      resolved.push(matches[0]);
    }
    for(const mode of ["desktop","mobile"]){
      for(let i=0;i<spec.children.length;i++){
        const current=spec.children[i][mode];
        if(i>0){
          const previous=spec.children[i-1][mode];
          if(current.y<previous.y||(current.y===previous.y&&current.x<previous.x))
            throw Error("Visual block order differs from the document reading order on "+mode);
        }
        for(let j=i+1;j<spec.children.length;j++)
          if(overlap(current,spec.children[j][mode]))
            throw Error("Blocks overlap in the "+mode+" responsive layout");
      }
    }
    return {main,parent,resolved};
  }
  function cssFor(doc,spec){
    verify(doc,spec);
    const build=mode=>{
      const rules=["main "+spec.parentSelector+
        "{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));"+
        "grid-auto-rows:minmax(0,auto);column-gap:12px;row-gap:8px;align-items:start;}"];
      for(const s of spec.children){
        const p=s[mode];
        rules.push("main "+s.selector+"{grid-column:"+p.x+" / span "+p.w+
          ";grid-row:"+p.y+" / span "+p.h+";min-width:0;}");
      }
      return rules.join("\n");
    };
    return "/* Reviewed responsive group. Existing page markup remains unchanged. */\n"+
      "@media(min-width:701px){\n"+build("desktop")+"\n}\n"+
      "@media(max-width:700px){\n"+build("mobile")+"\n}";
  }
  function apply(doc,spec){
    if(doc.querySelector("#moon-responsive-group-layout"))
      throw Error("The page already contains a responsive layout group");
    const css=cssFor(doc,spec);
    const style=doc.createElement("style");
    style.id="moon-responsive-group-layout";
    style.textContent=css;
    doc.head.append(style);
    return css;
  }
  root.MoonResponsiveLayout=Object.freeze({sourceSelector,verify,cssFor,apply});
})(typeof window!=="undefined"?window:globalThis);
