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
  console.log('[SpinifexID] identifyPlant() called');
  console.log('[SpinifexID] imageUri:', imageUri);
  console.log('[SpinifexID] location:', location ?? '(none)');
  console.log('[SpinifexID] base64 length:', base64Image?.length ?? 0);

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  console.log('[SpinifexID] API key present:', !!apiKey);

  if (!apiKey) {
    throw new Error(
      'API key not configured. Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your environment variables.',
    );
  }

  const mediaType = getMediaType(imageUri);
  console.log('[SpinifexID] media type:', mediaType);

  const userPrompt = buildUserPrompt(location);
  console.log('[SpinifexID] sending request to:', ANTHROPIC_API_URL, 'model:', MODEL);

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required for direct browser calls (e.g. when running on web/Vercel)
        'anthropic-dangerous-direct-browser-access': 'true',
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
  } catch (networkError) {
    console.error('[SpinifexID] Network error (possible CORS block):', networkError);
    throw new Error(
      `Network error — could not reach the API. If running on web, check CORS settings. (${networkError instanceof Error ? networkError.message : String(networkError)})`,
    );
  }

  console.log('[SpinifexID] response status:', response.status, response.statusText);

  if (!response.ok) {
    let message = `API request failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      console.error('[SpinifexID] API error body:', JSON.stringify(errorData));
      message = errorData?.error?.message ?? message;
    } catch {
      // ignore JSON parse errors on error body
    }
    throw new Error(message);
  }

  const data = await response.json();
  console.log('[SpinifexID] response content type:', data?.content?.[0]?.type);
  const rawText: string = data?.content?.[0]?.text ?? '';
  console.log('[SpinifexID] raw text (first 300 chars):', rawText.substring(0, 300));

  // Strip any markdown code fences if Claude wrapped the JSON
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[SpinifexID] no JSON object found in response');
    throw new Error(
      `Could not parse plant identification response. Raw response: "${rawText.substring(0, 200)}". Please try again.`,
    );
  }

  let result: PlantAnalysisResult;
  try {
    result = JSON.parse(jsonMatch[0]) as PlantAnalysisResult;
  } catch (parseError) {
    console.error('[SpinifexID] JSON parse error:', parseError);
    console.error('[SpinifexID] attempted to parse:', jsonMatch[0].substring(0, 300));
    throw new Error('Could not parse JSON response from AI. Please try again.');
  }

  console.log('[SpinifexID] parsed result — isSpinifex:', result.isSpinifex, 'candidates:', result.candidates?.length);

  if (typeof result.isSpinifex !== 'boolean') {
    throw new Error(`Response missing isSpinifex field. Got: ${JSON.stringify(result).substring(0, 200)}`);
  }
  if (!Array.isArray(result.candidates) || result.candidates.length === 0) {
    throw new Error(`Response missing candidates array. Got: ${JSON.stringify(result).substring(0, 200)}`);
  }

  console.log('[SpinifexID] identification complete — top match:', result.candidates[0]?.scientificName);
  return result;
}
