/* MediaFlow v483: recovery scope category selection must preserve nested scroll. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'495');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/370-v483-recovery-category-scroll-continuity.js'));
const js=fs.readFileSync('src/js/components/370-v483-recovery-category-scroll-continuity.js','utf8');
const css=fs.readFileSync('assets/css/283-v483-recovery-category-scroll.css','utf8');
assert(js.includes('.mf446-category-grid'),'Explicitly restores the inner scrollable category list');
assert(js.includes('categoryOpen'),'Restores expanded category section');
assert(js.includes('statusMap'),'Restores individual expanded status sections');
assert(js.includes('App.mf455SearchWorkspace'),'Restores search term and filter');
assert(js.includes('focus({preventScroll:true})'),'Restores focus without jumping');
assert(js.includes('mf483ActiveMode()!==s.mode'),'Does not reset intentional tab changes');
assert(js.includes("['mf446ToggleCategory','mf446AllCategories','mf446ToggleStatus']"));
assert(css.includes('overflow-anchor:none'));
assert(!/S\.settings\s*=|S\.library\s*=|S\.sessions\s*=|MF446\.draft\s*=|saveState\(|persistSettings\(/.test(js),
 'No new cloud/library/recovery data mutations');
let called={category:0,all:0,status:0};
const App={
 mf446ToggleCategory:()=>{called.category++;return 'category-ok';},
 mf446AllCategories:()=>{called.all++;return 'all-ok';},
 mf446ToggleStatus:()=>{called.status++;return 'status-ok';}
};
const window={scrollY:0,scrollX:0,scrollTo:()=>{}};
const document={getElementById:()=>null};
const ctx={App,window,document,MediaFlowRuntime:{version:482}};
vm.runInNewContext(js,ctx,{filename:'v483-recovery-category-continuity.js'});
assert.equal(App.mf446ToggleCategory('x',true),'category-ok');
assert.equal(App.mf446AllCategories(true),'all-ok');
assert.equal(App.mf446ToggleStatus('x','planned',true),'status-ok');
assert.deepEqual(called,{category:1,all:1,status:1},
 'Existing scope selection actions must execute exactly once with no extra calls');
assert.equal(window.MediaFlowV483.version,483);
assert.equal(window.MediaFlowV483.capture(),null,'Closed workspace must be safe');
console.log('PASS v483: original scope actions preserved; nested scroll, focus, query, status restoration registered; no recovery/job/cloud data changes');
