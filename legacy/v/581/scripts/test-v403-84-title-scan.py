#!/usr/bin/env python3
"""Reproduce reported 84/84 MAL, 70 fresh, 13 caught up, 1 AniList-only.
Entirely mocked; confirms the remaining title can certify aggregate 70 rather
than retaining old 69 when its next-episode date is explicit and trustworthy.
"""
import re,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=re.sub(r'<link[^>]+>','',(root/'test-v350-responsive.html').read_text()).replace('</head>','<base href="http://127.0.0.1:8798/" /></head>')
js=(root/'assets/js/mediaflow-v403.bundle.js').read_text().rstrip();assert js.endswith('})();');js=js[:-5]+r'''
window.__v403large={S,adapters:V380_ADAPTERS,run:v377RunJikan,
 setup:()=>{saveState=async()=>{};render=()=>'';
 v166FetchJikan=async path=>({data:{mal_id:Number((path.match(/\/anime\/(\d+)/)||[])[1])}});
 v380Request=async(url,options)=>{
   if(!url.includes('graphql.anilist.co'))throw Error('Unexpected URL');
   return {data:{Media:{idMal:1084,status:'RELEASING',episodes:12,
     nextAiringEpisode:{episode:3,airingAt:Math.floor(Date.now()/1000)+604800},
     airingSchedule:{nodes:[{episode:2,airingAt:Math.floor(Date.now()/1000)-604800}]}}}};
 };
 }};})();'''
server=subprocess.Popen(['python','-m','http.server','8798','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.25)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  outcome=page.evaluate('''async()=>{
   const t=__v403large,s=t.S;t.setup();s.settings=s.settings||{};
   s.settings.v380EpisodeProvider='automatic2';s.settings.seasonalFreshAuto=true;
   s.settings.seasonalFreshCount=69;s.settings.v401RecommendFreshOnly=true;
   s.settings.v377JikanLedger={};s.settings.v377JikanResults={unmatched:[],failures:[],unavailable:[],lastCheckedAt:0,completeBaseline:false};
   s.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,enabled:true,unit:'episodes'}];
   s.library=Array.from({length:84},(_,i)=>({id:'anime'+(i+1),title:'Anime '+(i+1),categoryId:'seasonal',
    externalIds:{mal:String(1001+i)},progress:i<70?8:2,total:12,status:'active'}));
   s.view='library';window.__calls=0;
   for(const src of ['tenrai','anizip','anilist','tvmaze','kitsu'])t.adapters[src]=async mal=>{
    __calls++;
    const n=Number(mal)-1001;
    if(n<70)return 9;
    if(n<83){if(src==='tenrai'||src==='anilist')return 2;
      const e=new Error('Provider has no episode data');e.kind='episode_data_unavailable';throw e;}
    if(src==='anilist')return 2;
    const e=new Error('Provider has no episode data');e.kind='episode_data_unavailable';throw e;
   };
   const run=await t.run({force:true});return {run,scan:s.settings.v402FreshScan,
    aggregate:s.settings.seasonalFreshCount,checked:__calls,
    proof:s.settings.v377JikanLedger['anime84']?.v401Providers?.find(x=>x.source==='anilist')?.v403Proof,
    issues:s.settings.v377JikanResults};}''')
  assert outcome['run']['complete'] and outcome['scan']['malMatched']==84,(outcome,errors)
  assert outcome['scan']['verifiedFreshTitles']==70 and outcome['scan']['verifiedNoFresh']==14 and outcome['scan']['unknown']==0,(outcome,errors)
  assert outcome['aggregate']==70 and outcome['checked']==420 and outcome['proof']['verified'],(outcome,errors)
  assert not any(outcome['issues'][k] for k in ('unavailable','unmatched','failures')),(outcome,errors)
  assert not errors,errors
  print('PASS 84 MAL matched, 70 fresh, 14 verified caught up (1 AniList-only), 0 unresolved; certified aggregate updated from 69 to 70; 420 provider checks')
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
