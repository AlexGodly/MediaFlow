/* ============================================================
   MediaFlow v260 — React Design System Bridge + Unified History
   ------------------------------------------------------------
   The v260 visual layer is delivered as a prebuilt GitHub Pages-ready
   release. The legacy runtime remains the data/behavior engine so every
   accumulated MediaFlow feature stays compatible, while React owns the
   new application chrome and the design-system source is shipped under
   src-v260/. This runtime module supplies the bridge, unified History
   page, and progressive-enhancement hooks used by the v260 React shell.
   ============================================================ */
const V260_RUNTIME_VERSION=260;
const V260_HISTORY_TABS=['consumption','recent','ratings','library'];
const V260_HISTORY_LABELS={consumption:'Consumption history',recent:'Recently viewed',ratings:'Ratings',library:'Library'};

function v260EscapeAttr(value){return escapeHtml(String(value==null?'':value));}
function v260Now(){return Date.now();}
function v260Array(value){return Array.isArray(value)?value:[];}
function v260HistoryTab(){
  const raw=String(S.v260HistoryTab||'consumption');
  return V260_HISTORY_TABS.includes(raw)?raw:'consumption';
}
function v260SetHistoryTab(tab){
  const next=V260_HISTORY_TABS.includes(String(tab))?String(tab):'consumption';
  S.v260HistoryTab=next;
  S.view='history';
  render();
  try{window.scrollTo({top:0,behavior:'smooth'});}catch(_){window.scrollTo(0,0);}
}
function v260HistoryTabsHtml(active=v260HistoryTab()){
  const icon={
    consumption:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/></svg>',
    recent:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v5h5"/></svg>',
    ratings:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9Z"/></svg>',
    library:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22Zm16 0A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22Z"/></svg>'
  };
  return `<div class="v260-history-tabs" role="tablist" aria-label="History views">${V260_HISTORY_TABS.map(tab=>`<button type="button" role="tab" aria-selected="${active===tab?'true':'false'}" class="v260-history-tab ${active===tab?'active':''}" onclick="App.v260SetHistoryTab('${tab}')">${icon[tab]}<span>${V260_HISTORY_LABELS[tab]}</span></button>`).join('')}</div>`;
}
function v260StripLegacyHead(html){
  let h=String(html||'');
  h=h.replace(/<div class="view-head[^>]*>[\s\S]*?<\/div>\s*(?=<div class="lib-toolbar|<div class="card|<div class="v)/, '');
  h=h.replace(/<div class="view-head">[\s\S]*?<\/div>\s*(?=<div)/,'');
  return h;
}
function v260LibraryItemForSession(session){
  if(!session)return null;
  if(session.libraryId){const direct=S.library.find(i=>String(i.id)===String(session.libraryId));if(direct)return direct;}
  const st=cleanTitle(session.title||session.libraryTitle||'').toLocaleLowerCase();
  if(st)return S.library.find(i=>cleanTitle(i.title).toLocaleLowerCase()===st)||null;
  return null;
}
function v260ItemCover(item){return String(item?.coverUrl||item?.cover||item?.imageUrl||'').trim();}
function v260ItemTitle(item,session){return cleanTitle(item?.title||session?.title||session?.libraryTitle||getCategory(session?.categoryId)?.name||'Untitled');}
function v260DateKey(ts){const d=new Date(Number(ts)||v260Now());return d.toISOString().slice(0,10);}
function v260DateLabel(ts){
  const d=new Date(Number(ts)||v260Now()),now=new Date(),today=v260DateKey(now),key=v260DateKey(d),yesterday=v260DateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-1));
  if(key===today)return 'Today';if(key===yesterday)return 'Yesterday';
  return d.toLocaleDateString(undefined,{month:'long',day:'numeric',year:d.getFullYear()===now.getFullYear()?undefined:'numeric'});
}
function v260TimeLabel(ts){return new Date(Number(ts)||v260Now()).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});}
function v260TimeBucket(ts){const h=new Date(Number(ts)||v260Now()).getHours();if(h<6)return ['Night','☾'];if(h<12)return ['Morning','☀'];if(h<18)return ['Afternoon','◐'];return ['Evening','◒'];}
function v260MinutesOf(session){return Math.max(0,Number(session?.minutes)||0);}
function v260ConsumptionInsights(){
  const all=v260Array(S.sessions).filter(s=>s&&s.status!=='skipped');
  const weekStart=new Date();weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-6);
  const week=all.filter(s=>(Number(s.timestamp)||0)>=weekStart.getTime());
  const minutes=week.reduce((a,s)=>a+v260MinutesOf(s),0);
  const days=new Set(week.map(s=>s.date||v260DateKey(s.timestamp))).size;
  const count=week.reduce((a,s)=>a+Math.max(0,Number(s.actualAmount)||0),0);
  const catMap=new Map();week.forEach(s=>{const c=getCategory(s.categoryId);const key=c?.id||'other';const prev=catMap.get(key)||{name:c?.name||'Other',minutes:0,color:c?.color||'var(--flow)'};prev.minutes+=v260MinutesOf(s);catMap.set(key,prev);});
  const most=[...catMap.values()].sort((a,b)=>b.minutes-a.minutes)[0];
  const longest=week.slice().sort((a,b)=>v260MinutesOf(b)-v260MinutesOf(a))[0];
  return `<section class="v260-insight-panel"><div class="v260-insight-intro"><div class="v260-insight-icon">◷</div><div><span class="v260-kicker">Last 7 days</span><strong>${fmtMinutes(minutes)}</strong><small>${week.length.toLocaleString()} logs · ${days} active ${days===1?'day':'days'}</small></div></div><div class="v260-insight-grid"><div><span>Consumed</span><b>${count.toLocaleString()}</b><small>tracked units</small></div><div><span>Average / active day</span><b>${days?fmtMinutes(Math.round(minutes/days)):'0m'}</b><small>${days?'based on active days':'no activity yet'}</small></div><div><span>Most watched</span><b>${escapeHtml(most?.name||'—')}</b><small>${most?fmtMinutes(most.minutes):'No data yet'}</small></div><div><span>Longest log</span><b>${longest?fmtMinutes(v260MinutesOf(longest)):'—'}</b><small>${longest?escapeHtml(v260ItemTitle(v260LibraryItemForSession(longest),longest)):'No data yet'}</small></div></div></section>`;
}
function v260RecentHtml(){
  const sessions=v260Array(S.sessions).filter(s=>s&&s.status!=='skipped').slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  if(!sessions.length)return '<div class="v260-empty"><b>No recent activity yet</b><span>Logged titles will appear here automatically.</span></div>';
  const unique=[];const seen=new Set();
  for(const s of sessions){const item=v260LibraryItemForSession(s);const key=String(item?.id||cleanTitle(s.title||'')||s.id);if(seen.has(key))continue;seen.add(key);unique.push({s,item});if(unique.length>=80)break;}
  const groups=new Map();
  unique.forEach(x=>{const key=v260DateKey(x.s.timestamp);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);});
  const days=[...groups.entries()].map(([key,items])=>{const byBucket=new Map();items.forEach(x=>{const [name,symbol]=v260TimeBucket(x.s.timestamp);if(!byBucket.has(name))byBucket.set(name,{symbol,items:[]});byBucket.get(name).items.push(x);});return `<section class="v260-recent-day"><header><span class="v260-timeline-dot"></span><b>${escapeHtml(v260DateLabel(items[0]?.s.timestamp))}</b><small>${new Date(Number(items[0]?.s.timestamp)||v260Now()).toLocaleDateString(undefined,{weekday:'long'})}</small></header>${[...byBucket.entries()].map(([bucket,data])=>`<div class="v260-daypart"><div class="v260-daypart-head"><span>${data.symbol} ${bucket}</span><small>${bucket==='Night'?'12:00 AM – 5:59 AM':bucket==='Morning'?'6:00 AM – 11:59 AM':bucket==='Afternoon'?'12:00 PM – 5:59 PM':'6:00 PM – 11:59 PM'}</small></div><div class="v260-recent-grid">${data.items.map(({s,item})=>{const cover=v260ItemCover(item),cat=getCategory(s.categoryId);return `<button type="button" class="v260-recent-card" onclick="App.openSessionModal('${v260EscapeAttr(s.id)}')"><span class="v260-recent-cover">${cover?`<img src="${v260EscapeAttr(cover)}" alt="">`:`<span style="color:${cat?.color||'var(--flow)'}">${cat?v144CategoryIconHtml(cat):'◫'}</span>`}</span><span class="v260-recent-copy"><small>${escapeHtml(cat?.name||'Media')}</small><b>${escapeHtml(v260ItemTitle(item,s))}</b><em>${v260TimeLabel(s.timestamp)} · ${fmtMinutes(v260MinutesOf(s))}</em></span></button>`;}).join('')}</div></div>`).join('')}</section>`;}).join('');
  return `<div class="v260-recent-toolbar"><div><b>Recently viewed</b><span>Built from your existing MediaFlow consumption activity.</span></div><span>${unique.length.toLocaleString()} recent ${unique.length===1?'title':'titles'}</span></div><div class="v260-recent-timeline">${days}</div>`;
}
function v260RatingsHtml(){
  const rows=v260Array(S.library).filter(i=>Number(i?.rating)>0).slice().sort((a,b)=>Number(b.rating)-Number(a.rating)||cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true}));
  if(!rows.length)return '<div class="v260-empty"><b>No rated titles yet</b><span>Ratings you add to Library titles will appear here.</span></div>';
  const maxRating=Math.max(10,...rows.map(i=>Number(i.rating)||0));
  return `<div class="v260-ratings-summary"><div><span>Ratings</span><b>${rows.length.toLocaleString()}</b><small>rated Library titles</small></div><div><span>Average</span><b>${(rows.reduce((a,i)=>a+(Number(i.rating)||0),0)/rows.length).toFixed(1)}</b><small>out of ${maxRating}</small></div><div><span>Perfect scores</span><b>${rows.filter(i=>Number(i.rating)>=maxRating).length.toLocaleString()}</b><small>${maxRating}/${maxRating} ratings</small></div></div><div class="v260-ratings-list">${rows.map((item,index)=>{const cover=v260ItemCover(item),cat=getCategory(item.categoryId),rating=Number(item.rating)||0,stars=Math.max(1,Math.min(10,Math.round(rating)));return `<article class="v260-rating-row"><div class="v260-rating-rank">${String(index+1).padStart(2,'0')}</div><div class="v260-rating-cover">${cover?`<img src="${v260EscapeAttr(cover)}" alt="">`:`<span style="color:${cat?.color||'var(--flow)'}">${cat?v144CategoryIconHtml(cat):'◫'}</span>`}</div><div class="v260-rating-main"><b>${escapeHtml(cleanTitle(item.title))}</b><span>${escapeHtml(cat?.name||'Uncategorized')}${item.year?` · ${escapeHtml(item.year)}`:''}${item.status?` · ${escapeHtml(String(item.status).replace(/^./,c=>c.toUpperCase()))}`:''}</span></div><div class="v260-rating-score"><strong>${rating.toFixed(Number.isInteger(rating)?0:1)}</strong><span aria-label="${stars} out of 10">${'★'.repeat(stars)}${'☆'.repeat(Math.max(0,10-stars))}</span></div><button type="button" class="btn btn-sm" onclick="App.openLibraryModal('${v260EscapeAttr(item.id)}')">Edit</button></article>`;}).join('')}</div>`;
}
function v260HistoryBody(tab){
  if(tab==='recent')return v260RecentHtml();
  if(tab==='ratings')return v260RatingsHtml();
  if(tab==='library')return `<div class="v260-library-history-embed">${v260StripLegacyHead(v260BaseRenderLibraryHistory())}</div>`;
  return `${v260ConsumptionInsights()}<div class="v260-consumption-history">${v260StripLegacyHead(v260BaseRenderHistory())}</div>`;
}
const v260BaseRenderHistory=renderHistory;
const v260BaseRenderLibraryHistory=renderLibraryHistory;
renderHistory=function(){
  const tab=v260HistoryTab();
  return `<div class="v260-history-page"><div class="v260-page-hero"><div><span class="v260-kicker">Activity archive</span><h1>History</h1><p>Consumption, recently viewed titles, ratings and Library changes in one place.</p></div><div class="v260-history-count"><b>${(S.sessions||[]).length.toLocaleString()}</b><span>consumption logs</span></div></div>${v260HistoryTabsHtml(tab)}<div class="v260-history-body" data-history-view="${tab}">${v260HistoryBody(tab)}</div></div>`;
};
renderLibraryHistory=function(){S.v260HistoryTab='library';S.view='history';return renderHistory();};

/* Navigation: Library History is now a History tab instead of a second page. */
const v260BaseVisibleNavItems=v161VisibleNavItems;
v161VisibleNavItems=function(){return v260BaseVisibleNavItems().filter(n=>n.id!=='libraryhistory').map(n=>n.id==='history'?Object.assign({},n,{label:'History'}):n);};
const v260BaseSetView=App.setView;
App.setView=function(view){
  const requested=String(view||'');
  if(requested==='libraryhistory'){S.v260HistoryTab='library';return v260BaseSetView('history');}
  return v260BaseSetView(requested);
};
const v260BaseMobileNav=App.mobileNav;
App.mobileNav=function(view){if(String(view)==='libraryhistory'){S.v260HistoryTab='library';return v260BaseMobileNav('history');}return v260BaseMobileNav(view);};

function v260EnsureReactHost(){
  const main=document.querySelector('.main');if(!main)return;
  let host=document.getElementById('v260-react-host');
  if(!host){
    host=document.createElement('div');host.id='v260-react-host';host.className='v260-react-host';
    const container=main.querySelector('.container');main.insertBefore(host,container||main.firstChild);
    const page=String(S.view||'dashboard').replace(/^./,c=>c.toUpperCase());
    host.innerHTML=`<header class="v260-topbar v260-topbar-fallback"><div class="v260-topbar-main"><div class="v260-topbar-mark">✦</div><div class="v260-topbar-copy"><b>${escapeHtml(page)}</b><span>MediaFlow v260 · professional design system</span></div></div><div class="v260-topbar-actions"><span class="v260-topbar-chip">v260</span><button type="button" class="btn btn-sm" onclick="App.syncNow?.()">Sync Now</button></div></header>`;
  }
}
function v260SignalReact(){
  v260EnsureReactHost();
  const view=String(S.view||'dashboard');
  const fallback=document.querySelector('.v260-topbar-fallback');
  if(fallback){
    const labels={dashboard:['Dashboard','Your rotation, logging and daily focus'],library:['Library','Browse, organize and manage your media'],history:['History','Consumption, recent activity, ratings and Library changes'],batch:['Batch Log','Log multiple titles in one focused workflow'],stats:['Statistics','Patterns, progress and long-term consumption'],profile:['Account','Profile, identity and account preferences'],settings:['Settings','Customize MediaFlow to fit your workflow'],order:['Personal Order','Shape your own title priority order'],oldsystem:['Old System','Legacy scheduler views and records']};
    const meta=labels[view]||[view.replace(/^./,c=>c.toUpperCase()),'MediaFlow v260'];
    const b=fallback.querySelector('.v260-topbar-copy b'),span=fallback.querySelector('.v260-topbar-copy span');if(b)b.textContent=meta[0];if(span)span.textContent=meta[1];
  }
  try{window.dispatchEvent(new CustomEvent('mediaflow:v260-update',{detail:{view,historyTab:v260HistoryTab(),theme:document.documentElement.getAttribute('data-theme')||'dark'}}));}catch(_){}
}
const v260BaseRender=render;
render=function(){const out=v260BaseRender.apply(this,arguments);queueMicrotask(v260SignalReact);return out;};
const v260BaseRenderShell=renderShell;
renderShell=function(){const out=v260BaseRenderShell.apply(this,arguments);v260SignalReact();return out;};

/* Stable bridge consumed by the prebuilt React shell. */
window.MediaFlowV260Bridge={
  version:260,
  getView:()=>String(S.view||'dashboard'),
  getHistoryTab:()=>v260HistoryTab(),
  getTheme:()=>document.documentElement.getAttribute('data-theme')||'dark',
  setView:(view)=>App.setView(view),
  setHistoryTab:(tab)=>v260SetHistoryTab(tab),
  syncNow:()=>App.syncNow?.(),
  openSettings:()=>App.setView('settings'),
  openProfile:()=>App.openProfile?.(),
  getStats:()=>({library:(S.library||[]).length,sessions:(S.sessions||[]).length,streak:computeDayStreak?.()||0})
};

/* Design-system metadata / release audit. */
function v260ApplyDesignMetadata(){
  document.documentElement.setAttribute('data-mediaflow-generation','v260-react');
  document.body?.classList?.add('v260-redesign');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{v260ApplyDesignMetadata();v260SignalReact();},{once:true});else{v260ApplyDesignMetadata();v260SignalReact();}

/* Persistence manifest: UI change only; data schemas intentionally remain stable. */
const v260BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v260BackupManifestBase.apply(this,arguments);
  manifest.includes=Object.assign({},manifest.includes||{},{reactDesignSystemV260:true,unifiedHistoryV260:true,dynamicThemesV260:true,zeroConfigStaticBuildV260:true});
  manifest.v260={uiGeneration:'React + TypeScript + Tailwind + Vite design system',unifiedHistoryTabs:V260_HISTORY_TABS.slice(),dynamicThemesPreserved:true,cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4};
  return manifest;
};

Object.assign(App,{v260SetHistoryTab,v260HistoryTab:()=>v260HistoryTab(),v260HistoryTabs:()=>V260_HISTORY_TABS.slice(),v260SignalReact});
MediaFlowRuntime.version=V260_RUNTIME_VERSION;
