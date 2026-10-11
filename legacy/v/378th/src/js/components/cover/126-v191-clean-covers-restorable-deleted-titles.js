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

