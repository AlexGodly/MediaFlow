/* MediaFlow v340 — Consumption History pager icons + Recently Viewed title cards.
   Presentation-only: session IDs, titles[], per-title timestamps, XP, history,
   editing, exports and cloud state remain unchanged. No schema migration. */

const V340_RUNTIME_VERSION=340;
const V340_WEEK_ICON_LEFT=`<svg class="v340-week-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M7.5 2.5v4M16.5 2.5v4M3.5 9h17M13.5 15.1h-7m0 0 2.5-2.5m-2.5 2.5 2.5 2.5"/></svg>`;
const V340_WEEK_ICON_RIGHT=`<svg class="v340-week-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M7.5 2.5v4M16.5 2.5v4M3.5 9h17M7.5 15.1h7m0 0-2.5-2.5m2.5 2.5-2.5 2.5"/></svg>`;
const V340_EDIT_ICON=`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 5 3 3M4 20l4-.7L19 8.3a2.1 2.1 0 0 0-3-3L5 16.3 4 20Z"/></svg>`;
function v340Esc(value){return escapeHtml(String(value==null?'':value));}
function v340WeekPagination(html){
  return String(html||'').replace(/<nav\b[^>]*class="mf269-week-pager"[\s\S]*?<\/nav>/g, nav=>
    nav.replace(/(<button\b[^>]*)(>)←\s*Newer weeks<\/button>/,(_all,open,close)=>`${open} data-v225-iconified="1" data-v340-week-nav="newer"${close}${V340_WEEK_ICON_LEFT}<span>Newer weeks</span></button>`)
       .replace(/(<button\b[^>]*)(>)Older weeks\s*→<\/button>/,(_all,open,close)=>`${open} data-v225-iconified="1" data-v340-week-nav="older"${close}<span>Older weeks</span>${V340_WEEK_ICON_RIGHT}</button>`)
  );
}

// Existing v261 Recent View deduplicates by session, losing named title rows.
// Rebuild it as one recent entry PER DISTINCT NAMED TITLE (not per category
// and not per repeated log). Original session IDs remain the edit targets.
function v340RecentState(){
  S.v261HistoryUI=S.v261HistoryUI||{};
  const state=S.v261HistoryUI.recent||(S.v261HistoryUI.recent={query:'',category:'all',period:'all',rating:'all',year:'all',sort:'recent',page:0,pageSize:50});
  return state;
}
function v340RecentTimestamp(session,row){
  return (typeof v331ValidTimestamp==='function'&&v331ValidTimestamp(row?.loggedAt))||Number(session?.timestamp)||0;
}
function v340LocalDateKey(date){
  const d=date instanceof Date?date:new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function v340RecentDayLabel(date){
  const d=date instanceof Date?date:new Date(date),today=new Date(),yesterday=new Date(today.getFullYear(),today.getMonth(),today.getDate()-1);
  if(v340LocalDateKey(d)===v340LocalDateKey(today))return 'Today';
  if(v340LocalDateKey(d)===v340LocalDateKey(yesterday))return 'Yesterday';
  return d.toLocaleDateString(undefined,{month:'long',day:'numeric',year:d.getFullYear()===today.getFullYear()?undefined:'numeric'});
}
function v340ResolveRecentTitle(session,row,libraryIndex){
  const id=String(row?.libraryId||(!Array.isArray(session?.titles)||session.titles.length===1?session?.libraryId:'')||'');
  let item=id?(libraryIndex.byId?.get(id)||null):null;
  const title=cleanTitle(row?.title||item?.title||session?.title||session?.libraryTitle||'').trim();
  if(!item&&title&&typeof v270LibraryByTitle==='function')item=v270LibraryByTitle(title,session?.categoryId||'');
  const displayTitle=cleanTitle(row?.title||item?.title||session?.title||session?.libraryTitle||'').trim();
  if(!displayTitle)return null;
  const categoryId=String(item?.categoryId||session?.categoryId||'');
  return {item,title:displayTitle,categoryId,key:item?.id?`id:${item.id}`:`title:${categoryId}:${displayTitle.toLocaleLowerCase()}`};
}
function v340RecentRows(){
  const state=v340RecentState(),now=Date.now(),days={'7':7,'30':30,'365':365}[String(state.period)]||0;
  const query=String(state.query||'').trim().toLocaleLowerCase(),category=String(state.category||'all');
  const sorted=typeof v270SortedSessions==='function'?v270SortedSessions():(S.sessions||[]).slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  const byId=typeof v241EnsureLibraryIndex==='function'?v241EnsureLibraryIndex():{byId:new Map((S.library||[]).filter(x=>x?.id).map(x=>[String(x.id),x]))};
  const results=[],seen=new Set();
  for(const session of sorted){
    if(!session||session.status==='skipped')continue;
    const titles=Array.isArray(session.titles)&&session.titles.length?session.titles.filter(x=>x&&(x.title||x.libraryId)):[];
    // Only include genuinely identifiable titles. A legacy category-only log
    // has no title or cover information and must not impersonate a title.
    if(!titles.length){
      if(session.libraryId||cleanTitle(session.title||session.libraryTitle||''))titles.push({title:session.title||session.libraryTitle||'',libraryId:session.libraryId||null,qty:session.actualAmount});
      else continue;
    }
    const qtyTotal=titles.reduce((acc,row)=>acc+Math.max(0,Number(row.qty)||0),0);
    for(const row of titles){
      const resolved=v340ResolveRecentTitle(session,row,byId);
      if(!resolved)continue;
      const ts=v340RecentTimestamp(session,row);
      if(days&&now-ts>days*86400000)continue;
      if(category!=='all'&&resolved.categoryId!==category)continue;
      if(query&&!resolved.title.toLocaleLowerCase().includes(query))continue;
      if(seen.has(resolved.key))continue;
      seen.add(resolved.key);
      const qty=Math.max(0,Number(row.qty)||0);
      const minutes=Math.max(0,Number(session.minutes)||0)*(qtyTotal?qty/qtyTotal:1/Math.max(1,titles.length));
      results.push({...resolved,session,row,timestamp:ts,date:typeof v331EventDate==='function'?v331EventDate(session,row):new Date(ts),qty,minutes});
    }
  }
  results.sort((a,b)=>b.timestamp-a.timestamp);
  return results;
}
function v340RecentCard(entry){
  const {item,title,session,timestamp,categoryId,qty,minutes}=entry;
  const category=getCategory(categoryId),cover=String(item?.coverUrl||item?.cover||item?.imageUrl||'').trim();
  const name=v340Esc(title),categoryName=v340Esc(category?.name||'Media');
  const categoryIcon=category&&typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(category):'<span aria-hidden="true">▣</span>';
  const fallback=`<span class="v340-recent-fallback" aria-hidden="true">${categoryIcon}</span>`;
  const picture=cover?`<img src="${v340Esc(cover)}" alt="${name} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">${fallback.replace('class="v340-recent-fallback"','class="v340-recent-fallback" style="display:none"')}`:fallback;
  const rowTime=typeof v331HistoryTime==='function'?v331HistoryTime(session,entry.row):v260TimeLabel(timestamp);
  const cat=category||getCategory(session?.categoryId);
  const consumed=qty>0?`${qty.toLocaleString()} ${unitLabel(cat?.unit,qty)}`:'';
  const details=item?.id?`<button type="button" class="v340-recent-name" data-v225-iconified="1" onclick="App.v181OpenTitleDetails('${v340Esc(String(item.id))}')" title="Open title details">${name}</button>`:`<b class="v340-recent-name">${name}</b>`;
  return `<article class="v340-recent-card" aria-label="${name} recent activity"><div class="v340-recent-cover">${picture}</div><div class="v340-recent-copy"><div class="v340-recent-overline"><span>${categoryName}</span><time>${v340Esc(rowTime)}</time></div>${details}<div class="v340-recent-facts">${consumed?`<span>${v340Esc(consumed)}</span><span aria-hidden="true">·</span>`:''}<span>${v340Esc(fmtMinutes(Math.round(minutes)))}</span></div></div><button type="button" class="v340-recent-edit" data-v225-iconified="1" onclick="App.openSessionModal('${v340Esc(String(session.id))}')" aria-label="Edit log entry for ${name}" title="Edit log entry">${V340_EDIT_ICON}<span>Edit log</span></button></article>`;
}
function v340RecentHtml(){
  const state=v340RecentState(),all=v340RecentRows(),size=Math.max(10,Math.min(200,Number(state.pageSize)||50));
  const pages=Math.max(1,Math.ceil(all.length/size));state.page=Math.max(0,Math.min(pages-1,Number(state.page)||0));
  const rows=all.slice(state.page*size,state.page*size+size),groups=new Map();
  for(const row of rows){
    const key=v340LocalDateKey(row.date);
    if(!groups.has(key))groups.set(key,{timestamp:row.timestamp,date:row.date,items:[]});
    groups.get(key).items.push(row);
  }
  const timeline=[...groups.values()].map(day=>{
    const buckets=new Map();
    for(const entry of day.items){const [name]=v260TimeBucket(entry.timestamp);if(!buckets.has(name))buckets.set(name,[]);buckets.get(name).push(entry);}
    return `<section class="v261-recent-day v340-recent-day"><header><span aria-hidden="true"></span><b>${v340Esc(v340RecentDayLabel(day.date))}</b><small>${v340Esc(day.date.toLocaleDateString(undefined,{weekday:'long'}))}</small><span class="v340-recent-day-count">${day.items.length} ${day.items.length===1?'title':'titles'}</span></header>${[...buckets.entries()].map(([name,entries])=>`<div class="v261-daypart v340-recent-period"><div class="v261-daypart-head"><b>${v340Esc(name)}</b><small>${entries.length} ${entries.length===1?'title':'titles'}</small></div><div class="v340-recent-grid">${entries.map(v340RecentCard).join('')}</div></div>`).join('')}</section>`;
  }).join('');
  const filters=`<div class="v261-history-toolbar v340-recent-toolbar"><div class="v261-filter-group"><select aria-label="Filter recent titles by category" onchange="App.v261SetHistoryFilter('recent','category',this.value)">${v261CategoryOptions(state.category)}</select><select aria-label="Filter recent titles by time" onchange="App.v261SetHistoryFilter('recent','period',this.value)"><option value="all" ${state.period==='all'?'selected':''}>All time</option><option value="7" ${state.period==='7'?'selected':''}>Last 7 days</option><option value="30" ${state.period==='30'?'selected':''}>Last 30 days</option><option value="365" ${state.period==='365'?'selected':''}>Last year</option></select><input type="search" aria-label="Search recently viewed titles" placeholder="Search recently viewed titles…" value="${v340Esc(state.query)}" oninput="App.v261SetHistoryFilter('recent','query',this.value)"></div><span>${all.length.toLocaleString()} titles</span></div>`;
  const empty='<div class="v260-empty v340-recent-empty"><b>No named titles in this view</b><span>Try different filters. Older category-only logs without title details remain available in Consumption History and Logs.</span></div>';
  return `${filters}${rows.length?`<div class="v261-recent-timeline v340-recent-timeline">${timeline}</div>${v261HistoryPager('recent',all.length)}`:empty}`;
}

const v340HistoryBodyBase=v260HistoryBody;
v260HistoryBody=function(tab){
  if(tab==='recent')return v340RecentHtml();
  const html=v340HistoryBodyBase.apply(this,arguments);
  return tab==='consumption'?v340WeekPagination(html):html;
};
MediaFlowRuntime.version=V340_RUNTIME_VERSION;
window.MediaFlowV340={version:340,focus:'Consumption week direction icons and title-level Recently Viewed timeline'};
