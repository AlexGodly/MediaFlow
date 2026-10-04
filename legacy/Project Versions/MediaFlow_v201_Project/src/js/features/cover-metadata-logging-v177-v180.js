/* MediaFlow v201 source fragment
 * Cover sizing, metadata editor, dual logging and recommendation rerolls
 * Original HTML lines 32328-35316.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   MediaFlow v177 — Adjustable Library & Order Cover Size
   ============================================================ */

const V177_BACKUP_SCHEMA_VERSION=14;
const V177_COVER_SIZE_DEFAULTS={
  library:100,
  order:100,
  modifiedAt:0
};

function v177ClampCoverSize(value,fallback=100){
  const n=Math.round(Number(value));
  if(!Number.isFinite(n)){
    return Math.max(50,Math.min(180,Math.round(Number(fallback)||100)));
  }
  return Math.max(50,Math.min(180,n));
}

function v177NormalizeCoverSizes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};

  return {
    library:v177ClampCoverSize(
      src.library,
      V177_COVER_SIZE_DEFAULTS.library
    ),
    order:v177ClampCoverSize(
      src.order,
      V177_COVER_SIZE_DEFAULTS.order
    ),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v177EnsureCoverSizes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v177CoverSizes=v177NormalizeCoverSizes(
    settings.v177CoverSizes
  );
  return settings.v177CoverSizes;
}

function v177CoverSize(kind){
  const cfg=v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return kind==='order'?cfg.order:cfg.library;
}

function v177ScaleValue(kind){
  return (v177CoverSize(kind)/100).toFixed(2);
}

function v177CoverSliderHtml(kind,label){
  const value=v177CoverSize(kind);
  const safeKind=kind==='order'?'order':'library';

  return `<label class="v177-cover-size-control">
    <span>${escapeHtml(label)}</span>
    <input type="range"
      min="50"
      max="180"
      step="5"
      value="${value}"
      oninput="App.v177PreviewCoverSize('${safeKind}',this.value)"
      onchange="App.v177SetCoverSize('${safeKind}',this.value)"
      aria-label="${escapeHtml(label)}">
    <span id="v177-${safeKind}-cover-value"
      class="v177-cover-size-value">${value}%</span>
  </label>`;
}

function v177PreviewCoverSize(kind,value){
  const safeKind=kind==='order'?'order':'library';
  const pct=v177ClampCoverSize(value,100);
  const scale=(pct/100).toFixed(2);

  const scope=document.querySelector(
    `[data-v177-cover-scope="${safeKind}"]`
  );

  if(scope){
    scope.style.setProperty(
      safeKind==='order'
        ?'--v177-order-scale'
        :'--v177-library-scale',
      scale
    );
  }

  const label=document.getElementById(
    `v177-${safeKind}-cover-value`
  );
  if(label)label.textContent=`${pct}%`;
}

function v177SetCoverSize(kind,value){
  const safeKind=kind==='order'?'order':'library';
  const cfg=v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

  cfg[safeKind]=v177ClampCoverSize(value,100);
  cfg.modifiedAt=Date.now();

  persistSettings();

  // Keep the live preview instant; no heavy Library rerender is required just
  // to move the slider. A normal navigation/render will read the saved value.
  v177PreviewCoverSize(safeKind,cfg[safeKind]);
}

v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);

Object.assign(App,{
  v177PreviewCoverSize,
  v177SetCoverSize
});

/* ---------- Library slider ----------------------------------- */

const v177RenderLibraryBase=renderLibrary;
renderLibrary=function(){
  let h=v177RenderLibraryBase();
  const slider=v177CoverSliderHtml(
    'library',
    'Cover size'
  );

  const pageControl=v175PageSizeControlHtml(
    'library',
    'Titles per page'
  );

  if(h.includes(pageControl)){
    h=h.replace(
      pageControl,
      pageControl+slider
    );
  }else{
    // Fallback: place it next to the priority filter if a future build changes
    // the page-size control's exact markup.
    h=h.replace(
      /(<select onchange="App\.setLibFilter\('libPriority', this\.value\)">[\s\S]*?<\/select>)/,
      `$1${slider}`
    );
  }

  return `<div class="v177-library-cover-scope"
    data-v177-cover-scope="library"
    style="--v177-library-scale:${v177ScaleValue('library')}">
      ${h}
    </div>`;
};

/* ---------- Order slider ------------------------------------- */

const v177RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v177RenderOrderBase();

  const slider=`<div class="v177-order-cover-tools">
    ${v177CoverSliderHtml('order','Cover size')}
  </div>`;

  if(h.includes('class="v175-order-pagination-settings"')){
    h=h.replace(
      /(<div class="v175-order-pagination-settings">[\s\S]*?<\/div>)/,
      `$1${slider}`
    );
  }else{
    h=h.replace(
      /(<div class="v138-order-switch">[\s\S]*?<\/div>)/,
      `$1${slider}`
    );
  }

  return `<div class="v177-order-cover-scope"
    data-v177-cover-scope="order"
    style="--v177-order-scale:${v177ScaleValue('order')}">
      ${h}
    </div>`;
};

/* ============================================================
   Persistence / cloud / Sync Now / backup
   ============================================================ */

const v177PersistSettingsBase=persistSettings;
persistSettings=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return v177PersistSettingsBase.apply(this,arguments);
};

const v177LoadAllBase=loadAll;
loadAll=async function(){
  await v177LoadAllBase.apply(this,arguments);
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
};

const v177SnapshotBase=snapshot;
snapshot=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  const x=v177SnapshotBase();

  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    177
  );

  return x;
};

const v177ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v177ApplyStateBase.apply(this,arguments);
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v177MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v177MergeStatesBase(a,b)||{};

  const ac=v177NormalizeCoverSizes(
    a?.settings?.v177CoverSizes
  );
  const bc=v177NormalizeCoverSizes(
    b?.settings?.v177CoverSizes
  );

  out.settings=out.settings||{};
  out.settings.v177CoverSizes=
    (Number(ac.modifiedAt)||0)>=(Number(bc.modifiedAt)||0)
      ?ac
      :bc;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    177
  );

  return out;
};

const v177VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v177VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v177NormalizeCoverSizes(
    cloudState?.settings?.v177CoverSizes
  );
  const wanted=v177NormalizeCoverSizes(
    expected?.settings?.v177CoverSizes
  );

  if(JSON.stringify(cloud)!==JSON.stringify(wanted)){
    problems.push('Library / Order cover sizes');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v177BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v177EnsureCoverSizes(S.settings||DEFAULT_SETTINGS);
  const payload=v177BuildFullBackupBase();

  payload.backupSchemaVersion=V177_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V177_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v177 backup. Includes independent responsive cover-size preferences for Library and Personal Order (50%–180%), alongside all prior rich title metadata, configurable pagination, category recovery, Advanced Import routing/exclusions, Old System Date View, adaptive cover collections, System Respect XP, Library/History, Personal Order, Rating Queue and portable preferences.';

  return payload;
};

const v177BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v177BackupManifestBase(
    state,
    extras
  );
  const sizes=v177NormalizeCoverSizes(
    state?.settings?.v177CoverSizes
  );

  manifest.schemaVersion=V177_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      adjustableLibraryCoverSize:true,
      adjustableOrderCoverSize:true,
      responsiveCoverScaling:true
    }
  );

  manifest.coverSizes={
    libraryPercent:sizes.library,
    orderPercent:sizes.order
  };

  return manifest;
};

// v152 Automatic Backup resolves the final v148BuildFullBackup() at call time,
// so the v177 cover-size preferences are included automatically.


/* ============================================================
   MediaFlow v178 — Editable Rich Imported Metadata
   ------------------------------------------------------------
   v176 introduced source-provided rich title metadata. v178 exposes those
   fields in the normal Library editor and protects fields the user manually
   changes from later media-service imports.
   ============================================================ */

const V178_BACKUP_SCHEMA_VERSION=15;

const V178_EDITABLE_RICH_FIELDS=[
  'year',
  'mediaFormat',
  'durationMinutes',
  'releaseDate',
  'seasonLabel',
  'ageRating',
  'communityScore',
  'mediaSource',
  'demographic',
  'studios',
  'producers',
  'genres',
  'themes',
  'synopsis'
];

function v178ManualMap(item){
  const src=item?.richMetadataManual;
  if(!src||typeof src!=='object'||Array.isArray(src))return {};
  const out={};
  for(const key of V178_EDITABLE_RICH_FIELDS){
    if(src[key]===true)out[key]=true;
  }
  return out;
}

function v178CommaText(value){
  return Array.isArray(value)
    ?value.filter(Boolean).join(', ')
    :'';
}

function v178CsvList(value){
  return [...new Set(
    String(value||'')
      .split(',')
      .map(x=>v176SafeText(x,120))
      .filter(Boolean)
  )].slice(0,40);
}

function v178FieldLockBadge(item,key){
  return v178ManualMap(item)[key]
    ?'<span class="v178-import-lock" title="You manually edited this field. Future imports will not overwrite it.">MANUAL</span>'
    :'';
}

function v178RichEditorHtml(d){
  const item=d&&typeof d==='object'?d:{};

  const n=value=>{
    const x=Number(value);
    return Number.isFinite(x)&&x>0?x:'';
  };

  return `<details class="v178-rich-editor" ${v176HasRichMetadata(item)||Number(item.year)>0?'open':''}>
    <summary>
      <span>Title details / imported metadata</span>
      <span class="hint" style="margin:0">Editable</span>
    </summary>

    <div class="v178-rich-editor-body">
      <div class="v178-rich-editor-note">
        These fields can be filled by supported imports when the source actually provides them. You can edit or clear them manually. A field you manually change becomes protected from later media-service imports so your edit is not silently overwritten.
      </div>

      <div class="v178-rich-grid">
        <div class="field"><label class="field-label">Year ${v178FieldLockBadge(item,'year')}</label>
          <input type="number" id="l-rich-year" min="0" max="9999" step="1"
            value="${n(item.year)}" placeholder="e.g. 2026">
        </div>

        <div class="field">
          <label class="field-label">Media format ${v178FieldLockBadge(item,'mediaFormat')}</label>
          <input type="text" id="l-rich-format"
            value="${escapeHtml(String(item.mediaFormat||''))}"
            placeholder="TV, Movie, OVA, Manga…">
        </div>

        <div class="field">
          <label class="field-label">Runtime / duration (minutes) ${v178FieldLockBadge(item,'durationMinutes')}</label>
          <input type="number" id="l-rich-duration" min="0" step="1"
            value="${n(item.durationMinutes)}"
            placeholder="e.g. 24">
        </div>

        <div class="field">
          <label class="field-label">Release date ${v178FieldLockBadge(item,'releaseDate')}</label>
          <input type="date" id="l-rich-release-date"
            value="${escapeHtml(String(item.releaseDate||''))}">
        </div>

        <div class="field">
          <label class="field-label">Season ${v178FieldLockBadge(item,'seasonLabel')}</label>
          <input type="text" id="l-rich-season"
            value="${escapeHtml(String(item.seasonLabel||''))}"
            placeholder="Fall 2026">
        </div>

        <div class="field">
          <label class="field-label">Content / age rating ${v178FieldLockBadge(item,'ageRating')}</label>
          <input type="text" id="l-rich-age-rating"
            value="${escapeHtml(String(item.ageRating||''))}"
            placeholder="PG-13, TV-MA, 16+…">
        </div>

        <div class="field">
          <label class="field-label">Community score (0–10) ${v178FieldLockBadge(item,'communityScore')}</label>
          <input type="number" id="l-rich-community-score"
            min="0" max="10" step="0.01"
            value="${n(item.communityScore)}"
            placeholder="Not available">
        </div>

        <div class="field">
          <label class="field-label">Source material ${v178FieldLockBadge(item,'mediaSource')}</label>
          <input type="text" id="l-rich-source"
            value="${escapeHtml(String(item.mediaSource||''))}"
            placeholder="Manga, Light novel, Original…">
        </div>

        <div class="field">
          <label class="field-label">Demographic ${v178FieldLockBadge(item,'demographic')}</label>
          <input type="text" id="l-rich-demographic"
            value="${escapeHtml(String(item.demographic||''))}"
            placeholder="Shounen, Seinen…">
        </div>

        <div class="field">
          <label class="field-label">Studios ${v178FieldLockBadge(item,'studios')}</label>
          <input type="text" id="l-rich-studios"
            value="${escapeHtml(v178CommaText(item.studios))}"
            placeholder="Comma separated">
        </div>

        <div class="field">
          <label class="field-label">Producers ${v178FieldLockBadge(item,'producers')}</label>
          <input type="text" id="l-rich-producers"
            value="${escapeHtml(v178CommaText(item.producers))}"
            placeholder="Comma separated">
        </div>

        <div class="field">
          <label class="field-label">Genres ${v178FieldLockBadge(item,'genres')}</label>
          <input type="text" id="l-rich-genres"
            value="${escapeHtml(v178CommaText(item.genres))}"
            placeholder="Action, Adventure, Fantasy…">
        </div>

        <div class="field">
          <label class="field-label">Themes ${v178FieldLockBadge(item,'themes')}</label>
          <input type="text" id="l-rich-themes"
            value="${escapeHtml(v178CommaText(item.themes))}"
            placeholder="Isekai, School, Detective…">
        </div>

        <div class="field v178-rich-wide">
          <label class="field-label">Synopsis / description ${v178FieldLockBadge(item,'synopsis')}</label>
          <textarea id="l-rich-synopsis"
            placeholder="Synopsis or description…">${escapeHtml(String(item.synopsis||''))}</textarea>
        </div>
      </div>
    </div>
  </details>`;
}

/* ---------- Add rich fields to the normal Library editor ------- */

const v178LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(d){
  let h=v178LibraryModalHtmlBase(d);

  const panel=v178RichEditorHtml(d||{});

  return h.replace(
    '<div class="modal-actions" style="justify-content:space-between;">',
    panel+'<div class="modal-actions" style="justify-content:space-between;">'
  );
};

function v178CaptureEditorValues(){
  const el=id=>document.getElementById(id);
  if(!el('l-rich-format'))return null;

  const numberOrNull=(id,max=null)=>{
    const raw=String(el(id)?.value||'').trim();
    if(!raw)return null;
    let value=Number(raw);
    if(!Number.isFinite(value))return null;
    if(max!=null)value=Math.min(max,value);
    return Math.max(0,value);
  };

  return {
    year:numberOrNull('l-rich-year',9999),
    mediaFormat:v176SafeText(el('l-rich-format')?.value,80),
    durationMinutes:numberOrNull('l-rich-duration'),
    releaseDate:v176DateValue(el('l-rich-release-date')?.value),
    seasonLabel:v176SafeText(el('l-rich-season')?.value,80),
    ageRating:v176SafeText(el('l-rich-age-rating')?.value,80),
    communityScore:numberOrNull('l-rich-community-score',10),
    mediaSource:v176SafeText(el('l-rich-source')?.value,120),
    demographic:v176SafeText(el('l-rich-demographic')?.value,120),
    studios:v178CsvList(el('l-rich-studios')?.value),
    producers:v178CsvList(el('l-rich-producers')?.value),
    genres:v178CsvList(el('l-rich-genres')?.value),
    themes:v178CsvList(el('l-rich-themes')?.value),
    synopsis:v176SafeText(el('l-rich-synopsis')?.value,6000)
  };
}

function v178ComparableRichValue(key,value){
  if(['studios','producers','genres','themes'].includes(key)){
    return JSON.stringify(Array.isArray(value)?value:[]);
  }

  if(['year','durationMinutes','communityScore'].includes(key)){
    const n=Number(value);
    return Number.isFinite(n)&&n>0?String(n):'';
  }

  return String(value??'');
}

function v178ApplyManualEditorValues(item,before,captured){
  if(!item||!captured)return false;

  const manual=v178ManualMap(before||item);
  let changed=false;

  for(const key of V178_EDITABLE_RICH_FIELDS){
    const oldValue=before?.[key];
    const newValue=captured[key];

    if(
      v178ComparableRichValue(key,oldValue)!==
      v178ComparableRichValue(key,newValue)
    ){
      manual[key]=true;
      changed=true;
    }

    if(['studios','producers','genres','themes'].includes(key)){
      item[key]=Array.isArray(newValue)?newValue:[];
      continue;
    }

    if(['year','durationMinutes','communityScore'].includes(key)){
      const n=Number(newValue);
      item[key]=Number.isFinite(n)&&n>0?n:null;
      continue;
    }

    item[key]=String(newValue||'');
  }

  item.richMetadataManual=manual;

  if(changed)item.modifiedAt=Date.now();
  return changed;
}

/* FINAL title saver: capture metadata before the base editor closes, then save
   it onto the same Library record. The base save keeps all existing XP,
   completion, date, cover and validation behavior. */
const v178SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const captured=v178CaptureEditorValues();

  const before=id
    ?(S.library||[]).find(item=>String(item?.id||'')===String(id))
    :null;

  const beforeCopy=before
    ?JSON.parse(JSON.stringify(before))
    :{};

  const beforeIds=new Set(
    (S.library||[]).map(item=>String(item?.id||''))
  );

  const result=v178SaveLibraryModalBase.apply(this,arguments);

  // If validation failed, the Library editor is still open. Do not save rich
  // metadata independently from the rest of the title form.
  if(document.getElementById('l-title'))return result;
  if(!captured)return result;

  let item=null;

  if(id){
    item=(S.library||[]).find(
      row=>String(row?.id||'')===String(id)
    );
  }else{
    item=(S.library||[]).find(
      row=>!beforeIds.has(String(row?.id||''))
    ) || (S.library||[])[(S.library||[]).length-1];
  }

  if(!item)return result;

  const changed=v178ApplyManualEditorValues(
    item,
    beforeCopy,
    captured
  );

  // Make the existing Library undo/redo entry include the rich metadata edit.
  const undo=(S.undoStack||[])[(S.undoStack||[]).length-1];
  if(undo&&/^(Edit title|Add title)$/i.test(String(undo.action||''))){
    undo.after=mfCoreSnapshot();
  }

  if(changed || !before){
    persistLibrary();
    render();
  }

  return result;
};

/* ---------- Protect manually edited fields from future imports -------- */

v176ApplyRichMetadata=function(item,meta){
  if(!item||!meta||typeof meta!=='object')return false;

  const manual=v178ManualMap(item);
  let changed=false;

  for(const key of ['genres','themes','studios','producers']){
    if(manual[key])continue;

    const merged=v176MergeListValues(
      item[key],
      meta[key]
    );

    if(
      JSON.stringify(merged)!==
      JSON.stringify(Array.isArray(item[key])?item[key]:[])
    ){
      item[key]=merged;
      changed=true;
    }
  }

  for(const key of [
    'mediaFormat','synopsis','mediaSource','demographic',
    'ageRating','releaseDate','seasonLabel'
  ]){
    if(manual[key])continue;

    const value=v176SafeText(
      meta[key],
      key==='synopsis'?6000:160
    );

    if(value&&value!==String(item[key]||'')){
      item[key]=value;
      changed=true;
    }
  }

  for(const key of ['durationMinutes','communityScore']){
    if(manual[key])continue;

    const value=Number(meta[key]);
    if(
      Number.isFinite(value)&&
      value>0&&
      Number(item[key])!==value
    ){
      item[key]=value;
      changed=true;
    }
  }

  return changed;
};

// Year was part of the older v158 core importer rather than v176 rich metadata.
// Protect a manually edited Year around the complete Standard/Advanced import
// pipeline too.
const v178ApplyNormalizedRecordBase=v158ApplyNormalizedRecord;
v158ApplyNormalizedRecord=function(record,service,index,touched){
  const existing=v158FindImportItem(record,index);
  const protectYear=existing?.richMetadataManual?.year===true;
  const yearBefore=existing?.year??null;

  const result=v178ApplyNormalizedRecordBase(
    record,
    service,
    index,
    touched
  );

  if(protectYear){
    const item=v158FindImportItem(record,index);
    if(item){
      item.year=yearBefore;
      touched?.set(String(item.id),item);
      index?.add?.(item);
    }
  }

  return result;
};

/* ---------- Cloud merge preservation of manual-protection flags -------- */

const v178MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v178MergeLibraryItemBase(left,right);
  if(!out)return out;

  const lm=v178ManualMap(left);
  const rm=v178ManualMap(right);
  const merged={};

  for(const key of V178_EDITABLE_RICH_FIELDS){
    if(lm[key]||rm[key])merged[key]=true;
  }

  out.richMetadataManual=merged;
  return out;
};

/* ---------- Protected Sync Now verification ------------------- */

function v178ManualMetadataAudit(state){
  let count=0;
  let xor=0;
  let sum=0;

  for(const item of (Array.isArray(state?.library)?state.library:[])){
    const manual=v178ManualMap(item);
    if(!Object.keys(manual).length)continue;

    const hash=v176Fnv(
      JSON.stringify({
        id:String(item?.id||''),
        manual
      })
    );

    count++;
    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,xor,sum};
}

const v178VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v178VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v178ManualMetadataAudit(cloudState);
  const wanted=v178ManualMetadataAudit(expected);

  if(
    cloud.count!==wanted.count ||
    cloud.xor!==wanted.xor ||
    cloud.sum!==wanted.sum
  ){
    problems.push('Manual rich-metadata protection');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* ---------- Full Backup / Automatic Backup -------------------- */

const v178BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v178BuildFullBackupBase();

  payload.backupSchemaVersion=V178_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V178_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v178 backup. Rich imported Library metadata is editable in the normal title editor. Manually changed metadata fields are marked on the Library record and protected from later media-service imports. Includes year, format, runtime, release date, season, content rating, community score, source material, demographic, studios, producers, genres, themes and synopsis alongside all prior MediaFlow data.';

  return payload;
};

const v178BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v178BackupManifestBase(
    state,
    extras
  );
  const audit=v178ManualMetadataAudit(state);

  manifest.schemaVersion=V178_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      editableRichLibraryMetadata:true,
      manualRichMetadataProtection:true,
      editableImportedYear:true,
      editableImportedSynopsis:true,
      editableImportedGenresThemes:true,
      editableImportedStudiosProducers:true
    }
  );

  manifest.counts=Object.assign(
    {},
    manifest.counts||{},
    {
      titlesWithManualRichMetadata:audit.count
    }
  );

  return manifest;
};

// v152 Automatic Backup resolves the final builder dynamically, so manually
// edited metadata and its import-protection flags are included automatically.


/* ============================================================
   MediaFlow v179 — Dual Logging Modes
   ------------------------------------------------------------
   Mode 1: Amount consumed (the original MediaFlow behavior)
   Mode 2: Final progress — enter the last watched episode / read chapter /
           read issue / final progress. MediaFlow calculates the consumed
           difference automatically from the title's starting progress.
   ============================================================ */

const V179_BACKUP_SCHEMA_VERSION=16;

const V179_LOG_MODE_DEFAULTS={
  single:'amount',
  batch:'amount',
  modifiedAt:0
};

function v179NormalizeMode(value){
  return value==='progress'?'progress':'amount';
}

function v179NormalizeLoggingModes(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    single:v179NormalizeMode(src.single),
    batch:v179NormalizeMode(src.batch),
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v179EnsureLoggingModes(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v179LoggingModes=v179NormalizeLoggingModes(
    settings.v179LoggingModes
  );
  return settings.v179LoggingModes;
}

function v179Mode(kind){
  const cfg=v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return kind==='batch'?cfg.batch:cfg.single;
}

function v179IsComplete(item){
  return !!item && (
    String(item.status||'')==='completed' ||
    (
      Number(item.total)>0 &&
      Number(item.progress)>=Number(item.total)
    )
  );
}

function v179StartProgress(item){
  if(!item)return 0;
  // Completed titles are repeat consumption. Main Library progress already
  // equals the total, so "last watched episode" for a rewatch starts at 0.
  if(v179IsComplete(item))return 0;
  return Math.max(0,Number(item.progress)||0);
}

function v179ProgressInputLabel(item){
  const cat=item?getCategory(item.categoryId):null;
  const unit=String(cat?.unit||'').toLowerCase();

  if(/episode/.test(unit))return 'Last watched episode';
  if(/chapter/.test(unit))return 'Last read chapter';
  if(/issue/.test(unit))return 'Last read issue';
  if(/volume/.test(unit))return 'Last read volume';
  if(/book/.test(unit))return 'Last read book';

  return 'Final progress';
}

function v179ProgressNoun(item,amount=2){
  const cat=item?getCategory(item.categoryId):null;
  return cat?unitLabel(cat.unit,amount):'units';
}

function v179ClampEndProgress(item,value){
  let end=Math.max(0,Number(value)||0);
  const total=Number(item?.total);

  if(Number.isFinite(total)&&total>0){
    end=Math.min(end,total);
  }

  return end;
}

function v179CalculatedQty(item,start,end){
  const safeStart=Math.max(0,Number(start)||0);
  const safeEnd=v179ClampEndProgress(item,end);
  return Math.max(0,safeEnd-safeStart);
}

function v179ModeSwitchHtml(kind){
  const mode=v179Mode(kind);
  const isBatch=kind==='batch';

  return `<div class="v179-log-mode-switch ${isBatch?'v179-batch-mode-wrap':''}">
    <span class="v179-mode-label">Logging method</span>

    <button type="button"
      class="btn btn-sm ${mode==='amount'?'active':''}"
      onclick="App.v179SetLogMode('${kind}','amount')">
      Amount consumed
    </button>

    <button type="button"
      class="btn btn-sm ${mode==='progress'?'active':''}"
      onclick="App.v179SetLogMode('${kind}','progress')">
      Last progress
    </button>

    <div class="v179-log-mode-help">${
      mode==='progress'
        ?'Select a Library title, enter the last episode/chapter/issue you reached, and MediaFlow calculates how much you consumed from the title’s starting progress.'
        :'Original logging method: enter directly how many episodes, chapters, issues, movies, or other units you consumed.'
    }</div>
  </div>`;
}

function v179SetLogMode(kind,mode){
  const safeKind=kind==='batch'?'batch':'single';
  const safeMode=v179NormalizeMode(mode);
  const cfg=v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);

  cfg[safeKind]=safeMode;
  cfg.modifiedAt=Date.now();
  persistSettings();

  if(safeKind==='single'){
    if(S.logDraft){
      S.logDraft.v179Mode=safeMode;

      if(safeMode==='progress'){
        S.logDraft.updateLibrary=true;

        for(const entry of (S.logDraft.entries||[])){
          const item=entry.libraryId
            ?S.library.find(i=>i.id===entry.libraryId)
            :null;

          if(!item)continue;

          const start=Number.isFinite(Number(entry.v179StartProgress))
            ?Math.max(0,Number(entry.v179StartProgress))
            :v179StartProgress(item);

          entry.v179StartProgress=start;
          entry.v179EndProgress=v179ClampEndProgress(
            item,
            start+Math.max(0,Number(entry.qty)||0)
          );
          entry.qty=v179CalculatedQty(
            item,
            entry.v179StartProgress,
            entry.v179EndProgress
          );
        }

        if(S.entryDraft){
          const item=S.entryDraft.libraryId
            ?S.library.find(i=>i.id===S.entryDraft.libraryId)
            :null;

          if(item){
            const start=v179StartProgress(item);
            S.entryDraft.endProgress=v179ClampEndProgress(
              item,
              start+1
            );
          }
        }

        v179SyncSingleFromEntries();
      }
    }

    render();
    return;
  }

  ensureBatchDraft();
  S.batchDraft.v179Mode=safeMode;

  for(const row of S.batchDraft.rows){
    const item=row.libraryId
      ?S.library.find(i=>i.id===row.libraryId)
      :null;

    if(!item)continue;

    if(safeMode==='progress'){
      const start=v179StartProgress(item);
      row.v179StartProgress=start;

      if(row.v179EndProgress==null||row.v179EndProgress===''){
        row.v179EndProgress=v179ClampEndProgress(
          item,
          start+Math.max(0,Number(row.qty)||1)
        );
      }

      row.qty=v179CalculatedQty(
        item,
        row.v179StartProgress,
        row.v179EndProgress
      );

      const cat=getCategory(item.categoryId);
      if(cat){
        row.minutes=Math.round(
          row.qty*(Number(cat.minutesPerUnit)||0)
        );
      }
    }
  }

  render();
}

function v179SyncSingleFromEntries(){
  if(!S.logDraft)return;

  const entries=S.logDraft.entries||[];
  let amount=0;
  let minutes=0;

  for(const entry of entries){
    const qty=Math.max(0,Number(entry.qty)||0);
    amount+=qty;

    const item=entry.libraryId
      ?S.library.find(i=>i.id===entry.libraryId)
      :null;

    const cat=item
      ?getCategory(item.categoryId)
      :getCategory(S.currentTask?.categoryId||'');

    minutes+=Math.round(
      qty*(Number(cat?.minutesPerUnit)||0)
    );
  }

  S.logDraft.amount=amount;
  S.logDraft.minutes=minutes;
  refreshXPPreview();
}

function v179ProgressEntryEditorHtml(entries){
  if(v179Mode('single')!=='progress'||!entries.length)return '';

  return `<div class="v179-progress-entry-list">
    ${entries.map((entry,idx)=>{
      const item=entry.libraryId
        ?S.library.find(i=>i.id===entry.libraryId)
        :null;

      if(!item)return '';

      const start=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :v179StartProgress(item);

      const end=entry.v179EndProgress!=null
        ?v179ClampEndProgress(item,entry.v179EndProgress)
        :v179ClampEndProgress(item,start+Math.max(0,Number(entry.qty)||0));

      const qty=v179CalculatedQty(item,start,end);
      const total=Number(item.total)>0?` / ${Number(item.total)}`:'';

      return `<div class="v179-progress-entry-row">
        <div class="v179-progress-entry-copy">
          <b>${escapeHtml(cleanTitle(item.title))}</b>
          <small>Starting progress: ${start}${total}${entry.isRepeat?' · Rewatch/reread starts at 0':''}</small>
        </div>

        <label class="v179-progress-entry-input">
          <span>${escapeHtml(v179ProgressInputLabel(item))}</span>
          <input type="number"
            min="${start}"
            ${Number(item.total)>0?`max="${Number(item.total)}"`:''}
            step="1"
            value="${end}"
            onchange="App.v179SetLogEntryEnd(${idx},this.value)">
        </label>

        <div class="v179-consumed-chip">
          +${qty} ${escapeHtml(v179ProgressNoun(item,qty))}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function v179SetLogEntryEnd(index,value){
  const entry=(S.logDraft?.entries||[])[index];
  if(!entry?.libraryId)return;

  const item=S.library.find(i=>i.id===entry.libraryId);
  if(!item)return;

  const start=Number.isFinite(Number(entry.v179StartProgress))
    ?Math.max(0,Number(entry.v179StartProgress))
    :v179StartProgress(item);

  const end=v179ClampEndProgress(item,value);

  entry.v179StartProgress=start;
  entry.v179EndProgress=end;
  entry.qty=v179CalculatedQty(item,start,end);

  v179SyncSingleFromEntries();
  render();
}

/* ---------- Normal logging UI ------------------------------- */

const v179RenderLogFormBase=renderLogForm;
renderLogForm=function(t,cat){
  let h=v179RenderLogFormBase(t,cat);
  const mode=v179Mode('single');

  h=h.replace(
    '<div class="log-form">',
    `<div class="log-form">${v179ModeSwitchHtml('single')}`
  );

  if(mode!=='progress')return h;

  const selected=S.entryDraft?.libraryId
    ?S.library.find(i=>i.id===S.entryDraft.libraryId)
    :null;

  const inputLabel=selected
    ?v179ProgressInputLabel(selected)
    :'Last progress';

  const start=selected?v179StartProgress(selected):0;
  const suggested=selected
    ?v179ClampEndProgress(
        selected,
        S.entryDraft?.endProgress==null||S.entryDraft?.endProgress===''
          ?start+1
          :S.entryDraft.endProgress
      )
    :(Math.max(1,Number(S.entryDraft?.endProgress)||1));

  const progressInput=`<label class="v179-inline-progress">
    <span>${escapeHtml(inputLabel)}</span>
    <input type="number"
      id="entry-progress"
      min="${start}"
      ${selected&&Number(selected.total)>0?`max="${Number(selected.total)}"`:''}
      step="1"
      value="${suggested}"
      oninput="App.v179UpdateEntryProgressDraft(this.value)">
  </label>`;

  h=h.replace(
    /<input type="number" id="entry-qty"[\s\S]*?style="width:74px;">/,
    progressInput
  );

  const editors=v179ProgressEntryEditorHtml(
    S.logDraft?.entries||[]
  );

  h=h.replace(
    /(<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">)/,
    `${editors}$1`
  );

  h=h.replace(
    /<label style="display:flex; align-items:center; gap:6px; font-size:12\.5px; color:var\(--text-dim\); margin-bottom:10px;">[\s\S]*?Update Library progress automatically[\s\S]*?<\/label>/,
    `<div class="v179-auto-progress-note">
      Library progress updates automatically to the final progress you enter. MediaFlow logs only the difference as consumed.
    </div>`
  );

  h=h.replace(
    '<label class="field-label">Actual amount (',
    '<label class="field-label">Consumed automatically ('
  );

  h=h.replace(
    /<input type="number" min="0" id="log-amount" value="([^"]*)" oninput="App\.updateLogDraft\('amount', this\.value\)">/,
    `<input type="number" min="0" id="log-amount" value="$1" readonly>`
  );

  h=h.replace(
    '<div class="field">\n\n        <label class="field-label">Consumed automatically',
    '<div class="field v179-readonly-amount">\n\n        <label class="field-label">Consumed automatically'
  );

  return h;
};

function v179UpdateEntryProgressDraft(value){
  S.entryDraft=S.entryDraft||{title:'',qty:1,libraryId:null};
  S.entryDraft.endProgress=Math.max(0,Number(value)||0);
}

const v179SelectLogTitleBase=App.selectLogTitle;
App.selectLogTitle=function(id){
  const result=v179SelectLogTitleBase.apply(this,arguments);

  if(v179Mode('single')==='progress'){
    const item=S.library.find(i=>i.id===id);

    if(item){
      const start=v179StartProgress(item);
      S.entryDraft.endProgress=v179ClampEndProgress(
        item,
        start+1
      );
      render();
    }
  }

  return result;
};

const v179AddLogEntryBase=App.addLogEntry;
App.addLogEntry=function(){
  if(v179Mode('single')!=='progress'){
    return v179AddLogEntryBase.apply(this,arguments);
  }

  const title=String(S.entryDraft?.title||'').trim();
  if(!title)return;

  const assignedCat=getCategory(S.currentTask?.categoryId||'');
  let item=S.entryDraft?.libraryId
    ?S.library.find(i=>i.id===S.entryDraft.libraryId)
    :null;

  if(!item&&assignedCat){
    item=findLibraryMatch(assignedCat.id,title);
  }

  if(!item){
    const key=cleanTitle(title).toLowerCase();
    item=S.library.find(
      i=>i&&i.status!=='dropped'&&
      cleanTitle(i.title).toLowerCase()===key
    )||null;
  }

  const start=item?v179StartProgress(item):0;
  let end=Math.max(
    start,
    Number(S.entryDraft?.endProgress)||0
  );

  if(item)end=v179ClampEndProgress(item,end);

  const qty=Math.max(0,end-start);

  if(qty<=0){
    showToast(
      item
        ?`Enter a ${v179ProgressInputLabel(item).toLowerCase()} higher than ${start}.`
        :'Enter the final progress you reached.'
    );
    return;
  }

  // Avoid two progress-mode rows for the same Library title, because each
  // final-progress entry is defined relative to one starting progress value.
  if(item?.id){
    const existing=(S.logDraft?.entries||[]).findIndex(
      e=>String(e?.libraryId||'')===String(item.id)
    );

    if(existing>=0){
      const entry=S.logDraft.entries[existing];
      entry.v179StartProgress=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :start;
      entry.v179EndProgress=end;
      entry.qty=v179CalculatedQty(
        item,
        entry.v179StartProgress,
        entry.v179EndProgress
      );

      S.entryDraft={title:'',qty:1,libraryId:null,endProgress:''};
      v179SyncSingleFromEntries();
      render();
      showToast('Updated final progress for that title.');
      return;
    }
  }

  const beforeLength=(S.logDraft?.entries||[]).length;

  S.entryDraft.qty=qty;
  S.logDraft.updateLibrary=true;

  const result=v179AddLogEntryBase.apply(this,arguments);

  const entry=(S.logDraft?.entries||[])[beforeLength];
  if(entry){
    const savedItem=entry.libraryId
      ?S.library.find(i=>i.id===entry.libraryId)
      :item;

    const savedStart=savedItem
      ?v179StartProgress(savedItem)
      :start;

    entry.v179StartProgress=savedStart;
    entry.v179EndProgress=savedItem
      ?v179ClampEndProgress(savedItem,end)
      :end;
    entry.qty=savedItem
      ?v179CalculatedQty(
          savedItem,
          entry.v179StartProgress,
          entry.v179EndProgress
        )
      :qty;
  }

  S.entryDraft=S.entryDraft||{};S.entryDraft.endProgress='';

  v179SyncSingleFromEntries();
  render();

  return result;
};

const v179OpenLogFormBase=App.openLogForm;
App.openLogForm=function(){
  const result=v179OpenLogFormBase.apply(this,arguments);

  if(S.logDraft){
    S.logDraft.v179Mode=v179Mode('single');

    if(v179Mode('single')==='progress'){
      S.logDraft.amount=0;
      S.logDraft.minutes=0;
      S.logDraft.updateLibrary=true;
      S.entryDraft=S.entryDraft||{title:'',qty:1};
      S.entryDraft.endProgress='';
      render();
    }
  }

  return result;
};

/* Final wrapper over the complete existing submit chain (XP, completion,
   repeat, Start Date, undo/activity, etc.). We only prepare quantities first. */
const v179SubmitLogBase=App.submitLog;
App.submitLog=function(){
  if(v179Mode('single')==='progress'){
    const entries=S.logDraft?.entries||[];

    if(!entries.length){
      showToast('Select at least one Library title and enter its final progress.');
      return;
    }

    for(const entry of entries){
      const item=entry.libraryId
        ?S.library.find(i=>i.id===entry.libraryId)
        :null;

      if(!item){
        if(!(Number(entry.qty)>0)){
          showToast('One of the progress entries has no consumed amount.');
          return;
        }
        continue;
      }

      const start=Number.isFinite(Number(entry.v179StartProgress))
        ?Math.max(0,Number(entry.v179StartProgress))
        :v179StartProgress(item);

      const end=v179ClampEndProgress(
        item,
        entry.v179EndProgress
      );

      entry.v179StartProgress=start;
      entry.v179EndProgress=end;
      entry.qty=v179CalculatedQty(item,start,end);

      if(!(entry.qty>0)){
        showToast(
          `${cleanTitle(item.title)}: final progress must be higher than ${start}.`
        );
        return;
      }
    }

    S.logDraft.updateLibrary=true;
    v179SyncSingleFromEntries();
  }

  return v179SubmitLogBase.apply(this,arguments);
};

/* ---------- Batch Log state + UI ----------------------------- */

const v179EnsureBatchDraftBase=ensureBatchDraft;
ensureBatchDraft=function(){
  v179EnsureBatchDraftBase();

  S.batchDraft.v179Mode=v179NormalizeMode(
    S.batchDraft.v179Mode||v179Mode('batch')
  );

  for(const row of S.batchDraft.rows){
    if(row.v179EndProgress===undefined)row.v179EndProgress='';
    if(row.v179StartProgress===undefined)row.v179StartProgress=null;
  }
};

const v179AddBatchRowBase=App.addBatchRow;
App.addBatchRow=function(){
  const result=v179AddBatchRowBase.apply(this,arguments);

  ensureBatchDraft();
  const row=S.batchDraft.rows[S.batchDraft.rows.length-1];

  if(row){
    row.v179EndProgress='';
    row.v179StartProgress=null;
  }

  return result;
};

const v179SelectBatchTitleBase=App.selectBatchTitle;
App.selectBatchTitle=function(i,id){
  ensureBatchDraft();

  if(v179Mode('batch')==='progress'){
    const duplicate=S.batchDraft.rows.findIndex(
      (row,index)=>
        index!==Number(i)&&
        String(row?.libraryId||'')===String(id)
    );

    if(duplicate>=0){
      showToast('That title is already in this progress-mode batch.');
      return;
    }
  }

  const result=v179SelectBatchTitleBase.apply(this,arguments);

  if(v179Mode('batch')==='progress'){
    ensureBatchDraft();
    const row=S.batchDraft.rows[i];
    const item=S.library.find(x=>x.id===id);

    if(row&&item){
      const start=v179StartProgress(item);
      const end=v179ClampEndProgress(item,start+1);

      row.v179StartProgress=start;
      row.v179EndProgress=end;
      row.qty=v179CalculatedQty(item,start,end);

      const cat=getCategory(item.categoryId);
      if(cat){
        row.minutes=Math.round(
          row.qty*(Number(cat.minutesPerUnit)||0)
        );
      }

      render();
    }
  }

  return result;
};

function v179UpdateBatchProgress(i,value){
  ensureBatchDraft();

  const row=S.batchDraft.rows[i];
  if(!row?.libraryId)return;

  const item=S.library.find(x=>x.id===row.libraryId);
  if(!item)return;

  const start=Number.isFinite(Number(row.v179StartProgress))
    ?Math.max(0,Number(row.v179StartProgress))
    :v179StartProgress(item);

  const end=v179ClampEndProgress(item,value);
  const qty=v179CalculatedQty(item,start,end);

  row.v179StartProgress=start;
  row.v179EndProgress=end;
  row.qty=qty;

  const cat=getCategory(item.categoryId);
  if(cat){
    row.minutes=Math.round(
      qty*(Number(cat.minutesPerUnit)||0)
    );
  }

  const hint=document.getElementById(
    `batch-progress-calc-${i}`
  );
  if(hint){
    hint.innerHTML=`Starting ${start} → <b>+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</b>`;
  }

  const minutesInput=document.getElementById(
    `batch-minutes-${i}`
  );
  if(minutesInput){
    minutesInput.value=row.minutes;
  }

  const total=document.getElementById('batch-total-summary');
  if(total){
    const mins=S.batchDraft.rows.reduce(
      (n,x)=>n+(Number(x.minutes)||0),
      0
    );
    total.textContent=`${S.batchDraft.rows.length} rows · ${fmtMinutes(mins)}`;
  }
}

/* Final Batch Log renderer. It preserves v175's complete Library-browser
   filters/pagination while changing only the quantity-entry method. */
renderBatchLog=function(){
  ensureBatchDraft();
  const mode=v179Mode('batch');

  const rows=S.batchDraft.rows.map((r,i)=>{
    const item=S.library.find(x=>x.id===r.libraryId);
    const cat=item&&getCategory(item.categoryId);
    const query=r.query!=null
      ?r.query
      :(item?cleanTitle(item.title):'');

    let amountField='';

    if(mode==='progress'){
      const start=item
        ?(
          Number.isFinite(Number(r.v179StartProgress))
            ?Math.max(0,Number(r.v179StartProgress))
            :v179StartProgress(item)
        )
        :0;

      const end=item
        ?v179ClampEndProgress(
            item,
            r.v179EndProgress==null||r.v179EndProgress===''
              ?start+1
              :r.v179EndProgress
          )
        :'';

      const qty=item
        ?v179CalculatedQty(item,start,end)
        :0;

      amountField=`<div class="field">
        <label class="field-label">${
          item
            ?escapeHtml(v179ProgressInputLabel(item))
            :'Last progress'
        }</label>

        <input id="batch-progress-${i}"
          type="number"
          min="${start}"
          ${item&&Number(item.total)>0?`max="${Number(item.total)}"`:''}
          step="1"
          inputmode="numeric"
          ${item?'':'disabled'}
          value="${end}"
          placeholder="${item?'':'Select a title first'}"
          oninput="App.v179UpdateBatchProgress(${i},this.value)">

        <small id="batch-progress-calc-${i}" class="v179-batch-progress-hint">
          ${
            item
              ?`Starting ${start} → <b>+${qty} ${escapeHtml(v179ProgressNoun(item,qty))}</b>`
              :'Select a Library title first.'
          }
        </small>
      </div>`;
    }else{
      amountField=`<div class="field">
        <label class="field-label">Amount ${cat?`(${escapeHtml(unitLabel(cat.unit,2))})`:''}</label>
        <input id="batch-qty-${i}"
          type="number"
          min="0"
          inputmode="decimal"
          value="${r.qty}"
          oninput="App.updateBatchRow(${i},'qty',this.value)">
      </div>`;
    }

    return `<div class="card batch-log-row">
      <div class="batch-title-field field">
        <label class="field-label">Title</label>

        <div class="batch-search-wrap">
          <input id="batch-title-${i}"
            type="text"
            autocomplete="off"
            value="${escapeHtml(query)}"
            placeholder="Search or browse your Library…"
            oninput="App.updateBatchSearch(${i},this.value)"
            onfocus="App.renderBatchSuggestions(${i})">

          <div id="batch-suggestions-${i}" class="batch-suggestions"></div>
        </div>

        ${
          item&&cat
            ?`<div class="batch-selected-title">
                ${v144CategoryIconHtml(cat)}
                <b>${escapeHtml(cleanTitle(item.title))}</b>
                <span>${escapeHtml(cat.name)}${item.total!=null?` · ${Number(item.progress)||0}/${item.total}`:` · progress ${Number(item.progress)||0}`}${v179IsComplete(item)?' · ↻ repeat':''}</span>
              </div>`
            :`<small class="hint">Search across every category, then select the title you consumed.</small>`
        }
      </div>

      <div class="batch-number-fields">
        ${amountField}

        <div class="field">
          <label class="field-label">Minutes</label>
          <input id="batch-minutes-${i}"
            type="number"
            min="0"
            inputmode="numeric"
            value="${r.minutes}"
            oninput="App.updateBatchRow(${i},'minutes',this.value)">
        </div>
      </div>

      <button class="btn btn-danger batch-remove"
        onclick="App.removeBatchRow(${i})">
        Remove
      </button>

      ${
        cat
          ?`<small class="hint batch-counts-note">
              ${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)} · ${
                mode==='progress'
                  ?'MediaFlow calculates the consumed difference and updates Library progress to your entered final progress.'
                  :'Updates Library progress and counts toward scheduler balance, health, Statistics and XP.'
              }
            </small>`
          :''
      }
    </div>`;
  }).join('');

  const totalMinutes=S.batchDraft.rows.reduce(
    (n,r)=>n+(Number(r.minutes)||0),
    0
  );

  return `<div class="view-head">
      <div>
        <div class="view-title">Batch Log</div>
        <div class="view-desc">
          Search your entire Library and record multiple titles at once.
        </div>
      </div>
    </div>

    <div class="card batch-log-meta">
      <div class="field-row">
        <div class="field">
          <label class="field-label">Consumption date</label>
          <input type="date"
            value="${escapeHtml(S.batchDraft.date||todayISO())}"
            onchange="S.batchDraft.date=this.value">
        </div>

        <div class="field">
          <label class="field-label">Batch note (optional)</label>
          <input type="text"
            value="${escapeHtml(S.batchDraft.note||'')}"
            placeholder="What did you consume?"
            onchange="S.batchDraft.note=this.value">
        </div>
      </div>

      <div class="health-note">
        Batch entries use <b>Logged</b>. Their actual categories, amounts and minutes still fully count throughout MediaFlow.
      </div>
    </div>

    ${v179ModeSwitchHtml('batch')}
    ${v175BatchLibraryToolsHtml()}

    <div class="batch-log-list">
      ${
        rows||
        `<div class="empty-state card">
          <div class="em-icon">🧾</div>
          <div class="em-title">No batch rows yet</div>
          <div>Add a title, search your Library, and select what you consumed.</div>
        </div>`
      }
    </div>

    <div class="batch-log-actions">
      <button class="btn" onclick="App.addBatchRow()">+ Add title</button>

      <button class="btn btn-primary"
        ${S.batchDraft.rows.length?'':'disabled'}
        onclick="App.submitBatchLog()">
        Log batch
      </button>

      ${
        S.batchDraft.rows.length
          ?`<button class="btn btn-ghost" onclick="App.clearBatchLog()">Clear</button>`
          :''
      }

      <span id="batch-total-summary" class="hint">
        ${S.batchDraft.rows.length} rows · ${fmtMinutes(totalMinutes)}
      </span>
    </div>`;
};

const v179SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  if(v179Mode('batch')==='progress'){
    ensureBatchDraft();

    const selected=S.batchDraft.rows.filter(r=>r.libraryId);
    if(!selected.length){
      showToast('Select at least one Library title.');
      return;
    }

    const seen=new Set();

    for(const row of selected){
      const item=S.library.find(x=>x.id===row.libraryId);
      if(!item)continue;

      if(seen.has(String(item.id))){
        showToast(`${cleanTitle(item.title)} appears more than once in this progress-mode batch.`);
        return;
      }
      seen.add(String(item.id));

      const start=Number.isFinite(Number(row.v179StartProgress))
        ?Math.max(0,Number(row.v179StartProgress))
        :v179StartProgress(item);

      const end=v179ClampEndProgress(
        item,
        row.v179EndProgress
      );

      const qty=v179CalculatedQty(
        item,
        start,
        end
      );

      if(!(qty>0)){
        showToast(
          `${cleanTitle(item.title)}: final progress must be higher than ${start}.`
        );
        return;
      }

      row.v179StartProgress=start;
      row.v179EndProgress=end;
      row.qty=qty;

      const cat=getCategory(item.categoryId);
      if(cat&&!(Number(row.minutes)>0)){
        row.minutes=Math.round(
          qty*(Number(cat.minutesPerUnit)||0)
        );
      }
    }
  }

  return v179SubmitBatchLogBase.apply(this,arguments);
};

Object.assign(App,{
  v179SetLogMode,
  v179UpdateEntryProgressDraft,
  v179SetLogEntryEnd,
  v179UpdateBatchProgress
});

/* ============================================================
   Persistence / cloud / Sync Now / backup
   ============================================================ */

const v179PersistSettingsBase=persistSettings;
persistSettings=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return v179PersistSettingsBase.apply(this,arguments);
};

const v179LoadAllBase=loadAll;
loadAll=async function(){
  await v179LoadAllBase.apply(this,arguments);
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
};

const v179SnapshotBase=snapshot;
snapshot=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  const x=v179SnapshotBase();

  x.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );
  x.cloudSyncVersion=Math.max(
    Number(x.cloudSyncVersion)||0,
    179
  );

  return x;
};

const v179ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v179ApplyStateBase.apply(this,arguments);
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  return result;
};

const v179MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v179MergeStatesBase(a,b)||{};

  const am=v179NormalizeLoggingModes(
    a?.settings?.v179LoggingModes
  );
  const bm=v179NormalizeLoggingModes(
    b?.settings?.v179LoggingModes
  );

  out.settings=out.settings||{};
  out.settings.v179LoggingModes=
    (Number(am.modifiedAt)||0)>=(Number(bm.modifiedAt)||0)
      ?am
      :bm;

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    179
  );

  return out;
};

const v179VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v179VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v179NormalizeLoggingModes(
    cloudState?.settings?.v179LoggingModes
  );
  const wanted=v179NormalizeLoggingModes(
    expected?.settings?.v179LoggingModes
  );

  if(JSON.stringify(cloud)!==JSON.stringify(wanted)){
    problems.push('Logging method preferences');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

const v179BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v179EnsureLoggingModes(S.settings||DEFAULT_SETTINGS);
  const payload=v179BuildFullBackupBase();

  payload.backupSchemaVersion=V179_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(
    JSON.stringify(S.settings||DEFAULT_SETTINGS)
  );

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V179_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v179 backup. Includes remembered logging-method preferences for normal logging and Batch Log: direct amount consumed or final progress. In final-progress mode MediaFlow calculates consumed units from the title’s starting Library progress while preserving the existing History, XP, repeat, completion, scheduler and Library-update pipelines.';

  return payload;
};

const v179BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v179BackupManifestBase(
    state,
    extras
  );
  const modes=v179NormalizeLoggingModes(
    state?.settings?.v179LoggingModes
  );

  manifest.schemaVersion=V179_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      dualLoggingModes:true,
      finalProgressLogging:true,
      batchFinalProgressLogging:true,
      automaticConsumedDifference:true
    }
  );

  manifest.loggingModes={
    single:modes.single,
    batch:modes.batch
  };

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically.


/* ============================================================
   MediaFlow v180
   SAME-CATEGORY RECOMMENDED-TITLE REROLLS
   + TASK-LOCAL REROLL HISTORY
   + MULTI-TITLE SYSTEM RESPECT XP
   ============================================================ */

const V180_BACKUP_SCHEMA_VERSION=17;
const V180_RESPECT_XP_VERSION=180;

function v180HistoryEntry(item,index=0){
  return {
    libraryId:String(item?.id||''),
    title:cleanTitle(item?.title||''),
    shownAt:Date.now(),
    index:Math.max(0,Math.floor(Number(index)||0))
  };
}

function v180EnsureRecommendationHistory(task=S.currentTask){
  if(!task||!S.settings?.exactTitleRecommendations)return [];

  if(!Array.isArray(task.v180RecommendationHistory)){
    task.v180RecommendationHistory=[];
  }

  // Existing task from an older build: the title already on the task becomes
  // Recommendation #1 for this task.
  if(
    task.v180RecommendationHistory.length===0 &&
    (task.libraryId||task.title)
  ){
    const item=v50FindLibraryItem(task.libraryId,task.title);
    task.v180RecommendationHistory.push(
      v180HistoryEntry(
        item||{
          id:task.libraryId||'',
          title:task.title||''
        },
        0
      )
    );
  }

  // Normalize without destroying historical title text if the Library entry
  // was later removed.
  task.v180RecommendationHistory=
    task.v180RecommendationHistory
      .filter(x=>x&&typeof x==='object')
      .map((x,index)=>({
        libraryId:String(x.libraryId||''),
        title:cleanTitle(x.title||''),
        shownAt:Math.max(0,Number(x.shownAt)||0),
        index
      }));

  task.v180TitleRerolls=Math.max(
    0,
    task.v180RecommendationHistory.length-1
  );

  return task.v180RecommendationHistory;
}

function v180IsPerTitleUnit(task){
  const cat=getCategory(task?.categoryId||'');
  const unit=String(cat?.unit||task?.unit||'').toLowerCase();

  // These units represent separate Library titles, unlike episodes/chapters/
  // issues which normally belong to one series/title.
  return /(^|[^a-z])(movies?|films?|books?|titles?)([^a-z]|$)/i.test(unit);
}

function v180RespectSlotLimit(task){
  if(!S.settings?.exactTitleRecommendations)return 0;
  if(!task)return 0;

  if(v180IsPerTitleUnit(task)){
    return Math.max(
      1,
      Math.round(Number(task.targetMid)||1)
    );
  }

  // Episode/chapter/issue tasks still have one exact-title recommendation
  // opportunity, regardless of how many units the task asks the user to consume.
  return 1;
}

function v180RecommendationIdentity(entry){
  return {
    id:String(entry?.libraryId||''),
    title:v165NormalizedTitle(entry?.title||'')
  };
}

function v180ResolveHistoryItem(entry){
  if(!entry)return null;

  if(entry.libraryId){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===String(entry.libraryId)
    );
    if(byId)return byId;
  }

  const key=v165NormalizedTitle(entry.title||'');
  return key
    ?(S.library||[]).find(
      item=>v165NormalizedTitle(item?.title||'')===key
    )||null
    :null;
}

function v180RecommendationCandidates(task=S.currentTask){
  if(!task)return [];

  const cat=getCategory(task.categoryId);
  let pool=(S.library||[]).filter(item=>
    item &&
    String(item.categoryId||'')===String(cat.id||'') &&
    item.status!=='completed' &&
    item.status!=='dropped'
  );

  if(!pool.length)return [];

  const seen=new Set(
    v180EnsureRecommendationHistory(task)
      .map(x=>String(x.libraryId||''))
      .filter(Boolean)
  );

  pool=pool.filter(item=>!seen.has(String(item.id||'')));
  if(!pool.length)return [];

  if(
    S.settings?.prioritizePersonalOrder &&
    Array.isArray(S.orderPlan?.titleIds)
  ){
    const rank=new Map(
      S.orderPlan.titleIds.map(
        (id,index)=>[String(id),index]
      )
    );

    pool.sort((a,b)=>{
      const ar=rank.has(String(a.id))
        ?rank.get(String(a.id))
        :Number.MAX_SAFE_INTEGER;
      const br=rank.has(String(b.id))
        ?rank.get(String(b.id))
        :Number.MAX_SAFE_INTEGER;

      if(ar!==br)return ar-br;
      return scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat);
    });

    return pool;
  }

  return pool.sort(
    (a,b)=>scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat)
  );
}

function v180RerollRecommendedTitle(){
  const task=S.currentTask;

  if(
    !task ||
    !S.settings?.exactTitleRecommendations
  ){
    showToast('Exact title recommendations are not active.');
    return;
  }

  v180EnsureRecommendationHistory(task);

  const next=v180RecommendationCandidates(task)[0];
  if(!next){
    showToast('No other eligible Library titles are available in this category.');
    return;
  }

  const history=task.v180RecommendationHistory;
  history.push(
    v180HistoryEntry(next,history.length)
  );

  task.libraryId=next.id;
  task.title=cleanTitle(next.title);
  task.v180TitleRerolls=history.length-1;
  task.v180RecommendationUpdatedAt=Date.now();

  // Deliberately DO NOT call v165RecordReroll().
  // This is a title reroll inside the SAME category task, not "Give me
  // something else". It never damages the no-Skip or first-category-pick
  // streaks by itself.
  persistTask();
  render();

  showToast(
    `Next recommended title · ${cleanTitle(next.title)}`
  );
}

function v180HistoryCoverHtml(entry){
  const item=v180ResolveHistoryItem(entry);
  const cat=getCategory(
    item?.categoryId||S.currentTask?.categoryId||''
  );
  const title=cleanTitle(item?.title||entry?.title||'');

  if(item?.coverUrl){
    return `<img class="v180-history-cover"
      src="${escapeHtml(item.coverUrl)}"
      alt="${escapeHtml(title)} cover"
      loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <div class="v180-history-cover-ph" style="display:none">
        ${v144CategoryIconHtml(cat)}
      </div>`;
  }

  return `<div class="v180-history-cover-ph">
    ${v144CategoryIconHtml(cat)}
  </div>`;
}

function v180RerollHistoryHtml(){
  const task=S.currentTask;
  const history=v180EnsureRecommendationHistory(task);
  const slotLimit=v180RespectSlotLimit(task);
  const rerolls=Math.max(0,history.length-1);
  const cat=getCategory(task?.categoryId||'');

  const rows=history.map((entry,index)=>{
    const item=v180ResolveHistoryItem(entry);
    const title=cleanTitle(
      item?.title||entry.title||'Unavailable title'
    );
    const eligible=index<slotLimit;
    const current=
      String(task?.libraryId||'')===
      String(entry.libraryId||'') &&
      index===history.length-1;

    return `<div class="v180-history-row ${current?'current':''}">
      ${v180HistoryCoverHtml(entry)}

      <div class="v180-history-copy">
        <b>${escapeHtml(title)}</b>

        <div class="v180-history-meta">
          <span>Recommendation #${index+1}</span>

          ${
            index===0
              ?'<span>Initial pick</span>'
              :`<span>Reroll #${index}</span>`
          }

          <span class="v180-history-badge ${eligible?'eligible':'extra'}">
            ${
              eligible
                ?`Respect slot ${index+1}/${slotLimit}`
                :'Extra reroll'
            }
          </span>

          ${
            current
              ?'<span class="v180-history-badge current">Current</span>'
              :''
          }
        </div>
      </div>

      <div class="v180-history-actions">
        ${
          item?.id
            ?`<button type="button"
                class="btn btn-sm btn-ghost"
                onclick="App.v180EditHistoryTitle('${escapeHtml(String(item.id))}')">
                Edit
              </button>`
            :''
        }
      </div>
    </div>`;
  }).join('');

  const targetText=v180IsPerTitleUnit(task)
    ?`${slotLimit} title${slotLimit===1?'':'s'}`
    :'1 exact title';

  return `<div class="modal-overlay"
      id="v180-reroll-history"
      onclick="if(event.target===this)App.v180CloseRerollHistory()">

    <div class="modal v180-history-modal">
      <div class="v180-history-head">
        <div>
          <div class="modal-title" style="margin:0;padding:0;background:none;">
            Current rerolls
          </div>

          <div class="v180-history-summary">
            ${v144CategoryIconHtml(cat)}
            ${escapeHtml(cat?.name||'Task')} ·
            ${rerolls} title reroll${rerolls===1?'':'s'} ·
            ${history.length} recommendation${history.length===1?'':'s'} shown
          </div>
        </div>

        <button type="button"
          class="btn btn-sm btn-ghost"
          onclick="App.v180CloseRerollHistory()">
          Close
        </button>
      </div>

      <div class="v180-respect-explain">
        This task can earn exact-title Respect XP from the <b>first ${targetText}</b>
        MediaFlow recommends. You can reroll as much as you want without a reroll
        penalty. Extra recommendations stay available to watch, but a title shown
        after the task's Respect slots does not retroactively replace a missed
        earlier recommendation.
      </div>

      <div class="v180-history-list">
        ${rows||'<div class="hint">No recommendation history yet.</div>'}
      </div>
    </div>
  </div>`;
}

function v180OpenRerollHistory(){
  if(
    !S.currentTask ||
    !S.settings?.exactTitleRecommendations
  ){
    showToast('There is no current title-reroll history.');
    return;
  }

  v180EnsureRecommendationHistory(S.currentTask);
  document.getElementById('v180-reroll-history')?.remove();
  document.body.insertAdjacentHTML(
    'beforeend',
    v180RerollHistoryHtml()
  );
}

function v180CloseRerollHistory(){
  document.getElementById('v180-reroll-history')?.remove();
}

function v180EditHistoryTitle(id){
  v180CloseRerollHistory();

  if(!id)return;
  const item=(S.library||[]).find(
    row=>String(row?.id||'')===String(id)
  );

  if(!item){showToast('That Library title is no longer available.');
    return;
  }

  App.openLibraryModal(item.id);
}

Object.assign(App,{
  v180RerollRecommendedTitle,
  v180OpenRerollHistory,
  v180CloseRerollHistory,
  v180EditHistoryTitle
});

/* ---------- Every NEW category task gets a fresh title history ---------- */

const v180GenerateTaskBase=generateTask;
generateTask=function(excludeIds){
  const task=v180GenerateTaskBase.apply(this,arguments);

  if(
    task &&
    S.settings?.exactTitleRecommendations &&
    (task.libraryId||task.title)
  ){
    task.v180RecommendationHistory=[];
    task.v180TitleRerolls=0;
    v180EnsureRecommendationHistory(task);
  }

  return task;
};

/* ---------- Dashboard controls beside the recommended title ---------- */

const v180RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v180RenderDashboardBase();
  const task=S.currentTask;

  if(
    !task?.title ||
    !S.settings?.exactTitleRecommendations
  ){
    return h;
  }

  const history=v180EnsureRecommendationHistory(task);
  const rerolls=Math.max(0,history.length-1);

  const controls=`<div class="v180-rec-actions">
    <button type="button"
      class="btn btn-sm"
      onclick="App.v180RerollRecommendedTitle()"
      title="Keep this category task and show the next MediaFlow-recommended title">
      Reroll title
    </button>

    <button type="button"
      class="btn btn-sm btn-ghost"
      onclick="App.v180OpenRerollHistory()"
      title="Show every title MediaFlow recommended for this current task">
      Rerolls history
      <span class="v180-reroll-count">${rerolls}</span>
    </button>
  </div>`;

  // v174 already adds Edit beside both cover-rich and plain recommendations.
  // Append v180 controls after that Edit button, still inside the same row.
  const editPattern=/(<button type="button"\s+class="btn btn-sm btn-ghost v174-recommended-edit"[\s\S]*?<\/button>)/;

  if(editPattern.test(h)){
    return h.replace(
      editPattern,
      `$1${controls}`
    );
  }

  // Safety fallback for an unexpected older dashboard representation.
  const richPattern=/(<div class="hero-note v50-title-feature">[\s\S]*?<\/div><\/div>)/;
  if(richPattern.test(h)){
    return h.replace(
      richPattern,
      `<div class="v174-recommended-title-row">$1${controls}</div>`
    );
  }

  return h;
};

/* ============================================================
   v180 SYSTEM RESPECT XP
   ------------------------------------------------------------
   Exact-title XP is now earned PER respected recommendation slot.
   For Movies/other per-title units, target 3 means Recommendations #1–#3
   can each independently earn exact-title XP.
   Rerolls after those slots are never penalized; they simply do not replace
   a missed earlier Respect slot.
   ============================================================ */

function v180LoggedTitleSet(entries,groupRows){
  const ids=new Set();
  const titles=new Set();

  const add=(libraryId,title,qty)=>{
    if(!(Number(qty)>0))return;

    const id=String(libraryId||'');
    const key=v165NormalizedTitle(title||'');

    if(id)ids.add(id);
    if(key)titles.add(key);
  };

  for(const e of (entries||[])){
    add(e?.libraryId,e?.title,e?.qty);
  }

  for(const s of (groupRows||[])){
    for(const t of (s?.titles||[])){
      add(t?.libraryId,t?.title,t?.qty);
    }
  }

  return {ids,titles};
}

function v180RespectMatchInfo(task,entries,groupRows){
  if(!S.settings?.exactTitleRecommendations){
    return {
      slotLimit:0,
      eligible:[],
      matched:[],
      matchedCount:0
    };
  }

  const history=v180EnsureRecommendationHistory(task);
  const slotLimit=v180RespectSlotLimit(task);
  const eligible=history.slice(0,slotLimit);
  const logged=v180LoggedTitleSet(entries,groupRows);
  const matched=[];

  for(let index=0;index<eligible.length;index++){
    const rec=eligible[index];
    const ident=v180RecommendationIdentity(rec);

    const hit=
      (ident.id&&logged.ids.has(ident.id)) ||
      (ident.title&&logged.titles.has(ident.title));

    if(hit){
      matched.push({
        slot:index+1,
        libraryId:ident.id,
        title:cleanTitle(
          v180ResolveHistoryItem(rec)?.title||
          rec.title||
          ''
        )
      });
    }
  }

  return {
    slotLimit,
    eligible,
    matched,
    matchedCount:matched.length
  };
}

// Compatibility helper now means "at least one eligible recommendation was
// actually logged", not merely "the final title currently on the task".
v165RecommendedTitleLogged=function(task,entries,groupRows){
  return v180RespectMatchInfo(
    task,
    entries,
    groupRows
  ).matchedCount>0;
};

// FINAL respect reward implementation. It preserves v167's user-configurable
// category/title XP and streak multipliers, while changing exact-title credit
// from one boolean to a per-eligible-title count.
v165ApplyRespectReward=function(task,entries,sessionGroupId,assignedCat){
  const st=v165EnsureRespectState();
  const cfg=v167RespectConfig();
  const groupRows=v165GroupSessions(sessionGroupId);

  const respected=groupRows.some(s=>
    s &&
    s.status!=='skipped' &&
    String(s.categoryId||'')===
      String(task?.categoryId||assignedCat?.id||'') &&
    Number(s.actualAmount)>0
  );

  if(!respected){
    st.noSkipStreak=0;
    st.noRerollStreak=0;
    st.currentRerolls=0;
    st.modifiedAt=Date.now();
    return 0;
  }

  // currentRerolls remains CATEGORY rerolls ("Give me something else").
  // v180 title rerolls never touch this value, therefore browsing next
  // recommended titles has no first-pick/no-Skip penalty.
  const hadCategoryReroll=st.currentRerolls>0;

  st.noSkipStreak++;

  if(hadCategoryReroll)st.noRerollStreak=0;
  else st.noRerollStreak++;

  st.bestNoSkipStreak=Math.max(
    st.bestNoSkipStreak,
    st.noSkipStreak
  );
  st.bestNoRerollStreak=Math.max(
    st.bestNoRerollStreak,
    st.noRerollStreak
  );

  const exactEnabled=!!S.settings?.exactTitleRecommendations;
  const match=v180RespectMatchInfo(
    task,
    entries,
    groupRows
  );

  const categoryXP=Math.max(
    0,
    Math.round(Number(cfg.categoryBaseXP)||0)
  );

  const exactPerTitle=Math.max(
    0,
    Math.round(Number(cfg.exactTitleBaseXP)||0)
  );

  const exactTitleXP=exactEnabled
    ?exactPerTitle*match.matchedCount
    :0;

  const baseRespectXP=categoryXP+exactTitleXP;
  const mult=v165RespectMultipliers(
    st.noSkipStreak,
    st.noRerollStreak
  );
  const levelingEnabled=levelingSettings().enabled!==false;

  const bonus=levelingEnabled
    ?Math.max(
      0,
      Math.round(
        baseRespectXP*
        mult.noSkip*
        mult.noReroll
      )
    )
    :0;

  const target=
    groupRows.find(s=>
      s &&
      s.status!=='skipped' &&
      String(s.categoryId||'')===String(task?.categoryId||'')
    ) ||
    groupRows.find(s=>s&&s.status!=='skipped');

  if(target){
    target.v165RespectBonusXP=bonus;
    target.v165RespectBaseXP=baseRespectXP;
    target.v165SystemBaseXP=categoryXP;
    target.v165RecommendedTitleBaseXP=exactTitleXP;
    target.v165RecommendedTitleFollowed=match.matchedCount>0;
    target.v165ExactTitleRecommendationEnabled=exactEnabled;

    // Keep legacy single-title fields populated with the INITIAL recommendation
    // for older views/backups that know only one title.
    const initial=match.eligible[0]||
      v180EnsureRecommendationHistory(task)[0]||
      null;

    target.v165RecommendedLibraryId=exactEnabled
      ?String(initial?.libraryId||task?.libraryId||'')
      :'';
    target.v165RecommendedTitle=exactEnabled
      ?cleanTitle(initial?.title||task?.title||'')
      :'';

    target.v165NoSkipStreak=st.noSkipStreak;
    target.v165NoRerollStreak=st.noRerollStreak;
    target.v165NoSkipMultiplier=mult.noSkip;
    target.v165NoRerollMultiplier=mult.noReroll;
    target.v165RespectMultiplier=mult.combined;
    target.v165RerollsBeforeLog=st.currentRerolls;
    target.v165RespectXPVersion=V165_RESPECT_XP_VERSION;

    // v180 audit fields.
    target.v180RespectXPVersion=V180_RESPECT_XP_VERSION;
    target.v180TitleRerollsBeforeLog=Math.max(
      0,
      v180EnsureRecommendationHistory(task).length-1
    );
    target.v180RespectSlotLimit=match.slotLimit;
    target.v180RespectEligibleShown=match.eligible.length;
    target.v180RespectMatchedCount=match.matchedCount;
    target.v180RespectMatchedRecommendations=
      match.matched.map(x=>Object.assign({},x));
    target.v180RecommendationHistory=
      v180EnsureRecommendationHistory(task)
        .map(x=>Object.assign({},x));
    target.v180ExactTitleXPPerMatch=exactPerTitle;

    // Preserve the exact configurable reward settings that produced this row.
    target.v167RespectConfigAtLog={
      categoryBaseXP:categoryXP,
      exactTitleBaseXP:exactPerTitle,
      noSkipGrowthPercent:cfg.noSkipGrowthPercent,
      noSkipCapPercent:cfg.noSkipCapPercent,
      firstPickGrowthPercent:cfg.firstPickGrowthPercent,
      firstPickCapPercent:cfg.firstPickCapPercent
    };
  }

  st.currentRerolls=0;
  st.lastRewardAt=Date.now();
  st.modifiedAt=st.lastRewardAt;

  if(bonus>0){
    const titlePart=exactEnabled
      ?` · ${match.matchedCount}/${match.slotLimit} recommended title${match.slotLimit===1?'':'s'} respected`
      :'';

    setTimeout(()=>showToast(
      `System respected · +${bonus.toLocaleString()} XP${titlePart} · no-Skip ${st.noSkipStreak} · first-pick ${st.noRerollStreak}`
    ),0);
  }

  return bonus;
};

/* ---------- Historical merge + cache/audit compatibility ---------- */

const v180MergeSessionRespectFieldsBase=v165MergeSessionRespectFields;
v165MergeSessionRespectFields=function(target,...sources){
  const result=v180MergeSessionRespectFieldsBase(
    target,
    ...sources
  );

  const keys=[
    'v180RespectXPVersion',
    'v180TitleRerollsBeforeLog',
    'v180RespectSlotLimit',
    'v180RespectEligibleShown',
    'v180RespectMatchedCount',
    'v180RecommendationHistory',
    'v180RespectMatchedRecommendations',
    'v180ExactTitleXPPerMatch'
  ];

  for(const src of sources){
    if(!src||typeof src!=='object')continue;

    for(const key of keys){
      if(
        Object.prototype.hasOwnProperty.call(src,key) &&
        src[key]!==undefined &&
        src[key]!==null
      ){
        result[key]=(
          typeof src[key]==='object'
            ?JSON.parse(JSON.stringify(src[key]))
            :src[key]
        );
      }
    }
  }

  return result;
};

// When the live XP cache is rebuilt, make the old
// recommendedTitleFollowedRewards statistic count individual v180 matches
// instead of only rewarded sessions.
const v180BuildLiveXPCacheBase=v150BuildLiveXPCache;
v150BuildLiveXPCache=function(){
  const c=v180BuildLiveXPCacheBase();

  let matchedTitles=0;

  for(const s of (S.sessions||[])){
    if(Number(s?.v180RespectXPVersion)>=V180_RESPECT_XP_VERSION){
      matchedTitles+=Math.max(
        0,
        Math.floor(Number(s.v180RespectMatchedCount)||0)
      );
    }else if(s?.v165RecommendedTitleFollowed){
      matchedTitles++;
    }
  }

  c.recommendedTitleFollowedRewards=matchedTitles;
  return c;
};

function v180RespectHistoryAudit(state){
  let count=0;
  let matched=0;
  let rerolls=0;
  let xor=0;
  let sum=0;

  for(const s of (state?.sessions||[])){
    if(Number(s?.v180RespectXPVersion)<V180_RESPECT_XP_VERSION)continue;

    count++;
    matched+=Math.max(
      0,
      Math.floor(Number(s.v180RespectMatchedCount)||0)
    );
    rerolls+=Math.max(
      0,
      Math.floor(Number(s.v180TitleRerollsBeforeLog)||0)
    );

    const hash=v176Fnv(
      JSON.stringify({
        id:String(s.id||''),
        slots:Number(s.v180RespectSlotLimit)||0,
        matched:Number(s.v180RespectMatchedCount)||0,
        history:Array.isArray(s.v180RecommendationHistory)
          ?s.v180RecommendationHistory
          :[],
        matches:Array.isArray(s.v180RespectMatchedRecommendations)
          ?s.v180RespectMatchedRecommendations
          :[]
      })
    );

    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,matched,rerolls,xor,sum};
}

function v180CurrentTaskAudit(state){
  const task=state?.currentTask;
  if(!task)return {id:'',count:0,xor:0};

  const history=Array.isArray(task.v180RecommendationHistory)
    ?task.v180RecommendationHistory
    :[];

  return {
    id:String(task.id||''),
    count:history.length,
    xor:v176Fnv(JSON.stringify(history))
  };
}

/* ---------- Protected Sync Now verification ---------- */

const v180VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v180VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const ca=v180RespectHistoryAudit(cloudState);
  const ea=v180RespectHistoryAudit(expected);

  if(
    ca.count!==ea.count ||
    ca.matched!==ea.matched ||
    ca.rerolls!==ea.rerolls ||
    ca.xor!==ea.xor ||
    ca.sum!==ea.sum
  ){
    problems.push('Title-reroll Respect XP History');
  }

  const ct=v180CurrentTaskAudit(cloudState);
  const et=v180CurrentTaskAudit(expected);

  if(
    ct.id!==et.id ||
    ct.count!==et.count ||
    ct.xor!==et.xor
  ){
    problems.push('Current task reroll history');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

/* ---------- Apply loaded state ---------- */

const v180ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v180ApplyStateBase.apply(this,arguments);

  if(
    S.currentTask &&
    S.settings?.exactTitleRecommendations
  ){
    v180EnsureRecommendationHistory(S.currentTask);
  }

  return result;
};

/* ---------- Full Backup / Automatic Backup ---------- */

const v180BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v180BuildFullBackupBase();

  payload.backupSchemaVersion=V180_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=
    V180_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v180 backup. Includes task-local same-category recommended-title reroll history, current recommendation state, and per-title System Respect XP audit data. Title rerolls never reset category Respect streaks. For per-title tasks such as Movies, the first required number of recommendations are independent exact-title Respect XP slots; later rerolls remain usable choices but do not replace missed earlier slots.';

  return payload;
};

const v180BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v180BackupManifestBase(
    state,
    extras
  );
  const audit=v180RespectHistoryAudit(state);
  const current=v180CurrentTaskAudit(state);

  manifest.schemaVersion=V180_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign(
    {},
    manifest.includes||{},
    {
      sameCategoryTitleRerolls:true,
      currentTaskRerollHistory:true,
      recommendationHistoryCoversByLibraryReference:true,
      multiTitleSystemRespectXP:true,
      titleRerollsWithoutRespectPenalty:true,
      firstRequiredRecommendationsRespectSlots:true
    }
  );

  manifest.counts=Object.assign(
    {},
    manifest.counts||{},
    {
      v180RespectRewardSessions:audit.count,
      v180MatchedRecommendedTitles:audit.matched,
      v180HistoricalTitleRerolls:audit.rerolls,
      currentTaskRecommendationHistory:current.count
    }
  );

  return manifest;
};

// v152 Automatic Backup resolves the final Full Backup builder dynamically.
