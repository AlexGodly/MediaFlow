"""Compiled app v363 UI regressions; Chromium, synthetic local state only."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
raw=(R/'test-v350-responsive.html').read_text()
styles='\n'.join((R/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw))
for n in range(351,365):
 for p in sorted((R/'assets/css').glob(f'*-v{n}-*.css')):
  if p.name not in raw:styles+='\n'+p.read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(R/'assets/js/mediaflow-v365.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v363={S,App,renderOrder,v363Enhance,v363Prefs,v345TabLayoutHtml};})();'''
prior=(R/'tests/test-v359-pagination-tabs.py').read_text()
fixture=re.search(r"fixture='''([\s\S]*?)'''",prior).group(1).replace('__v359','__v363')
fixture=fixture.replace('S.library=Array.from({length:620}', 'S.library=Array.from({length:620}')
fixture=fixture.replace('document.querySelector(\'#view-root\').innerHTML=window.__v363.renderOrder();return true;', "document.querySelector('#view-root').innerHTML=window.__v363.renderOrder();window.__v363.v363Enhance();return true;")
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(820,1024),(1280,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':w,'height':h})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
  page.add_script_tag(content=js)
  page.evaluate(fixture)
  assert page.locator('.mf363-queue-tools').count()==1,(w,'queue tools')
  assert page.locator('.mf363-queue-tools').is_hidden(),(w,'initial collapse')
  tools=page.locator('.mf354-advanced-access')
  assert tools.is_visible(),(w,'queue tools button')
  tools.click()
  assert page.locator('.mf363-queue-tools').is_visible(),(w,'queue tools not visible')
  assert page.locator('.mf363-queue-tools .mf288-queue-controls').is_visible(),(w,'queue display hidden')
  assert page.locator('.mf363-queue-tools .mf346-queue-controls').is_visible(),(w,'page control hidden')
  assert page.locator('.mf363-queue-tools input[type=checkbox]').count()>=3,(w,'queue checkboxes missing')
  # Rapid category queue switch should preserve existing advanced-tools DOM.
  for i in range(3):
   page.locator('.mf345-main-tab').filter(has_text='Collection queues').click()
   assert page.locator('.mf345-category-content').count()==1
   page.locator('.mf345-main-tab').filter(has_text='Category titles').click()
  assert page.locator('.mf363-queue-tools').is_visible(),(w,'state lost')
  assert page.locator('.mf354-quick-switch .mf354-category-access').is_visible(),(w,'Category display missing')
  page.locator('.mf354-quick-switch .mf354-category-access').click()
  assert page.locator('.mf354-sheet-backdrop').count()==1,(w,'category modal')
  page.locator('.mf354-sheet-header button').click()
  # Mobile title sizing now inside a single disclosure.
  page.locator('.mf354-add-actions .btn').filter(has_text='Add title').click()
  sheet=page.locator('.mf359-title-sheet')
  assert sheet.count()==1
  assert sheet.locator('.mf358-size-controls').count()==1
  assert sheet.locator('.mf359-page-size-field').count()==1
  disclosure=sheet.locator('.mf356-title-filters')
  assert disclosure.count()==1
  if w<=1023:
   assert disclosure.locator('.mf358-size-controls').count()==1,(w,'mobile controls missing from filters')
   assert disclosure.locator('.mf359-page-size-field').count()==1
   assert not sheet.locator('.mf358-size-controls').is_visible()
   disclosure.locator(':scope > summary').click()
   assert sheet.locator('.mf358-size-controls').is_visible(),(w,'expanded controls hidden')
  else:
   assert disclosure.locator('.mf358-size-controls').count()==0
   assert sheet.locator('.mf358-size-controls').is_visible()
  sheet.locator('.mf354-sheet-header button').click()
  # Mode switch, no full-page network dependency; still one copy of navigation.
  if w>=1024:
   page.locator('.mf354-quick-switch .btn').filter(has_text='Lists').click()
   page.wait_for_timeout(150)
   page.evaluate('()=>window.__v363.v363Enhance()')
   assert page.locator('.mf363-columns-control').is_visible(),(w,'desktop columns missing')
   page.locator('.mf363-columns-button[data-columns="3"]').click()
   assert page.evaluate('window.__v363.v363Prefs().listColumns')==3
   assert page.locator('.v138-order-view').evaluate('e=>e.style.getPropertyValue("--mf363-columns")')=='3'
   if w==1920:
    page.screenshot(path=str(R/'tests'/'v363-lists-1920.png'))
   assert page.locator('.mf363-primary-actions .v138-order-switch').count()==1,(w,'Lists view controls not grouped')
   assert page.locator('.mf354-quick-switch .mf354-category-access').is_visible(),(w,'desktop Category Display unavailable')
   page.locator('.mf354-quick-switch .btn').filter(has_text='Tabs').click()
   page.wait_for_timeout(150)
   page.evaluate('()=>window.__v363.v363Enhance()')
  assert not errors,(w,errors[:5])
  size=page.evaluate('()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]')
  assert size[0]<=size[1]+3,(w,'horizontal overflow',size)
  print('PASS',w,'Queue Tools, category tabs, title sizing, desktop columns' if w>=1024 else 'mobile parity',flush=True)
  if w in [390,1920]:page.screenshot(path=str(R/'tests'/f'v363-workspace-{w}.png'))
  page.close()
 browser.close()
