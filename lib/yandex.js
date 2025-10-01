let ymapsPromise = null;

export function loadYandex({ apiKey, lang = 'en_US', coordorder = 'latlong' }) {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.ymaps && window.ymaps.ready) {
    return new Promise((resolve) => window.ymaps.ready(() => resolve(window.ymaps)));
  }
  if (ymapsPromise) return ymapsPromise;
  if (!apiKey) return Promise.reject(new Error('Missing Yandex API key'));

  ymapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.com/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=${encodeURIComponent(lang)}&coordorder=${coordorder}`;
    script.async = true;
    script.onload = () => window.ymaps?.ready(() => resolve(window.ymaps));
    script.onerror = () => reject(new Error('Failed to load Yandex Maps'));
    document.head.appendChild(script);
  });
  return ymapsPromise;
}