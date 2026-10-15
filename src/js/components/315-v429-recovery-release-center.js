/* MediaFlow v429 — Recovery and Release Center: one workspace, original engines. */
(function(){
'use strict';
if(window.MediaFlowV429Center)return;
const TABS=['queue','covers','metadata','fresh'];
const icons={queue:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',covers:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',metadata:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 2 16 2 16 0V5M4 12c0 2 16 2 16 0"/>',fresh:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M7 3v4m10-4v4m-8 9 2 2 4-4"/>'};
const ico=(type,size=18)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[type]+'</svg>';
const escapeText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={root:null,content:null,tab:'queue',expanded:false,account:'',started:false,context:null};
const account=()=>String((typeof AUTH_USER!=='undefined'&&AUTH_USER?.id)||'local');
const pref=()=>S.settings?.v429Center||{};
const visibility=()=>['hidden','auto','always'].includes(pref().visibility)?pref().visibility:'always';
function savePreference(p){
 S.settings=S.settings||{};S.settings.v429Center={...pref(),...p};
 try{Promise.resolve(typeof persistSettings==='function'?persistSettings():saveState()).catch(e=>console.warn('v429 center settings',e));}catch(e){console.warn(e);}
}
const hub=()=>window.MediaFlowV428Hub;
const status=()=>hub()?.status()||{active:null,queued:[],cooldownUntil:0};
const phase=k=>hub()?.phase(k)||'idle';
const progress=k=>hub()?.progress(k)||{at:0,total:0};
const mapping={cover:'covers',metadata:'metadata',fresh:'fresh'};
const titles={cover:'Cover Recovery',metadata:'Metadata Recovery',fresh:'Fresh Episodes & Releases'};
function switchAccount(){
 if(state.account===account())return;
 state.account=account();state.tab=TABS.includes(pref().tab)?pref().tab:'queue';state.expanded=pref().expanded===true;
 state.context=null;
 if(state.root)removePortals();
}
function overview(){
 const s=status();
 if(s.active)return {name:titles[s.active]+' running',state:'running'};
 if(s.queued?.length)return {name:s.queued.length+' process'+(s.queued.length===1?'':'es')+' queued',state:'queued'};
 if(['cover','metadata','fresh'].some(k=>phase(k)==='review'))return {name:'Results waiting for review',state:'review'};
 if(['cover','metadata','fresh'].some(k=>phase(k)==='paused'))return {name:'Recovery progress saved',state:'paused'};
 let seconds=Math.ceil((Number(s.cooldownUntil)||0-Date.now())/1000);
 if(seconds>0)return {name:'Cooldown · '+seconds+'s',state:'cooldown'};
 return {name:'All systems ready',state:'idle'};
}
function row(kind){
 const p=progress(kind),s=phase(kind),index=status().queued?.indexOf(kind)??-1;
 const value=p.total?Math.min(100,Math.max(0,Math.round(p.at/p.total*100))):0;
 const desc=s==='queued'?'Queue position '+(index+1):s==='running'&&p.total?p.at+' / '+p.total:s==='review'?'Manual review needed':s==='paused'?'Checkpoint saved':s;
 const controls=s==='queued'?'<button data-kind="'+kind+'" data-cmd="up">↑</button><button data-kind="'+kind+'" data-cmd="down">↓</button><button data-kind="'+kind+'" data-cmd="remove">Remove</button>'
 :s==='running'?'<button data-kind="'+kind+'" data-cmd="pause">Pause</button><button data-kind="'+kind+'" data-cmd="stop">Stop safely</button>'
 :s==='paused'?'<button data-kind="'+kind+'" data-cmd="resume">Resume</button>'
 :s==='review'?'<button data-kind="'+kind+'" data-cmd="review">Review</button>'
 :'<button data-tab="'+mapping[kind]+'">Configure</button>';
 return '<article class="mf429-job" data-state="'+escapeText(s)+'"><div class="mf429-job-head"><span class="mf429-job-icon">'+ico(mapping[kind])+'</span><div><strong>'+titles[kind]+'</strong><small>'+escapeText(desc)+'</small></div><span class="mf429-job-status">'+escapeText(s)+'</span></div>'+
 (p.total?'<div class="mf429-percent">Progress <b>'+value+'%</b></div><div class="mf429-track" role="progressbar" aria-label="'+titles[kind]+'" aria-valuenow="'+value+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+value+'%"></i></div>':'')+
 '<div class="mf429-job-actions">'+controls+'</div></article>';
}
function queueHTML(){
 return '<div class="mf429-tab-heading"><strong>Process Queue</strong><small>One network-intensive job at a time. Preserve checkpoints and reviews.</small></div>'+row('cover')+row('metadata')+row('fresh');
}
function removePortals(){
 for(const id of ['mf424-modal','mf428-metadata-modal','mf428-fresh-config']){
  const node=document.getElementById(id);if(node?.closest?.('#mf429-center'))node.remove();
 }
}
function embed(id){
 const modal=document.getElementById(id);
 if(!modal||!state.content)return false;
 const target=state.content.querySelector('.mf429-feature-port')||state.content;
 target.appendChild(modal);modal.classList.add('mf429-embedded');
 const shade=modal.querySelector('.mf424-shade,.mf428-meta-shade');if(shade)shade.hidden=true;
 const dialog=modal.querySelector('[role="dialog"]');dialog?.setAttribute('aria-modal','false');
 return true;
}
const originalCoverOpen=typeof App.mf425OpenConfig==='function'?App.mf425OpenConfig:null;
const originalMetadataOpen=typeof App.mf428MetadataOpen==='function'?App.mf428MetadataOpen:null;
const originalFreshOpen=typeof App.mf428FreshOpen==='function'?App.mf428FreshOpen:null;
function renderCurrent(){
 if(!state.content)return;
 removePortals();
 if(state.tab==='queue'){state.content.innerHTML=queueHTML();return;}
 if(state.tab==='covers'){
  state.content.innerHTML='<div class="mf429-tab-heading"><strong>Advanced Cover Recovery</strong><small>Original v428 recovery controls, scopes and providers.</small></div><div class="mf429-feature-port"></div>';
  const ctx=state.context?.tab==='covers'?state.context:null;
  originalCoverOpen?.(ctx?.entry||'settings',ctx?.id||'');
  if(!embed('mf424-modal'))state.content.insertAdjacentHTML('beforeend','<p class="mf429-message">Cover Recovery is unavailable. Try the Library Tools shortcut.</p>');
 }else if(state.tab==='metadata'){
  state.content.innerHTML='<div class="mf429-tab-heading"><strong>Advanced Metadata Recovery</strong><small>Choose fields and review before saving personal data.</small></div><div class="mf429-feature-port"></div>';
  const ctx=state.context?.tab==='metadata'?state.context:null;
  originalMetadataOpen?.(ctx?.entry||'settings',ctx?.id||'');
  if(!embed('mf428-metadata-modal'))state.content.insertAdjacentHTML('beforeend','<p class="mf429-message">Metadata Recovery is unavailable.</p>');
 }else if(state.tab==='fresh'){
  let html='';
  try{html=typeof v166SeasonalSettingsHtml==='function'?String(v166SeasonalSettingsHtml()):'';}catch(e){console.warn('v429 seasonal settings reuse',e);}
  state.content.innerHTML='<div class="mf429-tab-heading"><strong>Fresh Episodes & Releases</strong><small>The original Fresh Episodes settings and Smart Engine.</small></div><section class="mf429-anime-settings">'+(html||'<p>Anime provider settings are unavailable.</p>')+'</section>'+
  '<div class="mf429-tab-heading mf429-scan-heading"><strong>Other media releases</strong><small>Verified TV, manga, and existing release feeds.</small></div><div class="mf429-scan-actions"><button data-action="universal">Configure universal scan</button><button data-action="report">View results</button></div><div class="mf429-feature-port"></div>';
 }
}
function html(){
 const t=overview(),names={queue:'Queue',covers:'Covers',metadata:'Metadata',fresh:'Fresh Episodes'};
 return '<button class="mf429-launch" type="button" data-action="toggle" aria-controls="mf429-workspace" aria-expanded="'+state.expanded+'"><span class="mf429-brand">'+ico('covers',23)+'<span>'+ico('fresh',13)+'</span></span><span class="mf429-launch-copy"><strong>Recovery and Release Center</strong><small>'+escapeText(t.name)+'</small></span><span class="mf429-indicator" data-state="'+t.state+'"></span><span class="mf429-chevron">'+(state.expanded?'⌄':'⌃')+'</span></button>'+
 (state.expanded?'<section id="mf429-workspace" class="mf429-workspace" aria-label="Recovery and Release Center"><header class="mf429-head"><div class="mf429-heading-brand">'+ico('covers',23)+'</div><div><strong>Recovery and Release Center</strong><small>One home for your media intelligence</small></div><button data-action="toggle" aria-label="Minimize Center">−</button></header><nav class="mf429-tabs" role="tablist" aria-label="Center sections">'+TABS.map(id=>'<button type="button" data-tab="'+id+'" role="tab" aria-controls="mf429-tab" aria-selected="'+(state.tab===id)+'" class="'+(state.tab===id?'active':'')+'">'+ico(id,17)+'<span>'+names[id]+'</span></button>').join('')+'</nav><div class="mf429-tab-body" role="tabpanel" id="mf429-tab" tabindex="0"></div><footer class="mf429-foot"><span>Protected recovery · Theme aware</span><button data-tab="queue">Queue</button></footer></section>':'');
}
function render(){
 if(!document.body)return;switchAccount();
 const mode=visibility(),s=overview(),idle=s.state==='idle';
 if(mode==='hidden'||(mode==='auto'&&idle)){
  if(state.root){removePortals();state.root.remove();state.root=null;state.content=null;}
  return;
 }
 if(!state.root){state.root=document.createElement('aside');state.root.id='mf429-center';state.root.setAttribute('aria-label','Recovery and Release Center');state.root.addEventListener('click',onClick);document.body.appendChild(state.root);}
 removePortals();state.root.classList.toggle('open',state.expanded);state.root.innerHTML=html();
 state.content=state.root.querySelector('.mf429-tab-body');
 if(state.expanded)renderCurrent();
}
function choose(tab){if(!TABS.includes(tab))return;state.context=null;state.tab=tab;state.expanded=true;savePreference({tab,expanded:true});render();}
function openScoped(tab,entry='settings',id=''){
 if(!TABS.includes(tab))return;
 state.context={tab,entry:String(entry||'settings'),id:String(id||'')};
 state.tab=tab;state.expanded=true;
 savePreference({tab,expanded:true});render();
}
function toggle(){state.expanded=!state.expanded;savePreference({expanded:state.expanded});render();}
function queueCommand(kind,cmd){
 if(!['cover','metadata','fresh'].includes(kind))return;
 if(cmd==='up'||cmd==='down')return App.mf428Move?.(kind,cmd==='up'?-1:1);
 if(cmd==='remove')return App.mf428Cancel?.(kind);
 if(cmd==='review')return kind==='cover'?App.mf424Review?.():kind==='metadata'?App.mf428MetadataReview?.():App.mf428FreshReport?.();
 return App.mf428Control?.(kind,cmd);
}
function universal(){
 originalFreshOpen?.();
 embed('mf428-fresh-config');
}
function onClick(e){
 const button=e.target.closest('button');
 if(!button||!state.root?.contains(button))return;
 const tab=button.dataset.tab,action=button.dataset.action,cmd=button.dataset.cmd,kind=button.dataset.kind;
 if(tab){choose(tab);return;}
 if(action==='toggle'){toggle();return;}
 if(action==='universal'){universal();return;}
 if(action==='report'){App.mf428FreshReport?.();return;}
 if(action==='reopen'){renderCurrent();return;}
 if(kind&&cmd)queueCommand(kind,cmd);
}
function tick(){
 const mode=visibility();
 if(mode==='hidden'||(mode==='auto'&&overview().state==='idle')){if(state.root)render();return;}
 if(state.account!==account()){state.account='';render();return;}
 if(!state.root?.isConnected){state.root=null;render();return;}
 const next=overview(),sub=state.root.querySelector('.mf429-launch-copy small'),dot=state.root.querySelector('.mf429-indicator');
 if(sub&&sub.textContent!==next.name)sub.textContent=next.name;
 if(dot)dot.dataset.state=next.state;
 if(state.expanded&&state.tab==='queue'&&state.content&&!state.content.contains(document.activeElement)){
  const y=state.content.scrollTop;state.content.innerHTML=queueHTML();state.content.scrollTop=y;
 }
}
function init(){
 if(state.started||!document.body)return;
 state.started=true;
 document.body.classList.add('mf429-center-enabled');
 render();
 setInterval(tick,1600);
}
function centerSettingsHtml(){
 const mode=visibility();
 return '<section class="mf429-center-settings" aria-label="Recovery and Release Center preferences">'+
 '<strong>Recovery and Release Center</strong><p>Choose when the elegant bottom-left Center appears. All three recovery engines stay active regardless of visibility.</p>'+
 '<label for="mf429-visibility">Floating widget visibility</label><select id="mf429-visibility" onchange="App.mf429CenterVisibility(this.value)">'+
 [['hidden','Hidden'],['auto','Automatic — when work needs attention'],['always','Always Show — quick launch available']].map(x=>'<option value="'+x[0]+'" '+(mode===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select>'+
 '<small>Position: bottom-left. Remembers the last tab and minimized state.</small></section>';
}
if(typeof v405FloatingSettingsHtml==='function'){
 const before=v405FloatingSettingsHtml;
 v405FloatingSettingsHtml=function(){
  const html=String(before.apply(this,arguments)||''),end=html.lastIndexOf('</div>');
  return end>=0?html.slice(0,end)+centerSettingsHtml()+html.slice(end):html+centerSettingsHtml();
 };
}
if(typeof v366RegisterSetting==='function'){
 v366RegisterSetting({id:'v429-center-visibility',section:'v221-settings-floating-controls',
  selector:'#mf429-visibility',label:'Recovery and Release Center visibility',
  subgroup:'Background Operations',keywords:['recovery','release','bottom-left','floating','queue','metadata','covers','fresh','widget']});
}
function setVisibility(value){
 if(!['hidden','auto','always'].includes(value))return;
 savePreference({visibility:value});render();
}
// Route existing Library, Title Details, Settings and editor entry points to
// the identical original recovery form, preserving their scoped arguments.
if(originalCoverOpen)App.mf425OpenConfig=function(entry='settings',id=''){openScoped('covers',entry,id);};
if(originalMetadataOpen)App.mf428MetadataOpen=function(entry='settings',id=''){openScoped('metadata',entry,id);};
if(originalFreshOpen)App.mf428FreshOpen=function(){openScoped('fresh');universal();};
Object.assign(App,{mf429CenterTab:choose,mf429CenterToggle:toggle,mf429CenterQueue:queueCommand,mf429CenterVisibility:setVisibility});
window.MediaFlowV429Center={version:429,open(){if(!state.expanded)toggle();},tab:choose,toggle,status:()=>({tab:state.tab,expanded:state.expanded})};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();