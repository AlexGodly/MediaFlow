/* MediaFlow v459 — retire the duplicate v424 Cover Recovery floating UI.
 * The actual recovery engine, durable job checkpoints, progress updates,
 * queue controls, provider adapters, and reports are unchanged.
 *
 * v441 Background Processes is the sole floating recovery surface.
 * Keep its visibility preference authoritative (including Hidden).
 */
const MF459_VERSION=459;
function mf459RemoveLegacyCoverUI(){
  document.getElementById('mf424-indicator')?.remove();
  document.body?.classList.remove('mf424-expanded');
}
mf424Paint=function(){
  mf459RemoveLegacyCoverUI();
  // The retired v424 painter's only job was DOM presentation.
  // v441 already owns combined cover/metadata progress and controls.
  if(typeof mf441Paint==='function')mf441Paint();
};
MF424.expanded=false;
mf459RemoveLegacyCoverUI();
// Compatibility: legacy shortcuts no longer reopen the obsolete cover flyout.
// Preserve the newer widget's independent Hidden/Auto/Always Show setting.
mf424Toggle=function(){
  if(typeof mf441Prefs==='function'&&mf441Prefs().visibility==='hidden'){
    showToast('Cover Recovery progress is available in Background Processes. Enable it in Recovery Workspace settings.');
    return;
  }
  if(typeof mf441Toggle==='function')mf441Toggle();
};
App.mf424Toggle=mf424Toggle;
window.MediaFlowV459=Object.freeze({
 version:459,removeLegacy:mf459RemoveLegacyCoverUI,
 refresh:mf424Paint,legacyVisible:()=>!!document.getElementById('mf424-indicator')
});
