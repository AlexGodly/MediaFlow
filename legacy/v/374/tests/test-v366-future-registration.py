"""v366 future-proof Settings registry: simulate newly added sections/controls."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text()
css='\n'.join((ROOT/x).read_text() for x in re.findall(r'href="(assets/css/[^"]+)"',raw) if (ROOT/x).exists())
for n in range(351,367):
 for f in sorted((ROOT/'assets/css').glob(f'*-v{n}-*.css')):
  if f.name not in raw:css+='\n'+f.read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+css+'</style></head>')
js=(ROOT/'assets/js/mediaflow-v366.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v366Test={S,App,render,v348RenderSettingsPage,v219RunPageEnhancers,registry:()=>V221_SETTINGS_REGISTRY,index:()=>V365_INDEX};})();'''

setup='''()=>{
 const api=window.MediaFlowSettingsRegistry;
 api.registerSection({title:'FUTURE ACCESSIBILITY',category:'appearance',subgroup:'Accessibility',keywords:['screen reader','contrast','visual options']});
 api.registerSetting({id:'reduce-animations',section:'FUTURE ACCESSIBILITY',selector:'[data-setting="reduce-animations"]',label:'Reduce animations',keywords:['motion sickness','animations','accessibility']});
 const {S,v348RenderSettingsPage,v219RunPageEnhancers}=window.__v366Test;
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 S.view='settings';S.categories=[{id:'a',name:'Anime',icon:'🎞️',color:'#ff6060'}];S.library=[];S.sessions=[];S.collections=[];
 const markup=v348RenderSettingsPage();const tmp=document.createElement('div');tmp.innerHTML=markup;
 const content=tmp.querySelector('.v221-settings-content');
 content.insertAdjacentHTML('beforeend',`<div class="section-label">FUTURE ACCESSIBILITY</div><div class="card"><div class="custom-future-control" data-setting="reduce-animations"><label>Reduce animations <input type="checkbox" id="v366-future-check"/></label></div></div><div class="section-label">UNCLASSIFIED FUTURE WIDGET</div><div class="field"><label>Unfamiliar switch <input type="checkbox" id="v366-unknown-check"/></label></div>`);
 document.querySelector('#view-root').innerHTML='<div class="fade-in">'+tmp.innerHTML+'</div>';
 v219RunPageEnhancers('settings');return true;
}'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(320,720),(390,844),(1280,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':w,'height':h})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate('''()=>{const store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()}})}''')
  page.add_script_tag(content=js)
  page.evaluate(setup)
  assert page.locator('.mf365-section').count()==30,(w,'missing new section')
  assert page.locator('.mf365-category-button').count()==11,(w,'missing Uncategorized category')
  assert page.locator('.mf365-detail[data-mf365-category="appearance"] .mf366-subgroup-heading').filter(has_text='Accessibility').count()==1
  assert page.locator('.mf365-detail[data-mf365-category="uncategorized"] .mf365-section').count()==1
  assert page.locator('.mf365-detail[data-mf365-category="library"] .mf365-section').count()>=5
  # Explicit metadata search synonyms and direct custom selectors (no standard .field).
  page.locator('.mf365-search-input').fill('motion sickness')
  assert page.locator('.mf365-result').filter(has_text='Reduce animations').count()==1,(w,'keywords not indexed')
  page.locator('.mf365-result').filter(has_text='Reduce animations').click()
  assert page.locator('.mf365-detail[data-mf365-category="appearance"]').is_visible()
  checkbox=page.locator('#v366-future-check')
  assert checkbox.is_visible()
  checkbox.check(force=True)
  assert checkbox.is_checked()
  # Section classification remains sensible even without explicit registry metadata.
  page.locator('.mf365-search-input').fill('Unfamiliar switch')
  assert page.locator('.mf365-result').filter(has_text='Unfamiliar switch').count()==1
  page.locator('.mf365-result').filter(has_text='Unfamiliar switch').click()
  assert page.locator('.mf365-detail[data-mf365-category="uncategorized"]').is_visible()
  assert page.locator('#v366-unknown-check').is_visible()
  # category navigation and custom subgroup heading are not duplicates
  assert page.locator('[data-mf365-content-for="appearance"] .mf366-subgroup').count()>=2
  assert page.locator('#v366-future-check').count()==1
  assert page.locator('#v366-unknown-check').count()==1
  # Unknown metadata category must fall back rather than disappearing.
  fallback=page.evaluate('''()=>{const api=window.MediaFlowSettingsRegistry;api.registerSection({title:'UNKNOWN CATEGORY X',category:'no-such-category'});return api.inspect().sections.find(x=>x.title==='UNKNOWN CATEGORY X').category}''')
  assert fallback=='uncategorized'
  width=page.evaluate('''()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]''')
  assert width[0]<=width[1]+3,(w,'horizontal overflow',width)
  assert not errors,(w,errors[:3])
  print('PASS',w,'metadata grouping, custom setting search, fallback, live input, no duplicates',flush=True)
  page.close()
 # Explicit metadata changes after a page is open can trigger a refresh and reclassification.
 page=browser.new_page(viewport={'width':390,'height':844});page.set_content(html)
 page.evaluate('''()=>{const store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()}})}''');page.add_script_tag(content=js)
 page.evaluate(setup)
 print('Registry public API methods:',page.evaluate('Object.keys(window.MediaFlowSettingsRegistry)'))
 # New code can register a new navigation category and reclassify a live
 # canonical section; refresh reuses the original v348 Settings renderer.
 result=page.evaluate('''()=>{
   const api=window.MediaFlowSettingsRegistry;
   api.registerCategory({id:'reader',name:'Reader Preferences',icon:'app',hint:'Reading comfort'});
   api.registerSection({id:'v221-settings-library-mode',category:'reader',subgroup:'Reading layouts',keywords:['bookreader']});
   return api.refresh();
 }''')
 assert result is True, 'Expected a live Settings Center refresh'
 assert page.locator('.mf365-detail[data-mf365-category="reader"] .mf365-section[data-mf365-section="v221-settings-library-mode"]').count()==1
 assert page.locator('.mf365-category-button').filter(has_text='Reader Preferences').count()==1
 assert page.locator('.mf365-section').count()==28, 'Refresh must use the canonical Settings page, with no phantom section duplication'
 assert page.locator('#v348-xp-settings').count()==1, 'XP controls must survive registry refresh'
 print('PASS live custom category registration and canonical Settings refresh')
 browser.close()
