import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const AllergenTag = ({ allergen }) => {
  if (!allergen || allergen === 'none') return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
      <AlertCircle className="w-3 h-3 text-amber-600" />
      <span>{allergen.replace('_', ' ')}</span>
    </span>
  );
};

export const DietaryTag = ({ diet }) => {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      <span>{diet.replace('_', ' ')}</span>
    </span>
  );
};
