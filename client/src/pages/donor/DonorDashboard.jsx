import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, Utensils, CheckCircle2, AlertCircle, ArrowRight, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const DonorDashboard = () => {
  const { listings, deleteListing, reservations, approveReservation, cancelOrRejectReservation } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Donor's own listings
  const myListings = (listings || []).filter(l => 
    l.donorId === user?.id || 
    l.donorId?._id === user?.id ||
    (l.donorName && user?.organizationName && l.donorName === user.organizationName) || 
    l.donorName?.includes('Artisan') ||
    l.donorName?.includes('Rajesh')
  );

  // Inbound reservations
  const myReservations = reservations || [];
  const pendingReservations = myReservations.filter(r => r.status === 'pending_approval');

  // Total portions listed
  const totalPortions = myListings.reduce((sum, l) => sum + (l.quantity || 0), 0);
  const remainingPortions = myListings.reduce((sum, l) => sum + (l.quantityRemaining ?? l.quantity ?? 0), 0);
  const rescuedPortions = Math.max(0, totalPortions - remainingPortions);

  return (
    <RoleLayout
      roleTitle={`${user?.organizationName || 'Donor'} Dashboard`}
      roleIcon={Utensils}
      actionButton={
        <Link to="/donor/listings/new">
          <Button icon={PlusCircle}>Post Surplus Food</Button>
        </Link>
      }
    >
      {/* Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">Active Surplus Posts</div>
          <div className="text-3xl font-extrabold text-slate-900">{myListings.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Live in community marketplace</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">Portions Diverted &amp; Rescued</div>
          <div className="text-3xl font-extrabold text-emerald-600">{rescuedPortions}</div>
          <div className="text-[11px] text-slate-400 mt-1">Out of {totalPortions} portions posted</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">Pending Recipient Claims</div>
          <div className="text-3xl font-extrabold text-amber-600">{pendingReservations.length}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {pendingReservations.length > 0 ? 'Requires your approval' : 'All claims confirmed'}
          </div>
        </div>
      </div>

      {/* Inbound Reservation Claims Section */}
      {pendingReservations.length > 0 && (
        <div className="mb-10 bg-amber-50/50 border border-amber-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Inbound Claims Requiring Donor Confirmation</h2>
            </div>
            <Link to="/donor/reservations" className="text-xs font-bold text-emerald-700 hover:underline">
              View All Claims &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {pendingReservations.map(res => (
              <div
                key={res.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">{res.listingTitle}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Claimed by: <strong className="text-slate-700">{res.organizationName}</strong> &bull; {res.quantityReserved} {res.unit}
                  </div>
                  {res.notes && (
                    <div className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">
                      "{res.notes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => cancelOrRejectReservation(res.id, 'Declined by donor', user)}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => approveReservation(res.id, user)}
                  >
                    Approve Claim
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Active Listings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Active Surplus Postings</h2>
            <p className="text-xs text-slate-500">Live listings available to nearby pantries &amp; shelters</p>
          </div>
          <Link to="/donor/listings/new">
            <Button size="sm" variant="outline" icon={PlusCircle}>
              New Post
            </Button>
          </Link>
        </div>

        {myListings.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title="No Active Surplus Postings"
            description="You have no food items listed. Post surplus bakery, meals, or produce to start reducing waste."
            actionLabel="Post Surplus Food"
            onAction={() => navigate('/donor/listings/new')}
            className="border-none"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Food Item</th>
                  <th className="py-3 px-6">Storage</th>
                  <th className="py-3 px-6">Quantity Remaining</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {myListings.map(listing => (
                  <tr key={listing.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={listing.images?.[0]?.url || listing.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}
                          alt={listing.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{listing.title}</div>
                          <div className="text-[11px] text-slate-400 capitalize">{listing.category.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 capitalize">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                        {listing.storageRequirements.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">
                        {listing.quantityRemaining} / {listing.quantity} {listing.unit}
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${(listing.quantityRemaining / listing.quantity) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={listing.quantityRemaining > 0 ? 'success' : 'neutral'}>
                        {listing.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/listings/${listing.id}`}
                          className="px-2.5 py-1 text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteListing(listing.id, user)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Withdraw Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
};
