import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { DatabaseModule } from 'src/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthGuard } from '../auth/auth.guard';
import { SessionService } from '../auth/session.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [MembersController],
  providers: [MembersService, AuthGuard, SessionService],
})
export class MembersModule {}
