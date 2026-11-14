/* v467 extends the existing v466 Chromium 360px/desktop regression.
 * Inspect ALL logo placements, responsive refresh controls and rating labels.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'test-v459-browser.cjs');
let code=fs.readFileSync(filename,'utf8')
 .replaceAll('mediaflow-v459.bundle.js','mediaflow-v467.bundle.js')
 .replaceAll("result?.v==='459'","result?.v==='467'")
 .replaceAll("'v459-browser-smoke'","'v467-browser-smoke'");
const extract=(f,re)=>{const t=fs.readFileSync(path.join(__dirname,f),'utf8');
 const m=t.match(re);assert(m,'Missing historical regression '+f);return m[1];};
const old462=extract('test-v462-browser.cjs',/const probe=`([\s\S]*?)`;/);
const old463=extract('test-v463-browser.cjs',/const extra=`([\s\S]*?)`;/);
const old464=extract('test-v464-browser.cjs',/const probe=`(   const rating464=[\s\S]*?)`;/);
const old465=extract('test-v465-browser.cjs',/const probe=`(   const label465=[\s\S]*?)`;/);
const old466=extract('test-v466-browser.cjs',/const next466=`(   const auto466=[\s\S]*?)`;/);
const probe=`   const logos467=await cdp.evaluate("(()=>{try{const api=window.MediaFlowV467;if(!api)return {error:'v467 module missing'};const fragment=document.createElement('div');fragment.style.cssText='position:relative;width:min(100%,900px);box-sizing:border-box';fragment.innerHTML='<div class=mf464-provider>'+api.logo('imdb')+'<strong>IMDb</strong></div><div class=mf437-rating><strong>'+api.logo('anilist')+' AniList</strong></div><div class=mf450-rating-provider>'+api.logo('mal')+'<small>MAL</small></div>'+api.button({id:'unsaved'},'editor');document.body.appendChild(fragment);const icons=[...fragment.querySelectorAll('.mf467-source-logo svg')],btn=fragment.querySelector('button.mf467-rating-refresh-btn'),hint=fragment.querySelector('.mf467-rating-hint'),outer=fragment.getBoundingClientRect(),overflow=fragment.scrollWidth>fragment.clientWidth+3;const result={version:api.version,icons:icons.length,shapes:icons.every(n=>n.querySelector('path')),unsavedDisabled:btn.disabled,unsavedHint:hint.textContent.includes('Save this title'),overflow,screenOverflow:document.documentElement.scrollWidth>innerWidth+6,inside:fragment.getBoundingClientRect().right<=innerWidth+3};fragment.remove();return result}catch(e){return {error:String(e.stack||e)}}})()");
   console.log(d.label+' v467 official source logos + title refresh UI:',JSON.stringify(logos467));
   assert(!logos467.error&&logos467.version===467&&logos467.icons===3&&logos467.shapes&&logos467.unsavedDisabled&&logos467.unsavedHint&&!logos467.overflow&&!logos467.screenOverflow&&logos467.inside,
     'v467 must display authentic SVG logos and a safe unsaved title button on desktop/mobile');
`;
const marker='   const dock=await cdp.evaluate(';
assert(code.includes(marker),'Historical browser smoke insertion changed');
code=code.replace(marker,old462+'\n'+old463+'\n'+old464+'\n'+old465+'\n'+old466+'\n'+probe+'\n'+marker);
const run=new Module(filename,module);run.filename=filename;run.paths=Module._nodeModulePaths(path.dirname(filename));run._compile(code,filename);
