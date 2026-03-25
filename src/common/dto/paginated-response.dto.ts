import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: () => PaginatedMetaDto })
  meta: PaginatedMetaDto;

  constructor(data: T[], meta: PaginatedMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
