#!/usr/bin/env python3
"""Browser regression tests for v310 public Collections; simulated user/DB state only."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v315.bundle.js').read_text()
assert bundle.rstrip().endswith('})();')
pos=bundle.rfind('})();')
bundle=bundle[:pos]+r'''
window.__t310={
  owner:'a1111111-1111-4111-8111-111111111111',subscriber:'b2222222-2222-4222-8222-222222222222',
  cols:[],saved:[],profiles:[],calls:[],
  guest(){AUTH_USER=null;MF310.saved=[];MF310.savedUser='';MF302.page='collections';mfShowPortal()},
  login(){AUTH_USER={id:this.subscriber,email:'subscriber@test.local'};MF310.savedUser='';MF310.savedLoaded=0;MF302.page='collections';mfShowPortal()},
  workspace(){S.view='collections';MF310.workspaceActive=null;V274_UI.activeId='';mfHidePortal();renderShell();render();},
  ownerEdit(){AUTH_USER={id:this.owner,email:'creator@test.local'};S.collections=[{id:'col123',title:'Updated Creator Collection',description:'Fresh description',titleIds:['a','b'],coverUrl:'',createdAt:1,updatedAt:Date.now(),autoBackground:false}];S.library=[{id:'a',title:'First Anime',coverUrl:'https://example.com/first.jpg',status:'completed',rating:9},{id:'b',title:'New Manga',coverUrl:'https://example.com/new.jpg',status:'active',rating:8}];MF310.savedUser='';},
  async syncOwner(){await mf310SyncPublishedOwnerCollections()},
  logout(){AUTH_USER=null;MF310.saved=[];MF310.savedUser=''},
  publicRoute(){return MF302.page},
  setMock(){
    const db=this;
    supabase.rpc=async(name,args)=>{
      db.calls.push({name,args});
      if(name==='mf_public_collections_v310'){
        const output=db.cols.filter(c=>c.is_public&&db.profiles.some(p=>p.user_id===c.user_id&&p.is_public));
        const search=String(args.p_search||'').toLowerCase();
        return {data:output.filter(c=>(c.title+' '+c.description+' '+c.username).toLowerCase().includes(search)),error:null};
      }
      return {data:[],error:null};
    };
    supabase.from=table=>{
      const op={table,filters:[],kind:'select',values:null,select(s){this.fields=s;return this},eq(k,v){this.filters.push({k,v});return this},in(k,vs){this.filters.push({k,vs});return this},order(){return this},limit(){return Promise.resolve(this._run())},upsert(v){this.kind='upsert';this.values=v;return Promise.resolve(this._run())},insert(v){this.kind='upsert';this.values=v;return Promise.resolve(this._run())},update(v){this.kind='update';this.values=v;return this},delete(){this.kind='delete';return this},then(ok,bad){return Promise.resolve(this._run()).then(ok,bad)},_run(){
       const src=this.table==='mf_public_collections'?db.cols:this.table==='mf_public_profiles'?db.profiles:this.table==='mf_saved_collections'?db.saved:[];
       const matches=x=>this.filters.every(({k,v,vs})=>vs?vs.includes(x[k]):x[k]===v);
       if(this.kind==='upsert'){
         if(this.table==='mf_saved_collections'){
           const r=this.values;if(!db.saved.some(s=>s.user_id===r.user_id&&s.owner_id===r.owner_id&&s.collection_id===r.collection_id))db.saved.push({...r,saved_at:new Date().toISOString()});
         }
         return {data:null,error:null};
       }
       if(this.kind==='update'){for(const x of src.filter(matches))Object.assign(x,this.values);return {data:null,error:null};}
       if(this.kind==='delete'){for(const x of src.filter(matches)){const ix=src.indexOf(x);if(ix>=0)src.splice(ix,1);}return {data:null,error:null};}
       let rows=src.filter(matches);
       // Public-read RLS simulation: private Collections/creators are never visible.
       if(this.table==='mf_public_collections'&&AUTH_USER?.id!==db.owner)rows=rows.filter(c=>c.is_public&&db.profiles.some(p=>p.user_id===c.user_id&&p.is_public));
       if(this.table==='mf_public_profiles')rows=rows.filter(p=>p.is_public);
       if(this.table==='mf_saved_collections')rows=rows.filter(s=>s.user_id===AUTH_USER?.id);
       return {data:rows.map(x=>({...x})),error:null};
     }};
     return op;
    };
  }
};
__t310.profiles=[{user_id:__t310.owner,username:'creator',display_name:'The Creator',is_public:true}];
__t310.cols=[{user_id:__t310.owner,id:'col123',username:'creator',display_name:'The Creator',title:'Favorite Anime',description:'Curated media',cover_url:'https://example.com/cover.jpg',items:[{title:'First Anime',coverUrl:'https://example.com/first.jpg',status:'completed',rating:9}],item_count:1,is_public:true,updated_at:new Date().toISOString()}];
''' + bundle[pos:]
css='\n'.join((ROOT/'assets/css'/name).read_text() for name in ['00-foundation.css','160-v302-community.css','161-v303-community-navigation.css','163-v305-community-navigation-auth.css','164-v306-community-click-reliability.css','165-v308-community-theme-parity.css','166-v309-browse-views-quick-add.css','167-v310-community-collections.css','168-v311-ratings-leaderboard.css','169-v312-community-ranking.css','170-v313-community-workspace-polish.css'])
with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  total=0
  for width in [1440,390,320]:
    page=browser.new_page(viewport={'width':width,'height':900})
    errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
    page.set_content('<!DOCTYPE html><html><head></head><body><div id="app">Loading</div></body></html>')
    page.evaluate('''() => {const s=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>s.get(k)||null,setItem:(k,v)=>s.set(k,String(v)),removeItem:k=>s.delete(k)}});window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[],error:null})}),rpc:async()=>({data:[],error:null})})};}''')
    page.add_style_tag(content=css);page.add_script_tag(content=bundle)
    page.evaluate('__t310.setMock();__t310.guest()')
    page.locator('.mf310-card').first.wait_for(timeout=7000)
    assert page.locator('.mf310-card').count()==1,(width,'guest directory');total+=1
    assert page.locator('.mf310-card [data-mf312-action="share"]').count()==1,(width,'share public link');total+=1
    assert page.locator('.mf310-creator').first.inner_text().find('The Creator')>=0;total+=1
    for view in ['list','compact','cards','covers','covers-titles']:
      page.locator(f'button[data-mf310-action="view"][data-group="directory"][data-value="{view}"]').click()
      assert page.locator('.mf310-results').first.get_attribute('class').endswith('mf310-layout-'+view);total+=1
    page.locator('select[data-mf310-filter="sort"]').select_option('title')
    page.locator('button[data-mf310-action="direction"][data-group="directory"]').click()
    page.locator('select[data-mf310-filter="minItems"]').select_option('5')
    page.locator('.mf310-card').first.wait_for()
    args=page.evaluate('__t310.calls.filter(x=>x.name==="mf_public_collections_v310").at(-1).args')
    assert args['p_sort']=='title' and args['p_desc'] is False and args['p_min_items']==5,(width,args);total+=1
    page.locator('[data-mf310-action="reset"]').click();page.locator('.mf310-card').first.wait_for();total+=1
    page.locator('.mf310-card [data-mf310-action="save"]').click()
    page.locator('.v297-auth-card').wait_for(timeout=5000)
    assert page.evaluate('MF302.forceAuth'),(width,'guest save requires authentication');total+=1
    page.evaluate('__t310.login()')
    page.locator('.mf310-card').first.wait_for()
    page.locator('.mf310-card [data-mf310-action="save"]').click()
    page.locator('.mf310-card [data-mf310-action="unsave"]').wait_for(timeout=6000)
    assert page.evaluate('__t310.saved.length')==1;total+=1
    page.locator('.mf310-card [data-mf310-action="open"]').click()
    page.locator('.mf310-detail .mf310-hero').wait_for(timeout=3000)
    assert 'Favorite Anime' in page.locator('.mf310-detail h1').inner_text();total+=1
    assert page.locator('.mf310-detail [data-mf312-action="share"]').count()==1,(width,'detail share action');total+=1
    assert page.locator('.mf310-detail a.mf310-creator').get_attribute('href').endswith('/creator');total+=1
    for view in ['list','compact','cards','covers','covers-titles']:
      page.locator(f'.mf310-detail [data-mf310-action="view"][data-value="{view}"]').click()
      assert page.locator('.mf310-detail .mf310-results').get_attribute('class').endswith('mf310-layout-'+view);total+=1
    page.evaluate('''() => {__t310.cols[0].items=Array.from({length:105},(_,i)=>({title:'Title '+(i+1),coverUrl:'https://example.com/art.jpg',status:'planned',rating:7})); __t310.cols[0].item_count=105}''')
    page.locator('.mf310-detail [data-mf310-action="refresh-detail"]').click()
    page.locator('.mf310-detail .mf310-media').first.wait_for()
    assert page.locator('.mf310-detail .mf310-media').count()==50;total+=1
    page.locator('.mf310-detail [data-mf310-action="detail-page"][data-delta="1"]').click()
    assert page.locator('.mf310-detail .mf310-media').count()==50;total+=1
    page.locator('.mf310-detail [data-mf310-action="detail-page"][data-delta="1"]').click()
    assert page.locator('.mf310-detail .mf310-media').count()==5;total+=1
    page.evaluate('__t310.workspace()')
    page.locator('#mf313-scope').wait_for(timeout=6000)
    page.locator('.mf310-saved-section .mf310-card').first.wait_for(timeout=6000)
    assert page.locator('.mf310-saved-section .mf310-creator').count()==1;total+=1
    page.locator('#mf313-scope').select_option('community')
    assert page.locator('.mf310-saved-section .mf310-card').count()==1;total+=1
    page.locator('.mf310-saved-section [data-mf310-action="workspace-open"]').click()
    assert page.locator('.mf310-in-workspace').count()==1;total+=1
    # A creator editing their own already-public Collection updates its public record.
    page.evaluate('__t310.ownerEdit()')
    page.evaluate('async()=>{await __t310.syncOwner()}')
    assert page.evaluate('__t310.cols[0].title')=='Updated Creator Collection';total+=1
    assert page.evaluate('__t310.cols[0].items.length')==2;total+=1
    page.evaluate('__t310.login()')
    page.evaluate('async()=>{await MF310.loadSaved(true)}')
    page.evaluate('__t310.workspace()')
    page.locator('.mf310-saved-section .mf310-card h3').first.wait_for()
    assert page.locator('.mf310-saved-section .mf310-card h3').first.inner_text()=='Updated Creator Collection';total+=1
    # Privacy / owner profile removal hides live contents without deleting the saved reference.
    page.evaluate('__t310.cols[0].is_public=false')
    page.evaluate('async()=>{await MF310.loadSaved(true)}')
    page.evaluate('__t310.workspace()')
    assert 'Collection unavailable' in page.locator('.mf310-saved-section').inner_text();total+=1
    assert 'New Manga' not in page.locator('.mf310-saved-section').inner_text();total+=1
    page.locator('.mf310-saved-section [data-mf310-action="unsave"]').click()
    page.wait_for_timeout(140)
    assert page.evaluate('__t310.saved.length')==0;total+=1
    assert not errors,(width,errors);total+=1
    print('width',width,'passed',total)
    page.close()
  print('PASS TOTAL',total,'v310 browser assertions')
  browser.close()
