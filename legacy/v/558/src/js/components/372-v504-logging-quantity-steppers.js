/* MediaFlow v504 — +/- quantity steppers for Quick and Advanced Logging.
 * Presentation and draft-only mutations. Existing submit, season, runtime,
 * timestamp, XP and History handlers remain authoritative.
 */
const MF504_VERSION=504;
const MF504_STEP_LIMIT=999999;
const MF504_ICON_MINUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
const MF504_ICON_PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>';

function mf504Value(value){
 if(value===null||String(value).trim()==='')return NaN;
 const n=Number(value);
 return Number.isSafeInteger(n)?n:NaN;
}
function mf504Bound(value,min,max){
 return Math.max(min,Math.min(max,value));
}
function mf504QuickMax(item){
 const total=Math.floor(Number(item?.total)||0);
 if(!item||total<=0)return MF504_STEP_LIMIT;
 const start=v179StartProgress(item);
 return Math.max(0,Math.min(MF504_STEP_LIMIT,total-start));
}
function mf504AdvancedBounds(index){
 const e=v394Entry(index),item=e?v369ItemTitle(e):null;
 if(!e||!item)return {min:0,max:0};
 const {season}=v394Relevant(e,item);
 const base=v394Base(e,item,season);
 const total=v394NumberLimit(season,item);
 const countMax=Math.min(2000,total>0?Math.max(0,total-base):2000);
 if(v394Method(e)==='last')return {min:base,max:base+countMax};
 return {min:0,max:countMax};
}
function mf504Bounds(kind,index){
 if(kind==='advanced')return mf504AdvancedBounds(index);
 if(kind==='quick-entry-progress'||kind==='quick-progress'){
  const item=kind==='quick-entry-progress'
    ?(S.library||[]).find(x=>String(x.id)===String(S.entryDraft?.libraryId||''))
    :v369ItemTitle(S.logDraft?.entries?.[index]);
  const entry=kind==='quick-progress'?S.logDraft?.entries?.[index]:null;
  const start=entry?(Number.isFinite(Number(entry.v179StartProgress))?Math.max(0,Number(entry.v179StartProgress)):v179StartProgress(item))
    :item?v179StartProgress(item):0;
  const total=Math.floor(Number(item?.total)||0);
  return {min:start,max:total>0?Math.max(start,total):MF504_STEP_LIMIT};
 }
 if(kind==='quick-entry-amount'){
  const item=(S.library||[]).find(x=>String(x.id)===String(S.entryDraft?.libraryId||''));
  return {min:1,max:Math.max(1,mf504QuickMax(item))};
 }
 if(kind==='quick-amount'){
  return {min:0,max:mf504QuickMax(v369ItemTitle(S.logDraft?.entries?.[index]))};
 }
 return {min:0,max:MF504_STEP_LIMIT};
}
function mf504WrapInput(input,kind,index,labelText){
 if(!input||input.dataset.mf504Enhanced)return;
 const b=mf504Bounds(kind,index);
 input.dataset.mf504Enhanced='1';
 input.dataset.mf504Kind=kind;
 input.dataset.mf504Index=String(index);
 input.step='1';input.min=String(b.min);input.max=String(b.max);
 const id='mf504-'+kind+'-'+index;
 input.id=input.id||id;
 // Move the input out of its enclosing label. Buttons may not be nested
 // inside a label, otherwise clicking +/- can activate the input unexpectedly.
 const oldLabel=input.parentElement?.closest('label');
 let holder;
 if(oldLabel?.contains(input)){
  holder=document.createElement('div');
  holder.className=(oldLabel.className||'')+' mf504-step-field';
  const caption=oldLabel.cloneNode(true);
  caption.querySelectorAll('input').forEach(el=>el.remove());
  caption.className='mf504-step-label';
  caption.htmlFor=input.id;
  oldLabel.replaceWith(holder);
  holder.appendChild(caption);
 }else{
  holder=document.createElement('div');
  holder.className='mf504-step-field';
  input.parentNode.insertBefore(holder,input);
 }
 const controls=document.createElement('div');
 controls.className='mf504-stepper';
 controls.dataset.mf504Kind=kind;
 controls.dataset.mf504Index=String(index);
 const minus=document.createElement('button'),plus=document.createElement('button');
 for(const [button,delta,icon,name] of [[minus,-1,MF504_ICON_MINUS,'Decrease'],[plus,1,MF504_ICON_PLUS,'Increase']]){
  button.type='button';button.className='btn btn-sm btn-ghost mf504-step-button';
  button.dataset.mf504Delta=String(delta);
  button.setAttribute('aria-label',name+' '+labelText);
  button.setAttribute('title',name+' '+labelText);
  button.setAttribute('onclick',"App.mf504Step('"+kind+"',"+index+","+delta+")");
  button.innerHTML=icon;
 }
 controls.append(minus,input,plus);
 holder.appendChild(controls);
 if(kind==='quick-entry-amount'||kind==='quick-entry-progress')holder.classList.add('mf504-entry-step-field');
 mf504UpdateButtons(controls);
}
function mf504UpdateButtons(controls){
 if(!controls)return;
 const kind=controls.dataset.mf504Kind,index=Number(controls.dataset.mf504Index);
 const {min,max}=mf504Bounds(kind,index),input=controls.querySelector('input');
 if(!input)return;
 input.min=String(min);input.max=String(max);
 const value=mf504Value(input.value);
 const minus=controls.querySelector('[data-mf504-delta="-1"]'),plus=controls.querySelector('[data-mf504-delta="1"]');
 if(minus)minus.disabled=!Number.isFinite(value)||value<=min;
 if(plus)plus.disabled=!Number.isFinite(value)||value>=max;
}
function mf504ValidateQuick(value,kind,index){
 const n=mf504Value(value),{min,max}=mf504Bounds(kind,index);
 if(!Number.isFinite(n)||n<min||n>max){
  showToast('Enter a whole number between '+min+' and '+max+'.');
  return null;
 }
 return n;
}
function mf504KeepViewport(callback){
 const y=window.scrollY,x=window.scrollX;
 const selectors=['.main','.log-form','.v238-log-library','.mf419-workspace-body'];
 const positions=selectors.map(selector=>[selector,document.querySelector(selector)?.scrollTop||0]);
 const result=callback();
 // A Quick Logging render can replace its scrolling host.
 for(const [selector,top] of positions){
  const el=document.querySelector(selector);
  if(el&&top>0)el.scrollTop=top;
 }
 if(window.scrollY!==y||window.scrollX!==x)window.scrollTo(x,y);
 return result;
}
/* Quick Logging Amount Consumed previously displayed a read-only chip.
 * Allow explicit draft editing without ever writing a Library title. */
App.mf504SetQuickAmount=function(index,raw){
 const entry=S.logDraft?.v369Interface==='quick'?S.logDraft?.entries?.[Number(index)]:null;
 if(!entry||v179Mode('single')!=='amount')return;
 const quantity=mf504ValidateQuick(raw,'quick-amount',Number(index));
 if(quantity===null){render();return;}
 if(quantity!==mf504Value(entry.qty)){
  entry.qty=quantity;entry.v369UpdatedAt=Date.now();
  v179SyncSingleFromEntries();
  v369Touch();
 }
 mf504KeepViewport(()=>render());
};
App.mf504Step=function(kind,index,delta){
 if(!S.logging||!S.logDraft||![1,-1].includes(delta))return;
 if(kind.startsWith('quick')&&S.logDraft.v369Interface!=='quick')return;
 if(kind==='advanced'&&S.logDraft.v369Interface!=='itemized')return;
 const controls=[...document.querySelectorAll('.log-form .mf504-stepper')].find(el=>el.dataset.mf504Kind===kind&&Number(el.dataset.mf504Index)===Number(index));
 const input=controls?.querySelector('input');
 if(!input)return;
 const value=mf504Value(input.value),b=mf504Bounds(kind,index);
 if(!Number.isFinite(value)){showToast('Enter a valid whole number first.');return;}
 const next=mf504Bound(value+delta,b.min,b.max);
 if(next===value)return;
 if(kind==='advanced'){
  // Native handler owns safe 2,000-unit cap, season selection, undo tombstones
  // and confirmation before replacing non-contiguous or mixed-timestamp units.
  App.v394SetQuantity(index,next);
 }else if(kind==='quick-progress'){
  mf504KeepViewport(()=>App.v179SetLogEntryEnd(index,next));
  v369Touch();
 }else if(kind==='quick-amount'){
  App.mf504SetQuickAmount(index,next);
 }else{
  // Initial Quick Logging title entry: preserve existing oninput listeners.
  input.value=String(next);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  mf504UpdateButtons(controls);
  v369Touch();
 }
 // Restore keyboard focus after card-level rerenders.
 if(kind==='advanced'||kind==='quick-progress'||kind==='quick-amount'){
  const updated=[...document.querySelectorAll('.log-form .mf504-stepper')].find(el=>el.dataset.mf504Kind===kind&&Number(el.dataset.mf504Index)===Number(index));
  updated?.querySelector('[data-mf504-delta="'+delta+'"]')?.focus({preventScroll:true});
 }
};
function mf504DecorateQuickCards(raw){
 if(S.logDraft?.v369Interface!=='quick'||!raw)return raw;
 const host=document.createElement('div');host.innerHTML=raw;
 host.querySelectorAll('.v239-logged-title-card').forEach((card,index)=>{
  const entry=S.logDraft?.entries?.[index],actions=card.querySelector('.v239-logged-title-actions');
  if(!entry||!actions)return;
  const progress=actions.querySelector('.v239-logged-progress input[type="number"]');
  if(progress){mf504WrapInput(progress,'quick-progress',index,'last progress');return;}
  const chip=actions.querySelector('.v239-logged-consumed');
  if(!chip)return;
  const field=document.createElement('div');field.className='mf504-amount-inline';
  const label=document.createElement('label');label.className='mf504-step-label';label.textContent='Amount consumed';label.htmlFor='mf504-quick-amount-'+index;
  const input=document.createElement('input');
  input.type='number';input.inputMode='numeric';input.id='mf504-quick-amount-'+index;
  input.value=String(Math.max(0,Math.floor(Number(entry.qty)||0)));
  input.setAttribute('onchange','App.mf504SetQuickAmount('+index+',this.value)');
  field.append(label,input);chip.replaceWith(field);
  const unit=document.createElement('span');unit.className='mf504-amount-unit';
  const item=v369ItemTitle(entry);
  unit.textContent=item?v179ProgressNoun(item,Number(entry.qty)||0):'units';
  field.appendChild(unit);
  mf504WrapInput(input,'quick-amount',index,'amount consumed');
 });
 return host.innerHTML;
}
const mf504QuickCardsBase=v239LoggedTitlesHtml;
v239LoggedTitlesHtml=function(entries){
 return mf504DecorateQuickCards(String(mf504QuickCardsBase.apply(this,arguments)||''));
};
/* Add +/- to the Advanced Logging bulk input, but not the Per Unit timeline,
 * and do not change the shared v394SetQuantity model. */
const mf504AdvancedBulkBase=v394BulkPanel;
v394BulkPanel=function(e,index,item){
 const raw=String(mf504AdvancedBulkBase.apply(this,arguments)||'');
 if(!raw||!['last','amount'].includes(v394Method(e)))return raw;
 const host=document.createElement('div');host.innerHTML=raw;
 const input=host.querySelector('.mf394-bulk > label.mf394-field input[type="number"]');
 if(input)mf504WrapInput(input,'advanced',index,v394Method(e)==='last'?'last watched unit':'amount consumed');
 return host.innerHTML;
};
/* Quick initial title selection also supports +/- for both logging methods.
 * Do not add controls to readonly aggregated consumption totals. */
const mf504LogFormBase=renderLogForm;
renderLogForm=function(){
 const raw=String(mf504LogFormBase.apply(this,arguments)||'');
 if(S.logDraft?.v369Interface!=='quick')return raw;
 const host=document.createElement('div');host.innerHTML=raw;
 const mode=v179Mode('single');
 const field=host.querySelector(mode==='progress'?'#entry-progress':'#entry-qty');
 if(field)mf504WrapInput(field,mode==='progress'?'quick-entry-progress':'quick-entry-amount',-1,
  mode==='progress'?'last progress':'amount consumed');
 return host.innerHTML;
};
/* Keep stepper boundary buttons in sync when the numeric input is typed in. */
document.addEventListener('input',event=>{
 const controls=event.target.closest?.('.mf504-stepper');
 if(controls)mf504UpdateButtons(controls);
});
window.MediaFlowV504=Object.freeze({version:504,step:App.mf504Step,bounds:mf504Bounds});
