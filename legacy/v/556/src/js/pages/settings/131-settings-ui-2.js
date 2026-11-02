/* ---------- Settings UI ---------- */
function v192DashboardVisibilitySettingsHtml(){
  const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  const row=(key,title,desc)=>`<div class="v192-dashboard-toggle-row"><div><b>${escapeHtml(title)}</b><div class="hint">${escapeHtml(desc)}</div></div><button type="button" class="toggle ${cfg[key]!==false?'on':''}" onclick="App.v192ToggleDashboardSection('${key}')" aria-label="Toggle ${escapeHtml(title)}"></button></div>`;
  return `<div class="card v192-dashboard-settings-card">
    <div class="v192-dashboard-settings-head"><div><b>Dashboard sections</b><div class="hint">Choose which optional Dashboard sections MediaFlow shows. Hiding a section never deletes its Library, History or settings data.</div></div></div>
    <div class="v192-dashboard-toggle-list">
      ${row('showTodayBalance',"Today's Balance",'Show or hide the Today’s Balance category section.')}
      ${row('showRatingQueue','Rate Your Library','Show or hide the unrated-title queue on Dashboard.')}
      ${row('showMissingCovers','Missing Covers','Show or hide the queue for Library titles that do not have a cover URL.')}
      ${row('showStopwatch','Stopwatch','Show or hide the Stopwatch card on Dashboard. Its current timer state is preserved while hidden.')}
    </div>
  </div>`;
}
const v192RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v192RenderSettingsBase.apply(this,arguments);
  const marker='<div class="section-label">DASHBOARD SETTINGS</div>';
  if(h.includes(marker))h=h.replace(marker,marker+v192DashboardVisibilitySettingsHtml());
  else h+=`<div class="section-label">DASHBOARD SETTINGS</div>${v192DashboardVisibilitySettingsHtml()}`;
  return h;
};

