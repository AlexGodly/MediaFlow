#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v240.bundle.js'
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('V232 PERF FAILED: Playwright is not installed:', e); sys.exit(1)
chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('V232 PERF FAILED: Chromium executable not found'); sys.exit(1)

bundle=BUNDLE.read_text(encoding='utf-8')
css_files=list((ROOT/'assets/css').glob('*.css'))
css_files.sort(key=lambda p:int(p.name.split('-',1)[0]) if p.name.split('-',1)[0].isdigit() else 9999)
css='\n'.join(p.read_text(encoding='utf-8') for p in css_files)
setup_js=r'''() => {
 const store={};
 const fakeStore={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear:()=>{for(const k of Object.keys(store))delete store[k]},key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});
 Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'perf-user',email:'perf@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Performance Test'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};
 window.confirm=()=>true; window.alert=()=>{}; window.prompt=()=>null;
}'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path=chromium, args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1600,'height':1100})
    errors=[]; page.on('pageerror',lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css)
    page.evaluate(setup_js)
    page.add_script_tag(content=bundle)
    page.wait_for_timeout(900)

    # Capture the internal state object through the supported runtime renderer context.
    page.evaluate(r'''() => {
      MediaFlowRuntime.registerPageRenderer('__v232_probe__',({state})=>{window.__mfState=state;return '<div>probe</div>';});
      App.setView('__v232_probe__');
    }''')
    page.wait_for_timeout(60)
    prepared=page.evaluate(r'''() => {
      const st=window.__mfState;if(!st)return false;
      const cats=(st.categories||[]).slice();
      if(!cats.length)return false;
      const statuses=['active','paused','completed','dropped','planned'];
      const priorities=['high','medium','low'];
      const rows=[];
      const N=30000;
      for(let i=0;i<N;i++){
        const c=cats[i%cats.length];
        rows.push({id:'perf-'+i,title:'Performance Title '+String(i).padStart(5,'0'),categoryId:String(c.id),status:statuses[i%statuses.length],priority:priorities[i%3],progress:i%12,total:(i%7===0?null:24),rating:i%11,createdAt:Date.now()-i});
      }
      st.library=rows;st.sessions=[];st.librarySelection={};st.libPage=0;
      st.histFilters={libSearch:'',libCategory:'all',libCategories:[],libStatus:'all',libPriority:'all',libCover:'all',libSortBase:'title',libSortDir:'asc',libSort:'title-asc'};
      st.settings.libraryPageSize=50;st.settings.libraryView='list';
      st.settings.v181Library=st.settings.v181Library||{};
      st.settings.v181Library.mode='classic';
      st.settings.v181Library.categoryOrder=cats.map(c=>String(c.id));
      st.settings.v181Library.hiddenCategoryIds=[];
      st.settings.v181Library.activeCategoryId=String(cats[0].id);
      st.settings.v181Library.activeStatus='active';
      st.settings.v181Library.statusOrder=['completed','active','paused','dropped','planned'];
      st.settings.v230ChoiceLayout=st.settings.v230ChoiceLayout||{};
      st.settings.v230ChoiceLayout.statusFilter=Object.assign({},st.settings.v230ChoiceLayout.statusFilter||{}, {source:'custom',order:['dropped','planned','paused','active','completed'],hidden:[],modifiedAt:Date.now()});
      return {count:rows.length,catCount:cats.length,firstCat:String(cats[0].id),secondCat:String(cats[1]?.id||cats[0].id)};
    }''')
    if not prepared:
        print('V232 PERF FAILED: could not prepare state'); browser.close(); sys.exit(1)

    # Normal Library: render and repeatedly toggle category filter checkboxes.
    page.evaluate("()=>{window.__mfState.settings.v181Library.mode='classic';App.setView('library')}")
    page.wait_for_timeout(250)
    normal=page.evaluate(r'''() => {
      const times=[];
      const ids=(window.__mfState.categories||[]).slice(0,6).map(c=>String(c.id));
      for(let i=0;i<ids.length;i++){
        const t=performance.now();App.v69ToggleLibraryCategory(ids[i],true);times.push(performance.now()-t);
      }
      for(let i=0;i<ids.length;i++){
        const t=performance.now();App.v69ToggleLibraryCategory(ids[i],false);times.push(performance.now()-t);
      }
      App.v232EnhanceRoot(document.querySelector('.v66-cat-filter'));const allBtn=[...document.querySelectorAll('.v66-cat-head button')].find(b=>b.textContent.trim()==='All');return {times,max:Math.max(...times),avg:times.reduce((a,b)=>a+b,0)/times.length,selected:(window.__mfState.histFilters.libCategories||[]).length,filterExists:!!document.querySelector('.v66-cat-filter'),allIconRectCount:allBtn?.querySelectorAll('.v225-btn-icon svg rect').length||0};
    }''')

    # Dynamic Library: Choice & Filter layout is intentionally conflicting;
    # rendered status row must still follow v181Library.statusOrder only.
    page.evaluate("()=>{window.__mfState.settings.v181Library.mode='dynamic';App.setView('library')}")
    page.wait_for_timeout(250)
    dynamic=page.evaluate(r'''() => {
      const labels=()=>[...document.querySelectorAll('.v181-dynamic-row')].find(r=>r.querySelector('.v181-dynamic-row-label')?.textContent.trim()==='Status')?.querySelectorAll('button')||[];
      const before=[...labels()].map(b=>b.textContent.replace(/\d+/g,'').trim().replace(/\s+/g,' '));
      const times=[];const order=['completed','active','paused','dropped','planned','completed','active','dropped'];
      for(const status of order){const t=performance.now();App.v181SelectDynamicStatus(status);times.push(performance.now()-t);}
      const after=[...labels()].map(b=>b.textContent.replace(/\d+/g,'').trim().replace(/\s+/g,' '));
      return {before,after,max:Math.max(...times),avg:times.reduce((a,b)=>a+b,0)/times.length,active:window.__mfState.settings.v181Library.activeStatus,statusFilterOrder:window.__mfState.settings.v230ChoiceLayout.statusFilter.order};
    }''')

    # Title Details: only action buttons keep global icons, wide modal should fit
    # on a normal desktop viewport without an internal scrollbar/clipped footer.
    detail=page.evaluate(r'''() => {
      const id=window.__mfState.library[0]?.id;App.v181OpenTitleDetails(id);App.v232EnhanceRoot(document.querySelector('.v181-title-details-overlay'));
      const modal=document.querySelector('.v181-title-details-modal');
      const cards=[...document.querySelectorAll('.v181-detail-card')];
      const actions=[...document.querySelectorAll('.v181-detail-actions button')];
      const heroIcons=[...document.querySelectorAll('.v181-title-hero-meta .v144-cat-icon-img,.v181-title-hero-meta .v144-cat-icon-emoji')];
      const last=actions.at(-1)?.getBoundingClientRect();const mr=modal?.getBoundingClientRect();
      return {modalWidth:Math.round(mr?.width||0),modalClientHeight:modal?.clientHeight||0,modalScrollHeight:modal?.scrollHeight||0,detailCardIcons:cards.reduce((n,c)=>n+c.querySelectorAll('.v225-btn-icon').length,0),actionCount:actions.length,actionIcons:actions.reduce((n,c)=>n+c.querySelectorAll('.v225-btn-icon').length,0),heroMetaIconsVisible:heroIcons.filter(x=>getComputedStyle(x).display!=='none').length,footerFits:!!last&&!!mr&&last.bottom<=mr.bottom+1};
    }''')

    # The same non-scrolling layout should remain usable on a narrower desktop.
    page.set_viewport_size({'width':1000,'height':820})
    compact_detail=page.evaluate(r'''() => {
      const modal=document.querySelector('.v181-title-details-modal');
      const last=[...document.querySelectorAll('.v181-detail-actions button')].at(-1)?.getBoundingClientRect();
      const mr=modal?.getBoundingClientRect();
      return {width:Math.round(mr?.width||0),clientHeight:modal?.clientHeight||0,scrollHeight:modal?.scrollHeight||0,footerFits:!!last&&!!mr&&last.bottom<=mr.bottom+1};
    }''')

    # Choice/filter inherited explanatory prose should be absent from the rendered Settings UI.
    page.evaluate("()=>App.setView('settings')"); page.wait_for_timeout(150)
    settings=page.evaluate(r'''() => {
      const text=document.body.innerText;
      const forbidden=['Order and visibility follow Library Experience → Dynamic Category Row.','Order and visibility follow Settings → Categories.','Order and visibility follow Set Priority.','Order and visibility follow Set Status.'];
      return {forbiddenPresent:forbidden.filter(x=>text.includes(x)),libraryFirst:[...document.querySelectorAll('.v221-settings-nav-group')].find(g=>g.querySelector('.v221-settings-nav-title')?.textContent.trim()==='Library')?.querySelector('.v221-settings-nav-item')?.textContent.trim()||''};
    }''')

    out={'prepared':prepared,'normal':normal,'dynamic':dynamic,'detail':detail,'compactDetail':compact_detail,'settings':settings,'pageErrors':errors}
    print(json.dumps(out,indent=2))
    fails=[]
    if errors:fails.append('page errors: '+repr(errors))
    if normal['selected']!=0:fails.append('normal category filter did not finish with zero selected categories')
    if not normal['filterExists']:fails.append('normal category filter missing')
    if normal.get('allIconRectCount')!=4:fails.append('exact All action did not receive the v232 all-items icon')
    # Keep threshold conservative for shared CI while still catching mutation/render loops.
    if normal['max']>2000:fails.append(f"normal category filter interaction too slow: {normal['max']:.1f}ms")
    if dynamic['max']>2000:fails.append(f"dynamic status interaction too slow: {dynamic['max']:.1f}ms")
    if dynamic['before'][:5]!=['Completed','Watching','On Hold','Dropped','Plan to Watch']:fails.append('dynamic status row did not follow Dynamic Status settings')
    if dynamic['statusFilterOrder']==['completed','active','paused','dropped','planned']:fails.append('test did not keep a conflicting Status Filter order')
    if detail['detailCardIcons']!=0:fails.append('Title Details metadata cards still have icons')
    if detail['actionCount']!=4 or detail['actionIcons']!=4:fails.append('Title Details four action buttons do not all keep icons')
    if detail['heroMetaIconsVisible']!=0:fails.append('Title Details hero metadata still shows category icon artwork')
    if detail['modalWidth']<1100:fails.append('Title Details modal is not widened enough on desktop')
    if not detail['footerFits']:fails.append('Title Details footer is clipped')
    if compact_detail['scrollHeight']>compact_detail['clientHeight']+1 or not compact_detail['footerFits']:fails.append('Title Details does not fit the narrower desktop viewport without internal scrolling/clipping')
    if settings['forbiddenPresent']:fails.append('removed inherited helper copy is still visible: '+repr(settings['forbiddenPresent']))
    if settings['libraryFirst']!='LIBRARY MODE':fails.append('Library Mode is not first in Settings Library group')
    browser.close()
    if fails:
        print('V232 PERF FAILED')
        for f in fails:print(' -',f)
        sys.exit(1)
    print('V232 PERF OK')
