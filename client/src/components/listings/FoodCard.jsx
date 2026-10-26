import React from 'react';
import { Clock, MapPin, ShieldCheck, Thermometer, Truck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AllergenTag, DietaryTag } from './AllergenTag';
import { DemoBadge } from '../common/DemoBadge';

export const FoodCard = ({ listing, onReserveClick }) => {
  const navigate = useNavigate();
  const listingId = listing._id || listing.id;
  const imgSrc = (listing.images && listing.images[0]?.url) || (listing.images && listing.images[0]) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  const getStorageBadge = (storage) => {
    switch (storage) {
      case 'refrigerated':
        return <Badge variant="info" size="sm"><Thermometer className="w-3 h-3 mr-1" /> Refrig 0-4°C</Badge>;
      case 'frozen':
        return <Badge variant="purple" size="sm"><Thermometer className="w-3 h-3 mr-1" /> Frozen &lt;-18°C</Badge>;
      case 'hot_holding':
        return <Badge variant="warning" size="sm"><Thermometer className="w-3 h-3 mr-1" /> Hot &gt;60°C</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Ambient</Badge>;
    }
  };

  const getStatusBadge = (status, remaining) => {
    if (status === 'fully_reserved' || remaining <= 0) {
      return <Badge variant="neutral" size="sm">Fully Claimed</Badge>;
    }
    if (status === 'partially_reserved') {
      return <Badge variant="warning" size="sm">Partially Claimed</Badge>;
    }
    return <Badge variant="success" size="sm">Available</Badge>;
  };

  // Remaining percentage
  const percentRemaining = Math.max(0, Math.round(((listing.quantityRemaining ?? listing.quantity) / listing.quantity) * 100));

  return (
    <Card hover className="flex flex-col h-full group">
      {/* Food Photo Container */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {getStatusBadge(listing.status, listing.quantityRemaining ?? listing.quantity)}
          {getStorageBadge(listing.storageRequirements)}
          {listing.isDemo && <DemoBadge text="Demo Data" />}
        </div>
        {listing.requiresVolunteer && (
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Volunteer Courier Eligible</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Donor & Location */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1 truncate max-w-[200px]">
              {listing.donorName}
              {listing.donorVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />}
            </span>
            <span className="flex items-center gap-1 shrink-0 text-slate-400">
              <MapPin className="w-3 h-3" />
              1.2 mi away
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => navigate(`/listings/${listingId}`)}
            className="text-base font-bold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-2 mb-2 cursor-pointer"
          >
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {listing.description}
          </p>

          {/* Dietary & Allergens */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {listing.dietaryInfo?.map(diet => (
              <DietaryTag key={diet} diet={diet} />
            ))}
            {listing.allergens?.filter(a => a !== 'none').map(allergen => (
              <AllergenTag key={allergen} allergen={allergen} />
            ))}
          </div>
        </div>

        {/* Inventory Stock & Action Footer */}
        <div className="pt-4 border-t border-slate-100 mt-2">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700">
              {listing.quantityRemaining ?? listing.quantity} of {listing.quantity} {listing.unit} left
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              Pickup by 9:00 PM
            </span>
          </div>

          {/* Remaining Quantity Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentRemaining > 30 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${percentRemaining}%` }}
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate(`/listings/${listingId}`)}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-center"
            >
              Details
            </button>
            <button
              disabled={(listing.quantityRemaining ?? listing.quantity) <= 0}
              onClick={() => {
                if (onReserveClick) onReserveClick(listing);
                else navigate(`/listings/${listingId}`);
              }}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <span>{(listing.quantityRemaining ?? listing.quantity) > 0 ? 'Reserve' : 'Claimed'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
