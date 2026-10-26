import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/10">
          <UtensilsCrossed className="w-12 h-12 stroke-[1.5]" />
        </div>
        <span className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black rounded-full shadow-md">
          404
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
        Page Not Found
      </h1>
      <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
        The surplus listing, dashboard section, or resource you are looking for does not exist or has been relocated.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </Button>

        <Link to="/explore">
          <Button variant="primary" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Explore Food Listings</span>
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
