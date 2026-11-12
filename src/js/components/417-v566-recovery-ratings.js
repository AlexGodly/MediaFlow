/* MediaFlow v566 — Details Recovery review and ratings.
 *
 * Select all / Deselect all
 *   The field review gets Select all and Deselect all. They act on the fields
 *   that can be saved (never protected, unchanged or existing ones) and only
 *   on the fields the "Show fields" filter is showing.
 *
 * Ratings found by Details Recovery are the title's external ratings
 *   - A verified rating found by recovery is saved as the title's external
 *     rating: it fills an empty rating, and it also replaces an automatic
 *     rating whose value is different (newer). A rating you entered yourself
 *     (manual / locked) is never changed.
 *   - Ratings saved by recovery are marked (provenance.via = 'recovery').
 *     A later ratings refresh updates them when any verified source returns
 *     a different value, and leaves them as they are when there's no new
 *     value or the source can't be reached.
 *   - The MediaFlow app writes exactly the same (website v566 contract).
 */
const MF566_RECOVERY_VIA='recovery';

function mf566RatingSame(a,b){
  if(!a||!b)return false;
  return Number(a.score)===Number(b.score)&&Number(a.scale)===Number(b.scale)&&((a.votes??null)===(b.votes??null));
}
function mf566HasScore(r){return !!(r&&r.score!=null&&String(r.score).trim()!=='');}

/* ---------- proposals: automatic ratings with a new value can be updated ---------- */
const mf566ProposalsBase=mf439Proposals;
mf439Proposals=function(item,results){
  const out=mf566ProposalsBase.apply(this,arguments);
  const list=Array.isArray(out)?out:Array.isArray(out?.proposals)?out.proposals:[];
  for(const p of list){
    if(!p||!String(p.token||'').startsWith('rating.')||!p.hasOriginal||p.protected||p.same)continue;
    const best=p.options?.[0];
    if(!best||mf566RatingSame(best.value,p.original))continue;
    p.mf566RatingUpdate=true;
    p.hasOriginal=false;          // the checkbox can be used; the original stays shown as "Current"
    p.status='update';
    p.selected=!p.disagree&&Number(best.confidence)>=0.7;
  }
  return out;
};

/* ---------- apply: save recovery ratings, including updates ---------- */
const mf566ApplyBase=mf439Apply;
mf439Apply=function(item,preview,mode='review'){
  const props=Array.isArray(preview?.proposals)?preview.proposals:[];
  const reviewOnly=mode==='automatic'&&typeof mf448PolicyMetadata==='function'&&mf448PolicyMetadata().metadataPolicy==='review';
  const minimum=typeof mf439Preferences==='function'?Number(mf439Preferences().minimumConfidence)||0.9:0.9;
  const updates=reviewOnly?[]:props.filter(p=>p.mf566RatingUpdate&&p.selected&&
    (mode!=='automatic'||(!p.disagree&&Number(p.options?.[p.choice]?.confidence??p.options?.[0]?.confidence)>=minimum)));
  const fills=props.filter(p=>p.selected&&!p.mf566RatingUpdate&&String(p.token||'').startsWith('rating.'));
  const result=mf566ApplyBase.apply(this,arguments)||{changed:0};
  if(!item||reviewOnly||result.reviewOnly)return result;
  const env=mf437Normalized(item.universalMetadata),now=Date.now();
  let touched=false,updated=0;
  // Mark ratings the base step just filled as recovery ratings.
  for(const p of fills){
    const key=p.token.slice(7),src=(p.options?.[p.choice]||p.options?.[0])?.sources?.[0];
    const prov=env.provenance[p.token];
    if(!src||!prov||prov.source!==src.provider||prov.verified!==true||!mf566HasScore(env.externalRatings[key]))continue;
    if(prov.via!==MF566_RECOVERY_VIA){prov.via=MF566_RECOVERY_VIA;touched=true;}
  }
  for(const p of updates){
    const key=p.token.slice(7);
    if(mf439IsProtected(item,p.token)||!MF437_RATING_MAP.has(key))continue;
    const choice=p.options?.[p.choice]||p.options?.[0],src=choice?.sources?.[0];
    if(!choice||!src||Number(src.confidence)<0.7)continue;
    const value=mf439Value(p.token,choice.value);
    if(!value||mf566RatingSame(value,env.externalRatings[key]))continue;
    if(mf437SetRating(env,key,value,{source:src.provider,verified:true,force:true,updatedAt:now})){
      env.provenance[p.token]={source:src.provider,verified:true,recordId:String(src.recordId??'').slice(0,200),updatedAt:now,via:MF566_RECOVERY_VIA};
      updated++;touched=true;
    }
  }
  if(touched){
    item.universalMetadata=env;
    item.modifiedAt=Math.max(Number(item.modifiedAt)||0,now);
  }
  if(updated){
    result.changed=(Number(result.changed)||0)+updated;
    result.ratings=(Number(result.ratings)||0)+updated;
    result.ratingsUpdated=updated;
  }
  return result;
};

/* ---------- ratings refresh: recovery ratings take any newer verified value ---------- */
const mf566ApplyRatingsBase=mf555ApplyRatings;
mf555ApplyRatings=function(item,result){
  const env0=mf437Normalized(item?.universalMetadata);
  const watched=new Map();
  for(const [key,r] of Object.entries(env0.externalRatings||{})){
    const prov=env0.provenance?.['rating.'+key];
    if(prov?.via===MF566_RECOVERY_VIA&&mf566HasScore(r)&&!mf439IsProtected(item,'rating.'+key))watched.set(key,{...r});
  }
  const out=mf566ApplyRatingsBase.apply(this,arguments)||{ratings:0,ids:0,changed:0};
  if(!watched.size||!item)return out;
  const env=mf437Normalized(item.universalMetadata),now=Date.now();
  // Best verified value per rating, same ranking as the ratings engine.
  const best=new Map();
  for(const row of result?.accepted||[]){
    for(const [key,raw] of Object.entries(row.ratings||{})){
      if(!watched.has(key))continue;
      const value=mf439Value('rating.'+key,raw);if(!value)continue;
      const prio=(MF555R_PRIMARY[key]||[]).indexOf(row.provider),rank=prio<0?99:prio;
      const viaRank=row.mf555Via==='whole-show'?1:0,cur=best.get(key);
      if(!cur||viaRank<cur.viaRank||(viaRank===cur.viaRank&&rank<cur.rank))best.set(key,{row,value,rank,viaRank});
    }
  }
  let extra=0;
  for(const [key,before] of watched){
    const pick=best.get(key);
    if(!pick)continue;                                   // no new value / source unreachable: keep it
    const token='rating.'+key,cur=env.externalRatings[key];
    if(!mf566RatingSame(cur,before)){                     // the base refresh already updated it
      if(env.provenance[token])env.provenance[token].via=MF566_RECOVERY_VIA;
      continue;
    }
    if(mf566RatingSame(pick.value,cur))continue;
    if(mf437SetRating(env,key,pick.value,{source:pick.row.provider,verified:true,force:true,updatedAt:now})){
      env.provenance[token]={source:pick.row.provider,verified:true,recordId:String(pick.row.recordId||''),updatedAt:now,via:MF566_RECOVERY_VIA,
        ...(pick.row.mf555Via==='whole-show'?{scope:'whole-show'}:{})};
      extra++;
    }
  }
  if(extra){
    item.universalMetadata=env;
    item.modifiedAt=Math.max(Number(item.modifiedAt)||0,now);
    try{MF555R.stats.ratingsWritten+=extra;}catch(_){}
    out.ratings=(Number(out.ratings)||0)+extra;out.changed=(Number(out.changed)||0)+extra;
  }
  return out;
};

/* ---------- review: Select all / Deselect all ---------- */
function mf566Selectable(p){return !!p&&!p.protected&&!p.same&&!p.hasOriginal;}
function mf566VisibleInFilter(p){
  const f=typeof MF441!=='undefined'?String(MF441.previewFilter||'all'):'all';
  return f==='all'||p.status===f;
}
const mf566PreviewBase=mf439PreviewHtml;
mf439PreviewHtml=function(){
  const html=mf566PreviewBase.apply(this,arguments);
  const props=MF439.preview?.preview?.proposals||[];
  if(!props.some(mf566Selectable)||!html.includes('<div class="mf439-fields"'))return html;
  const tools='<div class="mf566-select-tools" role="group" aria-label="Select fields">'+
    '<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf566SelectFields(true)">'+mf425Icon('check',15)+' Select all</button>'+
    '<button type="button" class="btn btn-sm btn-ghost" onclick="App.mf566SelectFields(false)">'+mf425Icon('x',15)+' Deselect all</button>'+
    '<small data-mf566-selected>'+props.filter(p=>p.selected).length+' of '+props.filter(mf566Selectable).length+' selected</small></div>';
  return html.replace('<div class="mf439-fields"',tools+'<div class="mf439-fields"');
};
function mf566RefreshSelection(){
  const props=MF439.preview?.preview?.proposals||[];
  document.querySelectorAll('#mf439-recovery-modal .mf439-proposal').forEach((row,i)=>{
    const box=row.querySelector('.mf439-proposal-head input[type="checkbox"]');
    if(box&&props[i])box.checked=!!props[i].selected;
  });
  const label=document.querySelector('#mf439-recovery-modal [data-mf566-selected]');
  if(label)label.textContent=props.filter(p=>p.selected).length+' of '+props.filter(mf566Selectable).length+' selected';
  document.querySelector('#mf439-recovery-modal .mf439-preview-actions button.btn-primary')?.toggleAttribute('disabled',!props.some(p=>p.selected));
}
function mf566SelectFields(on){
  const props=MF439.preview?.preview?.proposals||[];
  for(const p of props)if(mf566Selectable(p)&&mf566VisibleInFilter(p))p.selected=Boolean(on);
  mf566RefreshSelection();
}
const mf566ToggleBase=mf439Toggle;
mf439Toggle=function(){const r=mf566ToggleBase.apply(this,arguments);mf566RefreshSelection();return r;};

Object.assign(App,{mf566SelectFields,mf439Toggle});
window.MediaFlowV566=Object.assign(window.MediaFlowV566||{},{recoveryVia:MF566_RECOVERY_VIA,applyRatings:(i,r)=>mf555ApplyRatings(i,r),applyRecovery:(i,p,m)=>mf439Apply(i,p,m),proposals:(i,r)=>mf439Proposals(i,r)});
