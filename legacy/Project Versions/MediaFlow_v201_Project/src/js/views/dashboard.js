/* MediaFlow v201 source fragment
 * Dashboard view
 * Original HTML lines 8243-8618.
 * Build order matters; see scripts/build.mjs.
 */

/* ============================================================

   VIEW: DASHBOARD

   ============================================================ */

function renderDashboard(){

  const today = todaysSessions();

  const totals = totalsForSessions(today);

  const st = S.settings;

  const minutesPct = clamp(Math.round(totals.minutes/st.dailyMinutes*100),0,100);

  const tasksPct = clamp(Math.round(totals.tasks/st.tasksPerDay*100),0,100);

  let heroHtml;

  if(!S.sessionActive || !S.currentTask){

     heroHtml = `

      <div class="hero">

        <div class="hero-eyebrow">Ready when you are</div>

        <div class="hero-cat" style="margin-top:14px;">

          <div class="hero-icon" style="background:rgba(232,169,74,.14); color:var(--flow);">▶</div>

          <div>

            <div class="hero-name">Start a session</div>

            <div class="hero-amount">MediaFlow will hand you one category at a time — you pick the titles.</div>

          </div>

        </div>

        <div class="hero-actions">

          <button class="btn btn-primary" onclick="App.startSession()">Start Session</button>

        </div>

      </div>`;

  } else {

    const t = S.currentTask;

    const cat = getCategory(t.categoryId);

    const amountStr = t.low===t.high ? `${t.low} ${unitLabel(t.unit,t.low)}` : `${t.low}–${t.high} ${unitLabel(t.unit,t.high)}`;

     heroHtml = `

      <div class="hero">

        <div class="hero-eyebrow">Next task</div>

        <div class="hero-cat">

          <div class="hero-icon" style="background:${cat.color}22; color:${cat.color};">${v144CategoryIconHtml(cat)}</div>

          <div>

            <div class="hero-name">${escapeHtml(cat.name)}</div>

          </div>

        </div>

        <div class="hero-amount">Consume <b>${amountStr}</b></div>

        ${S.settings.exactTitleRecommendations ? (t.title ? `<div class="hero-note">MediaFlow recommends: <b>${escapeHtml(t.title)}</b></div>` : `<div class="hero-note">No eligible title found in this category. Add one to your Library.</div>`) : `<div class="hero-note">You choose the titles — pick whatever you're in the mood for.</div>`}

        <div class="hero-reasons">

          ${t.reasons.map(r=>`<span class="pill">${escapeHtml(r)}</span>`).join('')}

        </div>

         ${S.logging ? renderLogForm(t,cat) : `

        <div class="hero-actions">

          <button class="btn btn-primary" onclick="App.openLogForm()">Log &amp; Complete</button>

          <button class="btn" onclick="App.rotateTask()">Give me something else</button>

          <button class="btn btn-ghost" onclick="App.skipTask()">Skip</button>

          <button class="btn btn-ghost" onclick="App.endSession()">End session</button>

        </div>

        <button class="link-btn" style="margin-top:14px;" onclick="App.toggleReasonDetail()">${S.showReasonDetail?'Hide':'Why this pick?'}</button>

        ${S.showReasonDetail ? renderReasonDetail(cat) : ''}

        `}

      </div>`;

  }

  const cats = (typeof v186ScopeCategories==='function'?v186ScopeCategories('todayBalance'):S.categories.filter(c=>c.enabled));

   const balanceHtml = cats.length===0 ? `<div class="empty-state"><div class="em-icon">🗂️</div><div class="em-title">No categories selected</div><div>Choose categories in Settings → Dashboard Settings.</div></div>` : `

    <div class="balance-list">

      ${cats.map(cat=>{

        const amt = today.filter(s=>s.categoryId===cat.id && s.status!=='skipped').reduce((a,s)=>a+s.actualAmount,0);

        const todayStatus = categoryStatus(cat);

        const overallStatus = overallCategoryStatus(cat);

        const labelMap = {healthy:'Healthy', neglected:'Neglected', overused:'Overused', due:'Due'};

        return `<div class="balance-row">

          <div class="bal-icon" style="background:${cat.color}22; color:${cat.color};">${v144CategoryIconHtml(cat)}</div>

          <div class="bal-name">${escapeHtml(cat.name)}</div>

          <div class="bal-amt">${amt} ${unitLabel(cat.unit,amt)} today</div>

          <div class="status-badge status-${todayStatus}" title="Based on recent 72-hour consumption">Today: ${labelMap[todayStatus]}</div>

          <div class="status-badge status-${overallStatus}" title="Based on all recorded consumption from the first ever log to the last ever log">Overall: ${labelMap[overallStatus]}</div>

          <div class="health-action">${escapeHtml(categoryStatusActionSummary(cat, todayStatus, overallStatus))}</div>

        </div>`;

      }).join('')}

    </div>
    <div class="health-note">Today status reflects the last 72 hours. Overall status uses all recorded consumption from the first ever log to the last ever log.</div>`;

   return `

    <div class="view-head">

      <div>

        <div class="view-title">Today</div>

        <div class="view-desc">${new Date().toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'})}</div>

      </div>

    </div>

    <div class="today-strip">

      <div class="stat-box">

        <div class="num">${totals.tasks} / ${st.tasksPerDay}</div>

        <div class="lbl">tasks complete</div>

        <div class="progress-track"><div class="progress-fill" style="width:${tasksPct}%"></div></div>

      </div>

      <div class="stat-box">

        <div class="num">${fmtMinutes(totals.minutes)} / ${fmtMinutes(st.dailyMinutes)}</div>

        <div class="lbl">time invested</div>

        <div class="progress-track"><div class="progress-fill" style="width:${minutesPct}%"></div></div>

      </div>

      <div class="stat-box">

        <div class="num">${computeDayStreak()}</div>

        <div class="lbl">day streak</div>

      </div>

    </div>

    ${heroHtml}
    ${stopwatchHtml()}

    <div style="display:flex; align-items:center; justify-content:space-between;">

      <div class="section-label">TODAY'S BALANCE</div>

      ${S.sessions.length? `<button class="link-btn" onclick="App.undoLastEntry()">↺ Undo last entry</button>` : ''}

    </div>

    <div class="card">${balanceHtml}</div>

  `;

}

function renderReasonDetail(cat){

  return `<div class="reason-explain">

    The scheduler blends this category's weight, how long it's been neglected, whether it's time-sensitive (seasonal), how often it's shown up in your last few tasks, and how much you've already consumed of it recently — plus a little randomness so the rotation doesn't feel scripted. Right now <b>${escapeHtml(cat.name)}</b> scored highest among enabled categories.

  </div>`;

}

function renderLogForm(t, cat){

  // Logging can pick from the entire Library. The current task still determines
  // the session category, while the selected Library entry determines which
  // title's progress gets updated. This lets you log Manga, Manhwa, TV, Movies,
  // Anime, and custom categories from the same form.
  const libOptions = S.library.filter(i=>i && i.status!=='dropped');

  const entries = S.logDraft.entries||[];

  const total = entriesTotal(entries);

  return `<div class="log-form">

    <label class="field-label">Titles consumed</label>

    <div style="display:flex; gap:8px; margin-bottom:8px;">

      <input type="text" id="entry-title" placeholder="Type a title, or pick from your library"

        value="${escapeHtml(S.entryDraft.title)}" oninput="App.updateEntryDraft('title', this.value)"

        onkeydown="if(event.key==='Enter'){event.preventDefault(); App.addLogEntry();}" style="flex:1;">

      <input type="number" id="entry-qty" min="1" value="${S.entryDraft.qty}" oninput="App.updateEntryDraft('qty', this.value)" style="width:74px;">

      <button class="btn btn-sm" onclick="App.addLogEntry()">+ Add</button>

    </div>

    <div id="log-suggestions" class="log-suggestions"></div>

     ${entries.length===0 ? `<small class="hint">Add one or more — e.g. "One Piece" ×1, "Detective Conan" ×3. Matches in your Library get suggested as you type.</small>` : `

    <div style="display:flex; flex-wrap:wrap; gap:6px; margin:8px 0;">

      ${entries.map((e,idx)=>{

        const matched = e.libraryId || findLibraryMatch(cat.id, e.title);

        return `<span class="pill" style="gap:7px;">${matched?'📚 ':''}${escapeHtml(e.title)}${e.qty>1?' ×'+e.qty:''}${e.isRepeat?' <span style="color:var(--flow);font-weight:800">↻ Rewatch/Reread</span>':''}

          <button class="link-btn" style="color:var(--overused); text-decoration:none;" onclick="App.removeLogEntry(${idx})">✕</button></span>`;

      }).join('')}

    </div>

    ${entries.filter(e=>e.isNew).map(e=>{
      const idx=entries.indexOf(e);
      const item=e.libraryId?S.library.find(i=>i.id===e.libraryId):null;
      if(!item) return '';
      return `
        <div class="new-entry-box">
          <div class="new-entry-head">
            <div class="new-entry-title">📚 New library entry</div>
            <div class="new-entry-badge">Added automatically</div>
          </div>
          <div class="new-entry-grid">
            <div class="field">
              <label class="field-label">Title</label>
              <input type="text" value="${escapeHtml(item.title)}" onchange="App.updateLogEntryDetail(${idx},'title',this.value)">
            </div>
            <div class="field">
              <label class="field-label">Current progress</label>
              <input type="number" min="0" value="${item.progress||0}" onchange="App.updateLogEntryDetail(${idx},'progress',this.value)">
            </div>
            <div class="field">
              <label class="field-label">Total (optional)</label>
              <input type="number" min="0" value="${item.total??''}" placeholder="Unknown" onchange="App.updateLogEntryDetail(${idx},'total',this.value)">
            </div>
            <div class="field">
              <label class="field-label">Status</label>
              <select onchange="App.updateLogEntryDetail(${idx},'status',this.value)">
                ${['planned','active','paused','completed','dropped'].map(s=>`<option value="${s}" ${item.status===s?'selected':''}>${v199StatusLabel(s)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field-label">Priority</label>
              <select onchange="App.updateLogEntryDetail(${idx},'priority',this.value)">
                ${['low','medium','high'].map(s=>`<option value="${s}" ${item.priority===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field-label">Estimated minutes</label>
              <input type="number" min="0" value="${item.estimatedMinutes??''}" placeholder="Optional" onchange="App.updateLogEntryDetail(${idx},'estimatedMinutes',this.value)">
            </div>
            <div class="field" style="grid-column:1/-1;">
              <label class="field-label">Tags</label>
              <input type="text" value="${escapeHtml((item.tags||[]).join(', '))}" placeholder="e.g. shonen, backlog" onchange="App.updateLogEntryDetail(${idx},'tags',this.value)">
            </div>
          </div>
          <div class="new-entry-note">This title is already in your Library. Saving this log will also add the consumed quantity to its progress.</div>
        </div>`;
    }).join('')}

    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">

      <small class="hint" style="margin:0;">Total from titles: <b style="color:var(--text);">${total}</b> ${unitLabel(t.unit,total)}</small>

      <button class="link-btn" onclick="App.syncAmountFromEntries()">Use as amount</button>

    </div>

    <label style="display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--text-dim); margin-bottom:10px;">

      <input type="checkbox" ${S.logDraft.updateLibrary?'checked':''} onchange="App.toggleUpdateLibrary(this.checked)">

      Update Library progress automatically

    </label>`}

    <div class="field-row">

      <div class="field">

        <label class="field-label">Actual amount (${unitLabel(t.unit,2)})</label>

        <input type="number" min="0" id="log-amount" value="${S.logDraft.amount}" oninput="App.updateLogDraft('amount', this.value)">

        <small class="hint">Suggested: ${t.low===t.high? t.low : t.low+'–'+t.high}. More or less is fine.</small>

      </div>

      <div class="field">

        <label class="field-label">Minutes spent</label>

        <input type="number" min="0" id="log-minutes" value="${S.logDraft.minutes}" oninput="App.updateLogDraft('minutes', this.value)">

      </div>

    </div>

    <div id="xp-preview" style="margin:10px 0 14px;padding:11px 13px;border:1px solid var(--border-soft);background:var(--panel-raised);border-radius:10px;color:var(--flow);line-height:1.45;">${(()=>{const x=estimateCurrentLogXP();return `<div><b>+${x.xp.toLocaleString()} XP</b> for this log</div><small style="color:var(--text-mute)">${escapeHtml(x.label)} · ${x.base.toLocaleString()} base × ${x.multiplier} rotation × ${Number(x.streakMultiplier||1).toFixed(2)} streak (${Number(x.streak||0)}d)</small>`})()}</div>

    <div class="field">

      <label class="field-label">Anything else to note? (optional)</label>

      <input type="text" id="log-note" placeholder="e.g. binged the season finale" value="${escapeHtml(S.logDraft.note||'')}" oninput="App.updateLogDraft('note', this.value)">

    </div>

    <div class="hero-actions">

      <button class="btn btn-primary" onclick="App.submitLog()">Save &amp; get next task</button>

      <button class="btn btn-ghost" onclick="App.cancelLogForm()">Cancel</button>

    </div>

  </div>`;

}
