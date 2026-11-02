/* MediaFlow test harness: minimal React/ReactDOM stand-in for offline tests.
 * Supports createElement, useState, useEffect and createRoot().render, which is
 * all the v261 chrome uses. Production loads React 18 from the CDN. */
(function(){
  'use strict';
  let current=null;
  function createElement(type,props,...children){return {type,props:props||{},children:children.flat(Infinity)};}
  function useState(initial){
    const inst=current,i=inst.hook++;
    if(!(i in inst.state))inst.state[i]=typeof initial==='function'?initial():initial;
    return [inst.state[i],v=>{inst.state[i]=typeof v==='function'?v(inst.state[i]):v;inst.rerender();}];
  }
  function useEffect(fn,deps){
    const inst=current,i=inst.hook++;
    const prev=inst.deps[i];
    const changed=!deps||!prev||deps.some((d,k)=>d!==prev[k]);
    if(changed){inst.deps[i]=deps;inst.effects.push(()=>{const c=inst.cleanup[i];if(typeof c==='function')c();inst.cleanup[i]=fn();});}
  }
  function toDom(node,inst){
    if(node==null||node===false||node===true)return document.createTextNode('');
    if(typeof node!=='object')return document.createTextNode(String(node));
    if(typeof node.type==='function'){
      const prev=current;current=inst;
      const out=node.type({...node.props,children:node.children});
      current=prev;return toDom(out,inst);
    }
    const svg=['svg','path','circle','rect','line','polyline','polygon','g'].includes(node.type);
    const el=svg?document.createElementNS('http://www.w3.org/2000/svg',node.type):document.createElement(node.type);
    for(const [k,v] of Object.entries(node.props)){
      if(v==null||v===false)continue;
      if(k==='className')el.setAttribute('class',v);
      else if(k==='style'&&typeof v==='object')Object.assign(el.style,v);
      else if(/^on[A-Z]/.test(k))el.addEventListener(k.slice(2).toLowerCase(),v);
      else if(k==='dangerouslySetInnerHTML')el.innerHTML=v.__html;
      else{const name=svg?k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()):k;el.setAttribute(name==='htmlFor'?'for':name,v===true?'':v);}
    }
    for(const c of node.children)el.appendChild(toDom(c,inst));
    return el;
  }
  function createRoot(host){
    let tree=null;
    const inst={state:{},deps:{},cleanup:{},effects:[],hook:0,rerender(){paint();}};
    function paint(){
      inst.hook=0;inst.effects=[];
      const prev=current;current=inst;
      const dom=toDom(tree,inst);
      current=prev;
      host.replaceChildren(dom);
      const fx=inst.effects;inst.effects=[];setTimeout(()=>fx.forEach(f=>f()),0);
    }
    return {render(node){tree=node;paint();},unmount(){host.replaceChildren();}};
  }
  window.React={createElement,useState,useEffect,Fragment:'div'};
  window.ReactDOM={createRoot,render(node,host){createRoot(host).render(node);}};
})();
