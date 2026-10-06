/* ============================================================
   MediaFlow v260 — Professional UI/UX + React Migration Bridge
   ------------------------------------------------------------
   Production v260 remains compatibility-first: the proven MediaFlow state,
   cloud, backup, scheduler and render engine stay authoritative while this
   module owns the new presentation contract. A React + TypeScript + Tailwind
   source workspace lives in ui-v260/ and consumes the same DOM/data bridge.

   This module intentionally adds no persistent MediaFlow schema fields.
   The Library tools collapsed state is a device-local UI preference only.
   ============================================================ */
const V260_RUNTIME_VERSION=260;
const V260_LIBRARY_TOOLS_KEY='mediaflow:v260:library-tools-collapsed';
const V260_STATUS_ORDER=['all','planned','active','paused','completed','dropped'];
const V260_TOOL_ICON=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/></svg>`;

function v260ReadLocalBool(key,fallback=false){
  try{
    const raw=localStorage.getItem(key);
    if(raw===null)return !!fallback;
    return raw==='1'||raw==='true';
  }catch(_){return !!fallback;}
}
function v260WriteLocalBool(key,value){
  try{localStorage.setItem(key,value?'1':'0');}catch(_){ }
}
function v260LibraryToolsCollapsed(){return v260ReadLocalBool(V260_LIBRARY_TOOLS_KEY,false);}
function v260SetLibraryToolsCollapsed(value){
  const collapsed=!!value;
  v260WriteLocalBool(V260_LIBRARY_TOOLS_KEY,collapsed);
  v260ApplyLibraryToolsState(collapsed);
}
function v260ToggleLibraryTools(){v260SetLibraryToolsCollapsed(!v260LibraryToolsCollapsed());}
function v260ApplyLibraryToolsState(collapsed=v260LibraryToolsCollapsed()){
  const root=document.getElementById('view-root');
  if(!root)return;
  root.classList.toggle('mf260-tools-collapsed',collapsed);
  root.querySelectorAll('.mf260-library-tools-toggle').forEach(btn=>{
    btn.setAttribute('aria-expanded',collapsed?'false':'true');
    btn.innerHTML=`${collapsed?'Show':'Hide'} tools`;
    btn.title=collapsed?'Show Library tools':'Hide Library tools';
  });
}

function v260EnhanceShell(){
  const html=document.documentElement;
  html.setAttribute('data-mf260','1');
  document.body?.classList.add('mf260-app');

  const app=document.getElementById('app');
  if(!app)return;
  app.setAttribute('data-mf260-shell','1');

  const sidebar=app.querySelector('.sidebar');
  if(sidebar){
    sidebar.setAttribute('aria-label','MediaFlow navigation');
    sidebar.querySelector('.nav')?.setAttribute('role','navigation');
  }

  const main=app.querySelector('.main');
  if(main){
    main.setAttribute('role','main');
    if(!main.id)main.id='mediaflow-main';
  }

  app.querySelectorAll('.nav-item').forEach(item=>{
    item.setAttribute('role','button');
    if(!item.hasAttribute('tabindex'))item.setAttribute('tabindex','0');
    const label=(item.textContent||'').trim().replace(/\s+/g,' ');
    if(label&&!item.getAttribute('aria-label'))item.setAttribute('aria-label',label);
  });

  if(!document.getElementById('mf260-skip-link')){
    const skip=document.createElement('a');
    skip.id='mf260-skip-link';
    skip.href='#mediaflow-main';
    skip.textContent='Skip to MediaFlow content';
    skip.style.cssText='position:fixed;left:12px;top:10px;z-index:10000;transform:translateY(-160%);padding:8px 11px;border-radius:8px;background:var(--panel-raised);color:var(--text);border:1px solid var(--flow);font:700 12px var(--font-body);transition:transform .15s';
    skip.addEventListener('focus',()=>{skip.style.transform='translateY(0)';});
    skip.addEventListener('blur',()=>{skip.style.transform='translateY(-160%)';});
    document.body.prepend(skip);
  }
}

function v260StatusLabel(status){
  if(status==='all')return 'All';
  try{return v199StatusLabel(status);}catch(_){
    return ({planned:'Plan to Watch',active:'Watching',paused:'On Hold',completed:'Completed',dropped:'Dropped'})[status]||status;
  }
}
function v260CategoryFilterCategories(){
  try{
    if(typeof v236EffectiveCategoryFilterCategories==='function')return v236EffectiveCategoryFilterCategories().filter(Boolean);
  }catch(_){ }
  return (S.categories||[]).filter(Boolean);
}
function v260SelectedCategoryIds(){
  const raw=S.histFilters?.libCategories;
  return Array.isArray(raw)?raw.map(String):[];
}
function v260FilteredStatusCounts(){
  const selected=new Set(v260SelectedCategoryIds());
  const counts=new Map(V260_STATUS_ORDER.map(x=>[x,0]));
  for(const item of (S.library||[])){
    if(!item)continue;
    if(selected.size&&!selected.has(String(item.categoryId||'')))continue;
    const st=String(item.status||'planned');
    counts.set('all',(counts.get('all')||0)+1);
    counts.set(st,(counts.get(st)||0)+1);
  }
  return counts;
}
function v260CategoryCounts(){
  const map=new Map();
  for(const item of (S.library||[])){
    const id=String(item?.categoryId||'');
    if(id)map.set(id,(map.get(id)||0)+1);
  }
  return map;
}
function v260SetClassicStatus(status){
  const next=String(status||'all');
  if(App?.setLibFilter)return App.setLibFilter('libStatus',next);
  S.histFilters=S.histFilters||{};S.histFilters.libStatus=next;S.libPage=0;render();
}
function v260ToggleClassicCategory(id){
  const sid=String(id||'');
  const selected=new Set(v260SelectedCategoryIds());
  const on=!selected.has(sid);
  if(typeof v236ToggleLibraryCategory==='function')return v236ToggleLibraryCategory(sid,on);
  if(App?.v69ToggleLibraryCategory)return App.v69ToggleLibraryCategory(sid,on);
}
function v260ClearClassicCategories(){
  if(typeof v236ClearLibraryCategories==='function')return v236ClearLibraryCategories();
  if(App?.v69ClearLibraryCategories)return App.v69ClearLibraryCategories();
}
function v260ClassicFilterDockHtml(){
  const selected=new Set(v260SelectedCategoryIds());
  const catCounts=v260CategoryCounts();
  const statusCounts=v260FilteredStatusCounts();
  const currentStatus=String(S.histFilters?.libStatus||'all');
  const cats=v260CategoryFilterCategories();

  const statuses=V260_STATUS_ORDER.map(status=>{
    const active=currentStatus===status;
    const count=statusCounts.get(status)||0;
    return `<button type="button" class="btn btn-sm mf260-filter-chip ${active?'active':''}" aria-pressed="${active?'true':'false'}" onclick="App.v260SetClassicStatus('${escapeHtml(status)}')">${escapeHtml(v260StatusLabel(status))}<span class="v181-dynamic-count">${count.toLocaleString()}</span></button>`;
  }).join('');

  const catButtons=[
    `<button type="button" class="btn btn-sm mf260-filter-chip ${selected.size?'':'active'}" aria-pressed="${selected.size?'false':'true'}" onclick="App.v260ClearClassicCategories()">All<span class="v181-dynamic-count">${(S.library||[]).length.toLocaleString()}</span></button>`,
    ...cats.map(cat=>{
      const id=String(cat.id||'');
      const active=selected.has(id);
      const icon=typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(cat):escapeHtml(cat.icon||'');
      return `<button type="button" class="btn btn-sm mf260-filter-chip ${active?'active':''}" aria-pressed="${active?'true':'false'}" onclick="App.v260ToggleClassicCategory('${escapeHtml(id)}')">${icon}<span>${escapeHtml(cat.name||'Category')}</span><span class="v181-dynamic-count">${(catCounts.get(id)||0).toLocaleString()}</span></button>`;
    })
  ].join('');

  return `<div class="mf260-library-filter-dock" aria-label="Library category and status filters">
    <div class="mf260-filter-row mf260-status-row"><span class="mf260-filter-label">Status</span>${statuses}</div>
    <div class="mf260-filter-row mf260-category-row"><span class="mf260-filter-label">Category</span>${catButtons}</div>
  </div>`;
}

function v260FindLibraryScope(root){
  return root.querySelector('.v177-library-cover-scope,.v188-library-title-scope')||root.querySelector('.fade-in')||root;
}
function v260WrapLibraryTools(root,dynamic){
  if(root.querySelector('.mf260-library-tools'))return root.querySelector('.mf260-library-tools');
  const scope=v260FindLibraryScope(root);
  if(!scope)return null;

  const nodes=[];
  const selectors=[
    '.v181-library-mode-switch',
    '.mf-batchbar',
    '.v181-display-switch',
    '.v254-cover-overlay-controls',
    dynamic?'.v181-dynamic-toolbar':'.lib-toolbar'
  ];
  for(const selector of selectors){
    const node=scope.querySelector(selector);
    if(node&&!nodes.includes(node))nodes.push(node);
  }
  if(!nodes.length)return null;

  const anchor=dynamic?scope.querySelector('.v181-dynamic-nav'):nodes[0];
  const wrap=document.createElement('section');
  wrap.className='mf260-library-tools';
  wrap.setAttribute('aria-label','Library tools');
  wrap.innerHTML=`<div class="mf260-library-tools-head"><div class="mf260-library-tools-title">${V260_TOOL_ICON}<span>Library tools</span></div><span class="spacer"></span><button type="button" class="btn btn-sm btn-ghost mf260-library-tools-toggle" onclick="App.v260ToggleLibraryTools()"></button></div><div class="mf260-library-tools-body"></div>`;
  if(anchor?.parentNode)anchor.parentNode.insertBefore(wrap,anchor);
  else scope.prepend(wrap);
  const body=wrap.querySelector('.mf260-library-tools-body');
  for(const node of nodes){
    if(node===wrap||wrap.contains(node))continue;
    body.appendChild(node);
  }
  return wrap;
}

function v260EnhanceClassicLibrary(root){
  const toolbar=root.querySelector('.lib-toolbar');
  if(!toolbar)return;
  v260WrapLibraryTools(root,false);

  const sourceCategory=root.querySelector('[data-v236-library-category-filter],.v66-cat-filter');
  if(sourceCategory)sourceCategory.classList.add('mf260-source-filter');
  const sourceStatus=[...root.querySelectorAll('select')].find(el=>(el.getAttribute('onchange')||'').includes('libStatus'));
  if(sourceStatus)sourceStatus.classList.add('mf260-source-filter');

  if(!root.querySelector('.mf260-library-filter-dock')){
    const tools=root.querySelector('.mf260-library-tools');
    const dock=document.createElement('div');
    dock.innerHTML=v260ClassicFilterDockHtml();
    const node=dock.firstElementChild;
    if(tools?.parentNode)tools.insertAdjacentElement('afterend',node);
    else toolbar.insertAdjacentElement('afterend',node);
  }
}
function v260EnhanceDynamicLibrary(root){
  const nav=root.querySelector('.v181-dynamic-nav');
  if(!nav)return;
  v260WrapLibraryTools(root,true);
  nav.setAttribute('aria-label','Library category and status navigation');
  const rows=nav.querySelectorAll('.v181-dynamic-row');
  rows[0]?.classList.add('mf260-category-row');
  rows[1]?.classList.add('mf260-status-row');
  rows.forEach(row=>row.querySelectorAll(':scope>.btn').forEach(btn=>btn.setAttribute('aria-pressed',btn.classList.contains('active')?'true':'false')));
}
function v260EnhanceLibrary(){
  const root=document.getElementById('view-root');
  if(!root)return;
  const dynamic=!!root.querySelector('.v181-dynamic-nav');
  root.classList.toggle('mf260-library-dynamic',dynamic);
  root.classList.toggle('mf260-library-classic',!dynamic);
  if(dynamic)v260EnhanceDynamicLibrary(root);else v260EnhanceClassicLibrary(root);
  v260ApplyLibraryToolsState();
}

function v260EnhanceCurrentPage(){
  const root=document.getElementById('view-root');
  if(!root)return;
  const view=String(S.view||MediaFlowRuntime?.getCurrentView?.()||'');
  root.setAttribute('data-mf260-view',view);
  root.querySelector('.view-head')?.setAttribute('data-mf260-page-head','1');
  if(view==='library')v260EnhanceLibrary();

  // Accessibility polish without changing MediaFlow behavior.
  root.querySelectorAll('.view-title').forEach(el=>{if(!el.getAttribute('role'))el.setAttribute('role','heading');if(!el.getAttribute('aria-level'))el.setAttribute('aria-level','1');});
  root.querySelectorAll('button:not([type])').forEach(btn=>btn.setAttribute('type','button'));
  root.querySelectorAll('img:not([loading])').forEach(img=>img.setAttribute('loading','lazy'));
}

function v260ScheduleEnhance(){
  if(v260ScheduleEnhance.queued)return;
  v260ScheduleEnhance.queued=true;
  requestAnimationFrame(()=>{
    v260ScheduleEnhance.queued=false;
    try{v260EnhanceShell();v260EnhanceCurrentPage();}catch(err){console.error('MediaFlow v260 UI enhancement failed',err);}
  });
}
v260ScheduleEnhance.queued=false;

/* Run after both shell render paths and every application render without adding
   another whole-document MutationObserver. */
const v260RenderShellBase=renderShell;
renderShell=function(){
  const result=v260RenderShellBase.apply(this,arguments);
  v260ScheduleEnhance();
  return result;
};
const v260RenderBase=render;
render=function(){
  const result=v260RenderBase.apply(this,arguments);
  v260ScheduleEnhance();
  return result;
};

for(const view of ['dashboard','library','order','oldsystem','libraryhistory','history','batch','stats','profile','settings','about']){
  try{MediaFlowRuntime.registerPageEnhancer(view,v260ScheduleEnhance);}catch(_){ }
}

Object.assign(App,{
  v260ToggleLibraryTools,
  v260SetLibraryToolsCollapsed,
  v260SetClassicStatus,
  v260ToggleClassicCategory,
  v260ClearClassicCategories,
  v260EnhanceCurrentPage
});

window.MediaFlowV260={
  version:V260_RUNTIME_VERSION,
  architecture:'React + TypeScript + Tailwind migration bridge over the stable MediaFlow runtime',
  themeContract:['--bg','--panel','--panel-raised','--border','--border-soft','--text','--text-dim','--text-mute','--flow'],
  enhance:v260ScheduleEnhance,
  toggleLibraryTools:v260ToggleLibraryTools
};

document.documentElement.setAttribute('data-mf260','1');
MediaFlowRuntime.version=V260_RUNTIME_VERSION;
