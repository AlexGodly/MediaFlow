/* ============================================================
   MediaFlow v176 — Dense Library Rows + Rich Imported Metadata
   ------------------------------------------------------------
   Library rows/cards now use the cover area efficiently instead of leaving
   large empty surfaces. When an import provides richer media metadata, v176
   keeps and displays it without inventing missing values.
   ============================================================ */

const V176_BACKUP_SCHEMA_VERSION=13;
const V176_RICH_FIELDS=[
  'mediaFormat','synopsis','genres','themes','studios','producers',
  'mediaSource','demographic','durationMinutes','ageRating',
  'releaseDate','seasonLabel','communityScore'
];

function v176SafeText(value,max=5000){
  if(value==null)return '';
  let s=String(value)
    .replace(/<br\s*\/?>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
  if(s.length>max)s=s.slice(0,max).trim();
  return s;
}

function v176SourceObjects(raw){
  const out=[];
  const seen=new Set();

  const add=obj=>{
    if(!obj||typeof obj!=='object'||Array.isArray(obj)||seen.has(obj))return;
    seen.add(obj);
    out.push(obj);
  };

  for(const obj of v158NestedObjects(raw))add(obj);

  for(const key of [
    'metadata','attributes','details','info','information',
    'aired','broadcast','release','production','user_data','userData'
  ]){
    add(raw?.[key]);
    for(const parent of out.slice(0,12))add(parent?.[key]);
  }

  return out;
}

function v176Key(value){
  return String(value||'')
    .toLowerCase()
    .replace(/[^a-z0-9]/g,'');
}

function v176FindValue(raw,names){
  const wanted=new Set(names.map(v176Key));

  for(const obj of v176SourceObjects(raw)){
    for(const [key,value] of Object.entries(obj)){
      if(
        wanted.has(v176Key(key)) &&
        value!=null &&
        !(typeof value==='string'&&value.trim()==='')
      ){
        return value;
      }
    }
  }

  return null;
}function v176List(value){
  if(value==null)return [];

  if(typeof value==='string'){
    const s=value.trim();
    if(!s)return [];

    if((s.startsWith('[')&&s.endsWith(']'))||(s.startsWith('{')&&s.endsWith('}'))){
      try{return v176List(JSON.parse(s));}catch(_){}
    }

    return [...new Set(
      s.split(/\s*(?:,|;|\||\/)\s*/)
        .map(x=>v176SafeText(x,120))
        .filter(Boolean)
    )].slice(0,40);
  }

  if(Array.isArray(value)){
    const rows=[];
    for(const entry of value){
      if(typeof entry==='string'||typeof entry==='number'){
        rows.push(v176SafeText(entry,120));
      }else if(entry&&typeof entry==='object'){
        const name=
          entry.name ??
          entry.title ??
          entry.label ??
          entry.value ??
          entry.text;
        if(name!=null)rows.push(v176SafeText(name,120));
      }
    }
    return [...new Set(rows.filter(Boolean))].slice(0,40);
  }

  if(typeof value==='object'){
    const direct=
      value.name ??
      value.title ??
      value.label ??
      value.value ??
      value.text;
    if(direct!=null)return v176List(direct);

    for(const key of ['data','items','results','nodes','edges']){
      if(value[key]!=null)return v176List(value[key]);
    }
  }

  return [];
}

function v176DurationMinutes(value){
  if(value==null||value==='')return null;

  if(typeof value==='number'&&Number.isFinite(value)){
    return value>0?Math.round(value):null;
  }

  const s=String(value).toLowerCase().trim();
  if(!s)return null;

  const hr=Number((s.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/)||[])[1])||0;
  const min=Number((s.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/)||[])[1])||0;

  if(hr||min)return Math.max(1,Math.round(hr*60+min));

  const n=Number((s.match(/\d+(?:\.\d+)?/)||[])[0]);
  return Number.isFinite(n)&&n>0?Math.round(n):null;
}

function v176DateValue(value){
  if(value==null)return '';

  if(value&&typeof value==='object'){
    value=value.from??value.start??value.date??value.value??'';
  }

  const raw=String(value||'').trim();
  if(!raw)return '';

  const iso=raw.match(/(\d{4}-\d{2}-\d{2})/);
  if(iso)return iso[1];

  const ts=Date.parse(raw);
  if(!Number.isFinite(ts))return '';

  return new Date(ts).toISOString().slice(0,10);
}

function v176CommunityScore(value){
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)return null;

  // Preserve a native 0–10 value; common 0–100 APIs are normalized to 0–10.
  return Math.round((n>10?n/10:n)*100)/100;
}

function v176ExtractRichMetadata(raw,service){
  const format=v176SafeText(v176FindValue(raw,[
    'media_format','mediaFormat','format','series_type','anime_type',
    'manga_type','title_type','show_type','movie_type','content_type','kind'
  ]),80);

  const synopsis=v176SafeText(v176FindValue(raw,[
    'synopsis','description','overview','summary','plot','storyline','about'
  ]),6000);

  const genres=v176List(v176FindValue(raw,[
    'genres','genre','genre_names','genreNames'
  ]));

  const themes=v176List(v176FindValue(raw,[
    'themes','theme','theme_names','themeNames'
  ]));

  const studios=v176List(v176FindValue(raw,[
    'studios','studio','studio_names','studioNames',
    'production_companies','productionCompanies',
    'networks','network'
  ]));

  const producers=v176List(v176FindValue(raw,[
    'producers','producer','production','production_names','productionNames'
  ]));

  let mediaSource=v176SafeText(v176FindValue(raw,[
    'source_material','sourceMaterial','source_type','sourceType',
    'original_source','originalSource','media_source','mediaSource'
  ]),120);

  // Some anime-oriented exports use a plain "source" field for source material.
  // Accept it only when it does not simply repeat the exchange provider.
  if(!mediaSource){
    const generic=v176SafeText(v176FindValue(raw,['source']),120);
    if(
      generic &&
      v176Key(generic)!==v176Key(service) &&
      v176Key(generic)!==v176Key(mfServiceName(service)) &&
      !/^mediaflow$/i.test(generic)
    ){
      mediaSource=generic;
    }
  }

  const demographicList=v176List(v176FindValue(raw,[
    'demographics','demographic','target_demographic','targetDemographic','audience'
  ]));
  const demographic=demographicList.join(', ');

  const durationMinutes=v176DurationMinutes(v176FindValue(raw,[
    'duration_minutes','durationMinutes','runtime_minutes','runtimeMinutes',
    'runtime','episode_duration','episodeDuration','duration'
  ]));

  const ageRating=v176SafeText(v176FindValue(raw,[
    'content_rating','contentRating','age_rating','ageRating',
    'certification','mpaa_rating','mpaaRating','rating_classification'
  ]),80);

  const releaseDate=v176DateValue(v176FindValue(raw,[
    'release_date','releaseDate','released_at','releasedAt',
    'premiered','first_air_date','firstAirDate','air_date','airDate'
  ]));

  let seasonLabel=v176SafeText(v176FindValue(raw,[
    'season_name','seasonName','season_label','seasonLabel','season'
  ]),80);
  const seasonYear=v176SafeText(v176FindValue(raw,[
    'season_year','seasonYear'
  ]),10);
  if(seasonLabel&&seasonYear&&!seasonLabel.includes(seasonYear)){
    seasonLabel=`${seasonLabel} ${seasonYear}`;
  }

  const communityScore=v176CommunityScore(v176FindValue(raw,[
    'community_score','communityScore','average_score','averageScore',
    'mean_score','meanScore','score_average','scoreAverage',
    'imdb_rating','imdbRating','tmdb_rating','tmdbRating'
  ]));

  return {
    mediaFormat:format||'',
    synopsis:synopsis||'',
    genres,
    themes,
    studios,
    producers,
    mediaSource:mediaSource||'',
    demographic:demographic||'',
    durationMinutes,
    ageRating:ageRating||'',
    releaseDate:releaseDate||'',
    seasonLabel:seasonLabel||'',
    communityScore
  };
}

function v176HasRichMetadata(meta){
  if(!meta||typeof meta!=='object')return false;
  return V176_RICH_FIELDS.some(key=>{
    const v=meta[key];
    return Array.isArray(v)?v.length>0:(v!=null&&v!=='');
  });
}

// FINAL v158 normalizer — all existing service/type/date/cover logic remains
// authoritative, then v176 opportunistically adds metadata actually present.
const v176NormalizeRecordBase=v158NormalizeRecord;
v158NormalizeRecord=function(raw,service){
  const record=v176NormalizeRecordBase(raw,service);
  if(!record)return record;

  const rich=v176ExtractRichMetadata(raw,service);
  if(v176HasRichMetadata(rich)){
    record.richMetadata=rich;
  }

  return record;
};

function v176MergeListValues(a,b){
  return [...new Set([
    ...(Array.isArray(a)?a:[]),
    ...(Array.isArray(b)?b:[])
  ].map(x=>v176SafeText(x,120)).filter(Boolean))].slice(0,40);
}

function v176ApplyRichMetadata(item,meta){
  if(!item||!meta||typeof meta!=='object')return false;
  let changed=false;

  for(const key of ['genres','themes','studios','producers']){
    const merged=v176MergeListValues(item[key],meta[key]);
    if(JSON.stringify(merged)!==JSON.stringify(Array.isArray(item[key])?item[key]:[])){
      item[key]=merged;
      changed=true;
    }
  }

  for(const key of [
    'mediaFormat','synopsis','mediaSource','demographic',
    'ageRating','releaseDate','seasonLabel'
  ]){
    const value=v176SafeText(meta[key],key==='synopsis'?6000:160);
    if(value&&value!==String(item[key]||'')){
      item[key]=value;
      changed=true;
    }
  }

  for(const key of ['durationMinutes','communityScore']){
    const value=Number(meta[key]);
    if(Number.isFinite(value)&&value>0&&Number(item[key])!==value){
      item[key]=value;
      changed=true;
    }
  }

  return changed;
}

// FINAL v158 apply — lets Standard Import and Advanced Import use the same rich
// metadata path, with no second Library scan.
const v176ApplyNormalizedRecordBase=v158ApplyNormalizedRecord;
v158ApplyNormalizedRecord=function(record,service,index,touched){
  const result=v176ApplyNormalizedRecordBase(
    record,
    service,
    index,
    touched
  );

  if(
    result==='skipped' ||
    !record?.richMetadata
  ){
    return result;
  }

  const item=v158FindImportItem(record,index);
  if(item&&v176ApplyRichMetadata(item,record.richMetadata)){
    item.modifiedAt=Date.now();
    touched?.set(String(item.id),item);
    index?.add?.(item);
  }

  return result;
};

