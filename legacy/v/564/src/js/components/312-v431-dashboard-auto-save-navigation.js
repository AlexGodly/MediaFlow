/* MediaFlow v431 — Dashboard Missing Covers validated auto-save.
   Accepts manually pasted and explicitly selected URLs AFTER the existing v235
   real-image validation. Does not loosen background provider auto-match rules,
   create Library records, or bypass the existing XP-safe queue saver. */
const MF431_AUTO={busy:false,waiters:[],account:''};
function mf431Account(){return String(typeof AUTH_USER!=='undefined'&&AUTH_USER?.id||'local');}
function mf431Current(){
  const input=document.getElementById('v192-cover-url-input');
  if(!input)return {item:null,input:null,id:'',url:''};
  const item=v192CurrentMissingCoverItem?.();
  return {item,input,id:String(item?.id||''),url:String(input.value||'').trim()};
}
function mf431Validated(id,url){
  const state=V235_MISSING_STATE,live=mf431Current();
  return !!id&&!!url&&live.id===String(id)&&live.url===String(url)&&
    state.valid===true&&!state.checking&&state.itemId===String(id)&&state.value===String(url)&&
    !!v235CoverCandidate(url).ok;
}
function mf431ResolveWaiters(kind){
  const now=mf431Current();
  for(const entry of [...MF431_AUTO.waiters]){
    if(entry.id!==now.id||entry.url!==now.url)continue;
    if(kind!=='valid'&&kind!=='invalid')continue;
    entry.finish(kind==='valid'&&mf431Validated(entry.id,entry.url));
  }
}
function mf431SaveValidated(id,url,explicit=false){
  id=String(id||'');url=String(url||'').trim();
  if(!explicit&&!S.settings?.v430MissingCoversAutoSave)return false;
  if(MF431_AUTO.busy)return false;
  if(!mf431Validated(id,url))return false;
  if(mf431Account()!==MF431_AUTO.account)return false;
  const live=mf431Current();
  if(!live.item||String(live.item.coverUrl||'').trim())return false;
  MF431_AUTO.busy=true;
  try{
    // Existing saver checks the same v235 state, updates XP and queues,
    // writes Library state, and redraws the next title exactly once.
    App.v192SaveMissingCover();
    if(String(live.item.coverUrl||'').trim()!==url)throw Error('Cover save was not accepted');
    return true;
  }catch(error){
    console.error('v431 Dashboard auto-save failed',error);
    showToast('Automatic cover save failed. Use Save cover & Next to retry.');
    return false;
  }finally{MF431_AUTO.busy=false;}
}
function mf431MaybeSave(){
  if(!S.settings?.v430MissingCoversAutoSave||MF431_AUTO.busy)return false;
  const {id,url}=mf431Current();
  return mf431SaveValidated(id,url);
}
function mf431ValidateCurrent(){
  const {id,url}=mf431Current();
  if(!id||!url||!S.settings?.v430MissingCoversAutoSave)return;
  if(mf431Validated(id,url))queueMicrotask(mf431MaybeSave);
  else App.v235ValidateMissingCover?.(url);
}
const mf431OriginalSetValidationUi=v235SetCoverValidationUi;
v235SetCoverValidationUi=function(kind,message){
  const result=mf431OriginalSetValidationUi(kind,
    kind==='valid'&&S.settings?.v430MissingCoversAutoSave?
      'Valid image URL · saving cover and advancing automatically…':message);
  mf431ResolveWaiters(kind);
  if(kind==='valid'&&S.settings?.v430MissingCoversAutoSave)queueMicrotask(mf431MaybeSave);
  return result;
};
const mf431PreviousSetAutoSave=mf430SetMissingAutoSave;
mf430SetMissingAutoSave=function(enabled){
  const result=mf431PreviousSetAutoSave.apply(this,arguments);
  if(enabled)mf431ValidateCurrent();
  return result;
};
App.mf430SetMissingAutoSave=mf430SetMissingAutoSave;
async function mf431UseDashboardCover(raw,id){
  const live=mf431Current(),url=String(raw||'').trim();
  if(!url||!id||live.id!==String(id)||!live.input)return false;
  if(MF431_AUTO.busy)return false;
  MF431_AUTO.account=mf431Account();
  let finish;
  const originalAccount=mf431Account();
  const promise=new Promise(resolve=>{
    const entry={id:String(id),url,finish:(ok)=>{
      clearTimeout(timer);
      MF431_AUTO.waiters=MF431_AUTO.waiters.filter(x=>x!==entry);
      resolve(Boolean(ok));
    }};
    const timer=setTimeout(()=>entry.finish(false),V235_COVER_CHECK_TIMEOUT+V235_COVER_CHECK_DELAY+2000);
    MF431_AUTO.waiters.push(entry);
    finish=entry.finish;
  });
  live.input.value=url;
  App.v235ValidateMissingCover?.(url);
  const valid=await promise;
  if(!valid||mf431Account()!==originalAccount)return false;
  // Validation may have already triggered the opt-in automatic saver.
  const saved=(S.library||[]).find(x=>String(x?.id)===String(id));
  if(String(saved?.coverUrl||'').trim()===url)return true;
  return mf431SaveValidated(id,url,true);
}
App.mf431UseDashboardCover=mf431UseDashboardCover;
// Keep the checkbox and validation token tied to the active account.
MF431_AUTO.account=mf431Account();
const mf431OldApplyState=v46ApplyState;
v46ApplyState=function(){
  const result=mf431OldApplyState.apply(this,arguments);
  MF431_AUTO.account=mf431Account();
  MF431_AUTO.waiters.splice(0).forEach(w=>w.finish(false));
  return result;
};
const mf431OldRender=render;
render=function(){
  const result=mf431OldRender.apply(this,arguments);
  // Image validation normally runs on input; if an existing URL is restored
  // into the Dashboard without firing input, still honor the saved checkbox.
  const current=mf431Current();
  if(S.settings?.v430MissingCoversAutoSave&&current.id&&current.url&&!MF431_AUTO.busy)
    queueMicrotask(mf431ValidateCurrent);
  return result;
};
window.MediaFlowV431={version:431,features:['Validated Dashboard auto-save','Search candidate validation wait','Navigation progress icon suppression']};
