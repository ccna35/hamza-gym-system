import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class InitialPaymentDto {
  @IsInt() @Min(1) @Max(Number.MAX_SAFE_INTEGER) amountMinor!: number;
  @Matches(datePattern) paymentDate!: string;
}

export class CreateSubscriptionDto {
  @IsUUID() planId!: string;
  @IsInt() @IsIn([1, 3, 6, 12]) durationMonths!: number;
  @Matches(datePattern) startDate!: string;
  @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER) agreedPriceMinor!: number;
  @IsOptional() @ValidateNested() @Type(() => InitialPaymentDto) initialPayment?: InitialPaymentDto;
}
export class RenewSubscriptionDto {
  @IsUUID() planId!: string;
  @IsInt() @IsIn([1, 3, 6, 12]) durationMonths!: number;
  @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER) agreedPriceMinor!: number;
  @IsOptional() @ValidateNested() @Type(() => InitialPaymentDto) initialPayment?: InitialPaymentDto;
}
export class UpdateSubscriptionDto {
  @IsOptional() @IsUUID() planId?: string;
  @IsOptional() @IsInt() @IsIn([1, 3, 6, 12]) durationMonths?: number;
  @IsOptional() @Matches(datePattern) startDate?: string;
  @IsOptional() @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER) agreedPriceMinor?: number;
}
export class VoidSubscriptionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 500)
  reason!: string;
}
export class SubscriptionQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
