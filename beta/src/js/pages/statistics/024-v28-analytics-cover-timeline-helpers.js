/* ============================================================
   V28 ANALYTICS / COVER / TIMELINE HELPERS
   ============================================================ */
function dayKeyLocal(d){ const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; }
function buildDailyActivity(days){
  const map=new Map();
  const cutoff=Date.now()-days*86400000;
  for(const s of S.sessions){ if(s.timestamp<cutoff||s.status==='skipped') continue; const k=s.date||dayKeyLocal(s.timestamp); let v=map.get(k); if(!v)v={minutes:0,sessions:0}; v.minutes+=Number(s.minutes)||0; v.sessions++; map.set(k,v); }
  return map;
}
function v119SessionDateKey(s){
  const raw=String(s?.date||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const ts=Number(s?.timestamp)||0;
  return ts>0 ? dayKeyLocal(ts) : '';
}
function v119HistoryTimes(){
  const times=[];
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    if(k){
      const t=new Date(k+'T12:00:00').getTime();
      if(Number.isFinite(t)) times.push(t);
    }
  }
  for(const i of (S.library||[])){
    const t=Number(i?.completedAt)||0;
    if(t>0) times.push(t);
  }
  for(const x of (S.completionTimeline||[])){
    const t=Number(x?.completedAt)||0;
    if(t>0) times.push(t);
  }
  return times;
}
function v119AvailableRecapMonths(){
  const now=new Date();
  const times=v119HistoryTimes();
  const minTime=times.length?Math.min(...times):now.getTime();
  const maxTime=Math.max(now.getTime(),times.length?Math.max(...times):0);
  const first=new Date(minTime), last=new Date(maxTime);
  const cursor=new Date(last.getFullYear(),last.getMonth(),1);
  const stop=new Date(first.getFullYear(),first.getMonth(),1);
  const out=[];
  while(cursor>=stop && out.length<1200){
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`);
    cursor.setMonth(cursor.getMonth()-1);
  }
  return out.length?out:[`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`];
}
function v119AvailableHeatmapYears(){
  const years=new Set([new Date().getFullYear()]);
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    const y=Number(k.slice(0,4));
    if(Number.isInteger(y)&&y>=1900&&y<=9999) years.add(y);
  }

  // v136: a year can now be meaningful even when it only contains title
  // lifecycle events and no consumption History.
  for(const item of (S.library||[])){
    for(const ts of [Number(item?.startedAt)||0,Number(item?.completedAt)||0]){
      if(!ts)continue;
      const d=new Date(ts);
      const y=d.getFullYear();
      if(!Number.isNaN(d.getTime())&&y>=1900&&y<=9999)years.add(y);
    }
  }
  for(const x of (S.completionTimeline||[])){
    const ts=Number(x?.completedAt)||0;
    if(!ts)continue;
    const d=new Date(ts),y=d.getFullYear();
    if(!Number.isNaN(d.getTime())&&y>=1900&&y<=9999)years.add(y);
  }

  return [...years].sort((a,b)=>b-a);
}
function renderConsumptionHeatmap(selectedYear){
  const year=Number(selectedYear)||new Date().getFullYear();
  const start=new Date(year,0,1), map=new Map();

  // Consumption remains the only source of heat/intensity.
  for(const s of (S.sessions||[])){
    if(!s || s.status==='skipped') continue;
    const k=v119SessionDateKey(s);
    if(!k || Number(k.slice(0,4))!==year) continue;
    let v=map.get(k);
    if(!v)v={minutes:0,sessions:0,started:[],finished:[]};
    v.minutes+=Number(s.minutes)||0;
    v.sessions++;
    map.set(k,v);
  }

  const lifecycleKey=ts=>{
    ts=Number(ts)||0;
    if(!ts)return '';
    const d=new Date(ts);
    return Number.isNaN(d.getTime())?'':dayKeyLocal(d);
  };

  const ensure=k=>{
    let v=map.get(k);
    if(!v){v={minutes:0,sessions:0,started:[],finished:[]};map.set(k,v);}
    if(!Array.isArray(v.started))v.started=[];
    if(!Array.isArray(v.finished))v.finished=[];
    return v;
  };

  const seenStart=new Set(),seenFinish=new Set();

  // Per-title v135 dates are the primary lifecycle source.
  for(const item of (S.library||[])){
    const title=cleanTitle(item?.title||'');
    if(!title)continue;

    const sk=lifecycleKey(item?.startedAt);
    if(sk && Number(sk.slice(0,4))===year){
      const unique=`${String(item.id||title)}::${sk}`;
      if(!seenStart.has(unique)){
        seenStart.add(unique);
        ensure(sk).started.push({title,libraryId:item.id||null,categoryId:item.categoryId||null});
      }
    }

    const fk=lifecycleKey(item?.completedAt);
    if(fk && Number(fk.slice(0,4))===year){
      const unique=`${String(item.id||title)}::${fk}`;
      if(!seenFinish.has(unique)){
        seenFinish.add(unique);
        ensure(fk).finished.push({title,libraryId:item.id||null,categoryId:item.categoryId||null});
      }
    }
  }

  // Keep legacy completion-timeline-only records visible too.
  for(const x of (S.completionTimeline||[])){
    const fk=lifecycleKey(x?.completedAt);
    if(!fk || Number(fk.slice(0,4))!==year)continue;
    const title=cleanTitle(x?.title||'');
    if(!title)continue;
    const unique=`${String(x.libraryId||title)}::${fk}`;
    if(seenFinish.has(unique))continue;
    seenFinish.add(unique);
    ensure(fk).finished.push({
      title,
      libraryId:x.libraryId||null,
      categoryId:x.categoryId||null
    });
  }

  const janDow=start.getDay();
  const lead=(janDow+6)%7;
  const max=Math.max(1,...[...map.values()].map(v=>Number(v.minutes)||0));
  const daysInYear=new Date(year,1,29).getMonth()===1?366:365;
  const cells=[];

  const names=(rows)=>{
    const unique=[...new Set((rows||[]).map(x=>cleanTitle(x?.title||'')).filter(Boolean))];
    const shown=unique.slice(0,6);
    return shown.join(', ')+(unique.length>shown.length?`, +${unique.length-shown.length} more`:'');
  };

  for(let i=0;i<lead;i++) cells.push('<div class="heat-cell heat-empty"></div>');

  for(let i=0;i<daysInYear;i++){
    const d=new Date(year,0,1);
    d.setDate(d.getDate()+i);
    const k=dayKeyLocal(d);
    const v=map.get(k)||{minutes:0,sessions:0,started:[],finished:[]};
    const m=Number(v.minutes)||0;
    const level=m===0?0:Math.min(4,Math.ceil((m/max)*4));

    const classes=[
      'heat-cell',
      `heat-${level}`,
      v.started?.length?'v136-heat-start':'',
      v.finished?.length?'v136-heat-finish':''
    ].filter(Boolean).join(' ');

    const info=[
      d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}),
      `${Math.round(m)} min${v.sessions?` · ${v.sessions} session${v.sessions===1?'':'s'}`:''}`,
      v.started?.length?`Started (${v.started.length}): ${names(v.started)}`:'',
      v.finished?.length?`Finished (${v.finished.length}): ${names(v.finished)}`:''
    ].filter(Boolean).join(' · ');

    cells.push(`<div class="${classes}" title="${escapeHtml(info)}"></div>`);
  }

  return `<div class="heatmap-wrap">
    <div class="heatmap-grid">${cells.join('')}</div>
    <div class="heatmap-legend"><span>Less</span>${[0,1,2,3,4].map(x=>`<i class="heat-cell heat-${x}"></i>`).join('')}<span>More</span></div>
    <div class="v136-heat-legend">
      <span><i class="heat-cell heat-0 v136-heat-start"></i> Title started</span>
      <span><i class="heat-cell heat-0 v136-heat-finish"></i> Title finished</span>
      <span>Markers do not add fake minutes.</span>
    </div>
  </div>`;
}
function renderCompletionTimeline(){
  const map=new Map();
  for(const x of (S.completionTimeline||[])){ if(x?.completedAt) map.set(x.libraryId||(`${x.title}::${x.completedAt}`),x); }
  for(const i of S.library.filter(i=>i.status==='completed'&&i.completedAt)){ if(!map.has(i.id))map.set(i.id,{libraryId:i.id,title:cleanTitle(i.title),categoryId:i.categoryId,completedAt:i.completedAt}); }
  const arr=[...map.values()].sort((a,b)=>Number(b.completedAt)-Number(a.completedAt));
  if(!arr.length) return '<div class="empty-state">No completed titles have a recorded completion date yet.</div>';
  return `<div class="completion-timeline">${arr.map(x=>{const c=getCategory(x.categoryId);return `<div class="timeline-item"><div class="timeline-dot" style="background:${c?.color||'var(--flow)'}"></div><div class="timeline-date">${new Date(Number(x.completedAt)).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</div><div class="timeline-title">${escapeHtml(cleanTitle(x.title))}</div><div class="timeline-cat">${c?.icon||'•'} ${escapeHtml(c?.name||'Unknown')}</div></div>`}).join('')}</div>`;
}
function renderMonthlyRecap(){
  const now=new Date(), currentKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const months=v119AvailableRecapMonths();
  let selected=String(S.statsRecapMonth||currentKey);
  if(!months.includes(selected)) selected=months.includes(currentKey)?currentKey:months[0];
  const [y,m]=selected.split('-').map(Number);
  const start=new Date(y,m-1,1).getTime(), end=new Date(y,m,1).getTime();
  const ss=(S.sessions||[]).filter(s=>s && s.status!=='skipped' && v119SessionDateKey(s).startsWith(selected));
  const mins=ss.reduce((a,s)=>a+(Number(s.minutes)||0),0);
  const byCat={};
  ss.forEach(s=>byCat[s.categoryId]=(byCat[s.categoryId]||0)+(Number(s.minutes)||0));
  const top=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  const finished=(S.library||[]).filter(i=>i.status==='completed'&&Number(i.completedAt)>=start&&Number(i.completedAt)<end).length;
  const days=[...new Set(ss.map(v119SessionDateKey).filter(Boolean))].sort();
  let longest=0,run=0,prev=null;
  for(const d of days){
    const cur=new Date(d+'T12:00:00');
    if(prev&&Math.round((cur-prev)/86400000)===1)run++;
    else run=1;
    longest=Math.max(longest,run);
    prev=cur;
  }
  const options=months.map(k=>{
    const [yy,mm]=k.split('-').map(Number);
    const d=new Date(yy,mm-1,1);
    return `<option value="${k}" ${k===selected?'selected':''}>${d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</option>`;
  }).join('');
  return `<div class="card" style="margin-bottom:24px;"><div class="section-label">MONTHLY RECAP</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;"><select onchange="App.setRecapMonth(this.value)" style="max-width:210px;">${options}</select></div><div class="recap-grid"><div><b>${fmtMinutes(mins)}</b><small>spent</small></div><div><b>${top?escapeHtml(getCategory(top[0])?.name||'—'):'—'}</b><small>top category · ${top?fmtMinutes(top[1]):'0m'}</small></div><div><b>${finished}</b><small>titles finished</small></div><div><b>${longest}</b><small>longest active-day streak</small></div></div></div>`;
}
function renderOnThisDay(){
  const now=new Date(); const matches=[]; for(const s of S.sessions){const d=new Date(s.timestamp); const years=now.getFullYear()-d.getFullYear(); if(years<1||d.getMonth()!==now.getMonth()||d.getDate()!==now.getDate())continue; for(const t of (s.titles||[])){ if(t.title) matches.push({years,title:t.title}); }}
  if(!matches.length)return ''; const x=matches.sort((a,b)=>a.years-b.years)[0]; return `<div class="on-this-day">On this day · ${x.years} year${x.years===1?'':'s'} ago you logged <b>${escapeHtml(x.title)}</b>.</div>`;
}
function renderSchedulerWhy(){
  if(!S.currentTask)return ''; const cat=getCategory(S.currentTask.categoryId); if(!cat)return ''; const scored=computeScores([...(S.currentTask.categoryId?[S.currentTask.categoryId]:[])]); const all=computeScores([]); const x=all.find(z=>z.cat.id===cat.id); if(!x)return '';
  const d=x.debug; const rows=[['Base weight',d.weightScore],['Neglect bonus',d.neglectBonus],['Seasonal bonus',d.seasonalBonus],['Repetition penalty',-d.repetitionPenalty],['Consecutive penalty',-d.consecutivePenalty],['Saturation penalty',-d.saturationPenalty]];return `<div class="reason-explain reason-breakdown"><b>Why this pick?</b><div class="score-grid">${rows.map(([k,v])=>`<div><span>${k}</span><strong>${v>=0?'+':''}${Math.round(v)}</strong></div>`).join('')}</div><small>Final score also includes controlled randomness. This breakdown is the scheduler's actual scoring inputs before the random jitter.</small></div>`;
}
renderReasonDetail=function(cat){ return renderSchedulerWhy(); };
const _renderDashboardV28=renderDashboard;
renderDashboard=function(){
  let h=_renderDashboardV28();
  const otd=renderOnThisDay(); const pos=h.indexOf('<div class="today-strip">'); return otd&&pos>0?h.slice(0,pos)+otd+h.slice(pos):h;
};

const _oldRenderSettings=renderSettings;
renderSettings=function(){
  let html=_oldRenderSettings();
  const themeCard=`<div class="section-label settings-section-head"><span>APPEARANCE</span>${defaultButton('appearance')}</div><div class="card" style="margin-bottom:22px;"><div class="field"><label class="field-label">UI look</label><select onchange="App.setTheme(this.value)"><option value="dark" ${S.settings.theme==='dark'?'selected':''}>Dark</option><option value="light" ${S.settings.theme==='light'?'selected':''}>Light</option><option value="amoled" ${S.settings.theme==='amoled'?'selected':''}>AMOLED</option></select><small class="hint">Choose the overall MediaFlow interface style.</small></div></div>`;
  const backupCard=`<div class="section-label settings-section-head"><span>AUTOMATIC BACKUPS</span>${defaultButton('backups')}</div><div class="card" style="margin-bottom:22px;"><div style="display:flex;align-items:center;justify-content:space-between;gap:14px;"><div><b>Automatic local JSON backup</b><div class="profile-note">Choose a folder on this computer. MediaFlow can periodically write a backup while the app is open. Browsers cannot write to arbitrary paths while the app is closed.</div></div><button class="toggle ${S.settings.backup?.enabled?'on':''}" onclick="App.toggleBackup()"></button></div><div class="field-row" style="margin-top:14px;"><div class="field"><label class="field-label">Backup every</label><select onchange="App.updateBackup('interval',this.value)"><option value="5" ${Number(S.settings.backup?.interval)===5?'selected':''}>5 minutes</option><option value="15" ${Number(S.settings.backup?.interval)===15?'selected':''}>15 minutes</option><option value="30" ${Number(S.settings.backup?.interval)===30?'selected':''}>30 minutes</option><option value="60" ${Number(S.settings.backup?.interval)===60?'selected':''}>1 hour</option><option value="360" ${Number(S.settings.backup?.interval)===360?'selected':''}>6 hours</option><option value="1440" ${Number(S.settings.backup?.interval)===1440?'selected':''}>Daily</option></select></div><div class="field"><label class="field-label">File mode</label><select onchange="App.updateBackup('mode',this.value)"><option value="single" ${S.settings.backup?.mode==='single'?'selected':''}>One file (overwrite)</option><option value="multiple" ${S.settings.backup?.mode==='multiple'?'selected':''}>Multiple files</option></select></div></div><div class="field"><label class="field-label">Single-file name</label><input value="${escapeHtml(S.settings.backup?.fileName||'mediaflow-backup.json')}" onchange="App.updateBackup('fileName',this.value)"></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn" onclick="App.chooseBackupFolder()">Choose backup folder</button><button class="btn btn-ghost" onclick="App.backupNow()">Back up now</button></div><small class="hint">Folder permission is stored in this browser when supported. Multiple-file mode creates a timestamped JSON file each time.</small></div>`;
  const linksCard='';
  const offlineCard='';
  const emptyCard=`<div class="section-label">LIBRARY MAINTENANCE</div><div class="card" style="margin-bottom:22px;"><b>Empty library</b><div class="profile-note">Advanced clearing options. History is preserved.</div><button class="btn btn-danger" style="margin-top:12px" onclick="App.emptyLibraryAdvanced()">Empty library…</button></div>`;
const dataIdx=html.indexOf('<div class="section-label">DATA</div>'); if(dataIdx>=0) html=html.slice(0,dataIdx)+themeCard+backupCard+linksCard+offlineCard+emptyCard+html.slice(dataIdx); else html+=themeCard+backupCard+linksCard+offlineCard+emptyCard;
  return html;
};


const _renderStatsV27Base=renderStats;
renderStats=function(){
  let h=_renderStatsV27Base();
  const heatYears=v119AvailableHeatmapYears();
  let heatYear=Number(S.statsHeatmapYear)||new Date().getFullYear();
  if(!heatYears.includes(heatYear)) heatYear=heatYears[0]||new Date().getFullYear();
  const heatOptions=heatYears.map(y=>`<option value="${y}" ${y===heatYear?'selected':''}>${y}</option>`).join('');
  const heat=`<div class="card" style="margin-bottom:24px;"><div class="section-label">CONSUMPTION HEATMAP · ${heatYear}</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;"><select onchange="App.setHeatmapYear(this.value)" style="max-width:150px;">${heatOptions}</select></div>${renderConsumptionHeatmap(heatYear)}<div class="hint" style="margin-top:10px;">Each square is one day. Intensity is based on minutes logged that day; corner markers show titles started and finished.</div></div>`;
  const recap=renderMonthlyRecap();
  const timeline=`<div class="card" style="margin-bottom:24px;"><div class="section-label">TITLE COMPLETION TIMELINE</div>${renderCompletionTimeline()}</div>`;
  h=h.replace('<div class="grid-3" style="margin-bottom:24px;">', heat+recap+'<div class="grid-3" style="margin-bottom:24px;">'); const pos=h.lastIndexOf('</div>'); return pos>0?h.slice(0,pos)+timeline+h.slice(pos):h+timeline;
};
Object.assign(App,{
  setRecapMonth(v){S.statsRecapMonth=String(v||'');render();},
  setHeatmapYear(v){S.statsHeatmapYear=String(v||'');render();}
});

Object.assign(App,{setPriorityChoice(id,value){const item=S.library.find(i=>i && i.id===id);if(!item || !['low','medium','high'].includes(value)) return;item.priority=value;S.modal=null;persistLibrary();render();},setLibraryStatus(id,value){const item=S.library.find(i=>i&&i.id===id);if(!item||!['planned','active','paused','completed','dropped'].includes(value))return;item.status=value;if(value==='completed'){item.completedAt=item.completedAt||Date.now();S.completionTimeline=S.completionTimeline||[];if(!S.completionTimeline.some(x=>x.libraryId===item.id))S.completionTimeline.push({libraryId:item.id,title:cleanTitle(item.title),categoryId:item.categoryId,completedAt:item.completedAt});}else if(value!=='completed'){item.completedAt=null;S.completionTimeline=(S.completionTimeline||[]).filter(x=>x.libraryId!==item.id);}normalizeSeasonalLibraryItems();S.modal=null;persistLibrary();render();},setLibraryCategory(id,value){const item=S.library.find(i=>i&&i.id===id);if(!item||!S.categories.some(c=>c.id===value))return;const old=item.categoryId;item.categoryId=value;normalizeSeasonalLibraryItems();S.modal=null;persistLibrary();render();},setThemeCollection(kind){const isPlatform=V55_PLATFORM_THEMES.includes(S.settings.theme||'dark');if(kind==='platform'&&!isPlatform){S.settings.theme='platform-anilist-dark';applyTheme(S.settings.theme);persistSettings();render();return;}if(kind==='mediaflow'&&isPlatform){S.settings.theme='dark';applyTheme('dark');persistSettings();render();return;}render();},setTheme(theme){S.settings.theme=theme;applyTheme(theme);persistSettings();render();},toggleBackup(){S.settings.backup.enabled=!S.settings.backup.enabled;persistSettings();restartBackupTimer();render();},updateBackup(k,v){S.settings.backup=S.settings.backup||{};S.settings.backup[k]=k==='interval'?Number(v):v;persistSettings();restartBackupTimer();render();},chooseBackupFolder:openBackupFolder,backupNow:()=>saveBackupNow(true),setMalLink(k,v){S.malLink=S.malLink||{username:'',mode:'anime'};S.malLink[k]=v;persistTask();},syncMAL:malSync,emptyLibraryAdvanced,confirmEmptyLibrary,deleteCloudAccount,choosePriority,chooseStatusForLibrary,chooseCategoryForLibrary,stopwatchStart,stopwatchPause,stopwatchSetTime,stopwatchReset,stopwatchClear,stopwatchUseMinutes});


// Add profile name to state and keep it local/cloud.
const _oldSnapshot=snapshot;
snapshot=function(){const x=_oldSnapshot();x.profileName=String(S.profileName||'').trim();return x;};
const _oldLoadAll=loadAll;
loadAll=async function(){await _oldLoadAll();const d=await rawGet(STATE_KEY);S.profileName=String(d?.profileName||'').trim();S.stopwatch=Object.assign({running:false,startedAt:0,elapsed:0,resetValue:0},d?.stopwatch||{});S.malLink=Object.assign({username:'',mode:'anime'},d?.malLink||{});S.xpLedger=Object.assign({libraryAdditions:{}},d?.xpLedger||{});
S.completionTimeline=Array.isArray(d?.completionTimeline)?d.completionTimeline:[];S.xpLedger.libraryAdditions=Object.assign({},d?.xpLedger?.libraryAdditions||{});initTheme();await restoreBackupFolder();restartBackupTimer();clearInterval(window.__sw);window.__sw=null;if(S.stopwatch.running)window.__sw=setInterval(stopwatchTick,250);};


