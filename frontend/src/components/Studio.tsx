import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Play, Pause, Save, Share2, Download, Subtitles, 
  Sparkles, Sliders, Type, Grid3X3, Languages, Smile, CheckCircle, 
  Check, RefreshCw, Calendar, Eye, FileSpreadsheet, Film, Copy,
  Youtube, Instagram
} from 'lucide-react';
import { VideoMetadata, ClipMetadata, SubtitleStyle, CropCoords } from '../types.js';

interface StudioProps {
  videoId: string;
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function Studio({ videoId, onBack, showToast }: StudioProps) {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [clips, setClips] = useState<ClipMetadata[]>([]);
  const [activeClip, setActiveClip] = useState<ClipMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab navigation
  const [rightTab, setRightTab] = useState<'subtitles' | 'caption' | 'metadata' | 'publish'>('subtitles');

  // Video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentPlayingTime] = useState(0); // seconds relative to clip start
  const videoRef = useRef<HTMLVideoElement>(null);

  // Export overlay state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedUrl, setExportUrl] = useState<string | null>(null);

  // Publish state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isScheduling, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [publishingInProgress, setPublishingInProgress] = useState(false);

  // Fetch Project details
  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}`);
      if (!res.ok) throw new Error('Video details failed to load');
      const data = await res.json();
      setVideo(data.video);
      setClips(data.clips);
      if (data.clips && data.clips.length > 0) {
        setActiveClip(data.clips[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading studio', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [videoId]);

  // Sync video timeline with Word Highlights
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      if (!activeClip) return;
      // Calculate current time relative to clip's segment start
      const relativeTime = videoElement.currentTime;
      setCurrentPlayingTime(relativeTime);

      // Check if we hit the end of the clip's segment
      if (relativeTime >= activeClip.duration) {
        videoElement.currentTime = 0;
        if (!videoElement.loop) {
          videoElement.pause();
          setIsPlaying(false);
        }
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [activeClip]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;

    if (isPlaying) {
      v.pause();
    } else {
      v.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSelectClip = (clip: ClipMetadata) => {
    setActiveClip(clip);
    setIsPlaying(false);
    setCurrentPlayingTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  // Find active word in transcript relative to current playing time
  const getActiveWordIndex = () => {
    if (!activeClip) return -1;
    return activeClip.transcript.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
  };

  const activeWordIdx = getActiveWordIndex();

  // Save changes to database
  const handleUpdateClip = async (updatedFields: Partial<ClipMetadata>) => {
    if (!activeClip) return;
    try {
      const res = await fetch(`/api/clips/${activeClip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update clip');

      // Update local state
      setActiveClip(data.clip);
      setClips(clips.map((c) => (c.id === data.clip.id ? data.clip : c)));
      showToast('Changes saved to cloud storage!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  // Export Simulation
  const handleExport = async (resolution: '1080p' | '2k' | '4k') => {
    if (!activeClip) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportUrl(null);

    // Progress simulation
    const interval = setInterval(() => {
      setExportProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          completeExport(resolution);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 400);
  };

  const completeExport = async (res: string) => {
    try {
      const response = await fetch(`/api/clips/${activeClip!.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: res }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setExportUrl(data.downloadUrl);
      showToast('Vertical reframe compiled in high-quality!', 'success');
      
      // Import standard canvas-confetti dynamically
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0F6E7C', '#1E8FA0', '#22C55E', '#F59E0B'],
        });
      });
    } catch (err: any) {
      showToast(err.message || 'Export compilation failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Publish / Schedule
  const handlePublish = async () => {
    if (!activeClip) return;
    if (selectedPlatforms.length === 0) {
      showToast('Please select at least one platform to publish.', 'warning');
      return;
    }

    setPublishingInProgress(true);
    try {
      const res = await fetch(`/api/clips/${activeClip.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          scheduleTime: isScheduling ? scheduleTime : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      fetchProjectDetails(); // refresh details
    } catch (err: any) {
      showToast(err.message || 'Publishing failed', 'error');
    } finally {
      setPublishingInProgress(false);
    }
  };

  // Subtitle styling options
  const SUBTITLE_PRESETS = [
    { name: 'Luxury Gold', theme: 'luxury', color: '#FFFFFF', highlightColor: '#0F6E7C', font: 'Manrope' },
    { name: 'Classic White', theme: 'classic', color: '#FFFFFF', highlightColor: '#F59E0B', font: 'Inter' },
    { name: 'Cyber Neon', theme: 'neon', color: '#00FFCC', highlightColor: '#FF0055', font: 'Impact' },
    { name: 'Minimal Dark', theme: 'minimal', color: '#17232D', highlightColor: '#1E8FA0', font: 'Montserrat' },
    { name: 'Bold Headline', theme: 'bold', color: '#FFFFFF', highlightColor: '#EF4444', font: 'Playfair Display' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5ECEF]">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 border border-[#E5ECEF] hover:bg-[#EEF4F5] rounded-xl text-[#68737D] hover:text-[#17232D] transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] text-[#68737D] font-bold uppercase tracking-wider">Visual Workspace Studio</span>
            <h1 className="font-manrope font-extrabold text-xl text-[#17232D] truncate max-w-sm md:max-w-md">
              {video?.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleUpdateClip({})}
            className="text-xs font-semibold text-[#68737D] hover:text-[#17232D] hover:bg-[#EEF4F5] border border-[#E5ECEF] px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save size={14} /> Save Layout
          </button>
          <button
            onClick={() => setRightTab('publish')}
            className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Share2 size={14} /> Export & Publish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center animate-pulse space-y-4">
          <RefreshCw className="animate-spin text-[#0F6E7C] mx-auto" size={32} />
          <h3 className="font-bold text-[#17232D] text-sm">Opening Studio Timeline...</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT PANEL: Clips List */}
          <div className="lg:col-span-3 bg-white border border-[#E5ECEF] rounded-2xl p-4 flex flex-col h-[calc(100vh-220px)] overflow-hidden shadow-sm">
            <div className="pb-3 border-b border-[#E5ECEF] mb-4">
              <h3 className="font-manrope font-bold text-sm text-[#17232D]">Detected Moments</h3>
              <p className="text-[10px] text-[#68737D] font-medium">Auto-sorted by engagement potential</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
              {clips.map((clip, idx) => {
                const isActive = activeClip?.id === clip.id;
                // Generate viral engagement scores
                const score = 98 - (idx * 3) - Math.floor(idx / 2);

                return (
                  <button
                    key={clip.id}
                    onClick={() => handleSelectClip(clip)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                      isActive 
                        ? 'border-[#0F6E7C] bg-[#EEF4F5]/40 shadow-sm' 
                        : 'border-[#E5ECEF] hover:border-[#0F6E7C]/40 hover:bg-[#F8FAFB]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#0F6E7C]" />
                    )}
                    
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-xs text-[#17232D] truncate flex-1">{clip.title}</h4>
                      <span className="text-[9px] font-extrabold bg-[#0F6E7C] text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                        <Sparkles size={8} /> {score}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-[#68737D] font-semibold mt-1">
                      <span className="flex items-center gap-1 text-[#0F6E7C]"><Film size={10} /> {idx + 1} of {clips.length}</span>
                      <span>{clip.duration}s length</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] text-[#68737D] font-medium">
                      <span>Start: {clip.startTime}s</span>
                      <span>•</span>
                      <span>End: {clip.endTime}s</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER PANEL: 9:16 Custom Video Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between bg-slate-900 border border-slate-950 rounded-2xl p-6 relative overflow-hidden shadow-2xl h-[calc(100vh-220px)]">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
              Vertical Preview (9:16)
            </div>

            {activeClip && (
              <div className="relative w-full max-w-[270px] aspect-[9/16] bg-black rounded-xl overflow-hidden border-2 border-[#E5ECEF]/10 flex items-center justify-center shadow-xl">
                {/* HTML5 video loaded using landscape mock stock video inside 9:16 window */}
                <video
                  ref={videoRef}
                  src="https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-smartphone-with-a-vertical-screen-41716-large.mp4"
                  loop
                  playsInline
                  className="absolute inset-y-0 h-full max-w-none transition-transform duration-300 ease-out"
                  style={{
                    width: '300%', // 16:9 aspect ratio mapping
                    transform: `translateX(calc(-50% + ${50 - activeClip.cropCoordinates.x}px))`,
                  }}
                />

                {/* Grid Overlay visualization when manual tracking is active */}
                {activeClip.trackingType === 'manual' && (
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
                )}

                {/* Subtitles Overlay inside Player */}
                <div 
                  className={`absolute left-0 right-0 px-4 text-center select-none pointer-events-none z-10`}
                  style={{
                    top: activeClip.subtitleStyle.position === 'top' ? '15%' : (activeClip.subtitleStyle.position === 'middle' ? '50%' : undefined),
                    bottom: activeClip.subtitleStyle.position === 'bottom' ? '15%' : undefined,
                    transform: activeClip.subtitleStyle.position === 'middle' ? 'translateY(-50%)' : undefined,
                  }}
                >
                  <div className="inline-block p-2 rounded-lg bg-black/60 backdrop-blur-sm max-w-[220px]">
                    {/* Render active words styled according to preferences */}
                    <p 
                      style={{
                        fontFamily: activeClip.subtitleStyle.font === 'Impact' ? 'Impact, sans-serif' : activeClip.subtitleStyle.font,
                        fontSize: `${activeClip.subtitleStyle.fontSize}px`,
                        color: activeClip.subtitleStyle.color,
                      }}
                      className="font-extrabold tracking-tight leading-snug uppercase"
                    >
                      {activeClip.transcript.map((wordObj, idx) => {
                        const isActive = idx === activeWordIdx;
                        return (
                          <span 
                            key={idx}
                            style={{
                              color: isActive ? activeClip.subtitleStyle.highlightColor : undefined,
                            }}
                            className={`mx-0.5 inline-block ${isActive ? 'subtitle-word-active font-extrabold scale-110' : ''}`}
                          >
                            {wordObj.word}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Play/Pause controllers */}
            <div className="w-full flex items-center justify-between gap-4 mt-4 bg-black/30 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/5">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
              </button>

              <div className="flex-1 flex flex-col justify-center">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden relative">
                  <div 
                    className="bg-[#0F6E7C] h-full absolute top-0 left-0 rounded-full transition-all"
                    style={{ width: `${activeClip ? (currentTime / activeClip.duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-white/60 mt-1.5 font-bold">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span>{activeClip?.duration}s segment</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Parameters Editor */}
          <div className="lg:col-span-4 bg-white border border-[#E5ECEF] rounded-2xl p-6 flex flex-col justify-between shadow-sm h-[calc(100vh-220px)] overflow-hidden">
            <div>
              {/* Tab options headers */}
              <div className="flex border-b border-[#E5ECEF] pb-2 mb-6 gap-4 text-xs font-bold">
                <button
                  onClick={() => setRightTab('subtitles')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${rightTab === 'subtitles' ? 'border-[#0F6E7C] text-[#0F6E7C]' : 'border-transparent text-[#68737D] hover:text-[#17232D]'}`}
                >
                  Subtitles Style
                </button>
                <button
                  onClick={() => setRightTab('caption')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${rightTab === 'caption' ? 'border-[#0F6E7C] text-[#0F6E7C]' : 'border-transparent text-[#68737D] hover:text-[#17232D]'}`}
                >
                  Caption Tone
                </button>
                <button
                  onClick={() => setRightTab('metadata')}
                  className={`pb-2 border-b-2 transition-colors cursor-pointer ${rightTab === 'metadata' ? 'border-[#0F6E7C] text-[#0F6E7C]' : 'border-transparent text-[#68737D] hover:text-[#17232D]'}`}
                >
                  Tags & Titles
                </button>
              </div>

              {/* TAB 1: Subtitle Style Parameters */}
              {rightTab === 'subtitles' && activeClip && (
                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-380px)] pr-1 no-scrollbar">
                  {/* Visual Style Preset Cards */}
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-2">Preset Themes</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SUBTITLE_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleUpdateClip({
                            subtitleStyle: {
                              ...activeClip.subtitleStyle,
                              theme: preset.theme as any,
                              color: preset.color,
                              highlightColor: preset.highlightColor,
                              font: preset.font as any
                            }
                          })}
                          className={`p-2 border rounded-lg text-left transition-all text-xs font-semibold ${
                            activeClip.subtitleStyle.theme === preset.theme
                              ? 'border-[#0F6E7C] bg-[#EEF4F5]/30 text-[#0F6E7C]'
                              : 'border-[#E5ECEF] hover:border-[#0F6E7C]/40 text-[#68737D]'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Type Selection */}
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Select Font Type</label>
                    <select
                      value={activeClip.subtitleStyle.font}
                      onChange={(e) => handleUpdateClip({
                        subtitleStyle: { ...activeClip.subtitleStyle, font: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none"
                    >
                      <option value="Manrope">Manrope (Premium Classic)</option>
                      <option value="Inter">Inter (SaaS Standard)</option>
                      <option value="Montserrat">Montserrat (Modern Clean)</option>
                      <option value="Impact">Impact (Shorts Heavy Bold)</option>
                      <option value="Playfair Display">Playfair Display (Elegant Luxury)</option>
                    </select>
                  </div>

                  {/* Manual position coordinate offset */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#17232D]">Manual Reframe Crop Box</label>
                      <span className="text-[10px] bg-[#EEF4F5] text-[#0F6E7C] font-bold px-2 py-0.5 rounded">Manual Mode</span>
                    </div>
                    <div className="bg-[#F8FAFB] border border-[#E5ECEF] rounded-xl p-3.5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#68737D] font-bold">X-Offset Coordinate</span>
                        <span className="text-[10px] font-extrabold text-[#17232D]">{activeClip.cropCoordinates.x}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeClip.cropCoordinates.x}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setActiveClip({
                            ...activeClip,
                            cropCoordinates: { ...activeClip.cropCoordinates, x: val }
                          });
                        }}
                        onMouseUp={() => handleUpdateClip({ cropCoordinates: activeClip.cropCoordinates })}
                        onTouchEnd={() => handleUpdateClip({ cropCoordinates: activeClip.cropCoordinates })}
                        className="w-full h-1.5 bg-[#EEF4F5] rounded-lg appearance-none cursor-pointer accent-[#0F6E7C]"
                      />
                    </div>
                  </div>

                  {/* Font Color adjustments */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#17232D] mb-1.5">Base Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeClip.subtitleStyle.color}
                          onChange={(e) => setActiveClip({
                            ...activeClip,
                            subtitleStyle: { ...activeClip.subtitleStyle, color: e.target.value }
                          })}
                          onBlur={() => handleUpdateClip({ subtitleStyle: activeClip.subtitleStyle })}
                          className="w-7 h-7 rounded-md border border-slate-300 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold uppercase text-[#68737D]">{activeClip.subtitleStyle.color}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#17232D] mb-1.5">Highlight Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeClip.subtitleStyle.highlightColor}
                          onChange={(e) => setActiveClip({
                            ...activeClip,
                            subtitleStyle: { ...activeClip.subtitleStyle, highlightColor: e.target.value }
                          })}
                          onBlur={() => handleUpdateClip({ subtitleStyle: activeClip.subtitleStyle })}
                          className="w-7 h-7 rounded-md border border-slate-300 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold uppercase text-[#68737D]">{activeClip.subtitleStyle.highlightColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle position presets */}
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Subtitle Layout Placement</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['top', 'middle', 'bottom'].map((pos) => (
                        <button
                          key={pos}
                          onClick={() => handleUpdateClip({
                            subtitleStyle: { ...activeClip.subtitleStyle, position: pos as any }
                          })}
                          className={`p-2 border rounded-lg text-center transition-all text-xs font-bold uppercase tracking-wider ${
                            activeClip.subtitleStyle.position === pos
                              ? 'border-[#0F6E7C] bg-[#EEF4F5]/30 text-[#0F6E7C]'
                              : 'border-[#E5ECEF] hover:border-[#0F6E7C]/40 text-[#68737D]'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Caption Tone Presets */}
              {rightTab === 'caption' && activeClip && (
                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-380px)] pr-1 no-scrollbar">
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Select Creative Tone Preset</label>
                    <select
                      value={activeClip.trackingType === 'face' ? 'luxury' : 'educational'}
                      onChange={(e) => {
                        // Change tone of existing caption with standard presets
                        const selectedTone = e.target.value;
                        let customCapt = `🔥 This 1 change will double your results instantly... 🧠\n\nQuiet elegance, precision craftsmanship, and the art of restraint. Excellence is the only currency that never depreciates.\n\nDrop a comment below!👇 #business #success #luxury`;
                        if (selectedTone === 'funny') {
                          customCapt = `😂 Follow your dreams they say? Follow your rent first.\n\nYour dreams are just your brain's screen-savers while you charge your battery.\n\nTag a friend who needs a reality check! #comedy #jokes #relatable`;
                        } else if (selectedTone === 'motivational') {
                          customCapt = `⚡ Discipline wakes you up at 5:00 AM, puts on your running shoes, and pushes you out the door. Don't wait for the spark. Build the fire yourself.\n\nLet's get after it today! #motivation #discipline #hustle #mindset`;
                        }
                        handleUpdateClip({ caption: customCapt });
                      }}
                      className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none"
                    >
                      <option value="luxury">Luxury (Quiet, Refined elegance)</option>
                      <option value="funny">Funny (Standup comedy style)</option>
                      <option value="motivational">Motivational (High impact, discipline focus)</option>
                      <option value="educational">Educational (SaaS Software insights)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#17232D]">Generated Caption</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeClip.caption);
                          showToast('Caption copied to clipboard!', 'success');
                        }}
                        className="text-[10px] text-[#0F6E7C] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Copy size={10} /> Copy Caption
                      </button>
                    </div>
                    <textarea
                      value={activeClip.caption}
                      onChange={(e) => setActiveClip({ ...activeClip, caption: e.target.value })}
                      onBlur={() => handleUpdateClip({ caption: activeClip.caption })}
                      rows={8}
                      className="w-full p-3 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none focus:border-[#0F6E7C] focus:bg-white transition-all resize-none leading-relaxed font-medium"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Metadata (Tags & Titles) */}
              {rightTab === 'metadata' && activeClip && (
                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-380px)] pr-1 no-scrollbar">
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-2">High CTR Headline Hooks</label>
                    <div className="space-y-2">
                      {activeClip.suggestedTitles.map((title, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            handleUpdateClip({ title });
                            showToast(`Headline updated to hook #${idx + 1}`, 'success');
                          }}
                          className="w-full text-left p-2.5 border border-[#E5ECEF] hover:border-[#0F6E7C]/40 bg-[#F8FAFB] hover:bg-[#EEF4F5]/30 rounded-lg text-xs font-bold text-[#17232D] flex items-center justify-between gap-1 transition-all"
                        >
                          <span className="truncate">{title}</span>
                          <span className="text-[9px] text-[#0F6E7C] bg-[#EEF4F5] px-1.5 py-0.5 rounded font-extrabold flex-shrink-0">Use Hook</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[#17232D]">Generated Hashtags</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeClip.hashtags);
                          showToast('Hashtags copied!', 'success');
                        }}
                        className="text-[10px] text-[#0F6E7C] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Copy size={10} /> Copy Tags
                      </button>
                    </div>
                    <input
                      type="text"
                      value={activeClip.hashtags}
                      onChange={(e) => setActiveClip({ ...activeClip, hashtags: e.target.value })}
                      onBlur={() => handleUpdateClip({ hashtags: activeClip.hashtags })}
                      className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D] focus:outline-none font-semibold text-[#0F6E7C]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: Publish & Export Settings */}
              {rightTab === 'publish' && activeClip && (
                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)] pr-1 no-scrollbar">
                  <div>
                    <label className="block text-xs font-bold text-[#17232D] mb-1.5">Render Compilation Quality</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['1080p', '2k', '4k'].map((res) => (
                        <button
                          key={res}
                          onClick={() => handleExport(res as any)}
                          className="p-2 border border-[#E5ECEF] hover:border-[#0F6E7C]/40 hover:bg-[#EEF4F5]/30 rounded-lg text-center transition-all text-xs font-bold uppercase cursor-pointer"
                        >
                          {res} Quality
                        </button>
                      ))}
                    </div>
                  </div>

                  {exportedUrl && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="flex items-center gap-1"><CheckCircle size={14} className="text-emerald-500" /> Reframe Complete!</span>
                        <a 
                          href={exportedUrl} 
                          download={`TalishFlow_Clip_${activeClip.id}.mp4`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded shadow-sm text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Download size={10} /> Download MP4
                        </a>
                      </div>
                      <p className="mt-2 text-emerald-600 font-semibold leading-normal text-[10px]">
                        The compiled video is available without any watermarks or standard compression limits in ultra resolution.
                      </p>
                    </div>
                  )}

                  <div className="border-t border-[#E5ECEF] pt-4 space-y-4">
                    <label className="block text-xs font-bold text-[#17232D]">OAuth Publisher Pipeline</label>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const list = selectedPlatforms.includes('youtube') 
                            ? selectedPlatforms.filter((p) => p !== 'youtube') 
                            : [...selectedPlatforms, 'youtube'];
                          setSelectedPlatforms(list);
                        }}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all cursor-pointer ${
                          selectedPlatforms.includes('youtube') 
                            ? 'border-[#0F6E7C] bg-[#EEF4F5]/30 text-[#17232D]' 
                            : 'border-[#E5ECEF] text-[#68737D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-[#FF0000]/5 flex items-center justify-center text-[#FF0000]">
                            <Youtube size={18} fill="currentColor" />
                          </span>
                          <span className="text-xs font-bold text-[#17232D]">YouTube Shorts</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPlatforms.includes('youtube') ? 'bg-[#0F6E7C] border-[#0F6E7C]' : 'border-gray-300'}`}>
                          {selectedPlatforms.includes('youtube') && <Check size={10} className="text-white" />}
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          const list = selectedPlatforms.includes('instagram') 
                            ? selectedPlatforms.filter((p) => p !== 'instagram') 
                            : [...selectedPlatforms, 'instagram'];
                          setSelectedPlatforms(list);
                        }}
                        className={`w-full flex items-center justify-between p-3 border rounded-xl transition-all cursor-pointer ${
                          selectedPlatforms.includes('instagram') 
                            ? 'border-[#0F6E7C] bg-[#EEF4F5]/30 text-[#17232D]' 
                            : 'border-[#E5ECEF] text-[#68737D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-[#E1306C]">
                            <Instagram size={18} />
                          </span>
                          <span className="text-xs font-bold text-[#17232D]">Instagram Professional Reels</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPlatforms.includes('instagram') ? 'bg-[#0F6E7C] border-[#0F6E7C]' : 'border-gray-300'}`}>
                          {selectedPlatforms.includes('instagram') && <Check size={10} className="text-white" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Scheduling Switch */}
                  <div className="border-t border-[#E5ECEF] pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#17232D]">Schedule Release Date</label>
                      <input
                        type="checkbox"
                        checked={isScheduling}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#0F6E7C]"
                      />
                    </div>

                    {isScheduling && (
                      <input
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-[#17232D]"
                      />
                    )}
                  </div>

                  <button
                    onClick={handlePublish}
                    disabled={publishingInProgress}
                    className="w-full mt-4 bg-[#0F6E7C] hover:bg-[#0A5560] text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {publishingInProgress ? (
                      <>
                        <RefreshCw className="animate-spin" size={12} />
                        <span>Sending to platform queue...</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={12} />
                        <span>{isScheduling ? 'Schedule Content Publish' : 'Auto-Publish Active Channels'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Compilation progress popup overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E5ECEF] w-full max-w-sm p-8 text-center shadow-2xl space-y-4">
            <RefreshCw className="animate-spin text-[#0F6E7C] mx-auto" size={36} />
            <h3 className="font-manrope font-extrabold text-lg text-[#17232D]">Compiling Reframe Box</h3>
            <p className="text-[#68737D] text-xs">Processing audio peaks, stitching subtitle highlighting templates, and rendering without watermark...</p>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold inline-block py-1 px-2 uppercase rounded-full bg-[#EEF4F5] text-[#0F6E7C]">
                    Render Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#0F6E7C]">
                    {exportProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-[#EEF4F5]">
                <div 
                  style={{ width: `${exportProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#0F6E7C] transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
