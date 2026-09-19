import React, { useState, useEffect } from 'react';
import { MapPin, Calendar } from 'lucide-react';
import Header from '../components/Header';
import { matchAPI } from '../services/api';

export default function MatchHistory({ setActiveTab, onOpenChatWithMatch, onOpenMobileSidebar }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = ['All', 'Completed', 'Cancelled'];

  useEffect(() => {
    fetchMatches();
  }, [activeFilter]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const statusParam = activeFilter === 'All' ? 'ALL' : activeFilter.toUpperCase();
      const res = await matchAPI.getHistory(statusParam);
      setMatches(res.data || []);
    } catch (err) {
      console.error('Failed to load match history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc] w-full">
      <Header
        title="Match History"
        subtitle="Your past ride matches"
        setActiveTab={setActiveTab}
        onOpenMobileSidebar={onOpenMobileSidebar}
      />

      <main className="flex-1 px-4 sm:px-8 py-5 sm:py-6 max-w-5xl w-full mx-auto space-y-5 sm:space-y-6">
        {/* Filter Pills matching match_history.png */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Match Cards List matching match_history.png */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-100 text-slate-500 text-xs sm:text-sm font-medium">
            No matches found for this filter.
          </div>
        ) : (
          <div className="space-y-3.5 sm:space-y-4">
            {matches.map((match) => {
              const other = match.otherStudent || {};
              const initial = other.fullName ? other.fullName.charAt(0).toUpperCase() : 'S';
              const isCompleted = match.status === 'COMPLETED';
              const isCancelled = match.status === 'CANCELLED';

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Left: Student Info */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    {other.profileImageUrl ? (
                      <img
                        src={other.profileImageUrl}
                        alt={other.fullName}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-slate-100 shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-700 text-white font-bold text-base sm:text-lg flex items-center justify-center flex-shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                        {other.fullName || 'Student Name'}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                        {other.college || 'MIT-WPU'}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Route & Date Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-600 font-medium bg-slate-50/70 p-2.5 sm:p-0 rounded-xl sm:bg-transparent">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="font-bold text-slate-800 truncate">
                        {match.campusName || 'MIT-WPU'}
                      </span>
                      <span className="text-slate-400 font-bold">→</span>
                      <span className="font-bold text-slate-800 truncate">
                        {match.destinationName || 'Destination'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{match.departureTime || 'Tue, 18 Sep 2026 • 6:15 PM'}</span>
                    </div>
                  </div>

                  {/* Right: Status Pill */}
                  <div className="flex items-center justify-end pt-1 sm:pt-0 border-t border-slate-100 sm:border-0">
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                        isCompleted
                          ? 'bg-emerald-100/70 text-emerald-800'
                          : isCancelled
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {match.status === 'COMPLETED' ? 'Completed' : match.status === 'CANCELLED' ? 'Cancelled' : 'Active'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
