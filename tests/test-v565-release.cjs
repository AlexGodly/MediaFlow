/* v565 release contract (runs in CI without a browser). The full in-browser
 * check is tests/test-v565-interface.cjs. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=565);
const runtime=JSON.parse(read('src/js/runtime-order.json'));
const mods=['408-v565-fixes','409-v565-floating-controls','410-v565-quick-logging','411-v565-titles','412-v565-collection-cover','413-v565-xp-everywhere','414-v565-get-mediaflow','415-v565-faq'];
let last=runtime.indexOf('components/407-v564-native-theme-default.js');
for(const m of mods){const i=runtime.indexOf('components/'+m+'.js');assert(i>last,m+' runs after the previous module');last=i;}
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/297-v565-release.css'));
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`));
assert(read('src/js/components/405-v562-library-history-more.js').includes('class="btn btn-sm mf562-more-btn"'),'More button has its own class');
assert(read('assets/css/296-v562-library-history-more.css').includes('.mf562-more-btn{'));
if(version===565){const wf=read('.github/workflows/publish-v565.yml');assert(wf.includes('gh release create 565')&&wf.includes('legacy/v/565'));}
assert(read('docs/release-v565.md').startsWith('## MediaFlow v565 Stable'),'release notes exist for the publish step');
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v565"'));
// Category conversion sits on the logging paths.
for(const f of ['src/js/features/logging/008-session-flow.js','src/js/pages/batch-log/014-view-batch-log-v61.js','src/js/components/290-v397-floating-dock.js','src/js/components/381-v537-unified-xp-reward-preview.js'])
  assert(read(f).includes('mf565ToCategoryAmount'),f+' converts title units to category units');

// Pure helpers.
const ctx={window:{},MediaFlowRuntime:{registerPageEnhancer(){}},S:{settings:{},library:[]},document:{addEventListener(){},documentElement:{}},
  UNITS:{episodes:{label:'episodes',singular:'episode'},sessions:{label:'sessions',singular:'session'}},App:{},setTimeout(){},setInterval(){},
  getCategory:()=>({unit:'sessions',minutesPerUnit:60}),MutationObserver:function(){this.observe=()=>{};},requestAnimationFrame:()=>0};
vm.createContext(ctx);
vm.runInContext(`
function unitLabel(k,c){const u=UNITS[k]||UNITS.episodes;return c===1?u.singular:u.label;}
function cleanTitle(v){return String(v??'').trim();}
function v369DefaultSeconds(){return 3600;}
function batchTitleCandidates(){return [];}
function mf439TitleVariants(i){return [i.title];}
async function mf439Discover(){return {};}
function mf439Apply(){return {changed:0};}
function libraryModalHtml(){return '';}
let mf565PaintBatch=()=>{};
var renderView=()=>{};
var persistLibrary=()=>{};
${read('src/js/components/411-v565-titles.js')}
this.out={
  f:mf565UnitFactor({mf565Unit:'matches',mf565SecondsPerUnit:1200},{minutesPerUnit:60}),
  c:mf565ToCategoryAmount({mf565Unit:'matches',mf565SecondsPerUnit:1200},{minutesPerUnit:60},3),
  same:mf565ToCategoryAmount({},{minutesPerUnit:60},3),
  noRuntime:mf565ToCategoryAmount({mf565Unit:'matches'},{minutesPerUnit:60},3),
  label1:unitLabel('matches',1),label2:unitLabel('matches',2),epi:unitLabel('episodes',2),
  key:mf565UnitKey({mf565Unit:'matches'},{unit:'sessions'}),keyCat:mf565UnitKey({},{unit:'sessions'}),
  en:mf565DisplayTitle({title:'Shingeki no Kyojin',titleEnglish:'Attack on Titan'},{global:'en',categories:{}}),
  fallback:mf565DisplayTitle({title:'Only Main'},{global:'en',categories:{}}),
  exempt:mf565DisplayTitle({title:'Main',titleEnglish:'Eng',mf565NameExempt:true},{global:'en',categories:{}}),
  perTitle:mf565DisplayTitle({title:'Main',mf565Names:[{lang:'ja',text:'メイン'}],mf565NameLanguage:'ja'},{global:'en',categories:{}}),
  match:mf565NameMatches({title:'Shingeki no Kyojin',titleEnglish:'Attack on Titan'},'titan'),
  added:(()=>{const it={title:'A',mf565Names:[{lang:'en',text:'B'}]};const n=mf565AddNames(it,[{lang:'en',text:'B'},{lang:'ja',text:'C'},{lang:'en',text:'A'}]);return [n,it.mf565Names.length];})()
};`,ctx);
const o=ctx.out;
assert.equal(o.f,1/3);assert.equal(o.c,1,'3 × 20-min matches = 1 hour session');
assert.equal(o.same,3,'titles without their own unit count 1 for 1');
assert.equal(o.noRuntime,3,'own unit without a runtime counts 1 for 1');
assert.equal(o.label1,'match');assert.equal(o.label2,'matches');assert.equal(o.epi,'episodes');
assert.equal(o.key,'matches');assert.equal(o.keyCat,'sessions');
assert.equal(o.en,'Attack on Titan');assert.equal(o.fallback,'Only Main');assert.equal(o.exempt,'Main');assert.equal(o.perTitle,'メイン');
assert(o.match,'search matches another name');
assert.equal(JSON.stringify(o.added),'[1,2]','recovered names are added once, never duplicated');
console.log('v565 release contract passed');
