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

