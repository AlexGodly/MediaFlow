#!/usr/bin/env python3
"""v402 offline export, import and cloud JSON readback contracts. No live accounts."""
from pathlib import Path
import re,subprocess,time,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'test-v350-responsive.html').read_text()
index=(ROOT/'index.html').read_text()
html=re.sub(r'<link[^>]+>','',raw).replace('</head>','<base href="http://127.0.0.1:8785/"></head>')
js=(ROOT/'assets/js/mediaflow-v403.bundle.js').read_text().rstrip()
assert js.endswith('})();')
js=js[:-5]+'''
window.__v402={S,App,snapshot,v148BuildFullBackup,v196BuildSettingsPreset,v142OrderExportPayload,v281CollectionsExportPayload,v155VerifyCloudState,v148ValidateBackup,v402AuditDataIntegrity,v281ImportCollections,v401EpisodeOutcome,v271ExportHistorySessions,v348HistoryEntries,mediaFlowXP,v196NormalizeImportedSettings,
 init:()=>{V115_STARTUP_GUARD=false;AUTH_USER={id:'v402-test',email:'unit@local'};S.view='dashboard';
  S.categories=[{id:'seasonal',name:'Seasonal Anime',unit:'episodes',seasonal:true,enabled:true}];
  S.categoryOrder=['seasonal'];
  S.library=[{id:'series-a',title:'Season',categoryId:'seasonal',status:'active',progress:6,total:12,externalIds:{mal:'111'},seasons:[{id:'season1',number:1,progress:6,total:12}]}];
  S.sessions=[{id:'log-1',timestamp:Date.now()-5000,categoryId:'seasonal',actualAmount:1,xp:12,titles:[{libraryId:'series-a',title:'Season',v369Units:[{id:'unit-1',number:7,loggedAt:Date.now()-3000,durationSeconds:1440}]}]}];
  S.activityLog=[{id:'event-1',timestamp:Date.now()-8000,action:'edit',detail:'Keep history'}];
  S.collections=[{id:'collection-new',title:'Live Collection',titleIds:['series-a'],order:['series-a'],updatedAt:200,createdAt:100,description:''}];
  S.collectionTombstones=[{id:'collection-deleted',deletedAt:150}];
  S.xpLedger=S.xpLedger||{};S.xpLedger.v348EventMeta={'reward-a':{xp:25,kind:'libraryEdits',timestamp:12345}};
  S.settings=S.settings||{};S.settings.v380EpisodeProvider='automatic2';S.settings.seasonalFreshAuto=true;S.settings.v401RecommendFreshOnly=true;
  S.settings.v377JikanLedger={'series-a':{available:7,at:Date.now(),v401Mode:'automatic2',v401Status:'verified',v401Providers:[{source:'tenrai',status:'verified',available:7}]}};
  S.orderPlan={titleIds:['series-a'],collectionAssignments:[{id:'assignment-a',collectionId:'collection-new',categoryId:'seasonal',traversedTitleIds:[]}],categoryQueues:{seasonal:['t:series-a','c:assignment-a']},modifiedAt:400};
 },
 captureHistory:async()=>{let download;const before=triggerDownload;
  try{triggerDownload=(blob,name)=>{download={blob,name}};v271ExportHistorySessions(S.sessions,'v402-history-check');}
  finally{triggerDownload=before;}
  return download?await download.blob.text():'';
 },
 simulateCollections:async()=>{const json={collections:[{id:'collection-old',title:'Stale collection',titleIds:[],order:[],createdAt:50,updatedAt:100},{id:'collection-new',title:'Older version',titleIds:[],order:[],createdAt:20,updatedAt:120}],collectionTombstones:[{id:'collection-old',deletedAt:190},{id:'collection-new',deletedAt:180}]};
   v279Confirm=async()=>true;saveState=async()=>{lastSaveFailed=false};render=()=>'';
   await v281ImportCollections({text:async()=>JSON.stringify(json)});
   return {collections:S.collections.map(c=>({id:c.id,title:c.title})),tombstones:S.collectionTombstones.map(t=>({...t}))};
 }
};})();'''
server=subprocess.Popen(['python','-m','http.server','8785','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.4)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in [320,390,820,1280,1920]:
   page=browser.new_page(viewport={'width':width,'height':850});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('dialog',lambda d:d.accept())
   page.set_content(html)
   page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}")
   page.add_script_tag(content=js)
   page.evaluate('()=>__v402.init()')
   audit=page.evaluate('()=>__v402.v402AuditDataIntegrity()')
   assert audit['ok'],(width,audit['issues'])
   assert audit['settingsParity'] and audit['jsonRoundtrip'] and audit['orderExtension'],(width,audit)
   assert audit['versionStamps']=={'full':403,'preset':403,'order':403,'collections':403},(width,audit['versionStamps'])
   assert audit['counts']['xpEvents']==1 and audit['counts']['history']==1 and audit['counts']['deletedCollections']==1
   unit=page.evaluate('''()=>{const d=__v402;const x=d.v148BuildFullBackup(),v=x.sessions[0].titles[0].v369Units[0];return {unit:v.loggedAt,provider:x.settings.v380EpisodeProvider,filter:x.settings.v401RecommendFreshOnly,ledger:Object.keys(x.settings.v377JikanLedger).length,settings:d.v196BuildSettingsPreset().settings.v401RecommendFreshOnly,collections:d.v281CollectionsExportPayload().collectionTombstones.length}}''')
   assert isinstance(unit['unit'],int) and unit['ledger']==1 and unit['settings'] and unit['collections']==1,(width,unit)
   assert unit['provider']=='automatic2' and unit['filter']
   verify=page.evaluate('''()=>{const d=__v402,x=d.snapshot(),y=JSON.parse(JSON.stringify(x));const good=d.v155VerifyCloudState(y,x);
     y.settings.v401RecommendFreshOnly=false;const bad=d.v155VerifyCloudState(y,x);
     const z=JSON.parse(JSON.stringify(x));delete z.collections;const missing=d.v155VerifyCloudState(z,x);
     return {good,changes:bad.missing,missing:missing.missing};}''')
   assert verify['good']['ok'] and not verify['changes']==[] and any('collections' in s.lower() for s in verify['missing']),(width,verify)
   validate=page.evaluate('''()=>{const d=__v402,x=d.v148BuildFullBackup();const good=d.v148ValidateBackup(x);const z=JSON.parse(JSON.stringify(x));z.activityLog={invalid:true};const bad=d.v148ValidateBackup(z);
    const old=JSON.parse(JSON.stringify(x));delete old.backupFormat;delete old.backupManifest;delete old.collections;delete old.collectionTombstones;
    return {good:good.ok,bad:bad.ok,legacy:d.v148ValidateBackup(old).ok};}''')
   assert validate=={'good':True,'bad':False,'legacy':True},(width,validate)
   history_xp=page.evaluate('''async()=>{
     const d=__v402,ledgerBefore=JSON.stringify(d.S.xpLedger),levelBefore=d.mediaFlowXP();
     const csv=await d.captureHistory();
     const xpRows=d.v348HistoryEntries();
     const preset=d.v196BuildSettingsPreset();
     const normalized=d.v196NormalizeImportedSettings(preset.settings);
     return {historyCsv:csv.includes('v369_itemized_units_json')&&csv.includes('loggedAt')&&csv.includes('session_json'),
       xpEvents:xpRows.some(row=>row.kind==='libraryEdits'&&row.xp===25),
       xpUntouched:ledgerBefore===JSON.stringify(d.S.xpLedger)&&levelBefore===d.mediaFlowXP(),
       presetFreshMode:normalized.v380EpisodeProvider,presetFilter:normalized.v401RecommendFreshOnly,
       count:csv.length};} ''')
   assert history_xp['historyCsv'] and history_xp['xpEvents'] and history_xp['xpUntouched'],(width,history_xp)
   assert history_xp['presetFreshMode']=='automatic2' and history_xp['presetFilter']==True,(width,history_xp)
   merged=page.evaluate('()=>__v402.simulateCollections()')
   assert merged['collections']==[{'id':'collection-new','title':'Live Collection'}],(width,merged)
   assert any(t['id']=='collection-old' for t in merged['tombstones']),(width,merged)
   assert not errors,(width,errors[:3])
   print('PASS',width,'cloud+backup parity, v400 unit metadata, v401 settings, order/collections exports, strict readback, legacy validation, timestamp-safe collections import',flush=True)
   page.close()
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
