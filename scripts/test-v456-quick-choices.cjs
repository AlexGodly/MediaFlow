/* MediaFlow v456 — explicit cover record/selection and progress contracts. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'456');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.deepEqual(order.slice(-2),['components/339-v456-quick-cover-candidates.js','components/340-v456-recovery-start-status.js']);
const quick=fs.readFileSync('src/js/components/339-v456-quick-cover-candidates.js','utf8');
const launch=fs.readFileSync('src/js/components/340-v456-recovery-start-status.js','utf8');
const original=fs.readFileSync('src/js/components/334-v453-quick-title-recovery.js','utf8');
const direct=fs.readFileSync('src/js/components/337-v455-workspace-direct-recovery.js','utf8');
const css=fs.readFileSync('assets/css/263-v456-recovery-progress-cover-choices.css','utf8');
assert(original.includes("item.externalIds={...(item.externalIds||{}),[link.key]:link.id}"),'Only previewed valid external ID may be saved');
assert(original.includes('mf456QuickProgress')&&original.includes('mf456NotifyRecoverySaved'),'Save stages and open title editor must be updated');
assert(direct.includes("mf456LaunchStage('validating'")&&direct.includes("mf456LaunchStage('stopping'"),'Direct launcher must show real stages');
assert(direct.includes('mf456WatchRecovery(kind)'),'Do not imply engine is running without checking');
for(const expected of ['grid-auto-rows:max-content','position:relative!important','height:auto!important',
'.mf456-cover-select','.mf456-saving progress','.mf456-editor-cover-preview','.mf456-launch-status']){
 assert(css.includes(expected),expected+' is required for complete non-overlapping UI');
}
const item={id:'anime1',title:'Anime Season 2',categoryId:'anime',coverUrl:'https://example.com/existing.jpg',externalIds:{}};
const candidates=[{url:'https://example.com/a.jpg',title:'Season 2 A',provider:'AniList',confidence:.935,
 idMatch:true,externalIdKey:'anilist',externalIdValue:'1234'},
 {url:'https://example.com/b.jpg',title:'Season 2 B',provider:'Kitsu',confidence:.63,
 idMatch:false,externalIdKey:'kitsu',externalIdValue:'555'}];
let paint=0;
const env={console,Date,Math,Number,String,Array,Object,Map,Set,JSON,Error,Promise,
 MF453Quick:{current:{id:'anime1',kind:'cover',covers:candidates,coverIndex:-1,applying:false,stage:'ready',closed:false}},
 MF456:{},S:{library:[item]},App:{},window:{},document:{createElement:()=>({innerHTML:'',querySelector:()=>null})},
 mf424Escape:x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'),
 mf424LinkableCoverId:(item,c)=>{
  const key=String(c.externalIdKey||''),value=String(c.externalIdValue||''),existing=String(item.externalIds?.[key]||'');
  if(!key||!value)return null;
  return {key,value,existing,conflict:Boolean(existing&&existing!==value)};
 },
 mf425Icon:()=>'<svg></svg>',mf439Item:id=>id==='anime1'?item:null,
 mf454QuickView:()=>'<footer class="mf454-quick-footer"></footer>',
 mf453PaintQuick:()=>paint++,mf453QuickRoot:()=>null,
 mf453Esc:x=>String(x??''),mf439DescribeValue:(a,b)=>String(b??''),
 mf453Category:()=>({name:'Anime'}),v53InvalidateLibraryCache:()=>{},showToast:()=>{}};
vm.createContext(env);vm.runInContext(quick,env,{filename:'v456-quick.js'});
assert.equal(env.window.MediaFlowV456Quick.version,456);
const pair=env.window.MediaFlowV456Quick.candidateLink(item,candidates[0]);
assert.deepEqual(JSON.parse(JSON.stringify(pair)),{key:'anilist',id:'1234',conflict:false,canLink:true});
const gallery=vm.runInContext("mf456CoverGallery(MF453Quick.current,S.library[0])",env);
assert(gallery.includes('Season 2 A')&&gallery.includes('Season 2 B'),'All alternatives must be present');
assert(gallery.includes('94% match')&&gallery.includes('63% match'),'Match percentages must be visible');
assert(gallery.includes('Provider record ID')&&gallery.includes('ID saved as'),'ID target always visible');
assert(gallery.includes('1234')&&gallery.includes('anilist')&&gallery.includes('555')&&gallery.includes('kitsu'));
assert(gallery.includes('Select this cover')&&gallery.includes('App.mf456SelectCover(1)'));
assert(!gallery.includes('v225-btn-icon'),'Generic circle arrow icons cannot be embedded');
env.App.mf456SelectCover(1);
assert.equal(env.MF453Quick.current.coverIndex,1,'Selection must be stable and explicit');
env.App.mf456SelectCover(1);
assert.equal(env.MF453Quick.current.coverIndex,1,'Clicking selected button must not deselect');
assert(paint>=2);
item.externalIds.kitsu='999';
const conflict=env.window.MediaFlowV456Quick.candidateLink(item,candidates[1]);
assert.equal(conflict.conflict,true);assert.equal(conflict.canLink,false,'Never overwrite a conflicting provider ID');
env.MF453Quick.current.applying=true;
const q=env.MF453Quick.current;
env.window.MediaFlowV456Quick.progress(q,'Validating artwork',false,3);
env.window.MediaFlowV456Quick.progress(q,'Artwork saved',true);
assert.equal(q.saveTotal,3);assert.equal(q.saveCompleted,1);
const display=vm.runInContext("mf456WithSaveProgress('<footer class=\"mf454-quick-footer\"></footer>',MF453Quick.current)",env);
assert(display.includes('<progress max="3" value="1"')&&display.includes('Artwork saved'));
console.log('PASS v456: multiple readable artwork records, exact provider IDs, conflict safety, explicit selection and staged saving');
