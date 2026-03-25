export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';

export interface AiIncidentInput {
  incidentId: string;
  location: string | null;
  region: string | null;
  importedFaultSeverity: number | null;
  eventTypes: string[];
  logFeatures: { feature: string; volume: number }[];
  resourceTypes: string[];
  severityTypesRaw: string[];
}

export interface IncidentAnalysisResult {
  category: string;
  suggestedInternalPriority: string;
  shortSummary: string;
  possibleCause: string;
  suggestedAction: string;
  confidence?: number;
  rawModel?: string;
}

export interface IncidentAnalysisProvider {
  analyzeIncident(input: AiIncidentInput): Promise<IncidentAnalysisResult>;
}
