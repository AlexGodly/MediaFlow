/* MediaFlow v310 — Community Collections and live saved-Collection references.
 * Never copy another owner's titles into S.collections/private Library.
 * Public owner changes are refreshed only after that owner opted into publication.
 */
const MF310={version:310, directory:{view:'cards',sort:'updated',desc:true,minItems:0,withCover:false,search:'',offset:0},
 detail:{view:'covers-titles',sort:'order',desc:false,status:'',cover:'',search:'',page:0}, directoryRows:[],saved:[],savedUser:'',savedLoaded:0,savedLoading:false,workspaceScope:'all',workspaceActive:null,activePublic:null};
const MF310_VIEWS=['list','compact','cards','covers','covers-titles'];
const mf310Key=(a,b)=>String(a)+'|'+String(b);
const mf310SafeImg=url=>typeof url==='string'&&/^https:\/\//i.test(url)&&url.length<=2048?url:'';
const mf310Items=c=>(Array.isArray(c?.items)?c.items:[]).map(t=>typeof t==='string'?{title:t}:t&&typeof t==='object'?{title:String(t.title||t.name||'Untitled'),coverUrl:mf310SafeImg(t.coverUrl||t.cover_url),status:String(t.status||''),rating:Number.isFinite(Number(t.rating))&&t.rating!==null?Number(t.rating):null}:{title:'Untitled'});
const mf310Cover=c=>mf310SafeImg(c?.cover_url)||mf310Items(c).map(t=>mf310SafeImg(t.coverUrl)).find(Boolean)||'';
const mf310Count=c=>Number.isFinite(Number(c?.item_count))?Number(c.item_count):mf310Items(c).length;
const mf310Owner=c=>String(c?.display_name||c?.username||'MediaFlow member');
const mf310Creator=c=>c?.username?`<a class="mf310-creator" href="${mfEsc(mfPath(c.username))}" data-mf306-route="${mfEsc(c.username)}" title="View creator's profile">${mfIcon('profile')} ${mfEsc(mf310Owner(c))} <span>@${mfEsc(c.username)}</span></a>`:`<span class="mf310-creator">${mfIcon('profile')} Creator unavailable</span>`;
const mf310Thumb=(c,cls='mf310-cover')=>{const cover=mf310Cover(c);return cover?`<span class="${cls}"><img loading="lazy" decoding="async" src="${mfEsc(cover)}" alt="Cover for ${mfEsc(c.title)}" referrerpolicy="no-referrer"></span>`:`<span class="${cls} mf310-empty-art">${mfIcon('collections')}</span>`;};
function mf310Options(rows,value){return rows.map(([k,label])=>`<option value="${mfEsc(k)}" ${String(value)===String(k)?'selected':''}>${mfEsc(label)}</option>`).join('');}
const mf310Label=(s)=>s==='covers-titles'?'Covers+Titles':s.slice(0,1).toUpperCase()+s.slice(1);
function mf310ViewButtons(group,p){return `<div class="mf310-switch" role="group" aria-label="Display mode">${MF310_VIEWS.map(view=>`<button type="button" class="mf302-btn ${p.view===view?'primary active':''}" data-mf310-action="view" data-group="${group}" data-value="${view}" aria-pressed="${p.view===view}">${mf310Label(view)}</button>`).join('')}</div>`;}
function mf310SavedMatch(owner,id){return AUTH_USER?.id===MF310.savedUser&&MF310.saved.some(s=>String(s.owner_id)===String(owner)&&String(s.collection_id)===String(id));}
function mf310Card(c,mode='cards',workspace=false){const own=AUTH_USER?.id===c.user_id,saved=mf310SavedMatch(c.user_id,c.id),count=mf310Count(c);
 const open=`<button class="mf302-btn primary" type="button" data-mf310-action="${workspace?'workspace-open':'open'}" data-owner="${mfEsc(c.user_id)}" data-id="${mfEsc(c.id)}" data-username="${mfEsc(c.username||'')}">${mfIcon('collections')} Open</button>`;
 const save=own?'':`<button class="mf302-btn" type="button" data-mf310-action="${saved?'unsave':'save'}" data-owner="${mfEsc(c.user_id)}" data-id="${mfEsc(c.id)}">${mfIcon(saved?'back':'add')} ${saved?'Remove saved':'Save to My Collections'}</button>`;
 return `<article class="mf310-card mf310-${mode}">${mf310Thumb(c)}<div class="mf310-card-content"><span class="mf310-eyebrow">COMMUNITY COLLECTION</span><h3>${mfEsc(c.title)}</h3>${mode!=='covers'?`<p class="mf310-description">${mfEsc(c.description||'A curated media Collection')}</p>`:''}<div class="mf310-creator-area">${mf310Creator(c)}</div><small>${count.toLocaleString()} title${count===1?'':'s'}${c.updated_at?' · Updated '+mfEsc(new Date(c.updated_at).toLocaleDateString()):''}</small></div><div class="mf310-actions">${open}${save}</div></article>`;}
function mf310DirectoryControls(){const p=MF310.directory;return `<div class="mf310-tools"><label>Search Collections<input type="search" id="mf310-directory-search" placeholder="Collections, descriptions, creators…" value="${mfEsc(p.search)}"></label><label>Sort by<select data-mf310-filter="sort">${mf310Options([['updated','Recently updated'],['title','Title'],['count','Title count'],['creator','Creator']],p.sort)}</select></label><label class="mf312-direction-label">Order<button type="button" class="mf312-sort-toggle" data-mf310-action="direction" data-group="directory" aria-label="Sort ${p.desc?'descending':'ascending'}; toggle direction" title="${p.desc?'Descending':'Ascending'}">${mf312SortIcon(p.desc)}</button></label><label>Minimum titles<select data-mf310-filter="minItems">${mf310Options([[0,'All'],[1,'1+'],[5,'5+'],[10,'10+'],[25,'25+'],[50,'50+']],p.minItems)}</select></label><label>Artwork<select data-mf310-filter="withCover">${mf310Options([['false','All covers'],['true','With artwork']],String(p.withCover))}</select></label></div><div class="mf310-view-row">${mf310ViewButtons('directory',p)}<button type="button" class="mf302-btn" data-mf310-action="reset">Reset filters</button></div>`;}
async function mf310RenderDirectory(root,renderId){MF310.activePublic=null;const p=MF310.directory;
 root.innerHTML=mfHeading('Public Collections','Discover curated Collections, explore their creators and save live Collections to your Workspace.')+`<div id="mf310-directory">${mf310DirectoryControls()}<div id="mf310-directory-results" class="mf310-loading" role="status">Loading public Collections…</div></div>`;
 try{if(!supabase)throw Error('Community connection unavailable.');const {data,error}=await supabase.rpc('mf_public_collections_v310',{
 p_search:p.search,p_sort:p.sort,p_desc:p.desc,p_min_items:p.minItems,p_with_cover:p.withCover,p_limit:40,p_offset:p.offset});if(error)throw error;
 if(MF302.renderId!==renderId||MF302.page!=='collections')return;MF310.directoryRows=data||[];
 if(AUTH_USER)await mf310LoadSaved(false);if(MF302.renderId!==renderId||MF302.page!=='collections')return;
 mf310DisplayDirectory();
 }catch(e){if(renderId!==MF302.renderId)return;const el=document.getElementById('mf310-directory-results');if(el)el.innerHTML=`<div class="mf302-empty" role="alert">Could not load public Collections: ${mfEsc(e.message)} <button type="button" class="mf302-btn" data-mf310-action="retry">Retry</button></div>`;}
}
function mf310DisplayDirectory(){const p=MF310.directory,el=document.getElementById('mf310-directory-results');if(!el)return;el.innerHTML=`<p class="mf310-results-caption">${MF310.directoryRows.length} Collections on page ${Math.floor(p.offset/40)+1}</p><div class="mf310-results mf310-layout-${p.view}">${MF310.directoryRows.map(c=>mf310Card(c,p.view)).join('')||'<div class="mf302-empty">No public Collections match your filters.</div>'}</div><div class="mf310-pagination"><button type="button" class="mf302-btn" data-mf310-action="page" data-offset="-40" ${p.offset===0?'disabled':''}>${mfIcon('back')} Previous</button><span>Page ${Math.floor(p.offset/40)+1}</span><button type="button" class="mf302-btn" data-mf310-action="page" data-offset="40" ${MF310.directoryRows.length<40?'disabled':''}>Next ${mfIcon('next')}</button></div>`;}
async function mf310FetchCollection(owner,id){if(!supabase)return null;const {data,error}=await supabase.from('mf_public_collections').select('*').eq('user_id',owner).eq('id',id).eq('is_public',true).limit(1);if(error)throw error;const c=data?.[0];if(!c)return null;const p=await supabase.from('mf_public_profiles').select('user_id,username,display_name,avatar_url,is_public').eq('user_id',owner).eq('is_public',true).limit(1);if(p.error)throw p.error;if(!p.data?.[0])return null;return {...c,...p.data[0],item_count:mf310Items(c).length};}
function mf310DetailRows(c){const p=MF310.detail,q=p.search.toLowerCase();let a=mf310Items(c).filter(t=>!q||String(t.title).toLowerCase().includes(q));if(p.status)a=a.filter(t=>t.status===p.status);if(p.cover==='yes')a=a.filter(t=>!!t.coverUrl);if(p.cover==='no')a=a.filter(t=>!t.coverUrl);
 if(p.sort!=='order')a=a.slice().sort((x,y)=>{let cmp=p.sort==='rating'?(Number(x.rating)||0)-(Number(y.rating)||0):p.sort==='status'?String(x.status).localeCompare(String(y.status)):x.title.localeCompare(y.title,undefined,{numeric:true,sensitivity:'base'});return (cmp||x.title.localeCompare(y.title))*(p.desc?-1:1);});else if(p.desc)a.reverse();return a;}
function mf310DetailItem(t,i,mode){const thumb=t.coverUrl?`<span class="mf310-title-art"><img loading="lazy" src="${mfEsc(t.coverUrl)}" alt="" referrerpolicy="no-referrer"></span>`:`<span class="mf310-title-art mf310-empty-art">${mfIcon('book')}</span>`;
 return `<article class="mf310-media mf310-item-${mode}">${thumb}<div class="mf310-media-content"><strong>${mfEsc(t.title)}</strong>${mode!=='covers'?`<small>${mfEsc(t.status||'Title')} ${t.rating!==null?' · ★ '+mfEsc(String(t.rating)):''}</small>`:''}</div>${mode==='list'?`<span class="mf310-pos">#${i+1}</span>`:''}</article>`;}
function mf310DetailHtml(c,workspace=false){const p=MF310.detail,items=mf310DetailRows(c),cover=mf310Cover(c),saved=mf310SavedMatch(c.user_id,c.id),own=AUTH_USER?.id===c.user_id;
 const pageSize=50,pages=Math.max(1,Math.ceil(items.length/pageSize));p.page=Math.max(0,Math.min(Number(p.page)||0,pages-1));const start=p.page*pageSize,shown=items.slice(start,start+pageSize);
 return `<div class="mf310-detail ${workspace?'mf310-in-workspace':''}"><section class="mf310-hero" ${cover?`style="--mf310-hero:url('${mfEsc(cover.replace(/'/g,'%27'))}')"`:''}><div class="mf310-hero-overlay"></div><div class="mf310-hero-inner">${mf310Thumb(c,'mf310-hero-cover')}<div class="mf310-hero-copy"><span class="mf310-eyebrow">${workspace?'SAVED COMMUNITY COLLECTION':'PUBLIC COLLECTION'}</span><h1>${mfEsc(c.title)}</h1><p>${mfEsc(c.description||'A media Collection shared with the community.')}</p>${mf310Creator(c)}<div class="mf310-hero-info"><span>${mf310Count(c)} titles</span><span>${c.updated_at?'Updated '+mfEsc(new Date(c.updated_at).toLocaleDateString()):''}</span><span>Read-only · Follows creator updates</span></div><div class="mf310-actions"><button type="button" class="mf302-btn" data-mf310-action="${workspace?'workspace-back':'back'}">${mfIcon('back')} ${workspace?'My Collections':'Public Collections'}</button>${!own?`<button class="mf302-btn primary" type="button" data-mf310-action="${saved?'unsave':'save'}" data-owner="${mfEsc(c.user_id)}" data-id="${mfEsc(c.id)}">${mfIcon(saved?'back':'add')} ${saved?'Remove saved Collection':'Save to My Collections'}</button>`:''}<button class="mf302-btn" type="button" data-mf310-action="refresh-detail">Refresh updates</button></div></div></div></section><div class="mf310-section-heading"><h2>Collection Library</h2><span>${items.length} of ${mf310Count(c)} titles</span></div><div class="mf310-tools mf310-detail-tools"><label>Search titles<input type="search" id="mf310-detail-search" value="${mfEsc(p.search)}" placeholder="Search this Collection…"></label><label>Sort by<select data-mf310-detail="sort">${mf310Options([['order','Collection order'],['title','Title'],['rating','Rating'],['status','Status']],p.sort)}</select></label><label class="mf312-direction-label">Order<button type="button" class="mf312-sort-toggle" data-mf310-action="direction" data-group="detail" aria-label="Sort ${p.desc?'descending':'ascending'}; toggle direction" title="${p.desc?'Descending':'Ascending'}">${mf312SortIcon(p.desc)}</button></label><label>Status<select data-mf310-detail="status">${mf310Options([['','All statuses'],['active','Watching / Reading'],['planned','Planned'],['completed','Completed'],['paused','On Hold'],['dropped','Dropped']],p.status)}</select></label><label>Cover<select data-mf310-detail="cover">${mf310Options([['','All titles'],['yes','Has cover'],['no','Missing cover']],p.cover)}</select></label></div><div class="mf310-view-row">${mf310ViewButtons('detail',p)}<button class="mf302-btn" data-mf310-action="reset-detail" type="button">Reset filters</button></div><div class="mf310-results mf310-layout-${p.view}">${shown.map((t,i)=>mf310DetailItem(t,i+start,p.view)).join('')||'<div class="mf302-empty">No titles match these filters.</div>'}</div><div class="mf310-pagination"><button class="mf302-btn" type="button" data-mf310-action="detail-page" data-delta="-1" ${p.page===0?'disabled':''}>${mfIcon('back')} Previous</button><span>Page ${p.page+1} of ${pages} · ${items.length} matching</span><button class="mf302-btn" type="button" data-mf310-action="detail-page" data-delta="1" ${p.page>=pages-1?'disabled':''}>Next ${mfIcon('next')}</button></div></div>`;}
async function mf310RenderCollection(owner,id){const root=document.getElementById('mf302-content');if(!root)return;const key=mf310Key(owner,id);root.innerHTML=mfHeading('Public Collection','Loading the latest published Collection…')+`<div class="mf302-empty">Loading…</div>`;
 try{const c=await mf310FetchCollection(owner,id);if(MF302.page!=='profile')return;
 if(!c){MF310.activePublic=null;root.innerHTML=mfHeading('Collection unavailable','The creator made this Collection private, removed it, or disabled their public profile.')+mfLink('collections','Public Collections','mf302-btn');return;}
 MF310.activePublic=c;MF310.detail={view:'covers-titles',sort:'order',desc:false,status:'',cover:'',search:''};if(AUTH_USER)await mf310LoadSaved(false);
 if(MF302.page==='profile'&&document.getElementById('mf302-content')===root)root.innerHTML=mf310DetailHtml(c);
 }catch(e){root.innerHTML=mfHeading('Collection unavailable',mfEsc(e.message))+mfLink('collections','Public Collections','mf302-btn');}}
async function mf310NavigateToCollection(owner,id){try{let u=MF310.directoryRows.find(c=>String(c.user_id)===String(owner))?.username;
 if(!u){const {data,error}=await supabase.from('mf_public_profiles').select('username,is_public').eq('user_id',owner).eq('is_public',true).limit(1);if(error)throw error;u=data?.[0]?.username;}
 if(!u){mfNotice('Creator profile unavailable.');return;}mfGo(encodeURIComponent(u)+'/Collections/'+encodeURIComponent(id));}catch(e){mfNotice(e.message);}}
async function mf310LoadSaved(force=false){if(!AUTH_USER||!supabase){MF310.saved=[];MF310.savedUser='';return;}const user=AUTH_USER.id;if(!force&&MF310.savedUser===user&&Date.now()-MF310.savedLoaded<30000)return;
 if(MF310.savedLoading){while(MF310.savedLoading)await new Promise(done=>setTimeout(done,60));if(!force&&MF310.savedUser===user)return;}MF310.savedLoading=true;try{
 const {data,error}=await supabase.from('mf_saved_collections').select('owner_id,collection_id,saved_at').eq('user_id',user).order('saved_at',{ascending:false}).limit(500);if(error)throw error;
 const refs=data||[],owners=[...new Set(refs.map(c=>c.owner_id))],rows=[];
 // The RLS gate on published Collections is authoritative: removed/private Collections
 // are marked unavailable and their previously cached contents are never reused.
 for(let i=0;i<owners.length;i+=25){const ids=owners.slice(i,i+25);const [cs,ps]=await Promise.all([
 supabase.from('mf_public_collections').select('id,user_id,title,description,cover_url,items,is_public,updated_at').in('user_id',ids).eq('is_public',true),
 supabase.from('mf_public_profiles').select('user_id,username,display_name,avatar_url,is_public').in('user_id',ids).eq('is_public',true)]);
 if(cs.error)throw cs.error;if(ps.error)throw ps.error;const profiles=new Map((ps.data||[]).map(p=>[p.user_id,p]));for(const c of cs.data||[])if(profiles.has(c.user_id))rows.push({...c,...profiles.get(c.user_id)});
 }
 const map=new Map(rows.map(c=>[mf310Key(c.user_id,c.id),c]));
 if(AUTH_USER?.id!==user)return;MF310.saved=refs.map(s=>({...s,collection:map.get(mf310Key(s.owner_id,s.collection_id))||null}));MF310.savedUser=user;MF310.savedLoaded=Date.now();
 }finally{MF310.savedLoading=false;}}
async function mf310Save(owner,id){if(!AUTH_USER){mfNotice('Log in to save this Collection.');mfLogin();return;}if(owner===AUTH_USER.id){mfNotice('This Collection already belongs to you.');return;}
 try{const c=await mf310FetchCollection(owner,id);if(!c){mfNotice('This Collection is no longer public.');return;}
 const {error}=await supabase.from('mf_saved_collections').insert({user_id:AUTH_USER.id,owner_id:owner,collection_id:id});if(error&&error.code!=='23505')throw error;
 MF310.savedLoaded=0;await mf310LoadSaved(true);mfNotice('Saved to Workspace Collections. Updates will follow the creator.');mf310RefreshCurrent();
 }catch(e){mfNotice('Could not save Collection: '+e.message);}}
async function mf310Unsave(owner,id){if(!AUTH_USER)return;try{const {error}=await supabase.from('mf_saved_collections').delete().eq('user_id',AUTH_USER.id).eq('owner_id',owner).eq('collection_id',id);if(error)throw error;
 MF310.savedLoaded=0;await mf310LoadSaved(true);if(MF310.workspaceActive?.owner===owner&&MF310.workspaceActive?.id===id)MF310.workspaceActive=null;mfNotice('Saved Collection removed.');mf310RefreshCurrent();
 }catch(e){mfNotice('Could not remove saved Collection: '+e.message);}}
function mf310RefreshCurrent(){if(MF302.page==='collections'&&document.getElementById('mf310-directory-results'))mf310DisplayDirectory();else if(MF310.activePublic&&document.querySelector('#mf302-content .mf310-detail'))document.getElementById('mf302-content').innerHTML=mf310DetailHtml(MF310.activePublic);else if(S?.view==='collections'&&!document.body.classList.contains('mf302-public-active'))render();}
function mf310WorkspaceRows(){let r=MF310.saved.slice().sort((a,b)=>String(b.saved_at).localeCompare(String(a.saved_at)));const q=V274_UI.search.trim().toLowerCase();if(q)r=r.filter(s=>(s.collection?[s.collection.title,s.collection.description,s.collection.username,s.collection.display_name].join(' '):'Unavailable Collection').toLowerCase().includes(q));return r;}
/* v321: Render theme-aware saved Collections states at the source, before any async
   load or later runtime decoration. Never paint legacy .mf302-empty during hydration. */
function mf321SavedCollectionsState(loading=false){
 const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4Z"/></svg>';
 const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
 return `<div class="mf320-collection-empty ${loading?'mf321-collection-loading':''}" ${loading?'role="status" aria-live="polite"':'role="status"'}><div class="mf320-collection-empty-icon">${icon}</div><div class="mf320-collection-empty-copy"><h3>${loading?'Loading saved Community Collections…':'No saved Community Collections yet'}</h3><p>${loading?'Checking your saved Collections for the latest Community updates.':'Explore collections created by other MediaFlow users and save your favorites here.'}</p></div>${loading?'':`<button type="button" class="mf320-btn mf320-primary" data-v225-iconified="1" onclick="MF302.go('collections')">Explore Collections ${arrow}</button>`}</div>`;
}
function mf310WorkspaceSection(){if(MF310.savedUser!==AUTH_USER?.id)return mf321SavedCollectionsState(true);const rows=mf310WorkspaceRows();return `<section class="mf310-saved-section"><div class="mf310-section-heading"><h2>Saved Community Collections</h2><span>${rows.length} saved · Live updates from creators</span></div><div class="mf310-results mf310-layout-cards">${rows.map(s=>s.collection?mf310Card(s.collection,'cards',true):`<article class="mf310-card mf310-unavailable"><div class="mf310-card-content"><h3>Collection unavailable</h3><p>Private, deleted, or creator profile disabled. No content is shown.</p><button class="mf302-btn" data-mf310-action="unsave" data-owner="${mfEsc(s.owner_id)}" data-id="${mfEsc(s.collection_id)}">Remove saved</button></div></article>`).join('')||mf321SavedCollectionsState(false)}</div><button class="mf302-btn" type="button" data-mf310-action="refresh-saved">Refresh saved Collections</button></section>`;}
function mf310ScopeControl(){return `<label class="mf310-scope-label">Show <select id="mf310-workspace-scope" aria-label="Filter Collections by source">${mf310Options([['all','My + Community'],['my','My Collections'],['community','Community Collections']],MF310.workspaceScope)}</select></label>`;}
const mf310BaseWorkspaceBrowser=v274CollectionsBrowserHtml;
const mf310BaseWorkspacePage=v274RenderCollectionsPage;
function mf310RenderWorkspacePage(){if(MF310.workspaceActive){if(MF310.workspaceActive.loading)return `<div class="mf274-page mf310-workspace-loading"><div class="empty-state card" role="status">Checking the creator’s latest published Collection…</div></div>`;const s=MF310.saved.find(s=>s.owner_id===MF310.workspaceActive.owner&&s.collection_id===MF310.workspaceActive.id),c=s?.collection;
 if(c)return `<div class="mf274-page">${mf310DetailHtml(c,true)}</div>`;
 return `<div class="mf274-page"><button class="btn btn-sm" data-mf310-action="workspace-back">← Collections</button><div class="empty-state card">This saved Collection is unavailable. Its creator may have removed it or made it private.</div></div>`;}
 // Trigger read-only subscription refresh on initial entry, without blocking rendering.
 if(AUTH_USER&&(!MF310.savedLoaded||MF310.savedUser!==AUTH_USER.id||Date.now()-MF310.savedLoaded>60000)&&!MF310.savedLoading){
  Promise.resolve().then(()=>mf310LoadSaved(true)).then(()=>{if(S.view==='collections'&&!MF310.workspaceActive)render();}).catch(e=>console.warn('[MediaFlow v310] saved Collections:',e));
 }
 if(MF310.workspaceScope==='community')return `<div class="mf274-page mf274-collections-browser"><div class="view-head mf274-collections-head"><div><div class="view-title">Collections</div><div class="view-desc">Collections you saved from the Community, always showing the creator's published version.</div></div><button class="btn btn-primary" data-mf310-action="go-community">Explore Collections</button></div><div class="mf274-browser-toolbar card">${mf310ScopeControl()}<input type="search" placeholder="Search saved Collections…" value="${mfEsc(V274_UI.search)}" data-mf310-workspace-search><button class="mf302-btn" type="button" data-mf310-action="refresh-saved">Refresh</button></div>${mf310WorkspaceSection()}</div>`;
 const html=mf310BaseWorkspaceBrowser();const merged=html.replace('<div class="mf274-browser-toolbar card">','<div class="mf274-browser-toolbar card">'+mf310ScopeControl());return MF310.workspaceScope==='all'?merged.replace(/\s*<\/div>\s*$/,mf310WorkspaceSection()+'</div>'):merged;
}
MediaFlowRuntime.registerPageRenderer('collections',mf310RenderWorkspacePage);
// Make the explicit public directory renderer independent of the v302 static tiles.
const mf310PreviousPublicRender=mfRenderPublic;
mfRenderPublic=async function(){if(MF302.page==='collections'){const rid=MF302.renderId=(Number(MF302.renderId)||0)+1;return mf310RenderDirectory(document.getElementById('mf302-content'),rid);}return mf310PreviousPublicRender();};
mfCollection=mf310RenderCollection;
window.MF302.openCollection=mf310NavigateToCollection;
function mf310WorkspaceOpen(owner,id){MF310.workspaceActive={owner,id,loading:true};MF310.detail={view:'covers-titles',sort:'order',desc:false,status:'',cover:'',search:''};V274_UI.activeId='';render();
 mf310LoadSaved(true).then(()=>{if(MF310.workspaceActive?.owner===owner&&MF310.workspaceActive?.id===id){MF310.workspaceActive.loading=false;render();}}).catch(e=>{MF310.workspaceActive.loading=false;mfNotice('Could not refresh saved Collection: '+e.message);render();});}
function mf310WorkspaceBack(){MF310.workspaceActive=null;render();}
// Preserve the original Workspace collection selection behavior.
const mf310OriginalOpenCollection=App.v274OpenCollection;
App.v274OpenCollection=function(...args){MF310.workspaceActive=null;return mf310OriginalOpenCollection.apply(this,args);};
const mf310OriginalBack=App.v274BackToCollections;
App.v274BackToCollections=function(...args){MF310.workspaceActive=null;return mf310OriginalBack.apply(this,args);};
function mf310DetailRerender(){if(MF310.workspaceActive){render();return;}if(MF310.activePublic&&document.querySelector('#mf302-content .mf310-detail'))document.getElementById('mf302-content').innerHTML=mf310DetailHtml(MF310.activePublic);}
// Event delegation works for both public portal and private Workspace rerenders.
document.addEventListener('click',e=>{const b=e.target.closest('[data-mf310-action]');if(!b)return;if(e.button!==0||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;
 e.preventDefault();e.stopPropagation();const action=b.dataset.mf310Action,owner=b.dataset.owner,id=b.dataset.id;
 if(action==='direction'){if(b.dataset.group==='directory'){MF310.directory.desc=!MF310.directory.desc;MF310.directory.offset=0;mf310ReloadDirectory();}else{MF310.detail.desc=!MF310.detail.desc;MF310.detail.page=0;mf310DetailRerender();}}
 if(action==='view'){const prefs=b.dataset.group==='directory'?MF310.directory:MF310.detail;prefs.view=b.dataset.value;if(b.dataset.group==='directory')mf310DisplayDirectory();else mf310DetailRerender();}
 if(action==='reset'){Object.assign(MF310.directory,{sort:'updated',desc:true,minItems:0,withCover:false,search:'',offset:0});mf310ReloadDirectory();}
 if(action==='retry')mf310ReloadDirectory();
 if(action==='page'){MF310.directory.offset=Math.max(0,MF310.directory.offset+Number(b.dataset.offset));mf310ReloadDirectory();}
 if(action==='open'){const username=b.dataset.username;if(username)mfGo(encodeURIComponent(username)+'/Collections/'+encodeURIComponent(id));else mf310NavigateToCollection(owner,id);}
 if(action==='save')mf310Save(owner,id);
 if(action==='unsave')mf310Unsave(owner,id);
 if(action==='workspace-open')mf310WorkspaceOpen(owner,id);
 if(action==='workspace-back')mf310WorkspaceBack();
 if(action==='back')mfGo('collections');
 if(action==='go-community')mfGo('collections');
 if(action==='reset-detail'){MF310.detail={...MF310.detail,sort:'order',desc:false,status:'',cover:'',search:'',page:0};mf310DetailRerender();}
 if(action==='detail-page'){MF310.detail.page=Math.max(0,(Number(MF310.detail.page)||0)+Number(b.dataset.delta||0));mf310DetailRerender();}
 if(action==='refresh-detail'){
  if(MF310.workspaceActive){mf310LoadSaved(true).then(()=>render()).catch(e=>mfNotice(e.message));}
  else if(MF310.activePublic)mf310RenderCollection(MF310.activePublic.user_id,MF310.activePublic.id);
 }
 if(action==='refresh-saved'){MF310.savedLoaded=0;mf310LoadSaved(true).then(()=>{if(S.view==='collections')render();}).catch(e=>mfNotice(e.message));}
},true);
let mf310SearchTimer=0;
document.addEventListener('input',e=>{
 if(e.target.id==='mf310-directory-search'){MF310.directory.search=e.target.value;MF310.directory.offset=0;clearTimeout(mf310SearchTimer);const pos=e.target.selectionStart;mf310SearchTimer=setTimeout(()=>{mf310ReloadDirectory().then(()=>{const inp=document.getElementById('mf310-directory-search');if(inp){inp.focus();try{inp.setSelectionRange(pos,pos);}catch(_){}}});},300);}
 if(e.target.id==='mf310-detail-search'){MF310.detail.search=e.target.value;MF310.detail.page=0;const pos=e.target.selectionStart;mf310DetailRerender();const inp=document.getElementById('mf310-detail-search');if(inp){inp.focus();try{inp.setSelectionRange(pos,pos);}catch(_){}}}
 if(e.target.matches('[data-mf310-workspace-search]')){V274_UI.search=e.target.value;render();}
},true);
document.addEventListener('change',e=>{
 const field=e.target.dataset.mf310Filter;if(field){MF310.directory[field]=field==='desc'||field==='withCover'?e.target.value==='true':field==='minItems'?Number(e.target.value):e.target.value;MF310.directory.offset=0;mf310ReloadDirectory();return;}
 const k=e.target.dataset.mf310Detail;if(k){MF310.detail[k]=k==='desc'?e.target.value==='true':e.target.value;MF310.detail.page=0;mf310DetailRerender();return;}
 if(e.target.id==='mf310-workspace-scope'){MF310.workspaceScope=e.target.value;MF310.workspaceActive=null;render();}
},true);
function mf310ReloadDirectory(){const rid=MF302.renderId=(Number(MF302.renderId)||0)+1;return mf310RenderDirectory(document.getElementById('mf302-content'),rid);}
// Automatic *publication* sync: ONLY existing explicitly-public Collection IDs.
// A private/unpublished Collection can NEVER be made public by this sync hook.
let mf310PublishTimer=0,mf310PublishBusy=false;
function mf310SchedulePublishedSync(){if(!AUTH_USER||!supabase||!Array.isArray(S?.collections))return;clearTimeout(mf310PublishTimer);mf310PublishTimer=setTimeout(mf310SyncPublishedOwnerCollections,1800);}
async function mf310SyncPublishedOwnerCollections(){if(mf310PublishBusy||!AUTH_USER||!supabase)return;mf310PublishBusy=true;const user=AUTH_USER.id;
 try{const {data,error}=await supabase.from('mf_public_collections').select('id,is_public,title,description,cover_url,items').eq('user_id',user).eq('is_public',true);if(error)throw error;
 const current=new Map((S.collections||[]).map(c=>[String(c.id),c]));const library=new Map((S.library||[]).map(t=>[String(t.id),t]));
 for(const old of data||[]){if(AUTH_USER?.id!==user)break;const c=current.get(String(old.id));if(!c)continue; // Never unpublish during a partially loaded/merged local state.
 const items=(c.titleIds||[]).map(id=>library.get(String(id))).filter(Boolean).map(t=>({title:t.title,coverUrl:mf310SafeImg(t.coverUrl),status:t.status||'',rating:t.rating??null}));
 const next={title:String(c.title||''),description:String(c.description||''),cover_url:mf310SafeImg(c.coverUrl),items};
 const comparable=arr=>(Array.isArray(arr)?arr:[]).map(t=>[String(t.title||''),String(t.coverUrl||''),String(t.status||''),t.rating??null]);
 if(JSON.stringify([old.title,old.description,old.cover_url,comparable(old.items)])===JSON.stringify([next.title,next.description,next.cover_url,comparable(next.items)]))continue;
 const {error:er}=await supabase.from('mf_public_collections').update({...next,updated_at:new Date().toISOString()}).eq('user_id',user).eq('id',old.id).eq('is_public',true);if(er)throw er;
 }
 }catch(e){console.warn('[MediaFlow v310] Opt-in public Collection update failed:',e);}finally{mf310PublishBusy=false;}}
// Explicit owner deletion removes public visibility, but canceled deletions leave it untouched.
const mf310DeleteCollectionBase=App.v274DeleteCollection;
App.v274DeleteCollection=async function(id,...rest){
 const old=S.collections?.find(c=>String(c.id)===String(id));
 const result=await mf310DeleteCollectionBase.call(this,id,...rest);
 if(old&&!S.collections?.some(c=>String(c.id)===String(id))&&AUTH_USER&&supabase){
  const {error}=await supabase.from('mf_public_collections').update({is_public:false,updated_at:new Date().toISOString()}).eq('user_id',AUTH_USER.id).eq('id',String(id));
  if(error)console.warn('[MediaFlow v310] Could not unpublish deleted Collection:',error);
 }
 return result;
};
const mf310SaveStateBase=saveState;
saveState=function(...args){const outcome=mf310SaveStateBase.apply(this,args);Promise.resolve(outcome).then(()=>mf310SchedulePublishedSync()).catch(()=>{});return outcome;};
const mf310PersistLibraryBase=persistLibrary;
persistLibrary=function(...args){const outcome=mf310PersistLibraryBase.apply(this,args);Promise.resolve(outcome).then(()=>mf310SchedulePublishedSync()).catch(()=>{});return outcome;};
// Refresh saved records whenever Workspace Collections is visited; poll only while visible.
setInterval(()=>{if(AUTH_USER&&S?.view==='collections'&&!document.body.classList.contains('mf302-public-active')&&Date.now()-MF310.savedLoaded>60000&&!MF310.savedLoading){mf310LoadSaved(true).then(()=>{if(S.view==='collections')render();}).catch(e=>console.warn('[MediaFlow v310] refresh:',e));}},30000);
window.MF310={version:310,open:mf310NavigateToCollection,save:mf310Save,unsave:mf310Unsave,loadSaved:mf310LoadSaved,refresh:mf310ReloadDirectory,workspaceOpen:mf310WorkspaceOpen,workspaceBack:mf310WorkspaceBack,state:MF310};
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{},{version:310,publicCollectionsFiveViews:true,liveSavedCollections:true});
