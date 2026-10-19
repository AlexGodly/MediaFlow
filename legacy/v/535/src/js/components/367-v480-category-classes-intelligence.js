/* MediaFlow v480 — optional Category Classes and hierarchical recommendations.
 * Uses the existing scheduler/category scorer, title picker, category icon
 * palette, Settings Center, and canonical settings persistence.
 * Off by default; disabled mode invokes the original weightedPick verbatim.
 */
const V480_DEFAULTS=Object.freeze({
 enabled:false,strength:'balanced',avoidRepeat:true,rewardNeglect:true,
 freshInfluence:true,adaptAmount:false,classes:[]
});
DEFAULT_SETTINGS.v480CategoryClasses=JSON.parse(JSON.stringify(V480_DEFAULTS));
function v480Clean(raw){
 const s=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const strength=['gentle','balanced','strong'].includes(s.strength)?s.strength:'balanced';
 const used=new Set();
 const validCategories=new Set((S.categories||[]).map(c=>String(c.id)));
 const input=Array.isArray(s.classes)?s.classes:[];
 const classes=[];
 for(const entry of input.slice(0,200)){
  if(!entry||typeof entry!=='object')continue;
  const id=String(entry.id||'').trim().slice(0,100);
  if(!id||classes.some(c=>c.id===id))continue;
  const ids=[];
  for(const value of Array.isArray(entry.categoryIds)?entry.categoryIds:[]){
   const key=String(value);
   if(validCategories.has(key)&&!used.has(key)){ids.push(key);used.add(key);}
  }
  const color=String(entry.color||'#A78BFA').toUpperCase();
  const iconUrl=v144SafeIconUrl(entry.iconUrl||'');
  classes.push({
   id,name:String(entry.name||'Untitled Class').trim().slice(0,80)||'Untitled Class',
   icon:String(entry.icon||'📚').slice(0,32),iconUrl,
   color:/^#[A-F0-9]{6}$/.test(color)?color:'#A78BFA',
   weight:Math.max(1,Math.min(5,Number(entry.weight)||1)),
   enabled:entry.enabled!==false,categoryIds:ids
  });
 }
 return {
  enabled:s.enabled===true,strength,
  avoidRepeat:s.avoidRepeat!==false,rewardNeglect:s.rewardNeglect!==false,
  freshInfluence:s.freshInfluence!==false,adaptAmount:s.adaptAmount===true,classes
 };
}
function v480Prefs(){return v480Clean(S.settings?.v480CategoryClasses);}
function v480Write(changed){
 const next=v480Clean(changed);
 S.settings=S.settings||{};
 S.settings.v480CategoryClasses=next;
 persistSettings();
 v480RefreshPanel();
 return next;
}
function v480ClassMembership(prefs){
 const lookup=new Map();
 for(const group of prefs.classes){
  if(!group.enabled)continue;
  for(const id of group.categoryIds)lookup.set(String(id),group);
 }
 return lookup;
}
function v480Groups(scored,prefs){
 const byCategory=v480ClassMembership(prefs),groups=new Map();
 for(const row of scored){
  const id=String(row?.cat?.id||'');
  if(!id||row.cat.enabled===false)continue;
  const group=byCategory.get(id);
  const key=group?'class:'+group.id:'single:'+id;
  let found=groups.get(key);
  if(!found){
   found={key,kind:group?'class':'single',group:group||null,
    members:group?new Set(group.categoryIds.map(String)):new Set([id]),
    rows:[],weight:group?group.weight:1};
   groups.set(key,found);
  }
  found.rows.push(row);
 }
 return [...groups.values()];
}
function v480ClassScore(g,prefs,allGroups){
 // The single-category virtual classes retain their preexisting scheduler
 // scores, so unassigned categories do not lose native recommendation weights.
 if(g.kind==='single')return {score:Math.max(.5,g.rows[0].score),reasons:[]};
 const now=Date.now(),sessions=schedulerConsumptionSessions();
 const windowDefs=[{days:3,w:.35,min:60},{days:7,w:.25,min:120},{days:30,w:.20,min:240},{days:null,w:.20,min:1}];
 const totalWeights=allGroups.reduce((sum,x)=>sum+x.weight,0)||1;
 const desired=Math.max(.01,g.weight/totalWeights);
 let weightedRatio=0,usedWeight=0;
 for(const win of windowDefs){
  const cut=win.days==null?0:now-win.days*86400000;
  const rows=win.days==null?sessions:sessions.filter(x=>Number(x.timestamp)>=cut);
  const total=rows.reduce((sum,x)=>sum+Math.max(0,Number(x.minutes)||0),0);
  if(total<win.min)continue;
  const mine=rows.reduce((sum,x)=>sum+(g.members.has(String(x.categoryId))
    ?Math.max(0,Number(x.minutes)||0):0),0);
  weightedRatio+=Math.min(6,mine/total/desired)*win.w;usedWeight+=win.w;
 }
 const ratio=usedWeight?weightedRatio/usedWeight:1;
 const relevant=sessions.filter(s=>g.members.has(String(s.categoryId)));
 const lastTime=relevant.reduce((t,x)=>Math.max(t,Number(x.timestamp)||0),0);
 const daysIdle=lastTime?Math.max(0,(now-lastTime)/86400000):Infinity;
 const st=S.settings||DEFAULT_SETTINGS;
 const factor={gentle:.5,balanced:1,strong:1.65}[prefs.strength]||1;
 const neglect=prefs.rewardNeglect
  ?(!lastTime?Math.max(0,Number(st.neglectCap)||0):
    Math.min(Math.max(0,Number(st.neglectCap)||0),daysIdle*Math.max(0,Number(st.neglectRate)||0)))
  :0;
 const seen=recentTaskWindow(6).filter(e=>[...g.members].some(id=>e.categoryIds.has(id))).length;
 let consecutive=0;
 for(const event of schedulerLogicalEvents()){
  if([...g.members].some(id=>event.categoryIds.has(id)))consecutive++;
  else break;
 }
 const repeat=prefs.avoidRepeat
  ?seen*(Number(st.repetitionPenalty)||0)+consecutive*(Number(st.consecutivePenalty)||0):0;
 const saturation=Math.min(70,Math.max(0,ratio-1)*(Number(st.saturationWeight)||0)*2.2);
 const balance=Math.min(28,Math.max(0,1-ratio)*(Number(st.neglectCap)||0)*.55);
 const fresh=prefs.freshInfluence&&g.rows.some(row=>row.cat.seasonal)
  ?(Number(st.seasonalBonus)||0)+(Number(st.seasonalFreshCount)||0)*4:0;
 const raw=g.weight*8+(neglect+balance+fresh-repeat-saturation)*factor;
 // Match scheduler's existing score floor and configurable jitter.
 const baseline=Math.max(1.5,raw);
 const randomness=Math.max(0,Math.min(1,Number(st.randomness)||0));
 const score=Math.max(.5,baseline*(1+(Math.random()*2-1)*randomness));
 const why=[];
 if(ratio>1.25)why.push('Class '+g.group.name+' is overrepresented in recent consumption');
 else if(ratio<.75)why.push('Class '+g.group.name+' is underrepresented in recent consumption');
 else if(!lastTime)why.push('Class '+g.group.name+' has not been consumed yet');
 if(seen&&prefs.avoidRepeat)why.push('Recent '+g.group.name+' sessions influence class rotation');
 return {score,reasons:why};
}
const v480WeightedPickBase=weightedPick;
weightedPick=function(scored){
 const prefs=v480Prefs();
 if(!prefs.enabled||!prefs.classes.length||!Array.isArray(scored)||!scored.length||
    !scored.every(x=>x&&x.cat&&Number.isFinite(x.score)))
  return v480WeightedPickBase.apply(this,arguments);
 const groups=v480Groups(scored,prefs);
 if(!groups.length)return null;
 const choices=groups.map(group=>{
  const info=v480ClassScore(group,prefs,groups);
  return {...group,...info};
 });
 const selected=v480WeightedPickBase(choices);
 if(!selected)return v480WeightedPickBase(scored);
 const picked=v480WeightedPickBase(selected.rows);
 if(!picked)return null;
 if(selected.kind!=='class')return picked;
 return {...picked,reasons:[
  ...selected.reasons.map(t=>({t,w:0})),...(picked.reasons||[])
 ].slice(0,3)};
};
// Optional class-size influence is bounded; the baseline amount logic and
// task amount reason remain unchanged when that option is disabled.
const v480AmountBase=suggestedAmount;
suggestedAmount=function(cat){
 const standard=v480AmountBase.apply(this,arguments);
 const prefs=v480Prefs();
 if(!prefs.enabled||!prefs.adaptAmount)return standard;
 const group=v480ClassMembership(prefs).get(String(cat?.id));
 if(!group)return standard;
 const members=new Set(group.categoryIds.map(String));
 const rows=schedulerConsumptionSessions();
 const total=rows.reduce((sum,x)=>sum+Math.max(0,Number(x.minutes)||0),0);
 if(total<=0)return standard;
 const spent=rows.reduce((sum,x)=>sum+(members.has(String(x.categoryId))?Math.max(0,Number(x.minutes)||0):0),0);
 const eligibleGroups=v480Groups(computeScores([]),prefs);
 const share=group.weight/(eligibleGroups.reduce((sum,x)=>sum+x.weight,0)||1);
 const ratio=share>0?(spent/total)/share:1;
 const adjust=ratio>=1.5?.8:ratio<=.6?1.15:1;
 if(adjust===1)return standard;
 const low=Math.max(1,Math.round(standard.low*adjust)),high=Math.max(low,Math.round(standard.high*adjust));
 return {...standard,low,high,multiplier:standard.multiplier*adjust,
  direction:adjust<1?'reduced':'increased'};
};
// Presentation — reuse the exact category edit picker markup and handlers.
// No forked emoji, URL, built-in artwork or color palettes.
function v480Icon(cat){
 return v144CategoryIconHtml(cat);
}
function v480ClassMinutes(group,days){
 const members=new Set(group.categoryIds.map(String));
 const cutoff=days?Date.now()-days*86400000:0;
 return schedulerConsumptionSessions().reduce((total,s)=>total+
  (members.has(String(s.categoryId))&&Number(s.timestamp)>=cutoff
   ?Math.max(0,Number(s.minutes)||0):0),0);
}
function v480PanelHtml(){
 const prefs=v480Prefs();
 const label=toggle=>toggle?'On':'Off';
 return '<div class="mf480-panel">'+
  '<div class="mf480-lead"><strong>Category Classes</strong><p>Optionally balance broader media groups before MediaFlow chooses a category and title. Existing recommendations stay untouched while disabled.</p></div>'+
  '<div class="mf480-setting mf480-settings-control"><div><b>Enable Category Classes</b><small>Off by default. Class → Category → Title when enabled.</small></div>'+
   '<button type="button" role="switch" aria-checked="'+prefs.enabled+'" class="toggle '+(prefs.enabled?'on':'')+
   '" onclick="App.v480SetSetting(\'enabled\','+!prefs.enabled+')" aria-label="Enable Category Classes"></button></div>'+
  '<div class="mf480-tunings" '+(!prefs.enabled?'data-mf480-inactive="true"':'')+'>'+
   '<label class="field mf480-settings-control"><span class="field-label">Class balancing strength</span><select onchange="App.v480SetSetting(\'strength\',this.value)" '+(!prefs.enabled?'disabled':'')+'>'+
    ['gentle','balanced','strong'].map(v=>'<option value="'+v+'" '+(prefs.strength===v?'selected':'')+'>'+({gentle:'Gentle',balanced:'Balanced (recommended)',strong:'Strong'}[v])+'</option>').join('')+'</select></label>'+
   [['avoidRepeat','Class repetition penalty','Avoid recommending the same class too frequently'],
    ['rewardNeglect','Class neglect bonus','Favor classes that have received less attention'],
    ['freshInfluence','Fresh episodes influence','Preserve seasonal importance when choosing a class'],
    ['adaptAmount','Adjust session amounts by class','Optionally reduce or increase suggested consumption amounts']].map(x=>
    '<label class="mf480-check mf480-settings-control"><input type="checkbox" '+(prefs[x[0]]?'checked':'')+' '+(!prefs.enabled?'disabled':'')+
    ' onchange="App.v480SetSetting(\''+x[0]+'\',this.checked)"><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></label>').join('')+
   '</div>'+
  '<div class="mf480-heading"><div><strong>Manage Classes</strong><small>'+prefs.classes.length+' saved · Your assignments remain when classes are turned off</small></div>'+
    '<button type="button" class="btn btn-sm btn-primary" onclick="App.v480OpenClassEditor()">+ New Class</button></div>'+
  (prefs.classes.length?'<div class="mf480-list">'+prefs.classes.map(g=>{
   const assigned=g.categoryIds.map(id=>(S.categories||[]).find(c=>String(c.id)===id)).filter(Boolean);
   return '<article class="mf480-class" data-mf480-id="'+escapeHtml(g.id)+'"><div class="mf480-class-header">'+
    '<span class="mf480-avatar" style="--mf480-accent:'+escapeHtml(g.color)+'">'+v480Icon(g)+'</span>'+
    '<div class="mf480-class-title"><b>'+escapeHtml(g.name)+'</b><small>Weight '+g.weight+' · '+label(g.enabled)+'</small></div>'+
    '<div class="mf480-class-actions"><button type="button" class="btn btn-sm btn-ghost" onclick="App.v480OpenClassEditor('+escapeHtml(JSON.stringify(g.id))+')">Edit</button>'+
    '<button type="button" class="btn btn-sm btn-ghost" onclick="App.v480DeleteClass('+escapeHtml(JSON.stringify(g.id))+',this)">Delete</button></div></div>'+
    '<div class="mf480-chips">'+(assigned.length?assigned.map(c=>'<span class="mf480-chip'+(c.enabled===false?' mf480-disabled':'')+'">'+v480Icon(c)+escapeHtml(c.name)+(c.enabled===false?' · Disabled':'')+'</span>').join(''):'<small>No categories assigned</small>')+'</div>'+
    '<div class="mf480-class-stats">Last 7 days: '+Math.round(v480ClassMinutes(g,7))+' min · Last 30 days: '+Math.round(v480ClassMinutes(g,30))+' min</div>'+
    '</article>';
  }).join('')+'</div>':'<p class="mf480-empty">No classes yet. Create an Anime, Television, Reading or other class and assign existing categories. Categories not in a class remain eligible.</p>')+
  '<p class="mf480-note">Each category belongs to at most one class. Disabled categories are never recommended. Past consumption remains available for balance statistics. No Library titles, History or XP data are rewritten.</p>'+
 '</div>';
}
function v480RefreshPanel(){
 const node=document.querySelector('.mf480-panel');
 if(node)node.outerHTML=v480PanelHtml();
}
function v480SetSetting(key,value){
 const fields=['enabled','strength','avoidRepeat','rewardNeglect','freshInfluence','adaptAmount'];
 if(!fields.includes(key))return;
 const pref=v480Prefs();
 pref[key]=value;
 v480Write(pref);
 showToast(key==='enabled'?(value?'Category Classes enabled':'Category Classes disabled; preferences retained'):'Category Classes setting saved');
}
function v480OpenClassEditor(id){
 if(!S.settings||!Array.isArray(S.categories)){showToast('Wait for your MediaFlow account to finish loading.');return;}
 const existing=v480Prefs().classes.find(c=>c.id===String(id))||null;
 const target=existing||{name:'',icon:'✨',iconUrl:'',color:'#A78BFA',weight:1,enabled:true,categoryIds:[]};
 // categoryModalHtml is the current v258/v144 Category editor, so extraction
 // retains the exact built-in/emoji/custom icon and color controls.
 const temp=document.createElement('div');
 temp.innerHTML=categoryModalHtml({...target,type:'video',unit:'episodes',target:1,minutesPerUnit:20,seasonal:false});
 const icon=temp.querySelector('#m-icon')?.closest('.field');
 const color=temp.querySelector('#m-color')?.closest('.field');
 if(!icon||!color){showToast('Category icon picker is unavailable');return;}
 const prefs=v480Prefs();
 const owners=new Map();
 prefs.classes.forEach(g=>g.categoryIds.forEach(cid=>owners.set(String(cid),g)));
 const categories=(S.categories||[]).map(cat=>{
  const owner=owners.get(String(cat.id));
  return '<label class="mf480-member"><input type="checkbox" data-mf480-member="'+escapeHtml(String(cat.id))+'" '+
   (target.categoryIds.includes(String(cat.id))?'checked':'')+'><span>'+v480Icon(cat)+escapeHtml(cat.name)+
   (cat.enabled===false?' <em>(Disabled)</em>':'')+
   (owner&&owner.id!==target.id?' <small>Currently in '+escapeHtml(owner.name)+' — selecting transfers it</small>':'')+
   '</span></label>';
 }).join('');
 const previous=document.getElementById('modal-root');
 if(previous)previous.remove();
 const root=document.createElement('div');root.id='modal-root';root.dataset.mf480Modal='1';
 root.innerHTML='<div class="modal-overlay" onclick="if(event.target===this) App.v480CloseClassEditor()"><div class="modal mf480-modal" id="mf480-modal" role="dialog" aria-modal="true" aria-label="'+(existing?'Edit':'Add')+' Category Class">'+
  '<div class="modal-title">'+(existing?'Edit':'Add')+' Category Class</div>'+
  '<label class="field"><span class="field-label">Class name</span><input id="mf480-name" type="text" maxlength="80" value="'+escapeHtml(target.name)+'" placeholder="Anime"></label>'+
  icon.outerHTML+color.outerHTML+
  '<div class="mf480-modal-row"><label class="field"><span class="field-label">Class weight (1–5)</span><input id="mf480-weight" type="number" min="1" max="5" step="1" value="'+target.weight+'"></label>'+
  '<label class="mf480-enabled"><input id="mf480-enabled" type="checkbox" '+(target.enabled!==false?'checked':'')+'> Class enabled</label></div>'+
  '<div class="field"><span class="field-label">Categories in this class</span><p class="hint">One primary class per category. Assignments are optional and changing them does not modify the categories.</p>'+
  '<div class="mf480-members">'+categories+'</div></div>'+
  '<div class="modal-actions"><button type="button" class="btn btn-ghost" onclick="App.v480CloseClassEditor()">Cancel</button>'+
  '<button type="button" class="btn btn-primary" onclick="App.v480SaveClass('+escapeHtml(JSON.stringify(existing?.id||''))+',this)">Save Class</button></div>'+
  '</div></div>';
 document.body.appendChild(root);
 root.querySelector('#mf480-name')?.focus();
}
function v480CloseClassEditor(){
 document.querySelector('#modal-root[data-mf480-modal="1"]')?.remove();
}
function v480SaveClass(id,button){
 if(button?.disabled)return;
 const modal=document.getElementById('mf480-modal');
 if(!modal)return;
 const name=String(modal.querySelector('#mf480-name')?.value||'').trim().slice(0,80);
 if(!name){showToast('Enter a class name');modal.querySelector('#mf480-name')?.focus();return;}
 const config=v480Prefs();
 const existing=config.classes.find(g=>g.id===String(id));
 const memberIds=[...modal.querySelectorAll('[data-mf480-member]:checked')].map(el=>String(el.dataset.mf480Member));
 const color=String(modal.querySelector('#m-color')?.value||'#A78BFA').toUpperCase();
 const url=v144SafeIconUrl(modal.querySelector('#m-icon-url')?.value||'');
 const icon=url?'🖼️':String(modal.querySelector('#m-icon')?.value||'✨');
 const item={
  id:existing?.id||uid(),name,icon,iconUrl:url,color,
  weight:Math.max(1,Math.min(5,Number(modal.querySelector('#mf480-weight')?.value)||1)),
  enabled:modal.querySelector('#mf480-enabled')?.checked!==false,categoryIds:memberIds
 };
 if(existing)config.classes=config.classes.map(g=>g.id===existing.id?item:g);
 else config.classes.push(item);
 // A category may belong to only one class. Reassigning removes its prior membership.
 for(const group of config.classes)if(group.id!==item.id)
  group.categoryIds=group.categoryIds.filter(cid=>!memberIds.includes(String(cid)));
 if(button)button.disabled=true;
 try{
  v480Write(config);v480CloseClassEditor();showToast('Category Class saved');
 }catch(e){if(button)button.disabled=false;showToast('Unable to save Category Class');console.error('v480 save',e);}
}
/* MediaFlow v534 — themed, accessible Category Class deletion confirmation.
   No class or category data is mutated until the destructive action is chosen. */
let V534_CLASS_DELETE_ORIGIN=null;
function v480CloseDeleteClass(){
 const root=document.querySelector('#modal-root[data-mf534-class-delete]');
 if(!root)return;
 root.remove();
 const origin=V534_CLASS_DELETE_ORIGIN;
 V534_CLASS_DELETE_ORIGIN=null;
 if(origin?.isConnected)origin.focus({preventScroll:true});
 else document.querySelector('.mf480-heading button,.mf480-panel button')?.focus?.({preventScroll:true});
}
function v480DeleteClass(id,trigger){
 const group=v480Prefs().classes.find(c=>c.id===String(id));
 if(!group||document.getElementById('modal-root'))return;
 V534_CLASS_DELETE_ORIGIN=trigger||document.activeElement;
 const assigned=group.categoryIds?.length||0;
 const root=document.createElement('div');
 root.id='modal-root';
 root.dataset.mf534ClassDelete=group.id;
 root.innerHTML=`<div class="modal-overlay mf534-delete-overlay"
     onclick="if(event.target===this)App.v480CloseDeleteClass()">
   <section class="modal mf534-delete-dialog" role="alertdialog" aria-modal="true"
      aria-labelledby="mf534-delete-title" aria-describedby="mf534-delete-description">
     <header class="mf534-delete-header">
       <span class="mf534-delete-icon" aria-hidden="true">
         <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16m-11 0V4h6v2m3 0-.7 13a2 2 0 0 1-2 2H8.7a2 2 0 0 1-2-2L6 6m4 4v7m4-7v7"/></svg>
       </span>
       <div class="mf534-delete-heading"><small>CATEGORY CLASSES</small>
         <h2 id="mf534-delete-title">Delete Category Class?</h2>
         <p id="mf534-delete-description">You're about to delete <strong>${escapeHtml(group.name)}</strong>.</p>
       </div>
       <button type="button" class="mf534-delete-dismiss" aria-label="Close confirmation"
         onclick="App.v480CloseDeleteClass()">×</button>
     </header>
     <div class="mf534-delete-content">
       <div class="mf534-delete-safe">
         <span aria-hidden="true">✓</span>
         <div><b>Your media data stays safe</b>
           <p>${assigned===0?'This class has no assigned categories.':
              `${assigned} assigned categor${assigned===1?'y':'ies'} will become unassigned.`}
             Your categories, Library, History, XP and progress will remain unchanged.</p>
         </div>
       </div>
       <p class="mf534-delete-warning">The class and its recommendation grouping will be removed. This action cannot be undone.</p>
     </div>
     <footer class="mf534-delete-actions">
       <button type="button" class="btn btn-ghost mf534-delete-cancel" onclick="App.v480CloseDeleteClass()">Cancel</button>
       <button type="button" class="btn btn-danger mf534-delete-confirm" onclick="App.v480ConfirmDeleteClass(this)">
         <span aria-hidden="true">×</span> Delete Category Class
       </button>
     </footer>
   </section>
 </div>`;
 root.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();App.v480CloseDeleteClass();return;}
   if(event.key!=='Tab')return;
   const buttons=[...root.querySelectorAll('button:not([disabled])')];
   if(!buttons.length)return;
   const first=buttons[0],last=buttons[buttons.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
 document.body.appendChild(root);
 root.querySelector('.mf534-delete-cancel')?.focus({preventScroll:true});
}
function v480ConfirmDeleteClass(button){
 const root=document.querySelector('#modal-root[data-mf534-class-delete]');
 if(!root||button?.disabled||!root.contains(button))return;
 const id=root.dataset.mf534ClassDelete;
 const prefs=v480Prefs();
 if(!prefs.classes.some(c=>c.id===id)){v480CloseDeleteClass();return;}
 if(button)button.disabled=true;
 try{
   prefs.classes=prefs.classes.filter(c=>c.id!==id);
   v480Write(prefs);
   v480CloseDeleteClass();
   showToast('Category Class deleted. Categories and History remain unchanged.');
 }catch(error){
   if(button)button.disabled=false;
   showToast('Unable to delete Category Class');
   console.error('v534 delete Category Class',error);
 }
}
function v480MountSettings(){
 if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
 if(document.querySelector('.mf480-panel'))return;
 const node=document.createElement('div');node.innerHTML=v480PanelHtml();
 const meta=window.MediaFlowSettingsRegistry;
 meta?.registerSetting?.({id:'v480-category-classes',section:'mf480-category-classes',selector:'.mf480-settings-control',
  label:'Enable Category Classes',subgroup:'Recommendations',
  keywords:['hierarchical','class','anime','television','consumption balance','recommendation','weight','fatigue']});
 window.MediaFlowSettingsCenter.mountSection({
  id:'mf480-category-classes',title:'Category Classes & Hierarchical Recommendations',
  category:'dashboard',subgroup:'Recommendations',
  keywords:['class','anime','television','groups','hierarchical','consumption','recommendations'],
  nodes:[node]
 });
}
Object.assign(App,{
 v480SetSetting,v480OpenClassEditor,v480CloseClassEditor,v480SaveClass,v480DeleteClass,
 v480CloseDeleteClass,v480ConfirmDeleteClass
});
MediaFlowRuntime.registerPageEnhancer('settings',v480MountSettings);
window.MediaFlowV480=Object.freeze({version:480,prefs:v480Prefs,preview:v480PanelHtml,openEditor:v480OpenClassEditor,closeEditor:v480CloseClassEditor,
 groups:()=>v480Groups(computeScores([]),v480Prefs()),score:v480ClassScore,
 stats:(id,days)=>{const p=v480Prefs().classes.find(c=>c.id===String(id));return p?v480ClassMinutes(p,days):0;},
 candidates:()=>v480Groups(computeScores([]),v480Prefs()).map(g=>({key:g.key,categories:g.rows.map(r=>r.cat.id)}))
});
MediaFlowRuntime.version=480;
