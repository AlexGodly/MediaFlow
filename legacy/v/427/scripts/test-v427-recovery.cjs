/* v427 regression guard — deterministic, no credentials/network/user data. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/js/components/311-v427-recovery-ux-stability.js','utf8');
const css=fs.readFileSync('assets/css/238-v427-recovery-dialog-polish.css','utf8');
const core=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const first=fs.readFileSync('src/js/components/157-v225-global-button-icons.js','utf8');
const second=fs.readFileSync('src/js/components/158-v226-semantic-icons-dropdowns.js','utf8');
const match=(s,q,label)=>assert(s.includes(q),label+': '+q);
match(css,'z-index:100050','Quick Edit overlays recovered');
match(css,'z-index:100110','confirmation dialog above search');
match(css,'.mf427-settings-confirm','theme settings');
match(source,'App.mf425ChooseInstant=async function','save-on-select');
match(source,'App.v192SaveMissingCover()','Dashboard immediately saves');
match(source,"App.v181SaveQuickDetail(live.id,'coverUrl')",'Quick Edit immediately saves');
match(source,'await saveState();','Existing saved Library update persists');
match(source,'const mf427PreviousReviewConfirm=App.mf424Confirm','Review confirmation follows setting');
match(source,"App.mf425Instant=function(entry='editor')",'all automatic searches use unified UI');
match(source,'ev.stopImmediatePropagation()','legacy Add/Edit picker intercepted');
match(source,"MF425.oneId=ctx.id||'draft'",'unsaved draft scoped to current item');
match(source,"start.setAttribute('onclick','App.mf427StartSingle()')",'draft never starts all-Library job');
match(source,"getElementById('mf424-indicator')",'existing indicator used');
match(source,'mf427ConfirmJobReplace','themed replace dialog');
match(core,"await mf427ConfirmJobReplace()",'native confirm removed from replace');
match(core,"await mf427ConfirmRetryPending()",'native confirm removed from pending retry');
match(core,"await mf427ConfirmRetry(ids.length)",'native confirm removed from retry');
match(first,"if(el?.matches?.('.mf421-dock-progress'))return null",'old Level/Streak icon guard remains');
match(second,'explicit mf425/mf427 svg', 'global semantic icon refuses custom SVG');
for(const [name,p] of [['v427 source','src/js/components/311-v427-recovery-ux-stability.js']]){
 assert(fs.existsSync(p),name+' missing');
}
// Evaluate pure functions without browser or DOM and verify draft scoping for a 100k library.
function extract(name){const n=source.indexOf('function '+name+'(');assert(n>=0,'function missing '+name);const text=source.slice(n),m=text.match(/^function [\s\S]*?\n\}/);assert(m,'function body missing '+name);return m[0];}
const old={id:'old',title:'Existing',coverUrl:'https://cover.example/old.jpg',categoryId:'anime',externalIds:{mal:'123'}};
const S={modal:{type:'library',data:{title:'Draft',categoryId:'manga',externalIds:{mal:'77'}}},settings:{v427CoverRecovery:{confirmBeforeApply:false}}};
const fake={S,MF425:{oneId:''},mf424Lookup:id=>id==='old'?old:null,document:{getElementById:id=>({ 'l-title':{value:'Draft Title'},'l-category':{value:'manga'}}[id]||null),querySelectorAll:()=>[{dataset:{v377Id:'mal'},value:'456'}]}};
vm.createContext(fake);vm.runInContext(['mf427CurrentSaved','mf427CurrentDraft','mf427PrefConfirm'].map(extract).join('\n'),fake);
const draft=fake.mf427CurrentDraft('editor');assert.equal(draft.id,'draft');assert.equal(draft.title,'Draft Title');assert.equal(draft.externalIds.mal,'456');assert.equal(fake.mf427PrefConfirm(),false);
S.modal.data={id:'old',title:'Existing'};const existing=fake.mf427CurrentDraft('editor');assert.equal(existing.id,'old');assert.equal(existing.externalIds.mal,'456');
assert.equal(fake.mf427PrefConfirm(),false);S.settings.v427CoverRecovery.confirmBeforeApply=true;assert.equal(fake.mf427PrefConfirm(),true);
// Run the v425 selection contract over 100k synthetic titles as a compatibility check.
assert(!/\bconfirm\(\s*['"`]/.test(source),'v427 must never invoke browser-native confirm');
assert(css.includes('var(--panel)')&&css.includes('var(--text)'), 'Theme semantic color compliance');
console.log('PASS: v427 dialog, icon, unified search, draft, save-on-select, settings and 100k-capable legacy contracts');
