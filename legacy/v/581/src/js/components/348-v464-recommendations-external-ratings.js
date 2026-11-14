/* MediaFlow v464 — External Ratings for MediaFlow Recommends.
 * Read existing, user-scoped v437/v450 Universal Metadata scores only.
 * Never download or manufacture a provider score on Dashboard render.
 * Display original scales; optionally adjust future title ranking using only
 * explicitly VERIFIED provider evidence. Personal ratings and Personal Order
 * remain independent of external rating signals.
 */
const MF464_VERSION=464;
const MF464_RATING_CACHE=new WeakMap();
const MF464_INFLUENCE={off:0,light:4,balanced:8};
const MF464_EMPTY_RATINGS=Object.freeze({rows:[],verified:[],average:null,verifiedCount:0,votes:0});
function mf464Prefs(){
 const s=S.settings||{};
 return {show:s.v464ShowExternalRatings!==false,
  influence:Object.hasOwn(MF464_INFLUENCE,s.v464RatingInfluence)?s.v464RatingInfluence:'off'};
}
function mf464RatingsForTitle(item){
 if(!item||typeof item!=='object')return MF464_EMPTY_RATINGS;
 const env=item.universalMetadata;
 if(!env||typeof env!=='object')return MF464_EMPTY_RATINGS;
 const cached=MF464_RATING_CACHE.get(item);
 if(cached&&cached.env===env&&cached.revision===env.updatedAt&&
   cached.ratings===env.externalRatings&&cached.provenance===env.provenance)
  return cached.result;
 const ratings=env.externalRatings&&typeof env.externalRatings==='object'&&!Array.isArray(env.externalRatings)?env.externalRatings:{};
 const provenance=env.provenance&&typeof env.provenance==='object'&&!Array.isArray(env.provenance)?env.provenance:{};
 const rows=[];
 for(const [key,label,defaultScale] of MF437_RATING_SOURCES){
  const entry=ratings[key];
  if(!entry||typeof entry!=='object'||Array.isArray(entry)||entry.score===null||
     entry.score===undefined||String(entry.score).trim()==='')continue;
  const score=Number(entry.score),scale=Number(entry.scale??defaultScale);
  if(!Number.isFinite(score)||!Number.isFinite(scale)||scale<=0||scale>100000||
     score<0||score>scale)continue;
  const voteRaw=entry.votes;
  const votes=voteRaw===null||voteRaw===undefined||String(voteRaw).trim()===''?null:Number(voteRaw);
  const safeVotes=votes!==null&&Number.isSafeInteger(votes)&&votes>=0?votes:null;
  const proof=provenance['rating.'+key]||{};
  const manual=proof.source==='manual'||entry.source==='manual';
  // Entries missing genuine provider provenance remain viewable but NEVER
  // contribute to a verified average or recommendation score.
  const verified=!manual&&proof.verified===true&&typeof proof.source==='string'&&
   proof.source.trim().length>0&&(!entry.source||entry.source===proof.source);
  const normalized=score/scale*100;
  const weight=safeVotes===null?1:Math.max(0.6,Math.min(2.5,0.8+Math.log10(safeVotes+1)*0.33));
  rows.push({key,label,score,scale,votes:safeVotes,normalized,verified,manual,
   provider:verified?String(proof.source):'',weight});
 }
 const verified=rows.filter(row=>row.verified);
 const totalWeight=verified.reduce((sum,row)=>sum+row.weight,0);
 const average=totalWeight>0?verified.reduce((sum,row)=>sum+row.normalized*row.weight,0)/totalWeight:null;
 const votes=verified.reduce((sum,row)=>sum+(row.votes||0),0);
 const result={rows,verified,average,verifiedCount:verified.length,votes};
 MF464_RATING_CACHE.set(item,{env,ratings:env.externalRatings,provenance:env.provenance,revision:env.updatedAt,result});
 return result;
}
function mf464RatingBonus(item){
 const influence=MF464_INFLUENCE[mf464Prefs().influence];
 if(!influence)return 0;
 const {average,verifiedCount,votes}=mf464RatingsForTitle(item);
 if(average===null||verifiedCount===0)return 0;
 // A single obscure score is intentionally less influential than several
 // verified sources with substantive vote evidence. Caps are strict.
 const confidence=Math.min(1,0.35+Math.min(0.3,verifiedCount*0.12)+
  Math.min(0.35,Math.log10(votes+1)*0.09));
 const centered=Math.max(-1,Math.min(1,(average-50)/50));
 return centered*influence*confidence;
}
const mf464ScoreBase=scoreLibraryTitle;
scoreLibraryTitle=function(item,cat){
 const original=mf464ScoreBase.apply(this,arguments);
 return Number.isFinite(original)?original+mf464RatingBonus(item):original;
};
function mf464Formatted(value){
 return Number(value).toLocaleString(undefined,{maximumFractionDigits:2});
}
function mf464RatingTile(row){
 return '<div class="mf464-rating-tile" data-mf464-provider="'+escapeHtml(row.key)+'">'+
  '<div class="mf464-provider">'+mf450ProviderMark(row.key)+'<strong>'+escapeHtml(row.label)+'</strong></div>'+
  '<div class="mf464-score"><b>'+escapeHtml(mf464Formatted(row.score))+'</b><small>/ '+escapeHtml(mf464Formatted(row.scale))+'</small></div>'+
  '<div class="mf464-row-foot"><span class="mf464-proof '+(row.verified?'mf464-proof-verified':'')+'">'+
  (row.verified?'Verified provider':row.manual?'Manually entered':'Saved · unverified')+'</span>'+
  (row.votes!==null?'<span>'+escapeHtml(row.votes.toLocaleString())+' votes</span>':'')+'</div></div>';
}
function mf464RatingsHtml(item){
 const data=mf464RatingsForTitle(item),prefs=mf464Prefs();
 const enabled=prefs.influence!=='off',bonus=enabled?mf464RatingBonus(item):0;
 const heading='<div class="mf419-group-title mf464-title">'+mf419Icon('star',20)+
  '<strong>External ratings</strong><span>Separate from your personal rating</span></div>';
 const summary=data.verifiedCount&&data.average!==null?
  '<div class="mf464-aggregate" role="note"><span class="mf464-aggregate-score">'+
  escapeHtml((Math.round(data.average*10)/10).toLocaleString())+
  '<small>/ 100</small></span><span><strong>'+
  (data.verifiedCount>1?'Weighted verified-source average':'Verified-source normalized score')+
  '</strong><small>'+data.verifiedCount+' verified source'+(data.verifiedCount===1?'':'s')+
  ' · Original ratings shown below</small></span></div>':
  '<p class="mf464-no-verification">No verified-source average yet. Manually entered or unverified scores never influence recommendations.</p>';
 const message=!data.rows.length?
  '<p class="mf464-no-data">No external ratings saved for this title yet. Use Edit Title → Universal Metadata or verified Metadata Recovery to add them.</p>':
  '<div class="mf464-rating-grid">'+data.rows.slice(0,4).map(mf464RatingTile).join('')+'</div>'+
  (data.rows.length>4?'<details class="mf464-more"><summary>Show '+(data.rows.length-4)+
    ' more saved source rating'+(data.rows.length===5?'':'s')+'</summary><div class="mf464-rating-grid">'+
    data.rows.slice(4).map(mf464RatingTile).join('')+'</div></details>':'');
 const impact=enabled&&data.verifiedCount?
  'Verified ratings contribute '+(bonus>=0?'+':'')+bonus.toFixed(1)+' to future title selection ('+
    (prefs.influence==='light'?'Light · maximum ±4':'Balanced · maximum ±8')+').':
  enabled?'Rating influence is enabled, but there are no verified provider scores for this title.':
  'Ratings do not affect which title is recommended unless you enable influence in Settings.';
 return '<section class="mf419-insight-group mf464-recommend-ratings" aria-label="Saved external ratings for this recommended title">'+
  heading+(data.rows.length?summary:'')+message+'<small class="mf464-impact">'+escapeHtml(impact)+
  ' Saved ratings are shown without making network requests.</small></section>';
}
// v463 already wraps the v419 recommendation card. Insert AFTER title progress
// and BEFORE the category statistics; do not change recommendation ID/history.
const mf464RecBase=mf395DashboardRecommendationHtml;
mf395DashboardRecommendationHtml=function(task,cat){
 const html=String(mf464RecBase.apply(this,arguments)||'');
 if(!mf464Prefs().show||!S.settings?.exactTitleRecommendations||!task?.title||
  !html.includes('<div class="mf419-category-stats">'))return html;
 const item=mf395DashboardRecommendedItem(task);
 if(!item)return html;
 return html.replace('<div class="mf419-category-stats">',
  mf464RatingsHtml(item)+'<div class="mf419-category-stats">');
};
function mf464SettingsHtml(){
 const prefs=mf464Prefs();
 return '<section class="mf464-settings" data-mf-setting-id="external-recommendation-ratings">'+
  '<div class="mf464-settings-head">'+mf419Icon('star',19)+
  '<div><strong>External ratings in MediaFlow Recommends</strong><small>Source-specific ratings already saved in Universal Metadata. No automatic API requests.</small></div></div>'+
  '<label class="mf464-show-setting" data-mf-setting-id="v464ShowExternalRatings"><input type="checkbox" '+
  (prefs.show?'checked ':'')+'onchange="App.mf464Setting(&#39;show&#39;,this.checked)">'+
  '<span>Show saved external ratings on the recommended title card</span></label>'+
  '<label class="mf464-influence-setting" data-mf-setting-id="v464RatingInfluence"><span>'+
  '<strong>Use verified ratings for future title ranking</strong>'+
  '<small>Personal Order keeps precedence. Your own rating is never replaced. Default: Off.</small></span>'+
  '<select aria-label="External rating influence" onchange="App.mf464Setting(&#39;influence&#39;,this.value)">'+
  [['off','Off · existing ranking unchanged'],['light','Light · up to ±4 points'],['balanced','Balanced · up to ±8 points']].map(([key,label])=>
  '<option value="'+key+'" '+(prefs.influence===key?'selected':'')+'>'+label+'</option>').join('')+
  '</select></label><p class="mf464-settings-note">Only verified provider ratings are normalized for ranking. Missing, manually entered, or unverified values do not count. Existing title picks change only when you reroll or generate a new recommendation.</p></section>';
}
const mf464SettingsRenderer=V219_PAGE_RENDERERS.get('settings');
if(typeof mf464SettingsRenderer==='function')MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
 const html=String(mf464SettingsRenderer.call(this,ctx)||'');
 if(!html.includes('mf404-recommendations-card')||html.includes('data-mf-setting-id="external-recommendation-ratings"'))return html;
 const host=document.createElement('div');host.innerHTML=html;
 const card=host.querySelector('.mf404-recommendations-card');
 if(!card)return html;
 card.insertAdjacentHTML('beforeend',mf464SettingsHtml());
 return host.innerHTML;
});
if(typeof v366RegisterSetting==='function'){
 v366RegisterSetting({id:'external-recommendation-ratings',section:'title-recommendations',
  selector:'[data-mf-setting-id="external-recommendation-ratings"]',
  label:'External ratings for recommendations',subgroup:'Title Recommendations',
  keywords:['rating','external','IMDb','AniList','MyAnimeList','consensus','provider','ranking','score']});
 v366RegisterSetting({id:'v464RatingInfluence',section:'title-recommendations',
  selector:'[data-mf-setting-id="v464RatingInfluence"]',
  label:'External ratings ranking influence',subgroup:'Title Recommendations',
  keywords:['weighted','rank','score','votes','personal order','verified','recommend']});
}
App.mf464Setting=function(key,value){
 const settings=S.settings||(S.settings={});
 if(key==='show')settings.v464ShowExternalRatings=Boolean(value);
 else if(key==='influence')settings.v464RatingInfluence=Object.hasOwn(MF464_INFLUENCE,value)?value:'off';
 else return;
 Promise.resolve(persistSettings()).catch(e=>{
  console.warn('v464 external rating preference could not sync',e);
  showToast('Unable to sync external-rating preferences. Try again.');
 });
};
window.MediaFlowV464=Object.freeze({version:MF464_VERSION,prefs:mf464Prefs,
 ratings:mf464RatingsForTitle,bonus:mf464RatingBonus,tiles:mf464RatingsHtml,
 settings:mf464SettingsHtml});
MediaFlowRuntime.version=MF464_VERSION;
