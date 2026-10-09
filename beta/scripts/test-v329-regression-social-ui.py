#!/usr/bin/env python3
"""Isolated browser coverage for v320 Friends, Inbox, stats entry and Collections empty state."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
b=(R/'assets/js/mediaflow-v329.bundle.js').read_text(encoding='utf-8');pos=b.rfind('})();');assert pos>0
b=b[:pos]+r'''
window.__v320={
 init(empty=false){AUTH_USER={id:'me',email:'me@example.com'};S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));S.categories=[{id:'anime',name:'Anime',enabled:true,unit:'episodes',target:4}];S.library=[];S.sessions=[];S.xpLedger={};MF316.user=AUTH_USER.id;MF316.xp=0;S.view='dashboard';
   this.empty=empty;MF302.activeThread=null;MF320.friendsTab='following';MF320.friendsQuery={following:'',followers:'',mutuals:''};MF320.inboxQuery='';
   window.__calls=[];supabase={from:()=>({insert:async row=>{window.__calls.push(['message-insert',row]);return {error:null}},update:()=>({eq:()=>({eq:async()=>({error:null})})}),upsert:async()=>({error:null})}),rpc:async(name,args)=>{window.__calls.push([name,args]);return {data:'t1',error:null}},channel:()=>({on(){return this},subscribe(){return this}}),removeChannel:()=>{}};
   mfQuery=async(name)=>{
    const users=this.empty?[]:[{user_id:'u1',username:'aurora',display_name:'Aurora',bio:'Loves movies',is_public:true,avatar_url:''},{user_id:'u2',username:'niko',display_name:'Niko',bio:'Anime collector',is_public:true,avatar_url:''},{user_id:'u3',username:'sora',display_name:'Sora',bio:'Comics reader',is_public:true,avatar_url:''}];
    const rows={mf_public_profiles:users,mf_profile_follows:[],mf_dm_threads:this.empty?[]:[{id:'t1',user_a:'me',user_b:'u1',created_at:'2026-10-08T12:00:00Z'},{id:'t2',user_a:'me',user_b:'u2',created_at:'2026-10-08T14:00:00Z'}],mf_dm_messages:this.empty?[]:[{id:'m1',sender_id:'u1',body:'Hello!',created_at:'2026-10-08T15:00:00Z'},{id:'m2',sender_id:'me',body:'Hi Aurora',created_at:'2026-10-08T15:01:00Z'}],mf_dm_preferences:[]};
    if(name==='mf_profile_follows')return [];
    return rows[name]||[];
   };
   this.mockFriends=async()=>{mfQuery=async(name,fields,filters)=>{if(name==='mf_profile_follows')return filters[0][0]==='follower_id'?[{followed_id:'u1'},{followed_id:'u2'}]:[{follower_id:'u1'},{follower_id:'u3'}];if(name==='mf_public_profiles')return [{user_id:'u1',username:'aurora',display_name:'Aurora',bio:'Loves movies',is_public:true},{user_id:'u2',username:'niko',display_name:'Niko',bio:'Anime collector',is_public:true},{user_id:'u3',username:'sora',display_name:'Sora',bio:'Comics reader',is_public:true}];return [];}; S.view='mf302-friends';await mfFriends();};
 },
 async friendsEmpty(){S.view='mf302-friends';await mfFriends();},
 async inbox(){S.view='mf302-inbox';await mfInbox();},
 saved(){MF310.savedUser=AUTH_USER.id;MF310.saved=[];return mf310WorkspaceSection();},
 statsHtml(){return renderStats();},
 setStatsFrom(source){S.view=source;mf320PreviousView=source;const sc=document.querySelector('#app .main');sc.scrollTop=620;window.scrollTo(0,250);App.setView('stats');return {main:sc.scrollTop,document:document.scrollingElement.scrollTop};},
 switchStats(){App.setView('dashboard');App.setView('stats');}
};
'''+b[pos:]
styles='\n'.join((R/p).read_text(encoding='utf-8') for p in ['assets/css/00-foundation.css','assets/css/160-v302-community.css','assets/css/165-v308-community-theme-parity.css','assets/css/167-v310-community-collections.css','assets/css/170-v313-community-workspace-polish.css','assets/css/175-v318-community-freshness-statistics.css','assets/css/176-v319-community-single-refresh-icon.css','assets/css/177-v320-social-friends-inbox-collections.css'])
allchecks=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,768,390,320]:
  pg=browser.new_page(viewport={'width':width,'height':900});pg.set_default_timeout(9000)
  errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.set_content('<!doctype html><html><body style="--text:#172332;--panel:#f6f8fb;--panel-raised:#eaf0f5;--border:#bfccd6;--flow:#347aa7;--text-dim:#617082"><div id="app"><div class="main" style="height:700px;overflow:auto"><div id="view-root"></div></div></div><div id="mf302-root"></div></body></html>')
  pg.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  pg.add_style_tag(content=styles);pg.add_script_tag(content=b);pg.evaluate('__v320.init()');pg.evaluate("() => {document.body.classList.remove('mf302-public-active');document.getElementById('app').innerHTML='<div class=main style=\"height:700px;overflow:auto\"><div id=view-root></div></div>';document.getElementById('mf302-root').style.display='none'}")
  pg.evaluate('async()=>await __v320.mockFriends()')
  if width in [1440,390]:pg.screenshot(path=f'/mnt/data/v320-friends-{width}.png')
  tabs=pg.locator('[data-mf320-friends-tab]');assert tabs.count()==3;allchecks+=1
  assert tabs.all_text_contents()==['Following2','Followers2','Mutuals1'];allchecks+=1
  assert pg.locator('.mf320-friend-card').count()==2;allchecks+=1
  pg.locator('#mf320-friends-search').fill('niko');assert pg.locator('.mf320-friend-card').count()==1;allchecks+=1
  tabs.nth(1).click();assert pg.locator('.mf320-friend-card').count()==2;allchecks+=1
  pg.locator('#mf320-friends-search').fill('sora');assert pg.locator('.mf320-friend-card').count()==1;allchecks+=1
  tabs.nth(0).click();assert pg.locator('#mf320-friends-search').input_value()=='niko';allchecks+=1
  tabs.nth(2).click();assert pg.locator('.mf320-friend-card').count()==1;allchecks+=1
  tabs.nth(2).focus();pg.keyboard.press('Home');assert tabs.nth(0).get_attribute('aria-selected')=='true';allchecks+=1
  pg.keyboard.press('End');assert tabs.nth(2).get_attribute('aria-selected')=='true';allchecks+=1
  assert 'Aurora' in pg.locator('.mf320-friend-card').first.inner_text();allchecks+=1
  assert pg.locator('.mf320-friend-card .mf320-btn').count()==2;allchecks+=1
  assert pg.evaluate("() => getComputedStyle(document.querySelector('.mf320-surface')).backgroundColor")=='rgb(246, 248, 251)';allchecks+=1
  assert pg.evaluate("() => document.documentElement.scrollWidth <= innerWidth + 1");allchecks+=1
  pg.evaluate('__v320.init(false)')
  pg.evaluate('async()=>await __v320.inbox()')
  if width in [1440,390]:pg.screenshot(path=f'/mnt/data/v320-inbox-{width}.png')
  assert pg.locator('.mf320-thread').count()==2;allchecks+=1
  assert pg.locator('#mf320-chat-form').is_hidden();allchecks+=1
  pg.locator('.mf320-thread-search input').fill('niko');assert pg.locator('.mf320-thread').count()==1;allchecks+=1
  pg.locator('.mf320-thread-search input').fill('');pg.locator('.mf320-thread').first.click();pg.wait_for_timeout(80)
  assert pg.locator('.mf320-message').count()==2;allchecks+=1
  assert pg.locator('#mf320-chat-form').is_visible();allchecks+=1
  if width <=760:
   assert pg.locator('.mf320-thread-sidebar').is_hidden();allchecks+=1
   pg.locator('.mf320-mobile-back').click();assert pg.locator('.mf320-thread-sidebar').is_visible();allchecks+=1
   pg.locator('.mf320-thread').first.click();pg.wait_for_timeout(75)
  pg.locator('#mf302-message-input').fill('A fresh message');pg.locator('#mf320-chat-form button[type="submit"]').click();pg.wait_for_timeout(120)
  assert any(c[0]=='message-insert' and c[1]['body']=='A fresh message' for c in pg.evaluate('window.__calls'));allchecks+=1
  assert pg.locator('#mf302-message-input').input_value()=='';allchecks+=1
  assert pg.evaluate("() => document.documentElement.scrollWidth <= innerWidth + 1");allchecks+=1
  raw=pg.evaluate('__v320.saved()');assert 'mf320-collection-empty' in raw and 'No saved Community Collections' in raw;allchecks+=1
  pg.locator('#view-root').evaluate('(el,html)=>el.innerHTML=html',raw)
  if width==1440:pg.screenshot(path='/mnt/data/v320-collections-empty-1440.png')
  assert pg.locator('.mf320-collection-empty').count()==1;allchecks+=1
  bg=pg.evaluate("() => getComputedStyle(document.querySelector('.mf320-collection-empty')).backgroundColor");assert bg=='rgb(246, 248, 251)',bg;allchecks+=1
  assert pg.evaluate("() => document.documentElement.scrollWidth <= innerWidth + 1");allchecks+=1
  pg.evaluate("() => {document.body.style.setProperty('--panel','#233045');document.body.style.setProperty('--text','#eef3fb');document.body.style.setProperty('--flow','#a989f4')}")
  assert pg.evaluate("() => getComputedStyle(document.querySelector('.mf320-collection-empty')).backgroundColor")=='rgb(35, 48, 69)';allchecks+=1
  # Stats page enter needs to clear reused scrolling scroller; account data is configured by init.
  values=pg.evaluate('''() => {document.querySelector('.main').innerHTML='<div id="view-root"></div><div style="height:2500px"></div>';return __v320.setStatsFrom('dashboard')}''')
  assert values['main']==0,values;allchecks+=1
  pg.wait_for_timeout(140)
  assert pg.locator('.main').evaluate('(e)=>e.scrollTop')==0;allchecks+=1
  pg.evaluate('__v320.init(true)');pg.evaluate('async()=>await __v320.friendsEmpty()')
  assert pg.locator('.mf320-empty').count()==1 and 'No following yet' in pg.locator('.mf320-empty').inner_text();allchecks+=1
  pg.evaluate('async()=>await __v320.inbox()')
  assert pg.locator('.mf320-thread').count()==0 and pg.locator('.mf320-threads-empty').count()==1;allchecks+=1
  assert not errors,errors;allchecks+=1
  print('v320 browser',width,'px: PASS; cumulative assertions',allchecks,flush=True)
  pg.close()
 browser.close()
print('v320 total assertions passed:',allchecks)
