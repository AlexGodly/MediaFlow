/* ---------- Media-service exchange export -------------------- */

const v176ExchangeRowsBase=mfExchangeRows;
mfExchangeRows=function(){
  const base=v176ExchangeRowsBase();

  return base.map((row,index)=>{
    const item=S.library[index]||{};

    return Object.assign({},row,{
      format:item.mediaFormat||'',
      synopsis:item.synopsis||'',
      genres:Array.isArray(item.genres)?item.genres.join('; '):'',
      themes:Array.isArray(item.themes)?item.themes.join('; '):'',
      studios:Array.isArray(item.studios)?item.studios.join('; '):'',
      producers:Array.isArray(item.producers)?item.producers.join('; '):'',
      source_material:item.mediaSource||'',
      demographic:item.demographic||'',
      duration_minutes:item.durationMinutes??'',
      content_rating:item.ageRating||'',
      release_date:item.releaseDate||'',
      season:item.seasonLabel||'',
      community_score:item.communityScore??''
    });
  });
};

