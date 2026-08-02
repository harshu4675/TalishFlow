import { VideoMetadata, ClipMetadata, WordTranscript, SubtitleStyle } from '../db/models.js';
import { getTranscriptForVideo } from './transcriptionService.js';

const SUBTITLE_THEMES: Record<string, SubtitleStyle> = {
  luxury: {
    theme: 'luxury',
    font: 'Manrope',
    color: '#F8FAFB',
    highlightColor: '#0F6E7C',
    position: 'bottom',
    burnedIn: true,
    fontSize: 24
  },
  neon: {
    theme: 'neon',
    font: 'Impact',
    color: '#00FFCC',
    highlightColor: '#FF0055',
    position: 'middle',
    burnedIn: true,
    fontSize: 32
  },
  classic: {
    theme: 'classic',
    font: 'Inter',
    color: '#FFFFFF',
    highlightColor: '#F59E0B',
    position: 'bottom',
    burnedIn: false,
    fontSize: 20
  },
  minimal: {
    theme: 'minimal',
    font: 'Montserrat',
    color: '#17232D',
    highlightColor: '#1E8FA0',
    position: 'top',
    burnedIn: false,
    fontSize: 18
  },
  bold: {
    theme: 'bold',
    font: 'Playfair Display',
    color: '#FFFFFF',
    highlightColor: '#EF4444',
    position: 'middle',
    burnedIn: true,
    fontSize: 28
  }
};

const VIRAL_HOOKS = [
  "This 1 change will double your results instantly... 🧠",
  "Why 99% of creators are completely wrong about this.",
  "The quiet secret that successful brands never tell you. 🤫",
  "If you are not doing this in 2026, you're falling behind.",
  "I was shocked when I discovered this hidden technique!",
];

const HASHTAG_BANKS = {
  educational: "#AI #artificialintelligence #techfuture #softwareengineering #autonomous #techtrends #innovation",
  luxury: "#luxury #luxurylifestyle #aesthetic #excellence #highstandards #success #quietluxury #craftsmanship",
  funny: "#comedy #funny #standupcomedy #humor #jokes #storytime #relatable #viralshorts",
  motivational: "#motivation #discipline #hustle #mindset #grindmode #morningroutine #focus #limits",
  storytelling: "#history #mystery #conspiracy #untoldstories #vatican #ancienthistory #knowledge"
};

export function generateAutoClips(video: VideoMetadata, count: number = 5): Omit<ClipMetadata, 'id' | 'createdAt' | 'updatedAt'>[] {
  const { transcriptText, words } = getTranscriptForVideo(video.title, video.duration);

  // Divide the transcript and words into `count` distinct highly engaging clips
  const totalDuration = video.duration;
  const clipDuration = Math.min(30, totalDuration / count);
  const clips: Omit<ClipMetadata, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  const lowerTitle = video.title.toLowerCase();
  let category: keyof typeof HASHTAG_BANKS = 'educational';
  if (lowerTitle.includes('luxury') || lowerTitle.includes('money')) category = 'luxury';
  else if (lowerTitle.includes('funny') || lowerTitle.includes('joke')) category = 'funny';
  else if (lowerTitle.includes('motivation') || lowerTitle.includes('gym')) category = 'motivational';
  else if (lowerTitle.includes('story') || lowerTitle.includes('history')) category = 'storytelling';

  for (let i = 0; i < count; i++) {
    const startTime = i * clipDuration;
    const endTime = Math.min(startTime + clipDuration, totalDuration);
    const duration = endTime - startTime;

    // Filter words belonging to this segment
    const segmentWords = words.filter(w => w.start >= startTime && w.end <= endTime);
    
    // Create a local timestamp array relative to the clip start
    const clipTranscript: WordTranscript[] = segmentWords.map(w => ({
      word: w.word,
      start: parseFloat((w.start - startTime).toFixed(2)),
      end: parseFloat((w.end - startTime).toFixed(2))
    }));

    const clipTitle = `Auto-Clip #${i + 1}: ${video.title.split(' ').slice(0, 3).join(' ')} Hook`;
    const themeName = Object.keys(SUBTITLE_THEMES)[i % Object.keys(SUBTITLE_THEMES).length];
    const subtitleStyle = SUBTITLE_THEMES[themeName];

    // Generate hook, captions, and titles
    const suggestedTitles = [
      `${VIRAL_HOOKS[i % VIRAL_HOOKS.length]}`,
      `How to dominate with ${video.title.split(' ')[0]}`,
      `The truth about ${video.title.split(' ').slice(0, 2).join(' ')} 💥`
    ];

    const caption = `🔥 ${suggestedTitles[0]}\n\n${transcriptText.split('.').slice(i, i + 2).join('.')}.\n\nWhat are your thoughts on this? Drop a comment below!👇`;
    const hashtags = HASHTAG_BANKS[category];

    clips.push({
      videoId: video.id,
      userId: video.userId,
      title: clipTitle,
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat(endTime.toFixed(2)),
      duration: parseFloat(duration.toFixed(2)),
      videoUrl: `/static/previews/preview_${i + 1}.mp4`, // Mock path for video stream
      subtitleStyle,
      transcript: clipTranscript,
      caption,
      hashtags,
      suggestedTitles,
      trackingType: i % 2 === 0 ? 'face' : 'motion',
      cropCoordinates: {
        x: 37.5, // perfect center crop for standard 16:9 video -> 9:16 vertical (width is 25%)
        y: 0,
        width: 25,
        height: 100
      },
      publishStatus: 'idle'
    });
  }

  return clips;
}
