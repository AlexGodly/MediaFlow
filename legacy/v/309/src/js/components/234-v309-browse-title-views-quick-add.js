/* MediaFlow v309 — true server-side Browse sorting, five view modes, and verified title Quick Add.
 * Runs INSIDE the existing app scope; does not mutate private data until the user confirms.
 */
const MF309_VIEWS=['list','compact','cards','covers','covers-titles'];
const MF309_SORTS=['libraries','title','ratings','rating_count'];
const MF309_STATUS=['','active','completed','planned','paused','dropped'];
function mf309Prefs(){
 const p=MF302.browsePrefs||(MF302.browsePrefs={view:'cards',sort:'libraries',desc:true,provider:'',status:'',minUsers:0,minRating:0});
 if(!MF309_VIEWS.includes(p.view))p.view='cards';
 if(!MF309_SORTS.includes(p.sort))p.sort='libraries';
 return p;
}
function mf309OptionList(items,selected){return items.map(([value,label])=>`<option value="${mfEsc(value)}" ${String(selected)===String(value)?'selected':''}>${mfEsc(label)}</option>`).join('');}
function mf309CoverList(t){return [...new Set((Array.isArray(t.covers)?t.covers:[]).map(x=>String(x||'').trim()).filter(x=>/^https:\/\//i.test(x)&&x.length<=2048))];}
function mf309Cover(t){const urls=mf309CoverList(t),url=urls.length?urls[Math.floor(Date.now()/300000)%urls.length]:'';return url?`<img loading="lazy" decoding="async" src="${mfEsc(url)}" alt="Cover artwork for ${mfEsc(t.title)}" referrerpolicy="no-referrer">`:`<div class="mf309-cover-missing">${mfIcon('book')}<span>No cover</span></div>`;}
function mf309Stats(t,short=false){
 const users=Number(t.users_count)||0,avg=t.average_rating==null?null:Number(t.average_rating),count=Number(t.ratings_count)||0;
 return `<span title="Libraries tracking this title">${users.toLocaleString()} libraries</span><span title="Community average rating">${mfIcon('ratings')} ${avg===null?'Not rated':avg.toFixed(2)+'/10'} <small>(${count.toLocaleString()})</small></span>${short?'':`<span>${mfEsc(t.provider).toUpperCase()} #${mfEsc(t.provider_id)}</span>`}`;
}
function mf309Status(t){const users=Number(t.users_count)||0;if(!users)return '';const data=Object.entries(t.statuses||{}).filter(([,v])=>Number(v)>0);return `<div class="mf309-statuses">${data.map(([status,count])=>`<span>${mfEsc(({active:'Watching',planned:'Planned',paused:'On Hold',completed:'Completed',dropped:'Dropped'})[status]||status)} ${Math.round(Number(count)/users*100)}%</span>`).join('')}</div>`;}
function mf309Tile(t){
 const view=mf309Prefs().view,id=mfEsc(t.provider)+'|'+mfEsc(t.provider_id);
 return `<article class="mf309-item mf309-${view}" data-mf309-title-key="${id}">
 <div class="mf309-cover">${mf309Cover(t)}</div>
 <div class="mf309-copy"><h3 title="${mfEsc(t.title)}">${mfEsc(t.title)}</h3><div class="mf309-meta">${mf309Stats(t,view==='compact'||view==='covers')}</div>${mf309Status(t)}</div>
 <button type="button" class="mf302-btn mf309-quick" data-mf309-action="quick-add" data-provider="${mfEsc(t.provider)}" data-provider-id="${mfEsc(t.provider_id)}" aria-label="Quick Add ${mfEsc(t.title)} to Library">${mfIcon('add')}<span>Quick Add</span></button>
 </article>`;
}
function mf309Controls(){const p=mf309Prefs();return `<section class="mf309-tools" aria-label="Browse title controls">
 <div class="mf309-tools-head"><div><h2>Browse your way</h2><p>Explore verified community titles · sort and filter across all pages.</p></div><div class="mf309-views" role="group" aria-label="Browse layout">${[['list','List'],['compact','Compact'],['cards','Cards'],['covers','Covers'],['covers-titles','Covers+Titles']].map(([id,label])=>`<button type="button" class="mf309-view ${p.view===id?'selected':''}" data-mf309-action="view" data-view="${id}" aria-pressed="${p.view===id}">${mfEsc(label)}</button>`).join('')}</div></div>
 <div class="mf309-filters">
 <label class="mf309-search-field"><span>Search titles</span><input id="mf309-search" type="search" placeholder="Search community titles…" value="${mfEsc(MF302.query)}" autocomplete="off"></label>
 <label><span>Sort by</span><select data-mf309-filter="sort">${mf309OptionList([['libraries','Library count'],['title','Title'],['ratings','Average rating'],['rating_count','Rating count']],p.sort)}</select></label>
 <label><span>Direction</span><select data-mf309-filter="desc">${mf309OptionList([['true','Descending'],['false','Ascending']],String(p.desc))}</select></label>
 <label><span>Source</span><select data-mf309-filter="provider">${mf309OptionList([['','All providers'],['mal','MyAnimeList'],['simkl','SIMKL']],p.provider)}</select></label>
 <label><span>Status</span><select data-mf309-filter="status">${mf309OptionList([['','All statuses'],['active','Watching / Reading'],['completed','Completed'],['planned','Plan to Watch / Read'],['paused','On Hold'],['dropped','Dropped']],p.status)}</select></label>
 <label><span>Min. libraries</span><select data-mf309-filter="minUsers">${mf309OptionList([['0','Any'],['2','2+'],['5','5+'],['10','10+'],['50','50+'],['100','100+']],p.minUsers)}</select></label>
 <label><span>Min. average rating</span><select data-mf309-filter="minRating">${mf309OptionList([['0','Any'],['5','5+'],['7','7+'],['8','8+'],['9','9+']],p.minRating)}</select></label>
 <button class="mf302-btn mf309-reset" type="button" data-mf309-action="reset">Reset filters</button>
 </div></section>`;}
function mf309Results(){const p=mf309Prefs(),titles=Array.isArray(MF302.browseRows)?MF302.browseRows:[];return `<div class="mf309-results-head"><strong>${titles.length} shown</strong><span>${p.sort==='title'?'Sorted by title':p.sort==='rating_count'?'Sorted by rating count':p.sort==='ratings'?'Sorted by average rating':'Sorted by library count'} · ${p.desc?'descending':'ascending'}</span></div><div class="mf309-results mf309-layout-${p.view}">${titles.map(mf309Tile).join('')||mfEmpty('No titles match these filters. Try adjusting your search or filters.')}</div><div class="mf309-pagination"><button type="button" class="mf302-btn" data-mf309-action="page" data-dir="-1" ${(Number(MF302.catalogOffset)||0)===0?'disabled':''}>${mfIcon('back')} Previous</button><span>Page ${Math.floor((Number(MF302.catalogOffset)||0)/60)+1}</span><button type="button" class="mf302-btn" data-mf309-action="page" data-dir="1" ${titles.length<60?'disabled':''}>Next ${mfIcon('next')}</button></div>`;}
function mf309Bind(root){
 if(root.dataset.mf309Bound==='1')return;
 root.dataset.mf309Bound='1';
 root.addEventListener('click',e=>{const el=e.target.closest('[data-mf309-action]');if(!el||!root.contains(el))return;
  const action=el.dataset.mf309Action;
  if(action==='view'){mf309Prefs().view=el.dataset.view;root.querySelector('#mf309-body').innerHTML=mf309Results();root.querySelectorAll('.mf309-view').forEach(b=>{const active=b.dataset.view===mf309Prefs().view;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active?'true':'false');});}
  if(action==='reset'){MF302.query='';MF302.catalogOffset=0;MF302.browsePrefs={view:mf309Prefs().view,sort:'libraries',desc:true,provider:'',status:'',minUsers:0,minRating:0};mf309RenderBrowse();}
  if(action==='page'){MF302.catalogOffset=Math.max(0,(Number(MF302.catalogOffset)||0)+Number(el.dataset.dir)*60);mf309RenderBrowse();}
  if(action==='quick-add')mf309OpenQuickAdd(el.dataset.provider,el.dataset.providerId);
 });
 root.addEventListener('change',e=>{const k=e.target.dataset.mf309Filter;if(!k)return;
  const p=mf309Prefs();p[k]=k==='desc'?e.target.value==='true':['minUsers','minRating'].includes(k)?Number(e.target.value):e.target.value;
  MF302.catalogOffset=0;mf309RenderBrowse();
 });
 root.addEventListener('input',e=>{if(e.target.id!=='mf309-search')return;
  MF302.query=e.target.value;MF302.catalogOffset=0;clearTimeout(MF302.mf309SearchTimer);
  const cursor=e.target.selectionStart;MF302.mf309SearchTimer=setTimeout(()=>{mf309RenderBrowse().then(()=>{const input=document.getElementById('mf309-search');if(input&&MF302.page==='browse'){input.focus();try{input.setSelectionRange(cursor,cursor);}catch(_){}}});},280);
 });
}
async function mf309RenderBrowse(){
 const root=document.getElementById('mf302-content');if(!root||MF302.page!=='browse')return;
 const id=MF302.renderId=(Number(MF302.renderId)||0)+1,p=mf309Prefs();
 root.innerHTML=mfHeading('Browse titles','Community-contributed media with verified IDs, cover choices, and shared statistics.')+`<div id="mf309-browser">${mf309Controls()}<div id="mf309-body" aria-live="polite"><div class="mf302-empty">Loading community titles…</div></div></div>`;
 const host=root.querySelector('#mf309-browser');mf309Bind(host);
 try{
  if(!supabase)throw new Error('Community connection unavailable.');
  const {data,error}=await supabase.rpc('mf_browse_titles_v309',{p_search:MF302.query,p_sort:p.sort,p_desc:p.desc,p_provider:p.provider,p_status:p.status,p_min_users:p.minUsers,p_min_rating:p.minRating,p_limit:60,p_offset:Number(MF302.catalogOffset)||0});
  if(error)throw error;if(id!==MF302.renderId||MF302.page!=='browse')return;
  MF302.browseRows=data||[];const output=document.getElementById('mf309-body');if(output)output.innerHTML=mf309Results();
 }catch(err){if(id!==MF302.renderId)return;const output=document.getElementById('mf309-body');if(output)output.innerHTML=`<div class="mf309-error" role="alert"><strong>Could not load Browse titles</strong><p>${mfEsc(err.message||'The catalog is currently unavailable.')}</p><button class="mf302-btn" type="button" onclick="MF309.reload()">Retry</button></div>`;}
}
// Override only Browse; Ratings, profiles, collections and the Workspace retain v308 behavior.
const mf309PreviousRenderPublic=mfRenderPublic;
mfRenderPublic=async function(){if(MF302.page==='browse')return mf309RenderBrowse();return mf309PreviousRenderPublic();};
// Metadata is from opt-in published records only. Never import another user's
// personal progress, rating, status, private notes, or private category.
function mf309ValidMetadata(raw){const x=raw&&typeof raw==='object'?raw:{};const out={};
 for(const key of ['synopsis','type','season','releaseDate'])if(typeof x[key]==='string'&&x[key].trim())out[key]=x[key].slice(0,key==='synopsis'?3000:150);
 if(Number.isInteger(Number(x.year))&&Number(x.year)>=1800&&Number(x.year)<=2200)out.year=Number(x.year);
 if(Array.isArray(x.genres))out.genres=x.genres.filter(s=>typeof s==='string').slice(0,16).map(s=>s.slice(0,60));
 if(Number.isFinite(Number(x.duration))&&Number(x.duration)>0)out.duration=Number(x.duration);
 return out;}
function mf309GetRow(provider,id){return (MF302.browseRows||[]).find(t=>String(t.provider)===String(provider)&&String(t.provider_id)===String(id)) || MF302.mf309RatingCache?.get(String(provider)+'|'+String(id));}
// Ratings retained its pre-v309 card renderer. Cache that page's public catalog
// rows so its existing Quick Add buttons use the same real import dialog.
const mf309PreviousCatalogCard=mfCatalogCard;
mfCatalogCard=function(t){
 if(!MF302.mf309RatingCache)MF302.mf309RatingCache=new Map();
 MF302.mf309RatingCache.set(String(t.provider)+'|'+String(t.provider_id),t);
 if(MF302.mf309RatingCache.size>120)MF302.mf309RatingCache.delete(MF302.mf309RatingCache.keys().next().value);
 return mf309PreviousCatalogCard(t);
};
function mf309CloseQuickAdd(){document.getElementById('mf309-add-dialog')?.remove();MF302.addSource=null;}
function mf309OpenQuickAdd(provider,id){
 if(!AUTH_USER){mfNotice('Log in to add this title to your Library.');mfLogin();return;}
 const row=mf309GetRow(provider,id);if(!row){mfNotice('This title is no longer in the current Browse results.');return;}
 if(!S?.library||!Array.isArray(S.library)||!Array.isArray(S.categories)){mfNotice('Your Workspace is still loading. Please wait and retry.');return;}
 if(S.library.some(i=>String(i.externalIds?.[provider]||'')===String(id))){mfNotice('This verified title is already in your Library.');return;}
 const categories=S.categories.filter(c=>c&&c.enabled!==false);
 if(!categories.length){mfNotice('Create a Category in your Workspace first.');return;}
 mf309CloseQuickAdd();MF302.addSource=row;const covers=mf309CoverList(row),meta=mf309ValidMetadata(row.metadata);
 const preview=covers[0]||'',overlay=document.createElement('div');overlay.id='mf309-add-dialog';overlay.className='mf302-overlay mf309-overlay';
 const metaText=[meta.type,meta.year,meta.season,Number(row.total)>0?`${row.total} total units`:null,meta.genres?.join(' · ')].filter(Boolean).join(' · ');
 overlay.innerHTML=`<form class="mf302-dialog mf309-dialog" id="mf309-add-form" role="dialog" aria-modal="true" aria-labelledby="mf309-dialog-title"><div class="mf309-dialog-header"><div><span class="mf302-eyebrow">BROWSE TITLES · QUICK ADD</span><h2 id="mf309-dialog-title">Add to your Library</h2><p>Choose your own Category and cover. No other user's personal progress or ratings are copied.</p></div><button type="button" class="mf309-dialog-close" aria-label="Close dialog" data-close>×</button></div><div class="mf309-dialog-main"><div class="mf309-detail-preview">${preview?`<img id="mf309-selected-preview" src="${mfEsc(preview)}" alt="Selected cover" referrerpolicy="no-referrer">`:`<div class="mf309-cover-missing">${mfIcon('book')}</div>`}<div><h3>${mfEsc(row.title)}</h3><p>${mfEsc(provider.toUpperCase())} ID ${mfEsc(id)}</p><p>${mfEsc(metaText)}</p>${meta.synopsis?`<p class="mf309-synopsis">${mfEsc(meta.synopsis)}</p>`:''}</div></div><div class="mf309-form-grid"><label>Title<input name="title" required maxlength="500" value="${mfEsc(row.title)}"></label><label>Category<select name="category" required>${categories.map(c=>`<option value="${mfEsc(c.id)}">${mfEsc(c.name)}</option>`).join('')}</select></label><label>Status<select name="status">${mf309OptionList([['planned','Plan to Watch / Read'],['active','Watching / Reading'],['paused','On Hold'],['completed','Completed'],['dropped','Dropped']],'planned')}</select></label><label>Priority<select name="priority">${mf309OptionList([['medium','Medium'],['low','Low'],['high','High']],'medium')}</select></label></div><fieldset class="mf309-cover-field"><legend>Choose cover artwork ${covers.length?`· ${covers.length} available`:'· no published covers'}</legend><div class="mf309-cover-choices">${covers.map((url,i)=>`<label class="mf309-cover-choice"><input type="radio" name="coverChoice" value="${i}" ${i===0?'checked':''}><img loading="lazy" src="${mfEsc(url)}" alt="Cover choice ${i+1}" referrerpolicy="no-referrer"><span>Cover ${i+1}</span></label>`).join('')||'<p>No community covers available. You can enter your own URL below.</p>'}</div><label class="mf309-custom-cover">Or enter a custom HTTPS cover URL<input type="url" name="customCover" placeholder="https://example.com/cover.jpg" autocomplete="off"></label></fieldset></div><div class="mf309-dialog-footer"><button class="mf302-btn" type="button" data-close>Cancel</button><button class="mf302-btn primary" type="submit" id="mf309-save">${mfIcon('add')} Add to Library</button></div></form>`;
 overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close]'))mf309CloseQuickAdd();});
 const form=overlay.querySelector('form');form.addEventListener('submit',mf309ConfirmAdd);
 form.addEventListener('change',e=>{if(e.target.name==='coverChoice'){const url=covers[Number(e.target.value)]||'';const img=overlay.querySelector('#mf309-selected-preview');if(img)img.src=url;}});
 form.elements.customCover.addEventListener('input',e=>{const url=e.target.value.trim();const img=overlay.querySelector('#mf309-selected-preview');if(img&&/^https:\/\//i.test(url))img.src=url;else if(img)img.src=covers[Number(form.elements.coverChoice?.value)||0]||'';});
 document.body.appendChild(overlay);form.elements.title.focus();
}
async function mf309ConfirmAdd(ev){ev.preventDefault();const overlay=document.getElementById('mf309-add-dialog');if(!overlay||!AUTH_USER)return false;
 const form=ev.currentTarget,row=MF302.addSource;if(!row){mfNotice('Title information unavailable.');return false;}
 const data=Object.fromEntries(new FormData(form)),provider=String(row.provider),providerId=String(row.provider_id);
 const category=S.categories.find(c=>String(c.id)===String(data.category)&&c.enabled!==false),title=cleanTitle(data.title),covers=mf309CoverList(row);
 if(!category||!title){mfNotice('Select a valid Category and title.');return false;}
 if(S.library.some(i=>String(i.externalIds?.[provider]||'')===providerId)){mfNotice('This title is already in your Library.');return false;}
 const custom=String(data.customCover||'').trim();if(custom&&(!/^https:\/\//i.test(custom)||custom.length>2048)){mfNotice('Cover URL must use HTTPS and be shorter than 2049 characters.');return false;}
 const cover=custom||covers[Number(data.coverChoice)||0]||'',meta=mf309ValidMetadata(row.metadata);
 const item={id:uid(),title,categoryId:category.id,progress:0,total:Number(row.total)>0?Number(row.total):null,status:['planned','active','paused','completed','dropped'].includes(data.status)?data.status:'planned',priority:['low','medium','high'].includes(data.priority)?data.priority:'medium',coverUrl:cover,estimatedMinutes:null,tags:['community'],source:provider,externalIds:{[provider]:providerId},...meta,createdAt:Date.now(),modifiedAt:Date.now(),completedAt:data.status==='completed'?Date.now():null};
 const button=overlay.querySelector('#mf309-save');button.disabled=true;button.textContent='Adding…';
 S.library.push(item);awardLibraryAdditionXP(item.id);
 try{await persistLibrary();mf309CloseQuickAdd();mfNotice('Added “'+title+'” to your Library.');}
 catch(err){S.library=S.library.filter(x=>x.id!==item.id);if(S.xpLedger?.libraryAdditions)delete S.xpLedger.libraryAdditions[item.id];button.disabled=false;button.innerHTML=mfIcon('add')+' Add to Library';mfNotice('Could not save: '+err.message);}
 return false;
}
// Opt-in publisher now sends only whitelisted *media* metadata for verified titles.
const mf309PreviousPublish=mfPublish;
mfPublish=async function(which){if(which!=='library')return mf309PreviousPublish(which);
 if(!AUTH_USER)return;const profile=await mfMyProfile();if(!profile?.is_public){mfNotice('Enable and save your public profile first.');return;}
 if(!confirm('Publish your Library with verified media details, covers, statuses and ratings? Only your explicitly published Library is discoverable.'))return;
 try{const rows=S.library.filter(x=>x?.id&&x.title).map(x=>({user_id:AUTH_USER.id,entry_id:String(x.id),title:String(x.title).slice(0,500),category:String(S.categories.find(c=>c.id===x.categoryId)?.name||''),status:String(x.status||'planned'),cover_url:/^https:\/\//.test(String(x.coverUrl||''))?String(x.coverUrl).slice(0,2048):'',provider:String(x.externalIds?.mal?'mal':x.externalIds?.simkl?'simkl':''),provider_id:String(x.externalIds?.mal||x.externalIds?.simkl||''),rating:x.rating!==null&&x.rating!==undefined&&x.rating!==''&&Number.isFinite(Number(x.rating))?Number(x.rating):null,progress:Number(x.progress)||0,total:Number(x.total)||null,metadata:mf309ValidMetadata(x),updated_at:new Date().toISOString()}));
  for(let i=0;i<rows.length;i+=100){const {error}=await supabase.from('mf_public_library').upsert(rows.slice(i,i+100),{onConflict:'user_id,entry_id'});if(error)throw error;}
  mfNotice(`Published ${rows.length} Library titles with allowed metadata.`);
 }catch(err){mfNotice('Library publication failed: '+err.message);}
};
window.MF302=Object.assign(window.MF302||MF302,{quickAdd:mf309OpenQuickAdd,confirmAdd:mf309ConfirmAdd,publish:mfPublish,browseView(view){if(MF309_VIEWS.includes(view)){mf309Prefs().view=view;mf309RenderBrowse();}}});
window.MF309={version:309,reload:mf309RenderBrowse,quickAdd:mf309OpenQuickAdd,closeAdd:mf309CloseQuickAdd,getPrefs:()=>({...mf309Prefs()})};
window.MediaFlowCommunity=Object.assign(window.MediaFlowCommunity||{}, {version:309,browseFiveViews:true,serverSortFilters:true,coverChoiceQuickAdd:true});
