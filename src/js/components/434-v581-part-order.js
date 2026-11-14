/* MediaFlow v581 — reorder a title's parts.
 *
 * Edit title → By parts: each part row has a drag handle, ↑ / ↓ arrows and a
 * position number. The order is saved as the order of the title's parts (no
 * part number, like v577), so Logging (Quick and Advanced), Log any title and
 * Batch Log list the chips and cards in this order.
 */
const mf581RowHtmlBase=v252EditorSeasonRowHtml;
v252EditorSeasonRowHtml=function(season,index){
  const raw=String(mf581RowHtmlBase.apply(this,arguments)||'');
  const pos=(Number(index)||0)+1;
  const tools='<div class="mf581-order" aria-label="Part order">'+
    '<span class="mf581-handle" title="Drag to move" aria-hidden="true">⠿</span>'+
    '<button type="button" class="btn btn-sm btn-ghost" aria-label="Move up" title="Move up" onclick="App.mf581MovePart(this,-1)">↑</button>'+
    '<button type="button" class="btn btn-sm btn-ghost" aria-label="Move down" title="Move down" onclick="App.mf581MovePart(this,1)">↓</button>'+
    '<input type="number" min="1" step="1" inputmode="numeric" class="mf581-pos" value="'+pos+'" aria-label="Position" title="Position" onchange="App.mf581SetPartPos(this)">'+
    '</div>';
  return raw.replace('<div class="v252-season-editor-row" data-v252-season-row','<div class="v252-season-editor-row" draggable="false" data-v252-season-row').replace(/(data-v252-season-row[^>]*>)/,'$1'+tools);
};
function mf581List(el){return el?.closest?.('[data-v252-season-list]')||document.querySelector('[data-v252-seasons-editor] [data-v252-season-list]');}
function mf581Renumber(list){
  const rows=[...(list||mf581List()).querySelectorAll(':scope > [data-v252-season-row]')];
  rows.forEach((row,i)=>{const pos=row.querySelector('.mf581-pos');if(pos){pos.value=String(i+1);pos.max=String(rows.length);}});
  try{v252EditorSyncAggregate();}catch(_){}
}
function mf581MoveRow(row,to){
  const list=mf581List(row);if(!row||!list)return;
  const rows=[...list.querySelectorAll(':scope > [data-v252-season-row]')];
  const from=rows.indexOf(row);const n=rows.length;
  const target=Math.max(0,Math.min(n-1,Math.floor(Number(to))));
  if(from<0||target===from){mf581Renumber(list);return;}
  rows.splice(from,1);rows.splice(target,0,row);
  for(const r of rows)list.appendChild(r);
  mf581Renumber(list);
  row.classList.add('mf581-moved');setTimeout(()=>row.classList.remove('mf581-moved'),400);
}
App.mf581MovePart=function(btn,delta){
  const row=btn?.closest?.('[data-v252-season-row]');if(!row)return;
  const rows=[...mf581List(row).querySelectorAll(':scope > [data-v252-season-row]')];
  mf581MoveRow(row,rows.indexOf(row)+Number(delta||0));
  row.querySelector(delta<0?'[aria-label="Move up"]':'[aria-label="Move down"]')?.focus();
};
App.mf581SetPartPos=function(input){
  const row=input?.closest?.('[data-v252-season-row]');if(!row)return;
  mf581MoveRow(row,(Math.floor(Number(input.value))||1)-1);
};
/* Drag by the handle (mouse or touch through pointer events). */
let MF581_DRAG=null;
document.addEventListener('pointerdown',ev=>{
  const handle=ev.target.closest?.('.mf577-parts-editor .mf581-handle');if(!handle)return;
  const row=handle.closest('[data-v252-season-row]');if(!row)return;
  ev.preventDefault();
  MF581_DRAG={row,list:mf581List(row),id:ev.pointerId};
  row.classList.add('mf581-dragging');
  try{handle.setPointerCapture(ev.pointerId);}catch(_){}
});
document.addEventListener('pointermove',ev=>{
  if(!MF581_DRAG||ev.pointerId!==MF581_DRAG.id)return;
  ev.preventDefault();
  const {row,list}=MF581_DRAG;
  const rows=[...list.querySelectorAll(':scope > [data-v252-season-row]')].filter(r=>r!==row);
  let before=null;
  for(const r of rows){const b=r.getBoundingClientRect();if(ev.clientY<b.top+b.height/2){before=r;break;}}
  if(before){if(row.nextElementSibling!==before)list.insertBefore(row,before);}
  else if(list.lastElementChild!==row)list.appendChild(row);
},{passive:false});
function mf581EndDrag(ev){
  if(!MF581_DRAG||ev.pointerId!==MF581_DRAG.id)return;
  const {row,list}=MF581_DRAG;MF581_DRAG=null;
  row.classList.remove('mf581-dragging');
  mf581Renumber(list);
}
document.addEventListener('pointerup',mf581EndDrag);
document.addEventListener('pointercancel',mf581EndDrag);
/* New rows (Add part) get the right position numbers. */
if(typeof App.v252EditorAddSeason==='function'){
  const mf581AddBase=App.v252EditorAddSeason;
  App.v252EditorAddSeason=function(){const out=mf581AddBase.apply(this,arguments);mf581Renumber();return out;};
}
if(typeof App.v252EditorRemoveSeason==='function'){
  const mf581RemoveBase=App.v252EditorRemoveSeason;
  App.v252EditorRemoveSeason=function(){const out=mf581RemoveBase.apply(this,arguments);mf581Renumber();return out;};
}
window.MediaFlowV581=Object.freeze({version:581,feature:'reorder a title\'s parts (drag, arrows, position)'});
