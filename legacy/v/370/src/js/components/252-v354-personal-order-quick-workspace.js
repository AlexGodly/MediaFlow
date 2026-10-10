/* MediaFlow v354 — Personal Order quick workspace, configurable-order-aware
   search/filter/sort, accessible Collection assignment and quick-add sheets.
   Browsing never mutates canonical queue order. All actions delegate to the
   existing Personal Order and Collection APIs, including their XP hooks. */
const V354_RELEASE=354;
const V354_MOBILE=window.matchMedia('(max-width: 1023px)');
const V354_TYPES=['categories','collections'];
const V354_FILTER_DEFAULT=()=>({search:'',category:'all',status:'all',priority:'all',sort:'queue',dir:'asc'});
let V354_SHEET=null;
const V354_MOBILE_FILTERS={categories:false,collections:false};
function v354Cfg(){
  const settings=S.settings||(S.settings={});
  const raw=settings.v354OrderBrowse&&typeof settings.v354OrderBrowse==='object'?settings.v354OrderBrowse:{};
  const out={};
  for(const kind of V354_TYPES){
    const v=raw[kind]||{};
    out[kind]={...V354_FILTER_DEFAULT(),
      category:String(v.category||'all'),status:String(v.status||'all'),priority:String(v.priority||'all'),
      sort:['queue','title','priority','status','rating','progress','count'].includes(v.sort)?v.sort:'queue',
      dir:v.dir==='desc'?'desc':'asc',search:String(v.search||'').slice(0,180)};
  }
  settings.v354OrderBrowse=out;
  return out;
}
function v354State(kind){return v354Cfg()[kind==='collections'?'collections':'categories'];}
function v354Persist(){try{persistSettings();}catch(e){console.warn('Personal Order browsing settings save:',e);}}
function v354CategoryIds(surface='categoryFilter'){
  const allowed=new Set((S.categories||[]).map(c=>String(c.id)));
  const ordered=typeof v230VisibleIds==='function'?v230VisibleIds(surface):v138CategoryDisplayOrder();
  const ids=ordered.map(String).filter(id=>allowed.has(id));
  return [...new Set(ids)];
}
function v354PriorityIds(){return typeof v230VisibleIds==='function'?v230VisibleIds('priorityFilter'):['high','medium','low'];}
function v354StatusIds(){return typeof v230VisibleIds==='function'?v230VisibleIds('statusFilter'):['active','paused','completed','dropped','planned'];}
function v354CategoryLabel(id){const cat=v138OrderCategory(id);return cat?`${v144CategoryIconHtml(cat)} <span>${escapeHtml(cat.name)}</span>`:'<span>All categories</span>';}
function v354CategorySelect(kind){
  const s=v354State(kind),options=v354CategoryIds();
  const selected=options.includes(s.category)?s.category:'all';
  const menuId=`mf354-${kind}-cat-options`;
  return `<div class="mf354-category-picker"><button type="button" class="mf354-category-trigger" aria-expanded="false" aria-controls="${menuId}" data-v225-iconified="1" onclick="App.v354ToggleCatMenu(this)"><span class="mf354-choice-label">${v354CategoryLabel(selected)}</span><span aria-hidden="true">⌄</span></button>
    <div id="${menuId}" class="mf354-category-popup" hidden><input type="search" aria-label="Search queue categories" placeholder="Search categories…" oninput="App.v354FindCategory(this.value,this.parentElement)"><div class="mf354-category-list" role="listbox"><button type="button" class="mf354-cat-option ${selected==='all'?'active':''}" data-v225-iconified="1" data-search="all categories" onclick="App.v354SetBrowse('${kind}','category','all')">All categories</button>${options.map(id=>{
      const c=v138OrderCategory(id);if(!c)return '';
      return `<button type="button" class="mf354-cat-option ${selected===id?'active':''}" role="option" aria-selected="${selected===id}" data-v225-iconified="1" data-search="${escapeHtml(v291NormalizeCategorySearch(c.name))}" onclick="App.v354SetBrowse('${kind}','category','${escapeHtml(id)}')">${v354CategoryLabel(id)}</button>`;
    }).join('')}</div><span class="mf354-search-empty" hidden>No matching categories.</span></div></div>`;
}
function v354Select(kind,key,ids,label){
  const s=v354State(kind);
  const choices=ids.map(id=>`<option value="${escapeHtml(id)}" ${s[key]===id?'selected':''}>${escapeHtml(label(id))}</option>`).join('');
  return `<select aria-label="${escapeHtml(key)} filter" onchange="App.v354SetBrowse('${kind}','${key}',this.value)">${choices}</select>`;
}
function v354Toolbar(kind){
  const s=v354State(kind),sortOptions=kind==='collections'
    ?[['queue','Saved queue'],['title','Collection/title name'],['count','Collection size'],['priority','Priority'],['status','Status'],['rating','Rating']]
    :[['queue','Saved order'],['title','Title A–Z'],['priority','Priority'],['status','Status'],['rating','Rating'],['progress','Progress']];
  const sortSelect=sortOptions.map(([key,label])=>`<option value="${key}" ${s.sort===key?'selected':''}>${label}</option>`).join('');
  const status=v354Select(kind,'status',['all',...v354StatusIds()],x=>x==='all'?'All statuses':v199StatusLabel(x));
  const priority=v354Select(kind,'priority',['all',...v354PriorityIds()],x=>x==='all'?'All priorities':x[0].toUpperCase()+x.slice(1));
  return `<div class="mf354-browse-tools ${V354_MOBILE_FILTERS[kind]?'mf354-filters-open':''}" data-kind="${kind}"><div class="mf354-browse-head"><div><b>${kind==='categories'?'Title filters & sorting':'Collection queue filters & sorting'}</b><small>Filter or sort the view without changing saved queue positions.</small></div><div class="mf354-filter-actions"><button type="button" class="mf354-toggle-filters" data-v225-iconified="1" aria-expanded="${V354_MOBILE_FILTERS[kind]}" onclick="App.v354ToggleFilters(this)">${V354_MOBILE_FILTERS[kind]?'Hide filters':'Filters & sort'} ⌄</button><button type="button" class="mf354-clear" data-v225-iconified="1" onclick="App.v354ResetBrowse('${kind}')">Reset</button></div></div>
    <div class="mf354-filter-fields"><label class="mf354-search-field"><span>Search</span><input type="search" autocomplete="off" value="${escapeHtml(s.search)}" placeholder="Search ${kind==='categories'?'titles':'Collections'}…" oninput="App.v354SetBrowseSearch('${kind}',this.value)"></label>
    <label class="mf354-category-field"><span>Category</span>${v354CategorySelect(kind)}</label>
    <label><span>Status</span>${status}</label><label><span>Priority</span>${priority}</label>
    <label><span>Sort by</span><select aria-label="Sort ${kind}" onchange="App.v354SetBrowse('${kind}','sort',this.value)">${sortSelect}</select></label>
    <label><span>Direction</span><select aria-label="Sort direction" onchange="App.v354SetBrowse('${kind}','dir',this.value)"><option value="asc" ${s.dir==='asc'?'selected':''}>${s.sort==='queue'?'Original order':'Ascending'}</option><option value="desc" ${s.dir==='desc'?'selected':''}>Descending</option></select></label></div>
    ${s.sort!=='queue'?'<div class="mf354-sort-note">Display sorting only. Saved order is unchanged; return to Saved order to reorder items.</div>':''}
  </div>`;
}
function v354Normalized(text){return v291NormalizeCategorySearch(String(text||''));}
function v354IsMatch(row,s){
  if(s.category!=='all'&&String(row.categoryId)!==s.category)return false;
  if(s.status!=='all'&&String(row.status)!==s.status)return false;
  if(s.priority!=='all'&&String(row.priority)!==s.priority)return false;
  if(s.search&&!v354Normalized(row.title+' '+(row.extra||'')).includes(v354Normalized(s.search)))return false;
  return true;
}
function v354RowMeta(token,categoryId,index){
  if(token.startsWith('t:')){
    const item=v138OrderItem(token.slice(2));if(!item)return null;
    return {token,item,kind:'title',index,position:index+1,title:String(item.title||''),extra:'',categoryId:String(item.categoryId||''),priority:String(item.priority||'low').toLowerCase(),status:String(item.status||'planned'),rating:Number(item.rating)||0,progress:Number(item.progress)||0,count:0};
  }
  if(token.startsWith('c:')){
    const assignment=v287Assignment(token.slice(2)),collection=v287AssignmentCollection(assignment);if(!assignment||!collection)return null;
    const members=v287CollectionTitleIds(collection).map(id=>v287LibraryItem(id)).filter(Boolean);
    const preferred=members.find(x=>String(x.categoryId)===String(categoryId))||members[0]||null;
    return {token,assignment,collection,kind:'collection',index,position:index+1,title:String(collection.title||'Untitled Collection'),extra:String(collection.description||''),categoryId:String(assignment.categoryId||''),priority:String(preferred?.priority||'low').toLowerCase(),status:String(preferred?.status||'planned'),rating:Number(preferred?.rating)||0,progress:Number(preferred?.progress)||0,count:members.length,
      statuses:members.map(x=>String(x.status||'')),priorities:members.map(x=>String(x.priority||'').toLowerCase())};
  }
  return null;
}
function v354FilterRows(rows,kind){
  const s=v354State(kind);
  return rows.filter(r=>{
    if(kind==='collections'&&r.kind==='collection'){
      if(s.category!=='all'&&s.category!==r.categoryId)return false;
      if(s.status!=='all'&&!r.statuses.includes(s.status))return false;
      if(s.priority!=='all'&&!r.priorities.includes(s.priority))return false;
      if(s.search&&!v354Normalized(r.title+' '+r.extra).includes(v354Normalized(s.search)))return false;
      return true;
    }
    return v354IsMatch(r,s);
  }).sort((a,b)=>{
    let d=0;
    if(s.sort==='title')d=a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'});
    if(s.sort==='priority'){
      const order=v354PriorityIds();d=order.indexOf(a.priority)-order.indexOf(b.priority);
    }
    if(s.sort==='status'){
      const order=v354StatusIds();d=order.indexOf(a.status)-order.indexOf(b.status);
    }
    if(s.sort==='rating')d=a.rating-b.rating;
    if(s.sort==='progress')d=a.progress-b.progress;
    if(s.sort==='count')d=a.count-b.count;
    if(s.sort==='queue')d=a.index-b.index;
    return (s.dir==='desc'?-d:d)||a.index-b.index;
  });
}
function v354HasFilters(kind){const v=v354State(kind);return !!(v.search||v.category!=='all'||v.status!=='all'||v.priority!=='all'||v.sort!=='queue'||v.dir!=='asc');}
function v354RowsForCategory(kind,cid){
  const mixed=kind==='collections'||v288EnsureQueueView().showCollectionsInRegularQueues;
  const tokens=mixed?v287Queue(cid):v138CategoryTitleIds(cid).map(id=>`t:${id}`);
  const rows=tokens.map((token,index)=>v354RowMeta(token,cid,index)).filter(Boolean);
  return v354FilterRows(rows,kind);
}
function v354TitleOutput(row,cid){
  if(row.kind==='title')return v138OrderRowHtml(row.item,row.position,cid);
  return v288AssignmentRowHtml(row.assignment,row.position,v287Queue(cid).length,'regular');
}
function v354CollectionOutput(row,cid){
  if(row.kind==='title')return v288DirectQueueTitleHtml(row.item,row.position);
  return v288AssignmentRowHtml(row.assignment,row.position,v287Queue(cid).length,'collection');
}
function v354Paged(rows,kind,cid){
  const p=v287EnsureOrderExtensions(),size=p.paginateOrderedTitles?v175OrderPageSize():Math.max(1,rows.length),pages=Math.max(1,Math.ceil(rows.length/size));
  let page=0;
  if(kind==='collections'){
    page=Math.max(0,Math.min(pages-1,Number(V346_COLLECTION_PAGES[cid])||0));V346_COLLECTION_PAGES[cid]=page;
  }else{
    const ui=v173OrderUI();page=Math.max(0,Math.min(pages-1,Number(ui.v173CategoryPages[cid])||0));ui.v173CategoryPages[cid]=page;
  }
  return {rows:rows.slice(page*size,(page+1)*size),page,pages};
}
const v354TitlePanelBase=v345TitleQueuePanel;
v345TitleQueuePanel=function(cid){
  if(!v354HasFilters('categories'))return v354TitlePanelBase.apply(this,arguments);
  const cat=v138OrderCategory(cid);if(!cat)return '';
  const rows=v354RowsForCategory('categories',cid),paged=v354Paged(rows,'categories',cid),sorted=v354State('categories').sort!=='queue';
  return `<section class="card v138-category-card mf345-category-panel mf354-results ${sorted?'mf354-sorted':''}"><header class="v138-category-head"><b>${v354CategoryLabel(cid)}</b><span class="v138-category-count">${rows.length.toLocaleString()} matches</span></header><div class="v138-order-list">${paged.rows.map(r=>v354TitleOutput(r,cid)).join('')||'<div class="v138-order-empty">No titles match the current filters.</div>'}</div>${v346Pager('titles',cid,paged.page,paged.pages)}</section>`;
};
const v354CollectionPanelBase=v345CollectionQueuePanel;
v345CollectionQueuePanel=function(cid){
  if(!v354HasFilters('collections'))return v354CollectionPanelBase.apply(this,arguments);
  const cat=v138OrderCategory(cid);if(!cat)return '';
  const rows=v354RowsForCategory('collections',cid),paged=v354Paged(rows,'collections',cid),sorted=v354State('collections').sort!=='queue';
  return `<section class="card mf287-queue-group mf288-collection-queue-group mf345-collection-panel mf354-results ${sorted?'mf354-sorted':''}"><div class="mf287-queue-head"><b>${v354CategoryLabel(cid)}</b><span class="mf287-queue-count">${rows.length.toLocaleString()} matches</span></div><div class="mf287-queue-list">${paged.rows.map(r=>v354CollectionOutput(r,cid)).join('')||'<div class="v138-order-empty">No queue entries match the filters.</div>'}</div>${v346Pager('collections',cid,paged.page,paged.pages)}</section>`;
};
const v354TabsBase=v345TabLayoutHtml;
v345TabLayoutHtml=function(){
  const html=String(v354TabsBase.apply(this,arguments));
  const kind=v345UI().main==='collections'?'collections':'categories';
  return html.replace('<div class="mf345-main-panel" role="tabpanel">',`${v354Toolbar(kind)}<div class="mf345-main-panel" role="tabpanel">`);
};
function v354ListResults(){
  const rows=v138OrderedItems().map((item,index)=>({item,kind:'title',index,position:index+1,title:String(item.title||''),extra:'',categoryId:String(item.categoryId||''),priority:String(item.priority||'low').toLowerCase(),status:String(item.status||'planned'),rating:Number(item.rating)||0,progress:Number(item.progress)||0,count:0}));
  const s=v354State('categories'),filtered=v354FilterRows(rows,'categories');
  const p=v287EnsureOrderExtensions(),size=p.paginateOrderedTitles?v175OrderPageSize():50,total=Math.max(1,Math.ceil(filtered.length/size));
  const ui=v354UI(),page=Math.max(0,Math.min(total-1,ui.listPage||0));ui.listPage=page;
  return `<div class="card mf354-list-result-panel ${s.sort!=='queue'?'mf354-sorted':''}"><div class="mf354-list-head"><b>Filtered ordered titles</b><span>${filtered.length.toLocaleString()} matches</span></div><div class="v138-order-list">${filtered.slice(page*size,(page+1)*size).map(row=>v138OrderRowHtml(row.item,row.position,'')).join('')||'<div class="v138-order-empty">No ordered titles match these filters.</div>'}</div><nav class="mf354-list-pager"><button type="button" class="btn btn-sm btn-ghost" ${page===0?'disabled':''} onclick="App.v354ListPage(${page-1})">Previous</button><span>Page ${page+1} / ${total}</span><button type="button" class="btn btn-sm btn-ghost" ${page===total-1?'disabled':''} onclick="App.v354ListPage(${page+1})">Next</button></nav></div>`;
}
function v354UI(){const ui=S.orderPlannerUI=S.orderPlannerUI||{};return ui.v354||(ui.v354={listPage:0});}
function v354MainContentRefresh(){
  if(S.view!=='order')return;
  if(v288EnsureQueueView().layoutMode==='tabs'){
    // Selecting a filter should keep the selected category consistent with it.
    const main=v345UI().main,filter=v354State(main);
    if(filter.category!=='all'&&v345TabsData(main).includes(filter.category))v345UI()[main]=filter.category;
    v345RefreshTabs();
  }else{
    const root=document.querySelector('.v138-order-view');if(!root)return;
    const main=root.querySelector('.v138-order-main');if(!main)return;
    if(v354HasFilters('categories'))main.innerHTML=v354ListResults();
    else render();
  }
}
function v354ToggleFilters(button){
  const box=button?.closest('.mf354-browse-tools');if(!box)return;
  const kind=box.dataset.kind==='collections'?'collections':'categories';
  V354_MOBILE_FILTERS[kind]=!V354_MOBILE_FILTERS[kind];
  box.classList.toggle('mf354-filters-open',V354_MOBILE_FILTERS[kind]);
  button.setAttribute('aria-expanded',String(V354_MOBILE_FILTERS[kind]));
  button.innerHTML=V354_MOBILE_FILTERS[kind]?'Hide filters ⌃':'Filters & sort ⌄';
}
function v354SetBrowse(kind,key,value){
  if(!V354_TYPES.includes(kind)||!['category','status','priority','sort','dir'].includes(key))return;
  v354State(kind)[key]=String(value);
  v354UI().listPage=0;v354Persist();v354MainContentRefresh();
}
function v354SetBrowseSearch(kind,value){
  v354State(kind).search=String(value||'').slice(0,180);
  v354UI().listPage=0;
  // Do not destroy the focused search input on every keystroke.
  if(S.view==='order'&&v288EnsureQueueView().layoutMode==='tabs'){
    const pane=document.querySelector('.mf345-category-content');const main=v345UI().main;
    const active=v345ActiveCategory(main).active;
    if(pane&&active)pane.innerHTML=main==='collections'?v345CollectionQueuePanel(active):v345TitleQueuePanel(active);
  }else if(S.view==='order'&&v354HasFilters('categories')){
    const main=document.querySelector('.v138-order-main');if(main)main.innerHTML=v354ListResults();
  }
}
function v354ResetBrowse(kind){v354Cfg()[kind]=V354_FILTER_DEFAULT();v354UI().listPage=0;v354Persist();render();}
function v354ListPage(page){v354UI().listPage=Math.max(0,Number(page)||0);const main=document.querySelector('.v138-order-main');if(main)main.innerHTML=v354ListResults();}
function v354ToggleCatMenu(btn){
  const popup=btn?.parentElement?.querySelector('.mf354-category-popup');if(!popup)return;
  const open=popup.hidden;document.querySelectorAll('.mf354-category-popup').forEach(x=>x.hidden=true);
  popup.hidden=!open;btn.setAttribute('aria-expanded',String(open));
  if(open)popup.querySelector('input')?.focus();
}
function v354FindCategory(value,popup){
  if(!popup)return;
  const q=v354Normalized(value),rows=[...popup.querySelectorAll('.mf354-cat-option')];let seen=0;
  for(const row of rows){row.hidden=!!(q&&!String(row.dataset.search||'').includes(q));if(!row.hidden)seen++;}
  const empty=popup.querySelector('.mf354-search-empty');if(empty)empty.hidden=seen>0;
}
// Improve the preexisting Add Titles filters: use the saved Filter order and
// visibility (including inherited Set Priority configurations) everywhere.
const v354OrderPickerToolsBase=v140OrderPickerToolsHtml;
v140OrderPickerToolsHtml=function(){
  const html=String(v354OrderPickerToolsBase.apply(this,arguments));
  const box=document.createElement('div');box.innerHTML=html;
  const catPanel=box.querySelector('.v66-cat-panel');
  if(catPanel){
    const options=[...catPanel.querySelectorAll('.v66-cat-option')],map=new Map(options.map(el=>[String(el.querySelector('input')?.getAttribute('onchange')||'').match(/'([^']+)'/)?.[1]||'',el]));
    const ids=v354CategoryIds('categoryFilter');
    const ordered=ids.map(id=>map.get(id)).filter(Boolean);
    const search=document.createElement('input');search.type='search';search.className='mf354-picker-category-search';search.placeholder='Search categories…';search.setAttribute('aria-label','Search Add Title categories');search.setAttribute('oninput','App.v354FindPickerCategories(this.value,this.parentElement)');
    const list=document.createElement('div');list.className='mf354-picker-category-list';ordered.forEach(el=>{el.dataset.search=v354Normalized(el.textContent);list.append(el);});
    catPanel.append(search,list);
  }
  const priority=box.querySelector('select[aria-label="Order Library title priority"]');
  if(priority){const saved=priority.value;const opts=new Map([...priority.options].map(x=>[x.value,x]));
    priority.innerHTML='';for(const id of ['all',...v354PriorityIds()])if(opts.has(id))priority.append(opts.get(id));
    priority.value=opts.has(saved)?saved:'all';
  }
  return box.innerHTML;
};
function v354FindPickerCategories(value,parent){
  const query=v354Normalized(value);
  parent?.querySelectorAll('.mf354-picker-category-list .v66-cat-option').forEach(el=>{el.hidden=!!(query&&!el.dataset.search.includes(query));});
}
// Collection queue assignment: Set Category's configured order and search,
// Collection content-category/priority filters and independent sorting.
const V354_COLLECTION_PICK={category:'all',priority:'all',sort:'title',dir:'asc'};
const v354CollectionMatchBase=v287CollectionMatches;
v287CollectionMatches=function(){
  let rows=v354CollectionMatchBase.apply(this,arguments);
  if(V354_COLLECTION_PICK.category!=='all'||V354_COLLECTION_PICK.priority!=='all'){
    rows=rows.filter(c=>{
      const items=v287CollectionTitleIds(c).map(id=>v287LibraryItem(id)).filter(Boolean);
      return items.some(item=>(V354_COLLECTION_PICK.category==='all'||String(item.categoryId)===V354_COLLECTION_PICK.category)
        &&(V354_COLLECTION_PICK.priority==='all'||String(item.priority||'').toLowerCase()===V354_COLLECTION_PICK.priority));
    });
  }
  rows.sort((a,b)=>{
    let d=0;const sort=V354_COLLECTION_PICK.sort;
    if(sort==='count')d=v287CollectionTitleIds(a).length-v287CollectionTitleIds(b).length;
    else if(sort==='recent')d=(Number(a.modifiedAt||a.createdAt)||0)-(Number(b.modifiedAt||b.createdAt)||0);
    else d=String(a.title||'').localeCompare(String(b.title||''),undefined,{numeric:true,sensitivity:'base'});
    return (V354_COLLECTION_PICK.dir==='desc'?-d:d)||String(a.id).localeCompare(String(b.id));
  });
  return rows;
};
function v354AssignmentCategories(){
  const model=v290ResolvedCategoryState(),map=new Map((S.categories||[]).map(c=>[String(c.id),c]));
  const ids=[...model.order].filter(id=>map.has(String(id)));
  return ids.map(id=>map.get(id));
}
function v354AssignmentSelect(){
  const id=String(v287OrderUI().v287CollectionCategoryId||''),cat=v138OrderCategory(id),cats=v354AssignmentCategories();
  return `<div class="mf354-assignment-picker"><button type="button" class="mf354-category-trigger" aria-expanded="false" data-v225-iconified="1" onclick="App.v354ToggleCatMenu(this)"><span class="mf354-choice-label">${v354CategoryLabel(id)}</span><span>⌄</span></button>
    <div class="mf354-category-popup" hidden><input type="search" placeholder="Search assignment categories…" aria-label="Search assignment categories" oninput="App.v354FindCategory(this.value,this.parentElement)"><div class="mf354-category-list">${cats.map(c=>`<button type="button" class="mf354-cat-option ${String(c.id)===id?'active':''}" data-v225-iconified="1" data-search="${escapeHtml(v354Normalized(c.name))}" onclick="App.v354AssignCategory('${escapeHtml(String(c.id))}')">${v354CategoryLabel(String(c.id))}</button>`).join('')}</div><span class="mf354-search-empty" hidden>No matching categories.</span></div></div>`;
}
const v354CollectionPickerBase=v287CollectionPickerHtml;
v287CollectionPickerHtml=function(){
  let html=String(v354CollectionPickerBase.apply(this,arguments));
  const cats=v354CategoryIds('categoryFilter'),priorities=v354PriorityIds();
  const catOptions=[['all','All title categories'],...cats.map(id=>[id,v138OrderCategory(id)?.name||id])];
  const htmlSelect=(key,options)=>`<select aria-label="Collection ${key} filter" onchange="App.v354SetCollectionPicker('${key}',this.value)">${options.map(([id,label])=>`<option value="${escapeHtml(id)}" ${V354_COLLECTION_PICK[key]===id?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select>`;
  html=html.replace(/<label class="mf287-field"><span>Task category<\/span><select[^]*?<\/select><\/label>/,
    `<label class="mf287-field mf354-assign-field"><span>Assign Collection to category</span>${v354AssignmentSelect()}</label>`);
  const tools=`<details class="mf354-collection-filter-disclosure" ${V354_MOBILE.matches?'':'open'}><summary>Collection filters & sorting</summary><div class="mf354-collection-picker-controls"><label><span>Filter titles by category</span>${htmlSelect('category',catOptions)}</label><label><span>Filter by priority</span>${htmlSelect('priority',[['all','All priorities'],...priorities.map(x=>[x,x[0].toUpperCase()+x.slice(1)])])}</label><label><span>Sort Collections</span>${htmlSelect('sort',[['title','Name'],['count','Number of titles'],['recent','Recently edited']])}</label><label><span>Direction</span>${htmlSelect('dir',[['asc','Ascending'],['desc','Descending']])}</label></div></details>`;
  html=html.replace('<div id="mf287-collection-results"',tools+'<div id="mf287-collection-results"');
  return html;
};
function v354AssignCategory(id){
  if(!v138OrderCategory(id))return;
  App.v287SetCollectionCategory(id);
  const picker=document.querySelector('.mf354-assignment-picker');if(!picker)return;
  picker.querySelector('.mf354-choice-label').innerHTML=v354CategoryLabel(id);
  picker.querySelector('.mf354-category-popup').hidden=true;
  picker.querySelectorAll('.mf354-cat-option').forEach(el=>el.classList.toggle('active',el.getAttribute('onclick')?.includes(`'${id}'`)));
}
function v354SetCollectionPicker(key,val){if(!['category','priority','sort','dir'].includes(key))return;V354_COLLECTION_PICK[key]=String(val);v287RefreshCollectionPicker();}
function v354QuickBar(){
  const tabs=v288EnsureQueueView().layoutMode==='tabs';
  return `<div class="mf354-quickbar"><div class="mf354-quickbar-intro"><div><span class="section-label">YOUR QUEUE</span><h2>Personal Order</h2><small>Add, browse, filter and reorder without scrolling through Settings.</small></div><div class="mf354-add-actions"><button type="button" class="btn btn-primary" data-v225-icon="add" onclick="App.v354OpenSheet('title')">Add title</button><button type="button" class="btn" data-v225-icon="folder" onclick="App.v354OpenSheet('collection')">Add Collection</button></div></div>
    <div class="mf354-quick-switch" role="group" aria-label="Personal Order view"><button type="button" class="btn ${!tabs?'btn-primary':'btn-ghost'}" onclick="App.v345SetLayout('lists')">Lists</button><button type="button" class="btn ${tabs?'btn-primary':'btn-ghost'}" onclick="App.v345SetLayout('tabs')">Tabs</button><button type="button" class="btn btn-ghost mf354-category-access" onclick="App.v354OpenSheet('categories')">Category display</button><button type="button" class="btn btn-ghost mf354-advanced-access" onclick="App.v354ToggleAdvanced()">Queue tools</button></div>
  </div>`;
}
const v354RenderOrderBase=renderOrder;
renderOrder=function(){
  let html=String(v354RenderOrderBase.apply(this,arguments));
  const marker='<div class="v138-order-view';
  const pos=html.indexOf(marker);if(pos<0)return html;
  const after=html.indexOf('>',pos);if(after<0)return html;
  html=html.slice(0,after+1)+v354QuickBar()+html.slice(after+1);
  if(v288EnsureQueueView().layoutMode!=='tabs'){
    const toolbar=v354Toolbar('categories');
    html=html.replace('<div class="v138-order-grid">',toolbar+'<div class="v138-order-grid">');
    if(v354HasFilters('categories')){
      const start='<div class="v138-order-main">',end='<div class="v138-order-side">',i=html.indexOf(start),j=html.indexOf(end,i+start.length);
      if(i>=0&&j>i){const tail=html.lastIndexOf('</div>',j);if(tail>i)html=html.slice(0,i+start.length)+v354ListResults()+html.slice(tail);}
    }
  }
  return html;
};
function v354OpenSheet(kind){
  if(S.view!=='order')return;
  v354CloseSheet();
  let item=null;
  const sidebar=document.querySelector('.v138-order-side');
  if(kind==='title')item=sidebar?.querySelector(':scope > .card:not(.mf287-add-collection-card)');
  if(kind==='collection')item=sidebar?.querySelector('.mf287-add-collection-card');
  if(kind==='categories'){
    const box=document.createElement('div');box.innerHTML=v138CategoryManagerHtml();item=box.firstElementChild;
  }
  if(!item)return;
  const origin=item.parentNode,marker=document.createComment('MediaFlow v354 sheet placeholder');
  if(origin)origin.insertBefore(marker,item);
  const shade=document.createElement('div');shade.className='mf354-sheet-backdrop';shade.setAttribute('role','presentation');
  shade.innerHTML=`<div class="mf354-sheet" role="dialog" aria-modal="true" aria-label="${kind==='title'?'Add titles':kind==='collection'?'Add Collections':'Category display'}"><div class="mf354-sheet-header"><b>${kind==='title'?'Add titles':kind==='collection'?'Add Collections':'Category display'}</b><button type="button" class="btn btn-sm btn-ghost" data-v225-iconified="1" onclick="App.v354CloseSheet()">Close ×</button></div><div class="mf354-sheet-body"></div></div>`;
  shade.querySelector('.mf354-sheet-body').append(item);
  document.body.append(shade);
  shade.addEventListener('click',e=>{if(e.target===shade)v354CloseSheet();});
  V354_SHEET={shade,marker,item,origin};
  shade.querySelector('input[type="search"],input[type="text"]')?.focus({preventScroll:true});
}
function v354CloseSheet(){
  if(!V354_SHEET)return;
  const {shade,marker,item,origin}=V354_SHEET;V354_SHEET=null;
  if(marker.isConnected&&origin?.isConnected)origin.insertBefore(item,marker);
  marker.remove();shade.remove();
}
function v354ToggleAdvanced(){
  const btn=document.querySelector('.mf350-order-toggle-row .mf350-mobile-toggle');
  if(btn)btn.click();else document.querySelector('.mf288-queue-controls')?.scrollIntoView({behavior:'smooth',block:'center'});
}
const v354RenderBase=render;
render=function(){v354CloseSheet();return v354RenderBase.apply(this,arguments);};
const v354RenderViewBase=renderView;
renderView=function(){v354CloseSheet();return v354RenderViewBase.apply(this,arguments);};
try{window.addEventListener('keydown',e=>{if(e.key==='Escape')v354CloseSheet();});}catch(_){}
// In both v225 and v226 passes the category chooser already contains icons.
const v354ButtonIconBase=v225ButtonIconName;
v225ButtonIconName=function(el){if(el?.matches?.('.mf354-category-trigger,.mf354-cat-option,.mf354-clear,.mf354-sheet-header button'))return null;return v354ButtonIconBase.apply(this,arguments);};
Object.assign(App,{v354OpenSheet,v354CloseSheet,v354ToggleAdvanced,v354ToggleFilters,v354SetBrowse,v354SetBrowseSearch,v354ResetBrowse,v354ListPage,v354ToggleCatMenu,v354FindCategory,v354FindPickerCategories,v354AssignCategory,v354SetCollectionPicker});
MediaFlowRuntime.version=V354_RELEASE;
window.MediaFlowV354={version:354,features:['Personal Order quick-add sheets','Desktop and mobile queue filters and sorting','Settings-ordered searchable category filter','Settings-ordered priority choices','Searchable Collection assignment category','Independent Collection picker filters','Saved-order-safe presentation sorting']};
