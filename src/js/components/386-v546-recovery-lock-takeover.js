/* MediaFlow v546 — recovery lock handoff and fenced takeover.
 * A takeover never deletes a lock and immediately starts another worker.
 * It first fences the previous process, waits for its legacy lease to release,
 * then isolates the resumable queue before claiming the new worker lease.
 */
const MF546={version:546,tabId:'mf546-tab-'+Date.now()+'-'+Math.random().toString(36).slice(2),
 modalKind:'',busy:false,pending:null,lastError:''};

function mf546QueueKeyCache(account){
 const id=String(account||'local');
 let cache=window.__mf546RecoveryQueueKeys;
 if(!cache||cache.account!==id){
  cache={account:id,cover:'',metadata:''};
  window.__mf546RecoveryQueueKeys=cache;
 }
 return cache;
}
function mf546QueueStorageKey(kind,account,legacy){
 const cache=mf546QueueKeyCache(account);
 if(cache[kind])return cache[kind];
 let key=legacy;
 try{
  const pointer=JSON.parse(localStorage.getItem('mediaflow-v546-recovery-queue:'+kind+':'+String(account||'local'))||'null');
  const prefix=kind==='cover'?'mf546-cover:':'mf546-metadata:';
  if(pointer&&pointer.account===String(account||'local')&&typeof pointer.key==='string'&&pointer.key.startsWith(prefix))key=pointer.key;
 }catch(_){}
 cache[kind]=key;return key;
}
function mf546QueuePointerKey(kind,account){
 return 'mediaflow-v546-recovery-queue:'+kind+':'+String(account||'local');
}
function mf546Raw(key){
 try{const row=JSON.parse(localStorage.getItem(key)||'null');return row&&typeof row==='object'?row:null;}catch(_){return null;}
}
function mf546Active(row,field){
 return Boolean(row&&Number(row[field])>Date.now());
}
function mf546Clone(value){
 try{return JSON.parse(JSON.stringify(value));}catch(_){return null;}
}
function mf546Sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function mf546Token(){
 return 'mf546-'+Date.now()+'-'+Math.random().toString(36).slice(2);
}
function mf546LeaseRows(account){
 const oldAccount=String(account||'local');
 return {
  process:mf546Raw('mediaflow-v442-recovery-owner:'+oldAccount),
  cover:mf546Raw('mf-v424-owner-'+oldAccount),
  metadata:mf546Raw('mediaflow-v439-lock:'+oldAccount)
 };
}
function mf546Conflict(kind){
 const account=mf439Account(),rows=mf546LeaseRows(account),now=Date.now();
 const processActive=mf546Active(rows.process,'expires');
 const coverActive=mf546Active(rows.cover,'expiry');
 const metadataActive=mf546Active(rows.metadata,'expires');
 let ownerKind='',reason='',expires=0,ownerToken='';
 if(processActive&&(rows.process.token!==MF442.owner||rows.process.kind!==kind)){
  ownerKind=['cover','metadata'].includes(rows.process.kind)?rows.process.kind:'unknown';
  reason='Another recovery worker owns the account process lock';
  expires=Number(rows.process.expires)||0;ownerToken=String(rows.process.token||'');
 }
 if(!reason&&kind==='cover'&&metadataActive&&rows.metadata.token!==MF439.lease){
  ownerKind='metadata';reason='Metadata Recovery still holds its worker lease';
  expires=Number(rows.metadata.expires)||0;ownerToken=String(rows.metadata.token||'');
 }
 if(!reason&&kind==='metadata'&&coverActive&&rows.cover.token!==MF424.leaseToken){
  ownerKind='cover';reason='Cover Recovery still holds its worker lease';
  expires=Number(rows.cover.expiry)||0;ownerToken=String(rows.cover.token||'');
 }
 const target=kind==='cover'?rows.cover:rows.metadata;
 const targetActive=kind==='cover'?coverActive:metadataActive;
 const targetField=kind==='cover'?'expiry':'expires';
 const ownTarget=kind==='cover'?MF424.leaseToken:MF439.lease;
 if(!reason&&targetActive&&target.token!==ownTarget){
  ownerKind=kind;reason='Another tab holds this recovery queue lease';
  expires=Number(target[targetField])||0;ownerToken=String(target.token||'');
 }
 if(!reason)return null;
 return {kind,account,ownerKind:ownerKind||'unknown',reason,expires,
  expiresInSeconds:Math.max(0,Math.ceil((expires-now)/1000)),
  ownerLabel:ownerKind==='cover'?'Cover Recovery':ownerKind==='metadata'?'Metadata Recovery':'Another recovery',
  rows};
}
function mf546CleanupOwnIdleLock(requestedKind){
 if(MF424.running||MF439.working||MF546.busy)return;
 if(MF442.process&&MF442.process!==requestedKind){
  const row=mf546Raw(mf442ProcessKey());
  if(row?.token===MF442.owner)mf442ReleaseProcess(MF442.process);
  try{
   const c=mf546Raw(mf424LeaseKey());
   if(c&&c.token===MF424.leaseToken&&MF424.leaseToken)localStorage.removeItem(mf424LeaseKey());
  }catch(_){}
  try{
   const m=mf546Raw(mf439LeaseKey());
   if(m&&m.token===MF439.lease&&MF439.lease)localStorage.removeItem(mf439LeaseKey());
  }catch(_){}
  MF424.leaseToken='';MF439.lease='';
 }
}
function mf546JobProgress(kind){
 const job=kind==='cover'?MF424.job:(MF439.job||mf439ReadJob());
 if(!job)return {done:0,total:0,label:'No saved queue'};
 const total=Array.isArray(job.ids)?job.ids.length:0;
 const done=Math.max(0,Math.min(total,Math.floor(Number(job.cursor)||0)));
 return {done,total,label:done+' / '+total+' titles',state:String(job.status||'paused')};
}
function mf546ConflictMarkup(kind,info){
 const progress=mf546JobProgress(kind),owner=info?.ownerLabel||'Another recovery';
 const expires=info?.expiresInSeconds>0?'Lease refresh expected in about '+info.expiresInSeconds+' seconds':'Lease expiry is unknown';
 const icon=typeof mf425Icon==='function'?mf425Icon('shield-alert',23):'<span aria-hidden="true">!</span>';
 return '<div class="mf546-overlay" id="mf546-takeover-modal">'+
  '<button class="mf546-backdrop" type="button" aria-label="Close recovery dialog" onclick="App.mf546Close()"></button>'+
  '<section class="mf546-dialog" role="dialog" aria-modal="true" aria-labelledby="mf546-title">'+
   '<header class="mf546-head"><div class="mf546-heading-icon">'+icon+'</div><div class="mf546-heading-copy">'+
    '<small>RECOVERY CONTROL</small><h2 id="mf546-title">Another recovery is using this account</h2>'+
    '<p>Your '+(kind==='cover'?'Cover':'Metadata')+' Recovery queue is saved. Choose how to take control.</p></div>'+
    '<button type="button" class="mf546-close" onclick="App.mf546Close()" aria-label="Close" title="Close">'+
     (typeof mf425Icon==='function'?mf425Icon('x',17):'×')+'</button></header>'+
   '<div class="mf546-summary">'+
    '<div class="mf546-summary-card"><span>LOCK OWNER</span><strong>'+mf424Escape(owner)+(info?.ownerKind&&info.ownerKind!==kind?' active':'')+'</strong><small>Another tab or a previous worker</small></div>'+
    '<div class="mf546-summary-card"><span>YOUR CHECKPOINT</span><strong>'+mf424Escape(progress.label)+'</strong><small>Queue status: '+mf424Escape(progress.state)+'</small></div>'+
   '</div>'+
   '<div class="mf546-lock-note">'+(typeof mf425Icon==='function'?mf425Icon('shield-check',18):'')+
    '<div><strong>Saved progress is preserved</strong><p>MediaFlow will fence the previous worker and keep its queue checkpoint separate before starting this recovery.</p></div></div>'+
   '<div id="mf546-takeover-status" class="mf546-status" role="status" aria-live="polite">'+
    mf424Escape(info?.reason||'A recovery lock is active.')+' '+mf424Escape(expires)+'.</div>'+
   '<div class="mf546-actions" id="mf546-takeover-actions">'+
    '<button type="button" class="mf546-btn mf546-btn-primary" onclick="App.mf546Takeover(\''+kind+'\',\'safe\')">'+
     (typeof mf425Icon==='function'?mf425Icon('play-circle',17):'')+'<span><strong>Resume Safely</strong><small>Request a pause, then resume from the latest checkpoint</small></span></button>'+
    '<button type="button" class="mf546-btn mf546-btn-force" onclick="App.mf546Takeover(\''+kind+'\',\'force\')">'+
     (typeof mf425Icon==='function'?mf425Icon('zap',17):'')+'<span><strong>Force Start</strong><small>Fence the old worker immediately, then wait for any active save</small></span></button>'+
    '<button type="button" class="mf546-btn mf546-btn-cancel" onclick="App.mf546Close()">Cancel</button>'+
   '</div>'+
   '<p class="mf546-footnote">Coordination applies to this browser profile. A forced takeover never clears your saved Library data or silently discards the queue.</p>'+
  '</section></div>';
}
function mf546OpenConflict(kind,info){
 MF546.modalKind=kind;
 document.getElementById('mf546-takeover-modal')?.remove();
 const root=document.createElement('div');root.innerHTML=mf546ConflictMarkup(kind,info);
 if(root.firstElementChild)document.body.appendChild(root.firstElementChild);
}
function mf546Close(){
 if(MF546.busy)return;
 document.getElementById('mf546-takeover-modal')?.remove();
 MF546.modalKind='';
}
function mf546SetStatus(message,tone='info'){
 const root=document.getElementById('mf546-takeover-status');
 if(root){root.className='mf546-status'+(tone==='warning'?' mf546-status-warning':tone==='error'?' mf546-status-error':'');
  root.textContent=String(message||'');}
}
function mf546SetBusy(on,message){
 MF546.busy=Boolean(on);
 const root=document.getElementById('mf546-takeover-modal');
 root?.querySelectorAll('button').forEach(button=>{button.disabled=MF546.busy;});
 if(message)mf546SetStatus(message);
 if(root)root.classList.toggle('mf546-is-busy',MF546.busy);
}
function mf546RenderFinalForce(pending){
 MF546.busy=false;
 const root=document.getElementById('mf546-takeover-modal');
 if(!root)return;
 root.classList.remove('mf546-is-busy');
 root.querySelectorAll('button').forEach(button=>{button.disabled=false;});
 mf546SetStatus('The previous worker has not released its lease yet. No new recovery has started. Force Start Anyway will isolate this checkpoint and replace the remaining lease; an older tab may still be finishing an in-flight save.','warning');
 const actions=root.querySelector('#mf546-takeover-actions');
 if(actions)actions.innerHTML=
  '<button type="button" class="mf546-btn mf546-btn-force" onclick="App.mf546Takeover(\''+pending.kind+'\',\'force-final\')">'+
   (typeof mf425Icon==='function'?mf425Icon('zap',17):'')+
   '<span><strong>Force Start Anyway</strong><small>Confirm takeover despite an unresponsive worker</small></span></button>'+
  '<button type="button" class="mf546-btn mf546-btn-secondary" onclick="App.mf546Takeover(\''+pending.kind+'\',\'continue\')">'+
   (typeof mf425Icon==='function'?mf425Icon('clock',17):'')+
   '<span><strong>Keep Waiting</strong><small>Give the current worker more time to stop</small></span></button>'+
  '<button type="button" class="mf546-btn mf546-btn-cancel" onclick="App.mf546CancelPending()">Cancel</button>';
}
function mf546ReadLegacyActive(account,token){
 const rows=mf546LeaseRows(account),now=Date.now(),active=[];
 if(rows.cover&&Number(rows.cover.expiry)>now&&rows.cover.token!==token)active.push({kind:'cover',token:rows.cover.token,expires:Number(rows.cover.expiry)||0});
 if(rows.metadata&&Number(rows.metadata.expires)>now&&rows.metadata.token!==token)active.push({kind:'metadata',token:rows.metadata.token,expires:Number(rows.metadata.expires)||0});
 return active;
}
async function mf546WaitForLegacyLocks(pending,timeoutMs){
 const deadline=Date.now()+timeoutMs;
 let lastPaint=0;
 while(Date.now()<deadline){
  if(mf439Account()!==pending.account)return false;
  const active=mf546ReadLegacyActive(pending.account,pending.token);
  if(!active.length)return true;
  if(Date.now()-lastPaint>900){
   lastPaint=Date.now();
   mf546SetStatus('Waiting for '+active.map(x=>x.kind==='cover'?'Cover Recovery':'Metadata Recovery').join(' and ')+
    ' to reach a safe checkpoint. Your queue is not being discarded.');
  }
  await mf546Sleep(200);
 }
 return mf546ReadLegacyActive(pending.account,pending.token).length===0;
}
function mf546RequestHandoff(kind,info){
 const payload={account:mf439Account(),requester:MF546.tabId,targetKind:kind,
  activeKind:info?.ownerKind||'',requestedAt:Date.now(),requestId:mf546Token()};
 // Pause this tab too if the conflict is a second recovery running locally.
 if(MF442.process==='cover'&&MF424.running&&MF424.job){
  MF424.job.pauseRequested=true;
  for(const controller of MF424.activeControllers||[])try{controller.abort();}catch(_){}
 }
 if(MF442.process==='metadata'&&MF439.working&&MF439.job){MF439.cancel=true;MF439.controller?.abort();}
 try{localStorage.setItem('mediaflow-v546-handoff:'+payload.account,JSON.stringify(payload));}catch(_){}
 try{if(typeof BroadcastChannel==='function'){const channel=new BroadcastChannel('mediaflow-v546-recovery');
  channel.postMessage(payload);channel.close();}}catch(_){}
}
function mf546ReceiveHandoff(payload){
 if(!payload||payload.account!==mf439Account()||payload.requester===MF546.tabId||
    Date.now()-Number(payload.requestedAt)>60000)return;
 if(MF442.process==='cover'&&MF424.running&&MF424.job){
  MF424.job.pauseRequested=true;
  for(const controller of MF424.activeControllers||[])try{controller.abort();}catch(_){}
  try{mf424Paint();}catch(_){}
 }
 if(MF442.process==='metadata'&&MF439.working&&MF439.job){
  MF439.cancel=true;MF439.controller?.abort();
 }
}
function mf546FenceProcess(kind){
 const token=mf546Token();
 clearInterval(MF442.timer);MF442.timer=null;
 MF442.owner=token;MF442.process=kind;MF442.leaseLost=false;
 try{
  localStorage.setItem(mf442ProcessKey(),JSON.stringify({token,kind,expires:Date.now()+60000,
   tabId:MF546.tabId,version:546,startedAt:Date.now()}));
 }catch(e){throw new Error('The browser could not write the recovery lock. Check site storage permissions.');}
 if(mf546Raw(mf442ProcessKey())?.token!==token)throw new Error('Another tab changed the recovery lock during takeover. Retry once it settles.');
 if(!mf442AcquireProcess(kind))throw new Error('Could not secure the recovery lock. No queue was started.');
 return token;
}
function mf546SameCoverJob(a,b){
 if(!a||!b)return false;
 if(a.id&&b.id)return String(a.id)===String(b.id);
 return String(a.account||'')===String(b.account||'')&&JSON.stringify(a.ids||[])===JSON.stringify(b.ids||[]);
}
function mf546SameMetadataJob(a,b){
 if(!a||!b)return false;
 if(a.startedAt&&b.startedAt)return Number(a.startedAt)===Number(b.startedAt);
 return String(a.account||'')===String(b.account||'')&&JSON.stringify(a.ids||[])===JSON.stringify(b.ids||[]);
}
async function mf546LatestJob(kind,account){
 if(kind==='cover'){
  let current=MF424.job;
  const sourceKey=mf424Key();
  try{const saved=await mf424Storage('get',sourceKey);
   if(saved&&(!current||mf546SameCoverJob(saved,current))&&
      (!current||Number(saved.cursor||0)>=Number(current.cursor||0)))current=saved;
  }catch(_){}
  if(!current||current.account!==account)throw new Error('The saved Cover Recovery queue could not be found. Nothing was discarded.');
  return mf546Clone(current);
 }
 let current=MF439.job||mf439ReadJob();
 const sourceKey=mf439StateKey();
 try{const saved=JSON.parse(localStorage.getItem(sourceKey)||'null');
  if(saved&&(!current||mf546SameMetadataJob(saved,current))&&
     (!current||Number(saved.cursor||0)>=Number(current.cursor||0)))current=saved;
 }catch(_){}
 if(!current||current.account!==account||!Array.isArray(current.ids))throw new Error('The saved Metadata Recovery queue could not be found. Nothing was discarded.');
 return mf546Clone(current);
}
async function mf546IsolateQueue(kind,account,adoptProcessToken=true){
 const snapshot=await mf546LatestJob(kind,account);
 if(!snapshot)throw new Error('Could not copy the saved recovery checkpoint.');
 snapshot.status='paused';
 if(kind==='cover'){
  snapshot.pauseRequested=false;snapshot.stopRequested=false;snapshot.hardStop=false;
  const generation=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const key='mf546-cover:'+account+':'+generation,sourceKey=mf424Key();
  await mf424Storage('put',key,snapshot);
  localStorage.setItem(mf546QueuePointerKey('cover',account),JSON.stringify({
   schema:1,kind:'cover',account,key,previousKey:sourceKey,createdAt:Date.now(),generation,version:546
  }));
  mf546QueueKeyCache(account).cover=key;
  MF424.job=snapshot;MF424.account=account;MF424.running=false;if(adoptProcessToken)MF424.leaseToken=MF442.owner;
  await mf424SaveJob();
 }else{
  snapshot.stopRequested=false;
  const generation=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const key='mf546-metadata:'+account+':'+generation,sourceKey=mf439StateKey();
  localStorage.setItem(key,JSON.stringify(snapshot));
  localStorage.setItem(mf546QueuePointerKey('metadata',account),JSON.stringify({
   schema:1,kind:'metadata',account,key,previousKey:sourceKey,createdAt:Date.now(),generation,version:546
  }));
  mf546QueueKeyCache(account).metadata=key;
  MF439.job=snapshot;MF439.account=account;MF439.working=false;MF439.cancel=false;if(adoptProcessToken)MF439.lease=MF442.owner;
  mf439SaveJob();
 }
 return snapshot;
}
function mf546ClaimLegacy(kind,token,forceNow){
 const account=mf439Account(),rows=mf546LeaseRows(account);
 const foreign=mf546ReadLegacyActive(account,token);
 if(foreign.length&&!forceNow)throw new Error('The previous worker still holds a lease. Keep waiting or explicitly force the takeover.');
 if(kind==='cover'){
  MF424.leaseToken=token;
  localStorage.setItem(mf424LeaseKey(),JSON.stringify({token,expiry:Date.now()+16000}));
  try{if(rows.metadata&&rows.metadata.token!==token)localStorage.removeItem(mf439LeaseKey());}catch(_){}
  MF439.lease='';
 }else{
  MF439.lease=token;
  localStorage.setItem(mf439LeaseKey(),JSON.stringify({token,expires:Date.now()+45000}));
  try{if(rows.cover&&rows.cover.token!==token)localStorage.removeItem(mf424LeaseKey());}catch(_){}
  MF424.leaseToken='';
 }
}
async function mf546FinalizeTakeover(pending,forceNow){
 if(!pending||mf439Account()!==pending.account)throw new Error('The account changed during recovery handoff. Reload and resume the saved queue.');
 const current=mf546Raw(mf442ProcessKey());
 if(current?.token!==pending.token||current?.kind!==pending.kind)
  throw new Error('Recovery ownership changed during takeover. No new worker was started.');
 await mf546IsolateQueue(pending.kind,pending.account);
 mf546ClaimLegacy(pending.kind,pending.token,forceNow);
 if(!mf442ProcessOwned(pending.kind))throw new Error('Recovery ownership could not be verified after takeover.');
 const kind=pending.kind;
 MF546.pending=null;MF546.busy=false;
 document.getElementById('mf546-takeover-modal')?.remove();MF546.modalKind='';
 showToast((kind==='cover'?'Cover':'Metadata')+' Recovery resumed from its isolated checkpoint.');
 if(kind==='cover'){
  MF424.job.pauseRequested=false;MF424.job.stopRequested=false;MF424.job.hardStop=false;
  await mf424Run();
 }else{
  MF439.cancel=false;MF439.job.stopRequested=false;MF439.job.status='paused';mf439SaveJob();mf439PaintJob();
  await mf439RunBatch();
 }
}
async function mf546Takeover(kind,mode='safe'){
 if(MF546.busy)return;
 if(mode==='force-final'){
  if(!MF546.pending||MF546.pending.kind!==kind)return;
  const pending=MF546.pending;mf546SetBusy(true,'Applying the confirmed forced takeover and isolating the saved queue…');
  try{await mf546FinalizeTakeover(pending,true);}
  catch(e){MF546.busy=false;mf546SetBusy(false);mf546SetStatus(String(e?.message||e),'error');}
  return;
 }
 if(mode==='continue'){
  const pending=MF546.pending;if(!pending||pending.kind!==kind)return;
  mf546SetBusy(true,'Still waiting for the previous worker to release its lease…');
  const released=await mf546WaitForLegacyLocks(pending,55000);
  if(released){try{await mf546FinalizeTakeover(pending,false);}catch(e){MF546.busy=false;mf546SetBusy(false);mf546SetStatus(String(e?.message||e),'error');}}
  else mf546RenderFinalForce(pending);
  return;
 }
 const account=mf439Account();
 const info=mf546Conflict(kind);
 if(!info){
  // The other worker may have finished while the dialog was open. Refresh
  // from durable storage before resuming so this tab never restarts an older cursor.
  let latest;
  try{latest=await mf546LatestJob(kind,account);}
  catch(e){mf546SetStatus('The latest saved checkpoint could not be reloaded. No recovery was started; retry or reload the page.','error');return;}
  if(kind==='cover'){MF424.job=latest;MF424.account=account;MF424.job.pauseRequested=false;MF424.job.stopRequested=false;}
  else{MF439.job=latest;MF439.account=account;MF439.job.status='paused';MF439.cancel=false;}
  mf546Close();
  if(kind==='cover')return mf424Run();
  return mf439RunBatch();
 }
 const before=mf546LeaseRows(account);
 const pending={kind,account,token:'',ownerKind:info.ownerKind,startedAt:Date.now(),
  oldProcess:before.process,oldCover:before.cover,oldMetadata:before.metadata,mode};
 MF546.pending=pending;
 mf546SetBusy(true,mode==='safe'?'Requesting a safe handoff from the other recovery tab…':'Fencing the previous recovery worker before takeover…');
 try{
  mf546RequestHandoff(kind,info);
  if(mode==='safe')await mf546Sleep(1200);
  if(mf439Account()!==account)throw new Error('The signed-in account changed. The saved recovery queue was not modified.');
  pending.token=mf546FenceProcess(kind);
  mf546SetStatus('Previous worker fenced. Waiting for any active provider request or Library save to finish…');
  const released=await mf546WaitForLegacyLocks(pending,55000);
  if(!released){mf546RenderFinalForce(pending);return;}
  await mf546FinalizeTakeover(pending,false);
 }catch(e){
  MF546.busy=false;MF546.lastError=String(e?.message||e);mf546SetBusy(false);
  mf546SetStatus(MF546.lastError,'error');
 }
}
function mf546CancelPending(){
 if(MF546.busy)return;
 const pending=MF546.pending;
 if(pending&&pending.token&&mf442ProcessOwned(pending.kind))mf442ReleaseProcess(pending.kind);
 MF546.pending=null;MF546.busy=false;MF546.lastError='';
 document.getElementById('mf546-takeover-modal')?.remove();MF546.modalKind='';
 showToast('Takeover cancelled. Saved recovery checkpoints remain available.');
}
function mf546ReceiveStorageEvent(event){
 if(event?.key&&event.key.startsWith('mediaflow-v546-handoff:')&&event.newValue){
  try{mf546ReceiveHandoff(JSON.parse(event.newValue));}catch(_){}
 }
}
try{window.addEventListener('storage',mf546ReceiveStorageEvent);}catch(_){}
try{if(typeof BroadcastChannel==='function'){
 const channel=new BroadcastChannel('mediaflow-v546-recovery');
 channel.addEventListener('message',event=>mf546ReceiveHandoff(event.data));
}}catch(_){}

async function mf546ShowBlockedStart(kind,info){
 const account=mf439Account();
 if(kind==='cover')try{mf424CloseModal();}catch(_){}
 let saved=null;
 try{saved=await mf546LatestJob(kind,account);}catch(_){}
 if(saved&&Array.isArray(saved.ids)&&Number(saved.cursor||0)<saved.ids.length){
  if(kind==='cover'){MF424.job=saved;MF424.account=account;MF424.running=false;}
  else{MF439.job=saved;MF439.account=account;MF439.working=false;MF439.cancel=false;}
  mf546OpenConflict(kind,info);return true;
 }
 showToast('Another recovery is active. Finish it or resume an existing '+(kind==='cover'?'Cover':'Metadata')+' Recovery queue before creating a new one.');
 return false;
}
async function mf546CheckNewQueueStart(kind){
 mf546CleanupOwnIdleLock(kind);
 const info=mf546Conflict(kind);
 if(!info)return true;
 await mf546ShowBlockedStart(kind,info);
 return false;
}
async function mf546PrepareNewQueue(kind){
 const account=mf439Account();
 mf546CleanupOwnIdleLock(kind);
 let info=mf546Conflict(kind);
 if(info){await mf546ShowBlockedStart(kind,info);return false;}
 if(!mf442AcquireProcess(kind)){
  info=mf546Conflict(kind);
  if(info)await mf546ShowBlockedStart(kind,info);
  else showToast('Recovery ownership could not be secured. No new queue was created.');
  return false;
 }
 let acquired=false;
 try{acquired=kind==='cover'?mf424Lease():mf439AcquireLease();}catch(_){}
 if(!acquired){
  mf442ReleaseProcess(kind);
  info=mf546Conflict(kind);
  if(info)await mf546ShowBlockedStart(kind,info);
  else showToast('Recovery storage is busy. No new queue was created.');
  return false;
 }
 // Rotate away from any queue key an older tab may have cached, even if its
 // lease just expired. Preserve the previous queue before a confirmed replace.
 try{
  let prior=null;
  try{prior=await mf546LatestJob(kind,account);}catch(_){}
  if(prior){
   if(kind==='cover')MF424.job=prior;else MF439.job=prior;
   await mf546IsolateQueue(kind,account,false);
  }
 }catch(e){
  if(kind==='cover')mf424Release();else mf439ReleaseLease();
  mf442ReleaseProcess(kind);
  showToast('MediaFlow could not preserve the previous recovery checkpoint. The new queue was not created.');
  return false;
 }
 return true;
}
function mf546AbortPreparedQueue(kind){
 try{if(kind==='cover')mf424Release();else mf439ReleaseLease();}catch(_){}
 try{if(MF442.process===kind)mf442ReleaseProcess(kind);}catch(_){}
}
const mf546BaseConfirmMetadata=mf439ConfirmBatch;
mf439ConfirmBatch=async function(){
 if(MF439.working)return mf546BaseConfirmMetadata.apply(this,arguments);
 if(!await mf546CheckNewQueueStart('metadata'))return;
 const previous=mf442NormalizeJob(MF439.job||mf439ReadJob());
 if(previous&&previous.cursor<previous.ids.length&&previous.status!=='completed'){
  if(!await mf444Confirm('Replace unfinished recovery?',
   'A saved metadata queue is unfinished. Replacing it discards pending work, but previously recovered fields remain saved.',
   'Replace Queue',true,previous.ids.length-previous.cursor,'metadata'))return;
 }
 const ids=mf439BatchCandidates();
 if(!ids.length){showToast('Check Library titles first. Batches require an explicit selection.');return;}
 if(!mf439Preferences().enabled.length){showToast('Enable at least one metadata provider.');return;}
 if(!await mf444Confirm('Start Metadata Recovery?',
  'MediaFlow will search enabled metadata providers and fill only eligible missing fields. Rate limits can extend processing time.',
  'Start Recovery',false,ids.length,'metadata'))return;
 if(!await mf546PrepareNewQueue('metadata'))return;
 const previousJob=MF439.job;
 MF439.job={schema:1,account:mf439Account(),ids,cursor:0,changed:0,completed:0,errors:[],startedAt:Date.now(),status:'running'};
 MF439.account=mf439Account();
 try{mf439SaveJob();}
 catch(e){MF439.job=previousJob;mf546AbortPreparedQueue('metadata');
  showToast('Metadata Recovery could not save its initial checkpoint. The previous queue remains available.');return;}
 mf439RunBatch();
};
App.mf439ConfirmBatch=mf439ConfirmBatch;

const mf546BaseRunCover=mf424Run;
mf424Run=async function(){
 if(MF424.running||!MF424.job)return mf546BaseRunCover.apply(this,arguments);
 mf546CleanupOwnIdleLock('cover');
 const info=mf546Conflict('cover');
 if(info){
  // Do not checkpoint this tab's possibly stale in-memory copy while another
  // worker owns the queue. The owner or the takeover path writes the latest
  // durable cursor after the old lease is released.
  MF424.job.pauseRequested=true;mf424State('paused');
  mf546OpenConflict('cover',info);return;
 }
 return mf546BaseRunCover.apply(this,arguments);
};
const mf546BaseRunMetadata=mf439RunBatch;
mf439RunBatch=async function(){
 if(MF439.working||!MF439.job)return mf546BaseRunMetadata.apply(this,arguments);
 mf546CleanupOwnIdleLock('metadata');
 const info=mf546Conflict('metadata');
 if(info){
  // Avoid overwriting a newer checkpoint from the worker that owns the lock.
  MF439.cancel=false;MF439.job.status='paused';mf439PaintJob();
  mf546OpenConflict('metadata',info);return;
 }
 return mf546BaseRunMetadata.apply(this,arguments);
};
Object.assign(App,{mf546Takeover,mf546Close:mf546Close,mf546CancelPending});
window.MediaFlowV546=Object.freeze({
 version:546,conflict:mf546Conflict,queueKey:mf546QueueStorageKey,
 open:mf546OpenConflict,takeover:mf546Takeover,receiveHandoff:mf546ReceiveHandoff,
 readLocks:mf546LeaseRows,waitForLegacyLocks:mf546WaitForLegacyLocks
});
