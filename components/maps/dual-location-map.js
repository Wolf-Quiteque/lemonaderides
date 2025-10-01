'use client';
import { useEffect, useRef, useState } from 'react';
import { loadYandex } from '../../lib/yandex.js';

export default function DualLocationMap({
  pickupCoordinates, // Expected as [lat, lon]
  dropoffCoordinates, // Expected as [lat, lon]
  onMapClick,
  interactive = true,
  showRoute = false,
  className = "w-full h-full"
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const pickupPlacemarkRef = useRef(null);
  const dropoffPlacemarkRef = useRef(null);
  const routeRef = useRef(null);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Error getting user location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    loadYandex({ apiKey: process.env.NEXT_PUBLIC_YANDEX_JS_API_KEY })
      .then((ymaps) => {
        if (destroyed || !containerRef.current) return;

        const angolaBounds = [[-18.04, 11.64], [-4.38, 24.08]];
        let center = [-8.71, 18.345]; // Default center for Angola

        // Determine center based on available coordinates
        if (pickupCoordinates) {
          center = pickupCoordinates; // [lat, lon]
          console.log('Using pickup as center:', center);
        } else if (dropoffCoordinates) {
          center = dropoffCoordinates; // [lat, lon]
          console.log('Using dropoff as center:', center);
        } else if (userLocation) {
          center = userLocation; // [lat, lon]
          console.log('Using user location as center:', center);
        }

        mapRef.current = new ymaps.Map(containerRef.current, {
          center: center, // Yandex expects [lat, lon]
          zoom: 12,
          controls: interactive ? ['zoomControl', 'geolocationControl'] : [],
        }, {
          suppressMapOpenBlock: true,
          suppressObsoleteBrowserNotifier: true,
          restrictMapArea: angolaBounds
        });

        // Add user location marker if no pickup/dropoff
        if (userLocation && !pickupCoordinates && !dropoffCoordinates) {
          const userPlacemark = new ymaps.Placemark(
            userLocation, // [lat, lon]
            {
              hintContent: 'Your location',
              balloonContent: 'Your current location'
            },
            {
              preset: 'islands#blueHomeIcon',
              iconColor: '#3b82f6'
            }
          );
          mapRef.current.geoObjects.add(userPlacemark);
        }

        // Add pickup marker
        if (pickupCoordinates) {
          if (pickupPlacemarkRef.current) {
            mapRef.current.geoObjects.remove(pickupPlacemarkRef.current);
          }

          console.log('Adding pickup placemark at:', pickupCoordinates);

          pickupPlacemarkRef.current = new ymaps.Placemark(
            pickupCoordinates, // [lat, lon]
            {
              hintContent: 'Pickup location',
              balloonContent: 'Pickup location'
            },
            {
              preset: 'islands#geolocationIcon',
              iconColor: '#10b981'
            }
          );

          mapRef.current.geoObjects.add(pickupPlacemarkRef.current);

          if (dropoffCoordinates) {
            adjustMapBounds();
          } else {
            mapRef.current.setCenter(pickupCoordinates, 15);
          }
        }

        // Add dropoff marker
        if (dropoffCoordinates) {
          if (dropoffPlacemarkRef.current) {
            mapRef.current.geoObjects.remove(dropoffPlacemarkRef.current);
          }

          console.log('Adding dropoff placemark at:', dropoffCoordinates);

          dropoffPlacemarkRef.current = new ymaps.Placemark(
            dropoffCoordinates, // [lat, lon]
            {
              hintContent: 'Dropoff location',
              balloonContent: 'Dropoff location'
            },
            {
              preset: 'islands#flagIcon',
              iconColor: '#ef4444'
            }
          );

          mapRef.current.geoObjects.add(dropoffPlacemarkRef.current);

          if (pickupCoordinates) {
            adjustMapBounds();
          } else {
            mapRef.current.setCenter(dropoffCoordinates, 15);
          }
        }

        // Add route if both locations exist
        if (showRoute && pickupCoordinates && dropoffCoordinates) {
          addRoute();
        }

        // Handle map clicks
        if (interactive && onMapClick) {
          mapRef.current.events.add('click', (e) => {
            const coords = e.get('coords'); // Returns [lat, lon]
            onMapClick({ lat: coords[0], lng: coords[1] });
          });
        }

        mapRef.current.events.add('boundschange', () => {
          if (showRoute && pickupCoordinates && dropoffCoordinates) {
            addRoute();
          }
        });

      })
      .catch((err) => {
        console.error('Error loading map:', err);
        setError(err.message || 'Failed to load map');
      });

    return () => {
      destroyed = true;
      try {
        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }
      } catch (e) {
        console.error('Error destroying map:', e);
      }
    };
  }, [pickupCoordinates, dropoffCoordinates, userLocation, interactive, onMapClick, showRoute]);

  const adjustMapBounds = () => {
    if (!mapRef.current || !pickupCoordinates || !dropoffCoordinates) return;

    const bounds = [
      [Math.min(pickupCoordinates[0], dropoffCoordinates[0]), Math.min(pickupCoordinates[1], dropoffCoordinates[1])],
      [Math.max(pickupCoordinates[0], dropoffCoordinates[0]), Math.max(pickupCoordinates[1], dropoffCoordinates[1])]
    ];

    console.log('Adjusting bounds:', bounds);

    mapRef.current.setBounds(bounds, {
      checkZoomRange: true,
      zoomMargin: 50
    });
  };

  const addRoute = async () => {
    if (!mapRef.current || !pickupCoordinates || !dropoffCoordinates) return;

    try {
      if (routeRef.current) {
        mapRef.current.geoObjects.remove(routeRef.current);
      }

      console.log('Creating route from', pickupCoordinates, 'to', dropoffCoordinates);

      const ymaps = await loadYandex({ apiKey: process.env.NEXT_PUBLIC_YANDEX_JS_API_KEY });
      const router = new ymaps.multiRouter.MultiRoute({
        referencePoints: [
          pickupCoordinates, // [lat, lon]
          dropoffCoordinates // [lat, lon]
        ],
        params: {
          routingMode: 'auto'
        }
      }, {
        wayPointIconColor: '#10b981',
        routeActiveStrokeColor: '#3b82f6',
        routeStrokeWidth: 4,
        routeActiveStrokeWidth: 4,
        pinIconColor: '#ef4444'
      });

      routeRef.current = router;
      mapRef.current.geoObjects.add(router);

    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <div className="text-3xl mb-2">🗺️</div>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className={className} />

      {/* Current Location Button - Only for interactive maps */}
      {interactive && userLocation && (
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setCenter(userLocation, 16);
            }
          }}
          className="absolute bottom-6 right-4 bg-white hover:bg-gray-50 rounded-full shadow-lg p-3 z-10 transition-all active:scale-95"
          title="Go to current location"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}