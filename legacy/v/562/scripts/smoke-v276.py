#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index) if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v276.bundle.js').read_text(encoding='utf-8')
cats=[
 {'id':'anime','name':'Seasonal Anime','icon':'🎬','type':'video','unit':'episodes','target':4,'weight':4,'minutesPerUnit':24,'color':'#d746ff','enabled':True},
 {'id':'tv','name':'TV Series','icon':'📺','type':'video','unit':'episodes','target':2,'weight':3,'minutesPerUnit':45,'color':'#39c98a','enabled':True},
]
lib=[]
for i in range(140):
 c=cats[i%2]
 rating=[0,8.2,8.9,9.0,10.0,7.4][i%6]
 lib.append({'id':f'i{i}','title':f'Title {i:03d}','categoryId':c['id'],'progress':i%24,'total':24,'status':['active','planned','completed'][i%3],'priority':['high','medium','low'][i%3],'coverUrl':'' if i%4==0 else f'https://example.invalid/{i}.jpg','year':1990+i%30,'rating':rating,'source':'manual','runtimeMinutes':20+i%80,'seasonCount':i%6,'modifiedAt':i})
base=1791302400000
ids=[f'i{i}' for i in range(30)]
state={'categories':cats,'categoryOrder':['anime','tv'],'library':lib,'sessions':[],'collections':[{'id':'c1','title':'Prince of Tennis Franchise','description':'A curated franchise collection.','coverUrl':'','titleIds':ids,'order':ids,'autoBackground':False,'createdAt':base-10000,'updatedAt':base,'lastViewedAt':0}],'collectionTombstones':[],'settings':{'theme':'light','v238DeviceLayout':'desktop','autoUpdateCheck':False,'autoInstallUpdates':False,'backup':{'enabled':False,'interval':60,'mode':'single','folderName':'','fileName':'mediaflow-backup.json'},'leveling':{'enabled':True,'minuteXP':1,'unitXP':{},'rotationMultiplier':{},'libraryAdditionXP':25,'completionXP':50}},'activityLog':[],'currentTask':None,'sessionActive':False,'orderPlan':{'titleIds':[f'i{i}' for i in range(12)],'viewMode':'category','categoryMode':'default','categoryOrder':[],'hiddenCategories':[],'modifiedAt':0},'xpLedger':{'libraryAdditions':{}},'completionTimeline':[]}
setup=f'''() => {{
 const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{value:fake}});Object.defineProperty(window,'sessionStorage',{{value:fake}});
 const user={{id:'v276-smoke',email:'p@x.test',created_at:new Date().toISOString(),user_metadata:{{}}}};let cloud={json.dumps(state,separators=(',',':'))};
 const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async(row)=>{{await new Promise(r=>setTimeout(r,250));cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};
 window.supabase={{createClient:()=>({{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}})}},from:()=>q}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;
}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>');page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1500)
 # Personal Order covers/fallbacks
 page.evaluate("App.setView('order')");page.wait_for_timeout(120)
 picker=page.evaluate("()=>({rows:document.querySelectorAll('.mf276-picker-row').length,covers:document.querySelectorAll('.mf276-order-picker-cover').length,images:document.querySelectorAll('.mf276-order-picker-cover img').length,fallbacks:document.querySelectorAll('.mf276-order-picker-cover.fallback').length})")
 # Collections browser showcase + search focus
 page.evaluate("App.setView('collections')");page.wait_for_timeout(80)
 showcase=page.evaluate("()=>({showcase:document.querySelectorAll('.mf276-browser-showcase').length,strip:document.querySelectorAll('.mf276-showcase-strip').length,icon:document.querySelector('button[data-v225-icon=\"showcase\"]')?.dataset.v225Icon||'',sortIcon:document.querySelector('.mf274-browser-toolbar button[data-v225-icon^=\"sort\"]')?.dataset.v225Icon||''})")
 search=page.locator('#mf276-collection-search');search.click();search.press_sequentially('Prince',delay=15);page.wait_for_timeout(50)
 main_search=page.evaluate("()=>({value:document.querySelector('#mf276-collection-search')?.value,active:document.activeElement?.id,count:document.querySelectorAll('.mf276-browser-showcase').length})")
 # portrait modes
 page.evaluate("App.v274SetBrowserView('covers')");page.wait_for_timeout(60)
 portrait_cover=page.locator('.mf274-browser-cover-card .mf274-browser-cover').first.bounding_box()
 page.evaluate("App.v274SetBrowserView('compact')");page.wait_for_timeout(50);portrait_compact=page.locator('.mf274-browser-compact .mf274-browser-cover').first.bounding_box()
 page.evaluate("App.v274SetBrowserView('list')");page.wait_for_timeout(50);portrait_list=page.locator('.mf274-browser-list .mf274-browser-cover').first.bounding_box()
 # Opening collection is non-blocking even cloud write is delayed.
 open_ms=page.evaluate("()=>{const a=performance.now();App.v274OpenCollection('c1');return performance.now()-a}");page.wait_for_timeout(80)
 tools=page.evaluate("()=>({detail:!!document.querySelector('.mf274-collection-detail'),clean:!!document.querySelector('.mf276-clean-covers'),sizes:document.querySelectorAll('.mf276-size-control').length,overlaySizes:document.querySelectorAll('.mf274-cover-overlay-controls .v256-cover-size').length,orderIcon:document.querySelector('.mf274-hero-actions [data-v225-icon=\"orderList\"]')?.dataset.v225Icon||''})")
 # Covers+Titles layout is visible and title text isn't clipped to one line.
 page.evaluate("App.v274SetDetailView('covers-title')");page.wait_for_timeout(60)
 ct=page.evaluate("()=>{const t=document.querySelector('.mf274-tile-title');if(!t)return null;const s=getComputedStyle(t),r=t.getBoundingClientRect();return {whiteSpace:s.whiteSpace,overflow:s.overflow,height:r.height,text:t.textContent.trim()}}")
 # Clean covers removes collection checkboxes in cover view.
 page.evaluate("App.v276ToggleCollectionCleanCovers()");page.wait_for_timeout(60)
 clean=page.evaluate("()=>({on:App.v276AuditState().collectionCleanCovers,checks:document.querySelectorAll('.mf274-collection-tile .mf274-select-title').length})")
 # Order view exact numeric inputs.
 page.evaluate("App.v274ToggleOrderView()");page.wait_for_timeout(60)
 order=page.evaluate("()=>({numbers:document.querySelectorAll('.mf276-order-number input').length,first:document.querySelector('.mf276-order-number input')?.value||''})")
 page.evaluate("App.v276SetCollectionOrderPosition('c1','i0',5)");page.wait_for_timeout(40)
 moved=page.evaluate("()=>App.v276TestCollectionOrderIndex('c1','i0')")
 # Exact rating buckets: 8.2 and 8.9 are 8; 9.0 is not.
 ratings=page.evaluate("()=>({r82:App.v276TestRating(8.2,'8'),r89:App.v276TestRating(8.9,'8'),r90:App.v276TestRating(9,'8'),r10:App.v276TestRating(10,'10'),plus:App.v276TestNormalizeRating('8+')})")
 # Add Titles stable search, categories selected UI and semantic sort icon.
 page.evaluate("App.v274ToggleOrderView();App.v274OpenAddTitles('c1')");page.wait_for_timeout(80)
 addsearch=page.locator('#mf276-add-search');addsearch.click();addsearch.press_sequentially('Title 1',delay=15);page.wait_for_timeout(50)
 add_focus=page.evaluate("()=>({value:document.querySelector('#mf276-add-search')?.value,active:document.activeElement?.id,sortIcon:document.querySelector('#mf274-add-titles button[data-v225-icon^=\"sort\"]')?.dataset.v225Icon||''})")
 page.locator('#mf274-add-titles .mf276-add-category-filter summary').click();page.locator('#mf274-add-titles .mf276-add-category-filter input[type=checkbox]').first.check();page.wait_for_timeout(60)
 cat_ui=page.evaluate("()=>({summary:document.querySelector('#mf274-add-titles .mf276-cat-summary')?.textContent?.trim()||'',count:document.querySelector('#mf274-add-titles .mf276-cat-count')?.textContent?.trim()||''})")
 page.evaluate("App.v274CloseOverlay('mf274-add-titles')")
 # Adaptive mobile nav: more tabs when room exists, fewer on tight screens.
 page.set_viewport_size({'width':960,'height':700});page.evaluate("App.v276RefreshMobileNav()");page.wait_for_timeout(60)
 nav960=page.evaluate("()=>({tabs:document.querySelectorAll('.mobile-tabbar>.mtab').length,wraps:document.querySelectorAll('.mobile-tabbar>.mobile-more-wrap').length,all:document.querySelector('.mobile-tabbar')?.children.length||0,svg:[...document.querySelectorAll('.mobile-tabbar .mtab svg')].map(x=>x.getBoundingClientRect().width)})")
 page.set_viewport_size({'width':320,'height':700});page.evaluate("App.v276RefreshMobileNav()");page.wait_for_timeout(60)
 nav320=page.evaluate("()=>({all:document.querySelector('.mobile-tabbar')?.children.length||0,more:!!document.querySelector('.mobile-more-wrap'),scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,svg:[...document.querySelectorAll('.mobile-tabbar .mtab svg')].map(x=>x.getBoundingClientRect().width)})")
 audit=page.evaluate("()=>App.v276AuditState()")
 b.close()
res={'picker':picker,'showcase':showcase,'mainSearch':main_search,'portraitCover':portrait_cover,'portraitCompact':portrait_compact,'portraitList':portrait_list,'openMs':open_ms,'tools':tools,'coversTitles':ct,'clean':clean,'order':order,'moved':moved,'ratings':ratings,'addFocus':add_focus,'categoryUI':cat_ui,'nav960':nav960,'nav320':nav320,'audit':audit,'errors':errors}
print(json.dumps(res,indent=2))
portrait=lambda b: bool(b and b['height']>b['width']*1.2)
checks=[
 not errors,picker['rows']>0,picker['covers']==picker['rows'],picker['images']>0,picker['fallbacks']>0,
 showcase['showcase']==1,showcase['strip']==1,showcase['icon']=='showcase',showcase['sortIcon'] in ('sortAsc','sortDesc'),
 main_search['value']=='Prince' and main_search['active']=='mf276-collection-search' and main_search['count']==1,
 portrait(portrait_cover),portrait(portrait_compact),portrait(portrait_list),open_ms<120,
 tools['detail'] and tools['clean'] and tools['sizes']>=2 and tools['overlaySizes']==4 and tools['orderIcon']=='orderList',
 ct and ct['whiteSpace']=='normal' and ct['overflow']!='hidden' and ct['height']>20,
 clean['on'] and clean['checks']==0,order['numbers']>=30 and order['first']=='1',moved==4,
 ratings['r82'] and ratings['r89'] and not ratings['r90'] and ratings['r10'] and ratings['plus']=='8',
 add_focus['value']=='Title 1' and add_focus['active']=='mf276-add-search' and add_focus['sortIcon'] in ('sortAsc','sortDesc'),
 cat_ui['summary']=='Seasonal Anime' and cat_ui['count']=='1',
 nav960['all']>=7 and max(nav960['svg'] or [0])<=25,nav320['all']<=4 and nav320['more'] and nav320['scroll']<=nav320['client']+2 and max(nav320['svg'] or [0])<=25,
 audit['version']==276 and audit['pwaRelease']==276 and audit['personalOrderPickerCovers'] and audit['collectionOpeningNonBlocking'] and audit['exactRatingBuckets'] and audit['responsiveMobileNav']
]
if not all(checks):print('SMOKE V276 FAILED',checks);sys.exit(1)
print('SMOKE V276 OK')
