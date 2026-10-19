/* MediaFlow v346 — meaningful queue main-tab icons, single category icons,
   and working ordered-title pagination / page size / cover size in Tabs mode.
   Uses the canonical v173/v175/v181 persisted settings and queue row renderers. */
const V346_RELEASE=346;

// The v225 and v226 button decorators both touch tab buttons. Opt them out
// at the semantic source, so a second circle-arrow cannot reappear after
// the mutation observer runs (including following a tab rerender).
const v346ButtonIconNameBase=v225ButtonIconName;
v225ButtonIconName=function(el){
  if(el?.matches?.('.mf345-subtab,.mf345-main-tab'))return null;
  return v346ButtonIconNameBase.apply(this,arguments);
};

const V346_MAIN_ICONS={
  categories:'<svg class="mf346-main-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h6.5a3 3 0 0 1 3 3V20a3 3 0 0 0-3-3H4z"/><path d="M20 5.5h-6.5a3 3 0 0 0-3 3V20a3 3 0 0 1 3-3H20z"/><path d="M6.5 10h3M6.5 13h3M15 10h2.5M15 13h2.5"/></svg>',
  collections:'<svg class="mf346-main-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.5h6l2 2h9v9.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19Z"/><path d="M3.5 7.5V5A1.5 1.5 0 0 1 5 3.5h6.2l2 2h5.8"/><path d="M8.5 13h7M8.5 16h5"/></svg>'
};

function v346QueueControlsHtml(){
  const plan=v287EnsureOrderExtensions(),enabled=!!plan.paginateOrderedTitles;
  const limit=v175OrderPageSize();
  // Reuse the same callbacks that Lists mode uses. This is not a second copy
  // of pagination or a different cover-size setting.
  return `<div class="mf346-queue-controls card" role="group" aria-label="Tabbed queue display tools">
    <div class="mf346-pagination-tools">
      <span class="mf346-control-label">Paginate ordered titles</span>
      <button type="button" class="toggle ${enabled?'on':''}" role="switch" aria-checked="${enabled}" aria-label="Paginate ordered titles" data-v225-iconified="1" onclick="event.preventDefault();App.v173ToggleOrderPagination()"></button>
      <span class="mf346-pagination-state">${enabled?`${limit.toLocaleString()}/page`:'Off'}</span>
    </div>
    <label class="mf346-page-size"><span class="mf346-control-label">Ordered titles per page</span><input type="number" inputmode="numeric" min="1" max="${V175_MAX_PAGE_SIZE}" step="1" value="${limit}" onchange="App.v175SetOrderPageSize(this.value)" aria-label="Ordered titles per page"></label>
    <div class="mf346-cover-tool">${v181InlineCoverControl('order','Cover size')}</div>
  </div>`;
}

// Inject controls inside BOTH Personal Order Tabs and Collections Tabs, which
// otherwise replace/hide the legacy Personal Order toolbar.
const v346TabLayoutBase=v345TabLayoutHtml;
v345TabLayoutHtml=function(){
  let html=String(v346TabLayoutBase.apply(this,arguments));
  const collectionsContext=String(S.view||'')==='collections';
  if(collectionsContext){
    html=html.replace('<div class="mf345-tab-layout"',
      `<div class="mf345-tab-layout v177-order-cover-scope" data-v177-cover-scope="order" style="--v177-order-scale:${v181CoverScale('order')}"`);
  }
  // Existing theme/spacing remain; only purposeful icons on the main two tabs.
  html=html.replace('>Category titles</button>',`>${V346_MAIN_ICONS.categories}<span>Category titles</span></button>`)
    .replace('>Collection queues</button>',`>${V346_MAIN_ICONS.collections}<span>Collection queues</span></button>`);
  html=html.replace('<div class="mf345-main-panel" role="tabpanel">',
    `${v346QueueControlsHtml()}<div class="mf345-main-panel" role="tabpanel">`);
  return html;
};

function v346Pager(kind,cid,page,pages){
  if(pages<=1)return '';
  const action=(n)=>kind==='collections'?`App.v346SetCollectionQueuePage('${escapeHtml(cid)}',${n})`:`App.v173SetOrderPage('category',${n},'${escapeHtml(cid)}')`;
  return `<nav class="v173-order-pagination mf346-tab-pager" aria-label="${kind==='collections'?'Collection queue':'Ordered titles'} pages">
    <button type="button" class="btn btn-sm btn-ghost" onclick="${action(page-1)}" ${page<=0?'disabled':''}>Previous</button>
    <span class="v173-page-label">Page ${(page+1).toLocaleString()} / ${pages.toLocaleString()}</span>
    <button type="button" class="btn btn-sm btn-ghost" onclick="${action(page+1)}" ${page>=pages-1?'disabled':''}>Next</button>
  </nav>`;
}

// v345 correctly pages direct category title lists. Its optional mixed-queue
// branch ignored pagination; paginate mixed tokens without changing their
// canonical positions, and keep the real sequence numbers in row controls.
const v346TitlePanelBase=v345TitleQueuePanel;
v345TitleQueuePanel=function(cid){
  const plan=v287EnsureOrderExtensions();
  if(!plan.paginateOrderedTitles||!v288EnsureQueueView().showCollectionsInRegularQueues)
    return v346TitlePanelBase.apply(this,arguments);
  const cat=v138OrderCategory(cid);if(!cat)return '';
  const tokens=v287Queue(cid),size=v175OrderPageSize(),pages=Math.max(1,Math.ceil(tokens.length/size));
  const ui=v173OrderUI(),page=Math.max(0,Math.min(pages-1,Number(ui.v173CategoryPages[cid])||0));
  ui.v173CategoryPages[cid]=page;
  const body=tokens.slice(page*size,page*size+size).map((token,i)=>{
    const pos=page*size+i+1;
    if(token.startsWith('t:')){const item=v138OrderItem(token.slice(2));return item?v138OrderRowHtml(item,pos,cid):'';}
    if(token.startsWith('c:')){const a=v287Assignment(token.slice(2));return a?v288AssignmentRowHtml(a,pos,tokens.length,'regular'):'';}
    return '';
  }).join('');
  const titleCount=v138CategoryTitleIds(cid).length;
  return `<section class="card v138-category-card mf345-category-panel" aria-label="${escapeHtml(cat.name)} category order">
    <header class="v138-category-head"><div class="v138-category-head-copy"><b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b><small>Titles and assigned Collections retain their saved mixed order.</small></div><span class="v138-category-count">${titleCount.toLocaleString()} title${titleCount===1?'':'s'}</span></header>
    <div class="v138-order-list">${body||'<div class="v138-order-empty">No titles currently ordered for this category.</div>'}</div>
    ${v346Pager('titles',cid,page,pages)}
  </section>`;
};

// Collection Queues can contain thousands of direct title/collection entries.
// Give those tabs the same page-size limit when pagination is enabled, using
// independent UI-only positions (the canonical queue stays untouched).
const V346_COLLECTION_PAGES=Object.create(null);
const v346CollectionPanelBase=v345CollectionQueuePanel;
v345CollectionQueuePanel=function(cid){
  const plan=v287EnsureOrderExtensions();
  if(!plan.paginateOrderedTitles)return v346CollectionPanelBase.apply(this,arguments);
  const cat=v138OrderCategory(cid);if(!cat)return '';
  const tokens=v287Queue(cid),assignments=v287Assignments(cid),size=v175OrderPageSize();
  const pages=Math.max(1,Math.ceil(tokens.length/size));
  const page=Math.max(0,Math.min(pages-1,Number(V346_COLLECTION_PAGES[cid])||0));
  V346_COLLECTION_PAGES[cid]=page;
  const rows=tokens.slice(page*size,page*size+size).map((token,i)=>{
    const position=page*size+i+1;
    if(token.startsWith('t:')){const item=v138OrderItem(token.slice(2));return item?v288DirectQueueTitleHtml(item,position):'';}
    if(token.startsWith('c:')){const assignment=v287Assignment(token.slice(2));return assignment?v288AssignmentRowHtml(assignment,position,tokens.length,'collection'):'';}
    return '';
  }).join('');
  return `<section class="card mf287-queue-group mf288-collection-queue-group mf345-collection-panel" aria-label="${escapeHtml(cat.name)} collection queue">
    <div class="mf287-queue-head"><div><span class="section-label">COLLECTION QUEUE</span><h3>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</h3><p>Direct titles and assigned Collection blocks keep their existing queue positions. Open a Collection to inspect its ordered titles.</p></div><span class="mf287-queue-count">${tokens.length} queue item${tokens.length===1?'':'s'} · ${assignments.length} Collection${assignments.length===1?'':'s'}</span></div>
    <div class="mf287-queue-list">${rows}</div>${v346Pager('collections',cid,page,pages)}
  </section>`;
};
App.v346SetCollectionQueuePage=function(categoryId,page){
  const cid=String(categoryId||'');
  V346_COLLECTION_PAGES[cid]=Math.max(0,Math.floor(Number(page)||0));
  if(!v345RefreshTabs())render();
};

MediaFlowRuntime.version=V346_RELEASE;
window.MediaFlowV346={version:346,features:['Purposeful queue tab icons','No duplicate category tab icons','Tabbed queue pagination controls','Tabbed ordered title cover sizing','Mixed and Collection queue pagination']};
