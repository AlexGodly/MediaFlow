#!/usr/bin/env python3
from pathlib import Path
import json,shutil,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v287.bundle.js').read_text(encoding='utf-8')
state={
 'categories':[
   {'id':'movies','name':'Movies','icon':'🎬','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':120,'color':'#7C5CFC','seasonal':False,'enabled':True,'custom':True},
   {'id':'seasonal','name':'Seasonal Anime','icon':'🌸','type':'video','unit':'episodes','target':1,'weight':3,'minutesPerUnit':24,'color':'#55aaff','seasonal':True,'enabled':True,'custom':True}
 ],
 'categoryOrder':['movies','seasonal'],
 'library':[
   {'id':'d1','title':'Direct Movie','categoryId':'movies','status':'planned','priority':'medium','progress':0,'total':1},
   {'id':'m1','title':'Movie One','categoryId':'movies','status':'planned','priority':'medium','progress':0,'total':1},
   {'id':'a1','title':'Seasonal One','categoryId':'seasonal','status':'planned','priority':'medium','progress':0,'total':12},
   {'id':'m2','title':'Movie Two','categoryId':'movies','status':'planned','priority':'medium','progress':0,'total':1},
   {'id':'m3','title':'Movie Completed','categoryId':'movies','status':'completed','priority':'medium','progress':1,'total':1}
 ],
 'collections':[{'id':'c1','title':'Mixed Watchlist','description':'Movies + anime','titleIds':['m1','a1','m2','m3'],'order':['m1','a1','m2','m3'],'createdAt':1,'updatedAt':1,'lastViewedAt':0,'autoBackground':True,'coverUrl':''}],
 'collectionTombstones':[],
 'sessions':[],
 'settings':{'categoryOrder':['movies','seasonal'],'prioritizePersonalOrder':True,'exactTitleRecommendations':True},
 'orderPlan':{'titleIds':['d1'],'viewMode':'category','categoryMode':'default','categoryOrder':['movies','seasonal'],'hiddenCategories':[],'modifiedAt':1,'paginateOrderedTitles':True},
 'currentTask':{'id':'task','categoryId':'movies','low':1,'high':1,'targetMid':1,'unit':'movies','createdAt':1,'reasons':['test']},'sessionActive':True,
 'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1
}

traverse_state=json.loads(json.dumps(state))
traverse_state['orderPlan']['collectionAssignments']=[{'id':'trav1','collectionId':'c1','categoryId':'movies','categoryRule':'match','completedRule':'skip','traversedTitleIds':[],'createdAt':1,'modifiedAt':1}]
traverse_state['orderPlan']['categoryQueues']={'movies':['c:trav1','t:d1']}
traverse_state['currentTask']['libraryId']='m1'
traverse_state['currentTask']['title']='Movie One'

def setup_script(st):
    return f'''() => {{
      const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
      Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});
      const user={{id:'v287-user',email:'alex@example.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};
      let cloud={json.dumps(st,separators=(',',':'))};
      const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
      window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),60)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:()=>q}})}};
      window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;window.__cloudState=()=>cloud;
    }}'''

def boot(browser,st):
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.evaluate(setup_script(st));page.add_script_tag(content=bundle);page.wait_for_timeout(1200)
    if errs: raise AssertionError(errs)
    return page

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=boot(b,state)
    page.evaluate("App.setView('order')");page.wait_for_timeout(150)
    ui_text=page.locator('body').inner_text()
    assert 'ADD COLLECTION' in ui_text, ui_text[:2000]
    # Add the collection to Movies.
    page.evaluate("App.v287AddCollectionAssignment('c1','movies')");page.wait_for_timeout(300)
    aid=page.locator('[data-assignment-id]').first.get_attribute('data-assignment-id')
    assert aid
    q0=page.evaluate("App.v287Queue('movies')")
    seq_default=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert q0[0]=='t:d1' and q0[1].startswith('c:'),q0
    assert seq_default==['d1','m1','m2'],seq_default
    # Move Collection before direct title; it must become one contiguous block.
    page.evaluate(f"App.v287SetAssignmentPosition('{aid}',1)");page.wait_for_timeout(250)
    q1=page.evaluate("App.v287Queue('movies')")
    seq_match_skip=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert q1[0].startswith('c:') and q1[1]=='t:d1',q1
    assert seq_match_skip==['m1','m2','d1'],seq_match_skip
    # Force Queue lets Seasonal Anime remain inside the Movies task queue.
    page.evaluate(f"App.v287SetAssignmentRule('{aid}','categoryRule','force')");page.wait_for_timeout(220)
    seq_force_skip=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert seq_force_skip==['m1','a1','m2','d1'],seq_force_skip
    # Include Completed keeps completed Movie m3 in collection order.
    page.evaluate(f"App.v287SetAssignmentRule('{aid}','completedRule','include')");page.wait_for_timeout(220)
    seq_force_include=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert seq_force_include==['m1','a1','m2','m3','d1'],seq_force_include
    # Match + Include excludes Seasonal but keeps completed Movies.
    page.evaluate(f"App.v287SetAssignmentRule('{aid}','categoryRule','match')");page.wait_for_timeout(220)
    seq_match_include=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert seq_match_include==['m1','m2','m3','d1'],seq_match_include
    # Exact-title recommendation uses queue without changing task category.
    picked=page.evaluate("App.v287PickForCategory('movies').id")
    assert picked=='m1',picked
    # Same Collection can be independently assigned to Seasonal.
    page.evaluate("App.v287AddCollectionAssignment('c1','seasonal')");page.wait_for_timeout(280)
    audit2=page.evaluate("App.v287AuditState()")
    assert audit2['collectionAssignments']==2,audit2
    # Export/persistence coverage.
    export=page.evaluate("App.v287AuditState()")
    assert export['personalOrderExportVersion']>=5,export
    assert export['snapshotAssignments'] is True and export['categoryQueueCount']>=2,export
    # Clear/restore treats Collection assignments as first-class Personal Order items.
    page.evaluate("App.v287ConfirmClearOrder()");page.wait_for_timeout(240)
    cleared=page.evaluate("App.v287AuditState()")
    assert cleared['collectionAssignments']==0,cleared
    page.evaluate("App.v142RestoreLastOrder()");page.wait_for_timeout(320)
    restored=page.evaluate("App.v287AuditState()")
    restored_seq=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert restored['collectionAssignments']==2 and restored_seq==['m1','m2','m3','d1'],(restored,restored_seq)
    cloud=page.evaluate('window.__cloudState()')
    page.close()
    fresh=boot(b,cloud)
    fresh_seq=fresh.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    freshaudit=fresh.evaluate("App.v287AuditState()")
    fresh_count=freshaudit['collectionAssignments']
    assert fresh_count==2,freshaudit
    assert fresh_seq==['m1','m2','m3','d1'],fresh_seq
    fresh.close()
    # A Collection block advances after its recommended title is actually logged.
    trav=boot(b,traverse_state)
    trav.evaluate("App.openLogForm(); App.selectLogTitle('m1'); App.addLogEntry(); App.submitLog();")
    trav.wait_for_timeout(500)
    traversed_seq=trav.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert traversed_seq==['m2','d1'],traversed_seq
    trav_cloud=trav.evaluate('window.__cloudState()')
    trav.close()
    travfresh=boot(b,trav_cloud)
    traversed_fresh=travfresh.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert traversed_fresh==['m2','d1'],traversed_fresh
    travfresh.close()
    b.close()

result={
 'defaultMatchSkip':seq_default,
 'movedMatchSkip':seq_match_skip,
 'forceSkip':seq_force_skip,
 'forceInclude':seq_force_include,
 'matchInclude':seq_match_include,
 'freshClient':fresh_seq,
 'exportVersion':export['personalOrderExportVersion'],
 'assignments':fresh_count,
 'afterLoggedCollectionTitle':traversed_seq,
 'afterLoggedFreshClient':traversed_fresh
}
print(json.dumps(result,indent=2))
print('SMOKE V287 OK')
