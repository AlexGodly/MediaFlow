/* ============================================================
   MediaFlow v189 — Library sorting, unfinished filter, Dynamic
   bulk actions, Normal mode label + persistent Last Seen audit
   ============================================================ */

const V189_BACKUP_SCHEMA_VERSION=23;
const V189_CLOUD_SYNC_VERSION=189;
let V189_RANDOM_COUNTER=0;
let V189_SEEN_SAVE_TIMER=null;

function v189SortMode(){
  return String(S.histFilters?.libSort||'priority-desc');
}
function v189RandomSeed(){
  const raw=Number(S.histFilters?.libRandomSeed)||0;
  return raw||1;
}
function v189Hash(text){
  let h=2166136261>>>0;
  const s=String(text||'');
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  return h>>>0;
}
function v189RandomValue(item){
  return v189Hash(`${v189RandomSeed()}::${String(item?.id||item?.title||'')}`);
}
function v189IsUnfinished(item){
  if(!item)return false;
  if(String(item.status||'').toLowerCase()==='completed')return false;
  const total=Number(item.total);
  const progress=Math.max(0,Number(item.progress)||0);
  if(Number.isFinite(total)&&total>0&&progress>=total)return false;
  return true;
}
function v189UnfinishedOnly(){
  return !!S.histFilters?.libUnfinishedOnly;
}
function v189ToggleUnfinishedOnly(){
  S.histFilters=S.histFilters||{};
  S.histFilters.libUnfinishedOnly=!S.histFilters.libUnfinishedOnly;
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
}
function v189ShuffleLibraryRandom(){
  S.histFilters=S.histFilters||{};
  S.histFilters.libSort='random';
  S.histFilters.libRandomSeed=Date.now()+(++V189_RANDOM_COUNTER);
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
}

/* Final Library sort setter. Choosing Random always creates a fresh order. */
v69SetLibrarySort=function(v){
  S.histFilters=S.histFilters||{};
  const allowed=[
    'priority','priority-desc','priority-asc','title-asc','title-desc',
    'rating-desc','rating-asc','progress-desc','progress-asc','total-desc','total-asc',
    'logging-desc','logging-asc','edited-desc','edited-asc','seen-desc','seen-asc',
    'added-desc','added-asc','random'
  ];
  const next=allowed.includes(String(v))?String(v):'priority-desc';
  S.histFilters.libSort=next;
  if(next==='random')S.histFilters.libRandomSeed=Date.now()+(++V189_RANDOM_COUNTER);
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
};
App.v69SetLibrarySort=v69SetLibrarySort;

function v189CompareLibraryItems(a,b,sort){
  const ai=a?.item||a, bi=b?.item||b;
  const at=cleanTitle(ai?.title||'');
  const bt=cleanTitle(bi?.title||'');
  const titleCmp=()=>at.localeCompare(bt,undefined,{numeric:true,sensitivity:'base'});
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const rank={low:0,medium:1,high:2};
  let d=0;

  if(sort==='title-asc')return titleCmp();
  if(sort==='title-desc')return -titleCmp();
  if(sort==='priority-asc')d=(rank[String(ai?.priority||'medium')]??1)-(rank[String(bi?.priority||'medium')]??1);
  else if(sort==='priority-desc'||sort==='priority')d=(rank[String(bi?.priority||'medium')]??1)-(rank[String(ai?.priority||'medium')]??1);
  else if(sort==='rating-asc')d=n(ai?.rating)-n(bi?.rating);
  else if(sort==='rating-desc')d=n(bi?.rating)-n(ai?.rating);
  else if(sort==='progress-asc')d=n(ai?.progress)-n(bi?.progress);
  else if(sort==='progress-desc')d=n(bi?.progress)-n(ai?.progress);
  else if(sort==='total-asc')d=n(ai?.total)-n(bi?.total);
  else if(sort==='total-desc')d=n(bi?.total)-n(ai?.total);
  else if(sort==='logging-asc')d=n(v53LastTouched(ai))-n(v53LastTouched(bi));
  else if(sort==='logging-desc')d=n(v53LastTouched(bi))-n(v53LastTouched(ai));
  else if(sort==='edited-asc')d=n(ai?.modifiedAt||ai?.createdAt)-n(bi?.modifiedAt||bi?.createdAt);
  else if(sort==='edited-desc')d=n(bi?.modifiedAt||bi?.createdAt)-n(ai?.modifiedAt||ai?.createdAt);
  else if(sort==='seen-asc')d=n(ai?.lastSeenAt)-n(bi?.lastSeenAt);
  else if(sort==='seen-desc')d=n(bi?.lastSeenAt)-n(ai?.lastSeenAt);
  else if(sort==='added-asc')d=n(ai?.createdAt)-n(bi?.createdAt);
  else if(sort==='added-desc')d=n(bi?.createdAt)-n(ai?.createdAt);
  else if(sort==='random')d=v189RandomValue(ai)-v189RandomValue(bi);

  return d||titleCmp();
}

/* v53 cached Library filtering now understands the v189 filter + sorts. */
v53FilteredLibrary=function(catFilter,statusFilter,priorityFilter,q){
  v53EnsureLibraryIndex();
  const nq=String(q||'').trim().toLocaleLowerCase();
  const cats=Array.isArray(S.histFilters?.libCategories)?S.histFilters.libCategories:[];
  const sort=v189SortMode();
  const unfinished=v189UnfinishedOnly()?1:0;
  const seed=sort==='random'?v189RandomSeed():0;
  const key=[V53_LIB.libraryToken,S.library.length,catFilter,cats.slice().sort().join(','),statusFilter,priorityFilter,nq,sort,unfinished,seed].join('|');
  if(V53_LIB.filterKey===key)return V53_LIB.filtered;

  let rows=V53_LIB.searchIndex;
  if(cats.length)rows=rows.filter(x=>cats.includes(x.item.categoryId));
  else if(catFilter!=='all')rows=rows.filter(x=>x.item.categoryId===catFilter);
  if(statusFilter!=='all')rows=rows.filter(x=>x.item.status===statusFilter);
  if(priorityFilter!=='all')rows=rows.filter(x=>x.item.priority===priorityFilter);
  if(nq)rows=rows.filter(x=>x.search.includes(nq));
  if(unfinished)rows=rows.filter(x=>v189IsUnfinished(x.item));

  rows=rows.slice().sort((a,b)=>v189CompareLibraryItems(a,b,sort));
  V53_LIB.filterKey=key;
  V53_LIB.filtered=rows.map(x=>x.item);
  return V53_LIB.filtered;
};

/* Dynamic Library uses the same v189 sort semantics + unfinished filter. */
v181SortDynamicRows=function(rows){
  const sort=v189SortMode();
  return rows.slice().sort((a,b)=>v189CompareLibraryItems(a,b,sort));
};
v181DynamicRows=function(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const q=String(S.histFilters?.libSearch||'').trim().toLowerCase();
  const priority=String(S.histFilters?.libPriority||'all');
  let rows=(S.library||[]).filter(item=>
    item &&
    String(item.categoryId||'')===String(cfg.activeCategoryId||'') &&
    String(item.status||'planned')===String(cfg.activeStatus||'active')
  );
  if(priority!=='all')rows=rows.filter(item=>String(item.priority||'medium')===priority);
  if(v189UnfinishedOnly())rows=rows.filter(v189IsUnfinished);
  if(q){
    rows=rows.filter(item=>{
      const rich=[item.title,item.mediaFormat,item.mediaSource,item.demographic,item.year,
        ...(Array.isArray(item.genres)?item.genres:[]),...(Array.isArray(item.themes)?item.themes:[]),
        ...(Array.isArray(item.studios)?item.studios:[]),...(Array.isArray(item.tags)?item.tags:[])
      ].join(' ').toLowerCase();
      return rich.includes(q);
    });
  }
  return v181SortDynamicRows(rows);
};

function v189SortOptionsHtml(){
  const s=v189SortMode();
  const opt=(value,label,legacy=[])=>`<option value="${value}" ${[value,...legacy].includes(s)?'selected':''}>${label}</option>`;
  return [
    opt('priority-desc','Priority: High → Low',['priority']),
    opt('priority-asc','Priority: Low → High'),
    opt('title-asc','Title: A → Z'),
    opt('title-desc','Title: Z → A'),
    opt('rating-desc','Rating: High → Low'),
    opt('rating-asc','Rating: Low → High'),
    opt('progress-desc','Progress watched/read: Most → Least'),
    opt('progress-asc','Progress watched/read: Least → Most'),
    opt('total-asc','Total episodes/chapters: Ascending'),
    opt('total-desc','Total episodes/chapters: Descending'),
    opt('logging-desc','Last updated by logging: Newest → Oldest'),
    opt('logging-asc','Last updated by logging: Oldest → Newest'),
    opt('edited-desc','Last edited: Newest → Oldest'),
    opt('edited-asc','Last edited: Oldest → Newest'),
    opt('seen-desc','Last seen in Title Details: Newest → Oldest'),
    opt('seen-asc','Last seen in Title Details: Oldest → Newest'),
    opt('added-desc','Date added: Newest → Oldest'),
    opt('added-asc','Date added: Oldest → Newest'),
    opt('random','Random')
  ].join('');
}
function v189UnfinishedFilterHtml(){
  const on=v189UnfinishedOnly();
  return `<label class="v189-unfinished-filter" title="When enabled, fully watched/read/completed titles are hidden and only titles with progress remaining are shown.">
    <span>Hide watched/read</span>
    <button type="button" class="toggle ${on?'on':''}" onclick="event.preventDefault();App.v189ToggleUnfinishedOnly()" aria-label="Toggle unfinished titles only"></button>
    <b>${on?'ON':'OFF'}</b>
  </label>`;
}
function v189SortControlHtml(){
  return `<div class="v189-sort-control">
    <select onchange="App.v69SetLibrarySort(this.value)" aria-label="Library display order">${v189SortOptionsHtml()}</select>
    ${v189SortMode()==='random'?`<button type="button" class="btn btn-sm btn-ghost v189-shuffle-again" onclick="App.v189ShuffleLibraryRandom()">↻ Shuffle again</button>`:''}
  </div>${v189UnfinishedFilterHtml()}`;
}
function v189UpgradeSortControlHtml(html){
  return String(html||'').replace(
    /<select onchange="App\.v69SetLibrarySort\(this\.value\)"[^>]*>[\s\S]*?<\/select>/g,
    v189SortControlHtml()
  );
}

/* Persistent Last Seen timestamp: opening Title Details marks the title as seen. */
function v189MarkTitleSeen(id){
  const item=(S.library||[]).find(row=>String(row?.id||'')===String(id||''));
  if(!item)return;
  const now=Date.now();
  if(now-Number(item.lastSeenAt||0)<750)return;
  item.lastSeenAt=now;
  try{v53InvalidateLibraryCache();}catch(_){}
  clearTimeout(V189_SEEN_SAVE_TIMER);
  V189_SEEN_SAVE_TIMER=setTimeout(()=>{
    try{persistLibrary();}catch(_){}
  },700);
}
const v189OpenTitleDetailsBase=v181OpenTitleDetails;
v181OpenTitleDetails=function(id){
  v189MarkTitleSeen(id);
  return v189OpenTitleDetailsBase.apply(this,arguments);
};
App.v181OpenTitleDetails=v181OpenTitleDetails;

/* Make the Last Seen field merge-safe across devices. */
const v189MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v189MergeLibraryItemBase.apply(this,arguments);
  if(out)out.lastSeenAt=Math.max(Number(left?.lastSeenAt)||0,Number(right?.lastSeenAt)||0,Number(out.lastSeenAt)||0)||null;
  return out;
};

/* Common manual Library edits should update Last Edited. */
for(const name of ['setPriorityChoice','setLibraryStatus','setLibraryCategory']){
  const base=App[name];
  if(typeof base!=='function')continue;
  App[name]=function(id,value){
    const result=base.apply(this,arguments);
    const item=(S.library||[]).find(row=>String(row?.id||'')===String(id||''));
    if(item){
      item.modifiedAt=Date.now();
      try{v53InvalidateLibraryCache();}catch(_){}
      try{persistLibrary();}catch(_){}
      if(['edited-asc','edited-desc'].includes(v189SortMode()))render();
    }
    return result;
  };
}
const v189BatchConfirmBase=App.v143ConfirmLibraryBatch;
if(typeof v189BatchConfirmBase==='function'){
  App.v143ConfirmLibraryBatch=async function(button){
    const pending=S.v143PendingLibraryBatch;
    const ids=Array.isArray(pending?.ids)?pending.ids.slice():[];
    const kind=String(pending?.kind||'');
    const result=await v189BatchConfirmBase.apply(this,arguments);
    if(['status','priority','category'].includes(kind)&&ids.length){
      const now=Date.now();
      const set=new Set(ids.map(String));
      for(const item of (S.library||[]))if(set.has(String(item?.id||'')))item.modifiedAt=now;
      try{v53InvalidateLibraryCache();}catch(_){}
      try{await persistLibrary();}catch(_){}
      if(['edited-asc','edited-desc'].includes(v189SortMode()))render();
    }
    return result;
  };
}

/* Dynamic Library batch selection helpers work in every display mode. */
function v189DynamicVisibleRows(){
  const rows=v181DynamicRows();
  const pageSize=v175PageSize('library');
  const maxPage=Math.max(0,Math.ceil(rows.length/pageSize)-1);
  S.libPage=Math.max(0,Math.min(Math.floor(Number(S.libPage)||0),maxPage));
  return rows.slice(S.libPage*pageSize,S.libPage*pageSize+pageSize);
}
function v189SelectDynamicVisible(){
  S.librarySelection=S.librarySelection||{};
  for(const item of v189DynamicVisibleRows())S.librarySelection[item.id]=true;
  render();
}
function v189SelectDynamicAllMatching(){
  S.librarySelection=S.librarySelection||{};
  for(const item of v181DynamicRows())S.librarySelection[item.id]=true;
  render();
}
function v189DynamicBatchBarHtml(){
  const n=mfSelectedIds().length;
  return `<div class="mf-batchbar v189-dynamic-batchbar">
    <div class="v189-batch-left">
      <button type="button" class="btn btn-sm" onclick="App.v189SelectDynamicVisible()">Select visible</button>
      <button type="button" class="btn btn-sm" onclick="App.v189SelectDynamicAllMatching()">Select all matching</button>
      <button type="button" class="btn btn-sm" onclick="App.deselectAllLibrary()">Deselect all</button>
      <button type="button" class="btn btn-sm" ${n?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button>
    </div>
    <b>${n.toLocaleString()} selected</b><span class="spacer"></span>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryCategory(this.value);this.value=''}"><option value="">Move to…</option>${(S.categories||[]).map(c=>`<option value="${escapeHtml(String(c.id))}">${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select>
    <button type="button" class="btn btn-sm btn-danger" ${n?'':'disabled'} onclick="App.batchDeleteLibrary()">Delete selected</button>
  </div>`;
}

/* Covers/Covers + titles get selection checkboxes in Dynamic mode too. */
const v189DynamicTileBase=v181DynamicTileHtml;
v181DynamicTileHtml=function(item,mode){
  if(mode==='covers'||mode==='covers-title'){
    return `<div class="v181-cover-tile v189-selectable-cover" data-library-id="${escapeHtml(String(item.id))}">
      <label class="v189-cover-select" onclick="event.stopPropagation()" title="Select title">
        <input type="checkbox" class="mf-select" data-mf-select="${escapeHtml(String(item.id))}" ${S.librarySelection?.[item.id]?'checked':''}
          onchange="event.stopPropagation();App.toggleLibrarySelect('${escapeHtml(String(item.id))}',this.checked)">
      </label>
      ${v181DynamicCoverHtml(item)}
      ${mode==='covers-title'?`<div class="v181-cover-tile-title">${escapeHtml(cleanTitle(item.title))}</div>`:''}
    </div>`;
  }
  return v189DynamicTileBase.apply(this,arguments);
};

/* Rename the user-facing Current Library mode to Normal. Internal 'classic'
   identifiers stay unchanged for complete backward compatibility. */
v181LibraryModeSwitchHtml=function(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  return `<div class="v181-library-mode-switch">
    <span class="hint">Library mode:</span>
    <button type="button" class="btn btn-sm ${cfg.mode==='classic'?'active':''}" onclick="App.v181SetLibraryMode('classic')">Normal</button>
    <button type="button" class="btn btn-sm ${cfg.mode==='dynamic'?'active':''}" onclick="App.v181SetLibraryMode('dynamic')">Dynamic</button>
  </div>`;
};

Object.assign(App,{
  v189ToggleUnfinishedOnly,
  v189ShuffleLibraryRandom,
  v189SelectDynamicVisible,
  v189SelectDynamicAllMatching
});

/* Final Library HTML pass: new sort/filter controls + Dynamic batch bar. */
const v189RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v189RenderLibraryBase.apply(this,arguments);
  h=v189UpgradeSortControlHtml(h);
  h=h.replace(/both Current and Dynamic Library modes/g,'both Normal and Dynamic Library modes');
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.mode==='dynamic'&&!h.includes('v189-dynamic-batchbar')){
    h=h.replace('<div class="v181-dynamic-nav">',v189DynamicBatchBarHtml()+'<div class="v181-dynamic-nav">');
  }
  return h;
};

/* When sorting by Last Seen, closing Title Details immediately reveals the
   newly updated order without interrupting the details popup while it is open. */
const v189CloseTitleDetailsBase=v181CloseTitleDetails;
v181CloseTitleDetails=function(){
  const result=v189CloseTitleDetailsBase.apply(this,arguments);
  if(['seen-asc','seen-desc'].includes(v189SortMode()))render();
  return result;
};
App.v181CloseTitleDetails=v181CloseTitleDetails;

/* Settings copy follows the new Normal / Dynamic naming. */
const v189RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v189RenderSettingsBase.apply(this,arguments);
  h=h.replace(/Current keeps the existing Library workflow\./g,'Normal keeps the existing Library workflow.');
  h=h.replace(/both Current and Dynamic Library modes/g,'both Normal and Dynamic Library modes');
  return h;
};

/* v189 cloud / backup audit. */
const v189SnapshotBase=snapshot;
snapshot=function(){
  const out=v189SnapshotBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V189_CLOUD_SYNC_VERSION);
  return out;
};
const v189MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v189MergeStatesBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V189_CLOUD_SYNC_VERSION);
  return out;
};
function v189LastSeenMismatch(cloudState,expected){
  const cloud=new Map((cloudState?.library||[]).map(i=>[String(i?.id||''),Number(i?.lastSeenAt)||0]));
  for(const item of (expected?.library||[])){
    const id=String(item?.id||'');
    if(!id)continue;
    if((Number(item?.lastSeenAt)||0)!==(cloud.get(id)||0))return true;
  }
  return false;
}
const v189VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v189VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  if(v189LastSeenMismatch(cloudState,expected))problems.push('Library last-seen timestamps');
  if(Number(cloudState?.cloudSyncVersion||0)<V189_CLOUD_SYNC_VERSION)problems.push('v189 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v189BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v189BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V189_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V189_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v189 backup. Adds persistent Title Details last-seen timestamps used by Library sorting, expanded Library sorting (logging update, last edit, last seen, date added, totals and random), unfinished-only filtering, Dynamic Library bulk actions/selection, and the Normal/Dynamic Library naming update. Preserves all v188 Library Overview/title-size settings, the v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data.';
  return payload;
};
const v189BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v189BackupManifestBase.apply(this,arguments);
  const seen=(state?.library||[]).filter(i=>Number(i?.lastSeenAt)>0).length;
  manifest.schemaVersion=V189_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    expandedLibrarySorting:true,
    randomLibrarySort:true,
    unfinishedOnlyLibraryFilter:true,
    titleDetailsLastSeenTracking:true,
    dynamicLibraryBulkActions:true,
    normalDynamicLibraryNaming:true,
    v189CloudSyncAudit:true
  });
  manifest.v189={
    cloudSyncVersion:V189_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V189_BACKUP_SCHEMA_VERSION,
    titlesWithLastSeenTimestamp:seen
  };
  return manifest;
};


/* ============================================================
   MediaFlow v190 — Shared Normal / Dynamic Library batch toolbar
   v189 added the full toolbar to Dynamic Library. v190 exposes the
   same workflow in Normal Library without changing selection data.
   ============================================================ */
function v190NormalLibraryBatchBarHtml(){
  const n=mfSelectedIds().length;
  return `<div class="mf-batchbar v189-dynamic-batchbar v190-normal-batchbar">
    <div class="v189-batch-left">
      <button type="button" class="btn btn-sm" onclick="App.selectVisibleLibrary(true)">Select visible</button>
      <button type="button" class="btn btn-sm" onclick="App.selectAllLibrary()">Select all matching</button>
      <button type="button" class="btn btn-sm" onclick="App.deselectAllLibrary()">Deselect all</button>
      <button type="button" class="btn btn-sm" ${n?'':'disabled'} onclick="App.v69RepairSelectedCompleted()">Fix completed progress</button>
    </div>
    <b>${n.toLocaleString()} selected</b><span class="spacer"></span>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryStatus(this.value);this.value=''}"><option value="">Set status…</option><option value="planned">Plan to Watch</option><option value="active">Watching</option><option value="paused">On Hold</option><option value="completed">Completed</option><option value="dropped">Dropped</option></select>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryPriority(this.value);this.value=''}"><option value="">Set priority…</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
    <select style="width:auto" onchange="if(this.value){App.batchLibraryCategory(this.value);this.value=''}"><option value="">Move to…</option>${(S.categories||[]).map(c=>`<option value="${escapeHtml(String(c.id))}">${v144CategoryIconText(c)} ${escapeHtml(c.name)}</option>`).join('')}</select>
    <button type="button" class="btn btn-sm btn-danger" ${n?'':'disabled'} onclick="App.batchDeleteLibrary()">Delete selected</button>
  </div>`;
}

const v190RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v190RenderLibraryBase.apply(this,arguments);
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  if(cfg.mode==='classic'&&!h.includes('v190-normal-batchbar')){
    const overviewToggle=v183LibraryOverviewToggleHtml();
    const batch=v190NormalLibraryBatchBarHtml();

    // Place the toolbar immediately before the shared Library Overview control,
    // matching Dynamic Library's prominent management position.
    if(h.includes(overviewToggle)){
      h=h.replace(overviewToggle,batch+overviewToggle);
    }else if(h.includes('<div class="lib-toolbar">')){
      h=h.replace('<div class="lib-toolbar">',batch+'<div class="lib-toolbar">');
    }else{
      h=batch+h;
    }
  }

  return h;
};

/* v190 is a rendering/workflow parity release. It adds no new persistent
   fields, so v189 cloud state + Full Backup schema v23 remain canonical. */
const v190BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v190BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V189_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v190 backup. Adds Normal/Dynamic Library batch-toolbar parity while preserving the v189 persistent Library last-seen data, v188 Overview/title-size settings, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data. v190 adds no new persistent fields; Full Backup schema remains v23 and Cloud Sync remains v189-compatible.';
  return payload;
};
const v190BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v190BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    normalLibraryBulkActions:true,
    dynamicLibraryBulkActions:true,
    sharedNormalDynamicBatchToolbar:true
  });
  manifest.v190={
    sharedLibraryBatchToolbar:true,
    persistentSchemaChanged:false,
    cloudSyncVersion:V189_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V189_BACKUP_SCHEMA_VERSION
  };
  return manifest;
};

/* ============================================================
   MediaFlow v191 — Clean Covers + Restorable Deleted Titles
   - Clean Covers hides cover-view selection squares in Normal/Dynamic Library
   - Deleted Library titles store restorable snapshots in Library History
   - Restore title / Restore all actions are persisted through cloud + backups
   ============================================================ */
const V191_CLOUD_SYNC_VERSION=191;
const V191_BACKUP_SCHEMA_VERSION=24;

function v191NormalizeLibrarySettings(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    cleanCovers:!!src.cleanCovers,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}
function v191EnsureLibrarySettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v191Library=v191NormalizeLibrarySettings(settings.v191Library);
  return settings.v191Library;
}
function v191CleanCoversEnabled(){
  return !!v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).cleanCovers;
}
function v191IsCoverView(){
  const mode=String(S.settings?.libraryView||'list');
  return mode==='covers'||mode==='covers-title';
}
function v191CoverSelectionLocked(){
  return v191CleanCoversEnabled()&&v191IsCoverView();
}
function v191CleanCoversControlHtml(){
  const on=v191CleanCoversEnabled();
  return `<label class="v191-clean-covers-control" title="Hide title-selection squares in Covers and Covers + titles. Turn this off when you want to select covers.">
    <span>Clean Covers</span>
    <button type="button" class="toggle ${on?'on':''}" onclick="event.preventDefault();App.v191ToggleCleanCovers()" aria-label="Toggle Clean Covers"></button>
    <b>${on?'ON':'OFF'}</b>
  </label>`;
}
function v191ToggleCleanCovers(){
  const cfg=v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  cfg.cleanCovers=!cfg.cleanCovers;
  cfg.modifiedAt=Date.now();
  if(cfg.cleanCovers&&v191IsCoverView())S.librarySelection={};
  persistSettings();
  render();
  showToast(cfg.cleanCovers?'Clean Covers enabled · selection squares hidden':'Clean Covers disabled · cover selection restored');
}
function v191GuardCoverSelection(){
  if(!v191CoverSelectionLocked())return false;
  showToast('Turn off Clean Covers to select titles in cover view.');
  return true;
}

Object.assign(App,{v191ToggleCleanCovers});

/* Selection APIs are guarded only while a cover-based view is active. List,
   Compact and Cards retain their normal selection workflow. */
for(const name of ['toggleLibrarySelect','selectVisibleLibrary','selectAllLibrary','v189SelectDynamicVisible','v189SelectDynamicAllMatching']){
  const base=App[name];
  if(typeof base!=='function')continue;
  App[name]=function(...args){
    if(v191GuardCoverSelection())return;
    return base.apply(this,args);
  };
}

/* Switching into a cover view while Clean Covers is enabled clears any old
   hidden selection so batch actions can never operate on invisible checks. */
const v191SetLibraryViewBase=App.setLibraryView;
if(typeof v191SetLibraryViewBase==='function'){
  App.setLibraryView=function(mode){
    if(v191CleanCoversEnabled()&&(mode==='covers'||mode==='covers-title'))S.librarySelection={};
    return v191SetLibraryViewBase.apply(this,arguments);
  };
}

/* Add the shared Clean Covers control to both Normal and Dynamic Library. */
const v191RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v191RenderLibraryBase.apply(this,arguments);
  const control=v191CleanCoversControlHtml();
  if(!h.includes('v191-clean-covers-control')){
    const titleControl=v188TitleTextControlHtml();
    if(h.includes(titleControl))h=h.replace(titleControl,titleControl+control);
    else{
      const coverControl=v181InlineCoverControl('library','Cover size');
      if(h.includes(coverControl))h=h.replace(coverControl,coverControl+control);
      else if(h.includes('<div class="lib-toolbar">'))h=h.replace('<div class="lib-toolbar">',control+'<div class="lib-toolbar">');
      else h=control+h;
    }
  }
  return `<div class="v191-clean-covers-scope ${v191CleanCoversEnabled()?'v191-clean-covers':''}">${h}</div>`;
};

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

/* ---------- Persistence / cloud / backup ---------- */
DEFAULT_SETTINGS.v191Library=v191NormalizeLibrarySettings(DEFAULT_SETTINGS.v191Library);
v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

const v191PersistSettingsBase=persistSettings;
persistSettings=function(){v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);return v191PersistSettingsBase.apply(this,arguments);};
const v191LoadAllBase=loadAll;
loadAll=async function(){await v191LoadAllBase.apply(this,arguments);v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);};
const v191ApplyStateBase=v46ApplyState;
v46ApplyState=function(){const r=v191ApplyStateBase.apply(this,arguments);v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);return r;};

const v191SnapshotBase=snapshot;
snapshot=function(){
  v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const out=v191SnapshotBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V191_CLOUD_SYNC_VERSION);
  return out;
};
const v191MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v191MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const left=v191NormalizeLibrarySettings(a?.settings?.v191Library);
  const right=v191NormalizeLibrarySettings(b?.settings?.v191Library);
  out.settings.v191Library=(right.modifiedAt>left.modifiedAt)?right:left;
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V191_CLOUD_SYNC_VERSION);
  return out;
};

function v191HashString(text){
  let h=2166136261>>>0;
  const s=String(text||'');
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
function v191StableValue(value){
  if(Array.isArray(value))return value.map(v191StableValue);
  if(value&&typeof value==='object'){
    const out={};
    for(const key of Object.keys(value).sort())out[key]=v191StableValue(value[key]);
    return out;
  }
  return value;
}
function v191DeletedArchiveAudit(state){
  const rows=[];
  let count=0;
  for(const entry of (state?.activityLog||[])){
    const items=Array.isArray(entry?.deletedItems)?entry.deletedItems:[];
    for(const item of items){
      if(!item?.id)continue;
      count++;
      rows.push(`${entry?.id||''}:${item.id}:${JSON.stringify(v191StableValue(item))}`);
    }
  }
  rows.sort();
  return {count,hash:v191HashString(rows.join('|'))};
}
const v191VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v191VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v191NormalizeLibrarySettings(cloudState?.settings?.v191Library);
  const expectedCfg=v191NormalizeLibrarySettings(expected?.settings?.v191Library);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(expectedCfg))problems.push('Clean Covers setting');
  const ca=v191DeletedArchiveAudit(cloudState),ea=v191DeletedArchiveAudit(expected);
  if(ca.count!==ea.count||ca.hash!==ea.hash)problems.push('Restorable deleted-title Library History');
  if(Number(cloudState?.cloudSyncVersion||0)<V191_CLOUD_SYNC_VERSION)problems.push('v191 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v191BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v191EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const payload=v191BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V191_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V191_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v191 backup. Adds persistent Clean Covers preference for Normal/Dynamic cover views and complete restorable snapshots for Library title deletions, including Restore title / Restore all controls in Library History. Preserves v189 Last Seen data, v188 Library Overview/title-size settings, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data.';
  return payload;
};
const v191BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v191BackupManifestBase.apply(this,arguments);
  const cfg=v191NormalizeLibrarySettings(state?.settings?.v191Library);
  const audit=v191DeletedArchiveAudit(state);
  manifest.schemaVersion=V191_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    cleanCovers:true,
    restorableDeletedTitles:true,
    restoreDeletedTitleFromLibraryHistory:true,
    restoreDeletedBatchFromLibraryHistory:true,
    v191CloudSyncAudit:true
  });
  manifest.v191={
    cloudSyncVersion:V191_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V191_BACKUP_SCHEMA_VERSION,
    cleanCovers:cfg.cleanCovers,
    restorableDeletedTitleSnapshots:audit.count,
    deletedArchiveHash:audit.hash
  };
  return manifest;
};

/* ============================================================
   MediaFlow v192
   - Dashboard section visibility controls
   - Show/hide Today's Balance
   - Show/hide Rate Your Library
   - New Missing Covers queue under Rating Queue
   - Full Backup schema v25 + Cloud Sync audit v192
   ============================================================ */

const V192_BACKUP_SCHEMA_VERSION=26;
const V192_CLOUD_SYNC_VERSION=193;
const V192_DASHBOARD_DEFAULT={
  showTodayBalance:true,
  showRatingQueue:true,
  showMissingCovers:true,
  showStopwatch:true,
  modifiedAt:0
};

function v192NormalizeDashboardSettings(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    showTodayBalance:src.showTodayBalance!==false,
    showRatingQueue:src.showRatingQueue!==false,
    showMissingCovers:src.showMissingCovers!==false,
    showStopwatch:src.showStopwatch!==false,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v192EnsureDashboardSettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v192Dashboard=v192NormalizeDashboardSettings(settings.v192Dashboard);
  return settings.v192Dashboard;
}

function v192ToggleDashboardSection(key){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(!['showTodayBalance','showRatingQueue','showMissingCovers','showStopwatch'].includes(key))return;
  cfg[key]=!cfg[key];
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  const labels={
    showTodayBalance:"Today's Balance",
    showRatingQueue:'Rate Your Library',
    showMissingCovers:'Missing Covers',
    showStopwatch:'Stopwatch'
  };
  showToast(`${labels[key]} ${cfg[key]?'shown':'hidden'} on Dashboard`);
}

Object.assign(App,{v192ToggleDashboardSection});

/* ---------- Missing Covers queue ---------- */
let V192_MISSING_COVER_QUEUE=[];
let V192_MISSING_COVER_QUEUE_LOADED=false;

function v192MissingCoverStorageKey(){
  return `mf_missing_cover_queue_v192_${String(AUTH_USER?.id||'local')}`;
}
function v192LoadMissingCoverQueue(){
  if(V192_MISSING_COVER_QUEUE_LOADED)return;
  V192_MISSING_COVER_QUEUE_LOADED=true;
  try{
    const raw=localStorage.getItem(v192MissingCoverStorageKey());
    const parsed=raw?JSON.parse(raw):[];
    V192_MISSING_COVER_QUEUE=Array.isArray(parsed)?parsed.map(String).filter(Boolean):[];
  }catch(_){V192_MISSING_COVER_QUEUE=[];}
}
function v192SaveMissingCoverQueue(){
  try{localStorage.setItem(v192MissingCoverStorageKey(),JSON.stringify(V192_MISSING_COVER_QUEUE));}catch(_){}
}
function v192MissingCoverItems(){
  return (S.library||[]).filter(item=>item?.id&&!String(item.coverUrl||'').trim());
}
function v192SyncMissingCoverQueue(){
  v192LoadMissingCoverQueue();
  const missing=v192MissingCoverItems();
  const valid=new Set(missing.map(item=>String(item.id)));
  V192_MISSING_COVER_QUEUE=V192_MISSING_COVER_QUEUE.map(String).filter(id=>valid.has(id));
  const present=new Set(V192_MISSING_COVER_QUEUE);
  for(const item of missing){
    const id=String(item.id);
    if(!present.has(id)){
      V192_MISSING_COVER_QUEUE.push(id);
      present.add(id);
    }
  }
  v192SaveMissingCoverQueue();
  return missing;
}
function v192CurrentMissingCoverItem(){
  v192SyncMissingCoverQueue();
  const id=V192_MISSING_COVER_QUEUE[0];
  return id?(S.library||[]).find(item=>String(item?.id||'')===String(id)):null;
}
function v192MissingCoversHtml(){
  const missing=v192SyncMissingCoverQueue();
  if(!(S.library||[]).length){
    return `<div class="card v123-rating-queue v192-missing-covers"><div class="section-label">MISSING COVERS</div><div class="v123-rating-done"><b>No Library titles yet</b><span>Add titles to your Library and titles without cover URLs will appear here.</span></div></div>`;
  }
  if(!missing.length){
    return `<div class="card v123-rating-queue v192-missing-covers"><div class="section-label">MISSING COVERS</div><div class="v123-rating-done"><b>Every Library title has a cover ✓</b><span>If a cover URL is removed later, that title will automatically appear here.</span></div></div>`;
  }
  const item=v192CurrentMissingCoverItem();
  if(!item)return '';
  const cat=getCategory(item.categoryId);
  const progress=item.total!=null
    ? `${Number(item.progress)||0}/${Number(item.total)||0}`
    : `${Number(item.progress)||0} ${unitLabel(cat?.unit||'units',Number(item.progress)||0)}`;
  return `<div class="card v123-rating-queue v192-missing-covers">
    <div class="v123-rating-head">
      <div><div class="section-label">MISSING COVERS</div><div class="v192-missing-sub">Add cover URLs to titles that currently have no artwork.</div></div>
      <div class="v123-rating-count">${missing.length.toLocaleString()} title${missing.length===1?'':'s'} without covers</div>
    </div>
    <div class="v123-rating-main">
      <button type="button" class="v123-rating-placeholder v186-rating-placeholder-button v192-cover-placeholder" title="Open title details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')">${v144CategoryIconHtml(cat)}</button>
      <div class="v123-rating-copy">
        <div class="v123-rating-title">${escapeHtml(cleanTitle(item.title))}</div>
        <div class="v123-rating-meta">${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Library')} · ${escapeHtml(v123StatusLabel(item.status))} · ${escapeHtml(progress)}</div>
        <div class="v192-cover-control">
          <div class="field v192-cover-url-field"><label class="field-label">COVER URL</label><input id="v192-cover-url-input" type="url" placeholder="Paste cover image URL" onkeydown="if(event.key==='Enter'){event.preventDefault();App.v192SaveMissingCover()}"></div>
          <div class="v123-rating-actions v192-cover-actions">
            <button type="button" class="btn btn-ghost" onclick="App.openLibraryModal('${escapeHtml(String(item.id))}')">Edit title</button>
            <button type="button" class="btn btn-ghost" onclick="App.v192SkipMissingCover()">Skip</button>
            <button type="button" class="btn btn-primary" onclick="App.v192SaveMissingCover()">Save cover & Next</button>
          </div>
        </div>
        <div class="v123-rating-xp">Paste a cover URL directly here, or use Edit title for MediaFlow's full cover search/editor. Skip moves this title behind the rest of the missing-cover queue.</div>
      </div>
    </div>
  </div>`;
}
function v192SkipMissingCover(){
  v192SyncMissingCoverQueue();
  if(!V192_MISSING_COVER_QUEUE.length)return;
  const first=V192_MISSING_COVER_QUEUE.shift();
  V192_MISSING_COVER_QUEUE.push(first);
  v192SaveMissingCoverQueue();
  render();
  showToast(V192_MISSING_COVER_QUEUE.length>1?'Skipped for now · this title will return after the rest of the queue':'Skipped · this is the only title without a cover');
}
function v192SaveMissingCover(){
  const item=v192CurrentMissingCoverItem();
  if(!item)return;
  const input=document.getElementById('v192-cover-url-input');
  const cover=String(input?.value||'').trim();
  if(!cover){
    showToast('Paste a cover URL first.');
    try{input?.focus();}catch(_){}
    return;
  }
  const oldCover=String(item.coverUrl||'').trim();
  const beforeXP=mediaFlowXP();
  mfBegin('Add cover',cleanTitle(item.title));
  item.coverUrl=cover;
  item.coverSource='manual';
  item.modifiedAt=Date.now();
  if(typeof V178_EDITABLE_RICH_FIELDS!=='undefined'&&V178_EDITABLE_RICH_FIELDS.includes('coverUrl')){
    item.richMetadataManual=typeof v178ManualMap==='function'?v178ManualMap(item):(item.richMetadataManual||{});
    item.richMetadataManual.coverUrl=true;
  }
  if(cover!==oldCover){
    try{v44AwardEditXP(item.id);}catch(_){}
    try{v44AwardManualCoverXP(item.id);}catch(_){}
  }
  mfCommit('Add cover',`${cleanTitle(item.title)} · manual cover URL`);
  V192_MISSING_COVER_QUEUE=V192_MISSING_COVER_QUEUE.filter(id=>String(id)!==String(item.id));
  v192SaveMissingCoverQueue();
  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();
  const gained=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
  render();
  showToast(`Cover saved${gained?` · +${gained.toLocaleString()} XP`:''} ✓`);
}
Object.assign(App,{v192SkipMissingCover,v192SaveMissingCover});

/* Rate Your Library visibility uses the existing queue without altering it. */
const v192RatingQueueHtmlBase=v123RatingQueueHtml;
v123RatingQueueHtml=function(){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  return cfg.showRatingQueue===false?'':v192RatingQueueHtmlBase.apply(this,arguments);
};

/* Existing stopwatchHtml already ends with Rate Your Library, so append the new
   Missing Covers card here to keep it directly underneath the rating section. */
const v192StopwatchHtmlBase=stopwatchHtml;
stopwatchHtml=function(){
  let h=v192StopwatchHtmlBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showMissingCovers!==false)h+=v192MissingCoversHtml();
  return h;
};

/* Today's Balance is rendered by the original Dashboard renderer. Remove only
   that section when disabled, leaving the rest of Dashboard untouched. */
const v192RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  const html=v192RenderDashboardBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showTodayBalance!==false)return html;
  const host=document.createElement('div');
  host.innerHTML=html;
  const label=[...host.querySelectorAll('.section-label')].find(el=>String(el.textContent||'').trim().toUpperCase()==="TODAY'S BALANCE");
  if(label){
    const head=label.parentElement;
    const next=head?.nextElementSibling;
    if(next?.classList?.contains('card'))next.remove();
    head?.remove();
  }
  return host.innerHTML;
};

/* ---------- Settings UI ---------- */
function v192DashboardVisibilitySettingsHtml(){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const row=(key,title,desc)=>`<div class="v192-dashboard-toggle-row"><div><b>${escapeHtml(title)}</b><div class="hint">${escapeHtml(desc)}</div></div><button type="button" class="toggle ${cfg[key]!==false?'on':''}" onclick="App.v192ToggleDashboardSection('${key}')" aria-label="Toggle ${escapeHtml(title)}"></button></div>`;
  return `<div class="card v192-dashboard-settings-card">
    <div class="v192-dashboard-settings-head"><div><b>Dashboard sections</b><div class="hint">Choose which optional Dashboard sections MediaFlow shows. Hiding a section never deletes its Library, History or settings data.</div></div></div>
    <div class="v192-dashboard-toggle-list">
      ${row('showTodayBalance',"Today's Balance",'Show or hide the Today’s Balance category section.')}
      ${row('showRatingQueue','Rate Your Library','Show or hide the unrated-title queue on Dashboard.')}
      ${row('showMissingCovers','Missing Covers','Show or hide the queue for Library titles that do not have a cover URL.')}
      ${row('showStopwatch','Stopwatch','Show or hide the Stopwatch card on Dashboard. Its current timer state is preserved while hidden.')}
    </div>
  </div>`;
}
const v192RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v192RenderSettingsBase.apply(this,arguments);
  const marker='<div class="section-label">DASHBOARD SETTINGS</div>';
  if(h.includes(marker))h=h.replace(marker,marker+v192DashboardVisibilitySettingsHtml());
  else h+=`<div class="section-label">DASHBOARD SETTINGS</div>${v192DashboardVisibilitySettingsHtml()}`;
  return h;
};

/* ---------- Persistence / cloud / backup ---------- */
DEFAULT_SETTINGS.v192Dashboard=v192NormalizeDashboardSettings(DEFAULT_SETTINGS.v192Dashboard);
v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);

const v192PersistSettingsBase=persistSettings;
persistSettings=function(){
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  return v192PersistSettingsBase.apply(this,arguments);
};
const v192LoadAllBase=loadAll;
loadAll=async function(){
  await v192LoadAllBase.apply(this,arguments);
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  V192_MISSING_COVER_QUEUE_LOADED=false;
  v192LoadMissingCoverQueue();
};
const v192SnapshotBase=snapshot;
snapshot=function(){
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const out=v192SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V192_CLOUD_SYNC_VERSION);
  return out;
};
const v192ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v192ApplyStateBase.apply(this,arguments);
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  return result;
};
const v192MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v192MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const av=v192NormalizeDashboardSettings(a?.settings?.v192Dashboard);
  const bv=v192NormalizeDashboardSettings(b?.settings?.v192Dashboard);
  out.settings.v192Dashboard=(Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)?av:bv;
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V192_CLOUD_SYNC_VERSION);
  return out;
};
const v192VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v192VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v192NormalizeDashboardSettings(cloudState?.settings?.v192Dashboard);
  const wantedCfg=v192NormalizeDashboardSettings(expected?.settings?.v192Dashboard);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(wantedCfg))problems.push('v193 Dashboard section visibility');
  if(Number(cloudState?.cloudSyncVersion||0)<V192_CLOUD_SYNC_VERSION)problems.push('v193 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};
const v192BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v192BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V192_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V192_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v193 backup. Adds persistent Dashboard visibility for Stopwatch alongside Today’s Balance, Rate Your Library and Missing Covers. Hiding Stopwatch affects only Dashboard presentation and preserves the timer state. Preserves v192 Missing Covers, v191 Clean Covers/deletion recovery, v189 Last Seen, v188 Library Overview/title size, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, theme and protected cloud data.';
  return payload;
};
const v192BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v192BackupManifestBase.apply(this,arguments);
  const cfg=v192NormalizeDashboardSettings(state?.settings?.v192Dashboard);
  manifest.schemaVersion=V192_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    dashboardTodayBalanceVisibility:true,
    dashboardRatingQueueVisibility:true,
    dashboardMissingCoversVisibility:true,
    dashboardMissingCoversQueue:true,
    dashboardStopwatchVisibility:true,
    v193CloudSyncAudit:true
  });
  manifest.v193={
    cloudSyncVersion:V192_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V192_BACKUP_SCHEMA_VERSION,
    showTodayBalance:cfg.showTodayBalance,
    showRatingQueue:cfg.showRatingQueue,
    showMissingCovers:cfg.showMissingCovers,
    showStopwatch:cfg.showStopwatch,
    missingCoverTitles:(state?.library||[]).filter(i=>i?.id&&!String(i.coverUrl||'').trim()).length
  };
  return manifest;
};


/* ============================================================
   MediaFlow v193
   - Dashboard Stopwatch Show/Hide setting
   - Hides only the Stopwatch card; Rate Your Library and Missing Covers
     remain controlled independently by their own Dashboard settings.
   - Stopwatch timer state is preserved while the card is hidden.
   ============================================================ */
const v193StopwatchHtmlBase=stopwatchHtml;
stopwatchHtml=function(){
  const html=v193StopwatchHtmlBase.apply(this,arguments);
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(cfg.showStopwatch!==false)return html;
  const host=document.createElement('div');
  host.innerHTML=html;
  host.querySelector('.stopwatch-card')?.remove();
  return host.innerHTML;
};


/* ============================================================
   MediaFlow v194
   - Global category icon clarity / adjustable size
   - Persistent Category icon size setting (80%–220%, default 150%)
   - Statistics Completion Timeline now renders URL category icons
   ============================================================ */
const V194_BACKUP_SCHEMA_VERSION=27;
const V194_CLOUD_SYNC_VERSION=194;
const V194_CATEGORY_ICON_DEFAULT={scale:150,modifiedAt:0};

function v194ClampCategoryIconScale(value){
  const n=Math.round(Number(value));
  return Number.isFinite(n)?Math.max(80,Math.min(220,n)):150;
}
function v194NormalizeCategoryIconSettings(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  return {
    scale:v194ClampCategoryIconScale(src.scale),
    modifiedAt:Number(src.modifiedAt)||0
  };
}
function v194EnsureCategoryIconSettings(settings){
  const target=settings&&typeof settings==='object'?settings:(S.settings=S.settings||{});
  target.v194CategoryIcons=v194NormalizeCategoryIconSettings(target.v194CategoryIcons);
  return target.v194CategoryIcons;
}
function v194ApplyCategoryIconScale(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const scale=v194ClampCategoryIconScale(value==null?cfg.scale:value);
  document.documentElement.style.setProperty('--v194-category-icon-scale',String(scale/100));
  return scale;
}
function v194PreviewCategoryIconScale(value){
  const scale=v194ApplyCategoryIconScale(value);
  const label=document.getElementById('v194-category-icon-size-value');
  if(label)label.textContent=`${scale}%`;
  const number=document.getElementById('v194-category-icon-size-number');
  if(number&&document.activeElement!==number)number.value=scale;
}
function v194SetCategoryIconScale(value){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  cfg.scale=v194ClampCategoryIconScale(value);
  cfg.modifiedAt=Date.now();
  v194ApplyCategoryIconScale(cfg.scale);
  persistSettings();
  render();
}
function v194CategoryIconSettingsHtml(){
  const cfg=v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  return `<div class="section-label">CATEGORY ICONS</div>
    <div class="card v194-category-icon-settings-card" style="margin-bottom:22px">
      <div class="v194-category-icon-settings-head">
        <div><b>Category icon size</b><div class="hint">Adjust category icons globally across MediaFlow. URL icons and emoji icons use the same scale while keeping larger icon containers proportionally larger.</div></div>
        <div class="v194-category-icon-preview"><span>${v144CategoryIconHtml(S.categories?.[0]||{icon:'📚'})}</span><strong id="v194-category-icon-size-value">${cfg.scale}%</strong></div>
      </div>
      <div class="v194-category-icon-controls">
        <input type="range" min="80" max="220" step="5" value="${cfg.scale}" aria-label="Category icon size" oninput="App.v194PreviewCategoryIconScale(this.value)" onchange="App.v194SetCategoryIconScale(this.value)">
        <input id="v194-category-icon-size-number" type="number" min="80" max="220" step="5" value="${cfg.scale}" aria-label="Category icon size percent" onchange="App.v194SetCategoryIconScale(this.value)">
        <button type="button" class="btn btn-sm btn-ghost" onclick="App.v194SetCategoryIconScale(150)">Reset 150%</button>
      </div>
      <div class="hint" style="margin-top:9px">Default: 150%. Range: 80%–220%. This changes presentation only — category data and icon URLs are untouched.</div>
    </div>`;
}
Object.assign(App,{v194PreviewCategoryIconScale,v194SetCategoryIconScale});

/* Keep the selected size active on every render, including after settings reset. */
const v194RenderBase=render;
render=function(){
  v194ApplyCategoryIconScale();
  return v194RenderBase.apply(this,arguments);
};

/* Settings: place the global icon-size control directly after Categories and
   make the main category-management icon honor URL icons too. */
const v194RenderSettingsBase=renderSettings;
renderSettings=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  let h=v194RenderSettingsBase.apply(this,arguments);
  const marker='<div class="two-col" style="align-items:start;">';
  if(h.includes(marker))h=h.replace(marker,v194CategoryIconSettingsHtml()+marker);
  else h+=v194CategoryIconSettingsHtml();

  try{
    const host=document.createElement('div');
    host.innerHTML=h;
    host.querySelectorAll('.cat-manage-row[data-category-id]').forEach(row=>{
      const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(row.dataset.categoryId||''));
      const icon=row.querySelector('.hero-icon');
      if(cat&&icon)icon.innerHTML=v144CategoryIconHtml(cat);
    });
    h=host.innerHTML;
  }catch(_){ }
  return h;
};

/* Statistics → Completion Timeline: use the shared category icon renderer so
   URL-based icons render as their image instead of the legacy emoji fallback. */
renderCompletionTimeline=function(){
  const map=new Map();
  for(const x of(S.completionTimeline||[])){if(x?.completedAt)map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x);}
  for(const i of S.library){if(i?.status==='completed'&&i.completedAt&&!map.has(i.id))map.set(i.id,{libraryId:i.id,title:i.title,categoryId:i.categoryId,completedAt:i.completedAt});}
  const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt));
  if(!arr.length)return '<div class="empty-state">No completed titles yet.</div>';
  const size=25,max=Math.max(0,Math.ceil(arr.length/size)-1);
  S.timelinePage=clamp(Number(S.timelinePage)||0,0,max);
  const page=arr.slice(S.timelinePage*size,S.timelinePage*size+size);
  const rows=`<div class="completion-timeline">${page.map(x=>{
    const c=getCategory(x.categoryId),item=v50FindLibraryItem(x.libraryId,x.title);
    return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="v50-timeline-row">${v50Cover(item)}<div class="v50-timeline-copy"><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${v144CategoryIconHtml(c||{icon:'•'})} ${escapeHtml(c?.name||'Unknown')}</div></div></div></div>`;
  }).join('')}</div>`;
  if(max===0)return rows;
  return rows+`<div class="v44-timeline-pager"><button class="btn btn-sm" ${S.timelinePage<=0?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage-1})">← Prev</button><span class="hint">Page ${S.timelinePage+1} of ${max+1} · ${arr.length} completed titles</span><button class="btn btn-sm" ${S.timelinePage>=max?'disabled':''} onclick="App.setTimelinePage(${S.timelinePage+1})">Next →</button></div>`;
};

/* Persistence / cloud / backup for the new global presentation preference. */
DEFAULT_SETTINGS.v194CategoryIcons=v194NormalizeCategoryIconSettings(DEFAULT_SETTINGS.v194CategoryIcons);
v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
v194ApplyCategoryIconScale();

const v194PersistSettingsBase=persistSettings;
persistSettings=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  return v194PersistSettingsBase.apply(this,arguments);
};
const v194LoadAllBase=loadAll;
loadAll=async function(){
  await v194LoadAllBase.apply(this,arguments);
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  v194ApplyCategoryIconScale();
};
const v194ApplyStateBase=v46ApplyState;
v46ApplyState=function(){
  const result=v194ApplyStateBase.apply(this,arguments);
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  v194ApplyCategoryIconScale();
  return result;
};
const v194SnapshotBase=snapshot;
snapshot=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const out=v194SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V194_CLOUD_SYNC_VERSION);
  return out;
};
const v194MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v194MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const av=v194NormalizeCategoryIconSettings(a?.settings?.v194CategoryIcons);
  const bv=v194NormalizeCategoryIconSettings(b?.settings?.v194CategoryIcons);
  out.settings.v194CategoryIcons=(Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)?av:bv;
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V194_CLOUD_SYNC_VERSION);
  return out;
};
const v194VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v194VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v194NormalizeCategoryIconSettings(cloudState?.settings?.v194CategoryIcons);
  const wantedCfg=v194NormalizeCategoryIconSettings(expected?.settings?.v194CategoryIcons);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(wantedCfg))problems.push('v194 category icon size');
  if(Number(cloudState?.cloudSyncVersion||0)<V194_CLOUD_SYNC_VERSION)problems.push('v194 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};
const v194BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v194BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V194_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V194_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v194 backup. Adds a persistent global Category icon size setting and Completion Timeline support for URL-based category icons. Preserves v193 Dashboard Stopwatch visibility, v192 Missing Covers, v191 Clean Covers/deletion recovery, v189 Last Seen, v188 Library Overview/title size, v186 Control Center and all prior Library, History, Logging, Respect XP, Statistics, themes and protected cloud data.';
  return payload;
};
const v194BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v194BackupManifestBase.apply(this,arguments);
  const cfg=v194NormalizeCategoryIconSettings(state?.settings?.v194CategoryIcons);
  manifest.schemaVersion=V194_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    adjustableGlobalCategoryIconSize:true,
    completionTimelineCategoryIconUrls:true,
    v194CloudSyncAudit:true
  });
  manifest.v194={
    cloudSyncVersion:V194_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V194_BACKUP_SCHEMA_VERSION,
    categoryIconScale:cfg.scale,
    completionTimelineUrlIcons:true
  };
  return manifest;
};


