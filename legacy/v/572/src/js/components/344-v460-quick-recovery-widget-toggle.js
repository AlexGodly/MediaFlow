/* MediaFlow v460 — one Metadata Recovery shortcut, direct Background Processes visibility.
 * Presentation and persisted widget preferences only: never change any recovery job.
 */
const MF460_VERSION=460;
function mf460WidgetVisible(){
 const prefs=mf441Prefs(),state=mf441State();
 return Boolean(mf441Show(prefs,state));
}
function mf460EyeIcon(isShowing){
 // A crossed-out eye describes "hide"; an open eye describes "show".
 const eye='<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>';
 return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
   (isShowing?eye+'<path d="M3 3l18 18"/>':eye)+'</svg>';
}
function mf460WidgetLabels(){
 const shown=mf460WidgetVisible();
 return {shown,title:shown?'Hide Background Processes':'Show Background Processes',
  subtitle:shown?'Hide the widget · recovery jobs keep running':'Display recovery progress and controls'};
}
const mf460PreviousQuickMarkup=mf397Markup;
mf397Markup=function(){
 let html=String(mf460PreviousQuickMarkup.apply(this,arguments)||'');
 // v441 and v447 both inserted the same metadataRecovery action. Preserve
 // the newest (unified-workspace) entry, with one fallback if v447 is disabled.
 const metadataButton=/<button\b[^>]*\bdata-action="metadataRecovery"[^>]*>[\s\S]*?<\/button>\s*/g;
 const matches=[...html.matchAll(metadataButton)];
 if(matches.length>1){
  let current=0;
  html=html.replace(metadataButton,part=>(++current===matches.length?part:''));
 }
 const anchor='      </div>\n      <button type="button" id="mf397-fab"';
 if(!html.includes(anchor))return html;
 const label=mf460WidgetLabels();
 const button='        <button type="button" class="mf397-fan-action mf447-float-action mf460-widget-action" data-action="backgroundProcessesVisibility" aria-label="'+label.title+'">'+
  '<span class="mf397-action-symbol">'+mf460EyeIcon(label.shown)+'</span>'+
  '<span><strong>'+label.title+'</strong><small>'+label.subtitle+'</small></span><em>07</em></button>\n';
 return html.replace(anchor,button+anchor);
};
function mf460RefreshWidgetAction(){
 const fan=document.getElementById('mf397-fan');
 const btn=fan?.querySelector('[data-action="backgroundProcessesVisibility"]');
 if(!btn)return;
 const label=mf460WidgetLabels();
 const name=btn.querySelector('strong'),detail=btn.querySelector('small'),symbol=btn.querySelector('.mf397-action-symbol');
 if(name)name.textContent=label.title;
 if(detail)detail.textContent=label.subtitle;
 if(symbol)symbol.innerHTML=mf460EyeIcon(label.shown);
 btn.setAttribute('aria-label',label.title);
}
const mf460PreviousSetMenu=mf397SetMenu;
mf397SetMenu=function(open){
 mf460RefreshWidgetAction();
 return mf460PreviousSetMenu.apply(this,arguments);
};
function mf460ToggleWidget(){
 const shouldShow=!mf460WidgetVisible();
 // Reuse the existing v441 cloud-backed preference and paint pipeline.
 // Explicit Show must display immediately, even with zero active processes.
 mf441SaveSetting('visibility',shouldShow?'always':'hidden');
 mf460RefreshWidgetAction();
 mf397SetMenu(false);
 showToast(shouldShow?'Background Processes shown.':'Background Processes hidden; recovery jobs continue.');
}
const mf460PreviousAction=mf397Action;
mf397Action=function(action){
 if(action==='backgroundProcessesVisibility')return mf460ToggleWidget();
 return mf460PreviousAction.apply(this,arguments);
};
window.MediaFlowV460=Object.freeze({
 version:MF460_VERSION,menuMarkup:()=>mf397Markup(),widgetVisible:mf460WidgetVisible,
 toggleWidget:mf460ToggleWidget,refresh:mf460RefreshWidgetAction
});
MediaFlowRuntime.version=MF460_VERSION;
