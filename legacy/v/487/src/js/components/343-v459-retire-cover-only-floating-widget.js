/* MediaFlow v459 — permanently retire the redundant v424 Cover Recovery
 * floating pill and controls. Do not alter the v424 recovery engine or saved
 * checkpoints; the unified v441 Background Processes UI is the sole widget.
 */
const MF459_VERSION=459;
function mf459RemoveLegacyCoverWidget(){
  // Covers a stale indicator from a previous bundle or an early paint that
  // happened before this final extension initialized.
  document.querySelectorAll('#mf424-indicator').forEach(node=>node.remove());
}
MF424.expanded=false;
mf459RemoveLegacyCoverWidget();
// The v424-v427 paint chain only builds/decorates the retired widget; do not
// invoke it. The v441 process display uses the SAME recovery state and is
// updated independently after each cover engine state change.
mf424Paint=function(){
  mf459RemoveLegacyCoverWidget();
  if(typeof mf441Paint==='function')mf441Paint();
  mf459RemoveLegacyCoverWidget();
};
// A historic action may still call this public method from cached markup.
// Do not recreate the old pill or change the process state.
mf424Toggle=function(){
  MF424.expanded=false;
  mf459RemoveLegacyCoverWidget();
  if(typeof mf441Paint==='function')mf441Paint();
};
App.mf424Toggle=mf424Toggle;
window.MediaFlowV459=Object.freeze({
  version:459,
  cleanup:mf459RemoveLegacyCoverWidget,
  paint:()=>mf424Paint(),
  legacyVisible:()=>!!document.getElementById('mf424-indicator')
});
