/* MediaFlow v402 — truthful MAL identification, complete all-source verification,
 * highest verified fresh-count selection and unknown-eligible recommendations.
 * The legacy runner, Automatic 1 and all single-provider modes are unchanged. */
const V402_SOURCE_NAMES=V380_PROVIDER_SEQUENCE.slice();
const V402_EPISODE_AGE=24*60*60*1000;
const V402_PROVIDER_DIAGNOSTICS_LIMIT=400;
function v402Id(value){const t=String(value??'').trim();return /^[1-9]\d*$/.test(t)?t:'';}
function v402Ext(item,key){return v402Id(item?.externalIds?.[key]??item?.[`${key}Id`]);}
function v402ErrorKind(error){
 const k=String(error?.kind||'');
 if(k==='episode_data_unavailable'||Number(error?.status)===404)return 'missing_episode_data';
 if(k==='invalid_response'||k==='graphql_error')return 'invalid_response';
 return 'request_failure';
}
// Existing MAL IDs are independently checked, as are trustworthy saved
// AniList/Kitsu IDs. An explicit disagreement is never silently resolved.
async function v402ResolveIdentity(item,force=false){
 const explicitMal=v166GetMalId(item),anilistId=v402Ext(item,'anilist'),kitsuId=v402Ext(item,'kitsu');
 const evidence=[],errors=[],verifiedMappings=[];
 const tasks=[];
 if(explicitMal)tasks.push((async()=>{
  try{const data=await v166FetchJikan(`/anime/${encodeURIComponent(explicitMal)}`,{force,ttl:24*60*60*1000});
   if(String(data?.data?.mal_id)===String(explicitMal))evidence.push({source:'myanimelist',malId:explicitMal,status:'verified'});
   else errors.push({source:'myanimelist',reason:'Stored MAL ID was not confirmed',kind:'identity_mismatch'});
  }catch(e){errors.push({source:'myanimelist',reason:String(e?.message||e).slice(0,180),kind:v402ErrorKind(e)});}
 })());
 if(anilistId)tasks.push((async()=>{
  try{const query='query ($id:Int){Media(id:$id,type:ANIME){id idMal title{romaji english native} status episodes nextAiringEpisode{episode airingAt} airingSchedule(notYetAired:false,perPage:25){nodes{episode airingAt}}}}';
   const response=await v380Request('https://graphql.anilist.co',{method:'POST',body:JSON.stringify({query,variables:{id:Number(anilistId)}}),force,ttl:3*60*60*1000});
   const media=response?.data?.Media;
   if(Number(media?.id)!==Number(anilistId))throw v380Unavailable('anilist','saved AniList ID was not confirmed');
   const malId=v402Id(media?.idMal);evidence.push({source:'anilist',id:anilistId,malId,status:'verified'});
   if(malId)verifiedMappings.push({source:'anilist',malId});
  }catch(e){errors.push({source:'anilist',reason:String(e?.message||e).slice(0,180),kind:v402ErrorKind(e)});}
 })());
 if(kitsuId)tasks.push((async()=>{
  try{const info=await v380Request(`https://kitsu.io/api/edge/anime/${encodeURIComponent(kitsuId)}`,{force});
   if(String(info?.data?.id)!==String(kitsuId))throw v380Unavailable('kitsu','saved Kitsu ID not confirmed');
   evidence.push({source:'kitsu',id:kitsuId,status:'verified'});
   // This relationship is optional. Its absence does NOT invalidate the ID.
   try{const maps=await v380Request(`https://kitsu.io/api/edge/anime/${encodeURIComponent(kitsuId)}/mappings`,{force});
    const ids=[...new Set((maps?.data||[]).filter(x=>x.attributes?.externalSite==='myanimelist/anime').map(x=>v402Id(x.attributes?.externalId)).filter(Boolean))];
    if(ids.length===1)verifiedMappings.push({source:'kitsu',malId:ids[0]});
   }catch(_){}
  }catch(e){errors.push({source:'kitsu',reason:String(e?.message||e).slice(0,180),kind:v402ErrorKind(e)});}
 })());
 if(!explicitMal)tasks.push((async()=>{
  try{const copy={...item,externalIds:{...(item?.externalIds||{})}};const match=await v377Identify(copy,force);if(match?.malId){verifiedMappings.push({source:'myanimelist-search',malId:String(match.malId)});evidence.push({source:'myanimelist-search',status:'verified',malId:String(match.malId)});}}
  catch(e){errors.push({source:'myanimelist-search',reason:String(e?.message||e).slice(0,180),kind:v402ErrorKind(e)});}
 })());
 await Promise.all(tasks);
 const mapped=[...new Set(verifiedMappings.map(x=>x.malId))];
 const conflict=!!(explicitMal&&mapped.some(id=>id!==explicitMal))||mapped.length>1;
 // An explicit MAL ID remains a usable candidate when MAL is temporarily down.
 // Other providers must independently validate their match before episode data
 // can be called verified; a candidate alone is not a verified MAL match.
 let malId=conflict?'':(explicitMal||mapped[0]||'');
 const verifiedMal=!!malId&&!conflict&&(evidence.some(e=>e.status==='verified'&&e.malId===malId)||verifiedMappings.some(m=>m.malId===malId));
 const manuallyCleared=item?.v377ManualExternalIds&&Object.prototype.hasOwnProperty.call(item.v377ManualExternalIds,'mal')&&item.v377ManualExternalIds.mal===null;
 if(!manuallyCleared&&!explicitMal&&malId&&verifiedMal)v166StoreMalId(item,malId);
 return {malId,verifiedMal,conflict,anilistId,kitsuId,evidence,errors,identified:verifiedMal||evidence.some(e=>e.status==='verified')};
}
function v402AniListAired(media){
 if(!media)return null;
 if(media.status==='NOT_YET_RELEASED')return 0;
 if(media.status==='FINISHED'&&v380ValidPositive(media.episodes))return Number(media.episodes);
 const next=media.nextAiringEpisode,n=v380ValidPositive(next?.episode),when=v380AiredTimestamp(next?.airingAt);
 if(n&&when!==null&&when>Date.now()+5*60*1000)return n-1;
 const aired=(media.airingSchedule?.nodes||[]).filter(x=>v380TodayAired(x?.airingAt)&&v380ValidPositive(x?.episode));
 return aired.length?Math.max(...aired.map(x=>Number(x.episode))):null;
}
async function v402AniListById(id,force){
 const query='query ($id:Int){Media(id:$id,type:ANIME){id idMal status episodes nextAiringEpisode{episode airingAt} airingSchedule(notYetAired:false,perPage:25){nodes{episode airingAt}}}}';
 const data=await v380Request('https://graphql.anilist.co',{method:'POST',body:JSON.stringify({query,variables:{id:Number(id)}}),force,ttl:3*60*60*1000});
 if(Number(data?.data?.Media?.id)!==Number(id))throw v380Unavailable('anilist','saved AniList ID not found');
 const value=v402AniListAired(data.data.Media);
 if(value===null)throw v380Unavailable('anilist','no verified released-episode information');
 return value;
}
async function v402KitsuById(id,force){
 const info=await v380Request(`https://kitsu.io/api/edge/anime/${encodeURIComponent(id)}`,{force});
 if(String(info?.data?.id)!==String(id))throw v380Unavailable('kitsu','saved Kitsu ID not found');
 const attrs=info?.data?.attributes||{};
 if(String(attrs.status).toLowerCase()==='finished'&&v380ValidPositive(attrs.episodeCount))return Number(attrs.episodeCount);
 if(String(attrs.status).toLowerCase()==='tba'||(attrs.startDate&&Date.parse(attrs.startDate)>Date.now()))return 0;
 let offset=0,highest=0,dated=0,undated=0,complete=false;
 const maxPages=Math.min(100,Math.ceil(Math.max(2000,Math.min(20000,Number(attrs.episodeCount)||2000))/20)+1);
 for(let page=0;page<maxPages;page++){
  const data=await v380Request(`https://kitsu.io/api/edge/episodes?filter%5BanimeId%5D=${encodeURIComponent(id)}&page%5Blimit%5D=20&page%5Boffset%5D=${offset}`,{force});
  const entries=Array.isArray(data?.data)?data.data:[];
  for(const entry of entries){const episode=entry.attributes||{},num=v380ValidPositive(episode.number),date=episode.airdate??episode.airDate;
   if(date){dated++;if(num&&v380TodayAired(date))highest=Math.max(highest,num);}else undated++;
  }
  if(entries.length<20){complete=true;break;}offset+=entries.length;
 }
 if(!complete)throw v380Unavailable('kitsu','episode pagination incomplete');
 if(highest)return highest;
 if(dated&&!undated)return 0;
 throw v380Unavailable('kitsu','no verifiable episode air dates');
}
async function v402CheckAllProviders(item,identity,force=false){
 const progress=v401Progress(item);
 const results=await Promise.all(V402_SOURCE_NAMES.map(async source=>{
  const hasMal=!!identity.malId;
  if(!hasMal&&source!=='anilist'&&source!=='kitsu')return {source,status:'unsupported',reason:'Verified MAL mapping required'};
  if(!hasMal&&source==='anilist'&&!identity.anilistId)return {source,status:'unsupported',reason:'No verified AniList ID'};
  if(!hasMal&&source==='kitsu'&&!identity.kitsuId)return {source,status:'unsupported',reason:'No verified Kitsu ID'};
  try{
   const count=!hasMal&&source==='anilist'?await v402AniListById(identity.anilistId,force):
    !hasMal&&source==='kitsu'?await v402KitsuById(identity.kitsuId,force):await V380_ADAPTERS[source](String(identity.malId),force);
   if(!Number.isSafeInteger(count)||count<0)throw v380Unavailable(source,'invalid released-episode count');
   return {source,status:'verified',available:count,fresh:Math.max(0,count-progress)};
  }catch(error){return {source,status:'unknown',kind:v402ErrorKind(error),reason:String(error?.message||error).slice(0,200)};}
 }));
 const valid=results.filter(r=>r.status==='verified');
 const highest=valid.length?Math.max(...valid.map(r=>r.fresh)):0;
 const winners=valid.filter(r=>r.fresh===highest).sort((a,b)=>V402_SOURCE_NAMES.indexOf(a.source)-V402_SOURCE_NAMES.indexOf(b.source));
 const winner=winners[0]||null;
 // A positive is actionable on its own. Negative requires independent
 // affirmative evidence from at least two sources, not simply a timeout.
 const status=highest>0?'fresh':valid.length>=2?'none':'unknown';
 return {status,winner:winner?.source||null,available:winner?.available??null,fresh:highest,results,
  verifiedSources:valid.length,disagreement:new Set(valid.map(r=>r.available)).size>1,
  failures:results.filter(r=>r.kind==='request_failure'||r.kind==='invalid_response'),
  missing:results.filter(r=>r.kind==='missing_episode_data'),checkedAt:Date.now()};
}
const v402LegacyRun=v377RunJikan;
async function v402RunAutomatic2({ids=null,force=false,notify=false}={}){
 const settings=v166EnsureSeasonalSettings(v377EnsureJikanState());
 if(V166_SEASONAL_SYNC_RUNNING){if(notify)showToast('Fresh Episodes check already running.');return null;}
 const all=v166SeasonalCandidates();const filter=ids?new Set(ids.map(String)):null;
 const rows=filter?all.filter(x=>filter.has(String(x.id))):all;
 const full=!filter,oldCount=settings.seasonalFreshCount||0;
 const report=settings.v377JikanResults,ledger=settings.v377JikanLedger;
 const identities=settings.v402MALIdentities||(settings.v402MALIdentities={});
 const unmatched=new Map((full?[]:report.unmatched||[]).map(x=>[String(x.id),x]));
 const failures=new Map((full?[]:report.failures||[]).map(x=>[String(x.id),x]));
 const unavailable=new Map((full?[]:report.unavailable||[]).map(x=>[String(x.id),x]));
 V166_SEASONAL_SYNC_RUNNING=true;
 V166_SEASONAL_RUNTIME={status:'running',checked:0,total:rows.length,matched:0,freshTitles:0,freshEpisodes:0,message:'',error:'',startedAt:Date.now(),finishedAt:0};
 let newMatches=0,changed=false;
 v166UpdateSeasonalStatusDOM();
 try{
  for(const item of rows){
   const id=String(item.id);unmatched.delete(id);failures.delete(id);unavailable.delete(id);
   let identity=null,check=null;
   try{
    const before=v166GetMalId(item);
    identity=await v402ResolveIdentity(item,force);
    identities[id]={malId:identity.malId,verifiedMal:identity.verifiedMal,at:Date.now(),sourceTitle:cleanTitle(item.title||'')};
    if(before!==v166GetMalId(item))changed=true;
    if(identity.verifiedMal){newMatches++;V166_SEASONAL_RUNTIME.matched++;}
    if(identity.conflict){unmatched.set(id,{id,reason:'Conflicting MAL IDs from trusted mappings',v402Identity:identity});}
    else if(!identity.malId&&!identity.anilistId&&!identity.kitsuId){unmatched.set(id,{id,reason:'No verified provider identity available',v402Identity:identity});}
    else {
     check=await v402CheckAllProviders(item,identity,force);
     // A MAL-linked provider can corroborate an existing MAL candidate even
     // when direct Jikan identification was temporarily unavailable.
     if(!identity.verifiedMal&&identity.malId&&!identity.conflict&&check.results.some(x=>x.status==='verified'&&['tenrai','anizip','anilist','kitsu'].includes(x.source))){
      identity.verifiedMal=true;identities[id].verifiedMal=true;V166_SEASONAL_RUNTIME.matched++;
     }
     const identityDetail={malId:identity.malId,verifiedMal:identity.verifiedMal,
       sources:identity.evidence,providerMatch:identity.identified};
     if(check.status==='unknown'){
      const errorCount=check.failures.length;
      const issue={id,reason:errorCount?`${errorCount} request failures; no sufficient verified release data`:'Insufficient verified episode data',
       v402Identity:identityDetail,v402Providers:check.results};
      if(errorCount)failures.set(id,issue);else unavailable.set(id,issue);
      // Keep recently trusted no-fresh evidence across transient errors; it
      // will age out using the same 24h validity rule as normal eligibility.
      const previous=ledger[id],canPreserve=previous&&previous.v401Mode==='automatic2'&&previous.v401Status!=='unknown'
       &&Date.now()-Number(previous.at||0)<=V402_EPISODE_AGE
       &&(!identity.malId||String(previous.malId)===String(identity.malId));
      if(!canPreserve)delete ledger[id];
     }else{
      const record={malId:String(identity.malId||''),sourceTitle:cleanTitle(item.title||''),
       available:check.available,at:check.checkedAt,v380Provider:check.winner||'automatic2',
       v380ProviderAt:check.checkedAt,v401Mode:'automatic2',v401Status:'verified',
       v401Providers:check.results,v401Disagreement:check.disagreement,
       v402Identity:identityDetail,v402Status:check.status,v402Winner:check.winner,
       v402Fresh:check.fresh,v402VerifiedSources:check.verifiedSources};
      ledger[id]=record;
      if(check.fresh>0){V166_SEASONAL_RUNTIME.freshTitles++;V166_SEASONAL_RUNTIME.freshEpisodes+=check.fresh;}
     }
    }
   }catch(error){
    failures.set(id,{id,reason:String(error?.message||error),v402Identity:identity});
    if(!ledger[id]||Date.now()-Number(ledger[id].at||0)>V402_EPISODE_AGE)delete ledger[id];
   }
   V166_SEASONAL_RUNTIME.checked++;
   v166UpdateSeasonalStatusDOM();
   const progress=document.getElementById('mf377-report-progress');
   if(progress)progress.textContent=`Checking ${V166_SEASONAL_RUNTIME.checked}/${rows.length} titles…`;
   if(V166_SEASONAL_RUNTIME.checked%5===0)await v166Sleep(0);
  }
  const active=new Set(all.map(x=>String(x.id)));
  for(const id of Object.keys(ledger))if(!active.has(id))delete ledger[id];
  for(const id of Object.keys(identities))if(!active.has(id))delete identities[id];
  report.unmatched=[...unmatched.values()];report.failures=[...failures.values()];report.unavailable=[...unavailable.values()];report.lastCheckedAt=Date.now();
  let verifiedFreshTitles=0,verifiedFreshEpisodes=0,verifiedNoFresh=0,unknown=0,malMatched=0;
  for(const item of all){
   const id=String(item.id),hit=ledger[id],invalid=report.unmatched.some(x=>String(x.id)===id);
   const identity=identities[id];
   if(!invalid&&(identity?.verifiedMal&&identity?.sourceTitle===cleanTitle(item.title||'')||hit?.v402Identity?.verifiedMal))malMatched++;
   const outcome=v402EpisodeOutcomeFor(item);
   if(outcome==='fresh'){
    verifiedFreshTitles++;verifiedFreshEpisodes+=Math.max(0,Number(hit.available)-v401Progress(item));
   }else if(outcome==='none')verifiedNoFresh++;
   else unknown++;
  }
  const complete=unknown===0&&report.failures.length===0&&report.unavailable.length===0&&report.unmatched.length===0;
  // Do not promote partial aggregates as verified. Show current known coverage
  // while retaining the last *fully certified* aggregate separately.
  if(complete){settings.seasonalFreshCount=verifiedFreshTitles;settings.seasonalFreshLastEpisodeTotal=verifiedFreshEpisodes;
   settings.seasonalFreshLastMatched=malMatched;settings.seasonalFreshLastSyncAt=Date.now();
   settings.seasonalFreshLastProvider=V380_NAMES.automatic2;report.completeBaseline=true;}
  settings.v402FreshScan={mode:'automatic2',at:Date.now(),total:all.length,malMatched,
   verifiedFreshTitles,verifiedFreshEpisodes,verifiedNoFresh,unknown,complete,
   lastTrustedCount:settings.seasonalFreshCount};
  V166_SEASONAL_RUNTIME.status=complete?'success':'partial';
  V166_SEASONAL_RUNTIME.matched=malMatched;
  V166_SEASONAL_RUNTIME.message=complete?'All applicable titles verified.':
   `Partial Alex Godly's Smart Fresh Episodes Engine: ${verifiedFreshTitles} verified fresh titles; ${verifiedNoFresh} verified caught up; ${unknown} unresolved. Trusted total retained (${oldCount}).`;
  V166_SEASONAL_RUNTIME.error=complete?'':V166_SEASONAL_RUNTIME.message;
  V166_SEASONAL_RUNTIME.finishedAt=Date.now();
  if(changed)try{v53InvalidateLibraryCache();}catch(_){}
  await saveState();
  if(v401FilterEnabled())v401ReconcileTask();else v401RestoreUnfilteredTask();
  if(S.view==='settings'||S.view==='dashboard')render();else v166UpdateSeasonalStatusDOM();
  if(document.getElementById('mf377-report-overlay'))v377ShowUnmatchedReport();
  if(notify)showToast(complete?`${verifiedFreshTitles} Seasonal titles have fresh episodes`:
   `Partial verification: ${unknown} unresolved. ${verifiedFreshTitles} titles confirmed fresh.`);
  return {freshTitles:verifiedFreshTitles,matched:malMatched,unmatched:report.unmatched.length,
   failed:report.failures.length,unavailable:report.unavailable.length,complete,unknown,
   verifiedNoFresh,verifiedFreshEpisodes,providerMode:'automatic2'};
 }catch(error){
  V166_SEASONAL_RUNTIME.status='error';V166_SEASONAL_RUNTIME.error=String(error?.message||error);
  V166_SEASONAL_RUNTIME.finishedAt=Date.now();
  if(notify)showToast('Fresh Episodes check interrupted. Saved data was kept.');
  return null;
 }finally{V166_SEASONAL_SYNC_RUNNING=false;v166UpdateSeasonalStatusDOM();}
}
// Only this new mode uses the new runner. Automatic 1 and individual provider
// modes continue using their existing v377/v380/v401 chain unchanged.
v377RunJikan=function(options={}){
 return v380Mode()==='automatic2'?v402RunAutomatic2(options):v402LegacyRun.apply(this,arguments);
};
const v402EpisodeOutcomeOriginal=v401EpisodeOutcome;
function v402EpisodeOutcomeFor(item){
 if(!item)return 'unknown';
 const hit=S.settings?.v377JikanLedger?.[String(item.id)];
 if(v380Mode()==='automatic2'&&hit?.v402Status){
  if(Date.now()-Number(hit.at||0)>V402_EPISODE_AGE)return 'unknown';
  if(hit.malId&&String(v166GetMalId(item))!==String(hit.malId))return 'unknown';
  if(hit.sourceTitle!==cleanTitle(item.title||''))return 'unknown';
  // Release evidence stays fixed until refreshed; eligibility updates instantly
  // as the user logs episodes or corrects saved progress.
  return Number(hit.available)>v401Progress(item)?'fresh':'none';
 }
 return v402EpisodeOutcomeOriginal(item);
}
v401EpisodeOutcome=v402EpisodeOutcomeFor;
// Unknown means "not verified", NOT "confirmed no fresh". This is a user
// requirement: only verified caught-up titles are excluded from recommendations.
v401Eligible=function(item,cat){
 if(!item)return false;
 if(!v401FilterEnabled()||!v401IsSeasonal(cat))return true;
 return String(item.categoryId||'')===String(cat.id||'')&&v402EpisodeOutcomeFor(item)!=='none';
};
v401CurrentStatusMessage=function(cat){
 const pool=(S.library||[]).filter(x=>x&&String(x.categoryId)===String(cat.id)&&x.status!=='completed'&&x.status!=='dropped');
 const unknown=pool.filter(x=>v402EpisodeOutcomeFor(x)==='unknown').length;
 return unknown?'Some Seasonal titles are still awaiting verification; they remain eligible until confirmed caught up.':
  'No eligible Seasonal Anime titles remain under the current recommendation rules.';
};
// Put the SAME saved switch inside Dashboard > Title Recommendations, directly
// beneath the Personal Order row. The v401 checker switch remains synchronized.
const v402RenderSettingsBase=renderSettings;
renderSettings=function(){
 const original=String(v402RenderSettingsBase.apply(this,arguments)||'');
 const host=document.createElement('div');host.innerHTML=original;
 const switchRow=host.querySelector('[data-mf401-filter="recommendations"]');
 const heading=[...host.querySelectorAll('.settings-toggle-row')].find(row=>row.textContent.includes('Prioritize Personal Order'));
 if(switchRow&&heading){
  const note=heading.nextElementSibling;
  const sep=document.createElement('div');sep.className='mf402-recommend-separator';
  if(note&&note.parentElement===heading.parentElement){note.after(sep);sep.after(switchRow);}
  else{heading.after(sep);sep.after(switchRow);}
  switchRow.classList.add('mf402-recommend-setting','settings-toggle-row');
 }
 return host.innerHTML;
};
const v402ReportBase=v377ShowUnmatchedReport;
v377ShowUnmatchedReport=function(){
 const response=v402ReportBase.apply(this,arguments);
 if(v380Mode()==='automatic2'){
  const root=document.getElementById('mf377-report-overlay');
  if(root){root.querySelectorAll('h3,p.hint').forEach(node=>{node.textContent=node.textContent.replace(/from Tenrai/g,'across providers').replace(/Tenrai has not supplied/g,'providers have not supplied');});}
 }
 return response;
};
const v402DiagnosticsBase=v401DiagnosticsHtml;
v401DiagnosticsHtml=function(){
 const main=String(v402DiagnosticsBase.apply(this,arguments)||'');
 if(v380Mode()!=='automatic2')return main;
 const state=S.settings?.v402FreshScan;
 const report=S.settings?.v377JikanResults||{};
 const candidates=[...(report.unmatched||[]),...(report.failures||[]),...(report.unavailable||[])];
 const rows=candidates.slice(0,V402_PROVIDER_DIAGNOSTICS_LIMIT).map(row=>{
  const item=(S.library||[]).find(x=>String(x.id)===String(row.id));
  const sources=row.v402Providers||[];
  return `<details><summary>${escapeHtml(cleanTitle(item?.title||'Unknown title'))} — ${escapeHtml(row.reason||'Unverified')}</summary>${sources.length?
   sources.map(x=>`<div class="mf401-provider-line"><b>${escapeHtml(V380_NAMES[x.source]||x.source)}</b><span>${escapeHtml(x.status==='verified'?`${x.fresh} fresh (${x.available} aired)`:(x.kind||x.status)+': '+(x.reason||'Unavailable'))}</span></div>`).join(''):'<p class="hint">No safe provider identity/episode result.</p>'}</details>`;
 });
 const summary=state?`${state.malMatched}/${state.total} MAL matched · ${state.verifiedFreshTitles} fresh · ${state.verifiedNoFresh} caught up · ${state.unknown} unresolved${state.complete?' · Complete':' · Partial'}`:"Run Alex Godly's Smart Fresh Episodes Engine to get independent identity and episode counts.";
 return `<details class="mf402-coverage"><summary>Alex Godly's Smart Fresh Episodes Engine — Identity & Verification Coverage</summary><p class="hint">${escapeHtml(summary)}. Matched identities are counted separately from episode availability. Partial figures are not certified aggregate counts.</p>${rows.length?`<div class="mf401-diagnostics-list">${rows.join('')}</div>`:''}</details>`+main;
};

// Scan status must not label a preserved aggregate's OLD matched count as the
// current identity-verification result. The v402 summary is independent.
const v402SeasonalStatusBase=v166SeasonalStatusText;
v166SeasonalStatusText=function(){
 if(v380Mode()!=='automatic2')return v402SeasonalStatusBase.apply(this,arguments);
 const scan=S.settings?.v402FreshScan;
 if(!scan)return v402SeasonalStatusBase.apply(this,arguments);
 const trusted=Math.max(0,Number(S.settings?.seasonalFreshCount)||0);
 return scan.complete
  ?`${scan.verifiedFreshTitles} Seasonal titles with fresh episodes · ${scan.verifiedFreshEpisodes} fresh episodes · ${scan.malMatched}/${scan.total} MAL identities verified.`
  :`Partial verification: ${scan.malMatched}/${scan.total} MAL identities matched · ${scan.verifiedFreshTitles} titles confirmed fresh · ${scan.verifiedNoFresh} caught up · ${scan.unknown} unresolved. Previous fully trusted count retained (${trusted}).`;
};
// Never leave the fresh-only preference armed in a restored Manual-mode preset.
const v402NormalizeSettingsBase=v196NormalizeImportedSettings;
v196NormalizeImportedSettings=function(raw){
 const result=v402NormalizeSettingsBase.apply(this,arguments);
 if(result?.seasonalFreshAuto===false)result.v401RecommendFreshOnly=false;
 return result;
};
const v402ProviderSelectionBase=App.v380SetEpisodeProvider;
App.v380SetEpisodeProvider=async function(value){
 const previous=v380Mode();const result=await v402ProviderSelectionBase.apply(this,arguments);
 if(value!==previous&&v380Mode()===value){
  delete S.settings.v402FreshScan;delete S.settings.v402MALIdentities;
  try{await saveState();}catch(e){console.warn('Unable to persist reset of old verification diagnostics',e);}
 }
 return result;
};

window.MediaFlowV402Automatic2={version:402,identity:v402ResolveIdentity,check:v402CheckAllProviders,run:v402RunAutomatic2,
 outcome:v402EpisodeOutcomeFor,providerNames:V402_SOURCE_NAMES.slice()};
MediaFlowRuntime.version=402;
