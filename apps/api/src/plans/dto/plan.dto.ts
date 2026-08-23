import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlanPriceDto {
  @IsInt()
  @IsIn([1, 3, 6, 12])
  durationMonths!: number;

  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  priceMinor!: number;
}

export class CreatePlanDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => PlanPriceDto)
  prices!: PlanPriceDto[];
}

export class UpdatePlanDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => PlanPriceDto)
  prices?: PlanPriceDto[];
}

export class PlanQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  enabled?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
