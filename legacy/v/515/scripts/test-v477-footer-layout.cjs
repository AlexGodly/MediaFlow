/* v477 footer fix — isolation, appearance, and source stability. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'477');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/364-v477-background-footer-layout.js');
assert.equal(order.at(-2),'components/363-v476-background-visual-redesign.js');
const historical=fs.readFileSync('scripts/test-v476-background-design.cjs','utf8')
  .replace("trim(),'476'","trim(),'477'")
  .replace("order.at(-1),'components/363-v476-background-visual-redesign.js'","order.at(-2),'components/363-v476-background-visual-redesign.js'");
vm.runInNewContext(historical,{require,console,process},{filename:'v476-compatibility.cjs'});
const css=fs.readFileSync('assets/css/278-v477-background-widget-footer-layout.css','utf8');
const marker=fs.readFileSync('src/js/components/364-v477-background-footer-layout.js','utf8');
assert(fs.readFileSync('index.html','utf8').includes('278-v477-background-widget-footer-layout.css'));
assert(marker.includes('MediaFlowRuntime.version=477'));
assert(!/saveState|supabase|localStorage|MF424\.job|MF439\.job|mf441WidgetHtml\s*=/.test(marker),
 'v477 must not touch cloud, recovery jobs or markup');
for(const required of ['#mf441-process-widget.mf476-widget .mf441-widget-content .mf476-widget-foot',
 'display:grid!important','grid-template-columns:repeat(2,minmax(0,1fr))',
 'flex:initial!important','overflow-wrap:normal!important','word-break:normal!important',
 'writing-mode:horizontal-tb!important','min-height:41px!important',
 'var(--flow)','var(--panel-raised)','@media (max-width:720px)','@media (max-width:280px)',
 'button:last-child:nth-child(odd)',':focus-visible']){
 assert(css.includes(required),'Footer CSS requirement missing: '+required);
}
assert(!/\.mf441-process\s*\{|\.mf476-track\s*\{|mf424Pause\(/.test(css),
 'v477 must not restyle recovery mechanics/cards');
console.log('PASS v477: 2-column footer layout, readable horizontal text, retained v476 jobs, dynamic theme and no data writes');
