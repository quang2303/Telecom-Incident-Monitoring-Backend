import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER_TOKEN } from './interfaces/incident-analysis-provider.interface';
import { MockAiProvider } from './providers/mock-ai.provider';

@Global()
@Module({})
export class AiModule {
  static forRoot(): DynamicModule {
    return {
      module: AiModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: AI_PROVIDER_TOKEN,
          useFactory: (configService: ConfigService) => {
            const providerName = configService.get<string>('AI_PROVIDER', 'mock');
            
            if (providerName.toLowerCase() === 'gemini') {
              const { GeminiAiProvider } = require('./providers/gemini-ai.provider');
              return new GeminiAiProvider();
            }
            
            return new MockAiProvider(); // Fallback to mock
          },
          inject: [ConfigService],
        },
      ],
      exports: [AI_PROVIDER_TOKEN],
    };
  }
}
