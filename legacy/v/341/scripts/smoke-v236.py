#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v236 SMOKE FAILED: Playwright unavailable:', e); sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v237.bundle.js'
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('v236 SMOKE FAILED: Chromium unavailable'); sys.exit(1)

css='\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'assets/css').glob('*.css'), key=lambda p: p.name))
bundle=BUNDLE.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={};
 const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});
 Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'v236-user',email:'v236@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v236'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}}; window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
}'''

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':980})
    errors=[];page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css);page.evaluate(setup_js);page.add_script_tag(content=bundle);page.wait_for_timeout(900)
    page.evaluate(r'''() => {
      MediaFlowRuntime.registerPageRenderer('__v236_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});
      App.setView('__v236_probe__');
    }''');page.wait_for_timeout(50)
    prepared=page.evaluate(r'''() => {
      const st=window.__mfState;if(!st)return false;
      const cats=[];for(let i=1;i<=25;i++)cats.push({id:'cat-'+i,name:'Category '+String(i).padStart(2,'0'),type:'anime',unit:'episodes',target:1,minutesPerUnit:24,weight:3,color:'#44aaff',enabled:true,icon:'📚'});
      st.categories=cats;
      st.library=[];for(let i=0;i<250;i++)st.library.push({id:'item-'+i,title:'Title '+i,categoryId:cats[i%cats.length].id,status:'active',priority:'medium',progress:0,total:12,createdAt:Date.now()-i});
      st.histFilters={libSearch:'',libCategory:'all',libCategories:[],libStatus:'all',libPriority:'all',libCover:'all',libSortBase:'title',libSortDir:'asc',libSort:'title-asc'};
      st.libPage=0;st.settings.libraryView='list';st.settings.libraryPageSize=30;st.settings.v181Library=st.settings.v181Library||{};st.settings.v181Library.mode='classic';
      st.settings.v230ChoiceLayout=st.settings.v230ChoiceLayout||{};
      st.settings.v230ChoiceLayout.categoryFilter={source:'custom',order:cats.map(c=>c.id).reverse(),hidden:[],pageSize:15};
      return true;
    }''')
    if not prepared:
        print('v236 SMOKE FAILED: state preparation failed');b.close();sys.exit(1)
    page.evaluate("()=>App.setView('library')");page.wait_for_timeout(250)

    initial=page.evaluate(r'''() => {
      const d=document.querySelector('[data-v236-library-category-filter]');
      d.open=true;d.dispatchEvent(new Event('toggle'));
      const rows=[...d.querySelectorAll('.v236-category-filter-option')];
      return {runtime:MediaFlowRuntime.version,pageSize:MediaFlowRuntime.getSettings().v230ChoiceLayout.categoryFilter.pageSize,rowCount:rows.length,first:rows[0]?.textContent.trim()||'',pager:!!d.querySelector('.v236-category-filter-pager'),open:d.open,search:!!d.querySelector('.v236-category-filter-search')};
    }''')

    page.fill('.v236-category-filter-search','Category 02');page.wait_for_timeout(60)
    searched=page.evaluate(r'''() => {const d=document.querySelector('[data-v236-library-category-filter]');return {open:d.open,rows:[...d.querySelectorAll('.v236-category-filter-option')].map(x=>x.textContent.trim()),pager:!!d.querySelector('.v236-category-filter-pager')};}''')

    # clear search, toggle two categories; dropdown must survive Library rerenders
    page.fill('.v236-category-filter-search','');page.wait_for_timeout(40)
    page.locator('.v236-category-filter-option input').nth(0).check();page.wait_for_timeout(100)
    after_one=page.evaluate(r'''() => ({open:document.querySelector('[data-v236-library-category-filter]')?.open,selected:window.__mfState.histFilters.libCategories.slice(),summary:document.querySelector('.v236-category-filter-summary')?.textContent.trim()||''})''')
    page.locator('.v236-category-filter-option input').nth(1).check();page.wait_for_timeout(100)
    after_two=page.evaluate(r'''() => ({open:document.querySelector('[data-v236-library-category-filter]')?.open,selected:window.__mfState.histFilters.libCategories.slice(),summary:document.querySelector('.v236-category-filter-summary')?.textContent.trim()||''})''')

    # update setting and verify 5-per-page behavior
    page.evaluate("()=>App.v236SetCategoryFilterPageSize(5)");page.wait_for_timeout(180)
    page.evaluate("()=>{const d=document.querySelector('[data-v236-library-category-filter]');d.open=true;d.dispatchEvent(new Event('toggle'))}")
    paged=page.evaluate(r'''() => {const d=document.querySelector('[data-v236-library-category-filter]');return {pageSize:MediaFlowRuntime.getSettings().v230ChoiceLayout.categoryFilter.pageSize,rows:d.querySelectorAll('.v236-category-filter-option').length,pager:!!d.querySelector('.v236-category-filter-pager'),pagerText:d.querySelector('.v236-category-filter-pager')?.textContent.replace(/\s+/g,' ').trim()||''};}''')

    # Settings control exists and reflects persisted value.
    page.evaluate("()=>App.setView('settings')");page.wait_for_timeout(180)
    settings=page.evaluate(r'''() => ({control:!!document.querySelector('input[aria-label="Category Filter categories per page"]'),value:Number(document.querySelector('input[aria-label="Category Filter categories per page"]')?.value||0)})''')
    b.close()

fails=[]
if errors:fails.extend('pageerror: '+e for e in errors)
if initial['runtime']!=237:fails.append('runtime version is not 237')
if initial['pageSize']!=15:fails.append('default configured page size is not 15')
if initial['rowCount']!=15:fails.append(f"expected 15 rows on first page, got {initial['rowCount']}")
if 'Category 25' not in initial['first']:fails.append('Category Filter did not respect configured reverse order')
if not initial['pager']:fails.append('pagination missing with 25 categories / page size 15')
if not initial['search']:fails.append('search input missing')
if len(searched['rows'])!=1 or 'Category 02' not in searched['rows'][0]:fails.append('search did not narrow to Category 02')
if searched['pager']:fails.append('pagination should disappear for one search result')
if not after_one['open'] or not after_two['open']:fails.append('Category Filter closed after category selection')
if len(after_two['selected'])!=2:fails.append('multi-select did not retain two selected categories')
if paged['pageSize']!=5 or paged['rows']!=5 or not paged['pager']:fails.append('configured 5 categories/page did not take effect')
if not settings['control'] or settings['value']!=5:fails.append('Settings Category Filter page-size control missing or stale')

print(json.dumps({'initial':initial,'searched':searched,'afterOne':after_one,'afterTwo':after_two,'paged':paged,'settings':settings,'pageErrors':errors},indent=2))
if fails:
    print('v236 SMOKE FAILED');[print('-',x) for x in fails];sys.exit(1)
print('v236 SMOKE OK')
