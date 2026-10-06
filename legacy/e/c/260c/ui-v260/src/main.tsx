import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root=document.getElementById('mf260-react-root');
if(root)createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
