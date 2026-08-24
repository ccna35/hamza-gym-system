import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, RequestWithOwner } from '../auth/auth.guard';
import { CreatePaymentDto, PaymentQueryDto, VoidPaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@UseGuards(AuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Get('members/:memberId/payments') list(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.payments.list(memberId, query);
  }
  @Post('members/:memberId/payments') create(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() body: CreatePaymentDto,
    @Req() req: RequestWithOwner,
  ) {
    return this.payments.create(memberId, body, req.owner!.id, this.requestId(req));
  }
  @Get('payments/:paymentId') get(@Param('paymentId', new ParseUUIDPipe()) id: string) {
    return this.payments.get(id);
  }
  @Post('payments/:paymentId/void') @HttpCode(HttpStatus.OK) void(
    @Param('paymentId', new ParseUUIDPipe()) id: string,
    @Body() body: VoidPaymentDto,
    @Req() req: RequestWithOwner,
  ) {
    return this.payments.void(id, body.reason, req.owner!.id, this.requestId(req));
  }
  private requestId(req: RequestWithOwner) {
    const value = req.headers['x-request-id'];
    return Array.isArray(value) ? value[0] : value;
  }
}
