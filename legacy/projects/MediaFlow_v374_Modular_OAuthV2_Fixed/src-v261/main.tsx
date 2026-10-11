import React from 'react';
import {createRoot} from 'react-dom/client';
import {AppChrome} from './components/AppChrome';
import './styles/tailwind.css';
function mount(){const host=document.getElementById('v260-react-host');if(host&&!host.dataset.reactMounted){host.dataset.reactMounted='true';createRoot(host).render(<AppChrome/>);}}
mount();window.addEventListener('mediaflow:v260-update',mount);
