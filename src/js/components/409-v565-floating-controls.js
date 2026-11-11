/* MediaFlow v565 — Floating Controls settings.
 *
 * Task progress
 *   S.settings.mf565TaskFinish = 'minimum' (default) | 'maximum'
 *     Minimum: 100% at the bottom of the goal (9 of a 9–13 goal).
 *     Maximum: 100% at the top of the goal, as before (the marker shows the minimum).
 *   S.settings.mf565TaskOver = 'count' (default) | 'warning' | 'status'
 *     count:   the percentage keeps counting past 100%, in the warning colour
 *              once the goal's maximum is passed.
 *     warning: stays at 100%, warning colour past the maximum.
 *     status:  stays at 100%; only the status text says Overwatched/Overread.
 *
 * Background Processes (S.settings.mf565Processes)
 *   position: 'remember' (default) | 'default'   where it reopens
 *   edges:    'stay' (default) | 'snap'          after a drag
 *   icon:     'both' (default) | 'ring' | 'count' | 'plain'   minimised icon
 *   idle:     'hide' (default) | 'show'          minimised icon with no jobs
 * The position itself stays on this device (as in v555); the choices are
 * account settings, shared with the MediaFlow app.
 */
const MF565_TASK_FINISH=['minimum','maximum'];
const MF565_TASK_OVER=['count','warning','status'];
const MF565_PROC_DEFAULTS=Object.freeze({position:'remember',edges:'stay',icon:'both',idle:'hide'});
const MF565_PROC_CHOICES=Object.freeze({position:['remember','default'],edges:['stay','snap'],icon:['both','ring','count','plain'],idle:['hide','show']});

function mf565TaskFinish(){const v=S.settings?.mf565TaskFinish;return MF565_TASK_FINISH.includes(v)?v:'minimum';}
function mf565TaskOver(){const v=S.settings?.mf565TaskOver;return MF565_TASK_OVER.includes(v)?v:'count';}
function mf565Proc(){
  const raw=S.settings?.mf565Processes||{},out={};
  for(const k of Object.keys(MF565_PROC_DEFAULTS))out[k]=MF565_PROC_CHOICES[k].includes(raw[k])?raw[k]:MF565_PROC_DEFAULTS[k];
  return out;
}

/* ---------- task progress ---------- */
// Pure: the numbers the card shows for an amount and a goal.
function mf565TaskNumbers(amount,low,high,finish=mf565TaskFinish(),over=mf565TaskOver()){
  const end=finish==='maximum'?high:low;
  let pct=end>0?amount/end*100:0;
  if(over!=='count')pct=Math.min(100,pct);
  pct=Math.max(0,pct);
  const warn=over!=='status'&&amount>high;
  // Maximum keeps v397's denominator (it grows from the minimum to the maximum).
  const denominator=finish==='maximum'?(high===low?low:amount<=low?low:Math.min(amount,high)):low;
  return {pct,warn,denominator,end,marker:finish==='maximum'&&high>low?low/high*100:null};
}
const mf565ReadStateBase=mf397ReadState;
mf397ReadState=function(){
  const data=mf565ReadStateBase.apply(this,arguments);
  if(!data)return data;
  const n=mf565TaskNumbers(data.amount,data.low,data.high);
  return Object.assign(data,{pct:n.pct,denominator:n.denominator,mf565:n});
};
const mf565DockUpdateBase=mf397Update;
mf397Update=function(){
  const result=mf565DockUpdateBase.apply(this,arguments);
  try{
    const node=document.getElementById('mf397-progress'),data=mf397ReadState();
    if(node&&data&&data.mf565){
      const n=data.mf565;
      node.classList.toggle('over',n.warn);
      node.classList.toggle('mf565-warn',n.warn);
      const fill=document.getElementById('mf397-fill');
      if(fill)fill.style.width=Math.min(100,n.pct).toFixed(3)+'%';
      const marker=document.getElementById('mf397-marker');
      if(marker)marker.style.cssText=n.marker==null?'display:none':`--marker:${n.marker.toFixed(2)}%`;
      const mini=document.getElementById('mf397-mini-percent');
      if(mini)mini.textContent=Math.round(n.pct)+'%';
    }
  }catch(_){}
  return result;
};

/* ---------- Background Processes ---------- */
// Where it reopens: "default spot" keeps the position for this visit only.
const mf565ProcSaveBase=mf555ProcSave;
mf555ProcSave=function(){
  const p=MF555UI.proc,prefs=mf565Proc();
  if(prefs.edges==='snap'&&p.x!=null&&p.y!=null&&!p.minimized){
    const w=document.getElementById('mf441-process-widget');
    if(w){
      const r=w.getBoundingClientRect(),m=8;
      const left=p.x+r.width/2<innerWidth/2;
      p.x=Math.round(left?m:Math.max(m,innerWidth-r.width-m));
      mf555ProcPlace();
    }
  }
  if(prefs.position==='default'){
    try{localStorage.setItem(MF555_PROC_KEY,JSON.stringify({minimized:!!p.minimized,x:null,y:null}));}catch(_){}
    return;
  }
  return mf565ProcSaveBase.apply(this,arguments);
};
if(mf565Proc().position==='default'){MF555UI.proc.x=null;MF555UI.proc.y=null;}

function mf565RingSvg(pct){
  const r=24,c=2*Math.PI*r,off=c*(1-Math.max(0,Math.min(100,pct))/100);
  return '<svg class="mf565-ring" viewBox="0 0 56 56" aria-hidden="true"><circle class="mf565-ring-track" cx="28" cy="28" r="'+r+'"/>'+
    '<circle class="mf565-ring-fill" cx="28" cy="28" r="'+r+'" stroke-dasharray="'+c.toFixed(2)+'" stroke-dashoffset="'+off.toFixed(2)+'"/></svg>';
}
const mf565ProcMiniBase=mf555ProcMini;
mf555ProcMini=function(state){
  const result=mf565ProcMiniBase.apply(this,arguments);
  const mini=document.getElementById('mf555-proc-mini');
  if(!mini)return result;
  const prefs=mf565Proc(),active=Number(state?.activeCount)||0;
  // "Show Background Processes" (always) wins over hiding when idle.
  let always=false;try{always=mf441Prefs()?.visibility==='always';}catch(_){}
  if(prefs.idle==='hide'&&!always&&!active&&!mini.classList.contains('is-done')){
    mini.remove();document.body.classList.remove('mf555-proc-minimized');return result;
  }
  const cover=Number(state?.coverPct)||0,meta=Number(state?.metaPct)||0;
  const jobs=[state?.cover?cover:null,state?.metadata?meta:null].filter(v=>v!=null);
  const pct=jobs.length?Math.round(jobs.reduce((a,b)=>a+b,0)/jobs.length):0;
  mini.dataset.mf565Icon=prefs.icon;
  const icon=mini.querySelector('.mf555-proc-icon');
  if(icon){
    icon.querySelector('.mf565-ring')?.remove();icon.querySelector('.mf565-badge')?.remove();
    if((prefs.icon==='both'||prefs.icon==='ring')&&jobs.length)icon.insertAdjacentHTML('afterbegin',mf565RingSvg(pct));
    if((prefs.icon==='both'||prefs.icon==='count')&&active)icon.insertAdjacentHTML('beforeend','<span class="mf565-badge">'+active+'</span>');
  }
  return result;
};

/* ---------- settings ---------- */
function mf565Select(id,value,options,onchange){
  return '<select id="'+id+'" onchange="'+onchange+'">'+options.map(([v,l])=>'<option value="'+v+'"'+(v===value?' selected':'')+'>'+escapeHtml(l)+'</option>').join('')+'</select>';
}
function mf565FieldRow(key,title,hint,control){
  return '<div class="mf405-floating-row settings-toggle-row mf565-row" data-mf565-setting="'+key+'"><div class="mf405-floating-copy"><label for="mf565-'+key+'">'+escapeHtml(title)+'</label><p class="hint">'+escapeHtml(hint)+'</p></div>'+control+'</div>';
}
function mf565FloatingRowsHtml(){
  const p=mf565Proc();
  return '<div class="mf405-floating-divider"></div><div class="mf405-group-kicker">TASK PROGRESS</div>'+
    mf565FieldRow('task-finish','Task progress finishes at','Where the card reaches 100% for a goal like 9–13.',
      mf565Select('mf565-task-finish',mf565TaskFinish(),[['minimum','Minimum (9 of 9–13)'],['maximum','Maximum (13 of 9–13)']],"App.mf565SetSetting('mf565TaskFinish',this.value)"))+
    mf565FieldRow('task-over','When you go over the maximum','How the card shows consuming more than the goal.',
      mf565Select('mf565-task-over',mf565TaskOver(),[['count','Count past 100%'],['warning','Warning colour'],['status','Status only']],"App.mf565SetSetting('mf565TaskOver',this.value)"))+
    '<div class="mf405-floating-divider"></div><div class="mf405-group-kicker">BACKGROUND PROCESSES</div>'+
    mf565FieldRow('proc-position','When it reopens','Where Background Processes appears after a reload.',
      mf565Select('mf565-proc-position',p.position,[['remember','Where I left it'],['default','Always at the default spot']],"App.mf565SetProc('position',this.value)"))+
    mf565FieldRow('proc-edges','After moving it','Keep it where you drop it, or snap it to the nearest side.',
      mf565Select('mf565-proc-edges',p.edges,[['stay','Stay where dropped'],['snap','Snap to nearest edge']],"App.mf565SetProc('edges',this.value)"))+
    mf565FieldRow('proc-icon','Minimised icon','What the small icon next to the + shows.',
      mf565Select('mf565-proc-icon',p.icon,[['both','Progress ring and count'],['ring','Progress ring'],['count','Count of running jobs'],['plain','Plain icon']],"App.mf565SetProc('icon',this.value)"))+
    mf565FieldRow('proc-idle','When nothing is running','Hide the minimised icon, or keep it next to the +.',
      mf565Select('mf565-proc-idle',p.idle,[['hide','Hide it'],['show','Always show it']],"App.mf565SetProc('idle',this.value)"));
}
const mf565FloatingSettingsBase=v405FloatingSettingsHtml;
v405FloatingSettingsHtml=function(){
  const html=mf565FloatingSettingsBase.apply(this,arguments);
  const at=html.lastIndexOf('</div>');
  return at<0?html:html.slice(0,at)+mf565FloatingRowsHtml()+html.slice(at);
};
for(const [id,label,sub] of [['task-finish','Task progress finishes at','Progress Widgets'],['task-over','When you go over the maximum','Progress Widgets'],
  ['proc-position','Background Processes: when it reopens','Background Processes'],['proc-edges','Background Processes: after moving it','Background Processes'],
  ['proc-icon','Background Processes: minimised icon','Background Processes'],['proc-idle','Background Processes: when nothing is running','Background Processes']]){
  v366RegisterSetting({id:'mf565-'+id,section:'v221-settings-floating-controls',selector:'[data-mf565-setting="'+id+'"]',label,subgroup:sub,
    keywords:['task progress','goal','minimum','maximum','overconsumed','overwatched','background processes','minimise','drag','snap','ring','badge']});
}
function mf565Persist(){
  try{const saved=persistSettings();if(saved&&typeof saved.catch==='function')saved.catch(e=>console.error('MediaFlow v565: setting not saved',e));}
  catch(e){console.error('MediaFlow v565: setting not saved',e);if(typeof showSaveError==='function')showSaveError();}
}
function mf565SetSetting(key,value){
  const allowed=key==='mf565TaskFinish'?MF565_TASK_FINISH:key==='mf565TaskOver'?MF565_TASK_OVER:null;
  if(!allowed||!allowed.includes(value))return;
  S.settings=S.settings||{};S.settings[key]=value;
  MF397.previousKey='';mf397Schedule();mf565Persist();
}
function mf565SetProc(key,value){
  if(!MF565_PROC_CHOICES[key]?.includes(value))return;
  S.settings=S.settings||{};
  S.settings.mf565Processes=Object.assign({},mf565Proc(),{[key]:value});
  if(key==='position'&&value==='default'){MF555UI.proc.x=null;MF555UI.proc.y=null;}
  mf555ProcSave();
  try{mf441Paint();}catch(_){}
  mf565Persist();
}
Object.assign(App,{mf565SetSetting,mf565SetProc});
window.MediaFlowV565=Object.assign(window.MediaFlowV565||{},{taskNumbers:mf565TaskNumbers,processPrefs:mf565Proc});
