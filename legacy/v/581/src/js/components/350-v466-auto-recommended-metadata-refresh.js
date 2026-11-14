/* MediaFlow v466 — opt-in interval-controlled automatic refresh of the
 * CURRENT recommended title's verified metadata, provider ratings and missing
 * external IDs. Runs in an open tab (or catches up on reopen); GitHub Pages
 * cannot schedule reliable work while every device/browser is closed.
 *
 * Reuses v439/v450 adapters, evidence, proposals and v442 shared process lock.
 * No unverified provider result, unmatched ID, manual field or personal rating
 * can be overwritten. Never changes the recommended title or reroll history.
 */
const MF466_VERSION=466;
const MF466_INTERVALS=[0,6,12,24,72,168];
const MF466_DEFAULT={hours:24,ratings:true,metadata:true,ids:true};
const MF466={working:false,account:'',itemId:'',state:'idle',note:'',errors:[],provider:'',
 changed:0,checkedAt:0,timer:null,scheduleTimer:null,abort:null,sequence:0};
function mf466Prefs(){
 const raw=S.settings?.v466RecommendedRefresh||{};
 return {
  hours:MF466_INTERVALS.includes(Number(raw.hours))?Number(raw.hours):24,
  ratings:raw.ratings!==false,metadata:raw.metadata!==false,ids:raw.ids!==false
 };
}
function mf466Store(){return S.settings?.v466RecommendedRefreshState||{};}
function mf466History(id){return mf466Store()[String(id)]||{};}
function mf466Date(ts){
 return Number.isFinite(Number(ts))&&Number(ts)>0?
  new Date(Number(ts)).toLocaleString():'Never';
}
function mf466Recommended(){
 if(!AUTH_USER||!AUTH_READY||S.loading||!S.settings?.exactTitleRecommendations||
  !S.sessionActive||!S.currentTask?.title)return null;
 return mf395DashboardRecommendedItem(S.currentTask)||null;
}
function mf466Same(account,id,item){
 return Boolean(mf439Account()===account&&mf466Recommended()?.id!=null&&
  String(mf466Recommended().id)===String(id)&&mf439Item(id)===item);
}
function mf466Providers(item){
 // Use the SAME enabled/configured provider set as Quick Metadata Recovery.
 const candidates=typeof mf453Ready==='function'?mf453Ready('metadata',item):mf439Preferences().enabled;
 const enabled=new Set(mf439Preferences().enabled);
 const valid=new Set([...Object.keys(MF439_PUBLIC),...MF439_GATEWAY]);
 const ids=item?.externalIds||{},ratings=item?.universalMetadata?.externalRatings||{};
 const bias={jikan:['mal'],anilist:['anilist'],kitsu:['kitsu'],tvmaze:['tvmaze'],
  vndb:['vndb'],steam:['steam_app'],openlibrary:['openlibrary_work'],itunes:['apple_music_album'],
  tmdb:['tmdb','tmdb_tv'],omdb:['imdb'],malofficial:['mal'],simkl:['simkl'],trakt:['trakt']};
 return [...new Set(candidates)].filter(p=>enabled.has(p)&&valid.has(p))
 .map((p,index)=>({p,index,score:(bias[p]||[p]).some(id=>ids[id])?3:
  Object.values(ratings).some(r=>r?.source===p)?2:0}))
 .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,4).map(x=>x.p);
}
function mf466AutoDue(item,now=Date.now()){
 const p=mf466Prefs();
 if(!p.hours||(!p.ratings&&!p.metadata&&!p.ids))return false;
 const h=mf466History(item.id),last=Math.max(Number(h.lastAttempt)||0,Number(h.lastSuccess)||0);
 // Failed checks retry at most once per hour, success at the configured interval.
 const retry=Number(h.success)===0?3600000:p.hours*3600000;
 return !last||now-last>=retry;
}
function mf466StatusHtml(item){
 const h=mf466History(item.id),p=mf466Prefs(),active=MF466.working&&MF466.itemId===String(item.id);
 const label=active?'Checking '+(MF466.provider||'providers')+'…':
  MF466.state==='error'&&MF466.itemId===String(item.id)?MF466.note:
  h.lastAttempt?'Last checked '+mf466Date(h.lastAttempt)+(h.updated?' · '+h.updated+' updated':' · No changes'):
  'Not checked yet';
 const description=p.hours?'Automatic every '+p.hours+' hours while MediaFlow is open':'Automatic refresh off';
 return '<section class="mf466-refresh" data-mf466-title="'+escapeHtml(String(item.id))+'">'+
  '<div class="mf466-refresh-details">'+mf419Icon('progress',18)+
  '<span><strong>Ratings & metadata refresh</strong><small data-mf466-status role="status" aria-live="polite">'+
  escapeHtml(label)+'</small><small>'+escapeHtml(description)+'</small></span></div>'+
  '<button type="button" class="btn btn-sm btn-ghost mf466-now" onclick="App.mf466RefreshNow()" '+
  (active?'disabled ':'')+'aria-label="Refresh recommended title ratings and metadata now">'+
  mf419Icon('progress',15)+' '+(active?'Refreshing…':'Refresh now')+'</button></section>';
}
function mf466Repaint(){
 const item=mf466Recommended(),widget=document.querySelector('.mf466-refresh');
 if(item&&widget&&widget.dataset.mf466Title===String(item.id))
  widget.outerHTML=mf466StatusHtml(item);
 if(!item||!widget||widget.dataset.mf466Title!==String(item.id))return;
 const info=document.querySelector('.mf464-recommend-ratings');
 if(info&&S.settings?.v464ShowExternalRatings!==false)
  info.outerHTML=mf464RatingsHtml(item);
}
function mf466ExternalCandidates(item,rows){
 const proposed=new Map(),conflicts=new Set(),current=item.externalIds||{};
 const allowed=new Set(V377_ID_PROVIDERS.map(x=>x[0]));
 for(const row of rows){
  for(const [key,value] of Object.entries(row.externalIds||{})){
   const id=String(value??'').trim();
   if(!allowed.has(key)||current[key]!=null&&String(current[key]).trim()!==''||
     !id||id.length>120||!(/^[A-Za-z0-9_:.-]+$/.test(id)))continue;
   if(proposed.has(key)&&proposed.get(key)!==id)conflicts.add(key);
   else proposed.set(key,id);
  }
 }
 for(const key of conflicts)proposed.delete(key);
 return proposed;
}
function mf466ApplyVerified(item,rows,opts){
 const timestamp=Date.now();
 // Build and apply missing-field proposals using existing guarded recovery.
 const preview=mf439Proposals(item,rows);
 if(!opts.ratings||!opts.metadata)
  for(const prop of preview.proposals||[])
   if(!opts.ratings&&prop.token.startsWith('rating.')||
      !opts.metadata&&!prop.token.startsWith('rating.'))prop.selected=false;
 const filled=mf439Apply(item,preview,'automatic');
 let changed=filled.changed||0,ratings=filled.ratings||0,metadata=(filled.legacy||0)+(filled.fields||0),ids=0;
 const env=mf437Normalized(item.universalMetadata);
 const chosen=new Map(),conflicts=new Set();
 for(const row of rows){
  const evidence=mf439Evidence(item,row);
  if(evidence.confidence<mf439Preferences().minimumConfidence)continue;
  for(const [prefix,values] of [['rating',row.ratings],['field',row.fields],['legacy',row.legacy]]){
   if(prefix==='rating'&&!opts.ratings||prefix!=='rating'&&!opts.metadata)continue;
   for(const [key,value] of Object.entries(values||{})){
    const token=prefix+'.'+key,valid=mf439Value(token,value);
    if(valid==null)continue;
    // Conflicting results for the same token require manual review.
    const fingerprint=mf439ValueKey(valid);
    const old=chosen.get(token);
    if(old&&old.fingerprint!==fingerprint){conflicts.add(token);continue;}
    if(!old||evidence.confidence>old.confidence)
     chosen.set(token,{token,value:valid,provider:row.provider,recordId:String(row.recordId),
      confidence:evidence.confidence,fingerprint});
   }
  }
 }
 for(const [token,row] of chosen){
  if(conflicts.has(token)||mf439IsProtected(item,token))continue;
  const old=env.provenance[token];
  // Existing data changes only when the SAME provider originally populated it
  // and the provider's verified record ID is unchanged. Never touch manual.
  if(!old||old.verified!==true||old.source!==row.provider||
    old.recordId&&String(old.recordId)!==row.recordId)continue;
  const previous=mf439FieldValue(item,token);
  if(!mf439Has(previous?.score??previous)||mf439ValueKey(previous)===row.fingerprint)continue;
  let done=false;
  if(token.startsWith('rating.')){
   done=mf437SetRating(env,token.slice(7),row.value,
    {source:row.provider,verified:true,force:true,updatedAt:timestamp});
   if(done)ratings++;
  }else if(token.startsWith('field.')){
   done=mf437SetField(env,token.slice(6),row.value,
    {source:row.provider,verified:true,force:true,updatedAt:timestamp});
   if(done)metadata++;
  }else if(token.startsWith('legacy.')){
   const key=token.slice(7);
   if(MF439_LEGACY_FIELDS[key]&&item.richMetadataManual?.[key]!==true){
    item[key]=structuredClone(row.value);done=true;metadata++;
   }
  }
  if(done){changed++;env.provenance[token]={source:row.provider,verified:true,
   recordId:row.recordId,updatedAt:timestamp};}
 }
 if(changed){
  item.universalMetadata=env;
  item.modifiedAt=Math.max(Number(item.modifiedAt)||0,timestamp);
 }
 if(opts.ids){
  const allowed=mf466ExternalCandidates(item,rows),copy={...(item.externalIds||{})};
  for(const [key,value] of allowed){if(copy[key]!=null&&String(copy[key]).trim()!=='')continue;
   copy[key]=value;ids++;changed++;}
  if(ids)item.externalIds=copy;
 }
 if(changed){
  item.modifiedAt=Math.max(Number(item.modifiedAt)||0,timestamp);
  item.v466RecommendedRefreshHistory=(Array.isArray(item.v466RecommendedRefreshHistory)?
   item.v466RecommendedRefreshHistory:[]).slice(-9);
  item.v466RecommendedRefreshHistory.push({at:timestamp,ratings,metadata,ids,
   providers:[...new Set(rows.map(row=>row.provider))].slice(0,8)});
 }
 return {changed,ratings,metadata,ids};
}
function mf466Cancel(){MF466.sequence++;MF466.abort?.abort();}
async function mf466Refresh(force=false){
 const item=mf466Recommended(),prefs=mf466Prefs();
 if(!item)return {ok:false,reason:'No active recommended title'};
 if(!prefs.ratings&&!prefs.metadata&&!prefs.ids)
  return {ok:false,reason:'Enable at least one refresh target in Settings'};
 if(!force&&!mf466AutoDue(item))return {ok:false,reason:'Not due yet'};
 if(!navigator.onLine)return {ok:false,reason:'Offline; will retry when connected'};
 if(MF466.working)return {ok:false,reason:'Recommended title refresh already running'};
 if(MF439.working||MF424.running||MF442.process||
  mf442CoverLockIsActive()||mf442MetadataLockIsActive()||
  (typeof MF453Quick!=='undefined'&&MF453Quick.current))
  return {ok:false,reason:'Another recovery is running. Try again when it finishes.'};
 const providers=mf466Providers(item);
 if(!providers.length)return {ok:false,reason:'No enabled, ready metadata providers. Configure them in Provider Management.'};
 if(!mf442AcquireProcess('metadata'))return {ok:false,reason:'Another tab owns recovery'};
 if(!mf439AcquireLease()){mf442ReleaseProcess('metadata');return {ok:false,reason:'Another tab owns metadata recovery'};}
 const account=mf439Account(),id=String(item.id),before=mf442TitleSignature(item);
 const priorAccount=MF439.account,epoch=++MF466.sequence,controller=new AbortController();
 MF466.abort=controller;MF466.account=account;MF466.itemId=id;MF466.working=true;
 MF466.state='working';MF466.note='';MF466.changed=0;MF466.provider='';
 MF439.account=account;MF439.working=true;
 const renewal=setInterval(()=>{
  if(!mf442RenewMetadataLease()){controller.abort();}
 },8000);
 mf466Repaint();
 const result={ok:false,changed:0,failures:[]};
 try{
  const found=await mf439Discover(item,providers,provider=>{
   MF466.provider=provider;mf466Repaint();
  },controller.signal);
  result.failures=found.failures||[];
  if(controller.signal.aborted||epoch!==MF466.sequence||!mf442ProcessOwned('metadata')||
    !mf442MetadataLeaseOwned()||!mf466Same(account,id,item)||before!==mf442TitleSignature(item))
   throw Error('Title, account or recovery ownership changed. Nothing saved.');
  // Only exact title+year or exact title+existing ID can be automatically
  // applied. Name-only matches remain manual-review-only.
  const verified=(found.results||[]).filter(row=>
   mf439Evidence(item,row).confidence>=mf439Preferences().minimumConfidence);
  const counts=verified.length?mf466ApplyVerified(item,verified,prefs):{changed:0,ratings:0,metadata:0,ids:0};
  result.changed=counts.changed;
  if(controller.signal.aborted||epoch!==MF466.sequence||!mf466Same(account,id,item))
   throw Error('Recommendation changed; refresh stopped safely.');
  const now=Date.now(),store={...mf466Store()};
  store[id]={lastAttempt:now,lastSuccess:verified.length?now:0,
   success:verified.length?1:0,updated:counts.changed,
   providers:verified.length,failures:result.failures.length};
  const trimmed=Object.entries(store).sort((a,b)=>(b[1]?.lastAttempt||0)-(a[1]?.lastAttempt||0)).slice(0,24);
  S.settings.v466RecommendedRefreshState=Object.fromEntries(trimmed);
  // One atomic cloud-backed state commit after guarded Library mutations and
  // timestamp update, never a per-provider write.
  await saveState();
  MF466.checkedAt=now;MF466.changed=counts.changed;
  MF466.state=verified.length?'done':'error';
  MF466.note=verified.length?counts.changed+' updated':'No high-confidence provider match';
  result.ok=verified.length>0;
  if(counts.changed)try{v53InvalidateLibraryCache();}catch(_){}
 }catch(e){
  MF466.state='error';MF466.note=String(e?.message||e).slice(0,170);
  result.reason=MF466.note;console.warn('Recommended metadata refresh skipped',e);
 }finally{
  clearInterval(renewal);MF466.working=false;MF466.provider='';MF466.abort=null;
  MF439.working=false;MF439.account=priorAccount;
  mf439ReleaseLease();mf442ReleaseProcess('metadata');mf466Repaint();
 }
 return result;
}
function mf466CheckSchedule(){
 if(MF466.working)return;
 const title=mf466Recommended();
 if(!title||!mf466AutoDue(title))return;
 void mf466Refresh(false);
}
const mf466DashboardBase=mf395DashboardRecommendationHtml;
mf395DashboardRecommendationHtml=function(task,category){
 const markup=String(mf466DashboardBase.apply(this,arguments)||'');
 const item=mf395DashboardRecommendedItem(task);
 if(!item||!markup.includes('mf419-recommend-card'))return markup;
 return markup.replace('<div class="mf419-category-stats">',
  mf466StatusHtml(item)+'<div class="mf419-category-stats">');
};
const mf466RenderShellBase=renderShell;
renderShell=function(){
 const result=mf466RenderShellBase.apply(this,arguments);
 if(MF466.scheduleTimer)clearTimeout(MF466.scheduleTimer);
 MF466.scheduleTimer=setTimeout(()=>{MF466.scheduleTimer=null;mf466CheckSchedule();},1300);
 return result;
};
function mf466SettingsHtml(){
 const p=mf466Prefs();
 const checkbox=(key,label)=>'<label class="mf466-option"><input type="checkbox" '+
  (p[key]?'checked ':'')+'onchange="App.mf466Set(&#39;'+key+'&#39;,this.checked)"><span>'+label+'</span></label>';
 return '<section class="mf466-settings" data-mf-setting-id="v466RecommendedRefresh">'+
  '<div class="mf466-settings-head">'+mf419Icon('progress',20)+
  '<div><strong>Automatic recommended-title ratings & metadata</strong>'+
  '<small>Checks the current recommended title while MediaFlow is open, and catches up after reopening.</small></div></div>'+
  '<label class="mf466-interval">Automatic refresh interval<select onchange="App.mf466Set(&#39;hours&#39;,Number(this.value))" aria-label="Recommended-title refresh interval">'+
  [[0,'Off'],[6,'Every 6 hours'],[12,'Every 12 hours'],[24,'Every 24 hours (recommended)'],
   [72,'Every 3 days'],[168,'Every 7 days']].map(([v,t])=>
   '<option value="'+v+'" '+(p.hours===v?'selected':'')+'>'+t+'</option>').join('')+
  '</select></label><div class="mf466-options">'+
  checkbox('ratings','Refresh verified external ratings and vote counts')+
  checkbox('metadata','Fill missing metadata and update provider-owned verified fields')+
  checkbox('ids','Recover missing verified External IDs (never replace existing IDs)')+
  '</div><p>Always respects manually protected fields, verified ID matches, enabled providers, recovery locks and API cooldowns. '+
  'Does not reroll your current title or alter your personal rating. GitHub Pages cannot run scheduled checks while the website is completely closed.</p></section>';
}
const mf466SettingsBase=V219_PAGE_RENDERERS.get('settings');
if(typeof mf466SettingsBase==='function')MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
 const html=String(mf466SettingsBase.call(this,ctx)||'');
 if(!html.includes('mf404-recommendations-card')||html.includes('data-mf-setting-id="v466RecommendedRefresh"'))return html;
 const host=document.createElement('div');host.innerHTML=html;
 const card=host.querySelector('.mf404-recommendations-card');
 card?.insertAdjacentHTML('beforeend',mf466SettingsHtml());
 return host.innerHTML;
});
if(typeof v366RegisterSetting==='function')v366RegisterSetting({
 id:'v466RecommendedRefresh',section:'title-recommendations',
 selector:'[data-mf-setting-id="v466RecommendedRefresh"]',
 label:'Automatic recommended title metadata refresh',subgroup:'Title Recommendations',
 keywords:['automatic','interval','periodic','refresh','metadata','external ratings','ids','schedule','update','providers']
});
App.mf466Set=function(key,value){
 if(!Object.hasOwn(MF466_DEFAULT,key))return;
 const p=mf466Prefs();
 if(key==='hours')p.hours=MF466_INTERVALS.includes(Number(value))?Number(value):24;
 else p[key]=Boolean(value);
 S.settings.v466RecommendedRefresh=p;
 Promise.resolve(persistSettings()).catch(e=>console.warn('Recommended metadata settings sync failed',e));
};
App.mf466RefreshNow=async function(){
 const result=await mf466Refresh(true);
 if(!result.ok)showToast(result.reason||MF466.note||'No verified source updates available.');
 else showToast(result.changed?result.changed+' verified metadata value(s) updated.':
  'Recommended title already up to date.');
};
MF466.timer=setInterval(mf466CheckSchedule,60000);
window.addEventListener('online',()=>setTimeout(mf466CheckSchedule,1200));
window.MediaFlowV466=Object.freeze({
 version:MF466_VERSION,prefs:mf466Prefs,providers:mf466Providers,
 autoDue:mf466AutoDue,apply:mf466ApplyVerified,refresh:mf466Refresh,
 cancel:mf466Cancel,status:mf466StatusHtml,settings:mf466SettingsHtml,
 current:()=>({working:MF466.working,state:MF466.state,note:MF466.note,
  itemId:MF466.itemId,changed:MF466.changed})
});
MediaFlowRuntime.version=MF466_VERSION;
