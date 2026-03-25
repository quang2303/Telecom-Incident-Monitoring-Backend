import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DeviceResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiPropertyOptional()
  type: string | null;

  @Expose()
  @ApiPropertyOptional()
  vendor: string | null;

  @Expose()
  @ApiProperty()
  siteId: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<DeviceResponseDto>) {
    Object.assign(this, partial);
  }
}
