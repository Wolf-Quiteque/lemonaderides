'use client';
import { useEffect, useRef, useState } from 'react';
import { loadYandex } from '@/lib/yandex';

export default function MapPicker({ defaultCenter = [13.235, -8.838], onPick }) {
  const mapRef = useRef(null);
  const ymapsRef = useRef(null);
  const [ready, setReady] = useState(false);
  const placemarkRef = useRef(null);

  useEffect(() => {
    loadYandex({ apiKey: process.env.NEXT_PUBLIC_YANDEX_GEOCODER_HTTP_API_KEY }).then((ymaps) => {
      ymapsRef.current = ymaps;
      if (!mapRef.current) {
        mapRef.current = new ymaps.Map('map', { center: defaultCenter, zoom: 12 }, { suppressMapOpenBlock: true });
        mapRef.current.events.add('click', (e) => {
          const coords = e.get('coords'); // [lon, lat]
          setPoint(coords);
          if (onPick) onPick({ lon: coords[0], lat: coords[1] });
        });
      }
      setReady(true);
    }).catch(console.error);
  }, []);

  function setPoint(coords) {
    const ymaps = ymapsRef.current;
    if (!ymaps || !mapRef.current) return;
    if (!placemarkRef.current) {
      placemarkRef.current = new ymaps.Placemark(coords, {}, { draggable: true });
      placemarkRef.current.events.add('dragend', () => {
        const c = placemarkRef.current.geometry.getCoordinates();
        if (onPick) onPick({ lon: c[0], lat: c[1] });
      });
      mapRef.current.geoObjects.add(placemarkRef.current);
    } else {
      placemarkRef.current.geometry.setCoordinates(coords);
    }
    mapRef.current.setCenter(coords, 14, { duration: 300 });
  }

  return (
    <div>
      <div id="map" style={{ width: '100%', height: 420, borderRadius: 12 }} />
      {!ready && <p>Loading map…</p>}
    </div>
  );
}
