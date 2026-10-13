"""v383 synthetic Chromium tests; no real Supabase, service-worker install or hosted API."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/p).read_text() for p in re.findall(r'href="(assets/css/[^"]+)"',(R/'index.html').read_text()))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v383.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v383={S,App,renderAbout,v238LoggingLibrarySummary,v383FaqFilter,v383AuditPersistence,v155VerifyCloudState,snapshot};})();'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [320,390,820,1280,1920]:
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate('''()=>{const d=window.__v383;d.S.library=Array.from({length:100},(_,i)=>({id:'t'+i,title:'Title '+i,categoryId:'anime',progress:5,total:12}));d.S.categories=[{id:'anime',name:'Anime'}];d.S.sessions=[{id:'test',xp:15}];d.S.settings=d.S.settings||{};let r=document.querySelector('#view-root');if(!r){r=document.createElement('div');r.id='view-root';document.body.append(r);}r.innerHTML=d.renderAbout();}''')
  assert page.locator('.mf383-about-hero').count()==1,(width,'About hero missing')
  assert page.locator('.mf383-feature-card').count()==6,(width,'Feature count')
  assert page.locator('.mf383-fact').count()>=20,(width,'Fun fact count')
  assert page.locator('.mf383-faq-entry').count()>=40,(width,'FAQ count')
  assert page.locator('.v250-about-update-card').count()==1,(width,'Update controls missing')
  assert page.locator('.mf383-about-hero').inner_text().find('MediaFlow')>=0
  page.locator('#mf383-faq-query').fill('Cloud Sync')
  assert 0<page.locator('.mf383-faq-entry:visible').count()<10,(width,'FAQ search broken')
  page.locator('#mf383-faq-query').fill('')
  page.locator('.mf383-faq-tab[data-v383-category="Logging and XP"]').click()
  assert page.locator('.mf383-faq-entry:visible').count()==7,(width,'FAQ filter broken')
  first=page.locator('.mf383-faq-entry:visible').first;first.locator('summary').click();assert first.get_attribute('open') is not None,(width,'FAQ accordion broken')
  hdr=page.evaluate('''()=>{const d=window.__v383;d.S.logDraft={entries:[{libraryId:'t2'}]};return d.v238LoggingLibrarySummary()}''')
  assert 'Browse Library' in hdr and '100 titles' in hdr and '1 added' in hdr
  page.evaluate('''()=>{const shell=document.createElement('div');shell.className='log-form';shell.innerHTML='<details class="v238-log-library mf383-logging-library"><summary class="v238-log-library-summary mf383-logging-summary">'+window.__v383.v238LoggingLibrarySummary()+'</summary><div class="v238-log-library-body">Search</div></details>';document.querySelector('#view-root').append(shell)}''')
  assert page.locator('.mf383-logging-summary').count()==1
  page.locator('.mf383-logging-summary').click()
  assert page.locator('.mf383-logging-library').get_attribute('open') is not None
  if width==390:
   audit=page.evaluate("()=>{const d=window.__v383,a=d.v383AuditPersistence(),original=d.snapshot(),same=JSON.parse(JSON.stringify(original)),changed=JSON.parse(JSON.stringify(original));changed.collections=[{id:'corrupted'}];return {ready:a.ready,presence:a.presence,roundTrip:a.roundTrip,identical:d.v155VerifyCloudState(same,original),mismatch:d.v155VerifyCloudState(changed,original)}}")
   assert audit['roundTrip']['ok'],('JSON roundtrip',audit['roundTrip'])
   assert all(audit['ready'].values()),('Unavailable pipelines',audit['ready'])
   assert all(x['snapshot'] and x['backup'] for x in audit['presence'].values()),('Missing serialized fields',audit['presence'])
   assert audit['identical']['ok'],('Identical snapshot rejected',audit['identical'])
   assert not audit['mismatch']['ok'] and any('collections' in v.lower() for v in audit['mismatch']['missing']),('Collection mismatch not detected',audit['mismatch'])
   print('AUDIT PASS',len(audit['ready']),'pipeline hooks,',len(audit['presence']),'data fields, JSON roundtrip, collection-mismatch detection',flush=True)
  assert not errors,(width,errors[:3])
  page.locator('.mf383-about-hero').screenshot(path=str(R/'docs'/f'v383-about-hero-{width}.png')) if width in [390,1280] else None
  print('PASS',width,'About, searchable FAQs, fun facts, update card, Logging Library header',flush=True)
  page.close()
 browser.close()
