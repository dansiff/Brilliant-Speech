import { StoryPage, Language, Difficulty } from "../types";
import { handleError, ErrorType } from "../utils/errorHandler";
import { extractJsonFromResponse } from "../utils/aiUtils";
import { toast } from "sonner";

export async function generateWordAudio(userId: string, word: string): Promise<string | undefined> {
  const localPath = `/sounds/words/${word.toLowerCase()}.mp3`;
  
  try {
    const checkLocal = await fetch(localPath, { method: 'HEAD' });
    if (checkLocal.ok) return localPath;
  } catch (e) {
    // Local file not found
  }

  try {
    const response = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text: word })
    });

    if (!response.ok) throw new Error("TTS failed");

    const data = await response.json();
    const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      if (atob(base64Audio.slice(0, 32)).includes('RIFF')) {
        return `data:audio/wav;base64,${base64Audio}`;
      }
      return pcmToWav(base64Audio, 24000);
    }
  } catch (error) {
    handleError(error, ErrorType.AI_API);
  }
  return undefined;
}

function pcmToWav(pcmBase64: string, sampleRate: number = 24000): string {
  const binary = atob(pcmBase64);
  const len = binary.length;
  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + len, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, len, true);
  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, binary.charCodeAt(i));
  }
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

async function generatePageImage(userId: string, text: string, topic: string): Promise<string | undefined> {
  try {
    const prompt = `A child-friendly, colorful, and simple illustration for a story page. Topic: ${topic} Scene: ${text} Style: Vibrant, clear, and engaging for kids. No text in the image.`;

    const response = await fetch('/api/ai/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, prompt })
    });

    if (!response.ok) throw new Error(`Story image request failed (${response.status}).`);

    const data = await response.json();
    const part = data.candidates?.[0]?.content?.parts?.find((item: any) => item.inlineData?.data);
    if (!part?.inlineData?.data) throw new Error('Story image response did not contain an image.');
    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error) {
    console.error('Story illustration generation failed; the local illustration will be used:', error);
    return undefined;
  }
}

export async function enrichStoryWithImages(userId: string, story: StoryPage[], topic: string): Promise<StoryPage[]> {
  let localFallbackCount = 0;
  const enrichedStory = await Promise.all(
    story.map(async (page) => {
      if (page.imageUrl && !page.imageUrl.includes('picsum.photos')) return page;
      if (page.imageUrl?.includes('picsum.photos')) {
        localFallbackCount += 1;
        return { ...page, imageUrl: undefined };
      }

      const imageUrl = await generatePageImage(userId, page.text, topic);
      if (!imageUrl) localFallbackCount += 1;
      return { ...page, imageUrl };
    })
  );

  if (localFallbackCount > 0) {
    toast.info(`Using built-in illustrations for ${localFallbackCount} story page${localFallbackCount === 1 ? '' : 's'}.`);
  }

  return enrichedStory;
}

export async function enrichStoryWithAudio(userId: string, story: StoryPage[]): Promise<StoryPage[]> {
  return await Promise.all(
    story.map(async (page) => {
      if (!page.interactiveWords) return page;
      const enrichedWords = await Promise.all(
        page.interactiveWords.map(async (word) => {
          if (word.audioUrl) return word;
          const audioUrl = await generateWordAudio(userId, word.word);
          return { ...word, audioUrl };
        })
      );
      return { ...page, interactiveWords: enrichedWords };
    })
  );
}

export async function generateStory(
  userId: string,
  topic: string,
  language: Language,
  difficulty: Difficulty
): Promise<{ title: string; description: string; story: StoryPage[] }> {
  const prompt = `Generate a short story for children for speech therapy. Topic: ${topic} Language: ${language === Language.ENGLISH ? "English" : "Spanish"} Difficulty: ${difficulty}
The story should have 3 to 5 pages. Each page should have:
1. text: A short sentence or two.
2. interactiveWords: A list of 1-3 key words from the text. For each word, provide a simple definition and an animation type ('bounce', 'shake', or 'pulse').

Return the result as a JSON object with:
- title: A catchy title for the story.
- description: A brief summary of the story.
- story: An array of StoryPage objects. Each object should have 'text' and 'interactiveWords'.`;

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      prompt,
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          story: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                interactiveWords: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      word: { type: "string" },
                      definition: { type: "string" },
                      animation: { type: "string", enum: ['bounce', 'shake', 'pulse'] }
                    },
                    required: ["word", "definition"]
                  }
                }
              },
              required: ["text"]
            }
          }
        },
        required: ["title", "description", "story"]
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to generate story");
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const result = extractJsonFromResponse(rawText);
  
  if (!result || !result.story) {
    throw new Error("Invalid story format returned from AI");
  }
  
  const storyWithImages = await enrichStoryWithImages(userId, result.story, topic);
  const storyWithAudio = await enrichStoryWithAudio(userId, storyWithImages);

  return { title: result.title, description: result.description, story: storyWithAudio };
}

export async function translateStoryPage(userId: string, text: string): Promise<string | undefined> {
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        prompt: `Translate the following children's story text into Spanish: "${text}"`,
        generationConfig: { responseMimeType: "text/plain" }
      })
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (error) {
    handleError(error, ErrorType.AI_API);
  }
  return undefined;
}
