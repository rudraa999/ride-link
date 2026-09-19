import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom red pin marker icon matching mockup
const pinIcon = new L.DivIcon({
  className: 'custom-pin-icon',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapPicker({ lat, lon, title, subtitle, onLocationSelect }) {
  const position = lat && lon ? [lat, lon] : [18.5204, 73.8567]; // Default to Pune city center

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={position} zoom={14} />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        
        {lat && lon && (
          <Marker position={position} icon={pinIcon}>
            <Popup autoPan={false} closeButton={false} className="custom-leaflet-popup">
              <div className="px-1 py-0.5 text-center">
                <p className="font-bold text-slate-900 text-sm">{title || 'Selected Location'}</p>
                <p className="text-xs text-slate-500">{subtitle || 'Pune, Maharashtra'}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
