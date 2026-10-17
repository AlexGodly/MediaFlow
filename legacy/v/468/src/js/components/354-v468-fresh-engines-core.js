/* MediaFlow v468 — two selectable, isolated Fresh Episodes engines.
 * Legacy is the exact v467 implementation: NO mutations to its functions,
 * original ledger, detection methods, provider selection or cloud settings
 * when Legacy is selected. Advanced has separate cloud-backed evidence, mode,
 * verification, scan checkpoints, schedules and preferences.
 */
const MF468_VERSION=468;
const MF468_SYSTEMS=['legacy','advanced'];
const MF468_SOURCES=['smart','automatic','tenrai','anizip','anilist','kitsu','tvmaze','manual'];
const MF468_SETTINGS_DEFAULT=Object.freeze({
 source:'smart',verification:'balanced',refresh:'manual',
 schedules:true,compare:true,includeUnknown:true,freshOnly:false,
 providerOrder:['tenrai','anizip','anilist','tvmaze','kitsu']
});
const MF468_AGE=24*60*60*1000;
const MF468_RUNTIME={
 working:false,stopping:false,checked:0,total:0,updated:0,
 account:'',provider:'',error:'',startedAt:0,finishedAt:0,
 sequence:0,scanAbort:null,heartbeat:null,nextTimer:null
};
function mf468System(){return S.settings?.v468FreshEpisodesSystem==='advanced'?'advanced':'legacy';}
function mf468AdvancedPrefs(){
 const source=S.settings?.v468AdvancedFresh||{};
 const valid=Array.isArray(source.providerOrder)?source.providerOrder:[];
 const ordered=[...new Set(valid.filter(x=>V380_PROVIDER_SEQUENCE.includes(x)))];
 for(const p of V380_PROVIDER_SEQUENCE)if(!ordered.includes(p))ordered.push(p);
 return {...MF468_SETTINGS_DEFAULT,...source,
  source:MF468_SOURCES.includes(source.source)?source.source:'smart',
  verification:source.verification==='maximum'?'maximum':'balanced',
  refresh:['manual','adaptive'].includes(source.refresh)?source.refresh:'manual',
  providerOrder:ordered};
}
function mf468Active(){return mf468System()==='advanced';}
function mf468AutoEnabled(){return mf468Active()?mf468AdvancedPrefs().source!=='manual':mf468LegacyAutomatic();}
function mf468Candidates(){
 return (S.library||[]).filter(i=>i?.id!=null&&
  getCategory(i.categoryId)?.seasonal===true);
}
function mf468Ledger(){return S.settings?.v468AdvancedEpisodeLedger||{};}
function mf468Fingerprint(item){
 if(!item)return '';
 const ids=item.externalIds||{};
 const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
 const trim=s=>String(s??'').trim().toLocaleLowerCase();
 const idkeys=['mal','anilist','kitsu','tvmaze','imdb','tmdb','tvdb'];
 return JSON.stringify([trim(item.title),trim(item.originalTitle),Number(item.year)||0,
  String(item.categoryId||''),idkeys.map(k=>String(ids[k]??item[k+'Id']??'')),
  seasons.map(s=>[s.number,trim(s.name),s.total])]);
}
function mf468Progress(item){
 // v252 syncs the authoritative title aggregate; do not add seasons a
 // second time, or mistake planned season totals for aired episode counts.
 return v401Progress(item);
}
function mf468Entry(item){
 if(!item)return null;
 const entry=mf468Ledger()[String(item.id)];
 if(!entry||entry.fingerprint!==mf468Fingerprint(item)||
  !Number.isFinite(Number(entry.at))||Date.now()-Number(entry.at)>MF468_AGE||
  !Number.isSafeInteger(entry.available)||entry.available<0||
  !['fresh','none'].includes(entry.status))return null;
 return entry;
}
function mf468Outcome(item){
 const entry=mf468Entry(item);
 return !entry?'unknown':entry.available>mf468Progress(item)?'fresh':'none';
}
function mf468FreshReport(item){
 if(!item||getCategory(item.categoryId)?.seasonal!==true||!mf468AutoEnabled())return null;
 const entry=mf468Entry(item),progress=mf468Progress(item);
 if(!entry)return {status:'unknown',count:null,available:null,progress,source:''};
 const count=Math.max(0,entry.available-progress);
 return {status:count?'fresh':'none',count,available:entry.available,progress,
  source:V380_NAMES[entry.winner]||entry.winner||'',confidence:entry.confidence,
  nextEpisode:entry.nextEpisode||null,nextAt:entry.nextAt||null};
}
function mf468Verdict(item,identity,raw,opts=mf468AdvancedPrefs()){
 const replies=(raw?.results||[]).filter(x=>x&&typeof x==='object');
 const signed=!!identity?.verifiedMal||Array.isArray(identity?.evidence)&&identity.evidence.some(e=>e.status==='verified'&&['anilist','kitsu'].includes(e.source));
 const trustworthy=replies.filter(x=>x.status==='verified'&&Number.isSafeInteger(x.available)&&x.available>=0);
 const count=trustworthy.length?Math.max(...trustworthy.map(x=>x.available)):null;
 const winner=trustworthy.filter(x=>x.available===count).sort((a,b)=>
  opts.providerOrder.indexOf(a.source)-opts.providerOrder.indexOf(b.source))[0];
 const disagreement=new Set(trustworthy.map(x=>x.available)).size>1;
 const fresh=count!==null&&count>mf468Progress(item);
 // A single dated/finished-season proof can establish "caught up", exactly
 // like the v403 legacy verifier. Unverified negatives remain UNKNOWN.
 const dated=raw?.v403SingleSourceCertified===true&&raw?.v403Proof?.verified===true;
 const completeNegative=count!==null&&count<=mf468Progress(item)&&
  (trustworthy.length>=2||dated);
 let status=!signed||identity?.conflict?'unknown':
  fresh?'fresh':completeNegative?'none':'unknown';
 // Different media identities/season numbering must never be merged into
 // invented per-season episodes. v380 adapter identity checks are retained.
 const seasons=typeof v252Seasons==='function'?v252Seasons(item):[];
 const seasonAmbiguous=seasons.length>1;
 const nextEpisode=Number(raw?.v403Proof?.upcomingEpisode);
 const nextAt=Number(raw?.v403Proof?.upcomingAt);
 const verifiedDate=dated&&Number.isSafeInteger(nextEpisode)&&nextEpisode>0&&
   Number.isFinite(nextAt)&&nextAt>Date.now();
 const confidence=identity?.conflict?'conflict':status==='unknown'?'unknown':
  disagreement?'disagreement':trustworthy.length>1?'high':'verified';
 return {
  status,available:status==='unknown'?null:count,winner:status==='unknown'?'':winner?.source||'',
  confidence,disagreement,verifiedSources:trustworthy.length,
  identity:{malId:identity?.malId||'',verifiedMal:!!identity?.verifiedMal,
   anilistId:identity?.anilistId||'',kitsuId:identity?.kitsuId||'',
   conflict:!!identity?.conflict},
  seasonAmbiguous,seasonEvidence:seasonAmbiguous?
   'Multiple seasons: title-level aired count only. A per-season breakdown requires verified season mappings.':
   seasons.length===1?'One saved season; no separate season mapping assumed.':'No manual season breakdown.',
  nextEpisode:verifiedDate?nextEpisode:null,nextAt:verifiedDate?nextAt:null,
  providers:replies.slice(0,12).map(x=>({source:String(x.source||''),
   status:String(x.status||'unknown'),available:Number.isSafeInteger(x.available)?x.available:null,
   reason:String(x.reason||'').slice(0,120)})),
  at:Date.now(),fingerprint:mf468Fingerprint(item)
 };
}
async function mf468Schedule(item,identity,entry){
 const opts=mf468AdvancedPrefs();
 if(!opts.schedules||entry?.status==='unknown')return null;
 // Only the CURRENT recommended title gets an optional schedule query by
 // default. In Maximum mode, add verified schedule checks for all items.
 const selected=String(S.currentTask?.libraryId||'')===String(item.id);
 if(!selected&&opts.verification!=='maximum')return null;
 const id=identity?.anilistId||identity?.malId;
 if(!id)return null;
 const native=!!identity?.anilistId;
 const query=native?
  'query ($id:Int){Media(id:$id,type:ANIME){id idMal status nextAiringEpisode{episode airingAt}}}':
  'query ($id:Int){Media(idMal:$id,type:ANIME){id idMal status nextAiringEpisode{episode airingAt}}}';
 try{
  const response=await v380Request('https://graphql.anilist.co',{
   method:'POST',body:JSON.stringify({query,variables:{id:Number(id)}}),
   force:false,ttl:30*60*1000});
  const media=response?.data?.Media;
  if(!media||native&&Number(media.id)!==Number(id)||
    !native&&String(media.idMal)!==String(identity.malId))return null;
  if(identity?.malId&&media.idMal&&String(media.idMal)!==String(identity.malId))return null;
  const episode=Number(media.nextAiringEpisode?.episode),air=v380AiredTimestamp(media.nextAiringEpisode?.airingAt);
  if(!Number.isSafeInteger(episode)||episode<=0||!Number.isFinite(air)||
    air<=Date.now()+5*60000||episode<=entry.available)return null;
  return {nextEpisode:episode,nextAt:air};
 }catch(_){return null;}
}
async function mf468SequentialCheck(item,identity,force,opts){
 // Ordered fallback is truly sequential; unlike Smart, it can stop once
 // dependable release evidence is found. Unconfirmed negative results must
 // continue to another provider rather than pretending to verify zero fresh.
 const result=[],progress=mf468Progress(item);
 let proof=null;
 for(const source of opts.providerOrder){
  if(!identity?.malId&&!(['anilist','kitsu'].includes(source)))continue;
  try{
   const count=!identity.malId&&source==='anilist'&&identity.anilistId?
    await v402AniListById(identity.anilistId,force):
    !identity.malId&&source==='kitsu'&&identity.kitsuId?
    await v402KitsuById(identity.kitsuId,force):
    identity.malId&&V380_ADAPTERS[source]?
    await V380_ADAPTERS[source](identity.malId,force):null;
   if(!Number.isSafeInteger(count)||count<0)throw Error('No usable aired episode count');
   result.push({source,status:'verified',available:count});
   if(count>progress)break;
   if(source==='anilist')proof=await v403VerifyAniListNoFresh(identity,count,force);
   if(proof?.verified||result.filter(row=>row.status==='verified').length>=2)break;
  }catch(e){result.push({source,status:'unknown',reason:String(e?.message||e).slice(0,140)});}
 }
 return {results:result,v403SingleSourceCertified:!!proof?.verified,
  v403Proof:proof};
}
function mf468MediaSupported(item){
 const media=String(item?.universalMetadata?.mediaType||item?.mediaType||
  getCategory(item?.categoryId)?.mediaType||'unspecified').toLowerCase();
 // Existing v380/v402 adapters are verified for ANIME identity/episodes, not
 // for TV seasons, manga chapters, books, games or comic issues.
 return ['anime','unspecified',''].includes(media);
}
async function mf468CheckItem(item,force=false){
 if(!mf468MediaSupported(item))
  return {status:'unknown',reason:'This media type needs a separate verified release adapter',
   fingerprint:mf468Fingerprint(item),at:Date.now(),providers:[]};
 const copy={...item,externalIds:{...(item.externalIds||{})},
  v377ManualExternalIds:item.v377ManualExternalIds?{...item.v377ManualExternalIds}:undefined};
 const identity=await v402ResolveIdentity(copy,force);
 if(identity.conflict||!(identity.verifiedMal||identity.evidence?.some(e=>e.status==='verified'&&['anilist','kitsu'].includes(e.source))))
  return {status:'unknown',reason:'Unverified or conflicting identity',fingerprint:mf468Fingerprint(item),
   at:Date.now(),providers:[],identity:{conflict:!!identity.conflict}};
 const opts=mf468AdvancedPrefs(),source=opts.source;
 let report=null;
 if(source==='smart'){
  // v403 augments the v402 verified checker with genuine airing evidence.
  report=await v402CheckAllProviders(copy,identity,force);
 }else if(source==='automatic'){
  report=await mf468SequentialCheck(copy,identity,force,opts);
 }else if(source==='manual'){
  return {status:'unknown',reason:'Manual detection',fingerprint:mf468Fingerprint(item),at:Date.now()};
 }else{
  try{
   const count=!identity.malId&&source==='anilist'&&identity.anilistId?
    await v402AniListById(identity.anilistId,force):
    !identity.malId&&source==='kitsu'&&identity.kitsuId?
    await v402KitsuById(identity.kitsuId,force):
    identity.malId&&V380_ADAPTERS[source]?
    await V380_ADAPTERS[source](identity.malId,force):null;
   if(!Number.isSafeInteger(count)||count<0)throw Error('No verified count for this provider');
   const proof=count<=mf468Progress(item)&&source==='anilist'?
    await v403VerifyAniListNoFresh(identity,count,force):null;
   report={results:[{source,status:'verified',available:count}],
    v403SingleSourceCertified:!!proof?.verified,v403Proof:proof};
  }catch(e){report={results:[{source,status:'unknown',reason:String(e?.message||e)}]};}
 }
 const result=mf468Verdict(item,identity,report,opts);
 const schedule=await mf468Schedule(item,identity,result);
 if(schedule)Object.assign(result,schedule);
 return result;
}
function mf468Counts(rows=mf468Candidates()){
 let freshTitles=0,freshEpisodes=0,caughtUp=0,unknown=0,conflicts=0,scheduled=0;
 for(const item of rows){
  const entry=mf468Entry(item),status=mf468Outcome(item);
  if(status==='fresh'){freshTitles++;freshEpisodes+=Math.max(0,entry.available-mf468Progress(item));}
  else if(status==='none')caughtUp++;
  else unknown++;
  if(entry?.disagreement)conflicts++;
  if(entry?.nextAt>Date.now())scheduled++;
 }
 return {freshTitles,freshEpisodes,caughtUp,unknown,conflicts,scheduled,total:rows.length};
}
function mf468ScanBusy(){
 return MF468_RUNTIME.working||V166_SEASONAL_SYNC_RUNNING||
  typeof MF466!=='undefined'&&MF466.working||
  typeof MF467!=='undefined'&&MF467.working||
  typeof MF439!=='undefined'&&MF439.working||
  typeof MF424!=='undefined'&&MF424.running||
  typeof MF442!=='undefined'&&MF442.process||
  typeof MF453Quick!=='undefined'&&MF453Quick.current;
}
function mf468RequestStop(){
 if(MF468_RUNTIME.working){MF468_RUNTIME.stopping=true;showToast('Advanced scan will stop after the current title. Completed checks will be saved.');}
}
async function mf468Scan({ids=null,force=false,notify=false}={}){
 if(!mf468Active())return {ok:false,reason:'Advanced engine is not selected'};
 if(mf468AdvancedPrefs().source==='manual')return {ok:false,reason:'Choose an automatic Advanced source'};
 if(mf468ScanBusy())return {ok:false,reason:'Another recovery or Fresh Episodes scan is running'};
 if(typeof navigator!=='undefined'&&!navigator.onLine)return {ok:false,reason:'Offline'};
 if(typeof AUTH_USER==='undefined'||!AUTH_USER||!AUTH_READY||S.loading)
  return {ok:false,reason:'Wait for your account to load'};
 // Reuse existing recovery process ownership. Keep all legacy recovery job
 // locks intact; renew the metadata lease while the Advanced scan runs.
 if(!mf442AcquireProcess('metadata'))return {ok:false,reason:'Another tab owns recovery'};
 if(!mf439AcquireLease()){mf442ReleaseProcess('metadata');return {ok:false,reason:'Another tab owns metadata recovery'};}
 const account=mf439Account(),beforeMode=mf468System();
 const oldAccount=MF439.account,previousWorking=MF439.working;
 const rows=mf468Candidates(),filter=ids?new Set(ids.map(String)):null;
 const selected=filter?rows.filter(x=>filter.has(String(x.id))):rows;
 const ledger={...mf468Ledger()},seq=++MF468_RUNTIME.sequence;
 Object.assign(MF468_RUNTIME,{working:true,stopping:false,checked:0,total:selected.length,
  updated:0,startedAt:Date.now(),finishedAt:0,error:'',account});
 V166_SEASONAL_SYNC_RUNNING=true;MF439.working=true;MF439.account=account;
 MF468_RUNTIME.heartbeat=setInterval(()=>{
  if(!mf442RenewMetadataLease())MF468_RUNTIME.stopping=true;
 },8000);
 let skipped=0,completed=0;
 try{
  for(const item of selected){
   if(MF468_RUNTIME.stopping||seq!==MF468_RUNTIME.sequence||mf468System()!==beforeMode||
    mf439Account()!==account||!mf442MetadataLeaseOwned()||!mf442ProcessOwned('metadata'))break;
   const oldSignature=mf442TitleSignature(item),fingerprint=mf468Fingerprint(item);
   const current=ledger[String(item.id)];
   if(!force&&current?.fingerprint===fingerprint&&Date.now()-Number(current.at||0)<6*60*60*1000){
    skipped++;MF468_RUNTIME.checked++;continue;
   }
   try{
    const result=await mf468CheckItem(item,force);
    if(mf439Account()!==account||mf439Item(item.id)!==item||
      oldSignature!==mf442TitleSignature(item)||fingerprint!==mf468Fingerprint(item)||
      seq!==MF468_RUNTIME.sequence)break;
    // Unverified checks never replace a still-current verified result.
    if(result.status==='unknown'){
     const old=ledger[String(item.id)];
     if(!old||old.fingerprint!==fingerprint||Date.now()-Number(old.at||0)>MF468_AGE)
      delete ledger[String(item.id)];
    }else{
     ledger[String(item.id)]=result;MF468_RUNTIME.updated++;completed++;
    }
   }catch(e){MF468_RUNTIME.error=String(e?.message||e).slice(0,180);}
   MF468_RUNTIME.checked++;
   if(MF468_RUNTIME.checked%10===0){
    if(mf439Account()!==account||mf468System()!==beforeMode)break;
    S.settings.v468AdvancedEpisodeLedger={...ledger};
    try{await saveState();}catch(e){MF468_RUNTIME.error='Cloud checkpoint unsuccessful: '+String(e?.message||e).slice(0,100);}
    if(S.view==='settings')mf468UpdateDashboard();
    await new Promise(resolve=>setTimeout(resolve,0));
   }
  }
  if(mf439Account()===account&&mf468System()===beforeMode){
   // Avoid large unbounded stale evidence accumulation across 100k titles.
   const recent=Object.entries(ledger).sort((a,b)=>Number(b[1]?.at||0)-Number(a[1]?.at||0)).slice(0,20000);
   S.settings.v468AdvancedEpisodeLedger=Object.fromEntries(recent);
   S.settings.v468AdvancedLastCheck={at:Date.now(),checked:MF468_RUNTIME.checked,
    total:selected.length,verified:completed,skipped,
    stopped:MF468_RUNTIME.stopping,mode:mf468AdvancedPrefs().source};
   await saveState();
  }
  const summary=mf468Counts();
  if(notify)showToast('Advanced: '+summary.freshTitles+' fresh titles · '+summary.unknown+' unverified.');
  return {ok:true,checked:MF468_RUNTIME.checked,verified:completed,skipped,
   stopped:MF468_RUNTIME.stopping,summary};
 }catch(e){
  MF468_RUNTIME.error=String(e?.message||e).slice(0,200);
  if(notify)showToast('Advanced Fresh Episodes error: '+MF468_RUNTIME.error);
  return {ok:false,error:MF468_RUNTIME.error,checked:MF468_RUNTIME.checked};
 }finally{
  if(MF468_RUNTIME.heartbeat)clearInterval(MF468_RUNTIME.heartbeat);
  Object.assign(MF468_RUNTIME,{working:false,stopping:false,provider:'',finishedAt:Date.now()});
  V166_SEASONAL_SYNC_RUNNING=false;MF439.working=previousWorking;MF439.account=oldAccount;
  mf439ReleaseLease();mf442ReleaseProcess('metadata');
  if(S.view==='settings'||S.view==='dashboard')render();
 }
}
// Keep the legacy algorithm reference and legacy cloud ledger untouched.
const mf468LegacyRun=v377RunJikan;
v377RunJikan=function(options={}){return mf468Active()?mf468Scan(options):mf468LegacyRun.apply(this,arguments);};
const mf468LegacyAutomatic=v401AutomaticEnabled;
v401AutomaticEnabled=function(){return mf468Active()?mf468AdvancedPrefs().source!=='manual':mf468LegacyAutomatic();};
const mf468LegacyIsSeasonal=v401IsSeasonal;
v401IsSeasonal=function(cat){return mf468Active()?cat?.seasonal===true:mf468LegacyIsSeasonal(cat);};
const mf468LegacyOutcome=v401EpisodeOutcome;
const mf468Legacy402=v402EpisodeOutcomeFor;
v402EpisodeOutcomeFor=function(item){return mf468Active()?mf468Outcome(item):mf468Legacy402.apply(this,arguments);};
v401EpisodeOutcome=function(item){return mf468Active()?mf468Outcome(item):mf468LegacyOutcome.apply(this,arguments);};
const mf468LegacyFilterEnabled=v401FilterEnabled;
v401FilterEnabled=function(){
 return mf468Active()?mf468AutoEnabled()&&mf468AdvancedPrefs().freshOnly===true:
  mf468LegacyFilterEnabled.apply(this,arguments);
};
const mf468LegacyEligible=v401Eligible;
v401Eligible=function(item,cat){
 if(!mf468Active())return mf468LegacyEligible.apply(this,arguments);
 if(!item)return false;
 if(!v401FilterEnabled()||!v401IsSeasonal(cat))return true;
 if(String(item.categoryId||'')!==String(cat.id||''))return false;
 const outcome=mf468Outcome(item);
 return outcome==='fresh'||outcome==='unknown'&&mf468AdvancedPrefs().includeUnknown;
};
const mf468LegacyCategoryFresh=mf419FreshRemaining;
mf419FreshRemaining=function(category){
 if(!mf468Active())return mf468LegacyCategoryFresh.apply(this,arguments);
 if(!category?.seasonal||!mf468AutoEnabled())return null;
 let fresh=0,unknown=0;
 for(const item of S.library||[]){
  if(!item||String(item.categoryId)!==String(category.id))continue;
  const entry=mf468Entry(item),status=mf468Outcome(item);
  if(status==='unknown')unknown++;
  else if(status==='fresh')
   fresh+=Math.max(0,entry.available-mf468Progress(item));
 }
 return {fresh,unknown};
};
const mf468LegacyFreshCard=mf463FreshForRecommendedTitle;
mf463FreshForRecommendedTitle=function(item,cat){
 return mf468Active()?mf468FreshReport(item):mf468LegacyFreshCard.apply(this,arguments);
};
window.MediaFlowV468=Object.freeze({version:468,system:mf468System,advanced:mf468AdvancedPrefs,
 candidates:mf468Candidates,verdict:mf468Verdict,outcome:mf468Outcome,
 entry:mf468Entry,report:mf468FreshReport,counts:mf468Counts,
 scan:mf468Scan,check:mf468CheckItem,stop:mf468RequestStop,
 sequential:mf468SequentialCheck,supports:mf468MediaSupported,
 runtime:()=>({working:MF468_RUNTIME.working,stopping:MF468_RUNTIME.stopping,
  checked:MF468_RUNTIME.checked,total:MF468_RUNTIME.total,error:MF468_RUNTIME.error})});
MediaFlowRuntime.version=MF468_VERSION;
