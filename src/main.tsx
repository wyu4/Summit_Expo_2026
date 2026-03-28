import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';


const faLink = document.createElement('link');
faLink.rel = 'stylesheet';
faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
faLink.media = 'print'; 
faLink.onload = function() { (this as HTMLLinkElement).media = 'all'; };
document.head.appendChild(faLink);
 
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);