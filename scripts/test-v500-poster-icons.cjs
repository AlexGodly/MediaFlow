/* MediaFlow v500 — no decorative circle-arrow icons on Logging artwork. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const file='src/js/components/388-v500-clean-logging-posters.js';
execFileSync('node',['--check',file]);
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'500');
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(runtime.at(-1),'components/388-v500-clean-logging-posters.js');
assert.match(fs.readFileSync('index.html','utf8'),/303-v500-logging-poster-sizing\.css/);
let nonCoverCalls=0, nonCoverNames=0,originalRenders=0;
const ordinary={matches:s=>false};
const cover={matches:s=>s==='button.mf498-logging-cover',
 dataset:{},removed:0,
 querySelectorAll:s=>s===':scope > .v225-btn-icon'?
 [{remove(){cover.removed++}}]:[],
 classList:{remove(){}}
};
const root={querySelectorAll:()=>[cover]};
const ctx={
 window:{},MediaFlowRuntime:{version:499},
 v225IconEligible(el){nonCoverCalls++;return true;},
 v225ButtonIconName(el){nonCoverNames++;return 'action';},
 mf498CoverHtml:(item,surface)=>'<button type="button" class="mf498-logging-cover" onclick="App.v181OpenTitleDetails(1)"><span class="mf498-cover-icon">category artwork</span></button>',
 renderLogForm(){originalRenders++;return '<div class="log-form"><button class="mf498-logging-cover"></button></div>';},
 document:{createElement:()=>({innerHTML:'',querySelectorAll:()=>[cover]})},
 App:{v181OpenTitleDetails(){}},
 Object,Array,JSON,String,console
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
assert.equal(ctx.MediaFlowRuntime.version,500);
assert.equal(ctx.v225IconEligible(cover),false,'global icon system must skip cover buttons');
assert.equal(ctx.v225ButtonIconName(cover),null,'no generic action badge on poster');
assert.equal(ctx.v225IconEligible(ordinary),true,'other action buttons remain eligible');
assert.equal(ctx.v225ButtonIconName(ordinary),'action','other semantic buttons unchanged');
assert.equal(nonCoverCalls,1);assert.equal(nonCoverNames,1);
for(const surface of ['advanced','quick','picker','recommended']){
 const html=ctx.mf498CoverHtml({id:'1'},surface);
 assert.match(html,/data-v225-iconified="1"/,'skip observer at creation time');
 assert.match(html,/data-mf500-clean-poster="1"/);
 assert.doesNotMatch(html,/<span class="v225-btn-icon"/);
 assert.match(html,/mf498-cover-icon/,'retain category artwork');
 assert.match(html,/v181OpenTitleDetails/,'cover click must still open Title Details');
}
assert.equal(ctx.window.MediaFlowV500.clean(root),1,'stray old icon is removed');
assert.equal(cover.dataset.v225Iconified,'1');
ctx.renderLogForm();
assert.equal(originalRenders,1);
assert.equal(ctx.window.MediaFlowV500.status().rendered,4);
assert(ctx.window.MediaFlowV500.status().cleaned>=1);
const css=fs.readFileSync('assets/css/303-v500-logging-poster-sizing.css','utf8');
assert.match(css,/\.mf419-log-recommended \.mf419-log-rec-cover\.mf498-logging-cover/);
assert.match(css,/\.mf498-logging-cover > \.v225-btn-icon/);
assert.match(css,/grid-template-columns:var\(--mf500-advanced-poster\)/);
assert.match(css,/object-fit:contain!important/);
assert.match(css,/prefers-reduced-motion:reduce/);
console.log('v500 icon and poster contract PASS: no circled action arrow, all four cover surfaces retain details button');
