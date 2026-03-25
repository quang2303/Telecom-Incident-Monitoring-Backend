import { ApiProperty } from '@nestjs/swagger';
import { ImportJobStatus, ImportSourceSystem } from '@prisma/client';

export class ImportJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ImportSourceSystem })
  sourceSystem: ImportSourceSystem;

  @ApiProperty({ enum: ImportJobStatus })
  status: ImportJobStatus;

  @ApiProperty()
  totalRecords: number;

  @ApiProperty({ required: false, nullable: true })
  errorMessage?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
