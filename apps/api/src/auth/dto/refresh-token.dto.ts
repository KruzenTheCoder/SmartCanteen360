import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token (can also be sent via HTTP-only cookie)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
