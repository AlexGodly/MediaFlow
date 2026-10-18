/* MediaFlow v495 — Artwork Extraction Reliability, Cache & Consistency
 * Opt-in Advanced / Custom only. No replacement colors or provider calls.
 * Health ledger observes actual pixel reads, never changes source priority,
 * rotation or a selected theme. v485 guards final palette writes.
 */
const MF495_VERSION=495;
const MF495_LEDGER=new Map();
const MF495_EPOCH=new Map();
const MF495_PENDING=new Map();
const MF495_RECENT=[];
const MF495_MAX_LEDGER=80;
const MF495_MAX_EVENTS=20;
const MF495_HEALTH={reads:0,successes:0,failures:0,cooldowns:0,
 reused:0,invalidated:0,stale:0,mismatches:0,errors:0,lastGood:null};
function mf495Url(value){return mf487ValidUrl(value);}
function mf495Key(url){return mf487Key(url);}
function mf495Fingerprint(url,mode=mf484Prefs().mode){
 const u=mf495Url(url);if(!u)return '';
 const hash=v160HashString(mode+'|'+u).map(n=>n.toString(36)).join('-');
 return mode+'-'+hash;
}
function mf495Mode(){return mf484Prefs().mode;}
function mf495Clock(mode){
 return mode==='custom'?
  (typeof MF484_CUSTOM_SEQ!=='undefined'?MF484_CUSTOM_SEQ:0):
  (typeof V146_DYNAMIC_SEQ!=='undefined'?V146_DYNAMIC_SEQ:0);
}
function mf495CurrentSource(){
 const mode=mf495Mode();
 if(mode==='legacy')return '';
 if(mode==='custom'){
  const p=mf484ActiveProfile();
  return p?.source!=='manual'?mf495Url(p?.imageUrl):'';
 }
 return S.settings?.dynamicCoverTheme?
  mf495Url(S.v146DynamicThemeState?.url):'';
}
function mf495Ledger(key){
 let item=MF495_LEDGER.get(key);
 if(!item){
  item={key,reads:0,successes:0,failures:0,cacheHits:0,
   consecutive:0,retryAt:0,lastError:'',lastSuccess:0,
   lastFailure:0,analysisVersion:0,sampleCount:0,confidence:null,
   owner:'',signature:'',lastOutcome:'Not checked'};
  MF495_LEDGER.set(key,item);
 }
 // LRU order, bounded at all times.
 MF495_LEDGER.delete(key);MF495_LEDGER.set(key,item);
 while(MF495_LEDGER.size>MF495_MAX_LEDGER)
  MF495_LEDGER.delete(MF495_LEDGER.keys().next().value);
 return item;
}
function mf495Event(type,record,detail){
 MF495_RECENT.unshift({type,source:record?.key||'unknown',
  at:Date.now(),detail:String(detail||'').slice(0,100)});
 MF495_RECENT.length=Math.min(MF495_MAX_EVENTS,MF495_RECENT.length);
}
function mf495RetryDelay(failures){
 return [0,2000,6500,20000,60000][Math.min(4,Math.max(0,failures))]||60000;
}
function mf495HealthySample(data,url){
 return !!data&&data.visualCoverUrl===url&&data.sourceIntegrity==='pixel-sampled'&&
 !!data.analysis?.sampledFromPixels&&
 Number.isFinite(Number(data.analysis.pixels))&&data.analysis.pixels>=3&&
 Array.isArray(data.colors)&&data.colors.length>=3&&
 data.colors.slice(0,3).every(mf489HexValid);
}
function mf495Quality(data){
 const analysis=data?.analysis||{};
 const pixels=Math.max(0,Number(analysis.pixels)||0);
 const coverage=Math.max(0,Math.min(1,Number(analysis.dominantCoverage)||0));
 const diversity=Math.max(0,Math.min(1,Number(analysis.diversity)||0));
 const contrast=Math.max(0,Math.min(1,Number(analysis.separation)||0));
 // This is coverage/differentiation confidence, NOT a semantic classifier.
 return Math.round(Math.max(0,Math.min(1,
  .27+.20*Math.min(1,pixels/2500)+.21*diversity+
  .17*contrast+.15*(1-Math.abs(coverage-.55))))*100)/100;
}
function mf495Signature(data,url,mode){
 // Covers, source settings and per-cover corrections remain independently
 // versioned; pixel cache is not invalidated merely to change palette roles.
 const identity=mf495Fingerprint(url,mode);
 const focus=typeof mf488FocusFor==='function'?mf488FocusFor(url):'auto';
 const correction=typeof mf493Settings==='function'?
  mf493Settings()[mf493Scope(url,mode)]||null:null;
 const roles=correction?[correction.variant,correction.slots]:null;
 return identity+'|'+v160HashString(JSON.stringify([focus,roles,
  data?.analysisVersion||487])).join('-');
}
const mf495OriginalCacheDelete=mf487CacheDelete;
mf487CacheDelete=function(url){
 const u=mf495Url(url);
 if(u){
  const key=mf495Key(u);
  MF495_EPOCH.set(key,(MF495_EPOCH.get(key)||0)+1);
  MF495_HEALTH.invalidated++;
  for(const mode of ['advanced','custom']){
   const record=MF495_LEDGER.get(mf495Fingerprint(u,mode));
   if(record){record.retryAt=0;record.consecutive=0;
    record.lastOutcome='Pixel cache invalidated';}
  }
  mf495Event('invalidate',{key:mf495Fingerprint(u)},'Artwork pixels can be resampled');
 }
 return mf495OriginalCacheDelete.apply(this,arguments);
};
const mf495OriginalAnalyze=mf484Analyze;
function mf495Analyze(url){
 const mode=mf495Mode();
 if(mode==='legacy')return mf495OriginalAnalyze.apply(this,arguments);
 const u=mf495Url(url);
 if(!u)return Promise.resolve(null);
 const key=mf495Fingerprint(u,mode),pixelKey=mf495Key(u);
 const record=mf495Ledger(key),now=Date.now();
 if(record.retryAt>now){
  MF495_HEALTH.cooldowns++;
  record.lastOutcome='Temporary provider/image cooldown';
  mf495Event('cooldown',record,'Next eligible attempt after cooldown');
  mf495Render();
  return Promise.resolve(null);
 }
 const epoch=MF495_EPOCH.get(pixelKey)||0;
 const generation=mf495Clock(mode);
 const prior=MF495_PENDING.get(key);
 if(prior&&prior.epoch===epoch&&prior.generation===generation){
  MF495_HEALTH.reused++;record.cacheHits++;
  mf495Render();
  return prior.promise;
 }
 record.reads++;MF495_HEALTH.reads++;
 const previously=MF487_STATE.last;
 const promise=Promise.resolve().then(()=>mf495OriginalAnalyze(u))
  .then(value=>{
   const superseded=mf495Mode()!==mode||
    mf495Clock(mode)!==generation||(MF495_EPOCH.get(pixelKey)||0)!==epoch;
   if(superseded){
    MF495_HEALTH.stale++;record.lastOutcome='Outdated artwork result ignored';
    mf495Event('stale',record,'A newer mode, cover or reanalysis owns this request');
    // v487 updates a global last sample on resolution. Do not allow a late
    // stale read to replace the last valid owner sample in diagnostics.
    if(MF487_STATE.last===value&&previously!==value)
      MF487_STATE.last=MF495_HEALTH.lastGood?.data||previously||null;
    mf495Render();return null;
   }
   if(!mf495HealthySample(value,u)){
    record.consecutive++;record.failures++;MF495_HEALTH.failures++;
    record.lastFailure=Date.now();
    record.retryAt=Date.now()+mf495RetryDelay(record.consecutive);
    record.lastError=value?'Sample provenance/fields failed validation':
     'Artwork failed or pixels unavailable (CORS, timeout, or invalid image)';
    if(value)MF495_HEALTH.mismatches++;
    record.lastOutcome='Safe fallback — invalid/unreadable artwork';
    mf495Event('failure',record,record.lastError);
    // The v487 cache is not trustworthy for invalid metadata.
    if(value)mf487CacheDelete(u);
    mf495Render();return null;
   }
   record.consecutive=0;record.retryAt=0;record.lastError='';
   record.lastSuccess=Date.now();record.successes++;
   record.lastOutcome='Verified artwork pixels';
   record.analysisVersion=value.analysisVersion||487;
   record.sampleCount=Number(value.analysis.pixels);
   record.confidence=mf495Quality(value);record.owner=mode;
   record.signature=mf495Signature(value,u,mode);
   MF495_HEALTH.successes++;
   MF495_HEALTH.lastGood={key,mode,at:record.lastSuccess,data:value};
   mf495Event('success',record,'Pixel colors/provenance verified');
   mf495Render();return value;
  }).catch(error=>{
   MF495_HEALTH.errors++;MF495_HEALTH.failures++;
   record.failures++;record.consecutive++;
   record.retryAt=Date.now()+mf495RetryDelay(record.consecutive);
   record.lastFailure=Date.now();
   record.lastError='Artwork extraction threw an unexpected error';
   record.lastOutcome='Safe fallback after extraction exception';
   mf495Event('error',record,'Pixel analysis safely rejected');
   console.warn('[MediaFlow v495] Artwork extraction guarded',error);
   mf495Render();return null;
  }).finally(()=>{
   const pending=MF495_PENDING.get(key);
   if(pending?.promise===promise)MF495_PENDING.delete(key);
   mf495Render();
  });
 MF495_PENDING.set(key,{epoch,generation,promise});
 mf495Render();
 return promise;
}
mf484Analyze=mf495Analyze;
function mf495CurrentRecord(){
 const u=mf495CurrentSource();if(!u)return null;
 return MF495_LEDGER.get(mf495Fingerprint(u))||null;
}
function mf495Status(){
 const mode=mf495Mode(),record=mf495CurrentRecord();
 const source=mf495CurrentSource();
 const lastGood=MF495_HEALTH.lastGood;
 return {
  version:495,mode,currentSource:source?mf495Fingerprint(source):'',
  current:record?{...record,retryRemainingMs:Math.max(0,record.retryAt-Date.now())}:null,
  verifiedCurrent:!!record?.lastSuccess,
  lastGood:lastGood?{source:lastGood.key,mode:lastGood.mode,
   ageMs:Date.now()-lastGood.at}:null,
  reads:MF495_HEALTH.reads,successes:MF495_HEALTH.successes,
  failures:MF495_HEALTH.failures,cooldowns:MF495_HEALTH.cooldowns,
  reused:MF495_HEALTH.reused,stale:MF495_HEALTH.stale,
  invalidated:MF495_HEALTH.invalidated,mismatches:MF495_HEALTH.mismatches,
  inFlight:MF495_PENDING.size,tracked:MF495_LEDGER.size,
  events:MF495_RECENT.slice()
 };
}
function mf495InvalidateCurrent(){
 const mode=mf495Mode(),url=mf495CurrentSource();
 if(mode==='legacy'||!url){showToast('Select an Advanced cover or Custom image to reanalyze');return false;}
 mf487CacheDelete(url);
 const record=MF495_LEDGER.get(mf495Fingerprint(url,mode));
 if(record){record.retryAt=0;record.consecutive=0;}
 if(mode==='custom'){
  ++MF484_CUSTOM_SEQ;MF485.appliedKey='';
  mf484ApplyCustom();
 }else if(S.settings?.dynamicCoverTheme){
  ++V146_DYNAMIC_SEQ;v146ScheduleDynamicTheme();
 }
 mf495Render();showToast('Current artwork reanalysis requested');return true;
}
function mf495ClearFailures(){
 const mode=mf495Mode(),record=mf495CurrentRecord();
 if(mode==='legacy'||!record)return false;
 record.retryAt=0;record.consecutive=0;record.lastError='';
 record.lastOutcome='Cooldown cleared — next source refresh may retry';
 mf495Event('retry',record,'Cleared temporary source cooldown');
 mf495Render();return true;
}
function mf495Render(){
 const node=document.getElementById('mf495-artwork-health');
 if(!node)return;
 const s=mf495Status(),c=s.current;
 const state=s.mode==='legacy'?'Legacy: original extraction retained':
  !s.currentSource?'No current image source':c?.lastOutcome||'Not yet analyzed';
 const rows=[
  ['Pixel reads',s.reads],['Verified',s.successes],
  ['Failed',s.failures],['In flight',s.inFlight],
  ['Cooldown skips',s.cooldowns],['Stale ignored',s.stale],
  ['Shared requests',s.reused],['Cache invalidations',s.invalidated]
 ];
 node.innerHTML='<div class="mf495-health-head"><strong>'+escapeHtml(state)+
  '</strong><small>'+escapeHtml(s.mode)+' · '+s.tracked+' tracked artwork sources</small></div>'+
  '<div class="mf495-metrics">'+rows.map(([k,v])=>
   '<span><b>'+v+'</b><small>'+escapeHtml(k)+'</small></span>').join('')+'</div>'+
  '<div class="mf495-health-detail">'+
  (c?'<p>Samples: '+c.sampleCount+' · Confidence: '+
   (c.confidence==null?'—':Math.round(c.confidence*100)+'%')+
   ' · Analysis v'+c.analysisVersion+'</p>'+
   (c.retryRemainingMs?'<p>Next eligible retry in about '+
    Math.ceil(c.retryRemainingMs/1000)+' seconds.</p>':'')+
   (c.lastError?'<p>'+escapeHtml(c.lastError)+'</p>':''):
   '<p>No pixel result has been validated for the active artwork yet.</p>')+
  (s.lastGood?'<small>Last verified palette: '+escapeHtml(s.lastGood.source)+
   ' (retained as diagnostic evidence; never substituted for another artwork)</small>':'')+
  '</div><div class="mf495-actions">'+
   '<button type="button" class="btn btn-ghost" onclick="App.mf495InvalidateCurrent()">Reanalyze Current Artwork</button>'+
   '<button type="button" class="btn btn-ghost" onclick="App.mf495ClearFailures()">Clear Retry Cooldown</button></div>'+
  '<small>Validates real pixel evidence. An unavailable image cannot produce invented colors. Existing selected-theme and last-good palette fallback still control the actual interface.</small>';
}
function mf495Mount(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf495-health-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf495-health-panel"><div><strong>Artwork Reliability & Cache Health</strong>'+
  '<p>Review recent artwork pixel reads, source consistency, retries and stale results without modifying Theme Collections or Library data.</p></div>'+
  '<div id="mf495-artwork-health" aria-live="polite"></div></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf495-artwork-reliability',title:'Artwork Extraction Reliability & Cache',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['artwork','pixel','cache','retry','fallback','health','stale','invalid','provider','recovery'],
  nodes:[node]
 });mf495Render();
}
Object.assign(App,{mf495InvalidateCurrent,mf495ClearFailures});
MediaFlowRuntime.registerPageEnhancer('settings',mf495Mount);
window.MediaFlowV495=Object.freeze({version:495,status:mf495Status,
 verify:mf495HealthySample,quality:mf495Quality,
 fingerprint:mf495Fingerprint,extract:mf495Analyze});
MediaFlowRuntime.version=MF495_VERSION;
