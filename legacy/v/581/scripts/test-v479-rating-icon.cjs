/* v479: "Refresh external ratings" uses a semantic refresh glyph, never
 * the MF425 generic image fallback. All refresh behavior stays intact. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'479');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/366-v479-external-rating-refresh-icon.js');
const icons=fs.readFileSync('src/js/components/310-v425-cover-recovery-integration.js','utf8');
const ratings=fs.readFileSync('src/js/components/353-v467-rating-refresh-brand-marks.js','utf8');
const start=icons.indexOf('const MF425_PATHS='),stop=icons.indexOf('function mf425Esc(');
assert(start>=0&&stop>start);
const buttonStart=ratings.indexOf('function mf467Button('),buttonEnd=ratings.indexOf('const mf467EditorBase=',buttonStart);
assert(buttonStart>=0&&buttonEnd>buttonStart);
const chunk=icons.slice(start,stop)+'\n'+ratings.slice(buttonStart,buttonEnd)+
 '\nwindow.testUI={icon:mf425Icon,paths:MF425_PATHS,button:mf467Button};';
const ctx={window:{},MF467:{working:false,titleId:'',provider:'',note:''},
 mf439Item:id=>id==='t1'?item:null,
 escapeHtml:text=>String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),
 };
const item={id:'t1'};
vm.runInNewContext(chunk,ctx,{filename:'v479-rating-icon.js'});
const {icon,paths,button}=ctx.window.testUI;
assert(paths.refresh,'Refresh icon registered');
assert(paths.images,'Existing image icon retained');
assert.notEqual(paths.refresh,paths.images);
assert(paths.refresh.includes('M20 11')&&paths.refresh.includes('M4 13'));
const svg=icon('refresh',17);
assert(svg.includes('width="17"')&&svg.includes(paths.refresh));
assert(!svg.includes(paths.images),'Must not fall back to an image glyph');
const ui=button(item,'editor');
assert(ui.includes('Refresh external ratings'));
assert(ui.includes('mf467RefreshRatings('),'Existing handler must remain');
assert(ui.includes(paths.refresh),'Editor refresh glyph');
assert(!ui.includes(paths.images),'Editor image glyph must disappear');
const details=button(item,'details');
assert(details.includes(paths.refresh),'Details refresh glyph');
ctx.MF467.working=true;ctx.MF467.titleId='t1';
const busy=button(item,'details');
assert(busy.includes('Refreshing ratings…')&&busy.includes('disabled'));
assert(busy.includes(paths.refresh),'Keep icon when refresh is busy');
const version=fs.readFileSync('src/js/components/366-v479-external-rating-refresh-icon.js','utf8');
assert(version.includes('MediaFlowRuntime.version=479'));
assert(!/saveState\(|supabase\.|MF467\.working\s*=/.test(version),'No changes to rating actions or cloud state');
console.log('PASS v479: refresh icon renders for external ratings in editor/details and busy state; no image fallback, behavior unchanged');
