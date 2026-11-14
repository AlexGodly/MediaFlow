#!/usr/bin/env python3
from pathlib import Path
import json,re,shutil,sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('PLAYWRIGHT UNAVAILABLE',e);sys.exit(2)
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css='\n'.join((ROOT/m.group(1)).read_text(encoding='utf-8') for m in re.finditer(r'<link rel="stylesheet" href="([^"]+\.css)">',index) if (ROOT/m.group(1)).exists())
bundle=(ROOT/'assets/js/mediaflow-v291.bundle.js').read_text(encoding='utf-8')
names=[
 ('seasonal','Seasonal Anime','episodes',30),('missed','Missed Anime','episodes',30),('finished','Finished Anime','episodes',30),('anime-movies','Anime Movies','episodes',120),
 ('manga','Manhwa / Manhua / Manga','chapters',15),('movies','Movies','episodes',120),('tv','TV Series','episodes',70),('anime-backlog','Anime Backlog','episodes',30),
 ('anime-movies-backlog','Anime Movies Backlog','episodes',120),('manga-backlog','Manga Backlog','chapters',15),('tv-backlog','TV Series Backlog','episodes',70),('movies-backlog','Movies Backlog','episodes',120),
 ('books','Books','pages',2),('books-backlog','Books Backlog','pages',2),('novels','Novels','pages',2),('novels-backlog','Novels Backlog','pages',2),
 ('magazines','Magazines','pages',2),('magazines-backlog','Magazines Backlog','pages',2),('online','Online Media','items',15),('online-backlog','Online Media Backlog','items',15),
 ('comics','Comics','issues',20),('comics-backlog','Comics Backlog','issues',20)
]
cats=[]
for i,(cid,name,unit,mins) in enumerate(names):
    cats.append({'id':cid,'name':name,'icon':'📚','iconUrl':'','type':'video','unit':unit,'target':3,'weight':1,'minutesPerUnit':mins,'color':'#888888','seasonal':False,'enabled':True,'custom':True})
order=[c['id'] for c in cats]
choice={
 'modifiedAt':1,
 'setCategory':{'source':'custom','order':order,'hidden':['anime-backlog']},
 'setStatus':{'source':'custom','order':['planned','active','paused','completed','dropped'],'hidden':[]},
 'setPriority':{'source':'custom','order':['medium','high','low'],'hidden':[]},
 'categoryFilter':{'source':'custom','order':order,'hidden':[]},
 'statusFilter':{'source':'custom','order':['active','paused','completed','dropped','planned'],'hidden':[]},
 'priorityFilter':{'source':'custom','order':['high','medium','low'],'hidden':[]}
}
state={'categories':cats,'categoryOrder':order,'library':[{'id':'t1','title':'Selector Test Anime','categoryId':'movies','status':'planned','priority':'medium','progress':2,'total':12,'rating':None,'tags':[]}], 'collections':[],'collectionTombstones':[],'sessions':[],'settings':{'categoryOrder':order,'v230ChoiceLayout':choice,'v290ApplyCategoryVisibilityToTitleEditing':False},'orderPlan':{'titleIds':[],'viewMode':'category','categoryMode':'default','categoryOrder':order,'hiddenCategories':[],'modifiedAt':1},'currentTask':None,'sessionActive':True,'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1}
def setup(st):
    return f'''() => {{const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});const user={{id:'u',email:'a@b.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(st,separators=(',',':'))};const mk=()=>{{const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async row=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};return q}};window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),40)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:mk}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('CHROMIUM UNAVAILABLE');sys.exit(2)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1200,'height':820})
    page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
    page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1000)
    audit=page.evaluate('App.v291AuditState()')
    assert audit['version']==291 and audit['categorySearch'] and audit['genericCategoryActionIcons'] is False,audit

    # Add/Edit selector: search + no duplicate action icons.
    page.evaluate("App.openLibraryModal('t1')");page.wait_for_timeout(180)
    trig=page.locator('.mf290-category-trigger')
    assert trig.count()==1
    trig.click();page.wait_for_timeout(120)
    add=page.evaluate('''() => {const p=document.querySelector('.mf291-category-popover');const s=p.querySelector('.mf291-category-search');const rows=[...p.querySelectorAll('.mf291-category-option')];return {search:!!s,count:rows.length,triggerActionIcon:!!document.querySelector('.mf291-category-trigger > .v225-btn-icon'),rowActionIcons:rows.filter(r=>r.querySelector(':scope > .v225-btn-icon')).length,context:p.dataset.context,rect:(()=>{const r=p.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()};}''')
    assert add['search'] and add['count']==22 and add['triggerActionIcon'] is False and add['rowActionIcons']==0,add
    page.locator('.mf291-category-search').fill('manga backlog');page.wait_for_timeout(80)
    add_search=page.evaluate('''() => ({visible:[...document.querySelectorAll('.mf291-category-option')].filter(x=>!x.hidden).map(x=>x.textContent.replace(/\\s+/g,' ').trim()),count:document.querySelector('.mf291-category-search-count')?.textContent})''')
    assert len(add_search['visible'])==1 and 'Manga Backlog' in add_search['visible'][0],add_search

    # Quick Edit selector: wide multi-column panel; all 22 fit at desktop without scrolling.
    page.evaluate('App.v290CloseCategoryMenu()');page.evaluate('App.closeModal()');page.wait_for_timeout(100)
    page.evaluate("App.v181QuickEditDetail('t1','categoryId')");page.wait_for_timeout(120)
    page.locator('.mf290-category-trigger').click();page.wait_for_timeout(140)
    quick=page.evaluate('''() => {const p=document.querySelector('.mf291-category-popover');const o=p.querySelector('.mf291-category-options');const rows=[...p.querySelectorAll('.mf291-category-option')];const pr=p.getBoundingClientRect();const or=o.getBoundingClientRect();return {search:!!p.querySelector('.mf291-category-search'),count:rows.length,context:p.dataset.context,placement:p.dataset.placement,columns:getComputedStyle(o).gridTemplateColumns.split(' ').length,scrollHeight:o.scrollHeight,clientHeight:o.clientHeight,noScroll:o.scrollHeight<=o.clientHeight+1,rowActionIcons:rows.filter(r=>r.querySelector(':scope > .v225-btn-icon')).length,rect:[pr.left,pr.top,pr.right,pr.bottom],optionsRect:[or.left,or.top,or.right,or.bottom]};}''')
    assert quick['search'] and quick['count']==22 and quick['context']=='quick-details' and quick['columns']>=2 and quick['noScroll'] and quick['rowActionIcons']==0,quick
    assert quick['rect'][0]>=0 and quick['rect'][1]>=0 and quick['rect'][2]<=1201 and quick['rect'][3]<=821,quick
    page.screenshot(path=str(ROOT/'v291-quick-edit-preview.png'),full_page=False)
    page.locator('.mf291-category-search').fill('tv series');page.wait_for_timeout(80)
    qsearch=page.evaluate('''() => ({visible:[...document.querySelectorAll('.mf291-category-option')].filter(x=>!x.hidden).map(x=>x.textContent.replace(/\\s+/g,' ').trim()),count:document.querySelector('.mf291-category-search-count')?.textContent})''')
    assert len(qsearch['visible'])==2 and all('TV Series' in x for x in qsearch['visible']),qsearch

    # 360px remains contained; scrolling is allowed only because the physical viewport is too small.
    page.evaluate('App.v290CloseCategoryMenu()');page.set_viewport_size({'width':360,'height':700});page.wait_for_timeout(100)
    page.locator('.mf290-category-trigger').click();page.wait_for_timeout(100)
    mobile=page.evaluate('''() => {const p=document.querySelector('.mf291-category-popover');const r=p.getBoundingClientRect();const o=p.querySelector('.mf291-category-options');return {rect:[r.left,r.top,r.right,r.bottom],columns:getComputedStyle(o).gridTemplateColumns.split(' ').length,search:!!p.querySelector('.mf291-category-search')};}''')
    assert mobile['search'] and mobile['rect'][0]>=0 and mobile['rect'][2]<=361 and mobile['rect'][1]>=0 and mobile['rect'][3]<=701,mobile

    print(json.dumps({'audit':audit,'addEdit':add,'addSearch':add_search,'quick':quick,'quickSearch':qsearch,'mobile':mobile},indent=2))
    print('RESPONSIVE V291 OK')
    b.close()
