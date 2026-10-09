/* MediaFlow v328 — Community runs against existing authoritative cloud state.
 * No copied Library, History, Statistics, Ratings, or Collection media records.
 * Collection share IDs and saved-Collection relationships are social metadata.
 */
const MF328={version:328,endpoint:SUPABASE_URL+'/functions/v1/mediaflow-community-live',lastLoaded:0};
async function mf328Get(action,params={}){
 const url=MF328.endpoint+'?'+new URLSearchParams({action,...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v??'')]))});
 const response=await fetch(url,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Accept:'application/json'},cache:'no-store'});
 let data;try{data=await response.json();}catch(_){throw Error('Live Community API returned an invalid response.');}
 if(!response.ok)throw Error(data?.error||'Live Community is currently unavailable.');
 MF328.lastLoaded=Date.now();return data;
}
const mf328Wrap=async(p)=>{try{return {data:(await p).items||[],error:null};}catch(e){return {data:null,error:{message:e.message}};}};
const mf328Catalog=opts=>mf328Wrap(mf328Get('browse',{search:opts.p_search,sort:opts.p_sort,desc:opts.p_desc,provider:opts.p_provider,status:opts.p_status,minUsers:opts.p_min_users,minRating:opts.p_min_rating,limit:opts.p_limit,offset:opts.p_offset}));
const mf328Ratings=opts=>mf328Wrap(mf328Get('ratings',{search:opts.p_search,sort:opts.p_sort,desc:opts.p_desc,provider:opts.p_provider,minVotes:opts.p_min_votes,minLibraries:opts.p_min_libraries,minRating:opts.p_min_rating,limit:opts.p_limit,offset:opts.p_offset}));
const mf328Collections=opts=>mf328Wrap(mf328Get('collections',{search:opts.p_search,sort:opts.p_sort,desc:opts.p_desc,minItems:opts.p_min_items,withCover:opts.p_with_cover,limit:opts.p_limit,offset:opts.p_offset}));
const mf328Users=opts=>mf328Wrap(mf328Get('users',{search:opts.p_search,tab:opts.p_tab,sort:opts.p_sort,desc:opts.p_desc,verified:opts.p_verified,minLevel:opts.p_min_level,minTitles:opts.p_min_titles,limit:opts.p_limit,offset:opts.p_offset}));
// Explicit Collection publication now stores ONLY a share permission, not title media.
async function mf328SetShared(id,isPublic){
 if(!AUTH_USER||!supabase)throw Error('Sign in to manage Collection sharing.');
 const c=(S.collections||[]).find(x=>String(x.id)===String(id));if(!c)throw Error('Collection no longer exists.');
 if(isPublic){const {error}=await supabase.from('mf_collection_shares_v328').upsert({user_id:AUTH_USER.id,collection_id:String(id)},{onConflict:'user_id,collection_id'});if(error)throw error;}
 else{const {error}=await supabase.from('mf_collection_shares_v328').delete().eq('user_id',AUTH_USER.id).eq('collection_id',String(id));if(error)throw error;}
}
mfPublishCollection=async function(id,isPublic){try{const c=(S.collections||[]).find(x=>String(x.id)===String(id));if(!c)return;
 if(isPublic&&!confirm('Share “'+c.title+'” publicly? Anyone with the link can view its current contents.'))return;
 await mf328SetShared(id,isPublic);mfNotice(isPublic?'Collection shared directly from Workspace.':'Collection is now private.');mfCollectionsEditor();
 }catch(e){mfNotice('Collection sharing failed: '+e.message);}};
MF302.publishCollection=mfPublishCollection;
mfCollectionsEditor=async function(){const el=document.getElementById('view-root');if(!el||!AUTH_USER)return;
 const {data,error}=await supabase.from('mf_collection_shares_v328').select('collection_id').eq('user_id',AUTH_USER.id);if(error){mfNotice(error.message);return;}
 const shared=new Set((data||[]).map(r=>String(r.collection_id)));
 el.innerHTML=`<div class="mf302-workspace"><h1>Collection Sharing</h1><p>Share access to existing Collections without duplicating their media records. Changes become visible after Cloud Sync.</p><button class="mf302-btn" onclick="MF302.workspaceView('mf302-profile')">${mfIcon('back')} Public Profile</button><div class="mf302-grid">${(S.collections||[]).map(c=>`<article class="mf302-tile"><h3>${mfEsc(c.title)}</h3><p>${(c.titleIds||[]).length} titles</p><div>${shared.has(String(c.id))?'Public':'Private'}</div><button class="mf302-btn" onclick="MF302.publishCollection('${mfEsc(String(c.id))}',${!shared.has(String(c.id))})">${shared.has(String(c.id))?'Make Private':'Make Public'}</button></article>`).join('')||mfEmpty('No Collections yet.')}</div></div>`;
};
// Community directory and Collection detail always reflect original owner records.
mf310FetchCollection=async function(owner,id){const data=await mf328Get('collection',{owner,id});return data.collection||null;};
// Retain normal saved-Collection links (owner ID + Collection ID, not media copies).
mf310LoadSaved=async function(force=false){if(!AUTH_USER||!supabase){MF310.saved=[];MF310.savedUser='';return;}
 const user=AUTH_USER.id;if(!force&&MF310.savedUser===user&&Date.now()-MF310.savedLoaded<30000)return;
 if(MF310.savedLoading)return;MF310.savedLoading=true;
 try{const {data,error}=await supabase.from('mf_saved_collections').select('owner_id,collection_id,saved_at').eq('user_id',user).order('saved_at',{ascending:false}).limit(500);if(error)throw error;
 const refs=data||[];const unique=[...new Set(refs.map(s=>String(s.owner_id)+'|'+String(s.collection_id)))];
 const rows=await Promise.all(unique.map(async key=>{const sep=key.indexOf('|');try{return [key,await mf310FetchCollection(key.slice(0,sep),key.slice(sep+1))];}catch(_){return [key,null];}}));
 if(AUTH_USER?.id!==user)return;const map=new Map(rows);MF310.saved=refs.map(s=>({...s,collection:map.get(String(s.owner_id)+'|'+String(s.collection_id))||null}));MF310.savedUser=user;MF310.savedLoaded=Date.now();
 }finally{MF310.savedLoading=false;}
};
// Existing share button starts sharing the ID, never uploads a second Collection.
mf312ShareOwned=async function(id){try{if(!AUTH_USER)return;const profile=await mfMyProfile();if(!profile?.is_public){mfNotice('Enable your public profile first.');return;}
 const {data,error}=await supabase.from('mf_collection_shares_v328').select('collection_id').eq('user_id',AUTH_USER.id).eq('collection_id',String(id)).maybeSingle();if(error)throw error;
 if(!data){const c=(S.collections||[]).find(x=>String(x.id)===String(id));if(!c)return;if(!confirm('Share “'+c.title+'” publicly from your original Workspace?'))return;await mf328SetShared(id,true);}
 await mf312SharePublic(AUTH_USER.id,id,profile.username);
 }catch(e){mfNotice('Share link failed: '+e.message);}};
// Stop background snapshot writers. No new duplicates after upgrade.
mf310SchedulePublishedSync=function(){};
mf310SyncPublishedOwnerCollections=async function(){};
mf312WatchLibrary=function(){};
mf312FlushPublishedLibrary=async function(){};
mf312SyncOwnProfile=async function(){};
mf312CheckRatingsFreshness=async function(){if(MF302.page==='ratings'&&document.visibilityState!=='hidden'&&Date.now()-MF311.lastReload>600000)await mf311Load();};
mfPublish=async function(which){mfNotice('Public media is now read directly from your synced Workspace. No separate publication is necessary.');return true;};
MF302.publish=mfPublish;
// Remove direct Statistics mirror creation: the original cloud state is authoritative.
mf304PublishStatistics=async function(){mfNotice('Statistics now use live cloud data. No snapshot publication is necessary.');return true;};
MF304.publishStatistics=mf304PublishStatistics;
// Saved Collection deletion cleans only the ID permission, not duplicated media.
const mf328DeleteCollection=App.v274DeleteCollection;
App.v274DeleteCollection=async function(id,...args){const existed=(S.collections||[]).some(c=>String(c.id)===String(id));const res=await mf328DeleteCollection.call(this,id,...args);
 if(existed&&AUTH_USER&&!(S.collections||[]).some(c=>String(c.id)===String(id)))await supabase.from('mf_collection_shares_v328').delete().eq('user_id',AUTH_USER.id).eq('collection_id',String(id));return res;};
// Live profile metrics and featured titles are fetched from current cloud data.
async function mf328DecorateProfile(){if(MF302.page!=='profile'||!MF323.profile?.user_id)return;
 const owner=MF323.profile.user_id,seq=MF323.seq;try{const data=await mf328Get('profile_metrics',{owner});if(MF323.profile?.user_id!==owner||MF323.seq!==seq)return;
 if(data.xp_total!==undefined){MF323.profile.xp_total=data.xp_total;MF323.profile.xp_level=data.xp_level;const box=document.querySelector('.mf323-level');if(box){const x=mf323Level(MF323.profile);box.innerHTML=`<div><b>Level ${x.level}</b><span>${x.xp.toLocaleString()} XP</span></div><div class="mf323-track" role="progressbar" aria-valuenow="${x.pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${x.pct}%"></span></div><small>${x.remaining.toLocaleString()} XP to next level</small>`;}}
 const fav=await mf328Get('favorites',{owner});const host=document.querySelector('.mf323-favorites');if(host&&Array.isArray(fav.items)){host.innerHTML=fav.items.map(t=>`<article>${mf323Img(t.coverUrl)||'<div class="mf323-no-cover">✦</div>'}<strong>${mf323E(t.title)}</strong></article>`).join('');}
 }catch(e){console.warn('[v328] Profile metrics:',e?.message||e);}}
const mf328OriginalPortal=mfRenderPublic;
mfRenderPublic=async function(...args){const result=await mf328OriginalPortal.apply(this,args);if(MF302.page==='profile')mf328DecorateProfile();return result;};
// Existing optional profile XP/cover fields are legacy; stop synchronizing them.
// Profile studio will store only Favorite title IDs (no replicated title metadata).
window.MF328={...MF328,get:mf328Get};
window.MediaFlowCommunity={...(window.MediaFlowCommunity||{}),version:328,liveCommunity:true,duplicateMediaWrites:false};
