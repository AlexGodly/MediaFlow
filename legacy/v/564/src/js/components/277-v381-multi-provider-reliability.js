/* MediaFlow v381 — provider reliability, selection UI and canonical icons.
 * v380 providers share the corrected adapters and request engine.
 */
const V381_RELEASE=381;
const V381_PROVIDER_LABELS={automatic:'Multi-Provider',automatic2:"Alex Godly's Smart Fresh Episodes Engine",tenrai:'Tenrai',anizip:'AniZip',anilist:'AniList',tvmaze:'TVmaze',kitsu:'Kitsu'};
function v381CurrentLabel(){return V381_PROVIDER_LABELS[v380Mode()]||'Multi-Provider';}
const v381SettingsBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){
 const html=String(v381SettingsBase.apply(this,arguments)||'');
 return html.replace(/Automatic\s*[·:]\s*Tenrai/g,()=>`Automatic: ${v381CurrentLabel()}`)
  .replace(/Automatic mode uses Tenrai's public MyAnimeList episode data[^<]*/g,
   'Automatic detection uses the selected provider or trusted Multi-Provider fallback. MediaFlow compares verified released episodes with your Library progress.')
  .replace(/Tenrai uses exact MAL IDs first\.[^<]*/g,
   'Verified MAL IDs are preferred. API errors, missing mappings and missing episode data are tracked separately.');
};
const v381StatusBase=v166SeasonalStatusText;
v166SeasonalStatusText=function(){
 let result=String(v381StatusBase.apply(this,arguments)||'');
 result=result.replace(/Partial Tenrai check/g,()=>`Partial ${v381CurrentLabel()} check`)
   .replace(/Tenrai is temporarily unavailable/g,()=>`${v381CurrentLabel()} is temporarily unavailable`);
 return result;
};
const V381_ACTIONS=[
 {part:'v377ShowUnmatchedReport(',icon:'unmatched'},
 {part:"v377RetryUnmatched('all')",icon:'all'},
 {part:"v377RetryUnmatched('selected')",icon:'selected'},
 {part:"v377RetryUnmatched('failed')",icon:'retry'},
 {part:"v377RetryUnmatched('unavailable')",icon:'missing'},
 {part:'v377RetryOne(',icon:'retry'}
];
function v381UnifyIcons(root=document){
 const buttons=[];
 if(root.matches?.('button'))buttons.push(root);
 root.querySelectorAll?.('button').forEach(b=>buttons.push(b));
 for(const button of buttons){
  const handler=button.getAttribute('onclick')||'';
  const rule=V381_ACTIONS.find(x=>handler.includes(x.part));if(!rule)continue;
  const current=[...button.children].filter(x=>x.matches?.('.v225-btn-icon,.mf380-icon,.v370-icon,.mf379-icon'));
  if(current.length===1&&current[0].matches('.mf380-icon')&&button.dataset.mf380Icon===rule.icon)return;
  button.querySelectorAll(':scope > .v225-btn-icon,:scope > .mf380-icon,:scope > .v370-icon,:scope > .mf379-icon').forEach(el=>el.remove());
  button.insertAdjacentHTML('afterbegin',V380_ICONS[rule.icon]);
  button.dataset.v225Iconified='1';button.dataset.mf380Icon=rule.icon;
  button.dataset.v226SemanticIcon='';
  button.classList.remove('v225-icon-button');
 }
}
// Rendered HTML and later global icon passes must agree; don't add two icons.
const v381SettingsIconsBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){
 const shell=document.createElement('div');shell.innerHTML=String(v381SettingsIconsBase.apply(this,arguments)||'');
 v381UnifyIcons(shell);return shell.innerHTML;
};
const v381ReportBase=v377ShowUnmatchedReport;
v377ShowUnmatchedReport=function(){const result=v381ReportBase.apply(this,arguments);
 const report=document.querySelector('#mf377-report-overlay');if(report)v381UnifyIcons(report);return result;};
// v226 may re-run after v380's MutationObserver. The source-of-truth check
// catches duplicate icons even when controls are recreated asynchronously.
let V381_ICON_FRAME=0;
const V381_ICON_OBSERVER=new MutationObserver(records=>{
 if(!records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1)))return;
 if(V381_ICON_FRAME)return;
 V381_ICON_FRAME=requestAnimationFrame(()=>{V381_ICON_FRAME=0;
  document.querySelectorAll('.mf377-report-toolbar,.mf377-jikan-report-actions,.mf377-report-actions').forEach(v381UnifyIcons);
 });
});
V381_ICON_OBSERVER.observe(document.documentElement,{childList:true,subtree:true});
// Health information is derived from real requests in this session, not guesses.
function v381HealthSummaryHtml(){
 const source=v380Mode();
 const hosts={tenrai:new URL(V166_JIKAN_BASE).hostname,anizip:'api.ani.zip',anilist:'graphql.anilist.co',tvmaze:'api.tvmaze.com',kitsu:'kitsu.io'};
 const rows=(source==='automatic'?['tenrai','anizip','anilist','tvmaze','kitsu']:[source]);
 const items=rows.map(id=>{const h=V381_PROVIDER_HEALTH.get(hosts[id]);
  const state=!h?'Not checked in this session':h.failed&&(!h.ok||h.last>0&&h.reason)?`Last error: ${h.reason}`:'Request succeeded';
  return `<div class="mf381-diagnostics-row"><b>${escapeHtml(V380_NAMES[id])}</b><small>${escapeHtml(state)}</small></div>`;
 });
 return `<div class="mf381-diagnostics" role="status"><strong>Provider request diagnostics</strong><small>Results from this browser session; not a live global uptime monitor.</small>${items.join('')}</div>`;
}
const v381ProviderSummaryBase=v380ProviderSummaryHtml;
v380ProviderSummaryHtml=function(){return v381ProviderSummaryBase.apply(this,arguments)+v381HealthSummaryHtml();};
window.MediaFlowV381={version:381,providerNames:V381_PROVIDER_LABELS,
 getMode:v380Mode,getHealth:()=>Object.fromEntries(V381_PROVIDER_HEALTH),
 runProvider:(name,id,force=false)=>V380_ADAPTERS[name]?.(String(id),force),
 features:['Repaired shared HTTP engine','AniList GraphQL schema','AniZip aired dates','TVmaze season safeguards','Kitsu pagination','Tenrai dated episodes','Dynamic source labels','Single-action icons','Request diagnostics']};
MediaFlowRuntime.version=V381_RELEASE;
