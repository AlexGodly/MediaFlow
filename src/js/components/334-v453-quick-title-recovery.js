/* MediaFlow v453 — quick, non-batch per-title recovery preview.
 * API reads only until explicit Apply; uses existing provider verification and
 * v439 field-level safe merge. Original bulk recovery is not replaced. */
const MF453Quick={current:null,serial:0,loading:false,account:''};
function mf453QuickRoot(){return document.getElementById('mf453-title-quick');}
function mf453QuickHtml(){
 const q=MF453Quick.current;if(!q)return '';
 const title=mf439Item(q.id)?.title||'Library title';
 const cover=q.kind!=='metadata',meta=q.kind!=='cover',preview=q.metadata?.preview;
 const old=mf439Item(q.id)?.coverUrl||'';
 const coverPart=cover?'<section class="mf453-quick-group"><h3>'+mf425Icon('images',18)+' New covers</h3>'+
 (q.coverLoading?'<p>Searching configured cover providers…</p>':
 q.covers.length?'<div class="mf453-quick-covers">'+q.covers.map((c,i)=>
  '<button type="button" class="mf453-quick-cover '+(i===q.coverIndex?'selected':'')+
  '" onclick="App.mf453PickCover('+i+')" aria-pressed="'+(i===q.coverIndex)+'">'+
  '<img src="'+mf453Esc(c.url)+'" alt="'+mf453Esc(c.title||title)+'" loading="lazy">'+
  '<strong>'+mf453Esc(c.title||title)+'</strong><small>'+mf453Esc(c.provider)+
  ' · '+Math.round(c.confidence*100)+'% match</small></button>').join('')+'</div>':
 '<p>No verified cover matches from ready providers. Your existing cover stays untouched.</p>')+
 (old?'<p class="mf453-current-cover">Current cover: <img src="'+mf453Esc(old)+'" alt="Current cover" loading="lazy"> Replacement requires your confirmation.</p>':'')+
 '</section>':'';
 const metaPart=meta?'<section class="mf453-quick-group"><h3>'+mf425Icon('database',18)+' New metadata</h3>'+
 (q.metaLoading?'<p>Searching verified metadata…</p>':
 preview?'<p>'+preview.results+' matching source records · '+preview.proposals.length+' proposed fields.</p>'+
 '<div class="mf453-quick-fields">'+preview.proposals.map((p,i)=>{
  const option=p.options[p.choice]||p.options[0],locked=p.hasOriginal||p.protected||p.same;
  return '<article class="mf453-quick-field"><label><input type="checkbox" '+
   (p.selected?'checked ':'')+(locked?'disabled ':'')+
   'onchange="App.mf453PickMetadata('+i+',this.checked)"><strong>'+mf453Esc(p.label)+'</strong></label>'+
   '<small>Current: '+mf453Esc(mf439DescribeValue(p.token,p.original)).slice(0,170)+
   ' · '+mf453Esc(p.status)+'</small><div>'+mf453Esc(mf439DescribeValue(p.token,option?.value)).slice(0,260)+
   '</div><small>Source: '+mf453Esc(option?.sources?.map(s=>s.provider+' · '+s.evidence).join(' / ')||'Unavailable')+'</small>'+
   (p.options.length>1?'<select onchange="App.mf453MetadataSource('+i+',this.value)" aria-label="Source for '+
    mf453Esc(p.label)+'">'+p.options.map((o,j)=>'<option value="'+j+'" '+(j===p.choice?'selected':'')+'>'+
    mf453Esc(o.sources.map(s=>s.provider).join(' + '))+'</option>').join('')+'</select>':'')+
  '</article>';
 }).join('')+'</div>':'<p>No verified suggestions available from ready providers.</p>')+
 '</section>':'';
 const busy=q.coverLoading||q.metaLoading||q.applying;
 const selected=q.coverIndex>=0||!!preview?.proposals?.some(p=>p.selected);
 const cat=mf453Category(mf439Item(q.id)?.categoryId);
 return '<div class="mf453-quick-inner"><div class="mf453-quick-header"><strong>'+mf453Esc(title)+'</strong>'+
 '<small>Providers: '+mf453Esc(cat?.name||'Global defaults')+' preset · Nothing saved until confirmed</small></div>'+
 (q.pending.length?'<p class="mf453-pending">'+mf425Icon('shield',16)+' Pending access: '+
  mf453Esc(q.pending.join(', '))+'. Selected for later, but not treated as configured.</p>':'')+
 '<div class="mf453-quick-grid">'+coverPart+metaPart+'</div>'+
 (q.errors.length?'<details><summary>'+q.errors.length+' provider error(s)</summary>'+
  q.errors.map(e=>'<p>'+mf453Esc(e)+'</p>').join('')+'</details>':'')+
 '<div class="mf453-quick-actions"><button type="button" class="btn btn-ghost" onclick="App.mf453CloseQuick()">'+
 mf425Icon('x',16)+' Cancel</button>'+
 '<button type="button" class="btn btn-primary" onclick="App.mf453ApplyQuick()" '+(!selected||busy?'disabled':'')+'>'+
 mf425Icon('check',16)+' Confirm selected changes</button></div></div>';
}
function mf453PaintQuick(){
 const node=mf453QuickRoot()?.querySelector('[data-mf453-quick-content]');
 if(node)node.innerHTML=mf453QuickHtml();
}
function mf453PickCover(index){
 const q=MF453Quick.current;if(!q?.covers[Number(index)])return;
 q.coverIndex=q.coverIndex===Number(index)?-1:Number(index);mf453PaintQuick();
}
function mf453PickMetadata(index,on){
 const p=MF453Quick.current?.metadata?.preview?.proposals?.[Number(index)];
 if(!p||p.hasOriginal||p.protected||p.same)return;
 p.selected=Boolean(on);mf453PaintQuick();
}
function mf453MetadataSource(index,value){
 const p=MF453Quick.current?.metadata?.preview?.proposals?.[Number(index)];
 const n=Number(value);if(!p||!Number.isInteger(n)||n<0||n>=p.options.length)return;
 p.choice=n;p.selected=!p.hasOriginal&&!p.protected&&!p.same;mf453PaintQuick();
}
async function mf453ScanQuick(session){
 const q=MF453Quick.current;if(!q||session!==MF453Quick.serial)return;
 const item=mf439Item(q.id);MF453Quick.loading=true;
 try{
  if(q.kind!=='metadata'){
   const known=new Set();
   for(const source of q.coverProviders){
    if(session!==MF453Quick.serial||q.controller.signal.aborted)break;
    try{
     const rows=await mf424Discover(item,source);
     for(const candidate of rows||[]){
      if(session!==MF453Quick.serial||q.controller.signal.aborted)break;
      if(!candidate?.url||!/^https:\/\//.test(candidate.url)||candidate.confidence<.65||known.has(candidate.url))continue;
      known.add(candidate.url);
      if(await mf424Image(candidate.url,candidate.provider))q.covers.push(candidate);
      if(q.covers.length>=12)break;
     }
    }catch(e){q.errors.push(source+': '+String(e?.message||e).slice(0,140));}
    mf453PaintQuick();if(q.covers.length>=12)break;
   }
   q.coverLoading=false;mf453PaintQuick();
  }
  if(q.kind!=='cover'&&session===MF453Quick.serial&&!q.controller.signal.aborted){
   q.metadata=await mf439Discover(item,q.metaProviders,()=>{},q.controller.signal);
   q.metaLoading=false;mf453PaintQuick();
  }
 }catch(e){q.errors.push(String(e?.message||e).slice(0,180));}
 finally{
  if(session===MF453Quick.serial){
   q.coverLoading=false;q.metaLoading=false;MF453Quick.loading=false;mf453PaintQuick();
  }else MF453Quick.loading=false;
 }
}
async function mf453OpenQuick(kind,id){
 kind=['cover','metadata','both'].includes(kind)?kind:'cover';id=String(id||'');
 const item=mf439Item(id);
 if(!item||MF453Quick.current){showToast('Save the title and close any existing quick recovery first.');return;}
 const owner=typeof mf442ProcessLease==='function'?mf442ProcessLease():null;
 if(owner&&owner.token!==MF442.owner){showToast('Another tab owns recovery; stop it before launching quick recovery.');return;}
 let priority=false;
 if(MF424.running||MF439.working||MF442.process){
  if(!await mf451Prepare(kind,id))return;priority=true;
 }
 if(typeof mf443EnsureGateway==='function')await mf443EnsureGateway();
 const allowed={cover:kind==='metadata'?[]:mf453Ready('cover',item),
 metadata:kind==='cover'?[]:mf453Ready('metadata',item)};
 const pending=[];
 for(const mode of ['cover','metadata']){
  if(mode==='cover'&&kind==='metadata'||mode==='metadata'&&kind==='cover')continue;
  const chosen=new Set(mf453ProvidersFor(mode,item.categoryId||''));
  for(const p of mf445Providers(mode))if(chosen.has(p.id)&&!p.available)pending.push(p.name);
 }
 MF453Quick.account=mf439Account();
 const session=++MF453Quick.serial;
 MF453Quick.current={id,kind,covers:[],coverIndex:-1,metadata:null,
  coverProviders:allowed.cover,metaProviders:allowed.metadata,
  coverLoading:kind!=='metadata',metaLoading:kind!=='cover',
  pending:[...new Set(pending)],errors:[],applying:false,priority,
  controller:new AbortController()};
 const root=document.createElement('div');root.id='mf453-title-quick';
 root.className='mf424-modal mf425-themed mf453-quick-modal';
 root.innerHTML='<div class="mf424-shade" onclick="App.mf453CloseQuick()"></div>'+
 '<section class="mf424-dialog mf453-quick-dialog" role="dialog" aria-modal="true" aria-label="Quick title recovery">'+
 '<header class="mf453-quick-top"><div><small>QUICK TITLE RECOVERY</small><h2>'+mf425Icon('layers',22)+' '+
 mf453Esc(kind==='both'?'Cover + Metadata':kind==='cover'?'Cover Recovery':'Metadata Recovery')+
 '</h2></div><button type="button" class="btn btn-ghost" onclick="App.mf453CloseQuick()">'+
 mf425Icon('x',16)+' Close</button></header><div data-mf453-quick-content></div></section>';
 document.body.append(root);mf453PaintQuick();
 void mf453ScanQuick(session);
}
async function mf453CloseQuick(){
 const q=MF453Quick.current;if(!q)return;
 q.controller.abort();MF453Quick.serial++;MF453Quick.current=null;mf453QuickRoot()?.remove();
 if(q.priority){
  // Existing background jobs were checkpointed before entering quick mode.
  for(let i=0;i<90&&MF453Quick.loading;i++)await new Promise(resolve=>setTimeout(resolve,100));
  try{await mf451Restore({force:true});}
  catch(e){console.warn('Original recovery checkpoint kept for manual resume',e);}
 }
}
async function mf453ApplyQuick(){
 const q=MF453Quick.current;if(!q||q.applying||q.coverLoading||q.metaLoading)return;
 const item=mf439Item(q.id),cover=q.covers[q.coverIndex],preview=q.metadata?.preview;
 if(!item||MF453Quick.account!==mf439Account()){showToast('Title or account changed. Reopen preview.');return;}
 if(!cover&&!preview?.proposals?.some(p=>p.selected)){showToast('Choose a cover or eligible missing metadata first.');return;}
 q.applying=true;mf453PaintQuick();
 try{
  if(cover&&item.coverUrl&&String(item.coverUrl)!==String(cover.url)&&
   !await mf444Confirm('Replace this title’s existing cover?',
    'Apply the selected verified cover? Your old cover will be kept if you cancel.',
    'Replace Cover',false,1,'cover')){q.applying=false;mf453PaintQuick();return;}
  const backup=structuredClone(item);let coverCount=0,metadataCount=0;
  if(cover&&String(item.coverUrl||'')!==String(cover.url)){
   item.coverUrl=cover.url;item.coverSource='manual:quick:'+cover.provider;
   item.modifiedAt=Date.now();coverCount=1;
  }
  if(preview?.proposals?.some(p=>p.selected)){
   MF439.account=mf439Account();
   metadataCount=mf439Apply(item,preview,'review').changed||0;
  }
  if(!coverCount&&!metadataCount){q.applying=false;mf453PaintQuick();showToast('Nothing eligible to save.');return;}
  try{await saveState();}
  catch(e){Object.assign(item,backup);throw e;}
  try{v53InvalidateLibraryCache();}catch(_){}
  showToast('Saved '+coverCount+' cover and '+metadataCount+' verified missing metadata values.');
  await mf453CloseQuick();render();
 }catch(e){
  console.warn('Quick recovery save failed',e);showToast('Could not save quick recovery: '+String(e?.message||e).slice(0,90));
  if(MF453Quick.current){q.applying=false;mf453PaintQuick();}
 }
}
// Title-editor and title-details actions use quick review; bulk and selected
// multi-title launches retain the original v447/v451 resuming workflow.
const mf453OldOpen=App.mf447Open;
App.mf447Open=function(kind='cover',options={}){
 if(options?.id&&!Array.isArray(options.ids))return mf453OpenQuick(kind,options.id);
 return mf453OldOpen.apply(this,arguments);
};
Object.assign(App,{mf453PickCover,mf453PickMetadata,mf453MetadataSource,
 mf453OpenQuick,mf453CloseQuick,mf453ApplyQuick});
window.MediaFlowV453=Object.freeze({version:453,open:mf453OpenQuick,
 quick:()=>MF453Quick.current,presets:mf453ProvidersFor,ready:mf453Ready});
