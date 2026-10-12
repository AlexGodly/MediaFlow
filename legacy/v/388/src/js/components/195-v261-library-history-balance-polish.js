/* ============================================================
   MediaFlow v261 — Library / History / Balance refinement
   ============================================================ */
(function(){
'use strict';
const V261_RUNTIME_VERSION=261;

function v261Esc(v){return escapeHtml(String(v==null?'':v));}
function v261IconFor(view){
  try{return ICONS?.[view]||ICONS?.dashboard||'';}catch(_){return '';}
}
function v261Array(v){return Array.isArray(v)?v:[];}

/* ---------------------------------------------------------------------
   Cover filter reliability
   --------------------------------------------------------------------- */
v224LibraryHasCover=function(item){
  return !!String(item?.coverUrl||item?.cover||item?.imageUrl||item?.poster||'').trim();
};

/* ---------------------------------------------------------------------
   Personal Order pager — remove decorative edge icons/arrows
   --------------------------------------------------------------------- */
v173OrderPaginationHtml=function(page,totalPages,kind,catId=''){
  if(totalPages<=1)return '';
  page=Math.max(0,Math.min(totalPages-1,Number(page)||0));
  const id=String(catId||'').replace(/'/g,"\\'");
  const call=(target)=>kind==='category'
    ?`App.v173SetOrderPage('category',${target},'${id}')`
    :`App.v173SetOrderPage('all',${target})`;
  return `<div class="v173-order-pagination v261-order-pagination ${kind==='category'?'v173-category-pagination':''}">
    <button type="button" class="btn btn-sm btn-ghost" onclick="${call(page-1)}" ${page===0?'disabled':''}>Prev</button>
    <span class="v173-page-label">Page ${(page+1).toLocaleString()} / ${totalPages.toLocaleString()}</span>
    <button type="button" class="btn btn-sm btn-ghost" onclick="${call(page+1)}" ${page>=totalPages-1?'disabled':''}>Next</button>
  </div>`;
};

/* ---------------------------------------------------------------------
   Library controls / sticky category + status navigator
   --------------------------------------------------------------------- */
function v261LibraryToolsHidden(){return !!S.settings?.v261LibraryToolsHidden;}
function v261ToggleLibraryTools(){
  S.settings=S.settings||{};
  S.settings.v261LibraryToolsHidden=!v261LibraryToolsHidden();
  persistSettings();
  const panel=document.querySelector('.v261-library-tools');
  if(panel)panel.classList.toggle('is-collapsed',v261LibraryToolsHidden());
  const btn=document.querySelector('.v261-library-tools-toggle');
  if(btn){btn.setAttribute('aria-expanded',String(!v261LibraryToolsHidden()));btn.querySelector('span:last-child').textContent=v261LibraryToolsHidden()?'Show tools':'Hide tools';}
}
function v261SetNormalCategory(id){
  S.histFilters=S.histFilters||{};
  const next=String(id||'all');
  S.histFilters.libCategory=next;
  S.histFilters.libCategories=[];
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){ }
  render();
}
function v261SetNormalStatus(id){
  S.histFilters=S.histFilters||{};
  S.histFilters.libStatus=String(id||'all');
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){ }
  render();
}
function v261StatusButtonHtml(id,label,active,onclick){
  const icon={all:'◉',planned:'▣',active:'▶',paused:'Ⅱ',completed:'✓',dropped:'⊗'}[id]||'•';
  return `<button type="button" class="v261-library-chip ${active?'active':''}" onclick="${onclick}" aria-pressed="${active?'true':'false'}"><span class="v261-chip-icon">${icon}</span><span>${v261Esc(label)}</span></button>`;
}
function v261CategoryButtonHtml(cat,active,onclick){
  return `<button type="button" class="v261-library-chip v261-category-chip ${active?'active':''}" onclick="${onclick}" aria-pressed="${active?'true':'false'}"><span class="v261-chip-icon">${v144CategoryIconHtml(cat)}</span><span>${v261Esc(cat.name)}</span></button>`;
}
function v261LibraryStickyHtml(dynamic){
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);
  const statuses=[['all','All'],['planned','Plan to Watch'],['active','Watching'],['paused','On Hold'],['completed','Completed'],['dropped','Dropped']];
  const activeStatus=dynamic?String(cfg.activeStatus||'active'):String(S.histFilters?.libStatus||'all');
  const activeCategory=dynamic?String(cfg.activeCategoryId||''):String(S.histFilters?.libCategory||'all');
  const visibleCats=dynamic
    ?cfg.categoryOrder.filter(id=>!cfg.hiddenCategoryIds.includes(id)).map(id=>S.categories.find(c=>String(c.id)===String(id))).filter(Boolean)
    :v261Array(S.categories);
  const statusHtml=statuses.filter(([id])=>!dynamic||id!=='all').map(([id,label])=>{
    const click=dynamic?`App.v181SelectDynamicStatus('${v261Esc(id)}')`:`App.v261SetNormalStatus('${v261Esc(id)}')`;
    return v261StatusButtonHtml(id,label,activeStatus===id,click);
  }).join('');
  const catHtml=(dynamic?'':`<button type="button" class="v261-library-chip ${activeCategory==='all'?'active':''}" onclick="App.v261SetNormalCategory('all')"><span class="v261-chip-icon">◉</span><span>All</span></button>`)+visibleCats.map(cat=>{
    const click=dynamic?`App.v181SelectDynamicCategory('${v261Esc(cat.id)}')`:`App.v261SetNormalCategory('${v261Esc(cat.id)}')`;
    return v261CategoryButtonHtml(cat,activeCategory===String(cat.id),click);
  }).join('');
  return `<section class="v261-library-sticky" aria-label="Library search and quick filters">
    <div class="v261-library-search-row"><span class="v261-search-icon" aria-hidden="true">⌕</span><input class="lib-search v261-library-search" type="search" value="${v261Esc(S.histFilters?.libSearch||'')}" placeholder="Search titles…" oninput="App.searchLibrary(this.value)" aria-label="Search Library"></div>
    <div class="v261-sticky-filter-row"><span class="v261-sticky-filter-label">Status</span><div class="v261-drag-strip" data-v261-drag-strip>${statusHtml}</div></div>
    <div class="v261-sticky-filter-row"><span class="v261-sticky-filter-label">Category</span><div class="v261-drag-strip" data-v261-drag-strip>${catHtml}</div></div>
  </section>`;
}
function v261PrepareLibraryHtml(html){
  const dynamic=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS).mode==='dynamic';
  return `<div class="v261-library-page ${dynamic?'is-dynamic':'is-normal'}">${html}${v261LibraryStickyHtml(dynamic)}</div>`;
}
const v261RenderLibraryBase=renderLibrary;
renderLibrary=function(){return v261PrepareLibraryHtml(v261RenderLibraryBase.apply(this,arguments));};

function v261BindDragStrip(el){
  if(!el||el.dataset.v261Bound)return;el.dataset.v261Bound='1';
  let down=false,startX=0,startScroll=0,moved=false;
  el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;down=true;moved=false;startX=e.clientX;startScroll=el.scrollLeft;try{el.setPointerCapture(e.pointerId);}catch(_){}});
  el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-startX;if(Math.abs(dx)>4)moved=true;el.scrollLeft=startScroll-dx;});
  el.addEventListener('pointerup',()=>{down=false;});el.addEventListener('pointercancel',()=>{down=false;});
  el.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
}
function v261EnhanceLibraryDom(){
  if(String(S.view||'')!=='library')return;
  const page=document.querySelector('.v261-library-page');if(!page)return;
  const viewHead=page.querySelector('.view-head');
  if(viewHead&&!viewHead.querySelector('.v261-library-tools-toggle')){
    const btn=document.createElement('button');btn.type='button';btn.className='btn btn-sm v261-library-tools-toggle';btn.setAttribute('aria-expanded',String(!v261LibraryToolsHidden()));btn.innerHTML=`<span aria-hidden="true">☷</span><span>${v261LibraryToolsHidden()?'Show tools':'Hide tools'}</span>`;btn.addEventListener('click',v261ToggleLibraryTools);viewHead.appendChild(btn);
  }
  let tools=page.querySelector('.v261-library-tools');
  if(!tools){
    tools=document.createElement('section');tools.className='v261-library-tools'+(v261LibraryToolsHidden()?' is-collapsed':'');tools.innerHTML='<div class="v261-library-tools-head"><span>Library tools</span><small>Display, selection, sorting and cover controls</small></div><div class="v261-library-tools-content"></div>';
    const overviewToggle=page.querySelector('.v183-library-overview-toggle');
    const insertAfter=overviewToggle?.closest('.card')||overviewToggle||viewHead;
    if(insertAfter?.parentNode)insertAfter.parentNode.insertBefore(tools,insertAfter.nextSibling);else page.prepend(tools);
    const content=tools.querySelector('.v261-library-tools-content');
    const selectors=['.v181-library-mode-switch','.mf-batchbar','.v181-display-switch','.v254-cover-overlay-controls','.lib-toolbar','.v181-dynamic-toolbar','.v181-dynamic-summary'];
    const moved=new Set();
    for(const sel of selectors){page.querySelectorAll(sel).forEach(el=>{if(el.closest('.v261-library-tools')||el.closest('.v261-library-sticky')||moved.has(el))return;moved.add(el);content.appendChild(el);});}
  }
  page.querySelectorAll('.v181-dynamic-nav').forEach(el=>el.classList.add('v261-legacy-dynamic-nav'));
  const sticky=page.querySelector('.v261-library-sticky');
  if(sticky&&tools?.parentNode){tools.parentNode.insertBefore(sticky,tools.nextSibling);}
  // Remove duplicate search/status/category controls from tools; v261 sticky owns them.
  tools?.querySelectorAll('.lib-search').forEach(el=>el.closest('.v261-library-search-row')||el.remove());
  tools?.querySelectorAll('.v66-cat-filter').forEach(el=>el.classList.add('v261-duplicate-category-filter'));
  tools?.querySelectorAll('select').forEach(sel=>{
    const opts=[...sel.options].map(o=>String(o.textContent||'').trim().toLowerCase());
    if(opts.includes('all statuses')||opts.includes('all categories'))sel.classList.add('v261-duplicate-quick-filter');
  });
  page.querySelectorAll('[data-v261-drag-strip]').forEach(v261BindDragStrip);
}

/* ---------------------------------------------------------------------
   Today's Balance redesign
   --------------------------------------------------------------------- */
function v261OpenBalanceCategory(id){
  S.histFilters=S.histFilters||{};S.histFilters.libCategory=String(id);S.histFilters.libCategories=[];S.histFilters.libStatus='all';S.libPage=0;
  const cfg=v181EnsureLibrarySettings(S.settings||DEFAULT_SETTINGS);cfg.activeCategoryId=String(id);S.view='library';persistSettings();render();
}
function v261BalanceMarkup(){
  const cats=(typeof v186ScopeCategories==='function'?v186ScopeCategories('todayBalance'):S.categories.filter(c=>c.enabled));
  const today=todaysSessions();
  if(!cats.length)return '<div class="v261-balance-empty">No categories selected for Today’s Balance.</div>';
  const labelMap={healthy:'Healthy',neglected:'Neglected',overused:'Overused',due:'Due'};
  const rows=cats.map(cat=>{
    const amt=today.filter(s=>s.categoryId===cat.id&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.actualAmount)||0),0);
    const todayStatus=categoryStatus(cat),overallStatus=overallCategoryStatus(cat),target=Math.max(1,Number(cat.target)||1),pct=Math.max(0,Math.min(100,Math.round(amt/target*100)));
    const guidance=v43BalanceGuidance(cat,todayStatus);
    return `<button type="button" class="v261-balance-row" onclick="App.v261OpenBalanceCategory('${v261Esc(cat.id)}')">
      <span class="v261-balance-cat-icon" style="--v261-cat:${v261Esc(cat.color||'var(--flow)')}">${v144CategoryIconHtml(cat)}</span>
      <span class="v261-balance-title"><b>${v261Esc(cat.name)}</b><small>${amt} ${unitLabel(cat.unit,amt)} today</small></span>
      <span class="v261-balance-badges"><em class="status-${todayStatus}">Today: ${labelMap[todayStatus]}</em><em class="status-${overallStatus}">Overall: ${labelMap[overallStatus]}</em></span>
      <span class="v261-balance-progress"><span><b>${amt} / ${target}</b><small>${pct}%</small></span><i><u style="width:${pct}%"></u></i></span>
      <span class="v261-balance-guidance">${guidance}</span>
      <span class="v261-balance-arrow" aria-hidden="true">›</span>
    </button>`;
  }).join('');
  const units=today.filter(s=>s.status!=='skipped').reduce((a,s)=>a+(Number(s.actualAmount)||0),0);
  const minutes=today.filter(s=>s.status!=='skipped').reduce((a,s)=>a+(Number(s.minutes)||0),0);
  const streak=computeDayStreak();
  const unrated=(S.library||[]).filter(i=>!(Number(i.rating)>0)).length;
  return `<div class="v261-balance-list">${rows}</div><div class="v261-balance-summary">
    <div><span class="v261-summary-icon">▶</span><b>${units.toLocaleString()}</b><small>units today</small></div>
    <div><span class="v261-summary-icon">◷</span><b>${fmtMinutes(minutes)}</b><small>time invested</small></div>
    <div><span class="v261-summary-icon">✓</span><b>${streak}</b><small>day streak</small></div>
    <div><span class="v261-summary-icon">★</span><b>${unrated.toLocaleString()}</b><small>unrated titles</small></div>
  </div>`;
}
function v261EnhanceBalanceDom(){
  if(String(S.view||'')!=='dashboard')return;
  const labels=[...document.querySelectorAll('.section-label')];
  const label=labels.find(el=>String(el.textContent||'').trim().toUpperCase()==="TODAY'S BALANCE");if(!label)return;
  const head=label.parentElement;const card=head?.nextElementSibling;if(!head||!card||card.dataset.v261Balance)return;
  card.dataset.v261Balance='1';head.classList.add('v261-balance-head');card.classList.add('v261-balance-card');
  label.innerHTML=`<span class="v261-mediaflow-mini"><img src="assets/icons/mediaflow-192.png" alt=""></span><span><b>Today’s Balance</b><small>Track category health, momentum and catch-up guidance.</small></span>`;
  card.innerHTML=v261BalanceMarkup();
}

/* ---------------------------------------------------------------------
   Unified History v261 — Simkl-inspired, paginated / filtered
   --------------------------------------------------------------------- */
function v261HistoryState(kind){
  S.v261HistoryUI=S.v261HistoryUI||{};
  if(!S.v261HistoryUI[kind])S.v261HistoryUI[kind]={query:'',category:'all',period:'all',rating:'all',year:'all',sort:'recent',page:0,pageSize:50};
  return S.v261HistoryUI[kind];
}
function v261SetHistoryFilter(kind,key,value){const st=v261HistoryState(kind);st[key]=String(value??'');st.page=0;render();}
function v261SetHistoryPage(kind,page){const st=v261HistoryState(kind);st.page=Math.max(0,Number(page)||0);render();}
function v261HistoryPager(kind,total){const st=v261HistoryState(kind),size=Math.max(10,Number(st.pageSize)||50),pages=Math.max(1,Math.ceil(total/size));st.page=Math.min(st.page,pages-1);if(pages<=1)return '';return `<div class="v261-history-pager"><button class="btn btn-sm" ${st.page<=0?'disabled':''} onclick="App.v261SetHistoryPage('${kind}',${st.page-1})">Previous</button><span>Page ${st.page+1} of ${pages} · ${total.toLocaleString()}</span><button class="btn btn-sm" ${st.page>=pages-1?'disabled':''} onclick="App.v261SetHistoryPage('${kind}',${st.page+1})">Next</button></div>`;}
function v261CategoryOptions(selected){return `<option value="all">All media</option>${(S.categories||[]).map(c=>`<option value="${v261Esc(c.id)}" ${String(selected)===String(c.id)?'selected':''}>${v261Esc(c.name)}</option>`).join('')}`;}
function v261RecentData(){
  const st=v261HistoryState('recent'),now=Date.now(),periodDays={7:7,30:30,365:365}[st.period]||0,q=st.query.trim().toLowerCase();
  const sessions=v261Array(S.sessions).filter(s=>s&&s.status!=='skipped').slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  const seen=new Set(),rows=[];
  for(const s of sessions){const item=v260LibraryItemForSession(s),key=String(item?.id||cleanTitle(s.title||'')||s.id);if(seen.has(key))continue;seen.add(key);if(st.category!=='all'&&String(s.categoryId)!==String(st.category))continue;if(periodDays&&now-(Number(s.timestamp)||0)>periodDays*86400000)continue;const title=v260ItemTitle(item,s);if(q&&!title.toLowerCase().includes(q))continue;rows.push({s,item,title});}
  return rows;
}
function v261RecentInsights(rows){
  if(!rows.length)return '';
  const hours=new Array(24).fill(0),days=new Map(),parts={Morning:0,Afternoon:0,Evening:0,Night:0},cats=new Map();
  rows.forEach(({s})=>{const d=new Date(Number(s.timestamp)||Date.now()),h=d.getHours();hours[h]++;const day=d.toLocaleDateString(undefined,{weekday:'short'});days.set(day,(days.get(day)||0)+1);const [part]=v260TimeBucket(s.timestamp);parts[part]=(parts[part]||0)+1;const c=getCategory(s.categoryId);cats.set(c?.name||'Other',(cats.get(c?.name||'Other')||0)+1);});
  const peak=hours.indexOf(Math.max(...hours)),mostDay=[...days.entries()].sort((a,b)=>b[1]-a[1])[0]||['—',0],mostPart=Object.entries(parts).sort((a,b)=>b[1]-a[1])[0],mostCat=[...cats.entries()].sort((a,b)=>b[1]-a[1])[0]||['—',0],total=rows.length;
  const pct=n=>Math.round(n/Math.max(1,total)*100);
  return `<section class="v261-browsing-insights"><div class="v261-insights-title"><b>Browsing Behavior Insights</b><span>Based on your filtered recently viewed items</span></div><div class="v261-insight-cards"><div><small>Peak hour</small><b>${String(peak).padStart(2,'0')}:00</b><span>${hours[peak]} items</span></div><div><small>Browsing personality</small><b>${mostPart?.[0]||'—'}</b><span>${pct(mostPart?.[1]||0)}% of activity</span></div><div><small>Most active day</small><b>${mostDay[0]}</b><span>${mostDay[1]} items</span></div><div><small>What you browse</small><b>${v261Esc(mostCat[0])}</b><span>${pct(mostCat[1])}%</span></div></div><div class="v261-daypart-bars">${Object.entries(parts).map(([k,v])=>`<div><span>${k}</span><i><u style="width:${pct(v)}%"></u></i><b>${pct(v)}%</b></div>`).join('')}</div></section>`;
}
function v261RecentHtml(){
  const st=v261HistoryState('recent'),all=v261RecentData(),size=Math.max(10,Number(st.pageSize)||50),pages=Math.max(1,Math.ceil(all.length/size));st.page=Math.min(st.page,pages-1);const rows=all.slice(st.page*size,st.page*size+size);
  const groups=new Map();rows.forEach(x=>{const key=v260DateKey(x.s.timestamp);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);});
  const timeline=[...groups.values()].map(items=>{const by=new Map();items.forEach(x=>{const [name,symbol]=v260TimeBucket(x.s.timestamp);if(!by.has(name))by.set(name,{symbol,items:[]});by.get(name).items.push(x);});return `<section class="v261-recent-day"><header><span></span><b>${v261Esc(v260DateLabel(items[0].s.timestamp))}</b><small>${new Date(Number(items[0].s.timestamp)||Date.now()).toLocaleDateString(undefined,{weekday:'long'})}</small></header>${[...by.entries()].map(([name,data])=>`<div class="v261-daypart"><div class="v261-daypart-head"><b>${data.symbol} ${name}</b><small>${name==='Night'?'12:00 AM – 5:59 AM':name==='Morning'?'6:00 AM – 11:59 AM':name==='Afternoon'?'12:00 PM – 5:59 PM':'6:00 PM – 11:59 PM'}</small></div><div class="v261-recent-grid">${data.items.map(({s,item,title})=>{const cover=v260ItemCover(item),cat=getCategory(s.categoryId);return `<button type="button" class="v261-recent-card" onclick="App.openSessionModal('${v261Esc(s.id)}')"><span class="v261-recent-cover">${cover?`<img src="${v261Esc(cover)}" alt="">`:`<span>${cat?v144CategoryIconHtml(cat):'◫'}</span>`}</span><span><small>${v261Esc(cat?.name||'Media')} · ${v261Esc(v260TimeLabel(s.timestamp))}</small><b>${v261Esc(title)}</b><em>${fmtMinutes(v260MinutesOf(s))}</em></span></button>`;}).join('')}</div></div>`).join('')}</section>`;}).join('');
  return `<div class="v261-history-toolbar"><div class="v261-filter-group"><select onchange="App.v261SetHistoryFilter('recent','category',this.value)">${v261CategoryOptions(st.category)}</select><select onchange="App.v261SetHistoryFilter('recent','period',this.value)"><option value="all" ${st.period==='all'?'selected':''}>All time</option><option value="7" ${st.period==='7'?'selected':''}>Last 7 days</option><option value="30" ${st.period==='30'?'selected':''}>Last 30 days</option><option value="365" ${st.period==='365'?'selected':''}>Last year</option></select><input type="search" placeholder="Search recently viewed…" value="${v261Esc(st.query)}" oninput="App.v261SetHistoryFilter('recent','query',this.value)"></div><span>${all.length.toLocaleString()} titles</span></div>${rows.length?`<div class="v261-recent-timeline">${timeline}</div>${v261HistoryPager('recent',all.length)}${v261RecentInsights(all)}`:'<div class="v260-empty"><b>No matching recent activity</b><span>Adjust the filters or log more titles.</span></div>'}`;
}
function v261RatingsData(){
  const st=v261HistoryState('ratings'),q=st.query.trim().toLowerCase();
  let rows=v261Array(S.library).filter(i=>Number(i?.rating)>0);
  if(st.category!=='all')rows=rows.filter(i=>String(i.categoryId)===String(st.category));
  if(st.year!=='all')rows=rows.filter(i=>String(i.year||'')===String(st.year));
  if(st.rating!=='all')rows=rows.filter(i=>Math.floor(Number(i.rating)||0)===Number(st.rating));
  if(q)rows=rows.filter(i=>cleanTitle(i.title).toLowerCase().includes(q));
  if(st.sort==='title')rows.sort((a,b)=>cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true}));
  else if(st.sort==='rating')rows.sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)||cleanTitle(a.title).localeCompare(cleanTitle(b.title)));
  else rows.sort((a,b)=>(Number(b.modifiedAt||b.updatedAt||b.completedAt||b.createdAt)||0)-(Number(a.modifiedAt||a.updatedAt||a.completedAt||a.createdAt)||0));
  return rows;
}
function v261RatingsHtml(){
  const st=v261HistoryState('ratings'),all=v261RatingsData(),years=[...new Set(v261Array(S.library).filter(i=>Number(i?.rating)>0&&i.year).map(i=>String(i.year)))].sort((a,b)=>Number(b)-Number(a)),size=Math.max(10,Number(st.pageSize)||50),pages=Math.max(1,Math.ceil(all.length/size));st.page=Math.min(st.page,pages-1);const rows=all.slice(st.page*size,st.page*size+size),maxRating=Math.max(10,...all.map(i=>Number(i.rating)||0)),avg=all.length?all.reduce((a,i)=>a+(Number(i.rating)||0),0)/all.length:0;
  return `<div class="v261-history-toolbar"><div class="v261-filter-group"><select onchange="App.v261SetHistoryFilter('ratings','category',this.value)">${v261CategoryOptions(st.category)}</select><select onchange="App.v261SetHistoryFilter('ratings','rating',this.value)"><option value="all">All ratings</option>${Array.from({length:10},(_,i)=>10-i).map(n=>`<option value="${n}" ${st.rating===String(n)?'selected':''}>${n} stars</option>`).join('')}</select><select onchange="App.v261SetHistoryFilter('ratings','year',this.value)"><option value="all">All years</option>${years.map(y=>`<option value="${y}" ${st.year===y?'selected':''}>${y}</option>`).join('')}</select><select onchange="App.v261SetHistoryFilter('ratings','sort',this.value)"><option value="recent" ${st.sort==='recent'?'selected':''}>Recently updated</option><option value="rating" ${st.sort==='rating'?'selected':''}>Rating</option><option value="title" ${st.sort==='title'?'selected':''}>Title</option></select><input type="search" placeholder="Search ratings…" value="${v261Esc(st.query)}" oninput="App.v261SetHistoryFilter('ratings','query',this.value)"></div><span>${all.length.toLocaleString()} rated</span></div><div class="v261-ratings-summary"><div><small>Rated titles</small><b>${all.length.toLocaleString()}</b></div><div><small>Average rating</small><b>${avg.toFixed(1)}</b></div><div><small>Perfect scores</small><b>${all.filter(i=>Number(i.rating)>=maxRating).length.toLocaleString()}</b></div></div><div class="v261-ratings-table"><div class="v261-rating-head"><span>Date</span><span>Rating</span><span>Title</span><span>Stars</span><span></span></div>${rows.map(item=>{const cat=getCategory(item.categoryId),cover=v260ItemCover(item),rating=Number(item.rating)||0,stars=Math.max(0,Math.min(10,Math.round(rating))),date=new Date(Number(item.modifiedAt||item.updatedAt||item.completedAt||item.createdAt)||Date.now());return `<article class="v261-rating-row"><time>${date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</time><strong>★ ${rating.toFixed(Number.isInteger(rating)?0:1)}</strong><div class="v261-rating-title"><span class="v261-rating-cover">${cover?`<img src="${v261Esc(cover)}" alt="">`:`<span>${cat?v144CategoryIconHtml(cat):'◫'}</span>`}</span><span><b>${v261Esc(cleanTitle(item.title))}</b><small>${v261Esc(item.year||'')}${cat?` · ${v261Esc(cat.name)}`:''}</small></span></div><div class="v261-rating-stars" aria-label="${stars} out of 10">${'★'.repeat(stars)}${'☆'.repeat(10-stars)}</div><button class="btn btn-sm" onclick="App.openLibraryModal('${v261Esc(item.id)}')">Edit</button></article>`;}).join('')}</div>${v261HistoryPager('ratings',all.length)}`;
}
const v261BaseHistoryBody=v260HistoryBody;
v260HistoryBody=function(tab){
  if(tab==='recent')return v261RecentHtml();
  if(tab==='ratings')return v261RatingsHtml();
  if(tab==='library')return `<div class="v261-history-subhead"><div><b>Library history</b><span>Every change made to your Library, with its own filters and batch tools.</span></div></div><div class="v260-library-history-embed v261-history-legacy-embed">${v260StripLegacyHead(v260BaseRenderLibraryHistory())}</div>`;
  return `<div class="v261-history-subhead"><div><b>Consumption history</b><span>Watch/read activity, sessions, time and progress logs.</span></div></div>${v260ConsumptionInsights()}<div class="v260-consumption-history v261-history-legacy-embed">${v260StripLegacyHead(v260BaseRenderHistory())}</div>`;
};
const v261RenderHistoryBase=renderHistory;
renderHistory=function(){let html=v261RenderHistoryBase.apply(this,arguments);return html.replace('class="v260-history-page"','class="v260-history-page v261-history-page"').replace('Activity archive','Your media activity');};

/* ---------------------------------------------------------------------
   Page header icons + brand/icon polish
   --------------------------------------------------------------------- */
function v261RefreshHeaderIcon(){
  const view=String(S.view||'dashboard');
  const mark=document.querySelector('.v260-topbar-mark');if(mark){mark.classList.add('v261-page-icon');mark.innerHTML=v261IconFor(view);}
  document.querySelectorAll('.v260-topbar-chip').forEach((chip,i)=>{if(i===0||chip.title==='Current dynamic theme')chip.remove();else if(/v260/i.test(chip.textContent||''))chip.textContent='v261';});
  const fallback=document.querySelector('.v260-topbar-fallback .v260-topbar-copy span');if(fallback)fallback.textContent='MediaFlow v261 · refined professional interface';
}
function v261PostRender(){queueMicrotask(()=>{try{v261EnhanceLibraryDom();v261EnhanceBalanceDom();v261RefreshHeaderIcon();}catch(e){console.error('MediaFlow v261 enhancement failed',e);}});}
const v261RenderBase=render;
render=function(){const out=v261RenderBase.apply(this,arguments);v261PostRender();return out;};
const v261RenderShellBase=renderShell;
renderShell=function(){const out=v261RenderShellBase.apply(this,arguments);v261PostRender();return out;};

/* backup metadata */
const v261BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(){const manifest=v261BackupManifestBase.apply(this,arguments);manifest.includes=Object.assign({},manifest.includes||{},{libraryStickyNavigationV261:true,historyOptimizationV261:true,todaysBalanceRedesignV261:true,coverFilterFixV261:true});manifest.v261={coverFilterFix:true,libraryStickySearchStatusCategory:true,historyTabsOptimized:true,ratingPagination:true,todaysBalanceRedesign:true,pageHeaderIcons:true};return manifest;};

Object.assign(App,{v261ToggleLibraryTools,v261SetNormalCategory,v261SetNormalStatus,v261OpenBalanceCategory,v261SetHistoryFilter,v261SetHistoryPage});
MediaFlowRuntime.version=V261_RUNTIME_VERSION;
window.MediaFlowV261Bridge={version:V261_RUNTIME_VERSION,getView:()=>String(S.view||'dashboard'),getTheme:()=>document.documentElement.getAttribute('data-theme')||'dark'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v261PostRender,{once:true});else v261PostRender();
})();
