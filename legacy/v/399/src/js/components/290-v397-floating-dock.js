/* MediaFlow v397 — prototype-v2 floating quick actions and task-progress dock.
 * UI-only: reads canonical task, Library and unsubmitted Logging draft data.
 * No new persistence, XP, History or Supabase mutation is introduced.
 */
const V397_RELEASE=397;
const MF397={open:false,compact:false,displayPercent:0,animation:0,previousKey:'',booted:false,observer:null,pending:false,collectionCreation:false};
function mf397Icon(type,size=20){
  const paths={plus:'<path d="M12 4v16M4 12h16"/>',log:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/><path d="M17 15v5m-2.5-2.5h5"/>',library:'<path d="M4 4h14a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Z"/><path d="M6 16h14M10 7v6m-3-3h6"/>',collection:'<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M12 12v6m-3-3h6"/>',minus:'<path d="M5 12h14"/>',chevron:'<path d="m6 10 6 6 6-6"/>'};
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" aria-hidden="true">${paths[type]||paths.plus}</svg>`;
}
function mf397Markup(){
  const wave=(path)=>`<svg viewBox="0 0 800 180" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="currentColor"/></svg>`;
  return `<div class="mf397-dimmer" id="mf397-dimmer"></div><section class="mf397-dock" id="mf397-dock" aria-label="MediaFlow floating quick actions and task progress">
    <div class="mf397-plus-holder">
      <div class="mf397-fan" id="mf397-fan" aria-label="Quick actions">
        <span class="mf397-fan-orbit" aria-hidden="true"></span>
        <button type="button" class="mf397-fan-action a1" data-action="logging"><span class="mf397-action-symbol">${mf397Icon('log')}</span><span><strong>Add to Logging</strong><small>Open Logging Library</small></span><em>01</em></button>
        <button type="button" class="mf397-fan-action a2" data-action="library"><span class="mf397-action-symbol">${mf397Icon('library')}</span><span><strong>Add to Library</strong><small>Create a new title</small></span><em>02</em></button>
        <button type="button" class="mf397-fan-action a3" data-action="collection"><span class="mf397-action-symbol">${mf397Icon('collection')}</span><span><strong>Add Collection</strong><small>Create & open collection</small></span><em>03</em></button>
      </div>
      <button type="button" id="mf397-fab" class="mf397-fab" aria-label="Open quick actions" aria-expanded="false" aria-controls="mf397-fan" title="MediaFlow quick actions">${mf397Icon('plus',30)}</button>
    </div>
    <section class="mf397-progress" id="mf397-progress" aria-label="Current task progress" hidden>
      <div class="mf397-ambient" aria-hidden="true"><div class="mf397-aura"></div><div class="mf397-wave back">${wave('M0 62 Q50 32 100 62 T200 62 T300 62 T400 62 T500 62 T600 62 T700 62 T800 62 L800 180 H0 Z')}</div><div class="mf397-wave front">${wave('M0 78 Q50 49 100 78 T200 78 T300 78 T400 78 T500 78 T600 78 T700 78 T800 78 L800 180 H0 Z')}</div></div>
      <div class="mf397-head"><div class="mf397-label"><i></i><span id="mf397-category">TASK PROGRESS</span></div><span class="mf397-mini-percent" id="mf397-mini-percent"></span><button id="mf397-collapse" class="mf397-collapse" aria-label="Minimize task progress" title="Minimize task progress">${mf397Icon('minus',17)}</button></div>
      <div class="mf397-main"><div class="mf397-left"><div class="mf397-tally"><strong id="mf397-count">0 / 3</strong><small id="mf397-unit">episodes</small></div><div class="mf397-track" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="0" aria-label="Task consumption progress"><span id="mf397-fill" class="mf397-fill"></span><span id="mf397-marker" class="mf397-marker"></span></div></div><div class="mf397-percent"><strong id="mf397-percent">0%</strong><small>COMPLETE</small></div></div>
      <div class="mf397-bottom"><span class="mf397-status"><i></i><span id="mf397-status">In progress</span></span><span id="mf397-range" class="mf397-range">GOAL 3</span></div>
    </section>
  </section>`;
}
function mf397HasBlockingDialog(){return !!document.querySelector('.modal-overlay:not([hidden]),.mf274-overlay:not([hidden]),[role="dialog"][aria-modal="true"]');}
function mf397Ensure(){
  const host=document.querySelector('#app .sidebar');
  if(!host){document.getElementById('mf397-dock')?.remove();document.getElementById('mf397-dimmer')?.remove();return false;}
  if(document.getElementById('mf397-dock'))return true;
  document.body.insertAdjacentHTML('beforeend',mf397Markup());
  document.getElementById('mf397-fab').addEventListener('click',()=>mf397SetMenu(!MF397.open));
  document.getElementById('mf397-dimmer').addEventListener('click',()=>mf397SetMenu(false));
  document.getElementById('mf397-collapse').addEventListener('click',()=>{MF397.compact=!MF397.compact;mf397Update();});
  document.querySelectorAll('.mf397-fan-action').forEach(btn=>btn.addEventListener('click',()=>mf397Action(btn.dataset.action)));
  if(!MF397.booted){
    MF397.booted=true;
    // Authentication switches replace #app directly without calling render().
    // Remove the dock immediately when the authenticated shell disappears.
    const app=document.getElementById('app');
    if(app)new MutationObserver(()=>{if(!app.querySelector('.sidebar')){mf397SetMenu(false);document.getElementById('mf397-dock')?.remove();document.getElementById('mf397-dimmer')?.remove();}}).observe(app,{childList:true});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')mf397SetMenu(false);});
    document.addEventListener('click',event=>{if(MF397.open&&!event.target.closest('.mf397-plus-holder'))mf397SetMenu(false);});
  }
  return true;
}
function mf397SetMenu(isOpen){
  MF397.open=!!isOpen;
  const fab=document.getElementById('mf397-fab'),fan=document.getElementById('mf397-fan'),dimmer=document.getElementById('mf397-dimmer');
  if(fab){fab.setAttribute('aria-expanded',String(MF397.open));fab.setAttribute('aria-label',MF397.open?'Close quick actions':'Open quick actions');}
  fan?.classList.toggle('open',MF397.open);dimmer?.classList.toggle('on',MF397.open);
}
function mf397ReadState(){
  if(!S.sessionActive||!S.currentTask||!S.logDraft||!S.logging)return null;
  const t=S.currentTask,categoryId=String(t.categoryId||''),entries=S.logDraft.entries||[];
  const index=typeof v156EnsureOrderIndexes==='function'?v156EnsureOrderIndexes()?.libraryById:null;
  const matching=entries.filter(e=>{
    const id=String(e.libraryId||'');
    const item=index?.get(id)||(S.library||[]).find(x=>String(x?.id||'')===id);
    return !!item&&String(item.categoryId||'')===categoryId;
  });
  if(!matching.length)return null;
  const amount=matching.reduce((sum,e)=>sum+(S.logDraft.v369Interface==='itemized'?Array.isArray(e.v369Units)?e.v369Units.length:0:Math.max(0,Number(e.qty)||0)),0);
  const safe=n=>Math.max(0,Number.isFinite(Number(n))?Number(n):0);
  const low=Math.max(1,Math.round(safe(t.low??t.targetMid??1)));
  const high=Math.max(low,Math.round(safe(t.high??t.targetMid??low)));
  const denominator=high===low?low:amount<=low?low:Math.min(amount,high);
  const cat=getCategory(t.categoryId),unit=String(cat?.unit||t.unit||'units');
  const reading=/read|chapter|page|book|novel|comic|manga|manhwa|manhua|issue|volume/i.test([cat?.type,cat?.name,unit].join(' '));
  const watching=/watch|episode|movie|anime|video|tv|film/i.test([cat?.type,cat?.name,unit].join(' '));
  const prefix=reading?'Overread':watching?'Overwatched':'Overconsumed';
  const status=amount===0?'Ready to log':amount<low?'In progress':amount===low?'Goal reached':amount<high?'Within target range':amount===high?'Recommended maximum reached':prefix;
  return {cat,unit,amount,low,high,denominator,status,pct:Math.max(0,Math.min(100,amount/high*100))};
}
function mf397PercentTo(target){
  cancelAnimationFrame(MF397.animation);
  const from=MF397.displayPercent,began=performance.now();
  function tick(now){const x=Math.min(1,(now-began)/550),ease=1-Math.pow(1-x,3);MF397.displayPercent=from+(target-from)*ease;const node=document.getElementById('mf397-percent');if(node)node.textContent=Math.round(MF397.displayPercent)+'%';if(x<1)MF397.animation=requestAnimationFrame(tick);}
  MF397.animation=requestAnimationFrame(tick);
}
function mf397Update(){
  if(!mf397Ensure())return;
  const dock=document.getElementById('mf397-dock'),node=document.getElementById('mf397-progress'),data=mf397ReadState();
  if(!data){node.hidden=true;MF397.previousKey='';return;}
  const key=[String(S.currentTask?.id||S.currentTask?.categoryId||''),data.amount,data.low,data.high].join('/');
  node.hidden=false;node.classList.toggle('compact',MF397.compact);node.classList.toggle('reached',data.amount>=data.low&&data.amount<=data.high);node.classList.toggle('over',data.amount>data.high);
  document.getElementById('mf397-category').textContent='TASK PROGRESS · '+String(data.cat?.name||'CATEGORY').toUpperCase();
  document.getElementById('mf397-count').textContent=data.amount.toLocaleString()+' / '+data.denominator.toLocaleString();
  document.getElementById('mf397-unit').textContent=data.unit;
  document.getElementById('mf397-status').textContent=data.status;
  document.getElementById('mf397-range').textContent='GOAL '+data.low+(data.high===data.low?'':'–'+data.high);
  const track=node.querySelector('.mf397-track');track.setAttribute('aria-valuenow',String(Math.min(data.high,data.amount)));track.setAttribute('aria-valuemax',String(data.high));
  document.getElementById('mf397-marker').style.cssText=`--marker:${(data.low/data.high*100).toFixed(2)}%;${data.low===data.high?'display:none':''}`;
  document.getElementById('mf397-collapse').setAttribute('aria-label',MF397.compact?'Expand task progress':'Minimize task progress');
  document.getElementById('mf397-mini-percent').textContent=Math.round(data.pct)+'%';
  if(key!==MF397.previousKey){
    if(data.amount===data.low){node.classList.remove('goalflash');void node.offsetWidth;node.classList.add('goalflash');}
    document.getElementById('mf397-fill').style.width=data.pct.toFixed(3)+'%';
    mf397PercentTo(data.pct);
    MF397.previousKey=key;
  }
  dock.classList.toggle('mf397-modal-behind',mf397HasBlockingDialog());
}
function mf397Schedule(){if(MF397.pending)return;MF397.pending=true;requestAnimationFrame(()=>{MF397.pending=false;mf397Update();});}
function mf397Action(action){
  mf397SetMenu(false);
  if(action==='logging'){
    if(!S.currentTask||!S.sessionActive)App.startSession();
    if(!S.currentTask){showToast('Create or start a task to use Logging.');return;}
    if(S.view!=='dashboard'){S.view='dashboard';render();}
    if(!S.logging)App.openLogForm();else render();
    // Open the full Logging Library picker without consuming or removing draft units.
    if(S.logDraft)S.logDraft.v379HideAddedTitles=false;
    requestAnimationFrame(()=>{try{renderLogSuggestions();}catch(_){}const picker=document.querySelector('#log-suggestions,.mf378-picker,.v224-log-tools');picker?.scrollIntoView?.({behavior:'smooth',block:'center'});const search=document.getElementById('entry-title');search?.focus({preventScroll:true});});
    return;
  }
  if(action==='library'){App.openLibraryModal();return;}
  if(action==='collection'){
    // Creation stays in the existing Collection editor and save pipeline.
    MF397.collectionCreation=true;
    App.v274CreateCollection();
    document.getElementById('mf274-col-title')?.focus();
  }
}
// Existing collection saver already activates the new collection. Navigate to
// the Collections page ONLY after the existing awaited save completes.
const mf397SaveCollectionBase=App.v274SaveCollection;
App.v274SaveCollection=async function(id){
  const createdFromDock=MF397.collectionCreation&&!id;
  const hadOverlay=!!document.getElementById('mf274-collection-editor');
  const sizeBefore=(S.collections||[]).length;
  const result=await mf397SaveCollectionBase.apply(this,arguments);
  if(createdFromDock && (S.collections||[]).length>sizeBefore && hadOverlay && !document.getElementById('mf274-collection-editor')){
    S.view='collections';render();
  }
  if(!document.getElementById('mf274-collection-editor'))MF397.collectionCreation=false;
  return result;
};
const mf397CloseCollectionBase=App.v274CloseOverlay;
App.v274CloseOverlay=function(id){if(id==='mf274-collection-editor')MF397.collectionCreation=false;return mf397CloseCollectionBase.apply(this,arguments);};
const mf397RenderBase=render;
render=function(){const result=mf397RenderBase.apply(this,arguments);mf397Schedule();return result;};
const mf397RenderShellBase=renderShell;
renderShell=function(){const result=mf397RenderShellBase.apply(this,arguments);mf397Schedule();return result;};
const mf397RefreshPanelsBase=v369RefreshPanels;
v369RefreshPanels=function(){const result=mf397RefreshPanelsBase.apply(this,arguments);mf397Schedule();return result;};
// Important: per-title Advanced Logging switches can replace only a card,
// without calling render(). Wrap the actions that alter unit quantity.
for(const name of ['v394SetQuantity','v369AddUnit','v369RemoveUnit','v378QuickAdd','removeLogEntry','v179UpdateEntryProgressDraft','v179SetLogEntryEnd','v252SetLogEntrySeasonEpisode']){
  const original=App[name];if(typeof original!=='function')continue;
  App[name]=function(){const result=original.apply(this,arguments);mf397Schedule();return result;};
}
// Keep floating dock consistent on in-place repaint of the logging list.
// Observer deliberately watches only the page content, never its own dock.
const mf397AppObserver=new MutationObserver(changes=>{if(changes.some(m=>m.addedNodes.length||m.removedNodes.length))mf397Schedule();});
function mf397StartObserver(){const view=document.getElementById('view-root');if(view){mf397AppObserver.disconnect();mf397AppObserver.observe(view,{childList:true,subtree:true});}}
const mf397RenderViewBase=renderView;
renderView=function(){const result=mf397RenderViewBase.apply(this,arguments);mf397StartObserver();mf397Schedule();return result;};
window.MediaFlowV397={version:V397_RELEASE,update:mf397Update,model:mf397ReadState,action:mf397Action,features:['Prototype v2 theme-aware floating task progress','Always-visible quick-action fan','Existing Logging, Library, Collections entrypoints']};
MediaFlowRuntime.version=V397_RELEASE;
