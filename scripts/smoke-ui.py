#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys

ROOT=Path(__file__).resolve().parents[1]
BUNDLE=ROOT/'assets/js/mediaflow-v226.bundle.js'
CSS222=ROOT/'assets/css/93-v222-dashboard-rendering-stability.css'
CSS=ROOT/'assets/css/92-v221-settings-polish.css'
CSS224=ROOT/'assets/css/94-v224-library-sorting-actions.css'
CSS225=ROOT/'assets/css/95-v225-icons-personal-order.css'
CSS226=ROOT/'assets/css/96-v226-semantic-ui-library.css'
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('SMOKE FAILED: Playwright is not installed:', e)
    sys.exit(1)

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
if not chromium:
    print('SMOKE FAILED: Chromium executable not found')
    sys.exit(1)

bundle=BUNDLE.read_text(encoding='utf-8')
css=CSS.read_text(encoding='utf-8')
css222=CSS222.read_text(encoding='utf-8')
css224=CSS224.read_text(encoding='utf-8')
css225=CSS225.read_text(encoding='utf-8')
css226=CSS226.read_text(encoding='utf-8')
setup_js=r'''() => {
 const store={};
 const fakeStore={
   getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,
   setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]},
   clear:()=>{for(const k of Object.keys(store))delete store[k]},
   key:i=>Object.keys(store)[i]||null,
   get length(){return Object.keys(store).length}
 };
 Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});
 Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
 const user={id:'smoke-user',email:'smoke@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'Smoke Test'}};
 const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
 const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
 window.supabase={createClient(){return client;}};
 window.confirm=()=>true; window.alert=()=>{}; window.prompt=()=>null;
}'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path=chromium, args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1600,'height':1100})
    errors=[]
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    page.set_content('<!doctype html><html><body><div id="app"></div></body></html>')
    page.add_style_tag(content=css)
    page.add_style_tag(content=css222)
    page.add_style_tag(content=css224)
    page.add_style_tag(content=css225)
    page.add_style_tag(content=css226)
    page.evaluate(setup_js)
    page.add_script_tag(content=bundle)
    page.wait_for_timeout(900)
    page.evaluate("()=>App.setView('settings')")
    page.wait_for_timeout(450)
    result=page.evaluate(r'''() => {
      const groups=[...document.querySelectorAll('.v221-settings-nav-group')].map(g=>({
        title:g.querySelector('.v221-settings-nav-title')?.textContent.trim()||'',
        items:[...g.querySelectorAll('.v221-settings-nav-item')].map(x=>x.textContent.trim())
      }));
      const pageGroups=[...document.querySelectorAll('.v221-settings-page-group')].map(g=>({
        title:g.querySelector('h2')?.textContent.trim()||'',
        sections:[...g.querySelectorAll('.section-label')].filter(x=>!x.closest('.card')).map(x=>{
          const c=x.cloneNode(true); c.querySelectorAll('button').forEach(b=>b.remove()); return c.textContent.trim().replace(/\s+/g,' ');
        })
      }));
      const labels=[...document.querySelectorAll('.v221-settings-content .section-label')].filter(x=>!x.closest('.card'));
      const normalized=labels.map(x=>{
        const c=x.cloneNode(true); c.querySelectorAll('button').forEach(b=>b.remove()); return c.textContent.trim().replace(/\s+/g,' ');
      });
      const requestedNoDefault=['DAILY GOAL','TITLE RECOMMENDATIONS','MEDIAFLOW SYSTEM','SCHEDULER TUNING','LEVELING & XP','AUTOMATIC BACKUPS'];
      const defaultLeak=requestedNoDefault.filter(name=>{
        const el=labels.find(x=>{const c=x.cloneNode(true);c.querySelectorAll('button').forEach(b=>b.remove());return c.textContent.trim().replace(/\s+/g,' ')===name;});
        return !el || [...el.querySelectorAll('button')].some(b=>/^Default$/i.test(b.textContent.trim()));
      });
      const searchRect=document.querySelector('.v221-settings-search-control')?.getBoundingClientRect();
      const restoreRect=document.querySelector('.v221-restore-all')?.getBoundingClientRect();
      const nav=document.querySelector('.v221-settings-nav');
      return {
        runtimeVersion:window.MediaFlowRuntime?.version||0,
        settingsRegistered:window.MediaFlowRuntime?.hasPageRenderer?.('settings')===true,
        settingsPage:!!document.querySelector('.v221-settings-page'),
        searchExists:!!document.getElementById('v221-settings-search'),
        searchPlaceholder:document.getElementById('v221-settings-search')?.getAttribute('placeholder')||'',
        ctrlKVisible:document.body.innerText.includes('Ctrl K'),
        navGroups:groups,
        pageGroups,
        resetButtons:document.querySelectorAll('.v221-setting-reset,.v221-section-reset').length,
        restoreAllExists:[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Restore all defaults'),
        restoreAligned:!!searchRect&&!!restoreRect&&Math.abs(searchRect.top-restoreRect.top)<=2&&restoreRect.height>=50,
        categoriesFirstInLibrary:groups.find(g=>g.title==='Library')?.items?.[0]==='CATEGORIES',
        noOtherGroup:!groups.some(g=>g.title==='Other'),
        noStatisticsGroup:!groups.some(g=>g.title==='Statistics'),
        expectedGroupOrder:JSON.stringify(groups.map(g=>g.title))===JSON.stringify(['Library','Interface','Appearance','MediaFlow System','Progression','Data & Sync','Updates']),
        interfaceOrder:JSON.stringify(groups.find(g=>g.title==='Interface')?.items||[])===JSON.stringify(['NAVIGATION','DASHBOARD SETTINGS','STATISTICS SETTINGS']),
        updatesLast:groups.at(-1)?.title==='Updates'&&JSON.stringify(groups.at(-1)?.items||[])===JSON.stringify(['APP UPDATES']),
        groupOrderMatches:JSON.stringify(groups.map(g=>g.title))===JSON.stringify(pageGroups.map(g=>g.title)),
        interfacePageOrder:JSON.stringify(pageGroups.find(g=>g.title==='Interface')?.sections||[])===JSON.stringify(['NAVIGATION','DASHBOARD SETTINGS','STATISTICS SETTINGS']),
        updatesPageLast:pageGroups.at(-1)?.title==='Updates'&&JSON.stringify(pageGroups.at(-1)?.sections||[])===JSON.stringify(['APP UPDATES']),
        librarySectionOrderMatches:JSON.stringify(groups.find(g=>g.title==='Library')?.items||[])===JSON.stringify((pageGroups.find(g=>g.title==='Library')?.sections||[]).map(x=>x==='DEFAULT LOGGING METHOD'?'LOGGING METHOD':x)),
        libraryIntegrityClean:normalized.includes('LIBRARY INTEGRITY')&&!normalized.some(x=>x.includes('🛠')),
        defaultLeak,
        pageHasCategoriesFirst:(pageGroups.find(g=>g.title==='Library')?.sections||[])[0]==='CATEGORIES',
        desktopScrollbarWidth:nav?getComputedStyle(nav).scrollbarWidth:''
      };
    }''')
    search=page.evaluate(r'''() => {
      const before=[...document.querySelectorAll('.v221-settings-nav-item')].filter(b=>!b.classList.contains('v221-settings-hidden')).length;
      App.v221SearchSettings('cover');
      const after=[...document.querySelectorAll('.v221-settings-nav-item')].filter(b=>!b.classList.contains('v221-settings-hidden')).length;
      const clearVisible=!document.getElementById('v221-settings-clear')?.hidden;
      return {before,after,searchFilters:after>0&&after<before,clearVisible};
    }''')
    result.update(search)
    v226_settings=page.evaluate(r'''() => {
      const categoryRow=document.querySelector('.settings-categories-full .cat-manage-row');
      const categoryCard=document.querySelector('.settings-categories-full .card');
      const pos=categoryRow?.querySelector('.v157-position-input');
      const del=categoryRow?.querySelector('.cat-delete-btn');
      const drag=categoryRow?.querySelector('.cat-drag-handle');
      const cardRect=categoryCard?.getBoundingClientRect();
      const delRect=del?.getBoundingClientRect();
      const navItems=[...document.querySelectorAll('.v221-settings-nav-item')];
      const selects=[...document.querySelectorAll('select:not([multiple])')];
      return {
        categoryPositionWidth:pos?Math.round(pos.getBoundingClientRect().width):0,
        categoryDeleteInside:!!cardRect&&!!delRect&&delRect.right<=cardRect.right+1,
        categoryDragHasNoIcon:!!drag&&!drag.querySelector('.v225-btn-icon'),
        settingsNavIconCoverage:navItems.length>0&&navItems.every(x=>!!x.querySelector('.v225-btn-icon')),
        settingsDropdownIconCoverage:selects.length===0||selects.every(x=>!!x.dataset.v226DropdownIcon),
        dynamicCategoryIconSetting:!!document.querySelector('select[aria-label="Dynamic Library category row icons"]'),
        dynamicCategoryIconDefault:document.documentElement.dataset.v226DynamicCategoryIcons||''
      };
    }''')
    result.update(v226_settings)
    page.evaluate("()=>App.v221ClearSettingsSearch()")
    page.evaluate("()=>App.updateSetting('dailyMinutes',999)")
    page.wait_for_timeout(250)
    result['changedSetting']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().dailyMinutes===999")
    page.evaluate("()=>App.v221ResetSettingPath('dailyMinutes','Daily minutes')")
    page.wait_for_timeout(250)
    result['individualResetWorks']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().dailyMinutes===window.MediaFlowRuntime.getDefaultSettings().dailyMinutes")
    page.evaluate("()=>App.updateSetting('tasksPerDay',99)")
    page.wait_for_timeout(200)
    page.evaluate("()=>App.v221RestoreAllDefaults()")
    page.wait_for_timeout(300)
    result['restoreAllWorks']=page.evaluate("()=>window.MediaFlowRuntime.getSettings().tasksPerDay===window.MediaFlowRuntime.getDefaultSettings().tasksPerDay")

    # v223 Dashboard Settings: On This Day sits directly below Today's Balance.
    page.evaluate("()=>App.setView('settings')")
    page.wait_for_timeout(250)
    v223_settings=page.evaluate(r'''() => {
      const rows=[...document.querySelectorAll('.v192-dashboard-toggle-row')];
      const labels=rows.map(r=>r.querySelector('b')?.textContent.trim()||'');
      return {
        dashboardToggleLabels:labels,
        onThisDayToggleExists:labels.includes('On This Day'),
        onThisDayUnderTodayBalance:labels.indexOf('On This Day')===labels.indexOf("Today's Balance")+1,
        onThisDayDefault:window.MediaFlowRuntime.getDefaultSettings()?.v192Dashboard?.showOnThisDay===true,
        onThisDayInitiallyVisible:App.v223IsOnThisDayVisible()===true
      };
    }''')
    result.update(v223_settings)
    page.evaluate("()=>App.v192ToggleDashboardSection('showOnThisDay')")
    page.wait_for_timeout(220)
    result['onThisDayToggleHides']=page.evaluate("()=>App.v223IsOnThisDayVisible()===false && window.MediaFlowRuntime.getSettings()?.v192Dashboard?.showOnThisDay===false")
    page.evaluate("()=>App.v221ResetSettingPath('v192Dashboard.showOnThisDay','On This Day')")
    page.wait_for_timeout(220)
    result['onThisDayIndividualResetWorks']=page.evaluate("()=>App.v223IsOnThisDayVisible()===true && window.MediaFlowRuntime.getSettings()?.v192Dashboard?.showOnThisDay===true")

    # Responsive horizontal Settings navigation: still scrollable, but scrollbar hidden.
    page.set_viewport_size({'width':760,'height':900})
    page.wait_for_timeout(250)
    mobile=page.evaluate(r'''() => {
      const nav=document.querySelector('.v221-settings-nav');
      if(!nav)return {};
      const s=getComputedStyle(nav);
      return {
        mobileDisplay:s.display,
        mobileOverflowX:s.overflowX,
        mobileScrollbarWidth:s.scrollbarWidth,
        mobileScrollable:nav.scrollWidth>nav.clientWidth
      };
    }''')
    result.update(mobile)

    # v222 regression probe: the hidden On This Day body must be completely out
    # of paint while collapsed, and v159 rows must no longer use content-visibility:auto.
    page.set_viewport_size({'width':1200,'height':900})
    page.evaluate("()=>App.setView('dashboard')")
    page.wait_for_timeout(180)
    dash=page.evaluate(r'''() => {
      const host=document.createElement('div');
      host.id='v222-paint-probe';
      host.innerHTML='<details class="on-this-day v126-otd"><summary class="v126-otd-summary"><div class="v159-otd-summary-cover-slot"><img class="v126-otd-summary-cover" alt="probe"></div><span>Probe</span></summary><div class="v126-otd-body"><div class="v126-otd-row v159-otd-row"><img class="v126-otd-row-cover" alt="hidden probe"></div></div></details><div class="today-strip"></div>';
      document.body.appendChild(host);
      App.v222StabilizeDashboardPaint();
      const details=host.querySelector('.v126-otd');
      const body=host.querySelector('.v126-otd-body');
      const row=host.querySelector('.v159-otd-row');
      const strip=host.querySelector('.today-strip');
      const collapsed={
        paintGuard:details.dataset.mfPaintGuard,
        bodyDisplay:getComputedStyle(body).display,
        rowContentVisibility:getComputedStyle(row).contentVisibility,
        detailsContain:getComputedStyle(details).contain,
        detailsIsolation:getComputedStyle(details).isolation,
        stripIsolation:getComputedStyle(strip).isolation
      };
      details.open=true;
      details.dispatchEvent(new Event('toggle'));
      const openBodyDisplay=getComputedStyle(body).display;
      host.remove();
      return {...collapsed,openBodyDisplay};
    }''')
    result.update({
      'dashboardPaintGuard':dash.get('paintGuard'),
      'collapsedOtdBodyDisplay':dash.get('bodyDisplay'),
      'otdRowContentVisibility':dash.get('rowContentVisibility'),
      'otdPaintContain':dash.get('detailsContain'),
      'otdIsolation':dash.get('detailsIsolation'),
      'todayStripIsolation':dash.get('stripIsolation'),
      'openOtdBodyDisplay':dash.get('openBodyDisplay')
    })

    # v224 Library controls + page names.
    page.evaluate("()=>App.setView('library')")
    page.wait_for_timeout(250)
    v224_library=page.evaluate(r'''() => ({
      emptyLibraryButton:[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Empty library'),
      addTitleButtons:[...document.querySelectorAll('.view-head button')].filter(b=>b.textContent.includes('Add title')).length,
      coverFilter:!!document.querySelector('.v224-cover-filter'),
      coverFilterOptions:[...document.querySelectorAll('.v224-cover-filter option')].map(o=>o.textContent.trim()),
      librarySort:document.querySelector('[data-v224-sort-scope="library"] select')?.value||'',
      librarySortDir:document.querySelector('[data-v224-sort-scope="library"] .v224-sort-direction')?.textContent.trim().replace(/\s+/g,' ')||''
    })''')
    result.update(v224_library)
    page.evaluate("()=>App.v181SetLibraryMode('dynamic')")
    page.wait_for_timeout(260)
    v226_dynamic=page.evaluate(r'''() => {
      const modeBtn=[...document.querySelectorAll('.v181-library-mode-switch button')].find(b=>b.textContent.trim()==='Dynamic');
      const rows=[...document.querySelectorAll('.v181-dynamic-row')];
      const catRow=rows.find(r=>(r.querySelector('.v181-dynamic-row-label')?.textContent||'').trim()==='Category');
      const statusRow=rows.find(r=>(r.querySelector('.v181-dynamic-row-label')?.textContent||'').trim()==='Status');
      const display=[...document.querySelectorAll('.v181-display-switch button')].map(b=>b.textContent.trim());
      const catButtons=[...(catRow?.querySelectorAll('button')||[])];
      const statusButtons=[...(statusRow?.querySelectorAll('button')||[])];
      const coverControl=document.getElementById('v181-cover-range-library');
      const titleControl=document.querySelector('.v188-title-text-control input[type="range"]');
      return {
        dynamicModeIcon:!!modeBtn?.querySelector('.v225-btn-icon'),
        dynamicModeSemanticIcon:modeBtn?.dataset.v226SemanticIcon||'',
        dynamicCategoryGlobalIconsRemoved:catButtons.length>0&&catButtons.every(b=>!b.querySelector('.v225-btn-icon')),
        dynamicStatusSemanticIcons:statusButtons.length>=5&&statusButtons.every(b=>!!b.querySelector('.v225-btn-icon')),
        dynamicStatusIconNames:statusButtons.map(b=>[b.textContent.trim(),b.dataset.v226SemanticIcon||'']),
        dynamicStatusSemanticNamesExact:['watching','onHold','completedStatus','dropped','planToWatch'].every((name,i)=>statusButtons[i]?.dataset.v226SemanticIcon===name),
        coverTitlesLabel:display.includes('Cover+Titles'),
        dynamicCoverControl:!!coverControl,
        dynamicTitleControl:!!titleControl,
        dynamicLibraryMarker:!!document.querySelector('.v226-dynamic-library')
      };
    }''')
    result.update(v226_dynamic)
    page.evaluate("()=>App.setView('order')")
    page.wait_for_timeout(220)
    result['personalOrderTitle']=page.locator('h1').first.text_content().strip() if page.locator('h1').count() else ''
    result['personalOrderSort']=page.locator('select[aria-label="Personal Order Add Titles sort field"]').input_value() if page.locator('select[aria-label="Personal Order Add Titles sort field"]').count() else ''
    result['personalOrderSortDir']=' '.join(page.locator('button[aria-label="Personal Order Add Titles sort direction"]').inner_text().split()) if page.locator('button[aria-label="Personal Order Add Titles sort direction"]').count() else ''
    result['personalOrderFilterLabels']=page.evaluate("()=>[...document.querySelectorAll('.v225-order-filter-label')].map(x=>x.textContent.trim())")
    result['personalOrderClearIcon']=page.evaluate("()=>!![...document.querySelectorAll('#v140-order-picker-tools button')].find(b=>b.textContent.trim()==='Clear filters')?.querySelector('.v225-btn-icon')")
    result['personalOrderAllTitlesIcon']=page.evaluate("()=>!![...document.querySelectorAll('.v138-order-switch button')].find(b=>b.textContent.trim()==='All Titles')?.querySelector('.v225-btn-icon')")
    page.evaluate("()=>App.setView('profile')")
    page.wait_for_timeout(180)
    result['accountTitle']=page.locator('.view-title').first.text_content().strip() if page.locator('.view-title').count() else ''
    result['accountButtonIcons']=page.evaluate("()=>document.querySelectorAll('.profile-card .v225-btn-icon').length")
    result['accountEmailMinHeight']=page.evaluate("()=>getComputedStyle(document.querySelector('#profile-email')).minHeight") if page.locator('#profile-email').count() else ''
    result['navPersonalOrder']=page.evaluate("()=>[...document.querySelectorAll('.nav-item')].some(x=>x.textContent.trim()==='Personal Order')")
    result['navAccount']=page.evaluate("()=>[...document.querySelectorAll('.nav-item')].some(x=>x.textContent.trim()==='Account')")
    page.evaluate("()=>App.setView('about')")
    page.wait_for_timeout(180)
    result['aboutButtonIcons']=page.evaluate("()=>document.querySelectorAll('.v161-about-links .v225-btn-icon').length")
    page.evaluate("()=>App.setView('batch')")
    page.wait_for_timeout(220)
    result['batchSort']=page.locator('select[aria-label="Batch Log sort field"]').input_value() if page.locator('select[aria-label="Batch Log sort field"]').count() else ''
    result['batchSortDir']=' '.join(page.locator('button[aria-label="Batch Log sort direction"]').inner_text().split()) if page.locator('button[aria-label="Batch Log sort direction"]').count() else ''
    # Start a Dashboard session and verify logging browser sorting is immediately visible.
    page.evaluate("()=>App.setView('dashboard')")
    page.wait_for_timeout(180)
    page.evaluate("()=>App.startSession()")
    page.wait_for_timeout(220)
    page.evaluate("()=>App.openLogForm()")
    page.wait_for_timeout(220)
    result['dashboardLogSort']=page.locator('select[aria-label="Dashboard logging sort field"]').input_value() if page.locator('select[aria-label="Dashboard logging sort field"]').count() else ''
    result['dashboardLogSortDir']=' '.join(page.locator('button[aria-label="Dashboard logging sort direction"]').inner_text().split()) if page.locator('button[aria-label="Dashboard logging sort direction"]').count() else ''
    result['dashboardActionIcons']=page.evaluate("()=>document.querySelectorAll('.v224-rec-action svg').length")
    browser.close()

required={
    'runtimeVersion':226,
    'settingsRegistered':True,
    'settingsPage':True,
    'searchExists':True,
    'ctrlKVisible':False,
    'restoreAllExists':True,
    'restoreAligned':True,
    'searchFilters':True,
    'clearVisible':True,
    'changedSetting':True,
    'individualResetWorks':True,
    'restoreAllWorks':True,
    'onThisDayToggleExists':True,
    'onThisDayUnderTodayBalance':True,
    'onThisDayDefault':True,
    'onThisDayInitiallyVisible':True,
    'onThisDayToggleHides':True,
    'onThisDayIndividualResetWorks':True,
    'categoriesFirstInLibrary':True,
    'noOtherGroup':True,
    'noStatisticsGroup':True,
    'expectedGroupOrder':True,
    'interfaceOrder':True,
    'updatesLast':True,
    'groupOrderMatches':True,
    'interfacePageOrder':True,
    'updatesPageLast':True,
    'librarySectionOrderMatches':True,
    'libraryIntegrityClean':True,
    'pageHasCategoriesFirst':True,
    'categoryDeleteInside':True,
    'categoryDragHasNoIcon':True,
    'settingsNavIconCoverage':True,
    'settingsDropdownIconCoverage':True,
    'dynamicCategoryIconSetting':True,
    'dynamicCategoryIconDefault':'none',
    'mobileOverflowX':'auto',
    'mobileScrollbarWidth':'none',
    'mobileScrollable':True,
    'dashboardPaintGuard':'222',
    'collapsedOtdBodyDisplay':'none',
    'otdRowContentVisibility':'visible',
    'otdIsolation':'isolate',
    'todayStripIsolation':'isolate',
    'openOtdBodyDisplay':'block',
    'emptyLibraryButton':False,
    'addTitleButtons':1,
    'coverFilter':True,
    'coverFilterOptions':['All covers','Has cover','Missing cover'],
    'librarySort':'title',
    'librarySortDir':'↑ ASC',
    'dynamicModeIcon':True,
    'dynamicModeSemanticIcon':'dynamicLibrary',
    'dynamicCategoryGlobalIconsRemoved':True,
    'dynamicStatusSemanticIcons':True,
    'dynamicStatusSemanticNamesExact':True,
    'coverTitlesLabel':True,
    'dynamicCoverControl':True,
    'dynamicTitleControl':True,
    'dynamicLibraryMarker':True,
    'personalOrderTitle':'Personal Order',
    'personalOrderSort':'title',
    'personalOrderSortDir':'↑ ASC',
    'personalOrderFilterLabels':['Categories','Sort by','Direction','Status','Priority'],
    'personalOrderClearIcon':True,
    'personalOrderAllTitlesIcon':True,
    'accountTitle':'Account',
    'navPersonalOrder':True,
    'navAccount':True,
    'batchSort':'title',
    'batchSortDir':'↑ ASC',
    'dashboardLogSort':'title',
    'dashboardLogSortDir':'↑ ASC',
}
fail=[]
for k,v in required.items():
    if result.get(k)!=v: fail.append(f'{k}: expected {v!r}, got {result.get(k)!r}')
if result.get('categoryPositionWidth',0)<54: fail.append(f"Category order input is still too narrow: {result.get('categoryPositionWidth')}px")
if result.get('desktopScrollbarWidth')=='none': fail.append('desktop Settings navigator scrollbar was hidden; it should remain available')
if len(result.get('navGroups',[]))<6: fail.append('organized Settings navigation did not render enough groups')
if result.get('resetButtons',0)<10: fail.append('per-setting/section reset controls did not render')
if result.get('accountButtonIcons',0)<5: fail.append('Account action buttons did not receive enough v225 icons')
if result.get('aboutButtonIcons',0)<5: fail.append('About action buttons did not receive v225 icons')
if result.get('accountEmailMinHeight')!='44px': fail.append(f"Account field polish missing: expected 44px min-height, got {result.get('accountEmailMinHeight')!r}")
if result.get('defaultLeak'): fail.append('native Default button/text still present in: '+', '.join(result['defaultLeak']))
if 'feature, or section' not in result.get('searchPlaceholder',''): fail.append('Settings search placeholder changed unexpectedly')
if errors: fail.extend(f'browser page error: {e}' for e in errors)
print(json.dumps(result,indent=2))
if fail:
    print('UI SMOKE FAILED')
    for x in fail: print('-',x)
    sys.exit(1)
print('UI SMOKE OK')
