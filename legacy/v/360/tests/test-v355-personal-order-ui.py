from pathlib import Path
from playwright.sync_api import sync_playwright
import re, sys
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for x in ['assets/css/180-v354-personal-order-quick-workspace.css','assets/css/181-v355-personal-order-ui-refinement.css']:
    styles+='\n'+(R/x).read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v355.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v355={S,App,renderOrder,v354CategoryIds,v354PriorityIds};})();'''
fixture='''()=>{
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 const {S}=window.__v355;
 S.view='order';
 S.settings=S.settings||{};
 S.categories=[{id:'a',name:'Seasonal Anime',unit:'episodes',icon:'🌸',color:'#ef6abb',minutesPerUnit:24},{id:'b',name:'Books',unit:'pages',icon:'📚',color:'#6aaeff',minutesPerUnit:5},{id:'c',name:'Manga Backlog',unit:'chapters',icon:'📕',color:'#00bbaa',minutesPerUnit:12}];
 S.settings.v230ChoiceLayout={setCategory:{source:'custom',order:['c','a','b'],hidden:[]},categoryFilter:{source:'custom',order:['b','c','a'],hidden:[]},priorityFilter:{source:'custom',order:['medium','low','high'],hidden:[]},setPriority:{source:'custom',order:['medium','low','high'],hidden:[]}};
 S.library=[{id:'a1',title:'Alpha Story: A Very Long Long Long Name to Test Line Wrapping',categoryId:'a',status:'active',priority:'high',rating:8,progress:3,total:12},{id:'a2',title:'Zebra Amazing Story',categoryId:'a',status:'completed',priority:'low',rating:6,progress:12,total:12},{id:'b1',title:'Book Test Title',categoryId:'b',status:'planned',priority:'medium',rating:9,progress:1,total:90},{id:'c1',title:'Manga Title',categoryId:'c',status:'active',priority:'medium',rating:10,progress:2,total:40},{id:'n1',title:'Not Ordered Yet',categoryId:'b',status:'active',priority:'medium',rating:5,progress:0,total:10}];
 S.collections=[{id:'col1',title:'Best Collection: A Very Long Collection Name',description:'Action',titleIds:['a1','b1'],order:['a1','b1'],modifiedAt:9},{id:'col2',title:'Older Collection',description:'Comics',titleIds:['c1'],order:['c1'],modifiedAt:2}];
 S.orderPlan={titleIds:['a2','a1','b1','c1'],viewMode:'category',categoryMode:'default',categoryOrder:['a','b','c'],hiddenCategories:[],collectionAssignments:[{id:'as1',collectionId:'col1',categoryId:'a',categoryRule:'force',completedRule:'skip',traversedTitleIds:[],createdAt:100,modifiedAt:100}],categoryQueues:{a:['t:a2','c:as1','t:a1'],b:['t:b1'],c:['t:c1']},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:true,sectionOrder:'regular-first'}};
 document.querySelector('#view-root').innerHTML=window.__v355.renderOrder();
 return true;
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(820,1050),(1280,900)]:
  page=browser.new_page(viewport={'width':w,'height':h});errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js);page.evaluate(fixture)
  assert page.evaluate("()=>window.__v355.v354CategoryIds('categoryFilter')")==['b','c','a']
  assert page.evaluate("()=>window.__v355.v354PriorityIds()")==['medium','low','high']
  quick=page.locator('#view-root .mf354-quickbar');assert quick.count()==1
  if w>=1024:
   assert not quick.locator('.mf354-quick-switch').is_visible(),'duplicate desktop controls'
   assert page.locator('.mf345-layout-switch:visible').count()==1,'desktop original layout switch missing'
  else:
   assert quick.locator('.mf354-quick-switch').is_visible(),'mobile controls hidden'
  # Add Title modal should be readable and retain functional picker results
  quick.locator('.btn').filter(has_text='Add title').click()
  sheet=page.locator('.mf355-personal-order-sheet');assert sheet.count()==1
  assert sheet.locator('.v138-picker-row').count()>=1
  font=sheet.locator('.v138-picker-copy b').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')
  assert font>=13,(w,'tiny title',font)
  bg=sheet.evaluate('(e)=>getComputedStyle(e).backgroundColor')
  assert bg!='rgba(0, 0, 0, 0)',(w,'missing theme panel')
  # Theme inheritance must work for dialogs reparented to document.body.
  page.evaluate("document.body.style.setProperty('--panel','#1b4155')")
  assert sheet.evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(27, 65, 85)',(w,'theme not inherited')
  page.evaluate("document.body.style.removeProperty('--panel')")
  sheet.locator('.mf354-sheet-header button').click();assert page.locator('.mf354-sheet-backdrop').count()==0
  # Collection modal: readable title, 2 or more collection rows, configured assignment categories, selectors.
  quick.locator('.btn').filter(has_text='Add Collection').click()
  sheet=page.locator('.mf355-personal-order-sheet')
  assert sheet.locator('.mf287-picker-row').count()==2
  font=sheet.locator('.mf287-picker-copy b').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')
  assert font>=13,(w,'tiny collection',font)
  sheet.locator('.mf354-category-trigger').click()
  assert sheet.locator('.mf354-cat-option:visible').count()==3
  sheet.locator('.mf354-category-popup input').fill('Books')
  assert sheet.locator('.mf354-cat-option:visible').count()==1
  sheet.locator('.mf354-cat-option:visible').click()
  assert page.evaluate("()=>window.__v355.S.orderPlannerUI.v287CollectionCategoryId")=='b'
  sheet.locator('.mf354-sheet-header button').click()
  # Category Display: proper text and searchable without altering persisted order.
  if w>=1024:page.evaluate("()=>window.__v355.App.v354OpenSheet('categories')")
  else:quick.locator('.btn').filter(has_text='Category display').click()
  sheet=page.locator('.mf355-personal-order-sheet')
  assert sheet.locator('.v138-category-control').count()==3
  assert sheet.locator('#mf355-category-query').count()==1
  font=sheet.locator('.v138-category-control-name').first.evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')
  assert font>=13,(w,'tiny category label',font)
  sheet.locator('#mf355-category-query').fill('Books')
  assert sheet.locator('.v138-category-control:visible').count()==1
  assert 'Books' in sheet.locator('.v138-category-control:visible').inner_text()
  sheet.locator('#mf355-category-query').fill('not-exist')
  assert sheet.locator('.mf355-no-categories').is_visible()
  sheet.locator('.mf354-sheet-header button').click()
  assert not errs,(w,errs)
  dimensions=page.evaluate("()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})")
  assert dimensions['scroll']<=dimensions['client']+3,(w,'overflow',dimensions)
  print('PASS',w,'desktop dedupe, 3 dialogs, readable typography, config order, searchable category display, no overflow')
  if w in [390,1280]:
   quick.locator('.btn').filter(has_text='Add Collection').click()
   page.screenshot(path=str(R/'tests'/f'v355-collection-{w}.png'))
   page.locator('.mf355-personal-order-sheet .mf354-sheet-header button').click()
  page.close()
 browser.close()
