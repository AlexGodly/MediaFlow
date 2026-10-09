#!/usr/bin/env python3
"""Isolated v319 parity tests using real MediaFlow JS, mocked Supabase RPC."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
b=(R/'assets/js/mediaflow-v319.bundle.js').read_text(encoding='utf-8');p=b.rfind('})();');assert p>0
b=b[:p]+r'''
window.__v319={
 init(){AUTH_USER={id:'v319-test',email:'v319@example.test'};S.settings=JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
 S.categories=[{id:'anime',name:'Anime',enabled:true,unit:'episodes',target:4}];S.library=[];S.sessions=[];S.xpLedger={};
 MF316.user=AUTH_USER.id;MF316.xp=0;
 },
 stats(){const el=document.createElement('main');el.innerHTML=renderStats();const names=[...el.querySelectorAll('.profile-stat-hero,.stats-level-card,.mf316-time-stat,.card')].filter(e=>!(e.closest('.stats-level-card')&&e!==e.closest('.stats-level-card'))).map(e=>e.classList.contains('profile-stat-hero')?'Profile':e.classList.contains('stats-level-card')?'Leveling':e.classList.contains('mf316-time-stat')?'Time Spent':e.querySelector('.section-label')?.textContent?.trim()||'Other');return names;},
 mock(){window.__calls=[];AUTH_USER=null;supabase={rpc:async(name,args)=>{window.__calls.push({name,args});
 if(name==='mf_ratings_leaderboard_v312')return {data:[],error:null};
 if(name==='mf_community_title_count_v313')return {data:20,error:null};
 if(name==='mf_browse_titles_v309')return {data:[{provider:'mal',provider_id:'1',title:'Test',users_count:4,statuses:{},covers:[]}],error:null};
 if(name==='mf_public_collections_v310')return {data:[{id:'col',user_id:'owner',title:'Test Collection',username:'maker',items:[],is_public:true}],error:null};
 if(name==='mf_users_directory_v312')return {data:[{user_id:'u',username:'maker',display_name:'Maker',is_public:true,total_matches:1}],error:null};
 return {data:[],error:null};}};MF302.query='';MF302.catalogOffset=0;MF302.renderId=0;},
 async show(which){MF302.page=which;if(which==='browse')await mf309RenderBrowse();if(which==='collections')await mf310RenderDirectory(document.querySelector('#mf302-content'),++MF302.renderId);if(which==='users')await mf312RenderUsers();if(which==='ratings')await mf311Load();},
 details(which){const bar=document.querySelector('.mf318-freshness'),head=document.querySelector('.mf302-heading'),container=bar?.parentElement;
  const expected={browse:'#mf309-body',collections:'#mf310-directory-results',users:'#mf312-users-results'};
  const after=container?.querySelector(expected[which]);return {exists:!!bar,parentId:container?.id||container?.className,headingHasButton:!!head?.querySelector('[data-mf317-refresh]'),count:document.querySelectorAll(`[data-mf317-refresh="${which}"]`).length,
   classes:bar?.className,insideHeading:!!bar?.closest('.mf302-heading'),nextSibling:bar?.nextElementSibling===after, text:bar?.textContent, button:bar?.querySelector('button')?.textContent?.trim(),status:bar?.querySelector('[data-mf318-updated]')?.textContent,styles:bar?{display:getComputedStyle(bar).display,borderRadius:getComputedStyle(bar).borderRadius,buttonWidth:bar.querySelector('button').getBoundingClientRect().width,barWidth:bar.getBoundingClientRect().width}:null};},
 async refresh(which){const before=window.__calls.length;await mf317RefreshNow(which,true);return {calls:window.__calls.slice(before).map(c=>c.name),text:document.querySelector('[data-mf318-updated]')?.textContent,count:document.querySelectorAll(`[data-mf317-refresh="${which}"]`).length};},
 async rerender(which){if(which==='browse')await mf309RenderBrowse();if(which==='collections')await mf310RenderDirectory(document.querySelector('#mf302-content'),++MF302.renderId);if(which==='users')await mf312RenderUsers();if(which==='ratings')await mf311Load();return this.details(which);},
 icons(which){const selector=which==='ratings'?'.mf312-ratings-freshness button[data-mf311-action="retry"]':`button[data-mf317-refresh="${which}"]`;
 const el=document.querySelector(selector);return {count:document.querySelectorAll(selector).length,svgs:el?.querySelectorAll(':scope > svg').length,auto:el?.querySelectorAll(':scope > .v225-btn-icon').length,text:el?.textContent.trim(),style:el?getComputedStyle(el).display:null,className:el?.className};},
 semPass(){v226RefreshSemanticButtonIcons(document);},
 setTimeHidden(){S.settings.statsComponents=S.settings.statsComponents||{};const o=v186EnsureControlCenter(S.settings).statsComponents.values;o.timeSpent=false;},
};
'''+b[p:]
css='\n'.join(p.read_text(encoding='utf-8') for p in [R/'assets/css/00-foundation.css',R/'assets/css/169-v312-community-ranking.css',R/'assets/css/170-v313-community-workspace-polish.css',R/'assets/css/174-v317-progression-refresh.css',R/'assets/css/175-v318-community-freshness-statistics.css',R/'assets/css/176-v319-community-single-refresh-icon.css'])
total=0
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (1440,768,390,320):
  page=browser.new_page(viewport={'width':width,'height':850});page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!doctype html><html><body><div id="app"></div><div id="view-root"></div><div id="mf302-root"><main id="mf302-content" style="max-width:1200px;margin:auto;padding:20px"></main></div></body></html>')
  page.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  page.add_style_tag(content=css);page.add_script_tag(content=b);page.evaluate('__v319.init()')
  st=page.evaluate('__v319.stats()');assert all(k in st for k in ['Profile','Leveling','Time Spent','LIFETIME ACHIEVEMENTS']),st
  assert st.index('Profile') < st.index('Leveling') < st.index('Time Spent') < st.index('LIFETIME ACHIEVEMENTS'),st; total+=5
  page.evaluate('__v319.setTimeHidden()')
  other=page.evaluate('__v319.stats()');assert 'Time Spent' not in other and other.index('Leveling')<other.index('LIFETIME ACHIEVEMENTS'),other;total+=2
  page.evaluate('__v319.mock()')
  for section,rpc in [('browse','mf_browse_titles_v309'),('collections','mf_public_collections_v310'),('users','mf_users_directory_v312')]:
   page.evaluate('async s=>await __v319.show(s)',section)
   d=page.evaluate('s=>__v319.details(s)',section)
   assert d['exists'] and d['count']==1 and not d['headingHasButton'] and not d['insideHeading'] and d['nextSibling'],(section,d);total+=5
   assert d['button']=='Refresh now' and d['styles']['display']=='flex' and 'Updated' in d['status'],(section,d);total+=3
   assert d['styles']['barWidth']>d['styles']['buttonWidth'],(section,d);total+=1
   page.wait_for_timeout(120)
   icons=page.evaluate('s=>__v319.icons(s)',section)
   assert icons['count']==1 and icons['svgs']==1 and icons['auto']==0 and icons['text']=='Refresh now',(section,icons);total+=4
   page.evaluate('__v319.semPass()'); page.evaluate('__v319.semPass()')
   icons=page.evaluate('s=>__v319.icons(s)',section)
   assert icons['svgs']==1 and icons['auto']==0 and icons['count']==1,(section,icons);total+=3
   x=page.evaluate('async s=>await __v319.refresh(s)',section)
   assert rpc in x['calls'] and 'Updated' in x['text'] and x['count']==1,(section,x);total+=3
   d=page.evaluate('async s=>await __v319.rerender(s)',section)
   assert d['count']==1 and d['nextSibling'] and not d['headingHasButton'],(section,d);total+=3
   page.wait_for_timeout(120)
   icons=page.evaluate('s=>__v319.icons(s)',section)
   assert icons['count']==1 and icons['svgs']==1 and icons['auto']==0,(section,icons);total+=3
  page.evaluate('async()=>await __v319.show("ratings")')
  page.wait_for_timeout(120)
  rating=page.evaluate('()=>__v319.icons("ratings")')
  assert rating['count']==1 and rating['svgs']==1 and rating['auto']==0 and rating['text']=='Refresh now',rating;total+=4
  page.evaluate('__v319.semPass()');page.evaluate('__v319.semPass()')
  rating=page.evaluate('()=>__v319.icons("ratings")')
  assert rating['count']==1 and rating['svgs']==1 and rating['auto']==0,rating;total+=3
  before=page.evaluate('window.__calls.length')
  page.locator('.mf312-ratings-freshness button[data-mf311-action="retry"]').click()
  page.wait_for_timeout(180)
  recent=page.evaluate('(before)=>window.__calls.slice(before).map(x=>x.name)',before)
  assert 'mf_ratings_leaderboard_v312' in recent,recent;total+=1
  rating=page.evaluate('()=>__v319.icons("ratings")')
  assert rating['svgs']==1 and rating['auto']==0,rating;total+=2
  assert not errors,errors;total+=1
  print('v319 browser',width,'px: PASS (',total,'cumulative assertions)',flush=True)
  page.close()
 browser.close()
print('v319 TOTAL',total,'assertions passed')
