/* MediaFlow v336 — designed dialogs and expanded Active Time analytics.
   Keeps the v335 activity-card look, adds range-driven charts/progress, and
   replaces key browser popups with theme-aware MediaFlow dialogs. */

const V336_PAGE_LABELS={
  dashboard:'Dashboard',library:'Library',libraryhistory:'Library History',history:'History',batch:'Batch Log',stats:'Statistics',settings:'Settings',profile:'Profile',order:'Personal Order',about:'About',oldsystem:'Old System',unknown:'Other'
};
const V336_ACTION_LABELS={
  browsing:'Browsing',logging:'Logging',editing:'Editing titles',collections:'Managing collections',settings:'Changing settings',analytics:'Viewing analytics',profile:'Managing profile',history:'Reviewing history',sync:'Syncing',navigation:'Navigating',other:'Other'
};
const V336_TIME_MILESTONES=[1,5,10,25,50,100,250,500,1000].map(hours=>hours*3600000);
const V336_DIALOG_ROOT_ID='v336-dialog-root';
let V336_ACTIVE_RANGE={preset:'30d',from:'',to:''};
let V336_ACTION_STATE={name:'browsing',until:0};

function v336Icon(paths){return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;}
const V336_DIALOG_ICONS={
  info:v336Icon('<path d="M12 17v-5"/><circle cx="12" cy="7.25" r=".9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9"/>'),
  success:v336Icon('<circle cx="12" cy="12" r="9"/><path d="m8.7 12.2 2.2 2.2 4.5-5"/>'),
  warning:v336Icon('<path d="M12 3.5 2.8 19.2a1 1 0 0 0 .87 1.5h16.66a1 1 0 0 0 .87-1.5L12 3.5Z"/><path d="M12 9v4"/><circle cx="12" cy="16.4" r=".8" fill="currentColor" stroke="none"/>')
};
function v336CleanupDialog(){
  const root=document.getElementById(V336_DIALOG_ROOT_ID);
  if(root){
    root.classList.add('is-closing');
    const dispose=()=>root.remove();
    root.addEventListener('animationend',dispose,{once:true});
    setTimeout(dispose,180);
  }
  document.removeEventListener('keydown',v336HandleDialogEscape);
  delete window.__v336DialogClose;
}
function v336HandleDialogEscape(event){
  if(event.key==='Escape'&&typeof window.__v336DialogClose==='function')window.__v336DialogClose(false);
}
function v336Dialog(options={}){
  const type=String(options.type||'info');
  const title=String(options.title||'MediaFlow');
  const message=String(options.message||'');
  const confirmText=String(options.confirmText||'OK');
  const cancelText=String(options.cancelText||'Cancel');
  const canCancel=options.canCancel!==false&&type!=='info'&&type!=='success';
  const tone=String(options.tone||((type==='warning'||type==='confirm')?'warning':'success'));
  v336CleanupDialog();
  return new Promise(resolve=>{
    const root=document.createElement('div');
    root.id=V336_DIALOG_ROOT_ID;
    root.innerHTML=`<div class="modal-overlay v336-dialog-overlay" data-v336-close-overlay="${options.closeOnOverlay!==false&&canCancel?'1':'0'}"><div class="modal v336-dialog v336-dialog-${escapeHtml(type)} v336-dialog-tone-${escapeHtml(tone)}" role="dialog" aria-modal="true" aria-labelledby="v336-dialog-title"><div class="v336-dialog-head"><div class="v336-dialog-badge">${V336_DIALOG_ICONS[tone]||V336_DIALOG_ICONS.info}</div><div><div class="v336-dialog-kicker">MEDIAFLOW</div><div class="modal-title" id="v336-dialog-title">${escapeHtml(title)}</div></div></div><div class="v336-dialog-body">${escapeHtml(message).replace(/\n/g,'<br>')}</div><div class="modal-actions v336-dialog-actions">${canCancel?`<button type="button" class="btn btn-ghost" data-v336-dialog-cancel>${escapeHtml(cancelText)}</button>`:''}<button type="button" class="btn ${tone==='warning'?'btn-primary':'btn-primary'}" data-v336-dialog-confirm autofocus>${escapeHtml(confirmText)}</button></div></div></div>`;
    document.body.appendChild(root);
    const close=(value)=>{if(typeof window.__v336DialogClose!=='function')return;delete window.__v336DialogClose;v336CleanupDialog();resolve(value);};
    window.__v336DialogClose=close;
    const overlay=root.querySelector('.v336-dialog-overlay');
    overlay?.addEventListener('click',e=>{if(e.target===overlay&&overlay.dataset.v336CloseOverlay==='1')close(false);});
    root.querySelector('[data-v336-dialog-confirm]')?.addEventListener('click',()=>close(true));
    root.querySelector('[data-v336-dialog-cancel]')?.addEventListener('click',()=>close(false));
    document.addEventListener('keydown',v336HandleDialogEscape);
    requestAnimationFrame(()=>root.querySelector('[data-v336-dialog-confirm]')?.focus());
  });
}
function v336Alert(message,title='MediaFlow',tone='success'){return v336Dialog({type:tone==='warning'?'confirm':'success',title,message,confirmText:'OK',canCancel:false,tone});}
function v336Confirm(message,{title='Please confirm',confirmText='Continue',cancelText='Cancel',tone='warning',closeOnOverlay=true}={}){
  return v336Dialog({type:'confirm',title,message,confirmText,cancelText,tone,closeOnOverlay});
}

// Replace the browser confirm/alert used in the reported flows with designed dialogs.
if(window.MediaFlowRecovery){
  window.MediaFlowRecovery.startEmpty=async function(){
    const ok=await v336Confirm('Start with an empty MediaFlow workspace? This is only for a genuinely new/empty account. Existing cloud data will not be written over until you make a later change.',{title:'Empty MediaFlow workspace?',confirmText:'Start empty',cancelText:'Cancel',tone:'warning'});
    if(!ok)return;
    await v115StartWithData(undefined);
  };
}
updateAccountName=async function(){
  const input=document.getElementById('profile-name');
  const name=input?.value.trim()||'';
  const btn=input?.closest('.card')?.querySelector('button.btn-primary');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    const {error}=await supabase.auth.updateUser({data:{display_name:name||null}});
    if(error)throw error;
    await refreshAuthUser();
    render();
    await v336Alert(name?'Name updated successfully.':'Name removed. Your email will be shown instead.','Profile updated','success');
  }catch(err){
    if(btn){btn.disabled=false;btn.textContent='Save name';}
    await v336Alert(friendlyAuthError(err),'Could not update name','warning');
  }
};

function v336NormalizeView(view){
  const raw=String(view||'').toLowerCase();
  if(V336_PAGE_LABELS[raw])return raw;
  if(raw==='statistics')return 'stats';
  return 'unknown';
}
function v336DefaultActionForPage(page){
  switch(page){
    case 'dashboard':return 'logging';
    case 'library':
    case 'libraryhistory':return 'editing';
    case 'history':return 'history';
    case 'stats':return 'analytics';
    case 'settings':return 'settings';
    case 'profile':return 'profile';
    case 'order':return 'collections';
    default:return 'browsing';
  }
}
function v336CurrentPageKey(){return v336NormalizeView(S.view||'dashboard');}
function v336MarkAction(name,ttl=90000){V336_ACTION_STATE={name:String(name||'other'),until:Date.now()+Math.max(10000,ttl|0)};}
function v336CurrentActionKey(){return Date.now()<=Number(V336_ACTION_STATE.until||0)?String(V336_ACTION_STATE.name||'browsing'):v336DefaultActionForPage(v336CurrentPageKey());}
function v336EnsureLedgerMaps(row){
  if(!row.pageMs||typeof row.pageMs!=='object'||Array.isArray(row.pageMs))row.pageMs={};
  if(!row.actionMs||typeof row.actionMs!=='object'||Array.isArray(row.actionMs))row.actionMs={};
  return row;
}
function v336WrapAppAction(methodName,action,ttl=90000){
  if(!App||typeof App[methodName]!=='function')return;
  const base=App[methodName];
  App[methodName]=function(){v336MarkAction(action,ttl);return base.apply(this,arguments);};
}
[
  ['addLogEntry','logging',120000],['openLibraryModal','editing',120000],['saveLibrary','editing',120000],['confirmDeleteLibrary','editing',120000],['openSessionModal','logging',120000],['saveSession','logging',120000],['setView','navigation',30000],['mobileNav','navigation',30000],['updateSetting','settings',90000],['updateLeveling','settings',90000],['v274SaveCollection','collections',120000],['v274OpenCollection','collections',90000],['v274CommitAddTitles','collections',120000],['v274RemoveTitle','collections',90000],['v274RemoveSelectedFromCollection','collections',90000],['openProfile','profile',90000]
].forEach(args=>v336WrapAppAction(...args));

const v336EarnTimeBase=v334EarnTime;
v334EarnTime=function(ms,day=todayISO()){
  const out=v336EarnTimeBase.apply(this,arguments);
  if(!(ms>0)||!AUTH_READY||!AUTH_USER)return out;
  const row=v336EnsureLedgerMaps((v334Ledger().v334ActiveTimeDays||{})[day]||{});
  const page=v336CurrentPageKey(),action=v336CurrentActionKey();
  row.pageMs[page]=(Number(row.pageMs[page])||0)+ms;
  row.actionMs[action]=(Number(row.actionMs[action])||0)+ms;
  row.updatedAt=Date.now();
  v334Ledger().v334ActiveTimeDays[day]=row;
  return out;
};
const v336MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v336MergeStatesBase.apply(this,arguments);
  try{
    const rows=out?.xpLedger?.v334ActiveTimeDays||{};
    for(const day of Object.keys(rows)){
      const row=v336EnsureLedgerMaps(rows[day]||{});
      const aRow=a?.xpLedger?.v334ActiveTimeDays?.[day]||{};
      const bRow=b?.xpLedger?.v334ActiveTimeDays?.[day]||{};
      const mergedPages={};
      for(const key of new Set([...Object.keys(row.pageMs||{}),...Object.keys(aRow.pageMs||{}),...Object.keys(bRow.pageMs||{})]))mergedPages[key]=Math.max(0,Number(row.pageMs?.[key])||0,Number(aRow.pageMs?.[key])||0,Number(bRow.pageMs?.[key])||0);
      const mergedActions={};
      for(const key of new Set([...Object.keys(row.actionMs||{}),...Object.keys(aRow.actionMs||{}),...Object.keys(bRow.actionMs||{})]))mergedActions[key]=Math.max(0,Number(row.actionMs?.[key])||0,Number(aRow.actionMs?.[key])||0,Number(bRow.actionMs?.[key])||0);
      row.pageMs=mergedPages;row.actionMs=mergedActions;rows[day]=row;
    }
  }catch(err){console.warn('MediaFlow v336 merge analytics skipped',err);}
  return out;
};

function v336IsoDate(offsetDays=0){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offsetDays);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function v336DateFromIso(iso){const [y,m,d]=String(iso||'').split('-').map(Number);const out=new Date(y||0,(m||1)-1,d||1,12,0,0,0);return Number.isFinite(out.getTime())?out:null;}
function v336DateRange(){
  const ui=V336_ACTIVE_RANGE||{preset:'30d'};const today=v336DateFromIso(v336IsoDate(0));let start=today,end=today;
  if(ui.preset==='month'){
    end=new Date(today.getFullYear(),today.getMonth(),0,12,0,0,0);
    start=new Date(end.getFullYear(),end.getMonth(),1,12,0,0,0);
  }else if(ui.preset==='year'){
    start=v336DateFromIso(v336IsoDate(-364));
  }else if(ui.preset==='custom'){
    const from=v336DateFromIso(ui.from),to=v336DateFromIso(ui.to||ui.from);
    if(from&&to){start=from<=to?from:to;end=from<=to?to:from;}
    else start=v336DateFromIso(v336IsoDate(-29));
  }else{start=v336DateFromIso(v336IsoDate(-29));}
  return {start,end,preset:ui.preset||'30d'};
}
function v336RangeMeta(){
  const {start,end,preset}=v336DateRange();
  const dates=[];const cursor=new Date(start.getTime());
  while(cursor<=end&&dates.length<732){dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`);cursor.setDate(cursor.getDate()+1);}
  return {start,end,preset,dates};
}
function v336AggregateActiveTime(){
  const ledger=v334Ledger(),days=ledger.v334ActiveTimeDays||{},range=v336RangeMeta();
  const rows=range.dates.map(iso=>{const row=v336EnsureLedgerMaps(days[iso]&&typeof days[iso]==='object'?days[iso]:{});return {iso,row,ms:Math.max(0,Number(row.ms)||0),xp:Math.max(0,Number(row.xp)||0)};});
  const pageTotals={},actionTotals={};let totalMs=0,totalXP=0,peakDay={iso:'',ms:0};
  rows.forEach(entry=>{
    totalMs+=entry.ms;totalXP+=entry.xp;if(entry.ms>peakDay.ms)peakDay={iso:entry.iso,ms:entry.ms};
    Object.entries(entry.row.pageMs||{}).forEach(([key,val])=>{pageTotals[key]=(pageTotals[key]||0)+Math.max(0,Number(val)||0);});
    Object.entries(entry.row.actionMs||{}).forEach(([key,val])=>{actionTotals[key]=(actionTotals[key]||0)+Math.max(0,Number(val)||0);});
  });
  const activeDays=rows.filter(x=>x.ms>0).length;
  const averageMs=rows.length?Math.round(totalMs/rows.length):0;
  const trendBuckets=[];
  if(rows.length<=62){
    rows.forEach(entry=>trendBuckets.push({label:v336DateFromIso(entry.iso)?.toLocaleDateString(undefined,{month:'short',day:'numeric'})||entry.iso.slice(5),short:v336DateFromIso(entry.iso)?.toLocaleDateString(undefined,{weekday:'short'})||entry.iso.slice(8),ms:entry.ms}));
  }else{
    const monthly={};
    rows.forEach(entry=>{const dt=v336DateFromIso(entry.iso);const key=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;monthly[key]=monthly[key]||{label:dt.toLocaleDateString(undefined,{month:'short',year:'2-digit'}),ms:0};monthly[key].ms+=entry.ms;});
    Object.values(monthly).forEach(item=>trendBuckets.push({label:item.label,short:item.label,ms:item.ms}));
  }
  const weekdayMap=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(label=>({label,ms:0}));
  rows.forEach(entry=>{const dt=v336DateFromIso(entry.iso);if(dt)weekdayMap[dt.getDay()].ms+=entry.ms;});
  return {range,rows,totalMs,totalXP,averageMs,activeDays,peakDay,pageTotals,actionTotals,trendBuckets,weekdayBuckets:weekdayMap};
}
function v336SortedBreakdown(obj,labels){
  return Object.entries(obj||{}).map(([key,ms])=>({key,label:labels[key]||key,ms:Math.max(0,Number(ms)||0)})).filter(x=>x.ms>0).sort((a,b)=>b.ms-a.ms);
}
function v336Milestone(activeMs){
  const next=V336_TIME_MILESTONES.find(x=>x>activeMs)||V336_TIME_MILESTONES[V336_TIME_MILESTONES.length-1];
  const prev=[0,...V336_TIME_MILESTONES].filter(x=>x<next).pop()||0;
  const current=Math.max(0,activeMs-prev),total=Math.max(1,next-prev);
  return {prev,next,current,progress:Math.max(0,Math.min(100,(current/total)*100))};
}
function v336Hours(ms){return Math.round((Math.max(0,ms)/3600000)*10)/10;}
function v336RangeLabel(meta){
  if(meta.preset==='month')return 'Last month';
  if(meta.preset==='year')return 'Last year';
  if(meta.preset==='custom')return 'Custom range';
  return 'Last 30 days';
}
function v336RenderBars(items,max,cls,labeler){
  return items.map(item=>`<div class="${cls}"><div class="${cls}-head"><span>${escapeHtml(labeler?labeler(item):item.label)}</span><b>${v334Duration(item.ms)}</b></div><div class="${cls}-track"><span style="width:${max>0?(item.ms/max)*100:0}%"></span></div></div>`).join('');
}
function v336TrendChart(buckets){
  const max=Math.max(60000,...buckets.map(x=>x.ms));
  return `<div class="v336-chart-bars" role="img" aria-label="${buckets.map(x=>`${x.label}: ${v334Duration(x.ms)}`).join(', ')}">${buckets.map(bucket=>`<div class="v336-chart-bar" title="${escapeHtml(bucket.label)}: ${escapeHtml(v334Duration(bucket.ms))}"><div class="v336-chart-bar-track"><span style="height:${bucket.ms>0?Math.max(4,Math.round(bucket.ms/max*100)):0}%"></span></div><small>${escapeHtml(bucket.short||bucket.label)}</small></div>`).join('')}</div>`;
}
App.v336SetActiveRange=function(preset){
  if(preset==='custom'){
    const now=v336IsoDate(0),from=v336IsoDate(-29);
    V336_ACTIVE_RANGE={preset:'custom',from:V336_ACTIVE_RANGE.from||from,to:V336_ACTIVE_RANGE.to||now};
  }else V336_ACTIVE_RANGE={preset,from:'',to:''};
  render();
};
App.v336ApplyActiveRange=function(){
  const from=String(document.getElementById('v336-active-from')?.value||'').trim();
  const to=String(document.getElementById('v336-active-to')?.value||'').trim();
  V336_ACTIVE_RANGE={preset:'custom',from,to};
  render();
};

v335ActiveTimeCard=function(){
  const totals=v334Totals(),data=v336AggregateActiveTime(),today=v334Ledger().v334ActiveTimeDays[todayISO()]||{},rate=v334Reward('activeTimeXPPerMinute');
  const multiplier=v149StreakMultiplier(v149ProspectiveTodayStreak());
  const milestone=v336Milestone(totals.activeMs);
  const fmt=n=>Math.max(0,Math.round(n)).toLocaleString();
  const pageItems=v336SortedBreakdown(data.pageTotals,V336_PAGE_LABELS).slice(0,6);
  const actionItems=v336SortedBreakdown(data.actionTotals,V336_ACTION_LABELS).slice(0,6);
  const pageMax=Math.max(1,...pageItems.map(x=>x.ms));
  const actionMax=Math.max(1,...actionItems.map(x=>x.ms));
  const svgTime=v336Icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
  const svgSpark=v336Icon('<path d="m12 2-1.5 7H4l5 5-1 8 4-3 4 3-1-8 5-5h-6.5z"/>');
  const svgTrend=v336Icon('<path d="M4 19h16"/><path d="m6 15 4-4 3 2 5-6"/>');
  const svgPages=v336Icon('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9 5v14"/><path d="M12 10h5"/><path d="M12 14h4"/>');
  const svgActions=v336Icon('<path d="M4 7h9"/><path d="M4 12h16"/><path d="M4 17h11"/><circle cx="17" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="17" r="2" fill="currentColor" stroke="none"/>');
  const svgWeek=v336Icon('<path d="M4 20h16"/><rect x="5" y="11" width="3" height="7" rx=".5"/><rect x="11" y="5" width="3" height="13" rx=".5"/><rect x="17" y="9" width="3" height="9" rx=".5"/>');
  return `<section class="card v335-active-card v336-active-card" aria-label="Active Time Spent">
    <header class="v335-active-top"><div class="v335-active-title"><span class="v335-active-emblem">${svgTime}</span><div><span class="v335-active-eyebrow">YOUR APP ACTIVITY</span><h3>Active Time Spent</h3><p>Time invested in your media journey</p></div></div><span class="v335-active-status"><span></span>Foreground tracking</span></header>
    <div class="v335-active-hero"><div class="v335-active-hero-main"><small>TOTAL ACTIVE TIME</small><strong data-v334-live-time>${v334Duration(totals.activeMs)}</strong><span>Accumulated while MediaFlow was visible</span></div><div class="v335-active-hero-xp"><span>${svgSpark} TIME XP EARNED</span><strong data-v334-live-xp>${fmt(totals.timeXP)} XP</strong><small>From active time and streaks</small></div></div>
    <div class="v336-progress-wrap"><div class="v336-progress-head"><div><span class="v336-progress-kicker">NEXT TIME MILESTONE</span><strong>${v334Duration(milestone.next)}</strong></div><b>${v334Duration(milestone.current)} / ${v334Duration(milestone.next-milestone.prev)}</b></div><div class="v336-progress-track"><span style="width:${milestone.progress}%"></span></div><div class="v336-progress-foot"><span>${v334Duration(Math.max(0,milestone.prev))} completed</span><span>${milestone.progress.toFixed(0)}%</span></div></div>
    <div class="v335-active-metrics"><div><span class="v335-metric-label">Today</span><b>${v334Duration(today.ms||0)}</b><small>Today's foreground time</small></div><div><span class="v335-metric-label">Streak multiplier</span><b>×${multiplier.toFixed(2)}</b><small>Applied to time XP</small></div><div><span class="v335-metric-label">Earning rate</span><b>${rate.toLocaleString()} <em>XP / min</em></b><small>Before multiplier</small></div></div>
    <div class="v336-range-toolbar"><div class="v336-range-pills"><button class="btn btn-sm ${data.range.preset==='30d'?'btn-primary':'btn-ghost'}" onclick="App.v336SetActiveRange('30d')">Last 30 days</button><button class="btn btn-sm ${data.range.preset==='month'?'btn-primary':'btn-ghost'}" onclick="App.v336SetActiveRange('month')">Last month</button><button class="btn btn-sm ${data.range.preset==='year'?'btn-primary':'btn-ghost'}" onclick="App.v336SetActiveRange('year')">Last year</button><button class="btn btn-sm ${data.range.preset==='custom'?'btn-primary':'btn-ghost'}" onclick="App.v336SetActiveRange('custom')">Custom</button></div>${data.range.preset==='custom'?`<div class="v336-range-custom"><input id="v336-active-from" type="date" value="${escapeHtml(V336_ACTIVE_RANGE.from||'')}"/><span>to</span><input id="v336-active-to" type="date" value="${escapeHtml(V336_ACTIVE_RANGE.to||'')}"/><button class="btn btn-sm btn-ghost" onclick="App.v336ApplyActiveRange()">Apply</button></div>`:''}</div>
    <div class="v336-range-summary"><div><span>${escapeHtml(v336RangeLabel(data.range))}</span><b>${v334Duration(data.totalMs)}</b><small>Total active time in range</small></div><div><span>Average / day</span><b>${v334Duration(data.averageMs)}</b><small>${data.rows.length.toLocaleString()} tracked day${data.rows.length===1?'':'s'}</small></div><div><span>Most active day</span><b>${data.peakDay.ms?v334Duration(data.peakDay.ms):'0m 0s'}</b><small>${data.peakDay.iso?escapeHtml(v336DateFromIso(data.peakDay.iso)?.toLocaleDateString(undefined,{month:'short',day:'numeric',year:data.range.preset==='year'?'numeric':undefined})||data.peakDay.iso):'No recorded activity'}</small></div><div><span>Time XP in range</span><b>${fmt(data.totalXP)} XP</b><small>${data.activeDays.toLocaleString()} active day${data.activeDays===1?'':'s'}</small></div></div>
    <div class="v336-active-grid"><div class="v336-active-panel"><div class="v335-active-sectionhead">${svgTrend}<span>Trend</span><small>${escapeHtml(v336RangeLabel(data.range))}</small></div>${v336TrendChart(data.trendBuckets)}</div><div class="v336-active-panel"><div class="v335-active-sectionhead">${svgPages}<span>Time by page</span><small>Where your time was spent</small></div>${pageItems.length?v336RenderBars(pageItems,pageMax,'v336-split-bar'): '<p class="hint">No page time has been recorded for this range yet.</p>'}</div><div class="v336-active-panel"><div class="v335-active-sectionhead">${svgActions}<span>Time by action</span><small>What you were doing</small></div>${actionItems.length?v336RenderBars(actionItems,actionMax,'v336-split-bar'): '<p class="hint">No action time has been recorded for this range yet.</p>'}</div><div class="v336-active-panel"><div class="v335-active-sectionhead">${svgWeek}<span>Weekday rhythm</span><small>Average focus pattern</small></div>${v336TrendChart(data.weekdayBuckets)}</div></div>
    <div class="v335-active-detail"><div class="v335-active-week"><div class="v335-active-sectionhead">${svgWeek}<span>Last 7 days</span><small>Visible app time</small></div><div class="v335-active-bars" role="img" aria-label="${data.rows.slice(-7).map(x=>`${x.iso}: ${v334Duration(x.ms)}`).join(', ')}">${data.rows.slice(-7).map(entry=>{const day=v336DateFromIso(entry.iso);const max=Math.max(60000,...data.rows.slice(-7).map(x=>x.ms));return `<div class="v335-active-day ${entry.iso===todayISO()?'is-today':''}" title="${escapeHtml(day?.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})||entry.iso)}: ${escapeHtml(v334Duration(entry.ms))}"><div class="v335-active-track"><span style="height:${entry.ms>0?Math.max(5,Math.round(entry.ms/max*100)):0}%"></span></div><small>${escapeHtml(day?.toLocaleDateString(undefined,{weekday:'short'})||entry.iso.slice(8))}</small></div>`;}).join('')}</div></div><div class="v335-active-bonuses"><div class="v335-active-sectionhead">${svgSpark}<span>Bonus XP earned</span></div><div><span>First episode</span><b>${fmt(totals.firstEpisodeXP)} XP</b></div><div><span>First title starts</span><b>${fmt(totals.startsXP)} XP</b></div><div><span>Collections created</span><b>${fmt(totals.collectionCreateXP)} XP</b></div><div><span>Collections edited</span><b>${fmt(totals.collectionEditXP)} XP</b></div></div></div>
    <footer class="v335-active-foot">Tracking continues while the app is visible. No idle timeout or daily XP cap; hidden tabs don't count. Page and action analytics are available for the selected range above.</footer>
  </section>`;
};
