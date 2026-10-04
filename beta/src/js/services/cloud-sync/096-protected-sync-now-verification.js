/* ---------- Protected Sync Now verification ------------------- */

function v178ManualMetadataAudit(state){
  let count=0;
  let xor=0;
  let sum=0;

  for(const item of (Array.isArray(state?.library)?state.library:[])){
    const manual=v178ManualMap(item);
    if(!Object.keys(manual).length)continue;

    const hash=v176Fnv(
      JSON.stringify({
        id:String(item?.id||''),
        manual
      })
    );

    count++;
    xor=(xor^hash)>>>0;
    sum=(sum+hash)>>>0;
  }

  return {count,xor,sum};
}

const v178VerifyCloudStateBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const base=v178VerifyCloudStateBase(
    cloudState,
    expected
  );
  const problems=[...(base?.missing||[])];

  const cloud=v178ManualMetadataAudit(cloudState);
  const wanted=v178ManualMetadataAudit(expected);

  if(
    cloud.count!==wanted.count ||
    cloud.xor!==wanted.xor ||
    cloud.sum!==wanted.sum
  ){
    problems.push('Manual rich-metadata protection');
  }

  return {
    ok:problems.length===0,
    missing:[...new Set(problems)]
  };
};

