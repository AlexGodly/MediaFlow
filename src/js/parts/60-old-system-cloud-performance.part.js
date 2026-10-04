/* ============================================================
   MediaFlow v153 — Old System
   ------------------------------------------------------------
   Separate from MediaFlow's scheduler/recommendation engine.

   SYSTEM:
   - choose existing MediaFlow categories that participate;
   - define directional conversion rules;
   - consume units manually and maintain an independent balance ledger.

   VIEW:
   - read-only simulation of the same rules over actual MediaFlow History;
   - never modifies MediaFlow History, Library, recommendations or progress.

   STATS:
   - exact all-time consumed units from genuine non-skipped MediaFlow History.

   Old System data is persistent account data and participates in cloud state,
   Full Backup, Automatic Backup, import/restore and cloud merge.
   ============================================================ */

const V153_OLD_SYSTEM_DEFAULT={
  enabledCategoryIds:[],
  rules:[],
  balances:{},
  transactions:[],
  mode:'system',
  modifiedAt:0
};

S.oldSystem=S.oldSystem||JSON.parse(JSON.stringify(V153_OLD_SYSTEM_DEFAULT));
S.oldSystemUI=S.oldSystemUI||{consumeCategoryId:'',consumeAmount:1};

let V153_HISTORY_CACHE_DIRTY=true;
let V153_HISTORY_CACHE=null;

function v153Clone(value,fallback){
  try{return JSON.parse(JSON.stringify(value));}
  catch(_){return fallback;}
}

function v153CurrentCategoryIds(){
  return new Set((S.categories||[]).filter(c=>c?.id).map(c=>String(c.id)));
}

function v153NormalizeOldSystem(raw){
  const src=(raw&&typeof raw==='object')?raw:{};
  const existing=v153CurrentCategoryIds();

  const enabled=[...new Set(
    (Array.isArray(src.enabledCategoryIds)?src.enabledCategoryIds:[])
      .map(String)
      .filter(id=>existing.has(id))
  )];

  const balances={};
  if(src.balances&&typeof src.balances==='object'){
    for(const [id,value] of Object.entries(src.balances)){
      const n=Number(value);
      if(Number.isFinite(n))balances[String(id)]=n;
    }
  }

  const rules=(Array.isArray(src.rules)?src.rules:[])
    .filter(r=>r&&typeof r==='object')
    .map(r=>({
      id:String(r.id||uid()),
      fromCategoryId:String(r.fromCategoryId||''),
      toCategoryId:String(r.toCategoryId||''),
      fromAmount:Math.max(0.000001,Number(r.fromAmount)||1),
      toAmount:Math.max(0.000001,Number(r.toAmount)||1),
      createdAt:Number(r.createdAt)||Date.now()
    }))
    .filter(r=>r.fromCategoryId&&r.toCategoryId&&r.fromCategoryId!==r.toCategoryId);

  const transactions=(Array.isArray(src.transactions)?src.transactions:[])
    .filter(t=>t&&typeof t==='object')
    .map(t=>({
      id:String(t.id||uid()),
      timestamp:Number(t.timestamp)||Date.now(),
      type:String(t.type||'consume'),
      categoryId:String(t.categoryId||''),
      amount:Number(t.amount)||0,
      label:String(t.label||''),
      deltas:Array.isArray(t.deltas)
        ? t.deltas
            .filter(d=>d&&d.categoryId&&Number.isFinite(Number(d.delta)))
            .map(d=>({categoryId:String(d.categoryId),delta:Number(d.delta)}))
        : []
    }));

  return {
    enabledCategoryIds:enabled,
    rules,
    balances,
    transactions,
    mode:['system','view','stats'].includes(src.mode)?src.mode:'system',
    modifiedAt:Number(src.modifiedAt)||0
  };
}

function v153EnsureOldSystem(){
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);
  if(!S.oldSystemUI||typeof S.oldSystemUI!=='object'){
    S.oldSystemUI={consumeCategoryId:'',consumeAmount:1};
  }

  if(!S.oldSystem.enabledCategoryIds.includes(String(S.oldSystemUI.consumeCategoryId||''))){
    S.oldSystemUI.consumeCategoryId=S.oldSystem.enabledCategoryIds[0]||'';
  }
  if(!(Number(S.oldSystemUI.consumeAmount)>0))S.oldSystemUI.consumeAmount=1;

  return S.oldSystem;
}

function v153TouchOldSystem(save=true){
  const os=v153EnsureOldSystem();
  os.modifiedAt=Date.now();
  V153_HISTORY_CACHE_DIRTY=true;
  if(save)saveState();
}

function v153FmtQty(value){
  const n=Number(value)||0;
  if(Math.abs(n)<0.0000001)return '0';
  return n.toLocaleString(undefined,{maximumFractionDigits:3});
}

function v153CategoryName(id){
  return getCategory(id)?.name||'(removed category)';
}

function v153CategoryUnit(id,amount=2){
  const cat=getCategory(id);
  return unitLabel(cat.unit,Number(amount)===1?1:2);
}

function v153CategoryIcon(cat){
  try{return v144CategoryIconHtml(cat);}
  catch(_){return `<span>${escapeHtml(cat?.icon||'📦')}</span>`;}
}

function v153EnabledCategories(){
  const os=v153EnsureOldSystem();
  const set=new Set(os.enabledCategoryIds);
  return (S.categories||[]).filter(c=>c?.id&&set.has(String(c.id)));
}

function v153ActiveRules(){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  return os.rules.filter(r=>
    enabled.has(String(r.fromCategoryId))&&
    enabled.has(String(r.toCategoryId))&&
    r.fromCategoryId!==r.toCategoryId
  );
}

function v153RulesForConsumedCategory(categoryId){
  const id=String(categoryId||'');
  return v153ActiveRules().filter(r=>String(r.toCategoryId)===id);
}

function v153RuleSentence(r){
  const from=getCategory(r.fromCategoryId),to=getCategory(r.toCategoryId);
  return `Consume ${v153FmtQty(r.toAmount)} ${escapeHtml(unitLabel(to.unit,r.toAmount))} of ${escapeHtml(to.name)} → subtract ${v153FmtQty(r.fromAmount)} ${escapeHtml(unitLabel(from.unit,r.fromAmount))} from ${escapeHtml(from.name)}.`;
}

function v153HistoryRows(){
  const existing=v153CurrentCategoryIds();
  return (S.sessions||[])
    .filter(s=>
      s&&
      s.status!=='skipped'&&
      (Number(s.actualAmount)||0)>0&&
      s.categoryId&&
      existing.has(String(s.categoryId))
    )
    .slice()
    .sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0));
}

function v153BuildHistoryCache(){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  const rules=v153ActiveRules();

  const rawTotals=new Map();
  const sessionCounts=new Map();
  const minuteTotals=new Map();
  const simulatedBalances=new Map();
  const simulatedSpent=new Map();

  for(const id of os.enabledCategoryIds)simulatedBalances.set(id,0);

  const rows=v153HistoryRows();

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
      const cost=amount*(Number(r.fromAmount)||1)/(Number(r.toAmount)||1);
      const fromId=String(r.fromCategoryId);
      simulatedBalances.set(fromId,(simulatedBalances.get(fromId)||0)-cost);
      simulatedSpent.set(fromId,(simulatedSpent.get(fromId)||0)+cost);
    }
  }

  V153_HISTORY_CACHE={
    rawTotals,sessionCounts,minuteTotals,simulatedBalances,simulatedSpent,
    activityRows:rows.length,
    builtAt:Date.now(),
    oldSystemModifiedAt:Number(os.modifiedAt)||0
  };
  V153_HISTORY_CACHE_DIRTY=false;
  return V153_HISTORY_CACHE;
}

function v153HistoryCache(){
  const os=v153EnsureOldSystem();
  if(
    V153_HISTORY_CACHE_DIRTY||
    !V153_HISTORY_CACHE||
    V153_HISTORY_CACHE.oldSystemModifiedAt!==(Number(os.modifiedAt)||0)
  ){
    return v153BuildHistoryCache();
  }
  return V153_HISTORY_CACHE;
}

function v153SystemBalanceCard(cat,balance,extra=''){
  const n=Number(balance)||0;
  const cls=n<0?'v153-os-negative':(n>0?'v153-os-positive':'');
  return `<div class="v153-os-balance">
    <div class="v153-os-balance-head">
      <div class="v153-os-icon">${v153CategoryIcon(cat)}</div>
      <div style="min-width:0">
        <div class="v153-os-balance-name">${escapeHtml(cat.name)}</div>
        <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,2))} · ${v153FmtQty(cat.minutesPerUnit||0)}m per unit</div>
      </div>
    </div>
    <div class="v153-os-number ${cls}">${v153FmtQty(n)}</div>
    <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,n))} balance</div>
    ${extra}
  </div>`;
}

function v153RenderModeTabs(){
  const mode=v153EnsureOldSystem().mode;
  return `<div class="v153-os-tabs">
    <button class="v153-os-tab ${mode==='system'?'active':''}" onclick="App.v153SetOldSystemMode('system')">System</button>
    <button class="v153-os-tab ${mode==='view'?'active':''}" onclick="App.v153SetOldSystemMode('view')">View</button>
    <button class="v153-os-tab ${mode==='stats'?'active':''}" onclick="App.v153SetOldSystemMode('stats')">Stats</button>
  </div>`;
}

function v153RenderCategoryConfiguration(){
  const os=v153EnsureOldSystem();
  const enabled=new Set(os.enabledCategoryIds);
  const rows=(S.categories||[]).map(cat=>`
    <label class="v153-os-category-toggle">
      <input type="checkbox" ${enabled.has(String(cat.id))?'checked':''}
        onchange="App.v153ToggleOldSystemCategory('${String(cat.id).replace(/'/g,"\\'")}')">
      <div class="v153-os-icon">${v153CategoryIcon(cat)}</div>
      <div style="min-width:0">
        <b style="font-size:10.5px">${escapeHtml(cat.name)}</b>
        <small>${escapeHtml(unitLabel(cat.unit,2))} · ${v153FmtQty(cat.minutesPerUnit||0)}m/unit</small>
      </div>
    </label>`).join('');

  return `<div class="v153-os-card">
    <div class="v153-os-card-title">Categories in Old System</div>
    <div class="v153-os-card-sub">Choose which existing MediaFlow categories participate. This does not change whether a category is enabled in the normal MediaFlow scheduler.</div>
    <div class="v153-os-category-list">${rows||'<div class="v153-os-empty">No MediaFlow categories available.</div>'}</div>
  </div>`;
}

function v153RenderRules(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();
  const enabledSet=new Set(enabled.map(c=>String(c.id)));
  const rules=os.rules.filter(r=>enabledSet.has(String(r.fromCategoryId))&&enabledSet.has(String(r.toCategoryId)));

  const options=(selected)=>enabled.map(c=>
    `<option value="${escapeHtml(String(c.id))}" ${String(c.id)===String(selected)?'selected':''}>${escapeHtml(c.name)}</option>`
  ).join('');

  const html=rules.map(r=>`
    <div class="v153-os-rule">
      <div>
        <label>Subtract from</label>
        <select onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','fromCategoryId',this.value)">${options(r.fromCategoryId)}</select>
      </div>
      <div>
        <label>Units</label>
        <input type="number" min="0.001" step="0.001" value="${Number(r.fromAmount)||1}"
          onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','fromAmount',this.value)">
      </div>
      <div class="v153-os-rule-arrow">→</div>
      <div>
        <label>When consuming</label>
        <select onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','toCategoryId',this.value)">${options(r.toCategoryId)}</select>
      </div>
      <div>
        <label>Units</label>
        <input type="number" min="0.001" step="0.001" value="${Number(r.toAmount)||1}"
          onchange="App.v153UpdateOldSystemRule('${escapeHtml(r.id)}','toAmount',this.value)">
      </div>
      <button class="btn btn-ghost" onclick="App.v153RemoveOldSystemRule('${escapeHtml(r.id)}')">Remove</button>
    </div>
    <div class="v153-os-rule-text">${v153RuleSentence(r)}</div>
  `).join('');

  return `<div class="v153-os-card">
    <div class="v153-os-card-title">Conversion Rules</div>
    <div class="v153-os-card-sub">Rules are directional. Example: 4 Manga chapters → 2 Seasonal Anime episodes means consuming 2 Seasonal Anime subtracts 4 from Manga and adds 2 to Seasonal Anime.</div>
    ${html||'<div class="v153-os-empty">No conversion rules yet. Add at least two categories, then create a rule.</div>'}
    <button class="btn" onclick="App.v153AddOldSystemRule()" ${enabled.length<2?'disabled':''}>+ Add conversion rule</button>
  </div>`;
}

function v153ConsumptionPreview(categoryId,amount){
  const id=String(categoryId||'');
  const qty=Math.max(0,Number(amount)||0);
  if(!id||qty<=0)return 'Enter an amount to preview the balance changes.';

  const rules=v153RulesForConsumedCategory(id);
  const cat=getCategory(id);
  const parts=[`+${v153FmtQty(qty)} ${escapeHtml(unitLabel(cat.unit,qty))} to ${escapeHtml(cat.name)}`];

  for(const r of rules){
    const cost=qty*(Number(r.fromAmount)||1)/(Number(r.toAmount)||1);
    const from=getCategory(r.fromCategoryId);
    parts.push(`−${v153FmtQty(cost)} ${escapeHtml(unitLabel(from.unit,cost))} from ${escapeHtml(from.name)}`);
  }

  return parts.join(' · ');
}

function v153RenderSystemMode(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();

  const balances=enabled.length
    ? `<div class="v153-os-grid" style="margin-bottom:14px">${enabled.map(cat=>
        v153SystemBalanceCard(
          cat,
          os.balances[String(cat.id)]||0,
          `<div class="v153-os-adjust">
            <div><label>Set current balance</label><input type="number" step="0.001" id="v153-balance-${escapeHtml(String(cat.id))}" value="${Number(os.balances[String(cat.id)]||0)}"></div>
            <button class="btn btn-ghost" onclick="App.v153SetOldSystemBalance('${String(cat.id).replace(/'/g,"\\'")}')">Set</button>
          </div>`
        )).join('')}</div>`
    : '';

  const selected=enabled.some(c=>String(c.id)===String(S.oldSystemUI.consumeCategoryId))? String(S.oldSystemUI.consumeCategoryId)
    : String(enabled[0]?.id||'');

  S.oldSystemUI.consumeCategoryId=selected;

  const useCard=enabled.length?`<div class="v153-os-card">
    <div class="v153-os-card-title">Use Old System</div>
    <div class="v153-os-card-sub">Record consumption only inside the Old System ledger. This does not create MediaFlow History, change Library progress, or affect recommendations.</div>
    <div class="v153-os-use">
      <div>
        <label>Consumed category</label>
        <select onchange="App.v153SetOldSystemUseCategory(this.value)">
          ${enabled.map(c=>`<option value="${escapeHtml(String(c.id))}" ${String(c.id)===selected?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>Amount</label>
        <input type="number" min="0.001" step="0.001" value="${Number(S.oldSystemUI.consumeAmount)||1}" oninput="App.v153SetOldSystemUseAmount(this.value,false)" onchange="App.v153SetOldSystemUseAmount(this.value,true)">
      </div>
      <button class="btn btn-primary" onclick="App.v153ApplyOldSystemConsumption()">Apply consumption</button>
    </div>
    <div class="v153-os-preview" id="v153-old-system-preview">${v153ConsumptionPreview(selected,S.oldSystemUI.consumeAmount)}</div>
  </div>`:'';

  const existingCategoryIds=v153CurrentCategoryIds();
  const recent=os.transactions
    .filter(t=>!t.categoryId||existingCategoryIds.has(String(t.categoryId)))
    .slice(-12)
    .reverse();
  const activity=recent.length?`<div class="v153-os-card">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px">
      <div>
        <div class="v153-os-card-title" style="margin:0">Recent Old System Activity</div>
        <div class="v153-os-muted">Independent from MediaFlow History.</div>
      </div>
      <button class="btn btn-ghost" onclick="App.v153UndoOldSystem()" ${os.transactions.length?'':'disabled'}>Undo last</button>
    </div>
    <div class="v153-os-activity">
      ${recent.map(t=>`<div class="v153-os-activity-row">
        <div><b>${escapeHtml(t.label||'Old System change')}</b><div class="v153-os-muted">${new Date(Number(t.timestamp)||0).toLocaleString()}</div></div>
        <div style="text-align:right">${(t.deltas||[]).filter(d=>v153CurrentCategoryIds().has(String(d.categoryId||''))).map(d=>{
          const c=getCategory(d.categoryId),n=Number(d.delta)||0;
          return `<div class="${n<0?'v153-os-negative':'v153-os-positive'}">${n>=0?'+':''}${v153FmtQty(n)} ${escapeHtml(unitLabel(c.unit,n))}</div>`;
        }).join('')}</div>
      </div>`).join('')}
    </div>
  </div>`:'';

  return `
    ${enabled.length?`<div class="section-label">CURRENT OLD SYSTEM BALANCES</div>${balances}`:
      '<div class="v153-os-empty" style="margin-bottom:14px">Add categories below to start building your Old System.</div>'}
    ${useCard}
    ${v153RenderCategoryConfiguration()}
    ${v153RenderRules()}
    ${activity}
  `;
}

function v153RenderViewMode(){
  const os=v153EnsureOldSystem();
  const enabled=v153EnabledCategories();
  if(!enabled.length){
    return `<div class="v153-os-empty">No categories are configured for the Old System yet. Open <b>System</b> and add the categories you want to simulate.</div>`;
  }

  const cache=v153HistoryCache();
  const cards=enabled.map(cat=>{
    const id=String(cat.id);
    const balance=cache.simulatedBalances.get(id)||0;
    const consumed=cache.rawTotals.get(id)||0;
    const spent=cache.simulatedSpent.get(id)||0;
    const extra=`<div class="v153-os-stat-line"><span>MediaFlow consumed</span><b>${v153FmtQty(consumed)}</b></div>
      <div class="v153-os-stat-line"><span>Spent as source</span><b>${v153FmtQty(spent)}</b></div>`;
    return v153SystemBalanceCard(cat,balance,extra);
  }).join('');

  const rules=v153ActiveRules();
  return `<div class="v153-os-card">
      <div class="v153-os-card-title">Read-only Old System Simulation</div>
      <div class="v153-os-card-sub">This replays your genuine non-skipped MediaFlow History from oldest to newest using your Old System conversion rules. Nothing is written back to MediaFlow.</div>
      <div class="v153-os-muted">${cache.activityRows.toLocaleString()} consumption record${cache.activityRows===1?'':'s'} analyzed.</div>
      ${rules.length?`<div class="v153-os-rule-summary">${rules.map(r=>`<span class="v153-os-rule-pill">${v153RuleSentence(r)}</span>`).join('')}</div>`:''}
    </div>
    <div class="section-label">IF YOU HAD USED THE OLD SYSTEM</div>
    <div class="v153-os-grid">${cards}</div>`;
}

function v153AllStatCategories(cache){
  // v154: only show categories that currently exist in MediaFlow.
  // Historical sessions from deleted categories remain in normal History data,
  // but they are intentionally hidden from the Old System tab.
  return (S.categories||[]).filter(c=>c?.id);
}

function v153RenderStatsMode(){
  const cache=v153HistoryCache();
  const cats=v153AllStatCategories(cache);

  const cards=cats.map(cat=>{
    const id=String(cat.id);
    const total=cache.rawTotals.get(id)||0;
    const sessions=cache.sessionCounts.get(id)||0;
    const minutes=cache.minuteTotals.get(id)||0;
    return `<div class="v153-os-balance">
      <div class="v153-os-balance-head">
        <div class="v153-os-icon">${v153CategoryIcon(cat)}</div>
        <div style="min-width:0">
          <div class="v153-os-balance-name">${escapeHtml(cat.name)}</div>
          <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,2))}</div>
        </div>
      </div>
      <div class="v153-os-number">${v153FmtQty(total)}</div>
      <div class="v153-os-unit">${escapeHtml(unitLabel(cat.unit,total))} consumed</div>
      <div class="v153-os-stat-line"><span>History records</span><b>${sessions.toLocaleString()}</b></div>
      <div class="v153-os-stat-line"><span>Logged time</span><b>${escapeHtml(fmtMinutes(minutes))}</b></div>
    </div>`;
  }).join('');

  return `<div class="v153-os-card">
      <div class="v153-os-card-title">Exact MediaFlow Consumption</div>
      <div class="v153-os-card-sub">All-time genuine non-skipped MediaFlow History, grouped by category. No Old System conversion is applied here.</div>
    </div>
    <div class="v153-os-grid">${cards||'<div class="v153-os-empty">No consumption History yet.</div>'}</div>`;
}

function renderOldSystem(){
  // v154: normalize against current MediaFlow categories on every Old System render.
  // Deleted categories are dropped from enabled lists/rules immediately.
  const os=v153EnsureOldSystem();
  let body='';
  if(os.mode==='view')body=v153RenderViewMode();
  else if(os.mode==='stats')body=v153RenderStatsMode();
  else body=v153RenderSystemMode();

  return `<div class="v153-old-system">
    <div class="v153-os-head">
      <div>
        <div class="section-label">OLD SYSTEM</div>
        <h1 style="margin:4px 0 7px">Old System</h1>
        <div class="v153-os-sub">Your original category-conversion system, kept completely separate from MediaFlow's main scheduler. Use it directly, simulate it from MediaFlow History, or inspect exact category consumption.</div>
      </div>
    </div>
    ${v153RenderModeTabs()}
    ${body}
  </div>`;
}

// ---- Navigation ------------------------------------------------------------
ICONS.oldsystem=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h11l-3-3"/><path d="m18 7-3 3"/><path d="M17 17H6l3 3"/><path d="m6 17 3-3"/></svg>`;

if(!NAV_ITEMS.some(n=>n.id==='oldsystem')){
  const orderIndex=NAV_ITEMS.findIndex(n=>n.id==='order');
  const statsIndex=NAV_ITEMS.findIndex(n=>n.id==='stats');
  const at=orderIndex>=0?orderIndex+1:(statsIndex>=0?statsIndex:Math.max(0,NAV_ITEMS.length-2));
  NAV_ITEMS.splice(at,0,{id:'oldsystem',label:'Old System'});
}
if(!MOBILE_MORE_NAV.includes('oldsystem')){
  const oi=MOBILE_MORE_NAV.indexOf('order');
  MOBILE_MORE_NAV.splice(oi>=0?oi+1:0,0,'oldsystem');
}

const v153RenderViewBase=renderView;
renderView=function(){
  if(S.view==='oldsystem'){
    const root=document.getElementById('view-root');
    if(!root)return;
    root.innerHTML=`<div class="fade-in">${renderOldSystem()}</div>`;
    return;
  }
  return v153RenderViewBase();
};

// ---- Actions ---------------------------------------------------------------
function v153SetMode(mode){
  const os=v153EnsureOldSystem();
  if(!['system','view','stats'].includes(mode))return;
  os.mode=mode;
  os.modifiedAt=Date.now();
  saveState();
  render();
}

function v153ToggleCategory(id){
  const os=v153EnsureOldSystem();
  id=String(id||'');
  if(!id||!v153CurrentCategoryIds().has(id))return;

  const set=new Set(os.enabledCategoryIds);
  if(set.has(id))set.delete(id);
  else set.add(id);

  os.enabledCategoryIds=(S.categories||[])
    .map(c=>String(c.id))
    .filter(cid=>set.has(cid));

  if(!Object.prototype.hasOwnProperty.call(os.balances,id))os.balances[id]=0;
  if(!os.enabledCategoryIds.includes(String(S.oldSystemUI.consumeCategoryId||''))){
    S.oldSystemUI.consumeCategoryId=os.enabledCategoryIds[0]||'';
  }

  v153TouchOldSystem();
  render();
}

function v153AddRule(){
  const os=v153EnsureOldSystem();
  const ids=os.enabledCategoryIds.slice();
  if(ids.length<2){showToast('Add at least two categories first.');return;}

  os.rules.push({
    id:uid(),
    fromCategoryId:ids[0],
    toCategoryId:ids[1],
    fromAmount:1,
    toAmount:1,
    createdAt:Date.now()
  });
  v153TouchOldSystem();
  render();
}

function v153UpdateRule(id,key,value){
  const os=v153EnsureOldSystem();
  const r=os.rules.find(x=>String(x.id)===String(id));
  if(!r)return;

  if(key==='fromAmount'||key==='toAmount'){
    const n=Number(value);
    if(!(n>0)){showToast('Conversion amount must be greater than 0.');render();return;}
    r[key]=n;
  }else if(key==='fromCategoryId'||key==='toCategoryId'){
    const cid=String(value||'');
    if(!os.enabledCategoryIds.includes(cid))return;
    const other=key==='fromCategoryId'?String(r.toCategoryId):String(r.fromCategoryId);
    if(cid===other){showToast('A category cannot subtract from itself.');render();return;}
    r[key]=cid;
  }else return;

  v153TouchOldSystem();
  render();
}

function v153RemoveRule(id){
  const os=v153EnsureOldSystem();
  os.rules=os.rules.filter(r=>String(r.id)!==String(id));
  v153TouchOldSystem();
  render();
}

function v153SetBalance(catId){
  const os=v153EnsureOldSystem();
  const id=String(catId||'');
  if(!os.enabledCategoryIds.includes(id))return;

  const el=document.getElementById(`v153-balance-${id}`);
  const value=Number(el?.value);
  if(!Number.isFinite(value)){showToast('Enter a valid balance.');return;}

  const before=Number(os.balances[id])||0;
  const delta=value-before;
  if(Math.abs(delta)<0.0000001)return;

  os.balances[id]=value;
  os.transactions.push({
    id:uid(),timestamp:Date.now(),type:'adjustment',categoryId:id,amount:value,
    label:`Set ${v153CategoryName(id)} balance to ${v153FmtQty(value)}`,
    deltas:[{categoryId:id,delta}]
  });

  v153TouchOldSystem();
  render();
}

function v153SetUseCategory(id){
  const os=v153EnsureOldSystem();
  id=String(id||'');
  if(!os.enabledCategoryIds.includes(id))return;
  S.oldSystemUI.consumeCategoryId=id;
  const preview=document.getElementById('v153-old-system-preview');
  if(preview)preview.innerHTML=v153ConsumptionPreview(id,S.oldSystemUI.consumeAmount);
}

function v153SetUseAmount(value,rerender=false){
  const n=Number(value);
  if(n>0)S.oldSystemUI.consumeAmount=n;
  const preview=document.getElementById('v153-old-system-preview');
  if(preview)preview.innerHTML=v153ConsumptionPreview(S.oldSystemUI.consumeCategoryId,S.oldSystemUI.consumeAmount);
  if(rerender&&!(n>0))render();
}

function v153ApplyConsumption(){
  const os=v153EnsureOldSystem();
  const id=String(S.oldSystemUI.consumeCategoryId||'');
  const qty=Number(S.oldSystemUI.consumeAmount);

  if(!os.enabledCategoryIds.includes(id)){showToast('Choose an Old System category.');return;}
  if(!(qty>0)){showToast('Consumption amount must be greater than 0.');return;}

  const deltas=[];
  os.balances[id]=(Number(os.balances[id])||0)+qty;
  deltas.push({categoryId:id,delta:qty});

  for(const r of v153RulesForConsumedCategory(id)){
    const fromId=String(r.fromCategoryId);
    const cost=qty*(Number(r.fromAmount)||1)/(Number(r.toAmount)||1);
    os.balances[fromId]=(Number(os.balances[fromId])||0)-cost;
    deltas.push({categoryId:fromId,delta:-cost});
  }

  const cat=getCategory(id);
  os.transactions.push({
    id:uid(),timestamp:Date.now(),type:'consume',categoryId:id,amount:qty,
    label:`Consumed ${v153FmtQty(qty)} ${unitLabel(cat.unit,qty)} of ${cat.name}`,
    deltas
  });

  v153TouchOldSystem();
  render();
  showToast(`Old System updated · +${v153FmtQty(qty)} ${cat.name}`);
}

function v153Undo(){
  const os=v153EnsureOldSystem();
  const t=os.transactions.pop();
  if(!t){showToast('Nothing to undo.');return;}

  for(const d of (t.deltas||[])){
    const id=String(d.categoryId||'');
    os.balances[id]=(Number(os.balances[id])||0)-(Number(d.delta)||0);
  }

  v153TouchOldSystem();
  render();
  showToast('Last Old System change undone');
}

Object.assign(App,{
  v153SetOldSystemMode:v153SetMode,
  v153ToggleOldSystemCategory:v153ToggleCategory,
  v153AddOldSystemRule:v153AddRule,
  v153UpdateOldSystemRule:v153UpdateRule,
  v153RemoveOldSystemRule:v153RemoveRule,
  v153SetOldSystemBalance:v153SetBalance,
  v153SetOldSystemUseCategory:v153SetUseCategory,
  v153SetOldSystemUseAmount:v153SetUseAmount,
  v153ApplyOldSystemConsumption:v153ApplyConsumption,
  v153UndoOldSystem:v153Undo
});

// ---- History-cache invalidation --------------------------------------------
const v153PersistSessionsBase=persistSessions;
persistSessions=function(){
  V153_HISTORY_CACHE_DIRTY=true;
  return v153PersistSessionsBase.apply(this,arguments);
};

const v153MfCommitBase=mfCommit;
mfCommit=function(){
  V153_HISTORY_CACHE_DIRTY=true;
  return v153MfCommitBase.apply(this,arguments);
};

const v153RestoreCoreBase=mfRestoreCore;
mfRestoreCore=function(){
  V153_HISTORY_CACHE_DIRTY=true;
  return v153RestoreCoreBase.apply(this,arguments);
};

// ---- Persistence / Cloud / Import ------------------------------------------
const v153SnapshotBase=snapshot;
snapshot=function(){
  S.oldSystem=v153NormalizeOldSystem(S.oldSystem);
  const x=v153SnapshotBase();
  x.oldSystem=v153Clone(S.oldSystem,V153_OLD_SYSTEM_DEFAULT);
  return x;
};

const v153LoadAllBase=loadAll;
loadAll=async function(){
  await v153LoadAllBase();
  const d=await rawGet(STATE_KEY);
  S.oldSystem=v153NormalizeOldSystem(d?.oldSystem);
  S.oldSystemUI={consumeCategoryId:S.oldSystem.enabledCategoryIds[0]||'',consumeAmount:1};
  S.navLayout=v161NormalizeNavLayout(d?.navLayout);
  S.respectState=v165NormalizeRespectState(d?.respectState);
  S.categoryRecovery=v171NormalizeCategoryRecovery(d?.categoryRecovery);
  if(d?.portableExtras) v155ApplyPortableExtras(d.portableExtras);
  V153_HISTORY_CACHE_DIRTY=true;
};

const v153ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v153ApplyStateBase.apply(this,arguments);
  S.oldSystem=v153NormalizeOldSystem(d?.oldSystem);
  S.oldSystemUI={consumeCategoryId:S.oldSystem.enabledCategoryIds[0]||'',consumeAmount:1};
  V153_HISTORY_CACHE_DIRTY=true;
  return result;
};

const v153MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v153MergeStatesBase(a,b)||{};
  const ao=a?.oldSystem&&typeof a.oldSystem==='object'?a.oldSystem:null;
  const bo=b?.oldSystem&&typeof b.oldSystem==='object'?b.oldSystem:null;

  let chosen=null;
  if(ao&&bo){
    chosen=(Number(ao.modifiedAt)||0)>=(Number(bo.modifiedAt)||0)?ao:bo;
  }else{
    chosen=ao||bo||null;
  }

  out.oldSystem=v153NormalizeOldSystem(chosen);
  return out;
};

// Make category deletion/toggling harmless to Old System rendering.
const v153SetViewBase=App.setView;
App.setView=function(v){
  if(v==='oldsystem')v153EnsureOldSystem();
  return v153SetViewBase.call(this,v);
};

// ---- Full Backup / Automatic Backup manifest -------------------------------
const v153BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v153BackupManifestBase(state,extras);
  const os=v153NormalizeOldSystem(state?.oldSystem);
  manifest.includes=Object.assign({},manifest.includes||{},{
    oldSystem:true,
    oldSystemRules:true,
    oldSystemBalances:true,
    oldSystemTransactions:true
  });
  manifest.counts=Object.assign({},manifest.counts||{},{
    oldSystemCategories:os.enabledCategoryIds.length,
    oldSystemRules:os.rules.length,
    oldSystemTransactions:os.transactions.length
  });
  return manifest;
};

// v152 automatic backups already call the final v148BuildFullBackup() chain.
// Because v153 adds Old System to snapshot(), BOTH Full Backup and Automatic
// Backup now include the entire Old System automatically.



/* ============================================================
   MediaFlow v155 — Complete Cloud State + Full Sync Now
   ------------------------------------------------------------
   Audit result:
   - v153/v154 Old System WAS already in snapshot(), saveState(), loadAll()
     and mergeStates(), so Old System actions were already cloud-persistent.
   - Sync Now also saw Old System because it used snapshot()/mergeStates().
   - However, a few newer portable persistent values still lived outside the
     cloud snapshot: Rating Queue order and supported portable UI preferences.
   - v150's final XP breakdown also stopped exposing repeat-summary fields that
     older Sync/Calculate-XP result text still expected.

   v155:
   - explicitly keeps Old System in the complete cloud state;
   - adds portable extras to cloud snapshots;
   - merges/restores those extras across devices;
   - replaces Sync Now with a protected, verified complete synchronization;
   - restores repeat-summary fields so Sync/XP reporting remains valid.
   ============================================================ */

const V155_CLOUD_SYNC_VERSION=155;
let V155_APPLYING_PORTABLE=false;
let V155_PORTABLE_SAVE_TIMER=null;

function v155UserScopedKey(name){
  return `${name}_${String(AUTH_USER?.id||'local')}`;
}
function v155RatingQueueStampKey(){return v155UserScopedKey('mf_rating_queue_updated_v155');}
function v155UIPrefsStampKey(){return v155UserScopedKey('mf_ui_prefs_updated_v155');}

function v155ReadStamp(key){
  try{return Math.max(0,Number(localStorage.getItem(key))||0);}
  catch(_){return 0;}
}
function v155WriteStamp(key,value=Date.now()){
  try{localStorage.setItem(key,String(Math.max(0,Number(value)||Date.now())));}
  catch(_){}
}
function v155SchedulePortableCloudSave(){
  if(V155_APPLYING_PORTABLE||V115_STARTUP_GUARD)return;
  clearTimeout(V155_PORTABLE_SAVE_TIMER);
  V155_PORTABLE_SAVE_TIMER=setTimeout(()=>{
    V155_PORTABLE_SAVE_TIMER=null;
    try{saveState();}catch(_){}
  },650);
}

function v155PortableUIValues(){
  return {
    sidebarWidth:v148PortableSidebarWidth(),
    statsRecapMonth:String(S.statsRecapMonth||''),
    statsHeatmapYear:String(S.statsHeatmapYear||'')
  };
}

function v155PortableExtras(){
  const ratingQueue=v148PortableRatingQueue();
  const uiPreferences=v155PortableUIValues();

  let ratingQueueUpdatedAt=v155ReadStamp(v155RatingQueueStampKey());
  let uiPreferencesUpdatedAt=v155ReadStamp(v155UIPrefsStampKey());

  // First v155 run: establish a stable timestamp only if this device actually
  // has pre-existing portable data. The stamp is then changed only on edits.
  if(!ratingQueueUpdatedAt && ratingQueue.length){
    ratingQueueUpdatedAt=Date.now();
    v155WriteStamp(v155RatingQueueStampKey(),ratingQueueUpdatedAt);
  }
  if(!uiPreferencesUpdatedAt && (
    Number(uiPreferences.sidebarWidth)>0 ||
    uiPreferences.statsRecapMonth ||
    uiPreferences.statsHeatmapYear
  )){
    uiPreferencesUpdatedAt=Date.now();
    v155WriteStamp(v155UIPrefsStampKey(),uiPreferencesUpdatedAt);
  }

  return {
    ratingQueue,
    uiPreferences,
    _syncMeta:{
      ratingQueueUpdatedAt,
      uiPreferencesUpdatedAt
    }
  };
}

function v155MergePortableExtras(localExtras,cloudExtras){
  const l=(localExtras&&typeof localExtras==='object')?localExtras:{};
  const c=(cloudExtras&&typeof cloudExtras==='object')?cloudExtras:{};
  const lm=l._syncMeta||{}, cm=c._syncMeta||{};

  const lq=Number(lm.ratingQueueUpdatedAt)||0;
  const cq=Number(cm.ratingQueueUpdatedAt)||0;
  const lu=Number(lm.uiPreferencesUpdatedAt)||0;
  const cu=Number(cm.uiPreferencesUpdatedAt)||0;

  let ratingQueue;
  let ratingQueueUpdatedAt;
  if(cq>lq){
    ratingQueue=Array.isArray(c.ratingQueue)?c.ratingQueue:[];
    ratingQueueUpdatedAt=cq;
  }else if(lq>cq){
    ratingQueue=Array.isArray(l.ratingQueue)?l.ratingQueue:[];
    ratingQueueUpdatedAt=lq;
  }else{
    // Legacy/no-stamp tie: prefer a non-empty local queue, otherwise cloud.
    ratingQueue=Array.isArray(l.ratingQueue)&&l.ratingQueue.length
      ? l.ratingQueue
      : (Array.isArray(c.ratingQueue)?c.ratingQueue:[]);
    ratingQueueUpdatedAt=Math.max(lq,cq);
  }

  let uiPreferences;
  let uiPreferencesUpdatedAt;
  if(cu>lu){
    uiPreferences=(c.uiPreferences&&typeof c.uiPreferences==='object')?c.uiPreferences:{};
    uiPreferencesUpdatedAt=cu;
  }else if(lu>cu){
    uiPreferences=(l.uiPreferences&&typeof l.uiPreferences==='object')?l.uiPreferences:{};
    uiPreferencesUpdatedAt=lu;
  }else{
    uiPreferences=(l.uiPreferences&&typeof l.uiPreferences==='object'&&Object.keys(l.uiPreferences).length)
      ? l.uiPreferences
      : ((c.uiPreferences&&typeof c.uiPreferences==='object')?c.uiPreferences:{});
    uiPreferencesUpdatedAt=Math.max(lu,cu);
  }

  return {
    ratingQueue:[...new Set((Array.isArray(ratingQueue)?ratingQueue:[]).map(String).filter(Boolean))],
    uiPreferences:Object.assign({},uiPreferences||{}),
    _syncMeta:{ratingQueueUpdatedAt,uiPreferencesUpdatedAt}
  };
}

function v155ApplyPortableExtras(extras){
  if(!extras||typeof extras!=='object')return;
  V155_APPLYING_PORTABLE=true;
  try{
    if(Array.isArray(extras.ratingQueue)){
      V123_RATING_QUEUE=extras.ratingQueue.map(String).filter(Boolean);
      V125_RATING_QUEUE_LOADED=true;
      try{v125SaveRatingQueue();}catch(_){}
      try{v123SyncRatingQueue();}catch(_){}
    }

    const ui=(extras.uiPreferences&&typeof extras.uiPreferences==='object')
      ?extras.uiPreferences:{};

    const width=Number(ui.sidebarWidth);
    if(Number.isFinite(width)&&width>0){
      try{applySidebarWidth(width);}catch(_){}
    }
    if(Object.prototype.hasOwnProperty.call(ui,'statsRecapMonth')){
      S.statsRecapMonth=String(ui.statsRecapMonth||'');
    }
    if(Object.prototype.hasOwnProperty.call(ui,'statsHeatmapYear')){
      S.statsHeatmapYear=String(ui.statsHeatmapYear||'');
    }

    const meta=extras._syncMeta||{};
    if(Number(meta.ratingQueueUpdatedAt)>0){
      v155WriteStamp(v155RatingQueueStampKey(),Number(meta.ratingQueueUpdatedAt));
    }
    if(Number(meta.uiPreferencesUpdatedAt)>0){
      v155WriteStamp(v155UIPrefsStampKey(),Number(meta.uiPreferencesUpdatedAt));
    }

    try{localStorage.setItem('mf_theme',String(S.settings?.theme||'dark'));}catch(_){}
  }finally{
    V155_APPLYING_PORTABLE=false;
  }
}

// Rating Queue changes now become cloud-persistent too, not only localStorage.
const v155SaveRatingQueueBase=v125SaveRatingQueue;
v125SaveRatingQueue=function(){
  let before='';
  let after='';
  try{before=localStorage.getItem(v125RatingQueueStorageKey())||'';}catch(_){}
  const result=v155SaveRatingQueueBase.apply(this,arguments);
  try{after=localStorage.getItem(v125RatingQueueStorageKey())||'';}catch(_){}
  if(!V155_APPLYING_PORTABLE && before!==after){
    v155WriteStamp(v155RatingQueueStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

// Supported UI preferences now get a modification timestamp and are included
// in the next normal cloud save / Sync Now.
const v155ApplySidebarWidthBase=applySidebarWidth;
applySidebarWidth=function(width){
  let before='';
  try{before=String(localStorage.getItem(SIDEBAR_WIDTH_KEY)||'');}catch(_){}
  const result=v155ApplySidebarWidthBase.apply(this,arguments);
  let after='';
  try{after=String(localStorage.getItem(SIDEBAR_WIDTH_KEY)||'');}catch(_){}
  if(!V155_APPLYING_PORTABLE && before!==after){
    v155WriteStamp(v155UIPrefsStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

const v155SetRecapMonthBase=App.setRecapMonth;
App.setRecapMonth=function(v){
  const result=v155SetRecapMonthBase.call(this,v);
  if(!V155_APPLYING_PORTABLE){
    v155WriteStamp(v155UIPrefsStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

const v155SetHeatmapYearBase=App.setHeatmapYear;
App.setHeatmapYear=function(v){
  const result=v155SetHeatmapYearBase.call(this,v);
  if(!V155_APPLYING_PORTABLE){
    v155WriteStamp(v155UIPrefsStampKey());
    v155SchedulePortableCloudSave();
  }
  return result;
};

// Explicit complete cloud snapshot. Old System was already added by v153;
// v155 adds the remaining portable cloud data.
const v155SnapshotBase=snapshot;
snapshot=function(){
  const x=v155SnapshotBase();
  x.oldSystem=v153Clone(v153NormalizeOldSystem(S.oldSystem),V153_OLD_SYSTEM_DEFAULT);
  x.portableExtras=v155PortableExtras();
  x.cloudSyncVersion=V155_CLOUD_SYNC_VERSION;
  return x;
};

// Merge portable persistent data in addition to the existing Library/History,
// XP ledgers, Personal Order and Old System merge layers.
const v155MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v155MergeStatesBase(a,b)||{};
  out.portableExtras=v155MergePortableExtras(a?.portableExtras,b?.portableExtras);
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    V155_CLOUD_SYNC_VERSION
  );
  return out;
};

// v150 optimized the progression breakdown but dropped repeat-summary fields
// still used by Sync Now / Calculate XP result text and Settings.
const v155XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v155XPBreakdownBase();
  const r=v121RepeatXPBreakdown();
  return Object.assign({},b,r);
};

function v155StateCompleteness(state){
  const s=(state&&typeof state==='object')?state:{};
  const missing=[];

  if(!Array.isArray(s.categories))missing.push('categories');
  if(!Array.isArray(s.library))missing.push('Library');
  if(!Array.isArray(s.sessions))missing.push('History');
  if(!s.settings||typeof s.settings!=='object')missing.push('Settings');
  if(!s.xpLedger||typeof s.xpLedger!=='object')missing.push('XP ledgers');
  if(!Array.isArray(s.activityLog))missing.push('Library History');
  if(!Array.isArray(s.completionTimeline))missing.push('completion timeline');
  if(!s.orderPlan||typeof s.orderPlan!=='object')missing.push('Personal Order');
  if(!s.oldSystem||typeof s.oldSystem!=='object')missing.push('Old System');
  if(!s.portableExtras||typeof s.portableExtras!=='object')missing.push('portable extras');

  return {ok:missing.length===0,missing};
}

function v155VerifyCloudState(cloudState,expected){
  const c=v155StateCompleteness(cloudState);
  if(!c.ok)return c;

  const problems=[];
  const sameCount=(key)=>{
    const a=Array.isArray(expected?.[key])?expected[key].length:0;
    const b=Array.isArray(cloudState?.[key])?cloudState[key].length:0;
    if(a!==b)problems.push(`${key} count`);
  };

  sameCount('library');
  sameCount('sessions');
  sameCount('activityLog');
  sameCount('completionTimeline');

  const eo=expected?.oldSystem||{}, co=cloudState?.oldSystem||{};
  if(Number(eo.modifiedAt||0)!==Number(co.modifiedAt||0))problems.push('Old System');

  const ep=expected?.orderPlan||{}, cp=cloudState?.orderPlan||{};
  if(Number(ep.modifiedAt||0)!==Number(cp.modifiedAt||0))problems.push('Personal Order');

  const eq=expected?.portableExtras?.ratingQueue||[];
  const cq=cloudState?.portableExtras?.ratingQueue||[];
  if(eq.length!==cq.length)problems.push('Rating Queue');

  return {ok:problems.length===0,missing:problems};
}

async function v155SyncNow(){
  if(v134OperationBusy('sync'))return;
  V134_HEAVY_OPERATION='sync';
  showDataProgress('Sync now','Preparing complete protected MediaFlow synchronization…',3);

  try{
    // Finish any older queued saves before we take the local source snapshot.
    await saveQueue;

    updateDataProgress(8,'Building complete local cloud snapshot…');
    const local=snapshot();
    const localCheck=v155StateCompleteness(local);
    if(!localCheck.ok){
      throw new Error(`Local state is incomplete (${localCheck.missing.join(', ')}). Sync stopped before writing anything.`);
    }
    await v134Yield();

    updateDataProgress(15,'Reading protected cloud state…');
    let cloud;
    try{
      cloud=await v115FetchCloudState();
    }catch(error){
      throw new Error(`Cloud read failed. Nothing was written. ${String(error?.message||error)}`);
    }

    // Preserve v115's core safety invariant: missing/suspicious cloud reads do
    // not automatically become writes, even when Sync Now is pressed.
    if(!cloud?.found){
      throw new Error('Cloud state is missing. Protected Sync stopped without writing anything. Retry the cloud connection or use the existing recovery flow.');
    }
    if(!cloud.state||typeof cloud.state!=='object'){
      throw new Error('Cloud state could not be read safely. Protected Sync stopped without writing anything.');
    }

    const localStats=v115StateStats(local);
    const cloudStats=v115StateStats(cloud.state);
    if(localStats.core>0 && cloudStats.core===0){
      throw new Error('Cloud state looks unexpectedly empty compared with this device. Protected Sync stopped without overwriting it.');
    }

    updateDataProgress(25,'Merging all cloud + local MediaFlow data…');
    const merged=mergeStates(local,cloud.state);
    const mergedCheck=v155StateCompleteness(merged);
    if(!mergedCheck.ok){
      throw new Error(`Merged state is incomplete (${mergedCheck.missing.join(', ')}). Sync stopped before upload.`);
    }
    await v134Yield();

    updateDataProgress(34,'Applying Library, History, Settings, Order and Old System…');
    v46ApplyState(merged);
    v155ApplyPortableExtras(merged.portableExtras);
    V153_HISTORY_CACHE_DIRTY=true;
    v149MarkStreakDirty();
    await v134Yield();

    updateDataProgress(41,'Rebuilding progression, repeats and streak XP…');
    await v134RecalculateXPOptimized(false,{
      start:42,
      historyEnd:61,
      completionEnd:73,
      repeatEnd:83
    });

    updateDataProgress(85,'Refreshing scheduler balance and health…');
    await v46RefreshSchedulerProgress();

    // Use rawSet directly here so Sync Now receives the real cloud-write error.
    // saveState() intentionally catches errors for normal UI autosaves.
    updateDataProgress(91,'Uploading one complete protected cloud state…');
    const finalState=snapshot();
    await rawSet(STATE_KEY,finalState);

    updateDataProgress(96,'Verifying cloud upload…');
    const verify=await v115FetchCloudState();
    if(!verify?.found||!verify.state){
      throw new Error('Cloud upload could not be verified after writing.');
    }
    const verification=v155VerifyCloudState(verify.state,finalState);
    if(!verification.ok){
      throw new Error(`Cloud verification found incomplete data: ${verification.missing.join(', ')}.`);
    }

    // Keep local recovery cache aligned with the verified cloud result.
    try{v115WriteRecoveryCache(verify.state);}catch(_){}

    const info=mediaFlowLevelInfo();
    const b=v120XPBreakdown();
    const os=v153NormalizeOldSystem(S.oldSystem);
    const queueCount=(V123_RATING_QUEUE||[]).length;

    render();
    finishDataProgress(
      true,
      'Sync complete & verified',
      `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${os.rules.length.toLocaleString()} Old System rule${os.rules.length===1?'':'s'} · ${os.transactions.length.toLocaleString()} Old System transaction${os.transactions.length===1?'':'s'} · ${queueCount.toLocaleString()} rating queue · ${b.completedTitles.toLocaleString()} completed · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · Level ${info.level} · ${info.xp.toLocaleString()} XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'Sync failed safely',String(e?.message||e));
  }finally{
    V134_HEAVY_OPERATION='';
  }
}

// FINAL runtime Sync Now.
App.syncNow=v155SyncNow;

// Keep the Settings explanation aligned with what v155 really synchronizes.
const v155RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v155RenderSettingsBase();
  h=h.replace(
    'Merge cloud + local data, refresh XP and scheduler calculations with the optimized large-library path, then upload one complete protected state.',
    'Merge and verify the complete cloud + local MediaFlow state — Library, History, Library History, Settings/themes, XP, Personal Order, Old System, Rating Queue and portable preferences — then refresh progression/scheduler calculations and verify the final cloud upload.'
  );
  h=h.replace(
    'Synchronize MediaFlow</b>',
    'Synchronize all MediaFlow data</b>'
  );
  return h;
};



/* ============================================================
   MediaFlow v156 — Fast Order / Large-Library Performance Engine
   ------------------------------------------------------------
   Audit of v155 Order found several expensive paths that Library had already
   solved years earlier:

   1) v141 invalidated the Library-picker candidate cache every time Order
      rendered, so merely switching away and back forced another full Library
      filter + sort.
   2) v138EnsureOrderPlan() normalized against the entire Library/categories
      repeatedly during one render.
   3) Ordered title/category lookups used Array.find(), turning large Orders into
      repeated O(Library) scans.
   4) Each Order row repeatedly called indexOf()/category filters, producing
      quadratic work as the Order grew.
   5) The default "Best match" picker sorted the entire Library alphabetically
      even when there was no search query.
   6) Order search recomputed the whole candidate set on every keystroke.

   v156 keeps the same Order data/UX but adds the same style of indexing,
   caching and debouncing used by the optimized Library tab.
   ============================================================ */

const V156_ORDER={
  plan:{
    planRef:null,
    libraryRef:null,
    libraryLen:-1,
    libraryToken:-1,
    categoriesRef:null,
    categoriesLen:-1
  },
  index:{
    libraryRef:null,
    libraryLen:-1,
    libraryToken:-1,
    categoriesRef:null,
    categoriesLen:-1,
    libraryById:new Map(),
    categoryById:new Map()
  },
  structure:{
    planRef:null,
    modifiedAt:-1,
    titleLen:-1,
    orderedItems:[],
    globalIndex:new Map(),
    byCategory:new Map(),
    categoryIndex:new Map(),
    membershipSignature:'0:0:0'
  }
};

let V156_ORDER_SEARCH_TIMER=null;

function v156CurrentLibraryToken(){
  try{return Number(V53_LIB?.libraryToken)||0;}
  catch(_){return 0;}
}

function v156EnsureOrderUI(){
  const ui=S.orderPlannerUI=S.orderPlannerUI||{};
  ui.search=String(ui.search||'');
  if(!(ui.picks instanceof Set))ui.picks=new Set(Array.isArray(ui.picks)?ui.picks.map(String):[]);
  ui.page=Math.max(0,Number(ui.page)||0);
  ui.pageSize=v175PageSize('orderLibrary');
  ui.categories=Array.isArray(ui.categories)?[...new Set(ui.categories.map(String).filter(Boolean))]:[];
  ui.status=['all','planned','active','paused','completed','dropped'].includes(String(ui.status||'all').toLowerCase())
    ?String(ui.status||'all').toLowerCase():'all';
  ui.priority=['all','high','medium','low'].includes(String(ui.priority||'all').toLowerCase())
    ?String(ui.priority||'all').toLowerCase():'all';

  const sorts=new Set([
    'relevance','priority-desc','priority-asc','title-asc','title-desc',
    'rating-desc','rating-asc','progress-desc','progress-asc','total-desc','total-asc'
  ]);
  ui.sort=sorts.has(String(ui.sort||'relevance'))?String(ui.sort):'relevance';

  const validCats=new Set((S.categories||[]).filter(c=>c?.id).map(c=>String(c.id)));
  ui.categories=ui.categories.filter(id=>validCats.has(id));
  return ui;
}

function v156NeedsOrderNormalize(){
  const c=V156_ORDER.plan;
  const token=v156CurrentLibraryToken();
  return (
    !S.orderPlan ||
    c.planRef!==S.orderPlan ||
    c.libraryRef!==S.library ||
    c.libraryLen!==(S.library||[]).length ||
    c.libraryToken!==token ||
    c.categoriesRef!==S.categories ||
    c.categoriesLen!==(S.categories||[]).length
  );
}

// FINAL lightweight ensure. Full normalization only happens after actual
// Library/category/state replacement, not dozens of times per Order render.
v138EnsureOrderPlan=function(){
  if(v156NeedsOrderNormalize()){
    S.orderPlan=v138NormalizeOrderPlan(S.orderPlan,S.library,S.categories);
    V156_ORDER.plan={
      planRef:S.orderPlan,
      libraryRef:S.library,
      libraryLen:(S.library||[]).length,
      libraryToken:v156CurrentLibraryToken(),
      categoriesRef:S.categories,
      categoriesLen:(S.categories||[]).length
    };
    V156_ORDER.structure.planRef=null;
  }
  v156EnsureOrderUI();
  return S.orderPlan;
};

function v156EnsureOrderIndexes(){
  const idx=V156_ORDER.index;
  const token=v156CurrentLibraryToken();
  const needsLibrary=(
    idx.libraryRef!==S.library ||
    idx.libraryLen!==(S.library||[]).length ||idx.libraryToken!==token
  );
  const needsCategories=(
    idx.categoriesRef!==S.categories ||
    idx.categoriesLen!==(S.categories||[]).length
  );

  if(needsLibrary){
    const map=new Map();
    for(const item of (S.library||[])){
      if(item?.id)map.set(String(item.id),item);
    }
    idx.libraryById=map;
    idx.libraryRef=S.library;
    idx.libraryLen=(S.library||[]).length;
    idx.libraryToken=token;
    V156_ORDER.structure.planRef=null;
  }

  if(needsCategories){
    const map=new Map();
    for(const cat of (S.categories||[])){
      if(cat?.id)map.set(String(cat.id),cat);
    }
    idx.categoryById=map;
    idx.categoriesRef=S.categories;
    idx.categoriesLen=(S.categories||[]).length;
    V156_ORDER.structure.planRef=null;
  }

  return idx;
}

function v156HashId(id){
  const s=String(id||'');
  let h=2166136261>>>0;
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  return h>>>0;
}

function v156EnsureOrderStructure(){
  const p=v138EnsureOrderPlan();
  const idx=v156EnsureOrderIndexes();
  const cache=V156_ORDER.structure;

  if(
    cache.planRef===p &&
    cache.modifiedAt===(Number(p.modifiedAt)||0) &&
    cache.titleLen===p.titleIds.length
  ){
    return cache;
  }

  const orderedItems=[];
  const globalIndex=new Map();
  const byCategory=new Map();
  const categoryIndex=new Map();

  // Commutative membership signature: reordering titles does not invalidate
  // the picker candidate set because membership itself has not changed.
  let xor=0,sum=0;

  for(let i=0;i<p.titleIds.length;i++){
    const id=String(p.titleIds[i]||'');
    if(!id)continue;

    const hash=v156HashId(id);
    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;

    const item=idx.libraryById.get(id);
    if(!item)continue;

    globalIndex.set(id,i);
    orderedItems.push(item);

    const catId=String(item.categoryId||'');
    let ids=byCategory.get(catId);
    if(!ids){
      ids=[];
      byCategory.set(catId,ids);
    }
    categoryIndex.set(`${catId}\u0000${id}`,ids.length);
    ids.push(id);
  }

  cache.planRef=p;
  cache.modifiedAt=Number(p.modifiedAt)||0;
  cache.titleLen=p.titleIds.length;
  cache.orderedItems=orderedItems;
  cache.globalIndex=globalIndex;
  cache.byCategory=byCategory;
  cache.categoryIndex=categoryIndex;
  cache.membershipSignature=`${p.titleIds.length}:${xor}:${sum}`;
  return cache;
}

// O(1) replacements for the old Array.find() helpers.
v138OrderItem=function(id){
  return v156EnsureOrderIndexes().libraryById.get(String(id))||null;
};
v138OrderCategory=function(id){
  return v156EnsureOrderIndexes().categoryById.get(String(id))||null;
};
v138OrderedItems=function(){
  return v156EnsureOrderStructure().orderedItems;
};
v138CategoryTitleIds=function(catId){
  return v156EnsureOrderStructure().byCategory.get(String(catId))||[];
};

// O(1) row position/can-move lookups instead of repeated titleIds.indexOf()
// and category-wide filters for every rendered row.
v138OrderRowHtml=function(item,position,scopeCatId=''){
  const cat=v138OrderCategory(item.categoryId);
  const st=v156EnsureOrderStructure();
  const id=String(item.id);
  const catId=String(scopeCatId||'');

  const globalIndex=st.globalIndex.get(id);
  let scopedIndex,scopedLength;
  if(catId){
    const ids=st.byCategory.get(catId)||[];
    scopedIndex=st.categoryIndex.get(`${catId}\u0000${id}`);
    scopedLength=ids.length;
  }else{
    scopedIndex=globalIndex;
    scopedLength=v138EnsureOrderPlan().titleIds.length;
  }

  const canUp=Number.isInteger(scopedIndex)&&scopedIndex>0;
  const canDown=Number.isInteger(scopedIndex)&&scopedIndex>=0&&scopedIndex<scopedLength-1;
  const status=v199StatusLabel(item.status);
  const moveFn=catId?'v138MoveTitleInCategory':'v138MoveTitle';
  const moveArgs=catId?`'${id}','${catId}'`:`'${id}'`;

  return `<div class="v138-order-row" draggable="true"
      ondragstart="App.v138OrderDragStart(event,'${id}','${catId}')"
      ondragend="App.v138OrderDragEnd(event)"
      ondragover="App.v138OrderDragOver(event)"
      ondrop="App.v138OrderDrop(event,'${id}','${catId}')">
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
      <button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${id}')" title="Remove from Order only">Remove</button>
    </div>
  </div>`;
};

// Avoid rebuilding category counts by filtering the entire Order once per category.
v138CategoryManagerHtml=function(){
  const p=v138EnsureOrderPlan();
  const st=v156EnsureOrderStructure();
  const hidden=new Set(p.hiddenCategories.map(String));
  const custom=p.categoryMode==='custom';
  const order=v138CategoryDisplayOrder();

  const rows=order.map((id,index)=>{
    const c=v138OrderCategory(id);
    if(!c)return '';
    const count=(st.byCategory.get(String(id))||[]).length;
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
};

// The old v141 render wrapper called this on EVERY Order render. v156 makes
// candidate validity key-driven instead, so tab switching does not throw away
// a perfectly valid 20k/30k-title candidate cache.
v141InvalidateOrderPickerCache=function(){};

// Stable membership key + Library performance token.
// Page/checkboxes remain intentionally excluded.
v141OrderPickerCacheKey=function(){
  const ui=v140EnsureOrderPickerUI();
  const st=v156EnsureOrderStructure();

  return JSON.stringify([
    String(ui.search||'').trim().toLocaleLowerCase(),
    [...(ui.categories||[])].map(String).sort(),
    String(ui.status||'all'),
    String(ui.priority||'all'),
    String(ui.sort||'relevance'),
    st.membershipSignature,
    v156CurrentLibraryToken(),
    (S.library||[]).length,
    (S.categories||[]).length
  ]);
};

// Fast one-pass picker filtering, using the same prebuilt search index as the
// optimized Library tab. Default no-query "Best match" preserves Library order
// and deliberately does NOT sort tens of thousands of titles just to open Order.
v138PickerMatches=function(){
  const key=v141OrderPickerCacheKey();
  if(V141_ORDER_PICKER_CACHE.key===key&&Array.isArray(V141_ORDER_PICKER_CACHE.candidates)){
    return V141_ORDER_PICKER_CACHE.candidates;
  }

  const p=v138EnsureOrderPlan();
  const ui=v140EnsureOrderPickerUI();
  const existing=new Set(p.titleIds.map(String));
  const selectedCats=ui.categories.length?new Set(ui.categories.map(String)):null;
  const q=String(ui.search||'').trim().toLocaleLowerCase();
  const catMap=v156EnsureOrderIndexes().categoryById;

  // Reuse MediaFlow's optimized Library title/search index.
  v53EnsureLibraryIndex();

  const rows=[];
  for(const row of V53_LIB.searchIndex){
    const item=row.item;
    const id=String(item?.id||'');
    if(!id||existing.has(id))continue;

    const catId=String(item.categoryId||'');
    if(selectedCats&&!selectedCats.has(catId))continue;
    if(ui.status!=='all'&&String(item.status||'planned').toLowerCase()!==ui.status)continue;
    if(ui.priority!=='all'&&String(item.priority||'medium').toLowerCase()!==ui.priority)continue;

    if(q){
      const cat=catMap.get(catId);
      const titleSearch=String(row.search||'');
      const searchable=`${titleSearch} ${(cat?.name||'').toLocaleLowerCase()} ${String(item.status||'').toLowerCase()} ${String(item.priority||'').toLowerCase()}`;
      if(!searchable.includes(q))continue;
    }

    rows.push(row);
  }

  // With no query and Best match, Library order is already useful and avoids
  // an unnecessary O(n log n) sort on first Order load.
  if(!(ui.sort==='relevance'&&!q)){
    const rank={low:0,medium:1,high:2};
    const num=v=>Number.isFinite(Number(v))?Number(v):0;
    const cmpTitle=(a,b)=>String(a.title||'').localeCompare(String(b.title||''),undefined,{numeric:true,sensitivity:'base'});

    rows.sort((a,b)=>{
      let d=0;
      const ai=a.item,bi=b.item;

      if(ui.sort==='title-asc')return cmpTitle(a,b);
      if(ui.sort==='title-desc')return cmpTitle(b,a);
      if(ui.sort==='priority-desc')d=(rank[String(bi.priority||'medium').toLowerCase()]??1)-(rank[String(ai.priority||'medium').toLowerCase()]??1);
      else if(ui.sort==='priority-asc')d=(rank[String(ai.priority||'medium').toLowerCase()]??1)-(rank[String(bi.priority||'medium').toLowerCase()]??1);
      else if(ui.sort==='rating-desc')d=num(bi.rating)-num(ai.rating);
      else if(ui.sort==='rating-asc')d=num(ai.rating)-num(bi.rating);
      else if(ui.sort==='progress-desc')d=num(bi.progress)-num(ai.progress);
      else if(ui.sort==='progress-asc')d=num(ai.progress)-num(bi.progress);
      else if(ui.sort==='total-desc')d=num(bi.total)-num(ai.total);
      else if(ui.sort==='total-asc')d=num(ai.total)-num(bi.total);
      else if(q){
        const at=String(a.search||'');
        const bt=String(b.search||'');
        const ar=at===q?0:at.startsWith(q)?1:at.includes(q)?2:3;
        const br=bt===q?0:bt.startsWith(q)?1:bt.includes(q)?2:3;
        const ax=at.includes(q)?at.indexOf(q):Number.MAX_SAFE_INTEGER;
        const bx=bt.includes(q)?bt.indexOf(q):Number.MAX_SAFE_INTEGER;
        d=ar-br||ax-bx;
      }
      return d||cmpTitle(a,b);
    });
  }

  const candidates=rows.map(x=>x.item);
  V141_ORDER_PICKER_CACHE={key,candidates};
  return candidates;
};

// Search now behaves like the optimized Library search: wait briefly while the
// user is typing instead of scanning a giant Library on each single keystroke.
v138OrderSearch=function(value){
  const ui=v140EnsureOrderPickerUI();
  ui.search=String(value||'');
  ui.page=0;

  clearTimeout(V156_ORDER_SEARCH_TIMER);
  V156_ORDER_SEARCH_TIMER=setTimeout(()=>{
    if(S.view!=='order')return;
    v141RefreshOrderPickerAll();
  },160);
};

// Filter changes are immediate. The cache key itself changes, so explicit cache
// destruction is no longer required.
v140OrderSetFilter=function(key,value){
  const ui=v140EnsureOrderPickerUI();
  if(!['sort','status','priority'].includes(String(key)))return;
  ui[key]=String(value||'all').toLowerCase();
  ui.page=0;
  v141RefreshOrderPickerAll();
};

v140OrderToggleCategory=function(id,on){
  const ui=v140EnsureOrderPickerUI();
  const set=new Set(ui.categories||[]);
  const sid=String(id||'');
  if(on)set.add(sid);else set.delete(sid);
  ui.categories=[...set];
  ui.page=0;
  v141RefreshOrderPickerAll();
};

v140OrderClearCategories=function(event){
  if(event){event.preventDefault();event.stopPropagation();}
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.page=0;
  v141RefreshOrderPickerAll();
};

v140OrderClearFilters=function(){
  const ui=v140EnsureOrderPickerUI();
  ui.categories=[];
  ui.status='all';
  ui.priority='all';
  ui.sort='relevance';
  ui.page=0;
  v141RefreshOrderPickerAll();
};

// Keep Order indexes aligned with the same invalidation signal used by Library.
const v156InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){
  V156_ORDER.plan.libraryRef=null;
  V156_ORDER.index.libraryRef=null;
  V156_ORDER.structure.planRef=null;
  return v156InvalidateLibraryCacheBase.apply(this,arguments);
};

// State/import/restore replacements should force one normalization/index rebuild.
const v156ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v156ApplyStateBase.apply(this,arguments);
  V156_ORDER.plan.planRef=null;
  V156_ORDER.plan.libraryRef=null;
  V156_ORDER.plan.categoriesRef=null;
  V156_ORDER.index.libraryRef=null;
  V156_ORDER.index.categoriesRef=null;
  V156_ORDER.structure.planRef=null;
  V141_ORDER_PICKER_CACHE={key:'',candidates:null};
  return result;
};

// Rebind inline handlers to the final v156 optimized functions.
Object.assign(App,{
  v138OrderSearch,
  v140OrderSetFilter,
  v140OrderToggleCategory,
  v140OrderClearCategories,
  v140OrderClearFilters
});

// v156 adds no persistent user data. Order Plan continues to use the existing
// cloud/full-backup/automatic-backup/import paths unchanged.



/* ============================================================
   MediaFlow v157 — Direct Numeric Ordering
   ------------------------------------------------------------
   Category Settings:
   - keep drag + ↑/↓
   - add exact 1-based position input.

   Order:
   - keep drag + ↑/↓
   - add exact 1-based title position input.
   - All Titles uses global Order position.
   - By Category uses the title's position inside that category only.

   These controls mutate the SAME existing categoryOrder / orderPlan data,
   so cloud sync, Full Backup, Automatic Backup and import need no new schema.
   ============================================================ */

function v157NormalizePosition(raw,max){
  const n=Math.round(Number(raw));
  if(!Number.isFinite(n)||max<1)return null;
  return Math.max(1,Math.min(max,n));
}

function v157SetCategoryPosition(id,rawPosition){
  const sid=String(id||'');
  const current=S.categories.findIndex(c=>String(c?.id||'')===sid);
  if(current<0)return;

  const position=v157NormalizePosition(rawPosition,S.categories.length);
  if(position==null){render();return;}

  const target=position-1;
  if(target===current){render();return;}

  const [category]=S.categories.splice(current,1);
  S.categories.splice(target,0,category);

  // Existing category persistence updates explicit categoryOrder + cloud.
  persistCategories();
  render();
  showToast(`${category.name} moved to #${position}`);
}

function v157SetOrderTitlePosition(id,rawPosition,catId=''){
  const p=v138EnsureOrderPlan();
  const sid=String(id||'');
  const cid=String(catId||'');

  if(!p.titleIds.includes(sid)){render();return;}

  if(!cid){
    const current=p.titleIds.indexOf(sid);
    const position=v157NormalizePosition(rawPosition,p.titleIds.length);
    if(position==null){render();return;}

    const target=position-1;
    if(target===current){render();return;}

    p.titleIds.splice(current,1);
    p.titleIds.splice(target,0,sid);
    v138TouchOrderPlan();
    render();

    const item=v138OrderItem(sid);
    showToast(`${cleanTitle(item?.title||'Title')} moved to #${position}`);
    return;
  }

  // In grouped By Category view the visible number is category-local.
  // Preserve all global interleaving slots and only reorder titles occupying
  // this category's existing slots.
  const st=v156EnsureOrderStructure();
  const ids=(st.byCategory.get(cid)||[]).slice();
  const current=ids.indexOf(sid);
  const position=v157NormalizePosition(rawPosition,ids.length);
  if(current<0||position==null){render();return;}

  const target=position-1;
  if(target===current){render();return;}

  const positions=ids
    .map(titleId=>st.globalIndex.get(String(titleId)))
    .filter(Number.isInteger)
    .sort((a,b)=>a-b);

  ids.splice(current,1);
  ids.splice(target,0,sid);

  if(positions.length!==ids.length){render();return;}
  positions.forEach((globalPos,i)=>{p.titleIds[globalPos]=ids[i];});

  v138TouchOrderPlan();
  render();

  const item=v138OrderItem(sid);
  const cat=v138OrderCategory(cid);
  showToast(`${cleanTitle(item?.title||'Title')} moved to #${position} in ${cat?.name||'category'}`);
}

// FINAL v157 Order row renderer: the position itself is editable.
v138OrderRowHtml=function(item,position,scopeCatId=''){
  const cat=v138OrderCategory(item.categoryId);
  const st=v156EnsureOrderStructure();
  const id=String(item.id);
  const catId=String(scopeCatId||'');

  const globalIndex=st.globalIndex.get(id);
  let scopedIndex,scopedLength;
  if(catId){
    const ids=st.byCategory.get(catId)||[];
    scopedIndex=st.categoryIndex.get(`${catId}\u0000${id}`);
    scopedLength=ids.length;
  }else{
    scopedIndex=globalIndex;
    scopedLength=v138EnsureOrderPlan().titleIds.length;
  }

  const canUp=Number.isInteger(scopedIndex)&&scopedIndex>0;
  const canDown=Number.isInteger(scopedIndex)&&scopedIndex>=0&&scopedIndex<scopedLength-1;
  const status=v199StatusLabel(item.status);
  const moveFn=catId?'v138MoveTitleInCategory':'v138MoveTitle';
  const moveArgs=catId?`'${id}','${catId}'`:`'${id}'`;

  return `<div class="v138-order-row" draggable="true"
      ondragstart="App.v138OrderDragStart(event,'${id}','${catId}')"
      ondragend="App.v138OrderDragEnd(event)"
      ondragover="App.v138OrderDragOver(event)"
      ondrop="App.v138OrderDrop(event,'${id}','${catId}')">
    <div class="v138-order-pos v157-order-pos" title="${catId?'Position inside category':'Global Order position'}">
      <input class="v157-position-input" type="number" min="1" max="${Math.max(1,scopedLength)}" step="1" value="${position}"
        draggable="false"
        aria-label="Set ${escapeHtml(cleanTitle(item.title))} order position"
        onclick="event.stopPropagation()" onmousedown="event.stopPropagation()" onpointerdown="event.stopPropagation()"
        ondragstart="event.preventDefault();event.stopPropagation();"
        onkeydown="if(event.key==='Enter'){this.blur();}"
        onchange="App.v157SetOrderTitlePosition('${id}',this.value,'${catId}')">
    </div>
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
      <button class="btn btn-sm btn-ghost" type="button" onclick="App.v138RemoveOrderTitle('${id}')" title="Remove from Order only">Remove</button>
    </div>
  </div>`;
};

Object.assign(App,{
  v157SetCategoryPosition,
  v157SetOrderTitlePosition
});



/* ============================================================
   MediaFlow v158 — Complete Import Metadata + Safe Cover Repair
   ------------------------------------------------------------
   Every Library import path now understands, when the source provides them:
   - Start Date        -> startedAt
   - Finish Date       -> completedAt
   - Source timestamp  -> createdAt + sourceTimestamp
   - Cover URL         -> coverUrl (URL only; image bytes/base64 are rejected)

   Covered import paths:
   - Multi-service Exchange Hub (JSON / CSV / XML and every listed service)
   - direct CSV import
   - MAL XML
   - Simkl JSON
   - public MAL sync

   Cover repair is deliberately conservative:
   - stable external IDs are preferred;
   - title-search matches must be exact and disambiguated;
   - ambiguous results are SKIPPED rather than guessed;
   - images are never downloaded into MediaFlow, only their external URL is saved;
   - processing is asynchronous/throttled and yields continuously so a huge
     Library / huge missing-cover set does not lock the UI.
   ============================================================ */

const V158_IMPORT_VERSION=158;
let V158_COVER_FIX_RUNNING=false;
let V158_COVER_FIX_CANCEL=false;
const V158_COVER_QUERY_CACHE=new Map();
const V158_PROVIDER_LAST_REQUEST=new Map();

function v158SafeHttpUrl(value){
  if(value==null)return '';
  let s=String(value).trim();
  if(!s)return '';
  if(s.startsWith('//'))s='https:'+s;
  if(!/^https?:\/\//i.test(s))return '';
  try{
    const u=new URL(s);
    if(!/^https?:$/.test(u.protocol))return '';
    return u.href;
  }catch(_){
    return '';
  }
}

function v158ParseDateLike(value){
  if(value==null||value==='')return 0;

  if(typeof value==='number' && Number.isFinite(value)){
    if(value>1e12)return Math.round(value);
    if(value>1e9)return Math.round(value*1000);
    return 0;
  }

  let s=String(value).trim();
  if(!s||s==='0'||s==='0000-00-00'||s==='0000-00-00 00:00:00')return 0;

  if(/^\d{10}$/.test(s)){
    const n=Number(s);
    return Number.isFinite(n)?n*1000:0;
  }
  if(/^\d{13}$/.test(s)){
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
    try{return Number(v135ParseDateInput(s))||0;}catch(_){}
  }

  const parsed=Date.parse(s);
  return Number.isFinite(parsed)?parsed:0;
}

function v158FirstDate(obj,keys){
  for(const key of keys){
    if(!obj)continue;
    const v=obj[key];
    const ts=v158ParseDateLike(v);
    if(ts>0)return ts;
  }
  return 0;
}

function v158NestedObjects(raw){
  const out=[];
  const push=x=>{
    if(x&&typeof x==='object'&&!Array.isArray(x)&&!out.includes(x))out.push(x);
  };
  push(raw);
  for(const key of [
    'show','movie','media','anime','manga','item','node','entry','book',
    'list_status','listStatus','user_data','userData','details'
  ])push(raw?.[key]);
  return out;
}

function v158UrlFromImageValue(value){
  if(!value)return '';
  if(typeof value==='string')return v158SafeHttpUrl(value);
  if(typeof value!=='object')return '';

  const direct=[
    'large_image_url','image_url','original','large','medium','small',
    'url','src','href','poster','cover'
  ];
  for(const key of direct){
    const u=v158SafeHttpUrl(value[key]);
    if(u)return u;
  }

  for(const key of ['jpg','webp','image','images','main_picture','poster','cover']){
    const u=v158UrlFromImageValue(value[key]);
    if(u)return u;
  }
  return '';
}

function v158ExtractCoverUrl(raw){
  const objects=v158NestedObjects(raw);

  // Only poster/cover-oriented fields are considered. Do not scan arbitrary
  // artwork/background/fanart fields: wrong-image avoidance matters more than
  // filling every blank cover.
  const keys=[
    'coverUrl','cover_url','cover','cover_image','coverImage',
    'posterUrl','poster_url','poster',
    'imageUrl','image_url','series_image','anime_image','manga_image',
    'main_picture','images','image','thumbnail_url','thumbnail'
  ];

  for(const obj of objects){
    for(const key of keys){
      const u=v158UrlFromImageValue(obj?.[key]);
      if(u)return u;
    }
  }
  return '';
}

function v158NormalizeExternalIds(raw){
  const objs=v158NestedObjects(raw);
  const out={simkl:null,mal:null,anilist:null,tmdb:null,imdb:null,trakt:null,kitsu:null,isbn:null};

  const first=(names)=>{
    for(const o of objs){
      const ids=o?.ids&&typeof o.ids==='object'?o.ids:{};
      for(const n of names){
        const values=[
          ids[n], o?.[n], o?.[`${n}_id`], o?.[`${n}Id`]
        ];
        for(const v of values){
          if(v!=null&&String(v).trim()!=='')return v;
        }
      }
    }
    return null;
  };

  out.simkl=first(['simkl']);
  out.mal=first(['mal','series_animedb','series_mangadb','manga_mangadb']);
  out.anilist=first(['anilist','ani_list']);
  out.tmdb=first(['tmdb','tmdbtv','tmdb_movie','tmdb_show']);
  out.imdb=first(['imdb','imdbid','const']);
  out.trakt=first(['trakt']);
  out.kitsu=first(['kitsu']);
  out.isbn=first(['isbn','isbn13','isbn10']);

  // Common XML field names that do not follow *_id.
  if(!out.mal){
    for(const o of objs){
      const v=o?.series_animedb_id??o?.manga_mangadb_id??o?.series_mangadb_id;
      if(v!=null&&String(v).trim()!==''){out.mal=v;break;}
    }
  }
  if(!out.imdb){
    for(const o of objs){
      const v=o?.const;
      if(v!=null&&String(v).trim()!==''){out.imdb=v;break;}
    }
  }

  return out;
}

function v158NormalizeStatus(value){
  return mfNormStatus(value);
}

function v158NormalizedTitleKey(value){
  return cleanTitle(String(value||''))
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/&/g,' and ')
    .replace(/[’'`´]/g,'')
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim()
    .replace(/\s+/g,' ');
}

function v158InferCategory(raw,service){
  const objs=v158NestedObjects(raw);
  const flat=Object.assign({},...objs.slice().reverse(),raw||{});
  const group=String(raw?.__group||'').toLowerCase();

  const mangaSignal=
    flat.manga_title!=null ||
    flat.my_read_chapters!=null ||
    flat.num_chapters_read!=null ||
    group==='manga' ||
    /manga|manhwa|manhua/.test(String(flat.manga_type||'').toLowerCase());

  if(mangaSignal){
    const t=String(flat.manga_type||flat.type||flat.format||'').toLowerCase();
    return /manhwa|manhua/.test(t)?'manhwa':'manga';
  }

  const animeSignal=
    flat.anime_title!=null ||
    flat.series_animedb_id!=null ||
    group==='anime' ||
    ['anilist','anisearch','aniwatch','hianime','livechart','kitsu','mal','malxml','crunchyroll'].includes(String(service||''));

  if(animeSignal){
    const type=String(flat.series_type||flat.anime_type||flat.type||flat.format||'').toLowerCase();
    if(/movie|film/.test(type))return 'animemovies';
    if(/currently airing|airing/.test(String(flat.series_status||flat.airing_status||'')))return 'seasonal';
    if(flat.airing===true||flat.is_airing===true||Number(flat.not_aired_episodes_count)>0)return 'seasonal';
    return 'backlog';
  }

  if(group==='movies')return 'movies';
  if(group==='shows')return 'tv';

  return mfGuessCategory(flat,service);
}

function v158SimklEpisodeBounds(raw){
  let first=0,last=0;
  for(const season of (raw?.seasons||[])){
    for(const ep of (season?.episodes||[])){
      const ts=v158ParseDateLike(ep?.watched_at??ep?.watchedAt??ep?.date);
      if(!ts)continue;
      if(!first||ts<first)first=ts;
      if(ts>last)last=ts;
    }
  }
  return {first,last};
}

function v158NormalizeRecord(raw,service){
  if(!raw||typeof raw!=='object')return null;
  const objs=v158NestedObjects(raw);
  const nested=raw.show||raw.movie||raw.media||raw.anime||raw.manga||raw.item||raw.node||raw.entry||raw.book||{};
  const list=raw.list_status||raw.listStatus||{};
  const o=Object.assign({},nested,list,raw);

  const title=cleanTitle(String(mfFirst(o,[
    'title','name','series_title','manga_title','anime_title','movie_title',
    'original_title','primary_title','canonical_title'
  ])||''));
  if(!title)return null;

  const progress=Number(mfFirst(o,[
    'progress','watched_episodes','watched_episodes_count','episodes_watched',
    'episode','my_watched_episodes','chapters_read','my_read_chapters',
    'num_episodes_watched','num_chapters_read','watched'
  ])||0)||0;

  let total=Number(mfFirst(o,[
    'total','total_episodes','total_episodes_count','episodes_total','series_episodes',
    'chapters_total','series_chapters','manga_chapters','num_episodes','num_chapters'
  ])||0)||null;

  const categoryId=v158InferCategory(raw,service);
  if(categoryId==='movies'||categoryId==='animemovies')total=total||1;

  const status=v158NormalizeStatus(mfFirst(o,['status','list_status','my_status','state']));
  const rating=Number(mfFirst(o,['rating','user_rating','your_rating','score','my_score'])||0)||null;
  const year=Number(mfFirst(o,['year','release_year','title_year','start_year'])||0)||null;

  let startedAt=0;
  let completedAt=0;
  let sourceTimestamp=0;

  const startKeys=[
    'start_date','started_at','startedAt','startdate','date_started','started',
    'my_start_date','first_watched_at','first_read_at','watching_started_at'
  ];
  const finishKeys=[
    'finish_date','finished_at','finishedAt','completed_at','completedAt',
    'finishdate','date_completed','my_finish_date','last_watched_at',
    'last_read_at','ended_at'
  ];
  const timestampKeys=[
    'timestamp','created_at','createdAt','added_at','addedAt','date_added',
    'added_to_watchlist_at','listed_at','list_added_at','my_last_updated',
    'updated_at','updatedAt'
  ];

  for(const obj of objs){
    if(!startedAt)startedAt=v158FirstDate(obj,startKeys);
    if(!completedAt)completedAt=v158FirstDate(obj,finishKeys);
    if(!sourceTimestamp)sourceTimestamp=v158FirstDate(obj,timestampKeys);
  }

  if(String(service)==='simkl'){
    const bounds=v158SimklEpisodeBounds(raw);
    if(!startedAt)startedAt=bounds.first;
    if(!completedAt&&status==='completed')completedAt=bounds.last;
  }

  // A finish date belongs only to an actually completed title.
  if(status!=='completed')completedAt=0;

  return {
    title,
    categoryId,
    progress:Math.max(0,progress),
    total,
    status,
    rating,
    year,
    externalIds:v158NormalizeExternalIds(raw),
    startedAt:startedAt||null,
    completedAt:completedAt||null,
    sourceTimestamp:sourceTimestamp||null,
    coverUrl:v158ExtractCoverUrl(raw)||null
  };
}

// Make every Exchange Hub importer use v158 metadata normalization.
mfNormalizeRecord=v158NormalizeRecord;

function v158ImportIndex(){
  const byExternal=new Map();
  const byTitle=new Map();

  const add=item=>{
    if(!item||!item.id)return;

    const ids=item.externalIds||{};
    for(const [k,v] of Object.entries(ids)){
      if(v==null||String(v).trim()==='')continue;
      const key=`${k}:${String(v).trim().toLowerCase()}`;
      if(!byExternal.has(key))byExternal.set(key,item);
    }

    const tk=v158NormalizedTitleKey(item.title);
    if(tk){
      let arr=byTitle.get(tk);
      if(!arr){arr=[];byTitle.set(tk,arr);}
      if(!arr.includes(item))arr.push(item);
    }
  };

  for(const item of (S.library||[]))add(item);
  return {byExternal,byTitle,add};
}

function v158FindImportItem(record,index){
  for(const [k,v] of Object.entries(record.externalIds||{})){
    if(v==null||String(v).trim()==='')continue;
    const x=index.byExternal.get(`${k}:${String(v).trim().toLowerCase()}`);
    if(x)return x;
  }

  const candidates=index.byTitle.get(v158NormalizedTitleKey(record.title))||[];
  if(record.year){
    const sameYear=candidates.filter(i=>!i.year||Number(i.year)===Number(record.year));
    if(sameYear.length===1)return sameYear[0];
    const exactYear=sameYear.find(i=>Number(i.year)===Number(record.year));
    if(exactYear)return exactYear;
  }

  const sameCategory=candidates.filter(i=>String(i.categoryId||'')===String(record.categoryId||''));
  if(sameCategory.length===1)return sameCategory[0];
  if(candidates.length===1)return candidates[0];
  return null;
}

function v158CategoryFallback(categoryId){
  if(S.categories.some(c=>String(c.id)===String(categoryId)))return String(categoryId);
  return String(S.categories.find(c=>c.enabled!==false)?.id||S.categories[0]?.id||'tv');
}

function v158ImportedStartSource(service){
  const s=String(service||'import');
  return (s==='mal'||s==='malxml')?'mal':`import:${s}`;
}

function v158ApplyNormalizedRecord(record,service,index,touched){
  if(!record)return 'skipped';

  let item=v158FindImportItem(record,index);
  const now=Date.now();

  if(item){
    item.progress=Math.max(Number(item.progress)||0,Number(record.progress)||0);
    if(record.total!=null&&Number(record.total)>0)item.total=Number(record.total);
    item.status=record.status||item.status||'planned';
    item.rating=record.rating??item.rating??null;
    item.year=record.year||item.year||null;
    item.externalIds=Object.assign({},item.externalIds||{},record.externalIds||{});
    item.source=String(service||item.source||'import');
    item.tags=[...new Set([...(Array.isArray(item.tags)?item.tags:[]),mfServiceName(service)])];

    // Imported metadata never destroys a real local value when the source
    // omitted that field.
    if(record.startedAt){
      item.startedAt=Number(record.startedAt);
      item.startedAtSource=v158ImportedStartSource(service);
    }

    if(item.status==='completed'){
      if(record.completedAt)item.completedAt=Number(record.completedAt);
    }else if(record.completedAt){
      // v158NormalizeRecord should already prevent this branch.
    }

    if(record.sourceTimestamp){
      const ts=Number(record.sourceTimestamp);
      item.sourceTimestamp=ts;
      item.sourceTimestampSource=String(service||'import');
      item.createdAt=Math.min(Number(item.createdAt)||ts,ts);
    }

    // Never overwrite an existing manually/previously selected cover during an
    // import. If this title is blank and the source record has its own poster,
    // save only that external URL.
    if(!String(item.coverUrl||'').trim()&&record.coverUrl){
      item.coverUrl=String(record.coverUrl);
      item.coverSource=`import:${String(service||'external')}`;
    }

    item.modifiedAt=now;
    touched?.set(String(item.id),item);
    index.add(item);
    return 'updated';
  }

  const createdAt=Number(record.sourceTimestamp)||now;
  item={id:uid(),
    title:record.title,
    categoryId:v158CategoryFallback(record.categoryId),
    progress:Math.max(0,Number(record.progress)||0),
    total:record.total==null?null:Number(record.total),
    status:record.status||'planned',
    priority:'medium',
    estimatedMinutes:null,
    tags:[mfServiceName(service)],
    source:String(service||'import'),
    year:record.year||null,
    rating:record.rating??null,
    externalIds:Object.assign({},record.externalIds||{}),
    startedAt:record.startedAt||null,
    startedAtSource:record.startedAt?v158ImportedStartSource(service):null,
    completedAt:record.status==='completed'?(record.completedAt||null):null,
    createdAt,
    modifiedAt:now,
    sourceTimestamp:record.sourceTimestamp||null,
    sourceTimestampSource:record.sourceTimestamp?String(service||'import'):null,
    coverUrl:record.coverUrl||null,
    coverSource:record.coverUrl?`import:${String(service||'external')}`:null
  };

  S.library.push(item);
  touched?.set(String(item.id),item);
  index.add(item);
  return 'added';
}

function v158SyncCompletionTimeline(touched){
  if(!touched||!touched.size)return;
  const ids=new Set(touched.keys());
  S.completionTimeline=(S.completionTimeline||[]).filter(
    x=>!ids.has(String(x?.libraryId||''))
  );
  for(const item of touched.values()){
    if(item?.status==='completed'&&Number(item.completedAt)>0){
      S.completionTimeline.push({
        libraryId:item.id,
        title:cleanTitle(item.title),
        categoryId:item.categoryId,
        completedAt:Number(item.completedAt)
      });
    }
  }
}

async function v158MergeExchangeRecords(records,service,options={}){
  const list=Array.isArray(records)?records:[];
  const index=options.index||v158ImportIndex();
  const touched=options.touched||new Map();
  let added=0,updated=0,skipped=0,covers=0,startDates=0,finishDates=0,timestamps=0;

  const BATCH=Math.max(20,Number(options.batchSize)||80);
  for(let i=0;i<list.length;i++){
    const r=v158NormalizeRecord(list[i],service);
    if(!r){skipped++;continue;}

    const hadCover=!!r.coverUrl;
    const hadStart=!!r.startedAt;
    const hadFinish=!!r.completedAt;
    const hadTimestamp=!!r.sourceTimestamp;

    const result=v158ApplyNormalizedRecord(r,service,index,touched);
    if(result==='added')added++;
    else if(result==='updated')updated++;
    else skipped++;

    if(hadCover)covers++;
    if(hadStart)startDates++;
    if(hadFinish)finishDates++;
    if(hadTimestamp)timestamps++;

    if((i+1)%BATCH===0){
      if(typeof options.onProgress==='function'){
        options.onProgress(i+1,list.length,{added,updated,skipped,covers,startDates,finishDates,timestamps});
      }
      await yieldToBrowser();
    }
  }

  v158SyncCompletionTimeline(touched);
  normalizeSeasonalLibraryItems();
  v53InvalidateLibraryCache();

  return {added,updated,skipped,covers,startDates,finishDates,timestamps,index,touched};
}

// Keep legacy callers compatible, but v158 file imports use the async engine
// below directly.
mfMergeExchangeRecords=function(records,service){
  // Synchronous compatibility path for any third-party code that calls this
  // function directly. It still receives all v158 metadata.
  const index=v158ImportIndex();
  const touched=new Map();
  let added=0,updated=0,skipped=0,covers=0,startDates=0,finishDates=0,timestamps=0;
  for(const raw of (records||[])){
    const r=v158NormalizeRecord(raw,service);
    if(!r){skipped++;continue;}
    const x=v158ApplyNormalizedRecord(r,service,index,touched);
    if(x==='added')added++;else if(x==='updated')updated++;else skipped++;
    if(r.coverUrl)covers++;
    if(r.startedAt)startDates++;
    if(r.completedAt)finishDates++;
    if(r.sourceTimestamp)timestamps++;
  }
  v158SyncCompletionTimeline(touched);
  normalizeSeasonalLibraryItems();
  v53InvalidateLibraryCache();
  return {added,updated,skipped,covers,startDates,finishDates,timestamps};
};

async function v158ImportExchangeFile(service,file){
  showImportProgress(`Importing ${mfServiceName(service)}`,1);
  try{
    const text=await file.text();
    const name=String(file.name||'').toLowerCase();
    let records;

    if(name.endsWith('.xml')||/^\s*</.test(text))records=mfXmlRecords(text);
    else if(name.endsWith('.csv')||(!name.endsWith('.json')&&text.includes(',')))records=mfCsvParse(text);
    else records=mfFlattenJson(JSON.parse(text));

    if(!records.length)throw new Error('No recognizable media records were found.');

    showImportProgress(`Importing ${mfServiceName(service)}`,records.length);
    mfBegin(`${mfServiceName(service)} import`,file.name);

    const result=await v158MergeExchangeRecords(records,service,{
      batchSize:80,
      onProgress:(done,total,s)=>{
        updateImportProgress(
          done,total,s.added,s.updated,s.skipped,
          `${s.startDates.toLocaleString()} start dates · ${s.finishDates.toLocaleString()} finish dates · ${s.timestamps.toLocaleString()} timestamps · ${s.covers.toLocaleString()} cover URLs`
        );
      }
    });

    mfCommit(
      `${mfServiceName(service)} import`,
      `${result.added} added, ${result.updated} updated, ${result.covers} covers`
    );

    updateImportProgress(
      records.length,records.length,result.added,result.updated,result.skipped,
      'Saving imported metadata and external cover URLs…'
    );
    await saveState();

    finishImportProgress(
      true,
      `${mfServiceName(service)} import complete`,
      `${result.added.toLocaleString()} added · ${result.updated.toLocaleString()} updated${result.blocked?` · ${result.blocked.toLocaleString()} blocked by type`:''} · ${result.startDates.toLocaleString()} start dates · ${result.finishDates.toLocaleString()} finish dates · ${result.timestamps.toLocaleString()} timestamps · ${result.covers.toLocaleString()} cover URLs${result.skipped>result.blocked?` · ${(result.skipped-result.blocked).toLocaleString()} other skipped`:''}.`
    );
    render();
  }catch(e){
    console.error(e);
    finishImportProgress(false,'Import failed',e?.message||'MediaFlow could not understand this export file.');
  }
}

mfImportExchangeFile=v158ImportExchangeFile;

// Direct CSV now uses the same complete v158 metadata engine instead of the
// older title/progress/status-only parser.
App.importCsv=function(file){
  if(file)return v158ImportExchangeFile('csv',file);
};

// MAL XML now goes through the same metadata parser, including series_image /
// cover URL, start date, finish date and timestamp-like fields when present.
App.importMalXml=async function(file){
  if(!file)return;
  showImportProgress('Importing MyAnimeList XML',1);
  try{
    const text=await file.text();
    const records=mfXmlRecords(text);
    if(!records.length)throw new Error('No entries found. Make sure this is a MAL list export XML.');

    showImportProgress('Importing MyAnimeList XML',records.length);
    mfBegin('MyAnimeList XML import',file.name||'MAL XML');

    const result=await v158MergeExchangeRecords(records,'malxml',{
      batchSize:50,
      onProgress(done,total,s){
        updateImportProgress(
          done,total,s.added,s.updated,s.skipped,
          `${s.startDates.toLocaleString()} start dates · ${s.finishDates.toLocaleString()} finish dates · ${s.timestamps.toLocaleString()} timestamps · ${s.covers.toLocaleString()} cover URLs`
        );
      }
    });

    mfCommit('MyAnimeList XML import',`${result.added} added, ${result.updated} updated, ${result.covers} covers`);
    await saveState();

    finishImportProgress(
      true,
      'MyAnimeList merge complete',
      `${result.added.toLocaleString()} added · ${result.updated.toLocaleString()} updated · ${result.startDates.toLocaleString()} start dates · ${result.finishDates.toLocaleString()} finish dates · ${result.timestamps.toLocaleString()} timestamps · ${result.covers.toLocaleString()} cover URLs${result.skipped?` · ${result.skipped.toLocaleString()} skipped`:''}.`
    );
    render();
  }catch(e){
    console.error('MAL import failed',e);
    finishImportProgress(false,'MAL import failed',e?.message||"Couldn't parse that file as a MAL export XML.");
  }
};

function v158FindLibraryForSimklRecord(raw,index){
  const r=v158NormalizeRecord(raw,'simkl');
  return r?v158FindImportItem(r,index):null;
}

App.importSimklJson=async function(file){
  if(!file)return;
  showImportProgress('Importing Simkl JSON',1);

  try{
    const data=JSON.parse(await file.text());
    if(!data||(!Array.isArray(data.anime)&&!Array.isArray(data.shows)&&!Array.isArray(data.movies))){
      throw new Error('This does not look like a Simkl JSON backup.');
    }

    const records=mfFlattenJson(data);
    const total=Math.max(1,records.length);
    showImportProgress('Importing Simkl JSON',total);
    mfBegin('Simkl JSON import',file.name||'backup');

    const result=await v158MergeExchangeRecords(records,'simkl',{
      batchSize:70,
      onProgress(done,totalCount,s){
        updateImportProgress(
          done,totalCount,s.added,s.updated,s.skipped,
          `Titles: ${s.startDates.toLocaleString()} starts · ${s.finishDates.toLocaleString()} finishes · ${s.timestamps.toLocaleString()} timestamps · ${s.covers.toLocaleString()} cover URLs`
        );
      }
    });

    // Preserve Simkl's valuable genuine watched_at History import.
    const seenSessions=new Set((S.sessions||[]).map(s=>s.importKey).filter(Boolean));
    const index=result.index||v158ImportIndex();
    let historyAdded=0,processed=0;

    const groups=[
      ['anime',data.anime||[]],
      ['shows',data.shows||[]],
      ['movies',data.movies||[]]
    ];

    for(const [kind,list] of groups){
      for(const sourceRec of list){
        processed++;
        const raw=Object.assign({__group:kind},sourceRec);
        const item=v158FindLibraryForSimklRecord(raw,index);
        if(!item)continue;

        const media=sourceRec.show||sourceRec.movie||sourceRec.media||{};
        const title=cleanTitle(item.title);
        const simklId=item.externalIds?.simkl||media?.ids?.simkl||'';

        const dayCounts=new Map();
        for(const season of (sourceRec.seasons||[])){
          for(const ep of (season?.episodes||[])){
            const ts=v158ParseDateLike(ep?.watched_at??ep?.watchedAt);
            if(!ts)continue;
            const day=new Date(ts).toISOString().slice(0,10);
            const old=dayCounts.get(day)||{count:0,ts};
            old.count++;
            old.ts=Math.max(old.ts,ts);
            dayCounts.set(day,old);
          }
        }

        for(const [day,h] of dayCounts){
          const ik=`simkl:${simklId||v158NormalizedTitleKey(title)}:${day}`;
          if(seenSessions.has(ik))continue;

          const cat=getCategory(item.categoryId);
          const amount=kind==='movies'?1:h.count;
          S.sessions.push({
            id:uid(),
            timestamp:h.ts,
            date:day,
            categoryId:item.categoryId,
            targetAmount:amount,
            actualAmount:amount,
            minutes:Math.max(0,Math.round((Number(media.runtime)||Number(cat?.minutesPerUnit)||0)*amount)),
            note:`Imported from Simkl · ${title}`,
            status:'complete',
            unit:cat?.unit||'units',
            xp:0,
            healthStatus:'healthy',
            titles:[{title,libraryId:item.id,qty:amount}],
            source:'simkl',
            importKey:ik
          });
          seenSessions.add(ik);
          historyAdded++;
        }

        if(processed%100===0){
          updateImportProgress(
            Math.min(total,processed),total,result.added,result.updated,result.skipped,
            `Importing genuine Simkl watched timestamps… ${historyAdded.toLocaleString()} History groups`
          );
          await yieldToBrowser();
        }
      }
    }

    v53InvalidateSessionCache();
    mfCommit(
      'Simkl JSON import',
      `${result.added} added, ${result.updated} updated, ${historyAdded} history groups, ${result.covers} covers`
    );
    await saveState();

    finishImportProgress(
      true,
      'Simkl import successful',
      `${result.added.toLocaleString()} added · ${result.updated.toLocaleString()} updated · ${historyAdded.toLocaleString()} timestamped History groups · ${result.startDates.toLocaleString()} start dates · ${result.finishDates.toLocaleString()} finish dates · ${result.timestamps.toLocaleString()} title timestamps · ${result.covers.toLocaleString()} cover URLs.`
    );
    render();
  }catch(e){
    console.error(e);
    if(S.undoStack?.length&&S.undoStack[S.undoStack.length-1]?.action==='Simkl JSON import'){
      const x=S.undoStack.pop();
      mfRestoreCore(x.before);
    }
    finishImportProgress(false,'Simkl import failed',e?.message||'Could not read this Simkl JSON backup.');
  }
};

// Final binding used by the Quick Simkl JSON import button.
mfImportSimklJson=App.importSimklJson;

async function v158MalSync(){
  const username=(S.malLink?.username||'').trim();
  if(!username){alert('Enter your MyAnimeList username first.');return;}

  const mode=S.malLink.mode||'anime';
  const types=mode==='both'?['anime','manga']:[mode];

  showImportProgress('MAL sync',1);
  updateImportProgress(0,0,0,0,0,'Starting complete MAL metadata sync…');

  const index=v158ImportIndex();
  const touched=new Map();
  let processed=0,added=0,updated=0,skipped=0,covers=0,startDates=0,finishDates=0,timestamps=0;

  try{
    mfBegin('MyAnimeList sync',username);

    for(const type of types){
      let page=1,hasNext=true;

      while(hasNext){
        updateImportProgress(processed,Math.max(processed,1),added,updated,skipped,`Fetching ${type} page ${page}…`);
        const j=await malFetchPage(username,type,page);
        const rows=Array.isArray(j?.data)?j.data:[];

        for(let offset=0;offset<rows.length;offset+=40){
          const batch=rows.slice(offset,offset+40);

          for(const sourceRow of batch){
            const row=Object.assign({__group:type},sourceRow);
            const rec=v158NormalizeRecord(row,'mal');

            if(!rec){skipped++;processed++;continue;}

            // Jikan user-list payloads may expose MAL's list metadata under
            // different nested names. Explicitly preserve the MAL ID if present.
            const media=sourceRow.entry||sourceRow.node||sourceRow.anime||sourceRow.manga||sourceRow;
            const malId=media?.mal_id??media?.id??sourceRow?.mal_id;
            if(malId!=null&&String(malId).trim()!=='')rec.externalIds.mal=malId;

            const x=v158ApplyNormalizedRecord(rec,'mal',index,touched);
            if(x==='added')added++;else if(x==='updated')updated++;else skipped++;

            if(rec.coverUrl)covers++;
            if(rec.startedAt)startDates++;
            if(rec.completedAt)finishDates++;
            if(rec.sourceTimestamp)timestamps++;
            processed++;
          }

          updateImportProgress(
            processed,Math.max(processed,Number(j?.pagination?.items?.total)||processed),
            added,updated,skipped,
            `${covers.toLocaleString()} cover URLs · ${startDates.toLocaleString()} starts · ${finishDates.toLocaleString()} finishes · ${timestamps.toLocaleString()} timestamps`
          );

          await yieldToBrowser();
        }

        hasNext=!!j?.pagination?.has_next;
        page++;
        if(hasNext)await new Promise(resolve=>setTimeout(resolve,700));
      }
    }

    v158SyncCompletionTimeline(touched);
    normalizeSeasonalLibraryItems();
    v53InvalidateLibraryCache();

    mfCommit(
      'MyAnimeList sync',
      `${added} added, ${updated} updated, ${covers} covers, ${startDates} starts, ${finishDates} finishes`
    );
    await saveState();

    finishImportProgress(
      true,
      'MAL sync complete',
      `${added.toLocaleString()} added · ${updated.toLocaleString()} updated · ${startDates.toLocaleString()} start dates · ${finishDates.toLocaleString()} finish dates · ${timestamps.toLocaleString()} timestamps · ${covers.toLocaleString()} cover URLs${skipped?` · ${skipped.toLocaleString()} skipped`:''}.`
    );
    render();
  }catch(e){
    console.error(e);
    finishImportProgress(false,'MAL sync failed',e?.message||String(e));
  }
}

App.syncMAL=v158MalSync;

// Export enough metadata for a clean MediaFlow round-trip through the Exchange
// Hub. External services are still free to ignore fields they do not support.
mfExchangeRows=function(){
  return (S.library||[]).map(i=>{
    const c=getCategory(i.categoryId);
    const ts=Number(i.sourceTimestamp)||Number(i.createdAt)||0;
    return {
      title:cleanTitle(i.title),
      media_type:c?.id||i.categoryId,
      status:i.status,
      progress:Number(i.progress)||0,
      total:i.total??'',
      rating:i.rating??'',
      year:i.year??'',
      start_date:i.startedAt?v135DateInputValue(i.startedAt):'',
      finish_date:i.completedAt?v135DateInputValue(i.completedAt):'',
      timestamp:ts?new Date(ts).toISOString():'',
      cover_url:v158SafeHttpUrl(i.coverUrl)||'',
      mal_id:i.externalIds?.mal??'',
      anilist_id:i.externalIds?.anilist??'',
      imdb_id:i.externalIds?.imdb??'',
      tmdb_id:i.externalIds?.tmdb??'',
      trakt_id:i.externalIds?.trakt??'',
      simkl_id:i.externalIds?.simkl??'',
      kitsu_id:i.externalIds?.kitsu??'',
      isbn:i.externalIds?.isbn??''
    };
  });
};

// Preserve v158 timestamp metadata across cloud merges even when one device has
// not seen the external-import fields yet.
const v158MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v158MergeLibraryItemBase(left,right);
  if(!out)return out;

  const pick=(key)=>{
    const lv=left?.[key],rv=right?.[key];
    const lOk=lv!==undefined&&lv!==null&&lv!=='';
    const rOk=rv!==undefined&&rv!==null&&rv!=='';
    if(lOk&&rOk){
      return Number(right?.modifiedAt||0)>Number(left?.modifiedAt||0)?rv:lv;
    }
    return lOk?lv:(rOk?rv:null);
  };

  out.sourceTimestamp=pick('sourceTimestamp');
  out.sourceTimestampSource=pick('sourceTimestampSource');
  return out;
};

// ------------------------------------------------------------
// Safe automatic missing-cover repair
// ------------------------------------------------------------

function v158ItemKind(item){
  const cat=getCategory(item?.categoryId);
  const id=String(item?.categoryId||'');
  const name=String(cat?.name||'').toLowerCase();

  if(id==='seasonal'||id==='backlog'||id==='animemovies'||/anime/.test(name)){
    return id==='animemovies'?'anime-movie':'anime';
  }
  if(id==='manga'||id==='manhwa'||/manga|manhwa|manhua/.test(name))return 'manga';
  if(id==='tv'||/tv series|television|series/.test(name))return 'tv';
  if(id==='otheranim'||/animation|cartoon/.test(name))return 'tv';
  if(id==='movies'||/movie|film/.test(name))return 'movie';
  if(id==='comics'||/comic/.test(name))return 'comic';
  if(cat?.type==='reading'&&/book|novel/.test(name))return 'book';
  return cat?.type==='reading'?'reading':cat?.type==='video'?'video':'other';
}

function v158CandidateYear(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>1800&&n<2200?n:null;
}

function v158ItemYear(item){
  return v158CandidateYear(item?.year) ||
    (Number(item?.startedAt)>0?new Date(Number(item.startedAt)).getFullYear():null);
}

function v158ExactTitleCandidate(item,candidateTitles){
  const wanted=v158NormalizedTitleKey(item?.title);
  if(!wanted)return false;
  for(const title of candidateTitles||[]){
    if(v158NormalizedTitleKey(title)===wanted)return true;
  }
  return false;
}

async function v158Throttle(provider,minimumGap){
  const last=Number(V158_PROVIDER_LAST_REQUEST.get(provider))||0;
  const wait=Math.max(0,minimumGap-(Date.now()-last));
  if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
  V158_PROVIDER_LAST_REQUEST.set(provider,Date.now());
}

async function v158FetchJson(url,provider,minimumGap=250){
  const cacheKey=`${provider}:${url}`;
  if(V158_COVER_QUERY_CACHE.has(cacheKey))return V158_COVER_QUERY_CACHE.get(cacheKey);

  await v158Throttle(provider,minimumGap);

  let lastError=null;
  for(let attempt=0;attempt<3;attempt++){
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      const response=await fetch(url,{
        signal:controller.signal,
        headers:{Accept:'application/json'}
      });
      clearTimeout(timer);

      if(response.ok){
        const json=await response.json();
        V158_COVER_QUERY_CACHE.set(cacheKey,json);
        return json;
      }

      lastError=new Error(`${provider} ${response.status}`);
      if(![408,429,500,502,503,504].includes(response.status))break;

      const retry=Number(response.headers.get('Retry-After'))||0;
      await new Promise(resolve=>setTimeout(resolve,retry?retry*1000:700*(attempt+1)));
    }catch(e){
      lastError=e;
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
    }
  }

  console.warn('v158 cover provider request failed',provider,lastError);
  return null;
}

function v158JikanTitles(x){
  const out=[
    x?.title,x?.title_english,x?.title_japanese,
    ...(Array.isArray(x?.title_synonyms)?x.title_synonyms:[])
  ];
  for(const row of (Array.isArray(x?.titles)?x.titles:[]))out.push(row?.title);
  return out.filter(Boolean);
}

function v158JikanCover(x){
  return v158SafeHttpUrl(
    x?.images?.jpg?.large_image_url ||
    x?.images?.webp?.large_image_url ||
    x?.images?.jpg?.image_url ||
    x?.images?.webp?.image_url
  );
}

function v158JikanYear(x,kind){
  if(kind==='manga'){
    const raw=x?.published?.from;
    const y=raw?new Date(raw).getFullYear():null;
    return v158CandidateYear(y);
  }
  return v158CandidateYear(x?.year) ||
    v158CandidateYear(x?.aired?.from?new Date(x.aired.from).getFullYear():null);
}

async function v158FindJikanCover(item,kind){
  const endpoint=kind==='manga'?'manga':'anime';
  const malId=String(item?.externalIds?.mal??'').trim();

  // Stable MAL ID = exact identity. This is the safest path.
  if(/^\d+$/.test(malId)){
    const j=await v158FetchJson(`https://api.jikan.moe/v4/${endpoint}/${encodeURIComponent(malId)}`,'jikan',380);
    const x=j?.data;
    if(x&&String(x?.mal_id??'')===malId){
      if(kind==='anime-movie'&&String(x?.type||'').toLowerCase()!=='movie')return null;
      const url=v158JikanCover(x);
      if(url)return {url,provider:'Jikan',confidence:'external-id'};
    }
  }

  // Search fallback is intentionally strict. Without an external ID, require an
  // exact title PLUS a real disambiguator (year or total episode/chapter count).
  const itemYear=v158ItemYear(item);
  const total=Number(item?.total)>0?Number(item.total):null;
  if(!itemYear&&!total)return null;

  const q=cleanTitle(item?.title||'');
  if(!q)return null;

  const j=await v158FetchJson(
    `https://api.jikan.moe/v4/${endpoint}?q=${encodeURIComponent(q)}&limit=12`,
    'jikan',380
  );

  let rows=(j?.data||[]).filter(x=>v158ExactTitleCandidate(item,v158JikanTitles(x)));
  if(kind==='anime-movie')rows=rows.filter(x=>String(x?.type||'').toLowerCase()==='movie');
  else if(endpoint==='anime')rows=rows.filter(x=>String(x?.type||'').toLowerCase()!=='movie');

  if(itemYear){
    const withYear=rows.filter(x=>v158JikanYear(x,endpoint)===itemYear);
    if(withYear.length)rows=withYear;
    else return null;
  }

  if(total){
    const withTotal=rows.filter(x=>{
      const n=endpoint==='manga'?Number(x?.chapters):Number(x?.episodes);
      return Number.isFinite(n)&&n>0&&n===total;
    });
    if(withTotal.length)rows=withTotal;
    else if(!itemYear)return null;
  }

  const unique=new Map();
  for(const x of rows){
    const url=v158JikanCover(x);
    if(url)unique.set(String(x?.mal_id||url),{x,url});
  }

  if(unique.size!==1)return null;
  const only=[...unique.values()][0];
  return {url:only.url,provider:'Jikan',confidence:'exact-disambiguated'};
}

async function v158FindTVMazeCover(item){
  const imdb=String(item?.externalIds?.imdb??'').trim();

  // IMDb lookup is an exact identity mapping for TVMaze shows.
  if(/^tt\d+$/i.test(imdb)){
    const x=await v158FetchJson(
      `https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(imdb)}`,
      'tvmaze',180
    );
    const url=v158SafeHttpUrl(x?.image?.original||x?.image?.medium);
    if(url)return {url,provider:'TVmaze',confidence:'external-id'};
  }

  const year=v158ItemYear(item);
  if(!year)return null; // title-only TV matches are deliberately not guessed.

  const q=cleanTitle(item?.title||'');
  if(!q)return null;
  const rows=await v158FetchJson(
    `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`,
    'tvmaze',180
  );

  const exact=(Array.isArray(rows)?rows:[])
    .map(r=>r?.show)
    .filter(Boolean)
    .filter(x=>v158ExactTitleCandidate(item,[x?.name]))
    .filter(x=>{
      const y=x?.premiered?new Date(x.premiered).getFullYear():null;
      return Number(y)===Number(year);
    })
    .filter(x=>v158SafeHttpUrl(x?.image?.original||x?.image?.medium));

  const unique=new Map(exact.map(x=>[String(x.id),x]));
  if(unique.size!==1)return null;

  const x=[...unique.values()][0];
  return {
    url:v158SafeHttpUrl(x?.image?.original||x?.image?.medium),
    provider:'TVmaze',
    confidence:'exact-year'
  };
}

async function v158FindOpenLibraryCover(item){
  const isbn=String(item?.externalIds?.isbn??'').replace(/[^0-9Xx]/g,'');
  if(isbn.length===10||isbn.length===13){
    // ISBN is an exact work/edition identifier. Open Library's cover endpoint
    // returns the image by identifier; MediaFlow still stores only this URL.
    return {
      url:`https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`,
      provider:'Open Library',
      confidence:'external-id'
    };
  }

  const year=v158ItemYear(item);
  if(!year)return null;

  const title=cleanTitle(item?.title||'');
  if(!title)return null;

  const j=await v158FetchJson(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=12&fields=key,title,first_publish_year,cover_i`,
    'openlibrary',240
  );

  const rows=(j?.docs||[])
    .filter(x=>x?.cover_i)
    .filter(x=>v158ExactTitleCandidate(item,[x?.title]))
    .filter(x=>Number(x?.first_publish_year)===Number(year));

  const unique=new Map(rows.map(x=>[String(x.key||x.cover_i),x]));
  if(unique.size!==1)return null;

  const x=[...unique.values()][0];
  return {
    url:`https://covers.openlibrary.org/b/id/${encodeURIComponent(x.cover_i)}-L.jpg`,
    provider:'Open Library',
    confidence:'exact-year'
  };
}

async function v158ResolveSafeCover(item){
  if(!item||String(item.coverUrl||'').trim())return null;

  const kind=v158ItemKind(item);

  if(kind==='anime'||kind==='anime-movie')return v158FindJikanCover(item,kind);
  if(kind==='manga')return v158FindJikanCover(item,'manga');
  if(kind==='tv')return v158FindTVMazeCover(item);
  if(kind==='book'||kind==='comic'||kind==='reading')return v158FindOpenLibraryCover(item);

  // General live-action movies currently have no anonymous exact-ID image
  // provider configured in MediaFlow. Do NOT fall back to a loose TV/show
  // search because the explicit v158 requirement is "no wrong covers".
  return null;
}

function v158AttachCoverCancelButton(){
  const root=document.getElementById('mediaflow-data-progress');
  const card=root?.querySelector('.import-card');
  if(!card||card.querySelector('[data-v158-cover-cancel]'))return;

  const row=document.createElement('div');
  row.style.cssText='display:flex;justify-content:flex-end;margin-top:14px';
  row.innerHTML='<button type="button" class="btn btn-ghost" data-v158-cover-cancel onclick="App.v158CancelCoverFix()">Stop safely</button>';
  card.appendChild(row);
}

async function v158FixMissingCovers(){
  if(V158_COVER_FIX_RUNNING){
    showToast('Cover repair is already running.');
    return;
  }

  const missing=(S.library||[]).filter(i=>i&& !String(i.coverUrl||'').trim());
  if(!missing.length){
    showToast('Every Library title already has a cover URL.');
    return;
  }

  V158_COVER_FIX_RUNNING=true;
  V158_COVER_FIX_CANCEL=false;

  showDataProgress(
    'Fix missing covers',
    `Preparing ${missing.length.toLocaleString()} titles · ambiguous matches will be skipped`,
    0
  );
  v158AttachCoverCancelButton();

  let fixed=0,skipped=0,errors=0;
  const touched=[];
  const SAVE_EVERY=200;

  try{
    for(let i=0;i<missing.length;i++){
      if(V158_COVER_FIX_CANCEL)break;

      const item=missing[i];

      // The item may have received a cover from another action while this job
      // was running. Never overwrite it.
      if(String(item.coverUrl||'').trim()){
        skipped++;
        continue;
      }

      updateDataProgress(
        Math.round((i/missing.length)*100),
        `${(i+1).toLocaleString()} / ${missing.length.toLocaleString()} · fixed ${fixed.toLocaleString()} · safely skipped ${skipped.toLocaleString()} · ${cleanTitle(item.title)}`
      );

      try{
        const match=await v158ResolveSafeCover(item);

        if(match?.url){
          // Final re-check: never replace a cover that appeared while awaiting
          // the provider request.
          if(!String(item.coverUrl||'').trim()){
            item.coverUrl=v158SafeHttpUrl(match.url);
            item.coverSource=`auto:${match.provider}:${match.confidence}`;
            item.modifiedAt=Date.now();
            touched.push(item.id);
            fixed++;
          }else{
            skipped++;
          }
        }else{
          skipped++;
        }
      }catch(e){
        console.warn('v158 cover repair skipped',item?.title,e);
        errors++;
        skipped++;
      }

      // Yield after every title. Network I/O is already async; this guarantees
      // CPU/UI work never turns a huge missing-cover list into a long task.
      await yieldToBrowser();

      // Avoid repeated full-state/cloud serialization. Save in large checkpoints.
      if(fixed>0&&fixed%SAVE_EVERY===0){
        v53InvalidateLibraryCache();
        await saveState();
        await yieldToBrowser();
      }
    }

    if(touched.length){
      v53InvalidateLibraryCache();
      await saveState();
    }

    render();

    if(V158_COVER_FIX_CANCEL){
      finishDataProgress(
        true,
        'Cover repair stopped safely',
        `${fixed.toLocaleString()} exact-confidence cover URLs saved · ${skipped.toLocaleString()} skipped · progress was saved.`
      );
    }else{
      finishDataProgress(
        true,
        'Missing-cover repair complete',
        `${fixed.toLocaleString()} exact-confidence cover URLs saved · ${skipped.toLocaleString()} ambiguous/unsupported titles safely skipped${errors?` · ${errors.toLocaleString()} provider errors`:''}.`
      );
    }
  }finally{
    V158_COVER_FIX_RUNNING=false;
    V158_COVER_FIX_CANCEL=false;
  }
}

function v158CancelCoverFix(){
  if(!V158_COVER_FIX_RUNNING)return;
  V158_COVER_FIX_CANCEL=true;
  updateDataProgress(
    Number(document.getElementById('data-progress-pct')?.textContent?.replace('%',''))||0,
    'Stopping after the current safe lookup and saving progress…'
  );
}

Object.assign(App,{
  v158FixMissingCovers,
  v158CancelCoverFix
});

// Settings: add one dedicated, scalable cover-maintenance action.
const v158RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v158RenderSettingsBase();

  const missing=(S.library||[]).reduce(
    (n,item)=>n+(item&&!String(item.coverUrl||'').trim()?1:0),
    0
  );

  const card=`<div class="section-label">COVER MAINTENANCE</div>
    <div class="card" style="margin-bottom:22px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <div style="min-width:220px;flex:1">
          <b>Fix missing Library covers</b>
          <div class="profile-note">
            ${missing.toLocaleString()} title${missing===1?'':'s'} currently ${missing===1?'has':'have'} no cover URL.
            MediaFlow uses external IDs first and only accepts exact, disambiguated title matches.
            Ambiguous matches are skipped instead of guessed. Images are never stored in MediaFlow — only their external URL.
          </div>
        </div>
        <button class="btn btn-primary" onclick="App.v158FixMissingCovers()" ${missing?'':'disabled'}>
          Fix missing covers
        </button>
      </div>
      <div class="hint" style="margin-top:10px">
        Large Libraries are processed asynchronously with throttled provider requests, continuous UI yields and infrequent checkpoint saves, so thousands of missing covers do not freeze the app.
      </div>
    </div>`;

  const dataMarker='<div class="section-label">DATA</div>';
  if(h.includes(dataMarker))h=h.replace(dataMarker,card+dataMarker);
  else h+=card;

  h=h.replace(
    'Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data.',
    'Different services expose different fields, so MediaFlow imports what is actually present instead of inventing missing data. v158 also imports Start Date, Finish Date, source timestamps and external cover URLs whenever the source includes them.'
  );

  return h;
};

// Full Backup/Automatic Backup already serialize every Library title object.
// v158's coverUrl/sourceTimestamp metadata therefore requires no separate backup
// schema and is automatically covered by the v148+ complete backup pipeline.



/* ============================================================
   MediaFlow v159 — Rotating On This Day + Adaptive Cover Themes
   ------------------------------------------------------------
   Dashboard / On This Day
   - summary shows ONLY the current title, then its event underneath;
   - all matching titles remain in the expandable list;
   - every surviving Library title gets Edit directly in the list;
   - the single summary title rotates without rerendering Dashboard;
   - On This Day data is cached and invalidated only by Library/History changes.

   Dynamic Cover Theme
   - On This Day rotation immediately feeds its new cover to Dynamic Theme;
   - periodic theme refreshes randomly alternate source priority between the
     current recommendation and On This Day titles;
   - Global Appearance ON  -> obey selected Light/Dark;
   - Global Appearance OFF -> choose the cover's own natural Light/Dark mode;
   - extract several cover colors and use them across surfaces/gradients instead
     of generating a mostly monochrome palette.
   ============================================================ */

const V159_OTD_ROTATE_MS=12000;
let V159_OTD_ROTATE_TIMER=null;
let V159_OTD_CURRENT_INDEX=0;
let V159_OTD_CACHE={dirty:true,dayKey:'',groups:[],flat:[]};

let V159_DYNAMIC_SOURCE_TIMER=null;
let V159_FORCED_THEME_SOURCE=null;
const V159_COVER_THEME_CACHE=new Map();

function v159TodayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function v159MarkOnThisDayDirty(){
  V159_OTD_CACHE.dirty=true;
}

function v159LibraryLookup(){
  const byId=new Map();
  const byTitle=new Map();

  for(const item of (S.library||[])){
    if(!item)continue;
    if(item.id)byId.set(String(item.id),item);

    const key=cleanTitle(item.title||'').toLocaleLowerCase();
    if(!key)continue;
    let rows=byTitle.get(key);
    if(!rows){rows=[];byTitle.set(key,rows);}
    rows.push(item);
  }

  const find=(libraryId,title,categoryId)=>{
    if(libraryId){
      const item=byId.get(String(libraryId));
      if(item)return item;
    }

    const key=cleanTitle(title||'').toLocaleLowerCase();
    const rows=byTitle.get(key)||[];
    if(rows.length===1)return rows[0];

    const catRows=rows.filter(x=>String(x.categoryId||'')===String(categoryId||''));
    return catRows.length===1?catRows[0]:null;
  };

  return {byId,byTitle,find};
}

function v159BuildOnThisDayModel(){
  const dayKey=v159TodayKey();if(!V159_OTD_CACHE.dirty && V159_OTD_CACHE.dayKey===dayKey){
    return V159_OTD_CACHE;
  }

  const now=new Date();
  const groups=new Map();
  const lib=v159LibraryLookup();

  const add=(date,event)=>{
    if(!(date instanceof Date)||Number.isNaN(date.getTime()))return;

    const years=now.getFullYear()-date.getFullYear();
    if(
      years<1 ||
      date.getMonth()!==now.getMonth() ||
      date.getDate()!==now.getDate()
    )return;

    if(!groups.has(years))groups.set(years,[]);
    groups.get(years).push(Object.assign({
      timestamp:date.getTime(),
      years
    },event));
  };

  const eventDate=ts=>{
    ts=Number(ts)||0;
    if(!ts)return null;
    const d=new Date(ts);
    return Number.isNaN(d.getTime())?null:d;
  };

  // Genuine History logs. Editable History day stays authoritative.
  for(const s of (S.sessions||[])){
    if(!s||s.status==='skipped')continue;

    const key=typeof v119SessionDateKey==='function'?v119SessionDateKey(s):'';
    let d=null;

    if(key){
      const parsed=new Date(key+'T12:00:00');
      if(!Number.isNaN(parsed.getTime()))d=parsed;
    }
    if(!d&&Number(s.timestamp)>0){
      const parsed=new Date(Number(s.timestamp));
      if(!Number.isNaN(parsed.getTime()))d=parsed;
    }
    if(!d)continue;

    const years=now.getFullYear()-d.getFullYear();
    if(
      years<1 ||
      d.getMonth()!==now.getMonth() ||
      d.getDate()!==now.getDate()
    )continue;

    const titles=Array.isArray(s.titles)&&s.titles.length
      ?s.titles.filter(t=>t?.title)
      :(s.title?[{
          title:s.title,
          libraryId:s.libraryId||null,
          qty:s.actualAmount||0,
          categoryId:s.categoryId||null
        }]:[]);

    if(!titles.length)continue;

    const totalQty=titles.reduce(
      (n,t)=>n+Math.max(0,Number(t?.qty??t?.amount??0)||0),
      0
    );
    const sessionMinutes=Math.max(0,Number(s.minutes)||0);

    for(const t of titles){
      const qty=Math.max(0,Number(t?.qty??t?.amount??0)||0);
      let minutes=Math.max(0,Number(t?.minutes)||0);

      if(!minutes&&sessionMinutes>0){
        if(titles.length===1)minutes=sessionMinutes;
        else if(totalQty>0)minutes=sessionMinutes*(qty/totalQty);
        else minutes=sessionMinutes/titles.length;
      }

      const item=lib.find(t.libraryId,t.title,t.categoryId||s.categoryId);

      add(d,{
        kind:'logged',
        title:cleanTitle(t.title),
        libraryId:item?.id||t.libraryId||null,
        categoryId:item?.categoryId||t.categoryId||s.categoryId||null,
        qty,
        minutes,
        item:item||null
      });
    }
  }

  // Library lifecycle dates.
  for(const item of (S.library||[])){
    const title=cleanTitle(item?.title||'');
    if(!title)continue;

    const started=eventDate(item.startedAt);
    if(started)add(started,{
      kind:'started',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0,
      item
    });

    const finished=eventDate(item.completedAt);
    if(finished)add(finished,{
      kind:'finished',
      title,
      libraryId:item.id||null,
      categoryId:item.categoryId||null,
      qty:0,
      minutes:0,
      item
    });
  }

  const priority={started:0,logged:1,finished:2};
  const grouped=[];

  for(const [years,raw] of [...groups.entries()].sort((a,b)=>a[0]-b[0])){
    raw.sort((a,b)=>
      (Number(a.timestamp)||0)-(Number(b.timestamp)||0) ||
      (priority[a.kind]??9)-(priority[b.kind]??9)
    );

    const merged=[];
    const byKey=new Map();

    for(const x of raw){
      const identity=x.libraryId
        ?`id:${String(x.libraryId)}`
        :`title:${cleanTitle(x.title).toLocaleLowerCase()}::${String(x.categoryId||'')}`;

      const key=`${x.kind}::${identity}`;
      let m=byKey.get(key);

      if(!m){
        m=Object.assign({},x,{qty:0,minutes:0});
        byKey.set(key,m);
        merged.push(m);
      }

      m.qty+=Math.max(0,Number(x.qty)||0);
      m.minutes+=Math.max(0,Number(x.minutes)||0);
    }

    if(merged.length)grouped.push({years,rows:merged});
  }

  const flat=[];
  for(const group of grouped){
    for(const row of group.rows){
      row.years=group.years;
      flat.push(row);
    }
  }

  V159_OTD_CACHE={
    dirty:false,
    dayKey,
    groups:grouped,
    flat
  };

  return V159_OTD_CACHE;
}

function v159OtdVerb(kind){
  return ({started:'Started',finished:'Finished',logged:'Logged'})[kind]||'Event';
}

function v159OtdIcon(kind){
  return ({started:'▶',finished:'✓',logged:'●'})[kind]||'•';
}

function v159OtdAmountText(x){
  if(x?.kind!=='logged')return '';

  const item=x.item||v50FindLibraryItem(x.libraryId,x.title);
  const cat=getCategory(item?.categoryId||x.categoryId);
  const bits=[];
  const qty=Math.max(0,Number(x.qty)||0);
  const minutes=Math.max(0,Math.round(Number(x.minutes)||0));

  if(qty>0)bits.push(`${qty} ${unitLabel(cat?.unit||'units',qty)}`);
  if(minutes>0)bits.push(fmtMinutes(minutes));

  return bits.join(' · ');
}

function v159OtdCoverMarkup(x,summary=false){
  const item=x?.item||v50FindLibraryItem(x?.libraryId,x?.title);
  const cat=getCategory(item?.categoryId||x?.categoryId);
  const cls=summary?'v126-otd-summary':'v126-otd-row';
  const icon=v144CategoryIconHtml(cat);
  const title=cleanTitle(item?.title||x?.title||'');

  if(item?.coverUrl){
    return `<img class="${cls}-cover" src="${escapeHtml(String(item.coverUrl))}" alt="${escapeHtml(title)} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="${cls}-placeholder" style="display:none">${icon}</div>`;
  }

  return `<div class="${cls}-placeholder">${icon}</div>`;
}

function v159OtdEventLine(x,summary=false){
  const amount=v159OtdAmountText(x);
  const ago=`${x.years} year${x.years===1?'':'s'} ago`;
  const extra=amount?` · ${amount}`:'';

  if(summary){
    return `<span class="v159-otd-event-chip">${v159OtdIcon(x.kind)} ${escapeHtml(v159OtdVerb(x.kind))}</span>${escapeHtml(ago+extra)}`;
  }

  return `<span class="v159-otd-event-chip">${v159OtdIcon(x.kind)} ${escapeHtml(v159OtdVerb(x.kind))}</span>${amount?`<span>${escapeHtml(amount)}</span>`:''}`;
}

function v159OtdInitialIndex(model){
  const count=model?.flat?.length||0;
  if(count<=1)return 0;
  return Math.floor(Date.now()/V159_OTD_ROTATE_MS)%count;
}

function v159OtdThemeSource(x){
  const item=x?.item||v50FindLibraryItem(x?.libraryId,x?.title);
  if(!item?.coverUrl)return null;

  return {
    source:'onthisday',
    label:`On This Day: ${cleanTitle(item.title||x.title)}`,
    url:String(item.coverUrl),
    libraryId:item.id||x.libraryId||null
  };
}

renderOnThisDay=function(){
  const model=v159BuildOnThisDayModel();
  if(!model.flat.length)return '';

  V159_OTD_CURRENT_INDEX=v159OtdInitialIndex(model);
  const hero=model.flat[V159_OTD_CURRENT_INDEX]||model.flat[0];

  const body=model.groups.map(group=>{
    const rows=group.rows.map(x=>{
      const item=x.item||v50FindLibraryItem(x.libraryId,x.title);
      const edit=item?.id
        ?`<button type="button" class="btn btn-sm btn-ghost v159-otd-edit" onclick="event.preventDefault();event.stopPropagation();App.openLibraryModal('${escapeHtml(String(item.id))}')">Edit</button>`
        :'';

      return `<div class="v126-otd-row v159-otd-row">
        ${v159OtdCoverMarkup(x,false)}
        <div class="v126-otd-row-copy v159-otd-row-copy">
          <b>${escapeHtml(cleanTitle(x.title))}</b>
          <div class="v159-otd-row-event">${v159OtdEventLine(x,false)}</div>
        </div>
        ${edit}
      </div>`;
    }).join('');

    return `<div class="v126-otd-year">
      <div class="v126-otd-year-head">
        <strong>${group.years} year${group.years===1?'':'s'} ago</strong>
        <span>${group.rows.length.toLocaleString()} event${group.rows.length===1?'':'s'}</span>
      </div>
      ${rows}
    </div>`;
  }).join('');

  return `<details class="on-this-day v126-otd" data-mf-on-this-day-version="159">
    <summary class="v126-otd-summary" id="v159-otd-summary" data-v159-index="${V159_OTD_CURRENT_INDEX}">
      <div class="v159-otd-summary-cover-slot" id="v159-otd-summary-cover">${v159OtdCoverMarkup(hero,true)}</div>
      <div class="v126-otd-copy">
        <b class="v159-otd-summary-title" id="v159-otd-summary-title">${escapeHtml(cleanTitle(hero.title))}</b>
        <span class="v159-otd-summary-event" id="v159-otd-summary-event">${v159OtdEventLine(hero,true)}</span>
      </div>
      <span class="v126-otd-chevron">⌄</span>
    </summary>
    <div class="v126-otd-body">${body}</div>
  </details>`;
};

function v159ApplyOtdHero(index,{forceTheme=true}={}){
  const model=v159BuildOnThisDayModel();
  const count=model.flat.length;
  if(!count)return;

  const normalized=((Number(index)||0)%count+count)%count;
  const x=model.flat[normalized];

  V159_OTD_CURRENT_INDEX=normalized;

  const summary=document.getElementById('v159-otd-summary');
  const cover=document.getElementById('v159-otd-summary-cover');
  const title=document.getElementById('v159-otd-summary-title');
  const event=document.getElementById('v159-otd-summary-event');

  if(!summary||!cover||!title||!event)return;

  summary.dataset.v159Index=String(normalized);
  cover.innerHTML=v159OtdCoverMarkup(x,true);
  title.textContent=cleanTitle(x.title);
  event.innerHTML=v159OtdEventLine(x,true);

  if(forceTheme&&S.settings?.dynamicCoverTheme){
    const source=v159OtdThemeSource(x);
    if(source){
      V159_FORCED_THEME_SOURCE=source;
      v146ScheduleDynamicTheme();
    }
  }
}

function v159ScheduleOtdRotation(){
  clearTimeout(V159_OTD_ROTATE_TIMER);
  V159_OTD_ROTATE_TIMER=null;

  if(S.view!=='dashboard')return;

  const model=v159BuildOnThisDayModel();
  if(model.flat.length<=1)return;
  if(!document.getElementById('v159-otd-summary'))return;

  const elapsed=Date.now()%V159_OTD_ROTATE_MS;
  const delay=Math.max(1500,V159_OTD_ROTATE_MS-elapsed);

  V159_OTD_ROTATE_TIMER=setTimeout(()=>{
    if(S.view!=='dashboard')return;
    const latest=v159BuildOnThisDayModel();
    if(latest.flat.length>1){
      v159ApplyOtdHero((V159_OTD_CURRENT_INDEX+1)%latest.flat.length,{forceTheme:true});
    }
    v159ScheduleOtdRotation();
  },delay);
}

// Invalidate the expensive On This Day model only when the data it reads changes.
const v159InvalidateLibraryCacheBase=v53InvalidateLibraryCache;
v53InvalidateLibraryCache=function(){
  v159MarkOnThisDayDirty();
  return v159InvalidateLibraryCacheBase.apply(this,arguments);
};

const v159InvalidateSessionCacheBase=v53InvalidateSessionCache;
v53InvalidateSessionCache=function(){
  v159MarkOnThisDayDirty();
  return v159InvalidateSessionCacheBase.apply(this,arguments);
};

// ------------------------------------------------------------
// Rich multi-color cover extraction
// ------------------------------------------------------------

function v159ColorDistance(a,b){
  if(!a||!b)return Infinity;
  const dr=a.r-b.r,dg=a.g-b.g,db=a.b-b.b;
  return Math.sqrt(dr*dr+dg*dg+db*db);
}

function v159HexRgb(hex){
  return v146RgbFromHex(hex)||v145CssColorToRgb(hex);
}

function v159HexFromHsl(h,s,l){
  return v146HslHex(h,s,l);
}

function v159TuneThemeColor(hex,mode,role='accent'){
  const rgb=v159HexRgb(hex);
  if(!rgb)return hex;
  const hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);

  if(role==='accent'){
    const s=Math.max(58,Math.min(92,hsl.s*1.14||66));
    const l=mode==='light'?Math.max(34,Math.min(52,hsl.l)):Math.max(52,Math.min(68,hsl.l));
    return v159HexFromHsl(hsl.h,s,l);
  }

  const s=Math.max(32,Math.min(78,hsl.s||48));
  const l=mode==='light'?Math.max(38,Math.min(62,hsl.l)):Math.max(42,Math.min(68,hsl.l));
  return v159HexFromHsl(hsl.h,s,l);
}

function v159DerivedThemeDataFromAccent(accent){
  const rgb=v159HexRgb(accent);
  if(!rgb)return null;
  const hsl=v145RgbToHsl(rgb.r,rgb.g,rgb.b);

  return {
    colors:[
      v159HexFromHsl(hsl.h,Math.max(52,hsl.s),Math.max(42,Math.min(64,hsl.l))),
      v159HexFromHsl(hsl.h+48,Math.max(46,hsl.s*.88),55),
      v159HexFromHsl(hsl.h+188,Math.max(42,hsl.s*.78),52)
    ],
    naturalMode:v145Luminance(rgb)>.52?'light':'dark',
    averageLuminance:v145Luminance(rgb),
    derived:true
  };
}

function v159ExtractCoverTheme(url){
  const src=String(url||'').trim();
  if(!src)return Promise.resolve(null);
  if(V159_COVER_THEME_CACHE.has(src))return V159_COVER_THEME_CACHE.get(src);

  const promise=new Promise(resolve=>{
    const img=new Image();
    img.crossOrigin='anonymous';

    const fallback=async()=>{
      try{
        const accent=await v145ExtractCoverAccent(src);
        resolve(accent?v159DerivedThemeDataFromAccent(accent):null);
      }catch(_){
        resolve(null);
      }
    };

    img.onerror=fallback;

    img.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        const w=54,h=72;
        canvas.width=w;
        canvas.height=h;

        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        if(!ctx){fallback();return;}

        ctx.drawImage(img,0,0,w,h);
        const data=ctx.getImageData(0,0,w,h).data;
        const buckets=new Map();

        let lumSum=0,lumWeight=0;

        for(let i=0;i<data.length;i+=4){
          const a=data[i+3];
          if(a<180)continue;

          const r=data[i],g=data[i+1],b=data[i+2];
          const max=Math.max(r,g,b),min=Math.min(r,g,b);
          const sat=max?((max-min)/max):0;
          const lum=.2126*r+.7152*g+.0722*b;

          lumSum+=lum;
          lumWeight++;

          // Keep dark/light cover colors available, but de-emphasize near-gray.
          const qr=Math.round(r/24)*24;
          const qg=Math.round(g/24)*24;
          const qb=Math.round(b/24)*24;
          const key=`${qr},${qg},${qb}`;

          const vivid=.35+sat*1.9;
          const middle=.55+(1-Math.abs(lum/255-.50))*.45;
          const score=vivid*middle;

          const row=buckets.get(key)||{r:0,g:0,b:0,n:0,score:0};
          row.r+=r;row.g+=g;row.b+=b;row.n++;row.score+=score;
          buckets.set(key,row);
        }

        const ranked=[...buckets.values()]
          .filter(x=>x.n>=2)
          .map(x=>({
            r:x.r/x.n,
            g:x.g/x.n,
            b:x.b/x.n,
            n:x.n,
            score:x.score*Math.pow(x.n,.62)
          }))
          .sort((a,b)=>b.score-a.score);

        const picked=[];
        for(const row of ranked){
          if(picked.every(x=>v159ColorDistance(x,row)>=76)){
            picked.push(row);
            if(picked.length>=4)break;
          }
        }

        if(!picked.length){fallback();return;}

        const colors=picked.map(x=>v145RgbHex(x.r,x.g,x.b));
        while(colors.length<3){
          const seed=v159HexRgb(colors[0]);
          const hsl=v145RgbToHsl(seed.r,seed.g,seed.b);
          const shift=colors.length===1?52:188;
          colors.push(v159HexFromHsl(hsl.h+shift,Math.max(44,hsl.s*.86),54));
        }

        const average=lumWeight?lumSum/lumWeight/255:.35;
        resolve({
          colors:colors.slice(0,4),
          naturalMode:average>.58?'light':'dark',
          averageLuminance:average,
          derived:false
        });
      }catch(_){
        fallback();
      }
    };

    try{img.src=src;}catch(_){fallback();}
  });

  V159_COVER_THEME_CACHE.set(src,promise);
  return promise;
}

function v159DynamicAppearanceMode(themeData){
  // Global Appearance enabled = explicitly honor its selected Light/Dark mode.
  if(typeof v132GlobalAppearanceEnabled==='function'&&v132GlobalAppearanceEnabled()){
    return v106AppearanceMode()==='light'?'light':'dark';
  }

  // Global Appearance disabled = let the cover decide its own natural mode.
  return themeData?.naturalMode==='light'?'light':'dark';
}

v146DynamicAppearanceMode=v159DynamicAppearanceMode;

function v159CoverPalette(themeData,mode){
  if(!themeData?.colors?.length)return null;

  const raw1=themeData.colors[0];
  const raw2=themeData.colors[1]||raw1;
  const raw3=themeData.colors[2]||raw2;

  const primary=v159TuneThemeColor(raw1,mode,'accent');
  const secondary=v159TuneThemeColor(raw2,mode,'secondary');
  const tertiary=v159TuneThemeColor(raw3,mode,'secondary');

  if(mode==='light'){
    return {
      mode:'light',
      naturalMode:themeData.naturalMode,
      primary,
      secondary,
      tertiary,
      bg:v145MixHex(raw1,'#F5F7FB',.10),
      panel:v145MixHex(raw2,'#FFFFFF',.07),
      raised:v145MixHex(raw3,'#EDF1F7',.12),
      border:v145MixHex(secondary,'#CBD3DF',.18),
      borderSoft:v145MixHex(tertiary,'#DEE4EC',.11),
      text:'#121722',
      textDim:'#394354',
      textMute:'#667184',
      flow:primary,
      flowDim:v145MixHex(primary,'#D9E1EC',.36),
      selectionText:'#FFFFFF'
    };
  }

  return {
    mode:'dark',
    naturalMode:themeData.naturalMode,
    primary,
    secondary,
    tertiary,
    bg:v145MixHex(raw1,'#060912',.21),
    panel:v145MixHex(raw2,'#0B1019',.17),
    raised:v145MixHex(raw3,'#141B29',.20),
    border:v145MixHex(secondary,'#2C3545',.22),
    borderSoft:v145MixHex(tertiary,'#1D2635',.17),
    text:'#F4F7FB',
    textDim:'#C1CAD7',
    textMute:'#8793A5',
    flow:primary,
    flowDim:v145MixHex(primary,'#202A3A',.42),
    selectionText:'#FFFFFF'
  };
}

// Keep v146's proven base application, then add richer independent cover colors.
const v159ApplyFullPaletteBase=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
  v159ApplyFullPaletteBase(palette,source);

  const root=document.documentElement;
  root.style.setProperty('--v159-primary',palette.primary||palette.flow);
  root.style.setProperty('--v159-secondary',palette.secondary||palette.flow);
  root.style.setProperty('--v159-tertiary',palette.tertiary||palette.flowDim);
  root.style.setProperty('--v159-selection-text',palette.selectionText||'#FFFFFF');
  root.dataset.v159DynamicRich='1';

  if(S.v146DynamicThemeState){
    S.v146DynamicThemeState.palette=palette;
    S.v146DynamicThemeState.naturalMode=palette.naturalMode||palette.mode;
  }

  v146UpdateThemeStatus();
};

const v159ClearInlineThemeVarsBase=v146ClearInlineThemeVars;
v146ClearInlineThemeVars=function(){
  const root=document.documentElement;
  for(const key of [
    '--v159-primary','--v159-secondary','--v159-tertiary','--v159-selection-text'
  ])root.style.removeProperty(key);
  root.removeAttribute('data-v159-dynamic-rich');
  return v159ClearInlineThemeVarsBase.apply(this,arguments);
};

function v159OnThisDayThemeSources(){
  const model=v159BuildOnThisDayModel();
  if(!model.flat.length)return [];

  const rows=[];
  const seen=new Set();

  const add=x=>{
    const source=v159OtdThemeSource(x);
    if(!source||seen.has(source.url))return;
    seen.add(source.url);
    rows.push(source);
  };

  const current=model.flat[V159_OTD_CURRENT_INDEX]||model.flat[0];
  if(current)add(current);

  for(const row of model.flat)add(row);

  return rows;
}

// Redirect the old On This Day theme source helper to the cached v159 model.
v145OnThisDayCoverSources=function(){
  return v159OnThisDayThemeSources().map((x,index)=>({
    years:0,
    priority:index,
    timestamp:index,
    label:x.label,
    url:x.url
  }));
};

function v159RandomIndex(length){
  if(length<=1)return 0;
  return Math.floor(Math.random()*length);
}

function v159DynamicSourceOrder(){
  if(V159_FORCED_THEME_SOURCE){
    const forced=V159_FORCED_THEME_SOURCE;
    V159_FORCED_THEME_SOURCE=null;
    return [forced];
  }

  const rec=v145RecommendedCoverSource();
  const otd=v159OnThisDayThemeSources();

  if(rec&&otd.length){
    // Randomly switch which source family receives first priority.
    const onThisDayFirst=Math.random()<.5;
    const chosenOtd=otd[v159RandomIndex(otd.length)];

    if(onThisDayFirst){
      return [chosenOtd,rec,...otd.filter(x=>x.url!==chosenOtd.url).slice(0,1)];
    }

    return [rec,chosenOtd,...otd.filter(x=>x.url!==chosenOtd.url).slice(0,1)];
  }

  if(rec)return [rec];
  if(otd.length){
    const first=otd[v159RandomIndex(otd.length)];
    return [first,...otd.filter(x=>x.url!==first.url).slice(0,1)];
  }

  return [];
}

// FINAL Dynamic Cover Theme resolver.
v146RefreshDynamicTheme=async function(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=v159DynamicSourceOrder();

  for(const source of sources){
    const themeData=await v159ExtractCoverTheme(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;
    if(!themeData)continue;

    const mode=v159DynamicAppearanceMode(themeData);
    const palette=v159CoverPalette(themeData,mode);

    if(palette){
      v146ApplyFullPalette(palette,source);
      return;
    }
  }

  if(seq===V146_DYNAMIC_SEQ)v146RestoreSelectedThemeFallback();
};

v146UpdateThemeStatus=function(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const enabled=!!S.settings?.dynamicCoverTheme;
  const p=st.palette;

  let text='Theme collections are active.';

  if(enabled){
    if(st.source==='recommended'||st.source==='onthisday'){
      const appearance=typeof v132GlobalAppearanceEnabled==='function'&&v132GlobalAppearanceEnabled()
        ?`Global ${p?.mode||'dynamic'}`
        :`Natural ${p?.mode||st.naturalMode||'dynamic'}`;

      text=`${st.label} · ${appearance} · multi-color cover theme`;
    }else{
      text='No usable cover right now — using your selected fallback theme.';
    }
  }

  const colors=p
    ?[p.bg,p.panel,p.primary||p.flow,p.secondary,p.tertiary,p.text].filter(Boolean)
    :[];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
};

function v159EnsureDynamicSourceTimer(){
  if(!S.settings?.dynamicCoverTheme){
    clearTimeout(V159_DYNAMIC_SOURCE_TIMER);
    V159_DYNAMIC_SOURCE_TIMER=null;
    return;
  }

  if(V159_DYNAMIC_SOURCE_TIMER)return;

  const schedule=()=>{
    if(!S.settings?.dynamicCoverTheme){
      V159_DYNAMIC_SOURCE_TIMER=null;
      return;
    }

    // 24–36 seconds keeps the theme alive without turning it into a rapid
    // slideshow or continuously analyzing images.
    const delay=24000+Math.floor(Math.random()*12000);

    V159_DYNAMIC_SOURCE_TIMER=setTimeout(()=>{
      V159_DYNAMIC_SOURCE_TIMER=null;

      if(S.settings?.dynamicCoverTheme){
        V159_FORCED_THEME_SOURCE=null;
        v146ScheduleDynamicTheme();
        schedule();
      }
    },delay);
  };

  schedule();
}

// Settings copy now explains the new source rotation / natural appearance logic.
const v159RenderSettingsBase=renderSettings;
renderSettings=function(){
  let out=v159RenderSettingsBase();

  out=out.replace(
    'Your selected static theme is kept as the fallback. Dynamic Cover Theme uses the recommended title cover first, then On This Day. If neither cover can be used, MediaFlow returns to this fallback automatically.',
    'Your selected static theme is kept only as a fallback. Dynamic Cover Theme now rotates source priority between MediaFlow recommendations and On This Day covers. With Global Appearance off, each cover chooses its own natural Light/Dark treatment; with Global Appearance on, your selected Light/Dark mode wins.'
  );

  out=out.replace(
    'The cover now controls the whole MediaFlow color system — background, panels, raised surfaces, borders, text and accent — not only the accent color.',
    'The cover now creates a multi-color MediaFlow theme: independent background, panel, raised-surface, border and accent colors plus cover-driven gradients/glows. It no longer reduces the artwork to one flat hue.'
  );

  return out;
};

// After every real render, only arm lightweight timers. The On This Day
// rotation itself updates four small DOM nodes and does not rerender Dashboard.
const v159RenderBase=render;
render=function(){
  const result=v159RenderBase.apply(this,arguments);

  Promise.resolve().then(()=>{
    v159ScheduleOtdRotation();
    v159EnsureDynamicSourceTimer();
  });

  return result;
};



/* ============================================================
   MediaFlow v160 — Reliable Dynamic Cover Theme
   ------------------------------------------------------------
   Root causes fixed:
   1) v159's rotating On This Day "forced" source returned ONLY that cover.
      If that single image could not be sampled, MediaFlow immediately fell
      back to the static theme even when the recommendation / other OTD covers
      were perfectly usable.
   2) many valid remote covers display fine in <img> but do not allow canvas
      pixel reads (CORS). v159 treated those as unusable.
   3) a temporary failed refresh replaced an already-good dynamic theme with
      the static fallback.

   v160:
   - forced source is priority #1, NOT the only source;
   - recommendation source no longer unnecessarily depends on the setting flag
     if currentTask already contains an exact title;
   - all usable recommendation + On This Day covers become fallback candidates;
   - pixel extraction tries CORS first;
   - if the image itself loads but pixel access is blocked, MediaFlow generates
     a stable cover-specific palette from the cover URL and uses the cover as
     a blurred visual backdrop, instead of calling the cover unusable;
   - failed refresh keeps the last valid dynamic theme alive.
   ============================================================ */

const V160_COVER_THEME_CACHE=new Map();
const V160_IMAGE_USABILITY_CACHE=new Map();

function v160SafeCoverUrl(value){
  const s=String(value||'').trim();
  if(!s)return '';
  if(/^https?:\/\//i.test(s)||/^data:image\//i.test(s))return s;
  return '';
}

function v160RecommendedCoverSource(){
  const t=S.currentTask;
  if(!t)return null;

  let item=null;

  if(t.libraryId){
    item=(S.library||[]).find(x=>String(x?.id||'')===String(t.libraryId))||null;
  }

  if(!item&&t.title){
    item=v50FindLibraryItem(t.libraryId,t.title);
  }

  const url=v160SafeCoverUrl(item?.coverUrl);
  if(!item||!url)return null;

  return {
    source:'recommended',
    label:`Recommended: ${cleanTitle(item.title)}`,
    url,
    libraryId:item.id||t.libraryId||null
  };
}

// Replace the old helper so every later caller gets the fixed behavior.
v145RecommendedCoverSource=v160RecommendedCoverSource;

function v160AllDynamicSources(){
  const out=[];
  const seen=new Set();

  const add=x=>{
    if(!x)return;
    const url=v160SafeCoverUrl(x.url);
    if(!url||seen.has(url))return;
    seen.add(url);
    out.push(Object.assign({},x,{url}));
  };

  // The rotating title should get first chance, but must NEVER be the only
  // candidate if it fails.
  if(V159_FORCED_THEME_SOURCE){
    add(V159_FORCED_THEME_SOURCE);
    V159_FORCED_THEME_SOURCE=null;
  }

  const rec=v160RecommendedCoverSource();
  const otd=v159OnThisDayThemeSources();

  if(rec&&otd.length){
    // Preserve v159's random family priority after an optional forced source.
    if(Math.random()<.5){
      add(rec);
      const first=otd[v159RandomIndex(otd.length)];
      add(first);
      for(const row of otd)add(row);
    }else{
      const first=otd[v159RandomIndex(otd.length)];
      add(first);
      add(rec);
      for(const row of otd)add(row);
    }
  }else{
    add(rec);
    for(const row of otd)add(row);
  }

  return out;
}

// Keep the public v159 resolver name aligned with the corrected v160 source
// ordering so periodic timers and existing wrappers automatically use it.
v159DynamicSourceOrder=v160AllDynamicSources;

function v160HashString(value){
  let h1=2166136261>>>0;
  let h2=2246822519>>>0;
  const s=String(value||'');

  for(let i=0;i<s.length;i++){
    const c=s.charCodeAt(i);
    h1^=c;
    h1=Math.imul(h1,16777619)>>>0;
    h2^=(c+(i*31));
    h2=Math.imul(h2,3266489917)>>>0;
  }

  return [h1>>>0,h2>>>0];
}

function v160HashCoverTheme(url){
  const [a,b]=v160HashString(url);

  const h1=a%360;
  let h2=(h1+42+(b%126))%360;
  let h3=(h1+168+((a>>>8)%74))%360;

  // Keep the generated colors clearly separated.
  if(Math.abs(h2-h1)<34)h2=(h2+48)%360;
  if(Math.abs(h3-h1)<60)h3=(h3+96)%360;

  const s1=60+((a>>>12)%25);
  const s2=52+((b>>>10)%28);
  const s3=48+((a>>>20)%30);

  const l1=48+((b>>>18)%12);
  const l2=46+((a>>>6)%16);
  const l3=44+((b>>>4)%18);

  const colors=[
    v159HexFromHsl(h1,s1,l1),
    v159HexFromHsl(h2,s2,l2),
    v159HexFromHsl(h3,s3,l3)
  ];

  // Natural mode stays deterministic for this exact cover URL.
  const naturalMode=((a^b)&1)?'dark':'light';

  return {
    colors,
    naturalMode,
    averageLuminance:naturalMode==='light'?.64:.34,
    derived:true,
    corsFallback:true
  };
}

function v160CanDisplayImage(url){
  const src=v160SafeCoverUrl(url);
  if(!src)return Promise.resolve(false);
  if(V160_IMAGE_USABILITY_CACHE.has(src))return V160_IMAGE_USABILITY_CACHE.get(src);

  const promise=new Promise(resolve=>{
    const img=new Image();
    let settled=false;

    const done=value=>{
      if(settled)return;
      settled=true;
      clearTimeout(timer);
      resolve(!!value);
    };

    const timer=setTimeout(()=>done(false),10000);
    img.onload=()=>done(true);
    img.onerror=()=>done(false);

    try{img.src=src;}catch(_){done(false);}
  });

  V160_IMAGE_USABILITY_CACHE.set(src,promise);
  return promise;
}

function v160ExtractCoverTheme(url){
  const src=v160SafeCoverUrl(url);if(!src)return Promise.resolve(null);
  if(V160_COVER_THEME_CACHE.has(src))return V160_COVER_THEME_CACHE.get(src);

  const promise=(async()=>{
    // First use v159's richer real-pixel extraction. This also falls back to
    // the older v145 accent extractor when the host supports it.
    try{
      const real=await v159ExtractCoverTheme(src);
      if(real)return Object.assign({},real,{visualCoverUrl:src});
    }catch(_){}

    // A cover can display perfectly while refusing anonymous canvas access.
    // Verify the actual image loads normally; if it does, it is a valid source.
    const displayable=await v160CanDisplayImage(src);
    if(!displayable)return null;

    // CORS prevented us from reading pixels. Never call a visible cover
    // "unusable": create a stable cover-specific palette and also use the
    // actual cover image as a low-opacity blurred background atmosphere.
    const fallback=v160HashCoverTheme(src);
    fallback.visualCoverUrl=src;
    return fallback;
  })();

  V160_COVER_THEME_CACHE.set(src,promise);
  return promise;
}

function v160CssUrl(url){
  // setProperty receives a CSS value, not HTML. Escape slashes/quotes safely.
  const s=String(url||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  return `url("${s}")`;
}

function v160ApplyCoverVisual(url){
  const root=document.documentElement;
  const src=v160SafeCoverUrl(url);

  if(src){
    root.style.setProperty('--v160-cover-image',v160CssUrl(src));
    root.dataset.v160CoverVisual='1';
  }else{
    root.style.removeProperty('--v160-cover-image');
    root.removeAttribute('data-v160-cover-visual');
  }
}

const v160ApplyFullPaletteBase=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
  v160ApplyFullPaletteBase(palette,source);

  const visual=palette?.visualCoverUrl||source?.url||'';
  v160ApplyCoverVisual(visual);

  if(S.v146DynamicThemeState){
    S.v146DynamicThemeState.corsFallback=!!palette?.corsFallback;
    S.v146DynamicThemeState.visualCoverUrl=visual;
  }
};

const v160ClearInlineThemeVarsBase=v146ClearInlineThemeVars;
v146ClearInlineThemeVars=function(){
  v160ApplyCoverVisual('');
  return v160ClearInlineThemeVarsBase.apply(this,arguments);
};

function v160HasLiveDynamicTheme(){
  const st=S.v146DynamicThemeState||{};
  return (
    document.documentElement.dataset.v146DynamicActive==='1' &&
    !!st.palette &&
    (st.source==='recommended'||st.source==='onthisday')
  );
}

// FINAL v160 resolver.
v146RefreshDynamicTheme=async function(){
  const seq=++V146_DYNAMIC_SEQ;

  if(!S.settings?.dynamicCoverTheme){
    v146RestoreSelectedThemeFallback();
    document.documentElement.dataset.v146ThemeMode='collection';
    return;
  }

  document.documentElement.dataset.v146ThemeMode='dynamic';

  const sources=v160AllDynamicSources();

  for(const source of sources){
    const themeData=await v160ExtractCoverTheme(source.url);
    if(seq!==V146_DYNAMIC_SEQ)return;
    if(!themeData)continue;

    const mode=v159DynamicAppearanceMode(themeData);
    const palette=v159CoverPalette(themeData,mode);

    if(!palette)continue;

    // Carry fallback/visual metadata through the palette layer.
    palette.visualCoverUrl=themeData.visualCoverUrl||source.url;
    palette.corsFallback=!!themeData.corsFallback;
    palette.naturalMode=themeData.naturalMode||mode;

    v146ApplyFullPalette(palette,source);
    return;
  }

  if(seq!==V146_DYNAMIC_SEQ)return;

  // Critical v160 behavior: a transient bad/blocked new source must not tear
  // down a perfectly valid dynamic theme that was already active.
  if(v160HasLiveDynamicTheme()){
    v146UpdateThemeStatus();
    return;
  }

  v146RestoreSelectedThemeFallback();
};

v146UpdateThemeStatus=function(){
  const el=document.getElementById('v146-dynamic-theme-status');
  if(!el)return;

  const st=S.v146DynamicThemeState||{};
  const enabled=!!S.settings?.dynamicCoverTheme;
  const p=st.palette;

  let text='Theme collections are active.';

  if(enabled){
    if(st.source==='recommended'||st.source==='onthisday'){
      const appearance=typeof v132GlobalAppearanceEnabled==='function'&&v132GlobalAppearanceEnabled()
        ?`Global ${p?.mode||'dynamic'}`
        :`Natural ${p?.mode||st.naturalMode||'dynamic'}`;

      const method=st.corsFallback
        ?'cover visual + cover-specific palette'
        :'multi-color cover theme';

      text=`${st.label} · ${appearance} · ${method}`;
    }else{
      const available=v160AllDynamicSources().length;
      text=available
        ?`${available} cover source${available===1?'':'s'} found · waiting for a usable image response`
        :'No recommendation / On This Day cover source is currently available — using your selected fallback theme.';
    }
  }

  const colors=p
    ?[p.bg,p.panel,p.primary||p.flow,p.secondary,p.tertiary,p.text].filter(Boolean)
    :[];

  el.innerHTML=`<span>${escapeHtml(text)}</span>${colors.length?`<span class="v146-theme-swatches">${colors.map(c=>`<span class="v146-theme-swatch" style="background:${escapeHtml(c)}"></span>`).join('')}</span>`:''}`;
};

// If the previous v159 cache remembered a failed extraction as null, v160 uses
// its own independent cache and therefore retries those valid covers once.
V160_COVER_THEME_CACHE.clear();
V160_IMAGE_USABILITY_CACHE.clear();



