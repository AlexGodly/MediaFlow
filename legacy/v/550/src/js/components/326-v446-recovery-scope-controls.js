/* MediaFlow v446 — actionable unified recovery provider toggles and five safe scopes.
 * v424/v425 and v439/v442 still own all provider calls, job queues, locks,
 * confirmations and title writes; the workspace only selects immutable inputs.
 */
const MF446_VERSION=446;
const MF446_STATUS=[['planned','Planned'],['active','Active'],['paused','On Hold'],['completed','Completed'],['dropped','Dropped']];
const MF446_MODES=[['all','All'],['library','Library'],['category','By Category'],['categoryStatus','By Category → Status'],['selected','Selected Titles']];
const MF446={draft:{cover:null,metadata:null},pendingBatchIds:null,coverPreparedMode:''};
function mf446CleanScope(value){
 const validModes=new Set(MF446_MODES.map(x=>x[0]));
 const cats=new Set((S.categories||[]).filter(c=>c?.id!=null).map(c=>String(c.id)));
 const statuses=new Set(MF446_STATUS.map(s=>s[0]));
 const categories=[...new Set(Array.isArray(value?.categories)?value.categories.map(String).filter(x=>cats.has(x)):[])];
 const pairs={};
 for(const id of categories){
  const allowed=Array.isArray(value?.pairs?.[id])?value.pairs[id]:[];
  pairs[id]=[...new Set(allowed.map(String).filter(s=>statuses.has(s)))];
 }
 return {mode:validModes.has(value?.mode)?value.mode:'selected',categories,pairs};
}
function mf446State(mode){
 if(!MF446.draft[mode]){
  const stored=S.settings?.v446RecoveryScopes?.[mode];
  MF446.draft[mode]=mf446CleanScope(stored);
  if(!stored&&mode==='cover')MF446.draft[mode].mode=typeof mf436SelectedLibraryIds==='function'&&mf436SelectedLibraryIds().length?'selected':'all';
 }
 return MF446.draft[mode];
}
function mf446StoreScope(mode){
 S.settings=S.settings||{};
 const scopes={...(S.settings.v446RecoveryScopes||{})};
 scopes[mode]=mf446CleanScope(MF446.draft[mode]);
 S.settings.v446RecoveryScopes=scopes;
 Promise.resolve(saveState()).catch(err=>console.warn('Recovery scope preferences not saved:',err));
}
function mf446CurrentLibraryRows(){
 const filters=S.histFilters||{};
 try{
  const config=typeof v181EnsureLibrarySettings==='function'?v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS):null;
  if(config?.mode==='dynamic'&&typeof v181DynamicRows==='function')return v181DynamicRows();
  if(typeof v53FilteredLibrary==='function')return v53FilteredLibrary(
   filters.libCategory||'all',filters.libStatus||'all',filters.libPriority||'all',filters.libSearch||'');
 }catch(err){console.warn('Current Library filter unavailable:',err);}
 // Fail closed instead of silently including the entire Library.
 return [];
}
function mf446ScopeIds(mode){
 const saved=(S.library||[]).filter(item=>item?.id!=null);
 const forced=mode==='cover'?MF445.oneId:MF445.metadataId;
 if(forced)return saved.filter(item=>String(item.id)===String(forced)).map(item=>String(item.id));
 const scope=mf446State(mode);
 if(scope.mode==='selected'){
  const selected=new Set(typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds().map(String):[]);
  return saved.filter(item=>selected.has(String(item.id))).map(item=>String(item.id));
 }
 if(scope.mode==='library'){
  const view=new Set(mf446CurrentLibraryRows().filter(x=>x?.id!=null).map(x=>String(x.id)));
  return saved.filter(item=>view.has(String(item.id))).map(item=>String(item.id));
 }
 if(scope.mode==='all')return saved.map(item=>String(item.id));
 const chosen=new Set(scope.categories);
 return saved.filter(item=>{
  const category=String(item.categoryId||'');
  if(!chosen.has(category))return false;
  return scope.mode==='category'||(scope.pairs[category]||[]).includes(String(item.status||'planned'));
 }).map(item=>String(item.id));
}
function mf446SourceHtml(mode){
 const providers=mf445Providers(mode);
 const enabled=providers.filter(p=>p.enabled&&p.available).length;
 return '<section class="mf445-section mf445-providers mf446-providers">'+
  '<header><div><strong>'+mf425Icon(mode==='cover'?'images':'database',17)+' '+(mode==='cover'?'Cover':'Metadata')+
  ' providers</strong><small data-mf446-provider-count>'+enabled+' available and enabled · '+providers.length+' registered</small></div>'+
  '<button type="button" class="btn btn-ghost" onclick="App.mf445Settings(\'v221-settings-api-providers\')">'+mf425Icon('settings',15)+' API Setup</button></header>'+
  '<div class="mf446-provider-tools"><button type="button" onclick="App.mf446ProviderAll('+JSON.stringify(mode)+',true)">Enable available</button>'+
  '<button type="button" onclick="App.mf446ProviderAll('+JSON.stringify(mode)+',false)">Disable all</button></div>'+
  '<div class="mf445-provider-grid">'+providers.map(p=>{
   const id=String(p.id);
   if(!/^[a-z][a-z0-9_-]{0,60}$/i.test(id))return '';
   const disabled=!p.available;
   return '<div class="mf445-provider mf446-provider" data-mf446-provider="'+mf445Esc(id)+'" data-status="'+(disabled?'unavailable':p.enabled?'enabled':'disabled')+'">'+
    '<label class="mf446-provider-check"><input type="checkbox" data-mf446-toggle="'+mf445Esc(id)+'" '+
    (p.enabled&&p.available?'checked ':'')+(disabled?'disabled ':'')+
    'onchange="App.mf446ToggleProvider('+mf445Esc(JSON.stringify(mode))+','+mf445Esc(JSON.stringify(id))+',this.checked)">'+
    '<span class="mf445-provider-info"><strong>'+mf445Esc(p.name)+'</strong><small>'+mf445Esc(p.detail)+'</small></span></label>'+
    '<span class="mf445-provider-status">'+(disabled?'Unavailable':p.enabled?'Enabled':'Disabled')+'</span>'+
    (disabled?'<button class="mf445-provider-setup" type="button" onclick="App.mf445Settings(\'v221-settings-api-providers\')" aria-label="Set up '+mf445Esc(p.name)+'">'+mf425Icon('settings',15)+'</button>':'')+
    '</div>';
  }).join('')+'</div><small class="mf445-provider-note">Enable or disable APIs here; each recovery engine saves its own provider preferences. Unavailable adapters need Setup first.</small></section>';
}
function mf446ToggleProvider(mode,id,on){
 if(!['cover','metadata'].includes(mode))return;
 const item=mf445Providers(mode).find(x=>x.id===id);
 if(!item||!item.available){showToast('This API is unavailable. Open API Setup to configure it.');return;}
 const prop=mode==='cover'?'v424Covers':'v439Metadata',current=mode==='cover'?mf424Defaults():mf439Preferences();
 const next=new Set(current.enabled);
 if(on)next.add(id);else next.delete(id);
 S.settings=S.settings||{};
 S.settings[prop]={...(S.settings[prop]||{}),enabled:[...next]};
 const providerRoot=document.querySelector('#mf445-workspace .mf446-providers');
 if(providerRoot){
  const row=[...providerRoot.querySelectorAll('[data-mf446-provider]')].find(n=>n.dataset.mf446Provider===id);
  if(row){
   row.dataset.status=on?'enabled':'disabled';
   const input=row.querySelector('input[data-mf446-toggle]');if(input)input.checked=!!on;
   const label=row.querySelector('.mf445-provider-status');if(label)label.textContent=on?'Enabled':'Disabled';
  }
  const ready=mf445Providers(mode).filter(p=>p.enabled&&p.available).length;
  const summary=providerRoot.querySelector('[data-mf446-provider-count]');
  if(summary)summary.textContent=ready+' available and enabled · '+mf445Providers(mode).length+' registered';
 }
 mf446UpdateSummary();
 Promise.resolve(saveState()).catch(err=>console.warn('Recovery provider settings not saved:',err));
}
function mf446ProviderAll(mode,on){
 if(!['cover','metadata'].includes(mode))return;
 const prop=mode==='cover'?'v424Covers':'v439Metadata',current=mode==='cover'?mf424Defaults():mf439Preferences();
 const available=mf445Providers(mode).filter(p=>p.available).map(p=>p.id);
 const next=on?[...new Set([...current.enabled,...available])]:current.enabled.filter(id=>!available.includes(id));
 S.settings=S.settings||{};
 S.settings[prop]={...(S.settings[prop]||{}),enabled:next};
 mf445Panel(mode);
 Promise.resolve(saveState()).catch(err=>console.warn('Recovery provider settings not saved:',err));
}
function mf446CategoryRows(mode){
 const scope=mf446State(mode);
 const statusMode=scope.mode==='categoryStatus';
 const valid=!(mode==='cover'?MF445.oneId:MF445.metadataId)&&(scope.mode==='category'||statusMode);
 const cats=(S.categories||[]).filter(c=>c?.id!=null);
 const count=new Map();
 for(const item of S.library||[])if(item?.categoryId!=null){
  const key=String(item.categoryId);count.set(key,(count.get(key)||0)+1);
 }
 return '<details class="mf446-categories" '+(valid?'open':'')+' '+(valid?'':'hidden')+'>'+
  '<summary>'+mf425Icon('layers',16)+' Choose categories <small>'+scope.categories.length+' / '+cats.length+' chosen</small>'+mf425Icon('chevronDown',15)+'</summary>'+
  '<div class="mf446-category-tools"><button type="button" onclick="App.mf446AllCategories(true)">Select all</button>'+
  '<button type="button" onclick="App.mf446AllCategories(false)">Clear selection</button></div>'+
  '<div class="mf445-category-grid mf446-category-grid">'+cats.map(c=>{
   const id=String(c.id),isOn=scope.categories.includes(id),statuses=scope.pairs[id]||[];
   return '<div class="mf446-category"><label class="mf446-category-top">'+
    '<input type="checkbox" '+(isOn?'checked ':'')+'data-mf446-category="'+mf445Esc(id)+'" onchange="App.mf446ToggleCategory('+mf445Esc(JSON.stringify(id))+',this.checked)">'+
    '<span class="mf445-category-art">'+mf445CategoryIcon(c)+'</span>'+
    '<span class="mf445-category-label"><strong>'+mf445Esc(c.name||id)+'</strong><small>'+Number(count.get(id)||0).toLocaleString()+' titles</small></span></label>'+
    (isOn&&statusMode?'<details class="mf446-statuses" open><summary>Statuses ('+statuses.length+' / '+MF446_STATUS.length+')</summary>'+
    '<div>'+MF446_STATUS.map(([status,label])=>
     '<label><input type="checkbox" '+(statuses.includes(status)?'checked ':'')+
     'onchange="App.mf446ToggleStatus('+mf445Esc(JSON.stringify(id))+','+JSON.stringify(status)+',this.checked)">'+mf445Esc(label)+'</label>').join('')+
    '</div></details>':'')+'</div>';
  }).join('')+'</div></details>';
}
function mf446ScopeHtml(mode){
 const forced=mode==='cover'?MF445.oneId:MF445.metadataId;
 const state=mf446State(mode);
 const ids=mf446ScopeIds(mode);
 const scope=forced?'single':state.mode;
 const selected=typeof mf436SelectedLibraryIds==='function'?mf436SelectedLibraryIds().length:0;
 const cap=mode==='metadata'?Math.max(1,Math.min(250,Number(mf439Preferences().maxBatch)||250)):0;
 return '<section class="mf445-section mf446-scope" aria-label="Recovery scope">'+
  '<header><strong>'+mf425Icon('layers',17)+' Recovery scope</strong><small>Choose exactly which saved titles are eligible</small></header>'+
  '<label class="mf446-scope-mode">Title scope <select data-mf446-scope onchange="App.mf446SelectScope(this.value)" '+(forced?'disabled':'')+'>'+
  (forced?'<option value="single" selected>This Title</option>':MF446_MODES.map(([id,label])=>'<option value="'+id+'" '+(scope===id?'selected':'')+'>'+mf445Esc(label)+'</option>').join(''))+
  '</select></label>'+
  (scope==='library'?'<p class="mf446-explanation">Current Library search, category, status and priority filters, across every page. A snapshot is taken when recovery begins.</p>':'')+
  (scope==='selected'?'<p class="mf446-explanation">'+selected.toLocaleString()+' checked title(s) in MediaFlow. Use Library checkboxes to change your selection.</p>':'')+
  (scope==='all'?'<p class="mf446-explanation">Every saved title in your Library, including all categories and statuses.</p>':'')+
  mf446CategoryRows(mode)+
  '<div class="mf446-count" role="status" aria-live="polite"><strong data-mf446-in-scope>'+ids.length.toLocaleString()+
  '</strong> titles in scope'+(cap&&ids.length>cap?' · <b>first '+cap.toLocaleString()+' per metadata batch</b>':'')+
  (cap&&ids.length?' · batch limit '+cap.toLocaleString():'')+'</div></section>';
}
function mf446SelectScope(value){
 const mode=MF445.mode,scope=mf446State(mode);
 if(!MF446_MODES.some(row=>row[0]===value))return;
 scope.mode=value;
 mf446StoreScope(mode);mf445Panel(mode);
}
function mf446ToggleCategory(id,on){
 const mode=MF445.mode,scope=mf446State(mode);
 if(!(S.categories||[]).some(c=>String(c?.id)===id))return;
 const values=new Set(scope.categories);
 if(on){values.add(id);if(!scope.pairs[id]||!scope.pairs[id].length)scope.pairs[id]=MF446_STATUS.map(x=>x[0]);}
 else values.delete(id);
 scope.categories=[...values];mf446StoreScope(mode);mf445Panel(mode);
}
function mf446AllCategories(on){
 const scope=mf446State(MF445.mode);
 scope.categories=on?(S.categories||[]).filter(c=>c?.id!=null).map(c=>String(c.id)):[];
 if(on)for(const id of scope.categories)if(!scope.pairs[id]?.length)scope.pairs[id]=MF446_STATUS.map(s=>s[0]);
 mf446StoreScope(MF445.mode);mf445Panel(MF445.mode);
}
function mf446ToggleStatus(category,status,on){
 const scope=mf446State(MF445.mode);
 if(!scope.categories.includes(category)||!MF446_STATUS.some(x=>x[0]===status))return;
 const checked=new Set(scope.pairs[category]||[]);
 if(on)checked.add(status);else checked.delete(status);
 scope.pairs[category]=[...checked];
 mf446StoreScope(MF445.mode);mf445Panel(MF445.mode);
}
function mf446UpdateSummary(){
 const root=document.getElementById('mf445-workspace');if(!root)return;
 const mode=MF445.mode,ids=mf446ScopeIds(mode);
 const ready=mf445Providers(mode).some(p=>p.available&&p.enabled);
 const label=root.querySelector('.mf445-summary>span:first-child');
 if(label)label.innerHTML=mf425Icon('layers',17)+' <strong>'+ids.length.toLocaleString()+'</strong> in recovery scope';
 const section=root.querySelector('.mf446-scope [data-mf446-in-scope]');
 if(section)section.textContent=ids.length.toLocaleString();
 const cap=mode==='metadata'?mf439Preferences().maxBatch:Infinity;
 const actionButtons=root.querySelectorAll('.mf445-actions .btn-primary');
 for(const button of actionButtons){
  const action=button.getAttribute('onclick')||'';
  button.disabled=!ready||(action.includes('preview')?ids.length!==1:
   action.includes('batch')&&!!MF445.metadataId?true:!ids.length);
 }
 if(mode==='metadata'){
  const note=root.querySelector('.mf446-scope .mf446-count');
  if(note)note.innerHTML='<strong data-mf446-in-scope>'+ids.length.toLocaleString()+'</strong> titles in scope'+
   (ids.length>cap?' · <b>first '+cap+' per metadata batch</b>':'')+' · batch limit '+cap;
 }
}
const mf446PreviousSourceHtml=mf445SourceHtml;
mf445SourceHtml=function(mode){return mf446SourceHtml(mode);};
const mf446PreviousCategoryHtml=mf445Categories;
mf445Categories=function(){return mf446ScopeHtml(MF445.mode);};
const mf446PreviousPanel=mf445Panel;
mf445Panel=function(mode){
 mf446PreviousPanel.apply(this,arguments);
 // Original actions use selected Library checkboxes, not the current workspace
 // scope; replace eligibility before users can launch a job.
 mf446UpdateSummary();
};
const mf446OriginalCandidates=mf439BatchCandidates;
mf439BatchCandidates=function(){
 if(Array.isArray(MF446.pendingBatchIds)){
  const max=Math.max(1,Math.min(250,Number(mf439Preferences().maxBatch)||250));
  return MF446.pendingBatchIds.slice(0,max);
 }
 return mf446OriginalCandidates.apply(this,arguments);
};
function mf446ApplyCoverScope(selected){
 const input=document.querySelector('#mf425-scope [name="mf425-scope-mode"]');
 if(!input||MF425.oneId)return;
 const state=mf446State('cover'),mode=state.mode;
 MF425.locked=false;
 MF425.selected=['library','selected'].includes(mode)?selected.slice():[];
 const mapMode=mode==='library'?'selected':mode;
 input.value=mapMode;
 if(mode==='library'){
  const option=input.querySelector('option[value="selected"]');
  if(option)option.textContent='Library (current filters, '+selected.length.toLocaleString()+')';
 }
 const categories=document.querySelectorAll('#mf425-scope input[data-mf425-category]');
 for(const checkbox of categories)checkbox.checked=state.categories.includes(checkbox.value);
 mf425ScopeChange();
 if(mode==='categoryStatus'){
  for(const checkbox of document.querySelectorAll('#mf425-scope input[data-mf425-status]'))
   checkbox.checked=(state.pairs[checkbox.dataset.mf425Status]||[]).includes(checkbox.value);
  mf425UpdateCount();
 }
 if(['library','selected'].includes(mode)){
  // v436's title review UI must match the actual immutable selected IDs.
  const prev=document.querySelector('#mf436-selection-summary');
  const before=document.getElementById('mf425-categories');
  const rendered=MF425.selected.length?mf436SelectedDetails():'';
  if(prev){if(rendered)prev.outerHTML=rendered;else prev.remove();}
  else if(rendered)before?.insertAdjacentHTML('beforebegin',rendered);
  const set=new Set(MF425.selected);
  MF436.reviewIds=(S.library||[]).filter(t=>set.has(String(t?.id))).slice(0,36).map(t=>String(t.id));
  mf425ScopeChange();
 }
}
const mf446PreviousStart=App.mf445Start;
async function mf446Start(action){
 const mode=MF445.mode,ids=mf446ScopeIds(mode),ready=mf445Providers(mode).some(p=>p.available&&p.enabled);
 if(!ready){showToast('Enable at least one available '+mode+' provider before starting.');return;}
 if(!ids.length){showToast('There are no Library titles in the chosen recovery scope.');return;}
 if(action==='cover'&&mode==='cover'){
  const scope=ids.slice();
  // Use v445 -> v425 launch; immediately prefill its original safe scope UI.
  const result=mf446PreviousStart('cover');
  mf446ApplyCoverScope(scope);
  return result;
 }
 if(mode!=='metadata')return;
 if(action==='preview'){
  if(ids.length!==1){showToast('Choose a scope containing exactly one title to preview.');return;}
  mf445Close();return mf445OriginalMetadataOpen(ids[0]);
 }
 if(action==='batch'){
  if(MF445.metadataId){showToast('Use Preview for a single saved title.');return;}
  if(MF446.pendingBatchIds){showToast('A metadata recovery confirmation is already open.');return;}
  // Keep the selected IDs through both confirmations in v442/v439. v439 reads
  // the candidate snapshot only after any unfinished-queue confirmation.
  MF446.pendingBatchIds=ids.slice();
  mf445Close();
  try{return await App.mf439ConfirmBatch();}
  finally{MF446.pendingBatchIds=null;}
 }
}
App.mf445Start=mf446Start;
// Move the Cover Setup shortcut to the shared widget footer, immediately
// before Recovery Settings. Both rows now have New Recovery actions.
const mf446OldCoverRow=mf441CoverRow;
mf441CoverRow=function(state){
 const html=mf446OldCoverRow.apply(this,arguments);
 return html.replace('onclick="App.mf441OpenCover()">'+mf425Icon('settings',15)+' Setup',
  'onclick="App.mf445Open(&#39;cover&#39;)">'+mf425Icon('images',15)+' New Recovery');
};
const mf446OldWidget=mf441WidgetHtml;
mf441WidgetHtml=function(prefs,state){
 const html=mf446OldWidget.apply(this,arguments);
 return html.replace('<div class="mf441-widget-foot"><button type="button" onclick="App.mf441Settings()">',
  '<div class="mf441-widget-foot mf446-widget-foot"><button type="button" onclick="App.mf446Setup()">'+mf425Icon('settings',15)+
  ' Setup</button><button type="button" onclick="App.mf441Settings()">');
};
function mf446Setup(){return mf441Settings('v221-settings-api-providers');}
App.mf446Setup=mf446Setup;
Object.assign(App,{mf446ToggleProvider,mf446ProviderAll,mf446SelectScope,
 mf446ToggleCategory,mf446AllCategories,mf446ToggleStatus,mf446Start});
window.MediaFlowV446=Object.freeze({version:446,providers:mf445Providers,
 scopeIds:mf446ScopeIds,scopes:MF446_MODES.map(x=>x[0]),sourceHtml:mf446SourceHtml,
 scopeHtml:mf446ScopeHtml,coverRow:mf441CoverRow,widget:mf441WidgetHtml});
