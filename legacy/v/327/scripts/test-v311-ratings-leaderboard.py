#!/usr/bin/env python3
"""Browser regression for v311 Ratings: real app runtime, mocked public results.
RLS and global ordering are separately tested against the live Supabase RPC."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v311.bundle.js').read_text()
assert bundle.rstrip().endswith('})();')
pos=bundle.rfind('})();')
bundle=bundle[:pos]+r'''
window.__t311={calls:[],dataset:Array.from({length:68},(_,i)=>({
 rank:i+1,provider:i%2?'simkl':'mal',provider_id:String(900+i),title:'Anime '+String(i+1).padStart(2,'0'),
 users_count:300-i,ratings_count:180-i,average_rating:(10-i*.01).toFixed(2),
 covers:['https://example.com/poster-'+i+'.jpg'],metadata:{year:2021},total:12,
 total_ranked:68,match_count:68})),
 guest(){AUTH_USER=null;MF302.page='ratings';MF302.query='';MF302.catalogOffset=0;MF311.query='';MF311.offset=0;mfShowPortal()},
 signedIn(){AUTH_USER={id:'a3b4c5d6-e7f8-4a12-9b0c-123456789012',email:'test@example.com'};
 S.library=[];S.categories=[{id:'catA',name:'Anime',enabled:true}];MF302.page='ratings';mfShowPortal()},
 setMock(){const self=this;supabase.rpc=async(name,args)=>{
 self.calls.push({name,args});if(name==='mf_ratings_leaderboard_v311'){
 const q=String(args.p_search||'').toLowerCase();const filtered=self.dataset.filter(t=>t.title.toLowerCase().includes(q));
 return {data:filtered.slice(args.p_offset,args.p_offset+args.p_limit).map(t=>({...t,match_count:filtered.length})),error:null};}
 return {data:[],error:null};};}
};
''' + bundle[pos:]
css='\n'.join((ROOT/'assets/css'/name).read_text() for name in [
 '00-foundation.css','160-v302-community.css','161-v303-community-navigation.css',
 '163-v305-community-navigation-auth.css','164-v306-community-click-reliability.css',
 '165-v308-community-theme-parity.css','166-v309-browse-views-quick-add.css',
 '167-v310-community-collections.css','168-v311-ratings-leaderboard.css'])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 passed=0
 for width in [1440,390,320]:
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[];page.on('pageerror',lambda error: errors.append(str(error)))
  page.set_content('<!doctype html><html><head></head><body><div id="app">Loading…</div></body></html>')
  page.evaluate('''() => {const mem=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},rpc:async()=>({data:[],error:null}),from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})})})};}''')
  page.add_style_tag(content=css);page.add_script_tag(content=bundle)
  page.evaluate('__t311.setMock();__t311.guest()')
  page.locator('.mf311-podium-card').first.wait_for(timeout=8000)
  assert page.locator('.mf311-podium-card').count()==3,(width,'podium');passed+=1
  assert page.locator('.mf311-position-1').inner_text().find('Anime 01')>=0;(passed:=passed+1)
  assert page.locator('.mf311-podium').locator('.mf311-podium-card').nth(1).get_attribute('class').find('position-1')>=0;passed+=1
  assert page.locator('.mf311-row').count()==57,(width,'top 60 3 podium 57 rows');passed+=1
  assert ''.join(page.locator('.mf311-number').first.text_content().split())=='#4';passed+=1
  assert '68 rated titles' in page.locator('.mf311-results-summary').inner_text();passed+=1
  assert page.locator('body').evaluate('(b) => b.scrollWidth <= innerWidth+1'),(width,'horizontal overflow');passed+=1
  page.locator('[data-mf311-action="page"][data-step="1"]').click()
  page.locator('.mf311-row').first.wait_for()
  assert page.locator('.mf311-podium-card').count()==0;passed+=1
  assert page.locator('.mf311-row').count()==8;passed+=1
  assert ''.join(page.locator('.mf311-number').first.text_content().split())=='#61';passed+=1
  assert page.locator('.mf311-pagination').inner_text().find('Page 2')>=0;passed+=1
  page.locator('#mf311-search').fill('Anime 52')
  page.locator('.mf311-row').first.wait_for(timeout=10000)
  page.wait_for_timeout(400)
  assert page.locator('.mf311-row').count()==1;passed+=1
  assert ''.join(page.locator('.mf311-number').first.text_content().split())=='#52';passed+=1
  assert 'ranks reflect' in page.locator('.mf311-results-summary').inner_text().lower();passed+=1
  args=page.evaluate('__t311.calls.at(-1).args')
  assert args['p_search']=='Anime 52' and args['p_offset']==0,(width,args);passed+=1
  page.locator('#mf311-search').fill('some-impossible-title')
  page.wait_for_timeout(650)
  assert page.locator('.mf311-empty').count()==1;passed+=1
  # Return to rankings to check the v309 real import dialog works from Ratings.
  page.locator('#mf311-search').fill('Anime 52')
  page.wait_for_timeout(650)
  page.evaluate('__t311.signedIn()')
  page.locator('.mf311-row .mf311-add').first.wait_for()
  page.locator('.mf311-row .mf311-add').click()
  page.locator('#mf309-add-dialog').wait_for(timeout=7000)
  assert page.locator('#mf309-add-dialog').inner_text().find('Anime 52')>=0;passed+=1
  page.evaluate('MF309.closeAdd()');passed+=1
  assert not errors,(width,errors);passed+=1
  page.close()
 print('v311 Ratings browser checks passed:',passed)
 browser.close()
