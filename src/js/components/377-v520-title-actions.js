/* MediaFlow v520 — Canonical Title Personal Order and Collection actions. */
(function mf520(){
'use strict';
const MF520_VERSION=520;
let draft={order:false,collections:new Set()};
let picker=null;
const txt=value=>String(value??'');
const esc=value=>escapeHtml(txt(value));
const byId=id=>(S.library||[]).find(row=>txt(row?.id)===txt(id))||null;
const collections=()=>typeof v274EnsureCollections==='function'?v274EnsureCollections():(S.collections||[]);
const members=id=>new Set(collections().filter(c=>(c.titleIds||[]).some(x=>txt(x)===txt(id))).map(c=>txt(c.id)));
const ordered=id=>!!id&&(v138EnsureOrderPlan().titleIds||[]).some(x=>txt(x)===txt(id));
function state(id){return id?{order:ordered(id),collections:members(id)}:draft;}
function icon(name){return typeof mf425Icon==='function'?mf425Icon(name,16):'';}
function actions(id,scope){
 const s=state(id),n=s.collections.size,tid=esc(id||'');
 return `<section class="mf520-title-actions" data-mf520-scope="${esc(scope)}" data-mf520-id="${tid}" aria-label="Personal Order and Collections">
   <button type="button" class="btn btn-sm mf520-order-btn ${s.order?'mf520-active':''}" aria-pressed="${s.order?'true':'false'}" onclick="App.mf520ToggleOrder('${tid}')">${icon(s.order?'check-check':'list-ordered')} <span>${s.order?'Added to Personal Order':'Add to Personal Order'}</span></button>
   <button type="button" class="btn btn-sm mf520-collections-btn ${n?'mf520-active':''}" onclick="App.mf520OpenCollections('${tid}')">${icon('folders')} <span>Add to Collection (${n})</span></button>
 </section>`;
}
function refresh(){
 document.querySelectorAll('.mf520-title-actions').forEach(el=>{
  const id=el.dataset.mf520Id||'',s=state(id),n=s.collections.size;
  const order=el.querySelector('.mf520-order-btn'),col=el.querySelector('.mf520-collections-btn');
  if(order){order.classList.toggle('mf520-active',s.order);order.setAttribute('aria-pressed',txt(s.order));order.innerHTML=icon(s.order?'check-check':'list-ordered')+' <span>'+(s.order?'Added to Personal Order':'Add to Personal Order')+'</span>';}
  if(col){col.classList.toggle('mf520-active',n>0);col.innerHTML=icon('folders')+' <span>Add to Collection ('+n+')</span>';}
 });
}
function updateOrder(id,enabled){
 const p=v138EnsureOrderPlan(),tid=txt(id),has=p.titleIds.some(x=>txt(x)===tid);
 if(!tid||!byId(tid)||has===enabled)return false;
 if(enabled)p.titleIds.push(tid);
 else {p.titleIds=p.titleIds.filter(x=>txt(x)!==tid);S.orderPlannerUI?.picks?.delete?.(tid);}
 p.modifiedAt=Date.now();
 if(typeof v287ReconcileAllQueues==='function')v287ReconcileAllQueues();
 if(typeof v141InvalidateOrderPickerCache==='function')v141InvalidateOrderPickerCache();
 return true;
}
function updateCollections(id,selected){
 const tid=txt(id);if(!tid||!byId(tid))return 0;
 const all=collections();let changed=0;
 for(const c of all){
  const cid=txt(c.id),had=(c.titleIds||[]).some(x=>txt(x)===tid),want=selected.has(cid);
  if(had===want)continue;
  if(want)c.titleIds=[...(c.titleIds||[]),tid];
  else c.titleIds=(c.titleIds||[]).filter(x=>txt(x)!==tid);
  if(typeof v274TouchCollection==='function')v274TouchCollection(c);
  else {c.order=c.titleIds.slice();c.updatedAt=Date.now();}
  changed++;
 }
 return changed;
}
function persist(){
 try{return Promise.resolve(saveState()).catch(error=>{console.error('[v520] membership cloud save failed',error);showToast('Membership changed locally; cloud save failed. Please retry Sync Now.');});}
 catch(error){console.error('[v520] membership save failed',error);showToast('Unable to save membership.');return Promise.resolve();}
}
function toggleOrder(id){
 const tid=txt(id);
 if(!tid){draft.order=!draft.order;refresh();return;}
 if(!byId(tid)){showToast('Save the title to your Library first.');return;}
 const now=!ordered(tid);
 if(updateOrder(tid,now)){refresh();persist();showToast(now?'Added to Personal Order ✓':'Removed from Personal Order ✓');}
}
function rowHtml(c){
 const id=esc(c.id),count=(c.titleIds||[]).length,checked=picker?.selected.has(txt(c.id));
 const cover=typeof v274CollectionCoverHtml==='function'?v274CollectionCoverHtml(c,'mf520-collection-cover'):'';
 return `<label class="mf520-collection-row" data-mf520-name="${esc(txt(c.title).toLowerCase())}"><input type="checkbox" ${checked?'checked':''} onchange="App.mf520SelectCollection('${id}',this.checked)">${cover}<span class="mf520-collection-text"><b>${esc(c.title||'Untitled Collection')}</b><small>${count.toLocaleString()} title${count===1?'':'s'}${c.description?' · '+esc(txt(c.description).slice(0,86)):''}</small></span></label>`;
}
function refreshPicker(){
 const root=document.getElementById('mf520-collection-picker');if(!root||!picker)return;
 const count=root.querySelector('[data-mf520-selected-count]');if(count)count.textContent=picker.selected.size+' selected';
 const filter=picker.search.trim().toLowerCase();let shown=0;
 root.querySelectorAll('.mf520-collection-row').forEach(row=>{const visible=!filter||row.dataset.mf520Name.includes(filter);row.hidden=!visible;if(visible)shown++;});
 const empty=root.querySelector('[data-mf520-empty]');if(empty)empty.hidden=shown>0;
}
function closePicker(){document.getElementById('mf520-collection-picker')?.remove();picker=null;}
function openCollections(id){
 const tid=txt(id);
 if(tid&&!byId(tid)){showToast('This title is no longer in your Library.');return;}
 closePicker();const current=state(tid);
 picker={id:tid,selected:new Set(current.collections),search:''};
 const rows=collections();
 const title=tid?cleanTitle(byId(tid)?.title||'Untitled'):cleanTitle(document.getElementById('l-title')?.value||'New title');
 document.body.insertAdjacentHTML('beforeend',`<div id="mf520-collection-picker" class="mf520-backdrop" onclick="if(event.target===this)App.mf520CloseCollections()">
  <section class="mf520-dialog" role="dialog" aria-modal="true" aria-label="Choose title collections">
   <header class="mf520-dialog-head"><div><span class="mf520-eyebrow">COLLECTION MANAGER</span><h2>Add to Collection</h2><p>${esc(title)} · Choose one or multiple collections.</p></div><button type="button" class="btn btn-sm btn-ghost mf520-close" aria-label="Close collection picker" onclick="App.mf520CloseCollections()">${icon('x')} Close</button></header>
   <div class="mf520-tools"><label class="mf520-search">${icon('search')}<input type="search" placeholder="Search collections…" aria-label="Search collections" oninput="App.mf520SearchCollections(this.value)"></label><span data-mf520-selected-count>${picker.selected.size} selected</span></div>
   <div class="mf520-list">${rows.map(rowHtml).join('')}<p class="mf520-empty" data-mf520-empty ${rows.length?'hidden':''}>${rows.length?'No matching collections.':'No collections yet. Create one on the Collections page first.'}</p></div>
   <footer class="mf520-footer"><button type="button" class="btn btn-ghost" onclick="App.mf520ClearSelections()">Deselect all</button><span class="mf520-spacer"></span><button type="button" class="btn btn-ghost" onclick="App.mf520CloseCollections()">Cancel</button><button type="button" class="btn btn-primary" onclick="App.mf520SaveCollections()">Save collections</button></footer>
  </section></div>`);
 refreshPicker();
 document.querySelector('#mf520-collection-picker input[type=search]')?.focus({preventScroll:true});
}
function selectCollection(id,on){if(!picker)return;if(on)picker.selected.add(txt(id));else picker.selected.delete(txt(id));refreshPicker();}
function clearSelections(){if(!picker)return;picker.selected.clear();document.querySelectorAll('#mf520-collection-picker .mf520-collection-row input').forEach(x=>x.checked=false);refreshPicker();}
function searchCollections(value){if(!picker)return;picker.search=txt(value);refreshPicker();}
function saveCollections(){
 if(!picker)return;
 const id=picker.id,selected=new Set(picker.selected);
 if(!id){draft.collections=selected;closePicker();refresh();showToast('Collection choices will save with this title ✓');return;}
 const changed=updateCollections(id,selected);
 closePicker();refresh();
 if(changed){persist();showToast(`Updated ${changed} collection${changed===1?'':'s'} ✓`);}
 else showToast('Collection memberships unchanged');
}
const editorBase=libraryModalHtml;
libraryModalHtml=function(item){
 const html=txt(editorBase.apply(this,arguments));
 if(html.includes('data-mf522-canonical="1"'))return html;
 try{
  const host=document.createElement('div');host.innerHTML=html;
  const editor=host.querySelector('.v240-library-editor, .v238-library-editor');
  if(!editor)return html;
  const section=document.createElement('div');section.innerHTML=actions(item?.id||'','editor');
  const toolbar=editor.querySelector('.mf449-editor-recovery-toolbar');
  const target=toolbar||editor.querySelector('.modal-title')||editor.querySelector('.modal-actions');
  if(target)target.after(section.firstElementChild);else editor.prepend(section.firstElementChild);
  return host.innerHTML;
 }catch(e){console.warn('[v520] editor action placement',e);return html;}
};
const detailBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 const html=txt(detailBase.apply(this,arguments));
 if(html.includes('data-mf522-canonical="1"'))return html;
 try{
  const host=document.createElement('div');host.innerHTML=html;
  const copy=host.querySelector('.v181-title-hero-copy')||host.querySelector('.v181-title-details-body');
  if(!copy)return html;
  const section=document.createElement('div');section.innerHTML=actions(item?.id||'','details');
  copy.appendChild(section.firstElementChild);
  return host.innerHTML;
 }catch(e){console.warn('[v520] title details action placement',e);return html;}
};
const openBase=App.openLibraryModal;
App.openLibraryModal=function(id){draft={order:false,collections:new Set()};closePicker();return openBase.apply(this,arguments);};
const saveBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
 const newTitle=!id;
 const pending={order:draft.order,collections:new Set(draft.collections)};
 const previousIds=newTitle?new Set((S.library||[]).map(x=>txt(x?.id))):null;
 const result=saveBase.apply(this,arguments);
 const finish=()=>{
  if(!newTitle)return;
  const created=(S.library||[]).find(x=>x?.id&&!previousIds.has(txt(x.id)));
  if(!created){console.warn('[v520] New title not created; draft memberships were not applied.');return;}
  let touched=false;
  if(pending.order)touched=updateOrder(created.id,true)||touched;
  if(pending.collections.size)touched=updateCollections(created.id,pending.collections)>0||touched;
  if(touched)persist();
  draft={order:false,collections:new Set()};
 };
 if(result&&typeof result.then==='function')return Promise.resolve(result).then(value=>{finish();return value;});
 finish();return result;
};
const closeBase=App.closeModal;
App.closeModal=function(){closePicker();draft={order:false,collections:new Set()};return closeBase.apply(this,arguments);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&picker){e.preventDefault();e.stopImmediatePropagation();closePicker();}},true);
Object.assign(App,{mf520ToggleOrder:toggleOrder,mf520OpenCollections:openCollections,mf520CloseCollections:closePicker,mf520SelectCollection:selectCollection,mf520ClearSelections:clearSelections,mf520SearchCollections:searchCollections,mf520SaveCollections:saveCollections});
window.MediaFlowV520=Object.freeze({version:MF520_VERSION,membershipCount:id=>members(id).size,isOrdered:ordered,applyMembership:(id,order,selected)=>({order:updateOrder(id,order),collections:updateCollections(id,new Set(selected))})});
})();
