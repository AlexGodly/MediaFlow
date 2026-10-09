/* MediaFlow v308 — Community theme parity.
 * Signed-out guests always use the original v302 Community design.
 * Signed-in visitors inherit current Workspace theme/appearance variables
 * including full-style, custom and cover-driven colors. No private settings
 * or theme preferences are published to other users.
 */
function mf308SyncCommunityTheme(){
  const signedIn=!!AUTH_USER;
  if(!document.body)return;
  document.body.classList.toggle('mf308-user-theme-active',signedIn);
  if(document.body.classList.contains('mf302-public-active')){
    document.body.classList.toggle('mf302-signed-in',signedIn);
  }else if(!signedIn){
    document.body.classList.remove('mf302-signed-in');
  }
  const portal=document.getElementById('mf302-root');
  if(portal){
    portal.dataset.mf308Theme=signedIn?'workspace':'guest';
    if(signedIn){
      portal.dataset.mf308ThemeId=String(S.settings?.theme||document.documentElement.dataset.theme||'dark');
    }else delete portal.dataset.mf308ThemeId;
  }
}
const mf308PreviousShowPortal=mfShowPortal;
mfShowPortal=function(){
  const out=mf308PreviousShowPortal.apply(this,arguments);
  mf308SyncCommunityTheme();
  return out;
};
const mf308PreviousHidePortal=mfHidePortal;
mfHidePortal=function(){
  const out=mf308PreviousHidePortal.apply(this,arguments);
  mf308SyncCommunityTheme();
  return out;
};
// The theme engine updates documentElement variables in place. The Community
// stylesheet uses those live variables, so no destructive page re-render is
// required when switching themes or cover-driven dynamic accents.
const mf308PreviousApplyTheme=applyTheme;
applyTheme=function(){
  const out=mf308PreviousApplyTheme.apply(this,arguments);
  mf308SyncCommunityTheme();
  return out;
};
// Cloud hydration is asynchronous. Re-check auth AFTER it finishes to ensure
// the public portal/chat use the actual signed-in session rather than a stale
// guest state captured at page creation.
const mf308PreviousStartAuthenticatedApp=startAuthenticatedApp;
startAuthenticatedApp=async function(){
  try{return await mf308PreviousStartAuthenticatedApp.apply(this,arguments);}
  finally{mf308SyncCommunityTheme();}
};
const mf308PreviousRenderAuthScreen=renderAuthScreen;
renderAuthScreen=function(){
  const out=mf308PreviousRenderAuthScreen.apply(this,arguments);
  mf308SyncCommunityTheme();
  return out;
};
// Public APIs exposed for non-destructive smoke tests and startup diagnostics.
window.MediaFlowCommunityTheme={version:308,sync:mf308SyncCommunityTheme,
 getState:()=>({mode:AUTH_USER?'workspace':'guest',active:!!document.body?.classList.contains('mf302-public-active'),theme:AUTH_USER?String(S.settings?.theme||'dark'):null})};
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{}, {version:308,guestThemeUnchanged:true,signedInThemeFollowsWorkspace:true});
