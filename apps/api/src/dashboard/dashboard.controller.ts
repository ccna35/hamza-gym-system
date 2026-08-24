import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { DashboardQueryDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get('summary') summary() {
    return this.dashboard.summary();
  }
  @Get('debtors') debtors(@Query() query: DashboardQueryDto) {
    return this.dashboard.debtors(query);
  }
  @Get('expiring') expiring(@Query() query: DashboardQueryDto) {
    return this.dashboard.expiring(query);
  }
}
