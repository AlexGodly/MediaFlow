/* v557 release contract (no browser): the Add to Logging popup module and its
 * stylesheet are loaded, versions match, workflows archive/release/deploy v557.
 * Behaviour is covered by tests/test-v557-log-library-popup.cjs. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=557,'VERSION must be v557 or newer');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/400-v557-log-library-popup.js')>runtime.indexOf('components/398-v555-interface.js'),'popup module loads after the v555 popup');
const css=JSON.parse(read('src/css-order.json'));
assert(css.some(r=>r.path==='assets/css/294-v557-log-library-popup.css'),'popup styles bundled');
const mod=read('src/js/components/400-v557-log-library-popup.js');
assert(mod.includes("details.v238-log-library")&&mod.includes('mf557-hidden'),'only Browse Library is shown');
assert(mod.includes('App.mf557OpenLogging'),'Open Logging link');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`),'HTML loads the current bundle');
if(version===557){
  const wf=read('.github/workflows/publish-v557.yml');
  assert(wf.includes('test "$(cat VERSION)" = 557')&&wf.includes('legacy/v/557')&&wf.includes('gh release create 557'),'release workflow archives and releases v557');
}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v557"'),'deploy runs after the v557 release');
assert(fs.existsSync(path.join(root,'docs/release-v557.md')),'release notes present');
console.log('PASS v557 release contract: popup module, styles, workflows.');
