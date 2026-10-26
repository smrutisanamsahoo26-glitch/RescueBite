import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Thermometer,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Calendar,
  Flag,
  Share2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AllergenTag, DietaryTag } from '../../components/listings/AllergenTag';
import { DemoBadge } from '../../components/common/DemoBadge';

export const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, loading, createReservation, submitReport } = useData();
  const { user, isRecipient, isGuest } = useAuth();

  const [directListing, setDirectListing] = useState(null);
  const [directLoading, setDirectLoading] = useState(false);

  // Fallback: if not found in cache, fetch directly by ID
  useEffect(() => {
    const cached = (listings || []).find(l => (l._id || l.id) === id);
    if (!cached && id) {
      setDirectLoading(true);
      api.getListingById(id)
        .then(res => {
          if (res?.data?.listing) setDirectListing(res.data.listing);
        })
        .catch(() => {})
        .finally(() => setDirectLoading(false));
    }
  }, [id, listings]);

  const listing = (listings || []).find(l => (l._id || l.id) === id) || directListing;

  // Reservation Form State
  const [reserveQty, setReserveQty] = useState(1);
  const [recipientNotes, setRecipientNotes] = useState('');
  const [resSuccess, setResSuccess] = useState(null);
  const [resError, setResError] = useState('');

  // Report Safety Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('food_safety_hazard');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if ((loading || directLoading) && !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading food listing details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Food Listing Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">This listing may have been completed, expired, or withdrawn.</p>
        <Button onClick={() => navigate('/explore')}>Return to Marketplace</Button>
      </div>
    );
  }

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    const maxQty = listing.quantityRemaining ?? listing.quantity;
    if (reserveQty <= 0 || reserveQty > maxQty) {
      setResError(`Requested quantity must be between 1 and ${maxQty}`);
      return;
    }

    try {
      const res = await createReservation({
        listingId: listing._id || listing.id,
        quantityReserved: reserveQty,
        notes: recipientNotes
      });
      setResSuccess(res);
      setResError('');
    } catch (err) {
      setResError(err.message || 'Reservation failed');
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    submitReport({
      targetType: 'listing',
      targetTitle: listing.title,
      reason: reportReason,
      description: reportDesc,
      severity: 'high'
    }, user);
    setReportSubmitted(true);
    setTimeout(() => {
      setIsReportOpen(false);
      setReportSubmitted(false);
    }, 1800);
  };

  const percentRemaining = Math.max(0, Math.round((listing.quantityRemaining / listing.quantity) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button & Tag */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </button>

        <div className="flex items-center gap-2">
          <DemoBadge text="Simulated Listing Details" />
          <button
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report Safety Issue</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image & Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video shadow-sm">
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="primary" size="lg" className="capitalize">
                {listing.category.replace('_', ' ')}
              </Badge>
              {listing.requiresVolunteer && (
                <div className="bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Courier Eligible</span>
                </div>
              )}
            </div>
          </div>

          {/* Title & Donor Overview */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-2">
              <span>{listing.donorName}</span>
              {listing.donorVerified && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Donor</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {listing.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Storage & Food Safety Protocols */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Food Safety &amp; Handling Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Thermometer className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Storage Requirement</div>
                  <div className="text-xs text-slate-600 capitalize">
                    {listing.storageRequirements.replace('_', ' ')}
                    {listing.storageRequirements === 'refrigerated' && ' (0°C to 4°C)'}
                    {listing.storageRequirements === 'frozen' && ' (Below -18°C)'}
                    {listing.storageRequirements === 'hot_holding' && ' (Above 60°C)'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Preparation &amp; Expiry</div>
                  <div className="text-xs text-slate-600">
                    Prepared: Today, 5:00 AM
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">Dietary Certifications:</div>
              <div className="flex flex-wrap gap-1.5">
                {listing.dietaryInfo?.length > 0 ? (
                  listing.dietaryInfo.map(d => <DietaryTag key={d} diet={d} />)
                ) : (
                  <span className="text-xs text-slate-400">None specified</span>
                )}
              </div>
            </div>

            {/* Allergens Warning */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1.5">Declared Allergens:</div>
              <div className="flex flex-wrap gap-1.5">
                {listing.allergens?.filter(a => a !== 'none').length > 0 ? (
                  listing.allergens.filter(a => a !== 'none').map(a => <AllergenTag key={a} allergen={a} />)
                ) : (
                  <span className="text-xs text-emerald-700 font-medium">No major allergens declared</span>
                )}
              </div>
            </div>
          </div>

          {/* Pickup Address & Proximity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Pickup Location &amp; Instructions
            </h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-slate-800">{listing.address}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Commercial loading bay available. Please announce your organization name upon arrival.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Claim & Reservation Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
            <div className="flex justify-between items-baseline mb-4">
              <div>
                <span className="text-3xl font-extrabold text-slate-900">
                  {listing.quantityRemaining}
                </span>
                <span className="text-sm font-semibold text-slate-500 ml-1.5">
                  {listing.unit} left
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Original: {listing.quantity} {listing.unit}
              </span>
            </div>

            {/* Stock Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentRemaining > 30 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${percentRemaining}%` }}
              />
            </div>

            {/* Time Window Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 mb-6 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Strict Pickup Window</div>
                <div>Today between 2:00 PM and 9:00 PM. Uncollected food will automatically be re-allocated.</div>
              </div>
            </div>

            {/* Reservation Form */}
            {resSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-emerald-950 mb-1">Portions Reserved!</h4>
                <p className="text-xs text-emerald-800 mb-3">
                  You reserved {resSuccess.quantityReserved} {resSuccess.unit}.
                </p>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 mb-4 text-xs">
                  <span className="text-slate-500">Your 6-Digit Pickup Code:</span>
                  <div className="font-mono text-base font-extrabold text-emerald-700 tracking-wider">
                    {resSuccess.pickupCode}
                  </div>
                </div>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => navigate('/recipient/reservations')}
                >
                  Go to My Reservations
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReservationSubmit} className="space-y-4">
                {resError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{resError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Portions to Reserve ({listing.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={listing.quantityRemaining}
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Number(e.target.value))}
                    disabled={listing.quantityRemaining <= 0}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shelter / Pantry Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    value={recipientNotes}
                    onChange={(e) => setRecipientNotes(e.target.value)}
                    placeholder="e.g. Arriving at 4:30 PM with insulated transport boxes..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                </div>

                <Button
                  fullWidth
                  type="submit"
                  size="lg"
                  disabled={listing.quantityRemaining <= 0}
                >
                  {listing.quantityRemaining > 0 ? `Reserve ${reserveQty} ${listing.unit} Now` : 'Fully Claimed'}
                </Button>

                <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Protected under the Good Samaritan Food Donation Act. Atomic reservations prevent double-booking.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Safety Report Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Report Food Safety or Compliance Hazard"
      >
        {reportSubmitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800 mb-1">Incident Report Submitted</h4>
            <p className="text-xs text-slate-500">
              Our safety compliance administrators have been alerted and will investigate this listing immediately.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="text-xs text-slate-500">
              Help maintain community trust. Submitting a report flags this listing for immediate administrative inspection.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Flag</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="food_safety_hazard">Temperature or Cold-Chain Violation</option>
                <option value="spoilage">Visible Spoilage or Off-Odor</option>
                <option value="undeclared_allergen">Undeclared Major Allergen</option>
                <option value="misrepresentation">Misrepresented Quantity or Quality</option>
                <option value="other">Other Conduct Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Incident Details</label>
              <textarea
                rows="3"
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe what you observed (e.g. ambient reading during refrigeration check)..."
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger">
                Submit Safety Report
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
