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

/* MediaFlow v506 — verified authentication continuity.
 * Supabase callbacks run outside its auth lock; no event is allowed to turn
 * an unverified/refreshing account into an empty, writable workspace.
 * Only the explicit Logout button authorizes immediate logout UX.
 */
const V475_AUTH={
  restoring:false,restorePromise:null,bootId:null,bootPromise:null,
  hydrated:false,bootGeneration:0,explicitLogout:false,logoutRequested:false,
  error:null,lastEvent:'',lastCheckedAt:0
};
function v475ShowSessionLoading(message='Restoring your MediaFlow account…'){
  const app=document.getElementById('app');
  if(!app)return;
  // A previously rendered workspace must not remain interactive when its
  // Supabase session is unverified: edits would otherwise appear saved while
  // the cloud write guard is intentionally blocking uploads.
  if(app.querySelector('.mf506-auth-loading'))return;
  app.innerHTML='<div class="loader-wrap mf506-auth-loading" role="status" aria-live="polite">'+escapeHtml(message)+'</div>';
}
function v506PersistedSessionHint(){
  // This is ONLY a hint for which recovery screen to display, not proof of
  // authentication. Never parse or transmit stored auth credentials.
  try{
    const project=new URL(SUPABASE_URL).hostname.split('.')[0];
    return !!localStorage.getItem('sb-'+project+'-auth-token');
  }catch(_){return false;}
}
function v506SessionRecoveryScreen(message){
  V115_STARTUP_GUARD=true;
  AUTH_READY=false;
  const app=document.getElementById('app');
  if(!app)return;
  app.innerHTML='<div class="auth-screen mf506-recovery-screen"><div class="auth-card">'+
    '<div class="auth-brand"><div class="brand-mark"></div><div><div class="auth-brand-name">MediaFlow</div><div class="brand-sub">Account recovery</div></div></div>'+
    '<div class="auth-title">Your saved account is temporarily unavailable</div>'+
    '<div class="auth-sub">'+escapeHtml(message||'MediaFlow could not confirm your saved session yet. Your cloud Library has not been reset.')+'</div>'+
    '<div style="display:grid;gap:10px;margin-top:18px">'+
    '<button type="button" class="btn btn-primary btn-block" onclick="window.MediaFlowAuthContinuity.retry()">Retry restoring my account</button>'+
    '<button type="button" class="btn btn-block" onclick="window.MediaFlowAuthContinuity.showLogin()">Sign in instead</button></div>'+
    '<div class="auth-foot">No cloud data has been replaced. MediaFlow does not load a blank workspace while login or cloud recovery is unresolved.</div></div></div>';
}
async function startAuthenticatedApp(){
  const uid=String(AUTH_USER?.id||'');
  if(!uid)return false;
  if(V475_AUTH.bootPromise&&V475_AUTH.bootId===uid)return V475_AUTH.bootPromise;
  if(V475_AUTH.hydrated&&V475_AUTH.bootId===uid)return true;
  V115_STARTUP_GUARD=true;
  AUTH_READY=true; // The startup guard still blocks writes until cloud data is loaded.
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
      if(result!==true){V115_STARTUP_GUARD=true;AUTH_READY=false;}
      return result===true;
    }catch(error){
      if(generation!==V475_AUTH.bootGeneration)return false;
      V475_AUTH.error=String(error?.message||error);
      V115_STARTUP_GUARD=true;
      AUTH_READY=false;
      console.error('MediaFlow v506: account hydration failed',error);
      v506SessionRecoveryScreen('Your login was found but the saved workspace could not be loaded. Check your connection and retry.');
      return false;
    }
  })();
  V475_AUTH.bootPromise=running;
  try{return await running;}
  finally{if(V475_AUTH.bootPromise===running)V475_AUTH.bootPromise=null;}
}
function v506CompleteExplicitLogout(){
  V475_AUTH.explicitLogout=true;
  V475_AUTH.logoutRequested=false;
  V475_AUTH.restoring=false;
  ++V475_AUTH.bootGeneration;
  V475_AUTH.bootId=null;
  V475_AUTH.hydrated=false;
  V475_AUTH.bootPromise=null;
  V115_STARTUP_GUARD=true;
  AUTH_USER=null;
  AUTH_READY=false;
  renderAuthScreen('login','You have been logged out.');
}
function v475HandleAuthEvent(event,session){
  V475_AUTH.lastEvent=String(event||'');
  if(event==='SIGNED_OUT'){
    if(V475_AUTH.logoutRequested){v506CompleteExplicitLogout();return;}
    if(V475_AUTH.explicitLogout)return; // Ignore the delayed event from a completed user logout.
    // Supabase can emit SIGNED_OUT during refresh/restore. During initial
    // bootstrap it is not evidence that the user clicked Logout.
    if(V475_AUTH.restoring)return;
    // Revalidate from Supabase before changing the logged-in UI. The result
    // can be a recovered user, a verified logout, or a guarded retry screen.
    ++V475_AUTH.bootGeneration;
    V475_AUTH.bootId=null;
    V475_AUTH.hydrated=false;
    V475_AUTH.bootPromise=null;
    V115_STARTUP_GUARD=true;
    AUTH_USER=null;
    AUTH_READY=false;
    v475ShowSessionLoading('Verifying your saved MediaFlow login…');
    void v475RestoreSavedSession();
    return;
  }
  const next=session?.user||null;
  if(!next?.id)return; // INITIAL_SESSION:null never creates an empty account.
  if(V475_AUTH.logoutRequested||V475_AUTH.explicitLogout&&event==='INITIAL_SESSION')return;
  V475_AUTH.explicitLogout=false;
  const uid=String(next.id);
  const changed=String(AUTH_USER?.id||'')!==uid;
  if(changed){
    V115_STARTUP_GUARD=true;
    V475_AUTH.hydrated=false;
    V475_AUTH.bootId=null;
    ++V475_AUTH.bootGeneration;
    AUTH_READY=false;
  }
  AUTH_USER=next;
  // While restore probes are still active, they own startup ordering.
  if(!V475_AUTH.restoring&&V475_AUTH.bootId!==uid)void startAuthenticatedApp();
}
async function v475RestoreSavedSession(){
  if(V475_AUTH.restorePromise)return V475_AUTH.restorePromise;
  const running=(async()=>{
    V475_AUTH.restoring=true;
    V475_AUTH.explicitLogout=false;
    V115_STARTUP_GUARD=true;
    v475ShowSessionLoading('Restoring your saved MediaFlow account…');
    // A cold PWA reload can temporarily return null while GoTrue refreshes.
    // Allow slow devices/network time to recover, without an unbounded wait.
    const intervals=[0,250,600,1100,1900,3000,4500];
    let lastError=null,confirmed=null;
    try{
      for(const delay of intervals){
        if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
        if(V475_AUTH.logoutRequested||V475_AUTH.explicitLogout)return false;
        if(AUTH_USER?.id){confirmed=AUTH_USER;break;}
        try{
          const {data,error}=await supabase.auth.getSession();
          V475_AUTH.lastCheckedAt=Date.now();
          if(error){lastError=error;continue;}
          if(data?.session?.user?.id){
            confirmed=data.session.user;
            v475HandleAuthEvent('SESSION_RESTORED',data.session);
            break;
          }
        }catch(err){lastError=err;}
      }
      // Last chance for a delayed onAuthStateChange callback.
      if(!confirmed&&AUTH_USER?.id)confirmed=AUTH_USER;
      if(confirmed?.id){
        AUTH_USER=confirmed;
        return await startAuthenticatedApp();
      }
      V115_STARTUP_GUARD=true;
      AUTH_READY=false;
      // Inconclusive storage/connection restores require explicit retry,
      // not a blank default account and not a forced sign-out.
      if(lastError||v506PersistedSessionHint()){
        V475_AUTH.error=String(lastError?.message||'Saved session could not be verified');
        v506SessionRecoveryScreen(lastError
          ?'Your session could not be checked because of an authentication or network error. Please retry.'
          :'Your previously saved login is still being verified. Please retry or sign in if the session has expired.');
      }else{
        renderAuthScreen('login','Sign in to access your existing MediaFlow account. Your Library is kept in your cloud account.');
      }
      return false;
    }finally{
      V475_AUTH.restoring=false;
    }
  })();
  V475_AUTH.restorePromise=running;
  try{return await running;}
  finally{if(V475_AUTH.restorePromise===running)V475_AUTH.restorePromise=null;}
}
async function init(){
  if(!supabase){renderAuthScreen('login');return;}
  try{
    // Never await database queries from a GoTrue auth callback.
    const {data,error}=supabase.auth.onAuthStateChange((event,session)=>{
      setTimeout(()=>v475HandleAuthEvent(event,session),0);
    });
    if(error)throw error;
    await v475RestoreSavedSession();
  }catch(err){
    V475_AUTH.restoring=false;
    V115_STARTUP_GUARD=true;
    AUTH_READY=false;
    console.error('MediaFlow v506: auth initialization',err);
    v506SessionRecoveryScreen('MediaFlow could not initialize your saved session. Try again without refreshing repeatedly.');
  }
}
window.MediaFlowAuthContinuity={
  state:V475_AUTH,
  retry:async()=>{
    if(V475_AUTH.restorePromise)return V475_AUTH.restorePromise;
    if(AUTH_USER?.id){
      V475_AUTH.hydrated=false;
      V475_AUTH.bootId=null;
      return startAuthenticatedApp();
    }
    return v475RestoreSavedSession();
  },
  showLogin:()=>{
    V115_STARTUP_GUARD=true;
    AUTH_READY=false;
    renderAuthScreen('login','Sign in to reconnect your existing cloud account.');
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
