import React from 'react';
import { Scale, Thermometer, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { DemoBadge } from '../../components/common/DemoBadge';

export const SafetyGuidelinesPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <DemoBadge text="Standard Operating Procedures" />
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3 mb-2">
          Food Safety &amp; Legal Framework
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          How RescueBite protects donors, volunteers, and recipients through verified cold-chain and legal immunity.
        </p>
      </div>

      <div className="space-y-8">
        {/* Good Samaritan Act */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bill Emerson Good Samaritan Food Donation Act
              </h2>
              <div className="text-xs text-slate-500">Federal Statute 42 U.S. Code § 1791</div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            Under United States Federal Law, individuals, restaurants, grocers, and commercial food businesses who donate apparently wholesome food in good faith to non-profit organizations for ultimate distribution to individuals in need are shielded from criminal and civil liability.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-900">Covers direct donations made through verified 501(c)(3) pantries and shelters.</span>
            </div>
            <div className="flex items-start gap-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-900">Protects volunteers transporting food under platform safety guidelines.</span>
            </div>
          </div>
        </div>

        {/* Temperature Danger Zone */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Temperature Danger Zone &amp; Cold-Chain Integrity
              </h2>
              <div className="text-xs text-slate-500">Critical control points for surplus redistribution</div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            Bacteria grow most rapidly in the range of temperatures between <strong>4°C and 60°C (40°F and 140°F)</strong>. Food left in this zone for longer than 2 hours is strictly ineligible for rescue.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
              <div className="font-bold text-sky-900 mb-1">Refrigerated Surplus</div>
              <div className="text-sky-700 text-base font-extrabold mb-1">0°C to 4°C (32°F - 40°F)</div>
              <div className="text-[11px] text-sky-600 leading-relaxed">
                Must be transported in insulated thermal totes with frozen gel packs. Temperature logged at pickup and drop-off.
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <div className="font-bold text-purple-900 mb-1">Frozen Surplus</div>
              <div className="text-purple-700 text-base font-extrabold mb-1">&lt; -18°C (&lt; 0°F)</div>
              <div className="text-[11px] text-purple-600 leading-relaxed">
                Must show no evidence of thawing or refreezing (e.g. ice crystallization pools).
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="font-bold text-amber-900 mb-1">Hot Holding Surplus</div>
              <div className="text-amber-700 text-base font-extrabold mb-1">&gt; 60°C (&gt; 140°F)</div>
              <div className="text-[11px] text-amber-600 leading-relaxed">
                Must be transported within 90 minutes of packaging in commercial steam-holding transport containers.
              </div>
            </div>
          </div>
        </div>

        {/* 2-Factor Handoff Verification */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                2-Party Handoff Verification Codes
              </h2>
              <div className="text-xs text-slate-500">Preventing unauthorized pickups and delivery errors</div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
            Every approved reservation automatically issues unique 6-digit confirmation codes:
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
            <li><strong>Pickup Code (RB-XXXX):</strong> The volunteer or recipient presents this code to the donor before taking possession of the food.</li>
            <li><strong>Delivery Code (RB-XXXX):</strong> The recipient confirms receipt by giving this code to the volunteer, completing the custody log in the immutable audit trail.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
