import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Sparkles, Leaf, Utensils, Globe, TrendingUp, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DemoBadge } from '../../components/common/DemoBadge';

export const PublicImpactPage = () => {
  const { impactMetrics } = useData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Environmental &amp; Community Analytics</span>
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Community Food Rescue Transparency
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Real-time metrics tracking diverted landfill waste, carbon offset equivalents, and wholesome meals redistributed to community pantries.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Utensils className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">
            {(impactMetrics?.totalRescuedKg ?? 0).toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Surplus Food Rescued</div>
          <p className="text-[11px] text-slate-400 mt-2">Diverted from commercial waste streams</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-teal-700 mb-1">
            {(impactMetrics?.mealsRedistributed ?? 0).toLocaleString()}
          </div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Wholesome Meals Served</div>
          <p className="text-[11px] text-slate-400 mt-2">Distributed to verified shelters &amp; pantries</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Leaf className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mb-1">
            {(impactMetrics?.co2EquivalentSavedKg ?? 0).toLocaleString()} <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">CO₂e Emissions Prevented</div>
          <p className="text-[11px] text-slate-400 mt-2">Landfill methane diversion factor (2.5x)</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-700 mb-1">
            {(impactMetrics?.participatingDonors ?? 14) + (impactMetrics?.recipientOrganizations ?? 9)}
          </div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Partner Hubs</div>
          <p className="text-[11px] text-slate-400 mt-2">Verified food donors &amp; non-profit pantries</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Food Rescue Growth</h3>
              <p className="text-xs text-slate-500">Total kilograms collected and redistributed per month</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              +19.2% MoM
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={impactMetrics?.monthlyTrend || []}>
                <defs>
                  <linearGradient id="rescuedKgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="kg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="rescuedKg"
                  name="Rescued (kg)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#rescuedKgGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Surplus Categories</h3>
            <p className="text-xs text-slate-500 mb-6">Share of redistributed food by volume (%)</p>

            <div className="space-y-4">
              {(impactMetrics?.categoryBreakdown || []).map(cat => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{cat.name}</span>
                    <span>{cat.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.value}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
            Certified safe via temperature logging &amp; Good Samaritan legal compliance.
          </div>
        </div>
      </div>
    </div>
  );
};
