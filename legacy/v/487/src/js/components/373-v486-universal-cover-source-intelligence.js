/* MediaFlow v486 — Universal Cover Source Intelligence.
 * One read-only source contract for every v162/v173 cover collection.
 * Legacy receives the original source arrays/ordering/rotation unchanged.
 * Advanced receives provenance-validated source records in the SAME order.
 * No new external provider, network request, cloud table or Library mutation.
 */
const MF486_VERSION=486;
const MF486_MODES=Object.freeze({
 dynamic:{name:'Dynamic Cover Theme',policy:'recommendation + On This Day',family:'mixed'},
 'recommended-only':{name:'Recommended Title Covers',policy:'recommendation only',family:'recommended'},
 'onthisday-only':{name:'On This Day Covers',policy:'On This Day only',family:'onthisday'},
 'source-picker':{name:'Recommendation + On This Day Picks',policy:'selected sources only',family:'picked'},
 library:{name:'Library Cover Themes',policy:'selected Library title order',family:'librarytheme'},
 image:{name:'Image URL Themes',policy:'saved URL order',family:'imagetheme'}
});
const MF486={
 token:0,sequence:0,resolved:null,active:null,
 changes:0,successes:0,fallbacks:0,retained:0,errors:0,invalid:0,
 pending:false,lastOutcome:'Not evaluated',lastError:'',previousSignatures:new Map()
};
function mf486Mode(){
 return typeof v162ThemeMode==='function'?String(v162ThemeMode()||'static'):'static';
}
function mf486Owner(){
 return typeof mf484Prefs==='function'?mf484Prefs().mode:'legacy';
}
function mf486Hash(value){
 // Stable unsigned double hash. Never expose a signed image URL in diagnostics.
 const s=String(value||''),pair=v160HashString(s);
 return pair.map(n=>n.toString(36)).join('-');
}
function mf486Id(source){
 const kind=String(source?.source||'other').slice(0,48);
 const libraryId=String(source?.libraryId||'');
 // Keep identity stable when a Library cover URL changes, while tracking
 // changed artwork via a separate URL fingerprint.
 return kind+'-'+mf486Hash(libraryId||String(source?.url||''));
}
function mf486Candidate(source,index){
 const value=source&&typeof source==='object'?source:{};
 const url=String(value.url||'').trim();
 const valid=!!url&&v160SafeCoverUrl(url)===url;
 const kind=String(value.source||'unknown').slice(0,55);
 const label=String(value.label||'Cover source').slice(0,140);
 return {
  index,id:mf486Id(value),kind,label,valid,
  fingerprint:mf486Hash(url),
  libraryId:value.libraryId==null?'':String(value.libraryId).slice(0,96)
 };
}
function mf486Interval(mode){
 const s=S.settings||{};
 if(mode==='dynamic')return 'Automatic source refresh';
 if(mode==='library')return String(v162ClampInterval(s.v162LibraryTheme?.intervalSec))+' seconds';
 if(mode==='image')return String(v162ClampInterval(s.v162ImageTheme?.intervalSec))+' seconds';
 if(mode==='recommended-only')return String(v162ClampInterval(s.v173RecommendedTheme?.intervalSec))+' seconds';
 if(mode==='onthisday-only')return String(v162ClampInterval(s.v173OnThisDayTheme?.intervalSec))+' seconds';
 if(mode==='source-picker')return String(v162ClampInterval(s.v173SourcePickerTheme?.intervalSec))+' seconds';
 return 'Not applicable';
}
function mf486ConfiguredCount(mode){
 const s=S.settings||{};
 if(mode==='library')return Array.isArray(s.v162LibraryTheme?.titleIds)?s.v162LibraryTheme.titleIds.length:0;
 if(mode==='image')return Array.isArray(s.v162ImageTheme?.urls)?s.v162ImageTheme.urls.length:0;
 if(mode==='source-picker')return Array.isArray(s.v173SourcePickerTheme?.selectedKeys)?s.v173SourcePickerTheme.selectedKeys.length:0;
 return null;
}
function mf486BuildResolution(mode,rows,owner='advanced'){
 const m=MF486_MODES[mode]||{name:'Selected static theme',policy:'static palette',family:'static'};
 const sourceRows=Array.isArray(rows)?rows:[];
 const candidates=sourceRows.map((source,index)=>mf486Candidate(source,index));
 const bad=candidates.filter(x=>!x.valid).length;
 const signature=mf486Hash(JSON.stringify(candidates.map(x=>[x.id,x.fingerprint])));
 return {
  token:MF486.token,sequence:++MF486.sequence,mode,owner,
  name:m.name,policy:m.policy,family:m.family,interval:mf486Interval(mode),
  configured:mf486ConfiguredCount(mode),
  signature,candidates,invalid:bad,applied:null,attempted:false,
  outcome:sourceRows.length?'Sources resolved — evaluating cover':'No eligible sources'
 };
}
function mf486Snapshot(){
 const last=MF486.resolved,mode=mf486Mode(),owner=mf486Owner();
 const entry=MF486_MODES[mode];
 return {
  version:486,owner,mode,collection:entry?.name||'Static Theme Collection',
  policy:entry?.policy||'Original selected theme',
  interval:last?.mode===mode?last.interval:mf486Interval(mode),
  configured:mf486ConfiguredCount(mode),
  count:last?.mode===mode?last.candidates.length:0,
  sources:last?.mode===mode?last.candidates.map(x=>({
   id:x.id,kind:x.kind,label:x.label,valid:x.valid,index:x.index,
   fingerprint:x.fingerprint,active:last?.applied?.id===x.id
  })):[],
  active:MF486.active&&MF486.active.mode===mode?{...MF486.active}:null,
  outcome:MF486.lastOutcome,changes:MF486.changes,
  successes:MF486.successes,fallbacks:MF486.fallbacks,
  retained:MF486.retained,invalid:MF486.invalid,errors:MF486.errors,
  pending:MF486.pending,lastError:MF486.lastError
 };
}
// The v173 resolver is the final source provider, including its policy
// overrides. This wrapper does not discover sources a second time, consume
// forced Dynamic sources, alter the rotation index, or reorder fallback rows.
const mf486SourceProvider=v162ThemeSources;
v162ThemeSources=function(){
 const owner=mf486Owner(),mode=mf486Mode();
 const raw=mf486SourceProvider.apply(this,arguments);
 if(owner==='custom'||!MF486_MODES[mode])return raw;
 const resolution=mf486BuildResolution(mode,raw,owner);
 MF486.resolved=resolution;
 if(MF486.previousSignatures.has(mode)&&
    MF486.previousSignatures.get(mode)!==resolution.signature)MF486.changes++;
 MF486.previousSignatures.set(mode,resolution.signature);
 MF486.invalid+=resolution.invalid;
 MF486.lastOutcome=resolution.outcome;
 mf486RenderStatus();
 // The original Legacy collection engine must receive the exact original
 // list and the exact original source objects; this is a diagnostic observer.
 if(owner!=='advanced')return raw;
 // Source URL validation is only enabled for the opt-in Advanced engine.
 // Keep candidate priority, libraryId, labels and duplicate slots intact.
 return raw.filter((s,index)=>resolution.candidates[index]?.valid).map(s=>({
  ...s,mf486Id:mf486Id(s),mf486Token:resolution.token,
  mf486Mode:mode
 }));
};
function mf486RecordApplied(palette,source){
 const owner=mf486Owner(),kind=String(source?.source||'');
 if(owner==='custom'||kind==='custom')return;
 const state=S.v146DynamicThemeState;
 // Ignore blocked v485 writes and stale source callbacks.
 if(state?.palette!==palette||!S.settings?.dynamicCoverTheme)return;
 const last=MF486.resolved;
 const id=String(source?.mf486Id||mf486Id(source));
 const match=last?.mode===mf486Mode()?last.candidates.find(x=>x.id===id&&
  x.kind===kind&&x.fingerprint===mf486Hash(source?.url||'')):null;
 const index=match?.index??0;
 const current={mode:mf486Mode(),id,kind,
  label:String(source?.label||'Cover source').slice(0,140),
  index,at:Date.now(),fingerprint:mf486Hash(source?.url||'')};
 MF486.active=current;
 if(last&&last.mode===current.mode){
  last.applied=current;last.outcome=index?'Fallback artwork selected':'Preferred artwork selected';
 }
 MF486.successes++;
 if(index>0)MF486.fallbacks++;
 MF486.lastOutcome=last?.outcome||'Artwork applied';
 MF486.lastError='';
 mf486RenderStatus();
}
const mf486BaseApply=v146ApplyFullPalette;
v146ApplyFullPalette=function(palette,source){
 const result=mf486BaseApply.apply(this,arguments);
 mf486RecordApplied(palette,source);
 return result;
};
// Observe the actual refresh outcome rather than simulating a second source
// lookup. Other modules' generation guards still own cancellation.
const mf486BaseRefresh=v146RefreshDynamicTheme;
v146RefreshDynamicTheme=async function(){
 const owner=mf486Owner(),mode=mf486Mode();
 if(owner==='custom'||!MF486_MODES[mode]){
  MF486.pending=false;
  return mf486BaseRefresh.apply(this,arguments);
 }
 const token=++MF486.token;
 MF486.pending=true;
 try{
  const result=await mf486BaseRefresh.apply(this,arguments);
  if(token!==MF486.token||mode!==mf486Mode()||owner!==mf486Owner())return result;
  const snapshot=MF486.resolved;
  if(snapshot?.token===token){
   if(snapshot.applied){
    MF486.lastOutcome=snapshot.outcome;
   }else if(S.v146DynamicThemeState?.palette&&
    document.documentElement.dataset.v146DynamicActive==='1'){
    // v162 deliberately retains last-good artwork on a failed download.
    MF486.retained++;MF486.lastOutcome='Last valid cover theme retained';
   }else{
    MF486.lastOutcome=snapshot.candidates.length?
     'No artwork applied — existing theme fallback':'No cover sources — existing theme fallback';
   }
  }
  return result;
 }catch(error){
  if(token===MF486.token){
   MF486.errors++;MF486.lastError='Cover source refresh failed';
   MF486.lastOutcome='Source error — existing theme retained';
  }
  console.warn('[MediaFlow v486] Cover source resolution failed',error);
  // Retain v485 last-good palette and original selected theme safely.
  return undefined;
 }finally{
  if(token===MF486.token){
   MF486.pending=false;
   mf486RenderStatus();
  }
 }
};
const mf486BaseCollection=App.setThemeCollection;
App.setThemeCollection=function(){
 ++MF486.token;
 MF486.pending=false;
 MF486.resolved=null;MF486.active=null;
 MF486.lastOutcome='Collection changed — awaiting source';
 return mf486BaseCollection.apply(this,arguments);
};
function mf486Refresh(){
 if(mf486Owner()==='custom'){
  showToast('Custom Studio uses its own image or colors, not Library cover sources');
  return;
 }
 if(!S.settings?.dynamicCoverTheme){
  showToast('Select a cover-based Theme Collection to refresh artwork');
  return;
 }
 MF486.lastOutcome='Manual cover-source refresh requested';
 v146ScheduleDynamicTheme();
 mf486RenderStatus();
}
function mf486StatusHtml(){
 const status=mf486Snapshot();
 const ready=status.owner==='custom';
 const entries=status.sources.slice(0,9).map((s,i)=>
  '<li class="mf486-source-entry">'+
   '<span class="mf486-rank">'+(i+1)+'</span>'+
   '<span><strong>'+escapeHtml(s.label)+'</strong><small>'+escapeHtml(s.kind)+
   (s.valid?'':' · Invalid image URL')+'</small></span>'+
   (s.active?'<em>Active</em>':'')+
  '</li>').join('');
 const config=status.configured==null?'':(' · '+status.configured+' configured');
 return '<div class="mf486-status">'+
  '<div class="mf486-status-head"><div><b>'+escapeHtml(status.collection)+'</b>'+
  '<small>'+escapeHtml(status.policy)+' · '+escapeHtml(status.interval)+'</small></div>'+
  '<span class="mf486-mode">'+escapeHtml(status.owner)+'</span></div>'+
  '<p>'+escapeHtml(status.outcome||'No source activity recorded yet')+'</p>'+
  '<div class="mf486-meta">'+status.count+' resolved'+config+
  ' · '+status.fallbacks+' fallback selections · '+status.changes+' source changes</div>'+
  (ready?'<p>Custom Studio ignores MediaFlow cover rotation and is unaffected by this resolver.</p>':
   entries?'<ol class="mf486-list">'+entries+'</ol>':'<p>No source list recorded yet. It appears after the next cover-theme refresh.</p>')+
  (status.lastError?'<small class="mf486-alert">'+escapeHtml(status.lastError)+'</small>':'')+
  '</div>';
}
function mf486RenderStatus(){
 const host=document.getElementById('mf486-source-status');
 if(host)host.innerHTML=mf486StatusHtml();
}
function mf486MountSettings(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf486-source-panel'))return;
 const node=document.createElement('div');
 node.innerHTML='<div class="mf486-source-panel"><p>Each cover collection keeps its own ordering, source selection and refresh interval. Advanced now shares one provenance-aware source pipeline across every cover-based collection.</p>'+
 '<div id="mf486-source-status" aria-live="polite"></div>'+
 '<div class="mf486-actions"><button type="button" class="btn btn-ghost" onclick="App.mf486Refresh()">Refresh Cover Source</button>'+
 '<button type="button" class="btn btn-ghost" onclick="App.mf486Status()">Update Diagnostics</button></div>'+
 '<small>Diagnostics show source labels and status, never complete image URLs. Legacy source selection is unchanged.</small></div>';
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf486-cover-source-intelligence',title:'Universal Cover Source Intelligence',
  category:'appearance',subgroup:'Theme Intelligence',
  keywords:['cover','source','rotation','recommended','on this day','library','image url','fallback','intelligence'],
  nodes:[node]
 });
 mf486RenderStatus();
}
Object.assign(App,{mf486Refresh,mf486Status:mf486RenderStatus});
MediaFlowRuntime.registerPageEnhancer('settings',mf486MountSettings);
window.MediaFlowV486=Object.freeze({version:486,registry:MF486_MODES,
 sources:mf486Snapshot,refresh:mf486Refresh,describe:mf486BuildResolution});
MediaFlowRuntime.version=MF486_VERSION;
