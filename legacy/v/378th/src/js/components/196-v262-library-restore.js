/* ============================================================
   MediaFlow v262 — Library restoration from the cancelled v260 concept
   ------------------------------------------------------------
   v262 deliberately touches only the Library presentation. The v261
   runtime/data fixes (including reliable cover detection) remain active,
   while the Library layout is restored to the cancelled v260 design that
   Alex preferred: collapsible tools above an always-visible Category/Status
   dock directly above title content.
   ============================================================ */
(function(){
'use strict';
const V262_RUNTIME_VERSION=262;
const V262_LIBRARY_TOOLS_KEY='mediaflow:v262:library-tools-collapsed';
const V262_STATUS_ORDER=['all','planned','active','paused','completed','dropped'];
const V262_TOOL_ICON=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/></svg>`;

function v262ReadLocalBool(key,fallback=false){
  try{const raw=localStorage.getItem(key);return raw===null?!!fallback:(raw==='1'||raw==='true');}catch(_){return !!fallback;}
}
function v262WriteLocalBool(key,value){try{localStorage.setItem(key,value?'1':'0');}catch(_){}}
function v262LibraryToolsCollapsed(){return v262ReadLocalBool(V262_LIBRARY_TOOLS_KEY,false);}
function v262SetLibraryToolsCollapsed(value){v262WriteLocalBool(V262_LIBRARY_TOOLS_KEY,!!value);v262ApplyLibraryToolsState(!!value);}
function v262ToggleLibraryTools(){v262SetLibraryToolsCollapsed(!v262LibraryToolsCollapsed());}
function v262ApplyLibraryToolsState(collapsed=v262LibraryToolsCollapsed()){
  const root=document.getElementById('view-root');if(!root)return;
  root.classList.toggle('mf262-tools-collapsed',collapsed);
  root.querySelectorAll('.mf262-library-tools-toggle').forEach(btn=>{
    btn.setAttribute('aria-expanded',collapsed?'false':'true');
    btn.innerHTML=collapsed?'Show tools':'Hide tools';
    btn.title=collapsed?'Show Library tools':'Hide Library tools';
  });
}

function v262StatusLabel(status){
  if(status==='all')return 'All';
  try{return v199StatusLabel(status);}catch(_){return ({planned:'Plan to Watch',active:'Watching',paused:'On Hold',completed:'Completed',dropped:'Dropped'})[status]||status;}
}
function v262CategoryFilterCategories(){
  try{if(typeof v236EffectiveCategoryFilterCategories==='function')return v236EffectiveCategoryFilterCategories().filter(Boolean);}catch(_){ }
  return (S.categories||[]).filter(Boolean);
}
function v262SelectedCategoryIds(){const raw=S.histFilters?.libCategories;return Array.isArray(raw)?raw.map(String):[];}
function v262FilteredStatusCounts(){
  const selected=new Set(v262SelectedCategoryIds());
  const counts=new Map(V262_STATUS_ORDER.map(x=>[x,0]));
  for(const item of (S.library||[])){
    if(!item)continue;
    if(selected.size&&!selected.has(String(item.categoryId||'')))continue;
    const st=String(item.status||'planned');
    counts.set('all',(counts.get('all')||0)+1);counts.set(st,(counts.get(st)||0)+1);
  }
  return counts;
}
function v262CategoryCounts(){
  const map=new Map();for(const item of (S.library||[])){const id=String(item?.categoryId||'');if(id)map.set(id,(map.get(id)||0)+1);}return map;
}
function v262SetClassicStatus(status){
  const next=String(status||'all');
  if(App?.setLibFilter)return App.setLibFilter('libStatus',next);
  S.histFilters=S.histFilters||{};S.histFilters.libStatus=next;S.libPage=0;try{v53InvalidateLibraryCache();}catch(_){ }render();
}
function v262ToggleClassicCategory(id){
  const sid=String(id||''),selected=new Set(v262SelectedCategoryIds()),on=!selected.has(sid);
  if(typeof v236ToggleLibraryCategory==='function')return v236ToggleLibraryCategory(sid,on);
  if(App?.v69ToggleLibraryCategory)return App.v69ToggleLibraryCategory(sid,on);
}
function v262ClearClassicCategories(){
  if(typeof v236ClearLibraryCategories==='function')return v236ClearLibraryCategories();
  if(App?.v69ClearLibraryCategories)return App.v69ClearLibraryCategories();
}
function v262ClassicFilterDockHtml(){
  const selected=new Set(v262SelectedCategoryIds()),catCounts=v262CategoryCounts(),statusCounts=v262FilteredStatusCounts();
  const currentStatus=String(S.histFilters?.libStatus||'all'),cats=v262CategoryFilterCategories();
  const statuses=V262_STATUS_ORDER.map(status=>{
    const active=currentStatus===status,count=statusCounts.get(status)||0;
    return `<button type="button" class="btn btn-sm mf262-filter-chip ${active?'active':''}" aria-pressed="${active?'true':'false'}" onclick="App.v262SetClassicStatus('${escapeHtml(status)}')">${escapeHtml(v262StatusLabel(status))}<span class="v181-dynamic-count">${count.toLocaleString()}</span></button>`;
  }).join('');
  const catButtons=[
    `<button type="button" class="btn btn-sm mf262-filter-chip ${selected.size?'':'active'}" aria-pressed="${selected.size?'false':'true'}" onclick="App.v262ClearClassicCategories()">All<span class="v181-dynamic-count">${(S.library||[]).length.toLocaleString()}</span></button>`,
    ...cats.map(cat=>{
      const id=String(cat.id||''),active=selected.has(id),icon=typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(cat):escapeHtml(cat.icon||'');
      return `<button type="button" class="btn btn-sm mf262-filter-chip ${active?'active':''}" aria-pressed="${active?'true':'false'}" onclick="App.v262ToggleClassicCategory('${escapeHtml(id)}')">${icon}<span>${escapeHtml(cat.name||'Category')}</span><span class="v181-dynamic-count">${(catCounts.get(id)||0).toLocaleString()}</span></button>`;
    })
  ].join('');
  return `<div class="mf262-library-filter-dock" aria-label="Library category and status filters">
    <div class="mf262-filter-row mf262-status-row"><span class="mf262-filter-label">Status</span>${statuses}</div>
    <div class="mf262-filter-row mf262-category-row"><span class="mf262-filter-label">Category</span>${catButtons}</div>
  </div>`;
}

/* v261 wrapped renderLibrary with its own Library-only layout. Keep every v261
   behavior fix, but strip that wrapper so the cancelled-v260 layout can own
   presentation again without reverting any newer data/runtime code. */
const v262RenderLibraryV261=renderLibrary;
renderLibrary=function(){
  const raw=String(v262RenderLibraryV261.apply(this,arguments)||'');
  try{
    const tpl=document.createElement('template');tpl.innerHTML=raw.trim();
    const wrapper=tpl.content.querySelector('.v261-library-page');
    if(wrapper){
      wrapper.querySelectorAll(':scope > .v261-library-sticky').forEach(n=>n.remove());
      return wrapper.innerHTML;
    }
  }catch(_){ }
  return raw;
};

function v262FindLibraryScope(root){return root.querySelector('.v177-library-cover-scope,.v188-library-title-scope')||root.querySelector('.fade-in')||root;}
function v262WrapLibraryTools(root,dynamic){
  if(root.querySelector('.mf262-library-tools'))return root.querySelector('.mf262-library-tools');
  const scope=v262FindLibraryScope(root);if(!scope)return null;
  const nodes=[];
  const selectors=['.v181-library-mode-switch','.mf-batchbar','.v181-display-switch','.v254-cover-overlay-controls',dynamic?'.v181-dynamic-toolbar':'.lib-toolbar'];
  for(const selector of selectors){const node=scope.querySelector(selector);if(node&&!nodes.includes(node))nodes.push(node);}
  if(!nodes.length)return null;
  const anchor=dynamic?scope.querySelector('.v181-dynamic-nav'):nodes[0];
  const wrap=document.createElement('section');wrap.className='mf262-library-tools';wrap.setAttribute('aria-label','Library tools');
  wrap.innerHTML=`<div class="mf262-library-tools-head"><div class="mf262-library-tools-title">${V262_TOOL_ICON}<span>Library tools</span></div><span class="spacer"></span><button type="button" class="btn btn-sm btn-ghost mf262-library-tools-toggle" onclick="App.v262ToggleLibraryTools()"></button></div><div class="mf262-library-tools-body"></div>`;
  if(anchor?.parentNode)anchor.parentNode.insertBefore(wrap,anchor);else scope.prepend(wrap);
  const body=wrap.querySelector('.mf262-library-tools-body');
  for(const node of nodes){if(node===wrap||wrap.contains(node))continue;body.appendChild(node);}
  return wrap;
}
function v262BindHorizontalDrag(row){
  if(!row||row.dataset.mf262DragBound)return;row.dataset.mf262DragBound='1';
  let down=false,dragging=false,startX=0,startY=0,startScroll=0,pointerId=null,suppressClick=false;
  const threshold=7;
  row.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    // Touch already gets smooth native horizontal scrolling from overflow-x +
    // touch-action. Do not capture it; capturing a tap was the v262 regression
    // that prevented Status/Category buttons from activating on mobile.
    if(e.pointerType==='touch')return;
    down=true;dragging=false;suppressClick=false;pointerId=e.pointerId;
    startX=e.clientX;startY=e.clientY;startScroll=row.scrollLeft;
  });
  row.addEventListener('pointermove',e=>{
    if(!down||e.pointerId!==pointerId)return;
    const dx=e.clientX-startX,dy=e.clientY-startY;
    if(!dragging){
      if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>threshold)return;
      if(Math.abs(dx)<=threshold)return;
      dragging=true;suppressClick=true;
      try{row.setPointerCapture(e.pointerId);}catch(_){}
    }
    row.scrollLeft=startScroll-dx;
    if(e.cancelable)e.preventDefault();
  },{passive:false});
  const end=e=>{
    if(pointerId!==null&&e?.pointerId!=null&&e.pointerId!==pointerId)return;
    if(dragging&&pointerId!==null){try{row.releasePointerCapture(pointerId);}catch(_){} }
    down=false;dragging=false;pointerId=null;
  };
  row.addEventListener('pointerup',end);row.addEventListener('pointercancel',end);row.addEventListener('lostpointercapture',end);
  row.addEventListener('click',e=>{
    if(!suppressClick)return;
    e.preventDefault();e.stopPropagation();suppressClick=false;
  },true);
}
function v262EnhanceClassicLibrary(root){
  const toolbar=root.querySelector('.lib-toolbar');if(!toolbar)return;
  v262WrapLibraryTools(root,false);
  const sourceCategory=root.querySelector('[data-v236-library-category-filter],.v66-cat-filter');if(sourceCategory)sourceCategory.classList.add('mf262-source-filter');
  const sourceStatus=[...root.querySelectorAll('select')].find(el=>(el.getAttribute('onchange')||'').includes('libStatus'));if(sourceStatus)sourceStatus.classList.add('mf262-source-filter');
  if(!root.querySelector('.mf262-library-filter-dock')){
    const tools=root.querySelector('.mf262-library-tools'),holder=document.createElement('div');holder.innerHTML=v262ClassicFilterDockHtml();const dock=holder.firstElementChild;
    if(tools?.parentNode)tools.insertAdjacentElement('afterend',dock);else toolbar.insertAdjacentElement('afterend',dock);
  }
}
function v262EnhanceDynamicLibrary(root){
  const nav=root.querySelector('.v181-dynamic-nav');if(!nav)return;
  v262WrapLibraryTools(root,true);nav.setAttribute('aria-label','Library category and status navigation');
  const rows=nav.querySelectorAll('.v181-dynamic-row');rows[0]?.classList.add('mf262-category-row');rows[1]?.classList.add('mf262-status-row');
  rows.forEach(row=>row.querySelectorAll(':scope>.btn').forEach(btn=>btn.setAttribute('aria-pressed',btn.classList.contains('active')?'true':'false')));
}
function v262EnhanceLibrary(){
  if(String(S.view||'')!=='library')return;
  const root=document.getElementById('view-root');if(!root)return;
  document.documentElement.setAttribute('data-mf262-library','1');root.setAttribute('data-mf262-view','library');
  root.classList.remove('mf260-library-dynamic','mf260-library-classic');
  const dynamic=!!root.querySelector('.v181-dynamic-nav');root.classList.toggle('mf262-library-dynamic',dynamic);root.classList.toggle('mf262-library-classic',!dynamic);
  if(dynamic)v262EnhanceDynamicLibrary(root);else v262EnhanceClassicLibrary(root);
  root.querySelectorAll('.mf262-filter-row,.v181-dynamic-row').forEach(v262BindHorizontalDrag);
  v262ApplyLibraryToolsState();
}
function v262UpdateVersionChrome(){
  document.querySelectorAll('.v260-topbar-chip').forEach(chip=>{if(/^v\d+$/i.test((chip.textContent||'').trim()))chip.textContent='v262';});
  document.querySelectorAll('.v260-topbar-copy span').forEach(span=>{if(/MediaFlow v261/i.test(span.textContent||''))span.textContent=(span.textContent||'').replace(/MediaFlow v261/ig,'MediaFlow v262');});
}
function v262ScheduleEnhance(){
  if(v262ScheduleEnhance.queued)return;v262ScheduleEnhance.queued=true;
  requestAnimationFrame(()=>{v262ScheduleEnhance.queued=false;try{v262EnhanceLibrary();v262UpdateVersionChrome();}catch(err){console.error('MediaFlow v262 Library enhancement failed',err);}});
}
v262ScheduleEnhance.queued=false;

const v262RenderBase=render;
render=function(){const out=v262RenderBase.apply(this,arguments);queueMicrotask(v262ScheduleEnhance);return out;};
try{MediaFlowRuntime.registerPageEnhancer('library',v262ScheduleEnhance);}catch(_){ }

Object.assign(App,{v262ToggleLibraryTools,v262SetLibraryToolsCollapsed,v262SetClassicStatus,v262ToggleClassicCategory,v262ClearClassicCategories,v262EnhanceLibrary});
window.MediaFlowV262={version:262,focus:'Library restoration using the cancelled v260 Library design',enhance:v262ScheduleEnhance,toggleLibraryTools:v262ToggleLibraryTools};
MediaFlowRuntime.version=V262_RUNTIME_VERSION;
v262ScheduleEnhance();
})();
