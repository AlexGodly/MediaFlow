#!/usr/bin/env python3
"""v321 real-browser checks for semantic social tab icons and first-paint Collections UI."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
b=(R/'assets/js/mediaflow-v326.bundle.js').read_text(encoding='utf-8')
pos=b.rfind('})();'); assert pos>0
b=b[:pos]+r'''
window.__test321={
 setup(){
  AUTH_USER={id:'me',email:'me@example.com'};
  S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); S.library=[]; S.sessions=[]; S.xpLedger={};
  S.view='mf302-friends';
  mfQuery=async(name,fields,filters)=>{
   if(name==='mf_profile_follows')return filters[0][0]==='follower_id'?[{followed_id:'u1'}]:[{follower_id:'u1'}];
   if(name==='mf_public_profiles')return [{user_id:'u1',username:'aurora',display_name:'Aurora',bio:'Anime',is_public:true}];
   return [];
  };
 },
 async friends(){await mfFriends();},
 loading(){MF310.savedUser='other';return mf310WorkspaceSection();},
 empty(){MF310.savedUser=AUTH_USER.id;MF310.saved=[];return mf310WorkspaceSection();},
 enhance(){v225EnhanceButtonIcons(document);document.querySelectorAll('.mf320-tab').forEach(v226RefreshSemanticButtonIcon);}
};
'''+b[pos:]
styles='\n'.join((R/p).read_text(encoding='utf-8') for p in ['assets/css/00-foundation.css','assets/css/160-v302-community.css','assets/css/165-v308-community-theme-parity.css','assets/css/167-v310-community-collections.css','assets/css/170-v313-community-workspace-polish.css','assets/css/177-v320-social-friends-inbox-collections.css','assets/css/178-v321-social-tabs-collections-first-paint.css'])
checks=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,768,390,320]:
  pg=browser.new_page(viewport={'width':width,'height':900});pg.set_default_timeout(8000)
  errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.set_content('<!doctype html><html><body style="--text:#172332;--panel:#f6f8fb;--panel-raised:#eaf0f5;--border:#bfccd6;--flow:#347aa7;--text-dim:#617082"><div id="app"><div class="main"><div id="view-root"></div></div></div><div id="mf302-root"></div></body></html>')
  pg.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  pg.add_style_tag(content=styles);pg.add_script_tag(content=b);pg.evaluate('__test321.setup()');pg.evaluate("() => {document.body.classList.remove('mf302-public-active');document.getElementById('mf302-root').style.display='none'}")
  pg.evaluate('async()=>await __test321.friends()')
  data=pg.evaluate('''() => [...document.querySelectorAll('.mf320-tab')].map(b=>({key:b.dataset.mf320FriendsTab,svg:b.querySelectorAll('.mf321-tab-icon svg').length,legacy:b.querySelectorAll('.v225-btn-icon').length,path:b.querySelector('.mf321-tab-icon svg').innerHTML,label:b.textContent.trim()}))''')
  assert [x['key'] for x in data]==['following','followers','mutuals'];checks+=1
  assert all(x['svg']==1 and x['legacy']==0 for x in data),data;checks+=1
  assert len(set(x['path'] for x in data))==3,data;checks+=1
  assert [x['label'] for x in data]==['Following1','Followers1','Mutuals1'],data;checks+=1
  pg.evaluate('__test321.enhance()');pg.wait_for_timeout(90)
  assert pg.evaluate("() => [...document.querySelectorAll('.mf320-tab')].every(b=>b.querySelectorAll('svg').length===1 && b.querySelectorAll('.v225-btn-icon').length===0)");checks+=1
  pg.locator('[data-mf320-friends-tab="followers"]').click()
  assert pg.locator('[data-mf320-friends-tab="followers"]').get_attribute('aria-selected')=='true';checks+=1
  assert pg.evaluate('() => document.documentElement.scrollWidth <= innerWidth + 1');checks+=1
  # First render happens while network still loading saved Collections: must never show old dark .mf302-empty.
  pg.evaluate("() => {document.getElementById('view-root').innerHTML=__test321.loading()}")
  assert pg.locator('.mf321-collection-loading.mf320-collection-empty').count()==1;checks+=1
  assert pg.locator('.mf302-empty').count()==0;checks+=1
  assert 'Loading saved Community Collections' in pg.locator('.mf320-collection-empty').inner_text();checks+=1
  assert pg.evaluate("() => getComputedStyle(document.querySelector('.mf320-collection-empty')).backgroundColor")=='rgb(246, 248, 251)';checks+=1
  # The actual loaded empty result uses the SAME surface, avoids a dark frame.
  pg.evaluate("() => {document.getElementById('view-root').innerHTML=__test321.empty()}")
  assert pg.locator('.mf320-collection-empty').count()==1;checks+=1
  assert pg.locator('.mf302-empty').count()==0;checks+=1
  assert pg.locator('.mf320-collection-empty button').count()==1;checks+=1
  assert pg.evaluate("() => getComputedStyle(document.querySelector('.mf320-collection-empty')).backgroundColor")=='rgb(246, 248, 251)';checks+=1
  pg.evaluate("() => {document.body.style.setProperty('--panel','#223145');document.body.style.setProperty('--flow','#77b4da')}")
  assert pg.evaluate("() => getComputedStyle(document.querySelector('.mf320-collection-empty')).backgroundColor")=='rgb(34, 49, 69)';checks+=1
  assert not errors,errors;checks+=1
  print(f'v321 {width}px semantic tabs + zero-flash loading: PASS ({checks} cumulative assertions)',flush=True)
  pg.close()
 browser.close()
print('v321 dedicated assertions passed:',checks)
