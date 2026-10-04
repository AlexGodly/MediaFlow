/* ============================================================
   MediaFlow v174 — Edit Recommended Title From Dashboard
   ------------------------------------------------------------
   When Exact Title Recommendations is active and MediaFlow has picked a
   Library title, the Dashboard now exposes Edit directly beside that
   recommendation. It reuses the normal Library editor; there is no duplicate
   editor/state path.
   ============================================================ */

function v174RecommendedLibraryItem(){
  const t=S.currentTask;
  if(!t?.title || !S.settings?.exactTitleRecommendations)return null;

  if(t.libraryId){
    const byId=(S.library||[]).find(
      item=>String(item?.id||'')===String(t.libraryId)
    );
    if(byId)return byId;
  }

  return v50FindLibraryItem(t.libraryId,t.title);
}

function v174EditRecommendedTitle(){
  const item=v174RecommendedLibraryItem();

  if(!item?.id){
    showToast('This recommended title is not available in your Library.');
    return;
  }

  App.openLibraryModal(item.id);
}

Object.assign(App,{
  v174EditRecommendedTitle
});

// FINAL Dashboard wrapper. This runs after the existing v50 cover-aware
// recommendation renderer, so both rich-cover and plain recommendation states
// receive the same Edit action.
const v174RenderDashboardBase=renderDashboard;
renderDashboard=function(){
  let h=v174RenderDashboardBase();
  const t=S.currentTask;

  if(
    !t?.title ||
    !S.settings?.exactTitleRecommendations ||
    !v174RecommendedLibraryItem()?.id
  ){
    return h;
  }

  const editButton=`<button type="button"
    class="btn btn-sm btn-ghost v174-recommended-edit"
    onclick="App.v174EditRecommendedTitle()"
    title="Edit this recommended Library title">
    Edit
  </button>`;

  // Cover-aware v50 recommendation.
  const richPattern=/(<div class="hero-note v50-title-feature">[\s\S]*?<b>[^<]*<\/b><\/div><\/div>)/;
  if(richPattern.test(h)){
    h=h.replace(
      richPattern,
      `<div class="v174-recommended-title-row">$1${editButton}</div>`
    );
    return h;
  }

  // Plain recommendation when the Library title has no cover.
  const plain=`<div class="hero-note">MediaFlow recommends: <b>${escapeHtml(t.title)}</b></div>`;
  if(h.includes(plain)){
    h=h.replace(
      plain,
      `<div class="v174-recommended-title-row">${plain}${editButton}</div>`
    );
  }

  return h;
};

// If the user edits the recommended title's name from the reused Library
// editor, keep the active task label aligned with that Library item.
const v174SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const wasRecommended=
    !!id &&
    !!S.currentTask &&
    String(S.currentTask.libraryId||'')===String(id);

  const result=v174SaveLibraryModalBase.apply(this,arguments);

  if(wasRecommended){
    const item=(S.library||[]).find(
      row=>String(row?.id||'')===String(id)
    );
    if(item){
      S.currentTask.title=cleanTitle(item.title);
      persistTask();
    }
  }

  return result;
};

// No new persistent user data is introduced in v174. The edit action writes
// through the existing Library persistence pipeline, which is already included
// in cloud state, Sync Now verification, Full Backup, Automatic Backup and JSON
// backup import/export.

const v174BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v174BuildFullBackupBase();
  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v174 backup. Dashboard recommended-title editing reuses the normal Library data path, so edited recommendation title metadata is preserved through the existing cloud, Sync Now, Full Backup, Automatic Backup and JSON backup pipelines.';
  }

  return payload;
};



