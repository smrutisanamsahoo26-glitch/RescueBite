import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  Truck,
  Heart,
  Scale,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { FoodCard } from '../../components/listings/FoodCard';
import { DemoBadge } from '../../components/common/DemoBadge';

export const LandingPage = () => {
  const { listings, impactMetrics } = useData();
  const { switchRole } = useAuth();
  const navigate = useNavigate();

  // Highlight top 3 available listings
  const featuredListings = listings.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Surplus Food Redistribution Network</span>
              <span className="text-emerald-400">&bull;</span>
              <span className="text-emerald-700">Safe, Verified &amp; Transparent</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Rescue surplus food. <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Nourish communities.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              Connecting commercial kitchens, bakeries, and grocers with certified recipient shelters and community pantries through real-time matching and volunteer logistics.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                to="/explore"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <span>Find Surplus Food</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  switchRole('donor');
                  navigate('/donor/listings/new');
                }}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Donate Surplus Food</span>
              </button>
            </div>

            {/* Good Samaritan Food Law Protection Notice */}
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white/80 backdrop-blur-sm border border-slate-200/80 px-4 py-2 rounded-xl shadow-xs">
              <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Protected by the federal <strong>Bill Emerson Good Samaritan Act</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Simulated Impact Metrics Banner */}
      <section className="bg-white border-y border-slate-200/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Live Network Impact Telemetry</h2>
              <p className="text-xs text-slate-500">Aggregate metrics across verified donations and deliveries.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Verified Telemetry</span>
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mb-1">
                {(impactMetrics?.totalRescuedKg ?? 0).toLocaleString()} kg
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Surplus Food Rescued</div>
              <div className="text-[11px] text-slate-400 mt-1">Community verified total</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 mb-1">
                {(impactMetrics?.mealsRedistributed ?? 0).toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Meals Provided</div>
              <div className="text-[11px] text-slate-400 mt-1">Based on 0.42 kg standard meal</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mb-1">
                {(impactMetrics?.co2EquivalentSavedKg ?? 0).toLocaleString()} kg
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">CO₂e Emissions Prevented</div>
              <div className="text-[11px] text-slate-400 mt-1">Diverted from landfill methane</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mb-1">
                {(impactMetrics?.participatingDonors ?? 14) + (impactMetrics?.recipientOrganizations ?? 9)}
              </div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Partner Organizations</div>
              <div className="text-[11px] text-slate-400 mt-1">Verified donors &amp; recipient pantries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Live Surplus Feed */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Live Active Postings</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Available Surplus Food Nearby</h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              <span>Explore All {(listings || []).length} Listings on Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map(listing => (
              <FoodCard key={listing._id || listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works 3-Step Process */}
      <section className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              How RescueBite Coordinates Safe Redistribution
            </h2>
            <p className="text-sm text-slate-500">
              An end-to-end custody chain with allergen labeling, temperature controls, and verified delivery handoffs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Donor Posts Surplus</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Restaurants, caterers, or grocery stores post surplus portions specifying preparation time, storage requirements (refrigerated, ambient, frozen), allergens, and pickup window.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-extrabold text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Pantry Reserves &amp; Matches</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verified non-profit shelters claim required quantities atomically. The platform automatically verifies available capacity and confirms handoff times with the donor.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Verified Delivery with Codes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Volunteers or direct recipients pick up food using secure 6-digit confirmation codes and log transit temperatures to safeguard cold-chain integrity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
