/* v429 contract checks: four-tab Center and release safeguards.
   No account data, network calls or screenshots involved. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const center=fs.readFileSync('src/js/components/315-v429-recovery-release-center.js','utf8');
const cover=fs.readFileSync('src/js/components/309-v424-advanced-cover-recovery.js','utf8');
const meta=fs.readFileSync('src/js/components/313-v428-metadata-fixer.js','utf8');
const fresh=fs.readFileSync('src/js/components/314-v428-fresh-releases.js','utf8');
const css=fs.readFileSync('assets/css/240-v429-recovery-release-center.css','utf8');
const order=JSON.parse(fs.readFileSync('src/js/runtime-order.json','utf8'));
const index=fs.readFileSync('index.html','utf8');
for(const [name,code] of [['v429 Center',center],['cover recovery',cover],['metadata',meta],['fresh releases',fresh]])new vm.Script(code,{filename:name});
assert.equal(fs.readFileSync('VERSION','utf8').trim(),'429');
assert(index.includes('mediaflow-v429.bundle.js'));
assert(index.includes('240-v429-recovery-release-center.css'));
assert(order.includes('components/315-v429-recovery-release-center.js'));
assert(center.includes("const TABS=['queue','covers','metadata','fresh']"));
assert(center.includes('originalCoverOpen?.('),'Existing cover config reused with original scope');
assert(center.includes('originalMetadataOpen?.('),'Existing metadata form reused with original scope');
assert(center.includes("v166SeasonalSettingsHtml()"),'Existing Fresh Episodes Settings reused');
assert(center.includes('originalFreshOpen?.()'),'Original universal scanner accessible');
assert(center.includes("App.mf425OpenConfig=function(entry='settings',id='')"),'Existing cover entry points routed into Center');
assert(center.includes("App.mf428MetadataOpen=function(entry='settings',id='')"),'Existing metadata entry points routed into Center');
assert(center.includes('state.context={tab,entry:'),'Existing selected-title/editor scope preserved');
assert(css.includes("left:max(15px,env(safe-area-inset-left))"),'Default bottom left');
assert(css.includes('body.mf429-center-enabled #mf428-hub'),'Legacy launcher visually suppressed, scheduler retained');
assert(css.includes('mf429-embedded'),'Original recovery dialogs portaled without duplicate implementation');
assert(css.includes('@media(max-width:345px)'));
assert(css.includes('prefers-reduced-motion'));
assert(!cover.includes('Other researched providers (not available without credentials'),'Setup-only provider names must not leak into UI');
const imported=['year','mediaFormat','durationMinutes','releaseDate','seasonLabel','ageRating','communityScore','mediaSource','demographic','studios','producers','genres','themes','synopsis'];
for(const field of imported)assert(meta.includes("'"+field+"'"),'Missing MediaServices field: '+field);
assert(fresh.includes('runLegacyFresh({ids:selectedAnime,force:true})'),'Scoped anime requests must pass exact selected IDs into original engine');
assert(!fresh.includes('globalScope'),'Global anime scan fallback must not bypass selected scope');
for(const kind of ['anime','tv','manga','comics','books','movies','webnovels','podcasts','webseries'])
 assert(fresh.includes('smart:'+kind),'Missing media-specific engine mode '+kind);
assert(fresh.includes('smart:')&&fresh.includes("providerMode"),'Provider policy shared with specialized engines');
const callbacks={},App={},S={settings:{}},window={addEventListener(){}},
 document={body:null,readyState:'loading',addEventListener(type,cb){callbacks[type]=cb;}};
vm.runInNewContext(center,{App,S,window,document,console,Math,Date,Promise,setInterval(){return 0;},persistSettings(){},saveState(){}},{timeout:4000});
assert.equal(window.MediaFlowV429Center.version,429);
assert.equal(typeof App.mf429CenterTab,'function');
assert.equal(typeof App.mf429CenterToggle,'function');
assert.equal(typeof App.mf429CenterQueue,'function');
assert(callbacks.DOMContentLoaded,'Client boot is deferred until DOM exists');
console.log('v429 Center source contract PASS: 4 tabs, original interfaces, 14 import fields, provider visibility, scoped scans and responsive bottom-left theme');
