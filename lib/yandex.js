// lib/yandex.js
// Simple loader for Yandex Maps JS API (v2.1)
// Usage: const ymaps = await loadYandexMaps();

import { config } from './config.js';

let ymapsPromise = null;

export function loadYandexMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.ymaps && window.ymaps.ready) {
    return new Promise((resolve) => window.ymaps.ready(() => resolve(window.ymaps)));
  }
  if (ymapsPromise) return ymapsPromise;

  const apiKey = config.yandex.jsApiKey;
  const lang = config.yandex.lang || 'en_US';

  if (!apiKey) {
    return Promise.reject(new Error('Missing Yandex API key (NEXT_PUBLIC_YANDEX_API_KEY)'));
  }
  ymapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.com/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=${encodeURIComponent(lang)}&coordorder=latlong`;
    script.async = true;
    script.onload = () => {
      if (window.ymaps && window.ymaps.ready) {
        window.ymaps.ready(() => resolve(window.ymaps));
      } else {
        reject(new Error('Yandex Maps failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Yandex Maps script'));
    document.head.appendChild(script);
  });

  return ymapsPromise;
}
