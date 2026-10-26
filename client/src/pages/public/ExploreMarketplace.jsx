import React, { useState, useMemo } from 'react';
import { MapPin, LayoutGrid, Map, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { FoodFilter } from '../../components/listings/FoodFilter';
import { FoodCard } from '../../components/listings/FoodCard';
import { FoodMap } from '../../components/map/FoodMap';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { DemoBadge } from '../../components/common/DemoBadge';

export const ExploreMarketplace = () => {
  const { listings, createReservation } = useData();
  const { user, isRecipient, isGuest } = useAuth();
  const navigate = useNavigate();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState([]);
  const [storageFilter, setStorageFilter] = useState('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'grid', 'map'

  // Reservation Modal State
  const [selectedListing, setSelectedListing] = useState(null);
  const [reserveQty, setReserveQty] = useState(1);
  const [recipientNotes, setRecipientNotes] = useState('');
  const [resSuccess, setResSuccess] = useState(null);
  const [resError, setResError] = useState('');

  // Toggle dietary tag
  const handleDietaryToggle = (diet) => {
    setDietaryFilter(prev =>
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    );
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return (listings || []).filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title ? item.title.toLowerCase().includes(q) : false;
        const matchesDonor = (item.donorName || item.donorId?.name || '').toLowerCase().includes(q);
        const matchesDesc = item.description ? item.description.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDonor && !matchesDesc) return false;
      }
      // Category
      if (category !== 'all' && item.category !== category) return false;
      // Storage
      if (storageFilter !== 'all' && item.storageRequirements !== storageFilter) return false;
      // Dietary
      if (dietaryFilter.length > 0) {
        const hasAllDietary = dietaryFilter.every(d => item.dietaryInfo?.includes(d));
        if (!hasAllDietary) return false;
      }
      // Only Available
      if (onlyAvailable && (item.quantityRemaining ?? item.quantity ?? 0) <= 0) return false;

      return true;
    });
  }, [listings, searchQuery, category, dietaryFilter, storageFilter, onlyAvailable]);

  // Open reservation modal
  const handleOpenReserve = (listing) => {
    setSelectedListing(listing);
    setReserveQty(Math.min(listing.quantityRemaining, 5));
    setRecipientNotes('');
    setResSuccess(null);
    setResError('');
  };

  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!selectedListing) return;

    const maxQty = selectedListing.quantityRemaining ?? selectedListing.quantity;
    if (reserveQty <= 0 || reserveQty > maxQty) {
      setResError(`Please enter a quantity between 1 and ${maxQty}`);
      return;
    }

    try {
      const res = await createReservation({
        listingId: selectedListing._id || selectedListing.id,
        quantityReserved: reserveQty,
        notes: recipientNotes
      });

      setResSuccess(res);
      setResError('');
    } catch (err) {
      setResError(err.message || 'Failed to confirm reservation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Surplus Food Discovery
            </h1>
            <DemoBadge text="Interactive Live Inventory" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Browse available surplus food with real-time quantities, dietary tags, and cold-chain specs.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'split' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Split Map</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'map' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map Only</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FoodFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        dietaryFilter={dietaryFilter}
        onDietaryChange={handleDietaryToggle}
        storageFilter={storageFilter}
        onStorageChange={setStorageFilter}
        onlyAvailable={onlyAvailable}
        onOnlyAvailableChange={setOnlyAvailable}
      />

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4">
        <span>Showing {filteredListings.length} surplus food donations nearby</span>
        {isGuest && (
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Log in as Recipient to claim portions directly
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Cards List */}
          <div className="lg:col-span-7 space-y-4 max-h-[780px] overflow-y-auto pr-1">
            {filteredListings.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No Surplus Food Found"
                description="Try loosening your search filters, category selection, or dietary requirements."
                actionLabel="Reset Search Filters"
                onAction={() => {
                  setSearchQuery('');
                  setCategory('all');
                  setDietaryFilter([]);
                  setStorageFilter('all');
                  setOnlyAvailable(false);
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredListings.map(listing => (
                  <FoodCard
                    key={listing.id}
                    listing={listing}
                    onReserveClick={handleOpenReserve}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sticky Map */}
          <div className="lg:col-span-5 sticky top-24">
            <FoodMap
              listings={filteredListings}
              height="740px"
              onSelectListing={handleOpenReserve}
            />
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div>
          {filteredListings.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No Surplus Food Found"
              description="No donations match your selected filters."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchQuery('');
                setCategory('all');
                setDietaryFilter([]);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map(listing => (
                <FoodCard
                  key={listing.id}
                  listing={listing}
                  onReserveClick={handleOpenReserve}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'map' && (
        <div>
          <FoodMap
            listings={filteredListings}
            height="620px"
            onSelectListing={handleOpenReserve}
          />
        </div>
      )}

      {/* Reservation Action Modal */}
      <Modal
        isOpen={Boolean(selectedListing)}
        onClose={() => setSelectedListing(null)}
        title={resSuccess ? "Reservation Confirmed!" : `Reserve Food: ${selectedListing?.title}`}
      >
        {resSuccess ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Portions Successfully Reserved!</h4>
            <p className="text-xs text-slate-500 mb-4">
              Your claim has been forwarded to <strong>{selectedListing?.donorName}</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Quantity:</span>
                <span className="font-bold text-slate-800">{resSuccess.quantityReserved} {resSuccess.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Deadline:</span>
                <span className="font-bold text-slate-800">Today before 9:00 PM</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Your 6-Digit Handoff Code:</span>
                <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {resSuccess.pickupCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => setSelectedListing(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedListing(null);
                  navigate('/recipient/reservations');
                }}
              >
                View My Claims
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmReservation} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800 mb-1">{selectedListing?.title}</div>
              <div className="text-slate-500 flex justify-between">
                <span>Offered by: {selectedListing?.donorName}</span>
                <span className="font-bold text-emerald-700">{selectedListing?.quantityRemaining} {selectedListing?.unit} available</span>
              </div>
            </div>

            {resError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{resError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity to Reserve ({selectedListing?.unit}) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedListing?.quantityRemaining || 1}
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-bold"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Atomic reservation locks portions to prevent duplicate claims.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipient Distribution Notes (Optional)
              </label>
              <textarea
                rows="2"
                value={recipientNotes}
                onChange={(e) => setRecipientNotes(e.target.value)}
                placeholder="e.g. Scheduled for evening dinner service at community shelter..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setSelectedListing(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Confirm Claim ({reserveQty} {selectedListing?.unit})
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
