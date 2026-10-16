/* MediaFlow v437 — Universal editable metadata fields.
 * Manual fields are kept independent from external ratings and tracking data.
 * Uses the canonical title editor/saver and existing Library persistence. */
const MF437_EDITABLE=[
 ['Universal title details',[
  ['originalTitle','Original title','text'],['alternativeTitles','Alternative titles','list'],
  ['status','Release / publication status','text'],['originalLanguage','Original language','text'],
  ['language','Language','text'],['countries','Countries','list'],['officialSite','Official website','url'],
  ['franchise','Franchise','text'],['series','Series','text'],['edition','Edition','text']]],
 ['Creators & production',[
  ['authors','Authors / writers','list'],['artists','Artists / illustrators','list'],
  ['directors','Directors','list'],['cast','Cast / performers','list'],['narrators','Narrators','list'],
  ['developers','Developers','list'],['publishers','Publishers','list'],
  ['composers','Composers','list'],['labels','Music labels','list'],['network','TV network','text']]],
 ['Media counts & durations',[
  ['episodeCount','Episode count','number'],['seasonCount','Season count','number'],
  ['chapterCount','Chapter count','number'],['volumeCount','Volume count','number'],
  ['issueCount','Comic issue count','number'],['pageCount','Page count','number'],
  ['trackCount','Track count','number'],['visualNovelLength','Visual novel duration (minutes)','number']]],
 ['Games, music, novels & interactive fiction',[
  ['platforms','Platforms','list'],['gameModes','Game modes','list'],
  ['gameEngine','Game engine','text'],['visualNovelEngine','Visual novel engine','text'],
  ['ifid','Interactive Fiction ID (IFID)','text'],['isbn','ISBN','text'],
  ['releaseGroup','Music release group','text'],['isrc','Music recording ISRC','text'],
  ['seiyuu','Voice cast','list'],['serialization','Serialization / platform','text'],
  ['readingPlatform','Web novel platform','text'],['estimatedPlaytime','Estimated game duration (minutes)','number']]]
];
function mf437FieldInputValue(x){return Array.isArray(x)?x.join(', '):x??'';}
function mf437ExtraEditorMarkup(item){
 const old=item?.mediaMetadata||{};
 const sections=MF437_EDITABLE.map(([heading,fields],index)=>'<details class="mf437-field-group" '+(!index?'open':'')+'><summary>'+mf437Escape(heading)+'</summary><div class="mf437-edit-fields">'+
 fields.map(([key,label,type])=>{
  const value=mf437FieldInputValue(old[key]),inputType=type==='number'?'number':type==='url'?'url':'text';
  return '<label><span>'+mf437Escape(label)+'</span><input data-mf437-field="'+mf437Escape(key)+'" data-mf437-type="'+mf437Escape(type)+'" type="'+inputType+'" value="'+mf437Escape(value)+'" '+(type==='number'?'min="0" step="1" ':'')+'maxlength="300" autocomplete="off"></label>';
 }).join('')+'</div></details>').join('');
 return '<section class="mf437-universal-editor" aria-label="Universal title metadata"><h3>UNIVERSAL METADATA</h3><p>Additional fields for anime, manga, games, books, music and other Library titles. Edit only the fields you need. Your changes are protected from automatic Metadata Recovery.</p>'+sections+'</section>';
}
const mf437EditorBase=libraryModalHtml;
libraryModalHtml=function(item){
 let html=String(mf437EditorBase.apply(this,arguments)||'');
 const marker='<div class="modal-actions" style="justify-content:space-between;">';
 if(html.includes(marker))html=html.replace(marker,mf437ExtraEditorMarkup(item?.id?mf437Find(item.id)||item:item)+marker);
 return html;
};
function mf437CaptureManualInputs(){
 const fields=[...document.querySelectorAll('#modal-root [data-mf437-field]')];
 if(!fields.length)return null;
 const output={};
 for(const input of fields){
  const key=input.dataset.mf437Field,type=input.dataset.mf437Type,raw=String(input.value||'').trim();
  if(type==='number'){
   const n=raw?Number(raw):null;output[key]=n!==null&&Number.isSafeInteger(n)&&n>=0&&n<1000000000?n:null;
  }else if(type==='list')output[key]=[...new Set(raw.split(/[,;]+/).map(x=>x.trim()).filter(Boolean))].slice(0,40);
  else output[key]=raw.slice(0,300);
 }
 return output;
}
const mf437SaveBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
 const pending=mf437CaptureManualInputs();
 const before=id?mf437Find(id):null;
 const old=before?JSON.parse(JSON.stringify(before.mediaMetadata||{})):{};
 const result=mf437SaveBase.apply(this,arguments);
 if(!pending||S.modal?.type==='library')return result;
 const item=id?mf437Find(id):(S.library||[]).at(-1);
 if(!item)return result;
 const previous=item.mediaMetadata||{},next={...previous},flags={...(item.richMetadataManual||{})};
 let changed=false;
 for(const [key,value] of Object.entries(pending)){
  const orig=Object.prototype.hasOwnProperty.call(old,key)?old[key]:null;
  const normalized=Array.isArray(value)&&!value.length?null:value===''?null:value;
  const comparable=orig===undefined||orig===null||orig===''||Array.isArray(orig)&&!orig.length?null:orig;
  if(JSON.stringify(comparable)===JSON.stringify(normalized))continue;
  if(normalized===null)delete next[key];else next[key]=value;
  flags[key]=true;changed=true;
 }
 if(!changed)return result;
 item.mediaMetadata=next;item.richMetadataManual=flags;item.modifiedAt=Date.now();
 persistLibrary();Promise.resolve(saveState()).catch(e=>console.warn('Universal metadata save:',e));
 return result;
};
const mf437EditorStyles=document.createElement('style');
mf437EditorStyles.textContent='.mf437-universal-editor{margin:14px 0;padding:12px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:12px}.mf437-universal-editor>h3{font-size:.8rem;letter-spacing:.065em;margin:0}.mf437-universal-editor>p{font-size:.76rem;opacity:.7;margin:7px 0 10px}.mf437-field-group{border-top:1px solid color-mix(in srgb,currentColor 13%,transparent);padding:10px 0}.mf437-field-group summary{font-size:.82rem;font-weight:700;cursor:pointer}.mf437-edit-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding-top:10px}.mf437-edit-fields label{display:flex;flex-direction:column;gap:5px;font-size:.75rem}.mf437-edit-fields input{width:100%;min-width:0;border:1px solid color-mix(in srgb,currentColor 23%,transparent);background:var(--input-bg,var(--surface-2,transparent));color:inherit;border-radius:8px;padding:9px}@media(max-width:670px){.mf437-edit-fields{grid-template-columns:1fr}}';
document.head.appendChild(mf437EditorStyles);
