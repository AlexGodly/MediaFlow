/* MediaFlow v580 — titles logged by parts in Advanced logging.
 *
 * Quick logging and Log any title already log a by-parts title with its
 * parts: chips to pick the parts, one card per part with its own box
 * ("Match reached" or "Amount"), the move line with its time, the bar, and
 * "+N in all". Advanced logging (Per Unit, Progress Reached, Amount Consumed)
 * showed seasons and episode numbers instead. It now shows the same parts
 * panel in all three tabs:
 *   - Progress Reached: each part's box is the number it reached.
 *   - Amount Consumed and Per Unit: each part's box is how many were played.
 *   - Per Unit keeps its list of units below (one row per unit, each with its
 *     own time), so a unit's timestamp can still be changed.
 * The draft stays the Advanced one: a part's box sets that part's units in
 * v369Units (numbered after the part's saved progress; existing units and
 * their timestamps are kept), so the totals, runtime, XP preview and submit
 * are the ones Advanced logging already uses (and mf577FromUnits turns them
 * into the part moves History keeps).
 */
function mf580AdvItem(index){
  const e=S.logDraft?.entries?.[Number(index)];
  const item=e?v369ItemTitle(e):null;
  return {e,item:item&&mf577IsParts(item)?item:null};
}
function mf580AdvList(e,item){return mf577Clean(item,mf577FromUnits(e?.v369Units));}
/* Sets one part's units to qty (0 removes them). */
function mf580SetPartUnits(e,item,id,qty){
  const part=mf577Part(item,id);if(!part)return false;
  const from=Number(part.progress)||0,total=Number(part.total)>0?Number(part.total):0,repeat=!!e.isRepeat;
  let n=Math.max(0,Math.min(2000,Math.floor(Number(qty)||0)));
  if(total&&!repeat)n=Math.min(n,Math.max(0,total-from));
  const units=Array.isArray(e.v369Units)?e.v369Units:[];
  const mine=units.filter(u=>String(u?.seasonId||'')===String(part.id)).sort((a,b)=>(Number(a.number)||0)-(Number(b.number)||0));
  const keep=mine.slice(0,n);
  const now=Date.now(),secs=mf577PartSeconds(part,item);
  let num=keep.length?Math.max(...keep.map(u=>Number(u.number)||0)):(repeat?0:from);
  while(keep.length<n){
    num++;
    keep.push({id:uid(),number:num,seasonId:String(part.id),seasonName:String(part.name||''),seasonNumber:part.number??null,
      loggedAt:now,durationSeconds:secs,v369UpdatedAt:now,isRepeat:repeat});
  }
  e.v369Units=[...units.filter(u=>String(u?.seasonId||'')!==String(part.id)),...keep];
  e.v369SelectedSeasonId=String(part.id);
  e.v369NextNumber=num+1;
  e.v369UpdatedAt=now;
  return true;
}
function mf580AdvRefresh(index){
  try{v369Sync();}catch(_){}
  if(typeof v394Paint==='function')v394Paint(index);else if(typeof v369RefreshPanels==='function')v369RefreshPanels();
}
App.mf580AdvSet=function(index,id,value){
  const {e,item}=mf580AdvItem(index);if(!e||!item)return;
  const part=mf577Part(item,id);if(!part)return;
  const v=Math.max(0,Math.floor(Number(value)||0)),from=Number(part.progress)||0,total=Number(part.total)>0?Number(part.total):0;
  const reached=v394Method(e)==='last'&&!e.isRepeat;
  const qty=reached?Math.max(0,(total?Math.min(total,v):v)-from):v;
  const list=mf580AdvList(e,item);
  if(!qty&&list.length===1&&list[0].id===String(part.id)){showToast('Keep at least one part, or remove the title.');mf580AdvRefresh(index);return;}
  mf580SetPartUnits(e,item,id,qty);
  mf580AdvRefresh(index);
};
App.mf580AdvToggle=function(index,id){
  const {e,item}=mf580AdvItem(index);if(!e||!item)return;
  const list=mf580AdvList(e,item);
  if(list.some(r=>r.id===String(id))){
    if(list.length===1){showToast('Keep at least one part, or remove the title.');return;}
    mf580SetPartUnits(e,item,id,0);
  }else mf580SetPartUnits(e,item,id,1);
  mf580AdvRefresh(index);
};
/* A by-parts title added to Advanced logging starts on its default part, one unit. */
function mf580EnsureAdvParts(id){
  if(S.logDraft?.v369Interface!=='itemized')return;
  const index=(S.logDraft.entries||[]).findIndex(x=>String(x?.libraryId||'')===String(id));
  const {e,item}=mf580AdvItem(index);if(!e||!item||e.isRepeat)return;
  if(mf580AdvList(e,item).length)return;
  const part=mf577Default(item);if(!part)return;
  mf580SetPartUnits(e,item,part.id,1);
  try{v369Sync();}catch(_){}
}
if(typeof App.v378QuickAdd==='function'){
  const mf580QuickAddBase=App.v378QuickAdd;
  App.v378QuickAdd=function(id){
    const out=mf580QuickAddBase.apply(this,arguments);
    if(out){try{mf580EnsureAdvParts(id);if(typeof render==='function')render();}catch(_){}}
    return out;
  };
}
const mf580TitlePanelBase=v370TitlePanelHtml;
v370TitlePanelHtml=function(e,index){
  let raw=String(mf580TitlePanelBase.apply(this,arguments)||'');
  if(S.logDraft?.v369Interface!=='itemized'||!raw)return raw;
  const item=v369ItemTitle(e);if(!item)return raw;
  /* "4 matchs in draft" → "4 matches in draft" (the unit's real plural). */
  try{
    const key=typeof mf565UnitKey==='function'?mf565UnitKey(item,getCategory(item.categoryId)):getCategory(item.categoryId)?.unit;
    const one=String(unitLabel(key,1)||''),many=String(unitLabel(key,2)||'');
    if(one&&many&&one+'s'!==many)raw=raw.replace(new RegExp('\\b('+one.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')s\\b','gi'),(m,w)=>w[0]===w[0].toUpperCase()?many.charAt(0).toUpperCase()+many.slice(1):many);
  }catch(_){}
  if(!mf577IsParts(item))return raw;
  try{
    const host=document.createElement('div');host.innerHTML=raw;
    const panel=host.querySelector('.v370-title'),content=panel?.querySelector('.v370-title-content');
    if(!content)return raw;
    panel.classList.add('mf580-parts-title');
    const method=v394Method(e);
    /* Seasons, episode numbers and the season bar are replaced by the parts panel. */
    content.querySelectorAll(':scope > .v370-add-row,:scope > .mf577-season-bar,.mf394-bulk > .mf577-season-bar').forEach(el=>el.remove());
    const bulk=content.querySelector(':scope > .mf394-bulk');
    if(bulk){
      bulk.querySelectorAll(':scope > label.mf394-field,:scope > .mf504-step-field,:scope > .mf394-summary,:scope > .mf394-warning,:scope > .mf394-hint').forEach(el=>el.remove());
    }
    const parts=document.createElement('div');
    parts.innerHTML=mf577ControlsHtml('adv',index,item,mf580AdvList(e,item),!!e.isRepeat);
    const tabs=content.querySelector(':scope > .mf394-tabs');
    const node=parts.firstElementChild;
    if(node){node.classList.add('mf580-adv-parts');if(tabs)tabs.insertAdjacentElement('afterend',node);else content.insertAdjacentElement('afterbegin',node);}
    if(method==='unit'){
      /* Per Unit: the unit rows stay (each unit's own time), named by part. */
      content.querySelectorAll(':scope > .v370-unit-list,:scope > .v370-show-all').forEach(el=>{el.hidden=false;});
      content.querySelectorAll('.v370-unit-season').forEach(label=>{
        const t=[...label.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(t)t.textContent='Part';
        const sel=label.querySelector('select');if(sel){sel.setAttribute('aria-label',String(sel.getAttribute('aria-label')||'').replace('Season','Part'));
          for(const o of sel.options){const part=mf577Part(item,o.value);if(part)o.textContent=mf577PartName(part);}}
      });
    }
    return host.innerHTML;
  }catch(_){return raw;}
};

/* ---------- "+ add" bar under every Amount box ----------
 * Amount Consumed in Quick and Advanced logging and in Batch Log (normal
 * titles and each part of a by-parts title) gets a small second bar: type
 * the next amount and press + (or Enter) and it is added to the box, with
 * the sum shown ("3 + 2 + 4 = 9"), so nobody has to add in their head. The
 * box itself still holds the amount; the bar only adds to it. */
const MF580_SUMS=new Map();
/* What is typed in a + add bar survives a re-render (a blur can redraw the card). */
const MF580_TYPED=new Map();
function mf580Handler(input){return String(input.getAttribute('onchange')||input.getAttribute('oninput')||'');}
/* The amount now in the draft (the box can be blank while it shows a placeholder). */
function mf580Current(key,input){
  let m=key.match(/^App\.mf504SetQuickAmount\((\d+)/);
  if(m)return Math.max(0,Math.floor(Number(S.logDraft?.entries?.[Number(m[1])]?.qty)||0));
  m=key.match(/^App\.updateBatchRow\((\d+),'qty'/);
  if(m)return Math.max(0,Math.floor(Number(S.batchDraft?.rows?.[Number(m[1])]?.qty)||0));
  return Math.max(0,Math.floor(Number(input.value)||0));
}
function mf580IsAmountInput(input){
  const fn=mf580Handler(input);
  if(/App\.mf504SetQuickAmount\(/.test(fn))return true;
  if(/App\.(mf577SetPart|mf580AdvSet|mf577BatchSet)\(/.test(fn))return / amount$/.test(String(input.getAttribute('aria-label')||''));
  if(/App\.v394SetQuantity\(/.test(fn))return !!input.closest('.mf394-bulk[aria-label^="Amount Consumed"]');
  if(/App\.updateBatchRow\(\d+,'qty'/.test(fn)){
    try{return v179Mode('batch')==='amount';}catch(_){return false;}
  }
  return false;
}
function mf580SumText(key,value){
  const list=MF580_SUMS.get(key);
  if(!list||list.length<2)return '';
  const total=list.reduce((a,b)=>a+b,0);
  if(total!==Number(value)){MF580_SUMS.delete(key);return '';}
  return list.join(' + ')+' = '+total;
}
function mf580DecorateAdders(root){
  const scope=root&&root.querySelectorAll?root:document;
  for(const input of scope.querySelectorAll('input[type=number][onchange],input[type=number][oninput]')){
    if(input.dataset.mf580Adder||input.closest('.mf580-adder')||input.closest('[hidden]'))continue;
    if(!mf580IsAmountInput(input))continue;
    input.dataset.mf580Adder='1';
    const key=mf580Handler(input);
    const anchor=input.closest('.mf504-stepper')||input.closest('.mf579-part-head')||input;
    const sum=mf580SumText(key,mf580Current(key,input));
    anchor.insertAdjacentHTML('afterend','<div class="mf580-adder" data-mf580-key="'+escapeHtml(key)+'"><input type="number" min="0" step="1" inputmode="numeric" placeholder="+ add" aria-label="Add another amount" value="'+escapeHtml(MF580_TYPED.get(key)||'')+'"><button type="button" class="btn btn-sm" aria-label="Add to the amount">+</button>'+(sum?'<small class="mf580-sum">'+escapeHtml(sum)+'</small>':'')+'</div>');
  }
}
function mf580Add(box){
  const extra=box.querySelector('input'),n=Math.floor(Number(extra?.value)||0);
  if(!extra||n<=0){extra?.focus();return;}
  const key=box.dataset.mf580Key||'';
  const near=box.previousElementSibling;
  const main=near?.matches?.('input')?near:near?.querySelector?.('label input[type=number],.mf504-stepper input[type=number],input[type=number]');
  if(!main)return;
  const before=mf580Current(key,main);
  const prev=MF580_SUMS.get(key);
  const list=prev&&prev.reduce((a,b)=>a+b,0)===before?[...prev,n]:before>0?[before,n]:[n];
  MF580_SUMS.set(key,list);
  main.value=String(before+n);
  extra.value='';MF580_TYPED.delete(key);
  main.dispatchEvent(new Event(main.hasAttribute('onchange')?'change':'input',{bubbles:true}));
  requestAnimationFrame(()=>{mf580DecorateAdders(document);const again=[...document.querySelectorAll('.mf580-adder')].find(b=>b.dataset.mf580Key===key&&!b.closest('[hidden]')&&b.offsetParent);again?.querySelector('input')?.focus();});
}
document.addEventListener('click',ev=>{const b=ev.target.closest?.('.mf580-adder button');if(b){ev.preventDefault();mf580Add(b.closest('.mf580-adder'));}});
document.addEventListener('input',ev=>{const box=ev.target.closest?.('.mf580-adder');if(box&&ev.target.matches('input'))MF580_TYPED.set(box.dataset.mf580Key||'',ev.target.value);});
document.addEventListener('keydown',ev=>{if(ev.key!=='Enter')return;const box=ev.target.closest?.('.mf580-adder');if(box){ev.preventDefault();mf580Add(box);}});
let MF580_ADDER_FRAME=0;
new MutationObserver(()=>{if(MF580_ADDER_FRAME)return;MF580_ADDER_FRAME=requestAnimationFrame(()=>{MF580_ADDER_FRAME=0;mf580DecorateAdders(document);});})
  .observe(document.documentElement,{childList:true,subtree:true});

/* ---------- Customize total runtime: Batch Log, and stopwatch / calculator ----------
 * Batch Log rows get "Customize total runtime" (HH:MM:SS), like Advanced
 * logging. Every Customize total runtime (Advanced logging and Batch Log)
 * has "Use stopwatch time" and "Use runtime calculator": they fill in the
 * Stopwatch's time or the Runtime Calculator's result. */
if(typeof MF577_ROW_KEYS!=='undefined'&&Array.isArray(MF577_ROW_KEYS)){
  for(const k of ['mf580RuntimeManual','mf580RuntimeSeconds'])if(!MF577_ROW_KEYS.includes(k))MF577_ROW_KEYS.push(k);
}
function mf580StopwatchSeconds(){
  const sw=S.stopwatch||{};
  const ms=sw.running?(Number(sw.elapsed)||0)+Date.now()-(Number(sw.startedAt)||Date.now()):(Number(sw.elapsed)||0);
  return Math.max(0,Math.round(ms/1000));
}
function mf580CalculatorSeconds(){
  try{const st=v256EnsureRuntimeState();return st.hasResult?Math.max(0,Math.round(Number(st.resultSeconds)||0)):0;}catch(_){return 0;}
}
function mf580TimeSource(source){
  const secs=source==='calculator'?mf580CalculatorSeconds():mf580StopwatchSeconds();
  if(secs>0)return secs;
  showToast(source==='calculator'?'Calculate a runtime first (Runtime Calculator on the Dashboard).':'The Stopwatch is at 00:00:00 — start it first (Dashboard).');
  return 0;
}
function mf580TimeButtons(kind,index){
  return '<span class="mf580-time-buttons"><button type="button" class="btn btn-sm" onclick="App.mf580UseTime(\''+kind+'\','+Number(index)+',\'stopwatch\')">Use stopwatch time</button>'+
    '<button type="button" class="btn btn-sm" onclick="App.mf580UseTime(\''+kind+'\','+Number(index)+',\'calculator\')">Use runtime calculator</button></span>';
}
function mf580SetBatchRuntime(i,secs){
  const r=S.batchDraft?.rows?.[Number(i)];if(!r)return;
  r.mf580RuntimeManual=true;r.mf580RuntimeSeconds=Math.max(0,Math.round(secs));
  r.minutes=Math.round(r.mf580RuntimeSeconds/60*100)/100;
  r.mf577MinutesManual=true;
  try{if(typeof mf577BatchTouch==='function')mf577BatchTouch();}catch(_){}
  render();
}
App.mf580UseTime=function(kind,index,source){
  const secs=mf580TimeSource(source);if(!secs)return;
  if(kind==='batch'){mf580SetBatchRuntime(index,secs);showToast('Total runtime set to '+v369Hms(secs)+'.');return;}
  const e=v394Entry(index);if(!e)return;
  if(!(e.v369Units||[]).length){showToast('Add consumed units before customizing their total runtime.');return;}
  App.v394SetRuntime(index,v369Hms(secs));
  showToast('Total runtime set to '+v369Hms(secs)+'.');
};
App.mf580BatchRuntimeToggle=function(i,on){
  const r=S.batchDraft?.rows?.[Number(i)];if(!r)return;
  if(on){
    const secs=Math.round((Number(r.minutes)||0)*60);
    r.mf580RuntimeManual=true;r.mf580RuntimeSeconds=secs;r.mf577MinutesManual=true;
  }else{
    delete r.mf580RuntimeManual;delete r.mf580RuntimeSeconds;delete r.mf577MinutesManual;
    const item=r.libraryId?S.library.find(x=>String(x.id)===String(r.libraryId)):null;
    if(item){
      const cat=getCategory(item.categoryId);
      if(mf577IsParts(item)&&Array.isArray(r.mf577Parts))r.minutes=mf577Minutes(item,cat,r.mf577Parts);
      else if(typeof mf569Minutes==='function'&&Number(r.qty)>0)r.minutes=mf569Minutes(item,cat,Number(r.qty));
    }
  }
  try{if(typeof mf577BatchTouch==='function')mf577BatchTouch();}catch(_){}
  render();
};
App.mf580BatchRuntimeSet=function(i,value){
  const m=/^(\d{1,5}):([0-5]\d):([0-5]\d)$/.exec(String(value||'').trim());
  if(!m){showToast('Use total runtime as HH:MM:SS.');render();return;}
  mf580SetBatchRuntime(i,Number(m[1])*3600+Number(m[2])*60+Number(m[3]));
};
/* Typing in the Minutes box ends a custom runtime that no longer matches it. */
const mf580UpdateBatchRowBase=App.updateBatchRow;
App.updateBatchRow=function(i,key,value){
  const r=S.batchDraft?.rows?.[Number(i)];
  if(r&&key==='minutes'&&r.mf580RuntimeManual)r.mf580RuntimeSeconds=Math.max(0,Math.round((Number(value)||0)*60));
  return mf580UpdateBatchRowBase.apply(this,arguments);
};
const mf580RenderBatchBase=renderBatchLog;
renderBatchLog=function(){
  const html=String(mf580RenderBatchBase.apply(this,arguments)||'');
  try{
    const host=document.createElement('div');host.innerHTML=html;
    let changed=false;
    host.querySelectorAll('input[oninput*="\'minutes\'"],input[onchange*="\'minutes\'"]').forEach(input=>{
      const m=/updateBatchRow\((\d+),'minutes'/.exec(input.getAttribute('oninput')||input.getAttribute('onchange')||'');if(!m)return;
      const i=Number(m[1]),r=S.batchDraft?.rows?.[i],row=input.closest('.batch-log-row');
      if(!r||!row||row.querySelector('.mf580-runtime'))return;
      const on=!!r.mf580RuntimeManual,secs=on?Number(r.mf580RuntimeSeconds)||0:Math.round((Number(r.minutes)||0)*60);
      row.insertAdjacentHTML('beforeend','<div class="mf580-runtime mf394-runtime"><label class="mf394-runtime-toggle"><input type="checkbox" '+(on?'checked':'')+' onchange="App.mf580BatchRuntimeToggle('+i+',this.checked)"> Customize total runtime</label>'+
        (on?'<label class="mf394-field">Total runtime (HH:MM:SS) <input aria-label="Custom total runtime" type="text" inputmode="numeric" pattern="[0-9]+:[0-5][0-9]:[0-5][0-9]" value="'+v369Hms(secs)+'" onchange="App.mf580BatchRuntimeSet('+i+',this.value)"></label>'+mf580TimeButtons('batch',i):
          '<div class="mf394-auto-runtime">Automatic: <strong>'+v369Hms(secs)+'</strong></div>')+'</div>');
      changed=true;
    });
    return changed?host.innerHTML:html;
  }catch(_){return html;}
};
/* Advanced logging: the two buttons under the custom total runtime. */
const mf580PanelRuntimeBase=v370TitlePanelHtml;
v370TitlePanelHtml=function(e,index){
  const raw=String(mf580PanelRuntimeBase.apply(this,arguments)||'');
  if(S.logDraft?.v369Interface!=='itemized'||!raw||!e?.v394RuntimeManual||!raw.includes('App.v394SetRuntime('))return raw;
  try{
    const host=document.createElement('div');host.innerHTML=raw;
    const input=host.querySelector('input[onchange^="App.v394SetRuntime("]');
    const label=input?.closest('label');
    if(label&&!label.parentElement.querySelector('.mf580-time-buttons'))label.insertAdjacentHTML('afterend',mf580TimeButtons('adv',index));
    return host.innerHTML;
  }catch(_){return raw;}
};
window.MediaFlowV580=Object.freeze({version:580,feature:'by-parts titles in Advanced logging; + add bar under Amount boxes',decorate:mf580DecorateAdders});
