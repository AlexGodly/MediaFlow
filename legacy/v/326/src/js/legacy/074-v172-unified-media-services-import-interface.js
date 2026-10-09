/* ============================================================
   MediaFlow v172 — Unified Media Services Import Interface
   ------------------------------------------------------------
   The old Normal and Advanced media-service cards are no longer rendered as
   two separate Settings sections. One shared section now exposes a switch:
     • Normal
     • Advanced (Recommended)

   The selected interface is an account Settings preference. Switching views
   does not discard the in-memory v169/v170 Advanced file scan workspace.
   ============================================================ */

const V172_BACKUP_SCHEMA_VERSION=10;

function v172NormalizeImportInterface(value){
  return String(value||'').toLowerCase()==='normal'
    ?'normal'
    :'advanced';
}

function v172EnsureImportInterfaceSettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.mediaServicesImportInterface=v172NormalizeImportInterface(
    settings.mediaServicesImportInterface
  );
  return settings;
}

v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);

function v172SetImportInterface(mode){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  S.settings.mediaServicesImportInterface=
    v172NormalizeImportInterface(mode);

  persistSettings();
  render();
}

function v172NormalMediaServicesBodyHtml(){
  return `<div class="card" style="margin-bottom:0;">
    <div style="font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:14px;">
      Import library exports from other tracking services or export your MediaFlow Library into exchange files for those services. MediaFlow merges matching titles and preserves progress, status, ratings, dates and external IDs when the source contains them.
    </div>

    <div class="field-row">
      <div class="field">
        <label class="field-label">Service / format</label>
        <select id="exchange-service">${mfExchangeServiceOptions()}</select>
      </div>
      <div class="field">
        <label class="field-label">Import</label>
        <button class="btn" onclick="App.pickExchangeImport()">Choose export file</button>
        <input id="exchange-file" type="file"
          accept=".json,.csv,.xml,.txt,application/json,text/csv,text/xml,application/xml"
          style="display:none"
          onchange="App.prepareExchangeImport(this.files[0])">
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
      <button class="btn btn-primary" onclick="App.exportExchange()">Export for selected service</button>
      <button class="btn" onclick="document.getElementById('mal-file').click()">Quick MAL XML import</button>
      <input type="file" id="mal-file" accept=".xml,text/xml" style="display:none"
        onchange="App.prepareLegacyImport('mal',this.files[0])">
      <button class="btn" onclick="document.getElementById('simkl-file').click()">Quick Simkl JSON import</button>
      <input type="file" id="simkl-file" accept=".json,application/json" style="display:none"
        onchange="App.prepareLegacyImport('simkl',this.files[0])">
    </div>

    <small class="hint">
      AniList · AniSearch · AniWatch · BetaSeries · Criticker · Crunchyroll · EpisodeCalendar · HiAnime · IMDb · Letterboxd · LiveChart · Kitsu · MoviesFad · MyAnimeList · MAL-XML · Netflix · PrimeWire · SeriesFad · Stremio · trakt · TV Time · Tviso · Twee · CSV · JSON. Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data. v158 also imports Start Date, Finish Date, source timestamps and external cover URLs whenever the source includes them.
    </small>
  </div>`;
}

function v172AdvancedMediaServicesBodyHtml(){
  let h=v169AdvancedImportHtml();

  // Remove only the old Advanced section heading. The complete v169/v170
  // Advanced card remains authoritative, including type mapping/exclusions.
  h=h.replace(
    /^<div class="section-label settings-section-head"><span>ADVANCED IMPORT \/ EXPORT — MEDIA SERVICES<\/span><\/div>\s*/,
    ''
  );

  // Mark Advanced as the recommended workflow inside the chosen interface.
  h=h.replace(
    /(<div class="card v169-advanced-card"[^>]*>)/,
    `$1<div class="v172-advanced-recommendation"><strong>Recommended</strong><span>Use Advanced Import when you want explicit category routing, per-source-type mapping, or “Don’t import” exclusions before Library changes are applied.</span></div>`
  );

  // The shared shell owns vertical spacing now.
  h=h.replace(
    'class="card v169-advanced-card" style="margin-bottom:22px;"',
    'class="card v169-advanced-card" style="margin-bottom:0;"'
  );

  return h;
}

function v172MediaServicesSectionHtml(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  const mode=S.settings.mediaServicesImportInterface;
  const advanced=mode==='advanced';

  return `<div class="section-label settings-section-head">
      <span>IMPORT / EXPORT — MEDIA SERVICES</span>
      ${defaultButton('mal')}
    </div>

    <div class="v172-import-interface-shell ${advanced?'is-advanced':'is-normal'}">
      <div class="v172-import-mode-bar">
        <div class="v172-import-mode-copy">
          <b>Import interface</b>
          <small>Use one interface at a time. You can switch whenever you need the extra routing controls.</small>
        </div>

        <div class="v172-import-switch" role="tablist" aria-label="Media services import interface">
          <button type="button"
            class="${advanced?'':'active'}"
            role="tab"
            aria-selected="${advanced?'false':'true'}"
            onclick="App.v172SetImportInterface('normal')">
            Normal
          </button>

          <button type="button"
            class="advanced-choice ${advanced?'active':''}"
            role="tab"
            aria-selected="${advanced?'true':'false'}"
            onclick="App.v172SetImportInterface('advanced')">
            Advanced
            <span class="v172-recommended-badge">RECOMMENDED</span>
          </button>
        </div>
      </div>

      ${advanced
        ?v172AdvancedMediaServicesBodyHtml()
        :v172NormalMediaServicesBodyHtml()}
    </div>`;
}

// Final Settings wrapper: collapse the legacy normal and separately-inserted
// advanced sections into one switchable section while preserving every section
// that may sit between them (for example Cover Maintenance).
const v172RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v172RenderSettingsBase();
  const placeholder='<!--MF_V172_MEDIA_SERVICES_INTERFACE-->';

  // Remove the old standard media-services section only.
  const normalPattern=/<div class="section-label settings-section-head"><span>IMPORT \/ EXPORT — MEDIA SERVICES<\/span>[\s\S]*?<small class="hint">AniList[\s\S]*?external cover URLs whenever the source includes them\.<\/small>\s*<\/div>/;

  if(normalPattern.test(h)){
    h=h.replace(normalPattern,placeholder);
  }else{
    // Backward-safe fallback for a build whose v158 descriptive suffix is absent.
    h=h.replace(
      /<div class="section-label settings-section-head"><span>IMPORT \/ EXPORT — MEDIA SERVICES<\/span>[\s\S]*?<small class="hint">AniList[\s\S]*?inventing missing data\.<\/small>\s*<\/div>/,
      placeholder
    );
  }

  // Remove the separately-rendered v169/v170 Advanced section.
  h=h.replace(
    /<div class="section-label settings-section-head"><span>ADVANCED IMPORT \/ EXPORT — MEDIA SERVICES<\/span><\/div>\s*<div class="card v169-advanced-card"[\s\S]*?parsed file is reused instead of being scanned again during import\.\s*<\/small>\s*<\/div>/,
    ''
  );

  // Insert one combined switchable interface at the original standard section.
  if(h.includes(placeholder)){
    h=h.replace(placeholder,v172MediaServicesSectionHtml());
  }

  return h;
};

Object.assign(App,{
  v172SetImportInterface
});

// ---- Persistence / cloud / Sync Now / backups ------------------------------

const v172PersistSettingsBase=persistSettings;
persistSettings=function(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  return v172PersistSettingsBase.apply(this,arguments);
};

const v172LoadAllBase=loadAll;
loadAll=async function(){
  await v172LoadAllBase.apply(this,arguments);
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
};

const v172SnapshotBase=snapshot;
snapshot=function(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  const x=v172SnapshotBase();

  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    172
  );

  return x;
};

const v172ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v172ApplyStateBase.apply(this,arguments);
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v172MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v172MergeStatesBase(a,b)||{};
  out.settings=out.settings||{};

  out.settings.mediaServicesImportInterface=
    v172NormalizeImportInterface(
      out.settings.mediaServicesImportInterface ??
      a?.settings?.mediaServicesImportInterface ??
      b?.settings?.mediaServicesImportInterface
    );

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    172
  );

  return out;
};

const v172VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v172VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloudMode=v172NormalizeImportInterface(
    cloudState?.settings?.mediaServicesImportInterface
  );
  const wantedMode=v172NormalizeImportInterface(
    expected?.settings?.mediaServicesImportInterface
  );

  if(cloudMode!==wantedMode){
    problems.push('Media Services import interface preference');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v172BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v172EnsureImportInterfaceSettings(S.settings||DEFAULT_SETTINGS);
  const payload=v172BuildFullBackupBase();

  payload.backupSchemaVersion=V172_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V172_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v172 backup. Includes the unified Normal/Advanced media-services import interface preference, category recovery/default identity, advanced routing/exclusions, automatic Seasonal/Jikan state, System Respect XP, themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v172BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v172BackupManifestBase(state,extras);

  manifest.schemaVersion=V172_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    unifiedMediaServicesImportInterface:true,
    mediaServicesImportInterfacePreference:true,
    advancedImportRecommended:true
  });

  return manifest;
};

// v152 Automatic Backup calls the final v148BuildFullBackup() dynamically, so
// the v172 interface preference is included automatically. Full JSON import
// restores Settings through the final v46ApplyState() chain above.



/* ============================================================
   MediaFlow v173
   - Order: direct Edit + optional pagination for All Titles / By Category
   - Old System: Date View mode with From / To range simulation
   - Themes: Recommended-only, On This Day-only, and selectable
     Recommendation + On This Day rotation collections
   ============================================================ */

const V173_BACKUP_SCHEMA_VERSION=11;
const V173_ORDER_PAGE_SIZE=50;

function v173Clone(value,fallback){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){
    try{return JSON.parse(JSON.stringify(fallback));}
    catch(__){return fallback;}
  }
}

