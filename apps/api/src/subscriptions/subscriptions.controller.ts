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
import {
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  SubscriptionQueryDto,
  UpdateSubscriptionDto,
  VoidSubscriptionDto,
} from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@UseGuards(AuthGuard)
@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}
  @Get('members/:memberId/subscriptions') list(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Query() query: SubscriptionQueryDto,
  ) {
    return this.subscriptions.list(memberId, query);
  }
  @Post('members/:memberId/subscriptions') create(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() body: CreateSubscriptionDto,
    @Req() req: RequestWithOwner,
  ) {
    return this.subscriptions.create(memberId, body, req.owner!.id, this.requestId(req));
  }
  @Post('members/:memberId/subscriptions/renew') renew(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() body: RenewSubscriptionDto,
    @Req() req: RequestWithOwner,
  ) {
    return this.subscriptions.renew(memberId, body, req.owner!.id, this.requestId(req));
  }
  @Get('subscriptions/:subscriptionId') get(
    @Param('subscriptionId', new ParseUUIDPipe()) id: string,
  ) {
    return this.subscriptions.get(id);
  }
  @Patch('subscriptions/:subscriptionId') update(
    @Param('subscriptionId', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateSubscriptionDto,
    @Req() req: RequestWithOwner,
  ) {
    return this.subscriptions.update(id, body, req.owner!.id, this.requestId(req));
  }
  @Post('subscriptions/:subscriptionId/void') @HttpCode(HttpStatus.OK) void(
    @Param('subscriptionId', new ParseUUIDPipe()) id: string,
    @Body() body: VoidSubscriptionDto,
    @Req() req: RequestWithOwner,
  ) {
    return this.subscriptions.void(id, body.reason, req.owner!.id, this.requestId(req));
  }
  private requestId(req: RequestWithOwner) {
    const value = req.headers['x-request-id'];
    return Array.isArray(value) ? value[0] : value;
  }
}
