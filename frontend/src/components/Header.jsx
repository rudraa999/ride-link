import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Header({ title, subtitle, setActiveTab, onOpenMobileSidebar }) {
  const { user, logout } = useAuth();
  const { unreadCount, setUnreadCount } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Student';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      {/* Left Area: Mobile Hamburger Toggle + Title/Greeting */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu Button (visible on mobile only) */}
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          {title ? (
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          ) : (
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Find students heading your way.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <button
          onClick={() => {
            setUnreadCount(0);
          }}
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.fullName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-600 text-white font-semibold flex items-center justify-center text-sm shadow-inner">
                {initial}
              </div>
            )}
            <span className="hidden sm:inline text-sm font-semibold text-slate-800">{firstName}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  if (setActiveTab) setActiveTab('profile');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                Profile & Settings
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
