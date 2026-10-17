/* MediaFlow v425 — scoped recovery, title-cover workflows, XP and cohesive UI.
 * Runs after v424 without altering Library identifiers or cloud schemas.
 */
const MF425_VERSION=425;
const MF425={entry:'settings',locked:false,selected:[],oneId:'',active:null,hidden:'',lastAward:new Map(),draft:null,quickBusy:false,quick:null,observerPending:false};
const MF425_PATHS={
 images:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
 play:'<path d="m8 5 11 7-11 7Z"/>',pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
 stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
 download:'<path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4"/>',
 retry:'<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>',
 check:'<path d="m5 12 4 4L19 6"/>',x:'<path d="M5 5 19 19M19 5 5 19"/>',
 gift:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-5-7-7-8-3-1 3 3 3 8 3Zm0 0c2-5 7-7 8-3 1 3-3 3-8 3Z"/>',
 external:'<path d="M13 4h7v7M20 4l-9 9M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6"/>',
 cloud:'<path d="M6 19h12a4 4 0 0 0 .7-7.9A6.5 6.5 0 0 0 6.1 9 5 5 0 0 0 6 19Z"/>',
 spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
 tools:'<path d="M14 7a5 5 0 0 0 6 6l-9 9-4-4 9-9M7 3l4 4-4 4-4-4 4-4Z"/>',
 shield:'<path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5Z"/><path d="m9 12 2 2 4-4"/>',
 chevronUp:'<path d="m6 15 6-6 6 6"/>',chevronDown:'<path d="m6 9 6 6 6-6"/>',
 layers:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
 users:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 10h8M8 14h8"/>'
};
function mf425Icon(type,size=16){return '<svg class="mf425-icon" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(MF425_PATHS[type]||MF425_PATHS.images)+'</svg>';}
function mf425Esc(text){return escapeHtml(String(text==null?'':text));}
function mf425ScopeName(scope){const names={all:'All Library',category:'By Category',categoryStatus:'Category → Status',selected:'Selected Titles',single:'This Title'};return names[scope?.mode]||'All Library';}
function mf425Selection(){return typeof mfSelectedIds==='function'?mfSelectedIds().map(String):Object.keys(S.librarySelection||{}).filter(id=>S.librarySelection[id]).map(String);}
function mf425InitialScope(entry,id){MF425.entry=entry||'settings';MF425.oneId=id?String(id):'';MF425.selected=entry==='library'?mf425Selection():[];MF425.locked=!!MF425.oneId||MF425.selected.length>0;return MF425.oneId?'single':MF425.selected.length?'selected':'all';}
function mf425ScopeSnapshot(){const root=document.getElementById('mf425-scope');const mode=MF425.locked?(MF425.oneId?'single':'selected'):(root?.querySelector('[name="mf425-scope-mode"]')?.value||'all');
 const categories=[...(root?.querySelectorAll('input[data-mf425-category]:checked')||[])].map(el=>el.value);
 const pairs={};for(const el of (root?.querySelectorAll('input[data-mf425-status]:checked')||[])){const k=el.dataset.mf425Status;if(!pairs[k])pairs[k]=[];pairs[k].push(el.value);}
 return {mode,categories,pairs,ids:mode==='single'?[MF425.oneId]:mode==='selected'?MF425.selected.slice():[],source:MF425.entry,label:mf425ScopeName({mode}),created:Date.now()};}
function mf425Allows(item,scope=MF425.active){if(!scope||scope.mode==='all')return true;
 const id=String(item?.id||''),cat=String(item?.categoryId||''),status=String(item?.status||'planned');
 if(scope.mode==='single'||scope.mode==='selected'){if(!scope.__lookup)Object.defineProperty(scope,'__lookup',{value:new Set(scope.ids.map(String)),configurable:true,enumerable:false});return scope.__lookup.has(id);}
 if(scope.mode==='category')return scope.categories.includes(cat);
 if(scope.mode==='categoryStatus')return (scope.pairs[cat]||[]).includes(status);
 return false;}
// Called by the existing v424 job builder before it captures its immutable queue.
function mf425ScopeAllows(item){return mf425Allows(item);}
function mf425Counts(scope){let all=0,eligible=0;for(const item of (S.library||[])){if(!item||!mf425Allows(item,scope))continue;all++;if(mf424Missing(item))eligible++;}return {all,eligible};}
function mf425ScopeFields(){const cats=(S.categories||[]).filter(c=>c?.id);return '<section id="mf425-scope" class="mf425-config-section" aria-label="Recovery scope">'+
 '<h3>'+mf425Icon('layers')+' 1. Choose titles to recover</h3>'+
 '<label class="mf425-scope-select">Scope<select name="mf425-scope-mode" onchange="App.mf425ScopeChange()" '+(MF425.locked?'disabled':'')+'>'+[
 ['all','All Library'],['category','By Category'],['categoryStatus','Category → Status'],['selected','Selected Titles']].map(([v,n])=>'<option value="'+v+'" '+(v===MF425.startMode?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
 (MF425.locked?'<p class="mf425-scope-locked">'+mf425Icon('shield')+' '+(MF425.oneId?'Only the title you opened':'Only your '+MF425.selected.length.toLocaleString()+' selected Library titles')+' can be included in this job.</p>':'')+
 '<div class="mf425-categories" id="mf425-categories">'+cats.map(c=>'<label class="mf425-category-option"><input type="checkbox" data-mf425-category value="'+mf425Esc(c.id)+'" onchange="App.mf425ScopeChange()"><span>'+mf425Esc(c.name)+'</span></label>').join('')+'</div>'+
 '<div class="mf425-status-grid" id="mf425-status-grid"></div><div id="mf425-scope-count" class="mf425-count" role="status" aria-live="polite"></div></section>';
}
function mf425ScopeChange(){const root=document.getElementById('mf425-scope');if(!root)return;
 const mode=MF425.locked?(MF425.oneId?'single':'selected'):root.querySelector('[name="mf425-scope-mode"]').value;
 root.querySelector('#mf425-categories').hidden=!['category','categoryStatus'].includes(mode);
 const grid=root.querySelector('#mf425-status-grid');grid.hidden=mode!=='categoryStatus';
 if(mode==='categoryStatus'){
  const selected=[...root.querySelectorAll('input[data-mf425-category]:checked')].map(i=>i.value);
  const previous=new Set([...grid.querySelectorAll('input[data-mf425-status]:checked')].map(i=>i.dataset.mf425Status+':'+i.value));
  const statuses=[['planned','Plan to Watch / Read'],['active','Watching / Reading'],['paused','On Hold'],['completed','Completed'],['dropped','Dropped']];
  grid.innerHTML=selected.map(id=>{const cat=(S.categories||[]).find(c=>String(c.id)===id);return '<fieldset><legend>'+mf425Esc(cat?.name||id)+'</legend>'+statuses.map(([s,n])=>'<label><input data-mf425-status="'+mf425Esc(id)+'" type="checkbox" value="'+s+'" onchange="App.mf425UpdateCount()" '+(previous.has(id+':'+s)?'checked':'')+'>'+n+'</label>').join('')+'</fieldset>';}).join('');
 }
 mf425UpdateCount();}
function mf425UpdateCount(){const root=document.getElementById('mf425-scope');if(!root)return;const scope=mf425ScopeSnapshot(),counts=mf425Counts(scope);
 const target=root.querySelector('#mf425-scope-count');target.innerHTML=mf425Icon('images')+' <strong>'+counts.eligible.toLocaleString()+'</strong> missing covers eligible out of '+counts.all.toLocaleString()+' titles in scope.';
 const start=document.querySelector('#mf424-modal .mf424-actions .btn-primary');if(start){start.disabled=!counts.eligible;start.title=counts.eligible?'Start recovery for the selected scope':'No missing covers in this scope';}}
function mf425DecorateConfig(){const modal=document.getElementById('mf424-modal');if(!modal||modal.dataset.mf425Ready==='1')return;modal.dataset.mf425Ready='1';modal.classList.add('mf425-themed');
 const form=modal.querySelector('#mf424-config');if(!form)return;form.insertAdjacentHTML('afterbegin',mf425ScopeFields());
 const head=modal.querySelector('.mf424-heading small');if(head)head.textContent='COVER RECOVERY';
 const h=modal.querySelector('.mf424-heading h2');if(h)h.innerHTML=mf425Icon('images',24)+' Cover Recovery';
 const providerHeading=form.querySelector('h3');if(providerHeading)providerHeading.innerHTML=mf425Icon('database')+' 3. Cover providers & priorities';
 const options=form.querySelector('.mf424-options');if(options)options.insertAdjacentHTML('beforebegin','<h3 class="mf425-section-title">'+mf425Icon('settings')+' 2. Processing & matching</h3>');
 const footer=modal.querySelector('.mf424-actions');if(footer){for(const b of footer.querySelectorAll('button')){if(b.textContent.includes('Start Recovery'))b.innerHTML=mf425Icon('play')+' Start Recovery';else if(b.textContent.includes('Cancel'))b.innerHTML=mf425Icon('x')+' Cancel';}}
 for(const btn of modal.querySelectorAll('.mf424-provider-order button')){const up=btn.textContent.trim()==='↑';btn.innerHTML=mf425Icon(up?'chevronUp':'chevronDown',15);btn.setAttribute('aria-label',up?'Move provider up':'Move provider down');}
 mf425ScopeChange();}
const mf425OldConfig=App.mf424OpenConfig;
function mf425OpenConfig(entry='settings',id='') {if(entry==='editor'&&!id){showToast('Save this title before using a resumable recovery job. Instant Cover Search works with unsaved titles.');return;}MF425.startMode=mf425InitialScope(entry,id);mf425OldConfig();mf425DecorateConfig();}
App.mf424OpenConfig=()=>mf425OpenConfig('settings');App.mf425OpenConfig=mf425OpenConfig;
const mf425OldStart=App.mf424Start;
App.mf424Start=async function(){MF425.active=mf425ScopeSnapshot();const expected=mf425Counts(MF425.active);
 if(!expected.eligible){showToast('No missing covers in the selected scope.');return;}
 const result=await mf425OldStart.apply(this,arguments);
 if(MF424.job&&MF424.job.scope?.created===MF425.active.created){MF424.job.scopeLabel=MF425.active.label;await mf424SaveJob();}
 return result;};
App.mf425ScopeChange=mf425ScopeChange;App.mf425UpdateCount=mf425UpdateCount;

// Same Library selection on Normal and Dynamic Library; selected IDs are snapshotted.
function mf425LibraryButton(){return '<button type="button" class="btn btn-sm mf425-tools-button" onclick="App.mf425OpenConfig(\'library\')">'+mf425Icon('images')+' Fix missing covers</button>';}
const mf425OldLibrary=renderLibrary;
renderLibrary=function(){let h=String(mf425OldLibrary.apply(this,arguments)||'');if(h.includes('mf425-tools-button'))return h;
 const matcher=/(<button\b[^>]*onclick="App\.v69RepairSelectedCompleted\(\)"[^>]*>[\s\S]*?<\/button>)/;
 if(matcher.test(h))return h.replace(matcher,'$1'+mf425LibraryButton());
 const slot='<div class="lib-toolbar">';return h.includes(slot)?h.replace(slot,'<div class="mf425-library-tools">'+mf425LibraryButton()+'</div>'+slot):h;};

// Dashboard's existing validated paste/save UI stays untouched.
const mf425OldMissing=v192MissingCoversHtml;
v192MissingCoversHtml=function(){let h=String(mf425OldMissing.apply(this,arguments)||'');if(!h.includes('v192-cover-url-input'))return h;
 const btn='<button type="button" class="btn btn-ghost mf430-find-cover" onclick="App.mf425Instant(\'dashboard\')">'+mf425Icon('search')+' Find cover automatically</button>';
 return h.replace('<div class="v123-rating-actions v192-cover-actions">','<div class="v123-rating-actions v192-cover-actions">'+btn);};

// Preserve the established fast cover picker and improve its entire contrast layer.
const mf425OldPicker=coverPickerModalHtml;
coverPickerModalHtml=function(data){const h=String(mf425OldPicker.apply(this,arguments)||'');return '<div class="mf425-legacy-picker"><p class="mf425-picker-explain">'+mf425Icon('shield')+' Compare the matched title, source and media type before choosing. The selected cover URL is not saved until you confirm the title.</p>'+h+'</div>';};

// Keep Find Cover Automatically in Add/Edit Title; advanced jobs remain available in Library and Settings.
const mf425OldEditor=libraryModalHtml;
libraryModalHtml=function(data){let h=String(mf425OldEditor.apply(this,arguments)||'');if(!h||h.includes('mf425-editor-tools'))return h;
 const extra=h.includes('Find cover automatically')?'':'<button type="button" class="btn btn-ghost" onclick="App.mf425Instant(\'editor\')">'+mf425Icon('search')+' Find cover automatically</button>';
 const controls=extra?'<div class="mf425-editor-tools">'+extra+'</div>':'';
 const marker='</div>';const coverLabel=/(<label[^>]*>\s*(?:Cover art|Cover URL|Cover image)\s*<\/label>)/i;
 if(coverLabel.test(h))h=h.replace(coverLabel,'$1'+controls);
 else h=h.replace(/(<div class="modal-title">[^<]*<\/div>)/,'$1'+controls);
 return h;};

function mf425DraftItem(entry){const d=S.modal?.data||{},existing=entry==='dashboard'?v192CurrentMissingCoverItem():entry==='details'?mf424Lookup(MF425.oneId):mf424Lookup(d.id);
 const title=entry==='dashboard'?existing?.title:document.querySelector('#l-title')?.value||d.title||existing?.title;
 const categoryId=entry==='dashboard'?existing?.categoryId:document.querySelector('#l-category')?.value||d.categoryId||existing?.categoryId;
 const ids={...(existing?.externalIds||{}),...(d.externalIds||{})};
 document.querySelectorAll('[data-v377-id]').forEach(el=>{if(el.value.trim())ids[el.dataset.v377Id]=el.value.trim();});
 return {id:existing?.id||'draft',title:String(title||'').trim(),categoryId,status:existing?.status||d.status||'planned',year:existing?.year||d.year,externalIds:ids,total:existing?.total||d.total};}
function mf425IdText(item,provider,candidate){const ids=item.externalIds||{};const keys={tenrai:'mal',jikan:'mal',anilist:'anilist',kitsu:'kitsu',tvmaze:'imdb',mangadex:'mangadex',openlibrary:'isbn',googlebooks:'isbn'};
 const k=keys[provider];let value=ids[k]||(provider==='anilist'?ids.mal:null);const saved=value?(k==='mal'?'MAL':k.toUpperCase())+' ID: '+String(value):'';const found=candidate?.recordId?'Provider record ID: '+String(candidate.recordId):'';return [saved,found].filter(Boolean).join(' · ')||'Identified by title / metadata';}
async function mf425Instant(entry){if(MF425.quickBusy)return;MF425.quickBusy=true;MF425.draft=mf425DraftItem(entry);
 const item=MF425.draft;if(!item.title){MF425.quickBusy=false;showToast('Enter the title before searching for artwork.');return;}
 document.getElementById('mf425-instant-modal')?.remove();
 const root=document.createElement('div');root.id='mf425-instant-modal';root.className='mf424-modal mf425-themed mf425-instant-modal';
 const availableProviders=mf424Order(item),activeProvider=MF425.providerPick||'';
 root.innerHTML='<div class="mf424-shade" onclick="App.mf425CloseInstant()"></div><section class="mf424-dialog" role="dialog" aria-modal="true" aria-label="Instant cover search"><header class="mf425-instant-head"><div><small>INSTANT COVER SEARCH</small><h2>'+mf425Icon('search')+' Cover matches for '+mf425Esc(item.title)+'</h2><p>Library title: <strong>'+mf425Esc(item.title)+'</strong> · IDs checked first · no automatic replacements</p></div><button type="button" class="btn btn-ghost" onclick="App.mf425CloseInstant()">'+mf425Icon('x')+' Close</button></header><div class="mf425-instant-provider-picker" style="display:flex;flex-wrap:wrap;align-items:end;gap:8px;margin:12px 0"><label style="flex:1;min-width:180px">Search source<select id="mf425-source-choice" class="mf425-source-choice"><option value="">All enabled providers</option>'+availableProviders.map(p=>'<option value="'+mf425Esc(p)+'" '+(activeProvider===p?'selected':'')+'>'+mf425Esc(mf424Provider(p)?.name||p)+'</option>').join('')+'</select></label><button type="button" class="btn btn-ghost" onclick="App.mf425RetryProvider()">Search selected source</button></div><div id="mf425-instant-results" class="mf425-instant-results" role="status" aria-live="polite"><div class="mf425-loading">'+mf425Icon('database')+' Checking enabled cover providers safely…</div></div><div class="mf424-actions"><button type="button" class="btn btn-ghost" onclick="App.mf425CloseInstant()">Cancel</button></div></section>';
 document.body.append(root);
 const found=[],seen=new Set(),ordered=availableProviders.filter(p=>!activeProvider||p===activeProvider),outcomes=[];const byId=ordered.filter(p=>mf424HasID(item,p)),rest=ordered.filter(p=>!mf424HasID(item,p));
 try{for(const provider of byId.concat(rest)){
  if(!root.isConnected)break;
  let count=0,matched=0,failed='';
  try{const candidates=await mf424Discover(item,provider);matched=candidates.length;
   for(const c of candidates){if(!c||c.confidence<.55||seen.has(c.url))continue;seen.add(c.url);if(await mf424Image(c.url,c.provider)){found.push(c);count++;MF425.quick={candidates:found};}}}
  catch(e){failed=String(e?.message||e).slice(0,120);console.warn('v425 quick cover provider',provider,e);}
  outcomes.push({name:mf424Provider(provider)?.name||provider,count,matched,failed});
  const display=root.querySelector('#mf425-instant-results');if(display)display.innerHTML=mf425CandidatesHtml(found,item)+mf425ProviderStatuses(outcomes);
  if(found.length>=16)break;
 }}finally{const display=root.querySelector('#mf425-instant-results');if(display)display.innerHTML=mf425CandidatesHtml(found,item)+mf425ProviderStatuses(outcomes);MF425.quickBusy=false;}
}
function mf425ProviderStatuses(rows){return '<details open><summary>Provider results ('+rows.length+' checked)</summary><div class="mf424-note" role="status">'+rows.map(x=>'<div><strong>'+mf425Esc(x.name)+'</strong>: '+(x.failed?'Unavailable — '+mf425Esc(x.failed):x.count?x.count+' verified image'+(x.count===1?'':'s'):x.matched?'Records found but artwork could not be validated':'No matching record for this title')+'</div>').join('')+'</div></details>';}
function mf425RetryProvider(){if(MF425.quickBusy){showToast('Cover search is still checking its current sources.');return;}
 const chosen=document.getElementById('mf425-source-choice')?.value||'';
 if(chosen&&!mf424Order(MF425.draft||{}).includes(chosen)){showToast('This provider is not available for the selected media type.');return;}
 MF425.providerPick=chosen;return mf425Instant(MF425.quickEntry||'editor');}
function mf425CandidatesHtml(found,item){if(!found.length)return '<div class="mf425-no-results">No validated candidates yet. Try a different enabled provider or paste a cover URL.</div>';
 return '<div class="mf425-found-count">'+found.length+' verified-loading image candidates · choose the correct title and edition</div><div class="mf425-candidate-grid">'+found.map((c,i)=>{
 const id=mf425IdText(item,c.provider,c);return '<article class="mf425-candidate"><img src="'+mf425Esc(c.url)+'" alt="'+mf425Esc(c.title||item.title)+' poster" loading="lazy"><div class="mf425-candidate-copy"><strong>'+mf425Esc(c.title||'Untitled provider record')+'</strong><small>Library: '+mf425Esc(item.title)+'</small><span class="mf425-source">'+mf425Icon('database')+' '+mf425Esc(c.provider)+'</span><small>'+mf425Esc(id)+'</small><small>'+mf425Esc(c.reason||'Title match')+'</small>'+(c.recordUrl?'<a href="'+mf425Esc(c.recordUrl)+'" target="_blank" rel="noopener noreferrer">'+mf425Icon('external')+' Provider record</a>':'')+mf424CoverIdControl(item,c,i,'mf425')+'<button class="btn btn-primary" onclick="App.mf425ChooseInstant('+i+')">'+mf425Icon('check')+' Use this cover</button></div></article>';
 }).join('')+'</div>';}
// Only validated, visible candidates are selectable, in precisely the displayed order.
async function mf425ChooseInstant(index){const candidate=MF425.quick?.candidates?.[Number(index)];if(!candidate){showToast('This cover result is no longer available. Retry the search.');return;}
 const entry=MF425.quickEntry||MF425.quickSource||'editor';const url=candidate.url;
 if(entry==='dashboard'){
  const input=document.getElementById('v192-cover-url-input');if(input){input.value=url;App.v235ValidateMissingCover?.(url);showToast('Cover selected. Confirm Save cover & Next to earn XP.');}
 }else{
  const quick=entry==='details'?document.getElementById('v181-quick-value'):null;
  if(quick){quick.value=url;quick.dispatchEvent(new Event('input',{bubbles:true}));showToast('Cover selected. Press Save to apply the cover and earn XP.');mf425CloseInstant();return;}
  const all=[...document.querySelectorAll('#modal-root input')];const input=all.find(x=>/cover|image/i.test(x.id+' '+x.placeholder)&&x.type!=='file');
  if(input){input.value=url;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));showToast('Cover selected. Save the title to apply it and earn XP.');}
  else if(MF425.draft?.id&&MF425.draft.id!=='draft'){
    const item=mf424Lookup(MF425.draft.id);if(item&&(!item.coverUrl||await mf444Confirm('Replace existing cover?', 'You can replace this title’s current artwork with the selected validated cover. Other title data remains unchanged.', 'Use Cover', false, 1, 'cover'))){const previous=String(item.coverUrl||'');item.coverUrl=url;item.coverSource='manual:instant:'+candidate.provider;item.modifiedAt=Date.now();mf425Credit(item,previous,url,'instant');saveState();render();}
  }
 }
 mf425CloseInstant();}
function mf425CloseInstant(){document.getElementById('mf425-instant-modal')?.remove();MF425.quick=null;MF425.quickBusy=false;}
function mf425InstantAdvanced(){const entry=MF425.quickEntry||'editor',id=MF425.draft?.id==='draft'?'':MF425.draft?.id||'';mf425CloseInstant();mf425OpenConfig(entry,id);}
App.mf425Instant=function(entry){MF425.quick=null;MF425.quickEntry=entry;MF425.providerPick='';return mf425Instant(entry);};
Object.assign(App,{mf425ChooseInstant,mf425CloseInstant,mf425InstantAdvanced,mf425RetryProvider});

// The Title Details Quick Cover URL editor only offers Find Cover Automatically.
const mf425OldOpenQuick=App.v181QuickEditDetail;
App.v181QuickEditDetail=function(id,key){const result=mf425OldOpenQuick.apply(this,arguments);if(key!=='coverUrl')return result;
 const field=document.querySelector('#v181-quick-detail-overlay .field');if(!field)return result;
 MF425.oneId=String(id);
 field.insertAdjacentHTML('afterend','<div class="mf425-editor-tools"><button type="button" class="btn btn-ghost" onclick="App.mf425Instant(\'details\')">'+mf425Icon('search')+' Find cover automatically</button></div>');
 return result;};
const mf425OldSaveQuick=App.v181SaveQuickDetail;
App.v181SaveQuickDetail=function(id,key){if(key!=='coverUrl')return mf425OldSaveQuick.apply(this,arguments);
 const item=mf424Lookup(id),before=String(item?.coverUrl||'');const result=mf425OldSaveQuick.apply(this,arguments);
 if(item&&item.coverUrl&&String(item.coverUrl)!==before){mf425Credit(item,before,item.coverUrl,'quick detail editor');Promise.resolve(result).then(()=>saveState()).catch(e=>console.warn('v425 quick cover XP save',e));}
 return result;};

// One XP event per real cover change (no quota-once-per-title); existing XP
// history, snapshot and sync merge already support v348 action events.
DEFAULT_SETTINGS.leveling.coverChangeXP=Number(DEFAULT_SETTINGS.leveling.manualCoverXP)||15;
function mf425Credit(item,before,after,source){if(!item?.id||!after||String(before||'')===String(after||''))return 0;
 if(S.settings?.leveling?.enabled===false)return 0;
 S.settings=S.settings||DEFAULT_SETTINGS;S.settings.leveling=S.settings.leveling||{};
 if(!Number.isFinite(Number(S.settings.leveling.coverChangeXP)))S.settings.leveling.coverChangeXP=Math.max(1,Number(S.settings.leveling.manualCoverXP)||15);
 const count=Math.max(0,Math.round(Number(S.settings.leveling.coverChangeXP)));
 // An explicit zero is a user-configured reward, not a reason to fabricate XP.
 if(!count)return 0;
 const xp=v348Award('coverChangeXP',1,{description:source+' · cover changed for '+cleanTitle(item.title||''),subjectId:String(item.id)});
 MF425.lastAward.set(String(item.id),{url:String(after),time:Date.now(),xp});
 if(MF424.job&&MF424.job.account===mf424Account())MF424.job.xpEarned=(Number(MF424.job.xpEarned)||0)+xp;
 return xp;
}
const mf425OldSourceLabel=v348SourceLabel;
v348SourceLabel=function(kind){return kind==='coverChangeXP'?'Library · cover updated':mf425OldSourceLabel.apply(this,arguments);};
// Replace legacy once-per-title manual-cover bonus for *future* changes only.
// Previous rewards in manualCovers are preserved, never retroactively modified.
v44AwardManualCoverXP=function(id){const item=mf424Lookup(id);return mf425Credit(item,'',String(item?.coverUrl||''),'manual');};
// Other native editor paths can update coverUrl without calling v44; avoid
// double XP if the underlying saver already invoked our manual award.
const mf425OldSaveEditor=App.saveLibraryModal;
App.saveLibraryModal=function(id){const before=String((S.library||[]).find(i=>String(i?.id)===String(id))?.coverUrl||'');const beforeAward=MF425.lastAward.get(String(id))?.time||0;
 const result=mf425OldSaveEditor.apply(this,arguments);const item=String(id)?mf424Lookup(id):(S.library||[]).at(-1);
 if(item&&String(item.coverUrl||'')!==before){const credit=MF425.lastAward.get(String(item.id));
  if(!(credit&&credit.url===String(item.coverUrl||'')&&credit.time>=beforeAward)){
   mf425Credit(item,before,item.coverUrl,'title editor');Promise.resolve(result).then(()=>saveState()).catch(e=>console.warn('v425 XP save',e));
  }
 }
 return result;};

// The old v424 job applies cover URLs only after two checks; v425 awards XP
// in the same protected saveState snapshot (hook inserted into v424 source).
function mf425CreditRecoveredCover(item,oldUrl,newUrl,provider){return mf425Credit(item,oldUrl,newUrl,'auto:'+provider);}

// A floating control should not exist until a job has actually begun.
const mf425OldPaint=mf424Paint;
mf424Paint=function(){let root=document.getElementById('mf424-indicator');const job=MF424.job;
 if(!job||MF425.hidden===job.id){root?.remove();return;}
 mf425OldPaint();root=document.getElementById('mf424-indicator');if(!root)return;root.classList.add('mf425-themed');
 const pill=root.querySelector('.mf424-pill');if(pill){const symbol=pill.querySelector(':scope > span:first-child');if(symbol)symbol.innerHTML=mf425Icon('images',19);}
 const fly=root.querySelector('.mf424-flyout');if(!fly)return;
 if(!fly.querySelector('.mf425-flyout-header'))fly.insertAdjacentHTML('afterbegin','<div class="mf425-flyout-header"><strong>'+mf425Icon('images')+' Cover Recovery</strong><button class="mf425-dismiss" type="button" aria-label="Dismiss recovery indicator" onclick="App.mf425Dismiss()">'+mf425Icon('x')+'</button></div>');
 const scope=job.scopeLabel||job.scope?.label;if(scope)fly.insertAdjacentHTML('afterbegin','<div class="mf425-active-scope">'+mf425Icon('layers')+' Scope: '+mf425Esc(scope)+'</div>');
 const stats=fly.querySelector('.mf424-stats');if(stats)stats.insertAdjacentHTML('beforeend','<span class="mf425-xp-stat">'+mf425Icon('spark')+' XP Earned <b>'+(Number(job.xpEarned)||0).toLocaleString()+'</b></span>');
 const mapping=[[/New Recovery/i,'images'],[/Continue|Resume/i,'play'],[/Pause/i,'pause'],[/Stop after/i,'stop'],[/Finish part/i,'clock'],[/Review/i,'search'],[/JSON|CSV/i,'download'],[/Retry/i,'retry']];
 fly.querySelectorAll('.mf424-controls button').forEach(btn=>{const icon=mapping.find(([pattern])=>pattern.test(btn.textContent))?.[1]||'settings';btn.innerHTML=mf425Icon(icon)+mf425Esc(btn.textContent.trim());});
};
function mf425Dismiss(){if(!MF424.job)return;if(!['stopped','complete','paused','waiting-review','waiting-part'].includes(MF424.job.status)){showToast('Pause or stop recovery before dismissing its active indicator.');return;}
 MF425.hidden=MF424.job.id;document.getElementById('mf424-indicator')?.remove();}
App.mf425Dismiss=mf425Dismiss;

// Semantic, single-icon navigation and support buttons. Existing profile and
// progression actions remain independent and fully functional.
function mf425CleanDock(){const progress=document.querySelector('.mf421-dock-progress');if(!progress)return;
 const badges=[...progress.querySelectorAll(':scope > .mf422-level-badge,:scope > .mf422-streak-badge')];if(badges.length===2){for(const child of [...progress.children])if(!badges.includes(child))child.remove();}
 progress.removeAttribute('data-icon');progress.querySelectorAll(':scope > svg,:scope > i,:scope > [data-lucide]').forEach(n=>n.remove());}
function mf425PolishSupport(){const iconByLabel=[[/Open MediaFlow/i,'external'],[/Donate on Ko-fi|Support on Ko-fi/i,'gift'],[/More possibilities/i,'spark'],[/Hosting & Storage/i,'cloud'],[/Ongoing improvements/i,'tools']];
 const nodes=document.querySelectorAll('.mf423-support-hero a,.mf423-support-benefits span,.mf423-donate-replacement,.mf423-support-cta');
 nodes.forEach(node=>{const text=String(node.textContent||'').replace(/[♥♡↗➚◉]/g,'').replace(/\s+/g,' ').trim();const match=iconByLabel.find(([rx])=>rx.test(text));if(!match)return;
 const label=/Donate on Ko-fi/i.test(text)?'Donate on Ko-fi':/Support on Ko-fi/i.test(text)?'Support on Ko-fi':/Open MediaFlow/i.test(text)?'Open MediaFlow':text;
 if(node.dataset.mf425Label===label&&node.querySelectorAll('svg').length===1)return;
 node.dataset.mf425Label=label;node.innerHTML=mf425Icon(match[1])+mf425Esc(label);});}
function mf425PolishDeferred(){if(MF425.observerPending)return;MF425.observerPending=true;queueMicrotask(()=>{MF425.observerPending=false;mf425CleanDock();mf425PolishSupport();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mf425PolishDeferred();const observer=new MutationObserver(mutations=>{
 if(mutations.some(m=>{const t=m.target;return t instanceof Element&&(t.closest('.mf421-dock,.mf423-support-hero,.mf423-donate-replacement')||t.matches('.mf421-dock,.mf423-support-hero,.mf423-donate-replacement'));}))mf425PolishDeferred();
 });observer.observe(document.body,{childList:true,subtree:true});},{once:true});else mf425PolishDeferred();

// Existing v365 Settings Center: inject a real Library subgroup, not a popup
// pretending to be settings. Preferences use S.settings and existing cloud sync.
function mf425SettingsMarkup(){const prefs=mf424Defaults(),xp=S.settings?.leveling?.coverChangeXP??DEFAULT_SETTINGS.leveling.coverChangeXP;
 const sources=MF424_PROVIDER_META.slice().sort((a,b)=>(prefs.priorities.indexOf(a.id)<0?999:prefs.priorities.indexOf(a.id))-(prefs.priorities.indexOf(b.id)<0?999:prefs.priorities.indexOf(b.id)));
 const providerUi='<fieldset class="mf430-settings-providers" data-mf-setting-id="cover-providers"><legend>'+mf425Icon('database')+' Cover providers & priority</legend><p class="mf425-settings-note">Every registered provider stays visible. Only providers with real working adapters and the required configuration can run. No API test is required. Your disabled sources stay disabled.</p><div class="mf430-settings-provider-list">'+sources.map(p=>'<div class="mf430-settings-provider" data-mf430-provider="'+mf425Esc(p.id)+'"><label><input type="checkbox" value="'+mf425Esc(p.id)+'" data-mf430-provider-enabled '+(prefs.enabled.includes(p.id)?'checked':'')+' onchange="App.mf430SaveSettingsProviders()"><span><strong>'+mf425Esc(p.name)+'</strong><small>'+mf425Esc(p.limit?(p.credentials?'Configured gateway · ready without testing':'Public adapter · ready without testing'):(p.credentials?'Credential or working adapter required':'Working adapter unavailable · listed for reference'))+'</small></span></label><div class="mf430-settings-provider-order"><button class="btn btn-ghost" type="button" onclick="App.mf430MoveSettingsProvider(\''+p.id+'\',-1)" title="Move '+mf425Esc(p.name)+' higher" aria-label="Move '+mf425Esc(p.name)+' higher">'+mf425Icon('chevronUp')+'</button><button class="btn btn-ghost" type="button" onclick="App.mf430MoveSettingsProvider(\''+p.id+'\',1)" title="Move '+mf425Esc(p.name)+' lower" aria-label="Move '+mf425Esc(p.name)+' lower">'+mf425Icon('chevronDown')+'</button></div></div>').join('')+'</div></fieldset>';
 const option=(v,label,current)=>'<option value="'+v+'" '+(v===current?'selected':'')+'>'+label+'</option>';
 return '<section class="mf425-settings-card" aria-label="Cover Recovery Settings"><div class="mf425-settings-lead">'+mf425Icon('images',21)+'<div><strong>Recovery preferences</strong><p>Default processing, providers, background recovery and XP rewards.</p></div></div>'+ 
 '<div class="mf425-settings-grid"><label data-mf-setting-id="cover-mode">Recovery mode<select onchange="App.mf425SavePref(\'mode\',this.value)">'+option('parts','Part-by-Part',prefs.mode)+option('one','One-Go',prefs.mode)+'</select></label>'+ 
 '<label data-mf-setting-id="cover-part-size">Titles per part<input type="number" min="1" max="10000" value="'+Number(prefs.partSize||100)+'" onchange="App.mf425SavePref(\'partSize\',this.value)"></label>'+ 
 '<label data-mf-setting-id="cover-continuation">Continuation<select onchange="App.mf425SavePref(\'continuation\',this.value)">'+option('automatic','Automatic',prefs.continuation)+option('manual','Manual',prefs.continuation)+'</select></label>'+ 
 '<label data-mf-setting-id="cover-selection">Cover selection<select onchange="App.mf425SavePref(\'selection\',this.value)">'+option('hybrid','Hybrid',prefs.selection)+option('smart','Smart Automatic',prefs.selection)+option('priority','Provider Priority',prefs.selection)+option('manual','Manual Selection',prefs.selection)+'</select></label>'+ 
 '<label data-mf-setting-id="cover-protection">Rate-limit protection<select onchange="App.mf425SavePref(\'protection\',this.value)">'+option('safe','Safe',prefs.protection)+option('balanced','Balanced',prefs.protection)+option('custom','Custom',prefs.protection)+'</select></label>'+ 
 '<label data-mf-setting-id="cover-xp">Cover XP per changed URL<input type="number" min="0" max="100000" value="'+Number(xp)+'" onchange="App.mf425SaveCoverXP(this.value)"></label></div>'+ 
 '<label class="mf425-settings-check" data-mf-setting-id="cover-auto-resume"><input type="checkbox" '+(prefs.autoResume?'checked':'')+' onchange="App.mf425SavePref(\'autoResume\',this.checked)"> Resume background recovery when MediaFlow reopens</label>'+ 
 '<label class="mf425-settings-check mf430-settings-auto" data-mf-setting-id="cover-dashboard-auto"><input type="checkbox" '+(S.settings?.v430MissingCoversAutoSave?'checked':'')+' onchange="App.mf430SetMissingAutoSave(this.checked)"><span><strong>Automatically save valid cover URL & go next</strong><small>Dashboard Missing Covers · validated pasted or selected URLs save automatically. Unselected search results must pass unique ID verification.</small></span></label>'+
 providerUi+
 '<p class="mf425-settings-note">A saved cover change earns XP whether manual or automatic. Previews, retries, unchanged URLs and cloud sync do not award XP again. Provider limits remain enforced.</p>'+ 
 '<div class="mf425-settings-actions"><button type="button" class="btn btn-primary" onclick="App.mf425OpenConfig(\'settings\')">'+mf425Icon('settings')+' Configure & Start Recovery</button></div></section>';}
function mf425SettingsEnhance(){
 if(S.view!=='settings')return;
 const center=window.MediaFlowSettingsCenter;
 if(!center?.mountSection)return;
 // Use the very same Settings Center component, registry and styles as
 // Library Integrity / Library Maintenance (header, caret, Pin, search).
 // Never inject a custom accordion or a separate Cover Recovery subgroup.
 if(document.querySelector('.mf365-section[data-mf365-section="v221-settings-cover-recovery"]'))return;
 const reg=window.MediaFlowSettingsRegistry;
 if(reg?.registerSetting){
   for(const [id,label,keywords] of [
     ['cover-mode','Recovery mode','batch processing'],
     ['cover-part-size','Titles per part','batch size'],
     ['cover-continuation','Continuation','automatic manual'],
     ['cover-selection','Cover selection','hybrid priority manual'],
     ['cover-protection','Rate-limit protection','providers cooldown'],
     ['cover-xp','Cover XP per changed URL','leveling rewards'],
     ['cover-auto-resume','Resume background recovery','reopen resume'],
     ['cover-dashboard-auto','Dashboard Missing Covers automatic save','verified candidate auto next'],
     ['cover-providers','Enabled cover providers','priority enabled configuration'],
     ['cover-confirm','Confirm before applying a selected cover','review confirmation']
   ])reg.registerSetting({id,section:'v221-settings-cover-recovery',selector:'[data-mf-setting-id="'+id+'"]',label,keywords:[keywords]});
 }
 const body=document.createElement('div');body.className='mf425-settings-content';
 body.innerHTML=mf425SettingsMarkup();
 center.mountSection({
   id:'v221-settings-cover-recovery',
   title:'COVER RECOVERY',
   category:'library',
   subgroup:'Library maintenance',
   keywords:['cover','poster','artwork','recovery','providers','XP','background'],
   nodes:[body]
 });
}
MediaFlowRuntime.registerPageEnhancer('settings',mf425SettingsEnhance);
function mf430SaveSettingsProviders(){
 const root=document.querySelector('.mf430-settings-provider-list');if(!root)return;
 const inputs=[...root.querySelectorAll('[data-mf430-provider-enabled]')];
 const priorities=inputs.map(n=>n.value),enabled=inputs.filter(n=>n.checked).map(n=>n.value);
 S.settings=S.settings||{};
 S.settings.v424Covers={...mf424Defaults(),priorities,enabled};
 Promise.resolve(saveState()).catch(e=>console.warn('Cover recovery providers could not be saved',e));
}
function mf430MoveSettingsProvider(id,delta){
 const node=[...document.querySelectorAll('.mf430-settings-provider')].find(n=>n.dataset.mf430Provider===id);
 const sibling=delta<0?node?.previousElementSibling:node?.nextElementSibling;
 if(!node||!sibling)return;
 if(delta<0)node.parentElement.insertBefore(node,sibling);else node.parentElement.insertBefore(sibling,node);
 mf430SaveSettingsProviders();
}
Object.assign(App,{mf430SaveSettingsProviders,mf430MoveSettingsProvider});
function mf425SavePref(key,value){if(!['mode','partSize','continuation','selection','protection','autoResume'].includes(key))return;
 S.settings=S.settings||DEFAULT_SETTINGS;S.settings.v424Covers={...mf424Defaults(),[key]:key==='partSize'?Math.min(10000,Math.max(1,Number(value)||100)):value};saveState().catch(e=>console.warn('v425 settings',e));}
function mf425SaveCoverXP(value){const xp=Math.min(100000,Math.max(0,Math.round(Number(value)||0)));S.settings.leveling=S.settings.leveling||{};S.settings.leveling.coverChangeXP=xp;saveState().catch(e=>console.warn('v425 cover xp',e));}
Object.assign(App,{mf425SavePref,mf425SaveCoverXP});
MediaFlowRuntime.version=MF425_VERSION;
