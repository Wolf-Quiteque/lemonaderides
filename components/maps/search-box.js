'use client';
import { useEffect, useState } from 'react';
import { config } from '../../lib/config.js';

export default function SearchBox({ onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setError(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Added types=biz for businesses/POIs and types=geo for locations
        // bbox limits search to Angola (southwest corner to northeast corner)
        // Angola bounds: approximately -18.04,11.64 (SW) to -4.38,24.08 (NE)
        const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${config.yandex.geosuggestApiKey}&text=${encodeURIComponent(query)}&types=biz,geo&lang=${config.yandex.lang}&results=10&bbox=11.64,-18.04~24.08,-4.38&attrs=uri&print_address=1`;
        
        console.log(`Fetching suggestions for "${query}"`);
        console.log('Full URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Response text:', errorText);
          throw new Error('Failed to fetch suggestions');
        }
        
        const data = await response.json();
        console.log('Suggestions data:', data);
        
        // The response structure is different - it's an array of results directly
        setSuggestions(data.results || []);
      } catch (e) {
        console.log('Error fetching suggestions:', e);
        setError('Failed to fetch suggestions');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const geocodeAndSelect = async (suggestion) => {
    try {
      setError(null);
      
      // Use the suggestion's text for display
      const displayText = suggestion.text || suggestion.title?.text || '';
      
      // Check if suggestion has direct coordinates (uri format or tags)
      if (suggestion.uri) {
        // URI format: ymapsbm1://geo?ll=LON,LAT or ymapsbm1://org?oid=...
        const uriMatch = suggestion.uri.match(/ll=([-\d.]+),([-\d.]+)/);
        if (uriMatch) {
          const [, lon, lat] = uriMatch;
          onSelect?.({
            name: displayText,
            coordinates: [parseFloat(lat), parseFloat(lon)], // [lat, lng]
            source: 'yandex',
            confidence: 9,
          });
          setQuery(displayText);
          setSuggestions([]);
          return;
        }
      }
      
      // If the suggestion has pos coordinates
      if (suggestion.pos) {
        const [lon, lat] = suggestion.pos.split(' ').map(Number);
        onSelect?.({
          name: displayText,
          coordinates: [lat, lon], // [lat, lng]
          source: 'yandex',
          confidence: 8,
        });
        setQuery(displayText);
        setSuggestions([]);
        return;
      }
      
      // Otherwise, geocode the text
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x?apikey=${config.yandex.geocoderHttpApiKey}&geocode=${encodeURIComponent(displayText)}&format=json&lang=${config.yandex.lang}&results=1`
      );
      
      if (!response.ok) throw new Error('Failed to geocode');
      
      const data = await response.json();
      const first = data.response.GeoObjectCollection.featureMember?.[0]?.GeoObject;
      
      if (!first) return;
      
      const coords = first.Point.pos.split(' ').reverse().map(Number); // Yandex returns lon lat
      const name = first.metaDataProperty?.GeocoderMetaData?.Address?.formatted || displayText;
      
      onSelect?.({
        name,
        coordinates: [coords[1], coords[0]], // [lat, lng]
        source: 'yandex',
        confidence: 8,
      });
      
      setQuery(name);
      setSuggestions([]);
    } catch (e) {
      console.log('Error geocoding:', e);
      setError('Failed to geocode selection');
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        required
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="absolute z-10 w-full bg-red-50 border border-red-200 rounded mt-1 p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded mt-1 max-h-64 overflow-y-auto shadow-lg">
          {suggestions.map((sug, idx) => {
            const title = sug.title?.text || sug.text || '';
            const subtitle = sug.subtitle?.text || sug.description || '';
            
            return (
              <li
                key={idx}
                className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                onClick={() => geocodeAndSelect(sug)}
              >
                <div className="font-medium text-gray-900">{title}</div>
                {subtitle && (
                  <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}