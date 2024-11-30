import { Buffer } from 'buffer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfills
window.global = window;
window.Buffer = Buffer;
window.process = {
  env: {
    NODE_ENV: import.meta.env.MODE,
    ...import.meta.env
  },
  version: '',
  nextTick: (cb: Function) => queueMicrotask(cb)
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);