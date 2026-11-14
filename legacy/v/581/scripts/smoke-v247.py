#!/usr/bin/env python3
from pathlib import Path
import json
import shutil
import sys

try:
    from playwright.sync_api import sync_playwright
except Exception as e:
    print('v247 PWA SMOKE FAILED: Playwright unavailable:',e)
    sys.exit(1)

ROOT=Path(__file__).resolve().parents[1]
VERSION=int((ROOT/'VERSION').read_text(encoding='utf-8').strip())
errors=[]
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
bundle=(ROOT/f'assets/js/mediaflow-v{VERSION}.bundle.js').read_text(encoding='utf-8')
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
css247=(ROOT/'assets/css/116-v247-pwa-reliability-diagnostics.css').read_text(encoding='utf-8') if (ROOT/'assets/css/116-v247-pwa-reliability-diagnostics.css').exists() else ''

if VERSION<247: errors.append(f'expected VERSION >=247, got {VERSION}')
if 'assets/css/116-v247-pwa-reliability-diagnostics.css' not in index: errors.append('v247 diagnostics CSS is not wired')
if f'assets/js/mediaflow-v{VERSION}.bundle.js' not in index: errors.append('current bundle is not wired')
if f'mediaflow-pwa-v{VERSION}-shell-v1' not in sw: errors.append('service worker cache does not match VERSION')
for token in ['Promise.allSettled','GET_DIAGNOSTICS','RETRY_APP_SHELL_CACHE','async function cacheShellAssets']:
    if token not in sw: errors.append('service worker missing '+token)
if 'cache.addAll(APP_SHELL' in sw: errors.append('service worker still uses all-or-nothing cache.addAll(APP_SHELL)')
for token in ['function v247RunPwaDiagnostics','function v247RepairPwaCache','MediaFlowRuntime.version=V247_RUNTIME_VERSION;']:
    if token not in bundle: errors.append('bundle missing '+token)
for token in ['.v247-pwa-diagnostics','.v247-diag-row','.v247-diag-actions']:
    if token not in css247: errors.append('v247 CSS missing '+token)
if manifest.get('start_url')!='./' or manifest.get('scope')!='./': errors.append('manifest lost GitHub Pages-relative start/scope')
if manifest.get('display')!='standalone': errors.append('manifest display is not standalone')

# Extract the generated app-shell list for a deterministic mocked runtime test.
import re
m=re.search(r'const APP_SHELL=\[(.*?)\];',sw,re.S)
app_shell=[]
if m:
    try: app_shell=json.loads('['+m.group(1).replace("'",'"')+']')
    except Exception: pass
if not app_shell: errors.append('could not parse APP_SHELL from service worker')

chromium=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
result={'static':{'version':VERSION,'shellCount':len(app_shell),'faultTolerant':'Promise.allSettled' in sw,'workerDiagnostics':'GET_DIAGNOSTICS' in sw,'workerRepair':'RETRY_APP_SHELL_CACHE' in sw}}

if not chromium:
    errors.append('Chromium unavailable')
else:
    css='\n'.join(p.read_text(encoding='utf-8') for p in sorted((ROOT/'assets/css').glob('*.css')))
    setup_payload=json.dumps({'version':VERSION,'manifest':manifest,'appShell':app_shell})
    setup_js=f'''() => {{
      const cfg={setup_payload};
      const store={{}};
      const fakeStore={{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k],clear:()=>Object.keys(store).forEach(k=>delete store[k]),key:i=>Object.keys(store)[i]||null,get length(){{return Object.keys(store).length}}}};
      Object.defineProperty(window,'localStorage',{{value:fakeStore,configurable:true}});Object.defineProperty(window,'sessionStorage',{{value:fakeStore,configurable:true}});
      const user={{id:'v247-user',email:'v247@example.com',created_at:new Date().toISOString(),user_metadata:{{display_name:'v247'}}}};
      const db=()=>{{const q={{select(){{return q}},eq(){{return q}},maybeSingle:async()=>({{data:null,error:null}}),upsert:async()=>({{data:null,error:null}}),delete(){{return q}}}};return q}};
      const client={{auth:{{getSession:async()=>({{data:{{session:{{user}}}}}}),onAuthStateChange:()=>({{data:{{subscription:{{unsubscribe(){{}}}}}}}}),getUser:async()=>({{data:{{user}}}}),signOut:async()=>({{}})}},from:db}};
      window.supabase={{createClient(){{return client;}}}};window.confirm=()=>true;window.alert=()=>{{}};window.prompt=()=>null;

      const fakeWorker={{state:'activated',postMessage(message,ports){{
        const port=ports?.[0]; if(!port)return;
        if(message?.type==='GET_DIAGNOSTICS') port.postMessage({{type:'MEDIAFLOW_SW_DIAGNOSTICS',version:cfg.version,cacheName:`mediaflow-pwa-v${{cfg.version}}-shell-v1`,shellCount:cfg.appShell.length,cachedCount:cfg.appShell.length,missingCached:[],appShell:cfg.appShell}});
        else if(message?.type==='RETRY_APP_SHELL_CACHE') port.postMessage({{type:'MEDIAFLOW_SW_CACHE_RESULT',version:cfg.version,cacheName:`mediaflow-pwa-v${{cfg.version}}-shell-v1`,shellCount:cfg.appShell.length,cachedCount:cfg.appShell.length,missingCached:[],appShell:cfg.appShell,retried:{{ok:true,cached:cfg.appShell,failed:[]}}}});
      }}}};
      const fakeReg={{scope:'https://mediaflow.test/',active:fakeWorker,waiting:null,installing:null,update:async()=>{{}},addEventListener(){{}}}};
      window.__v247FakeReg=fakeReg;window.__v247FakeWorker=fakeWorker;
      const swApi={{controller:fakeWorker,register:async()=>fakeReg,getRegistration:async()=>fakeReg,ready:Promise.resolve(fakeReg),addEventListener(){{}}}};
      Object.defineProperty(navigator,'serviceWorker',{{value:swApi,configurable:true}});
      Object.defineProperty(window,'isSecureContext',{{value:true,configurable:true}});

      const manifestBody=JSON.stringify(cfg.manifest);
      window.fetch=async(input)=>{{
        const u=String(typeof input==='string'?input:input?.url||'');
        if(u.includes('manifest.json'))return new Response(manifestBody,{{status:200,headers:{{'content-type':'application/manifest+json'}}}});
        if(u.includes('sw.js'))return new Response('service worker',{{status:200,headers:{{'content-type':'application/javascript'}}}});
        return new Response('ok',{{status:200,headers:{{'content-type':u.endsWith('.png')?'image/png':'text/plain'}}}});
      }};
    }}'''
    page_errors=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':390,'height':844})
        page=context.new_page(); page.on('pageerror',lambda exc: page_errors.append(str(exc)))
        # Use an HTTPS <base> for relative PWA URLs while avoiding network navigation,
        # which is blocked in some CI/container sandboxes.
        page.set_content('<!doctype html><html><head><base href="https://mediaflow.test/"></head><body><div id="app"></div></body></html>')
        page.evaluate(setup_js)
        page.add_style_tag(content=css)
        page.add_script_tag(content=bundle)
        page.evaluate('()=>{window.MediaFlowPWA.state.registration=window.__v247FakeReg;window.MediaFlowPWA.state.offlineReady=true;}')
        page.wait_for_timeout(800)

        runtime=page.evaluate('()=>window.MediaFlowRuntime?.version')
        pwa_api=page.evaluate("()=>({diag:typeof App?.v247RunPwaDiagnostics,repair:typeof App?.v247RepairPwaCache,settings:typeof App?.v244PwaSettingsHtml,mediaDiag:typeof window.MediaFlowPWA?.diagnostics})")
        if runtime!=VERSION: errors.append(f'runtime {runtime}, expected {VERSION}')
        if pwa_api!={'diag':'function','repair':'function','settings':'function','mediaDiag':'function'}: errors.append('v247 PWA API incomplete: '+repr(pwa_api))

        diag=page.evaluate(r'''async()=>{
          const r=await App.v247RunPwaDiagnostics({silent:true,expand:false});
          return {status:r?.status,failures:r?.failures,warnings:r?.warnings,workerVersion:r?.workerVersion,cachedCount:r?.cachedCount,shellCount:r?.shellCount,failedAssets:r?.failedAssets||[],checks:r?.checks||[]};
        }''')
        result['diagnostics']=diag
        if diag.get('failures'): errors.append('diagnostics reported failures: '+repr(diag.get('failedAssets') or diag.get('checks')))
        if diag.get('workerVersion')!=VERSION: errors.append(f"worker diagnostics version {diag.get('workerVersion')}, expected {VERSION}")
        if diag.get('failedAssets'): errors.append('mocked deployed assets failed: '+repr(diag.get('failedAssets')))
        if diag.get('shellCount')!=len(app_shell): errors.append('diagnostic shell count mismatch')

        repair=page.evaluate(r'''async()=>{
          const r=await App.v247RepairPwaCache();
          return r?{type:r.type,version:r.version,missing:(r.missingCached||[]).length}:null;
        }''')
        result['repair']=repair
        if not repair or repair.get('type')!='MEDIAFLOW_SW_CACHE_RESULT' or repair.get('version')!=VERSION: errors.append('cache repair response invalid: '+repr(repair))
        elif repair.get('missing')!=0: errors.append(f"cache repair left {repair.get('missing')} missing assets")

        html=page.evaluate('()=>App.v244PwaSettingsHtml()')
        if 'PWA Diagnostics' not in html or 'Run PWA Test' not in html or 'Repair app cache' not in html: errors.append('settings PWA card is missing diagnostics controls')
        result['ui']={'diagnosticsPanel':'PWA Diagnostics' in html,'runTest':'Run PWA Test' in html,'repair':'Repair app cache' in html,'runtime':runtime}
        result['pageErrors']=page_errors
        browser.close()
    if page_errors: errors.extend('pageerror: '+x for x in page_errors)

print(json.dumps(result,indent=2))
if errors:
    print('v247 PWA SMOKE FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v247 PWA reliability/diagnostics smoke: OK')
