/* v577, in the real app: the keyless sources read the answers the real
 * services give (shapes recorded live with the app repo's
 * tool/live_sources.py) into cover candidates and detail records. */
'use strict';
const assert=require('node:assert/strict');
const {openApp,generate}=require('./harness/app.cjs');
const J=(o)=>({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(o)});
const X=(s)=>({status:200,contentType:'text/xml',headers:{'Access-Control-Allow-Origin':'*'},body:s});
(async()=>{
  const app=await openApp({state:generate({titles:20})});
  const p=app.page;
  await p.route(/wikidata\.org\/w\/api\.php.*wbsearchentities/,r=>r.fulfill(J({search:[{id:'Q190192',label:'Dune'}]})));
  await p.route(/wikidata\.org\/w\/api\.php.*wbgetentities/,r=>r.fulfill(J({entities:{Q190192:{id:'Q190192',labels:{en:{value:'Dune'}},descriptions:{en:{value:'1965 novel'}},
    claims:{P18:[{mainsnak:{datavalue:{value:'Dune cover.jpg'}}}],P577:[{mainsnak:{datavalue:{value:{time:'+1965-08-01T00:00:00Z'}}}}]}}}})));
  await p.route(/inventaire\.io\/api\/search/,r=>r.fulfill(J({results:[{id:'Q190192',type:'works',uri:'wd:Q190192',label:'Dune',description:'1965 science fiction novel by Frank Herbert',image:'/img/entities/a936e0978d400fb13e0c0a2527d345a56b799e54'}]})));
  await p.route(/episodate\.com\/api\/search/,r=>r.fulfill(J({tv_shows:[{id:17658,name:'Breaking Bad',permalink:'breaking-bad',start_date:'2008-01-20',network:'AMC',status:'Ended',image_thumbnail_path:'https://static.episodate.com/images/tv-show/thumbnail/17658.jpg'}]})));
  await p.route(/loc\.gov\/books/,r=>r.fulfill(J({results:[{id:'http://www.loc.gov/item/2001234567/',title:'Frankenstein',date:'1818',image_url:['//tile.loc.gov/image-services/x.jpg#h=150'],url:'https://www.loc.gov/item/2001234567/'}]})));
  await p.route(/api\.crossref\.org/,r=>r.fulfill(J({message:{items:[{DOI:'10.1000/xyz',title:['Frankenstein'],type:'book',publisher:'Penguin',published:{'date-parts':[[2003]]},ISBN:['9780141439471'],author:[{given:'Mary',family:'Shelley'}]}]}})));
  await p.route(/services\.dnb\.de/,r=>r.fulfill(X('<?xml version="1.0"?><searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><records><record><recordData><dc xmlns="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Faust / Goethe</dc:title><dc:creator>Goethe</dc:creator><dc:date>2019</dc:date><dc:identifier>3-7553-0027-3</dc:identifier><dc:identifier>125686871X</dc:identifier></dc></recordData></record></records></searchRetrieveResponse>')));
  try{
    await p.waitForTimeout(600);
    const r=await p.evaluate(async()=>{
      const get=__MF.get,src=window.MediaFlowV577Sources;
      const book={id:'b1',title:'Dune',categoryId:'',externalIds:{},year:1965};
      const ops={request:get('mf424Request')};
      const out={};
      for(const id of ['wikidata','inventaire','loc']){try{out[id]=(await src.cover(id)({...book,title:id==='loc'?'Frankenstein':'Dune'},ops)).map(c=>c.url);}catch(e){out[id]='ERR '+e.message;}}
      try{out.episodate=(await src.cover('episodate')({id:'t',title:'Breaking Bad',externalIds:{}},ops)).map(c=>c.url);}catch(e){out.episodate='ERR '+e.message;}
      const det={};
      for(const [id,title] of [['crossref','Frankenstein'],['dnb','Faust'],['wikidata','Dune'],['episodate','Breaking Bad']]){
        try{det[id]=(await src.lookup(id,{id:'x',title,externalIds:{}})).map(x=>[x.recordId,x.title,x.year]);}catch(e){det[id]='ERR '+e.message;}
      }
      const cat=get('mf438Catalog')().filter(x=>['wikidata','loc','crossref','inventaire','episodate','dnb','bnf','wikimedia','deezer','boardgamegeek'].includes(x.id))
        .map(x=>[x.id,!!x.mf577Connected,x.mf577Note||'']);
      return {out,det,cat};
    });
    assert.deepEqual(r.out.wikidata,['https://commons.wikimedia.org/wiki/Special:FilePath/Dune_cover.jpg?width=600']);
    assert.deepEqual(r.out.inventaire,['https://inventaire.io/img/entities/a936e0978d400fb13e0c0a2527d345a56b799e54']);
    assert.deepEqual(r.out.loc,['https://tile.loc.gov/image-services/x.jpg']);
    assert.deepEqual(r.out.episodate,['https://static.episodate.com/images/tv-show/full/17658.jpg']);
    assert.deepEqual(r.det.crossref,[['10.1000/xyz','Frankenstein',2003]]);
    assert.deepEqual(r.det.dnb,[['125686871X','Faust',2019]]);
    assert.deepEqual(r.det.wikidata,[['Q190192','Dune',1965]]);
    assert.deepEqual(r.det.episodate,[['breaking-bad','Breaking Bad',2008]]);
    const cat=Object.fromEntries(r.cat.map(([id,c,n])=>[id,{c,n}]));
    for(const id of ['wikidata','loc','crossref','inventaire','episodate','dnb','bnf','wikimedia'])assert(cat[id]?.c,id+' connected');
    assert(/app/.test(cat.deezer?.n||''),'Deezer: app only');
    assert(/key/.test(cat.boardgamegeek?.n||''),'BoardGameGeek: why not');
    console.log('PASS v577 keyless sources: covers, details, catalog');
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
