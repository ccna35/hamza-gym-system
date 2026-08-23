import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { loadEnvironment } from './load-environment';

loadEnvironment();

async function bootstrapOwner() {
  const username = process.env.OWNER_USERNAME?.trim();
  const temporaryPassword = process.env.OWNER_TEMP_PASSWORD;
  if (!username || !temporaryPassword) {
    throw new Error('OWNER_USERNAME and OWNER_TEMP_PASSWORD are required');
  }

  const prisma = new PrismaClient();
  try {
    const ownerCount = await prisma.owner.count();
    if (ownerCount > 0) {
      throw new Error('An owner already exists');
    }

    const passwordHash = await argon2.hash(temporaryPassword, { type: argon2.argon2id });
    await prisma.owner.create({
      data: {
        username,
        passwordHash,
        mustChangePassword: true,
      },
    });
    process.stdout.write('Owner bootstrapped successfully.\n');
  } finally {
    await prisma.$disconnect();
  }
}

void bootstrapOwner().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Owner bootstrap failed'}\n`);
  process.exitCode = 1;
});
