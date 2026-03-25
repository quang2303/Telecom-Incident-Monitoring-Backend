import { ApiProperty } from '@nestjs/swagger';

export class IncidentAnalysisResponseDto {
  @ApiProperty({ description: 'Categorization of the incident by AI' })
  category: string;

  @ApiProperty({ description: 'Suggested priority level for internal teams' })
  suggestedInternalPriority: string;

  @ApiProperty({ description: 'A short, readable summary of the incident features' })
  shortSummary: string;

  @ApiProperty({ description: 'Hypothesized cause based on features' })
  possibleCause: string;

  @ApiProperty({ description: 'Actionable next steps for operations' })
  suggestedAction: string;

  @ApiProperty({ description: 'Confidence score (if provided by AI)', required: false })
  confidence?: number;

  @ApiProperty({ description: 'Raw model output for debugging', required: false })
  rawModel?: string;

  @ApiProperty({ description: 'Timestamp of the analysis' })
  createdAt: Date;
}
