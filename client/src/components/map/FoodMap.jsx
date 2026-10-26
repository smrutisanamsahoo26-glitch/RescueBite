import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Info } from 'lucide-react';

export const INDIA_CITIES = [
  { name: 'All India', center: [20.5937, 78.9629], zoom: 5 },
  { name: 'Mumbai', center: [19.0760, 72.8777], zoom: 12 },
  { name: 'Delhi NCR', center: [28.6139, 77.2090], zoom: 12 },
  { name: 'Bengaluru', center: [12.9716, 77.5946], zoom: 12 },
  { name: 'Hyderabad', center: [17.3850, 78.4867], zoom: 12 },
  { name: 'Chennai', center: [13.0827, 80.2707], zoom: 12 },
  { name: 'Kolkata', center: [22.5726, 88.3639], zoom: 12 },
  { name: 'Pune', center: [18.5204, 73.8567], zoom: 12 }
];

export const FoodMap = ({
  listings = [],
  selectedListingId,
  onSelectListing,
  center = [20.5937, 78.9629], // Geographic center of India
  zoom = 5,
  height = '500px',
  showCitySelector = true
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();

  const [activeCity, setActiveCity] = useState('All India');

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'cooked_meals': return '#10b981'; // emerald
      case 'bakery': return '#f59e0b'; // amber
      case 'dairy': return '#0284c7'; // sky
      case 'produce': return '#059669'; // dark green
      case 'packaged_goods': return '#8b5cf6'; // purple
      default: return '#10b981';
    }
  };

  // Helper to extract valid [lat, lng] from listing
  const getCoordinates = (listing) => {
    // GeoJSON Point [lng, lat]
    if (listing?.location?.coordinates && Array.isArray(listing.location.coordinates)) {
      const [lng, lat] = listing.location.coordinates;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    // Object format { lat, lng }
    if (typeof listing?.lat === 'number' && typeof listing?.lng === 'number') {
      return [listing.lat, listing.lng];
    }
    return null;
  };

  // 1. Initialize Map once on mount and clean up on unmount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Defensively handle StrictMode container reuse
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Sync markers whenever listings or selectedListingId updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filter listings that have valid coordinates
    const validListings = (listings || []).filter(l => getCoordinates(l) !== null);

    validListings.forEach(listing => {
      const coords = getCoordinates(listing);
      if (!coords) return;

      const [lat, lng] = coords;
      const color = getCategoryColor(listing.category);
      const isSelected = selectedListingId && (listing._id === selectedListingId || listing.id === selectedListingId);

      const customIcon = L.divIcon({
        className: 'custom-india-food-pin',
        html: `
          <div style="
            background-color: ${color};
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            border-radius: 50%;
            border: 3px solid ${isSelected ? '#0f172a' : '#ffffff'};
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            🍲
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Approximate location for privacy (protecting exact donor home addresses)
      const approxLocation = listing.address?.city
        ? `${listing.address.city}${listing.address.state ? `, ${listing.address.state}` : ''}`
        : 'India Surplus Hub';

      const imgUrl = (listing.images && listing.images[0]?.url) || (listing.images && listing.images[0]) || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80';
      const listingId = listing._id || listing.id;

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 font-sans';
      popupContent.innerHTML = `
        <div style="width: 220px; font-family: inherit;">
          <img src="${imgUrl}" alt="${listing.title}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <div style="font-weight: 700; font-size: 13px; line-height: 1.3; margin-bottom: 4px; color: #0f172a;">
            ${listing.title}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            ${listing.donorName || 'Verified Food Partner'} &bull; <span style="font-weight: 500;">${approxLocation}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; margin-bottom: 8px;">
            <span style="color: #059669; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">
              ${listing.quantityRemaining ?? listing.quantity} ${listing.unit}
            </span>
            <span style="color: #475569; text-transform: capitalize;">
              ${listing.storageRequirements || 'ambient'}
            </span>
          </div>
          <button id="view-listing-${listingId}" style="
            width: 100%;
            background-color: #059669;
            color: white;
            border: none;
            padding: 7px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 11px;
            cursor: pointer;
            transition: background-color 0.15s ease;
          ">
            View Details & Claim &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-listing-${listingId}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectListing) onSelectListing(listing);
            navigate(`/listings/${listingId}`);
          };
        }
      });

      markersRef.current.push(marker);
    });
  }, [listings, selectedListingId, onSelectListing, navigate]);

  const handleCitySelect = (city) => {
    setActiveCity(city.name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(city.center, city.zoom, {
        duration: 1.2
      });
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100" style={{ height }}>
      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Indian City Selector Filter Bar */}
      {showCitySelector && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-[1000] bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/90 shadow-md flex items-center gap-1 overflow-x-auto max-w-full text-xs">
          <div className="flex items-center gap-1 px-2 py-1 text-slate-500 font-semibold shrink-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Region:</span>
          </div>
          {INDIA_CITIES.map(city => (
            <button
              key={city.name}
              type="button"
              onClick={() => handleCitySelect(city)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeCity === city.name
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      )}

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-md flex items-center gap-3">
        <span className="font-bold text-slate-800">India Food Hubs:</span>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Prepared Meals</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Bakery</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Dairy</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Packaged</div>
      </div>

      {/* Empty State Overlay if zero listings */}
      {listings.length === 0 && (
        <div className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
          <div className="bg-white/95 p-4 rounded-2xl border border-slate-200 shadow-lg text-center max-w-sm pointer-events-auto">
            <Info className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">No Active Surplus Listings Yet</h4>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no listings in this area. Check back soon or switch cities above to view other active food hubs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
