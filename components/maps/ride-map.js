// components/maps/ride-map.js
'use client';
import { useEffect, useRef, useState } from 'react';
import { loadYandex } from '../../lib/yandex.js';

export function RideMap({
  onLocationSelect,
  initialLocation = [-74.006, 40.7128], // [lng, lat]
  interactive = true,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const placemarkRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;
    loadYandex({ apiKey: process.env.NEXT_PUBLIC_YANDEX_JS_API_KEY })
      .then((ymaps) => {
        if (destroyed || !containerRef.current) return;
        const center = [initialLocation[1], initialLocation[0]]; // ymaps uses [lat, lon]
        mapRef.current = new ymaps.Map(containerRef.current, {
          center,
          zoom: 12,
          controls: ['zoomControl', 'geolocationControl'],
        }, { suppressMapOpenBlock: true });

        if (interactive && onLocationSelect) {
          mapRef.current.events.add('click', (e) => {
            const coords = e.get('coords');
            if (!placemarkRef.current) {
              placemarkRef.current = new ymaps.Placemark(coords, {}, { preset: 'islands#blueIcon' });
              mapRef.current.geoObjects.add(placemarkRef.current);
            } else {
              placemarkRef.current.geometry.setCoordinates(coords);
            }
            onLocationSelect({ lng: coords[1], lat: coords[0] });
          });
        }
      })
      .catch((err) => setError(err.message || 'Failed to load map'));

    return () => {
      destroyed = true;
      try { if (mapRef.current) mapRef.current.destroy(); } catch {}
    };
  }, []);

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
      {error ? (
        <div className="w-full h-full bg-muted flex items-center justify-center text-sm text-muted-foreground">{error}</div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
    </div>
  );
}
