import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Car, MapPin, Activity, CheckCircle2, AlertTriangle,
  Trash2, Plus, Search, RefreshCw, Clock, Building, X,
  ArrowUpRight, MessageSquare, ChevronRight, Menu, Sparkles
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel({ setActiveTab, onOpenMobileSidebar }) {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState('overview'); // 'overview' | 'users' | 'availabilities' | 'matches' | 'colleges' | 'audit'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [matches, setMatches] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [availStatusFilter, setAvailStatusFilter] = useState('ALL');


  // Modals & Actions
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState('');
  const [newCollegeCity, setNewCollegeCity] = useState('Pune');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Auto-refresh interval (30 seconds)
  const [autoRefresh, setAutoRefresh] = useState(false);

  const showToast = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers(userSearch, userRoleFilter);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const res = await adminAPI.getAvailabilities(availStatusFilter);
      setAvailabilities(res.data || []);
    } catch (err) {
      console.error('Failed to fetch availabilities:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await adminAPI.getMatches();
      setMatches(res.data || []);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await adminAPI.getColleges();
      setColleges(res.data || []);
    } catch (err) {
      console.error('Failed to fetch colleges:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await adminAPI.getAuditLogs();
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchAvailabilities(),
        fetchMatches(),
        fetchColleges(),
        fetchAuditLogs()
      ]);
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToast('Failed to load initial admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      if (currentSection === 'users') fetchUsers();
      if (currentSection === 'availabilities') fetchAvailabilities();
      if (currentSection === 'matches') fetchMatches();
      if (currentSection === 'audit') fetchAuditLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, currentSection, userSearch, userRoleFilter, availStatusFilter]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchAvailabilities(),
        fetchMatches(),
        fetchColleges(),
        fetchAuditLogs()
      ]);
      showToast('Data refreshed successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Role toggle
  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    try {
      await adminAPI.updateUserRole(targetUser.id, newRole);
      showToast(`User ${targetUser.fullName} role changed to ${newRole}`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('Failed to update role', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      await adminAPI.deleteUser(deleteConfirmUser.id);
      showToast(`User ${deleteConfirmUser.fullName} deleted permanently`);
      setDeleteConfirmUser(null);
      fetchUsers();
      fetchStats();
      fetchMatches();
      fetchAvailabilities();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete user', 'error');
    }
  };

  // Cancel Availability
  const handleCancelAvailability = async (id) => {
    try {
      await adminAPI.cancelAvailability(id);
      showToast('Ride availability cancelled');
      fetchAvailabilities();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('Failed to cancel availability', 'error');
    }
  };

  // Update Match Status
  const handleUpdateMatchStatus = async (matchId, newStatus) => {
    try {
      await adminAPI.updateMatchStatus(matchId, newStatus);
      showToast(`Match #${matchId} marked as ${newStatus}`);
      fetchMatches();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('Failed to update match status', 'error');
    }
  };

  // Add College
  const handleAddCollege = async (e) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;
    try {
      await adminAPI.addCollege({ name: newCollegeName.trim(), city: newCollegeCity.trim() });
      showToast(`Added college: ${newCollegeName}`);
      setNewCollegeName('');
      setAddCollegeOpen(false);
      fetchColleges();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to add college', 'error');
    }
  };

  // Delete College
  const handleDeleteCollege = async (id, name) => {
    if (!confirm(`Are you sure you want to remove "${name}" from supported campuses?`)) return;
    try {
      await adminAPI.deleteCollege(id);
      showToast(`Removed college: ${name}`);
      fetchColleges();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove college', 'error');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen flex flex-col font-sans">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/40 text-white sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onOpenMobileSidebar && (
              <button
                onClick={onOpenMobileSidebar}
                className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">RideLink Admin Central</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Master oversight for campuses, rides, users & platform health
              </p>
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              Auto-sync: {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {setActiveTab && (
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
              >
                Exit to App
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1 py-2">
            {[
              { id: 'overview', label: 'Platform Overview', icon: Activity, count: null },
              { id: 'users', label: 'User Directory', icon: Users, count: stats?.totalUsers },
              { id: 'availabilities', label: 'Ride Broadcasts', icon: Car, count: stats?.activeAvailabilities },
              { id: 'matches', label: 'Ride Matches', icon: ArrowUpRight, count: stats?.totalMatches },
              { id: 'colleges', label: 'Colleges & Campuses', icon: Building, count: stats?.totalColleges },
              { id: 'audit', label: 'Live Audit Log', icon: Clock, count: auditLogs.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = currentSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentSection(tab.id);
                    if (tab.id === 'users') fetchUsers();
                    if (tab.id === 'availabilities') fetchAvailabilities();
                    if (tab.id === 'matches') fetchMatches();
                    if (tab.id === 'audit') fetchAuditLogs();
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Floating Action / Toast Message */}
      {actionMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border animate-in slide-in-from-bottom-4 duration-200 ${
          actionMessage.type === 'error'
            ? 'bg-red-950 text-red-200 border-red-800'
            : 'bg-emerald-950 text-emerald-200 border-emerald-800'
        }`}>
          {actionMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading master admin telemetry...</p>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW SECTION */}
            {currentSection === 'overview' && stats && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Status Bar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Telemetry</p>
                      <p className="text-sm font-extrabold text-slate-800">{stats.systemStatus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-400">Server Clock:</span>{' '}
                      <span className="font-mono font-bold text-slate-700">{stats.serverTime}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Active Campus DB:</span>{' '}
                      <span className="font-bold text-indigo-600">{stats.totalColleges} Institutions</span>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Users */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Community</p>
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalUsers}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                      <span className="text-blue-600">{stats.totalStudents} Students</span>
                      <span>•</span>
                      <span className="text-purple-600">{stats.totalAdmins} Admins</span>
                    </div>
                  </div>

                  {/* Card 2: Active Availabilities */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Ride Broadcasts</p>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <Car className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mt-2">{stats.activeAvailabilities}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                      <span className="text-emerald-600">Broadcasting Now</span>
                      <span>•</span>
                      <span>{stats.totalAvailabilities} Total Lifetime</span>
                    </div>
                  </div>

                  {/* Card 3: Matches */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ride Matches</p>
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalMatches}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                      <span className="text-indigo-600">{stats.activeMatches} Active</span>
                      <span>•</span>
                      <span className="text-emerald-600">{stats.completedMatches} Done</span>
                      <span>•</span>
                      <span className="text-red-500">{stats.cancelledMatches} Void</span>
                    </div>
                  </div>

                  {/* Card 4: Messages & In-Ride Chat */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Encrypted Chats</p>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalMessages}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                      <span className="text-amber-600">AES-256 GCM</span>
                      <span>•</span>
                      <span>{stats.pendingRequests} Pending Handshakes</span>
                    </div>
                  </div>
                </div>

                {/* College Breakdown & Fast Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: College User Distribution */}
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-900">Campus Distribution</h2>
                        <p className="text-xs text-slate-500">Registered student community by campus</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                        {Object.keys(stats.usersByCollege || {}).length} Colleges Active
                      </span>
                    </div>

                    <div className="space-y-3 mt-4">
                      {Object.entries(stats.usersByCollege || {}).map(([collegeName, count]) => {
                        const pct = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                        return (
                          <div key={collegeName} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span className="truncate max-w-sm">{collegeName}</span>
                              <span className="text-slate-500">{count} students ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Quick Admin Controls */}
                  <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-5 h-5 text-indigo-300" />
                      </div>
                      <h3 className="text-lg font-extrabold text-white">Administrator Hub</h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Control student access, inspect real-time ride broadcasts, modify ride match statuses, and expand participating campus databases.
                      </p>

                      <div className="mt-5 space-y-2">
                        <button
                          onClick={() => setCurrentSection('users')}
                          className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>Manage User Roles</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentSection('colleges');
                            setAddCollegeOpen(true);
                          }}
                          className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>Add New College</span>
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentSection('availabilities')}
                          className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>Inspect Live Broadcasts</span>
                          <Car className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Logged in as: <strong className="text-white">{user?.email}</strong></span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">PRO</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. USERS DIRECTORY SECTION */}
            {currentSection === 'users' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Search & Filter Header */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-3 min-w-[280px]">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        placeholder="Search by name, email, college or campus..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                      />
                    </div>
                    <button
                      onClick={fetchUsers}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Search
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Role:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => {
                        setUserRoleFilter(e.target.value);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3 py-2 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ROLE_USER">Students (ROLE_USER)</option>
                      <option value="ROLE_ADMIN">Admins (ROLE_ADMIN)</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Institution & Campus</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-12 text-slate-400 font-semibold">
                              No users matching criteria.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => {
                            const isAdmin = u.role === 'ROLE_ADMIN';
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    {u.profileImageUrl ? (
                                      <img src={u.profileImageUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs">
                                        {u.fullName?.charAt(0) || 'U'}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-slate-900">{u.fullName}</p>
                                      <p className="text-[11px] text-slate-500 font-medium">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <p className="font-semibold text-slate-800">{u.college}</p>
                                  <p className="text-[11px] text-slate-500">{u.activeCampus}</p>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-mono text-slate-700">{u.phone || '—'}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                                    isAdmin
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}>
                                    {isAdmin ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                    {isAdmin ? 'ADMIN' : 'STUDENT'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleToggleRole(u)}
                                      title={isAdmin ? "Demote to Student" : "Promote to Admin"}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                                    >
                                      {isAdmin ? 'Demote' : 'Promote'}
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmUser(u)}
                                      title="Delete user"
                                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. RIDE AVAILABILITIES SECTION */}
            {currentSection === 'availabilities' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Ride Broadcasts Monitor</h2>
                    <p className="text-xs text-slate-500">Live student intentions and destination coordinates</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setAvailStatusFilter('ALL'); fetchAvailabilities(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        availStatusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      All Broadcasts
                    </button>
                    <button
                      onClick={() => { setAvailStatusFilter('ACTIVE'); fetchAvailabilities(); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        availStatusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Active Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availabilities.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-400 font-semibold bg-white rounded-2xl border border-slate-200">
                      No ride broadcasts found.
                    </div>
                  ) : (
                    availabilities.map((avail) => (
                      <div key={avail.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              avail.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {avail.active ? 'Active' : 'Expired/Done'}
                            </span>
                            <span className="text-xs font-bold text-indigo-600">ID #{avail.id}</span>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                              {avail.userName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{avail.userName}</p>
                              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{avail.userEmail}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-slate-700">{avail.campusName}</p>
                                <p className="text-slate-400 text-[11px]">→ {avail.destinationName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Leaving: <strong className="text-slate-800">{avail.departureTime}</strong></span>
                            </div>
                          </div>
                        </div>

                        {avail.active && (
                          <button
                            onClick={() => handleCancelAvailability(avail.id)}
                            className="w-full mt-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Force Expire Broadcast
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. RIDE MATCHES SECTION */}
            {currentSection === 'matches' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Ride Matches Oversight</h2>
                    <p className="text-xs text-slate-500">Connected rides, peer pairs and lifecycle management</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">
                    {matches.length} Total Matches
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Match ID</th>
                          <th className="py-3 px-4">Student 1</th>
                          <th className="py-3 px-4">Student 2</th>
                          <th className="py-3 px-4">Route</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Override Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {matches.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-12 text-slate-400 font-semibold">
                              No ride matches recorded yet.
                            </td>
                          </tr>
                        ) : (
                          matches.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">#{m.id}</td>
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-slate-900">{m.student1Name}</p>
                                <p className="text-[11px] text-slate-500">{m.student1Email}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-slate-900">{m.student2Name}</p>
                                <p className="text-[11px] text-slate-500">{m.student2Email}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-800">{m.campusName}</p>
                                <p className="text-[11px] text-slate-500">→ {m.destinationName}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  m.status === 'ACTIVE'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : m.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {m.status !== 'COMPLETED' && (
                                    <button
                                      onClick={() => handleUpdateMatchStatus(m.id, 'COMPLETED')}
                                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  {m.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => handleUpdateMatchStatus(m.id, 'CANCELLED')}
                                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. COLLEGES & CAMPUSES SECTION */}
            {currentSection === 'colleges' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Supported Colleges Database</h2>
                    <p className="text-xs text-slate-500">Authorized educational institutions for student sign-up</p>
                  </div>
                  <button
                    onClick={() => setAddCollegeOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add College</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colleges.map((col) => (
                    <div key={col.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{col.name}</p>
                          <p className="text-[11px] text-slate-500">{col.city || 'Pune'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCollege(col.id, col.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. LIVE AUDIT LOG SECTION */}
            {currentSection === 'audit' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Live Audit & Activity Feed</h2>
                    <p className="text-xs text-slate-500">Real-time system telemetry across all campus nodes</p>
                  </div>
                  <button
                    onClick={fetchAuditLogs}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                  {auditLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-semibold">
                      No audit activities logged yet.
                    </div>
                  ) : (
                    auditLogs.map((log) => {
                      const colorMap = {
                        blue: 'bg-blue-100 text-blue-700 border-blue-200',
                        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                        purple: 'bg-purple-100 text-purple-700 border-purple-200',
                        amber: 'bg-amber-100 text-amber-700 border-amber-200'
                      };
                      return (
                        <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/60 transition-colors">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colorMap[log.badgeColor] || colorMap.blue}`}>
                            {log.type}
                          </span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900">{log.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{log.description}</p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                              <span>Actor: <strong className="text-slate-600">{log.actor}</strong></span>
                              <span>•</span>
                              <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add College Modal */}
      {addCollegeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Add Supported College</h3>
              <button onClick={() => setAddCollegeOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College / University Name</label>
                <input
                  type="text"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="e.g., Pune University"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={newCollegeCity}
                  onChange={(e) => setNewCollegeCity(e.target.value)}
                  placeholder="e.g., Pune"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCollegeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Save College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 text-center">Permanently Delete User?</h3>
            <p className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
              This will remove <strong>{deleteConfirmUser.fullName}</strong> ({deleteConfirmUser.email}) and permanently delete all of their ride broadcasts, chat messages, and ride matches.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-red-600/25"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
