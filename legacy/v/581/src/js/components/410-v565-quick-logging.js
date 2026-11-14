/* MediaFlow v565 — quicker logging from anywhere.
 *
 * + menu
 *   - "Save & get next task" (only while a log is open): asks to confirm with
 *     the XP this log earns, then saves exactly like the form's own button
 *     (App.submitLog). Same as the MediaFlow app's + menu.
 *   - "Log any title": opens Batch Log in a popup on any page, with or without
 *     a session. Batch Log itself (App.submitBatchLog and its XP/streak chain)
 *     is unchanged; v394 only retired its page in the navigation.
 * Dashboard
 *   - A visible "Log any title" button above Logging, always there, including
 *     during a session.
 */
const MF565_QUICK={batchOpen:false,returnFocus:null};
const MF565_CHECK_ICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/></svg>';
const MF565_LIST_ICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h11M4 12h11M4 18h7"/><path d="M19 15v6M16 18h6"/></svg>';

function mf565CanSaveNext(){return !!(S.sessionActive&&S.currentTask&&S.logging&&S.logDraft);}

/* ---------- + menu ---------- */
const mf565QuickMarkupBase=mf397Markup;
mf397Markup=function(){
  let html=String(mf565QuickMarkupBase.apply(this,arguments)||'');
  const anchor=html.indexOf('<button type="button" class="mf397-fan-action a1"');
  if(anchor<0||html.includes('data-action="mf565SaveNext"'))return html;
  const buttons=
    '<button type="button" class="mf397-fan-action mf447-float-action mf565-save-next" data-action="mf565SaveNext" aria-label="Save and get next task" hidden>'+
      '<span class="mf397-action-symbol">'+MF565_CHECK_ICON+'</span><span><strong>Save &amp; get next task</strong><small>Save this log and open the next task</small></span><em>00</em></button>\n        '+
    '<button type="button" class="mf397-fan-action mf447-float-action mf565-log-any" data-action="mf565LogAny" aria-label="Log any title">'+
      '<span class="mf397-action-symbol">'+MF565_LIST_ICON+'</span><span><strong>Log any title</strong><small>Batch Log · any title, any category</small></span><em>00</em></button>\n        ';
  html=html.slice(0,anchor)+buttons+html.slice(anchor);
  let n=0;
  return html.replace(/<em>\d{2}<\/em>/g,()=>'<em>'+String(++n).padStart(2,'0')+'</em>');
};
const mf565QuickSetMenuBase=mf397SetMenu;
mf397SetMenu=function(open){
  const btn=document.querySelector('#mf397-fan [data-action="mf565SaveNext"]');
  if(btn)btn.hidden=!mf565CanSaveNext();
  return mf565QuickSetMenuBase.apply(this,arguments);
};
const mf565QuickActionBase=mf397Action;
mf397Action=function(action){
  if(action==='mf565SaveNext'){mf397SetMenu(false);return mf565SaveAndNext();}
  if(action==='mf565LogAny'){mf397SetMenu(false);return mf565OpenBatch();}
  return mf565QuickActionBase.apply(this,arguments);
};
async function mf565SaveAndNext(){
  if(!mf565CanSaveNext()){showToast('Open a log first.');return;}
  let xp=null;
  try{const p=mf537ProjectXP();if(p?.eligible)xp=Math.round(Number(p.total)||0);}catch(_){}
  const ok=await v336Confirm(xp==null?'Save this log and get your next task.':'This log earns +'+xp.toLocaleString()+' XP.',
    {title:'Save & get next task?',confirmText:'Save & get next task',cancelText:'Not yet',tone:'success'});
  if(!ok)return;
  return App.submitLog();
}

/* ---------- Batch Log popup ---------- */
function mf565BatchEl(){return document.getElementById('mf565-batch');}
function mf565PaintBatch(){
  const old=mf565BatchEl();
  if(!MF565_QUICK.batchOpen){if(old){old.remove();document.body.classList.remove('mf565-batch-open');}return;}
  const scroll=old?.querySelector('.mf555-log-body')?.scrollTop||0;
  const active=document.activeElement,activeId=old?.contains(active)?active.id:'';
  const caret=activeId&&typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null;
  let body='';
  try{body=renderBatchLog();}catch(e){console.error('MediaFlow v565: Batch Log could not render',e);body='<div class="empty-state card">Batch Log could not open.</div>';}
  const wrap=document.createElement('div');
  wrap.innerHTML='<div class="mf555-log-popup mf565-batch-popup" id="mf565-batch" role="dialog" aria-modal="true" aria-labelledby="mf565-batch-title">'+
    '<div class="mf555-log-backdrop" onclick="App.mf565CloseBatch()"></div>'+
    '<section class="mf555-log-sheet">'+
      '<header class="mf555-log-head"><div><strong id="mf565-batch-title">Log any title</strong><small>Batch Log · draft kept when you close</small></div>'+
      '<button type="button" class="btn btn-sm v555-icon-btn" onclick="App.mf565CloseBatch()" aria-label="Close (draft is kept)" title="Close (draft is kept)">'+MF555_ICON.close+'</button></header>'+
      '<div class="mf555-log-body page-batch">'+body+'</div>'+
    '</section></div>';
  const fresh=wrap.firstElementChild;
  if(old)old.replaceWith(fresh);else document.body.appendChild(fresh);
  document.body.classList.add('mf565-batch-open');
  fresh.querySelector('.mf555-log-body').scrollTop=scroll;
  if(activeId){const el=document.getElementById(activeId);if(el&&fresh.contains(el)){el.focus({preventScroll:true});if(caret&&typeof el.setSelectionRange==='function')try{el.setSelectionRange(caret[0],caret[1]);}catch(_){}}}
}
const mf565RenderViewBase=renderView;
renderView=function(){
  const out=mf565RenderViewBase.apply(this,arguments);
  mf565PaintBatch();
  return out;
};
function mf565OpenBatch(){
  MF565_QUICK.returnFocus=document.activeElement;
  MF565_QUICK.batchOpen=true;
  try{ensureBatchDraft();if(!S.batchDraft.rows.length)addBatchRow();}catch(_){}
  mf565PaintBatch();
  requestAnimationFrame(()=>mf565BatchEl()?.querySelector('input[type="text"]')?.focus?.({preventScroll:true}));
}
function mf565CloseBatch(){
  if(!MF565_QUICK.batchOpen)return;
  MF565_QUICK.batchOpen=false;mf565PaintBatch();
  MF565_QUICK.returnFocus?.focus?.({preventScroll:true});
}
// v181 only honours Batch Log's own Amount/Progress switch on the retired
// Batch page; the popup is Batch Log too.
const mf565BatchModeBase=v179Mode;
v179Mode=function(kind){
  if(kind==='batch'&&MF565_QUICK.batchOpen&&S.batchDraft?.v179Mode)return v179NormalizeMode(S.batchDraft.v179Mode);
  return mf565BatchModeBase.apply(this,arguments);
};
// Logging from the popup keeps you on the page you were on.
const mf565SubmitBatchBase=App.submitBatchLog;
App.submitBatchLog=function(){
  if(!MF565_QUICK.batchOpen)return mf565SubmitBatchBase.apply(this,arguments);
  const view=S.view,before=(S.sessions||[]).length;
  const finish=()=>{
    if((S.sessions||[]).length>before){MF565_QUICK.batchOpen=false;S.view=view;render();}
  };
  const result=mf565SubmitBatchBase.apply(this,arguments);
  if(result&&typeof result.then==='function')return result.finally(finish);
  finish();return result;
};
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||!MF565_QUICK.batchOpen)return;
  if(document.querySelector('#modal-root .modal-overlay,.mf274-overlay:not([hidden])'))return;
  e.preventDefault();mf565CloseBatch();
});

/* ---------- Dashboard: always-visible "Log any title" ---------- */
function mf565DashboardButton(){
  if(S.view!=='dashboard')return;
  const main=document.getElementById('view-root');
  if(!main||main.querySelector('.mf565-log-any-bar'))return;
  const anchor=main.querySelector('.hero');
  const bar=document.createElement('div');
  bar.className='mf565-log-any-bar';
  bar.innerHTML='<div><b>Log any title</b><span>Record any title from your Library, from any category, without changing your task.</span></div>'+
    '<button type="button" class="btn btn-primary" onclick="App.mf565OpenBatch()">'+MF565_LIST_ICON+'<span>Log any title</span></button>';
  if(anchor)anchor.parentNode.insertBefore(bar,anchor);else main.prepend(bar);
}
MediaFlowRuntime.registerPageEnhancer('dashboard',()=>requestAnimationFrame(mf565DashboardButton));

Object.assign(App,{mf565OpenBatch,mf565CloseBatch,mf565SaveAndNext});
window.MediaFlowV565=Object.assign(window.MediaFlowV565||{},{openBatch:mf565OpenBatch,canSaveNext:mf565CanSaveNext});
