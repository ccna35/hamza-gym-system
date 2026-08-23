import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';
import { validateEnvironment } from './environment';

describe('foundation configuration', () => {
  it('requires a database URL', () => {
    expect(() => validateEnvironment({})).toThrow('DATABASE_URL is required');
  });

  it('accepts valid local configuration', () => {
    expect(
      validateEnvironment({ DATABASE_URL: 'postgresql://localhost/gym', API_PORT: '3000' })
        .API_PORT,
    ).toBe(3000);
  });
});

describe('health controller', () => {
  it('reports database availability', async () => {
    const controller = new HealthController({ $queryRaw: async () => 1 } as never);
    await expect(controller.getHealth()).resolves.toEqual({ status: 'ok', database: 'ok' });
  });

  it('reports degraded state without exposing database errors', async () => {
    const controller = new HealthController({
      $queryRaw: async () => {
        throw new Error('secret connection details');
      },
    } as never);
    await expect(controller.getHealth()).resolves.toEqual({
      status: 'degraded',
      database: 'unavailable',
    });
  });
});
