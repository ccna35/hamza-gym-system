import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, getCookie, RequestWithOwner } from './auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './auth.dto';
import { SessionService } from './session.service';

type ResponseWithCookie = {
  cookie: (name: string, value: string, options: object) => void;
  clearCookie: (name: string, options: object) => void;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() request: RequestWithOwner,
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: ResponseWithCookie,
  ) {
    const result = await this.auth.login(
      body.username.trim(),
      body.password,
      request.ip ?? 'unknown',
    );
    response.cookie(
      this.sessions.getCookieName(),
      result.session.token,
      this.sessions.cookieOptions(result.session.expiresAt),
    );
    return { owner: result.owner };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: RequestWithOwner,
    @Res({ passthrough: true }) response: ResponseWithCookie,
  ) {
    const token = getCookie(request, this.sessions.getCookieName());
    if (token) await this.sessions.revoke(token);
    response.clearCookie(this.sessions.getCookieName(), this.sessions.clearCookieOptions());
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() request: RequestWithOwner) {
    return { owner: request.owner };
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Req() request: RequestWithOwner, @Body() body: ChangePasswordDto) {
    if (body.newPassword.length < 10) {
      throw new BadRequestException({
        code: 'PASSWORD_TOO_WEAK',
        message: 'كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل',
      });
    }
    const token = getCookie(request, this.sessions.getCookieName());
    await this.auth.changePassword(
      request.owner!.id,
      body.currentPassword,
      body.newPassword,
      token!,
    );
  }
}
