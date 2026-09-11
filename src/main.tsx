import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './services/serviceWorkerRegistration';
import { offlineSyncService } from './services/offlineSyncService';

// Initialize Service Worker and connect Background Sync event triggers
registerServiceWorker(() => {
  offlineSyncService.processQueue();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
