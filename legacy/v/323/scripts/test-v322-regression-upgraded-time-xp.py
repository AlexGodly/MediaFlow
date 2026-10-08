#!/usr/bin/env python3
"""v316 browser checks; mocked time-credit RPC, no real user data writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
bundle=(R/'assets/js/mediaflow-v322.bundle.js').read_text(); pos=bundle.rfind('})();'); assert pos>0
bundle=bundle[:pos]+r'''
window.__v316={
 bootstrap(){AUTH_USER={id:'user-a',email:'a@example.com'};S.settings=S.settings||{};S.categories=[{id:'cat1',name:'Anime',enabled:true,unit:'episodes',target:4,color:'#3499ff'}];S.library=[];S.sessions=[];mf316SwitchAccount();MF316.gotLedger=true;},
 config(){return mf316TimeCfg()},
 configure(key,val){mf316Update(key,val)},
 statsHtml(){return renderStats()},
 statsVisible(){return v186EnsureControlCenter(S.settings||DEFAULT_SETTINGS).statsComponents.values.timeSpent!==false},
 statsToggle(on){v186SetStatsComponent('timeSpent',on)},
 settingsHtml(){return renderSettings()},
 total(){return mediaFlowXP()},
 mockCredit(){mf316ApplyLedger({xp_total:10,lifetime_seconds:1200,remainder_seconds:0,today_seconds:1200,today_xp:10});return mediaFlowXP()},
 switchUser(id){AUTH_USER={id,email:id+'@example.com'};return mediaFlowXP()},
 fakeHeader(view){S.view=view;document.getElementById('v260-react-host').innerHTML='<header class="v260-topbar"><div class="v260-topbar-main"><div class="v260-topbar-mark">✦</div><div class="v260-topbar-copy"><b>'+view+'</b><span>Professional media management</span></div></div></header>';mf315FixTopbar();return [document.querySelector('.v260-topbar-copy b').textContent,document.querySelector('.v260-topbar-copy span').textContent,document.querySelector('.v260-topbar-mark').innerHTML.includes('svg')];},
 mockServer(){supabase={rpc:async(name,args)=>{window.__mf316LastRpc={name,args};return {data:[{xp_total:22,lifetime_seconds:1800,remainder_seconds:0,today_seconds:1800,today_xp:22}],error:null}},from:()=>({select(){return this},eq(){return this},limit(){return Promise.resolve({data:[],error:null})}})};MF316.gotLedger=true;MF316.lastTick=0;MF316.lastInteraction=Date.now();Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});},
 async award(){MF316.gotLedger=true;MF316.lastTick=0;MF316.lastInteraction=Date.now();await mf316Tick(true);return {xp:MF316.xp,total:mediaFlowXP(),arg:window.__mf316LastRpc};},
 async usersProbe(){MF302.page='users';document.getElementById('app').innerHTML='<div id="mf312-users-results"></div>';MF316.refreshAt=Date.now();MF316.refreshRevision='';await mf316CheckUsers();return MF316.refreshRevision;}
};
''' +bundle[pos:]
css='\n'.join((R/'assets/css'/p).read_text() for p in ['00-foundation.css','127-v260-react-redesign.css','160-v302-community.css','172-v315-workspace-sidebar-community.css','173-v316-time-xp-statistics.css'])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 count=0
 for width in [1440,390,320]:
  page=browser.new_page(viewport={'width':width,'height':800});page.set_default_timeout(7000); errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content('<!doctype html><html><body><div id="app"></div><div id="v260-react-host"></div></body></html>')
  page.evaluate('''() => {let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  print('start',width,flush=True);page.add_style_tag(content=css);print('style done',flush=True);page.add_script_tag(content=bundle);print('script done',flush=True);page.evaluate('__v316.bootstrap()');print('bootstrap done',flush=True)
  print('before config',flush=True);cfg=page.evaluate('__v316.config()');print('config',cfg,flush=True);assert cfg['xpPerInterval']==5 and cfg['intervalMinutes']==10 and cfg['useStreak'] and cfg['enabled'],cfg;count+=4
  assert 'ACTIVE TIME XP' in page.evaluate('__v316.settingsHtml()');count+=1
  assert page.evaluate('__v316.statsVisible()');count+=1
  assert 'mf316-time-stat' in page.evaluate('__v316.statsHtml()');count+=1
  page.evaluate('__v316.statsToggle(false)');assert not page.evaluate('__v316.statsVisible()');count+=1
  assert 'mf316-time-stat' not in page.evaluate('__v316.statsHtml()');count+=1
  page.evaluate('__v316.statsToggle(true)');count+=1
  # Streak multiplier and interval arguments go to the single server-owned RPC.
  page.evaluate('__v316.mockServer()')
  result=page.evaluate('async()=>await __v316.award()')
  assert result['xp']==22 and result['total']==22, result;count+=2
  assert result['arg']['name']=='mf_time_xp_tick_v316' and result['arg']['args']['p_interval_seconds']==600 and result['arg']['args']['p_reward_xp']==5,result;count+=3
  page.evaluate('__v316.configure("xpPerInterval",15)');assert page.evaluate('__v316.config().xpPerInterval')==15;count+=1
  page.evaluate('__v316.configure("useStreak",false)');assert not page.evaluate('__v316.config().useStreak');count+=1
  page.evaluate('__v316.configure("useStreak",true)');count+=1
  assert page.evaluate('__v316.mockCredit()')==10;count+=1
  assert page.evaluate('__v316.switchUser("user-b")')==0;count+=1
  for key,text in [('mf302-profile','Profile'),('mf302-friends','Friends'),('mf302-inbox','Inbox')]:
   outcome=page.evaluate('(k)=>__v316.fakeHeader(k)',key)
   assert outcome[0]==text and outcome[2],(key,outcome);count+=2
  assert not errs,errs;count+=1
  print('v316',width,'px passed, assertions',count)
  page.close()
 # Test actual prebuilt React chrome page mapping, without loading external React.
 page=browser.new_page();page.set_content('<div id="v260-react-host"></div>')
 page.evaluate('''() => {window.__nodes=[];window.React={createElement:(k,pr,...child)=>typeof k==='function'?k(pr):({k,pr,child}),useState:v=>[v,()=>{}],useEffect:()=>{}};window.ReactDOM={createRoot:()=>({render:o=>window.__nodes.push(o)})};window.MediaFlowV260Bridge={getView:()=>window.__testView,getTheme:()=>"dark",syncNow:()=>{}};window.__testView='mf302-profile';}''')
 page.add_script_tag(content=(R/'assets/js/mediaflow-v316-react-ui.js').read_text());page.wait_for_timeout(450)
 js="""() => JSON.stringify(window.__nodes).includes('Manage your public profile') && JSON.stringify(window.__nodes).includes('Profile') && !JSON.stringify(window.__nodes).includes('Mf302-profile')"""
 assert page.evaluate(js),'Actual React header did not resolve profile';count+=1
 print('v316 actual React header mapping passed')
 page.close();browser.close()
 print('v316 isolated assertions passed:',count)
