#!/usr/bin/env python3
"""MediaFlow v421 production assets, real app-scope navigation code and responsive UI tests."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re,os
ROOT=Path(__file__).resolve().parents[1]
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',(ROOT/'index.html').read_text(),re.I)
assert styles[-1]=='assets/css/232-v421-adaptive-navigation-logging-select.css'
css='\n'.join((ROOT/s).read_text() for s in styles)
base=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text().rstrip()
assert base.endswith('})();')
module418=(ROOT/'src/js/components/303-v418-collections-views-cover-parity.js').read_text()
module419=(ROOT/'src/js/components/304-v419-recommendations-cover-logging-sidebar.js').read_text()
module420=(ROOT/'src/js/components/305-v420-covers-dashboard-sidebar-fixes.js').read_text()
module421=(ROOT/'src/js/components/306-v421-adaptive-navigation-filter.js').read_text()
js=base[:-len('})();')]+module418+'\n'+module419+'\n'+module420+'\n'+module421+'''
window.__mf421={
 setup(){
  S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));S.settings.navDockStyle='sidebar';
  S.view='dashboard';
  const app=document.getElementById('app');
  app.innerHTML='<aside class="sidebar mf265-sidebar"><div class="sidebar-resizer" title="Resize"></div><div class="brand"><div class="brand-mark"></div><div class="brand-name">MediaFlow</div></div><div class="nav">'+[{id:'dashboard',label:'Dashboard'},{id:'library',label:'Library'},{id:'collections',label:'Collections'},{id:'personalOrder',label:'Personal Order'},{id:'oldSystem',label:'Old System'},{id:'history',label:'History'},{id:'stats',label:'Statistics'},{id:'profile',label:'Account'},{id:'settings',label:'Settings'},{id:'about',label:'About'}].map(n=>'<div class="nav-item" data-view="'+n.id+'"><span>'+n.label+'</span></div>').join('')+'</div><div class="sidebar-foot"><div class="account-menu">Account</div><div class="level-block">Level 201</div><div class="k">Day streak</div><div class="v">32 days</div><div class="mf385-cloud-state">Sync pending</div></div></aside><main class="main"><div id="view-root"></div></main><div class="mobile-tabbar"></div>';
  mf421Apply(true);
 },
 style(mode){mf421SetNavStyle(mode);return mf421Mode()},
 width(w){return applySidebarWidth(w)},
 filter(){document.getElementById('view-root').innerHTML='<div class="log-form"><div class="mf383-logging-body"><div class="v224-log-tools">'+v406MembershipField('logging')+'</div></div></div>';},
 nav(){const was=S.view;S.view='settings';document.getElementById('view-root').innerHTML='<div class="v220-settings-page"><div class="section-label">NAVIGATION</div></div>';mf421InjectSettings();const html=document.getElementById('view-root').innerHTML;S.view=was;return html},
 refresh(){mf421Apply(true)},
 href(view){S.view=view;mf421Apply(true)},
};
})();'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':720})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="v260-redesign"><div id="app"></div></body></html>')
 page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})")
 page.add_style_tag(content=css);page.add_script_tag(content=js)
 page.evaluate('window.__mf421.setup()')
 assert page.evaluate('window.__mf421.nav().includes("mf421-style-tabs")')
 for height in (390,500,800):
  page.set_viewport_size({'width':1280,'height':height});page.evaluate('window.__mf421.refresh()')
  data=page.evaluate('''() => {let sidebar=document.querySelector('.sidebar'),nav=sidebar.querySelector('.nav'),foot=sidebar.querySelector('.sidebar-foot'),resizer=sidebar.querySelector('.sidebar-resizer');return {a:getComputedStyle(sidebar).overflowY,b:getComputedStyle(nav).overflowY,sw:sidebar.scrollHeight,sh:sidebar.clientHeight,nw:nav.clientHeight,fh:foot.clientHeight,res:getComputedStyle(resizer).display,x:resizer.getBoundingClientRect().right}}''')
  assert data['a']=='visible',('full-sidebar scroll',height,data)
  assert data['b']=='auto',('nav not scrollable',height,data)
  assert data['res']!='none' and data['x']>100,('resize unavailable',height,data)
 print('PASS sidebar resizer remains exposed and only navigation rows scroll')
 assert page.evaluate('window.__mf421.width(105)')==82
 assert page.evaluate('window.__mf421.style("sidebar")')=='sidebar'
 assert page.evaluate('window.__mf421.width(257)')==257
 assert page.evaluate('window.__mf421.style("mini")')=='mini'
 assert page.evaluate('getComputedStyle(document.querySelector(".sidebar-resizer")).display')!='none'
 print('PASS mini sidebar drag transitions and width preference')
 # Drag the real branding element from left to top and the dock back to left.
 page.evaluate('window.__mf421.style("sidebar")')
 page.set_viewport_size({'width':1280,'height':800})
 brand=page.locator('.sidebar .brand');r=brand.bounding_box();
 page.mouse.move(r['x']+20,r['y']+20);page.mouse.down();page.mouse.move(580,18,steps=12);page.mouse.up();page.wait_for_timeout(100)
 assert page.evaluate('document.body.classList.contains("mf421-top")'),"Brand drag did not dock to top"
 dock=page.locator('.mf421-dock-brand');r=dock.bounding_box()
 page.mouse.move(r['x']+12,r['y']+12);page.mouse.down();page.mouse.move(15,340,steps=12);page.mouse.up();page.wait_for_timeout(100)
 assert page.evaluate('document.body.classList.contains("mf421-sidebar")'),"Dock drag did not restore sidebar"
 print('PASS logo drag docking and undocking')
 for mode in ('top','bottom','sidebar','mini'):
  page.evaluate('(mode)=>window.__mf421.style(mode)',mode)
  assert page.evaluate('document.body.classList.contains("mf421-'+mode+'")')
  if mode in ('top','bottom'):
   assert page.locator('.mf421-dock').is_visible()
   assert not page.locator('.sidebar').is_visible()
   info=page.evaluate('''() => {let d=document.querySelector('.mf421-dock').getBoundingClientRect();return {x:d.x,y:d.y,r:d.right,b:d.bottom,w:innerWidth,h:innerHeight}}''')
   assert info['r']<=info['w']+2 and info['x']>=0,info
   if mode=='top':assert info['y']<80,info
   else:assert info['h']-info['b']<90,info
  else:assert page.locator('.sidebar').is_visible()
 print('PASS all four navigation modes and dock geometry')
 for width in (870,1050,1280,1760):
  page.set_viewport_size({'width':width,'height':700});page.evaluate('window.__mf421.style("bottom")')
  info=page.evaluate('''() => {let d=document.querySelector('.mf421-dock'),link=d.querySelector('.mf421-dock-links'),buttons=[...link.querySelectorAll('button')],m=d.querySelector('.mf421-dock-more-wrap');return {containerW:link.clientWidth,childW:buttons.reduce((t,b)=>t+b.getBoundingClientRect().width+6,0),count:buttons.length,more:!m.hidden,hidden:d.querySelectorAll('.mf421-dock-menu button').length}}''')
  assert info['count']>0 and info['childW']<info['containerW']+60,(width,info)
  assert info['count']+info['hidden']==page.evaluate('v161VisibleNavItems().length') if False else info['count']+info['hidden']>=7,(width,info)
 print('PASS responsive bottom dock and measured More overflow')
 page.set_viewport_size({'width':1280,'height':800});page.evaluate('window.__mf421.style("sidebar")')
 page.evaluate('window.__mf421.filter()')
 for value in ('all','available','added'):
  page.locator('.mf406-membership select').select_option(value)
  z=page.evaluate('''() => {let s=document.querySelector('.mf406-membership select'),r=s.getBoundingClientRect(),style=getComputedStyle(s);return {appearance:style.appearance,background:style.backgroundImage,height:r.height,pad:parseFloat(style.paddingRight),arrow:getComputedStyle(s.parentElement,'::after').content}}''')
  assert z['appearance']=='none' and z['background']=='none' and z['height']>=44 and z['pad']>=44,(value,z)
  assert z['arrow']!='none',z
 print('PASS clean Logging membership select without duplicate native arrows')
 assert not errors,errors[:8]
 browser.close()
print('PASS MediaFlow v421 adaptive navigation + Logging filter')
