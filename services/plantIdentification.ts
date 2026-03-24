import { PlantAnalysisResult } from '../types/plant';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are an expert Australian botanist specialising in spinifex grasses (Triodia and Plectrachne species) and native Australian flora. You have deep knowledge of Australian ecosystems, arid and semi-arid environments, and land management practices.

When analysing a plant image, you must:
1. Determine if it is spinifex (any Triodia or Plectrachne species — the spiny, hummock-forming grasses of arid and semi-arid Australia)
2. Identify the most likely species or type if possible
3. List its distinctive visual features
4. Describe its Australian habitat and distribution
5. Provide relevant land management context (fire ecology, pastoral impacts, revegetation value, etc.)

Always return ONLY a valid JSON object with no surrounding text, markdown, or explanation.`;

const USER_PROMPT = `Analyse this plant image and return a JSON object with exactly this structure:

{
  "isSpinifex": boolean,
  "speciesName": "Most likely species name (e.g., Triodia pungens, Triodia basedowii) or best match if not spinifex",
  "confidence": "high" | "medium" | "low",
  "identifyingFeatures": ["feature 1", "feature 2", "feature 3"],
  "habitat": "Description of typical Australian habitat and geographic distribution",
  "landManagementNotes": "Notes on fire ecology, pastoral value, revegetation, or land management significance in Australia",
  "alternativeSuggestion": "If NOT spinifex: brief description of what this plant might be and why. Set to null if it IS spinifex."
}

Confidence guide:
- "high": Clear image, distinctive features clearly visible, confident identification
- "medium": Reasonable identification but some uncertainty due to angle, lighting, or growth stage
- "low": Poor image quality, unusual angle, ambiguous features, or plant not clearly visible

Return ONLY the JSON object. No markdown fences, no explanation.`;

function getMediaType(uri: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function identifyPlant(
  base64Image: string,
  imageUri: string,
): Promise<PlantAnalysisResult> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'API key not configured. Please add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.',
    );
  }

  const mediaType = getMediaType(imageUri);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: USER_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try {
      const errorData = await response.json();
      message = errorData?.error?.message ?? message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  const data = await response.json();
  const rawText: string = data?.content?.[0]?.text ?? '';

  // Strip any markdown code fences if Claude wrapped the JSON
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse plant identification response. Please try again.');
  }

  try {
    const result = JSON.parse(jsonMatch[0]) as PlantAnalysisResult;
    // Ensure required fields exist
    if (typeof result.isSpinifex !== 'boolean' || !result.speciesName) {
      throw new Error('Incomplete response received. Please try again.');
    }
    return result;
  } catch {
    throw new Error('Could not interpret the AI response. Please try again with a clearer photo.');
  }
}
