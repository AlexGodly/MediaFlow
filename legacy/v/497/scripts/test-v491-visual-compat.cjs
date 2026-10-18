// MediaFlow v484: Visual Evolution schema/compatibility contract.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/js/components/371-v484-visual-evolution-foundation.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/284-v484-visual-evolution-foundation.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const runtime=JSON.parse(fs.readFileSync(path.join(root,'src/js/runtime-order.json'),'utf8'));
execFileSync('node',['--check',path.join(root,'src/js/components/371-v484-visual-evolution-foundation.js')]);
assert(runtime.includes('components/371-v484-visual-evolution-foundation.js'));
assert.match(html,/mediaflow-v491\.bundle\.js/);
assert.match(html,/284-v484-visual-evolution-foundation\.css/);
for(const token of ['v160ExtractCoverTheme=function','v162SoftPalette=function','v146RefreshDynamicTheme=async function',
 'mf484ApplyAtmosphere','mf484SaveStudio','mf484MountSettings','v365PatchSettings','MediaFlowV484']){
 assert.ok(source.includes(token),'Missing integration '+token);
}
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/data-mf484-living/);
const prefix=source.slice(0,source.indexOf('const mf484LegacyExtract='));
const context=vm.createContext({DEFAULT_SETTINGS:{},S:{settings:{}}});
vm.runInContext(prefix+'\nthis.probe={hex:mf484Hex,url:mf484ImageUrl,clean:mf484Clean};',context);
const api=context.probe;
const def=api.clean({});
assert.equal(def.mode,'legacy');
assert.equal(def.living.mode,'off');
assert.equal(def.active,'initial');
assert.equal(def.profiles[0].source,'manual');
assert.equal(api.hex('#abcdEF'),'#ABCDEF');
assert.equal(api.hex('red'),'#8B5CF6');
assert.equal(api.url('javascript:alert(1)'),'');
assert.equal(api.url('https://example.com/cover.jpg'),'https://example.com/cover.jpg');
const bad=api.clean({mode:'evil',living:{mode:'full',effects:{particles:false}},profiles:[{
 id:'abc',source:'image',imageUrl:'javascript:bad',colors:['#ff0011','bad']
}]});
assert.equal(bad.mode,'legacy');
assert.equal(bad.living.mode,'off');
assert.equal(bad.living.effects.particles,false);
assert.equal(bad.profiles[0].imageUrl,'');
assert.equal(bad.profiles[0].colors[0],'#FF0011');
const custom=api.clean({mode:'custom',active:'x',profiles:[{id:'x',name:'Sky',source:'hybrid',
 imageUrl:'https://example.com/sky.png',colors:['#123456','#654321','#121212','#EFEFEF']}]});
assert.equal(custom.mode,'custom');
assert.equal(custom.active,'x');
assert.equal(custom.profiles[0].source,'hybrid');
console.log('PASS v484 schema, sanitized custom URLs/colors, default Legacy and disabled motion, runtime wiring, CSS and syntax');
