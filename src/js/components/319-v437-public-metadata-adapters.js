/* MediaFlow v437 — Public metadata adapters, authenticated gateway bridge.
 * Enabled sources have real parsing code. A source catalog entry alone is not an adapter.
 * Permission failures, blocked CORS, and invalid matches fail closed without changing Library data. */
const MF437_ADDITIONAL_PUBLIC=[
 {id:'tenrai',name:'Tenrai',group:'Anime / Manga'},
 {id:'bookbrainz',name:'BookBrainz',group:'Books / Bibliography'},
 {id:'inventaire',name:'Inventaire',group:'Books / Bibliography'},
 {id:'loc',name:'Library of Congress',group:'Books / Bibliography'},
 {id:'mangaupdates',name:'MangaUpdates',group:'Manga / Novels'},
 {id:'ifdb',name:'IFDB',group:'Interactive Fiction'},
 {id:'musicbrainz',name:'MusicBrainz',group:'Music / Albums'},
 {id:'theaudiodb',name:'TheAudioDB',group:'Music / Albums'},
 {id:'wikidata',name:'Wikidata',group:'Cross-media identifiers'},
 {id:'crossref',name:'Crossref',group:'Scholarly books'},
 {id:'openalex',name:'OpenAlex',group:'Scholarly books'},
 {id:'mangadex',name:'MangaDex',group:'Manga / Webtoons'},
 {id:'shikimori',name:'Shikimori',group:'Anime / Manga'},
 {id:'steamspy',name:'SteamSpy',group:'Video Games'},
 {id:'steamstore',name:'Steam Storefront',group:'Video Games / Visual Novels'}
];
const MF437_DEEZER=MF437_PROVIDERS.find(p=>p.id==='deezer');
if(MF437_DEEZER)Object.assign(MF437_DEEZER,{gateway:true,live:true,public:true,group:'Music / Albums — gateway'});
for(const p of MF437_ADDITIONAL_PUBLIC){
 const existing=MF437_PROVIDERS.find(x=>x.id===p.id);
 if(existing)Object.assign(existing,p,{live:true,public:true});
 else MF437_PROVIDERS.push({...p,live:true,public:true});
}
for(const provider of MF437_ADDITIONAL_PUBLIC){
 if(!MF437_DEFAULTS.providers.includes(provider.id))MF437_DEFAULTS.providers.push(provider.id);
}
const mf437OldSuitable=mf437Suitable;
mf437Suitable=function(provider,item){
 if(MF437_ADDITIONAL_PUBLIC.some(p=>p.id===provider))return true;
 if(MF437_PROVIDERS.some(p=>p.id===provider&&p.gateway))return true;
 return mf437OldSuitable(provider,item);
};
function mf437GatewayAllowed(provider){
 const v=MF437_PROVIDERS.find(p=>p.id===provider);
 if(!v?.gateway)return true;
 const found=typeof mf434ProviderStatus==='function'?mf434ProviderStatus(provider):null;
 return Boolean(found?.configured&&found?.metadataSupported&&mf437SavedMetadataTests().includes(provider));
}
function mf437SavedMetadataTests(){return Array.isArray(S.settings?.v437VerifiedMetadataProviders)?S.settings.v437VerifiedMetadataProviders:[];}
async function mf437GatewayDiscovery(item,provider){
 if(typeof mf434Call!=='function')throw Error('Secure provider gateway unavailable');
 const payload=typeof mf434Payload==='function'?mf434Payload(item,provider):
  {title:String(item.title||''),provider,externalIds:item.externalIds||{},year:item.year||''};
 const response=await mf434Call('metadata',payload);
 const data=response?.results||[];
 if(!Array.isArray(data)||!data.length)return null;
 for(const row of data.slice(0,6)){
  const normalized=mf437Entry(item,provider,row.title||'',row.fields||{},row.ratings||{},row.ids||{},row.sourceUrl||'');
  if(normalized)return normalized;
 }
 return null;
}
function mf437PublicMatch(item,provider,row,fields,ratings,ids,url,aliases){
 return mf437Entry(item,provider,row?.title||row?.name||'',fields||{},ratings||{},ids||{},url||'',aliases||[]);
}
async function mf437ExtraDiscover(item,p){
 const title=String(item.title||'').trim(),q=encodeURIComponent(title),ids=item.externalIds||{},k=mf437Kind(item);

 if(p==='tenrai'){
  const type=/manga|manhwa|manhua|novel/.test(k)?'manga':'anime',id=String(ids.mal||'');
  const raw=await mf437Fetch('https://api.tenrai.org/v1/'+type+( /^\d+$/.test(id)?'/'+id:'?q='+q+'&limit=5'));
  const row=/^\d+$/.test(id)?raw.data:raw.data?.[0];if(!row)return null;
  return mf437PublicMatch(item,p,row,{synopsis:row.synopsis||'',year:row.year,
    genres:(row.genres||[]).map(x=>x.name),studios:(row.studios||[]).map(x=>x.name),
    episodeCount:row.episodes,chapterCount:row.chapters,volumeCount:row.volumes,
    mediaFormat:row.type||'',originalTitle:row.title_japanese||''},
   {mal:mf437Rating(row.score,10,row.scored_by,row.url)}, {mal:String(row.mal_id)},row.url,[row.title_english,row.title_japanese,...(row.title_synonyms||[])]);
 }
 if(p==='inventaire'){
  const isbn=String(ids.isbn||ids.isbn13||ids.isbn10||'').replace(/[-\s]/g,'');
  if(!/^(?:\d{13}|\d{9}[\dXx])$/.test(isbn))return null;
  const raw=await mf437Fetch('https://inventaire.io/api/entities/by-uris?uris='+encodeURIComponent('isbn:'+isbn));
  const row=raw.entities?.['isbn:'+isbn];if(!row)return null;
  return mf437PublicMatch(item,p,{title:row.labels?.en||row.label||title},{synopsis:row.descriptions?.en||'',
    isbn,mediaFormat:'Book'}, {},{isbn},'https://inventaire.io/entity/isbn:'+isbn);
 }
 if(p==='bookbrainz'){
  const bbid=String(ids.bookbrainz||'');
  if(!/^[0-9a-f-]{36}$/i.test(bbid))return null;
  const row=await mf437Fetch('https://api.bookbrainz.org/1/work/'+encodeURIComponent(bbid));
  return mf437PublicMatch(item,p,{title:row.name||row.title}, {synopsis:row.disambiguation||'',
    mediaFormat:'Book',releaseDate:row.date||''},{},{bookbrainz:bbid},'https://bookbrainz.org/work/'+bbid);
 }
 if(p==='loc'){
  const raw=await mf437Fetch('https://www.loc.gov/books/?fo=json&q='+q+'&c=5&at=results');
  const row=raw.results?.[0];if(!row)return null;
  const full=String(row.title||'').replace(/\s*\/\s*$/, '').trim();
  return mf437PublicMatch(item,p,{title:full},{synopsis:(row.description||[]).join(' '),
    authors:row.contributor||[],year:Number(String(row.date||'').slice(0,4)),
    publishers:row.publisher||[],language:row.language?.[0]||'',mediaFormat:'Book'},
    {},{loc:String(row.item_id||row.id||'').split('/').filter(Boolean).at(-1)},String(row.id||'').replace(/^http:/,'https:'));
 }
 if(p==='mangaupdates'){
  const id=String(ids.mangaupdates||'');
  // MangaUpdates v1 is a JSON API; browser CORS and access policy must be validated.
  const raw=id&&/^\d+$/.test(id)?await mf437Fetch('https://api.mangaupdates.com/v1/series/'+id):
   await mf437Fetch('https://api.mangaupdates.com/v1/series/search',{search:title,perpage:5});
  const row=id?raw:(raw.results?.[0]?.record||raw.results?.[0]);if(!row)return null;
  const record=row.record||row,seriesId=String(record.series_id||record.id||id||'');
  return mf437PublicMatch(item,p,{title:record.title}, {synopsis:record.description||'',
    genres:(record.genres||[]).map(x=>x.genre||x.name||x),authors:(record.authors||[]).map(x=>x.name||x),
    artists:(record.artists||[]).map(x=>x.name||x),status:record.status||'',mediaFormat:record.type||'Manga'},
   {},{mangaupdates:seriesId},'https://www.mangaupdates.com/series/'+seriesId);
 }
 if(p==='ifdb'){
  const raw=await mf437Fetch('https://ifdb.org/search?json&game&searchfor='+q);
  const row=(raw.games||[]).find(r=>mf437Name(r.title)===mf437Name(title))||(raw.games||[])[0];
  if(!row)return null;
  return mf437PublicMatch(item,p,row,{year:Number(String(row.published?.machine||'').slice(0,4)),authors:row.author?[row.author]:[],
    mediaFormat:'Interactive Fiction',durationMinutes:row.playTimeInMinutes,developers:row.devsys?[row.devsys]:[]},
   {ifdb:mf437Rating(row.averageRating,5,row.numRatings,row.link)},{ifdb:String(row.tuid)},row.link);
 }
 if(p==='musicbrainz'){
  const mb=String(ids.musicbrainz_release_group||'').trim();
  const url=mb?/^[-0-9a-f]{36}$/i.test(mb)?'https://musicbrainz.org/ws/2/release-group/'+encodeURIComponent(mb)+'?fmt=json':'':'https://musicbrainz.org/ws/2/release-group/?query='+encodeURIComponent('releasegroup:"'+title.replaceAll('"','')+'"')+'&fmt=json&limit=6';
  if(!url)return null;
  const raw=await mf437Fetch(url),row=mb?raw:(raw['release-groups']||[])[0];
  if(!row)return null;
  return mf437PublicMatch(item,p,row,{releaseDate:row['first-release-date']||'',
    mediaFormat:row['primary-type']||'Album',
    artists:(row['artist-credit']||[]).filter(x=>x?.artist?.name).map(x=>x.artist.name),
    genres:(row.genres||[]).map(x=>x.name)},
    {musicbrainz:mf437Rating(row.rating?.value,5,row.rating?.['votes-count'],'https://musicbrainz.org/release-group/'+row.id)},
    {musicbrainz_release_group:row.id},'https://musicbrainz.org/release-group/'+row.id);
 }
 if(p==='theaudiodb'){
  const artist=String(item.mediaMetadata?.artists?.[0]||item.producers?.[0]||item.artist||'').trim();
  if(!artist)return null;
  const raw=await mf437Fetch('https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s='+encodeURIComponent(artist)+'&a='+q);
  const row=(raw.album||[])[0];if(!row)return null;
  return mf437PublicMatch(item,p,{title:row.strAlbum},{synopsis:row.strDescriptionEN||'',genres:row.strGenre?[row.strGenre]:[],
    artists:row.strArtist?[row.strArtist]:[],releaseDate:row.intYearReleased?String(row.intYearReleased):'',mediaFormat:'Album',
    publishers:row.strLabel?[row.strLabel]:[]},
    {theaudiodb:mf437Rating(row.intScore,10,row.intScoreVotes,row.strAlbumThumb)},
    {theaudiodb:String(row.idAlbum)},'https://www.theaudiodb.com/album/'+row.idAlbum);
 }
 if(p==='mangadex'){
  const id=String(ids.mangadex||'');const url=/^[0-9a-f-]{36}$/i.test(id)?'https://api.mangadex.org/manga/'+id:
   'https://api.mangadex.org/manga?title='+q+'&limit=8';
  const raw=await mf437Fetch(url),row=id?raw.data:raw.data?.[0];if(!row)return null;
  const attrs=row.attributes||{},native=Object.values(attrs.title||{})[0],aliases=(attrs.altTitles||[]).flatMap(x=>Object.values(x));
  return mf437PublicMatch(item,p,{title:native},{synopsis:Object.values(attrs.description||{})[0]||'',year:attrs.year,
    mediaFormat:attrs.publicationDemographic||'Manga',status:attrs.status,originalLanguage:attrs.originalLanguage,
    genres:(attrs.tags||[]).map(x=>Object.values(x.attributes?.name||{})[0]).filter(Boolean)},
    {},{mangadex:row.id},'https://mangadex.org/title/'+row.id,aliases);
 }
 if(p==='shikimori'){
  const medium=/manga|novel|manhwa|manhua/.test(k)?'mangas':'animes';
  const raw=await mf437Fetch('https://shikimori.one/api/'+medium+'?search='+q+'&limit=6');
  const row=Array.isArray(raw)?raw[0]:null;if(!row)return null;
  return mf437PublicMatch(item,p,{title:row.name}, {originalTitle:row.russian||'',releaseDate:row.aired_on||row.released_on,
    mediaFormat:row.kind||'',episodeCount:row.episodes,chapterCount:row.chapters,volumeCount:row.volumes,
    status:row.status}, {shikimori:mf437Rating(row.score,10,null,'https://shikimori.one'+row.url)},
   {shikimori:String(row.id)},'https://shikimori.one'+row.url,[row.russian]);
 }
 if(p==='crossref'){
  const raw=await mf437Fetch('https://api.crossref.org/works?query.title='+q+'&rows=5');
  const row=(raw.message?.items||[])[0];if(!row)return null;
  return mf437PublicMatch(item,p,{title:row.title?.[0]}, {synopsis:row.abstract||'',authors:(row.author||[]).map(x=>[x.given,x.family].filter(Boolean).join(' ')),
   publishers:row.publisher?[row.publisher]:[],isbn:row.ISBN?.[0]||'',releaseDate:row.published?.['date-parts']?.[0]?.join('-')},
   {},{crossref:row.DOI},'https://doi.org/'+row.DOI);
 }
 if(p==='openalex'){
  const raw=await mf437Fetch('https://api.openalex.org/works?search='+q+'&per-page=5');
  const row=raw.results?.[0];if(!row)return null;
  return mf437PublicMatch(item,p,{title:row.title||row.display_name}, {releaseDate:row.publication_date||'',year:row.publication_year,
    authors:(row.authorships||[]).map(x=>x.author?.display_name).filter(Boolean),genres:(row.topics||[]).map(x=>x.display_name)},
   {},{openalex:String(row.id||'').split('/').at(-1)},row.doi||row.id);
 }
 if(p==='steamspy'){
  const id=String(ids.steam||ids.steam_app||'');if(!/^\d{1,12}$/.test(id))return null;
  const row=await mf437Fetch('https://steamspy.com/api.php?request=appdetails&appid='+id);
  return mf437PublicMatch(item,p,row,{synopsis:row.short_description||'',developers:row.developer?[row.developer]:[],
    publishers:row.publisher?[row.publisher]:[],genres:String(row.genre||'').split(',').map(x=>x.trim()),mediaFormat:'Game'},
    {},{steam:id},'https://store.steampowered.com/app/'+id);
 }
 if(p==='steamstore'){
  const id=String(ids.steam||ids.steam_app||'');if(!/^\d{1,12}$/.test(id))return null;
  const raw=await mf437Fetch('https://store.steampowered.com/api/appdetails?appids='+id+'&l=english');
  const row=raw?.[id]?.data;if(!row||!raw[id]?.success)return null;
  return mf437PublicMatch(item,p,{title:row.name},{synopsis:row.short_description||'',developers:row.developers||[],
   publishers:row.publishers||[],genres:(row.genres||[]).map(x=>x.description),platforms:Object.entries(row.platforms||{}).filter(([,v])=>v).map(([k])=>k),
   releaseDate:row.release_date?.date||'',mediaFormat:row.type||'Game'}, {},{steam:id},'https://store.steampowered.com/app/'+id);
 }
 if(p==='wikidata'){
  // Exact-title lookup is a candidate only. No direct automatic merge without a saved Wikidata ID.
  const id=String(ids.wikidata||'').trim();if(!/^Q[1-9]\d{0,12}$/.test(id))return null;
  const raw=await mf437Fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&ids='+id+'&props=labels%7Cdescriptions&languages=en&format=json&origin=*');
  const row=raw?.entities?.[id];if(!row||row.missing)return null;
  return mf437PublicMatch(item,p,{title:row.labels?.en?.value||title},{synopsis:row.descriptions?.en?.value||''},{},{wikidata:id},'https://www.wikidata.org/wiki/'+id);
 }
 return null;
}
const mf437DiscoverBase=mf437Discover;
mf437Discover=async function(item,provider){
 const found=MF437_PROVIDERS.find(p=>p.id===provider);
 if(!found?.live)return null;
 if(found.gateway)return mf437GatewayDiscovery(item,provider);
 if(MF437_ADDITIONAL_PUBLIC.some(p=>p.id===provider))return mf437ExtraDiscover(item,provider);
 return mf437DiscoverBase(item,provider);
};
// The verified provider list is never a substitute for an actual metadata adapter.
window.MediaFlowV437Adapters=Object.freeze({active:()=>MF437_PROVIDERS.filter(p=>p.live&&(!p.gateway||mf437GatewayAllowed(p.id))).map(p=>p.id)});
