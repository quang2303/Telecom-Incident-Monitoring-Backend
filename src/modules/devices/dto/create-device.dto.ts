import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'DEV-001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Main Router' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid-of-site' })
  @IsUUID()
  siteId: string;

  @ApiPropertyOptional({ example: 'Router' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'Cisco' })
  @IsString()
  @IsOptional()
  vendor?: string;
}
