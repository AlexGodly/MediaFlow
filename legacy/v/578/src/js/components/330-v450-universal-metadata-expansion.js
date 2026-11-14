/* MediaFlow v450 — Universal metadata expansion and source-specific external ratings.
 * Additive only: old envelopes, manually protected fields, personal scores,
 * progress, covers, IDs and recovery matching remain owned by their v437/v439 code.
 */
const MF450_VERSION=450;
const MF450_EXTRA_FIELDS={
 shared:[
  ['subtitle','Subtitle'],['originalReleaseDate','Original release date'],
  ['endDate','End / final release date'],['productionCompanies','Production companies','list'],
  ['contentWarnings','Content warnings','list'],['associatedWorks','Related works','list']
 ],
 anime:[
  ['animeFormat','Anime format'],['animeAdaptedFrom','Adapted from'],
  ['animeEpisodeCount','Episode count (source metadata)','number'],
  ['animeEpisodeMinutes','Episode duration (minutes)','decimal'],
  ['animeStudios','Animation studios','list'],['animeThemes','Themes','list']
 ],
 manga:[
  ['mangaDemographic','Demographic'],['mangaPublicationStatus','Publication status'],
  ['readingDirection','Reading direction'],['mangaImprint','Imprint'],
  ['mangaOriginalUrl','Official manga URL','url']
 ],
 movie:[
  ['cinematographers','Cinematographers','list'],['filmEditors','Film editors','list'],
  ['filmComposers','Score composers','list'],['filmFestivals','Festival selections','list']
 ],
 tv:[
  ['tvEpisodeMinutes','Episode length (minutes)','decimal'],
  ['tvLastAirDate','Last air date'],['tvStreamingServices','Streaming services','list'],
  ['tvOfficialEpisodeGuide','Official episode guide','url']
 ],
 book:[
  ['isbn10','ISBN-10'],['isbn13','ISBN-13'],['bookFormat','Book format'],
  ['bookPublicationDate','Publication date'],['bookSubjects','Subjects','list'],
  ['audiobookDurationMinutes','Audiobook duration (minutes)','decimal']
 ],
 comic:[
  ['comicCharacters','Characters','list'],['comicUniverse','Universe'],
  ['comicStoryArc','Story arc'],['comicCollection','Collected edition']
 ],
 game:[
  ['gameDirectors','Game directors','list'],['gameGenres','Game genres','list'],
  ['gameReleaseDate','Release date'],['gameStoreUrl','Official store URL','url'],
  ['gamePlaytimeHours','Estimated playtime (hours)','decimal'],
  ['gameRatingBoard','Content rating board']
 ],
 visual_novel:[
  ['vnScenarioWriters','Scenario writers','list'],['vnPlatforms','Platforms','list'],
  ['vnLanguages','Supported languages','list'],['vnPlaytimeHours','Estimated length (hours)','decimal'],
  ['vnOriginalReleaseDate','Original release date']
 ],
 music:[
  ['albumBarcode','Album barcode / UPC'],['albumLanguage','Language'],
  ['albumReleaseDate','Album release date'],['albumDurationMinutes','Album duration (minutes)','decimal'],
  ['albumGenres','Album genres','list'],['albumCredits','Music credits','list']
 ],
 interactive_fiction:[
  ['ifSeries','Series'],['ifReleaseDate','Release date'],
  ['ifLanguages','Available languages','list'],['ifCompetition','Competition / award'],
  ['ifGenres','IF genres','list'],['ifStoryWords','Approximate words','number']
 ],
 other:[
  ['otherFormat','Media format'],['otherPublisher','Publisher / creator'],
  ['otherOfficialUrl','Official URL','url'],['otherEdition','Edition']
 ]
};
for(const [media,fields] of Object.entries(MF450_EXTRA_FIELDS)){
 let group=MF437_FIELDS.find(row=>row[0]===media);
 if(!group){group=[media,'Other media',[]];MF437_FIELDS.push(group);}
 for(const field of fields){
  if(MF437_FIELD_MAP.has(field[0]))continue;
  group[2].push(field);MF437_FIELD_MAP.set(field[0],field);
 }
}
const MF450_EXTRA_RATINGS=[
 ['rawg','RAWG',5],['googlebooks','Google Books',5],['audible','Audible',5]
];
for(const row of MF450_EXTRA_RATINGS)if(!MF437_RATING_MAP.has(row[0])){
 MF437_RATING_SOURCES.push(row);MF437_RATING_MAP.set(row[0],row);
}
/* VNDB's official public API returns 10–100, not a 0–10 score.
 * Previously saved scores retain their explicit stored scales unchanged. */
const mf450Vndb=MF437_RATING_MAP.get('vndb');
if(mf450Vndb)mf450Vndb[2]=100;
const MF450_EXTRA_IDS=[
 ['google_books','Google Books'],['openlibrary_work','Open Library Work'],
 ['openlibrary_edition','Open Library Edition'],['audible','Audible'],
 ['rawg','RAWG'],['comicbookroundup','Comic Book Roundup'],
 ['storygraph','The StoryGraph'],['hardcover','Hardcover'],['goodreads','Goodreads']
];
for(const [key,name] of MF450_EXTRA_IDS)if(!V377_ID_PROVIDERS.some(row=>row[0]===key))
 V377_ID_PROVIDERS.push([key,name,'Optional verified external identifier']);
/* Distinct, offline-capable provider marks; no remote image dependency.
 * They are identification marks, not claims of official vendor logos. */
const MF450_MARKS={
 imdb:'IMDb',trakt:'trakt',rottentomatoes_critics:'🍅',
 rottentomatoes_audience:'🍿',mal:'MAL',anilist:'AL',kitsu:'K',
 tmdb:'TMDB',simkl:'simkl',anidb:'AniDB',tvmaze:'TV',
 metacritic:'MC',letterboxd:'●●●',goodreads:'g',
 storygraph:'SG',hardcover:'HC',igdb:'IGDB',opencritic:'OC',
 steam:'STEAM',backloggd:'B',vndb:'VNDB',mangaupdates:'MU',
 rateyourmusic:'RYM',discogs:'D',ifdb:'IFDB',
 rawg:'RAWG',googlebooks:'G Books',audible:'A'
};
function mf450ProviderMark(key){
 const symbol=MF450_MARKS[key]||String(key).slice(0,5).toUpperCase();
 return '<span class="mf450-source-mark" data-mf450-source="'+escapeHtml(key)+'" aria-hidden="true">'+escapeHtml(symbol)+'</span>';
}
function mf450CanonicalRating(key){
 const normal=String(key||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const synonyms={
  rottentomatoes:'rottentomatoes_critics',rottentomatoescritics:'rottentomatoes_critics',
  rottentomatoesaudience:'rottentomatoes_audience',
  rtaudience:'rottentomatoes_audience',rtcritics:'rottentomatoes_critics',
  myanimelist:'mal',malofficial:'mal',themoviedb:'tmdb',
  googlebooksrating:'googlebooks',steamreviews:'steam'
 };
 if(synonyms[normal])return synonyms[normal];
 return MF437_RATING_SOURCES.find(row=>row[0].replace(/[^a-z0-9]/g,'')===normal)?.[0]||null;
}
function mf450NormalizeRatingMap(input){
 const raw=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const result={},priority={};
 for(const [key,rating] of Object.entries(raw)){
  const canonical=mf450CanonicalRating(key);
  if(!canonical)continue;
  const data=rating&&typeof rating==='object'&&!Array.isArray(rating)?rating:{score:rating};
  const value=data.score??data.value;
  if(value===null||value===undefined||String(value).trim()==='')continue;
  const scale=Number(data.scale??MF437_RATING_MAP.get(canonical)?.[2]);
  const score=Number(value),votes=data.votes??data.voteCount??null;
  const count=votes===null||String(votes).trim()===''?null:Number(votes);
  if(!Number.isFinite(score)||!Number.isFinite(scale)||scale<=0||scale>100000||
     score<0||score>scale||(count!==null&&(!Number.isSafeInteger(count)||count<0)))continue;
  const entry={score,scale,votes:count};
  const level=key===canonical?2:1;
  if(!(canonical in result)||level>priority[canonical]){
   result[canonical]=entry;priority[canonical]=level;
  }else if(level===priority[canonical]&&JSON.stringify(result[canonical])!==JSON.stringify(entry)){
   /* Two conflicting aliases never silently produce a guessed winner. */
   delete result[canonical];priority[canonical]=3;
  }
 }
 return result;
}
const mf450BaseTranslateGateway=mf439TranslateGateway;
mf439TranslateGateway=function(provider,record,item){
 const row=mf450BaseTranslateGateway.apply(this,arguments);
 if(!row)return row; // Keep original verified gateway/ID evidence check.
 const raw=record.fields&&typeof record.fields==='object'?record.fields:{};
 const type=item?.universalMetadata?.mediaType||'unspecified';
 const fields={...row.fields};
 const assign=(field,value)=>{if(value!=null&&value!==''&&MF437_FIELD_MAP.has(field))fields[field]=value;};
 for(const key of ['originalTitle','episodeCount','chapterCount','volumeCount','authors',
  'platforms','directors','cast','countries','budget'])
  if(raw[key]!==undefined&&MF437_FIELD_MAP.has(key))assign(key,raw[key]);
 if(raw.cast&&type==='tv')assign('tvCast',raw.cast);
 if(raw.artists&&type==='music')assign('albumArtists',raw.artists);
 if(raw.artists&&type==='manga')assign('mangaArtists',raw.artists);
 if(raw.developers&&type==='game')assign('gameDevelopers',raw.developers);
 if(raw.episodeCount&&type==='anime')assign('animeEpisodeCount',raw.episodeCount);
 if(raw.publishers&&type==='manga')assign('mangaPublisher',Array.isArray(raw.publishers)?raw.publishers.join(', '):raw.publishers);
 if(raw.publishers&&type==='comic')assign('comicPublisher',Array.isArray(raw.publishers)?raw.publishers.join(', '):raw.publishers);
 if(raw.cast&&type==='anime')assign('animeVoiceCast',raw.cast);
 if(raw.genres&&type==='game')assign('gameGenres',raw.genres);
 if(raw.genres&&type==='music')assign('albumGenres',raw.genres);
 row.fields=fields;
 row.ratings=mf450NormalizeRatingMap({...record.ratings,...row.ratings});
 return row;
};
/* All public/gateway proposals still pass through v439 verification,
 * confidence thresholds, protected-field and conflict checks. */
const mf450BaseProposals=mf439Proposals;
mf439Proposals=function(item,results){
 const safe=(Array.isArray(results)?results:[]).map(row=>({
  ...row,ratings:mf450NormalizeRatingMap(row.ratings)
 }));
 return mf450BaseProposals.call(this,item,safe);
};
const mf450BaseApply=mf439Apply;
mf439Apply=function(item,preview,mode){
 const before={...((item?.universalMetadata||{}).externalRatings||{})};
 const result=mf450BaseApply.apply(this,arguments);
 if(!result?.changed||!item?.universalMetadata)return result;
 const env=item.universalMetadata;
 env.schemaVersion=Math.max(2,Number(env.schemaVersion)||1);
 for(const p of preview?.proposals||[]){
  if(!p.selected||!p.token?.startsWith('rating.'))continue;
  const key=p.token.slice(7),choice=p.options?.[p.choice]||p.options?.[0];
  const provider=choice?.sources?.[0];
  if(!provider||before[key]?.score!=null||env.externalRatings?.[key]?.score==null)continue;
  const provenance=env.provenance?.[p.token];
  if(provenance?.source!==provider.provider||provenance.verified!==true)continue;
  if(provider.recordId!=null)
   provenance.recordId=String(provider.recordId).slice(0,200);
  env.externalRatings[key].sourceRecordId=provenance.recordId||'';
 }
 return result;
};
const mf450BaseSaveCapture=mf437SaveCapture;
mf437SaveCapture=function(item,previous,capture){
 const changed=mf450BaseSaveCapture.apply(this,arguments);
 if(changed&&item?.universalMetadata)
  item.universalMetadata.schemaVersion=Math.max(2,Number(item.universalMetadata.schemaVersion)||1);
 return changed;
};
function mf450RatingTiles(item){
 const meta=mf437Normalized(item?.universalMetadata);
 return MF437_RATING_SOURCES.map(([key,label])=>{
  const score=meta.externalRatings[key];
  if(score?.score===null||score?.score===undefined)return '';
  const value=Number(score.score),max=Number(score.scale);
  if(!Number.isFinite(value)||!Number.isFinite(max)||max<=0||value<0||value>max)return '';
  const prov=meta.provenance['rating.'+key]||{};
  const labelText=prov.source==='manual'?'Manually entered':
   prov.verified===true?'Verified provider data':'Saved external rating';
  const by=prov.source&&prov.source!=='manual'?' · '+String(prov.source):'';
  const votes=Number(score.votes);
  const voteText=score.votes!=null&&Number.isSafeInteger(votes)&&votes>=0?
   '<small>'+escapeHtml(votes.toLocaleString())+' votes</small>':'';
  const record=prov.recordId?' · Record '+String(prov.recordId).slice(0,100):'';
  return '<div class="mf437-rating-display mf450-rating-display">'+
   '<div class="mf450-rating-provider">'+mf450ProviderMark(key)+
   '<small>'+escapeHtml(label)+'</small></div>'+
   '<strong>'+escapeHtml(String(value))+' <span>/ '+escapeHtml(String(max))+'</span></strong>'+
   voteText+'<small title="'+escapeHtml(labelText+by+record)+'">'+escapeHtml(labelText+by)+'</small>'+
   '</div>';
 }).filter(Boolean).join('');
}
const mf450BaseEditor=libraryModalHtml;
libraryModalHtml=function(item){
 const html=String(mf450BaseEditor.apply(this,arguments)||'');
 if(!html.includes('mf437-ratings'))return html;
 try{
  const root=document.createElement('div');root.innerHTML=html;
  const tag=root.querySelector('.mf437-ratings > summary small');
  if(tag)tag.textContent='Original scales · manual or verified recovery';
  const hint=root.querySelector('.mf437-ratings > .hint');
  if(hint)hint.textContent='Ratings can be entered manually or recovered from enabled verified providers. Each score keeps its original scale and source. Recovery never changes your personal rating.';
  root.querySelectorAll('.mf437-rating').forEach((el,index)=>{
   const key=MF437_RATING_SOURCES[index]?.[0],heading=el.querySelector('strong');
   if(heading&&key)heading.insertAdjacentHTML('afterbegin',mf450ProviderMark(key));
  });
  return root.innerHTML;
 }catch(e){console.warn('v450 editor enhancement preserved original HTML',e);return html;}
};
const mf450BaseDetails=v181TitleDetailsHtml;
v181TitleDetailsHtml=function(item){
 const html=String(mf450BaseDetails.apply(this,arguments)||'');
 if(!html.includes('mf437-details'))return html;
 try{
  const root=document.createElement('div');root.innerHTML=html;
  const section=root.querySelector('.mf437-details');
  const label=[...section.querySelectorAll('.v181-detail-section-label')]
   .find(x=>x.textContent.includes('External ratings'));
  const grid=label?.nextElementSibling;
  if(grid?.classList.contains('mf437-detail-grid')){
   const replacement=mf450RatingTiles(item);
   if(replacement)grid.innerHTML=replacement;
  }
  return root.innerHTML;
 }catch(e){console.warn('v450 ratings detail enhancement preserved original HTML',e);return html;}
};
const mf450BaseBackup=v148BuildFullBackup;
v148BuildFullBackup=function(){
 const out=mf450BaseBackup.apply(this,arguments);
 if(out){
  out.mediaFlowVersion=450;out.backupVersion=450;
  const manifest=out.backupManifest||(out.backupManifest={});
  manifest.includes={...(manifest.includes||{}),universalMetadataV2:true,providerRatingProvenance:true};
  manifest.v450={schemaVersion:2,additiveFields:true,originalRatingScales:true,
   libraryMigrationRequired:false};
 }
 return out;
};
window.MediaFlowV450=Object.freeze({
 version:450,schemaVersion:2,fields:MF450_EXTRA_FIELDS,extraRatings:MF450_EXTRA_RATINGS,
 normalizeRatings:mf450NormalizeRatingMap,canonical:mf450CanonicalRating,
 ratingTiles:mf450RatingTiles,mark:mf450ProviderMark
});
