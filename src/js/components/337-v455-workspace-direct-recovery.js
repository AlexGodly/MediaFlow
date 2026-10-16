/* MediaFlow v455 — one-click, settings-backed Unified Recovery execution.
 * Stays on original v424/v442 engines: verified requests, durable checkpoints,
 * leases, safety merges, cooldowns, and provider maximums are enforced there.
 */
const MF455_VERSION=455;
const MF455={search:{cover:'',metadata:'',both:'',categories:''},selected:{cover:null,metadata:null},
 scopeSignature:'',launching:false,afterStart:0};
function mf455Settings(kind){
 const raw=S.settings?.v455RecoveryProcessing?.[kind]||{};
 const mode=raw.mode==='one'?'one':'parts';
 const continuation=['automatic','manual'].includes(raw.continuation)?raw.continuation:'automatic';
 const partMode=['continuation','automatic','manual'].includes(raw.partMode)?raw.partMode:'automatic';
 const size=Math.max(1,Math.min(10000,Number(raw.partSize)||100));
 const selection=['hybrid','smart','priority','manual'].includes(raw.selection)?raw.selection:'hybrid';
 const protection=['safe','balanced','custom'].includes(raw.protection)?raw.protection:'safe';
 return {mode,partMode,partSize:size,continuation,selection,protection,
  autoResume:raw.autoResume!==false};
}
function mf455SaveSettings(kind,key,value){
 if(!['cover','metadata','both'].includes(kind)||!['mode','partMode','partSize','continuation','selection','protection','autoResume'].includes(key))return;
 S.settings=S.settings||{};
 const all={...(S.settings.v455RecoveryProcessing||{})};
 const current=mf455Settings(kind);
 let clean=value;
 if(key==='autoResume')clean=Boolean(value);
 else if(key==='partSize')clean=Math.max(1,Math.min(10000,Number(value)||100));
 else if(key==='mode')clean=value==='one'?'one':'parts';
 else if(key==='partMode')clean=['automatic','manual','continuation'].includes(value)?value:'automatic';
 else if(key==='continuation')clean=value==='manual'?'manual':'automatic';
 else if(key==='selection')clean=['hybrid','smart','priority','manual'].includes(value)?value:'hybrid';
 else if(key==='protection')clean=['safe','balanced','custom'].includes(value)?value:'safe';
 all[kind]={...current,[key]:clean};
 S.settings.v455RecoveryProcessing=all;
 Promise.resolve(saveState()).catch(err=>console.warn('Recovery processing settings not saved',err));
 const root=document.getElementById('mf445-workspace');
 if(root){
  const part=root.querySelector('[data-mf455-part]');
  if(part)part.hidden=mf455Settings(MF447.active==='both'?'both':MF445.mode).mode==='one';
 }
}
function mf455SelectHtml(kind,name,value,options){
 return '<label class="mf455-setting"><span>'+mf424Escape(name)+'</span><select onchange="App.mf455SaveSettings('+
 mf424Escape(JSON.stringify(kind))+','+mf424Escape(JSON.stringify(value))+',this.value)">'+
 options.map(([key,label])=>'<option value="'+key+'" '+(mf455Settings(kind)[value]===key?'selected':'')+'>'+
 mf424Escape(label)+'</option>').join('')+'</select></label>';
}
function mf455ProcessingHtml(kind){
 const s=mf455Settings(kind);
 return '<section class="mf455-processing" data-mf455-processing="'+kind+'">'+
 '<header><strong>'+mf425Icon('sliders',17)+' Processing & matching</strong><small>Saved per recovery mode</small></header>'+
 '<div class="mf455-settings-grid">'+
 mf455SelectHtml(kind,'Recovery mode','mode',[['parts','Part-by-Part'],['one','One-Go']])+
 mf455SelectHtml(kind,'Titles per part','partMode',[['continuation','Continuation'],['automatic','Automatic'],['manual','Manual']])+
 '<label class="mf455-setting" data-mf455-part '+(s.mode==='one'?'hidden':'')+'><span>Titles in each part</span><input type="number" min="1" max="10000" step="1" value="'+s.partSize+
 '" onchange="App.mf455SaveSettings('+mf424Escape(JSON.stringify(kind))+',&#39;partSize&#39;,this.value)"></label>'+
 mf455SelectHtml(kind,'Continue between parts','continuation',[['automatic','Automatic'],['manual','Manual confirmation']])+
 mf455SelectHtml(kind,kind==='cover'?'Cover selection':kind==='metadata'?'Metadata selection':'Selection policy','selection',
 [['hybrid','Hybrid'],['smart','Smart Automatic'],['priority','Provider Priority'],['manual','Manual Selection']])+
 mf455SelectHtml(kind,'Rate-limit protection','protection',[['safe','Safe'],['balanced','Balanced'],['custom','Custom (provider maximums enforced)']])+
 '<label class="mf455-setting mf455-resume"><input type="checkbox" '+(s.autoResume?'checked ':'')+
 'onchange="App.mf455SaveSettings('+mf424Escape(JSON.stringify(kind))+',&#39;autoResume&#39;,this.checked)">'+
 '<span>Resume when app reopens</span></label></div>'+
 '<p class="mf455-safe-note">Provider quotas and manual safety confirmations always override processing speed. Existing Library fields remain protected.</p></section>';
}
function mf455ScopeCategories(mode){
 if(MF445.oneId||MF445.metadataId){
  const one=mf439Item(MF445.oneId||MF445.metadataId);
  return one?.categoryId==null?[]:[String(one.categoryId)];
 }
 const scope=mf446State(mode==='both'?'cover':mode);
 if(['category','categoryStatus'].includes(scope.mode))return scope.categories.slice();
 const ids=mode==='both'?mf447ScopeSnapshot():mf446ScopeIds(mode);
 if(!ids.length)return [];
 const seen=new Set(),wanted=new Set(ids);
 for(const item of S.library||[])if(wanted.has(String(item.id)))seen.add(String(item.categoryId||''));
 return [...seen].filter(Boolean);
}
function mf455ApplyCategoryPreset(mode){
 const categories=mf455ScopeCategories(mode);
 const sig=mode+'|'+(mf446State(mode==='both'?'cover':mode)?.mode||'')+'|'+categories.join('|');
 if(MF455.scopeSignature===sig)return;
 MF455.scopeSignature=sig;
 for(const kind of mode==='both'?['cover','metadata']:[mode]){
  const cat=categories.length===1?categories[0]:null;
  MF455.selected[kind]=cat&&Array.isArray(mf453Presets()[cat]?.[kind])?
   mf453ProvidersFor(kind,cat).slice():null;
 }
}
const mf455BaseProviders=mf445Providers;
mf445Providers=function(mode){
 const items=mf455BaseProviders.apply(this,arguments);
 const root=document.getElementById('mf445-workspace');
 if(!root||!Array.isArray(MF455.selected[mode]))return items;
 const enabled=new Set(MF455.selected[mode]);
 return items.map(p=>({...p,enabled:enabled.has(p.id)}));
};
function mf455Enabled(mode){
 const configured=MF455.selected[mode];
 const rows=mf455BaseProviders(mode);
 return Array.isArray(configured)?configured.filter(id=>rows.some(p=>p.id===id&&p.available)):
  rows.filter(p=>p.enabled&&p.available).map(p=>p.id);
}
function mf455StoreSelection(kind,onOrId,enabled){
 const all=mf455BaseProviders(kind);
 const current=new Set(Array.isArray(MF455.selected[kind])?MF455.selected[kind]:
  all.filter(p=>p.enabled).map(p=>p.id));
 if(onOrId==='__all__'){if(enabled)all.filter(p=>p.available).forEach(p=>current.add(p.id));
  else current.clear();}
 else if(all.some(p=>p.id===onOrId)){if(enabled)current.add(onOrId);else current.delete(onOrId);}
 MF455.selected[kind]=[...current];
 mf455UpdateProviderUI(kind);
}
function mf455UpdateProviderUI(kind){
 const root=document.getElementById('mf445-workspace');if(!root)return;
 const area=[...root.querySelectorAll('.mf446-providers')].find(x=>
  x.querySelector('[data-mf455-kind="'+kind+'"]')||x.getAttribute('data-mf455-kind')===kind);
 if(!area)return;
 const set=new Set(MF455.selected[kind]||[]);
 for(const row of area.querySelectorAll('[data-mf446-provider]')){
  const id=row.dataset.mf446Provider,checkbox=row.querySelector('input[type="checkbox"]');
  if(checkbox)checkbox.checked=set.has(id);
  row.dataset.status=set.has(id)?'enabled':'disabled';
  const label=row.querySelector('.mf445-provider-status');
  if(label)label.textContent=set.has(id)?'Selected':'Disabled';
 }
 const count=area.querySelector('[data-mf446-provider-count]');
 if(count)count.textContent=mf455Enabled(kind).length+' ready selected · '+mf455BaseProviders(kind).length+' registered';
 const start=root.querySelectorAll('.mf445-actions button.btn-primary');
 const cover=mf455Enabled('cover').length,metadata=mf455Enabled('metadata').length;
 for(const button of start){
  const mode=MF447.active==='both'?'both':MF445.mode;
  const ids=mode==='both'?mf447ScopeSnapshot():mf446ScopeIds(mode);
  button.disabled=!ids.length||(mode==='both'?!(cover&&metadata):mode==='cover'?!cover:!metadata);
 }
}
const mf455OldToggle=App.mf446ToggleProvider,mf455OldAll=App.mf446ProviderAll;
App.mf446ToggleProvider=function(kind,id,on){
 if(document.getElementById('mf445-workspace'))return mf455StoreSelection(kind,id,on);
 return mf455OldToggle.apply(this,arguments);
};
App.mf446ProviderAll=function(kind,on){
 if(document.getElementById('mf445-workspace'))return mf455StoreSelection(kind,'__all__',on);
 return mf455OldAll.apply(this,arguments);
};
function mf455SearchWorkspace(el,kind){
 const needle=String(el.value||'').trim().toLowerCase();
 MF455.search[kind]=needle;
 const root=el.closest('.mf446-providers')||el.closest('.mf446-categories');
 for(const row of root?.querySelectorAll('[data-mf446-provider],.mf446-category')||[]){
  row.hidden=!String(row.textContent||'').toLowerCase().includes(needle);
 }
}
function mf455SearchFields(){
 return '<label class="mf455-search">'+mf425Icon('search',16)+
 '<input type="search" placeholder="Search categories..." aria-label="Search recovery categories" oninput="App.mf455SearchWorkspace(this,&#39;categories&#39;)"></label>';
}
function mf455EnhanceWorkspace(){
 const root=document.getElementById('mf445-workspace');if(!root)return;
 const mode=MF447.active==='both'?'both':MF445.mode;
 const pane=root.querySelector('[data-mf445-panel]');if(!pane)return;
 for(const kind of mode==='both'?['cover','metadata']:[mode]){
  const section=[...pane.querySelectorAll('.mf446-providers')].find(x=>
   !x.dataset.mf455Kind||x.dataset.mf455Kind===kind);
  if(!section||section.dataset.mf455Kind&&section.dataset.mf455Kind!==kind)continue;
  section.dataset.mf455Kind=kind;
  const heading=section.querySelector('header');
  if(heading&&!section.querySelector('.mf455-search'))heading.insertAdjacentHTML('afterend',
   '<label class="mf455-search">'+mf425Icon('search',15)+
   '<input type="search" placeholder="Search '+kind+' providers..." aria-label="Search '+kind+' providers" oninput="App.mf455SearchWorkspace(this,'+mf424Escape(JSON.stringify(kind))+')"></label>');
  mf455UpdateProviderUI(kind);
 }
 const cat=pane.querySelector('.mf446-categories');
 if(cat&&!cat.querySelector('.mf455-search'))cat.querySelector('summary')?.insertAdjacentHTML('afterend',mf455SearchFields());
 const scope=pane.querySelector('.mf446-scope');
 if(scope&&!pane.querySelector('[data-mf455-processing]'))scope.insertAdjacentHTML('afterend',mf455ProcessingHtml(mode));
 // Consistent launch entry; the old cover setup is never opened from here.
 const actions=pane.querySelector('.mf445-actions');
 if(actions){
  for(const button of actions.querySelectorAll('button.btn-primary')){
   const handler=button.getAttribute('onclick')||'';
   if(handler.includes('mf445Start')||handler.includes('mf447StartCombined')){
    button.textContent='Recover selected titles';
    button.dataset.v225Iconified='1';
    button.insertAdjacentHTML('afterbegin',mf425Icon('play',16)+' ');
    button.setAttribute('onclick','App.mf455Launch('+mf424Escape(JSON.stringify(mode))+')');
   }
  }
 }
}
const mf455OldPanel=mf445Panel;
mf445Panel=function(mode){
 // v447 redraws everything; derive provider preset BEFORE opening the pane.
 mf455ApplyCategoryPreset(mode);
 const result=mf455OldPanel.apply(this,arguments);
 mf455EnhanceWorkspace();return result;
};
App.mf445Panel=mf445Panel;
function mf455ReadyForNewJob(){
 const owner=typeof mf442ProcessLease==='function'?mf442ProcessLease():null;
 return !owner||owner.token===MF442.owner;
}
async function mf455ReplaceQueuedJobs(){
 if(typeof MF451!=='undefined'&&(MF451.journal||mf451Read()))
  throw Error('Finish the priority title before replacing its suspended queue.');
 if(!mf455ReadyForNewJob())throw Error('Another tab owns a recovery process.');
 if(MF424.running||MF439.working||MF442.process){
  if(!await mf451PauseActive())throw Error('The old process could not safely stop.');
 }
 if(MF424.running||MF439.working||MF442.process)throw Error('Wait for the current title checkpoint.');
 if(MF424.job){MF424.job.stopRequested=true;MF424.job.pauseRequested=true;await mf424SaveJob();}
 if(MF439.job){MF439.job.stopRequested=true;MF439.cancel=true;mf439SaveJob();}
 if(typeof mf447WriteCombo==='function')mf447WriteCombo(null);

}
function mf455JobProviders(kind){
 const selected=mf455Enabled(kind);
 if(!selected.length)throw Error('Select at least one available '+kind+' provider.');
 return selected;
}
const mf455BaseCoverDefaults=mf424Defaults,mf455BaseMetaDefaults=mf439Preferences;
mf424Defaults=function(){
 const prefs=mf455BaseCoverDefaults.apply(this,arguments);
 const job=MF424.job;
 if(job?.v455Providers&&job.account===mf424Account())
  return {...prefs,enabled:job.v455Providers,
   selection:job.v455Selection||prefs.selection,protection:job.v455Protection||prefs.protection};
 return prefs;
};
mf439Preferences=function(){
 const prefs=mf455BaseMetaDefaults.apply(this,arguments);
 const job=MF439.job;
 if(job?.v455Providers&&job.account===mf439Account())
  return {...prefs,enabled:job.v455Providers};
 return prefs;
};
function mf455CoverJob(ids,providers,mode,options){
 const found=new Set((S.library||[]).filter(item=>item?.id!=null&&mf424Missing(item)).map(t=>String(t.id)));
 const targets=ids.filter(id=>found.has(id));
 if(!targets.length)return null;
 const partSize=options.partMode==='automatic'?Math.max(1,Math.min(1000,Math.ceil(targets.length/10))):
  Math.max(1,options.partSize);
 return {id:'mf455-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),account:mf424Account(),created:Date.now(),updated:Date.now(),ended:0,
  ids:targets,cursor:0,scope:{mode:'selected',ids:targets},mode:options.mode==='one'?'one':'parts',
  partSize,continuation:options.continuation,status:'ready',fixed:0,unresolved:0,skipped:0,
  failed:0,pending:0,processed:0,dirty:0,requestCount:0,cooldownEvents:0,rate:{},
  unresolvedIds:[],results:[],reviews:[],stopRequested:false,pauseRequested:false,
  stopAfterPart:false,v455Providers:providers,v455Selection:options.selection==='manual'?'manual':
   options.selection==='priority'?'hybrid':options.selection==='smart'?'smart': 'hybrid',
  v455Protection:options.protection,autoResume:options.autoResume};
}
async function mf455Launch(kind){
 if(MF455.launching)return;
 kind=['cover','metadata','both'].includes(kind)?kind:'cover';
 mf456LaunchStage('validating','Checking selected titles and available providers…',kind);
 const ids=(kind==='both'?mf447ScopeSnapshot():mf446ScopeIds(kind)).map(String);
 const valid=new Set((S.library||[]).map(item=>String(item?.id||'')));
 const chosen=[...new Set(ids.filter(id=>valid.has(id)))];
 if(!chosen.length){mf456LaunchStage('error','No titles in scope. Choose All, Library, a category, or check Library titles.',kind);showToast('Choose saved Library titles before starting recovery.');return;}
 if(!AUTH_USER){mf456LaunchStage('error','Sign in to start recovery.',kind);showToast('Sign in before recovering.');return;}
 if((kind==='cover'||kind==='both')&&!MF424.ready){mf456LaunchStage('error','Cover storage is still initializing; retry after readiness.',kind);showToast('Cover Recovery is initializing.');return;}
 MF455.launching=true;
 try{
  const coverIds=kind==='metadata'?[]:mf455JobProviders('cover');
  const metaIds=kind==='cover'?[]:mf455JobProviders('metadata');
  const allowed=Math.max(1,Math.min(250,Number(mf439Preferences().maxBatch)||250));
  const bounded=kind==='cover'?chosen:chosen.slice(0,allowed);
  const prefs=mf455Settings(kind);
  const cover=kind==='metadata'?null:mf455CoverJob(bounded,coverIds,kind,prefs);
  if(kind==='cover'&&!cover){mf456LaunchStage('error','No missing covers in scope. To replace existing artwork, open Quick Cover Recovery for the title.',kind);showToast('Selected titles already have covers. Use a title’s Quick Cover Recovery to replace existing artwork.');return;}
  mf456LaunchStage('confirming','Review the new recovery queue and confirm to start.',kind);
  if(!await mf444Confirm('Start '+(kind==='both'?'Cover + Metadata':kind==='cover'?'Cover':'Metadata')+' Recovery?',
    bounded.length+' titles in scope. This replaces any previous unfinished queue after its current title is safely checkpointed. Completed Library changes remain saved.',
    'Replace Queue & Start',false,bounded.length,kind==='cover'?'cover':'metadata')){
   mf456LaunchStage('cancelled','Recovery launch cancelled; existing queues unchanged.',kind);return;
  }
  mf456LaunchStage('stopping','Stopping previous jobs at safe checkpoints before replacement…',kind);
  await mf455ReplaceQueuedJobs();
  mf456LaunchStage('queue','Creating a durable new job and provider snapshot…',kind);
  // Jobs own immutable source selection and settings snapshots, so later
  // changes in Settings never mutate a running job’s API list.
  if(cover){
   MF424.job=cover;MF424.account=mf424Account();
   await mf424SaveJob();
  }else if(kind!=='metadata')MF424.job=null;
  if(kind==='both'){
   mf447WriteCombo({schema:1,account:mf439Account(),ids:bounded,
    created:Date.now(),stage:cover?'cover':'ready-metadata',coverId:cover?.id||null,
    v455Direct:true,v455MetaProviders:metaIds});
  }
  if(kind==='metadata'){
   MF439.job=mf455MetadataOptions('metadata',bounded,metaIds);
   mf439SaveJob();
  }
  mf445Close();
  mf456LaunchStage('starting','Queue saved. Waiting for provider lease and first title…',kind);
  MF455.afterStart=Date.now();mf441Paint();
  if(cover)void mf424Run(); // Existing lease safety, cooldown and progress.
  else if(kind==='metadata')void mf439RunBatch();
  else if(kind==='both')void mf447ContinueCombined();
  mf456LaunchStage('queued','New queue saved for '+bounded.length+' title(s). Waiting for first engine checkpoint.',kind);
  mf456WatchRecovery(kind);
  showToast('New '+kind+' recovery queue created: '+bounded.length+' title(s). Check Background Processes.');
 }catch(err){console.warn('v455 unified recovery start failed',err);
  mf456LaunchStage('error','Recovery not started: '+String(err?.message||err).slice(0,170),kind);
  showToast('Recovery not started: '+String(err?.message||err).slice(0,170));}
 finally{MF455.launching=false;}
}
App.mf455Launch=mf455Launch;
App.mf455SaveSettings=mf455SaveSettings;
App.mf455SearchWorkspace=mf455SearchWorkspace;
window.MediaFlowV455=Object.freeze({version:455,settings:mf455Settings,processing:mf455ProcessingHtml,
 search:mf455SearchWorkspace,scope:mf455ScopeCategories,launch:mf455Launch,
 selected:()=>MF455.selected,ready:mf455Enabled});
