// lib/config.js
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  mapbox: {
    accessToken:
      process.env.NEXT_PUBLIC_MAPBOX_API_KEY ??   // <— add this
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
      process.env.MAPBOX_API_KEY,
  },
  yandex: {
    jsApiKey:
      process.env.NEXT_PUBLIC_YANDEX_JS_API_KEY ||
      '',
    geosuggestApiKey:
      process.env.NEXT_PUBLIC_YANDEX_GEOSUGGEST_API_KEY ||
      '',
    geocoderHttpApiKey:
      process.env.NEXT_PUBLIC_YANDEX_GEOCODER_HTTP_API_KEY ||
      '',
    lang: process.env.NEXT_PUBLIC_YANDEX_LANG || 'en_US',
  },
  app: {
    name: 'RideShare',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Missing Supabase environment variables');
}

module.exports = { config };
