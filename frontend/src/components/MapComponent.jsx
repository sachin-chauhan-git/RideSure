import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Bike, Car } from 'lucide-react';

const GREATER_NOIDA_CENTER = { lat: 28.4633, lng: 77.5082 }; // Pari Chowk center

// Verified Exact GPS Coordinates for Greater Noida Landmarks
export const GREATER_NOIDA_PLACES = [
  { id: 'pari_chowk', name: 'Pari Chowk Metro Station', category: 'metro', emoji: '🚇', lat: 28.4633, lng: 77.5082 },
  { id: 'expo_mart', name: 'India Expo Mart (KP II)', category: 'expo', emoji: '🏛️', lat: 28.4570, lng: 77.5000 },
  { id: 'sharda_univ', name: 'Sharda University (KP III)', category: 'edu', emoji: '🎓', lat: 28.4725, lng: 77.4833 },
  { id: 'venice_mall', name: 'The Grand Venice Mall', category: 'mall', emoji: '🛍️', lat: 28.4529, lng: 77.5260 },
  { id: 'alpha1', name: 'Alpha 1 Metro Station', category: 'metro', emoji: '🏢', lat: 28.4709, lng: 77.5126 },
  { id: 'gaur_city', name: 'Gaur City Mall (GN West)', category: 'mall', emoji: '🛍️', lat: 28.6054, lng: 77.4281 },
  { id: 'gbu', name: 'Gautam Buddha University', category: 'edu', emoji: '🎓', lat: 28.4239, lng: 77.5332 },
  { id: 'yatharth', name: 'Yatharth Hospital (Omega 1)', category: 'hospital', emoji: '🏥', lat: 28.4700, lng: 77.4870 },
  { id: 'advant', name: 'Advant Navis / Sec-142', category: 'tech', emoji: '💼', lat: 28.5024, lng: 77.4116 },
  { id: 'f1_circuit', name: 'Buddh F1 Circuit (YEIDA)', category: 'sports', emoji: '🏎️', lat: 28.3488, lng: 77.5340 },
];

// Helper to create Leaflet DivIcons with exact anchor geometry
const createHtmlIcon = (htmlContent, className = '', iconSize = [40, 40], iconAnchor = [20, 20]) => {
  return L.divIcon({
    html: htmlContent,
    className: `custom-leaflet-icon ${className}`,
    iconSize,
    iconAnchor,
    popupAnchor: [0, -iconAnchor[1]],
  });
};

export const MapComponent = ({
  center = GREATER_NOIDA_CENTER,
  zoom = 13,
  pickup = null,
  dropoff = null,
  driver = null,
  nearbyDrivers = [],
  routePolyline = null,
  onMapClick = null,
  onSelectPlace = null,
  apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const landmarksLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  const onSelectPlaceRef = useRef(onSelectPlace);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onSelectPlaceRef.current = onSelectPlace;
  }, [onMapClick, onSelectPlace]);

  // Google Maps SDK fallback
  if (apiKey && apiKey !== 'YOUR_API_KEY') {
    return (
      <div className="w-full h-full min-h-[420px] relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={zoom}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            className="w-full h-full"
            onClick={(e) => {
              if (onMapClickRef.current && e.detail.latLng) {
                onMapClickRef.current({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
              }
            }}
          >
            {pickup && (
              <AdvancedMarker position={{ lat: pickup.lat, lng: pickup.lng }}>
                <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg border-2 border-white animate-bounce">
                  <MapPin className="w-5 h-5" />
                </div>
              </AdvancedMarker>
            )}
            {dropoff && (
              <AdvancedMarker position={{ lat: dropoff.lat, lng: dropoff.lng }}>
                <div className="bg-rose-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                  <Navigation className="w-5 h-5" />
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      </div>
    );
  }

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat || 28.4633, center.lng || 77.5082],
        zoom: zoom || 13,
        zoomControl: false,
      });

      // Sleek Dark-Mode CartoDB Map Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Layer groups
      landmarksLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Render Interactive Landmarks with precise center anchors
      GREATER_NOIDA_PLACES.forEach((place) => {
        const placeIcon = createHtmlIcon(`
          <div style="cursor: pointer; transform: translate(-50%, -50%); transition: transform 0.2s;" onmouseover="this.style.transform='translate(-50%, -50%) scale(1.1)'" onmouseout="this.style.transform='translate(-50%, -50%) scale(1.0)'">
            <div style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid #64748b; color: #f8fafc; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap;">
              <span>${place.emoji}</span>
              <span>${place.name.split('(')[0].trim()}</span>
            </div>
          </div>
        `, '', [0, 0], [0, 0]);

        const marker = L.marker([place.lat, place.lng], { icon: placeIcon }).addTo(landmarksLayerRef.current);
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectPlaceRef.current) {
            onSelectPlaceRef.current(place);
          } else if (onMapClickRef.current) {
            onMapClickRef.current({ lat: place.lat, lng: place.lng, name: place.name });
          }
        });
      });

      // Map Click Event
      map.on('click', (e) => {
        if (onMapClickRef.current) {
          onMapClickRef.current({
            lat: Math.round(e.latlng.lat * 1e5) / 1e5,
            lng: Math.round(e.latlng.lng * 1e5) / 1e5,
          });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Pickup, Dropoff, Driver, Nearby Drivers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !routeLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    const bounds = [];

    // Pickup Marker: Teardrop Pin pointing EXACTLY at [pickup.lat, pickup.lng]
    if (pickup?.lat && pickup?.lng) {
      bounds.push([pickup.lat, pickup.lng]);
      const pickupIcon = createHtmlIcon(`
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer; z-index: 1000;">
          <div style="background: rgba(15, 23, 42, 0.95); color: #34d399; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-bottom: 4px; border: 1.5px solid #059669; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
            Pickup: ${pickup.name?.split('(')[0]?.trim() || 'Here'}
          </div>
          <div style="background: #059669; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff; box-shadow: 0 6px 16px rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;">
            <div style="transform: rotate(45deg); color: white; font-weight: 900; font-size: 14px;">📍</div>
          </div>
        </div>
      `, '', [0, 0], [0, 0]);

      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(markersLayerRef.current);
    }

    // Dropoff Marker: Teardrop Pin pointing EXACTLY at [dropoff.lat, dropoff.lng]
    if (dropoff?.lat && dropoff?.lng) {
      bounds.push([dropoff.lat, dropoff.lng]);
      const dropoffIcon = createHtmlIcon(`
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer; z-index: 1000;">
          <div style="background: rgba(15, 23, 42, 0.95); color: #fda4af; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-bottom: 4px; border: 1.5px solid #e11d48; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
            Drop: ${dropoff.name?.split('(')[0]?.trim() || 'Destination'}
          </div>
          <div style="background: #e11d48; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff; box-shadow: 0 6px 16px rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center;">
            <div style="transform: rotate(45deg); color: white; font-weight: 900; font-size: 14px;">🎯</div>
          </div>
        </div>
      `, '', [0, 0], [0, 0]);

      L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon }).addTo(markersLayerRef.current);
    }

    // Assigned Driver Marker
    if (driver?.lat && driver?.lng) {
      bounds.push([driver.lat, driver.lng]);
      const driverIcon = createHtmlIcon(`
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); z-index: 990;">
          <div style="background: #f59e0b; color: #020617; padding: 8px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3), 0 4px 14px rgba(0,0,0,0.8); border: 2px solid #fef08a;">
            ${driver.vehicleType === 'BIKE'
              ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>'
              : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
            }
          </div>
          <div style="background: #f59e0b; color: #020617; font-size: 10px; font-weight: 900; padding: 1px 6px; border-radius: 9999px; margin-top: 2px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
            ${driver.name || 'Driver'}
          </div>
        </div>
      `, '', [0, 0], [0, 0]);

      L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(markersLayerRef.current);
    }

    // Nearby Available Drivers
    nearbyDrivers.forEach((d) => {
      const nearbyIcon = createHtmlIcon(`
        <div style="transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.9); color: #f59e0b; padding: 6px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.6); border: 1.5px solid rgba(245, 158, 11, 0.6); display: flex; align-items: center; justify-content: center;">
          ${d.vehicleType === 'BIKE'
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>'
          }
        </div>
      `, '', [0, 0], [0, 0]);

      L.marker([d.lat, d.lng], { icon: nearbyIcon }).addTo(markersLayerRef.current);
    });

    // Draw Route Polyline
    if (pickup?.lat && dropoff?.lat) {
      L.polyline(
        [
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ],
        {
          color: '#f59e0b',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }
      ).addTo(routeLayerRef.current);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [pickup, dropoff, driver, nearbyDrivers]);

  return (
    <div className="w-full h-full min-h-[420px] relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

      {/* Top Left Status Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200 flex items-center gap-2 shadow-xl pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-bold text-amber-400">Greater Noida Live Map</span>
        <span className="text-slate-400">• Click landmark or map to set</span>
      </div>
    </div>
  );
};
