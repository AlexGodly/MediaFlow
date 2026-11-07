/* MediaFlow v393 — Picker workspace, scroll stability and reversible membership.
 * Changes only draft logging membership, collection membership and Personal
 * Order assignments. Never delete Library titles, saved logs or Collections.
 */
const V393_RELEASE=393;

// Track both document and independently scrollable page regions. A modal's
// render can replace the entire Order DOM, so remember stable selector/index
// positions as well as references to still-connected scroll nodes.
const V393_SCROLL_SELECTORS=['.v138-order-view','.v138-order-main','.mf345-main-panel','.mf287-queue-list','.v138-order-list','.mf354-list-result-panel','.mf274-add-results','.log-suggestion-list','.log-form'];
let V393_SCROLL_REV=0,V393_ORDER_EDITOR_SNAPSHOT=null;
function v393Snapshot(){
  const containers=[];
  for(const selector of V393_SCROLL_SELECTORS){
    document.querySelectorAll(selector).forEach((el,index)=>{
      if(el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2)containers.push({selector,index,el,top:el.scrollTop,left:el.scrollLeft});
    });
  }
  return {x:window.scrollX,y:window.scrollY,containers,revision:++V393_SCROLL_REV};
}
function v393Restore(snap){
  if(!snap)return;
  for(const item of snap.containers){
    const node=item.el?.isConnected?item.el:document.querySelectorAll(item.selector)[item.index];
    if(!node)continue;
    node.scrollTop=item.top;node.scrollLeft=item.left;
  }
  if(Math.abs(window.scrollY-snap.y)>1||Math.abs(window.scrollX-snap.x)>1){
    try{window.scrollTo({left:snap.x,top:snap.y,behavior:'instant'});}catch(_){window.scrollTo(snap.x,snap.y);}
  }
}
function v393KeepPosition(snap){
  v393Restore(snap);
  const rev=snap?.revision;
  // Handle focus/scroll anchoring in the next two layout frames, without timers.
  requestAnimationFrame(()=>{
    if(rev!==V393_SCROLL_REV)return;
    v393Restore(snap);
    requestAnimationFrame(()=>{if(rev===V393_SCROLL_REV)v393Restore(snap);});
  });
}
function v393WithScroll(fn){const snap=v393Snapshot();try{return fn();}finally{v393KeepPosition(snap);}}

/* Collections — the legacy checkbox handler completely recreated the form,
 * resetting the inner scroll pane. Update selection + count in place instead.
 */
function v393UpdateCollectionSelectControls(){
  const state=v274AddState(),count=state.picks.size;
  const button=document.getElementById('mf274-add-confirm');
  if(button){button.disabled=!count;button.hidden=v392Mode('collection')!=='multi';button.innerHTML=V392_ICON_PLUS+` Add Selected (${count})`;}
  // The original pager footer also shows a selection count. Keep it in sync
  // without replacing any of the scrollable list DOM or focused controls.
  const footer=document.getElementById('mf276-add-footer');
  if(footer){
    const select=footer.querySelector('.mf274-add-select-actions');
    if(select){
      const buttons=select.querySelectorAll('button');
      const deselect=[...buttons].find(b=>b.getAttribute('onclick')?.includes('v274AddDeselectAll'));
      if(deselect)deselect.disabled=!count;
      const hint=select.querySelector('.hint');
      if(hint)hint.textContent=hint.textContent.replace(/^\s*\d+[\d,]*\s+selected/,count+' selected');
    }
  }
  const root=document.getElementById('mf276-add-results');
  if(root){for(const checkbox of root.querySelectorAll('.mf352-picker-check')){
    const id=checkbox.closest('[data-mf392-id]')?.dataset.mf392Id;
    if(id)checkbox.checked=state.picks.has(id);
  }}
}
v274AddPick=function(id,on){
  const picks=v274AddState().picks;
  on?picks.add(String(id)):picks.delete(String(id));
  v393UpdateCollectionSelectControls();
};
v274AddSelectVisible=function(){
  const c=v276CurrentAddCollection();if(!c)return;
  const state=v274AddState(),added=new Set((c.titleIds||[]).map(String));
  for(const item of v274AddCandidates(c).slice(state.page*24,(state.page+1)*24))if(!added.has(String(item.id)))state.picks.add(String(item.id));
  v393UpdateCollectionSelectControls();
};
v274AddDeselectAll=function(){v274AddState().picks.clear();v393UpdateCollectionSelectControls();};
Object.assign(App,{v274AddPick,v274AddSelectVisible,v274AddDeselectAll});

/* The Added state is actionable in all three v392 pickers. A title/Collection
 * remains visible in All mode; membership-specific filters can exclude it. */
v392ActionHtml=function(done,handler,label='Added'){
  const icon=done?V392_ICON_CHECK:V392_ICON_PLUS;
  return `<button type="button" data-v225-iconified="1" class="mf392-action ${done?'mf392-added':'mf392-add'} mf393-toggle" aria-label="${done?'Remove':'Add'} item${done?' from this destination':''}" title="${done?'Click to remove from this destination':'Click to add'}" onclick="${handler}">${icon}<span>${done?label:'Add'}</span></button>`;
};

// Collection membership changes must not affect underlying Library entries.
v392AddCollectionTitle=function(id){
  const c=v276CurrentAddCollection();if(!c)return;
  const tid=String(id),existing=(c.titleIds||[]).some(x=>String(x)===tid);
  if(!existing){const n=v392InsertCollectionTitles(c.id,[tid]);if(n)showToast('Added to collection ✓');return;}
  c.titleIds=c.titleIds.filter(x=>String(x)!==tid);
  c.order=(c.order||[]).filter(x=>String(x)!==tid);
  v274AddState().picks.delete(tid);
  v274TouchCollection(c);render();v392RefreshCollectionResults();v392Persist();
  showToast('Removed from collection ✓');
};
App.v392AddCollectionTitle=v392AddCollectionTitle;

// Personal Order title toggles update the canonical title ID queue, followed
// by its existing mixed-category reconciliation and cloud/local save path.
v392AddOrderTitle=function(id){
  const plan=v138EnsureOrderPlan(),tid=String(id||'');if(!tid)return;
  if(plan.titleIds.some(x=>String(x)===tid)){
    plan.titleIds=plan.titleIds.filter(x=>String(x)!==tid);
    v140EnsureOrderPickerUI().picks.delete(tid);
    v138TouchOrderPlan();showToast('Removed from Personal Order ✓');
  }else{
    if(!(S.library||[]).some(item=>String(item?.id||'')===tid))return;
    plan.titleIds.push(tid);v138TouchOrderPlan();showToast('Added to Personal Order ✓');
  }
  V392_ORDER_DIRTY=true;
  v141InvalidateOrderPickerCache();v141RefreshOrderPickerPageOnly();v392UpdateOrderPickerTools();
};
App.v392AddOrderTitle=v392AddOrderTitle;

// Collection assignments are category-scoped. Removing an assignment must
// preserve the Collection itself, its titles and all unrelated category queues.
v392AddAssignment=async function(id,categoryId){
  const plan=v287EnsureOrderExtensions(),cid=String(categoryId||''),colId=String(id||'');
  const collection=v287Collection(colId),cat=v138OrderCategory(cid);
  if(!collection||!cat)return;
  const assigned=plan.collectionAssignments.filter(a=>String(a.collectionId)===colId&&String(a.categoryId)===cid);
  if(assigned.length){
    const ids=new Set(assigned.map(a=>String(a.id)));
    plan.collectionAssignments=plan.collectionAssignments.filter(a=>!ids.has(String(a.id)));
    if(plan.categoryQueues?.[cid])plan.categoryQueues[cid]=plan.categoryQueues[cid].filter(t=>!ids.has(String(t).replace(/^c:/,'')));
    V392_ASSIGN_SELECTION.delete(v392AssignmentKey(colId,cid));
    showToast(`${collection.title} removed from Personal Order ✓`);
  }else{
    const now=Date.now();plan.collectionAssignments.push({id:v287Id(),collectionId:colId,categoryId:cid,categoryRule:'match',completedRule:'skip',createdAt:now,modifiedAt:now});
    showToast(`${collection.title} added to Personal Order ✓`);
  }
  v287ReconcileCategoryQueue(cid);
  const saving=v287Touch();V392_ORDER_DIRTY=true;
  v287RefreshCollectionPicker();v392UpdateAssignmentTools();
  Promise.resolve(saving).catch(err=>{console.error('[v393] assignment persistence',err);showToast('Could not save the Collection assignment.');});
};
App.v392AddAssignment=v392AddAssignment;

// Multi-select bulk operations must only ADD. The exposed toggle function
// intentionally removes an already assigned item, so reject stale selections.
v392CommitAssignments=async function(){
  const ui=v287OrderUI(),cat=String(ui.v287CollectionCategoryId||'');
  const ids=[...V392_ASSIGN_SELECTION].filter(k=>k.startsWith(cat+'\u0001')).map(k=>k.split('\u0001')[1]);
  for(const id of ids){
    if(!v287Assignments(cat).some(a=>String(a.collectionId)===String(id)))await v392AddAssignment(id,cat);
    V392_ASSIGN_SELECTION.delete(v392AssignmentKey(id,cat));
  }
  v287RefreshCollectionPicker();v392UpdateAssignmentTools();
};
App.v392CommitAssignments=v392CommitAssignments;

/* Logging → Library — clicking Added removes only the unsubmitted draft
 * entry, never historical logs, Library progress or an actual Library title.
 */
const v393LogSuggestionsBase=v224LogSuggestionsHtml;
v224LogSuggestionsHtml=function(){
  const html=String(v393LogSuggestionsBase.apply(this,arguments)||'');
  if(!html.includes('mf378-add-btn'))return html;
  const root=document.createElement('div');root.innerHTML=html;
  for(const row of root.querySelectorAll('.log-suggestion[data-mf378-id]')){
    const id=row.dataset.mf378Id,button=row.querySelector('.mf378-add-btn');if(!button)continue;
    const added=v378AddedIds().has(String(id));
    button.disabled=false;
    button.classList.add('mf393-toggle');button.classList.toggle('mf393-log-added',added);
    button.setAttribute('data-v225-iconified','1');
    button.setAttribute('aria-label',(added?'Remove from':'Add to')+' current Logging selection');
    button.setAttribute('onclick',`App.v393ToggleLoggingTitle(${JSON.stringify(id)})`);
    button.innerHTML=(added?V392_ICON_CHECK:V392_ICON_PLUS)+`<span>${added?'Added':'Add'}</span>`;
  }
  return root.innerHTML;
};
function v393ToggleLoggingTitle(id){
  const tid=String(id||'');if(!S.logDraft)return false;
  if(!v378AddedIds().has(tid)){
    return v393WithScroll(()=>App.v378QuickAdd(tid));
  }
  const entries=S.logDraft.entries||[];
  const next=entries.filter(entry=>String(entry?.libraryId||'')!==tid);
  if(next.length===entries.length)return false;
  return v393WithScroll(()=>{
    S.logDraft.entries=next;
    V378_LOG_UI.selected.delete(tid);
    if(S.logDraft.v369Interface==='itemized'&&typeof v369Sync==='function')v369Sync();
    else if(typeof v179SyncSingleFromEntries==='function')v179SyncSingleFromEntries();
    v369Touch();render();showToast('Removed from current Logging selection ✓');
    return true;
  });
}
App.v393ToggleLoggingTitle=v393ToggleLoggingTitle;

/* Personal Order edit modal: no layout or focus-induced page drift in Lists
 * (all/by-category) or Tabs (category titles/collection queues). */
const v393OrderEditOpenBase=App.openLibraryModal;
App.openLibraryModal=function(id){
  const guarding=S.view==='order'&&!!id;
  if(!guarding)return v393OrderEditOpenBase.apply(this,arguments);
  const snap=v393Snapshot();V393_ORDER_EDITOR_SNAPSHOT=snap;
  try{return v393OrderEditOpenBase.apply(this,arguments);}
  finally{v393KeepPosition(snap);}
};
const v393OrderEditSaveBase=App.saveLibraryModal;
App.saveLibraryModal=function(){
  const snap=S.view==='order'&&S.modal?.type==='library'?V393_ORDER_EDITOR_SNAPSHOT:null;
  try{return v393OrderEditSaveBase.apply(this,arguments);}
  finally{if(snap){V393_ORDER_EDITOR_SNAPSHOT=null;v393KeepPosition(snap);}}
};
const v393OrderEditCloseBase=App.closeModal;
App.closeModal=function(){
  const snap=S.view==='order'&&S.modal?.type==='library'?V393_ORDER_EDITOR_SNAPSHOT:null;
  try{return v393OrderEditCloseBase.apply(this,arguments);}
  finally{if(snap){V393_ORDER_EDITOR_SNAPSHOT=null;v393KeepPosition(snap);}}
};
// Suppress browser-induced scroll from pressing a mouse Edit button before the
// focused element is detached by the modal render. Keyboard activation remains.
document.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0||S.view!=='order')return;
  const button=event.target?.closest?.('button[onclick*="openLibraryModal"]');
  if(button?.closest?.('.v138-order-view,.mf345-main-panel,.v138-order-main'))event.preventDefault();
},true);

MediaFlowRuntime.version=V393_RELEASE;
window.MediaFlowV393={version:393,features:['Expanded Collections workspace','Collection Multi-Select scroll stability','Personal Order edit scroll stability','Reversible Add/Added toggles in Collections, Personal Order and Logging'],audit:()=>({version:393,collectionModal:!!document.getElementById('mf274-add-titles'),collectionPicks:v274AddState().picks.size,mode:v392Mode('collection'),loggingDraftEntries:S.logDraft?.entries?.length||0})};
