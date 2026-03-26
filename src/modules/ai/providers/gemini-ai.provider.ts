import { Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IncidentAnalysisProvider,
  AiIncidentInput,
  IncidentAnalysisResult,
} from '../interfaces/incident-analysis-provider.interface';

export class GeminiAiProvider implements IncidentAnalysisProvider {
  private readonly logger = new Logger(GeminiAiProvider.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // User requested the fast flash version
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async analyzeIncident(input: AiIncidentInput): Promise<IncidentAnalysisResult> {
    this.logger.log(`Analyzing incident ${input.incidentId} using Gemini 2.5 Flash...`);

    const prompt = this.buildPrompt(input);

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON from markdown if Gemini includes code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonStr) as IncidentAnalysisResult;

      return {
        category: parsed.category || 'Unknown',
        suggestedInternalPriority: parsed.suggestedInternalPriority || 'MEDIUM',
        shortSummary: parsed.shortSummary || 'No summary provided',
        possibleCause: parsed.possibleCause || 'Under investigation',
        suggestedAction: parsed.suggestedAction || 'Please manually inspect',
        confidence: parsed.confidence || 0.8,
        rawModel: 'gemini-2.5-flash',
      };
    } catch (error) {
      this.logger.error(`Gemini analysis failed: ${error.message}`, error.stack);
      throw new Error('Failed to analyze incident with Gemini Provider');
    }
  }

  private buildPrompt(input: AiIncidentInput): string {
    return `
You are an expert telecom network operations center (NOC) engineer assistant.
Analyze the following raw incident attributes and provide a structured JSON diagnosis.

Context:
- Incident ID: ${input.incidentId}
- Location: ${input.location || 'Unknown'}
- Region: ${input.region || 'Unknown'}
- Imported Fault Severity (0, 1, or 2): ${input.importedFaultSeverity ?? 'Unknown'}
- Log Features & Volumes: ${input.logFeatures.map((f) => `${f.feature} (Vol: ${f.volume})`).join(', ') || 'None'}
- Event Types: ${input.eventTypes.join(', ') || 'None'}
- Resource Types: ${input.resourceTypes.join(', ') || 'None'}
- Raw Severity Types: ${input.severityTypesRaw.join(', ') || 'None'}

Return ONLY a single valid JSON object with the following keys exactly:
- "category": string (e.g., "Power Failure", "Network Congestion", "Hardware Issue")
- "suggestedInternalPriority": string ("CRITICAL", "HIGH", "MEDIUM", "LOW")
- "shortSummary": string (A 1-2 sentence human-readable summary of what likely happened)
- "possibleCause": string (Explanation of the root cause based on log features and events)
- "suggestedAction": string (Recommended next step for the field engineer or NOC team)
- "confidence": number (A value between 0.0 and 1.0 indicating your confidence in this analysis)

Do not wrap the JSON in markdown blocks unless strictly necessary. Do not include any other text except the JSON object.
`;
  }
}
