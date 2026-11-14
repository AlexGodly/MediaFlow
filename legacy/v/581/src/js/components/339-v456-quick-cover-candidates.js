/* MediaFlow v456 — detailed, reliable quick-cover selection + live editor.
 * Candidate IDs are always shown before selection. Only conflict-free actual
 * provider record IDs can be linked on confirmation; never synthesize an ID.
 */
const MF456_VERSION=456;
const MF456={save:null,launch:null,lastSaved:null};
const mf456Escape=x=>mf424Escape(String(x??''));
function mf456CandidateLink(item,candidate){
 const link=typeof mf424LinkableCoverId==='function'?
  mf424LinkableCoverId(item||{},candidate):null;
 const key=String(link?.key||candidate?.externalIdKey||'').trim();
 const id=String(link?.value||candidate?.externalIdValue||candidate?.recordId||'').trim();
 const conflict=Boolean(link?.conflict);
 return {key,id,conflict,canLink:Boolean(link&&!conflict&&!link.existing&&id)};
}
function mf456CoverGallery(q,item){
 return '<div class="mf454-cover-gallery mf456-cover-gallery" role="list" aria-label="Cover choices — choose exactly one">'+
 q.covers.map((c,i)=>{
  const id=mf456CandidateLink(item,c);
  const match=Number.isFinite(Number(c?.confidence))?
   Math.round(Math.max(0,Math.min(1,Number(c.confidence)))*100)+'%':'Unknown';
  const selected=q.coverIndex===i;
  const safeUrl=/^https:\/\//i.test(String(c?.url||''));
  return '<article role="listitem" class="mf456-cover-card '+(selected?'is-selected':'')+'" data-mf456-cover-index="'+i+'">'+
   '<div class="mf456-cover-art"><img src="'+mf456Escape(c.url)+'" alt="'+mf456Escape(c.title||'Cover candidate')+'" loading="lazy" decoding="async"></div>'+
   '<div class="mf456-cover-content">'+
   '<strong class="mf456-cover-title">'+mf456Escape(c.title||item?.title||'Untitled match')+'</strong>'+
   '<div class="mf456-cover-facts"><span>'+mf425Icon('database',13)+' '+mf456Escape(c.provider||'Unknown provider')+'</span>'+
   '<span>'+mf425Icon('check',13)+' '+mf456Escape(match)+' match</span></div>'+
   '<small class="mf456-cover-trust">'+mf425Icon('shield',14)+
   ' '+mf456Escape(c.idMatch?'Provider external-ID match':'Title candidate — verify edition')+'</small>'+
   '<div class="mf456-cover-record"><span>Provider record ID</span><code>'+mf456Escape(id.id||'Not supplied')+'</code>'+
   '<span>ID saved as</span><code>'+mf456Escape(id.key||'Cover URL only')+'</code></div>'+
   (id.conflict?'<small class="mf456-cover-conflict">Existing external ID differs — it will not be overwritten.</small>':
    id.canLink?'<small class="mf456-cover-link">Valid provider ID will be linked on confirmation.</small>':
    '<small class="mf456-cover-note">Existing IDs are protected; cover URL can still be selected.</small>')+
   '<button type="button" class="btn '+(selected?'btn-primary':'btn-ghost')+' mf456-cover-select" data-v225-iconified="1" '+
   (safeUrl?'':'disabled ')+'onclick="App.mf456SelectCover('+i+')" aria-pressed="'+selected+'">'+
   mf425Icon(selected?'check':'images',15)+' '+(selected?'Selected cover':'Select this cover')+'</button></div></article>';
 }).join('')+'</div>';
}
const mf456PreviousView=mf454QuickView;
mf454QuickView=function(example=null){
 const q=example||MF453Quick.current;
 const original=mf456PreviousView.apply(this,arguments);
 if(!q||!q.covers?.length||q.kind==='metadata'||!original)return mf456WithSaveProgress(original,q);
 // Use the browser's HTML parser rather than error-prone string truncation.
 const host=document.createElement('div');host.innerHTML=original;
 const gallery=host.querySelector('.mf454-cover-gallery');
 if(gallery)gallery.outerHTML=mf456CoverGallery(q,mf439Item(q.id));
 return mf456WithSaveProgress(host.innerHTML,q);
};
function mf456WithSaveProgress(html,q){
 if(!html||!q?.applying)return html;
 const complete=Math.max(0,Number(q.saveCompleted)||0),total=Math.max(1,Number(q.saveTotal)||1);
 const done=Math.min(complete,total);
 const progress='<section class="mf456-saving" role="status" aria-live="polite">'+
  '<header><strong>'+mf425Icon('save',16)+' Saving recovery changes</strong>'+
  '<small>Step '+done+' / '+total+'</small></header>'+
  '<progress max="'+total+'" value="'+done+'" aria-label="Recovery save stages complete"></progress>'+
  '<p>'+mf456Escape(q.savePhase||'Preparing confirmed changes…')+'</p>'+
  '<small>Progress shows completed save operations, not estimated network time. Do not refresh until it completes.</small></section>';
 return html.replace('<footer class="mf454-quick-footer">',progress+'<footer class="mf454-quick-footer">');
}
function mf456SelectCover(i){
 const q=MF453Quick.current,index=Number(i);
 if(!q||q.applying||!Number.isInteger(index)||index<0||index>=q.covers.length)return;
 q.coverIndex=index;
 mf453PaintQuick();
 const chosen=mf453QuickRoot()?.querySelector('[data-mf456-cover-index="'+index+'"]');
 chosen?.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});
}
App.mf456SelectCover=mf456SelectCover;
function mf456QuickProgress(q,phase,advance=false,total=null){
 if(!q)return;
 if(Number.isFinite(total)&&total>0){q.saveTotal=total;q.saveCompleted=0;}
 if(advance)q.saveCompleted=Math.min(q.saveTotal||1,(q.saveCompleted||0)+1);
 q.savePhase=String(phase||'Saving confirmed fields…');
 if(MF453Quick.current===q)mf453PaintQuick();
}
function mf456EditorMatches(item){
 const editor=document.querySelector('.v240-library-editor,.v238-library-editor');
 if(!editor||!item?.id)return null;
 const title=editor.querySelector('#l-title');
 const name=String(title?.value||'').trim();
 // Never update another title or stomp an editor with an unsaved new title.
 if(!name||name!==String(item.title||'').trim())return null;
 return editor;
}
function mf456SyncEditorField(editor,ids,value,overwrite=false){
 if(value==null)return false;
 for(const id of ids){
  const input=editor.querySelector('#'+id);
  if(!input||!('value' in input))continue;
  if(!overwrite&&String(input.value||'').trim())continue;
  const next=Array.isArray(value)?value.join(', '):typeof value==='object'?JSON.stringify(value):String(value);
  if(input.value===next)return true;
  input.value=next;
  input.setAttribute('value',next);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
 }
 return false;
}
function mf456RefreshEditor(id){
 const item=mf439Item(id),editor=mf456EditorMatches(item);
 if(!editor)return false;
 const cover=String(item.coverUrl||'');
 if(cover)mf456SyncEditorField(editor,['l-cover'],cover,true);
 // Only fill empty optional fields: do not erase unsaved edits in the form.
 mf456SyncEditorField(editor,['l-desc','l-description','l-synopsis'],item.synopsis||item.description);
 mf456SyncEditorField(editor,['l-genres','l-genre'],item.genres);
 mf456SyncEditorField(editor,['l-tags'],item.tags);
 let note=editor.querySelector('.mf456-editor-synced');
 if(!note){note=document.createElement('p');note.className='mf456-editor-synced';
  note.setAttribute('role','status');
  const input=editor.querySelector('#l-cover');
  (input?.closest('.field')||editor).append(note);}
 note.textContent='Recovered cover and metadata updated in this open editor.';
 const preview=editor.querySelector('.mf456-editor-cover-preview');
 if(preview){preview.src=cover;preview.hidden=!cover;}
 else if(cover&&/^https:\/\//.test(cover)){
  const img=document.createElement('img');img.className='mf456-editor-cover-preview';
  img.alt='Confirmed title cover';img.src=cover;img.loading='lazy';
  (editor.querySelector('#l-cover')?.closest('.field')||editor).append(img);
 }
 return true;
}
function mf456NotifyRecoverySaved(q,item,coverCount,metadataCount){
 if(!item)return;
 MF456.lastSaved={id:String(item.id),at:Date.now(),coverCount,metadataCount,
  coverUrl:String(item.coverUrl||'')};
 mf456RefreshEditor(item.id);
 try{document.dispatchEvent(new CustomEvent('mediaflow:title-recovered',
  {detail:{id:String(item.id),coverUrl:String(item.coverUrl||''),coverCount,metadataCount}}));}catch(_){}
}
window.MediaFlowV456Quick=Object.freeze({version:456,candidateLink:mf456CandidateLink,
 view:mf454QuickView,select:mf456SelectCover,progress:mf456QuickProgress,
 editor:mf456RefreshEditor,lastSaved:()=>MF456.lastSaved});
