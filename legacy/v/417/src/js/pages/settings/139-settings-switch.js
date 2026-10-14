/* ---------- Settings switch ---------- */
function v200CategoryCoverSettingsHtml(){
  const cfg=v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  return `<div class="section-label">MISSING TITLE COVERS</div>
    <div class="card v200-category-cover-settings" style="margin-bottom:22px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
        <div style="min-width:0;flex:1">
          <b>Use category default missing cover</b>
          <div class="hint">When a title has no cover URL, use its category's Missing default cover URL. A title's own cover always has priority. Categories without a default automatically fall back to their category icon.</div>
        </div>
        <button type="button" class="toggle ${cfg.useCategoryDefault!==false?'on':''}" onclick="App.v200ToggleCategoryDefaultCovers()" aria-label="Toggle category default missing covers"></button>
      </div>
      <div class="hint" style="margin-top:10px"><b>${cfg.useCategoryDefault!==false?'Category default cover mode':'Category icon only mode'}</b> · Missing Covers still tracks titles that do not have their own cover URL.</div>
    </div>`;
}
function v200ToggleCategoryDefaultCovers(){
  const cfg=v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  cfg.useCategoryDefault=cfg.useCategoryDefault===false;
  cfg.modifiedAt=Date.now();
  persistSettings();
  render();
  showToast(cfg.useCategoryDefault?'Category default missing covers enabled':'Missing covers will use category icons only');
}
App.v200ToggleCategoryDefaultCovers=v200ToggleCategoryDefaultCovers;

const v200RenderSettingsBase=renderSettings;
renderSettings=function(){
  v200EnsureCategoryCoverSettings(S.settings||DEFAULT_SETTINGS);
  let h=v200RenderSettingsBase.apply(this,arguments);
  const marker='<div class="section-label">MISSING TITLE COVERS</div>';
  if(h.includes(marker))return h;
  const iconSection='<div class="section-label">CATEGORY ICONS</div>';
  const nextSection='<div class="two-col" style="align-items:start;">';
  if(h.includes(iconSection)&&h.includes(nextSection)){
    const idx=h.indexOf(nextSection,h.indexOf(iconSection));
    if(idx>=0)h=h.slice(0,idx)+v200CategoryCoverSettingsHtml()+h.slice(idx);
    else h+=v200CategoryCoverSettingsHtml();
  }else h+=v200CategoryCoverSettingsHtml();
  return h;
};

