import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, Search, Clock, ShieldCheck, AlertCircle, ArrowRight, MapPin } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { FoodCard } from '../../components/listings/FoodCard';

export const RecipientDashboard = () => {
  const { listings, reservations } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active reservations for this recipient
  const myReservations = (reservations || []).filter(r => 
    r.recipientId === user?.id || 
    r.recipientId?._id === user?.id || 
    r.organizationId === user?.organizationId ||
    (r.organizationName && user?.organizationName && r.organizationName === user.organizationName)
  );
  const activeClaims = myReservations.filter(r => r.status === 'pending_approval' || r.status === 'approved');

  // Nearby surplus recommendations
  const recommendedListings = (listings || []).filter(l => (l.quantityRemaining ?? l.quantity ?? 0) > 0).slice(0, 3);

  const isVerified = user?.verificationStatus === 'approved';

  return (
    <RoleLayout
      roleTitle={`${user?.organizationName || 'Recipient Organization'} Dashboard`}
      roleIcon={HeartHandshake}
      actionButton={
        <Link to="/explore">
          <Button icon={Search}>Browse Surplus Marketplace</Button>
        </Link>
      }
    >
      {/* Verification Status Alert */}
      <div className={`p-4 rounded-3xl border mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isVerified
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isVerified ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
          }`}>
            {isVerified ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold">
              Verification Status: {isVerified ? 'Official 501(c)(3) Recipient Approved' : 'Verification Under Review'}
            </div>
            <div className="text-[11px] opacity-80">
              {isVerified
                ? 'Your organization is verified to claim surplus portions directly from donors.'
                : 'Your registration documents are being reviewed by our compliance team.'}
            </div>
          </div>
        </div>

        <Link
          to="/recipient/organization/verify"
          className="text-xs font-bold underline shrink-0 hover:opacity-80"
        >
          {isVerified ? 'View Documents' : 'Submit Verification Docs &rarr;'}
        </Link>
      </div>

      {/* Active Reservations Summary */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Food Claims &amp; Scheduled Pickups</h2>
            <p className="text-xs text-slate-500">Pick up with your 6-digit confirmation code</p>
          </div>
          <Link to="/recipient/reservations" className="text-xs font-bold text-emerald-700 hover:underline">
            View All Claims &rarr;
          </Link>
        </div>

        {activeClaims.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            No active claims right now. Explore the marketplace to reserve surplus portions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeClaims.map(claim => (
              <div
                key={claim.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={claim.status === 'approved' ? 'success' : 'warning'}>
                    {claim.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-400">Claim ID: {claim.id}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{claim.listingTitle}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">Donor: {claim.donorName}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Reserved Quantity:</span>
                    <strong className="text-slate-800">{claim.quantityReserved} {claim.unit}</strong>
                  </div>
                  {claim.status === 'approved' && (
                    <div className="text-right">
                      <span className="text-emerald-700 font-bold block text-[10px]">Pickup Handoff Code:</span>
                      <strong className="font-mono text-sm font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {claim.pickupCode}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Pickup by: Today, 9:00 PM</span>
                  <Link to="/recipient/reservations" className="text-emerald-600 font-bold hover:underline">
                    Manage Claim &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Surplus Food Nearby */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recommended Surplus Food Nearby</h2>
            <p className="text-xs text-slate-500">Available portions ready for reservation</p>
          </div>
          <Link to="/explore" className="text-xs font-bold text-emerald-700 hover:underline">
            Open Map &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedListings.map(listing => (
            <FoodCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </RoleLayout>
  );
};
