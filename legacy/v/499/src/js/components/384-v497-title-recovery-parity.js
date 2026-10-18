/* MediaFlow v497 — Title recovery action parity.
 * Align saved Title Details with Add/Edit Title's canonical v447 shortcuts.
 * All actions retain v447's single saved-title ID scope and confirmation flow.
 * Never mutate a title or start a recovery job from rendering.
 */
const MF497_RECOVERY_VERSION=497;
const MF497_RECOVERY_LABELS=Object.freeze({
 cover:['Cover','Recovery'],metadata:['Metadata','Recovery'],both:['Recover','Both']
});
const MF497_RECOVERY_ICONS=Object.freeze({
 cover:'images',metadata:'database',both:'layers'
});
const MF497_RECOVERY_STATE={details:0,editor:0,retired:0,errors:0};
function mf497RecoveryPolish(group){
 if(!group)return group;
 const buttons=group.querySelectorAll('button');
 for(let i=0;i<buttons.length;i++){
  const button=buttons[i],kind=['cover','metadata','both'][i];
  const parts=MF497_RECOVERY_LABELS[kind];
  if(!parts)continue;
  // Render distinct elements with a real CSS gap: the compact toolbar font
  // previously made "Metadata Recovery" look like "MetadataRecovery".
  button.innerHTML=mf425Icon(MF497_RECOVERY_ICONS[kind],16)+
   '<span class="mf497-action-label"><span>'+parts[0]+'</span><span>'+
   parts[1]+'</span></span>';
  button.setAttribute('aria-label',parts.join(' '));
  button.setAttribute('title',parts.join(' '));
  button.dataset.mf497Action=kind;
 }
 group.classList.add('mf497-recovery-actions');
 return group;
}
function mf497RecoveryGroup(id){
 if(id===null||id===undefined||String(id)==='')return null;
 const parsed=document.createElement('div');
 // Reuse the existing canonical shortcut HTML and guarded, per-title
 // App.mf447Open handlers; do not create a separate recovery route.
 parsed.innerHTML=mf447Buttons({id:String(id)});
 const group=parsed.querySelector('.mf447-shortcut-group');
 return mf497RecoveryPolish(group);
}
function mf497IsOldDetailsRecovery(button){
 if(!button||button.tagName!=='BUTTON')return false;
 const action=button.getAttribute('onclick')||'';
 const name=(button.getAttribute('aria-label')||button.textContent||'').trim();
 // v439/v445/v447 injected these actions; keep unrelated Details controls,
 // including Edit, Delete, Log and title-specific controls, unchanged.
 return /App\.(?:mf439Open|mf445Open|mf447Open)\s*\(/.test(action)||
  /^(?:Fix Cover|Fix Metadata|Covers?\s*\+\s*Metadata Recovery)$/i.test(name);
}
function mf497DetailsMarkup(raw,item){
 if(item?.id===null||item?.id===undefined)return raw;
 try{
  const host=document.createElement('div');host.innerHTML=String(raw||'');
  const actions=host.querySelector('.v181-detail-actions');
  if(!actions)return raw;
  const group=mf447Prefs().details?mf497RecoveryGroup(item.id):null;
  actions.querySelectorAll('button').forEach(button=>{
   if(mf497IsOldDetailsRecovery(button)){
    button.remove();MF497_RECOVERY_STATE.retired++;
   }
  });
  actions.querySelectorAll('.mf447-shortcut-group').forEach(old=>old.remove());
  if(group){group.setAttribute('aria-label','Title recovery actions');actions.prepend(group);}
  MF497_RECOVERY_STATE.details++;
  return host.innerHTML;
 }catch(error){
  MF497_RECOVERY_STATE.errors++;
  console.warn('[MediaFlow v497] Original Title Details actions preserved',error);
  return raw;
 }
}
function mf497EditorMarkup(raw,item){
 try{
  const host=document.createElement('div');host.innerHTML=String(raw||'');
  const toolbar=host.querySelector('.mf449-editor-recovery-toolbar');
  if(!toolbar)return raw;
  const saved=item?.id!==null&&item?.id!==undefined&&String(item.id)!=='';
  const group=toolbar.querySelector('.mf447-shortcut-group');
  if(saved&&mf447Prefs().editor){
   if(group)mf497RecoveryPolish(group);
   else{
    // Defensive restore when the old editor injection did not place the
    // canonical group. Do not affect other editor controls.
    const replacement=mf497RecoveryGroup(item.id);
    if(replacement)toolbar.prepend(replacement);
   }
  }else if(!saved){
   // Keep unsaved-title actions disabled; only improve text legibility.
   toolbar.querySelectorAll('.mf449-editor-draft-actions button').forEach((button,i)=>{
    const kind=['cover','metadata','both'][i];
    if(!kind)return;
    const words=MF497_RECOVERY_LABELS[kind];
    button.innerHTML=mf425Icon(MF497_RECOVERY_ICONS[kind],16)+
     '<span class="mf497-action-label"><span>'+words[0]+'</span><span>'+words[1]+'</span></span>';
    button.setAttribute('aria-label',words.join(' ')+' — save title first');
   });
  }
  MF497_RECOVERY_STATE.editor++;
  return host.innerHTML;
 }catch(error){
  MF497_RECOVERY_STATE.errors++;
  console.warn('[MediaFlow v497] Original Edit Title recovery toolbar preserved',error);
  return raw;
 }
}
const mf497PreviousTitleDetails=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 return mf497DetailsMarkup(mf497PreviousTitleDetails.apply(this,arguments),item);
};
const mf497PreviousEditor=libraryModalHtml;
libraryModalHtml=function(item){
 return mf497EditorMarkup(mf497PreviousEditor.apply(this,arguments),item);
};
window.MediaFlowV497Recovery=Object.freeze({
 version:MF497_RECOVERY_VERSION,
 labels:MF497_RECOVERY_LABELS,
 details:mf497DetailsMarkup,editor:mf497EditorMarkup,
 isLegacyAction:mf497IsOldDetailsRecovery,
 status:()=>({...MF497_RECOVERY_STATE})
});
MediaFlowRuntime.version=MF497_RECOVERY_VERSION;
