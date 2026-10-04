/* ============================================================
   OLD SYSTEM — Date View
   ============================================================ */

const v173NormalizeOldSystemBase=v153NormalizeOldSystem;
v153NormalizeOldSystem=function(raw){
  const out=v173NormalizeOldSystemBase(raw);
  const src=(raw&&typeof raw==='object')?raw:{};

  out.mode=['system','view','date','stats'].includes(String(src.mode))
    ?String(src.mode)
    :out.mode;

  const validDate=value=>{
    const s=String(value||'').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';
  };

  out.dateFrom=validDate(src.dateFrom);
  out.dateTo=validDate(src.dateTo);

  return out;
};

function v173SessionDayKey(s){
  const direct=String(s?.date||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(direct))return direct;

  const ts=Number(s?.timestamp)||0;
  if(!ts)return '';

  const d=new Date(ts);
  if(Number.isNaN(d.getTime()))return '';

  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0')
  ].join('-');
}

function v173OldSystemDateRows(){
  const os=v153EnsureOldSystem();
  const from=String(os.dateFrom||'');
  const to=String(os.dateTo||'');

  return v153HistoryRows().filter(s=>{
    const day=v173SessionDayKey(s);
    if(!day)return false;
    if(from&&day<from)return false;
    if(to&&day>to)return false;
    return true;
  });
}

function v173BuildOldSystemCacheForRows(rows){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  const rules=v153ActiveRules();

  const rawTotals=new Map();
  const sessionCounts=new Map();
  const minuteTotals=new Map();
  const simulatedBalances=new Map();
  const simulatedSpent=new Map();

  for(const id of os.enabledCategoryIds)simulatedBalances.set(id,0);

  for(const s of rows){
    const id=String(s.categoryId||'');
    const amount=Math.max(0,Number(s.actualAmount)||0);
    const minutes=Math.max(0,Number(s.minutes)||0);

    rawTotals.set(id,(rawTotals.get(id)||0)+amount);
    sessionCounts.set(id,(sessionCounts.get(id)||0)+1);
    minuteTotals.set(id,(minuteTotals.get(id)||0)+minutes);

    if(!enabled.has(id))continue;

    simulatedBalances.set(id,(simulatedBalances.get(id)||0)+amount);

    for(const r of rules){
      if(String(r.toCategoryId)!==id)continue;

      const cost=
        amount*
        (Number(r.fromAmount)||1)/
        (Number(r.toAmount)||1);

      const fromId=String(r.fromCategoryId);
      simulatedBalances.set(
        fromId,
        (simulatedBalances.get(fromId)||0)-cost
      );
      simulatedSpent.set(
        fromId,
        (simulatedSpent.get(fromId)||0)+cost
      );
    }
  }

  return {
    rawTotals,
    sessionCounts,
    minuteTotals,
    simulatedBalances,
    simulatedSpent,
    activityRows:rows.length
  };
}

function v173SetOldSystemDate(key,value){
  if(!['dateFrom','dateTo'].includes(String(key)))return;

  const os=v153EnsureOldSystem();
  const s=String(value||'').trim();

  os[key]=/^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';
  v153TouchOldSystem();
  render();
}

function v173ClearOldSystemDates(){
  const os=v153EnsureOldSystem();
  os.dateFrom='';
  os.dateTo='';
  v153TouchOldSystem();
  render();
}

function v173RenderDateViewMode(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();

  if(!enabled.length){
    return `<div class="v153-os-empty">No categories are configured for the Old System yet. Open <b>System</b> and add the categories you want to simulate.</div>`;
  }

  const rows=v173OldSystemDateRows();
  const cache=v173BuildOldSystemCacheForRows(rows);const cards=enabled.map(cat=>{
    const id=String(cat.id);
    const balance=cache.simulatedBalances.get(id)||0;
    const consumed=cache.rawTotals.get(id)||0;
    const spent=cache.simulatedSpent.get(id)||0;

    const extra=`<div class="v153-os-stat-line"><span>MediaFlow consumed</span><b>${v153FmtQty(consumed)}</b></div>
      <div class="v153-os-stat-line"><span>Spent as source</span><b>${v153FmtQty(spent)}</b></div>`;

    return v153SystemBalanceCard(cat,balance,extra);
  }).join('');

  const from=os.dateFrom||'Beginning';
  const to=os.dateTo||'Today';

  return `<div class="v153-os-card">
      <div class="v153-os-card-title">Date-range Old System Simulation</div>
      <div class="v153-os-card-sub">Same read-only simulation as View, but only genuine MediaFlow History inside the date range below is replayed through your Old System conversion rules.</div>

      <div class="v173-date-view-controls">
        <div class="field" style="margin:0">
          <label class="field-label">From</label>
          <input type="date" value="${escapeHtml(os.dateFrom||'')}"
            onchange="App.v173SetOldSystemDate('dateFrom',this.value)">
        </div>

        <div class="field" style="margin:0">
          <label class="field-label">To</label>
          <input type="date" value="${escapeHtml(os.dateTo||'')}"
            onchange="App.v173SetOldSystemDate('dateTo',this.value)">
        </div>

        <button class="btn btn-ghost" type="button"
          onclick="App.v173ClearOldSystemDates()"
          ${(!os.dateFrom&&!os.dateTo)?'disabled':''}>
          Clear dates
        </button>
      </div>

      <div class="v173-date-view-summary">
        ${cache.activityRows.toLocaleString()} consumption record${cache.activityRows===1?'':'s'} analyzed · ${escapeHtml(from)} → ${escapeHtml(to)}
      </div>
    </div>

    <div class="section-label">OLD SYSTEM FOR SELECTED DATES</div>
    <div class="v153-os-grid">${cards}</div>`;
}

// FINAL Old System mode tabs: add fourth Date View tab.
v153RenderModeTabs=function(){
  const mode=v153EnsureOldSystem().mode;

  return `<div class="v153-os-tabs">
    <button class="v153-os-tab ${mode==='system'?'active':''}" onclick="App.v153SetOldSystemMode('system')">System</button>
    <button class="v153-os-tab ${mode==='view'?'active':''}" onclick="App.v153SetOldSystemMode('view')">View</button>
    <button class="v153-os-tab ${mode==='date'?'active':''}" onclick="App.v153SetOldSystemMode('date')">Date View</button>
    <button class="v153-os-tab ${mode==='stats'?'active':''}" onclick="App.v153SetOldSystemMode('stats')">Stats</button>
  </div>`;
};

// FINAL Old System renderer: route the fourth mode.
const v173RenderOldSystemBase=renderOldSystem;
renderOldSystem=function(){
  const os=v153EnsureOldSystem();

  if(os.mode!=='date'){
    return v173RenderOldSystemBase();
  }

  return `<div class="v153-old-system">
    <div class="v153-os-head">
      <div>
        <div class="section-label">OLD SYSTEM</div>
        <h1 style="margin:4px 0 7px">Old System</h1>
        <div class="v153-os-sub">Your original category-conversion system, kept completely separate from MediaFlow's main scheduler. Date View lets you replay only a chosen History period.</div>
      </div>
    </div>
    ${v153RenderModeTabs()}
    ${v173RenderDateViewMode()}
  </div>`;
};

// FINAL mode setter accepts date mode.
const v173SetOldSystemModeBase=v153SetMode;
v153SetMode=function(mode){
  const next=String(mode||'');
  if(next==='date'){
    const os=v153EnsureOldSystem();
    os.mode='date';
    os.modifiedAt=Date.now();
    saveState();
    render();
    return;
  }
  return v173SetOldSystemModeBase(next);
};

App.v153SetOldSystemMode=v153SetMode;

Object.assign(App,{
  v173SetOldSystemDate,
  v173ClearOldSystemDates
});

