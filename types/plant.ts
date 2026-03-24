export type Confidence = 'high' | 'medium' | 'low';

export interface PlantAnalysisResult {
  isSpinifex: boolean;
  speciesName: string;
  confidence: Confidence;
  identifyingFeatures: string[];
  habitat: string;
  landManagementNotes: string;
  alternativeSuggestion: string | null;
}
