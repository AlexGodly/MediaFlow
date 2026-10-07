/* ============================================================
   MediaFlow v264 — Library dock, Balance, Order filter and Settings continuity
   ============================================================ */
(function(){
'use strict';
const V264_RUNTIME_VERSION=264;
const V264_CATEGORY_EXPANDED_KEY='mediaflow:v264:normal-library-categories-expanded';

function v264Esc(value){return typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function v264ReadBool(key,fallback=false){try{const raw=localStorage.getItem(key);return raw===null?fallback:(raw==='1'||raw==='true');}catch(_){return fallback;}}
function v264WriteBool(key,value){try{localStorage.setItem(key,value?'1':'0');}catch(_){}}
function v264LibraryCfg(){try{return v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);}catch(_){return {categoryOrder:[],hiddenCategoryIds:[],statusOrder:['active','paused','completed','dropped','planned']};}}
function v264DynamicCategoryOrder(){
  const cfg=v264LibraryCfg();
  let order=[];
  try{order=typeof v228EffectiveDynamicCategoryOrder==='function'?v228EffectiveDynamicCategoryOrder(cfg):(cfg.categoryOrder||[]);}catch(_){order=cfg.categoryOrder||[];}
  const hidden=new Set((cfg.hiddenCategoryIds||[]).map(String));
  const cats=(S.categories||[]).filter(Boolean),map=new Map(cats.map(c=>[String(c.id),c])),out=[];
  for(const id of order||[]){const key=String(id),cat=map.get(key);if(cat&&!hidden.has(key)&&!out.includes(cat))out.push(cat);}
  return out;
}
function v264DynamicStatusOrder(){
  const cfg=v264LibraryCfg();
  const valid=['active','paused','completed','dropped','planned'];
  const out=[];
  for(const status of (cfg.statusOrder||[])){if(valid.includes(status)&&!out.includes(status))out.push(status);}
  for(const status of valid){if(!out.includes(status))out.push(status);}
  return out;
}
function v264StatusLabel(status){if(status==='all')return 'All';try{return v199StatusLabel(status);}catch(_){return status;}}
function v264SelectedCategoryIds(){return Array.isArray(S.histFilters?.libCategories)?S.histFilters.libCategories.map(String):[];}
function v264CategoryCounts(){const map=new Map();for(const item of (S.library||[])){const id=String(item?.categoryId||'');if(id)map.set(id,(map.get(id)||0)+1);}return map;}
function v264StatusCounts(){
  const selected=new Set(v264SelectedCategoryIds()),map=new Map([['all',0]]);
  for(const status of v264DynamicStatusOrder())map.set(status,0);
  for(const item of (S.library||[])){
    if(!item)continue;if(selected.size&&!selected.has(String(item.categoryId||'')))continue;
    const status=String(item.status||'planned');map.set('all',(map.get('all')||0)+1);map.set(status,(map.get(status)||0)+1);
  }
  return map;
}
function v264LibrarySearchHtml(){
  return `<div class="mf264-library-search-row"><span class="mf264-library-search-icon" aria-hidden="true">⌕</span><input type="search" class="lib-search mf264-library-search" value="${v264Esc(S.histFilters?.libSearch||'')}" placeholder="Search your library…" aria-label="Search Library" oninput="App.searchLibrary(this.value)"></div>`;
}
function v264ClassicDockHtml(){
  const selected=new Set(v264SelectedCategoryIds()),catCounts=v264CategoryCounts(),statusCounts=v264StatusCounts(),currentStatus=String(S.histFilters?.libStatus||'all');
  const cats=v264DynamicCategoryOrder();
  const catButtons=[`<button type="button" class="btn btn-sm mf262-filter-chip ${selected.size?'':'active'}" aria-pressed="${selected.size?'false':'true'}" onclick="App.v262ClearClassicCategories()">All<span class="v181-dynamic-count">${(S.library||[]).length.toLocaleString()}</span></button>`,...cats.map(cat=>{const id=String(cat.id||''),active=selected.has(id),icon=typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(cat):v264Esc(cat.icon||'');return `<button type="button" class="btn btn-sm mf262-filter-chip ${active?'active':''}" aria-pressed="${active?'true':'false'}" onclick="App.v262ToggleClassicCategory('${v264Esc(id)}')">${icon}<span>${v264Esc(cat.name||'Category')}</span><span class="v181-dynamic-count">${(catCounts.get(id)||0).toLocaleString()}</span></button>`;})].join('');
  const statuses=['all',...v264DynamicStatusOrder()].map(status=>{const active=currentStatus===status;return `<button type="button" class="btn btn-sm mf262-filter-chip ${active?'active':''}" aria-pressed="${active?'true':'false'}" onclick="App.v262SetClassicStatus('${v264Esc(status)}')">${v264Esc(v264StatusLabel(status))}<span class="v181-dynamic-count">${(statusCounts.get(status)||0).toLocaleString()}</span></button>`;}).join('');
  const expanded=v264ReadBool(V264_CATEGORY_EXPANDED_KEY,false);
  return `<div class="mf262-library-filter-dock mf264-library-filter-dock" aria-label="Library search, category and status filters">
    ${v264LibrarySearchHtml()}
    <div class="mf264-normal-category-shell ${expanded?'is-expanded':''}">
      <div class="mf262-filter-row mf262-category-row"><span class="mf262-filter-label">Category</span>${catButtons}</div>
      <button type="button" class="btn btn-sm btn-ghost mf264-category-expand" onclick="App.v264ToggleNormalCategories()" aria-expanded="${expanded?'true':'false'}" title="${expanded?'Collapse categories':'Show all categories'}"><span aria-hidden="true">${expanded?'⌃':'⌄'}</span><span>${expanded?'Collapse':'Show all'}</span></button>
    </div>
    <div class="mf262-filter-row mf262-status-row"><span class="mf262-filter-label">Status</span>${statuses}</div>
  </div>`;
}
function v264ToggleNormalCategories(){
  const next=!v264ReadBool(V264_CATEGORY_EXPANDED_KEY,false);v264WriteBool(V264_CATEGORY_EXPANDED_KEY,next);
  const shell=document.querySelector('.mf264-normal-category-shell');if(!shell)return render();
  shell.classList.toggle('is-expanded',next);const btn=shell.querySelector('.mf264-category-expand');if(btn){btn.setAttribute('aria-expanded',String(next));btn.title=next?'Collapse categories':'Show all categories';btn.innerHTML=`<span aria-hidden="true">${next?'⌃':'⌄'}</span><span>${next?'Collapse':'Show all'}</span>`;}
}
function v264ReplaceClassicDock(root){
  const old=root.querySelector('.mf262-library-filter-dock');if(!old)return;
  const holder=document.createElement('div');holder.innerHTML=v264ClassicDockHtml();const next=holder.firstElementChild;old.replaceWith(next);
  const sourceSearch=root.querySelector('.mf262-library-tools .lib-search');if(sourceSearch)sourceSearch.classList.add('mf264-source-search');
}
function v264EnhanceDynamicDock(root){
  const nav=root.querySelector('.v181-dynamic-nav');if(!nav)return;
  const rows=[...nav.querySelectorAll(':scope>.v181-dynamic-row')];
  const category=rows.find(r=>r.classList.contains('mf262-category-row'))||rows[0];
  const status=rows.find(r=>r.classList.contains('mf262-status-row'))||rows[1];
  if(!nav.querySelector('.mf264-library-search-row'))nav.insertAdjacentHTML('afterbegin',v264LibrarySearchHtml());
  if(category&&status){nav.appendChild(category);nav.appendChild(status);}
  const sourceSearch=root.querySelector('.mf262-library-tools .v181-dynamic-toolbar .lib-search');if(sourceSearch)sourceSearch.classList.add('mf264-source-search');
}
function v264EnhanceLibrary(){
  if(String(S.view||'')!=='library')return;const root=document.getElementById('view-root');if(!root)return;
  const dynamic=!!root.querySelector('.v181-dynamic-nav');
  if(dynamic)v264EnhanceDynamicDock(root);else v264ReplaceClassicDock(root);
  root.querySelectorAll('.mf262-filter-row,.v181-dynamic-row').forEach(row=>{try{v262BindHorizontalDrag(row);}catch(_){}});
}

/* Dashboard — clearer Today’s Balance composition. */
function v264GuidanceMeta(todayStatus,overallStatus,text){
  let label='Balanced guidance';
  if(todayStatus==='overused')label='Cool-down guidance';
  else if(todayStatus==='due'||todayStatus==='neglected'||overallStatus==='due'||overallStatus==='neglected')label='Catch-up guidance';
  else if(todayStatus==='healthy'&&overallStatus==='healthy')label='Keep it balanced';
  const clean=String(text||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim().replace(/^(Balanced guidance|Catch-up guidance|Cool-down guidance)\s*:\s*/i,'');
  return {label,clean};
}
function v264BalanceMarkup(){
  const cats=(typeof v186ScopeCategories==='function'?v186ScopeCategories('todayBalance'):S.categories.filter(c=>c.enabled)),today=todaysSessions();
  if(!cats.length)return '<div class="mf264-balance-empty">No categories selected for Today’s Balance.</div>';
  const labelMap={healthy:'Healthy',neglected:'Neglected',overused:'Overused',due:'Due'};
  const rows=cats.map(cat=>{
    const amt=today.filter(s=>s.categoryId===cat.id&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.actualAmount)||0),0),todayStatus=categoryStatus(cat),overallStatus=overallCategoryStatus(cat),target=Math.max(1,Number(cat.target)||1),pct=Math.max(0,Math.min(100,Math.round(amt/target*100))),meta=v264GuidanceMeta(todayStatus,overallStatus,v43BalanceGuidance(cat,todayStatus));
    return `<button type="button" class="mf264-balance-row" onclick="App.v261OpenBalanceCategory('${v264Esc(cat.id)}')">
      <span class="mf264-balance-identity"><span class="mf264-balance-cat-icon" style="--mf264-cat:${v264Esc(cat.color||'var(--flow)')}">${v144CategoryIconHtml(cat)}</span><span><b>${v264Esc(cat.name)}</b><small>${amt} ${unitLabel(cat.unit,amt)} today</small></span></span>
      <span class="mf264-balance-health"><em class="status-${todayStatus}">Today · ${labelMap[todayStatus]}</em><em class="status-${overallStatus}">Overall · ${labelMap[overallStatus]}</em></span>
      <span class="mf264-balance-progress"><span><b>${amt} / ${target}</b><small>${pct}%</small></span><i><u style="width:${pct}%"></u></i></span>
      <span class="mf264-balance-guidance"><b>${v264Esc(meta.label)}</b><small>${v264Esc(meta.clean)}</small></span>
      <span class="mf264-balance-arrow" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  const units=today.filter(s=>s.status!=='skipped').reduce((a,s)=>a+(Number(s.actualAmount)||0),0),minutes=today.filter(s=>s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0),streak=computeDayStreak(),unrated=(S.library||[]).filter(i=>!(Number(i.rating)>0)).length;
  return `<div class="mf264-balance-list">${rows}</div><div class="mf264-balance-summary"><div><small>Consumed today</small><b>${units.toLocaleString()}</b><span>units</span></div><div><small>Time invested</small><b>${fmtMinutes(minutes)}</b><span>today</span></div><div><small>Current streak</small><b>${streak}</b><span>days</span></div><div><small>Rating queue</small><b>${unrated.toLocaleString()}</b><span>unrated titles</span></div></div>`;
}
function v264EnhanceBalance(){
  if(String(S.view||'')!=='dashboard')return;const labels=[...document.querySelectorAll('.section-label')],label=labels.find(el=>String(el.textContent||'').toUpperCase().includes("TODAY'S BALANCE")||el.closest('.v261-balance-head'));if(!label)return;
  const head=label.parentElement,card=head?.nextElementSibling;if(!head||!card)return;
  label.innerHTML='<span class="mf264-balance-heading"><span class="mf264-balance-kicker">Dashboard insight</span><b>Today’s Balance</b><small>Category health, daily progress and clear guidance for what to rotate next.</small></span>';
  card.classList.add('mf264-balance-card');card.innerHTML=v264BalanceMarkup();card.dataset.v264Balance='1';
}

/* Personal Order category panel — align inward and escape clipping. */
function v264EnhanceOrder(){
  if(String(S.view||'')!=='order')return;const root=document.getElementById('view-root');if(!root)return;
  root.querySelectorAll('.v225-order-filter-category .v237-category-filter,.v138-order-view .v237-category-filter').forEach(el=>el.classList.add('mf264-order-category-filter'));
}

/* Settings continuity — preserve exact section and relative scroll across rerenders. */
function v264CaptureSettingsPosition(){
  if(String(S.view||'')!=='settings'||!document.querySelector('.v221-settings-page'))return null;
  const scroller=document.scrollingElement||document.documentElement,active=document.querySelector('#v221-settings-nav .v221-settings-nav-item.v231-active'),id=String(active?.dataset?.settingsTarget||'');
  const anchor=(id&&document.getElementById(id))||[...document.querySelectorAll('.v221-settings-content .section-label[id]')].find(el=>{const r=el.getBoundingClientRect();return r.bottom>80;})||null;
  return {scrollTop:scroller.scrollTop,id:String(anchor?.id||id||''),anchorTop:anchor?anchor.getBoundingClientRect().top:null};
}
function v264RestoreSettingsPosition(snapshot){
  if(!snapshot||String(S.view||'')!=='settings')return;const scroller=document.scrollingElement||document.documentElement;
  const apply=()=>{
    if(String(S.view||'')!=='settings')return;const anchor=snapshot.id?document.getElementById(snapshot.id):null;
    if(anchor&&Number.isFinite(snapshot.anchorTop)){const delta=anchor.getBoundingClientRect().top-snapshot.anchorTop;scroller.scrollTop+=delta;try{v231SetActiveSettingsNav(snapshot.id,false);}catch(_){}}
    else scroller.scrollTop=snapshot.scrollTop;
  };
  requestAnimationFrame(()=>requestAnimationFrame(apply));setTimeout(apply,80);setTimeout(apply,180);
}

function v264UpdateVersionChrome(){
  document.querySelectorAll('.v260-topbar-chip').forEach(chip=>{if(/^v\d+$/i.test((chip.textContent||'').trim()))chip.textContent='v264';});
  document.querySelectorAll('.v260-topbar-copy span').forEach(span=>{if(/MediaFlow v\d+/i.test(span.textContent||''))span.textContent=(span.textContent||'').replace(/MediaFlow v\d+/ig,'MediaFlow v264');});
}
function v264PostRender(){try{v264EnhanceLibrary();v264EnhanceBalance();v264EnhanceOrder();v264UpdateVersionChrome();}catch(err){console.error('MediaFlow v264 enhancement failed',err);}}
const v264RenderBase=render;
render=function(){const settingsSnapshot=v264CaptureSettingsPosition();const out=v264RenderBase.apply(this,arguments);requestAnimationFrame(()=>requestAnimationFrame(()=>{v264PostRender();v264RestoreSettingsPosition(settingsSnapshot);}));return out;};
try{MediaFlowRuntime.registerPageEnhancer('library',()=>requestAnimationFrame(v264EnhanceLibrary));MediaFlowRuntime.registerPageEnhancer('dashboard',()=>requestAnimationFrame(v264EnhanceBalance));MediaFlowRuntime.registerPageEnhancer('order',()=>requestAnimationFrame(v264EnhanceOrder));}catch(_){ }
Object.assign(App,{v264ToggleNormalCategories,v264EnhanceLibrary});
window.MediaFlowV264={version:264,focus:'Library dock/search ordering, Today’s Balance readability, Personal Order category popup and Settings continuity'};
MediaFlowRuntime.version=V264_RUNTIME_VERSION;
v264UpdateVersionChrome();
})();
