import './index.css'
import './styles/tokens.css'
import './styles/components.css'
import useThemeStore from './store/themeStore'
import App from './App';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

useThemeStore.getState().initTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
