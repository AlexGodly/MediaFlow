#!/usr/bin/env python3
"""v312 Playwright regression: full runtime, mocked privacy-aware Supabase RPCs."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
bundle=(R/'assets/js/mediaflow-v312.bundle.js').read_text()
assert bundle.rstrip().endswith('})();')
pos=bundle.rfind('})();')
bundle=bundle[:pos]+r'''
window.__t312={calls:[],profiles:[
 {user_id:'u1',username:'alex_test',display_name:'Alex Test',bio:'Anime enthusiast',avatar_url:'https://example.com/one.jpg',xp_level:50,xp_total:12000,xp_default_verified:true,show_xp:true,library_titles:100,usage_seconds:5400,show_usage_time:true},
 {user_id:'u2',username:'beta_test',display_name:'Beta Tester',bio:'A media fan',avatar_url:'',xp_level:50,xp_total:11000,xp_default_verified:false,show_xp:true,library_titles:20,usage_seconds:null,show_usage_time:false},
 {user_id:'u3',username:'hidden_test',display_name:'Hidden Test',bio:'...',avatar_url:'',xp_level:null,xp_total:null,xp_default_verified:null,show_xp:false,library_titles:null,usage_seconds:null,show_usage_time:false}
 ],ratings:Array.from({length:68},(_,i)=>({rank:i+1,provider:i%2?'simkl':'mal',provider_id:String(1200+i),title:'Rated '+String(i+1).padStart(2,'0'),users_count:300-i,ratings_count:80-i,average_rating:(10-i*.01).toFixed(2),covers:['https://example.com/a.jpg'],metadata:{year:2020},total_ranked:68,match_count:68})),
 setMock(){const self=this;supabase.rpc=async(name,args={})=>{self.calls.push({name,args});if(name==='mf_users_directory_v312'){let rows=self.profiles.slice();if(args.p_search)rows=rows.filter(t=>(t.username+' '+t.display_name).toLowerCase().includes(args.p_search.toLowerCase()));if(args.p_verified!=='all')rows=rows.filter(t=>t.xp_default_verified===(args.p_verified==='verified'));if(args.p_tab==='ranking'){if(args.p_sort==='level'||args.p_sort==='xp')rows=rows.filter(t=>t.show_xp);if(args.p_sort==='usage')rows=rows.filter(t=>t.show_usage_time);}rows.sort((a,b)=>(Number(b.xp_level)||0)-(Number(a.xp_level)||0)||(Number(b.xp_total)||0)-(Number(a.xp_total)||0));return {data:rows.slice(args.p_offset||0,40).map((t,i)=>({...t,rank:1+i,total_matches:rows.length})),error:null};}
 if(name==='mf_ratings_leaderboard_v312'){let rows=self.ratings.filter(t=>!args.p_search||t.title.toLowerCase().includes(args.p_search.toLowerCase()));return {data:rows.slice(args.p_offset||0,(args.p_offset||0)+(args.p_limit||60)).map(t=>({...t,match_count:rows.length})),error:null};}
 if(name==='mf_catalog_revision_v312')return {data:'2026-10-08T17:21:00Z',error:null};
 return {data:[],error:null};};},
 show(page){MF302.page=page;MF302.query='';MF302.catalogOffset=0;mfShowPortal();},
 badge(){S.settings.leveling=JSON.parse(JSON.stringify(DEFAULT_SETTINGS.leveling));return mf312DefaultsMatch();},
 custom(){S.settings.leveling=JSON.parse(JSON.stringify(DEFAULT_SETTINGS.leveling));S.settings.leveling.minuteXP=99;return mf312DefaultsMatch();},
 shareUrl(){return mf312PublicURL('alex_test','collection-1');}
};
''' + bundle[pos:]
css='\n'.join((R/'assets/css'/p).read_text() for p in ['00-foundation.css','160-v302-community.css','161-v303-community-navigation.css','163-v305-community-navigation-auth.css','164-v306-community-click-reliability.css','165-v308-community-theme-parity.css','166-v309-browse-views-quick-add.css','167-v310-community-collections.css','168-v311-ratings-leaderboard.css','169-v312-community-ranking.css'])
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 total=0
 for width in [1440,390,320]:
  pg=b.new_page(viewport={'width':width,'height':900})
  errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  pg.set_content('<!doctype html><html><head></head><body><div id="app">Loading…</div></body></html>')
  pg.evaluate('''() => {let m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},rpc:async()=>({data:[],error:null}),from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})})})};}''')
  pg.add_style_tag(content=css);pg.add_script_tag(content=bundle)
  pg.evaluate('__t312.setMock();__t312.show("users")')
  pg.locator('.mf312-user-card').first.wait_for(timeout=9000)
  assert pg.locator('.mf312-user-card').count()==3;total+=1
  assert pg.locator('.mf312-user-card').first.inner_text().find('Alex Test')>=0;total+=1
  assert 'Verified' in pg.locator('.mf312-users-grid').inner_text();total+=1
  assert pg.locator('.mf312-avatar img').count()==1;total+=1
  for mode in ['list','compact','avatars','cards']:
   pg.locator(f'[data-mf312-action="view"][data-value="{mode}"]').click()
   assert pg.locator(f'.mf312-grid-{mode} .mf312-user-card').count()==3,(width,mode);total+=1
  pg.locator('[data-mf312-action="tab"][data-tab="ranking"]').click()
  pg.locator('.mf312-user-card').first.wait_for()
  assert pg.locator('.mf312-user-card').count()==2;total+=1
  assert '#1' in pg.locator('.mf312-user-card').first.inner_text();total+=1
  assert pg.evaluate('__t312.calls.at(-1).args.p_sort')=='level';total+=1
  pg.locator('[data-mf312-action="direction"]').click()
  assert pg.evaluate('__t312.calls.at(-1).args.p_desc')==False;total+=1
  pg.locator('[data-mf312-user-filter="sort"]').select_option('usage')
  assert pg.locator('.mf312-user-card').count()==1;total+=1
  pg.locator('[data-mf312-action="tab"][data-tab="discover"]').click()
  pg.locator('[data-mf312-user-filter="verified"]').select_option('verified')
  assert pg.locator('.mf312-user-card').count()==1;total+=1
  assert pg.evaluate('__t312.badge()')==True;total+=1
  assert pg.evaluate('__t312.custom()')==False;total+=1
  assert pg.evaluate('__t312.shareUrl()')=='https://alexgodly.github.io/MediaFlow/alex_test/Collections/collection-1';total+=1
  pg.evaluate('__t312.show("ratings")')
  pg.locator('.mf311-podium-card').first.wait_for()
  assert pg.locator('.mf311-podium-card').count()==3;total+=1
  assert pg.locator('.mf312-ratings-controls select').count()==5;total+=1
  pg.locator('[data-mf311-action="direction"]').click()
  assert pg.evaluate('__t312.calls.at(-1).args.p_desc')==False;total+=1
  pg.locator('[data-mf312-ratings="minVotes"]').select_option('5')
  assert pg.evaluate('__t312.calls.at(-1).args.p_min_votes')==5;total+=1
  pg.evaluate('MF312.ratingRevision="old"');pg.evaluate('MF312.refreshRatings()')
  pg.wait_for_timeout(150)
  assert pg.evaluate('__t312.calls.some(x=>x.name==="mf_catalog_revision_v312")');total+=1
  assert pg.evaluate('__t312.calls.filter(x=>x.name==="mf_ratings_leaderboard_v312").length')>=3;total+=1
  assert not errors,(width,errors);total+=1
  print(width,'px:',total,'cumulative browser assertions')
  pg.close()
 print('v312 total browser assertions:',total)
 b.close()
