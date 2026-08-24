import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthGuard } from '../auth/auth.guard';
import { SessionService } from '../auth/session.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentsModule } from '../payments/payments.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [DatabaseModule, AuditModule, PaymentsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, AuthGuard, SessionService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
