#!/usr/bin/env python3
"""v404 browser-mocked UI/state regression; no network provider or Supabase writes."""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=re.sub(r'<link[^>]+>','',(R/'test-v350-responsive.html').read_text()).replace('</head>','<base href="http://127.0.0.1:8824/"></head>')
js=(R/'assets/js/mediaflow-v404.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+r'''
window.__v404test={S,App,canonical:()=>V219_PAGE_RENDERERS.get('settings')({view:'settings',state:S,settings:S.settings,app:App,runtime:MediaFlowRuntime}),checker:()=>v166SeasonalSettingsHtml(),about:()=>renderAbout(),names:()=>({automatic:V380_NAMES.automatic,smart:V380_NAMES.automatic2,health:V381_PROVIDER_LABELS.automatic2}),eligibility:v402EpisodeOutcomeFor,eligible:v401Eligible,diagnostics:()=>v401DiagnosticsHtml(),health:()=>v381HealthSummaryHtml(),prefs:()=>v401FilterEnabled(),setup:()=>{
  S.settings=S.settings||{};S.settings.seasonalFreshAuto=true;S.settings.v380EpisodeProvider='automatic2';S.settings.v401RecommendFreshOnly=false;
  S.settings.exactTitleRecommendations=true;S.settings.prioritizePersonalOrder=false;
  S.settings.v377JikanLedger={};S.settings.v377JikanResults={unmatched:[],failures:[],unavailable:[],lastCheckedAt:0,completeBaseline:false};
  S.library=[];S.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,unit:'episodes',target:2,enabled:true}];
  S.currentTask=null;S.view='settings';window.__saves=0;window.__renders=0;window.__providerCalls=0;
  persistSettings=()=>{window.__saves++;};render=()=>{window.__renders++};
  for(const source of V380_SOURCES.filter(x=>!['automatic','automatic2'].includes(x)))V380_ADAPTERS[source]=async()=>{window.__providerCalls++;return 10};
}};})();'''
server=subprocess.Popen(['python','-m','http.server','8824','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.3)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280]:
   page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('()=>__v404test.setup()')
   pre=page.evaluate('''()=>{
    const t=__v404test,n=t.names(),h=t.canonical(),host=document.createElement('div');host.innerHTML=h;
    const row=host.querySelector('[data-mf401-filter="recommendations"]');
    const card=row?.closest('.card');const labels=[...(card?.querySelectorAll('.settings-toggle-row')||[])].map(x=>x.textContent.trim());
    const checker=t.checker();
    return {names:n,has:!!row,count:card?.querySelectorAll('[data-mf401-filter="recommendations"]').length,
      labels,disabled:!!row?.querySelector('button[role="switch"]')?.disabled,
      selector:checker.includes("Alex Godly's Smart Fresh Episodes Engine"),
      allOld:/Multi-Provider 2|Automatic 2/.test(checker),
      faq:t.about().includes('What is Alex Godly&#39;s Smart Fresh Episodes Engine?') || t.about().includes('What is Alex Godly'),
      facts:t.about().includes('Fuck it, I') && t.about().includes('Where It All Began'),
      faqCount:window.MediaFlowV404.faqCount,factCount:window.MediaFlowV404.factCount};}''')
   assert pre['names']['smart']=="Alex Godly's Smart Fresh Episodes Engine",(width,pre)
   assert pre['names']['automatic']=='Automatic Multi-Provider' and pre['names']['health']==pre['names']['smart'],(width,pre)
   assert pre['has'] and pre['count']==1 and len(pre['labels'])==3,(width,pre)
   assert pre['labels'][1].startswith('Prioritize Personal Order') and 'Only recommend titles with fresh episodes' in pre['labels'][2],(width,pre)
   assert not pre['disabled'] and pre['selector'] and not pre['allOld'],(width,pre)
   assert pre['faq'] and pre['facts'] and pre['faqCount']>=50 and pre['factCount']>=35,(width,pre)
   result=page.evaluate('''async()=>{
    const t=__v404test,host=document.createElement('div');host.innerHTML=t.canonical()+t.checker();document.body.appendChild(host);
    const start=performance.now();t.App.v401ToggleFreshRecommendations();const elapsed=performance.now()-start;
    const switches=[...host.querySelectorAll('button[role="switch"]')].filter(x=>x.id.startsWith('mf401-filter-'));
    const on=switches.every(x=>x.getAttribute('aria-checked')==='true'&&!x.disabled);
    t.App.v401ToggleFreshRecommendations();t.App.v401ToggleFreshRecommendations();
    const rapid=switches.every(x=>x.getAttribute('aria-checked')==='true');
    await new Promise(resolve=>setTimeout(resolve,270));
    const saved=__saves;
    t.S.settings.seasonalFreshAuto=false;t.App.v401ToggleFreshRecommendations();
    const manual=switches.every(x=>x.disabled)&&!t.prefs();
    host.remove();return {elapsed,on,rapid,saved,manual,providerCalls:__providerCalls,prefs:t.prefs()};
   }''')
   assert result['on'] and result['rapid'] and result['saved']==1 and result['manual'] and result['providerCalls']==0,(width,result)
   assert result['elapsed']<70,(width,'toggle exceeded performance budget',result)
   dynamic=page.evaluate('''()=>{
    const t=__v404test,s=t.S,cat=s.categories[0];s.settings.seasonalFreshAuto=true;s.settings.v401RecommendFreshOnly=true;
    const item={id:'one',title:'Mock Show',categoryId:'seasonal',status:'active',progress:8,total:12,externalIds:{mal:'123'}};
    s.library=[item];s.settings.v377JikanLedger.one={malId:'123',sourceTitle:'Mock Show',available:9,at:Date.now(),v401Mode:'automatic2',v402Status:'fresh',v401Providers:[]};
    const before=[t.eligibility(item),t.eligible(item,cat)];item.progress=9;
    const caught=[t.eligibility(item),t.eligible(item,cat)];
    s.settings.v377JikanLedger.one.available=10;
    const newEpisode=[t.eligibility(item),t.eligible(item,cat)];
    delete s.settings.v377JikanLedger.one;
    const unknown=[t.eligibility(item),t.eligible(item,cat)];
    return {before,caught,newEpisode,unknown};
   }''')
   assert dynamic=={'before':['fresh',True],'caught':['none',False],'newEpisode':['fresh',True],'unknown':['unknown',True]},(width,dynamic)
   assert not errors,(width,errors[:4]);print('PASS',width,'canonical settings, complete renaming, About, fast synchronized switches, debounced save, manual mode, no scans, dynamic eligibility',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
