/* MediaFlow v564 — themes show their own colours by default.
 *
 * The Global Light / Dark appearance layer (v106/v132) replaced every theme's
 * surfaces with plain light or dark ones. It is now off by default: the theme
 * (or the Dynamic Cover Theme) shows its own colours, and Light / Dark is
 * applied only when you switch Global appearance on in Settings → Themes.
 * Accounts are moved over once (settings.v564NativeThemeDefault); after that
 * the switch is yours. The MediaFlow app (5.1.0.564) does the same.
 */
const V564_RELEASE=564;
function mf564MigrateNativeTheme(){
  const s=S.settings;
  if(!s||typeof s!=='object'||s.v564NativeThemeDefault===true)return false;
  s.globalAppearanceEnabled=false;
  s.v564NativeThemeDefault=true;
  return true;
}
const mf564ApplyThemeBase=applyTheme;
applyTheme=function(){
  const moved=mf564MigrateNativeTheme();
  const out=mf564ApplyThemeBase.apply(this,arguments);
  if(moved){try{persistSettings();}catch(_){}}
  return out;
};
MediaFlowRuntime.version=V564_RELEASE;
window.MediaFlowV564={version:564,migrate:mf564MigrateNativeTheme};
