#!/usr/bin/env python3
"""Synthetic 100k Seasonal title UI responsiveness under toggling. Does not test actual provider speed/cloud uploads."""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=re.sub(r'<link[^>]+>','',(R/'test-v350-responsive.html').read_text()).replace('</head>','<base href="http://127.0.0.1:8826/"></head>')
js=(R/'assets/js/mediaflow-v404.bundle.js').read_text().rstrip();assert js.endswith('})();');js=js[:-5]+'''
window.__bench={S,App,setup:()=>{S.settings=S.settings||{};S.settings.v380EpisodeProvider='automatic2';S.settings.seasonalFreshAuto=true;S.settings.v401RecommendFreshOnly=false;S.settings.exactTitleRecommendations=true;S.settings.prioritizePersonalOrder=false;S.settings.v377JikanLedger={};S.view='settings';S.categories=[{id:'seasonal',name:'Seasonal Anime',seasonal:true,enabled:true,target:2}];S.library=Array.from({length:100000},(_,i)=>({id:'t-'+i,title:'Anime '+i,categoryId:'seasonal',status:'active',priority:'medium',progress:0,total:12}));S.currentTask={categoryId:'seasonal',libraryId:'missing',title:'Outdated Recommendation'};window.__persisted=0;persistTask=()=>{window.__persisted++};persistSettings=()=>{window.__persisted++};render=()=>{};}};})();'''
server=subprocess.Popen(['python','-m','http.server','8826','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.3)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':390,'height':860})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate('()=>__bench.setup()')
  result=page.evaluate('''async()=>{
    const t=__bench;let tickCount=0;let peakLag=0;let last=performance.now();const start=performance.now();
    const interval=setInterval(()=>{const now=performance.now();peakLag=Math.max(peakLag,now-last-16);last=now;tickCount++},16);
    const clickStart=performance.now();t.App.v401ToggleFreshRecommendations();const clickMs=performance.now()-clickStart;
    while((!t.S.currentTask.libraryId||t.S.currentTask.libraryId==='missing')&&performance.now()-start<5000){await new Promise(done=>setTimeout(done,35));}
    const settleMs=performance.now()-start;clearInterval(interval);
    return {clickMs,settleMs,peakLag,tickCount,chosen:t.S.currentTask.libraryId,persisted:__persisted,titles:t.S.library.length};
  }''')
  assert result['titles']==100000 and result['chosen'].startswith('t-'),result
  assert result['clickMs']<50 and result['tickCount']>10,result
  if result['peakLag']>100:
   print('WARNING synthetic 100k: noticeable long frame in headless Chromium; needs physical-device validation',round(result['peakLag'],1),'ms')
  assert not errors,errors
  print('PASS synthetic 100k library responsiveness',result)
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
