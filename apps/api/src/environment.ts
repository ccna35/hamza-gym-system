export function validateEnvironment(environment: Record<string, unknown>) {
  const port = Number(environment.API_PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535');
  }

  if (typeof environment.DATABASE_URL !== 'string' || environment.DATABASE_URL.length === 0) {
    throw new Error('DATABASE_URL is required');
  }

  const applicationOrigin = environment.APP_ORIGIN ?? 'http://localhost:5173';
  try {
    new URL(String(applicationOrigin));
  } catch {
    throw new Error('APP_ORIGIN must be a valid URL');
  }

  return {
    ...environment,
    API_PORT: port,
    APP_ORIGIN: String(applicationOrigin),
    SESSION_COOKIE_NAME: String(environment.SESSION_COOKIE_NAME ?? 'gym_session'),
    SESSION_TTL_HOURS: 8,
    MEMBER_PHOTO_DIR: String(environment.MEMBER_PHOTO_DIR ?? 'storage/member-photos'),
  };
}
