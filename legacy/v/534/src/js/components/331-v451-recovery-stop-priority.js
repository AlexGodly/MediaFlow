/* MediaFlow v451 — explicit recovery stopping and safe priority handoff.
 * Priority operates on saved title IDs, never snapshots or writes Library records.
 * Active jobs drain at the current title boundary before their checkpoint moves.
 */
const MF451_VERSION=451;
const MF451={intent:null,preparing:false,restoring:false,checking:false,preview:false,journal:null,activeAccount:mf439Account()};
function mf451Key(){return 'mediaflow-v451-priority:'+mf439Account();}
function mf451CoverKey(){return 'mf451-suspended-cover:'+mf439Account();}
function mf451Read(){
 try{const x=JSON.parse(localStorage.getItem(mf451Key())||'null');
  return x?.account===mf439Account()&&x?.schema===1?x:null;
 }catch(_){return null;}
}
function mf451Store(j){
 MF451.journal=j;
 try{if(j)localStorage.setItem(mf451Key(),JSON.stringify(j));
  else localStorage.removeItem(mf451Key());
 }catch(e){console.warn('Priority journal unavailable',e);showToast('Could not save the priority checkpoint.');return false;}
 return true;
}
function mf451SavedId(id){
 const key=String(id||'');
 return key&&(S.library||[]).some(t=>String(t?.id)===key)?key:'';
}
function mf451CoverPending(job){return !!(job&&job.account===mf424Account()&&
 Array.isArray(job.ids)&&job.cursor<job.ids.length&&!['complete','stopped'].includes(job.status));}
function mf451MetaPending(job){return !!(job&&job.account===mf439Account()&&
 Array.isArray(job.ids)&&job.cursor<job.ids.length&&!['completed','stopped'].includes(job.status));}
function mf451Wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function mf451Drain(timeout=90000){
 const deadline=Date.now()+timeout;
 while((MF424.running||MF439.working||MF442.process)&&Date.now()<deadline)await mf451Wait(100);
 return !MF424.running&&!MF439.working&&!MF442.process;
}
async function mf451PauseActive(){
 const owner=mf442ProcessLease();
 if(owner&&owner.token!==MF442.owner){
  showToast('Another tab owns recovery. Stop or pause that tab before prioritizing a title.');return false;
 }
 if(MF424.job&&MF424.running){
  MF424.job.pauseRequested=true;
  await mf424SaveJob();
 }
 if(MF439.working){
  MF439.cancel=true;
  if(MF439.job){MF439.job.status='paused';mf439SaveJob();}
  MF439.controller?.abort();
 }
 if(!await mf451Drain()){
  showToast('The current provider request has not finished. Its checkpoint is safe; retry the priority action after it stops.');
  return false;
 }
 if(MF424.job&&MF424.job.status==='running'){
  MF424.job.status='paused';MF424.job.pauseRequested=true;await mf424SaveJob();
 }
 if(MF439.job&&MF439.job.status==='running'){
  MF439.job.status='paused';mf439SaveJob();
 }
 return true;
}
async function mf451Prepare(kind,id){
 id=mf451SavedId(id);
 if(!id||!['cover','metadata','both'].includes(kind))return false;
 if(MF451.preparing||MF451.restoring){showToast('Recovery queue handoff is already in progress.');return false;}
 if(MF451.journal||mf451Read()){showToast('A priority title is already active. Finish or resume its interrupted jobs first.');return false;}
 MF451.preparing=true;
 let savedCover=false,savedMeta=false,created=false;
 const wasCover=MF424.running,wasMetadata=MF439.working;
 try{
  if(!await mf451PauseActive())return false;
  const cover=MF424.job,metadata=MF439.job||mf439ReadJob();
  if(kind!=='metadata'&&mf451CoverPending(cover)){
   // Use the recovery IndexedDB, not localStorage (100k title queues can
   // exceed browser localStorage limits). Save before replacing main job.
   const saved={...cover,status:'paused',pauseRequested:true,stopRequested:false,hardStop:false};
   await mf424Storage('put',mf451CoverKey(),saved);savedCover=true;
  }
  const oldMeta=kind==='both'&&mf451MetaPending(metadata)?{
   ...metadata,status:'paused',stopRequested:false
  }:null;
  savedMeta=!!oldMeta;
  const combo=kind==='both'?mf447Combo():null;
  const journal={schema:1,account:mf439Account(),kind,id,started:Date.now(),
   coverBackup:savedCover,metadataBackup:oldMeta,combinedBackup:combo,
   autoResume:true,coverWasRunning:wasCover,metadataWasRunning:wasMetadata,
   priorityCoverId:'',state:'configuring'};
  if(!mf451Store(journal))throw Error('Priority journal could not be persisted');
  created=true;
  if(savedCover){MF424.job=null;await mf424Storage('delete',mf424Key());}
  if(savedMeta){MF439.job=null;localStorage.removeItem(mf439StateKey());}
  if(combo&&combo.stage!=='completed')mf447WriteCombo(null);
  mf441Paint();return true;
 }catch(err){
  console.warn('Priority handoff failed; preserving original queue',err);
  if(savedCover&&!created)try{await mf424Storage('delete',mf451CoverKey());}catch(_){}
  showToast('Could not safely interrupt recovery. Existing checkpoints were preserved.');
  return false;
 }finally{MF451.preparing=false;}
}
function mf451Ready(j){
 if(!j||j.account!==mf439Account()||MF424.running||MF439.working||MF442.process)return false;
 if(j.kind==='metadata')return !document.getElementById('mf439-recovery-modal');
 if(j.kind==='both')return mf447Combo()?.stage==='completed';
 if(!j.priorityCoverId)return false;
 return MF424.job?.id===j.priorityCoverId&&
  MF424.job.status==='complete'&&Number(MF424.job.pending||0)===0;
}
async function mf451Restore({force=false}={}){
 const j=MF451.journal||mf451Read();
 if(!j||MF451.restoring||MF451.preparing)return false;
 if(!force&&!mf451Ready(j))return false;
 if(MF424.running||MF439.working||MF442.process)return false;
 MF451.restoring=true;
 try{
  if(j.coverBackup){
   const backup=await mf424Storage('get',mf451CoverKey());
   if(!backup||backup.account!==mf424Account())throw Error('Original cover checkpoint unavailable');
   if(MF424.job&&MF424.job.id!==backup.id)
    await mf424Storage('put','mf451-last-priority-report:'+mf439Account(),MF424.job);
   MF424.job={...backup,status:'paused',stopRequested:false,
    pauseRequested:true,hardStop:false};
   await mf424SaveJob();
   await mf424Storage('delete',mf451CoverKey());
  }
  if(j.metadataBackup){
   MF439.job={...j.metadataBackup,status:'paused',stopRequested:false};
   mf439SaveJob();
  }
  if(j.kind==='both'){
   mf447WriteCombo(j.combinedBackup?.stage!=='completed'?j.combinedBackup:null);
  }
  mf451Store(null);
  const shouldResume=force?true:j.autoResume;
  if(shouldResume&&j.coverWasRunning&&MF424.job&&
     MF424.job.cursor<MF424.job.ids.length){
   MF424.job.pauseRequested=false;
   await mf424SaveJob();App.mf424Resume();
  }else if(shouldResume&&j.metadataWasRunning&&MF439.job&&
     MF439.job.cursor<MF439.job.ids.length){
   App.mf439Resume();
  }else if(shouldResume&&j.kind==='metadata'){
   if(j.coverWasRunning&&MF424.job)App.mf424Resume();
   else if(j.metadataWasRunning&&MF439.job)App.mf439Resume();
  }
  showToast('Priority recovery finished. Interrupted checkpoints restored'+(shouldResume?' and eligible work resumed.':'.'));
  mf441Paint();return true;
 }catch(err){console.warn('Priority recovery restore failed',err);
  showToast('Priority completed, but restoring an interrupted checkpoint failed. Retry Resume Interrupted.');return false;
 }finally{MF451.restoring=false;}
}
function mf451ScheduleRestore(){
 if(MF451.checking||MF451.restoring||MF451.preparing)return;
 const j=MF451.journal||mf451Read();
 if(!j||!j.autoResume||!mf451Ready(j))return;
 MF451.checking=true;
 queueMicrotask(()=>{MF451.checking=false;void mf451Restore();});
}
async function mf451Stop(kind,{confirm=true}={}){
 if(!['cover','metadata','all'].includes(kind))return;
 const hasCover=(kind==='all'||kind==='cover')&&!!MF424.job,
 hasMetadata=(kind==='all'||kind==='metadata')&&!!MF439.job;
 if(!hasCover&&!hasMetadata&&!MF451.journal){showToast('No recovery jobs to stop.');return;}
 if(confirm&&!await mf444Confirm(kind==='all'?'Stop all recoveries?':'Stop '+kind+' recovery?',
  'Stop requesting new provider results, abort active requests when possible and preserve completed Library changes. Unprocessed titles will not restart automatically. Checkpoints remain available for manual resumption.',
  kind==='all'?'Stop All':'Stop Recovery',true,0,kind==='metadata'?'metadata':'cover'))return;
 // Disable automatic priority handoff before stopping: completing a job must
 // never silently restart something after the user pressed Stop.
 const j=MF451.journal||mf451Read();
 if(j){j.autoResume=false;j.state='stopped';mf451Store(j);}
 if(hasCover){
  const job=MF424.job;job.stopRequested=true;job.pauseRequested=false;job.hardStop=true;
  for(const controller of MF424.activeControllers||[])try{controller.abort();}catch(_){}
  if(!MF424.running)job.status='stopped';
  await mf424SaveJob();
 }
 if(hasMetadata){
  MF439.cancel=true;MF439.controller?.abort();
  MF439.job.stopRequested=true;
  if(!MF439.working)MF439.job.status='stopped';
  mf439SaveJob();
 }
 if(kind==='all'){
  const combo=mf447Combo();
  if(combo&&combo.stage!=='completed')mf447WriteCombo(null);
 }
 mf424Paint();mf439PaintJob();mf441Paint();
 showToast('Recovery stopping. Finished work remains saved; pending work will not resume automatically.');
}
async function mf451ClearAll(){
 if(!await mf444Confirm('Discard all unfinished recovery queues?',
  'Stop current recovery and delete unfinished cover, metadata, combined and interrupted priority checkpoints. Previously saved Library artwork and metadata will remain unchanged.',
  'Discard Queues',true,0,'cover'))return;
 await mf451Stop('all',{confirm:false});
 if(!await mf451Drain()){showToast('A provider request is still finishing. Clear queues once it stops.');return;}
 MF424.job=null;MF439.job=null;MF451.intent=null;mf451Store(null);
 try{await mf424Storage('delete',mf424Key());
  await mf424Storage('delete',mf451CoverKey());}catch(e){console.warn('Unable to clear IndexedDB recovery queue',e);}
 try{localStorage.removeItem(mf439StateKey());}catch(_){}
 mf447WriteCombo(null);mf424Paint();mf439PaintJob();mf441Paint();
 showToast('Pending recovery queues discarded. Already saved Library changes were preserved.');
}
const mf451BaseRunCover=mf424Run;
mf424Run=async function(){
 const result=await mf451BaseRunCover.apply(this,arguments);
 mf451ScheduleRestore();return result;
};
const mf451BaseRunMetadata=mf439RunBatch;
mf439RunBatch=async function(){
 const result=await mf451BaseRunMetadata.apply(this,arguments);
 mf451ScheduleRestore();return result;
};
const mf451BaseResumeMetadata=mf439Resume;
mf439Resume=function(){
 if(!MF439.job)MF439.job=mf439ReadJob();
 if(MF439.job){MF439.job.stopRequested=false;mf439SaveJob();}
 return mf451BaseResumeMetadata.apply(this,arguments);
};
App.mf439Resume=mf439Resume;
const mf451BaseResumeCover=App.mf424Resume;
App.mf424Resume=async function(){
 if(MF424.job){MF424.job.hardStop=false;await mf424SaveJob();}
 return mf451BaseResumeCover.apply(this,arguments);
};
const mf451BaseOpen=App.mf447Open;
App.mf447Open=function(kind='cover',options={}){
 const id=mf451SavedId(options?.id);
 MF451.intent=id?{kind,id}:null;
 return mf451BaseOpen.apply(this,arguments);
};
const mf451BaseStartCover=App.mf424Start;
App.mf424Start=async function(){
 const intent=MF451.intent,oneId=mf451SavedId(MF425?.oneId);
 const priority=oneId&&intent?.id===oneId&&intent.kind!=='metadata';
 const journal=MF451.journal||mf451Read();
 if(priority&&!journal){
  if(!await mf451Prepare(intent.kind==='both'?'both':'cover',oneId))return;
 }
 const active=MF451.journal||mf451Read(),before=MF424.job?.id||'';
 const result=await mf451BaseStartCover.apply(this,arguments);
 if(priority&&active&&MF424.job?.id&&MF424.job.id!==before){
  active.priorityCoverId=MF424.job.id;active.state='cover';mf451Store(active);
 }else if(priority&&active&&!MF424.job){
  showToast('Priority cover job was not started. Resume Interrupted when ready.');
 }
 mf451ScheduleRestore();return result;
};
const mf451BaseCombined=App.mf447StartCombined;
App.mf447StartCombined=async function(){
 const ids=mf447ScopeSnapshot(),id=ids.length===1?mf451SavedId(ids[0]):'';
 if(id){
  MF451.intent={kind:'both',id};
  if(!await mf451Prepare('both',id))return;
 }
 const result=mf451BaseCombined.apply(this,arguments);
 mf441Paint();return result;
};
const mf451BaseStartWorkspace=App.mf445Start;
App.mf445Start=async function(action){
 if(action==='preview'){
  const ids=mf446ScopeIds('metadata'),id=ids.length===1?mf451SavedId(ids[0]):'';
  if(id){
   MF451.intent={kind:'metadata',id};
   if(!await mf451Prepare('metadata',id))return;
   MF451.preview=true;
  }
 }
 return mf451BaseStartWorkspace.apply(this,arguments);
};
const mf451BaseClosePreview=mf439Close;
mf439Close=function(){
 const result=mf451BaseClosePreview.apply(this,arguments);
 if(MF451.preview){MF451.preview=false;mf451ScheduleRestore();}
 return result;
};
App.mf439Close=mf439Close;
const mf451BaseReviewSave=mf424ReviewSave;
mf424ReviewSave=async function(){
 const result=await mf451BaseReviewSave.apply(this,arguments);
 mf451ScheduleRestore();return result;
};
const mf451BasePaintCover=mf424Paint;
mf424Paint=function(){
 const result=mf451BasePaintCover.apply(this,arguments);
 mf451ScheduleRestore();return result;
};
const mf451BasePaintMetadata=mf439PaintJob;
mf439PaintJob=function(){
 const result=mf451BasePaintMetadata.apply(this,arguments);
 mf451ScheduleRestore();return result;
};
const mf451BaseCoverRow=mf441CoverRow;
mf441CoverRow=function(s){
 const html=mf451BaseCoverRow.apply(this,arguments);
 const j=s.cover;
 if(!j||['complete','stopped'].includes(j.status))return html;
 return html.replace('</div></article>','<button type="button" class="mf451-stop" onclick="App.mf451Stop(&#39;cover&#39;)">'+mf425Icon('square',15)+' Stop</button></div></article>');
};
const mf451BaseMetadataRow=mf441MetadataRow;
mf441MetadataRow=function(s){
 const html=mf451BaseMetadataRow.apply(this,arguments);
 const j=s.metadata;
 if(!j)return html;
 if(j.status==='stopped')return html.replace('</div></article>','<button type="button" class="mf451-resume" onclick="App.mf439Resume()">'+mf425Icon('play',15)+' Resume</button></div></article>').replace('No active job','Stopped safely · pending titles preserved');
 if(j.status==='completed')return html;
 return html.replace('</div></article>','<button type="button" class="mf451-stop" onclick="App.mf451Stop(&#39;metadata&#39;)">'+mf425Icon('square',15)+' Stop</button></div></article>');
};
const mf451BaseWidget=mf441WidgetHtml;
mf441WidgetHtml=function(prefs,state){
 const html=mf451BaseWidget.apply(this,arguments);
 const journal=MF451.journal||mf451Read();
 const controls='<button type="button" class="mf451-stop" onclick="App.mf451Stop(&#39;all&#39;)">'+
  mf425Icon('square',15)+' Stop All</button>'+
  (journal?'<button type="button" class="mf451-resume" onclick="App.mf451ResumeInterrupted()">'+
   mf425Icon('play',15)+' Resume Interrupted</button>':'')+
  '<button type="button" class="mf451-discard" onclick="App.mf451ClearAll()">'+
   mf425Icon('trash2',15)+' Discard Queues</button>';
 return html.replace(/(<div class="mf441-widget-foot[^"]*">)/,'$1'+controls);
};
const mf451BaseWorkspace=mf441WorkspaceHtml;
mf441WorkspaceHtml=function(){
 const html=mf451BaseWorkspace.apply(this,arguments);
 const j=MF451.journal||mf451Read();
 const controls='<section class="mf451-workspace-controls">'+
  '<strong>'+mf425Icon('listOrdered',17)+' Recovery queue control</strong>'+
  '<p>Single-title Cover, Metadata and Recover Both operations take priority. Interrupted jobs keep their original checkpoints and can resume when priority work finishes.</p>'+
  '<div><button type="button" class="btn btn-ghost mf451-stop" onclick="App.mf451Stop(&#39;all&#39;)">'+mf425Icon('square',15)+' Stop All Recoveries</button>'+
  (j?'<button type="button" class="btn btn-ghost" onclick="App.mf451ResumeInterrupted()">'+mf425Icon('play',15)+' Resume Interrupted</button>':'')+
  '<button type="button" class="btn btn-ghost mf451-discard" onclick="App.mf451ClearAll()">'+mf425Icon('trash2',15)+' Discard Queues</button></div>'+
  (j?'<small>Priority title: '+mf424Escape(mf451SavedId(j.id)?mf439Item(j.id)?.title||'Saved title':'Unavailable title')+
  ' · '+mf424Escape(j.kind)+' · interrupted checkpoints preserved</small>':'')+
  '</section>';
 const last=html.lastIndexOf('</section>');
 return last<0?html:html.slice(0,last)+controls+html.slice(last);
};
async function mf451ResumeInterrupted(){
 const j=MF451.journal||mf451Read();
 if(!j){showToast('No interrupted recovery checkpoints to resume.');return;}
 if(MF424.running||MF439.working||MF442.process){
  showToast('Finish or stop the current priority process before resuming older jobs.');return;
 }
 if(!mf451Ready(j)){
  if(!await mf444Confirm('End priority recovery and resume interrupted jobs?',
   'The priority run has not finished yet. Its already saved title changes will remain, but unprocessed priority items will be cancelled to restore the older queue.',
   'Resume Older Jobs',true,0,j.kind==='metadata'?'metadata':'cover'))return;
  if(j.kind==='cover'||j.kind==='both')await mf451Stop('cover',{confirm:false});
  if(j.kind==='metadata')MF439.controller?.abort();
  if(!await mf451Drain()){showToast('Waiting for the current provider request to exit safely. Try Resume Interrupted again.');return;}
 }
 return mf451Restore({force:true});
}
Object.assign(App,{mf451Stop,mf451ClearAll,mf451ResumeInterrupted});
window.MediaFlowV451=Object.freeze({
 version:451,priority:()=>MF451.journal||mf451Read(),
 stop:mf451Stop,prepare:mf451Prepare,restore:mf451Restore,
 controls:()=>mf441WidgetHtml(mf441Prefs(),mf441State())
});
MF451.journal=mf451Read();
