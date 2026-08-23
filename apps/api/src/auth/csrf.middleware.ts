import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly applicationOrigin: string;

  constructor(config: ConfigService) {
    this.applicationOrigin = config
      .get<string>('APP_ORIGIN', 'http://localhost:5173')
      .replace(/\/$/, '');
  }

  use(request: Request, _response: Response, next: NextFunction) {
    if (SAFE_METHODS.has(request.method)) {
      next();
      return;
    }

    const origin = request.get('origin');
    const referer = request.get('referer');
    let source = origin;
    if (!source && referer) {
      try {
        source = new URL(referer).origin;
      } catch {
        source = undefined;
      }
    }
    if (source !== this.applicationOrigin) {
      throw new HttpException(
        { code: 'CSRF_ORIGIN_INVALID', message: 'مصدر الطلب غير مسموح' },
        HttpStatus.FORBIDDEN,
      );
    }

    next();
  }
}
