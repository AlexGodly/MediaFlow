/* MediaFlow v318 — Ratings-parity freshness bars and Statistics Leveling order.
 * Reuses v317's manual/automatic refresh RPC logic and the exact shared Ratings
 * freshness styles. No new server data source or extra polling loop. */
const MF318={version:318,sections:{
 browse:{text:'Auto-updates every 2 minutes',host:'#mf309-browser',before:'#mf309-body',error:'#mf309-body [role="alert"]'},
 collections:{text:'Auto-updates every 2 minutes',host:'#mf310-directory',before:'#mf310-directory-results',error:'#mf310-directory-results [role="alert"]'},
 users:{text:'Auto-updates every 2 minutes',host:'.mf312-users-shell',before:'#mf312-users-results',error:'#mf312-users-results [role="alert"]'}
}};
function mf318RefreshClock(time){return 'Updated '+new Date(time).toLocaleTimeString();}
function mf318Status(section,message){const status=document.querySelector(`[data-mf318-updated="${section}"]`);
 if(status)status.textContent=message;
}
function mf318InstallRefresh(section){
 const config=MF318.sections[section];if(!config||MF302.page!==section)return;
 const root=document.getElementById('mf302-content');if(!root)return;
 // The v317 button lived inside the heading. Remove that displaced version even
 // after user-driven filter rerenders; there must only be one refresh button.
 root.querySelectorAll('.mf317-refresh-bar').forEach(node=>node.remove());
 const host=root.querySelector(config.host),anchor=host?.querySelector(config.before);
 if(!host||!anchor)return;
 const existing=host.querySelector(`.mf318-freshness[data-mf318-section="${section}"]`);
 if(existing){if(existing.nextElementSibling!==anchor)anchor.before(existing);return;}
 const bar=document.createElement('div');bar.className='mf312-ratings-freshness mf318-freshness';
 bar.dataset.mf318Section=section;bar.setAttribute('aria-label','Community auto-refresh status');
 bar.innerHTML=`<span class="mf312-pulse" aria-hidden="true"></span><span class="mf318-freshness-copy">${config.text} · <span data-mf318-updated="${section}" role="status" aria-live="polite">Checking latest updates</span></span>${mf317RefreshButton(section)}`;
 anchor.before(bar);
 // A successful initial Browse, Collections, or People renderer has completed
 // before v317 calls mf317AddRefresh. Never claim an update if it showed an error.
 const failed=!!root.querySelector(config.error);
 const known=MF317.refreshed[section];
 mf318Status(section,failed?'Could not load updates':mf318RefreshClock(known||Date.now()));
}
// The original v317 render hooks call this mutable function; replacing its
// placement preserves the existing calls for navigation, search and sorting.
mf317AddRefresh=mf318InstallRefresh;
const mf318PreviousRefresh=mf317RefreshNow;
mf317RefreshNow=async function(section,manual=true){
 const before=MF317.refreshed[section]||0;
 const bar=document.querySelector(`.mf318-freshness[data-mf318-section="${section}"]`);
 if(bar&&MF302.page===section&&MF317.refreshing===''){
  bar.classList.add('mf318-refreshing');mf318Status(section,'Checking latest updates…');
 }
 try{await mf318PreviousRefresh.apply(this,arguments);}
 finally{
  const current=document.querySelector(`.mf318-freshness[data-mf318-section="${section}"]`);
  if(current){current.classList.remove('mf318-refreshing');
   const success=(MF317.refreshed[section]||0)>before;
   mf318Status(section,success?mf318RefreshClock(MF317.refreshed[section]):(before?mf318RefreshClock(before):'Could not refresh updates'));
  }
 }
};
// v317 moved Time Spent before achievements. v318 places Leveling immediately
// before Time Spent, keeping hidden components hidden and all XP math intact.
const mf318PreviousRenderStats=renderStats;
renderStats=function(...args){
 const host=document.createElement('div');host.innerHTML=mf318PreviousRenderStats.apply(this,args);
 const level=host.querySelector('.stats-level-card');if(!level)return host.innerHTML;
 const hero=host.querySelector('.profile-stat-hero');
 const time=host.querySelector('.mf316-time-stat');
 const achievements=[...host.querySelectorAll('.section-label')].find(el=>el.textContent.trim().toUpperCase()==='LIFETIME ACHIEVEMENTS')?.closest('.card');
 const heading=host.querySelector('.view-head');
 if(time)time.before(level);
 else if(achievements)achievements.before(level);
 else if(hero)hero.after(level);
 else if(heading)heading.after(level);
 return host.innerHTML;
};
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{},{version:318,ratingsParityRefresh:true,levelingAboveTimeSpent:true});
