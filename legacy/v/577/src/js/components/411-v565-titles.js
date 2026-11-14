/* MediaFlow v565 — titles: their own unit, and names in every language.
 *
 * Per-title unit (Library item fields)
 *   mf565Unit            text unit for this title ('' = the category's unit), e.g. 'matches'
 *   mf565SecondsPerUnit  runtime of one of this title's units in seconds (0 = the category's)
 * Logging, Batch Log, the task card, Title Details, History and Discord use the
 * title's unit. Amounts that belong to the CATEGORY (tasks, sessions, XP,
 * balance) are converted with the runtimes: 3 matches of 20 min = 1 session of
 * 60 min. Without its own runtime a title's unit counts 1 for 1.
 *
 * Title names (Library item fields)
 *   mf565Names         [{lang,text,source}]  names in other languages (manual or recovered)
 *   mf565NameLanguage  '' (follow settings) or a language code for this title
 *   mf565NameExempt    true: always show the main title, whatever the settings say
 * Settings (S.settings.mf565TitleNames)
 *   {global:'main'|lang, categories:{[categoryId]:lang}}
 * The main title (item.title) never changes: matching, imports, recovery
 * identity and History keep using it. Only what is shown changes, and search
 * finds a title by any of its names.
 */
const MF565_LANGS=Object.freeze([
  ['main','Main title'],['en','English'],['ja-Latn','Romanised Japanese'],['ja','Japanese'],
  ['zh','Chinese'],['zh-Latn','Romanised Chinese (pinyin)'],['ko','Korean'],['ko-Latn','Romanised Korean'],
  ['es','Spanish'],['fr','French'],['de','German'],['it','Italian'],['pt','Portuguese'],['ru','Russian'],
  ['ar','Arabic'],['th','Thai'],['vi','Vietnamese'],['id','Indonesian'],['other','Other']
]);
const MF565_LANG_CODES=new Set(MF565_LANGS.map(x=>x[0]));
const MF565_NAMES={map:new Map(),active:0,sig:''};

/* ---------- per-title unit ---------- */
function mf565CatSeconds(cat){
  if(Number.isFinite(Number(cat?.secondsPerUnit))&&Number(cat.secondsPerUnit)>0)return Math.floor(Number(cat.secondsPerUnit));
  return Math.max(0,Math.round((Number(cat?.minutesPerUnit)||0)*60));
}
function mf565OwnUnit(item){return String(item?.mf565Unit??'').trim().slice(0,40);}
function mf565UnitKey(item,cat){return mf565OwnUnit(item)||String(cat?.unit||'episodes');}
// Category units per one of this title's units.
function mf565UnitFactor(item,cat){
  if(!item||!mf565OwnUnit(item))return 1;
  const own=Math.floor(Number(item.mf565SecondsPerUnit)||0),base=mf565CatSeconds(cat);
  return own>0&&base>0?own/base:1;
}
function mf565ToCategoryAmount(item,cat,qty){
  const n=Math.max(0,Number(qty)||0),f=mf565UnitFactor(item,cat);
  return f===1?n:Math.round(n*f*100)/100;
}
function mf565TitleSeconds(item,cat){
  const own=Math.floor(Number(item?.mf565SecondsPerUnit)||0);
  return mf565OwnUnit(item)&&own>0?own:mf565CatSeconds(cat||getCategory(item?.categoryId||''));
}
// Custom units ("matches") read as typed; singular is a best guess.
function mf565Singular(word){
  const w=String(word||'');
  if(/(ch|sh|ss|x|z)es$/i.test(w))return w.slice(0,-2);
  if(/[^aeiou]ies$/i.test(w))return w.slice(0,-3)+'y';
  if(/[^s]s$/i.test(w))return w.slice(0,-1);
  return w;
}
const mf565UnitLabelBase=unitLabel;
unitLabel=function(unitKey,count){
  const key=String(unitKey??'');
  if(key&&!UNITS[key])return count===1?mf565Singular(key):key;
  return mf565UnitLabelBase.apply(this,arguments);
};
const mf565DefaultSecondsBase=v369DefaultSeconds;
v369DefaultSeconds=function(item){
  const own=Math.floor(Number(item?.mf565SecondsPerUnit)||0);
  if(mf565OwnUnit(item)&&own>0)return own;
  return mf565DefaultSecondsBase.apply(this,arguments);
};

/* ---------- names ---------- */
function mf565ScriptLang(text){
  const s=String(text||'');
  if(/[぀-ヿ]/.test(s))return 'ja';
  if(/[가-힯]/.test(s))return 'ko';
  if(/[一-鿿]/.test(s))return 'zh';
  return '';
}
// Every name a title has, tagged with its language when known.
function mf565Names(item){
  const out=[],seen=new Set();
  const add=(lang,text,source)=>{
    const t=cleanTitleBase(text);if(!t)return;
    const key=lang+'\u0001'+t.toLocaleLowerCase();if(seen.has(key))return;seen.add(key);
    out.push({lang:lang||'',text:t,source:source||''});
  };
  for(const n of Array.isArray(item?.mf565Names)?item.mf565Names:[])if(n&&typeof n==='object')add(MF565_LANG_CODES.has(n.lang)?n.lang:'other',n.text,n.source);
  if(item?.titleEnglish)add('en',item.titleEnglish,'metadata');
  if(item?.titleRomaji)add('ja-Latn',item.titleRomaji,'metadata');
  const original=item?.universalMetadata?.fields?.originalTitle?.value??item?.universalMetadata?.fields?.originalTitle??item?.originalTitle;
  if(original&&typeof original==='string')add(mf565ScriptLang(original)||'other',original,'metadata');
  const alt=item?.universalMetadata?.fields?.alternateTitles;
  for(const a of Array.isArray(alt?.value)?alt.value:Array.isArray(alt)?alt:[])if(typeof a==='string')add(mf565ScriptLang(a)||'',a,'metadata');
  return out;
}
function mf565NamePrefs(){
  const raw=S.settings?.mf565TitleNames||{};
  const global=MF565_LANG_CODES.has(raw.global)?raw.global:'main';
  const categories={};
  for(const [k,v] of Object.entries(raw.categories||{}))if(MF565_LANG_CODES.has(v))categories[String(k)]=v;
  return {global,categories};
}
function mf565NameLang(item,prefs=mf565NamePrefs()){
  if(item?.mf565NameExempt)return 'main';
  if(MF565_LANG_CODES.has(item?.mf565NameLanguage))return item.mf565NameLanguage;
  return prefs.categories[String(item?.categoryId||'')]||prefs.global;
}
// The name shown for a title. Falls back to the main title.
function mf565DisplayTitle(item,prefs=mf565NamePrefs()){
  const main=cleanTitleBase(item?.title);
  const lang=mf565NameLang(item,prefs);
  if(lang==='main')return main;
  const hit=mf565Names(item).find(n=>n.lang===lang);
  return hit?hit.text:main;
}
// Does a search query match any name of this title?
function mf565NameMatches(item,query){
  const q=String(query||'').trim().toLocaleLowerCase();
  if(!q)return true;
  if(cleanTitleBase(item?.title).toLocaleLowerCase().includes(q))return true;
  return mf565Names(item).some(n=>n.text.toLocaleLowerCase().includes(q));
}
function mf565SearchText(item){
  return [cleanTitleBase(item?.title),...mf565Names(item).map(n=>n.text)].join('\n').toLocaleLowerCase();
}
// The chosen name is applied to what is SHOWN only: after anything is drawn,
// text that is exactly a title's main name is replaced by its chosen name.
// cleanTitle(), attributes, inputs and saved data are never changed, so
// matching, imports, search indexes and History keep the main title.
const cleanTitleBase=cleanTitle;
function mf565RebuildNameMap(){
  const prefs=mf565NamePrefs();
  const lib=S.library||[];
  const sig=JSON.stringify(prefs)+'|'+lib.length+'|'+(MF565_NAMES.rev||0);
  if(sig===MF565_NAMES.sig)return false;
  const map=new Map(),clash=new Set();
  const anyCustom=prefs.global!=='main'||Object.keys(prefs.categories).length>0;
  for(const item of lib){
    if(!item)continue;
    if(!anyCustom&&!item.mf565NameLanguage)continue;
    const main=cleanTitleBase(item.title);if(!main)continue;
    if(clash.has(main))continue;
    const shown=mf565DisplayTitle(item,prefs);
    if(map.has(main)&&map.get(main)!==shown){map.delete(main);clash.add(main);continue;}
    if(shown!==main)map.set(main,shown);
  }
  MF565_NAMES.map=map;MF565_NAMES.sig=sig;
  return true;
}
function mf565NamesChanged(){MF565_NAMES.rev=(MF565_NAMES.rev||0)+1;mf565ScheduleNames(document.body);}
const MF565_NAME_SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','NOSCRIPT','CODE','PRE']);
function mf565ApplyNamesIn(root){
  if(!root||!MF565_NAMES.map.size)return 0;
  const map=MF565_NAMES.map;let n=0;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
    const p=node.parentElement;
    if(!p||MF565_NAME_SKIP.has(p.tagName)||p.isContentEditable)return NodeFilter.FILTER_REJECT;
    const t=node.nodeValue;return t&&t.length<=400?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;
  }});
  for(let node=walker.nextNode();node;node=walker.nextNode()){
    const t=node.nodeValue,k=t.trim(),shown=map.get(k);
    if(shown){node.nodeValue=t.replace(k,shown);n++;}
  }
  return n;
}
const MF565_NAME_QUEUE=new Set();let MF565_NAME_FRAME=0;
function mf565ScheduleNames(root){
  if(root)MF565_NAME_QUEUE.add(root);
  if(MF565_NAME_FRAME)return;
  MF565_NAME_FRAME=requestAnimationFrame(()=>{
    MF565_NAME_FRAME=0;
    let rebuilt=false;try{rebuilt=mf565RebuildNameMap();}catch(_){}
    const roots=rebuilt?[document.body]:[...MF565_NAME_QUEUE];
    MF565_NAME_QUEUE.clear();
    if(!MF565_NAMES.map.size)return;
    for(const r of roots)if(r&&r.isConnected)try{mf565ApplyNamesIn(r);}catch(_){}
  });
}
try{
  new MutationObserver(list=>{
    if(!MF565_NAMES.map.size&&MF565_NAMES.sig)return mf565RebuildNameMap()&&mf565ScheduleNames(document.body);
    for(const m of list)for(const node of m.addedNodes){
      if(node.nodeType===1)mf565ScheduleNames(node);
      else if(node.nodeType===3&&node.parentElement)mf565ScheduleNames(node.parentElement);
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
}catch(_){}
if(typeof persistLibrary==='function'){
  const base=persistLibrary;
  persistLibrary=function(){mf565NamesChanged();return base.apply(this,arguments);};
}

/* ---------- search finds every name ---------- */
const mf565BatchCandidatesBase=batchTitleCandidates;
batchTitleCandidates=function(query){
  const q=String(query||'').trim();
  if(!q)return [];
  const base=mf565BatchCandidatesBase.apply(this,arguments);
  if(base.length>=10)return base;
  const ids=new Set(base.map(x=>String(x.id)));
  for(const item of S.library||[]){
    if(base.length>=10)break;
    if(!item||item.status==='dropped'||ids.has(String(item.id)))continue;
    if(mf565NameMatches(item,q)){base.push(item);ids.add(String(item.id));}
  }
  return base;
};

/* ---------- recovery searches with every name, and keeps the names it finds ---------- */
const mf565TitleVariantsBase=mf439TitleVariants;
mf439TitleVariants=function(item){
  const base=mf565TitleVariantsBase.apply(this,arguments);
  const extra=mf565Names(item).map(n=>n.text);
  return [...new Set([...base,...extra].map(x=>String(x||'').trim()).filter(Boolean))];
};
function mf565RowNames(row){
  return (Array.isArray(row?.names)?row.names:[]).filter(n=>n&&n.text&&MF565_LANG_CODES.has(n.lang))
    .map(n=>({lang:n.lang,text:cleanTitleBase(n.text).slice(0,220),source:String(row.provider||'')}));
}
const mf565DiscoverBase=mf439Discover;
mf439Discover=async function(item){
  const out=await mf565DiscoverBase.apply(this,arguments);
  try{
    const threshold=mf439Preferences().minimumConfidence;
    const names=[];
    for(const row of out?.results||[])if(mf439Evidence(item,row).confidence>=threshold)names.push(...mf565RowNames(row));
    if(out?.preview)out.preview.mf565Names=names;
  }catch(_){}
  return out;
};
// Adds names this title doesn't have yet. Never removes or edits a name.
function mf565AddNames(item,names){
  if(!item||!Array.isArray(names)||!names.length)return 0;
  const have=new Set(mf565Names(item).map(n=>n.lang+'\u0001'+n.text.toLocaleLowerCase()));
  const list=Array.isArray(item.mf565Names)?item.mf565Names:[];
  let added=0;
  for(const n of names){
    const key=n.lang+'\u0001'+String(n.text).toLocaleLowerCase();
    if(have.has(key)||cleanTitleBase(item.title).toLocaleLowerCase()===String(n.text).toLocaleLowerCase())continue;
    have.add(key);list.push({lang:n.lang,text:n.text,source:n.source||''});added++;
  }
  if(added){item.mf565Names=list.slice(0,60);mf565NamesChanged();}
  return added;
}
const mf565ApplyBase=mf439Apply;
mf439Apply=function(item,preview){
  const result=mf565ApplyBase.apply(this,arguments);
  try{
    const added=mf565AddNames(item,preview?.mf565Names);
    if(added){
      item.modifiedAt=Math.max(Number(item.modifiedAt)||0,Date.now());
      if(result&&typeof result==='object'){result.names=added;if(!result.changed)result.changed=added;}
    }
  }catch(_){}
  return result;
};

/* ---------- title editor: unit, runtime, names ---------- */
function mf565Hms(seconds){
  const t=Math.max(0,Math.floor(Number(seconds)||0));
  return [Math.floor(t/3600),Math.floor(t%3600/60),t%60];
}
function mf565EditorSection(item){
  const cat=getCategory(item?.categoryId||S.modal?.categoryId||'');
  const own=mf565OwnUnit(item),secs=Math.floor(Number(item?.mf565SecondsPerUnit)||0),hms=mf565Hms(secs);
  const unitOptions=Object.keys(UNITS).map(k=>'<option value="'+escapeHtml(k)+'">').join('');
  const names=Array.isArray(item?.mf565Names)?item.mf565Names:[];
  const langOptions=sel=>MF565_LANGS.filter(l=>l[0]!=='main').map(([v,l])=>'<option value="'+v+'"'+(v===sel?' selected':'')+'>'+escapeHtml(l)+'</option>').join('');
  const nameRow=(n,i)=>'<div class="mf565-name-row" data-mf565-name-row="'+i+'"><select data-mf565-name-lang aria-label="Language">'+langOptions(n?.lang||'en')+'</select>'+
    '<input type="text" data-mf565-name-text maxlength="220" value="'+escapeHtml(n?.text||'')+'" placeholder="Name in this language">'+
    '<button type="button" class="btn btn-sm btn-ghost" onclick="this.closest(\'.mf565-name-row\').remove()" aria-label="Remove name">✕</button></div>';
  const shown=MF565_LANGS.map(([v,l])=>'<option value="'+v+'"'+((item?.mf565NameLanguage||'')===v?' selected':'')+'>'+escapeHtml(l)+'</option>').join('');
  return '<div class="mf565-editor" data-mf565-editor>'+
    '<div class="section-label">UNIT &amp; NAMES</div>'+
    '<div class="field-row">'+
      '<div class="field"><label class="field-label" for="mf565-unit">Unit for this title</label>'+
        '<input id="mf565-unit" list="mf565-unit-list" maxlength="40" value="'+escapeHtml(own)+'" placeholder="'+escapeHtml(unitLabel(cat?.unit,2))+' (category)">'+
        '<datalist id="mf565-unit-list">'+unitOptions+'</datalist>'+
        '<small class="hint">Empty uses the category\'s unit. Example: "matches" for a game in a category counted in sessions.</small></div>'+
      '<div class="field"><label class="field-label">Runtime per unit</label><div class="mf565-hms">'+
        ['Hours','Minutes','Seconds'].map((l,i)=>'<label>'+l+' <input type="number" min="0" max="'+(i===0?'9999':'59')+'" data-mf565-hms="'+i+'" value="'+(secs?hms[i]:'')+'" placeholder="'+(i===0?'0':'00')+'"></label>').join('')+
        '</div><small class="hint">Used for time and for converting to the category\'s unit in tasks. Empty: the category\'s runtime.</small></div>'+
    '</div>'+
    '<div class="field"><label class="field-label">Names</label><div class="mf565-names">'+names.map(nameRow).join('')+'</div>'+
      '<button type="button" class="btn btn-sm" onclick="App.mf565AddNameRow(this)">+ Add a name</button>'+
      '<small class="hint">Names found by Details Recovery are added here. Search finds this title by any of its names.</small></div>'+
    '<div class="field-row">'+
      '<div class="field"><label class="field-label" for="mf565-name-lang">Name shown for this title</label><select id="mf565-name-lang">'+
        '<option value=""'+(!item?.mf565NameLanguage?' selected':'')+'>Follow settings</option>'+shown+'</select></div>'+
      '<label class="field mf565-check"><input type="checkbox" id="mf565-name-exempt"'+(item?.mf565NameExempt?' checked':'')+'><span>Not affected by title-language settings (always the main title)</span></label>'+
    '</div></div>';
}
function mf565AddNameRow(button){
  const box=button?.parentElement?.querySelector('.mf565-names');if(!box)return;
  const tmp=document.createElement('div');
  tmp.innerHTML=mf565EditorSection({mf565Names:[{lang:'en',text:''}]}).match(/<div class="mf565-name-row"[\s\S]*?<\/button><\/div>/)?.[0]||'';
  const row=tmp.firstElementChild;if(row){box.appendChild(row);row.querySelector('input')?.focus();}
}
const mf565EditorBase=libraryModalHtml;
libraryModalHtml=function(item){
  const html=String(mf565EditorBase.apply(this,arguments)||'');
  if(html.includes('data-mf565-editor'))return html;
  const at=html.lastIndexOf('<div class="modal-actions');
  const section=mf565EditorSection(item&&typeof item==='object'?item:(S.library||[]).find(x=>String(x?.id)===String(S.modal?.id||'')));
  return at<0?html+section:html.slice(0,at)+section+html.slice(at);
};
function mf565ReadEditor(){
  const root=document.querySelector('[data-mf565-editor]');
  if(!root)return null;
  const unit=String(root.querySelector('#mf565-unit')?.value||'').trim().slice(0,40);
  const hms=[...root.querySelectorAll('[data-mf565-hms]')].map(x=>Math.max(0,Math.floor(Number(x.value)||0)));
  const secs=hms.length===3?hms[0]*3600+Math.min(59,hms[1])*60+Math.min(59,hms[2]):0;
  const names=[...root.querySelectorAll('.mf565-name-row')].map(r=>({
    lang:r.querySelector('[data-mf565-name-lang]')?.value||'other',
    text:cleanTitleBase(r.querySelector('[data-mf565-name-text]')?.value||'').slice(0,220)})).filter(n=>n.text&&MF565_LANG_CODES.has(n.lang));
  const lang=root.querySelector('#mf565-name-lang')?.value||'';
  return {unit,secs,names,lang:MF565_LANG_CODES.has(lang)?lang:'',exempt:!!root.querySelector('#mf565-name-exempt')?.checked};
}
function mf565WriteEditor(item,data,before){
  if(!item||!data)return false;
  let changed=false;
  const set=(k,v,empty)=>{const now=item[k]??empty;if(JSON.stringify(now)!==JSON.stringify(v)){if(v===empty||(Array.isArray(v)&&!v.length&&empty===undefined))delete item[k];else item[k]=v;changed=true;}};
  set('mf565Unit',data.unit,'');
  set('mf565SecondsPerUnit',data.unit&&data.secs>0?data.secs:0,0);
  // Keep where each name came from when it is unchanged.
  const old=Array.isArray(before)?before:[];
  const names=data.names.map(n=>{const o=old.find(x=>x&&x.lang===n.lang&&String(x.text)===n.text);return {lang:n.lang,text:n.text,source:o?.source||'manual'};});
  if(JSON.stringify(old.map(n=>[n.lang,n.text]))!==JSON.stringify(names.map(n=>[n.lang,n.text]))){if(names.length)item.mf565Names=names;else delete item.mf565Names;changed=true;}
  set('mf565NameLanguage',data.lang,'');
  set('mf565NameExempt',data.exempt,false);
  if(changed){item.modifiedAt=Math.max(Number(item.modifiedAt)||0,Date.now());mf565NamesChanged();}
  return changed;
}
const mf565SaveEditorBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
  const data=mf565ReadEditor();
  const existing=id?(S.library||[]).find(x=>String(x?.id)===String(id)):null;
  const before=existing?JSON.parse(JSON.stringify(existing.mf565Names||[])):[];
  const previous=id?null:new Set((S.library||[]).map(x=>String(x?.id)));
  const result=mf565SaveEditorBase.apply(this,arguments);
  const finish=()=>{
    if(!data)return;
    const item=existing||(S.library||[]).find(x=>x?.id&&!previous.has(String(x.id)));
    if(item&&mf565WriteEditor(item,data,before))try{persistLibrary();}catch(_){}
  };
  if(result&&typeof result.then==='function')return result.then(v=>{finish();return v;});
  finish();return result;
};

/* ---------- settings: title names ---------- */
function mf565NamesSettingsHtml(){
  const p=mf565NamePrefs();
  const opts=sel=>MF565_LANGS.map(([v,l])=>'<option value="'+v+'"'+(v===sel?' selected':'')+'>'+escapeHtml(l)+'</option>').join('');
  const cats=(S.categories||[]).filter(c=>c&&c.enabled!==false);
  return '<div class="mf565-names-settings">'+
    '<div class="mf565-setting-row" data-mf565-setting="names-global"><div><b>Show titles in</b><small>Used everywhere a title name appears. If a title has no name in this language, its main title is shown.</small></div>'+
      '<select onchange="App.mf565SetNameLang(\'\',this.value)">'+opts(p.global)+'</select></div>'+
    '<div class="mf565-setting-row" data-mf565-setting="names-categories"><div><b>Per category</b><small>Overrides the setting above for one category. A title\'s own choice overrides both.</small></div></div>'+
    '<div class="mf565-cat-langs">'+cats.map(c=>'<label class="mf565-cat-lang"><span>'+v144CategoryIconHtml(c)+' '+escapeHtml(c.name||'Category')+'</span>'+
      '<select onchange="App.mf565SetNameLang(\''+escapeHtml(String(c.id))+'\',this.value)"><option value=""'+(p.categories[String(c.id)]?'':' selected')+'>Same as above</option>'+opts(p.categories[String(c.id)]||'__')+'</select></label>').join('')+'</div>'+
  '</div>';
}
function mf565SetNameLang(categoryId,value){
  S.settings=S.settings||{};
  const p=mf565NamePrefs();
  if(!categoryId){if(MF565_LANG_CODES.has(value))p.global=value;}
  else if(value&&MF565_LANG_CODES.has(value))p.categories[String(categoryId)]=value;
  else delete p.categories[String(categoryId)];
  S.settings.mf565TitleNames=p;
  mf565NamesChanged();
  try{const saved=persistSettings();if(saved&&typeof saved.catch==='function')saved.catch(()=>{});}catch(_){}
  render();
}
function mf565MountNamesSettings(){
  if(String(S.view)!=='settings'||!window.MediaFlowSettingsCenter?.mountSection)return;
  if(document.querySelector('.mf565-names-settings'))return;
  const node=document.createElement('div');node.innerHTML=mf565NamesSettingsHtml();
  window.MediaFlowSettingsRegistry?.registerSetting?.({id:'mf565-title-language',section:'mf565-title-names',selector:'[data-mf565-setting="names-global"]',
    label:'Title name language',subgroup:'Display',keywords:['language','english','romaji','japanese','native','name','title','alternative names']});
  window.MediaFlowSettingsCenter.mountSection({id:'mf565-title-names',title:'Title Names',category:'library',subgroup:'Display',
    keywords:['language','english','romaji','japanese','chinese','korean','name','alternative titles'],nodes:[node]});
}
MediaFlowRuntime.registerPageEnhancer('settings',mf565MountNamesSettings);

Object.assign(App,{mf565AddNameRow,mf565SetNameLang});
window.MediaFlowV565=Object.assign(window.MediaFlowV565||{},{
  unitKey:mf565UnitKey,unitFactor:mf565UnitFactor,toCategoryAmount:mf565ToCategoryAmount,titleSeconds:mf565TitleSeconds,
  names:mf565Names,displayTitle:mf565DisplayTitle,nameMatches:mf565NameMatches,addNames:mf565AddNames
});
