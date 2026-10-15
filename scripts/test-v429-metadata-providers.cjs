/* v429: metadata multi-provider mapping and title-identity guard.
   Tests public API contracts offline; no credentials or production requests. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/js/components/313-v428-metadata-fixer.js','utf8');
new vm.Script(source);
const queries=[];
const media={
 id:321,idMal:78,type:'ANIME',
 title:{romaji:'Example Anime',english:'Example Anime',native:'サンプル',userPreferred:'Example Anime'},
 description:'<b>Official</b> story',
 format:'TV',source:'LIGHT_NOVEL',seasonYear:2025,duration:24,
 episodes:12,chapters:null,volumes:null,averageScore:85,
 startDate:{year:2025,month:4,day:3},genres:['Fantasy','Adventure'],
 tags:[{name:'Magic',rank:90},{name:'Spoiler',rank:30}],studios:{nodes:[{name:'Example Studio'}]}
};
const mock={
 window:{MediaFlowV428Hub:{registerMetadata(){},paint(){}},addEventListener(){}},
 document:{readyState:'loading',body:null,addEventListener(){},getElementById(){return null},querySelectorAll(){return []}},
 S:{library:[],categories:[{id:'anime',name:'Anime'},{id:'manga',name:'Manga'},{id:'books',name:'Books'},{id:'comic',name:'Comics'}],settings:{}},
 App:{},AUTH_USER:{id:'test-user'},
 MediaFlowRuntime:{registerPageEnhancer(){}},
 showToast(){},console,Math,Date,JSON,URL,AbortController,Event:function(){},
 localStorage:{getItem(){return null},setItem(){}},
 setTimeout,clearTimeout,
 fetch:async(url,options)=>{
  if(url.startsWith('https://api.mangadex.org/manga/'))return {ok:true,json:async()=>({data:{attributes:{
    title:{en:'Example Manga'},description:{en:'An official synopsis'},
    year:2024,originalLanguage:'ja',publicationDemographic:'shounen',
    tags:[{attributes:{group:'genre',name:{en:'Fantasy'}}},{attributes:{group:'theme',name:{en:'Adventure'}}}]
   }}}),headers:{get(){return null;}}};
  if(url.startsWith('https://openlibrary.org/works/'))return {ok:true,json:async()=>({
    key:'/works/OL123W',title:'Example Book',description:{value:'Book description'},
    first_publish_date:'2001',subjects:['Literature','Fiction']
   }),headers:{get(){return null;}}};
  if(url.startsWith('https://api.tenrai.org/v1/'))return {ok:true,status:200,json:async()=>({data:{
   mal_id:78,title:'Example Anime',title_english:'Example Anime',synopsis:'Tenrai verified summary',
   type:'TV',episodes:12,score:8.2,year:2025,genres:[{name:'Fantasy'}],themes:[],studios:[],producers:[]
  }}),headers:{get(){return null;}}};
  if(url.startsWith('https://kitsu.io/api/edge/'))return {ok:true,status:200,json:async()=>({data:{
   id:url.endsWith('/15')?'15':'16',attributes:{canonicalTitle:'Example Anime',titles:{en:'Example Anime'},synopsis:'Kitsu description',subtype:'TV',startDate:'2025-04-03',episodeCount:12,episodeLength:24,averageRating:'84.5',ageRating:'PG'}
  }}),headers:{get(){return null;}}};
  if(url.startsWith('https://api.jikan.moe/v4/'))return {ok:false,status:403,headers:{get(){return null;}}};
  if(url.includes('thetvdb=999'))return {ok:false,status:404,headers:{get(){return null;}}};
  if(url.startsWith('https://api.tvmaze.com/lookup/shows?thetvdb='))return {ok:true,json:async()=>({
   id:920,name:'Example TV',summary:'<b>Official</b> TV description',runtime:44,
   genres:['Drama'],premiered:'2023-02-10',type:'Scripted',rating:{average:8.4},url:'https://www.tvmaze.com/shows/920/example-tv'
  }),headers:{get(){return null;}}};
  assert.equal(url,'https://graphql.anilist.co');
  assert.equal(options.method,'POST');
  const body=JSON.parse(options.body);queries.push(body);
  assert.equal(body.variables.id,321);
  assert.equal(body.variables.type,'ANIME');
  assert(body.query.includes('duration')&&body.query.includes('averageScore')&&body.query.includes('genres'));
  return {ok:true,status:200,json:async()=>({data:{Media:media}})};
 }
};
vm.runInNewContext(source,mock,{timeout:4000});
const engine=mock.window.MediaFlowV428Metadata;
assert(engine.schema.anilist&&!engine.schema.anilist.requiresSetup);
assert(engine.schema.tenrai&&!engine.schema.tenrai.requiresSetup);
assert(engine.schema.kitsu&&!engine.schema.kitsu.requiresSetup);
assert(engine.schema.openlibrary.capabilities.includes('comics'));
const mapped=engine.mapAniList(media,'anime');
assert.equal(mapped.source,'AniList');
assert.equal(mapped.synopsis,'Official story');
assert.equal(mapped.communityScore,8.5);
assert.equal(mapped.durationMinutes,24);
assert.equal(mapped.releaseDate,'2025-04-03');
assert.deepEqual([...mapped.studios],['Example Studio']);
assert.deepEqual([...mapped.themes],['Magic']);
assert.equal(mapped.total,12);
assert(!mapped.producers,'Missing official producers should not be fabricated');
(async()=>{
 const found=await engine.lookupEvidence({title:'Example Anime',categoryId:'anime',externalIds:{anilist:'321'}},['anilist']);
 assert.equal(found.source,'AniList');
 assert.equal(found.recordId,321);
 assert.equal(queries.length,1,'Exactly one verified ID query');
 const fallback=await engine.lookupEvidence({title:'Example Anime',categoryId:'anime',externalIds:{anilist:'321'}},['jikan','anilist']);
 assert.equal(fallback.source,'AniList','Offline Jikan cannot block independent AniList evidence');
 assert.equal(queries.length,2,'AniList is reached after the first public provider fails');
 const tenrai=await engine.lookupEvidence({title:'Example Anime',categoryId:'anime',externalIds:{mal:'78'}},['tenrai']);
 assert.equal(tenrai.source,'Tenrai');
 assert.equal(tenrai.recordId,78,'MAL ID verified from Tenrai');
 const wrongTenrai=await engine.lookupEvidence({title:'Wrong Title',categoryId:'anime',externalIds:{mal:'78'}},['tenrai']);
 assert(!wrongTenrai.source,'MAL ID title mismatch must never cause a different title to be saved');
 const kitsu=await engine.lookupEvidence({title:'Example Anime',categoryId:'anime',externalIds:{kitsu:'15'}},['kitsu']);
 assert.equal(kitsu.source,'Kitsu');
 assert.equal(kitsu.total,12);
 assert.equal(kitsu.communityScore,8.5);
 assert.equal(kitsu.releaseDate,'2025-04-03');
 const invalidKitsu=await engine.lookupEvidence({title:'Example Anime',categoryId:'anime',externalIds:{kitsu:'bad-id'}},['kitsu']);
 assert(!invalidKitsu.source,'Invalid Kitsu IDs must be rejected');

 const tv=await engine.lookupEvidence({title:'Example TV',categoryId:'tv',externalIds:{thetvdb:'12345'}},['tvmaze']);
 assert.equal(tv.source,'TVmaze','TVDB external identity resolves through free TVmaze lookup');
 assert.equal(tv.recordId,920);
 assert.equal(tv.communityScore,8.4);
 assert.equal(tv.total,0,'TVmaze must not overwrite personal episodic totals');
 const unknownTV=await engine.lookupEvidence({title:'Example TV',categoryId:'tv',externalIds:{thetvdb:'999'}},['tvmaze']);
 assert(!unknownTV.source&&/identifier was not found/.test(unknownTV.reason),'Unverifiable external ID cannot fall back to same-name result');
 const changes=engine.previewFields({title:'Example Anime',synopsis:'',total:12,progress:6,richMetadataManual:{genres:true}},found);
 assert(changes.some(x=>x.field==='synopsis'));
 assert(!changes.some(x=>x.field==='genres'),'Manually edited genre remains protected');
 assert(!changes.some(x=>x.field==='total'),'Personal progress prevents total overwrite');
 assert.equal(engine.detectMediaKind({categoryId:'comic'}),'comics');
 const manga=await engine.lookupEvidence({title:'Example Manga',categoryId:'manga',externalIds:{mangadex:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'}},['mangadex']);
 assert.equal(manga.source,'MangaDex');
 assert.equal(manga.year,2024);
 assert.deepEqual([...manga.genres],['Fantasy']);
 assert.equal(manga.total,undefined,'MangaDex partial chapters must never overwrite Library totals');
 const books=await engine.lookupEvidence({title:'Example Book',categoryId:'books',externalIds:{openlibrary:'OL123W'}},['openlibrary']);
 assert.equal(books.source,'Open Library');
 assert.equal(books.year,2001);
 assert.equal(books.recordId,'/works/OL123W');
 console.log('v429 metadata public adapter passed: Tenrai, Jikan fallback, AniList, Kitsu, MangaDex, Open Library, TVmaze and protected rich fields');
})().catch(e=>{console.error(e);process.exitCode=1;});
