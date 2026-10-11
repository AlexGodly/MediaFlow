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

