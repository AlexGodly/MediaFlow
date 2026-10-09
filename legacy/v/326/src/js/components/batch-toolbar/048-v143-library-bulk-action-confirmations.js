/* ============================================================
   MediaFlow v143 — Library bulk-action confirmations
   ------------------------------------------------------------
   v143 audit:
   - Empty Library already had a designed MediaFlow confirmation, so it is
     intentionally preserved unchanged.
   - Delete selected, Set status, Set priority and Move to previously executed
     immediately. They now require explicit designed confirmation.
   ============================================================ */

const v143BatchStatusBase=App.batchLibraryStatus;
const v143BatchPriorityBase=App.batchLibraryPriority;
const v143BatchCategoryBase=App.batchLibraryCategory;
const v143BatchDeleteBase=App.batchDeleteLibrary;

function v143SelectedLibraryCount(){
  return mfSelectedIds().length;
}

function v143StatusLabel(value){
  const map={
    planned:'Plan to Watch',
    active:'Watching',
    paused:'On Hold',
    completed:'Completed',
    dropped:'Dropped'
  };
  return map[String(value||'').toLowerCase()]||String(value||'');
}

function v143PriorityLabel(value){
  const map={low:'Low',medium:'Medium',high:'High'};
  return map[String(value||'').toLowerCase()]||String(value||'');
}

function v143LibraryBatchConfirmHtml(kind,value,count){
  const n=Math.max(0,Number(count)||0);
  const plural=n===1?'title':'titles';

  let icon='✓';
  let title='Confirm Library change';
  let action='Confirm';
  let target='';
  let description='';
  let detail='';
  let danger=false;

  if(kind==='status'){
    const label=v143StatusLabel(value);
    icon='◉';
    title='Change selected status?';
    action='Change status';
    target=label;
    description=`You are about to change the status of <b>${n.toLocaleString()} ${plural}</b>.`;
    detail=label==='Completed'
      ?'Titles changed to Completed will use MediaFlow’s existing completion behavior. Other selected titles keep their Library and History data.'
      :'Only the selected Library titles are affected. Your consumption History is not deleted.';
  }else if(kind==='priority'){
    const label=v143PriorityLabel(value);
    icon='◆';
    title='Change selected priority?';
    action='Change priority';
    target=label;
    description=`You are about to change the priority of <b>${n.toLocaleString()} ${plural}</b>.`;
    detail='This changes the selected Library titles only. History, progress and title ordering remain intact.';
  }else if(kind==='category'){
    const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(value||''));
    const label=cat?`${cat.icon||'📚'} ${cat.name}`:'Selected category';
    icon='↪';
    title='Move selected titles?';
    action='Move titles';
    target=label;
    description=`You are about to move <b>${n.toLocaleString()} ${plural}</b> to another category.`;
    detail='The titles stay in your Library. Progress and History remain intact; only their Library category changes.';
  }else if(kind==='delete'){
    icon='🗑️';
    title='Delete selected titles?';
    action='Delete selected';
    danger=true;
    description=`You are about to delete <b>${n.toLocaleString()} selected ${plural}</b> from your Library.`;
    detail='Consumption History remains intact. This Library batch change is tracked by Library History and can be undone from there.';
  }

  return `<div class="priority-modal v143-lib-confirm">
    <div class="v143-lib-confirm-icon">${icon}</div>
    <div class="modal-title">${escapeHtml(title)}</div>
    <div class="v143-lib-confirm-copy">${description}</div>
    <div class="v143-lib-confirm-box ${danger?'v143-lib-confirm-danger':''}">
      <b>${danger?'Library deletion':'Selected-title update'}</b><br>
      ${escapeHtml(detail)}
      ${target?`<div class="v143-lib-confirm-target">${escapeHtml(target)}</div>`:''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick="App.v143CancelLibraryBatch()">Cancel</button>
      <button class="btn ${danger?'btn-danger':'btn-primary'}" type="button" onclick="App.v143ConfirmLibraryBatch(this)">${escapeHtml(action)}</button>
    </div>
  </div>`;
}

function v143OpenLibraryBatchConfirm(kind,value=''){
  const ids=mfSelectedIds();
  if(!ids.length){
    showToast('Select at least one Library title first.');
    return;
  }

  if(kind==='status'&&!['planned','active','paused','completed','dropped'].includes(String(value||'')))return;
  if(kind==='priority'&&!['low','medium','high'].includes(String(value||'')))return;
  if(kind==='category'&&!(S.categories||[]).some(c=>String(c?.id||'')===String(value||'')))return;
  if(kind!=='delete'&&!value)return;

  S.v143PendingLibraryBatch={
    kind:String(kind||''),
    value:String(value||''),
    ids:[...ids]
  };

  const existing=document.getElementById('modal-root');
  if(existing)existing.remove();

  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.v143CancelLibraryBatch()"><div class="modal">${v143LibraryBatchConfirmHtml(kind,value,ids.length)}</div></div>`;
  document.body.appendChild(wrap);
}

function v143CancelLibraryBatch(){
  S.v143PendingLibraryBatch=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();
}

function v143RestorePendingSelection(ids){
  const valid=new Set((S.library||[]).map(i=>String(i?.id||'')));
  S.librarySelection=S.librarySelection||{};
  for(const key of Object.keys(S.librarySelection))S.librarySelection[key]=false;
  for(const id of (ids||[])){
    const sid=String(id||'');
    if(valid.has(sid))S.librarySelection[sid]=true;
  }
}

async function v143ConfirmLibraryBatch(button){
  if(button?.dataset?.working==='1')return;
  if(button){
    button.dataset.working='1';
    button.disabled=true;
  }

  const pending=S.v143PendingLibraryBatch;
  if(!pending){
    v143CancelLibraryBatch();
    return;
  }

  // Apply to the exact selection the user confirmed, even if some other UI
  // refresh happened while the dialog was open.
  v143RestorePendingSelection(pending.ids);

  const kind=pending.kind;
  const value=pending.value;
  const count=mfSelectedIds().length;

  S.v143PendingLibraryBatch=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();

  if(!count){
    showToast('The selected titles are no longer available.');
    render();
    return;
  }

  if(kind==='status'){
    v143BatchStatusBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} changed to ${v143StatusLabel(value)} ✓`);
  }else if(kind==='priority'){
    v143BatchPriorityBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} priority changed to ${v143PriorityLabel(value)} ✓`);
  }else if(kind==='category'){
    const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(value));
    v143BatchCategoryBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} moved to ${cat?.name||'category'} ✓`);
  }else if(kind==='delete'){
    v143BatchDeleteBase.call(App);
  }
}

// Final wrappers used by every Library bulk-control variant.
App.batchLibraryStatus=function(value){
  v143OpenLibraryBatchConfirm('status',value);
};
App.batchLibraryPriority=function(value){
  v143OpenLibraryBatchConfirm('priority',value);
};
App.batchLibraryCategory=function(value){
  v143OpenLibraryBatchConfirm('category',value);
};
App.batchDeleteLibrary=function(){
  v143OpenLibraryBatchConfirm('delete','');
};

Object.assign(App,{
  v143ConfirmLibraryBatch,
  v143CancelLibraryBatch
});



