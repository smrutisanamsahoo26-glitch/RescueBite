import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const OrgVerificationQueue = () => {
  const { organizations, verifyOrganization } = useData();
  const { user } = useAuth();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    verifyOrganization(selectedOrg.id, reviewAction, reviewNotes, user);
    setSelectedOrg(null);
    setReviewNotes('');
  };

  return (
    <RoleLayout
      roleTitle="Non-Profit Organization Verification Applications"
      roleIcon={ShieldCheck}
    >
      <div className="mb-6">
        <p className="text-xs text-slate-500">
          Review tax documents and official charity permits before granting direct reservation permissions.
        </p>
      </div>

      <div className="space-y-4">
        {organizations.map(org => (
          <div
            key={org.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{org.name}</h3>
                <Badge
                  variant={
                    org.verificationStatus === 'approved' ? 'success' :
                    org.verificationStatus === 'pending' ? 'warning' : 'danger'
                  }
                >
                  {org.verificationStatus}
                </Badge>
              </div>

              <div className="text-xs text-slate-600">
                Type: <strong className="capitalize">{org.type.replace('_', ' ')}</strong> &bull; Registration: <strong>{org.registrationNumber}</strong>
              </div>

              <div className="text-xs text-slate-500">
                Contact: {org.contactEmail} &bull; {org.contactPhone} &bull; {org.address}
              </div>

              {/* Document List */}
              <div className="flex flex-wrap gap-2 pt-1">
                {org.verificationDocuments?.map((doc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{doc.title}</span>
                  </span>
                ))}
              </div>

              {org.reviewNotes && (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  Compliance Notes: "{org.reviewNotes}"
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Button
                size="sm"
                variant={org.verificationStatus === 'approved' ? 'secondary' : 'primary'}
                onClick={() => {
                  setSelectedOrg(org);
                  setReviewAction(org.verificationStatus === 'approved' ? 'rejected' : 'approved');
                  setReviewNotes(org.verificationStatus === 'approved' ? 'Requires supplemental health documentation' : 'Verified against IRS non-profit registry.');
                }}
              >
                {org.verificationStatus === 'pending' ? 'Review & Decide' : 'Update Status'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Review & Decision Modal */}
      <Modal
        isOpen={Boolean(selectedOrg)}
        onClose={() => setSelectedOrg(null)}
        title={`Review Application: ${selectedOrg?.name}`}
      >
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Compliance Decision</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReviewAction('approved')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                  reviewAction === 'approved'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Approve Verification
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('rejected')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                  reviewAction === 'rejected'
                    ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Reject Application
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Audit &amp; Compliance Notes</label>
            <textarea
              rows="3"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setSelectedOrg(null)}>
              Cancel
            </Button>
            <Button type="submit" variant={reviewAction === 'approved' ? 'primary' : 'danger'}>
              Save Compliance Decision
            </Button>
          </div>
        </form>
      </Modal>
    </RoleLayout>
  );
};
