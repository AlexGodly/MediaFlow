#!/usr/bin/env python3
from pathlib import Path
import json, shutil, sys
try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v252 SEASONS VIEW SMOKE FAILED: Playwright unavailable:',e);sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
errors=[]
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
css=(ROOT/'assets/css/119-v252-seasons-view.css').read_text(encoding='utf-8') if (ROOT/'assets/css/119-v252-seasons-view.css').exists() else ''
for token in [
    'MediaFlow v252 — Per-title Seasons View',
    'const V252_RUNTIME_VERSION=252;',
    'function v252SyncTitleFromSeasons',
    'function v252SeasonGlobalEnd',
    'function v252ExtractImportedSeasons',
    'function v252OpenSeasonManager',
    'MediaFlowRuntime.version=V252_RUNTIME_VERSION;'
]:
    if token not in bundle: errors.append('bundle missing '+token)
if 'assets/css/119-v252-seasons-view.css' not in index: errors.append('v252 stylesheet not wired')
if './assets/css/119-v252-seasons-view.css' not in sw: errors.append('v252 stylesheet not cached by PWA')
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw: errors.append('PWA cache did not advance to v252')
for token in ['.v252-seasons-editor','.v252-log-season-box','.v252-title-seasons']:
    if token not in css: errors.append('v252 CSS missing '+token)

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
result={'version':VERSION}
if not chromium:
    errors.append('Chromium unavailable')
else:
    all_css='\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'assets/css').glob('*.css')))
    page_errors=[]
    setup_js=r'''() => {
      const store={};
      const fakeStore={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){return Object.keys(store).length}};
      Object.defineProperty(window,'localStorage',{value:fakeStore,configurable:true});Object.defineProperty(window,'sessionStorage',{value:fakeStore,configurable:true});
      const user={id:'v252-user',email:'v252@example.com',created_at:new Date().toISOString(),user_metadata:{display_name:'v252'}};
      const db=()=>{const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:null,error:null}),upsert:async()=>({data:null,error:null}),delete(){return q}};return q};
      const client={auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),getUser:async()=>({data:{user}}),signOut:async()=>({})},from:db};
      window.supabase={createClient(){return client;}};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
      const fakeWorker={state:'activated',postMessage(){},addEventListener(){},removeEventListener(){}};
      const fakeReg={scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{},addEventListener(){},removeEventListener(){}};
      const swApi={controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){},removeEventListener(){}};
      Object.defineProperty(navigator,'serviceWorker',{value:swApi,configurable:true});Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});
      window.fetch=async()=>new Response('<meta name="mediaflow-version" content="252">',{status:200,headers:{'content-type':'text/html'}});
    }'''
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"><meta name="mediaflow-version" content="252"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js);page.add_style_tag(content=all_css);page.add_script_tag(content=bundle);page.wait_for_timeout(500)
        runtime=page.evaluate('()=>MediaFlowRuntime.version');result['runtime']=runtime
        if runtime!=252: errors.append(f'runtime mismatch {runtime}')
        page.evaluate(r'''() => {MediaFlowRuntime.registerPageRenderer('__v252_probe__',({state})=>{window.__v252State=state;return '<div>probe</div>';});App.setView('__v252_probe__');}''')
        page.wait_for_timeout(50)
        category=page.evaluate("()=>window.__v252State.categories.find(c=>c.unit==='episodes')?.id||window.__v252State.categories[0]?.id")
        if not category: errors.append('could not find category for logging smoke')
        item=page.evaluate(r'''cat => {
          const s=window.__v252State;
          const item={id:'st-v252',title:'Stranger Things',categoryId:cat,progress:34,total:42,status:'active',priority:'high',estimatedMinutes:50,tags:['test'],source:'manual',createdAt:Date.now(),modifiedAt:Date.now(),seasons:[
            {id:'s1',number:1,name:'Season 1',progress:8,total:8,source:'manual',manual:true},
            {id:'s2',number:2,name:'Season 2',progress:9,total:9,source:'manual',manual:true},
            {id:'s3',number:3,name:'Season 3',progress:8,total:8,source:'manual',manual:true},
            {id:'s4',number:4,name:'Season 4',progress:9,total:9,source:'manual',manual:true},
            {id:'s5',number:5,name:'Season 5',progress:0,total:8,source:'manual',manual:true}
          ]};
          s.library.push(item);return item;
        }''',category)
        # Title details should expose Seasons View and Edit seasons.
        page.evaluate("()=>App.v181OpenTitleDetails('st-v252')");page.wait_for_timeout(50)
        details=page.locator('#v181-title-details-overlay').inner_html()
        if 'Seasons View' not in details or 'Edit seasons' not in details or 'Season 5' not in details: errors.append('Title Details Seasons View missing')
        # Quick progress edit should open season manager instead of allowing drift.
        page.evaluate("()=>App.v181QuickEditDetail('st-v252','progress')");page.wait_for_timeout(30)
        if page.locator('#v252-season-manager-overlay').count()!=1: errors.append('progress quick edit did not redirect to season manager')
        page.evaluate('()=>App.v252CloseSeasonManager()')
        # Full editor should contain editable season rows and derived read-only aggregate fields.
        page.evaluate("()=>App.openLibraryModal('st-v252')");page.wait_for_timeout(60)
        if page.locator('[data-v252-seasons-editor]').count()!=1: errors.append('Edit Title missing Seasons View editor')
        if page.locator('[data-v252-season-row]').count()<5: errors.append('Edit Title missing season rows')
        ro=page.evaluate("()=>({p:document.getElementById('l-progress')?.readOnly,t:document.getElementById('l-total')?.readOnly})")
        result['editorReadonly']=ro
        if not ro.get('p') or not ro.get('t'): errors.append('aggregate progress/total not derived/read-only while seasons exist')
        page.evaluate('()=>App.closeModal()')
        # Last progress logging should default to season view and translate S5E3 -> global 37 (+3).
        page.evaluate(r'''cat => {const s=window.__v252State;s.settings.v179LoggingModes={single:'progress',batch:'amount',modifiedAt:Date.now()};s.currentTask={categoryId:cat,targetMid:3,targetLow:1,targetHigh:5,libraryId:'st-v252',title:'Stranger Things'};s.sessionActive=true;App.openLogForm();App.selectLogTitle('st-v252');}''',category)
        page.wait_for_timeout(80)
        season_controls=page.evaluate('()=>App.v252CurrentDraftSeasonControlsHtml()')
        if 'v252-log-season-box' not in season_controls or 'Seasons View' not in season_controls: errors.append('Last progress logging missing season-view selector')
        page.evaluate("()=>App.v252SetEntryDraftSeason('s5')")
        page.evaluate("()=>App.v252SetEntryDraftSeasonEpisode(3)")
        page.evaluate('()=>App.addLogEntry()');page.wait_for_timeout(80)
        entry=page.evaluate("()=>window.__v252State.logDraft.entries[0]")
        result['entry']=entry
        if entry.get('qty')!=3 or entry.get('v179EndProgress')!=37 or entry.get('v252SeasonEpisode')!=3: errors.append(f'S5E3 translation wrong: {entry}')
        before_sessions=page.evaluate('()=>window.__v252State.sessions.length')
        page.evaluate('()=>App.submitLog()');page.wait_for_timeout(100)
        after=page.evaluate(r'''() => {const s=window.__v252State;const item=s.library.find(x=>x.id==='st-v252');const newest=s.sessions.slice().reverse().find(x=>(x.titles||[]).some(t=>t.libraryId==='st-v252'));return {progress:item.progress,total:item.total,s5:item.seasons.find(x=>x.id==='s5'),sessions:s.sessions.length,seasonMeta:newest?.titles?.find(t=>t.libraryId==='st-v252')?.season||null};}''')
        result['afterLog']=after
        if after.get('progress')!=37 or after.get('total')!=42: errors.append('title aggregate did not update to 37/42')
        if (after.get('s5') or {}).get('progress')!=3: errors.append('Season 5 progress did not update to 3')
        if after.get('sessions',0)<=before_sessions: errors.append('logging did not create History session')
        if (after.get('seasonMeta') or {}).get('episode')!=3: errors.append('History title missing season metadata')
        # Rewatch/repeat semantics: season-aware logging must remain repeat-safe and must not
        # mutate a completed title's aggregate or per-season completion state.
        page.evaluate(r'''cat => {const s=window.__v252State;const item=s.library.find(x=>x.id==='st-v252');item.progress=42;item.total=42;item.status='completed';for(const season of item.seasons)season.progress=season.total;s.currentTask={categoryId:cat,targetMid:3,targetLow:1,targetHigh:5,libraryId:'st-v252',title:'Stranger Things'};s.sessionActive=true;App.openLogForm();App.selectLogTitle('st-v252');}''',category)
        page.wait_for_timeout(60)
        page.evaluate("()=>App.v252SetEntryDraftSeason('s5')")
        page.evaluate("()=>App.v252SetEntryDraftSeasonEpisode(3)")
        page.evaluate('()=>App.addLogEntry()');page.wait_for_timeout(50)
        repeat_entry=page.evaluate("()=>window.__v252State.logDraft.entries[0]")
        result['repeatEntry']=repeat_entry
        if repeat_entry.get('isRepeat') is not True: errors.append('completed-title season log did not preserve repeat semantics')
        page.evaluate('()=>App.submitLog()');page.wait_for_timeout(90)
        repeat_after=page.evaluate(r'''() => {const s=window.__v252State;const item=s.library.find(x=>x.id==='st-v252');const newest=s.sessions.slice().reverse().find(x=>(x.titles||[]).some(t=>t.libraryId==='st-v252'));return {progress:item.progress,total:item.total,seasons:item.seasons.map(x=>({id:x.id,progress:x.progress,total:x.total})),repeat:newest?.titles?.find(t=>t.libraryId==='st-v252')?.repeat===true,seasonMeta:newest?.titles?.find(t=>t.libraryId==='st-v252')?.season||null};}''')
        result['repeatAfter']=repeat_after
        if repeat_after.get('progress')!=42 or any(x.get('progress')!=x.get('total') for x in repeat_after.get('seasons',[])): errors.append('repeat log changed completed season/title progress')
        if repeat_after.get('repeat') is not True: errors.append('History repeat flag missing after season-aware rewatch')
        if (repeat_after.get('seasonMeta') or {}).get('episode')!=3: errors.append('repeat History title missing season metadata')
        persistence=page.evaluate("()=>App.v252SeasonPersistenceAudit('st-v252')")
        result['persistence']=persistence
        if persistence.get('cloudSeasons')!=5 or persistence.get('backupSeasons')!=5 or persistence.get('exchangeSeasons')!=5: errors.append(f'season rows missing from cloud/backup/exchange persistence: {persistence}')
        if persistence.get('cloudProgress')!=42 or persistence.get('cloudTotal')!=42 or persistence.get('backupProgress')!=42 or persistence.get('backupTotal')!=42: errors.append('season-derived aggregate missing from cloud/full backup')
        if persistence.get('backupManifestSeasons') is not True: errors.append('full backup manifest does not declare v252 season coverage')
        # Import normalizer: source season metadata should be recognized.
        imported=page.evaluate(r'''() => {const r=App.v252NormalizeImportedRecord({show:{title:'Imported Show',ids:{simkl:123}},watched_episodes_count:3,total_episodes_count:8,status:'watching',seasons:[{season:1,total_episodes_count:8,watched_episodes_count:3}]},'simkl');return r;}''')
        result['imported']=imported
        if not imported.get('seasons') or imported['seasons'][0].get('progress')!=3 or imported['seasons'][0].get('total')!=8: errors.append('Simkl season metadata normalization failed')
        # Responsive sanity.
        for w,h in [(390,844),(320,700),(280,653),(820,1180)]:
            page.set_viewport_size({'width':w,'height':h});page.evaluate("()=>App.openLibraryModal('st-v252')");page.wait_for_timeout(40)
            ov=page.evaluate('()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth')
            result[f'overflow{w}']=ov
            if ov>8: errors.append(f'v252 season editor overflows at {w}px by {ov}px')
            page.evaluate('()=>App.closeModal()')
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)

print(json.dumps(result,indent=2))
if errors:
    print('v252 SEASONS VIEW SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v252 Seasons View smoke: OK')
