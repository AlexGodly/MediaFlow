/* v562 release contract: Library History title chips and the More popup.
 * Runs the real v562 module on top of a minimal v241 / v341 stand-in. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const version=Number(read('VERSION').trim());
assert(version>=562,'VERSION must be v562 or newer');
const runtime=JSON.parse(read('src/js/runtime-order.json'));
assert(runtime.indexOf('components/405-v562-library-history-more.js')>runtime.indexOf('components/404-v561-live-logging-app-time.js'),'v562 module loads after v561');
assert(JSON.parse(read('src/css-order.json')).some(r=>r.path==='assets/css/296-v562-library-history-more.css'),'v562 stylesheet is bundled');
assert(read('index.html').includes(`mediaflow-v${version}.bundle.js`),'HTML loads the current bundle');
assert(fs.existsSync(path.join(root,'docs/release-v562.md')),'release notes present');
if(version===562){
  const wf=read('.github/workflows/publish-v562.yml');
  assert(wf.includes('test "$(cat VERSION)" = 562')&&wf.includes('legacy/v/562')&&wf.includes('gh release create 562'),'release workflow archives and releases v562');
}
assert(read('.github/workflows/deploy-pages.yml').includes('"Build archive and release MediaFlow v562"'),'deploy runs after the v562 release');

const mod=read('src/js/components/405-v562-library-history-more.js');
const lib=[];for(let i=1;i<=9;i++)lib.push({id:'t'+i,title:'A very long title number '+i+' that would not fit',categoryId:'c',coverUrl:i%2?'https://img/'+i+'.jpg':''});
const ctx={
  S:{view:'history',library:lib,activityLog:[
    {id:'a1',action:'Bulk edit',timestamp:1,titleIds:lib.map(x=>x.id),changes:[{title:lib[0].title,kind:'edited',fields:['Status: planned → completed']}]},
    {id:'a2',action:'Edit title',timestamp:2,titleIds:['t2']},
    {id:'a3',action:'Settings changed',timestamp:3}]},
  App:{},MediaFlowRuntime:{},window:{},console,
  escapeHtml:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  cleanTitle:s=>String(s||'').trim(),getCategory:()=>({name:'Anime'}),v144CategoryIconHtml:()=>'🎬',
  setTimeout:(f)=>{ctx.__later=f;return 1;},
};
const nodes=[];
ctx.document={activeElement:null,addEventListener(){},
  getElementById(id){return nodes.find(n=>n.id===id)||null;},
  querySelector(sel){if(sel==='#mf562-more .mf562-more-box')return nodes.find(n=>n.id==='mf562-more')?.box||null;return null;},
  createElement(){const n={id:'',className:'',remove(){nodes.splice(nodes.indexOf(n),1);},set innerHTML(v){n.box={innerHTML:'',querySelector:()=>null};},append(){}};return n;},
  body:{append(n){nodes.push(n);}}};
vm.createContext(ctx);
vm.runInContext(`
let mfActivityHtml=null;
function v50LibraryLookup(){return {byId:new Map(S.library.map(i=>[i.id,i]))};}
function v241EnsureLibraryIndex(){return {byId:new Map(S.library.map(i=>[i.id,i]))};}
function v43FindLogTitles(x,lookup){lookup=lookup||v50LibraryLookup();const ids=[...(x?.titleIds||[])];return ids.filter(id=>lookup.byId.has(id));}
function v241ActivityHtml(){const idx=v241EnsureLibraryIndex();return S.activityLog.map(x=>{const ids=v43FindLogTitles(x);return '<div class="mf-activity-row"><b>'+x.action+'</b>'+(ids.length?'<div class="v43-log-actions">'+ids.slice(0,5).map(id=>{const i=idx.byId.get(String(id));return i?'<button>Edit '+i.title+'</button>':'';}).join('')+'</div>':'')+'</div>';}).join('');}
function v341LibraryHistoryToolbar(){return '<div class="v341-lib-history-toolbar"></div>';}
function v260HistoryTab(){return 'library';}
let v341LibraryPanelRefresh=()=>false;
${mod}
globalThis.__html=mfActivityHtml();
globalThis.__find=v43FindLogTitles;
globalThis.__more=()=>mf562MoreHtml();
globalThis.__state=MF562;
`,ctx);
const html=ctx.__html;
const rows=html.split('<div class="mf-activity-row">').slice(1);
assert.equal(rows.length,3);
assert.equal((rows[0].match(/class="mf562-chip"/g)||[]).length,3,'three chips inline');
assert(rows[0].includes('More · 9 titles')&&rows[0].includes("App.mf562OpenMore('a1')"),'More button for nine titles');
assert(!rows[0].includes('Edit A very long'),'old inline Edit buttons replaced');
assert.equal((rows[1].match(/class="mf562-chip"/g)||[]).length,1,'one chip, no More');
assert(!rows[1].includes('More ·'));
assert(!rows[2].includes('mf562-actions'),'entries without titles have no action row');
assert(rows[0].includes('https://img/1.jpg')&&rows[0].includes('🎬'),'cover or category icon');
assert.equal(JSON.stringify(ctx.__find({titleIds:['t1','x']})),'["t1"]','title lookup restored after rendering');
ctx.__state.open='a1';
const more=ctx.__more();
assert.equal((more.match(/class="mf562-row"/g)||[]).length,9,'popup lists every title');
assert.equal((more.match(/App\.openLibraryModal\('t\d'\)/g)||[]).length,9,'each title has Edit');
assert(more.includes('Status: planned → completed'),'changed fields shown');
ctx.__state.query='number 7';
assert.equal((ctx.__more().match(/class="mf562-row"/g)||[]).length,1,'search filters');
console.log('v562 Library History More popup: OK');
