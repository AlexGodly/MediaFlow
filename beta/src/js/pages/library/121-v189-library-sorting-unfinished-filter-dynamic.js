/* ============================================================
   MediaFlow v189 — Library sorting, unfinished filter, Dynamic
   bulk actions, Normal mode label + persistent Last Seen audit
   ============================================================ */

const V189_BACKUP_SCHEMA_VERSION=23;
const V189_CLOUD_SYNC_VERSION=189;
let V189_RANDOM_COUNTER=0;
let V189_SEEN_SAVE_TIMER=null;

function v189SortMode(){
  return String(S.histFilters?.libSort||'priority-desc');
}
function v189RandomSeed(){
  const raw=Number(S.histFilters?.libRandomSeed)||0;
  return raw||1;
}
function v189Hash(text){
  let h=2166136261>>>0;
  const s=String(text||'');
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  return h>>>0;
}
function v189RandomValue(item){
  return v189Hash(`${v189RandomSeed()}::${String(item?.id||item?.title||'')}`);
}
function v189IsUnfinished(item){
  if(!item)return false;
  if(String(item.status||'').toLowerCase()==='completed')return false;
  const total=Number(item.total);
  const progress=Math.max(0,Number(item.progress)||0);
  if(Number.isFinite(total)&&total>0&&progress>=total)return false;
  return true;
}
function v189UnfinishedOnly(){
  return !!S.histFilters?.libUnfinishedOnly;
}
function v189ToggleUnfinishedOnly(){
  S.histFilters=S.histFilters||{};
  S.histFilters.libUnfinishedOnly=!S.histFilters.libUnfinishedOnly;
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
}
function v189ShuffleLibraryRandom(){
  S.histFilters=S.histFilters||{};
  S.histFilters.libSort='random';
  S.histFilters.libRandomSeed=Date.now()+(++V189_RANDOM_COUNTER);
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
}

/* Final Library sort setter. Choosing Random always creates a fresh order. */
v69SetLibrarySort=function(v){
  S.histFilters=S.histFilters||{};
  const allowed=[
    'priority','priority-desc','priority-asc','title-asc','title-desc',
    'rating-desc','rating-asc','progress-desc','progress-asc','total-desc','total-asc',
    'logging-desc','logging-asc','edited-desc','edited-asc','seen-desc','seen-asc',
    'added-desc','added-asc','random'
  ];
  const next=allowed.includes(String(v))?String(v):'priority-desc';
  S.histFilters.libSort=next;
  if(next==='random')S.histFilters.libRandomSeed=Date.now()+(++V189_RANDOM_COUNTER);
  S.libPage=0;
  try{v53InvalidateLibraryCache();}catch(_){}
  render();
};
App.v69SetLibrarySort=v69SetLibrarySort;

function v189CompareLibraryItems(a,b,sort){
  const ai=a?.item||a, bi=b?.item||b;
  const at=cleanTitle(ai?.title||'');
  const bt=cleanTitle(bi?.title||'');
  const titleCmp=()=>at.localeCompare(bt,undefined,{numeric:true,sensitivity:'base'});
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const rank={low:0,medium:1,high:2};
  let d=0;

  if(sort==='title-asc')return titleCmp();
  if(sort==='title-desc')return -titleCmp();
  if(sort==='priority-asc')d=(rank[String(ai?.priority||'medium')]??1)-(rank[String(bi?.priority||'medium')]??1);
  else if(sort==='priority-desc'||sort==='priority')d=(rank[String(bi?.priority||'medium')]??1)-(rank[String(ai?.priority||'medium')]??1);
  else if(sort==='rating-asc')d=n(ai?.rating)-n(bi?.rating);
  else if(sort==='rating-desc')d=n(bi?.rating)-n(ai?.rating);
  else if(sort==='progress-asc')d=n(ai?.progress)-n(bi?.progress);
  else if(sort==='progress-desc')d=n(bi?.progress)-n(ai?.progress);
  else if(sort==='total-asc')d=n(ai?.total)-n(bi?.total);
  else if(sort==='total-desc')d=n(bi?.total)-n(ai?.total);
  else if(sort==='logging-asc')d=n(v53LastTouched(ai))-n(v53LastTouched(bi));
  else if(sort==='logging-desc')d=n(v53LastTouched(bi))-n(v53LastTouched(ai));
  else if(sort==='edited-asc')d=n(ai?.modifiedAt||ai?.createdAt)-n(bi?.modifiedAt||bi?.createdAt);
  else if(sort==='edited-desc')d=n(bi?.modifiedAt||bi?.createdAt)-n(ai?.modifiedAt||ai?.createdAt);
  else if(sort==='seen-asc')d=n(ai?.lastSeenAt)-n(bi?.lastSeenAt);
  else if(sort==='seen-desc')d=n(bi?.lastSeenAt)-n(ai?.lastSeenAt);
  else if(sort==='added-asc')d=n(ai?.createdAt)-n(bi?.createdAt);
  else if(sort==='added-desc')d=n(bi?.createdAt)-n(ai?.createdAt);
  else if(sort==='random')d=v189RandomValue(ai)-v189RandomValue(bi);

  return d||titleCmp();
}

