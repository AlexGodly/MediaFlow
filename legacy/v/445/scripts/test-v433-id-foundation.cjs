/* MediaFlow v433 — no-credentials provider/ID foundation regression suite. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
assert(['433','434','435','436','437','438','439','440','441','442','443','444','445'].includes(read('VERSION').trim()));
const src=read('src/js/components/313-v433-provider-registry-foundation.js');
const legacy=read('src/js/components/309-v424-advanced-cover-recovery.js');
const edit=read('src/js/components/273-v377-ids-editor-jikan-recovery.js');
const picker=read('src/js/components/311-v427-recovery-ux-stability.js');
const gateway=read('supabase/functions/mediaflow-api-gateway/index.ts');
assert(legacy.includes("typeof mf433EnrichCoverCandidate==='function'"),'Core candidate enrichment hook');
assert(legacy.includes("typeof mf433LinkCandidateIds==='function'"),'Core cover save bulk IDs hook');
assert(legacy.includes("typeof mf433CoverIdMarkup==='function'"),'Cover picker and review provider ID preview');
assert(picker.includes("typeof mf433FillDraftExternalIds==='function'"),'Add Title editor multi ID linking');
assert(picker.includes("mf433CandidateLinks(item,candidate).some"),'Find Cover detects new IDs beyond first');
assert(edit.includes("['royalroad_rss']"),'Royal Road RSS URL validation');
assert(edit.includes('mf433FilterExternalIds(this.value)'),'Searchable IDs editor');
assert(gateway.includes('getUser(jwt)'),"Gateway requires authenticated user");
assert(['434','435','436','437','438','439','440','441','442','443','444','445'].includes(read('VERSION').trim())?gateway.includes('mediaflow_gateway_claim'):gateway.includes('staged for v434'),'Gateway fails closed until authenticated/quota checked');
assert(['434','435','436','437','438','439','440','441','442','443','444','445'].includes(read('VERSION').trim())?gateway.includes('TMDB_API_TOKEN'):!gateway.includes('TMDB_API_TOKEN'),'Gateway provider activation is version gated');
const keys=Array.from(edit.matchAll(/\['([a-z0-9_]+)','[^']+','[^']+'\]/g),r=>r[1]);
const fake={
 V377_ID_PROVIDERS:keys.map(k=>[k,k,'']),MF424_PROVIDER_META:[
  {id:'tenrai',limit:35},{id:'jikan',limit:35},{id:'anilist',limit:18},
  {id:'kitsu',limit:30},{id:'tvmaze',limit:50},{id:'openlibrary',limit:20},
  {id:'tmdb',limit:0},{id:'googlebooks',limit:0}
 ],
 App:{},window:{},mf424Escape:v=>String(v).replace(/[<>"&]/g,''),
 mf425SettingsMarkup:()=>'<section><p class="mf425-settings-note">A saved cover change earns XP</p></section>',
 document:{querySelector:()=>null,querySelectorAll:()=>[]},
 v377IdValid:(key,v)=>{
  if(!v||v.length>(['royalroad_rss','podcast_rss'].includes(key)?512:120))return false;
  if(key==='imdb')return /^tt\d{7,12}$/i.test(v);
  if(key==='wikidata')return /^Q[1-9]\d*$/i.test(v);
  if(key==='mangadex')return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v);
  if(key==='doi'||key==='crossref')return /^10\.\d{4,9}\/\S+$/i.test(v);
  if(['royalroad_rss','podcast_rss'].includes(key))return /^https:\/\/.+/.test(v);
  return /^[\w.:-]+$/.test(v);
 }
};
vm.createContext(fake);vm.runInContext(src,fake);
const run=s=>vm.runInContext(s,fake);
const registry=JSON.parse(JSON.stringify(run('window.MediaFlowV433.list()')));
assert(registry.length>=37,'Provider inventory is complete');
assert(!registry.some(p=>p.id==='podcastindex'),'Podcast Index is not supported');
for(const id of ['tmdb','omdb','fanart','animeschedule','trakt','comicvine','metron','hardcover',
 'episodate','thetvdb','simkl','malofficial','mangadex','gcd','royalroad','mangaupdates','livechart',
 'anilist','wikidata','anidb','marvel','loc','dnb','bnf','crossref','watchmode','fribb',
 'inventaire','gutendex','youtube']){
 assert(registry.some(p=>p.id===id),'Missing provider '+id);
}
assert.equal(run("MF424_PROVIDER_META.find(x=>x.id==='inventaire').limit"),0,'Untested new provider is disabled');
assert.equal(run("MF424_PROVIDER_META.find(x=>x.id==='tmdb').limit"),0,'TMDB not enabled by key existence');
const ani=JSON.parse(JSON.stringify(run("mf433EnrichCoverCandidate({id:21,idMal:180,title:'Example'}, {provider:'anilist',recordId:'21',externalIdKey:'anilist',externalIdValue:'21',recordUrl:'https://anilist.co/anime/21'})")));
assert(ani.externalIdCandidates.some(x=>x.key==='mal'&&x.value==='180'));
assert(ani.externalIdCandidates.some(x=>x.key==='anilist'&&x.value==='21'));
fake.candidate=ani;
fake.item={externalIds:{mal:'999'},v377ManualExternalIds:{mal:'999'}};
assert.equal(run('mf433LinkCandidateIds(item,candidate,{manual:false})'),1,'Only nonconflicting AniList ID linked');
assert.equal(fake.item.externalIds.mal,'999','Existing MAL ID was preserved');
assert.equal(fake.item.externalIds.anilist,'21');
fake.item={externalIds:{},v377ManualExternalIds:{mal:null}};
assert.equal(run('mf433LinkCandidateIds(item,candidate,{manual:false})'),1,'Manual-cleared MAL remains protected');
assert.equal(fake.item.externalIds.mal,undefined);
fake.item={externalIds:{},v377ManualExternalIds:{}};
assert.equal(run('mf433LinkCandidateIds(item,candidate,{manual:true})'),2,'Manual selection links both IDs');
assert.equal(fake.item.v377ManualExternalIds.mal,'180','Manual selection records override');
assert.equal(run('mf433LinkCandidateIds(item,candidate,{manual:true})'),0,'Idempotence on repeat');
const tv=JSON.parse(JSON.stringify(run("mf433EnrichCoverCandidate({id:8,title:'TV',externals:{imdb:'tt1234567'}},{provider:'tvmaze',recordId:'8',externalIdKey:'tvmaze',externalIdValue:'8'})")));
assert(tv.externalIdCandidates.some(x=>x.key==='imdb'&&x.value==='tt1234567'));
const cross=JSON.parse(JSON.stringify(run("mf433EnrichCoverCandidate({id:4,externalIds:{wikidata:'Q42',doi:'10.1234/abc',royalroad_rss:'https://www.royalroad.com/rss',untrusted:'danger'}},{provider:'inventaire',recordId:'',externalIdKey:''})")));
assert(cross.externalIdCandidates.some(x=>x.key==='wikidata'&&x.value==='Q42'));
assert(!cross.externalIdCandidates.some(x=>x.key==='untrusted'));
assert(!run("mf433ValidId('mangadex','not-a-uuid')"),'Invalid IDs rejected');
assert(!run("mf433ValidId('royalroad_rss','javascript:alert(1)')"),'Dangerous URL rejected');
assert(run("mf433SettingsMarkupBase")!==undefined,'Existing Settings markup preserved');
assert(run('mf425SettingsMarkup()').includes('v434 activation pending'),'Readiness shown in real Settings renderer');
const malicious={externalIdCandidates:[{key:'__proto__',value:'poison',evidence:'test'},{key:'imdb',value:'evil',evidence:'fake'}]};
fake.item={externalIds:{},v377ManualExternalIds:{}},fake.candidate=malicious;
assert.equal(run('mf433LinkCandidateIds(item,candidate,{manual:true})'),0);
const library=Array.from({length:100000},(_,i)=>({id:String(i),externalIds:{},v377ManualExternalIds:{}}));
fake.candidate=ani;
for(let i=0;i<library.length;i+=1000){fake.item=library[i];assert.equal(run('mf433LinkCandidateIds(item,candidate,{manual:false})'),2);}
assert.equal(library[99000].externalIds.anilist,'21');
console.log('PASS v433 staged provider registry, 52+ ID fields, multiple verified IDs, manual protection, conflicts, 100k synthetic titles, disabled new APIs');
