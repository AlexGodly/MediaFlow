/* MediaFlow v317 — progression controls, first-start rewards, Statistics hierarchy,
   and non-destructive Community refreshes. Runs in the existing application scope. */
DEFAULT_SETTINGS.leveling.unitXP.episodes=20;
DEFAULT_SETTINGS.leveling.titleStartXP=50;
const MF317={version:317,primed:false,owner:'',known:new Map(),refreshing:'',refreshed:{browse:0,collections:0,users:0},lastSignatures:{}};

// A prior v316 account has 10 as the original episode factory default. Upgrade
// that specific factory value once, leaving other customized values untouched.
function mf317UpgradeEpisodeDefault(){
 const leveling=S?.settings?.leveling;if(!leveling||leveling.v317EpisodeUpgradeDone)return;
 const units=leveling.unitXP||(leveling.unitXP={});
 if(Number(units.episodes)===10)units.episodes=20;
 leveling.v317EpisodeUpgradeDone=true;
 try{persistSettings();}catch(e){console.warn('[v317] Episode setting upgrade',e);}
}

function mf317PrimeLibrary(force=false){
 const owner=AUTH_USER?.id||'offline';
 if(!force&&MF317.primed&&MF317.owner===owner)return;
 MF317.owner=owner;MF317.primed=true;
 MF317.known=new Map((S.library||[]).filter(x=>x?.id).map(x=>[String(x.id),{status:String(x.status||''),progress:Number(x.progress)||0}]));
}
function mf317StartLedger(){
 S.xpLedger=S.xpLedger||{};
 if(!S.xpLedger.titleStarts||typeof S.xpLedger.titleStarts!=='object'||Array.isArray(S.xpLedger.titleStarts))S.xpLedger.titleStarts={};
 return S.xpLedger.titleStarts;
}
function mf317StartRewardAmount(){const cfg=levelingSettings();const n=Number(cfg.titleStartXP);return cfg.enabled===false?0:Math.max(0,Math.min(100000,Math.round(Number.isFinite(n)?n:50)));}
// Award only when a title actually enters active/completed from planned, when a
// new active title is added, or when zero progress advances for the first time.
// Existing active titles on first load never receive retroactive start rewards.
function mf317CaptureStarts(){
 mf317PrimeLibrary();const ledger=mf317StartLedger();let changed=false;
 const next=new Map();
 for(const title of S.library||[]){if(!title?.id)continue;
  const id=String(title.id),now={status:String(title.status||''),progress:Math.max(0,Number(title.progress)||0)},prev=MF317.known.get(id);
  const started=prev?((prev.status==='planned'&&['active','completed'].includes(now.status))||(prev.progress<=0&&now.progress>0)):(now.status==='active'&&now.progress===0||now.progress>0);
  if(started&&!Object.prototype.hasOwnProperty.call(ledger,id)&&levelingSettings().enabled!==false){ledger[id]=mf317StartRewardAmount();changed=true;}
  next.set(id,now);
 }
 MF317.known=next;
 return changed;
}

// Include start rewards in canonical current/snapshot calculations, History XP
// deltas, export/import, full Calculate XP, and all public Level/XP publishing.
const mf317BaseStateMetrics=v150ComputeStateMetrics;
v150ComputeStateMetrics=function(state,mutate){
 const metrics=mf317BaseStateMetrics.apply(this,arguments);
 const starts=state?.xpLedger?.titleStarts||{};
 const startXP=Object.values(starts).reduce((total,number)=>{const n=Number(number);return total+(Number.isFinite(n)?Math.max(0,n):0);},0);
 metrics.titleStartXP=Math.round(startXP);
 metrics.fixedLibraryXP+=metrics.titleStartXP;
 metrics.totalXP+=metrics.titleStartXP;
 return metrics;
};
const mf317BaseXPBreakdown=v120XPBreakdown;
v120XPBreakdown=function(){const x=mf317BaseXPBreakdown.apply(this,arguments);const timeXP=AUTH_USER?(Number(MF316.xp)||0):0;
 return {...x,titleStartXP:v150EnsureLiveXPCache().titleStartXP||0,timeXP,total:(Number(x.total)||0)+timeXP};};
const mf317BaseMergeStates=mergeStates;
mergeStates=function(a,b){const merged=mf317BaseMergeStates.apply(this,arguments);if(!merged)return merged;
 const older=b?.xpLedger?.titleStarts||{},newer=a?.xpLedger?.titleStarts||{};
 merged.xpLedger=merged.xpLedger||{};
 // Preserve one-time rewards on both devices; identical title keys are not added twice.
 merged.xpLedger.titleStarts={...older,...newer};
 return merged;};
const mf317BasePersistLibrary=persistLibrary;
persistLibrary=function(...args){
 const earned=mf317CaptureStarts();if(earned)v149MarkStreakDirty();
 const result=mf317BasePersistLibrary.apply(this,args);
 if(AUTH_USER){Promise.resolve(result).then(()=>{if(earned)mf312SyncOwnProfile(true);}).catch(()=>{});}
 return result;
};
const mf317BaseStartApp=startAuthenticatedApp;
startAuthenticatedApp=async function(...args){const ret=await mf317BaseStartApp.apply(this,args);
 mf317PrimeLibrary(true);mf317UpgradeEpisodeDefault();v149MarkStreakDirty();
 if(AUTH_USER){mf316LoadLedger().then(()=>mf312SyncOwnProfile(true)).catch(()=>{});}
 return ret;};
// Prime only AFTER persisted state has loaded. Priming during the initial
// empty shell render would mistake tens of thousands of loaded titles for new starts.
const mf317BaseLoadAll=loadAll;
loadAll=async function(...args){const r=await mf317BaseLoadAll.apply(this,args);mf317PrimeLibrary(true);return r;};
const mf317BaseApplyState=v46ApplyState;
v46ApplyState=function(...args){const r=mf317BaseApplyState.apply(this,args);mf317PrimeLibrary(true);return r;};

// v221 captured the old Settings renderer BEFORE v316 wrapped renderSettings.
// Attach the existing v316 panel to the actual registered Settings page, inside
// its LEVELING & XP card, not after the complete Settings document.
function mf317SettingsPage(...args){
 const host=document.createElement('div');host.innerHTML=v221RenderSettingsPage.apply(this,args);
 const reference=document.createElement('div');reference.innerHTML=renderSettings();
 const timeCard=reference.querySelector('.mf316-xp-settings');
 const target=host.querySelector('input[onchange*="libraryAdditionXP"]');
 const group=target?.closest('.card');
 if(group&&timeCard){
  const titleField=document.createElement('div');titleField.className='field';
  titleField.innerHTML=`<label class="field-label">Start a title XP</label><input type="number" min="0" max="100000" step="1" value="${mfEsc(String(levelingSettings().titleStartXP??50))}" onchange="App.updateLeveling('titleStartXP',this.value)"><small class="hint">One-time bonus when a title is first started, not each time you resume it.</small>`;
  target.closest('.field-row')?.appendChild(titleField);
  // Insert after Unit XP but before Rotation XP, in the real Progression section.
  const marker=[...group.querySelectorAll('div')].find(x=>x.childElementCount===0&&x.textContent?.trim()==='ROTATION XP MULTIPLIERS');
  if(marker)marker.before(timeCard);else group.appendChild(timeCard);
 }
 return host.innerHTML;
}
MediaFlowRuntime.registerPageRenderer('settings',mf317SettingsPage);

// Ensure the Statistics hero is first, followed by time spent and then
// lifetime achievements; honor each independent visibility preference.
const mf317PreviousStats=renderStats;
renderStats=function(...args){const host=document.createElement('div');host.innerHTML=mf317PreviousStats.apply(this,args);
 const hero=host.querySelector('.profile-stat-hero');
 const time=host.querySelector('.mf316-time-stat');
 const achievements=[...host.querySelectorAll('.section-label')].find(el=>el.textContent.trim().toUpperCase()==='LIFETIME ACHIEVEMENTS')?.closest('.card');
 const heading=host.querySelector('.view-head');
 if(hero){if(heading&&heading.nextSibling!==hero)heading.after(hero);}
 if(time){(hero||heading)?.after(time);}
 if(achievements){(time||hero||heading)?.after(achievements);}
 // The Leveling panel used to list only Consumption and Library. Expose both
 // new sources explicitly and keep the displayed component subtotals additive.
 const level=host.querySelector('.stats-level-card .record-list');
 if(level){const b=v120XPBreakdown();const rows=[...level.querySelectorAll('.record-row')];
  const libraryRow=rows.find(x=>x.querySelector('.k')?.textContent?.trim()==='Library XP');
  if(libraryRow){const value=libraryRow.querySelector('.v');if(value)value.textContent=Math.max(0,libraryXPTotal()-(b.titleStartXP||0)).toLocaleString();}
  if(b.titleStartXP)level.insertAdjacentHTML('beforeend',`<div class="record-row"><span class="k">Started title XP</span><span class="v">${Number(b.titleStartXP).toLocaleString()}</span></div>`);
  if(AUTH_USER)level.insertAdjacentHTML('beforeend',`<div class="record-row"><span class="k">Active-time XP</span><span class="v">${Number(b.timeXP||0).toLocaleString()}</span></div>`);
 }
 return host.innerHTML;
};

function mf317RefreshButton(section){return `<button type="button" class="mf302-btn mf317-refresh" data-mf317-refresh="${section}" title="Fetch the latest Community updates" aria-label="Refresh ${section} now"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.4 6"/><path d="M20 4v7h-7"/></svg> <span>Refresh now</span></button>`;}
function mf317AddRefresh(section){const root=document.querySelector('#mf302-content');if(!root)return;
 const heading=root.querySelector('.mf302-heading');if(!heading||heading.querySelector('[data-mf317-refresh]'))return;
 const bar=document.createElement('div');bar.className='mf317-refresh-bar';bar.innerHTML=mf317RefreshButton(section);
 heading.appendChild(bar);
}
const mf317OldPublicRender=mfRenderPublic;
mfRenderPublic=async function(...args){const section=MF302.page;
 const result=await mf317OldPublicRender.apply(this,args);
 if(['browse','collections','users'].includes(section)&&MF302.page===section)mf317AddRefresh(section);
 return result;
};
// The v309 / v310 / v312 renderers also run directly when filters change.
const mf317OldBrowse=mf309RenderBrowse;
mf309RenderBrowse=async function(...args){const result=await mf317OldBrowse.apply(this,args);if(MF302.page==='browse')mf317AddRefresh('browse');return result;};
const mf317OldDirectory=mf310RenderDirectory;
mf310RenderDirectory=async function(...args){const result=await mf317OldDirectory.apply(this,args);if(MF302.page==='collections')mf317AddRefresh('collections');return result;};
const mf317OldUsers=mf312RenderUsers;
mf312RenderUsers=async function(...args){const result=await mf317OldUsers.apply(this,args);if(MF302.page==='users')mf317AddRefresh('users');return result;};

function mf317RefreshSignature(section){const p=section==='browse'?mf309Prefs():section==='collections'?MF310.directory:MF312.users;
 if(section==='users')return JSON.stringify([p.tab,p.sort,p.desc,p.verified,p.minLevel,p.minTitles,p.query,p.offset]);
 if(section==='browse')return JSON.stringify([MF302.query,MF302.catalogOffset,p.sort,p.desc,p.provider,p.status,p.minUsers,p.minRating]);
 return JSON.stringify([p.search,p.sort,p.desc,p.minItems,p.withCover,p.offset]);
}
async function mf317RefreshNow(section,manual=true){
 if(!['browse','collections','users'].includes(section)||!supabase||MF302.page!==section)return;
 if(MF317.refreshing)return;
 if(!manual){if(document.visibilityState==='hidden'||!document.querySelector('#mf302-content')||document.activeElement?.matches('input,textarea,select,[contenteditable]'))return;
  if(Date.now()-(MF317.refreshed[section]||0)<120000)return;}
 const sig=mf317RefreshSignature(section),requestId=MF302.renderId;
 MF317.refreshing=section;
 const btn=document.querySelector(`[data-mf317-refresh="${section}"]`);if(btn){btn.disabled=true;btn.classList.add('loading');}
 try{
  if(section==='browse'){
   const p=mf309Prefs();const {data,error}=await mf328Catalog({p_search:MF302.query,p_sort:p.sort,p_desc:p.desc,p_provider:p.provider,p_status:p.status,p_min_users:p.minUsers,p_min_rating:p.minRating,p_limit:60,p_offset:Number(MF302.catalogOffset)||0});
   if(error)throw error;
   if(MF302.page===section&&MF302.renderId===requestId&&sig===mf317RefreshSignature(section)){
    MF302.browseRows=data||[];const el=document.querySelector('#mf309-body');if(el)el.innerHTML=mf309Results();
    MF313.titleCountAt=0;mf313LoadTitleCount();}
  }else if(section==='collections'){
   const p=MF310.directory;const {data,error}=await mf328Collections({p_search:p.search,p_sort:p.sort,p_desc:p.desc,p_min_items:p.minItems,p_with_cover:p.withCover,p_limit:40,p_offset:p.offset});
   if(error)throw error;
   if(AUTH_USER)await mf310LoadSaved(true);
   if(MF302.page===section&&MF302.renderId===requestId&&sig===mf317RefreshSignature(section)){
    MF310.directoryRows=data||[];mf310DisplayDirectory();}
  }else{
   await mf312FetchUsers(++MF312.users.request);
   const loadError=document.querySelector('#mf312-users-results [role="alert"]');
   if(loadError)throw new Error(loadError.textContent?.replace(/Retry\s*$/,'').trim()||'Could not refresh Community users');
   MF316.refreshAt=Date.now();MF316.refreshRevision='';
  }
  MF317.refreshed[section]=Date.now();
  if(manual&&MF302.page===section)mfNotice('Community '+(section==='users'?'users':section==='browse'?'titles':'Collections')+' refreshed.');
 }catch(e){if(manual)mfNotice('Could not refresh Community data: '+(e?.message||e));console.warn('[v317] Community refresh:',e);}
 finally{MF317.refreshing='';const current=document.querySelector(`[data-mf317-refresh="${section}"]`);if(current){current.disabled=false;current.classList.remove('loading');}}
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-mf317-refresh]');if(!button||e.button!==0)return;
 e.preventDefault();e.stopPropagation();mf317RefreshNow(button.dataset.mf317Refresh,true);},true);
setInterval(()=>{if(['browse','collections','users'].includes(MF302.page))mf317RefreshNow(MF302.page,false);},120000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&['browse','collections','users'].includes(MF302.page))mf317RefreshNow(MF302.page,false);});
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{},{version:317,manualRefresh:true,automaticBrowseRefresh:true,startingTitleXP:true});
Object.assign(App,{mf317RefreshNow});
