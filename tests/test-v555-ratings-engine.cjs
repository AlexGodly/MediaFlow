/* v555 external ratings engine, end to end in the real app with simulated
 * rating sites. Covers: saved IDs first, Wikidata ID links, romanized →
 * English name discovery, recheck with new IDs, season → whole-show IMDb,
 * ambiguous names skipped, saved IDs never replaced. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');

const OMDB={ // imdb id → record
  tt2560140:{title:'Attack on Titan',year:2013,type:'series',rating:9.1,votes:600000},
  tt9335498:{title:'Demon Slayer: Kimetsu no Yaiba',year:2019,type:'series',rating:8.6,votes:200000},
  tt0089175:{title:'Fright Night',year:1985,type:'movie',rating:7.0,votes:90000},
  tt1438176:{title:'Fright Night',year:2011,type:'movie',rating:6.4,votes:120000},
  tt0000777:{title:'Saved Show',year:2020,type:'series',rating:7.7,votes:1000}
};
const TMDB_TV={1429:{title:'Attack on Titan',year:2013,rating:8.7,votes:7000},85937:{title:'Demon Slayer: Kimetsu no Yaiba',year:2019,rating:8.5,votes:6000}};
const JIKAN={
  16498:{title:'Shingeki no Kyojin',title_english:'Attack on Titan',year:2013,score:8.55},
  35760:{title:'Shingeki no Kyojin Season 3',title_english:'Attack on Titan Season 3',year:2018,score:8.6},
  38000:{title:'Kimetsu no Yaiba',title_english:'Demon Slayer: Kimetsu no Yaiba',year:2019,score:8.4}
};
const WIKI={ // property=value → entity
  'P4086=16498':{id:'Q1',claims:{P4086:['16498'],P345:['tt2560140'],P4983:['1429']}},
  'P4086=35760':{id:'Q2',claims:{P4086:['35760'],P179:[{id:'Q1'}]}},
  'P4086=38000':{id:'Q3',claims:{P4086:['38000']}}
};
const ENTITIES={Q1:WIKI['P4086=16498'],Q2:WIKI['P4086=35760'],Q3:WIKI['P4086=38000']};
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const calls=[];

function gateway(body){
  if(body.action==='status')return {version:555,ready:true,providers:['tmdb','omdb'].map(id=>({id,configured:true,mode:'cover',testable:true,metadataSupported:true}))};
  calls.push(body.provider+':'+(body.externalIds?.imdb||body.externalIds?.tmdb_tv||body.title));
  const rows=[];
  if(body.provider==='omdb'){
    const hit=body.externalIds?.imdb?[[body.externalIds.imdb,OMDB[body.externalIds.imdb]]]:
      Object.entries(OMDB).filter(([,r])=>norm(r.title)===norm(body.title));
    for(const [id,r] of hit)if(r)rows.push({provider:'omdb',title:r.title,verified:true,ids:{imdb:id},
      fields:{year:r.year,mediaFormat:r.type},ratings:{imdb:{value:r.rating,scale:10,votes:r.votes}}});
  }
  if(body.provider==='tmdb'){
    const id=body.externalIds?.tmdb_tv;
    const hit=id?[[id,TMDB_TV[id]]]:Object.entries(TMDB_TV).filter(([,r])=>norm(r.title)===norm(body.title));
    for(const [k,r] of hit)if(r)rows.push({provider:'tmdb',title:r.title,verified:true,ids:{tmdb_tv:String(k)},
      fields:{year:r.year},ratings:{tmdb:{value:r.rating,scale:10,votes:r.votes}}});
  }
  return {provider:body.provider,results:rows};
}
function jikanRow(id,r){return {mal_id:Number(id),title:r.title,title_english:r.title_english,title_japanese:'',title_synonyms:[],
  score:r.score,scored_by:1000,type:'TV',aired:{from:r.year+'-04-01'}};}
async function network(url){
  const u=new URL(url);
  const json=b=>({status:200,contentType:'application/json',body:JSON.stringify(b)});
  if(u.hostname==='api.jikan.moe'){
    calls.push('jikan:'+u.pathname+u.search);
    const m=u.pathname.match(/\/v4\/anime\/(\d+)$/);
    if(m)return JIKAN[m[1]]?json({data:jikanRow(m[1],JIKAN[m[1]])}):{status:404,body:'{}'};
    if(/\/v4\/anime$/.test(u.pathname)){const q=norm(u.searchParams.get('q'));
      return json({data:Object.entries(JIKAN).filter(([,r])=>norm(r.title)===q||norm(r.title_english)===q).map(([id,r])=>jikanRow(id,r))});}
    return json({data:[]});
  }
  if(u.hostname==='graphql.anilist.co')return json({data:{Page:{media:[]}}});
  if(u.hostname==='www.wikidata.org'){
    calls.push('wikidata:'+(u.searchParams.get('srsearch')||u.searchParams.get('ids')));
    if(u.searchParams.get('list')==='search'){const key=String(u.searchParams.get('srsearch')).replace('haswbstatement:','');
      return json({query:{search:WIKI[key]?[{title:WIKI[key].id}]:[]}});}
    const id=u.searchParams.get('ids');const e=ENTITIES[id];
    const claims={};for(const [p,vals] of Object.entries(e?.claims||{}))claims[p]=vals.map(v=>({rank:'normal',mainsnak:{datavalue:{value:v}}}));
    return json({entities:e?{[id]:{claims}}:{}});
  }
  return null;
}
(async()=>{
  const state=generate({titles:20});
  const base={categoryId:'seasonal',status:'watching',priority:'high',progress:1,total:12,universalMetadata:{externalRatings:{}}};
  state.library.push(
    {...base,id:'aot',title:'Shingeki no Kyojin',year:2013,externalIds:{mal:'16498'}},
    {...base,id:'aot3',title:'Shingeki no Kyojin Season 3',year:2018,externalIds:{mal:'35760'}},
    {...base,id:'kny',title:'Kimetsu no Yaiba',year:2019,externalIds:{}},
    {...base,id:'fright',categoryId:'movies',title:'Fright Night',externalIds:{}},
    {...base,id:'saved',title:'Saved Show',year:2020,externalIds:{imdb:'tt0000777'}});
  const app=await openApp({state,gateway,network});
  const p=app.page;
  try{
    const run=id=>p.evaluate(async id=>{
      const item=__MF.S().library.find(x=>x.id===id);
      const r=await window.MediaFlowV555Ratings.forTitle(item,{providers:['jikan','omdb','tmdb']});
      const w=window.MediaFlowV555Ratings.apply(item,r);
      const ratings=Object.fromEntries(Object.entries(item.universalMetadata.externalRatings||{}).map(([k,v])=>[k,v.score]));
      return {w,ratings,ids:item.externalIds,via:r.accepted.map(a=>a.provider+':'+a.mf555Via),
        prov:item.universalMetadata.provenance||{}};
    },id);
    // 1. Romanized title + saved MAL ID → IMDb and TMDB found through Wikidata.
    const aot=await run('aot');
    assert.equal(aot.ratings.mal,8.55,'MAL rating by saved ID');
    assert.equal(aot.ratings.imdb,9.1,'IMDb rating found for a romanized title');
    assert.equal(aot.ratings.tmdb,8.7,'TMDB rating found');
    assert.equal(aot.ids.imdb,'tt2560140','IMDb ID saved');
    assert.equal(aot.ids.tmdb_tv,'1429','TMDB ID saved');
    assert(aot.via.includes('jikan:saved-id')&&aot.via.includes('omdb:new-id'),'saved ID first, then recheck with new ID: '+aot.via);
    // 2. Season: whole show's IMDb rating, without saving the show's ID on the season.
    const s3=await run('aot3');
    assert.equal(s3.ratings.imdb,9.1,'season shares the whole show IMDb rating');
    assert.equal(s3.ratings.mal,8.6,'season keeps its own MAL rating');
    assert(!s3.ids.imdb,'the show IMDb ID is not saved as the season ID');
    assert.equal(s3.prov['rating.imdb']?.scope,'whole-show','rating marked as whole-show');
    // 3. No IDs, romanized name: English name learned from MAL finds IMDb by name.
    const kny=await run('kny');
    assert.equal(kny.ratings.mal,8.4);
    assert.equal(kny.ratings.imdb,8.6,'IMDb found through the English name');
    assert.equal(kny.ids.mal,'38000');assert.equal(kny.ids.imdb,'tt9335498');
    // 4. Two different films with the same name and no year: skipped, not guessed.
    const fright=await run('fright');
    assert(!fright.ratings.imdb&&!fright.ids.imdb,'ambiguous name must not be guessed');
    // 5. Saved ID is used and never replaced.
    const saved=await run('saved');
    assert.equal(saved.ratings.imdb,7.7);assert.equal(saved.ids.imdb,'tt0000777');
    // 6. Refreshing again changes nothing and finds the same values.
    const again=await run('aot');
    assert.equal(again.w.changed,0,'second refresh is a no-op');
    // 7. Season name helper.
    const names=await p.evaluate(()=>['Attack on Titan Season 3','Attack on Titan: The Final Season Part 2','Mob Psycho 100 II','Re:Zero 2nd Season','Dune'].map(window.MediaFlowV555Ratings.baseShowName));
    assert.deepEqual(names,['Attack on Titan','Attack on Titan',null,'Re:Zero',null]);
    // 8. Refresh all missing ratings: the real per-title path for a fresh title, with progress.
    const bulk=await p.evaluate(async()=>{
      const S=__MF.S();
      S.library.push({id:'kny2',title:'Kimetsu no Yaiba',categoryId:'seasonal',year:2019,status:'watching',priority:'high',externalIds:{},universalMetadata:{externalRatings:{}}});
      const ready=__MF.get('mf467RatingProviders')(S.library.at(-1));
      const run=App.mf555RefreshAllMissing();
      await new Promise(r=>setTimeout(r,300));
      const html=document.createElement('div');html.innerHTML=__MF.get('mf547SettingsHtml')();
      const during={running:__MF.get('MF555BULK').running,hasStop:/Stop/.test(html.textContent)};
      await run;
      const it=S.library.find(x=>x.id==='kny2');
      return {ready,during,state:{...__MF.get('MF555BULK'),controller:null},imdb:it.universalMetadata.externalRatings?.imdb?.score,ids:it.externalIds};
    });
    console.log('bulk:',JSON.stringify({ready:bulk.ready,done:bulk.state.done,total:bulk.state.total,ratings:bulk.state.ratings,ids:bulk.state.ids,note:bulk.state.note}));
    assert(bulk.during.running&&bulk.during.hasStop,'progress with a Stop button while running');
    assert(bulk.state.total>=1&&bulk.state.done===bulk.state.total,'every candidate processed');
    assert.equal(bulk.imdb,8.6,'bulk refresh saves ratings through the normal path');
    assert.deepEqual(app.errors.filter(e=>!/Failed to load resource/.test(e)),[],'no page errors');
    console.log('PASS v555 ratings engine: saved IDs first, Wikidata links, English-name discovery, recheck with new IDs, whole-show season ratings, no guessing, no replaced IDs.');
  }finally{await app.close();}
})().catch(e=>{console.error(e);console.error('calls:',calls.slice(-30));process.exit(1);});
