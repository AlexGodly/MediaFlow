const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync(__dirname+'/../src/js/features/rewatch/027-v81-repeat-consumption-rewatch-reread.js','utf8');
const N=Number(process.argv[2]||30000), M=Number(process.argv[3]||1200);
const lib=Array.from({length:N},(_,i)=>({id:'title-'+i,title:'Anime '+i,categoryId:'anime',total:12,manualRepeatAmount:0}));
const sessions=Array.from({length:M},(_,i)=>({id:'s'+i,timestamp:i,categoryId:'anime',titles:[{title:'Anime '+(i*13%N),libraryId:'title-'+(i*13%N),repeat:true,qty:2}]}));
const ctx=vm.createContext({S:{library:lib,sessions},getCategory:()=>({unit:'episodes'}),cleanTitle:x=>x,console,queueMicrotask});vm.runInContext(src,ctx);
function bench(count){const start=performance.now();for(let i=0;i<count;i++)ctx.v81RepeatTotals();return {ms:Math.round((performance.now()-start)*10)/10,N,M,calls:count};}
console.log(JSON.stringify(bench(1)));
