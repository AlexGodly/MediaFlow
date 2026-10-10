from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for x in ['assets/css/180-v354-personal-order-quick-workspace.css','assets/css/181-v355-personal-order-ui-refinement.css','assets/css/182-v356-personal-order-dialog-browse-layout.css']:
 styles+='\n'+(R/x).read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v356.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v356={S,App,renderOrder,v354CategoryIds,v354PriorityIds};})();'''
fixture='''()=>{
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 const {S}=window.__v356;
 S.view='order';S.settings=S.settings||{};
 S.categories=[{id:'a',name:'Seasonal Anime',unit:'episodes',icon:'🌸',color:'#ef6abb',minutesPerUnit:24},{id:'b',name:'Books',unit:'pages',icon:'📚',color:'#6aaeff',minutesPerUnit:5},{id:'c',name:'Manga Backlog',unit:'chapters',icon:'📕',color:'#00bbaa',minutesPerUnit:12}];
 S.settings.v230ChoiceLayout={setCategory:{source:'custom',order:['c','a','b'],hidden:[]},categoryFilter:{source:'custom',order:['b','c','a'],hidden:[]},priorityFilter:{source:'custom',order:['medium','low','high'],hidden:[]},setPriority:{source:'custom',order:['medium','low','high'],hidden:[]}};
 S.library=Array.from({length:50},(_,i)=>({id:'t'+i,title:i%2?'A very long Library title with multiple segments and a sequel subtitle '+i:'Library title '+i,categoryId:i%3===0?'a':i%3===1?'b':'c',status:'active',priority:'medium',rating:8,progress:2,total:14}));
 S.collections=Array.from({length:9},(_,i)=>({id:'col'+i,title:'Collection with a longer title '+i,description:'Collection description '+i,titleIds:['t1','t2'],order:['t1','t2'],modifiedAt:9-i}));
 S.orderPlan={titleIds:['t1','t2'],viewMode:'category',categoryMode:'default',categoryOrder:['a','b','c'],hiddenCategories:[],collectionAssignments:[],categoryQueues:{a:['t:t1'],b:['t:t2'],c:[]},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:true,sectionOrder:'regular-first'}};
 document.querySelector('#view-root').innerHTML=window.__v356.renderOrder();return true;
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,640),(390,844),(430,932),(820,1050),(1280,900)]:
  page=browser.new_page(viewport={'width':w,'height':h});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js);page.evaluate(fixture)
  quick=page.locator('#view-root .mf354-quickbar')
  quick.locator('.btn').filter(has_text='Add title').click()
  sheet=page.locator('.mf356-browse-sheet')
  assert sheet.count()==1,(w,'sheet missing')
  details=sheet.locator('details.mf356-title-filters')
  assert details.count()==1 and not details.evaluate('(el)=>el.open'),(w,'filters default')
  assert sheet.locator('.v138-picker-row').count()>10,(w,'results missing')
  assert sheet.locator('.v138-picker-search').is_visible()
  assert sheet.locator('#v138-order-picker-results').is_visible()
  layout=sheet.evaluate('''e=>{const el=e.querySelector('#v138-order-picker-results'),b=el.getBoundingClientRect();return {height:b.height,scroll:el.scrollHeight,avail:e.getBoundingClientRect().height,visible:!!b.width}}''')
  assert layout['height']>=125,(w,layout)
  sheet.locator('.v138-picker-row input[type=checkbox]').first.check()
  assert '1 selected' in sheet.locator('.v138-picker-actions').inner_text(),(w,'selection lost')
  details.locator(':scope > summary').click()
  assert details.evaluate('(el)=>el.open'),(w,'filters failed to open')
  assert sheet.locator('#v225-order-priority').is_visible(),(w,'filter inaccessible')
  sheet.locator('#v225-order-priority').select_option('medium')
  assert details.evaluate('(el)=>el.open'),(w,'rerender closed filters')
  assert '1 selected' in sheet.locator('.v138-picker-actions').inner_text(),(w,'filter lost selected titles')
  details.locator(':scope > summary').click()
  assert not details.evaluate('(el)=>el.open')
  bg=sheet.evaluate('(e)=>getComputedStyle(e).backgroundColor')
  page.evaluate("document.body.style.setProperty('--panel','#264451')")
  assert sheet.evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(38, 68, 81)',(w,'theme')
  page.evaluate("document.body.style.removeProperty('--panel')")
  if w in (390,1280):page.screenshot(path=str(R/'tests'/f'v356-add-titles-{w}.png'))
  sheet.locator('.mf354-sheet-header button').click()
  quick.locator('.btn').filter(has_text='Add Collection').click()
  sheet=page.locator('.mf356-collection-sheet')
  assert sheet.count()==1 and sheet.locator('.mf287-picker-row').count()==9,(w,'collections missing')
  filters=sheet.locator('details.mf356-collection-filters');assert not filters.evaluate('(el)=>el.open')
  assert sheet.locator('.mf354-assignment-picker').is_visible()
  result=sheet.locator('#mf287-collection-results');dim=result.evaluate('el=>el.getBoundingClientRect().height')
  assert dim>=125,(w,'collection browsing clipped',dim)
  filters.locator(':scope > summary').click();assert filters.evaluate('(el)=>el.open')
  sheet.locator('[aria-label="Collection sort filter"]').select_option('count')
  assert filters.evaluate('(el)=>el.open'),(w,'collections filters collapsed')
  filters.locator(':scope > summary').click()
  if w in (390,1280):page.screenshot(path=str(R/'tests'/f'v356-add-collections-{w}.png'))
  assert not errors,(w,errors)
  vw=page.evaluate('''()=>({w:document.documentElement.scrollWidth,c:document.documentElement.clientWidth})''')
  assert vw['w']<=vw['c']+3,(w,'page overflow',vw)
  print('PASS',w,'title + collection modal: browsing height, collapse, selection, sort, theme, no overflow')
  page.close()
 browser.close()
