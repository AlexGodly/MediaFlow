/* MediaFlow v457 — recovery controls, scroll continuity, and editor dismissal.
 * Does not alter provider adapters, recovery checkpoints, or cloud writes.
 */
const MF457_VERSION=457;
const MF457={lastError:'',calls:0};

/* Confirmed Quick Recovery is the only action allowed to dismiss Edit Title.
 * A manual Close/Cancel does not emit title-recovered and keeps the editor open.
 */
document.addEventListener('mediaflow:title-recovered',event=>{
  const q=MF453Quick.current,detail=event?.detail;
  if(q&&!q.closed&&detail&&String(detail.id)===String(q.id)&&
    (Number(detail.coverCount||0)>0||Number(detail.metadataCount||0)>0)){
    q.v457ConfirmedSaved=true;
  }
});
const mf457CloseQuickBase=mf453CloseQuick;
mf453CloseQuick=async function(){
  const q=MF453Quick.current;
  const id=q?.id==null?'':String(q.id);
  const shouldDismiss=!!(q?.v457ConfirmedSaved&&S.modal?.type==='library'&&
    String(S.modal.data?.id??'')===id);
  const result=await mf457CloseQuickBase.apply(this,arguments);
  // Only after the Quick Recovery modal finishes closing. Never close Add Title
  // or a different saved title's edit dialog.
  if(shouldDismiss&&S.modal?.type==='library'&&String(S.modal.data?.id??'')===id)
    App.closeModal();
  return result;
};
App.mf453CloseQuick=mf453CloseQuick;

/* Rebuilds caused by category/scope/status changes used to reset the scrollable
 * dialog to its start and destroy the selected checkbox's focus. Reuse the
 * existing scroll container's position without scrolling the background page.
 */
const mf457PanelBase=mf445Panel;
function mf457ScrollSnapshot(){
  const root=document.getElementById('mf445-workspace');
  if(!root)return null;
  const pane=root.querySelector('[data-mf445-panel]'),dialog=root.querySelector('.mf445-dialog');
  const active=document.activeElement;
  return {root,pane,dialog,mode:MF447.active==='both'?'both':MF445.mode,
    paneY:pane?.scrollTop||0,dialogY:dialog?.scrollTop||0,
    winX:window.scrollX||0,winY:window.scrollY||0,
    category:active?.getAttribute?.('data-mf446-category')||null,
    scope:active?.matches?.('[data-mf446-scope]')||false,
    statusCategory:active?.closest?.('.mf446-category')?.querySelector?.('[data-mf446-category]')?.getAttribute('data-mf446-category')||null};
}
function mf457RestoreScroll(s){
  if(!s||!s.root.isConnected)return;
  const pane=s.root.querySelector('[data-mf445-panel]'),dialog=s.root.querySelector('.mf445-dialog');
  if(pane)pane.scrollTop=s.paneY;
  if(dialog)dialog.scrollTop=s.dialogY;
  let field=null;
  if(s.category)field=[...s.root.querySelectorAll('[data-mf446-category]')].find(el=>el.getAttribute('data-mf446-category')===s.category);
  else if(s.scope)field=s.root.querySelector('[data-mf446-scope]');
  else if(s.statusCategory)field=[...s.root.querySelectorAll('[data-mf446-category]')].find(el=>el.getAttribute('data-mf446-category')===s.statusCategory);
  if(field?.isConnected)try{field.focus({preventScroll:true});}catch(_){}
  if((window.scrollY||0)!==s.winY&&typeof window.scrollTo==='function')
    window.scrollTo(s.winX,s.winY);
}
mf445Panel=function(kind){
  const s=mf457ScrollSnapshot();
  const result=mf457PanelBase.apply(this,arguments);
  // A deliberate tab switch may reset scroll; category and filter changes may not.
  if(s&&(MF447.active==='both'?'both':MF445.mode)===s.mode){
    mf457RestoreScroll(s);
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{
      if(document.getElementById('mf445-workspace')===s.root&&
         (MF447.active==='both'?'both':MF445.mode)===s.mode)mf457RestoreScroll(s);
    });
  }
  mf457WireLaunch();
  return result;
};
App.mf445Panel=mf445Panel;

/* A single, real button for all modes. The old metadata "Preview one title"
 * primary action is removed, not just hidden with a CSS-overridable attribute.
 * Use an actual click listener instead of dynamically concatenated inline JS.
 */
function mf457WireLaunch(){
  const root=document.getElementById('mf445-workspace'),actions=root?.querySelector('[data-mf445-panel] .mf445-actions');
  if(!actions)return;
  const kind=MF447.active==='both'?'both':MF445.mode;
  const candidates=[...actions.querySelectorAll('button.btn-primary')];
  let button=candidates[0];
  if(!button){
    button=document.createElement('button');button.type='button';button.className='btn btn-primary';
    actions.prepend(button);
  }
  for(const extra of candidates.slice(1))extra.remove();
  // Remove any old inline handler (including preview), and use the real v455
  // safe queue launch, which owns confirmation, checkpoints, and provider calls.
  button.removeAttribute('onclick');
  button.disabled=false;
  button.dataset.mf457LaunchKind=kind;
  button.dataset.v225Iconified='1';
  button.setAttribute('aria-label','Recover selected titles — '+kind);
  button.innerHTML=mf425Icon('play',17)+' Recover selected titles';
  if(button.dataset.mf457ClickBound==='1')return;
  button.dataset.mf457ClickBound='1';
  button.addEventListener('click',()=>{
    MF457.calls++;
    if(MF455.launching){
      mf456LaunchStage('queued','Recovery startup is already in progress. Check the confirmation dialog or Background Processes.',kind);
      return;
    }
    try{
      mf456LaunchStage('validating','Launch requested. Checking scope and provider readiness…',kind);
      Promise.resolve(App.mf455Launch(kind)).catch(err=>mf457LaunchError(err,kind));
    }catch(err){mf457LaunchError(err,kind);}
  });
}
function mf457LaunchError(err,kind){
  const detail=String(err?.message||err||'Unknown recovery startup failure').slice(0,200);
  MF457.lastError=detail;
  console.error('v457 recovery launch failure',err);
  try{mf456LaunchStage('error','Recovery could not start: '+detail,kind);}catch(e){console.error(e);}
  showToast('Recovery could not start: '+detail.slice(0,125));
}
/* Source toggle handlers can re-disable the single action after a provider
 * selection. Leave it actionable so it can explain the exact validation error.
 */
const mf457ProviderUiBase=mf455UpdateProviderUI;
mf455UpdateProviderUI=function(kind){
  const result=mf457ProviderUiBase.apply(this,arguments);
  mf457WireLaunch();
  return result;
};
function mf457OpenWorkspace(kind='cover',options={}){
  const result=App.mf447Open(kind,options);
  mf457WireLaunch();
  return result;
}
window.MediaFlowV457=Object.freeze({
  version:457,wire:mf457WireLaunch,open:mf457OpenWorkspace,
  launch:kind=>App.mf455Launch(kind),calls:()=>MF457.calls,
  lastError:()=>MF457.lastError
});
