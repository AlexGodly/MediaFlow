/* v469 geometry and presentation-only contract */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'469');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/356-v469-mobile-background-safe-dock.js');
const src=fs.readFileSync('src/js/components/356-v469-mobile-background-safe-dock.js','utf8');
const css=fs.readFileSync('assets/css/272-v469-mobile-background-safe-dock.css','utf8');
const index=fs.readFileSync('index.html','utf8');
let isMobile=true,viewport=780,dockTop=620,taskTop=440,compact=true,menu=false,writes=0;
const mkClass=initial=>{
 const flags=new Set(initial);
 return {contains:x=>flags.has(x),add:x=>flags.add(x),remove:x=>flags.delete(x),
  toggle:(x,on)=>{if(on===undefined)on=!flags.has(x);on?flags.add(x):flags.delete(x);return on}};
};
const styleProps=new Map();
const widget={classList:mkClass(['mf462-ready','mf441-widget','mf441-position-right','mf441-expanded']),
 style:{setProperty:(k,v)=>styleProps.set(k,v),removeProperty:k=>styleProps.delete(k)},
 getBoundingClientRect:()=>({top:70,left:145,width:205,height:185,bottom:255})};
const dock={hidden:false,getClientRects:()=>[1],
 getBoundingClientRect:()=>({top:dockTop,left:185,width:165,height:48,bottom:dockTop+48})};
const progress={hidden:false,classList:mkClass(['compact']),getClientRects:()=>[1],
 getBoundingClientRect:()=>({top:taskTop,left:60,width:292,height:162,bottom:taskTop+162})};
const fan={classList:mkClass([])};
const nodes={'mf441-process-widget':widget,'mf397-dock':dock,'mf397-progress':progress,'mf397-fan':fan};
const body={classList:mkClass([])};
const ctx={window:{innerHeight:viewport,matchMedia:()=>({matches:isMobile}),
 visualViewport:{height:viewport,addEventListener(){}},addEventListener(){}},
 document:{body,getElementById:id=>nodes[id]||null},MediaFlowRuntime:{version:468},MF397:{open:false},
 mf441Paint:()=>{},mf397Update:()=>{},mf397SetMenu:()=>{},renderShell:()=>{},
 requestAnimationFrame:fn=>{fn();return 1},ResizeObserver:undefined,
 console,S:{settings:{v441RecoveryUI:{visibility:'always',position:'left'}}}};
vm.createContext(ctx);vm.runInContext(src,ctx);
const api=ctx.window.MediaFlowV469;assert.equal(api.version,469);
let result=api.layout();
assert(result.mobile&&result.widget);
assert.equal(result.room,475,'Room limited to 61% of 780 viewport');
assert.equal(styleProps.get('--mf469-room'),'475px');
assert(!widget.classList.contains('mf469-no-room'));
assert(!body.classList.contains('mf469-actions-open'));
compact=false;progress.classList.remove('compact');
result=api.layout();assert.equal(result.room,356,'Expanded task subtracts its height');
assert(result.expandedTask);
assert(Number(styleProps.get('--mf469-room').replace('px',''))<476);
ctx.MF397.open=true;result=api.layout();assert(result.plusOpen);
assert(body.classList.contains('mf469-actions-open'),'Plus sheet temporarily hides process widget');
ctx.MF397.open=false;fan.classList.add('open');
assert(api.layout().plusOpen,'Detect actual open fan even if model disagrees');
fan.classList.remove('open');api.layout();
assert(!body.classList.contains('mf469-actions-open'),'Widget returns after fan closes');
dockTop=162;taskTop=125;result=api.layout();
assert(result.room<54&&widget.classList.contains('mf469-no-room'),'Tiny landscape hides only visual launcher');
assert.equal(ctx.S.settings.v441RecoveryUI.position,'left');
compact=true;progress.classList.add('compact');dockTop=550;result=api.layout();
assert(result.room>54&&!widget.classList.contains('mf469-no-room'),'Restores when task collapses');
isMobile=false;result=api.layout();assert(!result.mobile);
assert(!styleProps.has('--mf469-room'),'Desktop keeps original floating position');
assert(!widget.classList.contains('mf469-no-room'));
assert(!body.classList.contains('mf469-actions-open'));
assert.equal(ctx.MediaFlowRuntime.version,469);
assert(index.includes('mediaflow-v469.bundle.js')&&index.includes('272-v469-mobile-background-safe-dock.css'));
assert(css.includes('#mf441-process-widget.mf462-ready')&&css.includes('.mf441-position-left'));
assert(css.includes('body:has(#mf397-fan.open)')&&css.includes('var(--mf469-room'));
assert(css.includes('overflow-y:auto')&&css.includes('env(safe-area-inset-top'));
assert(css.includes('@media screen and (max-width:720px)'),'Desktop untouched');
assert(!src.includes('persistSettings(')&&!src.includes('saveState(')&&!src.includes('mf424Pause('));
assert.equal(writes,0);
console.log('PASS v469: mobile top placement contract, expanded task height ceiling, + fan hiding, compact recovery, no-room fallback, desktop untouched');
