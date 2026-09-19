import React, { useState } from 'react';
import { X, MapPin, Clock, ArrowRight } from 'lucide-react';
import { requestAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function IncomingRequestModal({ request, onAccepted, onRejected }) {
  const { clearIncomingRequest, setActiveMatch } = useSocket();
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await requestAPI.accept(request.id);
      clearIncomingRequest();
      if (setActiveMatch) {
        setActiveMatch(res.data);
      }
      if (onAccepted) {
        onAccepted(res.data);
      }
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert(err.response?.data?.message || 'Failed to accept ride request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await requestAPI.reject(request.id);
      clearIncomingRequest();
      if (onRejected) {
        onRejected(request.id);
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setLoading(false);
    }
  };

  const sender = request.sender || {};
  const initial = sender.fullName ? sender.fullName.charAt(0).toUpperCase() : 'S';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 relative border border-slate-100">
        {/* Header with Title and Close X */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">New Ride Request</h2>
          <button
            onClick={clearIncomingRequest}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender Info Row */}
        <div className="flex items-center gap-4 mb-5">
          {sender.profileImageUrl ? (
            <img
              src={sender.profileImageUrl}
              alt={sender.fullName}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 text-white font-bold text-xl flex items-center justify-center shadow-inner">
              {initial}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{sender.fullName || 'Student'}</h3>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">{sender.college || 'MIT-WPU'}</p>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-2.5 mb-5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-slate-500">From:</span>
            <span className="font-bold text-slate-900 truncate">{request.fromCampus || sender.activeCampus || 'Campus'}</span>
            <span className="font-semibold text-slate-500 ml-2">To:</span>
            <span className="font-bold text-slate-900 truncate">{request.toDestination || 'Destination'}</span>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-slate-700">
            <Clock className="w-4 h-4 text-slate-700 flex-shrink-0" />
            <span className="font-semibold text-slate-500">Departure:</span>
            <span className="font-bold text-slate-900">{request.departureTime || 'Today, 6:15 PM'}</span>
          </div>
        </div>

        {/* Note / Message bubble */}
        <div className="bg-[#eef2f6] text-slate-800 text-sm font-medium p-4 rounded-2xl mb-6 leading-relaxed">
          {request.note || "Hey! I'm also heading to Viman Nagar. Let's catch a ride together!"}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#22c55e] hover:bg-emerald-600 active:scale-[0.98] text-white font-bold rounded-xl text-base shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Accepting...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#ef4444] hover:bg-red-600 active:scale-[0.98] text-white font-bold rounded-xl text-base shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
