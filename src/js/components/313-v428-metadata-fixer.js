/* MediaFlow v428 — conservative Metadata Fixer with single/bulk entry points.
   Public providers only. No credentials, cloud-schema changes or personal-field overwrites. */
(function(){
'use strict';
if(window.MediaFlowV428Metadata)return;
const M={job:null,ready:false,running:false,reviews:[],draft:null,modal:null,rate:{},stop:false,account:'',progress:{at:0,total:0},history:[]};
const account=()=>String((typeof AUTH_USER!=='undefined'&&AUTH_USER?.id)||'local');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const lookup=id=>(S.library||[]).find(i=>String(i?.id)===String(id));
const idSet=()=>typeof mf425Selection==='function'?mf425Selection():Object.keys(S.librarySelection||{}).filter(k=>S.librarySelection[k]);
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const fields=['description','genres','year','total'];
const safeIds=o=>o&&typeof o==='object'?o:{};
const schema={jikan:{requiresSetup:false,capabilities:['anime','manga']},tvmaze:{requiresSetup:false,capabilities:['tv']},openlibrary:{requiresSetup:false,capabilities:['books']}};
async function db(){return new Promise((done,fail)=>{if(!indexedDB){fail(Error('IndexedDB is required to preserve metadata jobs'));return;}const req=indexedDB.open('mediaflow-metadata-v428',1);req.onupgradeneeded=()=>req.result.createObjectStore('records');req.onerror=()=>fail(req.error);req.onsuccess=()=>done(req.result);});}
async function store(op,value){const d=await db();return new Promise((done,fail)=>{const tx=d.transaction('records',op==='get'?'readonly':'readwrite');const req=op==='get'?tx.objectStore('records').get('job:'+account()):tx.objectStore('records').put(value,'job:'+account());req.onerror=()=>fail(req.error);req.onsuccess=()=>done(req.result);tx.oncomplete=()=>d.close();});}
async function persist(){if(M.job)await store('put',M.job);window.MediaFlowV428Hub?.paint();}
function kind(item){const cat=String(item.categoryId||'').toLowerCase();const label=(S.categories||[]).find(c=>String(c.id)===cat)?.name||cat;
 const v=String(label).toLowerCase();return /manga|manhwa|manhua|comic/.test(v)?'manga':/anime/.test(v)?'anime':/series|television|tv/.test(v)?'tv':/book|novel/.test(v)?'books':'other';}
async function request(provider,url){const row=M.rate[provider]||(M.rate[provider]={next:0,cooldown:0});
 const wait=Math.max(0,row.next-Date.now(),row.cooldown-Date.now());if(wait)await sleep(wait);
 row.next=Date.now()+(provider==='jikan'?2500:1300);
 for(let attempt=0;attempt<3;attempt++){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
  try{const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(r.ok)return r.json();
   if(r.status===429||r.status===503){const raw=Number(r.headers.get('Retry-After'));row.cooldown=Date.now()+(Number.isFinite(raw)&&raw>0?Math.min(300000,raw*1000):Math.min(300000,30000*(attempt+1)));await sleep(Math.max(0,row.cooldown-Date.now()));continue;}
   if(r.status===404)return null;
   throw Error(provider+' HTTP '+r.status);
  }finally{clearTimeout(timeout);}
 }
 throw Error(provider+' could not recover after rate limiting');
}
function cleanHtml(t){const div=document.createElement('div');div.innerHTML=String(t||'').replace(/<script[\s\S]*?<\/script>/gi,'');return String(div.textContent||'').trim().slice(0,5000);}
function mapJikan(src,type){return {title:src?.title||'',description:src?.synopsis||'',genres:(src?.genres||[]).map(g=>g.name).filter(Boolean),year:Number(src?.year)||(Number(String(src?.published?.from||src?.aired?.from||'').slice(0,4))||0),total:Number(type==='manga'?src?.chapters:src?.episodes)||0,source:'Jikan',url:src?.url||'',recordId:src?.mal_id};}
async function discover(item){
 const t=kind(item),ids=safeIds(item.externalIds),title=String(item.title||'').trim();if(!title)return {reason:'Title is missing'};
 if(t==='anime'||t==='manga'){
  const isManga=t==='manga',prefix=isManga?'manga':'anime',mal=ids.mal||item.malId;
  if(mal&&/^\d+$/.test(String(mal))){const data=await request('jikan','https://api.jikan.moe/v4/'+prefix+'/'+encodeURIComponent(mal)+'/full');
    if(data?.data){const d=mapJikan(data.data,t);if(norm(d.title)===norm(title)||[data.data.title_english,data.data.title_japanese,...(data.data.title_synonyms||[])].some(t=>norm(t)===norm(title)))return d;return {reason:'MAL record title does not match; review manually'};}}
  const search=await request('jikan','https://api.jikan.moe/v4/'+prefix+'?q='+encodeURIComponent(title)+'&limit=5');
  const exact=(search?.data||[]).filter(v=>[v.title,v.title_english,v.title_japanese,...(v.title_synonyms||[])].some(n=>norm(n)===norm(title)));
  if(exact.length===1)return mapJikan(exact[0],t);
  return {reason:exact.length>1?'Ambiguous Jikan title; no automatic match':'No exact title match'};
 }
 if(t==='tv'){
  const tm=String(ids.tvmaze||'').trim(),imdb=String(ids.imdb||'').trim();
  const path=tm&&/^\d+$/.test(tm)?'https://api.tvmaze.com/shows/'+tm:imdb?'https://api.tvmaze.com/lookup/shows?imdb='+encodeURIComponent(imdb):'';
  let d=path?await request('tvmaze',path):null;
  if(!d){const list=await request('tvmaze','https://api.tvmaze.com/search/shows?q='+encodeURIComponent(title));const exact=(list||[]).map(x=>x.show).filter(x=>norm(x?.name)===norm(title));if(exact.length!==1)return {reason:'No unique TVmaze match'};d=exact[0];}
  return {title:d.name||'',description:cleanHtml(d.summary),genres:d.genres||[],year:Number(String(d.premiered||'').slice(0,4))||0,total:0,source:'TVmaze',url:d.url||'',recordId:d.id};
 }
 if(t==='books'&&ids.isbn){
  const d=await request('openlibrary','https://openlibrary.org/isbn/'+encodeURIComponent(ids.isbn)+'.json');
  if(d)return {title:d.title||'',description:typeof d.description==='string'?d.description:d.description?.value||'',genres:d.subjects||[],year:Number(String(d.publish_date||'').match(/\d{4}/)?.[0])||0,total:0,source:'Open Library',url:'https://openlibrary.org'+String(d.key||''),recordId:d.key};
 }
 return {reason:'No compatible configured public provider or verified ID for this category'};
}
function diff(item,result){if(!result||!result.source)return [];
 const entries=[];
 for(const f of fields){const found=result[f],old=item[f];if(found==null||found===''||Array.isArray(found)&&!found.length||f==='total'&&item.seasons?.length)continue;
  const equal=JSON.stringify(old??null)===JSON.stringify(found);
  if(equal)continue;
  const oldMissing=old==null||old===''||Array.isArray(old)&&!old.length||(f==='total'&&Number(old)===0);
  entries.push({field:f,old,found:typeof old==='string'&&Array.isArray(found)?found.join(', '):found,selected:oldMissing});}
 return entries;
}
async function init(){if(M.initPromise)return M.initPromise;M.initPromise=(async()=>{M.account=account();try{const old=await store('get');if(old?.account===account()){M.job=old;if(['running','ready','cooldown'].includes(old.status)){M.job.status='paused';await persist();}}}catch(e){console.warn('Metadata recovery storage unavailable',e);}M.ready=true;window.MediaFlowV428Hub?.paint();})();return M.initPromise;}
function draftItem(entry,id){const saved=lookup(id||S.modal?.data?.id);if(saved)return {...saved};
 const d=S.modal?.data||{};return {...d,id:'',title:document.getElementById('l-title')?.value||d.title||'',categoryId:document.getElementById('l-category')?.value||d.categoryId||'',externalIds:{...(d.externalIds||{})}};}
function close(){document.getElementById('mf428-metadata-modal')?.remove();}
function open(entry='settings',id=''){
 close();const one=id?lookup(id):entry==='editor'?draftItem(entry,id):null;
 const selection=entry==='library'?idSet().map(String).filter(id=>lookup(id)):null;
 M.draft=one&&!one.id?one:null;
 const parent=document.createElement('div');parent.id='mf428-metadata-modal';parent.className='mf428-metadata-overlay';
 const label=one?'This Title':selection?.length?'Selected '+selection.length+' Titles':'All Library';
 parent.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428MetadataClose()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true" aria-label="Fix Metadata"><header><div><small>LIBRARY MAINTENANCE</small><h2>Fix Metadata</h2><p>Find verified data, compare fields, and preserve manual information.</p></div><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataClose()">Close</button></header>'+
 '<div class="mf428-meta-config"><label>Recovery scope<select id="mf428-meta-scope" '+(one||selection?.length?'disabled':'')+'><option value="'+(one?'single':selection?.length?'selected':'all')+'">'+esc(label)+'</option></select></label><label>Method<select id="mf428-meta-method"><option value="missing">Fill Missing Fields</option><option value="review">Review All Differences</option></select></label><label>Part size<input id="mf428-meta-part" type="number" min="1" max="1000" value="100"></label></div>'+
 '<div class="mf428-meta-note">A verified provider record is needed before any change. Personal ratings, progress, status, seasons and notes are never modified. Manual changes require approval.</div><footer><button type="button" class="btn btn-primary" onclick="App.mf428MetadataStart(\''+esc(entry)+'\',\''+esc(id)+'\')">Find Metadata</button></footer></section>';
 document.body.appendChild(parent);parent.querySelector('.mf428-meta-dialog button')?.focus();
}
async function start(entry,id){const item=id?lookup(id):entry==='editor'?draftItem(entry,id):null,selected=entry==='library'?idSet().map(String).filter(id=>lookup(id)):null;
 const part=Math.max(1,Math.min(1000,Number(document.getElementById('mf428-meta-part')?.value)||100));
 const method=document.getElementById('mf428-meta-method')?.value||'missing';
 if(item&&!item.id){close();showToast('Searching metadata for the unsaved title draft…');await previewDraft(item);return;}
 const ids=item?[String(item.id)]:selected?.length?selected:(S.library||[]).filter(i=>i?.id).map(i=>String(i.id));
 if(!ids.length){showToast('No eligible Library titles.');return;}
 if(M.job&&!['complete','stopped','failed'].includes(M.job.status)){showToast('A Metadata Recovery already exists. Pause or finish it before replacing its queue.');return;}
 M.job={account:account(),ids,cursor:0,part,method,status:'queued',reviews:[],completed:0,skipped:0,errors:[],created:Date.now(),paused:false,stopped:false};
 await persist();close();if(!window.MediaFlowV428Hub?.enqueue('metadata',{}))showToast('Metadata Recovery is already queued.');
}
async function previewDraft(item){try{const data=await discover(item);if(!data.source){showToast(data.reason||'No source record');return;}M.reviews=[{draft:true,itemId:'',item,found:data,differences:diff(item,data),version:0}];renderReview();}catch(e){showToast('Metadata lookup failed: '+String(e.message||e));}}
async function worker(){await init();const job=M.job;if(!job||job.account!==account())return;
 job.status='running';M.running=true;await persist();
 try{let processed=0;while(job.cursor<job.ids.length){
  if(job.paused||job.stopped||job.account!==account()||!window.MediaFlowV428Hub?.ownsLease()){job.status=job.stopped?'stopped':'paused';break;}
  const id=job.ids[job.cursor],item=lookup(id);if(item){const version=Number(item.modifiedAt)||0;
   try{const found=await discover({...item});if(found.source){const differences=diff(item,found).filter(d=>job.method==='review'||d.selected);
    if(differences.length){job.reviews.push({itemId:id,version,found,differences});}else job.skipped++;
   }else job.skipped++;}catch(e){job.errors.push({id,reason:String(e.message||e)});}}
  job.cursor++;processed++;await persist();
  if(job.reviews.length>=250){job.status='waiting-review';break;}
  if(processed>=job.part&&job.cursor<job.ids.length){job.status='waiting-part';break;}
 }
 if(job.cursor>=job.ids.length)job.status=job.reviews.length?'waiting-review':'complete';
 await persist();
 }catch(e){job.status='paused';job.errors.push({id:'job',reason:String(e.message||e)});await persist();throw e;}
 finally{M.running=false;window.MediaFlowV428Hub?.paint();if(job.reviews.length)showToast(job.reviews.length+' metadata titles ready for review.');}
}
function review(){if(!M.job?.reviews?.length){showToast('No metadata changes waiting for review.');return;}M.reviews=M.job.reviews;renderReview();}
function renderReview(){document.getElementById('mf428-meta-review')?.remove();const current=M.reviews[0];if(!current)return;
 const root=document.createElement('div');root.id='mf428-meta-review';root.className='mf428-metadata-overlay';
 const rows=current.differences.map((d,i)=>'<label class="mf428-diff"><input type="checkbox" data-index="'+i+'" '+(d.selected?'checked':'')+'><span><b>'+esc(d.field)+'</b><small>Current: '+esc(Array.isArray(d.old)?d.old.join(', '):d.old==null?'Missing':d.old).slice(0,240)+'</small><small>Found: '+esc(Array.isArray(d.found)?d.found.join(', '):d.found).slice(0,500)+'</small></span></label>').join('');
 root.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428MetadataCloseReview()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true"><header><div><small>METADATA · '+esc(current.found.source)+'</small><h2>'+esc(current.item?.title||lookup(current.itemId)?.title||'Title changed')+'</h2><p>Review before applying changes. '+M.reviews.length+' title(s) pending.</p></div><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataCloseReview()">Later</button></header><div class="mf428-diff-list">'+(rows||'<p>No safely editable metadata fields found.</p>')+'</div><footer><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataSkip()">Skip</button><button type="button" class="btn btn-primary" onclick="App.mf428MetadataApply()">Apply Selected</button></footer></section>';
 document.body.appendChild(root);
}
function closeReview(){document.getElementById('mf428-meta-review')?.remove();}
async function skip(){const same=M.job&&M.reviews===M.job.reviews;M.reviews.shift();if(same){if(!M.job.reviews.length&&M.job.cursor>=M.job.ids.length)M.job.status='complete';await persist();}closeReview();if(M.reviews.length)renderReview();}
async function apply(){
 const current=M.reviews[0],checked=[...document.querySelectorAll('#mf428-meta-review [data-index]:checked')].map(x=>Number(x.dataset.index));
 if(!current||!checked.length){showToast('Select at least one field, or skip this result.');return;}
 const item=current.draft?null:lookup(current.itemId);
 if(!current.draft&&(!item||Number(item.modifiedAt||0)!==Number(current.version))){showToast('Title changed since lookup. Recheck metadata before applying.');return;}
 if(!current.draft&&account()!==M.job?.account){showToast('Account changed. No metadata saved.');return;}
 const selected=checked.map(i=>current.differences[i]).filter(Boolean);
 if(current.draft){let applied=0;for(const d of selected){
   const aliases={description:['l-description','l-synopsis'],total:['l-total'],year:['l-year'],genres:['l-genres']};
   const el=(aliases[d.field]||[]).map(id=>document.getElementById(id)).find(Boolean);
   if(el){el.value=Array.isArray(d.found)?d.found.join(', '):String(d.found);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));applied++;}}
   showToast(applied?'Metadata added to unsaved draft. Save title when ready.':'No matching editable draft fields. Nothing changed.');
 }else{
  const previous={};for(const d of selected){previous[d.field]=item[d.field];item[d.field]=d.found;}
  const oldStamp=item.modifiedAt;item.modifiedAt=Date.now();
  try{if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();await saveState();
   const record={id:item.id,title:item.title,fields:selected.map(d=>d.field),previous,changedAt:item.modifiedAt,source:current.found.source};M.history.push(record);if(M.history.length>100)M.history.shift();
   try{localStorage.setItem('mf428-metadata-history:'+account(),JSON.stringify(M.history));}catch(_){}
   if(M.job)M.job.completed++;showToast('Metadata saved for '+String(item.title||'title'));
  }catch(e){for(const d of selected){if(previous[d.field]===undefined)delete item[d.field];else item[d.field]=previous[d.field];}item.modifiedAt=oldStamp;showToast('Save failed; metadata restored.');return;}
 }
 await skip();window.MediaFlowV428Hub?.paint();
}
function control(cmd){if(!M.job)return;if(cmd==='pause'||cmd==='stop'){M.job[cmd==='pause'?'paused':'stopped']=true;persist();}if(cmd==='review')review();
 if(cmd==='resume'&&['paused','waiting-part','waiting-review'].includes(M.job.status)){M.job.paused=false;M.job.stopped=false;M.job.status='queued';persist().then(()=>window.MediaFlowV428Hub?.enqueue('metadata',{}));}}
function injectEditor(html){if(!html||html.includes('mf428-edit-action'))return html;const at=html.indexOf('class="mf425-editor-tools"');if(at<0)return html;const close=html.indexOf('</div>',at);if(close<0)return html;
 return html.slice(0,close)+'<button type="button" class="btn btn-ghost mf428-edit-action" onclick="App.mf428MetadataOpen(\'editor\',String(S.modal?.data?.id||\'\'))">Fix Metadata</button>'+html.slice(close);}
if(typeof libraryModalHtml==='function'){const prior=libraryModalHtml;libraryModalHtml=function(){return injectEditor(String(prior.apply(this,arguments)||''));};}
if(typeof renderLibrary==='function'){const previous=renderLibrary;renderLibrary=function(){let html=String(previous.apply(this,arguments)||'');if(html.includes('mf428-library-metadata'))return html;const match=/class="[^"]*\bmf425-tools-button\b[^"]*"/.exec(html);if(!match)return html;let at=match.index;const end=html.indexOf('</button>',at);if(end<0)return html;at=end+9;return html.slice(0,at)+'<button type="button" class="btn btn-sm mf428-library-metadata" onclick="App.mf428MetadataOpen(\'library\')">Fix Metadata</button>'+html.slice(at);};}
function enhanceSettings(){if(S.view!=='settings')return;const anchor=document.querySelector('.mf425-settings-group');if(!anchor||document.querySelector('.mf428-settings-group'))return;
 const el=document.createElement('div');el.className='mf366-subgroup mf428-settings-group';el.innerHTML='<h3 class="mf366-subgroup-heading">Metadata Recovery</h3><div class="mf366-subgroup-content"><section class="mf425-settings-card"><div class="mf425-settings-lead"><strong>Fix Metadata</strong><p>Recover incomplete title information with verified public providers. Review changes before saving.</p></div><div class="mf425-settings-actions"><button type="button" class="btn btn-primary" onclick="App.mf428MetadataOpen(\'settings\')">Configure & Start Metadata Recovery</button><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataReview()">Review Pending</button></div></section></div>';
 anchor.insertAdjacentElement('afterend',el);}
if(typeof MediaFlowRuntime!=='undefined'&&MediaFlowRuntime.registerPageEnhancer)MediaFlowRuntime.registerPageEnhancer('settings',enhanceSettings);
function enhanceDetails(){const root=document.querySelector('#modal-root');if(!root||!S.modal?.data?.id)return;const action=root.querySelector('[onclick*="v181QuickEditDetail"][onclick*="coverUrl"]');if(action&&!root.querySelector('.mf428-details-action')){const b=document.createElement('button');b.type='button';b.className='btn btn-sm mf428-details-action';b.textContent='Fix Metadata';b.addEventListener('click',()=>App.mf428MetadataOpen('details',String(S.modal.data.id)));action.insertAdjacentElement('afterend',b);}}
if(document.body){const watch=new MutationObserver(ms=>{if(ms.some(x=>x.target instanceof Element&&(x.target.closest('#modal-root')||x.target.id==='modal-root')))queueMicrotask(enhanceDetails);});watch.observe(document.body,{childList:true,subtree:true});queueMicrotask(enhanceDetails);}
if(typeof App.v181QuickEditDetail==='function'){const old=App.v181QuickEditDetail;App.v181QuickEditDetail=function(id,key){const result=old.apply(this,arguments);if(key==='coverUrl'){const el=document.querySelector('#v181-quick-detail-overlay .mf425-editor-tools');if(el&&!el.querySelector('.mf428-edit-action'))el.insertAdjacentHTML('beforeend','<button type="button" class="btn btn-ghost mf428-edit-action" onclick="App.mf428MetadataOpen(\'details\',\''+esc(id)+'\')">Fix Metadata</button>');}return result;};}
Object.assign(App,{mf428MetadataOpen:open,mf428MetadataClose:close,mf428MetadataStart:start,mf428MetadataControl:control,mf428MetadataReview:review,mf428MetadataCloseReview:closeReview,mf428MetadataSkip:skip,mf428MetadataApply:apply});
window.MediaFlowV428Metadata={progress:()=>M.job?{at:M.job.cursor||0,total:M.job.ids?.length||0}:{at:0,total:0},status:()=>M.job?.status||'idle',schema,review,open};
window.MediaFlowV428Hub?.registerMetadata(worker);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();