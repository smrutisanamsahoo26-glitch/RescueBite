import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for session cookie check to complete
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login while preserving destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Unauthorized Role: Render helpful forbidden notice or redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const defaultRoute =
      user.role === 'donor'
        ? '/donor/dashboard'
        : user.role === 'recipient'
        ? '/recipient/dashboard'
        : user.role === 'volunteer'
        ? '/volunteer/dashboard'
        : user.role === 'admin'
        ? '/admin/dashboard'
        : '/';

    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          🛡️
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-600 mb-6 text-sm">
          Your current account role (<span className="font-semibold capitalize text-slate-800">{user.role}</span>) is not permitted to access this portal page.
          This area requires permissions for: <span className="font-semibold text-slate-800">{allowedRoles.join(', ')}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={defaultRoute}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition shadow-sm"
          >
            Go to My Dashboard
          </Link>
          <Link
            to="/explore"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition"
          >
            Explore Public Listings
          </Link>
        </div>
      </div>
    );
  }

  return children;
};
