import { configAPI } from './api';

// Cached Geoapify API key fetched dynamically from backend (or Vite env fallback)
let cachedApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY || '';
let fetchPromise = null;

export async function getGeoapifyApiKey() {
  if (cachedApiKey) {
    return cachedApiKey;
  }
  if (!fetchPromise) {
    fetchPromise = configAPI
      .getGeoapifyKey()
      .then((res) => {
        if (res.data && res.data.apiKey) {
          cachedApiKey = res.data.apiKey;
        }
        return cachedApiKey;
      })
      .catch((err) => {
        console.warn('Could not fetch Geoapify key from backend config endpoint:', err);
        return cachedApiKey;
      });
  }
  return fetchPromise;
}

const PUNE_POPULAR_PLACES = [
  { name: 'Viman Nagar, Pune', address: 'Maharashtra, India', lat: 18.5679, lon: 73.9143 },
  { name: 'Viman Nagar Road, Pune', address: 'Maharashtra, India', lat: 18.5645, lon: 73.9120 },
  { name: 'Viman Nagar, Airport Area, Pune', address: 'Maharashtra, India', lat: 18.5710, lon: 73.9180 },
  { name: 'Kalyani Nagar, Pune', address: 'Maharashtra, India', lat: 18.5529, lon: 73.9064 },
  { name: 'Koregaon Park, Pune', address: 'Maharashtra, India', lat: 18.5362, lon: 73.8940 },
  { name: 'Kothrud, Pune', address: 'Maharashtra, India', lat: 18.5074, lon: 73.8077 },
  { name: 'Shivajinagar, Pune', address: 'Maharashtra, India', lat: 18.5314, lon: 73.8446 },
  { name: 'Hinjawadi, Pune', address: 'Maharashtra, India', lat: 18.5913, lon: 73.7389 },
  { name: 'Baner, Pune', address: 'Maharashtra, India', lat: 18.5590, lon: 73.7868 },
  { name: 'Aundh, Pune', address: 'Maharashtra, India', lat: 18.5602, lon: 73.8031 },
  { name: 'Hadapsar, Pune', address: 'Maharashtra, India', lat: 18.5089, lon: 73.9260 },
  { name: 'Kharadi, Pune', address: 'Maharashtra, India', lat: 18.5516, lon: 73.9388 },
  { name: 'Magarpatta City, Pune', address: 'Maharashtra, India', lat: 18.5158, lon: 73.9272 },
  { name: 'Warje, Pune', address: 'Maharashtra, India', lat: 18.4795, lon: 73.7997 },
  { name: 'Yerwada, Pune', address: 'Maharashtra, India', lat: 18.5538, lon: 73.8795 },
  { name: 'Pune Airport (PNQ)', address: 'Lohegaon, Pune, Maharashtra', lat: 18.5822, lon: 73.9197 },
  { name: 'Pune Railway Station', address: 'Agarkar Nagar, Pune, Maharashtra', lat: 18.5289, lon: 73.8744 },
  { name: 'Swargate, Pune', address: 'Maharashtra, India', lat: 18.5018, lon: 73.8636 }
];

export async function searchLocations(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();

  try {
    const apiKey = await getGeoapifyApiKey();
    if (apiKey) {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=circle:73.8567,18.5204,50000&bias=proximity:73.8567,18.5204&limit=5&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return data.features.map(f => {
            const name = f.properties.address_line1 || f.properties.name || f.properties.formatted;
            const address = f.properties.address_line2 || (f.properties.city ? `${f.properties.city}, ${f.properties.state || 'Maharashtra'}` : 'Maharashtra, India');
            return {
              name: name,
              address: address,
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
            };
          });
        }
      }
    }
  } catch (err) {
    console.warn('Geoapify search error:', err);
  }

  // Fallback to search in Pune places
  return PUNE_POPULAR_PLACES.filter(place => 
    place.name.toLowerCase().includes(cleanQuery) || 
    place.address.toLowerCase().includes(cleanQuery)
  );
}

export async function reverseGeocode(lat, lon) {
  try {
    const apiKey = await getGeoapifyApiKey();
    if (apiKey) {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const p = data.features[0].properties;
          const name = p.name || p.suburb || p.address_line1 || p.street || 'Selected Location';
          const address = p.address_line2 || (p.city ? `${p.city}, ${p.state || 'Maharashtra'}` : 'Pune, Maharashtra');
          return {
            name: name,
            address: address,
            lat: lat,
            lon: lon,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Geoapify reverse geocode error:', err);
  }

  return {
    name: `Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
    address: 'Pune, Maharashtra',
    lat: lat,
    lon: lon,
  };
}
