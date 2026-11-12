/* MediaFlow v388 — Dashboard return scroll and safe action batching.
 * No XP, Library, History, backup or cloud schema changes.
 * In a synchronous action all existing validators and record mutations run
 * unchanged. Only repeated full-view renders and redundant cloud snapshots
 * are coalesced into one final render + one serialized save.
 */
const V388_RELEASE=388;
const V388_ACTION={depth:0,render:false,save:false,waiters:[],kind:'',commits:0};
const v388RenderBase=render;
render=function(){
  if(V388_ACTION.depth){V388_ACTION.render=true;return;}
  return v388RenderBase.apply(this,arguments);
};
// A complete title/log action already persists the latest resume and
// portable state in its final snapshot. Suppress legacy debounce timers
// scheduled *during* the action, not the synchronous local-resume write.
const v388ResumeScheduleBase=v285ScheduleCloudSave;
v285ScheduleCloudSave=function(){
  if(V388_ACTION.depth){V388_ACTION.save=true;return;}
  return v388ResumeScheduleBase.apply(this,arguments);
};
const v388PortableScheduleBase=v155SchedulePortableCloudSave;
v155SchedulePortableCloudSave=function(){
  if(V388_ACTION.depth){V388_ACTION.save=true;return;}
  return v388PortableScheduleBase.apply(this,arguments);
};
const v388SaveBase=saveState;
saveState=function(){
  if(!V388_ACTION.depth)return v388SaveBase.apply(this,arguments);
  V388_ACTION.save=true;
  // Resolve only AFTER the real cloud save settles. The existing v385 cloud
  // feedback must never infer success from a placeholder resolved promise.
  return new Promise((resolve,reject)=>V388_ACTION.waiters.push({resolve,reject}));
};
function v388CommitAction(){
  if(--V388_ACTION.depth>0)return;
  V388_ACTION.depth=0;
  const doRender=V388_ACTION.render,doSave=V388_ACTION.save;
  const waiters=V388_ACTION.waiters.splice(0);
  V388_ACTION.render=false;V388_ACTION.save=false;
  // Apply all metadata, seasons, external IDs, progress and XP first, then
  // rebuild the view once. No partially saved frame or missing modal inputs.
  try{if(doRender)v388RenderBase();}
  catch(err){console.error('MediaFlow v388: final action render failed',err);}
  if(doSave){
    // v285 already wrote the latest resume to localStorage synchronously.
    // Its timer would enqueue an identical full-state upload after this save.
    try{if(typeof V285_RESUME_SAVE_TIMER!=='undefined'){clearTimeout(V285_RESUME_SAVE_TIMER);V285_RESUME_SAVE_TIMER=null;}}catch(_){ }
    // The v155 portable-state coalescer can schedule another identical full
    // upload for the same synchronous title/log mutation. This transaction
    // already captures the complete updated state, including portable fields.
    try{if(typeof V155_PORTABLE_SAVE_TIMER!=='undefined'){clearTimeout(V155_PORTABLE_SAVE_TIMER);V155_PORTABLE_SAVE_TIMER=null;}}catch(_){ }
    try{
      const result=v388SaveBase();
      Promise.resolve(result).then(v=>waiters.forEach(w=>w.resolve(v)),err=>waiters.forEach(w=>w.reject(err)));
    }catch(err){waiters.forEach(w=>w.reject(err));console.error('MediaFlow v388: save queue failed',err);}
  }else waiters.forEach(w=>w.resolve(false));
  V388_ACTION.commits++;
}
function v388BatchAction(kind,fn){
  V388_ACTION.depth++;
  if(V388_ACTION.depth===1)V388_ACTION.kind=kind;
  try{return fn();}
  finally{v388CommitAction();}
}
function v388ScrollerSetTop(){
  if(S.view!=='dashboard'||S.logging===true)return;
  // Dashboard's card tree becomes much shorter when Logging closes. Clear
  // stale anchoring in both the document and themed element scroll shells.
  for(const el of [document.scrollingElement,document.documentElement,document.body,
    document.querySelector('.main'),document.querySelector('.main-content'),
    document.querySelector('.content'),document.querySelector('#view-root')]){
    if(el&&typeof el.scrollTop==='number'&&el.scrollTop!==0)el.scrollTop=0;
  }
  if(window.scrollY!==0||window.scrollX!==0){
    try{window.scrollTo({top:0,left:0,behavior:'instant'});}
    catch(_){window.scrollTo(0,0);}
  }
}
let V388_RETURN_REVISION=0;
function v388DashboardReturnScroll(){
  if(S.view!=='dashboard'||S.logging===true)return;
  const version=++V388_RETURN_REVISION;
  v388ScrollerSetTop();
  requestAnimationFrame(()=>{
    if(version!==V388_RETURN_REVISION||S.view!=='dashboard'||S.logging)return;
    v388ScrollerSetTop();
    requestAnimationFrame(()=>{
      if(version===V388_RETURN_REVISION&&S.view==='dashboard'&&!S.logging)v388ScrollerSetTop();
    });
  });
}
// Batch only the two complete, synchronous mutation pipelines. Other
// saveState() callers retain their previous timing and serial queue.
for(const name of ['saveLibraryModal','submitLog']){
  const base=App[name];
  if(typeof base!=='function')continue;
  App[name]=function(){
    const wasLogging=S.logging===true;
    const result=v388BatchAction(name,()=>base.apply(this,arguments));
    // No scroll movement on failed validation: the draft stays open.
    if(name==='submitLog'&&wasLogging&&S.logging===false)v388DashboardReturnScroll();
    return result;
  };
}
const v388CancelBase=App.cancelLogForm;
if(typeof v388CancelBase==='function')App.cancelLogForm=function(){
  const wasLogging=S.logging===true;
  const args=arguments;
  const result=v388BatchAction('cancelLogForm',()=>v388CancelBase.apply(this,args));
  if(wasLogging&&S.logging===false)v388DashboardReturnScroll();
  return result;
};
// Keep asynchronous Dashboard repaint/update enhancers from inheriting the
// old Logging scroll position; ordinary Dashboard navigation remains intact.
App.v388DashboardReturnScroll=v388DashboardReturnScroll;
App.v388ActionAudit=()=>({commits:V388_ACTION.commits,active:V388_ACTION.depth>0});
window.MediaFlowV388={version:V388_RELEASE,features:['Stable Dashboard return after Logging','Coalesced title/modal saves','Reduced duplicate full-state uploads']};
MediaFlowRuntime.version=V388_RELEASE;
