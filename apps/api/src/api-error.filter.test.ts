import { describe, expect, it, vi } from 'vitest';
import { ApiErrorFilter } from './api-error.filter';

function host(response: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }) {
  return { switchToHttp: () => ({ getResponse: () => response }) } as never;
}

describe('ApiErrorFilter', () => {
  it('redacts internal exceptions and keeps the stable error shape', () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    new ApiErrorFilter().catch(new Error('secret connection string'), host(response));
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'حدث خطأ داخلي',
      details: null,
    });
  });
});
