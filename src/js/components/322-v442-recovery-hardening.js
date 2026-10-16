/* MediaFlow v442 — Recovery Integration & Performance Hardening.
 * Shared account-local, cross-tab process coordination. This does NOT claim
 * cross-device locking; remote devices need a server-side arbiter.
 * Never bypass v424 image checks or v439 field/ID provenance protections.
 */
const MF442_VERSION=442;
const MF442={owner:'mf442-'+Date.now()+'-'+Math.random().toString(36).slice(2),
 process:'',timer:null,leaseLost:false,index:null,indexLibrary:null,lastError:'',lastEvent:'',saves:0};
function mf442ProcessKey(){return 'mediaflow-v442-recovery-owner:'+mf439Account();}
function mf442LocalLease(key){
 try{const x=JSON.parse(localStorage.getItem(key)||'null');
  return x&&typeof x==='object'&&Number(x.expires)>Date.now()?x:null;
 }catch(_){return null;}
}
function mf442ProcessLease(){return mf442LocalLease(mf442ProcessKey());}
function mf442ProcessOwned(kind){
 const row=mf442ProcessLease();
 return Boolean(row?.token===MF442.owner&&row?.kind===kind&&MF442.process===kind);
}
function mf442AcquireProcess(kind){
 if(!['cover','metadata'].includes(kind)||!mf439Account())return false;
 const previous=mf442ProcessLease();
 if(previous&&(previous.token!==MF442.owner||previous.kind!==kind))return false;
 try{
  localStorage.setItem(mf442ProcessKey(),JSON.stringify({token:MF442.owner,kind,
   expires:Date.now()+60000}));
  if(mf442LocalLease(mf442ProcessKey())?.token!==MF442.owner)return false;
  MF442.process=kind;MF442.leaseLost=false;
  clearInterval(MF442.timer);
  MF442.timer=setInterval(()=>{
   if(!mf442ProcessOwned(kind)){MF442.leaseLost=true;
    if(kind==='cover'){if(MF424.job)MF424.job.pauseRequested=true;}
    else MF439.cancel=true;
    clearInterval(MF442.timer);return;
   }
   try{localStorage.setItem(mf442ProcessKey(),
     JSON.stringify({token:MF442.owner,kind,expires:Date.now()+60000}));}
   catch(_){MF442.leaseLost=true;}
  },8000);
  return mf442ProcessOwned(kind);
 }catch(_){return false;}
}
function mf442ReleaseProcess(kind){
 clearInterval(MF442.timer);MF442.timer=null;
 try{if(mf442ProcessOwned(kind))localStorage.removeItem(mf442ProcessKey());}catch(_){}
 if(MF442.process===kind)MF442.process='';
}
function mf442MetadataLeaseOwned(){
 const row=mf442LocalLease(mf439LeaseKey());
 return Boolean(MF439.lease&&row?.token===MF439.lease);
}
function mf442RenewMetadataLease(){
 if(!mf442MetadataLeaseOwned()||!mf442ProcessOwned('metadata'))return false;
 try{
  localStorage.setItem(mf439LeaseKey(),JSON.stringify({token:MF439.lease,expires:Date.now()+45000}));
  return mf442MetadataLeaseOwned();
 }catch(_){return false;}
}
function mf442CoverLockIsActive(){
 if(MF424.running&&mf424Account()===mf439Account())return true;
 const lease=mf442LocalLease('mf-v424-owner-'+mf439Account());
 // The v424 lease uses 'expiry', not 'expires'.
 try{const row=JSON.parse(localStorage.getItem('mf-v424-owner-'+mf439Account())||'null');
  return Boolean(lease||(row?.token&&Number(row.expiry)>Date.now()));
 }catch(_){return false;}
}
function mf442MetadataLockIsActive(){
 return Boolean(MF439.working||mf442LocalLease(mf439LeaseKey()));
}
function mf442NormalizeJob(job){
 if(!job||job.schema!==1||job.account!==mf439Account()||!Array.isArray(job.ids)||
    !job.ids.length||job.ids.length>250)return null;
 const ids=[...new Set(job.ids.filter(id=>['string','number'].includes(typeof id))
   .map(id=>String(id).trim()).filter(id=>id.length>0&&id.length<=120))];
 if(!ids.length)return null;
 const cursor=Math.max(0,Math.min(ids.length,Math.floor(Number(job.cursor)||0)));
 const errors=Array.isArray(job.errors)?job.errors.slice(-50):[];
 const status=['running','paused','completed'].includes(job.status)?job.status:'paused';
 return {...job,ids,cursor,errors,status,
  completed:cursor,changed:Math.max(0,Math.floor(Number(job.changed)||0))};
}
function mf442LibraryReady(account){
 return Boolean(Array.isArray(S.library)&&S.loading!==true&&mf439Account()===account);
}
async function mf442WaitForLibrary(account){
 for(let attempt=0;attempt<120;attempt++){
  if(mf442LibraryReady(account))return true;
  if(mf439Account()!==account)return false;
  await new Promise(done=>setTimeout(done,250));
 }
 return false;
}
function mf442IndexSelected(ids){
 const lib=S.library||[],lookup=new Map(),wanted=new Set(ids.map(String));
 for(const item of lib)if(item?.id!=null&&wanted.has(String(item.id)))lookup.set(String(item.id),item);
 MF442.index=lookup;MF442.indexLibrary=lib;
 return lookup;
}
function mf442TitleSignature(item){
 return item?JSON.stringify([String(item.id),item.title,item.originalTitle,item.year,item.releaseDate,
  Number(item.modifiedAt)||0,item.externalIds||{}]):'';
}
function mf442Failure(job,reason,id){
 job.errors=Array.isArray(job.errors)?job.errors:[];
 job.errors.push({titleId:String(id||''),reason:String(reason||'').slice(0,200)});
 if(job.errors.length>50)job.errors=job.errors.slice(-50);
 MF442.lastError=String(reason||'').slice(0,200);
}
const mf442OriginalMetadataRead=mf439ReadJob;
mf439ReadJob=function(){
 const original=mf442OriginalMetadataRead.apply(this,arguments);
 return mf442NormalizeJob(original);
};
const mf442OriginalMetadataConfirm=mf439ConfirmBatch;
mf439ConfirmBatch=function(){
 if(MF439.working)return mf442OriginalMetadataConfirm.apply(this,arguments);
 if(mf442CoverLockIsActive()||mf442ProcessLease()?.kind==='cover'){
  showToast('Cover Recovery is active. Pause it before starting Metadata Recovery.');return;
 }
 const previous=mf442NormalizeJob(MF439.job||mf439ReadJob());
 if(previous&&previous.cursor<previous.ids.length&&previous.status!=='completed'){
  if(!confirm('A paused Metadata Recovery checkpoint already exists. Start a new selection and replace the unfinished queue? Previously saved fields will remain.'))return;
 }
 return mf442OriginalMetadataConfirm.apply(this,arguments);
};
App.mf439ConfirmBatch=mf439ConfirmBatch;
const mf442OriginalCoverRun=mf424Run;
mf424Run=async function(){
 if(!MF424.job||MF424.running)return;
 if(!mf442AcquireProcess('cover')){
  MF442.lastEvent='Cover Recovery waiting for another recovery process';
  MF424.job.pauseRequested=true;
  mf424State('paused');
  try{await mf424SaveJob();}catch(e){console.warn('Cover pause checkpoint failed',e);}
  showToast('Another recovery is using this account. Resume Cover Recovery after it finishes.');
  return;
 }
 if(mf442MetadataLockIsActive()){
  mf442ReleaseProcess('cover');
  MF424.job.pauseRequested=true;mf424State('paused');await mf424SaveJob();
  showToast('Metadata Recovery is active in another tab. Resume covers when it finishes.');return;
 }
 try{return await mf442OriginalCoverRun.apply(this,arguments);}
 finally{mf442ReleaseProcess('cover');}
};
// Metadata recovery now resolves each Library title in O(1) after one bounded
// index build, validates the title against mid-lookup changes, and persists
// Library data before moving the resumable cursor.
mf439RunBatch=async function mf442RunMetadataBatch(){
 if(MF439.working||!MF439.job)return;
 let job=mf442NormalizeJob(MF439.job);
 if(!job||!['running','paused'].includes(job.status))return;
 if(!mf442LibraryReady(job.account)){
  if(!await mf442WaitForLibrary(job.account)){
   showToast('Metadata Recovery paused until your Library finishes loading.');return;
  }
 }
 if(mf442CoverLockIsActive()){
  MF439.job.status='paused';mf439SaveJob();mf439PaintJob();
  showToast('Cover Recovery is running. Resume metadata after it finishes.');return;
 }
 if(!mf442AcquireProcess('metadata')){
  MF439.job.status='paused';mf439SaveJob();mf439PaintJob();
  showToast('Another recovery tab is already processing this account.');return;
 }
 if(!mf439AcquireLease()){
  mf442ReleaseProcess('metadata');
  MF439.job.status='paused';mf439SaveJob();mf439PaintJob();
  showToast('Metadata Recovery is active in another tab.');return;
 }
 // Keep the original, current job object, not a detached normalized clone.
 job=MF439.job;
 job.ids=mf442NormalizeJob(job).ids;
 job.cursor=Math.max(0,Math.min(job.ids.length,Number(job.cursor)||0));
 MF439.account=job.account;MF439.working=true;MF439.cancel=false;job.status='running';
 mf439SaveJob();mf439PaintJob();
 mf442IndexSelected(job.ids);
 const keepAlive=setInterval(()=>{
  if(!mf442RenewMetadataLease()){MF442.leaseLost=true;MF439.cancel=true;}
 },8000);
 try{
  while(job.cursor<job.ids.length&&!MF439.cancel){
   if(MF439.job!==job||MF439.account!==mf439Account()||
      !mf442MetadataLeaseOwned()||!mf442ProcessOwned('metadata')||MF442.leaseLost||
      mf442CoverLockIsActive()){
    job.status='paused';mf442Failure(job,'Account, lock or ownership changed; recovery paused');
    break;
   }
   const id=job.ids[job.cursor];
   if(MF442.indexLibrary!==S.library)mf442IndexSelected(job.ids);
   const item=MF442.index.get(id);
   if(!item){mf442Failure(job,'Library title unavailable; no changes applied',id);
    job.cursor++;job.completed=job.cursor;mf439SaveJob();mf439PaintJob();continue;}
   const before=mf442TitleSignature(item);
   const {preview,failures}=await mf439Discover(item,mf439Preferences().enabled,()=>{},null);
   if(MF439.cancel||MF439.job!==job||MF439.account!==mf439Account()||
      !mf442MetadataLeaseOwned()||!mf442ProcessOwned('metadata')||MF442.leaseLost||
      mf442CoverLockIsActive()){
    job.status='paused';mf442Failure(job,'Process ownership changed during lookup; nothing saved',id);
    break;
   }
   if(MF442.indexLibrary!==S.library)mf442IndexSelected(job.ids);
   const latest=MF442.index.get(id);
   if(latest!==item||before!==mf442TitleSignature(item)){
    mf442Failure(job,'Title changed during provider lookup; skipped safely',id);
   }else{
    const result=mf439Apply(item,preview,'automatic');
    if(result.changed||job.pendingSaveId===id){
     // Do not checkpoint until saveState has committed. On failure leave
     // cursor at the same ID; the next resume is safe and idempotent.
     job.pendingSaveId=id;mf439SaveJob();
     await saveState();
     MF442.saves++;job.pendingSaveId='';
     job.changed=(Number(job.changed)||0)+result.changed;
    }
   }
   if(failures.length)job.errors.push({titleId:id,failures:failures.slice(0,5)});
   if(job.errors.length>50)job.errors=job.errors.slice(-50);
   if(!mf442MetadataLeaseOwned()||!mf442ProcessOwned('metadata')||
      MF439.account!==mf439Account()||MF442.leaseLost){
    job.status='paused';mf442Failure(job,'Ownership changed before checkpoint',id);
    break;
   }
   job.cursor++;job.completed=job.cursor;
   mf439SaveJob();mf439PaintJob();
  }
  job.status=job.cursor>=job.ids.length?'completed':'paused';
 }catch(e){
  job.status='paused';mf442Failure(job,'Saved checkpoint preserved: '+String(e?.message||e));
 }finally{
  clearInterval(keepAlive);
  MF439.working=false;
  mf439ReleaseLease();
  mf442ReleaseProcess('metadata');
  mf439SaveJob();mf439PaintJob();
  MF442.index=null;MF442.indexLibrary=null;
  if(job.changed)try{v53InvalidateLibraryCache();render();}catch(_){}
 }
};
function mf442Health(){
 const current=mf442ProcessLease();
 const coverLease=mf442CoverLockIsActive(),metadataLease=mf442MetadataLockIsActive();
 const cover=MF424.job,meta=mf442NormalizeJob(MF439.job||mf439ReadJob());
 return {
  version:442,scope:'Current account · this browser profile (not cross-device)',
  lock:current?{kind:current.kind,owner:current.token===MF442.owner?'this tab':'another tab',expiresInSeconds:Math.max(0,Math.ceil((current.expires-Date.now())/1000))}:null,
  cover:{state:cover?.status||'idle',done:Math.max(0,Number(cover?.cursor)||0),total:cover?.ids?.length||0,
   recovered:Math.max(0,Number(cover?.fixed)||0),leaseActive:coverLease},
  metadata:{state:meta?.status||'idle',done:meta?.cursor||0,total:meta?.ids.length||0,
   fields:meta?.changed||0,leaseActive:metadataLease,checkpointValid:!!meta,
   warnings:meta?.errors.length||0},
  activity:{saveCountThisSession:MF442.saves,lastError:MF442.lastError||null}
 };
}
function mf442HealthMarkup(){
 const h=mf442Health();
 return '<section class="mf442-health" data-mf-setting-id="recovery-health">'+
  '<div class="mf442-health-heading">'+mf425Icon('shield',21)+'<div><strong>Recovery Integrity & Diagnostics</strong>'+
  '<p>Current account · local browser coordination, checkpoints and save status</p></div></div>'+
  '<div class="mf442-health-grid">'+
   '<div><strong>'+mf424Escape(h.cover.state)+'</strong><small>Cover queue · '+h.cover.done+' / '+h.cover.total+'</small></div>'+
   '<div><strong>'+mf424Escape(h.metadata.state)+'</strong><small>Metadata queue · '+h.metadata.done+' / '+h.metadata.total+'</small></div>'+
   '<div><strong>'+mf424Escape(h.lock?h.lock.kind+' · '+h.lock.owner:'Available')+'</strong><small>Recovery process lock</small></div>'+
   '<div><strong>'+h.metadata.warnings+'</strong><small>Metadata warning records</small></div>'+
  '</div><p>Two browser tabs cannot safely apply covers and metadata for the same account at the same time. The second job waits for a manual resume. This is a local-browser guard, not a cross-device lock. Existing saved progress is never cleared by a diagnostic refresh.</p>'+
  (h.activity.lastError?'<p class="mf442-warning">'+mf424Escape(h.activity.lastError)+'</p>':'')+
  '<div class="mf442-health-actions"><button type="button" class="btn btn-ghost" onclick="App.mf442RefreshHealth()">'+mf425Icon('search',16)+' Refresh health</button>'+
   '<button type="button" class="btn btn-ghost" onclick="App.mf442ExportHealth()">'+mf425Icon('download',16)+' Export diagnostics</button></div></section>';
}
function mf442RefreshHealth(){
 const root=document.querySelector('.mf442-health');
 if(!root)return;
 const temp=document.createElement('div');temp.innerHTML=mf442HealthMarkup();
 if(temp.firstElementChild)root.replaceWith(temp.firstElementChild);
}
function mf442ExportHealth(){
 const report=JSON.stringify(mf442Health(),null,2);
 const blob=new Blob([report],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='mediaflow-v442-recovery-health.json';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const mf442WorkspaceBase=mf441WorkspaceHtml;
mf441WorkspaceHtml=function(){
 const html=mf442WorkspaceBase.apply(this,arguments);
 return html.replace('</section>',mf442HealthMarkup()+'</section>');
};
Object.assign(App,{mf442RefreshHealth,mf442ExportHealth});
const mf442BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const backup=mf442BackupBase.apply(this,arguments);
 if(backup){
  backup.mediaFlowVersion=442;backup.backupVersion=442;
  const manifest=backup.backupManifest||(backup.backupManifest={});
  manifest.includes={...(manifest.includes||{}),v442RecoveryHardening:true};
  manifest.v442={version:442,accountScopedCrossTabCoordination:true,
   metadataCheckpointAfterConfirmedSave:true,existingDataAndRatingsPreserved:true};
 }
 return backup;
};
window.MediaFlowV442=Object.freeze({
 version:442,health:mf442Health,renderHealth:mf442HealthMarkup,
 validateJob:mf442NormalizeJob,signature:mf442TitleSignature,
 processOwned:mf442ProcessOwned
});
