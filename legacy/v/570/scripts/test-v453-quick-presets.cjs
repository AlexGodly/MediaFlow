/* MediaFlow v453 — actionable presets and quick recovery contracts. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(['453','454','455','456','457','458','459'].includes(fs.readFileSync('VERSION','utf8').trim()));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/333-v453-recovery-presets.js')&&order.includes('components/334-v453-quick-title-recovery.js'));
assert(order.includes('components/336-v454-quick-title-hardening.js'));
assert(order.includes('components/338-v455-recovery-handoff-visibility.js'));
assert(order.includes('components/340-v456-recovery-start-status.js'));
const presetsSrc=fs.readFileSync('src/js/components/333-v453-recovery-presets.js','utf8');
const quickSrc=fs.readFileSync('src/js/components/334-v453-quick-title-recovery.js','utf8');
const oldSelect=fs.readFileSync('src/js/components/332-v452-recovery-control-polish.js','utf8');
const oldCheck=fs.readFileSync('src/js/components/326-v446-recovery-scope-controls.js','utf8');
assert(oldSelect.includes('mf424Escape(action)'), 'Provider Select All onclick must HTML-escape JSON quotes');
assert(oldCheck.includes('mf445Esc(JSON.stringify(mode))'), 'Individual checkbox onchange must HTML-escape JSON quotes using the existing v445 helper');
const writes=[],messages=[];
const providers={
 cover:[{id:'jikan',name:'Jikan',available:true},{id:'tmdb',name:'TMDB',available:false}],
 metadata:[{id:'anilist',name:'AniList',available:true},{id:'omdb',name:'OMDb',available:false}]
};
const escape=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const env={
 console,Map,Set,Date,JSON,Object,Number,String,Array,Math,Error,Promise,setTimeout,clearTimeout,AbortController,structuredClone,
 S:{settings:{},categories:[{id:'anime',name:'Anime'},{id:'games',name:'Games'}],
 library:[{id:'1',title:'Anime Sample',categoryId:'anime',coverUrl:'https://example.com/existing.jpg'}]},
 MF445:{mode:'cover'},MF447:{active:'both'},MF424:{running:false},MF439:{working:false},MF442:{process:''},
 App:{mf447Open:()=> 'bulk'},window:{MediaFlowSettingsCenter:{mountSection:()=>{}},MediaFlowSettingsRegistry:{}},
 document:{querySelector:()=>null,getElementById:()=>null},
 mf424Escape:escape,mf425Icon:()=>'<svg></svg>',
 mf452Icon:key=>'<svg class="mf452-icon-'+key+'"></svg>',
 mf445CategoryIcon:()=>'<i>icon</i>',
 mf424Defaults:()=>({enabled:env.S.settings?.v424Covers?.enabled||['jikan','tmdb']}),
 mf439Preferences:()=>({enabled:env.S.settings?.v439Metadata?.enabled||['anilist','omdb']}),
 mf445Providers:mode=>providers[mode],
 mf446SourceHtml:()=>'<section class="mf446-providers"></section>',
 mf446ToggleProvider:()=>{},mf441WorkspaceHtml:()=>'<div><fieldset class="mf441-widget-preferences"></fieldset></div>',
 mf445Panel:()=>{},mf452SaveProviders:(mode,enabled)=>{
 env.S.settings[mode==='cover'?'v424Covers':'v439Metadata']={enabled};},
 MediaFlowRuntime:{registerPageEnhancer:()=>{}},
 saveState:async()=>{writes.push(1)},showToast:x=>messages.push(x),
 mf439Item:id=>env.S.library.find(x=>x.id===id),
 mf439DescribeValue:(k,v)=>String(v??''),
 mf424Discover:async()=>[],mf424Image:async()=>true,
 mf439Discover:async item=>({preview:{titleId:item.id,results:1,proposals:[]},failures:[]}),
 mf439Apply:()=>({changed:0}),mf444Confirm:async()=>true,
 v53InvalidateLibraryCache:()=>{},render:()=>{},mf439Account:()=> 'account',
 mf442ProcessLease:()=>null,mf451Prepare:async()=>true,mf451Restore:async()=>true,
 mf443EnsureGateway:async()=>null,AUTH_USER:{id:'account'}
};
vm.createContext(env);vm.runInContext(presetsSrc,env,{filename:'v453-presets.js'});
const api=env.window.MediaFlowV453Presets;
assert.equal(api.version,453);
assert.deepEqual(Array.from(api.configured('cover','anime')),['jikan','tmdb']);
env.App.mf453PresetToggle('anime','cover','tmdb',false);
assert.deepEqual(Array.from(api.configured('cover','anime')),['jikan']);
env.App.mf453PresetToggle('anime','cover','tmdb',true);
assert.deepEqual(Array.from(api.configured('cover','anime')),['jikan','tmdb']);
assert.deepEqual(Array.from(api.ready('cover',env.S.library[0])),['jikan'],'Pending providers must not execute');
env.App.mf453PresetBulk('anime','metadata','none');
assert.deepEqual(Array.from(api.configured('metadata','anime')),[]);
env.App.mf453PresetBulk('games','cover','available');
assert.deepEqual(Array.from(api.configured('cover','games')),['jikan']);
env.App.mf453PresetBulk('anime','metadata','global');
assert.deepEqual(Array.from(api.configured('metadata','anime')),['anilist','omdb']);
assert(writes.length>=5,'Category selections must use existing settings persistence');
const html=api.html();
assert(html.includes('Recovery Presets')&&html.includes('Anime')&&html.includes('Jikan'));
assert(html.includes('mf453PresetToggle(&quot;anime&quot;,&quot;cover&quot;,&quot;jikan&quot;'));
assert(html.includes('Pending setup / adapter'));
vm.runInContext(quickSrc,env,{filename:'v453-quick.js'});
assert.equal(env.window.MediaFlowV453.version,453);
assert.equal(env.App.mf447Open('metadata',{entry:'bulk'}),'bulk');
const fixture={id:'1',kind:'both',coverLoading:false,metaLoading:false,applying:false,
 covers:[{url:'https://example.com/new.jpg',title:'New cover',provider:'jikan',confidence:.95}],
 coverIndex:-1,pending:[],errors:[],
 metadata:{preview:{results:1,proposals:[{
 token:'field.description',label:'Description',original:null,status:'ready',
 selected:true,protected:false,hasOriginal:false,same:false,choice:0,
 options:[{value:'A verified synopsis',sources:[{provider:'anilist',evidence:'verified ID'}]}]
 }]}}};
vm.runInContext('MF453Quick.current='+JSON.stringify(fixture),env);
const display=vm.runInContext('mf453QuickHtml()',env);
assert(display.includes('New covers')&&display.includes('New metadata'));
assert(display.includes('Confirm selected changes')&&display.includes('A verified synopsis'));
assert(display.includes('Current cover')&&display.includes('verified ID'));
assert.equal(env.S.library[0].coverUrl,'https://example.com/existing.jpg','Preview must never save');
assert(quickSrc.includes('mf439Apply(item,preview')&&quickSrc.includes('await saveState()'));
assert(quickSrc.includes('mf444Confirm('),'Existing cover replacements require extra confirmation');
assert(fs.readFileSync('index.html','utf8').includes('260-v453-quick-recovery-presets.css'));
console.log('PASS v453: HTML-escaped provider actions, category presets, pending provider isolation and quick cover+metadata confirmation');
