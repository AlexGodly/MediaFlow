/* MediaFlow v404 — Smart Fresh Episodes Engine, responsive recommendation toggle,
 * and historical About FAQ/Fun Facts. The stable provider identifier `automatic2`
 * and cloud/export payloads are unchanged. No provider or schema migration. */
const V404_RELEASE=404;
const V404_ENGINE_NAME="Alex Godly's Smart Fresh Episodes Engine";
// Older account snapshots can contain a previously saved display label even
// when the engine key is already `automatic2`. Normalize only rendered text;
// never rewrite serialized provider IDs or historical user data.
function v404CurrentEngineLabel(text){
  return String(text||'')
    .replace(/Automatic(?:\s*:\s*|\s+)Multi-Provider 2/g,V404_ENGINE_NAME)
    .replace(/Multi-Provider 2/g,V404_ENGINE_NAME)
    .replace(/Automatic 2/g,V404_ENGINE_NAME);
}
const v404SeasonalMarkupBase=v166SeasonalSettingsHtml;
v166SeasonalSettingsHtml=function(){return v404CurrentEngineLabel(v404SeasonalMarkupBase.apply(this,arguments));};
const v404SeasonalStatusBase=v166SeasonalStatusText;
v166SeasonalStatusText=function(){return v404CurrentEngineLabel(v404SeasonalStatusBase.apply(this,arguments));};

// v401/402 inserted their dashboard control into renderSettings(), an obsolete
// path. The actual v348/v394+ page flows through the canonical page renderer.
// Insert before the Settings Center moves the original section nodes.
function v404InsertRecommendationControl(raw){
  const host=document.createElement('div');host.innerHTML=String(raw||'');
  const label=[...host.querySelectorAll('.section-label')]
    .find(node=>/TITLE RECOMMENDATIONS/i.test(node.textContent||''));
  const card=label?.nextElementSibling;
  if(!card?.classList?.contains('card'))return raw;
  const old=card.querySelector('[data-mf401-filter="recommendations"]');
  if(old)old.remove();
  const rows=[...card.querySelectorAll('.settings-toggle-row')];
  const priority=rows.find(x=>/Prioritize Personal Order/.test(x.textContent||''));
  if(!priority)return raw;
  const lastDescription=priority.nextElementSibling;
  const insertionPoint=(lastDescription&&lastDescription.parentElement===priority.parentElement)?lastDescription:priority;
  insertionPoint.insertAdjacentHTML('afterend',
    '<div class="mf402-recommend-separator mf404-recommend-divider" aria-hidden="true"></div>'+v401FilterControl('recommendations'));
  const row=card.querySelector('[data-mf401-filter="recommendations"]');
  row?.classList.add('mf402-recommend-setting','settings-toggle-row','mf404-recommend-setting');
  card.classList.add('mf404-recommendations-card');
  return host.innerHTML;
}
const v404SettingsBase=V219_PAGE_RENDERERS.get('settings');
if(typeof v404SettingsBase==='function')MediaFlowRuntime.registerPageRenderer('settings',function(ctx){
  return v404InsertRecommendationControl(v404SettingsBase.call(this,ctx));
});
if(typeof v366RegisterSetting==='function')v366RegisterSetting({
  id:'v401RecommendFreshOnly',section:'title-recommendations',
  selector:'[data-mf401-filter="recommendations"]',
  label:'Only recommend titles with fresh episodes',subgroup:'Title Recommendations',
  keywords:['dashboard','recommendations','seasonal','fresh','episodes','smart engine','caught up','unknown']
});

// Immediate DOM feedback avoids a full Settings Center / Fresh Episodes page
// reconstruction and the expensive Library recommendation search in the click
// event. Coalesce rapid clicks; the latest value is the only persisted one.
let V404_TOGGLE_GENERATION=0;
let V404_TOGGLE_SAVE_TIMER=null;
let V404_TOGGLE_RECOMMEND_TIMER=null;
function v404SyncFilterControls(root=document){
  const active=v401FilterEnabled(),allowed=v401AutomaticEnabled();
  root.querySelectorAll('[data-mf401-filter]').forEach(row=>{
    const control=row.querySelector('button[role="switch"]');if(!control)return;
    control.classList.toggle('on',active);
    control.setAttribute('aria-checked',String(active));
    control.disabled=!allowed;
    control.setAttribute('aria-disabled',String(!allowed));
    const note=row.querySelector('.mf401-setting-note');
    if(note)note.hidden=allowed;
    if(!note&&!allowed)row.insertAdjacentHTML('beforeend',
      '<small class="mf401-setting-note">Select automatic detection or an individual episode provider to enable.</small>');
  });
}
// Existing task reconciler already includes v402's Unknown-eligible rule and
// re-checks progress from Library data. Do not scan any third-party providers
// merely because a display preference changed.
// Large Seasonal Libraries must not be sorted in one synchronous click task.
// During an enabled-filter transition, evaluate at most 900 entries per animation frame;
// preserve Personal Order precedence, candidate restrictions and per-title
// scoring, with a cancellation token for rapid toggles/newer saved progress.
async function v404ReconcileSeasonalInChunks(generation){
  const task=S.currentTask;
  if(!task||!S.settings?.exactTitleRecommendations)return;
  const cat=getCategory(task.categoryId);
  if(!v401FilterEnabled()||!v401IsSeasonal(cat))return;
  const library=S.library||[];
  const current=library.find(x=>String(x?.id)===String(task.libraryId));
  if(current&&current.status!=='completed'&&current.status!=='dropped'&&v401Eligible(current,cat))return;
  let best=null,bestScore=-Infinity,eligibleById=null;
  const personalOrder=!!S.settings.prioritizePersonalOrder&&typeof v287RecommendationSequence==='function';
  if(personalOrder)eligibleById=new Map();
  for(let start=0;start<library.length;start+=900){
    if(generation!==V404_TOGGLE_GENERATION||S.currentTask!==task||!v401FilterEnabled())return;
    const end=Math.min(library.length,start+900);
    for(let i=start;i<end;i++){
      const item=library[i];
      if(!item||String(item.categoryId)!==String(cat.id)||item.status==='completed'||item.status==='dropped'||!v401Eligible(item,cat))continue;
      if(eligibleById)eligibleById.set(String(item.id),item);
      const score=scoreLibraryTitle(item,cat);
      if(!best||score>bestScore){best=item;bestScore=score;}
    }
    if(end<library.length)await new Promise(resolve=>{
      if(document.visibilityState==='visible'&&typeof requestAnimationFrame==='function')requestAnimationFrame(resolve);
      else setTimeout(resolve,0);
    });
  }
  if(personalOrder){
    // This queue is already indexed by the Personal Order implementation.
    // No need to sort all available Seasonal Anime just to find its first hit.
    for(const item of v287RecommendationSequence(cat.id)){
      const matched=eligibleById.get(String(item?.id));
      if(matched){best=matched;break;}
    }
  }
  if(generation!==V404_TOGGLE_GENERATION||S.currentTask!==task||!v401FilterEnabled())return;
  const id=best?.id??null,title=best?cleanTitle(best.title):null;
  if(task.libraryId===id&&task.title===title)return;
  task.libraryId=id;task.title=title;
  if(typeof v287AnnotateTaskOrderSource==='function')v287AnnotateTaskOrderSource(task);
  try{persistTask();}catch(error){console.warn('v404 task persistence',error);}
}
function v404ScheduleRecommendationRefresh(){
  clearTimeout(V404_TOGGLE_RECOMMEND_TIMER);
  const generation=V404_TOGGLE_GENERATION;
  V404_TOGGLE_RECOMMEND_TIMER=setTimeout(async()=>{
    if(generation!==V404_TOGGLE_GENERATION)return;
    try{
      if(v401FilterEnabled())await v404ReconcileSeasonalInChunks(generation);
      else v401RestoreUnfilteredTask();
      if(generation===V404_TOGGLE_GENERATION&&S.view==='dashboard')render();
    }catch(error){console.warn('v404 recommendation refresh',error);}
  },90);
}
function v404PersistFilterLater(){
  clearTimeout(V404_TOGGLE_SAVE_TIMER);
  const generation=V404_TOGGLE_GENERATION;
  V404_TOGGLE_SAVE_TIMER=setTimeout(()=>{
    if(generation!==V404_TOGGLE_GENERATION)return;
    try{
      // persisting through MediaFlow's canonical settings pipeline maintains
      // local resume, cloud autosave and existing backup/export compatibility.
      Promise.resolve(persistSettings()).catch(error=>{
        console.warn('v404 filter save failed',error);
        showToast('Could not save the Fresh Episodes recommendation preference. Please retry.');
      });
    }catch(error){console.warn('v404 filter save failed',error);
      showToast('Could not save the Fresh Episodes recommendation preference. Please retry.');}
  },120);
}
App.v401ToggleFreshRecommendations=function(){
  if(!v401AutomaticEnabled()){
    v404SyncFilterControls();
    showToast('Select an automatic Fresh Episodes checking method to enable this filter.');
    return;
  }
  const settings=S.settings||(S.settings={});
  settings.v401RecommendFreshOnly=!settings.v401RecommendFreshOnly;
  V404_TOGGLE_GENERATION++;
  v404SyncFilterControls();
  v404PersistFilterLater();
  v404ScheduleRecommendationRefresh();
};
// Manual mode needs identical disabled/off switches on both surfaces, even
// when a page already exists and is not about to be fully rendered.
const v404ManualModeBase=App.v166ToggleSeasonalAuto;
App.v166ToggleSeasonalAuto=function(){
  const result=v404ManualModeBase.apply(this,arguments);
  if(!v401AutomaticEnabled()){
    S.settings.v401RecommendFreshOnly=false;
    V404_TOGGLE_GENERATION++;
    v404PersistFilterLater();
  }
  v404SyncFilterControls();
  return result;
};
// Real save/log paths keep the saved verification ledger, but eligibility must
// compare with the latest Library progress rather than with progressAtCheck.
// Reconciliation occurs only after successful completion, never on a draft.
const v404SubmitBase=App.submitLog;
App.submitLog=function(){
  const result=v404SubmitBase.apply(this,arguments);
  const reconcile=()=>{if(S.logging!==true){V404_TOGGLE_GENERATION++;v404ScheduleRecommendationRefresh();}};
  if(result&&typeof result.then==='function')return result.then(value=>{reconcile();return value;});
  reconcile();return result;
};
const v404EditBase=App.saveLibraryModal;
App.saveLibraryModal=function(){
  const result=v404EditBase.apply(this,arguments);
  const reconcile=()=>{if(S.modal?.type!=='library'){V404_TOGGLE_GENERATION++;v404ScheduleRecommendationRefresh();}};
  if(result&&typeof result.then==='function')return result.then(value=>{reconcile();return value;});
  reconcile();return result;
};

// The About page renderer derives FAQ and Fun Facts from these data arrays.
// Updating these two arrays changes NO other About page component or content.
const v404FaqUpdates=[
 ['Episode detection','What is Alex Godly\'s Smart Fresh Episodes Engine?',
  'An original MediaFlow verification architecture designed by Alex Godly. It checks matching anime identities and all applicable episode providers, then uses the highest trustworthy count of fresh episodes rather than adding potentially overlapping results.'],
 ['Episode detection','How is the Smart Engine different from Automatic Multi-Provider?',
  'Automatic Multi-Provider uses prioritized fallback. Alex Godly\'s Smart Fresh Episodes Engine checks all applicable providers and compares verified evidence, including strong airing information when available.'],
 ['Episode detection','How does the Smart Engine handle disagreement or missing results?',
  'MediaFlow only accepts usable and appropriately matched release information. One verified source can establish fresh episodes; confirming no fresh episodes needs sufficient trustworthy evidence. Otherwise availability remains Unknown.'],
 ['Episode detection','What are Single-Source Verified Airing Schedules?',
  'The Smart Engine can confirm some caught-up anime through explicit identity-matched AniList airing evidence even when other providers cannot supply useful episode lists. Inconclusive cases remain Unknown.'],
 ['Episode detection','Will fresh-only recommendations change when I log an episode?',
  'Yes. Saved progress is compared against the latest trustworthy Fresh Episodes results. A title can become caught up after logging and eligible again when a newly released episode is subsequently verified.'],
 ['Episode detection','Are titles with Unknown episode availability recommended?',
  'Yes. When fresh-only recommendations are enabled, titles with Unknown availability remain eligible. Only titles confidently confirmed caught up are excluded.'],
 ['Episode detection','Does enabling fresh-only recommendations rescan all providers?',
  'No. The switch changes recommendation filtering using existing evidence. Use Fresh Episodes Refresh to fetch updated provider information.'],
 ['Episode detection','Why is the fresh-only recommendations switch disabled?',
  'The filter is available when automatic Fresh Episodes checking is enabled. Manual checking disables it because no active automatic verification can support that preference.'],
 ['About MediaFlow','What was MediaFlow before its first released version?',
  'The Old System page preserves the final state of the original unreleased pre-v1 MediaFlow application, which was the entire project before the modern system replaced it.'],
 ['About MediaFlow','Why did Alex Godly create MediaFlow?',
  'He wanted a deeply customizable personal organizer for his own media interests and could not find exactly what he imagined, so he decided to build it himself. It was not originally intended as a public application.'],
 ['About MediaFlow','Is a separate public edition available?',
  'Not yet. After friends showed interest, the developer began considering a separate future public edition and additional integrations. No release date or availability is promised.']
];
for(const [category,question,answer] of v404FaqUpdates){
  if(!V383_FAQS.some(f=>f.question===question))V383_FAQS.push({category,question,answer});
}
// FAQ groups were captured at v383 initialization; update the same array in
// place so filtering and accessible category tabs include new subjects.
for(const category of new Set(V383_FAQS.map(f=>f.category))){
  if(!V383_FAQ_GROUPS.includes(category))V383_FAQ_GROUPS.push(category);
}
const v404OriginalAutomaticFaq=V383_FAQS.find(f=>f.question==='What is Automatic Multi-Provider?');
if(v404OriginalAutomaticFaq)v404OriginalAutomaticFaq.answer=
  'The original automatic checking method tries episode providers in a prioritized fallback order. For cross-provider comparison and stronger evidence checks, select Alex Godly\'s Smart Fresh Episodes Engine.';
const v404FreshCountFaq=V383_FAQS.find(f=>f.question==='Why is my Fresh Titles count unchanged?');
if(v404FreshCountFaq)v404FreshCountFaq.answer=
  'If a check is partial or inconclusive, MediaFlow can retain the last confirmed total rather than treating missing provider data as a zero. See the Smart Engine verification details for matched identities, fresh, caught-up and unresolved titles.';
const v404PersonalFact=V383_FACTS.find(f=>f.title==='A personal project');
if(v404PersonalFact){v404PersonalFact.title='Built for One Nerd, Not the World';v404PersonalFact.description=
  'MediaFlow began because Alex Godly wanted exactly this kind of personal media organizer and could not find it. His response? “Fuck it, I\'ll do it myself.” Built for his nerdy interests and love of organizing, it was never originally intended to be public. Friends later inspired the idea of a separate public edition.';}
const v404IterationFact=V383_FACTS.find(f=>f.title==='Hundreds of iterations');
if(v404IterationFact){v404IterationFact.title='Hundreds of Versions, One Vision';v404IterationFact.description='From the unreleased Old System to more than 400 numbered development versions, MediaFlow has continuously evolved around its creator\'s personal workflow.';}
const v404Facts=[
 ['Where It All Began — The Old System',
  'Before v1 existed, the Old System was the entire MediaFlow project across unreleased iterations. The page preserved today contains its final state from when Alex began developing modern MediaFlow, kept deliberately for nostalgia.','history'],
 ['An Original Architecture by Alex Godly',
  'Alex Godly\'s Smart Fresh Episodes Engine is an original verification architecture designed by the developer specifically for MediaFlow. It compares trustworthy episode information from existing external services rather than claiming ownership of their data.','brain-circuit'],
 ['Media Service Tracking — A Paused Ambition',
  'Direct media-service tracking integrations, including explored MyAnimeList and SIMKL connectivity, were paused due to financial limitations. Existing media-ID and import features are separate from live tracking.','link-2'],
 ['Community Integration — A Paused Ambition',
  'Planned community features for connecting with others, sharing interests and interacting inside MediaFlow were paused due to financial limitations. They are not active services.','users'],
 ['Discord Integration — A Paused Ambition',
  'Discord integration ideas, including Rich Presence, were paused due to financial limitations. A full Discord connection is not part of this release.','gamepad-2'],
 ['A Library of Tens of Thousands',
  'MediaFlow\'s creator has maintained a personal media library with tens of thousands of titles. Handling that scale influenced its sorting, filtering, importing and performance work.','library-big'],
 ['An Obsession With Customization',
  'The ability to organize categories, statuses, priorities, cover views, sorting, navigation and themes reflects Alex Godly\'s passion for putting everything in just the right order.','sliders-horizontal'],
 ['One Home for Every Fictional Universe',
  'Anime, series, movies, manga, books and comics can live in the same personal library instead of requiring separate tracking apps for every medium.','clapperboard'],
 ['Even the Watchlist Needed a Watchlist',
  'Personal Order can arrange individual titles and Collections into custom queues, because simply saving a title for later was not organized enough.','list-ordered'],
 ['Your Library, Your Data',
  'Exports, imports, Full Data backups, Settings Presets and cloud synchronization were developed to make it easier to preserve and move a deeply personal media collection.','database-backup'],
 ['Friends Inspired a Future Edition',
  'MediaFlow was created for personal use, not a public launch. When friends liked the idea, Alex began considering a separate public edition others could try, with additional integrations if resources allow.','users'],
 ['Verified, Not Just Available',
  'The Smart Engine does not treat a successful provider request as proof of a released episode. It checks the quality of the evidence and distinguishes confirmed caught-up titles from Unknown results.','shield-check']
];
for(const [title,description,icon] of v404Facts){
  if(!V383_FACTS.some(f=>f.title===title))V383_FACTS.push({title,description,icon});
}
window.MediaFlowV404={version:404,engineName:V404_ENGINE_NAME,
  insertRecommendationControl:v404InsertRecommendationControl,
  syncControls:v404SyncFilterControls,
  eligibility:item=>v402EpisodeOutcomeFor(item),
  faqCount:V383_FAQS.length,factCount:V383_FACTS.length};
MediaFlowRuntime.version=V404_RELEASE;
