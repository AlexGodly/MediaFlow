/* MediaFlow v445 — Unified Cover + Metadata Recovery Workspace.
 * One accessible entry surface. Existing v424/v425 cover and v439 metadata
 * engines own provider requests, user confirmations, checkpoints and writes.
 * Opening this workspace never starts network traffic or recovery work.
 */
const MF445_VERSION=445;
const MF445={mode:'cover',opener:null,coverEntry:'settings',oneId:'',metadataId:''};
const mf445Esc=value=>mf424Escape(String(value??''));
const mf445Icon=(name,size=17)=>mf425Icon(name,size);
function mf445Providers(mode){
 if(mode==='cover'){
  const enabled=new Set(mf424Defaults().enabled);
  return MF424_PROVIDER_META.map(p=>({
   id:p.id,name:p.name||p.id,available:Number(p.limit)>0,enabled:enabled.has(p.id),
   detail:Number(p.limit)>0?'Provider adapter ready':(p.credentials?'Configuration or authorization needed':'Adapter unavailable'),
   setup:Number(p.limit)<=0
  }));
 }
 const enabled=new Set(mf439Preferences().enabled);
 return mf439Available().map(id=>{
  const gateway=MF439_GATEWAY.includes(id);
  const status=gateway&&typeof mf434ProviderStatus==='function'?mf434ProviderStatus(id):null;
  const available=!gateway||Boolean(status?.configured&&status?.testable);
  const label=(typeof MF434_LABELS==='object'&&MF434_LABELS?.[id])||
   MF438_EXTRA_CATALOG?.find(x=>x[0]===id)?.[1]||id;
  return {id,name:label,available,enabled:enabled.has(id),setup:!available,
   detail:gateway?(available?'Gateway configured':status?.testable===false?'Integration unavailable':'Configuration required'):'Public API · subject to quotas'};
 });
}
function mf445StatusText(mode){
 const job=mode==='cover'?MF424.job:(MF439.job||mf439ReadJob());
 if(!job)return 'No saved recovery job';
 const total=Array.isArray(job.ids)?job.ids.length:0;
 return String(job.status||'ready')+' · '+Number(job.cursor||0).toLocaleString()+' / '+total.toLocaleString()+' titles';
}
function mf445CategoryIcon(cat){
 const url=typeof v144SafeIconUrl==='function'?v144SafeIconUrl(cat.iconUrl||''):'';
 if(url)return '<img src="'+mf445Esc(url)+'" alt="" loading="lazy" decoding="async">';
 if(String(cat.icon||'').trim())return '<span aria-hidden="true">'+mf445Esc(cat.icon)+'</span>';
 return mf445Icon('layers',18);
}
function mf445Categories(){
 const categories=(S.categories||[]).filter(c=>c&&c.id!=null);
 const counts=new Map();
 for(const item of S.library||[]){
  if(item?.categoryId!=null){
   const id=String(item.categoryId);counts.set(id,(counts.get(id)||0)+1);
  }
 }
 return '<details class="mf445-section mf445-categories"><summary>'+
  mf445Icon('layers',17)+' <strong>Library categories</strong><span>'+categories.length+' categories</span>'+
  mf445Icon('chevronDown',16)+'</summary>'+
  '<p>Categories are for organizing titles. They never restrict which API is queried. Cover Recovery lets you choose the target scope.</p>'+
  '<div class="mf445-category-grid">'+categories.map(c=>{
   const count=counts.get(String(c.id))||0;
   return '<details class="mf445-category"><summary><span class="mf445-category-art">'+mf445CategoryIcon(c)+'</span>'+
    '<span class="mf445-category-label"><strong>'+mf445Esc(c.name||c.id)+'</strong><small>'+count.toLocaleString()+' titles</small></span>'+
    mf445Icon('chevronDown',15)+'</summary><p>'+count.toLocaleString()+
    ' titles in this category. Provider availability is independent of the category name.</p></details>';
  }).join('')+'</div></details>';
}
function mf445SourceHtml(mode){
 const list=mf445Providers(mode),ready=list.filter(p=>p.available&&p.enabled).length;
 return '<section class="mf445-section mf445-providers"><header><div><strong>'+mf445Icon(mode==='cover'?'images':'database',17)+
  ' '+(mode==='cover'?'Cover':'Metadata')+' providers</strong><small>'+ready+' enabled & available · '+list.length+' registered</small></div>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf445Settings(\'v221-settings-api-providers\')">'+mf445Icon('settings',15)+' API Setup</button></header>'+
  '<div class="mf445-provider-grid">'+list.map(p=>{
   const status=!p.available?'Unavailable':p.enabled?'Enabled':'Disabled';
   return '<div class="mf445-provider" data-status="'+(p.available?p.enabled?'enabled':'disabled':'unavailable')+'">'+
    '<span class="mf445-provider-symbol">'+mf445Icon(p.available?'check':'plug',17)+'</span>'+
    '<span class="mf445-provider-info"><strong>'+mf445Esc(p.name)+'</strong><small>'+mf445Esc(p.detail)+'</small></span>'+
    '<span class="mf445-provider-status">'+status+'</span>'+
    (p.setup?'<button type="button" class="mf445-provider-setup" onclick="App.mf445Settings(\'v221-settings-api-providers\')" aria-label="Set up '+mf445Esc(p.name)+'">'+mf445Icon('settings',15)+'</button>':'')+
    '</div>';
  }).join('')+'</div><small class="mf445-provider-note">Providers are configured independently for each recovery engine. Registered does not mean connected.</small></section>';
}
function mf445CurrentIds(){
 if(MF445.oneId&&MF445.mode==='cover')return [String(MF445.oneId)];
 if(MF445.metadataId&&MF445.mode==='metadata')return [String(MF445.metadataId)];
 return typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds().map(String):[];
}
function mf445Panel(mode){
 const root=document.getElementById('mf445-workspace');
 if(!root)return;
 MF445.mode=mode==='metadata'?'metadata':'cover';
 root.querySelectorAll('[data-mf445-tab]').forEach(button=>{
  const active=button.dataset.mf445Tab===MF445.mode;
  button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
 });
 const metadata=MF445.mode==='metadata',ids=mf445CurrentIds();
 const pane=root.querySelector('[data-mf445-panel]');
 pane.setAttribute('aria-labelledby','mf445-tab-'+MF445.mode);
 const status=mf445StatusText(MF445.mode);
 pane.innerHTML='<p class="mf445-intro">'+(metadata?
  'Recover missing descriptions, genres, external ratings and other verified fields without overwriting saved values.':
  'Recover missing artwork or choose a verified alternative, while keeping existing artwork and external IDs protected.')+'</p>'+
  '<div class="mf445-summary" role="status"><span>'+mf445Icon('check',17)+' <strong>'+ids.length.toLocaleString()+
  '</strong> selected '+(ids.length===1?'title':'titles')+'</span><span>'+mf445Icon('layers',16)+' '+mf445Esc(status)+'</span></div>'+
  mf445SourceHtml(MF445.mode)+mf445Categories()+
  '<div class="mf445-actions">'+(metadata?
   '<button type="button" class="btn btn-primary" '+(ids.length===1?'':'disabled')+' onclick="App.mf445Start(\'preview\')">'+
    mf445Icon('search',17)+' Preview one title</button>'+
   '<button type="button" class="btn btn-primary" '+(ids.length&&!MF445.metadataId?'':'disabled')+
   ' onclick="App.mf445Start(\'batch\')">'+mf445Icon('database',17)+' Recover selected titles</button>':
   '<button type="button" class="btn btn-primary" onclick="App.mf445Start(\'cover\')">'+mf445Icon('images',17)+
   ' Configure Cover Recovery</button>')+
   '<button type="button" class="btn btn-ghost" onclick="App.mf445Settings(\''+
   (metadata?'v221-settings-metadata-recovery':'v221-settings-cover-recovery')+'\')">'+mf445Icon('settings',16)+
   ' '+(metadata?'Metadata':'Cover')+' preferences</button></div>'+
  '<p class="mf445-safe">'+mf445Icon('shield',16)+
  ' Opening this workspace never starts a scan. The original confirmation, scope selection, API preferences, checkpoint and safe-write rules remain in effect.</p>';
}
function mf445Close(){
 const root=document.getElementById('mf445-workspace');
 if(!root)return;
 root.remove();
 const opener=MF445.opener;MF445.opener=null;
 if(opener?.isConnected&&typeof opener.focus==='function')opener.focus({preventScroll:true});
}
function mf445Open(mode='cover',options={}){
 const root=document.getElementById('mf445-workspace');
 const same=!!root;
 if(!same){
  MF445.opener=document.activeElement;
  MF445.coverEntry=String(options?.entry||'settings');
  MF445.oneId=String(options?.id||'');
  MF445.metadataId=String(options?.id||'');
  const overlay=document.createElement('div');overlay.id='mf445-workspace';
  overlay.className='mf424-modal mf425-themed mf445-overlay';
  overlay.innerHTML='<div class="mf424-shade" data-mf445-dismiss aria-hidden="true"></div>'+
   '<section class="mf424-dialog mf445-dialog" role="dialog" aria-modal="true" aria-labelledby="mf445-title" aria-describedby="mf445-intro" tabindex="-1">'+
   '<header class="mf445-header"><span>'+mf445Icon('layers',22)+'</span><div><small>MEDIAFLOW RECOVERY</small>'+
   '<h2 id="mf445-title">Unified Recovery Workspace</h2></div>'+
   '<button class="btn btn-ghost" type="button" data-mf445-dismiss aria-label="Close Recovery Workspace">'+mf445Icon('x',18)+'</button></header>'+
   '<p class="mf445-lead" id="mf445-intro">One workspace. Two independent recovery systems.</p>'+
   '<nav class="mf445-tabs" role="tablist" aria-label="Recovery type">'+
   '<button type="button" role="tab" id="mf445-tab-cover" aria-controls="mf445-panel" data-mf445-tab="cover">'+mf445Icon('images',17)+' Cover Recovery</button>'+
   '<button type="button" role="tab" id="mf445-tab-metadata" aria-controls="mf445-panel" data-mf445-tab="metadata">'+mf445Icon('database',17)+' Metadata Recovery</button></nav>'+
   '<div class="mf445-body" id="mf445-panel" role="tabpanel" data-mf445-panel tabindex="0"></div></section>';
  overlay.querySelectorAll('[data-mf445-dismiss]').forEach(button=>button.addEventListener('click',mf445Close));
  overlay.querySelectorAll('[data-mf445-tab]').forEach(button=>button.addEventListener('click',()=>mf445Panel(button.dataset.mf445Tab)));
  overlay.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();mf445Close();return;}
   if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)&&event.target.closest('[role="tablist"]')){
    event.preventDefault();
    const next=event.key==='Home'?'cover':event.key==='End'?'metadata':
     event.target.dataset.mf445Tab==='cover'?'metadata':'cover';
    mf445Panel(next);overlay.querySelector('[data-mf445-tab="'+next+'"]')?.focus();return;
   }
   if(event.key!=='Tab')return;
   const focusable=[...overlay.querySelectorAll('button:not([disabled]),[tabindex="0"],summary')].filter(el=>el.getClientRects().length);
   if(!focusable.length)return;
   if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable.at(-1).focus();}
   else if(!event.shiftKey&&document.activeElement===focusable.at(-1)){event.preventDefault();focusable[0].focus();}
  });
  document.body.appendChild(overlay);
 }
 if(options?.id){
  MF445.oneId=String(options.id);MF445.metadataId=String(options.id);
 }
 mf445Panel(mode);
 if(!same)document.querySelector('#mf445-workspace [data-mf445-dismiss]')?.focus();
}
function mf445Start(action){
 const ids=mf445CurrentIds(),oneId=MF445.metadataId||(ids.length===1?ids[0]:'');
 const entry=MF445.coverEntry==='settings'&&ids.length&&!MF445.oneId?'library':MF445.coverEntry;
 const id=MF445.oneId;
 if(action==='preview'&&(!oneId||ids.length!==1)){showToast('Select exactly one Library title to preview.');return;}
 if(action==='batch'&&(!ids.length||MF445.metadataId)){showToast('Select Library titles before recovering metadata.');return;}
 mf445Close();
 if(action==='cover')return mf445OriginalCoverConfig(entry,id);
 if(action==='preview')return mf445OriginalMetadataOpen(oneId);
 if(action==='batch')return App.mf439ConfirmBatch();
}
function mf445Settings(section){
 mf445Close();
 return mf441Settings(section||'v221-settings-recovery-workspace');
}
// Preserve original engine launchers. Redirection only changes entry points,
// never recovery requests, confirmation rules or title-safe writes.
const mf445OriginalCoverConfig=App.mf425OpenConfig;
const mf445OriginalMetadataOpen=App.mf439Open;
App.mf425OpenConfig=(entry='settings',id='')=>mf445Open('cover',{entry,id});
App.mf424OpenConfig=()=>mf445Open('cover');
App.mf439Open=id=>mf445Open('metadata',{id});
App.mf441OpenCover=()=>mf445Open('cover');
App.mf441OpenMetadata=()=>mf445Open('metadata');
Object.assign(App,{mf445Open,mf445Close,mf445Panel,mf445Start,mf445Settings});
// The original per-title quick Fix Cover/Fix Metadata actions remain accessible.
// Add the combined route explicitly to saved-title details.
const mf445TitleDetailsBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 const html=mf445TitleDetailsBase.apply(this,arguments);
 if(item?.id==null||!html.includes('class="v181-detail-actions"'))return html;
 const id=mf445Esc(item.id).replace(/'/g,'&#39;');
 const action='<button type="button" class="btn btn-ghost" onclick="App.mf445Open(\'cover\',{id:\''+id+'\'})">'+
  mf445Icon('layers',16)+' Covers + Metadata Recovery</button>';
 return html.replace(/(<div class="v181-detail-actions"[^>]*>)/,'$1'+action);
};
window.MediaFlowV445=Object.freeze({version:445,open:mf445Open,close:mf445Close,providers:mf445Providers,
 categories:mf445Categories,launch:mf445Start});
