/* v571 release contract: Edit title → Unit & names spans the editor. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=571);
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/301-v571-release.css'));
const css=read('assets/css/301-v571-release.css');
for(const s of ['.v238-library-editor>.mf565-editor','grid-column:1/-1!important','.mf565-editor .field-row{display:grid!important'])
  assert(css.includes(s),'v571 css has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===571){const wf=read('.github/workflows/publish-v571.yml');assert(wf.includes('gh release create 571')&&wf.includes('legacy/v/571'));}
assert(read('docs/release-v571.md').startsWith('## MediaFlow v571 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v571"'));
console.log('v571 release contract passed');
