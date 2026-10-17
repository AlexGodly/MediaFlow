/* v459: no obsolete Cover Recovery progress pill/flyout, engine untouched. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'459');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/343-v459-retire-cover-only-floating-widget.js');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('265-v459-retire-legacy-cover-widget.css'));
const css=fs.readFileSync('assets/css/265-v459-retire-legacy-cover-widget.css','utf8');
assert(css.includes('html body #mf424-indicator')&&css.includes('display:none!important'),'Stale floating indicator must be visually suppressed before JS runs');
assert(!/#mf441-process-widget\\s*\\{/.test(css),'New Background Processes widget must stay visible');
const code=fs.readFileSync('src/js/components/343-v459-retire-cover-only-floating-widget.js','utf8');
let priorPaintCalls=0,backgroundPaintCalls=0,legacy=[];
const root=()=>({remove(){legacy.shift()}});
legacy.push(root());
const env={console,window:{},MF424:{expanded:true,job:{id:'same-job',cursor:2,status:'running'}},
 App:{},document:{querySelectorAll:s=>s==='#mf424-indicator'?legacy.slice():[],
 getElementById:s=>s==='mf424-indicator'?legacy[0]||null:null},
 mf424Paint(){priorPaintCalls++;legacy.push(root())},mf424Toggle(){priorPaintCalls++;},
 mf441Paint(){backgroundPaintCalls++}};
const job=env.MF424.job;
vm.createContext(env);vm.runInContext(code,env,{filename:'v459-widget.js'});
assert.equal(env.window.MediaFlowV459.version,459);
assert.equal(env.window.MediaFlowV459.legacyVisible(),false,'Initial stale legacy pill removed');
assert.equal(env.MF424.expanded,false);
for(let i=0;i<4;i++){legacy.push(root());env.window.MediaFlowV459.paint();
 assert.equal(env.window.MediaFlowV459.legacyVisible(),false,'No obsolete DOM survives a progress update');}
env.App.mf424Toggle();
assert.equal(priorPaintCalls,0,'Obsolete painter never invoked again');
assert.equal(backgroundPaintCalls,5,'Unified Background Processes stays updated by cover engine paints');
assert.strictEqual(env.MF424.job,job,'Job identity, cursor, and status retained');
assert.deepEqual(job,{id:'same-job',cursor:2,status:'running'},'Live recovery checkpoint unmodified');
assert(typeof env.App.mf424Pause==='undefined','No recovery job controls are replaced or patched by this module');
console.log('PASS v459: obsolete pill and flyout absent, live job untouched, Background Processes paints on every cover update');
