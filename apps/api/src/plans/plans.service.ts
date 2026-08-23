import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { CreatePlanDto, PlanPriceDto, PlanQueryDto, UpdatePlanDto } from './dto/plan.dto';

type PlanWithPrices = Prisma.PlanGetPayload<{ include: { prices: true } }>;

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: PlanQueryDto) {
    const where: Prisma.PlanWhereInput = {};
    if (query.enabled !== undefined) where.isEnabled = query.enabled;
    const [plans, totalItems] = await this.prisma.$transaction([
      this.prisma.plan.findMany({
        where,
        include: { prices: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.plan.count({ where }),
    ]);
    return {
      items: plans.map((plan) => this.response(plan)),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  async create(input: CreatePlanDto, actorOwnerId: string, requestId?: string) {
    this.validatePrices(input.prices);
    try {
      const plan = await this.prisma.$transaction(async (tx) => {
        const created = await tx.plan.create({
          data: { name: input.name, prices: { create: this.priceData(input.prices) } },
          include: { prices: true },
        });
        await this.audit.append(
          {
            actorOwnerId,
            entityType: AuditEntityType.PLAN,
            entityId: created.id,
            action: AuditAction.PLAN_CREATED,
            after: this.snapshot(created),
            ...this.requestIdData(requestId),
          },
          tx,
        );
        return created;
      });
      return this.response(plan);
    } catch (error) {
      this.rethrowUniqueName(error);
    }
  }

  async get(planId: string) {
    return this.response(await this.requirePlan(planId));
  }

  async update(planId: string, input: UpdatePlanDto, actorOwnerId: string, requestId?: string) {
    const before = await this.requirePlan(planId);
    if (input.prices) this.validatePrices(input.prices);
    if (input.name === undefined && input.prices === undefined) return this.response(before);
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (input.prices) {
          await tx.planPrice.deleteMany({ where: { planId } });
          await tx.planPrice.createMany({
            data: this.priceData(input.prices).map((price) => ({ ...price, planId })),
          });
        }
        const result = await tx.plan.update({
          where: { id: planId },
          data: input.name !== undefined ? { name: input.name } : {},
          include: { prices: true },
        });
        await this.audit.append(
          {
            actorOwnerId,
            entityType: AuditEntityType.PLAN,
            entityId: planId,
            action: AuditAction.PLAN_UPDATED,
            before: this.snapshot(before),
            after: this.snapshot(result),
            ...this.requestIdData(requestId),
          },
          tx,
        );
        return result;
      });
      return this.response(updated);
    } catch (error) {
      this.rethrowUniqueName(error);
    }
  }

  enable(planId: string, actorOwnerId: string, requestId?: string) {
    return this.setEnabled(planId, true, actorOwnerId, requestId);
  }
  disable(planId: string, actorOwnerId: string, requestId?: string) {
    return this.setEnabled(planId, false, actorOwnerId, requestId);
  }

  private async setEnabled(
    planId: string,
    enabled: boolean,
    actorOwnerId: string,
    requestId?: string,
  ) {
    const before = await this.requirePlan(planId);
    if (before.isEnabled === enabled)
      throw new ConflictException({
        code: enabled ? 'PLAN_ALREADY_ENABLED' : 'PLAN_ALREADY_DISABLED',
        message: enabled ? 'الخطة مفعلة بالفعل' : 'الخطة معطلة بالفعل',
      });
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.plan.update({
        where: { id: planId },
        data: { isEnabled: enabled },
        include: { prices: true },
      });
      await this.audit.append(
        {
          actorOwnerId,
          entityType: AuditEntityType.PLAN,
          entityId: planId,
          action: enabled ? AuditAction.PLAN_ENABLED : AuditAction.PLAN_DISABLED,
          before: this.snapshot(before),
          after: this.snapshot(result),
          ...this.requestIdData(requestId),
        },
        tx,
      );
      return result;
    });
    return this.response(updated);
  }

  private async requirePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id }, include: { prices: true } });
    if (!plan) throw new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'الخطة غير موجودة' });
    return plan;
  }

  private validatePrices(prices: PlanPriceDto[]) {
    const durations = [...prices.map((price) => price.durationMonths)].sort((a, b) => a - b);
    if (durations.join(',') !== '1,3,6,12')
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'يجب تحديد أسعار المدد 1 و3 و6 و12 شهراً مرة واحدة لكل مدة',
      });
  }

  private priceData(prices: PlanPriceDto[]) {
    return prices.map((price) => ({
      durationMonths: price.durationMonths,
      priceMinor: BigInt(price.priceMinor),
    }));
  }
  private sortedPrices(plan: PlanWithPrices) {
    return [...plan.prices]
      .sort((a, b) => a.durationMonths - b.durationMonths)
      .map((price) => ({
        durationMonths: price.durationMonths,
        priceMinor: Number(price.priceMinor),
      }));
  }
  private response(plan: PlanWithPrices) {
    return {
      id: plan.id,
      name: plan.name,
      isEnabled: plan.isEnabled,
      prices: this.sortedPrices(plan),
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }
  private snapshot(plan: PlanWithPrices): Prisma.InputJsonObject {
    return { name: plan.name, isEnabled: plan.isEnabled, prices: this.sortedPrices(plan) };
  }
  private requestIdData(requestId?: string) {
    return requestId ? { requestId } : {};
  }
  private rethrowUniqueName(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException({
        code: 'PLAN_NAME_ALREADY_EXISTS',
        message: 'يوجد خطة أخرى بالاسم نفسه',
      });
    throw error;
  }
}
