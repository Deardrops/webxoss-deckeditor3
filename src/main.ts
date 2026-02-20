import { Application } from 'pixi.js';
import { App } from './ui/App';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function main(): Promise<void> {
  // util.js defines globals (toArr, etc.) needed by Localize.min.js
  // CardInfo.js MUST load before Localize.min.js (Localize references CardInfo)
  await loadScript('../lib/util.js');
  await loadScript('../CardInfo.js');
  await loadScript('../Localize.min.js');

  try {
    await loadScript('../ImageFileCache.js');
  } catch {
    // intentionally empty: ImageFileCache is optional, app works without it
  }

  if (window.Localize) {
    window.Localize.init();
    window.Localize.DOM('DeckEditor');
  }

  const pixiApp = new Application();
  await pixiApp.init({
    canvas: document.getElementById('pixi-canvas') as HTMLCanvasElement,
    resizeTo: window,
    background: 0xf0f2f5,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  new App(pixiApp);

  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 300);
  }
}

main().catch(err => {
  console.error('Failed to initialize Deck Editor:', err);
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    const p = loadingScreen.querySelector('p');
    if (p) p.textContent = 'Failed to load. Please refresh.';
  }
});
