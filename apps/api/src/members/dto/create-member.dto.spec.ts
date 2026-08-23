import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { CreateMemberDto } from './create-member.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: CreateMemberDto,
};

function createPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

const validPayload = {
  name: 'أحمد محمد',
  phone: '01012345678',
  gender: 'MALE',
  dateOfBirth: '1995-06-12',
  heightCm: 178,
  weightKg: 82.5,
  joinDate: '2026-08-20',
};

describe('CreateMemberDto', () => {
  it('accepts a valid member payload and trims the name', async () => {
    const result = await createPipe().transform(
      {
        ...validPayload,
        name: '  أحمد محمد  ',
      },
      metadata,
    );

    expect(result).toBeInstanceOf(CreateMemberDto);
    expect(result.name).toBe('أحمد محمد');
  });

  it('accepts nullable optional measurements', async () => {
    const result = await createPipe().transform(
      {
        ...validPayload,
        heightCm: null,
        weightKg: null,
      },
      metadata,
    );

    expect(result.heightCm).toBeNull();
    expect(result.weightKg).toBeNull();
  });

  it.each([
    ['short name', { name: 'أ' }],
    ['invalid gender', { gender: 'OTHER' }],
    ['invalid birth date', { dateOfBirth: '1995-02-30' }],
    ['date-time instead of date', { joinDate: '2026-08-20T10:00:00Z' }],
    ['zero height', { heightCm: 0 }],
    ['excessive height', { heightCm: 301 }],
    ['zero weight', { weightKg: 0 }],
    ['excessive weight', { weightKg: 501 }],
    ['string height', { heightCm: '178' }],
  ])('rejects %s', async (_, invalidValues) => {
    await expect(
      createPipe().transform(
        {
          ...validPayload,
          ...invalidValues,
        },
        metadata,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown properties', async () => {
    await expect(
      createPipe().transform(
        {
          ...validPayload,
          isArchived: true,
        },
        metadata,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
