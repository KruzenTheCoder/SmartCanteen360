import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@smartcanteen/database';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PosLineDto {
  @ApiPropertyOptional({ description: 'Retail product id (omit for ad-hoc line)' })
  @IsString()
  @IsOptional()
  retailProductId?: string;

  @ApiProperty() @IsString() label!: string;

  @ApiProperty({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CheckoutDto {
  @ApiPropertyOptional({ description: 'Employee id resolved from QR scan / lookup' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ type: [PosLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosLineDto)
  items!: PosLineDto[];

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;
}
