import React, { useState } from 'react';
import { ShieldCheck, Upload, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const OrgVerificationPage = () => {
  const { user } = useAuth();
  const { organizations } = useData();

  const [documentTitle, setDocumentTitle] = useState('501(c)(3) IRS Tax Exemption Letter.pdf');
  const [submitted, setSubmitted] = useState(false);

  // Find user's org
  const org = organizations.find(o => o.name === user?.organizationName) || organizations[0];
  const isApproved = org?.verificationStatus === 'approved';

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <RoleLayout
      roleTitle="Non-Profit Organization Verification"
      roleIcon={ShieldCheck}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Verification Status Banner */}
        <div className={`p-6 rounded-3xl border ${
          isApproved
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base">Current Status:</span>
              <Badge variant={isApproved ? 'success' : 'warning'} size="lg" className="uppercase font-bold">
                {org?.verificationStatus || 'pending'}
              </Badge>
            </div>
            <span className="text-xs text-slate-400">EIN: {org?.registrationNumber || 'EIN-84-9281742'}</span>
          </div>

          <p className="text-xs leading-relaxed opacity-90">
            {isApproved
              ? 'Your non-profit recipient organization is fully verified. You can claim surplus food portions with priority donor handoff.'
              : 'Your documentation is under review by the RescueBite administrative team.'}
          </p>

          {org?.reviewNotes && (
            <div className="mt-4 p-3 bg-white/70 rounded-2xl border border-emerald-200/50 text-xs text-emerald-900">
              <strong>Admin Compliance Note:</strong> {org.reviewNotes}
            </div>
          )}
        </div>

        {/* Upload Documentation Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Submit Compliance &amp; Tax Documents
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Upload official government-issued non-profit certificates or food storage permits.
          </p>

          {submitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Document uploaded successfully! It has been queued for administrator review.</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
              <select className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl">
                <option>501(c)(3) IRS Tax Exemption Determination Letter</option>
                <option>State Non-Profit Incorporation Certificate</option>
                <option>Health Department Community Food Facility Permit</option>
                <option>Warehouse Food Storage Inspection Report</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">File Attachment (Simulated Upload)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700 mb-1">Select PDF or Scanned Permit</div>
                <div className="text-[11px] text-slate-400">{documentTitle}</div>
              </div>
            </div>

            <Button type="submit" size="md">
              Upload Verification Document
            </Button>
          </form>
        </div>

        {/* Approved Documents List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Submitted Verification Files
          </h3>

          <div className="space-y-3">
            {org?.verificationDocuments?.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-800">{doc.title}</div>
                    <div className="text-[11px] text-slate-400">Uploaded on {doc.uploadedAt}</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};
