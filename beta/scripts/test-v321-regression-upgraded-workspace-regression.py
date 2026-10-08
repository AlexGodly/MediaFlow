#!/usr/bin/env python3
"""v313 full-runtime, mocked account/DB test: Workspace owned details, combined/tabs, guest profile share, Browse count."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
old=(R/'scripts/test-v312-collections-regression.py').read_text()
fixture=old.split("bundle=bundle[:pos]+r'''",1)[1].split("''' + bundle[pos:]",1)[0]
bundle=(R/'assets/js/mediaflow-v321.bundle.js').read_text()
pos=bundle.rfind('})();')
bundle=bundle[:pos]+r'''
window.__v313={
 setMock(){
  const d=__t310; d.setMock();const prev=supabase.rpc;
  supabase.rpc=async(name,args)=>{
   if(name==='mf_community_title_count_v313'){d.calls.push({name,args});return {data:31415,error:null};}
   if(name==='mf_browse_titles_v309'){d.calls.push({name,args});return {data:[{provider:'mal',provider_id:'12',title:'Title Alpha',users_count:5,ratings_count:3,average_rating:8,covers:[],statuses:{},metadata:{}}],error:null};}
   if(name==='mf_users_directory_v312'){d.calls.push({name,args});return {data:d.profiles.map((u,i)=>({...u,rank:i+1,xp_level:200,xp_total:40000,show_xp:true,xp_default_verified:true,library_titles:12,usage_seconds:4400,show_usage_time:true,total_matches:d.profiles.length})),error:null};}
   return prev(name,args);
  };
 },
 ownerWorkspace(){AUTH_USER={id:__t310.owner};S.collections=[{id:'owned-1',title:'My Own Collection',description:'A personal collection',titleIds:['t1'],coverUrl:'',createdAt:Date.now(),updatedAt:Date.now(),autoBackground:false}];S.categories=[{id:'cat1',name:'Anime',enabled:true,icon:'📺'}];S.library=[{id:'t1',categoryId:'cat1',title:'Collection Item',status:'planned',coverUrl:'',rating:8,progress:0,total:10}];MF310.saved=[];MF310.savedUser=AUTH_USER.id;MF310.savedLoaded=Date.now();MF310.workspaceActive=null;V274_UI.activeId='';MF313.collectionLayout='combined';MF313.combinedScope='all';S.settings.v313Collections={layout:'combined',scope:'all',tab:'my'};mfHidePortal();S.view='collections';renderShell();render();},
 openOwned(){return App.v274OpenCollection('owned-1');},
 directDetails(){V274_UI.activeId='owned-1';render();},
 showProfile(){MF302.page='profile';MF302.profile={user_id:__t310.owner,username:'creator',display_name:'The Creator',is_public:true};document.getElementById('mf302-content').innerHTML='<section class="mf302-profile"><div class="mf302-hero-actions"></div></section>';mf313DecorateProfile();},
 async showBrowse(){MF302.page='browse';mfShowPortal();await mf309RenderBrowse();},
};
''' + fixture + '\n'+bundle[pos:]
css='\n'.join((R/'assets/css'/p).read_text() for p in ['00-foundation.css','160-v302-community.css','161-v303-community-navigation.css','163-v305-community-navigation-auth.css','164-v306-community-click-reliability.css','165-v308-community-theme-parity.css','166-v309-browse-views-quick-add.css','167-v310-community-collections.css','168-v311-ratings-leaderboard.css','169-v312-community-ranking.css','170-v313-community-workspace-polish.css'])
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 total=0
 for width in [int(x) for x in os.environ.get('MF320_WIDTHS','1440,390,320').split(',')]:
  pg=browser.new_page(viewport={'width':width,'height':900})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.set_content('<!DOCTYPE html><html><head></head><body><div id="app">Loading</div></body></html>')
  pg.evaluate('''() => {let s=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>s.get(k)||null,setItem:(k,v)=>s.set(k,String(v)),removeItem:k=>s.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})}),rpc:async()=>({data:[],error:null})})};}''')
  pg.add_style_tag(content=css);pg.add_script_tag(content=bundle)
  pg.evaluate('__v313.setMock();__v313.ownerWorkspace()')
  assert pg.locator('.mf313-workspace-collections').count()==1,(width,'new workspace');total+=1
  assert pg.locator('.mf313-my-section').count()==1,(width,'my section');total+=1
  assert pg.locator('[data-mf310-action="refresh-saved"]:visible').count()==1,(width,'only top refresh');total+=1
  assert pg.locator('#mf313-scope').count()==1,total;total+=1
  pg.locator('#mf313-scope').select_option('my')
  assert pg.locator('.mf313-community-section').count()==0;total+=1
  pg.locator('#mf313-scope').select_option('community')
  assert pg.locator('.mf313-my-section').count()==0;total+=1
  pg.locator('#mf313-scope').select_option('all')
  assert pg.locator('.mf313-my-section').count()==1 and pg.locator('.mf313-community-section').count()==1;total+=1
  pg.locator('[data-mf313-action="layout"][data-value="tabs"]').click()
  assert pg.locator('.mf313-source-tabs').count()==1 and pg.locator('.mf313-my-section').count()==1;total+=1
  pg.locator('[data-mf313-action="tab"][data-value="community"]').click()
  assert pg.locator('.mf313-community-section').count()==1 and pg.locator('.mf313-my-section').count()==0;total+=1
  pg.locator('[data-mf313-action="tab"][data-value="my"]').click()
  assert pg.locator('.mf313-my-section').count()==1;total+=1
  pg.locator('.mf274-browser-results [onclick*="v274OpenCollection"]').first.click()
  pg.locator('.mf274-collection-detail').first.wait_for(timeout=7000)
  assert 'My Own Collection' in pg.locator('.mf274-collection-detail').inner_text();total+=1
  assert pg.locator('.mf313-workspace-collections').count()==0,(width,'detail replaces browser');total+=1
  pg.locator('[onclick*="v274BackToCollections"]').first.click()
  assert pg.locator('.mf313-workspace-collections').count()==1,(width,'back to browser');total+=1
  pg.evaluate('__v313.showProfile()')
  assert pg.locator('[data-mf313-share-profile]').count()==1;total+=1
  assert pg.evaluate('MF313.shareProfile("creator")')=='https://alexgodly.github.io/MediaFlow/creator';total+=1
  pg.evaluate('__v313.showBrowse()')
  pg.locator('#mf313-total-titles').wait_for(timeout=7000)
  pg.wait_for_function('document.getElementById("mf313-total-titles")?.textContent.includes("31,415")')
  assert '31,415' in pg.locator('#mf313-total-titles').inner_text();total+=1
  assert pg.evaluate('__t310.calls.filter(c=>c.name==="mf_community_title_count_v313").length')==1;total+=1
  assert not errs,(width,errs);total+=1
  print(width,'px checks passed:',total)
  pg.close()
 print('v313 new tests passed:',total)
 browser.close()
