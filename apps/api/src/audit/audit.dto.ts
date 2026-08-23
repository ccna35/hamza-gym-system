import { AuditAction, AuditEntityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class AuditLogQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AuditEntityType)
  entityType?: AuditEntityType;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN)
  @IsDateString({ strict: true })
  to?: string;
}
