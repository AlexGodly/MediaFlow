/* MediaFlow v449 — Top-aligned Add/Edit recovery actions and Library toolbar cleanup.
 * Pure presentation. All v424/v439/v447 recovery actions, title saving,
 * draft protection and provider settings remain under their existing owners.
 */
const MF449_VERSION=449;
function mf449DraftButtons(){
 const actions=[['images','Cover Recovery'],['database','Metadata Recovery'],
  ['layers','Recover Both'],['search','Fix Metadata']];
 return '<div class="mf449-editor-action-row mf449-editor-draft-actions" role="group" aria-label="Recovery actions (save title first)">'+
  actions.map(([icon,label])=>'<button class="btn btn-sm btn-ghost" type="button" disabled '+
   'title="Save this title first to enable recovery" aria-label="'+mf424Escape(label)+' — save title first">'+
   mf425Icon(icon,16)+' '+label+'</button>').join('')+'</div>';
}
function mf449TransformEditor(raw,item){
 // v239/v240 editor wrappers are stable; modify the returned markup only.
 // No DOM edits to the active form while the user is typing.
 try{
  const host=document.createElement('div');host.innerHTML=raw;
  const editor=host.querySelector('.v240-library-editor,.v238-library-editor');
  const title=editor?.querySelector('.modal-title');
  if(!editor||!title)return raw;
  const saved=!!item?.id;
  const toolbar=document.createElement('section');
  toolbar.className='mf449-editor-recovery-toolbar';
  toolbar.setAttribute('aria-label','Title recovery actions');
  toolbar.setAttribute('data-mf449-toolbar',saved?'saved':'draft');
  if(saved){
   // v447 inserts the three choices into v439's editor-action wrapper.
   // Move those actual nodes — preserving inline actions and any provider
   // preference logic — rather than constructing duplicate buttons.
   const group=editor.querySelector('.mf439-editor-action .mf447-shortcut-group, .mf447-editor-actions .mf447-shortcut-group');
   if(group)toolbar.appendChild(group);
   else if(typeof mf447Prefs==='function'&&mf447Prefs().editor&&typeof mf447Buttons==='function'){
    const parsed=document.createElement('div');parsed.innerHTML=mf447Buttons({id:String(item.id)});
    if(parsed.firstElementChild)toolbar.appendChild(parsed.firstElementChild);
   }
   const metadata=editor.querySelector('.mf439-editor-action > button[onclick*="mf439Open"]');
   if(metadata)toolbar.appendChild(metadata);
   else{
    const button=document.createElement('button');button.type='button';button.className='btn btn-sm btn-ghost';
    button.innerHTML=mf425Icon('search',16)+' Fix Metadata';
    button.addEventListener('click',()=>App.mf439Open(String(item.id)));
    toolbar.appendChild(button);
   }
   // Remove only the now-empty injection wrapper; leave adjacent recovery
   // settings, title metadata editors and save controls unchanged.
   editor.querySelectorAll('.mf439-editor-action').forEach(el=>{
    if(!el.querySelector('button,input,select,textarea'))el.remove();
   });
  }else{
   // Unsaved draft has no durable Library ID. Four visible but disabled
   // actions communicate the feature without risking Library-wide recovery.
   toolbar.innerHTML=mf449DraftButtons()+
    '<small class="mf449-draft-note">'+mf425Icon('shield',14)+
    ' Save this title before starting recovery. You can still edit its fields normally.</small>';
  }
  title.before(toolbar);
  return host.innerHTML;
 }catch(error){
  console.warn('v449 recovery toolbar relocation failed, preserving editor markup',error);
  return raw;
 }
}
const mf449PreviousEditor=libraryModalHtml;
libraryModalHtml=function(item){
 return mf449TransformEditor(String(mf449PreviousEditor.apply(this,arguments)||''),item);
};
function mf449CleanLibraryMarkup(raw){
 raw=String(raw||'');
 // v425's original one-off button duplicates v447's Cover Recovery action.
 // Keep v447's Cover / Metadata / Recover Both controls intact in both
 // Normal and Dynamic Library toolbars, regardless of layout or selection.
 let html=raw.replace(/<button\b(?=[^>]*\bmf425-tools-button\b)[^>]*>[\s\S]*?<\/button>/g,'');
 html=html.replace(/<div class="mf425-library-tools">\s*<\/div>/g,'');
 return html;
}
const mf449PreviousLibrary=renderLibrary;
renderLibrary=function(){return mf449CleanLibraryMarkup(mf449PreviousLibrary.apply(this,arguments));};
window.MediaFlowV449=Object.freeze({version:449,draft:mf449DraftButtons,transform:mf449TransformEditor,cleanLibrary:mf449CleanLibraryMarkup});
