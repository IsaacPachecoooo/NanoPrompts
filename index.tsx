
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log("Nano Banana Pro: Initializing...");

window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error:", message, error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 20px; color: #f87171; font-family: sans-serif;">
      <h1 style="font-size: 1.5rem; font-weight: bold;">Application Error</h1>
      <p style="margin-top: 10px;">${message}</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 8px 16px; background: #facc15; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Reload App</button>
    </div>`;
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
