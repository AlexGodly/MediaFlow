import { useEffect, useState } from 'react';
import { currentView } from '../bridge/mediaflow';

/**
 * Transitional adapter: v260 keeps the proven legacy MediaFlow renderer as the
 * content authority and lets React own new chrome/components incrementally.
 * This component observes the current view without duplicating app state.
 */
export function LegacyPageAdapter(){
  const [view,setView]=useState(()=>currentView());
  useEffect(()=>{
    const id=window.setInterval(()=>{
      const next=currentView();
      setView(prev=>prev===next?prev:next);
    },300);
    return()=>window.clearInterval(id);
  },[]);
  return <span className="sr-only" data-mf260-react-view={view}>MediaFlow view: {view}</span>;
}
