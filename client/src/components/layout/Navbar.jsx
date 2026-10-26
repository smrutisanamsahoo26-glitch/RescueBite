import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  Bell,
  User,
  LogOut,
  PlusCircle,
  MapPin,
  BarChart3,
  Shield,
  Truck,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DemoBadge } from '../common/DemoBadge';

export const Navbar = () => {
  const { user, switchRole, logout, isDonor, isRecipient, isVolunteer, isAdmin, isGuest } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDemoBar, setShowDemoBar] = useState(import.meta.env.VITE_SHOW_DEMO_BAR === 'true');

  // Unread notifications count for current user
  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'donor': return { label: 'Donor', bg: 'bg-emerald-100 text-emerald-800' };
      case 'recipient': return { label: 'Recipient Org', bg: 'bg-sky-100 text-sky-800' };
      case 'volunteer': return { label: 'Volunteer', bg: 'bg-purple-100 text-purple-800' };
      case 'admin': return { label: 'Admin', bg: 'bg-rose-100 text-rose-800' };
      default: return { label: 'Visitor', bg: 'bg-slate-100 text-slate-800' };
    }
  };

  const navLinks = (!user || isGuest) ? [
    { label: 'Explore Food', path: '/explore' },
    { label: 'Public Impact', path: '/impact' },
    { label: 'Safety Guidelines', path: '/safety-guidelines' }
  ] : isDonor ? [
    { label: 'Dashboard', path: '/donor/dashboard' },
    { label: 'Post Surplus', path: '/donor/listings/new' },
    { label: 'Manage Listings', path: '/donor/listings' },
    { label: 'Inbound Claims', path: '/donor/reservations' },
    { label: 'Explore', path: '/explore' }
  ] : isRecipient ? [
    { label: 'Dashboard', path: '/recipient/dashboard' },
    { label: 'Browse Food', path: '/explore' },
    { label: 'My Reservations', path: '/recipient/reservations' },
    { label: 'Org Verification', path: '/recipient/organization/verify' }
  ] : isVolunteer ? [
    { label: 'Dashboard', path: '/volunteer/dashboard' },
    { label: 'Delivery Tasks', path: '/volunteer/tasks' },
    { label: 'Active Route', path: '/volunteer/active' }
  ] : isAdmin ? [
    { label: 'Overview', path: '/admin/dashboard' },
    { label: 'Verifications', path: '/admin/verifications' },
    { label: 'Moderation', path: '/admin/moderation' },
    { label: 'Audit Logs', path: '/admin/audit-logs' }
  ] : [
    { label: 'Explore Food', path: '/explore' },
    { label: 'Public Impact', path: '/impact' },
    { label: 'Safety Guidelines', path: '/safety-guidelines' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Demo Persona Quick-Switch Banner (Disabled in Production Mode) */}
      {showDemoBar && (
        <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <DemoBadge text="Role Preview Mode" />
            <span className="hidden sm:inline text-slate-400">
              Quick test accounts:
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { key: 'donor', label: 'Chef Rajesh (Donor)' },
              { key: 'recipient', label: 'Sunita P. (Recipient)' },
              { key: 'volunteer', label: 'Rohan S. (Volunteer)' },
              { key: 'admin', label: 'System Admin' },
              { key: 'guest', label: 'Public Visitor' }
            ].map(persona => {
              const isCurrent = (persona.key === 'guest' && isGuest) || user?.role === persona.key;
              return (
                <button
                  key={persona.key}
                  onClick={() => {
                    switchRole(persona.key);
                    if (persona.key === 'donor') navigate('/donor/dashboard');
                    else if (persona.key === 'recipient') navigate('/recipient/dashboard');
                    else if (persona.key === 'volunteer') navigate('/volunteer/dashboard');
                    else if (persona.key === 'admin') navigate('/admin/dashboard');
                    else navigate('/');
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {persona.label}
                </button>
              );
            })}
            <button
              onClick={() => setShowDemoBar(false)}
              className="text-slate-400 hover:text-white ml-2 text-xs"
              title="Hide Testing Banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 text-slate-900 font-extrabold text-xl tracking-tight group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span>
              Rescue<span className="text-emerald-600">Bite</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-3">
          {isDonor && (
            <Link
              to="/donor/listings/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Surplus</span>
            </Link>
          )}

          {/* Notifications Dropdown (only for logged-in users) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Flyout Menu */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 font-semibold rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setIsNotifOpen(false);
                            if (notif.link && notif.link !== '#') navigate(notif.link);
                          }}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                            !notif.read ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-800">{notif.title}</span>
                            <span className="text-[10px] text-slate-400">{notif.time}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Login Button */}
          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
              >
                Join RescueBite
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={user?.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-bold text-slate-800 line-clamp-1">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{user?.organizationName || user?.role}</div>
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <div className="font-bold text-sm text-slate-800 truncate">{user?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleBadge(user?.role).bg}`}>
                      {getRoleBadge(user?.role).label}
                    </span>
                  </div>

                  <Link
                    to={isDonor ? '/donor/dashboard' : isRecipient ? '/recipient/dashboard' : isVolunteer ? '/volunteer/dashboard' : '/admin/dashboard'}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
