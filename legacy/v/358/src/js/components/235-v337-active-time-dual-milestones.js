/* MediaFlow v337 — Keep the v336 Active Time Spent design, remove the
   unrelated Bonus XP earned panel, and display separate time and time-XP
   milestone progress. Existing XP rewards and cloud records are untouched. */
const V337_XP_MILESTONES=[100,250,500,1000,2500,5000,10000,25000,50000,100000,250000,500000,1000000];
const V337_TIME_MILESTONES=[1,5,10,25,50,100,250,500,1000,2500,5000,10000,25000,50000,100000].map(h=>h*3600000);
function v337NextMilestone(value,targets){
  const current=Math.max(0,Number(value)||0);
  let next=targets.find(n=>current<n);
  if(!next){
    next=targets[targets.length-1];
    // Continue to offer meaningful milestones even beyond the preset ladder.
    while(next<=current&&next<Number.MAX_SAFE_INTEGER/2)next*=2;
  }
  // v339: after passing the last preset, use the previous generated milestone
  // rather than anchoring every future interval to the final preset.
  const previous=next===targets[0]?0:(next>targets[targets.length-1]?next/2:(targets.filter(n=>n<next).pop()||0));
  const currentSegment=Math.max(0,current-previous),length=Math.max(1,next-previous);
  return {current,next,previous,currentSegment,length,percent:Math.max(0,Math.min(100,100*currentSegment/length))};
}
function v337MilestoneProgressHtml(){
  const progress=v337NextMilestone(v334Totals().timeXP,V337_XP_MILESTONES);
  const fmt=value=>Math.round(value).toLocaleString();
  return `<div class="v336-progress-wrap v337-xp-milestone" data-v337-xp-milestone aria-label="Time XP milestone progress">
    <div class="v336-progress-head"><div><span class="v336-progress-kicker">NEXT TIME XP MILESTONE</span><strong data-v337-xp-next>${fmt(progress.next)} XP</strong></div><b data-v337-xp-portion>${fmt(progress.currentSegment)} / ${fmt(progress.length)} XP</b></div>
    <div class="v336-progress-track" role="progressbar" aria-label="Progress toward next time XP milestone" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress.percent)}" data-v337-xp-progress><span style="width:${progress.percent}%"></span></div>
    <div class="v336-progress-foot"><span data-v337-xp-previous>${fmt(progress.previous)} XP milestone reached</span><span data-v337-xp-percent>${progress.percent.toFixed(0)}%</span></div>
  </div>`;
}
const v337ActiveTimeCardBase=v335ActiveTimeCard;
v335ActiveTimeCard=function(){
  const html=v337ActiveTimeCardBase.apply(this,arguments);
  const wrapper=document.createElement('div');wrapper.innerHTML=html;
  const card=wrapper.querySelector('.v336-active-card');
  if(!card)return html;
  card.classList.add('v337-active-card');
  // Hide only the Bonus XP earned presentation. Do not delete or alter the XP ledger.
  card.querySelector('.v335-active-bonuses')?.remove();
  const timeProgress=card.querySelector('.v336-progress-wrap');
  if(timeProgress){
    timeProgress.classList.add('v337-time-milestone');
    timeProgress.setAttribute('data-v337-time-milestone','');
    const pair=document.createElement('div');pair.className='v337-milestone-grid';
    timeProgress.parentNode.insertBefore(pair,timeProgress);
    pair.appendChild(timeProgress);
    pair.insertAdjacentHTML('beforeend',v337MilestoneProgressHtml());
  }
  const week=card.querySelector('.v335-active-week');
  if(week)week.classList.add('v337-active-week');
  return wrapper.innerHTML;
};

function v337RefreshMilestones(){
  const root=document.querySelector('.v337-active-card');
  if(!root)return;
  const total=v334Totals();
  const t=v337NextMilestone(total.activeMs,V337_TIME_MILESTONES);
  const x=v337NextMilestone(total.timeXP,V337_XP_MILESTONES);
  const time=root.querySelector('[data-v337-time-milestone]');
  const xp=root.querySelector('[data-v337-xp-milestone]');
  if(time){
    const title=time.querySelector('.v336-progress-head strong');
    const portion=time.querySelector('.v336-progress-head b');
    const progress=time.querySelector('.v336-progress-track');
    const footer=time.querySelectorAll('.v336-progress-foot span');
    if(title)title.textContent=v334Duration(t.next);
    if(portion)portion.textContent=`${v334Duration(t.currentSegment)} / ${v334Duration(t.length)}`;
    if(progress){progress.querySelector('span').style.width=`${t.percent}%`;progress.setAttribute('aria-valuenow',Math.round(t.percent));}
    if(footer[0])footer[0].textContent=`${v334Duration(t.previous)} completed`;
    if(footer[1])footer[1].textContent=`${t.percent.toFixed(0)}%`;
  }
  if(xp){
    const fmt=n=>Math.round(n).toLocaleString();
    const title=xp.querySelector('[data-v337-xp-next]');
    const portion=xp.querySelector('[data-v337-xp-portion]');
    const progress=xp.querySelector('[data-v337-xp-progress]');
    const prev=xp.querySelector('[data-v337-xp-previous]');
    const pct=xp.querySelector('[data-v337-xp-percent]');
    if(title)title.textContent=`${fmt(x.next)} XP`;
    if(portion)portion.textContent=`${fmt(x.currentSegment)} / ${fmt(x.length)} XP`;
    if(progress){progress.querySelector('span').style.width=`${x.percent}%`;progress.setAttribute('aria-valuenow',Math.round(x.percent));}
    if(prev)prev.textContent=`${fmt(x.previous)} XP milestone reached`;
    if(pct)pct.textContent=`${x.percent.toFixed(0)}%`;
  }
}
// v334 already ticks every 15 seconds and updates the lifetime/XP counters.
// Refresh the milestone bars in the same tick without forcing a page rerender.
const v337EarnTimeBase=v334EarnTime;
v334EarnTime=function(){
  const result=v337EarnTimeBase.apply(this,arguments);
  v337RefreshMilestones();
  return result;
};
