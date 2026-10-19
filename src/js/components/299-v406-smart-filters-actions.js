/* MediaFlow v406 — membership-aware Personal Order / Logging workspaces and
   accessible searchable bulk action pickers. Existing data/schema unchanged. */
const V406_RELEASE=406;
const V406_MEMBERSHIP={collections:'all',logging:'all'};
function v406Mode(value){return ['all','available','added'].includes(String(value))?String(value):'all';}
function v406MatchMembership(id,members,mode){return mode==='all'||(mode==='added'?members.has(String(id)):!members.has(String(id)));}
function v406MemberSelect(kind,value){
  const mode=v406Mode(value);
  if(kind==='titles'){
    const ui=v140EnsureOrderPickerUI();ui.v406Membership=mode;ui.page=0;
    v141InvalidateOrderPickerCache();v141RefreshOrderPickerAll();return;
  }
  if(kind==='collections'){
    V406_MEMBERSHIP.collections=mode;
    const ui=v287OrderUI();ui.v359CollectionPage=0;
    v287RefreshCollectionPicker();return;
  }
  if(kind==='logging'){
    V406_MEMBERSHIP.logging=mode;V89_LOG.page=0;
    renderLogSuggestions();
  }
}
function v406MembershipField(kind){
  const state=kind==='titles'?v406Mode(v140EnsureOrderPickerUI().v406Membership||'all'):V406_MEMBERSHIP[kind];
  const first=kind==='collections'?'All collections':'All titles';
  return `<label class="mf406-membership"><span>Show</span><select aria-label="${kind==='collections'?'Personal Order collection':kind==='logging'?'Logging Library':'Personal Order title'} membership" onchange="App.v406MemberSelect('${kind}',this.value)">
    <option value="all" ${state==='all'?'selected':''}>${first}</option>
    <option value="available" ${state==='available'?'selected':''}>Not added</option>
    <option value="added" ${state==='added'?'selected':''}>Already added</option>
  </select></label>`;
}
// Personal Order Add Titles — filter the existing indexed and sorted candidate
// stream *before* its pager. Recompute against the canonical queue every time.
const v406OrderMatchesBase=v138PickerMatches;
v138PickerMatches=function(){
  const rows=v406OrderMatchesBase.apply(this,arguments),ui=v140EnsureOrderPickerUI(),mode=v406Mode(ui.v406Membership);
  if(mode==='all')return rows;
  const ids=new Set((v138EnsureOrderPlan().titleIds||[]).map(String));
  return rows.filter(item=>v406MatchMembership(item.id,ids,mode));
};
const v406OrderToolsBase=v140OrderPickerToolsHtml;
v140OrderPickerToolsHtml=function(){
  const html=String(v406OrderToolsBase.apply(this,arguments));
  return `<div class="mf406-order-membership">${v406MembershipField('titles')}</div>`+html;
};
// Personal Order Add Collections — membership is relative to the currently
// selected *assignment category*, not all Personal Order categories combined.
const v406CollectionMatchesBase=v287CollectionMatches;
v287CollectionMatches=function(){
  const rows=v406CollectionMatchesBase.apply(this,arguments),mode=V406_MEMBERSHIP.collections;
  if(mode==='all')return rows;
  const categoryId=String(v287OrderUI().v287CollectionCategoryId||'');
  const assigned=new Set(v287Assignments(categoryId).map(x=>String(x.collectionId)));
  return rows.filter(collection=>v406MatchMembership(collection.id,assigned,mode));
};
const v406CollectionControlsBase=v358CollectionControlsHtml;
v358CollectionControlsHtml=function(){
  const html=String(v406CollectionControlsBase.apply(this,arguments));
  const marker='<div class="mf354-collection-picker-controls mf358-filters-grid">';
  return html.includes(marker)?html.replace(marker,marker+`<div class="mf358-filter-control mf406-collection-membership">${v406MembershipField('collections')}</div>`):html;
};
// Logging Library — membership means the active, unsubmitted Logging draft,
// never presence in the main Library or a historic Logging session.
const v406LogCandidatesBase=logTitleCandidates;
logTitleCandidates=function(query){
  const rows=v406LogCandidatesBase.apply(this,arguments),mode=V406_MEMBERSHIP.logging;
  if(mode==='all')return rows;
  const added=v378AddedIds();return rows.filter(item=>v406MatchMembership(item.id,added,mode));
};
const v406LogToolsBase=v224LogToolsHtml;
v224LogToolsHtml=function(){
  const html=String(v406LogToolsBase.apply(this,arguments));
  return html.replace('data-v89-log-tools="1">',`data-v89-log-tools="1">${v406MembershipField('logging')}`);
};
// Every *new* picker session starts with All; changing other filters/search
// during the same session doesn't erase its chosen membership filter.
const v406OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  if(kind==='title')v140EnsureOrderPickerUI().v406Membership='all';
  if(kind==='collection')V406_MEMBERSHIP.collections='all';
  return v406OpenSheetBase.apply(this,arguments);
};

const V406_STATUS_LABEL={planned:'Planned',active:'Active',paused:'On Hold',completed:'Completed',dropped:'Dropped'};
const V406_PRIORITY_LABEL={low:'Low',medium:'Medium',high:'High'};
function v406ActionItems(kind){
  const ids=v230VisibleIds(kind==='category'?'setCategory':kind==='status'?'setStatus':'setPriority');
  const cats=new Map((S.categories||[]).filter(c=>c?.id).map(c=>[String(c.id),c]));
  return ids.map(id=>{
    if(kind==='category'){
      const c=cats.get(String(id));return c?{id:String(id),label:String(c.name||'Untitled'),icon:v144CategoryIconHtml(c)}:null;
    }
    if(kind==='status')return {id,label:V406_STATUS_LABEL[id]||id,icon:v230StatusIcon(id)};
    return {id,label:V406_PRIORITY_LABEL[id]||id,icon:v230PriorityIcon(id)};
  }).filter(Boolean);
}
function v406PickerHtml(kind,scope){
  const title=kind==='category'?'Move to category':kind==='status'?'Set status':'Set priority';
  const icon=kind==='category'?'▦':kind==='status'?'◉':'⚑';
  const options=v406ActionItems(kind).map(item=>
    `<button type="button" class="mf406-picker-option" role="option" data-v406-search="${escapeHtml(item.label.toLocaleLowerCase())}" data-v406-value="${escapeHtml(item.id)}" onclick="App.v406Choose(this)">
      <span class="mf406-picker-icon" aria-hidden="true">${item.icon||icon}</span><span>${escapeHtml(item.label)}</span>
    </button>`).join('');
  return `<details class="mf406-action-picker" data-v406-kind="${kind}" data-v406-scope="${scope}" ontoggle="App.v406Position(this)">
    <summary aria-label="${title}"><span class="mf406-summary-symbol" aria-hidden="true">${icon}</span><span>${title}…</span><span aria-hidden="true">⌄</span></summary>
    <div class="mf406-picker-panel"><input type="search" autocomplete="off" aria-label="Search ${kind==='category'?'categories':kind==='status'?'statuses':'priorities'}" placeholder="Search ${kind==='category'?'categories':kind==='status'?'statuses':'priorities'}…" oninput="App.v406Search(this)">
      <div class="mf406-picker-options" role="listbox">${options}</div><div class="mf406-picker-empty" ${options?'hidden':''}>${options?'No matching results.':'No visible options in Settings.'}</div>
    </div></details>`;
}
function v406UpgradeBatchMarkup(html,scope){
  const text=String(html||'');if(!text.includes('<select'))return text;
  const root=document.createElement('div');root.innerHTML=text;
  // Only replace action selects, not unrelated category/status filter selects.
  root.querySelectorAll('.mf-batchbar select').forEach(el=>{
    const value=String(el.getAttribute('onchange')||'');
    const kind=value.includes('BatchCollectionCategory')||value.includes('batchLibraryCategory')?'category':
      value.includes('BatchCollectionStatus')||value.includes('batchLibraryStatus')?'status':
      value.includes('BatchCollectionPriority')||value.includes('batchLibraryPriority')?'priority':null;
    if(!kind)return;
    const holder=document.createElement('div');holder.innerHTML=v406PickerHtml(kind,scope);
    if(holder.firstElementChild)el.replaceWith(holder.firstElementChild);
  });
  return root.innerHTML;
}
function v406Position(menu){
  if(!menu?.open)return;
  const panel=menu.querySelector('.mf406-picker-panel');if(!panel)return;
  // A fixed panel escapes mobile Library batchbars' horizontal overflow.
  // Anchor within the visible viewport, flipping upward near the bottom.
  const box=menu.getBoundingClientRect();
  const width=Math.min(310,Math.max(220,window.innerWidth-20));
  const left=Math.max(10,Math.min(box.left,window.innerWidth-width-10));
  const below=window.innerHeight-box.bottom-10,above=box.top-10;
  panel.style.width=width+'px';panel.style.left=left+'px';
  panel.style.maxHeight=Math.max(130,Math.max(below,above)-4)+'px';
  if(below<230&&above>below){panel.style.top='auto';panel.style.bottom=Math.max(10,window.innerHeight-box.top+4)+'px';}
  else {panel.style.top=Math.max(8,box.bottom+3)+'px';panel.style.bottom='auto';}
}
function v406Search(input){
  const menu=input?.closest('.mf406-action-picker');if(!menu)return;
  const term=String(input.value||'').trim().toLocaleLowerCase();let visible=0;
  menu.querySelectorAll('.mf406-picker-option').forEach(button=>{
    button.hidden=!!term&&!String(button.dataset.v406Search||'').includes(term);
    if(!button.hidden)visible++;
  });
  const empty=menu.querySelector('.mf406-picker-empty');if(empty)empty.hidden=visible>0;
}
function v406Choose(button){
  const menu=button?.closest('.mf406-action-picker');if(!menu)return;
  const kind=menu.dataset.v406Kind,scope=menu.dataset.v406Scope,id=button.dataset.v406Value;
  if(!v406ActionItems(kind).some(item=>item.id===id))return; // stale DOM or hidden choice
  menu.open=false;
  const method=scope==='collection'?{category:'v274BatchCollectionCategory',status:'v274BatchCollectionStatus',priority:'v274BatchCollectionPriority'}[kind]:
    {category:'batchLibraryCategory',status:'batchLibraryStatus',priority:'batchLibraryPriority'}[kind];
  App[method]?.(id); // existing bulk confirmation, undo, History and XP flow
}
// Upgrade the actual live Library toolbars, both Normal and Dynamic, and
// Collection detail toolbars without touching unrelated filters/forms.
const v406RenderLibraryBase=renderLibrary;
renderLibrary=function(){return v406UpgradeBatchMarkup(v406RenderLibraryBase.apply(this,arguments),'library');};
const v406CollectionToolsBase=v274CollectionToolsHtml;
v274CollectionToolsHtml=function(){return v406UpgradeBatchMarkup(v406CollectionToolsBase.apply(this,arguments),'collection');};
const v406BatchCollectionBase=v274CollectionBatchBarHtml;
v274CollectionBatchBarHtml=function(){return v406UpgradeBatchMarkup(v406BatchCollectionBase.apply(this,arguments),'collection');};
// Dropdowns have document-level outside-click/Escape behavior, but do not
// interfere with keyboard focus inside search boxes or with modal focus traps.
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const el=event.target?.closest?.('.mf406-action-picker');if(el?.open){el.open=false;event.stopPropagation();}
});
document.addEventListener('click',event=>{
  document.querySelectorAll('.mf406-action-picker[open]').forEach(menu=>{
    if(!menu.contains(event.target))menu.open=false;
  });
});
Object.assign(App,{v406MemberSelect,v406Search,v406Choose,v406Position});
MediaFlowRuntime.version=V406_RELEASE;
window.MediaFlowV406={version:406,features:['Personal Order title and collection membership filters','Logging draft membership filter','Searchable bulk category/status/priority actions','Set Category/Status/Priority order and icons'],audit:()=>({version:406,order:v406Mode(v140EnsureOrderPickerUI().v406Membership),collections:V406_MEMBERSHIP.collections,logging:V406_MEMBERSHIP.logging,orderedStatus:v406ActionItems('status').map(i=>i.id),orderedPriority:v406ActionItems('priority').map(i=>i.id)})};
