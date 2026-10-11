/* ---------- Add rich fields to the normal Library editor ------- */

const v178LibraryModalHtmlBase=libraryModalHtml;
libraryModalHtml=function(d){
  let h=v178LibraryModalHtmlBase(d);

  const panel=v178RichEditorHtml(d||{});

  return h.replace(
    '<div class="modal-actions" style="justify-content:space-between;">',
    panel+'<div class="modal-actions" style="justify-content:space-between;">'
  );
};

function v178CaptureEditorValues(){
  const el=id=>document.getElementById(id);
  if(!el('l-rich-format'))return null;

  const numberOrNull=(id,max=null)=>{
    const raw=String(el(id)?.value||'').trim();
    if(!raw)return null;
    let value=Number(raw);
    if(!Number.isFinite(value))return null;
    if(max!=null)value=Math.min(max,value);
    return Math.max(0,value);
  };

  return {
    year:numberOrNull('l-rich-year',9999),
    mediaFormat:v176SafeText(el('l-rich-format')?.value,80),
    durationMinutes:numberOrNull('l-rich-duration'),
    releaseDate:v176DateValue(el('l-rich-release-date')?.value),
    seasonLabel:v176SafeText(el('l-rich-season')?.value,80),
    ageRating:v176SafeText(el('l-rich-age-rating')?.value,80),
    communityScore:numberOrNull('l-rich-community-score',10),
    mediaSource:v176SafeText(el('l-rich-source')?.value,120),
    demographic:v176SafeText(el('l-rich-demographic')?.value,120),
    studios:v178CsvList(el('l-rich-studios')?.value),
    producers:v178CsvList(el('l-rich-producers')?.value),
    genres:v178CsvList(el('l-rich-genres')?.value),
    themes:v178CsvList(el('l-rich-themes')?.value),
    synopsis:v176SafeText(el('l-rich-synopsis')?.value,6000)
  };
}

function v178ComparableRichValue(key,value){
  if(['studios','producers','genres','themes'].includes(key)){
    return JSON.stringify(Array.isArray(value)?value:[]);
  }

  if(['year','durationMinutes','communityScore'].includes(key)){
    const n=Number(value);
    return Number.isFinite(n)&&n>0?String(n):'';
  }

  return String(value??'');
}

function v178ApplyManualEditorValues(item,before,captured){
  if(!item||!captured)return false;

  const manual=v178ManualMap(before||item);
  let changed=false;

  for(const key of V178_EDITABLE_RICH_FIELDS){
    const oldValue=before?.[key];
    const newValue=captured[key];

    if(
      v178ComparableRichValue(key,oldValue)!==
      v178ComparableRichValue(key,newValue)
    ){
      manual[key]=true;
      changed=true;
    }

    if(['studios','producers','genres','themes'].includes(key)){
      item[key]=Array.isArray(newValue)?newValue:[];
      continue;
    }

    if(['year','durationMinutes','communityScore'].includes(key)){
      const n=Number(newValue);
      item[key]=Number.isFinite(n)&&n>0?n:null;
      continue;
    }

    item[key]=String(newValue||'');
  }

  item.richMetadataManual=manual;

  if(changed)item.modifiedAt=Date.now();
  return changed;
}

/* FINAL title saver: capture metadata before the base editor closes, then save
   it onto the same Library record. The base save keeps all existing XP,
   completion, date, cover and validation behavior. */
const v178SaveLibraryModalBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const captured=v178CaptureEditorValues();

  const before=id
    ?(S.library||[]).find(item=>String(item?.id||'')===String(id))
    :null;

  const beforeCopy=before
    ?JSON.parse(JSON.stringify(before))
    :{};

  const beforeIds=new Set(
    (S.library||[]).map(item=>String(item?.id||''))
  );

  const result=v178SaveLibraryModalBase.apply(this,arguments);

  // If validation failed, the Library editor is still open. Do not save rich
  // metadata independently from the rest of the title form.
  if(document.getElementById('l-title'))return result;
  if(!captured)return result;

  let item=null;

  if(id){
    item=(S.library||[]).find(
      row=>String(row?.id||'')===String(id)
    );
  }else{
    item=(S.library||[]).find(
      row=>!beforeIds.has(String(row?.id||''))
    ) || (S.library||[])[(S.library||[]).length-1];
  }

  if(!item)return result;

  const changed=v178ApplyManualEditorValues(
    item,
    beforeCopy,
    captured
  );

  // Make the existing Library undo/redo entry include the rich metadata edit.
  const undo=(S.undoStack||[])[(S.undoStack||[]).length-1];
  if(undo&&/^(Edit title|Add title)$/i.test(String(undo.action||''))){
    undo.after=mfCoreSnapshot();
  }

  if(changed || !before){
    persistLibrary();
    render();
  }

  return result;
};

