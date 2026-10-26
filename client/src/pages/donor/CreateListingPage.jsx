import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Image, Sparkles, ArrowLeft, Thermometer, ShieldCheck, Truck } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/common/Button';
import { FoodCard } from '../../components/listings/FoodCard';
import { DemoBadge } from '../../components/common/DemoBadge';

export const CreateListingPage = () => {
  const { addListing } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cooked_meals');
  const [quantity, setQuantity] = useState(20);
  const [unit, setUnit] = useState('servings');
  const [storageRequirements, setStorageRequirements] = useState('refrigerated');
  const [allergens, setAllergens] = useState([]);
  const [dietaryInfo, setDietaryInfo] = useState(['vegetarian']);
  const [requiresVolunteer, setRequiresVolunteer] = useState(true);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');
  const [address, setAddress] = useState(user?.location?.address || '350 5th Ave, New York, NY 10001');

  // Preset Images for quick demo testing
  const presetPhotos = [
    { label: 'Hot Meals', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
    { label: 'Bakery Bread', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' },
    { label: 'Produce', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80' },
    { label: 'Salads & Wraps', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' },
    { label: 'Dairy & Milk', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80' }
  ];

  const handleAllergenToggle = (item) => {
    setAllergens(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleDietaryToggle = (item) => {
    setDietaryInfo(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || quantity <= 0) return;

    addListing({
      title,
      description,
      category,
      quantity,
      unit,
      storageRequirements,
      allergens,
      dietaryInfo,
      requiresVolunteer,
      images: [imageUrl],
      address,
      lat: 40.7500,
      lng: -73.9800
    }, user);

    navigate('/donor/dashboard');
  };

  // Preview Listing Object for Live Card Preview
  const previewListing = {
    id: 'preview_temp',
    title: title || 'Fresh Prepared Surplus Meals',
    description: description || 'Description of prepared surplus food with preparation times and ingredients.',
    category,
    quantity: Number(quantity) || 1,
    quantityRemaining: Number(quantity) || 1,
    unit,
    storageRequirements,
    allergens,
    dietaryInfo,
    images: [imageUrl],
    donorName: user?.organizationName || user?.name || 'Artisan Food Partner',
    donorVerified: true,
    address,
    requiresVolunteer,
    status: 'available'
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/donor/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <DemoBadge text="Listing Creation Wizard" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-slate-900 mb-1">Post Surplus Food</h1>
            <p className="text-xs text-slate-500">
              Provide accurate storage guidelines and allergen notices for safe redistribution.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Food Title / Item Description *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fresh Artisan Sourdough Loaves & Croissants"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-semibold"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preparation &amp; Quality Notes *
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify when cooked/baked, packaging details, and any handling instructions..."
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            {/* Category & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="cooked_meals">Cooked Meals</option>
                  <option value="bakery">Bakery &amp; Bread</option>
                  <option value="produce">Fresh Produce</option>
                  <option value="dairy">Dairy &amp; Eggs</option>
                  <option value="packaged_goods">Packaged Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="servings">Servings</option>
                  <option value="packs">Packs</option>
                  <option value="boxes">Boxes</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="liters">Liters</option>
                </select>
              </div>
            </div>

            {/* Storage Requirement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cold-Chain Storage Requirement *</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ambient', label: 'Ambient Temp' },
                  { id: 'refrigerated', label: 'Refrigerated (0-4°C)' },
                  { id: 'frozen', label: 'Frozen (<-18°C)' },
                  { id: 'hot_holding', label: 'Hot Holding (>60°C)' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStorageRequirements(s.id)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                      storageRequirements === s.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergens Checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Declared Allergens (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'fish', 'shellfish'].map(allergen => {
                  const isChecked = allergens.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => handleAllergenToggle(allergen)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {allergen}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dietary Classifications
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 'dairy_free'].map(diet => {
                  const isChecked = dietaryInfo.includes(diet);
                  return (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => handleDietaryToggle(diet)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {diet.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volunteer Courier Eligible Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresVolunteer}
                onChange={(e) => setRequiresVolunteer(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Request Volunteer Courier Transit</span>
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  If selected, an unassigned delivery task will appear on the volunteer courier dispatch board.
                </span>
              </div>
            </label>

            {/* Photo Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Food Photograph (Select demo sample or enter image URL)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {presetPhotos.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setImageUrl(p.url)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      imageUrl === p.url
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Pickup Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pickup Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
            >
              Publish Surplus Food Posting
            </Button>
          </form>
        </div>

        {/* Live Preview Card Column */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Live Marketplace Card Preview</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <FoodCard listing={previewListing} />
          </div>
        </div>
      </div>
    </div>
  );
};
