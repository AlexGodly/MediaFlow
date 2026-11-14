/* MediaFlow v403 — Evidence-qualified single-source No Fresh certification.
 * A single raw episode count does NOT certify a negative result. Existing
 * Automatic 2 multi-provider positives and two-source negatives remain intact.
 * The v402 Automatic 2 checker is patched in-place; Automatic 1 and manual
 * provider modes are not modified. */
const V403_ANILIST_AIRING_QUERY='query ($id:Int){ Media(idMal:$id,type:ANIME){ id idMal status episodes nextAiringEpisode{episode airingAt} airingSchedule(notYetAired:false,perPage:25){nodes{episode airingAt}} } }';
const V403_ANILIST_NATIVE_QUERY='query ($id:Int){Media(id:$id,type:ANIME){id idMal status episodes nextAiringEpisode{episode airingAt} airingSchedule(notYetAired:false,perPage:25){nodes{episode airingAt}}}}';
function v403AiringProof(media,available,identity,byNativeId=false){
 if(!media||!Number.isSafeInteger(available)||available<0)return {verified:false,reason:'No verified episode count'};
 const mal=identity?.malId?String(identity.malId):'';
 const nativeId=identity?.anilistId?String(identity.anilistId):'';
 if(byNativeId){
  if(!nativeId||String(media.id)!==nativeId)return {verified:false,reason:'AniList native identity differs from the saved ID'};
  if(mal&&String(media.idMal)!==mal)return {verified:false,reason:'AniList MyAnimeList mapping conflicts with this anime'};
 }else if(!mal||String(media.idMal)!==mal){
  return {verified:false,reason:'AniList MyAnimeList identity could not be verified'};
 }
 const expectedNext=Number(media?.nextAiringEpisode?.episode);
 const nextAt=v380AiredTimestamp(media?.nextAiringEpisode?.airingAt);
 const now=Date.now();
 const confidence={verified:false,reason:'AniList has no conclusive next-airing date or finalized episode total'};
 // Strong proof: the NEXT numbered episode has an explicit date in the future,
 // and its predecessor is exactly the count supplied by the checked adapter.
 // Do not infer it from a planned episode total or undated programme listing.
 if(Number.isSafeInteger(expectedNext)&&expectedNext>0&&nextAt!==null&&nextAt>now+5*60*1000){
  if(expectedNext-1!==available)return {verified:false,reason:'Next-airing numbering does not match the checked aired count'};
  return {verified:true,kind:'dated_next_airing',available,upcomingEpisode:expectedNext,upcomingAt:nextAt,
   reason:`AniList confirms episode ${expectedNext} will air later; episodes through ${available} are the latest aired.`};
 }
 // A provider explicitly marking an anime FINISHED with a verified, positive
 // final episode total supplies a conclusive upper boundary for that title.
 if(media.status==='FINISHED'&&v380ValidPositive(media.episodes)===available){
  return {verified:true,kind:'finished_series',available,
   reason:`AniList identifies the anime as finished at ${available} episodes.`};
 }
 // A positively identified title marked NOT_YET_RELEASED cannot have aired
 // scheduled episodes. Require an explicit zero count from the adapter.
 if(media.status==='NOT_YET_RELEASED'&&available===0){
  return {verified:true,kind:'not_yet_released',available,
   reason:'AniList confirms that this anime has not started airing.'};
 }
 return confidence;
}
async function v403VerifyAniListNoFresh(identity,available,force=false){
 const id=identity?.malId||identity?.anilistId;
 if(!id)return {verified:false,reason:'No verified AniList or MAL identity'};
 const byNativeId=!identity?.malId;
 const query=byNativeId?V403_ANILIST_NATIVE_QUERY:V403_ANILIST_AIRING_QUERY;
 try{
  // This is precisely the query used by the existing AniList adapter, so
  // v380Request can reuse its response cache unless the scan forces refresh.
  const response=await v380Request('https://graphql.anilist.co',{method:'POST',body:JSON.stringify({query,variables:{id:Number(id)}}),force:false,ttl:3*60*60*1000});
  return v403AiringProof(response?.data?.Media,available,identity,byNativeId);
 }catch(e){return {verified:false,reason:`AniList airing proof unavailable: ${String(e?.message||e).slice(0,160)}`};}
}
const v403CheckAllProvidersBase=v402CheckAllProviders;
v402CheckAllProviders=async function(item,identity,force=false){
 const result=await v403CheckAllProvidersBase.apply(this,arguments);
 if(result?.status!=='unknown'||result.verifiedSources!==1||result.fresh!==0)return result;
 const only=result.results.filter(row=>row.status==='verified');
 if(only.length!==1||only[0].source!=='anilist')return result;
 const proof=await v403VerifyAniListNoFresh(identity,only[0].available,force);
 only[0].v403Proof=proof;
 if(proof.verified&&v401Progress(item)>=only[0].available){
  result.status='none';result.winner='anilist';result.available=only[0].available;
  result.v403SingleSourceCertified=true;result.v403Proof=proof;
 }
 return result;
};
// Make accepted one-provider negatives inspectable instead of silently
// hiding the fact that other providers supplied no usable episode data.
const v403DiagnosticsBase=v401DiagnosticsHtml;
v401DiagnosticsHtml=function(){
 const html=String(v403DiagnosticsBase.apply(this,arguments)||'');
 if(v380Mode()!=='automatic2')return html;
 const ledger=S.settings?.v377JikanLedger||{},all=S.library||[];
 const verified=[];
 for(const item of all){
  const entry=ledger[String(item.id)];
  const source=entry?.v401Providers?.find(p=>p.source==='anilist'&&p.v403Proof?.verified);
  if(!source||v402EpisodeOutcomeFor(item)!=='none')continue;
  verified.push(`<div class="mf401-provider-line"><b>${escapeHtml(cleanTitle(item.title||'Unknown title'))}</b>`+
    `<span>${escapeHtml(source.v403Proof.reason)} · ${source.available} released, ${v401Progress(item)} watched · AniList only</span></div>`);
 }
 if(!verified.length)return html;
 return `<details class="mf402-coverage"><summary>Alex Godly's Smart Fresh Episodes Engine — Single-Source Verified Airing Schedules (${verified.length})</summary>`+
  `<p class="hint">These titles were confirmed caught up by explicit, identity-matched AniList airing evidence even though other providers lacked usable episode lists.</p>`+
  verified.slice(0,60).join('')+(verified.length>60?`<p class="hint">Showing first 60 of ${verified.length} titles.</p>`:'')+
  '</details>'+html;
};
// v402 exports the function reference before our extension runs; keep the
// diagnostic and public test API pointing at the effective runtime checker.
if(window.MediaFlowV402Automatic2){window.MediaFlowV402Automatic2.check=v402CheckAllProviders;}
window.MediaFlowV403={version:403,check:v402CheckAllProviders,
 verifyAniList:v403VerifyAniListNoFresh,airingProof:v403AiringProof};
MediaFlowRuntime.version=403;
