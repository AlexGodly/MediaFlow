"""v364 compiled real-DOM layout and preference regression (synthetic, Chromium)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
css='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for release in range(351,365):
 for path in sorted((R/'assets/css').glob(f'*-v{release}-*.css')):
  if path.name not in raw:css+='\n'+path.read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v364.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v364={S,App,renderOrder,v363Enhance,v288EnsureQueueView,v363Prefs,v364Controls:v288QueueControlsHtml,v288CollectionQueueBoardHtml,v364ApplyDirectCoverScale,v288NormalizeQueueView};})();'''
prior=(R/'tests/test-v359-pagination-tabs.py').read_text()
fixture=re.search(r"fixture='''([\s\S]*?)'''",prior).group(1).replace('__v359','__v364')
fixture=fixture.replace('document.querySelector(\'#view-root\').innerHTML=window.__v364.renderOrder();return true;', '''
 const data=S.orderPlan;data.v288QueueView.layoutMode='lists';data.v288QueueView.showCollectionsInRegularQueues=true;
 data.collectionAssignments.push({id:'assign2',collectionId:'col1',categoryId:'b',categoryRule:'force',completedRule:'skip',createdAt:200,modifiedAt:200});
 data.collectionAssignments.push({id:'assign3',collectionId:'col2',categoryId:'c',categoryRule:'force',completedRule:'skip',createdAt:300,modifiedAt:300});
 data.categoryQueues.b=['t:t2','c:assign2'];data.categoryQueues.c=['c:assign3'];
 S.settings.v181CoverSizes={order:195};
 document.querySelector('#view-root').innerHTML=window.__v364.renderOrder();window.__v364.v363Enhance();return true;
 ''')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(820,1000),(1280,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html)
  page.evaluate("()=>{const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate(fixture)
  regular=page.locator('.mf288-regular-section .v138-category-card')
  queues=page.locator('.mf364-collection-grid .mf288-collection-queue-group')
  assert regular.count()>=1,(w,'regular categories')
  assert queues.count()==3,(w,'queue groups',queues.count())
  page.locator('.mf354-advanced-access').click()
  ctl=page.locator('.mf364-direct-cover-tool')
  assert ctl.count()==1,(w,'new cover slider missing',ctl.count())
  assert ctl.is_visible(),(w,'cover slider hidden')
  assert page.locator('#mf364-direct-cover-range').input_value()=='100'
  page.locator('#mf364-direct-cover-range').evaluate("el=>{el.value='175';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}")
  assert page.evaluate('window.__v364.v288EnsureQueueView().directQueueTitleCoverScale')==175
  assert page.locator('#mf364-direct-cover-number').input_value()=='175'
  assert page.evaluate('window.__v364.v288EnsureQueueView().collectionCoverScale')==100,(w,'other cover setting touched')
  before=page.locator('.mf288-direct-cover').first.evaluate('e=>e.getBoundingClientRect().width')
  assert before>=30,(w,'direct cover too small',before)
  # The v363 grid-column:2!important regression used to squeeze Collection
  # metadata beneath its narrow cover. The readable body must be column 3.
  assert page.locator('.mf288-category-mixed-card .mf287-assignment-main').first.evaluate('e=>getComputedStyle(e).gridColumnStart')=='3',(w,'Collection main content overlaps cover')
  assert page.locator('.mf364-collection-grid .mf287-assignment-main').first.evaluate('e=>getComputedStyle(e).gridColumnStart')=='3',(w,'queue Collection copy in cover column')
  # Collection artwork restored even in narrow regular title cards.
  assert page.locator('.mf288-category-mixed-card .mf287-assignment-cover').count()>=1
  covers=page.locator('.mf288-category-mixed-card .mf287-assignment-cover')
  assert covers.first.is_visible(),(w,'assigned cover suppressed')
  dimensions=page.evaluate('''()=>({
    regular:[...document.querySelectorAll('.mf288-regular-section .v138-category-card')].map(e=>[e.getBoundingClientRect().left,e.getBoundingClientRect().top,e.getBoundingClientRect().width]),
    queue:[...document.querySelectorAll('.mf364-collection-grid>.mf288-collection-queue-group')].map(e=>[e.getBoundingClientRect().left,e.getBoundingClientRect().top,e.getBoundingClientRect().width]),
    title:[...document.querySelectorAll('.mf288-regular-section .v138-order-row')].slice(0,2).map(e=>{const wrap=e.children[1].getBoundingClientRect();return [wrap.width,wrap.height]}),
    direct:[...document.querySelectorAll('.mf288-direct-cover')].slice(0,2).map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]}),
    assign:[...document.querySelectorAll('.mf288-assignment-shell>.mf287-assignment-cover')].slice(0,2).map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]}),
    scroll:[document.documentElement.scrollWidth,document.documentElement.clientWidth]
   })''')
  assert dimensions['scroll'][0]<=dimensions['scroll'][1]+4,(w,'document overflow',dimensions)
  for typ in ['title','direct','assign']:
   for width,height in dimensions[typ]:
    assert width>1 and height>1,(w,typ,'zero-sized artwork',width,height)
    assert .62<=width/height<=.72,(w,typ,'bad aspect ratio',width,height)
  if w>=1024:
   for n in [1,2,3,4]:
    page.evaluate('(n)=>window.__v364.App.v363SetColumns(n)',n)
    r=page.locator('.mf288-regular-section .v138-category-card')
    q=page.locator('.mf364-collection-grid>.mf288-collection-queue-group')
    assert q.count()==3 and r.count()>=1
    # Both boards respond to one --mf363-columns setting without rerender.
    assert page.locator('.mf363-columns-button.active').get_attribute('data-columns')==str(n)
    if w>=1920 and n in [1,2,3,4]:
     pos=q.evaluate_all('els=>els.map(e=>Math.round(e.getBoundingClientRect().top))')
     same=len(set(pos))
     assert same==(3+n-1)//n,(w,'queue grid did not follow shared column count',n,pos)
   if w==1920:
    page.evaluate('()=>window.__v364.App.v363SetColumns(4)')
    page.locator('.mf354-advanced-access').click()
    page.locator('.mf364-collection-grid').scroll_into_view_if_needed()
    page.screenshot(path=str(R/'tests/v364-lists-1920.png'),full_page=False)
  else:
   pos=queues.evaluate_all('els=>els.map(e=>Math.round(e.getBoundingClientRect().top))')
   assert len(set(pos))==len(pos),(w,'mobile queues not stacked',pos)
   if w==390:
    page.locator('.mf354-advanced-access').click()
    page.locator('.mf364-collection-grid').scroll_into_view_if_needed()
    page.screenshot(path=str(R/'tests/v364-lists-390.png'))
  # Check separate title-list and Collection Queue cover scale despite tab switch.
  page.locator('.mf354-quick-switch .btn').filter(has_text='Tabs').click()
  page.wait_for_timeout(150)
  page.locator('.mf345-main-tab').filter(has_text='Collection queues').click()
  page.evaluate("()=>window.__v364.App.v345SelectCategory('collections','b')")
  assert page.locator('.mf288-direct-cover').count()>=1,(w,'tab Collection Queue title cover missing')
  assert not errors,(w,'JS exceptions',errors[:4])
  print('PASS',w,'cover ratios, shared grid, independent cover control, Tabs & Lists, no overflow',flush=True)
  page.close()
 browser.close()
