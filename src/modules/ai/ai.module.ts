import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER_TOKEN } from './interfaces/incident-analysis-provider.interface';
import { MockAiProvider } from './providers/mock-ai.provider';
import { RagRetrievalService } from './services/rag-retrieval.service';

@Global()
@Module({})
export class AiModule {
  static forRoot(): DynamicModule {
    return {
      module: AiModule,
      imports: [ConfigModule],
      providers: [
        RagRetrievalService,
        {
          provide: AI_PROVIDER_TOKEN,
          useFactory: async (configService: ConfigService, ragService: RagRetrievalService) => {
            const providerName = configService.get<string>('AI_PROVIDER', 'mock');

            if (providerName.toLowerCase() === 'gemini') {
              const { GeminiAiProvider } = await import('./providers/gemini-ai.provider');
              return new GeminiAiProvider(ragService);
            }

            return new MockAiProvider(); // Fallback to mock
          },
          inject: [ConfigService, RagRetrievalService],
        },
      ],
      exports: [AI_PROVIDER_TOKEN, RagRetrievalService],
    };
  }
}
