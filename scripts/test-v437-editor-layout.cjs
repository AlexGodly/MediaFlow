/* Regression for the v437 metadata accordion escaping the v240 editor grid.
   Uses source/DOM placement contracts plus actual browser measurement in CI. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('src/js/components/316-v437-universal-metadata-ratings.js','utf8');
const css=fs.readFileSync('assets/css/246-v437-universal-metadata.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const pwa=fs.readFileSync('scripts/pwa.py','utf8');
assert(['437','438','439','440','441','442','443','444','445','446','447','448','449','450','451','452','453'].includes(fs.readFileSync('VERSION','utf8').trim()));
assert(js.includes('Universal Metadata & External Ratings'),'human-friendly header');
assert(!js.includes('v437 · optional · protected'),'requested subtitle removed');
assert(js.includes("const imported=editor.querySelector(':scope > .v178-rich-editor')"),'target actual imported metadata section');
assert(js.includes('editor.insertBefore(section,imported)'),'metadata is inserted before imported metadata');
assert(js.includes('mountEditor:mf437MountEditorSection'),'browser uses real placement function');
assert(css.includes('grid-column:1/-1!important;order:39!important'),'full 12-column grid positioning before imported metadata order 40');
assert(css.includes('.v240-library-editor .mf437-lock input[type="checkbox"]'),'legacy form checkbox size reset');
assert(css.includes('height:16px!important'),'checkbox native sizing restored');
assert(css.includes('grid-template-columns:1fr'),'narrow screen single column');
assert(index.includes('assets/css/246-v437-universal-metadata.css'),'fixed stylesheet loaded');
assert(pwa.includes("VERSION == 437 else f'mediaflow-pwa-v{VERSION}-shell-v1'"),'hotfix invalidates old PWA shell');
console.log('PASS v437 editor metadata order, accordion text, full-width CSS, protect inputs and PWA cache hotfix');
