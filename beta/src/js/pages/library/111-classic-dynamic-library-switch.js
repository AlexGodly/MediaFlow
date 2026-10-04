/* ============================================================
   Classic / Dynamic Library switch
   ============================================================ */

function v181LibraryModeSwitchHtml(){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  return `<div class="v181-library-mode-switch">
    <span class="hint">Library mode:</span>

    <button type="button"
      class="btn btn-sm ${cfg.mode==='classic'?'active':''}"
      onclick="App.v181SetLibraryMode('classic')">
      Current
    </button>

    <button type="button"
      class="btn btn-sm ${cfg.mode==='dynamic'?'active':''}"
      onclick="App.v181SetLibraryMode('dynamic')">
      Dynamic
    </button>
  </div>`;
}

function v181SetLibraryMode(mode){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  cfg.mode=mode==='dynamic'?'dynamic':'classic';
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
}

function v181MoveInArray(arr,index,delta){
  const next=index+delta;
  if(index<0||next<0||next>=arr.length)return arr;
  const out=arr.slice();
  const [value]=out.splice(index,1);
  out.splice(next,0,value);
  return out;
}

function v181MoveDynamicCategory(id,delta){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const index=cfg.categoryOrder.indexOf(String(id));
  cfg.categoryOrder=v181MoveInArray(
    cfg.categoryOrder,
    index,
    Number(delta)||0
  );
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v181ToggleDynamicCategory(id,visible){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const set=new Set(cfg.hiddenCategoryIds||[]);

  if(visible)set.delete(String(id));
  else set.add(String(id));

  cfg.hiddenCategoryIds=[...set];
  const normalized=v181NormalizeLibrarySettings(cfg,S.categories);

  Object.assign(cfg,normalized,{modifiedAt:Date.now()});
  S.libPage=0;
  persistSettings();
  render();
}

function v181MoveDynamicStatus(status,delta){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const index=cfg.statusOrder.indexOf(String(status));

  cfg.statusOrder=v181MoveInArray(
    cfg.statusOrder,
    index,
    Number(delta)||0
  );
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
}

function v181SelectDynamicCategory(id){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const visible=cfg.categoryOrder.filter(
    x=>!cfg.hiddenCategoryIds.includes(x)
  );

  if(!visible.includes(String(id)))return;

  cfg.activeCategoryId=String(id);
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
}

function v181SelectDynamicStatus(status){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);

  if(!cfg.statusOrder.includes(String(status)))return;

  cfg.activeStatus=String(status);
  cfg.modifiedAt=Date.now();
  S.libPage=0;
  persistSettings();
  render();
}

function v181ResetDynamicLibrary(){
  const previousMode=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).mode;

  S.settings.v181Library=v181NormalizeLibrarySettings(
    Object.assign(
      {},
      V181_LIBRARY_DEFAULT,
      {
        mode:previousMode,
        modifiedAt:Date.now()
      }
    ),
    S.categories
  );

  S.libPage=0;
  persistSettings();
  render();
  showToast('Dynamic Library layout reset.');
}

Object.assign(App,{
  v181SetLibraryMode,
  v181MoveDynamicCategory,
  v181ToggleDynamicCategory,
  v181MoveDynamicStatus,
  v181SelectDynamicCategory,
  v181SelectDynamicStatus,
  v181ResetDynamicLibrary,
  v181SetDefaultLoggingMode
});

