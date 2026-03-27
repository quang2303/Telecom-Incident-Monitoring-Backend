import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AiIncidentInput } from '../interfaces/incident-analysis-provider.interface';

export interface Runbook {
  id: string;
  category: string;
  faultCode: string;
  symptoms: string;
  possibleCauses: string[];
  resolutionSteps: string[];
  vendor: string;
  severity: string;
}

@Injectable()
export class RagRetrievalService implements OnModuleInit {
  private readonly logger = new Logger(RagRetrievalService.name);
  private runbooks: Runbook[] = [];

  onModuleInit() {
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase() {
    try {
      const filePath = path.join(process.cwd(), 'data', 'ai-runbooks.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        this.runbooks = JSON.parse(data);
        this.logger.log(
          `Successfully loaded ${this.runbooks.length} runbooks into in-memory RAG context.`,
        );
      } else {
        this.logger.warn(
          `Runbooks data file not found at ${filePath}. RAG retrieval will return empty.`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to load knowledge base: ${error.message}`, error.stack);
    }
  }

  public retrieveRelevantRunbooks(input: AiIncidentInput, topK = 2): Runbook[] {
    if (this.runbooks.length === 0) {
      return [];
    }

    // Extract searchable terms from the incident input
    const searchTerms = [
      ...input.eventTypes,
      ...input.logFeatures.map((f) => f.feature),
      ...input.resourceTypes,
      input.location || '',
    ]
      .filter((term) => term && term.trim().length > 0)
      .map((t) => t.toLowerCase());

    if (searchTerms.length === 0) {
      return [];
    }

    const scoredRunbooks = this.runbooks.map((runbook) => {
      let score = 0;
      const documentText =
        `${runbook.category} ${runbook.symptoms} ${runbook.possibleCauses.join(' ')} ${runbook.vendor}`.toLowerCase();

      for (const term of searchTerms) {
        if (documentText.includes(term)) {
          score += 1;
        }
      }

      // Bonus score if fault severity matches
      if (input.importedFaultSeverity !== undefined && input.importedFaultSeverity !== null) {
        if (input.importedFaultSeverity >= 2 && runbook.severity === 'CRITICAL') score += 0.5;
        if (input.importedFaultSeverity === 1 && runbook.severity === 'MAJOR') score += 0.5;
      }

      return { runbook, score };
    });

    return scoredRunbooks
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.runbook);
  }
}
