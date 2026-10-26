import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, FileText, Users, Utensils, CheckCircle2, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard = () => {
  const { organizations, reports, auditLogs, listings, impactMetrics } = useData();

  const pendingOrgs = organizations.filter(o => o.verificationStatus === 'pending');
  const openReports = reports.filter(r => r.status === 'open');

  return (
    <RoleLayout
      roleTitle="Platform Administration &amp; Moderation"
      roleIcon={ShieldCheck}
    >
      {/* Platform Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/verifications" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-all">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-bold uppercase text-slate-500">Pending Org Verifications</div>
            <Badge variant={pendingOrgs.length > 0 ? 'warning' : 'neutral'}>{pendingOrgs.length} pending</Badge>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{pendingOrgs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">501(c)(3) filings awaiting review</div>
        </Link>

        <Link to="/admin/moderation" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-500 transition-all">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs font-bold uppercase text-slate-500">Safety &amp; Conduct Reports</div>
            <Badge variant={openReports.length > 0 ? 'danger' : 'neutral'}>{openReports.length} open</Badge>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{openReports.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Hazard or cold-chain incident flags</div>
        </Link>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-500 mb-2">Total Food Rescued</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {(impactMetrics?.totalRescuedKg ?? 0).toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across {(listings || []).length} verified listings</div>
        </div>

        <Link to="/admin/audit-logs" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-500 transition-all">
          <div className="text-xs font-bold uppercase text-slate-500 mb-2">Immutable Audit Trail</div>
          <div className="text-3xl font-extrabold text-indigo-700">{auditLogs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged compliance transactions</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification Queue Preview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Organization Verification Queue</h2>
            <Link to="/admin/verifications" className="text-xs font-bold text-emerald-700 hover:underline">
              View All &rarr;
            </Link>
          </div>

          {pendingOrgs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No pending non-profit verifications in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrgs.slice(0, 3).map(org => (
                <div
                  key={org.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">{org.name}</div>
                    <div className="text-[11px] text-slate-400">{org.type.replace('_', ' ')} &bull; {org.registrationNumber}</div>
                  </div>
                  <Link
                    to="/admin/verifications"
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safety Reports Preview */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Incident Reports</h2>
            <Link to="/admin/moderation" className="text-xs font-bold text-rose-700 hover:underline">
              View All &rarr;
            </Link>
          </div>

          {openReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No open safety or conduct incident reports.
            </div>
          ) : (
            <div className="space-y-3">
              {openReports.slice(0, 3).map(rep => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-rose-950">{rep.targetTitle}</div>
                    <div className="text-[11px] text-rose-700">{rep.reason.replace(/_/g, ' ')} &bull; Flagged by {rep.reporterName}</div>
                  </div>
                  <Link
                    to="/admin/moderation"
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700"
                  >
                    Inspect
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
};
