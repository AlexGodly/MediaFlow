"""MediaFlow v384: real Chromium DOM + theme + future-version UI contract tests.
Synthetic state; no cloud data, account actions, real PWA install or API requests.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, subprocess, time
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',(R/'index.html').read_text()))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style><base href="http://127.0.0.1:8767/"></head>')
js=(R/'assets/js/mediaflow-v384.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v384={S,App,renderAbout,v238LoggingLibrarySummary,renderLogForm,v161CurrentVersion};})();'''
server=subprocess.Popen(['python','-m','http.server','8767','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.5)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280,1920]:
   page=browser.new_page(viewport={'width':width,'height':900})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html)
   page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
   page.add_script_tag(content=js)
   page.evaluate('''()=>{let meta=document.querySelector('meta[name="mediaflow-version"]');if(!meta){meta=document.createElement('meta');meta.name='mediaflow-version';document.head.append(meta);}meta.content='384';const d=window.__v384;d.S.library=Array.from({length:15},(_,i)=>({id:'t'+i,title:'Title '+i,categoryId:'anime',progress:3,total:12}));d.S.categories=[{id:'anime',name:'Anime'}];d.S.sessions=[{id:'test',xp:10}];d.S.settings=d.S.settings||{};let r=document.querySelector('#view-root');if(!r){r=document.createElement('div');r.id='view-root';document.body.append(r);}r.innerHTML=d.renderAbout()}''')
   root=page.locator('.mf384-about')
   assert root.count()==1,(width,'missing v384 about')
   assert 'PERSONAL EDITION' not in root.inner_text().upper(),(width,'obsolete About branding found')
   assert root.locator('.mf383-hero-label').inner_text()=='BY ALEX GODLY'
   assert root.locator('.mf383-brand-version').inner_text()=='VERSION 384 · YOUR MEDIA UNIVERSE'
   assert root.locator('.mf383-stat').last.locator('strong').inner_text()=='v384'
   logo=root.locator('.mf384-brand-logo img')
   assert logo.get_attribute('src')=='assets/icons/mediaflow-192.png'
   logo.wait_for(state='visible')
   page.wait_for_function("()=>{const i=document.querySelector('.mf384-brand-logo img');return i && i.complete && i.naturalWidth===192}",timeout=8000)
   assert root.locator('.mf383-faq-entry').count()==45
   assert root.locator('.mf383-fact').count()==24
   assert root.locator('.v250-about-update-card').count()==1
   # Future version compatibility: simulate a new release without modifying v384 module code.
   page.evaluate('''()=>{document.querySelector('meta[name="mediaflow-version"]').content='385';document.querySelector('#view-root').innerHTML=window.__v384.renderAbout()}''')
   root=page.locator('.mf384-about')
   assert root.locator('.mf383-brand-version').inner_text().startswith('VERSION 385')
   assert root.locator('.mf383-stat').last.locator('strong').inner_text()=='v385'
   # Theme-aware: theme CSS var changes affect full clickable surface, badges, and icon.
   page.evaluate('''()=>{document.documentElement.style.setProperty('--accent','#1779ff');const shell=document.createElement('div');shell.className='log-form';shell.innerHTML='<details class="v238-log-library mf383-logging-library"><summary class="v238-log-library-summary mf383-logging-summary">'+window.__v384.v238LoggingLibrarySummary()+'</summary><div class="v238-log-library-body">Search/filter controls</div></details>';document.querySelector('#view-root').append(shell)}''')
   summary=page.locator('.mf383-logging-summary')
   assert summary.count()==1
   bg1=summary.evaluate('(el)=>getComputedStyle(el).backgroundImage')
   assert 'linear-gradient' in bg1 and 'rgb' in bg1,(width,bg1)
   page.evaluate("document.documentElement.style.setProperty('--accent','#ef5441')")
   bg2=summary.evaluate('(el)=>getComputedStyle(el).backgroundImage')
   assert bg1!=bg2,(width,'header did not recolor with active theme')
   summary.click()
   assert page.locator('.mf383-logging-library').get_attribute('open') is not None
   assert not errors,(width,errors[:5])
   if width in (390,1280):
    summary.screenshot(path=str(R/'docs'/f'v384-library-header-{width}.png'))
    page.evaluate('''()=>{document.querySelector('meta[name="mediaflow-version"]').content='384';document.querySelector('#view-root').innerHTML=window.__v384.renderAbout()}''')
    page.locator('.mf384-about .mf383-about-brand').screenshot(path=str(R/'docs'/f'v384-about-brand-{width}.png'))
   print('PASS',width,'official logo, no old edition text, future version, full-theme recolor, header toggle, FAQ, update controls',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
