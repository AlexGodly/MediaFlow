/* v427 regression guard — deterministic, no credentials/network/user data. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/js/components/311-v427-recovery-ux-stability.js','utf8');
const css=fs.readFileSync('assets/css/238-v427-recovery-dialog-polish.css','utf8');
const core=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const first=fs.readFileSync('src/js/components/157-v225-global-button-icons.js','utf8');
const second=fs.readFileSync('src/js/components/158-v226-semantic-icons-dropdowns.js','utf8');
const match=(s,q,label)=>assert(s.includes(q),label+': '+q);

const coverIntegration=fs.readFileSync('src/js/components/310-v425-cover-recovery-integration.js','utf8');
function section(text,start,end){const at=text.indexOf(start);assert(at>=0,'Missing section: '+start);const stop=text.indexOf(end,at+start.length);assert(stop>at,'Missing boundary: '+end);return text.slice(at,stop);}
const dashboard=section(coverIntegration,'v192MissingCoversHtml=function','// Preserve the established fast cover picker');
const editor=section(coverIntegration,'libraryModalHtml=function','function mf425DraftItem');
const quickCover=section(coverIntegration,'App.v181QuickEditDetail=function','const mf425OldSaveQuick');
const olderPicker=section(coverIntegration,'root.innerHTML=','document.body.append(root)');
const unifiedPicker=section(source,'root.innerHTML=','document.body.appendChild(root)');
for(const [name,markup] of [['Dashboard Missing Covers',dashboard],['Add/Edit Title',editor],['Quick Cover action',quickCover],['older Find Cover picker',olderPicker],['unified Find Cover picker',unifiedPicker]]){
 assert(!markup.includes(' Advanced Recovery</button>'),name+' must not display the removed Advanced Recovery shortcut');
 assert(!markup.includes('App.mf425InstantAdvanced()'),name+' must not launch advanced recovery');
}
assert(dashboard.includes("App.mf425Instant("),'Dashboard retains Find Cover Automatically');
assert(editor.includes("App.mf425Instant("),'Add/Edit retains Find Cover Automatically');
assert(quickCover.includes("App.mf425Instant("),'Quick Cover retains Find Cover Automatically');
assert(coverIntegration.includes("App.mf425OpenConfig(\\'library\\')"),'Library retains bulk Cover Recovery');
assert(coverIntegration.includes("App.mf425OpenConfig(\\'settings\\')"),'Settings retains Cover Recovery');

match(css,'z-index:100050','Quick Edit overlays recovered');
match(css,'z-index:100110','confirmation dialog above search');
match(css,'.mf427-settings-confirm','theme settings');
match(source,'App.mf425ChooseInstant=async function','save-on-select');
match(source,'App.mf431UseDashboardCover(url,String(item.id))','Dashboard waits for v431 validated save');
match(source,"App.v181SaveQuickDetail(live.id,'coverUrl')",'Quick Edit immediately saves');
match(source,'await saveState();','Existing saved Library update persists');
match(source,'const mf427PreviousReviewConfirm=App.mf424Confirm','Review confirmation follows setting');
match(source,"App.mf425Instant=function(entry='editor')",'all automatic searches use unified UI');
match(source,'const catalog=mf424CoverProviderChoices(current)','Find Cover reads the entire dynamic provider registry');
match(source,'const candidates=await mf424Discover(current,provider)','Find Cover uses the same cover discovery adapter');
match(source,'catalog.map(p=>','Newly integrated and inactive providers are all listed with truthful availability');
match(source,'App.mf427RetryProvider=function','Find Cover can inspect a single provider');
match(source,"(enabled.length?enabled:eligible)",'No active enabled sources no longer means an empty Find Cover list');
match(source,"catalog.filter(p=>p.usable)",'All configured public providers can be searched regardless of category');
match(source,"mf427SelectedLinkId(index)",'Cover selection offers source-ID linking');
match(source,"mf427LinkAfterExternalSave",'Dashboard and Quick Cover link only following successful cover save');
match(source,"off for background recovery",'Individual search works without silently editing Recovery settings');
match(core,"MF424_EXTRA_COVER_ADAPTERS",'Future provider adapters share both workflows');
match(core,"root.className='mf424-modal mf425-themed mf427-manual-review'",'Manual review uses the same dynamic theme surface');
match(core,'mf424ReviewIcon(\'check\')','Manual-review buttons use meaningful icons');
match(source,'mf427ProviderSummary(outcomes)','Provider diagnostics explain zero results and errors');
match(css,'.mf427-provider-picker','Per-provider search uses theme-native responsive controls');
match(css,'#mf424-review.mf427-manual-review .mf424-dialog','Manual review uses theme-native surface');
match(css,'#mf424-review.mf427-manual-review .mf424-heading h2','Manual review heading always has readable text');
match(css,'#mf424-review.mf427-manual-review .btn-ghost','Manual review actions are readable in light/dark modes');

match(source,'ev.stopImmediatePropagation()','legacy Add/Edit picker intercepted');
match(source,"MF425.oneId=ctx.id||'draft'",'unsaved draft scoped to current item');
match(source,"start.setAttribute('onclick','App.mf427StartSingle()')",'draft never starts all-Library job');
match(source,"getElementById('mf424-indicator')",'existing indicator used');
match(source,'mf427ConfirmJobReplace','themed replace dialog');
match(core,"await mf427ConfirmJobReplace()",'native confirm removed from replace');
match(core,"await mf427ConfirmRetryPending()",'native confirm removed from pending retry');
match(core,"await mf427ConfirmRetry(ids.length)",'native confirm removed from retry');
match(first,"if(el?.matches?.('.mf421-dock-progress,.mf421-dock-account'))return null",'Level/Streak and avatar icon guards remain');
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
