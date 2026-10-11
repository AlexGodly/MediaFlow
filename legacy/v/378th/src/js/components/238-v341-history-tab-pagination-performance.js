/* MediaFlow v341 — reliable History tabs, optimized Recently Viewed, and
   visible/filterable Library History pagination. Presentation-only extension.
   Existing activity/session entries, restore actions, cloud/XP and schemas stay intact. */
const V341_RELEASE=341;
// v261 intentionally keeps these helpers private inside its own IIFE. The
// v340 Recently Viewed renderer called them as if they were global, throwing
// ReferenceError and preventing the tab from switching. Supply public-scope
// equivalents so v340's renderer works without touching v261 internals.
function v261CategoryOptions(selected){
  return `<option value="all">All media</option>${(S.categories||[]).map(c=>`<option value="${escapeHtml(String(c.id))}" ${String(selected)===String(c.id)?'selected':''}>${escapeHtml(String(c.name||''))}</option>`).join('')}`;
}
function v261HistoryPager(kind,total){
  const st=kind==='recent'?v340RecentState():(S.v261HistoryUI?.[kind]||{});
  const size=Math.max(10,Math.min(200,Number(st.pageSize)||50));
  const pages=Math.max(1,Math.ceil(total/size));
  st.page=Math.max(0,Math.min(pages-1,Number(st.page)||0));
  if(pages<=1)return '';
  return `<nav class="v261-history-pager" aria-label="${escapeHtml(String(kind))} pages"><button type="button" class="btn btn-sm" ${st.page<=0?'disabled':''} onclick="App.v261SetHistoryPage('${kind}',${st.page-1})">Previous</button><span>Page ${st.page+1} of ${pages} · ${total.toLocaleString()}</span><button type="button" class="btn btn-sm" ${st.page>=pages-1?'disabled':''} onclick="App.v261SetHistoryPage('${kind}',${st.page+1})">Next</button></nav>`;
}

const V341_RECENT_CACHE={sessions:null,length:-1,first:'',last:'',lib:null,libLen:-1,libToken:-1,revision:-1,rows:null};
function v341InvalidateRecentCache(){V341_RECENT_CACHE.rows=null;}
const v341InvalidateHistoryBase=v270InvalidateHistoryCache;
v270InvalidateHistoryCache=function(){v341InvalidateRecentCache();return v341InvalidateHistoryBase.apply(this,arguments);};
const v341InvalidateLibraryBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){v341InvalidateRecentCache();return v341InvalidateLibraryBase.apply(this,arguments);};
function v341RecentSource(){
  const sessions=S.sessions||[],lib=S.library||[],len=sessions.length;
  const first=typeof v270SessionStamp==='function'?v270SessionStamp(sessions[0]):String(sessions[0]?.id||'');
  const last=typeof v270SessionStamp==='function'?v270SessionStamp(sessions[len-1]):String(sessions[len-1]?.id||'');
  const revision=Number(V270_HISTORY_SORT_CACHE?.revision)||0;
  const libToken=Number(globalThis.V53_LIB?.libraryToken)||0;
  return {sessions,len,first,last,lib,libLen:lib.length,libToken,revision};
}
function v341RecentSourceMatches(x){const c=V341_RECENT_CACHE;return c.rows&&c.sessions===x.sessions&&c.length===x.len&&c.first===x.first&&c.last===x.last&&c.lib===x.lib&&c.libLen===x.libLen&&c.libToken===x.libToken&&c.revision===x.revision;}
function v341RecentIndexedRows(){
  const token=v341RecentSource();if(v341RecentSourceMatches(token))return V341_RECENT_CACHE.rows;
  const sorted=typeof v270SortedSessions==='function'?v270SortedSessions():(S.sessions||[]).slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  const idx=typeof v241EnsureLibraryIndex==='function'?v241EnsureLibraryIndex():{byId:new Map((S.library||[]).filter(Boolean).map(x=>[String(x.id),x]))};
  const rows=[];
  for(const session of sorted){
    if(!session||session.status==='skipped')continue;
    const titles=Array.isArray(session.titles)&&session.titles.length?session.titles.filter(x=>x&&(x.title||x.libraryId)):[];
    if(!titles.length&&(session.libraryId||cleanTitle(session.title||session.libraryTitle||'')))titles.push({title:session.title||session.libraryTitle||'',libraryId:session.libraryId||null,qty:session.actualAmount});
    if(!titles.length)continue;
    const qtyTotal=titles.reduce((acc,row)=>acc+Math.max(0,Number(row.qty)||0),0);
    for(const row of titles){
      const found=v340ResolveRecentTitle(session,row,idx);if(!found)continue;
      const timestamp=v340RecentTimestamp(session,row);
      if(!timestamp||!Number.isFinite(timestamp))continue;
      const qty=Math.max(0,Number(row.qty)||0);
      const minutes=Math.max(0,Number(session.minutes)||0)*(qtyTotal?qty/qtyTotal:1/Math.max(1,titles.length));
      rows.push({...found,session,row,timestamp,qty,minutes,
        date:typeof v331EventDate==='function'?v331EventDate(session,row):new Date(timestamp)});
    }
  }
  // Per-title loggedAt can differ from its parent session timestamp. Sort
  // BEFORE deduplication so the actually newest title activity always wins.
  rows.sort((a,b)=>b.timestamp-a.timestamp);
  const seen=new Set(),unique=[];
  for(const row of rows){if(seen.has(row.key))continue;seen.add(row.key);unique.push(row);}
  Object.assign(V341_RECENT_CACHE,{sessions:token.sessions,length:token.len,first:token.first,last:token.last,lib:token.lib,libLen:token.libLen,libToken:token.libToken,revision:token.revision,rows:unique});
  return unique;
}
// The v340 renderer calls this binding; preserve all filters and page structure.
v340RecentRows=function(){
  const state=v340RecentState(),now=Date.now(),days={'7':7,'30':30,'365':365}[String(state.period)]||0;
  const query=String(state.query||'').trim().toLocaleLowerCase(),category=String(state.category||'all');
  const all=v341RecentIndexedRows();
  if(!query&&!days&&category==='all')return all;
  return all.filter(row=>(!days||now-row.timestamp<=days*86400000)&&
    (category==='all'||row.categoryId===category)&&
    (!query||row.title.toLocaleLowerCase().includes(query)));
};

function v341HistoryBodyRefresh({resetScroll=false,focusSearch=false}={}){
  if(String(S.view||'')!=='history')return false;
  const target=document.querySelector('.v260-history-page .v260-history-body');if(!target)return false;
  const tab=v260HistoryTab();
  try{
    const search=focusSearch?target.querySelector('.v340-recent-toolbar input[type="search"]'):null;
    const start=search?.selectionStart??null,end=search?.selectionEnd??null;
    const html=v260HistoryBody(tab);
    target.innerHTML=html;
    target.dataset.historyView=tab;
    document.querySelectorAll('.v260-history-tabs [role="tab"]').forEach(el=>{
      const code=String(el.getAttribute('onclick')||'');
      const active=code.includes(`'${tab}'`);
      el.classList.toggle('active',active);
      el.setAttribute('aria-selected',String(active));
      el.tabIndex=active?0:-1;
    });
    if(focusSearch){
      const next=target.querySelector('.v340-recent-toolbar input[type="search"]');
      if(next){next.focus({preventScroll:true});try{if(start!==null)next.setSelectionRange(start,end);}catch(_){}}
    }
    if(resetScroll){
      const viewTop=document.querySelector('.v260-history-page');
      if(viewTop?.scrollIntoView)viewTop.scrollIntoView({block:'start',behavior:'instant'});
    }
    if(typeof v260SignalReact==='function')queueMicrotask(()=>{try{v260SignalReact();}catch(_){}});
    return true;
  }catch(error){console.error('MediaFlow v341 History panel refresh failed',error);return false;}
}
// In v340 clicking a History tab initiated a complete application render.
// That can stall with large libraries/histories or leave the old tab selected
// if another renderer fails. The tab now changes its panel in isolation.
const v341SwitchHistoryBase=App.v260SetHistoryTab;
App.v260SetHistoryTab=function(tab){
  const next=V260_HISTORY_TABS.includes(String(tab))?String(tab):'consumption';
  if(String(S.view||'')==='history'&&document.querySelector('.v260-history-page .v260-history-body')){
    const previous=S.v260HistoryTab;S.v260HistoryTab=next;
    if(v341HistoryBodyRefresh({resetScroll:true}))return;
    S.v260HistoryTab=previous;
  }
  return v341SwitchHistoryBase.apply(this,arguments);
};
const v341RecentFilterBase=App.v261SetHistoryFilter;
App.v261SetHistoryFilter=function(kind,key,value){
  if(kind==='recent'&&String(S.view)==='history'&&v260HistoryTab()==='recent'){
    const st=v340RecentState();st[key]=String(value??'');st.page=0;
    const focused=key==='query';
    if(v341HistoryBodyRefresh({focusSearch:focused}))return;
  }
  return v341RecentFilterBase.apply(this,arguments);
};
const v341RecentPageBase=App.v261SetHistoryPage;
App.v261SetHistoryPage=function(kind,page){
  if(kind==='recent'&&String(S.view)==='history'&&v260HistoryTab()==='recent'){
    v340RecentState().page=Math.max(0,Number(page)||0);
    if(v341HistoryBodyRefresh())return;
  }
  return v341RecentPageBase.apply(this,arguments);
};

/* v241 already created a 50-row Library History pager; v341 makes it a
   first-class control (search, page size, clear counts) and isolates page
   changes to the History panel, without regressing restore/edit actions. */
const V341_LIB_HISTORY={query:'',pageSize:50};
const v341LibraryPageDataBase=v241LibraryHistoryPageData;
v241LibraryHistoryPageData=function(){
  const all=Array.isArray(S.activityLog)?S.activityLog:[];
  const query=V341_LIB_HISTORY.query.trim().toLocaleLowerCase();
  const filtered=query?all.filter(x=>[x?.action,x?.detail,...(Array.isArray(x?.changes)?x.changes.map(c=>c?.title||''):[])].some(t=>String(t||'').toLocaleLowerCase().includes(query))):all;
  const size=Math.max(10,Math.min(100,Number(V341_LIB_HISTORY.pageSize)||50));
  const pages=Math.max(1,Math.ceil(filtered.length/size));
  const page=Math.max(0,Math.min(pages-1,Number(S.v241LibraryHistoryPage)||0));
  S.v241LibraryHistoryPage=page;
  return {rows:filtered.slice(page*size,page*size+size),size,pages,page,total:filtered.length,unfilteredTotal:all.length};
};
function v341LibraryHistoryToolbar(){
  const d=v241LibraryHistoryPageData();
  return `<div class="v341-lib-history-toolbar"><div class="v341-lib-history-search"><label for="v341-lib-history-query">Find changes</label><input id="v341-lib-history-query" type="search" value="${escapeHtml(V341_LIB_HISTORY.query)}" placeholder="Search action or title…" oninput="App.v341LibrarySearch(this.value)" autocomplete="off"></div><div class="v341-lib-history-size"><label for="v341-lib-history-size">Entries per page</label><select id="v341-lib-history-size" onchange="App.v341LibraryPageSize(this.value)">${[10,25,50,100].map(n=>`<option value="${n}" ${d.size===n?'selected':''}>${n}</option>`).join('')}</select></div><span class="v341-lib-history-count">${d.total.toLocaleString()} ${d.total===1?'change':'changes'}${V341_LIB_HISTORY.query?` of ${d.unfilteredTotal.toLocaleString()}`:''}</span></div>`;
}
// Keep original v241 restoration, buttons, details, XP and pagers.
const v341ActivityBase=v241ActivityHtml;
mfActivityHtml=function(){return `<div class="v341-lib-history-shell">${v341LibraryHistoryToolbar()}<div class="v341-lib-history-results">${v341ActivityBase()}</div></div>`;};
function v341LibraryPanelRefresh({keepSearch=false}={}){
  if(S.view!=='history'||v260HistoryTab()!=='library')return false;
  const host=document.querySelector('.v341-lib-history-shell');if(!host)return false;
  const previous=keepSearch?document.getElementById('v341-lib-history-query'):null;
  const start=previous?.selectionStart??null;
  const end=previous?.selectionEnd??null;
  host.innerHTML=`${v341LibraryHistoryToolbar()}<div class="v341-lib-history-results">${v341ActivityBase()}</div>`;
  if(keepSearch){const next=host.querySelector('#v341-lib-history-query');if(next){next.focus({preventScroll:true});try{next.setSelectionRange(start,end);}catch(_){}}}
  return true;
}
App.v341LibrarySearch=function(value){V341_LIB_HISTORY.query=String(value||'');S.v241LibraryHistoryPage=0;if(!v341LibraryPanelRefresh({keepSearch:true}))render();};
App.v341LibraryPageSize=function(value){V341_LIB_HISTORY.pageSize=Math.max(10,Math.min(100,Number(value)||50));S.v241LibraryHistoryPage=0;if(!v341LibraryPanelRefresh())render();};
const v341LibraryPageBase=App.v241SetLibraryHistoryPage;
App.v241SetLibraryHistoryPage=function(page){
  S.v241LibraryHistoryPage=Math.max(0,Number(page)||0);
  if(v341LibraryPanelRefresh()){
    document.querySelector('.v341-lib-history-toolbar')?.scrollIntoView?.({block:'nearest',behavior:'instant'});
    return;
  }
  return v341LibraryPageBase.apply(this,arguments);
};
MediaFlowRuntime.version=V341_RELEASE;
window.MediaFlowV341={version:341,features:['History tab activation without complete rerender','Indexed Recently Viewed','Library History search and pagination']};
