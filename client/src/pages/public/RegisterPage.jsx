import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UtensilsCrossed, Building2, HeartHandshake, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { DemoBadge } from '../../components/common/DemoBadge';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('recipient');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [taxId, setTaxId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    register({
      name,
      organizationName,
      email,
      phone,
      role,
      taxId
    });

    if (role === 'donor') navigate('/donor/dashboard');
    else if (role === 'recipient') navigate('/recipient/dashboard');
    else if (role === 'volunteer') navigate('/volunteer/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-600/20">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Join the RescueBite Network
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Connect your organization or volunteer to fight food waste safely.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-3xl sm:px-10">
          {/* Role Selection Cards */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Your Role in the Network
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('donor')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  role === 'donor'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <Building2 className={`w-5 h-5 mx-auto mb-1.5 ${role === 'donor' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="text-xs font-bold">Food Donor</div>
                <div className="text-[10px] text-slate-400">Kitchens, Grocers</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('recipient')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  role === 'recipient'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <HeartHandshake className={`w-5 h-5 mx-auto mb-1.5 ${role === 'recipient' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="text-xs font-bold">Recipient Org</div>
                <div className="text-[10px] text-slate-400">Shelters, Pantries</div>
              </button>

              <button
                type="button"
                onClick={() => setRole('volunteer')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  role === 'volunteer'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                }`}
              >
                <Truck className={`w-5 h-5 mx-auto mb-1.5 ${role === 'volunteer' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="text-xs font-bold">Volunteer</div>
                <div className="text-[10px] text-slate-400">Courier Delivery</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name / Contact Person *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            {role !== 'volunteer' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization / Commercial Business Name *
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={role === 'donor' ? "e.g. Bella Cucina Trattoria" : "e.g. St. Jude Community Food Pantry"}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {role === 'recipient' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  EIN / 501(c)(3) Tax ID (Optional for fast sign-up)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. EIN-12-3456789"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  You can upload verification documents after registration in your dashboard.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
            >
              Create {role === 'donor' ? 'Donor' : role === 'recipient' ? 'Recipient' : 'Volunteer'} Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-emerald-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
