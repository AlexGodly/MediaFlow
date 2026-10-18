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

/* v475 — PWA update/reload authentication continuity.
 * A Supabase auth-state callback must NEVER await Supabase queries; doing so
 * can deadlock GoTrue's auth lock and strand the app on an empty workspace.
 * Subscribe before getSession(), defer callbacks, serialize hydration per
 * account and keep the workspace guarded until its cloud row has loaded. */
const V475_AUTH={
  restoring:true,bootId:null,bootPromise:null,hydrated:false,bootGeneration:0,
  explicitLogout:false,error:null
};
function v475ShowSessionLoading(message='Restoring your MediaFlow account…'){
  const app=document.getElementById('app');
  if(app&&!app.querySelector('.sidebar')&&!app.querySelector('.auth-screen')){
    app.innerHTML='<div class="loader-wrap" role="status" aria-live="polite">'+escapeHtml(message)+'</div>';
  }
}
async function startAuthenticatedApp(){
  const uid=String(AUTH_USER?.id||'');
  if(!uid)return false;
  if(V475_AUTH.bootPromise&&V475_AUTH.bootId===uid)return V475_AUTH.bootPromise;
  if(V475_AUTH.hydrated&&V475_AUTH.bootId===uid)return true;
  // This is NOT permission to write empty account state. The v115 guard stays
  // active until the real user's Supabase snapshot is safely accepted.
  V115_STARTUP_GUARD=true;
  AUTH_READY=true;
  V475_AUTH.bootId=uid;
  V475_AUTH.hydrated=false;
  V475_AUTH.error=null;
  const generation=++V475_AUTH.bootGeneration;
  v475ShowSessionLoading('Loading your saved MediaFlow workspace…');
  const running=(async()=>{
    try{
      const result=await v115SafeBootstrap();
      if(generation!==V475_AUTH.bootGeneration||String(AUTH_USER?.id||'')!==uid)return false;
      V475_AUTH.hydrated=result===true;
      // false means the recovery/error guard owns the UI; do not render a
      // synthetic zero-title Library or trigger any cloud save.
      return result===true;
    }catch(error){
      if(generation!==V475_AUTH.bootGeneration)return false;
      V475_AUTH.error=String(error?.message||error);
      V115_STARTUP_GUARD=true;
      console.error('MediaFlow v475: account hydration failed',error);
      const app=document.getElementById('app');
      if(app)app.innerHTML='<div class="auth-screen"><div class="auth-card"><div class="auth-title">Could not load your saved MediaFlow account</div><div class="auth-sub">Your cloud data has not been replaced. Check your connection and retry.</div><button class="btn btn-primary btn-block" onclick="window.MediaFlowAuthContinuity.retry()">Retry loading my account</button></div></div>';
      return false;
    }
  })();
  V475_AUTH.bootPromise=running;
  try{return await running;}
  finally{if(V475_AUTH.bootPromise===running)V475_AUTH.bootPromise=null;}
}
function v475HandleAuthEvent(event,session){
  const next=session?.user||null;
  if(event==='SIGNED_OUT'){
    // Only an actual SIGNED_OUT event (not INITIAL_SESSION:null or a temporary
    // refresh delay) can close an already authenticated workspace.
    V475_AUTH.explicitLogout=true;
    ++V475_AUTH.bootGeneration;
    V475_AUTH.bootId=null;
    V475_AUTH.hydrated=false;
    V475_AUTH.bootPromise=null;
    V115_STARTUP_GUARD=true;
    AUTH_USER=null;
    AUTH_READY=false;
    renderAuthScreen('login','Your session ended. Sign in to restore your cloud data.');
    return;
  }
  if(!next?.id)return; // NEVER treat a transient INITIAL_SESSION:null as logout.
  if(V475_AUTH.explicitLogout&&event==='INITIAL_SESSION')return;
  V475_AUTH.explicitLogout=false;
  const changed=String(AUTH_USER?.id||'')!==String(next.id);
  if(changed){
    V115_STARTUP_GUARD=true;
    V475_AUTH.hydrated=false;
    V475_AUTH.bootId=null;
    ++V475_AUTH.bootGeneration;
    AUTH_READY=false;
  }
  AUTH_USER=next;
  if(V475_AUTH.bootId!==String(next.id))void startAuthenticatedApp();
}
async function v475RestoreSavedSession(){
  V475_AUTH.restoring=true;
  V475_AUTH.explicitLogout=false;
  v475ShowSessionLoading();
  // getSession() can initially be null while the PWA's refreshed app shell
  // and Supabase persisted session are being initialized. Do not show the
  // empty account or login screen during this recovery window.
  const intervals=[0,220,500,900,1450];
  let lastError=null;
  for(const delay of intervals){
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    if(AUTH_USER?.id||V475_AUTH.explicitLogout)break;
    try{
      const {data,error}=await supabase.auth.getSession();
      if(error)lastError=error;
      if(data?.session?.user?.id){
        v475HandleAuthEvent('SESSION_RESTORED',data.session);
        break;
      }
    }catch(err){lastError=err;}
  }
  V475_AUTH.restoring=false;
  if(AUTH_USER?.id)return startAuthenticatedApp();
  if(!V475_AUTH.explicitLogout){
    V115_STARTUP_GUARD=true;
    AUTH_READY=false;
    renderAuthScreen('login',lastError
      ?'Your saved session could not be restored yet. Retry refreshing the app, or sign in to access your existing cloud data.'
      :'Sign in to access your existing MediaFlow account. Your saved Library is still in your account.',
      !!lastError);
  }
  return false;
}
async function init(){
  if(!supabase){renderAuthScreen('login');return;}
  try{
    // Supabase invokes this callback while holding an internal authentication
    // lock. Schedule all cloud/bootstrap work *after* it releases that lock.
    const {data,error}=supabase.auth.onAuthStateChange((event,session)=>{
      setTimeout(()=>v475HandleAuthEvent(event,session),0);
    });
    if(error)throw error;
    await v475RestoreSavedSession();
  }catch(err){
    V475_AUTH.restoring=false;
    V115_STARTUP_GUARD=true;
    console.error('MediaFlow v475: auth initialization',err);
    renderAuthScreen('login','Could not restore your saved login. Your account data remains in the cloud. Please retry or sign in.',true);
  }
}
window.MediaFlowAuthContinuity={
  state:V475_AUTH,
  retry:async()=>{
    if(AUTH_USER?.id){V475_AUTH.hydrated=false;V475_AUTH.bootId=null;return startAuthenticatedApp();}
    return v475RestoreSavedSession();
  }
};
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
