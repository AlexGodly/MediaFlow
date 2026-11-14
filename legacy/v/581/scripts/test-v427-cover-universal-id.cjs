/* MediaFlow v427: category-independent cover providers and explicit external-ID linking.
 * Deterministic VM contracts only; no account, network, secrets or production changes. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const picker=fs.readFileSync('src/js/components/311-v427-recovery-ux-stability.js','utf8');
const integration=fs.readFileSync('src/js/components/310-v425-cover-recovery-integration.js','utf8');
const ctx={console,Date,Math,URL,AbortController,setTimeout,clearTimeout,setInterval:()=>1,clearInterval:()=>{},
 window:{indexedDB:null,addEventListener(){}},document:{readyState:'loading',addEventListener(){}},
 AUTH_USER:{id:'unit-account'},App:{},MediaFlowRuntime:{version:423},
 DEFAULT_SETTINGS:{},S:{settings:{},library:[],categories:[]},cleanTitle:x=>String(x||''),escapeHtml:x=>String(x||''),
 getCategory:item=>({name:'A custom category'}),v158ItemKind:item=>item.type||'other',
 showToast:()=>{},saveState:async()=>{},
 Image:class{set src(url){this.naturalWidth=400;this.naturalHeight=600;queueMicrotask(()=>this.onload?.());}},
 fetch:async()=>({ok:true,json:async()=>({data:{}}),headers:new Map()})};
vm.createContext(ctx);vm.runInContext(core,ctx);
const run=code=>vm.runInContext(code,ctx);
(async()=>{
 const ids=JSON.parse(JSON.stringify(await run('mf424Order({title:"Unclassified",type:"movie",categoryId:"custom"})')));
 for(const kind of ['anime','manga','movie','book','comic','tv','reading','other']){
  const actual=JSON.parse(JSON.stringify(await run('mf424Order({title:"Some title",type:'+JSON.stringify(kind)+',categoryId:"custom"})')));
  assert.deepEqual(actual,ids,'Every custom media type should query all enabled sources, not filter by guessed genre');
  assert.equal(actual.length,6,'All six browser-ready built-in providers should remain eligible');
 }
 assert(!picker.includes("not for this media type"),'No category-based disabled provider options');
 assert(picker.includes('catalog.filter(p=>p.usable)'),'Find Cover options come from all usable sources');
 assert(picker.includes('mf427SelectedLinkId(index)'),'Manual picker honors link-ID checkbox');
 assert(integration.includes("mf424CoverIdControl(item,c,i,'mf425')"),'Each visual candidate shows whether linking its ID is possible');
 assert(core.includes("mf424CoverIdControl(item,c,i,'mf424')"),'Background manual review offers exactly the same linking choice');
 assert(core.includes("if(found.length<24)found.push(candidate)"),'Manual recovery choices remain bounded for 100k libraries');
 assert(!core.includes("candidate.idMatch&&candidate.confidence>=.95&&mf424Defaults().selection!=='manual')return [candidate]"),'Bulk recovery never abandons later sources on first ID match');
 assert(core.includes("['anime','manga']"),'Anime/manga provider catalogues are both queried independent of MediaFlow category');

 const candidate=await run('mf424AsCandidate({mal_id:79,title:"Sample"}, "https://images.example/test.jpg", "jikan", false, "", "Name result", .7)');
 assert.equal(candidate.externalIdKey,'mal');
 assert.equal(candidate.externalIdValue,'79');
 const anime={id:'1',title:'Sample',coverUrl:null,modifiedAt:12};
 ctx.target=anime;ctx.candidate=candidate;
 await run('MF424.account=mf424Account();MF424.job={dirty:0}');
 assert.equal(await run('mf424Apply(target,candidate,12,{manual:true,linkId:true})'),true);
 assert.equal(anime.externalIds.mal,'79','Choosing artwork can explicitly link source MAL ID');
 assert.equal(anime.v377ManualExternalIds.mal,'79','Explicit link survives subsequent metadata imports');
 assert.equal(anime.coverSource,'auto:jikan:verified');
 assert.equal(await run('MF424.job.dirty'),1,'Cover and ID committed in one job flush');

 const noLink={id:'2',title:'Sample',coverUrl:null,modifiedAt:0};ctx.target=noLink;
 assert.equal(await run('mf424Apply(target,candidate,0,{manual:true,linkId:false})'),true);
 assert(!noLink.externalIds?.mal,'Unchecked external-ID option must never silently link an ID');

 const conflict={id:'3',title:'Sample',coverUrl:null,modifiedAt:0,externalIds:{mal:'99'}};ctx.target=conflict;
 assert.equal(await run('mf424Apply(target,candidate,0,{manual:true,linkId:true})'),true);
 assert.equal(conflict.externalIds.mal,'99','Cover can be changed but existing conflicting ID is never overwritten');

 const book=await run('mf424AsCandidate({key:"/works/OL12345W",title:"Novel"}, "https://images.example/book.jpg","openlibrary",false,"","Title match",.7)');
 assert.equal(book.externalIdKey,'openlibrary');
 assert.equal(book.externalIdValue,'OL12345W','Work ID must be normalized to v377 editor-compatible form');
 const novel={id:'4',title:'Novel',coverUrl:null,modifiedAt:0};ctx.target=novel;ctx.candidate=book;
 assert(await run('mf424Apply(target,candidate,0,{manual:true,linkId:true})'));
 assert.equal(novel.externalIds.openlibrary,'OL12345W');

 // A provider can be omitted from user Enabled settings but still offered
 // for explicit manual search; this does not mutate their saved settings.
 ctx.S.settings.v424Covers={enabled:[],priorities:[]};
 const choices=JSON.parse(JSON.stringify(await run('mf424CoverProviderChoices({type:"manga"})')));
 assert.equal(choices.filter(x=>x.usable).length,6);
 assert.equal(choices.filter(x=>x.enabled).length,0);
 assert.equal(await run('mf424Order({type:"manga"}).length'),0,'Bulk respects disabled sources');
 delete ctx.S.settings.v424Covers;
 console.log('PASS v427 all-category six-provider search, bounded manual options, protected ID linking, user opt-out, Open Library ID normalization');
})().catch(e=>{console.error(e);process.exitCode=1;});
