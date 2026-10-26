import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, Thermometer, ArrowRight, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const TaskBoardPage = () => {
  const { tasks, claimTask } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const unassignedTasks = tasks.filter(t => t.status === 'unassigned');

  const handleClaim = (taskId) => {
    claimTask(taskId, user);
    navigate('/volunteer/active');
  };

  return (
    <RoleLayout
      roleTitle="Volunteer Dispatch &amp; Delivery Board"
      roleIcon={Truck}
    >
      <div className="mb-6">
        <p className="text-xs text-slate-500">
          Claim surplus food deliveries to transport wholesome food from donors directly to recipient shelters.
        </p>
      </div>

      {unassignedTasks.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="All Nearby Deliveries Claimed!"
          description="There are currently no unassigned courier missions in your area. Check back shortly as new surplus food is posted."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unassignedTasks.map(task => (
            <div
              key={task.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="warning">Ready for Pickup</Badge>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {task.distanceMiles} miles route
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{task.listingTitle}</h3>

                {/* Route stops */}
                <div className="space-y-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      A
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</span>
                      <div className="font-bold text-slate-800">{task.donorName}</div>
                      <div className="text-slate-500">{task.pickupAddress}</div>
                    </div>
                  </div>

                  <div className="border-l-2 border-dashed border-slate-300 ml-2.5 h-3" />

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      B
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Drop-Off Destination</span>
                      <div className="font-bold text-slate-800">{task.recipientName}</div>
                      <div className="text-slate-500">{task.deliveryAddress}</div>
                    </div>
                  </div>
                </div>

                {/* Storage specs */}
                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  <span>Portions: <strong>{task.quantityText}</strong></span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                    {task.storageRequirements}
                  </span>
                </div>
              </div>

              <Button
                fullWidth
                variant="primary"
                onClick={() => handleClaim(task.id)}
              >
                Claim Delivery Mission &rarr;
              </Button>
            </div>
          ))}
        </div>
      )}
    </RoleLayout>
  );
};
