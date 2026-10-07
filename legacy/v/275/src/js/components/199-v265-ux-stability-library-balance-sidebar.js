/* ============================================================
   MediaFlow v265 — UX stability, title deletion, Balance & sidebar
   ------------------------------------------------------------
   Focused reliability/UI release:
   - Title Details + Edit Title expose a designed delete-title flow.
   - Library search keeps focus/caret across live refreshes.
   - Normal Library source category dropdown never flashes between renders.
   - Normal status chips use the same semantic status icons as Dynamic Library.
   - Personal Order category popup is viewport-clamped and never clipped.
   - Today's Balance is a clean, non-interactive Dashboard insight.
   - Settings updates morph in-place instead of rebuilding the page.
   - Theme-aware sidebar can collapse/expand and persists with Settings/cloud.
   ============================================================ */
(function(){
'use strict';
const V265_RUNTIME_VERSION=265;
const V265_LIBRARY_SEARCH_DELAY=260;
let V265_LIBRARY_SEARCH_TIMER=0;
let V265_SETTINGS_PATCHING=false;
let V265_ORDER_REPOSITION_BOUND=false;

function v265Esc(value){
  return typeof escapeHtml==='function'
    ?escapeHtml(String(value??''))
    :String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function v265Clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function v265AfterPaint(fn){requestAnimationFrame(()=>requestAnimationFrame(()=>{try{fn();}catch(err){console.error('MediaFlow v265 post-paint task failed',err);}}));}

/* ---------------------------------------------------------------------
   Designed delete-title flow in Edit Title + Title Details
   --------------------------------------------------------------------- */
const v265LibraryDeleteModalBase=libraryDeleteModalHtml;
libraryDeleteModalHtml=function(d){
  const item=(S.library||[]).find(i=>String(i?.id||'')===String(d?.id||''));
  const title=cleanTitle(item?.title||d?.title||'this title')||'this title';
  const cat=item?getCategory(item.categoryId):null;
  const id=v265Esc(d?.id||item?.id||'');
  const cover=item?.coverUrl
    ?`<img class="mf265-delete-cover" src="${v265Esc(item.coverUrl)}" alt="" onerror="this.style.display='none'">`
    :`<span class="mf265-delete-cover mf265-delete-cover-fallback">${cat&&typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(cat):'◫'}</span>`;
  return `<div class="mf265-delete-title-confirm">
    <div class="mf265-delete-title-head">
      ${cover}
      <div><span class="mf265-danger-kicker">Permanent Library action</span><div class="modal-title">Delete title?</div><p>Remove <b>${v265Esc(title)}</b> from your Library.</p></div>
    </div>
    <div class="mf265-delete-title-note"><b>Your consumption History is kept.</b><span>The Library entry, its title metadata and Library-only progress are removed. This action cannot be undone.</span></div>
    <div class="modal-actions mf265-delete-actions">
      <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="App.confirmDeleteLibrary('${id}')">Delete title</button>
    </div>
  </div>`;
};

const v265LibraryModalBase=libraryModalHtml;
libraryModalHtml=function(d){
  const html=String(v265LibraryModalBase.apply(this,arguments)||'');
  if(!d?.id)return html;
  try{
    const tpl=document.createElement('template');tpl.innerHTML=html;
    const title=tpl.content.querySelector('.modal-title');
    const deleteBtn=[...tpl.content.querySelectorAll('button')].find(btn=>String(btn.textContent||'').trim().toLowerCase()==='delete title');
    if(title&&deleteBtn){
      const oldWrap=deleteBtn.parentElement;
      const head=document.createElement('div');head.className='mf265-edit-title-head';
      title.parentNode.insertBefore(head,title);head.appendChild(title);head.appendChild(deleteBtn);
      if(oldWrap&&oldWrap!==head&&!oldWrap.textContent.trim()&&!oldWrap.children.length)oldWrap.remove();
    }
    return tpl.innerHTML;
  }catch(_){return html;}
};

const v265TitleDetailsBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
  const html=String(v265TitleDetailsBase.apply(this,arguments)||'');
  if(!item?.id)return html;
  try{
    const tpl=document.createElement('template');tpl.innerHTML=html;
    const actions=[...tpl.content.querySelectorAll('.v181-detail-actions')];
    actions.forEach((row,index)=>{
      if(row.querySelector('.mf265-delete-title-details'))return;
      const btn=document.createElement('button');
      btn.type='button';btn.className='btn btn-sm btn-danger mf265-delete-title-details';btn.textContent='Delete title';
      btn.setAttribute('onclick',`App.v265DeleteTitleFromDetails('${v265Esc(String(item.id))}')`);
      if(index===0)row.insertBefore(btn,row.firstChild);else row.appendChild(btn);
    });
    return tpl.innerHTML;
  }catch(_){return html;}
};
function v265DeleteTitleFromDetails(id){
  try{v181CloseTitleDetails();}catch(_){document.getElementById('v181-title-details-overlay')?.remove();}
  App.deleteLibraryItem(String(id));
}

/* ---------------------------------------------------------------------
   Library focus stability + classic filter polish
   --------------------------------------------------------------------- */
function v265VisibleLibrarySearch(){
  return [...document.querySelectorAll('#view-root .mf264-library-search,#view-root .lib-search')].find(el=>{
    const cs=getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&el.offsetParent!==null;
  })||null;
}
function v265CaptureLibraryFocus(){
  if(String(S.view||'')!=='library')return null;
  const active=document.activeElement;
  if(!active||!active.matches?.('#view-root .mf264-library-search,#view-root .lib-search'))return null;
  const value=String(active.value??S.histFilters?.libSearch??'');
  const len=value.length;
  return {value,start:v265Clamp(Number(active.selectionStart??len),0,len),end:v265Clamp(Number(active.selectionEnd??active.selectionStart??len),0,len)};
}
function v265FocusLibrarySearch(value,selectionStart,selectionEnd){
  if(String(S.view||'')!=='library')return;
  const next=v265VisibleLibrarySearch();if(!next)return;
  if(String(next.value)!==String(value??''))next.value=String(value??'');
  try{next.focus({preventScroll:true});}catch(_){next.focus();}
  if(typeof next.setSelectionRange==='function'){
    const len=next.value.length,s=v265Clamp(Number(selectionStart??len),0,len),e=v265Clamp(Number(selectionEnd??s),0,len);
    try{next.setSelectionRange(s,e);}catch(_){ }
  }
}
function v265RestoreLibraryFocus(snapshot){
  if(!snapshot||String(S.view||'')!=='library')return;
  const apply=()=>v265FocusLibrarySearch(snapshot.value,snapshot.start,snapshot.end);
  // Multiple passes intentionally outlive the v262/v264 post-render dock enhancers,
  // so a live Library refresh never steals the user's caret mid-word.
  requestAnimationFrame(()=>requestAnimationFrame(apply));
  setTimeout(apply,48);setTimeout(apply,130);
}
function v265SearchLibrary(value){
  const active=document.activeElement;
  const start=active?.selectionStart??String(value??'').length;
  const end=active?.selectionEnd??start;
  S.histFilters=S.histFilters||{};S.histFilters.libSearch=String(value??'');S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){ }
  // Mirror the text into every rendered Library search field immediately; the
  // expensive Library list refresh remains debounced so typing is uninterrupted.
  document.querySelectorAll('#view-root .lib-search').forEach(el=>{if(el!==active&&el.value!==String(value??''))el.value=String(value??'');});
  clearTimeout(V265_LIBRARY_SEARCH_TIMER);
  V265_LIBRARY_SEARCH_TIMER=setTimeout(()=>{
    if(String(S.view||'')!=='library')return;
    const snapshot={value:String(S.histFilters?.libSearch||''),start,end};
    render();v265RestoreLibraryFocus(snapshot);
  },V265_LIBRARY_SEARCH_DELAY);
}
function v265StatusIcon(status){
  if(status==='all'){
    try{return V225_BUTTON_ICONS.filter||V225_BUTTON_ICONS.status||'';}catch(_){return '◉';}
  }
  try{return typeof v230StatusIcon==='function'?v230StatusIcon(status):'';}catch(_){return '';}
}
function v265EnhanceNormalStatusIcons(root){
  const row=root.querySelector('.mf262-library-classic .mf262-status-row,.mf264-library-filter-dock .mf262-status-row');
  if(!row)return;
  row.querySelectorAll('button.mf262-filter-chip').forEach(btn=>{
    if(btn.querySelector('.mf265-status-icon'))return;
    const code=String(btn.getAttribute('onclick')||'');
    const match=code.match(/v262SetClassicStatus\('([^']+)'\)/);if(!match)return;
    const icon=v265StatusIcon(match[1]);if(!icon)return;
    const span=document.createElement('span');span.className='mf265-status-icon';span.setAttribute('aria-hidden','true');span.innerHTML=icon;
    btn.insertBefore(span,btn.firstChild);
  });
}
function v265EnhanceLibrary(){
  if(String(S.view||'')!=='library')return;
  const root=document.getElementById('view-root');if(!root)return;
  v265EnhanceNormalStatusIcons(root);
  // Keep original normal-mode dropdowns permanently out of layout. They remain
  // available as data controls but no longer flash for a frame after a category click.
  root.querySelectorAll('.lib-toolbar .v66-cat-filter,[data-v236-library-category-filter]').forEach(el=>el.classList.add('mf265-source-filter-hidden'));
}

/* ---------------------------------------------------------------------
   Personal Order category popover — viewport anchored, no clipping
   --------------------------------------------------------------------- */
function v265PositionOrderCategoryPanel(details){
  if(!details?.open)return;
  const panel=details.querySelector('.v237-category-filter-panel');const summary=details.querySelector('summary');if(!panel||!summary)return;
  const sr=summary.getBoundingClientRect(),vw=document.documentElement.clientWidth||innerWidth,vh=document.documentElement.clientHeight||innerHeight;
  const margin=12,width=Math.min(440,Math.max(260,vw-margin*2));
  panel.classList.add('mf265-order-category-panel');
  panel.style.position='fixed';panel.style.width=`${width}px`;panel.style.maxWidth=`${width}px`;panel.style.right='auto';panel.style.bottom='auto';panel.style.transform='none';panel.style.margin='0';
  let left=v265Clamp(sr.left,margin,Math.max(margin,vw-width-margin));
  // Prefer alignment to the summary's right edge on wide screens.
  if(vw>680)left=v265Clamp(sr.right-width,margin,Math.max(margin,vw-width-margin));
  panel.style.left=`${Math.round(left)}px`;
  const maxH=Math.max(220,Math.min(620,vh-margin*2));panel.style.maxHeight=`${Math.round(maxH)}px`;
  // Measure after width is applied; open upward when there is not enough space below.
  const natural=Math.min(panel.scrollHeight,maxH);let top=sr.bottom+7;
  if(top+natural>vh-margin)top=Math.max(margin,sr.top-natural-7);
  panel.style.top=`${Math.round(top)}px`;
}
function v265EnhanceOrder(){
  if(String(S.view||'')!=='order')return;const root=document.getElementById('view-root');if(!root)return;
  const filters=root.querySelectorAll('.v225-order-filter-category .v237-category-filter,.v138-order-view .v237-category-filter');
  filters.forEach(details=>{
    details.classList.add('mf265-order-category-filter');
    if(details.dataset.mf265Bound)return;details.dataset.mf265Bound='1';
    details.addEventListener('toggle',()=>{if(details.open)v265AfterPaint(()=>v265PositionOrderCategoryPanel(details));});
  });
  filters.forEach(v265PositionOrderCategoryPanel);
  if(!V265_ORDER_REPOSITION_BOUND){
    V265_ORDER_REPOSITION_BOUND=true;
    const reposition=()=>document.querySelectorAll('.mf265-order-category-filter[open]').forEach(v265PositionOrderCategoryPanel);
    window.addEventListener('resize',reposition,{passive:true});window.addEventListener('scroll',reposition,{passive:true,capture:true});
  }
}

/* ---------------------------------------------------------------------
   Today's Balance — clean Dashboard insight, intentionally non-clickable
   --------------------------------------------------------------------- */
function v265Guidance(todayStatus,overallStatus,cat){
  let raw='';try{raw=v43BalanceGuidance(cat,todayStatus)||'';}catch(_){raw='';}
  const clean=String(raw).replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim().replace(/^(Balanced guidance|Catch-up guidance|Cool-down guidance)\s*:\s*/i,'');
  let label='Balanced rotation';
  if(todayStatus==='overused')label='Ease off today';
  else if(todayStatus==='due'||todayStatus==='neglected'||overallStatus==='due'||overallStatus==='neglected')label='Needs attention';
  else if(todayStatus==='healthy'&&overallStatus==='healthy')label='On track';
  return {label,clean:clean||'Keep this category in your normal rotation.'};
}
function v265BalanceMarkup(){
  const cats=(typeof v186ScopeCategories==='function'?v186ScopeCategories('todayBalance'):S.categories.filter(c=>c.enabled)),today=todaysSessions();
  if(!cats.length)return '<div class="mf265-balance-empty">No categories are enabled for Today’s Balance.</div>';
  const labelMap={healthy:'Healthy',neglected:'Neglected',overused:'Overused',due:'Due'};
  const rows=cats.map(cat=>{
    const amt=today.filter(s=>s.categoryId===cat.id&&s.status!=='skipped').reduce((a,s)=>a+(Number(s.actualAmount)||0),0);
    const todayStatus=categoryStatus(cat),overallStatus=overallCategoryStatus(cat),target=Math.max(1,Number(cat.target)||1),pct=v265Clamp(Math.round(amt/target*100),0,100),g=v265Guidance(todayStatus,overallStatus,cat);
    return `<article class="mf265-balance-row">
      <div class="mf265-balance-identity"><span class="mf265-balance-cat" style="--mf265-cat:${v265Esc(cat.color||'var(--flow)')}">${v144CategoryIconHtml(cat)}</span><span><b>${v265Esc(cat.name)}</b><small>${amt} ${v265Esc(unitLabel(cat.unit,amt))} today</small></span></div>
      <div class="mf265-balance-health"><span class="status-${todayStatus}">Today · ${labelMap[todayStatus]||todayStatus}</span><span class="status-${overallStatus}">Overall · ${labelMap[overallStatus]||overallStatus}</span></div>
      <div class="mf265-balance-progress"><span><b>${amt} / ${target}</b><small>${pct}%</small></span><i><u style="width:${pct}%"></u></i></div>
      <div class="mf265-balance-guidance"><b>${v265Esc(g.label)}</b><span>${v265Esc(g.clean)}</span></div>
    </article>`;
  }).join('');
  const consumed=today.filter(s=>s.status!=='skipped'),units=consumed.reduce((a,s)=>a+(Number(s.actualAmount)||0),0),minutes=consumed.reduce((a,s)=>a+(Number(s.minutes)||0),0),streak=computeDayStreak(),unrated=(S.library||[]).filter(i=>!(Number(i.rating)>0)).length;
  return `<div class="mf265-balance-list">${rows}</div><div class="mf265-balance-summary">
    <div><small>Consumed today</small><b>${units.toLocaleString()}</b><span>units</span></div>
    <div><small>Time invested</small><b>${fmtMinutes(minutes)}</b><span>today</span></div>
    <div><small>Current streak</small><b>${streak}</b><span>days</span></div>
    <div><small>Rating queue</small><b>${unrated.toLocaleString()}</b><span>unrated titles</span></div>
  </div>`;
}
function v265EnhanceBalance(){
  if(String(S.view||'')!=='dashboard')return;
  const existing=document.querySelector('.mf264-balance-card,.v261-balance-card');if(!existing)return;
  const head=existing.previousElementSibling;const label=head?.querySelector('.section-label');
  if(label)label.innerHTML='<span class="mf265-balance-heading"><span class="mf265-balance-kicker">Daily rotation</span><b>Today’s Balance</b><small>A clear snapshot of category health, progress and what needs attention next.</small></span>';
  existing.className=[...existing.classList].filter(c=>!/^mf264-balance/.test(c)&&!/^v261-balance/.test(c)).join(' ');
  existing.classList.add('mf265-balance-card');existing.innerHTML=v265BalanceMarkup();existing.dataset.v265Balance='1';
}

/* ---------------------------------------------------------------------
   Settings — morph content in place, no page flash / scroll reset
   --------------------------------------------------------------------- */
function v265NodeKey(node){
  if(!node||node.nodeType!==1)return '';
  return node.id||node.getAttribute('data-settings-target')||node.getAttribute('data-v230-surface')||'';
}
function v265SyncAttrs(current,next){
  const nextNames=new Set([...next.attributes].map(a=>a.name));
  // Preserve v265 runtime markers while morphing. They are intentionally not
  // part of renderSettings() markup and their removal would make an in-place
  // update look like a rebuilt Settings page to runtime state/tests.
  [...current.attributes].forEach(a=>{if(!nextNames.has(a.name)&&!a.name.startsWith('data-v265-'))current.removeAttribute(a.name);});
  [...next.attributes].forEach(a=>{if(current.getAttribute(a.name)!==a.value)current.setAttribute(a.name,a.value);});
  const tag=current.tagName;
  const focused=document.activeElement===current;
  if(tag==='INPUT'){
    if(current.type==='checkbox'||current.type==='radio')current.checked=next.checked;
    else if(!focused&&current.value!==next.value)current.value=next.value;
  }else if(tag==='TEXTAREA'&&!focused){if(current.value!==next.value)current.value=next.value;}
  else if(tag==='SELECT'&&!focused){if(current.value!==next.value)current.value=next.value;}
}
function v265Morph(current,next){
  if(!current||!next)return;
  if(current.nodeType!==next.nodeType||(current.nodeType===1&&current.tagName!==next.tagName)){
    current.replaceWith(next.cloneNode(true));return;
  }
  if(current.nodeType===3){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
  if(current.nodeType!==1)return;
  v265SyncAttrs(current,next);
  const oldChildren=[...current.childNodes],newChildren=[...next.childNodes];
  let i=0;
  while(i<newChildren.length){
    const wanted=newChildren[i];let have=current.childNodes[i];const key=v265NodeKey(wanted);
    if(key&&(!have||v265NodeKey(have)!==key)){
      const found=[...current.childNodes].slice(i+1).find(n=>v265NodeKey(n)===key);
      if(found){current.insertBefore(found,have||null);have=found;}
    }
    if(!have){current.appendChild(wanted.cloneNode(true));}
    else v265Morph(have,wanted);
    i++;
  }
  while(current.childNodes.length>newChildren.length)current.removeChild(current.lastChild);
}
function v265RefreshSidebarNav(){
  const nav=document.querySelector('.sidebar .nav');
  if(nav&&typeof v161VisibleNavItems==='function'){
    const focusInside=nav.contains(document.activeElement);
    nav.innerHTML=v161VisibleNavItems().map(n=>`<div class="nav-item ${S.view===n.id?'active':''}" data-view="${v265Esc(String(n.id))}" onclick="App.setView('${v265Esc(String(n.id))}')">${ICONS[n.id]}<span>${v265Esc(n.label)}</span></div>`).join('');
    if(focusInside)nav.querySelector('.nav-item.active')?.focus?.();
  }
  const mobile=document.querySelector('.mobile-tabbar');if(mobile)mobile.innerHTML=renderMobileTabs();
}
function v265PatchSettings(){
  if(V265_SETTINGS_PATCHING)return;
  const root=document.querySelector('#view-root>.fade-in');const current=root?.querySelector('.v221-settings-page');if(!root||!current)return false;
  V265_SETTINGS_PATCHING=true;
  try{
    const active=document.activeElement,activeId=active?.id||'',selection=active&&typeof active.selectionStart==='number'?{start:active.selectionStart,end:active.selectionEnd}:null;
    const temp=document.createElement('div');const markup=typeof v221RenderSettingsPage==='function'?v221RenderSettingsPage():renderSettings();temp.innerHTML=String(markup||'');const next=temp.querySelector('.v221-settings-page')||temp.firstElementChild;if(!next)return false;
    v265Morph(current,next);
    v265RefreshSidebarNav();
    try{v219RunPageEnhancers('settings');}catch(_){ }
    v265EnhanceSidebar();
    if(activeId){const again=document.getElementById(activeId);if(again&&again!==document.activeElement){try{again.focus({preventScroll:true});}catch(_){again.focus();}if(selection&&typeof again.setSelectionRange==='function'){try{again.setSelectionRange(selection.start,selection.end);}catch(_){ }}}}
    return true;
  }finally{V265_SETTINGS_PATCHING=false;}
}

/* ---------------------------------------------------------------------
   Theme-aware collapsible sidebar
   --------------------------------------------------------------------- */
function v265SidebarCollapsed(){return !!S.settings?.sidebarCollapsed;}
function v265ApplySidebarState(){
  const collapsed=v265SidebarCollapsed();document.body.classList.toggle('mf265-sidebar-collapsed',collapsed);
  const btn=document.querySelector('.mf265-sidebar-toggle');if(btn){btn.setAttribute('aria-expanded',String(!collapsed));btn.title=collapsed?'Expand menu':'Collapse menu';btn.innerHTML=collapsed?'›':'‹';}
}
function v265EnhanceSidebar(){
  const sidebar=document.querySelector('.sidebar');if(!sidebar)return;
  sidebar.classList.add('mf265-sidebar');
  const brand=sidebar.querySelector('.brand');
  if(brand&&!sidebar.querySelector('.mf265-sidebar-toggle')){
    const btn=document.createElement('button');btn.type='button';btn.className='mf265-sidebar-toggle';btn.setAttribute('onclick','App.v265ToggleSidebar()');btn.setAttribute('aria-label','Expand or collapse MediaFlow menu');brand.appendChild(btn);
  }
  sidebar.querySelectorAll('.nav-item').forEach(item=>{const label=item.querySelector('span')?.textContent?.trim();if(label)item.title=label;});
  v265ApplySidebarState();
}
function v265ToggleSidebar(){
  S.settings=S.settings||{};S.settings.sidebarCollapsed=!v265SidebarCollapsed();
  try{persistSettings();}catch(_){ }
  v265ApplySidebarState();
}

/* ---------------------------------------------------------------------
   Render integration
   --------------------------------------------------------------------- */
function v265UpdateVersionChrome(){
  document.querySelectorAll('.v260-topbar-chip').forEach(chip=>{if(/^v\d+$/i.test((chip.textContent||'').trim()))chip.textContent='v265';});
  document.querySelectorAll('.v260-topbar-copy span').forEach(span=>{if(/MediaFlow v\d+/i.test(span.textContent||''))span.textContent=(span.textContent||'').replace(/MediaFlow v\d+/ig,'MediaFlow v265');});
}
function v265PostRender(){
  try{v265EnhanceSidebar();v265EnhanceLibrary();v265EnhanceOrder();v265EnhanceBalance();v265UpdateVersionChrome();}catch(err){console.error('MediaFlow v265 enhancement failed',err);}
}

const v265RenderBase=render;
render=function(){
  const libraryFocus=v265CaptureLibraryFocus();
  // Settings mutations should update controls dynamically instead of replacing
  // the whole page. Navigation away from Settings and modal workflows still use
  // the canonical renderer.
  if(String(S.view||'')==='settings'&&!S.modal&&document.querySelector('#view-root .v221-settings-page')){
    if(v265PatchSettings()){v265AfterPaint(v265PostRender);return;}
  }
  const out=v265RenderBase.apply(this,arguments);
  v265AfterPaint(v265PostRender);
  v265RestoreLibraryFocus(libraryFocus);
  return out;
};

const v265SearchLibraryBase=App.searchLibrary;
App.searchLibrary=v265SearchLibrary;
Object.assign(App,{v265DeleteTitleFromDetails,v265ToggleSidebar,v265EnhanceLibrary,v265EnhanceOrder,v265EnhanceBalance});

try{
  MediaFlowRuntime.registerPageEnhancer('library',()=>requestAnimationFrame(v265EnhanceLibrary));
  MediaFlowRuntime.registerPageEnhancer('dashboard',()=>requestAnimationFrame(v265EnhanceBalance));
  MediaFlowRuntime.registerPageEnhancer('order',()=>requestAnimationFrame(v265EnhanceOrder));
  MediaFlowRuntime.registerPageEnhancer('settings',()=>requestAnimationFrame(v265EnhanceSidebar));
}catch(_){ }

window.MediaFlowV265={version:265,focus:'UX stability, title deletion, clean Balance, dynamic Settings and collapsible sidebar'};
MediaFlowRuntime.version=V265_RUNTIME_VERSION;
v265AfterPaint(v265PostRender);
})();
