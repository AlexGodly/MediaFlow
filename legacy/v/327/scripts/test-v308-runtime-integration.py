#!/usr/bin/env python3
"""v308 full bundled runtime in an isolated mocked browser; not live cloud auth."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v308.bundle.js').read_text(encoding='utf-8')
assert bundle.rstrip().endswith('})();')
end=bundle.rfind('})();')
bundle=bundle[:end]+'''\nwindow.__mf308Integration={
 loginAsDemo:function(theme){AUTH_USER={id:'v308-demouser'};S.settings.theme=theme;applyTheme(theme);MF302.page='home';mfShowPortal();},
 signOutDemo:function(){AUTH_USER=null;MF302.page='home';mfShowPortal();},
 themeChange:function(theme){S.settings.theme=theme;applyTheme(theme);},
 settings:function(){return {theme:S.settings?.theme,auth:!!AUTH_USER}}
};\n'''+bundle[end:]
css='\n'.join((ROOT/'assets/css'/f).read_text(encoding='utf-8') for f in [
 '00-foundation.css','160-v302-community.css','161-v303-community-navigation.css','162-v304-public-statistics.css',
 '163-v305-community-navigation-auth.css','164-v306-community-click-reliability.css','165-v308-community-theme-parity.css'])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 checks=0
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':800})
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content('<!doctype html><html><head></head><body><div id="app">Loading…</div></body></html>')
  page.evaluate('''() => {
     const memory=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{
       getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k),clear:()=>memory.clear(),key:i=>[...memory.keys()][i]||null,get length(){return memory.size}
     }});
     window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),
       onAuthStateChange:()=>({data:{subscription:{unsubscribe:()=>{}}}})},
       from:()=>({select:()=>({eq(){return this},limit:async()=>({data:[],error:null})})}),rpc:async()=>({data:[],error:null})})};
   }''')
  page.add_style_tag(content=css)
  page.add_script_tag(content=bundle)
  page.wait_for_timeout(160)
  assert page.locator('#mf302-root .mf302-portal').count()==1, ('initial portal',width)
  assert page.evaluate('MediaFlowCommunityTheme.getState().mode')=='guest'
  guest_color=page.evaluate("getComputedStyle(document.getElementById('mf302-root')).backgroundColor")
  assert guest_color=='rgb(12, 16, 26)',(width,guest_color)
  checks+=1
  page.evaluate("__mf308Integration.loginAsDemo('light')")
  result=page.evaluate('''() => ({mode:MediaFlowCommunityTheme.getState().mode,
   bg:getComputedStyle(document.getElementById('mf302-root')).backgroundColor,
   card:getComputedStyle(document.querySelector('.mf302-tile')).backgroundColor})''')
  assert result=={'mode':'workspace','bg':'rgb(245, 246, 248)','card':'rgb(255, 255, 255)'},(width,result)
  checks+=1
  page.evaluate("__mf308Integration.themeChange('amoled')")
  assert page.evaluate("getComputedStyle(document.getElementById('mf302-root')).backgroundColor")=='rgb(0, 0, 0)'
  checks+=1
  page.evaluate('__mf308Integration.signOutDemo()')
  assert page.evaluate("getComputedStyle(document.getElementById('mf302-root')).backgroundColor")=='rgb(12, 16, 26)'
  checks+=1
  assert not errors,(width,errors)
  print(f'PASS: {width}px full MediaFlow bundle — guest, sign-in theme, live update, sign-out reset')
  page.close()
 browser.close()
 print(f'PASS: {checks} full-runtime theme integration assertions; no JavaScript page errors')
