/* ============================================================
   MediaFlow v129 — Restored v1 Statistics
   Adds the original-style Category Balance, Recent Saturation,
   and Records cards alongside the modern Statistics dashboard.
   ============================================================ */

function v129SessionTime(s){
  const ts=Number(s?.timestamp)||0;
  if(ts>0)return ts;
  const raw=String(s?.date||'').slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
    const t=new Date(raw+'T12:00:00').getTime();
    return Number.isFinite(t)?t:0;
  }
  return 0;
}

function v129ConsumptionSessions(){
  return (S.sessions||[]).filter(s=>s && s.status!=='skipped');
}

function v129CategoryMinutes(catId,list){
  return (list||[]).filter(s=>String(s?.categoryId||'')===String(catId))
    .reduce((n,s)=>n+(Number(s?.minutes)||0),0);
}

function v129CategoryBalanceRows(){
  const cats=(S.categories||[]).filter(c=>c?.enabled);
  const cutoff=Date.now()-(7*24*60*60*1000);
  const recent=v129ConsumptionSessions().filter(s=>v129SessionTime(s)>=cutoff);
  const values=cats.map(c=>({cat:c,minutes:v129CategoryMinutes(c.id,recent)}));
  const max=Math.max(1,...values.map(x=>x.minutes));
  return values.map(x=>Object.assign(x,{pct:x.minutes>0?Math.max(2,Math.round((x.minutes/max)*100)):0}));
}

function v129SaturationRows(){
  return (S.categories||[]).filter(c=>c?.enabled).map(cat=>{
    let sat;
    try{sat=saturationLevel(cat);}catch(_){sat={label:'VERY LOW',c:'var(--flow)'};}
    return {cat,sat};
  });
}

function v129CategoryLifetime(){
  const sessions=v129ConsumptionSessions();
  return (S.categories||[]).filter(c=>c?.enabled).map(cat=>({
    cat,
    minutes:v129CategoryMinutes(cat.id,sessions),
    sessions:sessions.filter(s=>String(s?.categoryId||'')===String(cat.id))
  }));
}

function v129CategoryStreaks(){
  const rows=v129ConsumptionSessions()
    .filter(s=>s?.categoryId)
    .slice()
    .sort((a,b)=>v129SessionTime(a)-v129SessionTime(b));

  if(!rows.length)return {current:null,currentCount:0,longest:null,longestCount:0};

  let runCat=null,run=0,longestCat=null,longest=0;
  for(const s of rows){
    const cat=String(s.categoryId);
    if(cat===runCat)run++;
    else{runCat=cat;run=1;}
    if(run>longest){
      longest=run;
      longestCat=cat;
    }
  }

  let currentCat=String(rows[rows.length-1].categoryId),current=0;
  for(let i=rows.length-1;i>=0;i--){
    if(String(rows[i].categoryId)!==currentCat)break;
    current++;
  }

  return {
    current:getCategory(currentCat)||null,
    currentCount:current,
    longest:getCategory(longestCat)||null,
    longestCount:longest
  };
}

function v129MostNeglected(){
  const cats=(S.categories||[]).filter(c=>c?.enabled);
  const sessions=v129ConsumptionSessions();

  // Preserve the v1-style "never" behavior: the first enabled category
  // with no consumption history is immediately the most neglected.
  for(const cat of cats){
    const rows=sessions.filter(s=>String(s?.categoryId||'')===String(cat.id));
    if(!rows.length)return {cat,label:'never'};
  }

  let winner=null,oldest=Infinity;
  for(const cat of cats){
    const last=Math.max(...sessions
      .filter(s=>String(s?.categoryId||'')===String(cat.id))
      .map(v129SessionTime)
      .filter(Boolean));
    if(last<oldest){oldest=last;winner=cat;}
  }

  if(!winner)return {cat:null,label:'—'};
  const days=Math.max(0,Math.floor((Date.now()-oldest)/86400000));
  return {cat:winner,label:days===0?'today':days===1?'1 day ago':`${days.toLocaleString()} days ago`};
}

function v129AverageDailyConsumption(){
  const rows=v129ConsumptionSessions();
  if(!rows.length)return 0;
  const days=new Set();
  let minutes=0;
  for(const s of rows){
    const key=(typeof v119SessionDateKey==='function'?v119SessionDateKey(s):String(s.date||'').slice(0,10));
    if(key)days.add(key);
    minutes+=Number(s.minutes)||0;
  }
  return days.size?Math.round(minutes/days.size):0;
}

function v129TaskCompletionRate(){
  // v1's completion-rate concept applies to scheduler-assigned tasks.
  // Mixed-category companion records and Batch Log entries are not counted
  // as separate assigned tasks.
  const tasks=v129ConsumptionSessions().filter(s=>
    ['partial','complete','over'].includes(String(s?.status||'')) &&
    (s.followedAssignedCategory!==false)
  );
  if(!tasks.length)return 0;
  const completed=tasks.filter(s=>s.status==='complete'||s.status==='over').length;
  return Math.round((completed/tasks.length)*100);
}

function v129ClassicStatsHtml(){
  const balance=v129CategoryBalanceRows();
  const lifetime=v129CategoryLifetime();
  const life=totalsForSessions(v129ConsumptionSessions());

  const most=lifetime.length
    ? lifetime.slice().sort((a,b)=>b.minutes-a.minutes)[0]
    : null;

  // On tied minimum values, choose the later category. This reproduces
  // the old v1 card's useful behavior when several categories are at 0m.
  let least=null;
  for(const x of lifetime){
    if(!least || x.minutes<=least.minutes)least=x;
  }

  const streak=v129CategoryStreaks();
  const neglected=v129MostNeglected();
  const avgDaily=v129AverageDailyConsumption();
  const completionRate=v129TaskCompletionRate();

  const balanceRows=balance.map(({cat,minutes,pct})=>`
    <div class="v129-balance-row">
      <div class="v129-balance-name"><span>${v144CategoryIconHtml(cat)}</span><span>${escapeHtml(cat.name||'Category')}</span></div>
      <div class="v129-balance-track"><div class="v129-balance-fill" style="width:${pct}%;background:${cat.color||'var(--flow)'}"></div></div>
      <div class="v129-balance-value">${fmtMinutes(minutes)}</div>
    </div>`).join('');

  const saturationRows=v129SaturationRows().map(({cat,sat})=>`
    <div class="v129-saturation-row">
      <div class="v129-saturation-name"><span>${v144CategoryIconHtml(cat)}</span><span>${escapeHtml(cat.name||'Category')}</span></div>
      <span class="v129-saturation-badge" style="color:${sat.c};background:color-mix(in srgb, ${sat.c} 11%, var(--panel-raised))">${escapeHtml(sat.label)}</span>
    </div>`).join('');

  const catText=x=>x?.cat
    ? `${v144CategoryIconHtml(x.cat)} ${escapeHtml(x.cat.name||'Category')} — ${fmtMinutes(x.minutes)}`
    : '—';
  const streakText=(cat,count)=>cat
    ? `${v144CategoryIconHtml(cat)} ${escapeHtml(cat.name||'Category')} × ${Number(count)||0}`
    : '—';
  const neglectedText=neglected?.cat
    ? `${v144CategoryIconHtml(neglected.cat)} ${escapeHtml(neglected.cat.name||'Category')} — ${escapeHtml(neglected.label)}`
    : '—';

  const lifetimeBits=[
    `${fmtMinutes(life.minutes)}`,
    `${Number(life.episodes||0).toLocaleString()} ep`,
    `${Number(life.chapters||0).toLocaleString()} ch`,
    `${Number(life.movies||0).toLocaleString()} mv`,
    `${Number(life.issues||0).toLocaleString()} is`
  ];

  return `
    <section class="v130-classic-stats-section">
    <div class="v129-classic-stats-grid">
      <div class="card v129-classic-card">
        <div class="section-label">CATEGORY BALANCE — LAST 7 DAYS</div>
        <div class="v129-balance-list">${balanceRows||'<div class="empty-state">No enabled categories.</div>'}</div>
      </div>
      <div class="card v129-classic-card">
        <div class="section-label">RECENT SATURATION</div>
        <div class="v129-saturation-list">${saturationRows||'<div class="empty-state">No enabled categories.</div>'}</div>
      </div>
    </div>
    <div class="card v129-records" style="margin-bottom:24px">
      <div class="section-label">RECORDS</div>
      <div class="record-list">
        <div class="record-row"><span class="k">Most consumed category</span><span class="v">${catText(most)}</span></div>
        <div class="record-row"><span class="k">Least consumed category</span><span class="v">${catText(least)}</span></div>
        <div class="record-row"><span class="k">Current category streak</span><span class="v">${streakText(streak.current,streak.currentCount)}</span></div>
        <div class="record-row"><span class="k">Longest streak ever</span><span class="v">${streakText(streak.longest,streak.longestCount)}</span></div>
        <div class="record-row"><span class="k">Most neglected category</span><span class="v">${neglectedText}</span></div>
        <div class="record-row"><span class="k">Average daily consumption</span><span class="v">${fmtMinutes(avgDaily)}</span></div>
        <div class="record-row"><span class="k">Average task completion rate</span><span class="v">${completionRate}%</span></div>
        <div class="record-row"><span class="k">Total lifetime</span><span class="v v129-records-total">${lifetimeBits.join(' · ')}</span></div>
      </div>
    </div>
    </section>`;
}

const v129StatsBase=renderStats;
renderStats=function(){
  let h=v129StatsBase();
  const classic=v129ClassicStatsHtml();

  // Keep every modern Statistics card. Insert the restored v1 section near
  // the end, before Ratings/Completion Timeline when those cards are present.
  const ratingMarker='<div class="card" style="margin-bottom:24px"><div class="section-label">RATINGS</div>';
  const timelineMarker='<div class="card" style="margin-bottom:24px;"><div class="section-label">TITLE COMPLETION TIMELINE</div>';
  let p=h.indexOf(ratingMarker);
  if(p<0)p=h.indexOf(timelineMarker);
  if(p>=0)return h.slice(0,p)+classic+h.slice(p);
  return h+classic;
};


