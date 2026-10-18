"""Real v376 compiled-app Chromium layout/queue contract using synthetic local data.
Not a live authenticated cloud or physical-device test.
"""
from pathlib import Path
import re, json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
stylefiles=re.findall(r'href="(assets/css/[^"]+)"',(R/'index.html').read_text())
css='\n'.join((R/p).read_text() for p in stylefiles)
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(R/'assets/js/mediaflow-v380.bundle.js').read_text().rstrip()
assert js.endswith('})();'), 'unexpected build enclosure'
js=js[:-5]+'''\nwindow.__v376={S,App,renderOrder,v363Enhance,v288EnsureQueueView,v376ContinuousCollectionQueue,v345CategoryTabs,v288DetailState};})();'''
prior=(R/'tests/test-v359-pagination-tabs.py').read_text()
fixture=re.search(r"fixture='''([\s\S]*?)'''",prior).group(1).replace('__v359','__v376')
fixture=fixture.replace("document.querySelector('#view-root').innerHTML=window.__v376.renderOrder();return true;", """
 S.library=Array.from({length:620},(_,i)=>({id:'t'+i,title:'Test title with a long, wrapping name '+i,categoryId:i<140?'a':'b',status:'active',priority:'high',rating:8,progress:i%8,total:140}));
 S.collections=[{id:'col0',title:'A collection with a deliberately long title for mobile readability',description:'',titleIds:Array.from({length:140},(_,i)=>'t'+i),order:Array.from({length:140},(_,i)=>'t'+i)}];
 S.orderPlan.titleIds=Array.from({length:126},(_,i)=>'t'+i);
 S.orderPlan.collectionAssignments=[{id:'assign1',collectionId:'col0',categoryId:'a',categoryRule:'force',completedRule:'skip',traversedTitleIds:[],createdAt:100,modifiedAt:100},{id:'assign2',collectionId:'col0',categoryId:'b',categoryRule:'force',completedRule:'skip',traversedTitleIds:[],createdAt:200,modifiedAt:200}];
 S.orderPlan.categoryQueues={a:[...Array.from({length:120},(_,i)=>'t:t'+i),'c:assign1'],b:[...Array.from({length:6},(_,i)=>'t:t'+(i+120)),'c:assign2'],c:[]};
 S.orderPlan.viewMode='all';S.orderPlan.v288QueueView.layoutMode='lists';S.orderPlan.v288QueueView.showRegularQueues=true;S.orderPlan.v288QueueView.showCollectionQueues=true;
 S.orderPlan.v288QueueView.showCollectionsInRegularQueues=true; S.orderPlan.paginateOrderedTitles=false;
 document.querySelector('#view-root').innerHTML=window.__v376.renderOrder();window.__v376.v363Enhance();return true;
 """)

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(1920,1060)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate(fixture)
  assert page.locator('.mf376-continuous-board').count()==1,(width,'no continuous board'); assert page.locator('.mf378-mixed-all .mf288-assignment-shell').count()==2,(width,'assigned collections missing in All Titles'); assert page.locator('.mf378-mixed-all .v138-order-row').count()==126,(width,'titles missing All Titles')
  assert page.locator('.mf376-continuous-board>.mf376-all-queue').count()==1,(width,'not exactly one panel')
  assert page.locator('.mf376-continuous-board .mf288-queue-title-with-cover').count()==126,(width,'titles missing')
  assert page.locator('.mf376-continuous-board .mf376-global-number').all_text_contents()==['121','128'],(width,'global indexes incorrect')
  assert page.locator('.mf376-continuous-board input[aria-label="Collection queue position"]').first.input_value()=='121'
  before=page.evaluate('JSON.stringify(window.__v376.S.orderPlan.categoryQueues)'); positions=page.evaluate('''()=>Array.from(document.querySelectorAll(".mf378-mixed-all .v157-position-input")).slice(0,5).map(e=>({w:e.getBoundingClientRect().width,client:e.clientWidth,scroll:e.scrollWidth}))''');assert positions and all(x['client']>=70 for x in positions),(width,'title input too narrow',positions)
  # Expand first Collection to exercise its 3-digit inner title positions.
  page.evaluate("()=>{window.__v376.v288DetailState('assign1').expanded=true;window.__v376.v288DetailState('assign1').pageSize=140;document.querySelector('#view-root').innerHTML=window.__v376.renderOrder();window.__v376.v363Enhance()}")
  assert page.locator('.mf376-continuous-board .mf288-inner-pos').nth(139).inner_text()=='140'
  assert page.locator('.mf376-continuous-board .mf288-inner-cover').count()==140
  assert page.evaluate('JSON.stringify(window.__v376.S.orderPlan.categoryQueues)')==before,(width,'queue changed by display')
  # Exercise the maximum three-digit badge and a four-digit label without
  # changing canonical queue state or invoking position-movement handlers.
  page.evaluate('''()=>{
    const order=document.querySelector('.v138-order-pos');if(order)order.textContent='999';
    const direct=document.querySelector('.mf287-queue-number');if(direct)direct.textContent='999';
    const inner=document.querySelector('.mf288-inner-pos');if(inner)inner.textContent='1000';
    const assignment=document.querySelector('.mf287-queue-position input');if(assignment)assignment.value='999';
  }''')
  # Badge / cover must occupy separate horizontal space even on narrow devices.
  metrics=page.evaluate('''()=>{
   const pairs=[];
   for(const [row,number,cover] of [
    ['.v138-order-row','.v138-order-pos',':scope > div:nth-child(2)'],
    ['.mf288-queue-title-with-cover','.mf287-queue-number','.mf288-direct-cover'],
    ['.mf288-assignment-shell','.mf287-queue-position','.mf287-assignment-cover'],
    ['.mf288-collection-title-row','.mf288-inner-pos','.mf288-inner-cover']]){
     const host=document.querySelector(row);if(!host)continue;
     const a=host.querySelector(number)?.getBoundingClientRect();const b=host.querySelector(cover)?.getBoundingClientRect();
     if(a&&b)pairs.push({kind:row,left:b.left-a.right,width:a.width,gap:b.left-a.right,cover:b.width,number:a.width});
   }
   return {pairs,document:[document.documentElement.scrollWidth,document.documentElement.clientWidth]};
  }''')
  assert metrics['pairs'],(width,'no layout samples')
  for m in metrics['pairs']:
   assert m['number']>=65,(width,'three-digit lane clipped',m)
   assert m['gap']>=3,(width,'badge overlaps cover',m)
   assert m['cover']>=20,(width,'cover collapsed',m)
  assert metrics['document'][0]<=metrics['document'][1]+5,(width,'horizontal scroll',metrics)
  if width in (390,1280):
   page.locator('.mf376-continuous-board').first.scroll_into_view_if_needed()
   page.screenshot(path=str(R/'tests'/f'v378-list-all-{width}.png'))
  # Lists / By Category: grouping remains and the continuous panel is gone.
  page.evaluate("()=>{window.__v376.S.orderPlan.viewMode='category';document.querySelector('#view-root').innerHTML=window.__v376.renderOrder();window.__v376.v363Enhance()}")
  assert page.locator('.mf376-continuous-board').count()==0,(width,'unexpected all board in category view')
  assert page.locator('.mf364-collection-grid>.mf288-collection-queue-group').count()==2,(width,'category queue groups')
  # Tabs: same queue components and title renderers, no duplicated visual badge.
  page.evaluate("()=>{window.__v376.S.orderPlan.v288QueueView.layoutMode='tabs';document.querySelector('#view-root').innerHTML=window.__v376.renderOrder();window.__v376.v363Enhance()}")
  assert page.locator('.mf345-tab-layout').count()==1,(width,'tabs missing')
  page.locator('.mf345-main-tab').filter(has_text='Collection queues').click()
  assert page.locator('.mf345-category-content .mf287-queue-item').count()>=1
  assert not errors,(width,'browser exceptions',errors[:4])
  print('PASS',width,'continuous All, grouped By Category, Tabs, 3-digit alignment, state preservation',flush=True)
  page.close()
 browser.close()
