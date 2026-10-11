/* ---------- Persistent deleted-title snapshots ---------- */
function v191Clone(value){
  try{return JSON.parse(JSON.stringify(value));}catch(_){return null;}
}
function v191DeletedItemsFromTransaction(){
  const tx=(S.undoStack||[])[(S.undoStack||[]).length-1];
  if(!tx?.before?.library||!tx?.after?.library)return [];
  const afterIds=new Set((tx.after.library||[]).map(i=>String(i?.id||'')));
  const out=[];
  for(const item of (tx.before.library||[])){
    const id=String(item?.id||'');
    if(!id||afterIds.has(id))continue;
    const copy=v191Clone(item);
    if(copy)out.push(copy);
  }
  return out;
}

/* Extend the existing rich activity logger rather than replacing its change,
   XP and exact-ID metadata. Future deletion entries receive complete snapshots. */
const v191ActivityBase=mfActivity;
mfActivity=function(action,detail){
  const deletedItems=v191DeletedItemsFromTransaction();
  v191ActivityBase.apply(this,arguments);
  if(deletedItems.length&&Array.isArray(S.activityLog)&&S.activityLog[0]){
    S.activityLog[0].deletedItems=deletedItems;
    S.activityLog[0].restoreVersion=191;
  }
};

function v191ActivityById(activityId){
  return (S.activityLog||[]).find(x=>String(x?.id||'')===String(activityId||''))||null;
}
function v191RestorableDeletedItem(activityId,itemId){
  const entry=v191ActivityById(activityId);
  if(!entry)return null;
  return (Array.isArray(entry.deletedItems)?entry.deletedItems:[]).find(i=>String(i?.id||'')===String(itemId||''))||null;
}
function v191LatestDeletionActivityByTitle(){
  const latest=new Map();
  for(const entry of (S.activityLog||[])){
    for(const item of (Array.isArray(entry?.deletedItems)?entry.deletedItems:[])){
      const id=String(item?.id||'');
      if(id&&!latest.has(id))latest.set(id,String(entry.id||''));
    }
  }
  return latest;
}
function v191RestoreCategoryFallback(item){
  const categories=S.categories||[];
  if(categories.some(c=>String(c?.id||'')===String(item?.categoryId||'')))return {item,changed:false};
  const fallback=categories.find(c=>c?.enabled!==false)||categories[0];
  if(!fallback)return {item,changed:false};
  item.categoryId=fallback.id;
  return {item,changed:true,categoryName:fallback.name||'available category'};
}
function v191RestoreOneSnapshot(snapshot){
  const copy=v191Clone(snapshot);
  if(!copy?.id)return {ok:false};
  if((S.library||[]).some(i=>String(i?.id||'')===String(copy.id)))return {ok:false,exists:true,item:copy};
  const fixed=v191RestoreCategoryFallback(copy);
  S.library.push(fixed.item);
  if(fixed.item.status==='completed'){
    S.completionTimeline=S.completionTimeline||[];
    if(!S.completionTimeline.some(x=>String(x?.libraryId||'')===String(fixed.item.id))){
      S.completionTimeline.push({
        libraryId:fixed.item.id,
        title:cleanTitle(fixed.item.title),
        categoryId:fixed.item.categoryId,
        completedAt:fixed.item.completedAt||Date.now()
      });
    }
  }
  return {ok:true,item:fixed.item,categoryChanged:fixed.changed,categoryName:fixed.categoryName};
}
async function v191RestoreDeletedTitle(activityId,itemId){
  const snapshot=v191RestorableDeletedItem(activityId,itemId);
  if(!snapshot){showToast('This deleted-title snapshot is not available.');return;}
  if((S.library||[]).some(i=>String(i?.id||'')===String(itemId||''))){showToast('That title is already restored.');render();return;}

  const title=cleanTitle(snapshot.title)||'Deleted title';
  mfBegin('Restore title',title);
  const result=v191RestoreOneSnapshot(snapshot);
  if(!result.ok){showToast(result.exists?'That title is already restored.':'Could not restore that title.');return;}
  normalizeSeasonalLibraryItems();
  try{v53InvalidateLibraryCache();}catch(_){ }
  mfCommit('Restore title',title);
  try{await persistLibrary();}catch(_){ }
  try{await saveState();}catch(_){ }
  render();
  showToast(result.categoryChanged?`Restored ${title} · original category was missing, moved to ${result.categoryName}`:`Restored ${title} ✓`);
}
async function v191RestoreDeletedGroup(activityId){
  const entry=v191ActivityById(activityId);
  const latest=v191LatestDeletionActivityByTitle();
  const snapshots=(Array.isArray(entry?.deletedItems)?entry.deletedItems:[]).filter(item=>{
    const id=String(item?.id||'');
    return id&&latest.get(id)===String(activityId||'')&&!(S.library||[]).some(x=>String(x?.id||'')===id);
  });
  if(!snapshots.length){showToast('All titles from this deletion are already restored.');render();return;}

  mfBegin('Restore deleted titles',`${snapshots.length} titles`);
  let restored=0,categoryFallbacks=0;
  for(const snapshot of snapshots){
    const r=v191RestoreOneSnapshot(snapshot);
    if(r.ok){restored++;if(r.categoryChanged)categoryFallbacks++;}
  }
  if(!restored){showToast('No titles could be restored.');return;}
  normalizeSeasonalLibraryItems();
  try{v53InvalidateLibraryCache();}catch(_){ }
  mfCommit('Restore deleted titles',`${restored} titles`);
  try{await persistLibrary();}catch(_){ }
  try{await saveState();}catch(_){ }
  render();
  showToast(`${restored.toLocaleString()} ${restored===1?'title':'titles'} restored${categoryFallbacks?` · ${categoryFallbacks} moved to available categories`:''} ✓`);
}
Object.assign(App,{v191RestoreDeletedTitle,v191RestoreDeletedGroup});

/* Library History now renders restoration controls for v191+ deletion entries.
   Only the newest deletion snapshot for a given Library ID is actionable, which
   avoids restoring stale older versions after a restore/re-delete cycle. */
function v191ActivityHtml(){
  const lookup=v50LibraryLookup();
  const latestDelete=v191LatestDeletionActivityByTitle();
  const rows=(S.activityLog||[]).slice(0,1000).map(x=>{
    const ids=v43FindLogTitles(x,lookup);
    const change=(x.changes||[]).map(c=>`<div>• <b>${escapeHtml(c.title)}</b> ${escapeHtml(c.kind)}${c.fields?.length?`<div>${c.fields.map(escapeHtml).join('<br>')}</div>`:''}</div>`).join('');
    const earned=Math.max(0,Number(x.xpEarned)||0);
    const xp=earned?`<div class="mf-activity-xp" title="XP earned by this Library action"><strong>+${earned.toLocaleString()} XP</strong> earned</div>`:'';

    const deleted=(Array.isArray(x.deletedItems)?x.deletedItems:[]).filter(i=>i?.id);
    const restoreRows=deleted.map(item=>{
      const id=String(item.id);
      const latest=latestDelete.get(id)===String(x.id||'');
      const exists=(S.library||[]).some(z=>String(z?.id||'')===id);
      const actionable=latest&&!exists;
      return `<div class="v191-restore-row">
        <span class="v191-restore-title">${escapeHtml(cleanTitle(item.title)||'Deleted title')}</span>
        <button type="button" class="btn btn-sm ${actionable?'':'btn-ghost'}" ${actionable?'':'disabled'}
          onclick="App.v191RestoreDeletedTitle('${escapeHtml(String(x.id||''))}','${escapeHtml(id)}')">
          ${exists?'Restored':actionable?'Restore title':'Older deletion'}
        </button>
      </div>`;
    }).join('');
    const restorableCount=deleted.filter(item=>{
      const id=String(item?.id||'');
      return id&&latestDelete.get(id)===String(x.id||'')&&!(S.library||[]).some(z=>String(z?.id||'')===id);
    }).length;
    const restoreBlock=deleted.length?`<div class="v191-restore-block">
      ${restoreRows}
      ${deleted.length>1&&restorableCount>1?`<button type="button" class="btn btn-sm btn-primary v191-restore-all" onclick="App.v191RestoreDeletedGroup('${escapeHtml(String(x.id||''))}')">Restore all deleted titles (${restorableCount})</button>`:''}
    </div>`:'';

    return `<div class="mf-activity-row"><div class="mf-activity-time">${new Date(x.timestamp).toLocaleString()}</div><div><b>${escapeHtml(x.action)}</b>${x.detail?`<div class="v43-log-detail">${escapeHtml(x.detail)}</div>`:''}${xp}${change?`<div class="v43-log-detail">${change}</div>`:''}${restoreBlock}${ids.length?`<div class="v43-log-actions">${ids.slice(0,5).map(id=>{const i=S.library.find(z=>z.id===id);return i?`<button class="btn btn-sm btn-ghost" onclick="App.openLibraryModal('${id}')">Edit ${escapeHtml(cleanTitle(i.title))}</button>`:''}).join('')}</div>`:''}</div></div>`;
  }).join('')||'<div class="empty-state">No library activity recorded yet.</div>';
  return `<div class="card"><div class="section-label">LIBRARY CHANGE LOG</div><div class="mf-activity" style="max-height:none">${rows}</div></div>`;
}
mfActivityHtml=v191ActivityHtml;

