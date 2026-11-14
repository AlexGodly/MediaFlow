/* v472 Showcase depth contract + prior v471 unlimited-covers checks.
 * Does not load credentials or mutate a MediaFlow account. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const code=fs.readFileSync('scripts/test-v471-showcase.cjs','utf8')
 .replace("trim(),'471'","trim(),'472'")
 .replace("order.at(-1),'components/358-v471-collections-showcase-collage.js'","order.at(-2),'components/358-v471-collections-showcase-collage.js'");
vm.runInNewContext(code,{require,console,process}, {filename:'test-v471-compatible.cjs'});
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/359-v472-showcase-hover-depth.js');
const css=fs.readFileSync('assets/css/274-v472-showcase-hover-depth.css','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('274-v472-showcase-hover-depth.css'));
for(const token of [
'.mf274-collections-browser .mf471-showcase-poster:hover',
'.mf274-collections-browser .mf471-showcase-entry:hover',
'.mf274-collections-browser .mf471-showcase-poster::after',
'--mf472-zoom:1.075','box-shadow:','z-index:12','brightness(.83)',
'padding:8px 9px 9px','@media(max-width:680px)','@media(pointer:coarse)',
'@media(prefers-reduced-motion:reduce)',':focus-visible'
])assert(css.includes(token),'Missing Simkl-inspired behavior: '+token);
for(const selector of css.matchAll(/\n\s*([^{}]+)\s*\{/g)){
 const value=selector[1].trim();
 if(value.startsWith('@')||value.startsWith('/*')||!value.includes('.mf'))continue;
 assert(value.includes('.mf274-collections-browser'), 'Outside Collections Showcase: '+value.slice(0,110));
}
const marker=fs.readFileSync('src/js/components/359-v472-showcase-hover-depth.js','utf8');
assert(marker.includes('MediaFlowRuntime.version=472'));
assert(!/persistSettings\(|saveState\(|rawSet\(/.test(marker),'Presentation-only marker cannot save user data');
console.log('PASS v472: Simkl hover highlights, individual poster shadows, responsive inset, focus/touch/reduced motion and v471 parity');
