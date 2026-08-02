import React, { useState } from 'react';
import { Play, Sparkles, Sliders, Smartphone, Check, Instagram, Youtube, Wand2, Shield, HeartPulse, Clock } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const [cropX, setCropX] = useState<number>(50); // percentage

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      {/* Header */}
      <header className="border-b border-[#E5ECEF] bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-[#0F6E7C] flex items-center justify-center text-white font-extrabold text-xl shadow-lg">T</span>
            <span className="font-manrope font-extrabold text-2xl tracking-tight text-[#17232D]">Talish<span className="text-[#1E8FA0]">Flow</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-[#68737D] hover:text-[#17232D] transition-colors">Features</a>
            <a href="#editor" className="text-sm font-semibold text-[#68737D] hover:text-[#17232D] transition-colors">Interactive Demo</a>
            <a href="#pricing" className="text-sm font-semibold text-[#68737D] hover:text-[#17232D] transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin} 
              className="text-sm font-semibold text-[#17232D] hover:text-[#0F6E7C] transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#0F6E7C]/10 hover:shadow-[#0F6E7C]/20 active:scale-[0.98] cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Subtle Luxury Blobs */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#EEF4F5] rounded-full filter blur-3xl opacity-60 -z-10 animate-pulse" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-[#0F6E7C]/5 rounded-full filter blur-3xl opacity-50 -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#EEF4F5] text-[#0F6E7C] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-[#0F6E7C]/10">
            <Sparkles size={14} /> Next-Gen Creator Automation
          </div>

          <h1 className="font-manrope font-extrabold text-5xl md:text-7xl text-[#17232D] tracking-tight leading-tight max-w-4xl mx-auto">
            Turn Long-Form Videos Into <span className="text-[#0F6E7C]">Viral Shorts</span> Instantly
          </h1>

          <p className="text-[#68737D] text-lg md:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
            Convert podcasts, gameplay, and clips into high-performing 9:16 vertical videos. Generate real Whisper transcripts, luxury-styled subtitles, and publish with one click.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-lg shadow-[#0F6E7C]/10 hover:shadow-[#0F6E7C]/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              Start Automating Free <Play size={16} fill="white" />
            </button>
            <a
              href="#editor"
              className="bg-white border border-[#E5ECEF] text-[#17232D] hover:bg-[#EEF4F5] hover:border-[#0F6E7C]/20 px-8 py-4 rounded-xl font-semibold text-base transition-all flex items-center gap-2 cursor-pointer"
            >
              Try Interactive Editor
            </a>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-[#68737D]">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield size={18} className="text-[#0F6E7C]" /> No Credit Card Required
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock size={18} className="text-[#0F6E7C]" /> 5-Sec Clip Detection
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HeartPulse size={18} className="text-[#0F6E7C]" /> No Watermark
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Crop Demo Section */}
      <section id="editor" className="py-20 bg-white border-y border-[#E5ECEF]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#EEF4F5] text-[#0F6E7C] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[#0F6E7C]/10">
              <Smartphone size={12} /> Interactive Simulator
            </div>
            <h2 className="font-manrope font-extrabold text-3xl md:text-4xl text-[#17232D] tracking-tight">
              Smart 9:16 Reframing & Motion Tracking
            </h2>
            <p className="text-[#68737D] text-base mt-4 leading-relaxed">
              Standard reframing stretches or cuts off important content. TalishFlow automatically analyzes motion peaks and facial cues using advanced OpenCV models, ensuring the action is always centered in the frame.
            </p>
            <p className="text-[#68737D] text-base mt-2 leading-relaxed">
              Drag the slider to manually adjust the horizontal tracking frame and experience how our responsive Canvas editor works.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[#17232D]">Horizontal Offset (X Coordinate)</span>
                  <span className="text-sm font-extrabold text-[#0F6E7C]">{cropX}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cropX}
                  onChange={(e) => setCropX(Number(e.target.value))}
                  className="w-full h-2 bg-[#EEF4F5] rounded-lg appearance-none cursor-pointer accent-[#0F6E7C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-[#E5ECEF] p-4 rounded-xl bg-[#F8FAFB]">
                  <div className="text-xs text-[#68737D] font-bold uppercase">Framing Mode</div>
                  <div className="text-sm font-bold text-[#17232D] mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Auto Face-Track
                  </div>
                </div>
                <div className="border border-[#E5ECEF] p-4 rounded-xl bg-[#F8FAFB]">
                  <div className="text-xs text-[#68737D] font-bold uppercase">Aspect Presets</div>
                  <div className="text-sm font-bold text-[#17232D] mt-1">9:16 Vertical (1080x1920)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            {/* Visual Crop Demonstration Area */}
            <div className="relative w-full max-w-sm aspect-[9/16] bg-slate-900 rounded-3xl border-8 border-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
              {/* Fake video background */}
              <div 
                className="absolute inset-y-0 h-full w-[300%] transition-transform duration-300 ease-out"
                style={{ 
                  transform: `translateX(calc(-50% + ${50 - cropX}px))`,
                  backgroundImage: `url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />

              {/* Subtitles Simulation inside video */}
              <div className="absolute bottom-16 inset-x-0 text-center px-4 z-10 select-none pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm py-2 px-3 rounded-lg border border-[#0F6E7C]/20 inline-block">
                  <p className="font-manrope font-extrabold text-sm text-[#0F6E7C] tracking-tight">
                    "Exculence is <span className="text-yellow-400">never an accident</span>"
                  </p>
                </div>
              </div>

              {/* Crop Box visualization */}
              <div className="absolute inset-0 border-2 border-[#1E8FA0] rounded-2xl pointer-events-none z-10 flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <span className="bg-[#1E8FA0] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">9:16 Portrait</span>
                  <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Live Preview</span>
                </div>
                {/* Horizontal reference rule grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white">
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-white"></div>
                  <div className="border-r border-white"></div>
                  <div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grids */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-manrope font-extrabold text-3xl md:text-5xl text-[#17232D] tracking-tight">
            Engineered For Premium Creators
          </h2>
          <p className="text-[#68737D] text-lg max-w-xl mx-auto mt-4">
            Everything you need to automate your social distribution pipelines without sacrificing video quality.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl border border-[#E5ECEF] hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-[#EEF4F5] rounded-xl flex items-center justify-center text-[#0F6E7C] mb-6">
              <Wand2 size={24} />
            </div>
            <h3 className="font-manrope font-bold text-xl text-[#17232D]">Moment Detection</h3>
            <p className="text-[#68737D] text-sm mt-3 leading-relaxed">
              Our real speech peak algorithms parse high-energy spikes, laughter, and keywords to identify the exact moments that hook viewer retention.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl border border-[#E5ECEF] hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-[#EEF4F5] rounded-xl flex items-center justify-center text-[#0F6E7C] mb-6">
              <Sliders size={24} />
            </div>
            <h3 className="font-manrope font-bold text-xl text-[#17232D]">Luxury Typography</h3>
            <p className="text-[#68737D] text-sm mt-3 leading-relaxed">
              Design subtitles matching premium brands like Vercel and Linear. Beautiful colors, animated active-word highlighting, and custom fonts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl border border-[#E5ECEF] hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-[#EEF4F5] rounded-xl flex items-center justify-center text-[#0F6E7C] mb-6">
              <Smartphone size={24} />
            </div>
            <h3 className="font-manrope font-bold text-xl text-[#17232D]">Official Social APIs</h3>
            <p className="text-[#68737D] text-sm mt-3 leading-relaxed">
              Seamless Google and Meta integrations allow secure publishing of YouTube Shorts and Instagram Reels directly through official channels.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#EEF4F5]/60 border-t border-[#E5ECEF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-manrope font-extrabold text-3xl md:text-5xl text-[#17232D] tracking-tight">
              Transparent, Premium Pricing
            </h2>
            <p className="text-[#68737D] text-lg max-w-xl mx-auto mt-4">
              Access the ultimate video reframing and subtitle design workspace with flexible scaling.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white p-8 rounded-2xl border border-[#E5ECEF] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#17232D] font-manrope">Starter</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-manrope text-[#17232D]">$0</span>
                  <span className="text-xs text-[#68737D] font-semibold">/ month</span>
                </div>
                <p className="text-[#68737D] text-xs mt-3">Perfect for exploring the visual timeline editor.</p>
                <ul className="mt-6 space-y-3.5 text-xs text-[#17232D] font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Up to 3 video imports / mo</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Standard subtitle styles</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> 1080P Export quality</li>
                  <li className="flex items-center gap-2 text-[#68737D]/60"><Check size={14} className="text-gray-300" /> No direct publishing</li>
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className="w-full mt-8 border border-[#E5ECEF] text-[#17232D] hover:bg-[#EEF4F5] py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro */}
            <div className="bg-[#FFFFFF] p-8 rounded-2xl border-2 border-[#0F6E7C] relative shadow-xl flex flex-col justify-between">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0F6E7C] text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full tracking-wider">Most Popular</span>
              <div>
                <h3 className="text-lg font-bold text-[#17232D] font-manrope flex items-center gap-1.5">Creator Pro <Sparkles size={16} className="text-[#0F6E7C]" /></h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-manrope text-[#17232D]">$29</span>
                  <span className="text-xs text-[#68737D] font-semibold">/ month</span>
                </div>
                <p className="text-[#68737D] text-xs mt-3">For professional creators shipping content daily.</p>
                <ul className="mt-6 space-y-3.5 text-xs text-[#17232D] font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Unlimited video uploads & URLs</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> 5, 10, or 20 auto moments / video</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> 2K / 4K UHD Export quality</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Autopublish & queue scheduling</li>
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className="w-full mt-8 bg-[#0F6E7C] hover:bg-[#0A5560] text-white py-2.5 rounded-lg font-semibold text-xs transition-all shadow-md cursor-pointer active:scale-95"
              >
                Unlock Pro Access
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-8 rounded-2xl border border-[#E5ECEF] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#17232D] font-manrope">Studio / Team</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-manrope text-[#17232D]">$89</span>
                  <span className="text-xs text-[#68737D] font-semibold">/ month</span>
                </div>
                <p className="text-[#68737D] text-xs mt-3">For media studios and multi-member agencies.</p>
                <ul className="mt-6 space-y-3.5 text-xs text-[#17232D] font-semibold">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Everything in Creator Pro</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Multi-user visual workspaces</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Fast priority video render queue</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> Dedicated Account Manager</li>
                </ul>
              </div>
              <button 
                onClick={onGetStarted}
                className="w-full mt-8 border border-[#E5ECEF] text-[#17232D] hover:bg-[#EEF4F5] py-2.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5ECEF] py-12 text-center text-xs text-[#68737D]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0F6E7C] flex items-center justify-center text-white font-extrabold text-base">T</span>
            <span className="font-manrope font-extrabold text-lg tracking-tight text-[#17232D]">Talish<span className="text-[#1E8FA0]">Flow</span></span>
          </div>
          <div>
            © 2026 TalishFlow. All rights reserved. Built with pride for content creators worldwide.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#17232D]">Privacy Policy</a>
            <a href="#" className="hover:text-[#17232D]">Terms of Service</a>
            <a href="#" className="hover:text-[#17232D]">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
