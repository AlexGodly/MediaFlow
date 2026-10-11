"""Settings must be fully upgraded in the same task as its initial DOM insertion.

This test checks the registered renderer (not a manually pre-enhanced fixture),
requestAnimationFrame paint boundaries, navigation away/back, canonical settings
patches, theme changes, original controls, and desktop/mobile responsiveness.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text(encoding='utf-8')
styles='\n'.join((ROOT/x).read_text(encoding='utf-8') for x in re.findall(r'href="(assets/css/[^"]+)"',raw) if (ROOT/x).exists())
for n in range(351,368):
 for f in sorted((ROOT/'assets/css').glob(f'*-v{n}-*.css')):
  if f.name not in raw:styles+='\n'+f.read_text(encoding='utf-8')
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<style>'+styles+'</style></head>')
js=(ROOT/'assets/js/mediaflow-v368.bundle.js').read_text(encoding='utf-8').rstrip();assert js.endswith('})();')
js=js[:-5]+'''\nwindow.__v367Test={S,App,renderView,render,v348RenderSettingsPage,v365PatchSettings,v219RunPageEnhancers,settingsRegistry:()=>V221_SETTINGS_REGISTRY};})();'''
setup='''()=>{
 const {S}=window.__v367Test;
 document.querySelector('#app').innerHTML='<div class="main"><div class="container"><div id="view-root"></div></div></div>';
 S.view='settings';S.categories=[{id:'a',name:'Anime',icon:'film',color:'#99abff'}];
 S.library=[];S.sessions=[];S.collections=[];
 window.__firstPaint=[];
 const check=()=>({legacy:document.querySelectorAll('.v221-settings-page:not(.mf365-settings-center)').length,center:document.querySelectorAll('.mf365-settings-center').length,sections:document.querySelectorAll('.mf365-section').length,oldNavVisible:!!document.querySelector('.v221-settings-nav-group:not([hidden])'),xp:document.querySelectorAll('#v348-xp-settings').length});
 window.__check367=check;
 // Renderer must return with zero intermediate legacy screens even before a
 // microtask, timer or animation frame has run.
 window.__v367Test.renderView();
 return check();
}'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(320,720),(390,844),(820,1024),(1280,900),(1920,1080)]:
  page=browser.new_page(viewport={'width':width,'height':height});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html)
  page.evaluate('''()=>{const store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()}})}''')
  page.add_script_tag(content=js)
  initial=page.evaluate(setup)
  assert initial['legacy']==0 and initial['center']==1 and initial['sections']==28 and initial['xp']==1,(width,'synchronous first render',initial)
  frames=page.evaluate('''()=>new Promise(resolve=>{const samples=[];requestAnimationFrame(()=>{samples.push(__check367());requestAnimationFrame(()=>{samples.push(__check367());resolve(samples)})})})''')
  assert all(x['legacy']==0 and x['center']==1 for x in frames),(width,'legacy painted',frames)
  # Real category/search controls remain usable; test rerender from settings change.
  page.locator('.mf365-category-button').filter(has_text='XP & Statistics').click()
  page.locator('.mf365-section[data-mf365-section="v221-settings-leveling-and-xp"] .mf365-section-toggle').click()
  assert page.locator('#v348-xp-settings').count()==1
  assert page.evaluate('window.__v367Test.v365PatchSettings()') is True
  assert page.evaluate('window.__check367()')['legacy']==0
  assert page.locator('.mf365-detail[data-mf365-category="progression"]').is_visible()
  # A different visual theme must not expose raw settings after a rerender.
  page.evaluate('''()=>{document.documentElement.style.setProperty('--panel','#15181f');document.documentElement.style.setProperty('--flow','#f38773');window.__v367Test.renderView()}''')
  assert page.evaluate('window.__check367()')['legacy']==0
  # Navigate out and back repeatedly; inspect immediately after renderView.
  for i in range(8):
   snap=page.evaluate('''()=>{const root=document.getElementById('view-root');window.__v367Test.S.view='library';root.innerHTML='<div class="other-view">Library</div>';window.__v367Test.S.view='settings';window.__v367Test.renderView();return window.__check367()}''')
   assert snap['legacy']==0 and snap['center']==1 and snap['sections']==28,(width,i,snap)
  if width in [390,1920]:page.screenshot(path=str(ROOT/'tests'/f'v368-settings-{width}.png'),full_page=False)
  scroll=page.evaluate('''()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]''')
  assert scroll[0]<=scroll[1]+3,(width,'horizontal overflow',scroll)
  assert not errors,(width,errors[:5])
  print('PASS',width,'no legacy DOM after sync render, 2 frames, 8 navigation cycles, refresh, theme, XP',flush=True)
  page.close()
 browser.close()
