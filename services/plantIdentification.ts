import { PlantAnalysisResult } from '../types/plant';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are an expert Australian botanist specialising in spinifex grasses (Triodia and Spinifex species) and native Australian flora. Australia has over 60 species of Triodia and Spinifex — the spiny, hummock-forming grasses of arid and semi-arid Australia. You have deep knowledge of species distributions across regions including the Pilbara, Kimberley, Goldfields, Central Australia, Simpson Desert, Gulf Country, and Cape York.

When analysing a plant image, you must:
1. Determine if it is spinifex (Triodia or Spinifex genus — the spiny, hummock-forming grasses)
2. Return a ranked list of up to 3 most likely species, using any provided location to narrow down candidates from the 60+ species found across Australia
3. For each candidate, describe key identifying features visible in the photo
4. Explain how the provided location supports or limits each identification
5. Suggest what closer photo (leaf tip, resin, seed head, etc.) would help confirm the identification
6. Provide habitat, distribution, and land management context

Always return ONLY a valid JSON object with no surrounding text, markdown, or explanation.`;

function buildUserPrompt(location?: string): string {
  const locationLine = location
    ? `The photo was taken in: ${location}. Use this location to narrow down likely species from the 60+ Triodia and Spinifex species found across Australia.\n\n`
    : 'No location was provided — base your identification on visual features alone, and note the typical regions where each candidate species is found.\n\n';

  return `${locationLine}Analyse this plant image and return a JSON object with exactly this structure:

{
  "isSpinifex": boolean,
  "candidates": [
    {
      "scientificName": "e.g. Triodia pungens",
      "commonName": "e.g. Soft Spinifex",
      "confidence": "high" | "medium" | "low",
      "identifyingFeatures": ["feature visible in this photo", "another visible feature"],
      "locationContext": "How the location supports or limits this identification, or typical distribution if no location given",
      "furtherPhotoSuggestion": "What closer photo would help confirm (e.g. leaf tip, resin, seed head), or null if already confident"
    }
  ],
  "habitat": "General habitat and distribution notes for the most likely species",
  "landManagementNotes": "Notes on fire ecology, pastoral value, revegetation, or land management significance in Australia"
}

Rules:
- Return up to 3 candidates ranked by likelihood (most likely first)
- If the plant is not spinifex, still list the most likely non-spinifex species as candidates
- Confidence guide:
  - "high": Clear image, distinctive features clearly visible, confident identification
  - "medium": Reasonable identification but some uncertainty due to angle, lighting, or growth stage
  - "low": Poor image quality, unusual angle, ambiguous features, or plant not clearly visible

Return ONLY the JSON object. No markdown fences, no explanation.`;
}

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
  location?: string,
): Promise<PlantAnalysisResult> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'API key not configured. Please add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.',
    );
  }

  const mediaType = getMediaType(imageUri);
  const userPrompt = buildUserPrompt(location);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
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
              text: userPrompt,
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
    if (typeof result.isSpinifex !== 'boolean' || !Array.isArray(result.candidates) || result.candidates.length === 0) {
      throw new Error('Incomplete response received. Please try again.');
    }
    return result;
  } catch {
    throw new Error('Could not interpret the AI response. Please try again with a clearer photo.');
  }
}
