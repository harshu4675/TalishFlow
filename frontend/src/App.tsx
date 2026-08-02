import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Youtube, Instagram, Settings as SettingsIcon, BarChart3, 
  Video, LogOut, ArrowRight, CheckCircle2, RefreshCw, X, ShieldCheck, 
  Sliders, UserCheck, HardDrive, Play, HelpCircle, LayoutDashboard, Link2
} from 'lucide-react';
import { User, UserSetting } from './types.js';

// Import Views
import LandingPage from './components/LandingPage.tsx';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import Studio from './components/Studio.tsx';
import ConnectedAccounts from './components/ConnectedAccounts.tsx';
import Settings from './components/Settings.tsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSetting | null>(null);
  const [loading, setLoading] = useState(true);

  // View state coordinates
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Global Toast Notifications
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // On launch: Check for active session cookie
  const checkActiveSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSettings(data.settings);
        setActiveTab('dashboard');
      } else {
        setActiveTab('landing');
      }
    } catch (err) {
      setActiveTab('landing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveSession();
  }, []);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setShowAuthModal(false);
    setActiveTab('dashboard');
    showToast(`Welcome back, ${userData.name}! Enjoy secure content reframing.`, 'success');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setSettings(null);
      setActiveTab('landing');
      showToast('Logged out of workspace successfully.', 'success');
    } catch (err) {
      showToast('Logout failed', 'error');
    }
  };

  const handleNavigateToStudio = (videoId: string) => {
    setSelectedVideoId(videoId);
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col justify-between selection:bg-[#0F6E7C]/20 selection:text-[#0F6E7C]">
      
      {/* GLOBAL NOTIFICATION TOAST BAR */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 max-w-sm bg-white ${
            toast.type === 'success' ? 'border-[#22C55E]/30 text-[#22C55E]' :
            toast.type === 'error' ? 'border-[#EF4444]/30 text-[#EF4444]' :
            toast.type === 'warning' ? 'border-[#F59E0B]/30 text-[#F59E0B]' :
            'border-[#1E8FA0]/30 text-[#1E8FA0]'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full fill-current flex-shrink-0 bg-current" />
            <div className="text-xs font-bold text-[#17232D]">
              {toast.msg}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-[#68737D] hover:text-[#17232D] text-xs font-bold p-1 rounded hover:bg-[#EEF4F5] ml-auto transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* CORE ROUTING ENGINE */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#0F6E7C] flex items-center justify-center text-white font-black text-2xl shadow-xl animate-spin">T</div>
          <p className="text-xs text-[#68737D] font-bold uppercase tracking-widest animate-pulse">Launching TalishFlow Studio...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* LOGGED IN NAVIGATION */}
          {user && activeTab !== 'landing' && (
            <header className="border-b border-[#E5ECEF] bg-white/80 backdrop-blur-md sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
                <div 
                  onClick={() => {
                    setSelectedVideoId(null);
                    setActiveTab('dashboard');
                  }}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <span className="w-9 h-9 rounded-lg bg-[#0F6E7C] flex items-center justify-center text-white font-extrabold text-base shadow-md group-hover:scale-105 transition-transform">T</span>
                  <span className="font-manrope font-extrabold text-lg tracking-tight text-[#17232D]">Talish<span className="text-[#1E8FA0]">Flow</span></span>
                </div>

                <nav className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      setSelectedVideoId(null);
                      setActiveTab('dashboard');
                    }}
                    className={`text-xs font-bold transition-all flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#EEF4F5] text-[#0F6E7C]' : 'text-[#68737D] hover:text-[#17232D]'}`}
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVideoId(null);
                      setActiveTab('connected-accounts');
                    }}
                    className={`text-xs font-bold transition-all flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'connected-accounts' ? 'bg-[#EEF4F5] text-[#0F6E7C]' : 'text-[#68737D] hover:text-[#17232D]'}`}
                  >
                    <Link2 size={14} /> Connected Channels
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVideoId(null);
                      setActiveTab('settings');
                    }}
                    className={`text-xs font-bold transition-all flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'settings' ? 'bg-[#EEF4F5] text-[#0F6E7C]' : 'text-[#68737D] hover:text-[#17232D]'}`}
                  >
                    <SettingsIcon size={14} /> Preferences
                  </button>
                </nav>

                <div className="flex items-center gap-3 border-l border-[#E5ECEF] pl-4">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF4F5] border border-[#E5ECEF] flex items-center justify-center font-bold text-xs text-[#0F6E7C]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <h5 className="text-xs font-bold text-[#17232D] leading-none">{user.name}</h5>
                    <span className="text-[9px] text-[#68737D] font-semibold">Creator Level 1</span>
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* TAB ROUTING DIRECTORY */}
          <main className="flex-1">
            {activeTab === 'landing' && (
              <LandingPage 
                onGetStarted={() => setShowAuthModal(true)} 
                onLogin={() => setShowAuthModal(true)} 
              />
            )}
            
            {activeTab === 'dashboard' && user && (
              <Dashboard 
                user={user} 
                onNavigateToStudio={handleNavigateToStudio}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                showToast={showToast}
              />
            )}

            {activeTab === 'studio' && selectedVideoId && (
              <Studio 
                videoId={selectedVideoId} 
                onBack={() => {
                  setSelectedVideoId(null);
                  setActiveTab('dashboard');
                }}
                showToast={showToast}
              />
            )}

            {activeTab === 'connected-accounts' && (
              <ConnectedAccounts 
                showToast={showToast}
              />
            )}

            {activeTab === 'settings' && user && (
              <Settings 
                user={user}
                onLogout={handleLogout}
                showToast={showToast}
              />
            )}
          </main>
        </div>
      )}

      {/* AUTH POPUP MODAL CONTROL */}
      {showAuthModal && (
        <Auth 
          onAuthSuccess={handleAuthSuccess} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </div>
  );
}
