"""v348 full backup / settings preset / order / collection export and cloud verify."""
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
source=(R/'assets/js/mediaflow-v348.bundle.js').read_text(encoding='utf-8').rstrip()
source=source[:-len('})();')]+'''\nwindow.__v348Export={S,App,v148BuildFullBackup,v196BuildSettingsPreset,v142OrderExportPayload,v281CollectionsExportPayload,v155VerifyCloudState,v348Award,v348Ledger};\n})();\n'''
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<meta name="mediaflow-version" content="348"><main id="app"><div class="main"><div class="container"><div id="view-root"></div></div></div></main>')
  page.evaluate("() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});}")
  page.add_script_tag(content=source)
  result=page.evaluate('''()=>{
    const T=__v348Export,S=T.S;S.view='order';
    S.categories=[{id:'a',name:'Anime',unit:'episodes',color:'#88aaff'}];
    S.library=[{id:'a1',title:'Title One',categoryId:'a',status:'active'}];
    S.collections=[{id:'c1',title:'The first Collection',titleIds:['a1'],order:['a1'],createdAt:1,updatedAt:1}];
    S.orderPlan={titleIds:['a1'],viewMode:'all',categoryMode:'default',categoryOrder:[],hiddenCategories:[],collectionAssignments:[],categoryQueues:{}};
    S.settings.leveling={enabled:true,globalStreakMultiplierEnabled:false,orderAddTitleXP:42};
    S.xpLedger={};T.v348Award('orderAddTitleXP',1);
    const full=T.v148BuildFullBackup();
    const preset=T.v196BuildSettingsPreset();
    const order=T.v142OrderExportPayload();
    const collections=T.v281CollectionsExportPayload();
    const expected=JSON.parse(JSON.stringify({...full,sessions:S.sessions,categories:S.categories,library:S.library,activityLog:S.activityLog||[],completionTimeline:S.completionTimeline||[],orderPlan:S.orderPlan,oldSystem:full.oldSystem||{},portableExtras:full.portableExtras||{}}));
    const identical=JSON.parse(JSON.stringify(expected));
    const ok=T.v155VerifyCloudState(identical,expected);
    const changed=JSON.parse(JSON.stringify(identical));changed.xpLedger.v348EventMeta={};
    const broken=T.v155VerifyCloudState(changed,expected);
    return {fullMeta:full.backupManifest?.v348,presetMeta:preset.presetManifest?.v348,fields:preset.settings?.leveling||{},orderVersion:order.mediaFlowVersion,collectionVersion:collections.mediaFlowVersion,cloudOkay:ok.ok,cloudOkMissing:ok.missing,cloudBad:!broken.ok,cloudMissing:broken.missing,ledgerCount:Object.keys(full.xpLedger?.v348ActionEvents||{}).length};
  }''')
  print(result)
  assert result['ledgerCount']==1,result
  assert result['fullMeta'] and result['fullMeta']['actionEvents']==1,result
  assert result['presetMeta'] and result['presetMeta']['universalStreakMultiplier'],result
  assert result['orderVersion']==348 and result['collectionVersion']==348,result
  assert 'XP History metadata content' not in result['cloudOkMissing'],result
  assert result['cloudBad'] and 'XP History metadata content' in result['cloudMissing'],result
  assert not errors,errors[:5]
  print('PASS v348 Full Backup, Settings Preset, Personal Order & Collections exports and XP metadata tamper detection (legacy empty-History guard still active)')
  browser.close()
