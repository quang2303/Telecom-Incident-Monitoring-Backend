import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({ example: 'SITE-001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Main City Site' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'North' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ example: '123 Tech St' })
  @IsString()
  @IsOptional()
  address?: string;
}
