/* MediaFlow v500 — Logging cover-only buttons should NEVER have a
 * v225 generic circled action icon. The poster/category icon is sufficient.
 * This affects only v498-owned Logging cover controls, not action buttons,
 * reorder arrows, selection controls, or title data.
 */
const MF500_VERSION=500;
const MF500_COVER_STATE={rendered:0,cleaned:0};
function mf500IsLoggingCover(el){
 return !!el?.matches?.('button.mf498-logging-cover');
}
// The global icon system calls v225IconEligible before adding any icon.
// Block it at the eligibility source (for fresh renders / MutationObserver).
const mf500PreviousIconEligible=v225IconEligible;
v225IconEligible=function(el){
 if(mf500IsLoggingCover(el))return false;
 return mf500PreviousIconEligible.apply(this,arguments);
};
// Also protect callers that request icon names directly.
const mf500PreviousIconName=v225ButtonIconName;
v225ButtonIconName=function(el){
 if(mf500IsLoggingCover(el))return null;
 return mf500PreviousIconName.apply(this,arguments);
};
// Mark HTML BEFORE insertion into the document: prevents flicker as older
// enhancements / existing observers process new title cards.
const mf500OriginalCoverHtml=mf498CoverHtml;
mf498CoverHtml=function(item,surface){
 const raw=mf500OriginalCoverHtml.apply(this,arguments);
 if(!raw.startsWith('<button '))return raw;
 MF500_COVER_STATE.rendered++;
 return raw.replace(/^<button\b/,'<button data-v225-iconified="1" data-mf500-clean-poster="1"');
};
// If navigation preserves existing rendered buttons, strip only stray
// global decorative icons. Never touch category artwork or real title icons.
function mf500CleanCoverIcons(root=document){
 let count=0;
 const covers=root?.querySelectorAll?.('button.mf498-logging-cover')||[];
 for(const cover of covers){
  cover.dataset.v225Iconified='1';
  cover.dataset.mf500CleanPoster='1';
  for(const icon of cover.querySelectorAll(':scope > .v225-btn-icon')){
   icon.remove();count++;
  }
  cover.classList.remove('v225-icon-button');
 }
 MF500_COVER_STATE.cleaned+=count;
 return count;
}
const mf500RenderLogFormBase=renderLogForm;
renderLogForm=function(){
 const raw=mf500RenderLogFormBase.apply(this,arguments);
 if(!String(raw||'').includes('mf498-logging-cover'))return raw;
 try{
  const host=document.createElement('div');host.innerHTML=String(raw||'');
  mf500CleanCoverIcons(host);
  return host.innerHTML;
 }catch(_){return raw;}
};
window.MediaFlowV500=Object.freeze({
 version:MF500_VERSION,
 isCover:mf500IsLoggingCover,
 clean:mf500CleanCoverIcons,
 status:()=>({...MF500_COVER_STATE})
});
MediaFlowRuntime.version=MF500_VERSION;
