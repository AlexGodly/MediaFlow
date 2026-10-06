/* ============================================================
   MediaFlow v269 — Simkl-Inspired Consumption History Redesign
   ------------------------------------------------------------
   A complete presentation rebuild for History -> Consumption history.
   It keeps MediaFlow's data model, edit/delete/select/export behavior,
   category system and dynamic themes while adopting a dense timeline:
   - compact Simkl-style filter strip
   - latest consumed title covers with last progress labels
   - week-by-week summaries using MediaFlow categories
   - each week's daily consumption cards directly below its summary
   - older weeks continue naturally down the page
   ============================================================ */
(function(){
'use strict';
const V269_RUNTIME_VERSION=269;
const V269_DEFAULT_WEEKS_PER_PAGE=8;

function v269Esc(v){return escapeHtml(String(v==null?'':v));}
function v269Arr(v){return Array.isArray(v)?v:[];}
function v269UI(){
  S.v269HistoryUI=S.v269HistoryUI||{};
  const u=S.v269HistoryUI;
  if(!('year' in u))u.year='all';
  if(!('month' in u))u.month='all';
  if(!Number.isFinite(Number(u.weekPage)))u.weekPage=0;
  if(!Number.isFinite(Number(u.weeksPerPage)))u.weeksPerPage=V269_DEFAULT_WEEKS_PER_PAGE;
  if(!('selectMode' in u))u.selectMode=false;
  return u;
}
function v269LocalDateFromISO(value){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
  if(!m)return null;
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
  return Number.isFinite(d.getTime())?d:null;
}
function v269SessionDate(s){
  return v269LocalDateFromISO(s?.date)||new Date(Number(s?.timestamp)||Date.now());
}
function v269DateKey(d){
  const x=d instanceof Date?d:new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
}
function v269WeekStart(value){
  const d=value instanceof Date?new Date(value):new Date(value);
  d.setHours(12,0,0,0);
  const day=(d.getDay()+6)%7;
  d.setDate(d.getDate()-day);
  return d;
}
function v269WeekEnd(start){const d=new Date(start);d.setDate(d.getDate()+6);return d;}
function v269ISOWeek(value){
  const d=new Date(Date.UTC(value.getFullYear(),value.getMonth(),value.getDate()));
  const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);
  const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d-yearStart)/86400000)+1)/7);
}
function v269SameDay(a,b){return v269DateKey(a)===v269DateKey(b);}
function v269CurrentWeekStart(){return v269WeekStart(new Date());}
function v269PrevWeekStart(){const d=v269CurrentWeekStart();d.setDate(d.getDate()-7);return d;}
function v269MonthName(n){return new Date(2026,Math.max(0,Number(n)-1),1).toLocaleDateString(undefined,{month:'long'});}
function v269YearOptions(){
  const years=[...new Set(v269Arr(S.sessions).map(s=>v269SessionDate(s).getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
  return years;
}
function v269ResolveItem(session,row){
  if(row?.libraryId){const byId=v269Arr(S.library).find(i=>String(i?.id||'')===String(row.libraryId));if(byId)return byId;}
  if(session?.libraryId){const byId=v269Arr(S.library).find(i=>String(i?.id||'')===String(session.libraryId));if(byId)return byId;}
  const title=cleanTitle(row?.title||session?.title||session?.libraryTitle||'').toLocaleLowerCase();
  if(!title)return null;
  const cat=String(session?.categoryId||'');
  return v269Arr(S.library).find(i=>cleanTitle(i?.title||'').toLocaleLowerCase()===title&&String(i?.categoryId||'')===cat)
    ||v269Arr(S.library).find(i=>cleanTitle(i?.title||'').toLocaleLowerCase()===title)
    ||null;
}
function v269Cover(item){return String(item?.coverUrl||item?.cover||item?.imageUrl||'').trim();}
function v269EventIdentity(item,row,session){return item?.id?`id:${item.id}`:`title:${String(session?.categoryId||'')}:${cleanTitle(row?.title||session?.title||'').toLocaleLowerCase()}`;}
function v269SessionRows(session){
  const src=v269Arr(session?.titles).filter(t=>t&&(t.title||t.libraryId));
  if(src.length)return src;
  const title=cleanTitle(session?.title||session?.libraryTitle||'');
  if(title||session?.libraryId)return [{title:title||'Untitled',libraryId:session.libraryId||null,qty:Number(session.actualAmount)||0,repeat:false}];
  const cat=getCategory(session?.categoryId);
  return [{title:cat?.name||'Media',libraryId:null,qty:Number(session?.actualAmount)||0,repeat:false,v269CategoryOnly:true}];
}
function v269EventsFromSession(session){
  const rows=v269SessionRows(session),qtyTotal=rows.reduce((a,r)=>a+Math.max(0,Number(r?.qty)||0),0),mins=Math.max(0,Number(session?.minutes)||0);
  return rows.map((row,index)=>{
    const item=v269ResolveItem(session,row),cat=getCategory(item?.categoryId||session?.categoryId),qty=Math.max(0,Number(row?.qty)||0);
    const minutes=qtyTotal>0?Math.round(mins*(qty/qtyTotal)):Math.round(mins/Math.max(1,rows.length));
    return {session,row,item,cat,qty,minutes,index,identity:v269EventIdentity(item,row,session),date:v269SessionDate(session)};
  });
}
function v269AllEvents(sessions){return v269Arr(sessions).flatMap(v269EventsFromSession);}
function v269ProgressNoun(cat,qty=2){return cat?unitLabel(cat.unit,qty):'units';}
function v269ProgressAbbr(cat){
  const u=String(cat?.unit||'').toLocaleLowerCase();
  if(/episode/.test(u))return 'Ep.';
  if(/chapter/.test(u))return 'Ch.';
  if(/issue/.test(u))return 'Issue';
  if(/volume/.test(u))return 'Vol.';
  if(/book/.test(u))return 'Book';
  if(/movie|film/.test(u))return 'Seen';
  return 'Progress';
}
function v269LatestProgressLabel(ev){
  const season=ev?.row?.season;
  if(season&&Number.isFinite(Number(season.episode))){
    const sn=season.number==null?'':`S${String(Math.max(0,Number(season.number)||0)).padStart(2,'0')} `;
    return `${sn}Ep. ${Math.max(0,Number(season.episode)||0)}`.trim();
  }
  const item=ev?.item,cat=ev?.cat,p=Math.max(0,Number(item?.progress)||0),total=Math.max(0,Number(item?.total)||0),abbr=v269ProgressAbbr(cat);
  if(/Seen/.test(abbr)&&((total>0&&p>=total)||String(item?.status||'')==='completed'))return 'Seen all';
  if(p>0)return `${abbr} ${p}`;
  if(ev?.qty>0)return `+${ev.qty} ${v269ProgressNoun(cat,ev.qty)}`;
  return fmtMinutes(ev?.minutes||0);
}
function v269EventConsumedLabel(ev){
  const q=Math.max(0,Number(ev?.qty)||0),noun=v269ProgressNoun(ev?.cat,q);
  if(q>0)return `${q} ${noun}`;
  return fmtMinutes(ev?.minutes||0);
}
function v269EventProgressMeta(ev){
  const season=ev?.row?.season;
  if(season&&Number.isFinite(Number(season.episode))){
    const name=season.name?String(season.name):season.number!=null?`Season ${season.number}`:'Season';
    return `${name} · Episode ${Math.max(0,Number(season.episode)||0)}`;
  }
  return '';
}
function v269FilteredSessions(){
  let list=(typeof v253HistoryFilteredList==='function'?v253HistoryFilteredList():v269Arr(S.sessions).slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0))).slice();
  const u=v269UI();
  if(u.year!=='all')list=list.filter(s=>String(v269SessionDate(s).getFullYear())===String(u.year));
  if(u.month!=='all')list=list.filter(s=>String(v269SessionDate(s).getMonth()+1)===String(u.month));
  return list.sort((a,b)=>v269SessionDate(b)-v269SessionDate(a)||(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
}
function v269LatestEvents(sessions,limit=14){
  const seen=new Set(),out=[];
  for(const ev of v269AllEvents(sessions)){
    if(seen.has(ev.identity))continue;
    seen.add(ev.identity);out.push(ev);if(out.length>=limit)break;
  }
  return out;
}
function v269CoverMarkup(ev,cls='mf269-cover'){
  const cover=v269Cover(ev?.item),cat=ev?.cat,title=cleanTitle(ev?.item?.title||ev?.row?.title||ev?.session?.title||cat?.name||'Media');
  const fallback=`<span class="${cls} mf269-cover-fallback" style="--mf269-cat:${v269Esc(cat?.color||'var(--flow)')}" aria-label="${v269Esc(cat?.name||'Category')} icon">${cat?v144CategoryIconHtml(cat):v269Esc((title||'?').charAt(0).toUpperCase())}</span>`;
  return cover?`<span class="${cls}"><img src="${v269Esc(cover)}" alt="${v269Esc(title)} cover" loading="lazy" onerror="this.parentElement.classList.add('is-broken');this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="mf269-cover-fallback" style="display:none;--mf269-cat:${v269Esc(cat?.color||'var(--flow)')}">${cat?v144CategoryIconHtml(cat):v269Esc((title||'?').charAt(0).toUpperCase())}</span></span>`:fallback;
}
function v269OpenEvent(ev){
  if(ev?.item?.id)return `App.v181OpenTitleDetails('${v269Esc(String(ev.item.id))}')`;
  return `App.openSessionModal('${v269Esc(String(ev?.session?.id||''))}')`;
}
function v269LatestStripHtml(sessions){
  const latest=v269LatestEvents(sessions,16);
  if(!latest.length)return '';
  return `<section class="mf269-latest" aria-label="Latest consumed titles"><div class="mf269-latest-track">${latest.map(ev=>{
    const title=cleanTitle(ev.item?.title||ev.row?.title||ev.cat?.name||'Media');
    return `<button type="button" class="mf269-latest-title" title="${v269Esc(title)}" onclick="${v269OpenEvent(ev)}">${v269CoverMarkup(ev,'mf269-latest-cover')}<span class="mf269-latest-progress">${v269Esc(v269LatestProgressLabel(ev))}</span><span class="mf269-latest-name">${v269Esc(title)}</span></button>`;
  }).join('')}</div></section>`;
}
function v269SetYear(value){const u=v269UI();u.year=String(value||'all');u.weekPage=0;render();}
function v269SetMonth(value){const u=v269UI();u.month=String(value||'all');u.weekPage=0;render();}
function v269SetWeekPage(value){const u=v269UI();u.weekPage=Math.max(0,Number(value)||0);render();try{document.querySelector('.v269-history-page .v260-history-body')?.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){}}
function v269SetWeeksPerPage(value){const u=v269UI();u.weeksPerPage=Math.max(2,Math.min(16,Math.round(Number(value)||V269_DEFAULT_WEEKS_PER_PAGE)));u.weekPage=0;render();}
function v269ToggleSelectMode(){const u=v269UI();u.selectMode=!u.selectMode;render();}
function v269ResetViewFilters(){
  const u=v269UI();u.year='all';u.month='all';u.weekPage=0;
  S.histFilters=S.histFilters||{};S.histFilters.type='all';S.histFilters.range='all';S.histFilters.dateFrom='';S.histFilters.dateTo='';S.histFilters.historyCategories=[];S.histFilters.category='all';
  render();
}
function v269FilterBarHtml(sessions){
  const u=v269UI(),f=S.histFilters=S.histFilters||{},years=v269YearOptions(),hasCustom=!!(f.dateFrom||f.dateTo||f.range==='custom');
  const monthOptions=Array.from({length:12},(_,i)=>i+1).map(n=>`<option value="${n}" ${String(u.month)===String(n)?'selected':''}>${v269Esc(v269MonthName(n))}</option>`).join('');
  const categoryControl=typeof v241HistoryCategoryFilterHtml==='function'?v241HistoryCategoryFilterHtml():'<span>All categories</span>';
  return `<section class="mf269-filter-shell"><div class="mf269-filterbar"><div class="mf269-filter-left">
    <div class="mf269-filter-cell mf269-filter-category"><span class="mf269-filter-label">Categories</span>${categoryControl}</div>
    <label class="mf269-filter-cell"><span class="mf269-filter-label">Year</span><select onchange="App.v269SetYear(this.value)"><option value="all">All</option>${years.map(y=>`<option value="${y}" ${String(u.year)===String(y)?'selected':''}>${y}</option>`).join('')}</select></label>
    <label class="mf269-filter-cell"><span class="mf269-filter-label">Month</span><select onchange="App.v269SetMonth(this.value)"><option value="all">All</option>${monthOptions}</select></label>
    <label class="mf269-filter-cell"><span class="mf269-filter-label">Period</span><select onchange="App.setHistFilter('range',this.value)"><option value="all" ${f.range==='all'?'selected':''}>All history</option><option value="today" ${f.range==='today'?'selected':''}>Today</option><option value="week" ${f.range==='week'?'selected':''}>This week</option><option value="month" ${f.range==='month'?'selected':''}>This month</option><option value="custom" ${f.range==='custom'?'selected':''}>Custom dates</option></select></label>
  </div><div class="mf269-filter-actions"><button type="button" class="mf269-select-toggle ${u.selectMode?'active':''}" onclick="App.v269ToggleSelectMode()">${u.selectMode?'DONE':'SELECT'}</button>
    <details class="mf269-options"><summary class="btn btn-sm">View Options</summary><div class="mf269-options-panel">
      <label><span>Media type</span><select onchange="App.setHistFilter('type',this.value)"><option value="all" ${!f.type||f.type==='all'?'selected':''}>All media types</option><option value="video" ${f.type==='video'?'selected':''}>Video</option><option value="reading" ${f.type==='reading'?'selected':''}>Reading</option></select></label>
      <label><span>Weeks per page</span><input type="number" min="2" max="16" value="${u.weeksPerPage}" onchange="App.v269SetWeeksPerPage(this.value)"></label>
      <div class="mf269-date-options"><label><span>From</span><input type="date" value="${v269Esc(f.dateFrom||'')}" onchange="App.v241SetHistoryDate('from',this.value)"></label><label><span>To</span><input type="date" value="${v269Esc(f.dateTo||'')}" onchange="App.v241SetHistoryDate('to',this.value)"></label></div>
      <button type="button" class="btn btn-sm btn-ghost" onclick="App.v269ResetViewFilters()">Reset filters</button>
    </div></details>
    <button type="button" class="btn btn-sm" onclick="App.exportCSV()">Export CSV</button>
  </div></div>${hasCustom?`<div class="mf269-active-date-range">Custom dates · ${v269Esc(f.dateFrom||'Beginning')} → ${v269Esc(f.dateTo||'Today')}</div>`:''}<div class="mf269-filter-count">${sessions.length.toLocaleString()} filtered ${sessions.length===1?'log':'logs'}</div></section>`;
}
function v269WeekGroups(sessions){
  const map=new Map();
  for(const s of sessions){
    const d=v269SessionDate(s),start=v269WeekStart(d),key=v269DateKey(start);
    if(!map.has(key))map.set(key,{key,start,end:v269WeekEnd(start),sessions:[],events:[]});
    const g=map.get(key);g.sessions.push(s);g.events.push(...v269EventsFromSession(s));
  }
  return [...map.values()].sort((a,b)=>b.start-a.start);
}
function v269WeekTitle(g){
  if(v269SameDay(g.start,v269CurrentWeekStart()))return ['THIS WEEK,','YOU CONSUMED'];
  if(v269SameDay(g.start,v269PrevWeekStart()))return ['LAST WEEK,','YOU CONSUMED'];
  return [`WEEK ${v269ISOWeek(g.start)},`,'YOU CONSUMED'];
}
function v269FormatRange(g){
  const opt={month:'short',day:'numeric'};const a=g.start.toLocaleDateString(undefined,opt),b=g.end.toLocaleDateString(undefined,{...opt,year:'numeric'});
  return `Week ${v269ISOWeek(g.start)} · ${a} – ${b}`;
}
function v269WeekCategoryStats(g){
  const map=new Map();
  for(const ev of g.events){
    const id=String(ev.cat?.id||ev.session?.categoryId||'other');
    if(!map.has(id))map.set(id,{cat:ev.cat,minutes:0,identities:new Set(),units:0});
    const x=map.get(id);x.minutes+=Math.max(0,Number(ev.minutes)||0);x.identities.add(ev.identity);x.units+=Math.max(0,Number(ev.qty)||0);
  }
  return [...map.values()].sort((a,b)=>b.minutes-a.minutes||b.identities.size-a.identities.size);
}
function v269WeekMetrics(g){
  const total=g.sessions.reduce((a,s)=>a+Math.max(0,Number(s.minutes)||0),0),days=new Map(),hours=new Map();
  for(const s of g.sessions){const d=v269SessionDate(s),key=v269DateKey(d);days.set(key,(days.get(key)||0)+Math.max(0,Number(s.minutes)||0));const h=new Date(Number(s.timestamp)||d).getHours();hours.set(h,(hours.get(h)||0)+Math.max(0,Number(s.minutes)||0));}
  const mostDay=[...days.entries()].sort((a,b)=>b[1]-a[1])[0],peak=[...hours.entries()].sort((a,b)=>b[1]-a[1])[0],longest=g.sessions.slice().sort((a,b)=>(Number(b.minutes)||0)-(Number(a.minutes)||0))[0];
  const activeDays=days.size,avg=activeDays?Math.round(total/activeDays):0;
  const mostDayDate=mostDay?v269LocalDateFromISO(mostDay[0]):null;
  const hourLabel=peak?new Date(2026,0,1,peak[0],0).toLocaleTimeString(undefined,{hour:'numeric'}):'—';
  return {total,activeDays,avg,mostDayLabel:mostDayDate?mostDayDate.toLocaleDateString(undefined,{weekday:'long'}):'—',mostDayMinutes:mostDay?.[1]||0,peak:hourLabel,longest:Math.max(0,Number(longest?.minutes)||0)};
}
function v269TopTitles(g,limit=3){
  const map=new Map();
  for(const ev of g.events){
    if(!map.has(ev.identity))map.set(ev.identity,{...ev,units:0,minutesTotal:0});
    const x=map.get(ev.identity);x.units+=Math.max(0,Number(ev.qty)||0);x.minutesTotal+=Math.max(0,Number(ev.minutes)||0);if(v269SessionDate(ev.session)>v269SessionDate(x.session)){x.session=ev.session;x.row=ev.row;x.item=ev.item;x.cat=ev.cat;}
  }
  return [...map.values()].sort((a,b)=>b.units-a.units||b.minutesTotal-a.minutesTotal).slice(0,limit);
}
function v269WeekSummaryHtml(g){
  const [line1,line2]=v269WeekTitle(g),cats=v269WeekCategoryStats(g),m=v269WeekMetrics(g),top=v269TopTitles(g,3);
  return `<section class="mf269-week-summary"><div class="mf269-week-badge">${v269Esc(v269FormatRange(g))}</div><div class="mf269-week-summary-head"><div class="mf269-week-title"><span class="mf269-hourglass" aria-hidden="true">⌛</span><div><span>${v269Esc(line1)}</span><b>${v269Esc(line2)}</b></div></div><div class="mf269-week-categories">${cats.map(x=>`<div class="mf269-week-category"><span class="mf269-week-category-icon" style="--mf269-cat:${v269Esc(x.cat?.color||'var(--flow)')}">${x.cat?v144CategoryIconHtml(x.cat):'◫'}</span><div><small>${x.identities.size.toLocaleString()} ${v269Esc(x.cat?.name||'Media')}</small><b>${fmtMinutes(x.minutes)}</b></div></div>`).join('')}</div></div>
    <div class="mf269-week-metrics"><div><small>Total consumed</small><b>${fmtMinutes(m.total)}</b></div><div><small>Days with activity</small><b>${m.activeDays} ${m.activeDays===1?'day':'days'}</b><i class="mf269-day-dots">${Array.from({length:7},(_,i)=>`<u class="${i<m.activeDays?'on':''}"></u>`).join('')}</i></div><div><small>Average / active day</small><b>${fmtMinutes(m.avg)}</b></div><div><small>Most active day</small><b>${v269Esc(m.mostDayLabel)}</b><span>${fmtMinutes(m.mostDayMinutes)}</span></div><div><small>Most popular time</small><b>${v269Esc(m.peak)}</b></div><div><small>Longest binge</small><b>${fmtMinutes(m.longest)}</b></div></div>
    ${top.length?`<div class="mf269-most-consumed"><div class="mf269-most-label"><span>▣</span><b>MOST CONSUMED<br>TITLES</b></div><div class="mf269-most-grid">${top.map((ev,i)=>{const title=cleanTitle(ev.item?.title||ev.row?.title||ev.cat?.name||'Media');return `<button type="button" class="mf269-most-card" onclick="${v269OpenEvent(ev)}">${v269CoverMarkup(ev,'mf269-most-cover')}<span class="mf269-most-rank">${i+1}</span><span class="mf269-most-copy"><b>${v269Esc(title)}</b><small>${ev.units>0?`${ev.units} ${v269Esc(v269ProgressNoun(ev.cat,ev.units))}`:'Consumed'}</small><em>${fmtMinutes(ev.minutesTotal)}</em></span></button>`;}).join('')}</div></div>`:''}
  </section>`;
}
function v269DayLabel(date){
  const today=new Date(),yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
  if(v269SameDay(date,today))return 'Today';if(v269SameDay(date,yesterday))return 'Yesterday';
  return date.toLocaleDateString(undefined,{month:'long',day:'numeric',year:date.getFullYear()===today.getFullYear()?undefined:'numeric'});
}
function v269SessionSelected(id){try{return V253_HISTORY_SELECTED.has(String(id));}catch(_){return false;}}
function v269HistoryCardHtml(ev){
  const s=ev.session,u=v269UI(),selected=v269SessionSelected(s.id),title=cleanTitle(ev.item?.title||ev.row?.title||ev.cat?.name||'Media'),meta=v269EventProgressMeta(ev),year=ev.item?.year||'',repeat=!!ev.row?.repeat;
  return `<article class="mf269-history-card ${selected?'is-selected':''}">${u.selectMode?`<label class="mf269-history-select" title="Select this History log"><input type="checkbox" ${selected?'checked':''} onchange="App.v253ToggleHistorySelection('${v269Esc(String(s.id))}',this.checked)"><span></span></label>`:''}${repeat?'<span class="mf269-repeat-ribbon" title="Rewatch / reread">↻</span>':''}
    <button type="button" class="mf269-card-main" onclick="${v269OpenEvent(ev)}">${v269CoverMarkup(ev,'mf269-card-cover')}<span class="mf269-card-copy"><small>${v269Esc(ev.cat?.name||'Media')}${year?` · ${v269Esc(year)}`:''}</small><b>${v269Esc(title)}</b><strong>${v269Esc(v269EventConsumedLabel(ev))}</strong>${meta?`<em>${v269Esc(meta)}</em>`:''}<span class="mf269-card-time">${fmtMinutes(ev.minutes)} · ${new Date(Number(s.timestamp)||ev.date).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</span></span></button>
    <details class="mf269-card-menu"><summary aria-label="History entry actions">⌄</summary><div><button type="button" onclick="App.openSessionModal('${v269Esc(String(s.id))}')">Edit log</button><button type="button" class="danger" onclick="App.deleteSession('${v269Esc(String(s.id))}')">Delete log</button></div></details>
  </article>`;
}
function v269WeekHistoryHtml(g){
  const days=new Map();
  for(const ev of g.events){const key=v269DateKey(ev.date);if(!days.has(key))days.set(key,{date:ev.date,events:[],minutes:0});const d=days.get(key);d.events.push(ev);d.minutes+=Math.max(0,Number(ev.minutes)||0);}
  const rows=[...days.values()].sort((a,b)=>b.date-a.date).map(day=>{
    const unique=new Set(day.events.map(e=>e.identity)).size,units=day.events.reduce((a,e)=>a+Math.max(0,Number(e.qty)||0),0);
    return `<section class="mf269-day"><header class="mf269-day-head"><div><span class="mf269-clock">◷</span><b>${v269Esc(v269DayLabel(day.date))} · ${v269Esc(day.date.toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}))} · Week ${v269ISOWeek(day.date)} · ${v269Esc(day.date.toLocaleDateString(undefined,{weekday:'long'}))}</b><small>${fmtMinutes(day.minutes)}</small></div><span>${unique} ${unique===1?'title':'titles'} · ${units.toLocaleString()} ${units===1?'unit':'units'}</span></header><div class="mf269-day-grid">${day.events.map(v269HistoryCardHtml).join('')}</div></section>`;
  }).join('');
  return `<div class="mf269-week-history">${rows}</div>`;
}
function v269VisibleSessions(){
  const groups=v269WeekGroups(v269FilteredSessions()),u=v269UI(),size=Math.max(2,Math.min(16,Number(u.weeksPerPage)||V269_DEFAULT_WEEKS_PER_PAGE));
  u.weekPage=Math.max(0,Math.min(Math.max(0,Math.ceil(groups.length/size)-1),Number(u.weekPage)||0));
  return groups.slice(u.weekPage*size,u.weekPage*size+size).flatMap(g=>g.sessions);
}
function v269SelectVisible(){
  try{for(const s of v269VisibleSessions())if(s?.id)V253_HISTORY_SELECTED.add(String(s.id));}catch(_){ }
  render();
}
function v269SelectionBar(sessions){
  const u=v269UI();if(!u.selectMode)return '';
  let selected=0;try{selected=V253_HISTORY_SELECTED.size;}catch(_){ }
  return `<div class="mf269-selection-bar"><div><b>${selected.toLocaleString()}</b> selected logs</div><div><button type="button" class="btn btn-sm" onclick="App.v269SelectVisible()">Select visible</button><button type="button" class="btn btn-sm btn-ghost" onclick="App.v253DeselectHistory()">Deselect</button><button type="button" class="btn btn-sm btn-danger" ${selected?'':'disabled'} onclick="App.v253OpenHistoryDeleteConfirm('selected')">Delete selected</button></div></div>`;
}
function v269WeekPager(groups){
  const u=v269UI(),size=Math.max(2,Math.min(16,Number(u.weeksPerPage)||V269_DEFAULT_WEEKS_PER_PAGE)),pages=Math.max(1,Math.ceil(groups.length/size));u.weekPage=Math.max(0,Math.min(pages-1,Number(u.weekPage)||0));if(pages<=1)return '';
  return `<nav class="mf269-week-pager" aria-label="Consumption history week pages"><button type="button" class="btn btn-sm" ${u.weekPage<=0?'disabled':''} onclick="App.v269SetWeekPage(${u.weekPage-1})">← Newer weeks</button><span>Weeks page ${u.weekPage+1} of ${pages}</span><button type="button" class="btn btn-sm" ${u.weekPage>=pages-1?'disabled':''} onclick="App.v269SetWeekPage(${u.weekPage+1})">Older weeks →</button></nav>`;
}
function v269ConsumptionHtml(){
  const sessions=v269FilteredSessions(),groups=v269WeekGroups(sessions),u=v269UI(),size=Math.max(2,Math.min(16,Number(u.weeksPerPage)||V269_DEFAULT_WEEKS_PER_PAGE)),pages=Math.max(1,Math.ceil(groups.length/size));u.weekPage=Math.max(0,Math.min(pages-1,Number(u.weekPage)||0));const visible=groups.slice(u.weekPage*size,u.weekPage*size+size),visibleSessions=visible.flatMap(g=>g.sessions);
  if(!sessions.length)return `${v269FilterBarHtml(sessions)}<div class="v260-empty mf269-empty"><b>No consumption history matches these filters</b><span>Change the filters or log something new and it will appear here automatically.</span></div>`;
  return `<div class="mf269-consumption">${v269FilterBarHtml(sessions)}${v269LatestStripHtml(sessions)}${v269SelectionBar(visibleSessions)}<div class="mf269-week-stack">${visible.map(g=>`${v269WeekSummaryHtml(g)}${v269WeekHistoryHtml(g)}`).join('')}</div>${v269WeekPager(groups)}</div>`;
}

/* Keep existing tabs intact. Only Consumption history is replaced. */
const v269HistoryBodyBase=v260HistoryBody;
v260HistoryBody=function(tab){if(tab==='consumption')return v269ConsumptionHtml();return v269HistoryBodyBase.apply(this,arguments);};
const v269RenderHistoryBase=renderHistory;
renderHistory=function(){
  let html=v269RenderHistoryBase.apply(this,arguments);
  html=String(html||'').replace('class="v260-history-page v261-history-page"','class="v260-history-page v261-history-page v269-history-page"');
  html=html.replace('Consumption, recently viewed titles, ratings and Library changes in one place.','A week-by-week record of what you watched and read, with MediaFlow category summaries.');
  return html;
};

/* Reset the v269 week pager whenever an existing History filter changes. */
function v269WrapFilterAction(name){
  const base=App[name];if(typeof base!=='function')return;
  App[name]=function(){v269UI().weekPage=0;return base.apply(this,arguments);};
}
['setHistFilter','v241ToggleHistoryCategory','v241ClearHistoryCategories','v241SetHistoryDate','v241ClearHistoryDates'].forEach(v269WrapFilterAction);

/* Backup audit only; no schema/data migration is required. */
if(typeof v148BackupManifest==='function'){
  const v269BackupManifestBase=v148BackupManifest;
  v148BackupManifest=function(){const manifest=v269BackupManifestBase.apply(this,arguments);manifest.includes=Object.assign({},manifest.includes||{},{consumptionHistoryRedesignV269:true,weeklyHistorySummariesV269:true,latestConsumedStripV269:true,categoryBasedWeekBreakdownV269:true});manifest.v269={consumptionHistoryRedesign:true,weeklySummaries:true,categoryBreakdowns:true,latestConsumedCovers:true,coverFallbackToCategoryIcon:true,dynamicThemesPreserved:true,cloudSyncVersion:201,fullBackupSchema:29,settingsPresetSchema:1,personalOrderExportVersion:4};return manifest;};
}

function v269UpdateVersionChrome(){
  document.querySelectorAll('.v260-topbar-chip').forEach(chip=>{if(/^v\d+$/i.test((chip.textContent||'').trim()))chip.textContent='v269';});
  document.querySelectorAll('.v260-topbar-copy span,.v260-topbar-copy small').forEach(span=>{if(/MediaFlow v\d+/i.test(span.textContent||''))span.textContent=(span.textContent||'').replace(/MediaFlow v\d+/ig,'MediaFlow v269');});
}
function v269AfterPaintVersion(){requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(v269UpdateVersionChrome)));}
try{if(typeof v266UpdateVersionChrome==='function')v266UpdateVersionChrome=v269UpdateVersionChrome;}catch(_){ }
try{if(typeof v268UpdateVersionChrome==='function')v268UpdateVersionChrome=v269UpdateVersionChrome;}catch(_){ }
const v269RenderBase=render;
render=function(){const out=v269RenderBase.apply(this,arguments);queueMicrotask(v269UpdateVersionChrome);v269AfterPaintVersion();return out;};
Object.assign(App,{v269SetYear,v269SetMonth,v269SetWeekPage,v269SetWeeksPerPage,v269ToggleSelectMode,v269ResetViewFilters,v269SelectVisible,v269ConsumptionHtml});
window.MediaFlowV269={version:269,focus:'Simkl-inspired week-by-week Consumption History with MediaFlow categories and themes'};
MediaFlowRuntime.version=V269_RUNTIME_VERSION;
queueMicrotask(v269UpdateVersionChrome);v269AfterPaintVersion();
})();
