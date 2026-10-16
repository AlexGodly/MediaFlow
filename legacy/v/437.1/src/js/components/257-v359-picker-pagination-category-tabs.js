/* MediaFlow v359 — high-density Personal Order pickers with independently
 * persisted page size and clean category tab structure.
 * Read-only browsing enhancements: canonical queue/Collection actions unchanged. */
const V359_RELEASE=359;
const V359_PAGE_SIZES=[10,25,50,100,200,500];
function v359ValidPageSize(value,fallback=50){
  const n=Number(value);
  return V359_PAGE_SIZES.includes(n)?n:fallback;
}
function v359PagePrefs(){
  const settings=S.settings||(S.settings={});
  const raw=settings.v359PickerPagination&&typeof settings.v359PickerPagination==='object'?settings.v359PickerPagination:{};
  const prefs={titles:v359ValidPageSize(raw.titles),collections:v359ValidPageSize(raw.collections)};
  settings.v359PickerPagination=prefs;
  return prefs;
}
function v359PageSizeSelect(kind){
  const value=v359PagePrefs()[kind];
  const label=kind==='titles'?'Titles':'Collections';
  return `<label class="mf359-page-size-field"><span>${label} per page</span><select aria-label="${label} per page" onchange="App.v359SetPageSize('${kind}',this.value)">${V359_PAGE_SIZES.map(n=>`<option value="${n}" ${n===value?'selected':''}>${n}</option>`).join('')}</select></label>`;
}
function v359SavePrefs(){
  if(typeof v358SaveLater==='function')v358SaveLater();
  else try{persistSettings();}catch(_){ }
}

/* v140 previously replaced the page size on every access with the global
 * Library picker size. Resolve our independent persisted size last. The same
 * canonical pagination, sorting and selection functions are still used. */
const v359EnsureTitlePickerBase=v140EnsureOrderPickerUI;
v140EnsureOrderPickerUI=function(){
  const ui=v359EnsureTitlePickerBase.apply(this,arguments);
  ui.pageSize=v359PagePrefs().titles;
  return ui;
};

const v359TitleToolbarBase=v358TitleControls;
v358TitleControls=function(){
  const html=String(v359TitleToolbarBase.apply(this,arguments));
  const host=document.createElement('div');host.innerHTML=html;
  const bar=host.querySelector('.mf358-title-display');
  if(!bar)return html;
  const paging=document.createElement('div');
  paging.className='mf359-title-paging';
  paging.innerHTML=`<span class="mf359-page-summary" role="status" aria-live="polite">Loading titles…</span>${v359PageSizeSelect('titles')}`;
  bar.appendChild(paging);
  return host.innerHTML;
};
function v359UpdateTitlePager(data){
  const sheet=document.querySelector('.mf359-title-sheet');
  if(!sheet)return;
  const info=data||v140OrderPickerPageData();
  const label=sheet.querySelector('.mf359-page-summary');
  if(label){
    const start=info.candidates.length?info.start+1:0;
    const end=info.start+info.rows.length;
    label.textContent=`Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${info.candidates.length.toLocaleString()} titles`;
  }
  const select=sheet.querySelector('.mf359-title-paging select');
  if(select)select.value=String(v359PagePrefs().titles);
}
const v359TitlePageRefreshBase=v141RefreshOrderPickerPageOnly;
v141RefreshOrderPickerPageOnly=function(){
  const info=v359TitlePageRefreshBase.apply(this,arguments);
  v359UpdateTitlePager(info);
  return info;
};
const v359TitleAllRefreshBase=v141RefreshOrderPickerAll;
v141RefreshOrderPickerAll=function(){
  const info=v359TitleAllRefreshBase.apply(this,arguments);
  v359UpdateTitlePager(info);
  return info;
};

/* Collection candidate generation is still handled by v358, but we render
 * only the visible slice rather than constructing cards for every Collection.
 * This also removes the previously unbounded scrolling-results list. */
function v359CollectionUI(){
  const ui=v287OrderUI();
  ui.v359CollectionPage=Math.max(0,Math.floor(Number(ui.v359CollectionPage)||0));
  return ui;
}
function v359CollectionPageData(){
  const ui=v359CollectionUI(),rows=v287CollectionMatches();
  const size=v359PagePrefs().collections;
  const pages=Math.max(1,Math.ceil(rows.length/size));
  ui.v359CollectionPage=Math.min(ui.v359CollectionPage,pages-1);
  const start=ui.v359CollectionPage*size;
  return {ui,rows,pages,start,shown:rows.slice(start,start+size),size};
}
function v359CollectionPaginationHtml(page){
  const {ui,rows,pages,start,shown,size}=page;
  const current=ui.v359CollectionPage;
  const low=rows.length?start+1:0,high=start+shown.length;
  let from=Math.max(0,current-2);
  if(from+5>pages)from=Math.max(0,pages-5);
  const buttons=Array.from({length:Math.min(5,pages)},(_,i)=>i+from).map(n=>
    `<button type="button" class="mf359-page-number ${n===current?'active':''}" ${n===current?'aria-current="page"':''} aria-label="Collection page ${n+1}" onclick="App.v359CollectionPage(${n})">${n+1}</button>`).join('');
  const navigation=pages>1?`<nav class="mf359-collection-pagination" aria-label="Add Collections result pages"><button type="button" class="mf359-page-nav" ${current===0?'disabled':''} onclick="App.v359CollectionPage(${current-1})">Previous</button>${buttons}<button type="button" class="mf359-page-nav" ${current===pages-1?'disabled':''} onclick="App.v359CollectionPage(${current+1})">Next</button></nav>`:'';
  return `<div class="mf359-collection-page-info"><span>Showing ${low.toLocaleString()}–${high.toLocaleString()} of ${rows.length.toLocaleString()} Collections</span><span>Page ${current+1} of ${pages.toLocaleString()}</span></div>${navigation}`;
}

v287CollectionPickerResultsHtml=function(){
  const data=v359CollectionPageData();
  if(!data.shown.length)return `<div class="mf287-picker-empty">${v287Collections().length?'No Collections match these filters.':'No Collections yet. Create one on the Collections page first.'}</div>`;
  const categoryId=String(data.ui.v287CollectionCategoryId||'');
  const assigned=new Set(v287Assignments(categoryId).map(a=>String(a.collectionId)));
  return data.shown.map(c=>{
    const id=String(c.id||''),isAssigned=assigned.has(id),count=v287CollectionTitleIds(c).length;
    let cover='';
    try{cover=v274CollectionCoverHtml(c,'mf287-picker-cover');}
    catch(_){cover='<div class="mf287-picker-cover empty">◇</div>';}
    return `<div class="mf287-picker-row" data-collection-id="${escapeHtml(id)}">${cover}<div class="mf287-picker-copy"><b>${escapeHtml(String(c.title||'Untitled Collection'))}</b><small>${count.toLocaleString()} title${count===1?'':'s'}${c.description?` · ${escapeHtml(String(c.description).slice(0,72))}`:''}</small></div><button type="button" class="btn btn-sm ${isAssigned?'btn-ghost':'btn-primary'}" ${isAssigned?'disabled':''} onclick="App.v287AddCollectionAssignment('${escapeHtml(id)}','${escapeHtml(categoryId)}')">${isAssigned?'Assigned':'Add'}</button></div>`;
  }).join('');
};

/* The v287/v354/v358 composable picker HTML remains authoritative for its
 * search / assignment / filter controls. Wrap just the results and add page
 * controls adjacent to the results; the paginator isn't inside refreshed HTML. */
const v359CollectionMarkupBase=v287CollectionPickerHtml;
v287CollectionPickerHtml=function(){
  const html=String(v359CollectionMarkupBase.apply(this,arguments));
  const host=document.createElement('div');host.innerHTML=html;
  const results=host.querySelector('#mf287-collection-results');
  if(results){
    const pane=document.createElement('div');pane.className='mf359-collection-results-panel';
    results.before(pane);
    const header=document.createElement('div');header.className='mf359-collection-toolbar';
    header.innerHTML=`<span class="mf359-collection-toolbar-title">Browse Collections</span>${v359PageSizeSelect('collections')}`;
    const footer=document.createElement('div');footer.id='mf359-collection-pager';footer.className='mf359-collection-footer';
    footer.innerHTML=v359CollectionPaginationHtml(v359CollectionPageData());
    pane.append(header,results,footer);
  }
  return host.innerHTML;
};
const v359CollectionRefreshBase=v287RefreshCollectionPicker;
v287RefreshCollectionPicker=function(){
  const ret=v359CollectionRefreshBase.apply(this,arguments);
  const pager=document.getElementById('mf359-collection-pager');
  if(pager)pager.innerHTML=v359CollectionPaginationHtml(v359CollectionPageData());
  return ret;
};

function v359CollectionPage(index){
  const ui=v359CollectionUI();
  const page=Number(index);
  if(!Number.isFinite(page))return;
  ui.v359CollectionPage=Math.max(0,Math.floor(page));
  v287RefreshCollectionPicker();
  const box=document.querySelector('.mf359-collection-sheet #mf287-collection-results');
  if(box)box.scrollTop=0;
}
function v359SetPageSize(kind,value){
  if(kind!=='titles'&&kind!=='collections')return;
  const size=v359ValidPageSize(value,0);
  if(!size)return;
  const prefs=v359PagePrefs();
  if(prefs[kind]===size)return;
  prefs[kind]=size;
  v359SavePrefs();
  if(kind==='titles'){
    const ui=v140EnsureOrderPickerUI();ui.page=0;
    const data=v141RefreshOrderPickerPageOnly();
    v359UpdateTitlePager(data);
    document.querySelector('.mf359-title-sheet #v138-order-picker-results')?.scrollTo?.({top:0});
  }else{
    v359CollectionUI().v359CollectionPage=0;
    v287RefreshCollectionPicker();
    const box=document.querySelector('.mf359-collection-sheet #mf287-collection-results');
    if(box)box.scrollTop=0;
  }
}

/* All filter/search operations move Collection results back to page 1, but
 * preserve the chosen per-page preference and saved canonical queue order. */
function v359ResetCollectionPage(){v359CollectionUI().v359CollectionPage=0;}
const v359SetCollectionPickerBase=App.v354SetCollectionPicker;
App.v354SetCollectionPicker=function(){v359ResetCollectionPage();return v359SetCollectionPickerBase.apply(this,arguments);};
const v359SetCollectionSearchBase=App.v287SetCollectionSearch;
App.v287SetCollectionSearch=function(){v359ResetCollectionPage();return v359SetCollectionSearchBase.apply(this,arguments);};
const v359SetCollectionCategoryBase=App.v287SetCollectionCategory;
App.v287SetCollectionCategory=function(){v359ResetCollectionPage();return v359SetCollectionCategoryBase.apply(this,arguments);};
const v359CategoryPickBase=App.v358CategoryPick;
App.v358CategoryPick=function(){v359ResetCollectionPage();return v359CategoryPickBase.apply(this,arguments);};

/* Replace category-tab layout markup, not just gap styles. In v357/v358 the
 * single 17px icon lane caused image artwork to touch the name. The new tab
 * has an explicit 32px icon tile, label area, and fixed-size number badge. */
v345CategoryTabs=function(kind){
  const {ids,counts}=v345TabSnapshot(kind),{active}=v345ActiveCategory(kind,ids);
  if(!ids.length)return `<div class="v138-order-empty mf345-empty"><b>${kind==='categories'?'No ordered category titles':'No collection queues yet'}</b>${kind==='categories'?'Add titles to Personal Order, or show a hidden category.':'Assign a Collection to a category from Personal Order to populate this section.'}</div>`;
  const tabs=ids.map(id=>{
    const cat=v138OrderCategory(id),selected=id===active;
    const label=escapeHtml(cat?.name||'Category'),count=counts.get(id)||0;
    return `<button type="button" role="tab" class="mf345-subtab mf359-category-tab ${selected?'active':''}" aria-selected="${selected}" tabindex="${selected?'0':'-1'}" title="${label}" data-v225-iconified="1" onclick="App.v345SelectCategory('${kind}','${escapeHtml(id)}')"><span class="mf359-tab-art" aria-hidden="true">${v144CategoryIconHtml(cat)}</span><span class="mf359-tab-title">${label}</span><span class="mf359-tab-count">${count.toLocaleString()}</span></button>`;
  }).join('');
  return `<div class="mf345-subnav-scroll mf359-tab-scroll"><div class="mf345-subnav mf359-tab-strip" role="tablist" aria-label="${kind==='collections'?'Collection queue':'Category title'} categories">${tabs}</div></div><div class="mf345-category-content" role="tabpanel" aria-label="${escapeHtml(v138OrderCategory(active)?.name||'Category')}">${kind==='collections'?v345CollectionQueuePanel(active):v345TitleQueuePanel(active)}</div>`;
};

const v359OpenSheetBase=App.v354OpenSheet;
App.v354OpenSheet=function(kind){
  const result=v359OpenSheetBase.apply(this,arguments);
  const sheet=document.querySelector('.mf354-sheet-backdrop .mf358-title-sheet, .mf354-sheet-backdrop .mf358-collection-sheet');
  if(sheet){
    sheet.classList.add('mf359-'+(kind==='collection'?'collection':'title')+'-sheet');
    if(kind==='title')v359UpdateTitlePager();
  }
  return result;
};
Object.assign(App,{v359SetPageSize,v359CollectionPage});
MediaFlowRuntime.version=V359_RELEASE;
window.MediaFlowV359={version:359,features:['Configurable independent titles and Collections per page','Paged Collection rendering for large lists','Full results-area utilization','Purpose-built aligned category tabs with custom icons','Search/filter pagination reset without lost selections']};
