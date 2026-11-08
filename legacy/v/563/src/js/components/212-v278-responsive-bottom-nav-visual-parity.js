/* MediaFlow v278 — responsive bottom navigation visual parity */
const V278_RUNTIME_VERSION=278;
function v278AuditState(){
  let base={};
  try{base=v277AuditState()||{};}catch(_){ }
  return Object.assign({},base,{
    version:278,
    pwaRelease:278,
    responsiveBottomNavVisualParity:true,
    borderlessResponsiveTabs:true,
    responsiveNavBreakpoint:1080
  });
}
Object.assign(App,{v278AuditState});
window.MediaFlowV278={version:278,focus:'Responsive bottom navigation visual parity across all mobile and tablet widths'};
MediaFlowRuntime.version=V278_RUNTIME_VERSION;
try{v277SyncNavigationMode?.();}catch(_){ }
