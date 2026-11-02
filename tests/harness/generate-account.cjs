/* MediaFlow test harness: deterministic synthetic account generator.
 * generate({titles,sessions,activity,collections,orderSize}) returns a cloud
 * state object in the same shape MediaFlow saves (uncompressed). */
'use strict';
const CATS=['seasonal','missedanime','finishedanime','animemovies','manga','movies','tv','backlog','animemoviesbacklog','mangabacklog'];
const STATUSES=['watching','planned','completed','paused','dropped'];
const WORDS=['Shingeki','Kyojin','Night','Fright','Blue','Lock','Spy','Family','Frieren','Journey','Dandadan','Solo','Leveling','Chainsaw','Man','Breaking','Bad','Office','Dune','Arrival','Monster','Pluto','Vinland','Saga','Mushishi'];
function rng(seed){let s=seed>>>0;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function generate(opts={}){
  const n=opts.titles??1000, nSessions=opts.sessions??Math.round(n*0.6), nActivity=opts.activity??Math.round(n*0.4);
  const nCollections=opts.collections??Math.max(1,Math.round(n/500)), orderSize=opts.orderSize??Math.min(n,5000);
  const r=rng(opts.seed||555);
  const pick=a=>a[Math.floor(r()*a.length)];
  const day=86400000, now=Date.UTC(2026,10,1);
  const library=[];
  for(let i=0;i<n;i++){
    const cat=CATS[i%CATS.length], unit=['manga','mangabacklog'].includes(cat)?100:24;
    const title=pick(WORDS)+' '+pick(WORDS)+' '+(i+1);
    const status=pick(STATUSES);
    library.push({
      id:'t-'+i,title,categoryId:cat,status,priority:pick(['high','medium','low']),
      progress:status==='completed'?unit:Math.floor(r()*unit),total:unit,rating:r()<0.25?null:1+Math.floor(r()*10),
      year:1990+Math.floor(r()*36),addedAt:now-Math.floor(r()*3000)*day,
      externalIds:i%3===0?{mal:String(1000+i)}:i%3===1?{imdb:'tt'+String(1000000+i)}:{},
      universalMetadata:{externalRatings:i%2?{mal:{score:+(5+r()*4).toFixed(2),scale:10,source:'jikan'}}:{}},
      titleRomaji:i%4===0?title+' no Kyojin':'',titleEnglish:i%4===0?'English '+title:''
    });
  }
  const sessions=[];
  for(let i=0;i<nSessions;i++){
    const it=library[Math.floor(r()*n)],ts=now-Math.floor(r()*3000)*day-Math.floor(r()*day);
    const qty=1+Math.floor(r()*4);
    sessions.push({id:'s-'+i,timestamp:ts,date:new Date(ts).toISOString().slice(0,10),categoryId:it.categoryId,
      assignedCategoryId:it.categoryId,followedAssignedCategory:true,targetAmount:qty,actualAmount:qty,
      minutes:qty*24,note:'',status:'complete',unit:'episodes',xp:qty*10,healthStatus:'healthy',source:'recommendation',
      titles:[{title:it.title,libraryId:it.id,qty,repeat:false,loggedAt:ts}]});
  }
  sessions.sort((a,b)=>a.timestamp-b.timestamp);
  const activityLog=[];
  for(let i=0;i<nActivity;i++){
    const it=library[Math.floor(r()*n)],ts=now-Math.floor(r()*3000)*day;
    activityLog.push({id:'a-'+i,timestamp:ts,type:pick(['added','status','rating','progress']),libraryId:it.id,title:it.title,categoryId:it.categoryId});
  }
  activityLog.sort((a,b)=>b.timestamp-a.timestamp);
  const collections=[];
  for(let c=0;c<nCollections;c++){
    const ids=[];for(let k=0;k<Math.min(n,40+Math.floor(r()*200));k++)ids.push(library[Math.floor(r()*n)].id);
    const uniq=[...new Set(ids)];
    collections.push({id:'c-'+c,title:'Collection '+(c+1),description:'',coverUrl:'',titleIds:uniq,order:uniq,autoBackground:true,createdAt:now-c*day,updatedAt:now-c*day,lastViewedAt:0});
  }
  const orderPlan={titleIds:library.slice(0,orderSize).map(x=>x.id).reverse(),viewMode:'all',categoryMode:'default',categoryOrder:CATS.slice(),hiddenCategories:[],modifiedAt:now};
  return {library,sessions,activityLog,collections,orderPlan,settings:{},categoryOrder:CATS.slice(),
    currentTask:null,sessionActive:false,migrations:{},completionTimeline:[],xpLedger:{libraryAdditions:{}},savedAt:now};
}
module.exports={generate};
if(require.main===module){
  const n=Number(process.argv[2]||1000);
  process.stdout.write(JSON.stringify(generate({titles:n})));
}
