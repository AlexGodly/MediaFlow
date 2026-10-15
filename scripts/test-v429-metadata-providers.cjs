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
 S:{library:[],categories:[{id:'anime',name:'Anime'},{id:'comic',name:'Comics'}],settings:{}},
 App:{},AUTH_USER:{id:'test-user'},
 MediaFlowRuntime:{registerPageEnhancer(){}},
 showToast(){},console,Math,Date,JSON,URL,AbortController,Event:function(){},
 localStorage:{getItem(){return null},setItem(){}},
 setTimeout,clearTimeout,
 fetch:async(url,options)=>{
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
 const changes=engine.previewFields({title:'Example Anime',synopsis:'',total:12,progress:6,richMetadataManual:{genres:true}},found);
 assert(changes.some(x=>x.field==='synopsis'));
 assert(!changes.some(x=>x.field==='genres'),'Manually edited genre remains protected');
 assert(!changes.some(x=>x.field==='total'),'Personal progress prevents total overwrite');
 assert.equal(engine.detectMediaKind({categoryId:'comic'}),'comics');
 console.log('v429 metadata public adapter passed: exact AniList ID, rich fields, manual-field/total protection and comic type');
})().catch(e=>{console.error(e);process.exitCode=1;});
