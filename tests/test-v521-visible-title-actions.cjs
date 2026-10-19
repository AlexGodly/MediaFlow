/* MediaFlow v521 visible modal and details action injection tests. */
(function testV521(){
 const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
 const source=fs.readFileSync(require('node:path').resolve(__dirname,'../src/js/components/378-v521-title-actions-mounted.js'),'utf8');
 let modalInsert=null,detailsInsert=null,observed=false;
 function anchor(onMount){
  const obj={parentElement:{},after(el){el.isConnected=true;el.parentElement=obj.parentElement;el.previousElementSibling=obj;onMount(el);}};
  return obj;
 }
 const editorAnchor=anchor(x=>modalInsert=x), detailsAnchor=anchor(x=>detailsInsert=x);
 const modal={
  querySelector(query){if(query==='#l-title')return {};if(query==='.modal-title')return editorAnchor;if(query==='.mf520-title-actions')return modalInsert;return null;}
 };
 const details={
  querySelector(query){
   if(query.includes('v181EditFullTitle'))return {getAttribute(){return "App.v181EditFullTitle('a')"}};
   if(query==='.v181-title-hero-copy')return {querySelector(){return detailsAnchor}};
   if(query==='.mf520-title-actions')return detailsInsert;
   return null;
  }
 };
 const doc={
  body:{},readyState:'complete',
  addEventListener(){},querySelector(){return null},querySelectorAll(){return []},
  getElementById(id){return id==='modal-root'?modal:id==='v181-title-details-overlay'?details:null;},
  createElement(){return {
   className:'',dataset:{},isConnected:false,parentElement:null,previousElementSibling:null,
   attributes:{},classList:{add(){}},setAttribute(key,value){this.attributes[key]=value;},
   querySelectorAll(){return []}
  }}
 };
 const ctx={
  S:{modal:{type:'library',data:{id:'a'}}},
  document:doc,window:{MediaFlowV520:{isOrdered:id=>id==='a',membershipCount:()=>2}},
  App:{},MutationObserver:class{observe(){observed=true}},
  Promise,console,Array,String,Number,
  escapeHtml:s=>String(s)
 };
 vm.runInNewContext(source,ctx);
 assert.equal(observed,true,'real DOM observer must be registered');
 assert.ok(modalInsert?.className.includes('mf521-action-bar'),'editor has action buttons');
 assert.ok(detailsInsert?.className.includes('mf521-action-bar'),'Title Details has action buttons');
 assert.match(modalInsert.innerHTML,/Added to Personal Order/);
 assert.match(modalInsert.innerHTML,/Add to Collection \(2\)/);
 assert.match(detailsInsert.innerHTML,/mf520OpenCollections/);
 assert.ok(ctx.App.mf521RefreshTitleActions,'manual UI refresh exposed');
 assert.equal(ctx.window.MediaFlowV521.version,521);
 console.log('PASS v521: actions mounted in real editor and Title Details DOM anchors; accurate membership labels');
})();
