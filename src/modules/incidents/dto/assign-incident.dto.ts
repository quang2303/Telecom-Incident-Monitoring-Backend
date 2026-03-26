import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignIncidentDto {
  @ApiProperty({ description: 'The UUID of the TECHNICIAN to assign to this incident' })
  @IsUUID()
  assigneeId: string;
}
