#!/usr/bin/env python3
"""End-to-end v377 seasonal ledger with v401 source comparison; all provider calls mocked."""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'test-v350-responsive.html').read_text()
html=re.sub(r'<link[^>]+>','',html).replace('</head>','<base href="http://127.0.0.1:8784/"></head>')
js=(ROOT/'assets/js/mediaflow-v401.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__scan={S,App,adapters:V380_ADAPTERS,run:v377RunJikan,available:v166AvailableEpisodeCount,pick:pickLibraryTitle,eligible:v401EpisodeOutcome,restore:v401RestoreUnfilteredTask,source:V380_SOURCE_BY_MAL};})();'''
server=subprocess.Popen(['python','-m','http.server','8784','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.35)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (390,1280):
   page=browser.new_page(viewport={'width':width,'height':850});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('''()=>{
    const d=__scan,s=d.S;
    s.settings=s.settings||{};s.settings.seasonalFreshAuto=true;s.settings.exactTitleRecommendations=true;s.settings.v380EpisodeProvider='automatic2';s.settings.v401RecommendFreshOnly=true;
    s.settings.v377JikanLedger={};s.settings.v377JikanResults={unmatched:[],failures:[],unavailable:[],lastCheckedAt:0};
    s.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,enabled:true,target:2,unit:'episodes',weight:2}];
    s.library=[{id:'a',title:'Anime A',progress:5,total:12,categoryId:'seasonal',status:'active',externalIds:{mal:'11'}},
               {id:'b',title:'Anime B',progress:12,total:12,categoryId:'seasonal',status:'active',externalIds:{mal:'22'}}];
    s.sessions=[];s.view='library';s.currentTask=null;
    saveState=async()=>{window.__saves=(window.__saves||0)+1};render=()=>'';
    window.__calls=[];
    for(const provider of ['tenrai','anizip','anilist','tvmaze','kitsu'])d.adapters[provider]=async mal=>{__calls.push(provider+':'+mal);return mal==='11'?(provider==='anizip'?7:5):12};
   }''')
   r=page.evaluate('''async()=>{
     const d=__scan,s=d.S;
     const res=await d.run({force:true});
     const entries=Object.fromEntries(Object.entries(s.settings.v377JikanLedger).map(([id,hit])=>[id,{count:hit.available,source:hit.v380Provider,mode:hit.v401Mode,providers:hit.v401Providers?.length,disagreement:hit.v401Disagreement}]));
     return {res,entries,calls:__calls.length,selected:d.pick(s.categories[0])?.id,aggregate:s.settings.seasonalFreshCount};
   }''')
   assert r['calls']==10 and r['selected']=='a' and r['aggregate']==1,(width,r,errors)
   assert r['entries']['a']['mode']=='automatic2' and r['entries']['a']['providers']==5 and r['entries']['a']['disagreement']==True,(width,r)
   assert r['entries']['b']['mode']=='automatic2' and r['entries']['b']['providers']==5 and r['entries']['b']['count']==12,(width,r)
   # Automatic 1's legacy early accept contract remains the same.
   r2=page.evaluate('''async()=>{
    const d=__scan,s=d.S;s.settings.v380EpisodeProvider='automatic';__calls.length=0;
    const out=await d.available('11',true);
    return {out,calls:__calls.length,source:d.source.get('11')?.source};
   }''')
   assert r2['out']==5 and r2['calls']==1 and r2['source']=='tenrai',(width,r2)
   recovery=page.evaluate('''async()=>{
    const d=__scan,s=d.S;s.settings.v380EpisodeProvider='automatic2';
    for(const provider of ['tenrai','anizip','anilist','tvmaze','kitsu'])d.adapters[provider]=async()=>{const e=new Error('Unavailable test');e.kind='episode_data_unavailable';throw e};
    await d.run({ids:['a'],force:true});
    const afterFailure={status:d.eligible(s.library[0]),record:s.settings.v377JikanLedger.a?.v401Status,
      count:s.settings.seasonalFreshCount};
    s.currentTask={id:'task',categoryId:'seasonal',libraryId:null,title:null};
    s.settings.v401RecommendFreshOnly=false;
    const restored=d.restore();
    return {...afterFailure,restored,title:s.currentTask.title};
   }''')
   assert recovery['status']=='unknown' and recovery['record']=='unknown' and recovery['count']==1,(width,recovery)
   assert recovery['restored'] and recovery['title']=='Anime A',(width,recovery)
   assert not errors,(width,errors)
   print('PASS',width,'full scan persisted cross-provider evidence, correct aggregate, legacy auto fallback preserved')
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
