import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuditLogQueryDto, PaginationQueryDto } from './audit.dto';
import { AuditService } from './audit.service';

@UseGuards(AuthGuard)
@Controller()
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('audit-logs')
  list(@Query() query: AuditLogQueryDto) {
    return this.audit.list(query);
  }

  @Get('members/:memberId/audit-log')
  listForMember(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.audit.listForMember(memberId, query);
  }
}
