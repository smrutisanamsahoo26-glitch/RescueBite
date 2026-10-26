import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, UserX, Clock } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const ModerationReports = () => {
  const { reports, resolveReport } = useData();
  const { user } = useAuth();

  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionAction, setResolutionAction] = useState('warned');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    resolveReport(selectedReport.id, resolutionAction, resolutionNotes, user);
    setSelectedReport(null);
    setResolutionNotes('');
  };

  return (
    <RoleLayout
      roleTitle="Food Safety &amp; Community Incident Reports"
      roleIcon={ShieldAlert}
    >
      <div className="mb-6">
        <p className="text-xs text-slate-500">
          Investigate reported temperature deviations, undeclared allergens, and conduct complaints.
        </p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All Clear — Zero Open Incident Flags"
          description="There are currently no open reports requiring administrative intervention."
        />
      ) : (
        <div className="space-y-4">
          {reports.map(rep => (
            <div
              key={rep.id}
              className={`rounded-3xl border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                rep.status === 'open' ? 'bg-white border-rose-200' : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={rep.status === 'open' ? 'danger' : 'neutral'}>
                    {rep.status}
                  </Badge>
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                    {rep.reason.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400">&bull; Report #{rep.id}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{rep.targetTitle}</h3>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {rep.description}
                </p>

                <div className="text-xs text-slate-400">
                  Flagged by: <strong className="text-slate-600">{rep.reporterName}</strong> &bull; Severity: <span className="uppercase font-bold text-slate-700">{rep.severity}</span>
                </div>

                {rep.adminNotes && (
                  <div className="text-xs text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-200">
                    Resolution: "{rep.adminNotes}"
                  </div>
                )}
              </div>

              {rep.status === 'open' && (
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedReport(rep);
                      setResolutionNotes('Investigated cold-chain deviation; issued compliance warning.');
                    }}
                  >
                    Moderate Incident
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Moderate Incident Modal */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={`Moderate Incident: ${selectedReport?.targetTitle}`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Moderator Action</label>
            <select
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="warned">Issue Written Food Safety Warning</option>
              <option value="listing_removed">Withdraw Listing Immediately</option>
              <option value="user_suspended">Suspend Account Pending Audit</option>
              <option value="dismissed">Dismiss (False Alarm / Inconclusive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Summary</label>
            <textarea
              rows="3"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>
    </RoleLayout>
  );
};
