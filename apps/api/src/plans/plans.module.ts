import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthGuard } from '../auth/auth.guard';
import { SessionService } from '../auth/session.service';
import { DatabaseModule } from '../database/database.module';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [PlansController],
  providers: [PlansService, AuthGuard, SessionService],
  exports: [PlansService],
})
export class PlansModule {}
