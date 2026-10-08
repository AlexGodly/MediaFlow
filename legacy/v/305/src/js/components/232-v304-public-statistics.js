/* MediaFlow v304 — safe opt-in full Statistics snapshots and local-file startup. */
const MF304 = {};
function mf304SafeHtml(raw) {
  const template=document.createElement('template');
  template.innerHTML=String(raw||'');
  // Public read-only snapshot. No executable or interactive HTML is shipped.
  template.content.querySelectorAll('script,iframe,object,embed,form,input,button,select,option,textarea,base,link,meta,style,video,audio,canvas,foreignObject').forEach(node=>node.remove());
  template.content.querySelectorAll('a').forEach(node=>node.replaceWith(...Array.from(node.childNodes)));
  template.content.querySelectorAll('*').forEach(node=>{
    [...node.attributes].forEach(attr=>{
      const name=attr.name.toLowerCase(), value=attr.value.trim();
      if(name.startsWith('on')||name==='srcdoc'||name==='contenteditable'||name==='formaction'||name==='autofocus'||name==='href'||name==='xlink:href'||name==='target'||name==='action'||name==='srcset')node.removeAttribute(attr.name);
      if(name==='src'&&!/^https:\/\//i.test(value))node.removeAttribute(attr.name);
      if(name==='style'&&/(?:url\s*\(|expression\s*\(|@import|behavior\s*:)/i.test(value))node.removeAttribute(attr.name);
    });
  });
  return template.innerHTML;
}
async function mf304PublishStatistics(){
  if(!AUTH_USER){mfNotice('Log in to publish Statistics.');return;}
  const p=await mfMyProfile();
  if(!p?.is_public){mfNotice('Enable your public profile and save it first.');return;}
  if(!p.show_statistics){mfNotice('Enable Show Full Statistics and save your profile before publishing.');return;}
  if(!confirm('Publish a complete, read-only snapshot of your current Statistics dashboard? Everyone can see the charts, detailed insights, dates, records and category breakdowns in this snapshot.'))return;
  try{
    const original=renderStats();
    const html=mf304SafeHtml(original);
    const bytes=new TextEncoder().encode(html).length;
    if(bytes>2000000)throw new Error('Statistics snapshot is too large (more than 2 MB). No data was published.');
    if(!html.trim())throw new Error('Statistics dashboard is empty.');
    const {error}=await supabase.from('mf_public_statistics').upsert({user_id:AUTH_USER.id,snapshot_html:html,captured_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)throw error;
    mfNotice('Full Statistics published. Update it anytime by publishing again.');
    mfProfileEditor();
  }catch(err){mfNotice('Could not publish Statistics: '+String(err.message||err));}
}
function mf304Styles(){
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .filter(link=>{try { const u=new URL(link.href,document.baseURI);return u.protocol==='file:'||u.origin===location.origin;}catch(_){return false;}})
    .map(link=>'<link rel="stylesheet" href="'+mfEsc(link.href)+'">').join('');
}
async function mf304OpenStatistics(u){
  const root=document.getElementById('mf302-profile-data');if(!root)return;
  if(!u?.is_public||!u?.show_statistics){mfNotice('Statistics are private.');return;}
  root.innerHTML='<div class="mf302-loading">Loading public Statistics…</div>';
  try{
    const {data,error}=await supabase.from('mf_public_statistics').select('snapshot_html,captured_at').eq('user_id',u.user_id).maybeSingle();
    if(error)throw error;
    root.innerHTML=`<section class="mf304-stats-page"><div class="mf304-stats-toolbar"><div><h2>Full Statistics</h2><p>${data?.captured_at?'Last published '+mfEsc(new Date(data.captured_at).toLocaleString()):'No published Statistics snapshot yet.'} · Read-only public view</p></div><button class="mf302-btn" onclick="MF302.go('${mfEsc(u.username)}')">${mfIcon('back')} Back to profile</button></div><div id="mf304-stats-mount"></div></section>`;
    if(!data?.snapshot_html)return;
    const iframe=document.createElement('iframe');iframe.className='mf304-stats-frame';iframe.title='Published MediaFlow Statistics';iframe.setAttribute('sandbox','');iframe.setAttribute('loading','lazy');
    iframe.referrerPolicy='no-referrer';
    // Data from database is untrusted. Repeat sanitization and isolate it in a no-script sandbox.
    iframe.srcdoc='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+mfEsc(document.baseURI)+'">'+mf304Styles()+'<style>body{margin:0;padding:22px;background:var(--bg,#10141d);color:var(--text,#e9ecf3);font-family:Manrope,system-ui,sans-serif}button,input,select{display:none!important}html{overflow:auto}body>*{max-width:100%}*,*:before,*:after{box-sizing:border-box}@media(max-width:620px){body{padding:10px}}</style></head><body><main id="view-root" class="view stats-view">'+mf304SafeHtml(data.snapshot_html)+'</main></body></html>';
    document.getElementById('mf304-stats-mount')?.appendChild(iframe);
  }catch(err){root.innerHTML=mfHeading('Statistics unavailable',mfEsc(err.message||err));}
}
MF304.publishStatistics=mf304PublishStatistics;
MF304.openStatistics=mf304OpenStatistics;
window.MF304=MF304;
window.MediaFlowCommunity={...(window.MediaFlowCommunity||{}),version:305,publicStatistics:true,localFileStartup:true};

// Ensure guest homepage works even when the optional Supabase CDN is unavailable:
// core init() can run before the Community renderAuthScreen wrapper is registered.
function mf304GuestBoot(){
  if(AUTH_USER||MF302.forceAuth||document.body.classList.contains('mf302-public-active'))return;
  const route=mfUrlState();
  if(route==='workspace'||route==='login')return;
  MF302.page=route;
  mfShowPortal();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mf304GuestBoot,{once:true});
else queueMicrotask(mf304GuestBoot);
