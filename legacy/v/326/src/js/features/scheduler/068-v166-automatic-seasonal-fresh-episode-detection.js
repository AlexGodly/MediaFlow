/* ============================================================
   MediaFlow v166 — Automatic Seasonal Fresh-Episode Detection
   ------------------------------------------------------------
   AniList is not used.

   Provider:
   - Jikan v4, which exposes public MyAnimeList data without OAuth/API keys.
   - Exact MAL IDs are preferred.
   - Titles without MAL IDs use a strict exact-title/year resolver once; a
     resolved MAL ID is then stored on the Library title to avoid repeated
     searches.

   Fresh-title definition:
   - Seasonal Anime Library title;
   - not completed/dropped;
   - Jikan's public MAL episode list contains an aired/released episode number
     greater than MediaFlow Library progress.

   Performance:
   - only Seasonal categories are scanned;
   - sequential throttled requests, no request storm;
   - in-memory TTL cache;
   - MAL IDs are persisted for future fast refreshes;
   - one final save/render at most, never per title;
   - provider failure preserves the last good seasonalFreshCount.
   ============================================================ */

const V166_SEASONAL_PROVIDER='Jikan / MyAnimeList';
const V166_JIKAN_BASE='https://api.jikan.moe/v4';
const V166_DEFAULT_SYNC_MINUTES=60;
const V166_MIN_SYNC_MINUTES=15;
const V166_MAX_SYNC_MINUTES=1440;
const V166_CACHE_TTL=20*60*1000;

let V166_SEASONAL_SYNC_RUNNING=false;
let V166_SEASONAL_TIMER=null;
let V166_LAST_JIKAN_REQUEST_AT=0;
let V166_SEASONAL_RUNTIME={
  status:'idle',
  checked:0,
  total:0,
  matched:0,
  freshTitles:0,
  freshEpisodes:0,
  message:'',
  error:'',
  startedAt:0,
  finishedAt:0
};
const V166_JIKAN_CACHE=new Map();

function v166ClampSyncMinutes(value){
  const n=Math.round(Number(value)||V166_DEFAULT_SYNC_MINUTES);
  return Math.max(V166_MIN_SYNC_MINUTES,Math.min(V166_MAX_SYNC_MINUTES,n));
}

function v166EnsureSeasonalSettings(settings){
  const s=(settings&&typeof settings==='object')?settings:{};
  if(typeof s.seasonalFreshAuto!=='boolean')s.seasonalFreshAuto=true;
  s.seasonalFreshSyncMinutes=v166ClampSyncMinutes(s.seasonalFreshSyncMinutes);
  s.seasonalFreshCount=Math.max(0,Math.round(Number(s.seasonalFreshCount)||0));
  s.seasonalFreshLastSyncAt=Math.max(0,Number(s.seasonalFreshLastSyncAt)||0);
  s.seasonalFreshLastProvider=String(s.seasonalFreshLastProvider||V166_SEASONAL_PROVIDER);
  s.seasonalFreshLastMatched=Math.max(0,Math.round(Number(s.seasonalFreshLastMatched)||0));
  s.seasonalFreshLastEpisodeTotal=Math.max(0,Math.round(Number(s.seasonalFreshLastEpisodeTotal)||0));
  return s;
}

v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);

function v166SeasonalCategories(){
  return new Set(
    (S.categories||[])
      .filter(c=>c && (c.seasonal===true || String(c.id)==='seasonal'))
      .map(c=>String(c.id))
  );
}

function v166SeasonalCandidates(){
  const ids=v166SeasonalCategories();
  return (S.library||[]).filter(item=>
    item &&
    ids.has(String(item.categoryId||'')) &&
    item.status!=='completed' &&
    item.status!=='dropped'
  );
}

function v166GetMalId(item){
  const values=[
    item?.externalIds?.mal,
    item?.malId,
    item?.mal_id
  ];
  for(const value of values){
    const s=String(value??'').trim();
    if(/^\d+$/.test(s))return s;
  }
  return '';
}

function v166StoreMalId(item,malId){
  const id=String(malId||'').trim();
  if(!item||!/^\d+$/.test(id))return false;

  item.externalIds=(item.externalIds&&typeof item.externalIds==='object')
    ?item.externalIds:{};

  if(String(item.externalIds.mal||'')===id)return false;

  item.externalIds.mal=id;
  item.modifiedAt=Math.max(Number(item.modifiedAt)||0,Date.now());
  return true;
}

function v166Sleep(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

async function v166JikanThrottle(){
  const gap=430;
  const wait=Math.max(0,gap-(Date.now()-V166_LAST_JIKAN_REQUEST_AT));
  if(wait>0)await v166Sleep(wait);
  V166_LAST_JIKAN_REQUEST_AT=Date.now();
}

async function v166FetchJikan(path,{force=false,ttl=V166_CACHE_TTL}={}){
  const url=path.startsWith('http')?path:`${V166_JIKAN_BASE}${path}`;
  const cached=V166_JIKAN_CACHE.get(url);

  if(!force && cached && Date.now()-cached.at<ttl){
    return cached.data;
  }

  await v166JikanThrottle();

  let lastError=null;

  for(let attempt=0;attempt<3;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),10000);

    try{
      const res=await fetch(url,{
        signal:controller.signal,
        cache:'no-store',
        headers:{Accept:'application/json'}
      });
      clearTimeout(timer);

      if(res.ok){
        const data=await res.json();
        V166_JIKAN_CACHE.set(url,{at:Date.now(),data});
        return data;
      }

      lastError=new Error(`Jikan HTTP ${res.status}`);

      if(![408,429,500,502,503,504].includes(res.status)){
        break;
      }

      const retryAfter=Math.max(0,Number(res.headers.get('Retry-After'))||0);
      await v166Sleep(retryAfter?retryAfter*1000:700*(attempt+1));
    }catch(e){
      clearTimeout(timer);
      lastError=e;
      if(attempt<2)await v166Sleep(500*(attempt+1));
    }
  }

  throw lastError||new Error('Jikan request failed');
}

function v166CandidateYear(item){
  const y=typeof v158ItemYear==='function'?v158ItemYear(item):Number(item?.year);
  return Number.isFinite(Number(y))&&Number(y)>1900?Number(y):null;
}

async function v166ResolveMalId(item,force=false){
  const existing=v166GetMalId(item);
  if(existing)return {malId:existing,stored:false};

  const title=cleanTitle(item?.title||'');
  if(!title)return {malId:'',stored:false};

  const payload=await v166FetchJikan(
    `/anime?q=${encodeURIComponent(title)}&limit=10`,
    {force,ttl:24*60*60*1000}
  );

  let rows=(payload?.data||[]).filter(x=>{
    if(typeof v158ExactTitleCandidate==='function'&&typeof v158JikanTitles==='function'){
      return v158ExactTitleCandidate(item,v158JikanTitles(x));
    }

    const wanted=cleanTitle(item.title||'').toLocaleLowerCase();
    const titles=[
      x?.title,x?.title_english,x?.title_japanese,
      ...(Array.isArray(x?.title_synonyms)?x.title_synonyms:[])
    ].filter(Boolean).map(v=>cleanTitle(v).toLocaleLowerCase());

    return titles.includes(wanted);
  });

  // Seasonal Anime should not accidentally resolve to a movie with the same name.
  const nonMovie=rows.filter(x=>String(x?.type||'').toLowerCase()!=='movie');
  if(nonMovie.length)rows=nonMovie;

  const year=v166CandidateYear(item);
  if(year){
    const sameYear=rows.filter(x=>{
      const candidate=
        Number(x?.year)||
        (x?.aired?.from?new Date(x.aired.from).getFullYear():0);
      return Number(candidate)===year;
    });
    if(sameYear.length)rows=sameYear;
  }

  const unique=new Map();
  for(const x of rows){
    const id=String(x?.mal_id||'');
    if(/^\d+$/.test(id))unique.set(id,x);
  }

  // Safety first: ambiguous title-only matches are skipped, not guessed.
  if(unique.size!==1)return {malId:'',stored:false};

  const malId=[...unique.keys()][0];
  return {malId,stored:v166StoreMalId(item,malId)};
}

function v166AiredEpisodeNumber(row,now=Date.now()){
  const num=Math.max(0,Math.floor(Number(row?.mal_id)||0));
  if(!num)return 0;

  // Current Jikan episode resources commonly contain aired ISO dates.
  // If the field is absent, its presence in the public episode list itself is
  // treated as the provider's released/available signal.
  const aired=row?.aired?new Date(row.aired).getTime():0;
  if(aired && Number.isFinite(aired) && aired>now+5*60*1000)return 0;

  return num;
}

async function v166AvailableEpisodeCount(malId,force=false){
  const first=await v166FetchJikan(
    `/anime/${encodeURIComponent(malId)}/episodes?page=1`,
    {force,ttl:V166_CACHE_TTL}
  );

  const now=Date.now();
  let available=0;

  for(const row of (first?.data||[])){
    available=Math.max(available,v166AiredEpisodeNumber(row,now));
  }

  const lastPage=Math.max(
    1,
    Math.floor(Number(first?.pagination?.last_visible_page)||1)
  );

  // Seasonal titles are normally one page. For long-running titles fetch only
  // the last page instead of walking every historical page.
  if(lastPage>1){
    const last=await v166FetchJikan(
      `/anime/${encodeURIComponent(malId)}/episodes?page=${lastPage}`,
      {force,ttl:V166_CACHE_TTL}
    );

    for(const row of (last?.data||[])){
      available=Math.max(available,v166AiredEpisodeNumber(row,now));
    }
  }

  return available;
}

function v166SeasonalStatusText(){
  const r=V166_SEASONAL_RUNTIME;
  const s=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);

  if(!s.seasonalFreshAuto){
    return `Manual mode · current scheduler value: ${s.seasonalFreshCount} title${s.seasonalFreshCount===1?'':'s'}.`;
  }

  if(r.status==='running'){
    return `Checking ${r.checked.toLocaleString()} / ${r.total.toLocaleString()} Seasonal Anime title${r.total===1?'':'s'}… ${r.matched.toLocaleString()} matched to MyAnimeList.`;
  }

  if(r.status==='error'){
    return `Automatic refresh failed; MediaFlow kept the last good value (${s.seasonalFreshCount}). ${r.error||'Jikan is temporarily unavailable.'}`;
  }

  const when=s.seasonalFreshLastSyncAt
    ?new Date(s.seasonalFreshLastSyncAt).toLocaleString()
    :'not checked yet';

  return `${s.seasonalFreshCount.toLocaleString()} title${s.seasonalFreshCount===1?'':'s'} with fresh episodes · ${s.seasonalFreshLastEpisodeTotal.toLocaleString()} episode${s.seasonalFreshLastEpisodeTotal===1?'':'s'} waiting · ${s.seasonalFreshLastMatched.toLocaleString()} title${s.seasonalFreshLastMatched===1?'':'s'} matched · last checked ${when}.`;
}

function v166UpdateSeasonalStatusDOM(){
  const el=document.getElementById('v166-seasonal-status');
  if(el)el.innerHTML=escapeHtml(v166SeasonalStatusText());

  const bar=document.getElementById('v166-seasonal-progress-fill');
  if(bar){
    const r=V166_SEASONAL_RUNTIME;
    const pct=r.total?Math.round(r.checked/r.total*100):0;
    bar.style.width=`${Math.max(0,Math.min(100,pct))}%`;
  }

  const value=document.getElementById('v166-seasonal-fresh-count');
  if(value)value.value=String(Math.max(0,Number(S.settings?.seasonalFreshCount)||0));

  const button=document.getElementById('v166-seasonal-refresh-btn');
  if(button)button.disabled=V166_SEASONAL_SYNC_RUNNING;
}

async function v166RefreshSeasonalFresh({force=false,notify=false}={}){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);

  if(!settings.seasonalFreshAuto && !force)return null;
  if(V166_SEASONAL_SYNC_RUNNING){
    if(notify)showToast('Seasonal episode refresh is already running.');
    return null;
  }

  V166_SEASONAL_SYNC_RUNNING=true;
  const rows=v166SeasonalCandidates();
  const previousCount=settings.seasonalFreshCount;

  V166_SEASONAL_RUNTIME={
    status:'running',
    checked:0,
    total:rows.length,
    matched:0,
    freshTitles:0,
    freshEpisodes:0,
    message:'',
    error:'',
    startedAt:Date.now(),
    finishedAt:0
  };
  v166UpdateSeasonalStatusDOM();

  let libraryChanged=false;
  let successfulChecks=0;
  let failures=0;

  try{
    for(let i=0;i<rows.length;i++){
      const item=rows[i];

      try{
        const resolved=await v166ResolveMalId(item,force);
        if(resolved.stored)libraryChanged=true;

        if(resolved.malId){
          V166_SEASONAL_RUNTIME.matched++;
          const available=await v166AvailableEpisodeCount(resolved.malId,force);
          successfulChecks++;

          const progress=Math.max(0,Number(item.progress)||0);
          const waiting=Math.max(0,available-progress);

          if(waiting>0){
            V166_SEASONAL_RUNTIME.freshTitles++;
            V166_SEASONAL_RUNTIME.freshEpisodes+=waiting;
          }
        }
      }catch(e){
        failures++;
        console.warn('MediaFlow v166 Seasonal check skipped',item?.title,e);
      }

      V166_SEASONAL_RUNTIME.checked=i+1;
      v166UpdateSeasonalStatusDOM();

      // Yield periodically so a large Seasonal list never locks the UI.
      if(i && i%5===0){
        await new Promise(resolve=>{
          if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>resolve());
          else setTimeout(resolve,0);
        });}
    }

    // If every provider lookup failed, do NOT turn a good old value into zero.
    if(rows.length>0 && successfulChecks===0 && failures>0){
      throw new Error('Jikan did not return any usable episode data this time.');
    }

    settings.seasonalFreshCount=V166_SEASONAL_RUNTIME.freshTitles;
    settings.seasonalFreshLastSyncAt=Date.now();
    settings.seasonalFreshLastProvider=V166_SEASONAL_PROVIDER;
    settings.seasonalFreshLastMatched=V166_SEASONAL_RUNTIME.matched;
    settings.seasonalFreshLastEpisodeTotal=V166_SEASONAL_RUNTIME.freshEpisodes;

    V166_SEASONAL_RUNTIME.status='success';
    V166_SEASONAL_RUNTIME.finishedAt=Date.now();

    // One atomic save only after the whole scan. This carries any newly-resolved
    // MAL IDs plus the scheduler count/settings at once.
    if(libraryChanged){
      try{v53InvalidateLibraryCache();}catch(_){}
    }
    await saveState();

    if(S.view==='settings')render();
    else v166UpdateSeasonalStatusDOM();

    if(notify){
      showToast(
        `${settings.seasonalFreshCount} Seasonal title${settings.seasonalFreshCount===1?'':'s'} with fresh episodes`
      );
    }

    return {
      freshTitles:settings.seasonalFreshCount,
      freshEpisodes:settings.seasonalFreshLastEpisodeTotal,
      matched:settings.seasonalFreshLastMatched,
      previousCount
    };
  }catch(e){
    console.warn('MediaFlow v166 automatic Seasonal refresh failed',e);
    V166_SEASONAL_RUNTIME.status='error';
    V166_SEASONAL_RUNTIME.error=String(e?.message||e);
    V166_SEASONAL_RUNTIME.finishedAt=Date.now();

    // Preserve previous count on failure.
    settings.seasonalFreshCount=previousCount;
    v166UpdateSeasonalStatusDOM();

    if(notify)showToast('Could not refresh Seasonal episodes; last good value was kept.');
    return null;
  }finally{
    V166_SEASONAL_SYNC_RUNNING=false;
    v166UpdateSeasonalStatusDOM();
    v166ScheduleSeasonalRefresh(false);
  }
}

function v166StopSeasonalTimer(){
  clearTimeout(V166_SEASONAL_TIMER);
  V166_SEASONAL_TIMER=null;
}

function v166ScheduleSeasonalRefresh(runSoon=false){
  v166StopSeasonalTimer();

  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  if(!settings.seasonalFreshAuto)return;

  let delay;
  if(runSoon){
    const age=Date.now()-Number(settings.seasonalFreshLastSyncAt||0);
    delay=age>=10*60*1000?4500:Math.max(15000,10*60*1000-age);
  }else{
    delay=v166ClampSyncMinutes(settings.seasonalFreshSyncMinutes)*60*1000;
  }

  V166_SEASONAL_TIMER=setTimeout(()=>{
    V166_SEASONAL_TIMER=null;
    v166RefreshSeasonalFresh({force:false,notify:false});
  },delay);
}

function v166ToggleSeasonalAuto(){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  settings.seasonalFreshAuto=!settings.seasonalFreshAuto;

  if(settings.seasonalFreshAuto){
    persistSettings();
    render();
    v166ScheduleSeasonalRefresh(true);
  }else{
    v166StopSeasonalTimer();
    persistSettings();
    render();
  }
}

function v166SetSeasonalSyncMinutes(value){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  settings.seasonalFreshSyncMinutes=v166ClampSyncMinutes(value);
  persistSettings();
  v166ScheduleSeasonalRefresh(false);
  render();
}

function v166SetManualSeasonalFreshCount(value){
  const settings=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  if(settings.seasonalFreshAuto)return;
  settings.seasonalFreshCount=Math.max(0,Math.round(Number(value)||0));
  persistSettings();
  render();
}

function v166SeasonalSettingsHtml(){
  const s=v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  const auto=s.seasonalFreshAuto!==false;

  return `<div class="field v166-seasonal-auto">
    <div class="v166-seasonal-auto-head">
      <div>
        <label class="field-label">Seasonal — titles with fresh episodes waiting</label>
        <div class="hint">Automatic mode uses Jikan's public MyAnimeList episode data — no AniList API, OAuth token or API key. MediaFlow compares released episode numbers with each Seasonal Anime title's Library progress.</div>
      </div>
      <div class="v166-seasonal-auto-actions">
        <span class="pill">${auto?'Automatic · Jikan':'Manual'}</span>
        <button type="button" class="toggle ${auto?'on':''}" onclick="App.v166ToggleSeasonalAuto()" aria-label="Toggle automatic Seasonal episode detection"></button>
      </div>
    </div>

    <div class="v166-seasonal-grid">
      <div class="field" style="margin:0">
        <label class="field-label">${auto?'Detected fresh titles':'Manual fresh-title count'}</label>
        <input id="v166-seasonal-fresh-count" type="number" min="0"
          value="${Math.max(0,Number(s.seasonalFreshCount)||0)}"
          ${auto?'readonly':''}
          onchange="App.v166SetManualSeasonalFreshCount(this.value)">
      </div>
      <div class="field" style="margin:0">
        <label class="field-label">Check every (minutes)</label>
        <input type="number" min="${V166_MIN_SYNC_MINUTES}" max="${V166_MAX_SYNC_MINUTES}" step="1"
          value="${v166ClampSyncMinutes(s.seasonalFreshSyncMinutes)}"
          ${auto?'':'disabled'}
          onchange="App.v166SetSeasonalSyncMinutes(this.value)">
      </div>
    </div>

    <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:8px">
      <button id="v166-seasonal-refresh-btn" type="button" class="btn btn-sm"
        ${auto?'':'disabled'}
        onclick="App.v166RefreshSeasonalFresh(true)">
        Refresh now
      </button>
      <span class="hint">Unmatched/ambiguous titles are skipped instead of guessed. MAL IDs imported from MAL are used directly and are fastest.</span>
    </div>

    <div id="v166-seasonal-status" class="v166-seasonal-status">${escapeHtml(v166SeasonalStatusText())}</div>
    <div class="v166-seasonal-progress"><span id="v166-seasonal-progress-fill"></span></div>
  </div>`;
}

// Replace the old manual v165 field instead of adding a second setting.
const v166RenderSettingsBase=renderSettings;
renderSettings=function(){
  let h=v166RenderSettingsBase();

  h=h.replace(
    /<div class="field" style="margin-top:4px;">\s*<label class="field-label">Seasonal — titles with fresh episodes waiting<\/label>[\s\S]*?<\/div>\s*(?=<\/div>\s*<div class="section-label settings-section-head"><span>LEVELING)/,
    v166SeasonalSettingsHtml()
  );

  return h;
};

// ---- State normalization / persistence -------------------------------------

const v166PersistSettingsBase=persistSettings;
persistSettings=function(){
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  return v166PersistSettingsBase.apply(this,arguments);
};

const v166LoadAllBase=loadAll;
loadAll=async function(){
  await v166LoadAllBase.apply(this,arguments);
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  v166ScheduleSeasonalRefresh(true);
};

const v166SnapshotBase=snapshot;
snapshot=function(){
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  const x=v166SnapshotBase();
  x.settings=JSON.parse(JSON.stringify(S.settings||DEFAULT_SETTINGS));
  x.cloudSyncVersion=Math.max(Number(x.cloudSyncVersion)||0,166);
  return x;
};

const v166ApplyStateBase=v46ApplyState;
v46ApplyState=function(d){
  const result=v166ApplyStateBase.apply(this,arguments);
  v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS);
  v166ScheduleSeasonalRefresh(true);
  return result;
};

const v166MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v166MergeStatesBase(a,b)||{};
  out.settings=v166EnsureSeasonalSettings(out.settings||{});
  out.cloudSyncVersion=Math.max(
    Number(a?.cloudSyncVersion)||0,
    Number(b?.cloudSyncVersion)||0,
    Number(out.cloudSyncVersion)||0,
    166
  );
  return out;
};

// Verify the automatic scheduler state during protected Sync Now.
const v166VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v166VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v166EnsureSeasonalSettings(
    JSON.parse(JSON.stringify(cloudState?.settings||{}))
  );
  const wanted=v166EnsureSeasonalSettings(
    JSON.parse(JSON.stringify(expected?.settings||{}))
  );

  for(const key of [
    'seasonalFreshAuto',
    'seasonalFreshSyncMinutes',
    'seasonalFreshCount',
    'seasonalFreshLastSyncAt',
    'seasonalFreshLastMatched',
    'seasonalFreshLastEpisodeTotal'
  ]){
    if(String(cloud[key])!==String(wanted[key])){
      problems.push('Automatic Seasonal episode state');
      break;
    }
  }

  return {ok:problems.length===0,missing:[...new Set(problems)]};
};

// Full Backup/Automatic Backup need no new top-level object because all v166
// durable data lives in the canonical Settings object. Explicitly document it.
const v166BuildFullBackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const payload=v166BuildFullBackupBase();

  payload.backupVersion=v161CurrentVersion();
  payload.mediaFlowVersion=v161CurrentVersion();
  payload.settings=JSON.parse(JSON.stringify(
    v166EnsureSeasonalSettings(S.settings||DEFAULT_SETTINGS)
  ));

  payload.backupManifest=v148BackupManifest(
    payload,
    payload.portableExtras||{}
  );

  if(payload.backupManifest){
    payload.backupManifest.note='Complete MediaFlow v166 backup. Includes automatic Seasonal fresh-episode detection settings/last good scheduler value through canonical Settings, plus System Respect XP, adaptive themes, navigation, Library/History, Personal Order, Old System, Rating Queue and portable preferences.';
  }

  return payload;
};

const v166BackupManifestBase=v148BackupManifest;
v148BackupManifest=function(state,extras){
  const manifest=v166BackupManifestBase(state,extras);
  const settings=v166EnsureSeasonalSettings(
    JSON.parse(JSON.stringify(state?.settings||{}))
  );

  manifest.includes=Object.assign({},manifest.includes||{},{
    automaticSeasonalFreshEpisodes:true,
    seasonalFreshSchedulerValue:true,
    seasonalJikanProvider:true
  });
  manifest.counts=Object.assign({},manifest.counts||{},{
    seasonalFreshTitles:settings.seasonalFreshCount,
    seasonalFreshEpisodesWaiting:settings.seasonalFreshLastEpisodeTotal,
    seasonalTitlesMatched:settings.seasonalFreshLastMatched
  });

  return manifest;
};

// Public actions.
App.v166ToggleSeasonalAuto=v166ToggleSeasonalAuto;
App.v166SetSeasonalSyncMinutes=v166SetSeasonalSyncMinutes;
App.v166SetManualSeasonalFreshCount=v166SetManualSeasonalFreshCount;
App.v166RefreshSeasonalFresh=function(force){
  return v166RefreshSeasonalFresh({force:!!force,notify:true});
};

// If the main startup path already ran before this patch's load wrapper became
// relevant, arm a safe delayed refresh anyway.
setTimeout(()=>v166ScheduleSeasonalRefresh(true),5000);



