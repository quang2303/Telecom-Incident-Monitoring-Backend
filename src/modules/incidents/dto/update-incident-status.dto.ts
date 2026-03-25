import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IncidentInternalStatus } from '@prisma/client';

export class UpdateIncidentStatusDto {
  @ApiProperty({
    enum: IncidentInternalStatus,
    description: 'The new internal status to transition to',
  })
  @IsEnum(IncidentInternalStatus)
  status: IncidentInternalStatus;
}
