/* Showcase entry. Stylesheet order: the package first, then the page. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../artinos-ui/artinos.css';
import './app/app.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
