import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CreatePlanDto, UpdatePlanDto } from './plan.dto';

const prices = [
  { durationMonths: 1, priceMinor: 30000 },
  { durationMonths: 3, priceMinor: 80000 },
  { durationMonths: 6, priceMinor: 150000 },
  { durationMonths: 12, priceMinor: 280000 },
];
const pipe = () =>
  new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const metadata = (metatype: typeof CreatePlanDto | typeof UpdatePlanDto): ArgumentMetadata => ({
  type: 'body',
  metatype,
});

describe('plan DTOs', () => {
  it('accepts and trims a complete plan', async () => {
    const result = await pipe().transform({ name: '  العادي  ', prices }, metadata(CreatePlanDto));
    expect(result.name).toBe('العادي');
    expect(result.prices).toHaveLength(4);
  });

  it.each([
    { name: 'x', prices },
    { name: 'العادي', prices: prices.slice(0, 3) },
    { name: 'العادي', prices: [...prices.slice(0, 3), { durationMonths: 2, priceMinor: 10 }] },
    { name: 'العادي', prices: [...prices.slice(0, 3), { durationMonths: 12, priceMinor: -1 }] },
    { name: 'العادي', prices: [...prices, { durationMonths: 1, priceMinor: 0 }] },
  ])('rejects invalid plan payloads', async (payload) => {
    await expect(pipe().transform(payload, metadata(CreatePlanDto))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('accepts an empty partial update and rejects unknown nested fields', async () => {
    await expect(pipe().transform({}, metadata(UpdatePlanDto))).resolves.toBeInstanceOf(
      UpdatePlanDto,
    );
    await expect(
      pipe().transform(
        { prices: prices.map((price, index) => (index ? price : { ...price, extra: true })) },
        metadata(UpdatePlanDto),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
