import React, { useState, useEffect } from 'react';
import { 
  Plus, Youtube, Instagram, ShieldAlert, BarChart3, HardDrive, Video, 
  Settings, UserCheck, AlertCircle, FileVideo, ChevronRight, Upload, 
  Sparkles, RefreshCw, CheckCircle, ExternalLink, Calendar, Trash2 
} from 'lucide-react';
import { VideoMetadata, AnalyticsData } from '../types.js';

interface DashboardProps {
  user: { id: string; name: string; email: string };
  onNavigateToStudio: (videoId: string) => void;
  onNavigateToTab: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function Dashboard({ user, onNavigateToStudio, onNavigateToTab, showToast }: DashboardProps) {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [oauthStatus, setOauthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Upload/Import modal state
  const [showModal, setShowModal] = useState(false);
  const [importSource, setImportSource] = useState<'upload' | 'youtube'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [clipCount, setClipCount] = useState('5');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Dashboard State
  const fetchDashboardData = async () => {
    try {
      const [vRes, aRes, oRes] = await Promise.all([
        fetch('/api/videos'),
        fetch('/api/analytics'),
        fetch('/api/oauth/status')
      ]);

      if (vRes.ok) setVideos(await vRes.json());
      if (aRes.ok) setAnalytics(await aRes.json());
      if (oRes.ok) setOauthStatus(await oRes.json());
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll for status updates every 4 seconds in case videos are processing
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (importSource === 'youtube') {
        const res = await fetch('/api/videos/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeUrl, clipCount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to import YouTube video');
        showToast(data.message, 'success');
      } else {
        if (!uploadFile) throw new Error('Please select an MP4, MOV, MKV, or AVI video file.');
        const formData = new FormData();
        formData.append('video', uploadFile);
        formData.append('clipCount', clipCount);

        const res = await fetch('/api/videos/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload video file');
        showToast(data.message, 'success');
      }

      // Reset & Refresh
      setYoutubeUrl('');
      setUploadFile(null);
      setShowModal(false);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Processing failed.');
      showToast(err.message || 'Processing failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const [error, setError] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-[#E5ECEF]">
        <div>
          <h1 className="font-manrope font-extrabold text-3xl text-[#17232D] tracking-tight">
            Creator Dashboard
          </h1>
          <p className="text-[#68737D] text-sm mt-1">
            Welcome back, <span className="font-bold text-[#17232D]">{user.name}</span>. Check your social reach and edit active projects.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0F6E7C] hover:bg-[#0A5560] text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#0F6E7C]/10 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus size={16} /> New Reframing Project
        </button>
      </div>

      {loading ? (
        // Premium Loading skeleton
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[#EEF4F5] rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-[#EEF4F5] rounded-2xl" />
            <div className="h-96 bg-[#EEF4F5] rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-white border border-[#E5ECEF] p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-[#68737D] font-bold uppercase tracking-wider">Total Views</span>
                  <h3 className="text-2xl font-extrabold font-manrope text-[#17232D] mt-2">
                    {analytics?.summary.totalViews.toLocaleString() || '0'}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] flex items-center justify-center text-[#0F6E7C]">
                  <BarChart3 size={20} />
                </div>
              </div>
              {analytics?.summary.viewsGrowth && analytics.summary.viewsGrowth > 0 ? (
                <div className="text-xs text-[#22C55E] font-bold mt-4 flex items-center gap-1">
                  ↑ +{analytics.summary.viewsGrowth}% <span className="text-[#68737D] font-medium">this week</span>
                </div>
              ) : (
                <div className="text-xs text-[#68737D] font-medium mt-4">Connect platforms to view reach</div>
              )}
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white border border-[#E5ECEF] p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-[#68737D] font-bold uppercase tracking-wider">Active Audience</span>
                  <h3 className="text-2xl font-extrabold font-manrope text-[#17232D] mt-2">
                    {analytics?.summary.activeAudience.toLocaleString() || '0'}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] flex items-center justify-center text-[#0F6E7C]">
                  <UserCheck size={20} />
                </div>
              </div>
              {analytics?.summary.audienceGrowth && analytics.summary.audienceGrowth > 0 ? (
                <div className="text-xs text-[#22C55E] font-bold mt-4 flex items-center gap-1">
                  ↑ +{analytics.summary.audienceGrowth}% <span className="text-[#68737D] font-medium">organic expansion</span>
                </div>
              ) : (
                <div className="text-xs text-[#68737D] font-medium mt-4">Growth index calculation pending</div>
              )}
            </div>

            {/* Stat Card 3 */}
            <div className="bg-white border border-[#E5ECEF] p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-[#68737D] font-bold uppercase tracking-wider">Cloud Storage</span>
                  <h3 className="text-2xl font-extrabold font-manrope text-[#17232D] mt-2">
                    {analytics?.summary.storageUsedMB ? `${analytics.summary.storageUsedMB} MB` : '0 MB'}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] flex items-center justify-center text-[#0F6E7C]">
                  <HardDrive size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-[#EEF4F5] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#0F6E7C] h-full rounded-full transition-all"
                    style={{ width: `${analytics?.summary.storagePercentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#68737D] mt-1.5 font-semibold">
                  <span>{analytics?.summary.storagePercentage || '0'}% Used</span>
                  <span>Auto-cleaned every 24 hrs</span>
                </div>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-white border border-[#E5ECEF] p-6 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-[#68737D] font-bold uppercase tracking-wider">Active Platforms</span>
                  <h3 className="text-2xl font-extrabold font-manrope text-[#17232D] mt-2">
                    {analytics?.summary.connectedPlatforms || '0'} / 2
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EEF4F5] flex items-center justify-center text-[#0F6E7C]">
                  <Video size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4">
                <div className={`w-2 h-2 rounded-full ${oauthStatus?.youtube?.connected ? 'bg-[#22C55E]' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68737D] mr-2">YT Shorts</span>
                <div className={`w-2 h-2 rounded-full ${oauthStatus?.instagram?.connected ? 'bg-[#22C55E]' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#68737D]">IG Reels</span>
              </div>
            </div>
          </div>

          {/* Connected Accounts Warning bar */}
          {oauthStatus && (!oauthStatus.youtube?.connected || !oauthStatus.instagram?.connected) && (
            <div className="bg-white border border-[#E5ECEF] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start md:items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={20} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#17232D]">Expand Your Distribution Pipelines</h4>
                  <p className="text-[#68737D] text-xs mt-0.5">
                    Connect your YouTube and Instagram accounts to publish 9:16 Shorts and Reels automatically with zero formatting errors.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('connected-accounts')}
                className="text-xs font-bold text-[#0F6E7C] hover:text-[#0A5560] border border-[#0F6E7C]/20 px-4 py-2 rounded-lg hover:bg-[#EEF4F5] transition-all flex items-center gap-1 self-start md:self-auto cursor-pointer"
              >
                Connect Platforms <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Central Grid: Projects & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Reframing Projects */}
            <div className="lg:col-span-2 bg-white border border-[#E5ECEF] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E5ECEF]">
                <h3 className="font-manrope font-bold text-lg text-[#17232D]">Active Projects</h3>
                <span className="text-xs bg-[#EEF4F5] text-[#0F6E7C] font-bold px-2.5 py-1 rounded-full">
                  {videos.length} uploaded
                </span>
              </div>

              {videos.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-[#EEF4F5] text-[#68737D] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileVideo size={30} />
                  </div>
                  <h4 className="text-sm font-bold text-[#17232D]">No projects found</h4>
                  <p className="text-[#68737D] text-xs mt-1 max-w-xs mx-auto">
                    Paste a YouTube link or upload a local MP4 video file to start auto-detecting viral clips.
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-6 bg-[#EEF4F5] text-[#0F6E7C] hover:bg-[#0F6E7C] hover:text-white border border-[#0F6E7C]/10 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Import Your First Video
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((vid) => (
                    <div 
                      key={vid.id} 
                      className="border border-[#E5ECEF] hover:border-[#0F6E7C]/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-20 aspect-video rounded-lg bg-slate-900 overflow-hidden flex-shrink-0">
                          <img 
                            src={vid.thumbnail} 
                            alt={vid.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] font-bold text-white px-1 py-0.5 rounded">
                            {Math.floor(vid.duration / 60)}:{(vid.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-[#17232D] truncate max-w-[280px] md:max-w-md">{vid.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#68737D]">
                              Source: {vid.source === 'youtube' ? 'YouTube URL' : 'File Upload'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px] text-[#68737D] font-medium">
                              {new Date(vid.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                        {vid.status === 'processing' ? (
                          <div className="flex items-center gap-2 bg-[#EEF4F5] text-[#0F6E7C] px-3.5 py-1.5 rounded-lg text-xs font-bold border border-[#0F6E7C]/10 animate-pulse">
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Auto-Clipping...</span>
                          </div>
                        ) : vid.status === 'failed' ? (
                          <div className="flex items-center gap-1 bg-red-50 text-[#EF4444] px-3.5 py-1.5 rounded-lg text-xs font-bold border border-red-100">
                            <AlertCircle size={12} />
                            <span>Analysis failed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onNavigateToStudio(vid.id)}
                            className="bg-[#0F6E7C]/10 hover:bg-[#0F6E7C] hover:text-white text-[#0F6E7C] font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                          >
                            Enter Studio <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Reach Charts Component (Beautiful Custom Canvas/SVG for luxury styling & compatibility) */}
            <div className="bg-white border border-[#E5ECEF] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-manrope font-bold text-lg text-[#17232D] mb-1">Weekly Reach Trend</h3>
                <p className="text-[#68737D] text-xs">Aggregated statistics across connected channels</p>
              </div>

              {analytics && (analytics.summary.totalViews > 0) ? (
                <div className="my-6">
                  {/* Custom SVG line chart to ensure absolute CSS control and no external canvas render lag */}
                  <svg viewBox="0 0 300 150" className="w-full h-auto">
                    {/* Gridlines */}
                    <line x1="20" y1="20" x2="280" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                    <line x1="20" y1="60" x2="280" y2="60" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                    <line x1="20" y1="100" x2="280" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                    <line x1="20" y1="130" x2="280" y2="130" stroke="#E2E8F0" strokeWidth="1" />

                    {/* YouTube Line - Gold-Primary Accent */}
                    <path
                      d="M 20 120 L 63 105 L 106 95 L 149 80 L 192 65 L 235 45 L 278 25"
                      fill="none"
                      stroke="#0F6E7C"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Instagram Line - Cyan Accent */}
                    <path
                      d="M 20 125 L 63 115 L 106 102 L 149 92 L 192 82 L 235 68 L 278 52"
                      fill="none"
                      stroke="#1E8FA0"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="4"
                    />

                    {/* Chart Labels */}
                    <text x="20" y="145" fill="#94A3B8" fontSize="8" fontWeight="bold">Mon</text>
                    <text x="106" y="145" fill="#94A3B8" fontSize="8" fontWeight="bold">Wed</text>
                    <text x="192" y="145" fill="#94A3B8" fontSize="8" fontWeight="bold">Fri</text>
                    <text x="260" y="145" fill="#94A3B8" fontSize="8" fontWeight="bold">Sun</text>
                  </svg>

                  <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold text-[#17232D]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1.5 rounded-full bg-[#0F6E7C]" /> YouTube Shorts
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1.5 rounded-full bg-[#1E8FA0]" style={{ border: '1px dashed #1E8FA0' }} /> IG Reels
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#68737D] border border-dashed border-[#E5ECEF] rounded-xl my-6 flex flex-col items-center justify-center gap-2">
                  <AlertCircle size={24} className="text-[#68737D]" />
                  <span>No social data points tracked</span>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5ECEF] text-center">
                <p className="text-[10px] text-[#68737D] font-bold uppercase tracking-wider">
                  Data updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#17232D]/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E5ECEF] w-full max-w-lg p-8 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#68737D] hover:text-[#17232D] p-1.5 rounded-lg hover:bg-[#EEF4F5] transition-all"
            >
              ✕
            </button>

            <div className="mb-6 flex items-center gap-2.5">
              <span className="w-10 h-10 bg-[#EEF4F5] text-[#0F6E7C] rounded-xl flex items-center justify-center shadow-inner">
                <Sparkles size={20} />
              </span>
              <div>
                <h3 className="font-manrope font-extrabold text-xl text-[#17232D]">Create New Reframing Project</h3>
                <p className="text-[#68737D] text-xs mt-0.5">Let TalishFlow detect high-engagement momentos</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[#EF4444] text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-6">
              {/* Import Source Choice tabs */}
              <div className="grid grid-cols-2 p-1 bg-[#EEF4F5] rounded-xl border border-[#E5ECEF]">
                <button
                  type="button"
                  onClick={() => setImportSource('youtube')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${importSource === 'youtube' ? 'bg-white text-[#17232D] shadow-sm' : 'text-[#68737D] hover:text-[#17232D]'}`}
                >
                  YouTube Video Link
                </button>
                <button
                  type="button"
                  onClick={() => setImportSource('upload')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${importSource === 'upload' ? 'bg-white text-[#17232D] shadow-sm' : 'text-[#68737D] hover:text-[#17232D]'}`}
                >
                  Upload Local File
                </button>
              </div>

              {/* Source Fields */}
              {importSource === 'youtube' ? (
                <div>
                  <label className="block text-xs font-bold text-[#17232D] mb-1.5">Paste YouTube Video URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg focus:outline-none focus:border-[#0F6E7C] focus:bg-white transition-all text-[#17232D]"
                  />
                  <p className="text-[10px] text-[#68737D] mt-1.5 font-medium leading-normal">
                    Supports public YouTube links, automatically grabbing metadata and rendering high-fidelity templates.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#17232D] mb-1.5">Choose Local Video File</label>
                  <div className="border-2 border-dashed border-[#E5ECEF] rounded-xl p-8 text-center bg-[#F8FAFB] hover:border-[#0F6E7C]/40 transition-colors">
                    <input
                      type="file"
                      id="video-file-upload"
                      accept=".mp4,.mov,.mkv,.avi"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                    />
                    <label htmlFor="video-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload size={32} className="text-[#68737D] mb-1" />
                      <span className="text-xs font-bold text-[#17232D]">
                        {uploadFile ? uploadFile.name : 'Drag & drop or browse your files'}
                      </span>
                      <span className="text-[10px] text-[#68737D] font-medium">
                        Supported: MP4, MOV, MKV, AVI (Max 100MB)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Settings Choice */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#E5ECEF] pt-4">
                <div>
                  <label className="block text-xs font-bold text-[#17232D] mb-1.5">Moment Count Target</label>
                  <select
                    value={clipCount}
                    onChange={(e) => setClipCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg focus:outline-none text-[#17232D]"
                  >
                    <option value="3">Top 3 Viral Clips</option>
                    <option value="5">Top 5 Viral Clips</option>
                    <option value="10">Top 10 Viral Clips</option>
                    <option value="20">Top 20 Viral Clips</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17232D] mb-1.5">Face-Tracking Cropping</label>
                  <div className="w-full px-3 py-2 text-xs bg-[#F8FAFB] border border-[#E5ECEF] rounded-lg text-slate-500 font-semibold flex items-center gap-1 bg-[#EEF4F5] select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Auto OpenCV Active
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0F6E7C] hover:bg-[#0A5560] text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0F6E7C]/10 active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Processing Media Engine...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Clip Moments</span>
                    <Sparkles size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
