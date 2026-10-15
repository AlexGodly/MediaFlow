/* v428 Phase 3 Metadata Fixer: offline integration and safety contracts. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('src/js/components/313-v428-metadata-fixer.js','utf8');
new vm.Script(src);
const events={},inputs=new Map();
function input(id,value){inputs.set(id,{id,value,dispatchEvent(){},closest(){return {open:false}}});}
for(const [id,value] of Object.entries({'l-title':'My Test Anime','l-category':'anime','l-rich-synopsis':'Personal summary','l-rich-genres':'Drama, Slice of Life','l-rich-year':'2023','l-rich-studios':'Test Studio','l-rich-themes':'', 'l-rich-release-date':'2023-02-01','l-rich-format':'TV','l-total':'0'}))input(id,value);
const mock={
 S:{settings:{},library:[],categories:[{id:'anime',name:'Anime'},{id:'books',name:'Books'},{id:'comics',name:'Comics'}],modal:{type:'library',data:{id:'',title:'My Test Anime',categoryId:'anime'}},view:'library'},
 App:{},window:{addEventListener(n,fn){events[n]=fn;},MediaFlowV428Hub:{registerMetadata(){},paint(){},enqueue(){return true;},ownsLease(){return true;},status(){return {active:null};}}},
 document:{readyState:'loading',body:null,addEventListener(n,fn){events[n]=fn;},getElementById(id){return inputs.get(id)||null;},querySelectorAll(){return []}},
 AUTH_USER:{id:'tester'},MF425:{},mf425Selection:()=>[],v181TitleDetailsHtml:item=>'<section><div class="v181-detail-actions"><button>Edit title</button></div></section>',
 libraryModalHtml:()=>'<div class="mf425-editor-tools"><button>Fix missing cover</button></div>',
 renderLibrary:()=>'<div><button class="btn mf425-tools-button">Fix missing covers</button></div>',
 MediaFlowRuntime:{registerPageEnhancer(){}},showToast(){},saveState:async()=>{},persistSettings:async()=>{},
 console,Math,Date,JSON,setInterval(){},clearInterval(){},setTimeout,clearTimeout,Promise,Event:function Event(){}
};
const ctx=vm.createContext(mock);
vm.runInContext(src,ctx);
const metadata=mock.window.MediaFlowV428Metadata;
assert(metadata,'Metadata fixer exported');
assert.equal(metadata.detectMediaKind({categoryId:'anime'}),'anime');
assert.equal(metadata.detectMediaKind({categoryId:'comics'}),'comics','Comics have an independent ISBN-capable metadata category, never the MangaDex anime/manga adapter');
const draft=metadata.captureDraft({title:'Original',categoryId:'anime'});
assert.equal(draft.synopsis,'Personal summary');
assert.equal(draft.year,2023);
assert.equal(draft.genres.join(','),'Drama,Slice of Life');
assert.equal(draft.studios.join(','),'Test Studio');
let results=metadata.previewFields({title:'My Test Anime',synopsis:'',genres:[],total:0,progress:0,categoryId:'anime'},
 {source:'Jikan',synopsis:'A verified description',genres:['Fantasy'],year:2023,total:12});
assert(results.some(v=>v.field==='synopsis'),'Canonical field used');
assert(!results.some(v=>v.field==='description'),'No shadow description property');
assert(results.some(v=>v.field==='total'),'Empty total may be reviewed');
assert(!metadata.previewFields({synopsis:'User summary',richMetadataManual:{synopsis:true}},
 {source:'Jikan',synopsis:'Provider summary'}).some(v=>v.field==='synopsis'),'Manual override respected');
assert(!metadata.previewFields({total:12,progress:7},
 {source:'Jikan',total:24}).some(v=>v.field==='total'),'Existing total and progress protected');
assert(!metadata.previewFields({total:0,progress:0,seasons:[{total:12,progress:0}]},
 {source:'Jikan',total:24}).some(v=>v.field==='total'),'Season structure protected');
assert(!metadata.previewFields({year:2024},
 {source:'Jikan',year:0}).some(v=>v.field==='year'),'Unknown publication year is not a zero overwrite');
assert(mock.libraryModalHtml().includes('mf428-edit-action'),'Add/Edit Title button in actual editor tools');
assert(mock.renderLibrary().includes('mf428-library-metadata'),'Library tools support Fix Metadata');
assert(mock.v181TitleDetailsHtml({id:'title-1'}).includes('mf428-details-action'),'Title Details button inserted in native details markup');
assert(mock.App.mf428MetadataStart&&mock.App.mf428MetadataApply&&mock.App.mf428MetadataUndo);
console.log('v428 Metadata Fixer Phase 3 passed: canonical fields, draft capture, manual locks, progress protection, Add/Edit, Library, Title Details');
