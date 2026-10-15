/* MediaFlow v428 — conservative Metadata Fixer with single/bulk entry points.
   Public providers only. No credentials, cloud-schema changes or personal-field overwrites. */
(function(){
'use strict';
if(window.MediaFlowV428Metadata)return;
const M={job:null,ready:false,running:false,reviews:[],draft:null,scope:null,modal:null,rate:{},stop:false,account:'',progress:{at:0,total:0},history:[]};
const account=()=>String((typeof AUTH_USER!=='undefined'&&AUTH_USER?.id)||'local');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const lookup=id=>(S.library||[]).find(i=>String(i?.id)===String(id));
const idSet=()=>typeof mf425Selection==='function'?mf425Selection():Object.keys(S.librarySelection||{}).filter(k=>S.librarySelection[k]);
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
// Use MediaFlow's canonical v178 rich-metadata schema, not a shadow description field.
const fields=['synopsis','genres','year','studios','producers','themes','releaseDate','mediaFormat','durationMinutes','seasonLabel','ageRating','communityScore','mediaSource','demographic','total'];
const LIST_FIELDS=new Set(['genres','studios','producers','themes']);
const SAFE_RICH_FIELDS=new Set(fields.filter(f=>f!=='total'));
const editorIds={synopsis:'l-rich-synopsis',genres:'l-rich-genres',year:'l-rich-year',studios:'l-rich-studios',producers:'l-rich-producers',themes:'l-rich-themes',releaseDate:'l-rich-release-date',mediaFormat:'l-rich-format',durationMinutes:'l-rich-duration',seasonLabel:'l-rich-season',ageRating:'l-rich-age-rating',communityScore:'l-rich-community-score',mediaSource:'l-rich-source',demographic:'l-rich-demographic',total:'l-total'};
function editorValue(field){const el=document.getElementById(editorIds[field]);if(!el)return undefined;
 if(LIST_FIELDS.has(field))return [...new Set(String(el.value||'').split(',').map(s=>s.trim()).filter(Boolean))];
 if(['year','total','durationMinutes','communityScore'].includes(field))return String(el.value||'').trim()?Number(el.value):null;
 return String(el.value||'').trim();
}
function captureDraft(item){const next={...item};for(const field of fields){const value=editorValue(field);if(value!==undefined)next[field]=value;}
 next.title=String(document.getElementById('l-title')?.value||next.title||'').trim();next.categoryId=String(document.getElementById('l-category')?.value||next.categoryId||'');
 const ids={...(next.externalIds||{})};for(const el of document.querySelectorAll('[data-v377-id]')){const key=el.dataset.v377Id,value=String(el.value||'').trim();if(key&&value)ids[key]=value;}
 next.externalIds=ids;return next;}
function snapshot(item){return fields.map(f=>JSON.stringify(item[f]??null)).join('|')+'|'+String(item.title||'')+'|'+String(item.categoryId||'');}
const safeIds=o=>o&&typeof o==='object'?o:{};
const schema={jikan:{requiresSetup:false,capabilities:['anime','manga']},tvmaze:{requiresSetup:false,capabilities:['tv']},openlibrary:{requiresSetup:false,capabilities:['books']}};
async function db(){return new Promise((done,fail)=>{if(!indexedDB){fail(Error('IndexedDB is required to preserve metadata jobs'));return;}const req=indexedDB.open('mediaflow-metadata-v428',1);req.onupgradeneeded=()=>req.result.createObjectStore('records');req.onerror=()=>fail(req.error);req.onsuccess=()=>done(req.result);});}
async function store(op,value,owner=account()){const d=await db();return new Promise((done,fail)=>{const tx=d.transaction('records',op==='get'?'readonly':'readwrite');const req=op==='get'?tx.objectStore('records').get('job:'+owner):tx.objectStore('records').put(value,'job:'+owner);req.onerror=()=>fail(req.error);req.onsuccess=()=>done(req.result);tx.oncomplete=()=>d.close();});}
async function persist(){if(M.job)await store('put',M.job,M.job.account);window.MediaFlowV428Hub?.paint();}
function kind(item){const cat=String(item.categoryId||'').toLowerCase();const label=(S.categories||[]).find(c=>String(c.id)===cat)?.name||cat;
 const v=String(label).toLowerCase();return /manga|manhwa|manhua/.test(v)?'manga':/anime/.test(v)?'anime':/series|television|tv/.test(v)?'tv':/book|novel/.test(v)?'books':'other';}
async function request(provider,url){const row=M.rate[provider]||(M.rate[provider]={next:0,cooldown:0});
 for(let attempt=0;attempt<3;attempt++){
  const gap=provider==='jikan'?2500:1300;
  const wait=Math.max(0,row.next-Date.now(),row.cooldown-Date.now());if(wait)await sleep(wait);
  row.next=Date.now()+gap;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
  try{
   const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
   if(r.ok)return r.json();
   if(r.status===404)return null;
   if(r.status===429||r.status===503||r.status>=500){
    const raw=String(r.headers.get('Retry-After')||'');
    const sec=Number(raw),absolute=Date.parse(raw);
    const retry=Number.isFinite(sec)&&sec>0?sec*1000:Number.isFinite(absolute)?Math.max(0,absolute-Date.now()):30000*(attempt+1);
    row.cooldown=Date.now()+Math.max(1500,Math.min(300000,retry));continue;
   }
   throw Error(provider+' HTTP '+r.status);
  }catch(e){
   if(attempt>=2||!(e?.name==='AbortError'||e instanceof TypeError||/network|failed to fetch/i.test(String(e?.message||''))))throw e;
   row.cooldown=Date.now()+1500*(attempt+1);
  }finally{clearTimeout(timeout);}
 }
 throw Error(provider+' could not recover after retries');
}
function cleanHtml(value){
 // DOMParser's inert HTML document avoids mounting untrusted HTML in MediaFlow.
 const raw=String(value||'');
 if(typeof DOMParser==='function'){
  const parsed=new DOMParser().parseFromString(raw,'text/html');
  return String(parsed.body?.textContent||'').trim().slice(0,5000);
 }
 return raw.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,5000);
}
function mapJikan(src,type){return {title:src?.title||'',synopsis:src?.synopsis||'',mediaSource:src?.source||'',durationMinutes:Number(String(src?.duration||'').match(/(\d+)\s*min/)?.[1])||null,ageRating:src?.rating||'',communityScore:src?.score!=null?Math.max(0,Math.min(10,Number(src.score))):null,genres:(src?.genres||[]).map(g=>g.name).filter(Boolean),themes:(src?.themes||[]).map(g=>g.name).filter(Boolean),studios:(src?.studios||[]).map(g=>g.name).filter(Boolean),producers:(src?.producers||[]).map(g=>g.name).filter(Boolean),year:Number(src?.year)||(Number(String(src?.published?.from||src?.aired?.from||'').slice(0,4))||0),releaseDate:String(src?.aired?.from||src?.published?.from||'').slice(0,10),mediaFormat:src?.type||'',total:Number(type==='manga'?src?.chapters:src?.episodes)||0,source:'Jikan',url:src?.url||'',recordId:src?.mal_id};}
async function discover(item,allowed){
 const t=kind(item),ids=safeIds(item.externalIds),title=String(item.title||'').trim();if(!title)return {reason:'Title is missing'};
 if((t==='anime'||t==='manga')&&(!allowed||allowed.includes('jikan'))){
  const isManga=t==='manga',prefix=isManga?'manga':'anime',mal=ids.mal||item.malId;
  if(mal&&/^\d+$/.test(String(mal))){const data=await request('jikan','https://api.jikan.moe/v4/'+prefix+'/'+encodeURIComponent(mal)+'/full');
    if(data?.data){const d=mapJikan(data.data,t);if(norm(d.title)===norm(title)||[data.data.title_english,data.data.title_japanese,...(data.data.title_synonyms||[])].some(t=>norm(t)===norm(title)))return d;return {reason:'MAL record title does not match; review manually'};}}
  const search=await request('jikan','https://api.jikan.moe/v4/'+prefix+'?q='+encodeURIComponent(title)+'&limit=5');
  const exact=(search?.data||[]).filter(v=>[v.title,v.title_english,v.title_japanese,...(v.title_synonyms||[])].some(n=>norm(n)===norm(title)));
  if(exact.length===1)return mapJikan(exact[0],t);
  return {reason:exact.length>1?'Ambiguous Jikan title; no automatic match':'No exact title match'};
 }
 if(t==='tv'&&(!allowed||allowed.includes('tvmaze'))){
  const tm=String(ids.tvmaze||'').trim(),imdb=String(ids.imdb||'').trim();
  const path=tm&&/^\d+$/.test(tm)?'https://api.tvmaze.com/shows/'+tm:imdb?'https://api.tvmaze.com/lookup/shows?imdb='+encodeURIComponent(imdb):'';
  let d=path?await request('tvmaze',path):null;
  if(!d){const list=await request('tvmaze','https://api.tvmaze.com/search/shows?q='+encodeURIComponent(title));const exact=(list||[]).map(x=>x.show).filter(x=>norm(x?.name)===norm(title));if(exact.length!==1)return {reason:'No unique TVmaze match'};d=exact[0];}
  if(norm(d.name)!==norm(title))return {reason:'TVmaze identifier points to a different displayed title; manual verification required'};
  return {title:d.name||'',synopsis:cleanHtml(d.summary),durationMinutes:Number(d.runtime)||Number(d.averageRuntime)||null,genres:d.genres||[],year:Number(String(d.premiered||'').slice(0,4))||0,releaseDate:d.premiered||'',mediaFormat:d.type||'',total:0,source:'TVmaze',url:d.url||'',recordId:d.id};
 }
 if(t==='books'&&ids.isbn&&(!allowed||allowed.includes('openlibrary'))){
  const d=await request('openlibrary','https://openlibrary.org/isbn/'+encodeURIComponent(ids.isbn)+'.json');
  if(d&&!norm(d.title||''))return {reason:'Open Library ISBN record did not supply a title'};
  if(d&&norm(d.title)!==norm(title))return {reason:'Open Library ISBN record title differs; verify the ISBN before recovery'};
  if(d)return {title:d.title||'',synopsis:typeof d.description==='string'?d.description:d.description?.value||'',genres:(d.subjects||[]).filter(x=>typeof x==='string').slice(0,20),year:Number(String(d.publish_date||'').match(/\d{4}/)?.[0])||0,total:0,source:'Open Library',url:'https://openlibrary.org'+String(d.key||''),recordId:d.key};
 }
 return {reason:'No compatible configured public provider or verified ID for this category'};
}
function normalizedValue(field,value){
 if(LIST_FIELDS.has(field)){const a=Array.isArray(value)?value:String(value||'').split(',');return [...new Set(a.map(x=>String(x||'').trim()).filter(Boolean))].slice(0,40);}
 if(['year','total','durationMinutes'].includes(field)){const n=Number(value);return Number.isFinite(n)&&n>0&&Number.isSafeInteger(n)?n:null;}
 if(field==='communityScore'){const n=Number(value);return Number.isFinite(n)&&n>0&&n<=10?Math.round(n*100)/100:null;}
 if(field==='releaseDate'){const s=String(value||'').trim().slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';}
 return String(value||'').trim().slice(0,field==='synopsis'?6000:160);
}
function missing(field,value){return value==null||value===''||(LIST_FIELDS.has(field)&&!normalizedValue(field,value).length)||(['year','total','durationMinutes','communityScore'].includes(field))&&!(Number(value)>0);}
function diff(item,result){if(!result?.source)return [];
 const changes=[],manual=typeof v178ManualMap==='function'?v178ManualMap(item):(item.richMetadataManual||{});
 for(const field of fields){
  if(manual[field]===true)continue;
  // A title's progress and per-season totals are personal state; never adjust an existing total implicitly.
  if(field==='total'&&(item.seasons?.length||Number(item.total)>0||Number(item.progress)>0))continue;
  const found=normalizedValue(field,result[field]),old=normalizedValue(field,item[field]);
  if(missing(field,found)||JSON.stringify(found)===JSON.stringify(old))continue;
  changes.push({field,old:item[field],found,selected:missing(field,item[field])});
 }
 return changes;
}
async function init(){
 if(M.account&&M.account!==account()&&!M.running){M.initPromise=null;M.job=null;M.history=[];M.reviews=[];M.draft=null;M.scope=null;M.ready=false;}
 if(M.initPromise)return M.initPromise;M.initPromise=(async()=>{M.account=account();try{const old=await store('get');if(old?.account===account()){M.job=old;if(['running','ready','cooldown'].includes(old.status)){M.job.status='paused';await persist();}}}catch(e){console.warn('Metadata recovery storage unavailable',e);}try{const raw=JSON.parse(localStorage.getItem('mf428-metadata-history:'+account())||'[]');M.history=Array.isArray(raw)?raw.slice(-100):[];}catch(_){}M.ready=true;window.MediaFlowV428Hub?.paint();})();return M.initPromise;}
function draftItem(entry,id){
 const saved=lookup(id||S.modal?.data?.id),d=S.modal?.data||{};
 return captureDraft({...d,...(saved||{}),externalIds:{...(saved?.externalIds||d.externalIds||{})}});
}
function close(){document.getElementById('mf428-metadata-modal')?.remove();}
function fieldOptions(){
 return fields.map(field=>'<label class="mf428-meta-field"><input type="checkbox" data-mf428-field value="'+field+'" '+(field==='total'?'':'checked')+'><span>'+esc(field==='synopsis'?'Synopsis / description':field==='total'?'Total units (only when empty)':field)+'</span></label>').join('');
}
function open(entry='settings',id=''){
 if(M.account&&M.account!==account()){M.reviews=[];M.scope=null;M.job=null;init().catch(e=>console.warn('Metadata account refresh',e));}
 close();
 const one=id?lookup(id):entry==='editor'?draftItem(entry,id):null;
 const selection=entry==='library'?idSet().map(String).filter(v=>lookup(v)):[];
 M.scope={entry,id:String(id||''),selected:selection,owner:account()};
 const parent=document.createElement('div');parent.id='mf428-metadata-modal';parent.className='mf428-metadata-overlay';
 const fixed=entry==='editor'||!!one?.id||selection.length>0;
 const label=entry==='editor'?'Current title editor':one?'This Title':selection.length?'Selected '+selection.length+' Titles':'All Library';
 const categories=(S.categories||[]).filter(cat=>cat?.id);
 parent.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428MetadataClose()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true" aria-label="Fix Metadata"><header><div><small>LIBRARY MAINTENANCE</small><h2>Fix Metadata</h2><p>Identify the title, preview field changes, then apply only approved metadata.</p></div><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataClose()">Close</button></header>'+
 '<div class="mf428-meta-config"><label>Recovery scope<select id="mf428-meta-scope" '+(fixed?'disabled':'')+'><option value="'+(entry==='editor'?'draft':one?'single':selection.length?'selected':'all')+'">'+esc(label)+'</option>'+(!fixed?'<option value="category">By Category</option>':'')+'</select></label>'+
 '<label>Method<select id="mf428-meta-method"><option value="missing">Fill Missing Fields</option><option value="review">Review Differences</option><option value="refresh">Refresh Outdated Metadata (review first)</option></select></label>'+
 '<label>Titles per part<input id="mf428-meta-part" type="number" min="1" max="1000" value="100"></label>'+
  '<label>Processing mode<select id="mf429-meta-runmode"><option value="parts">Part-by-Part</option><option value="one">One-Go</option></select></label>'+
  '<label>After each part<select id="mf429-meta-continuation"><option value="manual">Wait for my confirmation</option><option value="automatic">Automatically queue next part</option></select></label></div>'+
 (!fixed?'<label class="mf428-category-chooser">Category filter <select id="mf428-meta-category"><option value="">Choose category</option>'+categories.map(cat=>'<option value="'+esc(cat.id)+'">'+esc(cat.name)+'</option>').join('')+'</select></label>':'')+
 '<fieldset class="mf428-meta-fieldset"><legend>Enabled metadata sources</legend><div class="mf428-meta-fields">'+Object.entries(schema).map(([id,info])=>'<label class="mf428-meta-field"><input type="checkbox" data-mf429-meta-provider value="'+esc(id)+'" checked><span>'+esc(id)+' · '+esc(info.capabilities.join(', '))+'</span></label>').join('')+'</div></fieldset>'+
  '<fieldset class="mf428-meta-fieldset"><legend>Metadata fields to check</legend><div class="mf428-meta-fields">'+fieldOptions()+'</div></fieldset>'+
 '<div class="mf428-meta-note">Existing personal information and manually locked rich metadata are protected. Episode/chapter total is opt-in and never changes watched progress or season structures. Every change requires review before saving.</div>'+
 '<footer><button type="button" class="btn btn-primary" onclick="App.mf428MetadataStart()">Find Metadata</button></footer></section>';
 document.body.appendChild(parent);parent.querySelector('.mf428-meta-dialog button')?.focus();
}
async function start(){
 await init();
 const scope=M.scope;if(!scope||scope.owner!==account()){showToast('Account changed. Reopen Fix Metadata.');return;}
 const part=Math.max(1,Math.min(1000,Number(document.getElementById('mf428-meta-part')?.value)||100));
 const method=document.getElementById('mf428-meta-method')?.value||'missing';
  const runMode=document.getElementById('mf429-meta-runmode')?.value==='one'?'one':'parts';
  const continuation=document.getElementById('mf429-meta-continuation')?.value==='automatic'?'automatic':'manual';
  const providers=[...document.querySelectorAll('#mf428-metadata-modal [data-mf429-meta-provider]:checked')].map(el=>el.value).filter(p=>schema[p]&&!schema[p].requiresSetup);
  if(!providers.length){showToast('Enable at least one compatible public metadata source.');return;}
 const fieldChoices=[...document.querySelectorAll('#mf428-metadata-modal [data-mf428-field]:checked')].map(e=>e.value).filter(field=>fields.includes(field));
 if(!fieldChoices.length){showToast('Choose at least one metadata field.');return;}
 if(scope.entry==='editor'){
  const draft=draftItem('editor',scope.id);
  if(!draft.title){showToast('Enter a title before searching metadata.');return;}
  const fingerprint=snapshot(draft);
  if(window.MediaFlowV428Hub?.enqueue('metadata',{draftPreview:draft,account:account(),fingerprint,method,fields:fieldChoices,providers}))
   {close();showToast('Metadata lookup queued for the current title editor.');}
  else showToast('Metadata Recovery is already running or queued.');
  return;
 }
 let ids=scope.id&&lookup(scope.id)?[scope.id]:scope.selected.length?scope.selected.slice():[];
 if(!ids.length){
  const mode=document.getElementById('mf428-meta-scope')?.value||'all';
  const category=String(document.getElementById('mf428-meta-category')?.value||'');
  if(mode==='category'&&!category){showToast('Choose a category for metadata recovery.');return;}
  ids=(S.library||[]).filter(i=>i?.id&&(mode!=='category'||String(i.categoryId)===category)).map(i=>String(i.id));
 }
 if(!ids.length){showToast('No eligible Library titles.');return;}
 if(M.job&&!['complete','stopped','failed'].includes(M.job.status)){showToast('A Metadata Recovery is still pending. Resume or review it before starting a new batch.');return;}
 M.reviews=[];
 M.job={account:account(),ids,cursor:0,part,runMode,continuation,method,providers,fields:fieldChoices,status:'queued',reviews:[],completed:0,skipped:0,errors:[],created:Date.now(),paused:false,stopped:false};
 await persist();
 if(!window.MediaFlowV428Hub?.enqueue('metadata',{})){M.job.status='paused';await persist();showToast('Metadata was not queued. Resume the existing process when available.');return;}
 close();showToast(ids.length+' title(s) added to Metadata Recovery.');
}
async function previewDraft(item,owner=account(),params={}){
 try{
  const data=await discover(item,params.providers);
  if(owner!==account())throw Error('Account changed during editor metadata search');
  if(!data.source){showToast(data.reason||'No matching metadata record');return;}
  const differences=diff(item,data).filter(d=>params.fields?.includes(d.field)!==false&&(params.method!=='missing'||d.selected));
  if(!differences.length){showToast('No safe metadata differences found.');return;}
  M.reviews=[{draft:true,itemId:String(item.id||''),item,owner,found:data,differences,version:0,fingerprint:params.fingerprint||snapshot(item)}];
  renderReview();
 }catch(e){showToast('Metadata lookup failed: '+String(e.message||e));}
}
async function worker(params={}){await init();
 if(params.draftPreview){if(params.account!==account())throw Error('Unsaved title account changed');if(!window.MediaFlowV428Hub?.ownsLease())throw Error('Metadata scheduler lease unavailable');await previewDraft(params.draftPreview,params.account,params);return;}
 const job=M.job;if(!job||job.account!==account())return;
 job.status='running';M.running=true;await persist();
 const index=new Map((S.library||[]).filter(i=>i?.id).map(i=>[String(i.id),i]));
 try{let processed=0;while(job.cursor<job.ids.length){
  if(job.paused||job.stopped||job.account!==account()||!window.MediaFlowV428Hub?.ownsLease()){job.status=job.stopped?'stopped':'paused';break;}
  const id=job.ids[job.cursor],item=index.get(id);if(item){const version=Number(item.modifiedAt)||0;
   try{const found=await discover({...item},job.providers);if(found.source){if(job.paused||job.stopped||job.account!==account()||!window.MediaFlowV428Hub?.ownsLease()){job.status='paused';break;}
    const differences=diff(item,found).filter(d=>job.fields?.includes(d.field)!==false&&(job.method!=='missing'||d.selected));
    if(differences.length){if(job.method==='refresh')differences.forEach(d=>d.selected=true);job.reviews.push({itemId:id,version,found,differences});}else job.skipped++;
   }else job.skipped++;}catch(e){job.errors.push({id,reason:String(e.message||e)});}}
  job.cursor++;processed++;await persist();
  if(job.reviews.length>=250){job.status='waiting-review';break;}
  if(job.runMode!=='one'&&processed>=job.part&&job.cursor<job.ids.length){job.status=job.stopAfterPart?'stopped':'waiting-part';job.stopped=!!job.stopAfterPart;break;}
 }
 if(job.cursor>=job.ids.length)job.status=job.reviews.length?'waiting-review':'complete';
 await persist();
 }catch(e){job.status='paused';job.errors.push({id:'job',reason:String(e.message||e)});await persist();throw e;}
 finally{
   M.running=false;window.MediaFlowV428Hub?.paint();
   // The scheduler frees its slot after the worker resolves. In automatic
   // Part-by-Part mode enqueue the next segment behind its shared cooldown.
   if(job.status==='waiting-part'&&job.continuation==='automatic'&&!job.stopAfterPart){
    setTimeout(()=>{
     if(M.job===job&&job.account===account()&&!M.running&&job.status==='waiting-part')
      App.mf428MetadataControl?.('resume');
    },750);
   }
  }
}
function review(){
 if(M.account&&M.account!==account()){showToast('Account changed. Reopen Metadata Recovery.');return;}
 if(M.reviews.length){renderReview();return;}
 if(!M.job?.reviews?.length){showToast('No metadata changes waiting for review.');return;}
 M.reviews=M.job.reviews;renderReview();
}
function renderReview(){document.getElementById('mf428-meta-review')?.remove();const current=M.reviews[0];if(!current)return;
 const root=document.createElement('div');root.id='mf428-meta-review';root.className='mf428-metadata-overlay';
 const rows=current.differences.map((d,i)=>'<label class="mf428-diff"><input type="checkbox" data-index="'+i+'" '+(d.selected?'checked':'')+'><span><b>'+esc(d.field)+'</b><small>Current: '+esc(Array.isArray(d.old)?d.old.join(', '):d.old==null?'Missing':d.old).slice(0,240)+'</small><small>Found: '+esc(Array.isArray(d.found)?d.found.join(', '):d.found).slice(0,500)+'</small></span></label>').join('');
 const recordLink=/^https:\/\//i.test(String(current.found.url||''))?'<a class="mf428-metadata-source" href="'+esc(current.found.url)+'" target="_blank" rel="noopener noreferrer">View '+esc(current.found.source)+' record</a>':'';
 root.innerHTML='<div class="mf428-meta-shade" onclick="App.mf428MetadataCloseReview()"></div><section class="mf428-meta-dialog" role="dialog" aria-modal="true"><header><div><small>METADATA · '+esc(current.found.source)+'</small><h2>'+esc(current.item?.title||lookup(current.itemId)?.title||'Title changed')+'</h2><p>Matched source title: '+esc(current.found.title||'Unknown')+'. Compare every field before saving. '+M.reviews.length+' title(s) pending.</p>'+recordLink+'</div><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataCloseReview()">Later</button></header><div class="mf428-diff-list">'+(rows||'<p>No safely editable metadata fields found.</p>')+'</div><footer><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataSkip()">Skip</button><button type="button" class="btn btn-primary" onclick="App.mf428MetadataApply()">Apply Selected</button></footer></section>';
 document.body.appendChild(root);
}
function closeReview(){document.getElementById('mf428-meta-review')?.remove();}
async function skip(){const same=M.job&&M.reviews===M.job.reviews;M.reviews.shift();if(same){if(!M.job.reviews.length&&M.job.cursor>=M.job.ids.length)M.job.status='complete';await persist();}closeReview();if(M.reviews.length)renderReview();}
async function apply(){
 if(M.account&&M.account!==account()){showToast('Account changed. Reopen Metadata Recovery.');return;}
 const current=M.reviews[0],checked=[...document.querySelectorAll('#mf428-meta-review [data-index]:checked')].map(x=>Number(x.dataset.index));
 if(!current||!checked.length){showToast('Select at least one field, or skip this result.');return;}
 const item=current.draft?null:lookup(current.itemId);
 if(!current.draft&&(!item||Number(item.modifiedAt||0)!==Number(current.version))){showToast('Title changed since lookup. Recheck metadata before applying.');return;}
 if(!current.draft&&account()!==M.job?.account){showToast('Account changed. No metadata saved.');return;}
 const selected=checked.map(i=>current.differences[i]).filter(Boolean);
 if(current.draft){
   if(current.owner!==account()||S.modal?.type!=='library'){
    showToast('Title editor or account changed. Reopen Fix Metadata.');return;
   }
   const editor=draftItem('editor',current.itemId);
   if(snapshot(editor)!==current.fingerprint){
    showToast('Title editor changed after metadata lookup. Recheck it before applying.');return;
   }
   let applied=0;
   for(const d of selected){
    const el=document.getElementById(editorIds[d.field]);
    if(!el)continue;
    el.value=LIST_FIELDS.has(d.field)?d.found.join(', '):String(d.found);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    if(typeof el.closest==='function')el.closest('details')&&(el.closest('details').open=true);
    applied++;
   }
   showToast(applied?'Metadata applied to title editor. Save the title to keep these changes.':'No editable metadata fields found. Nothing was saved.');
 }else{
  const protectedManual=typeof v178ManualMap==='function'?v178ManualMap(item):(item.richMetadataManual||{});
  if(selected.some(d=>JSON.stringify(item[d.field]??null)!==JSON.stringify(d.old??null))){showToast('Metadata field changed after lookup. Recheck this title.');return;}
  if(selected.some(d=>protectedManual[d.field]===true||d.field==='total'&&(Number(item.total)>0||Number(item.progress)>0||item.seasons?.length))){
   showToast('A field was manually protected or progress/season totals changed. Recheck this title.');return;
  }
  const previous={};for(const d of selected){previous[d.field]=item[d.field];item[d.field]=d.found;}
  const oldStamp=item.modifiedAt;item.modifiedAt=Date.now();
  try{if(typeof v53InvalidateLibraryCache==='function')v53InvalidateLibraryCache();await saveState();
   const record={id:item.id,title:item.title,fields:selected.map(d=>d.field),previous,after:Object.fromEntries(selected.map(d=>[d.field,item[d.field]])),changedAt:item.modifiedAt,source:current.found.source};M.history.push(record);if(M.history.length>100)M.history.shift();
   try{localStorage.setItem('mf428-metadata-history:'+account(),JSON.stringify(M.history));}catch(_){}
   if(M.job)M.job.completed++;showToast('Metadata saved for '+String(item.title||'title'));
  }catch(e){for(const d of selected){if(previous[d.field]===undefined)delete item[d.field];else item[d.field]=previous[d.field];}item.modifiedAt=oldStamp;showToast('Save failed; metadata restored.');return;}
 }
 await skip();window.MediaFlowV428Hub?.paint();
}
async function undo(){await init();if(window.MediaFlowV428Hub?.status()?.active){showToast('Finish or pause background work before undoing metadata.');return;}const last=M.history[M.history.length-1];if(!last){showToast('No metadata change available to undo.');return;}const item=lookup(last.id);if(!item||Number(item.modifiedAt||0)!==Number(last.changedAt)){showToast('Title changed after recovery; unsafe to undo automatically.');return;}if(last.after&&last.fields.some(field=>JSON.stringify(item[field]??null)!==JSON.stringify(last.after[field]??null))){showToast('Recovered metadata was edited after saving. Undo is unsafe.');return;}const newer={};for(const field of last.fields){newer[field]=item[field];if(last.previous[field]===undefined)delete item[field];else item[field]=last.previous[field];}const oldStamp=item.modifiedAt;item.modifiedAt=Date.now();try{await saveState();M.history.pop();localStorage.setItem('mf428-metadata-history:'+account(),JSON.stringify(M.history));showToast('Last metadata recovery reversed.');}catch(e){for(const field of last.fields){if(newer[field]===undefined)delete item[field];else item[field]=newer[field];}item.modifiedAt=oldStamp;showToast('Unable to undo metadata safely.');}}
function control(cmd){if(!M.job)return;
 if(cmd==='stop-part'){M.job.stopAfterPart=true;persist();return;}
 if(cmd==='pause'||cmd==='stop'||cmd==='cancel'){M.job[cmd==='pause'||cmd==='cancel'?'paused':'stopped']=true;
  if(cmd==='cancel')M.job.status='paused';persist();
 }
 if(cmd==='review')review();
 if(cmd==='resume'&&['paused','stopped','waiting-part','waiting-review'].includes(M.job.status)){
   if(M.running)return;
   M.job.paused=false;M.job.stopped=false;M.job.stopAfterPart=false;M.job.status='queued';
   persist().then(()=>window.MediaFlowV428Hub?.enqueue('metadata',{})).catch(e=>console.warn('Metadata resume failed',e));
 }}
function injectEditor(html){if(!html||html.includes('mf428-edit-action'))return html;const at=html.indexOf('class="mf425-editor-tools"');if(at<0)return html;const close=html.indexOf('</div>',at);if(close<0)return html;
 return html.slice(0,close)+'<button type="button" class="btn btn-ghost mf428-edit-action" onclick="App.mf428MetadataOpen(\'editor\',String(S.modal?.data?.id||\'\'))">Fix Metadata</button>'+html.slice(close);}
if(typeof libraryModalHtml==='function'){const prior=libraryModalHtml;libraryModalHtml=function(){return injectEditor(String(prior.apply(this,arguments)||''));};}
if(typeof renderLibrary==='function'){const previous=renderLibrary;renderLibrary=function(){let html=String(previous.apply(this,arguments)||'');if(html.includes('mf428-library-metadata'))return html;const match=/class="[^"]*\bmf425-tools-button\b[^"]*"/.exec(html);if(!match)return html;let at=match.index;const end=html.indexOf('</button>',at);if(end<0)return html;at=end+9;return html.slice(0,at)+'<button type="button" class="btn btn-sm mf428-library-metadata" onclick="App.mf428MetadataOpen(\'library\')">Fix Metadata</button>'+html.slice(at);};}
function enhanceSettings(){if(S.view!=='settings')return;const anchor=document.querySelector('.mf425-settings-group');if(!anchor||document.querySelector('.mf428-settings-group'))return;
 const el=document.createElement('div');el.className='mf366-subgroup mf428-settings-group';el.innerHTML='<h3 class="mf366-subgroup-heading">Metadata Recovery</h3><div class="mf366-subgroup-content"><section class="mf425-settings-card"><div class="mf425-settings-lead"><strong>Fix Metadata</strong><p>Recover incomplete title information with verified public providers. Review changes before saving.</p></div><div class="mf425-settings-actions"><button type="button" class="btn btn-primary" onclick="App.mf428MetadataOpen(\'settings\')">Configure & Start Metadata Recovery</button><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataReview()">Review Pending</button><button type="button" class="btn btn-ghost" onclick="App.mf428MetadataUndo()">Undo Last Metadata Change</button></div></section></div>';
 anchor.insertAdjacentElement('afterend',el);}
if(typeof MediaFlowRuntime!=='undefined'&&MediaFlowRuntime.registerPageEnhancer)MediaFlowRuntime.registerPageEnhancer('settings',enhanceSettings);
// Native Title Details markup is rendered separately from #modal-root.
if(typeof v181TitleDetailsHtml==='function'){
 const previousDetails=v181TitleDetailsHtml;
 v181TitleDetailsHtml=function(item){
  const html=String(previousDetails.apply(this,arguments)||'');
  if(!item?.id||html.includes('mf428-details-action'))return html;
  const button='<button type="button" class="btn btn-ghost mf428-details-action" data-title-id="'+esc(item.id)+'" onclick="App.mf428MetadataOpen(\'details\',this.dataset.titleId)">'+(typeof mf425Icon==='function'?mf425Icon('database'):'')+' Fix Metadata</button>';
  return html.replace('<div class="v181-detail-actions">','<div class="v181-detail-actions">'+button);
 };
}
if(typeof App.v181QuickEditDetail==='function'){const old=App.v181QuickEditDetail;App.v181QuickEditDetail=function(id,key){const result=old.apply(this,arguments);if(key==='coverUrl'){const el=document.querySelector('#v181-quick-detail-overlay .mf425-editor-tools');if(el&&!el.querySelector('.mf428-edit-action'))el.insertAdjacentHTML('beforeend','<button type="button" class="btn btn-ghost mf428-edit-action" onclick="App.mf428MetadataOpen(\'details\',\''+esc(id)+'\')">Fix Metadata</button>');}return result;};}
Object.assign(App,{mf428MetadataOpen:open,mf428MetadataClose:close,mf428MetadataStart:start,mf428MetadataControl:control,mf428MetadataReview:review,mf428MetadataCloseReview:closeReview,mf428MetadataSkip:skip,mf428MetadataApply:apply,mf428MetadataUndo:undo});
window.MediaFlowV428Metadata={progress:()=>M.job?{at:M.job.cursor||0,total:M.job.ids?.length||0}:{at:0,total:0},status:()=>M.job?.status||'idle',pending:()=>M.job?.reviews?.length||M.reviews.length||0,schema,review,open,previewFields:diff,detectMediaKind:kind,captureDraft};
window.MediaFlowV428Hub?.registerMetadata(worker);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();