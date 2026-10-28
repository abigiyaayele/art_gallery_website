import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {markSold} from './data/artworks';
import {fetchSoldIds} from './lib/payments';
import './index.css';

// Load which paintings have been bought online before the first render, so
// SOLD tags and disabled Buy buttons are correct from the start.
fetchSoldIds().then((ids) => {
  markSold(ids);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
