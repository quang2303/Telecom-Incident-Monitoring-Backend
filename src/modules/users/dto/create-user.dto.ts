import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'operatorUser' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.OPERATOR })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'North Region', description: 'Applicable for TECHNICIAN role' })
  @IsString()
  @IsOptional()
  region?: string;
}
