import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, Prisma, Subscription } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { dateOnly, parseDateOnly } from '../members/member.utils';
import { PaymentsService } from '../payments/payments.service';
import {
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  SubscriptionQueryDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import { nextDate, subscriptionEndDate } from './subscription.utils';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly payments: PaymentsService,
  ) {}

  async list(memberId: string, query: SubscriptionQueryDto) {
    await this.requireMember(memberId);
    const where = { memberId };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return {
      items: items.map((item) => this.response(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  create(memberId: string, input: CreateSubscriptionDto, actorOwnerId: string, requestId?: string) {
    return this.createAt(memberId, input, actorOwnerId, requestId);
  }

  async renew(
    memberId: string,
    input: RenewSubscriptionDto,
    actorOwnerId: string,
    requestId?: string,
  ) {
    await this.requireMember(memberId);
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));
    const latest = await this.prisma.subscription.findFirst({
      where: { memberId, voidedAt: null, endDate: { gte: today } },
      orderBy: { endDate: 'desc' },
    });
    if (!latest)
      throw new ConflictException({
        code: 'NO_RENEWABLE_SUBSCRIPTION',
        message: 'لا يوجد اشتراك حالي أو مجدول قابل للتجديد',
      });
    return this.createAt(
      memberId,
      { ...input, startDate: nextDate(latest.endDate) },
      actorOwnerId,
      requestId,
    );
  }

  async get(subscriptionId: string) {
    return this.response(await this.requireSubscription(subscriptionId));
  }

  async update(
    subscriptionId: string,
    input: UpdateSubscriptionDto,
    actorOwnerId: string,
    requestId?: string,
  ) {
    const before = await this.requireSubscription(subscriptionId);
    if (before.voidedAt)
      throw new ConflictException({
        code: 'SUBSCRIPTION_ALREADY_VOIDED',
        message: 'الاشتراك ملغي بالفعل',
      });
    if (Object.keys(input).length === 0) return this.response(before);
    if (await this.hasInitialPayment(subscriptionId))
      throw new ConflictException({
        code: 'SUBSCRIPTION_HAS_PAYMENTS',
        message: 'لا يمكن تعديل بيانات الاشتراك المالية بعد تسجيل دفعة عليه',
      });
    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, before.memberId);
      const planId = input.planId ?? before.planId;
      const durationMonths = input.durationMonths ?? before.durationMonths;
      const startDate = input.startDate ?? dateOnly(before.startDate);
      const planChanged = input.planId !== undefined || input.durationMonths !== undefined;
      const plan = planChanged ? await this.enabledPlan(tx, planId, durationMonths) : null;
      const endDate = subscriptionEndDate(startDate, durationMonths);
      await this.assertNoOverlap(tx, before.memberId, startDate, endDate, subscriptionId);
      const nextPrice = input.agreedPriceMinor ?? Number(before.agreedPriceMinor);
      if (
        (await this.payments.balance(tx, before.memberId)) -
          Number(before.agreedPriceMinor) +
          nextPrice <
        0
      )
        throw new ConflictException({
          code: 'SUBSCRIPTION_EDIT_CREATES_CREDIT',
          message: 'التعديل سيجعل رصيد العضو دائناً',
        });
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId,
          durationMonths,
          startDate: parseDateOnly(startDate),
          endDate: parseDateOnly(endDate),
          agreedPriceMinor:
            input.agreedPriceMinor === undefined
              ? before.agreedPriceMinor
              : BigInt(input.agreedPriceMinor),
          ...(plan ? { planNameSnapshot: plan.name, listedPriceMinor: plan.listedPriceMinor } : {}),
        },
      });
      await this.audit.append(
        {
          actorOwnerId,
          entityType: AuditEntityType.SUBSCRIPTION,
          entityId: subscriptionId,
          action: AuditAction.SUBSCRIPTION_UPDATED,
          before: this.snapshot(before),
          after: this.snapshot(updated),
          ...(requestId ? { requestId } : {}),
        },
        tx,
      );
      return this.response(updated);
    });
  }

  async void(subscriptionId: string, reason: string, actorOwnerId: string, requestId?: string) {
    const before = await this.requireSubscription(subscriptionId);
    if (before.voidedAt)
      throw new ConflictException({
        code: 'SUBSCRIPTION_ALREADY_VOIDED',
        message: 'الاشتراك ملغي بالفعل',
      });
    if (await this.hasInitialPayment(subscriptionId))
      throw new ConflictException({
        code: 'SUBSCRIPTION_HAS_PAYMENTS',
        message: 'لا يمكن إلغاء اشتراك تم تسجيل دفعة عليه',
      });
    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, before.memberId);
      if ((await this.payments.balance(tx, before.memberId)) - Number(before.agreedPriceMinor) < 0)
        throw new ConflictException({
          code: 'SUBSCRIPTION_HAS_PAYMENTS',
          message: 'لا يمكن إلغاء الاشتراك لأن ذلك سيجعل رصيد العضو دائناً',
        });
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: { voidedAt: new Date(), voidReason: reason },
      });
      await this.audit.append(
        {
          actorOwnerId,
          entityType: AuditEntityType.SUBSCRIPTION,
          entityId: subscriptionId,
          action: AuditAction.SUBSCRIPTION_VOIDED,
          before: this.snapshot(before),
          after: this.snapshot(updated),
          metadata: { reason },
          ...(requestId ? { requestId } : {}),
        },
        tx,
      );
      return this.response(updated);
    });
  }

  private async createAt(
    memberId: string,
    input: CreateSubscriptionDto,
    actorOwnerId: string,
    requestId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, memberId);
      const plan = await this.enabledPlan(tx, input.planId, input.durationMonths);
      const endDate = subscriptionEndDate(input.startDate, input.durationMonths);
      await this.assertNoOverlap(tx, memberId, input.startDate, endDate);
      const created = await tx.subscription.create({
        data: {
          memberId,
          planId: input.planId,
          planNameSnapshot: plan.name,
          durationMonths: input.durationMonths,
          listedPriceMinor: plan.listedPriceMinor,
          agreedPriceMinor: BigInt(input.agreedPriceMinor),
          startDate: parseDateOnly(input.startDate),
          endDate: parseDateOnly(endDate),
        },
      });
      await this.audit.append(
        {
          actorOwnerId,
          entityType: AuditEntityType.SUBSCRIPTION,
          entityId: created.id,
          action: AuditAction.SUBSCRIPTION_CREATED,
          after: this.snapshot(created),
          ...(requestId ? { requestId } : {}),
        },
        tx,
      );
      const initialPayment = input.initialPayment
        ? await this.payments.createInTransaction(
            tx,
            memberId,
            input.initialPayment,
            actorOwnerId,
            requestId,
            created.id,
          )
        : null;
      return {
        subscription: this.response(created),
        initialPayment,
        outstandingBalanceMinor: await this.payments.balance(tx, memberId),
      };
    });
  }

  private async lockMember(tx: Prisma.TransactionClient, memberId: string) {
    const rows = await tx.$queryRaw<
      Array<{ id: string }>
    >`SELECT id FROM "Member" WHERE id = ${memberId}::uuid FOR UPDATE`;
    if (!rows.length)
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
  }
  private async enabledPlan(tx: Prisma.TransactionClient, planId: string, durationMonths: number) {
    const plan = await tx.plan.findUnique({
      where: { id: planId },
      include: { prices: { where: { durationMonths } } },
    });
    if (!plan) throw new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'الخطة غير موجودة' });
    if (!plan.isEnabled)
      throw new ConflictException({ code: 'PLAN_DISABLED', message: 'الخطة معطلة' });
    if (!plan.prices[0])
      throw new NotFoundException({
        code: 'PLAN_PRICE_NOT_FOUND',
        message: 'سعر مدة الخطة غير موجود',
      });
    return { name: plan.name, listedPriceMinor: plan.prices[0].priceMinor };
  }
  private async assertNoOverlap(
    tx: Prisma.TransactionClient,
    memberId: string,
    start: string,
    end: string,
    excludeId?: string,
  ) {
    const overlap = await tx.subscription.findFirst({
      where: {
        memberId,
        voidedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startDate: { lte: parseDateOnly(end) },
        endDate: { gte: parseDateOnly(start) },
      },
    });
    if (overlap)
      throw new ConflictException({
        code: 'SUBSCRIPTION_OVERLAP',
        message: 'تتداخل المدة مع اشتراك آخر للعضو',
      });
  }
  private async requireMember(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member)
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
    return member;
  }
  private async requireSubscription(id: string) {
    const item = await this.prisma.subscription.findUnique({ where: { id } });
    if (!item)
      throw new NotFoundException({
        code: 'SUBSCRIPTION_NOT_FOUND',
        message: 'الاشتراك غير موجود',
      });
    return item;
  }
  private async hasInitialPayment(subscriptionId: string) {
    return Boolean(
      await this.prisma.auditLog.findFirst({
        where: {
          action: AuditAction.PAYMENT_CREATED,
          metadataJson: { path: ['subscriptionId'], equals: subscriptionId },
        },
      }),
    );
  }
  private state(item: Subscription) {
    if (item.voidedAt) return 'VOIDED';
    const today = new Date().toISOString().slice(0, 10);
    if (dateOnly(item.startDate) > today) return 'SCHEDULED';
    if (dateOnly(item.endDate) < today) return 'EXPIRED';
    return 'ACTIVE';
  }
  response(item: Subscription) {
    return {
      id: item.id,
      memberId: item.memberId,
      planId: item.planId,
      planNameSnapshot: item.planNameSnapshot,
      durationMonths: item.durationMonths,
      listedPriceMinor: Number(item.listedPriceMinor),
      agreedPriceMinor: Number(item.agreedPriceMinor),
      startDate: dateOnly(item.startDate),
      endDate: dateOnly(item.endDate),
      state: this.state(item),
      voidedAt: item.voidedAt?.toISOString() ?? null,
      voidReason: item.voidReason,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
  private snapshot(item: Subscription): Prisma.InputJsonObject {
    return this.response(item);
  }
}
