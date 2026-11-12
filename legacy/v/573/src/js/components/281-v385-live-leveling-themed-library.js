/* MediaFlow v385 — live XP presentation and data-backed cloud-write feedback.
 * Read the existing XP cache; NEVER modify XP, History, level formulas, or cloud schema.
 * DOM patches are intentionally limited to the Sidebar and the visible Statistics
 * leveling card, so large Libraries are not rerendered on each logged action.
 */
const V385_RELEASE=385;
let V385_XP_TIMER=0;
let V385_RENDERING=false;
let V385_SAVE_REVISION=0;
let V385_CLOUD_STATE='unknown';
let V385_DISPLAY_HASH='';
let V385_LAST_STATS_NODE=null, V385_LAST_SIDEBAR_BLOCK=null;
const v385FmtXP=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString();
function v385SetText(root,selector,value){
  const node=root?.querySelector(selector);
  if(node&&node.textContent!==String(value))node.textContent=String(value);
}
function v385CloudMessage(){
  switch(V385_CLOUD_STATE){
    case 'saving':return ['Sync pending','pending'];
    case 'saved':return ['Saved to cloud storage','saved'];
    case 'failed':return ['Cloud save failed','failed'];
    default:return ['Cloud status not verified','unknown'];
  }
}
function v385UpdateCloudLabel(){
  const footer=document.querySelector('.sidebar-foot');
  if(!footer)return;
  let label=footer.querySelector('.mf385-cloud-state');
  if(!label){
    const current=Array.from(footer.querySelectorAll('div')).find(el=>el.children.length===0&&String(el.textContent||'').includes('Saved to cloud storage'));
    if(current){current.classList.add('mf385-cloud-state');label=current;}
    else {label=document.createElement('div');label.className='mf385-cloud-state';footer.appendChild(label);}
  }
  const [message,state]=v385CloudMessage();
  label.dataset.syncState=state;
  if(label.textContent!==message)label.textContent=message;
}
function v385ProgressValues(){
  const l=mediaFlowLevelInfo(); // Uses the v150 live XP cache; no library rescan when clean.
  const metrics=typeof v150EnsureLiveXPCache==='function'?v150EnsureLiveXPCache():null;
  const streak=computeDayStreak();
  return {l,streak,multiplier:v149StreakMultiplier(streak),consumption:metrics?metrics.historyXP:null,library:libraryXPTotal()};
}
function v385RefreshXPViews(force=false){
  if(V385_RENDERING || !AUTH_READY || !S || S.loading)return;
  const sidebar=document.querySelector('.sidebar-foot');
  const stats=S.view==='stats'?document.querySelector('.stats-level-card'):null;
  if(!sidebar&&!stats)return;
  V385_RENDERING=true;
  try{
    const {l,streak,multiplier,consumption,library}=v385ProgressValues();
    const hash=[l.xp,l.level,l.current,l.needed,l.pct,streak,multiplier,consumption,library].join('|');
    const currentBlock=sidebar?.querySelector('.level-block')||null;
    if(force||hash!==V385_DISPLAY_HASH||stats!==V385_LAST_STATS_NODE||currentBlock!==V385_LAST_SIDEBAR_BLOCK){
      const block=sidebar?.querySelector('.level-block');
      if(block){
        v385SetText(block,'.level-num',`Lv. ${l.level}`);
        const xpLine=block.querySelector('.xp-line');
        if(xpLine){const spans=xpLine.querySelectorAll('span');
          if(spans[0]&&spans[0].textContent!==`${v385FmtXP(l.xp)} XP total`)spans[0].textContent=`${v385FmtXP(l.xp)} XP total`;
          if(spans[1])spans[1].textContent=`${v385FmtXP(l.current)} / ${v385FmtXP(l.needed)}`;
        }
        const fill=block.querySelector('.xp-fill');if(fill)fill.style.width=`${l.pct}%`;
        v385SetText(block,'.level-next',`${v385FmtXP(l.needed-l.current)} XP to Level ${l.level+1}`);
      }
      if(sidebar){
        const marker=Array.from(sidebar.querySelectorAll('.k')).find(el=>el.textContent.trim().toLowerCase()==='day streak');
        const streakEl=marker?.nextElementSibling;
        if(streakEl){
          const multiplierEl=streakEl.querySelector('.v149-sidebar-streak-xp');
          // Replace only the text node; preserve the themed multiplier element.
          const text=Array.from(streakEl.childNodes).find(n=>n.nodeType===Node.TEXT_NODE);
          if(text)text.textContent=`${streak} 🔥 `;
          if(multiplierEl)multiplierEl.textContent=`×${Number(multiplier).toFixed(2)} XP`;
        }
      }
      if(stats){
        const display=stats.querySelector('[style*="font-family:var(--font-display)"]');
        if(display)display.textContent=`Level ${l.level}`;
        const heading=stats.querySelector('.section-label');
        const statsHint=heading?.nextElementSibling?.querySelector('.hint');
        if(statsHint)statsHint.textContent=`${v385FmtXP(l.xp)} lifetime XP`;
        const fill=stats.querySelector('.stats-level-fill');if(fill)fill.style.width=`${l.pct}%`;
        const metas=stats.querySelectorAll('.stats-level-meta span');
        if(metas[0])metas[0].textContent=`${v385FmtXP(l.current)} / ${v385FmtXP(l.needed)} XP`;
        if(metas[1])metas[1].textContent=`${l.pct}%`;
        const captions=stats.querySelectorAll('.stats-level-caption span');
        if(captions[0])captions[0].textContent=`Progress toward Level ${l.level+1}`;
        if(captions[1])captions[1].textContent=`${v385FmtXP(l.needed-l.current)} XP remaining`;
        const amounts=stats.querySelectorAll('.record-list .record-row .v');
        if(amounts[0]&&consumption!==null)amounts[0].textContent=v385FmtXP(consumption);
        if(amounts[1])amounts[1].textContent=v385FmtXP(library);
      }
      V385_DISPLAY_HASH=hash;
      V385_LAST_STATS_NODE=stats;V385_LAST_SIDEBAR_BLOCK=currentBlock;
    }
    v385UpdateCloudLabel();
  }catch(err){console.warn('MediaFlow v385 leveling UI refresh:',err);}
  finally{V385_RENDERING=false;}
}
function v385ScheduleXP(){
  if(V385_XP_TIMER)return;
  V385_XP_TIMER=setTimeout(()=>{V385_XP_TIMER=0;v385RefreshXPViews();},75);
}
// Most mutations and data imports invalidate XP through this existing hook.
const v385DirtyXPBase=v149MarkStreakDirty;
v149MarkStreakDirty=function(){
  const out=v385DirtyXPBase.apply(this,arguments);
  v385ScheduleXP();return out;
};
// Render can rebuild the visible statistics card; refresh both panels AFTER
// that render without replacing any page or interfering with scroll/focus.
const v385RenderBase=render;
render=function(){const out=v385RenderBase.apply(this,arguments);v385ScheduleXP();return out;};
const v385LoadAllBase=loadAll;
loadAll=async function(){const out=await v385LoadAllBase.apply(this,arguments);V385_DISPLAY_HASH='';v385ScheduleXP();return out;};
// Expose cloud status only after the real save pipeline resolves. The existing
// saveState catches failures internally, hence lastSaveFailed is inspected.
const v385SaveBase=saveState;
saveState=function(){
  const guarded=!!V115_STARTUP_GUARD;
  const revision=++V385_SAVE_REVISION;
  if(!guarded)V385_CLOUD_STATE='saving';
  v385ScheduleXP();v385UpdateCloudLabel();
  const result=v385SaveBase.apply(this,arguments);
  Promise.resolve(result).then(ok=>{
    if(revision===V385_SAVE_REVISION)V385_CLOUD_STATE=guarded?'unknown':(ok===false||lastSaveFailed?'failed':'saved');
  },()=>{if(revision===V385_SAVE_REVISION)V385_CLOUD_STATE='failed';}).finally(()=>{v385ScheduleXP();v385UpdateCloudLabel();});
  return result;
};
// The sidebar on first entry may be created by renderShell, not render().
const v385RenderShellBase=renderShell;
renderShell=function(){const out=v385RenderShellBase.apply(this,arguments);V385_DISPLAY_HASH='';v385ScheduleXP();v385UpdateCloudLabel();return out;};
// Explicit hook available to new modules when updating the XP ledger in place.
App.v385RefreshLeveling=v385ScheduleXP;
App.v385CloudSaveStatus=()=>V385_CLOUD_STATE;
window.MediaFlowV385={version:V385_RELEASE,features:['Theme-colored full Logging Library','About logo alignment','Live sidebar and Statistics XP','Verified cloud save status']};
MediaFlowRuntime.version=V385_RELEASE;
