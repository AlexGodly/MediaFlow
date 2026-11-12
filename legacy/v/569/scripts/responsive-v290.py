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
bundle=(ROOT/'assets/js/mediaflow-v290.bundle.js').read_text(encoding='utf-8')
cats=[
 {'id':'seasonal','name':'Seasonal Anime','icon':'🌸','iconUrl':'assets/category-icons/seasonal-anime.png','type':'video','unit':'episodes','target':3,'weight':3,'minutesPerUnit':30,'color':'#ff5a8a','seasonal':True,'enabled':True,'custom':True},
 {'id':'backlog','name':'Anime Backlog','icon':'🔖','iconUrl':'assets/category-icons/anime-backlog.png','type':'video','unit':'episodes','target':3,'weight':2,'minutesPerUnit':30,'color':'#ff80aa','seasonal':False,'enabled':True,'custom':True},
 {'id':'movies','name':'Movies','icon':'🎬','iconUrl':'assets/category-icons/movies.png','type':'video','unit':'movies','target':1,'weight':2,'minutesPerUnit':120,'color':'#7c5cfc','seasonal':False,'enabled':True,'custom':True},
 {'id':'finished','name':'Finished Anime','icon':'✅','iconUrl':'assets/category-icons/finished-anime.png','type':'video','unit':'episodes','target':3,'weight':1,'minutesPerUnit':30,'color':'#59d68c','seasonal':False,'enabled':True,'custom':True},
]
choice={
 'modifiedAt':1,
 'setCategory':{'source':'custom','order':['seasonal','backlog','finished','movies'],'hidden':['backlog']},
 'setStatus':{'source':'custom','order':['planned','active','paused','completed','dropped'],'hidden':[]},
 'setPriority':{'source':'custom','order':['medium','high','low'],'hidden':[]},
 'categoryFilter':{'source':'custom','order':['seasonal','backlog','finished','movies'],'hidden':[]},
 'statusFilter':{'source':'custom','order':['active','paused','completed','dropped','planned'],'hidden':[]},
 'priorityFilter':{'source':'custom','order':['high','medium','low'],'hidden':[]}
}
state={'categories':cats,'categoryOrder':['seasonal','backlog','finished','movies'],'library':[{'id':'t1','title':'Selector Test Anime','categoryId':'movies','status':'planned','priority':'medium','progress':2,'total':12,'rating':None,'tags':[]}], 'collections':[],'collectionTombstones':[],'sessions':[],'settings':{'categoryOrder':['seasonal','backlog','finished','movies'],'v230ChoiceLayout':choice,'v290ApplyCategoryVisibilityToTitleEditing':False},'orderPlan':{'titleIds':[],'viewMode':'category','categoryMode':'default','categoryOrder':['seasonal','backlog','finished','movies'],'hiddenCategories':[],'modifiedAt':1},'currentTask':None,'sessionActive':True,'profilePicture':'','activityLog':[],'migrations':{},'savedAt':1}
def setup(st):
    return f'''() => {{const store={{}};const fake={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear(){{}},key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};Object.defineProperty(window,'localStorage',{{configurable:true,value:fake}});Object.defineProperty(window,'sessionStorage',{{configurable:true,value:fake}});const user={{id:'u',email:'a@b.test',created_at:new Date().toISOString(),user_metadata:{{display_name:'Alex'}}}};let cloud={json.dumps(st,separators=(',',':'))};const mk=()=>{{const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:{{state_data:cloud,updated_at:new Date().toISOString()}},error:null}}),upsert:async row=>{{cloud=row.state_data;return {{error:null}}}},delete(){{return q}}}};return q}};window.supabase={{createClient:()=>({{auth:{{getSession:()=>new Promise(r=>setTimeout(()=>r({{data:{{session:{{user}}}}}}),40)),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}},error:null}})}},from:mk}})}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;}}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('CHROMIUM UNAVAILABLE');sys.exit(2)
with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':820,'height':700})
    page.set_content(f'<!doctype html><html><head><style>{css}</style></head><body><div id="app"></div></body></html>')
    page.evaluate(setup(state));page.add_script_tag(content=bundle);page.wait_for_timeout(1000)
    audit=page.evaluate('App.v290AuditState()')
    assert audit['version']==290 and audit['editorShowsHiddenByDefault'] is True, audit
    # Add/Edit title selector
    page.evaluate("App.openLibraryModal('t1')");page.wait_for_timeout(180)
    assert page.locator('.mf290-category-trigger').count()==1
    page.locator('.mf290-category-trigger').click();page.wait_for_timeout(80)
    addedit=page.evaluate('''() => {const p=document.querySelector('.mf290-category-popover'),a=document.querySelector('.modal-actions');const r=p.getBoundingClientRect(),ar=a?.getBoundingClientRect();return {count:p.querySelectorAll('.mf290-category-option').length,hidden:[...p.querySelectorAll('.mf290-category-option')].some(x=>x.textContent.includes('Anime Backlog')),rect:[r.left,r.top,r.right,r.bottom],actions:ar?[ar.left,ar.top,ar.right,ar.bottom]:null,bg:getComputedStyle(p).backgroundColor,bodyChild:p.parentElement===document.body};}''')
    assert addedit['count']==4 and addedit['hidden'] and addedit['bodyChild'],addedit
    assert addedit['rect'][0]>=0 and addedit['rect'][2]<=821 and addedit['rect'][1]>=0 and addedit['rect'][3]<=701,addedit
    # Quick edit selector must not cover its footer.
    page.evaluate('App.closeModal()');page.wait_for_timeout(100)
    page.evaluate("App.v181QuickEditDetail('t1','categoryId')");page.wait_for_timeout(120)
    page.locator('.mf290-category-trigger').click();page.wait_for_timeout(80)
    quick=page.evaluate('''() => {const p=document.querySelector('.mf290-category-popover'),a=document.querySelector('.v181-quick-detail-actions');const r=p.getBoundingClientRect(),ar=a.getBoundingClientRect();return {count:p.querySelectorAll('.mf290-category-option').length,placement:p.dataset.placement,overlap:!(r.bottom<=ar.top||r.top>=ar.bottom||r.right<=ar.left||r.left>=ar.right),rect:[r.left,r.top,r.right,r.bottom],actions:[ar.left,ar.top,ar.right,ar.bottom]};}''')
    assert quick['count']==4 and quick['overlap'] is False,quick
    # Opt in: hidden backlog disappears (current Movies remains).
    page.evaluate('App.v290CloseCategoryMenu()');page.evaluate('App.v290SetEditorCategoryVisibility(true)');page.wait_for_timeout(120)
    page.evaluate('App.v181CloseQuickDetail()');page.evaluate("App.v181QuickEditDetail('t1','categoryId')");page.wait_for_timeout(120);page.locator('.mf290-category-trigger').click();page.wait_for_timeout(60)
    opted=page.evaluate('''() => {const p=document.querySelector('.mf290-category-popover');return {count:p.querySelectorAll('.mf290-category-option').length,hasBacklog:[...p.querySelectorAll('.mf290-category-option')].some(x=>x.textContent.includes('Anime Backlog')),audit:App.v290AuditState()};}''')
    assert opted['count']==3 and opted['hasBacklog'] is False and opted['audit']['applyCategoryVisibilityToTitleEditing'] is True,opted
    # Settings note/toggle is present in Set Category controls.
    page.evaluate('App.v290CloseCategoryMenu()');page.evaluate('App.v181CloseQuickDetail()');page.evaluate("App.setView('settings')");page.wait_for_timeout(250)
    settings=page.evaluate('''() => ({note:!!document.querySelector('.mf290-editor-visibility-setting'),label:document.querySelector('.mf290-editor-visibility-toggle')?.textContent.trim()||'',checked:document.querySelector('.mf290-editor-visibility-toggle input')?.checked})''')
    assert settings['note'] and 'Apply Set Category visibility to title editing' in settings['label'] and settings['checked'] is True, settings
    print(json.dumps({'audit':audit,'addEdit':addedit,'quick':quick,'optedIn':opted,'settings':settings},indent=2))
    print('RESPONSIVE V290 OK')
    b.close()
