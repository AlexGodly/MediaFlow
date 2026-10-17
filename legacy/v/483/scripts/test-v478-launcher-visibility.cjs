/* v478 — Background Processes header completeness and safe-space rule.
 * Original v469/v476/v477 job functions, cloud data and preferences untouched. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'478');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/365-v478-background-launcher-visibility.js');
assert.equal(order.at(-2),'components/364-v477-background-footer-layout.js');
const css=fs.readFileSync('assets/css/279-v478-background-launcher-visibility.css','utf8');
const source=fs.readFileSync('src/js/components/365-v478-background-launcher-visibility.js','utf8');
assert(fs.readFileSync('assets/css/277-v476-background-processes-premium.css','utf8').includes('var(--flow)'), 'v478 must inherit MediaFlow theme-driven v476 skin');
assert(fs.readFileSync('index.html','utf8').includes('279-v478-background-launcher-visibility.css'));
for(const token of [
 'mf476-widget:not(.mf441-expanded)','max-height:none!important',
 'min-height:116px!important','.mf476-widget-name strong',
 '.mf476-widget-name small','.mf476-widget-summary',
 '.mf476-metric-label','.mf476-metric-value',
 'width:min(292px,calc(100vw - 20px))',
 'grid-template-columns:repeat(2,minmax(0,1fr))',
 'display:flex!important','white-space:normal!important',
 '@media screen and (max-width:720px)','@media screen and (max-width:340px)',
 '@media (prefers-reduced-motion:reduce)'
])assert(css.includes(token),'Missing complete launcher layout: '+token);
const attrs={visibility:'unknown'},state={jobs:2},calls={base:0,saves:0};
const classes=new Set(['mf476-widget','mf462-ready']);
const widget={
 classList:{contains:c=>classes.has(c),toggle(c,b){if(b)classes.add(c);else classes.delete(c);}},
 dataset:{},querySelector:()=>({getBoundingClientRect:()=>({height:118})})
};
const mock={
  document:{getElementById:id=>id==='mf441-process-widget'?widget:null},
  mf469Layout:()=>{calls.base++;return {...attrs,mobile:true,widget:true,room:attrs.room}},
  mf469Schedule:()=>{},window:{},MediaFlowRuntime:{version:477},
  saveState:()=>{calls.saves++;}
};
const context=vm.createContext(mock);
vm.runInContext(source,context,{filename:'v478.js'});
attrs.room=60;
let outcome=context.mf469Layout();
assert.equal(outcome.unclipped,false);
assert.equal(widget.dataset.mf478Visibility,'temporarily-hidden');
assert(classes.has('mf469-no-room'),'No room must never crop a dot/label fragment');
attrs.room=130;
outcome=context.mf469Layout();
assert.equal(outcome.unclipped,true);
assert(!classes.has('mf469-no-room'),'Enough space must reveal entire launcher');
assert.equal(outcome.required,125);
assert.equal(widget.dataset.mf478Visibility,'complete');
classes.add('mf441-expanded');
attrs.room=185;
outcome=context.mf469Layout();
assert.equal(outcome.required,193);
assert(!outcome.unclipped,'Expanded panel needs header + scroll area');
attrs.room=260;
assert(context.mf469Layout().unclipped,'Expanded restores when space available');
classes.delete('mf441-expanded');
attrs.room=130;
assert(context.window.MediaFlowV478.layout().unclipped);
assert.equal(context.window.MediaFlowV478.status().visibility,'complete');
assert.equal(context.MediaFlowRuntime.version,478);
assert.equal(calls.saves,0,'v478 must not save/change account state');
assert.deepEqual(state,{jobs:2});
console.log('PASS v478: full header + two metrics, no cropped dots, room guard hides/reveals without cloud writes');
