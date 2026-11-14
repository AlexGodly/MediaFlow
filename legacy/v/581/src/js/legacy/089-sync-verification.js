/* ---------- Sync verification ------------------------------- */

function v176Fnv(text){
  let h=2166136261>>>0;
  const s=String(text||'');

  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }

  return h>>>0;
}

function v176LibraryMetadataAudit(state){
  let count=0;
  let xor=0;
  let sum=0;

  for(const item of (Array.isArray(state?.library)?state.library:[])){
    const payload={
      id:String(item?.id||''),
      mediaFormat:item?.mediaFormat||'',
      synopsis:item?.synopsis||'',
      genres:Array.isArray(item?.genres)?item.genres:[],
      themes:Array.isArray(item?.themes)?item.themes:[],
      studios:Array.isArray(item?.studios)?item.studios:[],
      producers:Array.isArray(item?.producers)?item.producers:[],
      mediaSource:item?.mediaSource||'',
      demographic:item?.demographic||'',
      durationMinutes:Number(item?.durationMinutes)||0,
      ageRating:item?.ageRating||'',
      releaseDate:item?.releaseDate||'',
      seasonLabel:item?.seasonLabel||'',
      communityScore:Number(item?.communityScore)||0
    };

    if(!v176HasRichMetadata(payload))continue;

    const hash=v176Fnv(JSON.stringify(payload));
    count++;
    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,xor,sum};
}

const v176VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v176VerifyCloudStateBase(cloudState,expected);
  const problems=[...(base?.missing||[])];

  const cloud=v176LibraryMetadataAudit(cloudState);
  const wanted=v176LibraryMetadataAudit(expected);

  if(
    cloud.count!==wanted.count ||
    cloud.xor!==wanted.xor ||
    cloud.sum!==wanted.sum
  ){
    problems.push('Rich Library metadata');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

