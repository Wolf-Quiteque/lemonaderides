// components/maps/route-map.js
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { loadYandexMaps } from '../../lib/yandex.js';

export function RouteMap({ pickup, dropoff, waypoints = [], onRouteCalculate, interactive = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;
    loadYandexMaps()
      .then((ymaps) => {
        if (destroyed || !containerRef.current) return;
        // Inputs are [lng, lat]; ymaps wants [lat, lon]
        const refPoints = [
          [pickup[1], pickup[0]],
          ...waypoints.map((w) => [w[1], w[0]]),
          [dropoff[1], dropoff[0]],
        ];
        mapRef.current = new ymaps.Map(containerRef.current, {
          center: refPoints[0],
          zoom: 10,
          controls: ['zoomControl'],
        });

        const multiRoute = new ymaps.multiRouter.MultiRoute({
          referencePoints: refPoints,
          params: { routingMode: 'auto' },
        }, {
          wayPointStartIconColor: '#10b981',
          wayPointFinishIconColor: '#ef4444',
          routeStrokeColor: '#3b82f6',
          routeStrokeWidth: 4,
        });

        multiRoute.model.events.add('requestsuccess', () => {
          try {
            const activeRoute = multiRoute.getActiveRoute();
            if (activeRoute) {
              const dist = activeRoute.properties.get('distance'); // meters
              const dur = activeRoute.properties.get('duration'); // seconds
              const km = (dist.value / 1000);
              const min = Math.round(dur.value / 60);
              setSummary({ km, min });
              if (onRouteCalculate) onRouteCalculate(km, min);
            }
          } catch {}
        });

        mapRef.current.geoObjects.add(multiRoute);
        mapRef.current.setBounds(multiRoute.getBounds(), { checkZoomRange: true, zoomMargin: 30 });
      })
      .catch((err) => setError(err.message || 'Failed to load route'));

    return () => {
      destroyed = true;
      try { if (mapRef.current) mapRef.current.destroy(); } catch {}
    };
  }, []);

  const calculateRoute = async () => {
    if (!map.current) return;

    const coordinates = [pickup, ...waypoints, dropoff].map(coord => coord.join(',')).join(';');

    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();

      if (json.routes && json.routes.length > 0) {
        const data = json.routes[0];
        const route = data.geometry;

        setRoute(route);

        if (onRouteCalculate) {
          onRouteCalculate(data.distance / 1000, Math.floor(data.duration / 60));
        }

        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route,
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 4,
            'line-opacity': 0.75,
          },
        });

        // Add markers
        new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat(pickup)
          .addTo(map.current);

        waypoints.forEach((waypoint) => {
          new mapboxgl.Marker({ color: '#f59e0b' })
            .setLngLat(waypoint)
            .addTo(map.current);
        });

        new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat(dropoff)
          .addTo(map.current);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      {error ? (
        <div className="w-full h-full rounded-lg border border-border bg-muted flex items-center justify-center text-sm text-muted-foreground">{error}</div>
      ) : (
        <div ref={containerRef} className="w-full h-full rounded-lg" />
      )}
      {summary && !error && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-sm text-gray-600">Distance: {summary.km.toFixed(1)} km</div>
          <div className="text-sm text-gray-600">Duration: {summary.min} min</div>
        </div>
      )}
    </div>
  );
}
