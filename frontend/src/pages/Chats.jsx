import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Send, MoreVertical, CheckCircle2, Phone, X, Menu, MessageSquare } from 'lucide-react';
import { chatAPI, matchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Chats({ activeMatchId, setActiveTab, onOpenMobileSidebar }) {
  const { user } = useAuth();
  const { stompClient, activeMatch: socketActiveMatch, setActiveMatch: setSocketActiveMatch } = useSocket();
  const [activeMatch, setActiveMatch] = useState(socketActiveMatch || null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socketActiveMatch && !activeMatchId) {
      setActiveMatch(socketActiveMatch);
      loadMessages(socketActiveMatch.id);
      setLoading(false);
    } else {
      loadActiveMatch();
    }
  }, [activeMatchId, socketActiveMatch]);

  const loadActiveMatch = async () => {
    try {
      setLoading(true);
      let target = null;
      if (activeMatchId) {
        try {
          const specificRes = await matchAPI.getById(activeMatchId);
          if (specificRes.data && specificRes.data.status === 'ACTIVE') {
            target = specificRes.data;
          }
        } catch (e) {
          target = null;
        }
      }

      if (!target && socketActiveMatch) {
        target = socketActiveMatch;
      }

      if (!target) {
        try {
          const activeRes = await matchAPI.getActive();
          if (activeRes.data && activeRes.data.id) {
            target = activeRes.data;
          }
        } catch (e) {
          target = null;
        }
      }

      if (!target) {
        const res = await matchAPI.getHistory('ACTIVE');
        const activeList = res.data || [];
        if (activeList.length > 0) {
          target = activeList[0];
        }
      }

      setActiveMatch(target);
      if (target) {
        if (setSocketActiveMatch) setSocketActiveMatch(target);
        loadMessages(target.id);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load active matches for chat', err);
      setActiveMatch(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (matchId) => {
    try {
      const res = await chatAPI.getMessages(matchId);
      setMessages(res.data || []);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load chat messages', err);
    }
  };

  useEffect(() => {
    if (!stompClient || !activeMatch?.id) return;

    const subscription = stompClient.subscribe(`/topic/match/${activeMatch.id}/chat`, (message) => {
      try {
        const newMsg = JSON.parse(message.body);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      } catch (e) {
        console.error('Failed to parse incoming chat message', e);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [stompClient, activeMatch?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || !activeMatch?.id) return;

    const text = inputValue.trim();
    setInputValue('');

    try {
      const res = await chatAPI.sendMessage(activeMatch.id, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleCompleteRide = async () => {
    if (!activeMatch) return;
    try {
      await matchAPI.updateStatus(activeMatch.id, 'COMPLETED');
      setShowMenu(false);
      setActiveMatch(null);
      if (setSocketActiveMatch) {
        setSocketActiveMatch(null);
      }
      setMessages([]);
      alert('Ride completed! The match has been saved to your Match History.');
      if (setActiveTab) {
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Failed to complete match', err);
    }
  };

  const other = activeMatch?.otherStudent || {};
  const initial = other.fullName ? other.fullName.charAt(0).toUpperCase() : 'S';

  if (!activeMatch && !loading) {
    return (
      <div className="flex-1 flex flex-col h-screen bg-[#f8fafc] w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Chats</h1>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">No Active Ride Chat</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Chat becomes active once a ride request is accepted. When the ride is finished, the chat automatically closes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
        {/* Left: Mobile Hamburger Toggle + Matched Student Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {activeMatch && (
            <div className="flex items-center gap-3">
              {other.profileImageUrl ? (
                <img
                  src={other.profileImageUrl}
                  alt={other.fullName}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center">
                  {initial}
                </div>
              )}
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                  {other.fullName || 'Student'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                  <span className="text-[11px] sm:text-xs font-semibold text-emerald-600">Online</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Menu Controls */}
        <div className="flex items-center gap-2">
          {activeMatch && (
            <div className="relative flex items-center gap-2">
              <button
                onClick={handleCompleteRide}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Ride</span>
              </button>

              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 top-full w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in duration-150">
                  <button
                    onClick={handleCompleteRide}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Complete & End Ride
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (other.phone) alert(`Student Phone: ${other.phone}`);
                      else alert('No phone number provided');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-slate-500" />
                    Call Student
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6 space-y-3.5 sm:space-y-4 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-slate-400 text-xs sm:text-sm">
            <p className="font-semibold text-slate-600 mb-1">Say hello to {other.fullName || 'your ride buddy'}!</p>
            <p className="text-xs">Coordinate your pickup spot and departure time.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-[#2563eb] text-white rounded-br-sm'
                      : 'bg-[#f1f5f9] text-slate-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-1 px-1">
                  {msg.formattedTime || 'Just now'}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className="p-3 sm:p-5 border-t border-slate-100 bg-white sticky bottom-0">
        <form
          onSubmit={handleSend}
          className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3 bg-white"
        >
          <button
            type="button"
            onClick={() => alert('Attachment upload ready')}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Paperclip className="w-5 h-5 rotate-45" />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-[#f8fafc] border border-slate-200 rounded-full text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#2563eb] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-all disabled:opacity-40 cursor-pointer flex-shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
