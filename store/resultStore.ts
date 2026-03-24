import { PlantAnalysisResult } from '../types/plant';

interface ResultState {
  result: PlantAnalysisResult | null;
  imageUri: string | null;
}

const state: ResultState = {
  result: null,
  imageUri: null,
};

export function setAnalysisResult(result: PlantAnalysisResult, imageUri: string): void {
  state.result = result;
  state.imageUri = imageUri;
}

export function getAnalysisResult(): ResultState {
  return { ...state };
}

export function clearAnalysisResult(): void {
  state.result = null;
  state.imageUri = null;
}
