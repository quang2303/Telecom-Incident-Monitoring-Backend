import { Injectable } from '@nestjs/common';
import {
  IncidentAnalysisProvider,
  AiIncidentInput,
  IncidentAnalysisResult,
} from '../interfaces/incident-analysis-provider.interface';

@Injectable()
export class MockAiProvider implements IncidentAnalysisProvider {
  async analyzeIncident(input: AiIncidentInput): Promise<IncidentAnalysisResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // A simple mock logic based on fault severity
    const faultSeverity = input.importedFaultSeverity || 0;

    let priority = 'P3 - Low';
    let category = 'General Network Anomaly';
    let shortSummary = 'Routine log aggregation reported minor anomalies.';
    let possibleCause = 'Intermittent packet loss or routine resource cycling.';
    let suggestedAction = 'Monitor for exact correlation; no immediate field action required.';
    let confidence = 0.65;

    if (faultSeverity > 1) {
      priority = 'P1 - Critical';
      category = 'Severe Resource Failure';
      shortSummary = `Critical fault reported reaching severity ${faultSeverity} at location ${input.location || 'Unknown'}.`;
      possibleCause = 'Hardware degradation or major link failure.';
      suggestedAction = 'Dispatch field technician immediately and verify link status.';
      confidence = 0.92;
    } else if (faultSeverity === 1) {
      priority = 'P2 - High';
      category = 'Service Degradation';
      shortSummary = `Significant service degradation observed at ${input.location || 'Unknown'}.`;
      possibleCause = 'Congestion or partial link failure.';
      suggestedAction = 'Isolate the affected resource and reroute traffic if possible.';
      confidence = 0.8;
    }

    if (input.eventTypes.length > 5) {
      shortSummary += ' High volume of event ripples detected.';
    }

    return {
      category,
      suggestedInternalPriority: priority,
      shortSummary,
      possibleCause,
      suggestedAction,
      confidence,
      rawModel: JSON.stringify({
        model: 'mock-ai-v1',
        simulatedInputTokens: 120,
        simulatedOutputTokens: 50,
        reasoning: 'Heuristic-based Mock fallback',
      }),
    };
  }
}
