/* ============================================================
   MediaFlow v284 — account badge cleanup + Compact progress alignment
   ============================================================ */
const V284_RUNTIME_VERSION=284;
function v284AuditState(){
  return {
    version:284,
    pwaRelease:284,
    sidebarCloudBadgeRemoved:!document.querySelector('.sidebar-foot .cloud-badge'),
    compactCollectionProgressTopAligned:true
  };
}
Object.assign(App,{v284AuditState});
window.MediaFlowV284={version:284,focus:'Remove sidebar CLOUD badge and align Compact collection progress fill with its track'};
MediaFlowRuntime.version=V284_RUNTIME_VERSION;
