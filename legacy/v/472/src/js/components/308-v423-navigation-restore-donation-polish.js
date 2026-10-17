/* MediaFlow v423 — navigation first-paint reliability, avatar, and voluntary support.
   Additive presentation only; no database migrations or source-data changes. */
const MF423_VERSION=423;
const MF423_MODES=new Set(['sidebar','mini','top','bottom']);
const MF423_DONATE_URL='https://ko-fi.com/alexgodly';
let mf423Switching=false;
function mf423PreferenceKey(){return 'mediaflow-v423-nav-style:'+String(AUTH_USER?.id||'local');}
function mf423LocalStyle(){
  try{const value=localStorage.getItem(mf423PreferenceKey());return MF423_MODES.has(value)?value:null;}
  catch(_){return null;}
}
const mf423OriginalMode=mf421Mode;
mf421Mode=function(){
  const saved=!mf423Switching?mf423LocalStyle():null;
  return saved||mf423OriginalMode();
};
const mf423OriginalSetStyle=mf421SetNavStyle;
mf421SetNavStyle=function(style){
  if(!MF423_MODES.has(style))return;
  mf423Switching=true;
  try{return mf423OriginalSetStyle.apply(this,arguments);}
  finally{
    mf423Switching=false;
    try{localStorage.setItem(mf423PreferenceKey(),style);}catch(_){ }
    document.documentElement.dataset.mf423Navigation=style;
    mf421Apply(true);
  }
};
App.mf421SetNavStyle=mf421SetNavStyle;
function mf423RestoreNavigationPreference(){
  const mode=mf423LocalStyle();
  if(mode){
    S.settings=S.settings||{};
    S.settings.navDockStyle=mode;
    S.settings.sidebarCollapsed=mode==='mini';
  }
  document.documentElement.dataset.mf423Navigation=mf421Mode();
}
const mf423OldApply=mf421Apply;
mf421Apply=function(force){
  mf423RestoreNavigationPreference();
  const result=mf423OldApply.apply(this,arguments);
  mf423CleanNavigation();
  return result;
};

/* v422's extra decorative floating logo no longer belongs to either dock. */
const mf423OldEnhanceDock=mf422EnhanceDock;
mf422EnhanceDock=function(){
  mf423OldEnhanceDock.apply(this,arguments);
  mf423CleanNavigation();
};
function mf423CleanSelectionCards(){
  document.querySelectorAll('.mf422-nav-choice').forEach(button=>{
    const allowed=new Set(['mf422-nav-symbol']);
    [...button.children].forEach(child=>{
      if(child.matches('svg,i,[data-lucide],.lucide,.iconify')||
         (child.tagName!=='SPAN'&&child.tagName!=='SMALL')||
         (child.tagName==='SPAN'&&child.classList.length>0&&!allowed.has(child.className))){
        child.remove();
      }
    });
    button.querySelectorAll(':scope > span > svg,:scope > span > i').forEach(extra=>extra.remove());
  });
}
function mf423UpdateAvatar(button){
  if(!button)return;
  // v432: the default circled arrow was actually attached to the ACCOUNT
  // button when its image replaced the original profile SVG. Earlier fixes
  // only cleaned its sibling (the Level/Streak control).
  button.querySelectorAll(':scope > .v225-btn-icon').forEach(icon=>icon.remove());
  button.classList.remove('v225-icon-button');
  button.dataset.v225Iconified='1';
  delete button.dataset.v226SemanticIcon;
  const saved=String(getAvatarUrl()||'').trim();
  const imageUrl=/^https?:\/\//i.test(saved)?saved:'';
  const child=button.firstElementChild;
  const oneChild=button.children.length===1;
  if(button.dataset.mf423Avatar===imageUrl&&oneChild&&
      (imageUrl?child?.matches('img.mf423-dock-avatar'):!child?.classList?.contains('v225-btn-icon')))return;
  button.dataset.mf423Avatar=imageUrl;
  button.replaceChildren();
  if(!imageUrl){button.innerHTML=ICONS.profile||'♙';return;}
  const img=document.createElement('img');
  img.className='mf423-dock-avatar';img.alt='';img.src=imageUrl;
  img.referrerPolicy='no-referrer';img.decoding='async';
  img.addEventListener('error',()=>{
    if(img.isConnected){button.dataset.mf423Avatar='';button.innerHTML=ICONS.profile||'♙';}
  },{once:true});
  button.appendChild(img);
}
function mf423CleanLevelBadge(progress){
  if(!progress)return;
  const badges=[...progress.querySelectorAll(':scope > .mf422-level-badge,:scope > .mf422-streak-badge')];
  if(badges.length===2){
    [...progress.children].forEach(el=>{if(!badges.includes(el))el.remove();});
  }
  progress.querySelectorAll('svg,i,[data-lucide],.lucide').forEach(icon=>icon.remove());
  progress.removeAttribute('data-icon');
  progress.setAttribute('onclick','App.mf422ToggleProgress()');
  progress.setAttribute('aria-label','Show level and streak details');
}
function mf423CleanNavigation(){
  document.querySelectorAll('.mf422-glowing-brand').forEach(el=>el.remove());
  mf423CleanSelectionCards();
  const bar=document.querySelector('.mf421-dock');
  if(!bar)return;
  mf423CleanLevelBadge(bar.querySelector('.mf421-dock-progress'));
  mf423UpdateAvatar(bar.querySelector('.mf421-dock-account'));
}
/* The shell and Settings Center must settle on their saved style on the first render,
   rather than after an arbitrary menu interaction. */
const mf423OldShell=renderShell;
renderShell=function(){
  mf423RestoreNavigationPreference();
  const result=mf423OldShell.apply(this,arguments);
  mf421Apply(true);
  return result;
};
const mf423OldRender=render;
render=function(){
  mf423RestoreNavigationPreference();
  const result=mf423OldRender.apply(this,arguments);
  mf421Apply(true);
  return result;
};
/* Keep preference in Settings Presets and cloud snapshots already supported by S.settings.
   Local override prevents a stale cloud default from flashing during initial hydration. */
const mf423OldApplyState=v46ApplyState;
v46ApplyState=function(){
  const output=mf423OldApplyState.apply(this,arguments);
  mf423RestoreNavigationPreference();
  return output;
};

/* Render a premium, readable donation feature without false urgency, simulated
   supporters, paywalled promises, or unrelated external app destinations. */
const mf423OldRenderAbout=renderAbout;
renderAbout=function(){
  const html=String(mf423OldRenderAbout.apply(this,arguments)||'');
  const root=document.createElement('div');root.innerHTML=html;
  const about=root.querySelector('.mf383-about');
  if(!about)return html;
  for(const link of root.querySelectorAll('a[href]')){
    const label=String(link.textContent||'').trim();
    if(!/^Explore other apps|^Alex Godly Apps|^AlexGodly Apps/i.test(label))continue;
    link.href=MF423_DONATE_URL;
    link.target='_blank';link.rel='noopener noreferrer';
    link.classList.add('mf423-donate-replacement');
    link.innerHTML='<span aria-hidden="true">♥</span> Donate on Ko-fi <span aria-hidden="true">↗</span>';
    link.setAttribute('aria-label','Support MediaFlow on Ko-fi (opens in new tab)');
  }
  const section=about.querySelector('.mf422-donate-section');
  if(section){
    section.classList.add('mf423-support-hero');
    section.innerHTML=`<div class="mf423-support-content"><div class="mf423-support-eyebrow"><span class="mf423-support-spark" aria-hidden="true">✦</span> INDEPENDENTLY BUILT · COMMUNITY SUPPORTED</div><h2>Help shape what<br><em>MediaFlow becomes.</em></h2><p class="mf423-support-lede">MediaFlow is built and maintained independently by Alex Godly. If it makes organizing the things you love a little better, you can help keep it growing.</p><div class="mf423-support-benefits"><span>More possibilities</span><span>Hosting &amp; storage</span><span>Ongoing improvements</span></div><p class="mf423-support-credit">Thank you for being part of MediaFlow, whether you donate or simply enjoy using it.</p></div><div class="mf423-support-action"><div class="mf423-support-emblem" aria-hidden="true"><span>♥</span></div><strong>Support the next chapter</strong><p>Your contribution helps with resources and continued development.</p><a class="mf423-support-cta" href="${MF423_DONATE_URL}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">♥</span> Support on Ko-fi <span aria-hidden="true">↗</span></a><small>Completely optional. Existing features stay available to everyone.</small><span class="mf423-support-signer">Made with care by Alex Godly</span></div>`;
  }
  return root.innerHTML;
};
/* A narrow observer corrects legacy icon enhancers that insert extra action
   glyphs AFTER the first render. It only removes unexpected decorative children. */
let mf423PendingCleanup=false;
const mf423Observer=new MutationObserver(changes=>{
  if(!changes.some(change=>{
    const n=change.target;
    return n instanceof Element && (n.closest('.mf421-dock-progress,.mf421-dock-account,.mf422-nav-choice')||n.matches('.mf421-dock-progress,.mf421-dock-account,.mf422-nav-choice'));
  }))return;
  if(mf423PendingCleanup)return;
  mf423PendingCleanup=true;
  queueMicrotask(()=>{mf423PendingCleanup=false;mf423CleanLevelBadge(document.querySelector('.mf421-dock-progress'));mf423UpdateAvatar(document.querySelector('.mf421-dock-account'));mf423CleanSelectionCards();});
});
mf423Observer.observe(document.body,{subtree:true,childList:true});
queueMicrotask(()=>mf421Apply(true));
window.MediaFlowV423={version:MF423_VERSION,features:['Navigation first-paint and preference recovery','Removed duplicate dock logos','Removed circle-arrow adornments','Saved-profile URL in dock','Donation links and redesigned support section']};
