/* ============================================================
   MediaFlow v297 — Auth Experience Refresh & Designed Deletion Confirm
   ============================================================ */
const V297_RUNTIME_VERSION=297;
let v297AuthDraftEmail='';
function v297AuthIcon(kind){
  const icons={
    login:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>',
    signup:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M17 11h6"/></svg>',
    create:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M17 11h6"/></svg>',
    reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a9 9 0 1 1 3.5 7.1"/><path d="M3 5v6h6"/><path d="M12 8v5l3 2"/></svg>',
    email:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    password:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/><circle cx="12" cy="16" r="1"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path d="M9.9 5.1A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a21.8 21.8 0 0 1-5.1 5.9"/><path d="M6.7 6.7A21.6 21.6 0 0 0 1 12s4 7 11 7a10.7 10.7 0 0 0 2.7-.3"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    delete:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>',
    spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3Z"/><path d="M5 18l.8 1.8L7.5 21l-1.7.5L5 23l-.8-1.5L2.5 21l1.7-.2L5 18Z"/><path d="M19 15l1 2.5L22.5 19 20 20l-1 2.5L18 20l-2.5-1.0 2.5-1.5L19 15Z"/></svg>',
    security:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    sync:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.4L3 16"/><path d="M8 16H3v5"/></svg>'
  };
  return icons[kind]||icons.spark;
}
function v297AuthFeature(icon,title,copy){
  return `<div class="v297-auth-feature"><span class="v297-auth-feature-icon">${v297AuthIcon(icon)}</span><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></div></div>`;
}
function v297TransientModalFrame(inner){
  return `<div id="v297-transient-modal" class="v297-modal-backdrop" onclick="window.MediaFlowAuth.backdropClose(event)"><div class="v297-modal-card" role="dialog" aria-modal="true">${inner}</div></div>`;
}
function v297RemoveTransientModal(){
  const node=document.getElementById('v297-transient-modal');
  if(node) node.remove();
  document.body.classList.remove('v297-modal-open');
}
function v297InjectTransientModal(inner){
  v297RemoveTransientModal();
  document.body.insertAdjacentHTML('beforeend',v297TransientModalFrame(inner));
  document.body.classList.add('v297-modal-open');
  const focus=document.querySelector('#v297-transient-modal input, #v297-transient-modal button:not([disabled])');
  if(focus) setTimeout(()=>{try{focus.focus(); if(focus.select)focus.select();}catch(_){ }},20);
}
function v297EnhanceAuthInputs(){
  const email=document.getElementById('auth-email');
  if(email && v297AuthDraftEmail && !email.value) email.value=v297AuthDraftEmail;
}
renderAuthScreen=function(mode='login',message='',isError=false){
  AUTH_MODE=mode;
  const app=document.getElementById('app');
  if(!app)return;
  const isSignup=mode==='signup';
  const title=isSignup?'Create your MediaFlow account':'Welcome back to MediaFlow';
  const desc=isSignup?'Create an account and keep your MediaFlow library, history, settings and progress synced everywhere.':'Log in to continue to your personal MediaFlow workspace and pick up where you left off.';
  const heroTitle=isSignup?'Everything you track, beautifully organized.':'Return to your library, sessions, and synced progress.';
  const heroCopy=isSignup?'Build your MediaFlow account once, then keep your anime, TV, movies, manga, books, history, and rotation system synced everywhere.':'Your library, logging workflow, categories, collections, and progress stay protected in your private cloud row with MediaFlow’s account system.';
  const setupBlock=!SUPABASE_CONFIGURED?`<div class="auth-error">Cloud accounts need setup first.<div class="setup-code" style="margin-top:10px">SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'\nSUPABASE_PUBLISHABLE_KEY = 'sb_publishable_...'</div></div>`:'';
  app.innerHTML=`<div class="auth-screen v297-auth-screen">
    <div class="v297-auth-layout">
      <section class="auth-card v297-auth-card">
        <div class="v297-auth-card-glow"></div>
        <div class="auth-brand v297-auth-brand">
          <div class="brand-mark"></div>
          <div>
            <div class="auth-brand-name">MediaFlow</div>
            <div class="brand-sub">Media rotation, your way.</div>
          </div>
        </div>
        <div class="v297-auth-kicker">${isSignup?'START YOUR CLOUD WORKSPACE':'SECURE SIGN IN'}</div>
        <div class="auth-title">${title}</div>
        <div class="auth-sub">${desc}</div>
        <div class="auth-tabs v297-auth-tabs" role="tablist" aria-label="Authentication mode">
          <button type="button" class="auth-tab ${mode==='login'?'active':''}" onclick="window.MediaFlowAuth.show('login')"><span class="v297-auth-tab-icon">${v297AuthIcon('login')}</span><span>Log in</span></button>
          <button type="button" class="auth-tab ${mode==='signup'?'active':''}" onclick="window.MediaFlowAuth.show('signup')"><span class="v297-auth-tab-icon">${v297AuthIcon('signup')}</span><span>Sign up</span></button>
        </div>
        ${message?`<div class="${isError?'auth-error':'auth-success'}">${escapeHtml(message)}</div>`:''}
        ${setupBlock}
        <form class="v297-auth-form" onsubmit="return window.MediaFlowAuth.submit(event)">
          <div class="field">
            <label class="field-label">Email</label>
            <div class="v297-auth-input-wrap">
              <span class="v297-auth-leading-icon">${v297AuthIcon('email')}</span>
              <input id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com">
            </div>
          </div>
          <div class="field">
            <label class="field-label">Password</label>
            <div class="v297-auth-input-wrap">
              <span class="v297-auth-leading-icon">${v297AuthIcon('password')}</span>
              <input id="auth-password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" minlength="6" required placeholder="At least 6 characters">
              <button type="button" class="v297-password-toggle" aria-label="Show password" onclick="window.MediaFlowAuth.togglePassword('auth-password',this)">${v297AuthIcon('eye')}</button>
            </div>
          </div>
          ${isSignup?`<div class="field">
            <label class="field-label">Confirm password</label>
            <div class="v297-auth-input-wrap">
              <span class="v297-auth-leading-icon">${v297AuthIcon('password')}</span>
              <input id="auth-confirm" type="password" autocomplete="new-password" minlength="6" required placeholder="Repeat your password">
              <button type="button" class="v297-password-toggle" aria-label="Show password" onclick="window.MediaFlowAuth.togglePassword('auth-confirm',this)">${v297AuthIcon('eye')}</button>
            </div>
          </div>`:''}
          <button class="btn btn-primary btn-block v297-auth-submit" type="submit" ${!SUPABASE_CONFIGURED?'disabled':''}><span class="v297-btn-icon">${v297AuthIcon(isSignup?'create':'login')}</span><span>${isSignup?'Create account':'Log in'}</span></button>
        </form>
        ${mode==='login'?`<button class="btn btn-ghost btn-block v297-auth-forgot" type="button" onclick="window.MediaFlowAuth.reset()"><span class="v297-btn-icon">${v297AuthIcon('reset')}</span><span>Forgot password?</span></button>`:''}
        <div class="auth-foot">Your account uses Supabase Auth. MediaFlow stores your app state in a private cloud row protected by Row Level Security.</div>
      </section>
      <aside class="v297-auth-hero" aria-hidden="true">
        <div class="v297-auth-hero-overlay"></div>
        <div class="v297-auth-hero-inner">
          <div class="v297-auth-hero-kicker">SYNCED EVERYWHERE</div>
          <h2 class="v297-auth-hero-title">${heroTitle}</h2>
          <p class="v297-auth-hero-copy">${heroCopy}</p>
          <div class="v297-auth-hero-grid">
            ${v297AuthFeature('sync','Private cloud sync','Keep your workspace ready across sessions and devices.')}
            ${v297AuthFeature('security','Protected account state','Your MediaFlow cloud row stays tied to your account.')}
            ${v297AuthFeature('spark','Polished workflow','Jump into Dashboard, Library, Collections, and logging faster.')}
          </div>
        </div>
      </aside>
    </div>
  </div>`;
  v297EnhanceAuthInputs();
};
authSubmit=async function(e){
  e.preventDefault();
  const form=e.currentTarget;
  const email=document.getElementById('auth-email')?.value.trim()||'';
  const password=document.getElementById('auth-password')?.value||'';
  v297AuthDraftEmail=email;
  if(AUTH_MODE==='signup'&&password!==document.getElementById('auth-confirm')?.value){renderAuthScreen('signup','Passwords do not match.',true);return false;}
  const submit=form?.querySelector('.v297-auth-submit');
  if(submit){submit.disabled=true;submit.classList.add('is-loading');submit.innerHTML=`<span class="v297-btn-icon">${v297AuthIcon(AUTH_MODE==='signup'?'create':'login')}</span><span>${AUTH_MODE==='signup'?'Creating account…':'Logging in…'}</span>`;}
  try{
    if(AUTH_MODE==='signup'){
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:(location.protocol==='http:'||location.protocol==='https:')?location.href:undefined}});
      if(error)throw error;
      if(data.session){AUTH_USER=data.user;await startAuthenticatedApp();}
      else {v297AuthDraftEmail=email;renderAuthScreen('login','Account created. Check your email to confirm your account, then log in.');}
    }else{
      const {data,error}=await supabase.auth.signInWithPassword({email,password});
      if(error)throw error;
      AUTH_USER=data.user;await startAuthenticatedApp();
    }
  }catch(err){renderAuthScreen(AUTH_MODE,friendlyAuthError(err),true);} 
  return false;
};
function v297ResetModalHtml(initialEmail=''){
  return `<div class="v297-modal-head"><div class="v297-modal-icon">${v297AuthIcon('reset')}</div><div><div class="v297-modal-kicker">ACCOUNT RECOVERY</div><div class="v297-modal-title">Reset your password</div></div><button type="button" class="v297-modal-close" onclick="window.MediaFlowAuth.closeTransientModal()">${v297AuthIcon('close')}</button></div><div class="v297-modal-copy">Enter the email for your MediaFlow account and we’ll send you a password reset link.</div><form onsubmit="return window.MediaFlowAuth.submitReset(event)"><div class="field" style="margin-top:16px"><label class="field-label">Email</label><div class="v297-auth-input-wrap"><span class="v297-auth-leading-icon">${v297AuthIcon('email')}</span><input id="v297-reset-email" type="email" required placeholder="you@example.com" value="${escapeHtml(initialEmail)}"></div></div><div id="v297-modal-error" class="auth-error" style="display:none;margin-top:14px"></div><div class="v297-modal-actions"><button type="button" class="btn btn-ghost" onclick="window.MediaFlowAuth.closeTransientModal()">Cancel</button><button type="submit" class="btn btn-primary" id="v297-reset-submit"><span class="v297-btn-icon">${v297AuthIcon('reset')}</span><span>Send reset email</span></button></div></form>`;
}
resetPassword=function(){
  const email=document.getElementById('auth-email')?.value.trim()||v297AuthDraftEmail||'';
  v297InjectTransientModal(v297ResetModalHtml(email));
};
window.MediaFlowAuth.backdropClose=function(event){if(event?.target?.id==='v297-transient-modal')v297RemoveTransientModal();};
window.MediaFlowAuth.closeTransientModal=v297RemoveTransientModal;
window.MediaFlowAuth.togglePassword=function(id,button){
  const input=document.getElementById(id);
  if(!input||!button)return;
  const next=input.type==='password'?'text':'password';
  input.type=next;
  button.innerHTML=v297AuthIcon(next==='password'?'eye':'eyeOff');
  button.setAttribute('aria-label',next==='password'?'Show password':'Hide password');
};
window.MediaFlowAuth.submitReset=async function(event){
  event.preventDefault();
  const input=document.getElementById('v297-reset-email');
  const email=input?.value.trim()||'';
  const errorBox=document.getElementById('v297-modal-error');
  const btn=document.getElementById('v297-reset-submit');
  if(errorBox){errorBox.style.display='none';errorBox.textContent='';}
  if(btn){btn.disabled=true;btn.innerHTML=`<span class="v297-btn-icon">${v297AuthIcon('reset')}</span><span>Sending…</span>`;}
  try{
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:(location.protocol==='http:'||location.protocol==='https:')?location.href:undefined});
    if(error)throw error;
    v297RemoveTransientModal();
    v297AuthDraftEmail=email;
    renderAuthScreen('login','Password reset email sent. Check your inbox.');
  }catch(err){
    const text=friendlyAuthError(err);
    if(errorBox){errorBox.textContent=text;errorBox.style.display='block';}
    if(btn){btn.disabled=false;btn.innerHTML=`<span class="v297-btn-icon">${v297AuthIcon('reset')}</span><span>Send reset email</span>`;}
  }
  return false;
};
function v297DeleteModalHtml(){
  const email=escapeHtml(AUTH_USER?.email||'your account');
  return `<div class="v297-modal-head v297-modal-head-danger"><div class="v297-modal-icon v297-modal-icon-danger">${v297AuthIcon('warning')}</div><div><div class="v297-modal-kicker">PERMANENT ACTION</div><div class="v297-modal-title">Delete account</div></div><button type="button" class="v297-modal-close" onclick="window.MediaFlowAuth.closeTransientModal()">${v297AuthIcon('close')}</button></div><div class="v297-modal-copy">You are about to permanently delete <b>${email}</b>. This removes your Supabase account and your MediaFlow cloud data.</div><div class="v297-danger-list"><div>• Your MediaFlow cloud workspace will be removed.</div><div>• Your account sign-in will stop working immediately.</div><div>• This action cannot be undone.</div></div><div class="field" style="margin-top:16px"><label class="field-label">Type DELETE to confirm</label><div class="v297-auth-input-wrap"><span class="v297-auth-leading-icon">${v297AuthIcon('delete')}</span><input id="v297-delete-confirm-input" type="text" autocomplete="off" placeholder="DELETE" oninput="window.MediaFlowProfile.updateDeleteConfirmState(this.value)"></div></div><div id="v297-modal-error" class="auth-error" style="display:none;margin-top:14px"></div><div class="v297-modal-actions"><button type="button" class="btn btn-ghost" onclick="window.MediaFlowAuth.closeTransientModal()">Cancel</button><button type="button" class="btn btn-danger" id="v297-delete-submit" disabled onclick="window.MediaFlowProfile.performDeleteAccount()"><span class="v297-btn-icon">${v297AuthIcon('delete')}</span><span>Delete account permanently</span></button></div>`;
}
deleteCloudAccount=function(){
  if(!AUTH_USER||!supabase){alert('No cloud account is currently signed in.');return;}
  v297InjectTransientModal(v297DeleteModalHtml());
};
window.MediaFlowProfile.updateDeleteConfirmState=function(value){
  const btn=document.getElementById('v297-delete-submit');
  if(btn) btn.disabled=String(value||'').trim()!=='DELETE';
};
window.MediaFlowProfile.performDeleteAccount=async function(){
  const btn=document.getElementById('v297-delete-submit');
  const errorBox=document.getElementById('v297-modal-error');
  if(errorBox){errorBox.style.display='none';errorBox.textContent='';}
  if(btn){btn.disabled=true;btn.innerHTML=`<span class="v297-btn-icon">${v297AuthIcon('delete')}</span><span>Deleting account…</span>`;}
  try{
    const {error}=await supabase.rpc('delete_my_account');
    if(error)throw error;
    AUTH_USER=null; AUTH_READY=false;
    try{localStorage.removeItem(STATE_KEY);}catch(_){ }
    v297RemoveTransientModal();
    v297AuthDraftEmail='';
    renderAuthScreen('login','Your account and MediaFlow cloud data were deleted.');
  }catch(e){
    console.error(e);
    const text='Account deletion was not completed. The delete_my_account RPC may be missing or the request failed.';
    if(errorBox){errorBox.textContent=text;errorBox.style.display='block';}
    if(btn){btn.disabled=false;btn.innerHTML=`<span class="v297-btn-icon">${v297AuthIcon('delete')}</span><span>Delete account permanently</span>`;}
  }
};
window.MediaFlowAuth.reset=resetPassword;
window.MediaFlowAuth.show=renderAuthScreen;
window.MediaFlowAuth.submit=authSubmit;
if(App) App.deleteCloudAccount=deleteCloudAccount;
window.MediaFlowV297={version:V297_RUNTIME_VERSION,focus:'Premium auth experience redesign, password visibility toggles, semantic auth icons, designed account deletion modal'};
MediaFlowRuntime.version=V297_RUNTIME_VERSION;



