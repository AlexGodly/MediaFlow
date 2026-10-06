/* ============================================================
   MediaFlow v224 — Shared Sorting Foundation
   ------------------------------------------------------------
   One sort field + one Asc/Desc direction switch across every
   Library-style browser introduced/updated in v224.
   ============================================================ */
const V224_RUNTIME_VERSION=224;
const V224_DEFAULT_SORT_BASE='title';
const V224_DEFAULT_SORT_DIR='asc';

function v224SortDirection(value){
  return String(value||'').toLowerCase()==='desc'?'desc':'asc';
}
function v224LegacySortParts(value,fallbackBase=V224_DEFAULT_SORT_BASE,fallbackDir=V224_DEFAULT_SORT_DIR){
  const raw=String(value||'').toLowerCase().trim();
  if(!raw||raw==='relevance')return {base:fallbackBase,dir:fallbackDir};
  if(raw==='priority')return {base:'priority',dir:'desc'};
  if(raw==='random')return {base:'random',dir:'asc'};
  const m=raw.match(/^(title|priority|rating|progress|total|logging|edited|seen|added)-(asc|desc)$/);
  if(m)return {base:m[1],dir:m[2]};
  if(['title','priority','rating','progress','total','logging','edited','seen','added'].includes(raw)){
    return {base:raw,dir:fallbackDir};
  }
  return {base:fallbackBase,dir:fallbackDir};
}
function v224SortKey(base,dir){
  const b=String(base||V224_DEFAULT_SORT_BASE).toLowerCase();
  if(b==='random')return 'random';
  return `${b}-${v224SortDirection(dir)}`;
}
function v224SortOptionsHtml(base,options){
  const current=String(base||V224_DEFAULT_SORT_BASE);
  return (options||[]).map(([value,label])=>
    `<option value="${escapeHtml(value)}" ${current===value?'selected':''}>${escapeHtml(label)}</option>`
  ).join('');
}
function v224SortDirectionButton(dir,onclick,disabled=false,label='Sort direction'){
  const d=v224SortDirection(dir);
  return `<button type="button" class="btn btn-sm v224-sort-direction ${d==='desc'?'is-desc':'is-asc'}" ${disabled?'disabled':''}
    onclick="${onclick}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}: ${d==='asc'?'Ascending':'Descending'}">
    <span class="v224-sort-arrow" aria-hidden="true">${d==='asc'?'↑':'↓'}</span>
    <span>${d==='asc'?'ASC':'DESC'}</span>
  </button>`;
}
function v224CompareLibraryLike(a,b,base,dir){
  const d=v224SortDirection(dir)==='desc'?-1:1;
  const at=cleanTitle(a?.title||'');
  const bt=cleanTitle(b?.title||'');
  const title=()=>at.localeCompare(bt,undefined,{numeric:true,sensitivity:'base'});
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const rank={low:0,medium:1,high:2};
  let diff=0;
  switch(String(base||'title')){
    case 'title': diff=title(); break;
    case 'priority': diff=(rank[String(a?.priority||'medium').toLowerCase()]??1)-(rank[String(b?.priority||'medium').toLowerCase()]??1); break;
    case 'rating': diff=n(a?.rating)-n(b?.rating); break;
    case 'progress': diff=n(a?.progress)-n(b?.progress); break;
    case 'total': diff=n(a?.total)-n(b?.total); break;
    case 'logging': diff=n(v53LastTouched(a))-n(v53LastTouched(b)); break;
    case 'edited': diff=n(a?.modifiedAt||a?.createdAt)-n(b?.modifiedAt||b?.createdAt); break;
    case 'seen': diff=n(a?.lastSeenAt)-n(b?.lastSeenAt); break;
    case 'added': diff=n(a?.createdAt)-n(b?.createdAt); break;
    default: diff=title(); break;
  }
  return (diff*d)||(title()*d);
}
