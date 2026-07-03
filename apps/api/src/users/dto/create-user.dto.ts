import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '@smartcanteen/database';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  password!: string;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Tenant id (Super Admin only)' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiProperty({ enum: RoleName, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RoleName, { each: true })
  roles!: RoleName[];
}
