#!/usr/bin/env python3
"""MediaFlow v322: sidebar identity opens signed-in user's public Community profile, never Account."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
b=(R/'assets/js/mediaflow-v322.bundle.js').read_text(encoding='utf-8')
pos=b.rfind('})();'); assert pos>0
b=b[:pos]+r'''
window.__mf322test={
  setup(){
    AUTH_USER={id:'u-me',email:'user@example.test'};
    S.view='dashboard';
    v161VisibleNavItems=()=>[]; renderMobileTabs=()=>'';
    renderAccountAvatar=()=>'<span class="stub-avatar" aria-hidden="true">A</span>';
    renderLevelBlock=()=>'';getDisplayName=()=> 'Alex';
    computeDayStreak=()=>0;v149StreakMultiplier=()=>1;
    renderView=()=>{};renderModal=()=>{};
    window.__mf322state={go:[],edit:[],toast:[],queries:0,logout:0,profile:null,fail:false};
    mfMyProfile=async()=>{window.__mf322state.queries++;if(window.__mf322state.fail)throw new Error('Backend offline');return window.__mf322state.profile;};
    mfGo=(username)=>{window.__mf322state.go.push(username);};
    mfWorkspaceView=(v)=>{window.__mf322state.edit.push(v);S.view=v;};
    showToast=(msg)=>{window.__mf322state.toast.push(msg);};
    window.MediaFlowAuth.logout=()=>window.__mf322state.logout++;
  },
  paint(){renderShell();},
  profile(p){window.__mf322state.profile=p;window.__mf322state.fail=false;},
  fail(){window.__mf322state.fail=true;},
  account(){App.openProfile();},
  view(){return S.view;},
  get(){return window.__mf322state;}
};
'''+b[pos:]
checks=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,768,390,320]:
  pg=browser.new_page(viewport={'width':width,'height':900});pg.set_default_timeout(7000)
  errors=[];pg.on('pageerror',lambda e: errors.append(str(e)))
  pg.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
  pg.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  pg.add_script_tag(content=b);pg.evaluate('__mf322test.setup()');pg.evaluate('__mf322test.paint()')
  assert pg.locator('.account-menu .account-avatar-btn').count()==1;checks+=1
  assert pg.locator('.account-menu .account-profile-btn').count()==1;checks+=1
  assert pg.locator('.account-menu .account-avatar-btn').get_attribute('onclick')=='App.openSidebarPublicProfile()';checks+=1
  assert pg.locator('.account-menu .account-profile-btn').get_attribute('onclick')=='App.openSidebarPublicProfile()';checks+=1
  assert pg.locator('.account-menu .account-profile-btn').get_attribute('title')=='View my public profile';checks+=1
  assert pg.locator('.account-menu button[onclick="window.MediaFlowAuth.logout()"] ').count()==1;checks+=1
  pg.evaluate("__mf322test.profile({user_id:'u-me',username:'AlexGodly',is_public:true})")
  pg.locator('.account-menu .account-avatar-btn').evaluate('(el)=>el.click()');pg.wait_for_timeout(30)
  d=pg.evaluate('__mf322test.get()');assert d['go']==['alexgodly'] and d['edit']==[] and d['queries']==1,d;checks+=1
  pg.locator('.account-menu .account-profile-btn').evaluate('(el)=>el.click()');pg.wait_for_timeout(30)
  assert pg.evaluate("__mf322test.get().go.length") == 2;checks+=1
  pg.evaluate("__mf322test.profile({user_id:'u-me',username:'alexgodly',is_public:false})")
  pg.locator('.account-menu .account-avatar-btn').evaluate('(el)=>el.click()');pg.wait_for_timeout(30)
  assert pg.evaluate("__mf322test.get().edit.at(-1)") == 'mf302-profile';checks+=1
  assert 'Enable and save' in pg.evaluate("__mf322test.get().toast.at(-1)");checks+=1
  assert pg.evaluate("__mf322test.get().go.length") == 2;checks+=1
  pg.evaluate('__mf322test.profile(null)')
  pg.locator('.account-menu .account-profile-btn').evaluate('(el)=>el.click()');pg.wait_for_timeout(30)
  assert pg.evaluate("__mf322test.get().edit.at(-1)") == 'mf302-profile';checks+=1
  pg.evaluate('__mf322test.fail()')
  pg.locator('.account-menu .account-avatar-btn').evaluate('(el)=>el.click()');pg.wait_for_timeout(30)
  assert 'Could not open' in pg.evaluate("__mf322test.get().toast.at(-1)");checks+=1
  assert pg.evaluate("__mf322test.get().go.length") == 2;checks+=1
  pg.evaluate('__mf322test.account()')
  assert pg.evaluate('__mf322test.view()')=='profile';checks+=1
  pg.locator('.account-menu button[onclick="window.MediaFlowAuth.logout()"] ').evaluate('(el)=>el.click()')
  assert pg.evaluate('__mf322test.get().logout')==1;checks+=1
  pg.evaluate('__mf322test.paint()');pg.evaluate("__mf322test.profile({user_id:'u-me',username:'seconduser',is_public:true})")
  pg.locator('.account-menu .account-profile-btn').evaluate('(el)=>el.click()');pg.wait_for_timeout(30)
  assert pg.evaluate("__mf322test.get().go.at(-1)")=='seconduser';checks+=1
  assert not errors,errors;checks+=1
  print('width',width,'passed')
 browser.close()
print('v322 dedicated browser assertions:',checks,'PASS')
