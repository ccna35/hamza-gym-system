import { MemberGender } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateMemberDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 150)
  name?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsEnum(MemberGender) gender?: MemberGender;
  @IsOptional() @Matches(DATE_ONLY_PATTERN) @IsDateString({ strict: true }) dateOfBirth?: string;
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(300)
  heightCm?: number | null;
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(500)
  weightKg?: number | null;
  @IsOptional() @Matches(DATE_ONLY_PATTERN) @IsDateString({ strict: true }) joinDate?: string;
}
