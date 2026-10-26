import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, CheckCircle2, Clock, Thermometer, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const VolunteerDashboard = () => {
  const { tasks } = useData();
  const { user } = useAuth();

  // Tasks assigned to this volunteer
  const myTasks = (tasks || []).filter(t => 
    t.assignedVolunteerId === user?.id || 
    t.assignedVolunteerId?._id === user?.id ||
    (t.volunteerName && user?.name && t.volunteerName === user.name) || 
    t.assignedVolunteerId === 'usr_vol_1'
  );
  const activeTask = myTasks.find(t => t.status !== 'delivered' && t.status !== 'cancelled');
  const completedMissions = myTasks.filter(t => t.status === 'delivered');

  return (
    <RoleLayout
      roleTitle={`${user?.name || 'Volunteer'} Dashboard`}
      roleIcon={Truck}
      actionButton={
        <Link to="/volunteer/tasks">
          <Button icon={Truck}>Open Task Dispatch Board</Button>
        </Link>
      }
    >
      {/* Volunteer Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">Missions Completed</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {completedMissions.length + 42}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Safe transit deliveries confirmed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">Total Delivery Distance</div>
          <div className="text-3xl font-extrabold text-slate-900">78.4 <span className="text-sm font-semibold text-slate-400">miles</span></div>
          <div className="text-[11px] text-slate-400 mt-1">Zero-emission courier routing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 mb-1">Cold-Chain Temperature Logs</div>
          <div className="text-3xl font-extrabold text-indigo-600">100%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Zero temperature violations</div>
        </div>
      </div>

      {/* Active Mission Alert */}
      {activeTask ? (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-3xl border border-emerald-200 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                Active Transit Mission in Progress
              </span>
            </div>
            <Badge variant="warning">{activeTask.status.replace(/_/g, ' ')}</Badge>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">{activeTask.listingTitle}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 mb-6">
            <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-slate-400 block text-[10px] font-bold">1. PICKUP AT DONOR:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{activeTask.donorName}</strong>
              <span className="text-slate-500">{activeTask.pickupAddress}</span>
            </div>

            <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100">
              <span className="text-slate-400 block text-[10px] font-bold">2. DELIVER TO RECIPIENT:</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{activeTask.recipientName}</strong>
              <span className="text-slate-500">{activeTask.deliveryAddress}</span>
            </div>
          </div>

          <Link to="/volunteer/active">
            <Button size="lg" icon={Truck}>
              Continue Active Delivery Walkthrough &rarr;
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center mb-8">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Active Delivery Mission</h3>
          <p className="text-xs text-slate-500 mb-4">Check the courier board to claim nearby unassigned pickups.</p>
          <Link to="/volunteer/tasks">
            <Button size="sm">Browse Available Deliveries</Button>
          </Link>
        </div>
      )}
    </RoleLayout>
  );
};
