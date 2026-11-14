#!/usr/bin/env python3
"""v405 source-backed, browser-executed local/cloud serialization contracts.
Simulates JSON readback; does not contact Supabase or install a PWA.
"""
from pathlib import Path
import re,subprocess,time
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=re.sub(r'<link[^>]+>','',(R/'test-v350-responsive.html').read_text()).replace('</head>','<meta name="mediaflow-version" content="408"><base href="http://127.0.0.1:8845/"></head>')
js=(R/'assets/js/mediaflow-v408.bundle.js').read_text().rstrip();assert js.endswith('})();')
js=js[:-5]+'''
window.__contract={S,App,snapshot,mergeStates,v148BuildFullBackup,v196BuildSettingsPreset,v142OrderExportPayload,v281CollectionsExportPayload,v155VerifyCloudState,v402AuditDataIntegrity,v46ApplyState,
 setup:()=>{V115_STARTUP_GUARD=false;AUTH_USER={id:'v405-contract',email:'unit@local'};
  S.categories=[{id:'one',name:'Anime',unit:'episodes'}];S.library=[];S.sessions=[];S.collections=[];S.collectionTombstones=[];S.orderPlan={};S.completionTimeline=[];S.xpLedger={libraryAdditions:{}};S.settings={...DEFAULT_SETTINGS,v405ShowFloatingAdd:false,v405ShowFloatingTaskProgress:true,v401RecommendFreshOnly:true,v380EpisodeProvider:'automatic2'};
  S.activityLog=Array.from({length:1555},(_,i)=>({id:'action-'+i,timestamp:100000+i,action:'edit',detail:'History '+i}));
 }};})();'''
server=subprocess.Popen(['python','-m','http.server','8845','--bind','127.0.0.1'],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.3)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [390,1280]:
   page=browser.new_page(viewport={'width':width,'height':850});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html);page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}");page.add_script_tag(content=js);assert page.evaluate('()=>!!window.__contract'),errors;page.evaluate('()=>__contract.setup()')
   outcome=page.evaluate('''()=>{
     const c=__contract;
     const state=c.snapshot(),backup=c.v148BuildFullBackup(),preset=c.v196BuildSettingsPreset(),order=c.v142OrderExportPayload(),cols=c.v281CollectionsExportPayload();
     const readback=JSON.parse(JSON.stringify(state)),ok=c.v155VerifyCloudState(readback,state);
     const older={...readback,activityLog:readback.activityLog.slice(0,1200)};
     older.settings={...readback.settings,v405ShowFloatingAdd:true};
     const changed=c.v155VerifyCloudState(older,state);
     const merged=c.mergeStates(state,older);
     const corrupt=JSON.parse(JSON.stringify(backup));corrupt.settings.v405ShowFloatingAdd=true;
     const before=JSON.stringify(c.S.xpLedger);
     const audit=window.MediaFlowV408.transferAudit();
     return {historySource:c.S.activityLog.length,historyCloud:state.activityLog.length,historyBackup:backup.activityLog.length,historyMerged:merged.activityLog.length,
       settingsCloud:state.settings.v405ShowFloatingAdd,settingsBackup:backup.settings.v405ShowFloatingAdd,settingsPreset:preset.settings.v405ShowFloatingAdd,
       otherPreference:preset.settings.v405ShowFloatingTaskProgress,engine:preset.settings.v380EpisodeProvider,
       versions:[backup.mediaFlowVersion,preset.mediaFlowVersion,order.mediaFlowVersion,cols.appVersion],
       verification:ok,changed:changed.missing,settingsAudit:audit.ok,issues:audit.issues,xpUnchanged:before===JSON.stringify(c.S.xpLedger)};
   }''')
   assert outcome['historyCloud']==outcome['historySource']==outcome['historyBackup']==outcome['historyMerged']==1555,(width,outcome)
   assert not outcome['settingsCloud'] and not outcome['settingsBackup'] and not outcome['settingsPreset'] and outcome['otherPreference'],(width,outcome)
   assert outcome['engine']=='automatic2' and outcome['versions']==[408]*4,(width,outcome)
   assert outcome['verification']['ok'] and any('settings' in x.lower() for x in outcome['changed']),(width,outcome)
   assert outcome['settingsAudit'] and outcome['xpUnchanged'] and not errors,(width,outcome,errors)
   print(f'PASS {width} 1,555 History events preserved; no cloud clipping, valid new settings, v408 stamps, strict readback; XP unchanged',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
