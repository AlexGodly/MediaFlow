/* MediaFlow v201 source fragment
 * Statistics view
 * Original HTML lines 9267-9448.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   VIEW: STATS

   ============================================================ */

function renderStats(){

  const today = totalsForSessions(todaysSessions());

  const week = totalsForSessions(sessionsInRange(7));

  const month = totalsForSessions(sessionsInRange(30));

  const lifetime = totalsForSessions(S.sessions);

  const cats = S.categories.filter(c=>c.enabled);

  const weekMinutesByCat = cats.map(c=>({c, m: sessionsInRange(7).filter(s=>s.categoryId===c.id && s.status!=='skipped').reduce((a,s)=>a+s.minutes,0)}));

  const maxW = Math.max(1, ...weekMinutesByCat.map(x=>x.m));

   const balanceHtml = weekMinutesByCat.map(({c,m})=>`

    <div class="bal-bar-row">

      <div class="bal-bar-label">${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</div>

      <div class="bal-bar-track"><div class="bal-bar-fill" style="width:${Math.round(m/maxW*100)}%; background:${c.color};"></div></div>

      <div class="bal-bar-val">${fmtMinutes(m)}</div>

    </div>`).join('');

  const satHtml = cats.map(c=>{

    const lvl = saturationLevel(c);

    return `<div class="sat-row">

      <div class="sat-cat">${v144CategoryIconHtml(c)} ${escapeHtml(c.name)}</div>

      <div class="sat-lvl" style="color:${lvl.c}; background:${lvl.c}20;">${lvl.label}</div>

    </div>`;

  }).join('');

  // records

  const lifetimeByCat = cats.map(c=>({c, m: S.sessions.filter(s=>s.categoryId===c.id && s.status!=='skipped').reduce((a,s)=>a+s.minutes,0)}));

  lifetimeByCat.sort((a,b)=>b.m-a.m);

  const most = lifetimeByCat[0];

  const least = lifetimeByCat[lifetimeByCat.length-1];

  const neglect = cats.map(c=>{

    const last = lastSessionFor(c.id);

    return {c, d: daysSince(last?last.timestamp:null)};

  }).sort((a,b)=>b.d-a.d)[0];

  // current streak

  const chron = [...S.sessions].filter(s=>s.status!=='skipped').sort((a,b)=>b.timestamp-a.timestamp);

  let curStreakCat=null, curStreakLen=0;

  if(chron.length){ curStreakCat=chron[0].categoryId; for(const s of chron){ if(s.categoryId===curStreakCat) curStreakLen++; else break; } }

  // longest streak ever

  const chronAsc = [...S.sessions].filter(s=>s.status!=='skipped').sort((a,b)=>a.timestamp-b.timestamp);

  let longest={cat:null,len:0}, run={cat:null,len:0};

  for(const s of chronAsc){

    if(s.categoryId===run.cat) run.len++;

    else run={cat:s.categoryId, len:1};

    if(run.len>longest.len) longest={cat:run.cat, len:run.len};

  }

  const distinctDays = new Set(S.sessions.filter(s=>s.status!=='skipped').map(s=>s.date)).size || 1;

  const avgDailyMinutes = Math.round(lifetime.minutes/distinctDays);

  const nonSkipped = S.sessions.filter(s=>s.status!=='skipped').length;

  const completedOrOver = S.sessions.filter(s=>s.status==='complete'||s.status==='over').length;

  const avgCompletion = nonSkipped>0 ? Math.round(completedOrOver/nonSkipped*100) : 0;

   return `

    <div class="view-head"><div><div class="view-title">Statistics</div><div class="view-desc">Your consumption, measured.</div></div></div>

    <div class="grid-3" style="margin-bottom:24px;">

      ${statCard('Today', today)}

      ${statCard('This week', week)}

      ${statCard('This month', month)}

    </div>

    <div class="two-col" style="margin-bottom:24px;">

      <div class="card">

        <div class="section-label">CATEGORY BALANCE — LAST 7 DAYS</div>

        ${balanceHtml || '<div class="empty-state">No data yet.</div>'}

      </div>

      <div class="card">

        <div class="section-label">RECENT SATURATION</div>

        <div class="sat-grid">${satHtml || '<div class="empty-state">No categories enabled.</div>'}</div>

      </div>

    </div>

    <div class="card">

      <div class="section-label">RECORDS</div>

      <div class="record-list">

        <div class="record-row"><span class="k">Most consumed category</span><span class="v">${most? v144CategoryIconHtml(most.c)+' '+escapeHtml(most.c.name)+' — '+fmtMinutes(most.m) : '—'}</span></div>

        <div class="record-row"><span class="k">Least consumed category</span><span class="v">${least? v144CategoryIconHtml(least.c)+' '+escapeHtml(least.c.name)+' — '+fmtMinutes(least.m) : '—'}</span></div>

        <div class="record-row"><span class="k">Current category streak</span><span class="v">${curStreakCat? getCategory(curStreakCat).icon+' '+getCategory(curStreakCat).name+' × '+curStreakLen : '—'}</span></div>

        <div class="record-row"><span class="k">Longest streak ever</span><span class="v">${longest.cat? getCategory(longest.cat).icon+' '+getCategory(longest.cat).name+' × '+longest.len : '—'}</span></div>

        <div class="record-row"><span class="k">Most neglected category</span><span class="v">${neglect && isFinite(neglect.d)? v144CategoryIconHtml(neglect.c)+' '+escapeHtml(neglect.c.name)+' — '+Math.floor(neglect.d)+'d' : (neglect? v144CategoryIconHtml(neglect.c)+' '+escapeHtml(neglect.c.name)+' — never':'—')}</span></div>

        <div class="record-row"><span class="k">Average daily consumption</span><span class="v">${fmtMinutes(avgDailyMinutes)}</span></div>

        <div class="record-row"><span class="k">Average task completion rate</span><span class="v">${avgCompletion}%</span></div>

        <div class="record-row"><span class="k">Total lifetime</span><span class="v">${fmtMinutes(lifetime.minutes)} · ${lifetime.episodes} ep · ${lifetime.chapters} ch · ${lifetime.movies} mv · ${lifetime.issues} is</span></div>

      </div>

    </div>

  `;

}

function statCard(label, t){

  return `<div class="stat-box">

    <div class="lbl" style="margin-bottom:8px;">${label}</div>

    <div class="num" style="font-size:20px;">${fmtMinutes(t.minutes)}</div>

    <div style="font-size:12px; color:var(--text-dim); margin-top:6px; line-height:1.7;">

      ${t.episodes} episodes · ${t.chapters} chapters<br>${t.movies} movies · ${t.issues} issues

    </div>

  </div>`;

}
