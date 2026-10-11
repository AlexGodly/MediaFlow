const fs=require('fs'),vm=require('vm'),assert=require('assert');
const baseDir=__dirname+'/../src/js/components/';
const js=fs.readFileSync(baseDir+'236-v339-data-cloud-transfer-update-audit.js','utf8');
const rows={'2026-10-09':{ms:90000,xp:3,pageMs:{stats:40000},actionMs:{analytics:40000}}};
const storage={};
const snapshotData={categories:[{id:'anime',name:'Anime'}],categoryOrder:['anime'],library:[{id:'title',title:'Title'}],sessions:[{id:'log1'}],settings:{leveling:{firstEpisodeXP:20,firstTitleStartXP:40,collectionCreateXP:35,collectionEditXP:10,activeTimeXPPerMinute:2},autoUpdateCheck:true,autoInstallUpdates:false},xpLedger:{v334ActiveTimeDays:rows},orderPlan:{titleIds:[],collectionAssignments:[],categoryQueues:{}},activityLog:[],collections:[{id:'c1',title:'A'}],collectionTombstones:[],completionTimeline:[],portableExtras:{ratingQueue:[]},stopwatch:{elapsed:0},oldSystem:{rules:[]},profileName:'',profilePicture:'',malLink:{username:''},migrations:{},cloudSyncVersion:201};
const cloned=x=>JSON.parse(JSON.stringify(x));
const ctx={console,Date,Math,JSON,Number,Set,Map,Object,String,Array,Promise,window:{},
  AUTH_READY:true,AUTH_USER:{id:'test'},lastSaveFailed:false,V115_STARTUP_GUARD:false,
  S:{xpLedger:cloned(snapshotData.xpLedger),settings:cloned(snapshotData.settings)},
  localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},
  App:{syncNow(){},exportJSON(){},importJSON(){},exportSettingsPreset(){},importSettingsPreset(){},v271ExportConsumptionCSV(){},v271ExportLogsCSV(){},v142ExportOrder(){},v142ImportOrder(){},v279ExportCollections(){},v279ImportCollections(){},calculateXPNow(){},v248InstallLatestUpdate(){}},
  MediaFlowRuntime:{},
  v161CurrentVersion:()=> '339',
  v281CollectionsExportPayload:()=>({appVersion:296,mediaFlowVersion:296,mediaflowCollectionsExportVersion:2,collections:cloned(snapshotData.collections)}),
  v142OrderExportPayload:()=>({formatVersion:5,mediaFlowVersion:296,orderPlan:cloned(snapshotData.orderPlan)}),
  v148BuildFullBackup:()=>({...cloned(snapshotData),backupSchemaVersion:29,backupVersion:296,mediaFlowVersion:296,backupManifest:{schemaVersion:29}}),
  v196BuildSettingsPreset:()=>({presetSchemaVersion:1,mediaFlowVersion:296,settings:cloned(snapshotData.settings),presetManifest:{}}),
  v155VerifyCloudState:(remote,expected)=>({ok:true,missing:[]}),
  v250Fingerprint:x=>JSON.stringify(x),
  v334EarnTime:(ms,day)=>{const d=ctx.S.xpLedger.v334ActiveTimeDays[day];d.ms+=ms;d.xp+=ms/30000;d.pageMs.stats=(d.pageMs.stats||0)+ms;},
  v334CheckpointLocalTime:()=>{storage['mf-u']=JSON.stringify(ctx.S.xpLedger.v334ActiveTimeDays)},
  v334RestoreLocalTime:()=>{},v334LocalTimeKey:()=> 'mf-u',v334Ledger:()=>ctx.S.xpLedger,
  v334Totals:ledger=>({timeXP:3,firstEpisodeXP:20}),
  v155PortableExtras:()=>cloned(snapshotData.portableExtras),
  snapshot:()=>cloned(snapshotData),backupSnapshot:()=>({wrong:true}),
  rawSet:()=>{},rawGet:()=>{},v161EnsureAutomaticUpdateCheck:()=>{},
  V201_BACKUP_SCHEMA_VERSION:29,V201_CLOUD_SYNC_VERSION:201,V196_SETTINGS_PRESET_SCHEMA_VERSION:1,
};
vm.createContext(ctx);vm.runInContext(js,ctx);
const collections=ctx.v281CollectionsExportPayload();
assert.equal(collections.appVersion,339);assert.equal(collections.mediaFlowVersion,339);
const order=ctx.v142OrderExportPayload();assert.equal(order.mediaFlowVersion,339);assert.equal(order.formatVersion,5);
const backup=ctx.v148BuildFullBackup();assert.equal(backup.mediaFlowVersion,339);assert.equal(backup.backupManifest.v339.release,339);
assert.deepEqual(JSON.parse(JSON.stringify(ctx.backupSnapshot())),JSON.parse(JSON.stringify(backup)));
const preset=ctx.v196BuildSettingsPreset();assert.equal(preset.mediaFlowVersion,339);assert.equal(preset.settings.leveling.firstEpisodeXP,20);
const remote=cloned(snapshotData);const expected=cloned(snapshotData);
assert.equal(ctx.v155VerifyCloudState(remote,expected).ok,true);
remote.collections[0].title='Older';assert.equal(ctx.v155VerifyCloudState(remote,expected).ok,false);
assert(ctx.v155VerifyCloudState(remote,expected).missing.includes('Collections content'));
remote.collections[0].title='A';remote.xpLedger.v334ActiveTimeDays['2026-10-09'].pageMs.stats=0;
// Previous verification wrappers compare xpLedger; this test focuses on the extra fields.
remote.profilePicture='changed';assert(ctx.v155VerifyCloudState(remote,expected).missing.includes('Profile picture content'));
ctx.v334EarnTime(15000,'2026-10-09');
assert(JSON.parse(storage['mf-u'])['2026-10-09'].pageMs.stats===55000);
const local=JSON.parse(storage['mf-u']);local['2026-10-09'].pageMs.stats=59000;storage['mf-u']=JSON.stringify(local);
ctx.v334RestoreLocalTime();assert(ctx.S.xpLedger.v334ActiveTimeDays['2026-10-09'].pageMs.stats===59000);
const report=ctx.App.v339PersistenceAudit();assert.equal(report.release,339);assert.equal(report.versions.order,5);assert.equal(report.versions.collectionsRelease,339);assert.equal(report.checks.settingsParity,true);
console.log('PASS v339: current release exports, full backup/automatic backup, presets, cloud field verification, active-time local recovery, audit API');
