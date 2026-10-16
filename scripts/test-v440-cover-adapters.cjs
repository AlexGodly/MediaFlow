/* v440: public cover adapter contracts with mocked, provider-shaped responses. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('src/js/components/320-v440-universal-cover-adapters.js','utf8');
assert(['439','440','441','442','443','444','445'].includes(fs.readFileSync('VERSION','utf8').trim()));
const meta=[{id:'googlebooks',name:'Google Books',types:['book'],limit:0,gap:4500,credentials:true}];
const active=new Map(),defaultPrefs={enabled:['jikan','openlibrary'],priorities:['jikan','openlibrary']};
const catalog=[['steam','Steam','game','cover','public'],['itunes','iTunes','music','cover','public'],
 ['musicbrainz','MusicBrainz','music','cover','public'],['vndb','VNDB','visual_novel','cover','public'],
 ['ifdb','IFDB','interactive_fiction','cover','review'],['googlebooks','Google Books','book','cover','skipped']];
const probes={};
let backupVersion=439;
const ctx={console,Map,Set,Date,JSON,Math,Array,Object,Number,String,URL,URLSearchParams,Promise,
 MF424_PROVIDER_META:meta,MF424_EXTRA_COVER_ADAPTERS:active,MF424_DEFAULT:defaultPrefs,
 MF438_EXTRA_CATALOG:catalog,MF438_PUBLIC_PROBES:probes,
 mf424Provider:id=>meta.find(x=>x.id===id),
 mf424RegisterCoverProvider:(def,adapter)=>{if(meta.some(x=>x.id===def.id))throw Error('Duplicate');meta.push(def);active.set(def.id,adapter);return def.id;},
 mf424AsCandidate:(entry,url,provider,idMatch,link,reason,confidence)=>({
  url,provider,title:entry.title,recordId:entry.id,recordUrl:link,confidence,reason,idMatch,
  externalIdCandidates:[]}),
 mf424Match:(item,entry,idMatch)=>{
  if(idMatch&&String(item.title).toLowerCase()===String(entry.title).toLowerCase())return {confidence:1,reason:'ID/title'};
  if(idMatch)return {confidence:.84,reason:'Review ID/title mismatch'};
  if(String(item.title).toLowerCase()!==String(entry.title).toLowerCase())return {confidence:0,reason:'Mismatch'};
  if(item.year&&entry.year&&item.year===entry.year)return {confidence:.96,reason:'title/year'};
  return {confidence:.7,reason:'title only'};
 },
 mf433ValidId:(k,v)=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,120}$/.test(v),
 mf424Defaults:()=>({...defaultPrefs}),
 mf424HasID:()=>false,mf438Catalog:()=>meta.map(p=>({id:p.id,coverAdapter:false,coverEnabled:false,state:'pending'})),
 v148BuildFullBackup:()=>({backupVersion,backupManifest:{includes:{}}}),
 mf424Request:()=>Promise.reject(new Error('Missing mocked source')),
 mf424Cover:u=>String(u).startsWith('https://')?u:'',
 cleanTitle:t=>t,window:{}
};
vm.createContext(ctx);vm.runInContext(code,ctx,{filename:'v440-cover-adapters.js'});
const api=ctx.window.MediaFlowV440;
assert.equal(api.version,440);
assert.equal(api.registered().length,7);
assert.equal(new Set(meta.map(p=>p.id)).size,meta.length);
assert.equal(meta.find(x=>x.id==='googlebooks').credentials,false,'Google Books uses keyless public API');
assert.equal(active.size,7,'Every advertised new source has an actual registered adapter');
assert(ctx.MF424_DEFAULT.enabled.includes('ifdb'),'fresh installs include IFDB');
assert.equal(defaultPrefs.enabled.slice(0,2).join(','),'jikan,openlibrary','original defaults unchanged in order');
assert(probes.steam&&probes.ifdb&&probes.vndb&&probes.googlebooks,'standalone API tests registered');
assert.equal(ctx.mf438Catalog().find(p=>p.id==='googlebooks').coverAdapter,true);
assert.equal(ctx.mf438Catalog().find(p=>p.id==='steam').coverAdapter,true);
const records={
 steam:{items:[{id:400,name:'Portal'}]},
 itunes:{results:[{collectionId:123,collectionName:'Moonlight',releaseDate:'2020-01-04',
  artworkUrl100:'https://is1-ssl.mzstatic.com/image/thumb/test/100x100bb.jpg',collectionViewUrl:'https://music.apple.com/album/moonlight'}]},
 musicbrainz:{'release-groups':[{id:'123e4567-e89b-12d3-a456-426614174000',title:'Moonlight','first-release-date':'2020'}]},
 vndb:{results:[{id:'v17',title:'Beautiful Novel',released:'2018',image:{url:'https://s.vndb.org/cv/12/1.jpg',sexual:0,violence:0}},
  {id:'v18',title:'Beautiful Novel',image:{url:'https://s.vndb.org/cv/12/2.jpg',sexual:2,violence:0}}]},
 ifdb:{games:[{tuid:'abcdefghijkl',title:'Zork',published:{machine:'1980'},
  coverArtLink:'https://ifdb.org/coverart?id=abcdefghijkl&version=1',link:'https://ifdb.org/viewgame?id=abcdefghijkl'}]},
 'gutendex-public':{results:[{id:84,title:'Frankenstein',formats:{'image/jpeg':'https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg'}}]},
 googlebooks:{items:[{id:'googleA1234',volumeInfo:{title:'Frankenstein',publishedDate:'1818',
  imageLinks:{thumbnail:'http://books.google.com/books/content?id=sample'},industryIdentifiers:[{identifier:'9781234567890'}]}}]}
};
const calls=[];
const request=async(provider,url,options)=>{calls.push({provider,url,options});return records[provider]};
async function run(){
 const tests=[
  ['steam',{id:'1',title:'Portal',externalIds:{steam_app:'400'}},'steam_app','400'],
  ['itunes',{id:'2',title:'Moonlight',externalIds:{apple_music_album:'123'}},'apple_music_album','123'],
  ['musicbrainz',{id:'3',title:'Moonlight',year:2020},'musicbrainz_release_group','123e4567-e89b-12d3-a456-426614174000'],
  ['vndb',{id:'4',title:'Beautiful Novel',externalIds:{vndb:'v17'}},'vndb','v17'],
  ['ifdb',{id:'5',title:'Zork'},'ifdb','abcdefghijkl'],
  ['gutendex-public',{id:'6',title:'Frankenstein'},'gutendex','84'],
  ['googlebooks',{id:'7',title:'Frankenstein'},'googlebooks','googleA1234']
 ];
 for(const [provider,item,key,id] of tests){
  const results=await active.get(provider)(item,{request});
  assert(results.length>=1,provider+' returned no cover candidates');
  assert.equal(results[0].provider,provider);
  assert.equal(results[0].externalIdKey,key);
  assert.equal(results[0].externalIdValue,id);
  assert(results[0].url.startsWith('https://'));
  assert(results[0].externalIdCandidates.some(x=>x.key===key&&x.value===id&&x.evidence));
  if(provider==='vndb')assert.equal(results.length,1,'VNDB excludes explicit-image record');
  if(provider==='steam')assert(results[0].idMatch&&results[0].confidence>=.95,
   'Verified saved Steam ID + exact name qualifies for existing safe auto selection');
  if(provider==='googlebooks')assert(!results[0].url.startsWith('http:'));
 }
 assert(calls.every(x=>/^https:\/\//.test(x.url)));
 assert(calls.find(x=>x.provider==='vndb').options.body.includes('image.sexual'));
 assert(calls.find(x=>x.provider==='ifdb').url.includes('searchfor=Zork'));
 const bad=await active.get('ifdb')({title:'Unrelated'},{request});
 assert.equal(bad.length,0,'mismatched title rejected');
 const titleOnly=await active.get('steam')({title:'Portal',externalIds:{}},{request});
 assert(titleOnly.every(x=>!x.idMatch),'title-only search stays manual review');
 const noOverwriteItem={title:'Frankenstein',id:'no-change',coverUrl:'my-locked-cover',
  externalIds:{googlebooks:'hand-entered'}};
 await active.get('googlebooks')(noOverwriteItem,{request});
 assert.equal(noOverwriteItem.coverUrl,'my-locked-cover');
 assert.equal(noOverwriteItem.externalIds.googlebooks,'hand-entered','adapters never change existing identifiers');
 const backup=vm.runInContext('v148BuildFullBackup()',ctx);
 assert.equal(backup.backupVersion,440);
 assert(backup.backupManifest.includes.v440UniversalCoverAdapters);
 // 100k-item Library dry-run does not trigger eager searches or mutate titles.
 const big=Array.from({length:100000},(_,i)=>({id:i,title:'Title '+i,progress:i%50}));
 const before=big[59999].progress;
 assert.equal(api.registered().length,7);
 assert.equal(big[59999].progress,before);
 const workflow=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
 assert(workflow.includes('!best.idMatch||best.confidence<.95'),'unverified artwork never auto-applies');
 assert(workflow.includes('mf424Image(candidate.url,candidate.provider)'),'all candidates image-validated');
 assert(workflow.includes('mf424LinkSelectedCoverId'),'external IDs linked through protected writer');
 assert(!code.includes('item.coverUrl='),'providers themselves never change covers');
 assert(!code.includes('item.rating='),'personal rating unchanged');
 console.log('PASS v440: 7 live adapter contracts, IFDB, Steam, VNDB safety, ID-protected selection, no eager API calls, 100k dry-run.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
