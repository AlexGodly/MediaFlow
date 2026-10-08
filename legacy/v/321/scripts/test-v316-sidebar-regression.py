#!/usr/bin/env python3
"""v315 isolated full-runtime navigation tests, no real account or service mutations."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
bundle=(R/'assets/js/mediaflow-v316.bundle.js').read_text()
pos=bundle.rfind('})();')
assert pos>0
bundle=bundle[:pos]+r'''
window.__v315={
 bootstrap(){
  AUTH_USER={id:'v315-test-user',email:'test@example.com'};
  S.view='dashboard';S.settings=S.settings||{};
  S.categories=[{id:'cat1',name:'Anime',enabled:true}]; S.library=[]; S.sessions=[];
  mfHidePortal();renderShell();render();mf315Decorate();
 },
 simulateTop(view){
  S.view=view;
  document.querySelector('#app .main').insertAdjacentHTML('afterbegin','<header class="v260-topbar"><div class="v260-topbar-mark">X</div><div class="v260-topbar-copy"><b>mf302-profile</b><span>professional media management</span></div></header>');
  mf315FixTopbar();
 },
 settings(){return v161NavigationSettingsHtml();},
 settingsView(){S.view="settings";render();return !!document.querySelector(".mf315-community-settings")},
 mobile(){return renderMobileTabs();},
 collapse(){S.settings.sidebarCollapsed=true;document.body.classList.add("mf265-sidebar-collapsed");mf315Decorate();},
 snapshot(){return mf315Prefs()},
 visit(view){MF302.workspaceView(view)},
};
''' +bundle[pos:]
css='\n'.join((R/'assets/css'/p).read_text() for p in ['00-foundation.css','127-v260-react-redesign.css','131-v265-ux-stability-sidebar-balance.css','160-v302-community.css','172-v315-workspace-sidebar-community.css'])
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 total=0
 for width in [1440,1000,850]:
  pg=b.new_page(viewport={'width':width,'height':640});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.set_content('<!doctype html><html><body class="v260-redesign"><div id="app"></div></body></html>')
  pg.evaluate('''() => {let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},rpc:async()=>({data:[],error:null}),from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})})})};}''')
  pg.add_style_tag(content=css);pg.add_script_tag(content=bundle)
  pg.evaluate('__v315.bootstrap()')
  pg.locator('.mf315-community-nav').wait_for(timeout=7000)
  assert pg.locator('.mf315-community-nav [data-mf315-public=""]').count()==1;(total:=total+1)
  assert pg.locator('.mf315-community-nav [data-mf315-workspace="mf302-inbox"]').count()==1;(total:=total+1)
  assert pg.locator('.sidebar .sidebar-foot .level-block').count()==1;(total:=total+1)
  assert pg.evaluate('''() => {const s=document.querySelector('.sidebar'),n=s.querySelector('.nav'),f=s.querySelector('.sidebar-foot');return n.scrollHeight>n.clientHeight&&s.getBoundingClientRect().bottom<=innerHeight+1&&f.getBoundingClientRect().bottom<=innerHeight+1}'''), 'fixed footer / scroll area failed';(total:=total+1)
  pg.locator('.mf315-community-nav [data-mf315-toggle="childrenExpanded"]').click();assert pg.locator('[data-mf315-public="browse"]:visible').count()==1;(total:=total+1)
  pg.locator('.mf315-community-nav [data-mf315-toggle="expanded"]').click();assert pg.locator('.mf315-group-body:visible').count()==0;(total:=total+1)
  pg.locator('.mf315-community-nav [data-mf315-toggle="expanded"]').click();assert pg.locator('.mf315-group-body:visible').count()==1;(total:=total+1)
  pg.evaluate('App.mf315Hide("friends",false)');assert pg.locator('.mf315-community-nav [data-mf315-workspace="mf302-friends"]').count()==0;(total:=total+1)
  pg.evaluate('App.mf315Move("ratings",-1)');assert pg.evaluate('__v315.snapshot().order.indexOf("ratings")<__v315.snapshot().order.indexOf("collections")');(total:=total+1)
  assert 'Community navigation' in pg.evaluate('__v315.settings()');(total:=total+1)
  pg.evaluate('App.mf315Toggle("visible")');assert pg.locator('.mf315-community-nav').count()==0;(total:=total+1)
  pg.evaluate('App.mf315Toggle("visible")');assert pg.locator('.mf315-community-nav').count()==1;(total:=total+1)
  pg.evaluate('__v315.collapse()')
  assert pg.evaluate('''() => getComputedStyle(document.querySelector('.mf315-menu-icon')).display!=='none' ''');(total:=total+1)
  assert pg.locator('.mf315-min-level:visible').count()==1;(total:=total+1)
  for view,name in [('mf302-profile','Profile'),('mf302-friends','Friends'),('mf302-inbox','Inbox')]:
   pg.evaluate('(v)=>__v315.simulateTop(v)',view)
   assert pg.locator('.v260-topbar-copy b').first.inner_text()==name,(view,pg.locator('.v260-topbar-copy b').all_inner_texts());(total:=total+1)
   assert pg.locator('.v260-topbar-mark.mf315-topbar-icon svg').count()>0;(total:=total+1)
  assert pg.evaluate('__v315.settingsView()'),(width,'Navigation Settings section not rendered');total+=1
  mobile=pg.evaluate("__v315.mobile()")
  assert "mf315-mobile-nav" in mobile and "mf302-profile" in mobile, (width, mobile[-1300:]);total+=1
  assert "data-mf315-public=\"browse\"" in mobile or "data-mf315-public=\'browse\'" in mobile, (width, mobile[-1800:]);total+=1
  assert not errs,errs;total+=1
  print(f'{width}px passed, running assertions {total}')
  pg.close()
 for width in (390,320):
  pg=b.new_page(viewport={'width':width,'height':760});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.set_content('<!doctype html><html><body class="v260-redesign"><div id="app"></div></body></html>')
  pg.evaluate("() => {let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},rpc:async()=>({data:[],error:null}),from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})})})};}")
  pg.add_style_tag(content=css);pg.add_script_tag(content=bundle)
  pg.evaluate('__v315.bootstrap()')
  assert pg.locator('#mobile-more-menu .mf315-mobile-nav').count()==1,(width,'Mobile Community More');total+=1
  pg.evaluate('document.getElementById("mobile-more-menu").classList.remove("hide")')
  pg.locator('.mf315-mobile-expand').click(force=True)
  assert pg.locator('.mf315-mobile-children:not([hidden]) [data-mf315-public="browse"]').count()==1;total+=1
  pg.evaluate('App.mf315Hide("users",false)')
  assert pg.locator('.mf315-mobile-nav [data-mf315-public="users"]').count()==0;total+=1
  pg.evaluate('App.mf315Toggle("visible")')
  assert pg.locator('.mf315-mobile-nav').count()==0;total+=1
  pg.evaluate('App.mf315Toggle("visible")')
  assert pg.locator('.mf315-mobile-nav').count()==1;total+=1
  assert not errs,errs;total+=1
  print(width,'px mobile More passed:',total)
  pg.close()
 print('v316 sidebar regressions passed:',total);b.close()
