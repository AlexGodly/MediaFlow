const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/js/components/357-v470-cloud-transfer-pwa-xp-integrity.js','utf8');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'470');
const data={settings:{v468FreshEpisodesSystem:'advanced',v468AdvancedEpisodeLedger:{x:{fresh:2}},theme:'blue'},xpLedger:{v348EventMeta:{k:{xp:7}}},sessions:[{id:1}],activityLog:[{id:2}],library:[{id:3}],orderPlan:{collectionAssignments:[{id:4}],categoryQueues:{x:[3]}},collections:[{id:4}],collectionTombstones:[{id:8}],oldSystem:{},portableExtras:{}};
const copy=v=>JSON.parse(JSON.stringify(v)),state=copy(data),before=JSON.stringify(state);
const App={};for(const n of ['syncNow','exportJSON','importJSON','exportSettingsPreset','importSettingsPreset','v271ExportConsumptionCSV','v271ExportLogsCSV','v348ExportXPHistory','calculateXPNow','v142ExportOrder','v142ImportOrder','v279ExportCollections','v279ImportCollections'])App[n]=()=>{};
const ctx={App,S:state,window:{},MediaFlowRuntime:{},V402_ACCOUNT_FIELDS:Object.keys(data),V201_CLOUD_SYNC_VERSION:201,V201_BACKUP_SCHEMA_VERSION:29,
v161CurrentVersion:()=>470,v161EnsureAutomaticUpdateCheck:()=>{},v402Same:(a,b)=>JSON.stringify(a)===JSON.stringify(b),v250Fingerprint:x=>JSON.stringify(x),
snapshot:()=>copy(state),v148BuildFullBackup:()=>({mediaFlowVersion:405}),backupSnapshot:()=>({}),
v196BuildSettingsPreset:()=>({settings:{theme:'old'}}),v142OrderExportPayload:()=>({orderPlan:copy(state.orderPlan)}),v281CollectionsExportPayload:()=>({}),
v155VerifyCloudState:()=>({ok:true,missing:[]}),saveState:()=>{},navigator:{},fetch:async()=>({ok:true,json:async()=>({appVersion:470})})};
vm.runInNewContext(src,ctx);
const full=ctx.v148BuildFullBackup();assert.equal(full.mediaFlowVersion,470);assert.equal(full.backupVersion,470);
for(const k of Object.keys(data))assert.equal(JSON.stringify(full[k]),JSON.stringify(data[k]),k);
assert.equal(ctx.backupSnapshot().mediaFlowVersion,470);
assert.equal(JSON.stringify(ctx.v196BuildSettingsPreset().settings),JSON.stringify(data.settings));
assert.equal(ctx.v142OrderExportPayload().mediaFlowVersion,470);
assert.equal(ctx.v281CollectionsExportPayload().appVersion,470);
const expected={...data,later:{v:1}},actual={...data,later:{v:2}};
assert.equal(ctx.v155VerifyCloudState(actual,expected).ok,false);
assert.equal(ctx.v155VerifyCloudState(expected,expected).ok,true);
const audit=ctx.App.v470AuditDataIntegrity();assert.equal(audit.ok,true,JSON.stringify(audit.failures));
assert.equal(JSON.stringify(state),before,'read-only XP/data audit mutated account');
ctx.App.v470AuditPWA().then(x=>{assert.equal(x.hosted,470);assert.equal(x.ok,true);console.log('v470 contracts PASS');}).catch(e=>{console.error(e);process.exitCode=1;});
