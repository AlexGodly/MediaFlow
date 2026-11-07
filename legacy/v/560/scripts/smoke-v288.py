#!/usr/bin/env python3
from pathlib import Path
import json,shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
bundle=(ROOT/'assets/js/mediaflow-v288.bundle.js').read_text(encoding='utf-8')

library=[{'id':'d1','title':'Direct Movie','categoryId':'movies','status':'planned','priority':'medium','progress':0,'total':1,'coverUrl':'https://example.test/direct.jpg'}]
collection_ids=[]
for i in range(1,14):
    tid=f'm{i}'
    collection_ids.append(tid)
    library.append({'id':tid,'title':f'Movie {i:02d}','categoryId':'movies','status':'planned','priority':'medium','progress':0,'total':1,'coverUrl':f'https://example.test/{tid}.jpg'})
state={
 'categories':[{'id':'movies','name':'Movies','icon':'🎬','type':'video','unit':'movies','target':1,'weight':3,'minutesPerUnit':120,'color':'#7C5CFC','seasonal':False,'enabled':True,'custom':True}],
 'categoryOrder':['movies'],'library':library,
 'collections':[{'id':'c1','title':'Thirteen Movies','description':'Pagination test','titleIds':collection_ids,'order':collection_ids,'createdAt':1,'updatedAt':1,'lastViewedAt':0,'autoBackground':True,'coverUrl':''}],
 'collectionTombstones':[],'sessions':[],
 'settings':{'categoryOrder':['movies'],'prioritizePersonalOrder':True,'exactTitleRecommendations':True},
 'orderPlan':{'titleIds':['d1'],'viewMode':'category','categoryMode':'default','categoryOrder':['movies'],'hiddenCategories':[],'modifiedAt':1,'paginateOrderedTitles':True},
 'currentTask':{'id':'task','categoryId':'movies','low':1,'high':1,'targetMid':1,'unit':'movies','createdAt':1,'reasons':['test']},'sessionActive':True,
 'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1
}

def setup_script(st):
    return f'''() => {{
      const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
      Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});
      const user={{id:'v288-user',email:'alex@example.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};
      let cloud={json.dumps(st,separators=(',',':'))};
      const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
      window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),60)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:()=>q}})}};
      window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;window.__cloudState=()=>cloud;
    }}'''

def boot(browser,st,width=1440):
    page=browser.new_page(viewport={'width':width,'height':1000})
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
    page.evaluate("App.v287AddCollectionAssignment('c1','movies')");page.wait_for_timeout(300)
    aid=page.locator('[data-assignment-id]').first.get_attribute('data-assignment-id');assert aid
    seq_before=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert seq_before[0]=='d1' and seq_before[1:]==[f'm{i}' for i in range(1,14)],seq_before

    # Default section order: regular/category queue before Collection Queue.
    order_ok=page.evaluate("""() => {const a=document.querySelector('.mf288-regular-section'),b=document.querySelector('.mf288-collection-section');return !!a&&!!b&&!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)}""")
    assert order_ok
    audit=page.evaluate("App.v288AuditState()")
    assert audit['queueView']['sectionOrder']=='regular-first',audit
    assert audit['queueView']['showRegularQueues'] and audit['queueView']['showCollectionQueues'],audit
    assert audit['detailPageSize']==10,audit

    # Direct titles inside the Collection Queue now have artwork shells.
    assert page.locator('.mf288-collection-section .mf288-direct-cover').count()>=1
    # Open button is semantic and exists on assigned Collection rows.
    assert page.locator(f'[data-assignment-id="{aid}"] button[data-v225-icon="openCollection"]').count()>=1

    # Expanded title drill-down defaults to 10 and paginates 13 titles.
    page.evaluate(f"App.v288ToggleAssignmentTitles('{aid}')");page.wait_for_timeout(100)
    assert page.locator('.mf288-collection-section .mf288-collection-title-row').count()==10
    assert page.locator('.mf288-collection-section .mf288-inner-cover').count()==10
    page.evaluate(f"App.v288SetAssignmentPage('{aid}',1)");page.wait_for_timeout(100)
    assert page.locator('.mf288-collection-section .mf288-collection-title-row').count()==3
    page.evaluate(f"App.v288SetAssignmentPageSize('{aid}',6)");page.wait_for_timeout(100)
    assert page.locator('.mf288-collection-section .mf288-collection-title-row').count()==6

    # Collections can also be mirrored into normal By Category queues.
    page.evaluate("App.v288SetQueueView('showCollectionsInRegularQueues',true)");page.wait_for_timeout(200)
    assert page.locator('.mf288-regular-section .mf288-inline-assignment').count()>=1
    inline_text=page.locator('.mf288-regular-section .mf288-inline-assignment').first.inner_text()
    assert 'Category rule' in inline_text and 'Completed titles' in inline_text and 'Open' in inline_text and ('Show titles' in inline_text or 'Hide titles' in inline_text)

    # Switch section order and independently hide/show queue families.
    page.evaluate("App.v288SetQueueView('sectionOrder','collections-first')");page.wait_for_timeout(150)
    collection_first=page.evaluate("""() => {const a=document.querySelector('.mf288-collection-section'),b=document.querySelector('.mf288-regular-section');return !!a&&!!b&&!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING)}""")
    assert collection_first
    page.evaluate("App.v288SetQueueView('showCollectionQueues',false)");page.wait_for_timeout(120)
    assert page.locator('.mf288-collection-section').count()==0 and page.locator('.mf288-regular-section').count()==1
    page.evaluate("App.v288SetQueueView('showCollectionQueues',true)");page.wait_for_timeout(120);page.evaluate("App.v288SetQueueView('showRegularQueues',false)");page.wait_for_timeout(120)
    assert page.locator('.mf288-collection-section').count()==1 and page.locator('.mf288-regular-section').count()==0
    page.evaluate("App.v288SetQueueView('showRegularQueues',true)");page.wait_for_timeout(140)
    seq_after=page.evaluate("App.v287RecommendationSequence('movies').map(x=>x.id)")
    assert seq_after==seq_before,(seq_before,seq_after)

    # Dedicated export remains v5 while carrying v288 queue-view preferences.
    exported=page.evaluate("App.v288AuditState()")
    assert exported['personalOrderExportVersion']>=5,exported
    assert exported['exportQueueView']['sectionOrder']=='collections-first'

    # Open assigned Collection goes to the actual Collection detail page.
    page.evaluate("App.v288OpenAssignedCollection('c1')");page.wait_for_timeout(350)
    body=page.locator('body').inner_text()
    assert 'Thirteen Movies' in body and 'Back to Collections' in body,body[:3000]

    # Queue-view choices persist through cloud to a fresh client.
    cloud=page.evaluate('window.__cloudState()');page.close()
    fresh=boot(b,cloud)
    fresh.evaluate("App.setView('order')");fresh.wait_for_timeout(180)
    fa=fresh.evaluate("App.v288AuditState()")
    assert fa['queueView']['sectionOrder']=='collections-first',fa
    assert fa['queueView']['showCollectionsInRegularQueues'] is True,fa
    assert fresh.locator('.mf288-regular-section .mf288-inline-assignment').count()>=1
    fresh.close();b.close()

print(json.dumps({'defaultOrder':'regular-first','titleDrilldownDefault':10,'typedPageSize':6,'openCollection':True,'inlineCollections':True,'exportVersion':exported['personalOrderExportVersion'],'freshQueueView':fa['queueView']},indent=2))
print('SMOKE V288 OK')
