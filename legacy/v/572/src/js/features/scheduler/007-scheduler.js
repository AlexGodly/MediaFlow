/* ============================================================

   SCHEDULER

   ============================================================ */

// v90: Treat all category records created by one logging submission as one logical
// consumption event for recency/repetition calculations. Older sessions that do
// not have sessionGroupId remain individual logical events for compatibility.
function schedulerLogicalEvents(){
  const rows=schedulerConsumptionSessions().slice().sort((a,b)=>(Number(b.timestamp)||0)-(Number(a.timestamp)||0));
  const groups=new Map();
  for(const s of rows){
    const key=s.sessionGroupId ? `group:${s.sessionGroupId}` : `session:${s.id||uid()}`;
    if(!groups.has(key)) groups.set(key,{key,timestamp:Number(s.timestamp)||0,categoryIds:new Set(),sessions:[]});
    const g=groups.get(key);
    g.timestamp=Math.max(g.timestamp,Number(s.timestamp)||0);
    if(s.categoryId) g.categoryIds.add(s.categoryId);
    g.sessions.push(s);
  }
  return [...groups.values()].sort((a,b)=>b.timestamp-a.timestamp);
}

function recentTaskWindow(n){
  return schedulerLogicalEvents().slice(0,n);
}

function schedulerConsumptionSessions(){
  return S.sessions.filter(s=>s && s.status!=='skipped' && ((Number(s.minutes)||0)>0 || (Number(s.actualAmount)||0)>0));
}

function categoryBalance(cat){
  const enabled=(typeof v186ScopeCategories==='function'?v186ScopeCategories('scheduler'):S.categories.filter(c=>c.enabled));
  const weightTotal=enabled.reduce((a,c)=>a+Math.max(0.25,Number(c.weight)||1),0) || 1;
  const desiredShare=Math.max(0.25,Number(cat.weight)||1)/weightTotal;
  const all=schedulerConsumptionSessions();
  const now=Date.now();

  // Recent behavior matters most, but lifetime history remains a real signal.
  const windows=[
    {days:3, weight:.35, minMinutes:60},
    {days:7, weight:.25, minMinutes:120},
    {days:30, weight:.20, minMinutes:240},
    {days:null, weight:.20, minMinutes:1}
  ];

  let ratioSum=0, usedWeight=0;
  const detail={};
  for(const w of windows){
    const rows=w.days==null ? all : all.filter(x=>Number(x.timestamp)>=now-w.days*86400000);
    const totalMinutes=rows.reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
    const catMinutes=rows.filter(x=>x.categoryId===cat.id).reduce((a,x)=>a+Math.max(0,Number(x.minutes)||0),0);
    const key=w.days==null?'lifetime':`${w.days}d`;
    const actualShare=totalMinutes>0 ? catMinutes/totalMinutes : 0;
    const ratio=desiredShare>0 ? actualShare/desiredShare : 1;
    detail[key]={totalMinutes,catMinutes,actualShare,ratio};
    if(totalMinutes>=w.minMinutes){ ratioSum+=Math.min(6,ratio)*w.weight; usedWeight+=w.weight; }
  }

  const consumptionRatio=usedWeight>0 ? ratioSum/usedWeight : 1;
  const last=lastSessionFor(cat.id);
  const daysIdle=daysSince(last?last.timestamp:null);
  return {desiredShare,consumptionRatio,daysIdle,detail};
}

function computeScores(excludeIds){
  excludeIds = excludeIds || [];
  const st = S.settings;
  let pool = (typeof v186ScopeCategories==='function'?v186ScopeCategories('scheduler'):S.categories.filter(c=>c.enabled)).filter(c=>!excludeIds.includes(c.id));
  if(pool.length===0) pool = (typeof v186ScopeCategories==='function'?v186ScopeCategories('scheduler'):S.categories.filter(c=>c.enabled));
  const recentWindow = recentTaskWindow(6);
  const logicalChron = schedulerLogicalEvents();

  return pool.map(cat=>{
    const last = lastSessionFor(cat.id);
    const dSince = daysSince(last ? last.timestamp : null);
    const neglectBonus = last ? Math.min(st.neglectCap, dSince*st.neglectRate) : st.neglectCap;

    // v90: a category can count at most once per user logging action, even when
    // that action produced several category-specific session rows.
    const occurrences = recentWindow.filter(e=>e.categoryIds.has(cat.id)).length;
    const repetitionPenalty = occurrences * st.repetitionPenalty;

    // Consecutive use is also measured in logical logging actions. A mixed log
    // therefore says “these categories were consumed together”, not that they
    // were consumed as several arbitrary back-to-back sessions.
    let logicalStreakLen=0;
    for(const e of logicalChron){
      if(e.categoryIds.has(cat.id)) logicalStreakLen++;
      else break;
    }
    const consecutivePenalty = logicalStreakLen * st.consecutivePenalty;

    const balance=categoryBalance(cat);
    // Ratio 1 = on balance. Above 1 = category owns too much consumption time.
    // Below 1 = underrepresented. Cap both sides so one binge never permanently locks a category out.
    const overRatio=Math.max(0,balance.consumptionRatio-1);
    const underRatio=Math.max(0,1-balance.consumptionRatio);
    const saturationPenalty=Math.min(70,overRatio*st.saturationWeight*2.2);
    const balanceBonus=Math.min(28,underRatio*st.neglectCap*.55);

    const seasonalBonus = cat.seasonal ? (st.seasonalBonus + st.seasonalFreshCount*4) : 0;
    const weightScore = cat.weight * 8;
    const raw = weightScore + neglectBonus + balanceBonus + seasonalBonus - repetitionPenalty - consecutivePenalty - saturationPenalty;
    const floored = Math.max(raw, 1.5);
    const jitter = floored * (Math.random()*st.randomness*2 - st.randomness);
    const final = Math.max(floored + jitter, 0.5);

    const reasons = [];
    if(!last) reasons.push({t:'Never consumed yet', w: st.neglectCap});
    else if(dSince>=1) reasons.push({t:`Neglected for ${Math.floor(dSince)}d`, w: neglectBonus});
    if(balance.consumptionRatio>=1.35) reasons.push({t:'Overrepresented across your consumption history — cooling off',w:-saturationPenalty});
    else if(balance.consumptionRatio<=.70 && last) reasons.push({t:'Underrepresented in your overall consumption — catching up',w:balanceBonus});
    if(cat.seasonal && st.seasonalFreshCount>0) reasons.push({t:`${st.seasonalFreshCount} seasonal title(s) have fresh episodes`, w: seasonalBonus});
    else if(cat.seasonal) reasons.push({t:'Time-sensitive — airing now', w: seasonalBonus});
    if(repetitionPenalty+consecutivePenalty>4) reasons.push({t:'Appeared often in recent tasks', w: -(repetitionPenalty+consecutivePenalty)});
    reasons.sort((a,b)=>Math.abs(b.w)-Math.abs(a.w));

    return {cat, score: final, reasons: reasons.slice(0,3), debug:{neglectBonus,repetitionPenalty,consecutivePenalty,saturationPenalty,seasonalBonus,weightScore,balanceBonus,balanceRatio:balance.consumptionRatio}};
  });
}

function weightedPick(scored){
  const total = scored.reduce((s,x)=>s+x.score,0);
  let r = Math.random()*total;
  for(const x of scored){
    r -= x.score;
    if(r<=0) return x;
  }
  return scored[scored.length-1];
}

function suggestedAmount(cat){
  const t=Math.max(1,Number(cat.target)||1);
  const balance=categoryBalance(cat);
  const ratio=balance.consumptionRatio;
  const idle=balance.daysIdle;

  // Amount is self-correcting too: overconsumed categories shrink, neglected ones grow.
  // Recent windows dominate, lifetime history prevents a long binge from being forgotten overnight.
  let mult=1;
  if(ratio>=2.5) mult*=.50;
  else if(ratio>=1.8) mult*=.62;
  else if(ratio>=1.35) mult*=.78;
  else if(ratio<=.45) mult*=1.35;
  else if(ratio<=.70) mult*=1.18;

  // Time since last consumption adds a gradual catch-up boost with diminishing returns.
  if(Number.isFinite(idle)){
    if(idle>=60) mult*=1.65;
    else if(idle>=30) mult*=1.50;
    else if(idle>=14) mult*=1.32;
    else if(idle>=7) mult*=1.18;
  }else{
    mult*=1.5;
  }

  // Keep correction gradual. MediaFlow should rebalance over rotations, not create giant debt sessions.
  mult=clamp(mult,.45,2.0);
  const center=Math.max(1,Math.round(t*mult));
  let low,high;
  if(center<=2){ low=center; high=center; }
  else{
    low=Math.max(1,Math.round(center*.85));
    high=Math.max(low,Math.round(center*1.15));
  }

  const direction=mult<.9?'reduced':mult>1.1?'increased':'normal';
  return {low,high,multiplier:mult,direction,balanceRatio:ratio,daysIdle:idle};
}

function scoreLibraryTitle(item, cat){
  if(!item || item.categoryId!==cat.id) return -Infinity;
  if(item.status==='completed' || item.status==='dropped') return -Infinity;
  const total = Number(item.total);
  const progress = Number(item.progress)||0;
  const completion = total>0 ? Math.min(1,progress/total) : 0;
  const remaining = total>0 ? Math.max(0,total-progress) : 10;
  const priorityBonus = ({high:18,medium:8,low:0}[item.priority]||0);
  const activeBonus = item.status==='active' ? 12 : item.status==='planned' ? 5 : 0;
  const unfinishedBonus = total>0 ? Math.min(20, remaining*2) : 6;
  const seasonalBonus = cat.seasonal ? 10 : 0;
  const jitter = Math.random()*8;
  return priorityBonus + activeBonus + unfinishedBonus + seasonalBonus - completion*10 + jitter;
}

function pickLibraryTitle(cat){
  const pool=S.library.filter(i=>i && i.categoryId===cat.id && i.status!=='completed' && i.status!=='dropped');
  if(!pool.length) return null;

  // v139: Personal Order only changes WHICH TITLE is selected after the normal
  // scheduler has already selected the category and calculated the amount.
  // The first eligible ordered title inside this task's category wins.
  // If Order has no eligible title for the category, fall back to the original
  // MediaFlow title-scoring behavior unchanged.
  if(S.settings?.prioritizePersonalOrder && Array.isArray(S.orderPlan?.titleIds)){
    const eligibleById=new Map(pool.filter(i=>i?.id).map(i=>[String(i.id),i]));
    for(const id of S.orderPlan.titleIds){
      const ordered=eligibleById.get(String(id));
      if(ordered)return ordered;
    }
  }

  return pool.slice().sort((a,b)=>scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat))[0] || null;
}


function generateTask(excludeIds){
  const scored = computeScores(excludeIds);
  if(scored.length===0) return null;
  const pick = weightedPick(scored);
  const amount = suggestedAmount(pick.cat);
  const {low, high} = amount;
  const recommendedTitle = S.settings.exactTitleRecommendations ? pickLibraryTitle(pick.cat) : null;
  const amountReason=amount.direction==='reduced'
    ? 'Session size reduced because this category is overrepresented in your consumption'
    : amount.direction==='increased'
      ? 'Session size increased to gradually catch this category up'
      : 'Session size is near its normal target';
  return {
    id: uid(),
    categoryId: pick.cat.id,
    libraryId: recommendedTitle ? recommendedTitle.id : null,
    title: recommendedTitle ? cleanTitle(recommendedTitle.title) : null,
    low, high,
    targetMid: Math.round((low+high)/2) || pick.cat.target,
    unit: pick.cat.unit,
    createdAt: Date.now(),
    reasons: [...pick.reasons.map(r=>r.t),amountReason].slice(0,4),
    amountMultiplier: amount.multiplier,
    balanceRatio: amount.balanceRatio
  };
}


