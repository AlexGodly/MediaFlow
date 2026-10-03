/* MediaFlow v201 source fragment
 * Canonical application state
 * Original HTML lines 6630-6695.
 * Build order matters; see scripts/build.mjs.
 */

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
  histPageSize: 50,

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
