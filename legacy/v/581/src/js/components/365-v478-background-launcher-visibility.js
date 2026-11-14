/* MediaFlow v478 — view-only room guard for Background Processes launcher.
 * v469 reserved just 54px for the old one-line widget, but the redesigned
 * v476 widget is >110px high. Keep the new header 100% visible; if the dock
 * leaves insufficient room, hide the widget TEMPORARILY instead of clipping
 * it into a green status dot. Does not touch providers/jobs/settings/cloud.
 */
const MF478_VERSION=478;
const mf478LayoutBase=mf469Layout;
function mf478Layout(){
  const result=mf478LayoutBase.apply(this,arguments);
  if(!result?.mobile||!result.widget)return result;
  const widget=document.getElementById('mf441-process-widget');
  if(!widget?.classList.contains('mf476-widget'))return result;
  const toggle=widget.querySelector('.mf476-widget-toggle');
  if(!toggle)return result;
  const headerHeight=toggle.getBoundingClientRect().height;
  const room=Number(result.room);
  // Include the outer border and small breathing room to avoid visual
  // clipping at exactly the threshold. Expanded still scrolls its contents.
  const required=Math.ceil(headerHeight)+(widget.classList.contains('mf441-expanded')?75:7);
  const enough=Number.isFinite(room)&&room>=required;
  widget.classList.toggle('mf469-no-room',!enough);
  widget.dataset.mf478Visibility=enough?'complete':'temporarily-hidden';
  return {...result,headerHeight,required,unclipped:enough};
}
mf469Layout=mf478Layout;
window.MediaFlowV478=Object.freeze({
 version:MF478_VERSION,layout:mf478Layout,
 refresh:()=>mf469Schedule(),status:()=>{
  const el=document.getElementById('mf441-process-widget');
  return {visibility:el?.dataset.mf478Visibility||'none',
   collapsed:!!el&&!el.classList.contains('mf441-expanded')};
 }
});
MediaFlowRuntime.version=MF478_VERSION;
