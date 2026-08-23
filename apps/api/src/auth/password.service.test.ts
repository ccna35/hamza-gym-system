import { describe, expect, it } from 'vitest';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password with Argon2id', async () => {
    const passwordHash = await service.hash('temporary-password-123');

    await expect(service.verify(passwordHash, 'temporary-password-123')).resolves.toBe(true);
    expect(passwordHash).toContain('$argon2id$');
  });

  it('rejects a different password', async () => {
    const passwordHash = await service.hash('temporary-password-123');

    await expect(service.verify(passwordHash, 'wrong-password')).resolves.toBe(false);
  });
});
