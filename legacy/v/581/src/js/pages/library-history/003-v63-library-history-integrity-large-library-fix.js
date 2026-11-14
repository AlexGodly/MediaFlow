/* ============================================================
   MediaFlow v63 — Library History Integrity & Large-Library Fix
   - exact Library IDs for new history events
   - no substring title guessing
   - safe exact-match migration for legacy history
   - one-pass lookup maps for large libraries
   - XP history preserved without re-awarding
   ============================================================ */
const STATE_KEY = 'mf_state_v2';

const LEGACY_KEYS = ['mf_categories','mf_library','mf_sessions','mf_settings','mf_currentTask','mf_sessionActive'];

let saveQueue = Promise.resolve();

let lastSaveFailed = false;

let STORAGE_MODE = 'cloud';
const CLOUD_CACHE_KEY='mf_cloud_cache_v1';
let memoryStore={};
async function localRawGet(key){try{const v=localStorage.getItem(key);return v===null?undefined:JSON.parse(v);}catch(e){return undefined;}}
function localSetRaw(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}

