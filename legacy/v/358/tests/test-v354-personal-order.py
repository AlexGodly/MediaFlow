from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
styles+='\n'+(R/'assets/css/180-v354-personal-order-quick-workspace.css').read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v354.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v354={S,App,renderOrder,renderView,v354State,v354CategoryIds,v354PriorityIds,v354FilterRows,v354RowMeta,v287Queue,v287Assignments,v354CollectionPickerHtml:v287CollectionPickerHtml,v354CollectionMatches:v287CollectionMatches,v230ResolvedSurface,v354ListResults,v345TabLayoutHtml};})();'''
fixture='''()=>{
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 const {S,App}=window.__v354;
 S.view='order';
 S.settings=S.settings||{};
 S.categories=[{id:'a',name:'Seasonal Anime',unit:'episodes',icon:'🌸',color:'#ef6abb',minutesPerUnit:24},{id:'b',name:'Books',unit:'pages',icon:'📚',color:'#6aaeff',minutesPerUnit:5},{id:'c',name:'Manga Backlog',unit:'chapters',icon:'📕',color:'#00bbaa',minutesPerUnit:12}];
 S.settings.v230ChoiceLayout={setCategory:{source:'custom',order:['c','a','b'],hidden:[]},categoryFilter:{source:'custom',order:['b','c','a'],hidden:[]},priorityFilter:{source:'custom',order:['medium','low','high'],hidden:[]},setPriority:{source:'custom',order:['medium','low','high'],hidden:[]}};
 S.library=[{id:'a1',title:'Alpha Story',categoryId:'a',status:'active',priority:'high',rating:8,progress:3,total:12},{id:'a2',title:'Zebra Amazing Story',categoryId:'a',status:'completed',priority:'low',rating:6,progress:12,total:12},{id:'b1',title:'Book Test Title',categoryId:'b',status:'planned',priority:'medium',rating:9,progress:1,total:90},{id:'c1',title:'Manga Title',categoryId:'c',status:'active',priority:'medium',rating:10,progress:2,total:40},{id:'n1',title:'Not Ordered Yet',categoryId:'b',status:'active',priority:'medium',rating:5,progress:0,total:10}];
 S.collections=[{id:'col1',title:'Best Collection',description:'Action',titleIds:['a1','b1'],order:['a1','b1'],modifiedAt:9},{id:'col2',title:'Older Collection',description:'Comics',titleIds:['c1'],order:['c1'],modifiedAt:2}];
 S.orderPlan={titleIds:['a2','a1','b1','c1'],viewMode:'category',categoryMode:'default',categoryOrder:['a','b','c'],hiddenCategories:[],collectionAssignments:[{id:'as1',collectionId:'col1',categoryId:'a',categoryRule:'force',completedRule:'skip',traversedTitleIds:[],createdAt:100,modifiedAt:100}],categoryQueues:{a:['t:a2','c:as1','t:a1'],b:['t:b1'],c:['t:c1']},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:true,sectionOrder:'regular-first'}};
 document.querySelector('#view-root').innerHTML=window.__v354.renderOrder();
 return true;
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(820,1050),(1280,900)]:
  page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate(fixture)
  assert page.locator('.mf354-quickbar').count()==1,(w,'quick actions')
  assert page.locator('.mf354-browse-tools').count()==1,(w,'filters missing')
  categories=page.evaluate("()=>window.__v354.v354CategoryIds('categoryFilter')")
  assert categories==['b','c','a'],(w,categories)
  priority=page.evaluate('()=>window.__v354.v354PriorityIds()')
  assert priority==['medium','low','high'],(w,priority)
  assert page.locator('.mf354-quickbar .btn').count()>=4
  page.locator('.mf354-category-trigger').first.click()
  assert page.locator('.mf354-category-popup:visible').count()==1
  assert page.locator('.mf354-category-popup:visible .mf354-cat-option').count()==4
  page.locator('.mf354-category-popup:visible input[type=search]').fill('Books')
  assert page.locator('.mf354-category-popup:visible .mf354-cat-option:visible').count()==1
  page.locator('.mf354-category-popup:visible .mf354-cat-option:visible').click()
  assert page.locator('.mf354-results').count()==1,(w,'filter render')
  assert page.evaluate("()=>window.__v354.S.orderPlan.titleIds.join(',')")=='a2,a1,b1,c1',(w,'order changed')
  if w<1024:page.locator('.mf354-toggle-filters').click()
  page.locator('.mf354-browse-tools [aria-label="priority filter"]').select_option('medium')
  assert page.locator('.mf354-results').count()==1
  page.locator('.mf354-clear').click()
  page.locator('.mf354-quickbar .btn').filter(has_text='Add title').click()
  assert page.locator('.mf354-sheet-backdrop').count()==1,(w,'add sheet')
  assert page.locator('.mf354-sheet-body .v138-picker-row').count()>0,(w,'title search candidates')
  page.locator('.mf354-sheet-header button').click()
  assert page.locator('.mf354-sheet-backdrop').count()==0
  page.locator('.mf354-quickbar .btn').filter(has_text='Add Collection').click()
  assert page.locator('.mf354-sheet-body .mf354-assignment-picker').count()==1,(w,'assignment category missing')
  page.locator('.mf354-sheet-body .mf354-category-trigger').click()
  choices=page.locator('.mf354-sheet-body .mf354-cat-option:visible')
  assert choices.count()==3,(w,'assignment categories')
  assert 'Manga Backlog' in choices.nth(0).inner_text(),(w,'assignment settings order')
  page.locator('.mf354-sheet-body .mf354-category-popup input').fill('Books')
  page.locator('.mf354-sheet-body .mf354-cat-option:visible').click()
  assert page.evaluate("()=>window.__v354.S.orderPlannerUI.v287CollectionCategoryId")=='b'
  if w<1024:page.locator('.mf354-sheet-body .mf354-collection-filter-disclosure>summary').click()
  page.locator('.mf354-sheet-body .mf354-collection-picker-controls [aria-label="Collection sort filter"]').select_option('count')
  assert page.locator('.mf354-sheet-body .mf287-picker-row').count()>=2
  page.locator('.mf354-sheet-header button').click()
  page.locator('.mf345-main-tab').filter(has_text='Collection queues').click()
  assert page.locator('.mf354-browse-tools[data-kind="collections"]').count()==1
  assert page.locator('.mf354-filter-fields [aria-label="priority filter"]').count()==1
  assert not errors,(w,errors[:4])
  width=page.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
  assert width['scroll']<=width['client']+3,(w,width)
  print('PASS',w,'quick actions, category and priority settings order, filters, assignment, queues',flush=True)
  page.close()
 browser.close()
