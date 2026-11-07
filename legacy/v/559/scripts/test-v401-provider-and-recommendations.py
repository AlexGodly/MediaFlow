#!/usr/bin/env python3
"""v401 offline browser contracts. All provider calls mocked; NO live service claims."""
from pathlib import Path
import re,subprocess,time,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text();index=(ROOT/'index.html').read_text()
styles='\n'.join((ROOT/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',index) if (ROOT/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style><base href="http://127.0.0.1:8784/"></head>')
js=(ROOT/'assets/js/mediaflow-v401.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v401test={S,App,v401Mode,v401FilterEnabled,v401EpisodeOutcome,pickLibraryTitle,v180RecommendationCandidates,v166AvailableEpisodeCount,v166SeasonalSettingsHtml,renderSettings,v401ReconcileTask,v401CurrentStatusMessage,run:v377RunJikan, adapters:V380_ADAPTERS,source:V380_SOURCE_BY_MAL,scan:V401_SCAN_EVIDENCE,ledger:v377RecomputeFromLedger};})();'''
server=subprocess.Popen(['python','-m','http.server','8784','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.4)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (320,390,820,1280,1920):
   page=browser.new_page(viewport={'width':width,'height':900});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('''()=>{const d=__v401test,s=d.S;
    s.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,enabled:true,unit:'episodes',target:2,weight:1},{id:'movies',name:'Movies',enabled:true,unit:'movies',target:1,weight:1}];
    s.library=[{id:'a',title:'Fresh A',categoryId:'seasonal',status:'active',priority:'medium',progress:8,total:12,externalIds:{mal:'100'}},
    {id:'b',title:'Caught Up B',categoryId:'seasonal',status:'active',priority:'medium',progress:10,total:12,externalIds:{mal:'101'}},
    {id:'c',title:'Unknown C',categoryId:'seasonal',status:'active',priority:'medium',progress:5,total:12,externalIds:{mal:'102'}},
    {id:'m',title:'Movie',categoryId:'movies',status:'active',priority:'medium',progress:0,total:1}];
    s.settings=s.settings||{};s.settings.exactTitleRecommendations=true;s.settings.seasonalFreshAuto=true;s.settings.v380EpisodeProvider='automatic2';s.settings.v401RecommendFreshOnly=true;
    s.settings.v377JikanLedger={};s.orderPlan={titleIds:[]};s.currentTask={id:'test',categoryId:'seasonal',libraryId:'b',title:'Caught Up B'};s.view='settings';
    window.__calls=[];
    for(const key of ['tenrai','anizip','anilist','tvmaze','kitsu'])d.adapters[key]=async mal=>{__calls.push(key+':'+mal);return {tenrai:8,anizip:9,anilist:9,tvmaze:8,kitsu:8}[key];};
   }''')
   res=page.evaluate('''async()=>{
    const d=__v401test;
    const result=await d.v166AvailableEpisodeCount('100',true);
    const evidence=d.scan.get('100');
    return {result,providers:evidence.providers.map(x=>x.source),callCount:__calls.length,mode:d.v401Mode(),status:evidence.status};
   }''')
   assert res['result']==9 and res['callCount']==5 and res['status']=='fresh',(width,res)
   assert set(res['providers'])=={'tenrai','anizip','anilist','tvmaze','kitsu'}
   # Verify that failing provider cannot turn no-fresh into a confirmed negative.
   fail=page.evaluate('''async()=>{
    const d=__v401test;d.adapters.kitsu=async()=>{throw new Error('timeout')};
    for(const key of ['tenrai','anizip','anilist','tvmaze'])d.adapters[key]=async()=>8;
    try{await d.v166AvailableEpisodeCount('100',true);return 'wrong-success';}catch(e){return e.kind;}
   }''')
   assert fail=='episode_data_unavailable',(width,fail)
   positive=page.evaluate('''async()=>{
    const d=__v401test;d.adapters.anilist=async()=>10;
    const value=await d.v166AvailableEpisodeCount('100',true);
    return {value,status:d.scan.get('100').status,providerCount:d.scan.get('100').providers.length};
   }''')
   assert positive=={'value':10,'status':'fresh','providerCount':5},(width,positive)
   checks=page.evaluate('''()=>{
    const d=__v401test,s=d.S,now=Date.now();
    for(const [id,mal,available] of [['a','100',10],['b','101',10]])s.settings.v377JikanLedger[id]={malId:mal,available,at:now,sourceTitle:id,v401Mode:'automatic2',v401Status:'verified',v401Providers:[{source:'tenrai',status:'verified',available}]};
    const outcomes=['a','b','c'].map(id=>d.v401EpisodeOutcome(s.library.find(x=>x.id===id)));
    const recommended=d.pickLibraryTitle(s.categories[0]);
    d.v401ReconcileTask();
    const rerolls=d.v180RecommendationCandidates(s.currentTask).map(x=>x.id);
    const settings=d.renderSettings();
    const shell=document.createElement('div');shell.innerHTML=settings;
    const toggles=shell.querySelectorAll('[data-mf401-filter]');
    const checker=d.v166SeasonalSettingsHtml();
    return {outcomes,recommended:recommended?.id,task:s.currentTask.libraryId,rerolls,toggleCount:toggles.length,hasChecker:checker.includes('mf401-filter-checker'),modeOption:checker.includes('value="automatic2"')};
   }''')
   assert checks['outcomes']==['fresh','none','unknown'],(width,checks)
   assert checks['recommended']=='a' and checks['task']=='a' and 'b' not in checks['rerolls'],(width,checks)
   assert checks['toggleCount']>=2 and checks['hasChecker'] and checks['modeOption'],(width,checks)
   switched=page.evaluate('''()=>{
    const d=__v401test,s=d.S;s.settings.seasonalFreshAuto=false;
    const disabled=d.v166SeasonalSettingsHtml().includes('disabled aria-disabled="true"');
    const active=d.v401FilterEnabled();
    const movie=d.pickLibraryTitle(s.categories[1])?.id;
    return {disabled,active,movie};
   }''')
   assert switched=={'disabled':True,'active':False,'movie':'m'},(width,switched)
   assert not errors,(width,errors[:5])
   print('PASS',width,'all provider calls, partial unknown, verified fresh, recommendation eligibility, synchronized settings and manual gating',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
