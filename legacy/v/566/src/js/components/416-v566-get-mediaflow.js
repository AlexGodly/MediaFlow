/* MediaFlow v566 — Get MediaFlow polish and update checks for every device.
 *
 *  - Proper icons everywhere in the popup: download, install, update, check,
 *    and a platform icon per card. Official platform logos are used when
 *    their files are listed in MF566_PLATFORM_LOGOS (files in
 *    assets/icons/platforms/, taken from each company's brand kit); until
 *    then each card shows a neutral device icon.
 *  - The green "Get MediaFlow" button in Settings carries the download icon.
 *  - Every device is checked, not only app installs: each browser / installed
 *    web app records its website version per device in the account
 *    (S.settings.mf566WebDevices), next to the apps' mf565AppDevices.
 *    A "Your devices" list at the top shows every device against the latest
 *    app release or the latest website version.
 */
const MF566_PLATFORM_LOGOS={android:'',windows:'',ios:'',web:''};
const MF566_ICON={
  download:MF565_DOWNLOAD_ICON,
  install:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
  update:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/></svg>',
  check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
  alert:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg>',
  // Neutral device icons (used until official logo files are added).
  android:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
  windows:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/></svg>',
  ios:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="3"/><circle cx="12" cy="18" r=".6" fill="currentColor"/></svg>',
  web:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.6 3.9 5.8 3.9 9.5s-1.3 6.9-3.9 9.5c-2.6-2.6-3.9-5.8-3.9-9.5S9.4 5.1 12 2.5z"/></svg>'
};
const MF566_PLATFORM_NAMES={android:'Android',windows:'Windows',ios:'iPhone & iPad',web:'Web'};
const MF566_STALE_DAYS=60;

function mf566PlatformIcon(id){
  const file=MF566_PLATFORM_LOGOS[id];
  if(file)return '<img src="'+escapeHtml(file)+'" alt="" width="22" height="22" decoding="async">';
  return MF566_ICON[id]||MF566_ICON.web;
}
// The page's own version: the build writes it into index.html. (MediaFlowRuntime.version
// is overwritten by older modules, so it is not the release number.)
function mf566SiteVersion(){
  return Number(document.querySelector('meta[name="mediaflow-version"]')?.content)||0;
}
function mf566BrowserLabel(){
  const ua=navigator.userAgent||'';
  const browser=/Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Browser';
  const os=/Android/i.test(ua)?'Android':/iPhone|iPad|iPod/i.test(ua)||(/Mac/i.test(navigator.platform||'')&&navigator.maxTouchPoints>1)?'iPhone / iPad':
    /Windows/i.test(ua)?'Windows':/Mac/i.test(ua)?'Mac':/CrOS/i.test(ua)?'ChromeOS':/Linux/i.test(ua)?'Linux':'';
  return (mf565Standalone()?'MediaFlow web app':browser)+(os?' on '+os:'');
}
function mf566Ready(){
  try{return !!(AUTH_USER?.id&&!V115_STARTUP_GUARD&&typeof V475_AUTH!=='undefined'&&V475_AUTH.hydrated&&!V475_AUTH.restoring&&!V475_AUTH.logoutRequested);}catch(_){return false;}
}
// Records this browser's website version once per new version, at most once a day otherwise.
let mf566WebReported='';
function mf566ReportWebDevice(){
  if(!mf566Ready())return;
  const user=String(AUTH_USER.id),version=mf566SiteVersion();
  if(!version||mf566WebReported===user+':'+version)return;
  let device='';try{device='web-'+mf556Device();}catch(_){return;}
  S.settings=S.settings||{};
  const all=S.settings.mf566WebDevices&&typeof S.settings.mf566WebDevices==='object'?S.settings.mf566WebDevices:{};
  const saved=all[device],now=Date.now(),label=mf566BrowserLabel();
  mf566WebReported=user+':'+version;
  if(saved&&Number(saved.version)===version&&saved.label===label&&now-(Number(saved.lastSeen)||0)<86400000)return;
  S.settings.mf566WebDevices=Object.assign({},all,{[device]:{platform:'web',version,label,lastSeen:now}});
  try{const p=persistSettings();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_){}
}
setInterval(mf566ReportWebDevice,30000);
setTimeout(mf566ReportWebDevice,4000);

function mf566AllDevices(){
  const apps=Object.entries(S.settings?.mf565AppDevices||{}).map(([id,d])=>({id,...d,kind:'app'}));
  const webs=Object.entries(S.settings?.mf566WebDevices||{}).map(([id,d])=>({id,...d,platform:'web',kind:'web'}));
  let here='';try{here='web-'+mf556Device();}catch(_){}
  const cutoff=Date.now()-MF566_STALE_DAYS*86400000;
  return apps.concat(webs).filter(d=>d&&d.version&&(Number(d.lastSeen)||0)>=cutoff)
    .map(d=>Object.assign(d,{here:d.id===here}))
    .sort((a,b)=>(b.here-a.here)||((Number(b.lastSeen)||0)-(Number(a.lastSeen)||0)));
}
// 'update' | 'ok' | '' (unknown: the latest version couldn't be checked).
function mf566DeviceState(d,latestApp,latestSite){
  if(d.kind==='web'){const v=Number(d.version)||0;return latestSite&&v?(v<latestSite?'update':'ok'):'';}
  return latestApp?(mf565CompareVersions(d.version,latestApp)<0?'update':'ok'):'';
}
function mf566StateHtml(state,latest){
  if(state==='update')return '<em class="mf566-dev-state update">'+MF566_ICON.alert+'<span>Update available → '+escapeHtml(String(latest))+'</span></em>';
  if(state==='ok')return '<em class="mf566-dev-state ok">'+MF566_ICON.check+'<span>Up to date</span></em>';
  return '<em class="mf566-dev-state">Not checked</em>';
}
function mf566Seen(ms){
  const t=Number(ms)||0;if(!t)return '';
  const days=Math.floor((Date.now()-t)/86400000);
  return days<=0?'today':days===1?'yesterday':days+' days ago';
}
function mf566DevicesHtml(latestApp,latestSite){
  const list=mf566AllDevices();
  if(!list.length)return '';
  const behind=list.filter(d=>mf566DeviceState(d,latestApp,latestSite)==='update').length;
  const head=behind?'<span class="mf566-dev-sum update">'+MF566_ICON.alert+behind+' of '+list.length+' need an update</span>':
    (latestApp||latestSite)?'<span class="mf566-dev-sum ok">'+MF566_ICON.check+'All '+list.length+' up to date</span>':'';
  return '<section class="mf566-devices" aria-label="Your devices"><header><strong>Your devices</strong>'+head+'</header><ul>'+
    list.map(d=>{
      const latest=d.kind==='web'?(latestSite?'v'+latestSite:''):latestApp;
      const ver=d.kind==='web'?'Website v'+d.version:'App '+d.version;
      return '<li><span class="mf566-dev-icon">'+mf566PlatformIcon(d.platform)+'</span><div><b>'+escapeHtml(d.label||MF566_PLATFORM_NAMES[d.platform]||'Device')+
        (d.here?' <small class="mf565-get-here">This device</small>':'')+'</b><small>'+escapeHtml(ver)+(d.lastSeen?' · seen '+escapeHtml(mf566Seen(d.lastSeen)):'')+'</small></div>'+
        mf566StateHtml(mf566DeviceState(d,latestApp,latestSite),latest)+'</li>';
    }).join('')+'</ul></section>';
}

/* ---------- popup, rebuilt on the v565 helpers ---------- */
mf565AssetButton=function(asset,label,primary=false){
  if(!asset)return '';
  return '<a class="btn btn-sm '+(primary?'btn-primary':'')+' mf565-get-dl" href="'+escapeHtml(asset.browser_download_url)+'" rel="noopener" download>'+
    MF566_ICON.download+'<span>'+escapeHtml(label)+'</span><small>'+escapeHtml(mf565Size(asset.size))+'</small></a>';
};
mf565DeviceRows=function(){return '';}; // devices now live in "Your devices"
mf565PlatformCard=function(id,platform,latest,a){
  const here=platform===id;
  const head=(title,sub)=>'<header><span class="mf565-get-icon mf566-plat-'+id+'">'+mf566PlatformIcon(id)+'</span><div><strong>'+title+'</strong><small>'+sub+'</small></div>'+
    (here?'<span class="mf565-get-here">This device</span>':'')+'</header>';
  const open=cls=>'<section class="mf565-get-card'+(here?' here':'')+(cls?' '+cls:'')+'">';
  if(id==='android')return open()+head('Android','Phones and tablets')+
    '<div class="mf565-get-actions">'+mf565AssetButton(a.arm64,'Most phones',true)+mf565AssetButton(a.apk,'Any phone')+mf565AssetButton(a.armv7,'Older 32-bit phones')+mf565AssetButton(a.x86,'Emulators / Chromebooks')+'</div></section>';
  if(id==='windows')return open()+head('Windows','Windows 10 and 11, 64-bit')+
    '<div class="mf565-get-actions">'+mf565AssetButton(a.setup,'Installer',true)+mf565AssetButton(a.portable,'Portable zip')+'</div></section>';
  if(id==='ios')return open()+head('iPhone & iPad','Needs re-signing to install')+
    '<div class="mf565-get-actions">'+mf565AssetButton(a.ipa,'Download .ipa',true)+'</div>'+
    '<p class="hint">The .ipa is unsigned. Install it with a re-signing tool such as AltStore or Sideloadly.</p></section>';
  const installed=mf565Standalone();
  const install=installed?'<span class="mf565-get-ok mf566-inline">'+MF566_ICON.check+'Installed as an app on this device</span>':
    MF565_GET.installPrompt?'<button type="button" class="btn btn-sm btn-primary mf566-btn" onclick="App.mf565InstallPwa()">'+MF566_ICON.install+'<span>Install MediaFlow</span></button>':
    platform==='ios'?'<p class="hint">In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>':
    '<p class="hint">Use your browser\'s <b>Install app</b> option (in the address bar or menu) to add MediaFlow to your device.</p>';
  const current=mf566SiteVersion(),site=MF565_GET.site;
  const update=site&&current&&site>current?'<button type="button" class="btn btn-sm btn-primary mf566-btn" onclick="App.mf565UpdateWebsite()">'+MF566_ICON.update+'<span>Update now → v'+site+'</span></button>':
    site&&current?'<span class="mf565-get-ok mf566-inline">'+MF566_ICON.check+'Website up to date (v'+current+')</span>':'';
  return open()+head('Web','Any browser · installable app (PWA)')+
    '<div class="mf565-get-actions">'+install+'</div><div class="mf565-get-actions">'+update+'</div></section>';
};
mf565GetHtml=function(){
  const platform=mf565Platform(),release=MF565_GET.release,a=mf565Assets(release),latest=release?mf565ReleaseLabel(release.tag_name):'';
  const order=[platform,...['android','windows','ios','web'].filter(x=>x!==platform)].filter((x,i,arr)=>arr.indexOf(x)===i);
  const status=MF565_GET.loading?'<p class="hint">Checking for updates…</p>':
    MF565_GET.error&&!release?'<p class="hint">Couldn\'t reach GitHub right now. <a href="'+MF565_RELEASES_PAGE+'" target="_blank" rel="noopener">Open the Releases page</a>.</p>':
    latest?'<p class="hint">Latest app: <b>'+escapeHtml(latest)+'</b>'+(release.published_at?' · '+escapeHtml(new Date(release.published_at).toLocaleDateString()):'')+
      (MF565_GET.site?' · Latest website: <b>v'+MF565_GET.site+'</b>':'')+' · <a href="'+escapeHtml(release.html_url||MF565_RELEASES_PAGE)+'" target="_blank" rel="noopener">Release notes</a></p>':'';
  const check='<button type="button" class="btn btn-sm btn-ghost mf566-btn" onclick="App.mf565RefreshGet()"'+(MF565_GET.loading?' disabled':'')+'>'+
    (MF565_GET.loading?'<span class="mf566-spin">'+MF566_ICON.update+'</span>':MF566_ICON.update)+'<span>Check for updates</span></button>';
  return '<div class="mf555-log-popup mf565-get" id="mf565-get" role="dialog" aria-modal="true" aria-labelledby="mf565-get-title">'+
    '<div class="mf555-log-backdrop" onclick="App.mf565CloseGet()"></div>'+
    '<section class="mf555-log-sheet"><header class="mf555-log-head"><div><strong id="mf565-get-title">Get MediaFlow</strong><small>Same account, same data on every device</small></div>'+
    '<button type="button" class="btn btn-sm v555-icon-btn" onclick="App.mf565CloseGet()" aria-label="Close">'+MF555_ICON.close+'</button></header>'+
    '<div class="mf555-log-body"><div class="mf565-get-status">'+status+check+'</div>'+
    mf566DevicesHtml(latest,MF565_GET.site)+
    '<div class="mf565-get-grid">'+order.map(id=>mf565PlatformCard(id,platform,latest,a)).join('')+'</div></div></section></div>';
};
const mf566OpenGetBase=mf565OpenGet;
mf565OpenGet=function(){mf566ReportWebDevice();return mf566OpenGetBase.apply(this,arguments);};

/* ---------- download icon on every Get MediaFlow button ---------- */
function mf566DecorateGetButtons(){
  document.querySelectorAll('[onclick*="mf565OpenGet"]').forEach(btn=>{
    if(btn.querySelector('svg'))return;
    btn.classList.add('mf566-btn');
    btn.innerHTML=MF566_ICON.download+'<span>'+escapeHtml(btn.textContent.trim()||'Get MediaFlow')+'</span>';
  });
}
MediaFlowRuntime.registerPageEnhancer('settings',mf566DecorateGetButtons);
Object.assign(App,{mf565OpenGet});
window.MediaFlowV566=Object.assign(window.MediaFlowV566||{},{allDevices:mf566AllDevices,deviceState:mf566DeviceState,reportWebDevice:mf566ReportWebDevice,browserLabel:mf566BrowserLabel});
