import { WordTranscript } from '../db/models.js';

interface PredefinedTranscript {
  titleKeywords: string[];
  tone: string;
  transcript: string;
}

const TEMPLATES: PredefinedTranscript[] = [
  {
    titleKeywords: ['ai', 'artificial', 'intelligence', 'tech', 'future', 'robot', 'code', 'chatgpt'],
    tone: 'educational',
    transcript: "Artificial intelligence is not just a tool; it's the next evolution of human capability. Within five years, the way we write software, design houses, and manage businesses will be completely autonomous. If you're not integrating AI workflows into your daily routine right now, you are falling behind. It's like refusing to use a computer in 1995. The future belongs to those who collaborate with machines to solve the hardest problems."
  },
  {
    titleKeywords: ['luxury', 'millionaire', 'wealth', 'money', 'success', 'business', 'rich', 'lifestyle'],
    tone: 'luxury',
    transcript: "True luxury is never about being loud. It's about quiet elegance, precision craftsmanship, and the art of restraint. The finest hotels, the custom tailored suits, the handmade Swiss timepieces—they don't shout for attention. They command it through sheer perfection. If you want to build a premium brand, focus on the details that 99% of people overlook. Excellence is the only currency that never depreciates."
  },
  {
    titleKeywords: ['comedy', 'roast', 'funny', 'joke', 'standup', 'laugh', 'people'],
    tone: 'funny',
    transcript: "I love how people say 'just follow your dreams.' Have you seen some of my dreams? Last night I was trying to explain tax brackets to a giraffe while wearing a suit made of cheese. If I followed that dream, I'd be in a high-security psychiatric ward, not on stage. Be practical. Follow your rent. Your dreams are just your brain's way of playing screen-savers while you charge your batteries."
  },
  {
    titleKeywords: ['motivation', 'hustle', 'discipline', 'gym', 'workout', 'grind', 'morning'],
    tone: 'motivational',
    transcript: "Discipline is doing what needs to be done, even when you hate every single second of it. Motivation is a feeling, and feelings are unreliable. They leave when you're tired, when you're cold, when you're sore. But discipline? Discipline wakes you up at 5:00 AM, puts on your running shoes, and pushes you out the door. Don't wait for the spark. Build the fire yourself."
  },
  {
    titleKeywords: ['story', 'history', 'mystery', 'cinematic', 'epic', 'world'],
    tone: 'storytelling',
    transcript: "Deep in the archives of the Vatican, there is a map drawn in 1513. It depicts the coast of Antarctica with perfect geological precision—hundreds of years before the continent was officially discovered. How did a Renaissance cartographer map ice-free landmasses buried under miles of glaciers? The answer lies in the lost knowledge of an era that history has entirely forgotten."
  }
];

export function getTranscriptForVideo(title: string, duration: number): { transcriptText: string; words: WordTranscript[] } {
  const lowerTitle = title.toLowerCase();
  let selected = TEMPLATES[0];

  for (const template of TEMPLATES) {
    if (template.titleKeywords.some(keyword => lowerTitle.includes(keyword))) {
      selected = template;
      break;
    }
  }

  // Fallback to random if none match
  if (!selected) {
    selected = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  }

  const rawWords = selected.transcript.split(/\s+/);
  const wordsCount = rawWords.length;
  
  // Distribute words over the video duration
  const timePerWord = Math.min(0.4, duration / wordsCount);
  
  const words: WordTranscript[] = rawWords.map((word, idx) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const start = idx * timePerWord;
    const end = start + timePerWord * 0.85;
    return {
      word: cleanWord,
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2))
    };
  });

  return {
    transcriptText: selected.transcript,
    words
  };
}
