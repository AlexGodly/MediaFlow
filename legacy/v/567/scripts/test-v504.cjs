#!/usr/bin/env node
/* v504 quantity safety regression tests: executes the real source module with
 * stubbed application state, no network/browser account or Library writes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'src/js/components/372-v504-logging-quantity-steppers.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const order=JSON.parse(fs.readFileSync(path.join(root,'src/js/runtime-order.json'),'utf8'));
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
assert.equal(fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),'504');
for(const field of ['appVersion','version','build'])assert.equal(version[field],504);
assert.equal(order.filter(s=>s==='components/372-v504-logging-quantity-steppers.js').length,1);
assert.match(index,/mediaflow-v504\.bundle\.js/);
assert.match(index,/285-v504-logging-quantity-steppers\.css/);
assert.match(index,/<meta name="mediaflow-version" content="504">/);
const built=fs.readFileSync(path.join(root,'assets/js/mediaflow-v504.bundle.js'),'utf8');
assert.ok(built.includes(js),'Full built script must contain the entire tested module');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.match(sw,/const MEDIAFLOW_VERSION=504;/);
assert.match(sw,/mediaflow-pwa-v504-shell/);
assert.match(sw,/\.\/assets\/css\/285-v504-logging-quantity-steppers\.css/);
assert.match(sw,/\.\/assets\/js\/mediaflow-v504\.bundle\.js/);
const css=fs.readFileSync(path.join(root,'assets/css/285-v504-logging-quantity-steppers.css'),'utf8');
for(const token of ['.mf504-stepper','.mf394-bulk','.v239-logged-title-actions','@media(max-width:380px)'])
 assert.ok(css.includes(token),token);
const item={id:'anime1',progress:9,total:14};
let touches=0,renders=0,syncs=0,updates=[],toasts=[];
let control=null;
const context={
 S:{logging:true,library:[item],logDraft:{v369Interface:'quick',entries:[{libraryId:'anime1',qty:2,v179StartProgress:9,v179EndProgress:11}]},entryDraft:{libraryId:'anime1',qty:1}},
 App:{v179SetLogEntryEnd:(index,next)=>updates.push(['quick-progress',index,next]),v394SetQuantity:(index,next)=>updates.push(['advanced',index,next])},
 window:{scrollY:0,scrollX:0,scrollTo(){}},
 document:{addEventListener(){},querySelector(){return null},querySelectorAll(){return control?[control]:[]}},
 Number,Date,Math,Set,Map,console,
 v239LoggedTitlesHtml:()=>'',v394BulkPanel:()=>'',renderLogForm:()=>'',render:()=>{renders++;},
 v179Mode:()=> 'amount', v179StartProgress:(x)=> x.progress>=x.total?0:x.progress,
 v369ItemTitle:(entry)=>entry?.libraryId==='anime1'?item:null,
 v369Touch:()=>{touches++},
 v179SyncSingleFromEntries:()=>{syncs++},
 showToast:(value)=>toasts.push(value),
 v394Entry:(index)=>context.S.logDraft.entries[index],
 v394Relevant:()=>({season:{progress:4,total:12},units:[]}),
 v394Base:(e,item,season)=>season.progress,
 v394NumberLimit:(season)=>season.total,
 v394Method:(e)=>e.v394Method||'amount'
};
vm.createContext(context);
vm.runInContext(js,context,{filename:'372-v504-logging-quantity-steppers.js'});
const evalJs=(s)=>vm.runInContext(s,context);
let range=evalJs("mf504Bounds('quick-amount',0)");
assert.equal(range.min,0);assert.equal(range.max,5,'Saved 9/14 caps amount to five units');
range=evalJs("mf504Bounds('quick-entry-amount',-1)");
assert.equal(range.min,1);assert.equal(range.max,5);
assert.ok(Number.isNaN(evalJs("mf504Value('2.5')")),'Fractional steps are rejected');
assert.equal(evalJs("mf504ValidateQuick(-1,'quick-amount',0)"),null);
assert.ok(toasts.at(-1).includes('between 0 and 5'));
context.App.mf504SetQuickAmount(0,'3');
assert.equal(context.S.logDraft.entries[0].qty,3);
assert.equal(syncs,1);assert.equal(touches,1);
assert.equal(renders,1);
assert.equal(context.S.library[0].progress,9,'Never modify saved Library progress');
assert.equal(context.S.library[0].total,14,'Never modify saved Library totals');
const input={value:'3'};
const minus={disabled:false,focus(){}},plus={disabled:false,focus(){}};
control={dataset:{mf504Kind:'quick-amount',mf504Index:'0'},
 querySelector(selector){
  if(selector==='input')return input;
  if(selector.includes('"-1"'))return minus;
  if(selector.includes('"1"'))return plus;
  return null;
 }};
context.App.mf504Step('quick-amount',0,1);
assert.equal(context.S.logDraft.entries[0].qty,4);
assert.equal(syncs,2);
context.App.mf504SetQuickAmount(0,'10');
assert.equal(context.S.logDraft.entries[0].qty,4,'Out-of-bounds direct entry cannot corrupt draft');
input.value='5';
context.App.mf504Step('quick-amount',0,1);
assert.equal(context.S.logDraft.entries[0].qty,4,'At max, + is a no-op');
context.S.logDraft.entries[0].qty=2;
context.S.logDraft.entries[0].v394Method='last';
context.S.logDraft.v369Interface='itemized';
range=evalJs("mf504Bounds('advanced',0)");
assert.equal(range.min,4);assert.equal(range.max,12);
context.S.logDraft.entries[0].v394Method='amount';
range=evalJs("mf504Bounds('advanced',0)");
assert.equal(range.min,0);assert.equal(range.max,8);
context.S.logDraft.entries[0].v394Method='last';
context.v394Relevant=()=>({season:{progress:4,total:0},units:[]});
range=evalJs("mf504Bounds('advanced',0)");
assert.equal(range.min,4);assert.equal(range.max,2004,'Unbounded seasons still honor 2000-unit safety');
control.dataset.mf504Kind='advanced';input.value='4';
context.App.mf504Step('advanced',0,1);
assert.deepEqual(updates.at(-1),['advanced',0,5],'Stepper delegates to canonical Advanced Logging handler');
context.S.logDraft.v369Interface='quick';
control.dataset.mf504Kind='quick-progress';input.value='10';
context.App.mf504Step('quick-progress',0,1);
assert.deepEqual(updates.at(-1),['quick-progress',0,11],'Quick last progress retains existing handler');
assert.ok(!/Missing cover|v239LoggedCover\(/.test(js),'Do not touch existing missing cover behavior in v504');
console.log('PASS v504: version/PWA, Quick amount edits, safe limits, Advanced seasons, canonical progress handlers');
