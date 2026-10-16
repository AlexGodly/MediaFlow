/* MediaFlow v438: unified registry contracts and fail-closed API test paths. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/js/components/317-v438-unified-provider-management.js','utf8');
const version=fs.readFileSync('VERSION','utf8').trim();
assert(['438','439','440','441','442','443','444','445','446','447','448','449','450','451','452','453'].includes(version));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/317-v438-unified-provider-management.js'));
const cats=[{id:'library',name:'Library'},{id:'uncategorized',name:'Uncategorized'}];
const hooks=[];
let fetchCount=0;
const context={console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,URL,AbortController,
 MF424_PROVIDER_META:[
 {id:'jikan',name:'Jikan',types:['anime'],limit:35,gap:2200,credentials:false},
 {id:'tmdb',name:'TMDB',types:['movie','tv'],limit:8,credentials:true},
 {id:'openlibrary',name:'Open Library',types:['book'],limit:20,credentials:false},
 {id:'omdb',name:'OMDb',types:['movie','tv'],limit:0,credentials:true}
 ],
 MF433_PROVIDER_CATALOG:[
 {id:'tmdb',name:'TMDB',capabilities:'cover,id,metadata',access:'key'},
 {id:'omdb',name:'OMDb',capabilities:'cover,id,metadata',access:'key'},
 {id:'simkl',name:'SIMKL',capabilities:'metadata,id,releases',access:'restricted'}
 ],
 MF424_EXTRA_COVER_ADAPTERS:new Map([['tmdb',()=>[]]]),
 MF434:{status:{providers:[{id:'tmdb',configured:true,testable:true},{id:'omdb',configured:false,testable:true}]},tests:{}},
 mf434RefreshGateway:async()=>{},v148BuildFullBackup:()=>({backupManifest:{includes:{}}}),
 mf434SavedTests:()=>['tmdb'],mf434Panel:()=>'<div class="mf434-connection" data-mf-setting-id="cover-api-gateway">Legacy connection test</div>',
 mf425SettingsMarkup:()=>'<div class="mf425-settings-card"><fieldset class="mf430-settings-providers">Preferences remain</fieldset><div class="mf434-connection">API panel</div></div>',
 mf424Provider:id=>context.MF424_PROVIDER_META.find(p=>p.id===id),
 mf424Defaults:()=>({enabled:['jikan','tmdb'],priorities:['jikan','tmdb']}),
 mf425Icon:()=>'<svg></svg>',mf424Escape:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
 MediaFlowRuntime:{registerPageEnhancer:(page,fn)=>hooks.push([page,fn])},
 App:{},window:{MediaFlowSettingsRegistry:{registerCategory:p=>cats.splice(cats.length-1,0,p),
 registerSetting:()=>{}},MediaFlowSettingsCenter:{mountSection:()=>true}},
 V365_CATEGORIES:cats,V365_ICONS:{},S:{view:'settings',settings:{}},
 document:{querySelector:()=>null,createElement:()=>({innerHTML:'',querySelectorAll:()=>[]})},
 fetch:()=>{fetchCount++;throw Error('No eager network probes');},showToast:()=>{},
 setTimeout,clearTimeout
};
vm.createContext(context);
vm.runInContext(source,context,{filename:'v438-provider-management.js'});
const api=context.window.MediaFlowV438;
assert.equal(api.version,438);
assert.equal(fetchCount,0,'loading the directory never contacts an API');
assert(cats.some(x=>x.id==='api-providers'),'independent Settings Center API category registered');
assert(hooks.some(x=>x[0]==='settings'),'registered through canonical settings enhancer');
const items=api.list(),by=id=>items.find(p=>p.id===id);
assert(items.length>=24);
assert.equal(items.filter(p=>p.id==='tmdb').length,1,'provider IDs must be deduplicated');
assert.equal(by('tmdb').verified,true,'gateway verification is authoritative');
assert.equal(by('tmdb').coverEnabled,true,'Cover Recovery settings preserved');
assert.equal(by('omdb').verified,false,'missing credential does not become verified');
assert.equal(by('omdb').testKind,'none','unconfigured gateway cannot be tested as live');
assert.equal(by('simkl').state,'pending','cataloged restricted provider remains disabled');
assert.equal(by('igdb').testKind,'none','key-based games provider not silently enabled');
assert.equal(by('musicbrainz').testKind,'public','public music probe available');
assert.equal(by('jikan').testKind,'public','existing browser cover source can be tested');
assert.equal(by('vndb').metadataActive,false,'declared metadata capability not active recovery');
assert.equal(by('itunes').ratingActive,false,'staged providers cannot write ratings');
assert.equal(by('ifdb').state,'pending','interactive fiction source is catalog only');
const stat=api.inspect();assert(stat.total>=24&&stat.publicTestPaths>=8);
assert(source.includes('holder.querySelectorAll(\'.mf434-connection,.mf433-provider-readiness\')'),'move existing testing out of Cover Recovery');
assert(source.includes('registerCategory'),'dedicated Settings category');
assert(source.includes('mf434TestProvider(id)'),'real existing gateway test remains authoritative');
assert(source.includes('checkedAfter>checkedBefore'),'stale tests cannot pass as fresh success');
assert(source.includes('AbortController'),'public test must support timeouts');
assert(!source.includes('item.rating='),'test engine never rewrites personal rating');
assert(!source.includes('S.library='),'registry does not rewrite Library');
const settingsCss=fs.readFileSync('assets/css/247-v438-api-providers-testing.css','utf8');
assert(settingsCss.includes('var(--panel)')&&settingsCss.includes('@media(max-width:680px)'));
assert(fs.readFileSync('index.html','utf8').includes('assets/css/247-v438-api-providers-testing.css'));
console.log('PASS v438: independent Settings category, merged catalog, provider state integrity, public probes, gateway verification, browser theme and no eager network calls.');
