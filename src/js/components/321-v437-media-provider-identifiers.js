/* MediaFlow v437 — expandable, validated external IDs for newly supported media.
 * Keep manual ID overrides, no auto overwrite, and use the existing searchable ID editor. */
const MF437_EXTERNAL_ID_FIELDS=[
 ['steam','Steam App ID','Steam numeric app ID'],
 ['vndb','VNDB','v1234'],
 ['ifdb','IFDB','IFDB TUID'],
 ['musicbrainz','MusicBrainz','Recording or release MBID'],
 ['musicbrainz_release','MusicBrainz Release','UUID'],
 ['musicbrainz_release_group','MusicBrainz Release Group','UUID'],
 ['theaudiodb','TheAudioDB','Album ID'],
 ['itunes','Apple iTunes','Collection / track ID'],
 ['shikimori','Shikimori','Anime / manga ID'],
 ['openalex','OpenAlex','W12345'],
 ['bookbrainz','BookBrainz','BBID'],
 ['libretro','Libretro','Thumbnail asset reference'],
 ['gametdb','GameTDB','GameTDB ID'],
 ['steamspy','SteamSpy','Steam App ID'],
 ['deezer','Deezer','Album ID'],
 ['gcd','Grand Comics Database','Issue or series ID'],
 ['crossref','Crossref DOI','DOI'],
 ['coverartarchive','Cover Art Archive','MusicBrainz Release UUID'],
 ['openlibrary','Open Library','Work or edition ID'],
 ['mangaupdates','MangaUpdates','Series ID'],
 ['librivox','LibriVox','Audiobook ID'],
 ['metron','Metron','Comic series ID']
];
for(const field of MF437_EXTERNAL_ID_FIELDS){
 if(!V377_ID_PROVIDERS.some(row=>row[0]===field[0]))V377_ID_PROVIDERS.push(field);
 MF433_ALLOWED_ID_KEYS.add(field[0]);
}
const MF437_NEW_REGISTRY=[
 ['steamstore','Steam Storefront','cover,id,metadata','public'],
 ['libretro','Libretro Thumbnails','cover','public'],
 ['gametdb','GameTDB','cover,id','review'],
 ['wikimedia-commons','Wikimedia Commons','cover','public'],
 ['pcgamingwiki','PCGamingWiki','cover,id,metadata','review'],
 ['vndb','VNDB','cover,id,metadata,ratings','public'],
 ['coverartarchive','Cover Art Archive','cover,id','public'],
 ['theaudiodb','TheAudioDB','cover,id,metadata','public'],
 ['itunes','Apple iTunes Search','cover,id,metadata','public'],
 ['deezer','Deezer','cover,id,metadata','review'],
 ['ifdb','IFDB','cover,id,metadata,ratings','public'],
 ['musicbrainz','MusicBrainz','id,metadata,ratings','public'],
 ['shikimori','Shikimori','id,metadata,ratings','public'],
 ['openalex','OpenAlex','id,metadata','public'],
 ['bookbrainz','BookBrainz','id,metadata','public'],
 ['steamspy','SteamSpy','id,metadata','public'],
 ['crossref','Crossref','id,metadata','public'],
 ['librivox','LibriVox','id,metadata','public']];
for(const [id,name,capabilities,access] of MF437_NEW_REGISTRY){
 if(!MF433_PROVIDER_CATALOG.some(p=>p.id===id))
  MF433_PROVIDER_CATALOG.push({id,name,capabilities,access});
}
window.MediaFlowV437Identifiers=Object.freeze({fields:MF437_EXTERNAL_ID_FIELDS.length,providers:MF437_NEW_REGISTRY.length});
