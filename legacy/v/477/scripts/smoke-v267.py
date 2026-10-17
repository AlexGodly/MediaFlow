#!/usr/bin/env python3
from pathlib import Path
import json,re,sys,shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text(encoding='utf-8')
css_paths=re.findall(r'<link rel="stylesheet" href="([^"]+\.css)"',index)
css='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in css_paths if (ROOT/p).exists())
bundle=(ROOT/'assets/js/mediaflow-v267.bundle.js').read_text(encoding='utf-8')
setup=r'''() => {
 const store={};const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v267-smoke',email:'v267@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Alex'}};
 let cloud=null,updatedAt=null;
 const q={
   select(){return q},eq(){return q},
   maybeSingle:async()=>({data:cloud===null?null:{state_data:cloud,updated_at:updatedAt},error:null}),
   upsert:async(row)=>{cloud=row.state_data;updatedAt=row.updated_at||new Date().toISOString();return {data:null,error:null}},
   delete(){return q}
 };
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:()=>q};
 window.__mf267Cloud=()=>cloud;
 window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium: print('Chromium not found');sys.exit(1)
errors=[];results={}

def mount(page):
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.set_content('<!doctype html><html><head></head><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup);page.add_script_tag(content=bundle);page.wait_for_timeout(1300)

def add_title(page,title,cover=''):
    page.evaluate("()=>App.setView('library')");page.wait_for_timeout(120)
    page.evaluate("()=>App.openLibraryModal()")
    page.fill('#l-title',title)
    if cover and page.locator('#l-cover').count(): page.fill('#l-cover',cover)
    page.evaluate("()=>App.saveLibraryModal('')")
    page.wait_for_timeout(280)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1200,'height':900});mount(page)
    results['runtime']=page.evaluate('()=>window.MediaFlowRuntime?.version||0')

    # Canonical verification helper: undefined in-memory keys disappear in cloud JSON.
    results['canonical_equivalence']=page.evaluate("""()=>{
      const expected={library:[{id:'x',title:'Example',optional:undefined}]};
      const cloud=JSON.parse(JSON.stringify(expected));
      return App.v267EquivalentField(cloud,expected,['library'])===true;
    }""")

    # Add two titles; normal autosave creates a cloud row for subsequent protected Sync Now.
    add_title(page,'Missing Cover V267')
    add_title(page,'Has Cover V267','https://example.com/cover.jpg')
    page.wait_for_timeout(900)

    # Protected sync should complete with canonical readback, not false "Library content" mismatch.
    page.evaluate('()=>App.syncNow()')
    try: page.wait_for_function("()=>document.body.innerText.includes('Sync complete')||document.body.innerText.includes('Sync failed safely')",timeout=10000)
    except Exception: pass
    progress_text=page.locator('body').inner_text()
    results['sync_verified']='Sync complete' in progress_text and 'Library content' not in progress_text and 'Sync failed safely' not in progress_text

    # Latest Today's Balance is the only stable implementation on first load/navigation.
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(30)
    immediate=page.evaluate("()=>({latest:document.querySelectorAll('.mf265-balance-card').length,old:document.querySelectorAll('.v261-balance-card:not(.mf265-balance-card),.mf264-balance-card:not(.mf265-balance-card)').length})")
    results['balance_first_paint']=immediate['latest']==1 and immediate['old']==0 and 'v267RenderShellBase' in bundle

    # Personal Order category panel is portaled to body and bounded to viewport/content area.
    page.evaluate("()=>App.setView('order')");page.wait_for_timeout(350)
    details=page.locator('.v237-category-filter').first
    if details.count():
        details.locator('summary').click();page.wait_for_timeout(240)
        panel=page.locator('body > .mf267-order-category-portal').first
        if panel.count():
            box=panel.bounding_box();side=page.locator('.sidebar').bounding_box();vw=page.viewport_size['width']
            safe=(side['x']+side['width'] if side else 0)
            results['order_portal']=bool(box and box['x']>=safe-1 and box['x']+box['width']<=vw+1)
        else: results['order_portal']=False
    else: results['order_portal']=False

    # Dynamic Library cover filter: optimized rows must be filtered after v241.
    page.evaluate("()=>App.setView('library')");page.wait_for_timeout(250)
    page.evaluate("()=>App.v181SetLibraryMode('dynamic')");page.wait_for_timeout(300)
    page.evaluate("()=>App.v181SelectDynamicStatus('planned')");page.wait_for_timeout(250)
    dyn_buttons=page.locator('.v181-dynamic-row button[onclick*="v181SelectDynamicCategory"]')
    if dyn_buttons.count(): dyn_buttons.first.click();page.wait_for_timeout(250)
    page.evaluate("()=>App.v224SetLibraryCoverFilter('missing')");page.wait_for_timeout(180)
    missing_rows=page.evaluate("()=>App.v267DynamicRowsDebug().map(x=>x.title)")
    page.evaluate("()=>App.v224SetLibraryCoverFilter('has')");page.wait_for_timeout(180)
    has_rows=page.evaluate("()=>App.v267DynamicRowsDebug().map(x=>x.title)")
    results['dynamic_cover_filter']=('Missing Cover V267' in missing_rows and 'Has Cover V267' not in missing_rows and 'Has Cover V267' in has_rows and 'Missing Cover V267' not in has_rows)

    overflow=[]
    for view in ['dashboard','library','order']:
        for w in [1440,1024,820,390,320,280]:
            page.set_viewport_size({'width':w,'height':900});page.evaluate(f"()=>App.setView('{view}')");page.wait_for_timeout(120)
            dims=page.evaluate('()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,bw:document.body.scrollWidth,iw:innerWidth})')
            if dims['sw']>dims['cw']+2 or dims['bw']>dims['iw']+2: overflow.append([view,w,dims])
    results['overflow']=overflow
    browser.close()

required=(results.get('runtime')==267 and results.get('canonical_equivalence') and results.get('sync_verified') and results.get('balance_first_paint') and results.get('order_portal') and results.get('dynamic_cover_filter') and not results.get('overflow'))
print(json.dumps(results,indent=2))
if errors: print('PAGE ERRORS:',errors)
if not required or errors:
    print('SMOKE V267 FAILED');sys.exit(1)
print('SMOKE V267 OK')
