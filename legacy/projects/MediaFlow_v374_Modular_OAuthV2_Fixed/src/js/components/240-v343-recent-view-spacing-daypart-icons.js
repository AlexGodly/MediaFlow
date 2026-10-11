/* MediaFlow v343 — Recently Viewed spacing + title underline removal + daypart icons */
const V343_RELEASE=343;
function v343RecentTitleButton(itemId,name){
  return itemId
    ? `<button type="button" class="v340-recent-name v342-recent-name v343-recent-name" onclick="App.v181OpenTitleDetails('${v340Esc(String(itemId))}')" title="Open title details">${name}</button>`
    : `<b class="v340-recent-name v342-recent-name v343-recent-name">${name}</b>`;
}
function v343DaypartIcon(name){
  const key=String(name||'').toLowerCase();
  if(key==='morning') return '<span class="v343-daypart-icon" aria-hidden="true">☀</span>';
  if(key==='afternoon') return '<span class="v343-daypart-icon" aria-hidden="true">🌤</span>';
  if(key==='evening') return '<span class="v343-daypart-icon" aria-hidden="true">🌆</span>';
  return '<span class="v343-daypart-icon" aria-hidden="true">☾</span>';
}
function v343DaypartLabel(name){
  const label=v340Esc(name||'');
  return `${v343DaypartIcon(name)}<span>${label}</span>`;
}
v340RecentCard=function(entry){
  const {item,title,session,timestamp,categoryId,qty,minutes}=entry;
  const category=getCategory(categoryId),cover=String(item?.coverUrl||item?.cover||item?.imageUrl||'').trim();
  const name=v340Esc(title),categoryName=v340Esc(category?.name||'Media');
  const categoryIcon=category&&typeof v144CategoryIconHtml==='function'?v144CategoryIconHtml(category):'<span aria-hidden="true">▣</span>';
  const fallback=`<span class="v340-recent-fallback" aria-hidden="true">${categoryIcon}</span>`;
  const picture=cover
    ? `<img src="${v340Esc(cover)}" alt="${name} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">${fallback.replace('class="v340-recent-fallback"','class="v340-recent-fallback" style="display:none"')}`
    : fallback;
  const rowTime=typeof v331HistoryTime==='function'?v331HistoryTime(session,entry.row):v260TimeLabel(timestamp);
  const cat=category||getCategory(session?.categoryId);
  const consumed=qty>0?`${qty.toLocaleString()} ${unitLabel(cat?.unit,qty)}`:'';
  const details=v343RecentTitleButton(item?.id,name);
  return `<article class="v340-recent-card v342-recent-card v343-recent-card" aria-label="${name} recent activity"><div class="v340-recent-cover">${picture}</div><div class="v340-recent-copy v342-recent-copy v343-recent-copy"><div class="v340-recent-overline v342-recent-overline v343-recent-overline"><span class="v342-recent-category v343-recent-category">${categoryIcon}<span>${categoryName}</span></span><time>${v340Esc(rowTime)}</time></div>${details}<div class="v340-recent-facts v342-recent-facts v343-recent-facts">${consumed?`<span>${v340Esc(consumed)}</span><span aria-hidden="true">·</span>`:''}<span>${v340Esc(fmtMinutes(Math.round(minutes)))}</span></div><div class="v342-recent-actions v343-recent-actions"><button type="button" class="v340-recent-edit v342-recent-edit v343-recent-edit" onclick="App.openSessionModal('${v340Esc(String(session.id))}')" aria-label="Edit log entry for ${name}" title="Edit log entry">${V340_EDIT_ICON}<span>Edit log</span></button></div></div></article>`;
};
v340RecentHtml=function(){
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
    return `<section class="v261-recent-day v340-recent-day"><header><span aria-hidden="true"></span><b>${v340Esc(v340RecentDayLabel(day.date))}</b><small>${v340Esc(day.date.toLocaleDateString(undefined,{weekday:'long'}))}</small>${v342RecentDayCount(day.items.length)}</header>${[...buckets.entries()].map(([name,entries])=>`<div class="v261-daypart v340-recent-period v343-recent-period"><div class="v261-daypart-head v343-daypart-head"><b>${v343DaypartLabel(name)}</b><small>${entries.length} ${entries.length===1?'title':'titles'}</small></div><div class="v340-recent-grid">${entries.map(v340RecentCard).join('')}</div></div>`).join('')}</section>`;
  }).join('');
  const filters=`<div class="v261-history-toolbar v340-recent-toolbar"><div class="v261-filter-group"><select aria-label="Filter recent titles by category" onchange="App.v261SetHistoryFilter('recent','category',this.value)">${v261CategoryOptions(state.category)}</select><select aria-label="Filter recent titles by time" onchange="App.v261SetHistoryFilter('recent','period',this.value)"><option value="all" ${state.period==='all'?'selected':''}>All time</option><option value="7" ${state.period==='7'?'selected':''}>Last 7 days</option><option value="30" ${state.period==='30'?'selected':''}>Last 30 days</option><option value="365" ${state.period==='365'?'selected':''}>Last year</option></select><input type="search" placeholder="Search recently viewed…" value="${v340Esc(state.query)}" oninput="App.v261SetHistoryFilter('recent','query',this.value)" autocomplete="off"></div><span>${all.length.toLocaleString()} ${all.length===1?'title':'titles'}</span></div>`;
  return `${filters}${rows.length?`<div class="v340-recent-timeline">${timeline}</div>${v261HistoryPager('recent',all.length)}`:`<div class="empty-state v340-recent-empty"><div class="em-title">No matching recent activity</div><div>Adjust the filters or log more titles.</div></div>`}`;
};
MediaFlowRuntime.version=V343_RELEASE;
window.MediaFlowV343={version:343,features:['Recently Viewed title spacing polish','Recent title underline removal','Recent daypart icons']};
