#!/usr/bin/env node
/* v507 portable snapshot, authenticated cloud verification and release audit.
 * Source functions run in an isolated VM against synthetic states only.
 * Never read a real account, upload anything or modify Supabase. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const moduleCode=read('src/js/components/373-v507-persistence-portability-pwa-audit.js');
const versions=JSON.parse(read('version.json'));
assert.equal(read('VERSION').trim(),'507');
for(const key of ['version','appVersion','build'])assert.equal(versions[key],507);
const order=JSON.parse(read('src/js/runtime-order.json'));
assert.equal(order.filter(x=>x==='components/373-v507-persistence-portability-pwa-audit.js').length,1);
const index=read('index.html');
assert.match(index,/<meta name="mediaflow-version" content="507">/);
assert.match(index,/assets\/js\/mediaflow-v507\.bundle\.js/);
const bundle=read('assets/js/mediaflow-v507.bundle.js');
assert.ok(bundle.includes(moduleCode),'Published bundle must include the complete v507 export and audit module');
const worker=read('sw.js');
assert.match(worker,/const MEDIAFLOW_VERSION=507;/);
assert.match(worker,/mediaflow-pwa-v507-shell/);
assert.ok(worker.includes('./assets/js/mediaflow-v507.bundle.js'),'New JS must be in service-worker shell');
const state={
  library:[{id:'demo',title:'Synthetic show',progress:7}],sessions:[{id:'log',timestamp:1}],
  activityLog:[{id:'entry'}],settings:{theme:'dark',autoInstallUpdates:true,backup:{enabled:true}},
  categories:[{id:'anime'}],categoryOrder:['anime'],
  collections:[{id:'c'}],collectionTombstones:[{id:'old',deletedAt:123}],
  orderPlan:{titleIds:['demo'],collectionAssignments:[],categoryQueues:{}},
  xpLedger:{v348EventMeta:{test:{xp:3}}},completionTimeline:[],
  customFuturePersistentField:{nested:{yes:true},array:[1,2,3]},
  savedAt:1234,cloudSyncVersion:201
};
const original=JSON.stringify(state);
let snapshotTick=2000;
const calls={remote:null,toast:[],downloads:[]};
const methods=['syncNow','exportJSON','importJSON','exportSettingsPreset','importSettingsPreset',
 'v271ExportConsumptionCSV','v271ExportLogsCSV','v348ExportXPHistory','calculateXPNow',
 'v142ExportOrder','v142ImportOrder','v279ExportCollections','v279ImportCollections',
 'v248InstallLatestUpdate'];
const App={};for(const key of methods)App[key]=()=>{};
const mock={
 App,S:{...state},AUTH_USER:{id:'synthetic-account'},V115_STARTUP_GUARD:false,
 V475_AUTH:{hydrated:true,restoring:false,logoutRequested:false},lastSaveFailed:false,
 saveQueue:Promise.resolve(),saveState:()=>Promise.resolve(true),
 v161CurrentVersion:()=>507,snapshot:()=>({...state,savedAt:++snapshotTick}),
 v148BuildFullBackup:()=>({mediaFlowVersion:506,backupVersion:506,backupManifest:{}}),
 backupSnapshot:()=>({}),
 v196BuildSettingsPreset:()=>({settings:{theme:'old'},presetManifest:{},mediaFlowVersion:506}),
 v142OrderExportPayload:()=>({orderPlan:state.orderPlan,mediaFlowVersion:506}),
 v281CollectionsExportPayload:()=>({collections:state.collections,appVersion:506}),
 V201_CLOUD_SYNC_VERSION:201,V201_BACKUP_SCHEMA_VERSION:29,V196_SETTINGS_PRESET_SCHEMA_VERSION:1,
 v250Fingerprint:x=>JSON.stringify(x),
 v115FetchCloudState:async()=>calls.remote||{found:true,state:state},
 v155VerifyCloudState:(actual,expected)=>JSON.stringify(actual)===JSON.stringify(expected)?{ok:true,missing:[]}:{ok:false,missing:['library']},
 v161EnsureAutomaticUpdateCheck(){},
 triggerDownload:(blob,name)=>calls.downloads.push(name),
 showToast:msg=>calls.toast.push(msg),
 Blob,window:{},console,JSON,Object,Date,Set,Map,Number,Promise
};
vm.createContext(mock);vm.runInContext(moduleCode,mock,{filename:'373-v507-persistence-portability-pwa-audit.js'});
const full=vm.runInContext('v148BuildFullBackup()',mock);
const automatic=vm.runInContext('backupSnapshot()',mock);
assert.deepEqual(JSON.parse(JSON.stringify(full.customFuturePersistentField)),state.customFuturePersistentField,
 'Future persistent account fields must not be dropped from full backup');
assert.deepEqual(JSON.parse(JSON.stringify(automatic.customFuturePersistentField)),state.customFuturePersistentField,
 'Scheduled export must use the exact full export builder');
for(const name of ['library','sessions','activityLog','settings','categories','collections',
 'collectionTombstones','orderPlan','xpLedger','completionTimeline']){
 assert.equal(JSON.stringify(full[name]),JSON.stringify(state[name]),name+' must survive full export');
 assert.equal(JSON.stringify(automatic[name]),JSON.stringify(state[name]),name+' must survive auto export');
}
assert.equal(full.mediaFlowVersion,507);
assert.ok(!Object.hasOwn(full,'savedAt'),'Transient savedAt is not required in a portable backup');
assert.ok(full.backupManifest.v507.accountFields.includes('customFuturePersistentField'));
assert.equal(automatic.mediaFlowVersion,507);
const preset=vm.runInContext('v196BuildSettingsPreset()',mock);
assert.equal(JSON.stringify(preset.settings),JSON.stringify(state.settings));
assert.ok(!Object.hasOwn(preset,'library'),'Settings preset must not contain Library titles');
assert.equal(preset.mediaFlowVersion,507);
assert.equal(vm.runInContext('v142OrderExportPayload().mediaFlowVersion',mock),507);
assert.equal(vm.runInContext('v281CollectionsExportPayload().appVersion',mock),507);
assert.equal(vm.runInContext('v281CollectionsExportPayload().collectionTombstones.length',mock),1);
const audit=vm.runInContext('mf507AuditPersistence()',mock);
assert.equal(audit.ok,true,'Read-only local export audit must pass with complete synthetic data: '+audit.issues);
assert.equal(JSON.stringify(state),original,'Export and audit must not mutate any user data');
assert.equal(audit.fields.customFuturePersistentField.equal,true);
async function test(){
 await vm.runInContext("mf507VerifyImportedCloud('Synthetic Import','synthetic-account')",mock);
 assert.equal(state.savedAt,1234,'Cloud readback must not overwrite the original savedAt');
 calls.remote={found:true,state:{...state,library:[]}};
 await assert.rejects(vm.runInContext("mf507VerifyImportedCloud('Synthetic Import','synthetic-account')",mock),/cloud verification failed/i);
 calls.remote={found:false,state:null};
 await assert.rejects(vm.runInContext("mf507VerifyImportedCloud('Synthetic Import','synthetic-account')",mock),/missing/i);
 calls.remote={found:true,state};
 mock.V115_STARTUP_GUARD=true;
 await assert.rejects(vm.runInContext("mf507VerifyImportedCloud('Synthetic Import','synthetic-account')",mock),/still in progress/i);
 mock.V115_STARTUP_GUARD=false;
 mock.V475_AUTH.hydrated=false;
 await assert.rejects(vm.runInContext("mf507VerifyImportedCloud('Synthetic Import','synthetic-account')",mock),/still in progress/i);
 mock.V475_AUTH.hydrated=true;
 mock.AUTH_USER.id='switched-account';
 await assert.rejects(vm.runInContext("mf507VerifyImportedCloud('Synthetic Import','synthetic-account')",mock),/still in progress/i);
 const importerPaths={
  full:'src/js/features/backup/053-v148-complete-data-backup-audit-full-restore.js',
  settings:'src/js/features/backup/134-v196-settings-presets.js',
  collections:'src/js/components/215-v281-collections-responsive-cloud-library-search.js',
  order:'src/js/components/184-v250-about-update-data-integrity.js'
 };
 for(const [key,file] of Object.entries(importerPaths)){
  assert.ok(read(file).includes('mf507VerifyImportedCloud('),key+' must verify imported cloud row');
  assert.ok(read(file).includes('V475_AUTH.hydrated'),key+' must reject unhydrated account imports');
 }
 const sync=read('src/js/services/cloud-sync/058-v155-complete-cloud-state-full-sync-now.js');
 assert.ok(sync.includes('v507ConfirmSyncAccount()'),'Sync Now must check user before cloud mutation');
 assert.ok(sync.includes("const syncAccountId=String(AUTH_USER?.id||'')"),'Sync Now must preserve initial user id');
 assert.equal((sync.match(/v507ConfirmSyncAccount\(\);/g)||[]).length,4);
 mock.App.v507ExportAuditReport();
 assert.equal(calls.downloads[0],'MediaFlow_Data_Integrity_v507.json');
 console.log('PASS v507: complete snapshot/auto export, Settings, Order, Collections, History/XP fields, auth-bound cloud verification, Sync Now, PWA and version');
}
test().catch(error=>{console.error(error);process.exitCode=1;});
