/* Component-aware visual controls for reusable diagrams and layouts. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  if(!api)return;
  const {state,docOf,mutate,selectElement,toast}=api;
  const $=id=>document.getElementById(id);
  const tab=$("contentTab");if(!tab)return;
  const panel=document.createElement("section");
  panel.id="studioComponentTools";panel.className="studio-component-tools";panel.hidden=true;
  panel.innerHTML=[
    '<h3>Component controls</h3>',
    '<p class="micro-help" id="studioComponentDescription"></p>',
    '<div id="studioProcessTools" hidden>',
    '<div class="studio-component-buttons">',
    '<button type="button" data-step-action="add">+ Step</button>',
    '<button type="button" data-step-action="earlier">↑ Earlier</button>',
    '<button type="button" data-step-action="later">↓ Later</button>',
    '<button type="button" data-step-action="remove">Remove step</button></div></div>',
    '<div id="studioColumnsTools" hidden>',
    '<label for="studioColumnCount">Columns on wide screens</label>',
    '<select id="studioColumnCount"><option value="1">One</option>',
    '<option value="2">Two</option><option value="3">Three</option>',
    '<option value="4">Four</option></select>',
    '<label for="studioColumnGap">Spacing between columns</label>',
    '<input id="studioColumnGap" type="range" min="0" max="64" step="2" value="18">',
    '<output id="studioColumnGapText">18 px</output>',
    '<p class="micro-help">Narrow screens automatically stack these columns.</p>',
    '<div class="studio-component-buttons">',
    '<button type="button" id="studioAddColumn">+ Column</button>',
    '<button type="button" id="studioRemoveColumn">Remove last</button></div></div>',
    '<div id="studioFaqTools" hidden>',
    '<div class="studio-component-buttons">',
    '<button type="button" id="studioAddFAQ">+ Question</button>',
    '<button type="button" id="studioRemoveFAQ">Remove question</button></div></div>'
  ].join("");
  tab.appendChild(panel);

  function context(){
    const node=state.selected;
    if(!node||!docOf()?.querySelector("main")?.contains(node))return {};
    const process=node.closest(".studio-process");
    if(process&&process.tagName==="OL")return {kind:"process",root:process,item:node.closest("li")};
    const columns=node.closest(".studio-columns,.studio-comparison,.studio-editable-columns,.grid-2,.grid-3");
    if(columns)return {kind:"columns",root:columns,item:node};
    const faq=node.closest(".studio-faq");
    if(faq)return {kind:"faq",root:faq,item:node.closest("details")};
    return {};
  }
  function render(){
    const ctx=context();
    panel.hidden=!ctx.kind;
    $("studioProcessTools").hidden=ctx.kind!=="process";
    $("studioColumnsTools").hidden=ctx.kind!=="columns";
    $("studioFaqTools").hidden=ctx.kind!=="faq";
    if(!ctx.kind)return;
    if(ctx.kind==="process"){
      $("studioComponentDescription").textContent="Process diagram. Click a step's heading or description to edit it directly.";
      const li=ctx.item||ctx.root.querySelector("li");
      const items=[...ctx.root.children].filter(el=>el.tagName==="LI");
      panel.querySelector('[data-step-action="earlier"]').disabled=!li||li===items[0];
      panel.querySelector('[data-step-action="later"]').disabled=!li||li===items.at(-1);
      panel.querySelector('[data-step-action="remove"]').disabled=!li||items.length<=1;
    }
    if(ctx.kind==="columns"){
      $("studioComponentDescription").textContent="Column layout. Edit text inside each card, add a column or adjust the spacing.";
      const computed=docOf().defaultView.getComputedStyle(ctx.root);
      let n=parseInt(ctx.root.style.getPropertyValue("--studio-cols"),10);
      if(!n)n=ctx.root.classList.contains("grid-3")?3:2;
      $("studioColumnCount").value=String(Math.max(1,Math.min(4,n)));
      const gap=Number.parseFloat(ctx.root.style.getPropertyValue("--studio-column-gap"))||
        Number.parseFloat(computed.columnGap)||18;
      $("studioColumnGap").value=String(Math.max(0,Math.min(64,gap)));
      $("studioColumnGapText").textContent=$("studioColumnGap").value+" px";
      const editable=ctx.root.matches(".studio-columns,.studio-comparison,[data-studio-component=columns]");
      $("studioAddColumn").disabled=!editable;
      $("studioRemoveColumn").disabled=!editable||ctx.root.children.length<=1;
    }
    if(ctx.kind==="faq"){
      $("studioComponentDescription").textContent="Expandable questions. Each question and answer can be edited on the page.";
      $("studioRemoveFAQ").disabled=!ctx.item||ctx.root.querySelectorAll(":scope > details").length<=1;
    }
  }
  panel.addEventListener("click",event=>{
    const btn=event.target.closest("[data-step-action]");
    if(!btn||btn.disabled)return;
    const ctx=context();if(ctx.kind!=="process")return;
    const items=[...ctx.root.children].filter(el=>el.tagName==="LI");
    const item=ctx.item||items.at(-1);
    const action=btn.dataset.stepAction;
    if(action==="remove"){
      if(!item||items.length<=1)return;
      if(!confirm("Remove this diagram step? Undo restores it."))return;
      const next=item.nextElementSibling||item.previousElementSibling;
      mutate(()=>item.remove());
      selectElement(next,true);render();return;
    }
    if(action==="add"){
      const li=docOf().createElement("li");
      const title=docOf().createElement("strong");title.textContent="New step";
      const p=docOf().createElement("p");p.textContent="Explain this part of the process.";
      li.append(title,p);
      mutate(()=>item?item.after(li):ctx.root.appendChild(li));
      selectElement(title,true);
      toast("Step added. Double-click the heading or description to edit it.");render();return;
    }
    if(!item)return;
    const sibling=action==="earlier"?item.previousElementSibling:item.nextElementSibling;
    if(!sibling)return;
    mutate(()=>{if(action==="earlier")sibling.before(item);else sibling.after(item)});
    selectElement(item,true);render();
  });
  $("studioColumnCount").addEventListener("change",()=>{
    const ctx=context();if(ctx.kind!=="columns")return;
    const count=Number($("studioColumnCount").value);
    if(!Number.isInteger(count)||count<1||count>4)return;
    mutate(()=>{
      ctx.root.classList.add("studio-editable-columns");
      ctx.root.style.setProperty("--studio-cols",String(count));
      ctx.root.style.removeProperty("grid-template-columns");
      ctx.root.style.removeProperty("display");
    });
    selectElement(ctx.root,true);render();
  });
  $("studioColumnGap").addEventListener("input",()=>{
    $("studioColumnGapText").textContent=$("studioColumnGap").value+" px";
  });
  $("studioColumnGap").addEventListener("change",()=>{
    const ctx=context();if(ctx.kind!=="columns")return;
    const pixels=Number($("studioColumnGap").value);
    if(!Number.isFinite(pixels))return;
    mutate(()=>{
      ctx.root.classList.add("studio-editable-columns");
      ctx.root.style.setProperty("--studio-column-gap",pixels+"px");
      ctx.root.style.removeProperty("column-gap");
      ctx.root.style.removeProperty("gap");
    });
    selectElement(ctx.root);render();
  });
  $("studioAddColumn").addEventListener("click",()=>{
    const ctx=context();
    if(ctx.kind!=="columns"||!ctx.root.matches(".studio-columns,.studio-comparison,[data-studio-component=columns]"))return;
    const parent=ctx.root;
    const example=parent.lastElementChild;
    const type=example?.tagName==="ARTICLE"?"article":"div";
    const block=docOf().createElement(type);
    block.className=example?.className||"paper-card";
    const heading=docOf().createElement("h3");heading.textContent="New column";
    const text=docOf().createElement("p");text.textContent="Add your description here.";
    block.append(heading,text);
    mutate(()=>parent.appendChild(block));
    selectElement(heading,true);
    toast("Column added. Its heading and description are editable.");render();
  });
  $("studioRemoveColumn").addEventListener("click",()=>{
    const ctx=context();
    if(ctx.kind!=="columns"||!ctx.root.matches(".studio-columns,.studio-comparison,[data-studio-component=columns]")||ctx.root.children.length<=1)return;
    if(!confirm("Remove the last column and its content? Undo restores it."))return;
    mutate(()=>ctx.root.lastElementChild.remove());
    selectElement(ctx.root,true);render();
  });
  $("studioAddFAQ").addEventListener("click",()=>{
    const ctx=context();if(ctx.kind!=="faq")return;
    const details=docOf().createElement("details");
    const summary=docOf().createElement("summary");summary.textContent="New question";
    const paragraph=docOf().createElement("p");paragraph.textContent="Write your answer here.";
    details.append(summary,paragraph);
    mutate(()=>ctx.item?.after(details)||ctx.root.appendChild(details));
    selectElement(summary,true);render();
  });
  $("studioRemoveFAQ").addEventListener("click",()=>{
    const ctx=context();
    if(ctx.kind!=="faq"||!ctx.item||ctx.root.querySelectorAll(":scope > details").length<=1)return;
    if(!confirm("Remove this question and its answer? Undo restores them."))return;
    mutate(()=>ctx.item.remove());
    selectElement(ctx.root,true);render();
  });
  window.WebsiteStudioComponents={onPreviewReady:render,onSelection:render,onChanged:render};
})();