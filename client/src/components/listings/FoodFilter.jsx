import React from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export const FoodFilter = ({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  dietaryFilter,
  onDietaryChange,
  storageFilter,
  onStorageChange,
  onlyAvailable,
  onOnlyAvailableChange
}) => {
  const categories = [
    { id: 'all', label: 'All Surplus' },
    { id: 'cooked_meals', label: 'Cooked Meals' },
    { id: 'bakery', label: 'Bakery & Bread' },
    { id: 'produce', label: 'Fresh Produce' },
    { id: 'dairy', label: 'Dairy & Eggs' },
    { id: 'packaged_goods', label: 'Packaged Goods' }
  ];

  const dietaryOptions = ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm mb-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search surplus meals, bakery, fresh produce, donor name..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Quick Storage & Availability Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={storageFilter}
            onChange={(e) => onStorageChange(e.target.value)}
            className="text-xs font-semibold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Any Storage</option>
            <option value="ambient">Ambient Temp</option>
            <option value="refrigerated">Refrigerated (0-4°C)</option>
            <option value="frozen">Frozen (&lt;-18°C)</option>
            <option value="hot_holding">Hot Holding (&gt;60°C)</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 select-none hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => onOnlyAvailableChange(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-700">Available Only</span>
          </label>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 mb-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              category === cat.id
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Dietary Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
          <SlidersHorizontal className="w-3 h-3" /> Dietary:
        </span>
        {dietaryOptions.map(diet => {
          const isSelected = dietaryFilter.includes(diet);
          return (
            <button
              key={diet}
              onClick={() => onDietaryChange(diet)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                isSelected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {diet.replace('_', ' ')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
