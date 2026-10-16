/* MediaFlow v422 — final UI integration (additive, no cloud/data migrations).
   Runs after the v421 adaptive navigation inside the canonical closure. */
const MF422_VERSION=422;
const MF422_KOFI='https://ko-fi.com/alexgodly';
const MF422_BRAND_LOGO='assets/icons/mediaflow-192.png';
const MF422_MIN_EXPANDED=226;
let mf422PopupOpen=false;
function mf422StoredWidth(){
  let width=236;
  try{width=Number(localStorage.getItem(SIDEBAR_WIDTH_KEY))||236;}catch(_){ }
  return Math.min(380,Math.max(MF422_MIN_EXPANDED,width));
}
function mf422RestoreExpandedWidth(){
  document.documentElement.style.setProperty('--sidebar-width',mf422StoredWidth()+'px');
}
const mf422PriorStyle=mf421SetNavStyle;
mf421SetNavStyle=function(style){
  const previous=mf421Mode();
  if(style==='mini' && previous==='sidebar'){
    const width=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'));
    if(width>=MF422_MIN_EXPANDED){try{localStorage.setItem(SIDEBAR_WIDTH_KEY,String(Math.round(width)));}catch(_){ }}
  }
  if(style==='sidebar' && previous==='mini')mf422RestoreExpandedWidth();
  const result=mf422PriorStyle.apply(this,arguments);
  if(style==='sidebar')mf422RestoreExpandedWidth();
  mf421Apply(true);
  return result;
};
App.mf421SetNavStyle=mf421SetNavStyle;
App.v265ToggleSidebar=function(){mf421SetNavStyle(mf421Mode()==='mini'?'sidebar':'mini');};
applySidebarWidth=function(raw){
  const val=Number(raw)||236;
  if(val<150){
    if(mf421Mode()!=='mini')mf421SetNavStyle('mini');
    document.documentElement.style.setProperty('--sidebar-width','82px');
    return 82;
  }
  const width=Math.min(380,Math.max(MF422_MIN_EXPANDED,Math.round(val)));
  document.documentElement.style.setProperty('--sidebar-width',width+'px');
  try{localStorage.setItem(SIDEBAR_WIDTH_KEY,String(width));}catch(_){ }
  if(mf421Mode()==='mini')mf421SetNavStyle('sidebar');
  return width;
};
if(mf421Mode()==='sidebar')mf422RestoreExpandedWidth();

/* Settings Center: v421 targeted a retired .v220-settings-page container.
   Insert the Navigation cards INTO the canonical renderer before the v221/v365
   organizers move the section into Settings > Appearance > Navigation. */
function mf422NavigationControls(){
  const current=mf421Mode();
  const modes=[['sidebar','Sidebar','Resizable sidebar'],['mini','Mini sidebar','Icons only'],['top','Top navigation','Centered tabs'],['bottom','Bottom navigation','Bottom dock']];
  return `<div class="mf422-settings-navigation card" data-mf422-settings="navigation"><h3>Navigation style</h3><p class="hint">Choose the desktop navigation layout. You can also drag the MediaFlow logo to dock it.</p><div class="mf422-navigation-tabs" role="group" aria-label="Navigation style">${modes.map(([id,label,hint])=>`<button type="button" data-mf422-nav-style="${id}" class="mf422-nav-choice ${current===id?'active':''}" aria-pressed="${current===id}" onclick="App.mf421SetNavStyle('${id}')"><span class="mf422-nav-symbol" aria-hidden="true">${{sidebar:'▤',mini:'▥',top:'▔',bottom:'▁'}[id]}</span><span>${label}</span><small>${hint}</small></button>`).join('')}</div><p class="hint">The selected style, sidebar width and page order are saved with your settings.</p></div>`;
}
const mf422SettingsOriginal=V219_PAGE_RENDERERS.get('settings');
if(typeof mf422SettingsOriginal==='function'){
  MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
    const html=String(mf422SettingsOriginal(ctx)||'');
    const host=document.createElement('div');host.innerHTML=html;
    const label=[...host.querySelectorAll('.section-label')].find(n=>v221PlainSectionTitle(n).toUpperCase()==='NAVIGATION');
    if(label&&!host.querySelector('.mf422-settings-navigation'))label.insertAdjacentHTML('afterend',mf422NavigationControls());
    return host.innerHTML;
  });
}
function mf422RefreshSettingsTabs(){
  document.querySelectorAll('.mf422-nav-choice').forEach(btn=>{
    const active=btn.dataset.mf422NavStyle===mf421Mode();
    btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  });
}
MediaFlowRuntime.registerPageEnhancer('settings',mf422RefreshSettingsTabs);

/* A single delegated event handles redraws, pagination, and both Library modes. */
function mf422LibraryDetailsTarget(target){
  if(String(S.view||'')!=='library')return null;
  const root=document.querySelector('#view-root');
  if(!root||!root.contains(target))return null;
  if(target.closest('button,a,input,select,textarea,summary,label,.mf-select,.v44-rating,.mf420-cover-stage[onclick]'))return null;
  if(target.closest('[role="button"]:not(.mf422-details-trigger)'))return null;
  const hit=target.closest('.item-title,.v181-cover-tile-title,.library-cover-thumb,.mf417-cover-thumb,.mf420-cover-stage,.v181-cover-tile-cover,.v181-cover-tile-placeholder,.mf420-library-poster');
  if(!hit)return null;
  const tile=hit.closest('[data-library-id]')||hit;
  const id=tile.getAttribute('data-library-id')||hit.getAttribute('data-library-id');
  if(!id||!(S.library||[]).some(item=>String(item?.id)===String(id)))return null;
  return id;
}
document.addEventListener('click',function(event){
  const id=mf422LibraryDetailsTarget(event.target);
  if(!id)return;
  event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails(id);
});
document.addEventListener('keydown',function(event){
  if(event.key!=='Enter'&&event.key!==' ')return;
  let id=mf422LibraryDetailsTarget(event.target);
  if(!id && String(S.view||'')==='library' && event.target.matches('.mf420-cover-stage[onclick]')){
    id=event.target.closest('[data-library-id]')?.getAttribute('data-library-id');
  }
  if(!id)return;
  event.preventDefault();App.v181OpenTitleDetails(id);
});
MediaFlowRuntime.registerPageEnhancer('library',function(){
  document.querySelectorAll('#view-root [data-library-id] .item-title,#view-root [data-library-id] .v181-cover-tile-title,#view-root [data-library-id] .mf420-cover-stage,#view-root [data-library-id] .library-cover-thumb').forEach(n=>{
    if(n.closest('button,a,[role="button"]'))return;
    n.setAttribute('tabindex','0');n.setAttribute('role','button');
    n.setAttribute('title','Open Title Details');n.setAttribute('aria-label','Open Title Details');
    n.classList.add('mf422-details-trigger');
  });
});

/* Top/bottom bars: preserve the v421 More overflow, docking, and navigation. */
function mf422ProgressMarkup(){
  const info=mediaFlowLevelInfo(),streak=computeDayStreak();
  const pct=Math.max(0,Math.min(100,Number(info.pct)||0));
  const fmt=n=>Number(n||0).toLocaleString();
  let mult='';try{mult=Number(v149StreakMultiplier(streak)).toFixed(2);}catch(_){mult='1.00';}
  return `<div class="mf422-progress-head"><span class="mf422-progress-crown" aria-hidden="true">✦</span><div><span class="mf422-progress-kicker">YOUR PROGRESSION</span><strong>Level ${fmt(info.level)}</strong></div><button type="button" class="mf422-popup-close" onclick="App.mf422ToggleProgress(false)" aria-label="Close progression">×</button></div><div class="mf422-xp-panel"><div class="mf422-progress-overview"><span>LEVEL PROGRESS</span><b>${pct}%</b></div><div class="mf422-xp-track"><i style="width:${pct}%"></i></div><div class="mf422-progress-overview"><span>${fmt(info.current)} / ${fmt(info.needed)} XP</span><span>${fmt(info.needed-info.current)} XP to next level</span></div></div><div class="mf422-progression-stats"><div><span aria-hidden="true">🔥</span><b>${fmt(streak)} days</b><small>Current streak</small></div><div><span aria-hidden="true">✦</span><b>×${mult}</b><small>Streak XP bonus</small></div></div><p class="mf422-total-xp">Lifetime experience <strong>${fmt(info.xp)} XP</strong></p>`;
}
function mf422ToggleProgress(open){
  mf422PopupOpen=typeof open==='boolean'?open:!mf422PopupOpen;
  const bar=document.querySelector('.mf421-dock');if(!bar)return;
  let panel=bar.querySelector('.mf422-progress-popup');
  if(!panel){panel=document.createElement('section');panel.className='mf422-progress-popup';panel.setAttribute('aria-label','Level and streak progression');bar.appendChild(panel);}
  panel.innerHTML=mf422ProgressMarkup();panel.hidden=!mf422PopupOpen;
  bar.querySelector('.mf421-dock-progress')?.setAttribute('aria-expanded',String(mf422PopupOpen));
}
App.mf422ToggleProgress=mf422ToggleProgress;
function mf422EnhanceDock(){
  const bar=document.querySelector('.mf421-dock');if(!bar||bar.hidden)return;
  const brand=bar.querySelector('.mf421-dock-brand');
  if(brand&&!brand.querySelector('.mf422-real-logo')){
    brand.querySelector('.mf421-dock-mark')?.remove();
    brand.insertAdjacentHTML('afterbegin',`<img class="mf422-real-logo" src="${MF422_BRAND_LOGO}" alt="" width="29" height="29">`);
  }
  if(!bar.querySelector('.mf422-glowing-brand'))bar.insertAdjacentHTML('beforeend',`<span class="mf422-glowing-brand" aria-hidden="true"><img src="${MF422_BRAND_LOGO}" alt="" width="31" height="31"></span>`);
  const progress=bar.querySelector('.mf421-dock-progress');
  if(progress){
    progress.setAttribute('onclick','App.mf422ToggleProgress()');progress.setAttribute('aria-label','Show level and streak details');
    progress.title='Show level and streak';
    const level=mediaFlowLevelInfo(),streak=computeDayStreak();
    progress.innerHTML=`<span class="mf422-level-badge"><span aria-hidden="true">✦</span> Lv. ${level.level}</span><span class="mf422-streak-badge"><span aria-hidden="true">🔥</span> ${streak}</span>`;
  }
  const account=bar.querySelector('.mf421-dock-account');if(account){account.title='Open Account';account.setAttribute('aria-label','Open Account');}
  const panel=bar.querySelector('.mf422-progress-popup');
  if(panel){if(mf422PopupOpen)panel.innerHTML=mf422ProgressMarkup();panel.hidden=!mf422PopupOpen;}
}
const mf422OriginalApply=mf421Apply;
mf421Apply=function(force){
  const result=mf422OriginalApply.apply(this,arguments);
  if(mf421Mode()==='sidebar'&&mf421DeskAllowed())mf422RestoreExpandedWidth();
  mf422EnhanceDock();mf422RefreshSettingsTabs();
  if(!['top','bottom'].includes(mf421Mode()))mf422PopupOpen=false;
  return result;
};
document.addEventListener('pointerdown',function(e){
  if(mf422PopupOpen&&!e.target.closest('.mf422-progress-popup,.mf421-dock-progress'))mf422ToggleProgress(false);
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mf422PopupOpen)mf422ToggleProgress(false);});

/* Account: no client-side file picker or file-storage actions; URL stays enabled. */
const mf422OldProfile=renderProfile;
renderProfile=function(){
  const html=String(mf422OldProfile.apply(this,arguments));
  const host=document.createElement('div');host.innerHTML=html;
  const section=host.querySelector('.profile-section');if(!section)return html;
  const avatarBtn=section.querySelector('.profile-avatar-wrap .account-avatar-btn');
  if(avatarBtn){avatarBtn.removeAttribute('onclick');avatarBtn.setAttribute('aria-label','Current profile picture');avatarBtn.disabled=true;}
  section.querySelector('input[type="file"]')?.remove();
  const action=section.querySelector('.profile-avatar-actions');
  action?.querySelector('label')?.remove();
  action?.querySelector('#save-profile-picture')?.remove();
  action?.insertAdjacentHTML('afterbegin',`<button type="button" class="btn mf422-upload-disabled" disabled aria-describedby="mf422-upload-note">Choose picture — Unavailable</button>`);
  const note=section.querySelector('.profile-avatar-wrap .profile-note');if(note)note.textContent='Set your profile picture using a direct image URL below.';
  section.querySelector('.profile-avatar-wrap')?.insertAdjacentHTML('afterend',`<div class="mf422-upload-notice" id="mf422-upload-note"><strong>Why are uploads disabled?</strong><p>Alex Godly has chosen to disable image file uploads in the MediaFlow web app due to limited database storage. You can still use a direct image URL.</p><p>Support future improvements and new features by donating at <a href="${MF422_KOFI}" target="_blank" rel="noopener noreferrer">Ko-fi · Alex Godly ↗</a>. Donations are optional.</p></div>`);
  return host.innerHTML;
};
chooseProfilePicture=function(){showToast('File uploads are disabled. Please use a direct image URL.');};
window.MediaFlowProfile.chooseAvatar=chooseProfilePicture;
window.MediaFlowProfile.saveAvatar=function(){showToast('Use a direct image URL to set your profile picture.');};

/* About: voluntary donation card adjacent to the existing footer. */
const mf422OldAbout=renderAbout;
renderAbout=function(){
  const html=String(mf422OldAbout.apply(this,arguments));const host=document.createElement('div');host.innerHTML=html;
  const root=host.querySelector('.mf383-about');if(!root)return html;
  const footer=root.querySelector('.mf383-about-footer');
  const section=document.createElement('section');section.className='mf422-donate-section';
  section.innerHTML=`<div class="mf422-donate-icon" aria-hidden="true">♥</div><span class="mf422-donate-eyebrow">SUPPORT INDEPENDENT DEVELOPMENT</span><h2>Help MediaFlow grow.</h2><p>MediaFlow is independently developed by Alex Godly. Your optional support can help with hosting, storage, maintenance, and new features.</p><div class="mf422-donate-benefits"><span>☁ Hosting & storage</span><span>✦ New features</span><span>♥ Continued development</span></div><a class="btn btn-primary mf422-kofi-link" href="${MF422_KOFI}" target="_blank" rel="noopener noreferrer">♥ Donate on Ko-fi ↗</a><small>Donations are voluntary and do not unlock existing features.</small>`;
  if(footer)root.insertBefore(section,footer);else root.appendChild(section);
  return host.innerHTML;
};
queueMicrotask(()=>mf421Apply(true));
window.MediaFlowV422={version:MF422_VERSION,features:['Title Details cover/name click','Mini Sidebar width restoration','Navigation style Settings Center tabs','Centered branded docks','Level and streak popup','URL-only profile images','Ko-fi About support']};
