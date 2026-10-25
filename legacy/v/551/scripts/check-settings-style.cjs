/* Mandatory UI contract for new MediaFlow Settings integrations.
 * Prevent future feature modules from mounting off-brand accordions directly. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir='src/js/components';
const files=fs.readdirSync(dir).filter(n=>/^\d{3}-.*\.js$/.test(n)&&Number(n.slice(0,3))>=310);
const center=fs.readFileSync(path.join(dir,'263-v365-settings-center.js'),'utf8');
const registry=fs.readFileSync(path.join(dir,'264-v366-settings-registration.js'),'utf8');
const cover=fs.readFileSync(path.join(dir,'310-v425-cover-recovery-integration.js'),'utf8');
assert(center.includes('window.MediaFlowSettingsCenter=Object.freeze({mountSection:v365MountRegisteredSection})'),'Canonical Settings mount API is missing');
assert(center.includes('const section=v365BuildSection(item)'),'New Settings must reuse the native section renderer');
assert(center.includes('v365BuildIndex([...V365_SECTION_MAP.values()])'),'New Settings must be indexed for search');
assert(center.includes('v365Favorite(item.id)'),'Native Settings pin/favorites must remain available');
assert(registry.includes('registerSetting:v366RegisterSetting'),'Settings must have stable control metadata');
assert(cover.includes('center.mountSection({'),'Cover Recovery must use native Settings');
assert(!cover.includes('mf425-settings-group'),'Never inject a standalone Cover Recovery group');
assert(cover.includes("subgroup:'Library maintenance'"),'Cover Recovery belongs in Library Maintenance');
for(const name of files){
 const src=fs.readFileSync(path.join(dir,name),'utf8');
 // A new feature must not target the Settings Center category container and
 // append a hand-made card/accordion. Modules may still implement popups etc.
 if(src.includes('data-mf365-content-for')&&/appendChild\s*\(\s*(?:group|section|card|wrapper)\s*\)/.test(src)&&!src.includes('MediaFlowSettingsCenter.mountSection'))
  throw new Error(name+' appends custom Settings UI instead of the native Settings mount API');
}
console.log('PASS: native Settings styling/accordion/pin/search contract enforced for '+files.length+' extension modules');
