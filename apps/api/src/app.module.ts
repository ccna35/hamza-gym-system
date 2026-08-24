import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { validateEnvironment } from './environment';
import { PasswordService } from './auth/password.service';
import { SessionService } from './auth/session.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { LoginRateLimiterService } from './auth/login-rate-limiter.service';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CsrfMiddleware } from './auth/csrf.middleware';
import { resolve } from 'node:path';
import { MembersModule } from './members/members.module';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './audit/audit.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '../.env'),
      validate: validateEnvironment,
    }),
    MembersModule,
    DatabaseModule,
    AuditModule,
    PlansModule,
    SubscriptionsModule,
    PaymentsModule,
    DashboardModule,
  ],
  controllers: [HealthController, AuthController],
  providers: [PasswordService, SessionService, AuthGuard, AuthService, LoginRateLimiterService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
