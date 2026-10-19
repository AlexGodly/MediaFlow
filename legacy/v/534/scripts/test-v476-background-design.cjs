/* v476 — presentation-only Background Processes redesign contract.
 * No recovery jobs, cloud saves, preferences, pause/resume or provider calls. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'476');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/363-v476-background-visual-redesign.js');
const css=fs.readFileSync('assets/css/277-v476-background-processes-premium.css','utf8');
const source=fs.readFileSync('src/js/components/363-v476-background-visual-redesign.js','utf8');
assert(fs.readFileSync('index.html','utf8').includes('277-v476-background-processes-premium.css'));
const calls={saves:0,cover:0,meta:0},App={};
const oldCover=state=>'<article class="mf441-process" data-mf441-process="cover">'+
 '<div class="mf441-process-heading"><strong>Cover Recovery</strong></div>'+
 '<b class="mf441-process-number">'+state.coverPct+'%</b>'+
 '<div class="mf441-track" aria-label="Cover Recovery progress" role="progressbar" aria-valuenow="'+state.coverPct+'"><span style="width:'+state.coverPct+'%"></span></div>'+
 '<div class="mf441-process-stats">Cover status</div>'+
 '<div class="mf441-process-actions"><button onclick="App.mf441OpenCover()">Setup</button>'+
 '<button onclick="App.mf424Pause()">Pause</button><button onclick="App.mf424Resume()">Resume</button>'+
 '<button onclick="App.mf424Review()">Review</button></div></article>';
const oldMeta=state=>'<article class="mf441-process" data-mf441-process="metadata">'+
 '<div class="mf441-process-heading"><strong>Metadata Recovery</strong></div>'+
 '<b class="mf441-process-number">'+state.metaPct+'%</b>'+
 '<div class="mf441-track" aria-label="Metadata Recovery progress" role="progressbar" aria-valuenow="'+state.metaPct+'"><span style="width:'+state.metaPct+'%"></span></div>'+
 '<div class="mf441-process-stats">Metadata status</div>'+
 '<div class="mf441-process-actions"><button onclick="App.mf441OpenMetadata()">New Recovery</button>'+
 '<button onclick="App.mf439Pause()">Pause after title</button><button onclick="App.mf439Resume()">Resume</button></div></article>';
const ctx={App,window:{},MediaFlowRuntime:{version:475},mf425Icon:(icon)=>'<svg data-icon="'+icon+'"></svg>',
 mf441Esc:s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'),
 mf441CoverRow:oldCover,mf441MetadataRow:oldMeta,
 mf441WidgetHtml:()=>'<div>old</div>',
 saveState:()=>{calls.saves++;},
 MF424:{},MF439:{},console};
vm.runInNewContext(source,ctx,{filename:'v476.js'});
function widget(state,expanded=false){
 return ctx.mf441WidgetHtml({position:'right',expanded,visibility:'auto',showFinished:false},state);
}
const state={cover:{status:'running',cursor:3,ids:[1,2,3,4]},
 metadata:{status:'paused',cursor:9,ids:Array(10).fill(0)},
 coverPct:75,metaPct:90,activeCount:2};
const closed=widget(state,false),open=widget(state,true);
assert(closed.includes('Covers')&&closed.includes('Metadata'),'both visible in collapsed header');
assert.match(closed,/data-mf476-metric="covers"[^>]*data-mf476-present="true"/);
assert.match(closed,/data-mf476-metric="metadata"[^>]*data-mf476-present="true"/);
assert.match(closed,/>75%<\/strong>/);assert.match(closed,/>90%<\/strong>/);
assert(!closed.includes('mf441-widget-percent'),'must NOT show misleading combined max percent');
assert(closed.includes('aria-expanded="false"')&&open.includes('aria-expanded="true"'));
assert(closed.includes('id="mf441-process-content" hidden'));
assert(open.includes('id="mf441-process-content" '));
assert.equal((open.match(/role="progressbar"/g)||[]).length,2,'both original progressbars intact');
assert(open.includes('aria-valuenow="75"')&&open.includes('aria-valuenow="90"'));
for(const action of ['mf441Toggle','mf441Settings','mf441Hide','mf441OpenCover','mf441OpenMetadata',
  'mf424Pause','mf424Resume','mf424Review','mf439Pause','mf439Resume'])
  assert(open.includes('App.'+action+'()'),'Missing original UI handler '+action);
for(const token of ['mf476-widget-toggle','mf476-widget-summary','mf476-metric-rail',
 'mf476-process-grid','mf476-process-actions','mf476-widget-foot','mf441-position-right',
 'mf441-widget-content','mf441-process'])assert(open.includes(token),'Missing premium UI class '+token);
const empty=widget({cover:null,metadata:null,coverPct:0,metaPct:0,activeCount:0});
assert.equal((empty.match(/>—<\/strong>/g)||[]).length,2,'no job should show placeholder, not fake 0 or 100');
assert(empty.includes('not started'));
const justCover=widget({cover:{status:'complete'},metadata:null,coverPct:100,metaPct:0,activeCount:0});
assert(justCover.includes('>100%</strong>')&&justCover.includes('>—</strong>'));
const escaped=ctx.mf476Progress({id:1},35,'Covers','');
assert(escaped.includes('width:35%')&&escaped.includes('>35%</strong>'));
assert.equal(calls.saves,0,'Rendering must never save cloud state or preferences');
assert.equal(ctx.MediaFlowRuntime.version,476);
assert.equal(ctx.window.MediaFlowV476.version,476);
for(const expected of [
 'var(--flow)','var(--panel)','var(--panel-raised)','var(--border-soft)',
 '#mf441-process-widget.mf476-widget','#mf441-process-widget .mf476-widget-summary',
 '#mf441-process-widget .mf476-metric-value','#mf441-process-widget .mf476-process',
 '.mf441-settings .mf441-widget-preferences','@media screen and (max-width:720px)',
 '@media screen and (max-width:390px)','@media(prefers-reduced-motion:reduce)'
])assert(css.includes(expected),'Missing theme/responsive redesign token '+expected);
assert(!/fetch\(|supabase\.|saveQueue|rawSet\(/.test(source),'Visual-only renderer must not call API or save account');
console.log('PASS v476: distinct Cover 75% and Metadata 90% in compact and expanded widget, no fake combined percentage, original controls and state unchanged');
