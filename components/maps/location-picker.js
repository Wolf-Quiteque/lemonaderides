
'use client';
import { useEffect, useRef, useState } from 'react';
import { loadYandexMaps } from '../../lib/yandex.js';



export default function LocationPicker({ onLocationSelect, initialCoordinates }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const placemarkRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let destroyed = false;
    loadYandexMaps()
      .then((ymaps) => {
        if (destroyed || !containerRef.current) return;
        const center = initialCoordinates ? [initialCoordinates[1], initialCoordinates[0]] : [40, -74.5];
        mapRef.current = new ymaps.Map(containerRef.current, {
          center,
          zoom: 12,
          controls: ['zoomControl', 'geolocationControl'],
        });
        if (initialCoordinates) {
          placemarkRef.current = new ymaps.Placemark([initialCoordinates[1], initialCoordinates[0]], {}, { preset: 'islands#redIcon' });
          mapRef.current.geoObjects.add(placemarkRef.current);
        }
        mapRef.current.events.add('click', (e) => {
          const coords = e.get('coords');
          if (!placemarkRef.current) {
            placemarkRef.current = new ymaps.Placemark(coords, {}, { preset: 'islands#redIcon' });
            mapRef.current.geoObjects.add(placemarkRef.current);
          } else {
            placemarkRef.current.geometry.setCoordinates(coords);
          }
          if (onLocationSelect) {
            onLocationSelect({ lat: coords[0], lng: coords[1] });
          }
        });
      })
      .catch((err) => setError(err.message || 'Failed to load map'));

    return () => {
      destroyed = true;
      try { if (mapRef.current) mapRef.current.destroy(); } catch {}
    };
  }, [initialCoordinates, onLocationSelect]);

  return (
    <div>
      {error ? (
        <div className="w-full h-48 rounded-lg border border-border bg-muted flex items-center justify-center text-sm text-muted-foreground">{error}</div>
      ) : (
        <div ref={containerRef} className="w-full rounded-lg border border-border" style={{ height: 400 }} />
      )}
    </div>
  );
}
