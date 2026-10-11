from pathlib import Path
from playwright.sync_api import sync_playwright
ns={'__file__':str(Path(__file__).with_name('test-v355-order-regression.py'))}
source=Path(ns['__file__']).read_text();exec(source.split('with sync_playwright() as pw:')[0],ns)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w in (390,1280):
  p=b.new_page(viewport={'width':w,'height':900});errors=[];p.on('pageerror',lambda ex:errors.append(str(ex)))
  p.set_content(ns['html'])
  p.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  p.add_script_tag(content=ns['js']);p.evaluate(ns['fixture'])
  # Check category and priority sorting never rewrite canonical queue.
  raw=p.evaluate("()=>JSON.stringify(window.__v354.S.orderPlan.categoryQueues)")
  if w<1024:p.locator('.mf354-toggle-filters').click()
  p.locator('.mf354-browse-tools [aria-label="Sort categories"]').select_option('title')
  p.locator('.mf354-browse-tools [aria-label="Sort direction"]').select_option('desc')
  assert p.locator('.mf354-results.mf354-sorted').count()==1,(w,'sorted view missing')
  assert p.evaluate("()=>JSON.stringify(window.__v354.S.orderPlan.categoryQueues)")==raw
  # List mode via direct canonical state adjustment; no cloud writes required.
  p.evaluate('''()=>{window.__v354.S.orderPlan.v288QueueView.layoutMode='lists';document.querySelector('#view-root').innerHTML=window.__v354.renderOrder()}''')
  assert p.locator('.mf354-list-result-panel').count()==1,(w,'filter list overlay missing')
  assert p.locator('.mf354-list-result-panel .v138-order-row').count()>=1
  p.locator('.mf354-clear').click()
  assert p.locator('.mf354-list-result-panel').count()==0
  if w<1024:
   p.locator('.mf354-quickbar .mf354-category-access').click()
   assert p.locator('.mf354-sheet-body .v138-category-control').count()==3
   p.locator('.mf354-sheet-header button').click()
   assert p.locator('.mf354-sheet-backdrop').count()==0
  assert not errors,(w,errors)
  print('PASS',w,'Lists filtering and sorting, categories sheet, saved ordering',flush=True)
  p.close()
 b.close()
