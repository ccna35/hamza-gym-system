import { describe, expect, it, vi } from 'vitest';
import { getHealth, uploadMemberPhoto } from './client';

describe('API client', () => {
  it('returns health data for a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', database: 'ok' }) }),
    );
    await expect(getHealth()).resolves.toEqual({ status: 'ok', database: 'ok' });
  });

  it('throws an Arabic error for a failed response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    await expect(getHealth()).rejects.toThrow('تعذر الاتصال بالخادم');
  });

  it('uploads member photos as multipart data without a JSON content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photoUrl: '/api/v1/members/member-id/photo' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await uploadMemberPhoto('member-id', new Blob(['image'], { type: 'image/webp' }));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/members/member-id/photo'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.any(FormData),
      }),
    );
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty('headers');
  });
});
