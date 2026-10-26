import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, Compass, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const ForbiddenPage = () => {
  const { user } = useAuth();

  const userDashboard =
    user?.role === 'donor'
      ? '/donor/dashboard'
      : user?.role === 'recipient'
      ? '/recipient/dashboard'
      : user?.role === 'volunteer'
      ? '/volunteer/dashboard'
      : user?.role === 'admin'
      ? '/admin/dashboard'
      : '/login';

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mx-auto shadow-inner shadow-rose-500/10">
          <ShieldAlert className="w-12 h-12 stroke-[1.5]" />
        </div>
        <span className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black rounded-full shadow-md">
          403
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
        Access Restricted
      </h1>
      <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-4 leading-relaxed">
        You do not have the required role permissions to view or perform operations on this page.
      </p>

      {user && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 mb-8">
          <span>Signed in as:</span>
          <span className="font-bold capitalize text-slate-900">{user.name} ({user.role})</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <Link to={userDashboard}>
            <Button variant="primary" className="flex items-center gap-2">
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="primary" className="flex items-center gap-2">
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}

        <Link to="/explore">
          <Button variant="outline" className="flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span>Explore Surplus Food</span>
          </Button>
        </Link>

        <Link to="/">
          <Button variant="secondary" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
