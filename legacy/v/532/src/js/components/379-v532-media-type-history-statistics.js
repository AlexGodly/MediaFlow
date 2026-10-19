/* MediaFlow v532 — canonical media activity type UI for History and Statistics.
   The persisted category type remains video/reading/playing/listening.
   Unknown/deleted categories remain visible as Other; no record migration. */
const V532_MEDIA_TYPE_ROWS=Object.freeze([
  Object.freeze({id:'video',label:'Watching'}),
  Object.freeze({id:'reading',label:'Reading'}),
  Object.freeze({id:'playing',label:'Playing'}),
  Object.freeze({id:'listening',label:'Listening'})
]);
const V532_MEDIA_TYPE_LABELS=Object.freeze(Object.fromEntries(V532_MEDIA_TYPE_ROWS.map(x=>[x.id,x.label])));

function v532MediaTypeLabel(raw){
  return V532_MEDIA_TYPE_LABELS[String(raw||'')]||'Other';
}
function v532MediaTypeOptions(selected='all'){
  const value=String(selected||'all');
  const rows=[{id:'all',label:'All media types'},...V532_MEDIA_TYPE_ROWS,{id:'other',label:'Other'}];
  return rows.map(row=>`<option value="${row.id}" ${value===row.id?'selected':''}>${row.label}</option>`).join('');
}
function v532SessionMediaType(session){
  const category=(S.categories||[]).find(c=>String(c?.id)===String(session?.categoryId));
  return V532_MEDIA_TYPE_LABELS[String(category?.type||'')]?category.type:'other';
}
function v532MediaTypeMix(sessions,categories){
  const lookup=new Map((Array.isArray(categories)?categories:[]).map(cat=>[String(cat?.id),cat?.type]));
  const totals=Object.fromEntries(V532_MEDIA_TYPE_ROWS.map(x=>[x.id,0]));
  let hasOther=false;
  for(const session of Array.isArray(sessions)?sessions:[]){
    if(!session||session.status==='skipped')continue;
    const raw=String(lookup.get(String(session.categoryId))||'');
    const type=V532_MEDIA_TYPE_LABELS[raw]?raw:'other';
    if(type==='other'){hasOther=true;if(!Object.prototype.hasOwnProperty.call(totals,'other'))totals.other=0;}
    totals[type]+=(Number(session.minutes)||0);
  }
  return [...V532_MEDIA_TYPE_ROWS.map(({id,label})=>({label,value:totals[id]})),
          ...(hasOther?[{label:'Other',value:totals.other}]:[])];
}
