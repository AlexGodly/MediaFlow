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


