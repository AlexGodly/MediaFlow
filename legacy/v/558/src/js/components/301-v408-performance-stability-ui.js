/* MediaFlow v408 — performance and responsive controls.
 * Stable source data and existing handlers remain authoritative. No backend
 * schema, History, XP or recommendation calculations are changed. */
const V408_RELEASE=408;
const V408_METRICS={repeatComputes:0,repeatReuses:0,categorySearches:0};

// One repeat-total computation per synchronous render/event. The snapshot is
// discarded at the microtask boundary so subsequent edits, imports, logging,
// and cloud hydration never reuse stale repeat data. The computation itself
// is linear after the v408 library ID indexing change in the source module.
const v408RepeatComputeBase=v81RepeatTotals;
let V408_REPEAT_CACHED=null;
let V408_REPEAT_SIGNATURE=null;
let V408_REPEAT_QUEUED=false;
v81RepeatTotals=function(){
  const sessions=S.sessions||[],last=sessions[sessions.length-1];
  const signature=[S.library,Number(V53_LIB.libraryToken)||0,sessions,sessions.length,
    last,last?.titles?.length||0];
  if(V408_REPEAT_CACHED&&V408_REPEAT_SIGNATURE&&signature.every((value,i)=>value===V408_REPEAT_SIGNATURE[i])){
    V408_METRICS.repeatReuses++;return V408_REPEAT_CACHED;
  }
  const value=v408RepeatComputeBase.apply(this,arguments);
  V408_REPEAT_SIGNATURE=signature;
  V408_METRICS.repeatComputes++;
  V408_REPEAT_CACHED=value;
  if(!V408_REPEAT_QUEUED){
    V408_REPEAT_QUEUED=true;
    queueMicrotask(()=>{V408_REPEAT_CACHED=null;V408_REPEAT_SIGNATURE=null;V408_REPEAT_QUEUED=false;});
  }
  return value;
};

// v378 generates the Logging suggestions and then re-evaluates the same
// candidates to attach picker selection controls. At 30K+ titles, the empty
// search means two expensive full-list sorts per single refresh. Reuse results
// only within the current event-loop turn and with an exact UI-state key.
const v408LogCandidatesBase=logTitleCandidates;
let V408_LOG_CACHE={key:'',library:null,rows:null};
let V408_LOG_QUEUED=false;
V408_METRICS.logCandidateReuses=0;
V408_METRICS.logCandidateComputes=0;
logTitleCandidates=function(query){
  const st=v224NormalizeLogSort();
  const keys=(S.logDraft?.entries||[]).map(e=>String(e.libraryId||'')).join('\u0001');
  const key=[String(query||''),Number(V53_LIB.libraryToken)||0,(S.library||[]).length,
    String(st.sortBase||''),String(st.sortDir||''),String(st.status||''),
    String(st.priority||''),(st.categories||[]).join('\u0001'),
    String(st.v373RandomSeed||''),String(V406_MEMBERSHIP.logging||'all'),keys].join('\u0002');
  if(V408_LOG_CACHE.library===S.library&&V408_LOG_CACHE.key===key&&V408_LOG_CACHE.rows){
    V408_METRICS.logCandidateReuses++;
    return V408_LOG_CACHE.rows;
  }
  const rows=v408LogCandidatesBase.apply(this,arguments);
  V408_METRICS.logCandidateComputes++;
  V408_LOG_CACHE={key,library:S.library,rows};
  if(!V408_LOG_QUEUED){
    V408_LOG_QUEUED=true;
    queueMicrotask(()=>{V408_LOG_QUEUED=false;V408_LOG_CACHE={key:'',library:null,rows:null};});
  }
  return rows;
};

// Two independent Collections category checklists. The Search box only
// controls visible checkbox rows, never the actual selection or All button.
// Query/open state is ephemeral UI state, not a new saved or cloud field.
const V408_CAT_UI={collection:{query:'',open:false},add:{query:'',open:false}};
function v408CategoryUI(surface){return V408_CAT_UI[surface==='add'?'add':'collection'];}
function v408SortCategories(panel){
  const order=typeof v236EffectiveCategoryFilterCategories==='function'
    ?v236EffectiveCategoryFilterCategories().map(c=>String(c.id))
    :(S.categories||[]).map(c=>String(c.id));
  const rank=new Map(order.map((id,i)=>[id,i]));
  const rows=[...panel.querySelectorAll(':scope > .v66-cat-option')];
  // Keep existing selected/hidden entries available: the authoritative All
  // semantics are driven by existing v274 actions, not search results.
  rows.sort((a,b)=>{
    const aid=a.querySelector('input')?.getAttribute('onchange')?.match(/'([^']+)'/)?.[1]||'';
    const bid=b.querySelector('input')?.getAttribute('onchange')?.match(/'([^']+)'/)?.[1]||'';
    return (rank.get(aid)??1e6)-(rank.get(bid)??1e6);
  });
  for(const row of rows)panel.appendChild(row);
}
function v408DecorateCategoryMarkup(html,surface){
  const raw=String(html||'');
  if(!raw.includes('Show categories'))return raw;
  const host=document.createElement('div');host.innerHTML=raw;
  const details=surface==='add'?
    host.querySelector('.mf276-add-category-filter,.mf274-add-tools .v66-cat-filter,.mf399-collection-filters .v66-cat-filter'):
    host.querySelector('.mf274-collection-tools .v66-cat-filter,.mf274-tools-grid .v66-cat-filter');
  const panel=details?.querySelector('.v66-cat-panel');
  if(!details||!panel)return raw;
  const ui=v408CategoryUI(surface);
  details.classList.add('mf408-searchable-categories');
  details.dataset.mf408Surface=surface;
  details.setAttribute('ontoggle',`App.v408CategoryToggle('${surface}',this)`);
  if(ui.open)details.setAttribute('open','');
  v408SortCategories(panel);
  const field=document.createElement('div');field.className='mf408-category-search-wrap';
  field.innerHTML=`<input type="search" class="mf408-category-search" autocomplete="off" spellcheck="false" aria-label="Search categories" placeholder="Search categories…" value="${escapeHtml(ui.query)}" oninput="App.v408CategorySearch(this)"><p class="mf408-category-empty" hidden>No matching categories</p>`;
  panel.querySelector('.v66-cat-head')?.after(field);
  if(!panel.contains(field))panel.prepend(field);
  v408CategoryFilterRows(details,ui.query);
  return host.innerHTML;
}
function v408CategoryFilterRows(details,query){
  const value=String(query||'').trim().toLocaleLowerCase();
  let visible=0;
  for(const row of details.querySelectorAll('.v66-cat-panel .v66-cat-option')){
    const yes=!value||String(row.textContent||'').toLocaleLowerCase().includes(value);
    row.hidden=!yes;
    if(yes)visible++;
  }
  const empty=details.querySelector('.mf408-category-empty');if(empty)empty.hidden=visible!==0;
}
function v408CategorySearch(input){
  const details=input?.closest('.mf408-searchable-categories');
  if(!details)return;
  const ui=v408CategoryUI(details.dataset.mf408Surface);
  ui.query=String(input.value||'');ui.open=true;
  V408_METRICS.categorySearches++;
  v408CategoryFilterRows(details,ui.query);
}
function v408CategoryToggle(surface,details){
  // Detached old dropdowns must not overwrite the newly rendered panel state.
  if(!details?.isConnected)return;
  v408CategoryUI(surface).open=!!details.open;
}
const v408CollectionToolsBase=v274CollectionToolsHtml;
v274CollectionToolsHtml=function(){
  return v408DecorateCategoryMarkup(v408CollectionToolsBase.apply(this,arguments),'collection');
};
const v408CollectionAddBodyBase=v274AddModalBody;
v274AddModalBody=function(){
  return v408DecorateCategoryMarkup(v408CollectionAddBodyBase.apply(this,arguments),'add');
};
const v408OpenCollectionAddBase=v274OpenAddTitles;
v274OpenAddTitles=function(){
  V408_CAT_UI.add={query:'',open:false};
  return v408OpenCollectionAddBase.apply(this,arguments);
};
Object.assign(App,{v408CategorySearch,v408CategoryToggle});

// Normalize current-version export headers after the additive v405 layer.
// Keep legacy v402/v405 manifests as historical evidence, not rewritten
// provenance. Existing import versions, schema keys and payloads are unchanged.
const v408FullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const data=v408FullBackupBase.apply(this,arguments);
  if(data){data.mediaFlowVersion=V408_RELEASE;data.backupVersion=V408_RELEASE;}
  return data;
};
backupSnapshot=function(){return v148BuildFullBackup();};
const v408PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){
  const data=v408PresetBase.apply(this,arguments);
  if(data)data.mediaFlowVersion=V408_RELEASE;
  return data;
};
const v408OrderExportBase=v142OrderExportPayload;
v142OrderExportPayload=function(){
  const data=v408OrderExportBase.apply(this,arguments);
  if(data)data.mediaFlowVersion=V408_RELEASE;
  return data;
};
const v408CollectionsExportBase=v281CollectionsExportPayload;
v281CollectionsExportPayload=function(){
  const data=v408CollectionsExportBase.apply(this,arguments);
  if(data){data.appVersion=V408_RELEASE;data.mediaFlowVersion=V408_RELEASE;}
  return data;
};
function v408AuditDataIntegrity(){
  // The v402/v405 auditor's release constants are historical; preserve its
  // coverage and replace only its obsolete version assertion with v408.
  const previous=v402AuditDataIntegrity();
  const issues=(previous.issues||[]).filter(s=>s!=='Collections release stamp');
  const snap=snapshot(),backup=v148BuildFullBackup(),preset=v196BuildSettingsPreset();
  const order=v142OrderExportPayload(),collections=v281CollectionsExportPayload();
  const versions={backup:backup.mediaFlowVersion,preset:preset.mediaFlowVersion,
    order:order.mediaFlowVersion,collections:collections.appVersion};
  for(const [name,stamp] of Object.entries(versions)){
    if(Number(stamp)!==V408_RELEASE)issues.push(name+' incorrect current release stamp');
  }
  for(const key of ['v405ShowFloatingAdd','v405ShowFloatingTaskProgress']){
    const flag=o=>o?.settings?.[key]!==false;
    if(flag(snap)!==flag(backup)||flag(snap)!==flag(preset))
      issues.push(key+' transfer mismatch');
  }
  return {...previous,release:V408_RELEASE,ok:issues.length===0,issues,
    versionStamps:versions,actualLiveCloudChecked:false,actualInstalledPwaChecked:false};
}
App.v408AuditDataIntegrity=v408AuditDataIntegrity;
window.MediaFlowV408={version:V408_RELEASE,features:['Linear repeat-history library lookup','Render-turn repeat result reuse','Searchable Collections category checklists','Responsive Logging Library toolbar'],audit:()=>({version:408,...V408_METRICS}),transferAudit:v408AuditDataIntegrity};
MediaFlowRuntime.version=V408_RELEASE;
