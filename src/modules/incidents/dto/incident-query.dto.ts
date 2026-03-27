import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { IncidentInternalStatus, ImportSourceSystem } from '@prisma/client';

export class IncidentQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Search keyword matching externalId, site code, or site name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: IncidentInternalStatus,
    description: 'Filter by internal status',
  })
  @IsOptional()
  @IsEnum(IncidentInternalStatus)
  internalStatus?: IncidentInternalStatus;

  @ApiPropertyOptional({
    description: 'Filter by external fault severity score',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  importedFaultSeverity?: number;

  @ApiPropertyOptional({ description: 'Filter by exact site UUID' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Filter by import job ID' })
  @IsOptional()
  @IsUUID()
  importJobId?: string;

  @ApiPropertyOptional({ enum: ImportSourceSystem })
  @IsOptional()
  @IsEnum(ImportSourceSystem)
  sourceSystem?: ImportSourceSystem;
}
