/* ============================================================
   MediaFlow v123 — Dashboard Rating Queue + Rating XP
   - Shows one unrated Library title at a time directly below Stopwatch.
   - Confirm & Next saves the existing 0–10 MediaFlow rating and advances.
   - Skip rotates the title to the back of the in-memory queue, so it returns later.
   - Rating through this queue awards configurable one-time Rating XP.
   - The rating change and XP are written to Library History through the normal
     transaction/activity system and remain undoable.
   ============================================================ */

DEFAULT_SETTINGS.leveling.ratingXP=Number.isFinite(Number(DEFAULT_SETTINGS.leveling.ratingXP))
  ? Math.max(0,Number(DEFAULT_SETTINGS.leveling.ratingXP))
  : 10;

const v123EnsureXPStateBase=v120EnsureXPState;
v120EnsureXPState=function(){
  v123EnsureXPStateBase();
  S.settings=S.settings||{};
  S.settings.leveling=Object.assign({},DEFAULT_SETTINGS.leveling,S.settings.leveling||{});
  if(!Number.isFinite(Number(S.settings.leveling.ratingXP))) S.settings.leveling.ratingXP=10;
  S.xpLedger=S.xpLedger||{};
  if(!S.xpLedger.ratings || typeof S.xpLedger.ratings!=='object' || Array.isArray(S.xpLedger.ratings)) S.xpLedger.ratings={};
};

function v123RatingXPValue(){
  return Math.max(0,Math.round(Number(levelingSettings().ratingXP)||0));
}
function v123AwardRatingXP(id){
  if(!id)return 0;
  v120EnsureXPState();
  const ledger=S.xpLedger.ratings;
  if(Object.prototype.hasOwnProperty.call(ledger,id))return 0;
  const xp=levelingSettings().enabled===false?0:v123RatingXPValue();
  ledger[id]=xp; // Store even 0 so changing Settings cannot re-award an old rating.
  return xp;
}
function v123RatingLedgerXP(ledger=S.xpLedger){
  return Object.values(ledger?.ratings||{}).reduce((a,v)=>a+(Number(v)||0),0);
}

// Rating XP participates in the same lifetime progression source of truth.
const v123ExtraLibraryXPBase=v46ExtraLibraryXP;
v46ExtraLibraryXP=function(){ return v123ExtraLibraryXPBase()+v123RatingLedgerXP(); };
libraryXPTotal=function(){ return v46LibraryBaseXP()+v46ExtraLibraryXP(); };

// Keep progression breakdowns / full JSON exports aware of the new source.
const v123XPBreakdownBase=v120XPBreakdown;
v120XPBreakdown=function(){
  const b=v123XPBreakdownBase();
  const ratingXP=v123RatingLedgerXP();
  const ratingRewards=Object.keys(S.xpLedger?.ratings||{}).length;
  return Object.assign({},b,{total:(Number(b.total)||0)+ratingXP,ratingXP,ratingRewards});
};

// Library History calculates XP from before/after transaction snapshots.
const v123SnapshotXPBase=v50SnapshotXP;
v50SnapshotXP=function(x){
  const base=v123SnapshotXPBase(x);
  if(base==null)return base;
  return base+v123RatingLedgerXP(x?.xpLedger||{});
};

// Preserve Rating XP independently when Sync now merges local + cloud state.
const v123MergeStatesBase=mergeStates;
mergeStates=function(a,b){
  const out=v123MergeStatesBase(a,b)||{};
  out.xpLedger=out.xpLedger||{};
  out.xpLedger.ratings=Object.assign({},b?.xpLedger?.ratings||{},a?.xpLedger?.ratings||{});
  return out;
};

let V123_RATING_QUEUE=[];
let V125_RATING_QUEUE_LOADED=false;
function v125RatingQueueStorageKey(){
  const userId=String(AUTH_USER?.id||'local');
  return `mf_rating_queue_v125_${userId}`;
}
function v125LoadRatingQueue(){
  if(V125_RATING_QUEUE_LOADED)return;
  V125_RATING_QUEUE_LOADED=true;
  try{
    const raw=localStorage.getItem(v125RatingQueueStorageKey());
    const parsed=raw?JSON.parse(raw):[];
    V123_RATING_QUEUE=Array.isArray(parsed)?parsed.map(String).filter(Boolean):[];
  }catch(_){
    V123_RATING_QUEUE=[];
  }
}
function v125SaveRatingQueue(){
  try{
    localStorage.setItem(
      v125RatingQueueStorageKey(),
      JSON.stringify(V123_RATING_QUEUE.map(String))
    );
  }catch(_){ }
}
function v123UnratedItems(){
  return (S.library||[]).filter(i=>i?.id && !(Number(i.rating)>0));
}
function v123SyncRatingQueue(){
  v125LoadRatingQueue();
  const unrated=v123UnratedItems();
  const valid=new Set(unrated.map(i=>String(i.id)));

  // Keep the saved order exactly where the user left it, while removing titles
  // that are now rated/deleted and appending newly-unrated titles at the end.
  V123_RATING_QUEUE=V123_RATING_QUEUE.map(String).filter(id=>valid.has(id));
  const present=new Set(V123_RATING_QUEUE);
  for(const item of unrated){
    const id=String(item.id);
    if(!present.has(id)){
      V123_RATING_QUEUE.push(id);
      present.add(id);
    }
  }
  v125SaveRatingQueue();
  return unrated;
}
function v123CurrentRatingItem(){
  v123SyncRatingQueue();
  const id=V123_RATING_QUEUE[0];
  return id?(S.library||[]).find(i=>String(i?.id||'')===String(id)):null;
}
function v123StatusLabel(v){return v199StatusLabel(v);}
function v123RatingQueueHtml(){
  const unrated=v123SyncRatingQueue();
  if(!(S.library||[]).length){
    return `<div class="card v123-rating-queue"><div class="section-label">RATE YOUR LIBRARY</div><div class="v123-rating-done"><b>No Library titles yet</b><span>Add titles to your Library and unrated titles will appear here.</span></div></div>`;
  }
  if(!unrated.length){
    return `<div class="card v123-rating-queue"><div class="section-label">RATE YOUR LIBRARY</div><div class="v123-rating-done"><b>All Library titles are rated ✓</b><span>If a rating is removed later, that title will automatically return to this queue.</span></div></div>`;
  }
  const item=v123CurrentRatingItem();
  if(!item)return '';
  const cat=getCategory(item.categoryId),cover=item.coverUrl
    ? `<img class="v123-rating-cover v181-title-cover-clickable" data-library-id="${escapeHtml(String(item.id))}" src="${escapeHtml(item.coverUrl)}" alt="${escapeHtml(cleanTitle(item.title))} cover" loading="lazy" title="Open title details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')" onerror="this.style.display='none'">`
    : `<button type="button" class="v123-rating-placeholder v186-rating-placeholder-button" title="Open title details" onclick="event.preventDefault();event.stopPropagation();App.v181OpenTitleDetails('${escapeHtml(String(item.id))}')">${v144CategoryIconHtml(cat)}</button>`;
  const progress=item.total!=null?`${Number(item.progress)||0}/${Number(item.total)||0}`:`${Number(item.progress)||0} ${unitLabel(cat?.unit||'units',Number(item.progress)||0)}`;
  const alreadyRewarded=Object.prototype.hasOwnProperty.call(S.xpLedger?.ratings||{},item.id);
  const xp=alreadyRewarded?0:(levelingSettings().enabled===false?0:v123RatingXPValue());
  const xpText=alreadyRewarded?'Rating XP for this title was already earned.':(levelingSettings().enabled===false?'Leveling is disabled — rating will still be saved and added to History.':`Confirming this first rating earns +${xp.toLocaleString()} XP.`);
  return `<div class="card v123-rating-queue">
    <div class="v123-rating-head"><div><div class="section-label">RATE YOUR LIBRARY</div></div><div class="v123-rating-count">${unrated.length.toLocaleString()} unrated title${unrated.length===1?'':'s'} remaining</div></div>
    <div class="v123-rating-main">${cover}<div class="v123-rating-copy">
      <div class="v123-rating-title">${escapeHtml(cleanTitle(item.title))}</div>
      <div class="v123-rating-meta">${v144CategoryIconHtml(cat)} ${escapeHtml(cat?.name||'Library')} · ${escapeHtml(v123StatusLabel(item.status))} · ${escapeHtml(progress)}</div>
      <div class="v123-rating-control">
        <div class="field"><label class="field-label">YOUR RATING / 10</label><input id="v123-rating-input" type="number" min="0.1" max="10" step="0.1" inputmode="decimal" placeholder="e.g. 8.5" onkeydown="if(event.key==='Enter'){event.preventDefault();App.v123ConfirmRating()}"></div>
        <div class="v123-rating-actions"><button type="button" class="btn btn-ghost" onclick="App.openLibraryModal('${escapeHtml(String(item.id))}')">Edit title</button><button type="button" class="btn btn-ghost" onclick="App.v123SkipRating()">Skip</button><button type="button" class="btn btn-primary" onclick="App.v123ConfirmRating()">Confirm & Next</button></div>
      </div>
      <div class="v123-rating-xp">${escapeHtml(xpText)} Skip gives no XP and moves this title behind the rest of the queue. Your queue position is remembered after refresh.</div>
    </div></div>
  </div>`;
}

function v123SkipRating(){
  v123SyncRatingQueue();
  if(!V123_RATING_QUEUE.length)return;
  const first=V123_RATING_QUEUE.shift();
  V123_RATING_QUEUE.push(first);
  v125SaveRatingQueue();
  render();
  showToast(V123_RATING_QUEUE.length>1?'Skipped for now · this title will return after the rest of the queue':'Skipped · this is the only unrated title remaining');
}
function v123ConfirmRating(){
  const item=v123CurrentRatingItem();
  if(!item)return;
  const input=document.getElementById('v123-rating-input');
  const raw=String(input?.value??'').trim();
  if(!raw){
    v123SkipRating();
    return;
  }
  let rating=Number(raw);
  if(!Number.isFinite(rating) || rating<=0 || rating>10){
    showToast('Enter a rating from 0.1 to 10.');
    try{input?.focus();}catch(_){ }
    return;
  }
  rating=Math.round(rating*10)/10;
  const beforeXP=mediaFlowXP();
  mfBegin('Rate title',cleanTitle(item.title));
  item.rating=rating;
  const reward=v123AwardRatingXP(item.id);
  mfCommit('Rate title',`${cleanTitle(item.title)} · ${rating}/10`);
  V123_RATING_QUEUE=V123_RATING_QUEUE.filter(id=>String(id)!==String(item.id));
  v125SaveRatingQueue();
  const gained=Math.max(0,Math.round(mediaFlowXP()-beforeXP));
  render();
  showToast(`Rated ${cleanTitle(item.title)} ${rating}/10${gained?` · +${gained.toLocaleString()} XP`:''} ✓`);
}
Object.assign(App,{v123SkipRating,v123ConfirmRating});

// Place the queue exactly under the existing Stopwatch section on Dashboard.
const v123StopwatchHtmlBase=stopwatchHtml;
stopwatchHtml=function(){ return v123StopwatchHtmlBase()+v123RatingQueueHtml(); };

// Keep Leveling & XP Settings aligned with the new one-time rating reward.
const v123SettingsBase=renderSettings;
renderSettings=function(){
  v120EnsureXPState();
  let h=v123SettingsBase();
  const l=levelingSettings(),ratingXP=v123RatingLedgerXP(),ratingRewards=Object.keys(S.xpLedger?.ratings||{}).length;
  h=h.replace(
    'Control XP from time, media units, Library additions, title edits, completed Library titles, logged completions, rewatches/rereads, cover work, and rotation health.',
    'Control XP from time, media units, Library additions, title edits, ratings, completed Library titles, logged completions, rewatches/rereads, cover work, and rotation health.'
  );
  const marker='<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">REWATCH / REREAD XP</div>';
  const ratingField=`<div style="font-weight:700;font-size:12px;margin:14px 0 8px;">RATING XP</div><div class="field"><label class="field-label">Rate Library title XP</label><input type="number" min="0" value="${l.ratingXP??10}" onchange="App.updateLeveling('ratingXP',this.value)"><small class="hint">One-time XP awarded when an unrated title is confirmed through the Dashboard rating queue. Removing and rating it again cannot farm XP.</small></div><div class="hint" style="margin:-4px 0 14px">Rating rewards earned: <b>${ratingRewards.toLocaleString()}</b> title${ratingRewards===1?'':'s'} · <b>${ratingXP.toLocaleString()} XP</b>.</div>`;
  if(h.includes(marker)&&!h.includes('Rate Library title XP'))h=h.replace(marker,ratingField+marker);
  h=h.replace(
    'Rescan the entire Library and History, recalculate consumption XP, verify every completed title, rebuild logged-completion bonuses, recalculate repeat-unit/full-rewatch XP, and refresh every Level/XP display.',
    'Rescan the entire Library and History, recalculate consumption XP, verify completed titles, preserve one-time rating rewards, rebuild logged-completion bonuses, recalculate repeat-unit/full-rewatch XP, and refresh every Level/XP display.'
  );
  h=h.replace(
    'Merge cloud + local Library, History, Library History, completion data, repeat data and all XP; then refresh progression/scheduler calculations and upload one complete protected state.',
    'Merge cloud + local Library, History, Library History, completion data, rating rewards, repeat data and all XP; then refresh progression/scheduler calculations and upload one complete protected state.'
  );

  return h;
};

