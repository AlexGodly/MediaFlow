/* MediaFlow v522 — canonical real markup render assertions; previous v520/v521 tests did not execute these renderers. */
(function run(){
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const modal=read('src/js/components/modal/020-modals.js');
const details=read('src/js/components/title-details/113-global-title-details-popup.js');
const html=x=>String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const ctx={
 S:{categories:[{id:'anime',name:'Anime',unit:'episodes'}]},
 window:{MediaFlowV520:{isOrdered:id=>id==='already',membershipCount:id=>id==='already'?3:0}},
 App:{},
 document:{addEventListener(){}},
 Number,String,Date,Object,Array,Math,
 escapeHtml:html,cleanTitle:x=>String(x||''),
 getCategory:()=>({id:'anime',name:'Anime',unit:'episodes'}),
 v144CategoryIconHtml:()=>'',v144CategoryIconText:()=>'',v199StatusLabel:x=>x||'planned',unitLabel:()=> 'episodes'
};
vm.runInNewContext(modal+'\n'+details,ctx,{timeout:5000});
const add=ctx.libraryModalHtml({categoryId:'anime',title:'Draft'});
assert.match(add,/data-mf522-canonical="1"/);
assert.match(add,/data-mf520-scope="editor"/);
assert.match(add,/Add to Personal Order/);
assert.match(add,/Add to Collection \(0\)/);
assert.match(add,/App\.mf520OpenCollections\(''\)/);
const edit=ctx.libraryModalHtml({id:'already',categoryId:'anime',title:'Saved'});
assert.match(edit,/Added to Personal Order/);
assert.match(edit,/Add to Collection \(3\)/);
assert.match(edit,/App\.mf520ToggleOrder\('already'\)/);
const detail=ctx.v181TitleDetailsHtml({id:'already',categoryId:'anime',title:'Saved',status:'planned',progress:2,total:12,priority:'medium',tags:[]});
assert.match(detail,/data-mf520-scope="details"/);
assert.match(detail,/Add to Collection \(3\)/);
assert.match(detail,/Added to Personal Order/);
assert.match(detail,/App\.mf520OpenCollections\('already'\)/);
assert.equal((detail.match(/mf520-title-actions/g)||[]).length,1);
assert.equal((edit.match(/mf520-title-actions/g)||[]).length,1);
console.log('PASS v522: canonical Add/Edit Title and Title Details render directly with both working action controls, saved membership count, and no duplicates.');
})();
