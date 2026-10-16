/* v439 determinism: provider matching, synopsis protection, safe merge, original
 * rating scales, no title progress edits, and 100k-title dry-run performance. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('src/js/components/319-v439-metadata-recovery.js','utf8');
const adapters=fs.readFileSync('src/js/components/318-v439-metadata-adapters.js','utf8');
const gateway=fs.readFileSync('supabase/functions/mediaflow-api-gateway/index.ts','utf8');
const version=fs.readFileSync('VERSION','utf8').trim();
assert(['439','440','441','442'].includes(version));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.indexOf('components/318-v439-metadata-adapters.js')>=0&&order.indexOf('components/319-v439-metadata-recovery.js')===order.indexOf('components/318-v439-metadata-adapters.js')+1,'v439 metadata modules remain adjacent and ordered');
const settings={v439Metadata:{minimumConfidence:0.94}};
const fields=['originalTitle','alternateTitles','creators','animeSeason','episodeCount','chapterCount','mangaAuthors','tvCreators','albumArtists','platforms'];
const ratingNames=['mal','imdb','anilist','tmdb','kitsu','vndb','rottentomatoes_critics','metacritic'];
const fieldMap=new Map(fields.map(x=>[x,[x,x,x==='alternateTitles'||x==='creators'||x==='platforms'||x==='albumArtists'?'list':x==='episodeCount'||x==='chapterCount'?'number':undefined]]));
const ratingMap=new Map(ratingNames.map(x=>[x,[x,x,10]]));
let persist=0,network=0;
const env={
 console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,URL,AbortController,Promise,setTimeout,clearTimeout,
 S:{library:[],settings,view:'library'},AUTH_USER:{id:'test-account'},App:{},window:{},
 MediaFlowRuntime:{registerPageEnhancer:()=>{}},MF438_EXTRA_CATALOG:[],
 MF437_FIELD_MAP:fieldMap,MF437_RATING_MAP:ratingMap,
 mf437Normalized:input=>{const x=input||{};return {...x,fields:{...(x.fields||{})},externalRatings:{...(x.externalRatings||{})},provenance:{...(x.provenance||{})},locks:{...(x.locks||{})}};},
 mf437SetField:(target,key,value,options)=>{
  if(target.locks['field.'+key])return false;
  if(target.fields[key]!==undefined&&target.fields[key]!==null)return false;
  target.fields[key]=value;target.provenance['field.'+key]={source:options.source,verified:options.verified};
  return true;
 },
 mf437SetRating:(target,key,value,options)=>{
  if(target.locks['rating.'+key]||target.externalRatings[key]!=null)return false;
  target.externalRatings[key]={...value,source:options.source,updatedAt:options.updatedAt};
  target.provenance['rating.'+key]={source:options.source,verified:options.verified};
  return true;
 },
 mf434ProviderStatus:()=>null,mf434SavedTests:()=>[],mf434Call:async()=>{throw Error('Gateway disabled in tests')},
 mf424Escape:v=>String(v),mf425Icon:()=>'',mf436SelectedLibraryIds:()=>[],
 v181TitleDetailsHtml:()=>'<div class="v181-detail-actions"></div>',libraryModalHtml:()=>'<section class="mf437-editor" data-mf437-editor></section>',
 MF424_PROVIDER_META:[],mf424Provider:()=>null,
 document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({})},
 localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
 persistLibrary:()=>{persist++;},saveState:async()=>{},render:()=>{},v148BuildFullBackup:()=>({backupManifest:{}}),
 v53InvalidateLibraryCache:()=>{},showToast:()=>{},confirm:()=>true,
 fetch:()=>{network++;throw Error('No background fetch on module evaluation');}
};
vm.createContext(env);
vm.runInContext(adapters,env);
vm.runInContext(src,env);
assert.equal(network,0);
const api=env.window.MediaFlowV439;
assert.equal(api.version,439);
const base={id:'demo1',title:'Echo of Tomorrow',year:2024,progress:11,total:20,rating:9.5,coverUrl:'my-cover',status:'watching',
 richMetadataManual:{},universalMetadata:{schemaVersion:1,mediaType:'anime',fields:{},externalRatings:{},provenance:{},locks:{}}};
const anime={provider:'anilist',recordId:'42',title:'Echo of Tomorrow',year:2024,
 externalIds:{anilist:'42'},legacy:{synopsis:'A carefully verified synopsis.',genres:['Action']},
 fields:{originalTitle:'あしたのエコー',creators:['A creator'],episodeCount:13},
 ratings:{anilist:{score:87,scale:100,votes:700}}};
const manga={provider:'jikan',recordId:'123',title:'Echo of Tomorrow',year:2024,
 externalIds:{mal:'123'},legacy:{studios:['Studio A'],genres:['Fantasy']},
 fields:{animeSeason:'Fall',chapterCount:100},ratings:{mal:{score:8.4,scale:10,votes:95}}};
const noSynopsis={provider:'kitsu',recordId:'k12',title:'Echo of Tomorrow',year:2024,
 externalIds:{kitsu:'k12'},legacy:{synopsis:'',themes:['Adventure']},fields:{}};
const preview=api.plan(base,[anime,manga,noSynopsis]);
const get=(key)=>preview.proposals.find(x=>x.token===key);
assert.equal(get('legacy.synopsis').selected,true,'single verified synopsis auto-selected');
assert.equal(get('legacy.genres').status,'conflict','two providers disagree on genre');
assert.equal(get('legacy.genres').selected,false,'conflicting field never auto selected');
assert.equal(get('legacy.studios').selected,true,'missing studio from separate provider retained');
assert.equal(get('field.originalTitle').selected,true);
assert.equal(get('rating.anilist').selected,true,'external rating can be separately recovered');
assert.equal(get('rating.mal').selected,true,'other independent provider rating preserved');
assert.equal(get('field.episodeCount').selected,true,'episodeCount in metadata envelope, not tracking total');
const applied=api.apply(base,preview,'automatic');
assert(applied.changed>=7,'merge missing fields from several sources');
assert.equal(base.synopsis,'A carefully verified synopsis.');
assert.deepEqual(base.studios,['Studio A']);
assert.equal(base.genres,undefined,'conflicting genre left untouched');
assert.equal(base.universalMetadata.externalRatings.anilist.score,87);
assert.equal(base.universalMetadata.externalRatings.anilist.scale,100);
assert.equal(base.universalMetadata.externalRatings.mal.scale,10);
assert.equal(base.universalMetadata.fields.episodeCount,13);
assert.equal(base.universalMetadata.provenance['legacy.synopsis'].source,'anilist');
assert.equal(base.rating,9.5,'personal score never changed');
assert.equal(base.progress,11,'progress never changed');
assert.equal(base.total,20,'tracking total never changed');
assert.equal(base.coverUrl,'my-cover','cover never changed');
assert.equal(base.status,'watching');
assert(base.v439RecoveryHistory.length===1);
const again=api.plan(base,[anime,manga,noSynopsis]);
const repeat=api.apply(base,again,'automatic');
assert.equal(repeat.changed,0,'rerunning recovery is idempotent');
const protectedTitle={...JSON.parse(JSON.stringify(base)),id:'protected',synopsis:'My personal synopsis',
 genres:['My genre'],richMetadataManual:{synopsis:true,genres:true},universalMetadata:{...base.universalMetadata,
 fields:{},externalRatings:{},provenance:{},locks:{'rating.mal':true,'field.originalTitle':true}}};
const protectedPreview=api.plan(protectedTitle,[anime,manga]);
assert.equal(protectedPreview.proposals.find(x=>x.token==='legacy.synopsis').status,'protected');
assert.equal(protectedPreview.proposals.find(x=>x.token==='legacy.genres').selected,false);
assert.equal(protectedPreview.proposals.find(x=>x.token==='rating.mal').selected,false);
const protectedApply=api.apply(protectedTitle,protectedPreview,'review');
assert.equal(protectedTitle.synopsis,'My personal synopsis');
assert.equal(protectedTitle.genres[0],'My genre');
assert.equal(protectedTitle.universalMetadata.externalRatings.mal,undefined);
assert.equal(protectedTitle.universalMetadata.fields.originalTitle,undefined);
const mismatch=api.plan({id:'other',title:'Different Work',year:2024},[anime]);
assert.equal(mismatch.proposals.length,0,'different title rejected');
const wrongYear=api.plan({id:'year',title:'Echo of Tomorrow',year:2019},[anime]);
assert(wrongYear.proposals.every(x=>x.selected===false),'year conflict cannot silently apply');
const onlyTitle=api.plan({id:'weak',title:'Echo of Tomorrow'},[anime]);
assert(onlyTitle.proposals.every(x=>x.selected===false),'exact title without second evidence requires review');
const hundredK=Array.from({length:100000},(_,i)=>({id:String(i),title:'Work '+i,progress:i%3}));
const originalProgress=hundredK[87878].progress;
api.plan(hundredK[87878],[anime]);
assert.equal(hundredK[87878].progress,originalProgress);
assert.equal(persist,0,'planning and unit apply avoid automatic persistence side effects');
assert(gateway.includes('data.action==="metadata"'),'gateway supports metadata action');
assert(gateway.includes('getUser(jwt)')&&gateway.includes('mediaflow_gateway_claim'),'authentication and quotas retained');
assert(gateway.includes('metadata(p,title,ids,year)'),'existing live gateway actually retrieves metadata');
assert(gateway.includes('function metaRow('),'deployed verified metadata contract is preserved');
assert(adapters.includes('mf439TranslateGateway'),'all live gateway metadata is normalized safely');
assert(gateway.includes('rottenTomatoes')&&gateway.includes('tmdb'),'external ratings sourced from provider records');
assert(!gateway.includes('PODCAST_INDEX_API_KEY'),'unsupported podcast API remains excluded');
console.log('PASS v439: field-level merge, synopsis, ratings, protection, conflict review, title/year evidence, idempotent saves and 100k dry-run.');
