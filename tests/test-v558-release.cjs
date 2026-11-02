/* v558 release contract (no browser): the theme-polish module and stylesheet are
 * bundled after v557, versions match, workflows archive/release/deploy v558.
 * Behaviour is covered by tests/test-v558-theme-polish.cjs. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=558,'VERSION must be v558 or newer');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/401-v558-theme-polish.js')>runtime.indexOf('components/400-v557-log-library-popup.js'),'v558 module loads after the v557 popup');
const css=JSON.parse(read('src/css-order.json'));
const at=p=>css.findIndex(r=>r.path===p);
assert(at('assets/css/295-v558-theme-polish.css')>at('assets/css/294-v557-log-library-popup.css'),'v558 styles bundled after v557');
const mod=read('src/js/components/401-v558-theme-polish.js');
assert(mod.includes('new Intl.Collator')&&mod.includes('v224CompareLibraryLike=mf558CompareLibraryLike'),'shared collator for library sorting');
assert(mod.includes('details.isConnected===false'),'detached render copies cannot trigger list rebuilds');
assert(mod.includes('MF558_TYPE_DELAY')&&mod.includes('mf558-log-skeleton'),'debounced search and instant popup frame');
assert(mod.includes('mf555IdResultsHtml=function')&&mod.includes('mf558PlaceMinimize'),'External IDs layout and minimise placement');
const style=read('assets/css/295-v558-theme-polish.css');
assert(!/#141823|#2a3040|#f0b35a|#e8b04a/i.test(style),'no fixed dark fallback colours');
assert(style.includes('var(--flow)')&&style.includes('var(--panel)'),'theme variables used');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`),'HTML loads the current bundle');
if(version===558){
  const wf=read('.github/workflows/publish-v558.yml');
  assert(wf.includes('test "$(cat VERSION)" = 558')&&wf.includes('legacy/v/558')&&wf.includes('gh release create 558'),'release workflow archives and releases v558');
}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v558"'),'deploy runs after the v558 release');
assert(fs.existsSync(path.join(root,'docs/release-v558.md')),'release notes present');
console.log('PASS v558 release contract: theme polish module, styles, workflows.');
