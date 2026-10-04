/* ============================================================
   MediaFlow v188
   - Adjustable Library title-text size
   - Advanced Library Overview configuration
   - Overview order: Category order / Dynamic row order / Own order
   - Overview visibility: Category settings / Own settings
   - Own Overview order supports drag, arrows and exact position numbers
   - Paginated Library Overview categories (default 15 per page)
   - Full Backup schema v22 + Cloud Sync audit v188
   ============================================================ */

const V188_BACKUP_SCHEMA_VERSION=22;
const V188_CLOUD_SYNC_VERSION=188;
const V188_TITLE_TEXT_DEFAULT={percent:100,modifiedAt:0};
const V188_OVERVIEW_DEFAULT={
  orderMode:'category',
  visibilityMode:'category',
  categoryOrder:[],
  hiddenCategoryIds:[],
  perPage:15,
  modifiedAt:0
};

function v188UniqueValidIds(values,categories=S.categories){
  const valid=new Set((categories||[]).map(c=>String(c?.id||'')).filter(Boolean));
  const out=[];
  const seen=new Set();
  for(const value of (Array.isArray(values)?values:[])){
    const id=String(value||'');
    if(!id||!valid.has(id)||seen.has(id))continue;
    seen.add(id);out.push(id);
  }
  return out;
}

function v188ClampTitleText(value){
  const n=Math.round(Number(value));
  return Number.isFinite(n)?Math.max(60,Math.min(220,n)):100;
}
function v188ClampOverviewPerPage(value){
  const n=Math.floor(Number(value));
  return Number.isFinite(n)?Math.max(1,Math.min(100,n)):15;
}
function v188NormalizeTitleText(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {percent:v188ClampTitleText(src.percent),modifiedAt:Math.max(0,Number(src.modifiedAt)||0)};
}
function v188NormalizeOverview(raw,categories=S.categories){
  const src=(raw&&typeof raw==='object')?raw:{};
  const cats=Array.isArray(categories)?categories:[];
  const ids=cats.map(c=>String(c?.id||'')).filter(Boolean);
  let order=v188UniqueValidIds(src.categoryOrder,cats);
  for(const id of ids)if(!order.includes(id))order.push(id);
  return {
    orderMode:['category','dynamic','custom'].includes(String(src.orderMode))?String(src.orderMode):'category',
    visibilityMode:['category','custom'].includes(String(src.visibilityMode))?String(src.visibilityMode):'category',
    categoryOrder:order,
    hiddenCategoryIds:v188UniqueValidIds(src.hiddenCategoryIds,cats),
    perPage:v188ClampOverviewPerPage(src.perPage),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}
function v188NormalizeLibrarySettings(raw,categories=S.categories){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    titleText:v188NormalizeTitleText(src.titleText),
    overview:v188NormalizeOverview(src.overview,categories)
  };
}
function v188EnsureLibrarySettings(settings=S.settings,categories=S.categories){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v188Library=v188NormalizeLibrarySettings(settings.v188Library,categories||[]);
  return settings.v188Library;
}

function v188TitleTextPercent(){
  return v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).titleText.percent;
}
function v188TitleTextScale(){return v188TitleTextPercent()/100;}
function v188TitleTextControlHtml(){
  const value=v188TitleTextPercent();
  return `<label class="v188-title-text-control">
    <span>Title text size</span>
    <input type="range" min="60" max="220" step="5" value="${value}"
      oninput="App.v188PreviewTitleTextSize(this.value)"
      onchange="App.v188SetTitleTextSize(this.value)"
      aria-label="Library title text size">
    <span id="v188-title-text-value" class="v188-title-text-value">${value}%</span>
  </label>`;
}
function v188PreviewTitleTextSize(value){
  const pct=v188ClampTitleText(value);
  document.querySelectorAll('.v188-library-title-scope').forEach(el=>{
    el.style.setProperty('--v188-library-title-scale',String(pct/100));
  });
  const label=document.getElementById('v188-title-text-value');
  if(label)label.textContent=`${pct}%`;
}
function v188SetTitleTextSize(value){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories);
  cfg.titleText.percent=v188ClampTitleText(value);
  cfg.titleText.modifiedAt=Date.now();
  persistSettings();
  v188PreviewTitleTextSize(cfg.titleText.percent);
}

function v188EffectiveOverviewOrder(cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview){
  const cats=S.categories||[];
  const byId=new Map(cats.map(c=>[String(c.id),c]));
  let ids=[];
  if(cfg.orderMode==='dynamic'){
    ids=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).categoryOrder.slice();
  }else if(cfg.orderMode==='custom'){
    ids=cfg.categoryOrder.slice();
  }else{
    ids=(Array.isArray(S.categoryOrder)&&S.categoryOrder.length?S.categoryOrder:cats.map(c=>c.id)).map(String);
  }
  for(const cat of cats){const id=String(cat.id);if(!ids.includes(id))ids.push(id);}
  return ids.filter(id=>byId.has(String(id)));
}
function v188OverviewCategoryVisible(cat,cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview){
  if(!cat)return false;
  if(cfg.visibilityMode==='custom')return !cfg.hiddenCategoryIds.includes(String(cat.id));
  return cat.enabled!==false;
}
function v188OverviewCategories(){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  const byId=new Map((S.categories||[]).map(c=>[String(c.id),c]));
  return v188EffectiveOverviewOrder(cfg).map(id=>byId.get(String(id))).filter(cat=>cat&&v188OverviewCategoryVisible(cat,cfg));
}

function v188OverviewPager(total,pageSize){
  if(total<=pageSize)return '';
  const pages=Math.max(1,Math.ceil(total/pageSize));
  S.v188OverviewPage=Math.max(0,Math.min(Math.floor(Number(S.v188OverviewPage)||0),pages-1));
  const page=S.v188OverviewPage;
  const buttons=[];
  let start=Math.max(0,page-2);
  if(start+4>pages-1)start=Math.max(0,pages-5);
  for(let p=start;p<=Math.min(pages-1,start+4);p++){
    buttons.push(`<button type="button" class="btn btn-sm ${p===page?'page-current':''}" onclick="App.v188SetOverviewPage(${p})">${p+1}</button>`);
  }
  return `<div class="lib-pagination v188-overview-pagination">
    <button type="button" class="btn btn-sm" ${page<=0?'disabled':''} onclick="App.v188SetOverviewPage(${page-1})">← Prev</button>
    ${buttons.join('')}
    <button type="button" class="btn btn-sm" ${page>=pages-1?'disabled':''} onclick="App.v188SetOverviewPage(${page+1})">Next →</button>
    <small class="hint">Page ${page+1} of ${pages} · ${total.toLocaleString()} categories</small>
  </div>`;
}
function v188SetOverviewPage(page){S.v188OverviewPage=Math.max(0,Math.floor(Number(page)||0));render();}

/* Replace v183 Overview rendering with v188 ordering, visibility and pagination. */
v183LibraryOverviewHtml=function(){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  const ov=v53LibraryOverview();
  const categories=v188OverviewCategories();
  const perPage=v188ClampOverviewPerPage(cfg.perPage);
  const pages=Math.max(1,Math.ceil(categories.length/perPage));
  S.v188OverviewPage=Math.max(0,Math.min(Math.floor(Number(S.v188OverviewPage)||0),pages-1));
  const pageCats=categories.slice(S.v188OverviewPage*perPage,S.v188OverviewPage*perPage+perPage);

  let knownDone=0,knownTotal=0;
  for(const cat of categories){
    const x=ov.byCat.get(cat.id);
    if(!x)continue;
    knownDone+=Number(x.knownDone)||0;
    knownTotal+=Number(x.total)||0;
  }
  const overallPct=knownTotal>0?Math.min(100,Math.round(knownDone/knownTotal*100)):0;

  const rows=pageCats.map(cat=>{
    const x=ov.byCat.get(cat.id)||{items:0,done:0,knownDone:0,total:0,unknown:false};
    const est=v183LibraryOverviewEstimate(cat,x);
    const pct=est.pct;
    const progressText=x.items===0?'0 / -':(est.estimated?`${x.done} / ≈${est.total} (~${pct}%)`:`${x.done} / ${est.total} (${pct}%)`);
    const approxTitle=est.estimated?'Approximate overview only — unknown title totals are estimated for this progress bar and are not saved to Library titles.':'';
    return `<div class="overview-row" ${approxTitle?`title="${escapeHtml(approxTitle)}"`:''}>
      <div class="ov-name"><span>${v144CategoryIconHtml(cat)}</span> ${escapeHtml(cat.name)}</div>
      <div class="ov-track"><div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:linear-gradient(90deg, ${cat.color}88, ${cat.color});"></div></div></div>
      <div class="ov-num">${progressText}</div>
    </div>`;
  }).join('')||'<div class="empty-state" style="padding:18px;">No categories are currently visible in Library Overview.</div>';

  const pager=v188OverviewPager(categories.length,perPage);
  return `<div class="v183-library-overview-block v188-library-overview-block">
    <div class="section-label">OVERVIEW · ${overallPct}% of known tracked totals cleared <span style="font-weight:500;text-transform:none;letter-spacing:0;opacity:.72;">· ≈ means display-only estimate</span></div>
    ${pager}
    <div class="card" style="margin-bottom:${pager?'12px':'26px'};">${rows}</div>
    ${pager}
  </div>`;
};

function v188SetOverviewOrderMode(mode){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  cfg.orderMode=['category','dynamic','custom'].includes(String(mode))?String(mode):'category';
  cfg.modifiedAt=Date.now();S.v188OverviewPage=0;persistSettings();render();
}
function v188SetOverviewVisibilityMode(mode){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  cfg.visibilityMode=String(mode)==='custom'?'custom':'category';
  cfg.modifiedAt=Date.now();S.v188OverviewPage=0;persistSettings();render();
}
function v188SetOverviewPerPage(value){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  cfg.perPage=v188ClampOverviewPerPage(value);cfg.modifiedAt=Date.now();S.v188OverviewPage=0;persistSettings();render();
}
function v188ToggleOverviewCategory(id,visible){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  const set=new Set(cfg.hiddenCategoryIds||[]);
  if(visible)set.delete(String(id));else set.add(String(id));
  cfg.hiddenCategoryIds=[...set];cfg.modifiedAt=Date.now();S.v188OverviewPage=0;persistSettings();render();
}
function v188MoveOverviewCategory(id,delta){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  const index=cfg.categoryOrder.indexOf(String(id));
  const next=index+Number(delta||0);
  if(index<0||next<0||next>=cfg.categoryOrder.length)return;
  const [moved]=cfg.categoryOrder.splice(index,1);cfg.categoryOrder.splice(next,0,moved);
  cfg.modifiedAt=Date.now();persistSettings();render();
}
function v188SetOverviewCategoryPosition(id,value){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  const current=cfg.categoryOrder.indexOf(String(id));
  if(current<0)return;
  const wanted=Math.max(0,Math.min(cfg.categoryOrder.length-1,Math.floor(Number(value)||1)-1));
  if(current===wanted)return;
  const [moved]=cfg.categoryOrder.splice(current,1);cfg.categoryOrder.splice(wanted,0,moved);
  cfg.modifiedAt=Date.now();persistSettings();render();
}
let V188_OVERVIEW_DRAG_ID='';
function v188OverviewDragStart(ev,id){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  if(cfg.orderMode!=='custom'){ev?.preventDefault?.();return;}
  V188_OVERVIEW_DRAG_ID=String(id||'');
  try{ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',V188_OVERVIEW_DRAG_ID);}catch(_){ }
  ev.currentTarget?.classList?.add('v188-dragging');
}
function v188OverviewDragOver(ev){
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  if(cfg.orderMode!=='custom')return;
  ev.preventDefault();try{ev.dataTransfer.dropEffect='move';}catch(_){ }
}
function v188OverviewDrop(ev,targetId){
  ev.preventDefault();
  const cfg=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories).overview;
  if(cfg.orderMode!=='custom')return;
  const source=String(V188_OVERVIEW_DRAG_ID||'');const target=String(targetId||'');
  const from=cfg.categoryOrder.indexOf(source),to=cfg.categoryOrder.indexOf(target);
  if(from<0||to<0||from===to)return;
  const [moved]=cfg.categoryOrder.splice(from,1);cfg.categoryOrder.splice(to,0,moved);
  cfg.modifiedAt=Date.now();V188_OVERVIEW_DRAG_ID='';persistSettings();render();
}
function v188OverviewDragEnd(ev){V188_OVERVIEW_DRAG_ID='';ev?.currentTarget?.classList?.remove('v188-dragging');}

function v188OverviewSettingsHtml(){
  const root=v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories);
  const cfg=root.overview;
  const shown=v183LibraryOverviewEnabled();
  const customOrder=cfg.orderMode==='custom';
  const customVisibility=cfg.visibilityMode==='custom';
  const rows=cfg.categoryOrder.map((id,index)=>{
    const cat=(S.categories||[]).find(c=>String(c.id)===String(id));if(!cat)return '';
    const visible=!cfg.hiddenCategoryIds.includes(String(id));
    return `<div class="v188-overview-category-row ${customOrder?'v188-draggable':''}" ${customOrder?'draggable="true"':''}
      ondragstart="App.v188OverviewDragStart(event,'${escapeHtml(String(id))}')"
      ondragover="App.v188OverviewDragOver(event)"
      ondrop="App.v188OverviewDrop(event,'${escapeHtml(String(id))}')"
      ondragend="App.v188OverviewDragEnd(event)">
      <span class="v188-drag-handle" title="${customOrder?'Drag to reorder':'Choose Own order to drag'}">⋮⋮</span>
      <div class="v188-overview-category-copy"><b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b><small>Overview position ${index+1}${customVisibility?` · ${visible?'shown':'hidden'}`:''}</small></div>
      ${customOrder?`<input class="v188-overview-position" type="number" min="1" max="${cfg.categoryOrder.length}" value="${index+1}" onchange="App.v188SetOverviewCategoryPosition('${escapeHtml(String(id))}',this.value)" aria-label="${escapeHtml(cat.name)} overview position">
        <div class="v188-overview-arrows"><button type="button" class="btn btn-sm btn-ghost" ${index===0?'disabled':''} onclick="App.v188MoveOverviewCategory('${escapeHtml(String(id))}',-1)">↑</button><button type="button" class="btn btn-sm btn-ghost" ${index===cfg.categoryOrder.length-1?'disabled':''} onclick="App.v188MoveOverviewCategory('${escapeHtml(String(id))}',1)">↓</button></div>`:`<span class="v188-follow-mode">${cfg.orderMode==='dynamic'?'Dynamic row':'Category'} order</span>`}
      ${customVisibility?`<button type="button" class="toggle ${visible?'on':''}" onclick="App.v188ToggleOverviewCategory('${escapeHtml(String(id))}',${visible?'false':'true'})" aria-label="${visible?'Hide':'Show'} ${escapeHtml(cat.name)} in overview"></button>`:`<span class="v188-follow-mode">${cat.enabled!==false?'Shown':'Hidden'}</span>`}
    </div>`;
  }).join('');

  return `<div class="section-label">LIBRARY OVERVIEW</div>
  <div class="card v188-overview-settings-card">
    <div class="v188-overview-settings-head">
      <div><b>Library Overview</b><div class="hint">Control visibility, category order and pagination for the Overview shown in both Current and Dynamic Library modes.</div></div>
      <div class="v188-overview-global-toggle"><span>${shown?'Shown':'Hidden'}</span><button type="button" class="toggle ${shown?'on':''}" onclick="App.v183ToggleLibraryOverview()" aria-label="${shown?'Hide':'Show'} Library overview"></button></div>
    </div>
    <div class="v188-overview-settings-grid">
      <div class="field"><label class="field-label">Category order</label><select onchange="App.v188SetOverviewOrderMode(this.value)">
        <option value="category" ${cfg.orderMode==='category'?'selected':''}>Follow Category order</option>
        <option value="dynamic" ${cfg.orderMode==='dynamic'?'selected':''}>Follow Dynamic row order</option>
        <option value="custom" ${cfg.orderMode==='custom'?'selected':''}>Use own order</option>
      </select><small class="hint">Own order enables drag-and-drop, arrows and exact position numbers below.</small></div>
      <div class="field"><label class="field-label">Shown / hidden categories</label><select onchange="App.v188SetOverviewVisibilityMode(this.value)">
        <option value="category" ${cfg.visibilityMode==='category'?'selected':''}>Follow Category Settings</option>
        <option value="custom" ${cfg.visibilityMode==='custom'?'selected':''}>Use own visibility settings</option>
      </select><small class="hint">Own visibility lets Overview categories be shown/hidden independently.</small></div>
      <div class="field"><label class="field-label">Categories per Overview page</label><input type="number" min="1" max="100" step="1" value="${cfg.perPage}" onchange="App.v188SetOverviewPerPage(this.value)"><small class="hint">Default: 15. Pagination only appears when more categories are visible than this amount.</small></div>
    </div>
    <div class="v188-overview-category-list">${rows}</div>
  </div>`;
}

Object.assign(App,{
  v188PreviewTitleTextSize,v188SetTitleTextSize,v188SetOverviewPage,
  v188SetOverviewOrderMode,v188SetOverviewVisibilityMode,v188SetOverviewPerPage,
  v188ToggleOverviewCategory,v188MoveOverviewCategory,v188SetOverviewCategoryPosition,
  v188OverviewDragStart,v188OverviewDragOver,v188OverviewDrop,v188OverviewDragEnd
});

/* Library title-size slider in both Current and Dynamic Library. */
const v188RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v188RenderLibraryBase.apply(this,arguments);
  const control=v188TitleTextControlHtml();
  if(!h.includes('v188-title-text-control')){
    const coverControl=v181InlineCoverControl('library','Cover size');
    if(h.includes(coverControl))h=h.replace(coverControl,coverControl+control);
    else{
      const pageControl=v175PageSizeControlHtml('library','Titles per page');
      if(h.includes(pageControl))h=h.replace(pageControl,pageControl+control);
    }
  }
  return `<div class="v188-library-title-scope" style="--v188-library-title-scale:${v188TitleTextScale()}">${h}</div>`;
};

/* Add Library Overview configuration to Settings. */
const v188RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v188RenderSettingsBase.apply(this,arguments);
  const block=v188OverviewSettingsHtml();
  const mediaflowLabel='<div class="section-label">MEDIAFLOW SYSTEM</div>';
  const dataLabel='<div class="section-label">DATA</div>';
  if(h.includes(mediaflowLabel))h=h.replace(mediaflowLabel,block+mediaflowLabel);
  else if(h.includes(dataLabel))h=h.replace(dataLabel,block+dataLabel);
  else h+=block;
  return h;
};

/* Defaults + persistence. */
DEFAULT_SETTINGS.v188Library=v188NormalizeLibrarySettings(DEFAULT_SETTINGS.v188Library,S.categories||[]);
v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories||[]);

const v188PersistSettingsBase=persistSettings;
persistSettings=function(){v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories||[]);return v188PersistSettingsBase.apply(this,arguments);};
const v188LoadAllBase=loadAll;
loadAll=async function(){await v188LoadAllBase.apply(this,arguments);v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories||[]);};
const v188SnapshotBase=snapshot;
snapshot=function(){
  v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories||[]);
  const out=v188SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V188_CLOUD_SYNC_VERSION);
  return out;
};
const v188ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){const result=v188ApplyStateBase.apply(this,arguments);v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories||[]);return result;};

function v188PickNewerPart(a,b){return (Number(a?.modifiedAt)||0)>=(Number(b?.modifiedAt)||0)?a:b;}
const v188MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v188MergeStatesBase.apply(this,arguments)||{};out.settings=out.settings||{};
  const av=v188NormalizeLibrarySettings(a?.settings?.v188Library,a?.categories||S.categories||[]);
  const bv=v188NormalizeLibrarySettings(b?.settings?.v188Library,b?.categories||S.categories||[]);
  out.settings.v188Library={titleText:v188PickNewerPart(av.titleText,bv.titleText),overview:v188PickNewerPart(av.overview,bv.overview)};
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V188_CLOUD_SYNC_VERSION);
  return out;
};

const v188VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v188VerifyCloudStateBase.apply(this,arguments);const problems=[...(base?.missing||[])];
  const cloudCfg=v188NormalizeLibrarySettings(cloudState?.settings?.v188Library,cloudState?.categories||[]);
  const wantedCfg=v188NormalizeLibrarySettings(expected?.settings?.v188Library,expected?.categories||[]);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(wantedCfg))problems.push('v188 Library title/Overview settings');
  if(Number(cloudState?.cloudSyncVersion||0)<V188_CLOUD_SYNC_VERSION)problems.push('v188 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

/* Full Backup / manual export / Automatic Backup. */
const v188BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v188EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS,S.categories||[]);
  const payload=v188BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V188_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V188_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v188 backup. Includes adjustable Library title-text sizing plus advanced Library Overview configuration: global visibility, order source (Category / Dynamic / own), independent Overview visibility, own draggable/arrow/number category order, and paginated Overview categories with configurable per-page count. Preserves the full v186 Control Center and all prior Library, History, Dynamic Library, Logging, cover-size, recommendation/Respect XP, Statistics, theme and protected cloud state.';
  return payload;
};
const v188BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v188BackupManifestBase.apply(this,arguments);
  const cfg=v188NormalizeLibrarySettings(state?.settings?.v188Library,state?.categories||[]);
  manifest.schemaVersion=V188_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    adjustableLibraryTitleTextSize:true,
    advancedLibraryOverviewSettings:true,
    overviewCategoryOrderModes:true,
    overviewIndependentVisibility:true,
    overviewDragArrowNumberOrdering:true,
    overviewCategoryPagination:true,
    v188CloudSyncAudit:true
  });
  manifest.v188={
    cloudSyncVersion:V188_CLOUD_SYNC_VERSION,
    titleTextPercent:cfg.titleText.percent,
    overviewOrderMode:cfg.overview.orderMode,
    overviewVisibilityMode:cfg.overview.visibilityMode,
    overviewPerPage:cfg.overview.perPage,
    backupSchemaVersion:V188_BACKUP_SCHEMA_VERSION
  };
  return manifest;
};


