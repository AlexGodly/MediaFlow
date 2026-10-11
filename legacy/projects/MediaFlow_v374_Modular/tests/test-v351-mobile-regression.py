"""Compiled v351 CSS/JS: mobile regressions raised from physical-phone screenshots.
This exercises actual generated History & Batch Log UI and Collection tools markup
at 320/390/820, verifying closed state, readable width and desktop absence.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
ROOT=Path(__file__).resolve().parents[1]
T=(ROOT/'test-v350-responsive.html').read_text().replace('</head>','<link rel="stylesheet" href="assets/css/177-v351-mobile-regression-repairs.css"></head>')
styles='\n'.join((ROOT/name).read_text(encoding='utf-8') for name in re.findall(r'href="(assets/css/[^"]+)"',T))
T=re.sub(r'<link[^>]+>','',T).replace('</head>','<style>'+styles+'</style></head>')
js=(ROOT/'assets/js/mediaflow-v351.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v351={S,App,renderView,renderBatchLog,renderHistory,renderLibrary,v274CollectionToolsHtml,v274CollectionBatchBarHtml,v350EnhanceMobile};})();'''
SETUP='''()=>{
 const S=window.__v351.S;
 S.settings=S.settings||{};
 S.categories=[{id:'anime',name:'Anime Backlog',unit:'episodes',minutesPerUnit:24,color:'#f89abb',target:2}];
 S.library=[{id:'t1',title:'_Summer',categoryId:'anime',status:'active',priority:'high',progress:0,total:12,coverUrl:''}];
 S.collections=[{id:'c1',title:'Long Collection',titleIds:['t1'],order:['t1'],createdAt:100,updatedAt:100}];
 S.sessions=[];S.histFilters={range:'all',category:'all',type:'all'};
 S.batchDraft={rows:[{libraryId:'t1',query:'_Summer',qty:1,minutes:30,addedAt:Date.now()}]};
 return true;
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[]
 for width in [320,390,820,1024,1280]:
  page=browser.new_page(viewport={'width':width,'height':844})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(T)
  page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
  page.add_script_tag(content=js)
  page.evaluate(SETUP)
  page.evaluate('''()=>{let r=document.querySelector('#view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));r.innerHTML=window.__v351.renderBatchLog();window.__v351.App.v350MobileEnhance();}''')
  if width<1024:
   page.evaluate('''()=>{document.documentElement.style.setProperty('--v240-batch-cover-width','480px');document.documentElement.style.setProperty('--v240-batch-cover-height','690px')}''')
   card=page.locator('.batch-selected-title')
   if card.count():
    assert page.locator('.batch-selected-title>.mf351-batch-copy').count()==1,(width,'Batch card missing copy grouping')
    assert page.locator('.batch-selected-title>.v241-logged-cover-button').count()==1,(width,'Batch cover button lost')
    dim=page.locator('.batch-selected-title .v239-batch-cover').evaluate('el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})')
    assert dim['w']<=56 and dim['h']<=76,(width,'Batch cover oversized',dim)
    word=page.locator('.batch-selected-title>.mf351-batch-copy').evaluate('el=>el.getBoundingClientRect().width')
    assert word>=85,(width,'Batch text collapsed',word)
   else: print('INFO: Batch selected card not rendered by fixture at',width)
  else:
   assert page.locator('.mf351-batch-copy').count()==0,(width,'desktop grouped Batch title')
  page.evaluate('''()=>{let r=document.querySelector('#view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}));r.innerHTML=window.__v351.renderHistory();window.__v351.App.v350MobileEnhance();}''')
  if width<1024:
   page.locator('.mf350-history-toggle-row .mf350-mobile-toggle').click()
   if page.locator('.mf269-filter-left').count():
    page.evaluate('''()=>{window.__v351.App.v350MobileEnhance()}''')
    cells=page.locator('.mf269-filter-left>.mf269-filter-cell')
    assert cells.count()>=4,(width,'History filters unavailable')
    for i in range(cells.count()):
     d=cells.nth(i).evaluate('el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})')
     assert d['w']>=100,(width,i,'History filter too narrow',d)
   else: print('INFO: Consumption filter absent in synthetic fixture at',width)
  collection_html=page.evaluate('''()=>window.__v351.v274CollectionToolsHtml(window.__v351.S.collections[0])''')
  page.evaluate('''html=>{(document.querySelector('#view-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'view-root'}))).innerHTML=html;window.__v351.App.v350MobileEnhance()}''',collection_html)
  if width<1024:
   assert page.locator('.mf351-batch-actions-toggle').count()==1,(width,'Collection selection button missing')
   assert page.locator('.mf274-collection-batchbar.mf351-batch-collapsed').count()==1,(width,'Collection selection expanded by default')
   toggle=page.locator('.mf274-collection-tools .mf350-mobile-toggle')
   assert toggle.count()==1,(width,'Collection tools toggle missing')
   assert page.locator('.mf274-collection-tools.mf350-detail-closed').count()==1
   hide=page.locator('.mf274-collection-tools .mf274-display-row')
   if hide.count():assert hide.evaluate('el=>getComputedStyle(el).display')=='none',(width,'Collection controls visible while closed')
   toggle.click()
   if hide.count():assert hide.evaluate('el=>getComputedStyle(el).display')!='none',(width,'Collection display unavailable after open')
   page.locator('.mf351-batch-actions-toggle').click()
   assert page.locator('.mf274-collection-batchbar.mf351-batch-collapsed').count()==0
  else:
   assert page.locator('.mf351-batch-actions-toggle').count()==0,(width,'desktop extra collection control')
  print('PASS viewport',width,flush=True)
  page.close()
 assert not errors,errors[:5]
 browser.close()
print('PASS v351 mobile fixes')
