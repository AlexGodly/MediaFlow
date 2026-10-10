"""v350: static, synthetic-page responsive smoke coverage for screenshot archive sections.

Does not claim authenticated cloud end-to-end coverage. Desktop must have no
v350 toggles and mobile document width must not overflow. Uses the compiled app.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re

ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text().replace('</head>', '<link rel="stylesheet" href="assets/css/177-v351-mobile-regression-repairs.css"></head>')
styles='\n'.join((ROOT / name).read_text(encoding='utf8') for name in re.findall(r'href="(assets/css/[^\"]+)"',raw))
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(ROOT/'assets/js/mediaflow-v359.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v350Smoke={S,App,renderView,renderDashboard,renderLibrary,renderHistory,renderStats,renderSettings,renderBatchLog,renderAbout,renderOldSystem,renderProfile};})();'''
fixture='''()=>{
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 let S=window.__v350Smoke.S;
 S.settings=S.settings||{};
 S.categories=[{id:'anime',name:'Seasonal Anime',unit:'episodes',minutesPerUnit:24,color:'#88aaff',target:2},{id:'manga',name:'Manga',unit:'chapters',minutesPerUnit:15,color:'#ee92ac',target:5}];
 S.library=[{id:'a1',title:'A Very Long Title To Test Content Wrapping In A Small Android Device',categoryId:'anime',status:'active',priority:'high',progress:1,total:12,coverUrl:''},{id:'m1',title:'Test Manga',categoryId:'manga',status:'planned',priority:'medium',progress:0,total:100}];
 S.sessions=[];
 S.collections=[{id:'c1',title:'First Collection With A Long Display Title',description:'Example',titleIds:['a1','m1'],order:['a1','m1']}];
 S.orderPlan={titleIds:['a1','m1'],viewMode:'category',categoryMode:'default',categoryOrder:['anime','manga'],hiddenCategories:[],collectionAssignments:[],categoryQueues:{anime:['t:a1'],manga:['t:m1']},v288QueueView:{layoutMode:'tabs',sectionOrder:'regular-first',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:false}};
 return true;
}'''
nav='''(route)=>{
 const {S,App,renderView}=window.__v350Smoke;
 const root=document.querySelector('#view-root');
 S.view=route;
 const renderers={dashboard:'renderDashboard',library:'renderLibrary',history:'renderHistory',stats:'renderStats',settings:'renderSettings',batch:'renderBatchLog',about:'renderAbout',old:'renderOldSystem',profile:'renderProfile'};
 if(renderers[route]){
   root.innerHTML=window.__v350Smoke[renderers[route]]();
 }else renderView();
 if(route==='library'&&typeof App.v262EnhanceLibrary==='function')App.v262EnhanceLibrary();
 if(typeof App.v350MobileEnhance==='function')App.v350MobileEnhance();
 const visibleNodes=[...root.querySelectorAll('button,.btn')].filter(el=>{
  const r=el.getBoundingClientRect();return r.height>0&&r.width>0;
 });
 return {hasHTML:root.innerHTML.length>0, scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth, mobileControls:root.querySelectorAll('.mf350-mobile-toggle').length, buttons:visibleNodes.length};
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[]
 for width in [320,360,375,390,412,430,600,768,820,1024,1280,1440]:
  page=browser.new_page(viewport={'width':width,'height':860},device_scale_factor=1)
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html)
  page.evaluate('''()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
  page.add_script_tag(content=js)
  page.evaluate(fixture)
  for route in ['dashboard','library','order','collections','history','stats','settings','batch','about','old']:
   result=page.evaluate(nav,route)
   assert result['hasHTML'],(width,route,'empty page')
   assert result['scrollWidth']<=result['clientWidth']+2,(width,route,result)
   if width>=1024:assert result['mobileControls']==0,(width,route,'mobile controls on desktop')
   if route=='history' and width<=1023:
    position=page.locator('.v260-history-page .v260-history-tabs').first.evaluate('(el)=>getComputedStyle(el).position')
    assert position=='static',(width,'History sticky tabs on mobile',position)
   if route=='library' and width<=1023:
    assert page.locator('.mf262-library-tools .mf350-mobile-toggle').count(),(width,'Library toggle missing')
  print('PASS',width,'CSS px:', '10 page families', 'desktop protected' if width>=1024 else 'mobile responsive',flush=True)
  page.close()
 assert not errors,errors[:6]
 browser.close()
print('PASS v350 multi-page, multi-viewport smoke test')
