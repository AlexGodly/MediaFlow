/* ============================================================

   STATE

   ============================================================ */

let S = {

  categories: null,

  categoryOrder: [],

  library: null,

  sessions: null,

  settings: null,

  currentTask: null,

  sessionActive: false,

  view: 'dashboard',

  loading: true,

  modal: null,          // {type:'category'|'library', data:{...}} or null

  logging: false,       // is the inline log form open on the hero

  logDraft: {},

  entryDraft: {title:'', qty:1},
  batchDraft: {rows:[], note:'', date:''},

  histFilters: {category:'all', type:'all', range:'all'},
  histPage: 0,
  histPageSize: 10,

  showReasonDetail: false,

  profileReturnView: 'dashboard',

  profilePicture: '',
  offlineMode: false,
  stopwatch: {running:false, startedAt:0, elapsed:0, resetValue:0},
  malLink: {username:'', mode:'anime'},
  xpLedger: {libraryAdditions:{}},
  completionTimeline: [],
  statsRecapMonth: '',
  statsHeatmapYear: '',

  // v138: lightweight personal title-order planner. This is deliberately
  // independent from scheduler recommendations, History, progress and XP.
  orderPlan: {
    titleIds: [],
    viewMode: 'all',
    categoryMode: 'default',
    categoryOrder: [],
    hiddenCategories: [],
    modifiedAt: 0,
    lastClearedOrder: null
  },

};

/* ============================================================

   STORAGE

   All app data lives under ONE key so every save is a single atomic

   write — this avoids the race where a quick refresh lands between

   several in-flight writes and loses data. Every mutation calls

   saveState() and AWAITS it before anything else can run.

   ============================================================ */

/* ============================================================
   MediaFlow v63 — Cloud Library History Persistence
   Library History (activityLog) is now part of the canonical cloud
   snapshot and cloud/local merge path, so it follows the account
   across devices instead of starting empty on each browser.
   ============================================================ */
/* ============================================================
   MediaFlow v63 — Library History XP Visibility
   Library History entries now store the XP earned by the exact
   tracked Library transaction and render it beside the action.
   ============================================================ */
