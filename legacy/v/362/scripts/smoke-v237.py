#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v237 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v237.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v237 SMOKE FAILED: Chromium unavailable'); sys.exit(1)

css_files=sorted((ROOT/'assets/css').glob('*.css'),key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files)
bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={};
 const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});
 Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v237-user',email:'v237@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v237'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}}; window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''

def probe(page,surface):
    return page.evaluate("""surface => {
      const d=document.querySelector(`[data-v237-category-filter="${surface}"]`);
      if(!d)return {exists:false};
      d.open=true;d.dispatchEvent(new Event('toggle'));
      const rows=[...d.querySelectorAll('.v236-category-filter-option')];
      return {exists:true,open:d.open,rows:rows.length,first:rows[0]?.textContent.trim()||'',search:!!d.querySelector('.v236-category-filter-search'),pager:!!d.querySelector('.v236-category-filter-pager')};
    }""",surface)

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':980})
    errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(900)
    page.evaluate(r'''() => {
      MediaFlowRuntime.registerPageRenderer('__v237_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});
      App.setView('__v237_probe__');
    }''');page.wait_for_timeout(50)
    prepared=page.evaluate(r'''() => {
      const st=window.__mfState;if(!st)return false;
      const cats=[];for(let i=1;i<=25;i++)cats.push({id:'cat-'+i,name:'Category '+String(i).padStart(2,'0'),type:'anime',unit:'episodes',target:1,minutesPerUnit:24,weight:3,color:'#44aaff',enabled:true,icon:'📚'});
      st.categories=cats;
      st.library=[];for(let i=0;i<250;i++)st.library.push({id:'item-'+i,title:'Title '+i,categoryId:cats[i%cats.length].id,status:'active',priority:'medium',progress:i%12,total:12,createdAt:Date.now()-i});
      st.settings.v230ChoiceLayout=st.settings.v230ChoiceLayout||{};
      st.settings.v230ChoiceLayout.categoryFilter={source:'custom',order:cats.map(c=>c.id).reverse(),hidden:[],pageSize:15};
      st.settings.v181Library=st.settings.v181Library||{};st.settings.v181Library.mode='classic';
      return true;
    }''')
    if not prepared:
        print('v237 SMOKE FAILED: state preparation failed');b.close();sys.exit(1)

    # Personal Order
    page.evaluate("()=>App.setView('order')");page.wait_for_timeout(220)
    order_initial=probe(page,'order')
    page.fill('[data-v237-category-filter="order"] .v236-category-filter-search','Category 02');page.wait_for_timeout(40)
    order_search=page.evaluate(r'''() => {const d=document.querySelector('[data-v237-category-filter="order"]');return {rows:[...d.querySelectorAll('.v236-category-filter-option')].map(x=>x.textContent.trim()),pager:!!d.querySelector('.v236-category-filter-pager')};}''')
    page.fill('[data-v237-category-filter="order"] .v236-category-filter-search','');page.wait_for_timeout(30)
    page.locator('[data-v237-category-filter="order"] .v236-category-filter-option input').nth(0).check();page.wait_for_timeout(90)
    page.locator('[data-v237-category-filter="order"] .v236-category-filter-option input').nth(1).check();page.wait_for_timeout(90)
    order_after=page.evaluate(r'''() => {const d=document.querySelector('[data-v237-category-filter="order"]');return {open:d?.open||false,checked:d?.querySelectorAll('.v236-category-filter-option input:checked').length||0,summary:d?.querySelector('summary')?.textContent.trim()||''};}''')

    # Shared page-size setting should apply to every new surface.
    page.evaluate("()=>App.v236SetCategoryFilterPageSize(5)");page.wait_for_timeout(170)
    order_paged=probe(page,'order')

    # Batch Log
    page.evaluate("()=>App.setView('batch')");page.wait_for_timeout(220)
    batch_initial=probe(page,'batch')
    page.fill('[data-v237-category-filter="batch"] .v236-category-filter-search','Category 03');page.wait_for_timeout(40)
    batch_search=page.evaluate(r'''() => {const d=document.querySelector('[data-v237-category-filter="batch"]');return {rows:[...d.querySelectorAll('.v236-category-filter-option')].map(x=>x.textContent.trim()),pager:!!d.querySelector('.v236-category-filter-pager')};}''')
    page.fill('[data-v237-category-filter="batch"] .v236-category-filter-search','');page.wait_for_timeout(30)
    page.locator('[data-v237-category-filter="batch"] .v236-category-filter-option input').nth(0).check();page.wait_for_timeout(100)
    batch_after=page.evaluate(r'''() => {const d=document.querySelector('[data-v237-category-filter="batch"]');return {open:d?.open||false,checked:d?.querySelectorAll('.v236-category-filter-option input:checked').length||0};}''')

    # Dashboard Logging
    page.evaluate("()=>App.setView('dashboard')");page.wait_for_timeout(180)
    page.evaluate("()=>App.startSession()");page.wait_for_timeout(180)
    page.evaluate("()=>App.openLogForm()");page.wait_for_timeout(220)
    log_initial=probe(page,'logging')
    page.fill('[data-v237-category-filter="logging"] .v236-category-filter-search','Category 04');page.wait_for_timeout(40)
    log_search=page.evaluate(r'''() => {const d=document.querySelector('[data-v237-category-filter="logging"]');return {rows:[...d.querySelectorAll('.v236-category-filter-option')].map(x=>x.textContent.trim()),pager:!!d.querySelector('.v236-category-filter-pager')};}''')
    page.fill('[data-v237-category-filter="logging"] .v236-category-filter-search','');page.wait_for_timeout(30)
    page.locator('[data-v237-category-filter="logging"] .v236-category-filter-option input').nth(0).check();page.wait_for_timeout(100)
    log_after=page.evaluate(r'''() => {const d=document.querySelector('[data-v237-category-filter="logging"]');return {open:d?.open||false,checked:d?.querySelectorAll('.v236-category-filter-option input:checked').length||0};}''')

    runtime=page.evaluate('()=>MediaFlowRuntime.version')
    page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(160)
    help_text=page.evaluate(r'''() => document.querySelector('.v236-category-filter-page-size-setting small')?.textContent.trim() || ""''')
    b.close()

fails=[]
if errors:fails.extend('pageerror: '+e for e in errors)
if runtime!=237:fails.append(f'runtime version is {runtime}, expected 237')
for name,val in [('order',order_initial),('batch',batch_initial),('logging',log_initial)]:
    if not val.get('exists'):fails.append(f'{name} category filter missing')
    if val.get('rows') not in (15,5):fails.append(f'{name} unexpected initial row count {val.get("rows")}')
    if 'Category 25' not in val.get('first',''):fails.append(f'{name} did not respect configured reverse category order')
    if not val.get('search'):fails.append(f'{name} search input missing')
if order_initial.get('rows')!=15:fails.append('Personal Order did not start with default 15 categories/page')
if len(order_search.get('rows',[]))!=1 or 'Category 02' not in order_search['rows'][0]:fails.append('Personal Order category search failed')
if order_search.get('pager'):fails.append('Personal Order pager should hide for one search result')
if not order_after.get('open') or order_after.get('checked',0)<2:fails.append('Personal Order dropdown did not stay open / multi-select')
if order_paged.get('rows')!=5 or not order_paged.get('pager'):fails.append('Personal Order did not adopt shared 5/page setting')
if batch_initial.get('rows')!=5 or not batch_initial.get('pager'):fails.append('Batch Log did not adopt shared 5/page setting')
if len(batch_search.get('rows',[]))!=1 or 'Category 03' not in batch_search['rows'][0]:fails.append('Batch Log category search failed')
if not batch_after.get('open') or batch_after.get('checked',0)<1:fails.append('Batch Log dropdown closed / selection failed')
if log_initial.get('rows')!=5 or not log_initial.get('pager'):fails.append('Dashboard logging did not adopt shared 5/page setting')
if len(log_search.get('rows',[]))!=1 or 'Category 04' not in log_search['rows'][0]:fails.append('Dashboard logging category search failed')
if not log_after.get('open') or log_after.get('checked',0)<1:fails.append('Dashboard logging dropdown closed / selection failed')
if not all(x in help_text for x in ['Personal Order','Batch Log','Dashboard logging']):fails.append('shared page-size Settings help text not updated')

print(json.dumps({'runtime':runtime,'orderInitial':order_initial,'orderSearch':order_search,'orderAfter':order_after,'orderPaged':order_paged,'batchInitial':batch_initial,'batchSearch':batch_search,'batchAfter':batch_after,'loggingInitial':log_initial,'loggingSearch':log_search,'loggingAfter':log_after,'settingsHelp':help_text,'pageErrors':errors},indent=2))
if fails:
    print('v237 SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v237 SMOKE OK')
