/* ============================================================
   MediaFlow v182
   - Minimalist, theme-aware Dynamic Library navigation
   - No horizontal Dynamic Library navigation scrollbars
   - Full Backup schema v19
   - Cloud/Sync Now audit bumped to v182
   - Automatic Backup keeps using the final Full Backup builder
   ============================================================ */

const V182_BACKUP_SCHEMA_VERSION=19;
const V182_CLOUD_SYNC_VERSION=182;

/* v182 does not duplicate the Library configuration introduced in v181.
   The same category order/visibility, status order, active category/status,
   display mode, default Logging mode and cover-size settings remain the
   canonical persistent data. The redesign is presentation-only and therefore
   remains automatically compatible with v181 backups. */

/* Cloud snapshots now identify themselves as v182 while preserving the entire
   v181 Settings object and every older persistent field. */
const v182SnapshotBase=snapshot;
snapshot=function(){
  const out=v182SnapshotBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(
    Number(out.cloudSyncVersion)||0,
    V182_CLOUD_SYNC_VERSION
  );
  return out;
};

const v182MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v182MergeStatesBase.apply(this,arguments)||{};
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    V182_CLOUD_SYNC_VERSION
  );
  return out;
};

/* Protected Sync Now keeps every prior verification and additionally verifies
   that the final cloud snapshot is from the v182 state pipeline. */
const v182VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v182VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];

  if(Number(cloudState?.cloudSyncVersion||0)<V182_CLOUD_SYNC_VERSION){
    problems.push('v182 cloud state version');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* Full Backup / manual export / Automatic Backup.
   v152 Automatic Backup resolves v148BuildFullBackup dynamically, so wrapping
   the final builder here updates both manual and automatic exports. */
const v182BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v182BuildFullBackupBase.apply(this,arguments);

  payload.backupSchemaVersion=V182_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V182_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note=
    'Complete MediaFlow v182 backup. Includes the complete v181 Dynamic Library configuration, five Library display modes, default Logging preference, unlimited per-surface cover sizing, all recommendation/reroll and System Respect XP history, plus every prior Library, History, Order, progression, theme and cloud-synced field. v182 redesigns Dynamic Library navigation as minimalist theme-aware category/status tabs with no horizontal navigation scrollbar. The visual redesign introduces no destructive data migration and remains backward-compatible with older complete MediaFlow backups.';

  return payload;
};

const v182BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v182BackupManifestBase.apply(this,arguments);

  manifest.schemaVersion=V182_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      minimalistDynamicLibraryNavigation:true,
      themeAwareDynamicLibraryNavigation:true,
      noHorizontalDynamicNavigationScrollbar:true,
      v181DynamicLibraryDataCompatibility:true,
      v182CloudSyncAudit:true
    }
  );

  manifest.v182DynamicLibrary={
    navigationStyle:'minimal-theme-aware',
    horizontalNavigationScrollbar:false,
    persistentConfigurationSource:'settings.v181Library'
  };

  manifest.v182Cloud={
    cloudSyncVersion:V182_CLOUD_SYNC_VERSION,
    verifiesV181LibraryExperience:true,
    verifiesDefaultLoggingMode:true,
    verifiesPerSurfaceCoverSizes:true
  };


  return manifest;
};


/* ============================================================
   MediaFlow v183
   - Readability pass for pagination/cover-size controls everywhere
   - Shared persistent Show/Hide Library Overview switch
   - Overview available in both Current and Dynamic Library modes
   - Full Backup schema v20
   - Cloud/Sync Now audit bumped to v183
   ============================================================ */

const V183_BACKUP_SCHEMA_VERSION=20;
const V183_CLOUD_SYNC_VERSION=183;
const V183_LIBRARY_OVERVIEW_DEFAULT={
  showOverview:true,
  modifiedAt:0
};

function v183NormalizeLibraryOverview(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    showOverview:src.showOverview!==false,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v183EnsureLibraryOverview(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v183LibraryOverview=v183NormalizeLibraryOverview(
    settings.v183LibraryOverview
  );
  return settings.v183LibraryOverview;
}

function v183LibraryOverviewEnabled(){
  return v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS).showOverview!==false;
}

function v183LibraryOverviewToggleHtml(){
  const shown=v183LibraryOverviewEnabled();
  return `<div class="v183-library-overview-toggle">
    <div class="v183-library-overview-toggle-copy">
      <b>Library overview</b>
      <small>Use the same overview visibility in both Current and Dynamic Library modes.</small>
    </div>
    <div class="v183-library-overview-toggle-actions">
      <span class="v183-library-overview-toggle-state">${shown?'Shown':'Hidden'}</span>
      <button type="button"
        class="toggle ${shown?'on':''}"
        onclick="App.v183ToggleLibraryOverview()"
        aria-label="${shown?'Hide':'Show'} Library overview"
        aria-pressed="${shown?'true':'false'}"></button>
    </div>
  </div>`;
}

function v183LibraryOverviewEstimate(cat,x){
  if(!x.items)return {total:0,pct:0,estimated:false};
  if(!x.unknown&&x.total>0){
    return {
      total:x.total,
      pct:Math.min(100,Math.round(x.knownDone/x.total*100)),
      estimated:false
    };
  }

  const knownItems=(S.library||[]).filter(
    i=>i&&i.categoryId===cat.id&&Number(i.total)>0
  );
  const knownAvg=knownItems.length
    ?knownItems.reduce((sum,i)=>sum+Number(i.total),0)/knownItems.length
    :0;
  const unknownCount=(S.library||[]).filter(
    i=>i&&i.categoryId===cat.id&&!(Number(i.total)>0)
  ).length;
  const observed=Math.max(0,Number(x.done)||0);
  const baseline=Math.max(1,Number(cat.target)||1);
  const perUnknown=knownAvg>0
    ?knownAvg
    :Math.max(
        baseline*4,
        observed/Math.max(1,x.items)*1.35,
        12
      );
  const estimatedTotal=Math.max(
    Math.ceil(x.total+unknownCount*perUnknown),
    Math.ceil(observed*1.12),
    observed||1
  );

  return {
    total:estimatedTotal,
    pct:Math.min(99,Math.round(observed/estimatedTotal*100)),
    estimated:true
  };
}

function v183LibraryOverviewHtml(){
  const ov=v53LibraryOverview();
  const rows=(S.categories||[]).map(cat=>{
    const x=ov.byCat.get(cat.id)||{
      items:0,
      done:0,
      knownDone:0,
      total:0,
      unknown:false
    };
    const est=v183LibraryOverviewEstimate(cat,x);
    const pct=est.pct;
    const progressText=x.items===0
      ?'0 / -'
      :(est.estimated
        ?`${x.done} / ≈${est.total} (~${pct}%)`
        :`${x.done} / ${est.total} (${pct}%)`);
    const approxTitle=est.estimated
      ?'Approximate overview only — unknown title totals are estimated for this progress bar and are not saved to Library titles.'
      :'';

    return `<div class="overview-row" ${approxTitle?`title="${escapeHtml(approxTitle)}"`:''}>
      <div class="ov-name"><span>${v144CategoryIconHtml(cat)}</span> ${escapeHtml(cat.name)}</div>
      <div class="ov-track"><div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:linear-gradient(90deg, ${cat.color}88, ${cat.color});"></div></div></div>
      <div class="ov-num">${progressText}</div>
    </div>`;
  }).join('');

  return `<div class="v183-library-overview-block">
    <div class="section-label">OVERVIEW · ${ov.overallPct}% of known tracked totals cleared <span style="font-weight:500;text-transform:none;letter-spacing:0;opacity:.72;">· ≈ means display-only estimate</span></div>
    <div class="card" style="margin-bottom:26px;">${rows}</div>
  </div>`;
}

function v183ToggleLibraryOverview(){
  const cfg=v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  cfg.showOverview=!cfg.showOverview;
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(cfg.showOverview?'Library overview shown':'Library overview hidden');
}

App.v183ToggleLibraryOverview=v183ToggleLibraryOverview;
v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);

/* Persistence / load / cloud state. */
const v183PersistSettingsBase=persistSettings;
persistSettings=function(){
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  return v183PersistSettingsBase.apply(this,arguments);
};

const v183LoadAllBase=loadAll;
loadAll=async function(){
  await v183LoadAllBase.apply(this,arguments);
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
};

const v183SnapshotBase=snapshot;
snapshot=function(){
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  const out=v183SnapshotBase.apply(this,arguments)||{};
  out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  out.cloudSyncVersion=Math.max(
    Number(out.cloudSyncVersion)||0,
    V183_CLOUD_SYNC_VERSION
  );
  return out;
};

const v183ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v183ApplyStateBase.apply(this,arguments);
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v183MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v183MergeStatesBase.apply(this,arguments)||{};
  out.settings=out.settings||{};

  const av=v183NormalizeLibraryOverview(a?.settings?.v183LibraryOverview);
  const bv=v183NormalizeLibraryOverview(b?.settings?.v183LibraryOverview);
  out.settings.v183LibraryOverview=
    (Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)
      ?av
      :bv;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    V183_CLOUD_SYNC_VERSION
  );
  return out;
};

const v183VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v183VerifyCloudStateBase.apply(this,arguments);
  const problems=[...(base?.missing||[])];

  const cloudOverview=v183NormalizeLibraryOverview(
    cloudState?.settings?.v183LibraryOverview
  );
  const wantedOverview=v183NormalizeLibraryOverview(
    expected?.settings?.v183LibraryOverview
  );

  if(JSON.stringify(cloudOverview)!==JSON.stringify(wantedOverview)){
    problems.push('Library overview visibility');
  }
  if(Number(cloudState?.cloudSyncVersion||0)<V183_CLOUD_SYNC_VERSION){
    problems.push('v183 cloud state version');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* Full Backup / manual export / Automatic Backup. */
const v183BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v183EnsureLibraryOverview(S.settings||DEFAULT_SETTINGS);
  const payload=v183BuildFullBackupBase.apply(this,arguments);

  payload.backupSchemaVersion=V183_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V183_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note=
    'Complete MediaFlow v183 backup. Includes the shared Current/Dynamic Library Overview visibility preference, the full v181 Dynamic Library configuration, all five Library display modes, default Logging preference, unlimited per-surface cover sizing, recommendation/reroll and System Respect XP history, and every prior Library, History, Order, progression, theme and cloud-synced field. v183 also increases pagination/cover-control readability across MediaFlow without changing their underlying data.';

  return payload;
};

const v183BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v183BackupManifestBase.apply(this,arguments);
  const overview=v183NormalizeLibraryOverview(
    state?.settings?.v183LibraryOverview
  );

  manifest.schemaVersion=V183_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      readablePaginationAndCoverControls:true,
      sharedLibraryOverviewVisibility:true,
      libraryOverviewInCurrentMode:true,
      libraryOverviewInDynamicMode:true,
      v183CloudSyncAudit:true
    }
  );
  manifest.v183LibraryOverview={
    showOverview:overview.showOverview,
    sharedAcrossCurrentAndDynamic:true
  };
  manifest.v183Cloud={
    cloudSyncVersion:V183_CLOUD_SYNC_VERSION,
    verifiesLibraryOverviewVisibility:true
  };

  return manifest;
};

/* ============================================================
   MediaFlow v184 — Settings readability metadata
   UI-only release: no persisted data shape changed, so Full Backup
   schema v20 and Cloud Sync state v183 remain intentionally compatible.
   ============================================================ */
const v184BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v184BuildFullBackupBase.apply(this,arguments);
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  if(payload.backupManifest){
    payload.backupManifest.note=
      'Complete MediaFlow v185 backup. Preserves the full v183 data schema and all prior Library, History, Dynamic Library, Overview, Logging, cover-size, recommendation/Respect XP, theme and cloud-synced data. v185 is a title-details readability release and does not introduce a new persisted data field.';
  }
  return payload;
};

const v184BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v184BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{}, {
    readableDynamicLibrarySettingsText:true,
    readableCategoryRecoverySettingsText:true
  });
  manifest.v185={
    settingsTypographyReadability:true,
    dataSchemaChanged:false
  };
  return manifest;
};



/* v186 hotfix: keep control-center logic inside the main MediaFlow scope. */
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


