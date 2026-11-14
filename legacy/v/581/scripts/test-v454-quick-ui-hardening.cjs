/* MediaFlow v454 — modal, recovery alternatives and scroll-stable presets. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
assert(['454','455','456','457','458','459'].includes(fs.readFileSync('VERSION','utf8').trim()));
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert(order.includes('components/335-v454-preset-layout.js')&&order.includes('components/336-v454-quick-title-hardening.js'));
assert(order.includes('components/338-v455-recovery-handoff-visibility.js'));
assert(order.includes('components/340-v456-recovery-start-status.js'));
const preset=fs.readFileSync('src/js/components/335-v454-preset-layout.js','utf8'),
 quick=fs.readFileSync('src/js/components/336-v454-quick-title-hardening.js','utf8'),
 css=fs.readFileSync('assets/css/261-v454-quick-presets-hardening.css','utf8');
assert(css.includes('z-index:2147483000!important'),'Title popups must appear above original Anime Details/Edit dialogs');
assert(css.includes('.mf454-category-art img')&&css.includes('max-width:24px!important'),'Huge category artwork must be bounded');
assert(css.includes('.mf454-cover-gallery')&&css.includes('minmax(min(145px,100%),1fr)'),'Cover cards must have readable widths');
assert(quick.includes("mf451Prepare('both',id)"),'Quick cover/metadata/both must pause both existing recovery engines');
assert(quick.includes('q.preparePromise')&&quick.includes('if(q.scanPromise)await'),'Close during pause must restore after safe boundaries');
assert(quick.includes('mf454QuickRemoveDom')&&quick.includes('querySelectorAll('),'Remove orphaned duplicate popups');
assert(quick.includes('await Promise.allSettled(tasks)'),'Quick Cover and Metadata search in parallel, not serially');
assert(quick.includes('q.covers.length>=24'),'Multiple cover alternatives retained');
assert(quick.includes('p.options.map'),'Alternate verified metadata choices exposed');
assert(quick.includes("!url.startsWith('https://')||found.has(url)"),'Display reviewable loadable cover alternatives');
assert(quick.includes('mf424Image(url,candidate.provider)'),'Artwork must still load before selection');
assert(quick.includes("if(chosen&&(Number(chosen.confidence)<.65||chosen.idMatch!==true)"),'Missing verified ID requires explicit review');
assert(preset.includes('mf454FindProviders')&&preset.includes('mf454FindCategories'));
assert(preset.includes('mf454CopyPreset')&&preset.includes('mf453SavePreset'));
assert(!preset.includes("mf453PaintPresets();\n};\nmf453PresetBulk"),'Bulk checkbox action must not rebuild entire panel');
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const category={id:'anime',name:'Anime Backlog',iconUrl:'https://example.com/category.png'};
const env={
 console,Date,Map,Set,Promise,JSON,Object,Number,String,Array,Math,Error,setTimeout,clearTimeout,
 AbortController,structuredClone,
 S:{categories:[category,{id:'manga',name:'Manga'}],library:[{id:'1',title:'Oshi no Ko',categoryId:'anime',
 coverUrl:'https://example.com/existing.jpg'}],settings:{}},
 MF453:{category:'anime'},MF453Quick:{current:null,serial:0,account:'account',loading:false},
 MF451:{journal:null},MF424:{running:false},MF439:{working:false},MF442:{process:'',owner:'self'},
 MF447:{},App:{},window:{},document:{activeElement:null,querySelector:()=>null,querySelectorAll:()=>[],
 getElementById:()=>null,addEventListener:()=>{},removeEventListener:()=>{}},
 mf453Esc:esc,mf425Icon:()=>'<svg class="icon"></svg>',mf452Icon:x=>'<svg class="'+x+'"></svg>',
 mf445CategoryIcon:()=>'<img src="https://example.com/category.png">',
 mf453Category:id=>id==='anime'?category:id==='manga'?{id:'manga',name:'Manga'}:null,
 mf453Presets:()=>env.S.settings.v453RecoveryPresets||{},
 mf453ProvidersFor:(mode,cat)=>env.S.settings.v453RecoveryPresets?.[cat]?.[mode]||
 (mode==='cover'?['jikan','kitsu']:['anilist','mal']),
 mf453SavePreset:(cat,mode,ids)=>{
 const p=env.S.settings.v453RecoveryPresets||(env.S.settings.v453RecoveryPresets={});
 p[cat]=p[cat]||{};p[cat][mode]=ids;
 },
 mf445Providers:mode=>mode==='cover'?
 [{id:'jikan',name:'Jikan',available:true},{id:'kitsu',name:'Kitsu',available:true}]:
 [{id:'anilist',name:'AniList',available:true},{id:'mal',name:'MAL',available:false}],
 mf453PresetHtml:()=>'',mf453PresetToggle:()=>{},mf453PresetBulk:()=>{},
 mf453ChooseCategory:()=>{},mf453PaintPresets:()=>{},showToast:()=>{},
 mf453QuickRoot:()=>null,mf453QuickHtml:()=>'',mf453PaintQuick:()=>{},
 mf453ApplyQuick:()=>{},mf453CloseQuick:()=>{},mf453OpenQuick:()=>{},
 mf439Item:id=>env.S.library.find(x=>x.id===id)||null,
 mf439DescribeValue:(token,v)=>String(v??'—'),
 mf424Image:async()=>true,mf424Discover:async()=>[],
 mf439Discover:async()=>({preview:{results:0,proposals:[]}}),
 mf424Escape:esc,mf444Confirm:async()=>true,
 mf453Ready:(mode,item)=>env.mf453ProvidersFor(mode,item.categoryId),
 mf439Account:()=> 'account',mf442ProcessLease:()=>null,mf451Prepare:async()=>true,
 mf451Restore:async()=>true,mf443EnsureGateway:async()=>null,
 AUTH_USER:{id:'account'}
};
vm.createContext(env);
vm.runInContext(preset,env);
assert(env.window.MediaFlowV454Presets.version===454);
let html=env.window.MediaFlowV454Presets.html();
assert(html.includes('Anime Backlog')&&html.includes('Search categories'));
assert(html.includes('Find cover provider')&&html.includes('Copy cover + metadata selections'));
assert(html.includes('mf454-category-art')&&html.includes('mf454-provider-row'));
env.App.mf453PresetToggle('anime','cover','jikan',false);
assert.deepEqual(Array.from(env.mf453ProvidersFor('cover','anime')),['kitsu']);
env.App.mf453PresetBulk('anime','metadata','none');
assert.deepEqual(Array.from(env.mf453ProvidersFor('metadata','anime')),[]);
vm.runInContext(quick,env);
assert.equal(env.window.MediaFlowV454.version,454);
const fixture={id:'1',kind:'both',serial:1,stage:'ready',closed:false,
 coverLoading:false,metaLoading:false,applying:false,
 covers:[{url:'https://example.com/one.jpg',title:'Season 2',provider:'anilist',confidence:.95},
 {url:'https://example.com/other.jpg',title:'Season 2 variant',provider:'jikan',confidence:.4}],
 coverIndex:1,pending:[],errors:[],
 metadata:{preview:{results:3,proposals:[{token:'field.summary',label:'Summary',status:'ready',
 original:null,selected:true,protected:false,hasOriginal:false,same:false,choice:0,
 options:[{value:'Option A',sources:[{provider:'anilist',evidence:'ID'}]},
 {value:'Option B',sources:[{provider:'jikan',evidence:'Title'}]}]}]}}};
env.MF453Quick.current=fixture;env.MF453Quick.serial=1;
const view=env.window.MediaFlowV454.html();
assert(view.includes('Season 2 variant')&&view.includes('Option A')&&view.includes('Option B'));
assert(view.includes('Unverified match')&&view.includes('2 source alternatives'));
assert(view.includes('Current cover')===false||view.includes('Existing cover'));
assert(view.includes('Search all ready providers')&&view.includes('Confirm selected changes'));
assert.equal(env.S.library[0].coverUrl,'https://example.com/existing.jpg','Only previewed, never mutated');
assert(view.includes('mf454-cover-option')&&view.includes('mf454-meta-option'));
console.log('PASS v454: compact bounded icons, no jump on selections, multiple cover/metadata variants, close-safe priority handoff and top-layer modal contract');
