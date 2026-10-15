/* Website Studio: precise editing of static HTML tables. */
(() => {
  "use strict";
  const api=window.WebsiteStudioAPI;
  if(!api)return;
  const {state,docOf,mutate,selectElement,toast}=api;

  const controls=document.createElement("div");
  controls.id="tableEditBox";
  controls.className="table-edit-controls";
  controls.hidden=true;
  controls.innerHTML=`
    <h3>Edit table</h3>
    <p id="tableEditStatus" class="micro-help" role="status">Select a cell to edit it.</p>
    <p class="micro-help">Double-click a cell to change its words. Use the controls below to add or remove rows and columns.</p>
    <div class="table-edit-actions">
      <button type="button" id="tableRowBefore" class="small-button">+ Row above</button>
      <button type="button" id="tableRowAfter" class="small-button">+ Row below</button>
      <button type="button" id="tableColumnBefore" class="small-button">+ Column left</button>
      <button type="button" id="tableColumnAfter" class="small-button">+ Column right</button>
      <button type="button" id="tableRowRemove" class="small-button">Remove row</button>
      <button type="button" id="tableColumnRemove" class="small-button">Remove column</button>
    </div>
  `;
  document.getElementById("contentTab")?.appendChild(controls);
  const $=id=>document.getElementById(id);
  const buttonIds=["tableRowBefore","tableRowAfter","tableColumnBefore","tableColumnAfter","tableRowRemove","tableColumnRemove"];

  function selectedTable(){
    const el=state.selected,doc=docOf();
    if(!el||!doc?.querySelector("main")?.contains(el))return null;
    return el.tagName==="TABLE"?el:el.closest("table");
  }
  function selectedCell(table){
    const el=state.selected;
    if(!table||!el)return null;
    return el.closest("td,th")||table.tBodies[0]?.rows[0]?.cells[0]||table.rows[0]?.cells[0]||null;
  }
  function geometry(table){
    const rows=[...table.rows];
    const columns=rows[0]?.cells.length||0;
    const simple=rows.length>0&&columns>0&&rows.every(row=>
      row.cells.length===columns&&[...row.cells].every(cell=>cell.colSpan===1&&cell.rowSpan===1)
    );
    return {rows,columns,simple};
  }
  function refresh(){
    const table=selectedTable();
    controls.hidden=!table;
    if(!table)return;
    const cell=selectedCell(table),shape=geometry(table);
    const current=cell?.parentElement||null;
    const bodyRow=current?.parentElement?.tagName==="TBODY"?current:null;
    const hasBody=[...table.tBodies].some(body=>body.rows.length>0);
    const rowEnabled=shape.simple&&!!table.tBodies.length;
    const colEnabled=shape.simple&&!!cell;
    $("tableEditStatus").textContent=shape.simple?
      shape.rows.length+" rows, "+shape.columns+" columns. "+(bodyRow?"Selected row "+(bodyRow.rowIndex+1)+".":"Select a body cell to target a particular row."):
      "This table has merged or irregular cells. Cell text is editable; structural changes are disabled to preserve its layout.";
    for(const id of buttonIds)$(id).disabled=!shape.simple;
    $("tableRowBefore").disabled=!rowEnabled;
    $("tableRowAfter").disabled=!rowEnabled;
    $("tableRowRemove").disabled=!bodyRow||table.tBodies[0].rows.length<=1;
    $("tableColumnBefore").disabled=!colEnabled;
    $("tableColumnAfter").disabled=!colEnabled;
    $("tableColumnRemove").disabled=!colEnabled||shape.columns<=1;
  }
  function emptyCell(doc,reference,header=false){
    const cell=doc.createElement(header?"th":reference?.tagName?.toLowerCase()==="th"?"th":"td");
    if(reference?.className)cell.className=reference.className;
    if(reference?.getAttribute("style"))cell.setAttribute("style",reference.getAttribute("style"));
    if(reference?.hasAttribute("scope"))cell.setAttribute("scope",reference.getAttribute("scope"));
    cell.textContent=cell.tagName==="TH"?"Heading":"New value";
    return cell;
  }
  function addRow(before){
    const table=selectedTable(),cell=selectedCell(table);
    if(!table||!geometry(table).simple)return;
    const body=cell?.closest("tbody")||table.tBodies[0];
    if(!body)return;
    const target=cell?.closest("tbody tr")||body.rows[body.rows.length-1]||null;
    const source=target||table.rows[0];
    const row=table.ownerDocument.createElement("tr");
    const headerOnly=source?.parentElement?.tagName==="THEAD";
    for(const orig of [...(source?.cells||[])])row.appendChild(emptyCell(table.ownerDocument,orig,headerOnly?false:orig.tagName==="TH"));
    api.mutate(()=>{
      if(target){if(before)target.before(row);else target.after(row)}
      else body.appendChild(row);
    });
    selectElement(row.cells[0],true);
    toast("Table row added. Double-click a cell to write in it.");
    refresh();
  }
  function addColumn(before){
    const table=selectedTable(),cell=selectedCell(table);
    const shape=table&&geometry(table);
    if(!shape?.simple||!cell)return;
    const idx=cell.cellIndex;
    let focus=null;
    mutate(()=>{
      for(const row of shape.rows){
        const adjacent=row.cells[idx];
        const newCell=emptyCell(table.ownerDocument,adjacent);
        if(before)adjacent.before(newCell);else adjacent.after(newCell);
        if(row===cell.parentElement)focus=newCell;
      }
    });
    selectElement(focus||table.rows[0].cells[idx+(before?0:1)],true);
    toast("Table column added. Double-click a cell to write in it.");
    refresh();
  }
  function removeRow(){
    const table=selectedTable(),cell=selectedCell(table);
    const row=cell?.closest("tbody tr");
    if(!table||!row||!geometry(table).simple||row.parentElement.rows.length<=1)return;
    if(!confirm("Delete this table row? You can undo before publishing."))return;
    const candidate=row.nextElementSibling||row.previousElementSibling;
    const column=cell.cellIndex;
    mutate(()=>row.remove());
    selectElement(candidate.cells[Math.min(column,candidate.cells.length-1)],true);
    refresh();
  }
  function removeColumn(){
    const table=selectedTable(),cell=selectedCell(table),shape=table&&geometry(table);
    if(!shape?.simple||shape.columns<=1||!cell)return;
    if(!confirm("Delete this table column? You can undo before publishing."))return;
    const index=cell.cellIndex;
    mutate(()=>shape.rows.forEach(row=>row.cells[index].remove()));
    const row=table.rows[Math.min(cell.parentElement.rowIndex,table.rows.length-1)];
    selectElement(row.cells[Math.min(index,row.cells.length-1)],true);
    refresh();
  }

  $("tableRowBefore").addEventListener("click",()=>addRow(true));
  $("tableRowAfter").addEventListener("click",()=>addRow(false));
  $("tableColumnBefore").addEventListener("click",()=>addColumn(true));
  $("tableColumnAfter").addEventListener("click",()=>addColumn(false));
  $("tableRowRemove").addEventListener("click",removeRow);
  $("tableColumnRemove").addEventListener("click",removeColumn);
  window.WebsiteStudioTables={onSelection:refresh,onPreviewReady:refresh};
})();
