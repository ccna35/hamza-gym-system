import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum SubscriptionStateFilter {
  NONE = 'NONE',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class MemberQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(150)
  search?: string;
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  archived = false;
  @IsOptional() @IsEnum(SubscriptionStateFilter) subscriptionState?: SubscriptionStateFilter;
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  hasDebt?: boolean;
}
