import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { StockMovementType } from '@smartcanteen/database';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty() @IsString() sku!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional({ default: 'unit' }) @IsString() @IsOptional() unit?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() categoryId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() barcode?: string;
  @ApiPropertyOptional({ default: 0 }) @Type(() => Number) @IsNumber() @IsOptional() reorderLevel?: number;
  @ApiPropertyOptional({ default: 0 }) @Type(() => Number) @IsNumber() @IsOptional() unitCost?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class StockAdjustmentDto {
  @ApiProperty({ enum: StockMovementType }) @IsEnum(StockMovementType) type!: StockMovementType;
  @ApiProperty({ description: 'Signed quantity; negative reduces stock' })
  @Type(() => Number) @IsNumber() quantity!: number;
  @ApiPropertyOptional() @IsString() @IsOptional() note?: string;
}
