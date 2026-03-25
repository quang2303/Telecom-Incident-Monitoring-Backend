import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SiteResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  code: string;

  @Expose()
  @ApiPropertyOptional()
  externalCode: string | null;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiPropertyOptional()
  region: string | null;

  @Expose()
  @ApiPropertyOptional()
  address: string | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<SiteResponseDto>) {
    Object.assign(this, partial);
  }
}
