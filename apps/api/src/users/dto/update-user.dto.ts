import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName, UserStatus } from '@smartcanteen/database';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({ enum: RoleName, isArray: true })
  @IsArray()
  @IsEnum(RoleName, { each: true })
  @IsOptional()
  roles?: RoleName[];
}
