/* MediaFlow v400 — independent Advanced Logging timestamps and shared picker UX.
 * Existing v369/v394 unit records and canonical Personal Order / Collection
 * add/save handlers remain authoritative. Layout nodes are moved, not cloned. */
const V400_RELEASE=400;
const V400_BREAKPOINT=window.matchMedia('(max-width:1023px)');
const V400_PHONE=window.matchMedia('(max-width:650px)');
const V400_REMEMBER={collectionsNarrow:false,orderNarrow:false};

// Legacy drafts can contain a manually adjusted v394When. Keep that as the
// inherited BULK default, without ever interpreting it as a per-unit timestamp.
function v400BulkStamp(entry,method){
  const name=method==='last'?'v400LastWhen':'v400AmountWhen';
  return v369ValidStamp(entry?.[name]) || v369ValidStamp(entry?.v394When) ||
    v369ValidStamp(entry?.loggedAt) || Date.now();
}
// When the final submitted method is bulk, serialize that method's timestamp
// into the existing unit records for History. A failed submit restores every
// original unit time and update marker; changing tabs never touches units.
const v400SubmitBase=App.submitLog;
App.submitLog=function(){
  const touched=[];
  if(S.logDraft?.v369Interface==='itemized') for(const e of S.logDraft.entries||[]){
    const mode=v394Method(e);
    if(mode==='unit')continue;
    const stamp=v400BulkStamp(e,mode);
    const applicable=v394Relevant(e,v369ItemTitle(e)).units;
    for(const unit of applicable){
      touched.push([unit,unit.loggedAt,unit.v369UpdatedAt]);
      unit.loggedAt=stamp;
      unit.v369UpdatedAt=Date.now();
    }
  }
  const restore=()=>{for(const [unit,stamp,modified] of touched){unit.loggedAt=stamp;unit.v369UpdatedAt=modified;}};
  try{
    const value=v400SubmitBase.apply(this,arguments);
    if(value&&typeof value.then==='function') return value.then(result=>{
      if(S.logging===true)restore();return result;
    },error=>{restore();throw error;});
    if(S.logging===true)restore();
    return value;
  }catch(error){restore();throw error;}
};
function v400DirectChildren(parent,selectors){
  for(const selector of selectors){const el=parent?.querySelector(selector);if(el)return el;}
  return null;
}
// Personal Order title picker uses precisely the v399 Collection picker
// workspace geometry, control hierarchy, and responsive tool disclosure.
function v400BuildOrderTitleWorkspace(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-title-sheet');
  if(!sheet)return;
  const card=sheet.querySelector('.mf356-browse-card');
  if(!card||card.querySelector(':scope > .mf400-order-shell'))return;
  const search=card.querySelector('.v138-picker-search');
  const filters=card.querySelector('.mf356-title-filters');
  const panel=card.querySelector('.mf358-results-panel');
  const actions=card.querySelector('.v138-picker-actions');
  const display=panel?.querySelector('.mf358-title-display');
  const methods=panel?.querySelector('.mf392-order-tools');
  if(!search||!filters||!panel||!actions||!display||!methods)return;
  // Undo v399 relocation because the ENTIRE display toolbar now lives in
  // this disclosure; no settings are duplicated across responsive states.
  const sizes=sheet.querySelector('.mf358-size-controls');
  const page=sheet.querySelector('.mf399-title-page-field');
  if(sizes)v399AnchorRestore(sizes);
  if(page)v399AnchorRestore(page);
  sheet.classList.add('mf400-order-workspace');
  const shell=document.createElement('div');shell.className='mf400-order-shell';
  const heading=card.querySelector(':scope > .section-label');
  if(heading){heading.textContent='Browse your Library and add titles to Personal Order.';heading.classList.add('mf400-picker-intro');}
  const sidebar=document.createElement('aside');sidebar.className='mf400-order-sidebar';
  const searchWrap=document.createElement('div');searchWrap.className='mf400-order-search';searchWrap.append(search);
  const inner=document.createElement('div');inner.className='mf400-order-tool-inner';
  const label=filters.querySelector('.mf356-summary-label');if(label)label.textContent='Tools & Filters';
  const hint=filters.querySelector('.mf356-summary-hint');if(hint)hint.textContent='View, add, size, filter and sort';
  // Match Collection picker: page-size, selection modes, display settings,
  // then canonical filters. Keep the original DOM and inline event handlers.
  const paging=display.querySelector('.mf359-title-paging');
  if(paging)inner.append(paging);
  inner.append(methods,display);
  const canonicalFilters=filters.querySelector('#v140-order-picker-tools');
  if(canonicalFilters)inner.append(canonicalFilters);
  const advanced=filters.querySelector('.mf363-title-advanced');if(advanced)inner.append(advanced);
  filters.querySelector('.mf399-title-mobile-settings')?.remove();
  filters.append(inner);
  sidebar.append(searchWrap,filters);
  const main=document.createElement('section');main.className='mf400-order-main';main.append(panel,actions);
  shell.append(sidebar,main);card.append(shell);
  filters.open=!V400_BREAKPOINT.matches||V400_REMEMBER.orderNarrow;
  filters.addEventListener('toggle',()=>{
    if(V400_BREAKPOINT.matches)V400_REMEMBER.orderNarrow=filters.open;
  });
}
function v400UpdateOrderBreakpoint(){
  const sheet=document.querySelector('.mf400-order-workspace');if(!sheet)return;
  const filters=sheet.querySelector('.mf356-title-filters');
  if(filters)filters.open=V400_BREAKPOINT.matches?V400_REMEMBER.orderNarrow:true;
}
// Existing v399 handler should not reparent the new title workspace controls
// on a resize — the v400 sidebar owns their single canonical DOM location.
const v400OldTitleMobileTools=v399TitleMobileTools;
v399TitleMobileTools=function(){
  if(document.querySelector('.mf400-order-workspace'))return;
  return v400OldTitleMobileTools.apply(this,arguments);
};
// The v399 Collection sheet used the open attribute from the narrow layout
// in desktop; restore the tool content on every desktop transition.
const v400CollectionToggle=App.v399CollectionToolsToggle;
App.v399CollectionToolsToggle=function(el){
  if(V400_BREAKPOINT.matches){V400_REMEMBER.collectionsNarrow=!!el.open;V399_COLLECTION_OPEN=!!el.open;}
  return; // don't let programmatic desktop expansions erase narrow preference
};
function v400UpdateCollectionBreakpoint(){
  const details=document.querySelector('#mf274-add-titles .mf399-collection-tools');
  if(details)details.open=V400_BREAKPOINT.matches?V400_REMEMBER.collectionsNarrow:true;
}
function v400CollectionOpened(){
  if(!V400_BREAKPOINT.matches)V400_REMEMBER.collectionsNarrow=false;
  v400UpdateCollectionBreakpoint();
}
const v400CollectionOpenBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){
  V400_REMEMBER.collectionsNarrow=false;
  const result=v400CollectionOpenBase.apply(this,arguments);
  v400CollectionOpened();return result;
};

// Personal Order Add Collections: move controls into the EXISTING disclosure.
// No change to selection/categorization/pagination data paths.
function v400EnhanceOrderCollections(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-collection-sheet');
  if(!sheet)return;
  const filters=sheet.querySelector('.mf358-collection-filters');
  const display=sheet.querySelector('.mf361-collection-display');
  const page=sheet.querySelector('.mf359-page-size-field');
  const modes=display?.querySelector('.mf361-collection-mode-buttons');
  const actions=sheet.querySelector('.mf392-assignment-tools');
  if(!filters||!display||!modes||!page)return;
  sheet.classList.add('mf400-collection-tools-sheet');
  const summary=filters.querySelector(':scope > summary');
  if(summary){for(const n of [...summary.childNodes])if(n.nodeType===Node.TEXT_NODE && /Filters\s*&\s*sorting/i.test(n.textContent))n.textContent=n.textContent.replace(/Filters\s*&\s*sorting/i,'Tools & Filters');}
  // Page and size inputs may have been put into v362 mobile slots earlier.
  let inner=filters.querySelector('.mf400-collection-tools-inner');
  if(!inner){inner=document.createElement('div');inner.className='mf400-collection-tools-inner';filters.append(inner);}
  // Move only actual controls: don't clone handlers or create a second input.
  if(!page._mf400Home){page._mf400Home=document.createComment('Collection page-size original position');page.before(page._mf400Home);}
  if(!display._mf400Home){display._mf400Home=document.createComment('Collection display original position');display.before(display._mf400Home);}
  inner.append(page,display);
  if(actions){
    if(!actions._mf400Home){actions._mf400Home=document.createComment('Collection selection controls original position');actions.before(actions._mf400Home);}
    if(V400_PHONE.matches)inner.append(actions);
    else if(actions._mf400Home.isConnected)actions._mf400Home.after(actions);
  }
  filters.open=false;
}
function v400ResponsiveCollectionControls(){
  const sheet=document.querySelector('.mf400-collection-tools-sheet');if(!sheet)return;
  const actions=sheet.querySelector('.mf392-assignment-tools');
  const inner=sheet.querySelector('.mf400-collection-tools-inner');
  if(actions&&inner){
    if(V400_PHONE.matches)inner.append(actions);
    else if(actions._mf400Home?.isConnected)actions._mf400Home.after(actions);
  }
}
const v400OrderOpenBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const result=v400OrderOpenBase.apply(this,arguments);
  if(kind==='title'){v400BuildOrderTitleWorkspace();v400UpdateOrderBreakpoint();}
  else if(kind==='collection')v400EnhanceOrderCollections();
  return result;
};
try{V400_BREAKPOINT.addEventListener('change',()=>{
  v400UpdateCollectionBreakpoint();v400UpdateOrderBreakpoint();
  v400ResponsiveCollectionControls();
});V400_PHONE.addEventListener('change',v400ResponsiveCollectionControls);}catch(_){ }
MediaFlowRuntime.version=V400_RELEASE;
window.MediaFlowV400={version:400,features:[
  'Independent per-unit log timestamps','Bulk timestamps isolated from Per Unit',
  'Matching Personal Order and Collections title picker workspaces',
  'Desktop tools restore on window resize',
  'Personal Order Collection Tools & Filters consolidation',
  'Mobile collection List cover proportions',
  'Public README with evolution-only maintenance policy'
]};
