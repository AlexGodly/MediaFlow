/* ============================================================
   MediaFlow v156 — Fast Order / Large-Library Performance Engine
   ------------------------------------------------------------
   Audit of v155 Order found several expensive paths that Library had already
   solved years earlier:

   1) v141 invalidated the Library-picker candidate cache every time Order
      rendered, so merely switching away and back forced another full Library
      filter + sort.
   2) v138EnsureOrderPlan() normalized against the entire Library/categories
      repeatedly during one render.
   3) Ordered title/category lookups used Array.find(), turning large Orders into
      repeated O(Library) scans.
   4) Each Order row repeatedly called indexOf()/category filters, producing
      quadratic work as the Order grew.
   5) The default "Best match" picker sorted the entire Library alphabetically
      even when there was no search query.
   6) Order search recomputed the whole candidate set on every keystroke.

   v156 keeps the same Order data/UX but adds the same style of indexing,
   caching and debouncing used by the optimized Library tab.
   ============================================================ */

const V156_ORDER={
  plan:{
    planRef:null,
    libraryRef:null,
    libraryLen:-1,
    libraryToken:-1,
    categoriesRef:null,
    categoriesLen:-1
  },
  index:{
    libraryRef:null,
    libraryLen:-1,
    libraryToken:-1,
    categoriesRef:null,
    categoriesLen:-1,
    libraryById:new Map(),
    categoryById:new Map()
  },
  structure:{
    planRef:null,
    modifiedAt:-1,
    titleLen:-1,
    orderedItems:[],
    globalIndex:new Map(),
    byCategory:new Map(),
    categoryIndex:new Map(),
    membershipSignature:'0:0:0'
  }
};

let V156_ORDER_SEARCH_TIMER=null;

function v156CurrentLibraryToken(){
  try{return Number(V53_LIB?.libraryToken)||0;}
  catch(_){return 0;}
}

function v156EnsureOrderUI(){
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};
  ui.search=String(ui.search||'');
  if(!(ui.picks instanceof Set))ui.picks=new Set(Array.isArray(ui.picks)?ui.picks.map(String):[]);
  ui.page=Math.max(0,Number(ui.page)||0);
  ui.pageSize=v175PageSize('orderLibrary');
  ui.categories=Array.isArray(ui.categories)?[...new Set(ui.categories.map(String).filter(Boolean))]:[];
  ui.status=['all','planned','active','paused','completed','dropped'].includes(String(ui.status||'all').toLowerCase())
    ?String(ui.status||'all').toLowerCase():'all';
  ui.priority=['all','high','medium','low'].includes(String(ui.priority||'all').toLowerCase())
    ?String(ui.priority||'all').toLowerCase():'all';

  const sorts=new Set([
    'relevance','priority-desc','priority-asc','title-asc','title-desc',
    'rating-desc','rating-asc','progress-desc','progress-asc','total-desc','total-asc'
  ]);
  ui.sort=sorts.has(String(ui.sort||'relevance'))?String(ui.sort):'relevance';

  const validCats=new Set((S.categories||[]).filter(c=>c?.id).map(c=>String(c.id)));
  ui.categories=ui.categories.filter(id=>validCats.has(id));
  return ui;
}

function v156NeedsOrderNormalize(){
  const c=V156_ORDER.plan;
  const token=v156CurrentLibraryToken();
  return (
    !S.orderPlan ||
    c.planRef!==S.orderPlan ||
    c.libraryRef!==S.library ||
    c.libraryLen!==(S.library||[]).length ||
    c.libraryToken!==token ||
    c.categoriesRef!==S.categories ||
    c.categoriesLen!==(S.categories||[]).length
  );
}

// FINAL lightweight ensure. Full normalization only happens after actual
// Library/category/state replacement, not dozens of times per Order render.
v138EnsureOrderPlan=function(){
  if(v156NeedsOrderNormalize()){
    S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
    V156_ORDER.plan={
      planRef:S.orderPlan,
      libraryRef:S.library,
      libraryLen:(S.library||[]).length,
      libraryToken:v156CurrentLibraryToken(),
      categoriesRef:S.categories,
      categoriesLen:(S.categories||[]).length
    };
    V156_ORDER.structure.planRef=null;
  }
  v156EnsureOrderUI();
  return S.orderPlan;
};

function v156EnsureOrderIndexes(){
  const idx=V156_ORDER.index;
  const token=v156CurrentLibraryToken();
  const needsLibrary=(
    idx.libraryRef!==S.library ||
    idx.libraryLen!==(S.library||[]).length ||idx.libraryToken!==token
  );
  const needsCategories=(
    idx.categoriesRef!==S.categories ||
    idx.categoriesLen!==(S.categories||[]).length
  );

  if(needsLibrary){
    const map=new Map();
    for(const item of (S.library||[])){
      if(item?.id)map.set(String(item.id),item);
    }
    idx.libraryById=map;
    idx.libraryRef=S.library;
    idx.libraryLen=(S.library||[]).length;
    idx.libraryToken=token;
    V156_ORDER.structure.planRef=null;
  }

  if(needsCategories){
    const map=new Map();
    for(const cat of (S.categories||[])){
      if(cat?.id)map.set(String(cat.id),cat);
    }
    idx.categoryById=map;
    idx.categoriesRef=S.categories;
    idx.categoriesLen=(S.categories||[]).length;
    V156_ORDER.structure.planRef=null;
  }

  return idx;
}

function v156HashId(id){
  const s=String(id||'');
  let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  return h>>>0;
}

function v156EnsureOrderStructure(){
  const p=v138EnsureOrderPlan();
  const idx=v156EnsureOrderIndexes();
  const cache=V156_ORDER.structure;

  if(
    cache.planRef===p &&
    cache.modifiedAt===(Number(p.modifiedAt)||0) &&
    cache.titleLen===p.titleIds.length
  ){
    return cache;
  }

  const orderedItems=[];
  const globalIndex=new Map();
  const byCategory=new Map();
  const categoryIndex=new Map();

  // Commutative membership signature: reordering titles does not invalidate
  // the picker candidate set because membership itself has not changed.
  let xor=0,sum=0;

  for(let i=0;i<p.titleIds.length;i++){
    const id=String(p.titleIds[i]||'');
    if(!id)continue;

    const hash=v156HashId(id);
    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;

    const item=idx.libraryById.get(id);
    if(!item)continue;

    globalIndex.set(id,i);
    orderedItems.push(item);

    const catId=String(item.categoryId||'');
    let ids=byCategory.get(catId);
    if(!ids){
      ids=[];
      byCategory.set(catId,ids);
    }
    categoryIndex.set(`${catId}\u0000${id}`,ids.length);
    ids.push(id);
  }

  cache.planRef=p;
  cache.modifiedAt=Number(p.modifiedAt)||0;
  cache.titleLen=p.titleIds.length;
  cache.orderedItems=orderedItems;
  cache.globalIndex=globalIndex;
  cache.byCategory=byCategory;
  cache.categoryIndex=categoryIndex;
  cache.membershipSignature=`${p.titleIds.length}:${xor}:${sum}`;
  return cache;
}

// O(1) replacements for the old Array.find() helpers.
v138OrderItem=function(id){
  return v156EnsureOrderIndexes().libraryById.get(String(id))||null;
};
v138OrderCategory=function(id){
  return v156EnsureOrderIndexes().categoryById.get(String(id))||null;
};
v138OrderedItems=function(){
  return v156EnsureOrderStructure().orderedItems;
};
v138CategoryTitleIds=function(catId){
  return v156EnsureOrderStructure().byCategory.get(String(catId))||[];
};

// O(1) row position/can-move lookups instead of repeated titleIds.indexOf()
// and category-wide filters for every rendered row.
v138OrderRowHtml=function(item,position,scopeCatId=''){
  const cat=v138OrderCategory(item.categoryId);
  const st=v156EnsureOrderStructure();
  const id=String(item.id);
  const catId=String(scopeCatId||'');

  const globalIndex=st.globalIndex.get(id);
  let scopedIndex,scopedLength;
  if(catId){
    const ids=st.byCategory.get(catId)||[];
    scopedIndex=st.categoryIndex.get(`${catId}\u0000${id}`);
    scopedLength=ids.length;
  }else{
    scopedIndex=globalIndex;
    scopedLength=v138EnsureOrderPlan().titleIds.length;
  }

  const canUp=Number.isInteger(scopedIndex)&&scopedIndex>0;
  const canDown=Number.isInteger(scopedIndex)&&scopedIndex>=0&&scopedIndex<scopedLength-1;
  const status=v199StatusLabel(item.status);
  const moveFn=catId?'v138MoveTitleInCategory':'v138MoveTitle';
  const moveArgs=catId?`'${id}','${catId}'`:`'${id}'`;

  return `<div class="v138-order-row" draggable="true"
      ondragstart="App.v138OrderDragStart(event,'${id}','${catId}')"
      ondragend="App.v138OrderDragEnd(event)"
      ondragover="App.v138OrderDragOver(event)"
      ondrop="App.v138OrderDrop(event,'${id}','${catId}')">
    <div class="v138-order-pos" title="Order position">${position}</div>
    <div>${v138OrderCover(item,cat)}</div>
    <div class="v138-order-copy">
      <span class="v138-order-title">${escapeHtml(cleanTitle(item.title))}</span>
      <div class="v138-order-meta">
        <span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Unknown')}</span>
        <span>·</span>
        <span>${escapeHtml(v199StatusLabel(status))}</span>
        <span>·</span>
        <span>${escapeHtml(v138ProgressText(item))}</span>
      </div>
    </div>
    <div class="v138-order-actions">
      <span class="v138-drag-handle" title="Drag to reorder">☰</span>
      <button class="btn btn-sm btn-ghost" type="button" ${canUp?'':'disabled'} onclick="App.${moveFn}(${moveArgs},-1)" title="Move up">↑</button>
      <button class="btn btn-sm btn-ghost" type="button" ${canDown?'':'disabled'} onclick="App.${moveFn}(${moveArgs},1)" title="Move down">↓</button>
      <button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${id}')" title="Remove from Order only">Remove</button>
    </div>
  </div>`;
};

// Avoid rebuilding category counts by filtering the entire Order once per category.
v138CategoryManagerHtml=function(){
  const p=v138EnsureOrderPlan();
  const st=v156EnsureOrderStructure();
  const hidden=new Set(p.hiddenCategories.map(String));
  const custom=p.categoryMode==='custom';
  const order=v138CategoryDisplayOrder();

  const rows=order.map((id,index)=>{
    const c=v138OrderCategory(id);
    if(!c)return '';
    const count=(st.byCategory.get(String(id))||[]).length;
    const isHidden=hidden.has(String(id));

    return `<div class="v138-category-control ${isHidden?'hidden-cat':''}" ${custom?'draggable="true"':''}
      ${custom?`ondragstart="App.v138CategoryDragStart(event,'${String(id)}')" ondragend="App.v138CategoryDragEnd(event)" ondragover="App.v138OrderDragOver(event)" ondrop="App.v138CategoryDrop(event,'${String(id)}')"`:''}>
      <span class="v138-drag-handle">${custom?'☰':'•'}</span>
      <span class="v138-category-control-name">${v144CategoryIconHtml(c)} ${escapeHtml(c.name)} <small style="color:var(--text-mute)">(${count})</small></span>
      <div class="v138-order-actions">
        <button class="btn btn-sm btn-ghost v138-eye-btn" type="button" onclick="App.v138ToggleOrderCategory('${String(id)}')" title="${isHidden?'Show category':'Hide category'}">${isHidden?'Show':'Hide'}</button>
        ${custom?`<button class="btn btn-sm btn-ghost" type="button" ${index===0?'disabled':''} onclick="App.v138MoveCategory('${String(id)}',-1)">↑</button><button class="btn btn-sm btn-ghost" type="button" ${index===order.length-1?'disabled':''} onclick="App.v138MoveCategory('${String(id)}',1)">↓</button>`:''}
      </div>
    </div>`;
  }).join('');

  return `<div class="card">
    <div class="section-label">CATEGORY DISPLAY</div>
    <div class="hint">Category order only changes the grouped view. Hidden categories stay in your saved Order and remain visible in All Titles.</div>
    <div class="v138-cat-mode-row">
      <button type="button" class="btn btn-sm ${!custom?'btn-primary':''}" onclick="App.v138SetCategoryMode('default')">Use Settings order</button>
      <button type="button" class="btn btn-sm ${custom?'btn-primary':''}" onclick="App.v138SetCategoryMode('custom')">Custom order</button>
    </div>
    <div class="v138-category-manager">${rows}</div>
  </div>`;
};

// The old v141 render wrapper called this on EVERY Order render. v156 makes
// candidate validity key-driven instead, so tab switching does not throw away
// a perfectly valid 20k/30k-title candidate cache.
v141InvalidateOrderPickerCache=function(){};

// Stable membership key + Library performance token.
// Page/checkboxes remain intentionally excluded.
v141OrderPickerCacheKey=function(){
  const ui=v140EnsureOrderPickerUI();
  const st=v156EnsureOrderStructure();

  return JSON.stringify([
    String(ui.search||'').trim().toLocaleLowerCase(),
    [...(ui.categories||[])].map(String).sort(),
    String(ui.status||'all'),
    String(ui.priority||'all'),
    String(ui.sort||'relevance'),
    st.membershipSignature,
    v156CurrentLibraryToken(),
    (S.library||[]).length,
    (S.categories||[]).length
  ]);
};

// Fast one-pass picker filtering, using the same prebuilt search index as the
// optimized Library tab. Default no-query "Best match" preserves Library order
// and deliberately does NOT sort tens of thousands of titles just to open Order.
v138PickerMatches=function(){
  const key=v141OrderPickerCacheKey();
  if(V141_ORDER_PICKER_CACHE.key===key&&Array.isArray(V141_ORDER_PICKER_CACHE.candidates)){
    return V141_ORDER_PICKER_CACHE.candidates;
  }

  const p=v138EnsureOrderPlan();
  const ui=v140EnsureOrderPickerUI();
  const existing=new Set(p.titleIds.map(String));
  const selectedCats=ui.categories.length?new Set(ui.categories.map(String)):null;
  const q=String(ui.search||'').trim().toLocaleLowerCase();
  const catMap=v156EnsureOrderIndexes().categoryById;

  // Reuse MediaFlow's optimized Library title/search index.
  v53EnsureLibraryIndex();

  const rows=[];
  for(const row of V53_LIB.searchIndex){
    const item=row.item;
    const id=String(item?.id||'');
    if(!id||existing.has(id))continue;

    const catId=String(item.categoryId||'');
    if(selectedCats&&!selectedCats.has(catId))continue;
    if(ui.status!=='all'&&String(item.status||'planned').toLowerCase()!==ui.status)continue;
    if(ui.priority!=='all'&&String(item.priority||'medium').toLowerCase()!==ui.priority)continue;

    if(q){
      const cat=catMap.get(catId);
      const titleSearch=String(row.search||'');
      const searchable=`${titleSearch} ${(cat?.name||'').toLocaleLowerCase()} ${String(item.status||'').toLowerCase()} ${String(item.priority||'').toLowerCase()}`;
      if(!searchable.includes(q))continue;
    }

    rows.push(row);
  }

  // With no query and Best match, Library order is already useful and avoids
  // an unnecessary O(n log n) sort on first Order load.
  if(!(ui.sort==='relevance'&&!q)){
    const rank={low:0,medium:1,high:2};
    const num=v=>Number.isFinite(Number(v))?Number(v):0;
    const cmpTitle=(a,b)=>String(a.title||'').localeCompare(String(b.title||''),undefined,{numeric:true,sensitivity:'base'});

    rows.sort((a,b)=>{
      let d=0;
      const ai=a.item,bi=b.item;

      if(ui.sort==='title-asc')return cmpTitle(a,b);
      if(ui.sort==='title-desc')return cmpTitle(b,a);
      if(ui.sort==='priority-desc')d=(rank[String(bi.priority||'medium').toLowerCase()]??1)-(rank[String(ai.priority||'medium').toLowerCase()]??1);
      else if(ui.sort==='priority-asc')d=(rank[String(ai.priority||'medium').toLowerCase()]??1)-(rank[String(bi.priority||'medium').toLowerCase()]??1);
      else if(ui.sort==='rating-desc')d=num(bi.rating)-num(ai.rating);
      else if(ui.sort==='rating-asc')d=num(ai.rating)-num(bi.rating);
      else if(ui.sort==='progress-desc')d=num(bi.progress)-num(ai.progress);
      else if(ui.sort==='progress-asc')d=num(ai.progress)-num(bi.progress);
      else if(ui.sort==='total-desc')d=num(bi.total)-num(ai.total);
      else if(ui.sort==='total-asc')d=num(ai.total)-num(bi.total);
      else if(q){
        const at=String(a.search||'');
        const bt=String(b.search||'');
        const ar=at===q?0:at.startsWith(q)?1:at.includes(q)?2:3;
        const br=bt===q?0:bt.startsWith(q)?1:bt.includes(q)?2:3;
        const ax=at.includes(q)?at.indexOf(q):Number.MAX_SAFE_INTEGER;
        const bx=bt.includes(q)?bt.indexOf(q):Number.MAX_SAFE_INTEGER;
        d=ar-br||ax-bx;
      }
      return d||cmpTitle(a,b);
    });
  }

  const candidates=rows.map(x=>x.item);
  V141_ORDER_PICKER_CACHE={key,candidates};
  return candidates;
};

// Search now behaves like the optimized Library search: wait briefly while the
// user is typing instead of scanning a giant Library on each single keystroke.
v138OrderSearch=function(value){
  const ui=v140EnsureOrderPickerUI();
  ui.search=String(value||'');
  ui.page=0;

  clearTimeout(V156_ORDER_SEARCH_TIMER);
  V156_ORDER_SEARCH_TIMER=setTimeout(()=>{
    if(S.view!=='order')return;
    v141RefreshOrderPickerAll();
  },160);
};

// Filter changes are immediate. The cache key itself changes, so explicit cache
// destruction is no longer required.
v140OrderSetFilter=function(key,value){
  const ui=v140EnsureOrderPickerUI();
  if(!['sort','status','priority'].includes(String(key)))return;
  ui[key]=String(value||'all').toLowerCase();
  ui.page=0;
  v141RefreshOrderPickerAll();
};

v140OrderToggleCategory=function(id,on){
  const ui=v140EnsureOrderPickerUI();
  const set=new Set(ui.categories||[]);
  const sid=String(id||'');
  if(on)set.add(sid);else set.delete(sid);
  ui.categories=[...set];
  ui.page=0;
  v141RefreshOrderPickerAll();
};

v140OrderClearCategories=function(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.page=0;
  v141RefreshOrderPickerAll();
};

v140OrderClearFilters=function(){
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.status='all';
  ui.priority='all';
  ui.sort='relevance';
  ui.page=0;
  v141RefreshOrderPickerAll();
};

// Keep Order indexes aligned with the same invalidation signal used by Library.
const v156InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){
  V156_ORDER.plan.libraryRef=null;
  V156_ORDER.index.libraryRef=null;
  V156_ORDER.structure.planRef=null;
  return v156InvalidateLibraryCacheBase.apply(this,arguments);
};

// State/import/restore replacements should force one normalization/index rebuild.
const v156ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v156ApplyStateBase.apply(this,arguments);
  V156_ORDER.plan.planRef=null;
  V156_ORDER.plan.libraryRef=null;
  V156_ORDER.plan.categoriesRef=null;
  V156_ORDER.index.libraryRef=null;
  V156_ORDER.index.categoriesRef=null;
  V156_ORDER.structure.planRef=null;
  V141_ORDER_PICKER_CACHE={key:'',candidates:null};
  return result;
};

// Rebind inline handlers to the final v156 optimized functions.
Object.assign(App,{
  v138OrderSearch,
  v140OrderSetFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v140OrderClearFilters
});

// v156 adds no persistent user data. Order Plan continues to use the existing
// cloud/full-backup/automatic-backup/import paths unchanged.



