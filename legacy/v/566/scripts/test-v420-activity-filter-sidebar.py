#!/usr/bin/env python3
"""v420: actual Dashboard source, native Logging membership field and real sidebar
layout, with CSS ordered exactly as in the production index."""
from pathlib import Path
import os,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
styles=re.findall(r'<link[^>]*href="(assets/css/[^"?]+\.css)"[^>]*>',(ROOT/'index.html').read_text(),re.I)
css='\n'.join((ROOT/s).read_text() for s in styles)
assert styles[-1].endswith('231-v420-actual-cover-layout-repairs.css')
# Real Dashboard source function, executed in the existing app bundle closure.
dashboard=(ROOT/'src/js/pages/dashboard/011-view-dashboard.js').read_text()
start=dashboard.index('function renderDashboard(){')
end=dashboard.index('\nfunction renderReasonDetail(',start)
renderer=dashboard[start:end].replace('function renderDashboard(){','renderDashboard=function(){',1)
base=(ROOT/'assets/js/mediaflow-v417.bundle.js').read_text().rstrip()
assert base.endswith('})();')
js=base[:-len('})();')]+ (ROOT/'src/js/components/303-v418-collections-views-cover-parity.js').read_text()+'\n'+(ROOT/'src/js/components/304-v419-recommendations-cover-logging-sidebar.js').read_text()+'\n'+ (ROOT/'src/js/components/305-v420-covers-dashboard-sidebar-fixes.js').read_text()+'\n'+renderer+'\n'
js+='''
window.__mf420Panels={
 dashboard(){
  S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));S.settings.tasksPerDay=8;S.settings.dailyMinutes=300;
  S.library=[];S.categories=[];S.sessions=[];S.sessionActive=false;S.currentTask=null;
  const html=renderDashboard();if(!document.querySelector('#view-root'))document.body.insertAdjacentHTML('beforeend','<main id=\"view-root\"></main>');document.querySelector('#view-root').innerHTML=html;return html;
 },
 filter(){if(!document.querySelector('#view-root'))document.body.insertAdjacentHTML('beforeend','<main id=\"view-root\"></main>');document.querySelector('#view-root').innerHTML='<div class="log-form"><details class="mf383-logging-library" open><div class="mf383-logging-body"><div class="v224-log-tools">'+v406MembershipField('logging')+'</div></div></details></div>';return true},
 sidebar(){if(!document.querySelector('#view-root'))document.body.insertAdjacentHTML('beforeend','<main id=\"view-root\"></main>');document.querySelector('#view-root').innerHTML='<div class="sidebar"><div class="brand">MediaFlow</div><nav class="nav">'+Array.from({length:11},(_,i)=>'<div class="nav-item">Menu Item '+(i+1)+'</div>').join('')+'</nav><div class="sidebar-foot mf419-sidebar-hub"><div class="account-menu">Profile / Logout</div><div class="level-block"><div class="level-head">Level 201</div><div class="xp-line">10,948,175 XP</div><div class="xp-track">Progress</div></div><div class="k">Day streak</div><div class="v">32 days</div><div class="mf385-cloud-state">Sync pending</div></div><div class="sidebar-resizer"></div></div>';return true}
};
})();'''
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_BIN','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':900})
 errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.set_content('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="v260-redesign"><div id="app"><main id="view-root"></main></div></body></html>')
 page.evaluate("() => Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{}}})")
 page.add_style_tag(content=css);page.add_script_tag(content=js)
 # Dashboard (real new renderer, zero data): ensure there is a themed empty bar and 3 readable stat cards.
 out=page.evaluate('window.__mf420Panels.dashboard()')
 assert 'mf420-activity-cards' in out
 assert page.locator('.mf420-activity-card').count()==3
 assert page.locator('.mf420-stat-track').count()==2
 assert page.locator('.mf420-stat-numbers strong').count()==3
 assert page.locator('.mf420-streak-card .mf420-stat-track').count()==0
 for width in (320,390,820,1280):
  page.set_viewport_size({'width':width,'height':900})
  result=page.evaluate('''() => [...document.querySelectorAll('.mf420-activity-card')].map(x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,w:r.width,h:r.height}})''')
  assert all(x['right']<=width+2 and x['left']>=-2 and x['w']>150 for x in result),(width,result)
 page.screenshot(path=str(ROOT/'docs/v420-dashboard-metrics-390.png'),full_page=True)
 print('PASS real Dashboard renderer and 320-1280px metrics')
 # Native selector: text must be vertically centered with no neighboring overlap.
 page.evaluate('window.__mf420Panels.filter()')
 for value in ('available','added','all'):
  page.locator('.mf406-membership select').select_option(value)
  for width in (320,390,820,1280):
   page.set_viewport_size({'width':width,'height':850})
   r=page.evaluate('''() => {const l=document.querySelector('.mf406-membership'),s=l.querySelector('select'),t=l.querySelector('span');const a=s.getBoundingClientRect(),b=t.getBoundingClientRect(),z=l.getBoundingClientRect();return {selY:a.y,labelEnd:b.bottom,selH:a.height,selW:a.width,containerW:z.width,appearance:getComputedStyle(s).appearance,font:getComputedStyle(s).fontSize}}''')
   assert r['selY']>r['labelEnd']-1,(value,width,r)
   assert r['selH']>=40 and r['selW']>=95,(value,width,r)
 print('PASS Logging Not added / Already added filter geometry')
 # Short desktop viewport: the final footer must be reachable via sidebar scrolling.
 page.set_viewport_size({'width':1280,'height':390});page.evaluate('window.__mf420Panels.sidebar()')
 geom=page.evaluate('''() => {const s=document.querySelector('.sidebar');const f=s.querySelector('.mf385-cloud-state');let box=f.getBoundingClientRect();return {scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,canScroll:getComputedStyle(s).overflowY,visible:box.bottom<=innerHeight}}''')
 assert geom['scrollHeight']>geom['clientHeight']+100,geom
 assert geom['canScroll']=='auto',geom
 page.evaluate('document.querySelector(".sidebar").scrollTop=10000')
 page.wait_for_timeout(90)
 reached=page.evaluate('''() => {const s=document.querySelector('.sidebar'),f=s.querySelector('.mf385-cloud-state'),r=f.getBoundingClientRect(),a=s.getBoundingClientRect();return {scrollTop:s.scrollTop,reached:r.bottom<=a.bottom+2&&r.top>=a.top-2}}''')
 assert reached['scrollTop']>0 and reached['reached'],(geom,reached)
 assert not errors,errors[:5]
 browser.close()
print('PASS v420 filter, short-height sidebar, Dashboard metrics')
