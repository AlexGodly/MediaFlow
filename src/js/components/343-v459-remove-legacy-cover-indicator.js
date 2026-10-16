/* MediaFlow v459 — retire the obsolete v424 Cover Recovery floating pill/flyout.
 * This does not touch MF424 jobs, recovery leases, checkpoints, cover writes,
 * XP, provider cooldowns or the current v441 Background Processes widget.
 */
const MF459_VERSION=459;
const MF459={removed:0,paints:0};
function mf459RemoveLegacyCoverIndicator(){
  const old=document.getElementById('mf424-indicator');
  if(old){old.remove();MF459.removed++;}
}
// The v441 integration already publishes a single, live Background Processes
// widget. Stop mounting the earlier, duplicate cover-only widget altogether.
mf424Paint=function(){
  MF459.paints++;
  mf459RemoveLegacyCoverIndicator();
  if(typeof mf441Paint==='function')mf441Paint();
};
// Stale shortcuts must not revive the v424 pill.
mf424Toggle=function(){
  mf459RemoveLegacyCoverIndicator();
  if(typeof mf441Toggle==='function')mf441Toggle();
};
App.mf424Toggle=mf424Toggle;
// Clean any legacy node created earlier in startup, without interrupting work.
mf459RemoveLegacyCoverIndicator();
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',mf459RemoveLegacyCoverIndicator,{once:true});
}
window.MediaFlowV459=Object.freeze({
  version:459,remove:mf459RemoveLegacyCoverIndicator,
  paint:mf424Paint,removed:()=>MF459.removed,paints:()=>MF459.paints,
  activeCover:()=>Boolean(MF424.job),sharedWidget:()=>Boolean(document.getElementById('mf441-process-widget'))
});
