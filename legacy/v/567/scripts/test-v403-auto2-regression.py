#!/usr/bin/env python3
"""v402 all-provider identity/episode arbitration + unknown-eligible recommendations.
Uses controlled browser mocks, never touches real provider endpoints or Supabase.
"""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=re.sub(r'<link[^>]+>','',(ROOT/'test-v350-responsive.html').read_text()).replace('</head>','<base href="http://127.0.0.1:8791/"></head>')
js=(ROOT/'assets/js/mediaflow-v403.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+r'''
window.__v402test={S,App,adapters:V380_ADAPTERS,run:v377RunJikan,pick:pickLibraryTitle,candidates:v180RecommendationCandidates,
 outcome:v401EpisodeOutcome,eligibility:v401Eligible,settings:renderSettings,checker:v166SeasonalSettingsHtml,
 identity:v402ResolveIdentity,check:v402CheckAllProviders,available:v166AvailableEpisodeCount,
 source:V380_SOURCE_BY_MAL,configure:()=>{
  saveState=async()=>{window.__saves=(window.__saves||0)+1};render=()=>'';
  v166FetchJikan=async path=>{const m=path.match(/\/anime\/(\d+)/);if(m)return {data:{mal_id:Number(m[1])}};throw new Error('No title match')};
  v377Identify=async(item)=>({malId:'',reason:'No confident Jikan title match',stored:false});
  v380Request=async(url,options)=>{if(url.includes('graphql.anilist.co'))return {data:{Media:{id:444,idMal:44,status:'RELEASING'}}};throw new Error('Unmocked URL '+url)};
 }};})();'''
server=subprocess.Popen(['python','-m','http.server','8791','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.4)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280,1920]:
   page=browser.new_page(viewport={'width':width,'height':880});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('''()=>{
    const d=__v402test,s=d.S;
    s.settings=s.settings||{};s.settings.seasonalFreshAuto=true;s.settings.exactTitleRecommendations=true;
    s.settings.v380EpisodeProvider='automatic2';s.settings.v401RecommendFreshOnly=true;
    s.settings.seasonalFreshCount=69;
    s.settings.v377JikanLedger={};s.settings.v377JikanResults={unmatched:[],failures:[],unavailable:[],lastCheckedAt:0,completeBaseline:false};
    s.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,enabled:true,target:2,unit:'episodes',weight:2}];
    s.library=[
      {id:'a',title:'Anime A',progress:8,total:12,categoryId:'seasonal',status:'active',externalIds:{mal:'11'}},
      {id:'b',title:'Anime B',progress:10,total:12,categoryId:'seasonal',status:'active',externalIds:{mal:'22'}},
      {id:'u',title:'Anime U',progress:5,total:12,categoryId:'seasonal',status:'active',externalIds:{mal:'33'}},
      {id:'d',title:'Anime D',progress:7,total:12,categoryId:'seasonal',status:'active',externalIds:{anilist:'444'}}
    ];
    s.sessions=[];s.view='library';s.currentTask=null;
    d.configure();
    window.__calls=[];window.__failU=true;
    for(const provider of ['tenrai','anizip','anilist','tvmaze','kitsu'])d.adapters[provider]=async mal=>{
      __calls.push(provider+':'+mal);
      if(mal==='11')return {tenrai:8,anizip:12,anilist:10,tvmaze:11,kitsu:9}[provider];
      if(mal==='22'){if(provider==='kitsu'){const e=new Error('episode catalogue unavailable');e.kind='episode_data_unavailable';throw e};return 10}
      if(mal==='33'){if(__failU){const e=new Error(provider==='tenrai'?'Network timeout':'episode data missing');e.kind=provider==='tenrai'?'timeout':'episode_data_unavailable';throw e};return 8}
      if(mal==='44')return provider==='anilist'?8:7;
      throw new Error('Unexpected MAL id '+mal);
    };
   }''')
   initial=page.evaluate('''async()=>{
    const d=__v402test,s=d.S,res=await d.run({force:true});
    const ledger=s.settings.v377JikanLedger;
    const report=s.settings.v377JikanResults;
    const modes=s.library.map(x=>({id:x.id,mode:d.outcome(x),eligible:d.eligibility(x,s.categories[0])}));
    const candidateIds=d.candidates({id:'test',categoryId:'seasonal'}).map(x=>x.id);
    const shell=document.createElement('div');shell.innerHTML=d.settings();
    const card=shell.querySelector('[data-mf401-filter="recommendations"]')?.closest('.card');
    const items=card?.querySelectorAll('.settings-toggle-row')||[];
    return {res,count:s.settings.seasonalFreshCount,summary:s.settings.v402FreshScan,
     match:Boolean(ledger.d?.v402Identity?.verifiedMal),winner:ledger.a?.v402Winner,
     fresha:ledger.a?.v402Fresh, caughtUp:ledger.b?.v402Status,
     missing:report.unavailable.length,failures:report.failures.length,
     calls:__calls.length,modes,candidateIds,settingsInCard:Boolean(card),
     rowCount:items.length,rowLabels:[...items].map(x=>x.textContent.trim().slice(0,70)),
     matched:s.settings.v402FreshScan?.malMatched};}''')
   assert initial['res'] is not None,(width,errors)
   assert initial['calls']==20 and initial['winner']=='anizip' and initial['fresha']==4,(width,initial)
   assert initial['caughtUp']=='none' and initial['res']['complete']==False and initial['count']==69,(width,initial)
   assert initial['missing']+initial['failures']==1,(width,initial)
   assert initial['matched']==4 and initial['match'] and initial['summary']['verifiedFreshTitles']==2,(width,initial)
   assert initial['modes']==[{'id':'a','mode':'fresh','eligible':True},{'id':'b','mode':'none','eligible':False},{'id':'u','mode':'unknown','eligible':True},{'id':'d','mode':'fresh','eligible':True}],(width,initial)
   assert 'b' not in initial['candidateIds'] and 'u' in initial['candidateIds'],(width,initial)
   assert initial['settingsInCard'] and initial['rowCount']==3,(width,initial)
   progress=page.evaluate('''()=>{const d=__v402test,s=d.S,a=s.library.find(x=>x.id==='a'),b=s.library.find(x=>x.id==='b');
    const priorA=a.progress,priorB=b.progress;a.progress=12;b.progress=9;
    const after=[d.outcome(a),d.outcome(b),d.eligibility(a,s.categories[0]),d.eligibility(b,s.categories[0])];
    a.progress=priorA;b.progress=priorB;return after;}''')
   assert progress==['none','fresh',False,True],(width,progress)
   retry=page.evaluate('''async()=>{
     const d=__v402test,s=d.S;__failU=false;__calls.length=0;
     const res=await d.run({ids:['u'],force:true});
     const final=s.settings.v402FreshScan;
     const count=s.settings.seasonalFreshCount;
     s.settings.v380EpisodeProvider='automatic';__calls.length=0;
     const legacy=await d.available('11',true);return {res,count,final,sourceCalls:__calls.length,legacy};
   }''')
   assert retry['res']['complete'] and retry['count']==3 and retry['final']['unknown']==0,(width,retry)
   assert retry['sourceCalls']==1 and retry['legacy']==8,(width,retry)
   manual=page.evaluate('''()=>{
     const d=__v402test,s=d.S;s.settings.seasonalFreshAuto=false;
     const html=d.checker();return {disabled:html.includes('disabled aria-disabled="true"'),modeActive:d.eligibility(s.library[1],s.categories[0])};}''')
   assert manual=={'disabled':True,'modeActive':True},(width,manual)
   assert not errors,(width,errors[:5])
   print('PASS',width,'MAL separately matched, AniList cross-ID recovery, all five checks, max verified source, zero with partial coverage, unknown eligible, retry aggregate, Automatic1, UI alignment',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
