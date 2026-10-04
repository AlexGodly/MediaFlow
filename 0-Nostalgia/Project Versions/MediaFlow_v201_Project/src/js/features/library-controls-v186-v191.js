/* MediaFlow v201 source fragment
 * Category ordering, Library overview controls, sorting/bulk actions and restorable deletions
 * Original HTML lines 38102-39941.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   MediaFlow v186
   - Exact-number Dynamic Library category ordering
   - Dynamic category Edit/Delete actions
   - Independent/follow-category scopes for Scheduler, Today's Balance,
     Statistics Category Balance and Recent Saturation
   - Statistics component visibility control center
   - Rating Queue cover -> Title Details
   - Statistics profile email hidden
   - Full Backup schema v21 + Cloud Sync audit v186
   ============================================================ */

const V186_BACKUP_SCHEMA_VERSION=21;
const V186_CLOUD_SYNC_VERSION=186;

const V186_STATS_COMPONENT_DEFAULTS={
  profile:true,
  achievements:true,
  leveling:true,
  today:true,
  week:true,
  month:true,
  lifetime:true,
  units:true,
  streak:true,
  sevenDayMinutes:true,
  sevenDaySessions:true,
  thirtyDayMinutes:true,
  ninetyDayActivity:true,
  categoryMix:true,
  mediaTypeMix:true,
  libraryStatus:true,
  priorityDistribution:true,
  repeatConsumption:true,
  libraryHealth:true,
  advancedMetrics:true,
  heatmap:true,
  monthlyRecap:true,
  categoryBalance:true,
  saturation:true,
  records:true,
  ratings:true,
  completionTimeline:true
};

const V186_STATS_COMPONENT_LABELS={
  profile:'Profile header',
  achievements:'Lifetime achievements',
  leveling:'Leveling',
  today:'Today summary',
  week:'This week summary',
  month:'This month summary',
  lifetime:'Lifetime summary',
  units:'Units summary',
  streak:'Streak summary',
  sevenDayMinutes:'7-day minutes chart',
  sevenDaySessions:'7-day sessions chart',
  thirtyDayMinutes:'30-day daily minutes',
  ninetyDayActivity:'90-day activity',
  categoryMix:'30-day category mix',
  mediaTypeMix:'Media type mix',
  libraryStatus:'Library status',
  priorityDistribution:'Priority distribution',
  repeatConsumption:'Repeat consumption',
  libraryHealth:'Library health',
  advancedMetrics:'Advanced metrics',
  heatmap:'Consumption heatmap',
  monthlyRecap:'Monthly recap',
  categoryBalance:'Category balance',
  saturation:'Recent saturation',
  records:'Records',
  ratings:'Ratings',
  completionTimeline:'Title completion timeline'
};

function v186UniqueIds(values,validIds){
  const out=[];
  const seen=new Set();
  for(const raw of (Array.isArray(values)?values:[])){
    const id=String(raw||'');
    if(!id||seen.has(id)||(validIds&&!validIds.has(id)))continue;
    seen.add(id);out.push(id);
  }
  return out;
}

function v186NormalizeScope(raw,categories=S.categories){
  const src=(raw&&typeof raw==='object')?raw:{};
  const cats=Array.isArray(categories)?categories:[];
  const validIds=new Set(cats.map(c=>String(c?.id||'')).filter(Boolean));
  const fallback=cats.filter(c=>c?.enabled!==false).map(c=>String(c.id));
  return {
    mode:src.mode==='custom'?'custom':'follow',
    categoryIds:Array.isArray(src.categoryIds)
      ?v186UniqueIds(src.categoryIds,validIds)
      :fallback,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v186NormalizeStatsComponents(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const values={};
  for(const [key,def] of Object.entries(V186_STATS_COMPONENT_DEFAULTS)){
    values[key]=src.values?.[key]!==false;
    if(src.values?.[key]===undefined)values[key]=def;
  }
  return {
    values,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v186NormalizeControlCenter(raw,categories=S.categories){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    scheduler:v186NormalizeScope(src.scheduler,categories),
    todayBalance:v186NormalizeScope(src.todayBalance,categories),
    categoryBalance:v186NormalizeScope(src.categoryBalance,categories),
    saturation:v186NormalizeScope(src.saturation,categories),
    statsComponents:v186NormalizeStatsComponents(src.statsComponents)
  };
}

function v186EnsureControlCenter(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v186ControlCenter=v186NormalizeControlCenter(
    settings.v186ControlCenter,
    S.categories||[]
  );
  return settings.v186ControlCenter;
}

function v186ScopeCategories(scopeKey){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const scope=cfg[scopeKey]||v186NormalizeScope(null,S.categories||[]);
  if(scope.mode==='follow')return (S.categories||[]).filter(c=>c?.enabled!==false);
  const selected=new Set(scope.categoryIds.map(String));
  return (S.categories||[]).filter(c=>selected.has(String(c?.id||'')));
}

function v186SetScopeMode(scopeKey,mode){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const scope=cfg[scopeKey];
  if(!scope)return;
  scope.mode=mode==='custom'?'custom':'follow';
  scope.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(scope.mode==='follow'?'Following main Category Settings':'Using independent category selection');
}

function v186ToggleScopeCategory(scopeKey,id,enabled){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const scope=cfg[scopeKey];
  if(!scope)return;
  const set=new Set(scope.categoryIds.map(String));
  if(enabled)set.add(String(id));else set.delete(String(id));
  scope.categoryIds=[...set].filter(x=>(S.categories||[]).some(c=>String(c.id)===String(x)));
  scope.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v186SetAllScopeCategories(scopeKey,enabled){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const scope=cfg[scopeKey];
  if(!scope)return;
  scope.categoryIds=enabled?(S.categories||[]).map(c=>String(c.id)):[];
  scope.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v186SetStatsComponent(key,visible){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  if(!(key in V186_STATS_COMPONENT_DEFAULTS))return;
  cfg.statsComponents.values[key]=!!visible;
  cfg.statsComponents.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v186SetAllStatsComponents(visible){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  for(const key of Object.keys(V186_STATS_COMPONENT_DEFAULTS))cfg.statsComponents.values[key]=!!visible;
  cfg.statsComponents.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v186SetDynamicCategoryPosition(id,value){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const order=cfg.categoryOrder.slice();
  const from=order.indexOf(String(id));
  if(from<0)return;
  const target=Math.max(0,Math.min(order.length-1,(Math.round(Number(value)||1)-1)));
  if(target===from){render();return;}
  const [moved]=order.splice(from,1);
  order.splice(target,0,moved);
  cfg.categoryOrder=order;
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
  showToast(`Dynamic category moved to position ${target+1}`);
}

Object.assign(App,{
  v186SetScopeMode,
  v186ToggleScopeCategory,
  v186SetAllScopeCategories,
  v186SetStatsComponent,
  v186SetAllStatsComponents,
  v186SetDynamicCategoryPosition
});

/* Make the scheduler balance denominator use the actual v186 rotation pool. */
categoryBalance=function(cat){
  const enabled=v186ScopeCategories('scheduler');
  const weightTotal=enabled.reduce((a,c)=>a+Math.max(0.25,Number(c.weight)||1),0)||1;
  const desiredShare=Math.max(0.25,Number(cat.weight)||1)/weightTotal;
  const all=schedulerConsumptionSessions();
  const now=Date.now();
  const windows=[
    {days:3,weight:.35,minMinutes:60},
    {days:7,weight:.25,minMinutes:120},
    {days:30,weight:.20,minMinutes:240},
    {days:null,weight:.20,minMinutes:1}
  ];
  let ratioSum=0,usedWeight=0;
  const detail={};
  for(const w of windows){
    const rows=w.days==null?all:all.filter(x=>Number(x.timestamp)>=now-w.days*86400000);
    const totalMinutes=rows.reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
    const catMinutes=rows.filter(x=>x.categoryId===cat.id).reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
    const key=w.days==null?'lifetime':`${w.days}d`;
    const actualShare=totalMinutes>0?catMinutes/totalMinutes:0;
    const ratio=desiredShare>0?actualShare/desiredShare:1;
    detail[key]={totalMinutes,catMinutes,actualShare,ratio};
    if(totalMinutes>=w.minMinutes){ratioSum+=Math.min(6,ratio)*w.weight;usedWeight+=w.weight;}
  }
  const consumptionRatio=usedWeight>0?ratioSum/usedWeight:1;
  const last=lastSessionFor(cat.id);
  const daysIdle=daysSince(last?last.timestamp:null);
  return {desiredShare,consumptionRatio,daysIdle,detail};
};

/* Statistics category-specific scopes. */
v129CategoryBalanceRows=function(){
  const cats=v186ScopeCategories('categoryBalance');
  const cutoff=Date.now()-(7*24*60*60*1000);
  const recent=v129ConsumptionSessions().filter(s=>v129SessionTime(s)>=cutoff);
  const values=cats.map(c=>({cat:c,minutes:v129CategoryMinutes(c.id,recent)}));
  const max=Math.max(1,...values.map(x=>x.minutes));
  return values.map(x=>Object.assign(x,{pct:x.minutes>0?Math.max(2,Math.round((x.minutes/max)*100)):0}));
};

v129SaturationRows=function(){
  return v186ScopeCategories('saturation').map(cat=>{
    let sat;
    try{sat=saturationLevel(cat);}catch(_){sat={label:'VERY LOW',c:'var(--flow)'};}
    return {cat,sat};
  });
};

/* Statistics profile header: name/avatar/stats stay, account email is private here. */
renderProfileStatHero=function(){
  const url=getAvatarUrl();
  return `<div class="profile-stat-hero"><div class="profile-stat-avatar">${url?`<img src="${escapeHtml(url)}" alt="Profile picture">`:escapeHtml(profileInitials())}</div><div><div style="font-family:var(--font-display);font-size:30px;font-weight:600;">${escapeHtml(getDisplayName())}</div><div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;"><span class="pill">${S.library.length} titles</span><span class="pill">${S.sessions.length} sessions</span><span class="pill">${fmtMinutes(totalsForSessions(S.sessions).minutes)} consumed</span></div></div></div>`;
};

/* Dynamic Library Settings: number input + Edit/Delete popup actions. */
v181DynamicLibrarySettingsHtml=function(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const categoryRows=cfg.categoryOrder.map((id,index)=>{
    const cat=(S.categories||[]).find(c=>String(c.id)===String(id));
    if(!cat)return '';
    const visible=!cfg.hiddenCategoryIds.includes(String(id));
    return `<div class="v181-config-row v186-dynamic-category-row">
      <div class="v181-config-copy">
        <b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b>
        <small>Dynamic row position ${index+1} · ${visible?'shown':'hidden'}</small>
      </div>
      <input class="v186-dynamic-position" type="number" min="1" max="${cfg.categoryOrder.length}" step="1" value="${index+1}"
        title="Set exact Dynamic Library row position" aria-label="Set ${escapeHtml(cat.name)} Dynamic Library position"
        onkeydown="if(event.key==='Enter'){this.blur();}" onchange="App.v186SetDynamicCategoryPosition('${escapeHtml(String(id))}',this.value)">
      <div class="v181-order-buttons">
        <button type="button" class="btn btn-sm btn-ghost" ${index===0?'disabled':''} onclick="App.v181MoveDynamicCategory('${escapeHtml(String(id))}',-1)">↑</button>
        <button type="button" class="btn btn-sm btn-ghost" ${index===cfg.categoryOrder.length-1?'disabled':''} onclick="App.v181MoveDynamicCategory('${escapeHtml(String(id))}',1)">↓</button>
      </div>
      <div class="v186-dynamic-edit-actions">
        <button type="button" class="btn btn-sm btn-ghost" onclick="App.openCategoryModal('${escapeHtml(String(id))}')">Edit</button>
        <button type="button" class="btn btn-sm btn-danger" onclick="App.deleteCategory('${escapeHtml(String(id))}')">Delete</button>
      </div>
      <button type="button" class="toggle ${visible?'on':''}" onclick="App.v181ToggleDynamicCategory('${escapeHtml(String(id))}',${visible?'false':'true'})" aria-label="${visible?'Hide':'Show'} ${escapeHtml(cat.name)} in Dynamic Library"></button>
    </div>`;
  }).join('');

  const statusRows=cfg.statusOrder.map((status,index)=>{
    const label=v199StatusLabel(status);
    return `<div class="v181-config-row">
      <div class="v181-config-copy"><b>${escapeHtml(label)}</b><small>Status row position ${index+1}</small></div>
      <div class="v181-order-buttons">
        <button type="button" class="btn btn-sm btn-ghost" ${index===0?'disabled':''} onclick="App.v181MoveDynamicStatus('${status}',-1)">↑</button>
        <button type="button" class="btn btn-sm btn-ghost" ${index===cfg.statusOrder.length-1?'disabled':''} onclick="App.v181MoveDynamicStatus('${status}',1)">↓</button>
      </div><span></span>
    </div>`;
  }).join('');

  return `<div class="section-label">LIBRARY EXPERIENCE</div>
  <div class="card v181-settings-card">
    <div class="v181-setting-head"><div><b>Default Library mode</b><div class="hint">Current keeps the existing Library workflow. Dynamic uses category → status navigation.</div></div>${v181LibraryModeSwitchHtml()}</div>
    <div class="section-label" style="margin-top:15px;">DYNAMIC CATEGORY ROW</div>
    <div class="hint">Set an exact row number, use ↑/↓, show/hide the category, or edit/delete it directly. Edit opens the normal Category editor; Delete uses MediaFlow's existing category confirmation/recovery popup.</div>
    <div class="v181-config-list">${categoryRows}</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px;">
      <button type="button" class="btn btn-sm" onclick="App.openCategoryModal()">+ Add category</button>
      <button type="button" class="btn btn-sm btn-ghost" onclick="App.v181ResetDynamicLibrary()">Reset Dynamic Library layout</button>
    </div>
    <div class="section-label" style="margin-top:16px;">DYNAMIC STATUS ROW</div>
    <div class="hint">Arrange the order used under every Dynamic Library category. Default: Watching → On Hold → Completed → Dropped → Plan to Watch.</div>
    <div class="v181-config-list">${statusRows}</div>
  </div>`;
};

function v186CategoryScopeCard(scopeKey,title,description){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const scope=cfg[scopeKey];
  const custom=scope.mode==='custom';
  const selected=new Set(scope.categoryIds.map(String));
  const followed=(S.categories||[]).filter(c=>c?.enabled!==false);
  const rows=custom?(S.categories||[]).map(cat=>{
    const on=selected.has(String(cat.id));
    return `<div class="v186-scope-row"><span>${v144CategoryIconHtml(cat)}</span><span class="v186-scope-name">${escapeHtml(cat.name)}</span><button type="button" class="toggle ${on?'on':''}" onclick="App.v186ToggleScopeCategory('${scopeKey}','${escapeHtml(String(cat.id))}',${on?'false':'true'})" aria-label="${on?'Exclude':'Include'} ${escapeHtml(cat.name)}"></button></div>`;
  }).join(''):'';
  return `<div class="card v186-settings-card">
    <div class="v186-scope-head"><div><b>${escapeHtml(title)}</b><div class="hint">${escapeHtml(description)}</div></div>
      <select class="v186-scope-mode" onchange="App.v186SetScopeMode('${scopeKey}',this.value)">
        <option value="follow" ${!custom?'selected':''}>Follow Category Settings</option>
        <option value="custom" ${custom?'selected':''}>Use own category settings</option>
      </select>
    </div>
    ${custom?`<div class="v186-scope-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v186SetAllScopeCategories('${scopeKey}',true)">Show / include all</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v186SetAllScopeCategories('${scopeKey}',false)">Hide / exclude all</button></div><div class="v186-scope-list">${rows}</div>`:`<div class="v186-follow-summary">Following the main Categories section right now: <b>${followed.length}</b> shown/enabled categor${followed.length===1?'y':'ies'}.</div>`}
  </div>`;
}

function v186StatsComponentsHtml(){
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const values=cfg.statsComponents.values;
  return `<div class="card v186-settings-card">
    <div class="v186-scope-head"><div><b>Statistics components</b><div class="hint">Show or hide every major Statistics page component independently. This changes presentation only; History and calculations stay intact.</div></div></div>
    <div class="v186-scope-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v186SetAllStatsComponents(true)">Show all</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v186SetAllStatsComponents(false)">Hide all</button></div>
    <div class="v186-stats-grid">${Object.entries(V186_STATS_COMPONENT_LABELS).map(([key,label])=>`<div class="v186-stat-toggle"><span>${escapeHtml(label)}</span><button type="button" class="toggle ${values[key]!==false?'on':''}" onclick="App.v186SetStatsComponent('${key}',${values[key]!==false?'false':'true'})" aria-label="${values[key]!==false?'Hide':'Show'} ${escapeHtml(label)}"></button></div>`).join('')}</div>
  </div>`;
}

function v186SettingsHtml(){
  return `<div class="section-label">MEDIAFLOW SYSTEM</div>
    ${v186CategoryScopeCard('scheduler','Rotation categories','Choose which categories MediaFlow can select for new scheduler tasks. Follow Category Settings keeps the original enabled/hidden behavior; Own settings creates an independent rotation list.')}
    <div class="section-label">DASHBOARD SETTINGS</div>
    ${v186CategoryScopeCard('todayBalance',"Today's Balance categories",'Choose which categories appear in the Dashboard Today’s Balance section. This can follow the main Category Settings or use its own independent list.')}
    <div class="section-label">STATISTICS SETTINGS</div>
    ${v186StatsComponentsHtml()}
    ${v186CategoryScopeCard('categoryBalance','Category Balance categories','Choose which categories appear in Statistics → Category Balance. Follow Category Settings uses the normal category enabled/hidden state; Own settings is independent.')}
    ${v186CategoryScopeCard('saturation','Recent Saturation categories','Choose which categories appear in Statistics → Recent Saturation. Follow Category Settings uses the normal category enabled/hidden state; Own settings is independent.')}`;
}

const v186RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v186RenderSettingsBase();
  const block=v186SettingsHtml();
  const marker='<div class="section-label settings-section-head"><span>SCHEDULER TUNING</span>';
  if(h.includes(marker))h=h.replace(marker,block+marker);
  else h+=block;
  return h;
};

/* Statistics component visibility — applied to the final Statistics HTML so
   it also covers cards added by older/newer render wrappers. */
function v186StatsKeyFromLabel(text){
  const t=String(text||'').trim().toUpperCase();
  if(t==='LEVELING')return 'leveling';
  if(t==='LIFETIME ACHIEVEMENTS')return 'achievements';
  if(t==='LIFETIME')return 'lifetime';
  if(t==='UNITS')return 'units';
  if(t==='STREAK')return 'streak';
  if(t==='7-DAY MINUTES')return 'sevenDayMinutes';
  if(t==='7-DAY SESSIONS')return 'sevenDaySessions';
  if(t==='30-DAY DAILY MINUTES')return 'thirtyDayMinutes';
  if(t==='90-DAY ACTIVITY')return 'ninetyDayActivity';
  if(t==='30-DAY CATEGORY MIX')return 'categoryMix';
  if(t==='MEDIA TYPE MIX')return 'mediaTypeMix';
  if(t==='LIBRARY STATUS')return 'libraryStatus';
  if(t==='PRIORITY DISTRIBUTION')return 'priorityDistribution';
  if(t.includes('REPEAT CONSUMPTION'))return 'repeatConsumption';
  if(t==='LIBRARY HEALTH')return 'libraryHealth';
  if(t==='ADVANCED METRICS')return 'advancedMetrics';
  if(t.startsWith('CONSUMPTION HEATMAP'))return 'heatmap';
  if(t==='MONTHLY RECAP')return 'monthlyRecap';
  if(t.startsWith('CATEGORY BALANCE'))return 'categoryBalance';
  if(t==='RECENT SATURATION')return 'saturation';
  if(t==='RECORDS')return 'records';
  if(t==='RATINGS')return 'ratings';
  if(t==='TITLE COMPLETION TIMELINE')return 'completionTimeline';
  return '';
}

const v186RenderStatsBase=renderStats;
renderStats=function(){
  const html=v186RenderStatsBase.apply(this,arguments);
  const cfg=v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS).statsComponents.values;
  const host=document.createElement('div');
  host.innerHTML=html;

  if(cfg.profile===false)host.querySelector('.profile-stat-hero')?.remove();

  const summaryLabels={TODAY:'today','THIS WEEK':'week','THIS MONTH':'month'};
  host.querySelectorAll('.stat-box .lbl').forEach(lbl=>{
    const key=summaryLabels[String(lbl.textContent||'').trim().toUpperCase()];
    if(key&&cfg[key]===false)lbl.closest('.stat-box')?.remove();
  });

  host.querySelectorAll('.section-label').forEach(label=>{
    const key=v186StatsKeyFromLabel(label.textContent);
    if(!key||cfg[key]!==false)return;
    const card=label.closest('.card');
    if(card)card.remove();
  });

  host.querySelectorAll('.grid-3,.two-col,.v129-classic-stats-grid').forEach(group=>{
    const children=[...group.children].filter(el=>el.nodeType===1);
    if(children.length===0){group.remove();return;}
    if(children.length===1)group.style.gridTemplateColumns='minmax(0,1fr)';
  });
  host.querySelectorAll('.v130-classic-stats-section').forEach(section=>{
    if(!section.querySelector('.card'))section.remove();
  });

  return host.innerHTML;
};

/* Persistent state / cloud / backup. */
v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
DEFAULT_SETTINGS.v186ControlCenter=v186NormalizeControlCenter(
  DEFAULT_SETTINGS.v186ControlCenter,
  DEFAULT_CATEGORIES||[]
);

const v186PersistSettingsBase=persistSettings;
persistSettings=function(){
  v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  return v186PersistSettingsBase.apply(this,arguments);
};

const v186LoadAllBase=loadAll;
loadAll=async function(){
  await v186LoadAllBase.apply(this,arguments);
  v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
};

const v186SnapshotBase=snapshot;
snapshot=function(){
  v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const out=v186SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(Number(out.cloudSyncVersion)||0,V186_CLOUD_SYNC_VERSION);
  return out;
};

const v186ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v186ApplyStateBase.apply(this,arguments);
  v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  return result;
};

function v186PickNewer(a,b){
  return (Number(a?.modifiedAt)||0)>=(Number(b?.modifiedAt)||0)?a:b;
}

const v186MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v186MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};
  const av=v186NormalizeControlCenter(a?.settings?.v186ControlCenter,a?.categories||S.categories||[]);
  const bv=v186NormalizeControlCenter(b?.settings?.v186ControlCenter,b?.categories||S.categories||[]);
  out.settings.v186ControlCenter={
    scheduler:v186PickNewer(av.scheduler,bv.scheduler),
    todayBalance:v186PickNewer(av.todayBalance,bv.todayBalance),
    categoryBalance:v186PickNewer(av.categoryBalance,bv.categoryBalance),
    saturation:v186PickNewer(av.saturation,bv.saturation),
    statsComponents:v186PickNewer(av.statsComponents,bv.statsComponents)
  };
  out.cloudSyncVersion=Math.max(Number(a?.cloudSyncVersion)||0,Number(b?.cloudSyncVersion)||0,Number(out.cloudSyncVersion)||0,V186_CLOUD_SYNC_VERSION);
  return out;
};

const v186VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v186VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];
  const cloudCfg=v186NormalizeControlCenter(cloudState?.settings?.v186ControlCenter,cloudState?.categories||[]);
  const wantedCfg=v186NormalizeControlCenter(expected?.settings?.v186ControlCenter,expected?.categories||[]);
  if(JSON.stringify(cloudCfg)!==JSON.stringify(wantedCfg))problems.push('v186 category/statistics control center');
  if(Number(cloudState?.cloudSyncVersion||0)<V186_CLOUD_SYNC_VERSION)problems.push('v186 cloud state version');
  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

const v186BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS);
  const payload=v186BuildFullBackupBase.apply(this,arguments);
  payload.backupSchemaVersion=V186_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(payload,payload.portableExtras||{});
  payload.backupManifest.schemaVersion=V186_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v187 backup. Preserves the full v186 Control Center data schema and all prior Library, History, Dynamic Library, Overview, Logging, cover-size, recommendation/Respect XP, Statistics visibility, theme and protected cloud state. v187 fixes the v186 startup scope error (S is not defined) without introducing new persisted data fields.';
  return payload;
};

const v186BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v186BackupManifestBase.apply(this,arguments);
  const cfg=v186NormalizeControlCenter(state?.settings?.v186ControlCenter,state?.categories||[]);
  manifest.schemaVersion=V186_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{}, {
    exactDynamicCategoryPositionInput:true,
    dynamicCategoryEditDeleteActions:true,
    schedulerCategoryScope:true,
    todayBalanceCategoryScope:true,
    statisticsComponentVisibility:true,
    categoryBalanceCategoryScope:true,
    saturationCategoryScope:true,
    ratingQueueTitleDetailsClick:true,
    statisticsEmailHidden:true,
    v186CloudSyncAudit:true
  });
  manifest.v186={
    cloudSyncVersion:V186_CLOUD_SYNC_VERSION,
    schedulerMode:cfg.scheduler.mode,
    todayBalanceMode:cfg.todayBalance.mode,
    categoryBalanceMode:cfg.categoryBalance.mode,
    saturationMode:cfg.saturation.mode,
    visibleStatisticsComponents:Object.entries(cfg.statsComponents.values).filter(([,v])=>v!==false).map(([k])=>k),
    backupSchemaVersion:V186_BACKUP_SCHEMA_VERSION
  };
  manifest.v187={
    bugfix:'v186 control-center startup scope / authentication initialization',
    dataSchema:'v186-compatible',
    cloudSyncVersion:V186_CLOUD_SYNC_VERSION,
    backupSchemaVersion:V186_BACKUP_SCHEMA_VERSION
  };
  return manifest;
};


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
