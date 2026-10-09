/* ============================================================
   MediaFlow v196 — Settings Presets
   ------------------------------------------------------------
   Canonical settings-only portability path.

   IMPORTANT FOR FUTURE MEDIAFLOW RELEASES:
   - New persistent settings stored anywhere inside S.settings are included
     automatically because the entire settings object is cloned here.
   - Category configuration/order is exported too because Categories are edited
     from Settings but live outside S.settings.
   - If a future Settings feature stores persistent configuration somewhere
     outside S.settings/categories/categoryOrder, extend this canonical builder
     at the same time as Full Backup, Automatic Backup, cloud/Sync Now and XP
     persistence audits.
   - Library, consumption History, Library History, XP ledgers, profile data,
     current tasks, stopwatch state and other account content are intentionally
     excluded from a Settings Preset.
   ============================================================ */
const V196_SETTINGS_PRESET_SCHEMA_VERSION=1;
const V196_SETTINGS_PRESET_FORMAT='MediaFlow_Settings_Preset';

function v196SettingsPresetTimestamp(date=new Date()){
  const pad=n=>String(n).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function v196BuildSettingsPreset(){
  const now=new Date();
  return {
    presetFormat:V196_SETTINGS_PRESET_FORMAT,
    presetSchemaVersion:V196_SETTINGS_PRESET_SCHEMA_VERSION,
    mediaFlowVersion:v161CurrentVersion(),
    exportedAt:now.toISOString(),
    settings:v148SafeClone(S.settings||DEFAULT_SETTINGS,{}),
    categories:v148SafeClone(Array.isArray(S.categories)?S.categories:[],[]),
    categoryOrder:v74SyncCategoryOrder().slice(),
    presetManifest:{
      settingsOnly:true,
      canonicalSettingsObject:'S.settings',
      includes:{
        allSettingsFields:true,
        categoryConfiguration:true,
        categoryOrder:true,
        themes:true,
        schedulerSettings:true,
        levelingConfiguration:true,
        dashboardSectionSettings:true,
        libraryPresentationSettings:true,
        backupPreferences:true
      },
      excludes:{
        library:true,
        consumptionHistory:true,
        libraryHistory:true,
        xpLedgers:true,
        profile:true,
        stopwatchState:true,
        currentTask:true,
        activeSession:true,
        personalOrder:true,
        ratingQueue:true,
        completionTimeline:true,
        authentication:true,
        cloudCredentials:true
      },
      note:'Settings Presets contain configuration only. They do not contain Library titles, History, XP/progression, profile data or authentication credentials.'
    }
  };
}

function v196ValidateSettingsPreset(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return {ok:false,message:'This file is not a MediaFlow Settings Preset.'};
  if(String(data.presetFormat||'')!==V196_SETTINGS_PRESET_FORMAT)return {ok:false,message:'This JSON is not a MediaFlow Settings Preset.'};
  if(!data.settings||typeof data.settings!=='object'||Array.isArray(data.settings))return {ok:false,message:'This Settings Preset does not contain a valid settings object.'};
  const schema=Number(data.presetSchemaVersion)||0;
  if(schema<1)return {ok:false,message:'This Settings Preset uses an unsupported schema.'};
  return {ok:true};
}

function v196NormalizeImportedSettings(raw){
  const incoming=v148SafeClone(raw,{});
  const next=Object.assign({},DEFAULT_SETTINGS,incoming||{});
  next.backup=Object.assign({},DEFAULT_SETTINGS.backup,incoming?.backup||{});
  next.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,incoming?.leveling||{});
  next.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,incoming?.leveling?.unitXP||{});
  next.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,incoming?.leveling?.rotationMultiplier||{});
  return next;
}

function v196MergePresetCategories(presetCategories,presetOrder){
  if(!Array.isArray(presetCategories)||!presetCategories.length)return;
  const current=Array.isArray(S.categories)?S.categories:[];
  const currentById=new Map(current.map(c=>[String(c?.id||''),c]));
  const merged=[];
  for(const raw of presetCategories){
    if(!raw||typeof raw!=='object')continue;
    const id=String(raw.id||'').trim();
    if(!id)continue;
    const existing=currentById.get(id)||{};
    merged.push(Object.assign({},existing,v148SafeClone(raw,{}),{id}));
    currentById.delete(id);
  }
  // Never delete an account's newer/extra categories just because an older
  // settings preset did not know about them. Append them after preset entries.
  for(const c of currentById.values())merged.push(c);
  if(merged.length)S.categories=merged;
  const order=Array.isArray(presetOrder)?presetOrder.map(String):[];
  if(order.length)v74ApplyCategoryOrder(order);
  else v74SyncCategoryOrder();
}

App.exportSettingsPreset=function(){
  showDataProgress('Exporting Settings Preset','Collecting MediaFlow configuration only…',12);
  setTimeout(()=>{
    try{
      const payload=v196BuildSettingsPreset();
      updateDataProgress(58,'Packing Settings, category configuration and presentation preferences…');
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
      const stamp=v196SettingsPresetTimestamp(new Date(payload.exportedAt));
      const filename=`MediaFlow_Settings_${stamp}.json`;
      updateDataProgress(88,'Creating Settings Preset download…');
      triggerDownload(blob,filename);
      finishDataProgress(true,'Settings Preset exported',`${filename} · configuration only — Library, History and XP data were not included.`);
    }catch(e){
      console.error(e);
      finishDataProgress(false,'Settings Preset export failed','MediaFlow could not create the settings preset file.');
    }
  },30);
};

App.importSettingsPreset=async function(file){
  if(!file)return;
  showDataProgress('Importing Settings Preset','Reading settings-only preset…',8);
  try{
    const data=JSON.parse(await file.text());
    const validation=v196ValidateSettingsPreset(data);
    if(!validation.ok){
      finishDataProgress(false,'Preset rejected',validation.message);
      return;
    }
    updateDataProgress(30,'Applying MediaFlow settings…');
    S.settings=v196NormalizeImportedSettings(data.settings);
    v196MergePresetCategories(data.categories,data.categoryOrder||data.settings?.categoryOrder||[]);
    S.settings.categoryOrder=v74SyncCategoryOrder().slice();

    // Let the current release's normalizers keep every nested setting current.
    try{v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);}catch(_){ }
    try{v194EnsureCategoryIconSettings(S.settings||DEFAULT_SETTINGS);}catch(_){ }
    try{applyTheme(S.settings?.theme||'dark');}catch(_){ }
    try{v194ApplyCategoryIconScale();}catch(_){ }
    try{localStorage.setItem('mf_theme',String(S.settings?.theme||'dark'));}catch(_){ }
    try{restartBackupTimer();}catch(_){ }

    updateDataProgress(72,'Saving imported settings to your MediaFlow account…');
    await saveState();
    await saveQueue;
    if(lastSaveFailed||V115_STARTUP_GUARD)throw new Error('Cloud save not confirmed. Imported settings are still in memory; use Sync Now after your cloud connection recovers.');
    render();
    finishDataProgress(true,'Settings Preset imported','Settings and category configuration were applied. Library, History, XP and profile data were left untouched.');
  }catch(e){
    console.error(e);
    finishDataProgress(false,'Settings Preset import failed',lastSaveFailed?'Settings were applied locally, but the cloud save failed. Keep your preset file and retry Sync Now once connected.':'Could not read that preset. Make sure it is a valid MediaFlow Settings Preset JSON file.');
  }finally{
    try{const input=document.getElementById('v196-settings-preset-file');if(input)input.value='';}catch(_){ }
  }
};

function v196SettingsPresetCard(){
  return `<div class="section-label">SETTINGS PRESET</div>
    <div class="card v196-settings-preset-card" style="margin-bottom:22px">
      <div class="v196-settings-preset-head">
        <div>
          <b>Settings-only preset</b>
          <div class="hint">Export your MediaFlow configuration without exporting your Library, History, XP, profile or other account data. The preset includes the complete current Settings object plus category configuration and category order.</div>
        </div>
      </div>
      <div class="v196-settings-preset-actions">
        <button class="btn btn-primary" type="button" onclick="App.exportSettingsPreset()">Export settings preset</button>
        <button class="btn" type="button" onclick="document.getElementById('v196-settings-preset-file').click()">Import settings preset</button>
        <input id="v196-settings-preset-file" type="file" accept="application/json,.json" style="display:none" onchange="App.importSettingsPreset(this.files[0])">
      </div>
    </div>`;
}

const v196RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v196RenderSettingsBase.apply(this,arguments);
  const marker='<div class="section-label">DATA</div>';
  if(h.includes(marker))h=h.replace(marker,v196SettingsPresetCard()+marker);
  else h+=v196SettingsPresetCard();
  return h;
};


/* ============================================================
   MediaFlow v198 — Settings Preset UI Cleanup
   - Removed the visible preset-schema badge from Settings.
   - Removed the internal/export-filename explanatory hint from Settings.
   - Corrected Settings Preset exports to MediaFlow_Settings_<timestamp>.json.
   - UI/export-name only: no persistent schema bump required.
   ============================================================ */

/* ============================================================
   MediaFlow v199 — Global Library Status Terminology
   ------------------------------------------------------------
   User-facing Library statuses now use one canonical vocabulary everywhere:
   active    -> Watching
   paused    -> On Hold
   dropped   -> Dropped
   completed -> Completed
   planned   -> Plan to Watch

   Internal status ids stay unchanged for backward compatibility with existing
   Library data, imports, cloud state, backups, Settings Presets and APIs.
   ============================================================ */
function v199StatusLabel(value){
  const key=String(value||'planned').toLowerCase();
  return ({
    active:'Watching',
    paused:'On Hold',
    dropped:'Dropped',
    completed:'Completed',
    planned:'Plan to Watch'
  })[key] || String(value||'Plan to Watch');
}

