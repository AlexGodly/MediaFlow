"""v358 browser regression, exercising repeated opens, both pickers, viewport
geometry and search. Fixture is local/offline; no claims about production auth."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for x in ['assets/css/180-v354-personal-order-quick-workspace.css','assets/css/181-v355-personal-order-ui-refinement.css','assets/css/182-v356-personal-order-dialog-browse-layout.css','assets/css/183-v357-personal-order-dialogs-tabs-icons.css','assets/css/184-v358-personal-order-rebuild.css']:
 styles+='\n'+(R/x).read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v358.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v358={S,App,renderOrder,v138PickerHtml,v138OrderCategory,V354_COLLECTION_PICK,v287CollectionMatches};})();'''
fixture='''()=>{
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 const {S}=window.__v358;S.view='order';S.settings=S.settings||{};
 S.categories=[{id:'a',name:'Seasonal Anime',unit:'episodes',icon:'🌸',color:'#ef6abb',minutesPerUnit:24},{id:'b',name:'Books',unit:'pages',icon:'📚',color:'#6aaeff',minutesPerUnit:5},{id:'c',name:'Manga Backlog',unit:'chapters',icon:'📕',color:'#00bbaa',minutesPerUnit:12}];
 S.settings.v230ChoiceLayout={setCategory:{source:'custom',order:['c','a','b'],hidden:[]},categoryFilter:{source:'custom',order:['b','c','a'],hidden:[]},priorityFilter:{source:'custom',order:['medium','low','high'],hidden:[]},setPriority:{source:'custom',order:['medium','low','high'],hidden:[]}};
 S.library=Array.from({length:89},(_,i)=>({id:'t'+i,title:i%2?'A very long Library title with multiple segments and a sequel subtitle '+i:'Library title '+i,categoryId:i%3===0?'a':i%3===1?'b':'c',status:'active',priority:i%4===0?'high':'medium',rating:8,progress:2,total:14}));
 S.collections=Array.from({length:27},(_,i)=>({id:'col'+i,title:'Collection with a longer title '+i,description:'Collection description '+i,titleIds:['t1','t2','t3'],order:['t1','t2','t3'],updatedAt:Date.now()-i*60000,createdAt:Date.now()-i*600000,modifiedAt:Date.now()-i*500000}));
 S.orderPlan={titleIds:['t1','t2'],viewMode:'category',categoryMode:'default',categoryOrder:['a','b','c'],hiddenCategories:[],collectionAssignments:[],categoryQueues:{a:['t:t1'],b:['t:t2'],c:[]},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:true,sectionOrder:'regular-first'}};
 document.querySelector('#view-root').innerHTML=window.__v358.renderOrder();return true;
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(820,1000),(1024,820),(1280,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js);page.evaluate(fixture)
  quick=page.locator('#view-root .mf354-quickbar')
  for cycle in range(5):
   quick.locator('.btn').filter(has_text='Add title').click()
   sheet=page.locator('.mf358-title-sheet');assert sheet.count()==1,(w,cycle,'no title sheet')
   assert sheet.locator('.mf356-title-filters').count()==1,(w,cycle,'nested panels')
   assert sheet.locator('.mf356-title-filters .mf356-title-filters').count()==0,(w,cycle,'recursive filters')
   assert sheet.locator('.mf358-results-panel').count()==1,(w,cycle,'results panel repeated')
   assert sheet.locator('.mf358-mode-btn').count()==5,(w,cycle,'missing views')
   sheet.locator('.mf356-title-filters > summary').click()
   assert sheet.locator('.mf356-title-filters').evaluate('(e)=>e.open'),(w,cycle,'failed filters')
   assert sheet.locator('#v140-order-picker-tools .v225-order-filterbar').count()==1,(w,cycle,'missing filter controls')
   if cycle==0:
    sheet.locator('.v138-picker-row input[type=checkbox]').first.check()
    assert '1 selected' in sheet.locator('.v138-picker-actions').inner_text(),(w,'selection lost')
    sheet.locator('.mf358-mode-btn').filter(has_text='Covers+Titles').click()
    assert sheet.locator('#v138-order-picker-results').evaluate("e=>e.classList.contains('mf358-mode-covers-title')")
    sheet.locator('.mf358-mode-btn').filter(has_text='Cards').click()
    if w in [390,1920]:page.screenshot(path=str(R/'tests'/f'v358-titles-{w}.png'))
   # Interact with a filter and a pager; the picker must not rebuild disclosures.
   priority=sheet.locator('#v225-order-priority')
   if priority.count():priority.select_option('medium')
   if sheet.locator('#v140-order-picker-pager button:not([disabled])').count():
    sheet.locator('#v140-order-picker-pager button:not([disabled])').last.click()
   assert sheet.locator('.mf356-title-filters').count()==1,(w,cycle,'nested after changes')
   sheet.locator('.mf354-sheet-header button').click()
  quick.locator('.btn').filter(has_text='Add Collection').click()
  sheet=page.locator('.mf358-collection-sheet');assert sheet.count()==1,(w,'no collection sheet')
  controls=sheet.locator('.mf358-collection-filters');assert controls.count()==1,(w,'missing collection filters')
  controls.locator(':scope > summary').click()
  assert sheet.locator('.mf358-cat-menu').count()==1,(w,'category menu')
  assert sheet.locator('.mf358-sort-direction').count()==1,(w,'direction button')
  assert sheet.locator('select[aria-label="Collection sort filter"] option').count()==12,(w,'sorting options')
  assert sheet.locator('.mf287-picker-row').count()==27,(w,'collections missing')
  menu=sheet.locator('.mf358-cat-menu');menu.locator(':scope > summary').click()
  menu.locator('input[type=search]').fill('Books')
  assert menu.locator('.mf358-cat-choice:visible').count()==1,(w,'category search')
  menu.locator('.mf358-cat-choice:visible').click()
  assert page.evaluate('window.__v358.V354_COLLECTION_PICK.category')=='b',(w,'category filter not persisted')
  controls.locator('select[aria-label="Collection sort filter"]').select_option('count')
  sheet.locator('.mf358-sort-direction').click()
  assert page.evaluate('window.__v358.V354_COLLECTION_PICK.dir')=='desc',(w,'sort toggle')
  # Switch back to all categories so there are numerous results for grid checks.
  menu.locator(':scope > summary').click();menu.locator('.mf358-cat-choice').first.click()
  cols=sheet.locator('#mf287-collection-results').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").length')
  width=sheet.evaluate('e=>e.getBoundingClientRect().width')
  if w>=1280:assert cols>=2,(w,'still single column',cols)
  if w==1920:assert width>1450,(w,'still narrow',width)
  if w in [390,1920]:page.screenshot(path=str(R/'tests'/f'v358-collections-{w}.png'))
  assert not errors,(w,errors)
  overflow=page.evaluate('()=>document.documentElement.scrollWidth-document.documentElement.clientWidth')
  assert overflow<=3,(w,'horizontal overflow',overflow)
  print('PASS',w,'width',round(width),'Collection columns',cols,'5 repeat cycles, filtering, direction, sorting, no runtime errors',flush=True)
  page.close()
 browser.close()
