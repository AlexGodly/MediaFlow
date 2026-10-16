/* v437: validate additive envelope, provenance, manual locks and rating isolation. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync('src/js/components/316-v437-universal-metadata-ratings.js','utf8');
const runtime=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(['437','438','439','440','441','442','443'].includes(fs.readFileSync('VERSION','utf8').trim()));
assert(runtime.includes('components/316-v437-universal-metadata-ratings.js'));
const escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const sandbox={
 console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,URL,
 V377_ID_PROVIDERS:[['mal','MAL','Numeric ID']],
 v84MergeLibraryItem:(a,b)=>({...a,...b}),
 libraryModalHtml:()=>'<div class="v240-library-editor"></div>',
 v181TitleDetailsHtml:()=>'<div class="v181-title-details-body"><div class="v181-detail-actions"></div></div>',
 v148BuildFullBackup:()=>({library:[],backupManifest:{includes:{legacy:true}}}),
 App:{saveLibraryModal:()=>true},window:{},S:{library:[],modal:{type:'library'}},
 document:{createElement:()=>({}),querySelector:()=>null,querySelectorAll:()=>[]},
 showToast:()=>{},persistLibrary:()=>{},render:()=>{},mfCoreSnapshot:()=>({}),
 v53InvalidateLibraryCache:()=>{},escapeHtml
};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'v437-universal-metadata.js'});
const api=sandbox.window.MediaFlowV437;
assert.equal(api.schemaVersion,1);
assert(api.mediaTypes.some(x=>x[0]==='interactive_fiction'));
assert(api.mediaTypes.some(x=>x[0]==='visual_novel'));
assert(api.ratingSources.some(x=>x[0]==='rottentomatoes_critics'));
assert(api.ratingSources.some(x=>x[0]==='anilist'));
assert(sandbox.V377_ID_PROVIDERS.some(x=>x[0]==='musicbrainz_release'));
assert(sandbox.V377_ID_PROVIDERS.some(x=>x[0]==='vndb'));
const original={id:'1',title:'Sample',rating:9.4,communityScore:8.1,
 progress:4,total:12,status:'active',externalIds:{mal:'123'},categoryId:'anime-custom',
 startedAt:1200,completedAt:null};
const title=JSON.parse(JSON.stringify(original));
let outcome=api.applyVerifiedProvider(title,'imdb',{fields:{directors:['Director A'],platforms:['PC']},
 ratings:{imdb:{score:8.4,scale:10,votes:400},rottentomatoes_critics:{score:93,scale:100}}},{verified:false});
assert.equal(outcome.changed,false,'unverified payload rejected');
assert.equal(title.universalMetadata,undefined,'no eager migration');
outcome=api.applyVerifiedProvider(title,'imdb',{fields:{directors:['Director A'],platforms:['PC']},
 ratings:{imdb:{score:8.4,scale:10,votes:400},rottentomatoes_critics:{score:93,scale:100}}},{verified:true});
assert.equal(outcome.fields,2);
assert.equal(outcome.ratings,2);
assert.equal(title.universalMetadata.externalRatings.imdb.score,8.4);
assert.equal(title.universalMetadata.externalRatings.rottentomatoes_critics.scale,100);
assert.equal(title.rating,original.rating,'personal rating preserved');
for(const k of ['progress','total','status','categoryId','startedAt','completedAt','communityScore'])
 assert.deepEqual(title[k],original[k],k+' preserved');
assert.deepEqual(title.externalIds,original.externalIds);
assert.equal(title.universalMetadata.provenance['rating.imdb'].source,'imdb');
const env=title.universalMetadata;
env.locks['rating.imdb']=true;
env.locks['field.directors']=true;
api.applyVerifiedProvider(title,'imdb',{fields:{directors:['B']},ratings:{imdb:{score:9.9,scale:10}}},{verified:true,overwrite:true});
assert.equal(title.universalMetadata.fields.directors[0],'Director A','manually locked metadata is preserved');
assert.equal(title.universalMetadata.externalRatings.imdb.score,8.4,'locked external rating is preserved');
const other={schemaVersion:1,mediaType:'game',
 fields:{gameDevelopers:['Studio'],originalLanguage:'Japanese'},
 externalRatings:{vndb:{score:8.1,scale:10,votes:120}},
 provenance:{'field.gameDevelopers':{source:'manual',updatedAt:9999999999999},
 'rating.vndb':{source:'vndb',updatedAt:9999999999999}},
 locks:{'field.gameDevelopers':true},updatedAt:9999999999999};
const merged=api.merge(title.universalMetadata,other);
assert.equal(merged.fields.gameDevelopers[0],'Studio');
assert.equal(merged.fields.platforms[0],'PC','unchanged field retained from other device');
assert.equal(merged.externalRatings.imdb.score,8.4);
assert.equal(merged.externalRatings.vndb.scale,10);
assert.equal(merged.locks['field.gameDevelopers'],true);
const rec={id:'same',rating:10,progress:8,universalMetadata:title.universalMetadata};
const distant={id:'same',rating:0,progress:1,universalMetadata:other};
const cloud=sandbox.v84MergeLibraryItem(rec,distant);
assert.equal(cloud.universalMetadata.fields.gameDevelopers[0],'Studio');
const backup=sandbox.v148BuildFullBackup();
assert.equal(backup.backupManifest.includes.legacy,true);
assert.equal(backup.backupManifest.v437.schemaVersion,1);
assert.equal(backup.backupVersion,437); // v437 unit runs standalone; v438 layer is tested separately
assert(!source.includes('item.rating='),'provider never writes personal rating');
console.log('v437 metadata tests passed: schema, IDs, rated sources, provenance, locks, merge, backup and isolation.');
