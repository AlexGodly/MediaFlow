/* MediaFlow v523: canceled title-side actions are absent and existing data models remain untouched. */
(function(){
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const order=JSON.parse(read('src/js/runtime-order.json'));
assert(!order.includes('components/377-v520-title-actions.js'),'v520 title-action integration must not be bundled');
assert(!order.includes('components/378-v521-title-actions-mounted.js'),'v521 fallback injection must not be bundled');
const index=read('index.html');
assert(!index.includes('288-v520-title-actions.css'),'no retired title-action styles');
assert(!index.includes('289-v521-visible-title-actions.css'),'no retired forced visibility styles');
const html=x=>String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ctx={
 S:{categories:[{id:'anime',name:'Anime',unit:'episodes'}]},
 window:{},App:{},document:{addEventListener(){}},
 Number,String,Date,Object,Array,Math,
 escapeHtml:html,cleanTitle:x=>String(x||''),
 getCategory:()=>({id:'anime',name:'Anime',unit:'episodes'}),
 v144CategoryIconHtml:()=>'',v144CategoryIconText:()=>'',v199StatusLabel:x=>x||'planned',unitLabel:()=> 'episodes'
};
vm.runInNewContext(read('src/js/components/modal/020-modals.js')+'\n'+read('src/js/components/title-details/113-global-title-details-popup.js'),ctx,{timeout:5000});
const drafts=[
 ctx.libraryModalHtml({categoryId:'anime',title:'New title'}),
 ctx.libraryModalHtml({id:'already',categoryId:'anime',title:'Existing title'}),
 ctx.v181TitleDetailsHtml({id:'already',categoryId:'anime',title:'Existing title',status:'planned',progress:2,total:12,priority:'medium',tags:[]})
];
for(const markup of drafts){
 assert(!/mf520|mf521|mf522-native-actions|mf522-canonical|Add to Personal Order|Add to Collection \(/.test(markup),'canceled buttons must not render');
 assert(!/mf520ToggleOrder|mf520OpenCollections/.test(markup),'canceled click handlers must not render');
}
assert.match(drafts[0],/id="l-title"/,'Add Title form still exists');
assert.match(drafts[1],/Save title/,'Edit Title save remains available');
assert.match(drafts[2],/Edit title/,'Title Details normal controls remain available');
const bundle=read('assets/js/mediaflow-v523.bundle.js');
assert(!bundle.includes('App.mf520ToggleOrder'),'canceled behavior not loaded in deployed JS');
assert(!bundle.includes('mf521RefreshTitleActions'),'observer-based re-insertion removed');
console.log('PASS v523: both canceled title actions absent from Add/Edit and Details; no re-insertion module or CSS; normal title controls remain.');
})();
