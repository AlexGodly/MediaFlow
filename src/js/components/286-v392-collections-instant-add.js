/* MediaFlow v392 — additive Collections / Personal Order picker overhaul.
 * Preserve the existing queue, XP, backup, cloud and authentication schemas.
 * This module runs last so it can adapt all v352–v363 picker presentations.
 */
const V392_RELEASE=392;
const V392_ICON_PLUS='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const V392_ICON_CHECK='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>';
const V392_MODES={collection:'direct',titles:'direct',assignments:'direct'};
const V392_SAVES={chain:Promise.resolve()};
let V392_VALID_LIBRARY={ref:null,length:-1,token:-1,ids:new Set()};
function v392ValidLibraryIds(){const lib=S.library||[],token=Number(V53_LIB.libraryToken)||0;
  if(V392_VALID_LIBRARY.ref!==lib||V392_VALID_LIBRARY.length!==lib.length||V392_VALID_LIBRARY.token!==token)V392_VALID_LIBRARY={ref:lib,length:lib.length,token,ids:new Set(lib.filter(i=>i?.id).map(i=>String(i.id)))};
  return V392_VALID_LIBRARY.ids;
}
let V392_ORDER_DIRTY=false;
function v392Mode(kind){return V392_MODES[kind]==='multi'?'multi':'direct';}
function v392SetMode(kind,mode){
  if(!Object.hasOwn(V392_MODES,kind))return;
  V392_MODES[kind]=mode==='multi'?'multi':'direct';
  if(kind==='collection'){
    v274AddState().picks.clear();v392UpdateCollectionPicker();
  }else if(kind==='titles'){
    v140EnsureOrderPickerUI().picks.clear();v141InvalidateOrderPickerCache();v141RefreshOrderPickerPageOnly();v392UpdateOrderPickerTools();
  }else{
    V392_ASSIGN_SELECTION.clear();v287RefreshCollectionPicker();v392UpdateAssignmentTools();
  }
}
function v392SwitchHtml(kind){return `<div class="mf392-modes" role="group" aria-label="Addition method"><button type="button" class="mf392-mode ${v392Mode(kind)==='direct'?'active':''}" aria-pressed="${v392Mode(kind)==='direct'}" onclick="App.v392SetMode('${kind}','direct')">${V392_ICON_PLUS} Direct Add</button><button type="button" class="mf392-mode ${v392Mode(kind)==='multi'?'active':''}" aria-pressed="${v392Mode(kind)==='multi'}" onclick="App.v392SetMode('${kind}','multi')">${V392_ICON_CHECK} Multi-Select</button></div>`;}
function v392ActionHtml(done,handler,label='Added'){
  return done?`<button type="button" class="mf392-action mf392-added" disabled aria-label="${label}">${V392_ICON_CHECK}<span>${label}</span></button>`:
    `<button type="button" class="mf392-action mf392-add" onclick="${handler}">${V392_ICON_PLUS}<span>Add</span></button>`;
}
function v392Timestamp(item,key='createdAt'){
  const val=item?.[key];const n=typeof val==='number'?val:typeof val==='string'&&/^\d+$/.test(val)?Number(val):Date.parse(val);
  return Number.isFinite(n)&&n>0?n:0;
}
function v392SortOptions(selected){
  const options=[['added','Date added'],['title','Alphabetical'],['priority','Priority'],['rating','Rating'],['progress','Consumed progress'],['total','Total progress'],['edited','Last edited'],['logged','Last logged'],['random','Random']];
  return options.map(([k,label])=>`<option value="${k}" ${selected===k?'selected':''}>${label}</option>`).join('');
}
function v392CompareTitles(a,b,sort,dir){
  const number=(i,k)=>Number(i?.[k])||0;
  let d=0;
  if(sort==='title')d=v274SafeTitle(a).localeCompare(v274SafeTitle(b),undefined,{numeric:true,sensitivity:'base'});
  else if(sort==='priority'){const ranks={low:0,medium:1,high:2};d=(ranks[String(a.priority||'medium')]??1)-(ranks[String(b.priority||'medium')]??1);}
  else if(sort==='rating'||sort==='progress'||sort==='total')d=number(a,sort)-number(b,sort);
  else if(sort==='edited')d=v392Timestamp(a,'modifiedAt')-v392Timestamp(b,'modifiedAt');
  else if(sort==='logged')d=v392Timestamp(a,'lastLoggedAt')-v392Timestamp(b,'lastLoggedAt');
  else d=v392Timestamp(a)-v392Timestamp(b);
  // Date ties retain the Library's original insertion order through stable sort.
  return d*dir;
}
/* Collections Add Titles — keep added entries in their original positions. */
const v392CollectionCandidatesBase=v274AddCandidates;
v274AddCandidates=function(c){
  const state=v274AddState();
  const added=new Set((c?.titleIds||[]).map(String));
  const q=String(state.search||'').trim().toLocaleLowerCase();
  let rows=[];
  // Use the v279 normalized search index (and indexed filter fields) but do
  // not suppress existing members. Existing members show a checkmark instead.
  for(const rec of v279EnsureLibrarySearchIndex()){
    if(q&&!rec.search.includes(q))continue;
    if(state.categories.length&&!state.categories.includes(rec.categoryId))continue;
    if(state.status!=='all'&&rec.status!==state.status)continue;
    if(state.priority!=='all'&&rec.priority!==state.priority)continue;
    if(state.rating!=='all'&&!v274RatingMatch(rec.item,state.rating))continue;
    if(state.membership==='added'&&!added.has(rec.id))continue;
    if(state.membership==='available'&&added.has(rec.id))continue;
    rows.push(rec.item);
  }
  if(state.sort==='random'){
    // Stable within one picker session: do not reshuffle on Add or refresh.
    const hash=id=>{let h=(state.v392Seed||17)|0;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return h>>>0;};
    rows.sort((a,b)=>hash(String(a.id))-hash(String(b.id)));
  }else{
    const dir=state.dir==='desc'?-1:1;
    rows.sort((a,b)=>v392CompareTitles(a,b,state.sort||'added',dir));
  }
  return rows;
};
const v392CollectionBodyBase=v274AddModalBody;
v274AddModalBody=function(c){
  let html=String(v392CollectionBodyBase.apply(this,arguments));
  const state=v274AddState();
  // Keep the existing responsive category, status, priority, rating and view
  // controls; only extend their sort and membership options.
  const sortSelect=html.match(/<select onchange="App\.v274AddFilter\('sort',this\.value\)">[\s\S]*?<\/select>/);
  if(sortSelect)html=html.replace(sortSelect[0],`<select aria-label="Sort titles" onchange="App.v274AddFilter('sort',this.value)">${v392SortOptions(state.sort)}</select>`);
  const tools=`<div class="mf392-picker-row">${v392SwitchHtml('collection')}<label class="mf392-membership">Show <select aria-label="Collection membership" onchange="App.v274AddFilter('membership',this.value)"><option value="all" ${state.membership==='all'?'selected':''}>All titles</option><option value="available" ${state.membership==='available'?'selected':''}>Not added</option><option value="added" ${state.membership==='added'?'selected':''}>Already added</option></select></label></div>`;
  return html.replace('<div id="mf276-add-results"',tools+'<div id="mf276-add-results"');
};
const v392CollectionOpenBase=v274OpenAddTitles;
v274OpenAddTitles=function(id){
  V392_MODES.collection='direct';
  const result=v392CollectionOpenBase.apply(this,arguments);
  V276_ADD_COLLECTION_ID=String(id||'');
  const state=v274AddState();state.sort='added';state.dir='asc';state.membership='all';state.v392Seed=Date.now()|0;
  v392UpdateCollectionPicker();return result;
};
function v392CollectionRow(item){
  const state=v274AddState(),id=String(item.id),added=arguments.length>1?arguments[1].has(id):(v276CurrentAddCollection()?.titleIds||[]).some(x=>String(x)===id),checked=state.picks.has(id);
  const cat=v274Cat(item),title=escapeHtml(v274SafeTitle(item));
  return `<div class="mf274-add-row mf352-picker-item mf392-picker-item" data-mf392-id="${escapeHtml(id)}">
    ${v392Mode('collection')==='multi'&&!added?`<input class="mf352-picker-check" type="checkbox" aria-label="Select ${title}" ${checked?'checked':''} onchange="App.v274AddPick('${escapeHtml(id)}',this.checked)">`:''}
    <span class="mf352-picker-cover">${v274TitleCover(item,false)}</span><span class="mf352-picker-copy"><span class="mf352-picker-title">${title}</span><small class="mf352-picker-meta">${cat?v144CategoryIconHtml(cat):''} ${escapeHtml(cat?.name||'Uncategorized')} · ${escapeHtml(v274StatusLabel(item.status))} · ${escapeHtml(String(item.priority||'medium'))}</small></span>
    ${v392Mode('collection')==='direct'||added?v392ActionHtml(added,`App.v392AddCollectionTitle('${escapeHtml(id)}')`):''}
  </div>`;
}
v276AddResultsHtml=function(shown){const added=new Set((v276CurrentAddCollection()?.titleIds||[]).map(String));return shown.length?shown.map(item=>v392CollectionRow(item,added)).join(''):'<div class="empty-state">No Library titles match.</div>';};
function v392UpdateCollectionPicker(){
  const c=v276CurrentAddCollection(),body=document.getElementById('mf274-add-body');if(!c||!body)return;
  const previous=body.querySelector('#mf276-add-results');const scroll=previous?.scrollTop||0;
  const focus=document.activeElement;const focusSearch=focus?.id==='mf276-add-search',start=focusSearch?focus.selectionStart:null,end=focusSearch?focus.selectionEnd:null;
  body.innerHTML=v274AddModalBody(c);
  const after=body.querySelector('#mf276-add-results');if(after)after.scrollTop=scroll;
  if(focusSearch){const next=document.getElementById('mf276-add-search');if(next){next.focus({preventScroll:true});try{next.setSelectionRange(start,end);}catch(_){ }}}
  const bulk=document.getElementById('mf274-add-confirm');if(bulk){bulk.hidden=v392Mode('collection')!=='multi';bulk.disabled=!v274AddState().picks.size;bulk.innerHTML=V392_ICON_PLUS+' Add Selected ('+v274AddState().picks.size+')';}
}
// Avoid replacing the focused search input for single adds or checkbox taps.
function v392RefreshCollectionResults(){
  const c=v276CurrentAddCollection();if(!c)return;
  const data=v276AddData(c),results=document.getElementById('mf276-add-results'),footer=document.getElementById('mf276-add-footer');
  if(results){const scroll=results.scrollTop;results.innerHTML=v276AddResultsHtml(data.shown);results.scrollTop=scroll;}
  if(footer)footer.innerHTML=v276AddFooterHtml(data);
  const bulk=document.getElementById('mf274-add-confirm');if(bulk){bulk.disabled=!data.s.picks.size;bulk.hidden=v392Mode('collection')!=='multi';bulk.innerHTML=V392_ICON_PLUS+' Add Selected ('+data.s.picks.size+')';}
}
function v392Persist(){
  V392_SAVES.chain=V392_SAVES.chain.catch(()=>{}).then(()=>saveState());
  V392_SAVES.chain.catch(e=>{console.error('[v392] save failed',e);showToast('Could not save the change. Check Cloud Sync and try again.');});
  return V392_SAVES.chain;
}
function v392InsertCollectionTitles(id,ids){
  const c=v274CollectionById(id);if(!c)return 0;
  const before=new Set((c.titleIds||[]).map(String)),available=v392ValidLibraryIds();
  const added=[];
  for(const value of ids){const tid=String(value);if(tid&&available.has(tid)&&!before.has(tid)){c.titleIds.push(tid);before.add(tid);added.push(tid);}}
  if(!added.length)return 0;
  c.order=c.titleIds.slice();v274TouchCollection(c);
  // Update the Collection page instantly before awaiting any local/cloud I/O.
  render();v392RefreshCollectionResults();v392Persist();
  return added.length;
}
function v392AddCollectionTitle(id){const c=v276CurrentAddCollection();if(!c)return;const n=v392InsertCollectionTitles(c.id,[id]);if(n)showToast('Added to collection ✓');}
v274CommitAddTitles=function(id){
  const picks=v274AddState().picks;
  if(!picks.size)return;
  const count=v392InsertCollectionTitles(id,[...picks]);picks.clear();
  v392RefreshCollectionResults();if(count)showToast(`${count} title${count===1?'':'s'} added ✓`);
};
// Existing v279 search already keeps focus; whenever it uses the v276 results
// renderer our direct/added buttons are automatically included.

/* Personal Order Add Titles — original queue/XP mutation, no dialog closing. */
const v392OrderEnsureBase=v140EnsureOrderPickerUI;
v140EnsureOrderPickerUI=function(){const ui=v392OrderEnsureBase.apply(this,arguments);if(!ui.v392Initialized){ui.v392Initialized=true;if(ui.sort==='relevance')ui.sort='added-asc';}return ui;};
const V392_ORDER_SORT_CHOICES=[['added-asc','Date added · Oldest first'],['added-desc','Date added · Newest first'],['title-asc','Title · A–Z'],['title-desc','Title · Z–A'],['priority-desc','Priority · High first'],['priority-asc','Priority · Low first'],['rating-desc','Rating · High first'],['rating-asc','Rating · Low first'],['progress-desc','Progress · High first'],['progress-asc','Progress · Low first'],['total-desc','Total episodes · High first'],['total-asc','Total episodes · Low first'],['edited-desc','Last edited · Newest first'],['edited-asc','Last edited · Oldest first'],['random','Random']];
const v392OrderToolsBase=v140OrderPickerToolsHtml;
v140OrderPickerToolsHtml=function(){
  let html=String(v392OrderToolsBase.apply(this,arguments));
  const ui=v140EnsureOrderPickerUI(),value=ui.v392PreferredSort||'added-asc';
  const menu=`<label class="mf392-order-sort">Sort titles<select aria-label="Personal Order title sorting" onchange="App.v392SetOrderSort(this.value)">${V392_ORDER_SORT_CHOICES.map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${label}</option>`).join('')}</select></label>`;
  // v224 displays a paired legacy sort/direction control. Replace that pair
  // with a single explicit picker-specific sort so the manual queue is untouched.
  // v225 splits the sort field and sort direction into two sibling controls.
  // Replace both, or the legacy sort UI would remain visible and could conflict
  // with this picker's date-added default.
  const updated=html.replace(/<div class="v225-order-filter-control v225-order-filter-sort">[\s\S]*?<\/div>\s*<div class="v225-order-filter-control v225-order-filter-direction">[\s\S]*?<\/div>/,`<div class="v225-order-filter-control v225-order-filter-sort mf392-sort-control">${menu}</div>`);
  html=updated===html?html.replace(/<div class="v224-sort-pair">[\s\S]*?<\/div>/,menu):updated;
  return html;
};
function v392SetOrderSort(value){
  const ui=v140EnsureOrderPickerUI();
  if(!V392_ORDER_SORT_CHOICES.some(([id])=>id===value))return;
  ui.v392PreferredSort=value;ui.page=0;v141InvalidateOrderPickerCache();v141RefreshOrderPickerAll();
}
const v392OrderMatchesBase=v138PickerMatches;
v138PickerMatches=function(){
  const ui=v140EnsureOrderPickerUI(),sort=ui.v392PreferredSort||'added-asc',q=String(ui.search||'').toLowerCase().trim();
  // Base candidates retain category/status/priority logic. Include already
  // assigned titles in Direct Add to render their disabled checkmark state.
  let rows=(S.library||[]).filter(item=>item?.id&&(!q||[cleanTitle(item.title),v138OrderCategory(item.categoryId)?.name||'',item.status||'',item.priority||''].join(' ').toLowerCase().includes(q))&&(!ui.categories.length||ui.categories.includes(String(item.categoryId||'')))&&(ui.status==='all'||String(item.status||'planned').toLowerCase()===ui.status)&&(ui.priority==='all'||String(item.priority||'medium').toLowerCase()===ui.priority));
  if(sort==='random'){
    const seed=ui.v392Seed||(ui.v392Seed=Date.now()|0);
    const hash=id=>{let h=seed;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return h>>>0;};
    return rows.slice().sort((a,b)=>hash(String(a.id))-hash(String(b.id)));
  }
  const [key,dirText]=sort.split('-'),dir=dirText==='desc'?-1:1;
  if(key==='title')return rows.slice().sort((a,b)=>cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'})*dir);
  if(['added','edited','priority','rating','progress','total'].includes(key))return rows.slice().sort((a,b)=>v392CompareTitles(a,b,key==='added'?'added':key==='edited'?'edited':key,dir));
  return rows;
};
// HTML follows current v276 covers, v358 views and v359 pagination.
v138PickerResultsHtml=function(data){
  const page=data||v140OrderPickerPageData(),picks=page.ui.picks,existing=new Set((v138EnsureOrderPlan().titleIds||[]).map(String));
  if(!page.rows.length)return '<div class="hint" style="padding:12px">No Library titles match the current filters.</div>';
  return page.rows.map(item=>{
    const id=String(item.id),cat=v138OrderCategory(item.categoryId),done=existing.has(id),title=escapeHtml(cleanTitle(item.title));
    return `<div class="v138-picker-row mf276-picker-row mf392-picker-item mf392-order-row" data-mf392-id="${escapeHtml(id)}">
      ${v392Mode('titles')==='multi'&&!done?`<input type="checkbox" aria-label="Select ${title}" ${picks.has(id)?'checked':''} onchange="App.v138ToggleOrderPick('${escapeHtml(id)}',this.checked)">`:''}
      ${v276OrderPickerCoverHtml(item)}<span class="v138-picker-copy"><b>${title}</b><small>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Unknown')} · ${escapeHtml(v199StatusLabel(item.status))} · ${escapeHtml(v138ProgressText(item))}</small></span>
      ${v392Mode('titles')==='direct'||done?v392ActionHtml(done,`App.v392AddOrderTitle('${escapeHtml(id)}')`):''}
    </div>`;
  }).join('');
};
function v392UpdateOrderPickerTools(){
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf359-title-sheet');if(!sheet)return;
  let modes=sheet.querySelector('.mf392-modes');if(!modes){
    const result=sheet.querySelector('#v138-order-picker-results');
    if(result){const bar=document.createElement('div');bar.className='mf392-order-tools';bar.innerHTML=v392SwitchHtml('titles');result.before(bar);}
  }else modes.outerHTML=v392SwitchHtml('titles');
  const actions=sheet.querySelector('.v138-picker-actions');if(actions){actions.hidden=v392Mode('titles')!=='multi';
    const btn=actions.querySelector('#v138-order-add-selected');if(btn)btn.innerHTML=V392_ICON_PLUS+' Add Selected ('+v140EnsureOrderPickerUI().picks.size+')';}
}
function v392AddOrderTitle(id){
  const plan=v138EnsureOrderPlan(),tid=String(id||'');if(!tid||plan.titleIds.some(x=>String(x)===tid)||!(S.library||[]).some(i=>String(i?.id||'')===tid))return;
  plan.titleIds.push(tid);v138TouchOrderPlan();
  v141InvalidateOrderPickerCache();V392_ORDER_DIRTY=true;v141RefreshOrderPickerPageOnly();v392UpdateOrderPickerTools();showToast('Added to Personal Order ✓');
}
function v392OrderMultiAdd(){
  const ui=v140EnsureOrderPickerUI(),plan=v138EnsureOrderPlan(),existing=new Set(plan.titleIds.map(String)),valid=new Set((S.library||[]).map(i=>String(i?.id||'')));
  let n=0;for(const tid of ui.picks){if(valid.has(tid)&&!existing.has(tid)){plan.titleIds.push(tid);existing.add(tid);n++;}}
  ui.picks.clear();if(!n){v141RefreshOrderPickerPageOnly();v392UpdateOrderPickerTools();return;}
  v138TouchOrderPlan();v141InvalidateOrderPickerCache();V392_ORDER_DIRTY=true;v141RefreshOrderPickerPageOnly();v392UpdateOrderPickerTools();showToast(`${n} titles added to Personal Order ✓`);
}
v138AddSelectedOrderTitles=v392OrderMultiAdd;
App.v138AddSelectedOrderTitles=v392OrderMultiAdd;
App.v392SetOrderSort=v392SetOrderSort;

/* Personal Order Add Collections — keep sheet open and use existing queue touch. */
const V392_ASSIGN_SELECTION=new Set();
function v392AssignmentKey(id,cat){return String(cat)+'\u0001'+String(id);}
const v392AssignmentsBase=v287CollectionPickerResultsHtml;
v287CollectionPickerResultsHtml=function(){
  const data=v359CollectionPageData(),categoryId=String(data.ui.v287CollectionCategoryId||''),existing=new Set(v287Assignments(categoryId).map(a=>String(a.collectionId)));
  if(!data.shown.length)return '<div class="mf287-picker-empty">No Collections match these filters.</div>';
  return data.shown.map(c=>{
    const id=String(c.id),assigned=existing.has(id),key=v392AssignmentKey(id,categoryId),selected=V392_ASSIGN_SELECTION.has(key);
    const cover=v274CollectionCoverHtml(c,'mf287-picker-cover');
    return `<div class="mf287-picker-row mf392-picker-item mf392-collection-row" data-collection-id="${escapeHtml(id)}">${v392Mode('assignments')==='multi'&&!assigned?`<input type="checkbox" aria-label="Select ${escapeHtml(c.title||'Collection')}" ${selected?'checked':''} onchange="App.v392SelectAssignment('${escapeHtml(id)}','${escapeHtml(categoryId)}',this.checked)">`:''}${cover}<div class="mf287-picker-copy"><b>${escapeHtml(String(c.title||'Untitled Collection'))}</b><small>${v287CollectionTitleIds(c).length.toLocaleString()} titles${c.description?' · '+escapeHtml(String(c.description).slice(0,72)):''}</small></div>${v392Mode('assignments')==='direct'||assigned?v392ActionHtml(assigned,`App.v392AddAssignment('${escapeHtml(id)}','${escapeHtml(categoryId)}')`):''}</div>`;
  }).join('');
};
const v392CollectionPickerHtmlBase=v287CollectionPickerHtml;
v287CollectionPickerHtml=function(){
  let html=String(v392CollectionPickerHtmlBase.apply(this,arguments));
  const bar=`<div class="mf392-assignment-tools">${v392SwitchHtml('assignments')}<button class="mf392-add-selected btn btn-primary" type="button" ${v392Mode('assignments')==='multi'?'':'hidden'} onclick="App.v392CommitAssignments()">${V392_ICON_PLUS} Add Selected (${V392_ASSIGN_SELECTION.size})</button></div>`;
  return html.replace('<div id="mf287-collection-results"',bar+'<div id="mf287-collection-results"');
};
function v392UpdateAssignmentTools(){const sheet=document.querySelector('.mf359-collection-sheet');if(!sheet)return;const block=sheet.querySelector('.mf392-assignment-tools');if(block)block.innerHTML=v392SwitchHtml('assignments')+`<button class="mf392-add-selected btn btn-primary" type="button" ${v392Mode('assignments')==='multi'?'':'hidden'} ${V392_ASSIGN_SELECTION.size?'':'disabled'} onclick="App.v392CommitAssignments()">${V392_ICON_PLUS} Add Selected (${V392_ASSIGN_SELECTION.size})</button>`;}
function v392SelectAssignment(id,categoryId,checked){const k=v392AssignmentKey(id,categoryId);checked?V392_ASSIGN_SELECTION.add(k):V392_ASSIGN_SELECTION.delete(k);v392UpdateAssignmentTools();}
async function v392AddAssignment(id,categoryId){
  const plan=v287EnsureOrderExtensions(),collection=v287Collection(id),cat=v138OrderCategory(categoryId);
  if(!collection||!cat)return;
  if(plan.collectionAssignments.some(a=>String(a.collectionId)===String(id)&&String(a.categoryId)===String(categoryId)))return;
  const now=Date.now();plan.collectionAssignments.push({id:v287Id(),collectionId:String(id),categoryId:String(categoryId),categoryRule:'match',completedRule:'skip',createdAt:now,modifiedAt:now});
  v287ReconcileCategoryQueue(cat.id);
  // XP remains tracked by the existing v348-wrapped v287Touch.
  const saving=v287Touch();V392_ORDER_DIRTY=true;v287RefreshCollectionPicker();v392UpdateAssignmentTools();
  Promise.resolve(saving).catch(err=>{console.error('[v392] queue save',err);showToast('Could not sync the Collection assignment.');});
  showToast(`${collection.title} added to Personal Order ✓`);
}
async function v392CommitAssignments(){
  const ui=v287OrderUI(),cat=String(ui.v287CollectionCategoryId||'');
  const ids=[...V392_ASSIGN_SELECTION].filter(k=>k.startsWith(cat+'\u0001')).map(k=>k.split('\u0001')[1]);
  for(const id of ids)await v392AddAssignment(id,cat);
  for(const id of ids)V392_ASSIGN_SELECTION.delete(v392AssignmentKey(id,cat));
  v287RefreshCollectionPicker();v392UpdateAssignmentTools();
}
const v392OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  if(kind==='title'){V392_MODES.titles='direct';const ui=v140EnsureOrderPickerUI();ui.v392PreferredSort='added-asc';ui.page=0;}
  if(kind==='collection'){V392_MODES.assignments='direct';V392_ASSIGN_SELECTION.clear();V354_COLLECTION_PICK.sort='created';V354_COLLECTION_PICK.dir='asc';}
  const result=v392OpenSheetBase.apply(this,arguments);
  if(kind==='title'){v141InvalidateOrderPickerCache();v141RefreshOrderPickerPageOnly();v392UpdateOrderPickerTools();}
  if(kind==='collection'){v287RefreshCollectionPicker();v392UpdateAssignmentTools();}
  return result;
};
// Modal content is physically moved out of the Order page by v354. A full
// render while it is open destroys that moved node and closes the sheet.
// Defer the page re-render until the user explicitly closes the picker.
const v392CloseSheetBase=App.v354CloseSheet;
App.v354CloseSheet=function(){
  const wasOpen=!!document.querySelector('.mf354-sheet-backdrop');
  const result=v392CloseSheetBase.apply(this,arguments);
  if(wasOpen&&V392_ORDER_DIRTY){V392_ORDER_DIRTY=false;render();}
  return result;
};
// Keep the existing category picker event logic, refresh only toolbar counts.
const v392AssignmentRefreshBase=v287RefreshCollectionPicker;
v287RefreshCollectionPicker=function(){const r=v392AssignmentRefreshBase.apply(this,arguments);v392UpdateAssignmentTools();return r;};

/* Collection removal — optimistic view update directly after confirmation. */
function v392RemoveIds(c,ids){
  const rm=new Set(ids.map(String)),before=(c.titleIds||[]).slice();
  if(!before.some(id=>rm.has(String(id))))return 0;
  c.titleIds=before.filter(id=>!rm.has(String(id)));c.order=c.titleIds.slice();
  v274TouchCollection(c);S.librarySelection={};
  // User sees the confirmed change before saveState does any I/O.
  render();v392Persist();
  return before.length-c.titleIds.length;
}
v274RemoveTitle=async function(collectionId,titleId){
  const c=v274CollectionById(collectionId),item=v274LibraryItem(titleId);if(!c)return;
  const ok=await v279Confirm({title:'Remove title from collection?',body:`${item?v274SafeTitle(item):'This title'} will be removed from “${c.title}”. Your Library title stays intact.`,confirmLabel:'Remove title',danger:true});
  if(!ok)return;const count=v392RemoveIds(c,[titleId]);if(count)showToast('Removed from collection ✓');
};
v274RemoveSelectedFromCollection=async function(){
  const c=v274CollectionById(V274_UI.activeId);if(!c)return;
  const ids=v274SelectedCollectionIds(c);if(!ids.length)return;
  const ok=await v279Confirm({title:`Remove ${ids.length.toLocaleString()} selected titles?`,body:`The titles will leave “${c.title}” but stay in your Library.`,confirmLabel:'Remove selected',danger:true});
  if(!ok)return;const count=v392RemoveIds(c,ids);if(count)showToast(`${count} title${count===1?'':'s'} removed ✓`);
};
Object.assign(App,{v392SetMode,v392AddCollectionTitle,v392AddOrderTitle,v392SelectAssignment,v392AddAssignment,v392CommitAssignments,
  v274OpenAddTitles,v274CommitAddTitles,v274RemoveTitle,v274RemoveSelectedFromCollection});
// v225's broad text-driven automatic icon injection must not replace these
// deliberately chosen plus/check glyphs with the legacy circular-arrow icon.
const v392ButtonIconBase=v225ButtonIconName;
v225ButtonIconName=function(el){if(el?.matches?.('.mf392-action,.mf392-mode,.mf392-add-selected'))return null;return v392ButtonIconBase.apply(this,arguments);};
MediaFlowRuntime.version=V392_RELEASE;
window.MediaFlowV392={version:392,focus:'Instant Add for Collections and Personal Order, persistent pickers, optimistic Collection removal',
  audit:()=>({version:392,modes:{...V392_MODES},collectionOpen:!!document.getElementById('mf274-add-titles'),orderSheet:!!document.querySelector('.mf359-title-sheet'),assignSheet:!!document.querySelector('.mf359-collection-sheet')})};
