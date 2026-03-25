import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { IncidentInternalStatus, ImportSourceSystem } from '@prisma/client';

export class DashboardFilterDto {
  @ApiPropertyOptional({ description: 'Filter by specific site UUID' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific import job UUID' })
  @IsOptional()
  @IsUUID()
  importJobId?: string;

  @ApiPropertyOptional({
    description: 'Filter by internal status',
    enum: IncidentInternalStatus,
  })
  @IsOptional()
  @IsEnum(IncidentInternalStatus)
  internalStatus?: IncidentInternalStatus;

  @ApiPropertyOptional({
    description: 'Filter by source system',
    enum: ImportSourceSystem,
  })
  @IsOptional()
  @IsEnum(ImportSourceSystem)
  sourceSystem?: ImportSourceSystem;
}
