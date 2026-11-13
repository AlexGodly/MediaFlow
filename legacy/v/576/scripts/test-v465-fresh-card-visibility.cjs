/* v465 — Seasonal checkbox and Manual checker gating for recommended title. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'465');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/349-v465-recommended-fresh-card-title-seasonal-visibility.js');
const source=fs.readFileSync('src/js/components/349-v465-recommended-fresh-card-title-seasonal-visibility.js','utf8');
const origin=fs.readFileSync('src/js/components/347-v463-recommended-title-fresh-left.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const cats=new Map([
 ['seasonal-id',{id:'seasonal-id',name:'Seasonal checked',seasonal:true}],
 ['unchecked',{id:'unchecked',name:'Unmarked TV category',seasonal:false}],
 ['legacy-id',{id:'seasonal',name:'ID says seasonal, checkbox unchecked',seasonal:false}],
 ['unmarked',{id:'unmarked',name:'Unmarked category'}],
 ['custom',{id:'custom',name:'Custom Anime category',seasonal:true}],
]);
let checked=0,saved=0;
const ctx={window:{},MediaFlowRuntime:{version:464},
 S:{settings:{seasonalFreshAuto:true}},
 getCategory:id=>cats.get(String(id))||null,
 v401AutomaticEnabled:()=>ctx.S.settings.seasonalFreshAuto!==false,
 v380Mode:()=>ctx.S.settings.mode||'automatic2',
 mf463FreshForRecommendedTitle:(item,cat)=>{checked++;return {status:'fresh',count:1,available:2,progress:1,source:'Tenrai',category:cat.id}},
 mf463FreshCard:r=>'<section class="mf419-stat mf463-fresh-stat"><span>Recommended title · fresh episodes left</span><strong>'+r.count+'</strong><small>2 aired · 1 logged · Tenrai</small></section>'
};
vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'v465.js'});
const api=ctx.window.MediaFlowV465;
const title=categoryId=>({id:'anime-1',categoryId});
assert.equal(api.version,465);
assert.equal(api.freshForTitle(title('unchecked'),cats.get('seasonal-id')),null,'Task marked seasonal is insufficient if title category is not');
assert.equal(api.freshForTitle(title('legacy-id')),null,'Seasonal-looking category ID without checkbox does not qualify');
assert.equal(api.freshForTitle(title('unmarked')),null,'Missing Seasonal checkbox is not enabled');
assert.equal(api.freshForTitle(title('missing')),null,'Orphaned category never shows tile');
assert.equal(api.freshForTitle(null),null,'Missing recommendation never shows tile');
assert.equal(checked,0,'No ledger calculation for ineligible title');
let row=api.freshForTitle(title('custom'),cats.get('unchecked'));
assert.equal(row.count,1,'Custom title category with Seasonal checkbox qualifies');
assert.equal(row.category,'custom','Pass actual title category, never unrelated task category');
row=api.freshForTitle(title('seasonal-id'));
assert.equal(row.category,'seasonal-id');
assert.equal(checked,2);
ctx.S.settings.seasonalFreshAuto=false;
assert.equal(api.freshForTitle(title('seasonal-id')),null,'Manual fresh-episode checking hides tile');
ctx.S.settings.seasonalFreshAuto=true;
ctx.S.settings.mode='manual';
assert.equal(api.freshForTitle(title('seasonal-id')),null,'Explicit manual provider mode also hides tile');
ctx.S.settings.mode='automatic';
assert.equal(api.freshForTitle(title('seasonal-id')).count,1,'Automatic mode displays again');
ctx.S.settings.mode='anilist';
assert.equal(api.freshForTitle(title('custom')).count,1,'Individual automatic providers remain supported');
assert.equal(checked,4,'No reading ledger while Manual or nonseasonal');
const markup=api.card(row);
assert(markup.includes('Fresh episodes left</span>'),'Short title shown in rendered card');
assert(!markup.includes('Recommended title · fresh episodes left'));
assert(markup.includes('2 aired · 1 logged · Tenrai'));
assert(source.includes('mf465FreshBase.call(this,item,category)'));
assert(!source.includes('saveState(')&&!source.includes('persistSettings('),'Display update cannot change user data');
assert(!source.includes('fetch('),'No new network checks triggered');
assert(origin.includes('v401EpisodeOutcome(item)'),'Preserved verified and unknown title outcome logic');
assert(html.includes('mediaflow-v465.bundle.js'));
assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).version,465);
console.log('PASS v465: concise label, checked Seasonal category only, title-category priority, Manual suppression, no writes/scans');
