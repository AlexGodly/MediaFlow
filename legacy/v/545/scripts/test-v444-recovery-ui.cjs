/* MediaFlow v444 — deterministic confirmation and floating menu safety checks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert(Number(fs.readFileSync('VERSION','utf8').trim())>=444);
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/324-v444-recovery-ui-corrections.js'));
const src=fs.readFileSync('src/js/components/324-v444-recovery-ui-corrections.js','utf8');
const css=fs.readFileSync('assets/css/251-v444-recovery-ui-corrections.css','utf8');
const meta=fs.readFileSync('src/js/components/319-v439-metadata-recovery.js','utf8');
const hardening=fs.readFileSync('src/js/components/322-v442-recovery-hardening.js','utf8');
const cover=fs.readFileSync('src/js/components/310-v425-cover-recovery-integration.js','utf8');
assert(!/\bif\(!confirm\(/.test(meta+hardening+cover),'Native recovery confirm() calls remain');
assert(meta.includes('async function mf439ConfirmBatch()'));
assert(meta.includes('async function mf439Discard()'));
assert(hardening.includes('mf439ConfirmBatch=async function()'));
assert(cover.includes('async function mf425ChooseInstant('));
for(const marker of ['#mf397-fan .mf397-fan-action','.mf444-overlay','.mf444-dialog','@media(max-width:390px)','@media(max-height:560px)','var(--flow)']){
 assert(css.includes(marker),'Missing '+marker);
}
assert(css.includes('#mf397-fan .mf397-fan-action em{display:none}'));
assert(css.includes('max-height:calc(100dvh'));
assert(fs.readFileSync('index.html','utf8').includes('251-v444-recovery-ui-corrections.css'));
const handlers=new Map(),listeners=new Map(),state={appended:null,removed:0,focus:0,closed:0};
const btn=name=>({isConnected:true,focus(){state.focus++},addEventListener(event,fn){handlers.set(name+':'+event,fn)}});
const approve=btn('approve'),close=btn('close'),cancel=btn('cancel');
const originalFocus=btn('opener');
const document={
 getElementById:()=>null,
 activeElement:originalFocus,
 body:{appendChild(el){state.appended=el;}},
 createElement(){return {
  id:'',className:'',innerHTML:'',isConnected:true,
  querySelector(s){return s==='.mf444-dialog'?{}:s==='[data-mf444-approve]'?approve:cancel},
  querySelectorAll(s){return s==='[data-mf444-dismiss]'?[cancel,close]:[cancel,close,approve]},
  remove(){state.removed++}
 };},
 addEventListener(e,fn){listeners.set(e,fn)},
 removeEventListener(e){listeners.delete(e)}
};
const ctx={document,window:{},Promise,Number,String,console,mf424Escape:s=>String(s).replaceAll('<','&lt;'),mf425Icon:(name)=>'<i>'+name+'</i>',mf397SetMenu:()=>{state.closed++},mf427Confirm:()=>{}};
vm.createContext(ctx);vm.runInContext(src,ctx);
(async()=>{
 let p=ctx.mf444Confirm('Start metadata?','Confirm <unsafe>', 'Start Recovery',false,86,'metadata');
 assert(ctx.window.MediaFlowV444.open());
 assert(state.appended.innerHTML.includes('86'));
 assert(state.appended.innerHTML.includes('&lt;unsafe>'));
 assert(state.appended.innerHTML.includes('role="alertdialog"'));
 assert(state.appended.innerHTML.includes('aria-modal="true"'));
 assert(state.appended.innerHTML.includes('METADATA RECOVERY'));
 const denied=await ctx.mf444Confirm('Second dialog','No concurrent dialogs');
 assert.equal(denied,false,'Concurrent overlays must not duplicate');
 handlers.get('approve:click')();
 assert.equal(await p,true);assert(!ctx.window.MediaFlowV444.open());assert.equal(state.removed,1);
 p=ctx.mf427Confirm('Replace artwork?', 'Current cover protected','Use cover');
 assert(state.appended.innerHTML.includes('COVER RECOVERY'));
 listeners.get('keydown')({key:'Escape',preventDefault(){},stopPropagation(){}});
 assert.equal(await p,false,'Escape cancels cover confirmation');
 assert.equal(state.removed,2);
 p=ctx.mf444Confirm('Clear checkpoint?','Previously saved progress stays', 'Clear Checkpoint',true,0,'metadata');
 assert(state.appended.innerHTML.includes('btn-danger'));
 handlers.get('cancel:click')();
 assert.equal(await p,false,'Cancel must not approve destructive actions');
 assert(!ctx.window.MediaFlowV444.open());
 assert(state.focus>=6&&state.closed===3);
 console.log('v444 recovery UI passed: confirmation, escape/cancel, focus restoration, concurrency, escaping, cover and metadata calls, responsive CSS');
})().catch(e=>{console.error(e);process.exitCode=1});
