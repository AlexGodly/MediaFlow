/* ---------- Cloud merge preservation ------------------------- */

const v176MergeLibraryItemBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
  const out=v176MergeLibraryItemBase(left,right);
  if(!out)return out;

  for(const key of ['genres','themes','studios','producers']){
    out[key]=v176MergeListValues(left?.[key],right?.[key]);
  }

  const lm=Number(left?.modifiedAt)||0;
  const rm=Number(right?.modifiedAt)||0;
  const newer=rm>lm?right:left;
  const older=rm>lm?left:right;

  for(const key of [
    'mediaFormat','synopsis','mediaSource','demographic',
    'ageRating','releaseDate','seasonLabel'
  ]){
    const nv=v176SafeText(newer?.[key],key==='synopsis'?6000:160);
    const ov=v176SafeText(older?.[key],key==='synopsis'?6000:160);
    out[key]=nv||ov||'';
  }

  for(const key of ['durationMinutes','communityScore']){
    const nv=Number(newer?.[key]);
    const ov=Number(older?.[key]);
    out[key]=Number.isFinite(nv)&&nv>0
      ?nv
      :(Number.isFinite(ov)&&ov>0?ov:null);
  }

  return out;
};

