import React, { useState } from 'react';
import { Utensils, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

export const DonorReservationsPage = () => {
  const { reservations, approveReservation, cancelOrRejectReservation } = useData();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const myReservations = reservations;

  const filteredReservations = myReservations.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <RoleLayout
      roleTitle="Inbound Reservation Claims"
      roleIcon={Utensils}
    >
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'pending_approval', 'approved', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === f
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Inbound Claims Found"
          description="There are currently no recipient claims matching this status filter."
        />
      ) : (
        <div className="space-y-4">
          {filteredReservations.map(res => (
            <div
              key={res.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={
                      res.status === 'approved' ? 'success' :
                      res.status === 'pending_approval' ? 'warning' :
                      res.status === 'completed' ? 'info' : 'neutral'
                    }
                  >
                    {res.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-slate-400">Claim ID: {res.id}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{res.listingTitle}</h3>

                <div className="text-xs text-slate-600">
                  Recipient Organization: <strong className="text-slate-800">{res.organizationName}</strong>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span>Reserved: <strong>{res.quantityReserved} {res.unit}</strong></span>
                  <span>&bull;</span>
                  <span>Pickup by: <strong>Today, 9:00 PM</strong></span>
                </div>

                {res.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    Recipient Note: "{res.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons & Codes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                {res.status === 'pending_approval' && (
                  <div className="flex items-center gap-2">
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
                      Confirm Claim
                    </Button>
                  </div>
                )}

                {res.status === 'approved' && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center">
                    <div className="text-[11px] font-bold text-emerald-800 mb-0.5">Handoff Verification Code</div>
                    <div className="font-mono text-base font-extrabold text-emerald-950 tracking-wider">
                      {res.pickupCode}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      Verify this code with courier upon pickup
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </RoleLayout>
  );
};
