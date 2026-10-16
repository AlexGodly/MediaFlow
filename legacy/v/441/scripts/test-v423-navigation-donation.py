#!/usr/bin/env python3
"""MediaFlow v423 navigation/profile/donation tests in the real JS closure.
Uses synthetic in-memory account data; does not access the cloud. """
from pathlib import Path
import json,os,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'VERSION').read_text().strip()=='423'
assert json.loads((ROOT/'src/js/runtime-order.json').read_text())[-1]=='components/308-v423-navigation-restore-donation-polish.js'
html=(ROOT/'index.html').read_text()
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',html,re.I)
assert styles[-1]=='assets/css/234-v423-navigation-persistence-support.css'
css='\n'.join((ROOT/x).read_text() for x in styles)
base=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text().rstrip()
assert base.endswith('})();')
comps=['303-v418-collections-views-cover-parity','304-v419-recommendations-cover-logging-sidebar','305-v420-covers-dashboard-sidebar-fixes','306-v421-adaptive-navigation-filter','307-v422-adaptive-navigation-details-support','308-v423-navigation-restore-donation-polish']
js=base[:-len('})();')]+ '\n'.join((ROOT/'src/js/components'/f'{x}.js').read_text() for x in comps)
js+='''
window.__mf423={
 setup(style='sidebar'){
  S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));S.settings.navDockStyle=style;S.settings.sidebarCollapsed=style==='mini';
  S.view='dashboard';S.library=[];S.collections=[];S.sessions=[];S.profilePicture='';S.categories=[{id:'anime',name:'Finished Anime',enabled:true,unit:'episodes',target:3,color:'#15ae7e',icon:'🎬'}];
  document.getElementById('app').innerHTML='<aside class="sidebar"><div class="sidebar-resizer"></div><div class="brand"><div class="brand-mark"></div><span>MediaFlow</span></div><div class="nav">'+['dashboard','library','collections','order','history','stats','profile','settings','about'].map(id=>'<div class="nav-item" data-view="'+id+'"><span>'+id+'</span></div>').join('')+'</div><div class="sidebar-foot"><div class="account-menu">Profile</div><div class="level-block">Level 201</div></div></aside><main class="main"><div id="view-root"></div></main>';
  mf421Apply(true);
 },
 getMode(){return mf421Mode()},
 apply(){mf421Apply(true)},
 style(x){App.mf421SetNavStyle(x);return mf421Mode()},
 setAvatar(url){S.profilePicture=url;mf421Apply(true)},
 settingsDom(){S.view='settings';const html=V219_PAGE_RENDERERS.get('settings')({view:'settings',state:S,settings:S.settings,defaults:DEFAULT_SETTINGS,app:App,runtime:MediaFlowRuntime});document.getElementById('view-root').innerHTML=html;v219RunPageEnhancers('settings');App.v365OpenSection('v221-settings-navigation');mf421Apply(true);return {buttons:document.querySelectorAll('.mf422-nav-choice').length};},
 about(){S.view='about';return renderAbout()},
 simulateHydration(style){S.settings.navDockStyle=style;mf421Apply(true);return mf421Mode()},
 cleanup(){mf423CleanNavigation()},
 avatarMarkup(){return document.querySelector('.mf421-dock-account')?.innerHTML},
};})();'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1024,1440]:
  page=browser.new_page(viewport={'width':width,'height':800})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="v260-redesign"><div id="app"></div></body></html>')
  page.evaluate('''() => {const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k])}})}''')
  page.add_style_tag(content=css)
  page.add_script_tag(content=js)
  page.evaluate('window.__mf423.setup("sidebar")')
  for style in ('bottom','top','mini','sidebar'):
   assert page.evaluate('(x)=>window.__mf423.style(x)',style)==style
   assert page.evaluate('window.__mf423.simulateHydration("sidebar")')==style,'navigation failed to preserve saved user style'
   assert page.locator('body').evaluate('(e,x)=>e.classList.contains("mf421-"+x)',style)
   if style in ('top','bottom'):
    assert page.locator('.mf421-dock').is_visible()
    assert page.locator('.mf422-glowing-brand').count()==0
    assert page.locator('.mf422-real-logo').count()==1
    assert page.locator('.mf421-dock-progress > .mf422-level-badge').count()==1
    assert page.locator('.mf421-dock-progress > .mf422-streak-badge').count()==1
    assert page.locator('.mf421-dock-progress > svg').count()==0
    page.locator('.mf421-dock-progress').click(force=True)
    assert page.locator('.mf422-progress-popup').is_visible()
    page.keyboard.press('Escape')
   if style=='mini':assert page.locator('.sidebar').evaluate('(el)=>parseInt(getComputedStyle(el).width)')<=100
  print('PASS initial layout, saved selection, styles, dock icons, no glowing duplicates',width,flush=True)
  page.evaluate('window.__mf423.style("top")')
  page.evaluate('window.__mf423.setAvatar("https://example.com/my-profile-image.png")')
  assert page.locator('.mf421-dock-account img.mf423-dock-avatar').count()==1
  assert page.locator('.mf421-dock-account img').get_attribute('src')=='https://example.com/my-profile-image.png'
  page.evaluate('window.__mf423.setAvatar("")')
  assert page.locator('.mf421-dock-account img').count()==0
  print('PASS configured avatar and fallback',width,flush=True)
  result=page.evaluate('window.__mf423.settingsDom()')
  assert result['buttons']==4
  for btn in page.locator('.mf422-nav-choice').all():
   assert btn.locator(':scope > svg,:scope > i').count()==0
   assert btn.locator('.mf422-nav-symbol').count()==1
  print('PASS navigation settings cards sans circle arrows',flush=True)
  about=page.evaluate('window.__mf423.about()')
  from bs4 import BeautifulSoup
  soup=BeautifulSoup(about,'html.parser')
  assert soup.select_one('.mf423-support-hero')
  assert soup.select_one('.mf423-support-cta[href="https://ko-fi.com/alexgodly"]')
  assert 'Help shape what' in soup.select_one('.mf423-support-hero').get_text()
  assert not any(('Explore other apps' in x.get_text() or 'Alex Godly Apps' in x.get_text()) for x in soup.select('a'))
  assert len(soup.select('a.mf423-donate-replacement'))>=2
  print('PASS donation hero redesign, two replaced app-promotion links',flush=True)
  assert not errors,errors[:8]
  page.close()
 browser.close()
print('PASS v423 browser contract suite')
