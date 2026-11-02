/* v555 release contract (no browser): version stamps, modules loaded in
 * order, stylesheet bundle wired into HTML and the service worker, release
 * workflow archives to legacy/v/555 and deploys. The behaviour itself is
 * covered by the browser suites in tests/test-v555-*.cjs. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=555,'VERSION must be v555 or newer');
const vj=JSON.parse(read('version.json'));
assert.equal(vj.build,version);assert.equal(vj.version,version);assert.equal(vj.appVersion,version);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const mods=['394-v555-performance-core','395-v555-background-save','396-v555-ratings-engine','397-v555-id-finder','398-v555-interface'];
const pos=mods.map(m=>runtime.indexOf('components/'+m+'.js'));
assert(pos.every(i=>i>=0),'all v555 modules loaded');
assert.deepEqual([...pos].sort((a,b)=>a-b),pos,'v555 modules load in dependency order');
assert(pos[0]>runtime.indexOf('components/393-v553-reroll-title-xp.js'),'v555 modules load after every earlier module');
const index=read('index.html');
assert(index.includes(`assets/js/mediaflow-v${version}.bundle.js`),'HTML loads the JS bundle');
assert(index.includes(`assets/css/mediaflow-v${version}.bundle.css`),'HTML loads the stylesheet bundle');
assert.equal((index.match(/<link rel="stylesheet" href="assets\/css\//g)||[]).length,1,'one local stylesheet request');
const order=JSON.parse(read('src/css-order.json'));
for(const row of order)assert(fs.existsSync(path.join(root,row.path)),'stylesheet source exists: '+row.path);
assert(order.some(r=>r.path==='assets/css/293-v555-performance.css'),'v555 styles bundled');
assert(!order.some(r=>r.path.includes('266-v461-background-shortcut-layout')),'old menu-item sizing removed');
assert(order.filter(r=>r.media).every(r=>/max-width/.test(r.media)),'media-scoped stylesheets keep their media query');
const sw=read('sw.js');
assert(sw.includes(`mediaflow-v${version}.bundle.css`)&&sw.includes(`mediaflow-v${version}.bundle.js`),'PWA caches both bundles');
const wf=read('.github/workflows/publish-v555.yml');
assert(wf.includes('test "$(cat VERSION)" = 555')&&wf.includes('legacy/v/555')&&wf.includes("gh release create 555"),'release workflow archives and releases v555');
const deploy=read('.github/workflows/deploy-pages.yml');
assert(deploy.includes('"Build archive and release MediaFlow v555"'),'deploy runs after the v555 release');
assert(fs.existsSync(path.join(root,'docs/release-v555.md')),'release notes present');
const gw=read('supabase/functions/mediaflow-api-gateway/index.ts');
assert(gw.includes('version:555')&&gw.includes('LOOSE'),'gateway v555');
assert(fs.existsSync(path.join(root,'supabase/migrations/20261102_v555_gateway_quota_limits.sql')),'quota migration present');
const save=read('src/js/components/395-v555-background-save.js');
assert(save.includes('const CH=24576')&&!/const CH=0x8000/.test(save),'base64 chunks are a multiple of 3 bytes');
const ratings=read('src/js/components/396-v555-ratings-engine.js');
assert(ratings.includes('// 1. Saved IDs first.')&&ratings.includes('// 3. Recheck'),'ratings engine order: saved IDs, discovery, recheck');
assert(ratings.includes("Object.assign(MF547_LIMITS,{perHour:60,perDay:500"),'catch-up limits raised');
console.log('PASS v555 release contract: versions, module order, stylesheet bundle, PWA, workflows, gateway.');
