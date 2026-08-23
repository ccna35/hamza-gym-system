import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';

type RequestWithOwner = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  owner?: { id: string; username: string; mustChangePassword: boolean };
  cookies?: Record<string, string>;
};

export function getCookie(request: RequestWithOwner, name: string) {
  const cookieHeader = request.headers.cookie;
  const headerValue = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  return (
    request.cookies?.[name] ??
    headerValue
      ?.split(';')
      .map((part: string) => part.trim())
      .find((part: string) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1)
  );
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithOwner>();
    const token = getCookie(request, this.sessions.getCookieName());
    if (!token) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'يجب تسجيل الدخول' });
    }

    const session = await this.sessions.findActive(token);
    if (!session) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'الجلسة غير صالحة أو منتهية',
      });
    }

    request.owner = {
      id: session.owner.id,
      username: session.owner.username,
      mustChangePassword: session.owner.mustChangePassword,
    };
    return true;
  }
}

export { RequestWithOwner };
