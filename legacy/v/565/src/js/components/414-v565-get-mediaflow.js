/* MediaFlow v565 — "Get MediaFlow": every way to use MediaFlow, always current.
 *
 * In the + menu and in Settings → App & Updates. The popup reads the latest
 * STABLE MediaFlowApp release from GitHub each time it opens (pre-releases
 * are never shown), so new builds appear without a website change. The
 * device you're on is listed first.
 *  - Android: universal APK and per-phone-type APKs
 *  - Windows: installer and portable zip
 *  - iPhone / iPad: the .ipa (needs re-signing)
 *  - Web: install as an app (PWA), or Add to Home Screen steps on iPhone
 * Update checks
 *  - Website: compares this page's version with the deployed version.json.
 *  - Apps: each MediaFlow app records its version per device in the account
 *    (S.settings.mf565AppDevices); the popup shows each one against the latest.
 */
const MF565_GET={release:null,loading:null,error:'',site:null,installPrompt:null,open:false};
const MF565_RELEASES_API='https://api.github.com/repos/AlexGodly/MediaFlowApp/releases/latest';
const MF565_RELEASES_PAGE='https://github.com/AlexGodly/MediaFlowApp/releases';
const MF565_DOWNLOAD_ICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>';

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();MF565_GET.installPrompt=e;if(MF565_GET.open)mf565PaintGet();});
window.addEventListener('appinstalled',()=>{MF565_GET.installPrompt=null;if(MF565_GET.open)mf565PaintGet();});

function mf565Platform(){
  const ua=navigator.userAgent||'',p=navigator.userAgentData?.platform||navigator.platform||'';
  if(/android/i.test(ua))return 'android';
  if(/iphone|ipad|ipod/i.test(ua)||(/mac/i.test(p)&&navigator.maxTouchPoints>1))return 'ios';
  if(/win/i.test(p)||/windows/i.test(ua))return 'windows';
  return 'web';
}
function mf565Standalone(){return matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone===true;}
// 'mediaflowapp-v6.0.0.565' -> '6.0.0.565'
function mf565ReleaseLabel(tag){return String(tag||'').replace(/^mediaflowapp-v/i,'').replace(/^v/i,'');}
function mf565CompareVersions(a,b){
  const pa=String(a||'').split('.').map(n=>parseInt(n,10)||0),pb=String(b||'').split('.').map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(pa.length,pb.length);i++){const d=(pa[i]||0)-(pb[i]||0);if(d)return d<0?-1:1;}
  return 0;
}
function mf565Assets(release){
  const list=Array.isArray(release?.assets)?release.assets:[];
  const pick=re=>list.find(a=>re.test(String(a.name||'')))||null;
  return {
    apk:pick(/-Android\.apk$/i),arm64:pick(/-Android-arm64-v8a\.apk$/i),armv7:pick(/-Android-armeabi-v7a\.apk$/i),
    x86:pick(/-Android-x86_64\.apk$/i),setup:pick(/-Windows-x64-Setup\.exe$/i),portable:pick(/-Windows-x64-portable\.zip$/i),
    ipa:pick(/-iOS[^/]*\.ipa$/i)
  };
}
async function mf565LoadRelease(force=false){
  if(MF565_GET.loading&&!force)return MF565_GET.loading;
  MF565_GET.error='';
  MF565_GET.loading=(async()=>{
    try{
      const res=await fetch(MF565_RELEASES_API,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
      if(!res.ok)throw Error('GitHub answered '+res.status);
      const data=await res.json();
      if(data?.prerelease||data?.draft)throw Error('No stable release');
      MF565_GET.release=data;
    }catch(e){MF565_GET.error=String(e?.message||e);}
    try{
      const v=await fetch('version.json',{cache:'no-store'}).then(r=>r.ok?r.json():null);
      MF565_GET.site=v&&Number(v.build||v.version)?Number(v.build||v.version):null;
    }catch(_){MF565_GET.site=null;}
    MF565_GET.loading=null;
    if(MF565_GET.open)mf565PaintGet();
  })();
  return MF565_GET.loading;
}
function mf565Size(bytes){const n=Number(bytes)||0;return n>=1048576?(n/1048576).toFixed(1)+' MB':n>=1024?Math.round(n/1024)+' KB':'';}
function mf565AssetButton(asset,label,primary=false){
  if(!asset)return '';
  return '<a class="btn btn-sm '+(primary?'btn-primary':'')+' mf565-get-dl" href="'+escapeHtml(asset.browser_download_url)+'" rel="noopener" download>'+
    MF565_DOWNLOAD_ICON+'<span>'+escapeHtml(label)+'</span><small>'+escapeHtml(mf565Size(asset.size))+'</small></a>';
}
function mf565DeviceRows(platform,latest){
  const devices=Object.values(S.settings?.mf565AppDevices||{}).filter(d=>d&&d.platform===platform&&d.version);
  if(!devices.length)return '';
  return '<ul class="mf565-get-devices">'+devices.sort((a,b)=>(Number(b.lastSeen)||0)-(Number(a.lastSeen)||0)).slice(0,6).map(d=>{
    const behind=latest&&mf565CompareVersions(d.version,latest)<0;
    return '<li><b>'+escapeHtml(d.label||'Your device')+'</b><span>'+escapeHtml(d.version)+'</span>'+
      (latest?(behind?'<em class="mf565-get-update">Update available → '+escapeHtml(latest)+'</em>':'<em class="mf565-get-ok">Up to date</em>'):'')+'</li>';
  }).join('')+'</ul>';
}
function mf565PlatformCard(id,platform,latest,a){
  const here=platform===id;
  const head=(icon,title,sub)=>'<header><span class="mf565-get-icon">'+icon+'</span><div><strong>'+title+'</strong><small>'+sub+'</small></div>'+(here?'<span class="mf565-get-here">This device</span>':'')+'</header>';
  if(id==='android')return '<section class="mf565-get-card'+(here?' here':'')+'">'+head('🤖','Android','Phones and tablets')+
    '<div class="mf565-get-actions">'+mf565AssetButton(a.arm64,'Most phones',true)+mf565AssetButton(a.apk,'Any phone')+mf565AssetButton(a.armv7,'Older 32-bit phones')+mf565AssetButton(a.x86,'Emulators / Chromebooks')+'</div>'+
    mf565DeviceRows('android',latest)+'</section>';
  if(id==='windows')return '<section class="mf565-get-card'+(here?' here':'')+'">'+head('🪟','Windows','Windows 10 and 11, 64-bit')+
    '<div class="mf565-get-actions">'+mf565AssetButton(a.setup,'Installer',true)+mf565AssetButton(a.portable,'Portable zip')+'</div>'+
    mf565DeviceRows('windows',latest)+'</section>';
  if(id==='ios')return '<section class="mf565-get-card'+(here?' here':'')+'">'+head('','iPhone & iPad','Needs re-signing to install')+
    '<div class="mf565-get-actions">'+mf565AssetButton(a.ipa,'Download .ipa',true)+'</div>'+
    '<p class="hint">The .ipa is unsigned. Install it with a re-signing tool such as AltStore or Sideloadly.</p>'+mf565DeviceRows('ios',latest)+'</section>';
  // Web / PWA
  const installed=mf565Standalone();
  const iosSafari=platform==='ios';
  const install=installed?'<span class="mf565-get-ok">Installed as an app on this device</span>':
    MF565_GET.installPrompt?'<button type="button" class="btn btn-sm btn-primary" onclick="App.mf565InstallPwa()">Install MediaFlow</button>':
    iosSafari?'<p class="hint">In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.</p>':
    '<p class="hint">Use your browser\'s <b>Install app</b> option (in the address bar or menu) to add MediaFlow to your device.</p>';
  const current=Number(typeof MediaFlowRuntime!=='undefined'?MediaFlowRuntime.version:0)||Number(document.querySelector('meta[name="mediaflow-version"]')?.content)||0;
  const site=MF565_GET.site;
  const update=site&&current&&site>current?'<button type="button" class="btn btn-sm btn-primary" onclick="App.mf565UpdateWebsite()">Update now → v'+site+'</button>':
    site&&current?'<span class="mf565-get-ok">Website up to date (v'+current+')</span>':'';
  return '<section class="mf565-get-card'+(platform==='web'?' here':'')+'">'+head('🌐','Web','Any browser · installable app (PWA)')+
    '<div class="mf565-get-actions">'+install+'</div><div class="mf565-get-actions">'+update+'</div></section>';
}
function mf565GetHtml(){
  const platform=mf565Platform(),release=MF565_GET.release,a=mf565Assets(release),latest=release?mf565ReleaseLabel(release.tag_name):'';
  const order=[platform,...['android','windows','ios','web'].filter(x=>x!==platform)].filter((x,i,arr)=>arr.indexOf(x)===i);
  const status=MF565_GET.loading?'<p class="hint">Checking the latest release…</p>':
    MF565_GET.error&&!release?'<p class="hint">Couldn\'t reach GitHub right now. <a href="'+MF565_RELEASES_PAGE+'" target="_blank" rel="noopener">Open the Releases page</a>.</p>':
    latest?'<p class="hint">Latest app: <b>'+escapeHtml(latest)+'</b>'+(release.published_at?' · '+escapeHtml(new Date(release.published_at).toLocaleDateString())+'':'')+' · <a href="'+escapeHtml(release.html_url||MF565_RELEASES_PAGE)+'" target="_blank" rel="noopener">Release notes</a></p>':'';
  return '<div class="mf555-log-popup mf565-get" id="mf565-get" role="dialog" aria-modal="true" aria-labelledby="mf565-get-title">'+
    '<div class="mf555-log-backdrop" onclick="App.mf565CloseGet()"></div>'+
    '<section class="mf555-log-sheet"><header class="mf555-log-head"><div><strong id="mf565-get-title">Get MediaFlow</strong><small>Same account, same data on every device</small></div>'+
    '<button type="button" class="btn btn-sm v555-icon-btn" onclick="App.mf565CloseGet()" aria-label="Close">'+MF555_ICON.close+'</button></header>'+
    '<div class="mf555-log-body"><div class="mf565-get-status">'+status+'<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf565RefreshGet()">Check for updates</button></div>'+
    '<div class="mf565-get-grid">'+order.map(id=>mf565PlatformCard(id,platform,latest,a)).join('')+'</div></div></section></div>';
}
function mf565PaintGet(){
  const old=document.getElementById('mf565-get');
  if(!MF565_GET.open){old?.remove();return;}
  const wrap=document.createElement('div');wrap.innerHTML=mf565GetHtml();
  const fresh=wrap.firstElementChild;
  if(old)old.replaceWith(fresh);else document.body.appendChild(fresh);
}
function mf565OpenGet(){MF565_GET.open=true;mf565PaintGet();mf565LoadRelease().then(mf565PaintGet);}
function mf565CloseGet(){MF565_GET.open=false;mf565PaintGet();}
function mf565RefreshGet(){MF565_GET.release=MF565_GET.release||null;mf565LoadRelease(true);mf565PaintGet();}
async function mf565InstallPwa(){
  const p=MF565_GET.installPrompt;if(!p)return;
  try{await p.prompt();await p.userChoice;}catch(_){}
  MF565_GET.installPrompt=null;mf565PaintGet();
}
async function mf565UpdateWebsite(){
  try{const reg=await navigator.serviceWorker?.getRegistration?.();await reg?.update?.();reg?.waiting?.postMessage?.({type:'SKIP_WAITING'});}catch(_){}
  location.reload();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&MF565_GET.open){e.preventDefault();mf565CloseGet();}});

/* ---------- + menu item ---------- */
const mf565GetMarkupBase=mf397Markup;
mf397Markup=function(){
  let html=String(mf565GetMarkupBase.apply(this,arguments)||'');
  if(html.includes('data-action="mf565Get"'))return html;
  const anchor='      </div>\n      <button type="button" id="mf397-fab"';
  if(!html.includes(anchor))return html;
  const button='        <button type="button" class="mf397-fan-action mf447-float-action mf565-get-action" data-action="mf565Get" aria-label="Get MediaFlow">'+
    '<span class="mf397-action-symbol">'+MF565_DOWNLOAD_ICON+'</span><span><strong>Get MediaFlow</strong><small>Apps for every device · updates</small></span><em>00</em></button>\n';
  html=html.replace(anchor,button+anchor);
  let n=0;return html.replace(/<em>\d{2}<\/em>/g,()=>'<em>'+String(++n).padStart(2,'0')+'</em>');
};
const mf565GetActionBase=mf397Action;
mf397Action=function(action){
  if(action==='mf565Get'){mf397SetMenu(false);return mf565OpenGet();}
  return mf565GetActionBase.apply(this,arguments);
};
/* ---------- Settings → App & Updates ---------- */
function mf565MountGetSettings(){
  if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
  if(document.querySelector('.mf565-get-settings'))return;
  const node=document.createElement('div');
  node.innerHTML='<div class="mf565-get-settings mf565-setting-row"><div><b>MediaFlow apps</b><small>Download for Android, Windows and iPhone, install the web app, and check every device for updates.</small></div>'+
    '<button type="button" class="btn btn-sm btn-primary" onclick="App.mf565OpenGet()">Get MediaFlow</button></div>';
  window.MediaFlowSettingsCenter.mountSection({id:'mf565-get-mediaflow',title:'Get MediaFlow',category:'app',subgroup:'Updates',
    keywords:['download','android','apk','windows','iphone','ios','install','pwa','update','app'],nodes:[node]});
}
MediaFlowRuntime.registerPageEnhancer('settings',mf565MountGetSettings);

Object.assign(App,{mf565OpenGet,mf565CloseGet,mf565RefreshGet,mf565InstallPwa,mf565UpdateWebsite});
window.MediaFlowV565=Object.assign(window.MediaFlowV565||{},{getAssets:mf565Assets,releaseLabel:mf565ReleaseLabel,compareVersions:mf565CompareVersions,openGet:mf565OpenGet});
