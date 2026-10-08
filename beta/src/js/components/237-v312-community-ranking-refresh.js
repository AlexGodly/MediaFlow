/* MediaFlow v312 — Community Rankings / verified default XP config / opt-in usage.
 * Users rankings never expose hidden XP, private Libraries or private time.
 * "MediaFlow Verified" means the current published XP rules match factory
 * defaults, NOT independently audited gameplay or anti-cheat certification. */
const MF312={users:{tab:'discover',view:'cards',sort:'name',desc:false,verified:'all',minLevel:0,minTitles:0,query:'',offset:0,rows:[],count:0,request:0},
 ratingRevision:'',ratingProbeTime:0,ratingBusy:false,usageUser:'',profileSyncUser:'',profileSyncLast:0,profileTimer:0,librarySnapshot:null,libraryOwner:'',libraryTimer:0,libraryBusy:false};
function mf312SortIcon(desc){return `<svg class="mf312-order-svg" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" aria-hidden="true">${desc?'<path d="M12 3v18m-6-6 6 6 6-6"/>':'<path d="M12 21V3M6 9l6-6 6 6"/>'}</svg><span class="mf312-dir-text">${desc?'DESC':'ASC'}</span>`;}
function mf312DefaultsMatch(){const defaults=DEFAULT_SETTINGS.leveling||{},value=S?.settings?.leveling||{};
 const match=(a,b)=>a&&b&&typeof a==='object'&&typeof b==='object'?Object.keys(a).every(k=>match(a[k],b[k]??a[k])):a===b;
 return !!match(defaults,value);}
function mf312Badge(u){if(!u||u.show_xp===false)return '';const val=u.xp_default_verified;
 if(val===true)return `<span class="mf312-verified" title="XP and leveling configuration matches MediaFlow factory defaults; not an anti-cheat certification">${mfIcon('ratings')} MediaFlow Verified</span>`;
 if(val===false)return `<span class="mf312-unverified" title="Custom XP/leveling settings — results may not be comparable">MediaFlow Unverified</span>`;
 return `<span class="mf312-unknown" title="XP/leveling configuration not yet checked by this account">Settings not checked</span>`;}
function mf312UsageLabel(sec){let n=Math.max(0,Number(sec)||0);const h=Math.floor(n/3600),m=Math.floor(n%3600/60);return h?`${h.toLocaleString()}h ${m}m`:`${m}m`;}
function mf312Picture(u){const url=typeof u.avatar_url==='string'&&/^https:\/\//i.test(u.avatar_url)&&u.avatar_url.length<2048?u.avatar_url:'';return url?`<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${mfEsc(url)}" alt="">`:`<span>${mfIcon('profile')}</span>`;}
function mf312UserMetric(u,field){switch(field){case 'xp':return u.show_xp&&u.xp_total!=null?Number(u.xp_total).toLocaleString()+' XP':'XP private';case 'level':return u.show_xp&&u.xp_level!=null?`Level ${Number(u.xp_level).toLocaleString()} · ${Number(u.xp_total||0).toLocaleString()} XP`:'Level private';case 'library':return u.library_titles!=null?`${Number(u.library_titles).toLocaleString()} public titles`:'Library private';case 'usage':return u.show_usage_time&&u.usage_seconds!=null?`${mf312UsageLabel(u.usage_seconds)} active`:'Time private';default:return u.show_xp&&u.xp_level!=null?`Level ${u.xp_level}`:'MediaFlow member';}}
function mf312UserCard(u,view){const p=MF312.users,link=mfPath(encodeURIComponent(u.username)),label=mfEsc(u.display_name||u.username),rank=p.tab==='ranking'?`<span class="mf312-user-rank">#${Number(u.rank)}</span>`:'';
 return `<article class="mf312-user-card mf312-user-${view}">${rank}<a class="mf312-avatar" href="${mfEsc(link)}" data-mf306-route="${mfEsc(u.username)}" aria-label="View ${label}'s profile">${mf312Picture(u)}</a><div class="mf312-user-info"><a class="mf312-user-name" href="${mfEsc(link)}" data-mf306-route="${mfEsc(u.username)}">${label}</a><span class="mf312-handle">@${mfEsc(u.username)}</span>${view!=='avatars'?`<p class="mf312-bio">${mfEsc(u.bio||'MediaFlow community member')}</p>`:''}<div class="mf312-user-metrics">${p.tab==='ranking'?`<strong>${mf312UserMetric(u,p.sort)}</strong>`:mf312UserMetric(u,'level')} ${mf312Badge(u)}</div></div><a class="mf302-btn mf312-open-profile" href="${mfEsc(link)}" data-mf306-route="${mfEsc(u.username)}">${mfIcon('arrow')} Profile</a></article>`;}
function mf312UserControls(){const p=MF312.users,ranking=p.tab==='ranking';return `<section class="mf312-users-shell">
 <div class="mf312-user-tabs" role="tablist" aria-label="People pages"><button type="button" role="tab" aria-selected="${!ranking}" class="mf302-btn ${!ranking?'primary':''}" data-mf312-action="tab" data-tab="discover">${mfIcon('users')} Find users</button><button type="button" role="tab" aria-selected="${ranking}" class="mf302-btn ${ranking?'primary':''}" data-mf312-action="tab" data-tab="ranking">${mfIcon('ratings')} User rankings</button></div>
 <div class="mf312-user-tools"><label>Search people<input type="search" id="mf312-user-search" placeholder="Username or display name…" value="${mfEsc(p.query)}" autocomplete="off"></label><label>Sort by<select data-mf312-user-filter="sort">${mf310Options(ranking?[["level","Level (XP tie-breaker)"],["xp","Total XP"],["library","Published Library titles"],["usage","Active app time"]]:[["name","Name"],["level","Level"],["xp","Total XP"],["library","Published Library titles"],["usage","Active app time"]],p.sort)}</select></label><label class="mf312-direction-label">Order<button type="button" class="mf312-sort-toggle" data-mf312-action="direction" title="${p.desc?'Descending':'Ascending'}" aria-label="Toggle sort direction">${mf312SortIcon(p.desc)}</button></label><label>XP settings<select data-mf312-user-filter="verified">${mf310Options([['all','All configurations'],['verified','MediaFlow Verified'],['unverified','Custom / Unverified']],p.verified)}</select></label><label>Minimum level<select data-mf312-user-filter="minLevel">${mf310Options([[0,'Any'],[10,'10+'],[25,'25+'],[50,'50+'],[100,'100+']],p.minLevel)}</select></label><label>Public titles<select data-mf312-user-filter="minTitles">${mf310Options([[0,'Any'],[10,'10+'],[100,'100+'],[1000,'1,000+']],p.minTitles)}</select></label></div>
 <div class="mf312-users-layout"><div class="mf312-view-switch" role="group" aria-label="People display modes">${[['cards','Cards'],['list','List'],['compact','Compact'],['avatars','Avatars']].map(([v,label])=>`<button type="button" class="mf302-btn ${p.view===v?'primary':''}" data-mf312-action="view" data-value="${v}" aria-pressed="${p.view===v}">${label}</button>`).join('')}</div><p>${ranking?'Rankings use visible published statistics only. Level ties prioritize XP. Active time is opt-in and starts in v312.':'Discover public members and visit their profiles.'}</p></div><div id="mf312-users-results" role="status" aria-live="polite">Loading members…</div></section>`;}
function mf312UserResults(){const p=MF312.users,rows=p.rows;return `<div class="mf312-result-heading"><strong>${p.count.toLocaleString()} ${p.tab==='ranking'?'ranked members':'public members'}</strong><span>Page ${Math.floor(p.offset/40)+1}</span></div><div class="mf312-users-grid mf312-grid-${p.view}">${rows.map(u=>mf312UserCard(u,p.view)).join('')||'<div class="mf302-empty">No public users match these options.</div>'}</div><div class="mf310-pagination"><button class="mf302-btn" data-mf312-action="page" data-step="-1" ${p.offset===0?'disabled':''}>${mfIcon('back')} Previous</button><span>Page ${Math.floor(p.offset/40)+1}</span><button class="mf302-btn" data-mf312-action="page" data-step="1" ${rows.length<40?'disabled':''}>Next ${mfIcon('next')}</button></div>`;}
async function mf312RenderUsers(){if(MF302.page!=='users')return;const root=document.getElementById('mf302-content');if(!root)return;const p=MF312.users,request=++p.request;root.innerHTML=mfHeading('People & rankings','Discover MediaFlow members and compare publicly shared progress.')+mf312UserControls();await mf312FetchUsers(request);}
async function mf312FetchUsers(request){const p=MF312.users;let out=document.getElementById('mf312-users-results');if(out)out.innerHTML='<div class="mf302-empty">Loading Community users…</div>';
 try{if(!supabase)throw Error('Community connection unavailable.');const {data,error}=await supabase.rpc('mf_users_directory_v312',{
 p_search:p.query,p_tab:p.tab,p_sort:p.sort,p_desc:p.desc,p_verified:p.verified,p_min_level:p.minLevel,p_min_titles:p.minTitles,p_limit:40,p_offset:p.offset});if(error)throw error;
 if(request!==p.request||MF302.page!=='users')return;p.rows=data||[];p.count=p.rows[0]?Number(p.rows[0].total_matches)||0:0;out=document.getElementById('mf312-users-results');if(out)out.outerHTML=`<div id="mf312-users-results" aria-live="polite">${mf312UserResults()}</div>`;
 }catch(e){if(request!==p.request)return;out=document.getElementById('mf312-users-results');if(out)out.innerHTML=`<div class="mf302-empty" role="alert">Could not load users: ${mfEsc(e.message)} <button class="mf302-btn" data-mf312-action="retry">Retry</button></div>`;}}
const mf312PrevRender=mfRenderPublic;
mfRenderPublic=async function(){if(MF302.page==='users')return mf312RenderUsers();return mf312PrevRender();};
let mf312UserSearchTimer=0;
document.addEventListener('click',e=>{const btn=e.target.closest('[data-mf312-action]');if(!btn||e.button!==0)return;
 e.preventDefault();e.stopPropagation();const p=MF312.users,a=btn.dataset.mf312Action;
 if(a==='tab'){p.tab=btn.dataset.tab;p.sort=p.tab==='ranking'?'level':'name';p.desc=p.tab==='ranking';p.offset=0;mf312RenderUsers();}
 if(a==='view'){p.view=btn.dataset.value;const box=document.getElementById('mf312-users-results');if(box)box.innerHTML=mf312UserResults();document.querySelectorAll('.mf312-view-switch [data-mf312-action="view"]').forEach(b=>{const active=b.dataset.value===p.view;b.classList.toggle('primary',active);b.setAttribute('aria-pressed',String(active));});}
 if(a==='direction'){p.desc=!p.desc;p.offset=0;mf312RenderUsers();}
 if(a==='page'){p.offset=Math.max(0,p.offset+Number(btn.dataset.step)*40);mf312RenderUsers();}
 if(a==='retry')mf312RenderUsers();
 if(a==='share')mf312SharePublic(btn.dataset.owner,btn.dataset.id,btn.dataset.username);
 if(a==='share-owned')mf312ShareOwned(btn.dataset.id);
},true);
document.addEventListener('change',e=>{const field=e.target.dataset.mf312UserFilter;if(!field)return;const p=MF312.users;p[field]=['minLevel','minTitles'].includes(field)?Number(e.target.value):e.target.value;p.offset=0;mf312RenderUsers();},true);
document.addEventListener('input',e=>{if(e.target.id!=='mf312-user-search')return;const p=MF312.users;p.query=e.target.value;p.offset=0;const pos=e.target.selectionStart;clearTimeout(mf312UserSearchTimer);mf312UserSearchTimer=setTimeout(()=>{mf312RenderUsers().then(()=>{const i=document.getElementById('mf312-user-search');if(i){i.focus();try{i.setSelectionRange(pos,pos)}catch(_){}}});},260);},true);
// Profile metrics are opt-in. XP-default badge describes settings parity, not anti-cheat.
let mf312SyncBusy=false;
async function mf312SyncOwnProfile(force=false){if(mf312SyncBusy||!AUTH_USER||!supabase||!S?.settings)return;
 const uid=AUTH_USER.id;if(!force&&MF312.profileSyncUser===uid&&Date.now()-MF312.profileSyncLast<90000&&MF312.lastVerified===mf312DefaultsMatch())return;
 mf312SyncBusy=true;try{const {data,error}=await supabase.from('mf_public_profiles').select('is_public,show_xp,xp_total,xp_level,xp_default_verified,show_usage_time').eq('user_id',uid).limit(1);if(error)throw error;
 const row=data?.[0];if(!row?.is_public||AUTH_USER?.id!==uid)return;
 const info=mediaFlowLevelInfo(),valid=mf312DefaultsMatch(),xp=Number(info.xp)||0,level=Number(info.level)||1;
 if(Number(row.xp_total)!==xp||Number(row.xp_level)!==level||row.xp_default_verified!==valid){const {error:er}=await supabase.from('mf_public_profiles').update({xp_total:xp,xp_level:level,xp_default_verified:valid,updated_at:new Date().toISOString()}).eq('user_id',uid);if(er)throw er;}
 MF312.profileSyncUser=uid;MF312.profileSyncLast=Date.now();MF312.lastVerified=valid;
 }catch(e){console.warn('[v312] Public XP settings sync:',e?.message||e)}finally{mf312SyncBusy=false;}}
// Server-side app time credit: only visible, active signed-in sessions, starting v312.
let mf312UsageBusy=false,mf312UsageConsent=false,mf312ConsentLast=0;
async function mf312UsageTick(active=true){if(mf312UsageBusy||!AUTH_USER||!supabase||!S||!document)return;const uid=AUTH_USER.id;
 if(active&&document.visibilityState==='hidden')return;
 mf312UsageBusy=true;try{
 if(Date.now()-mf312ConsentLast>120000||MF312.usageUser!==uid){const {data,error}=await supabase.from('mf_public_profiles').select('is_public,show_usage_time').eq('user_id',uid).limit(1);if(error)throw error;mf312UsageConsent=!!data?.[0]?.is_public&&!!data?.[0]?.show_usage_time;mf312ConsentLast=Date.now();MF312.usageUser=uid;}
 if(!mf312UsageConsent)return;
 const {error}=await supabase.rpc('mf_heartbeat_usage_v312',{p_active:active});if(error)throw error;
 }catch(e){console.warn('[v312] Usage update:',e?.message||e)}finally{mf312UsageBusy=false;}}
setInterval(()=>{if(AUTH_USER&&document.visibilityState==='visible'){mf312UsageTick(true);mf312SyncOwnProfile();}},120000);
document.addEventListener('visibilitychange',()=>{if(!AUTH_USER)return;mf312UsageTick(document.visibilityState==='visible');});
// Fast indexed catalog revision probe (45s) avoids expensive re-ranking on each tick.
async function mf312CheckRatingsFreshness(){if(MF312.ratingBusy||MF302.page!=='ratings'||document.visibilityState==='hidden'||!document.querySelector('.mf311-leaderboard')||!supabase)return;
 MF312.ratingBusy=true;try{const {data,error}=await supabase.rpc('mf_catalog_revision_v312');if(error)throw error;
 const revision=String(data||'');if(!MF312.ratingRevision){MF312.ratingRevision=revision;return;}
 if(revision&&revision!==MF312.ratingRevision){MF312.ratingRevision=revision;MF311.offset=0;await mf311Load();}
 else if(Date.now()-MF311.lastReload>600000)await mf311Load();
 }catch(e){console.warn('[v312] Ratings freshness:',e?.message||e)}finally{MF312.ratingBusy=false;}}
setInterval(()=>{mf312CheckRatingsFreshness();},45000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')mf312CheckRatingsFreshness();});
// Link sharing: public URL is open to guests as long as owner keeps Collection
// and profile public. No login required for viewers.
async function mf312Copy(text){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch(_){}
 try{const node=document.createElement('textarea');node.value=text;node.style.position='fixed';node.style.left='-9999px';document.body.appendChild(node);node.select();const ok=document.execCommand('copy');node.remove();return ok;}catch(_){return false;}}
function mf312PublicURL(username,id){const base=!/^https?:$/.test(location.protocol)||location.origin==='null'?'https://alexgodly.github.io/MediaFlow/':location.origin+mfRoot;return base+encodeURIComponent(username)+'/Collections/'+encodeURIComponent(id);}
async function mf312SharePublic(owner,id,username){if(!username){const {data,error}=await supabase.from('mf_public_profiles').select('username,is_public').eq('user_id',owner).eq('is_public',true).limit(1);if(error||!data?.[0]){mfNotice('Creator profile is unavailable.');return;}username=data[0].username;}
 const url=mf312PublicURL(username,id);if(await mf312Copy(url))mfNotice('Public Collection link copied!');else prompt('Copy the public Collection link:',url);}
async function mf312ShareOwned(id){if(!AUTH_USER||!supabase)return;const col=(S.collections||[]).find(c=>String(c.id)===String(id));if(!col)return;
 const {data,error}=await supabase.from('mf_public_profiles').select('username,is_public').eq('user_id',AUTH_USER.id).limit(1);if(error||!data?.[0]?.is_public){mfNotice('Enable your public profile before sharing a Collection.');return;}
 const username=data[0].username;const {data:pub,error:e2}=await supabase.from('mf_public_collections').select('id,is_public').eq('user_id',AUTH_USER.id).eq('id',id).limit(1);if(e2)throw e2;
 if(!pub?.[0]?.is_public){if(!confirm(`Make "${col.title}" public? Everyone with its link can view the published titles, even without an account.`))return;
  const items=(col.titleIds||[]).map(tid=>S.library.find(t=>String(t.id)===String(tid))).filter(Boolean).map(t=>({title:t.title,coverUrl:t.coverUrl||'',status:t.status||'',rating:t.rating??null}));
  const {error:publishErr}=await supabase.from('mf_public_collections').upsert({user_id:AUTH_USER.id,id:String(id),title:String(col.title||''),description:String(col.description||''),cover_url:String(col.coverUrl||''),items,is_public:true,updated_at:new Date().toISOString()},{onConflict:'user_id,id'});if(publishErr){mfNotice('Could not publish Collection: '+publishErr.message);return;}
 }
 await mf312SharePublic(AUTH_USER.id,id,username);
}
// Add Share Link to public Collection cards and detail hero without copying data.
const mf312BaseCollectionCard=mf310Card;
mf310Card=function(c,mode,workspace){let h=mf312BaseCollectionCard(c,mode,workspace);if(!c?.username)return h;
 const b=`<button type="button" class="mf302-btn mf312-share-btn" data-mf312-action="share" data-owner="${mfEsc(c.user_id)}" data-id="${mfEsc(c.id)}" data-username="${mfEsc(c.username)}" title="Copy public link">${mfIcon('arrow')} Share link</button>`;
 return h.replace(/<\/article>\s*$/,b+'</article>');};
const mf312BaseDetailHtml=mf310DetailHtml;
mf310DetailHtml=function(c,workspace){let h=mf312BaseDetailHtml(c,workspace);if(!c?.username)return h;
 const button=`<button type="button" class="mf302-btn" data-mf312-action="share" data-owner="${mfEsc(c.user_id)}" data-id="${mfEsc(c.id)}" data-username="${mfEsc(c.username)}">${mfIcon('arrow')} Share link</button>`;
 return h.replace('<button class="mf302-btn" type="button" data-mf310-action="refresh-detail">',button+'<button class="mf302-btn" type="button" data-mf310-action="refresh-detail">');};
// Expose owner share action in Workspace's existing Collection sharing editor.
const mf312OldCollectionEditor=mfCollectionsEditor;
mfCollectionsEditor=async function(){await mf312OldCollectionEditor();const host=document.querySelector('#view-root .mf302-workspace');if(!host)return;
 host.querySelectorAll('.mf302-tile').forEach((tile,i)=>{const c=(S.collections||[])[i];if(!c)return;const button=document.createElement('button');button.className='mf302-btn';button.type='button';button.dataset.mf312Action='share-owned';button.dataset.id=String(c.id);button.textContent='Share public link';tile.appendChild(button);});};
// Workspace owned Collection details: give creators a direct share action.
const mf312OwnDetailBase=v274CollectionDetailHtml;
v274CollectionDetailHtml=function(c){const html=mf312OwnDetailBase(c);if(!c)return html;const control=`<button class="btn btn-sm" type="button" data-mf312-action="share-owned" data-id="${mfEsc(c.id)}">${mfIcon('arrow')} Share link</button>`;
 return html.replace('<div class="mf274-hero-actions">','<div class="mf274-hero-actions">'+control);};
// Keep changes to already-published Library rows fresh, without auto-publishing
// new/private entries or fetching the entire public catalog on each save.
function mf312LibrarySignature(t){return JSON.stringify([t.title||'',t.status||'',t.rating??null,t.coverUrl||'',t.total??null]);}
function mf312WatchLibrary(){if(!AUTH_USER||!Array.isArray(S?.library)||!supabase||mf312LibraryBusy)return;
 const uid=AUTH_USER.id;const current=new Map(S.library.map(t=>[String(t.id),mf312LibrarySignature(t)]));
 if(MF312.libraryOwner!==uid||!MF312.librarySnapshot){MF312.libraryOwner=uid;MF312.librarySnapshot=current;MF312.pendingLibrary=new Set();return;}
 const altered=[];for(const [id,signature] of current){if(MF312.librarySnapshot.get(id)!==undefined&&MF312.librarySnapshot.get(id)!==signature)altered.push(id);}
 MF312.librarySnapshot=current;if(!altered.length)return;
 const q=MF312.pendingLibrary||(MF312.pendingLibrary=new Set());for(const id of altered)q.add(id);
 clearTimeout(MF312.libraryTimer);MF312.libraryTimer=setTimeout(mf312FlushPublishedLibrary,4500);
}
let mf312LibraryBusy=false;
async function mf312FlushPublishedLibrary(){if(mf312LibraryBusy||!AUTH_USER||!supabase||!MF312.pendingLibrary?.size)return;
 mf312LibraryBusy=true;const user=AUTH_USER.id;try{
  const {data:profiles,error:profileError}=await supabase.from('mf_public_profiles').select('is_public,show_library').eq('user_id',user).limit(1);if(profileError)throw profileError;
  if(!profiles?.[0]?.is_public||!profiles[0].show_library)return;
  while(MF312.pendingLibrary?.size&&AUTH_USER?.id===user){const ids=[...MF312.pendingLibrary].slice(0,35);
   const {data:published,error}=await supabase.from('mf_public_library').select('entry_id,rating,title,status,cover_url,total').eq('user_id',user).in('entry_id',ids);if(error)throw error;
   const locals=new Map(S.library.map(t=>[String(t.id),t]));
   for(const pub of published||[]){if(AUTH_USER?.id!==user)break;const t=locals.get(String(pub.entry_id));if(!t)continue;
    const score=t.rating==null||t.rating===''?null:Number(t.rating);const next={rating:Number.isFinite(score)&&score>=0&&score<=10?score:null,title:String(t.title||''),status:String(t.status||''),cover_url:String(t.coverUrl||''),total:Number(t.total)||null};
    if(Number(pub.rating??-1)===Number(next.rating??-1)&&pub.title===next.title&&pub.status===next.status&&pub.cover_url===next.cover_url&&Number(pub.total||0)===Number(next.total||0))continue;
    const {error:er}=await supabase.from('mf_public_library').update({...next,updated_at:new Date().toISOString()}).eq('user_id',user).eq('entry_id',String(pub.entry_id));if(er)throw er;
   }
   for(const id of ids)MF312.pendingLibrary.delete(id);
  }
 }catch(e){console.warn('[v312] Public title refresh:',e?.message||e);if(AUTH_USER?.id===user){clearTimeout(MF312.libraryTimer);MF312.libraryTimer=setTimeout(mf312FlushPublishedLibrary,30000);}}finally{mf312LibraryBusy=false;}}
// After state has hydrated, compare lightweight per-title signatures only after
// save activity; no continuous 50k-title polling or bulk public upload.
const mf312SaveBase=saveState;
saveState=function(...args){const result=mf312SaveBase.apply(this,args);Promise.resolve(result).then(()=>{clearTimeout(MF312.libraryTimer);MF312.libraryTimer=setTimeout(mf312WatchLibrary,2600);clearTimeout(MF312.profileTimer);MF312.profileTimer=setTimeout(()=>mf312SyncOwnProfile(),8000);}).catch(()=>{});return result;};
// Initialize the comparison baseline AFTER authenticated cloud hydration.
const mf312PreviousStartApp=startAuthenticatedApp;
startAuthenticatedApp=async function(...args){const result=await mf312PreviousStartApp.apply(this,args);if(AUTH_USER&&Array.isArray(S?.library)){mf312WatchLibrary();mf312SyncOwnProfile(true);mf312UsageTick(true);}return result;};
setTimeout(()=>{mf312WatchLibrary();mf312SyncOwnProfile(true);mf312UsageTick(true);},6500);
// Show server-owned opt-in presence total when opening a public profile.
async function mf312LoadProfileUsage(u){if(!u?.show_usage_time||!supabase)return;
 try{const {data,error}=await supabase.rpc('mf_users_directory_v312',{p_search:u.username,p_tab:'discover',p_sort:'name',p_desc:false,p_verified:'all',p_min_level:0,p_min_titles:0,p_limit:40,p_offset:0});if(error)throw error;
 const same=(data||[]).find(x=>String(x.user_id)===String(u.user_id));if(!same||MF302.profile?.user_id!==u.user_id)return;
 const el=document.querySelector('#mf302-content .mf312-profile-usage');if(el)el.textContent=mf312UsageLabel(same.usage_seconds)+' active in MediaFlow (since v312)';
 }catch(e){console.warn('[v312] Public usage metric:',e?.message||e);}}
window.MF302.publish=mfPublish;
window.MF302.publishCollection=mfPublishCollection;
window.MF312={version:312,users:MF312.users,renderUsers:mf312RenderUsers,refreshRatings:mf312CheckRatingsFreshness,share:mf312SharePublic,defaultXP:mf312DefaultsMatch};
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{},{version:312,usersRankings:true,ratingsAutoRefresh:true,communitySortIcons:true,publicCollectionShareLinks:true});
