#!/usr/bin/env python3
"""v403: prove one high-confidence AniList no-fresh can certify a scan.
Negative cases MUST stay Unknown. Controlled browser fixtures; no live APIs.
"""
from pathlib import Path
import subprocess,time,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=re.sub(r'<link[^>]+>','',(ROOT/'test-v350-responsive.html').read_text()).replace('</head>','<base href="http://127.0.0.1:8797/"></head>')
js=(ROOT/'assets/js/mediaflow-v404.bundle.js').read_text().rstrip()
assert js.endswith('})();'),js[-20:]
js=js[:-5]+r'''
window.__v403test={S,App,adapters:V380_ADAPTERS,run:v377RunJikan,check:v402CheckAllProviders,
 proof:v403AiringProof,outcome:v402EpisodeOutcomeFor,filter:v401Eligible,source:v380Mode,
 configure:()=>{
 saveState=async()=>{};render=()=>'';v166FetchJikan=async path=>({data:{mal_id:Number((path.match(/\/anime\/(\d+)/)||[])[1])}});
 v377Identify=async()=>({malId:'',reason:'no title search match'});
 v380Request=async(url,opts)=>{
   if(!url.includes('graphql.anilist.co'))throw Error('Unexpected provider request '+url);
   window.__detailsCalls=(window.__detailsCalls||0)+1;
   if(window.__proofError)throw Error('Schedule API temporarily unavailable');
   return {data:{Media:{id:101,idMal:1001,status:window.__releaseStatus||'RELEASING',episodes:window.__episodeTotal??12,
     nextAiringEpisode:window.__next===false?null:{episode:window.__upcomingEp??3,airingAt:Math.floor(Date.now()/1000)+86400},
     airingSchedule:{nodes:[{episode:1,airingAt:Math.floor(Date.now()/1000)-14*86400},{episode:2,airingAt:Math.floor(Date.now()/1000)-7*86400}]}}}};
 };
}};})();'''
server=subprocess.Popen(['python','-m','http.server','8797','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.35)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280,1920]:
   page=browser.new_page(viewport={'width':width,'height':850});errors=[]
   page.on('pageerror',lambda err:errors.append(str(err)))
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('''()=>{
     const t=__v403test,s=t.S;s.settings=s.settings||{};
     s.settings.v380EpisodeProvider='automatic2';s.settings.seasonalFreshAuto=true;
     s.settings.v401RecommendFreshOnly=true;s.settings.seasonalFreshCount=69;
     s.settings.v377JikanLedger={};s.settings.v377JikanResults={unmatched:[],failures:[],unavailable:[],lastCheckedAt:0,completeBaseline:false};
     s.library=[{id:'sole',title:'Kashita Maryoku Example',categoryId:'seasonal',status:'active',progress:2,total:12,externalIds:{mal:'1001'}}];
     s.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,enabled:true,target:2,unit:'episodes'}];
     s.view='library';t.configure();window.__providerCalls=[];window.__detailsCalls=0;
     for(const provider of ['tenrai','anizip','anilist','tvmaze','kitsu'])t.adapters[provider]=async()=>{
       __providerCalls.push(provider);
       if(provider==='anilist')return 2;
       const err=new Error('No usable episode data');err.kind='episode_data_unavailable';throw err;
     };
   }''')
   good=page.evaluate('''async()=>{
     const t=__v403test,s=t.S;const result=await t.run({force:true});const hit=s.settings.v377JikanLedger.sole;
     const scan=s.settings.v402FreshScan;return {result,hit,scan,retained:s.settings.seasonalFreshCount,
       calls:__providerCalls,detailsCalls:__detailsCalls,eligible:t.filter(s.library[0],s.categories[0])};}''')
   assert good['result']['complete'] is True,(width,good)
   assert good['scan']['malMatched']==1 and good['scan']['verifiedNoFresh']==1 and good['scan']['unknown']==0,(width,good)
   assert good['retained']==0 and good['hit']['v402Status']=='none',(width,good)
   assert good['hit']['v402VerifiedSources']==1,(width,good)
   assert good['hit']['v401Providers'][2]['v403Proof']['kind']=='dated_next_airing',(width,good)
   assert good['calls']==['tenrai','anizip','anilist','tvmaze','kitsu'] and good['detailsCalls']==1,(width,good)
   assert good['eligible'] is False,(width,good)
   # A bare number with dated past episodes but no confirmed NEXT episode is NOT enough.
   weak=page.evaluate('''async()=>{const t=__v403test,s=t.S;
     window.__next=false;delete s.settings.v377JikanLedger.sole;
     const res=await t.run({force:true});return {res,scan:s.settings.v402FreshScan,
       eligible:t.filter(s.library[0],s.categories[0]),
       reason:s.settings.v377JikanResults.unavailable[0]?.v402Providers?.find(x=>x.source==='anilist')?.v403Proof?.reason};}''')
   assert not weak['res']['complete'] and weak['scan']['unknown']==1 and weak['eligible'],(width,weak)
   assert 'no conclusive next-airing' in weak['reason'],(width,weak)
   # Completed status with final explicit total can independently confirm zero.
   finished=page.evaluate('''async()=>{const t=__v403test,s=t.S;
     window.__releaseStatus='FINISHED';window.__episodeTotal=2;
     const res=await t.run({force:true});return {res,proof:s.settings.v377JikanLedger.sole?.v401Providers[2]?.v403Proof};}''')
   assert finished['res']['complete'] and finished['proof']['kind']=='finished_series',(width,finished)
   # Reject a disagreeing upcoming episode number, regardless of dates.
   mismatch=page.evaluate('''async()=>{const t=__v403test,s=t.S;
     window.__releaseStatus='RELEASING';window.__next=true;window.__upcomingEp=5;
     delete s.settings.v377JikanLedger.sole;
     const res=await t.run({force:true});return {res,unknown:s.settings.v402FreshScan.unknown};}''')
   assert not mismatch['res']['complete'] and mismatch['unknown']==1,(width,mismatch)
   # Network failure to fetch confidence proof leaves unknown, never fake no-fresh.
   err=page.evaluate('''async()=>{const t=__v403test,s=t.S;
     window.__upcomingEp=3;window.__proofError=true;
     const res=await t.run({force:true});return {res,unknown:s.settings.v402FreshScan.unknown};}''')
   assert not err['res']['complete'] and err['unknown']==1,(width,err)
   # Strong proof only belongs to matching ID.
   wrong=page.evaluate('''()=>__v403test.proof({idMal:9001,nextAiringEpisode:{episode:3,airingAt:Math.floor(Date.now()/1000)+86400}},2,{malId:'1001'})''')
   assert not wrong['verified'],(width,wrong)
   assert not errors,(width,errors)
   print('PASS v403',width,'single-source schedule, honest missing data, finished, mismatch, failed proof, identity and full aggregation',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
