/* MediaFlow v436 — selected Library titles are first-class recovery scope.
 * Reuses v424/v425's durable queue, safe-save, and provider policies.
 * The floating quick-action menu opens the existing recovery dialog only;
 * it never launches a job by itself. No new state/cloud schema. */
const MF436_VERSION=436;
function mf436SelectedLibraryIds(){
 const available=new Set((S.library||[]).filter(t=>t?.id!=null).map(t=>String(t.id)));
 const selected=new Set();
 const push=id=>{const value=String(id??'').trim();if(available.has(value))selected.add(value);};
 try{if(typeof mfSelectedIds==='function')for(const id of mfSelectedIds())push(id);}catch(e){console.warn('Selected titles unavailable',e);}
 for(const [id,on] of Object.entries(S.librarySelection||{}))if(on)push(id);
 // Collections' Add Titles modal has its own draft selection (including titles
 // on pages that are not presently visible). Only include it while open.
 if(document.getElementById('mf274-add-titles')&&typeof v274AddState==='function'){
  const picks=v274AddState()?.picks;
  if(picks instanceof Set)for(const id of picks)push(id);
 }
 // Other title-pickers can identify their checked Library row explicitly.
 // Do not confuse filter/category or feature-option checkboxes with titles.
 document.querySelectorAll('input[type="checkbox"]:checked').forEach(input=>{
  const explicit=input.dataset.libraryId||input.dataset.titleId||input.dataset.libraryTitleId;
  if(explicit){push(explicit);return;}
  const row=input.closest('[data-library-id],[data-library-title-id],[data-title-id]');
  if(!row)return;
  const isTitleCheck=input.closest('.mf274-select-title,.mf274-add-row,.mf352-picker-check,[data-title-selector]')||
    input.matches('[data-title-selector],[data-library-select]');
  if(isTitleCheck)push(row.dataset.libraryId||row.dataset.libraryTitleId||row.dataset.titleId);
 });
 return [...selected];
}
const mf436OriginalInitialScope=mf425InitialScope;
mf425InitialScope=function(entry,id){
 const initial=mf436OriginalInitialScope(entry,id);
 if(MF425.oneId)return initial; // A per-title action stays exclusive to that title.
 MF425.selected=mf436SelectedLibraryIds();
 MF425.locked=false; // Allow All Library and By Category after preselecting titles.
 return MF425.selected.length?'selected':'all';
};
function mf436SelectedDetails(){
 if(!MF425.selected.length)return '';
 const selected=new Set(MF425.selected.map(String));
 const names=[],max=36;
 for(const item of S.library||[]){
  if(!selected.has(String(item?.id||'')))continue;
  if(names.length<max)names.push({id:String(item.id),title:String(item.title||'Untitled')});
 }
 const eligible=mf425Counts({mode:'selected',ids:MF425.selected}).eligible;
 return '<div class="mf436-selection-summary" id="mf436-selection-summary" role="status">'+
  '<div class="mf436-selection-summary-top">'+mf425Icon('check',18)+
  '<strong>'+MF425.selected.length.toLocaleString()+' selected titles</strong>'+
  '<span>'+eligible.toLocaleString()+' missing covers</span></div>'+
  '<p>Checked Library titles were imported automatically. Review or remove titles before starting. Switch Scope to All Library or categories whenever you want.</p>'+
  '<details><summary>Review selected titles</summary><div class="mf436-selection-review">'+
  names.map((t,i)=>'<div class="mf436-selected-row"><span title="'+mf425Esc(t.title)+'">'+mf425Esc(t.title)+'</span><button type="button" class="btn btn-ghost" onclick="App.mf436RemoveSelected('+i+')" aria-label="Remove '+mf425Esc(t.title)+' from recovery">Remove</button></div>').join('')+
  (MF425.selected.length>names.length?'<small>Showing first '+names.length+' of '+MF425.selected.length.toLocaleString()+' titles.</small>':'')+
  '</div></details></div>';
}
const mf436OriginalScopeFields=mf425ScopeFields;
mf425ScopeFields=function(){
 const html=mf436OriginalScopeFields();
 if(!MF425.selected.length||MF425.oneId)return html;
 // Store the visible review order separately from the durable Library IDs.
 const set=new Set(MF425.selected.map(String));
 MF436.reviewIds=[];
 for(const item of S.library||[]){if(set.has(String(item?.id||''))&&MF436.reviewIds.length<36)MF436.reviewIds.push(String(item.id));}
 return html.replace('<div class="mf425-categories" id="mf425-categories">',mf436SelectedDetails()+'<div class="mf425-categories" id="mf425-categories">');
};
const MF436={reviewIds:[]};
const mf436OriginalScopeChange=mf425ScopeChange;
mf425ScopeChange=function(){
 mf436OriginalScopeChange.apply(this,arguments);
 const root=document.getElementById('mf425-scope');
 const summary=root?.querySelector('#mf436-selection-summary');
 if(summary)summary.hidden=root.querySelector('[name="mf425-scope-mode"]')?.value!=='selected';
};
function mf436RemoveSelected(index){
 const id=MF436.reviewIds[Number(index)];
 if(!id)return;
 MF425.selected=MF425.selected.filter(x=>String(x)!==id);
 if(!MF425.selected.length){
  document.querySelector('#mf425-scope [name="mf425-scope-mode"]')?.querySelector('option[value="all"]')?.setAttribute('selected','');
  const scope=document.querySelector('#mf425-scope [name="mf425-scope-mode"]');
  if(scope)scope.value='all';
 }
 const summary=document.getElementById('mf436-selection-summary');
 if(summary){
  const temp=document.createElement('div');
  temp.innerHTML=MF425.selected.length?mf436SelectedDetails():'<div id="mf436-selection-summary" class="mf436-selection-summary"><strong>0 selected titles</strong><p>Choose another Scope to recover covers.</p></div>';
  const update=temp.firstElementChild;
  if(update)summary.replaceWith(update);
 }
 const set=new Set(MF425.selected.map(String));MF436.reviewIds=[];
 for(const item of S.library||[]){if(set.has(String(item?.id||''))&&MF436.reviewIds.length<36)MF436.reviewIds.push(String(item.id));}
 mf425ScopeChange();
}
const mf436OriginalQuickMarkup=mf397Markup;
mf397Markup=function(){
 const html=mf436OriginalQuickMarkup.apply(this,arguments);
 const anchor='      </div>\n      <button type="button" id="mf397-fab"';
 if(!html.includes(anchor))return html;
 const btn='        <button type="button" class="mf397-fan-action a4 mf436-cover-action" data-action="coverRecovery">'+
  '<span class="mf397-action-symbol">'+mf425Icon('images',20)+'</span>'+
  '<span><strong>New Cover Recovery</strong><small>Configure & start a recovery job</small></span><em>04</em></button>\n';
 return html.replace(anchor,btn+anchor);
};
const mf436PreviousQuickAction=mf397Action;
mf397Action=function(action){
 if(action==='coverRecovery'){
  mf397SetMenu(false);
  if(!AUTH_USER||!MF424.ready){showToast('Sign in and wait for Cover Recovery to initialize.');return;}
  App.mf425OpenConfig('floating');
  return;
 }
 return mf436PreviousQuickAction.apply(this,arguments);
};
// Display the scoped title count in the active job, not an outdated checkbox count.
// The immutable IDs of an already running job are never reselected.
window.MediaFlowV436=Object.freeze({version:436,selectedIds:mf436SelectedLibraryIds,removeSelected:mf436RemoveSelected});
Object.assign(App,{mf436RemoveSelected});
