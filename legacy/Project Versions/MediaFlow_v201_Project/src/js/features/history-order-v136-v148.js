/* MediaFlow v201 source fragment
 * Lifecycle history, Personal Order, category palettes, dynamic cover themes and backup audit
 * Original HTML lines 14954-18603.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================
   MediaFlow v136 — On This Day lifecycle events
   Combines real History logs with per-title Start/Finish dates.
   Start/Finish events are display-only; they do not create fake sessions,
   consumption minutes, scheduler activity, or XP.
   ============================================================ */
renderOnThisDay=function(){
  const now=new Date(),groups=new Map();

  const add=(date,event)=>{
    if(!(date instanceof Date) || Number.isNaN(date.getTime()))return;
    const years=now.getFullYear()-date.getFullYear();
    if(years<1 || date.getMonth()!==now.getMonth() || date.getDate()!==now.getDate())return;
    if(!groups.has(years))groups.set(years,[]);
    groups.get(years).push(Object.assign({timestamp:date.getTime(),date},event));
  };

  const eventDate=ts=>{
    ts=Number(ts)||0;
    if(!ts)return null;
    const d=new Date(ts);
    return Number.isNaN(d.getTime())?null:d;
  };

  // Actual consumption History.
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped')continue;

    const key=v119SessionDateKey(s);
    if(!key)continue;
    const d=new Date(key+'T12:00:00');
    if(Number.isNaN(d.getTime()))continue;

    const years=now.getFullYear()-d.getFullYear();
    if(years<1 || d.getMonth()!==now.getMonth() || d.getDate()!==now.getDate())continue;

    const titles=Array.isArray(s.titles)&&s.titles.length
      ? s.titles.filter(t=>t?.title)
      : (s.title?[{
          title:s.title,
          libraryId:s.libraryId||null,
          qty:s.actualAmount||0,
          categoryId:s.categoryId||null
        }]:[]);

    if(!titles.length)continue;

    const totalQty=titles.reduce(
      (n,t)=>n+Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0),
      0
    );
    const sessionMinutes=Math.max(0,Number(s.minutes)||0);

    for(const t of titles){
      const qty=Math.max(0,Number(t?.qty ?? t?.amount ?? 0)||0);
      let minutes=Math.max(0,Number(t?.minutes)||0);

      if(!minutes && sessionMinutes>0){
        if(titles.length===1)minutes=sessionMinutes;
        else if(totalQty>0)minutes=sessionMinutes*(qty/totalQty);
        else minutes=sessionMinutes/titles.length;
      }

      add(d,{
        kind:'logged',
        title:cleanTitle(t.title),
        libraryId:t.libraryId||null,
        categoryId:t.categoryId||s.categoryId||null,
        qty,
        minutes
      });
    }
  }

  // Title lifecycle dates — including MAL-imported v136 dates.
  for(const item of (S.library||[])){
    const title=cleanTitle(item?.title||'');
    if(!title)continue;

    const started=eventDate(item?.startedAt);
    if(started)add(started,{
      kind:'started',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0
    });

    const finished=eventDate(item?.completedAt);
    if(finished)add(finished,{
      kind:'finished',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0
    });
  }

  if(!groups.size)return '';

  const coverMarkup=(item,summary=false,categoryId=null,title='')=>{
    const cls=summary?'v126-otd-summary':'v126-otd-row';
    const cat=getCategory(item?.categoryId||categoryId);
    const icon=v144CategoryIconHtml(cat);
    const name=cleanTitle(item?.title||title||'');
    if(item?.coverUrl){
      return `<img class="${cls}-cover" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(name)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="${cls}-placeholder" style="display:none">${icon}</div>`;
    }
    return `<div class="${cls}-placeholder">${icon}</div>`;
  };

  const verb={started:'Started',finished:'Finished',logged:'Logged'};
  const icon={started:'▶',finished:'✓',logged:'●'};
  const priority={started:0,logged:1,finished:2};

  // Merge duplicate History rows for the same title/year while keeping Started
  // and Finished as their own meaningful events.
  const grouped=[];
  for(const [years,raw] of [...groups.entries()].sort((a,b)=>a[0]-b[0])){
    raw.sort((a,b)=>
      (Number(a.timestamp)||0)-(Number(b.timestamp)||0) ||
      (priority[a.kind]??9)-(priority[b.kind]??9)
    );

    const merged=[],byKey=new Map();
    for(const x of raw){
      const identity=x.libraryId
        ? `id:${String(x.libraryId)}`
        : `title:${cleanTitle(x.title).toLowerCase()}::${String(x.categoryId||'')}`;
      const key=`${x.kind}::${identity}`;

      let m=byKey.get(key);
      if(!m){
        m={...x,qty:0,minutes:0};
        byKey.set(key,m);
        merged.push(m);
      }
      m.qty+=Math.max(0,Number(x.qty)||0);
      m.minutes+=Math.max(0,Number(x.minutes)||0);
    }

    if(merged.length)grouped.push({years,rows:merged});
  }

  if(!grouped.length)return '';

  const amountText=x=>{
    if(x.kind!=='logged')return '';
    const item=v50FindLibraryItem(x.libraryId,x.title);
    const cat=getCategory(item?.categoryId||x.categoryId);
    const bits=[];
    const qty=Math.max(0,Number(x.qty)||0);
    const minutes=Math.max(0,Math.round(Number(x.minutes)||0));
    if(qty>0)bits.push(`${qty} ${unitLabel(cat?.unit||'units',qty)}`);
    if(minutes>0)bits.push(fmtMinutes(minutes));
    return bits.join(' · ');
  };

  const nearest=grouped[0],first=nearest.rows[0];
  const firstItem=v50FindLibraryItem(first.libraryId,first.title);
  const firstCat=getCategory(firstItem?.categoryId||first.categoryId);
  const totalExtra=Math.max(0,nearest.rows.length-1);
  const otherYears=Math.max(0,grouped.length-1);

  let more='';
  if(totalExtra)more+=`+${totalExtra} more event${totalExtra===1?'':'s'} that day`;
  if(otherYears)more+=(more?' · ':'')+`${otherYears} other matching year${otherYears===1?'':'s'}`;
  more=more?more+' · tap to view all':'Tap to view details';

  const body=grouped.map(group=>{
    const rows=group.rows.map(x=>{
      const item=v50FindLibraryItem(x.libraryId,x.title);
      const cat=getCategory(item?.categoryId||x.categoryId);
      const amount=amountText(x);

      return `<div class="v126-otd-row">
        ${coverMarkup(item,false,x.categoryId,x.title)}
        <div class="v126-otd-row-copy">
          <span class="v136-otd-event" data-kind="${x.kind}">${icon[x.kind]||'•'} ${verb[x.kind]||'Event'}</span>
          <b>${escapeHtml(cleanTitle(x.title))}</b>
          <small>${escapeHtml(cat?.name||'Library')}${amount?` · ${escapeHtml(amount)}`:''}</small>
        </div>
      </div>`;
    }).join('');

    const eventCount=group.rows.length;
    return `<div class="v126-otd-year">
      <div class="v126-otd-year-head">
        <strong>${group.years} year${group.years===1?'':'s'} ago</strong>
        <span>${eventCount.toLocaleString()} event${eventCount===1?'':'s'}</span>
      </div>
      ${rows}
    </div>`;
  }).join('');

  return `<details class="on-this-day v126-otd" data-mf-on-this-day-version="136">
    <summary class="v126-otd-summary">
      ${coverMarkup(firstItem,true,first.categoryId,first.title)}
      <div class="v126-otd-copy">
        <span>On this day · ${nearest.years} year${nearest.years===1?'':'s'} ago</span>
        <b>${escapeHtml(`${verb[first.kind]||'Event'} ${cleanTitle(first.title)}`)}</b>
        <small>${escapeHtml(firstCat?.name||'Library')}</small>
        <span class="v126-otd-more">${escapeHtml(more)}</span>
      </div>
      <span class="v126-otd-chevron">⌄</span>
    </summary>
    <div class="v126-otd-body">${body}</div>
  </details>`;
};


/* ============================================================
   MediaFlow v137 — Automatic Start Date from genuine History
   ------------------------------------------------------------
   Rules:
   - a real title log can automatically create Start Date when it is blank;
   - existing progress does not prevent Start Date creation;
   - the earliest genuine matching History date is preferred;
   - later logs never push Start Date forward;
   - an automatically-created Start Date can move earlier when older genuine
     History is later added/backdated;
   - manual, MAL-imported, and legacy pre-v137 Start Dates are protected;
   - repeat/rewatch/reread logs do not become a title's original Start Date.
   ============================================================ */

function v137HistoryTimestamp(session){
  if(!session)return 0;

  // The editable History date is authoritative for day-level lifecycle data.
  // This lets backdating an existing History row move an automatic Start Date
  // earlier without rewriting the session's original technical timestamp.
  const raw=String(session.date||'').trim().slice(0,10);
  const fromDate=/^\d{4}-\d{2}-\d{2}$/.test(raw)?Number(v135ParseDateInput(raw))||0:0;
  if(fromDate)return fromDate;

  return Number(session.timestamp)||0;
}

function v137HistoryTitleMatches(item,session,titleRow){
  if(!item || !session || !titleRow)return false;

  if(titleRow.libraryId){
    return String(titleRow.libraryId)===String(item.id);
  }

  return (
    cleanTitle(titleRow.title||'').toLowerCase()===cleanTitle(item.title||'').toLowerCase() &&
    String(session.categoryId||'')===String(item.categoryId||'')
  );
}

function v137IsGenuineStartEvidence(item,session,titleRow){
  if(!session || session.status==='skipped' || !titleRow)return false;

  // Rewatch/reread history belongs to repeat tracking, not the original start.
  if(titleRow.repeat)return false;

  if(!v137HistoryTitleMatches(item,session,titleRow))return false;

  const qtyRaw=titleRow.qty ?? titleRow.amount;
  const hasQty=qtyRaw!==undefined && qtyRaw!==null && qtyRaw!=='';
  if(hasQty && Number(qtyRaw)<=0)return false;

  const consumed=(Number(session.actualAmount)||0)>0 || (Number(session.minutes)||0)>0 || (hasQty && Number(qtyRaw)>0);
  return consumed;
}

function v137EarliestGenuineStart(item){
  if(!item?.id)return 0;

  let earliest=Infinity;
  for(const session of (S.sessions||[])){
    if(!session || session.status==='skipped')continue;

    for(const titleRow of (session.titles||[])){
      if(!v137IsGenuineStartEvidence(item,session,titleRow))continue;
      const ts=v137HistoryTimestamp(session);
      if(ts>0 && ts<earliest)earliest=ts;
    }
  }

  return Number.isFinite(earliest)?earliest:0;
}

function v137CanAutoChangeStart(item){
  if(!item)return false;

  // No date yet: v137 may establish it.
  if(!(Number(item.startedAt)>0))return true;

  // Only dates explicitly created by the automatic History system are allowed
  // to move earlier. A source-less pre-v137 date is treated as protected legacy
  // data so v137 never silently changes an old manual/imported date.
  return String(item.startedAtSource||'')==='auto';
}

function v137ReconcileStartDate(item){
  if(!item || !v137CanAutoChangeStart(item))return false;

  const earliest=v137EarliestGenuineStart(item);
  if(!earliest)return false;

  const current=Number(item.startedAt)||0;
  if(current>0 && earliest>=current)return false;

  item.startedAt=earliest;
  item.startedAtSource='auto';
  item.modifiedAt=Date.now();
  return true;
}

function v137ResolveHistoryTitle(session,titleRow){
  if(!titleRow)return null;

  if(titleRow.libraryId){
    const byId=(S.library||[]).find(i=>String(i?.id||'')===String(titleRow.libraryId));
    if(byId)return byId;
  }

  const titleKey=cleanTitle(titleRow.title||'').toLowerCase();
  if(!titleKey)return null;

  const sameCategory=(S.library||[]).find(i=>
    cleanTitle(i?.title||'').toLowerCase()===titleKey &&
    String(i?.categoryId||'')===String(session?.categoryId||'')
  );
  if(sameCategory)return sameCategory;

  const all=(S.library||[]).filter(i=>cleanTitle(i?.title||'').toLowerCase()===titleKey);
  return all.length===1?all[0]:null;
}

function v137AffectedItemsFromSessions(sessions){
  const map=new Map();

  for(const session of (sessions||[])){
    if(!session || session.status==='skipped')continue;

    for(const titleRow of (session.titles||[])){
      if(titleRow?.repeat)continue;
      const item=v137ResolveHistoryTitle(session,titleRow);
      if(item?.id)map.set(String(item.id),item);
    }
  }

  return [...map.values()];
}

function v137ReconcileStartsForSessions(sessions){
  let changed=0;
  for(const item of v137AffectedItemsFromSessions(sessions)){
    if(v137ReconcileStartDate(item))changed++;
  }
  return changed;
}

// Final wrapper for normal logging.
// This works even when a title already had progress before MediaFlow knew its
// Start Date, and it does not require Update Library to be enabled because the
// genuine History row itself is sufficient evidence of when MediaFlow saw it.
const v137SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v137SubmitLogBase.apply(this,arguments);

  const added=(S.sessions||[]).filter(s=>s?.id&&!before.has(s.id));
  const changed=v137ReconcileStartsForSessions(added);

  if(changed){
    persistLibrary();
    render();
  }

  return result;
};

// Batch Log can be backdated, so its entered day becomes valid Start-Date
// evidence. If older matching History already exists, that earlier day wins.
const v137SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v137SubmitBatchLogBase.apply(this,arguments);

  const added=(S.sessions||[]).filter(s=>s?.id&&!before.has(s.id));
  const changed=v137ReconcileStartsForSessions(added);

  if(changed){
    persistLibrary();
    render();
  }

  return result;
};

// Editing a History date can reveal an earlier genuine starting day.
// Automatic dates may move backward only; manual/MAL/legacy dates stay fixed.
const v137SaveSessionModalBase=App.saveSessionModal;
App.saveSessionModal=function(id){
  const before=(S.sessions||[]).find(s=>s?.id===id);
  const beforeCopy=before?Object.assign({},before,{titles:(before.titles||[]).map(t=>Object.assign({},t))}):null;

  const result=v137SaveSessionModalBase.apply(this,arguments);
  const after=(S.sessions||[]).find(s=>s?.id===id);

  const changed=v137ReconcileStartsForSessions([beforeCopy,after].filter(Boolean));
  if(changed){
    persistLibrary();
    render();
  }

  return result;
};


/* ============================================================
   MediaFlow v138 — Personal Order
   ------------------------------------------------------------
   A lightweight planning/notepad layer over Library titles:
   - one canonical title sequence;
   - All Titles and By Category views share that same sequence;
   - custom or Settings-based category order;
   - category visibility controls;
   - cloud/full-backup persistence;
   - no effect on scheduler, History, progress, stats or XP.
   ============================================================ */

function v138OrderDefaults(){
  return {
    titleIds:[],
    viewMode:'all',
    categoryMode:'default',
    categoryOrder:[],
    hiddenCategories:[],
    modifiedAt:0,
    lastClearedOrder:null
  };
}

function v138NormalizeOrderPlan(plan,library,categories){
  const base=v138OrderDefaults();
  const raw=(plan&&typeof plan==='object'&&!Array.isArray(plan))?plan:{};
  const lib=Array.isArray(library)?library:(Array.isArray(S?.library)?S.library:[]);
  const cats=Array.isArray(categories)?categories:(Array.isArray(S?.categories)?S.categories:[]);
  const libIds=new Set(lib.filter(i=>i?.id).map(i=>String(i.id)));
  const catIds=new Set(cats.filter(c=>c?.id).map(c=>String(c.id)));

  const unique=(arr,allowed)=>{
    const out=[],seen=new Set();
    for(const x of (Array.isArray(arr)?arr:[])){
      const id=String(x||'');
      if(!id||seen.has(id)||(allowed&&!allowed.has(id)))continue;
      seen.add(id);out.push(id);
    }
    return out;
  };

  let customCats=unique(raw.categoryOrder,catIds);
  for(const c of cats){
    const id=String(c?.id||'');
    if(id&&!customCats.includes(id))customCats.push(id);
  }

  return {
    titleIds:unique(raw.titleIds,libIds),
    viewMode:raw.viewMode==='category'?'category':'all',
    categoryMode:raw.categoryMode==='custom'?'custom':'default',
    categoryOrder:customCats,
    hiddenCategories:unique(raw.hiddenCategories,catIds),
    modifiedAt:Math.max(0,Number(raw.modifiedAt)||0)
  };
}

function v138EnsureOrderPlan(){
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  S.orderPlannerUI=S.orderPlannerUI||{
    search:'',
    picks:new Set(),
    dragTitleId:'',
    dragCategoryId:'',
    dragCategoryFrom:'',
    page:0,
    pageSize:20,
    categories:[],
    status:'all',
    priority:'all',
    sort:'relevance'
  };
  if(!(S.orderPlannerUI.picks instanceof Set))S.orderPlannerUI.picks=new Set();
  return S.orderPlan;
}

function v138TouchOrderPlan(){
  const p=v138EnsureOrderPlan();
  p.modifiedAt=Date.now();
  saveState();
}

function v138OrderItem(id){
  return (S.library||[]).find(i=>String(i?.id||'')===String(id))||null;
}

function v138OrderCategory(id){
  return (S.categories||[]).find(c=>String(c?.id||'')===String(id))||null;
}

function v138OrderedItems(){
  const p=v138EnsureOrderPlan();
  return p.titleIds.map(v138OrderItem).filter(Boolean);
}

function v138CategoryDisplayOrder(){
  const p=v138EnsureOrderPlan();
  if(p.categoryMode==='custom'){
    const valid=new Set((S.categories||[]).map(c=>String(c.id)));
    const ids=p.categoryOrder.filter(id=>valid.has(String(id)));
    for(const c of (S.categories||[])){
      if(!ids.includes(String(c.id)))ids.push(String(c.id));
    }
    return ids;
  }
  // S.categories is already kept in the Settings/default MediaFlow order.
  return (S.categories||[]).map(c=>String(c.id));
}

function v138ProgressText(item){
  const progress=Math.max(0,Number(item?.progress)||0);
  const total=Number(item?.total);
  if(Number.isFinite(total)&&total>0)return `${progress}/${total}`;
  return progress>0?`${progress} logged`:'progress unknown';
}

function v138OrderCover(item,cat){
  const title=cleanTitle(item?.title||'');
  if(item?.coverUrl){
    return `<img class="v138-order-cover" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(title)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="v138-order-cover-ph" style="display:none">${v144CategoryIconHtml(cat)}</div>`;
  }
  return `<div class="v138-order-cover-ph">${v144CategoryIconHtml(cat)}</div>`;
}

function v138OrderRowHtml(item,position,scopeCatId=''){
  const cat=v138OrderCategory(item.categoryId);
  const globalIndex=v138EnsureOrderPlan().titleIds.indexOf(String(item.id));
  const canUp=scopeCatId
    ? v138CategoryTitleIds(scopeCatId).indexOf(String(item.id))>0
    : globalIndex>0;
  const scoped=scopeCatId?v138CategoryTitleIds(scopeCatId):v138EnsureOrderPlan().titleIds;
  const scopedIndex=scoped.indexOf(String(item.id));
  const canDown=scopedIndex>=0&&scopedIndex<scoped.length-1;
  const status=v199StatusLabel(item.status);
  const moveFn=scopeCatId?'v138MoveTitleInCategory':'v138MoveTitle';
  const moveArgs=scopeCatId?`'${String(item.id)}','${String(scopeCatId)}'`:`'${String(item.id)}'`;
  const dragCat=scopeCatId?String(scopeCatId):'';

  return `<div class="v138-order-row" draggable="true"
      ondragstart="App.v138OrderDragStart(event,'${String(item.id)}','${dragCat}')"
      ondragend="App.v138OrderDragEnd(event)"
      ondragover="App.v138OrderDragOver(event)"
      ondrop="App.v138OrderDrop(event,'${String(item.id)}','${dragCat}')">
    <div class="v138-order-pos" title="Order position">${position}</div>
    <div>${v138OrderCover(item,cat)}</div>
    <div class="v138-order-copy">
      <span class="v138-order-title">${escapeHtml(cleanTitle(item.title))}</span>
      <div class="v138-order-meta">
        <span>${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Unknown')}</span>
        <span>·</span>
        <span>${escapeHtml(v199StatusLabel(status))}</span>
        <span>·</span>
        <span>${escapeHtml(v138ProgressText(item))}</span>
      </div>
    </div>
    <div class="v138-order-actions">
      <span class="v138-drag-handle" title="Drag to reorder">☰</span>
      <button class="btn btn-sm btn-ghost" type="button" ${canUp?'':'disabled'} onclick="App.${moveFn}(${moveArgs},-1)" title="Move up">↑</button>
      <button class="btn btn-sm btn-ghost" type="button" ${canDown?'':'disabled'} onclick="App.${moveFn}(${moveArgs},1)" title="Move down">↓</button>
      <button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${String(item.id)}')" title="Remove from Order only">Remove</button>
    </div>
  </div>`;
}

function v138CategoryTitleIds(catId){
  const p=v138EnsureOrderPlan();
  return p.titleIds.filter(id=>String(v138OrderItem(id)?.categoryId||'')===String(catId));
}

function v138AllTitlesHtml(){
  const items=v138OrderedItems();
  if(!items.length){
    return `<div class="v138-order-empty"><b>Your Order is empty</b>Add Library titles from the picker, then arrange them in the exact sequence you want.</div>`;
  }
  return `<div class="v138-order-list">${items.map((item,i)=>v138OrderRowHtml(item,i+1,'')).join('')}</div>`;
}

function v138ByCategoryHtml(){
  const p=v138EnsureOrderPlan();
  const hidden=new Set(p.hiddenCategories.map(String));
  const order=v138CategoryDisplayOrder();
  const blocks=[];

  for(const catId of order){
    if(hidden.has(String(catId)))continue;
    const cat=v138OrderCategory(catId);
    if(!cat)continue;
    const ids=v138CategoryTitleIds(catId);
    if(!ids.length)continue;

    const rows=ids.map((id,i)=>{
      const item=v138OrderItem(id);
      return item?v138OrderRowHtml(item,i+1,catId):'';
    }).join('');

    blocks.push(`<div class="card v138-category-card">
      <div class="v138-category-head">
        <div class="v138-category-head-copy">
          <b>${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name)}</b>
          <small>Relative title order is shared with All Titles.</small>
        </div>
        <span class="v138-category-count">${ids.length}</span>
      </div>
      <div class="v138-order-list">${rows}</div>
    </div>`);
  }

  if(!blocks.length){
    return `<div class="v138-order-empty"><b>No visible category groups</b>Add titles to Order or show a hidden category from Category display.</div>`;
  }
  return blocks.join('');
}

function v138CategoryManagerHtml(){
  const p=v138EnsureOrderPlan();
  const hidden=new Set(p.hiddenCategories.map(String));
  const custom=p.categoryMode==='custom';
  const order=v138CategoryDisplayOrder();

  const rows=order.map((id,index)=>{
    const c=v138OrderCategory(id);
    if(!c)return '';
    const count=v138CategoryTitleIds(id).length;
    const isHidden=hidden.has(String(id));
    return `<div class="v138-category-control ${isHidden?'hidden-cat':''}" ${custom?'draggable="true"':''}
      ${custom?`ondragstart="App.v138CategoryDragStart(event,'${String(id)}')" ondragend="App.v138CategoryDragEnd(event)" ondragover="App.v138OrderDragOver(event)" ondrop="App.v138CategoryDrop(event,'${String(id)}')"`:''}>
      <span class="v138-drag-handle">${custom?'☰':'•'}</span>
      <span class="v138-category-control-name">${v144CategoryIconHtml(c)} ${escapeHtml(c.name)} <small style="color:var(--text-mute)">(${count})</small></span>
      <div class="v138-order-actions">
        <button class="btn btn-sm btn-ghost v138-eye-btn" type="button" onclick="App.v138ToggleOrderCategory('${String(id)}')" title="${isHidden?'Show category':'Hide category'}">${isHidden?'Show':'Hide'}</button>
        ${custom?`<button class="btn btn-sm btn-ghost" type="button" ${index===0?'disabled':''} onclick="App.v138MoveCategory('${String(id)}',-1)">↑</button><button class="btn btn-sm btn-ghost" type="button" ${index===order.length-1?'disabled':''} onclick="App.v138MoveCategory('${String(id)}',1)">↓</button>`:''}
      </div>
    </div>`;
  }).join('');

  return `<div class="card">
    <div class="section-label">CATEGORY DISPLAY</div>
    <div class="hint">Category order only changes the grouped view. Hidden categories stay in your saved Order and remain visible in All Titles.</div>
    <div class="v138-cat-mode-row">
      <button type="button" class="btn btn-sm ${!custom?'btn-primary':''}" onclick="App.v138SetCategoryMode('default')">Use Settings order</button>
      <button type="button" class="btn btn-sm ${custom?'btn-primary':''}" onclick="App.v138SetCategoryMode('custom')">Custom order</button>
    </div>
    <div class="v138-category-manager">${rows}</div>
  </div>`;
}

function v140EnsureOrderPickerUI(){
  v138EnsureOrderPlan();
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};
  ui.search=String(ui.search||'');
  if(!(ui.picks instanceof Set))ui.picks=new Set(Array.isArray(ui.picks)?ui.picks.map(String):[]);
  ui.page=Math.max(0,Number(ui.page)||0);
  ui.pageSize=v175PageSize('orderLibrary');
  ui.categories=Array.isArray(ui.categories)?[...new Set(ui.categories.map(String).filter(Boolean))]:[];
  ui.status=['all','planned','active','paused','completed','dropped'].includes(String(ui.status||'all').toLowerCase())
    ? String(ui.status||'all').toLowerCase():'all';
  ui.priority=['all','high','medium','low'].includes(String(ui.priority||'all').toLowerCase())
    ? String(ui.priority||'all').toLowerCase():'all';
  const sorts=new Set(['relevance','priority-desc','priority-asc','title-asc','title-desc','rating-desc','rating-asc','progress-desc','progress-asc','total-desc','total-asc']);
  ui.sort=sorts.has(String(ui.sort||'relevance'))?String(ui.sort):'relevance';

  const validCats=new Set((S.categories||[]).map(c=>String(c?.id||'')).filter(Boolean));
  ui.categories=ui.categories.filter(id=>validCats.has(id));
  return ui;
}

function v138PickerMatches(){
  const p=v138EnsureOrderPlan();
  const ui=v140EnsureOrderPickerUI();
  const existing=new Set(p.titleIds.map(String));
  const q=String(ui.search||'').trim().toLowerCase();

  let rows=(S.library||[]).filter(i=>i?.id&&!existing.has(String(i.id)));

  // Search remains useful with no query: filters can browse the full Library.
  if(q){
    rows=rows.filter(i=>{
      const cat=v138OrderCategory(i.categoryId);
      return [
        cleanTitle(i.title),
        cat?.name||'',
        i.status||'',
        i.priority||''
      ].join(' ').toLowerCase().includes(q);
    });
  }

  if(ui.categories.length){
    rows=rows.filter(i=>ui.categories.includes(String(i.categoryId||'')));
  }
  if(ui.status!=='all'){
    rows=rows.filter(i=>String(i.status||'planned').toLowerCase()===ui.status);
  }
  if(ui.priority!=='all'){
    rows=rows.filter(i=>String(i.priority||'medium').toLowerCase()===ui.priority);
  }

  const rank={low:0,medium:1,high:2};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const cmpTitle=(a,b)=>cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'});

  rows=rows.slice().sort((a,b)=>{
    let d=0;

    if(ui.sort==='title-asc')return cmpTitle(a,b);
    if(ui.sort==='title-desc')return cmpTitle(b,a);
    if(ui.sort==='priority-desc')d=(rank[String(b.priority||'medium').toLowerCase()]??1)-(rank[String(a.priority||'medium').toLowerCase()]??1);
    else if(ui.sort==='priority-asc')d=(rank[String(a.priority||'medium').toLowerCase()]??1)-(rank[String(b.priority||'medium').toLowerCase()]??1);
    else if(ui.sort==='rating-desc')d=num(b.rating)-num(a.rating);
    else if(ui.sort==='rating-asc')d=num(a.rating)-num(b.rating);
    else if(ui.sort==='progress-desc')d=num(b.progress)-num(a.progress);
    else if(ui.sort==='progress-asc')d=num(a.progress)-num(b.progress);
    else if(ui.sort==='total-desc')d=num(b.total)-num(a.total);
    else if(ui.sort==='total-asc')d=num(a.total)-num(b.total);
    else if(q){
      // Same Best match behavior used by the logging title picker:
      // exact title -> title prefix -> contains/other searchable metadata.
      const at=cleanTitle(a.title).toLowerCase();
      const bt=cleanTitle(b.title).toLowerCase();
      const ar=at===q?0:at.startsWith(q)?1:at.includes(q)?2:3;
      const br=bt===q?0:bt.startsWith(q)?1:bt.includes(q)?2:3;
      const ai=at.includes(q)?at.indexOf(q):Number.MAX_SAFE_INTEGER;
      const bi=bt.includes(q)?bt.indexOf(q):Number.MAX_SAFE_INTEGER;
      d=ar-br || ai-bi;
    }

    return d||cmpTitle(a,b);
  });

  return rows;
}

function v140OrderPickerPageData(){
  const ui=v140EnsureOrderPickerUI();
  const candidates=v138PickerMatches();
  const pages=Math.max(1,Math.ceil(candidates.length/ui.pageSize));
  ui.page=Math.max(0,Math.min(ui.page,pages-1));
  const start=ui.page*ui.pageSize;
  const rows=candidates.slice(start,start+ui.pageSize);
  return {ui,candidates,pages,rows,start};
}

function v140OrderPickerToolsHtml(data){
  const {ui,candidates,pages}=data||v140OrderPickerPageData();
  const cats=(S.categories||[]).filter(c=>c?.id);
  const catLabel=ui.categories.length?`${ui.categories.length} categories selected`:'All categories';

  return `<div class="v140-order-filterbar">
    <details class="v66-cat-filter">
      <summary class="btn">${escapeHtml(catLabel)} ▾</summary>
      <div class="v66-cat-panel">
        <div class="v66-cat-head">
          <b>Show categories</b>
          <button type="button" class="btn btn-sm btn-ghost" onclick="App.v140OrderClearCategories(event)">All</button>
        </div>
        ${cats.map(c=>`<label class="v66-cat-option">
          <input type="checkbox" ${ui.categories.includes(String(c.id))?'checked':''} onchange="App.v140OrderToggleCategory('${escapeHtml(String(c.id))}',this.checked)">
          <span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span>
        </label>`).join('')}
      </div>
    </details>

    <select aria-label="Order Library display order" onchange="App.v140OrderSetFilter('sort',this.value)">
      <option value="relevance" ${ui.sort==='relevance'?'selected':''}>Best match</option>
      <option value="priority-desc" ${ui.sort==='priority-desc'?'selected':''}>Priority: High → Low</option>
      <option value="priority-asc" ${ui.sort==='priority-asc'?'selected':''}>Priority: Low → High</option>
      <option value="title-asc" ${ui.sort==='title-asc'?'selected':''}>Title: A → Z</option>
      <option value="title-desc" ${ui.sort==='title-desc'?'selected':''}>Title: Z → A</option>
      <option value="rating-desc" ${ui.sort==='rating-desc'?'selected':''}>Rating: High → Low</option>
      <option value="rating-asc" ${ui.sort==='rating-asc'?'selected':''}>Rating: Low → High</option>
      <option value="progress-desc" ${ui.sort==='progress-desc'?'selected':''}>Progress: Most → Least</option>
      <option value="progress-asc" ${ui.sort==='progress-asc'?'selected':''}>Progress: Least → Most</option>
      <option value="total-desc" ${ui.sort==='total-desc'?'selected':''}>Total: Most → Least</option>
      <option value="total-asc" ${ui.sort==='total-asc'?'selected':''}>Total: Least → Most</option>
    </select>

    <select aria-label="Order Library title status" onchange="App.v140OrderSetFilter('status',this.value)">
      <option value="all" ${ui.status==='all'?'selected':''}>All statuses</option>
      ${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${ui.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}
    </select>

    <select aria-label="Order Library title priority" onchange="App.v140OrderSetFilter('priority',this.value)">
      <option value="all" ${ui.priority==='all'?'selected':''}>All priorities</option>
      ${['high','medium','low'].map(x=>`<option value="${x}" ${ui.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}
    </select>

    <button type="button" class="btn btn-sm btn-ghost v140-order-clear" onclick="App.v140OrderClearFilters()">Clear filters</button><div class="v140-order-matchline">${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'} · Page ${ui.page+1}/${pages}</div>
  </div>`;
}

function v138PickerResultsHtml(data){
  const page=data||v140OrderPickerPageData();
  const rows=page.rows;
  const picks=page.ui.picks;

  if(!rows.length){
    return `<div class="hint" style="padding:12px 2px">No Library titles match the current search and filters.</div>`;
  }

  return rows.map(item=>{
    const c=v138OrderCategory(item.categoryId);
    const id=String(item.id);
    return `<label class="v138-picker-row">
      <input type="checkbox" ${picks.has(id)?'checked':''} onchange="App.v138ToggleOrderPick('${id}',this.checked)">
      <span class="v138-picker-copy">
        <b>${escapeHtml(cleanTitle(item.title))}</b>
        <small>${v144CategoryIconHtml(c)} ${escapeHtml(c?.name||'Unknown')} · ${escapeHtml(v199StatusLabel(item.status))} · ${escapeHtml(v138ProgressText(item))}</small>
      </span>
    </label>`;
  }).join('');
}

function v140OrderPagerHtml(data){
  const page=data||v140OrderPickerPageData();
  const {ui,pages}=page;
  if(pages<=1)return '';

  const count=Math.min(5,pages);
  let from=Math.max(0,ui.page-2);
  if(from+count>pages)from=Math.max(0,pages-count);
  const nums=[];
  for(let n=from;n<Math.min(pages,from+count);n++){
    nums.push(`<button type="button" class="btn btn-sm ${n===ui.page?'btn-primary':''}" ${n===ui.page?'aria-current="page"':''} onclick="App.v140OrderSetPage(${n})">${n+1}</button>`);
  }

  return `<div class="v140-order-pager">
    <button type="button" class="btn btn-sm btn-ghost" ${ui.page===0?'disabled':''} onclick="App.v140OrderSetPage(${ui.page-1})">← Prev</button>
    ${nums.join('')}
    <button type="button" class="btn btn-sm btn-ghost" ${ui.page===pages-1?'disabled':''} onclick="App.v140OrderSetPage(${ui.page+1})">Next →</button>
  </div>`;
}

function v138PickerHtml(){
  const page=v140OrderPickerPageData();
  const picks=page.ui.picks;
  return `<div class="card">
    <div class="section-label">ADD TITLES</div>
    <input class="v138-picker-search" type="text" value="${escapeHtml(page.ui.search||'')}" placeholder="Search your Library…" oninput="App.v138OrderSearch(this.value)">
    <div id="v140-order-picker-tools">${v140OrderPickerToolsHtml(page)}</div>
    <div id="v138-order-picker-results" class="v138-picker-results">${v138PickerResultsHtml(page)}</div>
    <div id="v140-order-picker-pager">${v140OrderPagerHtml(page)}</div>
    <div class="v138-picker-actions">
      <span id="v138-order-pick-count" class="hint">${picks.size} selected</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button id="v138-order-add-selected" class="btn btn-sm btn-primary" type="button" ${picks.size?'':'disabled'} onclick="App.v138AddSelectedOrderTitles()">Add selected</button>
        <button id="v140-order-add-shown" class="btn btn-sm btn-ghost" type="button" ${page.rows.length?'':'disabled'} onclick="App.v138AddVisibleOrderTitles()">Add shown</button>
      </div>
    </div>
  </div>`;
}

function v138RefreshPickerDOM(){
  const page=v140OrderPickerPageData();

  const tools=document.getElementById('v140-order-picker-tools');
  if(tools)tools.innerHTML=v140OrderPickerToolsHtml(page);

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml(page);

  const pager=document.getElementById('v140-order-picker-pager');
  if(pager)pager.innerHTML=v140OrderPagerHtml(page);

  const picks=page.ui.picks;
  const count=document.getElementById('v138-order-pick-count');
  if(count)count.textContent=`${picks.size} selected`;

  const add=document.getElementById('v138-order-add-selected');
  if(add)add.disabled=picks.size===0;

  const shown=document.getElementById('v140-order-add-shown');
  if(shown)shown.disabled=page.rows.length===0;
}

function v138OrderSearch(value){
  const ui=v140EnsureOrderPickerUI();
  ui.search=String(value||'');
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderSetFilter(key,value){
  const ui=v140EnsureOrderPickerUI();
  if(!['sort','status','priority'].includes(String(key)))return;
  ui[key]=String(value||'all').toLowerCase();
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderToggleCategory(id,on){
  const ui=v140EnsureOrderPickerUI();
  const set=new Set(ui.categories||[]);
  const sid=String(id||'');
  if(on)set.add(sid);else set.delete(sid);
  ui.categories=[...set];
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderClearCategories(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderClearFilters(){
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.status='all';
  ui.priority='all';
  ui.sort='relevance';
  ui.page=0;
  v138RefreshPickerDOM();
}

function v140OrderSetPage(page){
  const ui=v140EnsureOrderPickerUI();
  ui.page=Math.max(0,Number(page)||0);
  v138RefreshPickerDOM();
  document.getElementById('v138-order-picker-results')?.scrollTo?.({top:0,behavior:'smooth'});
}


function renderOrder(){
  const p=v138EnsureOrderPlan();
  const items=v138OrderedItems();
  const hiddenCount=p.hiddenCategories.length;
  const custom=p.categoryMode==='custom';

  return `<div class="v138-order-view">
    <div class="view-head">
      <div>
        <h1>Order</h1>
        <p>Arrange what you want to consume next without changing MediaFlow recommendations.</p>
      </div>
      ${items.length?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}
    </div>

    <div class="v138-order-note">
      <span>📝</span>
      <div><strong>Personal planning only.</strong> Order does not affect scheduler scoring, History, progress, Statistics or XP. It is simply your saved “this first, then this” list.</div>
    </div>

    <div class="v138-order-toolbar">
      <div class="v138-order-switch">
        <button type="button" class="btn btn-sm ${p.viewMode==='all'?'btn-primary':''}" onclick="App.v138SetOrderView('all')">All Titles</button>
        <button type="button" class="btn btn-sm ${p.viewMode==='category'?'btn-primary':''}" onclick="App.v138SetOrderView('category')">By Category</button>
      </div>
      <div class="v138-order-summary">
        <b>${items.length}</b> ordered title${items.length===1?'':'s'}
        ${p.viewMode==='category'?`· ${custom?'Custom category order':'Settings category order'}${hiddenCount?` · ${hiddenCount} hidden categor${hiddenCount===1?'y':'ies'}`:''}`:''}
      </div>
    </div>

    <div class="v138-order-grid">
      <div class="v138-order-main">
        ${p.viewMode==='category'?v138ByCategoryHtml():v138AllTitlesHtml()}
      </div>
      <div class="v138-order-side">
        ${v138PickerHtml()}
        ${p.viewMode==='category'?`<div style="height:14px"></div>${v138CategoryManagerHtml()}`:''}
      </div>
    </div>
  </div>`;
}

function v138RefreshPickerDOM(){
  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml();
  const count=document.getElementById('v138-order-pick-count');
  const picks=S.orderPlannerUI?.picks instanceof Set?S.orderPlannerUI.picks:new Set();
  if(count)count.textContent=`${picks.size} selected`;
  const add=document.getElementById('v138-order-add-selected');
  if(add)add.disabled=picks.size===0;
}

function v138OrderSearch(value){
  v138EnsureOrderPlan();
  S.orderPlannerUI.search=String(value||'');
  v138RefreshPickerDOM();
}

function v138ToggleOrderPick(id,checked){
  v138EnsureOrderPlan();
  const sid=String(id);
  if(checked)S.orderPlannerUI.picks.add(sid);
  else S.orderPlannerUI.picks.delete(sid);
  v138RefreshPickerDOM();
}

function v138AddSelectedOrderTitles(){
  const p=v138EnsureOrderPlan();
  const picks=S.orderPlannerUI.picks;
  if(!(picks instanceof Set)||!picks.size)return;

  const existing=new Set(p.titleIds.map(String));
  const selected=new Set([...picks].map(String));
  for(const item of (S.library||[])){
    const id=String(item?.id||'');
    if(id&&selected.has(id)&&!existing.has(id)){
      p.titleIds.push(id);
      existing.add(id);
    }
  }

  S.orderPlannerUI.picks.clear();
  S.orderPlannerUI.search='';
  S.orderPlannerUI.page=0;
  v138TouchOrderPlan();
  render();
  showToast('Titles added to Order ✓');
}

function v138AddVisibleOrderTitles(){
  const p=v138EnsureOrderPlan();
  const page=v140OrderPickerPageData();
  const existing=new Set(p.titleIds.map(String));
  let added=0;

  // v140: "Add shown" means the titles on the current visible page,
  // not every match across hundreds/thousands of filtered results.
  for(const item of page.rows){
    const id=String(item?.id||'');
    if(id&&!existing.has(id)){
      p.titleIds.push(id);
      existing.add(id);
      added++;
    }
  }

  if(!added){showToast('No new titles on this page to add.');return;}
  S.orderPlannerUI.picks.clear();
  v138TouchOrderPlan();
  render();
  showToast(`${added} shown title${added===1?'':'s'} added to Order ✓`);
}

function v138RemoveOrderTitle(id){
  const p=v138EnsureOrderPlan();
  const sid=String(id);
  const before=p.titleIds.length;
  p.titleIds=p.titleIds.filter(x=>String(x)!==sid);
  if(p.titleIds.length===before)return;
  S.orderPlannerUI?.picks?.delete?.(sid);
  v138TouchOrderPlan();
  render();
}

function v138ClearOrder(){
  if(!confirm('Clear every title from your Order? This does not delete anything from Library.'))return;
  const p=v138EnsureOrderPlan();
  p.titleIds=[];
  S.orderPlannerUI?.picks?.clear?.();
  v138TouchOrderPlan();
  render();
  showToast('Order cleared');
}

function v138SetOrderView(mode){
  const p=v138EnsureOrderPlan();
  const next=mode==='category'?'category':'all';
  if(p.viewMode===next)return;
  p.viewMode=next;
  v138TouchOrderPlan();
  render();
}

function v138MoveTitle(id,direction){
  const p=v138EnsureOrderPlan();
  const sid=String(id);
  const idx=p.titleIds.indexOf(sid);
  const next=idx+Number(direction||0);
  if(idx<0||next<0||next>=p.titleIds.length)return;
  [p.titleIds[idx],p.titleIds[next]]=[p.titleIds[next],p.titleIds[idx]];
  v138TouchOrderPlan();
  render();
}

function v138MoveTitleInCategory(id,catId,direction){
  const p=v138EnsureOrderPlan();
  const sid=String(id),cid=String(catId);
  const positions=[];
  for(let i=0;i<p.titleIds.length;i++){
    const item=v138OrderItem(p.titleIds[i]);
    if(String(item?.categoryId||'')===cid)positions.push(i);
  }

  const subset=positions.map(i=>p.titleIds[i]);
  const idx=subset.indexOf(sid);
  const next=idx+Number(direction||0);
  if(idx<0||next<0||next>=subset.length)return;

  [subset[idx],subset[next]]=[subset[next],subset[idx]];
  positions.forEach((pos,i)=>{p.titleIds[pos]=subset[i];});
  v138TouchOrderPlan();
  render();
}

function v138ReorderGlobalBefore(sourceId,targetId){
  const p=v138EnsureOrderPlan();
  const source=String(sourceId),target=String(targetId);
  if(source===target)return false;
  const from=p.titleIds.indexOf(source),to=p.titleIds.indexOf(target);
  if(from<0||to<0)return false;

  p.titleIds.splice(from,1);
  let insertAt=p.titleIds.indexOf(target);
  if(insertAt<0)insertAt=p.titleIds.length;
  p.titleIds.splice(insertAt,0,source);
  return true;
}

function v138ReorderCategoryBefore(sourceId,targetId,catId){
  const p=v138EnsureOrderPlan();
  const source=String(sourceId),target=String(targetId),cid=String(catId);
  if(source===target)return false;

  const positions=[];
  for(let i=0;i<p.titleIds.length;i++){
    if(String(v138OrderItem(p.titleIds[i])?.categoryId||'')===cid)positions.push(i);
  }

  const subset=positions.map(i=>p.titleIds[i]);
  const from=subset.indexOf(source),to=subset.indexOf(target);
  if(from<0||to<0)return false;

  subset.splice(from,1);
  let insertAt=subset.indexOf(target);
  if(insertAt<0)insertAt=subset.length;
  subset.splice(insertAt,0,source);
  positions.forEach((pos,i)=>{p.titleIds[pos]=subset[i];});
  return true;
}

function v138OrderDragStart(event,id,catId){
  v138EnsureOrderPlan();
  S.orderPlannerUI.dragTitleId=String(id);
  S.orderPlannerUI.dragCategoryId=String(catId||'');
  try{
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',String(id));
  }catch(_){}
  event.currentTarget?.classList?.add('v138-dragging');
}

function v138OrderDragEnd(event){
  event.currentTarget?.classList?.remove('v138-dragging');
  if(S.orderPlannerUI){
    S.orderPlannerUI.dragTitleId='';
    S.orderPlannerUI.dragCategoryId='';
  }
}

function v138OrderDragOver(event){
  event.preventDefault();
  try{event.dataTransfer.dropEffect='move';}catch(_){}
}

function v138OrderDrop(event,targetId,catId){
  event.preventDefault();
  const source=String(S.orderPlannerUI?.dragTitleId||'');
  const sourceCat=String(S.orderPlannerUI?.dragCategoryId||'');
  const target=String(targetId||'');
  const targetCat=String(catId||'');
  if(!source||!target||source===target)return;

  let changed=false;
  if(targetCat){
    if(sourceCat!==targetCat)return;
    changed=v138ReorderCategoryBefore(source,target,targetCat);
  }else{
    changed=v138ReorderGlobalBefore(source,target);
  }

  if(changed){
    v138TouchOrderPlan();
    render();
  }
}

function v138SetCategoryMode(mode){
  const p=v138EnsureOrderPlan();
  const next=mode==='custom'?'custom':'default';
  if(p.categoryMode===next)return;
  p.categoryMode=next;

  if(next==='custom'){
    const current=(S.categories||[]).map(c=>String(c.id));
    const valid=new Set(current);
    p.categoryOrder=p.categoryOrder.filter(id=>valid.has(String(id)));
    for(const id of current)if(!p.categoryOrder.includes(id))p.categoryOrder.push(id);
  }

  v138TouchOrderPlan();
  render();
}

function v138ToggleOrderCategory(catId){
  const p=v138EnsureOrderPlan();
  const id=String(catId);
  const hidden=new Set(p.hiddenCategories.map(String));
  if(hidden.has(id))hidden.delete(id);
  else hidden.add(id);
  p.hiddenCategories=[...hidden];
  v138TouchOrderPlan();
  render();
}

function v138MoveCategory(catId,direction){
  const p=v138EnsureOrderPlan();
  if(p.categoryMode!=='custom')return;

  const ids=v138CategoryDisplayOrder();
  const id=String(catId);
  const idx=ids.indexOf(id),next=idx+Number(direction||0);
  if(idx<0||next<0||next>=ids.length)return;

  [ids[idx],ids[next]]=[ids[next],ids[idx]];
  p.categoryOrder=ids;
  v138TouchOrderPlan();
  render();
}

function v138CategoryDragStart(event,catId){
  const p=v138EnsureOrderPlan();
  if(p.categoryMode!=='custom')return;
  S.orderPlannerUI.dragCategoryFrom=String(catId);
  try{
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',String(catId));
  }catch(_){}
  event.currentTarget?.classList?.add('v138-dragging');
}

function v138CategoryDragEnd(event){
  event.currentTarget?.classList?.remove('v138-dragging');
  if(S.orderPlannerUI)S.orderPlannerUI.dragCategoryFrom='';
}

function v138CategoryDrop(event,targetId){
  event.preventDefault();
  const p=v138EnsureOrderPlan();
  if(p.categoryMode!=='custom')return;

  const source=String(S.orderPlannerUI?.dragCategoryFrom||'');
  const target=String(targetId||'');
  if(!source||!target||source===target)return;

  const ids=v138CategoryDisplayOrder();
  const from=ids.indexOf(source),to=ids.indexOf(target);
  if(from<0||to<0)return;

  ids.splice(from,1);
  let insertAt=ids.indexOf(target);
  if(insertAt<0)insertAt=ids.length;
  ids.splice(insertAt,0,source);

  p.categoryOrder=ids;
  v138TouchOrderPlan();
  render();
}

// ---- Navigation ------------------------------------------------------------
ICONS.order=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>`;
if(!NAV_ITEMS.some(n=>n.id==='order')){
  const libIndex=NAV_ITEMS.findIndex(n=>n.id==='library');
  NAV_ITEMS.splice(libIndex>=0?libIndex+1:1,0,{id:'order',label:'Order'});
}
if(!MOBILE_MORE_NAV.includes('order'))MOBILE_MORE_NAV.unshift('order');

// Final renderView wrapper: no changes to any existing view.
const v138RenderViewBase=renderView;
renderView=function(){
  if(S.view==='order'){
    const root=document.getElementById('view-root');
    if(!root)return;
    root.innerHTML=`<div class="fade-in">${renderOrder()}</div>`;
    return;
  }
  return v138RenderViewBase();
};

// ---- Persistence -----------------------------------------------------------
// Every regular save/full JSON backup now carries Order.
const v138SnapshotBase=snapshot;
snapshot=function(){
  S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
  const x=v138SnapshotBase();
  x.orderPlan=JSON.parse(JSON.stringify(S.orderPlan));
  return x;
};

// Sync/restore application path.
const v138ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  v138ApplyStateBase(d);
  S.orderPlan=v138NormalizeOrderPlan(d?.orderPlan,S.library,S.categories);
};

// Cloud merge: sequence data cannot be meaningfully field-merged, so the most
// recently edited complete planner wins. Missing planner data never erases one.
const v138MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v138MergeStatesBase(a,b)||{};
  const ap=a?.orderPlan&&typeof a.orderPlan==='object'?a.orderPlan:null;
  const bp=b?.orderPlan&&typeof b.orderPlan==='object'?b.orderPlan:null;

  let chosen=null;
  if(ap&&bp){
    chosen=(Number(ap.modifiedAt)||0)>=(Number(bp.modifiedAt)||0)?ap:bp;
  }else{
    chosen=ap||bp||null;
  }

  out.orderPlan=v138NormalizeOrderPlan(chosen,out.library||S.library,out.categories||S.categories);
  return out;
};

// Make sure a title/category deletion is cleaned from the in-memory planner the
// next time Order opens, while snapshot() also strips stale IDs on every save.
const v138SetViewBase=App.setView;
App.setView=function(v){
  if(v==='order')v138EnsureOrderPlan();
  return v138SetViewBase.call(this,v);
};

Object.assign(App,{
  v138OrderSearch,
  v138ToggleOrderPick,
  v138AddSelectedOrderTitles,
  v138AddVisibleOrderTitles,
  v138RemoveOrderTitle,
  v138ClearOrder,
  v138SetOrderView,
  v138MoveTitle,
  v138MoveTitleInCategory,
  v138OrderDragStart,
  v138OrderDragEnd,
  v138OrderDragOver,
  v138OrderDrop,
  v138SetCategoryMode,
  v138ToggleOrderCategory,
  v138MoveCategory,
  v138CategoryDragStart,
  v138CategoryDragEnd,
  v138CategoryDrop
});


/* ============================================================
   MediaFlow v139 — Prioritize Personal Order for recommendations
   ------------------------------------------------------------
   This feature is intentionally narrow:
   - category selection remains the normal MediaFlow scheduler;
   - suggested amount remains unchanged;
   - balance/health/reasons remain unchanged;
   - only the exact recommended title can be sourced from Personal Order;
   - if no eligible ordered title exists in the selected category, the
     original MediaFlow title scorer is used as fallback.
   ============================================================ */

App.togglePrioritizePersonalOrder=function(){
  S.settings=S.settings||{};
  S.settings.prioritizePersonalOrder=!S.settings.prioritizePersonalOrder;

  // If a task is already active and exact-title recommendations are enabled,
  // immediately refresh only its title recommendation. The task category,
  // amount, reasons, balance and other scheduler data are left untouched.
  if(S.sessionActive && S.currentTask && S.settings.exactTitleRecommendations){
    const cat=getCategory(S.currentTask.categoryId);
    const picked=cat?pickLibraryTitle(cat):null;
    S.currentTask.libraryId=picked?picked.id:null;
    S.currentTask.title=picked?cleanTitle(picked.title):null;
    persistTask();
  }

  persistSettings();
  render();
};


/* ============================================================
   MediaFlow v140 — Order Library picker controls
   ============================================================ */
Object.assign(App,{
  v140OrderSetFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v140OrderClearFilters,
  v140OrderSetPage
});

// v138 exported these before v140 replaced their implementation.
// Rebind them so inline controls always use the current picker behavior.
App.v138OrderSearch=v138OrderSearch;
App.v138ToggleOrderPick=v138ToggleOrderPick;
App.v138AddSelectedOrderTitles=v138AddSelectedOrderTitles;
App.v138AddVisibleOrderTitles=v138AddVisibleOrderTitles;


/* ============================================================
   MediaFlow v141 — Fast Order pagination + active-page fix
   ============================================================ */

let V141_ORDER_PICKER_CACHE={key:'',candidates:null};

function v141InvalidateOrderPickerCache(){
  V141_ORDER_PICKER_CACHE={key:'',candidates:null};
}

function v141OrderPickerCacheKey(){
  const ui=v140EnsureOrderPickerUI();
  const plan=v138EnsureOrderPlan();

  // Page and checkbox selection are intentionally excluded: neither changes
  // the filtered/sorted candidate set.
  return JSON.stringify([
    String(ui.search||'').trim().toLowerCase(),
    [...(ui.categories||[])].map(String).sort(),
    String(ui.status||'all'),
    String(ui.priority||'all'),
    String(ui.sort||'relevance'),
    Number(plan.modifiedAt)||0,
    (S.library||[]).length,
    (S.categories||[]).length
  ]);
}

// Capture the real v140 filtering implementation once, then cache its output.
const v141PickerMatchesBase=v138PickerMatches;
v138PickerMatches=function(){
  const key=v141OrderPickerCacheKey();
  if(V141_ORDER_PICKER_CACHE.key===key && Array.isArray(V141_ORDER_PICKER_CACHE.candidates)){
    return V141_ORDER_PICKER_CACHE.candidates;
  }

  const candidates=v141PickerMatchesBase();
  V141_ORDER_PICKER_CACHE={key,candidates};
  return candidates;
};

function v141UpdateOrderPickerSelectionUI(){
  const ui=v140EnsureOrderPickerUI();
  const count=document.getElementById('v138-order-pick-count');
  if(count)count.textContent=`${ui.picks.size} selected`;

  const add=document.getElementById('v138-order-add-selected');
  if(add)add.disabled=ui.picks.size===0;
}

function v141UpdateOrderPickerMatchline(page){
  const line=document.querySelector('#v140-order-picker-tools .v140-order-matchline');
  if(line){
    line.textContent=`${page.candidates.length.toLocaleString()} match${page.candidates.length===1?'':'es'} · Page ${page.ui.page+1}/${page.pages}`;
  }
}

function v141RefreshOrderPickerPageOnly(){
  const page=v140OrderPickerPageData();

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml(page);

  const pager=document.getElementById('v140-order-picker-pager');
  if(pager)pager.innerHTML=v140OrderPagerHtml(page);

  v141UpdateOrderPickerMatchline(page);
  v141UpdateOrderPickerSelectionUI();

  const shown=document.getElementById('v140-order-add-shown');
  if(shown)shown.disabled=page.rows.length===0;

  return page;
}

function v141RefreshOrderPickerAll(){
  const page=v140OrderPickerPageData();

  const tools=document.getElementById('v140-order-picker-tools');
  if(tools)tools.innerHTML=v140OrderPickerToolsHtml(page);

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.innerHTML=v138PickerResultsHtml(page);

  const pager=document.getElementById('v140-order-picker-pager');
  if(pager)pager.innerHTML=v140OrderPagerHtml(page);

  v141UpdateOrderPickerSelectionUI();

  const shown=document.getElementById('v140-order-add-shown');
  if(shown)shown.disabled=page.rows.length===0;

  return page;
}

// Override the stale later v138 declaration from v140.
v138RefreshPickerDOM=function(){
  return v141RefreshOrderPickerAll();
};

// Search/filter changes genuinely change the candidate set, so invalidate once.
v138OrderSearch=function(value){
  const ui=v140EnsureOrderPickerUI();
  ui.search=String(value||'');
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderSetFilter=function(key,value){
  const ui=v140EnsureOrderPickerUI();
  if(!['sort','status','priority'].includes(String(key)))return;
  ui[key]=String(value||'all').toLowerCase();
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderToggleCategory=function(id,on){
  const ui=v140EnsureOrderPickerUI();
  const set=new Set(ui.categories||[]);
  const sid=String(id||'');
  if(on)set.add(sid);else set.delete(sid);
  ui.categories=[...set];
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderClearCategories=function(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

v140OrderClearFilters=function(){
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.status='all';
  ui.priority='all';
  ui.sort='relevance';
  ui.page=0;
  v141InvalidateOrderPickerCache();
  v141RefreshOrderPickerAll();
};

// Page navigation is intentionally lightweight:
// no full Library filtering/sorting and no filter-bar reconstruction.
v140OrderSetPage=function(page){
  const ui=v140EnsureOrderPickerUI();
  const next=Math.max(0,Number(page)||0);
  if(next===ui.page)return;

  ui.page=next;
  const current=v141RefreshOrderPickerPageOnly();

  const box=document.getElementById('v138-order-picker-results');
  if(box)box.scrollTop=0;

  return current;
};

// Checking a title does not need to rebuild the page at all.
v138ToggleOrderPick=function(id,checked){
  const ui=v140EnsureOrderPickerUI();
  const sid=String(id);
  if(checked)ui.picks.add(sid);
  else ui.picks.delete(sid);
  v141UpdateOrderPickerSelectionUI();
};

// A full Order render may follow Library edits/imports/deletes.
// Drop the cached candidate list so those changes are reflected immediately.
const v141RenderOrderBase=renderOrder;
renderOrder=function(){
  v141InvalidateOrderPickerCache();
  return v141RenderOrderBase();
};

// Rebind every inline action to the v141 implementations.
Object.assign(App,{
  v138OrderSearch,
  v138ToggleOrderPick,
  v140OrderSetFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v140OrderClearFilters,
  v140OrderSetPage
});


/* ============================================================
   MediaFlow v142 — Order import/export + clear recovery
   ============================================================ */

function v142OrderSnapshotFrom(plan){
  const p=plan||v138EnsureOrderPlan();
  return {
    titleIds:Array.isArray(p.titleIds)?p.titleIds.map(String):[],
    viewMode:p.viewMode==='category'?'category':'all',
    categoryMode:p.categoryMode==='custom'?'custom':'default',
    categoryOrder:Array.isArray(p.categoryOrder)?p.categoryOrder.map(String):[],
    hiddenCategories:Array.isArray(p.hiddenCategories)?p.hiddenCategories.map(String):[],
    savedAt:Date.now()
  };
}

function v142NormalizeSavedOrderSnapshot(raw,library,categories){
  if(!raw || typeof raw!=='object' || Array.isArray(raw))return null;

  const lib=Array.isArray(library)?library:(S.library||[]);
  const cats=Array.isArray(categories)?categories:(S.categories||[]);
  const libIds=new Set(lib.filter(i=>i?.id).map(i=>String(i.id)));
  const catIds=new Set(cats.filter(c=>c?.id).map(c=>String(c.id)));

  const unique=(arr,allowed)=>{
    const out=[],seen=new Set();
    for(const value of (Array.isArray(arr)?arr:[])){
      const id=String(value||'');
      if(!id||seen.has(id)||(allowed&&!allowed.has(id)))continue;
      seen.add(id);out.push(id);
    }
    return out;
  };

  const titleIds=unique(raw.titleIds,libIds);
  if(!titleIds.length)return null;

  let categoryOrder=unique(raw.categoryOrder,catIds);
  for(const c of cats){
    const id=String(c?.id||'');
    if(id&&!categoryOrder.includes(id))categoryOrder.push(id);
  }

  return {
    titleIds,
    viewMode:raw.viewMode==='category'?'category':'all',
    categoryMode:raw.categoryMode==='custom'?'custom':'default',
    categoryOrder,
    hiddenCategories:unique(raw.hiddenCategories,catIds),
    savedAt:Math.max(0,Number(raw.savedAt)||Date.now())
  };
}

// Preserve the recovery snapshot through every existing Order normalize/save/
// cloud-sync/full-backup path without changing v138's canonical planner format.
const v142NormalizeOrderPlanBase=v138NormalizeOrderPlan;
v138NormalizeOrderPlan=function(plan,library,categories){
  const out=v142NormalizeOrderPlanBase(plan,library,categories);
  out.lastClearedOrder=v142NormalizeSavedOrderSnapshot(
    plan?.lastClearedOrder,
    Array.isArray(library)?library:(S.library||[]),
    Array.isArray(categories)?categories:(S.categories||[])
  );
  return out;
};

function v142OrderExportPayload(){
  const p=v138EnsureOrderPlan();
  const titleSet=new Set(p.titleIds.map(String));
  const titles=[];

  for(const id of p.titleIds){
    const item=v138OrderItem(id);
    if(!item)continue;
    const cat=v138OrderCategory(item.categoryId);
    titles.push({
      id:String(item.id),
      title:cleanTitle(item.title),
      categoryId:String(item.categoryId||''),
      categoryName:cat?.name||'',
      externalIds:Object.assign({},item.externalIds||{})
    });
  }

  const categories=(S.categories||[]).map(c=>({
    id:String(c?.id||''),
    name:String(c?.name||'')
  })).filter(c=>c.id);

  return {
    format:'MediaFlowOrder',
    formatVersion:1,
    mediaFlowVersion:142,
    exportedAt:new Date().toISOString(),
    orderPlan:{
      titleIds:[...titleSet],
      viewMode:p.viewMode,
      categoryMode:p.categoryMode,
      categoryOrder:[...(p.categoryOrder||[])],
      hiddenCategories:[...(p.hiddenCategories||[])]
    },
    titles,
    categories
  };
}

function v142ExportOrder(){
  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    showToast('Your Order is empty.');
    return;
  }

  const payload=v142OrderExportPayload();
  const stamp=new Date().toISOString().slice(0,10);
  triggerDownload(
    new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),
    `MediaFlow_Order_${stamp}.json`
  );
  showToast(`${payload.titles.length.toLocaleString()} ordered title${payload.titles.length===1?'':'s'} exported ✓`);
}

function v142PickOrderImport(){
  document.getElementById('v142-order-import-file')?.click();
}

function v142NormalizeTitleKey(value){
  return cleanTitle(value||'').trim().toLowerCase();
}

function v142MapImportedCategoryId(importedId,importedCategories){
  const id=String(importedId||'');
  if(id && (S.categories||[]).some(c=>String(c?.id||'')===id))return id;

  const source=(importedCategories||[]).find(c=>String(c?.id||'')===id);
  const name=String(source?.name||'').trim().toLowerCase();
  if(!name)return '';
  return String((S.categories||[]).find(c=>String(c?.name||'').trim().toLowerCase()===name)?.id||'');
}

function v142FindImportedOrderItem(descriptor){
  if(!descriptor)return null;

  const direct=(S.library||[]).find(i=>String(i?.id||'')===String(descriptor.id||''));
  if(direct)return direct;

  const ext=descriptor.externalIds&&typeof descriptor.externalIds==='object'?descriptor.externalIds:{};
  const extEntries=Object.entries(ext).filter(([,v])=>v!==null&&v!==undefined&&String(v)!=='');
  if(extEntries.length){
    const byExt=(S.library||[]).find(item=>
      extEntries.some(([k,v])=>item?.externalIds?.[k]!=null && String(item.externalIds[k])===String(v))
    );
    if(byExt)return byExt;
  }

  const titleKey=v142NormalizeTitleKey(descriptor.title);
  if(!titleKey)return null;

  const all=(S.library||[]).filter(i=>v142NormalizeTitleKey(i?.title)===titleKey);
  if(!all.length)return null;

  const mappedCategory=v142MapImportedCategoryId(descriptor.categoryId,descriptor._categories||[]);
  if(mappedCategory){
    const byCategory=all.find(i=>String(i?.categoryId||'')===mappedCategory);
    if(byCategory)return byCategory;
  }

  if(descriptor.categoryName){
    const name=String(descriptor.categoryName).trim().toLowerCase();
    const byName=all.find(i=>String(v138OrderCategory(i?.categoryId)?.name||'').trim().toLowerCase()===name);
    if(byName)return byName;
  }

  return all.length===1?all[0]:null;
}

async function v142ImportOrder(file){
  if(!file)return;

  try{
    const text=await file.text();
    const data=JSON.parse(text);

    const rawPlan=(data?.orderPlan&&typeof data.orderPlan==='object')
      ? data.orderPlan
      : (Array.isArray(data?.titleIds)?data:null);if(!rawPlan || !Array.isArray(rawPlan.titleIds)){
      throw new Error('This is not a MediaFlow Order export.');
    }

    const importedCategories=Array.isArray(data?.categories)?data.categories:[];
    const descriptors=Array.isArray(data?.titles)?data.titles:[];
    const descById=new Map(
      descriptors
        .filter(x=>x&&x.id!=null)
        .map(x=>[String(x.id),Object.assign({_categories:importedCategories},x)])
    );

    const currentById=new Map(
      (S.library||[]).filter(i=>i?.id).map(i=>[String(i.id),i])
    );

    const resolved=[],seen=new Set();
    let skipped=0;

    for(const rawId of rawPlan.titleIds){
      const id=String(rawId||'');
      let item=currentById.get(id)||null;

      if(!item){
        const descriptor=descById.get(id);
        if(descriptor)item=v142FindImportedOrderItem(descriptor);
      }

      if(!item?.id){
        skipped++;
        continue;
      }

      const itemId=String(item.id);
      if(seen.has(itemId))continue;
      seen.add(itemId);
      resolved.push(itemId);
    }

    if(!resolved.length){
      throw new Error('None of the exported titles could be matched to your current Library.');
    }

    const p=v138EnsureOrderPlan();

    // Keep one recoverable copy of the current plan before replacing it.
    if(p.titleIds.length){
      p.lastClearedOrder=v142OrderSnapshotFrom(p);
    }

    const mapCatList=(arr)=>{
      const out=[],used=new Set();
      for(const rawId of (Array.isArray(arr)?arr:[])){
        const mapped=v142MapImportedCategoryId(rawId,importedCategories);
        if(mapped&&!used.has(mapped)){used.add(mapped);out.push(mapped);}
      }
      return out;
    };

    const currentCatIds=(S.categories||[]).map(c=>String(c.id));
    let categoryOrder=mapCatList(rawPlan.categoryOrder);
    for(const id of currentCatIds)if(!categoryOrder.includes(id))categoryOrder.push(id);

    p.titleIds=resolved;
    p.viewMode=rawPlan.viewMode==='category'?'category':'all';
    p.categoryMode=rawPlan.categoryMode==='custom'?'custom':'default';
    p.categoryOrder=categoryOrder;
    p.hiddenCategories=mapCatList(rawPlan.hiddenCategories);
    p.modifiedAt=Date.now();

    S.orderPlannerUI?.picks?.clear?.();
    if(S.orderPlannerUI){
      S.orderPlannerUI.search='';
      S.orderPlannerUI.page=0;
    }

    await saveState();
    render();

    showToast(
      `Order imported: ${resolved.length.toLocaleString()} title${resolved.length===1?'':'s'}${skipped?` · ${skipped.toLocaleString()} unmatched skipped`:''} ✓`
    );
  }catch(err){
    console.error('Order import failed',err);
    showToast(err?.message||'Could not import that Order file.');
  }
}

function v142OrderClearConfirmHtml(){
  const p=v138EnsureOrderPlan();
  const count=p.titleIds.length;
  return `<div class="priority-modal">
    <div class="v142-order-confirm-icon">🧹</div>
    <div class="modal-title">Clear Personal Order?</div>
    <div class="v142-order-confirm-copy">
      You're about to remove <b>${count.toLocaleString()} title${count===1?'':'s'}</b> from your Personal Order.
    </div>
    <div class="v142-order-confirm-box">
      <b>Your Library will not be changed.</b><br>
      Titles, progress, History, XP and scheduler data stay untouched. MediaFlow will keep one recovery copy so you can restore this exact Order afterward.
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-danger" type="button" onclick="App.v142ConfirmClearOrder(this)">Clear Order</button>
    </div>
  </div>`;
}

function v142OpenClearOrderConfirm(){
  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    showToast('Your Order is already empty.');
    return;
  }

  const existing=document.getElementById('modal-root');
  if(existing)existing.remove();

  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.closeModal()"><div class="modal">${v142OrderClearConfirmHtml()}</div></div>`;
  document.body.appendChild(wrap);
}

async function v142ConfirmClearOrder(button){
  if(button?.dataset?.clearing==='1')return;
  if(button){button.dataset.clearing='1';button.disabled=true;}

  const p=v138EnsureOrderPlan();
  if(!p.titleIds.length){
    App.closeModal();
    return;
  }

  p.lastClearedOrder=v142OrderSnapshotFrom(p);
  p.titleIds=[];
  p.modifiedAt=Date.now();
  S.orderPlannerUI?.picks?.clear?.();

  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();
  S.modal=null;

  await saveState();
  render();
  showToast('Order cleared · Restore Last Order is available');
}

async function v142RestoreLastOrder(){
  const p=v138EnsureOrderPlan();
  const last=v142NormalizeSavedOrderSnapshot(p.lastClearedOrder,S.library,S.categories);
  if(!last?.titleIds?.length){
    p.lastClearedOrder=null;
    render();
    showToast('No cleared Order is available to restore.');
    return;
  }

  p.titleIds=[...last.titleIds];
  p.viewMode=last.viewMode;
  p.categoryMode=last.categoryMode;
  p.categoryOrder=[...last.categoryOrder];
  p.hiddenCategories=[...last.hiddenCategories];
  p.lastClearedOrder=null;
  p.modifiedAt=Date.now();

  S.orderPlannerUI?.picks?.clear?.();
  await saveState();
  render();
  showToast(`${p.titleIds.length.toLocaleString()} ordered title${p.titleIds.length===1?'':'s'} restored ✓`);
}

// Replace the old browser confirm() clear action with the designed MediaFlow modal.
v138ClearOrder=v142OpenClearOrderConfirm;
App.v138ClearOrder=v142OpenClearOrderConfirm;

// Add Order portability/recovery controls without disturbing v141's picker.
const v142RenderOrderBase=renderOrder;
renderOrder=function(){
  let h=v142RenderOrderBase();
  const p=v138EnsureOrderPlan();
  const count=p.titleIds.length;
  const canRestore=!!(p.lastClearedOrder?.titleIds?.length);

  const oldHead=`${count?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}`;
  const actions=`<div class="v142-order-head-actions">
    <button class="btn btn-ghost" type="button" onclick="App.v142ExportOrder()" ${count?'':'disabled'}>Export Order</button>
    <button class="btn btn-ghost" type="button" onclick="App.v142PickOrderImport()">Import Order</button>
    ${canRestore?`<button class="btn btn-ghost v142-order-restore" type="button" onclick="App.v142RestoreLastOrder()">Restore Last Order</button>`:''}
    ${count?`<button class="btn btn-ghost" type="button" onclick="App.v138ClearOrder()">Clear Order</button>`:''}
    <input id="v142-order-import-file" type="file" accept=".json,application/json" hidden onchange="App.v142ImportOrder(this.files?.[0]);this.value=''">
  </div>`;

  if(oldHead && h.includes(oldHead)){
    h=h.replace(oldHead,actions);
  }else{
    h=h.replace('</div>\n\n    <div class="v138-order-note">',actions+'</div>\n\n    <div class="v138-order-note">');
  }

  return h;
};

Object.assign(App,{
  v142ExportOrder,
  v142PickOrderImport,
  v142ImportOrder,
  v142ConfirmClearOrder,
  v142RestoreLastOrder
});


/* ============================================================
   MediaFlow v143 — Library bulk-action confirmations
   ------------------------------------------------------------
   v143 audit:
   - Empty Library already had a designed MediaFlow confirmation, so it is
     intentionally preserved unchanged.
   - Delete selected, Set status, Set priority and Move to previously executed
     immediately. They now require explicit designed confirmation.
   ============================================================ */

const v143BatchStatusBase=App.batchLibraryStatus;
const v143BatchPriorityBase=App.batchLibraryPriority;
const v143BatchCategoryBase=App.batchLibraryCategory;
const v143BatchDeleteBase=App.batchDeleteLibrary;

function v143SelectedLibraryCount(){
  return mfSelectedIds().length;
}

function v143StatusLabel(value){
  const map={
    planned:'Plan to Watch',
    active:'Watching',
    paused:'On Hold',
    completed:'Completed',
    dropped:'Dropped'
  };
  return map[String(value||'').toLowerCase()]||String(value||'');
}

function v143PriorityLabel(value){
  const map={low:'Low',medium:'Medium',high:'High'};
  return map[String(value||'').toLowerCase()]||String(value||'');
}

function v143LibraryBatchConfirmHtml(kind,value,count){
  const n=Math.max(0,Number(count)||0);
  const plural=n===1?'title':'titles';

  let icon='✓';
  let title='Confirm Library change';
  let action='Confirm';
  let target='';
  let description='';
  let detail='';
  let danger=false;

  if(kind==='status'){
    const label=v143StatusLabel(value);
    icon='◉';
    title='Change selected status?';
    action='Change status';
    target=label;
    description=`You are about to change the status of <b>${n.toLocaleString()} ${plural}</b>.`;
    detail=label==='Completed'
      ?'Titles changed to Completed will use MediaFlow’s existing completion behavior. Other selected titles keep their Library and History data.'
      :'Only the selected Library titles are affected. Your consumption History is not deleted.';
  }else if(kind==='priority'){
    const label=v143PriorityLabel(value);
    icon='◆';
    title='Change selected priority?';
    action='Change priority';
    target=label;
    description=`You are about to change the priority of <b>${n.toLocaleString()} ${plural}</b>.`;
    detail='This changes the selected Library titles only. History, progress and title ordering remain intact.';
  }else if(kind==='category'){
    const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(value||''));
    const label=cat?`${cat.icon||'📚'} ${cat.name}`:'Selected category';
    icon='↪';
    title='Move selected titles?';
    action='Move titles';
    target=label;
    description=`You are about to move <b>${n.toLocaleString()} ${plural}</b> to another category.`;
    detail='The titles stay in your Library. Progress and History remain intact; only their Library category changes.';
  }else if(kind==='delete'){
    icon='🗑️';
    title='Delete selected titles?';
    action='Delete selected';
    danger=true;
    description=`You are about to delete <b>${n.toLocaleString()} selected ${plural}</b> from your Library.`;
    detail='Consumption History remains intact. This Library batch change is tracked by Library History and can be undone from there.';
  }

  return `<div class="priority-modal v143-lib-confirm">
    <div class="v143-lib-confirm-icon">${icon}</div>
    <div class="modal-title">${escapeHtml(title)}</div>
    <div class="v143-lib-confirm-copy">${description}</div>
    <div class="v143-lib-confirm-box ${danger?'v143-lib-confirm-danger':''}">
      <b>${danger?'Library deletion':'Selected-title update'}</b><br>
      ${escapeHtml(detail)}
      ${target?`<div class="v143-lib-confirm-target">${escapeHtml(target)}</div>`:''}
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" type="button" onclick="App.v143CancelLibraryBatch()">Cancel</button>
      <button class="btn ${danger?'btn-danger':'btn-primary'}" type="button" onclick="App.v143ConfirmLibraryBatch(this)">${escapeHtml(action)}</button>
    </div>
  </div>`;
}

function v143OpenLibraryBatchConfirm(kind,value=''){
  const ids=mfSelectedIds();
  if(!ids.length){
    showToast('Select at least one Library title first.');
    return;
  }

  if(kind==='status'&&!['planned','active','paused','completed','dropped'].includes(String(value||'')))return;
  if(kind==='priority'&&!['low','medium','high'].includes(String(value||'')))return;
  if(kind==='category'&&!(S.categories||[]).some(c=>String(c?.id||'')===String(value||'')))return;
  if(kind!=='delete'&&!value)return;

  S.v143PendingLibraryBatch={
    kind:String(kind||''),
    value:String(value||''),
    ids:[...ids]
  };

  const existing=document.getElementById('modal-root');
  if(existing)existing.remove();

  const wrap=document.createElement('div');
  wrap.id='modal-root';
  wrap.innerHTML=`<div class="modal-overlay" onclick="if(event.target===this) App.v143CancelLibraryBatch()"><div class="modal">${v143LibraryBatchConfirmHtml(kind,value,ids.length)}</div></div>`;
  document.body.appendChild(wrap);
}

function v143CancelLibraryBatch(){
  S.v143PendingLibraryBatch=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();
}

function v143RestorePendingSelection(ids){
  const valid=new Set((S.library||[]).map(i=>String(i?.id||'')));
  S.librarySelection=S.librarySelection||{};
  for(const key of Object.keys(S.librarySelection))S.librarySelection[key]=false;
  for(const id of (ids||[])){
    const sid=String(id||'');
    if(valid.has(sid))S.librarySelection[sid]=true;
  }
}

async function v143ConfirmLibraryBatch(button){
  if(button?.dataset?.working==='1')return;
  if(button){
    button.dataset.working='1';
    button.disabled=true;
  }

  const pending=S.v143PendingLibraryBatch;
  if(!pending){
    v143CancelLibraryBatch();
    return;
  }

  // Apply to the exact selection the user confirmed, even if some other UI
  // refresh happened while the dialog was open.
  v143RestorePendingSelection(pending.ids);

  const kind=pending.kind;
  const value=pending.value;
  const count=mfSelectedIds().length;

  S.v143PendingLibraryBatch=null;
  const modal=document.getElementById('modal-root');
  if(modal)modal.remove();

  if(!count){
    showToast('The selected titles are no longer available.');
    render();
    return;
  }

  if(kind==='status'){
    v143BatchStatusBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} changed to ${v143StatusLabel(value)} ✓`);
  }else if(kind==='priority'){
    v143BatchPriorityBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} priority changed to ${v143PriorityLabel(value)} ✓`);
  }else if(kind==='category'){
    const cat=(S.categories||[]).find(c=>String(c?.id||'')===String(value));
    v143BatchCategoryBase.call(App,value);
    showToast(`${count.toLocaleString()} ${count===1?'title':'titles'} moved to ${cat?.name||'category'} ✓`);
  }else if(kind==='delete'){
    v143BatchDeleteBase.call(App);
  }
}

// Final wrappers used by every Library bulk-control variant.
App.batchLibraryStatus=function(value){
  v143OpenLibraryBatchConfirm('status',value);
};
App.batchLibraryPriority=function(value){
  v143OpenLibraryBatchConfirm('priority',value);
};
App.batchLibraryCategory=function(value){
  v143OpenLibraryBatchConfirm('category',value);
};
App.batchDeleteLibrary=function(){
  v143OpenLibraryBatchConfirm('delete','');
};

Object.assign(App,{
  v143ConfirmLibraryBatch,
  v143CancelLibraryBatch
});


/* ============================================================
   MediaFlow v144 — Reusable Category Icon & Color Palettes
   ============================================================ */

function v144SafeIconUrl(raw){
  const value=String(raw||'').trim();
  if(!value)return '';
  try{
    const u=new URL(value);
    if(u.protocol!=='http:'&&u.protocol!=='https:')return '';
    return value;
  }catch(_){
    return '';
  }
}

function v144CategoryIconText(cat){
  if(cat?.iconUrl && v144SafeIconUrl(cat.iconUrl))return '🖼️';
  return String(cat?.icon||'📚');
}

function v144CategoryIconHtml(cat){
  const url=v144SafeIconUrl(cat?.iconUrl);
  if(url){
    return `<img class="v144-cat-icon-img" src="${escapeHtml(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-block'"><span class="v144-cat-icon-emoji" style="display:none">🖼️</span>`;
  }
  return `<span class="v144-cat-icon-emoji">${escapeHtml(cat?.icon||'📚')}</span>`;
}

function v144NormalizeCustomCategoryIcons(){
  const raw=Array.isArray(S.settings?.customCategoryIcons)?S.settings.customCategoryIcons:[];
  const out=[],seen=new Set();

  for(const row of raw){
    if(!row||typeof row!=='object')continue;
    const type=row.type==='url'?'url':'emoji';
    let value=String(row.value||'').trim();

    if(type==='url'){
      value=v144SafeIconUrl(value);
      if(!value)continue;
    }else{
      if(!value)continue;
      value=Array.from(value).slice(0,12).join('');
    }

    const key=`${type}:${value}`;
    if(seen.has(key))continue;
    seen.add(key);
    out.push({type,value});
  }

  S.settings.customCategoryIcons=out;
  return out;
}

function v144NormalizeCustomCategoryColors(){
  const raw=Array.isArray(S.settings?.customCategoryColors)?S.settings.customCategoryColors:[];
  const out=[],seen=new Set();

  for(let value of raw){
    value=String(value||'').trim().toUpperCase();
    if(/^#[0-9A-F]{3}$/.test(value)){
      value='#'+value.slice(1).split('').map(x=>x+x).join('');
    }
    if(!/^#[0-9A-F]{6}$/.test(value)||seen.has(value))continue;
    seen.add(value);
    out.push(value);
  }

  S.settings.customCategoryColors=out;
  return out;
}

function v144IconSwatchHtml(type,value,selectedEmoji,selectedUrl,customIndex=null){
  const isUrl=type==='url';
  const selected=isUrl
    ? String(selectedUrl||'')===String(value)
    : !selectedUrl && String(selectedEmoji||'')===String(value);

  const visual=isUrl
    ? `<img src="${escapeHtml(value)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span style="display:none">🖼️</span>`
    : escapeHtml(value);

  const dataAttr=isUrl
    ? `data-v144-icon-url="${escapeHtml(value)}"`
    : `data-v144-icon-emoji="${escapeHtml(value)}"`;

  const click=isUrl
    ? `App.v144PickCategoryIconUrl(this.dataset.v144IconUrl)`
    : `App.v144PickCategoryEmoji(this.dataset.v144IconEmoji)`;

  return `<span class="v144-icon-swatch">
    <button type="button" class="v144-swatch-main ${selected?'selected':''}" ${dataAttr} onclick="${click}" data-v144-icon-swatch="1" title="${isUrl?'URL icon':escapeHtml(value)}">${visual}</button>
    ${customIndex!==null?`<button type="button" class="v144-remove-swatch" onclick="event.stopPropagation();App.v144RemoveCustomCategoryIcon(${customIndex})" title="Remove saved icon">×</button>`:''}
  </span>`;
}

function v144CustomIconsHtml(selectedEmoji,selectedUrl,current){
  const custom=v144NormalizeCustomCategoryIcons();
  const rows=custom.map((x,i)=>v144IconSwatchHtml(x.type,x.value,selectedEmoji,selectedUrl,i));

  // If an edited category uses a custom icon that is not in the saved palette,
  // keep it visible as a current swatch without silently saving it.
  if(current?.iconUrl){
    const url=v144SafeIconUrl(current.iconUrl);
    if(url&&!custom.some(x=>x.type==='url'&&x.value===url)){
      rows.unshift(v144IconSwatchHtml('url',url,selectedEmoji,selectedUrl,null));
    }
  }else if(current?.icon && !ICON_CHOICES.includes(current.icon)){
    if(!custom.some(x=>x.type==='emoji'&&x.value===current.icon)){
      rows.unshift(v144IconSwatchHtml('emoji',current.icon,selectedEmoji,selectedUrl,null));
    }
  }

  return rows.length
    ? rows.join('')
    : `<span class="hint">No custom icons saved yet.</span>`;
}

function v144ColorSwatchHtml(color,selected,customIndex=null){
  return `<span class="v144-color-swatch">
    <button type="button" class="v144-color-main ${String(color).toUpperCase()===String(selected||'').toUpperCase()?'selected':''}" style="background:${escapeHtml(color)}" data-v144-color="${escapeHtml(color)}" onclick="App.pickColor(this.dataset.v144Color)" data-color-swatch title="${escapeHtml(color)}"></button>
    ${customIndex!==null?`<button type="button" class="v144-remove-swatch" onclick="event.stopPropagation();App.v144RemoveCustomCategoryColor(${customIndex})" title="Remove saved color">×</button>`:''}
  </span>`;
}

function v144CustomColorsHtml(selected,currentColor){
  const custom=v144NormalizeCustomCategoryColors();
  const rows=custom.map((c,i)=>v144ColorSwatchHtml(c,selected,i));
  const current=String(currentColor||'').toUpperCase();

  if(current && /^#[0-9A-F]{6}$/.test(current) &&
     !COLOR_CHOICES.some(c=>c.toUpperCase()===current) &&
     !custom.includes(current)){
    rows.unshift(v144ColorSwatchHtml(current,selected,null));
  }

  return rows.length
    ? rows.join('')
    : `<span class="hint">No custom colors saved yet.</span>`;
}

function v144RefreshCategoryIconSelection(){
  const emoji=String(document.getElementById('m-icon')?.value||'');
  const url=String(document.getElementById('m-icon-url')?.value||'');

  document.querySelectorAll('#modal-root [data-v144-icon-swatch]').forEach(el=>{
    const e=el.dataset.v144IconEmoji||'';
    const u=el.dataset.v144IconUrl||'';
    const selected=u?u===url:(!url&&e===emoji);
    el.classList.toggle('selected',selected);
  });

  const preview=document.getElementById('v144-current-icon-preview');
  if(preview){
    preview.innerHTML=url
      ? `<img src="${escapeHtml(url)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='🖼️'">`
      : escapeHtml(emoji||'✨');
  }
}

function v144RefreshCategoryColorSelection(){
  const color=String(document.getElementById('m-color')?.value||'').toUpperCase();
  document.querySelectorAll('#modal-root [data-color-swatch]').forEach(el=>{
    const c=String(el.dataset.v144Color||el.style.backgroundColor||'').toUpperCase();
    el.classList.toggle('selected',c===color);
  });

  const preview=document.getElementById('v144-current-color-preview');
  if(preview)preview.style.background=color||COLOR_CHOICES[0];
}

function v144RefreshCustomIconPalette(){
  const box=document.getElementById('v144-custom-icon-palette');
  if(!box)return;
  const emoji=String(document.getElementById('m-icon')?.value||'');
  const url=String(document.getElementById('m-icon-url')?.value||'');
  box.innerHTML=v144CustomIconsHtml(emoji,url,S.modal?.data||{});
  v144RefreshCategoryIconSelection();
}

function v144RefreshCustomColorPalette(){
  const box=document.getElementById('v144-custom-color-palette');
  if(!box)return;
  const color=String(document.getElementById('m-color')?.value||COLOR_CHOICES[0]).toUpperCase();
  box.innerHTML=v144CustomColorsHtml(color,S.modal?.data?.color||color);
  v144RefreshCategoryColorSelection();
}

categoryModalHtml=function(d){
  const isNew=!d.id;
  const selectedUrl=v144SafeIconUrl(d.iconUrl||'');
  const selectedEmoji=selectedUrl?'🖼️':String(d.icon||'✨');
  const selectedColor=String(d.color||COLOR_CHOICES[0]).toUpperCase();

  const defaultIcons=ICON_CHOICES
    .map(ic=>v144IconSwatchHtml('emoji',ic,selectedEmoji,selectedUrl,null))
    .join('');

  const defaultColors=COLOR_CHOICES
    .map(c=>v144ColorSwatchHtml(c,selectedColor,null))
    .join('');

  return `
    <div class="modal-title">${isNew?'Add category':'Edit category'}</div>

    <div class="field"><label class="field-label">Name</label><input type="text" id="m-name" value="${escapeHtml(d.name||'')}"></div>

    <div class="field">
      <label class="field-label">Icon</label>

      <div class="v144-palette">${defaultIcons}</div>

      <div class="v144-palette-title">Your saved icons</div>
      <div id="v144-custom-icon-palette" class="v144-palette">${v144CustomIconsHtml(selectedEmoji,selectedUrl,d)}</div>

      <div class="v144-custom-add-grid">
        <div class="v144-custom-add">
          <label>Add emoji / symbol</label>
          <div class="v144-custom-add-row">
            <input type="text" id="v144-custom-emoji" maxlength="32" placeholder="🧠">
            <button class="btn btn-sm" type="button" onclick="App.v144AddCustomCategoryEmoji()">Add</button>
          </div>
        </div>

        <div class="v144-custom-add">
          <label>Add icon URL</label>
          <div class="v144-custom-add-row">
            <input type="url" id="v144-custom-icon-url" placeholder="https://example.com/icon.png">
            <button class="btn btn-sm" type="button" onclick="App.v144AddCustomCategoryUrl()">Add</button>
          </div>
        </div>
      </div>

      <div class="v144-current-preview">
        <span>Selected:</span>
        <span id="v144-current-icon-preview" class="preview-box">${selectedUrl?`<img src="${escapeHtml(selectedUrl)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='🖼️'">`:escapeHtml(selectedEmoji)}</span>
        <span>${selectedUrl?'URL image':'Emoji / symbol'}</span>
      </div>

      <input type="hidden" id="m-icon" value="${escapeHtml(selectedEmoji||'✨')}">
      <input type="hidden" id="m-icon-url" value="${escapeHtml(selectedUrl)}">
    </div>

    <div class="field-row">
      <div class="field"><label class="field-label">Type</label>
        <select id="m-type"><option value="video" ${d.type==='video'?'selected':''}>Video</option><option value="reading" ${d.type==='reading'?'selected':''}>Reading</option></select>
      </div>
      <div class="field"><label class="field-label">Unit</label>
        <select id="m-unit">${Object.keys(UNITS).map(u=>`<option value="${u}" ${d.unit===u?'selected':''}>${UNITS[u].label}</option>`).join('')}</select>
      </div>
    </div>

    <div class="field-row">
      <div class="field"><label class="field-label">Suggested target</label><input type="number" id="m-target" min="1" value="${d.target||1}"></div>
      <div class="field"><label class="field-label">Weight (1–5)</label><input type="number" id="m-weight" min="1" max="5" value="${d.weight||3}"></div>
    </div>

    <div class="field-row">
      <div class="field"><label class="field-label">Minutes per unit</label><input type="number" id="m-mpu" min="1" value="${d.minutesPerUnit||20}"></div>
      <div class="field" style="display:flex; align-items:flex-end; gap:16px; padding-bottom:9px;">
        <label style="display:flex; align-items:center; gap:6px; font-size:13px;"><input type="checkbox" id="m-seasonal" ${d.seasonal?'checked':''}> Time-sensitive (seasonal)</label>
      </div>
    </div>

    <div class="field">
      <label class="field-label">Color</label>

      <div class="v144-palette">${defaultColors}</div>

      <div class="v144-palette-title">Your saved colors</div>
      <div id="v144-custom-color-palette" class="v144-palette">${v144CustomColorsHtml(selectedColor,d.color||selectedColor)}</div>

      <div class="v144-custom-add">
        <label>Add custom color</label>
        <div class="v144-color-picker-row">
          <input type="color" id="v144-custom-color-picker" value="${escapeHtml(selectedColor)}" oninput="document.getElementById('v144-custom-color-hex').value=this.value.toUpperCase()">
          <input type="text" id="v144-custom-color-hex" value="${escapeHtml(selectedColor)}" maxlength="7" placeholder="#AABBCC">
          <button class="btn btn-sm" type="button" onclick="App.v144AddCustomCategoryColor()">Add color</button>
        </div>
      </div>

      <div class="v144-current-preview">
        <span>Selected:</span>
        <span id="v144-current-color-preview" class="preview-box" style="background:${escapeHtml(selectedColor)}"></span>
        <span>${escapeHtml(selectedColor)}</span>
      </div>

      <input type="hidden" id="m-color" value="${escapeHtml(selectedColor)}">
    </div>

    <label style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:6px;"><input type="checkbox" id="m-enabled" ${d.enabled!==false?'checked':''}> Enabled</label>

    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary" onclick="App.saveCategoryModal('${d.id||''}',this)">Save category</button>
    </div>
  `;
};

App.v144PickCategoryEmoji=function(value){
  const emoji=String(value||'').trim();
  if(!emoji)return;

  const icon=document.getElementById('m-icon');
  const url=document.getElementById('m-icon-url');
  if(icon)icon.value=emoji;
  if(url)url.value='';

  if(S.modal?.type==='category'){
    S.modal.data.icon=emoji;
    S.modal.data.iconUrl='';
  }

  v144RefreshCategoryIconSelection();
};

App.v144PickCategoryIconUrl=function(raw){
  const url=v144SafeIconUrl(raw);
  if(!url){
    showToast('Use a valid http:// or https:// icon URL.');
    return;
  }

  const icon=document.getElementById('m-icon');
  const inputUrl=document.getElementById('m-icon-url');
  if(icon)icon.value='🖼️';
  if(inputUrl)inputUrl.value=url;

  if(S.modal?.type==='category'){
    S.modal.data.icon='🖼️';
    S.modal.data.iconUrl=url;
  }

  v144RefreshCategoryIconSelection();
};

// Keep the old App.pickIcon entry point working for all default emoji swatches.
App.pickIcon=function(value){
  App.v144PickCategoryEmoji(value);
};

App.pickColor=function(raw){
  let color=String(raw||'').trim().toUpperCase();
  if(/^#[0-9A-F]{3}$/.test(color))color='#'+color.slice(1).split('').map(x=>x+x).join('');
  if(!/^#[0-9A-F]{6}$/.test(color))return;

  const input=document.getElementById('m-color');
  if(input)input.value=color;
  if(S.modal?.type==='category')S.modal.data.color=color;

  const hex=document.getElementById('v144-custom-color-hex');
  const picker=document.getElementById('v144-custom-color-picker');
  if(hex)hex.value=color;
  if(picker)picker.value=color.toLowerCase();

  v144RefreshCategoryColorSelection();

  const previewText=document.querySelector('#v144-current-color-preview + span');
  if(previewText)previewText.textContent=color;
};

App.v144AddCustomCategoryEmoji=function(){
  const input=document.getElementById('v144-custom-emoji');
  let value=String(input?.value||'').trim();
  if(!value){
    showToast('Enter an emoji or symbol first.');
    return;
  }

  value=Array.from(value).slice(0,12).join('');
  const rows=v144NormalizeCustomCategoryIcons();
  if(!rows.some(x=>x.type==='emoji'&&x.value===value)){
    S.settings.customCategoryIcons=[...rows,{type:'emoji',value}];
    persistSettings();
  }

  if(input)input.value='';
  App.v144PickCategoryEmoji(value);
  v144RefreshCustomIconPalette();
  showToast('Custom icon saved ✓');
};

App.v144AddCustomCategoryUrl=function(){
  const input=document.getElementById('v144-custom-icon-url');
  const value=v144SafeIconUrl(input?.value||'');
  if(!value){
    showToast('Use a valid http:// or https:// icon URL.');
    return;
  }

  const rows=v144NormalizeCustomCategoryIcons();
  if(!rows.some(x=>x.type==='url'&&x.value===value)){
    S.settings.customCategoryIcons=[...rows,{type:'url',value}];
    persistSettings();
  }

  if(input)input.value='';
  App.v144PickCategoryIconUrl(value);
  v144RefreshCustomIconPalette();
  showToast('URL icon saved ✓');
};

App.v144RemoveCustomCategoryIcon=function(index){
  const rows=v144NormalizeCustomCategoryIcons();
  const i=Number(index);
  if(!Number.isInteger(i)||i<0||i>=rows.length)return;

  const removed=rows[i];
  S.settings.customCategoryIcons=rows.filter((_,n)=>n!==i);
  persistSettings();
  v144RefreshCustomIconPalette();
  showToast(`${removed.type==='url'?'URL icon':'Custom icon'} removed from saved palette`);
};

App.v144AddCustomCategoryColor=function(){
  const hex=document.getElementById('v144-custom-color-hex');
  let value=String(hex?.value||'').trim().toUpperCase();

  if(/^#[0-9A-F]{3}$/.test(value)){
    value='#'+value.slice(1).split('').map(x=>x+x).join('');
  }

  if(!/^#[0-9A-F]{6}$/.test(value)){
    showToast('Enter a valid hex color such as #7C5CFC.');
    return;
  }

  const rows=v144NormalizeCustomCategoryColors();
  if(!rows.includes(value)){
    S.settings.customCategoryColors=[...rows,value];
    persistSettings();
  }

  App.pickColor(value);
  v144RefreshCustomColorPalette();
  showToast('Custom color saved ✓');
};

App.v144RemoveCustomCategoryColor=function(index){
  const rows=v144NormalizeCustomCategoryColors();
  const i=Number(index);
  if(!Number.isInteger(i)||i<0||i>=rows.length)return;

  S.settings.customCategoryColors=rows.filter((_,n)=>n!==i);
  persistSettings();
  v144RefreshCustomColorPalette();
  showToast('Custom color removed from saved palette');
};

// v144 save: URL icon is now a first-class category field.
App.saveCategoryModal=function(id,button){
  if(button?.dataset?.saving==='1')return;
  if(button){button.dataset.saving='1';button.disabled=true;}

  const iconUrl=v144SafeIconUrl(document.getElementById('m-icon-url')?.value||'');
  const icon=iconUrl?'🖼️':(String(document.getElementById('m-icon')?.value||'').trim()||'✨');

  let color=String(document.getElementById('m-color')?.value||COLOR_CHOICES[0]).trim().toUpperCase();
  if(!/^#[0-9A-F]{6}$/.test(color))color=COLOR_CHOICES[0];

  const data={
    id:id||uid(),
    name:document.getElementById('m-name').value.trim()||'Untitled category',
    icon,
    iconUrl:iconUrl||null,
    type:document.getElementById('m-type').value,
    unit:document.getElementById('m-unit').value,
    target:Math.max(1,Number(document.getElementById('m-target').value)||1),
    weight:clamp(Number(document.getElementById('m-weight').value)||3,1,5),
    minutesPerUnit:Math.max(1,Number(document.getElementById('m-mpu').value)||20),
    seasonal:document.getElementById('m-seasonal').checked,
    color,
    enabled:document.getElementById('m-enabled').checked,
    custom:true
  };

  const idx=S.categories.findIndex(c=>c.id===id);
  if(idx>=0)S.categories[idx]=Object.assign({},S.categories[idx],data);
  else S.categories.push(data);

  persistCategories();
  S.modal=null;
  render();
};

// Ensure old/new settings always have normalized arrays after loading/resetting.
const v144RenderSettingsBase=renderSettings;
renderSettings=function(){
  S.settings=S.settings||{};
  if(!Array.isArray(S.settings.customCategoryIcons))S.settings.customCategoryIcons=[];
  if(!Array.isArray(S.settings.customCategoryColors))S.settings.customCategoryColors=[];
  v144NormalizeCustomCategoryIcons();
  v144NormalizeCustomCategoryColors();
  return v144RenderSettingsBase();
};


/* ============================================================
   MediaFlow v145 — Dynamic cover-based theme accent
   Source order: recommended title cover -> On This Day cover -> selected theme.
   Only --flow / --flow-dim are overlaid; the selected theme itself is unchanged.
   ============================================================ */

let V145_DYNAMIC_THEME_SEQ=0;
const V145_COVER_COLOR_CACHE=new Map();
S.v145DynamicThemeState=S.v145DynamicThemeState||{source:'theme',label:'Selected theme',url:'',color:''};

function v145Hex(n){return Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0').toUpperCase();}
function v145RgbHex(r,g,b){return `#${v145Hex(r)}${v145Hex(g)}${v145Hex(b)}`;}

function v145RgbToHsl(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;
  let h=0,s=0;
  if(d){
    s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r)h=((g-b)/d+(g<b?6:0))/6;
    else if(max===g)h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6;
  }
  return{h:h*360,s:s*100,l:l*100};
}
function v145HslToRgb(h,s,l){
  h=((Number(h)%360)+360)%360/360;s=Math.max(0,Math.min(100,Number(s)))/100;l=Math.max(0,Math.min(100,Number(l)))/100;
  if(!s){const v=Math.round(l*255);return{r:v,g:v,b:v};}
  const hue=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  return{r:Math.round(hue(p,q,h+1/3)*255),g:Math.round(hue(p,q,h)*255),b:Math.round(hue(p,q,h-1/3)*255)};
}
function v145CssColorToRgb(value){
  const v=String(value||'').trim();let m=v.match(/^#([0-9a-f]{6})$/i);
  if(m){const n=parseInt(m[1],16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};}
  m=v.match(/^#([0-9a-f]{3})$/i);
  if(m)return{r:parseInt(m[1][0]+m[1][0],16),g:parseInt(m[1][1]+m[1][1],16),b:parseInt(m[1][2]+m[1][2],16)};
  m=v.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
  return m?{r:Number(m[1]),g:Number(m[2]),b:Number(m[3])}:null;
}
function v145Luminance(rgb){
  if(!rgb)return 0;
  const c=[rgb.r,rgb.g,rgb.b].map(v=>{v=Math.max(0,Math.min(255,v))/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function v145TuneAccent(r,g,b){
  const hsl=v145RgbToHsl(r,g,b);
  const bg=v145CssColorToRgb(getComputedStyle(document.documentElement).getPropertyValue('--bg'));
  const dark=v145Luminance(bg)<.36;
  const s=Math.max(48,Math.min(88,hsl.s*1.12));
  const l=dark?Math.max(50,Math.min(65,hsl.l)):Math.max(34,Math.min(50,hsl.l));
  const rgb=v145HslToRgb(hsl.h,s,l);
  return v145RgbHex(rgb.r,rgb.g,rgb.b);
}
function v145MixHex(a,b,w=.58){
  const p=hex=>{const m=String(hex||'').match(/^#([0-9A-F]{6})$/i);if(!m)return null;const n=parseInt(m[1],16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};};
  const x=p(a),y=p(b);if(!x||!y)return a;w=Math.max(0,Math.min(1,Number(w)||0));
  return v145RgbHex(x.r*w+y.r*(1-w),x.g*w+y.g*(1-w),x.b*w+y.b*(1-w));
}

function v145ExtractCoverAccent(url){
  url=String(url||'').trim();
  if(!url)return Promise.resolve(null);
  if(V145_COVER_COLOR_CACHE.has(url))return Promise.resolve(V145_COVER_COLOR_CACHE.get(url));
  return new Promise(resolve=>{
    const img=new Image();img.crossOrigin='anonymous';img.referrerPolicy='no-referrer';
    const done=v=>{V145_COVER_COLOR_CACHE.set(url,v||null);resolve(v||null);};
    img.onerror=()=>done(null);
    img.onload=()=>{
      try{
        const cv=document.createElement('canvas');cv.width=48;cv.height=64;
        const ctx=cv.getContext('2d',{willReadFrequently:true});if(!ctx)return done(null);
        ctx.drawImage(img,0,0,48,64);
        const data=ctx.getImageData(0,0,48,64).data,buckets=new Map();
        let fr=0,fg=0,fb=0,fn=0;
        for(let i=0;i<data.length;i+=16){
          const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];if(a<180)continue;
          const max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min,lum=(.2126*r+.7152*g+.0722*b)/255;if(lum>.08&&lum<.94){fr+=r;fg+=g;fb+=b;fn++;}
          const sat=max?chroma/max:0;if(sat<.18||lum<.10||lum>.90)continue;
          const key=`${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
          const weight=(.35+sat)*(1-Math.abs(lum-.52)*.65),row=buckets.get(key)||{score:0,r:0,g:0,b:0,n:0};
          row.score+=weight;row.r+=r;row.g+=g;row.b+=b;row.n++;buckets.set(key,row);
        }
        let best=null;for(const row of buckets.values())if(!best||row.score>best.score)best=row;
        if(best?.n)return done(v145TuneAccent(best.r/best.n,best.g/best.n,best.b/best.n));
        if(fn)return done(v145TuneAccent(fr/fn,fg/fn,fb/fn));
        done(null);
      }catch(_){done(null);}
    };
    try{img.src=url;}catch(_){done(null);}
  });
}

function v145RecommendedCoverSource(){
  if(!S.settings?.exactTitleRecommendations)return null;
  const t=S.currentTask;if(!t?.title)return null;
  const item=v50FindLibraryItem(t.libraryId,t.title);
  return item?.coverUrl?{source:'recommended',label:`Recommended: ${cleanTitle(item.title)}`,url:String(item.coverUrl)}:null;
}

function v145OnThisDayCoverSources(){
  const now=new Date(),rows=[];
  const sameDay=d=>{
    if(!(d instanceof Date)||Number.isNaN(d.getTime()))return 0;
    const y=now.getFullYear()-d.getFullYear();
    return y>=1&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate()?y:0;
  };
  for(const s of(S.sessions||[])){
    if(!s||s.status==='skipped')continue;
    let d=null,key=typeof v119SessionDateKey==='function'?v119SessionDateKey(s):'';
    if(key){const x=new Date(key+'T12:00:00');if(!Number.isNaN(x.getTime()))d=x;}
    if(!d&&Number(s.timestamp)>0){const x=new Date(Number(s.timestamp));if(!Number.isNaN(x.getTime()))d=x;}
    const years=sameDay(d);if(!years)continue;
    for(const t of(s.titles||[])){
      const item=v50FindLibraryItem(t?.libraryId,t?.title);
      if(item?.coverUrl)rows.push({years,priority:1,timestamp:d.getTime(),label:`On This Day: ${cleanTitle(item.title)}`,url:String(item.coverUrl)});
    }
  }
  for(const item of(S.library||[])){
    if(!item?.coverUrl)continue;
    const start=Number(item.startedAt)>0?new Date(Number(item.startedAt)):null,sy=sameDay(start);
    if(sy)rows.push({years:sy,priority:0,timestamp:start.getTime(),label:`On This Day: ${cleanTitle(item.title)}`,url:String(item.coverUrl)});
    const finish=Number(item.completedAt)>0?new Date(Number(item.completedAt)):null,fy=sameDay(finish);
    if(fy)rows.push({years:fy,priority:2,timestamp:finish.getTime(),label:`On This Day: ${cleanTitle(item.title)}`,url:String(item.coverUrl)});
  }
  rows.sort((a,b)=>a.years-b.years||a.priority-b.priority||a.timestamp-b.timestamp);
  const seen=new Set();return rows.filter(x=>seen.has(x.url)?false:(seen.add(x.url),true));
}

function v145UpdateDynamicThemeStatus(){
  const el=document.getElementById('v145-cover-theme-status');if(!el)return;
  const st=S.v145DynamicThemeState||{},enabled=!!S.settings?.dynamicCoverTheme;
  const label=!enabled?'Off — using the selected theme':
    st.source==='recommended'||st.source==='onthisday'?`${st.label} · ${st.color||'cover color'}`:
    'No usable cover right now — using the selected theme';
  el.innerHTML=`<span class="v145-cover-theme-dot" ${st.color?`style="background:${escapeHtml(st.color)}"`:''}></span><span>${escapeHtml(label)}</span>`;
}
function v145ClearDynamicAccent(){
  const root=document.documentElement;root.style.removeProperty('--flow');root.style.removeProperty('--flow-dim');root.removeAttribute('data-v145-cover-theme');
  S.v145DynamicThemeState={source:'theme',label:'Selected theme',url:'',color:''};v145UpdateDynamicThemeStatus();
}
function v145ApplyDynamicAccent(color,source){
  const root=document.documentElement,bg=v145CssColorToRgb(getComputedStyle(root).getPropertyValue('--bg'));
  const bgHex=bg?v145RgbHex(bg.r,bg.g,bg.b):'#0E111A';
  root.style.setProperty('--flow',color);root.style.setProperty('--flow-dim',v145MixHex(color,bgHex,.58));root.dataset.v145CoverTheme=source.source;
  S.v145DynamicThemeState={source:source.source,label:source.label,url:source.url,color};v145UpdateDynamicThemeStatus();
}

async function v145RefreshDynamicCoverAccent(){
  const seq=++V145_DYNAMIC_THEME_SEQ;
  if(!S.settings?.dynamicCoverTheme){v145ClearDynamicAccent();return;}
  const sources=[],rec=v145RecommendedCoverSource();if(rec)sources.push(rec);
  v145OnThisDayCoverSources().forEach(x=>sources.push({source:'onthisday',label:x.label,url:x.url}));
  for(const source of sources){
    const color=await v145ExtractCoverAccent(source.url);
    if(seq!==V145_DYNAMIC_THEME_SEQ)return;
    if(color){v145ApplyDynamicAccent(color,source);return;}
  }
  if(seq===V145_DYNAMIC_THEME_SEQ)v145ClearDynamicAccent();
}
function v145ScheduleDynamicCoverAccent(){
  const gate=++V145_DYNAMIC_THEME_SEQ;
  Promise.resolve().then(()=>{if(gate===V145_DYNAMIC_THEME_SEQ)v145RefreshDynamicCoverAccent();});
}

App.toggleDynamicCoverTheme=function(){
  S.settings=S.settings||{};S.settings.dynamicCoverTheme=!S.settings.dynamicCoverTheme;
  if(!S.settings.dynamicCoverTheme){++V145_DYNAMIC_THEME_SEQ;v145ClearDynamicAccent();}
  persistSettings();render();
  if(S.settings.dynamicCoverTheme)v145ScheduleDynamicCoverAccent();
};

const v145RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v145RenderSettingsBase(),enabled=!!S.settings?.dynamicCoverTheme;
  const panel=`<div class="v145-cover-theme-row"><div class="v145-cover-theme-copy"><b>Dynamic cover theme color</b><small>Use the recommended title cover as MediaFlow's accent color. If that title has no usable cover, MediaFlow tries an On This Day cover. If neither is available, your selected theme stays unchanged.</small><div id="v145-cover-theme-status" class="v145-cover-theme-status"><span class="v145-cover-theme-dot"></span><span>${enabled?'Looking for a cover color…':'Off — using the selected theme'}</span></div></div><button class="toggle ${enabled?'on':''}" type="button" onclick="App.toggleDynamicCoverTheme()" aria-label="Toggle dynamic cover theme color"></button></div>`;
  const needle='<div class="section-label">THEMES & CUSTOMIZATION</div><div class="card" style="margin-bottom:22px">';
  if(out.includes(needle))out=out.replace(needle,needle+panel);
  return out;
};

const v145ApplyThemeBase=applyTheme;
applyTheme=function(theme){
  v145ApplyThemeBase(theme);
  if(S.settings?.dynamicCoverTheme)v145ScheduleDynamicCoverAccent();else v145ClearDynamicAccent();
};

const v145RenderBase=render;
render=function(){
  const result=v145RenderBase.apply(this,arguments);v145ScheduleDynamicCoverAccent();return result;
};

const v145RenderShellBase=renderShell;
renderShell=function(){
  const result=v145RenderShellBase.apply(this,arguments);v145ScheduleDynamicCoverAccent();return result;
};


/* ============================================================
   MediaFlow v146 — Dynamic Full Cover Theme
   ------------------------------------------------------------
   Theme mode is now mutually exclusive:
     • MediaFlow / Platform / Full Style theme collections
     • Dynamic Cover Theme

   Dynamic source priority stays:
     1. current MediaFlow-recommended title cover
     2. On This Day cover
     3. stored selected theme as fallback

   Unlike v145, v146 derives the complete color system:
   background, panels, raised surfaces, borders, text and accent.
   ============================================================ */

let V146_DYNAMIC_SEQ=0;
const V146_THEME_VARS=[
  '--bg','--panel','--panel-raised','--border','--border-soft',
  '--text','--text-dim','--text-mute','--flow','--flow-dim'
];

S.v146DynamicThemeState=S.v146DynamicThemeState||{
  source:'theme',
  label:'Selected theme fallback',
  url:'',
  palette:null
};

function v146RgbFromHex(hex){
  const m=String(hex||'').match(/^#([0-9A-F]{6})$/i);
  if(!m)return null;
  const n=parseInt(m[1],16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}

function v146HslHex(h,s,l){
  const rgb=v145HslToRgb(h,s,l);
  return v145RgbHex(rgb.r,rgb.g,rgb.b);
}

function v146PaletteFromAccent(accent,mode){
  const rgb=v146RgbFromHex(accent);
  if(!rgb)return null;

  const hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);
  const h=hsl.h;
  const chroma=Math.max(42,Math.min(82,hsl.s*1.10 || 58));

  if(mode==='light'){
    const flow=v146HslHex(h,Math.max(58,chroma),42);
    return {
      mode:'light',
      bg:v146HslHex(h,Math.min(28,chroma*.30),97),
      panel:v146HslHex(h,Math.min(22,chroma*.24),99),
      raised:v146HslHex(h,Math.min(34,chroma*.38),93),
      border:v146HslHex(h,Math.min(32,chroma*.34),78),
      borderSoft:v146HslHex(h,Math.min(26,chroma*.28),87),
      text:v146HslHex(h,Math.min(28,chroma*.26),14),
      textDim:v146HslHex(h,Math.min(30,chroma*.30),34),
      textMute:v146HslHex(h,Math.min(26,chroma*.25),50),
      flow,
      flowDim:v146HslHex(h,Math.max(36,chroma*.68),78)
    };
  }

  const flow=v146HslHex(h,Math.max(58,chroma),58);
  return {
    mode:'dark',
    bg:v146HslHex(h,Math.min(34,chroma*.36),7),
    panel:v146HslHex(h,Math.min(38,chroma*.40),11),
    raised:v146HslHex(h,Math.min(42,chroma*.45),16),
    border:v146HslHex(h,Math.min(36,chroma*.36),29),
    borderSoft:v146HslHex(h,Math.min(34,chroma*.34),21),
    text:v146HslHex(h,Math.min(18,chroma*.16),95),
    textDim:v146HslHex(h,Math.min(22,chroma*.20),73),
    textMute:v146HslHex(h,Math.min(24,chroma*.22),53),
    flow,
    flowDim:v146HslHex(h,Math.max(34,chroma*.62),31)
  };
}

function v146ClearInlineThemeVars(){
  const root=document.documentElement;
  for(const key of V146_THEME_VARS)root.style.removeProperty(key);
  root.removeAttribute('data-v146-dynamic-active');
}

function v146RestoreSelectedThemeFallback(){
  const root=document.documentElement;

  v146ClearInlineThemeVars();
  root.dataset.v146ThemeMode=S.settings?.dynamicCoverTheme?'dynamic':'collection';

  // Apply the user's stored static theme without invoking v145/v146 scheduling.
  // This is the exact fallback when no usable cover exists.
  v145ApplyThemeBase(S.settings?.theme||'dark');

  S.v146DynamicThemeState={
    source:'theme',
    label:'Selected theme fallback',
    url:'',
    palette:null
  };

  v146UpdateThemeStatus();
}

function v146ApplyFullPalette(palette,source){
  if(!palette)return;

  const root=document.documentElement;

  // Dynamic Cover Theme uses the normal MediaFlow structural skin and supplies
  // every important theme color itself. The saved static theme remains intact
  // in S.settings.theme for instant fallback / later return to collections.
  root.dataset.theme='dark';
  root.dataset.v146ThemeMode='dynamic';
  root.dataset.v146DynamicActive='1';

  // Global Appearance's neutral !important layer would otherwise mask the
  // dynamic surfaces. We still honor its Light/Dark preference when generating
  // the palette, but the actual dynamic palette owns the surfaces.
  root.removeAttribute('data-appearance');
  root.removeAttribute('data-native-scheme');
  root.style.colorScheme=palette.mode;

  root.style.setProperty('--bg',palette.bg);
  root.style.setProperty('--panel',palette.panel);
  root.style.setProperty('--panel-raised',palette.raised);
  root.style.setProperty('--border',palette.border);
  root.style.setProperty('--border-soft',palette.borderSoft);
  root.style.setProperty('--text',palette.text);
  root.style.setProperty('--text-dim',palette.textDim);
  root.style.setProperty('--text-mute',palette.textMute);
  root.style.setProperty('--flow',palette.flow);
  root.style.setProperty('--flow-dim',palette.flowDim);

  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',palette.bg);

  S.v146DynamicThemeState={
    source:source.source,
    label:source.label,
    url:source.url,
    palette
  };

  v146UpdateThemeStatus();
}

function v146DynamicAppearanceMode(){
  // Keep the user's existing Light/Dark preference meaningful in Dynamic mode.
  // If it has never been chosen explicitly, v106 resolves it from the stored
  // fallback theme once and saves the result.
  try{return v106AppearanceMode()==='light'?'light':'dark';}
  catch(_){return 'dark';}
}

function v146UpdateThemeStatus(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const enabled=!!S.settings?.dynamicCoverTheme;
  const p=st.palette;

  let text='Theme collections are active.';
  if(enabled){
    if(st.source==='recommended'||st.source==='onthisday'){
      text=`${st.label} · full ${p?.mode||'dynamic'} palette`;
    }else{
      text='No usable cover right now — using your selected theme as fallback.';
    }
  }

  const colors=p
    ? [p.bg,p.panel,p.raised,p.flow,p.text]
    : [];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
}

async function v146RefreshDynamicTheme(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=[];
  const rec=v145RecommendedCoverSource();
  if(rec)sources.push(rec);

  for(const row of v145OnThisDayCoverSources()){
    sources.push({
      source:'onthisday',
      label:row.label,
      url:row.url
    });
  }

  for(const source of sources){
    const accent=await v145ExtractCoverAccent(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;

    if(accent){
      const palette=v146PaletteFromAccent(accent,v146DynamicAppearanceMode());
      if(palette){
        v146ApplyFullPalette(palette,source);
        return;
      }
    }
  }

  if(seq===V146_DYNAMIC_SEQ)v146RestoreSelectedThemeFallback();
}

function v146ScheduleDynamicTheme(){
  const gate=++V146_DYNAMIC_SEQ;
  Promise.resolve().then(()=>{
    if(gate===V146_DYNAMIC_SEQ)v146RefreshDynamicTheme();
  });
}

// v145's final render/applyTheme wrappers call these variables at runtime.
// Redirect them to the v146 full-theme engine instead of the accent-only engine.
v145ScheduleDynamicCoverAccent=v146ScheduleDynamicTheme;
v145ClearDynamicAccent=function(){
  ++V146_DYNAMIC_SEQ;
  v146RestoreSelectedThemeFallback();
};

// Theme collection selector now includes Dynamic Cover Theme as a mutually
// exclusive mode. The stored static theme is never destroyed.
const v146StaticThemeCollectionSetter=App.setThemeCollection;
App.setThemeCollection=function(kind){
  if(kind==='dynamic'){
    S.settings.dynamicCoverTheme=true;
    document.documentElement.dataset.v146ThemeMode='dynamic';
    persistSettings();
    render();
    v146ScheduleDynamicTheme();
    return;
  }

  if(['mediaflow','platform','fullstyle'].includes(kind)){
    S.settings.dynamicCoverTheme=false;
    ++V146_DYNAMIC_SEQ;
    v146ClearInlineThemeVars();
    document.documentElement.dataset.v146ThemeMode='collection';

    // Restore appearance before handing control back to the existing collection
    // implementation. It may choose a default theme when changing collections.
    try{v132ApplyAppearancePreference();}catch(_){}
    persistSettings();
    return v146StaticThemeCollectionSetter.call(App,kind);
  }

  return v146StaticThemeCollectionSetter.call(App,kind);
};

// Keep the old v145 public toggle harmless/compatible if any stale UI calls it.
App.toggleDynamicCoverTheme=function(){
  App.setThemeCollection(S.settings?.dynamicCoverTheme?'mediaflow':'dynamic');
};

const v146RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v146RenderSettingsBase();
  const dynamic=!!S.settings?.dynamicCoverTheme;

  // Remove v145's old accent-only toggle. v146 replaces it with an actual
  // Theme Collection mode.
  out=out.replace(
    /<div class="v145-cover-theme-row">[\s\S]*?aria-label="Toggle dynamic cover theme color"><\/button><\/div>/,
    ''
  );

  const current=S.settings?.theme||'dark';
  const isPlatform=V55_PLATFORM_THEMES.includes(current);
  const isFull=FULL_STYLE_THEMES.includes(current);
  const collection=dynamic?'dynamic':isFull?'fullstyle':isPlatform?'platform':'mediaflow';

  const collectionSelect=`<select onchange="App.setThemeCollection(this.value)">
    <option value="mediaflow" ${collection==='mediaflow'?'selected':''}>MediaFlow Themes</option>
    <option value="platform" ${collection==='platform'?'selected':''}>Platform Themes</option>
    <option value="fullstyle" ${collection==='fullstyle'?'selected':''}>Full Style Themes</option>
    <option value="dynamic" ${collection==='dynamic'?'selected':''}>Dynamic Cover Theme</option>
  </select>`;

  out=out.replace(
    /<select onchange="App\.setThemeCollection\(this\.value\)">[\s\S]*?<\/select>/,
    collectionSelect
  );

  if(dynamic){
    // The visible static theme picker becomes the fallback picker while Dynamic
    // Cover Theme is selected.
    out=out.replace(
      /<label class="field-label">(MediaFlow theme|Platform theme|Full style theme)<\/label>/,
      '<label class="field-label">Fallback theme</label>'
    );

    const note=`<div class="v146-static-fallback-note">Your selected static theme is kept as the fallback. Dynamic Cover Theme uses the recommended title cover first, then On This Day. If neither cover can be used, MediaFlow returns to this fallback automatically.</div>`;
    const panel=`<div class="v146-theme-mode-panel">
      <div class="v146-theme-mode-title"><b>Dynamic Cover Theme</b><span class="v146-theme-mode-badge">Full theme</span></div>
      <small>The cover now controls the whole MediaFlow color system — background, panels, raised surfaces, borders, text and accent — not only the accent color.</small>
      <div id="v146-dynamic-theme-status" class="v146-theme-status"><span>Analyzing cover…</span></div>
    </div>`;

    const needle='<div class="section-label">THEMES & CUSTOMIZATION</div><div class="card" style="margin-bottom:22px">';
    if(out.includes(needle))out=out.replace(needle,needle+panel);

    // Add the fallback explanation immediately after the collection selector's field.
    out=out.replace(
      /(<div class="field"><label class="field-label">Theme collection<\/label>[\s\S]*?<\/div>)/,
      '$1'+note
    );
  }

  return out;
};

// The v145 applyTheme wrapper remains the final selected-theme entry point.
// When Dynamic mode is active it now schedules the v146 full palette via the
// redirected v145ScheduleDynamicCoverAccent binding.

// Refresh settings status after async palette application.
const v146RenderBase=render;
render=function(){
  const result=v146RenderBase.apply(this,arguments);
  if(S.settings?.dynamicCoverTheme)v146ScheduleDynamicTheme();
  else{
    document.documentElement.dataset.v146ThemeMode='collection';
    v146ClearInlineThemeVars();
  }
  return result;
};


/* ============================================================
   MediaFlow v147 — Dynamic Settings version/copyright footer
   ------------------------------------------------------------
   Version is read from <meta name="mediaflow-version"> so future releases
   only need to update normal MediaFlow version metadata.
   Copyright year comes from the user's current system year.
   ============================================================ */

function v147CurrentMediaFlowVersion(){
  const meta=document.querySelector('meta[name="mediaflow-version"]');
  const value=String(meta?.getAttribute('content')||'').trim();
  return value||'147';
}

function v147SettingsFooterHtml(){
  const version=v147CurrentMediaFlowVersion();
  const year=new Date().getFullYear();

  return `<footer class="v147-settings-footer" aria-label="MediaFlow version information">
    <div class="v147-settings-footer-brand">MediaFlow v${escapeHtml(version)}</div>
    <div class="v147-settings-footer-meta">by <b>Alex Godly</b> · © ${year} Alex Godly</div>
  </footer>`;
}

const v147RenderSettingsBase=renderSettings;
renderSettings=function(){
  const html=v147RenderSettingsBase();
  return html+v147SettingsFooterHtml();
};


/* ============================================================
   MediaFlow v148 — Complete-data Backup Audit + Full Restore
   ------------------------------------------------------------
   Audit result for v147:
   snapshot() already covered the large account state through its wrapper chain:
   categories/order, Library (including cover/rating/date metadata), History,
   Settings, task/session, profile picture/name, stopwatch, MAL link, XP ledgers,
   completion timeline, Library History/migrations and Personal Order.

   The persistent Rating Queue lived separately in localStorage and therefore was
   NOT inside v147's JSON backup. Device UI preferences such as sidebar width
   were also outside the backup. v148 makes the full backup explicitly include
   those portable extras and adds stricter validation/runtime restoration.

   Transient unsaved UI (open modal, in-progress form drafts, current filter page,
   undo/redo stacks) is intentionally not portable app data.
   ============================================================ */

function v148CurrentVersion(){
  const meta=document.querySelector('meta[name="mediaflow-version"]');
  return Number(meta?.getAttribute('content'))||148;
}

function v148SafeClone(value,fallback=null){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){return fallback;}
}

function v148PortableRatingQueue(){
  try{
    v125LoadRatingQueue();
    v123SyncRatingQueue();
    return V123_RATING_QUEUE.map(String).filter(Boolean);
  }catch(_){
    return [];
  }
}

function v148PortableSidebarWidth(){
  try{
    const value=Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(value)&&value>0?value:null;
  }catch(_){
    return null;
  }
}

function v148BackupManifest(state,extras){
  const ledger=state?.xpLedger||{};
  const order=state?.orderPlan||{};
  return {
    schemaVersion:2,
    completeAccountState:true,
    counts:{
      categories:Array.isArray(state?.categories)?state.categories.length:0,
      libraryTitles:Array.isArray(state?.library)?state.library.length:0,
      historyLogs:Array.isArray(state?.sessions)?state.sessions.length:0,
      libraryHistory:Array.isArray(state?.activityLog)?state.activityLog.length:0,
      completionTimeline:Array.isArray(state?.completionTimeline)?state.completionTimeline.length:0,
      personalOrderTitles:Array.isArray(order?.titleIds)?order.titleIds.length:0,
      ratingQueue:Array.isArray(extras?.ratingQueue)?extras.ratingQueue.length:0,
      xpRatingRewards:Object.keys(ledger?.ratings||{}).length
    },
    includes:{
      categories:true,
      categoryOrder:true,
      library:true,
      history:true,
      settings:true,
      currentTask:true,
      activeSession:true,
      profileName:true,
      profilePicture:true,
      stopwatch:true,
      malLink:true,
      xpLedgers:true,
      completionTimeline:true,
      libraryHistory:true,
      migrations:true,
      personalOrder:true,
      personalOrderRecovery:true,
      customCategoryIcons:true,
      customCategoryColors:true,
      dynamicThemeSettings:true,
      ratingQueue:true,
      portableUiPreferences:true
    },
    note:'Browser-granted filesystem folder handles and authentication credentials are intentionally not portable JSON data.'
  };
}

function v148BuildFullBackup(){
  // snapshot() is the canonical MediaFlow account state and already includes all
  // late-version wrappers (profileName, activityLog, orderPlan, settings, etc.).
  const state=v148SafeClone(snapshot(),{})||{};

  // Be explicit about modern fields so future refactors cannot silently omit them.
  state.profileName=String(S.profileName||'').trim();
  state.profilePicture=String(S.profilePicture||'').trim();
  state.activityLog=v148SafeClone(Array.isArray(S.activityLog)?S.activityLog:[],[]);
  state.migrations=v148SafeClone(S.migrations||{}, {});
  state.orderPlan=v148SafeClone(v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories),{});
  state.completionTimeline=v148SafeClone(Array.isArray(S.completionTimeline)?S.completionTimeline:[],[]);
  state.xpLedger=v148SafeClone(S.xpLedger||{libraryAdditions:{}},{libraryAdditions:{}});
  state.stopwatch=v148SafeClone(S.stopwatch||{running:false,startedAt:0,elapsed:0,resetValue:0},{running:false,startedAt:0,elapsed:0,resetValue:0});
  state.malLink=v148SafeClone(S.malLink||{username:'',mode:'anime'},{username:'',mode:'anime'});
  state.settings=v148SafeClone(S.settings||DEFAULT_SETTINGS,{});
  state.categoryOrder=v74SyncCategoryOrder().slice();

  const extras={
    ratingQueue:v148PortableRatingQueue(),
    uiPreferences:{
      sidebarWidth:v148PortableSidebarWidth(),
      statsRecapMonth:String(S.statsRecapMonth||''),
      statsHeatmapYear:String(S.statsHeatmapYear||'')
    }
  };

  const now=new Date();
  return Object.assign({},state,{
    backupFormat:'MediaFlow_Full_Backup',
    backupSchemaVersion:2,
    backupVersion:v148CurrentVersion(),
    mediaFlowVersion:v148CurrentVersion(),
    exportedAt:now.toISOString(),
    portableExtras:extras,
    backupManifest:v148BackupManifest(state,extras),
    progression:mediaFlowLevelInfo(),
    progressionBreakdown:v120XPBreakdown()
  });
}

function v148ValidateBackup(data){
  if(!data||typeof data!=='object'||Array.isArray(data)){
    return {ok:false,message:'The selected file is not a MediaFlow backup object.'};
  }

  const format=String(data.backupFormat||'');
  const hasCore=
    Array.isArray(data.categories) &&
    Array.isArray(data.library) &&
    Array.isArray(data.sessions) &&
    data.settings && typeof data.settings==='object';

  // Modern full backup.
  if(format==='MediaFlow_Full_Backup'){
    if(!hasCore){
      return {ok:false,message:'This MediaFlow full backup is incomplete or corrupted.'};
    }
    return {ok:true,legacy:false};
  }

  // Backward compatibility for older MediaFlow JSON backups that predate the
  // backupFormat marker but still contain the canonical core account state.
  if(hasCore){
    return {ok:true,legacy:true};
  }

  return {
    ok:false,
    message:'This JSON does not contain the required MediaFlow categories, Library, History and Settings data.'
  };
}

function v148RestorePortableExtras(data){
  const extras=data?.portableExtras&&typeof data.portableExtras==='object'
    ? data.portableExtras
    : {};

  // v148 Rating Queue portability. v147 and older backups simply rebuild the
  // queue from unrated Library titles because the field did not exist.
  if(Array.isArray(extras.ratingQueue)){
    V123_RATING_QUEUE=extras.ratingQueue.map(String).filter(Boolean);
    V125_RATING_QUEUE_LOADED=true;
    try{v125SaveRatingQueue();}catch(_){}
    try{v123SyncRatingQueue();}catch(_){}
  }else{
    // Do not keep a stale queue from the pre-import Library.
    V123_RATING_QUEUE=[];
    V125_RATING_QUEUE_LOADED=true;
    try{v125SaveRatingQueue();v123SyncRatingQueue();}catch(_){}
  }

  const ui=extras.uiPreferences&&typeof extras.uiPreferences==='object'
    ? extras.uiPreferences
    : {};

  const width=Number(ui.sidebarWidth);
  if(Number.isFinite(width)&&width>0){
    try{
      localStorage.setItem(SIDEBAR_WIDTH_KEY,String(width));
      applySidebarWidth(width);
    }catch(_){}
  }

  if(Object.prototype.hasOwnProperty.call(ui,'statsRecapMonth')){
    S.statsRecapMonth=String(ui.statsRecapMonth||'');
  }
  if(Object.prototype.hasOwnProperty.call(ui,'statsHeatmapYear')){
    S.statsHeatmapYear=String(ui.statsHeatmapYear||'');
  }

  // Keep the fast local theme cache aligned with imported Settings.
  try{localStorage.setItem('mf_theme',String(S.settings?.theme||'dark'));}catch(_){}
}

function v148FinalizeImportedRuntime(){
  // Full backups replace the profile picture too, including intentionally empty.
  // v46's legacy fallback kept the pre-import picture when the imported value
  // was empty, so v148 explicitly honors the backup value.
  try{applyTheme(S.settings?.theme||'dark');}catch(_){}

  try{
    clearInterval(window.__sw);
    window.__sw=null;
    if(S.stopwatch?.running)window.__sw=setInterval(stopwatchTick,250);
  }catch(_){}

  try{restartBackupTimer();}catch(_){}
  try{v53InvalidateLibraryCache();}catch(_){}
  try{v53InvalidateSessionCache();}catch(_){}
}

function v148ImportSummary(){
  const orderCount=Array.isArray(S.orderPlan?.titleIds)?S.orderPlan.titleIds.length:0;
  const queueCount=Array.isArray(V123_RATING_QUEUE)?V123_RATING_QUEUE.length:0;
  return `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${(S.activityLog||[]).length.toLocaleString()} Library History · ${orderCount.toLocaleString()} ordered · ${queueCount.toLocaleString()} rating queue`;
}

// FINAL full export used at runtime.
App.exportJSON=function(){
  showDataProgress('Exporting complete MediaFlow backup','Auditing and packing all persistent MediaFlow data…',8);

  setTimeout(()=>{
    try{
      const payload=v148BuildFullBackup();
      const now=new Date(payload.exportedAt);
      const pad=n=>String(n).padStart(2,'0');
      const stamp=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

      updateDataProgress(55,'Packing Library, History, progression, Order, themes and local queues…');
      const json=JSON.stringify(payload,null,2);
      const blob=new Blob([json],{type:'application/json'});

      updateDataProgress(88,'Creating complete backup download…');
      triggerDownload(blob,`MediaFlow_Backup_${stamp}.json`);

      const c=payload.backupManifest?.counts||{};
      finishDataProgress(
        true,
        'Export successful',
        `Complete v${payload.mediaFlowVersion} backup · ${(c.libraryTitles||0).toLocaleString()} titles · ${(c.historyLogs||0).toLocaleString()} logs · ${(c.personalOrderTitles||0).toLocaleString()} ordered · ${(c.ratingQueue||0).toLocaleString()} rating queue`
      );
    }catch(e){
      console.error(e);
      finishDataProgress(false,'Export failed','MediaFlow could not create the complete backup file.');
    }
  },40);
};

// FINAL full import used at runtime.
App.importJSON=function(file){
  if(!file)return;

  showDataProgress('Importing complete MediaFlow backup','Reading and validating backup file…',5);

  const reader=new FileReader();
  reader.onprogress=e=>{
    if(e.lengthComputable){
      updateDataProgress(
        Math.min(22,5+Math.round((e.loaded/e.total)*17)),
        'Reading backup…'
      );
    }
  };

  reader.onload=async()=>{
    try{
      const data=JSON.parse(reader.result);
      const validation=v148ValidateBackup(data);
      if(!validation.ok){
        finishDataProgress(false,'Import rejected',validation.message);
        return;
      }

      updateDataProgress(26,'Restoring complete account state…');

      // Existing wrapper chain restores all modern account fields:
      // v120 Library History/profile, v121 nested repeat settings, v138 Order.
      v46ApplyState(data);

      // Honor exact full-backup replacement semantics for fields whose older
      // apply code intentionally used non-empty fallbacks.
      if(Object.prototype.hasOwnProperty.call(data,'profilePicture')){
        S.profilePicture=String(data.profilePicture||'').trim();
      }
      if(Object.prototype.hasOwnProperty.call(data,'profileName')){
        S.profileName=String(data.profileName||'').trim();
      }

      v148RestorePortableExtras(data);

      updateDataProgress(42,'Checking restored progression and completion data…');
      const info=await v46RecalculateXP(false);

      updateDataProgress(66,'Refreshing scheduler and runtime state…');
      await v46RefreshSchedulerProgress();
      v148FinalizeImportedRuntime();

      updateDataProgress(84,'Saving restored complete state to protected cloud storage…');
      await saveState();
      await saveQueue;

      render();

      finishDataProgress(
        true,
        validation.legacy?'Legacy backup imported':'Import successful',
        `${v148ImportSummary()} · Level ${info.level} · ${info.xp.toLocaleString()} XP`
      );
    }catch(e){
      console.error(e);
      finishDataProgress(
        false,
        'Import failed',
        'Could not restore that MediaFlow JSON backup. The file may be invalid or corrupted.'
      );
    }
  };

  reader.onerror=()=>finishDataProgress(false,'Import failed','The file could not be read.');
  reader.readAsText(file);
};

// Explain exactly what Full Backup now means in Settings without adding another
// exporter or import path.
const v148RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v148RenderSettingsBase();
  const note=`<div class="v148-backup-note"><b>Full Backup:</b> exports/restores all persistent MediaFlow account data — categories, Library metadata/covers/dates, consumption History, Settings/themes, XP ledgers, completion timeline, Library History, profile data, stopwatch, MAL link, Personal Order + recovery state and the saved Rating Queue. Browser authentication and filesystem folder permissions are not portable JSON data.</div>`;

  const exportButton='<button class="btn" onclick="App.exportJSON()">Export JSON backup</button>';
  if(out.includes(exportButton))out=out.replace(exportButton,exportButton+note);
  return out;
};
