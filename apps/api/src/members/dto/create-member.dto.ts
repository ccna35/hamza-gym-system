import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MemberGender } from '@prisma/client';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class CreateMemberDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'يجب أن يكون اسم العضو نصًا' })
  @Length(2, 150, {
    message: 'يجب أن يكون اسم العضو بين حرفين و150 حرفًا',
  })
  name!: string;

  @IsString({ message: 'يجب أن يكون رقم الهاتف نصًا' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @MaxLength(20, {
    message: 'رقم الهاتف أطول من الحد المسموح',
  })
  phone!: string;

  @IsEnum(MemberGender, {
    message: 'يجب أن يكون النوع MALE أو FEMALE',
  })
  gender!: MemberGender;

  @Matches(DATE_ONLY_PATTERN, {
    message: 'يجب إرسال تاريخ الميلاد بصيغة YYYY-MM-DD',
  })
  @IsDateString({ strict: true }, { message: 'تاريخ الميلاد غير صالح' })
  dateOfBirth!: string;

  @IsOptional()
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 2,
    },
    { message: 'يجب أن يكون الطول رقمًا صالحًا' },
  )
  @Min(0.01, { message: 'يجب أن يكون الطول أكبر من صفر' })
  @Max(300, { message: 'لا يمكن أن يزيد الطول عن 300 سم' })
  heightCm?: number | null;

  @IsOptional()
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 2,
    },
    { message: 'يجب أن يكون الوزن رقمًا صالحًا' },
  )
  @Min(0.01, { message: 'يجب أن يكون الوزن أكبر من صفر' })
  @Max(500, { message: 'لا يمكن أن يزيد الوزن عن 500 كجم' })
  weightKg?: number | null;

  @Matches(DATE_ONLY_PATTERN, {
    message: 'يجب إرسال تاريخ الانضمام بصيغة YYYY-MM-DD',
  })
  @IsDateString({ strict: true }, { message: 'تاريخ الانضمام غير صالح' })
  joinDate!: string;
}
