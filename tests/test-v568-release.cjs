/* v568 release contract: Mac and Linux in Get MediaFlow. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=568);
for(const f of ['macos','linux'])assert(fs.existsSync(path.join(root,'assets/icons/platforms/'+f+'.png')),f+' logo');
const get=read('src/js/components/416-v566-get-mediaflow.js');
for(const s of ["macos:'assets/icons/platforms/macos.png'","linux:'assets/icons/platforms/linux.png'","id==='macos'","id==='linux'",'-macOS\\.dmg','-macOS\\.zip','-Linux-x86_64\\.AppImage','-Linux-x86_64\\.tar\\.gz',"MF566_PLATFORM_ORDER=['android','windows','macos','linux','ios','web']"])
  assert(get.includes(s),'Get MediaFlow has '+s);
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
if(version===568){const wf=read('.github/workflows/publish-v568.yml');assert(wf.includes('gh release create 568')&&wf.includes('legacy/v/568'));}
assert(read('docs/release-v568.md').startsWith('## MediaFlow v568 Stable'));
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v568"'));
console.log('v568 release contract passed');
