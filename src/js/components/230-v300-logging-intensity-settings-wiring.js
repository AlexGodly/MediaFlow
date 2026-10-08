

/* ============================================================
   MediaFlow v300 — Logging Intensity Wiring Repair & Settings Restoration
   ============================================================ */
(()=>{
  const V299_LEVELS={
    1:{label:'LV 1',name:'Normal mode',desc:'Default logging experience with every logging action available.',defaultXP:1},
    2:{label:'LV 2',name:'No title rerolls',desc:'Reroll title is disabled, but the rest of the flow stays normal.',defaultXP:2},
    3:{label:'LV 3',name:'Locked category choice',desc:'Reroll title and Give me something else are disabled.',defaultXP:3},
    4:{label:'LV 4',name:'No skipping',desc:'Reroll title, Give me something else, and Skip are disabled.',defaultXP:4},
    5:{label:'LV 5',name:'Recommendation only',desc:'Everything from Level 4 plus recommended-title-only logging when exact recommendations are enabled.',defaultXP:5}
  };

  function v299ClampLevel(value){
    const n=Math.max(1,Math.min(5,Math.round(Number(value)||1)));
    return Number.isFinite(n)?n:1;
  }
  function v299NumberOr(value,fallback){
    const n=Number(value);
    return Number.isFinite(n)&&n>=0?n:fallback;
  }
  function v299NormalizeIntensity(raw){
    const src=(raw&&typeof raw==='object')?raw:{};
    const xpSrc=(src.xpMultipliers&&typeof src.xpMultipliers==='object')?src.xpMultipliers:{};
    const xpMultipliers={};
    for(let level=1; level<=5; level++){
      xpMultipliers[String(level)]=v299NumberOr(xpSrc[String(level)] ?? xpSrc[level], V299_LEVELS[level].defaultXP);
    }
    return {
      level:v299ClampLevel(src.level),
      xpMultipliers,
      modifiedAt:Math.max(0,Number(src.modifiedAt)||0)
    };
  }
  function v299EnsureIntensitySettings(settings=S.settings){
    settings=settings&&typeof settings==='object'?settings:{};
    settings.v299LoggingIntensity=v299NormalizeIntensity(settings.v299LoggingIntensity);
    return settings.v299LoggingIntensity;
  }
  DEFAULT_SETTINGS.v299LoggingIntensity=v299NormalizeIntensity(DEFAULT_SETTINGS.v299LoggingIntensity);
  v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS);

  const v299NormalizeDashboardBase=v192NormalizeDashboardSettings;
  v192NormalizeDashboardSettings=function(raw){
    const out=v299NormalizeDashboardBase(raw);
    out.showLoggingIntensity=raw?.showLoggingIntensity!==false;
    return out;
  };
  v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  DEFAULT_SETTINGS.v192Dashboard=v192NormalizeDashboardSettings(DEFAULT_SETTINGS.v192Dashboard);

  function v299CurrentIntensity(){ return v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS); }
  function v299CurrentLevel(){ return v299ClampLevel(v299CurrentIntensity().level); }
  function v299LevelMeta(level=v299CurrentLevel()){
    const n=v299ClampLevel(level);
    const st=v299CurrentIntensity();
    return Object.assign({},V299_LEVELS[n],{level:n,xpMultiplier:v299NumberOr(st.xpMultipliers[String(n)],V299_LEVELS[n].defaultXP)});
  }
  function v299DashboardCfg(){ return v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS); }
  function v299RecommendationOnlyApplies(task=S.currentTask){
    return v299CurrentLevel()===5 && !!S.settings?.exactTitleRecommendations && !!task && !!(String(task.title||'').trim() || String(task.libraryId||'').trim());
  }
  function v299RerollEscapeActive(task=S.currentTask){
    const target=Math.max(0,Number(task?.targetMid ?? task?.high ?? task?.low ?? 0));
    if(!v299RecommendationOnlyApplies(task) || target<=1) return false;
    const item=(S.library||[]).find(i=>String(i?.id||'')===String(task?.libraryId||'')) || (S.library||[]).find(i=>cleanTitle(i?.title||'')===cleanTitle(task?.title||''));
    if(!item || !Number.isFinite(Number(item.total)) || Number(item.total)<=0)return false;
    const remaining=Math.max(0,Number(item.total)-(Number(item.progress)||0));
    return remaining<target;
  }
  function v299CanUseTitleReroll(task=S.currentTask){
    const level=v299CurrentLevel();
    if(level<2) return true;
    if(level===5 && v299RerollEscapeActive(task)) return true;
    return false;
  }
  function v299CanUseSomethingElse(){ return v299CurrentLevel()<3; }
  function v299CanSkip(){ return v299CurrentLevel()<4; }
  function v299RestrictionPills(level=v299CurrentLevel(), task=S.currentTask){
    const pills=[];
    const meta=v299LevelMeta(level);
    pills.push(`${meta.label} · ×${meta.xpMultiplier} XP`);
    if(level>=2) pills.push('Reroll title disabled');
    if(level>=3) pills.push('Give me something else disabled');
    if(level>=4) pills.push('Skip disabled');
    if(level===5){
      if(v299RecommendationOnlyApplies(task)) pills.push('Recommended title only');
      else pills.push('Behaves like Level 4 until title recommendations are enabled');
      if(v299RerollEscapeActive(task)) pills.push('Reroll title available when the recommended title cannot meet the target');
    }
    if(level===1) pills.push('Everything enabled');
    return pills;
  }
  function v299RestrictionText(level=v299CurrentLevel(), task=S.currentTask){
    const meta=v299LevelMeta(level);
    if(level===1) return meta.desc;
    if(level===5 && !S.settings?.exactTitleRecommendations) return 'Exact title recommendations are disabled in Settings, so Level 5 currently behaves like Level 4.';
    if(level===5 && v299RerollEscapeActive(task)) return 'Recommended-title-only mode is active, but Reroll title stays available when this task needs more than 1 unit.';
    return meta.desc;
  }
  function v299TitleRerollDisabledReason(task=S.currentTask){
    const level=v299CurrentLevel();
    if(level<2) return '';
    if(level===5 && v299RerollEscapeActive(task)) return '';
    if(level===5 && !S.settings?.exactTitleRecommendations) return 'Level 5 behaves like Level 4 until exact title recommendations are enabled in Settings.';
    return `Logging Intensity ${v299LevelMeta(level).label} disables Reroll title.`;
  }
  function v299SomethingElseDisabledReason(){
    const level=v299CurrentLevel();
    return level>=3 ? `Logging Intensity ${v299LevelMeta(level).label} disables Give me something else.` : '';
  }
  function v299SkipDisabledReason(){
    const level=v299CurrentLevel();
    return level>=4 ? `Logging Intensity ${v299LevelMeta(level).label} disables Skip.` : '';
  }
  function v299RecommendedTitle(){ return cleanTitle(S.currentTask?.title||'').trim(); }
  function v299RecommendedLibraryId(){ return S.currentTask?.libraryId || findLibraryMatch(S.currentTask?.categoryId||'', v299RecommendedTitle())?.id || null; }
  function v299SyncEntryDraftToRecommendation(){
    if(!v299RecommendationOnlyApplies()) return;
    const title=v299RecommendedTitle();
    if(!title) return;
    S.entryDraft=S.entryDraft&&typeof S.entryDraft==='object'?S.entryDraft:{};
    S.entryDraft.title=title;
    S.entryDraft.libraryId=v299RecommendedLibraryId();
    S.entryDraft.qty=Math.max(1,Number(S.entryDraft.qty)||1);
  }
  function v299SetButtonState(btn,enabled,reason){
    if(!btn) return;
    btn.disabled=!enabled;
    btn.classList.toggle('v299-is-disabled',!enabled);
    btn.setAttribute('aria-disabled', enabled ? 'false':'true');
    if(reason) btn.setAttribute('title',reason); else btn.removeAttribute('title');
  }
  function v299SliderStopsHtml(activeLevel,currentTask){
    return [1,2,3,4,5].map(level=>{
      const meta=v299LevelMeta(level);
      return `<button type="button" class="v299-stop ${activeLevel===level?'active':''}" onclick="App.v299SetLoggingIntensityLevel(${level})"><span class="v299-stop-dot"></span><span class="v299-stop-label">${meta.label}</span></button>`;
    }).join('');
  }
  function v299DashboardIntensityHtml(){
    const cfg=v299DashboardCfg();
    if(cfg.showLoggingIntensity===false) return '';
    const level=v299CurrentLevel();
    const meta=v299LevelMeta(level);
    const pills=v299RestrictionPills(level,S.currentTask).map(text=>`<span class="v299-pill">${escapeHtml(text)}</span>`).join('');
    return `<div class="card v299-intensity-card">
      <div class="v299-intensity-head">
        <div>
          <div class="section-label">LOGGING INTENSITY</div>
          <div class="v299-intensity-title">${escapeHtml(meta.name)}</div>
          <div class="hint">Simple control for how strict the current logging session should be.</div>
        </div>
        <div class="v299-intensity-badge">×${escapeHtml(String(meta.xpMultiplier))} XP</div>
      </div>
      <div class="v299-intensity-slider-wrap">
        <input class="v299-intensity-slider" type="range" min="1" max="5" step="1" value="${level}" oninput="App.v299SetLoggingIntensityLevel(this.value)">
        <div class="v299-stops-row">${v299SliderStopsHtml(level,S.currentTask)}</div>
      </div>
      <div class="v299-intensity-desc">${escapeHtml(v299RestrictionText(level,S.currentTask))}</div>
      <div class="v299-pills">${pills}</div>
    </div>`;
  }
  function v299SettingsSliderCardHtml(){
    const level=v299CurrentLevel();
    const meta=v299LevelMeta(level);
    const pills=v299RestrictionPills(level,S.currentTask).map(text=>`<span class="v299-pill">${escapeHtml(text)}</span>`).join('');
    return `<div class="card v299-settings-intensity-card">
      <div class="v299-settings-card-head">
        <div>
          <div style="font-weight:800;">Current logging intensity</div>
          <div class="hint">Move the slider to change the active level. This is the same level shown above the Next Task card on Dashboard.</div>
        </div>
        <div class="v299-intensity-badge">×${escapeHtml(String(meta.xpMultiplier))} XP</div>
      </div>
      <div class="v299-intensity-title" style="margin-top:6px;">${escapeHtml(meta.label)} · ${escapeHtml(meta.name)}</div>
      <div class="v299-intensity-slider-wrap" style="margin-top:14px;">
        <input class="v299-intensity-slider" type="range" min="1" max="5" step="1" value="${level}" oninput="App.v299SetLoggingIntensityLevel(this.value)">
        <div class="v299-stops-row">${v299SliderStopsHtml(level,S.currentTask)}</div>
      </div>
      <div class="v299-intensity-desc">${escapeHtml(v299RestrictionText(level,S.currentTask))}</div>
      <div class="v299-pills">${pills}</div>
      <div class="hint" style="margin-top:12px;">Dashboard visibility is controlled in Dashboard Settings → Dashboard sections, under On This Day.</div>
    </div>`;
  }
  function v299IntensityXpSettingsHtml(){
    const cfg=v299CurrentIntensity();
    const input=(level)=>`<div class="field"><label class="field-label">${V299_LEVELS[level].label} XP multiplier</label><input type="number" min="0" step="0.1" value="${cfg.xpMultipliers[String(level)]}" onchange="App.v299UpdateIntensityMultiplier(${level},this.value)"><small class="hint">${escapeHtml(V299_LEVELS[level].name)}</small></div>`;
    return `<div class="card v299-intensity-xp-card" style="margin-bottom:22px;">
      <div style="font-weight:700;margin-bottom:6px;">Logging intensity multipliers</div>
      <div class="hint" style="margin-bottom:14px;">Each logging intensity level can grant its own XP multiplier. The current level is multiplied after the rotation bonus and before the streak bonus.</div>
      <div class="field-row">${input(1)}${input(2)}</div>
      <div class="field-row">${input(3)}${input(4)}</div>
      <div class="field-row"><div class="field">${input(5).replace('<div class="field">','').replace('</div>','')}</div><div class="field"></div></div>
    </div>`;
  }
  function v299XPPreviewHtml(){
    const x=estimateCurrentLogXP();
    const intensityMultiplier=v299LevelMeta().xpMultiplier;
    return `<div><b>+${Number(x.xp||0).toLocaleString()} XP</b> for this log</div><small style="color:var(--text-mute)">${escapeHtml(x.label||'Rotation')} · ${Number(x.base||0).toLocaleString()} base × ${Number(x.multiplier||1)} rotation × ${Number(intensityMultiplier).toLocaleString(undefined,{maximumFractionDigits:2})} intensity × ${Number(x.streakMultiplier||1).toFixed(2)} streak (${Number(x.streak||0)}d)</small>`;
  }

  const v299CalculateConsumptionXPBase=calculateConsumptionXP;
  calculateConsumptionXP=function(cat,amount,minutes,status){
    const out=v299CalculateConsumptionXPBase.apply(this,arguments)||{};
    const intensityMultiplier=v299LevelMeta().xpMultiplier;
    const raw=Math.max(0,Number(out.xp)||0);
    return Object.assign({},out,{preIntensityXP:raw,intensityLevel:v299CurrentLevel(),intensityMultiplier,xp:Math.max(0,Math.round(raw*intensityMultiplier))});
  };

  const v299RefreshXPPreviewBase=refreshXPPreview;
  refreshXPPreview=function(){
    const el=document.getElementById('xp-preview');
    if(!el){
      if(typeof v299RefreshXPPreviewBase==='function') return v299RefreshXPPreviewBase.apply(this,arguments);
      return;
    }
    el.innerHTML=v299XPPreviewHtml();
  };

  const v299RenderLogFormBase=renderLogForm;
  renderLogForm=function(t,cat){
    let html=v299RenderLogFormBase.apply(this,arguments);
    html=html.replace(/<div id="xp-preview"[^>]*>[\s\S]*?<\/div>/, `<div id="xp-preview" style="margin:10px 0 14px;padding:11px 13px;border:1px solid var(--border-soft);background:var(--panel-raised);border-radius:10px;color:var(--flow);line-height:1.45;">${v299XPPreviewHtml()}</div>`);
    if(v299RecommendationOnlyApplies(t)){
      const recTitle=escapeHtml(v299RecommendedTitle()||'Recommended title');
      const note=`<div class="v299-rec-only-note"><div class="v299-rec-only-title">Recommended title only</div><div class="hint">Logging Intensity LV 5 is active, so this log only accepts the current recommended title: <b>${recTitle}</b>. ${v299RerollEscapeActive(t)?'Because this task needs more than 1 unit, Reroll title stays available.':''}</div></div>`;
      html=html.replace('<label class="field-label">Titles consumed</label>', `<label class="field-label">Titles consumed</label>${note}`);
      html=html.replace(/<div style="display:flex; gap:8px; margin-bottom:8px;">[\s\S]*?<\/div>/,
        `<div class="v299-rec-entry-row"><div class="v299-rec-chip">${recTitle}</div><input type="number" id="entry-qty" min="1" value="${Math.max(1,Number(S.entryDraft?.qty)||1)}" oninput="App.updateEntryDraft('qty', this.value)" style="width:92px;"><button class="btn btn-sm" onclick="App.addLogEntry()">+ Add</button></div>`
      );
    }
    return html;
  };

  const v299OpenLogFormBase=App.openLogForm;
  App.openLogForm=function(){
    const out=v299OpenLogFormBase.apply(this,arguments);
    if(v299RecommendationOnlyApplies()){
      v299SyncEntryDraftToRecommendation();
      render();
    }
    return out;
  };

  const v299AddLogEntryBase=App.addLogEntry;
  App.addLogEntry=function(){
    if(v299RecommendationOnlyApplies()) v299SyncEntryDraftToRecommendation();
    return v299AddLogEntryBase.apply(this,arguments);
  };

  const v299SubmitLogBase=App.submitLog;
  App.submitLog=function(){
    if(v299RecommendationOnlyApplies()){
      const recommended=v299RecommendedTitle();
      if(recommended){
        const entries=S.logDraft.entries||[];
        if(entries.some(entry=>cleanTitle(entry.title)!==recommended)){
          showToast('Level 5 only allows the currently recommended title.');
          return;
        }
        if(!entries.length){
          const qty=Math.max(1,Number(S.logDraft?.amount)||Number(S.currentTask?.targetMid)||1);
          S.logDraft.entries=[{title:recommended,qty,libraryId:v299RecommendedLibraryId(),isNew:false,isRepeat:false}];
        }
      }
    }
    return v299SubmitLogBase.apply(this,arguments);
  };

  const v299RotateTaskBase=App.rotateTask;
  App.rotateTask=function(){
    const reason=v299SomethingElseDisabledReason();
    if(reason){ showToast(reason); return; }
    return v299RotateTaskBase.apply(this,arguments);
  };

  const v299SkipTaskBase=App.skipTask;
  App.skipTask=function(){
    const reason=v299SkipDisabledReason();
    if(reason){ showToast(reason); return; }
    return v299SkipTaskBase.apply(this,arguments);
  };

  if(typeof App.v180RerollRecommendedTitle==='function'){
    const v299RerollTitleBase=App.v180RerollRecommendedTitle;
    App.v180RerollRecommendedTitle=function(){
      const reason=v299TitleRerollDisabledReason();
      if(reason){ showToast(reason); return; }
      return v299RerollTitleBase.apply(this,arguments);
    };
  }

  const v299RenderDashboardBase=renderDashboard;
  renderDashboard=function(){
    let html=v299RenderDashboardBase.apply(this,arguments);
    const widget=v299DashboardIntensityHtml();
    if(widget) html=html.replace('<div class="hero">', `${widget}<div class="hero">`);
    return html;
  };

  const v299RenderSettingsBase=renderSettings;
  renderSettings=function(){
    let h=v299RenderSettingsBase.apply(this,arguments);
    const levelMarker='<div class="section-label settings-section-head"><span>LEVELING &amp; XP</span>';
    if(!h.includes('v299-settings-intensity-card')){
      if(h.includes(levelMarker)){
        const headingIndex=h.indexOf(levelMarker);
        const headingEnd=h.indexOf('</div>',headingIndex)+6;
        h=h.slice(0,headingEnd)+v299SettingsSliderCardHtml()+v299IntensityXpSettingsHtml()+h.slice(headingEnd);
      }else{
        const oldMarker='<div class="section-label">LEVELING &amp; XP</div>';
        if(h.includes(oldMarker)) h=h.replace(oldMarker,oldMarker+v299SettingsSliderCardHtml()+v299IntensityXpSettingsHtml());
        else h+=`<div class="section-label">LOGGING INTENSITY &amp; XP</div>${v299SettingsSliderCardHtml()}${v299IntensityXpSettingsHtml()}`;
      }
    }
    return h;
  };

  v192DashboardVisibilitySettingsHtml=function(){
    const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
    const row=(key,title,desc)=>`<div class="v192-dashboard-toggle-row"><div><b>${escapeHtml(title)}</b><div class="hint">${escapeHtml(desc)}</div></div><button type="button" class="toggle ${cfg[key]!==false?'on':''}" onclick="App.v192ToggleDashboardSection('${key}')" aria-label="Toggle ${escapeHtml(title)}"></button></div>`;
    return `<div class="card v192-dashboard-settings-card">
      <div class="v192-dashboard-settings-head"><div><b>Dashboard sections</b><div class="hint">Choose which optional Dashboard sections MediaFlow shows. Hiding a section never deletes its Library, History or settings data.</div></div></div>
      <div class="v192-dashboard-toggle-list">
        ${row('showTodayBalance',"Today's Balance",'Show or hide the Today’s Balance category section.')}
        ${row('showLoggingIntensity','Logging Intensity','Show or hide the Logging Intensity slider under On This Day and above the Next Task card.')}
        ${row('showRatingQueue','Rate Your Library','Show or hide the unrated-title queue on Dashboard.')}
        ${row('showMissingCovers','Missing Covers','Show or hide the queue for Library titles that do not have a cover URL.')}
        ${row('showStopwatch','Stopwatch','Show or hide the Stopwatch card on Dashboard. Its current timer state is preserved while hidden.')}
      </div>
    </div>`;
  };

  const v299DashboardToggleBase=App.v192ToggleDashboardSection;
  App.v192ToggleDashboardSection=function(key){
    if(key==='showLoggingIntensity'){
      const cfg=v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
      cfg.showLoggingIntensity=!cfg.showLoggingIntensity;
      cfg.modifiedAt=Date.now();
      persistSettings();
      render();
      showToast(`Logging Intensity ${cfg.showLoggingIntensity?'shown':'hidden'} on Dashboard`);
      return;
    }
    return v299DashboardToggleBase.apply(this,arguments);
  };

  function v299SetLoggingIntensityLevel(value){
    const cfg=v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS);
    const level=v299ClampLevel(value);
    if(cfg.level===level) return;
    cfg.level=level;
    cfg.modifiedAt=Date.now();
    persistSettings();
    if(v299RecommendationOnlyApplies()) v299SyncEntryDraftToRecommendation();
    render();
    showToast(`Logging Intensity set to ${v299LevelMeta(level).label} · ${v299LevelMeta(level).name}`);
  }
  function v299UpdateIntensityMultiplier(level,value){
    const cfg=v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS);
    cfg.xpMultipliers[String(v299ClampLevel(level))]=v299NumberOr(value,V299_LEVELS[v299ClampLevel(level)].defaultXP);
    cfg.modifiedAt=Date.now();
    persistSettings();
    refreshXPPreview();
    render();
    showToast(`${v299LevelMeta(level).label} XP multiplier updated`);
  }

  Object.assign(App,{v299SetLoggingIntensityLevel,v299UpdateIntensityMultiplier, v299SettingsSliderCardHtml,v299IntensityXpSettingsHtml});

  const v299PersistSettingsBase=persistSettings;
  persistSettings=function(){
    v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS);
    v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
    return v299PersistSettingsBase.apply(this,arguments);
  };
  const v299LoadAllBase=loadAll;
  loadAll=async function(){
    await v299LoadAllBase.apply(this,arguments);
    v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS);
    v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
  };
  const v299SnapshotBase=snapshot;
  snapshot=function(){
    v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS);
    v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
    const out=v299SnapshotBase.apply(this,arguments)||{};
    out.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
    return out;
  };
  const v299ApplyStateBase=v46ApplyState;
  v46ApplyState=function(d){
    const result=v299ApplyStateBase.apply(this,arguments);
    v299EnsureIntensitySettings(S.settings||DEFAULT_SETTINGS);
    v192EnsureDashboardSettings(S.settings||DEFAULT_SETTINGS);
    return result;
  };
  const v299MergeStatesBase=mergeStates;
  mergeStates=function(a,b){
    const out=v299MergeStatesBase.apply(this,arguments)||{};
    out.settings=out.settings||{};
    const av=v299NormalizeIntensity(a?.settings?.v299LoggingIntensity);
    const bv=v299NormalizeIntensity(b?.settings?.v299LoggingIntensity);
    out.settings.v299LoggingIntensity=(Number(av.modifiedAt)||0)>=(Number(bv.modifiedAt)||0)?av:bv;
    const ad=v192NormalizeDashboardSettings(a?.settings?.v192Dashboard);
    const bd=v192NormalizeDashboardSettings(b?.settings?.v192Dashboard);
    out.settings.v192Dashboard=(Number(ad.modifiedAt)||0)>=(Number(bd.modifiedAt)||0)?ad:bd;
    return out;
  };

  const v299RenderBase=render;
  render=function(){
    const result=v299RenderBase.apply(this,arguments);
    setTimeout(()=>{
      try{
        const rerollBtn=document.querySelector('[onclick*="App.v180RerollRecommendedTitle"]');
        v299SetButtonState(rerollBtn,v299CanUseTitleReroll(),v299TitleRerollDisabledReason());
        const somethingElseBtn=document.querySelector('[onclick*="App.rotateTask"]');
        v299SetButtonState(somethingElseBtn,v299CanUseSomethingElse(),v299SomethingElseDisabledReason());
        const skipBtn=document.querySelector('[onclick*="App.skipTask"]');
        v299SetButtonState(skipBtn,v299CanSkip(),v299SkipDisabledReason());
        if(v299RecommendationOnlyApplies() && S.logging) v299SyncEntryDraftToRecommendation();
      }catch(_){/* no-op */}
    },0);
    return result;
  };


/* ============================================================
   MediaFlow v299.1 — Stable Logging Intensity XP + Current Rerolls Repair
   ------------------------------------------------------------
   - Logging Intensity now affects only previews/newly-created logs instead of
     globally distorting older History entries when the level changes.
   - XP rebuild / Calculate XP now preserves each session's stored intensity
     multiplier when recomputing base XP.
   - New logs store their Logging Intensity level, multiplier and raw pre-
     intensity XP for durable cloud/import/export consistency.
   ============================================================ */
(function(){
  function v299ApplyIntensity(rawOut, level, multiplier){
    const out=rawOut||{};
    const raw=Math.max(0,Number.isFinite(Number(out.preIntensityXP))?Number(out.preIntensityXP):(Number(out.xp)||0));
    const mult=Math.max(0,Number(multiplier)||0);
    return Object.assign({},out,{preIntensityXP:raw,intensityLevel:Number(level)||1,intensityMultiplier:mult,xp:Math.max(0,Math.round(raw*mult))});
  }

  const v299GlobalCalcWithIntensity=calculateConsumptionXP;
  calculateConsumptionXP=function(){
    const out=v299GlobalCalcWithIntensity.apply(this,arguments)||{};
    const raw=Math.max(0,Number.isFinite(Number(out.preIntensityXP))?Number(out.preIntensityXP):(Number(out.xp)||0));
    return Object.assign({},out,{preIntensityXP:raw,intensityLevel:1,intensityMultiplier:1,xp:Math.max(0,Math.round(raw))});
  };

  v299XPPreviewHtml=function(){
    const base=estimateCurrentLogXP();
    const meta=v299LevelMeta();
    const x=v299ApplyIntensity(base,meta.level,meta.xpMultiplier);
    return `<div><b>+${x.xp.toLocaleString()} XP</b> for this log</div><small style="color:var(--text-mute)">${escapeHtml(x.label)} · ${x.base.toLocaleString()} base × ${x.multiplier} rotation × ${x.intensityMultiplier} intensity × ${Number(x.streakMultiplier||1).toFixed(2)} streak (${Number(x.streak||0)}d)</small>`;
  };

  refreshXPPreview=function(){
    const el=document.getElementById('xp-preview');
    if(!el) return;
    el.innerHTML=v299XPPreviewHtml();
  };

  const v299SubmitLogStableBase=App.submitLog;
  App.submitLog=function(){
    const beforeLen=(S.sessions||[]).length;
    const meta=v299LevelMeta();
    const rawCalc=calculateConsumptionXP;
    calculateConsumptionXP=function(){
      return v299ApplyIntensity(rawCalc.apply(this,arguments),meta.level,meta.xpMultiplier);
    };
    try{
      const out=v299SubmitLogStableBase.apply(this,arguments);
      const after=(S.sessions||[]).slice(beforeLen);
      let touched=false;
      after.forEach(s=>{
        if(!s || s.status==='skipped') return;
        const mult=Math.max(0,Number(meta.xpMultiplier)||0);
        const raw=Math.max(0,Number.isFinite(Number(s.v299PreIntensityXP))?Number(s.v299PreIntensityXP): (mult>0 ? Math.round((Number(s.xp)||0)/mult) : (Number(s.xp)||0)));
        s.v299IntensityLevel=meta.level;
        s.v299IntensityMultiplier=mult;
        s.v299PreIntensityXP=raw;
        s.xp=Math.max(0,Math.round(raw*mult));
        touched=true;
      });
      if(touched){ try{ persistSessions(); }catch(_){} }
      return out;
    } finally {
      calculateConsumptionXP=rawCalc;
    }
  };

  const v299RecalculateXPBase=v46RecalculateXP;
  v46RecalculateXP=async function(force=false){
    const info=await v299RecalculateXPBase.apply(this,arguments);
    let touched=false;
    for(const s of (S.sessions||[])){
      if(!s || s.status==='skipped') continue;
      const mult=Math.max(0,Number(s.v299IntensityMultiplier)||1);
      const raw=Math.max(0,Number.isFinite(Number(s.v299PreIntensityXP))?Number(s.v299PreIntensityXP):(Number(s.xp)||0));
      const finalXP=Math.max(0,Math.round(raw*mult));
      if(Number(s.v299PreIntensityXP)!==raw || Number(s.xp)!==finalXP){
        s.v299PreIntensityXP=raw;
        s.xp=finalXP;
        touched=true;
      }
    }
    if(touched){
      try{ persistSessions(); }catch(_){ }
      try{ v149MarkStreakDirty(); }catch(_){ }
    }
    return info;
  };
})();

/* ============================================================
   MediaFlow v299.2 — Current Rerolls modal usability repair
   ------------------------------------------------------------
   - Fixes internal scrolling reliability.
   - Keeps the header readable and the list scrollable.
   - Lets long titles wrap instead of forcing overflow.
   ============================================================ */
const v299OpenRerollHistoryBase=App.v180OpenRerollHistory;
App.v180OpenRerollHistory=function(){
  const out=v299OpenRerollHistoryBase.apply(this,arguments);
  setTimeout(()=>{
    const modal=document.querySelector('.v180-history-modal');
    const list=document.querySelector('.v180-history-list');
    if(modal) modal.setAttribute('data-v299-rerolls','1');
    if(list) list.setAttribute('tabindex','0');
  },0);
  return out;
};


})(); // end v299 Logging Intensity module

/* v300: v221 registered its own Settings page renderer, capturing the older
   Settings HTML before v299 existed. Patch the page renderer itself so XP
   controls are included in initial renders AND the v265 in-place morph path. */
const v300SettingsPageBase=v221RenderSettingsPage;
v221RenderSettingsPage=function(){
  const html=v300SettingsPageBase.apply(this,arguments);
  if(html.includes('v299-settings-intensity-card'))return html;
  const temp=document.createElement('div');
  temp.innerHTML=html;
  const headings=[...temp.querySelectorAll('.v221-settings-content .section-label')];
  const levelHeading=headings.find(node=>String(node.textContent||'').toUpperCase().includes('LEVELING & XP'));
  if(levelHeading){
    const first=document.createElement('div');
    first.innerHTML=App.v299SettingsSliderCardHtml()+App.v299IntensityXpSettingsHtml();
    levelHeading.after(...[...first.children]);
  }
  return temp.innerHTML;
};
MediaFlowRuntime.registerPageRenderer('settings',v221RenderSettingsPage);

/* MediaFlow v300 release marker and runtime sanity probe. */
MediaFlowRuntime.version=300;
window.MediaFlowV300={version:300,loggingIntensity:true, dashboardPlacement:'above logging',xpSettings:true,dashboardVisibility:true};
