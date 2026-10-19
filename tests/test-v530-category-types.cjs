/* v530: Add/Edit Category must use the active v144 renderer, not only the old base modal. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('src/js/components/category/049-v144-reusable-category-icon-color-palettes.js');
const start=source.indexOf('categoryModalHtml=function(d){');
const end=source.indexOf('App.v144PickCategoryEmoji=function(',start);
assert(start>=0&&end>start,'The effective v144 category modal override must exist');
const override=source.slice(start,end);
const ctx={
  categoryModalHtml:null,
  v144SafeIconUrl:()=>'',escapeHtml:x=>String(x??''),
  COLOR_CHOICES:['#A78BFA'],ICON_CHOICES:['🎮'],
  UNITS:{episodes:{label:'episodes'},tracks:{label:'tracks'},matches:{label:'matches'}},
  v144IconSwatchHtml:()=>'',v144ColorSwatchHtml:()=>'',
  v144CustomIconsHtml:()=>'',v144CustomColorsHtml:()=>''
};
vm.createContext(ctx);
vm.runInContext(override,ctx);
const expected=[['video','Watching'],['reading','Reading'],['playing','Playing'],['listening','Listening']];
function choices(html){
 const m=html.match(/<select id="m-type">([\s\S]*?)<\/select>/);
 assert(m,'Category form must have its Type dropdown');
 return [...m[1].matchAll(/<option value="([^"]+)"\s*(selected)?\s*>([^<]*)<\/option>/g)]
  .map(x=>({value:x[1],selected:x[2]==='selected',label:x[3]}));
}
for(const isNew of [true,false]){
 for(const [type] of expected){
  const html=ctx.categoryModalHtml({id:isNew?'':'existing',name:'Test category',type,unit:'tracks',color:'#A78BFA'});
  const opts=choices(html);
  assert.equal(opts.length,4,'all four types in '+(isNew?'Add':'Edit')+' Category');
  assert.deepEqual(opts.map(o=>[o.value,o.label]),expected);
  assert.equal(opts.filter(o=>o.selected).length,1,'exactly one type selected');
  assert.equal(opts.find(o=>o.selected)?.value,type,'preserve saved selected type '+type);
  assert(html.includes('id="m-unit"'),'unit choices remain in category editor');
  assert(html.includes('id="m-icon"'),'built-in and custom icon editor remains intact');
 }
}
assert(source.includes("type:document.getElementById('m-type').value"),'category saves chosen type directly');
assert(source.includes('persistCategories();'),'category cloud persistence remains canonical');
const builtin=read('src/js/components/192-v258-category-icon-library-persistence-audit.js');
assert(builtin.includes('v258CategoryModalHtmlBase=categoryModalHtml'),'Built-in art palette wraps corrected modal rather than replacing type choices');
const base=read('src/js/components/modal/020-modals.js');
for(const [type,label] of expected)assert(base.includes('value="'+type+'"')&&base.includes('>'+label+'</option>'),'base modal also supports '+type);
console.log('PASS v530: real Add/Edit Category renderings offer four types, preserve type selection and canonical save pathway.');
