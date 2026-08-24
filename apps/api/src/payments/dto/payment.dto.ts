import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class CreatePaymentDto {
  @IsInt() @Min(1) @Max(Number.MAX_SAFE_INTEGER) amountMinor!: number;
  @Matches(datePattern) paymentDate!: string;
}

export class VoidPaymentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 500)
  reason!: string;
}

export class PaymentQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
