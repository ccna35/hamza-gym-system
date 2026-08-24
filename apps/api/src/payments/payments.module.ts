import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthGuard } from '../auth/auth.guard';
import { SessionService } from '../auth/session.service';
import { DatabaseModule } from '../database/database.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, AuthGuard, SessionService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
