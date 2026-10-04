import React from 'react';
import ReactDOM from 'react-dom/client';
import { ColorModeProvider } from './context/ColorModeContext';
import { AppProvider } from './context/AppContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ColorModeProvider>
  </React.StrictMode>
);
