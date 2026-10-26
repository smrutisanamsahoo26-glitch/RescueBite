import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { UtensilsCrossed, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigateAfterLogin = (role) => {
    if (destination) {
      navigate(destination, { replace: true });
      return;
    }
    if (role === 'donor') navigate('/donor/dashboard', { replace: true });
    else if (role === 'recipient') navigate('/recipient/dashboard', { replace: true });
    else if (role === 'volunteer') navigate('/volunteer/dashboard', { replace: true });
    else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
    else navigate('/', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const res = await login(email, password);
      navigateAfterLogin(res.user?.role);
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-600/20">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome back to RescueBite
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to coordinate surplus food donations and pickups across India.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-3xl sm:px-10">

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. chef.rajesh@kitchen.com"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={submitting}
            >
              {submitting ? 'Verifying Credentials...' : 'Sign In to RescueBite'}
            </Button>
          </form>

          {/* Quick Demo Login Personas for QA Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Demo Personas (QA Testing)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('rajesh.mumbai@demo-rescuebite.org');
                  setPassword('DemoPassword123!');
                }}
                className="px-2.5 py-1.5 text-[11px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-left transition"
              >
                <span className="font-bold block">Chef Rajesh</span>
                <span className="text-[10px] text-emerald-600">Donor (Bakery)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('sunita.seva@demo-rescuebite.org');
                  setPassword('DemoPassword123!');
                }}
                className="px-2.5 py-1.5 text-[11px] bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-lg text-left transition"
              >
                <span className="font-bold block">Sunita (NGO)</span>
                <span className="text-[10px] text-sky-600">Recipient Org</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('rohan.volunteer@demo-rescuebite.org');
                  setPassword('DemoPassword123!');
                }}
                className="px-2.5 py-1.5 text-[11px] bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-lg text-left transition"
              >
                <span className="font-bold block">Rohan Sharma</span>
                <span className="text-[10px] text-purple-600">Volunteer Courier</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@rescuebite.org');
                  setPassword('DemoPassword123!');
                }}
                className="px-2.5 py-1.5 text-[11px] bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-lg text-left transition"
              >
                <span className="font-bold block">Platform Admin</span>
                <span className="text-[10px] text-rose-600">Administrator</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:underline">
              Join RescueBite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
