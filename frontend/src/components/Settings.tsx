import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Shield, Laptop, Moon, Sun, 
  Sparkles, CheckCircle2, RefreshCw, LogOut, KeyRound 
} from 'lucide-react';
import { UserSetting } from '../types.js';

interface SettingsProps {
  user: { id: string; name: string; email: string };
  onLogout: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function Settings({ user, onLogout, showToast }: SettingsProps) {
  const [settings, setSettings] = useState<UserSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  // Password reset fields
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSettings(data);
      showToast('Account defaults updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setResettingPassword(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="pb-6 border-b border-[#E5ECEF] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-manrope font-extrabold text-3xl text-[#17232D] tracking-tight">
            Account Preferences
          </h1>
          <p className="text-[#68737D] text-sm mt-1">
            Configure default render presets, platform language matching, and credential safety options.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 border border-red-100 px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <LogOut size={14} /> Sign Out of Account
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center animate-pulse space-y-3">
          <RefreshCw className="animate-spin text-[#0F6E7C] mx-auto" size={28} />
          <p className="text-xs text-[#68737D] font-bold">Synchronizing database preferences...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Menu Column */}
          <div className="md:col-span-1 space-y-3 bg-white p-4 border border-[#E5ECEF] rounded-2xl">
            <div className="text-[10px] font-bold text-[#68737D] uppercase tracking-wider px-3 mb-2">Category Sections</div>
            <button className="w-full text-left px-3 py-2 text-xs font-bold text-[#0F6E7C] bg-[#EEF4F5] rounded-xl flex items-center gap-2">
              <SettingsIcon size={14} /> Workspace Preferences
            </button>
            <button className="w-full text-left px-3 py-2 text-xs font-bold text-[#68737D] hover:text-[#17232D] rounded-xl flex items-center gap-2 transition-colors">
              <Shield size={14} /> Privacy & Safety
            </button>
          </div>

          {/* Configuration Form Columns */}
          <div className="md:col-span-2 space-y-8">
            {/* General Preference Form */}
            {settings && (
              <form onSubmit={handleSaveSettings} className="bg-white border border-[#E5ECEF] rounded-2xl p-6 shadow-sm space-y-6">
                <h3 className="font-manrope font-bold text-lg text-[#17232D] pb-3 border-b border-[#E5ECEF] flex items-center gap-2">
                  <Laptop size={18} className="text-[#0F6E7C]" /> Studio Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Caption Language</label>
                    <select
                      value={settings.defaultLanguage}
                      onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Hinglish">Hinglish (Hindi-English mix)</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Auto-Transcription</label>
                    <div className="flex items-center gap-2 h-9">
                      <input
                        type="checkbox"
                        checked={settings.autoSubtitles}
                        onChange={(e) => setSettings({ ...settings, autoSubtitles: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 accent-[#0F6E7C]"
                      />
                      <span className="text-xs text-[#68737D] font-semibold">Enable Whisper transcribing</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Default Export Quality</label>
                    <select
                      value={settings.defaultExportQuality}
                      onChange={(e) => setSettings({ ...settings, defaultExportQuality: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none"
                    >
                      <option value="1080p">1080P Full HD (SaaS standard)</option>
                      <option value="2k">2K Quad HD (High retention)</option>
                      <option value="4k">4K Ultra HD (Cinema quality)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Default Caption Tone</label>
                    <select
                      value={settings.defaultCaptionTone}
                      onChange={(e) => setSettings({ ...settings, defaultCaptionTone: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none"
                    >
                      <option value="luxury">Luxury (Refined, Command, Silent)</option>
                      <option value="professional">Professional (Business style)</option>
                      <option value="funny">Funny (Relatable, Humor focus)</option>
                      <option value="storytelling">Storytelling (Vatican files, Historical)</option>
                      <option value="educational">Educational (SaaS software tutorials)</option>
                      <option value="minimal">Minimal (Hook focus only)</option>
                      <option value="motivational">Motivational (Hustle & grind)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E5ECEF]">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    {saving ? (
                      <RefreshCw className="animate-spin" size={12} />
                    ) : (
                      'Save Studio Preferences'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Profile Reset Password Form */}
            <form onSubmit={handleResetPassword} className="bg-white border border-[#E5ECEF] rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-manrope font-bold text-lg text-[#17232D] pb-3 border-b border-[#E5ECEF] flex items-center gap-2">
                <KeyRound size={18} className="text-[#0F6E7C]" /> Reset Account Password
              </h3>

              <div>
                <label className="block text-xs font-bold text-[#17232D] mb-1.5">New Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none focus:border-[#0F6E7C] focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-[#E5ECEF]">
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  {resettingPassword ? (
                    <RefreshCw className="animate-spin" size={12} />
                  ) : (
                    'Configure New Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
