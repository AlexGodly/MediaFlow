/* MediaFlow v372 — Logging 3.0 visual system, Quick title badge parity,
 * single semantic Settings accordion icon, and immediate Collection batch delete.
 * Existing unit, XP, cloud, and Library save pipelines remain authoritative.
 */
const V372_RELEASE=372;

// Canonical title badges: v371's v370TitleMeta is shared by Per unit and Quick.
// Removing the legacy text duplicates prevents showing status/category/priority
// twice and retains independent progress/season/repeat information.
const v372RenderLogBase=renderLogForm;
renderLogForm=function(){
  const raw=String(v372RenderLogBase.apply(this,arguments)||'');
  if(!S.logDraft)return raw;
  try{
    const host=document.createElement('div');host.innerHTML=raw;
    const form=host.querySelector('.log-form');if(!form)return raw;
    form.classList.add('mf372-logging');
    const perUnit=S.logDraft.v369Interface==='itemized';
    form.dataset.mf372Mode=perUnit?'itemized':'quick';
    if(!perUnit){
      form.querySelectorAll('.v239-logged-title-card').forEach((card,index)=>{
        const entry=S.logDraft.entries?.[index];
        const title=entry? v369ItemTitle(entry):null;
        if(!title)return;
        const copy=card.querySelector('.v239-logged-title-copy');if(!copy)return;
        // Replace v371 status-only badge; keep the single original title name.
        copy.querySelectorAll('.v371-quick-status,.v370-title-tags').forEach(el=>el.remove());
        const small=copy.querySelector('small');
        if(small){
          const cat=getCategory(title.categoryId),status=String(title.status||'planned');
          const label=typeof v274StatusLabel==='function'?v274StatusLabel(status):status;
          const pri=String(title.priority||'medium').toLowerCase();
          const oldValues=new Set([String(cat?.name||'').toLowerCase(),String(label).toLowerCase(),status.toLowerCase(),`${pri} priority`]);
          const extra=String(small.textContent||'').split(/\s*·\s*/).filter(t=>t.trim()&&!oldValues.has(t.trim().toLowerCase()));
          small.textContent=extra.join(' · ');
          small.hidden=!extra.length;
        }
        const badgeBox=document.createElement('div');
        badgeBox.className='mf372-quick-meta';
        badgeBox.innerHTML=v370TitleMeta(title);
        copy.insertBefore(badgeBox,small||null);
      });
    }
    // Header and session intelligence are computed from the current unsaved
    // local draft, without reimplementing any canonical XP calculation.
    const entries=S.logDraft.entries||[];
    const amount=perUnit?entries.reduce((n,e)=>n+(Array.isArray(e.v369Units)?e.v369Units.length:0),0)
      :Math.max(0,Number(S.logDraft.amount)||entries.reduce((n,e)=>n+Math.max(0,Number(e.qty)||0),0));
    const seconds=perUnit?(typeof v369TotalSeconds==='function'?v369TotalSeconds():0):Math.max(0,Number(S.logDraft.minutes)||0)*60;
    const duration=typeof v369Hms==='function'?v369Hms(seconds):String(Math.round(seconds/60))+' min';
    const kicker=perUnit?'PRECISION LOGGING':'EXPRESS LOGGING';
    const description=perUnit?'Every chapter, episode and minute — recorded your way.':'Capture your progress in seconds, without losing the details.';
    const banner=document.createElement('section');banner.className='mf372-session-hero';
    banner.setAttribute('aria-label','Logging session overview');
    banner.innerHTML='<div class="mf372-hero-top"><div class="mf372-hero-copy"><span class="mf372-eyebrow">'+kicker+'</span><h2>Make every moment count.</h2><p>'+description+'</p></div><div class="mf372-hero-mark" aria-hidden="true">'+v370Icon(perUnit?'list':'quick',30)+'</div></div>'+
      '<div class="mf372-hero-stats"><div class="mf372-hero-stat"><span class="mf372-stat-symbol" aria-hidden="true">'+v370Icon('list',17)+'</span><div><strong>'+amount.toLocaleString()+'</strong><small>Units in draft</small></div></div>'+
      '<div class="mf372-hero-stat"><span class="mf372-stat-symbol" aria-hidden="true">'+v370Icon('clock',17)+'</span><div><strong>'+duration+'</strong><small>Time tracked</small></div></div>'+
      '<div class="mf372-hero-stat"><span class="mf372-stat-symbol" aria-hidden="true">'+v370Icon('add',17)+'</span><div><strong>'+entries.length.toLocaleString()+'</strong><small>Selected titles</small></div></div></div>';
    const mode=form.querySelector('.v369-interface');
    if(mode)mode.insertAdjacentElement('beforebegin',banner);else form.prepend(banner);
    // Consolidate visual landmarks for the existing controls, without moving
    // actual editor inputs out of their forms or changing event handlers.
    const panels=form.querySelector('.v370-panels');
    if(panels)panels.setAttribute('aria-label','Your selected titles');
    const actions=form.querySelector('.v370-logging-actions');
    if(actions)actions.classList.add('mf372-draft-actions');
    return host.innerHTML;
  }catch(err){console.warn('v372 logging visual fallback',err);return raw;}
};

// Exactly ONE meaningful icon on each Settings Center accordion header.
// No decorative chevron; expanded state is shown through clear background,
// border and aria-expanded. Favorites remain accessible as a text Pin button.
const V372_SECTION_ICONS={
  'library-mode':'library','dynamic-settings':'layers','categories':'tags',
  'choice-and-filter-layout':'filter','default-logging-method':'list',
  'cover-size-adjustment':'image','library-integrity':'shield',
  'category-icons':'palette','missing-title-covers':'image',
  'library-overview':'library','library-maintenance':'wrench',
  'category-maintenance':'tags','cover-maintenance':'image',
  'navigation':'compass','dashboard-settings':'dashboard',
  'statistics-settings':'chart','themes-and-customization':'palette',
  'daily-goal':'target','title-recommendations':'star',
  'mediaflow-system':'settings','scheduler-tuning':'clock',
  'leveling-and-xp':'trophy','import-export-media-services':'transfer',
  'automatic-backups':'archive','cloud-sync':'cloud',
  'settings-preset':'sliders','data':'database','app-updates':'refresh'
};
const V372_SECTION_PATHS={
  layers:'<path d="M12 2 2 7l10 5 10-5-10-5ZM2 12l10 5 10-5M2 17l10 5 10-5"/>',
  tags:'<path d="M20.5 13.5 13 21l-11-11V3h7l11.5 10.5Z"/><circle cx="6.5" cy="6.5" r="1"/>',
  filter:'<path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z"/>',
  list:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7 9 1 1 2-2M12 9h5m-10 5 1 1 2-2m2 1h5"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.7"/><path d="m4 18 5-6 4 4 3-3 4 5"/>',
  shield:'<path d="M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
  wrench:'<path d="M14.7 6.2a5 5 0 0 0-6.5 6.5L3 18l3 3 5.3-5.2a5 5 0 0 0 6.5-6.5L14 12l-2-2 2.7-3.8Z"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.5 4.5-4.5 2.5 2.5-4.5 4.5-2.5Z"/>',
  chart:'<path d="M4 20V5m0 15h17"/><path d="m7 15 4-4 3 2 6-7"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  star:'<path d="m12 2 3 6 7 .9-5 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-4.9 7-.9Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v4c0 3 3 4 5 4m9-8h4v4c0 3-3 4-5 4M12 15v4m-4 2h8"/>',
  transfer:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
  archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9M10 14h4"/>',
  database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/>',
  sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 11a8 8 0 0 1 14-3l1 4M4 12l1 4a8 8 0 0 0 14-3"/>'
};
function v372SettingsIcon(item){
  const slug=String(item.id||'').replace(/^v221-settings-/, '');
  const term=(String(item.displayTitle||'')+' '+String(item.subgroup||'')).toLowerCase();
  let id=V372_SECTION_ICONS[slug];
  if(!id)id=/navigation|menu/.test(term)?'compass':/theme|color/.test(term)?'palette':/cover|artwork|image/.test(term)?'image':/sync|cloud/.test(term)?'cloud':/backup/.test(term)?'archive':/log|episode/.test(term)?'list':/category|tags/.test(term)?'tags':/import|export/.test(term)?'transfer':/history/.test(term)?'clock':/xp|progress/.test(term)?'trophy':'settings';
  const path=V372_SECTION_PATHS[id]||V365_ICONS[id]||V365_ICONS.settings;
  return '<svg class="mf372-section-svg" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
}
const v372BuildSectionBase=v365BuildSection;
v365BuildSection=function(item){
  const section=v372BuildSectionBase.apply(this,arguments);
  const button=section.querySelector('.mf365-section-toggle');
  const caret=button?.querySelector('.mf365-expand-caret');
  if(caret){caret.classList.add('mf372-section-mark');caret.innerHTML=v372SettingsIcon(item);}
  if(button)button.dataset.v225Iconified='1';
  section.classList.add('mf372-settings-section');
  const favorite=section.querySelector('.mf365-favorite-button');
  if(favorite){favorite.innerHTML='<span class="mf372-pin-label" aria-hidden="true"></span>';favorite.classList.add('mf372-favorite-text');favorite.dataset.v225Iconified='1';}
  return section;
};

// v226's later semantic-button observer historically reinserted the generic
// circle-arrow despite v225 opt-out. Accordion and Pin are already fully
// accessible/icon-equipped; exempt only these two specific button surfaces.
const v372V226SemanticBase=v226RefreshSemanticButtonIcon;
v226RefreshSemanticButtonIcon=function(el){
  if(el?.matches?.('.mf372-settings-section .mf365-section-toggle,.mf372-settings-section .mf365-favorite-button')){
    el.querySelectorAll(':scope > .v225-btn-icon').forEach(node=>node.remove());
    el.dataset.v225Iconified='1';
    return;
  }
  return v372V226SemanticBase.apply(this,arguments);
};

// The v282 deletion implementation waited for cloud persistence BEFORE render.
// Render from authoritative local state immediately after confirmation; then
// save through the original persistence pipeline and reconcile the UI again.
let v372DeletingCollections=false;
App.v282DeleteSelectedCollections=async function(){
  if(v372DeletingCollections)return;
  const ids=[...V282_COLLECTION_BATCH.selected].filter(id=>v274CollectionById(id));
  if(!ids.length)return;
  v372DeletingCollections=true;
  try{
    const ok=await v279Confirm({title:`Delete ${ids.length.toLocaleString()} collection${ids.length===1?'':'s'}?`,body:'The selected Collections will be deleted. Titles inside them will stay in your MediaFlow Library.',confirmLabel:'Delete collections',danger:true});
    if(!ok)return;
    const set=new Set(ids.map(String)),now=Date.now();
    S.collections=(S.collections||[]).filter(c=>!set.has(String(c?.id||'')));
    S.collectionTombstones=Array.isArray(S.collectionTombstones)?S.collectionTombstones:[];
    for(const id of ids)S.collectionTombstones.push({id:String(id),deletedAt:now});
    if(set.has(String(V274_UI.activeId||'')))V274_UI.activeId='';
    for(const id of ids)V282_COLLECTION_BATCH.selected.delete(String(id));
    // The visible batch results/counter are refreshed before cloud/network work.
    if(String(S.view||'')==='collections')render();
    let saved=true;
    try{await saveState();}catch(err){saved=false;console.warn('v372 Collection delete sync pending',err);}
    // A legacy async confirmation/renderer might have painted an old result.
    if(String(S.view||'')==='collections')render();
    showToast(saved?`${ids.length.toLocaleString()} collection${ids.length===1?'':'s'} deleted`:'Collections removed locally; cloud save needs retry');
  }finally{v372DeletingCollections=false;}
};

const v372Style=document.createElement('style');v372Style.id='mf372-logging-premium-style';
v372Style.textContent=/*css*/`
/* Everything decorative inherits existing MediaFlow theme variables. */
.mf372-logging{--mf372-a:var(--flow);--mf372-surface:var(--panel-raised,var(--panel,var(--surface)));--mf372-soft:color-mix(in srgb,var(--mf372-a) 11%,var(--mf372-surface));--mf372-medium:color-mix(in srgb,var(--mf372-a) 22%,var(--mf372-surface));--mf372-stroke:color-mix(in srgb,var(--mf372-a) 29%,var(--border));isolation:isolate}
.mf372-logging .mf372-session-hero{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--mf372-a) 46%,var(--border));border-radius:19px;padding:22px 22px 17px;margin:0 0 16px;background:radial-gradient(ellipse at 92% -16%,color-mix(in srgb,var(--mf372-a) 22%,transparent),transparent 55%),linear-gradient(125deg,color-mix(in srgb,var(--mf372-a) 12%,var(--mf372-surface)),var(--mf372-surface) 62%);box-shadow:0 8px 30px color-mix(in srgb,var(--mf372-a) 9%,transparent)}
.mf372-logging .mf372-session-hero:before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:linear-gradient(var(--mf372-a),color-mix(in srgb,var(--mf372-a) 25%,transparent));pointer-events:none}
.mf372-hero-top{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:17px}.mf372-hero-copy{min-width:0}.mf372-eyebrow{display:inline-block;font-size:10px;font-weight:850;letter-spacing:.16em;color:var(--mf372-a);margin-bottom:5px}.mf372-hero-copy h2{font-size:clamp(18px,2.2vw,25px);letter-spacing:-.04em;font-weight:850;line-height:1.2;margin:0 0 7px;color:var(--text)}.mf372-hero-copy p{font-size:12px;line-height:1.45;color:var(--text-dim);margin:0}.mf372-hero-mark{width:58px;height:58px;flex:none;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--mf372-a) 36%,var(--border));border-radius:17px;background:color-mix(in srgb,var(--mf372-a) 13%,var(--mf372-surface));color:var(--mf372-a)}
.mf372-hero-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.mf372-hero-stat{display:flex;align-items:center;gap:10px;padding:12px;min-width:0;border:1px solid var(--mf372-stroke);border-radius:12px;background:color-mix(in srgb,var(--mf372-surface) 76%,var(--mf372-a) 7%)}.mf372-stat-symbol{flex:none;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--mf372-a);background:var(--mf372-soft)}.mf372-hero-stat div{min-width:0;display:grid;gap:2px}.mf372-hero-stat strong{font-size:17px;letter-spacing:-.03em;line-height:1.2;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--text)}.mf372-hero-stat small{font-size:10px;color:var(--text-dim);white-space:normal}
.mf372-logging .v370-interface{border:1px solid var(--mf372-stroke);border-radius:14px;background:linear-gradient(100deg,var(--mf372-soft),var(--mf372-surface) 74%);padding:13px 16px;box-shadow:none}
.mf372-logging .v370-mode-switch button.active,.mf372-logging .v239-log-mode-options button.active{background:var(--mf372-medium)!important;border-color:var(--mf372-a)!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mf372-a) 35%,transparent),0 3px 15px color-mix(in srgb,var(--mf372-a) 12%,transparent)!important}
.mf372-logging .v370-panels{gap:15px}.mf372-logging .v370-title{border:1px solid var(--mf372-stroke);border-radius:17px;background:linear-gradient(155deg,var(--mf372-soft),var(--mf372-surface) 30%);box-shadow:0 7px 22px color-mix(in srgb,var(--mf372-a) 7%,transparent)}.mf372-logging .v370-title-head{box-shadow:none;position:relative}.mf372-logging .v370-title-head:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--mf372-a);opacity:.9}.mf372-logging .v370-title-cover{border:2px solid var(--mf372-stroke);border-radius:12px;box-shadow:0 5px 12px color-mix(in srgb,var(--mf372-a) 12%,transparent)}
.mf372-logging .v370-title-tags .v370-tag,.mf372-logging .mf372-quick-meta .v370-tag{font-weight:650;border-radius:8px;padding:5px 8px}.mf372-logging .v370-category{background:color-mix(in srgb,var(--mf372-a) 8%,var(--mf372-surface));border-color:var(--mf372-stroke)}.mf372-logging .v370-title-stats{font-weight:650}.mf372-logging .v370-title-content{background:color-mix(in srgb,var(--mf372-a) 2%,var(--panel,var(--surface)))}
.mf372-logging .v370-unit{border:1px solid color-mix(in srgb,var(--mf372-a) 20%,var(--border));border-radius:13px;background:color-mix(in srgb,var(--mf372-a) 4%,var(--panel,var(--surface)));box-shadow:0 2px 9px color-mix(in srgb,var(--mf372-a) 3%,transparent)}
.mf372-logging .v370-unit:has(.v370-unit-repeat-state){border-left:4px solid var(--mf372-a);background:var(--mf372-soft)}.mf372-logging .v370-unit-top strong{letter-spacing:-.015em}.mf372-logging .v370-unit-repeat-state{border:1px solid var(--mf372-stroke);font-weight:750}
.mf372-logging :is(.v370-unit-grid,.v370-add-controls) input:focus-visible,.mf372-logging :is(.v370-unit-grid,.v370-add-controls) select:focus-visible{outline:2px solid var(--mf372-a);outline-offset:1px}
.mf372-logging .v370-auto-totals>div{border:1px solid var(--mf372-stroke);border-radius:13px;background:linear-gradient(120deg,var(--mf372-soft),var(--mf372-surface))}.mf372-logging .v370-auto-totals strong{color:var(--mf372-a);font-size:20px}
.mf372-logging .v370-add-row{border:1px solid var(--mf372-stroke);border-radius:12px;background:var(--mf372-soft)}.mf372-logging .mf372-draft-actions{padding:7px 4px}.mf372-logging .v370-clear-btn{border-color:color-mix(in srgb,var(--overused,var(--mf372-a)) 35%,var(--border))}
.mf372-logging .v239-logged-title-card{border-radius:14px;border:1px solid var(--mf372-stroke);background:linear-gradient(110deg,var(--mf372-soft),var(--mf372-surface) 60%);box-shadow:0 5px 14px color-mix(in srgb,var(--mf372-a) 6%,transparent)}.mf372-logging .v239-logged-title-copy{min-width:0}.mf372-logging .mf372-quick-meta{margin-top:7px}.mf372-logging .mf372-quick-meta .v370-title-tags{margin:0;gap:5px}.mf372-logging .v239-logged-title-copy>small{display:block;margin-top:7px;font-size:11px;color:var(--text-dim)}.mf372-logging .v179-log-mode-switch{border-radius:14px;border-color:var(--mf372-stroke);background:var(--mf372-soft)}
.mf372-logging [class*=xp-preview],.mf372-logging [class*=xp-card]{border-color:var(--mf372-stroke)!important;background:linear-gradient(115deg,var(--mf372-soft),var(--mf372-surface))!important;border-radius:12px}.mf372-logging .v370-logging-actions .v370-clear-btn:hover{border-color:var(--overused,var(--mf372-a))}
.mf372-settings-section{transition:background-color .14s ease,border-color .14s ease}.mf365-settings-center .mf372-settings-section .mf372-section-mark{transform:none!important;display:grid;place-items:center;width:35px;height:35px;flex:none;border:1px solid color-mix(in srgb,var(--flow) 22%,var(--border));border-radius:10px;background:color-mix(in srgb,var(--flow) 9%,var(--panel));color:var(--flow)}.mf365-settings-center .mf372-settings-section.mf365-expanded{border-color:color-mix(in srgb,var(--flow) 45%,var(--border));background:color-mix(in srgb,var(--flow) 4%,var(--panel))}.mf365-settings-center .mf372-settings-section.mf365-expanded .mf372-section-mark{background:color-mix(in srgb,var(--flow) 19%,var(--panel));border-color:color-mix(in srgb,var(--flow) 45%,var(--border))}
.mf365-settings-center .mf372-settings-section .mf365-section-toggle{gap:12px}.mf365-settings-center .mf372-favorite-text{width:auto;min-width:42px;padding:7px;font-size:11px;font-weight:700}.mf365-settings-center .mf372-pin-label:before{content:'Pin'}.mf365-settings-center .mf365-pinned .mf372-pin-label:before{content:'Pinned'}.mf365-settings-center .mf372-section-mark .mf372-section-svg{width:20px;height:20px}
@media(max-width:650px){.mf372-logging .mf372-session-hero{padding:16px 13px 13px;border-radius:15px}.mf372-hero-mark{width:40px;height:40px;border-radius:12px}.mf372-hero-mark svg{width:22px;height:22px}.mf372-hero-copy h2{font-size:19px}.mf372-hero-stats{gap:5px}.mf372-hero-stat{padding:9px 6px;gap:5px;display:grid;justify-items:start}.mf372-stat-symbol{width:27px;height:27px}.mf372-stat-symbol svg{width:15px}.mf372-hero-stat strong{font-size:14px}.mf372-hero-stat small{font-size:9px}.mf372-logging .v370-title{border-radius:13px}.mf372-logging .mf372-quick-meta .v370-tag{font-size:10px;padding:4px 6px}.mf365-settings-center .mf372-settings-section .mf372-section-mark{width:33px;height:33px}}
@media(max-width:345px){.mf372-hero-mark{display:none}.mf372-hero-stat strong{font-size:12px}.mf372-hero-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.mf372-logging .mf372-session-hero{padding-left:12px;padding-right:12px}}
@media(prefers-reduced-motion:reduce){.mf372-settings-section{transition:none!important}}
`;
document.head.appendChild(v372Style);
MediaFlowRuntime.version=V372_RELEASE;
window.MediaFlowV372={version:372,features:['Premium theme-aware Logging 3.0','Quick title metadata parity','Single semantic Settings accordion icons','Immediate Collections batch delete refresh']};
