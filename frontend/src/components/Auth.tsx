import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: { id: string; name: string; email: string }) => void;
  onClose: () => void;
}

export default function Auth({ onAuthSuccess, onClose }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to login');
        onAuthSuccess(data.user);
      } else if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to register');
        onAuthSuccess(data.user);
      } else {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');
        setMessage(data.message);
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#17232D]/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-[#E5ECEF] w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
        {/* Luxury subtle pattern background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#EEF4F5] rounded-full filter blur-3xl opacity-60 -z-10" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#EEF4F5] rounded-full filter blur-3xl opacity-60 -z-10" />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0F6E7C] flex items-center justify-center text-white font-bold text-lg shadow-md">T</span>
            <span className="font-manrope font-extrabold text-xl tracking-tight text-[#17232D]">Talish<span className="text-[#1E8FA0]">Flow</span></span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#68737D] hover:text-[#17232D] transition-colors p-1.5 rounded-lg hover:bg-[#EEF4F5]"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold font-manrope text-[#17232D] tracking-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Premium Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-[#68737D] text-sm mt-1">
            {mode === 'login' && 'Sign in to access your creator dashboard'}
            {mode === 'register' && 'Start transforming your long-form videos'}
            {mode === 'reset' && 'Enter your email to configure a new password'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[#EF4444] text-xs font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-[#22C55E] text-xs font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#17232D] mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#68737D]"><User size={18} /></span>
                <input
                  type="text"
                  required
                  placeholder="Alexander Wright"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg focus:outline-none focus:border-[#0F6E7C] focus:bg-white transition-all text-[#17232D]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#17232D] mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#68737D]"><Mail size={18} /></span>
              <input
                type="email"
                required
                placeholder="alexander@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg focus:outline-none focus:border-[#0F6E7C] focus:bg-white transition-all text-[#17232D]"
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-[#17232D]">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-xs text-[#0F6E7C] hover:text-[#0A5560] font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#68737D]"><Lock size={18} /></span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg focus:outline-none focus:border-[#0F6E7C] focus:bg-white transition-all text-[#17232D]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#0F6E7C] hover:bg-[#0A5560] text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0F6E7C]/10 active:scale-[0.98]"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <>
                {mode === 'login' && 'Sign In to Studio'}
                {mode === 'register' && 'Create Premium Account'}
                {mode === 'reset' && 'Reset My Password'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E5ECEF] text-center">
          <p className="text-xs text-[#68737D]">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-[#0F6E7C] font-bold hover:underline">
                  Sign Up
                </button>
              </>
            )}
            {mode === 'register' && (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-[#0F6E7C] font-bold hover:underline">
                  Sign In
                </button>
              </>
            )}
            {mode === 'reset' && (
              <button onClick={() => setMode('login')} className="text-[#0F6E7C] font-bold hover:underline">
                Back to Sign In
              </button>
            )}
          </p>
        </div>

        {/* Brand commitment footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-[#68737D] tracking-wide uppercase font-semibold">
          <ShieldCheck size={12} className="text-[#22C55E]" />
          Secured with bank-grade 256-bit encryption
        </div>
      </div>
    </div>
  );
}
