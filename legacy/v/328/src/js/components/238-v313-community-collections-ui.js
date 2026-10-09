/* MediaFlow v313 — coherent Community controls, rankings, profile shares,
   and Workspace Collections owned-detail repair / unified or split organization.
   All public profile and Collection shares continue to respect RLS visibility. */
const MF313={collectionLayout:'combined',combinedScope:'all',activeTab:'my',totalTitles:null,titleCountAt:0,titleCountBusy:false};
function mf313Prefs(){const p=S?.settings?.v313Collections;if(p){MF313.collectionLayout=p.layout==='tabs'?'tabs':'combined';MF313.combinedScope=['all','my','community'].includes(p.scope)?p.scope:'all';MF313.activeTab=p.tab==='community'?'community':'my';}}
function mf313SavePrefs(){if(!S?.settings)return;S.settings.v313Collections={layout:MF313.collectionLayout,scope:MF313.combinedScope,tab:MF313.activeTab};try{persistSettings();}catch(e){console.warn('[v313] Collection layout persistence:',e)}}
function mf313AvatarIcon(){return `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="3" width="17" height="18" rx="4"/><circle cx="12" cy="9" r="3"/><path d="M6.8 18c.4-3 2.1-4.5 5.2-4.5s4.8 1.5 5.2 4.5"/></svg>`;}
// Public users: use a genuine portrait/avatar icon (rather than the old play icon).
const mf313PreviousUserControls=mf312UserControls;
mf312UserControls=function(){let html=mf313PreviousUserControls();
 html=html.replace(/(<button[^>]*data-value="avatars"[^>]*>)([\s\S]*?)(<\/button>)/,(_m,a,b,c)=>a+mf313AvatarIcon()+' Avatars'+c);
 // Keep existing wired inputs; promote them into a structured, easy-to-scan filter card.
 html=html.replace('<div class="mf312-user-tools">','<div class="mf312-user-tools mf313-filter-panel">');
 html=html.replace('<div class="mf312-users-layout">','<div class="mf312-users-layout mf313-layout-bar">');
 return html;};
const mf313PreviousUserResults=mf312UserResults;
mf312UserResults=function(){const p=MF312.users;if(p.tab!=='ranking')return mf313PreviousUserResults();
 const rows=p.rows||[],ordered=!!p.desc;
 // Top ranks only when the first unsearched, first page is displayed, and only
 // for the highest-to-lowest ranking. Other sorts keep all numbered rows.
 const podium=ordered&&p.offset===0&&!p.query&&rows.length>=3?rows.filter(u=>Number(u.rank)<=3).slice(0,3):[];
 let html=mf313PreviousUserResults();
 if(!podium.length)return html.replace('mf312-users-grid ', 'mf312-users-grid mf313-ranking-list ');
 const medal=(rank)=>rank===1?'gold':rank===2?'silver':'bronze';
 const podiumHtml=`<section class="mf313-rank-podium" aria-label="Top three users">${[2,1,3].map(rank=>{const u=podium.find(t=>Number(t.rank)===rank);if(!u)return '';const link=mfPath(encodeURIComponent(u.username));return `<article class="mf313-rank-spot mf313-${medal(rank)}"><span class="mf313-rank-medal" aria-label="Rank ${rank}">${rank===1?'★':'✦'} #${rank}</span><a href="${mfEsc(link)}" data-mf306-route="${mfEsc(u.username)}" class="mf313-rank-portrait">${mf312Picture(u)}</a><a class="mf313-rank-name" href="${mfEsc(link)}" data-mf306-route="${mfEsc(u.username)}">${mfEsc(u.display_name||u.username)}</a><span class="mf313-rank-handle">@${mfEsc(u.username)}</span><strong>${mfEsc(mf312UserMetric(u,p.sort))}</strong>${mf312Badge(u)}<a class="mf302-btn mf313-rank-open" href="${mfEsc(link)}" data-mf306-route="${mfEsc(u.username)}">View profile ${mfIcon('arrow')}</a></article>`;}).join('')}</section>`;
 const container=html.match(/<div class="mf312-users-grid [^"]+">/);
 if(container){html=html.replace(container[0],podiumHtml+'<div class="mf312-users-grid mf313-ranking-list mf312-grid-'+p.view+'">');
 // Remove the first three from the ordinary list, but keep their total and original ranks.
 const start=html.indexOf('<div class="mf312-users-grid mf313-ranking-list');const end=html.indexOf('<div class="mf310-pagination">',start);
 if(start>=0&&end>start){const before=html.slice(0,start),after=html.slice(end);const remainder=rows.filter(u=>Number(u.rank)>3);html=before+`<div class="mf312-users-grid mf313-ranking-list mf312-grid-${p.view}">${remainder.map(u=>mf312UserCard(u,p.view)).join('')}</div>`+after;}
 }
 return html;};
// Public profile Share button is inserted AFTER async profile rendering. It is
// visible to guests and needs no login; copy is safe for already-public profiles.
const mf313PriorPublicRender=mfRenderPublic;
mfRenderPublic=async function(){const result=await mf313PriorPublicRender();if(MF302.page==='profile')mf313DecorateProfile();return result;};
function mf313ProfileURL(username){return (!/^https?:$/.test(location.protocol)||location.origin==='null'?'https://alexgodly.github.io/MediaFlow/':location.origin+mfRoot)+encodeURIComponent(username);}
function mf313DecorateProfile(){const u=MF302.profile;if(!u?.is_public||!u.username)return;const panel=document.querySelector('#mf302-content .mf302-profile .mf302-hero-actions');if(!panel||panel.querySelector('[data-mf313-share-profile]'))return;const b=document.createElement('button');b.type='button';b.className='mf302-btn mf313-share-profile';b.dataset.mf313ShareProfile=u.username;b.innerHTML=`${mfIcon('arrow')} Share profile link`;panel.appendChild(b);}
const mf313PriorProfileEditor=mfProfileEditor;
mfProfileEditor=async function(){await mf313PriorProfileEditor();const panel=document.querySelector('#view-root .mf302-publish');const u=MF302.userProfile;if(u?.is_public&&u?.username&&panel&&!panel.querySelector('[data-mf313-share-profile]')){const b=document.createElement('button');b.type='button';b.className='mf302-btn mf313-share-profile';b.dataset.mf313ShareProfile=u.username;b.innerHTML=`${mfIcon('arrow')} Copy public profile link`;panel.appendChild(b);}};
// The MediaFlow v310 renderer unconditionally returned a Collection BROWSER even
// when V274_UI.activeId was selected. Restore the actual v274 detail page.
function mf313WorkspaceCollections(){
 if(MF310.workspaceActive)return mf310RenderWorkspacePage();
 if(V274_UI.activeId){const col=v274CollectionById(String(V274_UI.activeId));if(col)return mf310BaseWorkspacePage();V274_UI.activeId='';}
 if(AUTH_USER&&(!MF310.savedLoaded||MF310.savedUser!==AUTH_USER.id||Date.now()-MF310.savedLoaded>60000)&&!MF310.savedLoading){Promise.resolve().then(()=>mf310LoadSaved(true)).then(()=>{if(S.view==='collections'&&!MF310.workspaceActive&&!V274_UI.activeId)render();}).catch(e=>console.warn('[v313] Saved Collections refresh:',e));}
 mf313Prefs();const tabs=MF313.collectionLayout==='tabs';
 const showMy=tabs?MF313.activeTab==='my':MF313.combinedScope!=='community';
 const showCommunity=tabs?MF313.activeTab==='community':MF313.combinedScope!=='my';
 let myHtml=showMy?mf310BaseWorkspaceBrowser():'';
 let savedHtml=showCommunity?mf310WorkspaceSection().replace(/<button class="mf302-btn" type="button" data-mf310-action="refresh-saved">Refresh saved Collections<\/button>/,''):'';
 const myCount=Array.isArray(S?.collections)?S.collections.length:0;
 const savedCount=MF310.savedUser===AUTH_USER?.id?MF310.saved.length:0;
 // Keep all existing private Collection sorting, searching, editing and views.
 const controls=`<div class="mf313-main-tools"><div class="mf313-layout-tabs" role="group" aria-label="Collections arrangement"><button type="button" class="btn btn-sm ${!tabs?'btn-primary':''}" data-mf313-action="layout" data-value="combined" aria-pressed="${!tabs}">${mfIcon('collections')} Together</button><button type="button" class="btn btn-sm ${tabs?'btn-primary':''}" data-mf313-action="layout" data-value="tabs" aria-pressed="${tabs}">${mfIcon('workspace')} Separate tabs</button></div><div class="mf313-head-actions"><button type="button" class="btn btn-sm" data-mf310-action="refresh-saved" title="Fetch the creator's latest public Collection updates">${mfIcon('browse')} Refresh saved</button><button type="button" class="btn btn-sm" data-mf310-action="go-community">${mfIcon('arrow')} Explore Community</button><button type="button" class="btn btn-primary" onclick="App.v274CreateCollection()">${mfIcon('add')} New Collection</button></div></div>`;
 const source= tabs?`<div class="mf313-source-tabs" role="tablist" aria-label="Collection type"><button type="button" role="tab" aria-selected="${MF313.activeTab==='my'}" class="${MF313.activeTab==='my'?'active':''}" data-mf313-action="tab" data-value="my">My Collections <span>${myCount}</span></button><button type="button" role="tab" aria-selected="${MF313.activeTab==='community'}" class="${MF313.activeTab==='community'?'active':''}" data-mf313-action="tab" data-value="community">Community Collections <span>${savedCount}</span></button></div>`:
 `<div class="mf313-scope-row"><label class="mf313-scope">Show Collections<select id="mf313-scope" aria-label="Filter Collections by source">${mf310Options([['all','All Collections'],['my','My Collections'],['community','Community Collections']],MF313.combinedScope)}</select></label><div class="mf313-counts"><span>${myCount} mine</span><span>${savedCount} saved</span></div></div>`;
 // Both sections retain their original working click actions. Disable duplicate
 // 'Add Collection' and page headings, replaced by a single unified command bar.
 return `<main class="mf274-page mf313-workspace-collections"><header class="mf313-workspace-heading"><div><div class="mf313-kicker">YOUR MEDIA LIBRARY</div><h1>Collections</h1><p>Organize your own Collections and follow curated Collections from the Community.</p></div></header>${controls}${source}${showMy?`<section class="mf313-my-section" aria-label="My Collections"><h2>My Collections <span>${myCount}</span></h2>${myHtml}</section>`:''}${showCommunity?`<section class="mf313-community-section" aria-label="Saved Community Collections">${tabs?`<div class="mf313-community-search"><input type="search" data-mf310-workspace-search placeholder="Search saved Community Collections…" value="${mfEsc(V274_UI.search)}" aria-label="Search saved Community Collections"></div>`:''}${savedHtml}</section>`:''}</main>`;
}
MediaFlowRuntime.registerPageRenderer('collections',mf313WorkspaceCollections);
// Count ALL distinct stable-ID public title identities, including unrated ones.
// Throttle to a cache window so sort/view/page changes do not re-count 30k titles.
async function mf313LoadTitleCount(){if(!supabase||MF313.titleCountBusy)return;const now=Date.now();if(MF313.totalTitles!==null&&now-MF313.titleCountAt<300000){mf313PaintTitleCount();return;}MF313.titleCountBusy=true;try{const {data,error}=await mf328Get('count').then(r=>({data:r.count,error:null}));if(error)throw error;const n=Number(data);if(Number.isFinite(n)&&n>=0){MF313.totalTitles=n;MF313.titleCountAt=Date.now();mf313PaintTitleCount();}}catch(e){console.warn('[v313] Community title count:',e?.message||e);}finally{MF313.titleCountBusy=false;}}
function mf313PaintTitleCount(){const slot=document.getElementById('mf313-total-titles');if(slot&&MF313.totalTitles!==null)slot.textContent=`${MF313.totalTitles.toLocaleString()} titles across the Community`;}
const mf313PreviousBrowseResults=mf309Results;
mf309Results=function(){const html=mf313PreviousBrowseResults();return html.replace('<div class="mf309-results-head">',`<div class="mf309-results-head mf313-browse-totals"><div id="mf313-total-titles" class="mf313-total-badge" aria-live="polite">${MF313.totalTitles===null?'Community catalog · total loading…':MF313.totalTitles.toLocaleString()+' titles across the Community'}</div>`).replace('class="mf313-total-badge"','class="mf313-total-badge"');};
const mf313PreviousBrowse=mf309RenderBrowse;
mf309RenderBrowse=async function(){const result=await mf313PreviousBrowse();if(MF302.page==='browse')mf313LoadTitleCount();return result;};
// Clean up repetitive and cramped toolbar labels from supplied screenshots.
document.addEventListener('click',e=>{const b=e.target.closest('[data-mf313-action],[data-mf313-share-profile]');if(!b||e.button!==0)return;
 if(b.dataset.mf313ShareProfile){e.preventDefault();e.stopPropagation();const username=b.dataset.mf313ShareProfile;const url=mf313ProfileURL(username);mf312Copy(url).then(ok=>{if(ok)mfNotice('Public profile link copied.');else prompt('Copy public profile link:',url);});return;}
 if(S.view!=='collections'||document.body.classList.contains('mf302-public-active'))return;
 e.preventDefault();e.stopPropagation();const action=b.dataset.mf313Action,v=b.dataset.value;
 if(action==='layout'){MF313.collectionLayout=v==='tabs'?'tabs':'combined';if(MF313.collectionLayout==='tabs'&&MF313.combinedScope==='community')MF313.activeTab='community';mf313SavePrefs();render();}
 if(action==='tab'){MF313.activeTab=v==='community'?'community':'my';mf313SavePrefs();render();}
},true);
document.addEventListener('change',e=>{if(e.target.id!=='mf313-scope')return;MF313.combinedScope=e.target.value;mf313SavePrefs();render();},true);
window.MF313={version:313,titleCount:mf313LoadTitleCount,shareProfile:mf313ProfileURL,workspace:mf313WorkspaceCollections,settings:MF313};
