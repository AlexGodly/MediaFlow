/* MediaFlow v485 — Visual Engine Ownership, Lifecycle & Recovery.
 * v484 functionality remains intact; this layer prevents late theme writers,
 * suspends inactive cover-rotation work, retains last-good palettes, and
 * provides an explicit safe-recovery path. No Library or cloud schema writes.
 */
const MF485_VERSION=485;
const MF485={
 revision:0,pendingKey:'',pending:null,appliedKey:'',atmosphereKey:'',
 lastGood:null,lastError:'',lastSource:'',lastReason:'boot',restores:0,
 blockedStale:0,renderedLayers:0
};
function mf485Owner(){
 const p=mf484Prefs();
 return {mode:p.mode,source:p.mode==='custom'?'profile':S.settings?.dynamicCoverTheme?'cover':'static',living:p.living.mode};
}
function mf485ProfileKey(prefs=mf484Prefs()){
 const profile=mf484ActiveProfile(prefs);
 return JSON.stringify([profile.id,profile.source,profile.imageUrl,profile.colors,
  profile.appearance,profile.variation,prefs.expressiveness]);
}
function mf485SurfacePalette(){
 const root=document.documentElement;
 const css=getComputedStyle(root),read=k=>css.getPropertyValue(k).trim();
 const primary=mf484Hex(read('--flow'),'#A682E8');
 const secondary=mf484Hex(read('--v159-secondary'),mf484Hex(read('--flow-dim'),primary));
 const tertiary=mf484Hex(read('--v159-tertiary'),secondary);
 return {primary,secondary,tertiary,flow:primary,flowDim:secondary};
}
function mf485Invalidate(reason){
 MF485.revision++;
 MF485.lastReason=String(reason||'change').slice(0,90);
 MF485.pending=null;MF485.pendingKey='';MF485.appliedKey='';
 MF485.atmosphereKey='';
 // Invalidate an already-running cover extraction before its awaited
 // promise can write into a newly selected Custom/static theme.
 ++V146_DYNAMIC_SEQ;
 ++MF484_CUSTOM_SEQ;
}
function mf485SuspendCoverWork(){
 if(typeof v162StopRotation==='function')v162StopRotation();
 if(typeof V159_DYNAMIC_SOURCE_TIMER!=='undefined'){
  clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
  V159_DYNAMIC_SOURCE_TIMER=null;
 }
 V159_FORCED_THEME_SOURCE=null;
}
function mf485ResumeCoverWork(){
 if(!S.settings?.dynamicCoverTheme)return;
 try{v162EnsureRotationTimer(true);}catch(e){console.warn('v485 rotation restore',e);}
 try{v159EnsureDynamicSourceTimer();}catch(e){console.warn('v485 source refresh',e);}
}
// Only the configured mode can own a full-palette write.
// The legacy engine's static themes still use its original applyTheme path.
function mf485MayWrite(source){
 const owner=mf485Owner(),kind=String(source?.source||'');
 if(owner.mode==='custom')return kind==='custom';
 if(kind==='custom')return false;
 return owner.source==='cover';
}
function mf485ValidPalette(palette){
 if(!palette||!['dark','light'].includes(palette.mode))return false;
 return ['bg','panel','raised','border','borderSoft','text','textDim','textMute','flow','flowDim']
  .every(key=>/^#[0-9a-f]{6}$/i.test(String(palette[key]||'')));
}
const mf485BaseApplyFull=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
 if(!mf485MayWrite(source)){
  MF485.blockedStale++;
  return undefined;
 }
 if(!mf485ValidPalette(palette)){
  MF485.lastError='Ignored an invalid theme palette';
  console.warn('[MediaFlow v485] Rejected invalid theme colors');
  return undefined;
 }
 try{
  const result=mf485BaseApplyFull.apply(this,arguments);
  const owner=mf485Owner(),kind=String(source?.source||'');
  MF485.lastGood={
   mode:owner.mode,kind,palette:{...palette},
   source:{source:kind,label:String(source?.label||'Theme').slice(0,150),
    url:String(source?.url||'').slice(0,2000)}
  };
  MF485.lastSource=MF485.lastGood.source.label;
  MF485.lastError='';
  if(kind==='custom')MF485.appliedKey=mf485ProfileKey();
  return result;
 }catch(error){
  MF485.lastError='Theme application failed; previous valid palette retained';
  console.error('[MediaFlow v485] Theme apply failed',error);
  const previous=MF485.lastGood;
  if(previous&&previous.mode===mf485Owner().mode&&mf485ValidPalette(previous.palette)){
   try{mf485BaseApplyFull(previous.palette,previous.source);MF485.restores++;}catch(rollbackError){
    console.error('[MediaFlow v485] Previous palette recovery failed',rollbackError);
   }
  }
  return undefined;
 }
};
const mf485BaseClear=v146ClearInlineThemeVars;
v146ClearInlineThemeVars=function(){
 if(mf485Owner().mode==='custom'){
  MF485.blockedStale++;
  return undefined;
 }
 MF485.atmosphereKey='';
 return mf485BaseClear.apply(this,arguments);
};
const mf485BaseFallback=v146RestoreSelectedThemeFallback;
v146RestoreSelectedThemeFallback=function(){
 if(mf485Owner().mode==='custom'){
  MF485.blockedStale++;
  return undefined;
 }
 const result=mf485BaseFallback.apply(this,arguments);
 if(mf485Owner().mode==='legacy'&&mf484Prefs().living.mode==='off'){
  mf484Clear();
 }else{
  mf484ApplyAtmosphere(mf485SurfacePalette(),'');
 }
 return result;
};
// Custom mode is authoritative even when an old page handler requests a
// static appearance. The original setter is still used on mode exit.
const mf485ApplyThemeBase=applyTheme;
applyTheme=function(theme){
 if(mf485Owner().mode==='custom')return undefined;
 return mf485ApplyThemeBase.apply(this,arguments);
};
// Suspend background theme rotations in Custom mode. The saved source list,
// order and intervals remain intact for use after leaving Custom.
const mf485SourceTimerBase=v159EnsureDynamicSourceTimer;
v159EnsureDynamicSourceTimer=function(){
 if(mf485Owner().mode==='custom'){mf485SuspendCoverWork();return;}
 return mf485SourceTimerBase.apply(this,arguments);
};
const mf485RotationBase=v162EnsureRotationTimer;
v162EnsureRotationTimer=function(){
 if(mf485Owner().mode==='custom'){mf485SuspendCoverWork();return;}
 return mf485RotationBase.apply(this,arguments);
};
// The original v484 function can restart animation nodes on every theme
// refresh. Preserve the existing nodes if the composition hasn't changed.
const mf485AtmosphereBase=mf484ApplyAtmosphere;
mf484ApplyAtmosphere=function(palette,imageUrl){
 const p=mf484Prefs();
 if(p.mode==='legacy'&&p.living.mode==='off'){
  MF485.atmosphereKey='';
  return mf485AtmosphereBase.apply(this,arguments);
 }
 const a=palette?.primary||palette?.flow||'#9F62E8';
 const b=palette?.secondary||palette?.flowDim||'#31BED1';
 const c=palette?.tertiary||a;
 const photo=p.mode==='custom'?mf484ImageUrl(imageUrl):'';
 const key=JSON.stringify([p.mode,p.living,p.expressiveness,a,b,c,photo]);
 const root=document.documentElement,host=document.getElementById('mf484-atmosphere');
 if(key===MF485.atmosphereKey&&host&&root.dataset.mf484Mode===p.mode&&
    root.style.getPropertyValue('--mf484-a')===a&&
    root.style.getPropertyValue('--mf484-b')===b){
  root.dataset.mf484Motion=mf484AllowMotion(p.living)?'on':'off';
  return;
 }
 const result=mf485AtmosphereBase.apply(this,arguments);
 MF485.atmosphereKey=key;
 MF485.renderedLayers++;
 return result;
};
const mf485ClearBase=mf484Clear;
mf484Clear=function(){
 MF485.atmosphereKey='';
 return mf485ClearBase.apply(this,arguments);
};
// Do not restart an asynchronous custom-image extraction every time a
// recommendation or page render requests a theme refresh.
const mf485CustomBase=mf484ApplyCustom;
mf484ApplyCustom=function(){
 const p=mf484Prefs();
 if(p.mode!=='custom')return Promise.resolve();
 const key=mf485ProfileKey(p);
 if(MF485.pending&&MF485.pendingKey===key)return MF485.pending;
 const active=document.documentElement.dataset.v146DynamicActive==='1'&&
  S.v146DynamicThemeState?.source==='custom';
 if(MF485.appliedKey===key&&active){
  mf484ApplyAtmosphere(S.v146DynamicThemeState.palette,mf484ActiveProfile(p).imageUrl);
  return Promise.resolve();
 }
 MF485.pendingKey=key;
 const work=Promise.resolve().then(()=>mf485CustomBase.apply(this,arguments)).catch(err=>{
  MF485.lastError='Custom image analysis failed; last valid theme retained';
  console.warn('[MediaFlow v485] Custom theme refresh failed',err);
 }).finally(()=>{if(MF485.pending===work){MF485.pending=null;MF485.pendingKey='';}});
 MF485.pending=work;
 return work;
};
function mf485Reconcile(reason='state'){
 MF485.lastReason=reason;
 const p=mf484Prefs(),root=document.documentElement;
 if(p.mode==='custom'){
  mf485SuspendCoverWork();
  if(S.v146DynamicThemeState?.source!=='custom'||root.dataset.v146DynamicActive!=='1'||
     MF485.appliedKey!==mf485ProfileKey(p)){
   return mf484ApplyCustom();
  }
  return mf484ApplyAtmosphere(S.v146DynamicThemeState.palette,mf484ActiveProfile(p).imageUrl);
 }
 if(p.mode==='legacy'&&p.living.mode==='off'){
  if(root.dataset.mf484Mode||document.getElementById('mf484-atmosphere'))mf484Clear();
  return;
 }
 if(!S.settings?.dynamicCoverTheme){
  return mf484ApplyAtmosphere(mf485SurfacePalette(),'');
 }
 // Existing cover-theme refresh logic handles source priority; avoid
 // requesting additional network work on every ordinary page render.
 if(root.dataset.v146DynamicActive==='1'&&S.v146DynamicThemeState?.palette)
  return mf484ApplyAtmosphere(S.v146DynamicThemeState.palette,'');
}
const mf485SetModeBase=App.mf484SetMode;
App.mf484SetMode=function(mode){
 if(!['legacy','advanced','custom'].includes(mode))return;
 const before=mf485Owner().mode;
 if(before===mode)return;
 mf485Invalidate('mode '+before+' -> '+mode);
 if(before==='custom'&&mode!=='custom'){
  // A previously applied custom palette must never supply fallback colors.
  S.v146DynamicThemeState={source:'theme',label:'Selected theme fallback',
   url:'',palette:null};
 }
 const result=mf485SetModeBase.call(this,mode);
 if(mode==='custom')mf485SuspendCoverWork();
 else mf485ResumeCoverWork();
 mf485Reconcile('mode changed');
 return result;
};
const mf485SetOptionBase=App.mf484SetOption;
App.mf484SetOption=function(key,value){
 const result=mf485SetOptionBase.call(this,key,value);
 if(['expressiveness','living.mode','living.intensity','living.performance',
   'living.source'].includes(key)||String(key).startsWith('effect.'))
  mf485Reconcile('setting changed');
 return result;
};
const mf485CollectionBase=App.setThemeCollection;
App.setThemeCollection=function(){
 const p=mf484Prefs(),mode=p.mode;
 if(mode==='custom'){
  // Keep the selected fallback collection, but don't let its side effects
  // replace the user's custom profile.
  mf485Invalidate('collection selection while custom');
 }
 const result=mf485CollectionBase.apply(this,arguments);
 if(mode==='custom'){
  mf485SuspendCoverWork();
  mf485Reconcile('custom collection independence');
 }
 return result;
};
const mf485RefreshBase=mf484Sync;
mf484Sync=function(){
 const output=mf485RefreshBase.apply(this,arguments);
 mf485Reconcile('visual sync');
 return output;
};
const mf485StudioSaveBase=App.mf484SaveStudio;
App.mf484SaveStudio=function(){
 const result=mf485StudioSaveBase.apply(this,arguments);
 MF485.appliedKey='';MF485.atmosphereKey='';
 mf485Reconcile('studio save');
 return result;
};
const mf485SelectProfileBase=App.mf484SelectProfile;
App.mf484SelectProfile=function(){
 MF485.appliedKey='';MF485.pending=null;MF485.pendingKey='';
 ++MF484_CUSTOM_SEQ;
 const result=mf485SelectProfileBase.apply(this,arguments);
 mf485Reconcile('profile switch');
 return result;
};
const mf485DuplicateProfileBase=App.mf484DuplicateProfile;
App.mf484DuplicateProfile=function(){
 MF485.appliedKey='';MF485.pending=null;MF485.pendingKey='';
 ++MF484_CUSTOM_SEQ;
 const result=mf485DuplicateProfileBase.apply(this,arguments);
 mf485Reconcile('profile duplicate');
 return result;
};
const mf485DeleteProfileBase=App.mf484DeleteProfile;
App.mf484DeleteProfile=function(){
 const result=mf485DeleteProfileBase.apply(this,arguments);
 MF485.appliedKey='';MF485.pending=null;MF485.pendingKey='';
 ++MF484_CUSTOM_SEQ;mf485Reconcile('profile deletion');
 return result;
};
function mf485Status(){
 const owner=mf485Owner(),last=MF485.lastGood;
 return {
  version:MF485_VERSION,mode:owner.mode,source:owner.source,
  atmosphere:owner.living,customPending:!!MF485.pending,
  lastGood:!!last,lastGoodSource:last?.source.label||'',
  lastError:MF485.lastError,blockedStale:MF485.blockedStale,
  restored:MF485.restores,atmosphereCompositions:MF485.renderedLayers,
  lastReason:MF485.lastReason
 };
}
function mf485RestorePalette(){
 const good=MF485.lastGood;
 if(good&&good.mode===mf485Owner().mode&&mf485ValidPalette(good.palette)){
  mf485Invalidate('restore last palette');
  v146ApplyFullPalette({...good.palette},{...good.source});
  MF485.restores++;
  if(good.kind==='custom'){
   mf484ApplyAtmosphere(good.palette,mf484ActiveProfile().imageUrl);
  }
  showToast('Previous valid palette restored');
 }else{
  mf485Invalidate('reapply theme');
  MF485.lastError='';
  mf484Sync();
  showToast('Reapplying your current theme');
 }
 mf485UpdateStatus();
}
function mf485SafeMode(){
 if(!window.confirm('Switch to the original Legacy theme? Your Custom profiles and Advanced settings will be kept.'))return;
 App.mf484SetMode('legacy');
 showToast('Original MediaFlow theme restored; custom profiles preserved');
 mf485UpdateStatus();
}
function mf485UpdateStatus(){
 const node=document.getElementById('mf485-state');
 if(!node)return;
 const s=mf485Status();
 node.innerHTML='<strong>'+escapeHtml(s.mode.toUpperCase())+' · '+escapeHtml(s.source)+'</strong>'+
  '<small>Living Themes: '+escapeHtml(s.atmosphere)+' · Last theme: '+escapeHtml(s.lastGoodSource||'none yet')+'</small>'+
  (s.lastError?'<small class="mf485-warning">'+escapeHtml(s.lastError)+'</small>':'')+
  '<small>Blocked outdated updates: '+s.blockedStale+' · Recovery actions: '+s.restored+'</small>';
}
function mf485MountHealth(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf485-health'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf485-health"><p>Visual Engine Health protects your current mode from outdated cover updates and keeps the last working palette available.</p>'+
  '<div id="mf485-state" class="mf485-status" aria-live="polite"></div>'+
  '<div class="mf485-actions">'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf485RestorePalette()">Restore / Reapply Palette</button>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf485SafeMode()">Return to Legacy</button>'+
  '</div><small>Recovery does not erase saved Custom themes, artwork sources or Library data.</small></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf485-visual-engine-health',title:'Visual Engine Health & Recovery',
  category:'appearance',subgroup:'Diagnostics',
  keywords:['visual','theme','legacy','recovery','conflicts','palette','animation'],
  nodes:[node]
 });
 mf485UpdateStatus();
}
Object.assign(App,{mf485RestorePalette,mf485SafeMode,mf485RefreshStatus:mf485UpdateStatus});
MediaFlowRuntime.registerPageEnhancer('settings',mf485MountHealth);
// A BFCache restore may show a stale theme after settings were restored in
// another tab. Reconcile from canonical settings without discarding profiles.
window.addEventListener('pageshow',()=>mf485Reconcile('page restored'));
window.addEventListener('focus',()=>mf485Reconcile('window focused'));
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible')mf485Reconcile('visibility restored');
});
// Changes to source controls should not override Custom, even when their old
// render handlers apply a static theme before scheduling a cover refresh.
try{mf485Reconcile('initialization');}catch(err){
 MF485.lastError='Visual engine initialization failed; legacy fallback available';
 console.warn('[MediaFlow v485] initialization',err);
}
window.MediaFlowV485=Object.freeze({version:485,status:mf485Status,
 reconcile:mf485Reconcile,safeMode:mf485SafeMode,restore:mf485RestorePalette});
MediaFlowRuntime.version=MF485_VERSION;
