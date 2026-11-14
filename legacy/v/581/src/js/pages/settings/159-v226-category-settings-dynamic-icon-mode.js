/* ============================================================
   MediaFlow v226 — Category Settings Layout + Dynamic Row Icons
   ------------------------------------------------------------
   Adds a persistent Dynamic Library category-row icon preference:
   - No icons (default)
   - Category icon URL
   The preference lives inside v181Library so normal Settings/Sync/
   Full Backup/Automatic Backup/Settings Preset pipelines keep it.
   ============================================================ */

V181_LIBRARY_DEFAULT.dynamicCategoryIcons='none';
DEFAULT_SETTINGS.v181Library=DEFAULT_SETTINGS.v181Library||{};
DEFAULT_SETTINGS.v181Library.dynamicCategoryIcons='none';

const v226NormalizeLibrarySettingsBase=v181NormalizeLibrarySettings;
v181NormalizeLibrarySettings=function(raw,categories){
  const out=v226NormalizeLibrarySettingsBase(raw,categories);
  const requested=String(raw?.dynamicCategoryIcons||'none');
  out.dynamicCategoryIcons=requested==='category-url'?'category-url':'none';
  return out;
};

function v226DynamicCategoryIconMode(){
  return v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).dynamicCategoryIcons==='category-url'?'category-url':'none';
}
function v226ApplyDynamicCategoryIconMode(){
  document.documentElement.dataset.v226DynamicCategoryIcons=v226DynamicCategoryIconMode();
}
function v226SetDynamicCategoryIcons(value){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  cfg.dynamicCategoryIcons=String(value)==='category-url'?'category-url':'none';
  cfg.modifiedAt=Date.now();
  persistSettings();
  v226ApplyDynamicCategoryIconMode();
  render();
}
Object.assign(App,{v226SetDynamicCategoryIcons});

const v226DynamicLibrarySettingsHtmlBase=v181DynamicLibrarySettingsHtml;
v181DynamicLibrarySettingsHtml=function(){
  let h=v226DynamicLibrarySettingsHtmlBase.apply(this,arguments);
  const mode=v226DynamicCategoryIconMode();
  const setting=`<div class="v226-dynamic-category-icon-setting">
    <div class="v226-dynamic-category-icon-copy">
      <b>Dynamic category row icons</b>
      <small>Choose whether the Dynamic Library category row stays text-only or shows each category's own icon URL. Emoji/fallback icons are intentionally not used in this row.</small>
    </div>
    <select aria-label="Dynamic Library category row icons" onchange="App.v226SetDynamicCategoryIcons(this.value)">
      <option value="none" ${mode==='none'?'selected':''}>No icons</option>
      <option value="category-url" ${mode==='category-url'?'selected':''}>Category icon URL</option>
    </select>
  </div>`;
  const marker='<div class="section-label" style="margin-top:15px;">DYNAMIC CATEGORY ROW</div>';
  if(h.includes(marker))h=h.replace(marker,setting+marker);
  return h;
};

// Make the new persistent control participate in v221's individual Reset flow.
const v226ResetDescriptorBase=v221ResetDescriptorForControl;
v221ResetDescriptorForControl=function(el){
  const code=[el?.getAttribute?.('onchange'),el?.getAttribute?.('onclick'),el?.getAttribute?.('oninput')].filter(Boolean).join(' ');
  if(/App\.v226SetDynamicCategoryIcons\(/.test(code))return {type:'path',path:'v181Library.dynamicCategoryIcons'};
  return v226ResetDescriptorBase(el);
};

// Reset/import/cloud merges can change the setting without calling the setter.
const v226ApplySettingsSideEffectsBase=v221ApplySettingsSideEffects;
v221ApplySettingsSideEffects=function(){
  const result=v226ApplySettingsSideEffectsBase.apply(this,arguments);
  v226ApplyDynamicCategoryIconMode();
  return result;
};

const v226RenderBase=render;
render=function(){
  v226ApplyDynamicCategoryIconMode();
  return v226RenderBase.apply(this,arguments);
};

v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
v226ApplyDynamicCategoryIconMode();
MediaFlowRuntime.version=V226_RUNTIME_VERSION;
