import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, RequestWithOwner } from '../auth/auth.guard';
import { CreatePlanDto, PlanQueryDto, UpdatePlanDto } from './dto/plan.dto';
import { PlansService } from './plans.service';

@UseGuards(AuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}
  @Get() list(@Query() query: PlanQueryDto) {
    return this.plans.list(query);
  }
  @Post() create(@Body() body: CreatePlanDto, @Req() request: RequestWithOwner) {
    return this.plans.create(body, request.owner!.id, this.requestId(request));
  }
  @Get(':planId') get(@Param('planId', new ParseUUIDPipe()) planId: string) {
    return this.plans.get(planId);
  }
  @Patch(':planId') update(
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Body() body: UpdatePlanDto,
    @Req() request: RequestWithOwner,
  ) {
    return this.plans.update(planId, body, request.owner!.id, this.requestId(request));
  }
  @Post(':planId/enable') @HttpCode(HttpStatus.OK) enable(
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Req() request: RequestWithOwner,
  ) {
    return this.plans.enable(planId, request.owner!.id, this.requestId(request));
  }
  @Post(':planId/disable') @HttpCode(HttpStatus.OK) disable(
    @Param('planId', new ParseUUIDPipe()) planId: string,
    @Req() request: RequestWithOwner,
  ) {
    return this.plans.disable(planId, request.owner!.id, this.requestId(request));
  }
  private requestId(request: RequestWithOwner) {
    const value = request.headers['x-request-id'];
    return Array.isArray(value) ? value[0] : value;
  }
}
