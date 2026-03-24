import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token received during login or previous refresh' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
