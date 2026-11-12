#!/usr/bin/env python3
"""MediaFlow v419: exercise the late runtime module in the real bundle context.
No cloud/auth/write calls. Uses synthetic Library and Personal Order snapshots."""
from pathlib import Path
import json,re,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'VERSION').read_text().strip()=='419'
rt=json.loads((ROOT/'src/js/runtime-order.json').read_text())
assert rt[-1]=='components/304-v419-recommendations-cover-logging-sidebar.js'
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',(ROOT/'index.html').read_text(),re.I)
assert styles[-1]=='assets/css/230-v419-recommends-covers-logging.css'
css='\n'.join((ROOT/s).read_text() for s in styles)
base=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text().rstrip()
assert base.endswith('})();')
js=base[:-len('})();')]+ (ROOT/'src/js/components/303-v418-collections-views-cover-parity.js').read_text() +'\n'+(ROOT/'src/js/components/304-v419-recommendations-cover-logging-sidebar.js').read_text()+'\n'
setup=r'''
window.__mf419={
 setup(){
  S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  S.settings.exactTitleRecommendations=true;
  S.categories=[{id:'anime',name:'Finished Anime',color:'#15ae7e',icon:'🎬',unit:'episodes'},{id:'seasonal',name:'Seasonal Anime',color:'#a55dbe',icon:'🍥',unit:'episodes',seasonal:true}];
  S.library=[
   {id:'a',title:'Toaru Majutsu no Index',categoryId:'anime',coverUrl:'',status:'active',priority:'high',progress:6,total:24,rating:9.5},
   {id:'b',title:'Other Title',categoryId:'anime',coverUrl:'',status:'active',progress:3,total:12,rating:0},
   {id:'c',title:'Third Title',categoryId:'anime',coverUrl:'',status:'planned',progress:0,total:5},
   {id:'d',title:'Seasonal Title',categoryId:'seasonal',coverUrl:'',status:'active',progress:3,total:12}];
  S.collections=[v274NormalizeCollection({id:'series',title:'Toaru Series',titleIds:['a','b'],order:['a','b']}),v274NormalizeCollection({id:'other',title:'Favorites',titleIds:['b','a'],order:['b','a']})];
  S.orderPlan=v138NormalizeOrderPlan({titleIds:['c'],categoryOrder:['anime','seasonal']},S.library,S.categories);
  S.orderPlan.collectionAssignments=[{id:'assign-series',collectionId:'series',categoryId:'anime',categoryRule:'match',completedRule:'skip',traversedTitleIds:[],createdAt:100,modifiedAt:100}];
  S.orderPlan.categoryQueues={anime:['t:c','c:assign-series'],seasonal:[]};
  S.settings.v377JikanLedger={};
  const task={title:'Toaru Majutsu no Index',libraryId:'a',categoryId:'anime',reasons:['High priority','Queue ready']};
  S.currentTask=task;S.sessionActive=true;
  return {html:mf395DashboardRecommendationHtml(task,S.categories[0]),rank:mf419OrderContext(S.library[0]),related:mf419CollectionMembership(S.library[0]),cover:mf419MissingCoverHtml(S.library[0]),logging:v253RecommendedLogCardHtml(S.library[0])};
 },
 manual(){S.settings.seasonalFreshAuto=false;return this.seasonal();},
 seasonal(){
  return mf395DashboardRecommendationHtml({title:'Seasonal Title',libraryId:'d',categoryId:'seasonal',reasons:[]},S.categories[1]);
 }
};
'''
js+=setup+'\n})();'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,390,820,1280):
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="app"><main id="view-root"></main></div></body></html>')
  page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})")
  page.add_style_tag(content=css)
  page.add_script_tag(content=js)
  assert not errors,errors
  out=page.evaluate('window.__mf419.setup()')
  assert out['rank'][0]['queueRank']==2, out['rank']
  assert out['rank'][0]['titleRank']==1, out['rank']
  assert len(out['related'])==2,out['related']
  assert 'Category remaining' in out['html'] and '19' not in 'none'
  assert 'Why this title?' in out['html']
  assert 'Toaru Series' in out['html'] and 'Favorites' in out['html']
  assert '9.5' in out['html'] and 'Your queue position' in out['html']
  assert 'mf419-cover-fallback' in out['logging'] and 'mf419-log-rec-cover' in out['logging']
  page.evaluate('(html)=>{(document.getElementById("view-root")||document.body.appendChild(Object.assign(document.createElement("main"),{id:"view-root"}))).innerHTML=html}',out['html'])
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+3'),(width,'overflow',page.evaluate('document.documentElement.scrollWidth'))
  rec=page.locator('.mf419-recommend-card')
  assert rec.count()==1
  small=page.locator('.mf419-dashboard-cover .mf419-cover-fallback .v144-cat-icon-emoji')
  if small.count():
   dims=page.evaluate('''() => {let cover=document.querySelector('.mf419-dashboard-cover');let icon=cover.querySelector('.v144-cat-icon-emoji');return {c:cover.getBoundingClientRect().width,i:parseFloat(getComputedStyle(icon).fontSize)}}''')
   page.evaluate('document.documentElement.style.setProperty("--v181-cover-recommended","2")')
   dims2=page.evaluate('''() => {let cover=document.querySelector('.mf419-dashboard-cover');let icon=cover.querySelector('.v144-cat-icon-emoji');return {c:cover.getBoundingClientRect().width,i:parseFloat(getComputedStyle(icon).fontSize)}}''')
   assert dims2['c']>=dims['c']-1,(width,dims,dims2)
   if dims2['c']>dims['c']+5:assert dims2['i']>dims['i'],(width,dims,dims2)
  page.locator('.mf419-related').evaluate('(el)=>el.open=true')
  assert page.locator('.mf419-related').evaluate('(el)=>el.open')
  seasonal=page.evaluate('window.__mf419.seasonal()')
  assert 'Verified fresh remaining' in seasonal,seasonal[-800:]
  assert 'Verified fresh remaining' not in page.evaluate('window.__mf419.manual()')
  page.close()
 print('v419 recommendation, ranks, related Collections, missing covers, seasonal gating, responsive widths: PASS')
 browser.close()
