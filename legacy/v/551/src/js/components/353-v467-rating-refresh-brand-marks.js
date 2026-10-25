/* MediaFlow v467 — authentic rating-source logos in Recommends,
 * Edit/Add Title and Title Details; one-click verified external-rating refresh
 * for any already-saved Library title (not just the current recommendation).
 *
 * Bundled Simple Icons SVGs work offline. Niche brands not in that icon
 * collection use a real favicon of the provider through Google's favicon
 * service, with clear fallback if offline. No invented "official" logos.
 * Logos identify trademark owners, not an endorsement or affiliation.
 */
const MF467_VERSION=467;
const MF467_LOGO_DOMAINS=Object.freeze({
 anidb:'anidb.net',tvmaze:'tvmaze.com',hardcover:'hardcover.app',
 backloggd:'backloggd.com',vndb:'vndb.org',rateyourmusic:'rateyourmusic.com',
 ifdb:'ifdb.org',rawg:'rawg.io',googlebooks:'books.google.com'
});
const MF467_BRAND_COLORS=Object.freeze({
 imdb:'#F5C518',trakt:'#ED1C24',rottentomatoes:'#FA320A',mal:'#2E51A2',
 anilist:'#02A9FF',kitsu:'#F75239',tmdb:'#01B4E4',simkl:'#E40817',
 metacritic:'#F6A11D',letterboxd:'#00E054',goodreads:'#7C5038',
 storygraph:'#F2B343',igdb:'#A9DA44',opencritic:'#FC7D14',steam:'#66C0F4',
 mangaupdates:'#59B9D5',discogs:'#FFCC00',audible:'#F8991D'
});
function mf467Mark(key){
 const id=String(key||'').toLowerCase(),logoKey=
  id.startsWith('rottentomatoes_')?'rottentomatoes':id;
 const label=MF437_RATING_MAP.get(id)?.[1]||id;
 const inner=MF467_LOGOS_A[logoKey]||MF467_LOGOS_B[logoKey];
 const brand=MF467_BRAND_COLORS[logoKey];
 const style=brand?' style="--mf467-brand:'+brand+'"':'';
 const fallback=(MF450_MARKS[id]||id.slice(0,2).toUpperCase());
 const officialDomain=MF467_LOGO_DOMAINS[logoKey];
 const media=inner?'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+inner+'</svg>':
  officialDomain?'<img src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(officialDomain)+
   '&amp;sz=64" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"'+
   ' onerror="this.hidden=true" />'+
   '<span class="mf467-source-fallback" aria-hidden="true">'+escapeHtml(fallback)+'</span>':
  '<span class="mf467-source-fallback" aria-hidden="true">'+escapeHtml(fallback)+'</span>';
 return '<span class="mf450-source-mark mf467-source-logo" data-mf450-source="'+escapeHtml(id)+
  '" title="'+escapeHtml(label)+'" aria-hidden="true"'+style+'>'+media+'</span>';
}
// Existing v450/v464 rendering calls the function at paint-time.
mf450ProviderMark=mf467Mark;
// Existing v437 Save Capture does not include a provider rating URL in the
// editor's numeric inputs. Keep its hidden URL when score/scale/votes are
// untouched; otherwise an ordinary Edit Title save could silently rewrite
// a just-refreshed verified value as a new manual rating.
const mf467CaptureBase=mf437SaveCapture;
mf437SaveCapture=function(item,previous,capture){
 if(!item||!capture?.ratings)return mf467CaptureBase.apply(this,arguments);
 const existing=item.universalMetadata?.externalRatings||{};
 const ratings={...capture.ratings};
 for(const [key,rating] of Object.entries(ratings)){
  const old=existing[key];
  if(!old||!rating||!old.url)continue;
  if(Number(rating.score??NaN)!==Number(old.score??NaN)||
     Number(rating.scale)!==Number(old.scale)||
     (rating.votes==null?null:Number(rating.votes))!==
     (old.votes==null?null:Number(old.votes)))continue;
  ratings[key]={...rating,url:old.url};
 }
 return mf467CaptureBase.call(this,item,previous,{...capture,ratings});
};

const MF467={working:false,titleId:'',account:'',provider:'',note:'',success:null,
 abort:null,sequence:0};
const MF467_RATING_PROVIDERS=new Set([
 'jikan','anilist','kitsu','tvmaze','vndb','tmdb','omdb',
 'malofficial','trakt','simkl','watchmode'
]);
function mf467RatingProviders(item){
 // Unlike general Metadata Recovery, avoid wasting the four-slot provider
 // budget on bibliographic adapters that cannot return external scores.
 const opts=mf439Preferences(),enabled=new Set(opts.enabled);
 const all=typeof mf453Ready==='function'?mf453Ready('metadata',item):
  typeof mf466Providers==='function'?mf466Providers(item):opts.enabled;
 const ids=item?.externalIds||{};
 const saved=item?.universalMetadata?.provenance||{};
 const keyMap={jikan:['mal'],malofficial:['mal'],anilist:['anilist'],
  kitsu:['kitsu'],tvmaze:['tvmaze'],vndb:['vndb'],
  tmdb:['tmdb','tmdb_tv'],omdb:['imdb'],trakt:['trakt'],
  simkl:['simkl'],watchmode:['watchmode']};
 return [...new Set(all)].filter(x=>enabled.has(x)&&MF467_RATING_PROVIDERS.has(x))
  .map((id,index)=>({id,index,weight:(keyMap[id]||[id]).some(k=>ids[k])?4:
   Object.entries(saved).some(([token,v])=>token.startsWith('rating.')&&v?.source===id&&v.verified===true)?3:0}))
  .sort((a,b)=>b.weight-a.weight||a.index-b.index).slice(0,4).map(x=>x.id);
}

function mf467IsCurrent(item,id,account,signature){
 return Boolean(mf439Account()===account&&mf439Item(id)===item&&
  mf442TitleSignature(item)===signature&&!S.loading);
}
function mf467Button(item,placement){
 const id=item?.id!=null&&mf439Item(item.id)===item?String(item.id):'';
 const running=MF467.working,selected=running&&MF467.titleId===id;
 const hint=!id?'Save this title to your Library before refreshing ratings.':
  selected?'Checking '+(MF467.provider||'available providers')+'…':
  running?'Another title is currently refreshing.':
  MF467.titleId===id&&MF467.note?MF467.note:
  'Checks configured providers; only verified, unprotected ratings change.';
 return '<div class="mf467-rating-refresh" data-mf467-title="'+escapeHtml(id)+'" data-mf467-placement="'+
  escapeHtml(placement)+'">'+
  '<button type="button" class="btn btn-sm btn-ghost mf467-rating-refresh-btn" '+
  (!id||running?'disabled ':'')+'onclick="App.mf467RefreshRatings('+escapeHtml(JSON.stringify(id))+')">'+
  mf425Icon('refresh',17)+
  '<span>'+ (selected?'Refreshing ratings…':'Refresh external ratings')+'</span></button>'+
  '<small class="mf467-rating-hint" role="status" aria-live="polite">'+escapeHtml(hint)+'</small></div>';
}
const mf467EditorBase=libraryModalHtml;
libraryModalHtml=function(item){
 const html=String(mf467EditorBase.apply(this,arguments)||'');
 if(!html.includes('mf437-ratings'))return html;
 try{
  const root=document.createElement('div');root.innerHTML=html;
  const summary=root.querySelector('.mf437-ratings > summary');
  if(!summary)return html;
  // New unsaved titles get a disabled button with an explicit explanation.
  summary.insertAdjacentHTML('afterend',mf467Button(item||{},'editor'));
  return root.innerHTML;
 }catch(e){console.warn('v467 editor ratings control:',e);return html;}
};
function mf467DetailsRatings(item){
 return '<div class="mf467-details-values mf437-detail-grid">'+
  (mf450RatingTiles(item)||'<p class="mf467-empty-ratings">No saved external ratings yet.</p>')+
  '</div>';
}
const mf467DetailsBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 const html=String(mf467DetailsBase.apply(this,arguments)||'');
 if(!item?.id||!html.includes('v181-title-details'))return html;
 try{
  const root=document.createElement('div');root.innerHTML=html;
  // Remove the older rating subsection so each provider appears only once,
  // even after ratings update live. Keep the rest of Universal Metadata.
  const meta=root.querySelector('.mf437-details');
  if(meta){
   for(const header of [...meta.querySelectorAll('.v181-detail-section-label')]){
    if(!header.textContent.includes('External ratings'))continue;
    const next=header.nextElementSibling;
    if(next?.classList.contains('mf437-detail-grid'))next.remove();
    header.remove();
   }
  }
  const area=root.querySelector('.v181-title-details-body');
  const panel='<section class="mf467-details-ratings" data-mf467-detail-title="'+
   escapeHtml(String(item.id))+'"><div class="mf467-details-head"><strong>'+
   mf425Icon('star',17)+' External ratings</strong><small>Provider scores · separate from your rating</small></div>'+
   mf467Button(item,'details')+mf467DetailsRatings(item)+'</section>';
  if(meta)meta.insertAdjacentHTML('afterend',panel);
  else if(area)area.insertAdjacentHTML('beforeend',panel);
  else return html;
  return root.innerHTML;
 }catch(e){console.warn('v467 title details ratings panel:',e);return html;}
};
function mf467PatchEditor(item,before){
 const root=document.querySelector('#modal-root [data-mf437-editor]');
 if(!root)return;
 const found=root.closest('.v240-library-editor,.v238-library-editor');
 const persisted=found&&String(item.id||'');
 if(!persisted)return;
 // Do not repaint an unrelated open editor while refreshing Title Details.
 // The editor may also contain unsaved draft title text; preserve that draft.
 if(S.modal?.type==='library'&&S.modal.id!=null&&
  String(S.modal.id)!==String(item.id))return;
 if(typeof mf456EditorMatches==='function'&&mf456EditorMatches(item)!==found)return;
 // Only update form fields that are still unmodified. In-progress user edits
 // (including ratings or manual locks) must survive the background check.
 const original=before||{},next=item.universalMetadata?.externalRatings||{};
 for(const [key,latest] of Object.entries(next)){
  const old=original[key]||{};
  for(const [field,current,prior] of [
   ['rating',latest?.score,old.score],
   ['scale',latest?.scale,old.scale],
   ['votes',latest?.votes,old.votes]
  ]){
   const inp=root.querySelector('[data-mf437-'+field+'="'+CSS.escape(key)+'"]');
   if(!inp||inp.dataset.mf467Dirty==='1'||document.activeElement===inp)continue;
   const fallback=field==='scale'?MF437_RATING_MAP.get(key)?.[2]:null;
   const expected=prior==null?(fallback==null?'':String(fallback)):String(prior);
   if(inp.value!==expected)continue;
   const updated=current==null?(fallback==null?'':String(fallback)):String(current);
   inp.value=updated;
  }
 }
 const note=root.querySelector('.mf467-rating-refresh .mf467-rating-hint');
 if(note)note.textContent=MF467.note;
}
function mf467PatchDetails(item){
 for(const panel of document.querySelectorAll('.mf467-details-ratings[data-mf467-detail-title]')){
  if(panel.dataset.mf467DetailTitle!==String(item.id))continue;
  const grid=panel.querySelector('.mf467-details-values');
  if(grid)grid.innerHTML=mf450RatingTiles(item)||
   '<p class="mf467-empty-ratings">No saved external ratings yet.</p>';
 }
}
function mf467Paint(item){
 for(const button of document.querySelectorAll('.mf467-rating-refresh[data-mf467-title]')){
  if(button.dataset.mf467Title!==String(item?.id??''))continue;
  const next=mf467Button(item,button.dataset.mf467Placement||'editor');
  // Never replace the parent editor or close/overwrite any draft changes.
  button.outerHTML=next;
 }
}
document.addEventListener('input',event=>{
 const input=event.target;
 if(input?.matches?.('[data-mf437-rating],[data-mf437-scale],[data-mf437-votes]'))
  input.dataset.mf467Dirty='1';
},true);
document.addEventListener('change',event=>{
 const input=event.target;
 if(input?.matches?.('[data-mf437-rating],[data-mf437-scale],[data-mf437-votes]'))
  input.dataset.mf467Dirty='1';
},true);
async function mf467RefreshRatings(id,options={}){
 const quiet=options?.quiet===true;
 id=String(id??'');
 const item=mf439Item(id);
 if(!item||!AUTH_USER||!AUTH_READY||S.loading)
  return {ok:false,reason:'Save the title and finish loading MediaFlow first.'};
 if(MF467.working||MF466.working||MF439.working||MF424.running||
  MF442.process||mf442CoverLockIsActive()||mf442MetadataLockIsActive()||
  (typeof MF453Quick!=='undefined'&&MF453Quick.current)){
  const reason='Another recovery or ratings refresh is already running.';
  if(!quiet)showToast(reason);return {ok:false,reason};
 }
 if(!navigator.onLine){if(!quiet)showToast('Offline. Ratings need provider access.');return {ok:false,reason:'Offline'};}
 const providers=mf467RatingProviders(item);
 if(!providers.length){
  const reason='No ready rating metadata providers. Enable/configure them in Provider Management.';
  if(!quiet)showToast(reason);return {ok:false,reason};
 }
 if(!mf442AcquireProcess('metadata')){if(!quiet)showToast('A recovery is already active in another tab.');return {ok:false,reason:'Another tab owns recovery'};}
 if(!mf439AcquireLease()){mf442ReleaseProcess('metadata');if(!quiet)showToast('Metadata recovery is already active.');return {ok:false,reason:'Another tab owns metadata'};}
 const account=mf439Account(),signature=mf442TitleSignature(item),epoch=++MF467.sequence;
 const before=structuredClone(item.universalMetadata?.externalRatings||{});
 const oldAccount=MF439.account,controller=new AbortController(),result={ok:false,changed:0};
 MF467.working=true;MF467.titleId=id;MF467.account=account;MF467.abort=controller;
 MF467.provider='';MF467.note='Checking configured rating providers…';MF467.success=null;
 MF439.account=account;MF439.working=true;
 const keepAlive=setInterval(()=>{if(!mf442RenewMetadataLease())controller.abort();},8000);
 mf467Paint(item);
 try{
  const discovered=await mf439Discover(item,providers,provider=>{
   MF467.provider=provider;MF467.note='Checking '+provider+'…';mf467Paint(item);
  },controller.signal);
  if(controller.signal.aborted||epoch!==MF467.sequence||
   !mf442ProcessOwned('metadata')||!mf442MetadataLeaseOwned()||
   !mf467IsCurrent(item,id,account,signature))
   throw Error('Title, account, or recovery ownership changed. Nothing saved.');
  const verified=(discovered.results||[]).filter(row=>
   mf439Evidence(item,row).confidence>=mf439Preferences().minimumConfidence);
  // One bounded, rating-only guarded merge: no metadata, external IDs,
  // personal score, history, cover, progress, or recommendation changes.
  if(!verified.length){
   const errors=discovered.failures?.length?' Some providers were unavailable.':'';
   MF467.note='No verified rating match was returned.'+errors;
   result.ok=true;result.changed=0;return result;
  }
  const written=mf466ApplyVerified(item,verified,{ratings:true,metadata:false,ids:false});
  result.changed=written.ratings||0;
  if(controller.signal.aborted||epoch!==MF467.sequence||mf439Account()!==account||
    mf439Item(id)!==item)
   throw Error('Account or title changed before saving.');
  if(written.changed){
   await saveState();
   try{v53InvalidateLibraryCache();}catch(_){}
  }
  MF467.note=result.changed?result.changed+' verified rating'+(result.changed===1?'':'s')+
   ' updated and saved.':'Ratings already up to date.';
  result.ok=true;MF467.success=true;
  mf467PatchEditor(item,before);mf467PatchDetails(item);
  // Keep recommendation tiles live if the updated title is also recommended.
  if(typeof mf466Repaint==='function')mf466Repaint();
 }catch(e){
  result.reason=String(e?.message||e).slice(0,160);
  MF467.note=result.reason;MF467.success=false;
  console.warn('v467 ratings refresh:',e);
 }finally{
  clearInterval(keepAlive);
  MF467.working=false;MF467.provider='';MF467.abort=null;
  MF439.working=false;MF439.account=oldAccount;
  mf439ReleaseLease();mf442ReleaseProcess('metadata');
  mf467Paint(item);
 }
 if(!quiet)showToast(MF467.note);
 return result;
}
App.mf467RefreshRatings=mf467RefreshRatings;
window.MediaFlowV467=Object.freeze({
 version:MF467_VERSION,logo:mf467Mark,refresh:mf467RefreshRatings,providers:mf467RatingProviders,
 button:mf467Button,details:mf467DetailsRatings,
 active:()=>({working:MF467.working,titleId:MF467.titleId,note:MF467.note})
});
MediaFlowRuntime.version=MF467_VERSION;
