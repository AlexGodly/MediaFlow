/* ============================================================
   MediaFlow v192
   - Dashboard section visibility controls
   - Show/hide Today's Balance
   - Show/hide Rate Your Library
   - New Missing Covers queue under Rating Queue
   - Full Backup schema v25 + Cloud Sync audit v192
   ============================================================ */

const V192_BACKUP_SCHEMA_VERSION=26;
const V192_CLOUD_SYNC_VERSION=193;
const V192_DASHBOARD_DEFAULT={
  showTodayBalance:true,
  showRatingQueue:true,
  showMissingCovers:true,
  showStopwatch:true,
  modifiedAt:0
};

function v192NormalizeDashboardSettings(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  return {
    showTodayBalance:src.showTodayBalance!==false,
    showRatingQueue:src.showRatingQueue!==false,
    showMissingCovers:src.showMissingCovers!==false,
    showStopwatch:src.showStopwatch!==false,
    modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
  };
}

function v192EnsureDashboardSettings(settings=S.settings){
  settings=settings&&typeof settings==='object'?settings:{};
  settings.v192Dashboard=v192NormalizeDashboardSettings(settings.v192Dashboard);
  return settings.v192Dashboard;
}

function v192ToggleDashboardSection(key){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  if(!['showTodayBalance','showRatingQueue','showMissingCovers','showStopwatch'].includes(key))return;
  cfg[key]=!cfg[key];
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  const labels={
    showTodayBalance:"Today's Balance",
    showRatingQueue:'Rate Your Library',
    showMissingCovers:'Missing Covers',
    showStopwatch:'Stopwatch'
  };
  showToast(`${labels[key]} ${cfg[key]?'shown':'hidden'} on Dashboard`);
}

Object.assign(App,{v192ToggleDashboardSection});

