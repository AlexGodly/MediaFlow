/* MediaFlow v531 — universal status-label regression. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const canonical=read('src/js/features/backup/134-v196-settings-presets.js');
const a=canonical.indexOf('function v199StatusLabel(value){'),b=canonical.indexOf('\n}',a);
assert(a>=0&&b>a,'central status label helper exists');
const label=vm.runInNewContext(canonical.slice(a,b+2)+'\nv199StatusLabel');
for(const [id,name] of Object.entries({active:'Active',planned:'Planned',paused:'On Hold',completed:'Completed',dropped:'Dropped'}))assert.equal(label(id),name,id);
assert.equal(label(undefined),'Planned');
const files=[
'src/js/features/backup/134-v196-settings-presets.js',
'src/js/components/163-v229-library-choice-modals.js',
'src/js/components/195-v261-library-history-balance-polish.js',
'src/js/components/196-v262-library-restore.js',
'src/js/components/208-v274-collections-library-rating-order-layout.js',
'src/js/components/299-v406-smart-filters-actions.js',
'src/js/components/310-v425-cover-recovery-integration.js',
'src/js/components/326-v446-recovery-scope-controls.js',
'src/js/components/batch-toolbar/048-v143-library-bulk-action-confirmations.js',
'src/js/components/batch-toolbar/124-v190-shared-normal-dynamic-library-batch-toolbar.js',
'src/js/components/title-details/113-global-title-details-popup.js',
'src/js/features/rewatch/028-v82-per-title-rewatch-reread-visibility.js',
'src/js/features/themes/031-v55-platform-themes.js',
'src/js/pages/library/122-v53-cached-library-filtering-now-understands-the-v189.js',
'src/js/pages/settings/114-settings-ui.js',
'src/js/pages/statistics/023-v16-features-backups-themes-stopwatch-mal-link-stats.js',
'src/js/legacy/119-v186.js'];
for(const f of files){const text=read(f);assert(!/Watching|Plan to Watch|Planned to Watch/.test(text),'stale status label: '+f);}
const actions=read('src/js/components/299-v406-smart-filters-actions.js');
assert(actions.includes("planned:'Planned',active:'Active'"));
const rec=read('src/js/components/326-v446-recovery-scope-controls.js');
assert(rec.includes("['planned','Planned']")&&rec.includes("['active','Active']"));
const mod=read('src/js/components/163-v229-library-choice-modals.js');
assert(mod.includes("{id:'planned',label:'Planned'")&&mod.includes("{id:'active',label:'Active'"));
const imports=read('src/js/core/app/021-app-public-actions-bound-to-window.js');
for(const x of ["'Watching':'active'","'Plan to Watch':'planned'","'Active':'active'","'Planned':'planned'"])assert(imports.includes(x),'MAL import alias '+x);
const mal=read('src/js/legacy/025-v40-multi-service-exchange-hub-custom-import-confirmation.js');
assert(mal.includes("active:'Watching'")&&mal.includes("planned:'Plan to Watch'"),'MAL XML export contract preserved');
assert(read('src/js/components/category/049-v144-reusable-category-icon-color-palettes.js').includes('>Watching</option>'),'Category activity Watching stays unchanged');
console.log('PASS v531: Active/Planned status labels, filters, immutable IDs and MAL import/export compatibility.');
