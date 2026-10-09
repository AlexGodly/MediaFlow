/* MediaFlow v329 — owner-native Community/profile parity and presentation.
 * Every public-only modifier is guarded; private Workspace renderers stay unchanged.
 * No new duplicate media tables, media publication, or persistent catalog snapshots.
 */
const MF329={version:329,publicRendering:false,shares:new Set(),sharingUser:'',sharingBusy:false,favoritePage:0,favoriteQuery:''};
function mf329PackagedIcon(raw){const s=String(raw||'').replace(/^\.\//,'').replace(/^\//,'');return typeof v258NormalizeBuiltInCategoryIcon==='function'?v258NormalizeBuiltInCategoryIcon(s):'';}
function mf329IconSrc(raw){const s=String(raw||'').trim();const packaged=mf329PackagedIcon(s);if(packaged){const js=document.querySelector('script[src*="mediaflow-v"]');try{return new URL('../../'+packaged,js?.src||document.baseURI).href;}catch(_){return '';}}return /^https:\/\//i.test(s)?s:'';}
function mf329Icon(cat){const src=mf329IconSrc(cat?.iconUrl||'');const emoji=String(cat?.icon||'📚');return src?`<span class="mf329-icon-wrap"><img class="mf329-cat-icon" src="${mf323E(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="mf329-icon-fallback" hidden>${mf323E(emoji==='🖼️'?'📚':emoji)}</span></span>`:`<span class="mf329-icon-wrap mf329-emoji">${mf323E(emoji==='🖼️'?'📚':emoji)}</span>`;}
// The v325 public projection historically rejected local packaged icon assets.
const mf329OldCategory=mf325Category;
mf325Category=function(c){const x=mf329OldCategory(c);x.iconUrl=mf329IconSrc(c?.iconUrl);return x;};
const mf329BaseCategoryHtml=v144CategoryIconHtml;
v144CategoryIconHtml=function(cat){return MF329.publicRendering?mf329Icon(cat):mf329BaseCategoryHtml(cat);};
const mf329BaseCategoryText=v144CategoryIconText;
v144CategoryIconText=function(cat){return MF329.publicRendering&&cat?.iconUrl?'':mf329BaseCategoryText(cat);};
// Preserve the owner's original History session title references (now supplied by live API).
// History is intentionally reconstructed only from the exposed sessions; this does NOT
// bypass hidden Library permissions or request the owner's complete private Library.
const mf329BaseLoadState=mf325LoadState;
mf325LoadState=async function(section){const state=await mf329BaseLoadState(section);
 if(section==='old'){state.oldSystem={...state.oldSystem,mode:'stats'};}
 if(section==='history'){
  const byId=new Map();for(const s of state.sessions||[]){for(const t of s.titles||[]){const id=String(t.libraryId||'');if(!id)continue;
    const old=byId.get(id);if(!old||!old.coverUrl)byId.set(id,{id,title:t.title||s.title||'Untitled',categoryId:s.categoryId,coverUrl:t.coverUrl||'',status:'active',progress:0,total:0});}
  }state.library=[...byId.values()];
 }
 return state;};
// The original Workspace page renderers remain the source for all public markup.
const mf329BaseNativeMarkup=mf325OriginalMarkup;
mf325OriginalMarkup=function(id,state){if(id==='old')state.oldSystem.mode='stats';MF329.publicRendering=true;
 try{return mf329BaseNativeMarkup(id,state);}finally{MF329.publicRendering=false;}};
const mf329BaseStatsMarkup=mf326NativeStats;
mf326NativeStats=function(state){MF329.publicRendering=true;try{return mf329BaseStatsMarkup(state);}finally{MF329.publicRendering=false;}};
// Public-only DOM restrictions: keep useful browsing/navigation, suppress authoring tools.
const mf329BaseSafeDom=mf325SafeDom;
mf325SafeDom=function(markup,id){const safe=mf329BaseSafeDom(markup,id),t=document.createElement('template');t.innerHTML=safe;
 if(id==='order')t.content.querySelectorAll('.mf287-add-collection-card,.v138-order-view .card:has(.v138-picker-search),.v138-order-picker,.v138-picker-actions').forEach(x=>x.remove());
 if(id==='old')t.content.querySelectorAll('.v153-os-tabs').forEach(x=>x.remove());
 if(id==='library'){
  t.content.querySelectorAll('button,[role="button"],.mf325-passive').forEach(x=>{
    const words=[x.textContent||'',x.getAttribute('title')||'',x.getAttribute('aria-label')||''].join(' ').trim();
    if(/fix completed|quick (?:edit|category|status|priority)|set (?:category|status|priority)|bulk (?:edit|action)/i.test(words))x.remove();
  });
 }
 if(id==='statistics'){
  const card=t.content.querySelector('.profile-stat-hero');if(card){card.querySelector('.profile-stat-avatar')?.remove();const block=card.firstElementChild;
   if(block){for(const e of [...block.children])if(!e.querySelector('.pill')&&!e.classList.contains('pill'))e.remove();}}
  const active=t.content.querySelector('.mf316-stats-title h2');if(active)active.textContent='Active time';
 }
 return t.innerHTML;};
// The native public renderers also use this sanitizer on read-only refreshes.
function mf329TouchIconFailures(root){root?.addEventListener('error',ev=>{const img=ev.target;if(img?.matches?.('.mf329-cat-icon')){img.hidden=true;const f=img.nextElementSibling;if(f)f.hidden=false;}},true);}
const mf329OldLoadTab=mf325LoadTab;
mf325LoadTab=async function(...args){const result=await mf329OldLoadTab.apply(this,args);const host=document.getElementById('mf323-tab-body');if(host){mf329TouchIconFailures(host);}return result;};
mf323LoadTab=mf325LoadTab;
// Explicitly handle cover/title clicks on a public Library row. Other native filters remain.
const mf329BaseInteraction=mf325Interaction;
mf325Interaction=function(ev){if(ev.type==='click'&&MF323.selected==='library'&&MF325.current){
 const row=ev.target.closest?.('[data-library-id],.mf274-collection-title-card,.library-row,[data-title-id]');
 if(row&&!ev.target.closest?.('[data-mf325-action],.mf325-refresh')){
  const id=row.getAttribute('data-library-id')||row.getAttribute('data-title-id');let t=MF325.current.library.find(x=>String(x.id)===String(id));
  if(!t){const title=ev.target.closest('button,span,b,strong,a')?.textContent?.trim();t=title&&MF325.current.library.find(x=>String(x.title)===title);}
  if(t){ev.preventDefault();ev.stopImmediatePropagation();MF329.details(t.id);return;}
 }
 }return mf329BaseInteraction.call(this,ev);};
MF329.details=function(id){const t=MF325.current?.library?.find(x=>String(x.id)===String(id));if(!t)return;
 document.getElementById('mf329-title-dialog')?.remove();const d=document.createElement('div');d.className='mf329-dialog-backdrop';d.id='mf329-title-dialog';
 const cat=MF325.current.categories.find(c=>String(c.id)===String(t.categoryId));d.innerHTML=`<section class="mf329-dialog" role="dialog" aria-modal="true" aria-labelledby="mf329-dialog-title"><div class="mf329-dialog-body"><div class="mf329-dialog-poster">${mf323Img(t.coverUrl)||mf329Icon(cat)}</div><div><small>PUBLIC LIBRARY · TITLE</small><h2 id="mf329-dialog-title">${mf323E(t.title)}</h2><p>${mf323E(cat?.name||'Media')} · ${mf323E(t.status||'Planned')}</p><p>${Number(t.progress)||0} / ${t.total||'—'} · ★ ${t.rating==null?'Unrated':mf323E(t.rating)}</p></div></div><footer><button class="mf329-btn-quiet" data-close>Close</button><button class="mf329-btn-primary" data-add>${AUTH_USER?'Quick Add to my Library':'Sign in to Quick Add'}</button></footer></section>`;
 d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))d.remove();if(e.target.closest('[data-add]'))MF329.startQuickAdd(id);});document.body.appendChild(d);d.querySelector('[data-close]')?.focus();};
MF329.startQuickAdd=function(id){const title=MF325.current?.library?.find(t=>String(t.id)===String(id));if(!title)return;
 if(!AUTH_USER){mfNotice('Sign in to add titles to your Library.');return;}
 const d=document.getElementById('mf329-title-dialog');if(!d)return;
 const existing=(S.library||[]).some(t=>String(t.title||'').toLocaleLowerCase()===String(title.title||'').toLocaleLowerCase()&&String(t.categoryId||'')===String(title.categoryId||''));
 const options=(S.categories||[]).map(c=>`<option value="${mf323E(String(c.id))}">${mf323E(c.name)}</option>`).join('');
 d.querySelector('footer').innerHTML=`<label class="mf329-quick-category">Add to Category <select id="mf329-add-category">${options}</select></label><button class="mf329-btn-quiet" data-close>Cancel</button><button class="mf329-btn-primary" data-save ${existing?'title="A similarly named title may already exist"':''}>Add title</button>`;
 d.querySelector('[data-save]').addEventListener('click',async()=>{const categoryId=d.querySelector('#mf329-add-category')?.value;if(!S.categories.some(c=>String(c.id)===categoryId))return;
   if((S.library||[]).some(x=>String(x.title||'').toLocaleLowerCase()===String(title.title||'').toLocaleLowerCase()&&String(x.categoryId||'')===categoryId)){mfNotice('This title already exists in your selected Category.');return;}
   const item={id:uid(),title:title.title,coverUrl:title.coverUrl||'',categoryId,status:'planned',priority:'medium',progress:0,total:Number(title.total)||null,rating:null,createdAt:Date.now(),externalIds:{...(title.externalIds||{})}};
   S.library.push(item);awardLibraryAdditionXP(item.id);await saveState();d.remove();mfNotice('Added '+item.title+' to your Library.');
 });};
// Public category overview: canonical order, resolved icons, real per-category counts.
mf323Categories=async function(){const owner=MF323.profile?.user_id;if(!owner)return;const root=document.getElementById('mf323-cats');if(!root)return;
 try{const meta=(await mf325ReadAll('meta',owner))[0]||{};if(MF323.profile?.user_id!==owner)return;const cats=Array.isArray(meta.categories)?meta.categories:[];
 MF323.categories=cats;root.classList.add('mf329-universe');root.innerHTML=cats.map(c=>`<div class="mf329-universe-category">${mf329Icon(c)}<span>${mf323E(c.name)}</span><b>${Number(meta.categoryCounts?.[c.id]||0).toLocaleString()} titles</b></div>`).join('')||'<p>No categories available.</p>';mf329TouchIconFailures(root);
 }catch(e){if(MF323.profile?.user_id===owner)root.textContent='Categories temporarily unavailable.';}};
// Correct visual semantics for share/profile appearance actions.
function mf329Svg(name){const paths={share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',palette:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1"/><circle cx="13" cy="7" r="1"/><circle cx="17" cy="11" r="1"/><path d="M13 21c-2-2-1-4 1-4s4 1 5-1"/>',image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 6-5 4 3 3-4 5 5"/>',search:'<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>'};return `<svg class="mf329-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||''}</svg>`;}
mf323ThemeButtons=function(){return AUTH_USER?`<div class="mf323-segment"><button type="button" class="${MF323.theme!=='profile'?'active':''}" onclick="MF323.themeTo('mediaflow')">${mf329Svg('palette')} MediaFlow theme</button><button type="button" class="${MF323.theme==='profile'?'active':''}" onclick="MF323.themeTo('profile')">${mf329Svg('image')} Profile theme</button></div>`:'';};
const mf329OriginalHeader=mf323Header;
mf323Header=function(...args){return mf329OriginalHeader.apply(this,args).replace('Share profile ↗',mf329Svg('share')+' Share profile');};
// Profile Studio search uses the familiar media-logging results treatment and rank.
let mf329FavDelay;
mf323FavoriteSearch=function(value){MF329.favoriteQuery=String(value||'').trim();MF329.favoritePage=0;clearTimeout(mf329FavDelay);mf329FavDelay=setTimeout(()=>MF329.favoritesRender(),90);};
MF329.favoritesRender=function(){const el=document.getElementById('mf323-search-results'),editor=MF323.editor;if(!el||!editor)return;
 const query=MF329.favoriteQuery.toLocaleLowerCase();if(!query){el.innerHTML='<div class="mf329-fav-empty">'+mf329Svg('search')+' Search your Library by title to add favorites.</div>';return;}
 const selected=new Set(editor.favorites.map(x=>String(x.id))),found=[];for(const t of S.library||[]){if(selected.has(String(t.id)))continue;const name=String(t.title||'');if(name.toLocaleLowerCase().includes(query))found.push(t);}
 found.sort((a,b)=>{const rank=t=>String(t.title||'').toLocaleLowerCase()===query?0:String(t.title||'').toLocaleLowerCase().startsWith(query)?1:2;return rank(a)-rank(b)||String(a.title).localeCompare(String(b.title));});
 const size=12,count=Math.ceil(found.length/size),pg=Math.min(MF329.favoritePage,Math.max(0,count-1));MF329.favoritePage=pg;
 const cats=new Map((S.categories||[]).map(c=>[String(c.id),c]));el.classList.add('mf329-fav-results');
 el.innerHTML=`<div class="mf329-fav-result-top"><span>${found.length.toLocaleString()} matches</span><small>Page ${count?pg+1:0} of ${count}</small></div>${found.slice(pg*size,(pg+1)*size).map(t=>{const c=cats.get(String(t.categoryId));return `<button type="button" class="mf329-fav-row" data-mf329-fav="${mf323E(String(t.id))}">${mf323Img(t.coverUrl)||'<span class="mf329-fav-cover">'+mf329Icon(c)+'</span>'}<span><strong>${mf323E(t.title)}</strong><small>${mf323E(c?.name||'Uncategorized')} · ${mf323E(t.status||'Planned')}</small></span><b>Add +</b></button>`;}).join('')||'<div class="mf329-fav-empty">No matching titles found.</div>'}${count>1?`<div class="mf329-fav-pages"><button data-pg="-1" ${pg===0?'disabled':''}>Previous</button><span>${pg+1} / ${count}</span><button data-pg="1" ${pg===count-1?'disabled':''}>Next</button></div>`:''}`;
 el.onclick=ev=>{const fav=ev.target.closest('[data-mf329-fav]');if(fav){MF323.addFavorite(fav.dataset.mf329Fav);MF329.favoritesRender();}const pg=ev.target.closest('[data-pg]');if(pg){MF329.favoritePage+=Number(pg.dataset.pg);MF329.favoritesRender();}};mf329TouchIconFailures(el);
};
const mf329PreviousEditor=mf323Editor;
mf323Editor=async function(...args){const result=await mf329PreviousEditor.apply(this,args);const search=document.querySelector('.mf323-editor input[aria-label="Search favorite titles"]');if(search){search.closest('.mf323-card')?.classList.add('mf329-favorites-studio');search.placeholder='Search titles, like the Logging picker…';search.setAttribute('autocomplete','off');MF329.favoritesRender();}return result;};
// Show per-Collection sharing inside the REAL private Workspace Collection details.
async function mf329FetchSharing(){if(!AUTH_USER||MF329.sharingBusy)return;MF329.sharingBusy=true;const owner=AUTH_USER.id;
 try{const {data,error}=await supabase.from('mf_collection_shares_v328').select('collection_id').eq('user_id',owner);if(error)throw error;
 if(AUTH_USER?.id!==owner)return;MF329.sharingUser=owner;MF329.shares=new Set((data||[]).map(x=>String(x.collection_id)));if(S.view==='collections'&&V274_UI.activeId)render();
 }catch(e){console.warn('Collection sharing status:',e?.message||e);}finally{MF329.sharingBusy=false;}}
const mf329CollectionDetail=v274CollectionDetailHtml;
v274CollectionDetailHtml=function(c){const html=mf329CollectionDetail.apply(this,arguments);if(!AUTH_USER||S===MF325.current||MF329.publicRendering)return html;
 if(MF329.sharingUser!==AUTH_USER.id&&!MF329.sharingBusy)Promise.resolve().then(mf329FetchSharing);
 const pub=MF329.sharingUser===AUTH_USER.id&&MF329.shares.has(String(c.id));const pending=MF329.sharingUser!==AUTH_USER.id;
 const panel=`<div class="mf329-collection-sharing"><div><b>Community & public profile</b><small>${pending?'Checking sharing status…':pub?'Anyone can view the current Collection.':'Only you can view this Collection.'}</small></div><button type="button" class="btn ${pub?'btn-ghost':'btn-primary'}" ${pending?'disabled':''} onclick="App.mf329ShareCollection('${escapeHtml(String(c.id))}',${!pub})">${pub?'Make Private':'Make Public'}</button></div>`;
 return html.replace('</div>', '</div>')+panel;};
App.mf329ShareCollection=async function(id,pub){if(!AUTH_USER)return;try{await mf328SetShared(id,pub);MF329.shares[pub?'add':'delete'](String(id));render();mfNotice(pub?'Collection is now public in Community and your profile.':'Collection is now private.');}catch(e){mfNotice('Could not update Collection sharing: '+(e.message||e));}};
window.MF329=MF329;MF323.favoritesSearch=mf323FavoriteSearch;
window.MediaFlowCommunity={...(window.MediaFlowCommunity||{}),version:329,publicProfileParity:true};
