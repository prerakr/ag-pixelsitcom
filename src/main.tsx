import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { spriteManager } from './engine/SpriteManager';
import { SPRITE_ATLAS_MANIFEST } from './data/sprites/SpriteAtlas';

// Register every sprite definition and start loading the atlases once, for the whole app (the
// visualizer, Sprite Studio and Set Studio all draw from the same sprite manager).
spriteManager.loadManifest(SPRITE_ATLAS_MANIFEST).catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
