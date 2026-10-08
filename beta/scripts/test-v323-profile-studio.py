from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1];b=(R/'assets/js/mediaflow-v323.bundle.js').read_text();i=b.rfind('})();');assert i>0
b=b[:i]+r'''
window.__v323={setup(){
 const p={user_id:'my-user',username:'alexgodly',display_name:'Alex Godly',bio:'Watching anime and reading books.',avatar_url:'https://example.org/avatar.png',is_public:true,xp_level:6,xp_total:2150,show_library:true,profile_v323:{tabs:[{id:'library',visible:true},{id:'collections',visible:true},{id:'order',visible:true},{id:'old',visible:true},{id:'history',visible:true},{id:'statistics',visible:true}],background:'https://example.org/cover.jpg',avatar:'https://example.org/avatar.png',socials:[{name:'GitHub',url:'https://github.com/alexgodly'}],discord:['alexgodly'],favorites:[{id:'a',title:'One Piece',cover:''}]}};
 window.__v323data={profile:p,writes:[],entries:[{title:'One Piece',status:'active',progress:30,total:100,category:'Anime',rating:9}],errors:[]};
 mfRoutePath=()=> 'alexgodly'; mfMyProfile=async()=>__v323data.profile;
 mfQuery=async(t)=>t==='mf_public_profiles'?[__v323data.profile]:[];
 mf313ProfileURL=(s)=>'https://example.org/MediaFlow/'+s;
 S.categories=[{id:'anime',name:'Anime'}];S.library=[{id:'a',title:'One Piece',categoryId:'anime',status:'active',progress:30,total:100}]; S.sessions=[{id:'s',timestamp:Date.now(),title:'One Piece',minutes:24,actualAmount:1}]; S.orderPlan={titleIds:['a']};S.oldSystem={balances:{anime:20},rules:[],transactions:[]};S.collections=[{id:'c1',title:'Weekend collection',titleIds:['a']}];
 supabase={from(t){const p={table:t,filters:[]};const o={select(_s,options){p.options=_s;return o},eq(k,v){p.filters.push([k,v]);return o},ilike(k,v){return o},order(){return o},range(a,b){return Promise.resolve(__v323.mock(p))},limit(){return Promise.resolve(__v323.mock(p))},maybeSingle(){return Promise.resolve(__v323.single(p))},upsert(data){__v323data.writes.push({table:t,data});return Promise.resolve({error:null})},update(data){__v323data.writes.push({table:t,data});return o},delete(){return o},gte(){return Promise.resolve({error:null})},then(resolve){return Promise.resolve({error:null,data:[]}).then(resolve)}};return o}};
 AUTH_USER=null;MF302.page='profile';MF302.renderId=0;
},mock(p){if(['entry_id','event_id'].includes(p.options))return {data:[],error:null};if(p.table==='mf_public_library')return {data:__v323data.entries,count:1,error:null};if(p.table==='mf_public_history')return {data:[{title:'One Piece',category:'Anime',amount:1,minutes:24}],count:1,error:null};if(p.table==='mf_public_collections')return {data:[{user_id:'my-user',id:'c1',title:'Weekend collection',description:'A test collection',items:[{title:'One Piece'}],is_public:true}],error:null};if(p.table==='mf_public_showcase_v323'){const section=p.filters.find(x=>x[0]==='section')?.[1];const items=section==='categories'?[{name:'Anime',id:'anime'}]:section==='order'?[{title:'One Piece',progress:30,total:100}]:section==='old'?[{balances:{anime:20}}]:[];return {data:[{page:0,items}],error:null};}return {data:[],error:null}},single(p){if(p.table==='mf_public_statistics')return {data:null,error:null};if(p.table==='mf_public_showcase_v323')return {data:{items:[{name:'Anime',id:'anime'}]},error:null};return {data:null,error:null}},render(){return mf323PublicRender()},auth(){AUTH_USER={id:'my-user'}},editor(){S.view='mf302-profile';return mf323Editor()}}
'''+b[i:]
checks=0
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w in (1440,768,390,320):
  pg=browser.new_page(viewport={'width':w,'height':900});pg.set_default_timeout(8000);errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.set_content('<!doctype html><html><body><div id="app"></div><div id="view-root"></div></body></html>')
  pg.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};}''')
  pg.add_script_tag(content=b);pg.add_style_tag(path=str(R/'assets/css/179-v323-public-profile-showcase.css'))
  pg.evaluate('__v323.setup()');pg.evaluate('__v323.render()');pg.wait_for_timeout(200)
  def check(cond,msg):
   global checks
   assert cond, msg;checks+=1
  check(pg.locator('.mf323-public').count()==1, 'profile absent '+pg.locator('#mf302-content').first.inner_text())
  check(pg.locator('.mf323-tabs button').count()==6,'tabs')
  check(pg.locator('.mf323-avatar').count()==1,'avatar')
  check(pg.locator('.mf323-social').count()==1,'social')
  check(pg.locator('.mf323-favorites article').count()==1,'favorite')
  check(pg.locator('.mf323-banner h1').inner_text()=='Alex Godly','name')
  check(pg.locator('#mf323-cats .mf323-tag').count()==1,'cats')
  check(pg.locator('.mf323-title').count()==1,'library '+pg.locator('#mf323-tab-body').inner_text()[:300])
  check(pg.locator('.mf323-public').get_attribute('data-mode')=='profile','guest theme')
  for tab,selector in [('collections','.mf323-collection'),('order','.mf323-title'),('old','.mf323-old-grid'),('history','.mf323-history'),('statistics','#mf323-stats')]:
   pg.evaluate('(tab)=>MF323.tab(tab)',tab);pg.wait_for_timeout(130)
   check(pg.locator(selector).count()>0,tab+' '+pg.locator('#mf323-tab-body').inner_text()[:350])
  pg.evaluate('__v323.auth()');pg.evaluate('__v323.render()');pg.wait_for_timeout(180)
  check(pg.locator('.mf323-segment').count()==1,'signed-in theme switch')
  pg.evaluate("MF323.themeTo('profile')");check(pg.locator('.mf323-public').get_attribute('data-mode')=='profile','profile theme')
  pg.evaluate('__v323.editor()');pg.wait_for_timeout(180)
  check(pg.locator('.mf323-editor').count()==1,'editor')
  check(pg.locator('.mf323-tab-setting').count()==6,'editor tabs')
  pg.evaluate('MF323.addSocial()');check(pg.locator('.mf323-social-editor').count()==2,'dynamic social')
  pg.evaluate('MF323.addDiscord()');check(pg.locator('.mf323-discord-editor').count()==2,'dynamic discord')
  pg.locator('input[aria-label="Search favorite titles"]').fill('One');pg.wait_for_timeout(100)
  check(pg.locator('.mf323-search-results button').count()==0,'favorite already selected')
  check(not errors,'browser errors: '+str(errors))
  pg.evaluate("__v323data.profile.profile_v323.tabs.find(x=>x.id==='statistics').visible=false; MF323.editor.tabs.find(x=>x.id==='statistics').visible=false")
  pg.evaluate("MF323.save({preventDefault(){},target:document.getElementById('mf323-profile-form')})")
  pg.wait_for_timeout(190)
  saved=pg.evaluate('__v323data.writes.map(x=>x.table)')
  check('mf_public_profiles' in saved, 'profile not saved '+str(saved))
  check('mf_public_showcase_v323' in saved, 'no showcase writes '+str(saved))
  check('mf_public_library' in saved, 'no library writes '+str(saved))
  check('mf_public_history' in saved, 'no history writes '+str(saved))
  check('mf_public_collections' in saved, 'no collection writes '+str(saved))
  print('width',w,'passed')
  if w==1440:
   pg.evaluate('__v323.render()');pg.wait_for_timeout(150);pg.screenshot(path=str(R/'v323-profile-preview.png'),full_page=True)
   pg.evaluate('__v323.editor()');pg.wait_for_timeout(150);pg.screenshot(path=str(R/'v323-editor-preview.png'),full_page=True)
  pg.close()
 browser.close()
print('v323 dedicated browser assertions:',checks,'PASS')
