#!/usr/bin/env python3
"""v314 full runtime smoke with simulated public data; no account writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
old=(R/'scripts/test-v313-community-regression.py').read_text()
fixture=old.split("bundle=bundle[:pos]+r'''",1)[1].split("''' + bundle[pos:]",1)[0]
bundle=(R/'assets/js/mediaflow-v317.bundle.js').read_text()
pos=bundle.rfind('})();')
extra=r'''
window.__v314={
 testSource(){const keys=['mal','simkl','anilist','tmdb','imdb','trakt','kitsu','isbn'];return keys.map(k=>MF314.resolveProvider({[k]:k==='imdb'?'tt12345':'12345'}));},
 prepare(){__t312.setMock();__t312.profiles=[
  {user_id:'1',username:'silver_test',display_name:'Silver Media',bio:'Public profile',avatar_url:'',xp_level:42,xp_total:1000,show_xp:true,xp_default_verified:true,library_titles:40,usage_seconds:4300,show_usage_time:true},
  {user_id:'2',username:'gold_test',display_name:'Gold Media Champion',bio:'Public profile',avatar_url:'',xp_level:99,xp_total:9999,show_xp:true,xp_default_verified:true,library_titles:150,usage_seconds:6900,show_usage_time:true},
  {user_id:'3',username:'bronze_test',display_name:'Bronze Profile',bio:'Public profile',avatar_url:'',xp_level:20,xp_total:900,show_xp:true,xp_default_verified:false,library_titles:8,usage_seconds:100,show_usage_time:true},
  {user_id:'4',username:'fourth_test',display_name:'Fourth User',bio:'Public profile',avatar_url:'',xp_level:11,xp_total:90,show_xp:true,xp_default_verified:false,library_titles:3,usage_seconds:10,show_usage_time:true}
 ];
 const prev=supabase.rpc;
 supabase.rpc=async(name,args)=>{
  if(name==='mf_users_directory_v312')return {data:[...__t312.profiles].sort((a,b)=>b.xp_level-a.xp_level).map((u,i)=>({...u,rank:i+1,total_matches:4})),error:null};
  if(name==='mf_community_title_count_v313')return {data:200,error:null};
  if(name==='mf_browse_titles_v309')return {data:[{provider:'kitsu',provider_id:'12345',title:'Kitsu Anime',users_count:2,average_rating:9,ratings_count:2,covers:[],statuses:{},metadata:{year:2025}},{provider:'isbn',provider_id:'978013',title:'ISBN Book',users_count:1,average_rating:null,ratings_count:0,covers:[],statuses:{},metadata:{}}],error:null};
  if(name==='mf_ratings_leaderboard_v312')return {data:[{rank:1,provider:'imdb',provider_id:'tt12345',title:'IMDb Movie',users_count:4,ratings_count:3,average_rating:9.5,covers:[],metadata:{},total_ranked:1,match_count:1}],error:null};
  return prev(name,args);
 };
 },
 users(){MF302.page='users';MF302.query='';MF302.catalogOffset=0;mfShowPortal();},
 browse(){MF302.page='browse';MF302.query='';MF302.catalogOffset=0;mfShowPortal();},
 ratings(){MF302.page='ratings';MF302.query='';MF302.catalogOffset=0;mfShowPortal();},
 library(){S.view='library';S.categories=[{id:'anime',name:'Anime',enabled:true}];S.library=[];mfHidePortal();renderShell();render();mf314LibraryBrowseButton();},
 publish:async function(){
    AUTH_USER={id:'00000000-0000-4000-8000-000000000001'};
    S.categories=[{id:'anime',name:'Anime',enabled:true}];
    const sources=['mal','simkl','anilist','tmdb','imdb','trakt','kitsu','isbn'];
    S.library=sources.map((k,i)=>({id:'media'+i,title:'Public '+k,externalIds:{[k]:'id'+i},categoryId:'anime',status:'planned',coverUrl:'',rating:8,total:12}));
    mfMyProfile=async()=>({is_public:true}); window.confirm=()=>true;
    const captures=[];supabase.from=table=>({upsert:async rows=>{captures.push({table,rows});return {error:null}}});
    await MF302.publish('library');
    return captures.flatMap(x=>x.rows.map(r=>[r.provider,r.provider_id]));
  }
};
'''
bundle=bundle[:pos]+r"\n".replace('\\n','\n')+fixture+'\n'+extra+bundle[pos:]
css='\n'.join((R/'assets/css'/f).read_text() for f in ['00-foundation.css','160-v302-community.css','161-v303-community-navigation.css','163-v305-community-navigation-auth.css','164-v306-community-click-reliability.css','165-v308-community-theme-parity.css','166-v309-browse-views-quick-add.css','167-v310-community-collections.css','168-v311-ratings-leaderboard.css','169-v312-community-ranking.css','170-v313-community-workspace-polish.css','171-v314-provider-rankings-polish.css'])
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 count=0
 for width in [1440,390,320]:
  page=b.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<!DOCTYPE html><html><head></head><body><div id="app">Loading</div></body></html>')
  page.evaluate('''() => {let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},rpc:async()=>({data:[],error:null}),from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})})})};}''')
  page.add_style_tag(content=css);page.add_script_tag(content=bundle)
  providers=page.evaluate('__v314.testSource()')
  assert [x['provider'] for x in providers]==['mal','simkl','anilist','tmdb','imdb','trakt','kitsu','isbn'];count+=1
  assert page.evaluate('MF314.resolveProvider({mal:null,kitsu:"0"}).provider')=='kitsu';count+=1
  assert page.evaluate('MF314.resolveProvider({unknown:"15"}).provider')=='';count+=1
  page.evaluate('__v314.prepare();__v314.users()')
  page.locator('[data-mf312-action="tab"][data-tab="ranking"]').click()
  page.locator('.mf314-podium-card').first.wait_for(timeout=7000)
  assert page.locator('.mf314-podium-card').count()==3;count+=1
  assert 'Gold Media Champion' in page.locator('.mf314-medal-gold').inner_text();count+=1
  assert page.locator('.mf314-rank-row').count()==1;count+=1
  assert page.locator('.mf314-profile-link').count()==3;count+=1
  assert page.locator('.mf314-row-open').count()==1;count+=1
  assert page.locator('body').evaluate('(el)=>el.scrollWidth<=innerWidth+2'),(width,'podium overflow');count+=1
  if width==390:page.screenshot(path='/mnt/data/v314-users-390.png',full_page=True)
  if width==1440:page.screenshot(path='/mnt/data/v314-users-1440.png',full_page=True)
  page.evaluate('__v314.browse()')
  page.locator('select[data-mf309-filter="provider"]').wait_for()
  assert len(page.locator('select[data-mf309-filter="provider"] option').all())==9;count+=1
  page.locator('select[data-mf309-filter="provider"]').select_option('kitsu');count+=1
  assert page.locator('.mf309-item').count()==2;count+=1
  page.evaluate('__v314.ratings()')
  page.locator('select[data-mf312-ratings="provider"]').wait_for()
  assert len(page.locator('select[data-mf312-ratings="provider"] option').all())==9;count+=1
  assert page.locator('.mf311-podium-card').count()==1;count+=1
  page.evaluate('__v314.library()')
  page.locator('.mf314-library-community-action').first.wait_for()
  assert page.locator('[data-mf314-browse]').count()==1;count+=1
  page.locator('[data-mf314-browse]').click()
  assert page.evaluate('MF302.page')=='browse';count+=1
  assert page.evaluate('document.body.classList.contains("mf302-public-active")');count+=1
  published=page.evaluate('__v314.publish()')
  assert [x[0] for x in published]==['mal','simkl','anilist','tmdb','imdb','trakt','kitsu','isbn'],(width,published);count+=1
  assert not errors,(width,errors);count+=1
  print(f'v314 {width}px passed: {count}')
  page.close()
 print('v314 new browser assertions:',count)
 b.close()
