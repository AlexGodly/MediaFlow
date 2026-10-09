/* ---------- Protect manually edited fields from future imports -------- */

v176ApplyRichMetadata=function(item,meta){
  if(!item||!meta||typeof meta!=='object')return false;

  const manual=v178ManualMap(item);
  let changed=false;

  for(const key of ['genres','themes','studios','producers']){
    if(manual[key])continue;

    const merged=v176MergeListValues(
      item[key],
      meta[key]
    );

    if(
      JSON.stringify(merged)!==
      JSON.stringify(Array.isArray(item[key])?item[key]:[])
    ){
      item[key]=merged;
      changed=true;
    }
  }

  for(const key of [
    'mediaFormat','synopsis','mediaSource','demographic',
    'ageRating','releaseDate','seasonLabel'
  ]){
    if(manual[key])continue;

    const value=v176SafeText(
      meta[key],
      key==='synopsis'?6000:160
    );

    if(value&&value!==String(item[key]||'')){
      item[key]=value;
      changed=true;
    }
  }

  for(const key of ['durationMinutes','communityScore']){
    if(manual[key])continue;

    const value=Number(meta[key]);
    if(
      Number.isFinite(value)&&
      value>0&&
      Number(item[key])!==value
    ){
      item[key]=value;
      changed=true;
    }
  }

  return changed;
};

// Year was part of the older v158 core importer rather than v176 rich metadata.
// Protect a manually edited Year around the complete Standard/Advanced import
// pipeline too.
const v178ApplyNormalizedRecordBase=v158ApplyNormalizedRecord;
v158ApplyNormalizedRecord=function(record,service,index,touched){
  const existing=v158FindImportItem(record,index);
  const protectYear=existing?.richMetadataManual?.year===true;
  const yearBefore=existing?.year??null;

  const result=v178ApplyNormalizedRecordBase(
    record,
    service,
    index,
    touched
  );

  if(protectYear){
    const item=v158FindImportItem(record,index);
    if(item){
      item.year=yearBefore;
      touched?.set(String(item.id),item);
      index?.add?.(item);
    }
  }

  return result;
};

/* ---------- Cloud merge preservation of manual-protection flags -------- */

const v178MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v178MergeLibraryItemBase(left,right);
  if(!out)return out;

  const lm=v178ManualMap(left);
  const rm=v178ManualMap(right);
  const merged={};

  for(const key of V178_EDITABLE_RICH_FIELDS){
    if(lm[key]||rm[key])merged[key]=true;
  }

  out.richMetadataManual=merged;
  return out;
};

