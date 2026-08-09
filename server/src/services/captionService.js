import { createError } from "../middleware/errorHandler.js";

const STYLE_INSTRUCTIONS = {
  professional: `Write a professional, authoritative caption. Use clear, confident language. No slang. Focus on value and credibility. End with a subtle call to action.`,
  educational: `Write an educational caption that teaches something. Start with a hook question or fact. Break down the concept simply. Encourage saves and follows for more learning content.`,
  storytelling: `Write a captivating story-driven caption. Open with a compelling moment or conflict. Build tension. Deliver a resolution or lesson. Make it personal and relatable.`,
  funny: `Write a funny, witty caption with humor that fits the content. Use irony, self-deprecation, or observational comedy. Keep it light and shareable. Add a punchline.`,
  luxury: `Write a premium, aspirational caption. Use elevated vocabulary. Evoke emotion and desire. Speak to identity and lifestyle. Short sentences. Confident tone. No exclamation marks.`,
  motivational: `Write a high-energy motivational caption. Start with a bold statement or challenge. Build momentum. End with an empowering call to action. Use short punchy sentences.`,
  minimal: `Write an ultra-minimal caption. Maximum 2 to 3 sentences. No filler words. Every word must earn its place. Confident and clean.`,
};

const LANGUAGE_INSTRUCTIONS = {
  en: "Write the caption in English.",
  hi: "Write the caption in Hindi using Devanagari script.",
  hinglish:
    "Write the caption in Hinglish, a natural mix of Hindi and English commonly used in Indian social media.",
  es: "Write the caption in Spanish.",
  fr: "Write the caption in French.",
  de: "Write the caption in German.",
};

const PLATFORM_INSTRUCTIONS = {
  youtube:
    "This caption is for a YouTube Short. Keep it under 200 words. Focus on driving engagement and watch time.",
  instagram:
    "This caption is for an Instagram Reel. Keep it under 150 words. Make the first line a strong hook since only the first line shows before the read more cutoff.",
  general:
    "This caption can be used across platforms. Keep it under 200 words.",
};

function buildCaptionPrompt({
  transcript,
  style,
  language,
  platform,
  keywords,
}) {
  const styleInstruction =
    STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.professional;
  const languageInstruction =
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;
  const platformInstruction =
    PLATFORM_INSTRUCTIONS[platform] || PLATFORM_INSTRUCTIONS.general;

  const keywordSection = keywords?.length
    ? `\n\nRelevant keywords extracted from the content: ${keywords.slice(0, 10).join(", ")}`
    : "";

  const transcriptSection = transcript
    ? `\n\nVideo transcript:\n${transcript.slice(0, 1500)}`
    : "";

  return `You are an expert social media content writer specializing in viral short-form video captions.

${styleInstruction}

${languageInstruction}

${platformInstruction}

Generate one complete caption for this video.${transcriptSection}${keywordSection}

Rules:
- Do not include hashtags in the caption body
- Do not add placeholder text like [your handle] or [link in bio]
- Write the caption as if you are the content creator
- Return only the caption text, nothing else`;
}

function buildTitlePrompt({ transcript, platform, keywords }) {
  const keywordSection = keywords?.length
    ? `\nKeywords: ${keywords.slice(0, 8).join(", ")}`
    : "";

  const transcriptSection = transcript
    ? `\nTranscript excerpt: ${transcript.slice(0, 800)}`
    : "";

  const platformMap = {
    youtube:
      "YouTube Short (max 100 characters, SEO optimized, uses curiosity gap or number)",
    shorts: "YouTube Short (max 70 characters, punchy, direct)",
    instagram:
      "Instagram Reel (max 80 characters, emotional hook, conversational)",
    seo: "SEO headline (max 120 characters, includes primary keyword, answers search intent)",
    clickbait:
      "Viral clickbait style title (max 90 characters, creates urgency or mystery without being dishonest)",
  };

  const targets = Object.entries(platformMap)
    .map(([key, desc]) => `${key}: ${desc}`)
    .join("\n");

  return `You are an expert video title copywriter who specializes in viral short-form content.

Generate titles for each of the following formats:${transcriptSection}${keywordSection}

Formats:
${targets}

Return a valid JSON object with this exact structure:
{
  "youtube": "title here",
  "shorts": "title here",
  "instagram": "title here",
  "seo": "title here",
  "clickbait": "title here"
}

Return only the JSON object, no explanation or markdown.`;
}

function buildHashtagPrompt({ transcript, keywords, category }) {
  const keywordSection = keywords?.length
    ? `\nKeywords: ${keywords.slice(0, 15).join(", ")}`
    : "";

  const transcriptSection = transcript
    ? `\nTranscript excerpt: ${transcript.slice(0, 600)}`
    : "";

  const categorySection = category ? `\nContent category: ${category}` : "";

  return `You are a social media hashtag strategist who specializes in viral short-form content discovery.

Generate a strategic mix of hashtags for this video content:${transcriptSection}${keywordSection}${categorySection}

Generate exactly 30 hashtags following this distribution:
- 5 extremely broad hashtags (100M+ posts) for maximum reach
- 10 moderately broad hashtags (10M to 100M posts) for good reach
- 10 niche specific hashtags (1M to 10M posts) for targeted reach  
- 5 highly specific hashtags (under 1M posts) for community discovery

Rules:
- Include the # symbol with each hashtag
- No spaces within hashtags
- Mix of single word and compound hashtags
- Relevant to the actual video content
- Include a mix of English hashtags and content-specific hashtags
- Return only a JSON array of hashtag strings, nothing else

Example format: ["#hashtag1", "#hashtag2", "#hashtag3"]`;
}

function buildKeywordExtractionPrompt(transcript) {
  return `Extract the most important keywords and topics from this video transcript.

Transcript: ${transcript.slice(0, 2000)}

Return a JSON array of 15 to 20 keywords and short phrases that best represent the content.
Focus on: main topics, named entities, key concepts, actions, and emotional themes.
Avoid: filler words, common words, and generic terms.

Return only a JSON array of strings. Example: ["keyword1", "key phrase 2", "topic 3"]`;
}

async function callOpenAI(prompt, options = {}) {
  const { maxTokens = 800, temperature = 0.75 } = options;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw createError(
      "OpenAI API key is not configured. Add OPENAI_API_KEY to your environment variables.",
      503,
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message || `OpenAI API error: ${response.status}`;
    throw createError(message, response.status === 429 ? 429 : 502);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function generateCaption({
  transcript,
  style = "professional",
  language = "en",
  platform = "general",
  keywords = [],
}) {
  const prompt = buildCaptionPrompt({
    transcript,
    style,
    language,
    platform,
    keywords,
  });
  const caption = await callOpenAI(prompt, {
    maxTokens: 400,
    temperature: 0.8,
  });
  return caption;
}

export async function generateTitles({ transcript, keywords = [] }) {
  const prompt = buildTitlePrompt({ transcript, keywords });
  const raw = await callOpenAI(prompt, { maxTokens: 400, temperature: 0.7 });

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      youtube: "Untitled YouTube Short",
      shorts: "Untitled Short",
      instagram: "Untitled Reel",
      seo: "Untitled Video",
      clickbait: "You Need to See This",
    };
  }
}

export async function generateHashtags({
  transcript,
  keywords = [],
  category = "",
}) {
  const prompt = buildHashtagPrompt({ transcript, keywords, category });
  const raw = await callOpenAI(prompt, { maxTokens: 600, temperature: 0.6 });

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");
    const hashtags = JSON.parse(jsonMatch[0]);
    return hashtags.filter(
      (tag) => typeof tag === "string" && tag.startsWith("#"),
    );
  } catch {
    return ["#shorts", "#viral", "#trending", "#fyp", "#video"];
  }
}

export async function extractKeywords(transcript) {
  if (!transcript || transcript.length < 50) return [];

  const prompt = buildKeywordExtractionPrompt(transcript);
  const raw = await callOpenAI(prompt, { maxTokens: 300, temperature: 0.4 });

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");
    const keywords = JSON.parse(jsonMatch[0]);
    return keywords.filter((k) => typeof k === "string").slice(0, 20);
  } catch {
    return [];
  }
}

export async function regenerateCaption({
  transcript,
  style,
  language,
  platform,
  keywords,
  feedback,
}) {
  const basePrompt = buildCaptionPrompt({
    transcript,
    style,
    language,
    platform,
    keywords,
  });

  const feedbackSection = feedback
    ? `\n\nThe previous caption was not satisfactory. User feedback: "${feedback}"\n\nPlease generate an improved version addressing this feedback.`
    : "\n\nGenerate a fresh alternative version with different phrasing and structure.";

  const caption = await callOpenAI(basePrompt + feedbackSection, {
    maxTokens: 400,
    temperature: 0.9,
  });

  return caption;
}
