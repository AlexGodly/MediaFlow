/* MediaFlow v463 — show each recommended Seasonal Anime title's VERIFIED
 * fresh episodes remaining, in addition to existing category-wide totals.
 * The saved v377/v402 ledger and v401EpisodeOutcome are authoritative:
 * never invent a count from planned totals, an old scan, or manual detection.
 */
const MF463_VERSION=463;
function mf463FreshForRecommendedTitle(item,cat){
 if(!item||!v401IsSeasonal(cat)||!v401AutomaticEnabled()||
   (typeof v380Mode==='function'&&v380Mode()==='manual'))return null;
 const status=v401EpisodeOutcome(item);
 const hit=S.settings?.v377JikanLedger?.[String(item.id)];
 const available=Number(hit?.available);
 // No trustworthy current result: display "Awaiting verification", never 0.
 if(!['fresh','none'].includes(status)||!Number.isSafeInteger(available)||available<0)
  return {status:'unknown',count:null,available:null,progress:v401Progress(item),source:''};
 const progress=v401Progress(item),count=Math.max(0,available-progress);
 const sourceKey=String(hit?.v402Winner||hit?.v380Provider||'');
 const source=sourceKey&&V380_NAMES[sourceKey]?V380_NAMES[sourceKey]:'';
 return {status:count>0?'fresh':'none',count,available,progress,source};
}
function mf463FreshCard(report){
 if(!report)return '';
 const known=report.count!==null;
 const title='Recommended title · fresh episodes left';
 const count=known?report.count.toLocaleString():'—';
 const detail=!known?'Awaiting verification · Refresh Fresh Episodes to check this title':
  report.count===0?'Caught up · '+report.available.toLocaleString()+' aired episodes verified':
  report.available.toLocaleString()+' aired · '+report.progress.toLocaleString()+' logged'+
   (report.source?' · '+escapeHtml(report.source):'');
 return '<section class="mf419-stat mf463-fresh-stat" data-mf463-fresh="'+report.status+
  '" aria-label="Fresh episodes left for the recommended title">'+
  '<span>'+mf419Icon('flame')+' '+title+'</span>'+
  '<strong>'+count+'</strong><small>'+detail+'</small></section>';
}
// v419 owns the recommendation card and its existing two category statistics.
// Add one title-specific statistic WITHOUT modifying the saved recommendation,
// the verification pipeline, title progress or the global Category Remaining.
const mf463RecBase=mf395DashboardRecommendationHtml;
mf395DashboardRecommendationHtml=function(task,cat){
 const html=String(mf463RecBase.apply(this,arguments)||'');
 if(!S.settings?.exactTitleRecommendations||
    !html.includes('<div class="mf419-category-stats">')||
    !task?.title)return html;
 const item=mf395DashboardRecommendedItem(task);
 const report=mf463FreshForRecommendedTitle(item,cat);
 if(!report)return html;
 return html.replace('<div class="mf419-category-stats">',
  '<div class="mf419-category-stats">'+mf463FreshCard(report));
};
window.MediaFlowV463=Object.freeze({
 version:MF463_VERSION,
 freshForTitle:mf463FreshForRecommendedTitle,
 card:mf463FreshCard
});
MediaFlowRuntime.version=MF463_VERSION;
