import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SessionService } from '../auth/session.service';
import { DatabaseModule } from '../database/database.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService, AuthGuard, SessionService],
})
export class DashboardModule {}
