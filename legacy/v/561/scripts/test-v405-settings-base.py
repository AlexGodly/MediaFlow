#!/usr/bin/env python3
"""Actual Settings Center mount test, not merely a legacy renderSettings() snapshot."""
from pathlib import Path
import subprocess,time,re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text();index=(R/'index.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^\"]+)"',index) if (R/p).exists())
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8835/"></head>')
js=(R/'assets/js/mediaflow-v405.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__settingsV405={S,App,mount:()=>{
 V115_STARTUP_GUARD=false;AUTH_USER={id:'v405-settings-test',email:'test@local'};
 S.view='settings';S.logging=false;S.modal=null;S.sessionActive=false;
 S.categories=[{id:'seasonal',name:'Seasonal Anime',unit:'episodes',seasonal:true,enabled:true,target:2,weight:3}];
 S.library=[];S.sessions=[];S.activityLog=[];S.collections=[];S.orderPlan={};S.completionTimeline=[];
 S.settings=S.settings||{};S.settings.v380EpisodeProvider='automatic2';S.settings.seasonalFreshAuto=true;
 S.settings.exactTitleRecommendations=true;S.settings.v401RecommendFreshOnly=false;
 S.xpLedger={};renderShell();
}};})();'''
server=subprocess.Popen(['python','-m','http.server','8835','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.4)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280]:
   page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('()=>__settingsV405.mount()')
   status=page.evaluate('''()=>{
     const settings=document.querySelector('#view-root .mf365-settings-center');
     const rec=settings?.querySelector('[data-mf401-filter="recommendations"]');
     const section=rec?.closest('.mf365-section');
     return {settings:!!settings,rec:!!rec,section:section?.dataset.mf365Section,neighbor:rec?.previousElementSibling?.className};
   }''')
   assert status['settings'] and status['rec'] and 'mf404-recommend-divider' in status['neighbor'],(width,status,errors)
   assert not errors,(width,errors[:2]);print('PASS',width,'mounted Settings Center shows exactly one correctly placed fresh-only switch',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
