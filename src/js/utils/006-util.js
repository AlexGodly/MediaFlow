/* ============================================================

   UTIL

   ============================================================ */

function uid(){ return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }

function todayISO(){ return new Date().toISOString().slice(0,10); }

function fmtDate(iso){

  const d = new Date(iso+'T00:00:00');

  const today = todayISO();

  const yest = new Date(Date.now()-86400000).toISOString().slice(0,10);

  if(iso===today) return 'Today';

  if(iso===yest) return 'Yesterday';

  return d.toLocaleDateString(undefined,{month:'short', day:'numeric'});

}

function fmtMinutes(m){

  m = Math.round(m);

  if(m < 60) return m+'m';

  const h = Math.floor(m/60), mm = m%60;

  return h+'h '+(mm? mm+'m':'').trim();

}

function getCategory(id){

  return S.categories.find(c=>c.id===id) || {id, name:'(removed category)', icon:'❔', color:'#555', unit:'episodes', target:1, minutesPerUnit:10, weight:1, enabled:false};

}

function unitLabel(unitKey, count){

  const u = UNITS[unitKey] || UNITS.episodes;

  return count===1 ? u.singular : u.label;

}

function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cleanTitle(value){
  return String(value ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/^\s*<!\[CDATA\[\s*/i, '')
    .replace(/\s*\]\]>\s*$/i, '')
    .trim();
}

function daysSince(ts){ if(!ts) return Infinity; return (Date.now()-ts)/86400000; }

function hoursAgo(h){ return Date.now() - h*3600000; }

function lastSessionFor(catId){

  let best = null;

  for(const s of S.sessions){ if(s.categoryId===catId && (!best || s.timestamp>best.timestamp)) best = s; }

  return best;

}

function minutesSince(catId, hours){

  const cutoff = hoursAgo(hours);

  return S.sessions.filter(s=>s.categoryId===catId && s.timestamp>=cutoff && s.status!=='skipped')

    .reduce((sum,s)=>sum+(s.minutes||0),0);

}

function todaysSessions(){

  const t = todayISO();

  return S.sessions.filter(s=>s.date===t);

}

function sessionsInRange(days){

  const cutoff = hoursAgo(days*24);

  return S.sessions.filter(s=>s.timestamp>=cutoff);

}


/* MediaFlow v533 — shared media-type helpers loaded before History and Statistics.
   The v532 end-of-runtime extension initialized these helpers too late for some
   navigation paths. Keep these declarations in the core utility segment so
   both old and current page renderers can call them safely. */
function v532MediaTypeRows(){
  return [
    {id:'video',label:'Watching'},
    {id:'reading',label:'Reading'},
    {id:'playing',label:'Playing'},
    {id:'listening',label:'Listening'}
  ];
}
function v532MediaTypeLabel(raw){
  const row=v532MediaTypeRows().find(x=>x.id===String(raw||''));
  return row?row.label:'Other';
}
function v532MediaTypeOptions(selected='all'){
  const value=String(selected||'all');
  const rows=[{id:'all',label:'All media types'},...v532MediaTypeRows(),{id:'other',label:'Other'}];
  return rows.map(row=>`<option value="${row.id}" ${value===row.id?'selected':''}>${row.label}</option>`).join('');
}
function v532SessionMediaType(session){
  const category=(S.categories||[]).find(c=>String(c?.id)===String(session?.categoryId));
  const type=String(category?.type||'');
  return v532MediaTypeRows().some(x=>x.id===type)?type:'other';
}
function v532MediaTypeMix(sessions,categories){
  const rows=v532MediaTypeRows();
  const types=new Set(rows.map(x=>x.id));
  const lookup=new Map((Array.isArray(categories)?categories:[]).map(cat=>[String(cat?.id),cat?.type]));
  const totals=Object.fromEntries(rows.map(x=>[x.id,0]));
  let hasOther=false;
  for(const session of Array.isArray(sessions)?sessions:[]){
    if(!session||session.status==='skipped')continue;
    const raw=String(lookup.get(String(session.categoryId))||'');
    const type=types.has(raw)?raw:'other';
    if(type==='other'){hasOther=true;if(!Object.prototype.hasOwnProperty.call(totals,'other'))totals.other=0;}
    totals[type]+=(Number(session.minutes)||0);
  }
  return [...rows.map(({id,label})=>({label,value:totals[id]})),
          ...(hasOther?[{label:'Other',value:totals.other}]:[])];
}

