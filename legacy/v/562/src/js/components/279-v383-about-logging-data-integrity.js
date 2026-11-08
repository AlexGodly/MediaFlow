/* MediaFlow v383 — expressive Logging Library header, informative About page,
 * and non-destructive persistent-system audit. No cloud schema migration. */
const V383_RELEASE=383;
const V383_FAQS=[{"category": "Getting started", "question": "What is MediaFlow?", "answer": "MediaFlow is a personal media Library, consumption tracker and rotation workspace with recommendations, History, statistics and customizable organization."}, {"category": "Getting started", "question": "Which media can I track?", "answer": "You can organize anime, television, movies, manga, books and other media using your own categories and units."}, {"category": "Getting started", "question": "Do I have to follow recommendations?", "answer": "No. Recommendations are optional. You can directly select Library titles in Logging and organize your own Personal Order."}, {"category": "Getting started", "question": "How do I start tracking a title?", "answer": "Add a Library title, assign its category and status, then use Quick Logging or Advanced Logging to record your progress."}, {"category": "Getting started", "question": "Can I change my categories?", "answer": "Yes. Categories, their names, icons, ordering, units and related presentation preferences are customizable."}, {"category": "Getting started", "question": "What is the difference between a Library and Personal Order?", "answer": "The Library stores your titles and progress. Personal Order is an independently managed queue for deciding what to consume next."}, {"category": "Library", "question": "What Library views are available?", "answer": "MediaFlow supports multiple list, card, compact and cover-focused views, depending on the Library mode and display settings."}, {"category": "Library", "question": "Can I assign statuses and priorities?", "answer": "Yes. Titles support statuses, priorities, categories, progress, ratings and other details."}, {"category": "Library", "question": "Can I track individual seasons?", "answer": "Yes. Seasons View allows a title to carry season-specific totals and progress, with aggregation where supported."}, {"category": "Library", "question": "Can I use custom covers?", "answer": "Yes. You can add cover URLs and adjust presentation through compatible cover and overlay settings."}, {"category": "Library", "question": "What are external media IDs?", "answer": "They are provider identifiers, such as MAL, AniList or IMDb IDs, that help connect an entry to external media information."}, {"category": "Library", "question": "Can I import a large Library?", "answer": "MediaFlow has multiple import methods, but very large data sets should be tested and backed up first; performance depends on the device and browser."}, {"category": "Logging and XP", "question": "What is Quick Logging?", "answer": "Quick Logging lets you record consumption using amounts or updated total progress without entering every unit individually."}, {"category": "Logging and XP", "question": "What is Advanced Logging?", "answer": "Advanced Logging allows separate episode or chapter records, including supported season, time and repeat information."}, {"category": "Logging and XP", "question": "What does Use Recommended Title do?", "answer": "It adds the recommended Library title directly to the active Logging draft. Adding a title does not itself submit a log."}, {"category": "Logging and XP", "question": "What do Current and After This Draft mean?", "answer": "Current shows saved progress. After This Draft previews projected progress from staged Advanced Logging entries, subject to the existing logging rules."}, {"category": "Logging and XP", "question": "How is XP calculated?", "answer": "XP depends on the applicable base reward, rotation and streak settings. The preview is an estimate; XP is awarded after successful submission."}, {"category": "Logging and XP", "question": "Do repeated units always advance progress?", "answer": "No. Repeats and gaps follow MediaFlow’s existing progress rules; they do not automatically advance completion."}, {"category": "Logging and XP", "question": "Where can I see previous logs?", "answer": "The History pages show saved consumption and related records, with export tools for supported formats."}, {"category": "Order and Collections", "question": "What is Personal Order?", "answer": "A custom ordering workspace for arranging titles and assigned Collections using supported drag, arrow and position controls."}, {"category": "Order and Collections", "question": "Can I place a title above a Collection?", "answer": "Yes. Mixed title-and-Collection queues are supported in the applicable Personal Order views."}, {"category": "Order and Collections", "question": "Can I export Personal Order?", "answer": "Yes. The dedicated Personal Order export/import tools preserve supported queue data and rules."}, {"category": "Order and Collections", "question": "What are Collections?", "answer": "Collections group related Library titles and can be used in their own views and eligible Personal Order queues."}, {"category": "Order and Collections", "question": "Can I export and import Collections?", "answer": "Yes. The dedicated Collections JSON export/import tools preserve supported Collection data."}, {"category": "Order and Collections", "question": "Does removing a title from a Collection delete it from my Library?", "answer": "No. Removing membership and deleting a Library title are separate actions."}, {"category": "Cloud and backups", "question": "Where is my information saved?", "answer": "MediaFlow maintains local app state; signed-in cloud features synchronize supported persistent data through the configured Supabase backend."}, {"category": "Cloud and backups", "question": "What does Sync Now do?", "answer": "Sync Now attempts to reconcile supported local and cloud state. Confirm actual completion and check reported errors before relying on a sync."}, {"category": "Cloud and backups", "question": "Is a cloud account the same as a backup?", "answer": "No. Cloud synchronization is not a substitute for keeping independent Full Data exports or backups."}, {"category": "Cloud and backups", "question": "What is included in Full Data export?", "answer": "The canonical export/backup pipeline includes supported Library, History, settings, XP and newer state extensions; check release compatibility before restoring."}, {"category": "Cloud and backups", "question": "Can I export Settings separately?", "answer": "Yes. Settings Presets export/import supported preferences separately from your complete account backup."}, {"category": "Cloud and backups", "question": "Are History exports available?", "answer": "Yes. Dedicated History export actions support the currently implemented fields and formats."}, {"category": "Cloud and backups", "question": "What happens when I am offline?", "answer": "Locally available data and supported queued changes may continue working; synchronize again after connectivity returns and verify the result."}, {"category": "Cloud and backups", "question": "Should I back up before importing?", "answer": "Yes. Create a Full Data backup before bulk imports, migrations or experiments with important data."}, {"category": "Episode detection", "question": "What is Automatic Multi-Provider?", "answer": "A detection mode that consults available permitted sources when one provider cannot establish trustworthy released-episode information."}, {"category": "Episode detection", "question": "Which providers are supported?", "answer": "Tenrai, AniZip, AniList, TVmaze and Kitsu are selectable. Their coverage and live availability can vary."}, {"category": "Episode detection", "question": "Can I choose just one provider?", "answer": "Yes. Select a specific provider in Settings to use its supported lookup path."}, {"category": "Episode detection", "question": "Why are some episode lists missing?", "answer": "A provider may lack a match, complete release dates or season information; a successful HTTP request alone does not guarantee usable data."}, {"category": "Episode detection", "question": "Why is my Fresh Titles count unchanged?", "answer": "MediaFlow preserves the last trustworthy total when a scan remains incomplete, rather than claiming an unverified new value."}, {"category": "Episode detection", "question": "Does detection change my Library progress?", "answer": "The episode-detection display compares provider information with your saved progress; it does not automatically log episodes for you."}, {"category": "Appearance and updates", "question": "Can I customize the appearance?", "answer": "Yes. MediaFlow supports multiple themes and theme-aware component styling, including custom and dynamic cover-driven options."}, {"category": "Appearance and updates", "question": "Can I rearrange navigation?", "answer": "Yes. Navigation settings allow supported tabs to be reordered and shown or hidden."}, {"category": "Appearance and updates", "question": "Can MediaFlow be installed as a PWA?", "answer": "MediaFlow includes a web app manifest and service worker. Installation availability depends on browser/platform requirements."}, {"category": "Appearance and updates", "question": "How are application updates delivered?", "answer": "The built-in update tools check available hosted releases, while PWA assets and caches are versioned. Automatic installation follows your saved preference."}, {"category": "Appearance and updates", "question": "Will an update delete my Library?", "answer": "Application-shell updates should not intentionally delete account data. Make a backup before major changes and verify synchronization."}, {"category": "Appearance and updates", "question": "Who created MediaFlow?", "answer": "MediaFlow — Personal Edition is developed by Alex Godly."}];
const V383_FACTS=[{"title": "Hundreds of iterations", "description": "MediaFlow has evolved through more than 380 numbered development releases.", "icon": "layers-3"}, {"title": "Two ways to log", "description": "Choose Quick Logging or detailed Advanced Logging.", "icon": "list-checks"}, {"title": "Five episode sources", "description": "Tenrai, AniZip, AniList, TVmaze and Kitsu are supported provider selections.", "icon": "radio"}, {"title": "Offline-minded", "description": "A PWA app shell and local state help keep supported features accessible.", "icon": "wifi-off"}, {"title": "Flexible categories", "description": "You decide how to categorize and measure your media.", "icon": "sliders-horizontal"}, {"title": "Episode outlook", "description": "Advanced Logging drafts can preview where your progress will land.", "icon": "chart-no-axes-column-increasing"}, {"title": "Mixed queues", "description": "Personal Order supports titles and assigned Collections in shared queues.", "icon": "arrow-up-down"}, {"title": "XP on activity", "description": "Consumption, streaks and eligible actions can contribute to progression.", "icon": "sparkles"}, {"title": "History matters", "description": "Your saved consumption provides the basis for detailed History and Stats.", "icon": "history"}, {"title": "Bring your IDs", "description": "External media IDs help connect your entries to supported provider data.", "icon": "fingerprint"}, {"title": "Your preferred order", "description": "Move eligible items with drag, arrows and numeric positions.", "icon": "grip-vertical"}, {"title": "Multiple views", "description": "Library and Logging support compact and artwork-forward presentations.", "icon": "layout-grid"}, {"title": "Collections universe", "description": "Group titles into Collections without changing the original Library entries.", "icon": "folder-heart"}, {"title": "Backup freedom", "description": "Full Data, settings, History, Personal Order and Collections have export workflows.", "icon": "archive"}, {"title": "Stay on theme", "description": "MediaFlow supports customizable and cover-aware looks.", "icon": "palette"}, {"title": "A personal project", "description": "Developed by Alex Godly as a dedicated media-management experience.", "icon": "heart"}, {"title": "Recommended shortcuts", "description": "Recommended titles can be directly added to a Logging draft.", "icon": "mouse-pointer-click"}, {"title": "Status and priority", "description": "A Library entry can carry its own category, priority and status.", "icon": "bookmark-check"}, {"title": "Season-aware", "description": "Per-title seasons help represent longer shows with multiple installments.", "icon": "calendar-range"}, {"title": "Designed to travel", "description": "The responsive web experience adapts to desktop, tablet and mobile.", "icon": "monitor-smartphone"}, {"title": "Cloud is optional context", "description": "Local and cloud workflows serve different recovery and sync purposes.", "icon": "cloud"}, {"title": "Careful with unknowns", "description": "Episode detection protects trusted totals when provider data is incomplete.", "icon": "shield-check"}, {"title": "Personal choices", "description": "Not every recommendation is mandatory; you stay in control.", "icon": "compass"}, {"title": "More than a watchlist", "description": "MediaFlow combines ordering, consumption, history, stats and routines.", "icon": "orbit"}];
const V383_FAQ_GROUPS=['All',...new Set(V383_FAQS.map(f=>f.category))];
function v383Icon(name,size=20){
  const p={library:'<path d="m4 5 5-2v16l-5 2V5ZM9 3l6 2v16l-6-2V3ZM15 5l5-2v16l-5 2V5Z"/>',
    chevron:'<path d="m6 9 6 6 6-6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
    sparkles:'<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/><path d="M19 16v6m-3-3h6"/>',
    shield:'<path d="m12 2 8 4v6c0 5-3.2 8-8 10-4.8-2-8-5-8-10V6l8-4Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    check:'<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="9"/>',
    heart:'<path d="M20 8.5c0 5-8 10-8 10s-8-5-8-10a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3Z"/>',
    book:'<path d="M3 4h9a3 3 0 0 1 3 3v14H6a3 3 0 0 0-3 0V4Zm12 3a3 3 0 0 1 3-3h3v17h-6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name]||p.sparkles}</svg>`;
}
function v383LoggingHeader(){
  const selected=Array.isArray(S.logDraft?.entries)?S.logDraft.entries.length:0;
  const titles=Array.isArray(S.library)?S.library.length:0;
  return `<span class="mf383-lib-icon" aria-hidden="true">${v383Icon('library',23)}</span>
    <span class="mf383-lib-heading"><span class="mf383-lib-kicker">YOUR LOGGING WORKSPACE</span>
    <b>Browse Library</b><small>Search, filter and add titles to this session</small></span>
    <span class="mf383-lib-stats" aria-hidden="true"><span>${titles.toLocaleString()} titles</span><span>${selected} added</span></span>
    <span class="mf383-lib-chevron">${v383Icon('chevron',19)}</span>`;
}
v238LoggingLibrarySummary=v383LoggingHeader;
const v383RenderLoggingBase=renderLogForm;
renderLogForm=function(){
  const raw=v383RenderLoggingBase.apply(this,arguments);
  if(!S.logDraft)return raw;
  const temp=document.createElement('div');temp.innerHTML=String(raw||'');
  const section=temp.querySelector('.v238-log-library');
  if(!section)return raw;
  section.classList.add('mf383-logging-library');
  const summary=section.querySelector('.v238-log-library-summary');
  if(summary){summary.classList.add('mf383-logging-summary');summary.innerHTML=v383LoggingHeader();summary.setAttribute('aria-label','Toggle Logging Library search, filters and title picker');}
  const body=section.querySelector('.v238-log-library-body');
  if(body){body.classList.add('mf383-logging-body');const head=body.querySelector('.v238-log-library-head');
    if(head)head.innerHTML=`<span class="mf383-lib-body-icon">${v383Icon('search',19)}</span><span><b>Discover your next entry</b><small>Search your Library, refine results and add one or several titles.</small></span>`;}
  return temp.innerHTML;
};

function v383AboutCard(icon,title,description,extra=''){
  return `<article class="mf383-feature-card"><span class="mf383-feature-icon">${v383Icon(icon,21)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${extra}</article>`;
}
function v383FaqMarkup(){
  return `<section class="mf383-about-section mf383-help" id="mf383-help"><div class="mf383-section-head"><div><span class="mf383-eyebrow">THE KNOWLEDGE BASE</span><h2>Answers, without the guesswork.</h2><p>Find guidance for your Library, Logging, sync, progress and more.</p></div><span class="mf383-count" id="mf383-faq-count">${V383_FAQS.length} questions</span></div>
    <label class="mf383-faq-search">${v383Icon('search',19)}<input id="mf383-faq-query" type="search" placeholder="Search questions and answers…" autocomplete="off" oninput="App.v383FilterFaq()" aria-label="Search MediaFlow FAQs"></label>
    <div class="mf383-faq-categories" role="group" aria-label="FAQ categories">${V383_FAQ_GROUPS.map((g,i)=>`<button type="button" class="mf383-faq-tab ${i===0?'is-active':''}" data-v383-category="${escapeHtml(g)}" onclick="App.v383FaqCategory(this)" aria-pressed="${i===0}">${escapeHtml(g)}</button>`).join('')}</div>
    <div class="mf383-faq-list">${V383_FAQS.map((f,i)=>`<details class="mf383-faq-entry" data-v383-faq-category="${escapeHtml(f.category)}" data-v383-faq-key="${escapeHtml((f.question+' '+f.answer).toLowerCase())}"><summary><span class="mf383-faq-index">${String(i+1).padStart(2,'0')}</span><span class="mf383-faq-question">${escapeHtml(f.question)}</span><span class="mf383-faq-plus" aria-hidden="true">+</span></summary><div class="mf383-faq-answer">${escapeHtml(f.answer)}</div></details>`).join('')}</div>
    <div class="mf383-faq-empty" id="mf383-faq-empty" hidden>No FAQs match your search. Try another keyword or category.</div>
  </section>`;
}
let V383_ACTIVE_FAQ='All';
function v383FaqFilter(){
  const q=String(document.getElementById('mf383-faq-query')?.value||'').trim().toLowerCase();let visible=0;
  document.querySelectorAll('.mf383-faq-entry').forEach(d=>{const show=(V383_ACTIVE_FAQ==='All'||d.dataset.v383FaqCategory===V383_ACTIVE_FAQ)&&String(d.dataset.v383FaqKey||'').includes(q);d.hidden=!show;if(!show)d.open=false;if(show)visible++;});
  const count=document.getElementById('mf383-faq-count');if(count)count.textContent=`${visible} ${visible===1?'question':'questions'}`;
  const empty=document.getElementById('mf383-faq-empty');if(empty)empty.hidden=visible!==0;
}
App.v383FilterFaq=v383FaqFilter;
App.v383FaqCategory=function(button){if(!button)return;V383_ACTIVE_FAQ=button.dataset.v383Category||'All';document.querySelectorAll('.mf383-faq-tab').forEach(b=>{const on=b===button;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});v383FaqFilter();};
function v383FactMarkup(){
  return `<section class="mf383-about-section"><div class="mf383-section-head"><div><span class="mf383-eyebrow">SMALL DETAILS. BIG UNIVERSE.</span><h2>Did you know?</h2><p>${V383_FACTS.length} little details from MediaFlow's journey and features.</p></div></div>
    <div class="mf383-fact-grid">${V383_FACTS.map((f,i)=>`<article class="mf383-fact"><span class="mf383-fact-num">${String(i+1).padStart(2,'0')}</span><span class="mf383-fact-symbol">${v383Icon(i%4===0?'sparkles':i%4===1?'layers':i%4===2?'book':'shield',18)}</span><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.description)}</p></article>`).join('')}</div>
  </section>`;
}
function v383AboutEvolution(){
  const chapters=[['The beginning','A personal media-rotation and Library workflow.'],['Building the foundation','History, statistics, customization, cloud tools and export/import.'],['Organizing everything','Personal Order, Collections and richer title management.'],['Logging evolved','Quick Logging, Advanced Logging, Seasons View and draft progress outlook.'],['Multi-source discovery','Five selectable episode-data integrations and Automatic Multi-Provider.'],['The intelligent era','Smarter episode verification, adaptive recommendations, and continuous improvements to performance, stability, and reliability.']];
  return `<section class="mf383-about-section"><div class="mf383-section-head"><div><span class="mf383-eyebrow">MEDIAFLOW EVOLUTION</span><h2>Built one improvement at a time.</h2><p>A look at the chapters that shaped the experience.</p></div></div><div class="mf383-timeline">${chapters.map((c,i)=>`<article class="mf383-timeline-row"><span class="mf383-timeline-marker">${String(i+1).padStart(2,'0')}</span><div><h3>${escapeHtml(c[0])}</h3><p>${escapeHtml(c[1])}</p></div></article>`).join('')}</div></section>`;
}
function v383RenderAbout(){
  const version=v161CurrentVersion();
  const data=[['Library titles',(S.library||[]).length],['Categories',(S.categories||[]).length],['History records',(S.sessions||[]).length]];
  return `<main class="v161-about mf383-about">
    <header class="mf383-about-hero"><div class="mf383-hero-glow" aria-hidden="true"></div><div class="mf383-hero-inner"><span class="mf383-hero-label">PERSONAL EDITION <span aria-hidden="true">✦</span> BY ALEX GODLY</span><div class="mf383-about-brand"><span class="mf383-brand-mark">${v383Icon('library',35)}</span><div><h1>MediaFlow<span class="mf383-hero-period">.</span></h1><span class="mf383-brand-version">VERSION ${escapeHtml(version)} · YOUR MEDIA UNIVERSE</span></div></div><p class="mf383-hero-description">One thoughtful home for everything you watch, read, track and love. Organized your way, at your pace.</p><div class="mf383-hero-actions"><a class="btn btn-primary" href="https://alexgodly.github.io/MediaFlow/" target="_blank" rel="noopener noreferrer">Open MediaFlow ↗</a><a class="btn" href="https://alexgodly.github.io/apps/" target="_blank" rel="noopener noreferrer">Explore other apps ↗</a></div></div><div class="mf383-hero-orbit" aria-hidden="true">${v383Icon('sparkles',75)}</div></header>
    <section class="mf383-about-stats" aria-label="Current Library overview">${data.map(([label,value])=>`<div class="mf383-stat"><strong>${Number(value||0).toLocaleString()}</strong><span>${escapeHtml(label)}</span></div>`).join('')}<div class="mf383-stat"><strong>v${escapeHtml(version)}</strong><span>Current release</span></div></section>
    <section class="mf383-about-section"><div class="mf383-section-head"><div><span class="mf383-eyebrow">MADE FOR THE WAY YOU CONSUME</span><h2>Everything in its place.</h2><p>MediaFlow brings planning, progress and discovery together without making you follow one rigid routine.</p></div></div><div class="mf383-feature-grid">
      ${v383AboutCard('library','Build your Library','Track titles across your own categories, statuses, seasons, priorities and covers.')}
      ${v383AboutCard('check','Log your progress','Quick Logging or Advanced Logging recording, with draft-aware progress previews.')}
      ${v383AboutCard('layers','Shape Personal Order','Arrange titles and assigned Collections into queues you control.')}
      ${v383AboutCard('sparkles','Discover and grow','Recommendations, XP, streaks, History, statistics and multi-provider episode detection.')}
      ${v383AboutCard('shield','Keep your data portable','Cloud Sync, backups, settings presets and dedicated export/import workflows.')}
      ${v383AboutCard('folder','Make it yours','Responsive layouts, adjustable navigation and dynamic visual themes.')}
    </div></section>
    ${v250AboutUpdateCardHtml()}
    ${v383AboutEvolution()}
    ${v383FaqMarkup()}
    ${v383FactMarkup()}
    <footer class="mf383-about-footer"><div><span class="mf383-eyebrow">CREATED WITH PURPOSE</span><h2>MediaFlow by Alex Godly</h2><p>Personal media management, refined through continuous iteration.</p></div><div class="mf383-footer-links"><a class="btn btn-primary" href="https://guns.lol/alexgodly" target="_blank" rel="noopener noreferrer">Contact developer ↗</a><a class="btn" href="https://alexgodly.github.io/apps/" target="_blank" rel="noopener noreferrer">Alex Godly Apps ↗</a></div></footer>
  </main>`;
}
renderAbout=v383RenderAbout;

/* Audit only: these checks inspect canonical serialization without
 * triggering a cloud write or performing destructive imports. */
function v383AuditPersistence(){
  const safe=(f)=>{try{return f();}catch(e){return {error:String(e?.message||e)}}};
  const cloud=safe(()=>snapshot()),backup=safe(()=>v148BuildFullBackup()),preset=safe(()=>v196BuildSettingsPreset()),order=safe(()=>v142OrderExportPayload()),collections=safe(()=>v281CollectionsExportPayload());
  const shape=x=>!!x&&typeof x==='object'&&!x.error;
  const includes=k=>shape(cloud)&&Object.prototype.hasOwnProperty.call(cloud,k);
  const ready={cloudSnapshot:shape(cloud),fullBackup:shape(backup),settingsPreset:shape(preset),personalOrderExport:shape(order),collectionsExport:shape(collections),syncNow:typeof App.syncNow==='function',fullDataExport:typeof App.exportJSON==='function',fullDataImport:typeof App.importJSON==='function',automaticBackup:typeof v148BuildFullBackup==='function',historyExport:typeof App.v271ExportConsumptionCSV==='function',settingsImport:typeof App.importSettingsPreset==='function',personalOrderImport:typeof App.v142ImportOrder==='function',collectionsImport:typeof App.v279ImportCollections==='function',xpCalculator:typeof calculateConsumptionXP==='function',automaticUpdate:typeof v161EnsureAutomaticUpdateCheck==='function'};
  const fields=['library','sessions','activityLog','settings','orderPlan','xpLedger','collections','collectionTombstones','completionTimeline'];
  const presence=Object.fromEntries(fields.map(k=>[k,{snapshot:includes(k),backup:shape(backup)&&Object.prototype.hasOwnProperty.call(backup,k)}]));
  const fingerprint={};
  if(typeof v250Fingerprint==='function')for(const key of fields){if(includes(key))fingerprint[key]=v250Fingerprint(cloud[key]);}
  let roundTrip=null;
  if(shape(backup)){try{const restored=JSON.parse(JSON.stringify(backup));roundTrip={ok:fields.every(k=>!Object.prototype.hasOwnProperty.call(backup,k)||JSON.stringify(backup[k])===JSON.stringify(restored[k])),checkedFields:fields.filter(k=>Object.prototype.hasOwnProperty.call(backup,k))};}catch(e){roundTrip={ok:false,error:String(e?.message||e)};}}
  return {release:383,roundTrip,cloudSyncSchema:201,fullBackupSchema:29,settingsPresetSchema:1,ready,presence,counts:{titles:Array.isArray(S.library)?S.library.length:0,logs:Array.isArray(S.sessions)?S.sessions.length:0,activity:Array.isArray(S.activityLog)?S.activityLog.length:0,collections:Array.isArray(S.collections)?S.collections.length:0},fingerprint,notes:['Read-only preflight; does not prove successful network synchronization','Import actions and live PWA installs require separate testing','Missing manifest fields may be stored in portableExtras or schema extensions']};
}
App.v383AuditPersistence=v383AuditPersistence;
/* Extend v250's protected Sync Now fingerprint verification to Collections and
 * newer non-Library account metadata without altering the schema. */
const v383VerifyCloudBase=v155VerifyCloudState;
v155VerifyCloudState=function(cloudState,expected){
  const result=v383VerifyCloudBase.apply(this,arguments)||{ok:true,missing:[]};
  const missing=[...(result.missing||[])];
  if(typeof v250Fingerprint==='function'){
    for(const key of ['collections','collectionTombstones','categoryRecovery','navigationLayout','oldSystem','ratingQueue']){
      if(!expected||!Object.prototype.hasOwnProperty.call(expected,key))continue;
      if(v250Fingerprint(cloudState?.[key])!==v250Fingerprint(expected[key]))missing.push(`${key} content`);
    }
  }
  return {ok:missing.length===0,missing:[...new Set(missing)]};
};

/* Both Full and Automatic Backup resolve the canonical final builder.
 * Annotate coverage in metadata without changing user-data schema or fields. */
const v383BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
  const data=v383BackupBase.apply(this,arguments);
  if(data&&typeof data==='object'){
    data.mediaFlowVersion=v161CurrentVersion();data.backupVersion=v161CurrentVersion();
    data.backupManifest=data.backupManifest||{};
    data.backupManifest.v383={release:383,cloudSyncSchema:201,backupSchema:29,settingsPresetSchema:1,coverage:'Snapshot-based serialization; validate cloud saves and import round trips on a test account',integrityCheck:'App.v383AuditPersistence()'};
  }
  return data;
};
backupSnapshot=function(){return v148BuildFullBackup();};
/* Keep new release stamps current for separately exported presets/order/collections.
 * Do not change their established schema versions. */
const v383PresetBase=v196BuildSettingsPreset;
v196BuildSettingsPreset=function(){const x=v383PresetBase.apply(this,arguments);if(x&&typeof x==='object'){x.mediaFlowVersion=v161CurrentVersion();x.presetManifest=x.presetManifest||{};x.presetManifest.v383={release:383,settingsPresetSchema:1};}return x;};
const v383OrderBase=v142OrderExportPayload;
v142OrderExportPayload=function(){const x=v383OrderBase.apply(this,arguments);if(x&&typeof x==='object')x.mediaFlowVersion=v161CurrentVersion();return x;};
const v383CollectionBase=v281CollectionsExportPayload;
v281CollectionsExportPayload=function(){const x=v383CollectionBase.apply(this,arguments);if(x&&typeof x==='object'){x.mediaFlowVersion=v161CurrentVersion();x.appVersion=383;}return x;};
window.MediaFlowV383={version:383,features:['Logging Library redesign','About Studio','Searchable FAQ and fun facts','Persistent-data preflight audit']};
MediaFlowRuntime.version=V383_RELEASE;
