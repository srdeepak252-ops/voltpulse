import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tier 1: Google Maps JavaScript API & Map Loading Quota Handling
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

// Global protection against non-fatal cross-origin / third-party script errors
window.addEventListener('error', (event) => {
  if (
    event.message === 'Script error.' ||
    event.message?.includes('Maps JavaScript API') ||
    event.message?.includes('Heatmap')
  ) {
    console.warn('Handled external script notice:', event.message);
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event.reason as any)?.message || String(event.reason || '');
  if (
    reason.includes('Maps JavaScript API') ||
    reason.includes('Heatmap') ||
    reason.includes('importLibrary')
  ) {
    console.warn('Handled external promise rejection:', reason);
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
