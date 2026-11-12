/* MediaFlow v476 — Background Processes visual refresh ONLY.
 * Retain v441/v462/v469 lifecycle, job progress, actions, prefs, persistence,
 * and mobile collision avoidance. Cover and Metadata each have their OWN
 * percentage; never represent MAX(cover,meta) as an overall job percentage.
 */
const MF476_VERSION=476;
function mf476Progress(item,pct,label,icon){
  const exists=Boolean(item);
  const percent=exists?Math.min(100,Math.max(0,Math.floor(Number(pct)||0))):0;
  const displayed=exists?percent+'%':'—';
  const aria=exists?label+' recovery '+percent+' percent':label+' recovery not started';
  return '<span class="mf476-metric mf476-metric-'+label.toLowerCase()+'" data-mf476-metric="'+label.toLowerCase()+
   '" data-mf476-present="'+String(exists)+'" aria-label="'+mf441Esc(aria)+'">'+
   '<span class="mf476-metric-top"><span class="mf476-metric-label">'+icon+'<span>'+label+'</span></span>'+
   '<strong class="mf476-metric-value">'+displayed+'</strong></span>'+
   '<span class="mf476-metric-rail" aria-hidden="true"><i style="width:'+percent+'%"></i></span>'+
   '</span>';
}
function mf476ProcessCard(base,type,status){
  // Reuse ORIGINAL v441 job rows, progress counters, resume/pause/review/setup
  // buttons, exact handlers and semantics. Only presentation is enriched.
  return String(base)
   .replace('class="mf441-process"','class="mf441-process mf476-process mf476-'+type+'" data-mf476-status="'+mf441Esc(status||'idle')+'"')
   .replace('class="mf441-process-heading"','class="mf441-process-heading mf476-process-heading"')
   .replace('class="mf441-process-number"','class="mf441-process-number mf476-process-number"')
   .replace('class="mf441-track"','class="mf441-track mf476-track"')
   .replace('class="mf441-process-stats"','class="mf441-process-stats mf476-process-stats"')
   .replace('class="mf441-process-actions"','class="mf441-process-actions mf476-process-actions"');
}
const mf476WidgetBase=mf441WidgetHtml;
mf441WidgetHtml=function(prefs,state){
  // Extract the *fully decorated* footer from the v441/v451 wrapper chain:
  // stop-all, discard, resume-interrupted and any future controls must survive
  // a visual redesign even when their appearance is restyled.
  const previous=String(mf476WidgetBase.apply(this,arguments)||'');
  const footerMatch=previous.match(/<div class="mf441-widget-foot[^"]*">[\s\S]*?<\/div>/);
  const originalFooter=footerMatch?footerMatch[0].replace('class="mf441-widget-foot','class="mf441-widget-foot mf476-widget-foot'):null;
  const expanded=Boolean(prefs.expanded),active=Number(state.activeCount)||0;
  const cover=mf476Progress(state.cover,state.coverPct,'Covers',mf425Icon('images',13));
  const metadata=mf476Progress(state.metadata,state.metaPct,'Metadata',mf425Icon('database',13));
  const status=active?active+' process'+(active===1?'':'es')+' active':'Your recovery command center';
  const coverRow=mf476ProcessCard(mf441CoverRow(state),'cover',state.cover?.status);
  const metaRow=mf476ProcessCard(mf441MetadataRow(state),'metadata',state.metadata?.status);
  return '<aside class="mf441-widget mf441-position-'+prefs.position+(expanded?' mf441-expanded':'')+
    ' mf476-widget" id="mf441-process-widget" data-mf476-active="'+active+
    '" aria-label="Background Processes: Cover and Metadata recovery">'+
    '<span class="mf476-ambient" aria-hidden="true"></span>'+
    '<button type="button" class="mf441-widget-toggle mf476-widget-toggle" onclick="App.mf441Toggle()" '+
      'aria-expanded="'+String(expanded)+'" aria-controls="mf441-process-content">'+
      '<span class="mf441-widget-symbol mf476-widget-symbol">'+mf425Icon('layers',20)+'</span>'+
      '<span class="mf441-widget-name mf476-widget-name"><strong>Background Processes</strong>'+
        '<small><i class="mf476-live-dot" aria-hidden="true"></i>'+mf441Esc(status)+'</small></span>'+
      '<span class="mf476-toggle-chevron" aria-hidden="true">'+mf425Icon(expanded?'chevronDown':'chevronUp',16)+'</span>'+
      '<span class="mf476-widget-summary" role="group" aria-label="Individual recovery progress">'+cover+metadata+'</span>'+
    '</button>'+
    '<div class="mf441-widget-content mf476-widget-content" id="mf441-process-content" '+(expanded?'':'hidden')+'>'+
      '<div class="mf476-content-heading"><span><i class="mf476-live-dot" aria-hidden="true"></i>PROCESS MONITOR</span>'+
      '<em>'+active+' active</em></div>'+
      '<div class="mf476-process-grid">'+coverRow+metaRow+'</div>'+
      (originalFooter||'<div class="mf441-widget-foot mf476-widget-foot"><button type="button" onclick="App.mf441Settings()">'+mf425Icon('settings',15)+' Recovery Settings</button><button type="button" onclick="App.mf441Hide()">'+mf425Icon('x',15)+' Hide widget</button></div>')+
    '</div></aside>';
};
window.MediaFlowV476=Object.freeze({version:MF476_VERSION,
  progress:mf476Progress,widget:(prefs,state)=>mf441WidgetHtml(prefs,state)});
MediaFlowRuntime.version=MF476_VERSION;
