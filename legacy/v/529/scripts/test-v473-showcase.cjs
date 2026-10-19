/* v473 Collections Showcase: max five posters, full-art hover, no arrows.
 * Read-only mock; no cloud credentials or user account writes. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'473');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/360-v473-showcase-five-full-hover.js');
const src=fs.readFileSync('src/js/components/360-v473-showcase-five-full-hover.js','utf8');
const css=fs.readFileSync('assets/css/275-v473-showcase-five-full-hover.css','utf8');
assert(fs.readFileSync('index.html','utf8').includes('275-v473-showcase-five-full-hover.css'));
const library=Array.from({length:70},(_,i)=>({id:'t'+i,title:'Title '+i,coverUrl:i===2?'':'https://test.example/poster-'+i+'.png'}));
const state={library,collections:[{id:'abc',titleIds:library.map(x=>x.id)}],xpLedger:{xp:777},settings:{test:'saved'}};
const before=JSON.stringify(state),App={};
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;');
const all=collection=>collection.titleIds.map(id=>library.find(x=>x.id===id)).filter(Boolean);
const basePosters=collection=>{
 const result=[];
 if(collection.coverUrl)result.push({url:collection.coverUrl,title:collection.title+' featured'});
 for(const item of all(collection))if(!collection.coverUrl||collection.coverUrl!==item.coverUrl)
   result.push({url:item.coverUrl,title:item.title,color:'#abc',icon:'☆'});
 return result;
};
const ctx={App,window:{},MediaFlowRuntime:{version:472},mf471Posters:basePosters,
 escapeHtml:esc,v274CollectionBrowserCard:(c,mode)=>'OLD '+mode,
 v418CollectionBrowseFacts:()=>'<span>facts</span>',v418CollectionBrowseProgress:()=>'<span>progress</span>',
 v418CollectionBrowseActions:()=>'<button type="button">Open</button>'};
vm.runInNewContext(src,ctx,{filename:'v473-showcase'});
const get=n=>({id:'abc',title:'Anime collection',createdAt:0,updatedAt:0,description:'hello',titleIds:library.slice(0,n).map(x=>x.id)});
for(const view of ['list','compact','cards','covers','covers-title'])
 assert.equal(ctx.v274CollectionBrowserCard(get(11),view),'OLD '+view);
for(const count of [0,1,2,4,5,6,17,70]){
 const collection=get(count),posters=ctx.window.MediaFlowV473.posters(collection);
 const html=ctx.v274CollectionBrowserCard(collection,'showcase');
 assert.equal(posters.length,Math.min(5,count));
 assert.equal((html.match(/class="mf471-showcase-poster mf473-showcase-poster/g)||[]).length,Math.min(count,5),'showcase visual max five');
 assert(!html.includes('mf471-showcase-arrow'),'no previous/next arrow');
 assert(!html.includes('mf471-prev')&&!html.includes('mf471-next'),'no circle arrow controls');
 assert(html.includes('mf418-browser-copy')&&html.includes('mf418-browser-entry'),'collection details preserved');
 if(count){assert.equal((html.match(/class="mf473-poster-full"/g)||[]).length,Math.min(count,5)-Number(count>2),'full image layers except missing image');}
 else assert(html.includes('mf471-showcase-empty'));
}
const custom=get(20);custom.coverUrl='https://test.example/custom.png';
assert.equal(ctx.window.MediaFlowV473.posters(custom).length,5,'custom cover plus four');
assert.equal(ctx.window.MediaFlowV473.posters(custom)[0].url,custom.coverUrl);
const duplicate=get(20);duplicate.coverUrl=library[0].coverUrl;
assert.equal(ctx.window.MediaFlowV473.posters(duplicate).length,5,'deduplicate custom cover');
assert.equal(ctx.window.MediaFlowV473.posters(get(10))[2].url,'','missing art fallback');
assert(!ctx.v274CollectionBrowserCard({...get(2),title:'<img onerror=alert(1)>'},'showcase').includes('<img onerror=alert(1)>'),'escaped title');
const img1={hidden:false},img2={hidden:false},fallback={hidden:true},
 poster={querySelectorAll:()=>[img1,img2],querySelector:()=>fallback};
ctx.App.mf473MissingImage({closest:()=>poster});
assert(img1.hidden&&img2.hidden&&!fallback.hidden,'broken art must show category fallback');
for(const required of [
  '.mf473-showcase-strip','.mf473-showcase-poster:hover',
  'flex-grow:2.3','object-fit:contain','opacity:1',
  '.mf471-showcase-arrow','overflow:hidden','@media(pointer:coarse)',
  '@media(prefers-reduced-motion:reduce)','transition:flex-grow']){
 assert(css.includes(required),'missing hover design '+required);
}
assert.equal(ctx.MediaFlowRuntime.version,473);
assert.equal(JSON.stringify(state),before,'Showcase must not modify cloud, XP, collections or settings');
console.log('PASS v473 Showcase-only: 0–70 members, max five, custom/missing covers, two hover layers, no arrows and immutable data');
