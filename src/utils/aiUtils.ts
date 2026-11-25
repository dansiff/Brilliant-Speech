/**
 * Utility to extract JSON from a string that might contain markdown blocks.
 */
export function extractJsonFromResponse(text: string): any {
  if (!text) return null;
  
  try {
    // Try cleaning markdown if present
    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.warn("Direct JSON parse failed, trying regex extraction", error);
    
    // Fallback: try to find anything between { and }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        console.error("Regex JSON extraction also failed", innerError);
      }
    }
    
    throw new Error("Could not parse AI response as JSON");
  }
}

/**
 * Validates that an object has required speech analysis properties with defaults.
 */
export function validateSpeechAnalysis(data: any) {
  return {
    score: typeof data.score === 'number' ? data.score : 0,
    accuracy: typeof data.accuracy === 'number' ? data.accuracy : 0,
    fluency: typeof data.fluency === 'number' ? data.fluency : 0,
    pronunciation: typeof data.pronunciation === 'number' ? data.pronunciation : 0,
    feedback: typeof data.feedback === 'string' ? data.feedback : "I heard you! Let's keep practicing.",
    isPerfect: !!data.isPerfect || (typeof data.score === 'number' && data.score >= 95)
  };
}
