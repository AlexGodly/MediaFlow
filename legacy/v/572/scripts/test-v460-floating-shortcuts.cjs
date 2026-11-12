/* v460: verify the floating menu has one Metadata Recovery and a safe show/hide widget control. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'460');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/344-v460-quick-recovery-widget-toggle.js');
const code=fs.readFileSync('src/js/components/344-v460-quick-recovery-widget-toggle.js','utf8');
const action=(name,cls='')=>'<button type="button" class="mf397-fan-action '+cls+'" data-action="'+name+'"><strong>'+name+'</strong></button>\n';
const anchor='      </div>\n      <button type="button" id="mf397-fab"';
const base=()=>{
 return '<div id="mf397-fan">'+action('logging')+action('library')+action('collection')+
 action('coverRecovery','mf436-cover-action')+
 action('metadataRecovery','mf441-metadata-action')+
 '<button class="mf397-fan-action mf447-float-action" data-action="metadataRecovery"><strong>New Metadata Recovery</strong><small>Configure in the unified workspace</small></button>\n'+
 action('bothRecovery')+anchor+'</div>';
};
let visibility='auto',active=false,saved=[],delegated=[],openCalls=[];
const labels={strong:{textContent:''},small:{textContent:''},symbol:{innerHTML:''}};
const button={attrs:{},querySelector:selector=>labels[selector==='strong'?'strong':selector==='small'?'small':'symbol'],
 setAttribute(k,v){this.attrs[k]=v}};
const fan={querySelector:()=>button};
const env={console,window:{},MediaFlowRuntime:{},showToast:()=>{},mf397Markup:base,
 mf397SetMenu(open){openCalls.push(open)},mf397Action(action){delegated.push(action)},
 mf441Prefs:()=>({visibility}),mf441State:()=>({coverActive:active,metadataActive:false}),
 mf441Show:(prefs,state)=>prefs.visibility==='always'||prefs.visibility==='auto'&&state.coverActive,
 mf441SaveSetting:(k,v)=>{assert.equal(k,'visibility');visibility=v;saved.push(v)},
 document:{getElementById:id=>id==='mf397-fan'?fan:null}};
vm.createContext(env);vm.runInContext(code,env,{filename:'v460.js'});
const api=env.window.MediaFlowV460;
assert.equal(api.version,460);
let html=api.menuMarkup(),metadata=(html.match(/data-action="metadataRecovery"/g)||[]);
assert.equal(metadata.length,1,'Only one Metadata Recovery shortcut');
assert(html.includes('Configure in the unified workspace'),'Keep the newer unified-workspace shortcut');
assert.equal((html.match(/data-action="backgroundProcessesVisibility"/g)||[]).length,1);
assert.equal((html.match(/class="mf397-fan-action/g)||[]).length,7,'3 main actions, 3 recoveries, 1 widget visibility action');
assert(html.includes('Show Background Processes'),'Automatic mode with no processes should offer Show');
assert.equal(api.widgetVisible(),false);
env.mf397Action('backgroundProcessesVisibility');
assert.equal(visibility,'always','Show must display even when the queue is idle');
assert.equal(api.widgetVisible(),true);
assert.equal(button.attrs['aria-label'],'Hide Background Processes');
assert.equal(labels.strong.textContent,'Hide Background Processes');
assert.equal(openCalls.at(-1),false);
env.mf397Action('backgroundProcessesVisibility');
assert.equal(visibility,'hidden','Hide must persist Hidden through the existing setter');
assert.equal(api.widgetVisible(),false);
assert.equal(button.attrs['aria-label'],'Show Background Processes');
assert.deepEqual(saved,['always','hidden']);
active=true;
env.mf397Action('backgroundProcessesVisibility');
assert.equal(visibility,'always','Show works even when a job is active but widget was hidden');
assert.equal(api.widgetVisible(),true);
assert.deepEqual(saved,['always','hidden','always']);
env.mf397SetMenu(true);
assert.equal(labels.strong.textContent,'Hide Background Processes');
env.mf397Action('metadataRecovery');
assert.deepEqual(delegated,['metadataRecovery'],'Recovery actions still dispatch to existing handlers');
const single=base().replace(action('metadataRecovery','mf441-metadata-action'),'');
env.mf397Markup=()=>single; // replaced wrapper itself for this isolated one-entry case
assert.equal((single.match(/data-action="metadataRecovery"/g)||[]).length,1);
assert.equal(code.includes('MF424.job='),false,'Never reset cover recovery jobs');
assert.equal(code.includes('MF439.job='),false,'Never reset metadata recovery jobs');
console.log('PASS v460: exactly one Metadata Recovery, direct Show/Hide with live state, preference persistence, and original recovery dispatch');
