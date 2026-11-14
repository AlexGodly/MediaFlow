/* MediaFlow v474 — dynamic intrinsic aspect ratios in Showcase only.
 * Includes all v473 five-poster and no-cloud-mutation regression contracts. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'474');
const previous=fs.readFileSync('scripts/test-v473-showcase.cjs','utf8')
 .replace("trim(),'473'","trim(),'474'")
 .replace("order.at(-1),'components/360-v473-showcase-five-full-hover.js'","order.at(-2),'components/360-v473-showcase-five-full-hover.js'");
vm.runInNewContext(previous,{require,console,process},{filename:'v473-compat.cjs'});
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/361-v474-showcase-intrinsic-aspect.js');
const source=fs.readFileSync('src/js/components/361-v474-showcase-intrinsic-aspect.js','utf8');
const css=fs.readFileSync('assets/css/276-v474-showcase-native-aspect.css','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('276-v474-showcase-native-aspect.css'));
const original='<'+'span class="mf471-showcase-poster mf473-showcase-poster" role="listitem">'+
  '<img class="mf473-poster-crop" src="test.png"></span>';
const App={},state={library:[1,2,3],xpLedger:{xp:10},settings:{v473Saved:1},collections:[{titleIds:[1,2,3]}]};
const before=JSON.stringify(state);
const getHtml=(item,mode)=>mode!=='showcase'?'legacy-'+mode:
 '<article class="mf473-showcase-entry"><div class="mf473-showcase-frame"><div class="mf473-showcase-strip">'+
 ctx.mf473PosterHtml({},0)+'</div></div></article>';
const ctx={App,window:{addEventListener(){}},requestAnimationFrame:()=>{},
 document:{querySelectorAll:()=>[]},MediaFlowRuntime:{version:473},
 mf473PosterHtml:()=>original,v274CollectionBrowserCard:getHtml,
 getComputedStyle:()=>({paddingLeft:'8px',paddingRight:'8px'}),
 ResizeObserver:undefined,console};
vm.runInNewContext(source,ctx,{filename:'v474.js',timeout:5000});
const output=ctx.v274CollectionBrowserCard({},'showcase');
for(const k of ['mf474-showcase-entry','mf474-showcase-frame','mf474-showcase-strip',
  'mf474-poster','App.mf474ImageReady(this)','App.mf474Measure(this)'])
 assert(output.includes(k),'Missing v474 hook '+k);
for(const mode of ['list','compact','cards','covers','covers-title'])
 assert.equal(ctx.v274CollectionBrowserCard({},mode),'legacy-'+mode,'Other view altered: '+mode);
const sizes=[];
const strip={clientWidth:420,querySelectorAll:()=>Array(5).fill({})};
const image={naturalWidth:200,naturalHeight:300},properties={};
const poster={isConnected:true,closest:()=>strip,querySelector:()=>image,
 getBoundingClientRect:()=>({height:150}),dataset:{},
 style:{setProperty:(key,value)=>{properties[key]=value;}}};
function check(w,h,expected){
 image.naturalWidth=w;image.naturalHeight=h;
 const result=ctx.mf474Measure(poster);
 sizes.push({w,h,result});
 assert(Math.abs(result-expected)<.2,`cover ${w}x${h} should use ${expected}px, got ${result}`);
 assert.equal(properties['--mf474-native-width'],result+'px');
 assert.equal(poster.dataset.mf474Source,'natural');
}
check(200,300,100);    // portrait, not a hardcoded 2.3x
check(300,300,150);    // square
check(600,300,300);    // landscape 2:1
check(300,600,75);     // very tall
strip.clientWidth=300;
check(600,300,264);    // limited only by available width and five 5px peeks
image.naturalWidth=0;image.naturalHeight=0;
assert.equal(ctx.mf474Measure(poster),100,'unloaded art falls back to 2:3 aspect');
assert.equal(poster.dataset.mf474Source,'placeholder');
assert.equal(ctx.App.mf474ImageReady({closest:()=>poster}),undefined);
assert.equal(ctx.MediaFlowRuntime.version,474);
assert.equal(ctx.window.MediaFlowV474.maxCovers,5);
for(const required of ['.mf474-poster:hover','flex:0 0 var(--mf474-native-width',
   'object-fit:contain','background:transparent','@media(pointer:coarse)',
   '@media(prefers-reduced-motion:reduce)']){
 assert(css.includes(required),'Missing native-aspect CSS: '+required);
}
assert.equal(JSON.stringify(state),before,'Rendered Showcase mutated account data');
console.log('PASS v474 native aspect: portrait, square, landscape, tall, narrow clamps, no bars, five-cover parity and immutable account');
