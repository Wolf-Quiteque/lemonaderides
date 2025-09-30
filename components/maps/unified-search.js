'use client';
import { useEffect, useState } from 'react';
import { config } from '../../lib/config.js';

export default function UnifiedSearch({
  onLocationSelect,
  placeholder = "Search for pickup or dropoff location",
  activeMode = 'pickup',
  onModeChange,
  pickupLocation = '',
  dropoffLocation = ''
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  // Update query when active mode changes
  useEffect(() => {
    setQuery(activeMode === 'pickup' ? pickupLocation : dropoffLocation);
  }, [activeMode, pickupLocation, dropoffLocation]);

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

        // Add "Angola" to the search query to prioritize Angolan results
        const searchQuery = `${query}, Angola`;
        
        // Angola bounds: 11.64°E to 24.08°E longitude, -18.04°S to -4.38°S latitude
        const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${config.yandex.geosuggestApiKey}&text=${encodeURIComponent(searchQuery)}&types=biz,geo&lang=${config.yandex.lang}&results=10&bbox=11.64,-18.04~24.08,-4.38&attrs=uri&print_address=1`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        
        // Filter results to only include those within Angola bounds
        const filteredResults = (data.results || []).filter(result => {
          if (result.pos) {
            const [lon, lat] = result.pos.split(' ').map(Number);
            // Check if coordinates are within Angola
            return lat >= -18.04 && lat <= -4.38 && lon >= 11.64 && lon <= 24.08;
          }
          return true; // Keep results without coordinates for now
        });
        
        console.log(`Found ${data.results?.length || 0} results, ${filteredResults.length} within Angola`);
        setSuggestions(filteredResults);
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
    const displayText = suggestion.text || suggestion.title?.text || '';

    // Check if suggestion has direct coordinates in URI
    if (suggestion.uri) {
      const uriMatch = suggestion.uri.match(/ll=([-\d.]+),([-\d.]+)/);
      if (uriMatch) {
        const [, lon, lat] = uriMatch;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        // Verify it's in Angola
        if (latitude >= -18.04 && latitude <= -4.38 && longitude >= 11.64 && longitude <= 24.08) {
          console.log('From URI (Angola):', { displayText, latitude, longitude });
          
          onLocationSelect?.({
            name: displayText,
            coordinates: [latitude, longitude],
            mode: activeMode,
            source: 'yandex',
          });
          setQuery(displayText);
          setSuggestions([]);
          setIsFocused(false);
          return;
        } else {
          setError('Selected location is outside Angola');
          return;
        }
      }
    }

    // If the suggestion has pos coordinates
    if (suggestion.pos) {
      const [lon, lat] = suggestion.pos.split(' ').map(Number);
      
      // Verify it's in Angola
      if (lat >= -18.04 && lat <= -4.38 && lon >= 11.64 && lon <= 24.08) {
        console.log('Direct pos (Angola):', { displayText, lat, lon });
        
        onLocationSelect?.({
          name: displayText,
          coordinates: [lat, lon],
          mode: activeMode,
          source: 'yandex',
        });
        setQuery(displayText);
        setSuggestions([]);
        setIsFocused(false);
        return;
      } else {
        setError('Selected location is outside Angola');
        return;
      }
    }

    // Fallback: geocode using the display text
    const geocodeQuery = displayText.includes('Angola') ? displayText : `${displayText}, Angola`;
    
    const response = await fetch(
      `https://geocode-maps.yandex.ru/1.x?apikey=${config.yandex.geocoderHttpApiKey}&geocode=${encodeURIComponent(geocodeQuery)}&format=json&lang=${config.yandex.lang}&results=5&bbox=11.64,-18.04~24.08,-4.38`
    );

    if (!response.ok) throw new Error('Failed to geocode');
    
    const data = await response.json();
    const results = data.response.GeoObjectCollection.featureMember || [];
    
    // Find the first result within Angola bounds
    for (const feature of results) {
      const geoObject = feature.GeoObject;
      const [lon, lat] = geoObject.Point.pos.split(' ').map(Number);
      
      if (lat >= -18.04 && lat <= -4.38 && lon >= 11.64 && lon <= 24.08) {
        const name = geoObject.metaDataProperty?.GeocoderMetaData?.Address?.formatted || displayText;
        
        console.log('Geocoded (Angola):', { name, lat, lon });
        
        onLocationSelect?.({
          name,
          coordinates: [lat, lon],
          mode: activeMode,
          source: 'yandex',
        });
        setQuery(name);
        setSuggestions([]);
        setIsFocused(false);
        return;
      }
    }
    
    setError('Location not found in Angola. Please try a different search.');
  } catch (e) {
    console.log('Error geocoding:', e);
    setError('Failed to geocode selection');
  }
};

  const getCurrentPlaceholder = () => {
    if (activeMode === 'pickup') {
      return pickupLocation || "Search in Angola...";
    } else {
      return dropoffLocation || "Search in Angola...";
    }
  };

  const getModeIcon = () => {
    return activeMode === 'pickup' ? '📍' : '🏁';
  };

  return (
    <div className="relative">
      {/* Mode Selector */}
      <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onModeChange('pickup')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeMode === 'pickup'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-base">📍</span>
          <span>Pickup</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('dropoff')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeMode === 'dropoff'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="text-base">🏁</span>
          <span>Dropoff</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-2 text-gray-400">
            <span className="text-lg">{getModeIcon()}</span>
          </div>
          <input
            type="text"
            className="w-full pl-20 pr-10 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={query === '' ? getCurrentPlaceholder() : ''}
          />

          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute z-20 w-full bg-red-50 border border-red-200 rounded-lg mt-2 p-3 animate-fade-in">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* No Results Message */}
        {isFocused && query.length >= 3 && !loading && suggestions.length === 0 && !error && (
          <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-lg p-4">
            <p className="text-gray-600 text-sm text-center">
              No locations found in Angola. Try searching for cities like Luanda, Benguela, or Huambo.
            </p>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-lg max-h-64 overflow-y-auto animate-fade-in">
            {suggestions.map((sug, idx) => {
              const title = sug.title?.text || sug.text || '';
              const subtitle = sug.subtitle?.text || sug.description || '';

              return (
                <div
                  key={idx}
                  className="p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => geocodeAndSelect(sug)}
                >
                  <div className="font-medium text-gray-900">{title}</div>
                  {subtitle && (
                    <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}