import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import IncomingRequestModal from './components/IncomingRequestModal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Chats from './pages/Chats';
import MatchHistory from './pages/MatchHistory';
import ProfileSettings from './pages/ProfileSettings';

function MainApp() {
  const { user, loading } = useAuth();
  const { incomingRequest, activeMatchNotification, clearMatchNotification } = useSocket();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'find_rides' | 'chats' | 'history' | 'profile' | 'settings'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeChatMatchId, setActiveChatMatchId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="font-bold text-lg tracking-tight">RideLink</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show Login or Signup
  if (!user) {
    if (authView === 'signup') {
      return <Signup onNavigateToLogin={() => setAuthView('login')} />;
    }
    return <Login onNavigateToSignup={() => setAuthView('signup')} />;
  }

  const handleOpenChatWithMatch = (matchId) => {
    setActiveChatMatchId(matchId);
    setActiveTab('chats');
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-x-hidden relative">
      {/* Sliding Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full min-w-0">
        <div className={`flex-1 flex flex-col w-full ${(activeTab === 'home' || activeTab === 'find_rides') ? '' : 'hidden'}`}>
          <Dashboard
            setActiveTab={setActiveTab}
            onOpenChatWithMatch={handleOpenChatWithMatch}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        </div>

        {activeTab === 'chats' && (
          <Chats
            activeMatchId={activeChatMatchId}
            setActiveTab={setActiveTab}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <MatchHistory
            setActiveTab={setActiveTab}
            onOpenChatWithMatch={handleOpenChatWithMatch}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        )}

        {(activeTab === 'profile' || activeTab === 'settings') && (
          <ProfileSettings
            setActiveTab={setActiveTab}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        )}
      </div>

      {/* Real-time Incoming Ride Request Popup Modal */}
      {incomingRequest && (
        <IncomingRequestModal
          request={incomingRequest}
          onAccepted={(match) => {
            setActiveChatMatchId(match.id);
            setActiveTab('chats');
          }}
          onRejected={() => {}}
        />
      )}

      {/* Real-time Match Notification Toast / Popup */}
      {activeMatchNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-700 max-w-sm animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-400">Ride Match Connected!</p>
              <p className="text-sm font-bold text-white mt-1">
                {activeMatchNotification.otherStudent?.fullName} accepted your ride request!
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Route: {activeMatchNotification.campusName} → {activeMatchNotification.destinationName}
              </p>
            </div>
            <button
              onClick={clearMatchNotification}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <button
            onClick={() => {
              setActiveChatMatchId(activeMatchNotification.id);
              setActiveTab('chats');
              clearMatchNotification();
            }}
            className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center cursor-pointer"
          >
            Open Chat Now
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
