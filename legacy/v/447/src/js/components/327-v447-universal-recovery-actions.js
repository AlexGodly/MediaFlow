/* MediaFlow v447 — universal recovery shortcuts and real sequential Cover → Metadata.
 * Existing v424, v439 and v442 engines own all writes, user confirmations, locks
 * and checkpoints. This module only supplies entry points and a scoped handoff.
 */
const MF447_VERSION=447;
const MF447_SHORTCUTS=['floating','library','editor','details','collections','order','widget'];
const MF447={active:'cover',keepCombined:false,contextIds:null,contextLabel:'',arming:null,handoff:false};
const mf447Escape=x=>mf424Escape(String(x??''));
function mf447Prefs(){
 const data=S.settings?.v447RecoveryShortcuts||{};
 return Object.fromEntries(MF447_SHORTCUTS.map(key=>[key,data[key]!==false]));
}
function mf447SaveShortcut(key,on){
 if(!MF447_SHORTCUTS.includes(key))return;
 S.settings=S.settings||{};S.settings.v447RecoveryShortcuts={...mf447Prefs(),[key]:Boolean(on)};
 Promise.resolve(saveState()).catch(err=>console.warn('Shortcut preference not saved',err));
 if(key==='floating')try{render();}catch(_){}
 if(key==='widget')mf441Paint();
 showToast('Recovery shortcut preference saved.');
}
function mf447AllowedIds(ids){
 const available=new Set((S.library||[]).filter(x=>x?.id!=null).map(x=>String(x.id)));
 return [...new Set((Array.isArray(ids)?ids:[]).map(String).filter(id=>available.has(id)))];
}
function mf447ScopeSnapshot(){
 const scope=MF447.contextIds&&mf446State('cover').mode==='selected'?
  mf447AllowedIds(MF447.contextIds):mf446ScopeIds('cover');
 return mf447AllowedIds(scope);
}
function mf447ComboKey(){return 'mediaflow-v447-combined:'+mf439Account();}
function mf447ReadCombo(){
 try{
  const raw=JSON.parse(localStorage.getItem(mf447ComboKey())||'null');
  if(!raw||raw.schema!==1||raw.account!==mf439Account()||
     !['cover','ready-metadata','metadata','completed'].includes(raw.stage)||
     !Array.isArray(raw.ids)||raw.ids.length>250)return null;
  // Widget paints must not scan the entire Library (100k titles possible).
  // Resolve membership against the current account only at stage transitions.
  const ids=[...new Set(raw.ids.filter(id=>['string','number'].includes(typeof id)).map(String).filter(Boolean))];
  if(ids.length!==raw.ids.length)return null;
  return {...raw,ids};
 }catch(_){return null;}
}
function mf447WriteCombo(combo){
 try{
  if(combo)localStorage.setItem(mf447ComboKey(),JSON.stringify(combo));
  else localStorage.removeItem(mf447ComboKey());
 }catch(err){console.warn('Combined recovery checkpoint unavailable',err);showToast('Combined handoff could not be saved. Use independent recovery actions.');}
}
function mf447Combo(){return mf447ReadCombo();}
async function mf447ClearCombo(){
 if(MF447.handoff||MF424.running||MF439.working){showToast('Pause the active recovery first.');return;}
 const combo=mf447Combo();
 if(combo&&combo.stage!=='completed'&&
    !await mf444Confirm('Clear combined recovery shortcut?',
    'Remove the combined-stage handoff. Existing cover and metadata checkpoints and recovered Library fields remain unchanged.',
    'Clear Handoff',true,combo.ids.length,'cover'))return;
 mf447WriteCombo(null);mf441Paint();
}
function mf447Open(kind='cover',options={}){
 if(!['cover','metadata','both'].includes(kind))kind='cover';
 MF447.active=kind;
 const ids=Array.isArray(options?.ids)?mf447AllowedIds(options.ids):null;
 if(ids&&!ids.length){showToast('This collection or queue has no saved Library titles to recover.');return;}
 MF447.contextIds=ids?.length?ids:null;
 MF447.contextLabel=ids?.length?String(options.label||'Selected titles'):'';
 if(ids?.length){
  MF446.draft.cover={...mf446State('cover'),mode:'selected'};
  MF446.draft.metadata={...mf446State('metadata'),mode:'selected'};
 }else if(!options?.id&&typeof mf436SelectedLibraryIds==='function'&&mf436SelectedLibraryIds().length&&
          ['cover','metadata','both'].includes(kind)){
  // A quick action should initially honor checked titles, without removing
  // the option to switch to All, current Library, or categories.
  MF446.draft.cover={...mf446State('cover'),mode:'selected'};
  MF446.draft.metadata={...mf446State('metadata'),mode:'selected'};
 }
 mf445Open(kind==='both'?'cover':kind,{entry:options?.entry||'shortcut',id:options?.id||''});
 if(kind==='both')mf445Panel('both');
}
const mf447OriginalClose=mf445Close;
mf445Close=function(){
 const result=mf447OriginalClose.apply(this,arguments);
 MF447.contextIds=null;MF447.contextLabel='';MF447.active='cover';
 return result;
};
App.mf445Close=mf445Close;
const mf447PreviousScopeIds=mf446ScopeIds;
mf446ScopeIds=function(mode){
 if(MF447.contextIds&&mf446State(mode).mode==='selected'&&
    !(mode==='cover'?MF445.oneId:MF445.metadataId))return mf447AllowedIds(MF447.contextIds);
 return mf447PreviousScopeIds.apply(this,arguments);
};
function mf447EnhanceTabs(){
 const root=document.getElementById('mf445-workspace'),tabs=root?.querySelector('.mf445-tabs');
 if(!tabs||tabs.querySelector('[data-mf445-tab="both"]'))return;
 const btn=document.createElement('button');btn.type='button';btn.role='tab';
 btn.id='mf445-tab-both';btn.dataset.mf445Tab='both';btn.setAttribute('aria-controls','mf445-panel');
 btn.innerHTML=mf425Icon('layers',17)+' Recover Both';
 btn.addEventListener('click',()=>mf445Panel('both'));
 tabs.appendChild(btn);tabs.classList.add('mf447-three-tabs');
}
function mf447BothPanel(){
 const root=document.getElementById('mf445-workspace'),pane=root?.querySelector('[data-mf445-panel]');
 if(!pane)return;
 const ids=mf447ScopeSnapshot(),cap=mf439Preferences().maxBatch;
 const coverReady=mf445Providers('cover').some(p=>p.available&&p.enabled);
 const metadataReady=mf445Providers('metadata').some(p=>p.available&&p.enabled);
 root.querySelectorAll('[data-mf445-tab]').forEach(btn=>{
  const active=btn.dataset.mf445Tab==='both';btn.setAttribute('aria-selected',String(active));btn.tabIndex=active?0:-1;
 });
 pane.setAttribute('aria-labelledby','mf445-tab-both');
 pane.innerHTML='<p class="mf445-intro">Cover Recovery runs first. After its final review is resolved, Metadata Recovery starts only with your confirmation. Both engines keep their independent provider and safety settings.</p>'+
  '<div class="mf445-summary"><span>'+mf425Icon('layers',17)+' <strong>'+ids.length.toLocaleString()+
  '</strong> titles in scope</span><span>'+mf425Icon('shield',16)+' Two protected stages</span></div>'+
  (MF447.contextLabel?'<p class="mf447-context">'+mf425Icon('check',15)+' '+mf447Escape(MF447.contextLabel)+' · switch scope at any time</p>':'')+
  mf446ScopeHtml('cover')+
  '<div class="mf447-stage"><strong>'+mf425Icon('images',18)+' 1. Cover providers</strong>'+
  mf446SourceHtml('cover')+'</div>'+
  '<div class="mf447-stage"><strong>'+mf425Icon('database',18)+' 2. Metadata providers</strong>'+
  mf446SourceHtml('metadata')+'</div>'+
  '<div class="mf447-combined-note">'+mf425Icon('shield',17)+
  ' Both stages use the same title snapshot, with a maximum of '+cap.toLocaleString()+
  ' titles per combined job. Any larger scope is limited to the first '+cap.toLocaleString()+
  ' saved titles. Manual cover reviews must be resolved before metadata begins.</div>'+
  '<div class="mf445-actions"><button type="button" class="btn btn-primary" '+(!ids.length||!coverReady||!metadataReady?'disabled':'')+
  ' onclick="App.mf447StartCombined()">'+mf425Icon('layers',18)+' Configure Combined Recovery</button>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf445Settings(\'v221-settings-recovery-workspace\')">'+mf425Icon('settings',16)+' Recovery settings</button></div>';
}
const mf447PreviousPanel=mf445Panel;
mf445Panel=function(mode){
 const both=mode==='both'||(MF447.keepCombined&&mode==='cover');
 MF447.active=both?'both':mode;
 mf447PreviousPanel(both?'cover':mode);
 mf447EnhanceTabs();
 if(both)mf447BothPanel();
 else document.querySelectorAll('#mf445-workspace [data-mf445-tab="both"]').forEach(el=>{el.setAttribute('aria-selected','false');el.tabIndex=-1;});
};
App.mf445Panel=mf445Panel;App.mf445Open=mf447Open;
for(const name of ['mf446SelectScope','mf446ToggleCategory','mf446ToggleStatus','mf446AllCategories']){
 const previous=App[name];
 App[name]=function(){
  if(MF447.active!=='both')return previous.apply(this,arguments);
  MF447.keepCombined=true;
  try{return previous.apply(this,arguments);}
  finally{MF447.keepCombined=false;}
 };
}
function mf447ApiReady(kind){return mf445Providers(kind).some(p=>p.available&&p.enabled);}
function mf447StartCombined(){
 if(!AUTH_USER||!MF424.ready){showToast('Sign in and let Cover Recovery initialize first.');return;}
 if(MF424.running||MF439.working){showToast('Pause the active recovery process before starting another job.');return;}
 if(!mf447ApiReady('cover')||!mf447ApiReady('metadata')){
  showToast('Enable at least one available provider for each recovery engine.');return;
 }
 const previous=mf447Combo();
 if(previous&&!['completed'].includes(previous.stage)){
  showToast('A combined recovery is unfinished. Complete or clear it before starting a new one.');return;
 }
 const ids=mf447ScopeSnapshot(),max=mf439Preferences().maxBatch,selected=ids.slice(0,max);
 if(!selected.length){showToast('Choose at least one saved Library title.');return;}
 if(ids.length>max)showToast('Combined Recovery uses the first '+max+' titles in the chosen scope. The original scope remains unchanged.');
 const missing=new Set((S.library||[]).filter(mf424Missing).map(x=>String(x.id)));
 MF447.arming={schema:1,account:mf439Account(),ids:selected,created:Date.now(),stage:'configuring',coverId:null};
 if(!selected.some(id=>missing.has(id))){
  // Nothing to search in the cover stage. Metadata still requires its own
  // explicit confirmation through the existing v439/v442 engine.
  const intent={...MF447.arming,stage:'ready-metadata',coverId:null};
  MF447.arming=null;mf447WriteCombo(intent);mf445Close();
  showToast('All scoped titles already have covers. Confirm the Metadata Recovery stage.');
  void mf447ContinueCombined();return;
 }
 const result=App.mf445Start('cover'); // Existing v446 scope → original v425 config.
 const input=document.querySelector('#mf425-scope [name="mf425-scope-mode"]');
 if(!input){
  MF447.arming=null;showToast('Could not open the Cover Recovery configuration.');return result;
 }
 if(!MF425.oneId){
  MF425.selected=selected.slice();MF425.locked=false;input.value='selected';
  const option=input.querySelector('option[value="selected"]');
  if(option)option.textContent='Combined Recovery · '+selected.length+' titles';
  mf425ScopeChange();
 }
 return result;
}
const mf447OriginalStartCover=App.mf424Start;
App.mf424Start=async function(){
 const old=MF424.job?.id||'';
 const armed=MF447.arming;
 const result=await mf447OriginalStartCover.apply(this,arguments);
 if(armed&&MF447.arming===armed&&MF424.job?.id&&MF424.job.id!==old&&
    Array.isArray(MF424.job.ids)){
  // Only arm after the original confirmation and durable cover job creation.
  mf447WriteCombo({...armed,stage:'cover',coverId:MF424.job.id});
  MF447.arming=null;mf447CheckCombo();
 }
 return result;
};
function mf447CheckCombo(){
 const combo=mf447Combo();if(!combo)return;
 if(combo.stage==='cover'){
  const job=MF424.job;
  if(!job||job.id!==combo.coverId||job.account!==mf424Account())return;
  if(job.status!=='complete'||MF424.running||Number(job.pending)>0)return;
  const ready={...combo,stage:'ready-metadata'};
  mf447WriteCombo(ready);showToast('Cover stage complete. Metadata Recovery is ready for confirmation.');
  mf441Paint();
  if(!MF447.handoff)queueMicrotask(()=>{void mf447ContinueCombined();});
 }else if(combo.stage==='metadata'){
  const job=MF439.job||mf439ReadJob();
  if(job&&job.status==='completed'&&job.startedAt===combo.metadataAt){
   mf447WriteCombo({...combo,stage:'completed'});
   showToast('Cover + Metadata Recovery completed.');
   mf441Paint();
  }
 }
}
const mf447OriginalShowWidget=mf441Show;
mf441Show=function(prefs,state){
 if(prefs.visibility==='hidden')return false;
 const combo=mf447Combo();
 if(combo&&combo.stage!=='completed')return true;
 return mf447OriginalShowWidget.apply(this,arguments);
};
const mf447OriginalCoverPaint=mf424Paint;
mf424Paint=function(){
 const result=mf447OriginalCoverPaint.apply(this,arguments);
 const combo=mf447Combo();
 if(combo?.stage==='cover'&&MF424.job?.id===combo.coverId&&
    MF424.job.status==='complete'&&!MF424.running){
  queueMicrotask(mf447CheckCombo);
 }
 return result;
};
const mf447OriginalRunCover=mf424Run;
mf424Run=async function(){
 const result=await mf447OriginalRunCover.apply(this,arguments);
 mf447CheckCombo();return result;
};
const mf447OriginalPaintMetadata=mf439PaintJob;
mf439PaintJob=function(){
 const result=mf447OriginalPaintMetadata.apply(this,arguments);
 if(MF439.job?.status==='completed'&&!MF439.working)mf447CheckCombo();
 return result;
};
async function mf447ContinueCombined(){
 if(MF447.handoff)return;
 const combo=mf447Combo();if(!combo||combo.stage!=='ready-metadata')return;
 if(combo.coverId){
  const job=MF424.job;
  if(!job||job.id!==combo.coverId||job.account!==mf424Account()||job.status!=='complete'||MF424.running){
   showToast('Finish the matching Cover Recovery job and all pending reviews before continuing.');return;
  }
 }
 if(MF439.working||MF424.running){showToast('Finish the active recovery stage first.');return;}
 const ids=mf447AllowedIds(combo.ids).slice(0,mf439Preferences().maxBatch);
 if(!ids.length||!mf447ApiReady('metadata')){showToast('Enable a metadata provider and keep the saved titles available.');return;}
 MF447.handoff=true;const previous=MF439.job;
 MF446.pendingBatchIds=ids;
 try{
  await App.mf439ConfirmBatch(); // User confirmation + existing lease/overwrite safeguards.
  if(MF439.job&&MF439.job!==previous&&Array.isArray(MF439.job.ids)&&
     MF439.job.ids.length===ids.length&&MF439.job.ids.every((id,i)=>String(id)===ids[i])){
   mf447WriteCombo({...combo,stage:'metadata',metadataAt:MF439.job.startedAt});
   mf447CheckCombo();
  }else showToast('Metadata stage not started. Continue it later from Background Processes.');
 }catch(err){console.warn('Combined metadata handoff failed:',err);showToast('Metadata stage not started; saved cover progress is safe.');}
 finally{MF446.pendingBatchIds=null;MF447.handoff=false;mf441Paint();}
}
function mf447ComboControls(){
 const combo=mf447Combo();
 if(!combo)return '';
 const job=combo.stage==='cover'?MF424.job:combo.stage==='metadata'?(MF439.job||mf439ReadJob()):null;
 const done=combo.stage==='completed',ready=combo.stage==='ready-metadata';
 return '<div class="mf447-combo-status" role="status"><span>'+mf425Icon('layers',16)+
  ' <strong>Combined Recovery</strong><small>'+mf447Escape(done?'Complete':ready?'Cover complete · metadata confirmation needed':
   combo.stage==='cover'?'Cover stage · '+String(job?.status||'waiting'):
   'Metadata stage · '+String(job?.status||'running'))+'</small></span>'+
  (ready?'<button type="button" onclick="App.mf447ContinueCombined()">'+mf425Icon('database',15)+' Continue Metadata</button>':'')+
  ((done||combo.stage==='cover'&&(!job||job.id!==combo.coverId||job.status==='stopped')||combo.stage==='metadata'&&job?.status==='paused')?'<button type="button" onclick="App.mf447ClearCombo()">'+mf425Icon('x',15)+' '+(done?'Dismiss':'Clear Handoff')+'</button>':'')+
  '</div>';
}
const mf447OriginalWidget=mf441WidgetHtml;
mf441WidgetHtml=function(prefs,state){
 let html=mf447OriginalWidget.apply(this,arguments);
 if(!mf447Prefs().widget)return html;
 const anchor='<div class="mf441-widget-foot mf446-widget-foot">';
 if(html.includes(anchor))html=html.replace(anchor,mf447ComboControls()+anchor);
 return html.replace(anchor,anchor+'<button type="button" onclick="App.mf447Open(\'both\',{entry:\'floating\'})">'+
  mf425Icon('layers',15)+' Recover Both</button>');
};
const mf447Actions=[
 ['cover','Cover Recovery','images'],['metadata','Metadata Recovery','database'],['both','Recover Both','layers']
];
function mf447Buttons(options={}){
 const compact=options.compact!==false,ids=options.ids||null;
 const arg=ids?{ids,label:options.label||'Selected titles'}:options.id?{id:options.id}:{entry:options.entry||'shortcut'};
 const serialized=mf447Escape(JSON.stringify(arg));
 return '<div class="mf447-shortcut-group" role="group" aria-label="Recovery actions">'+
  mf447Actions.map(([kind,label,icon])=>'<button type="button" class="btn '+(compact?'btn-sm ':'')+'btn-ghost" '+
   'onclick="App.mf447Open(\''+kind+'\','+serialized+')" title="'+label+'">'+mf425Icon(icon,16)+' '+label+'</button>').join('')+'</div>';
}
const mf447PreviousDetails=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 let html=mf447PreviousDetails.apply(this,arguments);
 if(!mf447Prefs().details||item?.id==null)return html;
 // Replace v445's cover-only "combined" link with a real two-stage route.
 html=html.replace(/onclick="App\.mf445Open\('cover',\{id:/g,'onclick="App.mf447Open(\'both\',{id:');
 const id=mf447Escape(JSON.stringify(String(item.id)));
 const buttons='<button class="btn btn-sm btn-ghost" type="button" onclick="App.mf447Open(\'cover\',{id:'+id+'})">'+mf425Icon('images',16)+' Fix Cover</button>'+
  '<button class="btn btn-sm btn-ghost" type="button" onclick="App.mf447Open(\'metadata\',{id:'+id+'})">'+mf425Icon('database',16)+' Fix Metadata</button>';
 // The original v439 Fix Metadata action remains; avoid a duplicate button.
 return html.includes('data-mf439-details-action="1"')?
  html.replace(/(<div class="v181-detail-actions"[^>]*>)/,'$1'+buttons.replace(/<button class="btn btn-sm btn-ghost" type="button" onclick="App\.mf447Open\('metadata',[\s\S]*?<\/button>/,'') ):
  html.replace(/(<div class="v181-detail-actions"[^>]*>)/,'$1'+buttons);
};
const mf447PreviousEditor=libraryModalHtml;
libraryModalHtml=function(item){
 let html=String(mf447PreviousEditor.apply(this,arguments)||'');
 if(!mf447Prefs().editor||!item?.id)return html;
 const buttons=mf447Buttons({id:String(item.id)});
 if(html.includes('mf439-editor-action'))return html.replace('<div class="mf439-editor-action">','<div class="mf439-editor-action mf447-editor-actions">'+buttons);
 if(html.includes('mf425-editor-tools'))return html.replace(/(<div class="mf425-editor-tools"[^>]*>)/,'$1'+buttons);
 return html;
};
const mf447PreviousLibrary=renderLibrary;
renderLibrary=function(){
 let html=String(mf447PreviousLibrary.apply(this,arguments)||'');
 if(!mf447Prefs().library||!html.includes('mf425-tools-button'))return html;
 const button=/<button[^>]*mf425-tools-button[^>]*>[\s\S]*?<\/button>/;
 return html.replace(button,match=>match+mf447Buttons({entry:'library'}));
};
const mf447PreviousCollection=v274CollectionDetailHtml;
v274CollectionDetailHtml=function(c){
 const html=mf447PreviousCollection.apply(this,arguments);
 if(!mf447Prefs().collections||!c)return html;
 const ids=mf447AllowedIds(c.titleIds);
 return html.replace('<div class="mf274-hero-actions">','<div class="mf274-hero-actions">'+
  mf447Buttons({ids,label:'Collection: '+String(c.title||'Untitled')}));
};
const mf447PreviousQuickbar=v354QuickBar;
v354QuickBar=function(){
 const html=mf447PreviousQuickbar.apply(this,arguments);
 if(!mf447Prefs().order)return html;
 // Personal Order is a distinct title queue, not the entire Library.
 const ids=typeof v138OrderedItems==='function'?
  mf447AllowedIds(v138OrderedItems().map(item=>item?.id).filter(Boolean)):[];
 return html.replace('<div class="mf354-quick-switch"',mf447Buttons({ids,label:'Personal Order titles'})+'<div class="mf354-quick-switch"');
};
const mf447PreviousFloat=mf397Markup;
mf397Markup=function(){
 let html=mf447PreviousFloat.apply(this,arguments);
 if(!mf447Prefs().floating)return html.replace(/<button[^>]*mf436-cover-action[^>]*>[\s\S]*?<\/button>/,'');
 const target='      </div>\n      <button type="button" id="mf397-fab"';
 if(!html.includes(target))return html;
 const additions=[
  ['metadataRecovery','New Metadata Recovery','database','05'],
  ['bothRecovery','New Combined Recovery','layers','06']
 ].map(([action,label,icon,n])=>
  '        <button type="button" class="mf397-fan-action mf447-float-action" data-action="'+action+'">'+
  '<span class="mf397-action-symbol">'+mf425Icon(icon,20)+'</span>'+
  '<span><strong>'+label+'</strong><small>Configure in the unified workspace</small></span><em>'+n+'</em></button>\n').join('');
 return html.replace(target,additions+target);
};
const mf447PreviousFloatAction=mf397Action;
mf397Action=function(action){
 if(['coverRecovery','metadataRecovery','bothRecovery'].includes(action)){
  mf397SetMenu(false);
  if(!AUTH_USER){showToast('Sign in before starting recovery.');return;}
  if((action==='coverRecovery'||action==='bothRecovery')&&!MF424.ready){
   showToast('Cover Recovery is initializing; open this action once storage is ready.');return;
  }
  return mf447Open(action==='bothRecovery'?'both':action==='metadataRecovery'?'metadata':'cover',{entry:'floating'});
 }
 return mf447PreviousFloatAction.apply(this,arguments);
};
const mf447PreviousSettings=mf441WorkspaceHtml;
mf441WorkspaceHtml=function(){
 const html=mf447PreviousSettings.apply(this,arguments);
 const inputs=MF447_SHORTCUTS.map(key=>{
  const titles={floating:'Floating + menu',library:'Library toolbar',editor:'Add/Edit Title (saved titles)',details:'Title Details',
   collections:'Collection details',order:'Personal Order',widget:'Background Processes widget'};
  return '<label><input type="checkbox" '+(mf447Prefs()[key]?'checked ':'')+
   'onchange="App.mf447SaveShortcut(\''+key+'\',this.checked)">'+mf447Escape(titles[key])+'</label>';
 }).join('');
 const section='<fieldset class="mf447-settings-shortcuts"><legend>'+mf425Icon('layers',16)+' Recovery Actions & Shortcuts</legend>'+
  '<p>Enable or hide shortcut groups without changing the recovery engines, provider preferences or saved jobs.</p>'+
  '<div>'+inputs+'</div><button type="button" class="btn btn-ghost" onclick="App.mf447Open(\'both\')">'+
  mf425Icon('layers',16)+' Open Combined Recovery</button></fieldset>';
 const anchor='<fieldset class="mf441-widget-preferences">';
 return html.includes(anchor)?html.replace(anchor,section+anchor):html+section;
};
document.addEventListener('DOMContentLoaded',()=>{ // Resume safe handoff visibility without auto-scanning.
 const combo=mf447Combo();if(combo?.stage==='ready-metadata')mf441Paint();
},{once:true});
Object.assign(App,{mf447Open,mf447SaveShortcut,mf447StartCombined,mf447ContinueCombined,
 mf447ClearCombo,mf447CheckCombo});
window.MediaFlowV447=Object.freeze({version:447,open:mf447Open,buttons:mf447Buttons,
 prefs:mf447Prefs,scope:mf447ScopeSnapshot,combo:mf447Combo,check:mf447CheckCombo,
 shortcuts:MF447_SHORTCUTS.slice()});
