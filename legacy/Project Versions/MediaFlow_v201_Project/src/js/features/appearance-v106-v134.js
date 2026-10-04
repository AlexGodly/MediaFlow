/* MediaFlow v201 source fragment
 * Appearance layers, completion/repeat XP, rating queue, classic stats and performance
 * Original HTML lines 13179-14953.
 * Build order matters; see scripts/build.mjs.
 */

  /* ============================================================
     MediaFlow v106 — Global Light / Dark Appearance Layer
     ------------------------------------------------------------
     Theme identity and appearance are intentionally separate:
       - S.settings.theme chooses the visual theme / Full Style.
       - S.settings.appearanceMode chooses light or dark globally.

     New themes automatically participate when they use MediaFlow's
     shared surface/text variables and standard component classes.
     ============================================================ */
  function v106ParseRgb(value){
    const m=String(value||'').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    return m?[Number(m[1]),Number(m[2]),Number(m[3])]:null;
  }

  function v106DetectThemeAppearance(){
    /* Resolve var(--bg) through the browser instead of maintaining a list of
       "light" and "dark" theme IDs. That keeps migration compatible with
       custom themes and future themes. Temporarily remove the global layer so
       we measure the selected theme itself rather than our own override. */
    const root=document.documentElement;
    const previousAppearance=root.getAttribute('data-appearance');
    try{
      root.removeAttribute('data-appearance');
      const probe=document.createElement('span');
      probe.setAttribute('aria-hidden','true');
      probe.style.cssText='position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;background:var(--bg);';
      (document.body||document.documentElement).appendChild(probe);
      const rgb=v106ParseRgb(getComputedStyle(probe).backgroundColor);
      probe.remove();
      if(previousAppearance) root.setAttribute('data-appearance',previousAppearance);
      if(rgb){
        const linear=rgb.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
        const luminance=0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2];
        return luminance>.42?'light':'dark';
      }
    }catch(e){
      if(previousAppearance) root.setAttribute('data-appearance',previousAppearance);
    }
    const id=String(S.settings?.theme||document.documentElement.dataset.theme||'').toLowerCase();
    if(/(?:^|-)light(?:$|-)/.test(id)||['sakura','arctic','desert','lavender','peach','mint','paper','sky','ivory','blueprint','candy'].includes(id)) return 'light';
    return 'dark';
  }

  function v106AppearanceMode(){
    if(!S.settings) return document.documentElement.dataset.appearance==='light'?'light':'dark';
    let mode=String(S.settings.appearanceMode||'').toLowerCase();
    if(mode!=='light'&&mode!=='dark'){
      mode=v106DetectThemeAppearance();
      /* Migration deliberately starts from the theme's current native mode so
         upgrading to v106 does not suddenly invert an existing user's UI. */
      S.settings.appearanceMode=mode;
    }
    return mode;
  }

  function v106ApplyAppearance(mode){
    mode=mode==='light'?'light':'dark';
    document.documentElement.removeAttribute('data-native-scheme');
    document.documentElement.dataset.appearance=mode;
    document.documentElement.style.colorScheme=mode;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',mode==='light'?'#f5f7fb':'#0b0e14');
    return mode;
  }

  /* ============================================================
     MediaFlow v132 — Optional Global Appearance Layer
     ------------------------------------------------------------
     ON  = v106 Light/Dark surface overrides are applied globally.
     OFF = data-appearance is removed completely so the selected
           MediaFlow / Platform / Full Style theme renders natively.
     ============================================================ */
  function v132GlobalAppearanceEnabled(){
    return S.settings?.globalAppearanceEnabled!==false;
  }

  function v132RestoreNativeAppearance(){
    const root=document.documentElement;
    root.removeAttribute('data-appearance');
    root.style.removeProperty('color-scheme');

    /* v133 records the theme's own light/dark nature while Global Appearance
       is OFF. This does NOT recolor the theme; it only lets us replace old
       hard-coded dark base components with the theme's own CSS variables. */
    const nativeMode=v106DetectThemeAppearance();
    root.dataset.nativeScheme=nativeMode;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',nativeMode==='light'?'#f5f7fb':'#0b0e14');
    return 'native';
  }

  function v132ApplyAppearancePreference(){
    if(v132GlobalAppearanceEnabled()) return v106ApplyAppearance(v106AppearanceMode());
    return v132RestoreNativeAppearance();
  }

  const v106ApplyThemeBase=applyTheme;
  applyTheme=function(theme){
    /* Always apply the selected theme first. The global layer is optional:
       when disabled, removing data-appearance exposes the theme's original
       colors/surfaces instead of forcing MediaFlow's Light/Dark neutrals. */
    v106ApplyThemeBase(theme);
    v132ApplyAppearancePreference();
  };

  function v106SetAppearanceMode(mode){
    if(mode!=='light'&&mode!=='dark') return;
    S.settings.appearanceMode=mode;
    if(v132GlobalAppearanceEnabled()) v106ApplyAppearance(mode);
    persistSettings();
    render();
  }

  function v132SetGlobalAppearanceEnabled(enabled){
    S.settings.globalAppearanceEnabled=!!enabled;
    v132ApplyAppearancePreference();
    persistSettings();
    render();
  }

  App.setAppearanceMode=v106SetAppearanceMode;
  App.setGlobalAppearanceEnabled=v132SetGlobalAppearanceEnabled;
  App.toggleAppearanceMode=function(){v106SetAppearanceMode(v106AppearanceMode()==='dark'?'light':'dark');};
  App.toggleGlobalAppearance=function(){v132SetGlobalAppearanceEnabled(!v132GlobalAppearanceEnabled());};

  const v106SettingsBase=renderSettings;
  renderSettings=function(){
    let html=v106SettingsBase();
    const mode=v106AppearanceMode();
    const enabled=v132GlobalAppearanceEnabled();
    const globalAppearance=`<div class="field v106-global-appearance ${enabled?'':'v132-native-appearance'}">
      <div class="settings-toggle-row" style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
        <div>
          <label class="field-label" style="margin:0 0 4px;">Global appearance</label>
          <small class="hint">${enabled?'ON — MediaFlow applies the selected Light/Dark appearance after every theme.':'OFF — Native theme appearance. MediaFlow is not applying any global Light/Dark color layer.'}</small>
        </div>
        <button type="button" class="toggle ${enabled?'on':''}" onclick="App.setGlobalAppearanceEnabled(${enabled?'false':'true'})" aria-label="${enabled?'Disable':'Enable'} global appearance" aria-pressed="${enabled?'true':'false'}"></button>
      </div>
      <div class="v132-appearance-mode-controls" style="margin-top:12px;" ${enabled?'':'aria-disabled="true"'}>
        <label class="field-label">Light / Dark override</label>
        <select onchange="App.setAppearanceMode(this.value)" aria-label="Global light or dark appearance" ${enabled?'':'disabled'}>
          <option value="light" ${mode==='light'?'selected':''}>☀ Light mode</option>
          <option value="dark" ${mode==='dark'?'selected':''}>🌙 Dark mode</option>
        </select>
        <small class="hint">${enabled?'Changing themes keeps this Light/Dark override, including future themes.':'Turn Global appearance on to use the Light/Dark override again. Your saved mode is kept while native appearance is active.'}</small>
      </div>
    </div>`;
    const themeHint='<small class="hint">Switch collections first. The selected collection gets its own theme dropdown.</small></div>';
    if(html.includes(themeHint)) html=html.replace(themeHint,themeHint+globalAppearance);
    return html;
  };

  /* Apply immediately for normal themes too. initTheme() will run through the
     wrapped applyTheme after account state finishes loading. */
  v132ApplyAppearancePreference();

  /* Restore a saved Full Style theme after v99's earlier theme initializer has run. */
  const saved=S.settings?.theme||localStorage.getItem('mf_theme');
  if(FULL_STYLE_THEMES.includes(saved)) applyTheme(saved);


/* ============================================================
   MediaFlow v120 — Completion XP + Progression Integrity
   - Every currently completed Library title contributes configured completion XP.
   - Editing a title to Completed earns normal edit XP plus the completed-title XP.
   - Completing through a consumption log also earns a one-time logged-completion
     bonus, on top of consumption XP and completed-title XP, so logging completion
     is always more rewarding than changing the status manually.
   - Calculate XP now, Sync now, cloud merging, imports and full JSON backups are
     aware of all v120 XP sources and the complete state shape.
   ============================================================ */

DEFAULT_SETTINGS.leveling.libraryEditXP = Number.isFinite(Number(DEFAULT_SETTINGS.leveling.libraryEditXP)) ? Number(DEFAULT_SETTINGS.leveling.libraryEditXP) : 5;
DEFAULT_SETTINGS.leveling.manualCoverXP = Number.isFinite(Number(DEFAULT_SETTINGS.leveling.manualCoverXP)) ? Number(DEFAULT_SETTINGS.leveling.manualCoverXP) : 15;
DEFAULT_SETTINGS.leveling.loggingCompletionBonusXP = Number.isFinite(Number(DEFAULT_SETTINGS.leveling.loggingCompletionBonusXP)) ? Number(DEFAULT_SETTINGS.leveling.loggingCompletionBonusXP) : 25;

function v120EnsureXPState(){
  S.settings=S.settings||{};
  S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings.leveling||{});
  S.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,S.settings.leveling.unitXP||{});
  S.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,S.settings.leveling.rotationMultiplier||{});
  S.xpLedger=Object.assign({libraryAdditions:{},libraryEdits:{},manualCovers:{},logCompletions:{}},S.xpLedger||{});
  for(const k of ['libraryAdditions','libraryEdits','manualCovers','logCompletions']){
    if(!S.xpLedger[k] || typeof S.xpLedger[k]!=='object' || Array.isArray(S.xpLedger[k])) S.xpLedger[k]={};
  }
}
function v120IsCompleted(item){
  return !!(item && (item.status==='completed' || (item.total!=null && Number(item.total)>0 && Number(item.progress)>=Number(item.total))));
}
function v120LoggedCompletionXP(){
  return Math.max(0,Math.round(Number(levelingSettings().loggingCompletionBonusXP)||0));
}
function v120AwardLoggedCompletionXP(itemId){
  if(!itemId || levelingSettings().enabled===false) return 0;
  v120EnsureXPState();
  const ledger=S.xpLedger.logCompletions;
  if(Object.prototype.hasOwnProperty.call(ledger,itemId)) return 0;
  const xp=v120LoggedCompletionXP();
  ledger[itemId]=xp; // Store even 0 so changing Settings later cannot re-award an old completion.
  return xp;
}
function v120SumLedger(name,ledger=S.xpLedger){
  return Object.values(ledger?.[name]||{}).reduce((a,v)=>a+(Number(v)||0),0);
}
function v120XPBreakdown(){
  v120EnsureXPState();
  const l=levelingSettings();
  const completed=v46CompletedLibraryCount();
  const sessionXP=(S.sessions||[]).reduce((a,s)=>a+sessionStoredXP(s),0);
  const titleXP=(l.enabled===false)?0:(S.library||[]).length*Math.max(0,Math.round(Number(l.libraryAdditionXP)||0));
  const completedXP=(l.enabled===false)?0:completed*Math.max(0,Math.round(Number(l.completionXP)||0));
  const editXP=v120SumLedger('libraryEdits');
  const coverXP=v120SumLedger('manualCovers');
  const loggedCompletionXP=v120SumLedger('logCompletions');
  return {total:sessionXP+titleXP+completedXP+editXP+coverXP+loggedCompletionXP,historyXP:sessionXP,libraryTitleXP:titleXP,completedTitleXP:completedXP,libraryEditXP:editXP,manualCoverXP:coverXP,loggedCompletionBonusXP:loggedCompletionXP,completedTitles:completed};
}

// v120 source of truth for event-based Library XP.
v46ExtraLibraryXP=function(){
  return v120SumLedger('libraryEdits')+v120SumLedger('manualCovers')+v120SumLedger('logCompletions');
};
libraryXPTotal=function(){ return v46LibraryBaseXP()+v46ExtraLibraryXP(); };

// Library History XP deltas now use the same XP model as the live level total,
// including completed-title XP and the v120 logged-completion bonus ledger.
v50SnapshotXP=function(x){
  if(!x)return null;
  const l=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings?.leveling||{});
  const sessions=Array.isArray(x.sessions)?x.sessions:[];
  const library=Array.isArray(x.library)?x.library:[];
  const ledger=x.xpLedger||{};
  const sum=o=>Object.values(o||{}).reduce((a,v)=>a+(Number(v)||0),0);
  const sessionXP=sessions.reduce((a,s)=>{
    if(!s||s.status==='skipped')return a;
    const stored=Number(s.xp);
    if(Number.isFinite(stored)&&stored>0)return a+stored;
    const cat=getCategory(s.categoryId);
    return a+calculateConsumptionXP(cat,Number(s.actualAmount)||0,Number(s.minutes)||0,s.healthStatus||'healthy').xp;
  },0);
  if(l.enabled===false) return sessionXP;
  const add=Math.max(0,Math.round(Number(l.libraryAdditionXP)||0));
  const complete=Math.max(0,Math.round(Number(l.completionXP)||0));
  const completed=library.filter(v120IsCompleted).length;
  return sessionXP + library.length*add + completed*complete + sum(ledger.libraryEdits)+sum(ledger.manualCovers)+sum(ledger.logCompletions);
};

// Merge every XP ledger independently. Older sync code only deep-merged
// libraryAdditions, which could discard edit/cover/completion XP from another copy.
const v120MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v120MergeStatesBase(a,b)||{};
  const al=a?.xpLedger||{}, bl=b?.xpLedger||{};
  out.xpLedger=Object.assign({libraryAdditions:{},libraryEdits:{},manualCovers:{},logCompletions:{}},bl,al);
  for(const k of ['libraryAdditions','libraryEdits','manualCovers','logCompletions']) out.xpLedger[k]=Object.assign({},bl[k]||{},al[k]||{});
  const byKey=new Map();
  for(const x of [...(b?.completionTimeline||[]),...(a?.completionTimeline||[])]){
    if(!x||typeof x!=='object')continue;
    const key=x.libraryId||`${cleanTitle(x.title).toLowerCase()}::${x.categoryId||''}::${Number(x.completedAt)||0}`;
    const prev=byKey.get(key);
    if(!prev || Number(x.completedAt||0)>=Number(prev.completedAt||0)) byKey.set(key,Object.assign({},x));
  }
  out.completionTimeline=[...byKey.values()].sort((x,y)=>Number(y.completedAt||0)-Number(x.completedAt||0));
  return out;
};

// Apply the complete modern state shape during manual Sync/Import instead of
// dropping Library History, migrations or the saved profile name.
const v120ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  v120ApplyStateBase(d);
  d=d||{};
  S.activityLog=Array.isArray(d.activityLog)?d.activityLog:[];
  S.migrations=(d.migrations&&typeof d.migrations==='object')?d.migrations:{};
  S.profileName=String(d.profileName||'').trim();
  v120EnsureXPState();
};

function v120CompletionSnapshot(){
  return new Map((S.library||[]).filter(i=>i?.id).map(i=>[i.id,v120IsCompleted(i)]));
}
function v120NewlyCompleted(before){
  return (S.library||[]).filter(i=>i?.id && !before.get(i.id) && v120IsCompleted(i));
}
function v120SessionMatchesCompletion(item){
  if(!item?.id)return false;
  const completedAt=Number(item.completedAt)||0;
  const titleKey=cleanTitle(item.title).toLowerCase();
  return (S.sessions||[]).some(s=>{
    if(!s||s.status==='skipped')return false;
    const ts=Number(s.timestamp)||0;
    if(completedAt && Math.abs(ts-completedAt)>5*60*1000)return false;
    return (s.titles||[]).some(t=>String(t?.libraryId||'')===String(item.id) || (!t?.libraryId && cleanTitle(t?.title).toLowerCase()===titleKey && s.categoryId===item.categoryId));
  });
}
function v120RebuildLoggedCompletionLedger(){
  v120EnsureXPState();
  let added=0;
  for(const item of (S.library||[])){
    if(!v120IsCompleted(item) || Object.prototype.hasOwnProperty.call(S.xpLedger.logCompletions,item.id))continue;
    if(v120SessionMatchesCompletion(item)){v120AwardLoggedCompletionXP(item.id);added++;}
  }
  return added;
}

const v120RecalculateXPBase=v46RecalculateXP;
v46RecalculateXP=async function(force=false){
  v120EnsureXPState();
  await v120RecalculateXPBase(force);
  // Reconstruct a missing logged-completion bonus only when History provides
  // exact evidence that the completion happened through a MediaFlow log.
  v120RebuildLoggedCompletionLedger();
  return mediaFlowLevelInfo();
};

function v120CreditLoggedCompletions(before){
  const newly=v120NewlyCompleted(before);
  let bonus=0;
  for(const item of newly) bonus+=v120AwardLoggedCompletionXP(item.id);
  return {newly,bonus};
}
function v120AddBonusToLatestActivity(bonus){
  if(!bonus || !Array.isArray(S.activityLog))return;
  const recent=S.activityLog.find(x=>x && /log consumption/i.test(String(x.action||'')) && Date.now()-Number(x.timestamp||0)<10000);
  if(recent) recent.xpEarned=Math.max(0,Number(recent.xpEarned)||0)+bonus;
}

// Editing to Completed earns the regular edit XP plus the completed-title XP.
// The original saver already awards edit/manual-cover XP; this wrapper makes the
// completion delta visible and keeps the final toast aligned with the real level total.
const v120SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const beforeItem=id?(S.library||[]).find(i=>i.id===id):null;
  const wasComplete=v120IsCompleted(beforeItem);
  const beforeXP=mediaFlowXP();
  const result=v120SaveLibraryModalBase.apply(this,arguments);
  const afterItem=id?(S.library||[]).find(i=>i.id===id):(S.library||[])[(S.library||[]).length-1];
  if(afterItem && !wasComplete && v120IsCompleted(afterItem)){
    const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
    if(delta)showToast(`Saved as completed · +${delta.toLocaleString()} XP`);
  }
  return result;
};

// The quick Status editor is also a real Library edit, so changing it earns the
// configured edit XP. Marking it Completed additionally activates completed-title XP.
const v120SetLibraryStatusBase=App.setLibraryStatus;
App.setLibraryStatus=function(id,value){
  const item=(S.library||[]).find(i=>i?.id===id);
  if(!item)return v120SetLibraryStatusBase.apply(this,arguments);
  const previous=String(item.status||'planned');
  const wasComplete=v120IsCompleted(item),beforeXP=mediaFlowXP();
  if(previous!==value)v44AwardEditXP(id);
  const result=v120SetLibraryStatusBase.apply(this,arguments);
  const after=(S.library||[]).find(i=>i?.id===id);
  const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
  if(delta){
    const suffix=!wasComplete&&v120IsCompleted(after)?' · completed-title XP included':'';
    showToast(`Title updated · +${delta.toLocaleString()} XP${suffix}`);
  }
  return result;
};

// Logging a completion earns consumption XP + completed-title XP + an additional
// one-time logged-completion bonus. This guarantees logging is the richer path.
const v120SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const before=v120CompletionSnapshot(),beforeXP=mediaFlowXP();
  const result=v120SubmitLogBase.apply(this,arguments);
  const credit=v120CreditLoggedCompletions(before);
  if(credit.bonus){
    v120AddBonusToLatestActivity(credit.bonus);
    persistLibrary();
    render();
    const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
    showToast(`${credit.newly.length} title${credit.newly.length===1?'':'s'} completed by logging · +${delta.toLocaleString()} XP`);
  }
  return result;
};

const v120SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const before=v120CompletionSnapshot(),beforeXP=mediaFlowXP();
  const result=v120SubmitBatchLogBase.apply(this,arguments);
  const credit=v120CreditLoggedCompletions(before);
  if(credit.bonus){
    persistLibrary();
    render();
    const delta=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
    showToast(`${credit.newly.length} title${credit.newly.length===1?'':'s'} completed by Batch Log · +${delta.toLocaleString()} XP`);
  }
  return result;
};

async function v120CalculateXPNow(){
  showDataProgress('Calculate XP now','Scanning the complete Library, completion state and History…',5);
  try{
    v120EnsureXPState();
    updateDataProgress(10,`Checking ${(S.library||[]).length.toLocaleString()} Library titles and ${(S.sessions||[]).length.toLocaleString()} History logs…`);
    await v46RecalculateXP(true);
    updateDataProgress(64,`Verifying ${v46CompletedLibraryCount().toLocaleString()} completed Library titles and logged-completion bonuses…`); await v46Yield();
    await v46RefreshSchedulerProgress();
    updateDataProgress(86,'Saving rebuilt progression and XP ledgers to cloud…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(true,'XP calculation complete',`Level ${info.level} · ${info.xp.toLocaleString()} lifetime XP · ${b.completedTitles.toLocaleString()} completed titles · ${b.loggedCompletionBonusXP.toLocaleString()} logged-completion bonus XP`);
  }catch(e){console.error(e);finishDataProgress(false,'XP calculation failed',friendlyAuthError?.(e)||String(e?.message||e));}
}

async function v120SyncNow(){
  showDataProgress('Sync now','Preparing complete MediaFlow state and XP ledgers…',5);
  try{
    await saveQueue;
    updateDataProgress(13,'Reading protected cloud state…');
    const remote=await rawGet(STATE_KEY);
    updateDataProgress(27,'Merging Library, History, Library History, completions and XP ledgers…'); await v46Yield();
    const local=snapshot();
    const merged=remote?mergeStates(local,remote):local;
    v46ApplyState(merged);
    updateDataProgress(45,'Rechecking completed titles and progression…');
    await v46RecalculateXP(false);
    updateDataProgress(70,'Refreshing scheduler balance and health…'); await v46RefreshSchedulerProgress();
    updateDataProgress(87,'Uploading one complete protected cloud state…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(true,'Sync complete',`${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${b.completedTitles.toLocaleString()} completed · Level ${info.level} · ${info.xp.toLocaleString()} XP`);
  }catch(e){console.error(e);finishDataProgress(false,'Sync failed',String(e?.message||e));}
}
App.calculateXPNow=v120CalculateXPNow;
App.syncNow=v120SyncNow;

// Final Settings wrapper: expose every active v120 XP source and keep the repair/
// sync descriptions accurate. Existing v44 fields remain; this only modernizes them.
const v120SettingsBase=renderSettings;
renderSettings=function(){
  v120EnsureXPState();
  let h=v120SettingsBase();
  const l=levelingSettings(),completed=v46CompletedLibraryCount(),completedValue=completed*Math.max(0,Math.round(Number(l.completionXP)||0));
  h=h.replace('Control how much XP you earn from time, media units, Library additions, completions, and rotation health.','Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, cover work, and rotation health.');
  h=h.replace('Completion bonus XP','Completed Library title XP');
  const completionField=`onchange="App.updateLeveling('completionXP',this.value)"></div>`;
  const loggedField=`<div class="field"><label class="field-label">Logged completion bonus XP</label><input type="number" min="0" value="${l.loggingCompletionBonusXP??25}" onchange="App.updateLeveling('loggingCompletionBonusXP',this.value)"><small class="hint">One-time extra bonus when a title becomes completed through normal logging or Batch Log. Consumption XP and completed-title XP are awarded separately, so logging completion earns more than a manual status edit.</small></div><div class="hint" style="margin:-4px 0 14px">Current Library: <b>${completed.toLocaleString()}</b> completed title${completed===1?'':'s'} = <b>${completedValue.toLocaleString()} XP</b> from Completed Library title XP.</div>`;
  if(h.includes(completionField) && !h.includes('Logged completion bonus XP'))h=h.replace(completionField,completionField+loggedField);
  h=h.replace('Force a full XP calculation from Library + History and refresh every Level/XP display.','Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild detectable logged-completion bonuses, and refresh every Level/XP display.');
  h=h.replace('Merge cloud + local data, refresh XP and scheduler calculations, then upload one complete optimized state.','Merge cloud + local Library, History, Library History, completion data and all XP ledgers; then refresh progression/scheduler calculations and upload one complete protected state.');
  return h;
};


/* ============================================================
   MediaFlow v121 — Rewatch / Reread XP
   - Logged repeat episodes, chapters, issues and movies earn an extra repeat-unit bonus.
   - Normal consumption XP still applies, so repeat XP is additive rather than replacing it.
   - Every time logged repeat progress crosses another whole-title total, MediaFlow awards
     a configurable full rewatch/reread bonus.
   - Repeat XP works through normal logging and Batch Log and is rebuilt by Calculate XP now.
   - Manual past-repeat corrections remain history-only and intentionally do not generate XP.
   ============================================================ */

DEFAULT_SETTINGS.leveling.repeatUnitXP=Object.assign(
  {episodes:10,chapters:3,issues:6,movies:30},
  DEFAULT_SETTINGS.leveling.repeatUnitXP||{}
);
DEFAULT_SETTINGS.leveling.fullRepeatXP=Number.isFinite(Number(DEFAULT_SETTINGS.leveling.fullRepeatXP))
  ? Number(DEFAULT_SETTINGS.leveling.fullRepeatXP)
  : 50;

const v121LevelingSettingsBase=levelingSettings;
levelingSettings=function(){
  const l=v121LevelingSettingsBase();
  l.repeatUnitXP=Object.assign(
    {},
    DEFAULT_SETTINGS.leveling.repeatUnitXP,
    l.repeatUnitXP||{},
    S.settings?.leveling?.repeatUnitXP||{}
  );
  const configured=S.settings?.leveling?.fullRepeatXP;
  l.fullRepeatXP=Number.isFinite(Number(configured))
    ? Math.max(0,Number(configured))
    : Math.max(0,Number(DEFAULT_SETTINGS.leveling.fullRepeatXP)||50);
  return l;
};

function v121EnsureRepeatSettings(){
  S.settings=S.settings||{};
  S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings.leveling||{});
  S.settings.leveling.repeatUnitXP=Object.assign(
    {},
    DEFAULT_SETTINGS.leveling.repeatUnitXP,
    S.settings.leveling.repeatUnitXP||{}
  );
  if(!Number.isFinite(Number(S.settings.leveling.fullRepeatXP))){
    S.settings.leveling.fullRepeatXP=Math.max(0,Number(DEFAULT_SETTINGS.leveling.fullRepeatXP)||50);
  }
}

const v121EnsureXPStateBase=v120EnsureXPState;
v120EnsureXPState=function(){
  v121EnsureXPStateBase();
  v121EnsureRepeatSettings();
};

function v121SessionTime(s){
  const direct=Number(s?.timestamp)||0;
  if(direct>0)return direct;
  const parsed=Date.parse(String(s?.date||'')+'T12:00:00');
  return Number.isFinite(parsed)?parsed:0;
}

function v121RepeatKey(t,s){
  if(t?.libraryId)return `id:${String(t.libraryId)}`;
  const title=cleanTitle(t?.title||'').toLowerCase();
  return title?`title:${title}::${String(s?.categoryId||'')}`:'';
}

function v121RepeatTotal(t,s,item,unit){
  const stored=Number(t?.repeatTotalAtLog)||0;
  if(stored>0)return stored;
  const current=Number(item?.total)||0;
  const total=current>0?current:(unit==='movies'?1:0);
  if(total>0 && t && typeof t==='object')t.repeatTotalAtLog=total;
  return total;
}

function v121RecalculateRepeatXPHistory(){
  v121EnsureRepeatSettings();
  const l=levelingSettings();
  const enabled=l.enabled!==false;
  const running=new Map();
  const rows=(S.sessions||[]).map((s,index)=>({s,index})).sort((a,b)=>{
    const d=v121SessionTime(a.s)-v121SessionTime(b.s);
    return d||a.index-b.index;
  });
  let repeatUnits=0,fullRepeats=0,unitBonusXP=0,fullRepeatBonusXP=0,repeatSessions=0;

  for(const row of rows){
    const s=row.s;
    if(!s || s.status==='skipped')continue;
    let sessionUnits=0,sessionFull=0,sessionUnitXP=0,sessionFullXP=0;

    for(const t of (s.titles||[])){
      if(!t?.repeat)continue;
      const qty=Math.max(0,Number(t.qty)||0);
      if(qty<=0)continue;

      const item=t.libraryId?(S.library||[]).find(i=>String(i?.id||'')===String(t.libraryId)):null;
      const unit=getCategory(item?.categoryId||s.categoryId)?.unit||s.unit||'';
      const perUnit=enabled?Math.max(0,Number(l.repeatUnitXP?.[unit])||0):0;

      sessionUnits+=qty;
      sessionUnitXP+=qty*perUnit;

      const key=v121RepeatKey(t,s);
      if(key){
        const before=Number(running.get(key))||0;
        const after=before+qty;
        const total=v121RepeatTotal(t,s,item,unit);
        if(total>0){
          const crossed=Math.max(0,Math.floor(after/total)-Math.floor(before/total));
          if(crossed>0){
            sessionFull+=crossed;
            sessionFullXP+=enabled?crossed*Math.max(0,Number(l.fullRepeatXP)||0):0;
          }
        }
        running.set(key,after);
      }
    }

    if(sessionUnits>0){
      repeatSessions++;
      const cat=getCategory(s.categoryId);
      const base=calculateConsumptionXP(
        cat,
        Number(s.actualAmount)||0,
        Number(s.minutes)||0,
        s.healthStatus||'healthy'
      ).xp;
      s.repeatUnits=sessionUnits;
      s.fullRepeatsCompleted=sessionFull;
      s.repeatUnitBonusXP=Math.max(0,Math.round(sessionUnitXP));s.repeatFullTitleXP=Math.max(0,Math.round(sessionFullXP));
      s.repeatBonusXP=s.repeatUnitBonusXP+s.repeatFullTitleXP;
      s.xp=Math.max(0,Math.round(base+s.repeatBonusXP));

      repeatUnits+=sessionUnits;
      fullRepeats+=sessionFull;
      unitBonusXP+=s.repeatUnitBonusXP;
      fullRepeatBonusXP+=s.repeatFullTitleXP;
    }else if(
      s.repeatBonusXP!==undefined ||
      s.repeatUnitBonusXP!==undefined ||
      s.repeatFullTitleXP!==undefined ||
      s.repeatUnits!==undefined ||
      s.fullRepeatsCompleted!==undefined
    ){
      const cat=getCategory(s.categoryId);
      s.repeatUnits=0;
      s.fullRepeatsCompleted=0;
      s.repeatUnitBonusXP=0;
      s.repeatFullTitleXP=0;
      s.repeatBonusXP=0;
      s.xp=calculateConsumptionXP(
        cat,
        Number(s.actualAmount)||0,
        Number(s.minutes)||0,
        s.healthStatus||'healthy'
      ).xp;
    }
  }

  return {
    repeatSessions,
    repeatUnits,
    fullRepeats,
    repeatUnitBonusXP:Math.max(0,Math.round(unitBonusXP)),
    fullRepeatBonusXP:Math.max(0,Math.round(fullRepeatBonusXP)),
    repeatBonusXP:Math.max(0,Math.round(unitBonusXP+fullRepeatBonusXP))
  };
}

function v121RepeatXPBreakdown(){
  let repeatSessions=0,repeatUnits=0,fullRepeats=0,repeatUnitBonusXP=0,fullRepeatBonusXP=0;
  for(const s of (S.sessions||[])){
    const units=Math.max(0,Number(s?.repeatUnits)||0);
    if(units>0)repeatSessions++;
    repeatUnits+=units;
    fullRepeats+=Math.max(0,Number(s?.fullRepeatsCompleted)||0);
    repeatUnitBonusXP+=Math.max(0,Number(s?.repeatUnitBonusXP)||0);
    fullRepeatBonusXP+=Math.max(0,Number(s?.repeatFullTitleXP)||0);
  }
  return {
    repeatSessions,
    repeatUnits,
    fullRepeats,
    repeatUnitBonusXP:Math.round(repeatUnitBonusXP),
    fullRepeatBonusXP:Math.round(fullRepeatBonusXP),
    repeatBonusXP:Math.round(repeatUnitBonusXP+fullRepeatBonusXP)
  };
}

// Rebuild repeat XP whenever the main progression repair recalculates History.
const v121RecalculateXPBase=v46RecalculateXP;
v46RecalculateXP=async function(force=false){
  await v121RecalculateXPBase(force);
  v121RecalculateRepeatXPHistory();
  return mediaFlowLevelInfo();
};

// Manual Sync/Import must restore the nested repeat-XP settings too.
const v121ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  v121ApplyStateBase(d);
  v121EnsureRepeatSettings();
};

// Deep-merge the new nested repeat-unit settings during cloud/local synchronization.
const v121MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v121MergeStatesBase(a,b)||{};
  const as=a?.settings||{},bs=b?.settings||{};
  const al=as.leveling||{},bl=bs.leveling||{};
  out.settings=Object.assign({},bs,as);
  out.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,bl,al);
  out.settings.leveling.unitXP=Object.assign({},DEFAULT_SETTINGS.leveling.unitXP,bl.unitXP||{},al.unitXP||{});
  out.settings.leveling.rotationMultiplier=Object.assign({},DEFAULT_SETTINGS.leveling.rotationMultiplier,bl.rotationMultiplier||{},al.rotationMultiplier||{});
  out.settings.leveling.repeatUnitXP=Object.assign({},DEFAULT_SETTINGS.leveling.repeatUnitXP,bl.repeatUnitXP||{},al.repeatUnitXP||{});
  return out;
};

// Make old repeat History contribute immediately after loading without creating a startup write.
const v121LoadAllBase=loadAll;
loadAll=async function(){
  await v121LoadAllBase();
  v121EnsureRepeatSettings();
  v121RecalculateRepeatXPHistory();
};

// Expose repeat XP inside the existing progression breakdown/export without double-counting total XP.
const v121XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const base=v121XPBreakdownBase();
  return Object.assign({},base,v121RepeatXPBreakdown());
};

function v121NewSessionIds(before){
  const old=before||new Set();
  return (S.sessions||[]).filter(s=>s?.id&&!old.has(s.id)).map(s=>s.id);
}
function v121HasRepeatSession(ids){
  const set=new Set(ids||[]);
  return (S.sessions||[]).some(s=>set.has(s?.id)&&(s.titles||[]).some(t=>t?.repeat&&Number(t.qty)>0));
}
function v121NewRepeatSummary(ids){
  const set=new Set(ids||[]);
  let units=0,full=0,bonus=0;
  for(const s of (S.sessions||[])){
    if(!set.has(s?.id))continue;
    units+=Math.max(0,Number(s.repeatUnits)||0);
    full+=Math.max(0,Number(s.fullRepeatsCompleted)||0);
    bonus+=Math.max(0,Number(s.repeatBonusXP)||0);
  }
  return {units,full,bonus:Math.round(bonus)};
}
function v121RepeatToast(summary){
  if(!summary || summary.bonus<=0)return;
  const full=summary.full>0?` · ${summary.full} full title repeat${summary.full===1?'':'s'}`:'';
  showToast(`Rewatch / reread · +${summary.bonus.toLocaleString()} repeat XP${full}`);
}

// Normal logging and Batch Log both award repeat-unit XP and full-repeat XP.
const v121SubmitLogBase=App.submitLog;
App.submitLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v121SubmitLogBase.apply(this,arguments);
  const ids=v121NewSessionIds(before);
  if(v121HasRepeatSession(ids)){
    v121RecalculateRepeatXPHistory();
    persistSessions();
    render();
    v121RepeatToast(v121NewRepeatSummary(ids));
  }
  return result;
};

const v121SubmitBatchLogBase=App.submitBatchLog;
App.submitBatchLog=function(){
  const before=new Set((S.sessions||[]).map(s=>s?.id).filter(Boolean));
  const result=v121SubmitBatchLogBase.apply(this,arguments);
  const ids=v121NewSessionIds(before);
  if(v121HasRepeatSession(ids)){
    v121RecalculateRepeatXPHistory();
    persistSessions();
    render();
    v121RepeatToast(v121NewRepeatSummary(ids));
  }
  return result;
};

App.updateRepeatUnitXP=function(unit,value){
  if(!['episodes','chapters','issues','movies'].includes(unit))return;
  v121EnsureRepeatSettings();
  S.settings.leveling.repeatUnitXP[unit]=Math.max(0,Number(value)||0);
  persistSettings();
  render();
};

async function v121CalculateXPNow(){
  showDataProgress('Calculate XP now','Scanning Library, History, completions and repeat consumption…',5);
  try{
    v120EnsureXPState();
    updateDataProgress(10,`Checking ${(S.library||[]).length.toLocaleString()} Library titles and ${(S.sessions||[]).length.toLocaleString()} History logs…`);
    await v46RecalculateXP(true);
    updateDataProgress(65,'Verifying completed titles, logged completions and full rewatches/rereads…'); await v46Yield();
    await v46RefreshSchedulerProgress();
    updateDataProgress(87,'Saving rebuilt progression and repeat XP to cloud…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(
      true,
      'XP calculation complete',
      `Level ${info.level} · ${info.xp.toLocaleString()} lifetime XP · ${b.completedTitles.toLocaleString()} completed titles · ${b.repeatUnits.toLocaleString()} repeat units · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · ${b.repeatBonusXP.toLocaleString()} repeat bonus XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'XP calculation failed',friendlyAuthError?.(e)||String(e?.message||e));
  }
}

async function v121SyncNow(){
  showDataProgress('Sync now','Preparing complete MediaFlow state, completion XP and repeat XP…',5);
  try{
    await saveQueue;
    updateDataProgress(13,'Reading protected cloud state…');
    const remote=await rawGet(STATE_KEY);
    updateDataProgress(27,'Merging Library, History, Library History, completions, repeat data and XP…'); await v46Yield();
    const local=snapshot();
    const merged=remote?mergeStates(local,remote):local;
    v46ApplyState(merged);
    updateDataProgress(46,'Rechecking completed titles, repeat units and full rewatches/rereads…');
    await v46RecalculateXP(false);
    updateDataProgress(70,'Refreshing scheduler balance and health…'); await v46RefreshSchedulerProgress();
    updateDataProgress(87,'Uploading one complete protected cloud state…');
    await saveState(); await saveQueue;
    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(
      true,
      'Sync complete',
      `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${b.completedTitles.toLocaleString()} completed · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · Level ${info.level} · ${info.xp.toLocaleString()} XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'Sync failed',String(e?.message||e));
  }
}
App.calculateXPNow=v121CalculateXPNow;
App.syncNow=v121SyncNow;

// Final v121 Settings wrapper: surface repeat-unit and whole-title repeat rewards.
const v121SettingsBase=renderSettings;
renderSettings=function(){
  v121EnsureRepeatSettings();
  let h=v121SettingsBase();
  const l=levelingSettings(),r=v121RepeatXPBreakdown();

  h=h.replace(
    'Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, cover work, and rotation health.',
    'Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, rewatches/rereads, cover work, and rotation health.'
  );

  const rotationMarker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">ROTATION XP MULTIPLIERS</div>';
  const repeatFields=`<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">REWATCH / REREAD XP</div>
    <div class="field-row">
      <div class="field"><label class="field-label">Repeat episode bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.episodes??10}" onchange="App.updateRepeatUnitXP('episodes',this.value)"></div>
      <div class="field"><label class="field-label">Repeat chapter bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.chapters??3}" onchange="App.updateRepeatUnitXP('chapters',this.value)"></div>
    </div>
    <div class="field-row">
      <div class="field"><label class="field-label">Repeat issue bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.issues??6}" onchange="App.updateRepeatUnitXP('issues',this.value)"></div>
      <div class="field"><label class="field-label">Repeat movie bonus XP</label><input type="number" min="0" value="${l.repeatUnitXP?.movies??30}" onchange="App.updateRepeatUnitXP('movies',this.value)"></div>
    </div>
    <div class="field"><label class="field-label">Full title rewatch / reread XP</label><input type="number" min="0" value="${l.fullRepeatXP??50}" onchange="App.updateLeveling('fullRepeatXP',this.value)"><small class="hint">Awarded each time your logged repeat units complete another full Library title. Regular minute/unit consumption XP still applies, so this is an additional repeat reward.</small></div>
    <div class="hint" style="margin:-4px 0 14px">Tracked repeats: <b>${r.repeatUnits.toLocaleString()}</b> repeat units · <b>${r.fullRepeats.toLocaleString()}</b> full rewatches/rereads · <b>${r.repeatBonusXP.toLocaleString()} XP</b> in repeat bonuses. Manual past-repeat corrections remain history-only and do not create repeat XP.</div>`;

  if(h.includes(rotationMarker) && !h.includes('Full title rewatch / reread XP')){
    h=h.replace(rotationMarker,repeatFields+rotationMarker);
  }

  h=h.replace(
    'Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild detectable logged-completion bonuses, and refresh every Level/XP display.',
    'Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild logged-completion bonuses, recalculate repeat-unit/full-rewatch XP, and refresh every Level/XP display.'
  );
  h=h.replace(
    'Merge cloud + local Library, History, Library History, completion data and all XP ledgers; then refresh progression/scheduler calculations and upload one complete protected state.',
    'Merge cloud + local Library, History, Library History, completion data, repeat data and all XP; then refresh progression/scheduler calculations and upload one complete protected state.'
  );
  return h;
};


/* ============================================================
   MediaFlow v123 — Dashboard Rating Queue + Rating XP
   - Shows one unrated Library title at a time directly below Stopwatch.
   - Confirm & Next saves the existing 0–10 MediaFlow rating and advances.
   - Skip rotates the title to the back of the in-memory queue, so it returns later.
   - Rating through this queue awards configurable one-time Rating XP.
   - The rating change and XP are written to Library History through the normal
     transaction/activity system and remain undoable.
   ============================================================ */

DEFAULT_SETTINGS.leveling.ratingXP=Number.isFinite(Number(DEFAULT_SETTINGS.leveling.ratingXP))
  ? Math.max(0,Number(DEFAULT_SETTINGS.leveling.ratingXP))
  : 10;

const v123EnsureXPStateBase=v120EnsureXPState;
v120EnsureXPState=function(){
  v123EnsureXPStateBase();
  S.settings=S.settings||{};
  S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings.leveling||{});
  if(!Number.isFinite(Number(S.settings.leveling.ratingXP))) S.settings.leveling.ratingXP=10;
  S.xpLedger=S.xpLedger||{};
  if(!S.xpLedger.ratings || typeof S.xpLedger.ratings!=='object' || Array.isArray(S.xpLedger.ratings)) S.xpLedger.ratings={};
};

function v123RatingXPValue(){
  return Math.max(0,Math.round(Number(levelingSettings().ratingXP)||0));
}
function v123AwardRatingXP(id){
  if(!id)return 0;
  v120EnsureXPState();
  const ledger=S.xpLedger.ratings;
  if(Object.prototype.hasOwnProperty.call(ledger,id))return 0;
  const xp=levelingSettings().enabled===false?0:v123RatingXPValue();
  ledger[id]=xp; // Store even 0 so changing Settings cannot re-award an old rating.
  return xp;
}
function v123RatingLedgerXP(ledger=S.xpLedger){
  return Object.values(ledger?.ratings||{}).reduce((a,v)=>a+(Number(v)||0),0);
}

// Rating XP participates in the same lifetime progression source of truth.
const v123ExtraLibraryXPBase=v46ExtraLibraryXP;
v46ExtraLibraryXP=function(){ return v123ExtraLibraryXPBase()+v123RatingLedgerXP(); };
libraryXPTotal=function(){ return v46LibraryBaseXP()+v46ExtraLibraryXP(); };

// Keep progression breakdowns / full JSON exports aware of the new source.
const v123XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v123XPBreakdownBase();
  const ratingXP=v123RatingLedgerXP();
  const ratingRewards=Object.keys(S.xpLedger?.ratings||{}).length;
  return Object.assign({},b,{total:(Number(b.total)||0)+ratingXP,ratingXP,ratingRewards});
};

// Library History calculates XP from before/after transaction snapshots.
const v123SnapshotXPBase=v50SnapshotXP;
v50SnapshotXP=function(x){
  const base=v123SnapshotXPBase(x);
  if(base==null)return base;
  return base+v123RatingLedgerXP(x?.xpLedger||{});
};

// Preserve Rating XP independently when Sync now merges local + cloud state.
const v123MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v123MergeStatesBase(a,b)||{};
  out.xpLedger=out.xpLedger||{};
  out.xpLedger.ratings=Object.assign({},b?.xpLedger?.ratings||{},a?.xpLedger?.ratings||{});
  return out;
};

let V123_RATING_QUEUE=[];
let V125_RATING_QUEUE_LOADED=false;
function v125RatingQueueStorageKey(){
  const userId=String(AUTH_USER?.id||'local');
  return `mf_rating_queue_v125_${userId}`;
}
function v125LoadRatingQueue(){
  if(V125_RATING_QUEUE_LOADED)return;
  V125_RATING_QUEUE_LOADED=true;
  try{
    const raw=localStorage.getItem(v125RatingQueueStorageKey());
    const parsed=raw?JSON.parse(raw):[];
    V123_RATING_QUEUE=Array.isArray(parsed)?parsed.map(String).filter(Boolean):[];
  }catch(_){
    V123_RATING_QUEUE=[];
  }
}
function v125SaveRatingQueue(){
  try{
    localStorage.setItem(
      v125RatingQueueStorageKey(),
      JSON.stringify(V123_RATING_QUEUE.map(String))
    );
  }catch(_){ }
}
function v123UnratedItems(){
  return (S.library||[]).filter(i=>i?.id && !(Number(i.rating)>0));
}
function v123SyncRatingQueue(){
  v125LoadRatingQueue();
  const unrated=v123UnratedItems();
  const valid=new Set(unrated.map(i=>String(i.id)));

  // Keep the saved order exactly where the user left it, while removing titles
  // that are now rated/deleted and appending newly-unrated titles at the end.
  V123_RATING_QUEUE=V123_RATING_QUEUE.map(String).filter(id=>valid.has(id));
  const present=new Set(V123_RATING_QUEUE);
  for(const item of unrated){
    const id=String(item.id);
    if(!present.has(id)){
      V123_RATING_QUEUE.push(id);
      present.add(id);
    }
  }
  v125SaveRatingQueue();
  return unrated;
}
function v123CurrentRatingItem(){
  v123SyncRatingQueue();
  const id=V123_RATING_QUEUE[0];
  return id?(S.library||[]).find(i=>String(i?.id||'')===String(id)):null;
}
function v123StatusLabel(v){return v199StatusLabel(v);}
function v123RatingQueueHtml(){
  const unrated=v123SyncRatingQueue();
  if(!(S.library||[]).length){
    return `<div class="card v123-rating-queue"><div class="section-label">RATE YOUR LIBRARY</div><div class="v123-rating-done"><b>No Library titles yet</b><span>Add titles to your Library and unrated titles will appear here.</span></div></div>`;
  }
  if(!unrated.length){
    return `<div class="card v123-rating-queue"><div class="section-label">RATE YOUR LIBRARY</div><div class="v123-rating-done"><b>All Library titles are rated ✓</b><span>If a rating is removed later, that title will automatically return to this queue.</span></div></div>`;
  }
  const item=v123CurrentRatingItem();
  if(!item)return '';
  const cat=getCategory(item.categoryId),cover=item.coverUrl
    ? `<img class="v123-rating-cover v181-title-cover-clickable" data-library-id="${escapeHtml(String(item.id))}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(cleanTitle(item.title))} cover" loading="lazy" title="Open title details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')" onerror="this.style.display='none'">`
    : `<button type="button" class="v123-rating-placeholder v186-rating-placeholder-button" title="Open title details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')">${v144CategoryIconHtml(cat)}</button>`;
  const progress=item.total!=null?`${Number(item.progress)||0}/${Number(item.total)||0}`:`${Number(item.progress)||0} ${unitLabel(cat?.unit||'units',Number(item.progress)||0)}`;
  const alreadyRewarded=Object.prototype.hasOwnProperty.call(S.xpLedger?.ratings||{},item.id);
  const xp=alreadyRewarded?0:(levelingSettings().enabled===false?0:v123RatingXPValue());
  const xpText=alreadyRewarded?'Rating XP for this title was already earned.':(levelingSettings().enabled===false?'Leveling is disabled — rating will still be saved and added to History.':`Confirming this first rating earns +${xp.toLocaleString()} XP.`);
  return `<div class="card v123-rating-queue">
    <div class="v123-rating-head"><div><div class="section-label">RATE YOUR LIBRARY</div></div><div class="v123-rating-count">${unrated.length.toLocaleString()} unrated title${unrated.length===1?'':'s'} remaining</div></div>
    <div class="v123-rating-main">${cover}<div class="v123-rating-copy">
      <div class="v123-rating-title">${escapeHtml(cleanTitle(item.title))}</div>
      <div class="v123-rating-meta">${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Library')} · ${escapeHtml(v123StatusLabel(item.status))} · ${escapeHtml(progress)}</div>
      <div class="v123-rating-control">
        <div class="field"><label class="field-label">YOUR RATING / 10</label><input id="v123-rating-input" type="number" min="0.1" max="10" step="0.1" inputmode="decimal" placeholder="e.g. 8.5" onkeydown="if(event.key==='Enter'){event.preventDefault();App.v123ConfirmRating()}"></div>
        <div class="v123-rating-actions"><button type="button" class="btn btn-ghost" onclick="App.openLibraryModal('${escapeHtml(String(item.id))}')">Edit title</button><button type="button" class="btn btn-ghost" onclick="App.v123SkipRating()">Skip</button><button type="button" class="btn btn-primary" onclick="App.v123ConfirmRating()">Confirm & Next</button></div>
      </div>
      <div class="v123-rating-xp">${escapeHtml(xpText)} Skip gives no XP and moves this title behind the rest of the queue. Your queue position is remembered after refresh.</div>
    </div></div>
  </div>`;
}

function v123SkipRating(){
  v123SyncRatingQueue();
  if(!V123_RATING_QUEUE.length)return;
  const first=V123_RATING_QUEUE.shift();
  V123_RATING_QUEUE.push(first);
  v125SaveRatingQueue();
  render();
  showToast(V123_RATING_QUEUE.length>1?'Skipped for now · this title will return after the rest of the queue':'Skipped · this is the only unrated title remaining');
}
function v123ConfirmRating(){
  const item=v123CurrentRatingItem();
  if(!item)return;
  const input=document.getElementById('v123-rating-input');
  const raw=String(input?.value??'').trim();
  if(!raw){
    v123SkipRating();
    return;
  }
  let rating=Number(raw);
  if(!Number.isFinite(rating) || rating<=0 || rating>10){
    showToast('Enter a rating from 0.1 to 10.');
    try{input?.focus();}catch(_){ }
    return;
  }
  rating=Math.round(rating*10)/10;
  const beforeXP=mediaFlowXP();
  mfBegin('Rate title',cleanTitle(item.title));
  item.rating=rating;
  const reward=v123AwardRatingXP(item.id);
  mfCommit('Rate title',`${cleanTitle(item.title)} · ${rating}/10`);
  V123_RATING_QUEUE=V123_RATING_QUEUE.filter(id=>String(id)!==String(item.id));
  v125SaveRatingQueue();
  const gained=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
  render();
  showToast(`Rated ${cleanTitle(item.title)} ${rating}/10${gained?` · +${gained.toLocaleString()} XP`:''} ✓`);
}
Object.assign(App,{v123SkipRating,v123ConfirmRating});

// Place the queue exactly under the existing Stopwatch section on Dashboard.
const v123StopwatchHtmlBase=stopwatchHtml;
stopwatchHtml=function(){ return v123StopwatchHtmlBase()+v123RatingQueueHtml(); };

// Keep Leveling & XP Settings aligned with the new one-time rating reward.
const v123SettingsBase=renderSettings;
renderSettings=function(){
  v120EnsureXPState();
  let h=v123SettingsBase();
  const l=levelingSettings(),ratingXP=v123RatingLedgerXP(),ratingRewards=Object.keys(S.xpLedger?.ratings||{}).length;
  h=h.replace(
    'Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, rewatches/rereads, cover work, and rotation health.',
    'Control XP from time, media units, Library additions, title edits, ratings, completed Library titles, logged completions, rewatches/rereads, cover work, and rotation health.'
  );
  const marker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">REWATCH / REREAD XP</div>';
  const ratingField=`<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">RATING XP</div><div class="field"><label class="field-label">Rate Library title XP</label><input type="number" min="0" value="${l.ratingXP??10}" onchange="App.updateLeveling('ratingXP',this.value)"><small class="hint">One-time XP awarded when an unrated title is confirmed through the Dashboard rating queue. Removing and rating it again cannot farm XP.</small></div><div class="hint" style="margin:-4px 0 14px">Rating rewards earned: <b>${ratingRewards.toLocaleString()}</b> title${ratingRewards===1?'':'s'} · <b>${ratingXP.toLocaleString()} XP</b>.</div>`;
  if(h.includes(marker)&&!h.includes('Rate Library title XP'))h=h.replace(marker,ratingField+marker);
  h=h.replace(
    'Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild logged-completion bonuses, recalculate repeat-unit/full-rewatch XP, and refresh every Level/XP display.',
    'Rescan the entire Library and History, recalculate consumption XP, verify completed titles, preserve one-time rating rewards, rebuild logged-completion bonuses, recalculate repeat-unit/full-rewatch XP, and refresh every Level/XP display.'
  );
  h=h.replace(
    'Merge cloud + local Library, History, Library History, completion data, repeat data and all XP; then refresh progression/scheduler calculations and upload one complete protected state.',
    'Merge cloud + local Library, History, Library History, completion data, rating rewards, repeat data and all XP; then refresh progression/scheduler calculations and upload one complete protected state.'
  );

  return h;
};

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


/* ============================================================
   MediaFlow v134 — Calculate XP + Sync Now Performance
   ------------------------------------------------------------
   Behavior / XP formulas are unchanged. The heavy repair/sync path now:
   - indexes completion evidence once instead of rescanning all History per title;
   - uses O(1) Library-ID lookups for repeat History instead of repeated .find();
   - time-slices large History / Library loops so Chromium can repaint;
   - removes the redundant first scheduler-balance pass;
   - prevents Calculate XP and Sync Now from overlapping;
   - reuses one full-state JSON serialization for cloud compression + v115 caches.
   ============================================================ */

let V134_HEAVY_OPERATION='';

function v134Yield(){
  return new Promise(resolve=>{
    if(typeof requestAnimationFrame==='function'){
      requestAnimationFrame(()=>setTimeout(resolve,0));
    }else{
      setTimeout(resolve,0);
    }
  });
}

function v134ProgressRange(start,end,ratio){
  const a=Number(start)||0,b=Number(end)||a;
  return Math.round(a+(b-a)*Math.max(0,Math.min(1,Number(ratio)||0)));
}

function v134LegacyCompletionKey(title,categoryId){
  // Preserve v120's strict category equality by keeping category type in the key.
  return `${cleanTitle(title).toLowerCase()}::${typeof categoryId}:${String(categoryId??'')}`;
}

async function v134BuildCompletionEvidenceIndex(progressStart,progressEnd){
  const byId=new Map(),byLegacy=new Map();
  const sessions=S.sessions||[];
  const total=Math.max(1,sessions.length);

  const push=(map,key,ts)=>{
    if(!key)return;
    let arr=map.get(key);
    if(!arr){arr=[];map.set(key,arr);}
    arr.push(ts);
  };

  for(let i=0;i<sessions.length;i++){
    const s=sessions[i];
    if(s && s.status!=='skipped'){
      const ts=Number(s.timestamp)||0;
      for(const t of (s.titles||[])){
        // v120 could match by Library ID even when an old History title string
        // was empty/missing. Preserve that exact behavior; title is required
        // only for the legacy no-ID fallback.
        if(t?.libraryId){
          push(byId,String(t.libraryId),ts);
        }else if(t?.title){
          push(byLegacy,v134LegacyCompletionKey(t.title,s.categoryId),ts);
        }
      }
    }

    if(i && i%300===0){
      updateDataProgress(
        v134ProgressRange(progressStart,progressEnd,i/total),
        `Indexing completion History… ${i.toLocaleString()} / ${sessions.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }

  return {byId,byLegacy};
}

function v134HasCompletionEvidence(list,completedAt){
  if(!list || !list.length)return false;
  const target=Number(completedAt)||0;
  if(!target)return true;
  const windowMs=5*60*1000;
  for(const ts of list){
    if(Math.abs((Number(ts)||0)-target)<=windowMs)return true;
  }
  return false;
}

async function v134RebuildLoggedCompletionLedger(progressStart,progressEnd){
  v120EnsureXPState();

  // v120AwardLoggedCompletionXP intentionally awards nothing while leveling is off.
  // Preserve that behavior and avoid building a large index unnecessarily.
  if(levelingSettings().enabled===false)return 0;

  const indexEnd=progressStart+(progressEnd-progressStart)*0.58;
  const index=await v134BuildCompletionEvidenceIndex(progressStart,indexEnd);
  const library=S.library||[];
  const total=Math.max(1,library.length);
  const ledger=S.xpLedger.logCompletions;
  const xp=v120LoggedCompletionXP();
  let added=0;

  for(let i=0;i<library.length;i++){
    const item=library[i];
    if(item?.id && v120IsCompleted(item) && !Object.prototype.hasOwnProperty.call(ledger,item.id)){
      const completedAt=Number(item.completedAt)||0;
      const idMatch=v134HasCompletionEvidence(index.byId.get(String(item.id)),completedAt);
      const legacyMatch=idMatch?false:v134HasCompletionEvidence(
        index.byLegacy.get(v134LegacyCompletionKey(item.title,item.categoryId)),
        completedAt
      );

      if(idMatch||legacyMatch){
        // Same one-time ledger semantics as v120AwardLoggedCompletionXP,
        // but state/settings were already normalized once above.
        ledger[item.id]=xp;
        added++;
      }
    }

    if(i && i%750===0){
      updateDataProgress(
        v134ProgressRange(indexEnd,progressEnd,i/total),
        `Checking completed titles… ${i.toLocaleString()} / ${library.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }
  return added;
}

function v134LibraryById(){
  const map=new Map();
  for(const item of (S.library||[])){
    const key=String(item?.id||'');
    // Array.find() returned the first match in v121; retain that exact preference.
    if(key && !map.has(key))map.set(key,item);
  }
  return map;
}

function v134PrepareRepeatRows(){
  return (S.sessions||[]).map((s,index)=>({
    s,
    index,
    time:v121SessionTime(s)
  })).sort((a,b)=>{
    const d=a.time-b.time;
    return d||a.index-b.index;
  });
}

function v134RepeatContext(){
  v121EnsureRepeatSettings();
  const l=levelingSettings();
  return {
    l,
    enabled:l.enabled!==false,
    libraryById:v134LibraryById(),
    running:new Map(),
    repeatUnits:0,
    fullRepeats:0,
    unitBonusXP:0,
    fullRepeatBonusXP:0,
    repeatSessions:0
  };
}

function v134ProcessRepeatRow(row,ctx){
  const s=row?.s;
  if(!s || s.status==='skipped')return;

  let sessionUnits=0,sessionFull=0,sessionUnitXP=0,sessionFullXP=0;

  for(const t of (s.titles||[])){
    if(!t?.repeat)continue;
    const qty=Math.max(0,Number(t.qty)||0);
    if(qty<=0)continue;

    const item=t.libraryId?ctx.libraryById.get(String(t.libraryId))||null:null;
    const unit=getCategory(item?.categoryId||s.categoryId)?.unit||s.unit||'';
    const perUnit=ctx.enabled?Math.max(0,Number(ctx.l.repeatUnitXP?.[unit])||0):0;

    sessionUnits+=qty;
    sessionUnitXP+=qty*perUnit;

    const key=v121RepeatKey(t,s);
    if(key){
      const before=Number(ctx.running.get(key))||0;
      const after=before+qty;
      const total=v121RepeatTotal(t,s,item,unit);
      if(total>0){
        const crossed=Math.max(0,Math.floor(after/total)-Math.floor(before/total));
        if(crossed>0){
          sessionFull+=crossed;
          sessionFullXP+=ctx.enabled?crossed*Math.max(0,Number(ctx.l.fullRepeatXP)||0):0;
        }
      }
      ctx.running.set(key,after);
    }
  }

  if(sessionUnits>0){
    ctx.repeatSessions++;
    const cat=getCategory(s.categoryId);
    const base=calculateConsumptionXP(
      cat,
      Number(s.actualAmount)||0,
      Number(s.minutes)||0,
      s.healthStatus||'healthy'
    ).xp;

    s.repeatUnits=sessionUnits;
    s.fullRepeatsCompleted=sessionFull;
    s.repeatUnitBonusXP=Math.max(0,Math.round(sessionUnitXP));
    s.repeatFullTitleXP=Math.max(0,Math.round(sessionFullXP));
    s.repeatBonusXP=s.repeatUnitBonusXP+s.repeatFullTitleXP;
    s.xp=Math.max(0,Math.round(base+s.repeatBonusXP));

    ctx.repeatUnits+=sessionUnits;
    ctx.fullRepeats+=sessionFull;
    ctx.unitBonusXP+=s.repeatUnitBonusXP;
    ctx.fullRepeatBonusXP+=s.repeatFullTitleXP;
  }else if(
    s.repeatBonusXP!==undefined ||
    s.repeatUnitBonusXP!==undefined ||
    s.repeatFullTitleXP!==undefined ||
    s.repeatUnits!==undefined ||
    s.fullRepeatsCompleted!==undefined
  ){
    const cat=getCategory(s.categoryId);
    s.repeatUnits=0;
    s.fullRepeatsCompleted=0;
    s.repeatUnitBonusXP=0;
    s.repeatFullTitleXP=0;
    s.repeatBonusXP=0;
    s.xp=calculateConsumptionXP(
      cat,
      Number(s.actualAmount)||0,
      Number(s.minutes)||0,
      s.healthStatus||'healthy'
    ).xp;
  }
}

function v134RepeatSummary(ctx){
  return {
    repeatSessions:ctx.repeatSessions,
    repeatUnits:ctx.repeatUnits,
    fullRepeats:ctx.fullRepeats,
    repeatUnitBonusXP:Math.max(0,Math.round(ctx.unitBonusXP)),
    fullRepeatBonusXP:Math.max(0,Math.round(ctx.fullRepeatBonusXP)),
    repeatBonusXP:Math.max(0,Math.round(ctx.unitBonusXP+ctx.fullRepeatBonusXP))
  };
}

// Replace v121's synchronous implementation too, so normal repeat logging/startup
// benefits from indexed Library lookups without changing its synchronous callers.
v121RecalculateRepeatXPHistory=function(){
  const ctx=v134RepeatContext();
  const rows=v134PrepareRepeatRows();
  for(const row of rows)v134ProcessRepeatRow(row,ctx);
  return v134RepeatSummary(ctx);
};

async function v134RecalculateRepeatXPHistoryAsync(progressStart,progressEnd){
  const ctx=v134RepeatContext();
  const rows=v134PrepareRepeatRows();
  const total=Math.max(1,rows.length);

  for(let i=0;i<rows.length;i++){
    v134ProcessRepeatRow(rows[i],ctx);
    if(i && i%300===0){
      updateDataProgress(
        v134ProgressRange(progressStart,progressEnd,i/total),
        `Rebuilding rewatch / reread XP… ${i.toLocaleString()} / ${rows.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }
  return v134RepeatSummary(ctx);
}

async function v134RecalculateXPOptimized(force=false,range={}){
  const start=Number(range.start??10);
  const historyEnd=Number(range.historyEnd??54);
  const completionEnd=Number(range.completionEnd??72);const repeatEnd=Number(range.repeatEnd??84);

  v120EnsureXPState();

  // Stage 1 — same v46 session-XP formula, but with shorter browser time slices.
  const sessions=S.sessions||[];
  const totalSessions=Math.max(1,sessions.length);
  for(let i=0;i<sessions.length;i++){
    const x=sessions[i];
    if(!x || x.status==='skipped'){
      if(x)x.xp=0;
    }else{
      const should=force ||
        !Number.isFinite(Number(x.xp)) ||
        (Number(x.xp)===0 && (Number(x.actualAmount)||0)>0 && (Number(x.minutes)||0)>0);
      if(should){
        const cat=getCategory(x.categoryId);
        x.xp=calculateConsumptionXP(
          cat,
          Number(x.actualAmount)||0,
          Number(x.minutes)||0,
          x.healthStatus||'healthy'
        ).xp;
      }
    }

    if(i && i%300===0){
      updateDataProgress(
        v134ProgressRange(start,historyEnd,i/totalSessions),
        `Calculating History XP… ${i.toLocaleString()} / ${sessions.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }

  // Stage 2 — same v46 completion-timeline repair, time-sliced for large libraries.
  S.completionTimeline=Array.isArray(S.completionTimeline)?S.completionTimeline:[];
  const seen=new Set(S.completionTimeline.map(x=>x?.libraryId).filter(Boolean));
  const library=S.library||[];
  const totalLibrary=Math.max(1,library.length);
  const timelineEnd=historyEnd+(completionEnd-historyEnd)*0.20;

  for(let i=0;i<library.length;i++){
    const item=library[i];
    const complete=item && (
      item.status==='completed' ||
      (item.total!=null && Number(item.total)>0 && Number(item.progress)>=Number(item.total))
    );
    if(complete && !seen.has(item.id)){
      S.completionTimeline.push({
        libraryId:item.id,
        title:cleanTitle(item.title),
        categoryId:item.categoryId,
        completedAt:item.completedAt||item.createdAt||Date.now()
      });
      seen.add(item.id);
    }

    if(i && i%750===0){
      updateDataProgress(
        v134ProgressRange(historyEnd,timelineEnd,i/totalLibrary),
        `Checking completion timeline… ${i.toLocaleString()} / ${library.length.toLocaleString()}`
      );
      await v134Yield();
    }
  }

  // Stage 3 — v120 logged-completion reconstruction using one History index.
  await v134RebuildLoggedCompletionLedger(timelineEnd,completionEnd);

  // Stage 4 — v121 repeat XP with a one-time Library ID map + browser yields.
  await v134RecalculateRepeatXPHistoryAsync(completionEnd,repeatEnd);

  updateDataProgress(repeatEnd,'Finalizing progression totals…');
  await v134Yield();
  return mediaFlowLevelInfo();
}

// Make every current/future caller of the progression-repair function use v134.
v46RecalculateXP=v134RecalculateXPOptimized;

// v46 used to evaluate categoryBalance for every category and then computeScores(),
// which immediately evaluated those balances a second time. computeScores() already
// exercises the complete scheduler formula, so remove that redundant full-history pass.
v46RefreshSchedulerProgress=async function(){
  await v134Yield();
  computeScores([]);
  await v134Yield();
};

function v134OperationBusy(name){
  if(!V134_HEAVY_OPERATION)return false;
  showToast(`${V134_HEAVY_OPERATION==='xp'?'Calculate XP':'Sync Now'} is already running. Please let it finish.`);
  return true;
}

async function v134CalculateXPNow(){
  if(v134OperationBusy('xp'))return;
  V134_HEAVY_OPERATION='xp';
  showDataProgress('Calculate XP now','Preparing optimized progression scan…',4);

  try{
    v120EnsureXPState();
    updateDataProgress(
      8,
      `Checking ${(S.library||[]).length.toLocaleString()} Library titles and ${(S.sessions||[]).length.toLocaleString()} History logs…`
    );

    await v134RecalculateXPOptimized(true,{
      start:10,
      historyEnd:52,
      completionEnd:72,
      repeatEnd:84
    });

    updateDataProgress(87,'Refreshing scheduler balance and health…');
    await v46RefreshSchedulerProgress();

    updateDataProgress(94,'Saving rebuilt progression to protected cloud storage…');
    await saveState();
    await saveQueue;

    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(
      true,
      'XP calculation complete',
      `Level ${info.level} · ${info.xp.toLocaleString()} lifetime XP · ${b.completedTitles.toLocaleString()} completed titles · ${b.repeatUnits.toLocaleString()} repeat units · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · ${b.repeatBonusXP.toLocaleString()} repeat bonus XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'XP calculation failed',friendlyAuthError?.(e)||String(e?.message||e));
  }finally{
    V134_HEAVY_OPERATION='';
  }
}

async function v134SyncNow(){
  if(v134OperationBusy('sync'))return;
  V134_HEAVY_OPERATION='sync';
  showDataProgress('Sync now','Preparing optimized protected synchronization…',4);

  try{
    await saveQueue;

    updateDataProgress(9,'Reading protected cloud state…');
    const remote=await rawGet(STATE_KEY);
    await v134Yield();

    updateDataProgress(20,'Preparing local snapshot…');
    const local=snapshot();
    await v134Yield();

    updateDataProgress(27,'Merging cloud + local Library, History and XP ledgers…');
    const merged=remote?mergeStates(local,remote):local;
    await v134Yield();

    updateDataProgress(34,'Applying merged MediaFlow state…');
    v46ApplyState(merged);
    await v134Yield();

    await v134RecalculateXPOptimized(false,{
      start:38,
      historyEnd:58,
      completionEnd:72,
      repeatEnd:83
    });

    updateDataProgress(87,'Refreshing scheduler balance and health…');
    await v46RefreshSchedulerProgress();

    updateDataProgress(94,'Uploading one complete protected cloud state…');
    await saveState();
    await saveQueue;

    const info=mediaFlowLevelInfo(),b=v120XPBreakdown();
    render();
    finishDataProgress(
      true,
      'Sync complete',
      `${(S.library||[]).length.toLocaleString()} titles · ${(S.sessions||[]).length.toLocaleString()} logs · ${b.completedTitles.toLocaleString()} completed · ${b.fullRepeats.toLocaleString()} full rewatches/rereads · Level ${info.level} · ${info.xp.toLocaleString()} XP`
    );
  }catch(e){
    console.error(e);
    finishDataProgress(false,'Sync failed',String(e?.message||e));
  }finally{
    V134_HEAVY_OPERATION='';
  }
}

App.calculateXPNow=v134CalculateXPNow;
App.syncNow=v134SyncNow;
