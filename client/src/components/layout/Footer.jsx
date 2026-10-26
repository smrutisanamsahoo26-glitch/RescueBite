import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ShieldAlert, Heart, Globe, Scale } from 'lucide-react';
import { DemoBadge } from '../common/DemoBadge';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Purpose */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 text-white font-extrabold text-xl tracking-tight mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span>Rescue<span className="text-emerald-400">Bite</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A transparent, safe surplus redistribution platform connecting restaurants, caterers, grocery stores, non-profit recipient pantries, and volunteer couriers.
            </p>
            <DemoBadge text="Simulated Demo Platform" />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Network</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Surplus Marketplace</Link></li>
              <li><Link to="/impact" className="hover:text-emerald-400 transition-colors">Public Impact Dashboard</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Join as Food Donor</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Register Recipient Pantry</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition-colors">Volunteer Courier Sign Up</Link></li>
            </ul>
          </div>

          {/* Food Safety & Legal Protections */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Food Safety &amp; Law</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Protected under the <strong className="text-slate-300">Bill Emerson Good Samaritan Food Donation Act</strong>. Donors who donate apparently wholesome food in good faith to non-profit organizations are protected from civil and criminal liability.
            </p>
            <Link to="/safety-guidelines" className="text-xs text-emerald-400 hover:underline font-semibold">
              Read Standard Safety Protocols &rarr;
            </Link>
          </div>

          {/* Verification & Integrity */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Safety &amp; Verification</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Strict cold-chain temperature verification</li>
              <li>Official 501(c)(3) recipient organization checks</li>
              <li>2-party handoff &amp; delivery verification codes</li>
              <li>Append-only immutable audit trail</li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Simulated Notice */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} RescueBite Network. Built with MERN, Tailwind CSS, Leaflet &amp; Socket.IO.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Status: Demo Ready (Phase 1 Frontend)</span>
            <Link to="/safety-guidelines" className="hover:text-slate-400">Privacy &amp; Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
