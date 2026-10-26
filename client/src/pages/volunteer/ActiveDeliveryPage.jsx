import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, MapPin, CheckCircle2, ShieldCheck, Thermometer, AlertCircle, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const ActiveDeliveryPage = () => {
  const { tasks, advanceTaskState } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Find active task for this volunteer
  const activeTask = tasks.find(t =>
    (t.assignedVolunteerId === user?.id || t.assignedVolunteerId === 'usr_vol_1') &&
    t.status !== 'delivered' &&
    t.status !== 'cancelled'
  );

  // Form State for code verification and temp log
  const [donorCodeInput, setDonorCodeInput] = useState('');
  const [tempReading, setTempReading] = useState('3.4');
  const [recipientCodeInput, setRecipientCodeInput] = useState('');
  const [stepError, setStepError] = useState('');
  const [completedSuccess, setCompletedSuccess] = useState(false);

  if (!activeTask) {
    return (
      <RoleLayout roleTitle="Active Courier Delivery Route" roleIcon={Truck}>
        <EmptyState
          icon={Truck}
          title="No Active Delivery in Progress"
          description="You do not currently have a claimed courier task. Head over to the dispatch board to claim one."
          actionLabel="View Dispatch Board"
          onAction={() => navigate('/volunteer/tasks')}
        />
      </RoleLayout>
    );
  }

  // Handle step transitions
  const handleStartEnRoute = () => {
    advanceTaskState(activeTask.id, 'en_route_pickup', null, null, user);
  };

  const handleVerifyPickup = (e) => {
    e.preventDefault();
    if (!donorCodeInput.trim()) {
      setStepError('Please enter the 6-character code provided by the food donor.');
      return;
    }
    const result = advanceTaskState(activeTask.id, 'picked_up', donorCodeInput, tempReading, user);
    if (!result.success) {
      setStepError(result.error);
    } else {
      setStepError('');
    }
  };

  const handleStartDelivery = () => {
    advanceTaskState(activeTask.id, 'en_route_delivery', null, tempReading, user);
  };

  const handleConfirmDelivery = (e) => {
    e.preventDefault();
    if (!recipientCodeInput.trim()) {
      setStepError('Please enter the 6-character code provided by the recipient receiver.');
      return;
    }
    const result = advanceTaskState(activeTask.id, 'delivered', recipientCodeInput, tempReading, user);
    if (!result.success) {
      setStepError(result.error);
    } else {
      setStepError('');
      setCompletedSuccess(true);
    }
  };

  return (
    <RoleLayout
      roleTitle="Active Courier Delivery Walkthrough"
      roleIcon={Truck}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Route Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Task #{activeTask.id}
            </span>
            <Badge variant="warning">{activeTask.status.replace(/_/g, ' ')}</Badge>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 mb-1">{activeTask.listingTitle}</h2>
          <p className="text-xs text-slate-500 mb-4">{activeTask.quantityText} &bull; {activeTask.storageRequirements}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">1. DONOR PICKUP:</span>
              <strong className="text-slate-800 text-sm block">{activeTask.donorName}</strong>
              <span className="text-slate-600">{activeTask.pickupAddress}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px]">2. RECIPIENT DROP-OFF:</span>
              <strong className="text-slate-800 text-sm block">{activeTask.recipientName}</strong>
              <span className="text-slate-600">{activeTask.deliveryAddress}</span>
            </div>
          </div>
        </div>

        {/* Interactive Step-by-Step State Flow */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">
            Transit Step-by-Step Protocol
          </h3>

          {stepError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* Stage 1: Assigned */}
          {activeTask.status === 'assigned' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed">
                You have accepted this delivery mission. Tap below to notify the donor that you are navigating to their kitchen.
              </div>
              <Button fullWidth size="lg" onClick={handleStartEnRoute}>
                Start Journey to Donor ({activeTask.pickupAddress})
              </Button>
            </div>
          )}

          {/* Stage 2: En Route to Pickup */}
          {activeTask.status === 'en_route_pickup' && (
            <form onSubmit={handleVerifyPickup} className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
                <strong>Arrived at Donor:</strong> Request the 6-character <strong>Pickup Handoff Code</strong> from the kitchen manager (Hint for demo: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">{activeTask.pickupVerificationCode}</code>).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Donor Handoff Verification Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. RB-7492"
                  value={donorCodeInput}
                  onChange={(e) => setDonorCodeInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Insulated Bag Temperature Check (°C) *</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempReading}
                  onChange={(e) => setTempReading(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Mandatory cold-chain compliance check. Must be under 4°C for refrigerated meals.
                </span>
              </div>

              <Button type="submit" fullWidth size="lg">
                Confirm Handoff &amp; Pick Up Food
              </Button>
            </form>
          )}

          {/* Stage 3: Picked Up */}
          {activeTask.status === 'picked_up' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
                <strong>Food Picked Up Safely!</strong> Surplus items are secured in thermal packaging.
              </div>
              <Button fullWidth size="lg" onClick={handleStartDelivery}>
                Start Transit to Recipient ({activeTask.deliveryAddress})
              </Button>
            </div>
          )}

          {/* Stage 4: En Route Delivery */}
          {activeTask.status === 'en_route_delivery' && (
            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950">
                <strong>Arrived at Recipient Destination:</strong> Hand over portions and ask the shelter staff for their <strong>Recipient Delivery Code</strong> (Hint for demo: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">{activeTask.deliveryVerificationCode}</code>).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Confirmation Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. RB-3810"
                  value={recipientCodeInput}
                  onChange={(e) => setRecipientCodeInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <Button type="submit" fullWidth size="lg">
                Complete Delivery Mission
              </Button>
            </form>
          )}

          {/* Mission Complete Feedback */}
          {completedSuccess && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-xl font-bold text-slate-900 mb-1">Mission Completed Successfully!</h4>
              <p className="text-xs text-slate-500 mb-6">
                Wholesome food safely redistributed to <strong>{activeTask.recipientName}</strong>. The custody log and environmental savings have been recorded.
              </p>
              <Button onClick={() => navigate('/volunteer/dashboard')}>
                Return to Volunteer Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
};
