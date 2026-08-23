import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SessionService } from '../auth/session.service';
import { DatabaseModule } from '../database/database.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
  providers: [AuditService, AuthGuard, SessionService],
  exports: [AuditService],
})
export class AuditModule {}
