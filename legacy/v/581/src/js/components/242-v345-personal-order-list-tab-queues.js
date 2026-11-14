/* MediaFlow v345 — Personal Order queues: Lists / Tabs layouts.
   Existing title order, category order, collection assignments, mixed tokens,
   drag/reorder/edit actions, imports and exports retain their canonical data.
   Only the layout preference is persisted with orderPlan.v288QueueView. */
const V345_RELEASE=345;
const v345NormalizeQueueViewBase=v288NormalizeQueueView;
v288NormalizeQueueView=function(raw){
  const view=v345NormalizeQueueViewBase.apply(this,arguments);
  view.layoutMode=raw?.layoutMode==='tabs'?'tabs':'lists';
  view.collectionsBrowseMode=raw?.collectionsBrowseMode==='tabs'?'tabs':'lists';
  return view;
};
function v345UI(){
  v288UI();
  const ui=S.orderPlannerUI;
  if(!ui.v345Tabs||typeof ui.v345Tabs!=='object')ui.v345Tabs={main:'categories',categories:'',collections:''};
  return ui.v345Tabs;
}
function v345VisibleCategoryIds(){
  const p=v287EnsureOrderExtensions(),hidden=new Set((p.hiddenCategories||[]).map(String));
  return v138CategoryDisplayOrder().map(String).filter(cid=>!hidden.has(cid)&&!!v138OrderCategory(cid));
}
function v345TabSnapshot(kind){
  const ids=v345VisibleCategoryIds();
  const counts=new Map(),titleCounts=v156EnsureOrderStructure().byCategory;
  const assignmentCounts=new Map();
  for(const a of (S.orderPlan?.collectionAssignments||[])){
    const id=String(a?.categoryId||'');if(id)assignmentCounts.set(id,(assignmentCounts.get(id)||0)+1);
  }
  const mixed=v288EnsureQueueView().showCollectionsInRegularQueues;
  const visible=ids.filter(cid=>{
    const titles=(titleCounts.get(cid)||[]).length,collections=assignmentCounts.get(cid)||0;
    counts.set(cid,kind==='collections'?collections:titles);
    return kind==='collections'?collections>0:titles>0||(mixed&&collections>0);
  });
  return {ids:visible,counts};
}
function v345TabsData(kind){return v345TabSnapshot(kind).ids;}
function v345ActiveCategory(kind,ids=v345TabsData(kind)){
  const ui=v345UI(),key=kind==='collections'?'collections':'categories';
  const stored=String(ui[key]||'');
  if(!ids.includes(stored))ui[key]=ids[0]||'';
  return {ids,active:String(ui[key]||'')};
}
function v345TitleQueuePanel(cid){
  const p=v287EnsureOrderExtensions(),cat=v138OrderCategory(cid);
  if(!cat)return '';
  const showMixed=v288EnsureQueueView().showCollectionsInRegularQueues;
  const titleIds=v138CategoryTitleIds(cid),count=titleIds.length;
  let body='';
  if(showMixed){
    const queue=v287Queue(cid),total=queue.length;
    body=queue.map((token,i)=>{
      if(token.startsWith('t:')){
        const item=v138OrderItem(token.slice(2));return item?v138OrderRowHtml(item,i+1,cid):'';
      }
      if(token.startsWith('c:')){
        const a=v287Assignment(token.slice(2));return a?v288AssignmentRowHtml(a,i+1,total,'regular'):'';
      }
      return '';
    }).join('');
  }else{
    const ui=v173OrderUI(),size=p.paginateOrderedTitles?v175OrderPageSize():Math.max(1,count);
    const pages=p.paginateOrderedTitles?Math.max(1,Math.ceil(count/size)):1;
    const page=p.paginateOrderedTitles?Math.min(pages-1,Math.max(0,Number(ui.v173CategoryPages[cid])||0)):0;
    if(p.paginateOrderedTitles)ui.v173CategoryPages[cid]=page;
    const start=page*size;
    body=titleIds.slice(start,start+size).map((id,index)=>{
      const item=v138OrderItem(id);return item?v138OrderRowHtml(item,start+index+1,cid):'';
    }).join('');
    if(p.paginateOrderedTitles)body+=v173OrderPaginationHtml(page,pages,'category',cid);
  }
  return `<section class="card v138-category-card mf345-category-panel" aria-label="${escapeHtml(cat.name)} category order">
    <header class="v138-category-head"><div class="v138-category-head-copy"><b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b><small>Titles follow your Personal Order sequence${showMixed?' with assigned Collection blocks in their existing positions':''}.</small></div><span class="v138-category-count">${count.toLocaleString()} title${count===1?'':'s'}</span></header>
    <div class="v138-order-list">${body||'<div class="v138-order-empty">No titles currently ordered for this category.</div>'}</div>
  </section>`;
}
function v345CollectionQueuePanel(cid){
  const cat=v138OrderCategory(cid);if(!cat)return '';
  const assignments=v287Assignments(cid),queue=v287Queue(cid),rows=[];
  queue.forEach((token,index)=>{
    if(token.startsWith('t:')){
      const item=v138OrderItem(token.slice(2));if(item)rows.push(v288DirectQueueTitleHtml(item,index+1));
    }else if(token.startsWith('c:')){
      const a=v287Assignment(token.slice(2));if(a)rows.push(v288AssignmentRowHtml(a,index+1,queue.length,'collection'));
    }
  });
  return `<section class="card mf287-queue-group mf288-collection-queue-group mf345-collection-panel" aria-label="${escapeHtml(cat.name)} collection queue">
    <div class="mf287-queue-head"><div><span class="section-label">COLLECTION QUEUE</span><h3>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</h3><p>Direct titles and assigned Collection blocks keep their existing queue positions. Open a Collection to inspect its ordered titles.</p></div><span class="mf287-queue-count">${queue.length} queue item${queue.length===1?'':'s'} · ${assignments.length} Collection${assignments.length===1?'':'s'}</span></div>
    <div class="mf287-queue-list">${rows.join('')}</div>
  </section>`;
}
function v345CategoryTabs(kind){
  const {ids,counts}=v345TabSnapshot(kind),{active}=v345ActiveCategory(kind,ids);
  if(!ids.length)return `<div class="v138-order-empty mf345-empty"><b>${kind==='categories'?'No ordered category titles':'No collection queues yet'}</b>${kind==='categories'?'Add titles to Personal Order, or show a hidden category.':'Assign a Collection to a category from Personal Order to populate this section.'}</div>`;
  return `<div class="mf345-subnav-scroll"><div class="mf345-subnav" role="tablist" aria-label="${kind==='collections'?'Collection queue':'Category title'} categories">${ids.map(id=>{
    const cat=v138OrderCategory(id),isActive=id===active;
    const count=counts.get(id)||0;
    return `<button type="button" role="tab" class="mf345-subtab ${isActive?'active':''}" aria-selected="${isActive}" tabindex="${isActive?'0':'-1'}" title="${escapeHtml(cat?.name||'Category')}" data-v225-iconified="1" onclick="App.v345SelectCategory('${kind}','${escapeHtml(id)}')"><span class="mf345-tab-icon">${v144CategoryIconHtml(cat)}</span><span class="mf345-tab-label">${escapeHtml(cat?.name||'Category')}</span><span class="mf345-tab-count">${count.toLocaleString()}</span></button>`;
  }).join('')}</div></div><div class="mf345-category-content" role="tabpanel" aria-label="${escapeHtml(v138OrderCategory(active)?.name||'Category')}">${kind==='collections'?v345CollectionQueuePanel(active):v345TitleQueuePanel(active)}</div>`;
}
function v345TabLayoutHtml(){
  const ui=v345UI(),main=ui.main==='collections'?'collections':'categories';
  const p=v287EnsureOrderExtensions(),categories=v345VisibleCategoryIds();
  return `<div class="mf345-tab-layout" data-mf345-main="${main}"><div class="mf345-tab-head"><div><span class="section-label">ORDER QUEUES</span><h2>Browse by category</h2><p>Switch between category title orders and Collection queues without changing their saved positions.</p></div><span>${p.titleIds.length.toLocaleString()} ordered titles · ${p.collectionAssignments.length.toLocaleString()} Collection assignments</span></div>
    <div class="mf345-main-tabs" role="tablist" aria-label="Queue type"><button type="button" role="tab" class="mf345-main-tab ${main==='categories'?'active':''}" aria-selected="${main==='categories'}" data-v225-iconified="1" onclick="App.v345SelectMain('categories')">Category titles</button><button type="button" role="tab" class="mf345-main-tab ${main==='collections'?'active':''}" aria-selected="${main==='collections'}" data-v225-iconified="1" onclick="App.v345SelectMain('collections')">Collection queues</button></div>
    <div class="mf345-main-panel" role="tabpanel">${v345CategoryTabs(main)}</div>
    <div class="mf345-tab-foot">Tabs respect ${p.categoryMode==='custom'?'your custom Personal Order category sequence':'the configured Settings category sequence'}. Hidden categories stay hidden. ${categories.length} categor${categories.length===1?'y':'ies'} available.</div>
  </div>`;
}
function v345ViewToggleHtml(){
  const mode=v288EnsureQueueView().layoutMode;
  return `<div class="card mf345-layout-switch"><div><span class="section-label">QUEUE LAYOUT</span><b>View mode</b><small>Keep the complete Lists layout, or focus one category at a time using Tabs.</small></div><div class="mf345-layout-buttons" role="group" aria-label="Queue layout"><button type="button" class="btn btn-sm ${mode==='lists'?'btn-primary':'btn-ghost'}" data-v225-icon="list" aria-pressed="${mode==='lists'}" onclick="App.v345SetLayout('lists')">Lists</button><button type="button" class="btn btn-sm ${mode==='tabs'?'btn-primary':'btn-ghost'}" data-v225-icon="page" aria-pressed="${mode==='tabs'}" onclick="App.v345SetLayout('tabs')">Tabs</button></div></div>`;
}
const v345QueueControlsBase=v288QueueControlsHtml;
v288QueueControlsHtml=function(){return v345ViewToggleHtml()+v345QueueControlsBase.apply(this,arguments);};
const v345RenderOrderBase=renderOrder;
renderOrder=function(){
  const tabMode=v288EnsureQueueView().layoutMode==='tabs';
  let html='';
  if(!tabMode)html=v345RenderOrderBase.apply(this,arguments);
  else{
    // In Tabs mode the legacy Lists markup is replaced in the main panel.
    // Do not build thousands of hidden title rows or full Collection boards
    // first: temporarily stub those render-only helpers for this call.
    const all=v138AllTitlesHtml,byCategory=v138ByCategoryHtml,collections=v288CollectionQueueBoardHtml;
    try{
      v138AllTitlesHtml=()=>'';
      v138ByCategoryHtml=()=>'';
      v288CollectionQueueBoardHtml=()=>'';
      html=v345RenderOrderBase.apply(this,arguments);
    }finally{
      v138AllTitlesHtml=all;
      v138ByCategoryHtml=byCategory;
      v288CollectionQueueBoardHtml=collections;
    }
  }
  if(!tabMode)return html;
  const mainToken='<div class="v138-order-main">',sideToken='<div class="v138-order-side">';
  const start=html.indexOf(mainToken),side=html.indexOf(sideToken,start+mainToken.length);
  const close=html.lastIndexOf('</div>',side);
  if(start<0||side<0||close<start)return html;
  html=html.slice(0,start+mainToken.length)+v345TabLayoutHtml()+html.slice(close);
  return html.replace('class="v138-order-view"','class="v138-order-view mf345-order-tabs-mode"');
};
async function v345SetLayout(mode){
  const next=mode==='tabs'?'tabs':'lists';
  const v=v288EnsureQueueView();
  if(v.layoutMode===next)return;
  const p=S.orderPlan;
  v.layoutMode=next;
  p.v288QueueView=v;
  p.modifiedAt=Date.now();
  await saveState();
  render();
}
function v345RefreshTabs(){
  const isOrder=S.view==='order'&&v288EnsureQueueView().layoutMode==='tabs';
  const isCollections=S.view==='collections'&&v288EnsureQueueView().collectionsBrowseMode==='tabs'&&!String(V274_UI.activeId||'');
  if(!isOrder&&!isCollections)return false;
  const host=isOrder?document.querySelector('.v138-order-main'):document.querySelector('.mf345-collections-queue-view');
  if(!host)return false;
  host.innerHTML=v345TabLayoutHtml();
  const selected=host.querySelector('.mf345-subtab.active');
  if(selected&&selected.closest('.mf345-subnav-scroll'))selected.scrollIntoView?.({block:'nearest',inline:'nearest'});
  return true;
}
function v345SelectMain(main){
  const next=main==='collections'?'collections':'categories';
  v345UI().main=next;
  if(!v345RefreshTabs())render();
}
function v345SelectCategory(kind,id){
  const key=kind==='collections'?'collections':'categories',valid=v345TabsData(key);
  const sid=String(id||'');if(!valid.includes(sid))return;
  v345UI()[key]=sid;
  if(!v345RefreshTabs())render();
}
// The original Collection browser remains intact in Lists mode. Its Tabs
// mode exposes the same canonical Personal Order category and collection queues.
function v345CollectionsLayoutToggle(){
  const mode=v288EnsureQueueView().collectionsBrowseMode;
  return `<div class="card mf345-layout-switch mf345-collections-switch"><div><span class="section-label">COLLECTIONS LAYOUT</span><b>View mode</b><small>Use your existing Collections lists or browse ordered category titles and Collection queues as tabs.</small></div><div class="mf345-layout-buttons" role="group" aria-label="Collections layout"><button type="button" class="btn btn-sm ${mode==='lists'?'btn-primary':'btn-ghost'}" data-v225-icon="list" aria-pressed="${mode==='lists'}" onclick="App.v345SetCollectionsMode('lists')">Lists</button><button type="button" class="btn btn-sm ${mode==='tabs'?'btn-primary':'btn-ghost'}" data-v225-icon="page" aria-pressed="${mode==='tabs'}" onclick="App.v345SetCollectionsMode('tabs')">Tabs</button></div></div>`;
}
const v345CollectionsBrowserBase=v274CollectionsBrowserHtml;
v274CollectionsBrowserHtml=function(){
  const html=String(v345CollectionsBrowserBase.apply(this,arguments)||'');
  const marker='<div class="mf274-browser-toolbar card">';
  const index=html.indexOf(marker);
  if(index<0)return html;
  const toggle=v345CollectionsLayoutToggle();
  if(v288EnsureQueueView().collectionsBrowseMode!=='tabs')return html.slice(0,index)+toggle+html.slice(index);
  // Retain the existing Collections page heading and Add/Export/Import actions.
  // Replace only its browser toolbar + results with the queue tab workspace.
  return html.slice(0,index)+toggle+`<div class="mf345-collections-queue-view">${v345TabLayoutHtml()}</div></div>`;
};
async function v345SetCollectionsMode(mode){
  const next=mode==='tabs'?'tabs':'lists',v=v288EnsureQueueView();
  if(v.collectionsBrowseMode===next)return;
  const p=S.orderPlan;
  v.collectionsBrowseMode=next;
  p.v288QueueView=v;p.modifiedAt=Date.now();
  await saveState();
  render();
}
async function v345OpenQueueTabs(){
  const v=v288EnsureQueueView(),p=S.orderPlan;
  if(v.collectionsBrowseMode!=='tabs'){
    v.collectionsBrowseMode='tabs';p.v288QueueView=v;p.modifiedAt=Date.now();await saveState();
  }
  v345UI().main='collections';
  App.setView('collections');
}
// One canonical normalized orderPlan reference per tab render. Older Personal
// Order helpers normalize aggressively; stabilizing them only during this
// synchronous draw avoids repeated 30k–50k-title indexing for every row/tab.
let V345_TABS_RENDER_DEPTH=0;
const v345EnsureOrderPlanBase=v138EnsureOrderPlan;
v138EnsureOrderPlan=function(){
  if(V345_TABS_RENDER_DEPTH>0&&S.orderPlan)return S.orderPlan;
  return v345EnsureOrderPlanBase.apply(this,arguments);
};
const v345TabsHtmlBase=v345TabLayoutHtml;
v345TabLayoutHtml=function(){
  // Normalize once before pinning the reference for this render.
  v287EnsureOrderExtensions();
  V345_TABS_RENDER_DEPTH++;
  try{return v345TabsHtmlBase.apply(this,arguments);}
  finally{V345_TABS_RENDER_DEPTH--;}
};
Object.assign(App,{v345SetLayout,v345SelectMain,v345SelectCategory,v345SetCollectionsMode,v345OpenQueueTabs});
MediaFlowRuntime.version=V345_RELEASE;
window.MediaFlowV345={version:345,features:['Lists / Tabs queue layouts','Category ordered-title tabs','Collection queue tabs','Persisted layout preference','Collections browser Lists/Tabs toggle']};
