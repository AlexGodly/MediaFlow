/* MediaFlow v499 — Logging picker state and cover regression contracts. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='src/js/components/387-v499-logging-interaction-audit.js';
execFileSync('node',['--check',file]);
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'501');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/389-v501-logging-library-cover-fallback.js');
const index=fs.readFileSync('index.html','utf8');
assert.match(index,/mediaflow-v501\.bundle\.js/);
assert.match(index,/301-v499-added-logging-covers\.css/);
assert.match(index,/302-v499-ambient-motion-corrections\.css/);
const css=fs.readFileSync('assets/css/301-v499-added-logging-covers.css','utf8');
assert.match(css,/\.v370-title-cover\.mf498-logging-cover/);
assert.match(css,/align-self:start!important/);
assert.match(css,/aspect-ratio:2 \/ 3!important/);
assert.match(css,/object-fit:contain!important/);
assert.match(css,/min-height:0!important/);
assert.match(css,/v239-logged-cover\.mf498-logging-cover/);
const motion=fs.readFileSync('assets/css/302-v499-ambient-motion-corrections.css','utf8');
assert.match(motion,/html\[data-mf484-mode="advanced"\]\[data-mf484-living="advanced"\]\[data-mf497-motion="on"\]/);
assert.match(motion,/html\[data-mf484-mode="custom"\]/);
assert.match(motion,/prefers-reduced-motion:reduce/);
assert.match(motion,/data-mf497-performance="full"/);
let selections=0,adds=0,clears=0;
const selected=new Set(['a']);
const title={dataset:{mf378Id:'a'},checkbox:{checked:true},cover:{dataset:{}},
 querySelector(selector){
  if(selector.includes('input[type="checkbox"]'))return this.checkbox;
  if(selector==='.mf498-logging-cover')return this.cover;
  return null;
 }};
const other={dataset:{mf378Id:'b'},checkbox:{checked:false},cover:{dataset:{}},
 querySelector:title.querySelector};
function host(){
 let html='';
 return {querySelectorAll:()=>[title,other],
 get innerHTML(){return html},
 set innerHTML(value){html=value}};
}
const root=host();
const ctx={window:{},console,Object,Array,Set,JSON,String,
 V378_LOG_UI:{selected},
 App:{
  v378Pick(id,on){selections++;if(on)selected.add(id);else selected.delete(id);title.checkbox.checked=on},
  v378SelectVisible(){adds++;selected.add('b');other.checkbox.checked=true},
  v378DeselectAll(){clears++;selected.clear();title.checkbox.checked=false;other.checkbox.checked=false}
 },
 document:{createElement:host,getElementById:id=>id==='log-suggestions'?root:null},
 v224LogSuggestionsHtml:()=>'<div class="mf379-picker"><div class="log-suggestion">mock</div></div>',
 MediaFlowRuntime:{version:498}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
assert.equal(ctx.window.MediaFlowV499.version,499);
ctx.v224LogSuggestionsHtml();
assert.equal(title.dataset.mf499Selected,'true');
assert.equal(other.dataset.mf499Selected,'false');
assert.equal(title.cover.dataset.mf499Cover,'picker');
ctx.App.v378Pick('a',false);
assert.equal(title.dataset.mf499Selected,'false');
ctx.App.v378SelectVisible();
assert.equal(other.dataset.mf499Selected,'true');
ctx.App.v378DeselectAll();
assert.equal(title.dataset.mf499Selected,'false');
assert.equal(other.dataset.mf499Selected,'false');
assert.equal(selections,1);
assert.equal(adds,1);
assert.equal(clears,1);
assert.equal(ctx.window.MediaFlowV499.status().errors,0);
assert.equal(ctx.MediaFlowRuntime.version,499);
console.log('v499 picker PASS: checked state synchronization, bulk selection, cover semantics, no re-render');
