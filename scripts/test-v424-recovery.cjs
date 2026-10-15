/* Self-contained v424 contract and synthetic-scale regression checks. */
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const src=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const context={console,Date,Math,URL,AbortController,setTimeout,clearTimeout,setInterval:()=>1,clearInterval:()=>{},
  window:{indexedDB:null,addEventListener(){}},document:{readyState:'loading',addEventListener(){}},
  AUTH_USER:{id:'unit-account'},App:{},MediaFlowRuntime:{version:423},
  DEFAULT_SETTINGS:{},S:{settings:{},library:[],categories:[]},
  cleanTitle:x=>String(x||''),escapeHtml:x=>String(x||''),getCategory:()=>({name:'Anime'}),
  v158ItemKind:i=>i.type||'anime',saveState:async()=>{},showToast:()=>{},
  Image:class{set src(url){this.naturalWidth=400;this.naturalHeight=600;queueMicrotask(()=>this.onload?.())}},
  fetch:async()=>({ok:true,json:async()=>({data:{}}),headers:new Map()})};
context.globalThis=context;vm.createContext(context);vm.runInContext(src,context);
async function run(js){return vm.runInContext(js,context);}
async function main(){
  assert.equal(context.MediaFlowRuntime.version,424);
  assert.ok(Object.keys(context.App).includes('mf424Resume'));
  assert.ok(Object.keys(context.App).includes('mf424Review'));
  assert.ok(Object.keys(context.App).includes('mf424RetryUnresolved'));
  assert.equal(context.App.v158FixMissingCovers,context.App.mf424OpenConfig);
  assert.equal(await run('mf424Provider("anilist").limit'),18);
  assert.equal(await run('mf424Provider("simkl").limit'),0);
  assert.equal(await run('MF424_PROVIDER_META.filter(p=>p.limit).length'),6);
  assert.equal(await run('mf424Provider("mangadex").limit'),0,'MangaDex does not allow browser CORS');
  assert.equal(await run('mf424Provider("googlebooks").limit'),0,'Google Books requires an API identifier');
  assert.equal(await run('mf424Match({title:"Foo",year:2014},{title:"Foo",year:2014},false).confidence'),.96);
  assert.equal(await run('mf424Match({title:"Foo",year:2014},{title:"Foo",year:2017},false).confidence'),.35);
  assert.equal(await run('mf424Match({title:"Foo"},{title:"Bar"},false).confidence'),0);
  assert.equal(await run('mf424Match({title:"Foo"},{title:"Bar"},true).confidence'),.84);
  assert.ok(await run('mf424Cover("javascript:alert(1)")')==='');
  assert.ok((await run('mf424Cover("https://example.org/cover.jpg")')).startsWith('https:'));
  assert.equal(await run('mf424RetryAfter(new Map([["Retry-After","9"]]))'),9000);
  // Stable external ID takes priority regardless of alphabetic search names.
  assert.equal(await run('mf424Order({type:"anime",externalIds:{mal:"123"}})[0]'), 'tenrai');
  assert.ok(await run('mf424HasID({externalIds:{isbn:"9781234567890"}},"openlibrary")'));
  assert.ok(!await run('mf424HasID({externalIds:{isbn:"9781234567890"}},"tvmaze")'));
  // Custom or imported categories previously removed every Cover Recovery source.
  context.getCategory=()=>({name:'Unclassified',type:'other'});
  assert.equal((await run('mf424CoverProviderChoices({type:"other",categoryId:"custom-123"}).filter(p=>p.usable&&p.compatible).length')),6,
    'Unknown categories must show the six actual browser-ready cover providers');
  assert.equal((await run('mf424Order({type:"other",categoryId:"custom-123"}).length')),6);
  await run('S.settings.v424Covers={enabled:[],priorities:[]}');
  assert.equal((await run('mf424Order({type:"other",categoryId:"custom-123"}).length')),0,
    'Background Recovery honors the disabled list');
  assert.equal((await run('mf424CoverProviderChoices({type:"other",categoryId:"custom-123"}).filter(p=>p.usable).length')),6,
    'Find Cover must list available providers even if bulk Recovery has all unchecked');
  await run('delete S.settings.v424Covers');
  context.getCategory=()=>({name:'Anime'});
  const api=context.window.MediaFlowCoverProviders;
  assert.equal(typeof api.register,'function');
  assert.throws(()=>api.register({id:'tenrai',name:'Duplicate',types:['anime'],limit:5},async()=>[]),/unique ID/);
  api.register({id:'newart',name:'New Cover Provider',types:['anime'],limit:10,gap:0},async()=>[{
    url:'https://example.org/cover.jpg',provider:'newart',confidence:.7,title:'Test'
  }]);
  assert.equal(await run('mf424Provider("newart").name'),'New Cover Provider');
  assert.equal((await run('mf424CoverProviderChoices({type:"anime"}).some(p=>p.id==="newart"&&p.usable&&p.compatible)')),true,
    'Future registered adapters automatically appear in Find Cover');
  assert.equal((await run('mf424Discover({type:"anime",title:"Test"},"newart")')).length,1,
    'Future registered cover adapters are actually called by the shared discovery function');
  const rows=100000; context.S.library=Array.from({length:rows},(_,i)=>({id:String(i),title:'Sample '+i,coverUrl:i%3?'':'https://assets.example/'+i+'.jpg',type:'anime'}));
  await run('mf424BuildIndex()');
  assert.equal(await run('MF424.byId.size'),rows);
  assert.equal(await run('mf424Lookup("99999").id'),'99999');
  assert.equal(await run('S.library.filter(mf424Missing).length'),rows-Math.ceil(rows/3));
  // Synthetic job part calculations preserve deterministic, stable cursor-based parts.
  assert.equal(await run('mf424TotalParts({mode:"parts",ids:Array(100001),partSize:100})'),1001);
  assert.equal(await run('mf424Part({mode:"parts",ids:Array(250),partSize:100,cursor:125})'),2);
  assert.equal(await run('mf424Part({mode:"one",ids:Array(250),partSize:100,cursor:125})'),1);
  assert.equal((src.match(/function mf424QueueReview\(/g)||[]).length,1,'Queue review and dialog have independent names');
  assert.equal((src.match(/function mf424Review\(/g)||[]).length,1,'Review dialog can be opened without overriding queue logic');
  assert(src.includes("state.unavailableUntil=Date.now()+90000"),'API outage skips later per-title retries safely');
  await run('MF424.rate.jikan={at:[],next:0,cooldown:0,fails:3,unavailableUntil:Date.now()+90000}');
  await assert.rejects(run('mf424Request("jikan","https://api.jikan.moe/v4/anime/1")'),/temporarily unreachable/);
  await run('delete MF424.rate.jikan');
  // Direct MAL ID path must never use a search endpoint.
  let captured=[];context.fetch=async(url)=>{captured.push(String(url));return {ok:true,json:async()=>({data:{mal_id:123,title:'Test',images:{jpg:{large_image_url:'https://example.org/test.jpg'}}}}),headers:new Map()}};
  const direct=await run('mf424Discover({title:"Test",type:"anime",externalIds:{mal:"123"}},"jikan")');
  assert.equal(direct.length,1);assert.ok(direct[0].idMatch);assert.ok(captured.some(x=>x.includes('/anime/123')));
  // Kitsu serves JSON:API; sending regular Accept: application/json may cause HTTP 406.
  context.fetch=async(url,opts={})=>{
    assert.equal(opts.headers.Accept,'application/vnd.api+json');
    assert.ok(String(url).includes('kitsu.io/api/edge/anime/15')||String(url).includes('kitsu.io/api/edge/manga/15'));
    return {ok:true,json:async()=>({data:{id:'15',attributes:{
      canonicalTitle:'Example Anime',titles:{en:'Example Anime'},startDate:'2022-04-01',
      posterImage:{original:'https://example.org/kitsu.jpg'}
    }}}),headers:new Map()};
  };
  const kitsu=await run('mf424Discover({title:"Example Anime",type:"anime",externalIds:{kitsu:"15"}},"kitsu")');
  assert.equal(kitsu.length,1);
  assert.ok(kitsu[0].idMatch);
  assert.equal(kitsu[0].provider,'kitsu');
  // A book lookup by ISBN must request the edition-specific cover, not a title search.
  const isbn=await run('mf424Discover({title:"Edition",type:"book",externalIds:{isbn:"9780123456789"}},"openlibrary")');
  assert.equal(isbn.length,1);assert.ok(isbn[0].url.includes('default=false'));
  // No identifiers, wrong metadata: never silently auto-assign.
  const wrong=await run('mf424Match({title:"Test",year:2010},{title:"Not Test",year:2010},false)');
  assert.equal(wrong.confidence,0);
  console.log('MediaFlow v424: 100,000-title synthetic workload and provider/identity contracts passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
