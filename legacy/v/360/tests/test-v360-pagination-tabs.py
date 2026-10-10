"""Compiled v359 in Chromium: independent page sizes and refreshed, aligned
category tabs across desktop and mobile. Synthetic account, not live cloud."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for filename in ['180-v354-personal-order-quick-workspace.css','181-v355-personal-order-ui-refinement.css','182-v356-personal-order-dialog-browse-layout.css','183-v357-personal-order-dialogs-tabs-icons.css','184-v358-personal-order-rebuild.css','185-v359-picker-pagination-category-tabs.css','186-v360-adaptive-personal-order-pickers.css']:
 styles+='\n'+(R/'assets/css'/filename).read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v360.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v359={S,App,renderOrder,v140OrderPickerPageData,v359PagePrefs,v359CollectionPageData,v345CategoryTabs,v287CollectionMatches};})();'''
fixture='''()=>{
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 const {S}=window.__v359;S.view='order';S.settings=S.settings||{};
 S.categories=[{id:'a',name:'Seasonal Anime',unit:'episodes',icon:'🌸',color:'#ef6abb',minutesPerUnit:24},{id:'b',name:'Missed Anime: Extremely Long Category Name',unit:'episodes',icon:'📚',color:'#6aaeff',minutesPerUnit:5},{id:'c',name:'Manga Backlog',unit:'chapters',icon:'📕',color:'#00bbaa',minutesPerUnit:12}];
 S.settings.v230ChoiceLayout={setCategory:{source:'custom',order:['c','a','b'],hidden:[]},categoryFilter:{source:'custom',order:['b','c','a'],hidden:[]},priorityFilter:{source:'custom',order:['medium','low','high'],hidden:[]},setPriority:{source:'custom',order:['medium','low','high'],hidden:[]}};
 S.library=Array.from({length:620},(_,i)=>({id:'t'+i,title:'Library title '+i,categoryId:i%3===0?'a':i%3===1?'b':'c',status:'active',priority:i%4===0?'high':'medium',rating:8,progress:2,total:14}));
 S.collections=Array.from({length:121},(_,i)=>({id:'col'+i,title:'Collection '+i,description:'Collection description '+i,titleIds:['t1','t2','t3'],order:['t1','t2','t3'],updatedAt:Date.now()-i*60000,createdAt:Date.now()-i*600000}));
 S.orderPlan={titleIds:['t1','t2'],viewMode:'category',categoryMode:'default',categoryOrder:['a','b','c'],hiddenCategories:[],collectionAssignments:[{id:'assign1',collectionId:'col0',categoryId:'a',categoryRule:'force',completedRule:'skip',traversedTitleIds:[],createdAt:100,modifiedAt:100}],categoryQueues:{a:['t:t1','c:assign1'],b:['t:t2'],c:[]},paginateOrderedTitles:true,orderedPageSize:20,v288QueueView:{layoutMode:'tabs',showRegularQueues:true,showCollectionQueues:true,showCollectionsInRegularQueues:true,sectionOrder:'regular-first'}};
 document.querySelector('#view-root').innerHTML=window.__v359.renderOrder();return true;
}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(820,1024),(1280,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate(fixture)
  tabs=page.locator('.v138-order-view .mf359-category-tab')
  assert tabs.count()>=2,(w,'category tabs',tabs.count())
  assert tabs.first.locator('.mf359-tab-art').count()==1
  assert tabs.first.locator('.mf359-tab-title').count()==1
  assert tabs.first.locator('.mf359-tab-count').count()==1
  gap=tabs.first.evaluate("e=>parseFloat(getComputedStyle(e).columnGap)")
  assert gap>=8,(w,'tab gap',gap)
  icon_name_gap=tabs.first.evaluate('''e=>{const a=e.querySelector('.mf359-tab-art').getBoundingClientRect(),b=e.querySelector('.mf359-tab-title').getBoundingClientRect();return b.left-a.right}''')
  assert icon_name_gap>=7,(w,'icon touching text',icon_name_gap)
  if w==1920:page.locator('.mf359-tab-scroll').first.screenshot(path=str(R/'tests'/'v359-tabs-desktop.png'))
  page.locator('.mf345-main-tab').filter(has_text='Collection queues').click()
  collection_tabs=page.locator('.v138-order-view .mf359-category-tab')
  assert collection_tabs.count()==1,(w,'Collection queue tab missing')
  assert collection_tabs.first.locator('.mf359-tab-art').count()==1,(w,'Collection tab icon')
  page.locator('.mf345-main-tab').filter(has_text='Category titles').click()
  quick=page.locator('#view-root .mf354-quickbar')
  quick.locator('.btn').filter(has_text='Add title').click()
  sheet=page.locator('.mf359-title-sheet')
  assert sheet.count()==1,(w,'title sheet missing')
  assert sheet.locator('.mf359-page-size-field select').count()==1,(w,'missing title per page')
  assert sheet.locator('.v138-picker-row').count()==50,(w,'wrong default title rows')
  assert 'of 618 titles' in sheet.locator('.mf359-page-summary').inner_text(),(w,'match count',sheet.locator('.mf359-page-summary').inner_text())
  # selection and page size must be independent of the overall queue page-size setting.
  sheet.locator('.v138-picker-row input[type=checkbox]').first.check()
  assert '1 selected' in sheet.locator('.v138-picker-actions').inner_text()
  sheet.locator('.mf359-title-paging select').select_option('200')
  assert sheet.locator('.v138-picker-row').count()==200,(w,'200 title rows')
  assert '1 selected' in sheet.locator('.v138-picker-actions').inner_text(),(w,'lost checkbox selection')
  assert page.evaluate('window.__v359.v359PagePrefs().titles')==200
  sheet.locator('#v140-order-picker-pager button').filter(has_text='2').click()
  assert 'Showing 201–400' in sheet.locator('.mf359-page-summary').inner_text()
  sheet.locator('.mf358-mode-btn').filter(has_text='Covers').first.click()
  assert sheet.locator('.v138-picker-row').count()==200
  sheet.locator('.mf354-sheet-header button').click()
  quick.locator('.btn').filter(has_text='Add title').click()
  sheet=page.locator('.mf359-title-sheet')
  assert sheet.locator('.mf359-title-paging select').input_value()=='200'
  assert sheet.locator('.mf356-title-filters').count()==1,(w,'recursive filters')
  if w==1920:page.screenshot(path=str(R/'tests'/'v359-titles-200-desktop.png'))
  sheet.locator('.mf354-sheet-header button').click()

  quick.locator('.btn').filter(has_text='Add Collection').click()
  sheet=page.locator('.mf359-collection-sheet')
  assert sheet.count()==1,(w,'collection sheet missing')
  assert sheet.locator('.mf359-collection-results-panel').count()==1,(w,'collection panel missing')
  assert sheet.locator('.mf287-picker-row').count()==50,(w,'wrong default Collection rows')
  assert 'of 121 Collections' in sheet.locator('.mf359-collection-page-info').inner_text()
  sheet.locator('.mf359-collection-toolbar select').select_option('25')
  assert sheet.locator('.mf287-picker-row').count()==25,(w,'25 Collection rows')
  assert 'Page 1 of 5' in sheet.locator('.mf359-collection-page-info').inner_text()
  sheet.locator('.mf359-collection-pagination button').filter(has_text='2').click()
  assert sheet.locator('.mf287-picker-row').count()==25,(w,'second page Collection results')
  assert 'Showing 26–50' in sheet.locator('.mf359-collection-page-info').inner_text()
  # Reset paging when category changes and paginate only matching results.
  filters=sheet.locator('.mf358-collection-filters')
  if not filters.evaluate('(e)=>e.open'):filters.locator(':scope>summary').click()
  select=filters.locator('select[aria-label="Collection sort filter"]')
  select.select_option('rating')
  assert 'Page 1 of 5' in sheet.locator('.mf359-collection-page-info').inner_text(),(w,'sorting should reset to page 1')
  sheet.locator('#mf287-collection-search').fill('Collection 11')
  assert sheet.locator('.mf287-picker-row').count()==11,(w,'search results pagination')
  assert 'of 11 Collections' in sheet.locator('.mf359-collection-page-info').inner_text()
  sheet.locator('#mf287-collection-search').fill('')
  sheet.locator('.mf359-collection-toolbar select').select_option('200')
  assert sheet.locator('.mf287-picker-row').count()==121,(w,'200 Collections option')
  assert page.evaluate('window.__v359.v359PagePrefs().collections')==200
  assert page.evaluate('window.__v359.v359PagePrefs().titles')==200
  if w in (390,1920):page.screenshot(path=str(R/'tests'/f'v359-collections-{w}.png'))
  sheet.locator('.mf354-sheet-header button').click()
  quick.locator('.btn').filter(has_text='Add Collection').click()
  assert page.locator('.mf359-collection-toolbar select').input_value()=='200'
  assert not errs,(w,errs[:5])
  overflow=page.evaluate('()=>document.documentElement.scrollWidth-document.documentElement.clientWidth')
  assert overflow<=3,(w,'overflow',overflow)
  print('PASS',w,'titles/Collections page sizes, pagination, selections, filters, category-tab alignment, no overflow',flush=True)
  page.close()
 browser.close()
