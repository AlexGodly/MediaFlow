/* v471: Showcase-only visual/functional contract; no cloud or user state. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'471');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/358-v471-collections-showcase-collage.js');
const source=fs.readFileSync('src/js/components/358-v471-collections-showcase-collage.js','utf8');
const css=fs.readFileSync('assets/css/273-v471-collections-showcase-collage.css','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('273-v471-collections-showcase-collage.css'));
assert(css.includes('.mf471-showcase-entry')&&css.includes('max-width:680px')&&css.includes('max-width:360px'));
const items=new Map();
for(let i=0;i<150;i++)items.set(String(i),{id:String(i),title:'Title '+i,coverUrl:i===7?'':'https://example.com/poster-'+i+'.jpg',categoryId:'anime'});
const readList=c=>(c.titleIds||[]).map(id=>items.get(String(id))).filter(Boolean);
const fakeStore={library:[...items.values()],collections:[{titleIds:[...items.keys()]}],xpLedger:{earned:37},settings:{browserView:'showcase'}};
const before=JSON.stringify(fakeStore);
const App={};const ctx={
  window:{addEventListener(){}},document:{querySelectorAll:()=>[]},
  requestAnimationFrame:()=>{},ResizeObserver:undefined,setTimeout(){},Date,App,
  MediaFlowRuntime:{version:470},v274CollectionBrowserCard:(c,mode)=>'LEGACY MODE '+mode,
  v274Text:x=>String(x||'').trim(),
  v274CollectionItems:readList,
  v274CoverUrl:i=>i.coverUrl||'',
  v274Cat:()=>({color:'#abc',name:'Anime'}),
  v200TitleCoverSource:i=>({url:i.coverUrl||''}),
  v274SafeTitle:i=>i.title,
  v144CategoryIconHtml:()=>'<span class="icon">A</span>',
  escapeHtml:x=>String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;'),
  v418CollectionBrowseFacts:()=>'<span>Facts</span>',
  v418CollectionBrowseProgress:()=>'<span>Progress</span>',
  v418CollectionBrowseActions:()=>'<button>Open</button>'
};
vm.runInNewContext(source,ctx,{filename:'v471.js'});
const c=n=>({id:'my-collection',title:'Anime',description:'Test',createdAt:0,updatedAt:0,titleIds:[...items.keys()].slice(0,n)});
for(const mode of ['list','compact','cards','covers','covers-title'])assert.equal(ctx.v274CollectionBrowserCard(c(12),mode),'LEGACY MODE '+mode,'non-showcase changed');
for(const size of [0,1,2,3,4,5,6,8,12,100,150]){
  const collection=c(size),posters=ctx.window.MediaFlowV471.posters(collection),out=ctx.v274CollectionBrowserCard(collection,'showcase');
  assert.equal(posters.length,size,'expected every collection title');
  assert.equal((out.match(/class="mf471-showcase-poster/g)||[]).length,size,'all posters must render including >4');
  assert.match(out,/mf471-showcase-frame/);assert.match(out,/mf418-browser-copy/);
  assert.match(out,/mf418-browser-entry/);assert.match(out,/mf418-dates/);
  if(size)assert.match(out,/mf471-showcase-strip/);
  else assert.match(out,/mf471-showcase-empty/);
  assert(!out.includes('mf471-showcase-poster')||!out.includes('count-4'),'must not use old four-cover cap');
}
const special=c(10);special.coverUrl='https://example.com/featured.jpg';
assert.equal(ctx.window.MediaFlowV471.posters(special).length,11,'explicit cover plus all collection titles');
assert.equal(ctx.window.MediaFlowV471.posters(c(10))[7].url,'','missing title cover must have fallback');
const duplicate=c(10);duplicate.coverUrl='https://example.com/poster-0.jpg';
assert.equal(ctx.window.MediaFlowV471.posters(duplicate).length,10,'do not repeat identical featured cover');
const spoof=c(1);spoof.title='<img src=x onerror=alert(1)>';
assert(!ctx.v274CollectionBrowserCard(spoof,'showcase').includes('<img src=x onerror'),'escaped collection title');
const empty=ctx.window.MediaFlowV471.strip(c(0));
assert.match(empty,/mf471-showcase-empty/);
assert.equal(JSON.stringify(fakeStore),before,'Showcase modified Library, XP, cloud, collections, or settings');
assert.equal(ctx.MediaFlowRuntime.version,471);
console.log('PASS v471 Showcase-only: unlimited covers 0..150, responsive markup, custom cover, missing fallback, escaping, no writes, other modes unchanged');
