import React, { useState, useEffect } from 'react';
import { 
  Youtube, Instagram, Link2, CheckCircle2, AlertTriangle, 
  HelpCircle, RefreshCw, X, ShieldAlert 
} from 'lucide-react';
import { ConnectedAccountsStatus } from '../types.js';

interface ConnectedAccountsProps {
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function ConnectedAccounts({ showToast }: ConnectedAccountsProps) {
  const [status, setStatus] = useState<ConnectedAccountsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/oauth/status');
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch OAuth status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (platform: 'youtube' | 'instagram') => {
    setConnectingPlatform(platform);
    try {
      const res = await fetch(`/api/oauth/connect/${platform}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // In a real OAuth flow we redirect, but for high-fidelity SaaS demo,
      // we can simulate completing the OAuth connection by posting immediately to the callback route
      // and showing a beautiful callback progress
      setTimeout(async () => {
        try {
          const cbRes = await fetch(`/api/oauth/callback/${platform}`, { method: 'POST' });
          const cbData = await cbRes.json();
          if (!cbRes.ok) throw new Error(cbData.error);

          showToast(cbData.message, 'success');
          fetchStatus();
        } catch (err: any) {
          showToast(err.message || 'OAuth Connection failed', 'error');
        } finally {
          setConnectingPlatform(null);
        }
      }, 2000);
    } catch (err: any) {
      showToast(err.message || 'OAuth initiation failed', 'error');
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: 'youtube' | 'instagram') => {
    if (!confirm(`Are you sure you want to disconnect your connected ${platform === 'youtube' ? 'YouTube' : 'Instagram'} profile?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/oauth/disconnect/${platform}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      fetchStatus();
    } catch (err: any) {
      showToast(err.message || 'Disconnection failed', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5ECEF]">
        <h1 className="font-manrope font-extrabold text-3xl text-[#17232D] tracking-tight">
          Connected Accounts
        </h1>
        <p className="text-[#68737D] text-sm mt-1">
          Link your official creator channels through secure OAuth protocols to activate click-to-publish workflows.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center space-y-3 animate-pulse">
          <RefreshCw className="animate-spin text-[#0F6E7C] mx-auto" size={28} />
          <p className="text-xs text-[#68737D] font-bold">Verifying OAuth token handshakes...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* YouTube Card */}
          <div className="bg-white border border-[#E5ECEF] rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#FF0000] shadow-sm">
                  <Youtube size={24} fill="currentColor" />
                </span>
                {status?.youtube.connected ? (
                  <span className="bg-green-50 border border-green-200 text-[#22C55E] text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Connected
                  </span>
                ) : (
                  <span className="bg-gray-50 border border-gray-200 text-gray-400 text-[10px] font-extrabold px-3 py-1 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>

              <h2 className="font-manrope font-bold text-lg text-[#17232D] mt-6">YouTube Shorts Pipeline</h2>
              <p className="text-[#68737D] text-xs mt-1.5 leading-relaxed">
                Connect your YouTube channel using Google Secure OAuth. Once linked, you can directly upload and schedule vertical shorts to your channel feeds.
              </p>

              {status?.youtube.connected && (
                <div className="mt-6 p-4 bg-[#F8FAFB] border border-[#E5ECEF] rounded-xl flex items-center gap-3">
                  <img 
                    src={status.youtube.profilePicture} 
                    alt={status.youtube.profileName}
                    className="w-10 h-10 rounded-full border border-[#E5ECEF]"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[#17232D]">{status.youtube.profileName}</h4>
                    <p className="text-[10px] text-[#68737D] font-semibold">{status.youtube.handle}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5ECEF] flex justify-end">
              {status?.youtube.connected ? (
                <button
                  onClick={() => handleDisconnect('youtube')}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 border border-red-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Disconnect Channel
                </button>
              ) : (
                <button
                  onClick={() => handleConnect('youtube')}
                  disabled={connectingPlatform !== null}
                  className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  {connectingPlatform === 'youtube' ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      <span>Securing Connection...</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={14} />
                      <span>Connect YouTube Channel</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Instagram Card */}
          <div className="bg-white border border-[#E5ECEF] rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[#E1306C] shadow-sm">
                  <Instagram size={24} />
                </span>
                {status?.instagram.connected ? (
                  <span className="bg-green-50 border border-green-200 text-[#22C55E] text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Connected
                  </span>
                ) : (
                  <span className="bg-gray-50 border border-gray-200 text-gray-400 text-[10px] font-extrabold px-3 py-1 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>

              <h2 className="font-manrope font-bold text-lg text-[#17232D] mt-6">Instagram Professional Reels</h2>
              <p className="text-[#68737D] text-xs mt-1.5 leading-relaxed">
                Connect your Instagram Professional or Business account using Meta Secure OAuth. Link your page to publish vertical Reels directly with custom covers.
              </p>

              {status?.instagram.connected && (
                <div className="mt-6 p-4 bg-[#F8FAFB] border border-[#E5ECEF] rounded-xl flex items-center gap-3">
                  <img 
                    src={status.instagram.profilePicture} 
                    alt={status.instagram.profileName}
                    className="w-10 h-10 rounded-full border border-[#E5ECEF]"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-[#17232D]">{status.instagram.profileName}</h4>
                    <p className="text-[10px] text-[#68737D] font-semibold">{status.instagram.handle}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-[#E5ECEF] flex justify-end">
              {status?.instagram.connected ? (
                <button
                  onClick={() => handleDisconnect('instagram')}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 border border-red-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Disconnect Profile
                </button>
              ) : (
                <button
                  onClick={() => handleConnect('instagram')}
                  disabled={connectingPlatform !== null}
                  className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  {connectingPlatform === 'instagram' ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} />
                      <span>Securing Connection...</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={14} />
                      <span>Connect Instagram Pro</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meta API Limitations disclosure block */}
      <div className="bg-[#EEF4F5]/60 border border-[#E5ECEF] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#17232D] flex items-center gap-1.5">
          <ShieldAlert size={18} className="text-[#0F6E7C]" /> Platform Integration Disclosures
        </h3>
        
        <div className="space-y-3.5 text-xs text-[#68737D] font-medium leading-relaxed">
          <p>
            Our publishing workflows strictly obey the official capabilities and limitations of third-party network APIs:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[11px]">
            <li>
              <strong>Instagram Reels:</strong> Direct automation is strictly restricted by Meta to Instagram Creator and Business (Professional) accounts connected to a Facebook page. Personal Instagram accounts are restricted by Meta OAuth from publishing automatically. If your account is Personal, you must switch to Professional inside the Instagram app first.
            </li>
            <li>
              <strong>YouTube Shorts:</strong> Official Google APIs are fully supported. Videos under 60 seconds are automatically classified as Shorts by YouTube. Scheduling operates cleanly using our backend Redis-based queue systems.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
