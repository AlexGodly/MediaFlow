/* MediaFlow v437 — additive, versioned universal title metadata.
 * Existing personal ratings, progress, dates, categories and legacy rich fields
 * are NEVER rewritten by this module. No category implies a mandatory media type.
 * Provider recovery remains disabled until the later recovery phase. */
const MF437_SCHEMA_VERSION=1;
const MF437_MEDIA_TYPES=[
 ['unspecified','Not specified / all providers'],['anime','Anime'],['manga','Manga / manhwa / manhua'],
 ['movie','Movie'],['tv','TV / series'],['book','Book / audiobook'],
 ['comic','Comic / graphic novel'],['game','Video game'],['visual_novel','Visual novel'],
 ['music','Music / album'],['interactive_fiction','Interactive fiction'],['other','Other media']
];
const MF437_FIELDS=[
 ['shared','Shared metadata',[
  ['originalTitle','Original title'],['alternateTitles','Alternate titles','list'],
  ['originalLanguage','Original language'],['countries','Countries of origin','list'],
  ['creators','Creators','list'],['keywords','Keywords','list'],['releaseStatus','Release status'],
  ['franchise','Franchise / universe'],['officialWebsite','Official website','url'],
  ['awards','Awards / nominations','list']
 ]],
 ['anime','Anime',[
  ['animeSeason','Broadcast season'],['animeLicensors','Licensors','list'],
  ['animeVoiceCast','Voice cast','list'],['animeBroadcast','Broadcast schedule']
 ]],
 ['manga','Manga / comics from Asia',[
  ['mangaAuthors','Authors','list'],['mangaArtists','Artists / illustrators','list'],
  ['serialization','Serialization / magazine'],['mangaPublisher','Publisher'],
  ['chapterCount','Chapters','number'],['volumeCount','Volumes','number']
 ]],
 ['movie','Movies',[
  ['directors','Directors','list'],['screenwriters','Screenwriters','list'],
  ['cast','Cast','list'],['distributors','Distributors','list'],
  ['productionCountries','Production countries','list'],['boxOffice','Box office'],
  ['budget','Production budget']
 ]],
 ['tv','TV / series',[
  ['tvCreators','Series creators','list'],['tvCast','Cast','list'],['networks','Networks','list'],
  ['showrunners','Showrunners','list'],['seasonCount','Seasons','number'],
  ['episodeCount','Episodes','number'],['broadcastStatus','Broadcast status']
 ]],
 ['book','Books / audiobooks',[
  ['authors','Authors','list'],['editors','Editors','list'],['translators','Translators','list'],
  ['narrators','Narrators','list'],['bookPublishers','Publishers','list'],
  ['pageCount','Pages','number'],['bookSeries','Book series'],['bookEdition','Edition']
 ]],
 ['comic','Comics / graphic novels',[
  ['comicWriters','Writers','list'],['comicArtists','Artists','list'],
  ['comicInkers','Inkers','list'],['comicColorists','Colorists','list'],
  ['comicLetterers','Letterers','list'],['comicPublisher','Publisher'],
  ['issueCount','Issues','number'],['comicImprint','Imprint']
 ]],
 ['game','Video games',[
  ['gameDevelopers','Developers','list'],['gamePublishers','Publishers','list'],
  ['platforms','Platforms','list'],['gameEngine','Game engine'],
  ['gameModes','Game modes','list'],['gameSeries','Series'],
  ['esrbRating','ESRB rating'],['pegiRating','PEGI rating'],
  ['mainStoryHours','Main story hours','decimal']
 ]],
 ['visual_novel','Visual novels',[
  ['vnDevelopers','Developers','list'],['vnPublishers','Publishers','list'],
  ['vnEngine','Engine'],['vnRoutes','Routes','list'],['vnEndings','Endings','number'],
  ['vnCharacters','Characters','list'],['vnVoices','Voice actors','list']
 ]],
 ['music','Music / albums',[
  ['albumArtists','Album artists','list'],['featuredArtists','Featured artists','list'],
  ['composers','Composers','list'],['recordLabels','Labels','list'],
  ['releaseType','Release type'],['trackCount','Tracks','number'],
  ['discCount','Discs','number'],['catalogNumber','Catalog number'],
  ['tracklist','Tracklist (one track per line)','multiline']
 ]],
 ['interactive_fiction','Interactive fiction',[
  ['ifAuthors','Authors','list'],['ifEngine','Engine / system'],['ifFormat','Format'],
  ['ifParser','Parser / choice-based'],['ifPlatforms','Platforms','list'],
  ['ifCharacters','Characters','list'],['ifPlaytimeMinutes','Playtime (minutes)','number']
 ]]
];
/* Numeric scores are recorded in their ORIGINAL scales, never silently coerced
 * into a personal rating or the old generic communityScore field. */
const MF437_RATING_SOURCES=[
 ['imdb','IMDb',10],['trakt','Trakt',10],
 ['rottentomatoes_critics','Rotten Tomatoes · Critics',100],
 ['rottentomatoes_audience','Rotten Tomatoes · Audience',100],
 ['mal','MyAnimeList',10],['anilist','AniList',100],['kitsu','Kitsu',100],
 ['tmdb','TMDB',10],['simkl','SIMKL',10],['anidb','AniDB',10],
 ['tvmaze','TVmaze',10],['metacritic','Metacritic',100],
 ['letterboxd','Letterboxd',5],['goodreads','Goodreads',5],
 ['storygraph','The StoryGraph',5],['hardcover','Hardcover',5],
 ['igdb','IGDB',100],['opencritic','OpenCritic',100],
 ['steam','Steam · Positive reviews (%)',100],['backloggd','Backloggd',5],
 ['vndb','VNDB',10],['mangaupdates','MangaUpdates',10],
 ['rateyourmusic','Rate Your Music',5],['discogs','Discogs',5],
 ['ifdb','IFDB',5]
];
const MF437_ADDITIONAL_IDS=[
 ['igdb','IGDB'],['steam_app','Steam App'],['gog','GOG'],['rawg','RAWG'],
 ['mobygames','MobyGames'],['giantbomb','Giant Bomb'],
 ['opencritic','OpenCritic'],['howlongtobeat','HowLongToBeat'],['vndb','VNDB'],
 ['itch','itch.io'],['vgmdb','VGMdb'],['musicbrainz_release','MusicBrainz Release'],
 ['musicbrainz_release_group','MusicBrainz Release Group'],
 ['musicbrainz_recording','MusicBrainz Recording'],['musicbrainz_artist','MusicBrainz Artist'],
 ['discogs_release','Discogs Release'],['discogs_master','Discogs Master'],
 ['spotify_album','Spotify Album'],['apple_music_album','Apple Music Album'],
 ['ifdb','IFDB Interactive Fiction'],['ifwiki','IFWiki'],['opencritic_game','OpenCritic Game']
];
for(const [key,label] of MF437_ADDITIONAL_IDS){
 if(!V377_ID_PROVIDERS.some(row=>row[0]===key))
  V377_ID_PROVIDERS.push([key,label,'Optional verified provider ID']);
}
const MF437_FIELD_MAP=new Map(MF437_FIELDS.flatMap(([, ,fields])=>fields.map(f=>[f[0],f])));
const MF437_RATING_MAP=new Map(MF437_RATING_SOURCES.map(x=>[x[0],x]));
const mf437Object=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const mf437Copy=x=>JSON.parse(JSON.stringify(x));
function mf437Normalized(input){
 const d=mf437Object(input);
 return {
  ...d,schemaVersion:Math.max(MF437_SCHEMA_VERSION,Number(d.schemaVersion)||0),
  mediaType:MF437_MEDIA_TYPES.some(t=>t[0]===d.mediaType)?d.mediaType:'unspecified',
  fields:{...mf437Object(d.fields)},
  externalRatings:{...mf437Object(d.externalRatings)},
  provenance:{...mf437Object(d.provenance)},
  locks:{...mf437Object(d.locks)},
  updatedAt:Math.max(0,Number(d.updatedAt)||0)
 };
}
function mf437Clean(value,type='text'){
 if(type==='list'){
  const raw=Array.isArray(value)?value:String(value||'').split(',');
  return [...new Set(raw.map(v=>String(v??'').trim().slice(0,180)).filter(Boolean))].slice(0,100);
 }
 if(type==='number'||type==='decimal'){
  if(value===null||String(value).trim()==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>=0&&n<=1e9
   ?(type==='number'?Math.floor(n):Math.round(n*100)/100):null;
 }
 if(type==='url'){
  const str=String(value||'').trim();
  if(!str)return '';
  try{const url=new URL(str);return ['https:','http:'].includes(url.protocol)?url.href.slice(0,1200):'';}
  catch(_){return '';}
 }
 return String(value??'').trim().slice(0,type==='multiline'?12000:800);
}
function mf437FieldCompare(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function mf437SetField(env,key,value,{source='manual',verified=false,force=false,updatedAt=Date.now()}={}){
 const def=MF437_FIELD_MAP.get(key);
 if(!def)return false;
 const clean=mf437Clean(value,def[2]);
 const token='field.'+key;
 if(source!=='manual'){
  if(!verified||env.locks[token]===true)return false;
  const present=env.fields[key]!=null&&env.fields[key]!==''&&(!Array.isArray(env.fields[key])||env.fields[key].length>0);
  if(present&&!force)return false;
 }
 if(mf437FieldCompare(clean,env.fields[key]))return false;
 env.fields[key]=clean;
 env.provenance[token]={source,verified:!!verified,updatedAt};
 if(source==='manual')env.locks[token]=true;
 env.updatedAt=Math.max(env.updatedAt,updatedAt);
 return true;
}
function mf437SetRating(env,key,rating,{source='manual',verified=false,force=false,updatedAt=Date.now()}={}){
 const def=MF437_RATING_MAP.get(key);
 if(!def)return false;
 const token='rating.'+key;
 if(source!=='manual'&&(!verified||env.locks[token]===true))return false;
 const incoming=mf437Object(rating);
 const score=(incoming.score===null||incoming.score===undefined||String(incoming.score).trim()==='')?null:Number(incoming.score);
 const scale=Number(incoming.scale??def[2]);
 const votes=(incoming.votes===null||incoming.votes===undefined||String(incoming.votes).trim()==='')?null:Number(incoming.votes);
 if((score!==null&&!Number.isFinite(score))||!Number.isFinite(scale)||scale<=0||scale>100000||
   (score!==null&&(score<0||score>scale))||(votes!==null&&(!Number.isSafeInteger(votes)||votes<0)))return false;
 const url=mf437Clean(incoming.url||'','url');
 const existing=mf437Object(env.externalRatings[key]);
 if(source!=='manual'&&existing.score!=null&&!force)return false;
 const normalized={score,scale,votes,url,updatedAt,source};
 if(mf437FieldCompare({score:existing.score??null,scale:existing.scale??def[2],votes:existing.votes??null,url:existing.url||''},
                        {score,scale,votes,url}))return false;
 env.externalRatings[key]=normalized;
 env.provenance[token]={source,verified:!!verified,updatedAt};
 if(source==='manual')env.locks[token]=true;
 env.updatedAt=Math.max(env.updatedAt,updatedAt);
 return true;
}
/* Adapter-safe, NOT a public API request. Requires actual verified provider
 * evidence; cannot change personal score, progress, total, dates or IDs. */
function mf437ApplyVerifiedProvider(item,provider,payload={},options={}){
 if(!item||!provider||options.verified!==true)return {changed:false,fields:0,ratings:0};
 const env=mf437Normalized(item.universalMetadata);
 let fields=0,ratings=0;
 for(const [key,value] of Object.entries(mf437Object(payload.fields)))
  if(mf437SetField(env,key,value,{source:provider,verified:true,force:options.overwrite===true}))fields++;
 for(const [key,value] of Object.entries(mf437Object(payload.ratings)))
  if(mf437SetRating(env,key,value,{source:provider,verified:true,force:options.overwrite===true}))ratings++;
 if(fields||ratings){
  item.universalMetadata=env;
  item.modifiedAt=Math.max(Number(item.modifiedAt)||0,env.updatedAt);
 }
 return {changed:fields+ratings>0,fields,ratings};
}
/* Merge per-field to avoid dropping metadata added on another device. Explicit
 * manual clears (empty/zero) remain tombstones instead of resurrecting stale data. */
function mf437MergeEnvelope(a,b){
 if(!a&&!b)return null;
 if(!a)return mf437Normalized(b);
 if(!b)return mf437Normalized(a);
 const left=mf437Normalized(a),right=mf437Normalized(b);
 const out=mf437Normalized((right.updatedAt||0)>(left.updatedAt||0)?right:left);
 out.fields={};out.externalRatings={};out.provenance={};out.locks={};
 const tokens=new Set([
  ...Object.keys(left.fields).map(k=>'field.'+k),
  ...Object.keys(right.fields).map(k=>'field.'+k),
  ...Object.keys(left.externalRatings).map(k=>'rating.'+k),
  ...Object.keys(right.externalRatings).map(k=>'rating.'+k),
  ...Object.keys(left.provenance),...Object.keys(right.provenance),
  ...Object.keys(left.locks),...Object.keys(right.locks)
 ]);
 for(const token of tokens){
  if(token!=='mediaType'&&!token.startsWith('field.')&&!token.startsWith('rating.'))continue;
  const isRating=token.startsWith('rating.'),key=token.slice(token.indexOf('.')+1);
  const lvalue=isRating?left.externalRatings[key]:left.fields[key];
  const rvalue=isRating?right.externalRatings[key]:right.fields[key];
  const lp=mf437Object(left.provenance[token]),rp=mf437Object(right.provenance[token]);
  const lt=Number(lp.updatedAt)||0,rt=Number(rp.updatedAt)||0;
  const rightWins=rt>lt||(rt===lt&&right.updatedAt>left.updatedAt);
  const chosen=rightWins?right:left,other=rightWins?left:right;
  const value=isRating?chosen.externalRatings[key]:chosen.fields[key];
  const fallback=isRating?other.externalRatings[key]:other.fields[key];
  const resolved=value!==undefined?value:fallback;
  if(resolved!==undefined){
   if(isRating)out.externalRatings[key]=mf437Copy(resolved);
   else out.fields[key]=mf437Copy(resolved);
  }
  out.provenance[token]={...mf437Object(other.provenance[token]),...mf437Object(chosen.provenance[token])};
  if(Object.prototype.hasOwnProperty.call(chosen.locks,token))out.locks[token]=chosen.locks[token]===true;
  else if(Object.prototype.hasOwnProperty.call(other.locks,token))out.locks[token]=other.locks[token]===true;
 }
 // Media type is an optional user hint, not an inferred category restriction.
 const lmt=Number(left.provenance.mediaType?.updatedAt)||0;
 const rmt=Number(right.provenance.mediaType?.updatedAt)||0;
 out.mediaType=rmt>lmt||(rmt===lmt&&right.updatedAt>left.updatedAt)?right.mediaType:left.mediaType;
 if(out.mediaType==='unspecified'){
  const alternate=out===right?left.mediaType:right.mediaType;
  if(!lmt&&!rmt&&alternate!=='unspecified')out.mediaType=alternate;
 }
 out.updatedAt=Math.max(left.updatedAt,right.updatedAt);
 out.schemaVersion=Math.max(left.schemaVersion,right.schemaVersion);
 return out;
}
const mf437CloudMergeBase=v84MergeLibraryItem;
v84MergeLibraryItem=function(left,right){
 const merged=mf437CloudMergeBase.apply(this,arguments);
 if(merged&&(left?.universalMetadata||right?.universalMetadata))
  merged.universalMetadata=mf437MergeEnvelope(left?.universalMetadata,right?.universalMetadata);
 return merged;
};
function mf437EditorField(item,f){
 const env=mf437Normalized(item?.universalMetadata),key=f[0],type=f[2]||'text';
 const value=env.fields[key],list=type==='list';
 const shown=list?(Array.isArray(value)?value.join(', '):''):String(value??'');
 const token='field.'+key,src=env.provenance[token]?.source||'';
 const lock=env.locks[token]===true;
 const editor=type==='multiline'
  ?'<textarea data-mf437-field="'+escapeHtml(key)+'" rows="4" placeholder="One entry per line">'+escapeHtml(shown)+'</textarea>'
  :'<input data-mf437-field="'+escapeHtml(key)+'" type="'+(type==='number'||type==='decimal'?'number':type==='url'?'url':'text')+'"'+
    (type==='number'?' min="0" step="1"':type==='decimal'?' min="0" step="0.01"':'')+
    ' value="'+escapeHtml(shown)+'"'+(list?' placeholder="Comma separated"':'')+'>';
 return '<div class="mf437-field"><label><span>'+escapeHtml(f[1])+'</span>'+editor+'</label>'+
  '<label class="mf437-lock"><input type="checkbox" data-mf437-lock="'+escapeHtml(token)+'" '+(lock?'checked':'')+'> Protect</label>'+
  (src?'<small>Source: '+escapeHtml(src)+'</small>':'')+'</div>';
}
function mf437EditorRatings(item){
 const env=mf437Normalized(item?.universalMetadata);
 return MF437_RATING_SOURCES.map(([key,label,defaultScale])=>{
  const r=mf437Object(env.externalRatings[key]),token='rating.'+key;
  const prov=mf437Object(env.provenance[token]);
  return '<div class="mf437-rating"><strong>'+escapeHtml(label)+'</strong>'+
   '<label>Score<input type="number" min="0" step="any" data-mf437-rating="'+escapeHtml(key)+'" value="'+escapeHtml(String(r.score??''))+'" placeholder="—"></label>'+
   '<label>Out of<input type="number" min="0.01" step="any" data-mf437-scale="'+escapeHtml(key)+'" value="'+escapeHtml(String(r.scale??defaultScale))+'"></label>'+
   '<label>Votes<input type="number" min="0" step="1" data-mf437-votes="'+escapeHtml(key)+'" value="'+escapeHtml(String(r.votes??''))+'"></label>'+
   '<label class="mf437-lock"><input type="checkbox" data-mf437-lock="'+escapeHtml(token)+'" '+(env.locks[token]===true?'checked':'')+'> Protect</label>'+
   (prov.source?'<small>'+escapeHtml(prov.source)+'</small>':'')+
   '</div>';
 }).join('');
}
function mf437EditorHtml(item){
 const env=mf437Normalized(item?.universalMetadata);
 return '<section class="mf437-editor" data-mf437-editor>'+
  '<details><summary><span class="mf437-section-icon" aria-hidden="true">'+mf425Icon('database',18)+'</span><strong>Universal Metadata & External Ratings</strong></summary>'+
  '<p class="hint">Your personal rating and progress are separate. A media type improves organization but never restricts provider searches. Existing title data is untouched until you save changes.</p>'+
  '<label class="field"><span class="field-label">Media type (optional)</span><select id="mf437-type" onchange="App.mf437MediaTypeChanged(this.value)">'+
  MF437_MEDIA_TYPES.map(([id,label])=>'<option value="'+escapeHtml(id)+'" '+(env.mediaType===id?'selected':'')+'>'+escapeHtml(label)+'</option>').join('')+'</select></label>'+
  MF437_FIELDS.map(([type,label,fields])=>'<div class="mf437-group" data-mf437-group="'+type+'"'+(type!=='shared'&&type!==env.mediaType?' hidden':'')+'><h4>'+escapeHtml(label)+'</h4><div class="mf437-grid">'+fields.map(f=>mf437EditorField(item,f)).join('')+'</div></div>').join('')+
  '<details class="mf437-ratings"><summary>External ratings <small>Original scales · manual until provider integration</small></summary>'+
  '<p class="hint">Enter verified scores manually; later providers can populate only unlocked fields. An empty score is unrated, not 0. No external score replaces your rating.</p>'+
  '<div class="mf437-ratings-grid">'+mf437EditorRatings(item)+'</div></details>'+
  '</details></section>';
}
function mf437MediaTypeChanged(type){
 document.querySelectorAll('[data-mf437-group]').forEach(group=>{
  group.hidden=group.dataset.mf437Group!=='shared'&&group.dataset.mf437Group!==type;
 });
}
function mf437MountEditorSection(editor,item){
 if(!editor)return null;
 const fragment=document.createElement('div');
 fragment.innerHTML=mf437EditorHtml(item||{});
 const section=fragment.firstElementChild;
 if(!section)return null;
 // This same mount operation is exercised in browser smoke without logging in.
 // v240 uses a 12-column CSS grid; position directly before Imported Metadata.
 const imported=editor.querySelector(':scope > .v178-rich-editor');
 if(imported)editor.insertBefore(section,imported);
 else editor.appendChild(section);
 return section;
}
const mf437LibraryEditorBase=libraryModalHtml;
libraryModalHtml=function(item){
 const html=mf437LibraryEditorBase.apply(this,arguments);
 try{
  const host=document.createElement('div');host.innerHTML=html;
  const editor=host.querySelector('.v240-library-editor,.v238-library-editor');
  if(!mf437MountEditorSection(editor,item))return html;
  return host.innerHTML;
 }catch(e){console.warn('v437 editor composition failed',e);return html;}
};
function mf437Capture(root){
 if(!root)return null;
 const type=root.querySelector('#mf437-type')?.value||'unspecified';
 const fields={},ratings={},locks={};
 root.querySelectorAll('[data-mf437-field]').forEach(el=>{
  const key=el.dataset.mf437Field,def=MF437_FIELD_MAP.get(key);
  if(def)fields[key]=mf437Clean(el.value,def[2]||'text');
 });
 for(const [key,,scale] of MF437_RATING_SOURCES){
  const find=attr=>root.querySelector('['+attr+'="'+key+'"]');
  const score=find('data-mf437-rating')?.value||'';
  const max=find('data-mf437-scale')?.value||scale;
  const votes=find('data-mf437-votes')?.value||'';
  ratings[key]={score:score.trim()===''?null:Number(score),scale:Number(max),votes:votes.trim()===''?null:Number(votes)};
 }
 root.querySelectorAll('[data-mf437-lock]').forEach(el=>{locks[el.dataset.mf437Lock]=el.checked;});
 return {type,fields,ratings,locks};
}
function mf437SaveCapture(item,previous,capture){
 if(!item||!capture)return false;
 const had=previous?.universalMetadata;
 const env=mf437Normalized(had||item.universalMetadata);
 let changed=false,now=Date.now();
 if(capture.type!==env.mediaType){
  env.mediaType=MF437_MEDIA_TYPES.some(t=>t[0]===capture.type)?capture.type:'unspecified';
  env.provenance.mediaType={source:'manual',updatedAt:now};
  changed=true;
 }
 for(const [key,value] of Object.entries(capture.fields)){
  const old=env.fields[key],empty=Array.isArray(value)?!value.length:(value===null||value==='');
  if(old===undefined&&empty)continue; // A new optional field is not an edit.
  if(!mf437FieldCompare(old,value)){
   if(mf437SetField(env,key,value,{updatedAt:now}))changed=true;
  }
 }
 for(const [key,rating] of Object.entries(capture.ratings)){
  const old=env.externalRatings[key];
  if(old===undefined&&rating.score===null&&rating.votes===null)continue;
  if(mf437SetRating(env,key,rating,{updatedAt:now}))changed=true;
 }
 for(const [token,locked] of Object.entries(capture.locks)){
  if(env.locks[token]===locked)continue;
  if(env.locks[token]===undefined&&!locked)continue;
  env.locks[token]=locked;
  env.provenance[token]={...mf437Object(env.provenance[token]),updatedAt:now,
    source:mf437Object(env.provenance[token]).source||'manual'};
  changed=true;
 }
 if(changed){
  env.updatedAt=Math.max(env.updatedAt,now);
  item.universalMetadata=env;
  item.modifiedAt=Math.max(Number(item.modifiedAt)||0,now);
 }
 return changed;
}
const mf437SaveBase=App.saveLibraryModal;
App.saveLibraryModal=function(id){
 const root=document.querySelector('#modal-root [data-mf437-editor]');
 const capture=mf437Capture(root);
 const before=id?(S.library||[]).find(i=>String(i?.id||'')===String(id)):null;
 const old=before?{universalMetadata:before.universalMetadata?mf437Copy(before.universalMetadata):null}:null;
 // Block malformed score/scale before the existing title modal can close.
 if(capture){
  for(const [key,rating] of Object.entries(capture.ratings)){
   if(rating.score!==null&&(!Number.isFinite(rating.score)||rating.score<0||rating.score>rating.scale||
       !Number.isFinite(rating.scale)||rating.scale<=0||rating.scale>100000)){
    showToast('Invalid external rating for '+(MF437_RATING_MAP.get(key)?.[1]||key)+'.');
    root.querySelector('[data-mf437-rating="'+key+'"]')?.focus();
    return false;
   }
   if(rating.votes!==null&&(!Number.isSafeInteger(rating.votes)||rating.votes<0)){
    showToast('Invalid vote count for '+(MF437_RATING_MAP.get(key)?.[1]||key)+'.');
    return false;
   }
  }
 }
 const result=mf437SaveBase.apply(this,arguments);
 if(S.modal?.type==='library'||!capture)return result;
 const item=id?(S.library||[]).find(i=>String(i?.id||'')===String(id)):(S.library||[])[(S.library||[]).length-1];
 if(item&&mf437SaveCapture(item,old,capture)){
  const undo=(S.undoStack||[])[(S.undoStack||[]).length-1];
  if(undo&&/^(Edit title|Add title)$/i.test(String(undo.action||'')))undo.after=mfCoreSnapshot();
  try{v53InvalidateLibraryCache();}catch(_){}
  persistLibrary();render();
 }
 return result;
};
function mf437DetailsHtml(item){
 const meta=mf437Normalized(item?.universalMetadata);
 const type=MF437_MEDIA_TYPES.find(x=>x[0]===meta.mediaType)?.[1]||'Not specified';
 const rows=[];
 for(const [groupId,groupName,fields] of MF437_FIELDS){
  const detail=fields.filter(([key])=>{
   const value=meta.fields[key];return value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length);
  }).map(([key,label])=>{
   const value=meta.fields[key];const text=Array.isArray(value)?value.join(', '):String(value);
   const source=meta.provenance['field.'+key]?.source||'';
   return '<div class="mf437-detail"><small>'+escapeHtml(label)+'</small><b>'+escapeHtml(text)+'</b>'+
    (source?'<small>Source: '+escapeHtml(source)+'</small>':'')+'</div>';
  });
  if(detail.length)rows.push('<h4>'+escapeHtml(groupName)+'</h4><div class="mf437-detail-grid">'+detail.join('')+'</div>');
 }
 const ratings=MF437_RATING_SOURCES.map(([key,label])=>{
  const r=mf437Object(meta.externalRatings[key]);
  if(r.score===undefined||r.score===null)return '';
  return '<div class="mf437-rating-display"><small>'+escapeHtml(label)+'</small><strong>'+
   escapeHtml(String(r.score))+' / '+escapeHtml(String(r.scale))+'</strong>'+
   (r.votes!=null?'<small>'+Number(r.votes).toLocaleString()+' votes</small>':'')+
   (r.source?'<small>'+escapeHtml(r.source)+'</small>':'')+'</div>';
 }).filter(Boolean);
 if(!rows.length&&!ratings.length&&meta.mediaType==='unspecified')return '';
 return '<section class="mf437-details"><div class="v181-detail-section-label">Universal metadata · '+escapeHtml(type)+'</div>'+
  rows.join('')+
  (ratings.length?'<div class="v181-detail-section-label">External ratings · separate from your rating</div><div class="mf437-detail-grid">'+ratings.join('')+'</div>':'')+
  '</section>';
}
const mf437TitleDetailsBase=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 const html=mf437TitleDetailsBase.apply(this,arguments);
 const content=mf437DetailsHtml(item);
 if(!content)return html;
 try{
  const root=document.createElement('div');root.innerHTML=html;
  const actions=root.querySelector('.v181-title-details-body > .v181-detail-actions');
  if(actions){actions.insertAdjacentHTML('beforebegin',content);return root.innerHTML;}
 }catch(e){console.warn('v437 details',e);}
 return html;
};
/* Full backup already serializes the entire Library, including this nested
 * envelope. Only append a compatibility marker; don't renumber old schemas. */
const mf437BackupBase=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const result=mf437BackupBase.apply(this,arguments);
 if(result){
  result.mediaFlowVersion=437;result.backupVersion=437;
  const manifest=result.backupManifest||(result.backupManifest={});
  manifest.includes={...mf437Object(manifest.includes),
   universalTitleMetadata:true,externalRatingsOriginalScale:true,manualMetadataProtection:true};
  manifest.v437={schemaVersion:MF437_SCHEMA_VERSION,libraryStorage:'additive per-title universalMetadata',
   existingRecordsRequireMigration:false};
 }
 return result;
};
window.MediaFlowV437=Object.freeze({
 version:437,schemaVersion:MF437_SCHEMA_VERSION,mediaTypes:MF437_MEDIA_TYPES,
 fieldGroups:MF437_FIELDS,ratingSources:MF437_RATING_SOURCES,
 normalize:mf437Normalized,merge:mf437MergeEnvelope,
 applyVerifiedProvider:mf437ApplyVerifiedProvider,mountEditor:mf437MountEditorSection
});
Object.assign(App,{mf437MediaTypeChanged});
