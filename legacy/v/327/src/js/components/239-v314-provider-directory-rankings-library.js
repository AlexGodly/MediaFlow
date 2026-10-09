/* MediaFlow v314 — eight importer-ID sources, Library to Browse action, and a
   dedicated Rankings podium. Source IDs are service-specific and never matched
   by title alone; user-selected artwork and metadata stay opt-in. */
const MF314_PROVIDERS=[['mal','MyAnimeList'],['simkl','SIMKL'],['anilist','AniList'],['tmdb','TMDB'],['imdb','IMDb'],['trakt','Trakt'],['kitsu','Kitsu'],['isbn','ISBN / Books']];
function mf314PublicProviderFields(ids){const source=ids&&typeof ids==='object'?ids:{};
 for(const [key] of MF314_PROVIDERS){const value=source[key];if(value!==null&&value!==undefined){const id=String(value).trim();if(id&&id.length<=256)return {provider:key,provider_id:id};}}
 return {provider:'',provider_id:''};
}
// Never publish unknown or title-derived IDs: these cannot be deduplicated reliably.
function mf314LibraryBrowseButton(){const root=document.getElementById('view-root');if(!root||S.view!=='library')return;
 const old=root.querySelector('.mf314-library-community-action');if(old)return;
 const box=document.createElement('div');box.className='mf314-library-community-action';
 box.innerHTML=`<div class="mf314-library-community-copy"><span class="mf314-library-kicker">COMMUNITY DISCOVERY</span><strong>Find your next title</strong><span>Explore media contributed by the Community and add it to your Library.</span></div><button type="button" class="btn btn-sm mf314-explore-btn" data-mf314-browse>${mfIcon('browse')} Explore Community ${mfIcon('arrow')}</button>`;
 const anchor=root.querySelector('.mf262-library-tools')||root.firstElementChild;
 if(anchor?.parentElement)anchor.parentElement.insertBefore(box,anchor);else root.prepend(box);
}
try{MediaFlowRuntime.registerPageEnhancer('library',()=>requestAnimationFrame(mf314LibraryBrowseButton));}catch(error){console.warn('[v314] Library action registration:',error);}
document.addEventListener('click',event=>{const btn=event.target.closest('[data-mf314-browse]');if(!btn||event.button!==0)return;
 event.preventDefault();event.stopPropagation();mfGo('browse');},true);
// Render rankings without relying on HTML substring surgery from v313. All
// elements are properly nested; absolute rank badges never overlap profile links.
function mf314ProfileURL(u){return mfPath(encodeURIComponent(u.username));}
function mf314RankIcon(rank){return mf311Medal(rank);}
function mf314RankPodium(u){const rank=Number(u.rank),award=['','gold','silver','bronze'][rank]||'silver';
 const href=mfEsc(mf314ProfileURL(u)),route=mfEsc(u.username),name=mfEsc(u.display_name||u.username);
 const label=rank===1?'Champion':rank===2?'Runner-up':'Third place';
 return `<article class="mf314-podium-card mf314-medal-${award}" aria-label="${mfEsc(label)} rank ${rank}: ${name}">
  <header class="mf314-podium-top"><span class="mf314-medal-icon">${mf314RankIcon(rank)}<b>#${rank}</b></span><span>${label}</span></header>
  <a class="mf314-podium-portrait" href="${href}" data-mf306-route="${route}" aria-label="Open ${name}'s profile">${mf312Picture(u)}</a>
  <div class="mf314-podium-info"><a class="mf314-podium-name" href="${href}" data-mf306-route="${route}">${name}</a><span class="mf314-podium-handle">@${route}</span>
   <strong class="mf314-podium-score">${mfEsc(mf312UserMetric(u,MF312.users.sort))}</strong><div class="mf314-podium-badge">${mf312Badge(u)}</div>
   <a class="mf314-profile-link" href="${href}" data-mf306-route="${route}">View profile <span aria-hidden="true">↗</span></a></div></article>`;
}
function mf314RankRow(u){const href=mfEsc(mf314ProfileURL(u)),route=mfEsc(u.username),name=mfEsc(u.display_name||u.username),rank=Number(u.rank);
 return `<article class="mf314-rank-row" aria-label="Rank ${rank}: ${name}">
  <strong class="mf314-row-number"><small>#</small>${rank}</strong>
  <a href="${href}" data-mf306-route="${route}" class="mf314-row-portrait" aria-label="Open ${name}'s profile">${mf312Picture(u)}</a>
  <div class="mf314-row-person"><a href="${href}" data-mf306-route="${route}">${name}</a><span>@${route}</span></div>
  <div class="mf314-row-score"><strong>${mfEsc(mf312UserMetric(u,MF312.users.sort))}</strong>${mf312Badge(u)}</div>
  <a class="mf314-row-open" href="${href}" data-mf306-route="${route}" aria-label="View ${name}'s profile">${mfIcon('arrow')} <span>Profile</span></a>
 </article>`;
}
const mf314UserResultsFallback=mf312UserResults;
mf312UserResults=function(){const p=MF312.users;if(p.tab!=='ranking')return mf314UserResultsFallback();
 const rows=p.rows||[],top=p.desc&&p.offset===0&&!p.query.trim()?rows.filter(u=>Number(u.rank)>=1&&Number(u.rank)<=3):[];
 const remaining=rows.filter(u=>!top.some(t=>String(t.user_id)===String(u.user_id)));
 const podium=top.length?`<section class="mf314-user-podium" aria-label="Top ranked Community members">${[2,1,3].map(rank=>top.find(u=>Number(u.rank)===rank)).filter(Boolean).map(mf314RankPodium).join('')}</section>`:'';
 const rowsHtml=remaining.map(mf314RankRow).join('')||(!top.length?'<div class="mf302-empty">No public users match these ranking options.</div>':'');
 return `<div class="mf314-rank-heading"><div><span class="mf314-kicker">COMMUNITY LEADERBOARD</span><h2>${mfEsc(String(p.sort==='level'?'Top levels':p.sort==='xp'?'Top XP':p.sort==='library'?'Largest published libraries':'Most active members'))}</h2><p>Rankings reflect members’ publicly shared statistics.</p></div><span class="mf314-total">${Number(p.count||0).toLocaleString()} ranked members</span></div>
 ${podium}<div class="mf314-rank-board" aria-label="Community user ranking results"><div class="mf314-board-header"><span>RANK</span><span>MEMBER</span><span>STATISTICS</span><span>PROFILE</span></div>${rowsHtml}</div>
 <div class="mf310-pagination"><button class="mf302-btn" data-mf312-action="page" data-step="-1" ${p.offset===0?'disabled':''}>${mfIcon('back')} Previous</button><span>Page ${Math.floor(p.offset/40)+1}</span><button class="mf302-btn" data-mf312-action="page" data-step="1" ${rows.length<40?'disabled':''}>Next ${mfIcon('next')}</button></div>`;
};
window.MF314={version:314,providers:MF314_PROVIDERS.map(([key])=>key),libraryAction:mf314LibraryBrowseButton,resolveProvider:mf314PublicProviderFields};
