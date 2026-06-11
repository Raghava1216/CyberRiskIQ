import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './lib/platform/i18n';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/progrec.css';
import './styles/platform.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
