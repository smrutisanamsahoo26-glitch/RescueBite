import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DemoBadge } from '../common/DemoBadge';

export const RoleLayout = ({ roleTitle, roleIcon: Icon, navItems = [], children, actionButton }) => {
  const location = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className="w-5 h-5 text-emerald-600" />}
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{roleTitle}</h1>
            <DemoBadge text="Role Workspace" />
          </div>
          <p className="text-xs text-slate-500">
            Realtime operations, listings, claims, and activity tracking.
          </p>
        </div>

        {actionButton && <div>{actionButton}</div>}
      </div>

      {/* Role Navigation Tabs if provided */}
      {navItems.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {ItemIcon && <ItemIcon className="w-4 h-4" />}
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
};
