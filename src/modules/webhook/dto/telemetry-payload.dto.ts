import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TelemetryLogFeatureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  feature: string;

  @ApiProperty()
  @IsNumber()
  volume: number;
}

export class TelemetryPayloadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty()
  @IsNumber()
  faultSeverity: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  eventTypes: string[];

  @ApiPropertyOptional({ type: [TelemetryLogFeatureDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryLogFeatureDto)
  logs?: TelemetryLogFeatureDto[];
}
