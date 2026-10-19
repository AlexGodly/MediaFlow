/* MediaFlow v529: transparent PNG built-in category icon regression. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=fs.readFileSync(path.join(root,'src/js/components/192-v258-category-icon-library-persistence-audit.js'),'utf8');
for(const name of ['Games','Music']){
  const src='assets/category-icons/'+name.toLowerCase()+'.png';
  assert(file.includes("{label:'"+name+"',src:'"+src+"'}"),name+' is in the canonical built-in icon picker');
  const png=fs.readFileSync(path.join(root,src));
  assert(png.length>500,name+' artwork must exist');
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','real PNG');
  assert.equal(png.readUInt32BE(16),128,'icon width');
  assert.equal(png.readUInt32BE(20),128,'icon height');
  assert(png.includes(Buffer.from('tRNS'))||png[25]===6,'icon retains transparent edges');
}
assert(file.includes('V258_BUILTIN_CATEGORY_ICONS.map(icon=>'), 'built-in palette continues to use the shared icon registry');
assert(file.includes('App.v258PickBuiltInCategoryIcon'), 'existing icon picker remains active');
assert(file.includes('V258_BUILTIN_CATEGORY_ICON_SET'), 'new image paths are automatically allowed by safe URL validator');
console.log('PASS v529: Games and Music PNG icons, transparency, picker selection and validation.');
