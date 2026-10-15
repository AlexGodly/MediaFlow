/* v428 Phase 4: deterministic Universal Fresh Releases evidence regression. */
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync('src/js/components/314-v428-fresh-releases.js','utf8');
new vm.Script(src);
const now=Date.parse('2026-10-15T10:00:00Z');
class FixedDate extends Date{static now(){return now;}}
const category=[
 {id:'anime',name:'Anime'},{id:'series',name:'TV Series'},
 {id:'manga',name:'Manga'},{id:'manhwa',name:'Manhwa'},
 {id:'comics',name:'Comics'},{id:'books',name:'Books'},
 {id:'webnovels',name:'Web Novels'},{id:'podcast',name:'Podcasts'},
 {id:'webseries',name:'Web Series'},{id:'movies',name:'Movies'}
];
const urls=[];
const items=[
 {guid:'ep-2',date:'2026-06-01T08:00:00Z',title:'Episode 2',ep:'2',enclosure:true},
 {guid:'ep-3',date:'2026-09-01T08:00:00Z',title:'Episode 3',ep:'3',enclosure:true},
 {guid:'ep-3',date:'2026-09-01T08:00:00Z',title:'Episode 3 duplicate',ep:'3',enclosure:true},
 {guid:'ep-future',date:'2026-12-01T08:00:00Z',title:'Episode 4',ep:'4',enclosure:true}
];
class FakeDOMParser{
 parseFromString(){
  const elements=items.map(row=>{
   const children=[
    {localName:'guid',textContent:row.guid,prefix:''},
    {localName:'pubDate',textContent:row.date,prefix:''},
    {localName:'title',textContent:row.title,prefix:''},
    {localName:'episode',textContent:row.ep,prefix:'itunes'}
   ];
   if(row.enclosure)children.push({localName:'enclosure',textContent:'',prefix:''});
   return {children};
  });
  return {querySelector(){return null},getElementsByTagName(name){return name==='item'?elements:[]}};
 }
}

async function fetchMock(url){
 urls.push(String(url));
 let data=null;
 if(url.includes('tvmaze.com/lookup/shows?thetvdb=12345'))data={id:42,name:'Verified Show',url:'https://www.tvmaze.com/shows/42'};
 elseif(url.includes('tvmaze.com/search/shows'))data=[{show:{id:42,name:'Verified Show',url:'https://www.tvmaze.com/shows/42'}}];
 else if(url.includes('tvmaze.com/shows/42/episodes'))data=[
   {id:1,season:1,number:1,airstamp:'2026-01-01T01:00:00Z'},
   {id:2,season:1,number:2,airstamp:'2026-03-01T01:00:00Z'},
   {id:3,season:1,number:null,airstamp:'2026-03-02T01:00:00Z',type:'significant_special'},
   {id:4,season:1,number:3,airstamp:'2026-12-01T01:00:00Z'}
 ];
 else if(url.includes('episodate.com/api/search'))data={tv_shows:[{id:5,name:'Verified Show'}]};
 else if(url.includes('episodate.com/api/show-details'))data={tvShow:{id:5,name:'Verified Show',episodes:[{season:1,episode:1,air_date:'2026-01-01'},{season:1,episode:2,air_date:'2026-03-01'}]}};
 else if(url.includes('mangadex.org/manga/'))data={data:[
   {id:'1',attributes:{chapter:'12',publishAt:'2026-08-01T12:00:00Z'}},
   {id:'2',attributes:{chapter:'12',publishAt:'2026-09-01T12:00:00Z'}},
   {id:'3',attributes:{chapter:'14',publishAt:'2026-12-01T12:00:00Z'}},
   {id:'4',attributes:{chapter:'9',publishAt:'2025-04-01T12:00:00Z'}}
 ]};
 else if(url==='https://example.org/podcast.xml')return {ok:true,text:async()=>'<rss>fixture</rss>',headers:{get(){return null;}}};
 else return {ok:false,status:404,headers:{get(){return null;}}};
 return {ok:true,json:async()=>data,headers:{get(){return null;}}};
}
const window={MediaFlowV428Hub:{registerFresh(){},paint(){},runLegacyFresh:async()=>({})},addEventListener(){}};
const document={body:null,readyState:'loading',addEventListener(){}};
const S={library:[],categories:category,settings:{},view:'library'};
const App={};const sandbox=vm.createContext({S,App,window,document,Date:FixedDate,Math,JSON,console,URL,AbortController,fetch:fetchMock,
 AUTH_USER:{id:'test'},DOMParser:FakeDOMParser,MediaFlowRuntime:{registerPageEnhancer(){}},setTimeout:fn=>0,clearTimeout(){},showToast(){},localStorage:{getItem(){return null},setItem(){}}});
vm.runInContext(src,sandbox);
const engine=window.MediaFlowV428Fresh;
assert(engine&&engine.evidence,'Public pure evidence API exposed');
assert.equal(engine.media({categoryId:'podcast'}),'podcasts');
assert.equal(engine.media({categoryId:'webnovels'}),'webnovels');
assert.equal(engine.media({categoryId:'comics'}),'comics');
assert.equal(engine.media({categoryId:'books'}),'books');
assert.equal(engine.media({categoryId:'movies'}),'movies');
assert.equal(engine.media({categoryId:'anime'}),'anime');
assert.equal(engine.validFeedUrl({feedUrl:'http://localhost/feed.xml'}),'');
assert.equal(engine.validFeedUrl({feedUrl:'https://example.org/feed.xml'}),'https://example.org/feed.xml');
const join=(item,rows)=>engine.combine(item,rows,'automatic2');
const a={categoryId:'series',progress:5};
assert.equal(join(a,[{status:'none',available:5,source:'A'},{status:'fresh',available:8,source:'B'}]).available,8,'Highest verified count wins without summing');
assert.equal(join(a,[{status:'none',available:5,source:'A'},{status:'unknown',reason:'timeout'}]).status,'unknown','Unknown provider blocks negative claim');
assert.equal(join(a,[{status:'fresh',available:6,source:'A'},{status:'unknown',reason:'timeout'}]).status,'fresh','A single verified positive is sufficient');
assert.equal(join(a,[{status:'unknown',reason:'No configured provider'}]).status,'unknown');
assert.equal(join(a,[{status:'unknown',available:0}]).status,'unknown','Unknown is never equivalent to verified zero');
assert.equal(join(a,[{status:'unknown',available:0},{status:'none',available:5,partial:true}]).status,'unknown');
(async()=>{
 const series={title:'Verified Show',categoryId:'series',progress:1,externalIds:{}};
 const tv=await engine.evidence(series,'automatic2','tvmaze');
 assert.equal(tv.status,'fresh');
 assert.equal(tv.available,2,'Specials and future airings not counted');
 assert.equal(tv.evidence.length,2,'Both public TV providers queried in smart mode');
 assert.equal(tv.evidence[0].extras.specialsReleased,1);
 assert(urls.some(x=>x.includes('episodes?specials=1')),'TVmaze specials fetched separately');
 const seriesCaughtUp=await engine.evidence({...series,progress:2},'automatic2','tvmaze');
 assert.equal(seriesCaughtUp.status,'none');
 const autoConservative=await engine.evidence({...series,progress:2},'automatic','tvmaze');
 assert.equal(autoConservative.evidence.length,2,'Automatic mode checks both public TV providers before claiming no new releases');
 const viaTvdb=await engine.evidence({...series,externalIds:{thetvdb:'12345'}},'individual','tvmaze');
 assert.equal(viaTvdb.status,'fresh','A verified TheTVDB cross-reference must work without extra credentials');
 assert(urls.some(x=>x.includes('lookup/shows?thetvdb=12345')));
 assert(src.includes('if(result===null)j.legacyError'),'Seasonal engine may return undefined on success; only explicit unavailable return marks Unknown');

 const manga={title:'A Manga',categoryId:'manga',progress:11,externalIds:{mangadex:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'}};
 const fresh=await engine.evidence(manga,'automatic2','mangadex');
 assert.equal(fresh.status,'fresh');
 assert.equal(fresh.available,12,'Future chapter 14 excluded');
 assert.equal(fresh.evidence[0].observedCount,2,'Duplicate translated chapter deduplicated');
 assert.equal((await engine.evidence({...manga,progress:12},'automatic2','mangadex')).status,'unknown','Partial manga feed cannot prove caught up');
 const unsupported=await engine.evidence({title:'Book',categoryId:'books',progress:0},'automatic2','tvmaze');
 assert.equal(unsupported.status,'unknown','Do not pretend Books have a configured release source');
 const rssAbsent=await engine.evidence({title:'Podcast',categoryId:'podcast',progress:0},'automatic2','tvmaze');
 assert.equal(rssAbsent.status,'unknown');
 const podcast={title:'My Podcast',categoryId:'podcast',progress:2,externalIds:{feed:'https://example.org/podcast.xml'}};
 const feedResult=await engine.evidence(podcast,'automatic2','tvmaze');
 assert.equal(feedResult.status,'fresh','An already-linked numbered HTTPS feed can verify a later released podcast episode');
 assert.equal(feedResult.available,3,'Future RSS entries and duplicate GUIDs excluded');
 assert.equal(feedResult.evidence[0].observedCount,2);
 assert.equal((await engine.evidence({...podcast,progress:3},'automatic2','tvmaze')).status,'unknown','Partial RSS cannot prove a user is caught up');
 assert.equal(urls.some(x=>x.includes('mangadex.org/manga')),true);
 console.log('v428 Fresh Releases passed: media types, TV specials, provider union, manga dedup/future, unknown vs none, no-key dormant sources');
})().catch(e=>{console.error(e);process.exitCode=1;});
