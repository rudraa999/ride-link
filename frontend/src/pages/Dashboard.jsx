import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Calendar, CheckCircle2, Send, Check, Power, MessageSquare, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import SetAvailabilityModal from '../components/SetAvailabilityModal';
import { availabilityAPI, requestAPI, matchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Dashboard({ setActiveTab, onOpenChatWithMatch, onOpenMobileSidebar }) {
  const { user } = useAuth();
  const { activeMatch, setActiveMatch } = useSocket();
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentAvailability, setCurrentAvailability] = useState(null);
  const [matchedStudents, setMatchedStudents] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [sentRequests, setSentRequests] = useState({});
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchCurrentAvailability();
    fetchRecentMatches();
  }, []);

  // When activeMatch is set (e.g. accepted request or received match), turn OFF availability and stop timer
  useEffect(() => {
    if (activeMatch) {
      setIsAvailable(false);
      setCurrentAvailability(null);
      setMatchedStudents([]);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [activeMatch]);

  useEffect(() => {
    let interval = null;
    if (isAvailable && !activeMatch) {
      fetchMatchingStudents();
      interval = setInterval(fetchMatchingStudents, 8000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAvailable, activeMatch]);

  useEffect(() => {
    if (isAvailable && remainingSeconds > 0 && !activeMatch) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsAvailable(false);
            setCurrentAvailability(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAvailable, remainingSeconds, activeMatch]);

  const fetchCurrentAvailability = async () => {
    try {
      // If we already have an active match, availability is inactive
      if (activeMatch) {
        setIsAvailable(false);
        setCurrentAvailability(null);
        return;
      }

      const res = await availabilityAPI.getCurrent();
      const avail = res.data;
      if (avail && (avail.isActive !== false) && (avail.isActive || avail.active || avail.id)) {
        setIsAvailable(true);
        setCurrentAvailability(avail);
        setRemainingSeconds(avail.remainingSeconds !== undefined ? avail.remainingSeconds : 3600);
        fetchMatchingStudents();
      } else {
        setIsAvailable(false);
        setCurrentAvailability(null);
      }
    } catch (err) {
      console.log('No active availability');
      setIsAvailable(false);
      setCurrentAvailability(null);
    }
  };

  const fetchMatchingStudents = async () => {
    try {
      setLoadingMatches(true);
      const res = await availabilityAPI.getMatches();
      setMatchedStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load matching students:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const res = await matchAPI.getHistory('ALL');
      if (res.data) {
        setRecentMatches(res.data.slice(0, 3));
      }
    } catch (err) {
      console.log('Fetch recent matches err:', err);
    }
  };

  const handleTurnOffAvailability = async () => {
    try {
      await availabilityAPI.stop();
      setIsAvailable(false);
      setCurrentAvailability(null);
      setMatchedStudents([]);
    } catch (err) {
      console.error('Failed to stop availability:', err);
    }
  };

  const handleCompleteActiveMatch = async () => {
    if (!activeMatch) return;
    try {
      await matchAPI.updateStatus(activeMatch.id, 'COMPLETED');
      if (setActiveMatch) {
        setActiveMatch(null);
      }
      fetchRecentMatches();
      alert('Ride completed! The match has been saved to your Match History.');
      if (setActiveTab) {
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Failed to complete match:', err);
    }
  };

  const handleSendRequest = async (student) => {
    try {
      setSentRequests((prev) => ({ ...prev, [student.availabilityId]: 'sending' }));
      await requestAPI.send({
        targetAvailabilityId: student.availabilityId,
        note: `Hey! I'm also heading to ${student.destinationName}. Let's catch a ride together!`,
      });
      setSentRequests((prev) => ({ ...prev, [student.availabilityId]: 'sent' }));
    } catch (err) {
      console.error('Failed to send request:', err);
      alert(err.response?.data?.message || 'Failed to send ride request');
      setSentRequests((prev) => ({ ...prev, [student.availabilityId]: false }));
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f8fafc] w-full">
      <Header
        setActiveTab={setActiveTab}
        onOpenMobileSidebar={onOpenMobileSidebar}
      />

      <main className="flex-1 px-4 sm:px-8 py-5 sm:py-6 max-w-6xl w-full mx-auto space-y-5 sm:space-y-6">
        {/* VIEW 0: ACTIVE RIDE MATCHED STATE */}
        {activeMatch ? (
          <>
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-blue-500/20 space-y-6 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Ride Match Connected!
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-600">
                      You're matched with {activeMatch.otherStudent?.fullName || 'a student'}. Coordinate pickup and go!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Active Ride
                  </span>
                </div>
              </div>

              {/* Partner Details & Route Card */}
              <div className="bg-[#f8fafc] rounded-2xl p-5 sm:p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
                {/* Partner Info */}
                <div className="flex items-center gap-4">
                  {activeMatch.otherStudent?.profileImageUrl ? (
                    <img
                      src={activeMatch.otherStudent.profileImageUrl}
                      alt={activeMatch.otherStudent.fullName}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-white shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-800 text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-inner flex-shrink-0">
                      {activeMatch.otherStudent?.fullName?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                      {activeMatch.otherStudent?.fullName || 'Ride Partner'}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 truncate">
                      {activeMatch.otherStudent?.college || 'College'} • {activeMatch.otherStudent?.showPhonePostMatch !== false && activeMatch.otherStudent?.phone ? activeMatch.otherStudent.phone : 'Phone hidden (Use chat)'}
                    </p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-700 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{activeMatch.campusName}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-slate-900 font-bold truncate">{activeMatch.destinationName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 flex-shrink-0">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{activeMatch.departureTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => onOpenChatWithMatch(activeMatch.id)}
                  className="w-full sm:flex-1 py-3.5 px-6 bg-[#2563eb] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Chat with {activeMatch.otherStudent?.fullName?.split(' ')[0] || 'Partner'}</span>
                </button>

                <button
                  onClick={handleCompleteActiveMatch}
                  className="w-full sm:w-auto py-3.5 px-6 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-[0.99] font-bold rounded-xl text-sm sm:text-base border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Ride</span>
                </button>
              </div>
            </div>

            {/* Recent Matches Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Recent Matches</h3>
                {recentMatches.length > 0 && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                )}
              </div>

              {recentMatches.length === 0 ? (
                <div className="bg-[#f8fafc] border border-slate-100/80 rounded-2xl p-6 sm:p-7 text-center text-slate-500 text-xs sm:text-sm font-medium">
                  No recent matches yet. Your ride history will appear here.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentMatches.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {m.otherStudent?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{m.otherStudent?.fullName}</p>
                          <p className="text-[11px] sm:text-xs text-slate-500 truncate">{m.campusName} → {m.destinationName}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold flex-shrink-0">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : !isAvailable ? (
          <>
            {/* Main Central Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              {/* Illustration: Blue Car with trees and clouds */}
              <div className="relative w-full max-w-[280px] h-36 sm:h-44 mb-4 sm:mb-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-44 sm:w-52 h-24 sm:h-28 bg-sky-100/70 rounded-full blur-xl" />
                  <div className="w-20 sm:w-24 h-20 sm:h-24 bg-blue-100/80 rounded-full absolute -top-2 right-12 blur-lg" />
                </div>

                <svg className="w-full h-full max-h-36 relative z-10" viewBox="0 0 300 160" fill="none">
                  <rect x="70" y="55" width="16" height="50" rx="2" fill="#e2e8f0" />
                  <rect x="92" y="45" width="22" height="60" rx="2" fill="#cbd5e1" />
                  <rect x="190" y="50" width="18" height="55" rx="2" fill="#cbd5e1" />
                  <rect x="214" y="60" width="16" height="45" rx="2" fill="#e2e8f0" />

                  <circle cx="55" cy="90" r="14" fill="#86efac" />
                  <rect x="53" y="90" width="4" height="20" fill="#a1a1aa" />
                  <circle cx="245" cy="88" r="13" fill="#86efac" />
                  <rect x="243" y="88" width="4" height="22" fill="#a1a1aa" />
                  <circle cx="170" cy="95" r="10" fill="#bbf7d0" />

                  <path d="M20 115 L280 115" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

                  <g transform="translate(95, 60)">
                    <rect x="15" y="25" width="80" height="26" rx="8" fill="#2563eb" />
                    <path d="M25 25 L35 8 L75 8 L85 25 Z" fill="#3b82f6" />
                    <rect x="33" y="10" width="18" height="13" rx="2" fill="#93c5fd" />
                    <rect x="58" y="10" width="20" height="13" rx="2" fill="#93c5fd" />
                    <rect x="12" y="32" width="6" height="6" rx="2" fill="#fde047" />
                    <rect x="92" y="32" width="6" height="6" rx="2" fill="#fde047" />
                    <circle cx="30" cy="51" r="9" fill="#1e293b" />
                    <circle cx="30" cy="51" r="4" fill="#94a3b8" />
                    <circle cx="80" cy="51" r="9" fill="#1e293b" />
                    <circle cx="80" cy="51" r="4" fill="#94a3b8" />
                  </g>
                </svg>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Ready to find a ride?
              </h2>
              <p className="text-slate-500 font-medium max-w-md mb-6 sm:mb-7 text-xs sm:text-sm leading-relaxed px-2">
                Turn on availability to discover students travelling toward your destination.
              </p>

              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                I'm Available
              </button>
            </div>

            {/* Your Campus Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Your Campus</h3>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-xs sm:text-sm font-bold text-[#2563eb] hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs sm:text-sm truncate">
                <MapPin className="w-4 h-4 text-slate-900 flex-shrink-0" />
                <span className="truncate">{user?.activeCampus || 'MIT-WPU Pune (Kothrud)'}</span>
              </div>
            </div>

            {/* Recent Matches Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Recent Matches</h3>
                {recentMatches.length > 0 && (
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                )}
              </div>

              {recentMatches.length === 0 ? (
                <div className="bg-[#f8fafc] border border-slate-100/80 rounded-2xl p-6 sm:p-7 text-center text-slate-500 text-xs sm:text-sm font-medium">
                  No recent matches yet. Your ride history will appear here.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentMatches.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {m.otherStudent?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{m.otherStudent?.fullName}</p>
                          <p className="text-[11px] sm:text-xs text-slate-500 truncate">{m.campusName} → {m.destinationName}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold flex-shrink-0">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* VIEW 2: AVAILABLE */
          <>
            {/* Status & Expiration Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">You’re available!</h2>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTurnOffAvailability}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  Turn Off
                </button>
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-400">Availability expires in</p>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-500 tracking-tight">
                    {formatTimer(remainingSeconds)}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Route Pill Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">From</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {currentAvailability?.campusName || user?.activeCampus || 'Campus'}
                    </p>
                  </div>
                </div>

                <span className="text-slate-300 font-bold hidden sm:inline">→</span>

                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">To</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {currentAvailability?.destinationName || 'Destination'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-slate-400">Departure</p>
                  <p className="text-xs font-bold text-slate-800">
                    {currentAvailability?.departureTime || 'Today, 6:30 PM'}
                  </p>
                </div>
              </div>
            </div>

            {/* Students Going Your Way Section */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight">
                Students going your way
              </h3>

              {matchedStudents.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border border-slate-100 shadow-sm space-y-2.5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">Searching for nearby students...</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We're matching students with compatible departure times and destinations within 1 km.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedStudents.map((student) => {
                    const isSent = sentRequests[student.availabilityId] === 'sent';
                    const isSending = sentRequests[student.availabilityId] === 'sending';
                    return (
                      <div
                        key={student.availabilityId}
                        className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:shadow-md transition-shadow"
                      >
                        {/* Student Details Left */}
                        <div className="flex items-center gap-3 sm:gap-4">
                          {student.profileImageUrl ? (
                            <img
                              src={student.profileImageUrl}
                              alt={student.fullName}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-slate-100 shadow-sm flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-700 text-white font-bold text-base sm:text-lg flex items-center justify-center flex-shrink-0">
                              {student.fullName?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                              {student.fullName}
                            </h4>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                              {student.college || 'MIT-WPU'}
                            </p>
                          </div>
                        </div>

                        {/* Mid Info: Destination, Departure, Distance */}
                        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 text-xs text-slate-600 font-medium bg-slate-50/70 p-2.5 sm:p-0 rounded-xl sm:bg-transparent">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{student.destinationName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{student.departureTime}</span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            <span>{student.distanceFormatted || '0.4 km'}</span>
                          </div>
                        </div>

                        {/* Send Request Button */}
                        <button
                          onClick={() => handleSendRequest(student)}
                          disabled={isSent || isSending}
                          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer ${
                            isSent
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-[#2563eb] hover:bg-blue-700 text-white shadow-blue-500/20'
                          }`}
                        >
                          {isSending ? 'Sending...' : isSent ? 'Request Sent ✓' : 'Send Request'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Set Availability Modal */}
      <SetAvailabilityModal
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        onAvailabilityStarted={(avail) => {
          setIsAvailable(true);
          setCurrentAvailability(avail);
          setRemainingSeconds(avail.remainingSeconds || 3600);
          fetchMatchingStudents();
        }}
      />
    </div>
  );
}
