/* MediaFlow v401 — all-provider released-episode verification and seasonal
 * recommendation gating. Existing v377 ledger, v380 adapters and v180/v287
 * recommendation histories remain the source of truth. */
const V401_RELEASE=401;
const V401_RECOMMEND_SETTING='v401RecommendFreshOnly';
const V401_SCAN_EVIDENCE=new Map();
const V401_SOURCES=V380_PROVIDER_SEQUENCE.slice();
const V401_MAX_RESULT_AGE=24*60*60*1000;
function v401Mode(){return v380Mode();}
function v401AutomaticEnabled(){return S.settings?.seasonalFreshAuto!==false;}
function v401FilterEnabled(){return v401AutomaticEnabled()&&S.settings?.[V401_RECOMMEND_SETTING]===true;}
function v401IsSeasonal(cat){return !!(cat&&(cat.seasonal===true||String(cat.id)==='seasonal'));}
function v401Progress(item){return Math.max(0,Number(item?.progress)||0);}
function v401EpisodeOutcome(item){
 if(!item)return 'unknown';
 const hit=S.settings?.v377JikanLedger?.[String(item.id)];
 const mode=v401Mode();
 // No provider scan can establish that no new episodes are available for a
 // title whose ID changed, or under a different source setting.
 if(!hit||!v377LedgerMatches(item,hit))return 'unknown';
 if(hit.v401Mode!==mode){
  // v400 ledger is compatible only with Automatic 1; older records have no
  // all-provider diagnostics, so never infer v2 verification from them.
  if(!(mode==='automatic'&&!hit.v401Mode&&hit.v380Provider))return 'unknown';
 }
 if(!Number.isFinite(Number(hit.at))||Date.now()-Number(hit.at)>V401_MAX_RESULT_AGE)return 'unknown';
 if(hit.v401Status==='unknown')return 'unknown';
 const available=Number(hit.available);
 if(!Number.isSafeInteger(available)||available<0)return 'unknown';
 if(mode==='automatic2'&&!Array.isArray(hit.v401Providers))return 'unknown';
 return available>v401Progress(item)?'fresh':'none';
}
function v401Eligible(item,cat){
 if(!item)return false;
 if(!v401FilterEnabled()||!v401IsSeasonal(cat))return true;
 return String(item.categoryId||'')===String(cat.id||'')&&v401EpisodeOutcome(item)==='fresh';
}
function v401CurrentStatusMessage(cat){
 const items=(S.library||[]).filter(item=>item&&String(item.categoryId)===String(cat.id)&&item.status!=='completed'&&item.status!=='dropped');
 const unresolved=items.filter(item=>v401EpisodeOutcome(item)==='unknown').length;
 return unresolved
  ?`No confirmed fresh episodes available for recommendation. ${unresolved} Seasonal title${unresolved===1?' is':'s are'} awaiting verification. Refresh Fresh Episodes to check again.`
  :'You are caught up! No Seasonal Anime titles have confirmed fresh episodes available.';
}
// v380 already throttles each provider's network calls and caches HTTP responses.
// Run all applicable adapters for the SAME MAL ID; a valid zero is not an exit.
const v401AvailableBase=v166AvailableEpisodeCount;
v166AvailableEpisodeCount=async function(malId,force=false){
 if(v401Mode()!=='automatic2')return v401AvailableBase.apply(this,arguments);
 const id=String(malId),item=v380AnimeForMal(id),progress=v401Progress(item);
 const checks=await Promise.all(V401_SOURCES.map(async source=>{
  try{
   const available=await V380_ADAPTERS[source](id,force);
   if(!Number.isSafeInteger(available)||available<0)throw v380Unavailable(source,'invalid released episode count');
   return {source,status:'verified',available};
  }catch(error){return {source,status:'unknown',kind:String(error?.kind||'request_error'),reason:String(error?.message||error).slice(0,200)};}
 }));
 const successes=checks.filter(x=>x.status==='verified');
 const failures=checks.filter(x=>x.status!=='verified');
 const positive=successes.filter(x=>x.available>progress);
 const released=positive.length?Math.max(...positive.map(x=>x.available)):successes.length?Math.max(...successes.map(x=>x.available)):null;
 const discrepancies=new Set(successes.map(x=>x.available)).size>1;
 const status=positive.length?'fresh':(!failures.length&&successes.length?'none':'unknown');
 const observation={malId:id,at:Date.now(),mode:'automatic2',status,available:released,
   providers:checks,discrepancies,progressAtCheck:progress};
 V401_SCAN_EVIDENCE.set(id,observation);
 if(status==='unknown'){
  throw v380Unavailable('automatic2',`Unable to verify no fresh episodes: ${failures.map(x=>`${x.source}: ${x.reason}`).join(' | ')||'no usable episode data'}`);
 }
 // A credible released episode from any verified provider can be sufficient,
 // but record other providers' disagreement rather than pretending unanimity.
 const source=successes.find(x=>x.available===released)?.source||'automatic2';
 V380_SOURCE_BY_MAL.set(id,{source,available:released,at:observation.at});
 return released;
};
// Existing v377 runner owns candidate matching, retry, aggregation and save.
// Attach v401 scan provenance only to matching fresh ledger entries.
const v401RunBase=v377RunJikan;
v377RunJikan=async function(options={}){
 if(!V166_SEASONAL_SYNC_RUNNING)V401_SCAN_EVIDENCE.clear();
 const mode=v401Mode();
 const result=await v401RunBase.apply(this,arguments);
 if(!result)return result;
 const ledger=S.settings?.v377JikanLedger||{};
 const report=S.settings?.v377JikanResults||{};
 let annotated=0;
 // A failed new scan must not revive an older verified episode result. The
 // aggregate may keep its last good count, but strict title eligibility is
 // Unknown until this title can be verified again.
 for(const entry of [...(report.failures||[]),...(report.unavailable||[]),...(report.unmatched||[])]){
  const hit=ledger[String(entry?.id||'')];if(hit){hit.v401Status='unknown';hit.v401Mode=mode;annotated++;}
 }
 for(const hit of Object.values(ledger)){
  if(!hit||!hit.malId)continue;
  const evidence=V401_SCAN_EVIDENCE.get(String(hit.malId));
  if(mode==='automatic2'){
   if(!evidence||Number(hit.available)!==evidence.available||Math.abs(Number(hit.at)-evidence.at)>60000)continue;
   hit.v401Mode=mode;hit.v401Status=evidence.status;
   hit.v401Providers=evidence.providers;hit.v401Disagreement=evidence.discrepancies;
   annotated++;
  }else if(hit.v380Provider&&Math.abs(Number(hit.v380ProviderAt)-Number(hit.at))<60000){
   hit.v401Mode=mode;hit.v401Status='verified';
   delete hit.v401Providers;delete hit.v401Disagreement;
   annotated++;
  }
 }
 if(annotated){try{await saveState();}catch(error){console.warn('v401 scan evidence persistence',error);}}
 if(v401FilterEnabled())v401ReconcileTask();else v401RestoreUnfilteredTask();
 if(S.view==='dashboard')render();
 return result;
};
// The original refresh/retry actions call the mutable v377RunJikan binding.

// Backward-compatible pickers: v287 may return a cross-category collection
// queue item. Strict seasonal filtering must be applied AFTER all queue logic.
const v401PickBase=pickLibraryTitle;
pickLibraryTitle=function(cat){
 if(!v401FilterEnabled()||!v401IsSeasonal(cat))return v401PickBase.apply(this,arguments);
 const eligible=(S.library||[]).filter(item=>item&&String(item.categoryId)===String(cat.id)
   &&item.status!=='completed'&&item.status!=='dropped'&&v401Eligible(item,cat));
 if(!eligible.length)return null;
 if(S.settings?.prioritizePersonalOrder&&typeof v287RecommendationSequence==='function'){
  const byId=new Map(eligible.map(item=>[String(item.id),item]));
  for(const item of v287RecommendationSequence(cat.id)){const matched=byId.get(String(item?.id));if(matched)return matched;}
 }
 return eligible.slice().sort((a,b)=>scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat))[0];
};
const v401CandidatesBase=v180RecommendationCandidates;
v180RecommendationCandidates=function(task=S.currentTask){
 const cat=task?getCategory(task.categoryId):null;
 if(!v401FilterEnabled()||!v401IsSeasonal(cat))return v401CandidatesBase.apply(this,arguments);
 const seen=new Set(v180EnsureRecommendationHistory(task).map(x=>String(x.libraryId||'')));
 const eligible=(S.library||[]).filter(item=>item&&String(item.categoryId)===String(cat.id)
  &&item.status!=='completed'&&item.status!=='dropped'&&!seen.has(String(item.id))&&v401Eligible(item,cat));
 if(S.settings?.prioritizePersonalOrder&&typeof v287RecommendationSequence==='function'){
  const rank=new Map(v287RecommendationSequence(cat.id).map((item,index)=>[String(item.id),index]));
  eligible.sort((a,b)=>(rank.get(String(a.id))??Number.MAX_SAFE_INTEGER)-(rank.get(String(b.id))??Number.MAX_SAFE_INTEGER)||scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat));
 }else eligible.sort((a,b)=>scoreLibraryTitle(b,cat)-scoreLibraryTitle(a,cat));
 return eligible;
};
function v401RestoreUnfilteredTask(){
 const task=S.currentTask;
 if(!task||!S.settings?.exactTitleRecommendations||task.libraryId||task.title||v401FilterEnabled())return false;
 const cat=getCategory(task.categoryId);
 if(!v401IsSeasonal(cat))return false;
 const item=pickLibraryTitle(cat);if(!item)return false;
 task.libraryId=item.id;task.title=cleanTitle(item.title);
 if(typeof v287AnnotateTaskOrderSource==='function')v287AnnotateTaskOrderSource(task);
 try{persistTask();}catch(error){console.warn('v401 unfiltered task refresh',error);}
 return true;
}
function v401ReconcileTask(){
 const task=S.currentTask;
 if(!task||!S.settings?.exactTitleRecommendations)return false;
 const cat=getCategory(task.categoryId);
 if(!v401FilterEnabled()||!v401IsSeasonal(cat))return false;
 const current=(S.library||[]).find(x=>String(x.id)===String(task.libraryId));
 if(current&&v401Eligible(current,cat))return false;
 const next=pickLibraryTitle(cat),id=next?next.id:null,title=next?cleanTitle(next.title):null;
 if(task.libraryId===id&&task.title===title)return false;
 task.libraryId=id;task.title=title;
 if(typeof v287AnnotateTaskOrderSource==='function')v287AnnotateTaskOrderSource(task);
 try{persistTask();}catch(error){console.warn('v401 task refresh',error);}
 return true;
}
const v401RenderDashboardBase=renderDashboard;
renderDashboard=function(){if(v401FilterEnabled())v401ReconcileTask();else v401RestoreUnfilteredTask();return v401RenderDashboardBase.apply(this,arguments);};
const v401RecHtmlBase=mf395DashboardRecommendationHtml;
mf395DashboardRecommendationHtml=function(task,cat){
 if(v401FilterEnabled()&&v401IsSeasonal(cat)&&S.settings?.exactTitleRecommendations&&!task?.title)
  return `<section class="mf401-rec-empty" role="status"><strong>Seasonal Anime recommendations</strong><p>${escapeHtml(v401CurrentStatusMessage(cat))}</p><button type="button" class="btn btn-sm" onclick="App.v166RefreshSeasonalFresh(true)">Refresh Fresh Episodes</button></section>`;
 return v401RecHtmlBase.apply(this,arguments);
};
// Some apps have a stored current recommendation while exact-title selection
// is toggled; its next dashboard render goes through the same eligibility gate.

function v401FilterControl(location){
 const active=v401FilterEnabled(),automatic=v401AutomaticEnabled();
 const id=`mf401-filter-${location}`;
 return `<div class="mf401-setting" data-mf401-filter="${location}"><div class="mf401-setting-copy"><label for="${id}">Only recommend titles with fresh episodes</label><small>For Seasonal Anime only. Excludes titles confirmed caught up with aired episodes; titles awaiting verification remain eligible. Manual Fresh Episodes cannot use this filter.</small></div>
   <button id="${id}" type="button" role="switch" class="toggle ${active?'on':''}" aria-checked="${active}" aria-label="Only recommend Seasonal Anime with fresh episodes" ${automatic?'':'disabled aria-disabled="true"'} onclick="App.v401ToggleFreshRecommendations()"></button>
   ${automatic?'':'<small class="mf401-setting-note">Select automatic detection or an individual episode provider to enable.</small>'}</div>`;
}
App.v401ToggleFreshRecommendations=async function(){
 if(!v401AutomaticEnabled()){showToast('Only available with automatic Fresh Episodes detection.');return;}
 const settings=S.settings||(S.settings={});
 settings[V401_RECOMMEND_SETTING]=!settings[V401_RECOMMEND_SETTING];
 if(v401FilterEnabled())v401ReconcileTask();else v401RestoreUnfilteredTask();
 try{await saveState();}catch(error){console.warn('v401 setting persistence',error);}
 render();
};
const v401ToggleManualBase=App.v166ToggleSeasonalAuto;
App.v166ToggleSeasonalAuto=function(){
 const result=v401ToggleManualBase.apply(this,arguments);
 if(!v401AutomaticEnabled()){S.settings[V401_RECOMMEND_SETTING]=false;v401RestoreUnfilteredTask();try{persistSettings();}catch(_){}}
 return result;
};
const v401ProviderBase=App.v380SetEpisodeProvider;
App.v380SetEpisodeProvider=async function(value){
 const result=await v401ProviderBase.apply(this,arguments);
 if(v401FilterEnabled())v401ReconcileTask();else v401RestoreUnfilteredTask();
 if(S.view==='dashboard')render();
 return result;
};
const v401SeasonalHtmlBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){
 const html=String(v401SeasonalHtmlBase.apply(this,arguments)||'');
 return html+v401FilterControl('checker')+v401DiagnosticsHtml();
};
const v401SettingsBase=renderSettings;
renderSettings=function(){
 const html=String(v401SettingsBase.apply(this,arguments)||'');
 const host=document.createElement('div');host.innerHTML=html;
 const label=[...host.querySelectorAll('.section-label')].find(el=>el.textContent.includes('TITLE RECOMMENDATIONS'));
 const card=label?.nextElementSibling;
 if(card&&card.classList.contains('card'))card.insertAdjacentHTML('beforeend',v401FilterControl('recommendations'));
 return host.innerHTML;
};
// Persistent diagnostics: only display actual recorded checks. Provider errors
// are Unknown, not evidence that a title has zero aired episodes.
function v401DiagnosticsHtml(){
 const rows=Object.entries(S.settings?.v377JikanLedger||{}).filter(([,hit])=>hit?.v401Mode==='automatic2'&&Array.isArray(hit.v401Providers));
 if(v401Mode()!=='automatic2')return '';
 const checked=rows.length,withFresh=rows.filter(([,hit])=>Number(hit.available)>0).length;
 const libById=new Map((S.library||[]).map(item=>[String(item.id),item]));
 return `<details class="mf401-diagnostics"><summary>Alex Godly's Smart Fresh Episodes Engine — Verification Details <small>(${checked} checked)</small></summary>
  <p class="hint">These are saved provider results for matched titles. A positive episode count does not automatically mean a fresh episode: Library progress is authoritative. Other providers can still be outdated.</p>
  <div class="mf401-diagnostics-list">${rows.slice(0,150).map(([id,hit])=>{
   const item=libById.get(id),results=hit.v401Providers;
   return `<details><summary>${escapeHtml(cleanTitle(item?.title||hit.sourceTitle||'Unknown title'))} <small>${Number(hit.available)} aired · ${results.filter(x=>x.status==='verified').length}/${results.length} sources${hit.v401Disagreement?' · Disagreement':''}</small></summary><div>${results.map(x=>`<div class="mf401-provider-line"><b>${escapeHtml(V380_NAMES[x.source]||x.source)}</b><span>${x.status==='verified'?`${x.available} aired`: `Unknown · ${escapeHtml(x.reason||'No result')}`}</span></div>`).join('')}</div></details>`;
  }).join('')}</div><small class="hint">${checked>150?'Showing the first 150 titles. ':''}${withFresh} checked titles have at least one reported aired episode.</small></details>`;
}
// v381 used Automatic 1 as the only multi-provider health-summary mode.
// Keep its session health summary coherent with the new all-provider mode.
const v401HealthBase=v381HealthSummaryHtml;
v381HealthSummaryHtml=function(){
 if(v401Mode()!=='automatic2')return v401HealthBase.apply(this,arguments);
 const hostnames={tenrai:new URL(V166_JIKAN_BASE).hostname,anizip:'api.ani.zip',anilist:'graphql.anilist.co',tvmaze:'api.tvmaze.com',kitsu:'kitsu.io'};
 const lines=V401_SOURCES.map(source=>{
  const health=V381_PROVIDER_HEALTH.get(hostnames[source]);
  const detail=!health?'Not checked in this session':health.failed&&(!health.ok||health.reason)?`Last error: ${health.reason}`:'Request succeeded';
  return `<div class="mf381-diagnostics-row"><b>${escapeHtml(V380_NAMES[source])}</b><small>${escapeHtml(detail)}</small></div>`;
 });
 return `<div class="mf381-diagnostics"><strong>Alex Godly's Smart Fresh Episodes Engine — Request Diagnostics</strong><small>Results from this browser session, not a provider uptime guarantee.</small>${lines.join('')}</div>`;
};
// Provider source panel describes the difference without changing Automatic 1.
const v401ProviderSummaryBase=v380ProviderSummaryHtml;
v380ProviderSummaryHtml=function(){
 return String(v401ProviderSummaryBase.apply(this,arguments)||'').replace('Automatic uses Tenrai → AniZip → AniList → TVmaze → Kitsu as needed.',
  "Automatic Multi-Provider uses ordered fallback (Tenrai → AniZip → AniList → TVmaze → Kitsu). Alex Godly's Smart Fresh Episodes Engine checks all five applicable sources per title before finalizing.");
};
window.MediaFlowV401={version:401,providers:[...V380_SOURCES],getMode:v401Mode,getFilter:v401FilterEnabled,
 eligibility:v401EpisodeOutcome,scanEvidence:()=>Object.fromEntries(V401_SCAN_EVIDENCE),getFreshRecommendation:cat=>pickLibraryTitle(cat)};
MediaFlowRuntime.version=V401_RELEASE;
