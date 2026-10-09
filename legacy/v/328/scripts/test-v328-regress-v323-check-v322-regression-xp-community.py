#!/usr/bin/env python3
"""MediaFlow v317 isolated browser regression: no real account or database writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
b=(R/'assets/js/mediaflow-v328.bundle.js').read_text(); pos=b.rfind('})();'); assert pos>0
b=b[:pos]+r'''
window.__v317={
 setup(){AUTH_USER={id:'v317-test',email:'v317@example.test'};
   S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));S.settings.leveling.unitXP.episodes=20;
   S.categories=[{id:'anime',name:'Anime',enabled:true,unit:'episodes',target:4,color:'#3499ff'}];
   S.sessions=[];S.library=[];S.xpLedger={};MF316.user=AUTH_USER.id;MF316.xp=0;MF317.primed=false;mf317PrimeLibrary(true);},
 config(){return {episode:DEFAULT_SETTINGS.leveling.unitXP.episodes,start:DEFAULT_SETTINGS.leveling.titleStartXP};},
 settings(){const h=mf317SettingsPage();const el=document.createElement('div');el.innerHTML=h;const t=el.querySelector('input[onchange*="libraryAdditionXP"]');
   const card=t?.closest('.card');return {timeSettings:!!card?.querySelector('.mf316-xp-settings'),count:el.querySelectorAll('.mf316-xp-settings').length,
     startSettings:!!card?.querySelector('input[onchange*="titleStartXP"]'),timeWithinProgression:!!card?.querySelector('input[onchange*="intervalMinutes"]'),
     page:!!el.querySelector('.v221-settings-page'),defaultEpisode:el.querySelector('input[onchange*="updateLevelingUnit(\'episodes\'"]')?.value};},
 titleSetup(){S.library=[{id:'a',title:'One',categoryId:'anime',status:'planned',progress:0,total:12,priority:'medium'}];S.xpLedger={};mf317PrimeLibrary(true);v149MarkStreakDirty();return mediaFlowXP();},
 start(){S.library[0].status='active';const got=mf317CaptureStarts();v149MarkStreakDirty();return {got,earned:S.xpLedger.titleStarts.a,total:mediaFlowXP(),breakdown:v120XPBreakdown()};},
 restart(){S.library[0].status='paused';mf317CaptureStarts();S.library[0].status='active';const again=mf317CaptureStarts();v149MarkStreakDirty();return {again,earned:S.xpLedger.titleStarts.a};},
 info(){return mediaFlowLevelInfo();},
 addTime(){MF316.xp=12;return {total:mediaFlowXP(),breakdown:v120XPBreakdown()};},
 statsOrder(){const h=renderStats(),el=document.createElement('div');el.innerHTML=h;const children=[...el.querySelectorAll('.profile-stat-hero,.mf316-time-stat,.card')];
  const labels=children.map(x=>x.classList.contains('profile-stat-hero')?'PROFILE':x.classList.contains('mf316-time-stat')?'TIME':x.querySelector('.section-label')?.textContent?.trim()?.toUpperCase()||'');
  return labels.slice(0,10);},
 mocking(){window.__calls=[];AUTH_USER=null;supabase={rpc:async(name,args)=>{window.__calls.push(name);if(name==='mf_community_title_count_v313')return {data:10,error:null};
    if(name==='mf_browse_titles_v309')return {data:[{provider:'mal',provider_id:'1',title:'Test media',users_count:5,average_rating:8,ratings_count:1,statuses:{},covers:[]}],error:null};
    if(name==='mf_public_collections_v310')return {data:[{id:'col',user_id:'owner',title:'Test Collection',username:'maker',items:[],is_public:true}],error:null};
    if(name==='mf_users_directory_v312')return {data:[{user_id:'u',username:'maker',display_name:'Maker',is_public:true,total_matches:1}],error:null};
    return {data:[],error:null};}};MF302.renderId=0;MF302.query='';MF302.catalogOffset=0;},
 async browse(){MF302.page='browse';await mf309RenderBrowse();return document.querySelectorAll('[data-mf317-refresh="browse"]').length;},
 async collections(){MF302.page='collections';const rid=++MF302.renderId;await mf310RenderDirectory(document.getElementById('mf302-content'),rid);return document.querySelectorAll('[data-mf317-refresh="collections"]').length;},
 async users(){MF302.page='users';await mf312RenderUsers();return document.querySelectorAll('[data-mf317-refresh="users"]').length;},
 async refresh(section){const before=window.__calls.length;await mf317RefreshNow(section,true);return window.__calls.slice(before);},
};
'''+b[pos:]
css='\n'.join(p.read_text() for p in [R/'assets/css/00-foundation.css',R/'assets/css/173-v316-time-xp-statistics.css',R/'assets/css/174-v317-progression-refresh.css'])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 total=0
 for width in (1440,390,320):
  page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(9000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!doctype html><html><body><div id="app"></div><div id="view-root"></div><main id="mf302-content"></main></body></html>')
  page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  page.add_style_tag(content=css);page.add_script_tag(content=b)
  page.evaluate('__v317.setup()')
  c=page.evaluate('__v317.config()');assert c=={'episode':20,'start':50},c;total+=2
  x=page.evaluate('__v317.settings()');assert x['page'] and x['timeSettings'] and x['timeWithinProgression'] and x['startSettings'] and x['count']==1,x;total+=5
  base=page.evaluate('__v317.titleSetup()')
  start=page.evaluate('__v317.start()');assert start['got'] and start['earned']==50 and start['total']==base+50,start;total+=3
  repeat=page.evaluate('__v317.restart()');assert not repeat['again'] and repeat['earned']==50,repeat;total+=2
  x=page.evaluate('__v317.addTime()');assert x['total']==start['total']+12 and x['breakdown']['total']==x['total'] and x['breakdown']['timeXP']==12,x;total+=3
  order=page.evaluate('__v317.statsOrder()');assert order.index('PROFILE')<order.index('TIME')<order.index('LIFETIME ACHIEVEMENTS'),order;total+=1
  page.evaluate('__v317.mocking()')
  assert page.evaluate('async()=>await __v317.browse()')==1;total+=1
  assert 'mf_browse_titles_v309' in page.evaluate('async()=>await __v317.refresh("browse")');total+=1
  assert page.evaluate('async()=>await __v317.collections()')==1;total+=1
  assert 'mf_public_collections_v310' in page.evaluate('async()=>await __v317.refresh("collections")');total+=1
  assert page.evaluate('async()=>await __v317.users()')==1;total+=1
  assert 'mf_users_directory_v312' in page.evaluate('async()=>await __v317.refresh("users")');total+=1
  assert not errors,errors;total+=1
  print('v317 browser',width,'px: passed 23 assertions')
  page.close()
 browser.close()
 print('v317 browser: passed',total,'assertions')
