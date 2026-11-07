/* ============================================================
   MediaFlow v171 — Category Recovery & Default Identity
   ============================================================ */

const V171_BACKUP_SCHEMA_VERSION=9;
const V171_CATEGORY_RECOVERY_DEFAULT={
  lastDeletedCategory:null,
  lastDeletedIndex:-1,
  modifiedAt:0
};

function v171Clone(value,fallback=null){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){
    try{return JSON.parse(JSON.stringify(fallback));}
    catch(__){return fallback;}
  }
}

function v171DefaultCategoryIds(){
  return new Set(DEFAULT_CATEGORIES.map(c=>String(c.id)));
}

function v171IsDefaultCategory(id){
  return v171DefaultCategoryIds().has(String(id||''));
}

function v171NormalizeCategoryRecovery(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const cat=src.lastDeletedCategory&&typeof src.lastDeletedCategory==='object'
    ?v171Clone(src.lastDeletedCategory,null)
    :null;

  return {
    lastDeletedCategory:cat,
    lastDeletedIndex:Number.isFinite(Number(src.lastDeletedIndex))
      ?Math.max(-1,Math.floor(Number(src.lastDeletedIndex)))
      :-1,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v171EnsureCategoryState(){
  S.settings=S.settings||DEFAULT_SETTINGS;
  if(typeof S.settings.highlightDefaultCategories!=='boolean'){
    S.settings.highlightDefaultCategories=true;
  }
  S.categoryRecovery=v171NormalizeCategoryRecovery(S.categoryRecovery);
  return S.categoryRecovery;
}

v171EnsureCategoryState();

function v171MissingDefaultCategories(){
  const existing=new Set((S.categories||[]).map(c=>String(c?.id||'')));
  return DEFAULT_CATEGORIES.filter(c=>!existing.has(String(c.id)));
}

function v171LastDeletedStatus(){
  const rec=v171EnsureCategoryState();
  const cat=rec.lastDeletedCategory;
  if(!cat)return {cat:null,canRestore:false,exists:false};

  const exists=(S.categories||[]).some(
    c=>String(c?.id||'')===String(cat.id||'')
  );
  return {cat,canRestore:!exists,exists};
}

async function v171RestoreDefaultCategories(){
  const missing=v171MissingDefaultCategories();
  if(!missing.length){
    showToast('All default categories are already present.');
    return;
  }

  const existingIds=new Set((S.categories||[]).map(c=>String(c?.id||'')));
  let restored=0;

  // Append only missing canonical defaults. Existing default-ID categories are
  // never overwritten, so user edits/renames remain intact.
  for(const original of DEFAULT_CATEGORIES){
    const id=String(original.id);
    if(existingIds.has(id))continue;

    const restoredCategory=v171Clone(original,{});
    restoredCategory.id=id; // explicit invariant: canonical ID must survive.
    restoredCategory.custom=false;

    S.categories.push(restoredCategory);
    existingIds.add(id);
    restored++;
  }

  await persistCategories();
  try{v53InvalidateLibraryCache();}catch(_){}
  render();

  showToast(
    `${restored} default categor${restored===1?'y':'ies'} restored with original IDs`
  );
}

async function v171RestoreLastDeletedCategory(){
  const rec=v171EnsureCategoryState();
  const cat=rec.lastDeletedCategory;

  if(!cat){
    showToast('There is no deleted category to restore.');
    return;
  }

  if(
    (S.categories||[]).some(
      c=>String(c?.id||'')===String(cat.id||'')
    )
  ){
    showToast('That category ID already exists.');
    return;
  }

  const restored=v171Clone(cat,{});
  const index=Math.max(
    0,
    Math.min(
      S.categories.length,
      Number.isFinite(Number(rec.lastDeletedIndex))
        ?Math.floor(Number(rec.lastDeletedIndex))
        :S.categories.length
    )
  );

  S.categories.splice(index,0,restored);

  // Recovery slot is consumed only after a successful restoration.
  S.categoryRecovery={
    lastDeletedCategory:null,
    lastDeletedIndex:-1,
    modifiedAt:Date.now()
  };

  await persistCategories();
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
  showToast(`${restored.name||'Category'} restored`);
}

function v171ToggleDefaultCategoryHighlight(){
  v171EnsureCategoryState();
  S.settings.highlightDefaultCategories=
    S.settings.highlightDefaultCategories===false;

  persistSettings();
  render();
}

// Capture the full category record and original array position immediately
// before the existing deletion code removes it and saves the canonical state.
const v171ConfirmDeleteCategoryBase=App.confirmDeleteCategory;
App.confirmDeleteCategory=async function(id,button){
  const index=(S.categories||[]).findIndex(
    c=>String(c?.id||'')===String(id||'')
  );
  const cat=index>=0?S.categories[index]:null;

  if(cat){
    S.categoryRecovery={
      lastDeletedCategory:v171Clone(cat,null),
      lastDeletedIndex:index,
      modifiedAt:Date.now()
    };
  }

  return v171ConfirmDeleteCategoryBase.call(this,id,button);
};

// Keep the confirmation copy accurate now that one deleted category can be
// recovered from Settings.
const v171CategoryDeleteModalBase=categoryDeleteModalHtml;
categoryDeleteModalHtml=function(d){
  let h=v171CategoryDeleteModalBase(d);
  h=h.replace(
    '<b style="color:var(--text);">This cannot be undone.</b><br>Past history is kept, but entries that reference this category may show it as removed.',
    '<b style="color:var(--text);">Recovery available.</b><br>The most recently deleted category can be restored from Settings → Categories until another category is deleted. Past history is kept.'
  );
  return h;
};

function v171CategoryRowsHtml(){
  const highlight=S.settings?.highlightDefaultCategories!==false;

  return (S.categories||[]).map((c,index)=>{
    const isDefault=v171IsDefaultCategory(c.id);
    const highlighted=highlight&&isDefault;
    const icon=typeof v144CategoryIconHtml==='function'
      ?v144CategoryIconHtml(c)
      :escapeHtml(c.icon||'🗂️');

    return `<div class="cat-manage-row ${highlighted?'v171-default-category':''}" data-category-id="${escapeHtml(String(c.id))}">
      <div class="hero-icon" style="width:36px;height:36px;font-size:17px;background:${escapeHtml(String(c.color||'#555'))}22;color:${escapeHtml(String(c.color||'#555'))};">${icon}</div>

      <div class="name">
        ${escapeHtml(c.name)}
        ${highlighted?'<span class="v171-default-badge">DEFAULT</span>':''}
        <div class="meta">${c.target} ${unitLabel(c.unit,c.target)} target · weight ${c.weight} ${c.seasonal?'· seasonal':''}</div>
      </div>

      <div class="cat-order-controls" style="display:flex;gap:5px;align-items:center;">
        <input class="v157-position-input" type="number" min="1" max="${S.categories.length}" step="1" value="${index+1}"
          title="Set exact category position" aria-label="Set ${escapeHtml(c.name)} category position"
          onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()"
          onkeydown="if(event.key==='Enter'){this.blur();}"
          onchange="App.v157SetCategoryPosition('${escapeHtml(String(c.id))}',this.value)">
        <button type="button" class="btn btn-sm btn-ghost cat-drag-handle" title="Drag to reorder" aria-label="Drag ${escapeHtml(c.name)} to reorder" onpointerdown="App.v73CategoryDragStart(event,'${escapeHtml(String(c.id))}')">☰</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${escapeHtml(String(c.id))}',-1)" ${S.categories[0]?.id===c.id?'disabled':''} title="Move category up" aria-label="Move ${escapeHtml(c.name)} up">↑</button>
        <button class="btn btn-sm btn-ghost" onclick="App.v72MoveCategory('${escapeHtml(String(c.id))}',1)" ${S.categories[S.categories.length-1]?.id===c.id?'disabled':''} title="Move category down" aria-label="Move ${escapeHtml(c.name)} down">↓</button>
      </div>

      <button class="toggle ${c.enabled?'on':''}" onclick="App.toggleCategory('${escapeHtml(String(c.id))}')"></button>
      <button class="btn btn-sm btn-ghost cat-edit-btn" onclick="App.openCategoryModal('${escapeHtml(String(c.id))}')">Edit</button>
      <button class="btn btn-sm btn-danger cat-delete-btn" onclick="App.deleteCategory('${escapeHtml(String(c.id))}')">Delete</button>
    </div>`;
  }).join('');
}

function v171CategoriesSectionHtml(){
  v171EnsureCategoryState();

  const missing=v171MissingDefaultCategories();
  const last=v171LastDeletedStatus();
  const highlight=S.settings.highlightDefaultCategories!==false;

  let lastLabel='Restore last deleted';
  if(last.cat){
    lastLabel=`Restore last deleted · ${escapeHtml(String(last.cat.name||last.cat.id||'category'))}`;}

  return `<div class="settings-categories-full">
    <div class="section-label">CATEGORIES</div>
    <div class="card">
      <div class="v171-category-tools">
        <div>
          <div style="font-size:11px;font-weight:850;color:var(--text)">Category recovery</div>
          <div class="v171-recovery-note">
            MediaFlow's ${DEFAULT_CATEGORIES.length} built-in categories are recognized by their original IDs. Restoring missing defaults never overwrites an existing category with the same default ID.
          </div>
        </div>

        <div class="v171-category-tool-actions">
          <button type="button" class="btn btn-sm"
            onclick="App.v171RestoreDefaultCategories()"
            ${missing.length?'':'disabled'}>
            Restore missing defaults${missing.length?` (${missing.length})`:''}
          </button>

          <button type="button" class="btn btn-sm btn-ghost"
            onclick="App.v171RestoreLastDeletedCategory()"
            ${last.canRestore?'':'disabled'}>
            ${lastLabel}
          </button>

          <label class="v171-highlight-toggle">
            <span>Highlight defaults</span>
            <button type="button"
              class="toggle ${highlight?'on':''}"
              onclick="event.preventDefault();App.v171ToggleDefaultCategoryHighlight()"
              aria-label="Toggle default category highlighting"></button>
          </label>
        </div>
      </div>

      ${v171CategoryRowsHtml()}

      <button class="btn btn-block" style="margin-top:14px;" onclick="App.openCategoryModal()">+ Add category</button>
    </div>
  </div>`;
}

// Replace only the original Categories block. All later Settings additions
// (themes, navigation, imports, XP, etc.) continue through the existing chain.
const v171RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v171RenderSettingsBase();
  const replacement=v171CategoriesSectionHtml();

  h=h.replace(
    /<div class="settings-categories-full">[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="two-col")/,
    replacement
  );

  return h;
};

Object.assign(App,{
  v171RestoreDefaultCategories,
  v171RestoreLastDeletedCategory,
  v171ToggleDefaultCategoryHighlight
});

// ---- Persistence / cloud / merge / import ----------------------------------

const v171PersistSettingsBase=persistSettings;
persistSettings=function(){
  v171EnsureCategoryState();
  return v171PersistSettingsBase.apply(this,arguments);
};

const v171SnapshotBase=snapshot;
snapshot=function(){
  v171EnsureCategoryState();
  const x=v171SnapshotBase();

  x.categoryRecovery=v171Clone(
    S.categoryRecovery,
    V171_CATEGORY_RECOVERY_DEFAULT
  );
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,171);

  return x;
};

const v171ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v171ApplyStateBase.apply(this,arguments);

  S.categoryRecovery=v171NormalizeCategoryRecovery(d?.categoryRecovery);
  v171EnsureCategoryState();

  return result;
};

const v171MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v171MergeStatesBase(a,b)||{};

  const ar=v171NormalizeCategoryRecovery(a?.categoryRecovery);
  const br=v171NormalizeCategoryRecovery(b?.categoryRecovery);

  out.categoryRecovery=v171Clone(
    (Number(ar.modifiedAt)||0)>=(Number(br.modifiedAt)||0)
      ?ar
      :br,
    V171_CATEGORY_RECOVERY_DEFAULT
  );

  out.settings=out.settings||{};
  if(typeof out.settings.highlightDefaultCategories!=='boolean'){
    const av=a?.settings?.highlightDefaultCategories;
    const bv=b?.settings?.highlightDefaultCategories;
    out.settings.highlightDefaultCategories=
      typeof av==='boolean'
        ?av
        :typeof bv==='boolean'
          ?bv
          :true;
  }

  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    171
  );

  return out;
};

// ---- Protected Sync completeness + post-upload verification ----------------

const v171StateCompletenessBase=v155StateCompleteness;
v155StateCompleteness=function(state){
  const base=v171StateCompletenessBase(state);
  const missing=[...(base?.missing||[])];

  if(!state?.categoryRecovery||typeof state.categoryRecovery!=='object'){
    missing.push('category recovery');
  }

  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

function v171CategoryAudit(state){
  const rows=(Array.isArray(state?.categories)?state.categories:[]).map(c=>({
    id:String(c?.id||''),
    name:String(c?.name||''),
    icon:String(c?.icon||''),
    iconUrl:String(c?.iconUrl||''),
    type:String(c?.type||''),
    unit:String(c?.unit||''),
    target:Number(c?.target)||0,
    weight:Number(c?.weight)||0,
    minutesPerUnit:Number(c?.minutesPerUnit)||0,
    seasonal:!!c?.seasonal,
    color:String(c?.color||''),
    enabled:c?.enabled!==false,
    custom:!!c?.custom
  }));

  const rec=v171NormalizeCategoryRecovery(state?.categoryRecovery);

  return {
    rows,
    order:Array.isArray(state?.categoryOrder)
      ?state.categoryOrder.map(String)
      :[],
    highlight:state?.settings?.highlightDefaultCategories!==false,
    recovery:{
      lastDeletedCategory:rec.lastDeletedCategory,
      lastDeletedIndex:rec.lastDeletedIndex,
      modifiedAt:rec.modifiedAt
    }
  };
}

const v171VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v171VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloudAudit=v171CategoryAudit(cloudState);
  const expectedAudit=v171CategoryAudit(expected);

  if(JSON.stringify(cloudAudit.rows)!==JSON.stringify(expectedAudit.rows)){
    problems.push('Categories');
  }

  if(JSON.stringify(cloudAudit.order)!==JSON.stringify(expectedAudit.order)){
    problems.push('Category order');
  }

  if(cloudAudit.highlight!==expectedAudit.highlight){
    problems.push('Default category highlight preference');
  }

  if(
    JSON.stringify(cloudAudit.recovery)!==
    JSON.stringify(expectedAudit.recovery)
  ){
    problems.push('Category recovery');
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// ---- Full Backup / Automatic Backup / JSON import-export -------------------

const v171BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  v171EnsureCategoryState();
  const payload=v171BuildFullBackupBase();

  payload.backupSchemaVersion=V171_BACKUP_SCHEMA_VERSION;
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.categoryRecovery=v171Clone(
    S.categoryRecovery,
    V171_CATEGORY_RECOVERY_DEFAULT
  );
  payload.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );
  payload.backupManifest.schemaVersion=V171_BACKUP_SCHEMA_VERSION;
  payload.backupManifest.note='Complete MediaFlow v171 backup. Includes categories with stable IDs/order, default-category highlight preference, last-deleted category recovery state, advanced imports, automatic Seasonal/Jikan state, System Respect XP, themes/navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences. Authentication credentials and filesystem permission handles remain intentionally non-portable.';

  return payload;
};

const v171BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v171BackupManifestBase(state,extras);
  const missingIds=new Set(
    DEFAULT_CATEGORIES
      .map(c=>String(c.id))
      .filter(id=>!(state?.categories||[]).some(c=>String(c?.id||'')===id))
  );
  const rec=v171NormalizeCategoryRecovery(state?.categoryRecovery);

  manifest.schemaVersion=V171_BACKUP_SCHEMA_VERSION;
  manifest.includes=Object.assign({},manifest.includes||{},{
    stableDefaultCategoryIds:true,
    defaultCategoryHighlightPreference:true,
    lastDeletedCategoryRecovery:true,
    categoryRecoveryPosition:true
  });

  manifest.counts=Object.assign({},manifest.counts||{},{
    defaultCategoriesPresent:DEFAULT_CATEGORIES.length-missingIds.size,
    defaultCategoriesMissing:missingIds.size,
    recoverableDeletedCategory:rec.lastDeletedCategory?1:0
  });

  return manifest;
};

// v152 Automatic Backup resolves the final v148BuildFullBackup() at runtime,
// so v171 recovery/highlight/category state is automatically included.
// Full JSON import applies categoryRecovery through the final v46ApplyState()
// chain above.



