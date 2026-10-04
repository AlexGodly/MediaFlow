/* ============================================================

   SESSION FLOW

   ============================================================ */

function startSession(){

  S.sessionActive = true;

  if(!S.currentTask) S.currentTask = generateTask([]);

  persistTask(); render();

}

function endSession(){

  v165EndSessionContext();

  S.sessionActive = false; S.currentTask = null; S.logging=false;

  persistTask(); render();

}

function rotateTask(){

  if(!S.currentTask) return;

  v165RecordReroll();

  const excl = [S.currentTask.categoryId];

  S.currentTask = generateTask(excl);

  S.logging=false;

  persistTask(); render();

}

function skipTask(){

  if(!S.currentTask) return;

  v165RecordSkip();

  const cat = getCategory(S.currentTask.categoryId);

  const sess = {

    id: uid(), timestamp: Date.now(), date: todayISO(),

    categoryId: cat.id, targetAmount: S.currentTask.targetMid, actualAmount: 0,

    minutes: 0, note: '', status: 'skipped', unit: cat.unit, xp: 0, healthStatus: categoryStatus(cat).status,

  };

  S.sessions.push(sess); persistSessions();

  S.currentTask = generateTask([cat.id]);

  S.logging=false;

  persistTask(); render();

}

function openLogForm(){

  const t = S.currentTask;

  S.logDraft = {

    categoryId: t.categoryId,

    amount: t.targetMid,

    minutes: Math.round(t.targetMid * getCategory(t.categoryId).minutesPerUnit),

    note:'',

    entries: [],           // [{title, qty, libraryId|null}]

    updateLibrary: true,

  };

  S.entryDraft = { title:'', qty:1 };

  S.logging = true; render();

}

function cancelLogForm(){ S.logging=false; render(); }

function findLibraryMatch(categoryId, title){

  const t = title.trim().toLowerCase();

  return S.library.find(i=>i.categoryId===categoryId && i.title.trim().toLowerCase()===t) || null;

}

function entriesNote(entries){

  return entries.map(e=> e.qty>1 ? `${e.title} ×${e.qty}` : e.title).join(', ');

}

function entriesTotal(entries){

  return entries.reduce((s,e)=>s+(Number(e.qty)||0),0);

}

function normalizeSeasonalLibraryItems(){
  // v72: Seasonal Anime titles stay in Seasonal Anime when completed.
  // Category changes are now always explicit/manual.
  return false;
}

const V89_LOG={page:0,pageSize:20,categories:[],status:'all',priority:'all',sort:'relevance'};
function v89ResetLogPage(){ V89_LOG.page=0; }
function logTitleCandidates(query){
  const q=String(query||'').trim().toLowerCase();
  if(!q) return [];
  let rows=S.library.filter(i=>i && cleanTitle(i.title).toLowerCase().includes(q));
  if(V89_LOG.categories.length) rows=rows.filter(i=>V89_LOG.categories.includes(String(i.categoryId||'')));
  if(V89_LOG.status!=='all') rows=rows.filter(i=>String(i.status||'planned').toLowerCase()===V89_LOG.status);
  if(V89_LOG.priority!=='all') rows=rows.filter(i=>String(i.priority||'medium').toLowerCase()===V89_LOG.priority);
  const rank={low:0,medium:1,high:2}, num=v=>Number.isFinite(Number(v))?Number(v):0;
  const cmpTitle=(a,b)=>cleanTitle(a.title).localeCompare(cleanTitle(b.title),undefined,{numeric:true,sensitivity:'base'});
  rows=rows.slice().sort((a,b)=>{
    let d=0;
    if(V89_LOG.sort==='title-asc') return cmpTitle(a,b);
    if(V89_LOG.sort==='title-desc') return cmpTitle(b,a);
    if(V89_LOG.sort==='priority-desc') d=(rank[b.priority]??1)-(rank[a.priority]??1);
    else if(V89_LOG.sort==='priority-asc') d=(rank[a.priority]??1)-(rank[b.priority]??1);
    else if(V89_LOG.sort==='rating-desc') d=num(b.rating)-num(a.rating);
    else if(V89_LOG.sort==='rating-asc') d=num(a.rating)-num(b.rating);
    else if(V89_LOG.sort==='progress-desc') d=num(b.progress)-num(a.progress);
    else if(V89_LOG.sort==='progress-asc') d=num(a.progress)-num(b.progress);
    else if(V89_LOG.sort==='total-desc') d=num(b.total)-num(a.total);
    else if(V89_LOG.sort==='total-asc') d=num(a.total)-num(b.total);
    else {
      const at=cleanTitle(a.title).toLowerCase(), bt=cleanTitle(b.title).toLowerCase();
      const ar=at===q?0:at.startsWith(q)?1:2, br=bt===q?0:bt.startsWith(q)?1:2;
      d=ar-br || at.indexOf(q)-bt.indexOf(q);
    }
    return d||cmpTitle(a,b);
  });
  return rows;
}
function v89LogPage(p){ V89_LOG.page=Math.max(0,Number(p)||0); renderLogSuggestions(); }
function v89LogFilter(k,v){ V89_LOG[k]=v; V89_LOG.page=0; renderLogSuggestions(); }
function v89ToggleLogCategory(id,on){
  const set=new Set(V89_LOG.categories||[]); if(on)set.add(id);else set.delete(id); V89_LOG.categories=[...set]; V89_LOG.page=0; renderLogSuggestions();
}
function v89ClearLogCategories(){V89_LOG.categories=[];V89_LOG.page=0;renderLogSuggestions();}
function v89ClearLogFilters(){V89_LOG.categories=[];V89_LOG.status='all';V89_LOG.priority='all';V89_LOG.sort='relevance';V89_LOG.page=0;renderLogSuggestions();}
function v89LogTools(candidates,pages){
  const cats=(S.categories||[]).filter(c=>c&&c.id);
  const catLabel=V89_LOG.categories.length?`${V89_LOG.categories.length} categories selected`:'All categories';
  return `<div class="v87-log-tools v89-log-tools" data-v89-log-tools="1">
    <details class="v66-cat-filter"><summary class="btn">${catLabel} ▾</summary><div class="v66-cat-panel"><div class="v66-cat-head"><b>Show categories</b><button type="button" class="btn btn-sm btn-ghost" data-v89-action="all-categories">All</button></div>${cats.map(c=>`<label class="v66-cat-option"><input type="checkbox" data-v89-category="${escapeHtml(String(c.id))}" ${V89_LOG.categories.includes(String(c.id))?'checked':''}><span>${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</span></label>`).join('')}</div></details>
    <select data-v89-filter="sort" aria-label="Logging title display order"><option value="relevance" ${V89_LOG.sort==='relevance'?'selected':''}>Best match</option><option value="priority-desc" ${V89_LOG.sort==='priority-desc'?'selected':''}>Priority: High → Low</option><option value="priority-asc" ${V89_LOG.sort==='priority-asc'?'selected':''}>Priority: Low → High</option><option value="title-asc" ${V89_LOG.sort==='title-asc'?'selected':''}>Title: A → Z</option><option value="title-desc" ${V89_LOG.sort==='title-desc'?'selected':''}>Title: Z → A</option><option value="rating-desc" ${V89_LOG.sort==='rating-desc'?'selected':''}>Rating: High → Low</option><option value="rating-asc" ${V89_LOG.sort==='rating-asc'?'selected':''}>Rating: Low → High</option><option value="progress-desc" ${V89_LOG.sort==='progress-desc'?'selected':''}>Progress: Most → Least</option><option value="progress-asc" ${V89_LOG.sort==='progress-asc'?'selected':''}>Progress: Least → Most</option><option value="total-desc" ${V89_LOG.sort==='total-desc'?'selected':''}>Total: Most → Least</option><option value="total-asc" ${V89_LOG.sort==='total-asc'?'selected':''}>Total: Least → Most</option></select>
    <select data-v89-filter="status" aria-label="Logging title status"><option value="all" ${V89_LOG.status==='all'?'selected':''}>All statuses</option>${['planned','active','paused','completed','dropped'].map(x=>`<option value="${x}" ${V89_LOG.status===x?'selected':''}>${v199StatusLabel(x)}</option>`).join('')}</select>
    <select data-v89-filter="priority" aria-label="Logging title priority"><option value="all" ${V89_LOG.priority==='all'?'selected':''}>All priorities</option>${['high','medium','low'].map(x=>`<option value="${x}" ${V89_LOG.priority===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select>
    <button type="button" class="btn btn-sm btn-ghost v87-log-clear" data-v89-action="clear">Clear filters</button>
    <span class="v87-log-count">${candidates.length.toLocaleString()} match${candidates.length===1?'':'es'} · Page ${V89_LOG.page+1}/${pages}</span>
  </div>`;
}
function v89BindLogFilterEvents(box){
  if(!box) return;
  box.querySelectorAll('[data-v89-filter]').forEach(el=>el.addEventListener('change',()=>{
    const key=el.dataset.v89Filter;
    V89_LOG[key]=String(el.value||'all').toLowerCase(); V89_LOG.page=0; renderLogSuggestions();
  }));
  box.querySelectorAll('[data-v89-category]').forEach(el=>el.addEventListener('change',()=>{
    const id=String(el.dataset.v89Category||''); const set=new Set(V89_LOG.categories||[]);
    if(el.checked)set.add(id);else set.delete(id); V89_LOG.categories=[...set]; V89_LOG.page=0; renderLogSuggestions();
  }));
  box.querySelectorAll('[data-v89-action="all-categories"]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();V89_LOG.categories=[];V89_LOG.page=0;renderLogSuggestions();}));
  box.querySelectorAll('[data-v89-action="clear"]').forEach(el=>el.addEventListener('click',()=>{V89_LOG.categories=[];V89_LOG.status='all';V89_LOG.priority='all';V89_LOG.sort='relevance';V89_LOG.page=0;renderLogSuggestions();}));
  box.querySelectorAll('[data-v89-page]').forEach(el=>el.addEventListener('click',()=>{
    if(el.disabled)return;
    v89LogPage(Number(el.dataset.v89Page));
  }));
}
function renderLogSuggestions(){
  const box=document.getElementById('log-suggestions'); if(!box)return;
  V89_LOG.pageSize=v175PageSize('loggingLibrary');
  const q=String(S.entryDraft.title||'').trim(); if(!q){box.innerHTML='';return;}
  const candidates=logTitleCandidates(q),pages=Math.max(1,Math.ceil(candidates.length/V89_LOG.pageSize));
  V89_LOG.page=Math.max(0,Math.min(V89_LOG.page,pages-1));
  const rows=candidates.slice(V89_LOG.page*V89_LOG.pageSize,(V89_LOG.page+1)*V89_LOG.pageSize);
  const tools=v89LogTools(candidates,pages);
  if(!rows.length){box.innerHTML=tools+'<div class="v86-log-empty">No matching Library titles with these filters.</div>';v89BindLogFilterEvents(box);return;}
  const list=`<div class="log-suggestion-list">${rows.map(i=>{const c=getCategory(i.categoryId),progress=i.total!=null?`${i.progress||0}/${i.total}`:'progress unknown';const repeat=(i.status==='completed'||(Number(i.total)>0&&Number(i.progress)>=Number(i.total)))?' · ↻ Rewatch/Reread':'';const cover=i.coverUrl?`<img class="v86-log-cover" src="${escapeHtml(i.coverUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'';return `<div class="log-suggestion"><div class="v86-log-result">${cover}<div><b>${escapeHtml(cleanTitle(i.title))}</b><small>${v144CategoryIconHtml(c)} ${escapeHtml(c?.name||'Library')} · ${escapeHtml(v199StatusLabel(i.status))} · ${escapeHtml(i.priority||'medium')} priority · ${progress}${repeat}</small></div></div><button class="btn btn-sm btn-ghost" type="button" onclick="App.selectLogTitle('${i.id}')">Use</button></div>`}).join('')}</div>`;
  const nums=[],from=Math.max(0,Math.min(V89_LOG.page-2,pages-5)),to=Math.min(pages,from+5);for(let n=from;n<to;n++)nums.push(`<button type="button" class="btn btn-sm ${n===V89_LOG.page?'active':''}" data-v89-page="${n}">${n+1}</button>`);
  const pager=pages>1?`<div class="v86-log-pager"><button type="button" class="btn btn-sm" ${V89_LOG.page===0?'disabled':''} data-v89-page="${V89_LOG.page-1}">← Prev</button>${nums.join('')}<button type="button" class="btn btn-sm" ${V89_LOG.page===pages-1?'disabled':''} data-v89-page="${V89_LOG.page+1}">Next →</button></div>`:'';
  box.innerHTML=tools+list+pager;
  v89BindLogFilterEvents(box);
}
function submitLog(){
  const t=S.currentTask;
  const assignedCat=getCategory(t.categoryId);const enteredAmount=clamp(Number(S.logDraft.amount)||0,0,999999);
  const totalMinutes=clamp(Number(S.logDraft.minutes)||0,0,999999);
  const entries=S.logDraft.entries||[];
  const extra=(S.logDraft.note||'').trim();
  const timestamp=Date.now(), sessionGroupId=uid();

  // v61: actual consumption and recommendation outcome are separate concepts.
  const groups=new Map();
  if(entries.length){
    entries.forEach(e=>{
      const item=e.libraryId?S.library.find(i=>i.id===e.libraryId):null;
      const actualCat=(item&&getCategory(item.categoryId))||assignedCat;
      const qty=Math.max(0,Number(e.qty)||0);
      if(!groups.has(actualCat.id)) groups.set(actualCat.id,{cat:actualCat,entries:[],amount:0,weight:0});
      const g=groups.get(actualCat.id); g.entries.push(e); g.amount+=qty;
      g.weight+=qty*Math.max(1,Number(actualCat.minutesPerUnit)||1);
    });
  }else if(enteredAmount>0){
    groups.set(assignedCat.id,{cat:assignedCat,entries:[],amount:enteredAmount,weight:Math.max(1,enteredAmount*Math.max(1,Number(assignedCat.minutesPerUnit)||1))});
  }

  const grouped=[...groups.values()], totalWeight=grouped.reduce((n,g)=>n+g.weight,0)||1;
  let minutesLeft=totalMinutes;
  grouped.forEach((g,index)=>{
    const actualCat=g.cat, isAssigned=actualCat.id===assignedCat.id;
    const groupMinutes=index===grouped.length-1?minutesLeft:Math.min(minutesLeft,Math.round(totalMinutes*(g.weight/totalWeight)));
    minutesLeft=Math.max(0,minutesLeft-groupMinutes);
    let status='logged';
    if(isAssigned){
      if(g.amount<t.targetMid) status='partial';
      else if(g.amount>t.targetMid) status='over';
      else status='complete';
    }
    const healthStatus=categoryStatus(actualCat).status;
    const xpCalc=calculateConsumptionXP(actualCat,g.amount,groupMinutes,healthStatus);
    const note=[entriesNote(g.entries),extra].filter(Boolean).join(' — ');
    S.sessions.push({
      id:uid(),timestamp,date:todayISO(),categoryId:actualCat.id,
      assignedCategoryId:assignedCat.id,assignedTargetAmount:t.targetMid,sessionGroupId,
      followedAssignedCategory:isAssigned,targetAmount:isAssigned?t.targetMid:g.amount,
      actualAmount:g.amount,minutes:groupMinutes,note,status,unit:actualCat.unit,
      xp:xpCalc.xp,healthStatus,source:'recommendation',
      titles:g.entries.map(e=>({title:cleanTitle(e.title),libraryId:e.libraryId||null,qty:Number(e.qty)||0,repeat:!!e.isRepeat}))
    });
  });

  // If none of the actual consumption belonged to the recommended category,
  // preserve the recommendation itself as Skipped without adding fake consumption.
  if(!grouped.some(g=>g.cat.id===assignedCat.id && g.amount>0)){
    S.sessions.push({id:uid(),timestamp,date:todayISO(),categoryId:assignedCat.id,
      assignedCategoryId:assignedCat.id,assignedTargetAmount:t.targetMid,sessionGroupId,
      followedAssignedCategory:false,targetAmount:t.targetMid,actualAmount:0,minutes:0,
      note:'Recommendation not followed',status:'skipped',unit:assignedCat.unit,xp:0,
      healthStatus:categoryStatus(assignedCat).status,source:'recommendation',titles:[]});
  }

  // v165: award System Respect XP once per recommendation/log group.
  // This runs before the normal persist/render path, so there is no extra
  // History scan, save, or render just to award the bonus.
  v165ApplyRespectReward(t,entries,sessionGroupId,assignedCat);

  if(S.logDraft.updateLibrary){
    entries.forEach(e=>{
      const item=e.libraryId?S.library.find(i=>i.id===e.libraryId):findLibraryMatch(assignedCat.id,e.title);
      if(item){
        // v81: repeat consumption counts in History/XP/stats but never pushes main Library progress past completion.
        if(e.isRepeat){ return; }
        item.progress=(item.progress||0)+(Number(e.qty)||0);
        if(item.total) item.progress=Math.min(item.progress,item.total);
        if(item.total&&item.progress>=item.total&&item.status!=='dropped'){
          item.status='completed'; item.completedAt=item.completedAt||timestamp;
          S.completionTimeline=S.completionTimeline||[];
          if(!S.completionTimeline.some(x=>x.libraryId===item.id)) S.completionTimeline.push({libraryId:item.id,title:cleanTitle(item.title),categoryId:item.categoryId,completedAt:item.completedAt});
        }else if(item.status==='planned') item.status='active';
      }
    });
    normalizeSeasonalLibraryItems(); persistLibrary();
  }
  persistSessions();
  const consumedCategoryIds=grouped.filter(g=>g.amount>0).map(g=>g.cat.id);
  S.currentTask=generateTask(consumedCategoryIds.length?consumedCategoryIds:[assignedCat.id]);
  S.logging=false; persistTask(); render();
}


