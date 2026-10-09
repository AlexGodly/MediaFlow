#!/usr/bin/env python3
"""Isolated browser checks with real v309 app JS, simulated Supabase responses.
Does not modify actual Supabase user data. Covers views, filters, and import persist.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v321.bundle.js').read_text()
assert bundle.rstrip().endswith('})();')
pos=bundle.rfind('})();')
bundle=bundle[:pos]+'''
window.__mf309Test={
  signIn(){AUTH_USER={id:'e0000000-0000-4000-8000-000000000001',email:'test@mediaflow.test'};
    S.categories=[{id:'anime',name:'Anime',enabled:true},{id:'manga',name:'Manga',enabled:true}];S.library=[];MF302.page='browse';mfShowPortal();},
  resetSaved(){window.__saved=false;},
  library(){return S.library.map(x=>({...x}))},
  setMock(){supabase.rpc=async(name,args)=>{
    window.__rpcCalls.push({name,args});
    return {data:window.__rows,error:null};
  };},
  isPublic(){return document.body.classList.contains('mf302-public-active');},
  replacePersist(){persistLibrary=async()=>{window.__saved=true}},
  showRatings(){MF302.page='ratings';mfShowPortal();},
  clearAuth(){AUTH_USER=null;MF302.page='browse';mfShowPortal();}
};
'''+bundle[pos:]
css='\n'.join((ROOT/'assets/css'/f).read_text() for f in [
 '00-foundation.css','160-v302-community.css','161-v303-community-navigation.css',
 '162-v304-public-statistics.css','163-v305-community-navigation-auth.css',
 '164-v306-community-click-reliability.css','165-v308-community-theme-parity.css',
 '166-v309-browse-views-quick-add.css'])
rows=[
 {'provider':'mal','provider_id':'111','title':'Frieren: Beyond Journey’s End','users_count':12,'average_rating':9.2,'ratings_count':10,'statuses':{'active':5,'completed':7},'total':28,
  'covers':['https://example.com/first.jpg','https://example.com/second.jpg'],
  'metadata':{'genres':['Adventure','Fantasy'],'year':2023,'synopsis':'A journey continues after the adventure.'}},
 {'provider':'simkl','provider_id':'222','title':'Attack on Titan','users_count':8,'average_rating':8.9,'ratings_count':6,'statuses':{'completed':6,'planned':2},'total':87,
  'covers':['https://example.com/aot.jpg'],'metadata':{'year':2013}},
 {'provider':'mal','provider_id':'333','title':'One Piece','users_count':4,'average_rating':9.0,'ratings_count':3,'statuses':{'active':4},'total':None,'covers':[],'metadata':{}}
]
import json
with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  checks=0
  for width in (1440,390,320):
    page=browser.new_page(viewport={'width':width,'height':850})
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    page.set_content('<!doctype html><html><head></head><body><div id="app">Loading...</div></body></html>')
    page.evaluate('''() => {const m=new Map(); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});
      window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})}),rpc:async()=>({data:[],error:null})})};
    }''')
    page.add_style_tag(content=css)
    page.add_script_tag(content=bundle)
    page.evaluate(f'window.__rows={json.dumps(rows)};window.__rpcCalls=[];__mf309Test.setMock();__mf309Test.replacePersist();')
    page.evaluate("__mf309Test.signIn()")
    page.locator('.mf309-results .mf309-item').first.wait_for()
    assert page.locator('.mf309-item').count()==3,(width,'initial results')
    checks+=1
    for view in ('list','compact','cards','covers','covers-titles'):
      page.locator(f'button[data-view="{view}"]').click()
      assert page.locator('.mf309-results').get_attribute('class').endswith('mf309-layout-'+view)
      checks+=1
    page.locator('select[data-mf309-filter="sort"]').select_option('title')
    page.locator('button[data-mf309-action="direction"]').click()
    page.locator('select[data-mf309-filter="provider"]').select_option('mal')
    page.locator('select[data-mf309-filter="status"]').select_option('active')
    page.locator('select[data-mf309-filter="minRating"]').select_option('8')
    page.locator('select[data-mf309-filter="minUsers"]').select_option('5')
    page.wait_for_function("window.__rpcCalls.some(c=>c.name==='mf_browse_titles_v309'&&c.args?.p_min_users===5)",timeout=8000)
    args=page.evaluate("window.__rpcCalls.filter(c=>c.name==='mf_browse_titles_v309').at(-1).args")
    assert args['p_sort']=='title' and args['p_desc'] is False and args['p_provider']=='mal' and args['p_status']=='active' and args['p_min_rating']==8 and args['p_min_users']==5,(width,args)
    checks+=1
    page.locator('[data-mf309-action="reset"]').click()
    page.locator('.mf309-item').first.wait_for()
    checks+=1
    page.locator('.mf309-item').first.locator('[data-mf309-action="quick-add"]').click()
    page.locator('#mf309-add-form').wait_for()
    assert page.evaluate('__mf309Test.isPublic()'),(width,'portal remains during Quick Add')
    assert len(page.locator('input[name="coverChoice"]').all())==2
    checks+=1
    page.locator('select[name="category"]').select_option('manga')
    page.locator('input[name="coverChoice"][value="1"]').check()
    page.locator('#mf309-add-form button[type="submit"]').click()
    page.wait_for_timeout(140)
    added=page.evaluate('({library:__mf309Test.library(),saved:window.__saved})')
    assert added['saved'] and len(added['library'])==1,(width,added)
    item=added['library'][0]
    assert item['coverUrl']=='https://example.com/second.jpg' and item['categoryId']=='manga' and item['externalIds']['mal']=='111',item
    assert item['progress']==0 and item.get('rating') is None, item
    assert item['year']==2023 and item['genres']==['Adventure','Fantasy'] and item['total']==28,item
    assert page.locator('#mf309-add-dialog').count()==0
    checks+=1
    page.locator('.mf309-item').first.locator('[data-mf309-action="quick-add"]').click()
    assert page.locator('#mf309-add-dialog').count()==0,(width,'duplicate prevented')
    checks+=1
    # v311 Ratings Quick Add has dedicated coverage in test-v311-ratings-leaderboard.py.
    # Clicking Browse Quick Add as a guest must open Login, not write private data.
    page.evaluate("__mf309Test.clearAuth()")
    page.locator('.mf309-item').first.wait_for()
    page.locator('.mf309-item').first.locator('[data-mf309-action="quick-add"]').click()
    assert page.locator('#mf309-add-form').count()==0,(width,'guest cannot add')
    assert page.locator('.v297-auth-card, .auth-card').count()>0,(width,'guest sees login')
    checks+=1
    assert not errors,(width,errors)
    checks+=1
    page.close()
    print(f'PASS {width}px: 5 views, global filters, reset, cover selection, real Library persistence, duplicate protection')
  browser.close()
  print(f'PASS {checks} browser assertions; no uncaught browser errors')
