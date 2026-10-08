/* MediaFlow v311 — global Community Ratings ranks with podium and leaderboard.
 * Rank comes from the database BEFORE filtering/pagination, not from the UI index.
 * The podium appears only on the unfiltered first page; all subsequent rows retain
 * their absolute positions. Quick Add reuses the verified v309 import dialog. */
const MF311={rows:[],request:0,query:'',offset:0,pageSize:60,total:0,matching:0,sort:'rating',desc:true,provider:'',minVotes:1,minLibraries:0,minRating:0,revision:null,lastReload:0};
function mf311SafeNumber(value,zero=0){const n=Number(value);return Number.isFinite(n)?n:zero;}
function mf311Place(rank){return rank===1?'Champion':rank===2?'Runner-up':rank===3?'Third place':'Rank '+rank;}
function mf311Medal(rank){
 const outline=rank===1?'<path d="M12 3 14.8 8.5 21 9.4 16.5 14 17.6 20.5 12 17.5 6.4 20.5 7.5 14 3 9.4 9.2 8.5z"/>':
  '<circle cx="12" cy="14" r="6.5"/><path d="m7.3 2 4.7 5.5L16.7 2M16.7 2l2.5 6.7M7.3 2 4.8 8.7"/>';
 return `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${outline}</svg>`;
}
function mf311Cover(t){const covers=Array.isArray(t.covers)?t.covers.filter(c=>typeof c==='string'&&/^https:\/\//i.test(c)):[];const src=covers[Math.floor(Date.now()/300000)%Math.max(1,covers.length)];return src?`<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${mfEsc(src)}" alt="">`:`<span class="mf311-art-missing">${mfIcon('book')}<span>No cover</span></span>`;}
function mf311Score(t){return mf311SafeNumber(t.average_rating).toFixed(2);}
function mf311Votes(t){const n=mf311SafeNumber(t.ratings_count);return `${n.toLocaleString()} ${n===1?'rating':'ratings'}`;}
function mf311QuickAdd(t,primary=false){return `<button type="button" class="mf302-btn ${primary?'primary':''} mf311-add" data-mf311-action="quick-add" data-provider="${mfEsc(t.provider)}" data-id="${mfEsc(t.provider_id)}">${mfIcon('add')}<span>Quick Add</span></button>`;}
function mf311PodiumCard(t){const rank=mf311SafeNumber(t.rank);return `<article class="mf311-podium-card mf311-position-${rank}" aria-label="${mfEsc(mf311Place(rank))}: ${mfEsc(t.title)}">
 <div class="mf311-podium-top"><span class="mf311-podium-medal">${mf311Medal(rank)}<b>#${rank}</b></span><span class="mf311-podium-place">${mf311Place(rank)}</span></div>
 <div class="mf311-podium-art">${mf311Cover(t)}<div class="mf311-cover-gradient"></div><span class="mf311-podium-score">${mfIcon('ratings')} ${mf311Score(t)} <small>/ 10</small></span></div>
 <div class="mf311-podium-info"><h2 title="${mfEsc(t.title)}">${mfEsc(t.title)}</h2><p>${mf311Votes(t)} <span aria-hidden="true">·</span> ${mf311SafeNumber(t.users_count).toLocaleString()} libraries</p><div class="mf311-podium-bottom"><span class="mf311-provider">${mfEsc(String(t.provider).toUpperCase())}</span>${mf311QuickAdd(t,true)}</div></div>
 </article>`;}
function mf311Row(t){const rank=mf311SafeNumber(t.rank);return `<article class="mf311-row mf311-row-rank-${Math.min(rank,4)}" aria-label="Rank ${rank}: ${mfEsc(t.title)}">
 <div class="mf311-number" aria-label="Rank ${rank}"><span>#</span>${rank}</div>
 <div class="mf311-thumb">${mf311Cover(t)}</div>
 <div class="mf311-row-info"><h3 title="${mfEsc(t.title)}">${mfEsc(t.title)}</h3><p><span class="mf311-provider">${mfEsc(String(t.provider).toUpperCase())}</span><span>${mf311SafeNumber(t.users_count).toLocaleString()} libraries</span><span>${mf311Votes(t)}</span></p></div>
 <div class="mf311-row-rating"><strong>${mf311Score(t)}</strong><small>/ 10 <span class="mf311-score-star">★</span></small></div>
 ${mf311QuickAdd(t)}</article>`;}
function mf311RenderRows(){const rows=MF311.rows,atTop=MF311.offset===0&&!MF311.query.trim();const top=atTop&&MF311.sort==='rating'&&MF311.desc?rows.filter(t=>mf311SafeNumber(t.rank)<=3):[];const rest=rows.filter(t=>!top.includes(t));const total=MF311.total,matching=MF311.matching;
 const meta=MF311.query.trim()
  ?`${matching.toLocaleString()} matching rated ${matching===1?'title':'titles'} · ranks reflect the full Community leaderboard`
  :`${total.toLocaleString()} rated ${total===1?'title':'titles'} · ordered by average rating, then rating count`;
 return `<div class="mf311-results-summary"><div><h2>${atTop?'Community rankings':'Leaderboard results'}</h2><p>${meta}</p></div><span class="mf311-count">${rows.length?`Showing ${MF311.offset+1}–${MF311.offset+rows.length}`:'No results'}</span></div>
 ${top.length?`<section class="mf311-podium" aria-label="Top three community rated titles">${[2,1,3].map(pos=>top.find(t=>Number(t.rank)===pos)).filter(Boolean).map(mf311PodiumCard).join('')}</section>`:''}
 <div class="mf311-board"><div class="mf311-board-header"><span>RANK</span><span>TITLE</span><span>SCORE</span><span>ACTION</span></div>${rest.map(mf311Row).join('')||(!top.length?`<div class="mf311-empty">${MF311.query?'No rated titles match this search.':'No rated titles yet. When members publish Library ratings, the leaderboard will appear here.'}</div>`:'')}</div>
 <div class="mf311-pagination"><button type="button" class="mf302-btn" data-mf311-action="page" data-step="-1" ${MF311.offset<=0?'disabled':''}>${mfIcon('back')} Previous</button><span>Page ${Math.floor(MF311.offset/MF311.pageSize)+1}</span><button type="button" class="mf302-btn" data-mf311-action="page" data-step="1" ${rows.length<MF311.pageSize?'disabled':''}>Next ${mfIcon('next')}</button></div>`;
}
function mf311Bind(root){if(root.dataset.mf311Bound==='1')return;root.dataset.mf311Bound='1';
 root.addEventListener('click',event=>{const el=event.target.closest('[data-mf311-action]');if(!el||!root.contains(el))return;const action=el.dataset.mf311Action;
  if(action==='quick-add')mf309OpenQuickAdd(el.dataset.provider,el.dataset.id);
  if(action==='page'){const next=Math.max(0,MF311.offset+MF311.pageSize*Number(el.dataset.step));if(next===MF311.offset)return;MF311.offset=next;MF302.catalogOffset=next;mf311Load();}
  if(action==='direction'){MF311.desc=!MF311.desc;MF311.offset=0;mf311Load();}
  if(action==='retry')mf311Load();
 });
 root.addEventListener('change',event=>{const el=event.target;const k=el.dataset.mf312Ratings;if(!k)return;MF311[k]=['minVotes','minLibraries','minRating'].includes(k)?Number(el.value):el.value;MF311.offset=0;mf311Load();});
 root.addEventListener('input',event=>{if(event.target.id!=='mf311-search')return;MF311.query=event.target.value;MF302.query=MF311.query;MF311.offset=0;MF302.catalogOffset=0;const pos=event.target.selectionStart;clearTimeout(MF311.timer);MF311.timer=setTimeout(()=>mf311Load({focus:pos}),290);});
}
async function mf311Load({focus=null}={}){if(MF302.page!=='ratings')return;
 if(MF311.query!==MF302.query){MF311.query=String(MF302.query||'');MF311.offset=Number(MF302.catalogOffset)||0;}
 const root=document.getElementById('mf302-content');if(!root)return;
 const request=++MF311.request;root.innerHTML=`<section class="mf311-leaderboard">${mfHeading('Community ratings','Discover the highest-rated verified titles across publicly shared MediaFlow Libraries.')}
 <div class="mf311-intro"><div class="mf311-intro-copy"><span class="mf311-kicker">${mfIcon('ratings')} THE LEADERBOARD</span><strong>Ranked by the community.</strong><p>Higher average scores rank first. Rating count and Library count break ties.</p></div><div class="mf311-intro-icon" aria-hidden="true">${mf311Medal(1)}</div></div>
 <div class="mf312-ratings-controls"><label class="mf311-search-wrap"><span>${mfIcon('browse')}</span><input type="search" id="mf311-search" aria-label="Search ranked titles" placeholder="Search the leaderboard…" autocomplete="off" value="${mfEsc(MF311.query)}"></label><label>Sort by<select data-mf312-ratings="sort">${mf310Options([['rating','Average rating'],['votes','Rating count'],['libraries','Library count'],['title','Title']],MF311.sort)}</select></label><label class="mf312-direction-label">Order<button type="button" class="mf312-sort-toggle" data-mf311-action="direction" aria-label="Toggle sort direction" title="${MF311.desc?'Descending':'Ascending'}">${mf312SortIcon(MF311.desc)}</button></label><label>Provider<select data-mf312-ratings="provider">${mf310Options([['','All sources'],['mal','MAL'],['simkl','SIMKL'],['anilist','AniList'],['tmdb','TMDB'],['imdb','IMDb'],['trakt','Trakt'],['kitsu','Kitsu'],['isbn','ISBN / Books']],MF311.provider)}</select></label><label>Min ratings<select data-mf312-ratings="minVotes">${mf310Options([[1,'1+'],[2,'2+'],[5,'5+'],[10,'10+'],[25,'25+']],MF311.minVotes)}</select></label><label>Min. libraries<select data-mf312-ratings="minLibraries">${mf310Options([[0,'Any'],[2,'2+'],[5,'5+'],[10,'10+']],MF311.minLibraries)}</select></label><label>Min. score<select data-mf312-ratings="minRating">${mf310Options([[0,'Any'],[5,'5+'],[7,'7+'],[8,'8+'],[9,'9+']],MF311.minRating)}</select></label></div>
 <div class="mf312-ratings-freshness" aria-live="polite"><span class="mf312-pulse"></span>Auto-updates when public ratings change · <span id="mf312-ratings-updated">Checking latest scores</span><button type="button" class="mf302-btn" data-mf311-action="retry">Refresh now</button></div>
 <div id="mf311-results" aria-live="polite" aria-busy="true"><div class="mf311-loading" role="status">Loading Community rankings…</div></div></section>`;
 const host=root.querySelector('.mf311-leaderboard');mf311Bind(host);
 if(focus!==null){const search=host.querySelector('#mf311-search');search.focus();try{search.setSelectionRange(focus,focus);}catch(_){}}
 try{if(!supabase)throw new Error('Community connection unavailable.');
  const {data,error}=await supabase.rpc('mf_ratings_leaderboard_v312',{p_search:MF311.query,p_sort:MF311.sort,p_desc:MF311.desc,p_provider:MF311.provider,p_min_votes:MF311.minVotes,p_min_libraries:MF311.minLibraries,p_min_rating:MF311.minRating,p_limit:MF311.pageSize,p_offset:MF311.offset});if(error)throw error;
  if(request!==MF311.request||MF302.page!=='ratings')return;
  MF311.rows=Array.isArray(data)?data:[];MF311.lastReload=Date.now();const updated=host.querySelector('#mf312-ratings-updated');if(updated)updated.textContent='Updated '+new Date().toLocaleTimeString();
  const first=MF311.rows[0];
  MF311.total=first?mf311SafeNumber(first.total_ranked):0;
  MF311.matching=first?mf311SafeNumber(first.match_count):0;
  // The v309 Quick Add dialog looks up selected rows in this cache.
  if(!MF302.mf309RatingCache)MF302.mf309RatingCache=new Map();
  for(const t of MF311.rows)MF302.mf309RatingCache.set(String(t.provider)+'|'+String(t.provider_id),t);
  if(MF302.mf309RatingCache.size>500){for(const key of [...MF302.mf309RatingCache.keys()].slice(0,MF302.mf309RatingCache.size-400))MF302.mf309RatingCache.delete(key);}
  const result=host.querySelector('#mf311-results');if(result){result.setAttribute('aria-busy','false');result.innerHTML=mf311RenderRows();}
 }catch(err){if(request!==MF311.request||MF302.page!=='ratings')return;const result=host.querySelector('#mf311-results');if(result){result.setAttribute('aria-busy','false');result.innerHTML=`<div class="mf311-error" role="alert"><strong>Could not load Community ratings</strong><p>${mfEsc(err?.message||'The leaderboard is temporarily unavailable.')}</p><button type="button" class="mf302-btn" data-mf311-action="retry">Retry</button></div>`;}}
}
const mf311PriorPublicRender=mfRenderPublic;
mfRenderPublic=async function(){if(MF302.page==='ratings')return mf311Load();return mf311PriorPublicRender();};
window.MF311={version:311,reload:mf311Load,state:MF311};
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{}, {version:311,rankedCommunityRatings:true,globalRanks:true});
