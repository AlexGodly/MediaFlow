/* MediaFlow v454 — Quick Title Recovery lifecycle hardening.
 * One cancellable modal, priority checkpoint handoff, and verified alternatives.
 * All three modes use the same safe preview and apply path. */
const MF454Quick={closing:null,keydown:null,returnFocus:null,completedAt:0};
function mf454QuickLive(q){return MF453Quick.current===q&&!q.closed&&q.serial===MF453Quick.serial;}
function mf454QuickRemoveDom(){
 // An earlier asynchronous open could append an orphaned element with the
 // same ID. Remove EVERY matching node, even if the current state is null.
 document.querySelectorAll('[id="mf453-title-quick"]').forEach(node=>node.remove());
}
function mf454QuickBadge(candidate){
 const confidence=Number(candidate.confidence)||0;
 const exact=candidate.idMatch===true&&confidence>=.9;
 return exact?'Verified external-ID match':confidence>=.65?'Title match · review':'Unverified match · review carefully';
}
function mf454QuickLoading(q){return q.stage==='pausing'||q.stage==='connecting';}
function mf454QuickView(example=null){
 const q=example||MF453Quick.current;
 if(!q||q.closed)return '';
 const item=mf439Item(q.id),cover=q.kind!=='metadata',metadata=q.kind!=='cover';
 const panel=q.metadata?.preview;
 const busy=typeof mf458CanConfirmQuick==='function' ? !mf458CanConfirmQuick(q) :
  (mf454QuickLoading(q)||q.coverLoading||q.metaLoading||q.applying);
 const selected=q.coverIndex>=0||Boolean(panel?.proposals?.some(p=>p.selected&&!p.protected&&!p.hasOriginal&&!p.same));
 const intro='<div class="mf454-intro"><div class="mf454-intro-title"><strong>'+
 mf453Esc(item?.title||'Saved title')+'</strong><span class="mf454-mode-badge">'+
 mf453Esc(q.kind==='both'?'Cover + Metadata':q.kind==='cover'?'Cover':'Metadata')+
 '</span></div><small>Category preset · '+mf453Esc(mf453Category(item?.categoryId)?.name||'Global defaults')+
 ' · No Library changes before confirmation</small></div>';
 const stage=mf454QuickLoading(q)?'<div class="mf454-quick-loading" role="status">'+mf425Icon('shield',20)+
 '<div><strong>'+mf453Esc(q.stage==='pausing'?'Safely pausing background recovery':'Checking provider access')+
 '</strong><p>'+mf453Esc(q.stage==='pausing'?'Finishing the current title checkpoint. Your active queue will resume after this quick recovery closes.':'Validating configured provider adapters while keeping your saved category choices.')+
 '</p></div></div>':'';
 const pending=q.pending?.length?'<details class="mf454-notice"><summary>'+
 mf425Icon('shield',15)+' '+q.pending.length+' selected source(s) need setup</summary>'+
 '<p>'+mf453Esc(q.pending.join(', '))+'. These cannot run without a working adapter and permission.</p></details>':'';
 const coverChoices=cover?'<section class="mf454-results-panel" aria-label="Cover alternatives">'+
 '<div class="mf454-results-head"><span>'+mf425Icon('images',18)+' <strong>Cover choices</strong></span>'+
 '<small>'+q.covers.length+' available'+(q.coverLoading?' · searching':'')+'</small></div>'+
 (q.coverLoading&&q.covers.length===0?'<p class="mf454-wait">Searching actual artwork providers…</p>':'')+
 (q.covers.length?'<div class="mf454-cover-gallery" role="group" aria-label="Choose artwork">'+
  q.covers.map((c,i)=>'<button type="button" data-v225-iconified="1" class="mf454-cover-option '+(q.coverIndex===i?'selected':'')+
   '" aria-pressed="'+(q.coverIndex===i)+'" onclick="App.mf453PickCover('+i+')">'+
   '<span class="mf454-cover-image"><img src="'+mf453Esc(c.url)+'" loading="lazy" decoding="async" alt="'+
   mf453Esc(c.title||'Cover candidate')+'"></span>'+
   '<span class="mf454-cover-meta"><strong>'+mf453Esc(c.title||item?.title||'Cover')+'</strong>'+
   '<small>'+mf453Esc(c.provider||'Source')+'</small>'+
   '<em class="'+(Number(c.confidence)>=.65?'is-verified':'is-review')+'">'+
   mf453Esc(mf454QuickBadge(c))+'</em></span></button>').join('')+'</div>':
  (!q.coverLoading?'<p class="mf454-empty">No loadable artwork was returned by the selected ready providers. You can search additional ready sources without changing your preset.</p>':''))+
 (item?.coverUrl?'<div class="mf454-current-art"><img src="'+mf453Esc(item.coverUrl)+
 '" alt="Current cover" loading="lazy"><span><strong>Existing cover</strong>'+
 '<small>Will be preserved unless you explicitly select a new image and confirm replacement.</small></span></div>':'')+
 '</section>':'';
 const metaChoices=metadata?'<section class="mf454-results-panel" aria-label="Metadata alternatives">'+
 '<div class="mf454-results-head"><span>'+mf425Icon('database',18)+' <strong>Metadata suggestions</strong></span>'+
 '<small>'+Number(panel?.proposals?.length||0)+' fields'+(q.metaLoading?' · searching':'')+'</small></div>'+
 (q.metaLoading&&!panel?'<p class="mf454-wait">Finding and comparing verified metadata records…</p>':'')+
 (panel?'<p class="mf454-result-context">'+Number(panel.results||0)+' matched records · Existing and protected fields are never overwritten.</p>'+
  '<div class="mf454-metadata-list">'+panel.proposals.map((p,i)=>{
   const option=p.options?.[p.choice]||p.options?.[0];
   const locked=p.protected||p.hasOriginal||p.same;
   const variants=p.options?.length||0;
   return '<article class="mf454-meta-option" data-mf454-token="'+mf453Esc(p.token||'')+'">'+
   '<div class="mf454-meta-option-head"><label><input type="checkbox" '+(p.selected?'checked ':'')+
   (locked?'disabled ':'')+'onchange="App.mf453PickMetadata('+i+',this.checked)">'+
   '<strong>'+mf453Esc(p.label||p.token||'Field')+'</strong></label>'+
   '<span>'+mf453Esc(p.status||'review')+'</span></div>'+
   '<small class="mf454-current-value">Current: '+mf453Esc(mf439DescribeValue(p.token,p.original)).slice(0,240)+'</small>'+
   '<div class="mf454-proposed-value">'+mf453Esc(mf439DescribeValue(p.token,option?.value)).slice(0,540)+'</div>'+
   '<small class="mf454-evidence">Source: '+mf453Esc(option?.sources?.map(s=>s.provider+
   (s.evidence?' · '+s.evidence:'')).join(' / ')||'Unconfirmed')+'</small>'+
   (variants>1?'<label class="mf454-source-label"><span>'+variants+' source alternatives — choose one</span>'+
    '<select onchange="App.mf453MetadataSource('+i+',this.value)" aria-label="Choose source for '+
    mf453Esc(p.label||p.token)+'">'+p.options.map((v,j)=>
    '<option value="'+j+'" '+(j===p.choice?'selected':'')+'>'+mf453Esc(v.sources?.map(s=>s.provider).join(' + ')||'Provider')+
    ' · '+mf453Esc(mf439DescribeValue(p.token,v.value)).slice(0,72)+'</option>').join('')+'</select></label>':'')+
   '</article>';
  }).join('')+'</div>':
  (!q.metaLoading?'<p class="mf454-empty">No verified new fields were returned. Check provider access or search other available sources.</p>':''))+
 '</section>':'';
 const full=!mf454QuickLoading(q);
 const again=full?'<button type="button" class="btn btn-ghost mf454-search-more" data-v225-iconified="1"'+
 (busy?' disabled':'')+' onclick="App.mf454SearchAll()">'+mf425Icon('search',16)+
 ' Search all ready providers</button>':'';
 const errors=q.errors?.length?'<details class="mf454-provider-errors"><summary>'+
 q.errors.length+' provider issue(s) — details</summary>'+
 q.errors.map(err=>'<p>'+mf453Esc(err)+'</p>').join('')+'</details>':'';
 const actions='<footer class="mf454-quick-footer">'+again+
 '<div class="mf454-footer-actions"><button type="button" class="btn btn-ghost" data-v225-iconified="1" onclick="App.mf453CloseQuick()">'+
 mf425Icon('x',16)+' Cancel</button>'+
 '<button type="button" class="btn btn-primary" data-v225-iconified="1" onclick="App.mf453ApplyQuick()"'+
 ((!selected||busy)?' disabled':'')+'>'+mf425Icon('check',16)+' Confirm selected changes</button></div></footer>';
 return '<div class="mf454-quick-layout">'+intro+pending+stage+
 (full?'<div class="mf454-quick-results '+(q.kind==='both'?'is-both':'is-single')+'">'+coverChoices+metaChoices+'</div>':'')+
 errors+actions+'</div>';
}
mf453QuickHtml=mf454QuickView;
const mf454PaintBase=mf453PaintQuick;
mf453PaintQuick=function(){
 const root=mf453QuickRoot(),container=root?.querySelector('[data-mf453-quick-content]');
 if(!container)return;
 const dialog=root.querySelector('.mf453-quick-dialog'),gallery=container.querySelector('.mf454-cover-gallery'),
 list=container.querySelector('.mf454-metadata-list');
 const top=dialog?.scrollTop||0,coverY=gallery?.scrollTop||0,metaY=list?.scrollTop||0;
 try{container.innerHTML=mf454QuickView();}
 catch(err){console.warn('v454 quick view render failed',err);container.innerHTML=
 '<div class="mf454-error"><p>Recovery preview could not render. You can always close this dialog safely.</p>'+
 '<button type="button" onclick="App.mf453CloseQuick()">Close recovery</button></div>';}
 if(dialog)dialog.scrollTop=top;
 const nextGallery=container.querySelector('.mf454-cover-gallery');
 if(nextGallery)nextGallery.scrollTop=coverY;
 const nextList=container.querySelector('.mf454-metadata-list');
 if(nextList)nextList.scrollTop=metaY;
};
function mf454QuickValidateCover(item,source){
 // Already validated by mf424Image() in scan; at Apply time the existing
 // mf444Confirm step still handles replacement. Less-certain title matches
 // receive a separate review warning first.
 return !!source&&/^https:\/\//i.test(String(source.url||''))&&
 Number(source.confidence)>=0;
}
const mf454OriginalApply=mf453ApplyQuick;
mf453ApplyQuick=async function(){
 const q=MF453Quick.current;
 if(!q||(typeof mf458CanConfirmQuick==='function'? !mf458CanConfirmQuick(q) : (q.closed||q.applying||q.coverLoading||q.metaLoading)))return;
 const chosen=q.covers?.[q.coverIndex],item=mf439Item(q.id);
 if(chosen&&!mf454QuickValidateCover(item,chosen)){
  showToast('The selected artwork did not meet minimum validation. Choose another verified-loading image.');return;
 }
 if(chosen&&(Number(chosen.confidence)<.65||chosen.idMatch!==true)){
  if(!await mf444Confirm('Review lower-confidence cover match?',
   'This artwork loaded successfully, but the provider title match is uncertain. Make sure it belongs to the correct title and edition before applying.',
   'Use Reviewed Cover',false,1,'cover'))return;
 }
 return mf454OriginalApply.apply(this,arguments);
};
App.mf453ApplyQuick=mf453ApplyQuick;
function mf454QuickKeyboard(event){
 if(event.key!=='Escape'||!mf453QuickRoot()||document.getElementById('mf444-confirm'))return;
 event.preventDefault();event.stopImmediatePropagation();
 void mf453CloseQuick();
}
async function mf454QuickFinish(q){
 if(q.finishPromise)return q.finishPromise;
 q.finishPromise=(async()=>{
  try{
   if(q.preparePromise)await q.preparePromise.catch(()=>{});
   if(q.scanPromise)await q.scanPromise.catch(()=>{});
   if(q.priority&&MF451.journal){
    const restored=await mf451Restore({force:true});
    if(!restored)showToast('Original recovery checkpoint is safe; use Resume Interrupted in Background Processes.');
   }
  }catch(e){console.warn('v454 restoring background recovery',e);
   showToast('Background checkpoint is preserved. Resume it from Background Processes when ready.');
  }
 })();
 return q.finishPromise;
}
mf453CloseQuick=async function(){
 const q=MF453Quick.current;
 if(q){q.closed=true;q.controller?.abort();MF453Quick.serial++;MF453Quick.current=null;}
 // Never depend on q being initialized to dismiss a modal. This fixes
 // orphan headers and double-open overlays from earlier async attempts.
 mf454QuickRemoveDom();
 if(MF454Quick.keydown){document.removeEventListener('keydown',MF454Quick.keydown,true);MF454Quick.keydown=null;}
 const previous=MF454Quick.returnFocus;MF454Quick.returnFocus=null;
 if(previous?.isConnected)try{previous.focus({preventScroll:true});}catch(_){}
 if(q)void mf454QuickFinish(q);
};
App.mf453CloseQuick=mf453CloseQuick;
async function mf454FetchQuick(session){
 const q=MF453Quick.current;
 if(!q||!mf454QuickLive(q))return;
 const item=mf439Item(q.id),cover=q.kind!=='metadata',meta=q.kind!=='cover';
 const tasks=[];
 if(cover)tasks.push((async()=>{
  const found=new Set();
  try{
   for(const provider of q.coverProviders){
    if(!mf454QuickLive(q)||q.controller.signal.aborted)break;
    try{
     const rows=await mf424Discover(item,provider);
     for(const candidate of rows||[]){
      if(!mf454QuickLive(q)||q.controller.signal.aborted)break;
      const url=String(candidate?.url||'');
      if(!url.startsWith('https://')||found.has(url))continue;
      found.add(url);
      if(await mf424Image(url,candidate.provider)){
       if(!mf454QuickLive(q))break;
       q.covers.push(candidate);mf453PaintQuick();
      }
      if(q.covers.length>=24)break;
     }
    }catch(err){if(mf454QuickLive(q))q.errors.push(provider+': '+String(err?.message||err).slice(0,160));}
    if(q.covers.length>=24)break;
   }
  }finally{q.coverLoading=false;if(mf454QuickLive(q))mf453PaintQuick();}
 })());
 if(meta)tasks.push((async()=>{
  try{
   if(!q.controller.signal.aborted){
    const result=await mf439Discover(item,q.metaProviders,()=>{},q.controller.signal);
    if(mf454QuickLive(q))q.metadata=result;
   }
  }catch(err){if(mf454QuickLive(q))q.errors.push('Metadata: '+String(err?.message||err).slice(0,160));}
  finally{q.metaLoading=false;if(mf454QuickLive(q))mf453PaintQuick();}
 })());
 await Promise.allSettled(tasks);
 if(mf454QuickLive(q)){q.stage='ready';mf453PaintQuick();}
}
async function mf454SearchAll(){
 const q=MF453Quick.current;
 if(!q||q.closed||q.coverLoading||q.metaLoading||q.stage!=='ready'||q.applying)return;
 q.coverProviders=q.kind==='metadata'?[]:mf445Providers('cover').filter(p=>p.available).map(p=>p.id);
 q.metaProviders=q.kind==='cover'?[]:mf445Providers('metadata').filter(p=>p.available).map(p=>p.id);
 q.covers=[];q.coverIndex=-1;q.metadata=null;q.errors=[];
 q.coverLoading=q.kind!=='metadata';q.metaLoading=q.kind!=='cover';q.stage='scanning';
 mf453PaintQuick();
 q.scanPromise=mf454FetchQuick(q.serial);
}
App.mf454SearchAll=mf454SearchAll;
mf453OpenQuick=async function(kind,id){
 kind=['cover','metadata','both'].includes(kind)?kind:'cover';
 id=String(id||'');
 const item=mf439Item(id);
 if(!item){showToast('Save the title before using quick recovery.');return;}
 if(MF453Quick.current||MF454Quick.quickOpening){
  // Bring the existing dialog to the foreground, never create a duplicate.
  mf453QuickRoot()?.querySelector('.mf453-quick-dialog')?.focus({preventScroll:true});
  return;
 }
 MF454Quick.quickOpening=true;
 MF454Quick.returnFocus=document.activeElement;
 const serial=++MF453Quick.serial;
 const q={id,kind,serial,stage:'pausing',closed:false,priority:false,
  coverProviders:[],metaProviders:[],covers:[],coverIndex:-1,metadata:null,
  coverLoading:kind!=='metadata',metaLoading:kind!=='cover',
  pending:[],errors:[],applying:false,controller:new AbortController(),scanPromise:null};
 MF453Quick.current=q;
 MF453Quick.account=mf439Account();
 mf454QuickRemoveDom();
 const root=document.createElement('div');root.id='mf453-title-quick';
 root.className='mf424-modal mf425-themed mf453-quick-modal mf454-quick-modal';
 root.innerHTML='<div class="mf424-shade" onclick="App.mf453CloseQuick()" aria-hidden="true"></div>'+
 '<section class="mf424-dialog mf453-quick-dialog mf454-quick-dialog" role="dialog" aria-modal="true" aria-label="Quick title recovery" tabindex="-1">'+
 '<header class="mf453-quick-top"><div><small>QUICK TITLE RECOVERY</small><h2>'+mf425Icon('layers',22)+' '+
 mf453Esc(kind==='both'?'Cover + Metadata':kind==='cover'?'Cover Recovery':'Metadata Recovery')+
 '</h2></div><button type="button" class="btn btn-ghost" data-v225-iconified="1" onclick="App.mf453CloseQuick()">'+
 mf425Icon('x',16)+' Close</button></header><div data-mf453-quick-content></div></section>';
 document.body.append(root);
 MF454Quick.keydown=mf454QuickKeyboard;
 document.addEventListener('keydown',MF454Quick.keydown,true);
 mf453PaintQuick();
 root.querySelector('.mf453-quick-dialog')?.focus({preventScroll:true});
 try{
  const owner=typeof mf442ProcessLease==='function'?mf442ProcessLease():null;
  if(owner&&owner.token!==MF442.owner)
   throw Error('Another browser tab owns recovery. Pause that tab before quick recovery.');
  if(MF424.running||MF439.working||MF442.process){
   // Both is intentional even for cover-only or metadata-only quick views:
   // the v451 journal must checkpoint BOTH preexisting processes before any
   // provider call. Otherwise old processes can race with our quick scan.
   q.preparePromise=mf451Prepare('both',id);
   if(!await q.preparePromise)
    throw Error('Could not safely pause existing recovery. Check Background Processes.');
   q.priority=true;
   // The old combined engine may already report completed. Do not let its
   // regular scheduler restart older jobs while this quick preview is open.
   const checkpoint=MF451.journal||mf451Read();
   if(checkpoint){checkpoint.autoResume=false;checkpoint.state='quick-preview';mf451Store(checkpoint);}
  }
  if(!mf454QuickLive(q))return;
  q.stage='connecting';mf453PaintQuick();
  if(typeof mf443EnsureGateway==='function')await mf443EnsureGateway();
  if(!mf454QuickLive(q))return;
  const fresh=mf439Item(id);
  if(!fresh||MF453Quick.account!==mf439Account())throw Error('Title or account changed while preparing recovery.');
  q.coverProviders=kind==='metadata'?[]:mf453Ready('cover',fresh);
  q.metaProviders=kind==='cover'?[]:mf453Ready('metadata',fresh);
  for(const mode of ['cover','metadata']){
   if(kind==='cover'&&mode==='metadata'||kind==='metadata'&&mode==='cover')continue;
   const chosen=new Set(mf453ProvidersFor(mode,fresh.categoryId||''));
   for(const provider of mf445Providers(mode))
    if(chosen.has(provider.id)&&!provider.available)q.pending.push(provider.name);
  }
  q.pending=[...new Set(q.pending)];
  q.stage='scanning';mf453PaintQuick();
  q.scanPromise=mf454FetchQuick(serial);
  await q.scanPromise;
 }catch(err){
  console.warn('v454 quick recovery startup',err);
  if(mf454QuickLive(q)){
   q.errors.push(String(err?.message||err));
   q.stage='error';q.coverLoading=false;q.metaLoading=false;
   mf453PaintQuick();
  }
 }finally{
  MF454Quick.quickOpening=false;
  if(q.closed)void mf454QuickFinish(q);
 }
};
App.mf453OpenQuick=mf453OpenQuick;
window.MediaFlowV454=Object.freeze({version:454,open:mf453OpenQuick,close:mf453CloseQuick,
 html:mf454QuickView,searchAll:mf454SearchAll,active:()=>MF453Quick.current,
 clearOrphans:mf454QuickRemoveDom,coverStatus:mf454QuickBadge});
