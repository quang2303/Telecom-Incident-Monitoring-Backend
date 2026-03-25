import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentInternalStatus, ImportSourceSystem } from '@prisma/client';

export class IncidentResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  externalIncidentId?: string;

  @ApiProperty({ enum: ImportSourceSystem })
  sourceSystem: ImportSourceSystem;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  importedFaultSeverity?: number;

  @ApiProperty({ enum: IncidentInternalStatus })
  internalStatus: IncidentInternalStatus;

  @ApiProperty()
  siteId: string;

  @ApiPropertyOptional()
  deviceId?: string;

  @ApiPropertyOptional()
  importJobId?: string;

  @ApiPropertyOptional()
  importedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class IncidentLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  incidentId: string;

  @ApiProperty()
  message: string;

  @ApiProperty()
  createdAt: Date;
}
