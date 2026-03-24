export type Confidence = 'high' | 'medium' | 'low';

export interface SpeciesCandidate {
  scientificName: string;
  commonName: string;
  confidence: Confidence;
  identifyingFeatures: string[];
  locationContext: string;
  furtherPhotoSuggestion: string | null;
}

export interface PlantAnalysisResult {
  isSpinifex: boolean;
  candidates: SpeciesCandidate[];
  habitat: string;
  landManagementNotes: string;
}
