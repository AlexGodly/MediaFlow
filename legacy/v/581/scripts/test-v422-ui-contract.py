#!/usr/bin/env python3
"""Browser-level v422 regression suite, real runtime closure + synthetic account.
Read-only local fixtures; no Supabase calls or cloud migrations."""
from pathlib import Path
import re,os,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/'VERSION').read_text().strip()=='422'
assert json.loads((ROOT/'src/js/runtime-order.json').read_text())[-1]=='components/307-v422-adaptive-navigation-details-support.js'
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',(ROOT/'index.html').read_text(),re.I)
assert styles[-1]=='assets/css/233-v422-navigation-details-profile-support.css'
css='\n'.join((ROOT/s).read_text() for s in styles)
base=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text().rstrip()
assert base.endswith('})();')
components=[f'{i}-{name}.js' for i,name in [(303,'v418-collections-views-cover-parity'),(304,'v419-recommendations-cover-logging-sidebar'),(305,'v420-covers-dashboard-sidebar-fixes'),(306,'v421-adaptive-navigation-filter'),(307,'v422-adaptive-navigation-details-support')]]
js=base[:-len('})();')]+ '\n'.join((ROOT/'src/js/components'/n).read_text() for n in components)
js+='''
window.__mf422={
 setup(){
  S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));S.settings.navDockStyle='mini';S.settings.sidebarCollapsed=true;
  S.view='dashboard';S.categories=[{id:'anime',name:'Finished Anime',color:'#15ae7e',icon:'🎬',unit:'episodes'}];
  S.library=[{id:'a',title:'Toaru Majutsu no Index',categoryId:'anime',coverUrl:'',status:'active',priority:'medium',progress:6,total:24,rating:8.5}];
  S.sessions=[];S.collections=[];
  document.getElementById('app').innerHTML='<aside class="sidebar"><div class="sidebar-resizer"></div><div class="brand"><div class="brand-mark"></div><span>MediaFlow</span></div><div class="nav">'+[...['dashboard','library','collections','order','history','stats','profile','settings','about'].map(id=>'<div class="nav-item" data-view="'+id+'"><span>'+id+'</span></div>')].join('')+'</div><div class="sidebar-foot"><div class="account-menu">Profile</div><div class="level-block">Level 201</div></div></aside><main class="main"><div id="view-root"></div></main>';
  mf421Apply(true);
 },
 expand(){App.v265ToggleSidebar();return {mode:mf421Mode(),width:parseFloat(getComputedStyle(document.querySelector('.sidebar')).width)};},
 shrink(){App.v265ToggleSidebar();return mf421Mode()},
 style(x){App.mf421SetNavStyle(x);return mf421Mode()},
 settingsHtml(){S.view='settings';const html=V219_PAGE_RENDERERS.get('settings')({view:'settings',state:S,settings:S.settings,defaults:DEFAULT_SETTINGS,app:App,runtime:MediaFlowRuntime});return html;},
 settingsDom(){document.getElementById('view-root').innerHTML=this.settingsHtml();v219RunPageEnhancers('settings');App.v365OpenSection('v221-settings-navigation');const controls=document.querySelector('.mf422-settings-navigation');return {found:!!controls,outer:controls?.outerHTML.slice(0,160),section:controls?.closest('.mf365-section')?.dataset.mf365Section,visible:!!controls&&!!controls.getClientRects().length,count:document.querySelectorAll('.mf422-nav-choice').length}},
 profileHtml(){S.view='profile';return renderProfile()},
 aboutHtml(){S.view='about';return renderAbout()},
 libraryList(){S.view='library';const item=S.library[0];document.getElementById('view-root').innerHTML='<div class="item-row" data-library-id="a"><span class="mf420-cover-stage mf420-library-thumb"></span><div class="item-title">Toaru Majutsu no Index</div><button class="btn">Edit</button></div>';v219RunPageEnhancers('library');},
 target(el){return mf422LibraryDetailsTarget(el);},
 popup(){S.view='dashboard';return mf422PopupOpen;}
};
})();'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1400,'height':850})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="v260-redesign"><div id="app"></div></body></html>')
 page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:(k)=>k==='mf_sidebar_width'?'270':null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})")
 page.add_style_tag(content=css)
 page.add_script_tag(content=js)
 page.evaluate('window.__mf422.setup()')
 first=page.evaluate('window.__mf422.expand()')
 assert first['mode']=='sidebar' and first['width']>=220,first
 assert page.evaluate('window.__mf422.shrink()')=='mini'
 assert page.evaluate('window.__mf422.expand()')['width']>=220
 print('PASS mini→expanded sidebar restores complete safe width twice')
 html=page.evaluate('window.__mf422.settingsHtml()')
 assert 'mf422-settings-navigation' in html and 'mf422-navigation-tabs' in html
 assert 'Navigation style' in html
 assert html.index('mf422-settings-navigation')>html.index('NAVIGATION')
 result=page.evaluate('window.__mf422.settingsDom()')
 assert result['found'] and result['count']==4 and result['visible'],result
 print('PASS visible four-style selector inside REAL Settings Center > Navigation')
 for mode in ('top','bottom'):
  assert page.evaluate('(x)=>window.__mf422.style(x)',mode)==mode
  assert page.locator('.mf421-dock').is_visible()
  assert page.locator('.mf422-real-logo').count()==1
  assert page.locator('.mf422-glowing-brand').count()==1
  page.locator('.mf421-dock-progress').click(force=True)
  assert page.locator('.mf422-progress-popup').is_visible(),mode
  assert page.locator('.mf422-xp-track').count()==1
  assert page.locator('.mf422-progression-stats').count()==1
  page.keyboard.press('Escape');assert not page.locator('.mf422-progress-popup').is_visible()
 for width in (900,1100,1400,1900):
  page.set_viewport_size({'width':width,'height':800})
  page.evaluate('window.__mf422.style("top")')
  geom=page.evaluate('''() => {const b=document.querySelector('.mf421-dock').getBoundingClientRect(),n=document.querySelector('.mf421-dock-links').getBoundingClientRect(),p=document.querySelector('.mf421-dock-account').getBoundingClientRect();return {mid:n.x+n.width/2,center:innerWidth/2,left:n.x,right:n.right,account:p.right,view:innerWidth}}''')
  print('geometry',width,geom,flush=True)
 print('PASS branded top/bottom docks, themed glowing logo, and progression popup')
 profile=page.evaluate('window.__mf422.profileHtml()')
 assert 'mf422-upload-notice' in profile and 'Choose picture — Unavailable' in profile
 assert 'type="file"' not in profile and 'use-profile-picture-url' in profile
 assert 'https://ko-fi.com/alexgodly' in profile
 about=page.evaluate('window.__mf422.aboutHtml()')
 assert 'mf422-donate-section' in about and 'https://ko-fi.com/alexgodly' in about
 print('PASS URL-only Account and voluntary Ko-fi About')
 page.evaluate('window.__mf422.libraryList()')
 assert page.locator('.item-title[role="button"]').count()==1
 assert page.locator('.mf420-cover-stage[role="button"]').count()==1
 target=page.evaluate('window.__mf422.target(document.querySelector(".item-title"))')
 assert target=='a',target
 assert page.evaluate('window.__mf422.target(document.querySelector(".mf420-cover-stage"))')=='a'
 assert page.evaluate('window.__mf422.target(document.querySelector(".btn"))') is None
 print('PASS delegated clickable title / cover; Edit remains an independent action')
 assert not errors,errors[:7]
 browser.close()
print('MediaFlow v422 runtime UI browser suite: PASS')
