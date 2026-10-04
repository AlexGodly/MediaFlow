/* MediaFlow v201 source fragment
 * Derived/statistics helpers
 * Original HTML lines 7851-7973.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   DERIVED / STATS HELPERS

   ============================================================ */

function categoryHealthGuidance(cat, status){
  if(status==='overused'){
    return `Take a break from ${cat.name}. Focus on categories marked Due or Neglected, and let this category cool down before consuming more.`;
  }
  if(status==='neglected'){
    const amount = suggestedAmount(cat);
    const mid = Math.max(1, Math.round((amount.low + amount.high) / 2));
    return `Prioritize ${cat.name}. Do about ${mid} ${unitLabel(cat.unit, mid)} next, then rotate and let the status recalculate.`;
  }
  if(status==='due'){
    const amount = suggestedAmount(cat);
    const mid = Math.max(1, Math.round((amount.low + amount.high) / 2));
    return `Give ${cat.name} attention next. Aim for about ${mid} ${unitLabel(cat.unit, mid)}, then rotate to another category.`;
  }
  return `Keep ${cat.name} in your normal rotation. No special correction is needed.`;
}

function categoryStatusActionSummary(cat, todayStatus, overallStatus){
  const todayGuide = categoryHealthGuidance(cat, todayStatus);
  const overallGuide = categoryHealthGuidance(cat, overallStatus);
  if(todayStatus===overallStatus) return todayGuide;
  return `Today: ${todayGuide} Overall: ${overallGuide}`;
}

function categoryStatus(cat){

  const last = lastSessionFor(cat.id);

  const dSince = daysSince(last?last.timestamp:null);

  const min72 = minutesSince(cat.id,72);

  const expected3d = cat.target*cat.minutesPerUnit*2.2;

  const satRatio = expected3d>0 ? min72/expected3d : 0;

  const todayAmt = todaysSessions().filter(s=>s.categoryId===cat.id && s.status!=='skipped').reduce((a,s)=>a+s.actualAmount,0);

  if(todayAmt>0 && satRatio>=1.6) return 'overused';

  if(dSince>=6) return 'neglected';

  if(dSince>=2.2) return 'due';

  return 'healthy';

}

function overallCategoryStatus(cat){

  // Overall health uses the category's entire recorded history:
  // from its first ever non-skipped log through its last ever log.
  const sessions = S.sessions
    .filter(s=>s && s.categoryId===cat.id && s.status!=='skipped' && Number(s.minutes)>0)
    .sort((a,b)=>new Date(a.timestamp||a.date)-new Date(b.timestamp||b.date));

  if(!sessions.length) return 'healthy';

  const first = sessions[0];
  const last = sessions[sessions.length-1];
  const firstTime = new Date(first.timestamp||first.date).getTime();
  const lastTime = new Date(last.timestamp||last.date).getTime();
  const spanDays = Math.max(3,(lastTime-firstTime)/(24*60*60*1000));
  const totalMinutes = sessions.reduce((sum,s)=>sum+(Number(s.minutes)||0),0);
  const expectedPerDay = (cat.target*cat.minutesPerUnit*2.2)/3;
  const expectedOverall = expectedPerDay*spanDays;
  const ratio = expectedOverall>0 ? totalMinutes/expectedOverall : 0;

  // Recency still matters for whether the category is currently due/neglected,
  // while the consumption ratio itself covers the full lifetime of the category.
  const dSince = daysSince(last.timestamp||last.date);
  if(dSince>=6) return 'neglected';
  if(ratio>=1.6) return 'overused';
  if(dSince>=2.2) return 'due';
  return 'healthy';
}

function saturationLevel(cat){

  const min72 = minutesSince(cat.id,72);

  const baseline = Math.max(cat.target*cat.minutesPerUnit,1)*2.2;

  const ratio = min72/baseline;

  if(ratio<0.25) return {label:'VERY LOW', c:'#5AA9E6'};

  if(ratio<0.7) return {label:'LOW', c:'#3FC7A6'};

  if(ratio<1.4) return {label:'MEDIUM', c:'#E8A94A'};

  if(ratio<2.4) return {label:'HIGH', c:'#F58A5A'};

  return {label:'VERY HIGH', c:'#E8607A'};

}

function totalsForSessions(list){

  const out = {minutes:0, episodes:0, chapters:0, movies:0, issues:0, tasks:0};

  list.forEach(s=>{

    if(s.status==='skipped') return;

    out.minutes += s.minutes||0;

    out.tasks += 1;

    if(out[s.unit]!==undefined) out[s.unit]+=s.actualAmount;

  });

  return out;

}
