/* MediaFlow v456 — honest recovery startup and checkpoint feedback.
 * A visible stage bar is not an invented provider ETA: it reflects completed
 * validation/confirmation/checkpoint steps. Actual title progress belongs to
 * the saved v424/v442 jobs and Background Processes.
 */
const MF456Launch={stage:'idle',kind:'cover',detail:'',checkedAt:0,startedAt:0,watch:null};
const MF456_LAUNCH_STAGES={idle:0,validating:1,confirming:2,stopping:3,queue:4,
 starting:5,queued:5,running:5,paused:5,error:0,cancelled:0};
function mf456LaunchMarkup(){
 const x=MF456Launch;
 const total=5,done=MF456_LAUNCH_STAGES[x.stage]||0;
 const busy=['validating','confirming','stopping','queue','starting','queued'].includes(x.stage);
 return '<aside class="mf456-launch-status '+(x.stage==='error'?'has-error':'')+
 '" id="mf456-launch-status" role="status" aria-live="polite" aria-label="Recovery launch status">'+
 '<div class="mf456-launch-heading"><strong>'+mf425Icon(x.stage==='error'?'shield':busy?'layers':'check',16)+
 ' '+(x.stage==='error'?'Could not start recovery':x.stage==='cancelled'?'Recovery cancelled':
  x.stage==='running'?'Recovery running':x.stage==='paused'?'Recovery paused':'Starting '+(x.kind==='both'?'Cover + Metadata':x.kind==='cover'?'Cover':'Metadata')+' Recovery')+
 '</strong><button type="button" data-v225-iconified="1" onclick="App.mf456DismissLaunch()" aria-label="Dismiss recovery status">'+
 mf425Icon('x',15)+'</button></div>'+
 '<progress value="'+done+'" max="'+total+'" aria-label="Recovery launch steps complete"></progress>'+
 '<div class="mf456-launch-info"><span>'+mf456Escape(x.detail)+'</span><small>'+
 (x.stage==='running'?'Title progress is shown in Background Processes.':busy?'Startup step '+done+' / '+total:
 x.stage==='error'?'Check scope, provider access and the current job lease.':'')+'</small></div></aside>';
}
function mf456LaunchStage(stage,detail,kind='cover'){
 MF456Launch.stage=stage;
 MF456Launch.kind=kind;
 MF456Launch.detail=String(detail||'');
 MF456Launch.checkedAt=Date.now();
 if(stage==='validating'){MF456Launch.startedAt=Date.now();if(MF456Launch.watch)clearInterval(MF456Launch.watch);MF456Launch.watch=null;}
 let node=document.getElementById('mf456-launch-status');
 if(!node){
  node=document.createElement('div');
  node.id='mf456-launch-status-host';
  node.className='mf456-launch-status-host';
  document.body?.append(node);
 }
 const host=document.getElementById('mf456-launch-status-host')||node;
 host.innerHTML=mf456LaunchMarkup();
 // Keep the progress visible in the workspace itself while the dialog is
 // still open, but use the floating status once launching closes it.
 const pane=document.querySelector('#mf445-workspace [data-mf456-launch-hint]');
 if(pane)pane.textContent=MF456Launch.detail;
}
function mf456DismissLaunch(){
 if(MF456Launch.watch){clearInterval(MF456Launch.watch);MF456Launch.watch=null;}
 document.getElementById('mf456-launch-status-host')?.remove();
 MF456Launch.stage='idle';
}
function mf456WatchRecovery(kind){
 if(MF456Launch.watch)clearInterval(MF456Launch.watch);
 let ticks=0;
 MF456Launch.watch=setInterval(()=>{
  ticks++;
  const cover=MF424.job,metadata=MF439.job;
  const job=kind==='metadata'?metadata:cover;
  const working=kind==='metadata'?MF439.working:MF424.running;
  const state=String(job?.status||'');
  const count=Number(job?.cursor)||0,total=Number(job?.ids?.length)||0;
  if(working&&state==='running'||kind==='both'&&!cover&&MF439.working){
   const active=kind==='both'&&!cover?metadata:job;
   mf456LaunchStage('running','Provider processing started. '+Number(active?.cursor||0)+
    ' / '+Number(active?.ids?.length||0)+' titles committed.',kind);
   clearInterval(MF456Launch.watch);MF456Launch.watch=null;
  }else if(['paused','stopped','other-tab','waiting-part'].includes(state)){
   mf456LaunchStage('paused','New queue is '+state+' at '+count+' / '+total+
    ' titles. Review Background Processes for recovery/resume.',kind);
   clearInterval(MF456Launch.watch);MF456Launch.watch=null;
  }else if(ticks>=36){
   mf456LaunchStage('paused','Queue is saved, but no active processing was confirmed after startup. Status: '+
    (state||'waiting')+'. Open Background Processes to resume or inspect locks.',kind);
   clearInterval(MF456Launch.watch);MF456Launch.watch=null;
  }else if(ticks%3===0){
   mf456LaunchStage('queued','Saved checkpoint. Current state: '+(state||'initializing')+
    '; '+count+' / '+total+' titles. Waiting for actual provider execution.',kind);
  }
 },500);
}
function mf456ExplainScope(kind){
 const root=document.getElementById('mf445-workspace');
 if(!root)return;
 const pane=root.querySelector('[data-mf445-panel]'),mode=kind==='both'?'both':kind;
 const ids=mode==='both'?mf447ScopeSnapshot():mf446ScopeIds(mode);
 const cover=mf455Enabled('cover').length,metadata=mf455Enabled('metadata').length;
 const ready=mode==='both'?cover>0&&metadata>0:mode==='metadata'?metadata>0:cover>0;
 const msg=!ids.length?'No titles in scope — choose a scope or check titles in Library.':
 !ready?'No usable providers selected — enable at least one configured '+(mode==='both'?'provider for each stage':'provider')+'.':
 ids.length+' title(s) in scope · '+(mode==='both'?cover+' cover + '+metadata+' metadata':(mode==='cover'?cover:metadata)+' ready provider(s)')+
 ' · Ready to request confirmation.';
 let line=pane?.querySelector('[data-mf456-launch-hint]');
 if(!line){line=document.createElement('p');line.className='mf456-launch-hint';
  line.setAttribute('data-mf456-launch-hint','');
  pane?.querySelector('.mf445-actions')?.before(line);}
 if(line)line.textContent=msg;
 const actions=pane?.querySelectorAll('.mf445-actions button.btn-primary')||[];
 // The engine will perform validation on click. Never leave an inert
 // disabled button that fails silently with no reason or progress.
 actions.forEach((button,i)=>{
  if(i)button.hidden=true;
  else{button.disabled=false;button.title=msg;button.textContent='';button.insertAdjacentHTML('afterbegin',
    mf425Icon('play',17)+' Recover selected titles');
   button.setAttribute('onclick','App.mf455Launch('+mf456Escape(JSON.stringify(mode))+')');
   button.setAttribute('data-v225-iconified','1');}
 });
}
const mf456OldPanel=mf445Panel;
mf445Panel=function(kind){
 const result=mf456OldPanel.apply(this,arguments);
 mf456ExplainScope(MF447.active==='both'?'both':MF445.mode);
 return result;
};
App.mf445Panel=mf445Panel;
App.mf456DismissLaunch=mf456DismissLaunch;
window.MediaFlowV456Launch=Object.freeze({version:456,stage:mf456LaunchStage,
 watch:mf456WatchRecovery,state:()=>({...MF456Launch}),explain:mf456ExplainScope});
