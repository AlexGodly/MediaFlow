/* ============================================================

   RENDER LOOP + INIT

   ============================================================ */

function render(){

  if(!document.querySelector('.sidebar')) { renderShell(); bindSidebarResizer(); autoFitSidebarToProfile(); return; }

  bindSidebarResizer();

  // update sidebar active states + streak without full rebuild for smoothness

  document.querySelectorAll('.nav-item').forEach(el=>{
    const viewId=String(el.dataset?.view||'');
    el.classList.toggle('active',viewId===String(S.view||''));
  });

  const mobileBar=document.querySelector('.mobile-tabbar'); if(mobileBar) mobileBar.innerHTML=renderMobileTabs();
  const accountName=document.querySelector('.account-menu-email');
  if(accountName)accountName.textContent=getDisplayName();
  const accountAvatarBtn=document.querySelector('.account-menu .account-avatar-btn');
  if(accountAvatarBtn)accountAvatarBtn.innerHTML=renderAccountAvatar();
  autoFitSidebarToProfile();

  renderView();

  renderModal();

}

async function startAuthenticatedApp(){AUTH_READY=true;await v115SafeBootstrap();}
async function init(){if(!supabase){renderAuthScreen('login');return;}try{const {data}=await supabase.auth.getSession();AUTH_USER=data?.session?.user||null;if(AUTH_USER)await startAuthenticatedApp();else renderAuthScreen('login');supabase.auth.onAuthStateChange(async(_event,session)=>{const next=session?.user||null;if(next&&!AUTH_READY){AUTH_USER=next;await startAuthenticatedApp();}else if(!next&&AUTH_READY){AUTH_USER=null;AUTH_READY=false;renderAuthScreen('login');}});}catch(err){renderAuthScreen('login',friendlyAuthError(err),true);}}
init();

// Progressive Web App bootstrap. v244+ owns the richer install/update lifecycle,
// while the fallback registration keeps older/local modular builds safe.
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    if(window.MediaFlowPWA?.register){
      window.MediaFlowPWA.register();
    }else{
      navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{ /* hosted PWA support is optional */ });
    }
  });
}

window.addEventListener('beforeunload', function(e){

  if(saveQueue){ /* saves are queued+awaited on every action already; this is a last-resort nudge */ }

});


/* MediaFlow v107: Full Style Themes library expanded to the complete service set. */
