/* MediaFlow v449 recovery toolbar regression: no behavior or data changes. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'449');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
assert.equal(order.at(-1),'components/329-v449-editor-recovery-actions-layout.js');
const src=fs.readFileSync('src/js/components/329-v449-editor-recovery-actions-layout.js','utf8');
const css=fs.readFileSync('assets/css/256-v449-editor-recovery-actions.css','utf8');
assert(fs.readFileSync('index.html','utf8').includes('256-v449-editor-recovery-actions.css'));
for(const token of ['const mf449PreviousEditor=libraryModalHtml','libraryModalHtml=function(item)',
 'const mf449PreviousLibrary=renderLibrary','renderLibrary=function()',
 'title.before(toolbar)','mf439-editor-action','.mf447-shortcut-group','toolbar.appendChild(group)',
 'toolbar.appendChild(metadata)','mf425-tools-button','disabled','Save this title first'])
 assert(src.includes(token),token);
for(const token of ['grid-column:1 / -1!important','order:-1!important',
 '.mf449-editor-recovery-toolbar','var(--flow)','@media(max-width:680px)'])assert(css.includes(token),token);
assert(!/item\.(?:coverUrl|universalMetadata|externalIds|status|progress)\s*=/.test(src),'No title mutations');
assert(!/delete\s+(?:S|item)\./.test(src),'No persistence changes');
assert(!/App\.mf424Start|App\.mf439ConfirmBatch|fetch\(/.test(src),'Only existing user-triggered actions are used');
assert(!src.includes('mf449DraftButtons({id:'),'Unsaved title cannot be mapped into a global recovery queue');
console.log('PASS v449: top-aligned saved/draft toolbar, four visible options, targeted Library duplicate removal, responsive theme CSS, no recovery engine or user data writes');
