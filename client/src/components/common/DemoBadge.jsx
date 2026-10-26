import React from 'react';
import { Sparkles } from 'lucide-react';

export const DemoBadge = ({ text = "Simulated Demo Content" }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm" title="This content is generated for application testing and does not represent live food waste data">
      <Sparkles className="w-3 h-3 text-amber-500" />
      <span>{text}</span>
    </span>
  );
};
