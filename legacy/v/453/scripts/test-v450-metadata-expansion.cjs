/* MediaFlow v450 deterministic metadata, rating provenance and safety contract. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(['450','451','452','453'].includes(fs.readFileSync('VERSION','utf8').trim()));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/330-v450-universal-metadata-expansion.js'));
assert(order.includes('components/331-v451-recovery-stop-priority.js'));
assert(order.includes('components/332-v452-recovery-control-polish.js'));
assert.equal(order.at(-1),'components/334-v453-quick-title-recovery.js');
const src=fs.readFileSync('src/js/components/330-v450-universal-metadata-expansion.js','utf8');
const styles=fs.readFileSync('assets/css/257-v450-universal-metadata-expansion.css','utf8');
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const types=['shared','anime','manga','movie','tv','book','comic','game','visual_novel','music','interactive_fiction'];
const fields=types.map(key=>[key,key,[]]);
const sources=[
 ['imdb','IMDb',10],['rottentomatoes_critics','RT Critics',100],
 ['rottentomatoes_audience','RT Audience',100],['mal','MAL',10],
 ['anilist','AniList',100],['vndb','VNDB',10],['steam','Steam',100]
];
const env={
 console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,URL,
 MF437_FIELDS:fields,MF437_FIELD_MAP:new Map(),
 MF437_RATING_SOURCES:sources,MF437_RATING_MAP:new Map(sources.map(x=>[x[0],x])),
 V377_ID_PROVIDERS:[['mal','MAL','Existing']],
 mf439TranslateGateway:(provider,row)=>row.provider===provider&&row.verified===true?
  {provider,fields:{},ratings:{},recordId:row.ids?.imdb||'confirmed'}:null,
 mf439Proposals:(item,rows)=>({results:rows}),
 mf439Apply:(item,preview)=>{
  item.universalMetadata.externalRatings.imdb={score:8.7,scale:10};
  item.universalMetadata.provenance['rating.imdb']={source:'omdb',verified:true,updatedAt:100};
  return {changed:1};
 },
 mf437SaveCapture:(item,old,capture)=>{
  item.universalMetadata.fields.subtitle=capture.fields.subtitle;return true;
 },
 mf437Normalized:item=>({
  mediaType:item?.mediaType||'unspecified',fields:{...(item?.fields||{})},
  externalRatings:{...(item?.externalRatings||{})},
  provenance:{...(item?.provenance||{})},locks:{...(item?.locks||{})}
 }),
 escapeHtml:esc,
 libraryModalHtml:()=>'<div class="untouched">Editor</div>',
 v181TitleDetailsHtml:()=>'<div class="untouched">Details</div>',
 v148BuildFullBackup:()=>({backupManifest:{includes:{legacy:true}}}),
 window:{}
};
vm.createContext(env);vm.runInContext(src,env,{filename:'v450.js'});
const api=env.window.MediaFlowV450;
assert.equal(api.version,450);assert.equal(api.schemaVersion,2);
for(const t of [...types,'other'])assert(env.MF437_FIELDS.some(g=>g[0]===t));
for(const k of ['isbn13','audiobookDurationMinutes','animeEpisodeCount','tvLastAirDate',
 'comicUniverse','vnScenarioWriters','albumBarcode','ifStoryWords','gameStoreUrl','originalReleaseDate'])
 assert(env.MF437_FIELD_MAP.has(k),k);
assert.equal(env.MF437_RATING_MAP.get('vndb')[2],100);
assert(env.MF437_RATING_MAP.has('rawg')&&env.MF437_RATING_MAP.has('googlebooks'));
assert(env.V377_ID_PROVIDERS.some(x=>x[0]==='openlibrary_work'));
const inputs={
 rottenTomatoes:{value:91,scale:100,votes:120},
 rottenTomatoesAudience:{value:88,scale:100},
 MyAnimeList:{score:8.2,scale:10},
 vndb:{score:84,scale:100,votes:1200},
 imdb:{score:8.5,scale:10,votes:1000},
 rawg:{score:4.1,scale:5},
 anilist:{score:150,scale:100},
 steam:{score:72,scale:100,votes:-3},
 invalid_source:{score:7,scale:10}
};
const normalized=api.normalizeRatings(inputs);
assert.equal(normalized.rottentomatoes_critics.score,91);
assert.equal(normalized.rottentomatoes_audience.score,88);
assert.equal(normalized.mal.scale,10);
assert.equal(normalized.vndb.scale,100);
assert.equal(normalized.rawg.score,4.1);
assert.equal(normalized.anilist,undefined,'over-scale rating rejected');
assert.equal(normalized.steam,undefined,'negative votes rejected');
assert.equal(normalized.invalid_source,undefined,'unknown providers rejected');
const conflict=api.normalizeRatings({rtCritics:{score:90,scale:100},rottenTomatoes:{score:80,scale:100}});
assert.equal(conflict.rottentomatoes_critics,undefined,'conflicting aliases must not be guessed');
const title={id:'t',title:'Example',rating:9.8,progress:5,total:10,coverUrl:'cover',
 universalMetadata:{fields:{},externalRatings:{},provenance:{},locks:{}}};
const oldRating=title.rating,oldProgress=title.progress,oldCover=title.coverUrl;
assert.equal(env.mf439TranslateGateway('omdb',{provider:'omdb',verified:false,title:'X',fields:{},ratings:{}}),null);
const gateway=env.mf439TranslateGateway('omdb',{
 provider:'omdb',verified:true,ids:{imdb:'tt1234'},
 fields:{cast:['Actor'],directors:['Director'],episodeCount:12},
 ratings:{rottenTomatoes:{value:90,scale:100}}
}, {universalMetadata:{mediaType:'anime'}});
assert.equal(gateway.fields.animeEpisodeCount,12);
assert.equal(gateway.ratings.rottentomatoes_critics.score,90);
const plan=env.mf439Proposals(title,[{ratings:inputs}]);
assert.equal(plan.results[0].ratings.imdb.scale,10);
assert.equal(plan.results[0].ratings.anilist,undefined);
env.mf439Apply(title,{proposals:[{selected:true,token:'rating.imdb',choice:0,
 options:[{sources:[{provider:'omdb',recordId:'tt1234'}]}]}]},'review');
assert.equal(title.universalMetadata.schemaVersion,2);
assert.equal(title.universalMetadata.provenance['rating.imdb'].recordId,'tt1234');
assert.equal(title.universalMetadata.externalRatings.imdb.sourceRecordId,'tt1234');
const tile=api.ratingTiles(title);
assert(tile.includes('IMDb')&&tile.includes('8.7')&&tile.includes('Verified provider data'));
assert.equal(title.rating,oldRating);assert.equal(title.progress,oldProgress);assert.equal(title.coverUrl,oldCover);
const backup=env.v148BuildFullBackup();
assert.equal(backup.backupManifest.v450.schemaVersion,2);
assert.equal(backup.backupManifest.includes.legacy,true);
assert(src.includes('const mf450BaseProposals=mf439Proposals'));
assert(src.includes('const mf450BaseTranslateGateway=mf439TranslateGateway'));
assert(styles.includes('var(--flow)')&&styles.includes('@media(max-width:360px)'));
assert(!/\b(?:item|title)\.(?:rating|progress|coverUrl|total)\s*=/.test(src),'No personal fields overwritten');
assert(!/\bfetch\s*\(/.test(src),'No new unapproved network requests');
assert(fs.readFileSync('index.html','utf8').includes('257-v450-universal-metadata-expansion.css'));
console.log('PASS v450: 12 media groups, provider aliases, strict scales/votes, trusted gateway matching, recovered provenance, safe backups and unchanged personal data');
