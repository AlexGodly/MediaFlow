"""v365 Settings Center: live legacy controls, search, favorites, responsive navigation, rerender."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text()
styles='\n'.join((ROOT/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw) if (ROOT/x).exists())
for n in range(351,366):
 for p in sorted((ROOT/'assets/css').glob(f'*-v{n}-*.css')):
  if p.name not in raw:styles+='\n'+p.read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(ROOT/'assets/js/mediaflow-v365.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v365Test={S,App,render,renderView,v348RenderSettingsPage,v219RunPageEnhancers,registry:()=>V221_SETTINGS_REGISTRY,prefs:v365Prefs};})();'''
setup='''()=>{
 const {S,v348RenderSettingsPage,v219RunPageEnhancers}=window.__v365Test;
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 S.view='settings';S.categories=[{id:'a',name:'Anime',icon:'🎞️',color:'#ff6060',target:2,weight:1,unit:'episodes'}];S.library=[];S.sessions=[];S.collections=[];
 const markup=v348RenderSettingsPage(); const temp=document.createElement('div');temp.innerHTML=markup; window.__v365RawControls=[...temp.querySelectorAll('.v221-settings-content input,.v221-settings-content select,.v221-settings-content button')].length; document.querySelector('#view-root').innerHTML='<div class="fade-in">'+markup+'</div>'; 
 v219RunPageEnhancers('settings');return true;
}'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(820,1024),(1280,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate('''()=>{const store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()}})}''')
  page.add_script_tag(content=js);page.evaluate(setup);page.wait_for_timeout(180)
  settings=page.locator('.mf365-settings-center')
  assert settings.count()==1,(w,'center absent')
  assert page.locator('.mf365-home').is_visible(),(w,'home absent')
  assert page.locator('.mf365-category-button').count()==10,(w,'category count')
  assert page.locator('.mf365-section').count()==28,(w,'lost legacy section')
  assert page.locator('.mf365-section-body #v335-xp-settings').count()==1,(w,'XP controls missing')
  assert page.locator('.mf365-section-body #v348-xp-settings').count()==1,(w,'streak controls missing')
  before=page.locator('.mf365-section-body input').count()
  mapped=page.locator('.mf365-section-body input,.mf365-section-body select,.mf365-section-body button').count()
  expected=page.evaluate('window.__v365RawControls')
  assert mapped>=expected-5,(w,'legacy controls lost',mapped,expected)
  assert before>=25,(w,'settings inputs missing',before)
  page.locator('.mf365-category-button').filter(has_text='Library & Titles').click()
  assert page.locator('.mf365-detail[data-mf365-category="library"]').is_visible()
  assert page.locator('.mf365-section[data-mf365-section="v221-settings-library-mode"]').count()==1
  target=page.locator('.mf365-section[data-mf365-section="v221-settings-library-mode"]')
  target.locator('.mf365-section-toggle').click()
  assert target.locator('.mf365-section-body').is_visible()
  # Pin favorites and verify home shortcut.
  target.locator('.mf365-favorite-button').click()
  assert target.locator('.mf365-favorite-button').get_attribute('aria-pressed')=='true'
  page.locator('.mf365-back').click()
  assert page.locator('.mf365-shortcut').filter(has_text='LIBRARY MODE').count()==1,(w,'favorite shortcut missing')
  # Specific setting-level search, not just group/section headings.
  search=page.locator('.mf365-search-input')
  search.fill('First episode XP')
  assert page.locator('.mf365-results').is_visible()
  assert page.locator('.mf365-result').count()>0,(w,'search result missing')
  specific=page.locator('.mf365-result-row').filter(has_text='First episode XP').first
  specific.locator('.mf365-result-pin').click()
  assert specific.locator('.mf365-result-pin').get_attribute('aria-pressed')=='true'
  page.locator('.mf365-result').filter(has_text='First episode XP').first.click()
  assert page.locator('.mf365-detail[data-mf365-category="progression"]').is_visible()
  assert page.locator('.mf365-section[data-mf365-section="v221-settings-leveling-and-xp"] .mf365-section-body').is_visible()
  # Full original Settings renderer must be used after settings rerenders.
  page.evaluate('''()=>{window.__v365Test.render()}''')
  page.wait_for_timeout(100)
  assert page.locator('.mf365-settings-center').count()==1,(w,'center lost after render')
  assert page.locator('#v348-xp-settings').count()==1,(w,'XP lost after rerender')
  assert page.locator('.mf365-section[data-mf365-section="v221-settings-leveling-and-xp"] .mf365-section-body').is_visible(),(w,'open section collapsed after settings rerender')
  assert page.locator('.mf365-detail[data-mf365-category="progression"]').is_visible(),(w,'active section reset')
  page.locator('.mf365-back').click()
  assert page.locator('.mf365-shortcut').filter(has_text='First episode XP').count()==1,(w,'individual setting favorite missing')
  page.locator('.mf365-category-button').filter(has_text='Data & Cloud').click()
  assert page.locator('.mf365-danger-zone button').filter(has_text='Restore all defaults').count()==1,(w,'reset defaults missing')
  page.locator('.mf365-back').click()
  page.locator('.mf365-category-button').filter(has_text='Personal Order').click()
  assert page.locator('.mf365-detail[data-mf365-category="personal-order"] .mf365-route-note').is_visible(),(w,'contextual shortcut missing')
  scroll=page.evaluate('''()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]''')
  assert scroll[0]<=scroll[1]+3,(w,'horizontal overflow',scroll)
  assert not errors,(w,'JS errors',errors[:4])
  if w in [390,1920]:
   page.locator('.mf365-back').click()
   page.screenshot(path=str(ROOT/'tests'/f'v365-settings-{w}.png'),full_page=False)
  print('PASS',w,'all 28 original sections, search, favorites, XP, rerender, contextual links, responsive',flush=True)
  page.close()
 browser.close()
