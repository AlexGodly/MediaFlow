/* ============================================================
   MediaFlow v286 — Category edit persistence / runtime cache coherence
   ------------------------------------------------------------------
   v241 introduced a category-id lookup cache keyed by the categories array
   reference + length. Editing an existing category replaced one element in
   place, so the array reference/length stayed identical and getCategory()
   could keep returning the old category object. That made Settings appear to
   save while Logging/scheduler calculations still used stale values such as
   the old minutes-per-unit. v286 makes category edits immutable and explicitly
   invalidates category-derived runtime indexes before anything rerenders.
   ============================================================ */
const V286_RUNTIME_VERSION=286;

function v286InvalidateCategoryRuntimeCaches(){
  try{
    V241_CATEGORY_REF=null;
    V241_CATEGORY_LEN=-1;
    V241_CATEGORY_MAP=new Map();
  }catch(_){ }
  // Library search/index text contains category names and other category-derived
  // metadata, so refresh it too when category metadata changes.
  try{v53InvalidateLibraryCache?.();}catch(_){ }
}

function v286CategoryByState(id){
  const sid=String(id||'');
  return (S.categories||[]).find(c=>String(c?.id||'')===sid)||null;
}

App.saveCategoryModal=function(id,button){
  if(button?.dataset?.saving==='1')return;
  if(button){button.dataset.saving='1';button.disabled=true;}

  let data;
  try{data=v283ReadCategoryForm(id);}catch(err){
    if(button){delete button.dataset.saving;button.disabled=false;}
    showToast(err?.message||'Could not save that category.');
    return;
  }

  const sid=String(id||'');
  const current=Array.isArray(S.categories)?S.categories:[];
  const idx=current.findIndex(c=>String(c?.id||'')===sid);
  const now=Date.now();
  if(idx>=0){
    const previous=current[idx]||{};
    const next=Object.assign({},previous,data,{id:previous.id||data.id,modifiedAt:now});
    // IMPORTANT: replace the array reference, not only the element. v241's
    // category cache watches this reference and will rebuild immediately.
    S.categories=current.map((c,i)=>i===idx?next:c);
    data=next;
  }else{
    data=Object.assign({},data,{modifiedAt:now});
    S.categories=[...current,data];
  }

  v286InvalidateCategoryRuntimeCaches();
  v74SyncCategoryOrder();
  S.settings=S.settings||{};
  S.settings.categoryOrder=S.categoryOrder.slice();

  // Verify the exact value that all runtime consumers (Logging, scheduler,
  // Statistics, etc.) will receive before the modal disappears.
  const canonical=getCategory(data.id);
  if(!canonical||String(canonical.id)!==String(data.id)){
    if(button){delete button.dataset.saving;button.disabled=false;}
    showToast('Category could not be activated. Please try again.');
    return;
  }

  v283CloseModal();
  v283RefreshAfterCategoryMutation();

  let pending=null;
  try{pending=saveState();}catch(err){console.error('Category persistence failed',err);}
  Promise.resolve(pending).then(()=>{
    const live=getCategory(data.id);
    showToast(`${live?.name||data.name} saved`);
  }).catch(err=>{
    console.error('Category persistence failed',err);
    showToast(`${data.name} saved locally; cloud save will retry.`);
  });
};

// Category deletion already replaces the array reference, but invalidating the
// category-derived caches here makes the same rule explicit and future-safe.
const v286ConfirmDeleteCategoryBase=App.confirmDeleteCategory;
App.confirmDeleteCategory=function(id,button){
  const out=v286ConfirmDeleteCategoryBase.apply(this,arguments);
  v286InvalidateCategoryRuntimeCaches();
  return out;
};

function v286CategoryPersistenceAudit(id){
  const state=v286CategoryByState(id);
  const runtime=getCategory(id);
  return {
    version:286,
    id:String(id||''),
    stateMinutesPerUnit:Number(state?.minutesPerUnit)||0,
    runtimeMinutesPerUnit:Number(runtime?.minutesPerUnit)||0,
    stateName:String(state?.name||''),
    runtimeName:String(runtime?.name||''),
    sameObject:state===runtime,
    cacheCoherent:!!state&&state===runtime&&Number(state.minutesPerUnit)===Number(runtime?.minutesPerUnit),
    cloudSyncVersion:201,
    fullBackupSchema:29,
    settingsPresetSchema:1,
    personalOrderExportVersion:4,
    collectionsExportVersion:2,
    pwaRelease:286
  };
}
Object.assign(App,{v286InvalidateCategoryRuntimeCaches,v286CategoryPersistenceAudit});
window.MediaFlowV286={version:286,focus:'Category edits save canonically and immediately update every runtime consumer'};
MediaFlowRuntime.version=V286_RUNTIME_VERSION;
