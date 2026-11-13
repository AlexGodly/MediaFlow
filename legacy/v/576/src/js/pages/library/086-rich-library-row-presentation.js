/* ---------- Rich Library row presentation -------------------- */

function v176FmtDate(value){
  if(!value)return '';
  const ts=typeof value==='number'?value:Date.parse(value);
  if(!Number.isFinite(ts))return '';
  return new Date(ts).toLocaleDateString(undefined,{
    year:'numeric',
    month:'short',
    day:'numeric'
  });
}

function v176ShortList(value,limit=4){
  const rows=Array.isArray(value)?value.filter(Boolean):[];
  if(!rows.length)return '';
  const shown=rows.slice(0,limit);
  return shown.join(', ')+(rows.length>limit?` +${rows.length-limit}`:'');
}

function v176LibraryInfoHtml(item){
  if(!item)return '';

  const facts=[];
  const detail=[];

  const year=Number(item.year)||0;
  if(year)facts.push(`<span class="v176-library-fact"><b>${year}</b></span>`);

  if(item.mediaFormat){
    facts.push(`<span class="v176-library-fact"><b>${escapeHtml(String(item.mediaFormat))}</b></span>`);
  }

  if(Number(item.durationMinutes)>0){
    facts.push(`<span class="v176-library-fact">${Number(item.durationMinutes).toLocaleString()} min</span>`);
  }else if(Number(item.estimatedMinutes)>0){
    facts.push(`<span class="v176-library-fact">Est. ${Number(item.estimatedMinutes).toLocaleString()} min</span>`);
  }

  if(item.ageRating){
    facts.push(`<span class="v176-library-fact">${escapeHtml(String(item.ageRating))}</span>`);
  }

  if(Number(item.communityScore)>0){
    facts.push(`<span class="v176-library-fact">Community ★ ${Number(item.communityScore).toFixed(2).replace(/\.?0+$/,'')}</span>`);
  }

  if(item.seasonLabel){
    facts.push(`<span class="v176-library-fact">${escapeHtml(String(item.seasonLabel))}</span>`);
  }

  const studios=v176ShortList(item.studios,3);
  if(studios){
    detail.push(`<div class="v176-library-detail"><b>Studio:</b> ${escapeHtml(studios)}</div>`);
  }

  if(item.mediaSource){
    detail.push(`<div class="v176-library-detail"><b>Source:</b> ${escapeHtml(String(item.mediaSource))}</div>`);
  }

  const genres=v176ShortList(item.genres,5);
  if(genres){
    detail.push(`<div class="v176-library-detail"><b>Genres:</b> ${escapeHtml(genres)}</div>`);
  }

  const themes=v176ShortList(item.themes,4);
  if(themes){
    detail.push(`<div class="v176-library-detail"><b>Themes:</b> ${escapeHtml(themes)}</div>`);
  }

  if(item.demographic){
    detail.push(`<div class="v176-library-detail"><b>Demographic:</b> ${escapeHtml(String(item.demographic))}</div>`);
  }

  const producers=v176ShortList(item.producers,3);
  if(producers){
    detail.push(`<div class="v176-library-detail"><b>Producer:</b> ${escapeHtml(producers)}</div>`);
  }

  const lifecycle=[];
  const release=v176FmtDate(item.releaseDate);
  if(release)lifecycle.push(`Released ${release}`);

  const started=v176FmtDate(Number(item.startedAt)||0);
  if(started)lifecycle.push(`Started ${started}`);

  const finished=v176FmtDate(Number(item.completedAt)||0);
  if(finished)lifecycle.push(`Finished ${finished}`);

  if(item.source){
    lifecycle.push(`Source: ${mfServiceName(String(item.source))||String(item.source)}`);
  }

  const ext=item.externalIds||{};
  const idLabel=
    ext.mal?`MAL #${ext.mal}`:
    ext.anilist?`AniList #${ext.anilist}`:
    ext.simkl?`Simkl #${ext.simkl}`:
    ext.imdb?`IMDb ${ext.imdb}`:
    '';
  if(idLabel)lifecycle.push(idLabel);

  const synopsis=v176SafeText(item.synopsis,6000);

  if(
    !facts.length &&
    !detail.length &&
    !lifecycle.length &&
    !synopsis
  ){
    return '';
  }

  return `${facts.length?`<div class="v176-library-facts">${facts.join('')}</div>`:''}
    ${detail.length?`<div class="v176-library-detail-lines">${detail.join('')}</div>`:''}
    ${synopsis?`<div class="v176-library-synopsis" title="${escapeHtml(synopsis)}">${escapeHtml(synopsis)}</div>`:''}
    ${lifecycle.length?`<div class="v176-library-source-line">${lifecycle.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:''}`;
}

